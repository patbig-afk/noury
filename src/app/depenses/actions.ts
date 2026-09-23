"use server";

import { del } from "@vercel/blob";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { expenseData } from "@/lib/expenses";
import { BLOB_FOLDER } from "@/lib/files";
import { prisma } from "@/lib/prisma";
import { parseAmountToCents } from "@/lib/split";
import { NEW_CATEGORY } from "./constants";

export type ExpenseFormState = {
  error?: string;
  fieldErrors?: Partial<Record<string, string>>;
  /** Incrémenté à chaque enregistrement réussi : sert à vider le formulaire. */
  savedCount: number;
  lastSaved?: string;
};

const optionalText = z
  .string()
  .trim()
  .max(300)
  .optional()
  .transform((v) => v || null);

// Un fichier n'est accepté que s'il a été déposé dans notre dossier du store Blob.
const blobPath = optionalText.refine((v) => v === null || v.startsWith(`${BLOB_FOLDER}/`), "Fichier invalide");

const schema = z
  .object({
    date: z.iso.date({ error: "Date requise" }),
    categoryId: z.string().min(1, "Catégorie requise"),
    newCategory: optionalText,
    description: z.string().trim().min(1, "Description requise").max(500),
    supplier: z.string().trim().min(1, "Fournisseur requis").max(200),
    amount: z
      .string()
      .transform((v) => parseAmountToCents(v))
      .refine((v): v is number => v !== null && v > 0, "Montant invalide (ex : 1250,50)"),
    paidBy: z.enum(["PATRICK", "CHARLOTTE", "BOTH"], { error: "Qui a payé ?" }),
    kind: z.enum(["SHARED", "CURRENT"], { error: "Nature de la dépense ?" }),
    invoicePath: blobPath,
    invoiceName: optionalText,
    proofPath: blobPath,
    proofName: optionalText,
  })
  .refine((d) => d.categoryId !== NEW_CATEGORY || d.newCategory, {
    path: ["newCategory"],
    message: "Nom de la nouvelle catégorie requis",
  });

type ParsedExpense = z.infer<typeof schema>;

function parseForm(prev: ExpenseFormState, formData: FormData): { data: ParsedExpense } | { state: ExpenseFormState } {
  const parsed = schema.safeParse(Object.fromEntries(formData));
  if (parsed.success) return { data: parsed.data };
  const fieldErrors: Record<string, string> = {};
  for (const issue of parsed.error.issues) fieldErrors[String(issue.path[0])] ??= issue.message;
  return { state: { ...prev, error: "Certains champs sont à corriger.", fieldErrors } };
}

async function resolveCategory(d: ParsedExpense) {
  if (d.categoryId !== NEW_CATEGORY) return d.categoryId;
  const category = await prisma.category.upsert({
    where: { name: d.newCategory! },
    create: { name: d.newCategory! },
    update: {},
  });
  return category.id;
}

const baseInput = async (d: ParsedExpense) => ({
  date: d.date,
  categoryId: await resolveCategory(d),
  description: d.description,
  supplier: d.supplier,
  amountCents: d.amount,
  paidBy: d.paidBy,
  kind: d.kind,
});

const isBlobPath = (p: string | null | undefined): p is string => !!p?.startsWith(`${BLOB_FOLDER}/`);

export async function createExpense(prev: ExpenseFormState, formData: FormData): Promise<ExpenseFormState> {
  const parsed = parseForm(prev, formData);
  if ("state" in parsed) return parsed.state;
  const d = parsed.data;

  await prisma.expense.create({
    data: expenseData({
      ...(await baseInput(d)),
      invoicePath: d.invoicePath,
      invoiceName: d.invoiceName,
      proofPath: d.proofPath,
      proofName: d.proofName,
    }),
  });

  revalidatePath("/", "layout");
  return { savedCount: prev.savedCount + 1, lastSaved: `${d.description} — ${d.supplier}` };
}

// Modifie une dépense. Un fichier n'est remplacé que si un nouveau a été envoyé ;
// l'ancien fichier Blob est alors supprimé.
export async function updateExpense(prev: ExpenseFormState, formData: FormData): Promise<ExpenseFormState> {
  const id = String(formData.get("id") ?? "");
  const existing = id ? await prisma.expense.findUnique({ where: { id } }) : null;
  if (!existing) return { ...prev, error: "Dépense introuvable (supprimée entre-temps ?)" };

  const parsed = parseForm(prev, formData);
  if ("state" in parsed) return parsed.state;
  const d = parsed.data;

  const files = {
    ...(d.invoicePath && { invoicePath: d.invoicePath, invoiceName: d.invoiceName }),
    ...(d.proofPath && { proofPath: d.proofPath, proofName: d.proofName }),
  };
  const data = expenseData({
    ...(await baseInput(d)),
    invoicePath: existing.invoicePath,
    invoiceName: existing.invoiceName,
    proofPath: existing.proofPath,
    proofName: existing.proofName,
    ...files,
  });
  await prisma.expense.update({ where: { id }, data });

  const replaced = [d.invoicePath && existing.invoicePath, d.proofPath && existing.proofPath].filter(isBlobPath);
  if (replaced.length) await del(replaced).catch((error) => console.error("Anciens fichiers Blob non supprimés", replaced, error));

  revalidatePath("/", "layout");
  redirect("/depenses");
}

// Supprime une dépense puis ses fichiers du store Blob (les liens Drive importés sont ignorés).
export async function deleteExpense(id: string): Promise<{ error?: string }> {
  const expense = await prisma.expense.delete({ where: { id } }).catch(() => null);
  if (!expense) return { error: "Dépense introuvable (déjà supprimée ?)" };

  const paths = [expense.invoicePath, expense.proofPath, expense.proof2Path].filter(isBlobPath);
  if (paths.length) await del(paths).catch((error) => console.error("Fichiers Blob non supprimés", paths, error));

  revalidatePath("/", "layout");
  return {};
}

"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAuth } from "@/lib/auth";
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
    invoicePath: blobPath,
    invoiceName: optionalText,
    proofPath: blobPath,
    proofName: optionalText,
  })
  .refine((d) => d.categoryId !== NEW_CATEGORY || d.newCategory, {
    path: ["newCategory"],
    message: "Nom de la nouvelle catégorie requis",
  });

export async function createExpense(prev: ExpenseFormState, formData: FormData): Promise<ExpenseFormState> {
  await requireAuth();

  const parsed = schema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) fieldErrors[String(issue.path[0])] ??= issue.message;
    return { ...prev, error: "Certains champs sont à corriger.", fieldErrors };
  }
  const d = parsed.data;

  const categoryId =
    d.categoryId === NEW_CATEGORY
      ? (
          await prisma.category.upsert({
            where: { name: d.newCategory! },
            create: { name: d.newCategory! },
            update: {},
          })
        ).id
      : d.categoryId;

  await prisma.expense.create({
    data: expenseData({
      date: d.date,
      categoryId,
      description: d.description,
      supplier: d.supplier,
      amountCents: d.amount,
      paidBy: d.paidBy,
      invoicePath: d.invoicePath,
      invoiceName: d.invoiceName,
      proofPath: d.proofPath,
      proofName: d.proofName,
    }),
  });

  revalidatePath("/", "layout");
  return { savedCount: prev.savedCount + 1, lastSaved: `${d.description} — ${d.supplier}` };
}

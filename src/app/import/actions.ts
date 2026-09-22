"use server";

import { revalidatePath } from "next/cache";
import { expenseData } from "@/lib/expenses";
import { prisma } from "@/lib/prisma";
import { expenseKey, parseSheetCsv } from "@/lib/sheet-import";
import { decimalToCents } from "@/lib/split";

export type ImportReport = {
  imported: number;
  duplicates: number;
  errors: { line: number; message: string }[];
} | null;

const MAX_CSV_SIZE = 1024 * 1024;

export async function importSheet(_prev: ImportReport, formData: FormData): Promise<ImportReport> {
  const file = formData.get("csv");
  if (!(file instanceof File) || file.size === 0) {
    return { imported: 0, duplicates: 0, errors: [{ line: 0, message: "Choisis le fichier CSV exporté du Sheet." }] };
  }
  if (file.size > MAX_CSV_SIZE) {
    return { imported: 0, duplicates: 0, errors: [{ line: 0, message: "Fichier trop gros (1 Mo max)." }] };
  }

  const { rows, errors } = parseSheetCsv(await file.text());

  // Les lignes déjà présentes (même date, fournisseur, description, montant) sont ignorées :
  // on peut relancer l'import sans créer de doublons.
  const existing = await prisma.expense.findMany({ select: { date: true, supplier: true, description: true, amount: true } });
  const seen = new Set(
    existing.map((e) =>
      expenseKey({
        date: e.date.toISOString().slice(0, 10),
        supplier: e.supplier,
        description: e.description,
        amountCents: decimalToCents(e.amount),
      }),
    ),
  );
  const fresh = rows.filter((r) => {
    const key = expenseKey(r);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  if (fresh.length) {
    await prisma.$transaction(async (tx) => {
      const categoryIds = new Map<string, string>();
      for (const name of new Set(fresh.map((r) => r.category))) {
        const category = await tx.category.upsert({ where: { name }, create: { name }, update: {} });
        categoryIds.set(name, category.id);
      }
      await tx.expense.createMany({
        data: fresh.map((r) =>
          expenseData({
            date: r.date,
            categoryId: categoryIds.get(r.category)!,
            description: r.description,
            supplier: r.supplier,
            amountCents: r.amountCents,
            paidBy: r.paidBy,
            invoicePath: r.invoiceUrl,
            invoiceName: r.invoiceUrl && "Facture (Google Drive)",
            proofPath: r.proofUrl,
            proofName: r.proofUrl && "Justificatif (Google Drive)",
            proof2Path: r.proof2Url,
            proof2Name: r.proof2Url && "Justificatif 2 (Google Drive)",
          }),
        ),
      });
    });
    revalidatePath("/", "layout");
  }

  return { imported: fresh.length, duplicates: rows.length - fresh.length, errors };
}

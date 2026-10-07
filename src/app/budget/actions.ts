"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { centsToDecimalString, formatCents, parseAmountToCents } from "@/lib/split";

export type BudgetAmountState = { error?: string; saved?: string };

/** Modifie le montant prévu et les notes d'un poste (ex : après signature d'un devis). */
export async function updateBudgetLine(_prev: BudgetAmountState, formData: FormData): Promise<BudgetAmountState> {
  const id = String(formData.get("id") ?? "");
  const cents = parseAmountToCents(String(formData.get("amount") ?? ""));
  if (cents === null) return { error: "Montant invalide : écris par ex. 13100 ou 13 100,50 (sans point pour les milliers)" };
  const notes = String(formData.get("notes") ?? "").trim().slice(0, 2000) || null;

  const updated = await prisma.budgetLine
    .update({ where: { id }, data: { amount: centsToDecimalString(cents), notes } })
    .catch((error) => {
      console.error("Budget non modifié", id, error);
      return null;
    });
  if (!updated) return { error: "Enregistrement impossible (poste introuvable ou base indisponible)." };

  revalidatePath("/", "layout");
  return { saved: formatCents(cents) };
}

/** Rattache une dépense à un poste du budget (valeur vide : hors budget travaux). */
export async function assignExpense(formData: FormData) {
  const expenseId = String(formData.get("expenseId") ?? "");
  const budgetLineId = String(formData.get("budgetLineId") ?? "") || null;
  if (!expenseId) return;
  await prisma.expense.update({ where: { id: expenseId }, data: { budgetLineId } });
  revalidatePath("/", "layout");
}

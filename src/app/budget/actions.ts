"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { centsToDecimalString, parseAmountToCents } from "@/lib/split";

/** Modifie le montant prévu d'un poste (ex : après signature d'un devis). */
export async function updateBudgetAmount(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const cents = parseAmountToCents(String(formData.get("amount") ?? ""));
  if (!id || cents === null) return;
  await prisma.budgetLine.update({ where: { id }, data: { amount: centsToDecimalString(cents) } });
  revalidatePath("/", "layout");
}

/** Rattache une dépense à un poste du budget (valeur vide : hors budget travaux). */
export async function assignExpense(formData: FormData) {
  const expenseId = String(formData.get("expenseId") ?? "");
  const budgetLineId = String(formData.get("budgetLineId") ?? "") || null;
  if (!expenseId) return;
  await prisma.expense.update({ where: { id: expenseId }, data: { budgetLineId } });
  revalidatePath("/", "layout");
}

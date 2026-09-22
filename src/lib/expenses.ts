import type { Prisma } from "@/generated/prisma/client";
import { centsToDecimalString as money, computeSplit, type Payer } from "./split";

export type ExpenseInput = {
  date: string; // AAAA-MM-JJ
  categoryId: string;
  description: string;
  supplier: string;
  amountCents: number;
  paidBy: Payer;
  invoicePath?: string | null;
  invoiceName?: string | null;
  proofPath?: string | null;
  proofName?: string | null;
  proof2Path?: string | null;
  proof2Name?: string | null;
};

/** Prépare une ligne de dépense avec sa répartition 70/30 calculée. */
export function expenseData({ date, amountCents, paidBy, ...rest }: ExpenseInput): Prisma.ExpenseUncheckedCreateInput {
  const split = computeSplit(amountCents, paidBy);
  return {
    ...rest,
    date: new Date(`${date}T00:00:00Z`),
    amount: money(amountCents),
    paidBy,
    sharePatrick: money(split.sharePatrick),
    shareCharlotte: money(split.shareCharlotte),
    paidPatrick: money(split.paidPatrick),
    paidCharlotte: money(split.paidCharlotte),
    owedByCharlotte: money(split.owedByCharlotte),
  };
}

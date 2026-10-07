import { BUDGET_CENTS } from "./commitments";
import { projectCost, summarizeBudget } from "./budget";
import { prisma } from "./prisma";
import { SHARE_PATRICK, decimalToCents } from "./split";

/** Charge les postes, le dépensé par poste et le coût total projeté (partagé par les pages Budget et Dépenses). */
export async function loadBudget() {
  const [lines, spent, purchase] = await Promise.all([
    prisma.budgetLine.findMany({ orderBy: { position: "asc" } }),
    prisma.expense.groupBy({ by: ["budgetLineId"], _sum: { amount: true } }),
    // Achat et frais : dépenses partagées sans poste (les dépenses courantes n'entrent pas dans le coût du projet)
    prisma.expense.aggregate({ where: { kind: "SHARED", budgetLineId: null }, _sum: { amount: true } }),
  ]);

  const spentByLine = new Map(spent.map((s) => [s.budgetLineId ?? "", decimalToCents(s._sum.amount)]));
  const summary = summarizeBudget(
    lines.map((l) => ({ id: l.id, name: l.name, budget: decimalToCents(l.amount) })),
    spentByLine,
  );
  const cost = projectCost(summary.rows, decimalToCents(purchase._sum.amount), BUDGET_CENTS, SHARE_PATRICK);
  return { lines, ...summary, outOfBudget: spentByLine.get("") ?? 0, cost };
}

// Suivi budget vs dépenses par poste. Tous les montants sont en centimes.

/** Seuil à partir duquel un poste passe en alerte (part du budget consommée). */
export const WARNING_RATIO = 0.9;

export type BudgetStatus = "ok" | "warning" | "over";

export type BudgetRow = {
  id: string;
  name: string;
  budget: number;
  spent: number;
  remaining: number;
  /** Part du budget consommée (0,5 = 50 %). Infinity si dépense sans budget. */
  ratio: number;
  status: BudgetStatus;
};

export type BudgetSummary = {
  rows: BudgetRow[];
  total: Omit<BudgetRow, "id" | "name">;
};

function row(budget: number, spent: number) {
  const ratio = budget > 0 ? spent / budget : spent > 0 ? Infinity : 0;
  const status: BudgetStatus = spent > budget ? "over" : ratio >= WARNING_RATIO ? "warning" : "ok";
  return { budget, spent, remaining: budget - spent, ratio, status };
}

/** Croise les postes du budget avec le total dépensé sur chacun. */
export function summarizeBudget(
  lines: { id: string; name: string; budget: number }[],
  spentByLine: Map<string, number>,
): BudgetSummary {
  const rows = lines.map((l) => ({ id: l.id, name: l.name, ...row(l.budget, spentByLine.get(l.id) ?? 0) }));
  const sum = (key: "budget" | "spent") => rows.reduce((acc, r) => acc + r[key], 0);
  return { rows, total: row(sum("budget"), sum("spent")) };
}

export const formatPercent = (ratio: number) =>
  Number.isFinite(ratio) ? `${Math.round(ratio * 100)} %` : "—";

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

export type ProjectCost = {
  /** Achat et frais hors travaux, au réel (dépenses partagées sans poste). */
  purchase: number;
  /** Travaux à l'arrivée : par poste, le plus élevé entre prévu et déjà dépensé. */
  works: number;
  total: number;
  notarial: number;
  /** Coût total − budget notarié : > 0 dépassement à financer en plus (partagé 70/30). */
  gap: number;
  gapPatrick: number;
  gapCharlotte: number;
};

/** Coût total réel projeté du projet, comparé au budget de la déclaration notariée. */
export function projectCost(rows: Pick<BudgetRow, "budget" | "spent">[], purchase: number, notarial: number, sharePatrick: number): ProjectCost {
  const works = rows.reduce((acc, r) => acc + Math.max(r.budget, r.spent), 0);
  const total = purchase + works;
  const gap = total - notarial;
  const gapPatrick = Math.round(gap * sharePatrick);
  return { purchase, works, total, notarial, gap, gapPatrick, gapCharlotte: gap - gapPatrick };
}

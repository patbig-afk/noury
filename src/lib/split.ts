// Répartition d'une dépense entre les deux indivisaires.
// Tous les calculs se font en centimes (entiers) pour éviter les erreurs d'arrondi.

export const SHARE_PATRICK = 0.7;

export type Payer = "PATRICK" | "CHARLOTTE" | "BOTH";
export type ExpenseKind = "SHARED" | "CURRENT";

export const KIND_LABELS: Record<ExpenseKind, string> = {
  SHARED: "Achat / travaux (partagé 70/30)",
  CURRENT: "Dépense courante (non partagée)",
};

export const PAYER_LABELS: Record<Payer, string> = {
  PATRICK: "Patrick",
  CHARLOTTE: "Charlotte",
  BOTH: "Les deux",
};

export type Split = {
  sharePatrick: number;
  shareCharlotte: number;
  paidPatrick: number;
  paidCharlotte: number;
  owedByCharlotte: number;
};

/** Convertit "1 234,56" / "1234.5" en centimes. Renvoie null si invalide. */
export function parseAmountToCents(raw: string): number | null {
  const normalized = raw.replace(/[\s €]/g, "").replace(",", ".");
  if (!/^\d+(\.\d{1,2})?$/.test(normalized)) return null;
  const [euros, decimals = ""] = normalized.split(".");
  return Number(euros) * 100 + Number(decimals.padEnd(2, "0"));
}

export function computeSplit(amountCents: number, paidBy: Payer, kind: ExpenseKind = "SHARED"): Split {
  let paidPatrick = 0;
  if (paidBy === "PATRICK") paidPatrick = amountCents;
  if (paidBy === "BOTH") paidPatrick = Math.round(amountCents / 2);
  const paidCharlotte = paidBy === "PATRICK" ? 0 : amountCents - paidPatrick;

  // Dépense courante : chacun garde à sa charge ce qu'il a payé, rien n'est dû à l'autre.
  if (kind === "CURRENT") {
    return { sharePatrick: paidPatrick, shareCharlotte: paidCharlotte, paidPatrick, paidCharlotte, owedByCharlotte: 0 };
  }

  // Part Patrick arrondie au centime, Charlotte prend le reste : la somme retombe toujours pile sur le montant.
  const sharePatrick = Math.round(amountCents * SHARE_PATRICK);
  const shareCharlotte = amountCents - sharePatrick;

  // Ce que Charlotte doit à Patrick sur cette dépense = ce que Patrick a avancé au-delà de sa part.
  // (Équivaut à Part Charlotte − Charlotte a payé.) Négatif : c'est Patrick qui doit à Charlotte.
  const owedByCharlotte = paidPatrick - sharePatrick;

  return { sharePatrick, shareCharlotte, paidPatrick, paidCharlotte, owedByCharlotte };
}

/** Traduit un solde en phrase : qui doit combien à qui. */
export function balanceLabel(owedByCharlotteCents: number) {
  if (owedByCharlotteCents > 0) return "Charlotte doit à Patrick";
  if (owedByCharlotteCents < 0) return "Patrick doit à Charlotte";
  return "Comptes à l'équilibre";
}

export const centsToDecimalString = (cents: number) => (cents / 100).toFixed(2);

const eur = new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" });
export const formatCents = (cents: number) => eur.format(cents / 100);

/** Convertit une valeur Decimal de la base (ex : "1250.50") en centimes. */
export const decimalToCents = (value: { toString(): string } | null | undefined) =>
  value == null ? 0 : Math.round(Number(value.toString()) * 100);

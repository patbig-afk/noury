// Répartition d'une dépense entre les deux indivisaires.
// Tous les calculs se font en centimes (entiers) pour éviter les erreurs d'arrondi.

export const SHARE_PATRICK = 0.7;

export type Payer = "PATRICK" | "CHARLOTTE" | "BOTH";

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
  surplusPatrick: number;
};

/** Convertit "1 234,56" / "1234.5" en centimes. Renvoie null si invalide. */
export function parseAmountToCents(raw: string): number | null {
  const normalized = raw.replace(/[\s €]/g, "").replace(",", ".");
  if (!/^\d+(\.\d{1,2})?$/.test(normalized)) return null;
  const [euros, decimals = ""] = normalized.split(".");
  return Number(euros) * 100 + Number(decimals.padEnd(2, "0"));
}

export function computeSplit(amountCents: number, paidBy: Payer): Split {
  // Part Patrick arrondie au centime, Charlotte prend le reste : la somme retombe toujours pile sur le montant.
  const sharePatrick = Math.round(amountCents * SHARE_PATRICK);
  const shareCharlotte = amountCents - sharePatrick;

  let paidPatrick = 0;
  if (paidBy === "PATRICK") paidPatrick = amountCents;
  if (paidBy === "BOTH") paidPatrick = Math.round(amountCents / 2);
  const paidCharlotte = paidBy === "PATRICK" ? 0 : amountCents - paidPatrick;

  // Formule reprise du Google Sheet : (Patrick a payé − Part Patrick) − (Charlotte a payé − Part Charlotte)
  const surplusPatrick = paidPatrick - sharePatrick - (paidCharlotte - shareCharlotte);

  return { sharePatrick, shareCharlotte, paidPatrick, paidCharlotte, surplusPatrick };
}

export const centsToDecimalString = (cents: number) => (cents / 100).toFixed(2);

const eur = new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" });
export const formatCents = (cents: number) => eur.format(cents / 100);

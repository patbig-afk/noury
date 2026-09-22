// Engagements de la déclaration d'origine des deniers (notaire, acquisition du 1 rue Cdt Noury).
// Budget total 682 730 € (achat, frais, travaux), financé 70 % Patrick / 30 % Charlotte.
// Tout dépassement du budget se partage aussi à 70/30 : chacun ne récupère que la part de l'autre.

import { SHARE_PATRICK } from "./split";

export const BUDGET_CENTS = 682_730_00;
export const COMMITMENT_CENTS = { patrick: 477_911_00, charlotte: 204_819_00 } as const;

export type PersonStatus = {
  commitment: number;
  paid: number;
  /** Engagement + sa part du dépassement de budget. */
  due: number;
  /** Payé − part due : > 0 avance à récupérer, < 0 reste à verser. */
  balance: number;
};

export type CommitmentStatus = {
  budget: number;
  spent: number;
  /** Dépenses au-delà du budget prévu (0 tant qu'on reste dans le budget). */
  overrun: number;
  patrick: PersonStatus;
  charlotte: PersonStatus;
};

export function computeCommitments(paidPatrick: number, paidCharlotte: number): CommitmentStatus {
  const spent = paidPatrick + paidCharlotte;
  const overrun = Math.max(0, spent - BUDGET_CENTS);
  const overrunPatrick = Math.round(overrun * SHARE_PATRICK);

  const person = (commitment: number, paid: number, overrunShare: number): PersonStatus => {
    const due = commitment + overrunShare;
    return { commitment, paid, due, balance: paid - due };
  };

  return {
    budget: BUDGET_CENTS,
    spent,
    overrun,
    patrick: person(COMMITMENT_CENTS.patrick, paidPatrick, overrunPatrick),
    charlotte: person(COMMITMENT_CENTS.charlotte, paidCharlotte, overrun - overrunPatrick),
  };
}

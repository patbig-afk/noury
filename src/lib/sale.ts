// Simulation de la vente : qui touche quoi, à partir des dépenses partagées enregistrées.
// 1. Chacun récupère ce qu'il a mis (achat + travaux).
// 2. La plus-value (ou la moins-value) se partage selon les quotités : 70 % Patrick / 30 % Charlotte.
// 3. Charlotte rembourse sur sa part le capital restant dû de son prêt (à sa charge seule d'après la déclaration d'origine des deniers).
// Revient à : part de chacun = 70/30 du prix net + avance faite au-delà de sa quote-part du coût réel.

import { SHARE_PATRICK } from "./split";

export type SaleInput = {
  price: number;
  saleCosts: number;
  loanRemaining: number;
  paidPatrick: number;
  paidCharlotte: number;
};

export type SaleResult = {
  net: number;
  invested: number;
  /** Prix net − total investi : > 0 plus-value, < 0 moins-value. */
  gain: number;
  patrick: { invested: number; gainShare: number; total: number };
  charlotte: { invested: number; gainShare: number; total: number; afterLoan: number };
};

export function simulateSale({ price, saleCosts, loanRemaining, paidPatrick, paidCharlotte }: SaleInput): SaleResult {
  const net = price - saleCosts;
  const invested = paidPatrick + paidCharlotte;
  const gain = net - invested;
  const gainPatrick = Math.round(gain * SHARE_PATRICK);
  const gainCharlotte = gain - gainPatrick;
  const charlotteTotal = paidCharlotte + gainCharlotte;

  return {
    net,
    invested,
    gain,
    patrick: { invested: paidPatrick, gainShare: gainPatrick, total: paidPatrick + gainPatrick },
    charlotte: { invested: paidCharlotte, gainShare: gainCharlotte, total: charlotteTotal, afterLoan: charlotteTotal - loanRemaining },
  };
}

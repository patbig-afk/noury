import { describe, expect, it } from "vitest";
import { simulateSale } from "./sale";

describe("simulation de vente", () => {
  it("chacun récupère sa mise, la plus-value se partage 70/30", () => {
    const r = simulateSale({ price: 800_000_00, saleCosts: 30_000_00, loanRemaining: 150_000_00, paidPatrick: 500_000_00, paidCharlotte: 200_000_00 });
    expect(r.net).toBe(770_000_00);
    expect(r.gain).toBe(70_000_00);
    expect(r.patrick).toEqual({ invested: 500_000_00, gainShare: 49_000_00, total: 549_000_00 });
    expect(r.charlotte).toMatchObject({ total: 221_000_00, afterLoan: 71_000_00 });
    expect(r.patrick.total + r.charlotte.total).toBe(r.net);
  });

  it("équivaut à 70/30 du net + avance au-delà de sa quote-part", () => {
    const r = simulateSale({ price: 700_000_00, saleCosts: 0, loanRemaining: 0, paidPatrick: 500_000_00, paidCharlotte: 200_000_00 });
    const advance = 500_000_00 - 0.7 * 700_000_00; // 10 000 € avancés par Patrick
    expect(r.patrick.total).toBe(0.7 * r.net + advance);
  });

  it("moins-value : partagée 70/30 aussi", () => {
    const r = simulateSale({ price: 600_000_00, saleCosts: 0, loanRemaining: 0, paidPatrick: 490_000_00, paidCharlotte: 210_000_00 });
    expect(r.gain).toBe(-100_000_00);
    expect(r.patrick.total).toBe(420_000_00);
    expect(r.charlotte.total).toBe(180_000_00);
  });
});

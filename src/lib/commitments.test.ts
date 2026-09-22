import { describe, expect, it } from "vitest";
import { BUDGET_CENTS, COMMITMENT_CENTS, computeCommitments } from "./commitments";

describe("engagements de la déclaration d'origine des deniers", () => {
  it("70/30 du budget total", () => {
    expect(COMMITMENT_CENTS.patrick + COMMITMENT_CENTS.charlotte).toBe(BUDGET_CENTS);
    expect(COMMITMENT_CENTS.patrick).toBe(Math.round(BUDGET_CENTS * 0.7));
  });

  it("en cours de projet : chacun voit ce qu'il lui reste à verser", () => {
    const s = computeCommitments(357_287_84, 124_500_00);
    expect(s.overrun).toBe(0);
    expect(s.patrick.balance).toBe(-120_623_16);
    expect(s.charlotte.balance).toBe(-80_319_00);
  });

  it("Patrick dépasse son engagement dans le budget : toute l'avance est à récupérer", () => {
    const s = computeCommitments(487_911_00, 194_819_00); // budget pile atteint
    expect(s.patrick.balance).toBe(10_000_00);
    expect(s.charlotte.balance).toBe(-10_000_00);
  });

  it("dépassement du budget payé par Patrick : il ne récupère que les 30 % de Charlotte", () => {
    const s = computeCommitments(487_911_00, 204_819_00); // 10 000 € au-delà du budget
    expect(s.overrun).toBe(10_000_00);
    expect(s.patrick).toMatchObject({ due: 484_911_00, balance: 3_000_00 });
    expect(s.charlotte).toMatchObject({ due: 207_819_00, balance: -3_000_00 });
  });

  it("symétrique si Charlotte paie le dépassement", () => {
    const s = computeCommitments(477_911_00, 214_819_00);
    expect(s.charlotte.balance).toBe(7_000_00);
    expect(s.patrick.balance).toBe(-7_000_00);
  });
});

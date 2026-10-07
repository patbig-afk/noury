import { describe, expect, it } from "vitest";
import { formatPercent, projectCost, summarizeBudget } from "./budget";

describe("summarizeBudget", () => {
  const lines = [
    { id: "a", name: "Plomberie", budget: 100_00 },
    { id: "b", name: "Électricité", budget: 200_00 },
    { id: "c", name: "Peinture", budget: 50_00 },
  ];

  it("calcule reste, ratio et statut par poste", () => {
    const { rows } = summarizeBudget(lines, new Map([["a", 40_00], ["b", 190_00], ["c", 60_00]]));
    expect(rows.map((r) => [r.remaining, r.ratio, r.status])).toEqual([
      [60_00, 0.4, "ok"],
      [10_00, 0.95, "warning"],
      [-10_00, 1.2, "over"],
    ]);
  });

  it("un poste sans dépense reste à 0", () => {
    const { rows } = summarizeBudget(lines, new Map());
    expect(rows[0]).toMatchObject({ spent: 0, remaining: 100_00, ratio: 0, status: "ok" });
  });

  it("totalise budget et dépensé", () => {
    const { total } = summarizeBudget(lines, new Map([["a", 40_00], ["c", 60_00]]));
    expect(total).toMatchObject({ budget: 350_00, spent: 100_00, remaining: 250_00, status: "ok" });
  });

  it("dépense sur un poste à budget nul → dépassement", () => {
    const { rows } = summarizeBudget([{ id: "z", name: "Imprévu", budget: 0 }], new Map([["z", 5_00]]));
    expect(rows[0]).toMatchObject({ ratio: Infinity, status: "over" });
  });
});

describe("formatPercent", () => {
  it.each([
    [0.456, "46 %"],
    [1.2, "120 %"],
    [Infinity, "—"],
  ])("%s → %s", (ratio, label) => expect(formatPercent(ratio)).toBe(label));
});

describe("projectCost", () => {
  it("additionne l'achat et les travaux (prévu, ou dépensé si dépassement) et compare au notarié", () => {
    const rows = [
      { budget: 100_00, spent: 40_00 }, // reste dans le budget → 100
      { budget: 0, spent: 30_00 }, // dépense sans budget → 30
    ];
    expect(projectCost(rows, 500_00, 600_00, 0.7)).toEqual({
      purchase: 500_00,
      works: 130_00,
      total: 630_00,
      notarial: 600_00,
      gap: 30_00,
      gapPatrick: 21_00,
      gapCharlotte: 9_00,
    });
  });
});

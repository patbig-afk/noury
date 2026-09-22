import { describe, expect, it } from "vitest";
import { computeSplit, parseAmountToCents } from "./split";

describe("parseAmountToCents", () => {
  it.each([
    ["100", 10000],
    ["1234,5", 123450],
    ["1 234,56 €", 123456],
    ["0.99", 99],
  ])("%s → %i", (raw, cents) => expect(parseAmountToCents(raw)).toBe(cents));

  it.each(["", "abc", "-5", "1,234", "12.345"])("rejette %j", (raw) =>
    expect(parseAmountToCents(raw)).toBeNull(),
  );
});

describe("computeSplit", () => {
  it("Patrick paie tout", () => {
    expect(computeSplit(100_00, "PATRICK")).toEqual({
      sharePatrick: 70_00,
      shareCharlotte: 30_00,
      paidPatrick: 100_00,
      paidCharlotte: 0,
      surplusPatrick: 60_00,
    });
  });

  it("Charlotte paie tout", () => {
    expect(computeSplit(100_00, "CHARLOTTE")).toMatchObject({
      paidPatrick: 0,
      paidCharlotte: 100_00,
      surplusPatrick: -140_00,
    });
  });

  it("les deux paient moitié-moitié", () => {
    expect(computeSplit(100_00, "BOTH")).toMatchObject({
      paidPatrick: 50_00,
      paidCharlotte: 50_00,
      surplusPatrick: -40_00,
    });
  });

  it("les parts retombent toujours sur le montant, même avec des centimes impairs", () => {
    const s = computeSplit(333, "BOTH");
    expect(s.sharePatrick + s.shareCharlotte).toBe(333);
    expect(s.paidPatrick + s.paidCharlotte).toBe(333);
  });
});

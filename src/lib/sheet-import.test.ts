import { describe, expect, it } from "vitest";
import { parseCsv, parseSheetCsv } from "./sheet-import";

// Même structure que l'export CSV du Sheet (titre, sous-titre, en-têtes, données), avec des valeurs fictives.
const CSV = [
  " MAISON NOURY — SUIVI DES DÉPENSES,,,,,,,,,,,,,",
  '"1 rue X, 44100 Nantes  |  Patrick 70% — Charlotte 30%",,,,,,,,,,,,,',
  "Date,Catégorie,Description,Fournisseur,Montant Total,Payé par,Part Patrick (70%),Part Charlotte (30%),Patrick a payé,Charlotte a payé,Surplus Patrick,Factures,Justificatif paiement,Justificatif 2",
  '18/05/2026,Travaux / artisans,Acompte,Artisan A,"1234,5",Patrick,1,1,1,1,1,https://drive.google.com/f1,https://drive.google.com/p1,',
  '05/02/2026,Notaire / achat,"Achat, versement 1",Notaire,20750,Les deux,1,1,1,1,1,,https://drive.google.com/p2,https://drive.google.com/p3',
  "20/05/2026,Notaire / achat,Versement Charlotte,Notaire,124500,Charlotte,,,,,,,,",
  ",,,,,,,,,,,,,",
  "31/02/2026,Travaux / artisans,Mauvaise date,Artisan B,abc,Personne,,,,,,,,",
].join("\r\n");

describe("parseCsv", () => {
  it("gère guillemets, virgules et guillemets échappés", () => {
    expect(parseCsv('a,"b,c","d ""e"""\r\n1,2,3')).toEqual([
      ["a", "b,c", 'd "e"'],
      ["1", "2", "3"],
    ]);
  });
});

describe("parseSheetCsv", () => {
  const { rows, errors } = parseSheetCsv(CSV);

  it("lit les lignes de données à partir des en-têtes", () => {
    expect(rows).toHaveLength(3);
    expect(rows[0]).toEqual({
      line: 4,
      date: "2026-05-18",
      category: "Travaux / artisans",
      description: "Acompte",
      supplier: "Artisan A",
      amountCents: 123450,
      paidBy: "PATRICK",
      invoiceUrl: "https://drive.google.com/f1",
      proofUrl: "https://drive.google.com/p1",
      proof2Url: null,
    });
    expect(rows[1]).toMatchObject({ description: "Achat, versement 1", paidBy: "BOTH", invoiceUrl: null, proof2Url: "https://drive.google.com/p3" });
    expect(rows[2]).toMatchObject({ paidBy: "CHARLOTTE", amountCents: 12450000 });
  });

  it("ignore les lignes vides et signale les lignes invalides avec leur numéro", () => {
    expect(errors).toEqual([
      { line: 8, message: "date invalide « 31/02/2026 », montant invalide « abc », « Payé par » invalide « Personne »" },
    ]);
  });

  it("refuse un fichier sans en-têtes", () => {
    expect(parseSheetCsv("a,b\n1,2").errors[0].message).toMatch(/en-têtes/);
  });
});

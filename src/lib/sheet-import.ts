// Lecture de l'export CSV du Google Sheet "Suivi_Depenses_Maison_Noury".
// Seules les colonnes saisies à la main sont lues : les colonnes calculées du Sheet sont ignorées
// et recalculées par l'app (cf. split.ts).

import { parseAmountToCents, type Payer } from "./split";

export type SheetRow = {
  line: number;
  date: string; // AAAA-MM-JJ
  category: string;
  description: string;
  supplier: string;
  amountCents: number;
  paidBy: Payer;
  invoiceUrl: string | null;
  proofUrl: string | null;
  proof2Url: string | null;
};

export type SheetParseResult = { rows: SheetRow[]; errors: { line: number; message: string }[] };

/** Découpe un CSV (guillemets, virgules et retours à la ligne dans les cellules gérés). */
export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let quoted = false;

  const endCell = () => {
    row.push(cell);
    cell = "";
  };
  const endRow = () => {
    endCell();
    rows.push(row);
    row = [];
  };

  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (quoted) {
      if (c === '"' && text[i + 1] === '"') {
        cell += '"';
        i++;
      } else if (c === '"') quoted = false;
      else cell += c;
    } else if (c === '"') quoted = true;
    else if (c === ",") endCell();
    else if (c === "\n" || c === "\r") {
      if (c === "\r" && text[i + 1] === "\n") i++;
      endRow();
    } else cell += c;
  }
  if (cell || row.length) endRow();
  return rows;
}

const normalize = (s: string) =>
  s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/\s+/g, " ").trim();

const COLUMNS = {
  date: "date",
  category: "categorie",
  description: "description",
  supplier: "fournisseur",
  amount: "montant total",
  paidBy: "paye par",
  invoice: "factures",
  proof: "justificatif paiement",
  proof2: "justificatif 2",
} as const;

const PAYERS: Record<string, Payer> = { patrick: "PATRICK", charlotte: "CHARLOTTE", "les deux": "BOTH" };

const link = (value: string | undefined) => (value?.trim().startsWith("https://") ? value.trim() : null);

function parseFrenchDate(value: string) {
  const m = value.trim().match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (!m) return null;
  const [, d, mo, y] = m;
  const iso = `${y}-${mo.padStart(2, "0")}-${d.padStart(2, "0")}`;
  const date = new Date(`${iso}T00:00:00Z`);
  return date.getUTCMonth() + 1 === Number(mo) && date.getUTCDate() === Number(d) ? iso : null;
}

export function parseSheetCsv(text: string): SheetParseResult {
  const table = parseCsv(text.replace(/^﻿/, ""));
  const headerIndex = table.findIndex((r) => normalize(r[0] ?? "") === COLUMNS.date);
  if (headerIndex === -1) {
    return { rows: [], errors: [{ line: 0, message: "Ligne d'en-têtes introuvable (1re colonne « Date »)." }] };
  }

  const headers = table[headerIndex].map(normalize);
  const col = Object.fromEntries(Object.entries(COLUMNS).map(([k, name]) => [k, headers.indexOf(name)])) as Record<
    keyof typeof COLUMNS,
    number
  >;
  const missing = (["date", "category", "description", "supplier", "amount", "paidBy"] as const).filter((k) => col[k] === -1);
  if (missing.length) {
    return {
      rows: [],
      errors: [{ line: headerIndex + 1, message: `Colonnes manquantes : ${missing.map((k) => COLUMNS[k]).join(", ")}` }],
    };
  }

  const result: SheetParseResult = { rows: [], errors: [] };
  table.slice(headerIndex + 1).forEach((cells, i) => {
    const line = headerIndex + 2 + i; // numéro de ligne tel qu'affiché dans le Sheet
    const get = (k: keyof typeof COLUMNS) => (col[k] === -1 ? "" : (cells[col[k]] ?? "").trim());
    if (cells.every((c) => !c.trim())) return;

    const date = parseFrenchDate(get("date"));
    const amountCents = parseAmountToCents(get("amount"));
    const paidBy = PAYERS[normalize(get("paidBy"))];
    const problems = [
      !date && `date invalide « ${get("date")} »`,
      !amountCents && `montant invalide « ${get("amount")} »`,
      !paidBy && `« Payé par » invalide « ${get("paidBy")} »`,
      !get("category") && "catégorie vide",
      !get("description") && "description vide",
      !get("supplier") && "fournisseur vide",
    ].filter(Boolean);
    if (problems.length || !date || !amountCents || !paidBy) {
      result.errors.push({ line, message: problems.join(", ") });
      return;
    }

    result.rows.push({
      line,
      date,
      category: get("category"),
      description: get("description"),
      supplier: get("supplier"),
      amountCents,
      paidBy,
      invoiceUrl: link(get("invoice")),
      proofUrl: link(get("proof")),
      proof2Url: link(get("proof2")),
    });
  });
  return result;
}

/** Empreinte d'une dépense pour repérer les doublons lors d'un nouvel import. */
export const expenseKey = (e: { date: string; supplier: string; description: string; amountCents: number }) =>
  [e.date, normalize(e.supplier), normalize(e.description), e.amountCents].join("|");

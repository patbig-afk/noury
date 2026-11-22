"use server";

import { revalidatePath } from "next/cache";
import { loadBudget } from "@/lib/budget-data";
import { createSpreadsheet, googleConfigured, type SheetCell, type SheetTab } from "@/lib/google-sheets";
import { prisma } from "@/lib/prisma";
import { centsToDecimalString, decimalToCents, formatCents, parseAmountToCents } from "@/lib/split";

export type BudgetAmountState = { error?: string; saved?: string };

/** Modifie le montant prévu et les notes d'un poste (ex : après signature d'un devis). */
export async function updateBudgetLine(_prev: BudgetAmountState, formData: FormData): Promise<BudgetAmountState> {
  const id = String(formData.get("id") ?? "");
  const cents = parseAmountToCents(String(formData.get("amount") ?? ""));
  if (cents === null) return { error: "Montant invalide : écris par ex. 13100 ou 13 100,50 (sans point pour les milliers)" };
  const notes = String(formData.get("notes") ?? "").trim().slice(0, 2000) || null;

  const updated = await prisma.budgetLine
    .update({ where: { id }, data: { amount: centsToDecimalString(cents), notes } })
    .catch((error) => {
      console.error("Budget non modifié", id, error);
      return null;
    });
  if (!updated) return { error: "Enregistrement impossible (poste introuvable ou base indisponible)." };

  revalidatePath("/", "layout");
  return { saved: formatCents(cents) };
}

/** Rattache une dépense à un poste du budget (valeur vide : hors budget travaux). */
export async function assignExpense(formData: FormData) {
  const expenseId = String(formData.get("expenseId") ?? "");
  const budgetLineId = String(formData.get("budgetLineId") ?? "") || null;
  if (!expenseId) return;
  await prisma.expense.update({ where: { id: expenseId }, data: { budgetLineId } });
  revalidatePath("/", "layout");
}

export type ExportState = { error?: string; url?: string };

/** Exporte la synthèse du budget (postes, notes, hors budget) dans un nouveau Google Sheet. */
export async function exportBudgetSheet(): Promise<ExportState> {
  if (!googleConfigured()) {
    return { error: "Export non configuré : ajoute GOOGLE_SERVICE_ACCOUNT_EMAIL, GOOGLE_PRIVATE_KEY et GOOGLE_SHARE_EMAIL dans Vercel." };
  }
  try {
    const [{ lines, rows, total, outOfBudget, cost }, unassigned] = await Promise.all([
      loadBudget(),
      prisma.expense.findMany({ where: { budgetLineId: null }, include: { category: true }, orderBy: { date: "desc" } }),
    ]);
    const notesById = new Map(lines.map((l) => [l.id, l.notes]));
    const eur = (cents: number) => cents / 100;
    const pct = (ratio: number) => (Number.isFinite(ratio) ? Math.round(ratio * 100) / 100 : null);
    const day = new Intl.DateTimeFormat("fr-FR", { timeZone: "UTC" });

    const tabs: SheetTab[] = [
      {
        title: "Synthèse",
        rows: [
          ["Maison Noury — synthèse budget", `Export du ${new Date().toLocaleDateString("fr-FR", { timeZone: "Europe/Paris" })}`],
          [],
          ["Achat & frais (réel, hors travaux)", eur(cost.purchase)],
          ["Travaux (prévu, ou dépensé si dépassé)", eur(cost.works)],
          ["Coût total projeté", eur(cost.total)],
          ["Budget déclaration notariée", eur(cost.notarial)],
          [cost.gap > 0 ? "Dépassement vs notarié" : "Marge vs notarié", eur(Math.abs(cost.gap))],
          ["… part Patrick (70 %)", eur(cost.gapPatrick)],
          ["… part Charlotte (30 %)", eur(cost.gapCharlotte)],
          [],
          ["Budget travaux prévu", eur(total.budget)],
          ["Dépensé", eur(total.spent)],
          ["Reste", eur(total.remaining)],
          ["Consommé", pct(total.ratio)],
        ],
      },
      {
        title: "Postes & commentaires",
        rows: [
          ["Poste", "Budget prévu (€)", "Dépensé (€)", "Reste (€)", "Consommé", "Statut", "Commentaires"],
          ...rows.map((r): SheetCell[] => [
            r.name,
            eur(r.budget),
            eur(r.spent),
            eur(r.remaining),
            pct(r.ratio),
            r.status === "over" ? "Dépassé" : r.status === "warning" ? "Alerte" : "OK",
            notesById.get(r.id) ?? "",
          ]),
          ["TOTAL", eur(total.budget), eur(total.spent), eur(total.remaining), pct(total.ratio), "", ""],
        ],
      },
      {
        title: "Hors budget travaux",
        rows: [
          ["Date", "Description", "Fournisseur", "Catégorie", "Montant (€)"],
          ...unassigned.map((e): SheetCell[] => [day.format(e.date), e.description, e.supplier, e.category.name, eur(decimalToCents(e.amount))]),
          ["TOTAL", "", "", "", eur(outOfBudget)],
        ],
      },
    ];

    const url = await createSpreadsheet(`Synthèse budget Noury — ${new Date().toISOString().slice(0, 10)}`, tabs);
    return { url };
  } catch (error) {
    console.error("Export Google Sheet échoué", error);
    return { error: "Export impossible (Google Sheets indisponible ou accès refusé). Vérifie les clés dans Vercel." };
  }
}

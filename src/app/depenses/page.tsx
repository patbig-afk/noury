import Link from "next/link";
import { connection } from "next/server";
import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { PAYER_LABELS, balanceLabel, decimalToCents, formatCents } from "@/lib/split";
import { Nav } from "../nav";

type SortKey = "date" | "categorie";
type Order = "asc" | "desc";

const ORDER_BY: Record<SortKey, (o: Order) => Prisma.ExpenseOrderByWithRelationInput[]> = {
  date: (o) => [{ date: o }, { createdAt: o }],
  categorie: (o) => [{ category: { name: o } }, { date: "desc" }],
};

const dateFormat = new Intl.DateTimeFormat("fr-FR", { timeZone: "UTC" });

export default async function ExpensesPage({ searchParams }: PageProps<"/depenses">) {
  await connection();
  const params = await searchParams;
  const sort: SortKey = params.tri === "categorie" ? "categorie" : "date";
  const order: Order = params.ordre === "asc" ? "asc" : params.ordre === "desc" ? "desc" : sort === "date" ? "desc" : "asc";

  const [expenses, totals] = await Promise.all([
    prisma.expense.findMany({ include: { category: true }, orderBy: ORDER_BY[sort](order) }),
    prisma.expense.aggregate({ _sum: { amount: true, sharePatrick: true, shareCharlotte: true, owedByCharlotte: true } }),
  ]);

  const sum = {
    amount: decimalToCents(totals._sum.amount),
    sharePatrick: decimalToCents(totals._sum.sharePatrick),
    shareCharlotte: decimalToCents(totals._sum.shareCharlotte),
    owedByCharlotte: decimalToCents(totals._sum.owedByCharlotte),
  };

  // Lien d'en-tête de colonne : re-cliquer sur la colonne active inverse l'ordre.
  const sortHref = (key: SortKey) => {
    const nextOrder = key === sort ? (order === "asc" ? "desc" : "asc") : key === "date" ? "desc" : "asc";
    return `/depenses?tri=${key}&ordre=${nextOrder}`;
  };
  const arrow = (key: SortKey) => (key === sort ? (order === "asc" ? " ↑" : " ↓") : "");

  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-6">
      <Nav current="/depenses" />
      <div className="mb-5 flex items-baseline justify-between gap-4">
        <h1 className="text-xl font-semibold">
          Dépenses <span className="text-stone-500">({expenses.length})</span>
        </h1>
        <Link href="/import" className="text-sm text-stone-600 underline">
          Importer depuis le Google Sheet
        </Link>
      </div>

      {/* Résumé visible d'un coup d'œil sur téléphone */}
      <dl className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Total dépensé" cents={sum.amount} />
        <Stat label="Part Patrick (70 %)" cents={sum.sharePatrick} />
        <Stat label="Part Charlotte (30 %)" cents={sum.shareCharlotte} />
        <Stat label={balanceLabel(sum.owedByCharlotte)} cents={Math.abs(sum.owedByCharlotte)} highlight />
      </dl>

      {expenses.length === 0 ? (
        <p className="rounded-lg bg-white p-6 text-center text-stone-500">
          Aucune dépense pour l&apos;instant. <Link href="/" className="underline">En saisir une</Link>
        </p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-stone-200 bg-white">
          <table className="w-full text-sm whitespace-nowrap">
            <thead className="bg-stone-100 text-left text-stone-600">
              <tr>
                <th className="px-2.5 py-2">
                  <Link href={sortHref("date")} className="hover:underline">Date{arrow("date")}</Link>
                </th>
                <th className="px-2.5 py-2">
                  <Link href={sortHref("categorie")} className="hover:underline">Catégorie{arrow("categorie")}</Link>
                </th>
                <th className="px-2.5 py-2">Description</th>
                <th className="px-2.5 py-2">Fournisseur</th>
                <th className="px-2.5 py-2 text-right">Montant</th>
                <th className="px-2.5 py-2">Payé par</th>
                <th className="px-2.5 py-2 text-right">Part Patrick</th>
                <th className="px-2.5 py-2 text-right">Part Charlotte</th>
                <th className="px-2.5 py-2 text-right" title="Positif : Charlotte doit à Patrick. Négatif : Patrick doit à Charlotte.">
                  Charlotte doit
                </th>
                <th className="px-2.5 py-2">Fichiers</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {expenses.map((e) => (
                <tr key={e.id} className="hover:bg-stone-50">
                  <td className="px-2.5 py-2 tabular-nums">{dateFormat.format(e.date)}</td>
                  <td className="px-2.5 py-2">{e.category.name}</td>
                  <td className="max-w-56 truncate px-2.5 py-2" title={e.description}>{e.description}</td>
                  <td className="px-2.5 py-2">{e.supplier}</td>
                  <Money cents={decimalToCents(e.amount)} bold />
                  <td className="px-2.5 py-2">{PAYER_LABELS[e.paidBy]}</td>
                  <Money cents={decimalToCents(e.sharePatrick)} />
                  <Money cents={decimalToCents(e.shareCharlotte)} />
                  <Money cents={decimalToCents(e.owedByCharlotte)} signed />
                  <td className="space-x-2 px-2.5 py-2 text-base">
                    <FileLink id={e.id} kind="facture" name={e.invoiceName} label="📄" title="Facture" />
                    <FileLink id={e.id} kind="justificatif" name={e.proofName} label="🧾" title="Justificatif de paiement" />
                    {e.proof2Name && (
                      <FileLink id={e.id} kind="justificatif-2" name={e.proof2Name} label="🧾" title="Justificatif 2" />
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="border-t-2 border-stone-300 bg-stone-100 font-semibold">
              <tr>
                <td className="px-2.5 py-2" colSpan={4}>Total</td>
                <Money cents={sum.amount} />
                <td />
                <Money cents={sum.sharePatrick} />
                <Money cents={sum.shareCharlotte} />
                <Money cents={sum.owedByCharlotte} signed />
                <td />
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </main>
  );
}

const signColor = (cents: number) => (cents < 0 ? "text-red-700" : cents > 0 ? "text-green-700" : "");

function Money({ cents, bold, signed }: { cents: number; bold?: boolean; signed?: boolean }) {
  return (
    <td className={`px-2.5 py-2 text-right tabular-nums ${bold ? "font-medium" : ""} ${signed ? signColor(cents) : ""}`}>
      {formatCents(cents)}
    </td>
  );
}

function Stat({ label, cents, highlight }: { label: string; cents: number; highlight?: boolean }) {
  return (
    <div className={`rounded-lg border p-3 ${highlight ? "border-stone-900 bg-stone-900 text-white" : "border-stone-200 bg-white"}`}>
      <dt className={`text-xs ${highlight ? "text-stone-300" : "text-stone-500"}`}>{label}</dt>
      <dd className="text-lg font-semibold tabular-nums">{formatCents(cents)}</dd>
    </div>
  );
}

function FileLink({ id, kind, name, label, title }: { id: string; kind: string; name: string | null; label: string; title: string }) {
  if (!name) return <span className="opacity-20" title={`${title} : aucun fichier`}>{label}</span>;
  return (
    <a href={`/api/files/${id}/${kind}`} target="_blank" rel="noreferrer" title={`${title} : ${name}`} aria-label={`Télécharger ${title.toLowerCase()}`}>
      {label}
    </a>
  );
}

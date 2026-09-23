import Link from "next/link";
import { connection } from "next/server";
import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { computeCommitments, type PersonStatus } from "@/lib/commitments";
import { PAYER_LABELS, decimalToCents, formatCents } from "@/lib/split";
import { Nav } from "../nav";
import { DeleteButton } from "./delete-button";
import { FileViewer } from "./file-viewer";

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

  const [expenses, totals, current] = await Promise.all([
    prisma.expense.findMany({ include: { category: true }, orderBy: ORDER_BY[sort](order) }),
    prisma.expense.aggregate({ where: { kind: "SHARED" }, _sum: { amount: true, sharePatrick: true, shareCharlotte: true, owedByCharlotte: true, paidPatrick: true, paidCharlotte: true } }),
    prisma.expense.aggregate({ where: { kind: "CURRENT" }, _sum: { amount: true } }),
  ]);

  const sum = {
    amount: decimalToCents(totals._sum.amount),
    sharePatrick: decimalToCents(totals._sum.sharePatrick),
    shareCharlotte: decimalToCents(totals._sum.shareCharlotte),
    owedByCharlotte: decimalToCents(totals._sum.owedByCharlotte),
  };
  // Sans justificatif de paiement, la dépense est considérée comme restant à payer.
  const toPay = (e: { proofName: string | null; proof2Name: string | null }) => !e.proofName && !e.proof2Name;
  const toPayCount = expenses.filter(toPay).length;
  const status = computeCommitments(decimalToCents(totals._sum.paidPatrick), decimalToCents(totals._sum.paidCharlotte));

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
          {toPayCount > 0 && (
            <span className="ml-2 rounded bg-amber-100 px-2 py-0.5 align-middle text-sm font-medium text-amber-800">
              ⚠️ {toPayCount} à payer
            </span>
          )}
        </h1>
        <Link href="/import" className="text-sm text-stone-600 underline">
          Importer depuis le Google Sheet
        </Link>
      </div>

      {/* Suivi des engagements 70/30 : visible d'un coup d'œil sur téléphone */}
      <section className="mb-6 grid gap-3 sm:grid-cols-3">
        <div className="rounded-lg border border-stone-200 bg-white p-3">
          <h2 className="text-xs text-stone-500">Budget prévu (notaire)</h2>
          <p className="text-lg font-semibold tabular-nums">{formatCents(status.budget)}</p>
          <dl className="mt-2 space-y-0.5 text-sm">
            <Line label="Dépensé" cents={status.spent} />
            {status.overrun > 0 ? (
              <Line label="Dépassement (partagé 70/30)" cents={status.overrun} className="font-medium text-red-700" />
            ) : (
              <Line label="Reste au budget" cents={status.budget - status.spent} />
            )}
          </dl>
        </div>
        <Person name="Patrick" share="70 %" s={status.patrick} />
        <Person name="Charlotte" share="30 %" s={status.charlotte} />
      </section>

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
                <th className="px-2.5 py-2"><span className="sr-only">Actions</span></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {expenses.map((e) => (
                <tr key={e.id} className={toPay(e) ? "bg-amber-50 hover:bg-amber-100" : "hover:bg-stone-50"}>
                  <td className="px-2.5 py-2 tabular-nums">{dateFormat.format(e.date)}</td>
                  <td className="px-2.5 py-2">
                    {e.category.name}
                    {e.kind === "CURRENT" && (
                      <span className="ml-1.5 rounded bg-stone-200 px-1.5 py-0.5 text-xs text-stone-600" title="Dépense courante : non partagée">
                        courante
                      </span>
                    )}
                  </td>
                  <td className="max-w-56 truncate px-2.5 py-2" title={e.description}>
                    {toPay(e) && (
                      <span className="mr-1.5 rounded bg-amber-200 px-1.5 py-0.5 text-xs font-medium text-amber-900" title="Aucun justificatif de paiement">
                        À payer
                      </span>
                    )}
                    {e.description}
                  </td>
                  <td className="px-2.5 py-2">{e.supplier}</td>
                  <Money cents={decimalToCents(e.amount)} bold />
                  <td className="px-2.5 py-2">{PAYER_LABELS[e.paidBy]}</td>
                  {e.kind === "SHARED" ? (
                    <>
                      <Money cents={decimalToCents(e.sharePatrick)} />
                      <Money cents={decimalToCents(e.shareCharlotte)} />
                      <Money cents={decimalToCents(e.owedByCharlotte)} signed />
                    </>
                  ) : (
                    <td colSpan={3} className="px-2.5 py-2 text-center text-xs text-stone-500">non partagée</td>
                  )}
                  <td className="space-x-2 px-2.5 py-2 text-base">
                    <FileViewer
                      id={e.id}
                      caption={`${dateFormat.format(e.date)} · ${e.description} — ${e.supplier}`}
                      files={[
                        { kind: "facture", title: "Facture", label: "📄", name: e.invoiceName, external: !!e.invoicePath?.startsWith("https://") },
                        { kind: "justificatif", title: "Justificatif de paiement", label: "🧾", name: e.proofName, external: !!e.proofPath?.startsWith("https://") },
                        ...(e.proof2Name
                          ? [{ kind: "justificatif-2", title: "Justificatif 2", label: "🧾", name: e.proof2Name, external: !!e.proof2Path?.startsWith("https://") }]
                          : []),
                      ]}
                    />
                  </td>
                  <td className="px-1 py-2 text-right">
                    <Link
                      href={`/depenses/${e.id}/modifier`}
                      title="Modifier"
                      aria-label={`Modifier ${e.description} — ${e.supplier}`}
                      className="rounded px-1.5 text-base opacity-60 hover:bg-stone-100 hover:opacity-100"
                    >
                      ✏️
                    </Link>
                    <DeleteButton id={e.id} label={`${e.description} — ${e.supplier}`} />
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="border-t-2 border-stone-300 bg-stone-100 font-semibold">
              <tr>
                <td className="px-2.5 py-2" colSpan={4}>Total partagé (achat / travaux)</td>
                <Money cents={sum.amount} />
                <td />
                <Money cents={sum.sharePatrick} />
                <Money cents={sum.shareCharlotte} />
                <Money cents={sum.owedByCharlotte} signed />
                <td colSpan={2} />
              </tr>
              {decimalToCents(current._sum.amount) > 0 && (
                <tr className="font-normal text-stone-600">
                  <td className="px-2.5 py-2" colSpan={4}>Dépenses courantes (non partagées)</td>
                  <Money cents={decimalToCents(current._sum.amount)} />
                  <td colSpan={6} />
                </tr>
              )}
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

function Line({ label, cents, className = "" }: { label: string; cents: number; className?: string }) {
  return (
    <div className={`flex justify-between gap-2 ${className}`}>
      <dt>{label}</dt>
      <dd className="tabular-nums">{formatCents(cents)}</dd>
    </div>
  );
}

// Situation d'un indivisaire face à son engagement : reste à verser, ou avance à récupérer.
function Person({ name, share, s }: { name: string; share: string; s: PersonStatus }) {
  const ahead = s.balance > 0;
  return (
    <div className={`rounded-lg border p-3 ${ahead ? "border-green-700 bg-green-50" : "border-stone-200 bg-white"}`}>
      <h2 className="text-xs text-stone-500">
        {name} · engagement {share}
      </h2>
      <p className="text-lg font-semibold tabular-nums">{formatCents(s.commitment)}</p>
      <dl className="mt-2 space-y-0.5 text-sm">
        <Line label="Payé" cents={s.paid} />
        {s.due !== s.commitment && <Line label="Part due (avec dépassement)" cents={s.due} />}
        {ahead ? (
          <Line label="Avance à récupérer" cents={s.balance} className="font-semibold text-green-800" />
        ) : s.balance < 0 ? (
          <Line label="Reste à verser" cents={-s.balance} className="font-medium" />
        ) : (
          <Line label="Engagement tenu" cents={0} className="font-medium" />
        )}
      </dl>
    </div>
  );
}

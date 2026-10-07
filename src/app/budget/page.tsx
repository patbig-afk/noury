import Link from "next/link";
import { connection } from "next/server";
import { formatPercent, type BudgetStatus, type ProjectCost } from "@/lib/budget";
import { loadBudget } from "@/lib/budget-data";
import { prisma } from "@/lib/prisma";
import { decimalToCents, formatCents } from "@/lib/split";
import { Nav } from "../nav";
import { assignExpense } from "./actions";
import { BudgetAmountForm } from "./budget-amount-form";

const dateFormat = new Intl.DateTimeFormat("fr-FR", { timeZone: "UTC" });

const BAR_COLOR: Record<BudgetStatus, string> = {
  ok: "bg-stone-800",
  warning: "bg-amber-500",
  over: "bg-red-600",
};

export default async function BudgetPage() {
  await connection();
  const [{ lines, rows, total, outOfBudget, cost }, unassigned] = await Promise.all([
    loadBudget(),
    prisma.expense.findMany({
      where: { budgetLineId: null },
      include: { category: true },
      orderBy: { date: "desc" },
    }),
  ]);
  const notesById = new Map(lines.map((l) => [l.id, l.notes]));

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-6">
      <Nav current="/budget" />
      <h1 className="mb-1 text-xl font-semibold">Budget travaux</h1>
      <p className="mb-5 text-sm text-stone-500">Scénario Hybride (cave technique) · dépensé vs prévu par poste</p>

      <TotalCost cost={cost} />

      <h2 className="mb-3 font-semibold">Travaux par poste</h2>
      <dl className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Budget prévu" value={formatCents(total.budget)} />
        <Stat label="Dépensé" value={formatCents(total.spent)} />
        <Stat label={total.remaining < 0 ? "Dépassement" : "Reste"} value={formatCents(Math.abs(total.remaining))} danger={total.remaining < 0} />
        <Stat label="Consommé" value={formatPercent(total.ratio)} highlight />
      </dl>

      <ul className="space-y-2">
        {rows.map((r) => (
          <li key={r.id} className="rounded-lg border border-stone-200 bg-white p-3">
            <div className="flex items-baseline justify-between gap-3">
              <Link href={`/depenses?poste=${r.id}`} className="font-medium hover:underline">
                {r.name}
              </Link>
              <span className={`text-sm font-medium tabular-nums ${r.status === "over" ? "text-red-700" : r.status === "warning" ? "text-amber-700" : "text-stone-500"}`}>
                {r.status === "over" && "⚠️ "}
                {formatPercent(r.ratio)}
              </span>
            </div>
            <div className="my-2 h-2 overflow-hidden rounded-full bg-stone-100" role="presentation">
              <div className={`h-full ${BAR_COLOR[r.status]}`} style={{ width: `${Math.min(r.ratio, 1) * 100}%` }} />
            </div>
            <div className="flex flex-wrap items-baseline justify-between gap-x-3 text-sm tabular-nums text-stone-600">
              <span>
                {formatCents(r.spent)} / {formatCents(r.budget)}
              </span>
              <span className={r.remaining < 0 ? "font-medium text-red-700" : ""}>
                {r.remaining < 0 ? `Dépassé de ${formatCents(-r.remaining)}` : `Reste ${formatCents(r.remaining)}`}
              </span>
            </div>
            {notesById.get(r.id) && (
              <p className="mt-2 rounded bg-stone-50 px-2 py-1.5 text-sm whitespace-pre-line text-stone-700">📝 {notesById.get(r.id)}</p>
            )}
            <details className="mt-1 text-sm">
              <summary className="cursor-pointer text-stone-500">Modifier budget / notes</summary>
              <BudgetAmountForm id={r.id} name={r.name} budgetCents={r.budget} notes={notesById.get(r.id) ?? null} />
            </details>
          </li>
        ))}
      </ul>

      <section className="mt-8">
        <h2 className="mb-1 font-semibold">
          Hors budget travaux <span className="font-normal text-stone-500">· {formatCents(outOfBudget)}</span>
        </h2>
        <p className="mb-3 text-sm text-stone-500">
          Dépenses rattachées à aucun poste (notaire, achat…). Affecte celles qui relèvent des travaux.
        </p>
        {unassigned.length === 0 ? (
          <p className="rounded-lg bg-white p-4 text-center text-sm text-stone-500">Aucune dépense hors budget.</p>
        ) : (
          <ul className="divide-y divide-stone-100 rounded-lg border border-stone-200 bg-white">
            {unassigned.map((e) => (
              <li key={e.id} className="p-3 text-sm">
                <div className="flex items-baseline justify-between gap-3">
                  <span className="truncate" title={e.description}>
                    <span className="tabular-nums text-stone-500">{dateFormat.format(e.date)}</span> · {e.description}
                  </span>
                  <span className="font-medium tabular-nums">{formatCents(decimalToCents(e.amount))}</span>
                </div>
                <div className="text-stone-500">
                  {e.supplier} · {e.category.name}
                </div>
                <form action={assignExpense} className="mt-2 flex gap-2">
                  <input type="hidden" name="expenseId" value={e.id} />
                  <select name="budgetLineId" defaultValue="" aria-label="Poste du budget" className="field py-2">
                    <option value="">— Hors budget travaux</option>
                    {lines.map((l) => (
                      <option key={l.id} value={l.id}>{l.name}</option>
                    ))}
                  </select>
                  <button type="submit" className="btn-primary py-2">Affecter</button>
                </form>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}

// Coût total réel projeté vs budget de la déclaration notariée (qui sert au partage avec Charlotte).
function TotalCost({ cost }: { cost: ProjectCost }) {
  const over = cost.gap > 0;
  return (
    <section className="mb-8 rounded-lg border border-stone-900 bg-white p-4">
      <h2 className="mb-3 font-semibold">🏠 Coût total du projet</h2>
      <dl className="space-y-1 text-sm">
        <CostRow label="Achat & frais (réel, hors travaux)" cents={cost.purchase} />
        <CostRow label="+ Travaux (prévu, ou dépensé si dépassé)" cents={cost.works} />
        <CostRow label="= Coût total projeté" cents={cost.total} className="border-t border-stone-200 pt-1 text-base font-semibold" />
        <CostRow label="Budget de la déclaration notariée" cents={cost.notarial} className="text-stone-500" />
      </dl>
      <div className={`mt-3 rounded-lg p-3 text-sm ${over ? "bg-red-50 text-red-800" : "bg-green-50 text-green-800"}`}>
        <p className="flex justify-between gap-2 font-semibold">
          <span>{over ? "Dépassement vs notarié" : "Marge vs notarié"}</span>
          <span className="tabular-nums">{formatCents(Math.abs(cost.gap))}</span>
        </p>
        {over && (
          <p className="mt-1">
            À financer en plus, à 70/30 : Patrick {formatCents(cost.gapPatrick)} · Charlotte {formatCents(cost.gapCharlotte)}
          </p>
        )}
      </div>
    </section>
  );
}

function CostRow({ label, cents, className = "" }: { label: string; cents: number; className?: string }) {
  return (
    <div className={`flex justify-between gap-2 ${className}`}>
      <dt>{label}</dt>
      <dd className="tabular-nums">{formatCents(cents)}</dd>
    </div>
  );
}

function Stat({ label, value, highlight, danger }: { label: string; value: string; highlight?: boolean; danger?: boolean }) {
  const style = highlight
    ? "border-stone-900 bg-stone-900 text-white"
    : danger
      ? "border-red-200 bg-red-50 text-red-800"
      : "border-stone-200 bg-white";
  return (
    <div className={`rounded-lg border p-3 ${style}`}>
      <dt className={`text-xs ${highlight ? "text-stone-300" : "text-stone-500"}`}>{label}</dt>
      <dd className="text-lg font-semibold tabular-nums">{value}</dd>
    </div>
  );
}

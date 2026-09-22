import { connection } from "next/server";
import { prisma } from "@/lib/prisma";
import { simulateSale } from "@/lib/sale";
import { decimalToCents, formatCents, parseAmountToCents } from "@/lib/split";
import { Nav } from "../nav";

// Simulation de la vente : formulaire en GET, les montants restent dans l'URL (rien n'est enregistré).
export default async function SalePage({ searchParams }: PageProps<"/vente">) {
  await connection();
  const params = await searchParams;
  const read = (key: string) => (typeof params[key] === "string" ? params[key] : "");
  const price = parseAmountToCents(read("prix"));
  const saleCosts = parseAmountToCents(read("frais")) ?? 0;
  const loanRemaining = parseAmountToCents(read("pret")) ?? 0;

  const totals = await prisma.expense.aggregate({ where: { kind: "SHARED" }, _sum: { paidPatrick: true, paidCharlotte: true } });
  const paidPatrick = decimalToCents(totals._sum.paidPatrick);
  const paidCharlotte = decimalToCents(totals._sum.paidCharlotte);
  const sale = price ? simulateSale({ price, saleCosts, loanRemaining, paidPatrick, paidCharlotte }) : null;

  return (
    <main className="mx-auto w-full max-w-2xl px-4 py-6">
      <Nav current="/vente" />
      <h1 className="mb-1 text-xl font-semibold">Simulation de vente</h1>
      <p className="mb-5 text-sm text-stone-600">
        Sur la base des dépenses « achat / travaux » enregistrées. Les dépenses courantes n&apos;entrent pas dans le partage.
      </p>

      <form method="get" className="mb-6 space-y-4">
        <Amount name="prix" label="Prix de vente (€)" value={read("prix")} required />
        <Amount name="frais" label="Frais de vente : agence, diagnostics… (€)" value={read("frais")} />
        <Amount name="pret" label="Capital restant dû du prêt de Charlotte (€)" value={read("pret")} />
        <button type="submit" className="btn-primary w-full">Simuler</button>
      </form>

      {sale && (
        <div className="space-y-4">
          <dl className="space-y-1 rounded-lg border border-stone-200 bg-white p-4 text-sm">
            <Row label="Prix de vente" cents={price!} />
            <Row label="− Frais de vente" cents={-saleCosts} />
            <Row label="= Prix net" cents={sale.net} bold />
            <Row label="Total investi (achat + travaux)" cents={sale.invested} />
            <Row label={sale.gain >= 0 ? "Plus-value à partager 70/30" : "Moins-value à partager 70/30"} cents={sale.gain} bold />
          </dl>

          <div className="grid gap-3 sm:grid-cols-2">
            <Share
              name="Patrick · 70 %"
              lines={[
                ["Récupère sa mise", sale.patrick.invested],
                ["+ 70 % de la plus-value", sale.patrick.gainShare],
              ]}
              total={sale.patrick.total}
            />
            <Share
              name="Charlotte · 30 %"
              lines={[
                ["Récupère sa mise", sale.charlotte.invested],
                ["+ 30 % de la plus-value", sale.charlotte.gainShare],
                ...(loanRemaining ? ([["− Remboursement de son prêt", -loanRemaining]] as [string, number][]) : []),
              ]}
              total={loanRemaining ? sale.charlotte.afterLoan : sale.charlotte.total}
            />
          </div>

          <p className="text-xs text-stone-500">
            Mise remboursée au montant payé. La déclaration d&apos;origine des deniers renvoie à l&apos;article 815-13 du Code civil
            « sauf accord contraire des parties » : montant final à confirmer avec le notaire. Impôt sur la plus-value non
            calculé (exonérée pour une résidence principale).
          </p>
        </div>
      )}
    </main>
  );
}

function Amount({ name, label, value, required }: { name: string; label: string; value: string; required?: boolean }) {
  return (
    <label className="block">
      <span className="label">{label}</span>
      <input name={name} defaultValue={value} inputMode="decimal" autoComplete="off" required={required} placeholder="0,00" className="field" />
    </label>
  );
}

function Row({ label, cents, bold }: { label: string; cents: number; bold?: boolean }) {
  return (
    <div className={`flex justify-between gap-2 ${bold ? "font-semibold" : ""}`}>
      <dt>{label}</dt>
      <dd className="tabular-nums">{formatCents(cents)}</dd>
    </div>
  );
}

function Share({ name, lines, total }: { name: string; lines: [string, number][]; total: number }) {
  return (
    <div className="rounded-lg border border-stone-900 bg-white p-4">
      <h2 className="mb-2 text-sm text-stone-500">{name}</h2>
      <dl className="space-y-1 text-sm">
        {lines.map(([label, cents]) => (
          <Row key={label} label={label} cents={cents} />
        ))}
      </dl>
      <p className="mt-2 flex justify-between border-t border-stone-200 pt-2 text-lg font-semibold">
        <span>Touche</span>
        <span className="tabular-nums">{formatCents(total)}</span>
      </p>
    </div>
  );
}

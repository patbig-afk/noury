"use client";

import { useActionState } from "react";
import { updateBudgetLine, type BudgetAmountState } from "./actions";

// Appel protégé : si la page date d'avant un déploiement, l'action serveur n'existe plus.
async function submit(prev: BudgetAmountState, formData: FormData): Promise<BudgetAmountState> {
  try {
    return await updateBudgetLine(prev, formData);
  } catch {
    return { error: "La page n'est plus à jour : recharge-la puis réessaie." };
  }
}

export function BudgetAmountForm({ id, name, budgetCents, notes }: { id: string; name: string; budgetCents: number; notes: string | null }) {
  const [state, action, pending] = useActionState(submit, {});
  return (
    <form action={action} className="mt-2 space-y-2">
      <input type="hidden" name="id" value={id} />
      <label className="block">
        <span className="label">Budget (€)</span>
        <input
          name="amount"
          inputMode="decimal"
          autoComplete="off"
          defaultValue={(budgetCents / 100).toFixed(2).replace(".", ",")}
          aria-label={`Budget ${name} (€)`}
          className="field"
        />
      </label>
      <label className="block">
        <span className="label">Notes</span>
        <textarea
          name="notes"
          rows={3}
          maxLength={2000}
          defaultValue={notes ?? ""}
          aria-label={`Notes ${name}`}
          placeholder="ex : devis Alliance signé, reste à choisir le carrelage…"
          className="field"
        />
      </label>
      <button type="submit" disabled={pending} className="btn-primary w-full py-2">
        {pending ? "Enregistrement…" : "Enregistrer"}
      </button>
      {state.error && <p role="alert" className="error">{state.error}</p>}
      {state.saved && !pending && <p role="status" className="mt-1 text-sm text-green-700">✅ Enregistré (budget {state.saved})</p>}
    </form>
  );
}

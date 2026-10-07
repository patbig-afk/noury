"use client";

import { useActionState } from "react";
import { updateBudgetAmount, type BudgetAmountState } from "./actions";

// Appel protégé : si la page date d'avant un déploiement, l'action serveur n'existe plus.
async function submit(prev: BudgetAmountState, formData: FormData): Promise<BudgetAmountState> {
  try {
    return await updateBudgetAmount(prev, formData);
  } catch {
    return { error: "La page n'est plus à jour : recharge-la puis réessaie." };
  }
}

export function BudgetAmountForm({ id, name, budgetCents }: { id: string; name: string; budgetCents: number }) {
  const [state, action, pending] = useActionState(submit, {});
  return (
    <form action={action} className="mt-2">
      <div className="flex gap-2">
        <input type="hidden" name="id" value={id} />
        <input
          name="amount"
          inputMode="decimal"
          autoComplete="off"
          defaultValue={(budgetCents / 100).toFixed(2).replace(".", ",")}
          aria-label={`Budget ${name} (€)`}
          className="field"
        />
        <button type="submit" disabled={pending} className="btn-primary py-2">
          {pending ? "…" : "OK"}
        </button>
      </div>
      {state.error && <p role="alert" className="error">{state.error}</p>}
      {state.saved && !pending && <p role="status" className="mt-1 text-sm text-green-700">✅ Budget enregistré : {state.saved}</p>}
    </form>
  );
}

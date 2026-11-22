"use client";

import { useActionState } from "react";
import { exportBudgetSheet, type ExportState } from "./actions";

// Appel protégé : si la page date d'avant un déploiement, l'action serveur n'existe plus.
async function run(): Promise<ExportState> {
  try {
    return await exportBudgetSheet();
  } catch {
    return { error: "La page n'est plus à jour : recharge-la puis réessaie." };
  }
}

export function ExportButton() {
  const [state, action, pending] = useActionState(run, {});
  return (
    <form action={action} className="mb-5">
      <button type="submit" disabled={pending} className="btn-primary w-full py-2 sm:w-auto sm:px-4">
        {pending ? "Création du Google Sheet…" : "📤 Exporter la synthèse (Google Sheet)"}
      </button>
      {state.url && !pending && (
        <p role="status" className="mt-2 text-sm text-green-700">
          ✅ Sheet créé et partagé avec toi :{" "}
          <a href={state.url} target="_blank" rel="noreferrer" className="underline">ouvrir</a>
        </p>
      )}
      {state.error && <p role="alert" className="error mt-2">{state.error}</p>}
    </form>
  );
}

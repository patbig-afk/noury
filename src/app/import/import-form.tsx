"use client";

import Link from "next/link";
import { useActionState } from "react";
import { importSheet } from "./actions";

export function ImportForm() {
  const [report, action, pending] = useActionState(importSheet, null);

  return (
    <div className="space-y-5">
      <form action={action} className="space-y-4">
        <label className="block">
          <span className="label">Fichier CSV</span>
          <input name="csv" type="file" accept=".csv,text/csv" required className="file-field" />
        </label>
        <button type="submit" disabled={pending} className="btn-primary w-full">
          {pending ? "Import en cours…" : "Importer"}
        </button>
      </form>

      {report && (
        <div role="status" className="space-y-2 rounded-lg border border-stone-200 bg-white p-4 text-sm">
          <p>✅ {report.imported} dépense(s) importée(s)</p>
          {report.duplicates > 0 && <p>⏭️ {report.duplicates} déjà présente(s), ignorée(s)</p>}
          {report.errors.length > 0 && (
            <div className="text-red-700">
              <p>⚠️ {report.errors.length} ligne(s) non importée(s) :</p>
              <ul className="mt-1 list-disc pl-5">
                {report.errors.map((e) => (
                  <li key={e.line}>{e.line > 0 ? `Ligne ${e.line} : ${e.message}` : e.message}</li>
                ))}
              </ul>
            </div>
          )}
          {report.imported > 0 && (
            <Link href="/depenses" className="inline-block pt-1 font-medium underline">
              Voir les dépenses →
            </Link>
          )}
        </div>
      )}
    </div>
  );
}

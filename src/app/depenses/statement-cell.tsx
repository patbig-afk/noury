"use client";

import { useState, useTransition } from "react";
import { FILE_ACCEPT } from "@/lib/files";
import { attachStatement } from "./actions";
import { uploadToBlob } from "./expense-form";
import { FileViewer } from "./file-viewer";

// Colonne « Relevé » : ouvre le relevé bancaire, ou permet d'en envoyer un directement depuis la liste.
export function StatementCell({
  id,
  caption,
  name,
  external,
  filesEnabled,
}: {
  id: string;
  caption: string;
  name: string | null;
  external: boolean;
  filesEnabled: boolean;
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function onFile(file: File | undefined) {
    if (!file) return;
    setError(null);
    startTransition(async () => {
      try {
        const result = await attachStatement(id, await uploadToBlob(file), file.name);
        if (result.error) setError(result.error);
      } catch (e) {
        setError(`Échec de l'envoi : ${(e as Error).message}`);
      }
    });
  }

  if (name) {
    return <FileViewer id={id} caption={caption} files={[{ kind: "releve", title: "Relevé bancaire", label: "🏦", name, external }]} />;
  }
  if (!filesEnabled) return <span className="opacity-20" title="Envoi de fichiers indisponible">🏦</span>;

  return (
    <label
      title="Ajouter le relevé bancaire"
      className="inline-flex cursor-pointer items-center gap-1 rounded border border-dashed border-stone-300 px-1.5 py-0.5 text-xs text-stone-500 hover:border-stone-500 hover:text-stone-800 has-focus-visible:ring-2 has-focus-visible:ring-stone-400"
    >
      {pending ? "Envoi…" : "＋ 🏦"}
      <input
        type="file"
        accept={FILE_ACCEPT}
        disabled={pending}
        className="sr-only"
        aria-label="Ajouter le relevé bancaire"
        onChange={(e) => onFile(e.target.files?.[0])}
      />
      {error && <span role="alert" className="text-red-600">{error}</span>}
    </label>
  );
}

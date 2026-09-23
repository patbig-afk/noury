"use client";

import { useEffect, useRef, useState } from "react";

export type ViewerFile = {
  kind: string;
  title: string;
  label: string;
  name: string | null;
  /** Lien Drive : toujours affiché en iframe (page d'aperçu Google). */
  external: boolean;
};

const IMAGE_EXT = /\.(png|jpe?g|gif|webp|avif|heic|heif)$/i;

// Icônes des fichiers d'une dépense ; un clic ouvre la visionneuse (← → pour passer d'un fichier à l'autre).
export function FileViewer({ id, caption, files }: { id: string; caption: string; files: ViewerFile[] }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const available = files.filter((f) => f.name);
  const [index, setIndex] = useState<number | null>(null);
  const current = index === null ? null : available[index];

  useEffect(() => {
    if (index !== null && !dialog.current?.open) dialog.current?.showModal();
  }, [index]);

  const move = (step: number) => setIndex((i) => (i === null ? i : (i + step + available.length) % available.length));

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (available.length < 2) return;
    if (e.key === "ArrowRight") move(1);
    if (e.key === "ArrowLeft") move(-1);
  };

  const src = (f: ViewerFile) => `/api/files/${id}/${f.kind}`;

  return (
    <>
      {files.map((f) =>
        f.name ? (
          <button
            key={f.kind}
            type="button"
            onClick={() => setIndex(available.indexOf(f))}
            title={`${f.title} : ${f.name}`}
            aria-label={`Voir ${f.title.toLowerCase()}`}
          >
            {f.label}
          </button>
        ) : (
          <span key={f.kind} className="opacity-20" title={`${f.title} : aucun fichier`}>
            {f.label}
          </span>
        ),
      )}

      <dialog
        ref={dialog}
        onClose={() => setIndex(null)}
        onKeyDown={onKeyDown}
        onClick={(e) => e.target === dialog.current && dialog.current.close()}
        className="m-auto h-[92dvh] w-[min(64rem,96vw)] max-w-none rounded-lg bg-white p-0 shadow-xl backdrop:bg-black/60"
      >
        {current && (
          <div className="flex h-full flex-col">
            <header className="flex items-center gap-2 border-b border-stone-200 px-3 py-2 text-sm">
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">{current.title} · {current.name}</p>
                <p className="truncate text-xs text-stone-500">{caption}</p>
              </div>
              {available.length > 1 && (
                <span className="flex items-center gap-1 tabular-nums text-stone-600">
                  <button type="button" onClick={() => move(-1)} className="rounded px-2 py-1 hover:bg-stone-100" aria-label="Fichier précédent">←</button>
                  {index! + 1}/{available.length}
                  <button type="button" onClick={() => move(1)} className="rounded px-2 py-1 hover:bg-stone-100" aria-label="Fichier suivant">→</button>
                </span>
              )}
              <a href={src(current)} target="_blank" rel="noreferrer" className="rounded px-2 py-1 hover:bg-stone-100" title="Télécharger / ouvrir">⬇️</a>
              <button type="button" onClick={() => dialog.current?.close()} className="rounded px-2 py-1 hover:bg-stone-100" aria-label="Fermer">✕</button>
            </header>
            <div className="min-h-0 flex-1 bg-stone-100">
              {!current.external && IMAGE_EXT.test(current.name!) ? (
                // eslint-disable-next-line @next/next/no-img-element -- fichier privé servi par l'API, pas d'optimisation possible
                <img src={`${src(current)}?apercu=1`} alt={current.title} className="h-full w-full object-contain" />
              ) : (
                <iframe key={current.kind} src={`${src(current)}?apercu=1`} title={current.title} className="h-full w-full" />
              )}
            </div>
          </div>
        )}
      </dialog>
    </>
  );
}

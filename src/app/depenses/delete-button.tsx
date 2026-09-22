"use client";

import { useTransition } from "react";
import { deleteExpense } from "./actions";

export function DeleteButton({ id, label }: { id: string; label: string }) {
  const [pending, startTransition] = useTransition();

  const onClick = () => {
    if (!confirm(`Supprimer « ${label} » ?\nLa dépense et ses fichiers seront définitivement effacés.`)) return;
    startTransition(async () => {
      const { error } = await deleteExpense(id);
      if (error) alert(error);
    });
  };

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={pending}
      title="Supprimer"
      aria-label={`Supprimer ${label}`}
      className="rounded px-1.5 text-base opacity-60 hover:bg-red-50 hover:opacity-100 disabled:opacity-30"
    >
      {pending ? "…" : "🗑️"}
    </button>
  );
}

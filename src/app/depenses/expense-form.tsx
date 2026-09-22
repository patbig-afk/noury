"use client";

import { upload } from "@vercel/blob/client";
import { useActionState, useState, useTransition, type FormEvent } from "react";
import { BLOB_FOLDER, FILE_ACCEPT } from "@/lib/files";
import { PAYER_LABELS, computeSplit, formatCents, parseAmountToCents, type Payer } from "@/lib/split";
import { createExpense, type ExpenseFormState } from "./actions";
import { NEW_CATEGORY } from "./constants";

type Category = { id: string; name: string };

// Envoie un fichier directement du navigateur vers le store Blob privé.
async function uploadFile(formData: FormData, field: "invoice" | "proof") {
  const file = formData.get(field);
  formData.delete(field);
  if (!(file instanceof File) || file.size === 0) return;

  const safeName = file.name.normalize("NFD").replace(/[^\w.-]+/g, "_");
  const blob = await upload(`${BLOB_FOLDER}/${safeName}`, file, {
    access: "private",
    handleUploadUrl: "/api/upload",
    multipart: file.size > 5 * 1024 * 1024,
  });
  formData.set(`${field}Path`, blob.pathname);
  formData.set(`${field}Name`, file.name);
}

async function submit(prev: ExpenseFormState, formData: FormData): Promise<ExpenseFormState> {
  try {
    await Promise.all([uploadFile(formData, "invoice"), uploadFile(formData, "proof")]);
  } catch (error) {
    return { ...prev, fieldErrors: {}, error: `Échec de l'envoi du fichier : ${(error as Error).message}` };
  }
  return createExpense(prev, formData);
}

export function ExpenseForm({ categories, today }: { categories: Category[]; today: string }) {
  const [state, formAction, pending] = useActionState(submit, { savedCount: 0 });
  const [, startTransition] = useTransition();

  // On soumet "à la main" pour que React ne vide pas le formulaire en cas d'erreur.
  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    startTransition(() => formAction(formData));
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      {state.lastSaved && !state.error && (
        <p role="status" className="rounded-lg bg-green-50 p-3 text-sm text-green-800">
          ✅ Dépense enregistrée : {state.lastSaved}
        </p>
      )}

      {/* La clé change après chaque enregistrement réussi → champs remis à zéro. */}
      <Fields key={state.savedCount} categories={categories} today={today} errors={state.fieldErrors ?? {}} />

      {state.error && (
        <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
          {state.error}
        </p>
      )}

      <button type="submit" disabled={pending} className="btn-primary w-full">
        {pending ? "Enregistrement…" : "Enregistrer la dépense"}
      </button>
    </form>
  );
}

function Fields({
  categories,
  today,
  errors,
}: {
  categories: Category[];
  today: string;
  errors: Partial<Record<string, string>>;
}) {
  const [categoryId, setCategoryId] = useState(categories[0]?.id ?? NEW_CATEGORY);
  const [amount, setAmount] = useState("");
  const [paidBy, setPaidBy] = useState<Payer>("PATRICK");

  const cents = parseAmountToCents(amount);
  const split = cents ? computeSplit(cents, paidBy) : null;

  return (
    <>
      <Field label="Date" error={errors.date}>
        <input name="date" type="date" defaultValue={today} required className="field" />
      </Field>

      <Field label="Catégorie" error={errors.categoryId}>
        <select name="categoryId" value={categoryId} onChange={(e) => setCategoryId(e.target.value)} className="field">
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
          <option value={NEW_CATEGORY}>➕ Nouvelle catégorie…</option>
        </select>
      </Field>

      {categoryId === NEW_CATEGORY && (
        <Field label="Nom de la nouvelle catégorie" error={errors.newCategory}>
          <input name="newCategory" required autoFocus className="field" placeholder="ex : Assurance" />
        </Field>
      )}

      <Field label="Description" error={errors.description}>
        <input name="description" required className="field" placeholder="ex : Acompte plomberie" />
      </Field>

      <Field label="Fournisseur" error={errors.supplier}>
        <input name="supplier" required className="field" placeholder="ex : Leroy Merlin" />
      </Field>

      <Field label="Montant total (€)" error={errors.amount}>
        <input
          name="amount"
          inputMode="decimal"
          autoComplete="off"
          required
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="field"
          placeholder="0,00"
        />
      </Field>

      <fieldset>
        <legend className="label">Payé par</legend>
        <div className="grid grid-cols-3 gap-2">
          {(Object.keys(PAYER_LABELS) as Payer[]).map((p) => (
            <label key={p} className="chip">
              <input
                type="radio"
                name="paidBy"
                value={p}
                checked={paidBy === p}
                onChange={() => setPaidBy(p)}
                className="sr-only"
              />
              {PAYER_LABELS[p]}
            </label>
          ))}
        </div>
        {errors.paidBy && <p className="error">{errors.paidBy}</p>}
      </fieldset>

      {split && (
        <dl className="grid grid-cols-2 gap-x-4 gap-y-1 rounded-lg bg-stone-100 p-3 text-sm">
          <dt>Part Patrick (70 %)</dt>
          <dd className="text-right tabular-nums">{formatCents(split.sharePatrick)}</dd>
          <dt>Part Charlotte (30 %)</dt>
          <dd className="text-right tabular-nums">{formatCents(split.shareCharlotte)}</dd>
          <dt>Patrick a payé</dt>
          <dd className="text-right tabular-nums">{formatCents(split.paidPatrick)}</dd>
          <dt>Charlotte a payé</dt>
          <dd className="text-right tabular-nums">{formatCents(split.paidCharlotte)}</dd>
          <dt className="font-medium">Surplus Patrick</dt>
          <dd className={`text-right font-medium tabular-nums ${split.surplusPatrick < 0 ? "text-red-700" : "text-green-700"}`}>
            {formatCents(split.surplusPatrick)}
          </dd>
        </dl>
      )}

      <Field label="Facture (PDF ou photo)">
        <input name="invoice" type="file" accept={FILE_ACCEPT} className="file-field" />
      </Field>

      <Field label="Justificatif de paiement (PDF ou capture)">
        <input name="proof" type="file" accept={FILE_ACCEPT} className="file-field" />
      </Field>
    </>
  );
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="label">{label}</span>
      {children}
      {error && <span className="error">{error}</span>}
    </label>
  );
}

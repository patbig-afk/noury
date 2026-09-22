import { Nav } from "../nav";
import { ImportForm } from "./import-form";

export default function ImportPage() {
  return (
    <main className="mx-auto w-full max-w-lg px-4 py-6">
      <Nav />
      <h1 className="mb-3 text-xl font-semibold">Importer le Google Sheet</h1>
      <ol className="mb-5 list-decimal space-y-1 pl-5 text-sm text-stone-600">
        <li>Ouvre le Sheet « Suivi_Depenses_Maison_Noury ».</li>
        <li>
          <b>Fichier → Télécharger → Valeurs séparées par des virgules (.csv)</b>.
        </li>
        <li>Dépose le fichier ci-dessous.</li>
      </ol>
      <p className="mb-5 rounded-lg bg-stone-100 p-3 text-sm text-stone-600">
        Les répartitions sont recalculées par l&apos;app. Les fichiers restent sur Google Drive (liens cliquables). Tu
        peux relancer l&apos;import sans risque : les lignes déjà présentes sont ignorées.
      </p>
      <ImportForm />
    </main>
  );
}

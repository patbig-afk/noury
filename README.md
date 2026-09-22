# 🏡 Dépenses Noury

Mini-app perso de suivi des dépenses de la maison en indivision (70 % Patrick / 30 % Charlotte).
Remplace le Google Sheet `Suivi_Depenses_Maison_Noury`.

**Stack** : Next.js 16 (App Router) · TypeScript · Prisma 7 + Postgres (Neon) · Vercel Blob (privé) · Tailwind 4

## Où est quoi

| Dossier / fichier | Rôle |
| --- | --- |
| `prisma/schema.prisma` | Structure de la base (dépenses, catégories) |
| `prisma/migrations/` | Historique de la base (inclut les 3 catégories par défaut) |
| `src/lib/split.ts` | Règles de répartition 70/30 et calcul de « Charlotte doit à Patrick » (testées dans `split.test.ts`) |
| `src/lib/sheet-import.ts` + `src/app/import/` | Import de l'historique depuis l'export CSV du Google Sheet (sans doublons) |
| `src/app/page.tsx` | Page « Nouvelle dépense » |
| `src/app/depenses/page.tsx` | Liste des dépenses : tri date/catégorie, totaux, téléchargements |
| `src/app/depenses/` | Formulaire + enregistrement (Server Action) |
| `src/app/api/upload` | Délivre un jeton d'upload : les fichiers vont direct du téléphone au Blob |
| `src/app/api/files/[id]/[kind]` | Téléchargement protégé d'une facture / d'un justificatif |

## Déployer sur Vercel

1. Importer le repo dans Vercel.
2. **Storage → Neon (Postgres)** : connecter au projet (crée `DATABASE_URL` + `DATABASE_URL_UNPOOLED`).
3. **Storage → Blob** : créer un store avec l'accès **Private**, le connecter (crée `BLOB_READ_WRITE_TOKEN`).
4. Déployer. Le build applique les migrations tout seul (`prisma migrate deploy`).

> ⚠️ La base doit être connectée **à tous les environnements** (Production + Preview) : les branches
> autres que `main` sont déployées en Preview. Sans base, le build s'arrête avec un message qui dit quoi faire.
> Noms de variables acceptés : `DATABASE_URL`, `POSTGRES_URL`, `POSTGRES_PRISMA_URL` (+ `DATABASE_URL_UNPOOLED` /
> `POSTGRES_URL_NON_POOLING` pour les migrations) — voir `db-url.mjs`.

## En local

```bash
cp .env.example .env.local   # puis remplir (vercel env pull .env.local marche aussi)
npm install
npx prisma migrate dev
npm run dev
npm test                     # tests des calculs
```

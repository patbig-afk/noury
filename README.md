# 🏡 Dépenses Noury

Mini-app perso de suivi des dépenses de la maison en indivision (70 % Patrick / 30 % Charlotte).
Remplace le Google Sheet `Suivi_Depenses_Maison_Noury`.

**Stack** : Next.js 16 (App Router) · TypeScript · Prisma 7 + Postgres (Neon) · Vercel Blob (privé) · Tailwind 4

## Où est quoi

| Dossier / fichier | Rôle |
| --- | --- |
| `prisma/schema.prisma` | Structure de la base (dépenses, catégories) |
| `prisma/migrations/` | Historique de la base (inclut les 3 catégories par défaut) |
| `src/lib/split.ts` | Règles de répartition 70/30 et calcul du surplus (testées dans `split.test.ts`) |
| `src/app/page.tsx` | Page « Nouvelle dépense » |
| `src/app/depenses/` | Formulaire + enregistrement (Server Action) |
| `src/app/api/upload` | Délivre un jeton d'upload : les fichiers vont direct du téléphone au Blob |
| `src/app/api/files/[id]/[kind]` | Téléchargement protégé d'une facture / d'un justificatif |
| `src/proxy.ts` + `src/lib/auth.ts` | Mot de passe unique → cookie signé 90 jours |

## Déployer sur Vercel

1. Importer le repo dans Vercel.
2. **Storage → Neon (Postgres)** : connecter au projet (crée `DATABASE_URL` + `DATABASE_URL_UNPOOLED`).
3. **Storage → Blob** : créer un store avec l'accès **Private**, le connecter (crée `BLOB_READ_WRITE_TOKEN`).
4. **Settings → Environment Variables** : ajouter `APP_PASSWORD` et `AUTH_SECRET` (`openssl rand -hex 32`).
5. Déployer. Le build applique les migrations tout seul (`prisma migrate deploy`).

## En local

```bash
cp .env.example .env.local   # puis remplir (vercel env pull .env.local marche aussi)
npm install
npx prisma migrate dev
npm run dev
npm test                     # tests des calculs
```

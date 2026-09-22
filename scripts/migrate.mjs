// Applique les migrations au moment du build Vercel, avec un message clair si la base n'est pas branchée.
import { spawnSync } from "node:child_process";
import { config } from "dotenv";
import { DIRECT_VARS, POOLED_VARS, directDatabaseUrl } from "../db-url.mjs";

config({ path: ".env.local", quiet: true });
config({ quiet: true });

if (!directDatabaseUrl()) {
  const env = process.env.VERCEL_ENV ? ` (environnement Vercel : ${process.env.VERCEL_ENV})` : "";
  console.error(`
❌ Aucune base de données trouvée${env}.
   Aucune de ces variables n'est définie : ${[...DIRECT_VARS, ...POOLED_VARS].join(", ")}.

   À faire dans Vercel → ton projet → Storage :
   1. Créer / connecter une base Neon (Postgres) à ce projet.
   2. Cocher les environnements Production ET Preview.
   3. Relancer le déploiement (Deployments → ⋯ → Redeploy).
`);
  process.exit(1);
}

const { status } = spawnSync("npx", ["prisma", "migrate", "deploy"], { stdio: "inherit" });
process.exit(status ?? 1);

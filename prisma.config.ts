import { config } from "dotenv";
import { defineConfig } from "prisma/config";

// En local, Next.js lit .env.local : on fait pareil pour la CLI Prisma.
// Sur Vercel, les variables sont déjà injectées.
config({ path: ".env.local", quiet: true });
config({ quiet: true });

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    // Les migrations passent par la connexion directe (non poolée) quand elle existe.
    url: process.env.DATABASE_URL_UNPOOLED ?? process.env.DATABASE_URL,
  },
});

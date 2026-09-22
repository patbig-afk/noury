// Adresse de la base Postgres. Selon la façon dont Neon / Vercel Postgres a été connecté,
// la variable ne porte pas toujours le même nom : on prend la première trouvée.

/** Connexion poolée : utilisée par l'app. */
export const POOLED_VARS = ["DATABASE_URL", "POSTGRES_PRISMA_URL", "POSTGRES_URL"];
/** Connexion directe : préférée pour les migrations. */
export const DIRECT_VARS = ["DATABASE_URL_UNPOOLED", "POSTGRES_URL_NON_POOLING"];

const firstSet = (names) => names.map((n) => process.env[n]).find(Boolean);

export const pooledDatabaseUrl = () => firstSet(POOLED_VARS);
export const directDatabaseUrl = () => firstSet([...DIRECT_VARS, ...POOLED_VARS]);

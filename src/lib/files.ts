export const ALLOWED_FILE_TYPES = ["application/pdf", "image/*"];
export const FILE_ACCEPT = "application/pdf,image/*";
export const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25 Mo
export const BLOB_FOLDER = "depenses";

/**
 * Store connecté soit en OIDC (BLOB_STORE_ID, défaut des nouveaux stores), soit par jeton.
 * La clé publique sert à vérifier les webhooks des uploads présignés.
 */
export const isBlobConfigured = () =>
  !!process.env.BLOB_WEBHOOK_PUBLIC_KEY &&
  (!!process.env.BLOB_STORE_ID || !!process.env.BLOB_READ_WRITE_TOKEN?.startsWith("vercel_blob_rw_"));

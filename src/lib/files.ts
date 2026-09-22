export const ALLOWED_FILE_TYPES = ["application/pdf", "image/*"];
export const FILE_ACCEPT = "application/pdf,image/*";
export const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25 Mo
export const BLOB_FOLDER = "depenses";

/** Un vrai jeton de store Vercel Blob commence toujours par ce préfixe. */
export const isBlobConfigured = () => !!process.env.BLOB_READ_WRITE_TOKEN?.startsWith("vercel_blob_rw_");

import { createSign } from "node:crypto";

// Création d'un Google Sheet via un compte de service (sans dépendance externe).
// Variables d'environnement requises :
//   GOOGLE_SERVICE_ACCOUNT_EMAIL, GOOGLE_PRIVATE_KEY (clé PEM, \n échappés acceptés), GOOGLE_SHARE_EMAIL (qui reçoit le fichier)

export type SheetCell = string | number | null;
export type SheetTab = { title: string; rows: SheetCell[][] };

const SCOPES = "https://www.googleapis.com/auth/spreadsheets https://www.googleapis.com/auth/drive";

export function googleConfigured(): boolean {
  return Boolean(process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL && process.env.GOOGLE_PRIVATE_KEY && process.env.GOOGLE_SHARE_EMAIL);
}

const b64url = (input: string | Buffer) => Buffer.from(input).toString("base64url");

async function accessToken(): Promise<string> {
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL!;
  const key = process.env.GOOGLE_PRIVATE_KEY!.replace(/\\n/g, "\n");
  const now = Math.floor(Date.now() / 1000);
  const unsigned = `${b64url(JSON.stringify({ alg: "RS256", typ: "JWT" }))}.${b64url(
    JSON.stringify({ iss: email, scope: SCOPES, aud: "https://oauth2.googleapis.com/token", iat: now, exp: now + 3600 }),
  )}`;
  const signature = createSign("RSA-SHA256").update(unsigned).sign(key);
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: `${unsigned}.${b64url(signature)}`,
    }),
  });
  if (!res.ok) throw new Error(`Google auth ${res.status}: ${await res.text()}`);
  return ((await res.json()) as { access_token: string }).access_token;
}

async function google<T>(token: string, url: string, body: unknown): Promise<T> {
  const res = await fetch(url, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`Google ${res.status}: ${await res.text()}`);
  return (await res.json()) as T;
}

/** Crée un Google Sheet avec un onglet par entrée, le partage avec GOOGLE_SHARE_EMAIL et renvoie son URL. */
export async function createSpreadsheet(title: string, tabs: SheetTab[]): Promise<string> {
  const token = await accessToken();
  const created = await google<{ spreadsheetId: string; spreadsheetUrl: string }>(token, "https://sheets.googleapis.com/v4/spreadsheets", {
    properties: { title, locale: "fr_FR" },
    sheets: tabs.map((t) => ({ properties: { title: t.title } })),
  });

  await google(token, `https://sheets.googleapis.com/v4/spreadsheets/${created.spreadsheetId}/values:batchUpdate`, {
    valueInputOption: "RAW",
    data: tabs.map((t) => ({ range: `'${t.title}'!A1`, values: t.rows.map((r) => r.map((c) => c ?? "")) })),
  });

  await google(token, `https://www.googleapis.com/drive/v3/files/${created.spreadsheetId}/permissions?sendNotificationEmail=false`, {
    type: "user",
    role: "writer",
    emailAddress: process.env.GOOGLE_SHARE_EMAIL,
  });

  return created.spreadsheetUrl;
}

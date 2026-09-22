import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

// Protection mono-utilisateur : un mot de passe (APP_PASSWORD) → un cookie signé (AUTH_SECRET).
// Changer l'un des deux déconnecte toutes les sessions.

export const SESSION_COOKIE = "noury_session";
export const SESSION_MAX_AGE = 60 * 60 * 24 * 90; // 90 jours

function env(name: string) {
  const value = process.env[name];
  if (!value) throw new Error(`Variable d'environnement manquante : ${name}`);
  return value;
}

export function sessionToken() {
  return createHmac("sha256", env("AUTH_SECRET")).update(`noury:${env("APP_PASSWORD")}`).digest("hex");
}

function safeEqual(a: string, b: string) {
  const ba = Buffer.from(a);
  const bb = Buffer.from(b);
  return ba.length === bb.length && timingSafeEqual(ba, bb);
}

export function isValidToken(token: string | undefined) {
  return !!token && safeEqual(token, sessionToken());
}

export function isValidPassword(password: string) {
  return safeEqual(password, env("APP_PASSWORD"));
}

export async function isAuthenticated() {
  return isValidToken((await cookies()).get(SESSION_COOKIE)?.value);
}

/** À appeler en tête de chaque Server Action / route : le proxy seul ne suffit pas. */
export async function requireAuth() {
  if (!(await isAuthenticated())) throw new Error("Non autorisé");
}

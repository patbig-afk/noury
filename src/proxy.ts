import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, isValidToken } from "@/lib/auth";

export function proxy(request: NextRequest) {
  if (isValidToken(request.cookies.get(SESSION_COOKIE)?.value)) return NextResponse.next();

  const login = new URL("/login", request.url);
  if (request.nextUrl.pathname !== "/") login.searchParams.set("next", request.nextUrl.pathname);
  return NextResponse.redirect(login);
}

export const config = {
  // Tout est protégé sauf : la page de login, les assets Next, et /api/upload
  // (appelé aussi par Vercel Blob sans cookie ; la route vérifie elle-même l'auth).
  matcher: ["/((?!login|api/upload|_next/static|_next/image|favicon.ico|icon.svg).*)"],
};

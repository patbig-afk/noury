import { get } from "@vercel/blob";
import { isAuthenticated } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// Sert une facture ou un justificatif depuis le store Blob privé, après vérification de la session.
export async function GET(_request: Request, ctx: RouteContext<"/api/files/[id]/[kind]">) {
  if (!(await isAuthenticated())) return new Response("Non autorisé", { status: 401 });
  const { id, kind } = await ctx.params;
  if (kind !== "facture" && kind !== "justificatif") return new Response("Introuvable", { status: 404 });

  const expense = await prisma.expense.findUnique({ where: { id } });
  const path = kind === "facture" ? expense?.invoicePath : expense?.proofPath;
  const name = (kind === "facture" ? expense?.invoiceName : expense?.proofName) ?? kind;
  if (!path) return new Response("Introuvable", { status: 404 });

  const file = await get(path, { access: "private" });
  if (!file || file.statusCode !== 200) return new Response("Introuvable", { status: 404 });

  return new Response(file.stream, {
    headers: {
      "Content-Type": file.blob.contentType,
      "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(name)}`,
      "Cache-Control": "private, no-store",
    },
  });
}

import { get } from "@vercel/blob";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";

const FIELDS = {
  facture: { path: "invoicePath", name: "invoiceName" },
  justificatif: { path: "proofPath", name: "proofName" },
  "justificatif-2": { path: "proof2Path", name: "proof2Name" },
} as const;

// Sert une facture ou un justificatif depuis le store Blob privé.
// Les fichiers importés du Google Sheet sont des liens Drive : on redirige simplement vers eux.
export async function GET(_request: Request, ctx: RouteContext<"/api/files/[id]/[kind]">) {
  const { id, kind } = await ctx.params;
  if (!(kind in FIELDS)) return new Response("Introuvable", { status: 404 });
  const field = FIELDS[kind as keyof typeof FIELDS];

  const expense = await prisma.expense.findUnique({ where: { id } });
  const path = expense?.[field.path];
  const name = expense?.[field.name] ?? kind;
  if (!path) return new Response("Introuvable", { status: 404 });
  if (path.startsWith("https://")) redirect(path);

  const file = await get(path, { access: "private" }).catch((error) => {
    console.error("Lecture Blob impossible", path, error);
    return null;
  });
  if (!file || file.statusCode !== 200) return new Response("Fichier introuvable", { status: 404 });

  return new Response(file.stream, {
    headers: {
      "Content-Type": file.blob.contentType,
      "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(name)}`,
      "Cache-Control": "private, no-store",
    },
  });
}

import { get } from "@vercel/blob";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";

const FIELDS = {
  facture: { path: "invoicePath", name: "invoiceName" },
  justificatif: { path: "proofPath", name: "proofName" },
  "justificatif-2": { path: "proof2Path", name: "proof2Name" },
} as const;

// Types affichables dans la visionneuse (pas de SVG : il pourrait exécuter du script).
const PREVIEWABLE = /^(application\/pdf|image\/(png|jpe?g|gif|webp|avif|heic|heif))$/;

// Lien Drive → page d'aperçu intégrable dans une iframe.
function drivePreviewUrl(url: string) {
  const id = url.match(/\/file\/d\/([\w-]+)/)?.[1] ?? new URL(url).searchParams.get("id");
  return id ? `https://drive.google.com/file/d/${id}/preview` : url;
}

// Sert une facture ou un justificatif depuis le store Blob privé.
// ?apercu=1 : affichage dans le navigateur (visionneuse) plutôt que téléchargement.
// Les fichiers importés du Google Sheet sont des liens Drive : on redirige simplement vers eux.
export async function GET(request: Request, ctx: RouteContext<"/api/files/[id]/[kind]">) {
  const { id, kind } = await ctx.params;
  const preview = new URL(request.url).searchParams.has("apercu");
  if (!(kind in FIELDS)) return new Response("Introuvable", { status: 404 });
  const field = FIELDS[kind as keyof typeof FIELDS];

  const expense = await prisma.expense.findUnique({ where: { id } });
  const path = expense?.[field.path];
  const name = expense?.[field.name] ?? kind;
  if (!path) return new Response("Introuvable", { status: 404 });
  if (path.startsWith("https://")) redirect(preview ? drivePreviewUrl(path) : path);

  const file = await get(path, { access: "private" }).catch((error) => {
    console.error("Lecture Blob impossible", path, error);
    return null;
  });
  if (!file || file.statusCode !== 200) return new Response("Fichier introuvable", { status: 404 });

  const disposition = preview && PREVIEWABLE.test(file.blob.contentType) ? "inline" : "attachment";
  return new Response(file.stream, {
    headers: {
      "Content-Type": file.blob.contentType,
      "Content-Disposition": `${disposition}; filename*=UTF-8''${encodeURIComponent(name)}`,
      "X-Content-Type-Options": "nosniff",
      "Cache-Control": "private, no-store",
    },
  });
}

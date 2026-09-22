import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { NextResponse } from "next/server";
import { ALLOWED_FILE_TYPES, MAX_FILE_SIZE } from "@/lib/files";

// Délivre au navigateur un jeton d'upload temporaire : le fichier part directement
// du téléphone vers Vercel Blob, sans passer par la fonction serverless (limite 4,5 Mo).
export async function POST(request: Request) {
  const body = (await request.json()) as HandleUploadBody;

  try {
    const result = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async () => ({
        allowedContentTypes: ALLOWED_FILE_TYPES,
        maximumSizeInBytes: MAX_FILE_SIZE,
        addRandomSuffix: true,
      }),
      // Rien à faire ici : le chemin du fichier est enregistré avec la dépense.
      onUploadCompleted: async () => {},
    });
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 400 });
  }
}

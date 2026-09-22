import { issueSignedToken } from "@vercel/blob";
import { handleUploadPresigned, type HandleUploadPresignedBody } from "@vercel/blob/client";
import { NextResponse } from "next/server";
import { ALLOWED_FILE_TYPES, BLOB_FOLDER, MAX_FILE_SIZE } from "@/lib/files";

// Délivre au navigateur une URL d'upload présignée : le fichier part directement
// du téléphone vers Vercel Blob, sans passer par la fonction serverless (limite 4,5 Mo).
// Authentification du store via OIDC (BLOB_STORE_ID) ou, à défaut, BLOB_READ_WRITE_TOKEN.
export async function POST(request: Request) {
  const body = (await request.json()) as HandleUploadPresignedBody;

  try {
    const result = await handleUploadPresigned({
      body,
      request,
      getSignedToken: async (pathname) => {
        if (!pathname.startsWith(`${BLOB_FOLDER}/`)) throw new Error("Chemin de fichier invalide");
        const limits = { allowedContentTypes: ALLOWED_FILE_TYPES, maximumSizeInBytes: MAX_FILE_SIZE };
        const token = await issueSignedToken({ pathname, operations: ["put"], ...limits });
        return { token, urlOptions: { ...limits, addRandomSuffix: true } };
      },
    });
    return NextResponse.json(result);
  } catch (error) {
    console.error("URL d'upload Blob impossible à générer", error);
    return NextResponse.json({ error: (error as Error).message }, { status: 400 });
  }
}

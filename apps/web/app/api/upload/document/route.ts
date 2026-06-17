import { NextResponse } from "next/server";
import { getUploadAuthContext } from "@/lib/storage/upload-auth";
import { getDocsBucket, uploadToR2 } from "@/lib/storage/r2";
import { getR2ConfigError } from "@/lib/storage/r2-config";
import { MAX_DOCUMENT_SIZE_BYTES } from "@/lib/constants";
import { isProviderRole } from "@/lib/provider-role";

const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "application/pdf"]);
const ALLOWED_DOCUMENT_TYPES = new Set(["prc", "tesda", "nbi"]);

function extensionForType(contentType: string, fileName: string): string {
  switch (contentType) {
    case "image/jpeg":
      return "jpg";
    case "image/png":
      return "png";
    case "image/webp":
      return "webp";
    case "application/pdf":
      return "pdf";
    default: {
      const parts = fileName.split(".");
      return parts.length > 1 ? parts.pop()!.toLowerCase() : "bin";
    }
  }
}

export async function POST(request: Request) {
  try {
    const configError = getR2ConfigError();
    if (configError) {
      console.error("[upload/document] configuration error", configError);
      return NextResponse.json({ error: configError }, { status: 503 });
    }

    const auth = await getUploadAuthContext();
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    if (!auth.isAdmin && !isProviderRole(auth.role)) {
      return NextResponse.json(
        { error: "Document upload is only available for nurse and caregiver accounts." },
        { status: 403 }
      );
    }

    const formData = await request.formData();
    const file = formData.get("file");
    const documentType = String(formData.get("documentType") ?? "");
    const nurseId = String(formData.get("nurseId") ?? auth.userId);

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "File is required." }, { status: 400 });
    }

    if (!ALLOWED_DOCUMENT_TYPES.has(documentType)) {
      return NextResponse.json({ error: "Invalid document type." }, { status: 400 });
    }

    if (nurseId !== auth.userId && !auth.isAdmin) {
      return NextResponse.json({ error: "Forbidden." }, { status: 403 });
    }

    if (!ALLOWED_TYPES.has(file.type)) {
      return NextResponse.json({ error: "Use a JPG, PNG, WebP, or PDF file." }, { status: 400 });
    }

    if (file.size > MAX_DOCUMENT_SIZE_BYTES) {
      return NextResponse.json({ error: "File is too large. Maximum size is 5 MB." }, { status: 400 });
    }

    const extension = extensionForType(file.type, file.name);
    const storagePath = `${nurseId}/${documentType}/${Date.now()}.${extension}`;
    const buffer = Buffer.from(await file.arrayBuffer());

    console.info("[upload/document]", {
      nurseId,
      documentType,
      fileSize: file.size,
      contentType: file.type,
      bucket: getDocsBucket(),
      storagePath
    });

    const path = await uploadToR2(buffer, storagePath, getDocsBucket(), file.type);

    return NextResponse.json({ path });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Upload failed.";
    console.error("[upload/document] failed", message, error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

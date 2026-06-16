import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";
import { isProviderRole } from "@/lib/provider-role";
import { getUploadAuthContext } from "@/lib/storage/upload-auth";
import { compressProfilePhoto } from "@/lib/storage/compress-image";

const AVATARS_BUCKET = "avatars";
const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

export async function POST(request: Request) {
  try {
    const auth = await getUploadAuthContext();
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "File is required." }, { status: 400 });
    }

    if (!ALLOWED_TYPES.has(file.type)) {
      return NextResponse.json({ error: "Use a JPG, PNG, or WebP image." }, { status: 400 });
    }

    const input = Buffer.from(await file.arrayBuffer());
    const compressed = await compressProfilePhoto(input);
    const storagePath = `${auth.userId}/avatar.${compressed.extension}`;

    const service = createServiceClient();

    console.info("[upload/photo]", {
      userId: auth.userId,
      fileSize: file.size,
      contentType: compressed.contentType,
      bucket: AVATARS_BUCKET,
      storagePath
    });

    const { error: uploadError } = await service.storage
      .from(AVATARS_BUCKET)
      .upload(storagePath, compressed.buffer, {
        contentType: compressed.contentType,
        upsert: true
      });

    if (uploadError) {
      console.error("[upload/photo] storage upload failed", uploadError);
      return NextResponse.json({ error: uploadError.message }, { status: 500 });
    }

    const {
      data: { publicUrl }
    } = service.storage.from(AVATARS_BUCKET).getPublicUrl(storagePath);

    const { error: profileError } = await service
      .from("profiles")
      .update({ profile_photo_url: publicUrl })
      .eq("id", auth.userId);

    if (profileError) {
      console.error("[upload/photo] profile update failed", profileError);
      return NextResponse.json({ error: profileError.message }, { status: 500 });
    }

    if (isProviderRole(auth.role)) {
      const { error: nurseError } = await service
        .from("nurses")
        .update({ profile_photo_url: publicUrl })
        .eq("id", auth.userId);

      if (nurseError) {
        console.error("[upload/photo] nurse update failed", nurseError);
        return NextResponse.json({ error: nurseError.message }, { status: 500 });
      }
    }

    return NextResponse.json({ url: publicUrl, path: storagePath });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Upload failed.";
    console.error("[upload/photo] failed", message, error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

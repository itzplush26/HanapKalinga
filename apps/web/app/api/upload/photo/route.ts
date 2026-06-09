import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getUploadAuthContext } from "@/lib/storage/upload-auth";
import { compressProfilePhoto } from "@/lib/storage/compress-image";
import { getMediaBucket, getPublicMediaUrl, uploadToR2 } from "@/lib/storage/r2";

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
    const storagePath = `photos/${auth.userId}/${Date.now()}.${compressed.extension}`;

    console.info("[upload/photo]", {
      userId: auth.userId,
      fileSize: file.size,
      contentType: file.type,
      bucket: getMediaBucket(),
      storagePath
    });

    await uploadToR2(
      compressed.buffer,
      storagePath,
      getMediaBucket(),
      compressed.contentType
    );

    const url = getPublicMediaUrl(storagePath);

    const supabase = createClient();
    const { error: profileError } = await supabase
      .from("profiles")
      .update({ profile_photo_url: url })
      .eq("id", auth.userId);

    if (profileError) {
      console.error("[upload/photo] profile update failed", profileError);
      return NextResponse.json({ error: profileError.message }, { status: 500 });
    }

    if (auth.role === "nurse") {
      const { error: nurseError } = await supabase
        .from("nurses")
        .update({ profile_photo_url: url })
        .eq("id", auth.userId);

      if (nurseError) {
        console.error("[upload/photo] nurse update failed", nurseError);
        return NextResponse.json({ error: nurseError.message }, { status: 500 });
      }
    }

    return NextResponse.json({ url, path: storagePath });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Upload failed.";
    console.error("[upload/photo] failed", message, error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

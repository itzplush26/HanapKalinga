import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getSignedDocumentUrl, normalizeStoragePath } from "@/lib/storage/r2";

export async function GET(request: Request) {
  const supabase = createClient();
  const { data: auth } = await supabase.auth.getUser();

  if (!auth.user) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const path = searchParams.get("path");

  if (!path?.trim()) {
    return NextResponse.json({ error: "Path is required." }, { status: 400 });
  }

  const normalizedPath = normalizeStoragePath(path);
  const userId = auth.user.id;

  const { data: nurse } = await supabase
    .from("nurses")
    .select("prc_document_url, tesda_document_url, nbi_document_url")
    .eq("id", userId)
    .maybeSingle();

  const ownedPaths = [
    nurse?.prc_document_url,
    nurse?.tesda_document_url,
    nurse?.nbi_document_url
  ]
    .filter(Boolean)
    .map((value) => normalizeStoragePath(value as string));

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", userId).maybeSingle();
  const isAdmin = profile?.role === "admin";

  if (!isAdmin && !ownedPaths.includes(normalizedPath)) {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }

  try {
    const url = await getSignedDocumentUrl(normalizedPath);
    return NextResponse.json({ url });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to load document.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

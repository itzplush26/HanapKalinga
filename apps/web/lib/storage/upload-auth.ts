import { createClient } from "@/lib/supabase/server";

export type UploadAuthContext = {
  userId: string;
  isAdmin: boolean;
  role: string | null;
};

export async function getUploadAuthContext(): Promise<UploadAuthContext | null> {
  const supabase = createClient();
  const { data: auth } = await supabase.auth.getUser();

  if (!auth.user) {
    return null;
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", auth.user.id)
    .maybeSingle();

  return {
    userId: auth.user.id,
    isAdmin: profile?.role === "admin",
    role: profile?.role ?? null
  };
}

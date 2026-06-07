import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AdminShell } from "@/components/admin/admin-shell";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient();
  const { data: auth } = await supabase.auth.getUser();

  if (!auth.user) {
    redirect("/login?redirect=/admin");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, full_name")
    .eq("id", auth.user.id)
    .maybeSingle();

  if (profile?.role !== "admin") {
    redirect("/login?error=no_profile");
  }

  return <AdminShell adminName={profile.full_name ?? auth.user.email ?? "Administrator"}>{children}</AdminShell>;
}

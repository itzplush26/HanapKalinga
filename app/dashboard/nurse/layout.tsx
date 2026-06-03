import { redirect } from "next/navigation";
import { DashboardNav } from "@/components/dashboard-nav";
import { createClient } from "@/lib/supabase/server";

export default async function NurseDashboardLayout({
  children
}: {
  children: React.ReactNode;
}) {
  const supabase = createClient();
  const { data: auth } = await supabase.auth.getUser();

  if (!auth.user) {
    redirect("/login?redirect=/dashboard/nurse");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", auth.user.id)
    .single();

  if (profile?.role === "admin") {
    redirect("/admin");
  }

  if (profile?.role === "family") {
    redirect("/dashboard/family");
  }

  if (profile?.role !== "nurse") {
    redirect("/register");
  }

  return (
    <>
      <DashboardNav role="nurse" />
      {children}
    </>
  );
}

import { redirect } from "next/navigation";
import { DashboardNav } from "@/components/dashboard-nav";
import { createClient } from "@/lib/supabase/server";

export default async function FamilyDashboardLayout({
  children
}: {
  children: React.ReactNode;
}) {
  const supabase = createClient();
  const { data: auth } = await supabase.auth.getUser();

  if (!auth.user) {
    redirect("/login?redirect=/dashboard/family");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", auth.user.id)
    .single();

  if (profile?.role === "admin") {
    redirect("/admin");
  }

  if (profile?.role === "nurse") {
    redirect("/dashboard/nurse");
  }

  if (profile?.role !== "family") {
    redirect("/register");
  }

  return (
    <>
      <DashboardNav role="family" />
      {children}
    </>
  );
}

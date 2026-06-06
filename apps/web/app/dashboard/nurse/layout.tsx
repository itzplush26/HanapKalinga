import { redirect } from "next/navigation";
import { DashboardNav } from "@/components/dashboard-nav";
import { SignOutButton } from "@/components/sign-out-button";
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
    .maybeSingle();

  if (profile?.role === "admin") {
    redirect("/admin");
  }

  if (profile?.role === "family") {
    redirect("/dashboard/family");
  }

  if (!profile?.role) {
    redirect("/login?error=no_profile");
  }

  if (profile.role !== "nurse") {
    redirect("/login?error=no_profile");
  }

  return (
    <>
      <div className="flex items-center justify-end px-5 pt-2">
        <SignOutButton />
      </div>
      <DashboardNav role="nurse" />
      {children}
    </>
  );
}

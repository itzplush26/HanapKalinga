import { redirect } from "next/navigation";
import { DashboardShell } from "@/components/dashboard-shell";
import { LicenseExpiryGate } from "@/components/license-expiry-gate";
import { createClient } from "@/lib/supabase/server";
import { getDocumentExpiryItems } from "@/lib/license-expiry";
import { isProviderRole } from "@/lib/provider-role";

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

  if (!profile?.role || !isProviderRole(profile.role)) {
    redirect("/login?error=no_profile");
  }

  const { data: nurse } = await supabase
    .from("nurses")
    .select("provider_type, prc_license_expiry, tesda_cert_expiry, nbi_expiry")
    .eq("id", auth.user.id)
    .maybeSingle();

  const documentExpiry = getDocumentExpiryItems(nurse ?? {});

  return (
    <DashboardShell role="nurse">
      <LicenseExpiryGate documents={documentExpiry}>{children}</LicenseExpiryGate>
    </DashboardShell>
  );
}

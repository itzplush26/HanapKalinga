import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { resolveDocumentViewUrl } from "@/lib/storage-docs";
import { AdminBreadcrumbs } from "@/components/admin/admin-breadcrumbs";
import { AdminPageHeader } from "@/components/admin/admin-shell";
import { VerificationReviewPanel } from "@/components/admin/verification-review-panel";
import type { VerificationStatus } from "@/lib/verification";

interface AdminVerificationDetailPageProps {
  params: { id: string };
}

export default async function AdminVerificationDetailPage({ params }: AdminVerificationDetailPageProps) {
  const supabase = createClient();

  const { data: nurse } = await supabase
    .from("nurses")
    .select(
      "id, provider_type, verification_status, submitted_at, prc_document_url, tesda_document_url, nbi_document_url, prc_license_expiry, tesda_cert_expiry, nbi_expiry, bio, specializations, daily_rate_range, hourly_rate_range, profile_photo_url, profiles(full_name, city, region, barangay, phone, profile_photo_url)"
    )
    .eq("id", params.id)
    .maybeSingle();

  if (!nurse) {
    notFound();
  }

  const profile = Array.isArray(nurse.profiles) ? nurse.profiles[0] : nurse.profiles;

  const [prcSignedUrl, tesdaSignedUrl, nbiSignedUrl, auditResult] = await Promise.all([
    resolveDocumentViewUrl(nurse.prc_document_url),
    resolveDocumentViewUrl(nurse.tesda_document_url),
    resolveDocumentViewUrl(nurse.nbi_document_url),
    supabase
      .from("verification_audit_logs")
      .select("id, action, previous_status, new_status, rejection_reason, review_notes, created_at, admin_id")
      .eq("nurse_id", params.id)
      .order("created_at", { ascending: false })
  ]);

  const adminIds = [...new Set((auditResult.data ?? []).map((entry) => entry.admin_id))];
  const { data: adminProfiles } =
    adminIds.length > 0
      ? await supabase.from("profiles").select("id, full_name").in("id", adminIds)
      : { data: [] };

  const adminNameMap = new Map((adminProfiles ?? []).map((item) => [item.id, item.full_name ?? "Administrator"]));

  const auditLogs = (auditResult.data ?? []).map((entry) => ({
    ...entry,
    admin_name: adminNameMap.get(entry.admin_id) ?? "Administrator"
  }));

  return (
    <main>
      <AdminPageHeader
        title={profile?.full_name ?? "Applicant review"}
        description="Review documents, add internal notes, and update verification status."
        backHref="/admin/verifications"
        breadcrumbs={
          <AdminBreadcrumbs
            items={[
              { label: "Dashboard", href: "/admin" },
              { label: "Verification Management", href: "/admin/verifications" },
              { label: profile?.full_name ?? "Applicant Details" }
            ]}
          />
        }
      />
      <VerificationReviewPanel
        nurseId={nurse.id}
        fullName={profile?.full_name ?? "Applicant"}
        providerType={nurse.provider_type ?? "nurse"}
        city={profile?.city ?? null}
        region={profile?.region ?? null}
        barangay={profile?.barangay ?? null}
        phone={profile?.phone ?? null}
        submittedAt={nurse.submitted_at}
        status={nurse.verification_status as VerificationStatus}
        prcDocumentUrl={nurse.prc_document_url}
        tesdaDocumentUrl={nurse.tesda_document_url}
        nbiDocumentUrl={nurse.nbi_document_url}
        prcSignedUrl={prcSignedUrl}
        tesdaSignedUrl={tesdaSignedUrl}
        nbiSignedUrl={nbiSignedUrl}
        bio={nurse.bio}
        specializations={nurse.specializations}
        dailyRateRange={nurse.daily_rate_range}
        hourlyRateRange={nurse.hourly_rate_range}
        profilePhotoUrl={nurse.profile_photo_url ?? profile?.profile_photo_url ?? null}
        prcLicenseExpiry={nurse.prc_license_expiry}
        tesdaCertExpiry={nurse.tesda_cert_expiry}
        nbiExpiry={nurse.nbi_expiry}
        auditLogs={auditLogs}
      />
    </main>
  );
}

import { createServiceClient } from "@/lib/supabase/service";
import { AdminBreadcrumbs } from "@/components/admin/admin-breadcrumbs";
import { AdminPageHeader } from "@/components/admin/admin-shell";
import {
  VerificationQueue,
  type VerificationQueueNurse
} from "@/components/admin/verification-queue";
import type { VerificationStatus } from "@/lib/verification";

export const dynamic = "force-dynamic";

export default async function AdminVerificationsPage() {
  const service = createServiceClient();

  const { data: nurses, error } = await service
    .from("nurses")
    .select(
      "id, provider_type, verification_status, submitted_at, profile_photo_url, prc_document_url, tesda_document_url, nbi_document_url, prc_license_expiry, tesda_cert_expiry, nbi_expiry, bio, specializations, daily_rate_range, hourly_rate_range, profiles(full_name, first_name, last_name, city, region, profile_photo_url)"
    )
    .order("submitted_at", { ascending: false });

  if (error) {
    console.error("admin.verifications.list", error);
  }

  const emailEntries = await Promise.all(
    (nurses ?? []).map(async (nurse) => {
      const { data } = await service.auth.admin.getUserById(nurse.id);
      return [nurse.id, data.user?.email ?? null] as const;
    })
  );
  const emailMap = new Map(emailEntries);

  const queueNurses: VerificationQueueNurse[] = (nurses ?? []).map((nurse) => {
    const profile = Array.isArray(nurse.profiles) ? nurse.profiles[0] : nurse.profiles;
    return {
      id: nurse.id,
      provider_type: nurse.provider_type,
      verification_status: nurse.verification_status as VerificationStatus,
      submitted_at: nurse.submitted_at,
      profile_photo_url: nurse.profile_photo_url,
      prc_document_url: nurse.prc_document_url,
      tesda_document_url: nurse.tesda_document_url,
      nbi_document_url: nurse.nbi_document_url,
      prc_license_expiry: nurse.prc_license_expiry,
      tesda_cert_expiry: nurse.tesda_cert_expiry,
      nbi_expiry: nurse.nbi_expiry,
      bio: nurse.bio,
      specializations: nurse.specializations,
      daily_rate_range: nurse.daily_rate_range,
      hourly_rate_range: nurse.hourly_rate_range,
      email: emailMap.get(nurse.id) ?? null,
      profiles: profile ?? null
    };
  });

  return (
    <main>
      <AdminPageHeader
        title="Verification management"
        description="Review applicant documents, update statuses, and track audit history."
        backHref="/admin"
        breadcrumbs={
          <AdminBreadcrumbs
            items={[
              { label: "Dashboard", href: "/admin" },
              { label: "Verification Management" }
            ]}
          />
        }
      />

      <VerificationQueue initialNurses={queueNurses} />
    </main>
  );
}

import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { AdminBreadcrumbs } from "@/components/admin/admin-breadcrumbs";
import { AdminPageHeader } from "@/components/admin/admin-shell";
import {
  VerificationQueue,
  type VerificationQueueNurse
} from "@/components/admin/verification-queue";
import {
  fetchVerificationQueueRows,
  getAdminDataClient
} from "@/lib/admin/verification-queries";
import type { VerificationStatus } from "@/lib/verification";

export const dynamic = "force-dynamic";

async function fetchNurseEmails(nurseIds: string[]) {
  const emailMap = new Map<string, string | null>();

  if (nurseIds.length === 0) {
    return emailMap;
  }

  try {
    const service = createServiceClient();
    const entries = await Promise.all(
      nurseIds.map(async (nurseId) => {
        try {
          const { data } = await service.auth.admin.getUserById(nurseId);
          return [nurseId, data.user?.email ?? null] as const;
        } catch {
          return [nurseId, null] as const;
        }
      })
    );
    entries.forEach(([id, email]) => emailMap.set(id, email));
  } catch (error) {
    console.error("admin.verifications.emails", error);
  }

  return emailMap;
}

export default async function AdminVerificationsPage({
  searchParams
}: {
  searchParams?: { status?: string };
}) {
  const sessionClient = createClient();
  const adminClient = getAdminDataClient(sessionClient);

  const { data: nurses, error } = await fetchVerificationQueueRows(adminClient);

  if (error) {
    console.error("admin.verifications.list", error);
  }

  const emailMap = await fetchNurseEmails((nurses ?? []).map((nurse) => nurse.id));

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

  const initialTab = searchParams?.status;

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

      {error ? (
        <p className="mb-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          Could not load the verification queue. Ensure database migrations through 0027 are applied.
        </p>
      ) : null}

      <VerificationQueue initialNurses={queueNurses} initialTab={initialTab} />
    </main>
  );
}

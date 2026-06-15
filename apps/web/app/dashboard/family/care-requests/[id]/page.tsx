import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  CareRequestApplicationsPanel,
  type CareRequestApplicationItem
} from "@/components/care-request-applications-panel";
import { getDailyRateBand } from "@/lib/data/rates";
import { resolveProfilePhotoUrl } from "@/lib/storage/media-url";

function careRequestStatusBadgeClass(status: string) {
  switch (status) {
    case "filled":
      return "border border-success-border bg-success-bg text-success";
    case "closed":
      return "border border-border bg-surface-alt text-text-muted";
    default:
      return "border border-info-border bg-info-bg text-info";
  }
}

export default async function FamilyCareRequestDetailPage({
  params,
  searchParams
}: {
  params: { id: string };
  searchParams: { posted?: string };
}) {
  const supabase = createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) redirect("/login");

  const { data: request } = await supabase
    .from("care_requests")
    .select(
      "id, title, patient_condition, care_type, region, city, barangay, budget_band, duration_description, status, created_at, expires_at, required_specializations"
    )
    .eq("id", params.id)
    .eq("family_id", auth.user.id)
    .maybeSingle();

  if (!request) notFound();

  const { data: applicationRows } = await supabase
    .from("care_request_applications")
    .select(
      `
      id,
      status,
      cover_message,
      proposed_rate_band,
      created_at,
      nurse_id,
      nurses(
        provider_type,
        profile_photo_url,
        profile_slug,
        specializations,
        profiles!nurses_id_fkey(full_name, city)
      )
    `
    )
    .eq("care_request_id", params.id)
    .order("created_at", { ascending: false });

  const applications: CareRequestApplicationItem[] = (applicationRows ?? []).map((row) => {
    const nurse = Array.isArray(row.nurses) ? row.nurses[0] : row.nurses;
    const profile = Array.isArray(nurse?.profiles) ? nurse?.profiles[0] : nurse?.profiles;

    return {
      id: row.id as string,
      status: row.status as string,
      coverMessage: row.cover_message as string,
      proposedRateBand: (row.proposed_rate_band as string | null) ?? null,
      createdAt: row.created_at as string,
      nurseId: row.nurse_id as string,
      nurseName: profile?.full_name?.trim() || "Provider",
      nurseCity: (profile?.city as string | null) ?? null,
      providerType: (nurse?.provider_type as string | null) ?? null,
      profilePhotoUrl: resolveProfilePhotoUrl(nurse?.profile_photo_url as string | null),
      profileSlug: (nurse?.profile_slug as string | null) ?? null,
      specializations: (nurse?.specializations as string[]) ?? []
    };
  });

  const location = [request.barangay, request.city, request.region].filter(Boolean).join(", ");

  return (
    <>
      <PageHeader title="Care request" />
      <main className="px-5 py-6">
        <div className="mx-auto flex max-w-md flex-col gap-4">
          {searchParams.posted === "1" ? (
            <p className="rounded-2xl border border-success-border bg-success-bg px-4 py-3 text-sm text-success">
              Your care request is live. Verified nurses and caregivers in your area can now see it
              and apply.
            </p>
          ) : null}

          <div className="rounded-2xl border border-border bg-surface p-4">
            <div className="flex items-start justify-between gap-3">
              <h1 className="text-lg font-semibold text-text-primary">{request.title as string}</h1>
              <Badge className={careRequestStatusBadgeClass(request.status as string)}>
                {request.status as string}
              </Badge>
            </div>
            {location ? <p className="mt-2 text-sm text-text-secondary">{location}</p> : null}
            <p className="mt-3 text-sm text-text-secondary">{request.patient_condition as string}</p>
            <div className="mt-3 flex flex-wrap gap-1">
              <Badge className="border border-info-border bg-info-bg text-info">
                {(request.care_type as string).replaceAll("_", " ")}
              </Badge>
              {(request.required_specializations as string[]).map((item) => (
                <Badge key={item} className="border border-border bg-surface-alt text-text-secondary">
                  {item}
                </Badge>
              ))}
            </div>
            <p className="mt-3 text-sm text-text-secondary">
              Budget: {getDailyRateBand(request.budget_band as string)?.label ?? "Open"}
            </p>
            {request.duration_description ? (
              <p className="mt-1 text-sm text-text-secondary">
                Duration: {request.duration_description as string}
              </p>
            ) : null}
          </div>

          <CareRequestApplicationsPanel
            careRequestId={request.id as string}
            careRequestStatus={request.status as string}
            applications={applications}
          />

          <Button asChild variant="outline">
            <Link href="/dashboard/family/care-requests">Back to care requests</Link>
          </Button>
        </div>
      </main>
    </>
  );
}

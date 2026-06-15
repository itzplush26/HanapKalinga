import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { VerificationStatusBanner } from "@/components/verification-status-banner";
import { NotificationsPanel } from "@/components/notifications-panel";
import { NurseOnboardingChecklist } from "@/components/nurse-onboarding-checklist";
import { ShareProfileButton } from "@/components/share-profile-button";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/empty-state";
import { PageHeader } from "@/components/page-header";
import { Calendar } from "lucide-react";
import { isVerifiedProvider, type VerificationStatus } from "@/lib/verification";
import { appUrl } from "@/lib/email/templates/layout";

export default async function NurseDashboardPage() {
  const supabase = createClient();
  const { data: auth } = await supabase.auth.getUser();
  const userId = auth.user?.id ?? "";

  const [{ data: nurse }, { data: profile }, { data: availability }] = await Promise.all([
    supabase
      .from("nurses")
      .select(
        "verification_status, rejection_reason, bio, specializations, daily_rate_range, hourly_rate_range, profile_slug, prc_license_no, tesda_certificate_no, provider_type"
      )
      .eq("id", userId)
      .single(),
    supabase.from("profiles").select("profile_photo_url, full_name").eq("id", userId).single(),
    supabase
      .from("availability")
      .select("id")
      .eq("nurse_id", userId)
      .eq("is_open", true)
      .gte("date", new Date().toISOString().slice(0, 10))
      .limit(1)
  ]);

  const { data: bookings } = await supabase
    .from("bookings")
    .select("id, status, requested_date")
    .order("created_at", { ascending: false })
    .limit(3);

  const verificationStatus = (nurse?.verification_status ?? "pending") as VerificationStatus;
  const isVerified = isVerifiedProvider(verificationStatus);
  const providerType = (nurse?.provider_type ?? "nurse") as "nurse" | "caregiver";
  const hasLicenseNumber =
    providerType === "caregiver"
      ? Boolean(nurse?.tesda_certificate_no?.trim())
      : Boolean(nurse?.prc_license_no?.trim());

  const profileUrl = nurse?.profile_slug
    ? appUrl(`/nurses/${nurse.profile_slug}`)
    : appUrl(`/nurses/${userId}`);

  return (
    <>
      <PageHeader title="Home" showBack={false} />
      <main className="px-5 py-6">
        <div className="mx-auto flex max-w-md flex-col gap-6">
          <p className="text-sm text-slate-600">Manage your profile, verification status, and bookings.</p>
          <VerificationStatusBanner status={verificationStatus} rejectionReason={nurse?.rejection_reason} />
          <NurseOnboardingChecklist
            data={{
              hasPhoto: Boolean(profile?.profile_photo_url),
              profileComplete: Boolean(
                nurse?.bio &&
                  (nurse.specializations?.length ?? 0) > 0 &&
                  nurse.daily_rate_range &&
                  nurse.hourly_rate_range
              ),
              hasAvailability: (availability?.length ?? 0) > 0,
              hasLicenseNumber,
              verificationStatus,
              rejectionReason: nurse?.rejection_reason
            }}
          />
          {isVerified && (nurse?.profile_slug || profile?.full_name) ? (
            <ShareProfileButton profileUrl={profileUrl} nurseName={profile?.full_name ?? "Nurse"} variant="card" />
          ) : null}
          <NotificationsPanel />
          <div className="space-y-3">
            {(bookings ?? []).map((booking) => (
              <Link
                key={booking.id}
                href={`/dashboard/nurse/bookings/${booking.id}`}
                className="rounded-2xl border border-slate-200 bg-white p-3 text-sm"
              >
                Booking {booking.requested_date} - {booking.status}
              </Link>
            ))}
            {bookings?.length === 0 ? (
              <EmptyState
                icon={Calendar}
                title="No booking requests yet"
                description="Set your availability and complete your profile to start receiving requests."
              />
            ) : null}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Button asChild>
              <Link href="/dashboard/nurse/profile">Edit profile</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/dashboard/nurse/availability">Set availability</Link>
            </Button>
            <Button asChild variant="outline" className="col-span-2">
              <Link href="/dashboard/nurse/care-requests">Find work</Link>
            </Button>
          </div>
        </div>
      </main>
    </>
  );
}

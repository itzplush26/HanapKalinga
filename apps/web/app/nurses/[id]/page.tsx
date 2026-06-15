import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createAnonClient } from "@/lib/supabase/anon";
import { createClient } from "@/lib/supabase/server";
import { resolveNurseId } from "@/lib/nurse/resolve";
import { ShareProfileButton } from "@/components/share-profile-button";
import { ReviewBreakdown } from "@/components/review-breakdown";
import { ReportUserMenu } from "@/components/report-user-menu";
import { ProfileAvatar } from "@/components/profile-avatar";
import { PublicWeeklyAvailabilityGrid } from "@/components/public-weekly-availability-grid";
import { NurseProfileBookSection } from "@/components/nurse-profile-book-section";
import { appUrl } from "@/lib/email/templates/layout";
import { resolveProfilePhotoUrl } from "@/lib/storage/media-url";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { StarDisplay } from "@/components/star-display";
import { EmptyState } from "@/components/empty-state";
import { deriveAvailabilityStatus } from "@/lib/availability-status";
import { parseTooltipsDismissed } from "@/lib/family-onboarding";
import type { Shift } from "@/lib/availability-schedule";
import { formatDailyRateBandLabel, formatHourlyRateBandLabel } from "@/lib/data/rates";
import { Star } from "lucide-react";

export const revalidate = 3600;

interface NurseProfilePageProps {
  params: { id: string };
}

function hasConfiguredRate(
  band: string | null | undefined,
  min: number | null | undefined,
  max: number | null | undefined
): boolean {
  if (band?.trim()) return true;
  if (min != null && min > 0) return true;
  if (max != null && max > 0) return true;
  return false;
}

export async function generateStaticParams() {
  const supabase = createAnonClient();
  if (!supabase) return [];

  const { data } = await supabase
    .from("nurses")
    .select("id, profile_slug")
    .eq("verification_status", "verified");

  return (data ?? []).map((nurse) => ({
    id: nurse.profile_slug ?? nurse.id
  }));
}

export async function generateMetadata({ params }: NurseProfilePageProps): Promise<Metadata> {
  const supabase = createClient();
  const nurseId = await resolveNurseId(supabase, params.id);
  if (!nurseId) return { title: "Nurse not found" };

  const { data: nurse } = await supabase
    .from("nurses")
    .select("bio, profile_photo_url, profile_slug, profiles!nurses_id_fkey(full_name)")
    .eq("id", nurseId)
    .maybeSingle();

  const profile = Array.isArray(nurse?.profiles) ? nurse?.profiles[0] : nurse?.profiles;
  const name = profile?.full_name?.trim() || "Nurse";
  const slug = nurse?.profile_slug ?? nurseId;
  const image = resolveProfilePhotoUrl(nurse?.profile_photo_url) ?? appUrl("/og-default.png");
  const description = (nurse?.bio ?? "").slice(0, 160) || `${name} on HanapKalinga`;

  return {
    title: `${name} — HanapKalinga`,
    description,
    openGraph: {
      title: `${name} — Verified Healthcare Professional`,
      description,
      url: appUrl(`/nurses/${slug}`),
      type: "profile",
      images: [image]
    },
    twitter: { card: "summary_large_image", title: name, description, images: [image] }
  };
}

export default async function NurseProfilePage({ params }: NurseProfilePageProps) {
  const supabase = createClient();
  const nurseId = await resolveNurseId(supabase, params.id);

  if (!nurseId) {
    notFound();
  }

  const { data: auth } = await supabase.auth.getUser();
  let bookingHref = `/login?redirect=${encodeURIComponent(`/dashboard/family/bookings/new?nurse=${nurseId}`)}`;
  let isFamilyViewer = false;
  let showBookingTooltip = false;
  if (auth.user) {
    const [{ data: viewerProfile }, { data: familyRow }] = await Promise.all([
      supabase.from("profiles").select("role").eq("id", auth.user.id).maybeSingle(),
      supabase.from("families").select("tooltips_dismissed").eq("id", auth.user.id).maybeSingle()
    ]);
    if (viewerProfile?.role === "family") {
      isFamilyViewer = true;
      bookingHref = `/dashboard/family/bookings/new?nurse=${nurseId}`;
      const tooltips = parseTooltipsDismissed(familyRow?.tooltips_dismissed);
      showBookingTooltip = !tooltips.booking;
    }
  }

  const [{ data: nurse, error: nurseError }, { data: availability }, { data: weeklyAvailability }, { data: reviews }] =
    await Promise.all([
      supabase
        .from("nurses")
        .select(
          "id, provider_type, profile_slug, verification_status, specializations, years_experience, bio, hourly_rate, hourly_rate_max, hourly_rate_range, daily_rate_12hr, daily_rate_12hr_max, daily_rate_range, profile_photo_url, profiles!nurses_id_fkey(full_name, city, barangay, region)"
        )
        .eq("id", nurseId)
        .maybeSingle(),
      supabase
        .from("availability")
        .select("date, shift, is_open")
        .eq("nurse_id", nurseId)
        .eq("is_open", true)
        .gte("date", new Date().toISOString().slice(0, 10))
        .order("date", { ascending: true })
        .limit(14),
      supabase
        .from("provider_weekly_availability")
        .select("day_of_week, shift, is_open")
        .eq("nurse_id", nurseId),
      supabase
        .from("reviews")
        .select("id, rating, comment, created_at, reviewer_id, profiles!reviewer_id(full_name)")
        .eq("reviewee_id", nurseId)
        .order("created_at", { ascending: false })
    ]);

  if (nurseError) {
    console.error("nurse.profile.load", nurseError);
  }

  if (!nurse || nurse.verification_status !== "verified") {
    notFound();
  }

  const { data: ratingRow } = await supabase
    .from("provider_ratings")
    .select("average_rating, review_count")
    .eq("nurse_id", nurseId)
    .maybeSingle();

  const profile = Array.isArray(nurse.profiles) ? nurse.profiles[0] : nurse.profiles;
  const displayName = profile?.full_name?.trim() || "Nurse";
  const photoUrl = resolveProfilePhotoUrl(nurse.profile_photo_url);
  const weeklySlots = (weeklyAvailability ?? []).map((row) => ({
    dayOfWeek: row.day_of_week as number,
    shift: row.shift as Shift,
    isOpen: Boolean(row.is_open)
  }));
  const availabilitySlots = availability ?? [];
  const availabilityStatus = deriveAvailabilityStatus(
    availabilitySlots.map((slot) => ({ date: slot.date, is_open: slot.is_open }))
  );
  const availabilityText =
    availabilityStatus === "available_now"
      ? "Available now"
      : availabilityStatus === "available_next_week"
        ? "Available next week"
        : "Not accepting new clients";
  const availabilityClass =
    availabilityStatus === "available_now"
      ? "bg-emerald-100 text-emerald-700"
      : availabilityStatus === "available_next_week"
        ? "bg-amber-100 text-amber-700"
        : "bg-slate-100 text-slate-600";

  const hasHourlyRate = hasConfiguredRate(
    nurse.hourly_rate_range,
    nurse.hourly_rate,
    nurse.hourly_rate_max
  );
  const hasDailyRate = hasConfiguredRate(
    nurse.daily_rate_range,
    nurse.daily_rate_12hr,
    nurse.daily_rate_12hr_max
  );
  const hourlyRateLabel = hasHourlyRate
    ? formatHourlyRateBandLabel(nurse.hourly_rate_range, nurse.hourly_rate, nurse.hourly_rate_max)
    : null;
  const dailyRateLabel = hasDailyRate
    ? formatDailyRateBandLabel(nurse.daily_rate_range, nurse.daily_rate_12hr, nurse.daily_rate_12hr_max)
    : null;
  const ratesConfigured = hasHourlyRate || hasDailyRate;

  const rawAvg = ratingRow?.average_rating;
  const avgRating =
    rawAvg != null && !Number.isNaN(Number(rawAvg)) ? Number(rawAvg) : null;
  const reviewCount =
    ratingRow?.review_count != null && !Number.isNaN(Number(ratingRow.review_count))
      ? Number(ratingRow.review_count)
      : 0;
  const showRating = avgRating != null && reviewCount > 0;

  const specializations = (nurse.specializations ?? []).filter(Boolean);
  const bioText = nurse.bio?.trim() ?? "";
  const locationParts = [profile?.region, profile?.city, profile?.barangay].filter(Boolean);
  const profilePath = `/nurses/${nurse.profile_slug ?? nurseId}`;

  return (
    <main className="px-5 py-8">
      <div className="mx-auto flex max-w-md flex-col gap-6">
        <div className="space-y-3">
          <div className="flex items-start gap-4">
            <ProfileAvatar src={photoUrl} name={displayName} size="lg" />
            <div className="min-w-0 flex-1">
              <div className="flex items-start justify-between gap-3">
                <h1 className="text-2xl font-semibold text-navy-900">{displayName}</h1>
                <div className="flex shrink-0 items-center gap-2">
                  <ShareProfileButton
                    profileUrl={appUrl(profilePath)}
                    nurseName={displayName}
                  />
                  {auth.user ? (
                    <ReportUserMenu reportedUserId={nurseId} reportedUserName={displayName} />
                  ) : null}
                </div>
              </div>
              {locationParts.length > 0 ? (
                <p className="mt-1 text-sm text-slate-600">{locationParts.join(" • ")}</p>
              ) : (
                <p className="mt-1 text-sm text-slate-500">Location not listed yet</p>
              )}
            </div>
          </div>

          {showRating ? (
            <div className="flex items-center gap-2 text-sm">
              <StarDisplay rating={avgRating} size="sm" />
              <span className="font-semibold text-navy-900">{avgRating.toFixed(1)}</span>
              <span className="text-slate-500">({reviewCount} reviews)</span>
            </div>
          ) : (
            <p className="text-sm text-slate-500">No reviews yet</p>
          )}

          <Badge className={availabilityClass}>{availabilityText}</Badge>

          {specializations.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {specializations.map((item: string) => (
                <Badge key={item} className="bg-slate-100 text-slate-700">
                  {item}
                </Badge>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-500">Specializations not listed yet</p>
          )}

          {bioText ? (
            <p className="text-sm text-slate-600">{bioText}</p>
          ) : (
            <p className="text-sm italic text-slate-500">This provider hasn&apos;t added a bio yet</p>
          )}

          {ratesConfigured ? (
            <div className="grid grid-cols-2 gap-3 text-sm">
              <Card>
                <CardContent className="p-3">
                  <p className="text-xs text-slate-500">Hourly (expected)</p>
                  <p className="font-semibold">{hourlyRateLabel ?? "Rate on request"}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-3">
                  <p className="text-xs text-slate-500">Daily (expected)</p>
                  <p className="font-semibold">{dailyRateLabel ?? "Rate on request"}</p>
                </CardContent>
              </Card>
            </div>
          ) : (
            <p className="rounded-2xl border border-slate-200 bg-white p-3 text-sm text-slate-600">
              Rate not set — contact for details
            </p>
          )}

          <p className="text-xs text-slate-500">
            Rates shown are starting expectations. Final rates can be negotiated privately.
          </p>
        </div>

        <div className="space-y-3">
          <h2 className="text-lg font-semibold text-navy-900">Availability</h2>
          <PublicWeeklyAvailabilityGrid slots={weeklySlots} />
        </div>

        <div className="space-y-3">
          <h2 className="text-lg font-semibold text-navy-900">Reviews</h2>
          {showRating ? (
            <ReviewBreakdown
              reviews={(reviews ?? []).map((r) => ({ rating: Number(r.rating) || 0 }))}
              averageRating={avgRating}
              reviewCount={reviewCount}
            />
          ) : null}
          <div className="space-y-3 text-sm">
            {(reviews ?? []).map((review) => {
              const reviewerProfile = Array.isArray(review.profiles)
                ? review.profiles[0]
                : review.profiles;
              const firstName =
                reviewerProfile?.full_name?.trim().split(/\s+/)[0] ?? "Family member";
              return (
                <Card key={review.id as string}>
                  <CardContent className="space-y-2 p-3">
                    <div className="flex items-center justify-between gap-2">
                      <StarDisplay rating={Number(review.rating) || 0} size="sm" />
                      <span className="text-xs text-slate-500">
                        {review.created_at
                          ? new Date(review.created_at as string).toLocaleDateString()
                          : ""}
                      </span>
                    </div>
                    <p className="text-xs font-medium text-slate-500">{firstName}</p>
                    {review.comment ? <p className="text-slate-600">{review.comment}</p> : null}
                  </CardContent>
                </Card>
              );
            })}
            {(reviews ?? []).length === 0 ? (
              <EmptyState
                icon={Star}
                title="No reviews yet"
                description="Be the first to book this provider and share your experience."
              />
            ) : null}
          </div>
        </div>

        {isFamilyViewer ? (
          <NurseProfileBookSection bookingHref={bookingHref} showBookingTooltip={showBookingTooltip} />
        ) : (
          <Link
            href={bookingHref}
            className="inline-flex h-11 w-full items-center justify-center rounded-xl bg-primary px-4 text-sm font-semibold text-white"
          >
            Request Booking
          </Link>
        )}
      </div>
    </main>
  );
}

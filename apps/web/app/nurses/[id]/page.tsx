import type { Metadata } from "next";
import Link from "next/link";
import { createAnonClient } from "@/lib/supabase/anon";
import { createClient } from "@/lib/supabase/server";
import { resolveNurseId } from "@/lib/nurse/resolve";
import { ShareProfileButton } from "@/components/share-profile-button";
import { ReviewBreakdown } from "@/components/review-breakdown";
import { ReportUserMenu } from "@/components/report-user-menu";
import { appUrl } from "@/lib/email/templates/layout";
import { resolveProfilePhotoUrl } from "@/lib/storage/media-url";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { StarDisplay } from "@/components/star-display";
import { EmptyState } from "@/components/empty-state";
import { deriveAvailabilityStatus } from "@/lib/availability-status";
import { formatDailyRateBandLabel, formatHourlyRateBandLabel } from "@/lib/data/rates";
import { Star } from "lucide-react";

export const revalidate = 3600;

interface NurseProfilePageProps {
  params: { id: string };
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
    .single();

  const profile = Array.isArray(nurse?.profiles) ? nurse?.profiles[0] : nurse?.profiles;
  const name = profile?.full_name ?? "Nurse";
  const slug = nurse?.profile_slug ?? nurseId;
  const image = resolveProfilePhotoUrl(nurse?.profile_photo_url) ?? appUrl("/og-default.png");
  const description = (nurse?.bio ?? "").slice(0, 160);

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
  const { data: auth } = await supabase.auth.getUser();
  let bookingHref = `/login?redirect=${encodeURIComponent(`/dashboard/family/bookings/new?nurse=${nurseId ?? params.id}`)}`;
  if (auth.user) {
    const { data: viewerProfile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", auth.user.id)
      .maybeSingle();
    if (viewerProfile?.role === "family") {
      bookingHref = `/dashboard/family/bookings/new?nurse=${nurseId ?? params.id}`;
    }
  }

  if (!nurseId) {
    return (
      <main className="px-5 py-8">
        <p className="text-sm text-slate-600">Nurse not found.</p>
      </main>
    );
  }

  const [{ data: nurse }, { data: availability }, { data: reviews }] = await Promise.all([
    supabase
      .from("nurses")
      .select(
        "id, provider_type, profile_slug, specializations, years_experience, bio, hourly_rate, hourly_rate_max, hourly_rate_range, daily_rate_12hr, daily_rate_12hr_max, daily_rate_range, profile_photo_url, profiles!nurses_id_fkey(full_name, city, barangay, region)"
      )
      .eq("id", nurseId)
      .single(),
    supabase
      .from("availability")
      .select("date, shift, is_open")
      .eq("nurse_id", nurseId)
      .eq("is_open", true)
      .gte("date", new Date().toISOString().slice(0, 10))
      .order("date", { ascending: true })
      .limit(14),
    supabase
      .from("reviews")
      .select("id, rating, comment, created_at, reviewer_id, profiles!reviewer_id(full_name)")
      .eq("reviewee_id", nurseId)
      .order("created_at", { ascending: false })
  ]);

  const { data: ratingRow } = await supabase
    .from("provider_ratings")
    .select("average_rating, review_count")
    .eq("reviewee_id", nurseId)
    .maybeSingle();

  if (!nurse) {
    return (
      <main className="px-5 py-8">
        <p className="text-sm text-slate-600">Nurse not found.</p>
      </main>
    );
  }

  const profile = Array.isArray(nurse.profiles) ? nurse.profiles[0] : nurse.profiles;
  const availabilityStatus = deriveAvailabilityStatus(
    (availability ?? []).map((slot) => ({ date: slot.date, is_open: slot.is_open }))
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
        : "bg-rose-100 text-rose-700";
  const hourlyRateLabel = formatHourlyRateBandLabel(
    nurse.hourly_rate_range,
    nurse.hourly_rate,
    nurse.hourly_rate_max
  );
  const dailyRateLabel = formatDailyRateBandLabel(
    nurse.daily_rate_range,
    nurse.daily_rate_12hr,
    nurse.daily_rate_12hr_max
  );

  const avgRating = ratingRow?.average_rating != null ? Number(ratingRow.average_rating) : null;
  const reviewCount = ratingRow?.review_count != null ? Number(ratingRow.review_count) : 0;

  return (
    <main className="px-5 py-8">
      <div className="mx-auto flex max-w-md flex-col gap-6">
        <div className="space-y-3">
          <div className="flex items-start justify-between gap-3">
            <h1 className="text-2xl font-semibold text-navy-900">{profile?.full_name ?? "Nurse"}</h1>
            <div className="flex items-center gap-2">
              <ShareProfileButton
                profileUrl={appUrl(`/nurses/${nurse.profile_slug ?? nurseId}`)}
                nurseName={profile?.full_name ?? "Nurse"}
              />
              {auth.user ? (
                <ReportUserMenu reportedUserId={nurseId} reportedUserName={profile?.full_name ?? "Nurse"} />
              ) : null}
            </div>
          </div>
          <p className="text-sm text-slate-600">
            {[profile?.region, profile?.city, profile?.barangay].filter(Boolean).join(" • ")}
          </p>
          {avgRating != null && reviewCount > 0 ? (
            <div className="flex items-center gap-2 text-sm">
              <StarDisplay rating={avgRating} size="sm" />
              <span className="font-semibold text-navy-900">{avgRating.toFixed(1)}</span>
              <span className="text-slate-500">({reviewCount} reviews)</span>
            </div>
          ) : null}
          <Badge className={availabilityClass}>{availabilityText}</Badge>
          <div className="flex flex-wrap gap-2">
            {(nurse.specializations ?? []).map((item: string) => (
              <Badge key={item} className="bg-slate-100 text-slate-700">
                {item}
              </Badge>
            ))}
          </div>
          <p className="text-sm text-slate-600">{nurse.bio}</p>
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
          <p className="text-xs text-slate-500">
            Rates shown are starting expectations. Final rates can be negotiated privately.
          </p>
        </div>

        <div className="space-y-3">
          <h2 className="text-lg font-semibold text-navy-900">Availability</h2>
          <div className="space-y-2 text-sm text-slate-600">
            {(availability ?? []).map((slot) => (
              <Card key={`${slot.date}-${slot.shift}`}>
                <CardContent className="p-3">
                  {slot.date} • {slot.shift.replace("_", " ")}
                </CardContent>
              </Card>
            ))}
            {availability?.length === 0 ? (
              <p className="rounded-2xl border border-slate-200 bg-white p-3">No upcoming availability posted.</p>
            ) : null}
          </div>
        </div>

        <div className="space-y-3">
          <h2 className="text-lg font-semibold text-navy-900">Reviews</h2>
          {avgRating != null && reviewCount > 0 ? (
            <ReviewBreakdown
              reviews={(reviews ?? []).map((r) => ({ rating: r.rating as number }))}
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
                      <StarDisplay rating={review.rating as number} size="sm" />
                      <span className="text-xs text-slate-500">
                        {new Date(review.created_at as string).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-xs font-medium text-slate-500">{firstName}</p>
                    {review.comment ? <p className="text-slate-600">{review.comment}</p> : null}
                  </CardContent>
                </Card>
              );
            })}
            {reviews?.length === 0 ? (
              <EmptyState
                icon={Star}
                title="No reviews yet"
                description="Be the first to book this provider and share your experience."
              />
            ) : null}
          </div>
        </div>

        {availabilityStatus === "not_accepting" ? (
          <Button disabled>Request Booking</Button>
        ) : (
          <Button asChild>
            <Link href={bookingHref}>Request Booking</Link>
          </Button>
        )}
      </div>
    </main>
  );
}

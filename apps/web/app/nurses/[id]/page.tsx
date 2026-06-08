import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { deriveAvailabilityStatus } from "@/lib/availability-status";
import { formatDailyRateBandLabel } from "@/lib/data/rates";

interface NurseProfilePageProps {
  params: { id: string };
}

export default async function NurseProfilePage({ params }: NurseProfilePageProps) {
  const supabase = createClient();
  const { data: auth } = await supabase.auth.getUser();
  let bookingHref = `/login?redirect=${encodeURIComponent(`/dashboard/family/bookings/new?nurse=${params.id}`)}`;
  if (auth.user) {
    const { data: viewerProfile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", auth.user.id)
      .maybeSingle();
    if (viewerProfile?.role === "family") {
      bookingHref = `/dashboard/family/bookings/new?nurse=${params.id}`;
    }
  }

  const { data: nurse } = await supabase
    .from("nurses")
    .select(
      "id, provider_type, specializations, years_experience, bio, hourly_rate, hourly_rate_max, hourly_rate_range, daily_rate_12hr, daily_rate_12hr_max, daily_rate_range, profiles(full_name, city, barangay, region)"
    )
    .eq("id", params.id)
    .single();

  const { data: availability } = await supabase
    .from("availability")
    .select("date, shift, is_open")
    .eq("nurse_id", params.id);

  const { data: reviews } = await supabase
    .from("reviews")
    .select("rating, comment, created_at")
    .eq("reviewee_id", params.id)
    .order("created_at", { ascending: false });

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
  const hourlyRateLabel = formatDailyRateBandLabel(
    nurse.hourly_rate_range,
    nurse.hourly_rate,
    nurse.hourly_rate_max
  );
  const dailyRateLabel = formatDailyRateBandLabel(
    nurse.daily_rate_range,
    nurse.daily_rate_12hr,
    nurse.daily_rate_12hr_max
  );

  return (
    <main className="px-5 py-8">
      <div className="mx-auto flex max-w-md flex-col gap-6">
        <div className="space-y-3">
          <h1 className="text-2xl font-semibold">{profile?.full_name ?? "Nurse"}</h1>
          <p className="text-sm text-slate-600">
            {[profile?.region, profile?.city, profile?.barangay].filter(Boolean).join(" • ")}
          </p>
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
            <div className="rounded-xl border border-slate-200 bg-white p-3">
              <p className="text-xs text-slate-500">Hourly (expected)</p>
              <p className="font-semibold">{hourlyRateLabel ?? "Rate on request"}</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-3">
              <p className="text-xs text-slate-500">Daily (expected)</p>
              <p className="font-semibold">{dailyRateLabel ?? "Rate on request"}</p>
            </div>
          </div>
          <p className="text-xs text-slate-500">Rates shown are starting expectations. Final rates can be negotiated privately.</p>
        </div>

        <div className="space-y-3">
          <h2 className="text-lg font-semibold">Availability</h2>
          <div className="space-y-2 text-sm text-slate-600">
            {(availability ?? []).map((slot) => (
              <div key={`${slot.date}-${slot.shift}`} className="rounded-xl border border-slate-200 bg-white p-3">
                {slot.date} • {slot.shift} • {slot.is_open ? "Open" : "Closed"}
              </div>
            ))}
            {availability?.length === 0 ? (
              <p className="rounded-xl border border-slate-200 bg-white p-3">No availability posted.</p>
            ) : null}
          </div>
        </div>

        <div className="space-y-3">
          <h2 className="text-lg font-semibold">Reviews</h2>
          <div className="space-y-3 text-sm">
            {(reviews ?? []).map((review) => (
              <div key={review.created_at} className="rounded-xl border border-slate-200 bg-white p-3">
                <p className="font-semibold">Rating {review.rating} / 5</p>
                <p className="text-slate-600">{review.comment}</p>
              </div>
            ))}
            {reviews?.length === 0 ? (
              <p className="rounded-xl border border-slate-200 bg-white p-3 text-slate-600">
                No reviews yet.
              </p>
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

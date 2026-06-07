import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { NurseCard } from "@/components/nurse-card";
import { NurseFilters } from "@/components/nurse-filters";
import { NursesWelcomeBanner } from "@/components/nurses-welcome-banner";
import { Button } from "@/components/ui/button";
import { AvailabilitySlot, AvailabilityStatus, deriveAvailabilityStatus } from "@/lib/availability-status";

interface NursesPageProps {
  searchParams?: Record<string, string | string[] | undefined>;
}

function parseNumber(value?: string | string[]) {
  if (typeof value !== "string") return null;
  if (!value.length) return null;
  const parsed = Number(value);
  return Number.isNaN(parsed) ? null : parsed;
}

function parseString(value?: string | string[]) {
  return typeof value === "string" ? value : "";
}

export default async function NursesPage({ searchParams }: NursesPageProps) {
  const cityFilter = parseString(searchParams?.city);
  const specializationsFilter = parseString(searchParams?.specializations)
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
  const minDailyRateFilter = parseNumber(searchParams?.minDailyRate);
  const maxDailyRateFilter = parseNumber(searchParams?.maxDailyRate);
  const availabilityFilter = parseString(searchParams?.availability) as AvailabilityStatus | "";
  const providerTypeFilter = parseString(searchParams?.providerType);
  const showWelcome = parseString(searchParams?.welcome) === "1";

  const supabase = createClient();
  const { data: auth } = await supabase.auth.getUser();
  let viewerRole: string | null = null;
  if (auth.user) {
    const { data: viewerProfile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", auth.user.id)
      .maybeSingle();
    viewerRole = viewerProfile?.role ?? null;
  }

  const { data: nurses } = await supabase
    .from("nurses")
    .select("id, provider_type, specializations, years_experience, daily_rate_12hr, hourly_rate, profile_photo_url, profiles(full_name, city)")
    .eq("verification_status", "verified");
  const nurseIds = (nurses ?? []).map((nurse) => nurse.id);

  const { data: ratingRows } =
    nurseIds.length > 0
      ? await supabase.from("nurse_ratings").select("nurse_id, average_rating, review_count").in("nurse_id", nurseIds)
      : { data: [] };

  const ratingsMap = new Map(
    (ratingRows ?? []).map((row) => [
      row.nurse_id as string,
      {
        averageRating: row.average_rating as number,
        reviewCount: row.review_count as number
      }
    ])
  );

  const today = new Date();
  const startDate = today.toISOString().slice(0, 10);
  const endDate = new Date(today);
  endDate.setDate(today.getDate() + 7);

  const { data: availabilityRows } =
    nurseIds.length > 0
      ? await supabase
          .from("availability")
          .select("nurse_id, date, is_open")
          .in("nurse_id", nurseIds)
          .gte("date", startDate)
          .lte("date", endDate.toISOString().slice(0, 10))
      : { data: [] };

  const availabilityMap = new Map<string, AvailabilitySlot[]>();
  for (const row of availabilityRows ?? []) {
    const slots = availabilityMap.get(row.nurse_id) ?? [];
    slots.push({ date: row.date, is_open: row.is_open });
    availabilityMap.set(row.nurse_id, slots);
  }

  const statusRank: Record<AvailabilityStatus, number> = {
    available_now: 0,
    available_next_week: 1,
    not_accepting: 2
  };

  const filteredNurses = (nurses ?? [])
    .map((nurse) => {
      const profile = Array.isArray(nurse.profiles) ? nurse.profiles[0] : nurse.profiles;
      const availabilityStatus = deriveAvailabilityStatus(availabilityMap.get(nurse.id) ?? []);
      return { nurse, profile, availabilityStatus };
    })
    .filter(({ nurse, profile, availabilityStatus }) => {
      if (cityFilter && profile?.city !== cityFilter) return false;
      if (providerTypeFilter && nurse.provider_type !== providerTypeFilter) return false;
      if (
        specializationsFilter.length &&
        !specializationsFilter.every((value) => (nurse.specializations ?? []).includes(value))
      ) {
        return false;
      }
      if (typeof minDailyRateFilter === "number" && (nurse.daily_rate_12hr ?? 0) < minDailyRateFilter) {
        return false;
      }
      if (typeof maxDailyRateFilter === "number" && (nurse.daily_rate_12hr ?? 0) > maxDailyRateFilter) {
        return false;
      }
      if (availabilityFilter && availabilityStatus !== availabilityFilter) return false;
      return true;
    })
    .sort((a, b) => {
      const rankDiff = statusRank[a.availabilityStatus] - statusRank[b.availabilityStatus];
      if (rankDiff !== 0) return rankDiff;
      return (a.nurse.daily_rate_12hr ?? 0) - (b.nurse.daily_rate_12hr ?? 0);
    });

  return (
    <main className="px-5 py-8">
      <div className="mx-auto flex max-w-md flex-col gap-5">
        <div>
          <h1 className="text-2xl font-semibold">Browse verified nurses and caregivers</h1>
          <p className="text-sm text-slate-600">Filter by location, specialization, daily rate, and availability.</p>
        </div>
        {showWelcome ? <NursesWelcomeBanner /> : null}
        <NurseFilters />
        <div className="space-y-4">
          {filteredNurses.map(({ nurse, profile, availabilityStatus }) => {
            const ratings = ratingsMap.get(nurse.id);
            return (
            <NurseCard
              key={nurse.id}
              id={nurse.id}
              name={profile?.full_name ?? "Verified Nurse"}
              city={profile?.city ?? "Philippines"}
              specializations={nurse.specializations ?? []}
              yearsExperience={nurse.years_experience ?? 0}
              dailyRate={nurse.daily_rate_12hr ?? 0}
              averageRating={ratings?.averageRating ?? null}
              reviewCount={ratings?.reviewCount ?? 0}
              verified
              availabilityStatus={availabilityStatus}
              imageUrl={nurse.profile_photo_url ?? undefined}
              providerType={nurse.provider_type ?? "nurse"}
            />
            );
          })}
          {filteredNurses.length === 0 ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-600">
              <p className="font-semibold text-slate-900">No matching verified providers yet</p>
              <p className="mt-1">
                {viewerRole === "family"
                  ? "Try adjusting your filters or check back soon as new providers are verified."
                  : "Try adjusting your filters to broaden your search."}
              </p>
              {viewerRole === "family" ? (
                <Button asChild className="mt-3" variant="outline">
                  <Link href="/dashboard/family">Back to dashboard</Link>
                </Button>
              ) : viewerRole === "nurse" ? null : (
                <Button asChild className="mt-3" variant="outline">
                  <Link href="/register?role=provider">Join as a nurse or caregiver</Link>
                </Button>
              )}
            </div>
          ) : null}
        </div>
      </div>
    </main>
  );
}

import Link from "next/link";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { getCachedVerifiedNurses } from "@/lib/nurses/cached-browse";
import { BottomNav } from "@/components/bottom-nav";
import { NurseCard } from "@/components/nurse-card";
import { NursesBrowseHeader } from "@/components/nurses-browse-header";
import { FamilyBrowseOnboarding } from "@/components/family-browse-onboarding";
import { NursesWelcomeBanner } from "@/components/nurses-welcome-banner";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/empty-state";
import { AvailabilitySlot, AvailabilityStatus, deriveAvailabilityStatus } from "@/lib/availability-status";
import { parseTooltipsDismissed } from "@/lib/family-onboarding";
import { formatDailyRateBandLabel, nurseMatchesDailyRateBand } from "@/lib/data/rates";
import { findRegionForCity } from "@/lib/data/ph-locations";
import {
  formatYearsExperience,
  resolveProfileCity,
  resolveProfileDisplayName
} from "@/lib/profile-display";
import { resolveProfilePhotoUrl } from "@/lib/storage/media-url";
import { hasExpiredDocuments } from "@/lib/license-expiry";
import { Search } from "lucide-react";

export const metadata: Metadata = {
  description:
    "Browse verified nurses and caregivers in your city. Filter by specialization, availability, and rate. Connect directly with PRC-licensed nurses and TESDA-certified caregivers across the Philippines."
};

interface NursesPageProps {
  searchParams?: Record<string, string | string[] | undefined>;
}

function parseString(value?: string | string[]) {
  return typeof value === "string" ? value : "";
}

export default async function NursesPage({ searchParams }: NursesPageProps) {
  const regionFilter = parseString(searchParams?.region);
  const cityFilter = parseString(searchParams?.city);
  const specializationsFilter = parseString(searchParams?.specializations)
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
  const dailyRateBandFilter = parseString(searchParams?.dailyRateBand);
  const availabilityFilter = parseString(searchParams?.availability) as AvailabilityStatus | "";
  const providerTypeFilter = parseString(searchParams?.providerType);
  const searchQuery = parseString(searchParams?.q);
  const showWelcome = parseString(searchParams?.welcome) === "1";

  const supabase = createClient();
  const { data: auth } = await supabase.auth.getUser();
  let viewerRole: string | null = null;
  let showBrowseTooltip = false;
  let hasBrowsed = false;
  if (auth.user) {
    const [{ data: viewerProfile }, { data: familyRow }] = await Promise.all([
      supabase.from("profiles").select("role").eq("id", auth.user.id).maybeSingle(),
      supabase.from("families").select("tooltips_dismissed, has_browsed").eq("id", auth.user.id).maybeSingle()
    ]);
    viewerRole = viewerProfile?.role ?? null;
    if (viewerRole === "family") {
      const tooltips = parseTooltipsDismissed(familyRow?.tooltips_dismissed);
      showBrowseTooltip = !tooltips.browse;
      hasBrowsed = familyRow?.has_browsed ?? false;
    }
  }

  const nurses = searchQuery
    ? (
        await supabase
          .from("nurses")
          .select(
            "id, provider_type, specializations, years_experience, daily_rate_12hr, daily_rate_12hr_max, daily_rate_range, profile_photo_url, prc_license_expiry, tesda_cert_expiry, nbi_expiry, profiles!nurses_id_fkey(full_name, first_name, last_name, city, region, barangay)"
          )
          .in("verification_status", ["verified", "renewal_under_review"])
          .textSearch("search_vector", searchQuery, {
            type: "websearch",
            config: "english"
          })
      ).data ?? []
    : await getCachedVerifiedNurses();

  const [{ data: blockedByViewerRows }, { data: blockedViewerRows }] = auth.user && viewerRole === "family"
    ? await Promise.all([
        supabase.from("user_blocks").select("blocked_id").eq("blocker_id", auth.user.id),
        supabase.from("user_blocks").select("blocker_id").eq("blocked_id", auth.user.id)
      ])
    : [{ data: [] }, { data: [] }];
  const blockedIds = new Set<string>([
    ...((blockedByViewerRows ?? []).map((row) => row.blocked_id as string) ?? []),
    ...((blockedViewerRows ?? []).map((row) => row.blocker_id as string) ?? [])
  ]);
  const nurseIds = (nurses ?? []).map((nurse) => nurse.id);

  const { data: ratingRows } =
    nurseIds.length > 0
      ? await supabase.from("provider_ratings").select("nurse_id, average_rating, review_count").in("nurse_id", nurseIds)
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
      if (blockedIds.has(nurse.id)) return false;
      if (hasExpiredDocuments(nurse)) return false;
      if (regionFilter) {
        const profileRegion = profile?.region || (profile?.city ? findRegionForCity(profile.city) : "");
        if (profileRegion !== regionFilter) return false;
      }
      if (cityFilter && profile?.city !== cityFilter) return false;
      if (providerTypeFilter && nurse.provider_type !== providerTypeFilter) return false;
      if (
        specializationsFilter.length &&
        !specializationsFilter.every((value) => (nurse.specializations ?? []).includes(value))
      ) {
        return false;
      }
      if (
        dailyRateBandFilter &&
        !nurseMatchesDailyRateBand(
          nurse.daily_rate_12hr,
          nurse.daily_rate_12hr_max,
          nurse.daily_rate_range,
          dailyRateBandFilter
        )
      ) {
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

  const isFamilyViewer = viewerRole === "family";

  return (
    <>
      <main className={`px-5 py-8 ${isFamilyViewer ? "pb-24" : ""}`}>
        <div className="mx-auto flex w-full max-w-md flex-col gap-5">
          <NursesBrowseHeader viewerRole={viewerRole} />
          <FamilyBrowseOnboarding
            isFamilyViewer={isFamilyViewer}
            showBrowseTooltip={showBrowseTooltip}
            hasBrowsed={hasBrowsed}
          />
          {showWelcome ? <NursesWelcomeBanner /> : null}
          <div className="space-y-4">
            {filteredNurses.map(({ nurse, profile, availabilityStatus }) => {
              const ratings = ratingsMap.get(nurse.id);
              return (
                <NurseCard
                  key={nurse.id}
                  id={nurse.id}
                  name={resolveProfileDisplayName(profile)}
                  city={resolveProfileCity(profile?.city)}
                  specializations={nurse.specializations ?? []}
                  experienceLabel={formatYearsExperience(nurse.years_experience)}
                  dailyRateLabel={formatDailyRateBandLabel(
                    nurse.daily_rate_range,
                    nurse.daily_rate_12hr,
                    nurse.daily_rate_12hr_max
                  )}
                  averageRating={ratings?.averageRating ?? null}
                  reviewCount={ratings?.reviewCount ?? 0}
                  verified
                  availabilityStatus={availabilityStatus}
                  imageUrl={resolveProfilePhotoUrl(nurse.profile_photo_url) ?? undefined}
                  providerType={nurse.provider_type ?? "nurse"}
                />
              );
            })}
            {filteredNurses.length === 0 ? (
              <EmptyState
                icon={Search}
                title="No results found"
                description="Try adjusting your filters or search in a different region."
                action={
                  <Button asChild variant="outline" size="sm">
                    <Link href="/nurses">Clear filters</Link>
                  </Button>
                }
              />
            ) : null}
          </div>
        </div>
      </main>
      {isFamilyViewer ? <BottomNav role="family" /> : null}
    </>
  );
}

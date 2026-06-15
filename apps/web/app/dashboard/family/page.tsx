import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { BookingStatusBadge } from "@/components/booking-status-badge";
import { FamilyFirstLoginBanner } from "@/components/family-first-login-banner";
import { FamilyOnboardingChecklist } from "@/components/family-onboarding-checklist";
import { NotificationsPanel } from "@/components/notifications-panel";
import { PageHeader } from "@/components/page-header";
import { ProfileAvatar } from "@/components/profile-avatar";
import { EmptyState } from "@/components/empty-state";
import { Calendar } from "lucide-react";
import { resolveProfilePhotoUrl } from "@/lib/storage/media-url";
import { parseTooltipsDismissed } from "@/lib/family-onboarding";

export default async function FamilyDashboardPage() {
  const supabase = createClient();
  const { data: auth } = await supabase.auth.getUser();
  const userId = auth.user?.id ?? "";

  const [
    { data: bookings },
    { data: completedBookings },
    { data: profile },
    { data: family },
    { data: allBookings }
  ] = await Promise.all([
    supabase
      .from("bookings")
      .select("id, status, requested_date, nurse_id")
      .order("created_at", { ascending: false })
      .limit(3),
    supabase
      .from("bookings")
      .select("id, status, requested_date, nurse_id")
      .eq("status", "completed")
      .order("created_at", { ascending: false }),
    userId
      ? supabase.from("profiles").select("region, city, address").eq("id", userId).maybeSingle()
      : Promise.resolve({ data: null }),
    userId
      ? supabase
          .from("families")
          .select("has_browsed, checklist_dismissed, welcome_seen, tooltips_dismissed")
          .eq("id", userId)
          .maybeSingle()
      : Promise.resolve({ data: null }),
    userId
      ? supabase.from("bookings").select("id, status").eq("family_id", userId)
      : Promise.resolve({ data: [] })
  ]);

  const completedIds = (completedBookings ?? []).map((b) => b.id);
  const [{ data: existingReviews }, { data: completedWithNurses }] = await Promise.all([
    completedIds.length
      ? supabase.from("reviews").select("booking_id").in("booking_id", completedIds)
      : Promise.resolve({ data: [] }),
    completedIds.length
      ? supabase
          .from("bookings")
          .select("id, status, requested_date, nurse_id, nurses(profile_photo_url, profiles!nurses_id_fkey(full_name))")
          .in("id", completedIds)
      : Promise.resolve({ data: [] })
  ]);

  const reviewedIds = new Set((existingReviews ?? []).map((r) => r.booking_id));

  const pendingReviewBookings = (completedWithNurses ?? []).filter((b) => !reviewedIds.has(b.id));

  const nurseById = new Map(
    pendingReviewBookings.map((booking) => {
      const nurse = Array.isArray(booking.nurses) ? booking.nurses[0] : booking.nurses;
      const profileRow = Array.isArray(nurse?.profiles) ? nurse?.profiles[0] : nurse?.profiles;
      return [
        booking.nurse_id as string,
        {
          name: profileRow?.full_name?.trim() || "Nurse",
          photo: resolveProfilePhotoUrl(nurse?.profile_photo_url)
        }
      ];
    })
  );

  const familyOnboarding = {
    has_browsed: family?.has_browsed ?? false,
    checklist_dismissed: family?.checklist_dismissed ?? false,
    welcome_seen: family?.welcome_seen ?? false,
    tooltips_dismissed: parseTooltipsDismissed(family?.tooltips_dismissed)
  };

  const bookingStats = {
    hasAnyBooking: (allBookings ?? []).length > 0,
    hasConfirmedBooking: (allBookings ?? []).some((booking) => booking.status === "accepted")
  };

  return (
    <>
      <PageHeader title="Home" showBack={false} />
      <main className="px-5 py-6">
        <div className="mx-auto flex max-w-md flex-col gap-6">
          <p className="text-sm text-slate-600">Your latest booking activity.</p>
          {!familyOnboarding.welcome_seen ? <FamilyFirstLoginBanner /> : null}
          <FamilyOnboardingChecklist
            profile={{
              region: profile?.region ?? null,
              city: profile?.city ?? null,
              address: profile?.address ?? null
            }}
            family={familyOnboarding}
            bookings={bookingStats}
          />
          <NotificationsPanel />
          {pendingReviewBookings.map((booking) => {
            const nurse = nurseById.get(booking.nurse_id);
            return (
              <Link
                key={booking.id}
                href={`/dashboard/family/bookings/${booking.id}`}
                className="flex items-center gap-3 rounded-2xl border border-brand-200 bg-brand-50 p-4 transition hover:bg-brand-100"
              >
                <ProfileAvatar src={nurse?.photo} name={nurse?.name ?? "Nurse"} size="sm" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-navy-900">
                    How was your experience with {nurse?.name}?
                  </p>
                  <p className="mt-0.5 text-xs text-slate-600">Leave a review for booking {booking.requested_date}</p>
                </div>
                <span className="shrink-0 text-sm font-medium text-brand-600">Review →</span>
              </Link>
            );
          })}
          <Link
            href="/dashboard/family/care-requests/new"
            className="block rounded-2xl border border-slate-200 bg-white p-4 transition hover:border-brand-200"
          >
            <h3 className="text-base font-semibold text-navy-900">Post a care request</h3>
            <p className="mt-1 text-sm text-slate-600">
              Receive applications from nurses and caregivers in your area
            </p>
          </Link>
          <Link
            href="/nurses"
            className="block rounded-2xl border border-brand-200 bg-brand-50 p-4 transition hover:bg-brand-100"
          >
            <h3 className="text-base font-semibold text-brand-900">Find a nurse or caregiver</h3>
            <p className="mt-1 text-sm text-brand-800">
              Browse verified professionals available in your area
            </p>
            <span className="mt-2 inline-block text-sm font-medium text-brand-700">Browse now →</span>
          </Link>
          <div className="space-y-3">
            {(bookings ?? []).map((booking) => (
              <Link
                key={booking.id}
                href={`/dashboard/family/bookings/${booking.id}`}
                className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-3 text-sm"
              >
                <div>
                  <p className="font-semibold">Booking {booking.requested_date}</p>
                  <p className="text-xs text-slate-500">Tap to view details</p>
                </div>
                <BookingStatusBadge status={booking.status} />
              </Link>
            ))}
            {bookings?.length === 0 ? (
              <EmptyState
                icon={Calendar}
                title="No bookings yet"
                description="Browse nurses and caregivers to request your first booking."
                action={
                  <Button asChild size="sm">
                    <Link href="/nurses">Browse nurses</Link>
                  </Button>
                }
              />
            ) : null}
          </div>
          <Button asChild>
            <Link href="/dashboard/family/bookings/new">Request a booking</Link>
          </Button>
        </div>
      </main>
    </>
  );
}

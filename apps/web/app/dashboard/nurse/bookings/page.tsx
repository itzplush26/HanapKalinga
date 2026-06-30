import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/page-header";
import { BookingStatusBadge } from "@/components/booking-status-badge";
import { NurseBookingsTabs } from "@/components/nurse-bookings-tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getDailyRateBand } from "@/lib/data/rates";
import { fetchUnreadCountByBooking } from "@/lib/messages";

interface NurseBookingsPageProps {
  searchParams?: { tab?: string };
}

export default async function NurseBookingsPage({ searchParams }: NurseBookingsPageProps) {
  const supabase = createClient();
  const { data: auth } = await supabase.auth.getUser();
  const userId = auth.user?.id ?? "";
  const activeTab = searchParams?.tab === "find-work" ? "find-work" : "my-bookings";

  const { data: bookings } =
    activeTab === "my-bookings"
      ? await supabase
          .from("bookings")
          .select("id, status, requested_date, shift")
          .order("created_at", { ascending: false })
      : { data: [] };

  const bookingIds = (bookings ?? []).map((booking) => booking.id);
  const unreadMap =
    activeTab === "my-bookings" && userId
      ? await fetchUnreadCountByBooking(supabase, bookingIds, userId)
      : new Map<string, number>();

  const { data: requests } =
    activeTab === "find-work"
      ? await supabase
          .from("care_requests")
          .select(
            "id, title, city, region, barangay, care_type, budget_band, start_date, created_at, required_specializations"
          )
          .eq("status", "open")
          .order("created_at", { ascending: false })
      : { data: [] };

  const { data: applications } =
    activeTab === "find-work" && auth.user
      ? await supabase
          .from("care_request_applications")
          .select("care_request_id")
          .eq("nurse_id", auth.user.id)
      : { data: [] };
  const appliedIds = new Set((applications ?? []).map((application) => application.care_request_id));

  return (
    <>
      <PageHeader title="Bookings" />
      <main className="px-5 py-6">
        <div className="mx-auto flex max-w-md flex-col gap-4">
          <NurseBookingsTabs />

          {activeTab === "my-bookings" ? (
            <div className="space-y-3">
              {(bookings ?? []).map((booking) => {
                const unread = unreadMap.get(booking.id) ?? 0;
                return (
                  <Link
                    key={booking.id}
                    href={`/dashboard/nurse/bookings/${booking.id}`}
                    className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-3 text-sm"
                  >
                    <div>
                      <p className="font-semibold">
                        {booking.requested_date}
                        {unread > 0 ? (
                          <span className="ml-2 rounded-full bg-rose-500 px-2 py-0.5 text-xs font-semibold text-white">
                            {unread}
                          </span>
                        ) : null}
                      </p>
                      <p className="text-xs text-slate-500">{booking.shift}</p>
                    </div>
                    <BookingStatusBadge status={booking.status} />
                  </Link>
                );
              })}
              {bookings?.length === 0 ? (
                <p className="rounded-2xl border border-slate-200 bg-white p-3 text-sm text-slate-600">
                  No requests yet.
                </p>
              ) : null}
            </div>
          ) : (
            <>
              <Button asChild variant="outline" size="sm">
                <Link href="/dashboard/nurse/applications">My applications</Link>
              </Button>
              {(requests ?? []).map((request) => (
                <div key={request.id as string} className="rounded-2xl border border-slate-200 bg-white p-4">
                  <h2 className="font-semibold text-navy-900">{request.title as string}</h2>
                  <p className="mt-1 text-sm text-slate-600">
                    {[request.barangay, request.city, request.region].filter(Boolean).join(", ")}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-1">
                    <Badge className="bg-brand-50 text-brand-800">
                      {(request.care_type as string).replace("_", " ")}
                    </Badge>
                    {(request.required_specializations as string[]).map((specialization) => (
                      <Badge key={specialization} className="bg-slate-100 text-slate-700">
                        {specialization}
                      </Badge>
                    ))}
                  </div>
                  <p className="mt-2 text-sm text-slate-600">
                    Budget: {getDailyRateBand(request.budget_band as string)?.label ?? "Open"}
                  </p>
                  {appliedIds.has(request.id) ? (
                    <p className="mt-3 text-sm font-medium text-emerald-700">Applied</p>
                  ) : (
                    <Button asChild size="sm" className="mt-3">
                      <Link href={`/dashboard/nurse/care-requests/${request.id}`}>Apply</Link>
                    </Button>
                  )}
                </div>
              ))}
              {!requests?.length ? (
                <p className="rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-600">
                  No open care requests right now. Check back soon.
                </p>
              ) : null}
            </>
          )}
        </div>
      </main>
    </>
  );
}

import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { AdminPageHeader } from "@/components/admin/admin-shell";
import { VerificationStatusBadge } from "@/components/verification-status-badge";
import type { VerificationStatus } from "@/lib/verification";

export default async function AdminDashboardPage() {
  const supabase = createClient();

  const [
    { count: pendingCount },
    { count: underReviewCount },
    { count: bookingCount },
    { count: newSignupCount }
  ] = await Promise.all([
    supabase.from("nurses").select("id", { count: "exact", head: true }).eq("verification_status", "pending"),
    supabase
      .from("nurses")
      .select("id", { count: "exact", head: true })
      .eq("verification_status", "under_review"),
    supabase.from("bookings").select("id", { count: "exact", head: true }),
    supabase.from("profiles").select("id", { count: "exact", head: true })
  ]);

  const cards = [
    {
      label: "Pending verifications",
      value: pendingCount ?? 0,
      href: "/admin/verifications?status=pending"
    },
    {
      label: "Under review",
      value: underReviewCount ?? 0,
      href: "/admin/verifications?status=under_review"
    },
    { label: "Total bookings", value: bookingCount ?? 0, href: "/admin/bookings" },
    { label: "Total signups", value: newSignupCount ?? 0, href: "/admin/nurses" }
  ];

  return (
    <main>
      <AdminPageHeader
        title="Admin dashboard"
        description="Monitor verification requests, bookings, and platform activity."
      />
      <div className="grid gap-4 sm:grid-cols-2">
        {cards.map((card) => (
          <Link
            key={card.label}
            href={card.href}
            className="rounded-2xl border border-slate-200 bg-white p-5 transition hover:border-brand-200 hover:shadow-sm"
          >
            <p className="text-sm text-slate-500">{card.label}</p>
            <p className="mt-2 text-3xl font-semibold text-slate-900">{card.value}</p>
          </Link>
        ))}
      </div>
      <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-5">
        <h2 className="text-sm font-semibold text-slate-900">Quick actions</h2>
        <div className="mt-3 flex flex-wrap gap-3 text-sm">
          <Link href="/admin/verifications" className="text-brand-700 hover:underline">
            Review verifications
          </Link>
          <Link href="/admin/nurses" className="text-brand-700 hover:underline">
            View nurses
          </Link>
          <Link href="/admin/families" className="text-brand-700 hover:underline">
            View families
          </Link>
          <Link href="/admin/bookings" className="text-brand-700 hover:underline">
            View bookings
          </Link>
        </div>
      </div>
      <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-5">
        <h2 className="text-sm font-semibold text-slate-900">Verification status legend</h2>
        <div className="mt-3 flex flex-wrap gap-2">
          {(["pending", "under_review", "verified", "rejected", "resubmission_required"] as VerificationStatus[]).map(
            (status) => (
              <VerificationStatusBadge key={status} status={status} />
            )
          )}
        </div>
      </div>
    </main>
  );
}

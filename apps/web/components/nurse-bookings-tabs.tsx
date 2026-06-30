"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

function isFindWorkTab(tab: string | null): boolean {
  return tab === "find-work";
}

export function NurseBookingsTabs() {
  const searchParams = useSearchParams();
  const supabase = createClient();
  const [userId, setUserId] = useState<string | null>(null);
  const [newCareRequestCount, setNewCareRequestCount] = useState(0);

  const activeFindWork = isFindWorkTab(searchParams.get("tab"));
  const findWorkVisitStorageKey = userId ? `hanapkalinga.find-work-last-visit.${userId}` : null;

  useEffect(() => {
    async function loadUser() {
      const { data: auth } = await supabase.auth.getUser();
      setUserId(auth.user?.id ?? null);
    }
    void loadUser();
  }, [supabase]);

  const refreshFindWorkBadge = useCallback(async () => {
    if (!userId || !findWorkVisitStorageKey) {
      setNewCareRequestCount(0);
      return;
    }

    const lastVisitIso = window.localStorage.getItem(findWorkVisitStorageKey);
    if (!lastVisitIso) {
      setNewCareRequestCount(0);
      return;
    }

    const [{ data: profile }, { data: nurse }] = await Promise.all([
      supabase.from("profiles").select("region").eq("id", userId).maybeSingle(),
      supabase.from("nurses").select("specializations").eq("id", userId).maybeSingle()
    ]);

    let query = supabase
      .from("care_requests")
      .select("id", { count: "exact", head: true })
      .eq("status", "open")
      .gt("created_at", lastVisitIso);

    const region = (profile?.region as string | null)?.trim();
    if (region) {
      query = query.eq("region", region);
    }

    const specializations = ((nurse?.specializations as string[] | null) ?? []).filter(Boolean);
    if (specializations.length > 0) {
      query = query.overlaps("required_specializations", specializations);
    }

    const { count, error } = await query;
    if (error) {
      setNewCareRequestCount(0);
      return;
    }

    setNewCareRequestCount(count ?? 0);
  }, [findWorkVisitStorageKey, supabase, userId]);

  useEffect(() => {
    if (!findWorkVisitStorageKey || !activeFindWork) return;
    window.localStorage.setItem(findWorkVisitStorageKey, new Date().toISOString());
    setNewCareRequestCount(0);
  }, [activeFindWork, findWorkVisitStorageKey]);

  useEffect(() => {
    if (activeFindWork) return;
    void refreshFindWorkBadge();
  }, [activeFindWork, refreshFindWorkBadge]);

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-1">
      <div className="grid grid-cols-2 gap-1">
        <Link
          href="/dashboard/nurse/bookings"
          className={cn(
            "rounded-lg px-3 py-2 text-center text-sm font-medium",
            !activeFindWork
              ? "bg-brand-50 text-brand-700"
              : "text-slate-600 hover:bg-slate-50"
          )}
          aria-current={!activeFindWork ? "page" : undefined}
        >
          My Bookings
        </Link>
        <Link
          href="/dashboard/nurse/bookings?tab=find-work"
          className={cn(
            "flex items-center justify-center gap-1 rounded-lg px-3 py-2 text-center text-sm font-medium",
            activeFindWork
              ? "bg-brand-50 text-brand-700"
              : "text-slate-600 hover:bg-slate-50"
          )}
          aria-current={activeFindWork ? "page" : undefined}
        >
          <span>Find Work</span>
          {newCareRequestCount > 0 ? (
            <span className="rounded-full bg-error px-1.5 text-[11px] font-semibold text-white">
              {newCareRequestCount > 9 ? "9+" : newCareRequestCount}
            </span>
          ) : null}
        </Link>
      </div>
    </div>
  );
}

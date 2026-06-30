"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import {
  BriefcaseBusiness,
  Calendar,
  ClipboardList,
  Clock3,
  Home,
  MessageCircle,
  Search,
  UserCircle
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { fetchTotalUnreadCount, fetchUserBookingIds } from "@/lib/messages";
import { cn } from "@/lib/utils";

type DashboardRole = "family" | "nurse";

type NavTab = {
  href: string;
  label: string;
  icon: typeof Home;
  match: (path: string) => boolean;
  prefetch?: boolean;
};

const FAMILY_TABS: NavTab[] = [
  {
    href: "/dashboard/family",
    label: "Home",
    icon: Home,
    match: (path) => path === "/dashboard/family"
  },
  {
    href: "/nurses",
    label: "Browse",
    icon: Search,
    match: (path) => path.startsWith("/nurses"),
    prefetch: true
  },
  {
    href: "/dashboard/family/bookings",
    label: "Bookings",
    icon: Calendar,
    match: (path) => path.startsWith("/dashboard/family/bookings"),
    prefetch: true
  },
  {
    href: "/dashboard/family/messages",
    label: "Messages",
    icon: MessageCircle,
    match: (path) => path === "/dashboard/family/messages"
  },
  {
    href: "/dashboard/family/profile",
    label: "Profile",
    icon: UserCircle,
    match: (path) => path === "/dashboard/family/profile"
  }
];

const NURSE_TABS: NavTab[] = [
  {
    href: "/dashboard/nurse",
    label: "Home",
    icon: Home,
    match: (path) => path === "/dashboard/nurse"
  },
  {
    href: "/dashboard/nurse/availability",
    label: "Schedule",
    icon: Clock3,
    match: (path) => path === "/dashboard/nurse/availability",
    prefetch: true
  },
  {
    href: "/dashboard/nurse/bookings",
    label: "Bookings",
    icon: ClipboardList,
    match: (path) => path.startsWith("/dashboard/nurse/bookings"),
    prefetch: true
  },
  {
    href: "/dashboard/nurse/care-requests",
    label: "Find Work",
    icon: BriefcaseBusiness,
    match: (path) => path.startsWith("/dashboard/nurse/care-requests"),
    prefetch: true
  },
  {
    href: "/dashboard/nurse/messages",
    label: "Messages",
    icon: MessageCircle,
    match: (path) => path === "/dashboard/nurse/messages"
  },
  {
    href: "/dashboard/nurse/profile",
    label: "Profile",
    icon: UserCircle,
    match: (path) => path === "/dashboard/nurse/profile"
  }
];

export interface BottomNavProps {
  role: DashboardRole;
}

export function BottomNav({ role }: BottomNavProps) {
  const pathname = usePathname();
  const supabase = createClient();
  const [unreadTotal, setUnreadTotal] = useState(0);
  const [newCareRequestCount, setNewCareRequestCount] = useState(0);
  const [userId, setUserId] = useState<string | null>(null);
  const isFindWorkRoute = pathname.startsWith("/dashboard/nurse/care-requests");
  const findWorkVisitStorageKey = userId ? `hanapkalinga.find-work-last-visit.${userId}` : null;

  const tabs = role === "nurse" ? NURSE_TABS : FAMILY_TABS;

  const refreshUnread = useCallback(async () => {
    const { data: auth } = await supabase.auth.getUser();
    const uid = auth.user?.id;
    if (!uid) {
      setUnreadTotal(0);
      return;
    }
    setUserId(uid);
    const bookingIds = await fetchUserBookingIds(supabase, role, uid);
    const total = await fetchTotalUnreadCount(supabase, bookingIds, uid);
    setUnreadTotal(total);
  }, [role, supabase]);

  const refreshFindWorkBadge = useCallback(async () => {
    if (role !== "nurse" || !userId || !findWorkVisitStorageKey) {
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
      .select("required_specializations", { count: "exact", head: false })
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
  }, [role, userId, findWorkVisitStorageKey, supabase]);

  useEffect(() => {
    refreshUnread();
  }, [refreshUnread, pathname]);

  useEffect(() => {
    if (role !== "nurse" || !findWorkVisitStorageKey) return;
    if (!isFindWorkRoute) return;

    window.localStorage.setItem(findWorkVisitStorageKey, new Date().toISOString());
    setNewCareRequestCount(0);
  }, [role, isFindWorkRoute, findWorkVisitStorageKey]);

  useEffect(() => {
    void refreshFindWorkBadge();
  }, [refreshFindWorkBadge, pathname]);

  useEffect(() => {
    if (!userId) return;

    const channel = supabase
      .channel(`unread-count:${userId}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages" }, () => {
        refreshUnread();
      })
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "messages" }, () => {
        refreshUnread();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, refreshUnread, supabase]);

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-20 border-t border-nav-border bg-nav-bg pb-[env(safe-area-inset-bottom)]"
      aria-label="Main navigation"
    >
      <div className="mx-auto flex h-16 w-full max-w-md px-1 sm:max-w-lg md:max-w-2xl md:px-4 lg:max-w-3xl">
        {tabs.map((tab) => {
          const active = tab.match(pathname);
          const Icon = tab.icon;
          const showMessagesBadge = tab.label === "Messages" && unreadTotal > 0;
          const showFindWorkBadge = tab.label === "Find Work" && newCareRequestCount > 0;
          const badgeValue = tab.label === "Find Work" ? newCareRequestCount : unreadTotal;

          return (
            <Link
              key={tab.href}
              href={tab.href}
              prefetch={tab.prefetch ?? false}
              className="relative flex min-w-0 flex-1 flex-col items-center justify-center gap-1 overflow-visible px-0.5 md:px-2"
              aria-current={active ? "page" : undefined}
              title={tab.label}
            >
              <Icon
                className={cn(
                  "h-[22px] w-[22px] shrink-0 max-[339px]:h-5 max-[339px]:w-5",
                  active ? "text-nav-active" : "text-nav-inactive"
                )}
                strokeWidth={active ? 2.25 : 2}
                fill={active ? "currentColor" : "none"}
              />
              <span
                className={cn(
                  "w-full whitespace-nowrap text-center leading-none [font-size:10px] max-[374px]:[font-size:9px] max-[339px]:hidden",
                  active ? "font-semibold text-nav-active" : "font-normal text-nav-inactive"
                )}
              >
                {tab.label}
              </span>
              {showMessagesBadge || showFindWorkBadge ? (
                <span className="absolute right-1 top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-error px-1 text-[10px] font-semibold text-on-primary md:right-3">
                  {badgeValue > 9 ? "9+" : badgeValue}
                </span>
              ) : null}
              {active ? <span className="mt-1 hidden h-1 w-1 rounded-full bg-nav-active max-[339px]:block" /> : null}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

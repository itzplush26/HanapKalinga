"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { fetchTotalUnreadCount, fetchUserBookingIds } from "@/lib/messages";
import { cn } from "@/lib/utils";

type DashboardRole = "family" | "nurse";

const NAV_BY_ROLE: Record<
  DashboardRole,
  { href: string; label: string; match: (path: string) => boolean }[]
> = {
  family: [
    { href: "/dashboard/family", label: "Home", match: (p) => p === "/dashboard/family" },
    {
      href: "/dashboard/family/bookings",
      label: "Bookings",
      match: (p) => p.startsWith("/dashboard/family/bookings")
    },
    {
      href: "/dashboard/family/messages",
      label: "Messages",
      match: (p) => p === "/dashboard/family/messages"
    },
    {
      href: "/dashboard/family/profile",
      label: "Profile",
      match: (p) => p === "/dashboard/family/profile"
    }
  ],
  nurse: [
    { href: "/dashboard/nurse", label: "Home", match: (p) => p === "/dashboard/nurse" },
    {
      href: "/dashboard/nurse/bookings",
      label: "Bookings",
      match: (p) => p.startsWith("/dashboard/nurse/bookings")
    },
    {
      href: "/dashboard/nurse/messages",
      label: "Messages",
      match: (p) => p === "/dashboard/nurse/messages"
    },
    {
      href: "/dashboard/nurse/profile",
      label: "Profile",
      match: (p) => p === "/dashboard/nurse/profile"
    }
  ]
};

interface DashboardNavProps {
  role: DashboardRole;
}

export function DashboardNav({ role }: DashboardNavProps) {
  const pathname = usePathname();
  const supabase = createClient();
  const [unreadTotal, setUnreadTotal] = useState(0);
  const [userId, setUserId] = useState<string | null>(null);
  const items = NAV_BY_ROLE[role];

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

  useEffect(() => {
    refreshUnread();
  }, [refreshUnread, pathname]);

  useEffect(() => {
    if (!userId) return;

    const channel = supabase
      .channel(`unread-count:${userId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages" },
        () => {
          refreshUnread();
        }
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "messages" },
        () => {
          refreshUnread();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, refreshUnread, supabase]);

  return (
    <nav className="sticky top-0 z-10 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-md items-center justify-around px-2 py-2">
        {items.map((item) => {
          const active = item.match(pathname);
          const showBadge = item.label === "Messages" && unreadTotal > 0;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "relative flex flex-col items-center gap-0.5 rounded-lg px-2 py-1 text-xs font-medium",
                active ? "text-brand-700" : "text-slate-600"
              )}
            >
              <span>{item.label}</span>
              {showBadge ? (
                <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-semibold text-white">
                  {unreadTotal > 9 ? "9+" : unreadTotal}
                </span>
              ) : null}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

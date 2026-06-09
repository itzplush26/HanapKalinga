"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { Calendar, Home, MessageCircle, Search, UserCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { fetchTotalUnreadCount, fetchUserBookingIds } from "@/lib/messages";
import { cn } from "@/lib/utils";

type DashboardRole = "family" | "nurse";

type NavItem = {
  href: string;
  label: string;
  icon: typeof Home;
  match: (path: string) => boolean;
  nurseOnly?: boolean;
};

const NAV_ITEMS: NavItem[] = [
  {
    href: "/dashboard/family",
    label: "Home",
    icon: Home,
    match: (path) => path === "/dashboard/family"
  },
  {
    href: "/dashboard/nurse",
    label: "Home",
    icon: Home,
    match: (path) => path === "/dashboard/nurse"
  },
  {
    href: "/nurses",
    label: "Browse",
    icon: Search,
    match: (path) => path.startsWith("/nurses")
  },
  {
    href: "/dashboard/nurse/availability",
    label: "Availability",
    icon: Calendar,
    match: (path) => path === "/dashboard/nurse/availability",
    nurseOnly: true
  },
  {
    href: "/dashboard/family/bookings",
    label: "Bookings",
    icon: Calendar,
    match: (path) => path.startsWith("/dashboard/family/bookings")
  },
  {
    href: "/dashboard/nurse/bookings",
    label: "Bookings",
    icon: Calendar,
    match: (path) => path.startsWith("/dashboard/nurse/bookings")
  },
  {
    href: "/dashboard/family/messages",
    label: "Messages",
    icon: MessageCircle,
    match: (path) => path === "/dashboard/family/messages"
  },
  {
    href: "/dashboard/nurse/messages",
    label: "Messages",
    icon: MessageCircle,
    match: (path) => path === "/dashboard/nurse/messages"
  },
  {
    href: "/dashboard/family/profile",
    label: "Profile",
    icon: UserCircle,
    match: (path) => path === "/dashboard/family/profile"
  },
  {
    href: "/dashboard/nurse/profile",
    label: "Profile",
    icon: UserCircle,
    match: (path) => path === "/dashboard/nurse/profile"
  }
];

interface DashboardNavProps {
  role: DashboardRole;
}

export function DashboardNav({ role }: DashboardNavProps) {
  const pathname = usePathname();
  const supabase = createClient();
  const [unreadTotal, setUnreadTotal] = useState(0);
  const [userId, setUserId] = useState<string | null>(null);

  const items = NAV_ITEMS.filter((item) => {
    if (item.nurseOnly && role !== "nurse") return false;
    if (item.href.includes("/dashboard/family") && role !== "family") return false;
    if (item.href.includes("/dashboard/nurse") && role !== "nurse") return false;
    if (item.href === "/nurses" && role !== "family") return false;
    return true;
  });

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
    <nav className="fixed bottom-0 left-0 right-0 z-20 border-t border-slate-200 bg-white/95 backdrop-blur pb-[env(safe-area-inset-bottom)]">
      <div className="mx-auto flex h-16 max-w-md items-stretch justify-around px-1">
        {items.map((item) => {
          const active = item.match(pathname);
          const Icon = item.icon;
          const showBadge = item.label === "Messages" && unreadTotal > 0;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "relative flex min-w-0 flex-1 flex-col items-center justify-center gap-0.5 px-1 py-1 text-[10px] font-medium min-[380px]:text-xs md:flex-row md:gap-1.5",
                active ? "text-brand-600" : "text-slate-500"
              )}
            >
              <Icon
                className={cn("h-5 w-5 shrink-0", active ? "text-brand-600" : "")}
                strokeWidth={active ? 2.25 : 2}
              />
              <span className="hidden truncate min-[380px]:inline">{item.label}</span>
              {showBadge ? (
                <span className="absolute right-2 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-semibold text-white">
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

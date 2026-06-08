"use client";

import { usePathname } from "next/navigation";
import { DashboardNav } from "@/components/dashboard-nav";
import { SessionGuard } from "@/components/session-guard";
import { cn } from "@/lib/utils";

type DashboardRole = "family" | "nurse";

interface DashboardShellProps {
  role: DashboardRole;
  children: React.ReactNode;
}

const ROOT_PATHS = new Set([
  "/dashboard/family",
  "/dashboard/nurse",
  "/dashboard/family/bookings",
  "/dashboard/nurse/bookings",
  "/dashboard/family/messages",
  "/dashboard/nurse/messages",
  "/dashboard/family/profile",
  "/dashboard/nurse/profile",
  "/dashboard/nurse/availability"
]);

export function DashboardShell({ role, children }: DashboardShellProps) {
  const pathname = usePathname();
  const isRootTab = ROOT_PATHS.has(pathname);

  return (
    <>
      <SessionGuard />
      <div className={cn("min-h-screen", isRootTab ? "pb-20" : "pb-6")}>{children}</div>
      <DashboardNav role={role} />
    </>
  );
}

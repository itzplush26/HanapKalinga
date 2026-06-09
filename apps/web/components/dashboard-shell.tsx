"use client";

import { BottomNav } from "@/components/bottom-nav";
import { SessionGuard } from "@/components/session-guard";

type DashboardRole = "family" | "nurse";

interface DashboardShellProps {
  role: DashboardRole;
  children: React.ReactNode;
}

export function DashboardShell({ role, children }: DashboardShellProps) {
  return (
    <>
      <SessionGuard />
      <div className="min-h-screen pb-20">{children}</div>
      <BottomNav role={role} />
    </>
  );
}

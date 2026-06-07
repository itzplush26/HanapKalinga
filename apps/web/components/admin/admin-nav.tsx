"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const ADMIN_LINKS = [
  { href: "/admin", label: "Dashboard", match: (path: string) => path === "/admin" },
  {
    href: "/admin/verifications",
    label: "Verifications",
    match: (path: string) => path.startsWith("/admin/verifications")
  },
  { href: "/admin/nurses", label: "Nurses", match: (path: string) => path === "/admin/nurses" },
  { href: "/admin/families", label: "Families", match: (path: string) => path === "/admin/families" },
  { href: "/admin/bookings", label: "Bookings", match: (path: string) => path.startsWith("/admin/bookings") }
];

export function AdminNav() {
  const pathname = usePathname();

  return (
    <nav className="space-y-1">
      {ADMIN_LINKS.map((item) => {
        const active = item.match(pathname);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "block rounded-lg px-3 py-2 text-sm font-medium transition",
              active
                ? "bg-brand-50 text-brand-800 ring-1 ring-brand-200"
                : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
            )}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

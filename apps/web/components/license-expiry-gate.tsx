"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { DocumentExpiryItem } from "@/lib/license-expiry";

interface LicenseExpiryGateProps {
  documents: DocumentExpiryItem[];
  children: React.ReactNode;
}

export function LicenseExpiryGate({ documents, children }: LicenseExpiryGateProps) {
  const pathname = usePathname();
  const expired = documents.filter((d) => d.status === "expired");
  const hasExpired = expired.length > 0;
  const onProfile = pathname.startsWith("/dashboard/nurse/profile");

  if (!hasExpired) {
    return <>{children}</>;
  }

  if (onProfile) {
    return (
      <>
        <div className="border-b border-rose-200 bg-rose-50 px-5 py-3 text-center text-sm text-rose-900">
          <strong>Action required:</strong>{" "}
          {expired.map((d) => d.label).join(", ")} expired. Upload renewed documents below to restore
          access.
        </div>
        {children}
      </>
    );
  }

  return (
    <main className="flex min-h-[70vh] items-center justify-center px-5 py-12">
      <div className="mx-auto max-w-md rounded-2xl border border-rose-200 bg-white p-6 text-center shadow-sm">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-rose-100">
          <AlertTriangle className="h-7 w-7 text-rose-600" />
        </div>
        <h1 className="mt-4 text-lg font-semibold text-navy-900">Document expired</h1>
        <p className="mt-2 text-sm text-slate-600">
          The following documents have expired and must be renewed before you can continue using
          HanapKalinga:
        </p>
        <ul className="mt-4 space-y-2 text-left text-sm">
          {expired.map((item) => (
            <li key={item.key} className="rounded-lg border border-rose-100 bg-rose-50 px-3 py-2">
              <span className="font-medium text-rose-900">{item.label}</span>
              {item.date ? (
                <span className="block text-xs text-rose-700">
                  Expired on{" "}
                  {new Date(`${item.date}T00:00:00`).toLocaleDateString("en-PH", {
                    month: "long",
                    day: "numeric",
                    year: "numeric"
                  })}
                </span>
              ) : null}
            </li>
          ))}
        </ul>
        <p className="mt-4 text-xs text-slate-500">
          Upload your renewed documents on your profile page. An admin will verify them and update your
          expiry dates.
        </p>
        <Button asChild className="mt-5 w-full">
          <Link href="/dashboard/nurse/profile#documents">Go to profile to upload</Link>
        </Button>
      </div>
    </main>
  );
}

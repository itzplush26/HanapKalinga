import Link from "next/link";
import { AlertTriangle, CheckCircle2, Clock } from "lucide-react";
import type { DocumentExpiryItem } from "@/lib/license-expiry";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface DocumentExpiryCardProps {
  documents: DocumentExpiryItem[];
  showRenewCta?: boolean;
}

function StatusIcon({ status }: { status: DocumentExpiryItem["status"] }) {
  if (status === "valid") return <CheckCircle2 className="h-4 w-4 text-emerald-600" />;
  if (status === "expiring_soon") return <Clock className="h-4 w-4 text-amber-600" />;
  return <AlertTriangle className="h-4 w-4 text-rose-600" />;
}

function statusLabel(item: DocumentExpiryItem): string {
  if (!item.date) return "Not on file — contact support if you are verified";
  if (item.status === "expired") return `Expired ${Math.abs(item.daysUntil ?? 0)} day(s) ago`;
  if (item.status === "expiring_soon") return `Expires in ${item.daysUntil} day(s)`;
  return `Valid until ${new Date(`${item.date}T00:00:00`).toLocaleDateString("en-PH", {
    month: "long",
    day: "numeric",
    year: "numeric"
  })}`;
}

export function DocumentExpiryCard({ documents, showRenewCta = true }: DocumentExpiryCardProps) {
  const hasExpired = documents.some((d) => d.status === "expired");

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-4">
      <h2 className="text-sm font-semibold text-navy-900">Document expiry dates</h2>
      <p className="mt-1 text-xs text-slate-500">
        Dates are set by admin when your documents are approved. Upload renewed documents before expiry.
      </p>
      <ul className="mt-4 space-y-3">
        {documents.map((item) => (
          <li
            key={item.key}
            className={cn(
              "flex items-start gap-3 rounded-xl border px-3 py-2.5 text-sm",
              item.status === "expired" && "border-rose-200 bg-rose-50",
              item.status === "expiring_soon" && "border-amber-200 bg-amber-50",
              item.status === "valid" && "border-slate-100 bg-slate-50",
              item.status === "missing" && "border-slate-100 bg-slate-50"
            )}
          >
            <StatusIcon status={item.status} />
            <div className="min-w-0 flex-1">
              <p className="font-medium text-navy-900">{item.label}</p>
              <p
                className={cn(
                  "text-xs",
                  item.status === "expired" && "text-rose-700",
                  item.status === "expiring_soon" && "text-amber-800",
                  item.status === "valid" && "text-slate-600",
                  item.status === "missing" && "text-slate-500"
                )}
              >
                {statusLabel(item)}
              </p>
            </div>
          </li>
        ))}
      </ul>
      {hasExpired && showRenewCta ? (
        <p className="mt-4 text-xs text-rose-700">
          Upload renewed documents below. An admin will review them and update your expiry dates.
        </p>
      ) : null}
      {showRenewCta && hasExpired ? (
        <Button asChild size="sm" className="mt-3">
          <Link href="/dashboard/nurse/profile#documents">Upload renewed documents</Link>
        </Button>
      ) : null}
    </section>
  );
}

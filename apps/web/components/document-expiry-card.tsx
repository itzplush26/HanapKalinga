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
  if (status === "valid") return <CheckCircle2 className="h-4 w-4 text-success" />;
  if (status === "expiring_soon") return <Clock className="h-4 w-4 text-warning" />;
  return <AlertTriangle className="h-4 w-4 text-error" />;
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
    <section className="rounded-2xl border border-border bg-surface p-4">
      <h2 className="text-sm font-semibold text-text-primary">Document expiry dates</h2>
      <p className="mt-1 text-xs text-text-muted">
        Dates are set by admin when your documents are approved. Upload renewed documents before expiry.
      </p>
      <ul className="mt-4 space-y-3">
        {documents.map((item) => (
          <li
            key={item.key}
            className={cn(
              "flex items-start gap-3 rounded-xl border px-3 py-2.5 text-sm",
              item.status === "expired" && "border-error-border bg-error-bg",
              item.status === "expiring_soon" && "border-warning-border bg-warning-bg",
              item.status === "valid" && "border-border bg-surface-alt",
              item.status === "missing" && "border-border bg-surface-alt"
            )}
          >
            <StatusIcon status={item.status} />
            <div className="min-w-0 flex-1">
              <p className="font-medium text-text-primary">{item.label}</p>
              <p
                className={cn(
                  "text-xs",
                  item.status === "expired" && "text-error",
                  item.status === "expiring_soon" && "text-warning",
                  item.status === "valid" && "text-text-secondary",
                  item.status === "missing" && "text-text-muted"
                )}
              >
                {statusLabel(item)}
              </p>
            </div>
          </li>
        ))}
      </ul>
      {hasExpired && showRenewCta ? (
        <p className="mt-4 text-xs text-error">
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

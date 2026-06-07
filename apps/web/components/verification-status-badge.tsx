import { cn } from "@/lib/utils";
import {
  VERIFICATION_STATUS_BADGE_CLASSES,
  VERIFICATION_STATUS_LABELS,
  type VerificationStatus
} from "@/lib/verification";

interface VerificationStatusBadgeProps {
  status: VerificationStatus | string;
  className?: string;
}

export function VerificationStatusBadge({ status, className }: VerificationStatusBadgeProps) {
  const key = status as VerificationStatus;
  const label = VERIFICATION_STATUS_LABELS[key] ?? status;
  const styles = VERIFICATION_STATUS_BADGE_CLASSES[key] ?? "bg-slate-100 text-slate-700 border-slate-200";

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium",
        styles,
        className
      )}
    >
      {label}
    </span>
  );
}

import { cn } from "@/lib/utils";

type VerificationStatus = "pending" | "verified" | "rejected";

interface VerificationStatusBannerProps {
  status: VerificationStatus;
  rejectionReason?: string | null;
}

const statusStyles: Record<VerificationStatus, string> = {
  pending: "border-yellow-200 bg-yellow-50 text-yellow-900",
  verified: "border-emerald-200 bg-emerald-50 text-emerald-900",
  rejected: "border-rose-200 bg-rose-50 text-rose-900"
};

export function VerificationStatusBanner({
  status,
  rejectionReason
}: VerificationStatusBannerProps) {
  return (
    <div className={cn("rounded-2xl border p-4 text-sm", statusStyles[status])}>
      {status === "pending" && "Your profile is under review."}
      {status === "verified" && "You are verified."}
      {status === "rejected" && (
        <div className="space-y-2">
          <p>Your profile was rejected.</p>
          {rejectionReason ? (
            <p className="text-xs">Reason: {rejectionReason}</p>
          ) : null}
        </div>
      )}
    </div>
  );
}

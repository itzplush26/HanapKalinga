import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type BookingStatus =
  | "pending"
  | "accepted"
  | "declined"
  | "completed"
  | "cancelled"
  | "pending_completion"
  | "disputed";

const statusStyles: Record<BookingStatus, string> = {
  pending: "bg-slate-100 text-slate-700",
  accepted: "bg-blue-100 text-blue-700",
  declined: "bg-rose-100 text-rose-700",
  completed: "bg-emerald-100 text-emerald-700",
  cancelled: "bg-slate-100 text-slate-700",
  pending_completion: "bg-amber-100 text-amber-800",
  disputed: "bg-rose-100 text-rose-800"
};

const statusLabels: Record<BookingStatus, string> = {
  pending: "pending",
  accepted: "accepted",
  declined: "declined",
  completed: "completed",
  cancelled: "cancelled",
  pending_completion: "awaiting confirmation",
  disputed: "disputed"
};

export function BookingStatusBadge({ status }: { status: BookingStatus | string }) {
  const key = status as BookingStatus;
  return (
    <Badge className={cn(statusStyles[key] ?? "bg-slate-100 text-slate-700")}>
      {statusLabels[key] ?? status}
    </Badge>
  );
}

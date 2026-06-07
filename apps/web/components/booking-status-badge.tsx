import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type BookingStatus =
  | "pending"
  | "accepted"
  | "declined"
  | "completed"
  | "cancelled";

const statusStyles: Record<BookingStatus, string> = {
  pending: "bg-slate-100 text-slate-700",
  accepted: "bg-blue-100 text-blue-700",
  declined: "bg-rose-100 text-rose-700",
  completed: "bg-emerald-100 text-emerald-700",
  cancelled: "bg-slate-100 text-slate-700"
};

export function BookingStatusBadge({ status }: { status: BookingStatus }) {
  return <Badge className={cn(statusStyles[status])}>{status}</Badge>;
}

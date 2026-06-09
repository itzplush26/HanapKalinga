"use client";

import { useRouter } from "next/navigation";
import { FamilyCompletionActions } from "@/components/booking-completion-actions";
import { CancelBookingButton } from "@/components/cancel-booking-button";
import { ReportUserMenu } from "@/components/report-user-menu";

interface FamilyBookingDetailActionsProps {
  bookingId: string;
  status: string;
  nurseId: string;
  nurseName: string;
}

export function FamilyBookingDetailActions({
  bookingId,
  status,
  nurseId,
  nurseName
}: FamilyBookingDetailActionsProps) {
  const router = useRouter();
  const refresh = () => router.refresh();

  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <ReportUserMenu reportedUserId={nurseId} reportedUserName={nurseName} bookingId={bookingId} />
      </div>
      {status === "pending_completion" ? (
        <FamilyCompletionActions bookingId={bookingId} onUpdated={refresh} />
      ) : null}
      {status === "pending" || status === "accepted" ? (
        <CancelBookingButton bookingId={bookingId} cancelledBy="family" onCancelled={refresh} />
      ) : null}
    </div>
  );
}

"use client";

import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ContextualTooltip, useFamilyOnboardingAction } from "@/components/contextual-tooltip";

interface NurseProfileBookSectionProps {
  bookingHref: string;
  showBookingTooltip: boolean;
}

export function NurseProfileBookSection({ bookingHref, showBookingTooltip }: NurseProfileBookSectionProps) {
  const { dismissTooltip } = useFamilyOnboardingAction();
  const [tooltipVisible, setTooltipVisible] = useState(showBookingTooltip);

  function handleDismissTooltip() {
    setTooltipVisible(false);
    dismissTooltip("booking");
  }

  return (
    <>
      <Button asChild id="family-booking-cta">
        <Link href={bookingHref} onClick={handleDismissTooltip}>
          Request Booking
        </Link>
      </Button>
      {tooltipVisible ? (
        <ContextualTooltip
          targetId="family-booking-cta"
          content="Tap here to send a booking request. The caregiver will be notified immediately."
          onDismiss={handleDismissTooltip}
        />
      ) : null}
    </>
  );
}

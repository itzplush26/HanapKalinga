"use client";

import { useState } from "react";
import { ContextualTooltip, useFamilyOnboardingAction } from "@/components/contextual-tooltip";

interface FamilyMessagesOnboardingProps {
  showMessagesTooltip: boolean;
}

export function FamilyMessagesOnboarding({ showMessagesTooltip }: FamilyMessagesOnboardingProps) {
  const { dismissTooltip } = useFamilyOnboardingAction();
  const [tooltipVisible, setTooltipVisible] = useState(showMessagesTooltip);

  if (!tooltipVisible) return null;

  return (
    <ContextualTooltip
      targetId="family-messages-list"
      content="Once a booking is made, you can message the nurse or caregiver directly here."
      onDismiss={() => {
        setTooltipVisible(false);
        dismissTooltip("messages");
      }}
    />
  );
}

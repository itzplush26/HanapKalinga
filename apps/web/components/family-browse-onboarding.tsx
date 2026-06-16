"use client";

import { useEffect, useState } from "react";
import { ContextualTooltip, useFamilyOnboardingAction } from "@/components/contextual-tooltip";

interface FamilyBrowseOnboardingProps {
  isFamilyViewer: boolean;
  showBrowseTooltip: boolean;
  hasBrowsed: boolean;
}

export function FamilyBrowseOnboarding({
  isFamilyViewer,
  showBrowseTooltip,
  hasBrowsed
}: FamilyBrowseOnboardingProps) {
  const { markBrowsed, dismissTooltip } = useFamilyOnboardingAction();
  const [tooltipVisible, setTooltipVisible] = useState(showBrowseTooltip);

  useEffect(() => {
    if (!isFamilyViewer || hasBrowsed) return;
    markBrowsed();
  }, [isFamilyViewer, hasBrowsed, markBrowsed]);

  if (!isFamilyViewer || !tooltipVisible) return null;

  return (
    <ContextualTooltip
      targetId="family-browse-filters"
      content="Use filters to find nurses or caregivers by location, specialization, and availability."
      autoDismissMs={5000}
      onDismiss={() => {
        setTooltipVisible(false);
        dismissTooltip("browse");
      }}
    />
  );
}

"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface ContextualTooltipProps {
  targetId: string;
  content: string;
  onDismiss: () => void;
  autoDismissMs?: number;
}

export function ContextualTooltip({
  targetId,
  content,
  onDismiss,
  autoDismissMs
}: ContextualTooltipProps) {
  const [mounted, setMounted] = useState(false);
  const [position, setPosition] = useState<{ top: number; left: number; placement: "below" | "above" } | null>(
    null
  );

  const dismiss = useCallback(() => {
    onDismiss();
  }, [onDismiss]);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    function updatePosition() {
      const target = document.getElementById(targetId);
      if (!target) return;

      const rect = target.getBoundingClientRect();
      const maxWidth = 220;
      const left = Math.min(
        Math.max(12, rect.left + rect.width / 2 - maxWidth / 2),
        window.innerWidth - maxWidth - 12
      );
      const belowTop = rect.bottom + 10;
      const aboveTop = rect.top - 10;
      const placement = belowTop + 120 > window.innerHeight ? "above" : "below";

      setPosition({
        top: placement === "below" ? belowTop : aboveTop,
        left,
        placement
      });
    }

    updatePosition();
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);
    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [targetId]);

  useEffect(() => {
    if (!autoDismissMs) return;
    const timer = window.setTimeout(dismiss, autoDismissMs);
    return () => window.clearTimeout(timer);
  }, [autoDismissMs, dismiss]);

  useEffect(() => {
    function handlePointerDown(event: MouseEvent | TouchEvent) {
      const target = event.target;
      if (!(target instanceof Node)) return;
      const popover = document.getElementById("family-contextual-tooltip");
      if (popover?.contains(target)) return;
      dismiss();
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("touchstart", handlePointerDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("touchstart", handlePointerDown);
    };
  }, [dismiss]);

  if (!mounted || !position) return null;

  return (
    <div
      id="family-contextual-tooltip"
      role="tooltip"
      className="fixed z-[100] max-w-[220px] rounded-xl bg-secondary p-3 text-[13px] leading-snug text-white shadow-lg"
      style={{
        top: position.top,
        left: position.left,
        transform: position.placement === "above" ? "translateY(-100%)" : undefined
      }}
      onClick={(event) => event.stopPropagation()}
    >
      <button
        type="button"
        onClick={dismiss}
        className="absolute right-2 top-2 rounded p-0.5 text-white/80 hover:text-white"
        aria-label="Close hint"
      >
        ✕
      </button>
      <p className="pr-5">{content}</p>
      <span
        className="absolute left-1/2 h-2 w-2 -translate-x-1/2 rotate-45 bg-secondary"
        style={position.placement === "below" ? { top: -4 } : { bottom: -4 }}
        aria-hidden
      />
    </div>
  );
}

export function useFamilyOnboardingAction() {
  const router = useRouter();

  const patchOnboarding = useCallback(
    async (body: Record<string, string>) => {
      await fetch("/api/family/onboarding", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });
      router.refresh();
    },
    [router]
  );

  const dismissTooltip = useCallback(
    (tooltip: "browse" | "booking" | "messages") =>
      patchOnboarding({ action: "dismiss_tooltip", tooltip }),
    [patchOnboarding]
  );
  const markBrowsed = useCallback(() => patchOnboarding({ action: "mark_browsed" }), [patchOnboarding]);
  const dismissChecklist = useCallback(
    () => patchOnboarding({ action: "dismiss_checklist" }),
    [patchOnboarding]
  );
  const dismissWelcome = useCallback(() => patchOnboarding({ action: "dismiss_welcome" }), [patchOnboarding]);

  return {
    dismissTooltip,
    markBrowsed,
    dismissChecklist,
    dismissWelcome
  };
}

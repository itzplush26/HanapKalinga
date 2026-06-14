import { cn } from "@/lib/utils";
import { providerTypeLabel } from "@/lib/provider-role";

interface ProviderTypeBadgeProps {
  providerType: string | null | undefined;
  className?: string;
}

export function ProviderTypeBadge({ providerType, className }: ProviderTypeBadgeProps) {
  const isCaregiver = providerType === "caregiver";

  return (
    <span
      className={cn(
        "inline-flex rounded-full px-2 py-0.5 text-[11px] font-medium",
        isCaregiver ? "bg-indigo-100 text-indigo-800" : "bg-brand-50 text-brand-700",
        className
      )}
    >
      {providerTypeLabel(providerType)}
    </span>
  );
}

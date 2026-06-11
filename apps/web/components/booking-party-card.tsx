import { Badge } from "@/components/ui/badge";
import { ProfileAvatar } from "@/components/profile-avatar";

interface BookingPartyCardProps {
  name: string;
  subtitle: string;
  imageUrl?: string | null;
  badgeLabel?: string;
}

export function BookingPartyCard({ name, subtitle, imageUrl, badgeLabel }: BookingPartyCardProps) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4">
      <ProfileAvatar src={imageUrl} name={name} size="sm" className="h-14 w-14 text-sm" />
      <div className="min-w-0">
        <p className="truncate font-semibold text-slate-900">{name}</p>
        <p className="truncate text-sm text-slate-600">{subtitle}</p>
        {badgeLabel ? (
          <Badge className="mt-1 bg-brand-100 text-brand-800">{badgeLabel}</Badge>
        ) : null}
      </div>
    </div>
  );
}

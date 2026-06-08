import Image from "next/image";
import { Badge } from "@/components/ui/badge";

interface BookingPartyCardProps {
  name: string;
  subtitle: string;
  imageUrl?: string | null;
  badgeLabel?: string;
}

export function BookingPartyCard({ name, subtitle, imageUrl, badgeLabel }: BookingPartyCardProps) {
  const initials = name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");

  return (
    <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4">
      <div className="relative flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-full bg-slate-100 text-sm font-semibold text-slate-500">
        {imageUrl ? (
          <Image src={imageUrl} alt={name} fill sizes="56px" className="object-cover" />
        ) : (
          initials
        )}
      </div>
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

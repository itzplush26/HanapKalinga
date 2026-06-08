import Image from "next/image";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { AvailabilityStatus } from "@/lib/availability-status";
import { cn } from "@/lib/utils";

interface NurseCardProps {
  id: string;
  name: string;
  city: string;
  specializations: string[];
  yearsExperience: number;
  dailyRateLabel: string | null;
  averageRating?: number | null;
  reviewCount?: number;
  verified: boolean;
  availabilityStatus: AvailabilityStatus;
  imageUrl?: string;
  providerType?: string;
}

const MAX_VISIBLE_SPECIALIZATIONS = 3;

export function NurseCard({
  id,
  name,
  city,
  specializations,
  yearsExperience,
  dailyRateLabel,
  averageRating,
  reviewCount = 0,
  verified,
  availabilityStatus,
  imageUrl,
  providerType = "nurse"
}: NurseCardProps) {
  const initials =
    name
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join("") || "NL";

  const visibleSpecializations = specializations.slice(0, MAX_VISIBLE_SPECIALIZATIONS);
  const hiddenSpecializationCount = Math.max(0, specializations.length - MAX_VISIBLE_SPECIALIZATIONS);

  const availabilityLabel =
    availabilityStatus === "available_now"
      ? "Available now"
      : availabilityStatus === "available_next_week"
        ? "Available next week"
        : "Not accepting clients";

  const availabilityStyle =
    availabilityStatus === "available_now"
      ? "bg-emerald-100 text-emerald-700"
      : availabilityStatus === "available_next_week"
        ? "bg-amber-100 text-amber-700"
        : "bg-rose-100 text-rose-700";

  return (
    <Link href={`/nurses/${id}`} className="block w-full">
      <Card className="w-full transition hover:shadow-md">
        <CardContent className="flex gap-3 p-4">
          <div className="relative h-16 w-16 shrink-0">
            <div className="relative flex h-16 w-16 items-center justify-center overflow-hidden rounded-full bg-slate-100 text-sm font-semibold text-slate-500">
              {imageUrl ? (
                <Image src={imageUrl} alt="" fill sizes="64px" className="object-cover" />
              ) : (
                <span aria-hidden="true">{initials}</span>
              )}
            </div>
            {verified ? (
              <span className="absolute -bottom-0.5 -right-0.5 rounded-full border border-white bg-emerald-500 px-1.5 py-0.5 text-[10px] font-semibold text-white">
                ✓
              </span>
            ) : null}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <h3 className="line-clamp-2 text-base font-semibold leading-snug text-slate-900">{name}</h3>
                <p className="mt-0.5 truncate text-sm text-slate-600">
                  {city} • {yearsExperience} yrs exp
                </p>
              </div>
              <Badge className="shrink-0 bg-slate-100 text-slate-700">
                {providerType === "caregiver" ? "Caregiver" : "Nurse"}
              </Badge>
            </div>

            <div className="mt-2 flex flex-wrap gap-1.5">
              {visibleSpecializations.map((item) => (
                <Badge key={item} className="bg-slate-100 text-slate-700">
                  {item}
                </Badge>
              ))}
              {hiddenSpecializationCount > 0 ? (
                <Badge className="bg-slate-100 text-slate-600">+{hiddenSpecializationCount} more</Badge>
              ) : null}
            </div>

            <div className="mt-3 flex items-center justify-between gap-3 text-sm">
              <span className="shrink-0 text-slate-600">Daily rate</span>
              <span className="truncate text-right font-semibold text-slate-900">
                {dailyRateLabel ?? "Open to discuss"}
              </span>
            </div>

            <div className="mt-2 flex items-center justify-between gap-2">
              <Badge className={cn("shrink-0", availabilityStyle)}>{availabilityLabel}</Badge>
              <span className="truncate text-sm text-slate-600">
                {averageRating != null && reviewCount > 0 ? (
                  <>★ {Number(averageRating).toFixed(1)} ({reviewCount})</>
                ) : (
                  <span className="text-slate-400">No reviews yet</span>
                )}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

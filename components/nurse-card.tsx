import Image from "next/image";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { AvailabilityStatus } from "@/lib/availability-status";

interface NurseCardProps {
  id: string;
  name: string;
  city: string;
  specializations: string[];
  yearsExperience: number;
  dailyRate: number;
  averageRating?: number | null;
  reviewCount?: number;
  verified: boolean;
  availabilityStatus: AvailabilityStatus;
  imageUrl?: string;
  providerType?: string;
}

export function NurseCard({
  id,
  name,
  city,
  specializations,
  yearsExperience,
  dailyRate,
  averageRating,
  reviewCount = 0,
  verified,
  availabilityStatus,
  imageUrl,
  providerType = "nurse"
}: NurseCardProps) {
  const initials = name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("") || "NL";
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
    <Link href={`/nurses/${id}`} className="block">
      <Card className="transition hover:shadow-md">
        <CardContent className="flex items-center gap-4 p-4">
          <div className="relative flex h-16 w-16 items-center justify-center overflow-hidden rounded-full bg-slate-100 text-sm font-semibold text-slate-500">
            {imageUrl ? (
              <Image
                src={imageUrl}
                alt=""
                fill
                sizes="64px"
                className="object-cover"
              />
            ) : (
              <span aria-hidden="true">{initials}</span>
            )}
          </div>
          <div className="flex-1 space-y-2">
            <div className="flex items-center gap-2">
              <h3 className="text-base font-semibold text-slate-900">{name}</h3>
              <Badge className="bg-slate-100 text-slate-700">
                {providerType === "caregiver" ? "Caregiver" : "Nurse"}
              </Badge>
              {verified ? (
                <Badge className="bg-emerald-100 text-emerald-700">Verified</Badge>
              ) : null}
              <Badge className={availabilityStyle}>{availabilityLabel}</Badge>
            </div>
            <p className="text-sm text-slate-600">
              {city} • {yearsExperience} yrs exp
            </p>
            <div className="flex flex-wrap gap-2">
              {specializations.map((item) => (
                <Badge key={item} className="bg-slate-100 text-slate-700">
                  {item}
                </Badge>
              ))}
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-600">Daily rate</span>
              <span className="font-semibold text-slate-900">PHP {dailyRate}</span>
            </div>
            <div className="text-sm text-slate-600">
              {averageRating != null && reviewCount > 0 ? (
                <span>
                  ★ {Number(averageRating).toFixed(1)} ({reviewCount})
                </span>
              ) : (
                <span className="text-slate-400">No reviews yet</span>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

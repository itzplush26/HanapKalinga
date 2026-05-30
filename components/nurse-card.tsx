import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

interface NurseCardProps {
  id: string;
  name: string;
  city: string;
  specializations: string[];
  yearsExperience: number;
  dailyRate: number;
  rating: number;
  verified: boolean;
  imageUrl?: string;
}

export function NurseCard({
  id,
  name,
  city,
  specializations,
  yearsExperience,
  dailyRate,
  rating,
  verified,
  imageUrl
}: NurseCardProps) {
  return (
    <Link href={`/nurses/${id}`} className="block">
      <Card className="transition hover:shadow-md">
        <CardContent className="flex items-center gap-4 p-4">
          <div className="h-16 w-16 rounded-full bg-slate-100" aria-hidden="true">
            {imageUrl ? (
              <img src={imageUrl} alt="" className="h-full w-full rounded-full object-cover" />
            ) : null}
          </div>
          <div className="flex-1 space-y-2">
            <div className="flex items-center gap-2">
              <h3 className="text-base font-semibold text-slate-900">{name}</h3>
              {verified ? (
                <Badge className="bg-emerald-100 text-emerald-700">Verified</Badge>
              ) : null}
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
            <div className="text-sm text-slate-600">Rating {rating.toFixed(1)} / 5</div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

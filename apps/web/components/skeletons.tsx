import { Skeleton } from "@/components/ui/skeleton";

export function NurseCardSkeleton() {
  return (
    <div className="rounded-2xl border border-border bg-surface p-4">
      <div className="flex items-start gap-3">
        <Skeleton className="h-14 w-14 shrink-0 rounded-full" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-2/3" />
          <Skeleton className="h-3 w-1/2" />
          <div className="flex gap-2 pt-1">
            <Skeleton className="h-6 w-16 rounded-full" />
            <Skeleton className="h-6 w-20 rounded-full" />
            <Skeleton className="h-6 w-14 rounded-full" />
          </div>
        </div>
      </div>
    </div>
  );
}

export function NurseBrowseSkeleton() {
  return (
    <div className="space-y-4">
      {Array.from({ length: 6 }).map((_, index) => (
        <NurseCardSkeleton key={index} />
      ))}
    </div>
  );
}

export function BookingCardSkeleton() {
  return (
    <div className="rounded-2xl border border-border bg-surface p-4">
      <div className="flex items-center gap-3">
        <Skeleton className="h-11 w-11 rounded-full" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-3 w-1/3" />
          <Skeleton className="h-6 w-24 rounded-full" />
        </div>
      </div>
    </div>
  );
}

export function MessageRowSkeleton() {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-border bg-surface p-3">
      <Skeleton className="h-10 w-10 rounded-full" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-1/3" />
        <Skeleton className="h-3 w-4/5" />
      </div>
    </div>
  );
}

export function DashboardStatSkeleton() {
  return (
    <div className="rounded-2xl border border-border bg-surface p-4">
      <Skeleton className="h-8 w-16" />
      <Skeleton className="mt-2 h-3 w-24" />
    </div>
  );
}

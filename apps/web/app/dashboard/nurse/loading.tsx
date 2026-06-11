import { DashboardStatSkeleton } from "@/components/skeletons";
import { Skeleton } from "@/components/ui/skeleton";

export default function NurseDashboardLoading() {
  return (
    <main className="px-5 py-6">
      <div className="mx-auto flex max-w-md flex-col gap-4">
        <Skeleton className="h-32 w-full" />
        <DashboardStatSkeleton />
        <DashboardStatSkeleton />
      </div>
    </main>
  );
}

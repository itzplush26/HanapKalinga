import { Skeleton } from "@/components/ui/skeleton";

export default function NurseDashboardLoading() {
  return (
    <main className="px-5 py-8">
      <div className="mx-auto flex max-w-md flex-col gap-6">
        <Skeleton className="h-8 w-2/3" />
        <Skeleton className="h-16 w-full rounded-2xl" />
        <Skeleton className="h-24 w-full rounded-2xl" />
        <Skeleton className="h-24 w-full rounded-2xl" />
      </div>
    </main>
  );
}

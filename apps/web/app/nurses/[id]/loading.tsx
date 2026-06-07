import { Skeleton } from "@/components/ui/skeleton";

export default function NurseProfileLoading() {
  return (
    <main className="px-5 py-8">
      <div className="mx-auto flex max-w-md flex-col gap-5">
        <Skeleton className="h-32 w-full rounded-2xl" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
        <div className="flex flex-wrap gap-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-6 w-20 rounded-full" />
          ))}
        </div>
        <Skeleton className="h-40 w-full rounded-2xl" />
        <Skeleton className="h-11 w-full" />
      </div>
    </main>
  );
}

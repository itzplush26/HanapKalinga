import { Skeleton } from "@/components/ui/skeleton";

export default function NursesLoading() {
  return (
    <main className="px-5 py-8">
      <div className="mx-auto flex max-w-md flex-col gap-5">
        <Skeleton className="h-8 w-4/5" />
        <Skeleton className="h-4 w-full" />
        <div className="space-y-3 rounded-2xl border border-slate-200 bg-white p-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-full" />
          ))}
        </div>
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-28 w-full rounded-2xl" />
        ))}
      </div>
    </main>
  );
}

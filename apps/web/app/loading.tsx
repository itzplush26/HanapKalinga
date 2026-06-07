import { Skeleton } from "@/components/ui/skeleton";

export default function RootLoading() {
  return (
    <main className="px-5 py-10">
      <div className="mx-auto flex max-w-md flex-col gap-6">
        <Skeleton className="h-8 w-3/4" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
        <Skeleton className="mt-4 h-11 w-full" />
        <Skeleton className="h-11 w-full" />
      </div>
    </main>
  );
}

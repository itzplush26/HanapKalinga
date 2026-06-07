import { Skeleton } from "@/components/ui/skeleton";

export default function RegisterLoading() {
  return (
    <main className="px-5 py-8">
      <div className="mx-auto flex max-w-md flex-col gap-6">
        <Skeleton className="h-8 w-1/2" />
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-11 w-full" />
        <Skeleton className="h-11 w-full" />
      </div>
    </main>
  );
}

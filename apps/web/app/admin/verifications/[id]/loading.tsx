import { Skeleton } from "@/components/ui/skeleton";

export default function AdminVerificationDetailLoading() {
  return (
    <main className="space-y-6">
      <Skeleton className="h-4 w-72" />
      <Skeleton className="h-8 w-80" />
      <div className="grid gap-6 xl:grid-cols-[360px_1fr]">
        <Skeleton className="h-80 rounded-2xl" />
        <div className="grid gap-4 lg:grid-cols-2">
          <Skeleton className="h-96 rounded-2xl" />
          <Skeleton className="h-96 rounded-2xl" />
        </div>
      </div>
    </main>
  );
}

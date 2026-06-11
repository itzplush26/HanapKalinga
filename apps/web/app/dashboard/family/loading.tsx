import { BookingCardSkeleton } from "@/components/skeletons";

export default function FamilyDashboardLoading() {
  return (
    <main className="px-5 py-6">
      <div className="mx-auto flex max-w-md flex-col gap-4">
        <BookingCardSkeleton />
        <BookingCardSkeleton />
        <BookingCardSkeleton />
      </div>
    </main>
  );
}

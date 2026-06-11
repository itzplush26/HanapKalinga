import { NurseBrowseSkeleton } from "@/components/skeletons";

export default function NursesLoading() {
  return (
    <main className="px-5 py-8">
      <div className="mx-auto flex w-full max-w-md flex-col gap-5">
        <NurseBrowseSkeleton />
      </div>
    </main>
  );
}

import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { MessagesLayoutSuspense } from "@/components/messages-layout-suspense";
import { buildInbox } from "@/lib/messages";
import { PageHeader } from "@/components/page-header";
import { Skeleton } from "@/components/ui/skeleton";

function MessagesLoading() {
  return (
    <main className="px-5 py-6">
      <Skeleton className="mx-auto h-[560px] max-w-5xl rounded-2xl" />
    </main>
  );
}

async function NurseMessagesContent() {
  const supabase = createClient();
  const { data: auth } = await supabase.auth.getUser();
  const userId = auth.user?.id ?? "";
  const rows = userId ? await buildInbox(supabase, "nurse", userId) : [];

  return (
    <MessagesLayoutSuspense
      rows={rows}
      role="nurse"
      userId={userId}
      bookingDetailBasePath="/dashboard/nurse/bookings"
    />
  );
}

export default function NurseMessagesPage() {
  return (
    <>
      <PageHeader title="Messages" showBack={false} />
      <Suspense fallback={<MessagesLoading />}>
        <NurseMessagesContent />
      </Suspense>
    </>
  );
}

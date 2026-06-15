import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { MessagesLayoutSuspense } from "@/components/messages-layout-suspense";
import { buildInbox } from "@/lib/messages";
import { PageHeader } from "@/components/page-header";
import { Skeleton } from "@/components/ui/skeleton";
import { parseTooltipsDismissed } from "@/lib/family-onboarding";

function MessagesLoading() {
  return (
    <main className="px-5 py-6">
      <Skeleton className="mx-auto h-[560px] max-w-5xl rounded-2xl" />
    </main>
  );
}

async function FamilyMessagesContent() {
  const supabase = createClient();
  const { data: auth } = await supabase.auth.getUser();
  const userId = auth.user?.id ?? "";
  const rows = userId ? await buildInbox(supabase, "family", userId) : [];

  const { data: family } = userId
    ? await supabase.from("families").select("tooltips_dismissed").eq("id", userId).maybeSingle()
    : { data: null };
  const tooltips = parseTooltipsDismissed(family?.tooltips_dismissed);
  const showMessagesTooltip = !tooltips.messages;

  return (
    <MessagesLayoutSuspense
      rows={rows}
      role="family"
      userId={userId}
      bookingDetailBasePath="/dashboard/family/bookings"
      showMessagesTooltip={showMessagesTooltip}
    />
  );
}

export default function FamilyMessagesPage() {
  return (
    <>
      <PageHeader title="Messages" showBack={false} />
      <Suspense fallback={<MessagesLoading />}>
        <FamilyMessagesContent />
      </Suspense>
    </>
  );
}

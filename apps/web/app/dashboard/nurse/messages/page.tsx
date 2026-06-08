import { createClient } from "@/lib/supabase/server";
import { MessagesInbox } from "@/components/messages-inbox";
import { buildInbox } from "@/lib/messages";
import { PageHeader } from "@/components/page-header";

export default async function NurseMessagesPage() {
  const supabase = createClient();
  const { data: auth } = await supabase.auth.getUser();
  const userId = auth.user?.id ?? "";
  const rows = userId ? await buildInbox(supabase, "nurse", userId) : [];

  return (
    <>
      <PageHeader title="Messages" showBack={false} />
      <main className="px-5 py-6">
      <div className="mx-auto flex max-w-md flex-col gap-5">
        <MessagesInbox rows={rows} bookingDetailBasePath="/dashboard/nurse/bookings" />
      </div>
    </main>
    </>
  );
}

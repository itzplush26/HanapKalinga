import { createClient } from "@/lib/supabase/server";
import { MessagesInbox } from "@/components/messages-inbox";
import { buildInbox } from "@/lib/messages";

export default async function FamilyMessagesPage() {
  const supabase = createClient();
  const { data: auth } = await supabase.auth.getUser();
  const userId = auth.user?.id ?? "";
  const rows = userId ? await buildInbox(supabase, "family", userId) : [];

  return (
    <main className="px-5 py-8">
      <div className="mx-auto flex max-w-md flex-col gap-5">
        <h1 className="text-2xl font-semibold">Messages</h1>
        <MessagesInbox rows={rows} bookingDetailBasePath="/dashboard/family/bookings" />
      </div>
    </main>
  );
}

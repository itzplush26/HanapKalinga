import type { SupabaseClient } from "@supabase/supabase-js";

export type InboxRow = {
  bookingId: string;
  requestedDate: string;
  shift: string;
  status: string;
  otherPartyName: string;
  otherPartyId: string;
  lastMessage: string | null;
  lastMessageAt: string | null;
  unreadCount: number;
};

type MessageRow = {
  booking_id: string;
  sender_id: string;
  content: string | null;
  created_at: string;
  is_read: boolean | null;
};

type BookingRow = {
  id: string;
  family_id: string;
  nurse_id: string;
  requested_date: string;
  shift: string;
  status: string;
};

export function countUnreadByBooking(
  messages: MessageRow[],
  currentUserId: string
): Map<string, number> {
  const counts = new Map<string, number>();
  for (const message of messages) {
    if (message.is_read) continue;
    if (message.sender_id === currentUserId) continue;
    counts.set(message.booking_id, (counts.get(message.booking_id) ?? 0) + 1);
  }
  return counts;
}

export async function fetchUnreadCountByBooking(
  supabase: SupabaseClient,
  bookingIds: string[],
  currentUserId: string
): Promise<Map<string, number>> {
  if (!bookingIds.length) return new Map();
  const { data } = await supabase
    .from("messages")
    .select("booking_id, sender_id, is_read")
    .in("booking_id", bookingIds)
    .eq("is_read", false)
    .neq("sender_id", currentUserId);
  return countUnreadByBooking((data ?? []) as MessageRow[], currentUserId);
}

export async function fetchTotalUnreadCount(
  supabase: SupabaseClient,
  bookingIds: string[],
  currentUserId: string
): Promise<number> {
  const byBooking = await fetchUnreadCountByBooking(supabase, bookingIds, currentUserId);
  return [...byBooking.values()].reduce((sum, n) => sum + n, 0);
}

export async function fetchUserBookingIds(
  supabase: SupabaseClient,
  role: "family" | "nurse",
  userId: string
): Promise<string[]> {
  const column = role === "family" ? "family_id" : "nurse_id";
  const { data } = await supabase.from("bookings").select("id").eq(column, userId);
  return (data ?? []).map((row) => row.id as string);
}

export async function buildInbox(
  supabase: SupabaseClient,
  role: "family" | "nurse",
  userId: string
): Promise<InboxRow[]> {
  const column = role === "family" ? "family_id" : "nurse_id";
  const otherColumn = role === "family" ? "nurse_id" : "family_id";

  const { data: bookings } = await supabase
    .from("bookings")
    .select("id, family_id, nurse_id, requested_date, shift, status")
    .eq(column, userId)
    .order("created_at", { ascending: false });

  const bookingList = (bookings ?? []) as BookingRow[];
  const bookingIds = bookingList.map((b) => b.id);
  if (!bookingIds.length) return [];

  const { data: messages } = await supabase
    .from("messages")
    .select("booking_id, sender_id, content, created_at, is_read")
    .in("booking_id", bookingIds)
    .order("created_at", { ascending: false });

  const messageList = (messages ?? []) as MessageRow[];
  const bookingsWithMessages = new Set(messageList.map((m) => m.booking_id));
  const unreadMap = countUnreadByBooking(messageList, userId);

  const latestByBooking = new Map<string, MessageRow>();
  for (const message of messageList) {
    if (!latestByBooking.has(message.booking_id)) {
      latestByBooking.set(message.booking_id, message);
    }
  }

  const otherIds = [...new Set(bookingList.map((b) => b[otherColumn]))];
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, full_name")
    .in("id", otherIds);

  const nameById = new Map(
    (profiles ?? []).map((p) => [p.id as string, (p.full_name as string) ?? "User"])
  );

  return bookingList
    .filter((b) => bookingsWithMessages.has(b.id))
    .map((b) => {
      const latest = latestByBooking.get(b.id);
      return {
        bookingId: b.id,
        requestedDate: b.requested_date,
        shift: b.shift,
        status: b.status,
        otherPartyName: nameById.get(b[otherColumn]) ?? "User",
        otherPartyId: b[otherColumn],
        lastMessage: latest?.content ?? null,
        lastMessageAt: latest?.created_at ?? null,
        unreadCount: unreadMap.get(b.id) ?? 0
      };
    })
    .sort((a, b) => {
      const aTime = a.lastMessageAt ? new Date(a.lastMessageAt).getTime() : 0;
      const bTime = b.lastMessageAt ? new Date(b.lastMessageAt).getTime() : 0;
      return bTime - aTime;
    });
}

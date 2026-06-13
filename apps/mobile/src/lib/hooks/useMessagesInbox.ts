import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabase';

export interface InboxConversation {
  bookingId: string;
  otherUserId: string;
  otherUserName: string | null;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
}

export function useMessagesInbox(userId: string | undefined) {
  const [conversations, setConversations] = useState<InboxConversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchInbox = useCallback(async () => {
    if (!userId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { data: bookings, error: bookingsError } = await supabase
        .from('bookings')
        .select('id, family_id, nurse_id')
        .or(`family_id.eq.${userId},nurse_id.eq.${userId}`)
        .order('created_at', { ascending: false });

      if (bookingsError) {
        setError(bookingsError.message);
        return;
      }

      const bookingRows = (bookings ?? []) as Array<{
        id: string;
        family_id: string;
        nurse_id: string;
      }>;

      if (bookingRows.length === 0) {
        setConversations([]);
        setLoading(false);
        return;
      }

      const bookingIds = bookingRows.map((b) => b.id);

      const { data: messagesData } = await supabase
        .from('messages')
        .select('booking_id, content, created_at, sender_id')
        .in('booking_id', bookingIds)
        .order('created_at', { ascending: false });

      const msgRows = (messagesData ?? []) as Array<{
        booking_id: string;
        content: string;
        created_at: string;
        sender_id: string;
      }>;

      const latestMessageByBooking = new Map<string, typeof msgRows[0]>();
      const unreadCounts = new Map<string, number>();

      for (const msg of msgRows) {
        if (!latestMessageByBooking.has(msg.booking_id)) {
          latestMessageByBooking.set(msg.booking_id, msg);
        }
        if (msg.sender_id !== userId) {
          unreadCounts.set(
            msg.booking_id,
            (unreadCounts.get(msg.booking_id) ?? 0) + 1
          );
        }
      }

      const otherUserIds = [
        ...new Set(
          bookingRows.map((b) =>
            b.family_id === userId ? b.nurse_id : b.family_id
          )
        ),
      ];

      const { data: otherProfiles } = await supabase
        .from('profiles')
        .select('id, full_name')
        .in('id', otherUserIds);

      const profileMap = new Map(
        ((otherProfiles ?? []) as Array<{ id: string; full_name: string | null }>).map(
          (p) => [p.id, p]
        )
      );

      const items: InboxConversation[] = bookingRows
        .filter((b) => latestMessageByBooking.has(b.id))
        .map((b) => {
          const otherUserId = b.family_id === userId ? b.nurse_id : b.family_id;
          const otherProfile = profileMap.get(otherUserId);
          const latest = latestMessageByBooking.get(b.id)!;
          return {
            bookingId: b.id,
            otherUserId,
            otherUserName: otherProfile?.full_name ?? 'Unknown',
            lastMessage: latest.content,
            lastMessageTime: latest.created_at,
            unreadCount: unreadCounts.get(b.id) ?? 0,
          };
        })
        .sort(
          (a, b) =>
            new Date(b.lastMessageTime).getTime() -
            new Date(a.lastMessageTime).getTime()
        );

      setConversations(items);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load inbox');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchInbox();
  }, [fetchInbox]);

  return { conversations, loading, error, refetch: fetchInbox };
}

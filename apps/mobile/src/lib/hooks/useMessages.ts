import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabase';

export interface Message {
  id: string;
  booking_id: string;
  sender_id: string;
  content: string;
  created_at: string;
}

interface UseMessagesResult {
  messages: Message[];
  loading: boolean;
  error: string | null;
  sendMessage: (content: string) => Promise<{ error: string | null }>;
}

export function useMessages(bookingId: string | undefined, currentUserId: string | undefined): UseMessagesResult {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMessages = useCallback(async () => {
    if (!bookingId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { data, error: queryError } = await supabase
        .from('messages')
        .select('*')
        .eq('booking_id', bookingId)
        .order('created_at', { ascending: true });

      if (queryError) {
        setError(queryError.message);
      } else {
        setMessages((data ?? []) as unknown as Message[]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load messages');
    } finally {
      setLoading(false);
    }
  }, [bookingId]);

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  useEffect(() => {
    if (!bookingId) return;

    const channel = supabase
      .channel(`messages:${bookingId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `booking_id=eq.${bookingId}`,
        },
        (payload) => {
          const newMessage = payload.new as Message;
          setMessages((prev) => {
            if (prev.some((m) => m.id === newMessage.id)) return prev;
            return [...prev, newMessage];
          });
        }
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [bookingId]);

  const sendMessage = useCallback(async (content: string) => {
    if (!bookingId || !currentUserId || !content.trim()) {
      return { error: 'Cannot send empty message' };
    }

    try {
      const { error: insertError } = await supabase.from('messages').insert({
        booking_id: bookingId,
        sender_id: currentUserId,
        content: content.trim(),
      } as any);

      if (insertError) {
        return { error: insertError.message };
      }

      return { error: null };
    } catch (err) {
      return { error: err instanceof Error ? err.message : 'Failed to send message' };
    }
  }, [bookingId, currentUserId]);

  return { messages, loading, error, sendMessage };
}

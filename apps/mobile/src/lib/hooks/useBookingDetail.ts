import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabase';
import { getApiUrl } from '@hanapkalinga/shared/api';
import type { Booking, Message, Review } from '@hanapkalinga/shared/types';

interface BookingProfile {
  id: string;
  full_name: string | null;
  city: string | null;
  phone: string | null;
}

export interface BookingDetailData {
  booking: Booking | null;
  family: BookingProfile | null;
  nurse: BookingProfile | null;
  messages: Message[];
  review: Review | null;
}

export function useBookingDetail(bookingId: string | undefined) {
  const [data, setData] = useState<BookingDetailData>({
    booking: null,
    family: null,
    nurse: null,
    messages: [],
    review: null,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const apiUrl = getApiUrl();

  const fetchDetail = useCallback(async () => {
    if (!bookingId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { data: bookingRow, error: bookingError } = await supabase
        .from('bookings')
        .select('*')
        .eq('id', bookingId)
        .single();

      if (bookingError) {
        setError(bookingError.message);
        return;
      }

      const booking = bookingRow as unknown as Booking;

      const [{ data: fp }, { data: np }, { data: msgs }, { data: rv }] = await Promise.all([
        supabase.from('profiles').select('id, full_name, city, phone').eq('id', booking.family_id).single(),
        supabase.from('profiles').select('id, full_name, city, phone').eq('id', booking.nurse_id).single(),
        supabase.from('messages').select('*').eq('booking_id', bookingId).order('created_at', { ascending: true }),
        supabase.from('reviews').select('*').eq('booking_id', bookingId).maybeSingle(),
      ]);

      setData({
        booking,
        family: fp as unknown as BookingProfile | null,
        nurse: np as unknown as BookingProfile | null,
        messages: (msgs ?? []) as unknown as Message[],
        review: rv as unknown as Review | null,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load booking detail');
    } finally {
      setLoading(false);
    }
  }, [bookingId]);

  const cancelMutation = useCallback(async (reason: string, cancelledBy: 'family' | 'nurse') => {
    if (!bookingId) return { error: 'No booking ID' };
    setActionLoading(true);
    try {
      const res = await fetch(`${apiUrl}/api/bookings/${bookingId}/cancel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason, cancelledBy }),
      });
      const json = await res.json();
      if (!res.ok) return { error: json.error ?? 'Failed to cancel booking' };
      await fetchDetail();
      return { error: null };
    } catch (err) {
      return { error: err instanceof Error ? err.message : 'Failed to cancel booking' };
    } finally {
      setActionLoading(false);
    }
  }, [bookingId, apiUrl, fetchDetail]);

  const markCompleteMutation = useCallback(async () => {
    if (!bookingId) return { error: 'No booking ID' };
    setActionLoading(true);
    try {
      const res = await fetch(`${apiUrl}/api/bookings/${bookingId}/mark-complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      const json = await res.json();
      if (!res.ok) return { error: json.error ?? 'Failed to mark complete' };
      await fetchDetail();
      return { error: null };
    } catch (err) {
      return { error: err instanceof Error ? err.message : 'Failed to mark complete' };
    } finally {
      setActionLoading(false);
    }
  }, [bookingId, apiUrl, fetchDetail]);

  const confirmCompletionMutation = useCallback(async () => {
    if (!bookingId) return { error: 'No booking ID' };
    setActionLoading(true);
    try {
      const res = await fetch(`${apiUrl}/api/bookings/${bookingId}/confirm-completion`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      const json = await res.json();
      if (!res.ok) return { error: json.error ?? 'Failed to confirm completion' };
      await fetchDetail();
      return { error: null };
    } catch (err) {
      return { error: err instanceof Error ? err.message : 'Failed to confirm completion' };
    } finally {
      setActionLoading(false);
    }
  }, [bookingId, apiUrl, fetchDetail]);

  const disputeMutation = useCallback(async (description: string) => {
    if (!bookingId) return { error: 'No booking ID' };
    setActionLoading(true);
    try {
      const res = await fetch(`${apiUrl}/api/bookings/${bookingId}/dispute`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description }),
      });
      const json = await res.json();
      if (!res.ok) return { error: json.error ?? 'Failed to dispute booking' };
      await fetchDetail();
      return { error: null };
    } catch (err) {
      return { error: err instanceof Error ? err.message : 'Failed to dispute booking' };
    } finally {
      setActionLoading(false);
    }
  }, [bookingId, apiUrl, fetchDetail]);

  useEffect(() => {
    fetchDetail();
  }, [fetchDetail]);

  return {
    ...data,
    loading,
    error,
    actionLoading,
    refetch: fetchDetail,
    cancel: cancelMutation,
    markComplete: markCompleteMutation,
    confirmCompletion: confirmCompletionMutation,
    dispute: disputeMutation,
  };
}

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabase';
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

  useEffect(() => {
    fetchDetail();
  }, [fetchDetail]);

  return { ...data, loading, error, refetch: fetchDetail };
}

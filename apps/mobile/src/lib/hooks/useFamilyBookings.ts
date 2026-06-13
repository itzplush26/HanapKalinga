import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabase';
import type { BookingStatus, Shift } from '@hanapkalinga/shared/types';

export interface FamilyBookingItem {
  id: string;
  requested_date: string | null;
  shift: Shift | null;
  status: BookingStatus;
  created_at: string;
  nurse_name: string | null;
  nurse_city: string | null;
  unread_count: number;
}

export function useFamilyBookings(familyId: string | undefined) {
  const [bookings, setBookings] = useState<FamilyBookingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchBookings = useCallback(async (isRefresh = false) => {
    if (!familyId) {
      setLoading(false);
      return;
    }

    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);

    try {
      const { data, error: queryError } = await supabase
        .from('bookings')
        .select(`
          id,
          requested_date,
          shift,
          status,
          created_at,
          nurse_id
        `)
        .eq('family_id', familyId)
        .order('created_at', { ascending: false });

      if (queryError) {
        setError(queryError.message);
        return;
      }

      const rows = (data ?? []) as Array<{
        id: string;
        requested_date: string | null;
        shift: Shift | null;
        status: BookingStatus;
        created_at: string;
        nurse_id: string;
      }>;

      const nurseIds = [...new Set(rows.map((b) => b.nurse_id))];

      const { data: nursesData } = await supabase
        .from('profiles')
        .select('id, full_name, city')
        .in('id', nurseIds);

      const nurseMap = new Map(
        ((nursesData ?? []) as Array<{ id: string; full_name: string | null; city: string | null }>).map(
          (n) => [n.id, n]
        )
      );

      const { data: msgData } = await supabase
        .from('messages')
        .select('booking_id')
        .in(
          'booking_id',
          rows.map((b) => b.id)
        );

      const unreadMap = new Map<string, number>();
      for (const msg of (msgData ?? []) as Array<{ booking_id: string }>) {
        unreadMap.set(msg.booking_id, (unreadMap.get(msg.booking_id) ?? 0) + 1);
      }

      const items: FamilyBookingItem[] = rows.map((b) => {
        const nurse = nurseMap.get(b.nurse_id);
        return {
          id: b.id,
          requested_date: b.requested_date,
          shift: b.shift,
          status: b.status,
          created_at: b.created_at,
          nurse_name: nurse?.full_name ?? null,
          nurse_city: nurse?.city ?? null,
          unread_count: unreadMap.get(b.id) ?? 0,
        };
      });

      setBookings(items);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load bookings');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [familyId]);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  return { bookings, loading, error, refreshing, refetch: () => fetchBookings(true) };
}

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabase';
import type { Nurse, VerificationStatus, BookingStatus, Shift } from '@hanapkalinga/shared/types';

interface DashboardNotification {
  id: string;
  title: string;
  body: string;
  is_read: boolean;
  created_at: string;
}

interface DashboardBooking {
  id: string;
  requested_date: string | null;
  shift: Shift | null;
  status: BookingStatus;
  created_at: string;
  family_name: string | null;
  family_city: string | null;
}

export interface NurseDashboardData {
  nurse: Pick<Nurse, 'id' | 'verification_status' | 'hourly_rate' | 'daily_rate_12hr' | 'specializations'> | null;
  notifications: DashboardNotification[];
  recentBookings: DashboardBooking[];
}

interface UseNurseDashboardResult {
  data: NurseDashboardData | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useNurseDashboard(nurseId: string | undefined): UseNurseDashboardResult {
  const [data, setData] = useState<NurseDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboard = useCallback(async () => {
    if (!nurseId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { data: nurseRow, error: nurseError } = await supabase
        .from('nurses')
        .select('id, verification_status, hourly_rate, daily_rate_12hr, specializations')
        .eq('id', nurseId)
        .single();

      if (nurseError) {
        setError(nurseError.message);
        return;
      }

      const [{ data: notifs }, { data: bookings }] = await Promise.all([
        supabase
          .from('notifications')
          .select('id, title, body, is_read, created_at')
          .eq('user_id', nurseId)
          .order('created_at', { ascending: false })
          .limit(5),
        supabase
          .from('bookings')
          .select('id, requested_date, shift, status, created_at, family_id')
          .eq('nurse_id', nurseId)
          .order('created_at', { ascending: false })
          .limit(3),
      ]);

      const rows = (bookings ?? []) as Array<{
        id: string;
        requested_date: string | null;
        shift: Shift | null;
        status: BookingStatus;
        created_at: string;
        family_id: string;
      }>;

      const familyIds = [...new Set(rows.map((b) => b.family_id))];

      const { data: familiesData } = await supabase
        .from('profiles')
        .select('id, full_name, city')
        .in('id', familyIds);

      const familyMap = new Map(
        ((familiesData ?? []) as Array<{ id: string; full_name: string | null; city: string | null }>).map(
          (f) => [f.id, f]
        )
      );

      const recentBookings: DashboardBooking[] = rows.map((b) => {
        const family = familyMap.get(b.family_id);
        return {
          id: b.id,
          requested_date: b.requested_date,
          shift: b.shift,
          status: b.status,
          created_at: b.created_at,
          family_name: family?.full_name ?? null,
          family_city: family?.city ?? null,
        };
      });

      setData({
        nurse: nurseRow as unknown as NurseDashboardData['nurse'],
        notifications: (notifs ?? []) as DashboardNotification[],
        recentBookings,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  }, [nurseId]);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  return { data, loading, error, refetch: fetchDashboard };
}

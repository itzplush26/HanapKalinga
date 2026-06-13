import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabase';

export interface AdminMetrics {
  pendingVerifications: number;
  underReviewCount: number;
  totalBookings: number;
  totalSignups: number;
}

interface UseAdminMetricsResult {
  data: AdminMetrics | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useAdminMetrics(): UseAdminMetricsResult {
  const [data, setData] = useState<AdminMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMetrics = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const [{ count: pending }, { count: underReview }, { count: bookings }, { count: signups }] =
        await Promise.all([
          supabase.from('nurses').select('id', { count: 'exact', head: true }).eq('verification_status', 'pending'),
          supabase.from('nurses').select('id', { count: 'exact', head: true }).eq('verification_status', 'under_review'),
          supabase.from('bookings').select('id', { count: 'exact', head: true }),
          supabase.from('profiles').select('id', { count: 'exact', head: true }),
        ]);

      setData({
        pendingVerifications: pending ?? 0,
        underReviewCount: underReview ?? 0,
        totalBookings: bookings ?? 0,
        totalSignups: signups ?? 0,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load metrics');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMetrics();
  }, [fetchMetrics]);

  return { data, loading, error, refetch: fetchMetrics };
}

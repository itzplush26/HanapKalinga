import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabase';
import type { CareRequest } from '@hanapkalinga/shared/types';

export interface NurseCareRequestItem extends CareRequest {
  family_name: string | null;
  family_city: string | null;
}

export function useNurseCareRequests() {
  const [careRequests, setCareRequests] = useState<NurseCareRequestItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchCareRequests = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);

    try {
      const { data, error: queryError } = await supabase
        .from('care_requests')
        .select('*')
        .eq('status', 'open')
        .order('created_at', { ascending: false });

      if (queryError) {
        setError(queryError.message);
        return;
      }

      const rows = (data ?? []) as unknown as CareRequest[];

      const familyIds = [...new Set(rows.map((r) => r.family_id))];
      const { data: familiesData } = await supabase
        .from('profiles')
        .select('id, full_name, city')
        .in('id', familyIds);

      const familyMap = new Map(
        ((familiesData ?? []) as { id: string; full_name: string | null; city: string | null }[]).map(
          (f) => [f.id, f]
        )
      );

      const items: NurseCareRequestItem[] = rows.map((r) => {
        const family = familyMap.get(r.family_id);
        return {
          ...r,
          family_name: family?.full_name ?? null,
          family_city: family?.city ?? null,
        };
      });

      setCareRequests(items);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load care requests');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchCareRequests();
  }, [fetchCareRequests]);

  return { careRequests, loading, error, refreshing, refetch: () => fetchCareRequests(true) };
}

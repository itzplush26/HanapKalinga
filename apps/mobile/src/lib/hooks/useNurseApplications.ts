import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabase';
import type { CareRequestApplication, ApplicationStatus } from '@hanapkalinga/shared/types';

export interface NurseApplicationItem extends CareRequestApplication {
  care_request_title: string | null;
  care_request_city: string | null;
}

export function useNurseApplications(nurseId: string | undefined) {
  const [applications, setApplications] = useState<NurseApplicationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchApplications = useCallback(async (isRefresh = false) => {
    if (!nurseId) {
      setLoading(false);
      return;
    }

    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);

    try {
      const { data, error: queryError } = await supabase
        .from('care_request_applications')
        .select('*')
        .eq('nurse_id', nurseId)
        .order('created_at', { ascending: false });

      if (queryError) {
        setError(queryError.message);
        return;
      }

      const rows = (data ?? []) as unknown as CareRequestApplication[];

      const requestIds = [...new Set(rows.map((a) => a.care_request_id))];
      const { data: requestsData } = await supabase
        .from('care_requests')
        .select('id, title, city')
        .in('id', requestIds);

      const requestMap = new Map(
        ((requestsData ?? []) as { id: string; title: string | null; city: string | null }[]).map(
          (r) => [r.id, r]
        )
      );

      const items: NurseApplicationItem[] = rows.map((a) => {
        const cr = requestMap.get(a.care_request_id);
        return {
          ...a,
          care_request_title: cr?.title ?? null,
          care_request_city: cr?.city ?? null,
        };
      });

      setApplications(items);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load applications');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [nurseId]);

  useEffect(() => {
    fetchApplications();
  }, [fetchApplications]);

  return { applications, loading, error, refreshing, refetch: () => fetchApplications(true) };
}

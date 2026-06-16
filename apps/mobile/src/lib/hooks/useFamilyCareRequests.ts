import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabase';
import type { CareRequest, CareRequestStatus } from '@hanapkalinga/shared/types';

export interface FamilyCareRequestItem extends CareRequest {
  application_count: number;
}

export function useFamilyCareRequests(familyId: string | undefined) {
  const [careRequests, setCareRequests] = useState<FamilyCareRequestItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchCareRequests = useCallback(async (isRefresh = false) => {
    if (!familyId) {
      setLoading(false);
      return;
    }

    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);

    try {
      const { data, error: queryError } = await supabase
        .from('care_requests')
        .select('*')
        .eq('family_id', familyId)
        .order('created_at', { ascending: false });

      if (queryError) {
        setError(queryError.message);
        return;
      }

      const rows = (data ?? []) as unknown as CareRequest[];

      const requestIds = rows.map((r) => r.id);
      const { data: appData } = await supabase
        .from('care_request_applications')
        .select('care_request_id')
        .in('care_request_id', requestIds);

      const appCountMap = new Map<string, number>();
      for (const app of (appData ?? []) as Array<{ care_request_id: string }>) {
        appCountMap.set(app.care_request_id, (appCountMap.get(app.care_request_id) ?? 0) + 1);
      }

      const items: FamilyCareRequestItem[] = rows.map((r) => ({
        ...r,
        application_count: appCountMap.get(r.id) ?? 0,
      }));

      setCareRequests(items);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load care requests');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [familyId]);

  useEffect(() => {
    fetchCareRequests();
  }, [fetchCareRequests]);

  return { careRequests, loading, error, refreshing, refetch: () => fetchCareRequests(true) };
}

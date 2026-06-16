import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabase';
import type { CareRequest, CareRequestApplication, Profile } from '@hanapkalinga/shared/types';

export interface CareRequestDetailData {
  careRequest: CareRequest | null;
  applications: (CareRequestApplication & { nurse: Pick<Profile, 'id' | 'full_name' | 'city'> | null })[];
}

export function useCareRequestDetail(careRequestId: string | undefined) {
  const [data, setData] = useState<CareRequestDetailData>({
    careRequest: null,
    applications: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDetail = useCallback(async () => {
    if (!careRequestId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { data: cr, error: crError } = await supabase
        .from('care_requests')
        .select('*')
        .eq('id', careRequestId)
        .single();

      if (crError) {
        setError(crError.message);
        return;
      }

      const { data: apps } = await supabase
        .from('care_request_applications')
        .select('*')
        .eq('care_request_id', careRequestId)
        .order('created_at', { ascending: true });

      const appRows = (apps ?? []) as unknown as CareRequestApplication[];

      const nurseIds = [...new Set(appRows.map((a) => a.nurse_id))];
      const { data: nurseProfiles } = await supabase
        .from('profiles')
        .select('id, full_name, city')
        .in('id', nurseIds);

      const nurseMap = new Map(
        ((nurseProfiles ?? []) as Pick<Profile, 'id' | 'full_name' | 'city'>[]).map(
          (n) => [n.id, n]
        )
      );

      const applications = appRows.map((a) => ({
        ...a,
        nurse: nurseMap.get(a.nurse_id) ?? null,
      }));

      setData({
        careRequest: cr as unknown as CareRequest,
        applications,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load care request detail');
    } finally {
      setLoading(false);
    }
  }, [careRequestId]);

  useEffect(() => {
    fetchDetail();
  }, [fetchDetail]);

  return { ...data, loading, error, refetch: fetchDetail };
}

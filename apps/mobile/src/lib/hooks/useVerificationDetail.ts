import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabase';
import type { Nurse, Profile, VerificationStatus, ProviderType } from '@hanapkalinga/shared/types';

export interface AuditLogEntry {
  id: string;
  action: string;
  previous_status: string | null;
  new_status: string;
  rejection_reason: string | null;
  review_notes: string | null;
  created_at: string;
  admin_name: string;
}

export interface VerificationDetailData {
  nurse: Nurse | null;
  profile: Profile | null;
  auditLogs: AuditLogEntry[];
}

interface UseVerificationDetailResult {
  data: VerificationDetailData | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useVerificationDetail(nurseId: string | undefined): UseVerificationDetailResult {
  const [data, setData] = useState<VerificationDetailData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDetail = useCallback(async () => {
    if (!nurseId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { data: nurseRow, error: nurseError } = await supabase
        .from('nurses')
        .select('*')
        .eq('id', nurseId)
        .single();

      if (nurseError) {
        setError(nurseError.message);
        return;
      }

      const { data: profileRow } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', nurseId)
        .single();

      const { data: auditRows } = await supabase
        .from('verification_audit_logs')
        .select('id, action, previous_status, new_status, rejection_reason, review_notes, created_at, admin_id')
        .eq('nurse_id', nurseId)
        .order('created_at', { ascending: false });

      const auditData = (auditRows ?? []) as Array<{
        id: string;
        action: string;
        previous_status: string | null;
        new_status: string;
        rejection_reason: string | null;
        review_notes: string | null;
        created_at: string;
        admin_id: string;
      }>;

      const adminIds = [...new Set(auditData.map((e) => e.admin_id))];
      const { data: adminProfiles } = adminIds.length > 0
        ? await supabase.from('profiles').select('id, full_name').in('id', adminIds)
        : { data: [] };

      const adminNameMap = new Map(
        ((adminProfiles ?? []) as Array<{ id: string; full_name: string | null }>).map(
          (a) => [a.id, a.full_name ?? 'Administrator']
        )
      );

      const auditLogs: AuditLogEntry[] = auditData.map((entry) => ({
        id: entry.id,
        action: entry.action,
        previous_status: entry.previous_status,
        new_status: entry.new_status,
        rejection_reason: entry.rejection_reason,
        review_notes: entry.review_notes,
        created_at: entry.created_at,
        admin_name: adminNameMap.get(entry.admin_id) ?? 'Administrator',
      }));

      setData({
        nurse: nurseRow as unknown as Nurse,
        profile: profileRow as unknown as Profile | null,
        auditLogs,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load verification detail');
    } finally {
      setLoading(false);
    }
  }, [nurseId]);

  useEffect(() => {
    fetchDetail();
  }, [fetchDetail]);

  return { data, loading, error, refetch: fetchDetail };
}

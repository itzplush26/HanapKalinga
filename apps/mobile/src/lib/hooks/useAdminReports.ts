import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabase';
import type { IncidentReport, IncidentReportStatus } from '@hanapkalinga/shared/types';

export interface AdminReportItem extends IncidentReport {
  reporter_name: string | null;
  reported_user_name: string | null;
}

export function useAdminReports() {
  const [reports, setReports] = useState<AdminReportItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchReports = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);

    try {
      const { data, error: queryError } = await supabase
        .from('incident_reports')
        .select('*')
        .order('created_at', { ascending: false });

      if (queryError) {
        setError(queryError.message);
        return;
      }

      const rows = (data ?? []) as unknown as IncidentReport[];

      const userIds = [...new Set(rows.flatMap((r) => [r.reporter_id, r.reported_user_id]))];
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('id, full_name')
        .in('id', userIds);

      const profileMap = new Map(
        ((profilesData ?? []) as { id: string; full_name: string | null }[]).map(
          (p) => [p.id, p.full_name]
        )
      );

      const items: AdminReportItem[] = rows.map((r) => ({
        ...r,
        reporter_name: profileMap.get(r.reporter_id) ?? null,
        reported_user_name: profileMap.get(r.reported_user_id) ?? null,
      }));

      setReports(items);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load reports');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  const updateStatus = useCallback(async (reportId: string, status: IncidentReportStatus, adminNotes?: string) => {
    try {
      const updates: Record<string, any> = {
        status,
        ...(status === 'reviewed' || status === 'resolved' ? { reviewed_at: new Date().toISOString() } : {}),
        ...(adminNotes !== undefined ? { admin_notes: adminNotes } : {}),
      };

      const { error: updateError } = await (supabase
        .from('incident_reports') as any)
        .update(updates)
        .eq('id', reportId);

      if (updateError) return { error: updateError.message };
      await fetchReports(true);
      return { error: null };
    } catch (err) {
      return { error: err instanceof Error ? err.message : 'Failed to update report' };
    }
  }, [fetchReports]);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  return { reports, loading, error, refreshing, refetch: () => fetchReports(true), updateStatus };
}

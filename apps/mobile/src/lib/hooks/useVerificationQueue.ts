import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabase';
import type { VerificationStatus, ProviderType } from '@hanapkalinga/shared/types';

export interface VerificationQueueItem {
  id: string;
  full_name: string | null;
  city: string | null;
  provider_type: ProviderType | null;
  verification_status: VerificationStatus;
  submitted_at: string | null;
}

export type VerificationFilter = VerificationStatus | 'all';

interface UseVerificationQueueResult {
  data: VerificationQueueItem[];
  loading: boolean;
  loadingMore: boolean;
  error: string | null;
  refetch: () => void;
  loadMore: () => void;
  hasMore: boolean;
}

const PAGE_SIZE = 20;

function buildQuery(filter: VerificationFilter, page: number) {
  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  let query = supabase
    .from('nurses')
    .select(`
      id,
      provider_type,
      verification_status,
      submitted_at,
      profile:profiles!inner(
        full_name,
        city
      )
    `)
    .order('submitted_at', { ascending: false, nullsFirst: false })
    .range(from, to);

  if (filter === 'all') {
    query = query.in('verification_status', ['pending', 'under_review']);
  } else {
    query = query.eq('verification_status', filter);
  }

  return query;
}

function mapResult(raw: unknown): VerificationQueueItem[] {
  const rows = raw as Array<{
    id: string;
    provider_type: ProviderType | null;
    verification_status: VerificationStatus;
    submitted_at: string | null;
    profile: { full_name: string | null; city: string | null } | null;
  }>;

  return rows.map((row) => ({
    id: row.id,
    full_name: row.profile?.full_name ?? null,
    city: row.profile?.city ?? null,
    provider_type: row.provider_type,
    verification_status: row.verification_status,
    submitted_at: row.submitted_at,
  }));
}

export function useVerificationQueue(filter: VerificationFilter = 'all'): UseVerificationQueueResult {
  const [data, setData] = useState<VerificationQueueItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const fetchItems = useCallback(
    async (pageNum: number, append: boolean) => {
      const query = buildQuery(filter, pageNum);
      const { data: result, error: queryError } = await query;

      if (queryError) {
        setError(queryError.message);
        return;
      }

      const mapped = mapResult(result);

      if (append) {
        setData((prev) => [...prev, ...mapped]);
      } else {
        setData(mapped);
      }

      setHasMore(mapped.length === PAGE_SIZE);
    },
    [filter]
  );

  const refetch = useCallback(() => {
    setLoading(true);
    setError(null);
    setPage(1);
    setData([]);
    fetchItems(1, false).finally(() => setLoading(false));
  }, [fetchItems]);

  const loadMore = useCallback(() => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    const nextPage = page + 1;
    fetchItems(nextPage, true)
      .then(() => setPage(nextPage))
      .finally(() => setLoadingMore(false));
  }, [loadingMore, hasMore, page, fetchItems]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { data, loading, loadingMore, error, refetch, loadMore, hasMore };
}

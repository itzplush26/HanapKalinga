import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabase';
import type { BookingStatus, Shift } from '@hanapkalinga/shared/types';

export interface AdminBookingItem {
  id: string;
  requested_date: string | null;
  shift: Shift | null;
  status: BookingStatus;
  family_name: string | null;
  nurse_name: string | null;
}

export type BookingFilter = BookingStatus | 'all';

interface UseAdminBookingsResult {
  data: AdminBookingItem[];
  loading: boolean;
  loadingMore: boolean;
  error: string | null;
  refetch: () => void;
  loadMore: () => void;
  hasMore: boolean;
  search: string;
  setSearch: (value: string) => void;
}

const PAGE_SIZE = 20;

function buildQuery(filter: BookingFilter, search: string, page: number) {
  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  let query = supabase
    .from('bookings')
    .select(`
      id,
      requested_date,
      shift,
      status,
      family_id,
      nurse_id
    `)
    .order('created_at', { ascending: false })
    .range(from, to);

  if (filter !== 'all') {
    query = query.eq('status', filter);
  }

  return query;
}

export function useAdminBookings(): UseAdminBookingsResult {
  const [data, setData] = useState<AdminBookingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [search, setSearch] = useState('');

  const fetchItems = useCallback(
    async (pageNum: number, append: boolean, currentSearch: string) => {
      const from = (pageNum - 1) * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;

      let query = supabase
        .from('bookings')
        .select(`
          id,
          requested_date,
          shift,
          status,
          family_id,
          nurse_id
        `)
        .order('created_at', { ascending: false })
        .range(from, to);

      const { data: result, error: queryError } = await query;

      if (queryError) {
        setError(queryError.message);
        return;
      }

      const rows = (result ?? []) as Array<{
        id: string;
        requested_date: string | null;
        shift: Shift | null;
        status: BookingStatus;
        family_id: string;
        nurse_id: string;
      }>;

      const profileIds = [...new Set(rows.flatMap((r) => [r.family_id, r.nurse_id]))];

      const { data: profilesData } = await supabase
        .from('profiles')
        .select('id, full_name')
        .in('id', profileIds);

      const profileMap = new Map(
        ((profilesData ?? []) as Array<{ id: string; full_name: string | null }>).map(
          (p) => [p.id, p.full_name ?? 'Unknown']
        )
      );

      const mapped: AdminBookingItem[] = rows.map((r) => ({
        id: r.id,
        requested_date: r.requested_date,
        shift: r.shift,
        status: r.status,
        family_name: profileMap.get(r.family_id) ?? 'Unknown',
        nurse_name: profileMap.get(r.nurse_id) ?? 'Unknown',
      }));

      if (append) {
        setData((prev) => [...prev, ...mapped]);
      } else {
        setData(mapped);
      }

      setHasMore(mapped.length === PAGE_SIZE);
    },
    []
  );

  const refetch = useCallback(() => {
    setLoading(true);
    setError(null);
    setPage(1);
    setData([]);
    fetchItems(1, false, search).finally(() => setLoading(false));
  }, [fetchItems, search]);

  const loadMore = useCallback(() => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    const nextPage = page + 1;
    fetchItems(nextPage, true, search)
      .then(() => setPage(nextPage))
      .finally(() => setLoadingMore(false));
  }, [loadingMore, hasMore, page, fetchItems, search]);

  const debouncedSetSearch = useCallback((value: string) => {
    setSearch(value);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (search !== undefined) {
        refetch();
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [search, refetch]);

  return { data, loading, loadingMore, error, refetch, loadMore, hasMore, search, setSearch: debouncedSetSearch };
}

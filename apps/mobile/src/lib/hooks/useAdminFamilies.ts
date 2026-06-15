import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabase';

export interface AdminFamilyItem {
  id: string;
  full_name: string | null;
  city: string | null;
  patient_name: string | null;
}

interface UseAdminFamiliesResult {
  data: AdminFamilyItem[];
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

export function useAdminFamilies(): UseAdminFamiliesResult {
  const [data, setData] = useState<AdminFamilyItem[]>([]);
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
        .from('families')
        .select(`
          id,
          patient_name,
          profile:profiles!inner(
            full_name,
            city
          )
        `)
        .order('patient_name', { ascending: true, nullsFirst: false })
        .range(from, to);

      if (currentSearch.trim()) {
        query = query.ilike('profile.full_name', `%${currentSearch.trim()}%`);
      }

      const { data: result, error: queryError } = await query;

      if (queryError) {
        setError(queryError.message);
        return;
      }

      const rows = result as Array<{
        id: string;
        patient_name: string | null;
        profile: { full_name: string | null; city: string | null } | null;
      }>;

      const mapped = rows.map((row) => ({
        id: row.id,
        full_name: row.profile?.full_name ?? null,
        city: row.profile?.city ?? null,
        patient_name: row.patient_name,
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

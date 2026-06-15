import { useState, useEffect, useCallback } from 'react';
import type { PostgrestFilterBuilder } from '@supabase/supabase-js';

interface UseSupabaseQueryResult<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useSupabaseQuery<T>(
  queryBuilder: (() => PostgrestFilterBuilder<any, any, any, any>) | null,
  deps: unknown[] = []
): UseSupabaseQueryResult<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!queryBuilder) {
      setData(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const query = queryBuilder();
      const { data: result, error: queryError } = await query;

      if (queryError) {
        setError(queryError.message);
      } else {
        setData(result as unknown as T);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch: fetchData };
}

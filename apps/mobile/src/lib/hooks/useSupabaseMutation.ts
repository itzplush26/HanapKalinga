import { useState, useCallback } from 'react';

interface UseSupabaseMutationResult<T> {
  mutate: (payload: T) => Promise<{ data: unknown; error: string | null }>;
  loading: boolean;
  error: string | null;
}

export function useSupabaseMutation<T>(
  mutationFn: (payload: T) => Promise<{ data: unknown; error: Error | null }>
): UseSupabaseMutationResult<T> {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const mutate = useCallback(
    async (payload: T) => {
      setLoading(true);
      setError(null);

      try {
        const { data, error: mutationError } = await mutationFn(payload);
        if (mutationError) {
          const message = mutationError.message;
          setError(message);
          return { data: null, error: message };
        }
        return { data, error: null };
      } catch (err) {
        const message = err instanceof Error ? err.message : 'An unexpected error occurred';
        setError(message);
        return { data: null, error: message };
      } finally {
        setLoading(false);
      }
    },
    [mutationFn]
  );

  return { mutate, loading, error };
}

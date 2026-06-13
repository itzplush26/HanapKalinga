import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabase';
import type { Shift } from '@hanapkalinga/shared/types';

export interface AvailabilitySlot {
  date: string;
  shift: Shift;
  is_open: boolean;
}

interface UseNurseAvailabilityResult {
  data: AvailabilitySlot[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useNurseAvailability(nurseId: string, days: number = 7): UseNurseAvailabilityResult {
  const [data, setData] = useState<AvailabilitySlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAvailability = useCallback(async () => {
    if (!nurseId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const today = new Date();
    const endDate = new Date(today);
    endDate.setDate(endDate.getDate() + days);

    const { data: result, error: queryError } = await supabase
      .from('availability')
      .select('date, shift, is_open')
      .eq('nurse_id', nurseId)
      .gte('date', today.toISOString().split('T')[0])
      .lte('date', endDate.toISOString().split('T')[0])
      .order('date', { ascending: true })
      .order('shift', { ascending: true });

    if (queryError) {
      setError(queryError.message);
    } else {
      setData((result ?? []) as AvailabilitySlot[]);
    }

    setLoading(false);
  }, [nurseId, days]);

  useEffect(() => {
    fetchAvailability();
  }, [fetchAvailability]);

  return { data, loading, error, refetch: fetchAvailability };
}

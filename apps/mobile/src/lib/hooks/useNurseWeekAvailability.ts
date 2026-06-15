import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabase';
import type { Shift } from '@hanapkalinga/shared/types';

export interface WeekAvailabilitySlot {
  date: string;
  shift: Shift;
  is_open: boolean;
  id?: string;
}

interface UseNurseWeekAvailabilityResult {
  data: WeekAvailabilitySlot[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export function getWeekRange(weekStart: Date): { start: string; end: string } {
  const start = new Date(weekStart);
  start.setDate(start.getDate() - start.getDay() + 1);
  const end = new Date(start);
  end.setDate(end.getDate() + 6);
  return {
    start: start.toISOString().split('T')[0],
    end: end.toISOString().split('T')[0],
  };
}

export function buildWeekSlots(weekStart: Date, existing: WeekAvailabilitySlot[]): WeekAvailabilitySlot[] {
  const { start, end } = getWeekRange(weekStart);
  const shifts: Shift[] = ['morning', 'afternoon', 'evening'];
  const slots: WeekAvailabilitySlot[] = [];

  const existingMap = new Map(
    existing.map((s) => [`${s.date}-${s.shift}`, s])
  );

  const current = new Date(start);
  const endDate = new Date(end);

  while (current <= endDate) {
    const dateStr = current.toISOString().split('T')[0];
    for (const shift of shifts) {
      const key = `${dateStr}-${shift}`;
      const existingSlot = existingMap.get(key);
      slots.push({
        date: dateStr,
        shift,
        is_open: existingSlot?.is_open ?? false,
        id: existingSlot?.id,
      });
    }
    current.setDate(current.getDate() + 1);
  }

  return slots;
}

export function useNurseWeekAvailability(
  nurseId: string | undefined,
  weekStartDate: Date
): UseNurseWeekAvailabilityResult {
  const [data, setData] = useState<WeekAvailabilitySlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const weekStartKey = weekStartDate.toISOString();

  const fetchAvailability = useCallback(async () => {
    if (!nurseId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const weekDate = new Date(weekStartKey);
    const { start, end } = getWeekRange(weekDate);

    try {
      const { data: result, error: queryError } = await supabase
        .from('availability')
        .select('id, date, shift, is_open')
        .eq('nurse_id', nurseId)
        .gte('date', start)
        .lte('date', end)
        .order('date', { ascending: true })
        .order('shift', { ascending: true });

      if (queryError) {
        setError(queryError.message);
      } else {
        setData(buildWeekSlots(weekDate, (result ?? []) as WeekAvailabilitySlot[]));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load availability');
    } finally {
      setLoading(false);
    }
  }, [nurseId, weekStartKey]);

  useEffect(() => {
    fetchAvailability();
  }, [fetchAvailability]);

  return { data, loading, error, refetch: fetchAvailability };
}

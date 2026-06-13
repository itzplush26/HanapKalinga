import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabase';
import type { Nurse, Profile, VerificationStatus, ProviderType } from '@hanapkalinga/shared/types';

export interface NurseFilters {
  city?: string;
  specializations?: string[];
  minRate?: number;
  maxRate?: number;
  providerType?: ProviderType;
  availabilityStatus?: 'available_now' | 'available_next_week' | 'any';
  search?: string;
}

export interface NurseListItem {
  id: string;
  full_name: string | null;
  city: string | null;
  region: string | null;
  specializations: string[] | null;
  years_experience: number | null;
  hourly_rate: number | null;
  daily_rate_12hr: number | null;
  verification_status: VerificationStatus;
  provider_type: ProviderType | null;
  bio: string | null;
}

interface UseNursesResult {
  data: NurseListItem[];
  loading: boolean;
  loadingMore: boolean;
  error: string | null;
  refetch: () => void;
  loadMore: () => void;
  hasMore: boolean;
}

const PAGE_SIZE = 10;

function buildNurseQuery(filters: NurseFilters, page: number) {
  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  let query = supabase
    .from('nurses')
    .select(`
      id,
      specializations,
      years_experience,
      hourly_rate,
      daily_rate_12hr,
      verification_status,
      provider_type,
      bio,
      profile:profiles!inner(
        full_name,
        city,
        region
      )
    `)
    .order('id', { ascending: false })
    .range(from, to);

  if (filters.city) {
    query = query.ilike('profile.city', `%${filters.city}%`);
  }

  if (filters.specializations && filters.specializations.length > 0) {
    query = query.overlaps('specializations', filters.specializations);
  }

  if (filters.minRate !== undefined) {
    query = query.gte('daily_rate_12hr', filters.minRate);
  }

  if (filters.maxRate !== undefined) {
    query = query.lte('daily_rate_12hr', filters.maxRate);
  }

  if (filters.providerType) {
    query = query.eq('provider_type', filters.providerType);
  }

  if (filters.availabilityStatus === 'available_now' || filters.availabilityStatus === 'available_next_week') {
    query = query.eq('verification_status', 'verified');
  }

  if (filters.search) {
    query = query.ilike('profile.full_name', `%${filters.search}%`);
  }

  return query;
}

function mapResult(raw: unknown): NurseListItem[] {
  const rows = raw as Array<{
    id: string;
    specializations: string[] | null;
    years_experience: number | null;
    hourly_rate: number | null;
    daily_rate_12hr: number | null;
    verification_status: VerificationStatus;
    provider_type: ProviderType | null;
    bio: string | null;
    profile: { full_name: string | null; city: string | null; region: string | null } | null;
  }>;

  return rows.map((row) => ({
    id: row.id,
    full_name: row.profile?.full_name ?? null,
    city: row.profile?.city ?? null,
    region: row.profile?.region ?? null,
    specializations: row.specializations,
    years_experience: row.years_experience,
    hourly_rate: row.hourly_rate,
    daily_rate_12hr: row.daily_rate_12hr,
    verification_status: row.verification_status,
    provider_type: row.provider_type,
    bio: row.bio,
  }));
}

export function useNurses(filters: NurseFilters = {}): UseNursesResult {
  const [data, setData] = useState<NurseListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const fetchNurses = useCallback(
    async (pageNum: number, append: boolean) => {
      const query = buildNurseQuery(filters, pageNum);
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
    [filters]
  );

  const refetch = useCallback(() => {
    setLoading(true);
    setError(null);
    setPage(1);
    setData([]);
    fetchNurses(1, false).finally(() => setLoading(false));
  }, [fetchNurses]);

  const loadMore = useCallback(() => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    const nextPage = page + 1;
    fetchNurses(nextPage, true)
      .then(() => setPage(nextPage))
      .finally(() => setLoadingMore(false));
  }, [loadingMore, hasMore, page, fetchNurses]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { data, loading, loadingMore, error, refetch, loadMore, hasMore };
}

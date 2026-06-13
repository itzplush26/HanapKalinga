import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabase';
import type { Nurse, Profile, Review, VerificationStatus, ProviderType, Shift } from '@hanapkalinga/shared/types';

export interface NurseDetailData {
  profile: {
    id: string;
    full_name: string | null;
    city: string | null;
    region: string | null;
    barangay: string | null;
    address: string | null;
    phone: string | null;
  };
  nurse: {
    id: string;
    specializations: string[] | null;
    years_experience: number | null;
    bio: string | null;
    hourly_rate: number | null;
    hourly_rate_max: number | null;
    daily_rate_12hr: number | null;
    daily_rate_12hr_max: number | null;
    verification_status: VerificationStatus;
    provider_type: ProviderType | null;
    prc_license_no: string | null;
  };
  availability: Array<{
    date: string;
    shift: Shift;
    is_open: boolean;
  }>;
  reviews: Array<{
    id: string;
    rating: number;
    comment: string | null;
    created_at: string;
  }>;
}

interface UseNurseDetailResult {
  data: NurseDetailData | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useNurseDetail(id: string): UseNurseDetailResult {
  const [data, setData] = useState<NurseDetailData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDetail = useCallback(async () => {
    if (!id) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const [profileResult, nurseResult, availabilityResult, reviewsResult] = await Promise.all([
        supabase.from('profiles').select('id, full_name, city, region, barangay, address, phone').eq('id', id).single(),
        supabase.from('nurses').select('*').eq('id', id).single(),
        supabase
          .from('availability')
          .select('date, shift, is_open')
          .eq('nurse_id', id)
          .gte('date', new Date().toISOString().split('T')[0])
          .order('date', { ascending: true })
          .limit(21),
        supabase
          .from('reviews')
          .select('id, rating, comment, created_at')
          .eq('booking.nurse_id', id)
          .order('created_at', { ascending: false }),
      ]);

      if (profileResult.error) throw new Error(profileResult.error.message);
      if (nurseResult.error) throw new Error(nurseResult.error.message);

      setData({
        profile: profileResult.data as NurseDetailData['profile'],
        nurse: nurseResult.data as NurseDetailData['nurse'],
        availability: (availabilityResult.data ?? []) as NurseDetailData['availability'],
        reviews: (reviewsResult.data ?? []) as NurseDetailData['reviews'],
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load nurse details');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchDetail();
  }, [fetchDetail]);

  return { data, loading, error, refetch: fetchDetail };
}

import { renderHook, act, waitFor } from '@testing-library/react-native';
import { useNurseDetail } from '../../src/lib/hooks/useNurseDetail';
import { useNurseAvailability } from '../../src/lib/hooks/useNurseAvailability';
import { supabase } from '../../src/lib/supabase';

function createChainableMock(resolvedValue?: unknown) {
  const chain: Record<string, jest.Mock> = {};
  const handler = {
    get(_target: unknown, prop: string) {
      if (prop === 'then') {
        return undefined;
      }
      if (!chain[prop]) {
        chain[prop] = jest.fn(() => handler);
      }
      return chain[prop];
    },
    apply() {
      return resolvedValue ?? handler;
    },
  };
  return new Proxy(handler, handler);
}

jest.mock('../../src/lib/supabase', () => ({
  supabase: {
    from: jest.fn(),
  },
}));

const mockProfile = {
  id: '1',
  full_name: 'Maria Santos',
  city: 'Manila',
  region: 'NCR',
  barangay: 'Barangay 1',
  address: '123 Street',
  phone: '+639123456789',
};

const mockNurse = {
  id: '1',
  specializations: ['Elderly Care', 'Post-Op Care'],
  years_experience: 5,
  bio: 'Experienced nurse.',
  hourly_rate: 250,
  hourly_rate_max: 350,
  daily_rate_12hr: 1500,
  daily_rate_12hr_max: 2000,
  verification_status: 'verified',
  provider_type: 'nurse',
  prc_license_no: 'PRC12345',
};

const mockAvailability = [
  { date: '2025-06-13', shift: 'morning', is_open: true },
  { date: '2025-06-13', shift: 'afternoon', is_open: false },
  { date: '2025-06-14', shift: 'morning', is_open: true },
];

const mockReviews = [
  { id: 'r1', rating: 5, comment: 'Excellent care!', created_at: '2025-06-01T00:00:00Z' },
  { id: 'r2', rating: 4, comment: 'Very good.', created_at: '2025-05-15T00:00:00Z' },
];

function buildChain(result: unknown) {
  let resolved = false;
  const chain: Record<string, jest.Mock> = {};
  const proxy = new Proxy(
    {},
    {
      get(_, prop: string) {
        if (prop === 'then') {
          if (!resolved) {
            resolved = true;
            return (resolve: (v: unknown) => void) => resolve(result);
          }
          return undefined;
        }
        if (!chain[prop]) {
          chain[prop] = jest.fn(() => proxy);
        }
        return chain[prop];
      },
    }
  );
  return proxy;
}

describe('useNurseDetail', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('fetches nurse detail data successfully', async () => {
    (supabase.from as jest.Mock).mockImplementation((table: string) => {
      if (table === 'profiles') {
        return buildChain({ data: mockProfile, error: null });
      }
      if (table === 'nurses') {
        return buildChain({ data: mockNurse, error: null });
      }
      if (table === 'availability') {
        return buildChain({ data: mockAvailability, error: null });
      }
      if (table === 'reviews') {
        return buildChain({ data: mockReviews, error: null });
      }
      return buildChain({ data: null, error: null });
    });

    const { result } = await renderHook(() => useNurseDetail('1'));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toBeNull();
    expect(result.current.data).not.toBeNull();
    expect(result.current.data?.profile.full_name).toBe('Maria Santos');
    expect(result.current.data?.nurse.verification_status).toBe('verified');
    expect(result.current.data?.reviews).toHaveLength(2);
  });

  it('handles error when profile fetch fails', async () => {
    (supabase.from as jest.Mock).mockImplementation((table: string) => {
      if (table === 'profiles') {
        return buildChain({ data: null, error: { message: 'Profile not found' } });
      }
      return buildChain({ data: [], error: null });
    });

    const { result } = await renderHook(() => useNurseDetail('nonexistent'));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toBe('Profile not found');
  });
});

describe('useNurseAvailability', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('fetches availability for a nurse', async () => {
    (supabase.from as jest.Mock).mockReturnValue(
      buildChain({ data: mockAvailability, error: null })
    );

    const { result } = await renderHook(() => useNurseAvailability('1', 7));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toBeNull();
    expect(result.current.data).toHaveLength(3);
    expect(result.current.data[0].is_open).toBe(true);
  });

  it('returns empty array when no availability', async () => {
    (supabase.from as jest.Mock).mockReturnValue(
      buildChain({ data: null, error: null })
    );

    const { result } = await renderHook(() => useNurseAvailability('1', 7));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.data).toEqual([]);
    expect(result.current.error).toBeNull();
  });
});

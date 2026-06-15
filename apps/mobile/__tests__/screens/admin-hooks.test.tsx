import { renderHook, act, waitFor } from '@testing-library/react-native';
import { supabase } from '../../src/lib/supabase';
import { useAdminMetrics } from '../../src/lib/hooks/useAdminMetrics';
import { useVerificationQueue } from '../../src/lib/hooks/useVerificationQueue';
import { useVerificationDetail } from '../../src/lib/hooks/useVerificationDetail';
import { useAdminNurses } from '../../src/lib/hooks/useAdminNurses';
import { useAdminFamilies } from '../../src/lib/hooks/useAdminFamilies';
import { useAdminBookings } from '../../src/lib/hooks/useAdminBookings';

jest.mock('../../src/lib/supabase', () => ({
  supabase: {
    from: jest.fn(),
    channel: jest.fn(() => ({
      on: jest.fn().mockReturnThis(),
      subscribe: jest.fn().mockReturnValue('channel-id'),
    })),
    removeChannel: jest.fn(),
  },
}));

function buildChain(result: unknown) {
  const chain: Record<string, jest.Mock> = {};
  const proxy = new Proxy(
    {},
    {
      get(_, prop: string) {
        if (prop === 'then') {
          return (resolve: (v: unknown) => void) => resolve(result);
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

describe('useAdminMetrics', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('fetches all counts successfully', async () => {
    (supabase.from as jest.Mock).mockImplementation((table: string) => {
      const counts: Record<string, number> = {
        nurses_pending: 5,
        nurses_under_review: 3,
        bookings: 20,
        profiles: 100,
      };
      if (table === 'nurses') {
        const calls = (supabase.from as jest.Mock).mock.calls.filter(c => c[0] === 'nurses');
        const first = calls.filter(c => c[0] === 'nurses').length <= 1;
        return buildChain({ count: first ? 5 : 3, error: null });
      }
      return buildChain({ count: counts[table] ?? 0, error: null });
    });

    const { result } = await renderHook(() => useAdminMetrics());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toBeNull();
    expect(result.current.data).not.toBeNull();
    expect(result.current.data?.pendingVerifications).toBe(5);
    expect(result.current.data?.totalBookings).toBe(20);
    expect(result.current.data?.totalSignups).toBe(100);
  });

  it('handles error when all count queries fail gracefully', async () => {
    (supabase.from as jest.Mock).mockImplementation(() => {
      return buildChain({ count: null, error: { message: 'Count failed' } });
    });

    const { result } = await renderHook(() => useAdminMetrics());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.data).not.toBeNull();
    expect(result.current.data?.pendingVerifications).toBe(0);
    expect(result.current.data?.totalBookings).toBe(0);
  });
});

describe('useVerificationQueue', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('loads initial data with all filter', async () => {
    const mockNurses = [
      {
        id: '1',
        provider_type: 'nurse',
        verification_status: 'pending',
        submitted_at: '2025-06-01T00:00:00Z',
        profile: { full_name: 'Maria Santos', city: 'Manila' },
      },
    ];

    (supabase.from as jest.Mock).mockReturnValue(buildChain({ data: mockNurses, error: null }));

    const { result } = await renderHook(() => useVerificationQueue('all'));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toBeNull();
    expect(result.current.data).toHaveLength(1);
    expect(result.current.data[0].full_name).toBe('Maria Santos');
    expect(result.current.data[0].verification_status).toBe('pending');
  });

  it('filters by pending status', async () => {
    const mockNurses = [
      {
        id: '2',
        provider_type: 'caregiver',
        verification_status: 'pending',
        submitted_at: null,
        profile: { full_name: 'Juan Cruz', city: 'Cebu' },
      },
    ];

    (supabase.from as jest.Mock).mockReturnValue(buildChain({ data: mockNurses, error: null }));

    const { result } = await renderHook(() => useVerificationQueue('pending'));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.data).toHaveLength(1);
    expect(result.current.data[0].verification_status).toBe('pending');
  });
});

describe('useVerificationDetail', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('fetches nurse detail with audit logs', async () => {
    const mockNurse = {
      id: '1',
      provider_type: 'nurse',
      verification_status: 'pending',
      specializations: ['Elderly Care'],
      prc_document_url: 'https://example.com/prc.pdf',
      nbi_document_url: null,
      submitted_at: '2025-06-01T00:00:00Z',
    };

    const mockProfile = {
      id: '1',
      full_name: 'Maria Santos',
      city: 'Manila',
      phone: '+639123456789',
    };

    const mockAuditLogs = [
      {
        id: 'a1',
        action: 'submitted',
        previous_status: null,
        new_status: 'pending',
        rejection_reason: null,
        review_notes: null,
        created_at: '2025-06-01T00:00:00Z',
        admin_id: 'admin-1',
      },
    ];

    let callIndex = 0;
    (supabase.from as jest.Mock).mockImplementation((table: string) => {
      callIndex++;
      if (table === 'nurses') {
        return buildChain({ data: mockNurse, error: null });
      }
      if (table === 'profiles' && callIndex === 2) {
        return buildChain({ data: mockProfile, error: null });
      }
      if (table === 'verification_audit_logs') {
        return buildChain({ data: mockAuditLogs, error: null });
      }
      if (table === 'profiles') {
        return buildChain({ data: [{ id: 'admin-1', full_name: 'Admin User' }], error: null });
      }
      return buildChain({ data: null, error: null });
    });

    const { result } = await renderHook(() => useVerificationDetail('1'));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toBeNull();
    expect(result.current.data).not.toBeNull();
    expect(result.current.data?.profile?.full_name).toBe('Maria Santos');
    expect(result.current.data?.auditLogs).toHaveLength(1);
  });

  it('handles error when nurse not found', async () => {
    (supabase.from as jest.Mock).mockImplementation((table: string) => {
      if (table === 'nurses') {
        return buildChain({ data: null, error: { message: 'Not found' } });
      }
      return buildChain({ data: [], error: null });
    });

    const { result } = await renderHook(() => useVerificationDetail('nonexistent'));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toBe('Not found');
  });
});

describe('useAdminNurses', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('loads nurses with pagination', async () => {
    const mockNurses = Array.from({ length: 5 }, (_, i) => ({
      id: `${i + 1}`,
      verification_status: 'pending',
      provider_type: 'nurse',
      profile: { full_name: `Nurse ${i + 1}`, city: 'Manila' },
    }));

    (supabase.from as jest.Mock).mockReturnValue(buildChain({ data: mockNurses, error: null }));

    const { result } = await renderHook(() => useAdminNurses());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toBeNull();
    expect(result.current.data).toHaveLength(5);
    expect(result.current.data[0].full_name).toBe('Nurse 1');
  });

  it('returns empty array when no nurses found', async () => {
    (supabase.from as jest.Mock).mockReturnValue(buildChain({ data: [], error: null }));

    const { result } = await renderHook(() => useAdminNurses());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.data).toEqual([]);
    expect(result.current.error).toBeNull();
  });
});

describe('useAdminFamilies', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('loads families with profile join', async () => {
    const mockFamilies = [
      {
        id: '1',
        patient_name: 'Juan Dela Cruz',
        profile: { full_name: 'Maria Dela Cruz', city: 'Quezon City' },
      },
    ];

    (supabase.from as jest.Mock).mockReturnValue(buildChain({ data: mockFamilies, error: null }));

    const { result } = await renderHook(() => useAdminFamilies());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toBeNull();
    expect(result.current.data).toHaveLength(1);
    expect(result.current.data[0].full_name).toBe('Maria Dela Cruz');
    expect(result.current.data[0].patient_name).toBe('Juan Dela Cruz');
  });
});

describe('useAdminBookings', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('loads bookings with family and nurse names', async () => {
    const mockBookings = [
      {
        id: 'b1',
        requested_date: '2025-06-15',
        shift: 'morning',
        status: 'pending',
        family_id: 'f1',
        nurse_id: 'n1',
      },
    ];

    const mockProfiles = [
      { id: 'f1', full_name: 'Family Member' },
      { id: 'n1', full_name: 'Nurse Name' },
    ];

    let callCount = 0;
    (supabase.from as jest.Mock).mockImplementation(() => {
      callCount++;
      if (callCount <= 1) {
        return buildChain({ data: mockBookings, error: null });
      }
      return buildChain({ data: mockProfiles, error: null });
    });

    const { result } = await renderHook(() => useAdminBookings());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toBeNull();
    expect(result.current.data).toHaveLength(1);
    expect(result.current.data[0].family_name).toBe('Family Member');
    expect(result.current.data[0].nurse_name).toBe('Nurse Name');
    expect(result.current.data[0].status).toBe('pending');
  });
});

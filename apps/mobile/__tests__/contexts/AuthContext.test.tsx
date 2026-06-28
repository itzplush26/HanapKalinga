import { render, waitFor } from '@testing-library/react-native';
import { Text } from 'react-native';
import { AuthProvider, useAuth } from '../../src/contexts/AuthContext';

const mockGetSession = jest.fn();
const mockOnAuthStateChange = jest.fn();
const mockGetUser = jest.fn();
const mockSignOut = jest.fn();
const mockFrom = jest.fn();

jest.mock('../../src/lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: (...args: unknown[]) => mockGetSession(...args),
      onAuthStateChange: (...args: unknown[]) => mockOnAuthStateChange(...args),
      getUser: (...args: unknown[]) => mockGetUser(...args),
      signOut: (...args: unknown[]) => mockSignOut(...args),
    },
    from: (...args: unknown[]) => mockFrom(...args),
  },
}));

function TestConsumer() {
  const { user, profile, isLoading, getRedirectPath } = useAuth();
  return (
    <>
      <Text testID="loading">{isLoading ? 'loading' : 'loaded'}</Text>
      <Text testID="user">{user?.id ?? 'null'}</Text>
      <Text testID="profile">{profile?.role ?? 'null'}</Text>
      <Text testID="getRedirectPath-family">{getRedirectPath('family') as string}</Text>
      <Text testID="getRedirectPath-nurse">{getRedirectPath('nurse') as string}</Text>
      <Text testID="getRedirectPath-admin">{getRedirectPath('admin') as string}</Text>
    </>
  );
}

async function renderWithAuth() {
  return render(
    <AuthProvider>
      <TestConsumer />
    </AuthProvider>
  );
}

jest.setTimeout(15000);

describe('AuthContext', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetSession.mockResolvedValue({ data: { session: null } });
    mockOnAuthStateChange.mockReturnValue({
      data: { subscription: { unsubscribe: jest.fn() } },
    });
  });

  it('resolves with no user when no session exists', async () => {
    const { getByTestId } = await renderWithAuth();

    await waitFor(() => {
      expect(getByTestId('loading').props.children).toBe('loaded');
    });

    expect(getByTestId('user').props.children).toBe('null');
    expect(getByTestId('profile').props.children).toBe('null');
  });

  it('restores session on cold start', async () => {
    const mockUser = { id: 'user-123', email: 'test@example.com' };
    const mockProfile = { id: 'user-123', role: 'family', full_name: 'Test User' };

    mockGetSession.mockResolvedValue({
      data: { session: { user: mockUser } },
    });
    mockFrom.mockReturnValue({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({ data: mockProfile, error: null }),
    });

    const { getByTestId } = await renderWithAuth();

    await waitFor(() => {
      expect(getByTestId('user').props.children).toBe('user-123');
    });

    expect(getByTestId('profile').props.children).toBe('family');
  });

  it('handles missing session gracefully', async () => {
    mockGetSession.mockResolvedValue({ data: { session: null } });

    const { getByTestId } = await renderWithAuth();

    await waitFor(() => {
      expect(getByTestId('loading').props.children).toBe('loaded');
    });

    expect(getByTestId('user').props.children).toBe('null');
    expect(getByTestId('profile').props.children).toBe('null');
  });

  it('getRedirectPath returns correct paths', async () => {
    const { getByTestId } = await renderWithAuth();

    await waitFor(() => {
      expect(getByTestId('getRedirectPath-family').props.children).toBe('/(family)');
      expect(getByTestId('getRedirectPath-nurse').props.children).toBe('/(nurse)');
      expect(getByTestId('getRedirectPath-admin').props.children).toBe('/(admin)');
    });
  });
});

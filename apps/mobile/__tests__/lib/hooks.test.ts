import { renderHook, act, waitFor } from '@testing-library/react-native';
import { useSupabaseQuery } from '../../src/lib/hooks/useSupabaseQuery';
import { useSupabaseMutation } from '../../src/lib/hooks/useSupabaseMutation';

describe('useSupabaseQuery', () => {
  it('returns loading initially and data on success', async () => {
    const mockData = [{ id: '1', name: 'Test' }];
    let resolvePromise: (value: unknown) => void;
    const promise = new Promise((resolve) => {
      resolvePromise = resolve;
    });

    const mockQuery = jest.fn().mockReturnValue({
      then: jest.fn((cb) => promise.then(() => cb({ data: mockData, error: null }))),
    });

    const { result } = await renderHook(() =>
      useSupabaseQuery(() => mockQuery(), [])
    );

    expect(result.current.loading).toBe(true);
    expect(result.current.data).toBeNull();

    await act(async () => {
      resolvePromise!('resolve');
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
      expect(result.current.data).toEqual(mockData);
      expect(result.current.error).toBeNull();
    });
  });

  it('returns error on failure', async () => {
    let resolvePromise: (value: unknown) => void;
    const promise = new Promise((resolve) => {
      resolvePromise = resolve;
    });

    const mockQuery = jest.fn().mockReturnValue({
      then: jest.fn((cb) => promise.then(() => cb({ data: null, error: { message: 'Query failed' } }))),
    });

    const { result } = await renderHook(() =>
      useSupabaseQuery(() => mockQuery(), [])
    );

    expect(result.current.loading).toBe(true);

    await act(async () => {
      resolvePromise!('resolve');
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
      expect(result.current.data).toBeNull();
      expect(result.current.error).toBe('Query failed');
    });
  });

  it('returns null data when queryBuilder is null', async () => {
    const { result } = await renderHook(() =>
      useSupabaseQuery(null, [])
    );

    expect(result.current.loading).toBe(false);
    expect(result.current.data).toBeNull();
    expect(result.current.error).toBeNull();
  });
});

describe('useSupabaseMutation', () => {
  it('returns initial state', async () => {
    const mutationFn = jest.fn();
    const { result } = await renderHook(() => useSupabaseMutation(mutationFn));
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('performs mutation and returns data', async () => {
    const mutationFn = jest.fn().mockResolvedValue({ data: { id: '1' }, error: null });
    const { result } = await renderHook(() => useSupabaseMutation(mutationFn));

    let response: { data: unknown; error: string | null } | undefined;
    await act(async () => {
      response = await result.current.mutate({ name: 'Test' });
    });

    expect(response!.data).toEqual({ id: '1' });
    expect(response!.error).toBeNull();
    expect(result.current.loading).toBe(false);
  });

  it('returns error on failure', async () => {
    const mutationFn = jest.fn().mockResolvedValue({ data: null, error: new Error('Mutation failed') });
    const { result } = await renderHook(() => useSupabaseMutation(mutationFn));

    let response: { data: unknown; error: string | null } | undefined;
    await act(async () => {
      response = await result.current.mutate({ name: 'Test' });
    });

    expect(response!.data).toBeNull();
    expect(response!.error).toBe('Mutation failed');
    expect(result.current.loading).toBe(false);
  });
});

import { useEffect } from 'react';
import { Stack, useRouter } from 'expo-router';
import { useAuth } from '../../src/contexts/AuthContext';

export default function AdminLayout() {
  const router = useRouter();
  const { user, profile, isLoading, getRedirectPath } = useAuth();

  useEffect(() => {
    if (isLoading) return;
    if (!user) {
      router.replace('/');
      return;
    }
    if (profile && profile.role !== 'admin') {
      router.replace(getRedirectPath(profile.role));
    }
  }, [user, profile, isLoading, router, getRedirectPath]);

  if (isLoading) return null;
  if (!user) return null;
  if (profile && profile.role !== 'admin') return null;

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="verifications" />
      <Stack.Screen name="nurses" />
      <Stack.Screen name="families" />
      <Stack.Screen name="bookings" />
    </Stack>
  );
}

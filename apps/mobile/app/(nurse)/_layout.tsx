import { useEffect } from 'react';
import { Stack, useRouter } from 'expo-router';
import { useAuth } from '../../src/contexts/AuthContext';

export default function NurseLayout() {
  const router = useRouter();
  const { user, profile, isLoading, getRedirectPath } = useAuth();

  useEffect(() => {
    if (isLoading) return;
    if (!user) {
      router.replace('/');
      return;
    }
    if (profile && profile.role !== 'nurse') {
      router.replace(getRedirectPath(profile.role));
    }
  }, [user, profile, isLoading, router, getRedirectPath]);

  if (isLoading) return null;
  if (!user) return null;
  if (profile && profile.role !== 'nurse') return null;

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="profile" />
      <Stack.Screen name="bookings" />
      <Stack.Screen name="availability" />
      <Stack.Screen name="messages" />
    </Stack>
  );
}

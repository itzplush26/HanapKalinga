import { Stack } from 'expo-router';

export default function AdminLayout() {
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

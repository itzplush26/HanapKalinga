import { Stack } from 'expo-router';

export default function NurseLayout() {
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

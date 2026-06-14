import { useEffect, useState } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import {
  useFonts,
  PlusJakartaSans_400Regular,
  PlusJakartaSans_500Medium,
  PlusJakartaSans_600SemiBold,
  PlusJakartaSans_700Bold,
} from '@expo-google-fonts/plus-jakarta-sans';
import { ErrorBoundary } from '../src/components/ErrorBoundary';
import { AuthProvider } from '../src/contexts/AuthContext';
import { ThemeProvider } from '../src/contexts/ThemeContext';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    PlusJakartaSans_400Regular,
    PlusJakartaSans_500Medium,
    PlusJakartaSans_600SemiBold,
    PlusJakartaSans_700Bold,
  });
  const [appIsReady, setAppIsReady] = useState(false);

  useEffect(() => {
    if (fontsLoaded) {
      setAppIsReady(true);
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (!appIsReady) {
        setAppIsReady(true);
        SplashScreen.hideAsync();
      }
    }, 5000);
    return () => clearTimeout(timer);
  }, [appIsReady]);

  if (!appIsReady) {
    return null;
  }

  return (
<<<<<<< HEAD
    <ErrorBoundary>
      <AuthProvider>
        <ThemeProvider>
        <StatusBar style="dark" />
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="index" options={{ title: 'Home' }} />
          <Stack.Screen name="(auth)" options={{ animation: 'slide_from_right' }} />
          <Stack.Screen name="(public)" />
          <Stack.Screen name="(family)" />
          <Stack.Screen name="(nurse)" />
          <Stack.Screen name="(admin)" />
        </Stack>
        </ThemeProvider>
      </AuthProvider>
    </ErrorBoundary>
=======
    <ThemeProvider>
      <ErrorBoundary>
        <AuthProvider>
          <StatusBar style="auto" />
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="index" options={{ title: 'Home' }} />
            <Stack.Screen name="(auth)" options={{ animation: 'slide_from_right' }} />
            <Stack.Screen name="(public)" />
            <Stack.Screen name="(family)" />
            <Stack.Screen name="(nurse)" />
            <Stack.Screen name="(admin)" />
          </Stack>
        </AuthProvider>
      </ErrorBoundary>
    </ThemeProvider>
>>>>>>> f8382e9 (test(mobile): add testIDs to verification and nurse screens)
  );
}

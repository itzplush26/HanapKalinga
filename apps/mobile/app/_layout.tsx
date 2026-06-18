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
      // #region agent log
      fetch('http://127.0.0.1:7569/ingest/0813a3b5-b99a-4900-8c59-034559631d26',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'6779d2'},body:JSON.stringify({sessionId:'6779d2',location:'_layout.tsx:fontsLoaded',message:'Fonts loaded, app ready',data:{fontsLoaded:true},timestamp:Date.now(),hypothesisId:'C',runId:'pre-fix'})}).catch(()=>{});
      // #endregion
      setAppIsReady(true);
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  useEffect(() => {
    // Reduce timeout to 3 seconds for faster cold starts (especially in test environments)
    const timer = setTimeout(() => {
      if (!appIsReady) {
        // #region agent log
        fetch('http://127.0.0.1:7569/ingest/0813a3b5-b99a-4900-8c59-034559631d26',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'6779d2'},body:JSON.stringify({sessionId:'6779d2',location:'_layout.tsx:fontTimeout',message:'Font timeout fired, proceeding without custom fonts',data:{appIsReady:false},timestamp:Date.now(),hypothesisId:'C',runId:'pre-fix'})}).catch(()=>{});
        // #endregion
        setAppIsReady(true);
        SplashScreen.hideAsync();
      }
    }, 3000);
    return () => clearTimeout(timer);
  }, [appIsReady]);

  if (!appIsReady) {
    return null;
  }

  return (
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
  );
}

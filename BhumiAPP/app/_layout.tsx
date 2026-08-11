import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { Stack, useSegments, router } from "expo-router";

import { GlobalSchedulerOverlay } from '../src/components/GlobalSchedulerOverlay';
 

 import { useNotificationStore } from '../src/store/notificationStore';
import { useAuthStore } from '../src/store/authStore';

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync().catch(() => {
  /* reload/error safety */
});

export default function RootLayout() {
  const _hasHydrated = useAuthStore((state) => state._hasHydrated);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const segments = useSegments();

  useEffect(() => {
    // Hide the native splash screen so the app's custom animated splash screen/JS UI can render
    // only AFTER hydration has finished so we don't accidentally show a flash of unauthenticated state
    if (_hasHydrated) {
      SplashScreen.hideAsync().catch(() => {
        /* ignore native exceptions */
      });
    }
  }, [_hasHydrated]);

  useEffect(() => {
    if (!_hasHydrated) return;

    // Check if the user is currently inside the authentication screen flows
    const inAuthGroup = segments[0] === '(auth)' || segments[0] === '(vendor_auth)';

    if (!isAuthenticated && !inAuthGroup) {
      // Redirect to welcome screen if the user is unauthenticated and not already in an auth flow
      router.replace('/(auth)/welcome');
    } else if (isAuthenticated && inAuthGroup) {
      // Redirect to main tabs if the user is authenticated and somehow got back onto auth screens
      router.replace('/(tabs)');
    }
  }, [_hasHydrated, isAuthenticated, segments]);

  if (!_hasHydrated) {
    return null;
  }

  return (
    <>
      <Stack screenOptions={{ headerShown: false }} />
      <GlobalSchedulerOverlay />
    </>
  );
}


import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState } from 'react';
import { Stack } from "expo-router";

import { GlobalSchedulerOverlay } from '../src/components/GlobalSchedulerOverlay';
 

 import { useNotificationStore } from '../src/store/notificationStore';
import { useAuthStore } from '../src/store/authStore';

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync().catch(() => {
  /* reload/error safety */
});

export default function RootLayout() {
  const _hasHydrated = useAuthStore((state) => state._hasHydrated);

  useEffect(() => {
    // Hide the native splash screen so the app's custom animated splash screen/JS UI can render
    // only AFTER hydration has finished so we don't accidentally show a flash of unauthenticated state
    if (_hasHydrated) {
      SplashScreen.hideAsync().catch(() => {
        /* ignore native exceptions */
      });
    }
  }, [_hasHydrated]);

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


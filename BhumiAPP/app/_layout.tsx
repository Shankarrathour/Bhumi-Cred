import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { Stack, useSegments, router } from "expo-router";
import { LogBox } from 'react-native';

import { GlobalSchedulerOverlay } from '../src/components/GlobalSchedulerOverlay';
import { useAuthStore } from '../src/store/authStore';
import { Provider } from 'react-redux';
import { store } from '../src/store';

// Suppress network/server/Axios warnings and console error red-boxes in development
LogBox.ignoreLogs([
  'AxiosError',
  'Request failed',
  'Error fetching',
  'Failed to fetch',
  'NETWORK ERROR',
]);

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
    const inAuthGroup = (segments[0] as string) === '(auth)';
    // Onboarding is a special post-registration screen — not an auth screen, but
    // also not a "fully authenticated" screen.  We must NOT redirect away from it.
    const inOnboarding = segments[0] === 'onboarding';

    // A user who has completed OTP verification will have tokens even if they are
    // not yet "isAuthenticated" (e.g. a new farmer with verificationStatus=unverified).
    const hasTokens = !!useAuthStore.getState().accessToken;

    // Defer navigation by one tick to ensure Root Layout navigator is fully mounted
    const timer = setTimeout(() => {
      if (!isAuthenticated && !hasTokens && !inAuthGroup && !inOnboarding) {
        // No session at all — send to welcome/login
        router.replace('/(auth)/welcome');
      } else if (isAuthenticated && inAuthGroup) {
        // Fully authenticated user somehow landed on an auth screen — go to dashboard
        router.replace('/(tabs)');
      }
      // Any other combination is valid and should not be redirected:
      // • hasTokens but !isAuthenticated  → new farmer in onboarding flow
      // • !isAuthenticated but inAuthGroup → normal login / register / OTP screens
      // • isAuthenticated not in auth group → main app tabs
    }, 0);

    return () => clearTimeout(timer);
  }, [_hasHydrated, isAuthenticated, segments]);

  // Periodic account status pulse — automatically logs out farmer if Admin deletes or deactivates account
  useEffect(() => {
    if (!isAuthenticated) return;
    const interval = setInterval(() => {
      useAuthStore.getState().fetchProfile().catch(() => {});
    }, 10000);
    return () => clearInterval(interval);
  }, [isAuthenticated]);

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


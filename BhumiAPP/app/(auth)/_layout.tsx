import { Stack } from 'expo-router';
import AppSafeArea from '../../src/components/AppSafeArea';

export default function AuthLayout() {
  return (
    <AppSafeArea edges={['bottom']}>
    <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
      <Stack.Screen name="welcome" />
      <Stack.Screen name="login" />
      <Stack.Screen name="register" />
      <Stack.Screen name="otp" />
      <Stack.Screen name="forgot-password" />
    </Stack>
    </AppSafeArea>
  );
}

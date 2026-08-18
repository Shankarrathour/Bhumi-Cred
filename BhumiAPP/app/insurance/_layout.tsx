import { Stack } from 'expo-router';
import AppSafeArea from '../../src/components/AppSafeArea';

export default function InsuranceLayout() {
  return (
    <AppSafeArea edges={['bottom']}>
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="register-single" />
      <Stack.Screen name="register-family" />
      <Stack.Screen name="summary" />
      <Stack.Screen name="payment" />
      <Stack.Screen name="certificate" />
      <Stack.Screen name="policy-details" />
      <Stack.Screen name="claim" />
      <Stack.Screen name="claim-track" />
    </Stack>
    </AppSafeArea>
  );
}

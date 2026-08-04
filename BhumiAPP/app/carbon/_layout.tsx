import { Stack } from 'expo-router';
import AppSafeArea from '../../src/components/AppSafeArea';

export default function CarbonLayout() {
  return (
    <AppSafeArea edges={['bottom']}>
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="apply" />
      <Stack.Screen name="payment" />
      <Stack.Screen name="success" />
      <Stack.Screen name="track" />
    </Stack>
    </AppSafeArea>
  );
}

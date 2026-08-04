import { Stack } from 'expo-router';
import AppSafeArea from '../../src/components/AppSafeArea';

export default function MarketplaceLayout() {
  return (
    <AppSafeArea edges={['bottom']}>
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="cart" />
      <Stack.Screen name="address" />
      <Stack.Screen name="payment" />
      <Stack.Screen name="success" />
    </Stack>
    </AppSafeArea>
  );
}

import { Stack } from 'expo-router';
import AppSafeArea from '../../src/components/AppSafeArea';

export default function CheckoutLayout() {
  return (
    <AppSafeArea edges={['bottom']}>
    <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
      <Stack.Screen name="cart" />
      <Stack.Screen name="address" />
      <Stack.Screen name="inspection-slot-booking" />
      <Stack.Screen name="farmer-details" />
      <Stack.Screen name="payment" />
      <Stack.Screen name="success" />
    </Stack>
    </AppSafeArea>
  );
}

import { Stack } from 'expo-router';
import AppSafeArea from '../../src/components/AppSafeArea';

export default function ProfileLayout() {
  return (
    <AppSafeArea edges={['bottom']}>
    <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
      <Stack.Screen name="family" />
      <Stack.Screen name="addresses" />
      <Stack.Screen name="payment" />
      <Stack.Screen name="info" />
      <Stack.Screen name="edit" />
    </Stack>
    </AppSafeArea>
  );
}

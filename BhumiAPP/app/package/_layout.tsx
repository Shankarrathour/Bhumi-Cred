import { Stack } from 'expo-router';
import AppSafeArea from '../../src/components/AppSafeArea';

export default function PackageLayout() {
  return (
    <AppSafeArea edges={['bottom']}>
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="custom" />
      <Stack.Screen name="[id]" />
    </Stack>
    </AppSafeArea>
  );
}

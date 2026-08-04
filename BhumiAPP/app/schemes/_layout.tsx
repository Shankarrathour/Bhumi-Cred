import { Stack } from 'expo-router';
import AppSafeArea from '../../src/components/AppSafeArea';

export default function SchemesLayout() {
  return (
    <AppSafeArea edges={['bottom']}>
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
    </Stack>
    </AppSafeArea>
  );
}

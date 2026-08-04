import { Stack } from 'expo-router';
import AppSafeArea from '../../src/components/AppSafeArea';

export default function ReportLayout() {
  return (
    <AppSafeArea edges={['bottom']}>
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="[id]" />
    </Stack>
    </AppSafeArea>
  );
}

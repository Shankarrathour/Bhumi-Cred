import { Stack } from 'expo-router';
import { COLORS } from '../../src/theme/theme';
import AppSafeArea from '../../src/components/AppSafeArea';

export default function VendorAuthLayout() {
  return (
    <AppSafeArea edges={['bottom']}>
    <Stack screenOptions={{
      headerShown: false,
      contentStyle: { backgroundColor: COLORS.primaryDark }
    }}>
      <Stack.Screen name="login" options={{ title: 'Vendor Login' }} />
      <Stack.Screen name="kyc" options={{ title: 'Vendor KYC' }} />
      <Stack.Screen name="register-wizard" options={{ title: 'Vendor Registration' }} />
      <Stack.Screen name="pending" options={{ title: 'Verification Pending', gestureEnabled: false }} />
      <Stack.Screen name="rejected" options={{ title: 'Application Rejected', gestureEnabled: false }} />
      <Stack.Screen name="suspended" options={{ title: 'Account Suspended', gestureEnabled: false }} />
    </Stack>
    </AppSafeArea>
  );
}

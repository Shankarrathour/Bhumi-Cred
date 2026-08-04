import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Linking } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, TYPOGRAPHY, SHADOWS } from '../../src/theme/theme';
import { useAuthStore } from '../../src/store/authStore';

export default function VendorSuspendedScreen() {
  const router = useRouter();
  const vendor = useAuthStore((state) => state.vendor);
  const logout = useAuthStore((state) => state.logout);

  const handleLogout = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: () => { logout(); router.replace('/(auth)/login'); } },
    ]);
  };

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <View style={styles.iconCircle}>
          <MaterialCommunityIcons name="account-cancel-outline" size={44} color={COLORS.danger} />
        </View>

        <Text style={styles.title}>Account Suspended</Text>
        <Text style={styles.subtitle}>
          Your seller account{vendor?.businessName ? ` for ${vendor.businessName}` : ''} has been suspended.
          You do not currently have access to the Vendor Dashboard.
        </Text>
        <Text style={styles.helpText}>
          If you believe this is a mistake, please contact Bhumi support for assistance.
        </Text>

        <TouchableOpacity
          style={styles.primaryBtn}
          onPress={() => Linking.openURL('mailto:support@bhumicred.in')}
          activeOpacity={0.85}
        >
          <MaterialCommunityIcons name="email-outline" size={18} color="#FFFFFF" style={{ marginRight: 8 }} />
          <Text style={styles.primaryBtnText}>Contact Support</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.7}>
          <Text style={styles.logoutText}>Sign Out</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC', justifyContent: 'center', paddingHorizontal: 24 },
  card: { backgroundColor: '#FFFFFF', borderRadius: 28, padding: 28, alignItems: 'center', borderWidth: 1, borderColor: '#E2E8F0', ...SHADOWS.soft },
  iconCircle: { width: 88, height: 88, borderRadius: 44, backgroundColor: COLORS.dangerLight, justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
  title: { ...TYPOGRAPHY.h2, color: COLORS.textDark, fontWeight: '800', marginBottom: 10, textAlign: 'center' },
  subtitle: { ...TYPOGRAPHY.body, color: COLORS.textSecondary, textAlign: 'center', lineHeight: 21 },
  helpText: { ...TYPOGRAPHY.caption, color: COLORS.textSecondary, textAlign: 'center', marginTop: 12, lineHeight: 18 },
  primaryBtn: { flexDirection: 'row', backgroundColor: COLORS.primary, height: 54, borderRadius: 16, justifyContent: 'center', alignItems: 'center', marginTop: 28, width: '100%', ...SHADOWS.glow },
  primaryBtnText: { color: '#FFFFFF', fontSize: 15, fontWeight: '800' },
  logoutBtn: { marginTop: 18, padding: 8 },
  logoutText: { color: COLORS.textSecondary, fontSize: 14, fontWeight: '700' },
});

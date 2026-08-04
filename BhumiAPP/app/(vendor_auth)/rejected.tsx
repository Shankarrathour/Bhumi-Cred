import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, TYPOGRAPHY, SHADOWS } from '../../src/theme/theme';
import { useAuthStore } from '../../src/store/authStore';

export default function VendorRejectedScreen() {
  const router = useRouter();
  const vendor = useAuthStore((state) => state.vendor);
  const logout = useAuthStore((state) => state.logout);

  const handleResubmit = () => {
    router.replace('/(vendor_auth)/register-wizard');
  };

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
          <MaterialCommunityIcons name="close-circle-outline" size={44} color={COLORS.danger} />
        </View>

        <Text style={styles.title}>Application Rejected</Text>
        <Text style={styles.subtitle}>
          Unfortunately, your seller application could not be approved.
        </Text>

        <View style={styles.reasonBox}>
          <Text style={styles.reasonLabel}>REASON</Text>
          <Text style={styles.reasonText}>
            {vendor?.rejectionReason || 'No specific reason was provided. Please review your details and resubmit, or contact support.'}
          </Text>
        </View>

        <TouchableOpacity style={styles.primaryBtn} onPress={handleResubmit} activeOpacity={0.85}>
          <MaterialCommunityIcons name="pencil-outline" size={18} color="#FFFFFF" style={{ marginRight: 8 }} />
          <Text style={styles.primaryBtnText}>Edit Details & Resubmit</Text>
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
  reasonBox: { width: '100%', backgroundColor: COLORS.dangerLight, borderRadius: 14, padding: 16, marginTop: 20, borderWidth: 1, borderColor: '#FCA5A5' },
  reasonLabel: { fontSize: 10, fontWeight: '800', color: COLORS.danger, letterSpacing: 0.6, marginBottom: 6 },
  reasonText: { fontSize: 14, color: COLORS.textDark, lineHeight: 20, fontWeight: '500' },
  primaryBtn: { flexDirection: 'row', backgroundColor: COLORS.primary, height: 54, borderRadius: 16, justifyContent: 'center', alignItems: 'center', marginTop: 28, width: '100%', ...SHADOWS.glow },
  primaryBtnText: { color: '#FFFFFF', fontSize: 15, fontWeight: '800' },
  logoutBtn: { marginTop: 18, padding: 8 },
  logoutText: { color: COLORS.textSecondary, fontSize: 14, fontWeight: '700' },
});

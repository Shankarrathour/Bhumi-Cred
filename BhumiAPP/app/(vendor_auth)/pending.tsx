import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, TYPOGRAPHY, SHADOWS } from '../../src/theme/theme';
import { useAuthStore } from '../../src/store/authStore';

export default function VendorPendingScreen() {
  const router = useRouter();
  const vendor = useAuthStore((state) => state.vendor);
  const fetchVendorProfile = useAuthStore((state) => state.fetchVendorProfile);
  const logout = useAuthStore((state) => state.logout);
  const [checking, setChecking] = useState(false);

  useFocusEffect(
    useCallback(() => {
      fetchVendorProfile().catch(() => {});
    }, [])
  );

  const handleCheckStatus = async () => {
    setChecking(true);
    try {
      await fetchVendorProfile();
      const status = useAuthStore.getState().vendor?.status;
      if (status === 'Active') {
        router.replace('/(vendor_tabs)');
      } else if (status === 'Rejected') {
        router.replace('/(vendor_auth)/rejected');
      } else if (status === 'Suspended') {
        router.replace('/(vendor_auth)/suspended');
      } else {
        Alert.alert('Still Pending', 'Your application is still under review. Please check back later.');
      }
    } finally {
      setChecking(false);
    }
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
          <MaterialCommunityIcons name="clock-outline" size={44} color={COLORS.warning} />
        </View>

        <Text style={styles.title}>Verification Pending</Text>
        <Text style={styles.subtitle}>
          Thanks for registering{vendor?.businessName ? `, ${vendor.businessName}` : ''}! Our team is reviewing
          your seller application. This usually takes 24–48 hours.
        </Text>

        <View style={styles.infoRow}>
          <MaterialCommunityIcons name="phone-outline" size={16} color={COLORS.textSecondary} />
          <Text style={styles.infoText}>{vendor?.phone}</Text>
        </View>

        <TouchableOpacity style={styles.primaryBtn} onPress={handleCheckStatus} disabled={checking} activeOpacity={0.85}>
          {checking ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <>
              <MaterialCommunityIcons name="refresh" size={18} color="#FFFFFF" style={{ marginRight: 8 }} />
              <Text style={styles.primaryBtnText}>Check Status</Text>
            </>
          )}
        </TouchableOpacity>

        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.7}>
          <Text style={styles.logoutText}>Back to Login</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC', justifyContent: 'center', paddingHorizontal: 24 },
  card: { backgroundColor: '#FFFFFF', borderRadius: 28, padding: 28, alignItems: 'center', borderWidth: 1, borderColor: '#E2E8F0', ...SHADOWS.soft },
  iconCircle: { width: 88, height: 88, borderRadius: 44, backgroundColor: COLORS.warningLight, justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
  title: { ...TYPOGRAPHY.h2, color: COLORS.textDark, fontWeight: '800', marginBottom: 10, textAlign: 'center' },
  subtitle: { ...TYPOGRAPHY.body, color: COLORS.textSecondary, textAlign: 'center', lineHeight: 21 },
  infoRow: { flexDirection: 'row', alignItems: 'center', marginTop: 16, backgroundColor: '#F8FAFC', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 12, borderWidth: 1, borderColor: '#E2E8F0' },
  infoText: { marginLeft: 8, fontSize: 14, fontWeight: '600', color: COLORS.textDark },
  primaryBtn: { flexDirection: 'row', backgroundColor: COLORS.primary, height: 54, borderRadius: 16, justifyContent: 'center', alignItems: 'center', marginTop: 28, width: '100%', ...SHADOWS.glow },
  primaryBtnText: { color: '#FFFFFF', fontSize: 15, fontWeight: '800' },
  logoutBtn: { marginTop: 18, padding: 8 },
  logoutText: { color: COLORS.textSecondary, fontSize: 14, fontWeight: '700' },
});

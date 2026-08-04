import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withSpring, 
  withTiming,
  withDelay,
  withRepeat
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { COLORS, TYPOGRAPHY, SHADOWS } from '../../src/theme/theme';
import { BackButton } from '../../src/components/BackButton';

const { width } = Dimensions.get('window');

export default function CarbonSuccessScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const scale = useSharedValue(0);
  const opacity = useSharedValue(0);
  const ringScale1 = useSharedValue(0.8);
  const ringOpacity1 = useSharedValue(1);
  const ringScale2 = useSharedValue(0.8);
  const ringOpacity2 = useSharedValue(1);

  useEffect(() => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    scale.value = withSpring(1, { damping: 12, stiffness: 90 });
    opacity.value = withTiming(1, { duration: 800 });

    ringScale1.value = withRepeat(withTiming(1.8, { duration: 2000 }), -1, false);
    ringOpacity1.value = withRepeat(withTiming(0, { duration: 2000 }), -1, false);

    ringScale2.value = withDelay(1000, withRepeat(withTiming(1.8, { duration: 2000 }), -1, false));
    ringOpacity2.value = withDelay(1000, withRepeat(withTiming(0, { duration: 2000 }), -1, false));
  }, []);

  const iconStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const fadeStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: withSpring(opacity.value === 1 ? 0 : 20) }],
  }));

  const ringStyle1 = useAnimatedStyle(() => ({
    transform: [{ scale: ringScale1.value }],
    opacity: ringOpacity1.value,
  }));

  const ringStyle2 = useAnimatedStyle(() => ({
    transform: [{ scale: ringScale2.value }],
    opacity: ringOpacity2.value,
  }));

  return (
    <View style={styles.container}>
      <BackButton />
      <View style={styles.content}>
        
        <View style={styles.iconWrapper}>
          <Animated.View style={[styles.pulseRing, ringStyle1]} />
          <Animated.View style={[styles.pulseRing, ringStyle2]} />
          <Animated.View style={[styles.iconCircle, iconStyle]}>
            <MaterialCommunityIcons name="check-decagram" size={60} color="#FFFFFF" />
          </Animated.View>
        </View>

        <Animated.View style={[styles.textWrapper, fadeStyle]}>
          <Text style={styles.title}>Application Submitted!</Text>
          <Text style={styles.subtitle}>
            Your land has been registered for the Carbon Credit Generation Program. 
            A drone assessment is scheduled within the next 48 hours.
          </Text>

          <View style={styles.detailsCard}>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Application ID:</Text>
              <Text style={styles.detailValue}>#CRB-88392X</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Status:</Text>
              <View style={styles.statusBadge}>
                <Text style={styles.statusText}>Under Review</Text>
              </View>
            </View>
            <View style={[styles.detailRow, { borderBottomWidth: 0, paddingBottom: 0 }]}>
              <Text style={styles.detailLabel}>Estimated Payouts:</Text>
              <Text style={styles.detailValueGreen}>₹12,000 / year</Text>
            </View>
          </View>
        </Animated.View>

      </View>

      <Animated.View style={[styles.footer, fadeStyle, { paddingBottom: 40 + insets.bottom }]}>
        <TouchableOpacity 
          style={styles.primaryBtn} 
          onPress={() => router.replace('/(tabs)')}
        >
          <Text style={styles.primaryBtnText}>Return to Dashboard</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.secondaryBtn}
          onPress={() => router.push('/carbon/track' as any)}
        >
          <Text style={styles.secondaryBtnText}>Track Application</Text>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  content: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  iconWrapper: { alignItems: 'center', justifyContent: 'center', marginBottom: 40, width: 140, height: 140 },
  pulseRing: {
    position: 'absolute', width: 120, height: 120, borderRadius: 60,
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
  },
  iconCircle: {
    width: 100, height: 100, borderRadius: 50, backgroundColor: COLORS.success,
    alignItems: 'center', justifyContent: 'center', ...SHADOWS.glow,
  },
  textWrapper: { alignItems: 'center', width: '100%' },
  title: { ...TYPOGRAPHY.h1, color: COLORS.textDark, textAlign: 'center', marginBottom: 12 },
  subtitle: { fontSize: 14, color: COLORS.textSecondary, textAlign: 'center', lineHeight: 22, marginBottom: 32 },
  detailsCard: {
    width: '100%', backgroundColor: '#F8FAFC', borderRadius: 16, padding: 20,
    borderWidth: 1, borderColor: '#E2E8F0',
  },
  detailRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    borderBottomWidth: 1, borderBottomColor: '#E2E8F0', paddingBottom: 12, marginBottom: 12,
  },
  detailLabel: { fontSize: 13, color: COLORS.textSecondary, fontWeight: '600' },
  detailValue: { fontSize: 14, color: COLORS.textDark, fontWeight: '800' },
  detailValueGreen: { fontSize: 15, color: COLORS.success, fontWeight: '900' },
  statusBadge: { backgroundColor: '#FEF3C7', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  statusText: { fontSize: 11, color: '#D97706', fontWeight: 'bold', textTransform: 'uppercase' },
  footer: { padding: 24, paddingBottom: 40 },
  primaryBtn: {
    backgroundColor: COLORS.primary, paddingVertical: 16, borderRadius: 30,
    alignItems: 'center', marginBottom: 16, ...SHADOWS.soft,
  },
  primaryBtnText: { color: COLORS.textLight, fontSize: 16, fontWeight: 'bold' },
  secondaryBtn: { alignItems: 'center', paddingVertical: 12 },
  secondaryBtnText: { color: COLORS.primary, fontSize: 15, fontWeight: 'bold' },
});

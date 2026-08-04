import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Platform } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

import { COLORS, TYPOGRAPHY, SHADOWS } from '../../src/theme/theme';
import { BackButton } from '../../src/components/BackButton';

export default function SuccessScreen() {
  const router = useRouter();
  const { orderId, amount } = useLocalSearchParams();

  const scaleValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(scaleValue, {
      toValue: 1,
      friction: 4,
      useNativeDriver: true,
    }).start();
  }, []);

  return (
    <View style={styles.container}>
      <BackButton fallbackRoute="/(tabs)/marketplace" />
      <LinearGradient colors={['#F0FDF4', '#DCFCE7', '#FFFFFF']} style={styles.bgGrad}>
        
        <View style={styles.content}>
          <Animated.View style={[styles.iconBox, { transform: [{ scale: scaleValue }] }]}>
            <MaterialCommunityIcons name="check-decagram" size={80} color={COLORS.primary} />
          </Animated.View>
          
          <Text style={styles.title}>Purchase Successful!</Text>
          <Text style={styles.subtitle}>Your order <Text style={{ fontWeight: '800', color: COLORS.textDark }}>{orderId || 'ORD-90214'}</Text> was successfully placed.</Text>
          
          <View style={styles.detailsCard}>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Amount Paid</Text>
              <Text style={styles.detailValue}>₹{amount || '0'}</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Delivery Partner</Text>
              <Text style={styles.detailValue}>Agri Logistics</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Estimated Delivery</Text>
              <Text style={styles.detailValue}>Within 24 Hours</Text>
            </View>
          </View>

          <TouchableOpacity 
            style={styles.doneBtn} 
            onPress={() => router.replace('/(tabs)/marketplace')}
          >
            <LinearGradient colors={[COLORS.primary, COLORS.secondary]} style={styles.doneGrad}>
              <Text style={styles.doneText}>Back to Marketplace</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  bgGrad: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
  },
  content: {
    alignItems: 'center',
  },
  iconBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 60,
    padding: 10,
    ...SHADOWS.large,
    shadowColor: COLORS.primary,
    marginBottom: 24,
  },
  title: {
    ...TYPOGRAPHY.h1,
    color: COLORS.primaryDark,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 32,
    paddingHorizontal: 20,
  },
  detailsCard: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    ...SHADOWS.medium,
    marginBottom: 40,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  detailLabel: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.textDark,
  },
  divider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 16,
  },
  doneBtn: {
    width: '100%',
    borderRadius: 30,
    overflow: 'hidden',
    ...SHADOWS.soft,
  },
  doneGrad: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  doneText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
  },
});

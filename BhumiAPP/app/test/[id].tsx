import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Platform } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useDispatch } from 'react-redux';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { COLORS, TYPOGRAPHY, SHADOWS } from '../../src/theme/theme';
import { mockTests } from '../../src/mock/mockData';
import { addToCart } from '../../src/store/slices/cartSlice';
import { PremiumBottomSheet } from '../../src/components/PremiumBottomSheet';

export default function TestDetailsScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const dispatch = useDispatch();
  
  const [isPrepSheetOpen, setPrepSheetOpen] = useState(false);
  const [isFaqSheetOpen, setFaqSheetOpen] = useState(false);

  const test = mockTests.find(t => t.id === id) || mockTests[0];

  const discountPercent = Math.round(((test.price - test.discountedPrice) / test.price) * 100);

  const triggerHaptic = (style: Haptics.ImpactFeedbackStyle) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(style);
    }
  };

  const handleBookNow = () => {
    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    dispatch(addToCart({
      testId: test.id,
      name: test.name,
      price: test.price,
      discountedPrice: test.discountedPrice,
      homeCollection: test.homeCollection,
      quantity: 1
    }));
    router.push('/checkout/cart');
  };

  return (
    <View style={styles.container}>
      {/* Top Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => {
            triggerHaptic(Haptics.ImpactFeedbackStyle.Light);
            router.back();
          }}
          accessibilityRole="button"
        >
          <MaterialCommunityIcons name="arrow-left" size={24} color={COLORS.textLight} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Audit Overview</Text>
        <TouchableOpacity 
          style={styles.cartButton} 
          onPress={() => {
            triggerHaptic(Haptics.ImpactFeedbackStyle.Light);
            router.push('/checkout/cart');
          }}
          accessibilityRole="button"
        >
          <MaterialCommunityIcons name="cart-outline" size={24} color={COLORS.textLight} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Banner Card */}
        <View style={styles.bannerCard}>
          <View style={styles.badgeRow}>
            {test.homeCollection && (
              <View style={styles.badge}>
                <MaterialCommunityIcons name="drone" size={14} color={COLORS.success} />
                <Text style={styles.badgeText}> Drone Field Visit</Text>
              </View>
            )}
            <View style={styles.ratingBadge}>
              <MaterialCommunityIcons name="star" size={14} color="#D97706" />
              <Text style={styles.ratingText}> {test.rating} ({test.reviews} farmers)</Text>
            </View>
          </View>

          <Text style={styles.testName}>{test.name}</Text>
          <Text style={styles.categoryName}>{test.category}</Text>
          <Text style={styles.description}>{test.description}</Text>

          <View style={styles.statsGrid}>
            <View style={styles.statBox}>
              <View style={styles.statIconBox}>
                <MaterialCommunityIcons name="clipboard-list-outline" size={20} color={COLORS.primary} />
              </View>
              <View>
                <Text style={styles.statBoxValue}>{test.parameters} Parameters</Text>
                <Text style={styles.statBoxLabel}>Audited</Text>
              </View>
            </View>
            <View style={styles.statBox}>
              <View style={styles.statIconBox}>
                <MaterialCommunityIcons name="clock-fast" size={20} color={COLORS.primary} />
              </View>
              <View>
                <Text style={styles.statBoxValue}>{test.reportTime}</Text>
                <Text style={styles.statBoxLabel}>Est Scan Time</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Action List Items */}
        <View style={styles.actionList}>
          <TouchableOpacity 
            style={styles.actionListItem} 
            onPress={() => {
              triggerHaptic(Haptics.ImpactFeedbackStyle.Light);
              setPrepSheetOpen(true);
            }}
            accessibilityRole="button"
          >
            <View style={styles.actionListLeft}>
              <MaterialCommunityIcons name="alert-circle-outline" size={24} color={COLORS.primary} />
              <Text style={styles.actionListTitle}>Prerequisites</Text>
            </View>
            <View style={styles.actionListRight}>
              <Text style={styles.actionListValue}>{test.fastingRequired ? 'Baseline Scan Req' : 'Standard Scan'}</Text>
              <MaterialCommunityIcons name="chevron-right" size={24} color={COLORS.textSecondary} />
            </View>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.actionListItem} 
            onPress={() => {
              triggerHaptic(Haptics.ImpactFeedbackStyle.Light);
              setFaqSheetOpen(true);
            }}
            accessibilityRole="button"
          >
            <View style={styles.actionListLeft}>
              <MaterialCommunityIcons name="frequently-asked-questions" size={24} color={COLORS.primary} />
              <Text style={styles.actionListTitle}>Frequently Asked Questions</Text>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={24} color={COLORS.textSecondary} />
          </TouchableOpacity>

          <View style={styles.actionListItem}>
            <View style={styles.actionListLeft}>
              <MaterialCommunityIcons name="shield-check-outline" size={24} color={COLORS.primary} />
              <Text style={styles.actionListTitle}>ICAR Accredited Soil Labs</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Sticky Bottom Footer */}
      <View style={[styles.bottomFooter, { paddingBottom: 20 + insets.bottom }]}>
        <View style={styles.footerPriceContainer}>
          <Text style={styles.footerPrice}>₹{test.discountedPrice}</Text>
          <View style={styles.footerOldPriceRow}>
            <Text style={styles.footerOldPrice}>₹{test.price}</Text>
            <View style={styles.discountBadgeSmall}>
              <Text style={styles.discountTextSmall}>{discountPercent}% OFF</Text>
            </View>
          </View>
        </View>
        <TouchableOpacity 
          style={styles.bookButton}
          onPress={handleBookNow}
          accessibilityRole="button"
        >
          <Text style={styles.bookButtonText}>Schedule Audit</Text>
        </TouchableOpacity>
      </View>

      {/* Preparation Bottom Sheet */}
      <PremiumBottomSheet visible={isPrepSheetOpen} onClose={() => setPrepSheetOpen(false)} height={400}>
        <Text style={styles.sheetTitle}>Audit Prerequisites</Text>
        <View style={styles.prepContainer}>
          <MaterialCommunityIcons name={test.fastingRequired ? "crosshairs-gps" : "satellite-uplink"} size={48} color={COLORS.primary} />
          <Text style={styles.prepStatusText}>
            {test.fastingRequired ? 'Field Baseline Setup Required' : 'Automated Remote Satellite Scan'}
          </Text>
          <Text style={styles.prepDetailsText}>
            {test.fastingRequired 
              ? 'Our certified baseline officer will map plot boundaries on-site. Please ensure Aadhaar and Khasra copies are uploaded before inspector arrival.' 
              : 'This is a digital sentinel multispectral scan. No on-field physical visit is required. Results are auto-synced to your dashboard.'}
          </Text>
        </View>
        <TouchableOpacity 
          style={styles.gotItButton} 
          onPress={() => {
            triggerHaptic(Haptics.ImpactFeedbackStyle.Light);
            setPrepSheetOpen(false);
          }}
          accessibilityRole="button"
        >
          <Text style={styles.gotItText}>Got it</Text>
        </TouchableOpacity>
      </PremiumBottomSheet>

      {/* FAQ Bottom Sheet */}
      <PremiumBottomSheet visible={isFaqSheetOpen} onClose={() => setFaqSheetOpen(false)} height={500}>
        <Text style={styles.sheetTitle}>Frequently Asked Questions</Text>
        <ScrollView showsVerticalScrollIndicator={false}>
          <View style={styles.faqItem}>
            <Text style={styles.faqQuestion}>Is the drone field visit safe?</Text>
            <Text style={styles.faqAnswer}>Yes, our automated drones are fully DGCA-licensed and follow pre-programmed boundary tracks, avoiding crops or structures entirely.</Text>
          </View>
          <View style={styles.faqItem}>
            <Text style={styles.faqQuestion}>When will I receive my soil health card?</Text>
            <Text style={styles.faqAnswer}>Verified digital soil health cards and carbon sequestration metrics are updated to your BhumiCred profile within {test.reportTime}.</Text>
          </View>
          <View style={styles.faqItem}>
            <Text style={styles.faqQuestion}>Are these certificates valid for government carbon subsidies?</Text>
            <Text style={styles.faqAnswer}>Yes, BhumiCred carbon audits are fully certified by national soil agencies and ICAR-accredited laboratory partners, making them eligible for global green offset programs.</Text>
          </View>
        </ScrollView>
      </PremiumBottomSheet>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F4FDF9',
  },
  header: {
    paddingTop: Platform.OS === 'ios' ? 60 : 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    ...TYPOGRAPHY.h2,
    color: COLORS.textLight,
  },
  cartButton: {
    padding: 4,
  },
  scrollContent: {
    paddingBottom: 120,
  },
  bannerCard: {
    backgroundColor: COLORS.surface,
    padding: 24,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    marginBottom: 16,
    ...SHADOWS.soft,
  },
  badgeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E6F4EA',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  badgeText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.primary,
    fontWeight: 'bold',
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.warningLight,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  ratingText: {
    ...TYPOGRAPHY.caption,
    color: '#D97706',
    fontWeight: 'bold',
  },
  testName: {
    ...TYPOGRAPHY.hero,
    color: COLORS.textDark,
    marginBottom: 8,
  },
  categoryName: {
    ...TYPOGRAPHY.body,
    color: COLORS.primary,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    marginBottom: 12,
  },
  description: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
    marginBottom: 24,
    lineHeight: 22,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    padding: 12,
    borderRadius: 16,
    width: '48%',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  statIconBox: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E6F4EA',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  statBoxValue: {
    ...TYPOGRAPHY.subtitle,
    color: COLORS.textDark,
    fontWeight: 'bold',
  },
  statBoxLabel: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
  },
  actionList: {
    backgroundColor: COLORS.surface,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: COLORS.border,
  },
  actionListItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.background,
  },
  actionListLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionListTitle: {
    ...TYPOGRAPHY.body,
    color: COLORS.textDark,
    fontWeight: '600',
    marginLeft: 16,
  },
  actionListRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionListValue: {
    ...TYPOGRAPHY.caption,
    color: COLORS.primary,
    fontWeight: 'bold',
    marginRight: 8,
  },
  bottomFooter: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: COLORS.surface,
    flexDirection: 'row',
    padding: 20,
    paddingBottom: Platform.OS === 'ios' ? 34 : 24, // For safe area
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'space-between',
    ...SHADOWS.soft,
  },
  footerPriceContainer: {
    flex: 1,
  },
  footerPrice: {
    ...TYPOGRAPHY.h1,
    color: COLORS.textDark,
  },
  footerOldPriceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  footerOldPrice: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
    textDecorationLine: 'line-through',
    marginRight: 8,
  },
  discountBadgeSmall: {
    backgroundColor: COLORS.discountGreen,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  discountTextSmall: {
    fontSize: 10,
    color: '#fff',
    fontWeight: 'bold',
  },
  bookButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 40,
    paddingVertical: 16,
    borderRadius: 30,
  },
  bookButtonText: {
    ...TYPOGRAPHY.subtitle,
    color: COLORS.textLight,
    fontWeight: 'bold',
  },
  sheetTitle: {
    ...TYPOGRAPHY.h2,
    color: COLORS.textDark,
    marginBottom: 24,
  },
  prepContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  prepStatusText: {
    ...TYPOGRAPHY.h3,
    color: COLORS.textDark,
    marginTop: 16,
    marginBottom: 12,
  },
  prepDetailsText: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
  },
  gotItButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 16,
    borderRadius: 30,
    alignItems: 'center',
    marginTop: 'auto',
    marginBottom: 40,
  },
  gotItText: {
    ...TYPOGRAPHY.subtitle,
    color: COLORS.textLight,
    fontWeight: 'bold',
  },
  faqItem: {
    marginBottom: 24,
  },
  faqQuestion: {
    ...TYPOGRAPHY.subtitle,
    color: COLORS.textDark,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  faqAnswer: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
    lineHeight: 22,
  }
});

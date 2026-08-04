import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Dimensions } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useDispatch, useSelector } from 'react-redux';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { RootState } from '../../src/store';
import { COLORS, TYPOGRAPHY, SHADOWS } from '../../src/theme/theme';
import { mockPackages } from '../../src/mock/mockData';
import { addToCart } from '../../src/store/slices/cartSlice';
import { PremiumBottomSheet } from '../../src/components/PremiumBottomSheet';

const { width } = Dimensions.get('window');

export default function PackageDetailsScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const dispatch = useDispatch();
  
  const cartItems = useSelector((state: RootState) => state.cart.items);
  const cartCount = cartItems.length;

  const [isPrepSheetOpen, setPrepSheetOpen] = useState(false);
  const [isFaqSheetOpen, setFaqSheetOpen] = useState(false);

  // Find requested package or default to the first one safely
  const pkgData = mockPackages.find(p => p.id === id) || mockPackages[0];

  const handleAddToCart = () => {
    dispatch(addToCart({
      testId: pkgData.id,
      name: pkgData.name,
      price: pkgData.oldPrice,
      discountedPrice: pkgData.price,
      homeCollection: pkgData.homeCollection,
      quantity: 1,
    }));
    Alert.alert("Added to Cart", `${pkgData.name} has been successfully added to your booking basket!`);
  };

  const handleBookNow = () => {
    dispatch(addToCart({
      testId: pkgData.id,
      name: pkgData.name,
      price: pkgData.oldPrice,
      discountedPrice: pkgData.price,
      homeCollection: pkgData.homeCollection,
      quantity: 1,
    }));
    router.push('/checkout/cart');
  };

  return (
    <View style={styles.container}>
      {/* Dynamic Header with Blur Elevation */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={COLORS.textLight} />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>Audit Package Details</Text>
        <TouchableOpacity style={styles.cartBtn} onPress={() => router.push('/checkout/cart')}>
          <MaterialCommunityIcons name="cart-outline" size={24} color={COLORS.textLight} />
          {cartCount > 0 && (
            <View style={styles.cartBadge}>
              <Text style={styles.cartBadgeText}>{cartCount}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        
        {/* Glassmorphic Core Banner */}
        <View style={styles.bannerCard}>
          <View style={styles.badgeRow}>
            {pkgData.badge && (
              <View style={styles.badgeHot}>
                <Text style={styles.badgeHotText}>{pkgData.badge}</Text>
              </View>
            )}
            <View style={styles.ratingBadge}>
              <MaterialCommunityIcons name="star" size={14} color="#D97706" />
              <Text style={styles.ratingText}> 4.9 (1.4k reviews)</Text>
            </View>
          </View>

          <Text style={styles.pkgName}>{pkgData.name}</Text>
          <Text style={styles.category}>{pkgData.category} Dashboard</Text>
          <Text style={styles.subtitle}>{pkgData.subtitle}</Text>
          <Text style={styles.description}>{pkgData.description}</Text>

          {/* Parameter Statistics */}
          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <View style={styles.statIconBox}>
                <MaterialCommunityIcons name="sprout-outline" size={22} color={COLORS.primary} />
              </View>
              <View>
                <Text style={styles.statValue}>{pkgData.parameters} Params</Text>
                <Text style={styles.statLabel}>Audit Inclusions</Text>
              </View>
            </View>

            <View style={styles.statItem}>
              <View style={styles.statIconBox}>
                <MaterialCommunityIcons name="clipboard-text-play-outline" size={22} color={COLORS.primary} />
              </View>
              <View>
                <Text style={styles.statValue}>{pkgData.reportTime}</Text>
                <Text style={styles.statLabel}>Verification Period</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Quick View Accordion Matrix */}
        <View style={styles.accordionList}>
          <TouchableOpacity style={styles.accordionRow} onPress={() => setPrepSheetOpen(true)}>
            <View style={styles.iconGroup}>
              <MaterialCommunityIcons name="shovel" size={20} color={COLORS.primary} />
              <Text style={styles.accordionText}>Plot Prerequisites & Setup</Text>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={20} color="#94A3B8" />
          </TouchableOpacity>
 
          <TouchableOpacity style={styles.accordionRow} onPress={() => setFaqSheetOpen(true)}>
            <View style={styles.iconGroup}>
              <MaterialCommunityIcons name="information-outline" size={20} color={COLORS.primary} />
              <Text style={styles.accordionText}>Frequently Asked Questions</Text>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={20} color="#94A3B8" />
          </TouchableOpacity>
        </View>

        {/* Real Inclusions List */}
        <View style={styles.sectionBlock}>
          <Text style={styles.blockTitle}>Tests Included ({pkgData.testsIncluded.length})</Text>
          <View style={styles.inclusionsCard}>
            {pkgData.testsIncluded.map((item, index) => (
              <View key={index} style={styles.inclusionItem}>
                <View style={styles.bullet}>
                  <MaterialCommunityIcons name="check-circle" size={16} color={COLORS.primary} />
                </View>
                <Text style={styles.inclusionName}>{item}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Key Parameter Breakdowns */}
        <View style={styles.sectionBlock}>
          <Text style={styles.blockTitle}>Key Sequestration Indicators</Text>
          <View style={styles.chipContainer}>
            {pkgData.keyParameters.map((keyP, index) => (
              <View key={index} style={styles.chip}>
                <Text style={styles.chipText}>{keyP}</Text>
              </View>
            ))}
          </View>
        </View>
 
        {/* Simulated Recommendations */}
        <View style={styles.certBlock}>
          <View style={styles.certHeader}>
            <MaterialCommunityIcons name="shield-check" size={22} color={COLORS.primary} />
            <Text style={styles.certTitle}>BhumiCred Certification Standard</Text>
          </View>
          <Text style={styles.certSub}>
            This agricultural audit bundle complies fully with national soil agency and carbon registry requirements to verify carbon sequestration baselines.
          </Text>
        </View>

        <View style={{ height: 120 }} />
      </ScrollView>

      {/* Absolute Floating Footer CTAs */}
      <View style={[styles.footerActions, { paddingBottom: 30 + insets.bottom }]}>
        <View style={styles.priceBreakdown}>
          <Text style={styles.totalLabel}>Final Package Deal</Text>
          <View style={styles.priceRow}>
            <Text style={styles.finalPrice}>₹{pkgData.price}</Text>
            <Text style={styles.oldPrice}>₹{pkgData.oldPrice}</Text>
          </View>
        </View>

        <View style={styles.ctaBtnRow}>
          <TouchableOpacity style={styles.addToCartBtn} onPress={handleAddToCart}>
            <Text style={styles.addCartText}>Add To Cart</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.bookNowWrapper} activeOpacity={0.9} onPress={handleBookNow}>
            <LinearGradient 
              colors={[COLORS.primary, '#14B8A6']} 
              start={{ x: 0, y: 0 }} 
              end={{ x: 1, y: 1 }}
              style={styles.bookNowGradientBtn}
            >
              <Text style={styles.bookNowText}>Book Now</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>

      {/* Preparation BottomSheet Modal */}
      <PremiumBottomSheet
        visible={isPrepSheetOpen}
        onClose={() => setPrepSheetOpen(false)}
        title="Plot Setup Prerequisites"
      >
        <View style={styles.modalBody}>
          <View style={styles.prepAlert}>
            <MaterialCommunityIcons name="clock-outline" size={24} color="#B45309" />
            <View style={{ marginLeft: 12, flex: 1 }}>
              <Text style={styles.prepAlertTitle}>Baseline Scan Required</Text>
              <Text style={styles.prepAlertSub}>
                {pkgData.fastingRequired ? "Requires active on-field boundary mapping baseline." : "Standard remote satellite scan."}
              </Text>
            </View>
          </View>
          
          <Text style={styles.modalSubTitle}>Instructions:</Text>
          <Text style={styles.modalPara}>
            {pkgData.preparation || "Ensure clear access to plot boundaries. Keep Aadhaar and Land Khasra documents ready."}
          </Text>
          
          <TouchableOpacity style={styles.modalCloseBtn} onPress={() => setPrepSheetOpen(false)}>
            <Text style={styles.modalCloseText}>Got It</Text>
          </TouchableOpacity>
        </View>
      </PremiumBottomSheet>

      {/* FAQs BottomSheet Modal */}
      <PremiumBottomSheet
        visible={isFaqSheetOpen}
        onClose={() => setFaqSheetOpen(false)}
        title="BhumiCred Audit FAQs"
      >
        <ScrollView style={{ maxHeight: 400 }} showsVerticalScrollIndicator={false}>
          <View style={styles.modalBody}>
            {[
              { q: "When will I get my Soil Carbon Audit?", a: "Verified digital soil health cards and canopy metrics are updated directly to your dashboard in 24 to 48 hours." },
              { q: "Are these certificates valid for carbon markets?", a: "Yes, BhumiCred carbon audits are fully certified by national soil agencies and ICAR-accredited partner laboratories." },
              { q: "Who will conduct the on-field inspection?", a: "All baseline audits are performed by certified BhumiCred partner inspectors using automated GPS mapping and professional core-sampling tools." }
            ].map((faq, idx) => (
              <View key={idx} style={styles.faqContainer}>
                <Text style={styles.faqQ}>Q: {faq.q}</Text>
                <Text style={styles.faqA}>{faq.a}</Text>
              </View>
            ))}
            <TouchableOpacity style={[styles.modalCloseBtn, { marginTop: 16 }]} onPress={() => setFaqSheetOpen(false)}>
              <Text style={styles.modalCloseText}>Close FAQ</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </PremiumBottomSheet>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    backgroundColor: COLORS.primary,
    paddingTop: 48,
    paddingBottom: 20,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    zIndex: 100,
  },
  backBtn: {
    padding: 6,
  },
  headerTitle: {
    ...TYPOGRAPHY.h2,
    color: COLORS.textLight,
    fontWeight: 'bold',
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 12,
  },
  cartBtn: {
    padding: 6,
    position: 'relative',
  },
  cartBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: COLORS.warning,
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cartBadgeText: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#FFF',
  },
  scrollContainer: {
    padding: 20,
  },
  bannerCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    padding: 20,
    ...SHADOWS.soft,
    shadowColor: COLORS.primary,
    shadowOpacity: 0.06,
    marginBottom: 20,
  },
  badgeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  badgeHot: {
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  badgeHotText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#D97706',
    letterSpacing: 0.5,
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  pkgName: {
    ...TYPOGRAPHY.h1,
    color: COLORS.textDark,
    fontSize: 22,
    fontWeight: '800',
  },
  category: {
    fontSize: 12,
    color: COLORS.primary,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginTop: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#64748B',
    marginTop: 6,
    fontWeight: '500',
  },
  description: {
    fontSize: 13,
    color: '#475569',
    marginTop: 12,
    lineHeight: 19,
  },
  statsGrid: {
    flexDirection: 'row',
    marginTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 16,
  },
  statItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  statIconBox: {
    backgroundColor: 'rgba(0, 109, 111, 0.08)',
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  statValue: {
    fontSize: 13,
    fontWeight: 'bold',
    color: COLORS.textDark,
  },
  statLabel: {
    fontSize: 10,
    color: '#64748B',
    marginTop: 1,
  },
  accordionList: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  accordionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  iconGroup: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  accordionText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textDark,
    marginLeft: 12,
  },
  sectionBlock: {
    marginBottom: 24,
  },
  blockTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: COLORS.textDark,
    marginBottom: 12,
    letterSpacing: 0.3,
  },
  inclusionsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 16,
  },
  inclusionItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  bullet: {
    marginRight: 10,
    marginTop: 1,
  },
  inclusionName: {
    fontSize: 13,
    color: '#334155',
    fontWeight: '500',
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  chip: {
    backgroundColor: 'rgba(0, 109, 111, 0.07)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
    marginRight: 8,
    marginBottom: 8,
  },
  chipText: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.primary,
  },
  certBlock: {
    backgroundColor: '#ECFDF5',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  certHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  certTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#065F46',
    marginLeft: 8,
  },
  certSub: {
    fontSize: 12,
    color: '#065F46',
    lineHeight: 18,
  },
  footerActions: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    paddingBottom: 30,
    paddingTop: 16,
    paddingHorizontal: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    ...SHADOWS.soft,
  },
  priceBreakdown: {
    flex: 1,
  },
  totalLabel: {
    fontSize: 10,
    color: '#64748B',
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  finalPrice: {
    fontSize: 22,
    fontWeight: 'bold',
    color: COLORS.textDark,
  },
  oldPrice: {
    fontSize: 13,
    color: '#94A3B8',
    textDecorationLine: 'line-through',
    marginLeft: 8,
    marginTop: 3,
  },
  ctaBtnRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  addToCartBtn: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginRight: 8,
  },
  addCartText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  bookNowWrapper: {
    borderRadius: 30,
    overflow: 'hidden',
  },
  bookNowGradientBtn: {
    paddingHorizontal: 28,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bookNowText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  modalBody: {
    padding: 20,
  },
  prepAlert: {
    backgroundColor: '#FEF3C7',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#FCD34D',
  },
  prepAlertTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#92400E',
  },
  prepAlertSub: {
    fontSize: 12,
    color: '#B45309',
    marginTop: 1,
  },
  modalSubTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    color: COLORS.textDark,
    marginBottom: 8,
  },
  modalPara: {
    fontSize: 13,
    color: '#475569',
    lineHeight: 20,
    marginBottom: 24,
  },
  modalCloseBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: 24,
    paddingVertical: 14,
    alignItems: 'center',
  },
  modalCloseText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  faqContainer: {
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    paddingBottom: 12,
  },
  faqQ: {
    fontSize: 13,
    fontWeight: 'bold',
    color: COLORS.textDark,
    marginBottom: 4,
  },
  faqA: {
    fontSize: 12,
    color: '#64748B',
    lineHeight: 18,
  },
});

import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { useSelector, useDispatch } from 'react-redux';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { RootState } from '../../src/store';
import { removeFromCart } from '../../src/store/slices/cartSlice';
import { COLORS, TYPOGRAPHY, SHADOWS } from '../../src/theme/theme';
import { PremiumBottomSheet } from '../../src/components/PremiumBottomSheet';
import { PremiumScratchModal } from '../../src/components/PremiumScratchModal';
import { LinearGradient } from 'expo-linear-gradient';

const PARTNER_KIOSKS = [
  { id: 'c1', name: 'BhumiCred Village Kiosk - Bhopal Central', distance: '1.2 km', address: 'Rural Community Hall, Bhopal block, MP', hours: '08:00 AM - 06:00 PM' },
  { id: 'c2', name: 'BhumiCred Soil Lab - Sihore Regional', distance: '3.4 km', address: 'Opposite Krishi Mandi, Sihore main road, MP', hours: '08:00 AM - 08:00 PM' },
];

export default function CartScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const dispatch = useDispatch();
  
  const cart = useSelector((state: RootState) => state.cart);

  const [visitMode, setVisitMode] = useState<'home' | 'center'>('home');
  const [activeCenterId, setActiveCenterId] = useState<string>('c1');
  
  const [isCouponSheetOpen, setCouponSheetOpen] = useState(false);
  const [isScratchOpen, setScratchOpen] = useState(false);
  const [appliedCoupon, setAppliedCoupon] = useState<{ code: string, val: number } | null>(null);

  const triggerHaptic = (style: Haptics.ImpactFeedbackStyle) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(style);
    }
  };

  // Dynamic offsets
  const hasHomeCollection = cart.items.some(i => i.homeCollection);
  const appliedCollectionCharge = (visitMode === 'home' && hasHomeCollection) ? cart.homeCollectionCharge : 0;
  const collectionChargeDifference = (visitMode === 'center' && hasHomeCollection) ? cart.homeCollectionCharge : 0;
  
  // Final Calculation factoring Collection Charge + Reward Discount!
  const couponDiscount = appliedCoupon ? appliedCoupon.val : 0;
  const baseFinal = cart.finalAmount - collectionChargeDifference;
  const calculatedFinalAmount = Math.max(0, baseFinal - couponDiscount);

  if (cart.items.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <View style={styles.header}>
          <TouchableOpacity 
            onPress={() => {
              triggerHaptic(Haptics.ImpactFeedbackStyle.Light);
              router.back();
            }} 
            style={styles.backBtn}
            accessibilityRole="button"
            accessibilityLabel="Back"
          >
            <MaterialCommunityIcons name="arrow-left" size={24} color={COLORS.textLight} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Your Cart</Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={styles.emptyContent}>
          <MaterialCommunityIcons name="cart-off" size={80} color={COLORS.border} />
          <Text style={styles.emptyTitle}>Cart is Empty</Text>
          <Text style={styles.emptyDesc}>Add some audits, saplings, or tools to your cart to proceed with booking.</Text>
          <TouchableOpacity 
            style={styles.addTestBtn} 
            onPress={() => {
              triggerHaptic(Haptics.ImpactFeedbackStyle.Light);
              router.push('/search');
            }}
            accessibilityRole="button"
          >
            <Text style={styles.addTestBtnText}>Browse Sustainability Shop</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          onPress={() => {
            triggerHaptic(Haptics.ImpactFeedbackStyle.Light);
            router.back();
          }} 
          style={styles.backBtn}
          accessibilityRole="button"
        >
          <MaterialCommunityIcons name="arrow-left" size={24} color={COLORS.textLight} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Your Cart ({cart.items.length})</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* Visit Mode Dual Toggle */}
        <View style={styles.visitSelector}>
          <TouchableOpacity 
            style={[styles.visitBtn, visitMode === 'home' && styles.visitBtnActive]}
            onPress={() => {
              triggerHaptic(Haptics.ImpactFeedbackStyle.Light);
              setVisitMode('home');
            }}
            accessibilityRole="radio"
            accessibilityState={{ checked: visitMode === 'home' }}
          >
            <MaterialCommunityIcons name="drone" size={20} color={visitMode === 'home' ? '#FFF' : COLORS.primary} />
            <Text style={[styles.visitBtnText, visitMode === 'home' && styles.visitBtnTextActive]}>Field Visit (Drone)</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.visitBtn, visitMode === 'center' && styles.visitBtnActive]}
            onPress={() => {
              triggerHaptic(Haptics.ImpactFeedbackStyle.Light);
              setVisitMode('center');
            }}
            accessibilityRole="radio"
            accessibilityState={{ checked: visitMode === 'center' }}
          >
            <MaterialCommunityIcons name="office-building" size={18} color={visitMode === 'center' ? '#FFF' : COLORS.primary} />
            <Text style={[styles.visitBtnText, visitMode === 'center' && styles.visitBtnTextActive]}>Kiosk Walk-in</Text>
          </TouchableOpacity>
        </View>

        {visitMode === 'center' && (
          <View style={styles.centersSection}>
            <Text style={styles.sectionSubhead}>Select BhumiCred Partner Kiosk / Soil Lab</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.centersScroll}>
              {PARTNER_KIOSKS.map(center => {
                const isSelected = activeCenterId === center.id;
                return (
                  <TouchableOpacity 
                    key={center.id} 
                    style={[styles.centerCard, isSelected && styles.centerCardActive]}
                    onPress={() => {
                      triggerHaptic(Haptics.ImpactFeedbackStyle.Light);
                      setActiveCenterId(center.id);
                    }}
                    accessibilityRole="radio"
                    accessibilityState={{ checked: isSelected }}
                  >
                    <View style={styles.centerCardHeader}>
                      <Text style={[styles.centerName, isSelected && styles.centerTextActive]}>{center.name}</Text>
                      {isSelected && <MaterialCommunityIcons name="check-circle" size={18} color="#FFF" />}
                    </View>
                    <Text style={[styles.centerDist, isSelected && styles.centerTextActive]}>{center.distance} away · Open</Text>
                    <Text style={[styles.centerAddr, isSelected && styles.centerTextActive]} numberOfLines={1}>{center.address}</Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        )}

        <View style={styles.cartItemsHeader}>
          <Text style={styles.sectionSubhead}>Items & Audits Added ({cart.items.length})</Text>
        </View>

        {cart.items.map(item => (
          <View key={item.testId} style={styles.cartCard}>
            <View style={styles.cartCardLeft}>
              <Text style={styles.itemName}>{item.name}</Text>
              <Text style={styles.itemDesc}>
                {item.homeCollection ? 'Drone & Soil Field Visit Available' : 'Kiosk Visit Required'}
              </Text>
              <View style={styles.priceRow}>
                <Text style={styles.discountedPrice}>₹{item.discountedPrice}</Text>
                <Text style={styles.originalPrice}>₹{item.price}</Text>
              </View>
            </View>
            <View style={styles.cartCardRight}>
              <TouchableOpacity 
                onPress={() => {
                  triggerHaptic(Haptics.ImpactFeedbackStyle.Medium);
                  dispatch(removeFromCart(item.testId));
                }} 
                style={styles.removeBtn}
                accessibilityRole="button"
                accessibilityLabel="Remove Item"
              >
                <MaterialCommunityIcons name="trash-can-outline" size={20} color={COLORS.danger} />
              </TouchableOpacity>
            </View>
          </View>
        ))}

        <TouchableOpacity 
          style={styles.addMoreBtn} 
          onPress={() => {
            triggerHaptic(Haptics.ImpactFeedbackStyle.Light);
            router.push('/search');
          }}
          accessibilityRole="button"
        >
          <MaterialCommunityIcons name="plus" size={20} color={COLORS.primary} />
          <Text style={styles.addMoreText}>Add More Audits / Saplings</Text>
        </TouchableOpacity>

        {/* Coupon Apply Strip */}
        <View style={styles.couponStrip}>
          <TouchableOpacity 
            style={styles.couponLeft} 
            activeOpacity={0.7} 
            onPress={() => {
              triggerHaptic(Haptics.ImpactFeedbackStyle.Light);
              setCouponSheetOpen(true);
            }}
            accessibilityRole="button"
          >
            <MaterialCommunityIcons name="ticket-percent-outline" size={24} color={COLORS.primary} />
            <View style={{ marginLeft: 12, flex: 1 }}>
              <Text style={styles.couponTitle}>
                {appliedCoupon ? `Coupon: ${appliedCoupon.code}` : 'Apply Green Promos & Incentives'}
              </Text>
              <Text style={styles.couponSub}>
                {appliedCoupon ? `You saved ₹${appliedCoupon.val} on this booking!` : 'Try lucky scratch for carbon points'}
              </Text>
            </View>
          </TouchableOpacity>
          {appliedCoupon ? (
            <TouchableOpacity 
              onPress={() => {
                triggerHaptic(Haptics.ImpactFeedbackStyle.Light);
                setAppliedCoupon(null);
              }} 
              style={styles.couponRemoveBtn}
              accessibilityRole="button"
            >
              <Text style={styles.removeCouponText}>Remove</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity 
              onPress={() => {
                triggerHaptic(Haptics.ImpactFeedbackStyle.Light);
                setCouponSheetOpen(true);
              }}
              accessibilityRole="button"
            >
              <MaterialCommunityIcons name="chevron-right" size={24} color="#94A3B8" />
            </TouchableOpacity>
          )}
        </View>

        {/* Bill Details */}
        <View style={styles.billContainer}>
          <Text style={styles.billTitle}>Registration Cost Details</Text>
          <View style={styles.billRow}>
            <Text style={styles.billLabel}>Item Total</Text>
            <Text style={styles.billValue}>₹{cart.totalPrice}</Text>
          </View>
          <View style={styles.billRow}>
            <Text style={styles.billLabel}>Incentive Discount</Text>
            <Text style={[styles.billValue, { color: COLORS.success }]}>- ₹{cart.totalDiscount}</Text>
          </View>
          {couponDiscount > 0 && (
            <View style={styles.billRow}>
              <Text style={styles.billLabel}>Promo Reward</Text>
              <Text style={[styles.billValue, { color: COLORS.success }]}>- ₹{couponDiscount}</Text>
            </View>
          )}
          <View style={styles.billRow}>
            <Text style={styles.billLabel}>Drone field audit visit charge</Text>
            <Text style={styles.billValue}>
              ₹{appliedCollectionCharge}
            </Text>
          </View>
          <View style={styles.billRow}>
            <Text style={styles.billLabel}>Taxes (5% Agricultural GST)</Text>
            <Text style={styles.billValue}>₹{Math.round(cart.totalPrice * 0.05)}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.billRow}>
            <Text style={styles.billTotalLabel}>To Pay</Text>
            <Text style={styles.billTotalValue}>₹{calculatedFinalAmount + Math.round(cart.totalPrice * 0.05)}</Text>
          </View>
        </View>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: 20 + insets.bottom }]}>
        <View style={styles.footerLeft}>
          <Text style={styles.footerTotalLabel}>Total Amount</Text>
          <Text style={styles.footerTotalAmount}>₹{calculatedFinalAmount + Math.round(cart.totalPrice * 0.05)}</Text>
        </View>
        <TouchableOpacity 
          style={styles.continueBtn} 
          onPress={() => {
            triggerHaptic(Haptics.ImpactFeedbackStyle.Medium);
            router.push('/checkout/address');
          }}
          accessibilityRole="button"
        >
          <Text style={styles.continueBtnText}>Continue Scheduling</Text>
          <MaterialCommunityIcons name="arrow-right" size={20} color={COLORS.textLight} style={{ marginLeft: 4 }} />
        </TouchableOpacity>
      </View>

      {/* Coupon Drawer */}
      <PremiumBottomSheet
        visible={isCouponSheetOpen}
        onClose={() => setCouponSheetOpen(false)}
        title="Promos & Incentives"
      >
        <View style={styles.modalBody}>
          {/* Scratch Card Invite Widget */}
          <TouchableOpacity 
            style={styles.scratchInvite} 
            activeOpacity={0.9} 
            onPress={() => {
              triggerHaptic(Haptics.ImpactFeedbackStyle.Light);
              setCouponSheetOpen(false);
              setTimeout(() => setScratchOpen(true), 300);
            }}
            accessibilityRole="button"
          >
            <LinearGradient colors={['#ECFDF5', '#D1FAE5']} style={styles.scratchInviteGrad}>
              <MaterialCommunityIcons name="gift" size={36} color={COLORS.primary} />
              <View style={{ marginLeft: 12, flex: 1 }}>
                <Text style={styles.inviteTitle}>✨ Lucky Green Scratch Card ✨</Text>
                <Text style={styles.inviteDesc}>Swipe to reveal a randomized carbon offset credit reward worth up to ₹300.</Text>
              </View>
              <MaterialCommunityIcons name="chevron-right" size={24} color={COLORS.primaryDark} />
            </LinearGradient>
          </TouchableOpacity>

          <Text style={styles.modalHeading}>Available Promos</Text>
          
          {[
            { code: 'BHUMI150', val: 150, desc: 'Flat ₹150 OFF on soil carbon audit booking' },
            { code: 'GREEN50', val: 50, desc: 'Additional ₹50 border sapling discount' }
          ].map((coupon) => (
            <View key={coupon.code} style={styles.promoItem}>
              <View style={{ flex: 1 }}>
                <Text style={styles.promoCode}>{coupon.code}</Text>
                <Text style={styles.promoDesc}>{coupon.desc}</Text>
              </View>
              <TouchableOpacity 
                style={styles.promoApplyBtn} 
                onPress={() => {
                  triggerHaptic(Haptics.ImpactFeedbackStyle.Medium);
                  setAppliedCoupon({ code: coupon.code, val: coupon.val });
                  setCouponSheetOpen(false);
                }}
                accessibilityRole="button"
              >
                <Text style={styles.promoApplyBtnText}>Apply</Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>
      </PremiumBottomSheet>

      {/* Dynamic Scratch Interaction Modal */}
      <PremiumScratchModal
        visible={isScratchOpen}
        onClose={() => setScratchOpen(false)}
        onApplyReward={(code, val) => {
          if (Platform.OS !== 'web') {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          }
          setAppliedCoupon({ code, val });
          Alert.alert("Reward Unlocked! 🍃", `Congratulations! You successfully applied code ${code} and saved ₹${val}!`);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F4FDF9',
  },
  emptyContainer: {
    flex: 1,
    backgroundColor: '#F4FDF9',
  },
  header: {
    backgroundColor: COLORS.primary,
    paddingTop: Platform.OS === 'ios' ? 50 : 45,
    paddingBottom: 20,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backBtn: {
    padding: 8,
  },
  headerTitle: {
    ...TYPOGRAPHY.h2,
    color: COLORS.textLight,
  },
  emptyContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyTitle: {
    ...TYPOGRAPHY.h2,
    color: COLORS.textDark,
    marginTop: 20,
    marginBottom: 8,
  },
  emptyDesc: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: 30,
  },
  addTestBtn: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 30,
    paddingVertical: 14,
    borderRadius: 30,
  },
  addTestBtnText: {
    ...TYPOGRAPHY.subtitle,
    color: COLORS.textLight,
    fontWeight: 'bold',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 100,
  },
  cartCard: {
    flexDirection: 'row',
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.soft,
  },
  cartCardLeft: {
    flex: 1,
  },
  itemName: {
    ...TYPOGRAPHY.subtitle,
    color: COLORS.textDark,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  itemDesc: {
    ...TYPOGRAPHY.caption,
    color: COLORS.success,
    marginBottom: 12,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  discountedPrice: {
    ...TYPOGRAPHY.h3,
    color: COLORS.textDark,
    marginRight: 8,
  },
  originalPrice: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    textDecorationLine: 'line-through',
  },
  cartCardRight: {
    justifyContent: 'center',
    alignItems: 'flex-end',
    width: 60,
  },
  removeBtn: {
    padding: 8,
    backgroundColor: COLORS.dangerLight,
    borderRadius: 8,
  },
  addMoreBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderWidth: 1.5,
    borderColor: COLORS.primary,
    borderStyle: 'dashed',
    borderRadius: 12,
    marginBottom: 24,
  },
  addMoreText: {
    ...TYPOGRAPHY.subtitle,
    color: COLORS.primary,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  billContainer: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.soft,
  },
  billTitle: {
    ...TYPOGRAPHY.h3,
    color: COLORS.textDark,
    marginBottom: 16,
  },
  billRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  billLabel: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
  },
  billValue: {
    ...TYPOGRAPHY.body,
    color: COLORS.textDark,
    fontWeight: '600',
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: 16,
  },
  billTotalLabel: {
    ...TYPOGRAPHY.subtitle,
    color: COLORS.textDark,
    fontWeight: 'bold',
  },
  billTotalValue: {
    ...TYPOGRAPHY.h2,
    color: COLORS.textDark,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: COLORS.surface,
    flexDirection: 'row',
    padding: 20,
    paddingBottom: Platform.OS === 'ios' ? 34 : 24,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    justifyContent: 'space-between',
    alignItems: 'center',
    ...SHADOWS.soft,
  },
  footerLeft: {
    flex: 1,
  },
  footerTotalLabel: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
  },
  footerTotalAmount: {
    ...TYPOGRAPHY.h1,
    color: COLORS.textDark,
  },
  continueBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 30,
  },
  continueBtnText: {
    ...TYPOGRAPHY.subtitle,
    color: COLORS.textLight,
    fontWeight: 'bold',
  },
  visitSelector: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 5,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    ...SHADOWS.soft,
  },
  visitBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 16,
  },
  visitBtnActive: {
    backgroundColor: COLORS.primary,
  },
  visitBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.primary,
    marginLeft: 6,
  },
  visitBtnTextActive: {
    color: '#FFFFFF',
  },
  centersSection: {
    marginBottom: 20,
  },
  sectionSubhead: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textDark,
    marginBottom: 10,
    letterSpacing: 0.5,
  },
  centersScroll: {
    flexDirection: 'row',
  },
  centerCard: {
    width: 260,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 20,
    padding: 14,
    marginRight: 12,
    ...SHADOWS.soft,
  },
  centerCardActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  centerCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  centerName: {
    fontSize: 13,
    fontWeight: 'bold',
    color: COLORS.textDark,
    flex: 1,
  },
  centerDist: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.primary,
    marginBottom: 2,
  },
  centerAddr: {
    fontSize: 11,
    color: '#64748B',
  },
  centerTextActive: {
    color: '#FFFFFF',
  },
  cartItemsHeader: {
    marginTop: 4,
    marginBottom: 8,
  },
  couponStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginBottom: 16,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    ...SHADOWS.soft,
  },
  couponLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  couponTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    color: COLORS.textDark,
  },
  couponSub: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 1,
  },
  couponRemoveBtn: {
    padding: 6,
  },
  removeCouponText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: COLORS.danger,
  },
  modalBody: {
    paddingHorizontal: 16,
    paddingBottom: 30,
  },
  scratchInvite: {
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 24,
    borderWidth: 1.5,
    borderColor: '#FCD34D',
    ...SHADOWS.soft,
  },
  scratchInviteGrad: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  inviteTitle: {
    fontSize: 14,
    fontWeight: '900',
    color: COLORS.primaryDark,
  },
  inviteDesc: {
    fontSize: 11,
    color: COLORS.primary,
    lineHeight: 15,
    marginTop: 2,
  },
  modalHeading: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.textDark,
    marginBottom: 12,
  },
  promoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    padding: 16,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    marginBottom: 12,
  },
  promoCode: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.primary,
    letterSpacing: 0.5,
  },
  promoDesc: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  promoApplyBtn: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: COLORS.primary,
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 15,
  },
  promoApplyBtnText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
});

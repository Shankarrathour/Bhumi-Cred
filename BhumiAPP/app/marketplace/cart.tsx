import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { COLORS, TYPOGRAPHY, SHADOWS } from '../../src/theme/theme';
import { useMarketplaceStore } from '../../src/store/marketplaceStore';

export default function CartScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const cart = useMarketplaceStore((state) => state.cart);
  const cartSummary = useMarketplaceStore((state) => state.cartSummary);
  const cartActionLoadingId = useMarketplaceStore((state) => state.cartActionLoadingId);
  const updateQuantity = useMarketplaceStore((state) => state.updateQuantity);
  const removeFromCart = useMarketplaceStore((state) => state.removeFromCart);
  
  const totalMRP = cartSummary ? cartSummary.subtotal + cartSummary.discount : cart.reduce((sum, item) => sum + item.product.originalPrice * item.quantity, 0);
  const totalDiscount = cartSummary ? cartSummary.discount : cart.reduce((sum, item) => sum + (item.product.originalPrice - item.product.price) * item.quantity, 0);
  const cartTotal = cartSummary ? cartSummary.grand_total : cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <MaterialCommunityIcons name="arrow-left" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Shopping Cart</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {cart.length === 0 ? (
          <View style={styles.emptyCart}>
            <MaterialCommunityIcons name="cart-off" size={64} color="#94A3B8" />
            <Text style={styles.emptyText}>Your cart is currently empty</Text>
            <TouchableOpacity 
              style={styles.continueBtn} 
              onPress={() => router.back()}
            >
              <Text style={styles.continueBtnText}>Continue Shopping</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <Text style={styles.sectionTitle}>Items ({cart.length})</Text>
            {cart.map((item) => (
              <View key={item.product.id} style={styles.cartCard}>
                <View style={styles.iconFrame}>
                  <MaterialCommunityIcons name={item.product.image as any} size={20} color={COLORS.primary} />
                </View>
                
                <View style={styles.itemInfo}>
                  <Text style={styles.itemCat}>{item.product.category}</Text>
                  <Text style={styles.itemName} numberOfLines={2}>{item.product.name}</Text>
                  <Text style={styles.itemVendor}>{item.product.vendor}</Text>
                  
                  <View style={styles.priceRow}>
                    <Text style={styles.itemPrice}>₹{item.product.price}</Text>
                    <Text style={styles.itemOldPrice}>₹{item.product.originalPrice}</Text>
                  </View>
                </View>

                <View style={styles.actionCol}>
                  <TouchableOpacity 
                    onPress={() => removeFromCart(item.product.id)}
                    style={styles.deleteBtn}
                    disabled={cartActionLoadingId === item.product.id}
                  >
                    {cartActionLoadingId === item.product.id ? (
                       <ActivityIndicator size="small" color={COLORS.danger} />
                    ) : (
                       <MaterialCommunityIcons name="trash-can-outline" size={20} color={COLORS.danger} />
                    )}
                  </TouchableOpacity>
                  
                  <View style={styles.quantityBox}>
                    <TouchableOpacity onPress={() => updateQuantity(item.product.id, item.quantity - 1)} style={styles.qtyBtn}>
                      <MaterialCommunityIcons name="minus" size={16} color={COLORS.primary} />
                    </TouchableOpacity>
                    <Text style={styles.qtyText}>{item.quantity}</Text>
                    <TouchableOpacity onPress={() => updateQuantity(item.product.id, item.quantity + 1)} style={styles.qtyBtn}>
                      <MaterialCommunityIcons name="plus" size={16} color={COLORS.primary} />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            ))}

            <View style={styles.billContainer}>
              <Text style={styles.billTitle}>Price Details</Text>
              <View style={styles.billRow}>
                <Text style={styles.billLabel}>Total MRP</Text>
                <Text style={styles.billValue}>₹{totalMRP.toFixed(2)}</Text>
              </View>
              <View style={styles.billRow}>
                <Text style={styles.billLabel}>Discount</Text>
                <Text style={[styles.billValue, { color: COLORS.success }]}>
                  -₹{totalDiscount.toFixed(2)}
                </Text>
              </View>
              <View style={styles.divider} />
              <View style={styles.billRow}>
                <Text style={styles.billTotalLabel}>Total Amount</Text>
                <Text style={styles.billTotalValue}>₹{cartTotal.toFixed(2)}</Text>
              </View>
            </View>
          </>
        )}
      </ScrollView>

      {cart.length > 0 && (
        <View style={[styles.footer, { paddingBottom: 20 + insets.bottom }]}>
          <View style={styles.footerLeft}>
            <Text style={styles.footerTotalLabel}>Total</Text>
            <Text style={styles.footerTotalAmount}>₹{cartTotal}</Text>
          </View>
          <TouchableOpacity 
            style={styles.checkoutBtn} 
            onPress={() => {
              // Clear accelerated checkout item so it uses standard cart
              useMarketplaceStore.getState().setAcceleratedCheckoutItem(null);
              router.push('/marketplace/address');
            }}
          >
            <LinearGradient colors={[COLORS.primary, COLORS.secondary]} style={styles.checkoutGrad}>
              <Text style={styles.checkoutText}>Add Address</Text>
              <MaterialCommunityIcons name="arrow-right" size={20} color="#FFF" style={{ marginLeft: 4 }} />
            </LinearGradient>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    paddingTop: Platform.OS === 'ios' ? 60 : 45,
    paddingBottom: 16,
    paddingHorizontal: 16,
    backgroundColor: COLORS.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  backBtn: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    ...TYPOGRAPHY.h2,
    color: '#FFFFFF',
    fontWeight: '800',
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 100,
  },
  emptyCart: {
    paddingVertical: 60,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: COLORS.textSecondary,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 24,
  },
  continueBtn: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 20,
  },
  continueBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.textDark,
    marginBottom: 16,
  },
  cartCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    ...SHADOWS.soft,
  },
  iconFrame: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: '#F0FDF4',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  itemInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  itemCat: {
    fontSize: 9,
    fontWeight: '800',
    color: COLORS.primaryLight,
    textTransform: 'uppercase',
  },
  itemName: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.textDark,
    marginTop: 2,
  },
  itemVendor: {
    fontSize: 10,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
  },
  itemPrice: {
    fontSize: 14,
    fontWeight: '900',
    color: COLORS.primary,
  },
  itemOldPrice: {
    fontSize: 11,
    color: COLORS.textSecondary,
    textDecorationLine: 'line-through',
    marginLeft: 6,
  },
  actionCol: {
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    width: 80,
  },
  deleteBtn: {
    padding: 6,
    backgroundColor: '#FEF2F2',
    borderRadius: 8,
    marginBottom: 10,
  },
  quantityBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 2,
  },
  qtyBtn: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  qtyText: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.textDark,
    paddingHorizontal: 6,
  },
  billContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginTop: 8,
    ...SHADOWS.soft,
  },
  billTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.textDark,
    marginBottom: 16,
  },
  billRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  billLabel: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  billValue: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textDark,
  },
  divider: {
    height: 1,
    backgroundColor: '#E2E8F0',
    marginVertical: 12,
  },
  billTotalLabel: {
    fontSize: 14,
    fontWeight: '900',
    color: COLORS.textDark,
  },
  billTotalValue: {
    fontSize: 16,
    fontWeight: '900',
    color: COLORS.primary,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    padding: 20,
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    justifyContent: 'space-between',
    alignItems: 'center',
    ...SHADOWS.soft,
  },
  footerLeft: {
    flex: 1,
  },
  footerTotalLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  footerTotalAmount: {
    fontSize: 20,
    fontWeight: '900',
    color: COLORS.primary,
  },
  checkoutBtn: {
    borderRadius: 30,
    overflow: 'hidden',
  },
  checkoutGrad: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 14,
  },
  checkoutText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
});

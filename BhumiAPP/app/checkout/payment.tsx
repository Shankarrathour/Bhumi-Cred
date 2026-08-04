import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Modal } from 'react-native';
import { useRouter } from 'expo-router';
import { useSelector, useDispatch } from 'react-redux';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { RootState } from '../../src/store';
import { setPaymentMethod, finalizeBooking } from '../../src/store/slices/bookingSlice';
import { clearCart } from '../../src/store/slices/cartSlice';
import { COLORS, TYPOGRAPHY, SHADOWS } from '../../src/theme/theme';

const PAYMENT_METHODS = [
  { id: 'upi', name: 'UPI', icon: 'qrcode-scan' },
  { id: 'card', name: 'Credit / Debit Card', icon: 'credit-card-outline' },
  { id: 'wallet', name: 'Wallets (Paytm, PhonePe)', icon: 'wallet-outline' },
  { id: 'cod', name: 'Pay at Home', icon: 'cash' },
];

export default function PaymentScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const dispatch = useDispatch();

  const cart = useSelector((state: RootState) => state.cart);
  const booking = useSelector((state: RootState) => state.booking);
  
  const [selectedMethod, setSelectedMethod] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const handlePayNow = () => {
    if (!selectedMethod) return;

    setIsProcessing(true);

    // Simulate Payment Gateway Delay
    setTimeout(() => {
      setIsProcessing(false);
      
      const newBooking = {
        id: `BKG-${Math.floor(Math.random() * 100000)}`,
        date: booking.selectedDate,
        time: booking.selectedTimeSlot,
        status: 'Confirmed',
        tests: cart.items,
        total: cart.finalAmount,
        farmerName: booking.farmerDetails?.name,
        paymentMethod: selectedMethod,
      };

      dispatch(setPaymentMethod(selectedMethod));
      dispatch(finalizeBooking(newBooking));
      dispatch(clearCart());
      
      router.replace('/checkout/success');
    }, 3000);
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={COLORS.textLight} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Payment</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        
        {/* Summary Card */}
        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>Booking Summary</Text>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Total Items</Text>
            <Text style={styles.summaryValue}>{cart.items.length}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Amount to Pay</Text>
            <Text style={[styles.summaryValue, styles.amountHighlight]}>₹{cart.finalAmount}</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Select Payment Method</Text>

        {PAYMENT_METHODS.map((method) => (
          <TouchableOpacity 
            key={method.id}
            style={[
              styles.methodCard,
              selectedMethod === method.id && styles.methodCardSelected
            ]}
            onPress={() => setSelectedMethod(method.id)}
          >
            <View style={styles.methodIconBox}>
              <MaterialCommunityIcons 
                name={method.icon as any} 
                size={24} 
                color={selectedMethod === method.id ? COLORS.primary : COLORS.textSecondary} 
              />
            </View>
            <Text style={[
              styles.methodName,
              selectedMethod === method.id && styles.methodNameSelected
            ]}>
              {method.name}
            </Text>
            <View style={styles.radioContainer}>
              {selectedMethod === method.id ? (
                <MaterialCommunityIcons name="radiobox-marked" size={22} color={COLORS.primary} />
              ) : (
                <MaterialCommunityIcons name="radiobox-blank" size={22} color="#CBD5E1" />
              )}
            </View>
          </TouchableOpacity>
        ))}

        <View style={styles.securityBox}>
          <MaterialCommunityIcons name="shield-check" size={20} color={COLORS.success} />
          <Text style={styles.securityText}>100% Secure & Encrypted Payments</Text>
        </View>

      </ScrollView>

      {/* Footer */}
      <View style={[styles.footer, { paddingBottom: 20 + insets.bottom }]}>
        <TouchableOpacity 
          style={[styles.payBtn, !selectedMethod && styles.payBtnDisabled]} 
          disabled={!selectedMethod}
          onPress={handlePayNow}
        >
          <Text style={styles.payBtnText}>Pay ₹{cart.finalAmount}</Text>
        </TouchableOpacity>
      </View>

      {/* Processing Overlay */}
      <Modal visible={isProcessing} transparent animationType="fade">
        <View style={styles.processingOverlay}>
          <View style={styles.processingCard}>
            <ActivityIndicator size="large" color={COLORS.primary} />
            <Text style={styles.processingTitle}>Processing Payment</Text>
            <Text style={styles.processingSub}>Please do not close this window or press back.</Text>
          </View>
        </View>
      </Modal>

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    backgroundColor: COLORS.primary,
    paddingTop: 50,
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
  scrollContent: {
    padding: 16,
    paddingBottom: 100,
  },
  summaryCard: {
    backgroundColor: COLORS.primaryLight + '15',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: COLORS.primaryLight + '40',
  },
  summaryTitle: {
    ...TYPOGRAPHY.h3,
    color: COLORS.primary,
    marginBottom: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  summaryLabel: {
    ...TYPOGRAPHY.body,
    color: COLORS.textDark,
  },
  summaryValue: {
    ...TYPOGRAPHY.subtitle,
    color: COLORS.textDark,
    fontWeight: 'bold',
  },
  amountHighlight: {
    ...TYPOGRAPHY.h2,
    color: COLORS.primary,
  },
  sectionTitle: {
    ...TYPOGRAPHY.h3,
    color: COLORS.textDark,
    marginBottom: 16,
  },
  methodCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    padding: 16,
    borderRadius: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  methodCardSelected: {
    borderColor: COLORS.primary,
    backgroundColor: 'rgba(0, 128, 128, 0.02)',
    borderWidth: 1.5,
  },
  methodIconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  methodName: {
    flex: 1,
    ...TYPOGRAPHY.subtitle,
    color: COLORS.textDark,
    fontWeight: '600',
  },
  methodNameSelected: {
    color: COLORS.primary,
  },
  radioContainer: {
    marginLeft: 8,
  },
  securityBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 24,
  },
  securityText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.success,
    marginLeft: 8,
    fontWeight: 'bold',
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: COLORS.surface,
    padding: 20,
    paddingBottom: 30,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  payBtn: {
    backgroundColor: COLORS.primary,
    paddingVertical: 16,
    borderRadius: 30,
    alignItems: 'center',
  },
  payBtnDisabled: {
    backgroundColor: COLORS.border,
  },
  payBtnText: {
    ...TYPOGRAPHY.subtitle,
    color: COLORS.textLight,
    fontWeight: 'bold',
  },
  processingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  processingCard: {
    backgroundColor: COLORS.surface,
    padding: 32,
    borderRadius: 24,
    alignItems: 'center',
    width: '80%',
  },
  processingTitle: {
    ...TYPOGRAPHY.h3,
    color: COLORS.textDark,
    marginTop: 20,
    marginBottom: 8,
  },
  processingSub: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    textAlign: 'center',
  }
});

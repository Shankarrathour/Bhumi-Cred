import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal, ActivityIndicator, Alert, TextInput, Platform, KeyboardAvoidingView } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

import { COLORS, TYPOGRAPHY, SHADOWS } from '../../src/theme/theme';
import { useMarketplaceStore } from '../../src/store/marketplaceStore';
import { useWalletStore } from '../../src/store/walletStore';
import { isFarmerVerified } from '../../src/utils/verificationGuard';

import { useAuthStore } from '../../src/store/authStore';

export default function PaymentScreen() {
  const router = useRouter();
  
  const cart = useMarketplaceStore((state) => state.cart);
  const acceleratedItem = useMarketplaceStore((state) => state.acceleratedCheckoutItem);
  const checkoutSummaryResponse = useMarketplaceStore((state) => state.checkoutSummaryResponse);
  const syncBalance = useWalletStore((state) => state.syncBalance);
  const walletBalance = useWalletStore((state) => state.balance);
  const checkoutStore = useMarketplaceStore((state) => state.checkout);
  const addToCart = useMarketplaceStore((state) => state.addToCart);
  const authUser = useAuthStore((state) => state.user);

  const isAccelerated = acceleratedItem !== null;
  const itemsToCheckout = isAccelerated ? [acceleratedItem] : cart;
  
  // Use backend totals if available, otherwise fallback to local calc for mock/unauthenticated mode
  const basePrice = checkoutSummaryResponse ? checkoutSummaryResponse.subtotal : itemsToCheckout.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  const shipping = checkoutSummaryResponse ? checkoutSummaryResponse.delivery_charge : (basePrice > 500 ? 0 : 40);
  const taxes = 0; // GST is included in product price per backend or not provided, we won't mock it to prevent desync
  const totalPrice = checkoutSummaryResponse ? checkoutSummaryResponse.final_total : (basePrice + shipping);

  const [isProcessing, setIsProcessing] = useState(false);
  const [showOptionsSheet, setShowOptionsSheet] = useState(false);
  const [activeFlow, setActiveFlow] = useState<'none'|'upi_pin'|'card_details'|'bank_login'|'wallet_confirm'>('none');
  const [selectedMethod, setSelectedMethod] = useState('');

  // Flow specific states
  const [upiPin, setUpiPin] = useState('');
  const [cardNum, setCardNum] = useState('');
  const [cardExp, setCardExp] = useState('');
  const [cardCvv, setCardCvv] = useState('');

  const handleSuccessfulPayment = async () => {
    setIsProcessing(true);
    
    try {
      if (selectedMethod === 'wallet') {
        syncBalance(walletBalance - totalPrice);
      }

      // Ensure address is set in store before checkout
      const currentAddress = useMarketplaceStore.getState().checkoutAddress;
      if (!currentAddress) {
        useMarketplaceStore.getState().setCheckoutAddress({
          full_name: authUser?.fullName || 'Farmer',
          mobile: authUser?.mobile || '9999999999',
          address_line_1: 'Farm Plot #103',
          city: 'Main Block',
          state: 'MP',
          pincode: '466001',
        });
      }

      if (isAccelerated && acceleratedItem) {
        await addToCart(acceleratedItem.product, acceleratedItem.quantity);
        useMarketplaceStore.getState().setAcceleratedCheckoutItem(null);
      }

      const orderId = await checkoutStore('Agri Marketplace Order', selectedMethod);

      setIsProcessing(false);
      setActiveFlow('none');
      
      router.replace({
        pathname: '/marketplace/success',
        params: { orderId, amount: totalPrice.toString() }
      });
    } catch (err) {
      setIsProcessing(false);
      Alert.alert('Payment Failed', 'Transaction error. Please try again.');
    }
  };

  const startFlow = (method: 'upi' | 'wallet' | 'bank' | 'credit_card') => {
    if (method === 'wallet' && walletBalance < totalPrice) {
      Alert.alert('Insufficient Balance', 'Your Eco Wallet balance is too low.');
      return;
    }
    setSelectedMethod(method);
    setShowOptionsSheet(false);
    setTimeout(() => {
      if (method === 'credit_card') setActiveFlow('card_details');
      else if (method === 'upi') setActiveFlow('upi_pin');
      else if (method === 'bank') setActiveFlow('bank_login');
      else if (method === 'wallet') setActiveFlow('wallet_confirm');
    }, 400); 
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.container}>
      <View style={styles.navBar}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} disabled={isProcessing}>
          <MaterialCommunityIcons name="arrow-left" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.navTitle}>Secure Payment</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollArea}>
        <View style={styles.invoiceCard}>
          <Text style={styles.tableTitle}>Order Summary</Text>
          
          <View style={styles.itemsList}>
            {itemsToCheckout.map((item, idx) => (
              <View key={idx} style={styles.itemRow}>
                <Text style={styles.itemText} numberOfLines={1}>{item.quantity}x {item.product.name}</Text>
                <Text style={styles.itemPriceText}>₹{item.product.price * item.quantity}</Text>
              </View>
            ))}
          </View>
          
          <View style={styles.dottedDivider} />

          <View style={styles.tableRow}>
            <Text style={styles.tableColName}>Total Price</Text>
            <Text style={styles.tableColVal}>₹{basePrice.toFixed(2)}</Text>
          </View>
          <View style={styles.tableRow}>
            <Text style={styles.tableColName}>Delivery Charge</Text>
            <Text style={styles.tableColVal}>
              {shipping === 0 ? 'FREE' : `₹${shipping.toFixed(2)}`}
            </Text>
          </View>
          {checkoutSummaryResponse && checkoutSummaryResponse.discount > 0 && (
            <View style={styles.tableRow}>
              <Text style={styles.tableColName}>Discount</Text>
              <Text style={[styles.tableColVal, { color: COLORS.success }]}>
                -₹{checkoutSummaryResponse.discount.toFixed(2)}
              </Text>
            </View>
          )}

          <View style={styles.solidDivider} />

          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Final Amount</Text>
            <Text style={styles.totalVal}>₹{totalPrice.toFixed(2)}</Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.payBtn}
          onPress={() => {
            if (!isFarmerVerified()) return;
            setShowOptionsSheet(true);
          }}
        >
          <LinearGradient colors={[COLORS.primary, COLORS.secondary]} style={styles.payGrad}>
            <MaterialCommunityIcons name="shield-check" size={20} color="#FFFFFF" style={{ marginRight: 8 }} />
            <Text style={styles.payText}>Select Payment Method</Text>
          </LinearGradient>
        </TouchableOpacity>
      </ScrollView>

      {/* Payment Options Bottom Sheet */}
      <Modal visible={showOptionsSheet} transparent animationType="slide">
        <TouchableOpacity style={styles.modalBackdrop} activeOpacity={1} onPress={() => setShowOptionsSheet(false)}>
          <View style={styles.bottomSheet} onStartShouldSetResponder={() => true}>
            <Text style={styles.sheetTitle}>Payment Method / भुगतान विधि</Text>
            <ScrollView>
              <TouchableOpacity style={styles.optionRow} onPress={() => startFlow('upi')}>
                <View style={styles.methodIconBox}><MaterialCommunityIcons name="lightning-bolt" size={20} color="#84CC16" /></View>
                <View style={styles.optionTexts}>
                  <Text style={styles.methodTitle}>UPI</Text>
                  <Text style={styles.methodSub}>GPay, PhonePe, Paytm</Text>
                </View>
                <MaterialCommunityIcons name="chevron-right" size={20} color={COLORS.textSecondary} />
              </TouchableOpacity>

              <TouchableOpacity style={styles.optionRow} onPress={() => startFlow('credit_card')}>
                <View style={[styles.methodIconBox, { backgroundColor: '#F3E8FF' }]}><MaterialCommunityIcons name="credit-card" size={20} color="#9333EA" /></View>
                <View style={styles.optionTexts}>
                  <Text style={styles.methodTitle}>Credit / Debit Card</Text>
                  <Text style={styles.methodSub}>Visa, MasterCard, RuPay</Text>
                </View>
                <MaterialCommunityIcons name="chevron-right" size={20} color={COLORS.textSecondary} />
              </TouchableOpacity>

              <TouchableOpacity style={styles.optionRow} onPress={() => startFlow('bank')}>
                <View style={[styles.methodIconBox, { backgroundColor: '#DBEAFE' }]}><MaterialCommunityIcons name="bank" size={20} color="#2563EB" /></View>
                <View style={styles.optionTexts}>
                  <Text style={styles.methodTitle}>Net Banking</Text>
                  <Text style={styles.methodSub}>SBI, HDFC, ICICI, etc.</Text>
                </View>
                <MaterialCommunityIcons name="chevron-right" size={20} color={COLORS.textSecondary} />
              </TouchableOpacity>

              <TouchableOpacity style={styles.optionRow} onPress={() => startFlow('wallet')}>
                <View style={[styles.methodIconBox, { backgroundColor: '#ECFCCB' }]}><MaterialCommunityIcons name="leaf" size={20} color={COLORS.primary} /></View>
                <View style={styles.optionTexts}>
                  <Text style={styles.methodTitle}>Eco Wallet</Text>
                  <Text style={styles.methodSub}>Balance: ₹{walletBalance}</Text>
                </View>
                <MaterialCommunityIcons name="chevron-right" size={20} color={COLORS.textSecondary} />
              </TouchableOpacity>
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* UPI PIN Modal */}
      <Modal visible={activeFlow === 'upi_pin'} transparent animationType="fade">
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.flowModalBg}>
          <View style={styles.flowModalBox}>
            <View style={{ alignItems: 'center', marginBottom: 20 }}>
              <MaterialCommunityIcons name="shield-lock" size={40} color={COLORS.primary} />
              <Text style={{ fontSize: 18, fontWeight: '800', marginTop: 10 }}>Enter UPI PIN</Text>
              <Text style={{ fontSize: 14, color: COLORS.textSecondary }}>Paying ₹{totalPrice} to BhumiCred</Text>
            </View>
            <TextInput
              style={styles.pinInput}
              keyboardType="number-pad"
              secureTextEntry
              maxLength={6}
              value={upiPin}
              onChangeText={setUpiPin}
              autoFocus
              placeholder="* * * * * *"
              placeholderTextColor="#CBD5E1"
            />
            <View style={styles.flowActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setActiveFlow('none')}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.confirmBtn, upiPin.length < 4 && { opacity: 0.5 }]} 
                onPress={handleSuccessfulPayment}
                disabled={upiPin.length < 4 || isProcessing}
              >
                {isProcessing ? <ActivityIndicator color="#FFF"/> : <Text style={styles.confirmBtnText}>Submit</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      <Modal visible={activeFlow === 'card_details'} transparent animationType="fade">
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.flowModalBg}>
          <View style={styles.flowModalBox}>
            <Text style={{ fontSize: 18, fontWeight: '800', marginBottom: 16 }}>Card Details</Text>
            <TextInput
              style={styles.cardInput}
              placeholder="Card Number (e.g. 4111...)"
              keyboardType="number-pad"
              value={cardNum}
              onChangeText={setCardNum}
            />
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <TextInput
                style={[styles.cardInput, { flex: 1, marginRight: 10 }]}
                placeholder="MM/YY"
                value={cardExp}
                onChangeText={setCardExp}
              />
              <TextInput
                style={[styles.cardInput, { flex: 1 }]}
                placeholder="CVV"
                keyboardType="number-pad"
                secureTextEntry
                maxLength={3}
                value={cardCvv}
                onChangeText={setCardCvv}
              />
            </View>
            <View style={[styles.flowActions, { marginTop: 20 }]}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setActiveFlow('none')}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.confirmBtn} onPress={handleSuccessfulPayment} disabled={isProcessing}>
                {isProcessing ? <ActivityIndicator color="#FFF"/> : <Text style={styles.confirmBtnText}>Pay ₹{totalPrice}</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Bank Login Modal */}
      <Modal visible={activeFlow === 'bank_login'} transparent animationType="fade">
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.flowModalBg}>
          <View style={styles.flowModalBox}>
            <View style={{ alignItems: 'center', marginBottom: 20 }}>
              <MaterialCommunityIcons name="bank" size={40} color="#2563EB" />
              <Text style={{ fontSize: 18, fontWeight: '800', marginTop: 10 }}>Net Banking Login</Text>
            </View>
            <TextInput style={styles.cardInput} placeholder="User ID / Customer ID" />
            <TextInput style={styles.cardInput} placeholder="Password" secureTextEntry />
            <View style={[styles.flowActions, { marginTop: 20 }]}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setActiveFlow('none')}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.confirmBtn} onPress={handleSuccessfulPayment} disabled={isProcessing}>
                {isProcessing ? <ActivityIndicator color="#FFF"/> : <Text style={styles.confirmBtnText}>Login & Pay</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Wallet Confirm Modal */}
      <Modal visible={activeFlow === 'wallet_confirm'} transparent animationType="fade">
        <View style={styles.flowModalBg}>
          <View style={styles.flowModalBox}>
            <View style={{ alignItems: 'center', marginBottom: 20 }}>
              <MaterialCommunityIcons name="wallet-outline" size={40} color={COLORS.primary} />
              <Text style={{ fontSize: 18, fontWeight: '800', marginTop: 10 }}>Confirm Deduction</Text>
              <Text style={{ fontSize: 14, color: COLORS.textSecondary, textAlign: 'center', marginTop: 10 }}>
                ₹{totalPrice} will be deducted from your Eco Wallet. Current balance: ₹{walletBalance}.
              </Text>
            </View>
            <View style={styles.flowActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setActiveFlow('none')}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.confirmBtn} onPress={handleSuccessfulPayment} disabled={isProcessing}>
                {isProcessing ? <ActivityIndicator color="#FFF"/> : <Text style={styles.confirmBtnText}>Confirm</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  navBar: {
    paddingTop: Platform.OS === 'ios' ? 60 : 45,
    paddingBottom: 16,
    paddingHorizontal: 16,
    backgroundColor: COLORS.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backBtn: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  navTitle: {
    ...TYPOGRAPHY.h2,
    color: '#FFFFFF',
    fontWeight: '800',
  },
  scrollArea: {
    padding: 20,
    paddingBottom: 100,
  },
  invoiceCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 24,
    ...SHADOWS.soft,
  },
  tableTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.textDark,
    marginBottom: 16,
  },
  itemsList: {
    marginBottom: 12,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  itemText: {
    fontSize: 13,
    color: COLORS.textSecondary,
    flex: 1,
    paddingRight: 10,
  },
  itemPriceText: {
    fontSize: 13,
    color: COLORS.textDark,
    fontWeight: '600',
  },
  dottedDivider: {
    borderStyle: 'dashed',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    marginVertical: 16,
    borderRadius: 1,
  },
  tableRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  tableColName: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  tableColVal: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textDark,
  },
  solidDivider: {
    height: 1,
    backgroundColor: '#E2E8F0',
    marginVertical: 16,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalLabel: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.textDark,
  },
  totalVal: {
    fontSize: 20,
    fontWeight: '900',
    color: COLORS.primary,
  },
  payBtn: {
    borderRadius: 30,
    overflow: 'hidden',
    ...SHADOWS.medium,
  },
  payGrad: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
  },
  payText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  bottomSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    minHeight: 300,
  },
  sheetTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: COLORS.textDark,
    marginBottom: 20,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  methodIconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#F0FDF4',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  optionTexts: {
    flex: 1,
  },
  methodTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.textDark,
  },
  methodSub: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  flowModalBg: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  flowModalBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    width: '100%',
    ...SHADOWS.large,
  },
  pinInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    letterSpacing: 8,
    paddingVertical: 16,
    color: COLORS.textDark,
  },
  cardInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 48,
    fontSize: 14,
    marginBottom: 12,
  },
  flowActions: {
    flexDirection: 'row',
    marginTop: 24,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    marginRight: 12,
  },
  cancelBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textSecondary,
  },
  confirmBtn: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    borderRadius: 12,
  },
  confirmBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
  },
});

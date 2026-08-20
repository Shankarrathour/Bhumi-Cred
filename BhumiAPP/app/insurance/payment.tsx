import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, StatusBar, Platform, Dimensions, Alert, ActivityIndicator, Modal, TextInput, KeyboardAvoidingView } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, TYPOGRAPHY, SHADOWS } from '../../src/theme/theme';
import { useInsuranceStore } from '../../src/store/insuranceStore';
import { useWalletStore } from '../../src/store/walletStore';
import { useLandStore } from '../../src/store/landStore';
import { useAuthStore } from '../../src/store/authStore';
import api from '../../src/api/apiClient';

const { width, height } = Dimensions.get('window');

type FlowStep = 'checkout' | 'processing' | 'failed' | 'receipt' | 'submitted';

export default function PremiumPaymentScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const insets = useSafeAreaInsets();

  // Route Params
  const mode = params.mode as 'single' | 'family' | 'land_only';
  const treeName = params.treeName as string;
  const species = params.species as string;
  const treeCountVal = parseInt(params.treeCount as string || '1', 10);
  const premium = parseFloat(params.premium as string || '99');
  const coverage = parseFloat(params.coverage as string || '3000');
  const policyId = params.policyId as string || 'pol_ecolife';
  const policyName = params.policyName as string || 'Eco Life';
  const plotName = params.plotName as string || 'My Farm Plot';

  // Zustand Store
  const registerTrees = useInsuranceStore((state) => state.registerTrees);
  const walletBalance = useWalletStore((state) => state.balance);
  const plots = useLandStore((state) => state.plots);
  const authUser = useAuthStore((state) => state.user);

  // States for dynamic wizard flow
  const [currentFlow, setCurrentFlow] = useState<FlowStep>('checkout');
  const [showOptionsSheet, setShowOptionsSheet] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState<'upi' | 'wallet' | 'card' | 'netbanking'>('upi');
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStatus, setProcessingStatus] = useState('');
  
  // Checkout Accordion & Promo code states
  const [isBreakdownExpanded, setIsBreakdownExpanded] = useState(true);
  const [promoCode, setPromoCode] = useState('');
  const [discountAmount, setDiscountAmount] = useState(0);
  const [appliedPromo, setAppliedPromo] = useState('');
  const [termsAccepted, setTermsAccepted] = useState(false);

  // Payment Form States
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [cardName, setCardName] = useState('');
  const [upiId, setUpiId] = useState('');
  const [selectedBank, setSelectedBank] = useState('SBI');

  // Generated application refs
  const [txnId, setTxnId] = useState('');
  const [appId, setAppId] = useState('');
  const [policyRef, setPolicyRef] = useState('');

  // Calculate invoice breakdowns
  const landRegFee = 99; // Standard land registration fee
  const baseInsurancePremium = mode === 'land_only' ? 0 : premium;
  const mrvAuditFee = mode === 'land_only' ? 0 : Math.round(premium * 0.2);
  const soilNPKFee = mode === 'land_only' ? 0 : Math.round(premium * 0.1);
  const registryFee = mode === 'land_only' ? 0 : Math.round(premium * 0.1);
  
  const subTotal = landRegFee + baseInsurancePremium + mrvAuditFee + soilNPKFee + registryFee;
  const finalTotal = Math.max(0, subTotal - discountAmount);

  // Apply promo helper
  const handleApplyPromo = () => {
    if (promoCode.trim().toUpperCase() === 'BHUMI10') {
      const discount = Math.round(subTotal * 0.1);
      setDiscountAmount(discount);
      setAppliedPromo('BHUMI10');
      Alert.alert('Promo Applied', 'BhumiCred Promo Code BHUMI10 applied successfully! Saved 10% on combined fees.');
    } else {
      Alert.alert('Invalid Code', 'Please enter a valid promo code (Try: BHUMI10).');
    }
  };

  const handleStartPaymentSimulation = () => {
    if (!termsAccepted) {
      Alert.alert('Consent Required', 'Please accept the payment terms & conditions to proceed.');
      return;
    }
    setShowOptionsSheet(true);
  };

  // Run payment processor simulator (F28)
  const runPaymentProcessor = async () => {
    setShowOptionsSheet(false);
    setCurrentFlow('processing');
    setProcessingStatus('Contacting secure gateway...');
    
    // Step-by-step loading state
    setTimeout(() => {
      setProcessingStatus('Verifying transaction token...');
    }, 1000);

    setTimeout(async () => {
      // Simulate Success/Failure
      // If Card CVV is '999' or UPI PIN/ID contains '9999', it fails
      const shouldFail = cardCvv === '999' || upiId.includes('9999') || Math.random() < 0.15;

      if (shouldFail) {
        setCurrentFlow('failed');
      } else {
        // Generate references
        const newTxn = `TXN-${Math.floor(100000 + Math.random() * 900000)}`;
        const newApp = `LND-APP-SEH-${Math.floor(1000 + Math.random() * 9000)}`;
        const newPol = mode !== 'land_only' ? `POL-Shield-${Math.floor(100000 + Math.random() * 900000)}` : '';
        
        setTxnId(newTxn);
        setAppId(newApp);
        setPolicyRef(newPol);

        // Deduct from wallet if wallet is selected
        if (selectedMethod === 'wallet') {
          useWalletStore.setState({ balance: walletBalance - finalTotal });
        }

        // Add payment transaction to wallet store transactions list so it appears in Mobile App Wallet History
        const methodLabel = selectedMethod === 'upi' ? 'UPI' : selectedMethod === 'card' ? 'Card' : selectedMethod === 'netbanking' ? 'Net Banking' : 'Wallet';
        const txnRecord = {
          id: newTxn,
          date: new Date().toISOString().split('T')[0],
          description: mode === 'land_only' ? `Land Parcel Registration Fee - ${plotName}` : `Insurance & Land Fee - ${plotName}`,
          amount: finalTotal,
          type: 'debit' as const,
          status: 'Completed' as const,
        };
        const existingTxns = useWalletStore.getState().transactions;
        useWalletStore.setState({
          transactions: [txnRecord, ...existingTxns.filter(t => t.id !== newTxn)]
        });

        // Real Backend Tree Registration to MongoDB
        try {
          let photoUrls: string[] = [];
          try {
            if (params.photosData) {
              const parsed = JSON.parse(params.photosData as string);
              photoUrls = Object.values(parsed).filter(Boolean) as string[];
            }
          } catch (e) {}

          const treePayload = {
            tree_name: treeName || `${species || 'Teak'} Asset #${Math.floor(100 + Math.random() * 900)}`,
            tree_species: species || 'Teak',
            tree_count: mode === 'single' ? 1 : (treeCountVal || 5),
            tree_age: parseInt(params.age as string || '2', 10) || 2,
            plantation_year: new Date().getFullYear(),
            land_id: (params.plotId as string) || null,
            latitude: parseFloat(params.lat as string || '22.9734') || 22.9734,
            longitude: parseFloat(params.lng as string || '78.6569') || 78.6569,
            village: authUser?.village || 'Anuppur Khas',
            district: authUser?.district || 'Anuppur',
            state: authUser?.state || 'Madhya Pradesh',
            photos: photoUrls,
            insurance_required: true,
            remarks: `Policy: ${policyName} (Cover: ₹${coverage}, Premium: ₹${premium}). Txn: ${newTxn}`
          };

          await api.post('/tree/register', treePayload);
        } catch (apiErr) {
          console.warn('[payment] /tree/register API call error:', apiErr);
        }

        // Register trees with store if applicable
        if (mode !== 'land_only') {
          await registerTrees(policyId, mode === 'single' ? 1 : treeCountVal);
        }

        setCurrentFlow('receipt');
      }
    }, 2500);
  };

  // Receipt actions (F29)
  const handleDownloadReceipt = () => {
    Alert.alert(
      'Receipt Downloaded',
      `Transaction receipt for reference ${txnId} has been saved to your device and shared with +91 ${authUser?.mobile || '9826011902'}.`
    );
  };

  return (
    <View style={styles.container as any}>
      <StatusBar barStyle="dark-content" />
      
      {/* 1. CHECKOUT VIEW (F27) */}
      {currentFlow === 'checkout' && (
        <View style={{ flex: 1 }}>
          {/* Header */}
          <View style={[styles.header, { paddingTop: insets.top > 0 ? insets.top + 10 : 35 }] as any}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backBtn as any}>
              <MaterialCommunityIcons name="arrow-left" size={24} color="#1E293B" />
            </TouchableOpacity>
            <Text style={styles.headerTitle as any}>Combined Invoice</Text>
            <View style={{ width: 40 }} />
          </View>

          <ScrollView contentContainerStyle={styles.scrollContent as any} showsVerticalScrollIndicator={false}>
            {/* Invoice Meta Card */}
            <View style={styles.invoiceCard as any}>
              <View style={styles.invoiceHeader as any}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <MaterialCommunityIcons name="leaf" size={22} color={COLORS.accent} />
                  <Text style={styles.invoiceBrand as any}>BhumiCred</Text>
                </View>
                <View style={styles.invoiceBadge as any}>
                  <Text style={styles.invoiceBadgeText as any}>OFFICIAL INVOICE</Text>
                </View>
              </View>

              <View style={styles.dottedDivider as any} />

              <View style={styles.metaSection as any}>
                <View style={styles.metaRow as any}>
                  <Text style={styles.metaLabel as any}>Invoice To:</Text>
                  <Text style={styles.metaValue as any}>{authUser?.fullName || 'Ramesh Patel'}</Text>
                </View>
                <View style={styles.metaRow as any}>
                  <Text style={styles.metaLabel as any}>Land Plot:</Text>
                  <Text style={styles.metaValue as any}>{plotName}</Text>
                </View>
                {mode !== 'land_only' && (
                  <View style={styles.metaRow as any}>
                    <Text style={styles.metaLabel as any}>Insurance Cover:</Text>
                    <Text style={styles.metaValue as any}>{policyName}</Text>
                  </View>
                )}
              </View>
            </View>

            {/* Accordion Invoice Breakdown */}
            <View style={styles.sectionCard as any}>
              <TouchableOpacity 
                activeOpacity={0.8}
                onPress={() => setIsBreakdownExpanded(!isBreakdownExpanded)}
                style={styles.accordionHeader as any}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <MaterialCommunityIcons name="receipt" size={20} color={COLORS.primary} style={{ marginRight: 8 }} />
                  <Text style={styles.sectionTitle as any}>Billing Details / बिल विवरण</Text>
                </View>
                <MaterialCommunityIcons 
                  name={isBreakdownExpanded ? "chevron-up" : "chevron-down"} 
                  size={20} 
                  color="#64748B" 
                />
              </TouchableOpacity>

              {isBreakdownExpanded && (
                <View style={styles.breakdownContainer as any}>
                  <View style={styles.breakdownRow as any}>
                    <Text style={styles.breakdownLabel as any}>Land Registration Fee / भू-पंजीकरण शुल्क</Text>
                    <Text style={styles.breakdownValue as any}>₹{landRegFee}</Text>
                  </View>

                  {mode !== 'land_only' && (
                    <>
                      <View style={styles.breakdownRow as any}>
                        <Text style={styles.breakdownLabel as any}>Tree Insurance Premium / बीमा प्रीमियम</Text>
                        <Text style={styles.breakdownValue as any}>₹{baseInsurancePremium}</Text>
                      </View>
                      <View style={styles.breakdownRow as any}>
                        <Text style={styles.breakdownLabel as any}>MRV Drone Audit Scan (20%)</Text>
                        <Text style={styles.breakdownValue as any}>₹{mrvAuditFee}</Text>
                      </View>
                      <View style={styles.breakdownRow as any}>
                        <Text style={styles.breakdownLabel as any}>NPK Soil Baseline Profile (10%)</Text>
                        <Text style={styles.breakdownValue as any}>₹{soilNPKFee}</Text>
                      </View>
                      <View style={styles.breakdownRow as any}>
                        <Text style={styles.breakdownLabel as any}>Ecosystem Registry Sync (10%)</Text>
                        <Text style={styles.breakdownValue as any}>₹{registryFee}</Text>
                      </View>
                    </>
                  )}

                  {discountAmount > 0 && (
                    <View style={styles.breakdownRow as any}>
                      <Text style={[styles.breakdownLabel, { color: COLORS.success }] as any}>
                        Referral Discount Applied ({appliedPromo})
                      </Text>
                      <Text style={[styles.breakdownValue, { color: COLORS.success }] as any}>-₹{discountAmount}</Text>
                    </View>
                  )}
                </View>
              )}

              <View style={styles.divider as any} />

              <View style={styles.totalRow as any}>
                <Text style={styles.totalLabel as any}>Total Amount Payable / कुल देय राशि:</Text>
                <Text style={styles.totalValue as any}>₹{finalTotal.toLocaleString('en-IN')}</Text>
              </View>
            </View>

            {/* Promo Code adjustment */}
            <View style={styles.sectionCard as any}>
              <Text style={styles.promoTitle as any}>Have a Referral Code / Promo Code?</Text>
              <View style={styles.promoInputRow as any}>
                <TextInput
                  placeholder="Enter Code (e.g., BHUMI10)"
                  value={promoCode}
                  onChangeText={setPromoCode}
                  autoCapitalize="characters"
                  style={styles.promoInput as any}
                  placeholderTextColor="#94A3B8"
                />
                <TouchableOpacity onPress={handleApplyPromo} style={styles.promoApplyBtn as any}>
                  <Text style={styles.promoApplyText as any}>Apply</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Terms and Consent Checkbox */}
            <View style={styles.sectionCard as any}>
              <TouchableOpacity 
                activeOpacity={0.8}
                onPress={() => setTermsAccepted(!termsAccepted)}
                style={styles.termsAckRow as any}
              >
                <View style={[styles.checkbox, termsAccepted && styles.checkboxActive] as any}>
                  {termsAccepted && <MaterialCommunityIcons name="check" size={16} color="#FFFFFF" />}
                </View>
                <Text style={styles.termsText as any}>
                  I consent to the combined land boundary verification fees and authorize physical/satellite canopy checks.
                </Text>
              </TouchableOpacity>
            </View>

            {/* Proceed Button */}
            <TouchableOpacity 
              style={[styles.payBtn, !termsAccepted && { opacity: 0.6 }] as any} 
              onPress={handleStartPaymentSimulation}
              disabled={!termsAccepted}
            >
              <LinearGradient colors={[COLORS.primary, COLORS.secondary]} style={styles.payBtnGrad as any}>
                <MaterialCommunityIcons name="lock-outline" size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
                <Text style={styles.payBtnLabel as any}>Pay Combined Invoice • ₹{finalTotal}</Text>
              </LinearGradient>
            </TouchableOpacity>

            <View style={{ height: 40 }} />
          </ScrollView>
        </View>
      )}

      {/* 2. PAYMENT PROCESSING VIEW (F28) */}
      {currentFlow === 'processing' && (
        <View style={styles.loaderBackdrop as any}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loaderStatus as any}>{processingStatus}</Text>
          <Text style={styles.loaderSub as any}>Please do not close the app or go back.</Text>
        </View>
      )}

      {/* 3. PAYMENT FAILED VIEW (F28) */}
      {currentFlow === 'failed' && (
        <View style={styles.failedBackdrop as any}>
          <View style={styles.statusCircleFailed as any}>
            <MaterialCommunityIcons name="close" size={44} color="#FFFFFF" />
          </View>
          <Text style={styles.failedTitle as any}>Payment Declined / भुगतान विफल</Text>
          <Text style={styles.failedDesc as any}>
            The transaction was declined by the bank due to invalid details or network timeout. Please retry.
          </Text>

          <TouchableOpacity 
            style={styles.retryBtn as any} 
            onPress={() => {
              setCardCvv(''); // Clear CVV so they can retry
              setCurrentFlow('checkout');
              setShowOptionsSheet(true); // Open selector again
            }}
          >
            <Text style={styles.retryBtnText as any}>Retry Payment / पुन: प्रयास करें</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.returnBtn as any}
            onPress={() => router.back()}
          >
            <Text style={styles.returnBtnText as any}>Return to Summary / वापस जाएं</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* 4. PAYMENT SUCCESS RECEIPT VIEW (F29) */}
      {currentFlow === 'receipt' && (
        <View style={styles.receiptContainer as any}>
          <View style={styles.receiptCard as any}>
            <View style={styles.statusCircleSuccess as any}>
              <MaterialCommunityIcons name="check" size={32} color="#FFFFFF" />
            </View>
            <Text style={styles.receiptTitle as any}>Payment Successful! 🎉</Text>
            <Text style={styles.receiptDesc as any}>
              Invoice amount paid and synced with the climate canopy ledger.
            </Text>

            <View style={styles.receiptTable as any}>
              <View style={styles.receiptRow as any}>
                <Text style={styles.receiptLabel as any}>Payment ID:</Text>
                <Text style={styles.receiptVal as any}>{txnId}</Text>
              </View>
              <View style={styles.receiptRow as any}>
                <Text style={styles.receiptLabel as any}>Amount Paid:</Text>
                <Text style={[styles.receiptVal, { color: COLORS.primary, fontWeight: '800' }] as any}>
                  ₹{finalTotal.toLocaleString('en-IN')}
                </Text>
              </View>
              <View style={styles.receiptRow as any}>
                <Text style={styles.receiptLabel as any}>Date/Time:</Text>
                <Text style={styles.receiptVal as any}>
                  {new Date().toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </Text>
              </View>
              <View style={styles.receiptRow as any}>
                <Text style={styles.receiptLabel as any}>Application Ref:</Text>
                <Text style={styles.receiptVal as any}>{appId}</Text>
              </View>
              {policyRef !== '' && (
                <View style={styles.receiptRow as any}>
                  <Text style={styles.receiptLabel as any}>Policy Ref:</Text>
                  <Text style={styles.receiptVal as any}>{policyRef}</Text>
                </View>
              )}
            </View>

            <TouchableOpacity style={styles.downloadBtn as any} onPress={handleDownloadReceipt}>
              <MaterialCommunityIcons name="share-variant-outline" size={18} color={COLORS.primary} style={{ marginRight: 6 }} />
              <Text style={styles.downloadText as any}>Download & Share Receipt</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.continueBtn as any}
              onPress={() => setCurrentFlow('submitted')}
            >
              <LinearGradient colors={[COLORS.primary, COLORS.secondary]} style={styles.continueBtnGrad as any}>
                <Text style={styles.continueBtnLabel as any}>Continue</Text>
                <MaterialCommunityIcons name="arrow-right" size={18} color="#FFFFFF" style={{ marginLeft: 6 }} />
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* 5. APPLICATION SUBMITTED VIEW (F30) */}
      {currentFlow === 'submitted' && (
        <View style={styles.submittedContainer as any}>
          <View style={styles.submittedCard as any}>
            <View style={styles.plantIllustration as any}>
              <MaterialCommunityIcons name="sprout" size={64} color={COLORS.primary} />
            </View>
            
            <Text style={styles.submittedTitle as any}>Application Submitted!</Text>
            <Text style={styles.submittedDesc as any}>
              Your land and tree assets have been successfully queued for GIS review and environmental verification.
            </Text>

            <View style={styles.detailGrid as any}>
              <View style={styles.detailGridRow as any}>
                <Text style={styles.detailGridLabel as any}>Application ID:</Text>
                <Text style={styles.detailGridValue as any}>{appId}</Text>
              </View>
              <View style={styles.detailGridRow as any}>
                <Text style={styles.detailGridLabel as any}>Plot Name/Area:</Text>
                <Text style={styles.detailGridValue as any}>{plotName}</Text>
              </View>
              <View style={styles.detailGridRow as any}>
                <Text style={styles.detailGridLabel as any}>Payment Status:</Text>
                <Text style={[styles.detailGridValue, { color: COLORS.success, fontWeight: '800' }] as any}>Paid ✅</Text>
              </View>
              <View style={styles.detailGridRow as any}>
                <Text style={styles.detailGridLabel as any}>Insurance Status:</Text>
                <Text style={styles.detailGridValue as any}>
                  {mode !== 'land_only' ? `Active (${policyName})` : 'Not Selected'}
                </Text>
              </View>
            </View>

            {/* Timeline Next Step Card */}
            <View style={styles.nextStepCard as any}>
              <MaterialCommunityIcons name="security" size={20} color="#0E7490" style={{ marginRight: 10 }} />
              <View style={{ flex: 1 }}>
                <Text style={styles.nextStepTitle as any}>Next Step: Admin Verification</Text>
                <Text style={styles.nextStepSub as any}>
                  Auditor will check geofence polygons against registry records in 24-48 hours.
                </Text>
              </View>
            </View>

            {/* CTAs */}
            <TouchableOpacity 
              style={styles.trackBtn as any}
              onPress={() => router.replace(`/tracking/${appId}` as any)}
            >
              <LinearGradient colors={[COLORS.primary, COLORS.secondary]} style={styles.trackBtnGrad as any}>
                <MaterialCommunityIcons name="map-marker-radius" size={20} color="#FFFFFF" style={{ marginRight: 6 }} />
                <Text style={styles.trackBtnLabel as any}>Track Application</Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.homeBtn as any}
              onPress={() => router.replace('/(tabs)' as any)}
            >
              <Text style={styles.homeBtnLabel as any}>Go to Home</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* UPI / Card Selector Bottom Sheet Drawer */}
      <Modal visible={showOptionsSheet} transparent={true} animationType="slide">
        <View style={styles.sheetBackdrop as any}>
          <View style={styles.sheetContent as any}>
            <View style={styles.sheetHeader as any}>
              <Text style={styles.sheetTitle as any}>Select Payment Method</Text>
              <TouchableOpacity onPress={() => setShowOptionsSheet(false)} style={styles.sheetCloseBtn as any}>
                <MaterialCommunityIcons name="close" size={20} color="#64748B" />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={{ padding: 20 }}>
              <TouchableOpacity 
                style={[styles.methodCard, selectedMethod === 'upi' && styles.methodCardActive] as any}
                onPress={() => setSelectedMethod('upi')}
              >
                <MaterialCommunityIcons name="flash-outline" size={22} color={selectedMethod === 'upi' ? COLORS.primary : '#475569'} />
                <Text style={styles.methodLabel as any}>UPI (Google Pay / PhonePe)</Text>
              </TouchableOpacity>

              {selectedMethod === 'upi' && (
                <View style={styles.methodForm as any}>
                  <TextInput
                    placeholder="Enter UPI ID (e.g. name@okhdfcbank)"
                    value={upiId}
                    onChangeText={setUpiId}
                    style={styles.formInput as any}
                    placeholderTextColor="#94A3B8"
                  />
                </View>
              )}

              <TouchableOpacity 
                style={[styles.methodCard, selectedMethod === 'card' && styles.methodCardActive] as any}
                onPress={() => setSelectedMethod('card')}
              >
                <MaterialCommunityIcons name="credit-card-outline" size={22} color={selectedMethod === 'card' ? COLORS.primary : '#475569'} />
                <Text style={styles.methodLabel as any}>Credit or Debit Card</Text>
              </TouchableOpacity>

              {selectedMethod === 'card' && (
                <View style={styles.methodForm as any}>
                  <TextInput
                    placeholder="Cardholder Name"
                    value={cardName}
                    onChangeText={setCardName}
                    style={styles.formInput as any}
                    placeholderTextColor="#94A3B8"
                  />
                  <TextInput
                    placeholder="Card Number"
                    value={cardNumber}
                    onChangeText={setCardNumber}
                    keyboardType="numeric"
                    style={styles.formInput as any}
                    placeholderTextColor="#94A3B8"
                  />
                  <View style={{ flexDirection: 'row', gap: 10 }}>
                    <TextInput
                      placeholder="MM/YY"
                      value={cardExpiry}
                      onChangeText={setCardExpiry}
                      style={[styles.formInput, { flex: 1 }] as any}
                      placeholderTextColor="#94A3B8"
                    />
                    <TextInput
                      placeholder="CVV"
                      value={cardCvv}
                      onChangeText={setCardCvv}
                      keyboardType="numeric"
                      secureTextEntry
                      maxLength={3}
                      style={[styles.formInput, { flex: 1 }] as any}
                      placeholderTextColor="#94A3B8"
                    />
                  </View>
                  <Text style={{ fontSize: 10, color: '#64748B', marginTop: 4 }}>
                    Tip: Enter CVV '999' to simulate a bank payment decline.
                  </Text>
                </View>
              )}

              <TouchableOpacity 
                style={[styles.methodCard, selectedMethod === 'netbanking' && styles.methodCardActive] as any}
                onPress={() => setSelectedMethod('netbanking')}
              >
                <MaterialCommunityIcons name="bank-outline" size={22} color={selectedMethod === 'netbanking' ? COLORS.primary : '#475569'} />
                <Text style={styles.methodLabel as any}>Net Banking</Text>
              </TouchableOpacity>

              {selectedMethod === 'netbanking' && (
                <View style={styles.methodForm as any}>
                  <TextInput
                    placeholder="Bank Name (e.g. SBI, HDFC)"
                    value={selectedBank}
                    onChangeText={setSelectedBank}
                    style={styles.formInput as any}
                    placeholderTextColor="#94A3B8"
                  />
                </View>
              )}

              <TouchableOpacity 
                style={[styles.methodCard, selectedMethod === 'wallet' && styles.methodCardActive] as any}
                onPress={() => setSelectedMethod('wallet')}
              >
                <MaterialCommunityIcons name="wallet-outline" size={22} color={selectedMethod === 'wallet' ? COLORS.primary : '#475569'} />
                <Text style={styles.methodLabel as any}>Eco Credits Wallet (Bal: ₹{walletBalance})</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.sheetPayBtn as any} onPress={runPaymentProcessor}>
                <Text style={styles.sheetPayText as any}>Confirm & Pay ₹{finalTotal}</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 14,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderColor: '#E2E8F0',
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  invoiceCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    ...SHADOWS.small,
  },
  invoiceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  invoiceBrand: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.primary,
    marginLeft: 6,
  },
  invoiceBadge: {
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  invoiceBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: COLORS.primary,
  },
  dottedDivider: {
    height: 1,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderStyle: 'dashed',
    marginVertical: 14,
  },
  metaSection: {
    gap: 8,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  metaLabel: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '600',
  },
  metaValue: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1E293B',
  },
  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    ...SHADOWS.small,
  },
  accordionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#1E293B',
  },
  breakdownContainer: {
    marginTop: 12,
    gap: 8,
  },
  breakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  breakdownLabel: {
    fontSize: 12,
    color: '#475569',
    fontWeight: '500',
  },
  breakdownValue: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1E293B',
  },
  divider: {
    height: 1,
    backgroundColor: '#E2E8F0',
    marginVertical: 12,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalLabel: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F172A',
  },
  totalValue: {
    fontSize: 18,
    fontWeight: '900',
    color: COLORS.primaryDark,
  },
  promoTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#475569',
    marginBottom: 8,
  },
  promoInputRow: {
    flexDirection: 'row',
    gap: 8,
  },
  promoInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 12,
    color: '#1E293B',
    backgroundColor: '#F8FAFC',
  },
  promoApplyBtn: {
    paddingHorizontal: 16,
    backgroundColor: COLORS.primary,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  promoApplyText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
  termsAckRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: '#94A3B8',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  checkboxActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  termsText: {
    flex: 1,
    fontSize: 12,
    color: '#475569',
    fontWeight: '500',
    lineHeight: 18,
  },
  payBtn: {
    width: '100%',
    height: 56,
    borderRadius: 16,
    overflow: 'hidden',
  },
  payBtnGrad: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  payBtnLabel: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
  loaderBackdrop: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    padding: 40,
  },
  loaderStatus: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
    marginTop: 20,
  },
  loaderSub: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 6,
  },
  failedBackdrop: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    padding: 30,
  },
  statusCircleFailed: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#EF4444',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    ...SHADOWS.medium,
  },
  failedTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1E293B',
    marginBottom: 8,
  },
  failedDesc: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  retryBtn: {
    width: '80%',
    paddingVertical: 14,
    backgroundColor: COLORS.primary,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    ...SHADOWS.small,
  },
  retryBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
  returnBtn: {
    width: '80%',
    paddingVertical: 14,
    backgroundColor: '#F1F5F9',
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  returnBtnText: {
    color: '#475569',
    fontSize: 13,
    fontWeight: '800',
  },
  receiptContainer: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  receiptCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24,
    width: '100%',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    ...SHADOWS.medium,
  },
  statusCircleSuccess: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: COLORS.success,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  receiptTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#1E293B',
    marginBottom: 6,
  },
  receiptDesc: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
    marginBottom: 20,
  },
  receiptTable: {
    width: '100%',
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 10,
    marginBottom: 20,
  },
  receiptRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  receiptLabel: {
    fontSize: 12,
    color: '#475569',
    fontWeight: '600',
  },
  receiptVal: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0F172A',
  },
  downloadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderWidth: 1.5,
    borderColor: COLORS.primary,
    borderRadius: 14,
    width: '100%',
    justifyContent: 'center',
    marginBottom: 12,
  },
  downloadText: {
    color: COLORS.primary,
    fontSize: 12,
    fontWeight: '800',
  },
  continueBtn: {
    width: '100%',
    height: 52,
    borderRadius: 14,
    overflow: 'hidden',
  },
  continueBtnGrad: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  continueBtnLabel: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
  submittedContainer: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  submittedCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24,
    width: '100%',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    ...SHADOWS.medium,
  },
  plantIllustration: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#F0FDF4',
    borderWidth: 2,
    borderColor: '#DCFCE7',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  submittedTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#0F172A',
    marginBottom: 8,
  },
  submittedDesc: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 24,
  },
  detailGrid: {
    width: '100%',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 16,
    padding: 16,
    backgroundColor: '#FAFBFD',
    gap: 10,
    marginBottom: 20,
  },
  detailGridRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  detailGridLabel: {
    fontSize: 12,
    color: '#475569',
    fontWeight: '600',
  },
  detailGridValue: {
    fontSize: 12,
    color: '#0F172A',
    fontWeight: '700',
  },
  nextStepCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFEFF',
    borderWidth: 1,
    borderColor: '#A5F3FC',
    borderRadius: 16,
    padding: 14,
    marginBottom: 24,
  },
  nextStepTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0E7490',
  },
  nextStepSub: {
    fontSize: 10.5,
    color: '#0891B2',
    marginTop: 2,
    lineHeight: 14,
    fontWeight: '500',
  },
  trackBtn: {
    width: '100%',
    height: 52,
    borderRadius: 14,
    overflow: 'hidden',
    marginBottom: 12,
  },
  trackBtnGrad: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  trackBtnLabel: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
  homeBtn: {
    width: '100%',
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  homeBtnLabel: {
    color: '#475569',
    fontSize: 13,
    fontWeight: '800',
  },
  sheetBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  sheetContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: height * 0.8,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  sheetTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
  },
  sheetCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  methodCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    marginBottom: 12,
    gap: 12,
  },
  methodCardActive: {
    borderColor: COLORS.primary,
    backgroundColor: '#F0FDF4',
  },
  methodLabel: {
    fontSize: 13,
    fontWeight: '800',
    color: '#1E293B',
  },
  methodForm: {
    padding: 12,
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 12,
    gap: 8,
  },
  formInput: {
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 12,
    color: '#1E293B',
    backgroundColor: '#FFFFFF',
  },
  sheetPayBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    ...SHADOWS.small,
  },
  sheetPayText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
});

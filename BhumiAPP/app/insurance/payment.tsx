import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, StatusBar, Platform, Dimensions, Alert, ActivityIndicator, Modal, TextInput, KeyboardAvoidingView } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets, SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, TYPOGRAPHY, SHADOWS } from '../../src/theme/theme';
import { useInsuranceStore } from '../../src/store/insuranceStore';
import { useWalletStore } from '../../src/store/walletStore';
import { useLandStore } from '../../src/store/landStore';
import { useAuthStore } from '../../src/store/authStore';
import api from '../../src/api/apiClient';
import { isFarmerVerified } from '../../src/utils/verificationGuard';

const { width, height } = Dimensions.get('window');

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
  const photosData = params.photosData as string | undefined;
  const treeListData = params.treeListData as string | undefined;
  const geoCoordsData = params.geoCoordsData as string | undefined;
  const plantationConfiguration = params.plantationType as string | undefined;

  // Zustand Store
  const registerTrees = useInsuranceStore((state) => state.registerTrees);
  const walletBalance = useWalletStore((state) => state.balance);
  const plots = useLandStore((state) => state.plots);
  const authUser = useAuthStore((state) => state.user);
  
  const paramsAcres = params.acres ? parseFloat(params.acres as string) : 0;
  const storeAcres = plots.reduce((sum, p) => sum + (parseFloat(p.acres as any) || 0), 0);
  const totalAcres = paramsAcres > 0 ? paramsAcres : (storeAcres > 0 ? storeAcres : 1);
  const hasLandPremium = !!params.landPremium;
  const carbonProfileFee = hasLandPremium ? parseFloat((totalAcres * 119).toFixed(2)) : 0;

  // States
  const [showOptionsSheet, setShowOptionsSheet] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState<'upi' | 'wallet' | 'bank' | 'credit_card' | 'debit_card'>('upi');
  const [activeFlow, setActiveFlow] = useState<'none' | 'card_details' | 'card_otp' | 'upi_pin' | 'bank_login' | 'bank_otp' | 'wallet_confirm'>('none');
  const [isProcessing, setIsProcessing] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  // Form States for Flows
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [cardName, setCardName] = useState('');
  const [otpValue, setOtpValue] = useState('');
  const [upiPin, setUpiPin] = useState('');
  const [bankId, setBankId] = useState('');
  const [bankPwd, setBankPwd] = useState('');

  // Calculate invoice breakdowns
  const basePrice = mode === 'land_only' ? 0 : premium;
  const mrvAuditFee = mode === 'land_only' ? 0 : Math.round(premium * 0.2);
  const soilNPKFee = mode === 'land_only' ? 0 : Math.round(premium * 0.1);
  const registryFee = mode === 'land_only' ? 0 : Math.round(premium * 0.1);
  const totalPrice = carbonProfileFee + basePrice + mrvAuditFee + soilNPKFee + registryFee;

  const handleSuccessfulPayment = async () => {
    setIsProcessing(true);
    
    try {
      if (selectedMethod === 'wallet') {
        useWalletStore.setState({ balance: walletBalance - totalPrice });
      }

      const actualCount = mode === 'single' ? 1 : treeCountVal;
      
      const payload = {
        tree_name: treeName || 'Unknown Tree',
        tree_species: species || 'Unknown Species',
        tree_count: actualCount,
        tree_age: parseInt(params.age as string) || 1,
        plantation_year: new Date().getFullYear(),
        latitude: 22.9782,
        longitude: 78.6591,
        village: authUser?.village || 'Budhni Village',
        district: authUser?.district || 'Bhopal Rural',
        state: authUser?.state || 'MP',
        photos: []
      };

      let treeId = null;
      if (mode === 'single') {
        const res = await api.post('/tree/register', payload);
        treeId = res.data?.data?.id;
      }

      if (treeId && photosData && mode === 'single') {
        try {
          const parsedPhotos = JSON.parse(photosData);
          const formData = new FormData();
          for (const key of Object.keys(parsedPhotos)) {
            const uri = parsedPhotos[key];
            if (uri && typeof uri === 'string') {
              const filename = uri.split('/').pop() || `${key}.jpg`;
              const match = /\.(\w+)$/.exec(filename);
              const type = match ? `image/${match[1]}` : 'image/jpeg';
              formData.append('photos', {
                uri,
                name: filename,
                type,
              } as any);
            }
          }
          await api.post(`/tree/${treeId}/photos`, formData, {
            headers: {
              'Content-Type': 'multipart/form-data',
            },
          });
        } catch (e) {
          console.error("Failed to upload photos", e);
        }
      }

      if (mode === 'family') {
        try {
          const parsedTreeList = treeListData ? JSON.parse(treeListData) : [];
          const parsedGeoCoords = geoCoordsData ? JSON.parse(geoCoordsData) : null;

          const treesDetails = [];
          for (const tree of parsedTreeList) {
            let photo_url: string | undefined;
            if (tree.photoUri) {
              try {
                const filename = tree.photoUri.split('/').pop() || `tree_${tree.id}.jpg`;
                const match = /\.(\w+)$/.exec(filename);
                const type = match ? `image/${match[1]}` : 'image/jpeg';
                const photoFormData = new FormData();
                photoFormData.append('file', { uri: tree.photoUri, name: filename, type } as any);
                const uploadRes = await api.post('/uploads/image?folder=green-family', photoFormData, {
                  headers: { 'Content-Type': 'multipart/form-data' },
                });
                photo_url = uploadRes.data?.image_url;
              } catch (e) {
                console.error('Failed to upload tree photo', e);
              }
            }
            treesDetails.push({
              species: tree.species,
              age: tree.age,
              health: tree.health,
              hasPhoto: !!tree.hasPhoto,
              photo_url: photo_url || null,
            });
          }

          await api.post('/farmer/green-family', {
            cluster_size: actualCount,
            plantation_configuration: plantationConfiguration || '',
            geo_coords: parsedGeoCoords,
            trees_details: treesDetails,
            plan_id: policyId,
            plan_name: policyName,
            premium_amount: premium,
            cover_amount: coverage * actualCount,
          });
        } catch (e) {
          console.error('Failed to create green family cover', e);
        }
      }

      // Sync trees count in Zustand store
      if (mode !== 'land_only') {
        await registerTrees(policyId, actualCount);
      }

      setIsProcessing(false);
      setShowSuccess(true);
    } catch (err) {
      setIsProcessing(false);
      Alert.alert('Registration Failed', 'Could not sync tree registration with the server. Please try again.');
    }
  };

  const startFlow = (method: 'upi' | 'wallet' | 'bank' | 'credit_card' | 'debit_card') => {
    if (method === 'wallet' && walletBalance < totalPrice) {
      Alert.alert('Insufficient Balance', 'Your Eco Wallet carbon credits balance is too low. Please choose another method.');
      return;
    }
    setSelectedMethod(method);
    setShowOptionsSheet(false);
    setTimeout(() => {
      if (method === 'credit_card' || method === 'debit_card') setActiveFlow('card_details');
      else if (method === 'upi') setActiveFlow('upi_pin');
      else if (method === 'bank') setActiveFlow('bank_login');
      else if (method === 'wallet') setActiveFlow('wallet_confirm');
    }, 400); // Wait for bottom sheet to close
  };

  const handleViewCertificate = () => {
    setShowSuccess(false);
    
    if (mode === 'land_only') {
      router.replace('/(tabs)' as any);
      return;
    }

    // Route to certificate PDF
    router.replace({
      pathname: '/insurance/certificate' as any,
      params: {
        mode,
        policyName,
        treeName: mode === 'single' ? treeName : `${treeCountVal} Group Cluster`,
        species: mode === 'single' ? species : 'Agroforestry Group',
        count: mode === 'single' ? '1' : treeCountVal.toString(),
        cover: (coverage * (mode === 'single' ? 1 : treeCountVal)).toString(),
        premium: totalPrice.toString(),
      }
    });
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="dark-content" backgroundColor="#F4FDF9" />
      
      {/* Header */}
      <View style={styles.navBar}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} disabled={isProcessing}>
          <MaterialCommunityIcons name="arrow-left" size={22} color={COLORS.primary} />
        </TouchableOpacity>
        <Text style={styles.navTitle}>Secure Payment Portal</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollArea} showsVerticalScrollIndicator={false}>
        
        {/* Professional BhumiCred Invoice */}
        <View style={styles.invoiceCard}>
          
          {/* Logo & Header */}
          <View style={styles.invoiceHeader}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <MaterialCommunityIcons name="leaf" size={22} color={COLORS.accent} />
              <Text style={styles.invoiceBrand}>BhumiCred</Text>
            </View>
            <View style={styles.invoiceBadge}>
              <Text style={styles.invoiceBadgeText}>MOCK INVOICE</Text>
            </View>
          </View>

          {/* Dotted Divider */}
          <View style={styles.dottedDivider} />

          {/* Farmer Credentials details */}
          <View style={styles.metaSection}>
            <View style={styles.metaRow}>
              <Text style={styles.metaLabel}>Invoice To:</Text>
              <Text style={styles.metaValue}>{authUser?.fullName || ''}{authUser?.mobile ? ` (ID: BC-FM-${authUser.mobile.slice(-4)})` : ''}</Text>
            </View>
            <View style={styles.metaRow}>
              <Text style={styles.metaLabel}>Mobile No:</Text>
              <Text style={styles.metaValue}>{authUser?.mobile ? `+91 ${authUser.mobile}` : ''}</Text>
            </View>
            <View style={styles.metaRow}>
              <Text style={styles.metaLabel}>Plantation:</Text>
              <Text style={styles.metaValue}>{mode === 'single' ? `${treeName} (${species})` : `${treeCountVal} Trees Cluster`}</Text>
            </View>
            <View style={styles.metaRow}>
              <Text style={styles.metaLabel}>Policy Cover:</Text>
              <Text style={styles.metaValue}>{policyName}</Text>
            </View>
          </View>

          <View style={styles.dottedDivider} />

          {/* Billing Breakdown Table */}
          <Text style={styles.tableTitle}>Billing Breakdown / बिल विवरण</Text>
          
          {carbonProfileFee > 0 && (
            <View style={styles.tableRow}>
              <Text style={styles.tableColName}>Carbon Profile Test</Text>
              <Text style={styles.tableColVal}>₹{carbonProfileFee}</Text>
            </View>
          )}

          {mode !== 'land_only' && (
            <>
              <Text style={[styles.tableTitle, { marginTop: 16 }]}>Selected Policy/Plan / चयनित योजना</Text>
              <View style={styles.tableRow}>
                <Text style={styles.tableColName}>{policyName} (Base Cover)</Text>
                <Text style={styles.tableColVal}>₹{basePrice}</Text>
              </View>
              
              <Text style={[styles.tableTitle, { marginTop: 16 }]}>Billing Breakdown / बिल विवरण</Text>
              <View style={styles.tableRow}>
                <Text style={styles.tableColName}>MRV Drone Audit Scan</Text>
                <Text style={styles.tableColVal}>₹{mrvAuditFee}</Text>
              </View>
              <View style={styles.tableRow}>
                <Text style={styles.tableColName}>NPK Soil Baseline Profile</Text>
                <Text style={styles.tableColVal}>₹{soilNPKFee}</Text>
              </View>
              <View style={styles.tableRow}>
                <Text style={styles.tableColName}>Ecosystem Registry Sync</Text>
                <Text style={styles.tableColVal}>₹{registryFee}</Text>
              </View>
            </>
          )}

          <View style={styles.solidDivider} />

          {/* Grand Total */}
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>TOTAL AMOUNT DUE:</Text>
            <Text style={styles.totalVal}>₹{totalPrice}</Text>
          </View>
        </View>

        {/* Checkout Button */}
        <TouchableOpacity
          style={styles.payBtn}
          activeOpacity={0.9}
          onPress={() => {
            if (mode !== 'land_only' && !isFarmerVerified()) return;
            setShowOptionsSheet(true);
          }}
          disabled={isProcessing}
        >
          <LinearGradient colors={[COLORS.primary, COLORS.secondary]} style={styles.payGrad}>
            {isProcessing ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <>
                <MaterialCommunityIcons name="lock-outline" size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
                <Text style={styles.payText}>Authorize Premium Payout • ₹{totalPrice}</Text>
              </>
            )}
          </LinearGradient>
        </TouchableOpacity>
        
        <View style={{ height: 40 }} />
      </ScrollView>

      {/* 1. Payment Options Bottom Sheet */}
      <Modal visible={showOptionsSheet} transparent={true} animationType="slide">
        <View style={styles.modalBackdrop}>
          <TouchableOpacity style={{ flex: 1 }} onPress={() => setShowOptionsSheet(false)} />
          <View style={styles.bottomSheet}>
            <View style={styles.sheetHandle} />
            <Text style={styles.sheetTitle}>Select Checkout Option / भुगतान विधि</Text>
            <ScrollView showsVerticalScrollIndicator={false}>
              
              <TouchableOpacity style={styles.optionRow} onPress={() => startFlow('upi')}>
                <View style={styles.methodIconBox}><MaterialCommunityIcons name="lightning-bolt" size={20} color="#84CC16" /></View>
                <View style={styles.optionTexts}>
                  <Text style={styles.methodTitle}>Instant UPI</Text>
                  <Text style={styles.methodSub}>GPay, PhonePe, Paytm</Text>
                </View>
                <MaterialCommunityIcons name="chevron-right" size={20} color={COLORS.textSecondary} />
              </TouchableOpacity>

              <TouchableOpacity style={styles.optionRow} onPress={() => startFlow('credit_card')}>
                <View style={[styles.methodIconBox, { backgroundColor: '#F3E8FF' }]}><MaterialCommunityIcons name="credit-card" size={20} color="#9333EA" /></View>
                <View style={styles.optionTexts}>
                  <Text style={styles.methodTitle}>Credit Card</Text>
                  <Text style={styles.methodSub}>Visa, MasterCard, Amex, RuPay</Text>
                </View>
                <MaterialCommunityIcons name="chevron-right" size={20} color={COLORS.textSecondary} />
              </TouchableOpacity>

              <TouchableOpacity style={styles.optionRow} onPress={() => startFlow('debit_card')}>
                <View style={[styles.methodIconBox, { backgroundColor: '#E0E7FF' }]}><MaterialCommunityIcons name="credit-card-outline" size={20} color="#4F46E5" /></View>
                <View style={styles.optionTexts}>
                  <Text style={styles.methodTitle}>Debit Card</Text>
                  <Text style={styles.methodSub}>All major debit cards supported</Text>
                </View>
                <MaterialCommunityIcons name="chevron-right" size={20} color={COLORS.textSecondary} />
              </TouchableOpacity>

              <TouchableOpacity style={styles.optionRow} onPress={() => startFlow('bank')}>
                <View style={[styles.methodIconBox, { backgroundColor: '#F1F5F9' }]}><MaterialCommunityIcons name="bank" size={20} color={COLORS.textSecondary} /></View>
                <View style={styles.optionTexts}>
                  <Text style={styles.methodTitle}>NetBanking</Text>
                  <Text style={styles.methodSub}>Direct bank transfer</Text>
                </View>
                <MaterialCommunityIcons name="chevron-right" size={20} color={COLORS.textSecondary} />
              </TouchableOpacity>

              <TouchableOpacity style={styles.optionRow} onPress={() => startFlow('wallet')}>
                <View style={[styles.methodIconBox, { backgroundColor: '#E0F2F1' }]}><MaterialCommunityIcons name="wallet-outline" size={20} color={COLORS.primary} /></View>
                <View style={styles.optionTexts}>
                  <Text style={styles.methodTitle}>Eco Carbon Wallet</Text>
                  <Text style={styles.methodSub}>Balance: ₹{walletBalance}</Text>
                </View>
                <MaterialCommunityIcons name="chevron-right" size={20} color={COLORS.textSecondary} />
              </TouchableOpacity>

            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* 2. Simulated Flows Modal */}
      <Modal visible={activeFlow !== 'none'} transparent={true} animationType="fade">
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalBackdropCentered}>
          <View style={styles.flowCard}>
            
            <View style={styles.flowHeader}>
              <TouchableOpacity onPress={() => setActiveFlow('none')}>
                <MaterialCommunityIcons name="close" size={24} color={COLORS.textSecondary} />
              </TouchableOpacity>
              <Text style={styles.flowTitle}>
                {activeFlow === 'upi_pin' ? 'UPI PIN' : 
                 activeFlow === 'card_details' ? 'Card Details' :
                 activeFlow === 'card_otp' ? 'Bank OTP' :
                 activeFlow === 'bank_login' ? 'NetBanking Login' :
                 activeFlow === 'bank_otp' ? 'Authorize Payment' :
                 'Confirm Payment'}
              </Text>
              <View style={{ width: 24 }} />
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }}>
              
              {/* --- UPI FLOW --- */}
              {activeFlow === 'upi_pin' && (
                <View style={styles.flowBody}>
                  <Text style={styles.flowSubCenter}>Enter your 4 or 6 digit UPI PIN for {selectedMethod}</Text>
                  <TextInput
                    style={styles.otpInput}
                    placeholder="* * * *"
                    secureTextEntry
                    keyboardType="number-pad"
                    maxLength={6}
                    value={upiPin}
                    onChangeText={setUpiPin}
                    autoFocus
                  />
                  <TouchableOpacity 
                    style={[styles.actionBtn, { marginTop: 30 }]} 
                    onPress={() => {
                      if (upiPin.length >= 4) {
                        setActiveFlow('none');
                        handleSuccessfulPayment();
                      }
                    }}
                  >
                    <Text style={styles.actionBtnText}>SUBMIT</Text>
                  </TouchableOpacity>
                </View>
              )}

              {/* --- CARD DETAILS FLOW --- */}
              {activeFlow === 'card_details' && (
                <View style={styles.flowBody}>
                  <Text style={styles.inputLabel}>Card Number</Text>
                  <TextInput style={styles.textInput} placeholder="0000 0000 0000 0000" keyboardType="number-pad" maxLength={19} value={cardNumber} onChangeText={setCardNumber} />
                  
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                    <View style={{ flex: 1, marginRight: 10 }}>
                      <Text style={styles.inputLabel}>Expiry</Text>
                      <TextInput style={styles.textInput} placeholder="MM/YY" maxLength={5} value={cardExpiry} onChangeText={setCardExpiry} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.inputLabel}>CVV</Text>
                      <TextInput style={styles.textInput} placeholder="123" keyboardType="number-pad" maxLength={4} secureTextEntry value={cardCvv} onChangeText={setCardCvv} />
                    </View>
                  </View>

                  <Text style={styles.inputLabel}>Name on Card</Text>
                  <TextInput style={styles.textInput} placeholder="Name on card" value={cardName} onChangeText={setCardName} />

                  <TouchableOpacity 
                    style={[styles.actionBtn, { marginTop: 20 }]} 
                    onPress={() => setActiveFlow('card_otp')}
                  >
                    <Text style={styles.actionBtnText}>PROCEED SECURELY</Text>
                  </TouchableOpacity>
                </View>
              )}

              {/* --- CARD OTP FLOW --- */}
              {activeFlow === 'card_otp' && (
                <View style={styles.flowBody}>
                  <Text style={styles.flowSubCenter}>Enter the OTP sent to your registered mobile number for card ending in {cardNumber.slice(-4) || 'XXXX'}</Text>
                  <TextInput
                    style={styles.otpInput}
                    placeholder="000000"
                    keyboardType="number-pad"
                    maxLength={6}
                    value={otpValue}
                    onChangeText={setOtpValue}
                    autoFocus
                  />
                  <TouchableOpacity 
                    style={[styles.actionBtn, { marginTop: 30 }]} 
                    onPress={() => {
                      if (otpValue.length >= 4) {
                        setActiveFlow('none');
                        handleSuccessfulPayment();
                      }
                    }}
                  >
                    <Text style={styles.actionBtnText}>VERIFY & PAY</Text>
                  </TouchableOpacity>
                </View>
              )}

              {/* --- NETBANKING FLOW --- */}
              {activeFlow === 'bank_login' && (
                <View style={styles.flowBody}>
                  <Text style={styles.inputLabel}>Customer ID / User ID</Text>
                  <TextInput style={styles.textInput} placeholder="Enter your ID" value={bankId} onChangeText={setBankId} autoFocus />
                  
                  <Text style={styles.inputLabel}>Password</Text>
                  <TextInput style={styles.textInput} placeholder="Enter password" secureTextEntry value={bankPwd} onChangeText={setBankPwd} />

                  <TouchableOpacity 
                    style={[styles.actionBtn, { marginTop: 20 }]} 
                    onPress={() => setActiveFlow('bank_otp')}
                  >
                    <Text style={styles.actionBtnText}>LOGIN</Text>
                  </TouchableOpacity>
                </View>
              )}

              {activeFlow === 'bank_otp' && (
                <View style={styles.flowBody}>
                  <Text style={styles.flowSubCenter}>Enter the authorization OTP from your bank</Text>
                  <TextInput
                    style={styles.otpInput}
                    placeholder="000000"
                    keyboardType="number-pad"
                    maxLength={6}
                    value={otpValue}
                    onChangeText={setOtpValue}
                    autoFocus
                  />
                  <TouchableOpacity 
                    style={[styles.actionBtn, { marginTop: 30 }]} 
                    onPress={() => {
                      if (otpValue.length >= 4) {
                        setActiveFlow('none');
                        handleSuccessfulPayment();
                      }
                    }}
                  >
                    <Text style={styles.actionBtnText}>AUTHORIZE PAYMENT</Text>
                  </TouchableOpacity>
                </View>
              )}

              {/* --- WALLET FLOW --- */}
              {activeFlow === 'wallet_confirm' && (
                <View style={styles.flowBody}>
                  <View style={{ alignItems: 'center', marginBottom: 20 }}>
                    <MaterialCommunityIcons name="wallet" size={48} color={COLORS.primary} />
                    <Text style={{ fontSize: 16, marginTop: 10, fontWeight: 'bold' }}>Eco Carbon Wallet</Text>
                  </View>
                  <View style={styles.receiptRow}>
                    <Text style={styles.receiptLabel}>Current Balance:</Text>
                    <Text style={styles.receiptVal}>₹{walletBalance}</Text>
                  </View>
                  <View style={styles.receiptRow}>
                    <Text style={styles.receiptLabel}>Amount to Deduct:</Text>
                    <Text style={[styles.receiptVal, { color: '#EF4444' }]}>- ₹{totalPrice}</Text>
                  </View>
                  <View style={[styles.receiptRow, { marginTop: 10, borderTopWidth: 1, borderColor: '#E2E8F0', paddingTop: 10 }]}>
                    <Text style={[styles.receiptLabel, { fontWeight: 'bold' }]}>Remaining Balance:</Text>
                    <Text style={[styles.receiptVal, { fontWeight: 'bold' }]}>₹{walletBalance - totalPrice}</Text>
                  </View>
                  
                  <TouchableOpacity 
                    style={[styles.actionBtn, { marginTop: 30 }]} 
                    onPress={() => {
                      setActiveFlow('none');
                      handleSuccessfulPayment();
                    }}
                  >
                    <Text style={styles.actionBtnText}>CONFIRM DEDUCTION</Text>
                  </TouchableOpacity>
                </View>
              )}

            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Success Modal Check Sheet overlay */}
      {showSuccess && (
        <View style={styles.successBackdrop}>
          <View style={styles.successSheet}>
            <View style={styles.stampCircle}>
              <MaterialCommunityIcons name="shield-check" size={54} color={COLORS.success} />
            </View>
            <Text style={styles.successTitle}>{mode === 'land_only' ? 'Land Registration Fee Paid!' : 'Policy Activated Successfully!'} 🎉</Text>
            <Text style={styles.successDesc}>
              {mode === 'land_only' ? 'Your land registration process is now complete. The land is pending verification by our admins.' : 'Congratulations! Your tree asset is now secured under the BhumiShield climate canopy.'} We have queued our orbital MRV spectrometer baseline scans.
            </Text>

            <View style={styles.receiptSummary}>
              <View style={styles.receiptRow}>
                <Text style={styles.receiptLabel}>Assigned Policy ID:</Text>
                <Text style={styles.receiptVal}>BS-{Math.floor(100000 + Math.random() * 900000)}</Text>
              </View>
              <View style={styles.receiptRow}>
                <Text style={styles.receiptLabel}>Insured Saplings:</Text>
                <Text style={styles.receiptVal}>{mode === 'single' ? '1 Tree' : `${treeCountVal} Trees`}</Text>
              </View>
              <View style={styles.receiptRow}>
                <Text style={styles.receiptLabel}>Total Cover Value:</Text>
                <Text style={[styles.receiptVal, { color: COLORS.primary }]}>₹{coverage * (mode === 'single' ? 1 : treeCountVal)}</Text>
              </View>
            </View>

            <TouchableOpacity 
              style={styles.certificateBtn} 
              activeOpacity={0.85}
              onPress={handleViewCertificate}
            >
              <LinearGradient colors={[COLORS.accent, '#A3E635']} style={styles.certGrad}>
                <MaterialCommunityIcons name="certificate" size={18} color={COLORS.primaryDark} style={{ marginRight: 6 }} />
                <Text style={styles.certText}>View Digital Insurance Certificate</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F4FDF9',
  },
  navBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    height: 56,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderColor: '#E2E8F0',
  },
  backBtn: {
    padding: 6,
    borderRadius: 10,
  },
  navTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.primaryDark,
  },
  scrollArea: {
    padding: 20,
  },
  invoiceCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 20,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    ...SHADOWS.soft,
    marginBottom: 20,
  },
  invoiceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  invoiceBrand: {
    fontSize: 16,
    fontWeight: '900',
    color: COLORS.primary,
    marginLeft: 4,
  },
  invoiceBadge: {
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  invoiceBadgeText: {
    fontSize: 8,
    fontWeight: '900',
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
    marginBottom: 6,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  metaLabel: {
    fontSize: 10,
    color: COLORS.textSecondary,
    fontWeight: '700',
  },
  metaValue: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.textDark,
  },
  tableTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: 10,
    textTransform: 'uppercase',
  },
  tableRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  tableColName: {
    fontSize: 11,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  tableColVal: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.textDark,
  },
  solidDivider: {
    height: 1.5,
    backgroundColor: '#E2E8F0',
    marginVertical: 10,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  totalLabel: {
    fontSize: 12,
    fontWeight: '900',
    color: COLORS.primaryDark,
  },
  totalVal: {
    fontSize: 19,
    fontWeight: '900',
    color: COLORS.primary,
  },
  sectionTitle: {
    fontSize: 18,
    color: COLORS.primaryDark,
    fontWeight: '800',
    marginBottom: 12,
  },
  methodCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 18,
    padding: 14,
    marginBottom: 10,
  },
  methodCardActive: {
    borderColor: COLORS.primary,
    backgroundColor: '#F0FDF4',
  },
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioChecked: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.primary,
  },
  methodIconBox: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: '#FFFBEB',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
  },
  methodTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.textDark,
  },
  methodSub: {
    fontSize: 10,
    color: COLORS.textSecondary,
    fontWeight: '600',
    marginTop: 1,
  },
  payBtn: {
    borderRadius: 30,
    overflow: 'hidden',
    marginTop: 14,
    ...SHADOWS.glow,
  },
  payGrad: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 16,
  },
  payText: {
    fontSize: 15,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  // Success overlay styles
  successBackdrop: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(2, 44, 34, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    zIndex: 9999,
  },
  successSheet: {
    backgroundColor: '#FFFFFF',
    borderRadius: 28,
    padding: 24,
    width: '100%',
    alignItems: 'center',
    ...SHADOWS.glow,
  },
  stampCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: '#ECFDF5',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: COLORS.border,
    marginBottom: 20,
  },
  successTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: COLORS.primary,
    textAlign: 'center',
    marginBottom: 10,
  },
  successDesc: {
    fontSize: 11,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 16,
    fontWeight: '600',
    marginBottom: 20,
    paddingHorizontal: 8,
  },
  receiptSummary: {
    width: '100%',
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 24,
  },
  receiptRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  receiptLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontWeight: '700',
  },
  receiptVal: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.textDark,
  },
  certificateBtn: {
    width: '100%',
    borderRadius: 16,
    overflow: 'hidden',
    ...SHADOWS.glow,
  },
  certGrad: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
  },
  certText: {
    color: COLORS.primaryDark,
    fontSize: 13,
    fontWeight: '900',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  bottomSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    padding: 24,
    maxHeight: height * 0.7,
  },
  sheetHandle: {
    width: 40,
    height: 4,
    backgroundColor: '#E2E8F0',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 20,
  },
  sheetTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: COLORS.primaryDark,
    marginBottom: 20,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderColor: '#F1F5F9',
  },
  optionTexts: {
    flex: 1,
    marginLeft: 16,
  },
  modalBackdropCentered: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  flowCard: {
    backgroundColor: '#FFFFFF',
    width: '100%',
    borderRadius: 24,
    padding: 20,
    maxHeight: '90%',
  },
  flowHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  flowTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: COLORS.primaryDark,
  },
  flowBody: {
    paddingVertical: 10,
  },
  flowSubCenter: {
    fontSize: 13,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 18,
  },
  otpInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 16,
    paddingVertical: 16,
    fontSize: 24,
    fontWeight: '900',
    textAlign: 'center',
    letterSpacing: 8,
    color: COLORS.primaryDark,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textSecondary,
    marginBottom: 8,
    marginTop: 16,
  },
  textInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 14,
    color: COLORS.textDark,
    fontWeight: '700',
  },
  actionBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    ...SHADOWS.glow,
  },
  actionBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '900',
  },
});

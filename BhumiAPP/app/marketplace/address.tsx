import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Platform, Alert, KeyboardAvoidingView } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { COLORS, TYPOGRAPHY, SHADOWS } from '../../src/theme/theme';
import { useAuthStore } from '../../src/store/authStore';
import { useMarketplaceStore } from '../../src/store/marketplaceStore';

export default function AddressScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const user = useAuthStore((state) => state.user);

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [district, setDistrict] = useState('');
  const [stateName, setStateName] = useState('');

  const [errors, setErrors] = useState<{[key: string]: string}>({});
  const [isProcessing, setIsProcessing] = useState(false);
  
  const scrollViewRef = useRef<ScrollView>(null);
  const inputLayouts = useRef<{[key: string]: number}>({});
  
  const handleAutoFill = () => {
    if (user) {
      setName((user as any).fullName || '');
      setPhone((user as any).mobile || '');
      setDistrict(user.district || 'Bhopal');
      setStateName(user.state || 'Madhya Pradesh');
      setAddress('Gram Panchayat area, near local market');
      setErrors({});
    } else {
      Alert.alert('Profile Not Found', 'Could not auto-fill details.');
    }
  };

  const handleProceed = () => {
    let newErrors: {[key: string]: string} = {};
    if (!(name || '').trim()) newErrors.name = 'Full Name is required';
    if (!phone || phone.length !== 10) newErrors.phone = 'Valid 10-digit Mobile Number required';
    if (!(address || '').trim()) newErrors.address = 'Street / Farm Address is required';
    if (!(district || '').trim()) newErrors.district = 'District is required';
    if (!(stateName || '').trim()) newErrors.stateName = 'State is required';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      const firstErrorKey = ['name', 'phone', 'address', 'district', 'stateName'].find(k => newErrors[k]);
      if (firstErrorKey && inputLayouts.current[firstErrorKey] !== undefined) {
        scrollViewRef.current?.scrollTo({ y: inputLayouts.current[firstErrorKey], animated: true });
      }
      return;
    }
    setErrors({});
    
    setIsProcessing(true);
    const { setCheckoutAddress, prepareCheckout } = useMarketplaceStore.getState();
    const checkoutAddress = {
      full_name: name,
      mobile: phone,
      address_line_1: address,
      city: district,
      state: stateName,
      pincode: '462001' // default mock pincode as it's not collected in UI yet
    };
    
    setCheckoutAddress(checkoutAddress);
    
    prepareCheckout(checkoutAddress).then((success) => {
      setIsProcessing(false);
      if (success) {
        router.push('/marketplace/payment');
      }
    });
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <MaterialCommunityIcons name="arrow-left" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Delivery Address</Text>
        <View style={{ width: 40 }} />
      </View>

      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined} 
        style={{ flex: 1 }}
      >
        <ScrollView ref={scrollViewRef} contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <TouchableOpacity style={styles.autoFillCard} onPress={handleAutoFill}>
          <LinearGradient colors={['#F0FDF4', '#DCFCE7']} style={styles.autoFillGrad}>
            <MaterialCommunityIcons name="map-marker-account-outline" size={32} color={COLORS.primary} />
            <View style={styles.autoFillTextCol}>
              <Text style={styles.autoFillTitle}>Auto-fill from Profile</Text>
              <Text style={styles.autoFillSub}>Quickly use your registered farm address</Text>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={24} color={COLORS.primary} />
          </LinearGradient>
        </TouchableOpacity>

        <View style={styles.formSection}>
          <Text style={styles.sectionTitle}>Contact Details</Text>
          <View style={styles.inputGroup} onLayout={(e) => inputLayouts.current['name'] = e.nativeEvent.layout.y}>
            <Text style={styles.label}>Full Name</Text>
            <TextInput 
              style={[styles.input, errors.name && styles.inputError]} 
              value={name} 
              onChangeText={(val) => { setName(val); setErrors(e => ({...e, name: ''})); }}
              placeholder="E.g. Your Full Name"
              placeholderTextColor="#94A3B8"
            />
            {errors.name && <Text style={styles.errorText}>{errors.name}</Text>}
          </View>
          <View style={styles.inputGroup} onLayout={(e) => inputLayouts.current['phone'] = e.nativeEvent.layout.y}>
            <Text style={styles.label}>Mobile Number</Text>
            <TextInput 
              style={[styles.input, errors.phone && styles.inputError]} 
              value={phone} 
              onChangeText={(val) => { 
                const numericVal = val.replace(/[^0-9]/g, '');
                setPhone(numericVal); 
                setErrors(e => ({...e, phone: ''})); 
              }}
              placeholder="E.g. 9876543210"
              keyboardType="numeric"
              maxLength={10}
              placeholderTextColor="#94A3B8"
            />
            {errors.phone && <Text style={styles.errorText}>{errors.phone}</Text>}
          </View>

          <Text style={[styles.sectionTitle, { marginTop: 20 }]}>Address Details</Text>
          <View style={styles.inputGroup} onLayout={(e) => inputLayouts.current['address'] = e.nativeEvent.layout.y}>
            <Text style={styles.label}>Street / Farm Address</Text>
            <TextInput 
              style={[styles.input, { height: 80, textAlignVertical: 'top' }, errors.address && styles.inputError]} 
              value={address} 
              onChangeText={(val) => { setAddress(val); setErrors(e => ({...e, address: ''})); }}
              placeholder="House no., street, nearby landmark"
              multiline
              placeholderTextColor="#94A3B8"
            />
            {errors.address && <Text style={styles.errorText}>{errors.address}</Text>}
          </View>
          <View style={styles.rowInputs}>
            <View style={[styles.inputGroup, { flex: 1, marginRight: 12 }]} onLayout={(e) => inputLayouts.current['district'] = e.nativeEvent.layout.y + 120}>
              <Text style={styles.label}>District</Text>
              <TextInput 
                style={[styles.input, errors.district && styles.inputError]} 
                value={district} 
                onChangeText={(val) => { setDistrict(val); setErrors(e => ({...e, district: ''})); }}
                placeholder="E.g. Bhopal"
                placeholderTextColor="#94A3B8"
              />
              {errors.district && <Text style={styles.errorText}>{errors.district}</Text>}
            </View>
            <View style={[styles.inputGroup, { flex: 1 }]} onLayout={(e) => inputLayouts.current['stateName'] = e.nativeEvent.layout.y + 120}>
              <Text style={styles.label}>State</Text>
              <TextInput 
                style={[styles.input, errors.stateName && styles.inputError]} 
                value={stateName} 
                onChangeText={(val) => { setStateName(val); setErrors(e => ({...e, stateName: ''})); }}
                placeholder="E.g. MP"
                placeholderTextColor="#94A3B8"
              />
              {errors.stateName && <Text style={styles.errorText}>{errors.stateName}</Text>}
            </View>
          </View>
        </View>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: 20 + insets.bottom }]}>
        <TouchableOpacity style={styles.checkoutBtn} onPress={handleProceed} disabled={isProcessing}>
          <LinearGradient colors={[COLORS.primary, COLORS.secondary]} style={styles.checkoutGrad}>
            <Text style={styles.checkoutText}>{isProcessing ? 'Validating...' : 'Proceed to Payment'}</Text>
            {!isProcessing && <MaterialCommunityIcons name="arrow-right" size={20} color="#FFF" style={{ marginLeft: 8 }} />}
          </LinearGradient>
        </TouchableOpacity>
      </View>
      </KeyboardAvoidingView>
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
  autoFillCard: {
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 24,
    ...SHADOWS.soft,
  },
  autoFillGrad: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  autoFillTextCol: {
    flex: 1,
    marginLeft: 12,
  },
  autoFillTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.primaryDark,
  },
  autoFillSub: {
    fontSize: 11,
    color: COLORS.primary,
    marginTop: 2,
  },
  formSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    ...SHADOWS.soft,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.textDark,
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textSecondary,
    marginBottom: 6,
  },
  input: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 48,
    fontSize: 14,
    color: COLORS.textDark,
  },
  inputError: {
    borderColor: COLORS.danger,
    backgroundColor: '#FEF2F2',
  },
  errorText: {
    color: COLORS.danger,
    fontSize: 11,
    marginTop: 4,
    marginLeft: 4,
  },
  rowInputs: {
    flexDirection: 'row',
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    padding: 20,
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    ...SHADOWS.soft,
  },
  checkoutBtn: {
    borderRadius: 30,
    overflow: 'hidden',
  },
  checkoutGrad: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
  },
  checkoutText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
});

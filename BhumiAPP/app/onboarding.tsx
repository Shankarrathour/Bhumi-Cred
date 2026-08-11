import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, ActivityIndicator, Alert, Dimensions, StatusBar, Animated, Platform, Pressable, Keyboard, Modal, Image } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Location from 'expo-location';
import * as Haptics from 'expo-haptics';

import { COLORS, TYPOGRAPHY, SHADOWS } from '../src/theme/theme';
import { useAuthStore } from '../src/store/authStore';
import api, { API_BASE_URL } from '../src/api/apiClient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { isValidEmail, isNonEmptyStr, isValidAadhaar, isValidPAN, isValidDate, isOnlyLettersAndSpaces, sanitizeLettersOnly } from '../src/utils/validation';
import AutocompleteDropdown from '../components/AutocompleteDropdown';
import CustomCalendarModal from '../components/CustomCalendarModal';
import { LOCATION_DATA, COUNTRIES_LIST } from '../src/data/locations';




const { width } = Dimensions.get('window');

type DocStatus = 'None' | 'Uploading' | 'Verifying' | 'Under Review' | 'Approved' | 'Rejected';

interface DocCard {
  key: string;
  title: string;
  subtitle: string;
  icon: string;
}

export default function OnboardingScreen() {
  const router = useRouter();
  
  // Zustand store
  const user = useAuthStore((state) => state.user);
  const onboardingStep = useAuthStore((state) => state.onboardingStep);
  const setOnboardingStep = useAuthStore((state) => state.setOnboardingStep);
  const updateOnboardingData = useAuthStore((state) => state.updateOnboardingData);
  const completeOnboarding = useAuthStore((state) => state.completeOnboarding);
  const fetchProfile = useAuthStore((state) => state.fetchProfile);
  const insets = useSafeAreaInsets();

  const currentStep = onboardingStep;

  // Local Form state mapped from Store or empty
  const [fullName, setFullName] = useState(user?.fullName || '');
  const [fatherName, setFatherName] = useState(user?.fatherName || '');
  const [dob, setDob] = useState(user?.dob || '');
  const [email, setEmail] = useState(user?.email || '');
  
  const [stateName, setStateName] = useState(user?.state || '');
  const [district, setDistrict] = useState(user?.district || '');
  const [village, setVillage] = useState(user?.village || '');
  const [city, setCity] = useState(user?.city || '');
  const [country, setCountry] = useState(user?.country || 'India');
  const [gramPanchayat, setGramPanchayat] = useState(user?.gramPanchayat || '');
  const [vikashKhand, setVikashKhand] = useState(user?.vikashKhand || '');
  const [fullAddress, setFullAddress] = useState(user?.fullAddress || '');
  const [tehsil, setTehsil] = useState(user?.tehsil || '');
  const [pincode, setPincode] = useState(user?.pincode || '');

  const [identityType, setIdentityType] = useState<'Aadhaar' | 'PAN'>('Aadhaar');
  const [identityNumber, setIdentityNumber] = useState('');
  const [identityVerified, setIdentityVerified] = useState(false);

  const [isCalendarVisible, setIsCalendarVisible] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [closeDropdownsTrigger, setCloseDropdownsTrigger] = useState(0);

  const [availableStates, setAvailableStates] = useState<string[]>([]);
  const [availableDistricts, setAvailableDistricts] = useState<string[]>([]);
  const [availableCities, setAvailableCities] = useState<string[]>([]);
  
  const availableVikasKhands = React.useMemo(() => district ? [`${district} Block 1`, `${district} Block 2`, `${district} Block 3`] : [], [district]);
  const availableGramPanchayats = React.useMemo(() => district ? [`${district} GP 1`, `${district} GP 2`, `${district} GP 3`] : [], [district]);
  const availableVillages = React.useMemo(() => district ? [`${district} Village 1`, `${district} Village 2`, `${district} Village 3`] : [], [district]);

  useEffect(() => {
    if (country && LOCATION_DATA[country]) {
      setAvailableStates(Object.keys(LOCATION_DATA[country]));
    } else {
      setAvailableStates([]);
    }
  }, [country]);

  useEffect(() => {
    if (country && stateName && LOCATION_DATA[country]?.[stateName]) {
      setAvailableDistricts(Object.keys(LOCATION_DATA[country][stateName]));
    } else {
      setAvailableDistricts([]);
    }
  }, [country, stateName]);

  useEffect(() => {
    if (country && stateName && district && LOCATION_DATA[country]?.[stateName]?.[district]) {
      setAvailableCities(LOCATION_DATA[country][stateName][district]);
    } else {
      setAvailableCities([]);
    }
  }, [country, stateName, district]);

  // Fetch fresh verification status from backend whenever step 4 (result screen) is shown.
  useEffect(() => {
    if (currentStep === 4) {
      fetchProfile().catch(() => {});
    }
  }, [currentStep]);

  const scrollViewRef = useRef<KeyboardAwareScrollView>(null);
  const fieldPositions = useRef<Record<string, number>>({});

  const [previewData, setPreviewData] = useState<{key: string, uri: string} | null>(null);

  const [docStates, setDocStates] = useState<Record<string, DocStatus>>({
    idProof: 'None',
    farmerPhoto: user?.farmerPhoto ? 'Approved' : 'None',
  });

  const uploadAnims = useRef<Record<string, Animated.Value>>({
    idProof: new Animated.Value(0),
    farmerPhoto: new Animated.Value(0),
  }).current;

  const triggerHaptic = (style: Haptics.ImpactFeedbackStyle) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(style);
    }
  };

  const handleImageUpload = async (key: string, mode: 'gallery' | 'camera') => {
    if (docStates[key] === 'Uploading' || docStates[key] === 'Verifying') return;

    try {
      let result;
      if (mode === 'camera') {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Permission Denied', 'Camera permission is required.');
          return;
        }
        result = await ImagePicker.launchCameraAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          quality: 0.8,
        });
      } else {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Permission Denied', 'Gallery permission is required.');
          return;
        }
        result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: false,
          quality: 0.8,
        });
      }

      if (!result.canceled && result.assets && result.assets.length > 0) {
        triggerHaptic(Haptics.ImpactFeedbackStyle.Light);
        setPreviewData({ key, uri: result.assets[0].uri });
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to pick image.');
    }
  };

  const handleUploadChoice = (key: string) => {
    Alert.alert(
      'Upload Document',
      'Choose how you want to upload',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Take Photo', onPress: () => handleImageUpload(key, 'camera') },
        { text: 'Choose from Gallery', onPress: () => handleImageUpload(key, 'gallery') },
      ],
      { cancelable: true }
    );
  };

  const confirmUpload = async (key: string, uri: string) => {
    triggerHaptic(Haptics.ImpactFeedbackStyle.Light);
    setDocStates(prev => ({ ...prev, [key]: 'Uploading' }));
    uploadAnims[key].setValue(0);

    Animated.timing(uploadAnims[key], {
      toValue: 1,
      duration: 1500,
      useNativeDriver: false,
    }).start();

    try {
      const filename = uri.split('/').pop() || 'photo.jpg';
      const formData = new FormData();
      formData.append('file', { uri, name: filename, type: 'image/jpeg' } as any);

      const accessToken = useAuthStore.getState().accessToken;
      const uploadPath = key === 'farmerPhoto' ? '/farmer/profile/photo' : '/farmer/identity/document';
      const uploadUrl = `${API_BASE_URL}${uploadPath}`;

      if (key === 'idProof') {
        const docType = identityType === 'Aadhaar' ? 'aadhaar' : 'pan';
        formData.append('document_type', docType);
      }

      console.log(`[onboarding] Native uploading via fetch to ${uploadUrl}...`);
      const response = await fetch(uploadUrl, {
        method: 'POST',
        body: formData,
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });

      if (!response.ok) {
        const errText = await response.text();
        console.log('[onboarding] Upload response error:', errText);
        throw new Error(`Upload failed with status ${response.status}`);
      }

      const resData = await response.json();
      console.log('[onboarding] Upload response:', resData);

      if (key === 'farmerPhoto') {
        const url: string | undefined = resData?.data?.url;
        if (url) updateOnboardingData({ farmerPhoto: url });
      }

      setDocStates(prev => ({ ...prev, [key]: 'Approved' }));
      setErrors(prev => ({ ...prev, [key]: '' }));
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } catch (error: any) {
      console.log('[onboarding] Upload failed:', error?.message);
      setDocStates(prev => ({ ...prev, [key]: 'None' }));
      const msg: string = error?.message || 'Upload failed. Please try again.';
      Alert.alert('Upload Error', msg);
    }
  };

  const handleNext = () => {
    triggerHaptic(Haptics.ImpactFeedbackStyle.Medium);
    setErrors({});

    if (currentStep === 1) {
      let hasError = false;
      const newErrors: Record<string, string> = {};

      if (!isNonEmptyStr(fullName, 3)) {
        newErrors.fullName = 'Min 3 chars required'; hasError = true;
      } else if (!isOnlyLettersAndSpaces(fullName)) {
        newErrors.fullName = 'Only letters and spaces are allowed.'; hasError = true;
      }

      if (!isNonEmptyStr(fatherName, 3)) {
        newErrors.fatherName = 'Min 3 chars required'; hasError = true;
      } else if (!isOnlyLettersAndSpaces(fatherName)) {
        newErrors.fatherName = 'Only letters and spaces are allowed.'; hasError = true;
      }

      if (!isValidDate(dob)) { newErrors.dob = 'Valid Date required'; hasError = true; }
      if (email && !isValidEmail(email)) { newErrors.email = 'Valid email required'; hasError = true; }

      if (hasError) {
        setErrors(newErrors);
        return;
      }
      updateOnboardingData({ fullName: fullName.trim(), fatherName: fatherName.trim(), dob, email });
      setOnboardingStep(2);
    } 
    else if (currentStep === 2) {
      let hasError = false;
      const newErrors: Record<string, string> = {};

      const lettersOnlyFields: [string, string, string][] = [
        ['country', country, 'Country'],
        ['stateName', stateName, 'State'],
        ['district', district, 'District'],
        ['city', city, 'City'],
        ['tehsil', tehsil, 'Tehsil'],
        ['gramPanchayat', gramPanchayat, 'Gram Panchayat'],
        ['vikashKhand', vikashKhand, 'Vikas Khand'],
        ['village', village, 'Village'],
      ];
      for (const [key, val, label] of lettersOnlyFields) {
        if (!isNonEmptyStr(val)) {
          newErrors[key] = `${label} required`; hasError = true;
        } else if (!isOnlyLettersAndSpaces(val)) {
          newErrors[key] = 'Only letters and spaces are allowed.'; hasError = true;
        }
      }

      if (!isNonEmptyStr(pincode)) {
        newErrors.pincode = 'PIN Code required';
        hasError = true;
      } else if (!/^[1-9][0-9]{5}$/.test(pincode)) {
        newErrors.pincode = 'PIN Code must be exactly 6 digits';
        hasError = true;
      }

      if (!isNonEmptyStr(fullAddress)) { newErrors.fullAddress = 'Address required'; hasError = true; }

      if (hasError) {
        setErrors(newErrors);
        const firstError = Object.keys(newErrors)[0];
        if (firstError && fieldPositions.current[firstError] !== undefined) {
          scrollViewRef.current?.scrollToPosition(0, Math.max(0, fieldPositions.current[firstError] - 20), true);
        }
        return;
      }
      updateOnboardingData({ 
        state: stateName, district, tehsil, village, city, country, gramPanchayat, vikashKhand, fullAddress, pincode 
      });
      setOnboardingStep(3);
    } 
    else if (currentStep === 3) {
      let hasError = false;
      const newErrors: Record<string, string> = {};
      if (!identityVerified) { newErrors.identityVerified = 'Please verify ID'; hasError = true; }
      if (docStates.farmerPhoto !== 'Approved') { newErrors.farmerPhoto = 'Photo required'; hasError = true; }
      if (identityType === 'PAN' && docStates.idProof !== 'Approved') {
        newErrors.idProof = 'PAN Photo upload is required / पैन की फोटो अपलोड करना आवश्यक है';
        hasError = true;
      }
      
      if (hasError) {
        setErrors(newErrors);
        const firstError = Object.keys(newErrors)[0];
        if (firstError && fieldPositions.current[firstError] !== undefined) {
          scrollViewRef.current?.scrollToPosition(0, Math.max(0, fieldPositions.current[firstError] - 20), true);
        }
        return;
      }
      updateOnboardingData({ identityType, identityNumber });
      completeOnboarding();
    }
  };

  const handleBack = () => {
    triggerHaptic(Haptics.ImpactFeedbackStyle.Light);
    if (currentStep > 1) {
      setOnboardingStep(currentStep - 1);
    }
  };

  const verifyIdentityNumber = () => {
    setErrors({});
    const newErrors: Record<string, string> = {};
    if (!identityNumber) {
      newErrors.identityNumber = 'Please enter your Identity Number.';
      setErrors(newErrors);
      return;
    }
    if (identityType === 'Aadhaar' && !isValidAadhaar(identityNumber)) {
      newErrors.identityNumber = 'Aadhaar must contain exactly 12 digits.';
      setErrors(newErrors);
      return;
    }
    if (identityType === 'PAN' && !isValidPAN(identityNumber)) {
      newErrors.identityNumber = 'Enter a valid PAN number.';
      setErrors(newErrors);
      return;
    }
    
    setIdentityVerified(true);
    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    Alert.alert('Verified ✅', `${identityType} verified successfully.`);
  };

  const renderDocCard = (card: DocCard) => {
    const status = docStates[card.key];
    const progressWidth = uploadAnims[card.key].interpolate({
      inputRange: [0, 1],
      outputRange: ['0%', '100%']
    });

    return (
      <View key={card.key} style={styles.uploadCard}>
        <View style={styles.uploadCardContent}>
          <View style={[styles.docIconBox, status === 'Approved' && styles.docIconBoxActive]}>
            <MaterialCommunityIcons 
              name={card.icon as any} 
              size={22} 
              color={status === 'Approved' ? COLORS.primary : '#64748B'} 
            />
          </View>
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={styles.uploadTitle}>{card.title}</Text>
            <Text style={styles.uploadSub}>{card.subtitle}</Text>
            
            {status === 'Uploading' && (
              <View style={styles.progressContainer}>
                <View style={styles.progressBarBg}>
                  <Animated.View style={[styles.progressBarFillLocal, { width: progressWidth }]} />
                </View>
                <Text style={styles.progressStatusText}>Uploading...</Text>
              </View>
            )}

            {status === 'Verifying' && (
              <View style={styles.verifyingContainer}>
                <ActivityIndicator size="small" color={COLORS.primary} style={{ marginRight: 6 }} />
                <Text style={styles.verifyingText}>OCR AI Verifying...</Text>
              </View>
            )}

            {status === 'Approved' && (
              <View style={styles.approvedIndicator}>
                <MaterialCommunityIcons name="checkbox-marked-circle-outline" size={14} color={COLORS.success} />
                <Text style={styles.approvedText}>Documents Mapped & Approved</Text>
              </View>
            )}
          </View>

          <TouchableOpacity 
            style={[
              styles.uploadActionBtn,
              status === 'Approved' && styles.uploadActionBtnActive,
              status === 'Verifying' && { opacity: 0.5 }
            ]} 
            onPress={() => handleUploadChoice(card.key)}
            disabled={status === 'Verifying' || status === 'Uploading'}
            accessibilityRole="button"
          >
            <MaterialCommunityIcons 
              name={status === 'Approved' ? "check" : "cloud-upload-outline"} 
              size={20} 
              color={status === 'Approved' ? '#FFFFFF' : COLORS.primary} 
            />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F4FDF9" />
      
      {/* Top Banner Step Bar */}
      {currentStep < 4 && (
        <View style={[styles.stepperContainer, { paddingTop: insets.top > 0 ? insets.top + 14 : (Platform.OS === 'ios' ? 60 : 40) }]}>
          <TouchableOpacity onPress={handleBack} disabled={currentStep === 1} style={styles.backArrow}>
            <MaterialCommunityIcons 
              name="chevron-left" 
              size={24} 
              color={currentStep === 1 ? '#CBD5E1' : COLORS.primary} 
            />
          </TouchableOpacity>
          <View style={styles.progressWrapper}>
            <Text style={styles.stepTitle}>Step {currentStep} of 3</Text>
            <View style={styles.progressBarBg}>
              <View style={[styles.progressBarFill, { width: `${(currentStep / 3) * 100}%` }]} />
            </View>
          </View>
          <View style={{ width: 24 }} />
        </View>
      )}

      <KeyboardAwareScrollView 
        ref={scrollViewRef}
        contentContainerStyle={{ paddingBottom: 40, flexGrow: 1, justifyContent: currentStep === 4 ? 'center' : 'flex-start' }} 
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        enableOnAndroid={true}
        extraScrollHeight={60}
      >
        {/* STEP 1: Personal Details */}
        {currentStep === 1 && (
          <View style={styles.stepCard}>
            <Text style={styles.heading}>Personal Details / व्यक्तिगत विवरण</Text>
            <Text style={styles.subheading}>Tell us about yourself to register your green identity.</Text>
            
            <View style={styles.formField} onLayout={(e) => fieldPositions.current['fullName'] = e.nativeEvent.layout.y}>
              <Text style={styles.label}>Full Name / पूरा नाम *</Text>
              <TextInput style={[styles.input, errors.fullName && styles.inputError]} placeholder="e.g. Your Full Name" placeholderTextColor="#64748B" value={fullName} onChangeText={(val) => { setFullName(sanitizeLettersOnly(val)); setErrors(prev => ({ ...prev, fullName: '' })); }} />
              {errors.fullName && <Text style={styles.errorText}>{errors.fullName}</Text>}
            </View>
            <View style={styles.formField} onLayout={(e) => fieldPositions.current['fatherName'] = e.nativeEvent.layout.y}>
              <Text style={styles.label}>Father&apos;s Name / पिता का नाम *</Text>
              <TextInput style={[styles.input, errors.fatherName && styles.inputError]} placeholder="e.g. Hari Ram Kumar" placeholderTextColor="#64748B" value={fatherName} onChangeText={(val) => { setFatherName(sanitizeLettersOnly(val)); setErrors(prev => ({ ...prev, fatherName: '' })); }} />
              {errors.fatherName && <Text style={styles.errorText}>{errors.fatherName}</Text>}
            </View>
            <View style={styles.formField} onLayout={(e) => fieldPositions.current['dob'] = e.nativeEvent.layout.y}>
              <Text style={styles.label}>Date of Birth / जन्म तिथि *</Text>
              <TouchableOpacity 
                style={[styles.input, { justifyContent: 'center' }, errors.dob && styles.inputError]} 
                onPress={() => { 
                  Keyboard.dismiss();
                  setIsCalendarVisible(true); 
                  setErrors(prev => ({ ...prev, dob: '' })); 
                }}
                activeOpacity={0.8}
              >
                <Text style={{ color: dob ? COLORS.textDark : '#94A3B8' }}>{dob || 'DD/MM/YYYY'}</Text>
              </TouchableOpacity>
              {errors.dob && <Text style={styles.errorText}>{errors.dob}</Text>}
            </View>
            <View style={styles.formField} onLayout={(e) => fieldPositions.current['email'] = e.nativeEvent.layout.y}>
              <Text style={styles.label}>Email Address / ईमेल पता (Optional)</Text>
              <TextInput style={[styles.input, errors.email && styles.inputError]} placeholder="e.g. farmer@email.com" placeholderTextColor="#64748B" value={email} onChangeText={(val) => { setEmail(val); setErrors(prev => ({ ...prev, email: '' })); }} autoCapitalize="none" />
              {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}
            </View>
          </View>
        )}

        {/* STEP 2: Address */}
        {currentStep === 2 && (
          <Pressable style={{ flex: 1 }} onPress={() => { Keyboard.dismiss(); setCloseDropdownsTrigger(prev => prev + 1); }}>
            <View style={styles.stepCard}>
              <Text style={styles.heading}>Address / पते का विवरण</Text>
              <Text style={styles.subheading}>Specify farm district locations to calculate carbon indices.</Text>
              
              <View style={[styles.dualInputsRow, { zIndex: 10 }]}>
                <View style={[styles.formField, { flex: 1, marginRight: 10, zIndex: 10 }]} onLayout={(e) => fieldPositions.current['country'] = e.nativeEvent.layout.y}>
                  <Text style={styles.label}>Country / देश *</Text>
                  <AutocompleteDropdown data={COUNTRIES_LIST} value={country} onChangeText={(val) => { setCountry(sanitizeLettersOnly(val)); setStateName(''); setDistrict(''); setCity(''); setErrors(prev => ({ ...prev, country: '' })); }} placeholder="e.g. India" style={errors.country ? styles.inputError : {}} closeTrigger={closeDropdownsTrigger} />
                  {errors.country && <Text style={styles.errorText}>{errors.country}</Text>}
                </View>
                <View style={[styles.formField, { flex: 1, zIndex: 10 }]} onLayout={(e) => fieldPositions.current['stateName'] = e.nativeEvent.layout.y}>
                  <Text style={styles.label}>State / राज्य *</Text>
                  <AutocompleteDropdown data={availableStates} value={stateName} onChangeText={(val) => { setStateName(sanitizeLettersOnly(val)); setDistrict(''); setCity(''); setErrors(prev => ({ ...prev, stateName: '' })); }} placeholder="e.g. Madhya Pradesh" style={errors.stateName ? styles.inputError : {}} closeTrigger={closeDropdownsTrigger} />
                  {errors.stateName && <Text style={styles.errorText}>{errors.stateName}</Text>}
                </View>
              </View>

              <View style={[styles.dualInputsRow, { zIndex: 9 }]}>
                <View style={[styles.formField, { flex: 1, marginRight: 10, zIndex: 9 }]} onLayout={(e) => fieldPositions.current['district'] = e.nativeEvent.layout.y}>
                  <Text style={styles.label}>District / जिला *</Text>
                  <AutocompleteDropdown data={availableDistricts} value={district} onChangeText={(val) => { setDistrict(sanitizeLettersOnly(val)); setCity(''); setErrors(prev => ({ ...prev, district: '' })); }} placeholder="e.g. Sehore" style={errors.district ? styles.inputError : {}} closeTrigger={closeDropdownsTrigger} />
                  {errors.district && <Text style={styles.errorText}>{errors.district}</Text>}
                </View>
                <View style={[styles.formField, { flex: 1, zIndex: 9 }]} onLayout={(e) => fieldPositions.current['city'] = e.nativeEvent.layout.y}>
                  <Text style={styles.label}>City / शहर *</Text>
                  <AutocompleteDropdown data={availableCities} value={city} onChangeText={(val) => { setCity(sanitizeLettersOnly(val)); setErrors(prev => ({ ...prev, city: '' })); }} placeholder="e.g. Bhopal" style={errors.city ? styles.inputError : {}} closeTrigger={closeDropdownsTrigger} />
                  {errors.city && <Text style={styles.errorText}>{errors.city}</Text>}
                </View>
              </View>

              <View style={[styles.dualInputsRow, { zIndex: 8 }]}>
                <View style={[styles.formField, { flex: 1, marginRight: 10, zIndex: 8 }]} onLayout={(e) => fieldPositions.current['gramPanchayat'] = e.nativeEvent.layout.y}>
                  <Text style={styles.label}>Gram Panchayat / ग्राम पंचायत *</Text>
                  <AutocompleteDropdown data={availableGramPanchayats} value={gramPanchayat} onChangeText={(val) => { setGramPanchayat(sanitizeLettersOnly(val)); setErrors(prev => ({ ...prev, gramPanchayat: '' })); }} placeholder="Panchayat" closeTrigger={closeDropdownsTrigger} style={errors.gramPanchayat ? styles.inputError : {}} />
                  {errors.gramPanchayat && <Text style={styles.errorText}>{errors.gramPanchayat}</Text>}
                </View>
                <View style={[styles.formField, { flex: 1, zIndex: 8 }]} onLayout={(e) => fieldPositions.current['vikashKhand'] = e.nativeEvent.layout.y}>
                  <Text style={styles.label}>Vikas Khand / विकास खंड *</Text>
                  <AutocompleteDropdown data={availableVikasKhands} value={vikashKhand} onChangeText={(val) => { setVikashKhand(sanitizeLettersOnly(val)); setErrors(prev => ({ ...prev, vikashKhand: '' })); }} placeholder="Vikash Khand" closeTrigger={closeDropdownsTrigger} style={errors.vikashKhand ? styles.inputError : {}} />
                  {errors.vikashKhand && <Text style={styles.errorText}>{errors.vikashKhand}</Text>}
                </View>
              </View>

              <View style={[styles.formField, { zIndex: 7 }]} onLayout={(e) => fieldPositions.current['village'] = e.nativeEvent.layout.y}>
                <Text style={styles.label}>Village / गांव *</Text>
                <AutocompleteDropdown data={availableVillages} value={village} onChangeText={(val) => { setVillage(sanitizeLettersOnly(val)); setErrors(prev => ({ ...prev, village: '' })); }} placeholder="Village name" closeTrigger={closeDropdownsTrigger} style={errors.village ? styles.inputError : {}} />
                {errors.village && <Text style={styles.errorText}>{errors.village}</Text>}
              </View>

              <View style={[styles.dualInputsRow, { zIndex: 6 }]}>
                <View style={[styles.formField, { flex: 1, marginRight: 10 }]} onLayout={(e) => fieldPositions.current['tehsil'] = e.nativeEvent.layout.y}>
                  <Text style={styles.label}>Tehsil / तहसील *</Text>
                  <TextInput style={[styles.input, errors.tehsil && styles.inputError]} placeholder="e.g. Jaithari" placeholderTextColor="#64748B" value={tehsil} onChangeText={(val) => { setTehsil(sanitizeLettersOnly(val)); setErrors(prev => ({ ...prev, tehsil: '' })); }} />
                  {errors.tehsil && <Text style={styles.errorText}>{errors.tehsil}</Text>}
                </View>
                <View style={[styles.formField, { flex: 1 }]} onLayout={(e) => fieldPositions.current['pincode'] = e.nativeEvent.layout.y}>
                  <Text style={styles.label}>PIN Code / पिनकोड *</Text>
                  <TextInput style={[styles.input, errors.pincode && styles.inputError]} placeholder="e.g. 484224" placeholderTextColor="#64748B" value={pincode} onChangeText={(val) => { setPincode(val.replace(/[^0-9]/g, '')); setErrors(prev => ({ ...prev, pincode: '' })); }} keyboardType="numeric" maxLength={6} />
                  {errors.pincode && <Text style={styles.errorText}>{errors.pincode}</Text>}
                </View>
              </View>

              <View style={styles.formField} onLayout={(e) => fieldPositions.current['fullAddress'] = e.nativeEvent.layout.y}>
                <Text style={styles.label}>Full Address / पूरा पता *</Text>
                <TextInput style={[styles.input, { height: 80 }, errors.fullAddress && styles.inputError]} multiline numberOfLines={3} placeholder="House no, Street name, Land boundaries" placeholderTextColor="#64748B" value={fullAddress} onChangeText={(val) => { setFullAddress(val); setErrors(prev => ({ ...prev, fullAddress: '' })); }} />
                {errors.fullAddress && <Text style={styles.errorText}>{errors.fullAddress}</Text>}
              </View>
            </View>
          </Pressable>
        )}

        {/* STEP 3: Identity & Photo KYC */}
        {currentStep === 3 && (
          <View style={styles.stepCard}>
            <Text style={styles.heading}>Documents Mapping / दस्तावेज सत्यापन</Text>
            <Text style={styles.subheading}>Verify your identity to secure government benefits and carbon payouts.</Text>
            
            <View style={styles.formField} onLayout={(e) => fieldPositions.current['identityVerified'] = e.nativeEvent.layout.y}>
              <Text style={styles.label}>Select Identity Type / पहचान पत्र *</Text>
              <View style={{ flexDirection: 'row', marginBottom: 12 }}>
                <TouchableOpacity 
                  style={[styles.radioBtn, identityType === 'Aadhaar' && styles.radioBtnActive]}
                  onPress={() => {
                    setIdentityType('Aadhaar');
                    setIdentityVerified(false);
                    setDocStates(prev => ({ ...prev, idProof: 'None' }));
                    setErrors(prev => ({ ...prev, idProof: '', identityNumber: '', identityVerified: '' }));
                  }}
                >
                  <Text style={[styles.radioText, identityType === 'Aadhaar' && styles.radioTextActive]}>Aadhaar Card</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.radioBtn, identityType === 'PAN' && styles.radioBtnActive, { marginLeft: 10 }]}
                  onPress={() => {
                    setIdentityType('PAN');
                    setIdentityVerified(false);
                    setDocStates(prev => ({ ...prev, idProof: 'None' }));
                    setErrors(prev => ({ ...prev, idProof: '', identityNumber: '', identityVerified: '' }));
                  }}
                >
                  <Text style={[styles.radioText, identityType === 'PAN' && styles.radioTextActive]}>PAN Card</Text>
                </TouchableOpacity>
              </View>
              
              <Text style={styles.label}>{identityType} Number / {identityType} नंबर *</Text>
              <View style={styles.idInputWrapper}>
                <TextInput 
                  style={[styles.input, { flex: 1, marginBottom: 0 }, errors.identityNumber && styles.inputError]} 
                  placeholder={identityType === 'Aadhaar' ? "12-digit Aadhaar" : "10-char PAN"} 
                  placeholderTextColor="#64748B"
                  value={identityNumber} 
                  onChangeText={(val) => {
                    const formattedVal = identityType === 'PAN'
                      ? val.toUpperCase().replace(/[^A-Z0-9]/g, '')
                      : val.replace(/[^0-9]/g, '');
                    setIdentityNumber(formattedVal);
                    setIdentityVerified(false);
                    setErrors(prev => ({ ...prev, identityNumber: '' }));
                  }}
                  maxLength={identityType === 'Aadhaar' ? 12 : 10}
                  autoCapitalize={identityType === 'PAN' ? "characters" : "none"}
                  keyboardType={identityType === 'Aadhaar' ? "numeric" : "default"}
                />
                <TouchableOpacity 
                  style={[styles.verifyBtn, identityVerified && styles.verifyBtnSuccess]}
                  onPress={verifyIdentityNumber}
                  disabled={identityVerified}
                >
                  <Text style={styles.verifyBtnText}>{identityVerified ? 'Verified' : 'Verify'}</Text>
                </TouchableOpacity>
              </View>
              {errors.identityNumber && <Text style={styles.errorText}>{errors.identityNumber}</Text>}
              {errors.identityVerified && <Text style={styles.errorText}>{errors.identityVerified}</Text>}
              {errors.farmerPhoto && <Text style={styles.errorText}>{errors.farmerPhoto}</Text>}
            </View>

            <View onLayout={(e) => fieldPositions.current['idProof'] = e.nativeEvent.layout.y}>
              {renderDocCard({ 
                key: 'idProof', 
                title: identityType === 'PAN' ? 'PAN Photo / पैन की फोटो *' : `${identityType} Photo (Optional)`, 
                subtitle: 'Upload physical copy image', 
                icon: 'credit-card-outline' 
              })}
              {errors.idProof && <Text style={styles.errorText}>{errors.idProof}</Text>}
            </View>

            <View onLayout={(e) => fieldPositions.current['farmerPhoto'] = e.nativeEvent.layout.y}>
              {renderDocCard({ 
                key: 'farmerPhoto', 
                title: 'Farmer Photo / किसान की फोटो *', 
                subtitle: 'Live capture or gallery picture', 
                icon: 'camera-outline' 
              })}
            </View>
          </View>
        )}

        {/* STEP 4: Verification Result Screen — content driven by real backend status */}
        {currentStep === 4 && (() => {
          const vs = user?.verificationStatus;
          const isApproved = vs === 'approved';
          const isRejected = vs === 'rejected';
          const displayName = user?.fullName || fullName;
          const iconName = isApproved ? 'check-decagram' : isRejected ? 'close-circle' : 'clock-fast';
          const iconColor = isApproved ? COLORS.success : isRejected ? '#EF4444' : COLORS.primary;
          const iconBg = isRejected ? '#FEF2F2' : '#ECFDF5';
          const headingColor = isApproved ? COLORS.success : isRejected ? '#EF4444' : COLORS.primary;
          const heading = isApproved
            ? 'Verification Approved / सत्यापन स्वीकृत'
            : isRejected
            ? 'Verification Rejected / सत्यापन अस्वीकृत'
            : 'Verification Pending / सत्यापन लंबित है';

          return (
            <View style={styles.successContainer}>
              <View style={[styles.successIconBox, { backgroundColor: iconBg }]}>
                <MaterialCommunityIcons name={iconName as any} size={54} color={iconColor} />
              </View>
              <Text style={[styles.successHeading, { color: headingColor }]}>{heading}</Text>
              {isApproved ? (
                <Text style={styles.successDesc}>
                  Congratulations {displayName}!{'\n\n'}Your agricultural profile and identity verification have been successfully approved by the BhumiCred team.{'\n\n'}You now have full access to all BhumiCred services and features.
                </Text>
              ) : isRejected ? (
                <Text style={styles.successDesc}>
                  Dear {displayName},{'\n\n'}Your submitted verification details could not be approved during review.{'\n\n'}Please review your uploaded information and resubmit the required documents.
                </Text>
              ) : (
                <Text style={styles.successDesc}>
                  Thank you {displayName}! Your agricultural profile and identity details have been successfully uploaded to the BhumiCred registry.
                </Text>
              )}

              <View style={styles.reviewList}>
                <View style={styles.reviewItem}>
                  <MaterialCommunityIcons name="check" size={16} color={COLORS.success} />
                  <Text style={styles.reviewText}>KYC Identity Handshake: Verified</Text>
                </View>
                {isApproved ? (
                  <View style={styles.reviewItem}>
                    <MaterialCommunityIcons name="check-circle" size={16} color={COLORS.success} />
                    <Text style={styles.reviewText}>Profile Status: Approved</Text>
                  </View>
                ) : isRejected ? (
                  <View style={styles.reviewItem}>
                    <MaterialCommunityIcons name="close-circle" size={16} color="#EF4444" />
                    <Text style={styles.reviewText}>Profile Status: Rejected</Text>
                  </View>
                ) : (
                  <View style={styles.reviewItem}>
                    <MaterialCommunityIcons name="alert-circle-outline" size={16} color={COLORS.warning} />
                    <Text style={styles.reviewText}>Profile Under Review (Est 15 mins)</Text>
                  </View>
                )}
              </View>

              <TouchableOpacity style={styles.homeBtn} onPress={() => router.replace('/(tabs)')} activeOpacity={0.85}>
                <LinearGradient colors={[COLORS.primary, COLORS.secondary]} style={styles.homeGrad}>
                  <Text style={styles.homeBtnText}>Go to Home Dashboard / होम डेशबोर्ड</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          );
        })()}

        {/* CTA Stepper button triggers (Only step 1 to 3) */}
        {currentStep < 4 && (
          <TouchableOpacity style={styles.actionBtn} onPress={handleNext} activeOpacity={0.9}>
            <LinearGradient colors={[COLORS.primary, COLORS.secondary]} style={styles.actionBtnGrad}>
              <Text style={styles.actionBtnLabel}>Continue / आगे बढ़ें</Text>
              <MaterialCommunityIcons name="arrow-right" size={20} color="#FFFFFF" style={{ marginLeft: 8 }} />
            </LinearGradient>
          </TouchableOpacity>
        )}

      </KeyboardAwareScrollView>

      <CustomCalendarModal 
        visible={isCalendarVisible} 
        onClose={() => setIsCalendarVisible(false)} 
        onSelectDate={setDob} 
        initialDate={dob} 
      />

      <Modal visible={!!previewData} transparent={true} animationType="slide">
        <View style={styles.previewModalContainer}>
          <View style={styles.previewHeader}>
            <Text style={styles.previewTitle}>Image Preview</Text>
          </View>
          <View style={styles.previewImageWrapper}>
            {previewData?.uri && (
              <Image source={{ uri: previewData.uri }} style={styles.previewImage} resizeMode="contain" />
            )}
          </View>
          <View style={[styles.previewFooter, { paddingBottom: 24 + insets.bottom }]}>
            <TouchableOpacity style={styles.previewCancelBtn} onPress={() => setPreviewData(null)}>
              <Text style={styles.previewCancelText}>Retake</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.previewUploadBtn} onPress={() => {
              if (previewData) {
                const { key, uri } = previewData;
                setPreviewData(null);
                confirmUpload(key, uri);
              }
            }}>
              <Text style={styles.previewUploadText}>Upload Photo</Text>
              <MaterialCommunityIcons name="cloud-upload" size={18} color="#FFFFFF" style={{ marginLeft: 6 }} />
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F4FDF9',
  },
  stepperContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderColor: '#E2E8F0',
  },
  backArrow: {
    padding: 6,
    borderRadius: 10,
  },
  progressWrapper: {
    flex: 1,
    paddingHorizontal: 16,
  },
  stepTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.primary,
    textAlign: 'center',
    marginBottom: 4,
  },
  progressBarBg: {
    height: 6,
    borderRadius: 3,
    backgroundColor: '#E2E8F0',
    width: '100%',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 3,
    backgroundColor: COLORS.accent, // Lime accent
  },
  scrollArea: {
    paddingHorizontal: 20,
    paddingVertical: 24,
  },
  stepCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24,
    ...SHADOWS.soft,
    marginBottom: 24,
  },
  heading: {
    ...TYPOGRAPHY.h2,
    color: COLORS.primaryDark,
    fontWeight: '800',
    marginBottom: 6,
  },
  subheading: {
    fontSize: 13,
    color: COLORS.textSecondary,
    lineHeight: 18,
    marginBottom: 24,
  },
  formField: {
    marginBottom: 16,
  },
  radioBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
  },
  radioBtnActive: {
    borderColor: COLORS.primary,
    backgroundColor: '#E6F4EA',
  },
  radioText: {
    fontSize: 13,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  radioTextActive: {
    color: COLORS.primary,
    fontWeight: '800',
  },
  idInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  verifyBtn: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 16,
    height: 48,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  verifyBtnSuccess: {
    backgroundColor: COLORS.success,
  },
  verifyBtnText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 13,
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textDark,
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 14,
    color: COLORS.textDark,
    fontWeight: '600',
  },
  inputError: {
    borderColor: '#EF4444',
  },
  errorText: {
    color: '#EF4444',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 6,
    marginLeft: 4,
  },
  dualInputsRow: {
    flexDirection: 'row',
  },
  uploadCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    padding: 14,
    marginBottom: 14,
  },
  uploadCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  docIconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#E2E8F0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  docIconBoxActive: {
    backgroundColor: '#E6F4EA',
  },
  uploadTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.textDark,
  },
  uploadSub: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  uploadActionBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
    ...SHADOWS.soft,
  },
  uploadActionBtnActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  progressContainer: {
    marginTop: 8,
    width: '100%',
  },
  progressBarFillLocal: {
    height: '100%',
    backgroundColor: COLORS.primary,
    borderRadius: 2,
  },
  progressStatusText: {
    fontSize: 9,
    fontWeight: '700',
    color: COLORS.primary,
    marginTop: 4,
  },
  verifyingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  verifyingText: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.primary,
  },
  approvedIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  approvedText: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.success,
    marginLeft: 4,
  },
  gpsCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
  },
  gpsTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.primary,
  },
  gpsSub: {
    fontSize: 11,
    color: COLORS.secondary,
    marginTop: 2,
    fontWeight: '600',
  },
  gpsBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOWS.soft,
  },
  warningNote: {
    flexDirection: 'row',
    backgroundColor: '#FEF3C7',
    borderRadius: 16,
    padding: 16,
    marginTop: 10,
    alignItems: 'center',
  },
  warningText: {
    flex: 1,
    fontSize: 11,
    color: '#D97706',
    fontWeight: '700',
    marginLeft: 10,
    lineHeight: 15,
  },
  adminFastText: {
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: '700',
    textAlign: 'center',
  },
  previewModalContainer: {
    flex: 1,
    backgroundColor: '#000000',
    justifyContent: 'space-between',
  },
  previewHeader: {
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 20,
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  previewTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
  previewImageWrapper: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  previewFooter: {
    flexDirection: 'row',
    padding: 24,
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  previewCancelBtn: {
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
  previewCancelText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  previewUploadBtn: {
    backgroundColor: COLORS.primary,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 30,
    ...SHADOWS.soft,
  },
  previewUploadText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },
  actionBtn: {
    borderRadius: 30,
    overflow: 'hidden',
    ...SHADOWS.glow,
  },
  actionBtnGrad: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
  },
  actionBtnLabel: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },
  successContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 28,
    padding: 24,
    alignItems: 'center',
    ...SHADOWS.soft,
  },
  successIconBox: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: '#ECFDF5',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 20,
  },
  successHeading: {
    ...TYPOGRAPHY.h2,
    color: COLORS.primary,
    fontWeight: '900',
    textAlign: 'center',
    marginBottom: 10,
  },
  successDesc: {
    fontSize: 13,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 24,
  },
  reviewList: {
    width: '100%',
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    padding: 16,
    marginBottom: 32,
  },
  reviewItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  reviewText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textDark,
    marginLeft: 8,
  },
  homeBtn: {
    width: '100%',
    borderRadius: 30,
    overflow: 'hidden',
  },
  homeGrad: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  homeBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
  adminFastBtn: {
    marginTop: 20,
    padding: 10,
  },
});

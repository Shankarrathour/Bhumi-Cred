import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, ActivityIndicator, Alert, StatusBar, Animated, Platform, Pressable, Keyboard, Modal, Image } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import * as ImagePicker from 'expo-image-picker';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Location from 'expo-location';
import * as Haptics from 'expo-haptics';

import { COLORS, TYPOGRAPHY, SHADOWS } from '../../src/theme/theme';
import { useAuthStore } from '../../src/store/authStore';
import { useLandStore } from '../../src/store/landStore';
import api from '../../src/api/apiClient';
import AutocompleteDropdown from '../../components/AutocompleteDropdown';
import { isNonEmptyStr } from '../../src/utils/validation';
import { LOCATION_DATA, COUNTRIES_LIST } from '../../src/data/locations';

// Mock lists for the text inputs just in case they want to convert them to dropdowns later, but for now we keep them as inputs since there's no data structure for them. Or actually, let's keep them as inputs but they will just be text fields as before.

type DocStatus = 'None' | 'Uploading' | 'Verifying' | 'Approved';

interface DocCard {
  key: string;
  title: string;
  subtitle: string;
  icon: string;
  mandatory?: boolean;
  isSquare?: boolean;
}

export default function AddLandScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const user = useAuthStore((state) => state.user);
  const addPlot = useLandStore((state) => state.addPlot);

  const [currentStep, setCurrentStep] = useState(1);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // New Fields
  const [belongsToAnother, setBelongsToAnother] = useState(false);
  const [fathersName, setFathersName] = useState(user?.fatherName || '');
  const [mobileNumber, setMobileNumber] = useState(user?.mobile || '');
  
  const [treeStockCount, setTreeStockCount] = useState('');
  const [plantationArea, setPlantationArea] = useState('');
  const [agroforestrySpecies, setAgroforestrySpecies] = useState('');
  const [cropSelection, setCropSelection] = useState('');
  const [soilComposition, setSoilComposition] = useState('');
  const [waterAvailability, setWaterAvailability] = useState('');

  // Form State
  const [acres, setAcres] = useState('');
  const [stateName, setStateName] = useState(user?.state || '');
  const [district, setDistrict] = useState(user?.district || '');
  const [village, setVillage] = useState(user?.village || '');
  const [city, setCity] = useState(user?.city || '');
  const [country, setCountry] = useState(user?.country || 'India');
  const [gramPanchayat, setGramPanchayat] = useState(user?.gramPanchayat || '');
  const [vikashKhand, setVikashKhand] = useState(user?.vikashKhand || '');
  const [fullAddress, setFullAddress] = useState(user?.fullAddress || '');
  const [landmark, setLandmark] = useState('');

  const [geoCoords, setGeoCoords] = useState<{ latitude: number; longitude: number } | null>(null);
  const [boundaryPolygon, setBoundaryPolygon] = useState<any[]>([]);
  const [gpsLoading, setGpsLoading] = useState(false);

  // Document States
  const [docStates, setDocStates] = useState<Record<string, DocStatus>>({
    landProof: 'None',
    soilCard: 'None',
    photo1: 'None',
    photo2: 'None',
    photo3: 'None',
    photo4: 'None',
  });

  const scrollViewRef = useRef<KeyboardAwareScrollView>(null);
  const fieldPositions = useRef<Record<string, number>>({});
  const [closeDropdownsTrigger, setCloseDropdownsTrigger] = useState(0);
  const [previewData, setPreviewData] = useState<{ uri: string, docKey: string } | null>(null);
  const [showNextStepsModal, setShowNextStepsModal] = useState(false);
  const [landDocumentUrl, setLandDocumentUrl] = useState<string | null>(null);
  const [photoUrls, setPhotoUrls] = useState<Record<string, string>>({});

  const [availableStates, setAvailableStates] = useState<string[]>([]);
  const [availableDistricts, setAvailableDistricts] = useState<string[]>([]);
  const [availableCities, setAvailableCities] = useState<string[]>([]);
  
  const availableVikasKhands = React.useMemo(() => district ? [`${district} Block 1`, `${district} Block 2`, `${district} Block 3`] : [], [district]);
  const availableGramPanchayats = React.useMemo(() => district ? [`${district} GP 1`, `${district} GP 2`, `${district} GP 3`] : [], [district]);
  const availableVillages = React.useMemo(() => district ? [`${district} Village 1`, `${district} Village 2`, `${district} Village 3`] : [], [district]);

  React.useEffect(() => {
    if (country && LOCATION_DATA[country]) {
      setAvailableStates(Object.keys(LOCATION_DATA[country]));
    } else {
      setAvailableStates([]);
    }
  }, [country]);

  React.useEffect(() => {
    if (country && stateName && LOCATION_DATA[country]?.[stateName]) {
      setAvailableDistricts(Object.keys(LOCATION_DATA[country][stateName]));
    } else {
      setAvailableDistricts([]);
    }
  }, [country, stateName]);

  React.useEffect(() => {
    if (country && stateName && district && LOCATION_DATA[country]?.[stateName]?.[district]) {
      setAvailableCities(LOCATION_DATA[country][stateName][district]);
    } else {
      setAvailableCities([]);
    }
  }, [country, stateName, district]);

  const uploadAnims = useRef<Record<string, Animated.Value>>({
    landProof: new Animated.Value(0),
    soilCard: new Animated.Value(0),
    photo1: new Animated.Value(0),
    photo2: new Animated.Value(0),
    photo3: new Animated.Value(0),
    photo4: new Animated.Value(0),
  }).current;

  const triggerHaptic = (style: Haptics.ImpactFeedbackStyle) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(style);
    }
  };

  const handleFetchGPS = async () => {
    triggerHaptic(Haptics.ImpactFeedbackStyle.Light);
    setGpsLoading(true);

    const addSimulatedPoint = (alertTitle: string, alertMessage: string) => {
      const simulated = {
        latitude: 22.9712 + boundaryPolygon.length * 0.0004,
        longitude: 78.6514 + boundaryPolygon.length * 0.0004,
      };
      setGeoCoords(simulated);
      setBoundaryPolygon(prev => [...prev, simulated]);
      Alert.alert(alertTitle, alertMessage);
    };

    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        addSimulatedPoint(
          'Simulated GPS Coords ✅',
          'GPS permission was not granted, so a simulated boundary point was used instead. Enable Location Services for real GPS mapping.',
        );
        setGpsLoading(false);
        return;
      }
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Highest });
      const point = { latitude: loc.coords.latitude, longitude: loc.coords.longitude };
      setGeoCoords(point);
      setBoundaryPolygon(prev => [...prev, point]);
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      Alert.alert('Boundary Point Captured ✅', `Point ${boundaryPolygon.length + 1} marked at Lat ${point.latitude.toFixed(4)}, Lon ${point.longitude.toFixed(4)}. Walk to the next corner and tap again to continue mapping the boundary.`);
    } catch (e: any) {
      addSimulatedPoint(
        'Simulated GPS Coords ✅',
        'Failed to fetch real GPS coordinates, so a simulated boundary point was used instead. Please make sure your device Location Services are turned on and try again.',
      );
    } finally {
      setGpsLoading(false);
    }
  };

  // NOTE: soilCard remains a client-side-only simulation for now.
  const handleSimulateUpload = (key: string) => {
    if (docStates[key] === 'Uploading' || docStates[key] === 'Verifying') return;

    triggerHaptic(Haptics.ImpactFeedbackStyle.Light);
    setDocStates(prev => ({ ...prev, [key]: 'Uploading' }));
    uploadAnims[key].setValue(0);

    Animated.timing(uploadAnims[key], {
      toValue: 1,
      duration: 1500,
      useNativeDriver: false,
    }).start(() => {
      setDocStates(prev => ({ ...prev, [key]: 'Verifying' }));
      setTimeout(() => {
        setDocStates(prev => ({ ...prev, [key]: 'Approved' }));
        if (Platform.OS !== 'web') {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }
      }, 1000);
    });
  };

  const handlePhotoUpload = async (docKey: string, uri: string) => {
    if (docStates[docKey] === 'Uploading' || docStates[docKey] === 'Verifying') return;

    triggerHaptic(Haptics.ImpactFeedbackStyle.Light);
    setDocStates(prev => ({ ...prev, [docKey]: 'Uploading' }));
    uploadAnims[docKey].setValue(0);
    Animated.timing(uploadAnims[docKey], {
      toValue: 1,
      duration: 1500,
      useNativeDriver: false,
    }).start();

    try {
      const filename = uri.split('/').pop() || `${docKey}.jpg`;
      const formData = new FormData();
      formData.append('file', { uri, name: filename, type: 'image/jpeg' } as any);
      const res = await api.post('/farmer/profile/land/document', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const url: string | undefined = res.data?.data?.url;
      setDocStates(prev => ({ ...prev, [docKey]: 'Verifying' }));
      setTimeout(() => {
        if (url) {
          if (docKey === 'landProof') {
            setLandDocumentUrl(url);
          } else {
            setPhotoUrls(prev => ({ ...prev, [docKey]: url }));
          }
          setDocStates(prev => ({ ...prev, [docKey]: 'Approved' }));
          if (Platform.OS !== 'web') {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          }
        } else {
          setDocStates(prev => ({ ...prev, [docKey]: 'None' }));
          Alert.alert('Upload Error', 'Upload succeeded but no URL was returned.');
        }
      }, 1000);
    } catch (error: any) {
      setDocStates(prev => ({ ...prev, [docKey]: 'None' }));
      const msg: string = error?.response?.data?.message || 'Upload failed. Please try again.';
      Alert.alert('Upload Error', msg);
    }
  };

  const handleImageUpload = async (docKey: string, mode: 'gallery' | 'camera') => {
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
          quality: 0.8,
        });
      }

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setPreviewData({ uri: result.assets[0].uri, docKey });
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to pick image');
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

  const handleNext = () => {
    triggerHaptic(Haptics.ImpactFeedbackStyle.Medium);
    setErrors({});

    if (currentStep === 1) {
      setCurrentStep(2);
    } else if (currentStep === 2) {
      if (!acres) {
        setErrors({ acres: 'Acres required' });
        return;
      }
      setCurrentStep(3);
    } else if (currentStep === 3) {
      let hasError = false;
      const newErrors: Record<string, string> = {};
      if (!isNonEmptyStr(stateName)) { newErrors.stateName = 'State required'; hasError = true; }
      if (!isNonEmptyStr(district)) { newErrors.district = 'District required'; hasError = true; }
      if (!isNonEmptyStr(village)) { newErrors.village = 'Village required'; hasError = true; }
      if (!isNonEmptyStr(city)) { newErrors.city = 'City required'; hasError = true; }
      if (!isNonEmptyStr(country)) { newErrors.country = 'Country required'; hasError = true; }
      if (!isNonEmptyStr(gramPanchayat)) { newErrors.gramPanchayat = 'Panchayat required'; hasError = true; }
      if (!isNonEmptyStr(vikashKhand)) { newErrors.vikashKhand = 'Khand required'; hasError = true; }
      if (!isNonEmptyStr(fullAddress)) { newErrors.fullAddress = 'Address required'; hasError = true; }

      if (hasError) {
        setErrors(newErrors);
        const firstError = Object.keys(newErrors)[0];
        if (firstError && fieldPositions.current[firstError] !== undefined) {
          scrollViewRef.current?.scrollToPosition(0, Math.max(0, fieldPositions.current[firstError] - 20), true);
        }
        return;
      }

      setCurrentStep(4);
    } else if (currentStep === 4) {
      if (!geoCoords || boundaryPolygon.length < 3) {
        setErrors({ boundary: 'Please mark at least 3 boundary points using GPS.' });
        return;
      }
      setCurrentStep(5);
    } else if (currentStep === 5) {
      if (docStates.landProof !== 'Approved') {
        setErrors({ docs: 'Land Proof is mandatory.' });
        if (fieldPositions.current['docs'] !== undefined) {
          scrollViewRef.current?.scrollToPosition(0, Math.max(0, fieldPositions.current['docs'] - 20), true);
        }
        return;
      }
      setCurrentStep(6);
    } else if (currentStep === 6) {
      const photosUploaded = ['photo1', 'photo2', 'photo3', 'photo4'].filter(k => docStates[k] === 'Approved').length;
      if (photosUploaded < 2) {
        setErrors({ docs: 'Please upload at least 2 photos of the land.' });
        return;
      }

      const newPlot = {
        id: 'plot_' + Date.now(),
        name: `Plot in ${village}`,
        acres: parseFloat(acres),
        cropType: 'Pending',
        soilType: docStates.soilCard === 'Approved' ? 'Tested' : 'Unknown',
        irrigationType: 'Unknown',
        status: 'Approved' as const,
        geoCoords: geoCoords || { latitude: 0, longitude: 0 },
        boundaryPolygon,
        documentName: 'Khasra Khatauni',
        landDocumentUrl: landDocumentUrl || undefined,
        landPhotoUrls: ['photo1', 'photo2', 'photo3', 'photo4']
          .map(k => photoUrls[k])
          .filter(Boolean),
        country,
        state: stateName,
        district,
        city,
        gramPanchayat,
        vikashKhand,
        village,
        fullAddress,
        landmark,
      };

      addPlot(newPlot);
      setShowNextStepsModal(true);
    }
  };

  const renderDocCard = (card: DocCard) => {
    const status = docStates[card.key];
    const progressWidth = uploadAnims[card.key].interpolate({
      inputRange: [0, 1],
      outputRange: ['0%', '100%']
    });

    return (
      <View key={card.key} style={[styles.uploadCard, card.isSquare && { aspectRatio: 1, padding: 12, justifyContent: 'center', alignItems: 'center' }]}>
        <View style={[styles.uploadCardContent, card.isSquare && { flexDirection: 'column', width: '100%', alignItems: 'center' }]}>
          {card.isSquare ? (
            <View style={{ flexDirection: 'row', justifyContent: 'center', marginBottom: 8 }}>
              <TouchableOpacity 
                style={[styles.docIconBox, { width: 36, height: 36, borderRadius: 10, marginRight: 8 }]} 
                onPress={() => handleImageUpload(card.key, 'camera')}
                disabled={status === 'Verifying' || status === 'Uploading' || status === 'Approved'}
              >
                <MaterialCommunityIcons name="camera-outline" size={18} color={COLORS.primary} />
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.docIconBox, { width: 36, height: 36, borderRadius: 10 }]} 
                onPress={() => handleImageUpload(card.key, 'gallery')}
                disabled={status === 'Verifying' || status === 'Uploading' || status === 'Approved'}
              >
                <MaterialCommunityIcons name="cloud-upload-outline" size={18} color={COLORS.primary} />
              </TouchableOpacity>
            </View>
          ) : (
            <View style={[styles.docIconBox, status === 'Approved' && styles.docIconBoxActive, card.isSquare && { marginBottom: 8 }]}>
              <MaterialCommunityIcons
                name={card.icon as any}
                size={22}
                color={status === 'Approved' ? COLORS.primary : '#64748B'}
              />
            </View>
          )}
          <View style={[card.isSquare ? { alignItems: 'center', width: '100%' } : { flex: 1, marginLeft: 12 }]}>
            <Text style={[styles.uploadTitle, card.isSquare && { textAlign: 'center', fontSize: 12 }]}>{card.title} {card.mandatory ? '*' : ''}</Text>
            <Text style={[styles.uploadSub, card.isSquare && { textAlign: 'center', fontSize: 10, marginTop: 2 }]}>{card.subtitle}</Text>

            {status === 'Uploading' && (
              <View style={[styles.progressContainer, card.isSquare && { marginTop: 6 }]}>
                <View style={styles.progressBarBg}>
                  <Animated.View style={[styles.progressBarFillLocal, { width: progressWidth }]} />
                </View>
                {!card.isSquare && <Text style={styles.progressStatusText}>Uploading...</Text>}
              </View>
            )}

            {status === 'Verifying' && (
              <View style={[styles.verifyingContainer, card.isSquare && { marginTop: 6 }]}>
                <ActivityIndicator size="small" color={COLORS.primary} style={!card.isSquare ? { marginRight: 6 } : {}} />
                {!card.isSquare && <Text style={styles.verifyingText}>Verifying...</Text>}
              </View>
            )}

            {status === 'Approved' && (
              <View style={[styles.approvedIndicator, card.isSquare && { marginTop: 6 }]}>
                <MaterialCommunityIcons name="checkbox-marked-circle-outline" size={14} color={COLORS.success} />
                {!card.isSquare && <Text style={styles.approvedText}>Approved</Text>}
              </View>
            )}
          </View>

          {!card.isSquare && (
            <TouchableOpacity
              style={[
                styles.uploadActionBtn,
                status === 'Approved' && styles.uploadActionBtnActive,
                status === 'Verifying' && { opacity: 0.5 }
              ]}
              onPress={() => handleUploadChoice(card.key)}
              disabled={status === 'Verifying' || status === 'Uploading'}
            >
              <MaterialCommunityIcons
                name={status === 'Approved' ? "check" : "cloud-upload-outline"}
                size={20}
                color={status === 'Approved' ? '#FFFFFF' : COLORS.primary}
              />
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F4FDF9" />

      {/* Top Banner Step Bar */}
      <View style={[styles.stepperContainer, { paddingTop: insets.top > 0 ? insets.top + 14 : (Platform.OS === 'ios' ? 60 : 40) }]}>
        <TouchableOpacity onPress={() => currentStep === 1 ? router.back() : setCurrentStep(1)} style={styles.backArrow}>
          <MaterialCommunityIcons name="chevron-left" size={24} color={COLORS.primary} />
        </TouchableOpacity>
        <View style={styles.progressWrapper}>
          <Text style={styles.stepTitle}>Step {currentStep} of 6</Text>
          <View style={styles.progressBarBg}>
            <View style={[styles.progressBarFill, { width: `${(currentStep / 6) * 100}%` }]} />
          </View>
        </View>
        <View style={{ width: 24 }} />
      </View>

      <KeyboardAwareScrollView
        ref={scrollViewRef}
        contentContainerStyle={styles.scrollArea}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        enableOnAndroid={true}
        extraScrollHeight={60}
      >
        <Pressable style={{ flex: 1 }} onPress={() => { Keyboard.dismiss(); setCloseDropdownsTrigger(prev => prev + 1); }}>
        
        {/* STEP 1: Farmer Identity Verification */}
        {currentStep === 1 && (
          <View style={styles.stepCard}>
            <Text style={styles.heading}>Identity / पहचान</Text>
            <Text style={styles.subheading}>Confirm identity details for land registration.</Text>

            <View style={styles.formField}>
              <Text style={styles.label}>Are you registering someone else's land?</Text>
              <View style={{ flexDirection: 'row', marginTop: 8 }}>
                <TouchableOpacity onPress={() => setBelongsToAnother(false)} style={{ flexDirection: 'row', alignItems: 'center', marginRight: 20 }}>
                  <MaterialCommunityIcons name={!belongsToAnother ? "radiobox-marked" : "radiobox-blank"} size={22} color={COLORS.primary} />
                  <Text style={{ marginLeft: 8, fontSize: 14 }}>No, it's mine</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setBelongsToAnother(true)} style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <MaterialCommunityIcons name={belongsToAnother ? "radiobox-marked" : "radiobox-blank"} size={22} color={COLORS.primary} />
                  <Text style={{ marginLeft: 8, fontSize: 14 }}>Yes</Text>
                </TouchableOpacity>
              </View>
            </View>

            {belongsToAnother && (
              <View style={styles.formField}>
                <Text style={styles.label}>Original Owner / Father's Name</Text>
                <TextInput style={styles.input} placeholder="Name" value={fathersName} onChangeText={setFathersName} />
              </View>
            )}

            <View style={styles.formField}>
              <Text style={styles.label}>Mobile Number *</Text>
              <TextInput style={styles.input} keyboardType="phone-pad" value={mobileNumber} onChangeText={setMobileNumber} />
              {errors.mobileNumber && <Text style={styles.errorText}>{errors.mobileNumber}</Text>}
            </View>
          </View>
        )}

        {/* STEP 2: Soil & Crop Eco-metrics */}
        {currentStep === 2 && (
          <View style={styles.stepCard}>
            <Text style={styles.heading}>Eco-Metrics / कृषि विवरण</Text>
            <Text style={styles.subheading}>Enter crop and soil details.</Text>

            <View style={styles.formField} onLayout={(e) => fieldPositions.current['acres'] = e.nativeEvent.layout.y}>
              <Text style={styles.label}>Total Land Area (Acres) / एकड़ *</Text>
              <TextInput 
                style={[styles.input, errors.acres && styles.inputError]} 
                placeholder="e.g. 4.5"
                keyboardType="numeric" 
                value={acres} 
                onChangeText={setAcres} 
              />
              {errors.acres && <Text style={styles.errorText}>{errors.acres}</Text>}
            </View>

            <View style={styles.formField}>
              <Text style={styles.label}>Current Crop Selection *</Text>
              <TextInput style={[styles.input, errors.cropSelection && styles.inputError]} placeholder="e.g. Wheat, Rice" value={cropSelection} onChangeText={setCropSelection} />
              {errors.cropSelection && <Text style={styles.errorText}>{errors.cropSelection}</Text>}
            </View>

            <View style={styles.formField}>
              <Text style={styles.label}>Soil Composition *</Text>
              <TextInput style={[styles.input, errors.soilComposition && styles.inputError]} placeholder="e.g. Black Soil, Red Soil" value={soilComposition} onChangeText={setSoilComposition} />
              {errors.soilComposition && <Text style={styles.errorText}>{errors.soilComposition}</Text>}
            </View>

            <View style={styles.formField}>
              <Text style={styles.label}>Water Availability (Optional)</Text>
              <TextInput style={styles.input} placeholder="e.g. Well, Canal" value={waterAvailability} onChangeText={setWaterAvailability} />
            </View>
          </View>
        )}

        {/* STEP 3: Land Details & Address */}
        {currentStep === 3 && (
          <View style={styles.stepCard}>
            <Text style={styles.heading}>Location / स्थान</Text>
            <Text style={styles.subheading}>Enter your land location.</Text>

            <View style={[styles.dualInputsRow, { zIndex: 10 }]}>
              <View style={[styles.formField, { flex: 1, marginRight: 10, zIndex: 10 }]} onLayout={(e) => fieldPositions.current['country'] = e.nativeEvent.layout.y}>
                <Text style={styles.label}>Country / देश *</Text>
                <AutocompleteDropdown data={COUNTRIES_LIST} value={country} onChangeText={(val) => { setCountry(val); setStateName(''); setDistrict(''); setCity(''); setErrors(prev => ({ ...prev, country: '' })); }} placeholder="Country" closeTrigger={closeDropdownsTrigger} style={errors.country ? styles.inputError : {}} />
                {errors.country && <Text style={styles.errorText}>{errors.country}</Text>}
              </View>
              <View style={[styles.formField, { flex: 1, zIndex: 10 }]} onLayout={(e) => fieldPositions.current['stateName'] = e.nativeEvent.layout.y}>
                <Text style={styles.label}>State / राज्य *</Text>
                <AutocompleteDropdown data={availableStates} value={stateName} onChangeText={(val) => { setStateName(val); setDistrict(''); setCity(''); setErrors(prev => ({ ...prev, stateName: '' })); }} placeholder="State" closeTrigger={closeDropdownsTrigger} style={errors.stateName ? styles.inputError : {}} />
                {errors.stateName && <Text style={styles.errorText}>{errors.stateName}</Text>}
              </View>
            </View>

            <View style={[styles.dualInputsRow, { zIndex: 9 }]}>
              <View style={[styles.formField, { flex: 1, marginRight: 10, zIndex: 9 }]} onLayout={(e) => fieldPositions.current['district'] = e.nativeEvent.layout.y}>
                <Text style={styles.label}>District / जिला *</Text>
                <AutocompleteDropdown data={availableDistricts} value={district} onChangeText={(val) => { setDistrict(val); setCity(''); setErrors(prev => ({ ...prev, district: '' })); }} placeholder="District" closeTrigger={closeDropdownsTrigger} style={errors.district ? styles.inputError : {}} />
                {errors.district && <Text style={styles.errorText}>{errors.district}</Text>}
              </View>
              <View style={[styles.formField, { flex: 1, zIndex: 9 }]} onLayout={(e) => fieldPositions.current['city'] = e.nativeEvent.layout.y}>
                <Text style={styles.label}>City / शहर *</Text>
                <AutocompleteDropdown data={availableCities} value={city} onChangeText={(val) => { setCity(val); setErrors(prev => ({ ...prev, city: '' })); }} placeholder="City" closeTrigger={closeDropdownsTrigger} style={errors.city ? styles.inputError : {}} />
                {errors.city && <Text style={styles.errorText}>{errors.city}</Text>}
              </View>
            </View>

            <View style={[styles.dualInputsRow, { zIndex: 8 }]}>
              <View style={[styles.formField, { flex: 1, marginRight: 10, zIndex: 8 }]} onLayout={(e) => fieldPositions.current['gramPanchayat'] = e.nativeEvent.layout.y}>
                <Text style={styles.label}>Gram Panchayat / ग्राम पंचायत *</Text>
                <AutocompleteDropdown data={availableGramPanchayats} value={gramPanchayat} onChangeText={(val) => { setGramPanchayat(val); setErrors(prev => ({ ...prev, gramPanchayat: '' })); }} placeholder="Panchayat" closeTrigger={closeDropdownsTrigger} style={errors.gramPanchayat ? styles.inputError : {}} />
                {errors.gramPanchayat && <Text style={styles.errorText}>{errors.gramPanchayat}</Text>}
              </View>
              <View style={[styles.formField, { flex: 1, zIndex: 8 }]} onLayout={(e) => fieldPositions.current['vikashKhand'] = e.nativeEvent.layout.y}>
                <Text style={styles.label}>Vikash Khand / विकास खंड *</Text>
                <AutocompleteDropdown data={availableVikasKhands} value={vikashKhand} onChangeText={(val) => { setVikashKhand(val); setErrors(prev => ({ ...prev, vikashKhand: '' })); }} placeholder="Vikash Khand" closeTrigger={closeDropdownsTrigger} style={errors.vikashKhand ? styles.inputError : {}} />
                {errors.vikashKhand && <Text style={styles.errorText}>{errors.vikashKhand}</Text>}
              </View>
            </View>

            <View style={[styles.formField, { zIndex: 7 }]} onLayout={(e) => fieldPositions.current['village'] = e.nativeEvent.layout.y}>
              <Text style={styles.label}>Village / गांव *</Text>
              <AutocompleteDropdown data={availableVillages} value={village} onChangeText={(val) => { setVillage(val); setErrors(prev => ({ ...prev, village: '' })); }} placeholder="Village name" closeTrigger={closeDropdownsTrigger} style={errors.village ? styles.inputError : {}} />
              {errors.village && <Text style={styles.errorText}>{errors.village}</Text>}
            </View>

            <View style={styles.formField} onLayout={(e) => fieldPositions.current['fullAddress'] = e.nativeEvent.layout.y}>
              <Text style={styles.label}>Full Address / पूरा पता *</Text>
              <TextInput style={[styles.input, { height: 80 }, errors.fullAddress && styles.inputError]} multiline numberOfLines={3} placeholder="Full address" placeholderTextColor="#64748B" value={fullAddress} onChangeText={(val) => { setFullAddress(val); setErrors(prev => ({ ...prev, fullAddress: '' })); }} />
              {errors.fullAddress && <Text style={styles.errorText}>{errors.fullAddress}</Text>}
            </View>

            <View style={styles.formField}>
              <Text style={styles.label}>Landmark / सीमा चिन्ह</Text>
              <TextInput style={styles.input} placeholder="Near the river, temple, etc." placeholderTextColor="#64748B" value={landmark} onChangeText={setLandmark} />
            </View>
          </View>
        )}

        {/* STEP 4: GPS Mapping */}
        {currentStep === 4 && (
          <View style={styles.stepCard}>
            <Text style={styles.heading}>Satellite Mapping / उपग्रह मानचित्र</Text>
            <Text style={styles.subheading}>Pinpoint your land boundaries using GPS.</Text>
            
            <View style={styles.gpsCard}>
              <View style={{ flex: 1 }}>
                <Text style={styles.gpsTitle}>Geo-Boundary Map Ping *</Text>
                <Text style={styles.gpsSub}>
                  {geoCoords && boundaryPolygon.length > 0
                    ? `Map captured with ${boundaryPolygon.length} boundary points`
                    : 'GPS mapping not captured yet'}
                </Text>
                {(errors.geoCoords || errors.boundary) && (
                  <Text style={styles.errorText}>{errors.geoCoords || errors.boundary}</Text>
                )}
              </View>
              <TouchableOpacity style={styles.gpsBtn} onPress={handleFetchGPS} disabled={gpsLoading}>
                {gpsLoading ? (
                  <ActivityIndicator size="small" color={COLORS.primary} />
                ) : (
                  <MaterialCommunityIcons name="crosshairs-gps" size={22} color={COLORS.primary} />
                )}
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* STEP 5: Documents */}
        {currentStep === 5 && (
          <View style={styles.stepCard} onLayout={(e) => fieldPositions.current['docs'] = e.nativeEvent.layout.y}>
            <Text style={styles.heading}>Documents / दस्तावेज़</Text>
            <Text style={styles.subheading}>Upload mandatory proof of the land.</Text>
            {errors.docs && <Text style={[styles.errorText, { marginBottom: 16 }]}>{errors.docs}</Text>}

            {renderDocCard({
              key: 'landProof',
              title: 'Land Ownership Proof',
              subtitle: 'Khasra copy or registration proof',
              icon: 'file-document-outline',
              mandatory: true
            })}
            {renderDocCard({
              key: 'soilCard',
              title: 'Soil Health Card',
              subtitle: 'Govt soil testing parameters (Optional)',
              icon: 'sprout-outline'
            })}
          </View>
        )}

        {/* STEP 6: Photos */}
        {currentStep === 6 && (
          <View style={styles.stepCard}>
            <Text style={styles.heading}>Photos / तस्वीरें</Text>
            <Text style={styles.subheading}>Upload 2-4 photos of the land.</Text>
            
            {errors.docs && <Text style={[styles.errorText, { marginBottom: 16 }]}>{errors.docs}</Text>}

            <Text style={[styles.label, { marginTop: 10, marginBottom: 10 }]}>Land Photos (Min 2, Max 4) *</Text>

            <View style={styles.dualInputsRow}>
              <View style={{ flex: 1, marginRight: 10 }}>
                {renderDocCard({ key: 'photo1', title: 'Photo 1', subtitle: 'Corner view', icon: 'camera-outline', mandatory: true, isSquare: true })}
              </View>
              <View style={{ flex: 1 }}>
                {renderDocCard({ key: 'photo2', title: 'Photo 2', subtitle: 'Center view', icon: 'camera-outline', mandatory: true, isSquare: true })}
              </View>
            </View>
            <View style={styles.dualInputsRow}>
              <View style={{ flex: 1, marginRight: 10 }}>
                {renderDocCard({ key: 'photo3', title: 'Photo 3', subtitle: 'Optional view', icon: 'camera-outline', isSquare: true })}
              </View>
              <View style={{ flex: 1 }}>
                {renderDocCard({ key: 'photo4', title: 'Photo 4', subtitle: 'Optional view', icon: 'camera-outline', isSquare: true })}
              </View>
            </View>
          </View>
        )}

<TouchableOpacity style={styles.actionBtn} onPress={handleNext} activeOpacity={0.9}>
          <LinearGradient colors={[COLORS.primary, COLORS.secondary]} style={styles.actionBtnGrad}>
            <Text style={styles.actionBtnLabel}>{currentStep === 6 ? 'Add Land / भूमि जोड़ें' : 'Continue / आगे बढ़ें'}</Text>
            <MaterialCommunityIcons name={currentStep === 6 ? "check" : "arrow-right"} size={20} color="#FFFFFF" style={{ marginLeft: 8 }} />
          </LinearGradient>
        </TouchableOpacity>

        </Pressable>
      </KeyboardAwareScrollView>

      {/* Full Screen Image Preview Modal */}
      <Modal visible={!!previewData} transparent={false} animationType="slide" onRequestClose={() => setPreviewData(null)}>
        <View style={{ flex: 1, backgroundColor: '#000' }}>
          <View style={{ paddingTop: insets.top + 20, paddingHorizontal: 20, flexDirection: 'row', justifyContent: 'space-between', zIndex: 10 }}>
            <TouchableOpacity onPress={() => setPreviewData(null)} style={{ padding: 8, backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 20 }}>
              <MaterialCommunityIcons name="close" size={24} color="#FFF" />
            </TouchableOpacity>
          </View>
          {previewData?.uri && (
            <Image source={{ uri: previewData.uri }} style={{ flex: 1, width: '100%', height: '100%', position: 'absolute' }} resizeMode="contain" />
          )}
          <View style={{ position: 'absolute', bottom: 40, left: 20, right: 20 }}>
            <TouchableOpacity 
              style={{ backgroundColor: COLORS.primary, padding: 16, borderRadius: 12, alignItems: 'center' }}
              onPress={() => {
                if (previewData) {
                  const { docKey, uri } = previewData;
                  setPreviewData(null);
                  if (docKey === 'landProof' || docKey.startsWith('photo')) {
                    handlePhotoUpload(docKey, uri);
                  } else {
                    handleSimulateUpload(docKey);
                  }
                }
              }}
            >
              <Text style={{ color: '#FFF', fontSize: 16, fontWeight: '700' }}>Upload Photo</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Next Steps Modal */}
      <Modal visible={showNextStepsModal} transparent={true} animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalIconBox}>
              <MaterialCommunityIcons name="check-circle" size={48} color={COLORS.success} />
            </View>
            <Text style={styles.modalTitle}>Land Added Successfully!</Text>
            <Text style={styles.modalSub}>Would you like to purchase an insurance policy for your newly registered tree now?</Text>
            
            <View style={styles.modalBtnRow}>
              <TouchableOpacity 
                style={styles.modalNotNowBtn}
                onPress={() => {
                  setShowNextStepsModal(false);
                  router.push({
                    pathname: '/insurance/payment' as any,
                    params: {
                      mode: 'land_only',
                      landPremium: '99',
                      policyName: 'Land Registration Fee',
                      acres: acres
                    }
                  });
                }}
              >
                <Text style={styles.modalNotNowText}>Not Now</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.modalPurchaseBtn}
                onPress={() => {
                  setShowNextStepsModal(false);
                  router.push({
                    pathname: '/insurance' as any,
                    params: {
                      landPremium: '99',
                      acres: acres
                    }
                  });
                }}
              >
                <LinearGradient colors={[COLORS.primary, COLORS.secondary]} style={styles.modalPurchaseGrad}>
                  <Text style={styles.modalPurchaseText}>Purchase Policy</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F4FDF9' },
  stepperContainer: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingVertical: 14, backgroundColor: '#FFFFFF',
    borderBottomWidth: 1, borderColor: '#E2E8F0',
  },
  backArrow: { padding: 6, borderRadius: 10 },
  progressWrapper: { flex: 1, paddingHorizontal: 16 },
  stepTitle: { fontSize: 12, fontWeight: '800', color: COLORS.primary, textAlign: 'center', marginBottom: 4 },
  progressBarBg: { height: 6, borderRadius: 3, backgroundColor: '#E2E8F0', width: '100%' },
  progressBarFill: { height: '100%', borderRadius: 3, backgroundColor: COLORS.accent },
  scrollArea: { paddingHorizontal: 20, paddingVertical: 24 },
  stepCard: { backgroundColor: '#FFFFFF', borderRadius: 24, padding: 24, ...SHADOWS.soft, marginBottom: 24 },
  heading: { ...TYPOGRAPHY.h2, color: COLORS.primaryDark, fontWeight: '800', marginBottom: 6 },
  subheading: { fontSize: 13, color: COLORS.textSecondary, lineHeight: 18, marginBottom: 24 },
  formField: { marginBottom: 16 },
  label: { fontSize: 12, fontWeight: '700', color: COLORS.textDark, marginBottom: 8 },
  input: {
    backgroundColor: '#F8FAFC', borderWidth: 1.5, borderColor: '#E2E8F0',
    borderRadius: 14, paddingHorizontal: 16, paddingVertical: 12,
    fontSize: 14, color: COLORS.textDark, fontWeight: '600',
  },
  inputError: { borderColor: '#EF4444' },
  errorText: { color: '#EF4444', fontSize: 12, fontWeight: '600', marginTop: 4, marginLeft: 4 },
  dualInputsRow: { flexDirection: 'row' },
  uploadCard: {
    backgroundColor: '#F8FAFC', borderRadius: 20, borderWidth: 1.5,
    borderColor: '#E2E8F0', padding: 14, marginBottom: 14,
  },
  uploadCardContent: { flexDirection: 'row', alignItems: 'center' },
  docIconBox: {
    width: 44, height: 44, borderRadius: 12, backgroundColor: '#E2E8F0',
    justifyContent: 'center', alignItems: 'center',
  },
  docIconBoxActive: { backgroundColor: '#E6F4EA' },
  uploadTitle: { fontSize: 13, fontWeight: '800', color: COLORS.textDark },
  uploadSub: { fontSize: 11, color: COLORS.textSecondary, marginTop: 2 },
  uploadActionBtn: {
    width: 44, height: 44, borderRadius: 12, backgroundColor: '#FFFFFF',
    borderWidth: 1.5, borderColor: COLORS.primary, justifyContent: 'center',
    alignItems: 'center', marginLeft: 12, ...SHADOWS.soft,
  },
  uploadActionBtnActive: { backgroundColor: COLORS.success, borderColor: COLORS.success },
  progressContainer: { marginTop: 8, width: '100%' },
  progressBarFillLocal: { height: '100%', backgroundColor: COLORS.primary, borderRadius: 2 },
  progressStatusText: { fontSize: 9, fontWeight: '700', color: COLORS.primary, marginTop: 4 },
  verifyingContainer: { flexDirection: 'row', alignItems: 'center', marginTop: 8 },
  verifyingText: { fontSize: 10, fontWeight: '700', color: COLORS.primary },
  approvedIndicator: { flexDirection: 'row', alignItems: 'center', marginTop: 8 },
  approvedText: { fontSize: 10, fontWeight: '700', color: COLORS.success, marginLeft: 4 },
  gpsCard: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#ECFDF5',
    borderWidth: 1.5, borderColor: COLORS.border, borderRadius: 16, padding: 16, marginBottom: 14,
  },
  gpsTitle: { fontSize: 13, fontWeight: '800', color: COLORS.primary },
  gpsSub: { fontSize: 11, color: COLORS.secondary, marginTop: 2, fontWeight: '600' },
  gpsBtn: {
    width: 44, height: 44, borderRadius: 12, backgroundColor: '#FFFFFF',
    justifyContent: 'center', alignItems: 'center', ...SHADOWS.soft,
  },
  actionBtn: { borderRadius: 30, overflow: 'hidden', ...SHADOWS.glow },
  actionBtnGrad: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 16 },
  actionBtnLabel: { color: '#FFFFFF', fontSize: 16, fontWeight: '800' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  modalCard: { backgroundColor: '#FFFFFF', borderRadius: 24, padding: 24, width: '100%', alignItems: 'center', ...SHADOWS.glow },
  modalIconBox: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#ECFDF5', justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  modalTitle: { fontSize: 20, fontWeight: '900', color: COLORS.primaryDark, marginBottom: 8, textAlign: 'center' },
  modalSub: { fontSize: 14, color: COLORS.textSecondary, textAlign: 'center', marginBottom: 24, lineHeight: 20 },
  modalBtnRow: { flexDirection: 'row', width: '100%', justifyContent: 'space-between' },
  modalNotNowBtn: { flex: 1, paddingVertical: 16, borderRadius: 16, backgroundColor: '#F1F5F9', alignItems: 'center', marginRight: 10 },
  modalNotNowText: { color: COLORS.textDark, fontSize: 15, fontWeight: '800' },
  modalPurchaseBtn: { flex: 1, borderRadius: 16, overflow: 'hidden' },
  modalPurchaseGrad: { paddingVertical: 16, alignItems: 'center' },
  modalPurchaseText: { color: '#FFFFFF', fontSize: 15, fontWeight: '800' },
});

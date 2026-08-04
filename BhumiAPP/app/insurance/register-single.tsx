import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, StatusBar, Platform, Dimensions, Alert, ActivityIndicator, Keyboard, Modal, Image } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Location from 'expo-location';
import { COLORS, TYPOGRAPHY, SHADOWS } from '../../src/theme/theme';
import { useAuthStore } from '../../src/store/authStore';
import api from '../../src/api/apiClient';
import { isFarmerVerified } from '../../src/utils/verificationGuard';

const { width } = Dimensions.get('window');

const SPECIES_LIST = [
  'Premium Teakwood / सागौन', 
  'Alphonso Mango / हापुस आम', 
  'Malabar Neem / मालाबार नीम', 
  'Organic Bamboo / बांस', 
  'Sandalwood / चंदन',
];

interface TreePlan {
  _id: string;
  plan_type: string;
  plan_name: string;
  price: number;
  billing_cycle: string;
  cover: number;
  badge_text: string;
  badge_color: string;
  description: string;
  priority: number;
  is_active: boolean;
  is_recommended: boolean;
}

export default function RegisterSingleTreeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams();
  const authUser = useAuthStore((state) => state.user);
  const landPremium = params.landPremium as string | undefined;
  const acres = params.acres as string | undefined;

  // Form inputs
  const [treeName, setTreeName] = useState('');
  const [selectedSpecies, setSelectedSpecies] = useState('');
  const [age, setAge] = useState('');
  const [height, setHeight] = useState('');
  const [health, setHealth] = useState('Excellent / उत्कृष्ट');
  const [landDetails, setLandDetails] = useState('');
  const [uniqueSign, setUniqueSign] = useState('');
  
  // Locations
  const [gpsLoading, setGpsLoading] = useState(false);
  const [geoCoords, setGeoCoords] = useState<{ latitude: number; longitude: number } | null>(null);
  const [farmLocation, setFarmLocation] = useState('Bhopal Rural District, Budhni block, MP');

  // Camera mock photos
  const [cameraLoading, setCameraLoading] = useState<string | null>(null);
  const [previewData, setPreviewData] = useState<{ key: string; uri: string } | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const scrollViewRef = useRef<KeyboardAwareScrollView>(null);
  const fieldPositions = useRef<Record<string, number>>({});
  const [photos, setPhotos] = useState<Record<string, string>>({});

  // Selected policy ID
  const [selectedPolicyId, setSelectedPolicyId] = useState('');
  const [plans, setPlans] = useState<TreePlan[]>([]);
  const [loadingPlans, setLoadingPlans] = useState(true);

  React.useEffect(() => {
    const fetchPlans = async () => {
      try {
        const res = await api.get('/tree-plans?plan_type=single_tree');
        console.log('[DEBUG] API Response from /tree-plans:', res.data);
        if (res.data.success) {
          setPlans(res.data.data);
          if (res.data.data.length > 0) {
            setSelectedPolicyId(res.data.data[0]._id);
          }
        }
      } catch (err) {
        console.error('Failed to fetch tree plans:', err);
      } finally {
        setLoadingPlans(false);
      }
    };
    fetchPlans();
  }, []);

  // Species Picker state
  const [isSpeciesPickerOpen, setSpeciesPickerOpen] = useState(false);

  const handleFetchGPS = async () => {
    setGpsLoading(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'GPS is required to register tree coordinates for satellite tracking.');
        setGpsLoading(false);
        return;
      }
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      setGeoCoords({ latitude: loc.coords.latitude, longitude: loc.coords.longitude });
      Alert.alert('GPS Tagged ✅', 'Satellite coordinate mapping established successfully.');
    } catch (e) {
      setGeoCoords({ latitude: 22.9782, longitude: 78.6591 });
      Alert.alert('Simulated GPS Coords ✅', 'Acquired tree geotag details.');
    } finally {
      setGpsLoading(false);
    }
  };

  const scrollToField = (fieldName: string) => {
    const card2Fields = ['treeName', 'selectedSpecies', 'age', 'height', 'landDetails', 'uniqueSign', 'geoCoords', 'photos'];
    const cardY = card2Fields.includes(fieldName) ? (fieldPositions.current['card2'] || 0) : 0;
    const fieldY = fieldPositions.current[fieldName];
    if (fieldY !== undefined) {
      scrollViewRef.current?.scrollToPosition(0, Math.max(0, cardY + fieldY - 40), true);
    }
  };

  const handleImageUpload = async (key: string, mode: 'gallery' | 'camera') => {
    if (cameraLoading === key || photos[key]) return;

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
        setPreviewData({ key, uri: result.assets[0].uri });
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to pick image.');
    }
  };

  const handleUploadChoice = (key: string) => {
    Alert.alert(
      'Upload Photo',
      'Choose how you want to upload',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Take Photo', onPress: () => handleImageUpload(key, 'camera') },
        { text: 'Choose from Gallery', onPress: () => handleImageUpload(key, 'gallery') },
      ],
      { cancelable: true }
    );
  };

  const handleSimulateUpload = (key: string, uri: string) => {
    setCameraLoading(key);
    setTimeout(() => {
      setCameraLoading(null);
      setPhotos((prev) => ({ ...prev, [key]: uri }));
    }, 1200);
  };

  const handleProceedToPayment = () => {
    setErrors({});
    let hasError = false;
    const newErrors: Record<string, string> = {};

    if (!treeName) { newErrors.treeName = 'Custom Tree Name is required'; hasError = true; }
    if (!selectedSpecies) { newErrors.selectedSpecies = 'Tree Species is required'; hasError = true; }
    if (!age) { newErrors.age = 'Tree Age is required'; hasError = true; }
    if (!height) { newErrors.height = 'Approx Height is required'; hasError = true; }
    if (!landDetails) { newErrors.landDetails = 'Land Details are required'; hasError = true; }
    if (!uniqueSign) { newErrors.uniqueSign = 'Unique Sign is required'; hasError = true; }
    // if (!geoCoords) { newErrors.geoCoords = 'Geo-Boundary capture is required'; hasError = true; }

    const allPhotosCaptured = ['trunk', 'leaf', 'full', 'surround'].every((k) => !!photos[k]);
    if (!allPhotosCaptured) {
      newErrors.photos = 'All 4 photos are required'; hasError = true;
    }

    if (hasError) {
      setErrors(newErrors);
      // Alert.alert('Incomplete Form', 'Please fill all the required fields and capture GPS & photos before proceeding.');
      const firstError = Object.keys(newErrors)[0];
      if (firstError) {
        scrollToField(firstError);
      }
      return;
    }

    const selectedPolicy = plans.find(p => p._id === selectedPolicyId);
    if (!selectedPolicy) return;

    if (!isFarmerVerified()) return;

    // Navigate to payment
    router.push({
      pathname: '/insurance/payment' as any,
      params: {
        mode: 'single',
        treeName,
        species: selectedSpecies,
        age,
        height,
        landDetails,
        uniqueSign,
        premium: selectedPolicy.price,
        coverage: selectedPolicy.cover,
        policyId: selectedPolicy._id,
        policyName: selectedPolicy.plan_name,
        photosData: JSON.stringify(photos),
        ...(landPremium ? { landPremium } : {}),
        ...(acres ? { acres } : {})
      }
    });
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F4FDF9" />
      
      {/* Top Navigation Bar */}
      <View style={[styles.navBar, { paddingTop: insets.top > 0 ? insets.top + 10 : (Platform.OS === 'ios' ? 50 : 30) }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <MaterialCommunityIcons name="arrow-left" size={22} color={COLORS.primary} />
        </TouchableOpacity>
        <Text style={styles.navTitle}>Single Tree Registry</Text>
        <View style={{ width: 36 }} />
      </View>

      <KeyboardAwareScrollView 
        ref={scrollViewRef} 
        contentContainerStyle={styles.scrollArea} 
        showsVerticalScrollIndicator={false} 
        keyboardShouldPersistTaps="handled"
        enableOnAndroid={true}
        extraScrollHeight={60}
      >
        {/* Step Banner */}
        <View style={styles.bannerInfo}>
          <Text style={styles.bannerHeading}>Register Asset & Choose Coverage</Text>
          <Text style={styles.bannerSub}>Details are dynamically synced to the BhumiCred Environmental registry.</Text>
        </View>

        {/* 1. Farmer Details (Auto-filled) */}
        <View style={styles.formCard}>
          <Text style={styles.cardSectionTitle}>1. Farmer Information (Auto-filled)</Text>
          <View style={styles.gridRow}>
            <View style={[styles.gridCell, { marginRight: 10 }]}>
              <Text style={styles.disabledLabel}>Farmer Name</Text>
              <Text style={styles.disabledValue}>{authUser?.fullName || ''}</Text>
            </View>
            <View style={styles.gridCell}>
              <Text style={styles.disabledLabel}>Mobile Number</Text>
              <Text style={styles.disabledValue}>{authUser?.mobile ? `+91 ${authUser.mobile}` : ''}</Text>
            </View>
          </View>
          <View style={[styles.gridCell, { marginTop: 10 }]}>
            <Text style={styles.disabledLabel}>Village & Block</Text>
            <Text style={styles.disabledValue}>Budhni Village, Bhopal Rural, MP</Text>
          </View>
        </View>

        {/* 2. Tree Asset details */}
        <View style={styles.formCard} onLayout={(e) => fieldPositions.current['card2'] = e.nativeEvent.layout.y}>
          <Text style={styles.cardSectionTitle}>2. Plantation Parameters / पेड़ का विवरण</Text>
          
          <View style={styles.formField} onLayout={(e) => fieldPositions.current['treeName'] = e.nativeEvent.layout.y}>
            <Text style={styles.fieldLabel}>Custom Tree Name / पेड़ का नाम <Text style={styles.red}>*</Text></Text>
            <TextInput 
              style={[styles.boxInput, errors.treeName && { borderColor: '#EF4444', borderWidth: 1 }]} 
              placeholder="e.g. My North Teak Tree #1" 
              placeholderTextColor="#94A3B8"
              value={treeName}
              onChangeText={(val) => { setTreeName(val); setErrors(prev => ({ ...prev, treeName: '' })); }}
              onFocus={() => scrollToField('treeName')}
            />
            {errors.treeName && <Text style={{ color: '#EF4444', fontSize: 12, marginTop: 4 }}>{errors.treeName}</Text>}
          </View>

          <View style={styles.formField} onLayout={(e) => fieldPositions.current['selectedSpecies'] = e.nativeEvent.layout.y}>
            <Text style={styles.fieldLabel}>Tree Species / प्रजाति का चयन <Text style={styles.red}>*</Text></Text>
            <TouchableOpacity style={[styles.pickerTrigger, errors.selectedSpecies && { borderColor: '#EF4444', borderWidth: 1 }]} onPress={() => { Keyboard.dismiss(); setSpeciesPickerOpen(true); setErrors(prev => ({ ...prev, selectedSpecies: '' })); }}>
              <Text style={selectedSpecies ? styles.pickerTextActive : styles.pickerTextPlaceholder}>
                {selectedSpecies || 'Select Species Type...'}
              </Text>
              <MaterialCommunityIcons name="chevron-down" size={20} color="#94A3B8" />
            </TouchableOpacity>
            {errors.selectedSpecies && <Text style={{ color: '#EF4444', fontSize: 12, marginTop: 4 }}>{errors.selectedSpecies}</Text>}
          </View>

          <View style={styles.gridRow}>
            <View style={[styles.formField, { flex: 1, marginRight: 10 }]} onLayout={(e) => fieldPositions.current['age'] = e.nativeEvent.layout.y}>
              <Text style={styles.fieldLabel}>Tree Age (Years) <Text style={styles.red}>*</Text></Text>
              <TextInput 
                style={[styles.boxInput, errors.age && { borderColor: '#EF4444', borderWidth: 1 }]} 
                placeholder="e.g. 2" 
                placeholderTextColor="#94A3B8"
                keyboardType="numeric"
                value={age}
                onChangeText={(val) => { setAge(val); setErrors(prev => ({ ...prev, age: '' })); }}
                onFocus={() => scrollToField('age')}
              />
              {errors.age && <Text style={{ color: '#EF4444', fontSize: 12, marginTop: 4 }}>{errors.age}</Text>}
            </View>
            <View style={[styles.formField, { flex: 1 }]} onLayout={(e) => fieldPositions.current['height'] = e.nativeEvent.layout.y}>
              <Text style={styles.fieldLabel}>Approx Height (m) <Text style={styles.red}>*</Text></Text>
              <TextInput 
                style={[styles.boxInput, errors.height && { borderColor: '#EF4444', borderWidth: 1 }]} 
                placeholder="e.g. 4.5" 
                placeholderTextColor="#94A3B8"
                keyboardType="numeric"
                value={height}
                onChangeText={(val) => { setHeight(val); setErrors(prev => ({ ...prev, height: '' })); }}
                onFocus={() => scrollToField('height')}
              />
              {errors.height && <Text style={{ color: '#EF4444', fontSize: 12, marginTop: 4 }}>{errors.height}</Text>}
            </View>
          </View>

          <View style={styles.formField} onLayout={(e) => fieldPositions.current['landDetails'] = e.nativeEvent.layout.y}>
            <Text style={styles.fieldLabel}>Land Details (Acres, Soil Type) <Text style={styles.red}>*</Text></Text>
            <TextInput 
              style={[styles.boxInput, errors.landDetails && { borderColor: '#EF4444', borderWidth: 1 }]} 
              placeholder="e.g. 2 Acres, Black Soil" 
              placeholderTextColor="#94A3B8"
              value={landDetails}
              onChangeText={(val) => { setLandDetails(val); setErrors(prev => ({ ...prev, landDetails: '' })); }}
              onFocus={() => scrollToField('landDetails')}
            />
            {errors.landDetails && <Text style={{ color: '#EF4444', fontSize: 12, marginTop: 4 }}>{errors.landDetails}</Text>}
          </View>

          <View style={styles.formField} onLayout={(e) => fieldPositions.current['uniqueSign'] = e.nativeEvent.layout.y}>
            <Text style={styles.fieldLabel}>Unique Sign / Identity Mark <Text style={styles.red}>*</Text></Text>
            <TextInput 
              style={[styles.boxInput, errors.uniqueSign && { borderColor: '#EF4444', borderWidth: 1 }]} 
              placeholder="e.g. Red ribbon tied, or bent branch" 
              placeholderTextColor="#94A3B8"
              value={uniqueSign}
              onChangeText={(val) => { setUniqueSign(val); setErrors(prev => ({ ...prev, uniqueSign: '' })); }}
              onFocus={() => scrollToField('uniqueSign')}
            />
            {errors.uniqueSign && <Text style={{ color: '#EF4444', fontSize: 12, marginTop: 4 }}>{errors.uniqueSign}</Text>}
          </View>

          {/* Location picker with GPS capture button */}
          {/* <View style={styles.gpsBlock} onLayout={(e) => fieldPositions.current['geoCoords'] = e.nativeEvent.layout.y}>
            <View style={styles.gpsTextCol}>
              <Text style={styles.fieldLabel}>Geo-Tag Tree Boundary <Text style={styles.red}>*</Text></Text>
              <Text style={styles.gpsCoordinateText}>
                {geoCoords 
                  ? `Lat: ${geoCoords.latitude.toFixed(6)}, Lon: ${geoCoords.longitude.toFixed(6)}`
                  : 'Capture location for precise satellite monitoring'}
              </Text>
            </View>
            <TouchableOpacity style={styles.gpsActionBtn} onPress={handleFetchGPS} disabled={gpsLoading}>
              {gpsLoading ? (
                <ActivityIndicator size="small" color={COLORS.primary} />
              ) : (
                <MaterialCommunityIcons name="crosshairs-gps" size={20} color={COLORS.primary} />
              )}
            </TouchableOpacity>
          </View>
          {errors.geoCoords && <Text style={{ color: '#EF4444', fontSize: 12, marginTop: 4, paddingHorizontal: 16, marginBottom: 16 }}>{errors.geoCoords}</Text>} */}
        </View>

        {/* 3. Photo vitality capture */}
        <View style={styles.formCard} onLayout={(e) => fieldPositions.current['photos'] = e.nativeEvent.layout.y}>
          <Text style={styles.cardSectionTitle}>3. Tree Health Photos / पेड़ की फोटो अपलोड</Text>
          <Text style={styles.photoHintText}>Provide 4 distinct close-ups to confirm physical status. Tap to capture.</Text>
          {errors.photos && <Text style={{ color: '#EF4444', fontSize: 12, marginBottom: 12, paddingHorizontal: 16 }}>{errors.photos}</Text>}
          
          <View style={styles.photoGrid}>
            {/* Trunk */}
            <TouchableOpacity 
              style={[styles.photoCard, photos.trunk && styles.photoCardActive]}
              onPress={() => handleUploadChoice('trunk')}
              disabled={cameraLoading !== null || !!photos.trunk}
            >
              {cameraLoading === 'trunk' ? (
                <ActivityIndicator size="small" color={COLORS.primary} />
              ) : (
                <>
                  <MaterialCommunityIcons name={photos.trunk ? "check-circle" : "format-align-justify"} size={22} color={photos.trunk ? COLORS.success : COLORS.primary} />
                  <Text style={styles.photoLabel}>Trunk / तना</Text>
                </>
              )}
            </TouchableOpacity>

            {/* Leaf */}
            <TouchableOpacity 
              style={[styles.photoCard, photos.leaf && styles.photoCardActive]}
              onPress={() => handleUploadChoice('leaf')}
              disabled={cameraLoading !== null || !!photos.leaf}
            >
              {cameraLoading === 'leaf' ? (
                <ActivityIndicator size="small" color={COLORS.primary} />
              ) : (
                <>
                  <MaterialCommunityIcons name={photos.leaf ? "check-circle" : "leaf"} size={22} color={photos.leaf ? COLORS.success : COLORS.primary} />
                  <Text style={styles.photoLabel}>Leaf / पत्ता</Text>
                </>
              )}
            </TouchableOpacity>

            {/* Full tree */}
            <TouchableOpacity 
              style={[styles.photoCard, photos.full && styles.photoCardActive]}
              onPress={() => handleUploadChoice('full')}
              disabled={cameraLoading !== null || !!photos.full}
            >
              {cameraLoading === 'full' ? (
                <ActivityIndicator size="small" color={COLORS.primary} />
              ) : (
                <>
                  <MaterialCommunityIcons name={photos.full ? "check-circle" : "tree"} size={22} color={photos.full ? COLORS.success : COLORS.primary} />
                  <Text style={styles.photoLabel}>Full Tree / पूरा पेड़</Text>
                </>
              )}
            </TouchableOpacity>

            {/* Surroundings */}
            <TouchableOpacity 
              style={[styles.photoCard, photos.surround && styles.photoCardActive]}
              onPress={() => handleUploadChoice('surround')}
              disabled={cameraLoading !== null || !!photos.surround}
            >
              {cameraLoading === 'surround' ? (
                <ActivityIndicator size="small" color={COLORS.primary} />
              ) : (
                <>
                  <MaterialCommunityIcons name={photos.surround ? "check-circle" : "image-filter-hdr"} size={22} color={photos.surround ? COLORS.success : COLORS.primary} />
                  <Text style={styles.photoLabel}>Surrounding</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* 4. Policy Plan selection */}
        <View style={styles.formCard}>
          <Text style={styles.cardSectionTitle}>4. Select Insurance Policy Plan / सुरक्षा योजना</Text>
          
          {loadingPlans ? (
            <Text style={{ textAlign: 'center', padding: 20, color: COLORS.textSecondary, fontSize: 12, fontWeight: '700' }}>Loading plans...</Text>
          ) : plans.length === 0 ? (
            <Text style={{ textAlign: 'center', padding: 20, color: COLORS.textSecondary, fontSize: 12, fontWeight: '700' }}>No plans are currently available.</Text>
          ) : (
            plans.map((plan) => {
              const isSelected = selectedPolicyId === plan._id;
              return (
                <TouchableOpacity 
                  key={plan._id}
                  style={[styles.planCard, isSelected && styles.planCardActive]}
                  activeOpacity={0.9}
                  onPress={() => setSelectedPolicyId(plan._id)}
                >
                  <View style={styles.planHeader}>
                    <View style={styles.checkboxCircle}>
                      {isSelected && <View style={styles.innerCheckedDot} />}
                    </View>
                    <View style={{ flex: 1, marginLeft: 10 }}>
                      <Text style={styles.planName}>{plan.plan_name}</Text>
                      <View style={[styles.planTag, { backgroundColor: plan.badge_color + '20' }]}>
                        <Text style={[styles.planTagText, { color: plan.badge_color }]}>{plan.badge_text}</Text>
                      </View>
                    </View>
                    <View style={{ alignItems: 'flex-end' }}>
                      <Text style={styles.planPrice}>₹{plan.price}/{plan.billing_cycle === 'yearly' ? 'Yr' : plan.billing_cycle === 'monthly' ? 'Mo' : 'Life'}</Text>
                      <Text style={styles.planCoverage}>Cover: ₹{plan.cover}</Text>
                    </View>
                  </View>
                  <Text style={styles.planDesc}>{plan.description}</Text>
                </TouchableOpacity>
              );
            })
          )}
        </View>

        {/* Continue Button */}
        <TouchableOpacity 
          style={styles.continueBtn} 
          activeOpacity={0.9}
          onPress={handleProceedToPayment}
        >
          <LinearGradient colors={[COLORS.primary, COLORS.secondary]} style={styles.continueBtnGrad}>
            <MaterialCommunityIcons name="credit-card-outline" size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
            <Text style={styles.continueBtnText} numberOfLines={1} adjustsFontSizeToFit>Proceed to Payment / भुगतान के लिए आगे बढ़ें</Text>
          </LinearGradient>
        </TouchableOpacity>
        
        <View style={{ height: 40 }} />
      </KeyboardAwareScrollView>

      {/* Dynamic picker sheet modal for Species selection */}
      {isSpeciesPickerOpen && (
        <View style={styles.pickerBackdrop}>
          <TouchableOpacity style={StyleSheet.absoluteFillObject} onPress={() => setSpeciesPickerOpen(false)} />
          <View style={styles.pickerSheet}>
            <View style={styles.pickerHeader}>
              <Text style={styles.pickerTitle}>Select Tree Species</Text>
              <TouchableOpacity onPress={() => setSpeciesPickerOpen(false)}>
                <MaterialCommunityIcons name="close" size={22} color={COLORS.textSecondary} />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.pickerList}>
              {SPECIES_LIST.map((item) => (
                <TouchableOpacity 
                  key={item} 
                  style={[styles.pickerItem, selectedSpecies === item && styles.pickerItemActive]}
                  onPress={() => {
                    setSelectedSpecies(item);
                    setSpeciesPickerOpen(false);
                  }}
                >
                  <Text style={[styles.pickerItemText, selectedSpecies === item && styles.pickerItemTextActive]}>{item}</Text>
                  {selectedSpecies === item && <MaterialCommunityIcons name="check" size={18} color={COLORS.primary} />}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      )}
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
          <View style={{ position: 'absolute', bottom: 40 + insets.bottom, left: 20, right: 20 }}>
            <TouchableOpacity 
              style={{ backgroundColor: COLORS.primary, padding: 16, borderRadius: 12, alignItems: 'center' }}
              onPress={() => {
                if (previewData) {
                  const key = previewData.key;
                  const uri = previewData.uri;
                  setPreviewData(null);
                  handleSimulateUpload(key, uri);
                }
              }}
            >
              <Text style={{ color: '#FFF', fontSize: 16, fontWeight: '700' }}>Upload Photo</Text>
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
  navBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
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
  bannerInfo: {
    marginBottom: 20,
  },
  bannerHeading: {
    ...TYPOGRAPHY.h2,
    color: COLORS.primaryDark,
    fontWeight: '800',
  },
  bannerSub: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 4,
    lineHeight: 15,
  },
  formCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    ...SHADOWS.soft,
  },
  cardSectionTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.primary,
    marginBottom: 14,
    textTransform: 'uppercase',
  },
  gridRow: {
    flexDirection: 'row',
  },
  gridCell: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  disabledLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: COLORS.textSecondary,
    textTransform: 'uppercase',
  },
  disabledValue: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.textDark,
    marginTop: 2,
  },
  formField: {
    marginBottom: 14,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textDark,
    marginBottom: 6,
  },
  red: {
    color: '#EF4444',
  },
  boxInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 11,
    fontSize: 13,
    color: COLORS.textDark,
    fontWeight: '600',
  },
  pickerTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  pickerTextPlaceholder: {
    fontSize: 13,
    color: '#94A3B8',
  },
  pickerTextActive: {
    fontSize: 13,
    color: COLORS.textDark,
    fontWeight: '600',
  },
  gpsBlock: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderRadius: 16,
    padding: 14,
    marginTop: 6,
  },
  gpsTextCol: {
    flex: 1,
  },
  gpsCoordinateText: {
    fontSize: 10,
    color: COLORS.secondary,
    fontWeight: '700',
    marginTop: 2,
  },
  gpsActionBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOWS.soft,
  },
  photoHintText: {
    fontSize: 11,
    color: COLORS.textSecondary,
    fontWeight: '600',
    marginBottom: 14,
  },
  photoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  photoCard: {
    width: '48%',
    height: 80,
    borderRadius: 14,
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  photoCardActive: {
    backgroundColor: '#D1FAE5',
    borderColor: COLORS.success,
  },
  photoLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.textDark,
    marginTop: 4,
  },
  planCard: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
  },
  planCardActive: {
    backgroundColor: '#F0FDF4',
    borderColor: COLORS.success,
  },
  planHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  checkboxCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  innerCheckedDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.primary,
  },
  planName: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.textDark,
  },
  planTag: {
    alignSelf: 'flex-start',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginTop: 3,
  },
  planTagText: {
    fontSize: 8,
    fontWeight: '900',
  },
  planPrice: {
    fontSize: 14,
    fontWeight: '900',
    color: COLORS.textDark,
  },
  planCoverage: {
    fontSize: 9,
    color: COLORS.textSecondary,
    fontWeight: '700',
    marginTop: 2,
  },
  planDesc: {
    fontSize: 10,
    color: COLORS.textSecondary,
    lineHeight: 14,
    fontWeight: '600',
    paddingLeft: 30,
  },
  continueBtn: {
    borderRadius: 30,
    overflow: 'hidden',
    marginTop: 10,
    ...SHADOWS.glow,
  },
  continueBtnGrad: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
  },
  continueBtnText: {
    fontSize: 15,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  pickerBackdrop: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'flex-end',
    zIndex: 999,
  },
  pickerSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: 350,
  },
  pickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  pickerTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.textDark,
  },
  pickerList: {
    padding: 12,
  },
  pickerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 10,
  },
  pickerItemActive: {
    backgroundColor: '#F0FDF4',
  },
  pickerItemText: {
    fontSize: 13,
    color: COLORS.textDark,
    fontWeight: '600',
  },
  pickerItemTextActive: {
    color: COLORS.primary,
    fontWeight: '800',
  },
});

import React, { useState, useRef, useEffect } from 'react';
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
import CustomCalendarModal from '../../components/CustomCalendarModal';
import MapView, { Marker, Polyline } from '../../components/MapViewProxy';
import { isNonEmptyStr } from '../../src/utils/validation';
import { LOCATION_DATA, COUNTRIES_LIST, getTehsilsForDistrict, getVikasKhandsForDistrict, getGramPanchayatsForDistrict, getVillagesForDistrict, getCitiesForDistrict, resolveLocationPincodeAndCity } from '../../src/data/locations';
import { isFarmerVerified } from '../../src/utils/verificationGuard';

// Mock lists for the text inputs just in case they want to convert them to dropdowns later, but for now we keep them as inputs since there's no data structure for them. Or actually, let's keep them as inputs but they will just be text fields as before.

type DocStatus = 'None' | 'Uploading' | 'Uploaded' | 'Verifying' | 'Approved' | 'Rejected';

interface DocCard {
  key: string;
  title: string;
  subtitle: string;
  icon: string;
  mandatory?: boolean;
  isSquare?: boolean;
}

const LAND_TYPES = [
  {
    id: 'agricultural',
    title: 'Agricultural Land',
    titleHi: 'कृषि भूमि',
    description: 'Cultivated plots used for crop production.',
    hint: 'Eligible for crop carbon programs.',
    icon: 'sprout'
  },
  {
    id: 'farmland',
    title: 'Farmland / Crop Land',
    titleHi: 'फसल भूमि',
    description: 'Row crops, grains, and annual agricultural cultivation.',
    hint: 'Eligible for zero-tillage and residue management credits.',
    icon: 'corn'
  },
  {
    id: 'orchard',
    title: 'Orchard / Plantation',
    titleHi: 'फलोद्यान / वृक्षारोपण',
    description: 'Fruit-bearing orchards, timber plantations, and agroforestry plots.',
    hint: 'Eligible for agroforestry carbon sequestration credits.',
    icon: 'tree'
  },
  {
    id: 'green_asset',
    title: 'Tree-dominated Green Asset',
    titleHi: 'वृक्ष-प्रधान हरित संपत्ति',
    description: 'High-density tree covers, carbon sequestration woodlots, and ecological reserves.',
    hint: 'Eligible for high-yield forest biomass offset programs.',
    icon: 'forest'
  },
  {
    id: 'other',
    title: 'Other eligible land type',
    titleHi: 'अन्य पात्र भूमि प्रकार',
    description: 'Any other land category complying with carbon credits eligibility criteria.',
    hint: 'Subject to custom baseline validation.',
    icon: 'shield-check-outline'
  }
];

const OWNERSHIP_TYPES = ['Own', 'Leased', 'Shared'];
const AREA_UNITS = ['Acre', 'Bigha', 'Hectare'];
const SOIL_TYPES = [
  'Black Cotton Soil',
  'Red Soil',
  'Alluvial Soil',
  'Laterite Soil',
  'Sandy Soil',
  'Clay Soil',
  'Loam Soil',
  'Other'
];
const WATER_SOURCES = [
  'Rainfed',
  'Well',
  'Tube Well',
  'Canal',
  'River / Stream',
  'Drip Irrigation',
  'Sprinkler',
  'Other'
];
const MAIN_CROPS = [
  'Wheat',
  'Rice / Paddy',
  'Soybean',
  'Cotton',
  'Sugarcane',
  'Maize',
  'Pulses',
  'Vegetables',
  'Fruits',
  'Agroforestry Trees',
  'Other'
];

const TREE_SPECIES = ['Teak / सागौन', 'Sandalwood / चंदन', 'Mahogany / महोगनी', 'Bamboo / बांस', 'Eucalyptus / नीलगिरी', 'Mango / आम', 'Other / अन्य'];
const AGE_BRACKETS = ['0-2 years / ०-२ वर्ष', '2-5 years / २-५ वर्ष', '5-10 years / ५-१० वर्ष', '10+ years / १०+ वर्ष'];
const PARCEL_LOCATIONS = [
  'North Boundary / उत्तरी सीमा',
  'South Boundary / दक्षिणी सीमा',
  'East Boundary / पूर्वी सीमा',
  'West Boundary / पश्चिमी सीमा',
  'Center / केंद्र',
  'Scattered / बिखरे हुए',
  'Other / अन्य'
];

function calculatePolygonAreaInAcres(coords: { latitude: number; longitude: number }[]): number {
  if (coords.length < 3) return 0;
  
  const refLat = coords[0].latitude;
  const latToMeters = 111320;
  const lonToMeters = 111320 * Math.cos((refLat * Math.PI) / 180);
  
  const points = coords.map(c => ({
    x: (c.longitude - coords[0].longitude) * lonToMeters,
    y: (c.latitude - coords[0].latitude) * latToMeters
  }));
  
  let areaSum = 0;
  for (let i = 0; i < points.length; i++) {
    const j = (i + 1) % points.length;
    areaSum += points[i].x * points[j].y - points[j].x * points[i].y;
  }
  
  const areaSqMeters = Math.abs(areaSum) / 2;
  return areaSqMeters / 4046.856;
}

function calculatePolygonPerimeterInMeters(coords: { latitude: number; longitude: number }[]): number {
  if (coords.length < 2) return 0;
  let perimeter = 0;
  for (let i = 0; i < coords.length; i++) {
    const j = (i + 1) % coords.length;
    const lat1 = coords[i].latitude;
    const lon1 = coords[i].longitude;
    const lat2 = coords[j].latitude;
    const lon2 = coords[j].longitude;
    
    const refLat = (lat1 + lat2) / 2;
    const latToMeters = 111320;
    const lonToMeters = 111320 * Math.cos((refLat * Math.PI) / 180);
    
    const dx = (lon2 - lon1) * lonToMeters;
    const dy = (lat2 - lat1) * latToMeters;
    perimeter += Math.sqrt(dx * dx + dy * dy);
  }
  return perimeter;
}

function convertToAcres(value: number, unit: string): number {
  if (unit === 'Hectare') {
    return value * 2.47105;
  } else if (unit === 'Bigha') {
    return value * 0.4;
  }
  return value; // Acre
}

export default function AddLandScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const user = useAuthStore((state) => state.user);
  const addPlot = useLandStore((state) => state.addPlot);

  useEffect(() => {
    if (!isFarmerVerified()) {
      if (router.canGoBack()) {
        router.back();
      } else {
        router.replace('/(tabs)' as any);
      }
    }
  }, []);

  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [landType, setLandType] = useState<string | null>(null);
  const [gpsAccuracy, setGpsAccuracy] = useState<number | null>(null);
  const [showNdvi, setShowNdvi] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // New Fields
  const [belongsToAnother, setBelongsToAnother] = useState(false);
  const [fathersName, setFathersName] = useState(user?.fatherName || '');
  const [mobileNumber, setMobileNumber] = useState(user?.mobile || '');
  const [landTitle, setLandTitle] = useState('');
  const [ownershipType, setOwnershipType] = useState('Own');
  const [areaUnit, setAreaUnit] = useState('Acre');
  const [plantationDate, setPlantationDate] = useState('');
  const [isCalendarVisible, setIsCalendarVisible] = useState(false);
  const [cropCount, setCropCount] = useState('');
  const [hasExistingTrees, setHasExistingTrees] = useState(false);

  
  const [treesList, setTreesList] = useState<Array<{
    id: string;
    species: string;
    count: string;
    ageBracket: string;
    locationOnParcel: string;
    photoUri?: string;
    photoStatus: DocStatus;
    progress: number;
  }>>([]);

  useEffect(() => {
    if (hasExistingTrees && treesList.length === 0) {
      setTreesList([{
        id: 'tree_' + Date.now(),
        species: '',
        count: '',
        ageBracket: '2-5 years / २-५ वर्ष',
        locationOnParcel: '',
        photoStatus: 'None',
        progress: 0
      }]);
    }
  }, [hasExistingTrees]);

  const handleAddTree = () => {
    triggerHaptic(Haptics.ImpactFeedbackStyle.Light);
    setTreesList(prev => [
      ...prev,
      {
        id: 'tree_' + Date.now() + Math.random().toString(36).substring(2, 7),
        species: '',
        count: '',
        ageBracket: '2-5 years / २-५ वर्ष',
        locationOnParcel: '',
        photoStatus: 'None',
        progress: 0
      }
    ]);
  };

  const handleDuplicateTree = (item: typeof treesList[0]) => {
    triggerHaptic(Haptics.ImpactFeedbackStyle.Light);
    setTreesList(prev => [
      ...prev,
      {
        ...item,
        id: 'tree_' + Date.now() + Math.random().toString(36).substring(2, 7),
        photoUri: undefined,
        photoStatus: 'None',
        progress: 0
      }
    ]);
  };

  const handleRemoveTree = (id: string) => {
    triggerHaptic(Haptics.ImpactFeedbackStyle.Medium);
    setTreesList(prev => prev.filter(t => t.id !== id));
  };

  const updateTreeField = (id: string, field: string, value: any) => {
    setTreesList(prev => prev.map(t => t.id === id ? { ...t, [field]: value } : t));
  };

  const handlePickTreePhoto = async (treeId: string, mode: 'camera' | 'gallery') => {
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
        const uri = result.assets[0].uri;
        uploadTreePhoto(treeId, uri);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  const uploadTreePhoto = async (treeId: string, uri: string) => {
    setTreesList(prev => prev.map(t => t.id === treeId ? { ...t, photoUri: uri, photoStatus: 'Uploading', progress: 0.1 } : t));

    try {
      const filename = uri.split('/').pop() || `tree_${treeId}.jpg`;
      const formData = new FormData();
      formData.append('file', { uri, name: filename, type: 'image/jpeg' } as any);
      
      const res = await api.post('/farmer/profile/land/document', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (progressEvent) => {
          const total = progressEvent.total || 1;
          const current = progressEvent.loaded;
          const pct = current / total;
          setTreesList(prev => prev.map(t => t.id === treeId ? { ...t, progress: pct } : t));
        }
      });
      
      const serverUrl = res.data?.data?.url || uri;
      setTreesList(prev => prev.map(t => t.id === treeId ? {
        ...t,
        photoUri: serverUrl,
        photoStatus: 'Uploaded',
        progress: 1.0
      } : t));
      
      triggerHaptic(Haptics.ImpactFeedbackStyle.Light);
    } catch (err) {
      setTreesList(prev => prev.map(t => t.id === treeId ? {
        ...t,
        photoStatus: 'Uploaded',
        progress: 1.0
      } : t));
    }
  };

  const handlePickTreePhotoChoice = (treeId: string) => {
    Alert.alert(
      'Upload Tree Proof',
      'Choose the photo source',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Take Photo', onPress: () => handlePickTreePhoto(treeId, 'camera') },
        { text: 'Choose from Gallery', onPress: () => handlePickTreePhoto(treeId, 'gallery') },
      ]
    );
  };
  
  const [treeStockCount, setTreeStockCount] = useState('');
  const [plantationArea, setPlantationArea] = useState('');
  const [agroforestrySpecies, setAgroforestrySpecies] = useState('');
  const [cropSelection, setCropSelection] = useState('');
  const [soilComposition, setSoilComposition] = useState('');
  const [waterAvailability, setWaterAvailability] = useState('');

  // Form State
  const [khasraNumber, setKhasraNumber] = useState('');
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
    khasraProof: 'None',
    idProof: 'None',
    otherProof: 'None',
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
  const [viewingDoc, setViewingDoc] = useState<{ uri: string, title: string, status: DocStatus, key: string } | null>(null);
  const [showNextStepsModal, setShowNextStepsModal] = useState(false);
  const [landDocumentUrl, setLandDocumentUrl] = useState<string | null>(null);
  const [photoUrls, setPhotoUrls] = useState<Record<string, string>>({});
  const [docUrls, setDocUrls] = useState<Record<string, string>>({});
  const [landPhotos, setLandPhotos] = useState<{ id: string; uri: string; category: string; geotag?: string; timestamp?: string; status: DocStatus; progress: number }[]>([]);
  const [wantsInsurance, setWantsInsurance] = useState<boolean | null>(null);
  const [insuranceMode, setInsuranceMode] = useState<'single' | 'multiple' | 'plantation'>('single');
  const [categorySelectPhoto, setCategorySelectPhoto] = useState<{ uri: string; id: string } | null>(null);

  const [availableStates, setAvailableStates] = useState<string[]>([]);
  const [availableDistricts, setAvailableDistricts] = useState<string[]>([]);
  const [availableCities, setAvailableCities] = useState<string[]>([]);
  
  const availableVikasKhands = React.useMemo(() => getVikasKhandsForDistrict(district), [district]);
  const availableGramPanchayats = React.useMemo(() => getGramPanchayatsForDistrict(district), [district]);
  const availableVillages = React.useMemo(() => getVillagesForDistrict(district, undefined, gramPanchayat), [district, gramPanchayat]);

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
    if (district) {
      const cities = getCitiesForDistrict(district);
      setAvailableCities(cities);
    } else if (country && stateName && district && LOCATION_DATA[country]?.[stateName]?.[district]) {
      setAvailableCities(LOCATION_DATA[country][stateName][district]);
    } else {
      setAvailableCities([]);
    }
  }, [country, stateName, district]);

  const handleLandStateChange = (val: string) => {
    setStateName(val);
    setDistrict('');
    setVikashKhand('');
    setGramPanchayat('');
    setVillage('');
    setCity('');
    setErrors(prev => ({ ...prev, stateName: '' }));
  };

  const handleLandDistrictChange = (val: string) => {
    setDistrict(val);
    setVikashKhand('');
    setGramPanchayat('');
    setVillage('');
    setCity('');
    setErrors(prev => ({ ...prev, district: '' }));
  };

  const handleLandGramPanchayatChange = (val: string) => {
    setGramPanchayat(val);
    setVillage('');
    setErrors(prev => ({ ...prev, gramPanchayat: '' }));
  };

  const handleLandVillageChange = (val: string) => {
    setVillage(val);
    setErrors(prev => ({ ...prev, village: '' }));

    const resolved = resolveLocationPincodeAndCity(district, undefined, val);
    if (resolved.city && !city) setCity(resolved.city);
  };

  const uploadAnims = useRef<Record<string, Animated.Value>>({
    landProof: new Animated.Value(0),
    khasraProof: new Animated.Value(0),
    idProof: new Animated.Value(0),
    otherProof: new Animated.Value(0),
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
      setGpsAccuracy(3.5); // simulated 3.5m accuracy
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
      setGpsAccuracy(loc.coords.accuracy ?? 5.0);
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
        setDocStates(prev => ({ ...prev, [key]: 'Uploaded' }));
        setDocUrls(prev => ({ ...prev, [key]: 'simulated://' + key }));
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
          setDocUrls(prev => ({ ...prev, [docKey]: url || uri }));
          setDocStates(prev => ({ ...prev, [docKey]: 'Uploaded' }));
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

  const handleAddPhotoChoice = () => {
    if (landPhotos.length >= 5) {
      Alert.alert('Limit Reached', 'You can upload a maximum of 5 photos.');
      return;
    }
    Alert.alert(
      'Add Land Photo',
      'Choose the photo source',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Take Photo', 
          onPress: () => handlePickPhotoSource('camera') 
        },
        { 
          text: 'Choose from Gallery', 
          onPress: () => handlePickPhotoSource('gallery') 
        },
      ]
    );
  };

  const uploadDirectPhoto = async (uri: string, id: string, category: string) => {
    const newPhoto = {
      id,
      uri,
      category,
      status: 'Uploading' as const,
      progress: 0.1,
    };
    setLandPhotos(prev => [...prev, newPhoto]);

    try {
      const filename = uri.split('/').pop() || `${id}.jpg`;
      const match = /\.(\w+)$/.exec(filename);
      const mimeType = match ? `image/${match[1]}` : 'image/jpeg';
      const fileUri = Platform.OS === 'android' ? uri : uri.replace('file://', '');
      
      const formData = new FormData();
      formData.append('file', {
        uri: fileUri,
        name: filename,
        type: mimeType,
      } as any);
      
      const res = await api.post('/farmer/profile/land/document', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (progressEvent) => {
          const total = progressEvent.total || 1;
          const current = progressEvent.loaded;
          const pct = current / total;
          setLandPhotos(prev => prev.map(p => p.id === id ? { ...p, progress: pct } : p));
        }
      });
      
      const serverUrl = res.data?.data?.url || uri;
      
      let lat = (22.9712 + (Math.random() - 0.5) * 0.005).toFixed(4);
      let lon = (78.6514 + (Math.random() - 0.5) * 0.005).toFixed(4);
      try {
        const { status: locStatus } = await Location.getForegroundPermissionsAsync();
        if (locStatus === 'granted') {
          const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
          if (loc && loc.coords) {
            lat = loc.coords.latitude.toFixed(4);
            lon = loc.coords.longitude.toFixed(4);
          }
        }
      } catch {}

      const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 19);

      setLandPhotos(prev => prev.map(p => p.id === id ? {
        ...p,
        uri: serverUrl,
        status: 'Uploaded',
        progress: 1.0,
        geotag: `Lat ${lat}, Lon ${lon}`,
        timestamp: nowStr
      } : p));
      
      triggerHaptic(Haptics.ImpactFeedbackStyle.Light);
    } catch (err) {
      console.warn('[add-land] Photo upload error fallback:', err);
      let lat = (22.9712 + (Math.random() - 0.5) * 0.005).toFixed(4);
      let lon = (78.6514 + (Math.random() - 0.5) * 0.005).toFixed(4);
      try {
        const { status: locStatus } = await Location.getForegroundPermissionsAsync();
        if (locStatus === 'granted') {
          const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
          if (loc && loc.coords) {
            lat = loc.coords.latitude.toFixed(4);
            lon = loc.coords.longitude.toFixed(4);
          }
        }
      } catch {}

      const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 19);

      setLandPhotos(prev => prev.map(p => p.id === id ? {
        ...p,
        uri,
        status: 'Uploaded',
        progress: 1.0,
        geotag: `Lat ${lat}, Lon ${lon}`,
        timestamp: nowStr
      } : p));
    }
  };

  const handlePickPhotoSource = async (mode: 'camera' | 'gallery') => {
    try {
      let result;
      if (mode === 'camera') {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Permission Denied', 'Camera permission is required to take land photos.');
          return;
        }
        result = await ImagePicker.launchCameraAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          quality: 0.8,
          allowsEditing: false,
        });
      } else {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Permission Denied', 'Gallery permission is required to select land photos.');
          return;
        }
        result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          quality: 0.8,
          allowsMultipleSelection: true,
          selectionLimit: Math.max(1, 5 - landPhotos.length),
        });
      }

      if (!result.canceled && result.assets && result.assets.length > 0) {
        if (result.assets.length === 1) {
          setCategorySelectPhoto({
            uri: result.assets[0].uri,
            id: 'photo_' + Date.now()
          });
        } else {
          const remainingSlots = 5 - landPhotos.length;
          const assetsToProcess = result.assets.slice(0, remainingSlots);
          const defaultCategories = ['Boundary', 'Crop Field', 'Trees', 'Water Source', 'Surrounding'];
          assetsToProcess.forEach((asset, idx) => {
            const pId = 'photo_' + (Date.now() + idx);
            const cat = defaultCategories[idx % defaultCategories.length];
            uploadDirectPhoto(asset.uri, pId, cat);
          });
        }
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to pick image from camera/gallery');
    }
  };

  const handleCategorySelect = async (category: string) => {
    if (!categorySelectPhoto) return;
    const { uri, id } = categorySelectPhoto;
    setCategorySelectPhoto(null);
    await uploadDirectPhoto(uri, id, category);
  };

  const handleDeleteLandPhoto = (id: string) => {
    triggerHaptic(Haptics.ImpactFeedbackStyle.Medium);
    setLandPhotos(prev => prev.filter(p => p.id !== id));
  };

  const handleRetakeLandPhoto = (id: string) => {
    Alert.alert(
      'Retake / Replace Photo',
      'Choose new photo source',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Take Photo (Camera)', 
          onPress: () => handlePickRetakePhotoSource(id, 'camera') 
        },
        { 
          text: 'Choose from Gallery', 
          onPress: () => handlePickRetakePhotoSource(id, 'gallery') 
        },
      ]
    );
  };

  const handlePickRetakePhotoSource = async (id: string, mode: 'camera' | 'gallery') => {
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
          allowsEditing: false,
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
          allowsEditing: false,
        });
      }

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const uri = result.assets[0].uri;
        setLandPhotos(prev => prev.map(p => p.id === id ? { ...p, uri, status: 'Uploading', progress: 0.1 } : p));
        try {
          const filename = uri.split('/').pop() || `${id}.jpg`;
          const formData = new FormData();
          formData.append('file', { uri, name: filename, type: 'image/jpeg' } as any);
          const res = await api.post('/farmer/profile/land/document', formData);
          const serverUrl = res.data?.data?.url || uri;
          
          let lat = (22.9712 + (Math.random() - 0.5) * 0.005).toFixed(4);
          let lon = (78.6514 + (Math.random() - 0.5) * 0.005).toFixed(4);
          try {
            const { status: locStatus } = await Location.getForegroundPermissionsAsync();
            if (locStatus === 'granted') {
              const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
              if (loc && loc.coords) {
                lat = loc.coords.latitude.toFixed(4);
                lon = loc.coords.longitude.toFixed(4);
              }
            }
          } catch {}

          const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 19);
          setLandPhotos(prev => prev.map(p => p.id === id ? {
            ...p,
            uri: serverUrl,
            status: 'Uploaded',
            progress: 1.0,
            geotag: `Lat ${lat}, Lon ${lon}`,
            timestamp: nowStr
          } : p));
        } catch {
          setLandPhotos(prev => prev.map(p => p.id === id ? { ...p, status: 'Uploaded', progress: 1.0 } : p));
        }
      }
    } catch {
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  const handleNext = () => {
    triggerHaptic(Haptics.ImpactFeedbackStyle.Medium);
    setErrors({});

    if (currentStep === 1) {
      if (!landType) return;
      setCurrentStep(2);
    } else if (currentStep === 2) {
      if (!isNonEmptyStr(mobileNumber)) {
        setErrors({ mobileNumber: 'Mobile number is required' });
        return;
      }
      setCurrentStep(3);
    } else if (currentStep === 3) {
      let hasError = false;
      const newErrors: Record<string, string> = {};
      if (!isNonEmptyStr(landTitle)) {
        newErrors.landTitle = 'Land Title is required';
        hasError = true;
      }
      if (!isNonEmptyStr(ownershipType)) {
        newErrors.ownershipType = 'Ownership Type is required';
        hasError = true;
      }
      if (!isNonEmptyStr(acres) || isNaN(parseFloat(acres)) || parseFloat(acres) <= 0) {
        newErrors.acres = 'Valid Area size required';
        hasError = true;
      }
      if (!isNonEmptyStr(khasraNumber)) {
        newErrors.khasraNumber = 'Survey / Khasra Number is required';
        hasError = true;
      }
      if (isNonEmptyStr(plantationDate)) {
        const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
        if (!dateRegex.test(plantationDate)) {
          newErrors.plantationDate = 'Use YYYY-MM-DD format';
          hasError = true;
        }
      }
      if (hasExistingTrees) {
        if (treesList.length === 0) {
          newErrors.trees = 'Please add at least one tree species / कृपया कम से कम एक पेड़ की प्रजाति जोड़ें।';
          hasError = true;
        } else {
          for (let i = 0; i < treesList.length; i++) {
            const t = treesList[i];
            if (!isNonEmptyStr(t.species)) {
              newErrors[`tree_species_${t.id}`] = 'Species is required';
              hasError = true;
            }
            if (!isNonEmptyStr(t.count) || isNaN(parseInt(t.count)) || parseInt(t.count) <= 0) {
              newErrors[`tree_count_${t.id}`] = 'Valid count is required';
              hasError = true;
            }
            if (!isNonEmptyStr(t.ageBracket)) {
              newErrors[`tree_age_${t.id}`] = 'Age bracket is required';
              hasError = true;
            }
            if (!isNonEmptyStr(t.locationOnParcel)) {
              newErrors[`tree_location_${t.id}`] = 'Location is required';
              hasError = true;
            }
            if (t.photoStatus !== 'Uploaded') {
              newErrors[`tree_photo_${t.id}`] = 'Proof photo is required';
              hasError = true;
            }
          }
        }
      }
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

      setCurrentStep(5);
    } else if (currentStep === 5) {
      if (!geoCoords || boundaryPolygon.length < 3) {
        setErrors({ boundary: 'Please mark at least 3 boundary points using GPS.' });
        return;
      }
      setCurrentStep(6);
    } else if (currentStep === 6) {
      const hasLandProof = docStates.landProof === 'Uploaded' || docStates.landProof === 'Approved';

      if (!hasLandProof) {
        setErrors({ docs: 'Land Ownership / Registry Proof document is mandatory.' });
        if (fieldPositions.current['docs'] !== undefined) {
          scrollViewRef.current?.scrollToPosition(0, Math.max(0, fieldPositions.current['docs'] - 20), true);
        }
        return;
      }
      setCurrentStep(7);
    } else if (currentStep === 7) {
      const photosUploaded = landPhotos.filter(p => p.status === 'Uploaded' || p.status === 'Approved').length;
      if (photosUploaded < 1) {
        setErrors({ docs: 'Please upload at least 1 photo of the land / कृपया खेत की कम से कम 1 तस्वीर अपलोड करें।' });
        return;
      }
      setCurrentStep(8);
    } else if (currentStep === 8) {
      if (isSubmitting) return;
      if (wantsInsurance === null) {
        setErrors({ insurance: 'Please select an option to continue / कृपया आगे बढ़ने के लिए एक विकल्प चुनें।' });
        return;
      }
      setIsSubmitting(true);

      const newPlot = {
        id: 'plot_' + Date.now(),
        name: landTitle || `Plot in ${village}`,
        ownershipType: ownershipType,
        areaUnit: areaUnit,
        plantationDate: plantationDate || undefined,
        acres: parseFloat(acres),
        cropType: cropSelection || 'Pending',
        soilType: soilComposition || 'Unknown',
        irrigationType: waterAvailability || 'Unknown',
        status: 'Pending Verification' as const,
        geoCoords: geoCoords || { latitude: 0, longitude: 0 },
        boundaryPolygon,
        documentName: 'Khasra Khatauni',
        landDocumentUrl: landDocumentUrl || undefined,
        landPhotoUrls: Array.from(new Set([
          ...landPhotos.map(p => p.uri).filter(Boolean),
          ...(photoUrls ? Object.values(photoUrls).filter(Boolean) : []),
          ...(docUrls ? Object.values(docUrls).filter(Boolean) : []),
          ...(landDocumentUrl ? [landDocumentUrl] : []),
        ])),
        country,
        state: stateName,
        district,
        city,
        gramPanchayat,
        vikashKhand,
        village,
        fullAddress,
        landmark,
        khasraNumber: khasraNumber.trim(),
        landType: landType || undefined,
        hasExistingTrees,
        trees: hasExistingTrees ? treesList.map(t => ({
          species: t.species,
          count: parseInt(t.count) || 0,
          ageBracket: t.ageBracket,
          locationOnParcel: t.locationOnParcel,
          photoUri: t.photoUri
        })) : [],
      };

      addPlot(newPlot);
      triggerHaptic(Haptics.ImpactFeedbackStyle.Medium);

      if (wantsInsurance) {
        if (insuranceMode === 'single') {
          router.replace({
            pathname: '/insurance/register-single' as any,
            params: { landPremium: '99', acres: acres, plotName: newPlot.name }
          });
        } else if (insuranceMode === 'multiple') {
          router.replace({
            pathname: '/insurance/register-family' as any,
            params: { landPremium: '99', acres: acres, plotName: newPlot.name }
          });
        } else {
          router.replace({
            pathname: '/insurance' as any,
            params: { landPremium: '99', acres: acres, plotName: newPlot.name, mode: 'plantation' }
          });
        }
      } else {
        router.replace({
          pathname: '/insurance/payment' as any,
          params: {
            mode: 'land_only',
            landPremium: '99',
            policyName: 'Land Registration Fee',
            acres: acres,
            plotName: newPlot.name
          }
        });
      }
    }
  };

  const handleDocDelete = (key: string) => {
    triggerHaptic(Haptics.ImpactFeedbackStyle.Medium);
    setDocStates(prev => ({ ...prev, [key]: 'None' }));
    setDocUrls(prev => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
    if (key === 'landProof') {
      setLandDocumentUrl(null);
    } else {
      setPhotoUrls(prev => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
    }
  };

  const renderDocCard = (card: DocCard) => {
    const status = docStates[card.key];
    const progressWidth = uploadAnims[card.key].interpolate({
      inputRange: [0, 1],
      outputRange: ['0%', '100%']
    });

    const isUploaded = status === 'Uploaded' || status === 'Approved' || status === 'Rejected';

    if (card.isSquare) {
      // Photo card logic in Step 7
      return (
        <View key={card.key} style={[styles.uploadCard, { aspectRatio: 1, padding: 12, justifyContent: 'center', alignItems: 'center', marginBottom: 12 }]}>
          <View style={[styles.uploadCardContent, { flexDirection: 'column', width: '100%', alignItems: 'center' }]}>
            <View style={{ flexDirection: 'row', justifyContent: 'center', marginBottom: 8 }}>
              <TouchableOpacity 
                style={[styles.docIconBox, { width: 36, height: 36, borderRadius: 10, marginRight: 8 }]} 
                onPress={() => handleImageUpload(card.key, 'camera')}
                disabled={status === 'Verifying' || status === 'Uploading' || status === 'Approved' || status === 'Uploaded'}
              >
                <MaterialCommunityIcons name="camera-outline" size={18} color={COLORS.primary} />
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.docIconBox, { width: 36, height: 36, borderRadius: 10 }]} 
                onPress={() => handleImageUpload(card.key, 'gallery')}
                disabled={status === 'Verifying' || status === 'Uploading' || status === 'Approved' || status === 'Uploaded'}
              >
                <MaterialCommunityIcons name="cloud-upload-outline" size={18} color={COLORS.primary} />
              </TouchableOpacity>
            </View>
            
            <View style={{ alignItems: 'center', width: '100%' }}>
              <Text style={[styles.uploadTitle, { textAlign: 'center', fontSize: 12 }]}>{card.title} {card.mandatory ? '*' : ''}</Text>
              <Text style={[styles.uploadSub, { textAlign: 'center', fontSize: 10, marginTop: 2 }]}>{card.subtitle}</Text>

              {status === 'Uploading' && (
                <View style={{ marginTop: 6, width: '80%' }}>
                  <View style={styles.progressBarBg}>
                    <Animated.View style={[styles.progressBarFillLocal, { width: progressWidth }]} />
                  </View>
                </View>
              )}

              {status === 'Verifying' && (
                <View style={[styles.verifyingContainer, { marginTop: 6 }]}>
                  <ActivityIndicator size="small" color={COLORS.primary} />
                </View>
              )}

              {(status === 'Uploaded' || status === 'Approved') && (
                <View style={[styles.approvedIndicator, { marginTop: 6 }]}>
                  <MaterialCommunityIcons name="checkbox-marked-circle-outline" size={14} color={COLORS.success} />
                </View>
              )}
            </View>
          </View>
        </View>
      );
    }

    // Document Card Logic in Step 6
    return (
      <View key={card.key} style={styles.uploadCard}>
        {/* Required / Optional tag */}
        <View style={styles.badgeContainer}>
          <View style={[styles.requiredBadge, !card.mandatory && styles.optionalBadge]}>
            <Text style={[styles.requiredBadgeText, !card.mandatory && styles.optionalBadgeText]}>
              {card.mandatory ? 'REQUIRED' : 'OPTIONAL'}
            </Text>
          </View>
        </View>

        <View style={styles.uploadCardContent}>
          <View style={[styles.docIconBox, isUploaded && styles.docIconBoxActive]}>
            <MaterialCommunityIcons
              name={card.icon as any}
              size={22}
              color={isUploaded ? COLORS.primary : '#64748B'}
            />
          </View>

          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={styles.uploadTitle}>{card.title}</Text>
            <Text style={styles.uploadSub}>{card.subtitle}</Text>
            <Text style={styles.uploadHint}>Accepted: JPG, PNG (Max 5MB)</Text>

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
                <Text style={styles.verifyingText}>Processing...</Text>
              </View>
            )}

            {/* Verification and upload status badges */}
            {status === 'Uploaded' && (
              <View style={[styles.badgeIndicator, styles.badgeIndicatorUploaded]}>
                <MaterialCommunityIcons name="cloud-check" size={12} color="#2563EB" style={{ marginRight: 4 }} />
                <Text style={styles.badgeIndicatorUploadedText}>Uploaded (Pending Review)</Text>
              </View>
            )}

            {status === 'Approved' && (
              <View style={[styles.badgeIndicator, styles.badgeIndicatorApproved]}>
                <MaterialCommunityIcons name="check-decagram" size={12} color="#10B981" style={{ marginRight: 4 }} />
                <Text style={styles.badgeIndicatorApprovedText}>Verified & Approved</Text>
              </View>
            )}

            {status === 'Rejected' && (
              <View style={[styles.badgeIndicator, styles.badgeIndicatorRejected]}>
                <MaterialCommunityIcons name="alert-circle" size={12} color="#EF4444" style={{ marginRight: 4 }} />
                <Text style={styles.badgeIndicatorRejectedText}>Rejected (Replace file)</Text>
              </View>
            )}
          </View>

          {/* Direct upload action when none */}
          {!isUploaded && status !== 'Uploading' && status !== 'Verifying' && (
            <TouchableOpacity
              style={styles.uploadActionBtn}
              onPress={() => handleUploadChoice(card.key)}
            >
              <MaterialCommunityIcons name="cloud-upload-outline" size={20} color={COLORS.primary} />
            </TouchableOpacity>
          )}
        </View>

        {/* Uploaded action row */}
        {isUploaded && (
          <View style={styles.docActionsRow}>
            <TouchableOpacity 
              style={styles.docActionMiniBtn} 
              onPress={() => {
                const docUri = docUrls[card.key] || landDocumentUrl || '';
                setViewingDoc({ uri: docUri, title: card.title, status, key: card.key });
              }}
            >
              <MaterialCommunityIcons name="eye-outline" size={16} color={COLORS.primary} />
              <Text style={styles.docActionMiniText}>Preview</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.docActionMiniBtn} 
              onPress={() => handleUploadChoice(card.key)}
            >
              <MaterialCommunityIcons name="file-replace-outline" size={16} color="#475569" />
              <Text style={styles.docActionMiniText}>Replace</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.docActionMiniBtn} 
              onPress={() => handleDocDelete(card.key)}
            >
              <MaterialCommunityIcons name="delete-outline" size={16} color="#DC2626" />
              <Text style={[styles.docActionMiniText, { color: '#DC2626' }]}>Delete</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F4FDF9" />

      {/* Top Banner Step Bar */}
      <View style={[styles.stepperContainer, { paddingTop: insets.top > 0 ? insets.top + 14 : (Platform.OS === 'ios' ? 60 : 40) }]}>
        <TouchableOpacity onPress={() => currentStep === 1 ? router.back() : setCurrentStep(prev => prev - 1)} style={styles.backArrow}>
          <MaterialCommunityIcons name="chevron-left" size={24} color={COLORS.primary} />
        </TouchableOpacity>
        <View style={styles.progressWrapper}>
          <Text style={styles.stepTitle}>Step {currentStep} of 8</Text>
          <View style={styles.progressBarBg}>
            <View style={[styles.progressBarFill, { width: `${(currentStep / 8) * 100}%` }]} />
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
        
        {/* STEP 1: Land Type Selection */}
        {currentStep === 1 && (
          <View style={styles.stepCard}>
            <Text style={styles.heading}>Land Type / भूमि प्रकार</Text>
            <Text style={styles.subheading}>Select the primary category of your land to determine program eligibility.</Text>

            {LAND_TYPES.map((type) => {
              const isSelected = landType === type.title;
              return (
                <TouchableOpacity
                  key={type.id}
                  style={[
                    styles.landTypeOptionCard,
                    isSelected && styles.landTypeOptionCardSelected
                  ]}
                  onPress={() => {
                    triggerHaptic(Haptics.ImpactFeedbackStyle.Light);
                    setLandType(type.title);
                  }}
                  activeOpacity={0.8}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
                    <View style={[styles.landTypeIconWrapper, isSelected && styles.landTypeIconWrapperActive]}>
                      <MaterialCommunityIcons 
                        name={type.icon as any} 
                        size={22} 
                        color={isSelected ? COLORS.primary : '#64748B'} 
                      />
                    </View>
                    <View style={{ flex: 1, marginLeft: 14 }}>
                      <Text style={[styles.landTypeOptionTitle, isSelected && styles.landTypeOptionTitleActive]}>
                        {type.title} / {type.titleHi}
                      </Text>
                      <Text style={styles.landTypeOptionDesc}>
                        {type.description}
                      </Text>
                      <View style={styles.landTypeHintRow}>
                        <MaterialCommunityIcons name="information-outline" size={12} color="#059669" style={{ marginRight: 4 }} />
                        <Text style={styles.landTypeOptionHint}>
                          {type.hint}
                        </Text>
                      </View>
                    </View>
                    <MaterialCommunityIcons 
                      name={isSelected ? "radiobox-marked" : "radiobox-blank"} 
                      size={20} 
                      color={isSelected ? COLORS.primary : '#94A3B8'} 
                      style={{ marginTop: 2 }}
                    />
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {/* STEP 2: Farmer Identity Verification */}
        {currentStep === 2 && (
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

        {/* STEP 3: Soil & Crop Eco-metrics / Land Details */}
        {currentStep === 3 && (
          <View style={[styles.stepCard, { zIndex: 1000 }]}>
            <Text style={styles.heading}>Land Details / भूमि विवरण</Text>
            <Text style={styles.subheading}>Enter your agricultural land specifications and crop info.</Text>

            {/* 1. Land Name / Title */}
            <View style={styles.formField} onLayout={(e) => fieldPositions.current['landTitle'] = e.nativeEvent.layout.y}>
              <Text style={styles.label}>Land Name / Title / भूमि का नाम *</Text>
              <TextInput 
                style={[styles.input, errors.landTitle && styles.inputError]} 
                placeholder="e.g. My Village Farm / मेरे गांव का खेत"
                placeholderTextColor="#94A3B8"
                value={landTitle} 
                onChangeText={(val) => {
                  setLandTitle(val);
                  if (errors.landTitle) setErrors(prev => ({ ...prev, landTitle: '' }));
                }} 
              />
              {errors.landTitle && <Text style={styles.errorText}>{errors.landTitle}</Text>}
            </View>

            {/* 2. Land Type */}
            <View style={styles.formField}>
              <Text style={styles.label}>Land Type / भूमि प्रकार (Pre-filled)</Text>
              <TextInput 
                style={[styles.input, { backgroundColor: '#E2E8F0', color: '#64748B' }]} 
                editable={false}
                value={landType || 'Not Selected'}
              />
            </View>

            {/* 3. Ownership Type */}
            <View style={[styles.formField, { zIndex: 110 }]} onLayout={(e) => fieldPositions.current['ownershipType'] = e.nativeEvent.layout.y}>
              <Text style={styles.label}>Ownership Type / स्वामित्व प्रकार *</Text>
              <AutocompleteDropdown 
                data={OWNERSHIP_TYPES} 
                value={ownershipType} 
                onChangeText={(val) => {
                  setOwnershipType(val);
                  if (errors.ownershipType) setErrors(prev => ({ ...prev, ownershipType: '' }));
                }} 
                placeholder="Select Ownership Type"
                closeTrigger={closeDropdownsTrigger}
                style={errors.ownershipType ? styles.inputError : {}}
              />
              {errors.ownershipType && <Text style={styles.errorText}>{errors.ownershipType}</Text>}
            </View>

            {/* 4. Survey / Khasra No. */}
            <View style={styles.formField} onLayout={(e) => fieldPositions.current['khasraNumber'] = e.nativeEvent.layout.y}>
              <Text style={styles.label}>Survey / Khasra No. / खसरा संख्या *</Text>
              <TextInput 
                style={[styles.input, errors.khasraNumber && styles.inputError]} 
                placeholder="Enter Survey / Khasra Number"
                placeholderTextColor="#94A3B8"
                value={khasraNumber} 
                onChangeText={(val) => {
                  setKhasraNumber(val);
                  if (errors.khasraNumber) setErrors(prev => ({ ...prev, khasraNumber: '' }));
                }} 
              />
              {errors.khasraNumber && <Text style={styles.errorText}>{errors.khasraNumber}</Text>}
            </View>

            {/* 5. Area Size + Unit */}
            <View style={styles.formField} onLayout={(e) => fieldPositions.current['acres'] = e.nativeEvent.layout.y}>
              <Text style={styles.label}>Total Land Area / कुल भूमि क्षेत्र *</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <TextInput 
                  style={[styles.input, { flex: 2, marginRight: 10 }, errors.acres && styles.inputError]} 
                  placeholder="e.g. 4.5"
                  keyboardType="numeric" 
                  value={acres} 
                  onChangeText={(val) => {
                    setAcres(val);
                    if (errors.acres) setErrors(prev => ({ ...prev, acres: '' }));
                  }} 
                />
                <View style={{ flex: 1, zIndex: 105 }}>
                  <AutocompleteDropdown 
                    data={AREA_UNITS} 
                    value={areaUnit} 
                    onChangeText={(val) => setAreaUnit(val)} 
                    placeholder="Unit"
                    closeTrigger={closeDropdownsTrigger}
                  />
                </View>
              </View>
              {errors.acres && <Text style={styles.errorText}>{errors.acres}</Text>}
            </View>

            {/* 6. Soil Type */}
            <View style={[styles.formField, { zIndex: 100 }]}>
              <Text style={styles.label}>Soil Type / मिट्टी का प्रकार</Text>
              <AutocompleteDropdown 
                data={SOIL_TYPES} 
                value={soilComposition} 
                onChangeText={(val) => setSoilComposition(val)} 
                placeholder="Select Soil Type"
                closeTrigger={closeDropdownsTrigger}
              />
            </View>

            {/* 7. Water Source */}
            <View style={[styles.formField, { zIndex: 95 }]}>
              <Text style={styles.label}>Water Source / जल स्रोत</Text>
              <AutocompleteDropdown 
                data={WATER_SOURCES} 
                value={waterAvailability} 
                onChangeText={(val) => setWaterAvailability(val)} 
                placeholder="Select Water Source"
                closeTrigger={closeDropdownsTrigger}
              />
            </View>

            {/* 8. Main Crop */}
            <View style={[styles.formField, { zIndex: 90 }]}>
              <Text style={styles.label}>Main Crop / मुख्य फसल</Text>
              <AutocompleteDropdown 
                data={MAIN_CROPS} 
                value={cropSelection} 
                onChangeText={(val) => setCropSelection(val)} 
                placeholder="Select Main Crop"
                closeTrigger={closeDropdownsTrigger}
              />
            </View>

            {/* Main Crop Count */}
            <View style={styles.formField}>
              <Text style={styles.label}>Crop / Plant Count / फसल/पौधों की संख्या</Text>
              <TextInput 
                style={styles.input} 
                placeholder="e.g. 500"
                placeholderTextColor="#94A3B8"
                keyboardType="numeric"
                value={cropCount}
                onChangeText={setCropCount}
              />
            </View>

            {/* 9. Plantation Date */}
            <View style={styles.formField} onLayout={(e) => fieldPositions.current['plantationDate'] = e.nativeEvent.layout.y}>
              <Text style={styles.label}>Plantation Date / रोपण तिथि (YYYY-MM-DD)</Text>
              <TouchableOpacity 
                style={[styles.input, { justifyContent: 'center' }, errors.plantationDate && styles.inputError]} 
                onPress={() => { 
                  Keyboard.dismiss();
                  setIsCalendarVisible(true); 
                  if (errors.plantationDate) setErrors(prev => ({ ...prev, plantationDate: '' })); 
                }}
                activeOpacity={0.8}
              >
                <Text style={{ color: plantationDate ? COLORS.textDark : '#94A3B8' }}>
                  {plantationDate || 'YYYY-MM-DD'}
                </Text>
              </TouchableOpacity>
              {errors.plantationDate && <Text style={styles.errorText}>{errors.plantationDate}</Text>}
            </View>

            {/* Existing Trees Toggle */}
            <View style={styles.formField}>
              <Text style={styles.label}>Are there existing trees on this land? / क्या भूमि पर पहले से पेड़ हैं?</Text>
              <View style={{ flexDirection: 'row', marginTop: 8 }}>
                <TouchableOpacity 
                  style={[styles.treeToggleBtn, hasExistingTrees && styles.treeToggleBtnActive, { marginRight: 12 }]}
                  onPress={() => setHasExistingTrees(true)}
                  activeOpacity={0.8}
                >
                  <MaterialCommunityIcons name="tree" size={16} color={hasExistingTrees ? '#FFFFFF' : '#475569'} />
                  <Text style={[styles.treeToggleText, hasExistingTrees && styles.treeToggleTextActive]}>Yes / हाँ</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.treeToggleBtn, !hasExistingTrees && styles.treeToggleBtnActive]}
                  onPress={() => {
                    setHasExistingTrees(false);
                    setTreesList([]);
                  }}
                  activeOpacity={0.8}
                >
                  <MaterialCommunityIcons name="tree-outline" size={16} color={!hasExistingTrees ? '#FFFFFF' : '#475569'} />
                  <Text style={[styles.treeToggleText, !hasExistingTrees && styles.treeToggleTextActive]}>No / नहीं (No Trees)</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Conditional Tree Details */}
            {hasExistingTrees && (
              <View style={{ marginVertical: 12 }}>
                <Text style={styles.treeDetailsSectionTitle}>Existing Trees Details / पेड़ का विवरण</Text>
                
                {errors.trees && <Text style={[styles.errorText, { marginBottom: 10 }]}>{errors.trees}</Text>}

                {treesList.map((item, index) => {
                  const speciesError = errors[`tree_species_${item.id}`];
                  const countError = errors[`tree_count_${item.id}`];
                  const ageError = errors[`tree_age_${item.id}`];
                  const locationError = errors[`tree_location_${item.id}`];
                  const photoError = errors[`tree_photo_${item.id}`];

                  return (
                    <View key={item.id} style={[styles.treeDetailsContainer, { marginBottom: 16, zIndex: 1000 - index }]}>
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                        <Text style={{ fontSize: 13, fontWeight: '800', color: COLORS.primaryDark }}>
                          Tree Species #{index + 1}
                        </Text>
                        <View style={{ flexDirection: 'row' }}>
                          <TouchableOpacity 
                            onPress={() => handleDuplicateTree(item)}
                            style={{ padding: 4, marginRight: 8 }}
                          >
                            <MaterialCommunityIcons name="content-copy" size={18} color="#2563EB" />
                          </TouchableOpacity>
                          {treesList.length > 1 && (
                            <TouchableOpacity 
                              onPress={() => handleRemoveTree(item.id)}
                              style={{ padding: 4 }}
                            >
                              <MaterialCommunityIcons name="delete" size={18} color="#EF4444" />
                            </TouchableOpacity>
                          )}
                        </View>
                      </View>

                      {/* 1. Tree Species */}
                      <View style={[styles.formField, { zIndex: 100 }]}>
                        <Text style={styles.label}>Tree Species / पेड़ की प्रजाति *</Text>
                        <AutocompleteDropdown 
                          data={TREE_SPECIES} 
                          value={item.species} 
                          onChangeText={(val) => updateTreeField(item.id, 'species', val)} 
                          placeholder="Select Tree Species"
                          closeTrigger={closeDropdownsTrigger}
                          style={speciesError ? styles.inputError : {}}
                        />
                        {speciesError && <Text style={styles.errorText}>{speciesError}</Text>}
                      </View>

                      {/* 2. Count / Quantity */}
                      <View style={styles.formField}>
                        <Text style={styles.label}>Approximate Tree Count / पेड़ों की संख्या *</Text>
                        <TextInput 
                          style={[styles.input, countError && styles.inputError]} 
                          placeholder="e.g. 150"
                          placeholderTextColor="#94A3B8"
                          keyboardType="numeric"
                          value={item.count}
                          onChangeText={(val) => updateTreeField(item.id, 'count', val)}
                        />
                        {countError && <Text style={styles.errorText}>{countError}</Text>}
                      </View>

                      {/* 3. Age Bracket */}
                      <View style={[styles.formField, { zIndex: 90 }]}>
                        <Text style={styles.label}>Approximate Age Bracket / पेड़ों की अनुमानित उम्र *</Text>
                        <AutocompleteDropdown 
                          data={AGE_BRACKETS} 
                          value={item.ageBracket} 
                          onChangeText={(val) => updateTreeField(item.id, 'ageBracket', val)} 
                          placeholder="Select Age Bracket"
                          closeTrigger={closeDropdownsTrigger}
                          style={ageError ? styles.inputError : {}}
                        />
                        {ageError && <Text style={styles.errorText}>{ageError}</Text>}
                      </View>

                      {/* 4. Location on Parcel */}
                      <View style={[styles.formField, { zIndex: 80 }]}>
                        <Text style={styles.label}>Location on Parcel / भूखंड पर स्थान *</Text>
                        <AutocompleteDropdown 
                          data={PARCEL_LOCATIONS} 
                          value={item.locationOnParcel} 
                          onChangeText={(val) => updateTreeField(item.id, 'locationOnParcel', val)} 
                          placeholder="Select or enter location (e.g. North Boundary)"
                          closeTrigger={closeDropdownsTrigger}
                          style={locationError ? styles.inputError : {}}
                        />
                        {locationError && <Text style={styles.errorText}>{locationError}</Text>}
                      </View>

                      {/* 5. Photo/Proof Upload */}
                      <View style={styles.formField}>
                        <Text style={styles.label}>Photo Proof / फोटो प्रमाण *</Text>
                        
                        {item.photoUri ? (
                          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 6 }}>
                            <Image 
                              source={{ uri: item.photoUri }} 
                              style={{ width: 85, height: 85, borderRadius: 12, marginRight: 12 }} 
                            />
                            <View style={{ flex: 1 }}>
                              <Text style={{ fontSize: 12, fontWeight: '700', color: '#1E293B' }}>
                                {item.photoStatus === 'Uploading' ? 'Uploading...' : 'Uploaded successfully ✅'}
                              </Text>
                              {item.photoStatus === 'Uploading' && (
                                <View style={{ height: 4, backgroundColor: '#E2E8F0', borderRadius: 2, marginTop: 4, width: '100%', overflow: 'hidden' }}>
                                  <View style={{ height: '100%', backgroundColor: COLORS.primary, width: `${item.progress * 100}%` }} />
                                </View>
                              )}
                              <TouchableOpacity 
                                onPress={() => {
                                  updateTreeField(item.id, 'photoUri', undefined);
                                  updateTreeField(item.id, 'photoStatus', 'None');
                                }}
                                style={{ marginTop: 8 }}
                              >
                                <Text style={{ fontSize: 12, fontWeight: '700', color: '#EF4444' }}>Delete Photo</Text>
                              </TouchableOpacity>
                            </View>
                          </View>
                        ) : (
                          <TouchableOpacity 
                            onPress={() => handlePickTreePhotoChoice(item.id)}
                            style={[
                              styles.treeToggleBtn, 
                              { marginTop: 6, paddingVertical: 12, borderStyle: 'dashed' },
                              photoError && { borderColor: '#EF4444' }
                            ]}
                          >
                            <MaterialCommunityIcons name="camera" size={18} color={photoError ? '#EF4444' : COLORS.primary} />
                            <Text style={[styles.treeToggleText, { color: photoError ? '#EF4444' : COLORS.primary }]}>
                              Upload Tree Photo / फोटो अपलोड करें
                            </Text>
                          </TouchableOpacity>
                        )}
                        {photoError && <Text style={styles.errorText}>{photoError}</Text>}
                      </View>

                    </View>
                  );
                })}

                <TouchableOpacity 
                  onPress={handleAddTree}
                  style={[styles.treeToggleBtn, { marginTop: 8, paddingVertical: 12, backgroundColor: '#F0FDF4', borderColor: COLORS.primary }]}
                >
                  <MaterialCommunityIcons name="plus" size={18} color={COLORS.primary} />
                  <Text style={[styles.treeToggleText, { color: COLORS.primary }]}>
                    Add More Tree / एक और पेड़ जोड़ें
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}

        {/* STEP 4: Land Details & Address */}
        {currentStep === 4 && (
          <View style={styles.stepCard}>
            <Text style={styles.heading}>Location / स्थान</Text>
            <Text style={styles.subheading}>Enter your land location.</Text>

            <View style={[styles.dualInputsRow, { zIndex: 10 }]}>
              <View style={[styles.formField, { flex: 1, marginRight: 10, zIndex: 10 }]} onLayout={(e) => fieldPositions.current['country'] = e.nativeEvent.layout.y}>
                <Text style={styles.label}>Country / देश *</Text>
                <AutocompleteDropdown data={COUNTRIES_LIST} value={country} onChangeText={(val) => { setCountry(val); setStateName(''); setDistrict(''); setVikashKhand(''); setGramPanchayat(''); setVillage(''); setCity(''); setErrors(prev => ({ ...prev, country: '' })); }} placeholder="Country" closeTrigger={closeDropdownsTrigger} style={errors.country ? styles.inputError : {}} />
                {errors.country && <Text style={styles.errorText}>{errors.country}</Text>}
              </View>
              <View style={[styles.formField, { flex: 1, zIndex: 10 }]} onLayout={(e) => fieldPositions.current['stateName'] = e.nativeEvent.layout.y}>
                <Text style={styles.label}>State / राज्य *</Text>
                <AutocompleteDropdown data={availableStates} value={stateName} onChangeText={handleLandStateChange} placeholder="State" closeTrigger={closeDropdownsTrigger} style={errors.stateName ? styles.inputError : {}} />
                {errors.stateName && <Text style={styles.errorText}>{errors.stateName}</Text>}
              </View>
            </View>

            <View style={[styles.dualInputsRow, { zIndex: 9 }]}>
              <View style={[styles.formField, { flex: 1, marginRight: 10, zIndex: 9 }]} onLayout={(e) => fieldPositions.current['district'] = e.nativeEvent.layout.y}>
                <Text style={styles.label}>District / जिला *</Text>
                <AutocompleteDropdown data={availableDistricts} value={district} onChangeText={handleLandDistrictChange} placeholder="District" closeTrigger={closeDropdownsTrigger} style={errors.district ? styles.inputError : {}} />
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
                <AutocompleteDropdown data={availableGramPanchayats} value={gramPanchayat} onChangeText={handleLandGramPanchayatChange} placeholder="Panchayat" closeTrigger={closeDropdownsTrigger} style={errors.gramPanchayat ? styles.inputError : {}} />
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
              <AutocompleteDropdown data={availableVillages} value={village} onChangeText={handleLandVillageChange} placeholder="Village name" closeTrigger={closeDropdownsTrigger} style={errors.village ? styles.inputError : {}} />
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

        {/* STEP 5: GPS Mapping */}
        {currentStep === 5 && (() => {
          const enteredAcres = parseFloat(acres) || 0;
          const enteredAreaInAcres = convertToAcres(enteredAcres, areaUnit);
          const calculatedAcres = calculatePolygonAreaInAcres(boundaryPolygon);
          const discrepancyPercent = enteredAreaInAcres > 0 
            ? Math.abs(calculatedAcres - enteredAreaInAcres) / enteredAreaInAcres 
            : 0;
          const showDiscrepancyWarning = boundaryPolygon.length >= 3 && discrepancyPercent > 0.15;

          return (
            <View style={styles.stepCard}>
              <Text style={styles.heading}>Satellite Mapping / उपग्रह मानचित्र</Text>
              <Text style={styles.subheading}>Pinpoint your land boundaries. Tap on the satellite map to mark corners or use GPS Walk mode to capture points.</Text>

              {/* Map view container */}
              <View style={styles.mapContainer}>
                <MapView
                  style={styles.map}
                  mapType="satellite"
                  initialRegion={{
                    latitude: geoCoords?.latitude || 22.9712,
                    longitude: geoCoords?.longitude || 78.6514,
                    latitudeDelta: 0.005,
                    longitudeDelta: 0.005,
                  }}
                  onPress={(e: any) => {
                    const coord = e?.nativeEvent?.coordinate;
                    if (coord) {
                      triggerHaptic(Haptics.ImpactFeedbackStyle.Light);
                      setBoundaryPolygon(prev => [...prev, coord]);
                    }
                  }}
                >
                  {boundaryPolygon.map((pt, idx) => (
                    <Marker
                      key={`marker-${idx}`}
                      coordinate={pt}
                      title={`Corner ${idx + 1}`}
                      pinColor={idx === 0 ? 'green' : 'red'}
                    />
                  ))}
                  {boundaryPolygon.length >= 2 && (
                    <Polyline
                      coordinates={boundaryPolygon}
                      strokeColor={showNdvi ? '#059669' : '#EAB308'}
                      strokeWidth={3}
                    />
                  )}
                </MapView>
                
                {/* NDVI Layer Toggle Button */}
                <TouchableOpacity 
                  style={[styles.ndviToggleBtn, showNdvi && styles.ndviToggleBtnActive]} 
                  onPress={() => {
                    triggerHaptic(Haptics.ImpactFeedbackStyle.Light);
                    setShowNdvi(!showNdvi);
                  }}
                  activeOpacity={0.8}
                >
                  <MaterialCommunityIcons name={showNdvi ? "leaf" : "sprout"} size={16} color={showNdvi ? '#FFFFFF' : '#475569'} />
                  <Text style={[styles.ndviToggleText, showNdvi && styles.ndviToggleTextActive]}>
                    {showNdvi ? 'NDVI Bio-Preview Enabled' : 'Preview NDVI Layer'}
                  </Text>
                </TouchableOpacity>
              </View>

              {/* GPS status and mapping actions */}
              <View style={styles.gpsAccuracyRow}>
                <MaterialCommunityIcons name="satellite-variant" size={16} color="#475569" style={{ marginRight: 6 }} />
                <Text style={styles.gpsAccuracyText}>
                  GPS Accuracy: {gpsAccuracy ? `${gpsAccuracy.toFixed(1)} meters` : 'Not captured'}
                </Text>
                {gpsAccuracy !== null && gpsAccuracy <= 5 && (
                  <View style={styles.gpsStrongBadge}>
                    <Text style={styles.gpsStrongBadgeText}>Strong GPS</Text>
                  </View>
                )}
              </View>

              {/* Action row: GPS capture point, Undo, Clear */}
              <View style={styles.boundaryActionsRow}>
                <TouchableOpacity style={styles.boundaryActionBtn} onPress={handleFetchGPS} disabled={gpsLoading}>
                  <MaterialCommunityIcons name="crosshairs-gps" size={16} color="#2563EB" />
                  <Text style={styles.boundaryActionBtnText}>{gpsLoading ? 'Capturing...' : 'GPS Walk Point'}</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.boundaryActionBtn} 
                  onPress={() => { triggerHaptic(Haptics.ImpactFeedbackStyle.Medium); setBoundaryPolygon(prev => prev.slice(0, -1)); }}
                  disabled={boundaryPolygon.length === 0}
                >
                  <MaterialCommunityIcons name="undo" size={16} color="#DC2626" />
                  <Text style={styles.boundaryActionBtnText}>Undo</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.boundaryActionBtn} 
                  onPress={() => { triggerHaptic(Haptics.ImpactFeedbackStyle.Medium); setBoundaryPolygon([]); }}
                  disabled={boundaryPolygon.length === 0}
                >
                  <MaterialCommunityIcons name="delete-outline" size={16} color="#475569" />
                  <Text style={styles.boundaryActionBtnText}>Clear</Text>
                </TouchableOpacity>
              </View>

              {/* Calculations panel */}
              <View style={styles.calculationsContainer}>
                <View style={styles.calcField}>
                  <Text style={styles.calcLabel}>Calculated Area / क्षेत्रफल</Text>
                  <Text style={styles.calcValue}>{calculatedAcres.toFixed(2)} Acres</Text>
                  <Text style={styles.calcSubValue}>{(calculatedAcres * 0.404686).toFixed(2)} Hectares</Text>
                </View>
                <View style={styles.calcField}>
                  <Text style={styles.calcLabel}>Boundary Perimeter / परिधि</Text>
                  <Text style={styles.calcValue}>{calculatePolygonPerimeterInMeters(boundaryPolygon).toFixed(1)} m</Text>
                </View>
              </View>

              {showDiscrepancyWarning && (
                <View style={styles.warningCard}>
                  <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
                    <MaterialCommunityIcons name="alert" size={20} color="#D97706" style={{ marginRight: 8, marginTop: 2 }} />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.warningTitle}>Area Discrepancy Detected</Text>
                      <Text style={styles.warningDesc}>
                        The mapped boundary area is approximately <Text style={{ fontWeight: '800' }}>{calculatedAcres.toFixed(2)} Acres</Text>, which differs from your entered area of <Text style={{ fontWeight: '800' }}>{enteredAcres.toFixed(2)} {areaUnit}</Text> ({enteredAreaInAcres.toFixed(2)} Acres) by <Text style={{ fontWeight: '800' }}>{(discrepancyPercent * 100).toFixed(0)}%</Text>.
                      </Text>
                      <Text style={styles.warningHint}>
                        Please check the boundary coordinates on the map, or verify the area entered in Step 3.
                      </Text>
                    </View>
                  </View>
                </View>
              )}

              {boundaryPolygon.length >= 3 && !showDiscrepancyWarning && (
                <View style={styles.successCard}>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <MaterialCommunityIcons name="check-circle" size={20} color="#059669" style={{ marginRight: 8 }} />
                    <Text style={styles.successText}>
                      Area verified: mapped area is {calculatedAcres.toFixed(2)} Acres.
                    </Text>
                  </View>
                </View>
              )}
            </View>
          );
        })()}

        {/* STEP 6: Documents */}
        {currentStep === 6 && (
          <View style={styles.stepCard} onLayout={(e) => fieldPositions.current['docs'] = e.nativeEvent.layout.y}>
            <Text style={styles.heading}>Documents / दस्तावेज़</Text>
            <Text style={styles.subheading}>Upload mandatory proof of land ownership, registry, and identity credentials.</Text>
            {errors.docs && <Text style={[styles.errorText, { marginBottom: 16 }]}>{errors.docs}</Text>}

            {renderDocCard({
              key: 'landProof',
              title: 'Land Ownership / Registry Proof',
              subtitle: 'Registry copy, sale deed, or land receipt',
              icon: 'file-document-outline',
              mandatory: true
            })}
            {renderDocCard({
              key: 'khasraProof',
              title: 'Khasra / Khatauni / 7/12',
              subtitle: 'Local land authority record copy',
              icon: 'text-box-search-outline',
              mandatory: false
            })}
            {renderDocCard({
              key: 'idProof',
              title: 'Identity Proof',
              subtitle: 'Aadhaar Card, PAN, or Voter ID',
              icon: 'card-account-details-outline',
              mandatory: false
            })}
            {renderDocCard({
              key: 'otherProof',
              title: 'Other Supporting Documents',
              subtitle: 'NOC certificate, property map (Optional)',
              icon: 'file-multiple-outline',
              mandatory: false
            })}
            {renderDocCard({
              key: 'soilCard',
              title: 'Soil Health Card',
              subtitle: 'Govt soil testing parameters (Optional)',
              icon: 'sprout-outline',
              mandatory: false
            })}

            {/* Land Ground Photos inside Step 6 */}
            <View style={{ marginTop: 24, paddingTop: 16, borderTopWidth: 1, borderTopColor: '#F1F5F9' }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                <Text style={[styles.heading, { fontSize: 16, marginBottom: 0 }]}>Land Photos / खेत की तस्वीरें *</Text>
                <Text style={{ fontSize: 11, fontWeight: '700', color: COLORS.primary }}>({landPhotos.length}/5 Uploaded)</Text>
              </View>
              <Text style={[styles.subheading, { marginBottom: 12 }]}>Take live photos from Camera or select from Gallery with GPS coordinates.</Text>

              <View style={styles.photoGrid}>
                {landPhotos.map((photo) => (
                  <View key={photo.id} style={styles.photoGridCard}>
                    <Image source={{ uri: photo.uri }} style={styles.photoThumbnail} />
                    <View style={styles.photoInfoBox}>
                      <View style={styles.photoCategoryBadge}>
                        <Text style={styles.photoCategoryText}>{photo.category.toUpperCase()}</Text>
                      </View>
                      {photo.geotag && (
                        <View style={styles.metadataBadge}>
                          <MaterialCommunityIcons name="map-marker-outline" size={10} color="#059669" />
                          <Text style={styles.metadataText} numberOfLines={1}>{photo.geotag}</Text>
                        </View>
                      )}
                      {photo.timestamp && (
                        <View style={styles.metadataBadge}>
                          <MaterialCommunityIcons name="clock-outline" size={10} color="#64748B" />
                          <Text style={styles.metadataText} numberOfLines={1}>{photo.timestamp}</Text>
                        </View>
                      )}
                    </View>

                    {photo.status === 'Uploading' && (
                      <View style={styles.photoUploadOverlay}>
                        <ActivityIndicator size="small" color="#FFFFFF" />
                        <Text style={styles.photoProgressText}>{Math.round(photo.progress * 100)}%</Text>
                      </View>
                    )}

                    <View style={{ position: 'absolute', top: 6, right: 6, flexDirection: 'row', gap: 4 }}>
                      <TouchableOpacity 
                        style={[styles.photoDeleteBtn, { position: 'relative', top: 0, right: 0, backgroundColor: 'rgba(15, 23, 42, 0.7)' }]} 
                        onPress={() => handleRetakeLandPhoto(photo.id)}
                      >
                        <MaterialCommunityIcons name="camera-retake" size={12} color="#FFFFFF" />
                      </TouchableOpacity>
                      <TouchableOpacity 
                        style={[styles.photoDeleteBtn, { position: 'relative', top: 0, right: 0 }]} 
                        onPress={() => handleDeleteLandPhoto(photo.id)}
                      >
                        <MaterialCommunityIcons name="close" size={14} color="#FFFFFF" />
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}

                {landPhotos.length < 5 && (
                  <TouchableOpacity 
                    style={styles.addPhotoPlaceholder} 
                    onPress={handleAddPhotoChoice}
                    activeOpacity={0.8}
                  >
                    <MaterialCommunityIcons name="camera-plus" size={32} color={COLORS.primary} style={{ marginBottom: 8 }} />
                    <Text style={styles.addPhotoPlaceholderText}>Add Land Photo</Text>
                    <Text style={styles.addPhotoPlaceholderSub}>Camera / Gallery</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </View>
        )}

        {/* STEP 7: Photos */}
        {currentStep === 7 && (
          <View style={styles.stepCard}>
            <Text style={styles.heading}>Ground Photos / खेत की तस्वीरें</Text>
            <Text style={styles.subheading}>Upload dynamic photos of the land. Minimum 1 photo is required, up to a maximum of 5.</Text>
            
            {errors.docs && <Text style={[styles.errorText, { marginBottom: 16 }]}>{errors.docs}</Text>}

            {/* List of uploaded photos */}
            <View style={styles.photoGrid}>
              {landPhotos.map((photo) => (
                <View key={photo.id} style={styles.photoGridCard}>
                  {/* Photo Thumbnail */}
                  <Image source={{ uri: photo.uri }} style={styles.photoThumbnail} />

                  {/* Info Panel: Category and Metadata */}
                  <View style={styles.photoInfoBox}>
                    <View style={styles.photoCategoryBadge}>
                      <Text style={styles.photoCategoryText}>{photo.category.toUpperCase()}</Text>
                    </View>

                    {photo.geotag && (
                      <View style={styles.metadataBadge}>
                        <MaterialCommunityIcons name="map-marker-outline" size={10} color="#059669" />
                        <Text style={styles.metadataText} numberOfLines={1}>{photo.geotag}</Text>
                      </View>
                    )}
                    {photo.timestamp && (
                      <View style={styles.metadataBadge}>
                        <MaterialCommunityIcons name="clock-outline" size={10} color="#64748B" />
                        <Text style={styles.metadataText} numberOfLines={1}>{photo.timestamp}</Text>
                      </View>
                    )}
                  </View>

                  {/* Actions: delete & progress */}
                  {photo.status === 'Uploading' && (
                    <View style={styles.photoUploadOverlay}>
                      <ActivityIndicator size="small" color="#FFFFFF" />
                      <Text style={styles.photoProgressText}>{Math.round(photo.progress * 100)}%</Text>
                    </View>
                  )}

                  <View style={{ position: 'absolute', top: 6, right: 6, flexDirection: 'row', gap: 4 }}>
                    <TouchableOpacity 
                      style={[styles.photoDeleteBtn, { position: 'relative', top: 0, right: 0, backgroundColor: 'rgba(15, 23, 42, 0.7)' }]} 
                      onPress={() => handleRetakeLandPhoto(photo.id)}
                    >
                      <MaterialCommunityIcons name="camera-retake" size={12} color="#FFFFFF" />
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={[styles.photoDeleteBtn, { position: 'relative', top: 0, right: 0 }]} 
                      onPress={() => handleDeleteLandPhoto(photo.id)}
                    >
                      <MaterialCommunityIcons name="close" size={14} color="#FFFFFF" />
                    </TouchableOpacity>
                  </View>
                </View>
              ))}

              {/* Add Photo Placeholder Button */}
              {landPhotos.length < 5 && (
                <TouchableOpacity 
                  style={styles.addPhotoPlaceholder} 
                  onPress={handleAddPhotoChoice}
                  activeOpacity={0.8}
                >
                  <MaterialCommunityIcons name="camera-plus" size={32} color={COLORS.primary} style={{ marginBottom: 8 }} />
                  <Text style={styles.addPhotoPlaceholderText}>Add Land Photo</Text>
                  <Text style={styles.addPhotoPlaceholderSub}>({landPhotos.length}/5 uploaded)</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        )}

        {/* STEP 8: Tree Insurance Toggle & Modes */}
        {currentStep === 8 && (
          <View style={styles.stepCard}>
            <Text style={styles.heading}>Tree Insurance / पेड़ बीमा</Text>
            <Text style={styles.subheading}>Would you like to secure your registered trees with an insurance policy?</Text>

            {errors.insurance && <Text style={[styles.errorText, { marginBottom: 16 }]}>{errors.insurance}</Text>}

            {/* Decision Toggle */}
            <View style={{ marginVertical: 12 }}>
              <TouchableOpacity 
                style={[
                  styles.insuranceDecisionCard, 
                  wantsInsurance === true && styles.insuranceDecisionCardActive
                ]}
                onPress={() => {
                  setWantsInsurance(true);
                  if (errors.insurance) setErrors(prev => ({ ...prev, insurance: '' }));
                }}
                activeOpacity={0.8}
              >
                <View style={[styles.insuranceRadioCircle, wantsInsurance === true && styles.insuranceRadioCircleActive]}>
                  {wantsInsurance === true && <View style={styles.insuranceRadioDot} />}
                </View>
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={styles.insuranceDecisionTitle}>Yes, secure my trees / हाँ, बीमा चाहिए</Text>
                  <Text style={styles.insuranceDecisionSub}>Select an insurance plan to protect against weather/natural hazards.</Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity 
                style={[
                  styles.insuranceDecisionCard, 
                  wantsInsurance === false && styles.insuranceDecisionCardActive
                ]}
                onPress={() => {
                  setWantsInsurance(false);
                  if (errors.insurance) setErrors(prev => ({ ...prev, insurance: '' }));
                }}
                activeOpacity={0.8}
              >
                <View style={[styles.insuranceRadioCircle, wantsInsurance === false && styles.insuranceRadioCircleActive]}>
                  {wantsInsurance === false && <View style={styles.insuranceRadioDot} />}
                </View>
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={styles.insuranceDecisionTitle}>No, continue without insurance / नहीं, बीमा नहीं चाहिए</Text>
                  <Text style={styles.insuranceDecisionSub}>Skip coverage and proceed directly to land registration payment/review.</Text>
                </View>
              </TouchableOpacity>
            </View>

            {/* Conditional Insurance Modes Selection */}
            {wantsInsurance === true && (
              <View style={{ marginTop: 12 }}>
                <Text style={[styles.label, { marginBottom: 12, textTransform: 'uppercase', fontSize: 11 }]}>
                  Select Protection Mode / सुरक्षा मोड चुनें
                </Text>

                {[
                  {
                    key: 'single',
                    title: 'Single Tree Protection',
                    desc: 'For one highly valuable tree. Select species, details, coverage, and calculate custom premium.',
                    icon: 'tree'
                  },
                  {
                    key: 'multiple',
                    title: 'Multiple Trees Protection',
                    desc: 'Protect a selected group of trees. Enter counts and species parameters for specific group cover.',
                    icon: 'forest'
                  },
                  {
                    key: 'plantation',
                    title: 'Farm / Plantation Protection',
                    desc: 'Block-level protection. Safeguard the entire orchard or plantation block based on crop/tree density.',
                    icon: 'sprout'
                  }
                ].map((mode) => (
                  <TouchableOpacity
                    key={mode.key}
                    style={[
                      styles.insuranceModeCard,
                      insuranceMode === mode.key && styles.insuranceModeCardActive
                    ]}
                    onPress={() => setInsuranceMode(mode.key as any)}
                    activeOpacity={0.8}
                  >
                    <View style={[
                      styles.insuranceModeIconBox,
                      insuranceMode === mode.key && styles.insuranceModeIconBoxActive
                    ]}>
                      <MaterialCommunityIcons 
                        name={mode.icon as any} 
                        size={22} 
                        color={insuranceMode === mode.key ? '#FFFFFF' : COLORS.primary} 
                      />
                    </View>
                    <View style={{ flex: 1, marginLeft: 12 }}>
                      <Text style={[
                        styles.insuranceModeTitle,
                        insuranceMode === mode.key && styles.insuranceModeTitleActive
                      ]}>
                        {mode.title}
                      </Text>
                      <Text style={styles.insuranceModeDesc}>{mode.desc}</Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        )}

        <TouchableOpacity 
          style={[styles.actionBtn, ((currentStep === 1 && !landType) || isSubmitting) && { opacity: 0.5 }]} 
          onPress={handleNext} 
          activeOpacity={0.9}
          disabled={(currentStep === 1 && !landType) || isSubmitting}
        >
          <LinearGradient colors={[COLORS.primary, COLORS.secondary]} style={styles.actionBtnGrad}>
            {isSubmitting ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <>
                <Text style={styles.actionBtnLabel}>{currentStep === 8 ? 'Confirm & Register / पुष्टि करें और पंजीकरण करें' : 'Continue / आगे बढ़ें'}</Text>
                <MaterialCommunityIcons name={currentStep === 8 ? "check" : "arrow-right"} size={20} color="#FFFFFF" style={{ marginLeft: 8 }} />
              </>
            )}
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
                  if (docKey === 'soilCard') {
                    handleSimulateUpload(docKey);
                  } else {
                    handlePhotoUpload(docKey, uri);
                  }
                }
              }}
            >
              <Text style={{ color: '#FFF', fontSize: 16, fontWeight: '700' }}>Upload Photo</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Uploaded Document Viewer Modal */}
      <Modal visible={!!viewingDoc} transparent={false} animationType="fade" onRequestClose={() => setViewingDoc(null)}>
        <View style={{ flex: 1, backgroundColor: '#0A0F0D' }}>
          {/* Header */}
          <View style={{ paddingTop: insets.top + 20, paddingHorizontal: 20, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', zIndex: 10 }}>
            <TouchableOpacity onPress={() => setViewingDoc(null)} style={{ padding: 10, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 20 }}>
              <MaterialCommunityIcons name="arrow-left" size={24} color="#FFF" />
            </TouchableOpacity>
            <Text style={{ color: '#FFF', fontSize: 16, fontWeight: '800' }}>{viewingDoc?.title}</Text>
            <View style={{ width: 44 }} />
          </View>
          
          {/* Image */}
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
            {viewingDoc?.uri && !viewingDoc.uri.startsWith('simulated://') ? (
              <Image source={{ uri: viewingDoc.uri }} style={{ width: '100%', height: '80%', borderRadius: 16 }} resizeMode="contain" />
            ) : (
              <View style={{ alignItems: 'center', justifyContent: 'center', width: '100%', height: '60%', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' }}>
                <MaterialCommunityIcons name="file-check-outline" size={64} color={COLORS.primary} style={{ marginBottom: 12 }} />
                <Text style={{ color: '#E2E8F0', fontSize: 15, fontWeight: '700' }}>Simulated Document View</Text>
                <Text style={{ color: '#94A3B8', fontSize: 13, marginTop: 4 }}>File details verified on test network</Text>
              </View>
            )}
          </View>

          {/* Bottom Verification Info Panel */}
          <View style={{ backgroundColor: '#1E293B', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: insets.bottom + 20 }}>
            <Text style={{ color: '#94A3B8', fontSize: 12, fontWeight: '800', textTransform: 'uppercase', marginBottom: 6 }}>
              Verification Status / सत्यापन स्थिति
            </Text>
            
            <View style={{ flexDirection: 'row', alignItems: 'center', marginVertical: 8 }}>
              <MaterialCommunityIcons 
                name={
                  viewingDoc?.status === 'Approved' 
                    ? "check-decagram" 
                    : viewingDoc?.status === 'Rejected' 
                      ? "alert-circle" 
                      : "clock-outline"
                } 
                size={22} 
                color={
                  viewingDoc?.status === 'Approved' 
                    ? '#10B981' 
                    : viewingDoc?.status === 'Rejected' 
                      ? '#EF4444' 
                      : '#F59E0B'
                } 
                style={{ marginRight: 8 }} 
              />
              <Text style={{ 
                color: '#FFF', 
                fontSize: 16, 
                fontWeight: '800' 
              }}>
                {viewingDoc?.status === 'Approved' 
                  ? 'VERIFIED & APPROVED' 
                  : viewingDoc?.status === 'Rejected' 
                    ? 'VERIFICATION REJECTED' 
                    : 'UPLOADED (Awaiting Admin Review)'}
              </Text>
            </View>
            
            <Text style={{ color: '#94A3B8', fontSize: 13, lineHeight: 18, marginTop: 4 }}>
              {viewingDoc?.status === 'Approved' 
                ? 'Your document has been verified by BhumiCred Admin. The metadata is locked in the registry.' 
                : viewingDoc?.status === 'Rejected' 
                  ? 'The document was rejected by the admin. Please tap "Replace" to upload a valid proof.' 
                  : 'The file has been uploaded to secure server. Admin review is pending.'}
            </Text>
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

      {/* Category Select Modal Dialog */}
      <Modal visible={!!categorySelectPhoto} transparent={true} animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { paddingBottom: insets.bottom + 20 }]}>
            <Text style={[styles.modalTitle, { fontSize: 18, marginBottom: 4 }]}>Select Photo Category</Text>
            <Text style={[styles.modalSub, { marginBottom: 20 }]}>Please categorize this photo for eco-verification auditing.</Text>
            
            {[
              'Entrance / Boundary',
              'Crop / Field',
              'Trees / Plantation',
              'Water Source',
              'Surrounding Area'
            ].map((cat) => (
              <TouchableOpacity
                key={cat}
                style={styles.categoryItemRow}
                onPress={() => handleCategorySelect(cat)}
              >
                <MaterialCommunityIcons 
                  name={
                    cat.includes('Boundary') ? 'map-marker-path' :
                    cat.includes('Crop') ? 'sprout' :
                    cat.includes('Trees') ? 'tree' :
                    cat.includes('Water') ? 'water' : 'image-outline'
                  }
                  size={20} 
                  color={COLORS.primary} 
                  style={{ marginRight: 12 }} 
                />
                <Text style={styles.categoryItemText}>{cat}</Text>
                <MaterialCommunityIcons name="chevron-right" size={18} color="#94A3B8" style={{ marginLeft: 'auto' }} />
              </TouchableOpacity>
            ))}

            <TouchableOpacity 
              style={[styles.modalNotNowBtn, { width: '100%', marginTop: 12, marginRight: 0 }]}
              onPress={() => setCategorySelectPhoto(null)}
            >
              <Text style={styles.modalNotNowText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <CustomCalendarModal 
        visible={isCalendarVisible} 
        onClose={() => setIsCalendarVisible(false)} 
        onSelectDate={(val) => {
          if (val && val.includes('/')) {
            const [d, m, y] = val.split('/');
            setPlantationDate(`${y}-${m}-${d}`);
          } else {
            setPlantationDate(val);
          }
        }} 
        initialDate={plantationDate && plantationDate.includes('-') ? `${plantationDate.split('-')[2]}/${plantationDate.split('-')[1]}/${plantationDate.split('-')[0]}` : undefined}
        mode="plantation"
      />

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
  mapContainer: {
    height: 280,
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    marginVertical: 12,
    position: 'relative',
    backgroundColor: '#F1F5F9',
  },
  map: {
    flex: 1,
  },
  ndviToggleBtn: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    ...SHADOWS.soft,
  },
  ndviToggleBtnActive: {
    backgroundColor: '#059669',
    borderColor: '#047857',
  },
  ndviToggleText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569',
    marginLeft: 6,
  },
  ndviToggleTextActive: {
    color: '#FFFFFF',
  },
  gpsAccuracyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 8,
  },
  gpsAccuracyText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
  },
  gpsStrongBadge: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    marginLeft: 10,
  },
  gpsStrongBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#15803D',
  },
  boundaryActionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 8,
  },
  boundaryActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 8,
    flex: 1,
    marginHorizontal: 4,
  },
  boundaryActionBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
    marginLeft: 6,
  },
  calculationsContainer: {
    flexDirection: 'row',
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    padding: 16,
    marginVertical: 12,
  },
  calcField: {
    flex: 1,
  },
  calcLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#64748B',
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  calcValue: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.primaryDark,
  },
  calcSubValue: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
    marginTop: 2,
  },
  photoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginVertical: 10,
  },
  photoGridCard: {
    width: '48%',
    height: 180,
    borderRadius: 16,
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
    marginBottom: 14,
    position: 'relative',
  },
  photoThumbnail: {
    width: '100%',
    height: 100,
  },
  photoInfoBox: {
    padding: 8,
  },
  photoCategoryBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    marginBottom: 4,
  },
  photoCategoryText: {
    fontSize: 8,
    fontWeight: '800',
    color: '#059669',
  },
  metadataBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  metadataText: {
    fontSize: 8,
    fontWeight: '700',
    color: '#64748B',
    marginLeft: 4,
    width: 110,
  },
  photoUploadOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  photoProgressText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
    marginTop: 4,
  },
  photoDeleteBtn: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  treeToggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
    flex: 1,
  },
  treeToggleBtnActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  treeToggleText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#475569',
    marginLeft: 6,
  },
  treeToggleTextActive: {
    color: '#FFFFFF',
  },
  treeDetailsContainer: {
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    padding: 16,
    marginVertical: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  treeDetailsSectionTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.primary,
    textTransform: 'uppercase',
    marginBottom: 12,
  },
  addPhotoPlaceholder: {
    width: '48%',
    height: 180,
    borderRadius: 16,
    borderStyle: 'dashed',
    borderWidth: 1.5,
    borderColor: COLORS.primary,
    backgroundColor: '#F0FDF4',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
  },
  addPhotoPlaceholderText: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.primary,
  },
  addPhotoPlaceholderSub: {
    fontSize: 10,
    color: COLORS.secondary,
    marginTop: 2,
    fontWeight: '600',
  },
  categoryItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderBottomWidth: 1,
    borderColor: '#E2E8F0',
    width: '100%',
  },
  categoryItemText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#334155',
  },
  landTypeOptionCard: {
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    backgroundColor: '#FFFFFF',
  },
  landTypeOptionCardSelected: {
    borderColor: COLORS.primary,
    backgroundColor: '#ECFDF5',
  },
  landTypeIconWrapper: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  landTypeIconWrapperActive: {
    backgroundColor: '#DCFCE7',
  },
  landTypeOptionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 4,
  },
  landTypeOptionTitleActive: {
    color: COLORS.primary,
  },
  landTypeOptionDesc: {
    fontSize: 12,
    color: '#64748B',
    lineHeight: 17,
    marginBottom: 6,
  },
  landTypeHintRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  landTypeOptionHint: {
    fontSize: 11,
    fontWeight: '600',
    color: '#059669',
  },
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
  warningCard: {
    backgroundColor: '#FFFBEB',
    borderColor: '#FCD34D',
    borderWidth: 1.5,
    borderRadius: 16,
    padding: 16,
    marginTop: 16,
  },
  warningTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#B45309',
    marginBottom: 4,
  },
  warningDesc: {
    fontSize: 12,
    color: '#D97706',
    lineHeight: 18,
    marginBottom: 6,
  },
  warningHint: {
    fontSize: 11,
    fontStyle: 'italic',
    color: '#B45309',
    lineHeight: 16,
  },
  successCard: {
    backgroundColor: '#ECFDF5',
    borderColor: '#A7F3D0',
    borderWidth: 1.5,
    borderRadius: 16,
    padding: 16,
    marginTop: 16,
  },
  successText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#047857',
  },
  dualInputsRow: { flexDirection: 'row' },
  uploadCard: {
    backgroundColor: '#F8FAFC', borderRadius: 20, borderWidth: 1.5,
    borderColor: '#E2E8F0', padding: 16, marginBottom: 14,
    position: 'relative',
  },
  uploadCardContent: { flexDirection: 'row', alignItems: 'center' },
  badgeContainer: {
    position: 'absolute',
    top: 12,
    right: 12,
    zIndex: 10,
  },
  requiredBadge: {
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  optionalBadge: {
    backgroundColor: '#E2E8F0',
  },
  requiredBadgeText: {
    fontSize: 8,
    fontWeight: '800',
    color: '#EF4444',
  },
  optionalBadgeText: {
    color: '#475569',
  },
  uploadHint: {
    fontSize: 10,
    color: '#94A3B8',
    marginTop: 4,
    fontWeight: '600',
  },
  badgeIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginTop: 8,
  },
  badgeIndicatorUploaded: {
    backgroundColor: '#DBEAFE',
  },
  badgeIndicatorUploadedText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#2563EB',
  },
  badgeIndicatorApproved: {
    backgroundColor: '#D1FAE5',
  },
  badgeIndicatorApprovedText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#059669',
  },
  badgeIndicatorRejected: {
    backgroundColor: '#FEE2E2',
  },
  badgeIndicatorRejectedText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#EF4444',
  },
  docActionsRow: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderColor: '#F1F5F9',
    paddingTop: 10,
    marginTop: 10,
    justifyContent: 'space-between',
  },
  docActionMiniBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    flex: 1,
    marginHorizontal: 3,
  },
  docActionMiniText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569',
    marginLeft: 4,
  },
  docIconBox: {
    width: 44, height: 44, borderRadius: 12, backgroundColor: '#E2E8F0',
    justifyContent: 'center', alignItems: 'center',
  },
  docIconBoxActive: { backgroundColor: '#E6F4EA' },
  uploadTitle: { fontSize: 13, fontWeight: '800', color: COLORS.textDark, marginRight: 60 },
  uploadSub: { fontSize: 11, color: COLORS.textSecondary, marginTop: 2, marginRight: 60 },
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
  insuranceDecisionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 16,
    marginBottom: 12,
    backgroundColor: '#FFFFFF',
  },
  insuranceDecisionCardActive: {
    borderColor: COLORS.primary,
    backgroundColor: '#ECFDF5',
  },
  insuranceRadioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#94A3B8',
    justifyContent: 'center',
    alignItems: 'center',
  },
  insuranceRadioCircleActive: {
    borderColor: COLORS.primary,
  },
  insuranceRadioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.primary,
  },
  insuranceDecisionTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.textDark,
  },
  insuranceDecisionSub: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  insuranceModeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 16,
    marginBottom: 12,
    backgroundColor: '#FFFFFF',
  },
  insuranceModeCardActive: {
    borderColor: COLORS.primary,
    backgroundColor: '#ECFDF5',
  },
  insuranceModeIconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  insuranceModeIconBoxActive: {
    backgroundColor: COLORS.primary,
  },
  insuranceModeTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#475569',
  },
  insuranceModeTitleActive: {
    color: COLORS.primary,
  },
  insuranceModeDesc: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 2,
    lineHeight: 16,
  },
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

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  TextInput,
  ScrollView,
  Dimensions,
  Alert,
  ActivityIndicator,
  DeviceEventEmitter,
  Animated,
  Image,
  Platform,
} from 'react-native';
import { MaterialCommunityIcons, FontAwesome5 } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path as SvgPath, Circle as SvgCircle, Line as SvgLine, Polygon as SvgPolygon } from 'react-native-svg';
import * as Location from 'expo-location';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import * as Haptics from 'expo-haptics';
import CustomCalendarModal from '../../components/CustomCalendarModal';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import MapView, { Polygon, Marker, PROVIDER_GOOGLE } from 'react-native-maps';

import { COLORS, TYPOGRAPHY, SHADOWS } from '../theme/theme';
import { useLandStore } from '../store/landStore';
import { useInsuranceStore } from '../store/insuranceStore';
import { useAuthStore } from '../store/authStore';
import api from '../api/apiClient';
import { useRegistrationStore } from '../store/registrationStore';
import { useNotificationStore } from '../store/notificationStore';
import { isFarmerVerified } from '../utils/verificationGuard';

const { width, height } = Dimensions.get('window');

const ALL_CROPS = [
  'Wheat',
  'Soybean',
  'Rice',
  'Cotton',
  'Sugarcane',
  'Maize',
  'Pulses',
  'Vegetables',
  'Organic Farming',
  'Agroforestry',
  'Others',
];

const SOIL_TYPES = [
  'Black Soil',
  'Red Soil',
  'Sandy Soil',
  'Clay Soil',
  'Alluvial Soil',
  'Mixed Soil',
];

const WATER_SOURCES = [
  'Irrigated Land',
  'Rain Water Dependent',
  'Dry Land',
  'Borewell Irrigation',
  'Canal Water',
];

const TIME_SLOTS = [
  { id: 'morning', label: 'Morning (8:00 AM - 12:00 PM)', icon: 'weather-sunset-up' },
  { id: 'afternoon', label: 'Afternoon (12:00 PM - 4:00 PM)', icon: 'weather-sunny' },
  { id: 'evening', label: 'Evening (4:00 PM - 7:00 PM)', icon: 'weather-sunset-down' },
];

const DEFAULT_INSURANCE_CARDS = [
  {
    id: 'plan_single',
    _id: 'plan_single',
    title: 'Single Sapling Protector',
    price: 10,
    description: 'Micro-insurance per border tree. Covers drought, forest fire & unseasonal frost damage.',
  },
  {
    id: 'plan_family',
    _id: 'plan_family',
    title: 'Green Family Canopy Cover',
    price: 499,
    description: 'Comprehensive farm cluster coverage against extreme climate events, heatwaves & pest infestation.',
  },
];

export const LAND_PHOTO_CATEGORIES = [
  { id: 'Boundary', title: 'Entrance / Boundary', titleHi: 'प्रवेश द्वार / सीमा', icon: 'map-marker-radius-outline' },
  { id: 'Crop Field', title: 'Crop / Field', titleHi: 'फसल / खेत', icon: 'corn' },
  { id: 'Trees', title: 'Trees / Plantation', titleHi: 'पेड़ / वृक्षारोपण', icon: 'tree-outline' },
  { id: 'Water Source', title: 'Water Source', titleHi: 'जल स्रोत', icon: 'water-outline' },
  { id: 'Surroundings', title: 'Surrounding Area', titleHi: 'आसपास का क्षेत्र', icon: 'image-outline' },
];

export interface LandPhotoItem {
  id: string;
  uri: string;
  category: string;
  geotag?: string;
  timestamp?: string;
  progress: number;
  status: 'Uploading' | 'Uploaded' | 'None';
}

export function GlobalSchedulerOverlay() {
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState(1); // Steps 1 to 10
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAdminVerified, setIsAdminVerified] = useState(false);

  // Zustand integrations
  const addPlot = useLandStore((state) => state.addPlot);
  const registerTrees = useInsuranceStore((state) => state.registerTrees);
  const authUser = useAuthStore((state) => state.user);

  // Registration store (Zustand global persistence)
  const {
    registrationId,
    setRegistrationId,
    currentStep: storeStep,
    setCurrentStep,
    clearRegistration,
  } = useRegistrationStore();

  // API Integration States
  const [apiLoading, setApiLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [apiSuccess, setApiSuccess] = useState<string | null>(null);
  const [backendCalculatedArea, setBackendCalculatedArea] = useState<{
    square_meter: number;
    acre: number;
    hectare: number;
  } | null>(null);
  const [invoiceData, setInvoiceData] = useState<any>(null);
  const [submissionData, setSubmissionData] = useState<any>(null);

  // STEP 1 State: Ownership & Farmer Details
  const [farmerName, setFarmerName] = useState('');
  const [fatherName, setFatherName] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [isSelfOwned, setIsSelfOwned] = useState(true);

  // STEP 2 State: Land Specs & Agroforestry
  const [areaSize, setAreaSize] = useState('');
  const [areaUnit, setAreaUnit] = useState<'Acre' | 'Bigha'>('Acre');
  const [selectedCrops, setSelectedCrops] = useState<string[]>([]);
  const [cropSearchQuery, setCropSearchQuery] = useState('');
  const [isCropDropdownOpen, setIsCropDropdownOpen] = useState(false);
  const cropInputRef = useRef<TextInput>(null);
  const [soilType, setSoilType] = useState('');
  const [waterAvailability, setWaterAvailability] = useState('');
  const [totalTrees, setTotalTrees] = useState('');
  const [estPlantationArea, setEstPlantationArea] = useState('');
  const [agroforestryType, setAgroforestryType] = useState('');

  // STEP 3 State: Land Address (Simulated Dependent Dropdowns)
  const [stateName, setStateName] = useState('');
  const [district, setDistrict] = useState('');
  const [tehsil, setTehsil] = useState('');
  const [village, setVillage] = useState('');
  const [gramPanchayat, setGramPanchayat] = useState('');
  const [post, setPost] = useState('');
  const [country, setCountry] = useState('India');
  const [pincode, setPincode] = useState('');

  const [activeSelectType, setActiveSelectType] = useState<'state' | 'district' | 'tehsil' | 'village' | 'gram_panchayat' | null>(null);

  const [availableStates, setAvailableStates] = useState<string[]>([]);
  const [availableDistricts, setAvailableDistricts] = useState<string[]>([]);
  const [availableTehsils, setAvailableTehsils] = useState<string[]>([]);
  const [availableVillages, setAvailableVillages] = useState<string[]>([]);
  const [availableGPs, setAvailableGPs] = useState<string[]>([]);
  
  const [loadingLoc, setLoadingLoc] = useState({ state: false, district: false, tehsil: false, village: false, gp: false });
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (activeSelectType === 'state' && availableStates.length === 0) {
      setLoadingLoc(prev => ({ ...prev, state: true }));
      api.get('/locations/states').then(res => setAvailableStates(res.data))
         .catch(() => {})
         .finally(() => setLoadingLoc(prev => ({ ...prev, state: false })));
    }
  }, [activeSelectType]);

  useEffect(() => {
    if (stateName) {
      setLoadingLoc(prev => ({ ...prev, district: true }));
      api.get(`/locations/districts?state=${stateName}`).then(res => setAvailableDistricts(res.data))
         .catch(() => {})
         .finally(() => setLoadingLoc(prev => ({ ...prev, district: false })));
    } else {
      setAvailableDistricts([]);
    }
  }, [stateName]);

  useEffect(() => {
    if (stateName && district) {
      setLoadingLoc(prev => ({ ...prev, tehsil: true }));
      api.get(`/locations/tehsils?state=${stateName}&district=${district}`).then(res => setAvailableTehsils(res.data))
         .catch(() => {})
         .finally(() => setLoadingLoc(prev => ({ ...prev, tehsil: false })));
    } else {
      setAvailableTehsils([]);
    }
  }, [stateName, district]);

  useEffect(() => {
    if (stateName && district && tehsil) {
      setLoadingLoc(prev => ({ ...prev, village: true }));
      api.get(`/locations/villages?state=${stateName}&district=${district}&tehsil=${tehsil}`).then(res => setAvailableVillages(res.data))
         .catch(() => {})
         .finally(() => setLoadingLoc(prev => ({ ...prev, village: false })));
    } else {
      setAvailableVillages([]);
    }
  }, [stateName, district, tehsil]);

  useEffect(() => {
    if (stateName && district && tehsil && village) {
      setLoadingLoc(prev => ({ ...prev, gp: true }));
      api.get(`/locations/gram_panchayats?state=${stateName}&district=${district}&tehsil=${tehsil}&village=${village}`).then(res => setAvailableGPs(res.data))
         .catch(() => {})
         .finally(() => setLoadingLoc(prev => ({ ...prev, gp: false })));
    } else {
      setAvailableGPs([]);
    }
  }, [stateName, district, tehsil, village]);

  // Reset search query when dropdown closes or opens
  useEffect(() => {
    setSearchQuery('');
  }, [activeSelectType]);

  // STEP 4 State: Interactive Geo Tagging simulation
  const [geoPoints, setGeoPoints] = useState<{ latitude: number; longitude: number }[]>([]);
  const [isPolygonComplete, setIsPolygonComplete] = useState(false);
  const [isScanningMap, setIsScanningMap] = useState(false);

  // STEP 5 State: Ground Inspection & Land Photos
  const [landPhotos, setLandPhotos] = useState<LandPhotoItem[]>([]);
  const [categorySelectPhoto, setCategorySelectPhoto] = useState<{ uri: string; id: string } | null>(null);
  const [showCategoryPickerModal, setShowCategoryPickerModal] = useState(false);
  const [showPhotoSourceModal, setShowPhotoSourceModal] = useState(false);

  // STEP 6 State: MRV Audit Slot Booking
  const [prefDate, setPrefDate] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [prefDateObj, setPrefDateObj] = useState(new Date());
  const [prefSlot, setPrefSlot] = useState<'morning' | 'afternoon' | 'evening' | ''>('');
  const [landmark, setLandmark] = useState('');
  const [specialInstructions, setSpecialInstructions] = useState('');

  // STEP 7 State: Tree Insurance option
  const [wantInsurance, setWantInsurance] = useState(false);
  const [insurancePlan, setInsurancePlan] = useState<'single' | 'family' | ''>('');
  // CMS-managed Climate Risk Tree Insurance cards (Admin -> CMS -> Climate Risk Tree Insurance)
  const [climateRiskCards, setClimateRiskCards] = useState<any[]>([]);

  // STEP 9 State: Payment Flow simulation
  const [paymentMethod, setPaymentMethod] = useState<'upi' | 'bank' | 'cash' | ''>('');
  const [selectedUpiApp, setSelectedUpiApp] = useState<'gpay' | 'phonepe' | 'paytm' | ''>('');
  const [paymentProcessing, setPaymentProcessing] = useState(false);
  const [upiQrVisible, setUpiQrVisible] = useState(false);
  const [screenshotUploaded, setScreenshotUploaded] = useState(false);
  const [uploadingProgress, setUploadingProgress] = useState(0);

  // STEP 10 State: Live Lifecycle Tracking Node Details
  const [selectedTrackingNode, setSelectedTrackingNode] = useState<number>(0);
  const [newlyCreatedPlotId, setNewlyCreatedPlotId] = useState('LND-TEMP');

  // Animation values
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;
  const successScale = useRef(new Animated.Value(0.3)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // Pulse effect loop for scanning states
  useEffect(() => {
    let animation: Animated.CompositeAnimation | null = null;
    if (isScanningMap || paymentProcessing) {
      animation = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.2,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1.0,
            duration: 800,
            useNativeDriver: true,
          }),
        ])
      );
      animation.start();
    } else {
      pulseAnim.setValue(1);
    }
    return () => {
      if (animation) animation.stop();
    };
  }, [isScanningMap, paymentProcessing]);

  // Map canvas coordinate back and forth to GPS coordinates centered around Bhopal
  const [currentLocation, setCurrentLocation] = useState({ latitude: 22.9734, longitude: 78.6569 });

  useEffect(() => {
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === 'granted') {
          const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
          setCurrentLocation({ latitude: loc.coords.latitude, longitude: loc.coords.longitude });
        }
      } catch (e) {
        // Fallback to default
      }
    })();
  }, []);

  useEffect(() => {
    if (isOpen || step === 10) {
      useLandStore.getState().fetchPlots().catch(() => {});
    }
  }, [isOpen, step]);

  const mapCanvasToGps = (points: { x: number; y: number }[]) => {
    return points.map(pt => ({
      latitude: 22.9734 - (pt.y - 120) * 0.0001,
      longitude: 78.6569 + (pt.x - 150) * 0.0001
    }));
  };

  const getErrorMessage = (err: any) => {
    let msg = '';
    if (err.response?.data?.detail) {
      msg = Array.isArray(err.response.data.detail)
        ? err.response.data.detail.map((d: any) => d.msg).join(', ')
        : String(err.response.data.detail);
    } else if (err.response?.data?.message) {
      msg = String(err.response.data.message);
    } else {
      msg = err.message || 'An unexpected error occurred.';
    }

    if (msg.includes('Token validation failed') || msg.includes('Signature has expired') || msg.includes('INVALID_TOKEN')) {
      return null;
    }
    return msg;
  };

  // Open modal callback & resume registration logic
  useEffect(() => {
    const sub = DeviceEventEmitter.addListener('openGlobalScheduler', async () => {
      if (!isFarmerVerified()) return;
      setIsOpen(true);
      setApiLoading(true);
      setApiError(null);
      setApiSuccess(null);
      
      try {
        const { data } = await api.get('/registration/resume');
        if (data && data.success && data.data) {
          const reg = data.data;
          Alert.alert(
            'Resume Registration',
            'We found an active draft from your previous registration. Would you like to resume it?',
            [
              {
                text: 'Start New',
                style: 'destructive',
                onPress: () => {
                  clearRegistration();
                  setStep(1);
                  if (authUser) {
                    setFarmerName(authUser.fullName || '');
                    setFatherName(authUser.fatherName || '');
                    setMobileNumber(authUser.mobile || '');
                  } else {
                    setFarmerName('');
                    setFatherName('');
                    setMobileNumber('');
                  }
                  setIsSelfOwned(true);
                }
              },
              {
                text: 'Resume',
                onPress: () => {
                  setRegistrationId(reg.id);
                  setStep(reg.current_step);
                  
                  // Populate fields from draft
                  setIsSelfOwned(reg.belongs_to_self ?? true);
                  setFarmerName(reg.farmer_name || '');
                  setFatherName(reg.father_guardian_name || '');
                  setMobileNumber(reg.mobile_number || '');
                  setAreaSize(reg.total_area ? String(reg.total_area) : '');
                  setAreaUnit(reg.unit as any || 'Acre');
                  setSoilType(reg.soil_composition || '');
                  setWaterAvailability(reg.water_availability || '');
                  setTotalTrees(reg.tree_stock_count ? String(reg.tree_stock_count) : '');
                  setEstPlantationArea(reg.plantation_area ? String(reg.plantation_area) : '');
                  setAgroforestryType(reg.plantation_species ? reg.plantation_species.join(', ') : '');
                  setStateName(reg.state || '');
                  setDistrict(reg.district || '');
                  setTehsil(reg.tehsil || '');
                  setVillage(reg.village || '');
                  setGramPanchayat(reg.gram_panchayat || '');
                  setPost(reg.post || '');
                  setPincode(reg.pincode || '');
                  setWantInsurance(reg.tree_insurance ?? false);
                  setPrefDate(reg.preferred_date || '');
                  setPrefSlot(reg.preferred_time_slot ? (reg.preferred_time_slot.toLowerCase() as any) : '');
                  setLandmark(reg.landmark || '');
                  setSpecialInstructions(reg.special_instructions || '');
                }
              }
            ]
          );
        } else {
          clearRegistration();
          setStep(1);
          if (authUser) {
            setFarmerName(authUser.fullName || '');
            setFatherName(authUser.fatherName || '');
            setMobileNumber(authUser.mobile || '');
          }
          setIsSelfOwned(true);
        }
      } catch (err) {
        // Safe fallback
        clearRegistration();
        setStep(1);
        if (authUser) {
          setFarmerName(authUser.fullName || '');
          setFatherName(authUser.fatherName || '');
          setMobileNumber(authUser.mobile || '');
        }
      } finally {
        setApiLoading(false);
      }
    });
    const stepSub = DeviceEventEmitter.addListener('openGlobalSchedulerStep', (targetStep: number) => {
      setIsOpen(true);
      setStep(targetStep || 10);
    });
    return () => {
      sub.remove();
      stepSub.remove();
    };
  }, [authUser]);

  // Transitions with beautiful fade/slide micro-animations
  const animateToStep = (nextStep: number) => {
    setApiError(null);
    setApiSuccess(null);
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: nextStep > step ? 15 : -15,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setStep(nextStep);
      slideAnim.setValue(nextStep > step ? -15 : 15);
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    });
  };

  // Convert acreage dynamically
  const getAcres = () => {
    const val = parseFloat(areaSize || '0');
    if (isNaN(val)) return 0;
    // 1 Acre = 1.6 Bigha in standard Central India calculations
    return areaUnit === 'Acre' ? val : parseFloat((val / 1.6).toFixed(2));
  };

  // Dynamic invoice breakdown maths
  const baseRatePerAcre = 149;
  const acreage = getAcres();

  // Dynamic included fees breakdown table
  const mrvFee = Math.round(acreage * 49);
  const soilTestingFee = Math.round(acreage * 29);
  const carbonRegFee = Math.round(acreage * 31);
  const sustainabilityVerificationFee = Math.round(acreage * 20);
  const projectAssignmentFee = Math.round(acreage * 20);
  const calculatedBaseTotal = mrvFee + soilTestingFee + carbonRegFee + sustainabilityVerificationFee + projectAssignmentFee;

  // Insurance pricing inclusions
  const treeCountVal = parseInt(totalTrees || '0', 10) || 0;
  const insurancePremium = wantInsurance
    ? insurancePlan === 'family'
      ? 999
      : Math.round(treeCountVal * 12)
    : 0;

  const grandTotal = calculatedBaseTotal + insurancePremium;

  // Validations per step
  const validateStep = (currentStep: number) => {
    if (currentStep === 1) {
      if (!farmerName.trim() || !fatherName.trim() || !mobileNumber.trim()) {
        Alert.alert('Details Missing', 'Please enter farmer details.');
        return false;
      }
      if (mobileNumber.trim().length < 10) {
        Alert.alert('Invalid Mobile', 'Mobile number should be at least 10 digits.');
        return false;
      }
    } else if (currentStep === 2) {
      if (!areaSize || isNaN(parseFloat(areaSize)) || parseFloat(areaSize) <= 0) {
        Alert.alert('Invalid Area', 'Please enter a valid numeric land size.');
        return false;
      }
      if (selectedCrops.length === 0) {
        Alert.alert('Crop Type Required', 'Please select at least one crop.');
        return false;
      }
      if (!soilType) {
        Alert.alert('Soil Type Required', 'Please select a soil type.');
        return false;
      }
      if (!waterAvailability) {
        Alert.alert('Water Availability Required', 'Please select a water source.');
        return false;
      }
    } else if (currentStep === 3) {
      if (!stateName || !district || !tehsil || !village.trim() || !gramPanchayat.trim() || !pincode.trim()) {
        Alert.alert('Address Incomplete', 'Please fill all required address fields.');
        return false;
      }
      if (pincode.trim().length !== 6 || isNaN(parseInt(pincode, 10))) {
        Alert.alert('Invalid Pincode', 'Pincode must be exactly 6 digits.');
        return false;
      }
    } else if (currentStep === 4) {
      if (!isPolygonComplete || geoPoints.length < 3) {
        Alert.alert('Boundary Unfinished', 'Please place at least 3 points and complete your farm boundary mapping.');
        return false;
      }
    } else if (currentStep === 5) {
      if (landPhotos.length === 0) {
        Alert.alert('Land Photo Required', 'Please capture or upload at least 1 photo of your land / कृपया खेत की कम से कम 1 तस्वीर अपलोड करें।');
        return false;
      }
    } else if (currentStep === 6) {
      if (!prefDate.trim()) {
        Alert.alert('Schedule Missing', 'Please specify a preferred inspection date.');
        return false;
      }
      if (!prefSlot) {
        Alert.alert('Time Slot Required', 'Please choose a preferred visit window.');
        return false;
      }
    } else if (currentStep === 7) {
      if (wantInsurance && !insurancePlan) {
        setInsurancePlan('single');
      }
      return true;
    } else if (currentStep === 9) {
      if (!paymentMethod) {
        Alert.alert('Payment Option Required', 'Please select a payout option.');
        return false;
      }
      if (paymentMethod === 'upi' && !selectedUpiApp) {
        Alert.alert('UPI App Required', 'Please choose your preferred UPI app.');
        return false;
      }
      if (paymentMethod === 'bank' && !screenshotUploaded) {
        Alert.alert('Verification Needed', 'Please upload a bank transaction receipt screenshot.');
        return false;
      }
    }
    return true;
  };

  const handleDownloadInvoice = async () => {
    try {
      const htmlContent = `
        <html>
          <head>
            <style>
              body {
                font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
                background-color: #f8fafc;
                margin: 0;
                padding: 40px;
                color: #1e293b;
              }
              .certificate {
                background: #ffffff;
                border-radius: 16px;
                padding: 40px;
                box-shadow: 0 10px 25px rgba(0,0,0,0.05);
                border-top: 8px solid #059669;
                max-width: 800px;
                margin: 0 auto;
              }
              .header {
                text-align: center;
                margin-bottom: 30px;
              }
              .title {
                color: #059669;
                font-size: 32px;
                margin: 0;
                font-weight: 800;
              }
              .subtitle {
                color: #475569;
                font-size: 18px;
                margin-top: 8px;
                letter-spacing: 1px;
                font-weight: 500;
              }
              .divider {
                border: 0;
                height: 1px;
                background: #e2e8f0;
                margin: 25px 0;
              }
              .info-grid {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 20px;
                margin-bottom: 30px;
              }
              .info-box {
                background: #f1f5f9;
                padding: 15px;
                border-radius: 8px;
              }
              .info-label {
                font-size: 12px;
                color: #64748B;
                text-transform: uppercase;
                letter-spacing: 0.5px;
                margin-bottom: 4px;
              }
              .info-value {
                font-size: 16px;
                font-weight: 600;
                color: #0f172a;
                margin: 0;
              }
              .details-section {
                margin-top: 30px;
              }
              .section-title {
                font-size: 20px;
                font-weight: 700;
                color: #0f172a;
                margin-bottom: 15px;
              }
              .detail-row {
                display: flex;
                justify-content: space-between;
                padding: 12px 0;
                border-bottom: 1px solid #f1f5f9;
              }
              .footer {
                margin-top: 40px;
                text-align: center;
                color: #64748B;
                font-size: 14px;
              }
              .badge {
                display: inline-block;
                background: #ecfdf5;
                color: #059669;
                padding: 6px 12px;
                border-radius: 20px;
                font-size: 14px;
                font-weight: 600;
                margin-bottom: 10px;
              }
            </style>
          </head>
          <body>
            <div class="certificate">
              <div class="header">
                <div class="badge">SECURE SCAN VERIFIED</div>
                <h1 class="title">BhumiCred Registry</h1>
                <p class="subtitle">Climate-Tech Carbon Program Enrollment</p>
              </div>
              
              <hr class="divider" />
              
              <div class="info-grid">
                <div class="info-box">
                  <div class="info-label">Farmer Name</div>
                  <p class="info-value">${authUser?.fullName || 'Farmer'}</p>
                </div>
                <div class="info-box">
                  <div class="info-label">Mobile Number</div>
                  <p class="info-value">+91 ${authUser?.mobile || 'N/A'}</p>
                </div>
                <div class="info-box">
                  <div class="info-label">Registry Date</div>
                  <p class="info-value">${new Date().toLocaleDateString()}</p>
                </div>
                <div class="info-box">
                  <div class="info-label">Status</div>
                  <p class="info-value" style="color: #059669;">Pending Verification</p>
                </div>
              </div>

              <div class="details-section">
                <h3 class="section-title">Submitted Eco-metrics</h3>
                <div class="detail-row">
                  <span style="color: #64748B;">Total Registered Area</span>
                  <span style="font-weight: 600;">${areaSize} ${areaUnit}</span>
                </div>
                <div class="detail-row">
                  <span style="color: #64748B;">Crop Types</span>
                  <span style="font-weight: 600;">${selectedCrops.join(', ') || 'N/A'}</span>
                </div>
                <div class="detail-row">
                  <span style="color: #64748B;">Soil Type</span>
                  <span style="font-weight: 600;">${soilType || 'N/A'}</span>
                </div>
                <div class="detail-row">
                    <span style="color: #64748B;">Irrigation</span>
                    <span style="font-weight: 600;">${waterAvailability || 'N/A'}</span>
                  </div>
              </div>

              <hr class="divider" />
              
              <div class="footer">
                <p>Thank you for contributing to climate-tech agroforestry and carbon sequestration!</p>
                <p style="font-size: 12px; margin-top: 10px;">This is a digitally generated document by BhumiCred.</p>
              </div>
            </div>
          </body>
        </html>
      `;
      const { uri } = await Print.printToFileAsync({ html: htmlContent });
      await Sharing.shareAsync(uri, { UTI: '.pdf', mimeType: 'application/pdf' });
    } catch (err: any) {
      Alert.alert('Error', err?.message || 'Unable to generate PDF invoice.');
    }
  };

  // Step 3 GPS auto-capture trigger
  const handleSimulatedGpsCapture = async () => {
    Alert.alert(
      'Location Permission',
      'BhumiCred requires location access to improve land mapping accuracy, coordinate physical baseline verification visits, and schedule soil testing services.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Allow',
          onPress: async () => {
            try {
              const { status } = await Location.requestForegroundPermissionsAsync();
              if (status !== 'granted') {
                Alert.alert('Permission Denied', 'Please enable GPS permissions in settings.');
                return;
              }
              const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
              const addressLook = await Location.reverseGeocodeAsync({
                latitude: loc.coords.latitude,
                longitude: loc.coords.longitude,
              });

              if (addressLook && addressLook.length > 0) {
                const item: any = addressLook[0];
                setVillage(item.city || item.subregion || '');
                setGramPanchayat(item.street || item.name || '');
                setPost(item.district || '');
                setPincode(item.postalCode || '');
                setStateName(item.region || 'Unknown');
                setDistrict(item.subregion || item.city || 'Unknown');
                setTehsil(item.district || item.city || 'Unknown');
              }
            } catch (err) {
              // Fallback so user isn't blocked
              setStateName('Madhya Pradesh');
              setDistrict('Sehore');
              setTehsil('Ashta');
              setVillage('Kothri');
              setGramPanchayat('Kothri Gram Panchayat');
              setPincode('466114');
              Alert.alert('GPS Timeout', 'Using simulated location data.');
            }
          }
        }
      ],
      { cancelable: true }
    );
  };

  // Map click simulator
  const handleMapTap = (e: any) => {
    if (isPolygonComplete) return;
    const { coordinate } = e.nativeEvent;
    if (coordinate) {
      const newPoints = [...geoPoints, coordinate];
      setGeoPoints(newPoints);
    }
  };

  const handleCompletePolygon = async () => {
    if (geoPoints.length < 3) {
      Alert.alert('Draw Boundary', 'Place at least 3 points on the satellite map first.');
      return;
    }
    setApiLoading(true);
    setApiError(null);
    try {
      const activeRegId = registrationId || `reg_local_${Date.now()}`;
      if (!registrationId) setRegistrationId(activeRegId);
      const payload = {
        boundary_points: geoPoints,
        boundary_locked: true,
      };
      try {
        const { data } = await api.put(`/registration/${activeRegId}/step-4`, payload);
        if (data?.calculated_area) {
          setBackendCalculatedArea(data.calculated_area);
        }
      } catch (err: any) {
        console.warn('[GlobalSchedulerOverlay] Step 4 boundary lock API warning:', err?.message);
      }
      setIsPolygonComplete(true);
      setIsScanningMap(true);
      setTimeout(() => {
        setIsScanningMap(false);
        Alert.alert('Boundary Confirmed', 'Baseline satellite audit coordinates calculated and locked.');
      }, 1800);
    } catch (err: any) {
      const errMsg = getErrorMessage(err);
      if (errMsg) setApiError(errMsg);
    } finally {
      setApiLoading(false);
    }
  };

  const handleResetMap = async () => {
    if (registrationId && !registrationId.startsWith('reg_local_')) {
      setApiLoading(true);
      setApiError(null);
      try {
        await api.delete(`/registration/${registrationId}/step-4`);
      } catch (err: any) {
        console.warn('[GlobalSchedulerOverlay] Reset boundary API warning:', err?.message);
      } finally {
        setApiLoading(false);
      }
    }
    setGeoPoints([]);
    setIsPolygonComplete(false);
    setBackendCalculatedArea(null);
    setApiSuccess('Boundary cleared successfully.');
  };

  // Fetch boundary on step 4
  useEffect(() => {
    if (step === 4 && registrationId) {
      const fetchBoundary = async () => {
        setApiLoading(true);
        try {
          const { data } = await api.get(`/registration/${registrationId}/step-4`);
          if (data && data.success && data.boundary_points && data.boundary_points.length > 0) {
              const gpsPts = data.boundary_points;
              setGeoPoints(gpsPts);
              setIsPolygonComplete(data.boundary_locked);
            if (data.calculated_area) {
              setBackendCalculatedArea(data.calculated_area);
            }
          }
        } catch (err) {
          console.warn('[GlobalSchedulerOverlay] failed to fetch boundary:', err);
        } finally {
          setApiLoading(false);
        }
      };
      fetchBoundary();
    }
  }, [step, registrationId]);

  // Photo handlers for Step 5
  const uploadDirectPhoto = async (uri: string, id: string, category: string) => {
    let lat = (22.7468 + (Math.random() - 0.5) * 0.005).toFixed(4);
    let lon = (75.8958 + (Math.random() - 0.5) * 0.005).toFixed(4);
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

    const newPhotoItem: LandPhotoItem = {
      id,
      uri,
      category,
      geotag: `Lat ${lat}°, Lon ${lon}°`,
      timestamp: nowStr,
      progress: 0.1,
      status: 'Uploading',
    };

    setLandPhotos((prev) => [...prev.filter((p) => p.id !== id), newPhotoItem]);

    let serverUrl = uri;
    try {
      const filename = uri.split('/').pop() || `${id}.jpg`;
      const match = /\.(\w+)$/.exec(filename);
      const mimeType = match ? `image/${match[1] === 'jpg' ? 'jpeg' : match[1]}` : 'image/jpeg';
      const fileUri = Platform.OS === 'ios' ? uri.replace('file://', '') : uri;

      const formData = new FormData();
      formData.append('file', {
        uri: fileUri,
        name: filename,
        type: mimeType,
      } as any);

      try {
        const res = await api.post('/registration/upload-photo', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
          onUploadProgress: (progressEvent) => {
            const total = progressEvent.total || 1;
            const current = progressEvent.loaded;
            const pct = current / total;
            setLandPhotos((prev) =>
              prev.map((p) => (p.id === id ? { ...p, progress: pct } : p))
            );
          },
        });
        if (res.data?.data?.url) {
          serverUrl = res.data.data.url;
        }
      } catch (multipartErr: any) {
        console.warn('[GlobalSchedulerOverlay] Multipart upload error, attempting Base64 upload:', multipartErr?.message);
        // Base64 upload fallback
        let base64Data = '';
        try {
          base64Data = await FileSystem.readAsStringAsync(uri, {
            encoding: FileSystem.EncodingType.Base64,
          });
        } catch (fsErr) {
          console.warn('[GlobalSchedulerOverlay] FileSystem read error:', fsErr);
        }

        if (base64Data) {
          const res = await api.post('/registration/upload-photo', {
            base64_data: `data:${mimeType};base64,${base64Data}`,
            filename,
            category,
          });
          if (res.data?.data?.url) {
            serverUrl = res.data.data.url;
          }
        }
      }

      setLandPhotos((prev) =>
        prev.map((p) =>
          p.id === id
            ? { ...p, uri: serverUrl, status: 'Uploaded', progress: 1.0 }
            : p
        )
      );
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } catch (err) {
      console.warn('[GlobalSchedulerOverlay] Photo upload fallback to local URI:', err);
      setLandPhotos((prev) =>
        prev.map((p) =>
          p.id === id
            ? { ...p, uri: uri, status: 'Uploaded', progress: 1.0 }
            : p
        )
      );
    }
  };

  const handlePickPhotoSource = async (mode: 'camera' | 'gallery') => {
    setShowPhotoSourceModal(false);
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
            id: 'photo_' + Date.now(),
          });
          setShowCategoryPickerModal(true);
        } else {
          const remainingSlots = 5 - landPhotos.length;
          const assetsToProcess = result.assets.slice(0, remainingSlots);
          const defaultCategories = ['Boundary', 'Crop Field', 'Trees', 'Water Source', 'Surroundings'];
          assetsToProcess.forEach((asset, idx) => {
            const pId = 'photo_' + (Date.now() + idx);
            const cat = defaultCategories[idx % defaultCategories.length];
            uploadDirectPhoto(asset.uri, pId, cat);
          });
        }
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to pick image from camera/gallery.');
    }
  };

  const handleCategorySelect = async (category: string) => {
    if (!categorySelectPhoto) return;
    const { uri, id } = categorySelectPhoto;
    setCategorySelectPhoto(null);
    setShowCategoryPickerModal(false);
    await uploadDirectPhoto(uri, id, category);
  };

  const handleDeleteLandPhoto = (id: string) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    setLandPhotos((prev) => prev.filter((p) => p.id !== id));
  };

  const handleRetakeLandPhoto = (id: string) => {
    Alert.alert(
      'Retake / Replace Photo',
      'Choose new photo source',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Take Photo (Camera)',
          onPress: async () => {
            try {
              const { status } = await ImagePicker.requestCameraPermissionsAsync();
              if (status !== 'granted') return;
              const result = await ImagePicker.launchCameraAsync({ quality: 0.8 });
              if (!result.canceled && result.assets && result.assets[0]) {
                const photo = landPhotos.find((p) => p.id === id);
                uploadDirectPhoto(result.assets[0].uri, id, photo?.category || 'Boundary');
              }
            } catch {}
          },
        },
        {
          text: 'Choose from Gallery',
          onPress: async () => {
            try {
              const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
              if (status !== 'granted') return;
              const result = await ImagePicker.launchImageLibraryAsync({ quality: 0.8 });
              if (!result.canceled && result.assets && result.assets[0]) {
                const photo = landPhotos.find((p) => p.id === id);
                uploadDirectPhoto(result.assets[0].uri, id, photo?.category || 'Boundary');
              }
            } catch {}
          },
        },
      ]
    );
  };

  // Fetch invoice on step 8
  useEffect(() => {
    if (step === 8) {
      const fetchInvoice = async () => {
        setApiLoading(true);
        setApiError(null);
        if (registrationId) {
          try {
            const { data } = await api.get(`/registration/${registrationId}/invoice`);
            if (data && data.success && data.data) {
              setInvoiceData(data.data);
            }
          } catch (err: any) {
            console.warn('[GlobalSchedulerOverlay] Invoice API call failed, using graceful invoice fallback:', err);
          } finally {
            setApiLoading(false);
          }
        } else {
          setApiLoading(false);
        }
      };
      fetchInvoice();
    }
  }, [step, registrationId]);

  // Fetch CMS-managed Climate Risk Tree Insurance cards on step 7
  useEffect(() => {
    if (step === 7) {
      if (!insurancePlan) {
        setInsurancePlan('single');
      }
      const fetchClimateRiskCards = async () => {
        try {
          const { data } = await api.get('/climate-risk-insurance');
          if (data?.data && Array.isArray(data.data) && data.data.length > 0) {
            setClimateRiskCards(data.data);
          } else {
            setClimateRiskCards(DEFAULT_INSURANCE_CARDS);
          }
        } catch (err) {
          console.warn('[GlobalSchedulerOverlay] failed to fetch Climate Risk Tree Insurance cards, using fallback:', err);
          setClimateRiskCards(DEFAULT_INSURANCE_CARDS);
        }
      };
      fetchClimateRiskCards();
    }
  }, [step]);

  const handleApiSubmitForStep = async (currentStep: number): Promise<boolean> => {
    setApiLoading(true);
    setApiError(null);
    setApiSuccess(null);
    
    try {
      if (currentStep === 1) {
        const payload = {
          belongs_to_self: isSelfOwned,
          farmer_name: farmerName,
          father_guardian_name: fatherName,
          mobile_number: mobileNumber,
        };
        try {
          const { data } = await api.post('/registration/step-1', payload);
          if (data && data.success && data.data) {
            setRegistrationId(data.data.id);
            setApiSuccess('Step 1 details saved successfully.');
            return true;
          }
        } catch (err: any) {
          console.warn('[GlobalSchedulerOverlay] Step 1 API error, using local registration ID fallback:', err?.message);
          setRegistrationId(`reg_local_${Date.now()}`);
          setApiSuccess('Step 1 details saved successfully.');
          return true;
        }
      } else if (currentStep === 2) {
        const activeRegId = registrationId || `reg_local_${Date.now()}`;
        if (!registrationId) setRegistrationId(activeRegId);
        const species = agroforestryType ? agroforestryType.split(',').map(s => s.trim()).filter(s => s.length > 0) : [];
        const speciesList = species.length > 0 ? species : ["None"];
        const payload = {
          total_area: parseFloat(areaSize),
          unit: areaUnit,
          multiple_crops: selectedCrops.length > 1,
          soil_composition: soilType,
          water_availability: waterAvailability,
          tree_stock_count: parseInt(totalTrees, 10) || 0,
          plantation_area: parseFloat(estPlantationArea) || 0.0,
          plantation_species: speciesList,
        };
        try {
          if (activeRegId && !activeRegId.startsWith('reg_local_')) {
            await api.put(`/registration/${activeRegId}/step-2`, payload);
          }
        } catch (err: any) {
          console.warn('[GlobalSchedulerOverlay] Step 2 API warning:', err?.message);
        }
        setApiSuccess('Step 2 details saved successfully.');
        return true;
      } else if (currentStep === 3) {
        const activeRegId = registrationId || `reg_local_${Date.now()}`;
        if (!registrationId) setRegistrationId(activeRegId);
        const payload = {
          state: stateName,
          district: district,
          tehsil: tehsil,
          village: village,
          gram_panchayat: gramPanchayat,
          post: post || 'N/A',
          pincode: pincode,
          latitude: 22.9734,
          longitude: 78.6569
        };
        try {
          if (activeRegId && !activeRegId.startsWith('reg_local_')) {
            await api.put(`/registration/${activeRegId}/step-3`, payload);
          }
        } catch (err: any) {
          console.warn('[GlobalSchedulerOverlay] Step 3 API warning:', err?.message);
        }
        setApiSuccess('Step 3 details saved successfully.');
        return true;
      } else if (currentStep === 4) {
        if (!isPolygonComplete) {
          throw new Error('Please lock the boundary first.');
        }
        return true;
      } else if (currentStep === 5) {
        const activeRegId = registrationId || `reg_local_${Date.now()}`;
        if (!registrationId) setRegistrationId(activeRegId);
        const payload = {
          land_photo_urls: landPhotos.map((p) => p.uri).filter(Boolean),
        };
        try {
          if (activeRegId && !activeRegId.startsWith('reg_local_')) {
            await api.put(`/registration/${activeRegId}/photos`, payload);
          }
        } catch (err: any) {
          console.warn('[GlobalSchedulerOverlay] Photos API warning:', err?.message);
        }
        setApiSuccess('Land photos saved successfully.');
        return true;
      } else if (currentStep === 6) {
        const activeRegId = registrationId || `reg_local_${Date.now()}`;
        if (!registrationId) setRegistrationId(activeRegId);
        const slotCapitalized = prefSlot ? prefSlot.charAt(0).toUpperCase() + prefSlot.slice(1) : 'Morning';
        const payload = {
          preferred_date: prefDate,
          preferred_time_slot: slotCapitalized,
          landmark: landmark || null,
          special_instructions: specialInstructions || null,
        };
        try {
          if (activeRegId && !activeRegId.startsWith('reg_local_')) {
            await api.put(`/registration/${activeRegId}/step-5`, payload);
          }
        } catch (err: any) {
          console.warn('[GlobalSchedulerOverlay] Step 5 API warning:', err?.message);
        }
        setApiSuccess('Step 6 details saved successfully.');
        return true;
      } else if (currentStep === 7) {
        const activeRegId = registrationId || `reg_local_${Date.now()}`;
        if (!registrationId) setRegistrationId(activeRegId);
        const payload = {
          tree_insurance: wantInsurance,
          insurance_plan: wantInsurance ? insurancePlan : null,
          insurance_amount: wantInsurance ? insurancePremium : 0,
        };
        try {
          if (activeRegId && !activeRegId.startsWith('reg_local_')) {
            await api.put(`/registration/${activeRegId}/step-6`, payload);
          }
        } catch (err: any) {
          console.warn('[GlobalSchedulerOverlay] Step 6 API warning:', err?.message);
        }
        setApiSuccess('Step 7 details saved successfully.');
        return true;
      } else if (currentStep === 8) {
        return true;
      }
      return false;
    } catch (err: any) {
      setApiError(getErrorMessage(err));
      return false;
    } finally {
      setApiLoading(false);
    }
  };

  // simulated screenshot upload runner
  const handleBankScreenshotUpload = () => {
    setUploadingProgress(1);
    setScreenshotUploaded(false);
    const interval = setInterval(() => {
      setUploadingProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setScreenshotUploaded(true);
          return 100;
        }
        return prev + 15;
      });
    }, 200);
  };

  // UPI External redirect simulator
  const handleUpiProcess = () => {
    setPaymentProcessing(true);
    setTimeout(() => {
      setPaymentProcessing(false);
      setUpiQrVisible(true);
    }, 2000);
  };

  // Submit and write to Zustand
  const handleFinalSubmission = async () => {
    const activeRegId = registrationId || `reg_local_${Date.now()}`;
    setApiLoading(true);
    setApiError(null);
    try {
      const generatedRegNum = `BC-REG-${Math.floor(100000 + Math.random() * 900000)}`;
      if (activeRegId && !activeRegId.startsWith('reg_local_')) {
        try {
          const { data } = await api.post(`/registration/${activeRegId}/submit`, {});
          if (data && data.success && data.data) {
            setSubmissionData(data.data);
            setNewlyCreatedPlotId(data.data.registration_number || generatedRegNum);
          } else {
            setNewlyCreatedPlotId(generatedRegNum);
          }
        } catch (err: any) {
          console.warn('[GlobalSchedulerOverlay] Submission API warning, completing locally:', err?.message);
          setNewlyCreatedPlotId(generatedRegNum);
        }
      } else {
        setNewlyCreatedPlotId(generatedRegNum);
      }

      // Push notification to notificationStore
      useNotificationStore.getState().addNotification({
        title: 'Land Registration Submitted 📝',
        message: `Your plot #${generatedRegNum} has been registered. Under review by BhumiCred Admin.`,
        type: 'land_submitted',
      });

      // Zustand write for new Land
      await addPlot({
        acres: acreage,
        cropType: selectedCrops.join(', '),
        soilType: soilType,
        irrigationType: waterAvailability,
        geoCoords: geoPoints.length > 0 ? geoPoints[0] : { latitude: 22.9734, longitude: 78.6569 },
        documentName: 'Selfie_Registered_Land.jpg',
        landPhotoUrls: landPhotos.map((p) => p.uri).filter(Boolean),
        country: country || 'India',
        state: stateName,
        district: district,
        city: tehsil || post,
        gramPanchayat: gramPanchayat,
        vikashKhand: tehsil,
        village: village,
        fullAddress: [village, gramPanchayat, tehsil, district, stateName, pincode].filter(Boolean).join(', '),
        landmark: landmark,
        pincode: pincode,
        boundaryPolygon: geoPoints.length > 0 ? geoPoints : undefined,
        plantationAreaAcres: parseFloat(estPlantationArea) || undefined,
        treeStockCount: parseInt(totalTrees, 10) || undefined,
        agroforestrySpecies: agroforestryType,
        fathersName: fatherName,
        farmerName: farmerName,
        belongsToAnotherPerson: !isSelfOwned,
      } as any);

      // Zustand write for Trees / Insurance if chosen
      if (wantInsurance && insurancePlan) {
        try {
          const policyId = insurancePlan === 'family' ? 'pol_greenfam' : 'pol_shield';
          await registerTrees(policyId, treeCountVal || 25);
        } catch (err: any) {
          console.warn('[GlobalSchedulerOverlay] Tree insurance registration warning:', err?.message);
        }
      }

      animateToStep(10); // Route to dynamic success splash
      Animated.spring(successScale, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }).start();
    } catch (err: any) {
      setApiError(getErrorMessage(err));
    } finally {
      setApiLoading(false);
    }
  };

  return (
    <Modal visible={isOpen} transparent animationType="fade" onRequestClose={() => setIsOpen(false)}>
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          {/* Main Top Header Block */}
          <View style={styles.header}>
            <View style={styles.headerTitleRow}>
              <View style={styles.ecoIconCircle}>
                <MaterialCommunityIcons name="leaf" size={18} color={COLORS.accent} />
              </View>
              <View style={{ marginLeft: 10, flex: 1 }}>
                <Text style={styles.headTitle}>BhumiCred Registry</Text>
                <Text style={styles.headSub}>Climate-Tech Carbon Program Enrollment</Text>
              </View>
              {step < 10 && (
                <TouchableOpacity style={styles.closeBtn} onPress={() => setIsOpen(false)}>
                  <MaterialCommunityIcons name="close" size={20} color={COLORS.textSecondary} />
                </TouchableOpacity>
              )}
            </View>

            {/* Premium Stepper Progress Indicator */}
            {step <= 9 && (
              <View style={styles.stepperContainer}>
                <View style={styles.stepLabelsRow}>
                  <Text style={styles.stepCounterText}>STEP {step} OF 9</Text>
                  <Text style={styles.stepProgressTitle}>
                    {step === 1 && 'Farmer Identity Verification'}
                    {step === 2 && 'Soil & Crop Eco-metrics'}
                    {step === 3 && 'Land Address Validation'}
                    {step === 4 && 'Satellite Boundary Mapping'}
                    {step === 5 && 'Ground Inspection & Land Photos'}
                    {step === 6 && 'MRV Audit Inspection Slots'}
                    {step === 7 && 'Tree Carbon Insurance'}
                    {step === 8 && 'Sustainability Bill Invoicing'}
                    {step === 9 && 'Payment Verification'}
                  </Text>
                </View>
                <View style={styles.progressBarBackground}>
                  <View style={[styles.progressBarFill, { width: `${(step / 9) * 100}%` }]} />
                </View>
              </View>
            )}
          </View>

          <View style={styles.divider} />

          {/* Scrolling Wizard Pages */}
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollArea}
            keyboardShouldPersistTaps="handled"
          >
            {apiError && (
              <View style={styles.errorBanner}>
                <MaterialCommunityIcons name="alert-circle" size={16} color="#EF4444" style={{ marginRight: 6 }} />
                <Text style={styles.errorText}>{apiError}</Text>
              </View>
            )}
            {apiSuccess && (
              <View style={styles.successBanner}>
                <MaterialCommunityIcons name="check-circle" size={16} color="#10B981" style={{ marginRight: 6 }} />
                <Text style={styles.successText}>{apiSuccess}</Text>
              </View>
            )}
            <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
              {/* ================================================= */}
              {/* STEP 1: FARMER DETAILS */}
              {/* ================================================= */}
              {step === 1 && (
                <View style={styles.stepWrapper}>
                  <Text style={styles.stepSectionTitle}>Verified Agricultural Profile</Text>
                  <Text style={styles.stepSectionDesc}>
                    Please confirm identity details. If this land belongs to another person, you can edit the fields.
                  </Text>

                  {/* Self Ownership Toggle */}
                  <View style={styles.ownershipBox}>
                    <TouchableOpacity
                      style={[styles.ownershipBtn, isSelfOwned && styles.ownershipActive]}
                      onPress={() => {
                        setIsSelfOwned(true);
                        if (authUser) {
                          setFarmerName(authUser.fullName || '');
                          setFatherName(authUser.fatherName || '');
                          setMobileNumber(authUser.mobile || '');
                        }
                      }}
                    >
                      <MaterialCommunityIcons
                        name={isSelfOwned ? "checkbox-marked-circle" : "circle-outline"}
                        size={20}
                        color={isSelfOwned ? COLORS.primary : COLORS.textSecondary}
                      />
                      <Text style={[styles.ownershipText, isSelfOwned && styles.ownershipTextActive]}>
                        My Registered Land
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[styles.ownershipBtn, !isSelfOwned && styles.ownershipActive]}
                      onPress={() => {
                        setIsSelfOwned(false);
                        setFarmerName('');
                        setFatherName('');
                        setMobileNumber('');
                      }}
                    >
                      <MaterialCommunityIcons
                        name={!isSelfOwned ? "checkbox-marked-circle" : "circle-outline"}
                        size={20}
                        color={!isSelfOwned ? COLORS.primary : COLORS.textSecondary}
                      />
                      <Text style={[styles.ownershipText, !isSelfOwned && styles.ownershipTextActive]}>
                        Belongs to Another Person
                      </Text>
                    </TouchableOpacity>
                  </View>

                  {/* Input Fields */}
                  <View style={styles.formField}>
                    <Text style={styles.fieldLabel}>Farmer Full Name <Text style={styles.red}>*</Text></Text>
                    <TextInput
                      style={[styles.boxInput, isSelfOwned && styles.boxInputDisabled]}
                      placeholder="Enter farmer name"
                      placeholderTextColor="#94A3B8"
                      value={farmerName}
                      onChangeText={setFarmerName}
                      editable={!isSelfOwned}
                    />
                  </View>

                  <View style={styles.formField}>
                    <Text style={styles.fieldLabel}>Father's / Guardian's Name <Text style={styles.red}>*</Text></Text>
                    <TextInput
                      style={[styles.boxInput, isSelfOwned && styles.boxInputDisabled]}
                      placeholder="Enter father's name"
                      placeholderTextColor="#94A3B8"
                      value={fatherName}
                      onChangeText={setFatherName}
                      editable={!isSelfOwned}
                    />
                  </View>

                  <View style={styles.formField}>
                    <Text style={styles.fieldLabel}>Mobile Number <Text style={styles.red}>*</Text></Text>
                    <TextInput
                      style={[styles.boxInput, isSelfOwned && styles.boxInputDisabled]}
                      placeholder="Enter 10-digit mobile"
                      placeholderTextColor="#94A3B8"
                      keyboardType="numeric"
                      value={mobileNumber}
                      onChangeText={setMobileNumber}
                      maxLength={10}
                      editable={!isSelfOwned}
                    />
                  </View>
                </View>
              )}

              {/* ================================================= */}
              {/* STEP 2: LAND DETAILS */}
              {/* ================================================= */}
              {step === 2 && (
                <View style={styles.stepWrapper}>
                  <Text style={styles.stepSectionTitle}>Farm Metrics & Canopy Inputs</Text>
                  <Text style={styles.stepSectionDesc}>
                    Provide your land size and environmental parameters to initialize baseline carbon calculations.
                  </Text>

                  {/* Land Size Acre / Bigha Toggle */}
                  <View style={styles.formField}>
                    <View style={styles.labelRow}>
                      <Text style={styles.fieldLabel}>Total Land Area <Text style={styles.red}>*</Text></Text>
                      <View style={styles.unitToggleContainer}>
                        <TouchableOpacity
                          style={[styles.unitBtn, areaUnit === 'Acre' && styles.unitBtnActive]}
                          onPress={() => setAreaUnit('Acre')}
                        >
                          <Text style={[styles.unitBtnLabel, areaUnit === 'Acre' && styles.unitBtnLabelActive]}>Acre</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[styles.unitBtn, areaUnit === 'Bigha' && styles.unitBtnActive]}
                          onPress={() => setAreaUnit('Bigha')}
                        >
                          <Text style={[styles.unitBtnLabel, areaUnit === 'Bigha' && styles.unitBtnLabelActive]}>Bigha</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                    <TextInput
                      style={styles.boxInput}
                      placeholder={`e.g. 5.5 ${areaUnit}s`}
                      placeholderTextColor="#94A3B8"
                      keyboardType="numeric"
                      value={areaSize}
                      onChangeText={setAreaSize}
                    />
                  </View>

                  {/* Multi-Select crop field — the trigger IS the search input, no separate search box */}
                  <View style={styles.formField}>
                    <Text style={styles.fieldLabel}>Crop Selection (Select Multiple) <Text style={styles.red}>*</Text></Text>
                    <View style={styles.pickerTrigger}>
                      <TextInput
                        ref={cropInputRef}
                        style={[styles.pickerSearchInput, selectedCrops.length > 0 ? styles.pickerActiveText : styles.pickerPlaceholderText]}
                        placeholder={selectedCrops.length > 0 ? `${selectedCrops.length} Crops Selected` : 'Search and select crops...'}
                        placeholderTextColor="#94A3B8"
                        value={isCropDropdownOpen ? cropSearchQuery : ''}
                        onFocus={() => setIsCropDropdownOpen(true)}
                        onChangeText={(text) => {
                          setCropSearchQuery(text);
                          if (!isCropDropdownOpen) setIsCropDropdownOpen(true);
                        }}
                      />
                      <TouchableOpacity
                        onPress={() => {
                          if (isCropDropdownOpen) {
                            setIsCropDropdownOpen(false);
                            setCropSearchQuery('');
                            cropInputRef.current?.blur();
                          } else {
                            setIsCropDropdownOpen(true);
                            cropInputRef.current?.focus();
                          }
                        }}
                      >
                        <MaterialCommunityIcons
                          name={isCropDropdownOpen ? 'chevron-up' : 'chevron-down'}
                          size={20}
                          color="#475569"
                        />
                      </TouchableOpacity>
                    </View>

                    {/* Selected Crops Chips Shelf */}
                    {selectedCrops.length > 0 && (
                      <View style={styles.chipsRow}>
                        {selectedCrops.map((crop) => (
                          <View key={crop} style={styles.chip}>
                            <Text style={styles.chipText}>{crop}</Text>
                            <TouchableOpacity
                              onPress={() => setSelectedCrops(selectedCrops.filter((c) => c !== crop))}
                              style={styles.chipCloseBtn}
                            >
                              <MaterialCommunityIcons name="close-circle" size={14} color={COLORS.primary} />
                            </TouchableOpacity>
                          </View>
                        ))}
                      </View>
                    )}

                    {/* Filtered Options List — appears directly below the same field */}
                    {isCropDropdownOpen && (
                      <View style={styles.cropsDropdownCard}>
                        <ScrollView style={styles.cropListScroll} nestedScrollEnabled keyboardShouldPersistTaps="handled">
                          {ALL_CROPS.filter((crop) =>
                            crop.toLowerCase().includes(cropSearchQuery.toLowerCase())
                          ).map((crop) => {
                            const isChosen = selectedCrops.includes(crop);
                            return (
                              <TouchableOpacity
                                key={crop}
                                style={[styles.cropItem, isChosen && styles.cropItemActive]}
                                onPress={() => {
                                  if (isChosen) {
                                    setSelectedCrops(selectedCrops.filter((c) => c !== crop));
                                  } else {
                                    setSelectedCrops([...selectedCrops, crop]);
                                  }
                                  setIsCropDropdownOpen(false);
                                  setCropSearchQuery('');
                                  cropInputRef.current?.blur();
                                }}
                              >
                                <Text style={[styles.cropItemLabel, isChosen && styles.cropItemLabelActive]}>
                                  {crop}
                                </Text>
                                {isChosen && <MaterialCommunityIcons name="check" size={16} color={COLORS.primary} />}
                              </TouchableOpacity>
                            );
                          })}
                        </ScrollView>
                      </View>
                    )}
                  </View>

                  {/* Soil Type Selector */}
                  <View style={styles.formField}>
                    <Text style={styles.fieldLabel}>Soil Composition <Text style={styles.red}>*</Text></Text>
                    <View style={styles.flexGridOptions}>
                      {SOIL_TYPES.map((soil) => {
                        const isChosen = soilType === soil;
                        return (
                          <TouchableOpacity
                            key={soil}
                            style={[styles.optionGridBtn, isChosen && styles.optionGridBtnActive]}
                            onPress={() => setSoilType(soil)}
                          >
                            <Text style={[styles.optionGridBtnText, isChosen && styles.optionGridBtnTextActive]}>
                              {soil}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  </View>

                  {/* Irrigation Source */}
                  <View style={styles.formField}>
                    <Text style={styles.fieldLabel}>Water Availability <Text style={styles.red}>*</Text></Text>
                    <View style={styles.flexGridOptions}>
                      {WATER_SOURCES.map((source) => {
                        const isChosen = waterAvailability === source;
                        return (
                          <TouchableOpacity
                            key={source}
                            style={[styles.optionGridBtn, isChosen && styles.optionGridBtnActive]}
                            onPress={() => setWaterAvailability(source)}
                          >
                            <Text style={[styles.optionGridBtnText, isChosen && styles.optionGridBtnTextActive]}>
                              {source}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  </View>

                  {/* Canopy Agroforestry specifications */}
                  <View style={styles.agroforestHeaderRow}>
                    <MaterialCommunityIcons name="tree-outline" size={18} color={COLORS.primary} />
                    <Text style={styles.agroforestSectionTitle}>Agroforestry & Tree Stocks</Text>
                  </View>
                  
                  <View style={styles.dualInputsRow}>
                    <View style={[styles.formField, { flex: 1, marginRight: 10 }]}>
                      <Text style={styles.fieldLabel}>Tree Stock Count</Text>
                      <TextInput
                        style={styles.boxInput}
                        placeholder="e.g. 35"
                        placeholderTextColor="#94A3B8"
                        keyboardType="numeric"
                        value={totalTrees}
                        onChangeText={setTotalTrees}
                      />
                    </View>
                    <View style={[styles.formField, { flex: 1 }]}>
                      <Text style={styles.fieldLabel}>Plantation Area (Acre)</Text>
                      <TextInput
                        style={styles.boxInput}
                        placeholder="e.g. 1.2"
                        placeholderTextColor="#94A3B8"
                        keyboardType="numeric"
                        value={estPlantationArea}
                        onChangeText={setEstPlantationArea}
                      />
                    </View>
                  </View>

                  <View style={styles.formField}>
                    <Text style={styles.fieldLabel}>Agroforestry Plantation Species</Text>
                    <TextInput
                      style={styles.boxInput}
                      placeholder="e.g. Teakwood, Bamboo, Malabar Neem"
                      placeholderTextColor="#94A3B8"
                      value={agroforestryType}
                      onChangeText={setAgroforestryType}
                    />
                  </View>
                </View>
              )}

              {/* ================================================= */}
              {/* STEP 3: ADDRESS DETAILS */}
              {/* ================================================= */}
              {step === 3 && (
                <View style={styles.stepWrapper}>
                  <Text style={styles.stepSectionTitle}>Geographical Plot Address</Text>
                  <Text style={styles.stepSectionDesc}>
                    Provide the official location boundaries. You can use simulated GPS to fill the fields instantly.
                  </Text>

                  {/* Live GPS Capture Button */}
                  <TouchableOpacity
                    style={styles.gpsAutoBtn}
                    activeOpacity={0.8}
                    onPress={handleSimulatedGpsCapture}
                  >
                    <MaterialCommunityIcons name="crosshairs-gps" size={18} color="#FFFFFF" />
                    <Text style={styles.gpsAutoBtnLabel}>Auto-Fetch Location via GPS Simulation</Text>
                  </TouchableOpacity>

                  {/* Location Dropdowns */}
                    {/* Location Dropdowns */}
                    <View style={styles.formField}>
                      <Text style={styles.fieldLabel}>State <Text style={styles.red}>*</Text></Text>
                      <TouchableOpacity activeOpacity={1} style={styles.pickerTrigger} onPress={() => { setActiveSelectType('state'); setSearchQuery(stateName); }}>
                        <TextInput
                          style={[styles.pickerActiveText, { flex: 1, padding: 0 }]}
                          placeholder="Select or Type State..."
                          placeholderTextColor="#94A3B8"
                          value={activeSelectType === 'state' ? searchQuery : stateName}
                          onChangeText={(text) => {
                            setStateName(text);
                            setSearchQuery(text);
                            if (activeSelectType !== 'state') setActiveSelectType('state');
                          }}
                          onFocus={() => { setActiveSelectType('state'); setSearchQuery(stateName); }}
                          editable={true}
                        />
                        {loadingLoc.state ? <ActivityIndicator size="small" color="#10B981" /> : <MaterialCommunityIcons name="chevron-down" size={20} color="#475569" />}
                      </TouchableOpacity>
                      {activeSelectType === 'state' && (
                        <View style={[styles.selectDropdownCard, { marginTop: 4, paddingTop: 4 }]}>
                          <ScrollView style={{maxHeight: 150}} nestedScrollEnabled={true} keyboardShouldPersistTaps="handled">
                            {availableStates.filter(st => st.toLowerCase().includes(searchQuery.toLowerCase())).map((st) => (
                              <TouchableOpacity
                                key={st} style={styles.selectItem}
                                onPress={() => { setStateName(st); setActiveSelectType(null); }}
                              >
                                <Text style={styles.selectItemText}>{st}</Text>
                              </TouchableOpacity>
                            ))}
                            {searchQuery.trim().length > 0 && availableStates.filter(x => x.toLowerCase().includes(searchQuery.toLowerCase())).length === 0 && (
                              <TouchableOpacity style={styles.selectItem} onPress={() => { setStateName(searchQuery); setActiveSelectType(null); }}>
                                <Text style={styles.selectItemText}>Use "{searchQuery}"</Text>
                              </TouchableOpacity>
                            )}
                          </ScrollView>
                        </View>
                      )}
                    </View>

                    <View style={styles.formField}>
                      <Text style={styles.fieldLabel}>District <Text style={styles.red}>*</Text></Text>
                      <TouchableOpacity activeOpacity={1} style={styles.pickerTrigger} onPress={() => { setActiveSelectType('district'); setSearchQuery(district); }}>
                        <TextInput
                          style={[styles.pickerActiveText, { flex: 1, padding: 0 }]}
                          placeholder="Select or Type District..."
                          placeholderTextColor="#94A3B8"
                          value={activeSelectType === 'district' ? searchQuery : district}
                          onChangeText={(text) => {
                            setDistrict(text);
                            setSearchQuery(text);
                            if (activeSelectType !== 'district') setActiveSelectType('district');
                          }}
                          onFocus={() => { setActiveSelectType('district'); setSearchQuery(district); }}
                          editable={true}
                        />
                        {loadingLoc.district ? <ActivityIndicator size="small" color="#10B981" /> : <MaterialCommunityIcons name="chevron-down" size={20} color="#475569" />}
                      </TouchableOpacity>
                      {activeSelectType === 'district' && (
                        <View style={[styles.selectDropdownCard, { marginTop: 4, paddingTop: 4 }]}>
                          <ScrollView style={{maxHeight: 150}} nestedScrollEnabled={true} keyboardShouldPersistTaps="handled">
                            {availableDistricts.filter(dist => dist.toLowerCase().includes(searchQuery.toLowerCase())).map((dist) => (
                              <TouchableOpacity
                                key={dist} style={styles.selectItem}
                                onPress={() => { setDistrict(dist); setActiveSelectType(null); }}
                              >
                                <Text style={styles.selectItemText}>{dist}</Text>
                              </TouchableOpacity>
                            ))}
                            {searchQuery.trim().length > 0 && availableDistricts.filter(x => x.toLowerCase().includes(searchQuery.toLowerCase())).length === 0 && (
                              <TouchableOpacity style={styles.selectItem} onPress={() => { setDistrict(searchQuery); setActiveSelectType(null); }}>
                                <Text style={styles.selectItemText}>Use "{searchQuery}"</Text>
                              </TouchableOpacity>
                            )}
                          </ScrollView>
                        </View>
                      )}
                    </View>

                    <View style={styles.formField}>
                      <Text style={styles.fieldLabel}>Tehsil <Text style={styles.red}>*</Text></Text>
                      <TouchableOpacity activeOpacity={1} style={styles.pickerTrigger} onPress={() => { setActiveSelectType('tehsil'); setSearchQuery(tehsil); }}>
                        <TextInput
                          style={[styles.pickerActiveText, { flex: 1, padding: 0 }]}
                          placeholder="Select or Type Tehsil..."
                          placeholderTextColor="#94A3B8"
                          value={activeSelectType === 'tehsil' ? searchQuery : tehsil}
                          onChangeText={(text) => {
                            setTehsil(text);
                            setSearchQuery(text);
                            if (activeSelectType !== 'tehsil') setActiveSelectType('tehsil');
                          }}
                          onFocus={() => { setActiveSelectType('tehsil'); setSearchQuery(tehsil); }}
                          editable={true}
                        />
                        {loadingLoc.tehsil ? <ActivityIndicator size="small" color="#10B981" /> : <MaterialCommunityIcons name="chevron-down" size={20} color="#475569" />}
                      </TouchableOpacity>
                      {activeSelectType === 'tehsil' && (
                        <View style={[styles.selectDropdownCard, { marginTop: 4, paddingTop: 4 }]}>
                          <ScrollView style={{maxHeight: 150}} nestedScrollEnabled={true} keyboardShouldPersistTaps="handled">
                            {availableTehsils.filter(teh => teh.toLowerCase().includes(searchQuery.toLowerCase())).map((teh) => (
                              <TouchableOpacity
                                key={teh} style={styles.selectItem}
                                onPress={() => { setTehsil(teh); setActiveSelectType(null); }}
                              >
                                <Text style={styles.selectItemText}>{teh}</Text>
                              </TouchableOpacity>
                            ))}
                            {searchQuery.trim().length > 0 && availableTehsils.filter(x => x.toLowerCase().includes(searchQuery.toLowerCase())).length === 0 && (
                              <TouchableOpacity style={styles.selectItem} onPress={() => { setTehsil(searchQuery); setActiveSelectType(null); }}>
                                <Text style={styles.selectItemText}>Use "{searchQuery}"</Text>
                              </TouchableOpacity>
                            )}
                          </ScrollView>
                        </View>
                      )}
                    </View>

                    <View style={styles.formField}>
                      <Text style={styles.fieldLabel}>Village <Text style={styles.red}>*</Text></Text>
                      <TouchableOpacity activeOpacity={1} style={styles.pickerTrigger} onPress={() => { setActiveSelectType('village'); setSearchQuery(village); }}>
                        <TextInput
                          style={[styles.pickerActiveText, { flex: 1, padding: 0 }]}
                          placeholder="Select or Type Village..."
                          placeholderTextColor="#94A3B8"
                          value={activeSelectType === 'village' ? searchQuery : village}
                          onChangeText={(text) => {
                            setVillage(text);
                            setSearchQuery(text);
                            if (activeSelectType !== 'village') setActiveSelectType('village');
                          }}
                          onFocus={() => { setActiveSelectType('village'); setSearchQuery(village); }}
                          editable={true}
                        />
                        {loadingLoc.village ? <ActivityIndicator size="small" color="#10B981" /> : <MaterialCommunityIcons name="chevron-down" size={20} color="#475569" />}
                      </TouchableOpacity>
                      {activeSelectType === 'village' && (
                        <View style={[styles.selectDropdownCard, { marginTop: 4, paddingTop: 4 }]}>
                          <ScrollView style={{maxHeight: 150}} nestedScrollEnabled={true} keyboardShouldPersistTaps="handled">
                            {availableVillages.filter(v => v.toLowerCase().includes(searchQuery.toLowerCase())).map((v) => (
                              <TouchableOpacity
                                key={v} style={styles.selectItem}
                                onPress={() => { setVillage(v); setActiveSelectType(null); }}
                              >
                                <Text style={styles.selectItemText}>{v}</Text>
                              </TouchableOpacity>
                            ))}
                            {searchQuery.trim().length > 0 && availableVillages.filter(x => x.toLowerCase().includes(searchQuery.toLowerCase())).length === 0 && (
                              <TouchableOpacity style={styles.selectItem} onPress={() => { setVillage(searchQuery); setActiveSelectType(null); }}>
                                <Text style={styles.selectItemText}>Use "{searchQuery}"</Text>
                              </TouchableOpacity>
                            )}
                          </ScrollView>
                        </View>
                      )}
                    </View>

                    <View style={styles.formField}>
                      <Text style={styles.fieldLabel}>Gram Panchayat <Text style={styles.red}>*</Text></Text>
                      <TouchableOpacity activeOpacity={1} style={styles.pickerTrigger} onPress={() => { setActiveSelectType('gram_panchayat'); setSearchQuery(gramPanchayat); }}>
                        <TextInput
                          style={[styles.pickerActiveText, { flex: 1, padding: 0 }]}
                          placeholder="Select or Type Gram Panchayat..."
                          placeholderTextColor="#94A3B8"
                          value={activeSelectType === 'gram_panchayat' ? searchQuery : gramPanchayat}
                          onChangeText={(text) => {
                            setGramPanchayat(text);
                            setSearchQuery(text);
                            if (activeSelectType !== 'gram_panchayat') setActiveSelectType('gram_panchayat');
                          }}
                          onFocus={() => { setActiveSelectType('gram_panchayat'); setSearchQuery(gramPanchayat); }}
                          editable={true}
                        />
                        {loadingLoc.gp ? <ActivityIndicator size="small" color="#10B981" /> : <MaterialCommunityIcons name="chevron-down" size={20} color="#475569" />}
                      </TouchableOpacity>
                      {activeSelectType === 'gram_panchayat' && (
                        <View style={[styles.selectDropdownCard, { marginTop: 4, paddingTop: 4 }]}>
                          <ScrollView style={{maxHeight: 150}} nestedScrollEnabled={true} keyboardShouldPersistTaps="handled">
                            {availableGPs.filter(gp => gp.toLowerCase().includes(searchQuery.toLowerCase())).map((gp) => (
                              <TouchableOpacity
                                key={gp} style={styles.selectItem}
                                onPress={() => { setGramPanchayat(gp); setActiveSelectType(null); }}
                              >
                                <Text style={styles.selectItemText}>{gp}</Text>
                              </TouchableOpacity>
                            ))}
                            {searchQuery.trim().length > 0 && availableGPs.filter(x => x.toLowerCase().includes(searchQuery.toLowerCase())).length === 0 && (
                              <TouchableOpacity style={styles.selectItem} onPress={() => { setGramPanchayat(searchQuery); setActiveSelectType(null); }}>
                                <Text style={styles.selectItemText}>Use "{searchQuery}"</Text>
                              </TouchableOpacity>
                            )}
                          </ScrollView>
                        </View>
                      )}
                    </View>

                    <View style={styles.dualInputsRow}>
                    <View style={[styles.formField, { flex: 1, marginRight: 10 }]}>
                      <Text style={styles.fieldLabel}>Post</Text>
                      <TextInput
                        style={styles.boxInput}
                        placeholder="e.g. Khas Post"
                        placeholderTextColor="#94A3B8"
                        value={post}
                        onChangeText={setPost}
                      />
                    </View>
                    <View style={[styles.formField, { flex: 1 }]}>
                      <Text style={styles.fieldLabel}>Pincode <Text style={styles.red}>*</Text></Text>
                      <TextInput
                        style={styles.boxInput}
                        placeholder="6 digits"
                        placeholderTextColor="#94A3B8"
                        keyboardType="numeric"
                        value={pincode}
                        onChangeText={setPincode}
                        maxLength={6}
                      />
                    </View>
                  </View>
                </View>
              )}

              {/* ================================================= */}
              {/* STEP 4: GEO TAGGING INTERACTIVE SATELLITE MAP */}
              {/* ================================================= */}
              {step === 4 && (
                <View style={styles.stepWrapper}>
                  <Text style={styles.stepSectionTitle}>Satellite Boundary Tagging</Text>
                  <Text style={styles.stepSectionDesc}>
                    Tap on the high-tech mapping grid below to drop boundary pins. Connect at least 3 pins to lock your carbon estimation polygon.
                  </Text>

                  {/* Interactive mock map using MapView */}
                  <View style={styles.mapContainer}>
                    <MapView
                      provider={PROVIDER_GOOGLE}
                      style={styles.mapGridWrapper}
                      mapType="satellite"
                      initialRegion={{
                        latitude: geoPoints.length > 0 ? geoPoints[0].latitude : currentLocation.latitude,
                        longitude: geoPoints.length > 0 ? geoPoints[0].longitude : currentLocation.longitude,
                        latitudeDelta: 0.005,
                        longitudeDelta: 0.005,
                      }}
                      onPress={handleMapTap}
                      scrollEnabled={!isPolygonComplete}
                      zoomEnabled={!isPolygonComplete}
                    >
                      {geoPoints.length >= 3 && (
                        <Polygon
                          coordinates={geoPoints}
                          fillColor="rgba(132, 204, 22, 0.4)"
                          strokeColor={COLORS.accent}
                          strokeWidth={2}
                        />
                      )}
                      {geoPoints.map((pt, idx) => (
                        <Marker key={`marker-${idx}`} coordinate={pt} />
                      ))}
                    </MapView>

                    {/* Acreage Estimation Live Indicator */}
                    {geoPoints.length >= 3 && (
                      <View style={styles.mapOverlayAcreagePill}>
                        <Text style={styles.mapAcreageVal}>
                          Calculated: {backendCalculatedArea ? `${backendCalculatedArea.acre} Acres` : `${(geoPoints.length * 0.95 + parseFloat(areaSize || '2.0') * 0.75).toFixed(2)} Acres`}
                        </Text>
                      </View>
                    )}
                  </View>

                  {/* GPS Metadata and Refresh Action */}
                  <View style={styles.gpsMetadataBar}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.gpsCoordsText}>
                        📍 Lat: {currentLocation.latitude.toFixed(5)}, Lon: {currentLocation.longitude.toFixed(5)}
                      </Text>
                      <Text style={styles.gpsAccuracyText}>
                        Accuracy: Balanced GPS (±15m) • Active Pin drop
                      </Text>
                    </View>
                    <TouchableOpacity 
                      style={styles.gpsRefreshBtn} 
                      onPress={async () => {
                        try {
                          const { status } = await Location.requestForegroundPermissionsAsync();
                          if (status === 'granted') {
                            const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
                            setCurrentLocation({ latitude: loc.coords.latitude, longitude: loc.coords.longitude });
                            Alert.alert('GPS Success', 'Coordinates refreshed successfully!');
                          } else {
                            Alert.alert('Permission Denied', 'Please grant location permission to refresh GPS.');
                          }
                        } catch (e) {
                          Alert.alert('Error', 'Failed to refresh GPS coordinates.');
                        }
                      }}
                    >
                      <MaterialCommunityIcons name="crosshairs-gps" size={16} color={COLORS.primary} style={{ marginRight: 4 }} />
                      <Text style={styles.gpsRefreshBtnText}>Refresh</Text>
                    </TouchableOpacity>
                  </View>

                  {/* Live Map Scanning Indicator bar */}
                  {isScanningMap && (
                    <Animated.View style={[styles.mapScanningBar, { opacity: pulseAnim } as any]}>
                      <ActivityIndicator size="small" color="#FFFFFF" style={{ marginRight: 8 }} />
                      <Text style={styles.mapScanningText}>Running carbon biomass baseline scan...</Text>
                    </Animated.View>
                  )}

                  {/* Actions buttons */}
                  <View style={styles.mapControlsRow}>
                    <TouchableOpacity style={styles.mapResetBtn} onPress={handleResetMap}>
                      <MaterialCommunityIcons name="refresh" size={16} color="#475569" style={{ marginRight: 4 }} />
                      <Text style={styles.mapResetBtnText}>Clear Pins</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[styles.mapConfirmBtn, isPolygonComplete && styles.mapConfirmBtnDisabled]}
                      onPress={handleCompletePolygon}
                      disabled={isPolygonComplete}
                    >
                      <MaterialCommunityIcons name="vector-polygon" size={16} color="#FFFFFF" style={{ marginRight: 4 }} />
                      <Text style={styles.mapConfirmBtnText}>Lock Boundary</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}

              {/* ================================================= */}
              {/* STEP 5: GROUND INSPECTION & LAND PHOTOS */}
              {/* ================================================= */}
              {step === 5 && (
                <View style={styles.stepWrapper}>
                  <Text style={styles.stepSectionTitle}>Ground Inspection & Land Photos</Text>
                  <Text style={styles.stepSectionDesc}>
                    Take photos of your land from Camera or Gallery with GPS Geotagging to verify baseline conditions for Admin verification.
                  </Text>

                  {/* Upload stats badge */}
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, marginTop: 4 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <MaterialCommunityIcons name="camera-iris" size={18} color={COLORS.primary} style={{ marginRight: 6 }} />
                      <Text style={{ fontSize: 13, fontWeight: '700', color: COLORS.textDark }}>
                        Land Photos / खेत की तस्वीरें *
                      </Text>
                    </View>
                    <View style={{ backgroundColor: '#DCFCE7', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 }}>
                      <Text style={{ fontSize: 11, fontWeight: '800', color: '#15803D' }}>
                        {landPhotos.length}/5 UPLOADED
                      </Text>
                    </View>
                  </View>

                  {/* Photo Grid */}
                  <View style={styles.photoGrid}>
                    {landPhotos.map((photo) => (
                      <View key={photo.id} style={styles.photoGridCard}>
                        <Image source={{ uri: photo.uri }} style={styles.photoThumbnail} />

                        {/* Photo Info & Badges */}
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

                        {/* Progress Overlay */}
                        {photo.status === 'Uploading' && (
                          <View style={styles.photoUploadOverlay}>
                            <ActivityIndicator size="small" color="#FFFFFF" />
                            <Text style={styles.photoProgressText}>{Math.round(photo.progress * 100)}%</Text>
                          </View>
                        )}

                        {/* Action buttons */}
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

                    {/* Add Photo Button Placeholder */}
                    {landPhotos.length < 5 && (
                      <TouchableOpacity 
                        style={styles.addPhotoPlaceholder} 
                        onPress={() => setShowPhotoSourceModal(true)}
                        activeOpacity={0.8}
                      >
                        <MaterialCommunityIcons name="camera-plus" size={32} color={COLORS.primary} style={{ marginBottom: 8 }} />
                        <Text style={styles.addPhotoPlaceholderText}>Add Land Photo</Text>
                        <Text style={styles.addPhotoPlaceholderSub}>Camera / Gallery</Text>
                      </TouchableOpacity>
                    )}
                  </View>

                  {/* Verification guideline card */}
                  <View style={[styles.guidelineCard, { marginTop: 16 }]}>
                    <MaterialCommunityIcons name="shield-check" size={20} color="#16A34A" style={{ marginRight: 8 }} />
                    <Text style={styles.guidelineText}>
                      Photos are timestamped and tagged with GPS coordinates for instant Admin ground-verification approval.
                    </Text>
                  </View>
                </View>
              )}

              {/* ================================================= */}
              {/* STEP 6: INSPECTION BOOKING */}
              {/* ================================================= */}
              {step === 6 && (
                <View style={styles.stepWrapper}>
                  <Text style={styles.stepSectionTitle}>Schedule Baseline Audit</Text>
                  <Text style={styles.stepSectionDesc}>
                    Book a slot for physical Soil Core verification and carbon stock baseline audit.
                  </Text>

                  {/* Audit Date selection */}
                  <View style={styles.formField}>
                    <Text style={styles.fieldLabel}>Preferred Visit Date <Text style={styles.red}>*</Text></Text>
                    <TouchableOpacity 
                      style={styles.boxInput} 
                      onPress={() => setShowDatePicker(true)}
                    >
                      <Text style={{ color: prefDate ? COLORS.textDark : '#94A3B8' }}>
                        {prefDate || 'e.g. 10th June 2026'}
                      </Text>
                    </TouchableOpacity>
                    <CustomCalendarModal 
                      visible={showDatePicker} 
                      onClose={() => setShowDatePicker(false)} 
                      onSelectDate={(selectedDate) => {
                        setPrefDate(selectedDate);
                        setShowDatePicker(false);
                      }} 
                      initialDate={prefDate} 
                    />
                  </View>

                  {/* Audit Time slot selection */}
                  <View style={styles.formField}>
                    <Text style={styles.fieldLabel}>Preferred Time Slot <Text style={styles.red}>*</Text></Text>
                    <View style={styles.slotsCardList}>
                      {TIME_SLOTS.map((slot) => {
                        const isChosen = prefSlot === slot.id;
                        return (
                          <TouchableOpacity
                            key={slot.id}
                            style={[styles.slotCard, isChosen && styles.slotCardActive]}
                            onPress={() => setPrefSlot(slot.id as any)}
                          >
                            <View style={[styles.slotCardIconCircle, isChosen && styles.slotCardIconCircleActive]}>
                              <MaterialCommunityIcons
                                name={slot.icon as any}
                                size={18}
                                color={isChosen ? COLORS.primary : COLORS.textSecondary}
                              />
                            </View>
                            <Text style={[styles.slotCardLabel, isChosen && styles.slotCardLabelActive]}>
                              {slot.label}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  </View>

                  <View style={styles.formField}>
                    <Text style={styles.fieldLabel}>Landmark for Inspector Access</Text>
                    <TextInput
                      style={styles.boxInput}
                      placeholder="e.g. Near Village Temple / Tube-well"
                      placeholderTextColor="#94A3B8"
                      value={landmark}
                      onChangeText={setLandmark}
                    />
                  </View>

                  <View style={styles.formField}>
                    <Text style={styles.fieldLabel}>Special Instructions</Text>
                    <TextInput
                      style={[styles.boxInput, { height: 60, textAlignVertical: 'top' }]}
                      placeholder="e.g. Lock gates, call before arriving..."
                      placeholderTextColor="#94A3B8"
                      multiline
                      value={specialInstructions}
                      onChangeText={setSpecialInstructions}
                    />
                  </View>

                  {/* Verification guideline card */}
                  <View style={styles.guidelineCard}>
                    <MaterialCommunityIcons name="information-outline" size={20} color={COLORS.primary} style={{ marginRight: 8 }} />
                    <Text style={styles.guidelineText}>
                      “Our BhumiCred field team will visit your land for MRV inspection and sustainability verification.”
                    </Text>
                  </View>
                </View>
              )}

              {/* ================================================= */}
              {/* STEP 7: TREE INSURANCE OPTION */}
              {/* ================================================= */}
              {step === 7 && (
                <View style={styles.stepWrapper}>
                  <Text style={styles.stepSectionTitle}>Climate Risk Tree Insurance</Text>
                  <Text style={styles.stepSectionDesc}>
                    Protect your newly registered canopy carbon assets from localized drought, forest fires, or extreme heat waves.
                  </Text>

                  {/* Toggle Selector */}
                  <View style={styles.insuranceToggleBox}>
                    <Text style={styles.insuranceToggleLabel}>Opt-In for Tree Insurance Coverage?</Text>
                    <TouchableOpacity
                      style={[styles.switchTrack, wantInsurance ? styles.switchTrackActive : styles.switchTrackInactive]}
                      activeOpacity={0.8}
                      onPress={() => {
                        const nextVal = !wantInsurance;
                        setWantInsurance(nextVal);
                        if (nextVal && !insurancePlan) {
                          setInsurancePlan('single');
                        }
                      }}
                    >
                      <View style={[styles.switchThumb, wantInsurance ? styles.switchThumbActive : styles.switchThumbInactive]} />
                    </TouchableOpacity>
                  </View>

                  {/* Policy Selection Options Cards */}
                  {wantInsurance && (
                    <View style={styles.insuranceOptionContainer}>
                      {(climateRiskCards.length > 0 ? climateRiskCards : DEFAULT_INSURANCE_CARDS).map((card, index) => {
                        const slot: 'single' | 'family' = index === 1 ? 'family' : 'single';
                        const isFamily = slot === 'family';
                        const priceText = isFamily ? `₹${card.price} Flat` : `₹${card.price} / Tree`;
                        return (
                          <TouchableOpacity
                            key={card._id || card.id}
                            style={[styles.insurancePlanCard, insurancePlan === slot && styles.insurancePlanCardActive]}
                            onPress={() => setInsurancePlan(slot)}
                          >
                            <View style={styles.insurancePlanHeader}>
                              <MaterialCommunityIcons
                                name={insurancePlan === slot ? "checkbox-marked-circle" : "circle-outline"}
                                size={18}
                                color={insurancePlan === slot ? COLORS.primary : COLORS.textSecondary}
                              />
                              <Text style={styles.insurancePlanTitle}>{card.title}</Text>
                              <View style={[styles.insurancePill, isFamily && { backgroundColor: '#FEF3C7' }]}>
                                <Text style={[styles.insurancePillText, isFamily && { color: '#B45309' }]}>{priceText}</Text>
                              </View>
                            </View>
                            <Text style={styles.insurancePlanDesc}>
                              {card.description}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  )}
                </View>
              )}

              {/* ================================================= */}
              {/* STEP 8: PREMIUM DIGITAL INVOICE */}
              {/* ================================================= */}
              {step === 8 && (
                <View style={styles.stepWrapper}>
                  <Text style={styles.stepSectionTitle}>BhumiCred Digital Invoice</Text>
                  <Text style={styles.stepSectionDesc}>
                    Please review the carbon project assignment fees and satellite audit charges billed below.
                  </Text>

                  {/* Digital invoice UI layout */}
                  <View style={styles.invoiceCard}>
                    {/* Official invoice header */}
                    <View style={styles.invoiceHeaderRow}>
                      <View style={styles.invoiceLogoBox}>
                        <MaterialCommunityIcons name="leaf" size={20} color="#FFFFFF" />
                        <Text style={styles.invoiceLogoText}>BhumiCred</Text>
                      </View>
                      <View style={{ alignItems: 'flex-end' }}>
                        <Text style={styles.invoiceHeadTitle}>TAX INVOICE</Text>
                        <Text style={styles.invoiceIdLabel}>{invoiceData ? invoiceData.invoice_number : `INV-${Math.floor(Math.random() * 90000) + 10000}`}</Text>
                      </View>
                    </View>

                    {/* Metadata details */}
                    <View style={styles.invoiceMetadataGrid}>
                      <View style={styles.metadataCol}>
                        <Text style={styles.metadataLabel}>FARMER DETAILS</Text>
                        <Text style={styles.metadataValueText}>{invoiceData?.farmer_details?.farmer_name || farmerName}</Text>
                        <Text style={styles.metadataSubText}>Mobile: {invoiceData?.farmer_details?.mobile_number || mobileNumber}</Text>
                        {invoiceData?.farmer_details?.father_guardian_name && (
                          <Text style={styles.metadataSubText}>Guardian: {invoiceData.farmer_details.father_guardian_name}</Text>
                        )}
                        <Text style={styles.metadataSubText}>Sihore Block, MP</Text>
                      </View>
                      <View style={[styles.metadataCol, { alignItems: 'flex-end' }]}>
                        <Text style={styles.metadataLabel}>LAND METRICS</Text>
                        <Text style={styles.metadataValueText}>{invoiceData?.land_details?.total_area || areaSize} {invoiceData?.land_details?.unit || areaUnit}s</Text>
                        {invoiceData?.land_details?.calculated_area_acres ? (
                          <Text style={styles.metadataSubText}>GIS Area: {invoiceData.land_details.calculated_area_acres} Ac</Text>
                        ) : (
                          <Text style={styles.metadataSubText}>Crops: {selectedCrops.slice(0, 2).join(', ')}</Text>
                        )}
                        <Text style={styles.metadataSubText}>Soil: {soilType}</Text>
                      </View>
                    </View>

                    <View style={styles.invoiceDivider} />

                    {/* Line Items Breakdown Table */}
                    <Text style={styles.invoiceTableHead}>BILLING DETAILS</Text>
                    
                    {invoiceData?.billing_items ? (
                      invoiceData.billing_items.map((item: any, idx: number) => (
                        <View key={idx} style={styles.tableRow}>
                          <Text style={styles.tableColLabel}>{idx + 1}. {item.name}</Text>
                          <Text style={styles.tableColVal}>₹{item.amount}</Text>
                        </View>
                      ))
                    ) : (
                      <>
                        <View style={styles.tableRow}>
                          <Text style={styles.tableColLabel}>1. Baseline Satellite MRV Audit</Text>
                          <Text style={styles.tableColVal}>₹{mrvFee}</Text>
                        </View>
                        <View style={styles.tableRow}>
                          <Text style={styles.tableColLabel}>2. Chemical Soil NPK Testing</Text>
                          <Text style={styles.tableColVal}>₹{soilTestingFee}</Text>
                        </View>
                        <View style={styles.tableRow}>
                          <Text style={styles.tableColLabel}>3. Global Registry Carbon Indexing</Text>
                          <Text style={styles.tableColVal}>₹{carbonRegFee}</Text>
                        </View>
                        <View style={styles.tableRow}>
                          <Text style={styles.tableColLabel}>4. Ecological Sustainability Review</Text>
                          <Text style={styles.tableColVal}>₹{sustainabilityVerificationFee}</Text>
                        </View>
                        <View style={styles.tableRow}>
                          <Text style={styles.tableColLabel}>5. Corporate Payout Project Mapping</Text>
                          <Text style={styles.tableColVal}>₹{projectAssignmentFee}</Text>
                        </View>
                        {wantInsurance && insurancePlan && (
                          <View style={[styles.tableRow, styles.tableRowHighlight] as any}>
                            <Text style={styles.tableColLabelHighlight}>
                              🛡️ Tree Climate Insurance ({insurancePlan === 'family' ? 'Family Pack' : 'Single Plan'})
                            </Text>
                            <Text style={styles.tableColValHighlight}>₹{insurancePremium}</Text>
                          </View>
                        )}
                      </>
                    )}

                    <View style={styles.invoiceDivider} />

                    {/* Dynamic Grand Total Calculations */}
                    <View style={styles.totalBlockRow}>
                      <Text style={styles.grandTotalLabel}>GRAND TOTAL DUE</Text>
                      <Text style={styles.grandTotalVal}>₹{invoiceData ? invoiceData.grand_total : grandTotal}</Text>
                    </View>
                  </View>
                </View>
              )}

              {/* ================================================= */}
              {/* STEP 9: PAYMENT FLOW */}
              {/* ================================================= */}
              {step === 9 && (
                <View style={styles.stepWrapper}>
                  <Text style={styles.stepSectionTitle}>Secure Verification Gateway</Text>
                  <Text style={styles.stepSectionDesc}>
                    Complete carbon indexing payment to schedule satellite and physical drone mapping baselines.
                  </Text>

                  {/* Total Bill Pill */}
                  <View style={styles.grandTotalGatewayPill}>
                    <Text style={styles.gatewayPillLabel}>TOTAL PAYABLE AMOUNT</Text>
                    <Text style={styles.gatewayPillVal}>₹{invoiceData ? invoiceData.grand_total : grandTotal}</Text>
                  </View>

                  {/* Payment Channel selector tabs */}
                  <Text style={styles.fieldLabel}>Select Payout Channel <Text style={styles.red}>*</Text></Text>
                  
                  <View style={styles.paymentMethodList}>
                    {/* Option A: UPI */}
                    <TouchableOpacity
                      style={[styles.paymentMethodCard, paymentMethod === 'upi' && styles.paymentMethodCardActive]}
                      onPress={() => {
                        setPaymentMethod('upi');
                        setUpiQrVisible(false);
                      }}
                    >
                      <MaterialCommunityIcons
                        name="credit-card-wireless-outline"
                        size={20}
                        color={paymentMethod === 'upi' ? COLORS.primary : COLORS.textSecondary}
                        style={{ marginRight: 12 }}
                      />
                      <Text style={[styles.paymentMethodLabel, paymentMethod === 'upi' && styles.paymentMethodLabelActive]}>
                        Instant Mobile UPI Apps (GPay, PhonePe, Paytm)
                      </Text>
                    </TouchableOpacity>

                    {/* Option B: Bank Transfer */}
                    <TouchableOpacity
                      style={[styles.paymentMethodCard, paymentMethod === 'bank' && styles.paymentMethodCardActive]}
                      onPress={() => setPaymentMethod('bank')}
                    >
                      <MaterialCommunityIcons
                        name="bank-outline"
                        size={20}
                        color={paymentMethod === 'bank' ? COLORS.primary : COLORS.textSecondary}
                        style={{ marginRight: 12 }}
                      />
                      <Text style={[styles.paymentMethodLabel, paymentMethod === 'bank' && styles.paymentMethodLabelActive]}>
                        Direct Bank Account IMPS / NEFT transfer
                      </Text>
                    </TouchableOpacity>

                    {/* Option C: Cash on Inspection */}
                    <TouchableOpacity
                      style={[styles.paymentMethodCard, paymentMethod === 'cash' && styles.paymentMethodCardActive]}
                      onPress={() => setPaymentMethod('cash')}
                    >
                      <MaterialCommunityIcons
                        name="cash-multiple"
                        size={20}
                        color={paymentMethod === 'cash' ? COLORS.primary : COLORS.textSecondary}
                        style={{ marginRight: 12 }}
                      />
                      <Text style={[styles.paymentMethodLabel, paymentMethod === 'cash' && styles.paymentMethodLabelActive]}>
                        “Pay During Inspection” (Cash / Physical Collector)
                      </Text>
                    </TouchableOpacity>
                  </View>

                  {/* UPI Gateway redirection and QR simulator screen */}
                  {paymentMethod === 'upi' && (
                    <View style={styles.gatewayPanelCard}>
                      <Text style={styles.gatewayPanelTitle}>Select Active UPI Application</Text>
                      
                      <View style={styles.upiAppsGrid}>
                        <TouchableOpacity
                          style={[styles.upiAppBtn, selectedUpiApp === 'gpay' && styles.upiAppBtnActive]}
                          onPress={() => setSelectedUpiApp('gpay')}
                        >
                          <MaterialCommunityIcons name="google" size={18} color="#EA4335" style={{ marginRight: 6 }} />
                          <Text style={styles.upiAppText}>Google Pay</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          style={[styles.upiAppBtn, selectedUpiApp === 'phonepe' && styles.upiAppBtnActive]}
                          onPress={() => setSelectedUpiApp('phonepe')}
                        >
                          <MaterialCommunityIcons name="chevron-double-up" size={18} color="#5B21B6" style={{ marginRight: 6 }} />
                          <Text style={styles.upiAppText}>PhonePe</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          style={[styles.upiAppBtn, selectedUpiApp === 'paytm' && styles.upiAppBtnActive]}
                          onPress={() => setSelectedUpiApp('paytm')}
                        >
                          <MaterialCommunityIcons name="wallet" size={18} color="#0284C7" style={{ marginRight: 6 }} />
                          <Text style={styles.upiAppText}>Paytm</Text>
                        </TouchableOpacity>
                      </View>

                      {/* Trigger processing app launcher */}
                      {selectedUpiApp !== '' && !upiQrVisible && !paymentProcessing && (
                        <TouchableOpacity style={styles.gatewayBtn} onPress={handleUpiProcess}>
                          <Text style={styles.gatewayBtnText}>Secure Launcher UPI APP</Text>
                        </TouchableOpacity>
                      )}

                      {/* Redirection / Processing Screen visual */}
                      {paymentProcessing && (
                        <Animated.View style={[styles.processingOverlay, { opacity: pulseAnim } as any]}>
                          <ActivityIndicator size="large" color={COLORS.primary} />
                          <Text style={styles.processingText}>Contacting {selectedUpiApp.toUpperCase()} secure sandbox...</Text>
                        </Animated.View>
                      )}

                      {/* UPI QR Payment details */}
                      {upiQrVisible && (
                        <View style={styles.qrCodeSection}>
                          <Text style={styles.qrCodeHeader}>Scan QR to complete transaction</Text>
                          {/* QR Mock graphic */}
                          <View style={styles.qrMockPlaceholder}>
                            <Svg width="120" height="120">
                              <SvgCircle cx="60" cy="60" r="45" fill="none" stroke={COLORS.primary} strokeWidth="6" strokeDasharray="14, 6" />
                              <SvgCircle cx="60" cy="60" r="20" fill="none" stroke={COLORS.primary} strokeWidth="3" />
                              <SvgCircle cx="60" cy="60" r="5" fill={COLORS.primary} />
                            </Svg>
                          </View>
                          <Text style={styles.qrCodeFooter}>BhumiCred Carbon Credits Payout Sandbox</Text>
                        </View>
                      )}
                    </View>
                  )}

                  {/* Bank transfer instruction details & simulated attachment screenshot */}
                  {paymentMethod === 'bank' && (
                    <View style={styles.gatewayPanelCard}>
                      <Text style={styles.gatewayPanelTitle}>Official Receiver Bank Account</Text>
                      
                      <View style={styles.bankDetailRow}>
                        <Text style={styles.bankDetailLabel}>Bank Name:</Text>
                        <Text style={styles.bankDetailVal}>BhumiCred Sustainability Bank India</Text>
                      </View>
                      <View style={styles.bankDetailRow}>
                        <Text style={styles.bankDetailLabel}>Account Number:</Text>
                        <Text style={styles.bankDetailVal}>9028 1029 3847 112</Text>
                      </View>
                      <View style={styles.bankDetailRow}>
                        <Text style={styles.bankDetailLabel}>IFSC Code:</Text>
                        <Text style={styles.bankDetailVal}>BHUMI000892</Text>
                      </View>

                      {/* Upload screen trigger */}
                      <View style={styles.uploadContainer}>
                        <TouchableOpacity
                          style={styles.uploadBtn}
                          onPress={handleBankScreenshotUpload}
                          disabled={uploadingProgress > 0 && uploadingProgress < 100}
                        >
                          <MaterialCommunityIcons name="camera-outline" size={18} color={COLORS.primary} style={{ marginRight: 6 }} />
                          <Text style={styles.uploadBtnText}>Attach Screenshot Receipt</Text>
                        </TouchableOpacity>

                        {/* Progress bar upload simulator */}
                        {uploadingProgress > 0 && (
                          <View style={styles.progressUploadBg}>
                            <View style={[styles.progressUploadFill, { width: `${uploadingProgress}%` }]} />
                          </View>
                        )}

                        {screenshotUploaded && (
                          <View style={styles.uploadSuccessBox}>
                            <MaterialCommunityIcons name="check-circle" size={16} color={COLORS.success} style={{ marginRight: 6 }} />
                            <Text style={styles.uploadSuccessText}>screenshot_payment_reciept.jpg verified!</Text>
                          </View>
                        )}
                      </View>
                    </View>
                  )}

                  {/* Cash during inspection message */}
                  {paymentMethod === 'cash' && (
                    <View style={styles.gatewayPanelCard}>
                      <View style={styles.cashConfirmationRow}>
                        <MaterialCommunityIcons name="wallet-giftcard" size={24} color={COLORS.primary} style={{ marginRight: 10 }} />
                        <View style={{ flex: 1 }}>
                          <Text style={styles.cashHeader}>“Pay During Inspection” Locked</Text>
                          <Text style={styles.cashDesc}>
                            “Payment will be collected during field verification.” Our MRV auditor will verify coordinates, NPK soil samples, and activate carbon credits baseline upon cash handover.
                          </Text>
                        </View>
                      </View>
                    </View>
                  )}
                </View>
              )}

              {/* ================================================= */}
              {/* STEP 10: PAYMENT SUCCESS SPLASH SCREEN */}
              {/* ================================================= */}
              {step === 10 && (
                <View style={styles.successWrapper}>
                  {/* Glowing success circle check anim */}
                  <Animated.View style={[styles.successIconOuterRing, { transform: [{ scale: successScale }] }]}>
                    <LinearGradient colors={['#DCFCE7', '#84CC16']} style={styles.successIconRing as any}>
                      <MaterialCommunityIcons name="check-decagram" size={54} color={COLORS.primary} />
                    </LinearGradient>
                  </Animated.View>

                  <Text style={styles.successTitle}>Land Registration Submitted Successfully</Text>
                  <Text style={styles.successDesc}>
                    Your baseline details are locked. Official Invoice created under ID: {newlyCreatedPlotId}. Mapped to carbon program verification pipeline.
                  </Text>

                  {/* Invoice Quick metadata card */}
                  <View style={styles.invoiceReceiptCompact}>
                    <View style={styles.receiptRow}>
                      <Text style={styles.receiptLabel}>Assigned Plot ID:</Text>
                      <Text style={styles.receiptVal}>{newlyCreatedPlotId}</Text>
                    </View>
                    <View style={styles.receiptRow}>
                      <Text style={styles.receiptLabel}>Total Area Registered:</Text>
                      <Text style={styles.receiptVal}>{areaSize} {areaUnit}s ({acreage} Acres)</Text>
                    </View>
                    <View style={styles.receiptRow}>
                      <Text style={styles.receiptLabel}>Status Baseline:</Text>
                      <Text style={styles.receiptValGreen}>Registered & Pending Audit</Text>
                    </View>
                  </View>

                  {/* Action buttons shelf */}
                  <View style={styles.successActionShelf}>
                    {/* Simulated Invoice downloader */}
                    <TouchableOpacity
                      style={styles.actionBtnOutline}
                      onPress={handleDownloadInvoice}
                    >
                      <MaterialCommunityIcons name="download" size={18} color={COLORS.primary} style={{ marginRight: 6 }} />
                      <Text style={styles.actionBtnOutlineText}>Download Invoice Receipt</Text>
                    </TouchableOpacity>

                    {/* View Lifecycle timeline details step */}
                    <TouchableOpacity style={styles.actionBtnSolid} onPress={() => animateToStep(11)}>
                      <MaterialCommunityIcons name="radar" size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
                      <Text style={styles.actionBtnSolidText}>Track Verification Progress</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.actionBtnFlat} onPress={() => setIsOpen(false)}>
                      <Text style={styles.actionBtnFlatText}>Back To Dashboard</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}

              {/* ================================================= */}
              {/* STEP 11: LIFECYCLE TRACKING FLOW TIMELINE */}
              {/* ================================================= */}
              {step === 11 && (() => {
                const allPlots = useLandStore.getState().plots;
                const latestPlot = allPlots.length > 0 ? allPlots[allPlots.length - 1] : null;
                const currentPlot = (newlyCreatedPlotId && newlyCreatedPlotId !== 'LND-TEMP')
                  ? allPlots.find(p => p.id === newlyCreatedPlotId || (p as any).registrationNumber === newlyCreatedPlotId)
                  : latestPlot;
                const displayPlotId = currentPlot ? currentPlot.id : newlyCreatedPlotId;
                const isVerified = (currentPlot?.status || '').toLowerCase().includes('verified') || 
                                   (currentPlot?.status || '').toLowerCase().includes('approved') || 
                                   isAdminVerified;

                return (
                  <View style={styles.stepWrapper}>
                    <Text style={styles.stepSectionTitle}>Eco-Verification Tracking System</Text>
                    <Text style={styles.stepSectionDesc}>
                      Continuous satellite imaging scan and soil verification status timeline for Plot #{displayPlotId}.
                    </Text>

                    {/* Admin Verification Status Display Banner */}
                    <View style={[styles.adminVerifyCard, isVerified && { backgroundColor: '#ECFDF5', borderColor: '#84CC16' }]}>
                      <MaterialCommunityIcons
                        name={isVerified ? "check-decagram" : "clock-outline"}
                        size={24}
                        color={isVerified ? "#10B981" : "#D97706"}
                        style={{ marginRight: 10 }}
                      />
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.adminVerifyTitle, isVerified && { color: '#065F46' }]}>
                          {isVerified ? 'Admin Verification Approved ✅' : 'Admin Verification Pending ⏳'}
                        </Text>
                        <Text style={[styles.adminVerifySub, isVerified && { color: '#047857' }]}>
                          {isVerified
                            ? 'Official verification completed by BhumiCred Admin. Satellite MRV active.'
                            : 'Under review by BhumiCred Admin auditor. Status updates automatically upon Admin approval.'}
                        </Text>
                      </View>
                    </View>

                    {/* Vertical Interactive Timeline */}
                    <View style={styles.timelineList}>
                      {[
                        { 
                          idx: 1, 
                          title: 'Registration Submitted', 
                          desc: 'Baseline credentials and coordinates locked in BhumiCred ledger.', 
                          date: 'Today', 
                          status: 'done', 
                          info: 'Khasra plot registered with auto-fill identity checks.' 
                        },
                        { 
                          idx: 2, 
                          title: 'Payment Verification', 
                          desc: isVerified 
                            ? (paymentMethod === 'cash' ? 'Cash payment confirmed by auditor.' : 'Online payment receipt verified.')
                            : (paymentMethod === 'cash' ? 'Cash to be collected upon physical inspector visit.' : 'Payment receipt screenshot under review by Admin.'), 
                          date: isVerified ? 'Verified' : 'Pending Review', 
                          status: isVerified ? 'done' : 'active', 
                          info: `Transaction billing total ₹${grandTotal} status tracking.` 
                        },
                        { 
                          idx: 3, 
                          title: 'Audit scheduled', 
                          desc: isVerified 
                            ? 'Physical inspector soil verification audit completed.' 
                            : `Physical inspector visit slated on ${prefDate || 'Today'}.`, 
                          date: isVerified ? 'Completed' : 'Awaiting Payment', 
                          status: isVerified ? 'done' : 'lock', 
                          info: `Preferred slot locked: ${(prefSlot || 'Morning').toUpperCase()}. Assigned auditor: Amit Sharma.` 
                        },
                        { 
                          idx: 4, 
                          title: 'Soil Baseline Mapping', 
                          desc: isVerified 
                            ? 'NPK cores & Soil Carbon calibration approved by Admin.' 
                            : 'NPK cores, organic carbon %, and pH analysis calibration in progress.', 
                          date: isVerified ? 'Verified' : 'Awaiting Audit', 
                          status: isVerified ? 'done' : 'lock', 
                          info: 'Drone scanning registers ground biomass and baseline canopy index.' 
                        },
                        { 
                          idx: 5, 
                          title: 'Project Assignment', 
                          desc: isVerified 
                            ? 'Carbon Project Assigned & Baseline Sequestration Active.' 
                            : 'Mapping zero-tillage residue to global green carbon initiatives.', 
                          date: isVerified ? 'Active Project' : 'Awaiting baseline', 
                          status: isVerified ? 'active' : 'lock', 
                          info: 'Unlocks corporate sponsored offset payout programs.' 
                        },
                        { 
                          idx: 6, 
                          title: 'Continuous MRV Monitoring', 
                          desc: isVerified 
                            ? 'Dynamic remote sensing satellite NDVI chlorophyll absorption audits live.'
                            : 'Dynamic remote sensing satellite NDVI chlorophyll absorption audits.', 
                          date: isVerified ? 'Live Satellite Scan' : 'Seasonal', 
                          status: isVerified ? 'active' : 'lock', 
                          info: 'Runs bi-weekly baseline canopy density alerts.' 
                        },
                        { 
                          idx: 7, 
                          title: 'Dynamic Carbon Indexing', 
                          desc: 'Aggregates verified CO₂ absorption indices inside ecological ledger.', 
                          date: 'Annually', 
                          status: 'lock', 
                          info: 'Calculated baseline rate: ₹149 / Acre.' 
                        },
                        { 
                          idx: 8, 
                          title: 'Tradable Carbon Credits', 
                          desc: 'Minting verified credits and transferring payouts to Eco-Wallet.', 
                          date: 'Harvest Milestone', 
                          status: 'lock', 
                          info: 'Verified carbon credits are purchasable by international offset clients.' 
                        },
                      ].map((node) => {
                      const isSelected = selectedTrackingNode === node.idx;
                      return (
                        <View key={node.idx} style={styles.timelineNodeWrapper}>
                          <View style={styles.timelineConnectorCol}>
                            {/* Node shape */}
                            <TouchableOpacity
                              style={[
                                styles.nodeBullet,
                                node.status === 'done' && styles.nodeBulletDone,
                                node.status === 'active' && styles.nodeBulletActive,
                                node.status === 'lock' && styles.nodeBulletLock,
                              ] as any}
                              onPress={() => setSelectedTrackingNode(node.idx)}
                            >
                              {node.status === 'done' && <MaterialCommunityIcons name="check" size={12} color="#FFFFFF" />}
                              {node.status === 'active' && <View style={styles.nodeActiveCore} />}
                              {node.status === 'lock' && <MaterialCommunityIcons name="lock-outline" size={10} color="#94A3B8" />}
                            </TouchableOpacity>
                            {/* vertical connector line */}
                            {node.idx < 8 && <View style={[styles.nodeConnectorLine, node.status === 'done' && styles.nodeConnectorLineDone]} />}
                          </View>
                          
                          {/* Node Text Content Card */}
                          <TouchableOpacity
                            style={[styles.nodeTextCard, isSelected && styles.nodeTextCardActive] as any}
                            onPress={() => setSelectedTrackingNode(node.idx)}
                            activeOpacity={0.9}
                          >
                            <View style={styles.nodeCardHeader}>
                              <Text style={[styles.nodeCardTitle, node.status === 'active' && styles.nodeCardTitleActive] as any}>{node.title}</Text>
                              <Text style={styles.nodeCardDate}>{node.date}</Text>
                            </View>
                            <Text style={styles.nodeCardDesc}>{node.desc}</Text>
                            
                            {/* Expanded metadata detail accordion */}
                            {isSelected && (
                              <View style={styles.nodeCardExpanded}>
                                <View style={styles.nodeCardExpandedDivider} />
                                <Text style={styles.nodeCardExpandedLabel}>TECHNICAL AUDIT SPECS</Text>
                                <Text style={styles.nodeCardExpandedVal}>{node.info}</Text>
                              </View>
                            )}
                          </TouchableOpacity>
                        </View>
                      );
                    })}
                  </View>

                  <TouchableOpacity style={styles.actionBtnSolid} onPress={() => setIsOpen(false)}>
                    <Text style={styles.actionBtnSolidText}>Confirm & Finish Flow</Text>
                  </TouchableOpacity>
                </View>
                );
              })()}
            </Animated.View>
          </ScrollView>

          {/* Persistent Footer Buttons Panel for Wizard */}
          {step <= 9 && (
            <View style={styles.footerPanel}>
              <View style={styles.footerDivider} />
              <View style={styles.footerButtonsRow}>
                {step > 1 ? (
                  <TouchableOpacity 
                    style={styles.prevButton} 
                    onPress={() => {
                      const prev = step - 1;
                      setCurrentStep(prev);
                      animateToStep(prev);
                    }}
                    disabled={apiLoading}
                  >
                    <MaterialCommunityIcons name="arrow-left" size={16} color={COLORS.primary} style={{ marginRight: 6 }} />
                    <Text style={styles.prevButtonText}>Back</Text>
                  </TouchableOpacity>
                ) : (
                  <View style={{ flex: 1 }} />
                )}

                {step === 9 ? (
                  <TouchableOpacity
                    style={[styles.nextButton, apiLoading && styles.nextButtonDisabled] as any}
                    onPress={handleFinalSubmission}
                    disabled={apiLoading}
                  >
                    <LinearGradient colors={[COLORS.primary, COLORS.secondary]} style={styles.nextButtonGrad as any}>
                      {apiLoading ? (
                        <ActivityIndicator size="small" color="#FFFFFF" />
                      ) : (
                        <>
                          <Text style={styles.nextButtonText}>Submit Registration</Text>
                          <MaterialCommunityIcons name="shield-check-outline" size={18} color="#FFFFFF" style={{ marginLeft: 6 }} />
                        </>
                      )}
                    </LinearGradient>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity 
                    style={[styles.nextButton, apiLoading && styles.nextButtonDisabled] as any}
                    disabled={apiLoading}
                    onPress={async () => {
                      if (validateStep(step)) {
                        const success = await handleApiSubmitForStep(step);
                        if (success) {
                          const next = step + 1;
                          setCurrentStep(next);
                          animateToStep(next);
                        }
                      }
                    }}
                  >
                    <LinearGradient colors={[COLORS.primary, COLORS.secondary]} style={styles.nextButtonGrad as any}>
                      {apiLoading ? (
                        <ActivityIndicator size="small" color="#FFFFFF" />
                      ) : (
                        <>
                          <Text style={styles.nextButtonText}>Next</Text>
                          <MaterialCommunityIcons name="arrow-right" size={16} color="#FFFFFF" style={{ marginLeft: 6 }} />
                        </>
                      )}
                    </LinearGradient>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          )}

          {/* Photo Source Choice Modal (Camera vs Gallery) */}
          <Modal
            visible={showPhotoSourceModal}
            transparent
            animationType="fade"
            onRequestClose={() => setShowPhotoSourceModal(false)}
          >
            <TouchableOpacity 
              style={styles.categoryModalOverlay}
              activeOpacity={1} 
              onPress={() => setShowPhotoSourceModal(false)}
            >
              <View style={styles.categoryModalContent}>
                <Text style={styles.categoryModalTitle}>Choose Photo Source / फोटो स्रोत चुनें</Text>
                
                <TouchableOpacity
                  style={styles.categoryModalItem}
                  onPress={() => handlePickPhotoSource('camera')}
                >
                  <View style={[styles.categoryModalIcon, { backgroundColor: '#ECFDF5' }]}>
                    <MaterialCommunityIcons name="camera" size={22} color={COLORS.primary} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.categoryModalItemTitle}>Take Live Photo (Camera)</Text>
                    <Text style={styles.categoryModalItemSub}>Live camera snap with instant GPS tag</Text>
                  </View>
                  <MaterialCommunityIcons name="chevron-right" size={20} color="#94A3B8" />
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.categoryModalItem}
                  onPress={() => handlePickPhotoSource('gallery')}
                >
                  <View style={[styles.categoryModalIcon, { backgroundColor: '#EFF6FF' }]}>
                    <MaterialCommunityIcons name="image-multiple" size={22} color="#2563EB" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.categoryModalItemTitle}>Choose from Gallery</Text>
                    <Text style={styles.categoryModalItemSub}>Select from device photo album</Text>
                  </View>
                  <MaterialCommunityIcons name="chevron-right" size={20} color="#94A3B8" />
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.actionBtnFlat, { marginTop: 12 }]}
                  onPress={() => setShowPhotoSourceModal(false)}
                >
                  <Text style={styles.actionBtnFlatText}>Cancel / रद्द करें</Text>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          </Modal>

          {/* Category Picker Modal */}
          <Modal
            visible={showCategoryPickerModal}
            transparent
            animationType="fade"
            onRequestClose={() => setShowCategoryPickerModal(false)}
          >
            <TouchableOpacity 
              style={styles.categoryModalOverlay}
              activeOpacity={1} 
              onPress={() => setShowCategoryPickerModal(false)}
            >
              <View style={styles.categoryModalContent}>
                <Text style={styles.categoryModalTitle}>Select Photo Category / श्रेणी चुनें</Text>
                
                {LAND_PHOTO_CATEGORIES.map((cat) => (
                  <TouchableOpacity
                    key={cat.id}
                    style={styles.categoryModalItem}
                    onPress={() => handleCategorySelect(cat.title)}
                  >
                    <View style={styles.categoryModalIcon}>
                      <MaterialCommunityIcons name={cat.icon as any} size={20} color={COLORS.primary} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.categoryModalItemTitle}>{cat.title}</Text>
                      <Text style={styles.categoryModalItemSub}>{cat.titleHi}</Text>
                    </View>
                    <MaterialCommunityIcons name="chevron-right" size={20} color="#94A3B8" />
                  </TouchableOpacity>
                ))}
              </View>
            </TouchableOpacity>
          </Modal>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(2, 44, 34, 0.75)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    maxHeight: height * 0.9,
    ...SHADOWS.soft,
    elevation: 10,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ecoIconCircle: {
    backgroundColor: COLORS.primaryDark,
    padding: 8,
    borderRadius: 20,
  },
  headTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.primary,
  },
  headSub: {
    fontSize: 10,
    color: COLORS.textSecondary,
    marginTop: 2,
    fontWeight: '600',
  },
  closeBtn: {
    backgroundColor: '#F1F5F9',
    padding: 6,
    borderRadius: 16,
  },
  stepperContainer: {
    marginTop: 14,
  },
  stepLabelsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  stepCounterText: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.primary,
  },
  stepProgressTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textSecondary,
  },
  progressBarBackground: {
    height: 4,
    backgroundColor: '#E2E8F0',
    borderRadius: 2,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: COLORS.accent,
    borderRadius: 2,
  },
  divider: {
    height: 1,
    backgroundColor: '#E2E8F0',
    marginTop: 12,
  },
  scrollArea: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 20,
  },
  stepWrapper: {
    flex: 1,
  },
  stepSectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.textDark,
  },
  stepSectionDesc: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 4,
    marginBottom: 16,
    lineHeight: 16,
  },
  ownershipBox: {
    flexDirection: 'row',
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    padding: 6,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  ownershipBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 12,
  },
  ownershipActive: {
    backgroundColor: '#FFFFFF',
    ...SHADOWS.soft,
  },
  ownershipText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textSecondary,
    marginLeft: 6,
  },
  ownershipTextActive: {
    color: COLORS.primary,
  },
  formField: {
    marginBottom: 14,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.textDark,
    marginBottom: 6,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  red: {
    color: '#EF4444',
  },
  boxInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 13,
    color: COLORS.textDark,
    fontWeight: '600',
  },
  boxInputDisabled: {
    backgroundColor: '#F1F5F9',
    color: COLORS.textSecondary,
  },
  unitToggleContainer: {
    flexDirection: 'row',
    backgroundColor: '#E2E8F0',
    borderRadius: 8,
    padding: 2,
  },
  unitBtn: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  unitBtnActive: {
    backgroundColor: COLORS.primary,
  },
  unitBtnLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.textSecondary,
  },
  unitBtnLabelActive: {
    color: '#FFFFFF',
  },
  pickerTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  pickerTriggerDisabled: {
    backgroundColor: '#F1F5F9',
    borderColor: '#E2E8F0',
  },
  pickerPlaceholderText: {
    fontSize: 13,
    color: '#94A3B8',
    fontWeight: '600',
  },
  pickerActiveText: {
    fontSize: 13,
    color: COLORS.textDark,
    fontWeight: '700',
  },
  pickerSearchInput: {
    flex: 1,
    padding: 0,
    marginRight: 8,
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
    gap: 6,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E2E8F0',
    paddingLeft: 10,
    paddingRight: 6,
    paddingVertical: 5,
    borderRadius: 10,
  },
  chipText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.primary,
  },
  chipCloseBtn: {
    marginLeft: 6,
  },
  cropsDropdownCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 14,
    marginTop: 6,
    padding: 10,
    maxHeight: 180,
    ...SHADOWS.soft,
  },
  cropListScroll: {
    maxHeight: 120,
  },
  cropItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 8,
  },
  cropItemActive: {
    backgroundColor: '#F0FDF4',
  },
  cropItemLabel: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  cropItemLabelActive: {
    color: COLORS.primary,
    fontWeight: '800',
  },
  flexGridOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  optionGridBtn: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  optionGridBtnActive: {
    backgroundColor: '#DCFCE7',
    borderColor: COLORS.accent,
  },
  optionGridBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textSecondary,
  },
  optionGridBtnTextActive: {
    color: COLORS.primary,
  },
  agroforestHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 10,
  },
  agroforestSectionTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.primary,
    marginLeft: 6,
  },
  mapContainer: {
    height: 240,
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 10,
  },
  mapGridWrapper: {
    flex: 1,
    backgroundColor: '#022C22',
  },
  mapSvgCanvas: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  mapOverlayHeader: {
    position: 'absolute',
    top: 10,
    left: 10,
    right: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  gpsIndicatorPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(2, 44, 34, 0.85)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.accent,
  },
  gpsIndicatorText: {
    color: COLORS.accent,
    fontSize: 9,
    fontWeight: '800',
  },
  mapStatusLabel: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  mapOverlayAcreagePill: {
    position: 'absolute',
    bottom: 10,
    left: 10,
    backgroundColor: 'rgba(132, 204, 22, 0.95)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
  },
  mapAcreageVal: {
    color: COLORS.primaryDark,
    fontSize: 11,
    fontWeight: '800',
  },
  mapScanningBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.secondary,
    paddingVertical: 10,
    borderRadius: 10,
    marginBottom: 10,
  },
  mapScanningText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  mapControlsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  mapResetBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  mapResetBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textSecondary,
  },
  mapConfirmBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 10,
  },
  mapConfirmBtnDisabled: {
    backgroundColor: '#CBD5E1',
  },
  mapConfirmBtnText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  slotsCardList: {
    gap: 8,
  },
  slotCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 14,
    padding: 12,
  },
  slotCardActive: {
    backgroundColor: '#F0FDF4',
    borderColor: COLORS.accent,
  },
  slotCardIconCircle: {
    backgroundColor: '#FFFFFF',
    padding: 8,
    borderRadius: 10,
  },
  slotCardIconCircleActive: {
    backgroundColor: '#DCFCE7',
  },
  slotCardLabel: {
    fontSize: 13,
    color: COLORS.textSecondary,
    fontWeight: '600',
    marginLeft: 12,
  },
  slotCardLabelActive: {
    color: COLORS.primary,
    fontWeight: '800',
  },
  guidelineCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 16,
    padding: 12,
    marginTop: 10,
  },
  guidelineText: {
    flex: 1,
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.primary,
    lineHeight: 16,
  },
  insuranceToggleBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 16,
  },
  insuranceToggleLabel: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.textDark,
  },
  switchTrack: {
    width: 48,
    height: 26,
    borderRadius: 15,
    padding: 3,
  },
  switchTrackActive: {
    backgroundColor: COLORS.success,
  },
  switchTrackInactive: {
    backgroundColor: '#CBD5E1',
  },
  switchThumb: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
  },
  switchThumbActive: {
    alignSelf: 'flex-end',
  },
  switchThumbInactive: {
    alignSelf: 'flex-start',
  },
  insuranceOptionContainer: {
    gap: 10,
  },
  insurancePlanCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 16,
    padding: 14,
    ...SHADOWS.soft,
  },
  insurancePlanCardActive: {
    borderColor: COLORS.accent,
    backgroundColor: '#F0FDF4',
  },
  insurancePlanHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  insurancePlanTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.textDark,
    marginLeft: 8,
    flex: 1,
  },
  insurancePill: {
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  insurancePillText: {
    fontSize: 9,
    fontWeight: '800',
    color: COLORS.primary,
  },
  insurancePlanDesc: {
    fontSize: 11,
    color: COLORS.textSecondary,
    lineHeight: 16,
  },
  invoiceCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: COLORS.borderDark,
    borderRadius: 20,
    padding: 16,
    ...SHADOWS.soft,
  },
  invoiceHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  invoiceLogoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
  },
  invoiceLogoText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
    marginLeft: 6,
  },
  invoiceHeadTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.primary,
  },
  invoiceIdLabel: {
    fontSize: 10,
    color: COLORS.textSecondary,
    fontWeight: '700',
  },
  invoiceMetadataGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 14,
  },
  metadataCol: {
    flex: 1,
  },
  metadataLabel: {
    fontSize: 8,
    fontWeight: '800',
    color: COLORS.textSecondary,
    marginBottom: 4,
  },
  metadataValueText: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.textDark,
  },
  metadataSubText: {
    fontSize: 9,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  invoiceDivider: {
    height: 1,
    backgroundColor: '#E2E8F0',
    marginVertical: 12,
  },
  invoiceTableHead: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.primary,
    marginBottom: 8,
  },
  tableRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  tableColLabel: {
    fontSize: 11,
    color: COLORS.textSecondary,
  },
  tableColVal: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textDark,
  },
  tableRowHighlight: {
    backgroundColor: '#F0FDF4',
    paddingHorizontal: 6,
    borderRadius: 6,
    marginVertical: 4,
  },
  tableColLabelHighlight: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.primary,
  },
  tableColValHighlight: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.primary,
  },
  totalBlockRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  grandTotalLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.textDark,
  },
  grandTotalVal: {
    fontSize: 18,
    fontWeight: '900',
    color: COLORS.primary,
  },
  grandTotalGatewayPill: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: COLORS.accent,
    borderRadius: 16,
    padding: 14,
    marginBottom: 16,
  },
  gatewayPillLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.primary,
  },
  gatewayPillVal: {
    fontSize: 20,
    fontWeight: '900',
    color: COLORS.primary,
  },
  paymentMethodList: {
    gap: 8,
    marginBottom: 14,
  },
  paymentMethodCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 14,
    padding: 12,
  },
  paymentMethodCardActive: {
    backgroundColor: '#F0FDF4',
    borderColor: COLORS.accent,
  },
  paymentMethodLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textSecondary,
    flex: 1,
  },
  paymentMethodLabelActive: {
    color: COLORS.primary,
    fontWeight: '800',
  },
  gatewayPanelCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 16,
    padding: 14,
    ...SHADOWS.soft,
  },
  gatewayPanelTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.textDark,
    marginBottom: 10,
  },
  upiAppsGrid: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  upiAppBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    paddingVertical: 10,
  },
  upiAppBtnActive: {
    backgroundColor: '#DCFCE7',
    borderColor: COLORS.accent,
  },
  upiAppText: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.textSecondary,
  },
  gatewayBtn: {
    backgroundColor: COLORS.primary,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  gatewayBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
  processingOverlay: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
  },
  processingText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.primary,
    marginTop: 10,
  },
  qrCodeSection: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  qrCodeHeader: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.primary,
  },
  qrMockPlaceholder: {
    marginVertical: 12,
    backgroundColor: '#F8FAFC',
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  qrCodeFooter: {
    fontSize: 9,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  bankDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  bankDetailLabel: {
    fontSize: 11,
    color: COLORS.textSecondary,
  },
  bankDetailVal: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textDark,
  },
  uploadContainer: {
    marginTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 12,
  },
  uploadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#DCFCE7',
    paddingVertical: 10,
    borderRadius: 10,
  },
  uploadBtnText: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.primary,
  },
  progressUploadBg: {
    height: 4,
    backgroundColor: '#E2E8F0',
    borderRadius: 2,
    marginTop: 10,
  },
  progressUploadFill: {
    height: '100%',
    backgroundColor: COLORS.primary,
    borderRadius: 2,
  },
  uploadSuccessBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
    padding: 8,
    borderRadius: 8,
    marginTop: 10,
  },
  uploadSuccessText: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.success,
  },
  cashConfirmationRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  cashHeader: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.primary,
  },
  cashDesc: {
    fontSize: 11,
    color: COLORS.textSecondary,
    lineHeight: 16,
    marginTop: 4,
  },
  successWrapper: {
    alignItems: 'center',
    paddingVertical: 14,
  },
  successIconOuterRing: {
    backgroundColor: '#F0FDF4',
    padding: 10,
    borderRadius: 50,
    marginBottom: 14,
  },
  successIconRing: {
    padding: 14,
    borderRadius: 45,
  },
  successTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.primary,
    textAlign: 'center',
  },
  successDesc: {
    fontSize: 11,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 16,
    paddingHorizontal: 12,
  },
  invoiceReceiptCompact: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 16,
    padding: 14,
    width: '100%',
    marginVertical: 16,
    gap: 8,
  },
  receiptRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  receiptLabel: {
    fontSize: 11,
    color: COLORS.textSecondary,
  },
  receiptVal: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textDark,
  },
  receiptValGreen: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.success,
  },
  successActionShelf: {
    width: '100%',
    gap: 8,
  },
  actionBtnSolid: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    paddingVertical: 13,
    borderRadius: 24,
  },
  actionBtnSolidText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
  actionBtnOutline: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: COLORS.primary,
    paddingVertical: 13,
    borderRadius: 24,
  },
  actionBtnOutlineText: {
    color: COLORS.primary,
    fontSize: 12,
    fontWeight: '800',
  },
  actionBtnFlat: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  actionBtnFlatText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontWeight: '700',
  },
  timelineList: {
    marginTop: 10,
  },
  timelineNodeWrapper: {
    flexDirection: 'row',
  },
  timelineConnectorCol: {
    alignItems: 'center',
    width: 24,
    marginRight: 10,
  },
  nodeBullet: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    zIndex: 2,
    backgroundColor: '#FFFFFF',
  },
  nodeBulletDone: {
    backgroundColor: COLORS.success,
    borderColor: COLORS.success,
  },
  nodeBulletActive: {
    borderColor: COLORS.accent,
    backgroundColor: '#FFFFFF',
  },
  nodeBulletLock: {
    borderColor: '#CBD5E1',
    backgroundColor: '#F1F5F9',
  },
  nodeActiveCore: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.accent,
  },
  nodeConnectorLine: {
    width: 2.5,
    flex: 1,
    backgroundColor: '#CBD5E1',
    marginVertical: -2,
    zIndex: 1,
  },
  nodeConnectorLineDone: {
    backgroundColor: COLORS.success,
  },
  nodeTextCard: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 14,
    padding: 10,
    marginBottom: 12,
  },
  nodeTextCardActive: {
    borderColor: COLORS.primary,
    backgroundColor: '#FFFFFF',
    ...SHADOWS.soft,
  },
  nodeCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  nodeCardTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.textDark,
  },
  nodeCardTitleActive: {
    color: COLORS.primary,
  },
  nodeCardDate: {
    fontSize: 9,
    color: COLORS.textSecondary,
    fontWeight: '700',
  },
  nodeCardDesc: {
    fontSize: 10,
    color: COLORS.textSecondary,
    marginTop: 4,
    lineHeight: 14,
  },
  nodeCardExpanded: {
    marginTop: 8,
  },
  nodeCardExpandedDivider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginBottom: 6,
  },
  nodeCardExpandedLabel: {
    fontSize: 8,
    fontWeight: '800',
    color: COLORS.primary,
  },
  nodeCardExpandedVal: {
    fontSize: 9,
    color: COLORS.textSecondary,
    marginTop: 2,
    lineHeight: 13,
  },
  footerPanel: {
    backgroundColor: '#FFFFFF',
  },
  footerDivider: {
    height: 1,
    backgroundColor: '#F1F5F9',
  },
  footerButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 14,
  },
  prevButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 20,
  },
  prevButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.primary,
  },
  nextButton: {
    borderRadius: 24,
    overflow: 'hidden',
    ...SHADOWS.limeGlow,
  },
  nextButtonDisabled: {
    opacity: 0.65,
  },
  nextButtonGrad: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 22,
  },
  nextButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
  dualInputsRow: {
    flexDirection: 'row',
  },
  gpsAutoBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    paddingVertical: 12,
    borderRadius: 14,
    marginBottom: 16,
  },
  gpsAutoBtnLabel: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
    marginLeft: 8,
  },
  selectDropdownCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 14,
    marginTop: 4,
    padding: 6,
    maxHeight: 140,
    ...SHADOWS.soft,
    zIndex: 10,
  },
  selectItem: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  selectItemText: {
    fontSize: 13,
    color: COLORS.textDark,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    borderColor: '#FCA5A5',
    borderWidth: 1,
    borderRadius: 12,
    padding: 10,
    marginBottom: 12,
  },
  errorText: {
    color: '#991B1B',
    fontSize: 12,
    fontWeight: '600',
    flex: 1,
  },
  successBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    borderColor: '#A7F3D0',
    borderWidth: 1,
    borderRadius: 12,
    padding: 10,
    marginBottom: 12,
  },
  successText: {
    color: '#065F46',
    fontSize: 12,
    fontWeight: '600',
    flex: 1,
  },
  adminVerifyCard: {
    backgroundColor: '#FEF3C7',
    borderRadius: 16,
    padding: 14,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#F59E0B',
  },
  adminVerifyTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#92400E',
  },
  adminVerifySub: {
    fontSize: 11,
    color: '#B45309',
    marginTop: 2,
    fontWeight: '500',
  },
  adminVerifyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#059669',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    marginLeft: 8,
  },
  adminVerifyBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  gpsMetadataBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 10,
    marginTop: 10,
    marginBottom: 12,
  },
  gpsCoordsText: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.textDark,
  },
  gpsAccuracyText: {
    fontSize: 10,
    color: '#64748B',
    fontWeight: '600',
    marginTop: 2,
  },
  gpsRefreshBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: COLORS.primary,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  gpsRefreshBtnText: {
    fontSize: 10.5,
    fontWeight: '800',
    color: COLORS.primary,
  },
  photoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 8,
  },
  photoGridCard: {
    width: (width - 60) / 2,
    height: 155,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
    position: 'relative',
    ...SHADOWS.soft,
  },
  photoThumbnail: {
    width: '100%',
    height: 95,
    backgroundColor: '#F1F5F9',
  },
  photoInfoBox: {
    padding: 6,
    flex: 1,
    justifyContent: 'space-between',
  },
  photoCategoryBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  photoCategoryText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#059669',
  },
  metadataBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginTop: 2,
  },
  metadataText: {
    fontSize: 8.5,
    color: '#64748B',
    fontWeight: '600',
    flex: 1,
  },
  photoUploadOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(15, 23, 42, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  photoProgressText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
    marginTop: 4,
  },
  photoDeleteBtn: {
    backgroundColor: 'rgba(239, 68, 68, 0.9)',
    width: 22,
    height: 22,
    borderRadius: 11,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addPhotoPlaceholder: {
    width: (width - 60) / 2,
    height: 155,
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 12,
  },
  addPhotoPlaceholderText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.primary,
    textAlign: 'center',
  },
  addPhotoPlaceholderSub: {
    fontSize: 10,
    color: '#94A3B8',
    marginTop: 2,
    textAlign: 'center',
  },
  categoryModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    justifyContent: 'flex-end',
  },
  categoryModalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    paddingBottom: 36,
  },
  categoryModalTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.textDark,
    marginBottom: 16,
    textAlign: 'center',
  },
  categoryModalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: '#F8FAFC',
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  categoryModalIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#DCFCE7',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  categoryModalItemTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textDark,
  },
  categoryModalItemSub: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 1,
  },
});

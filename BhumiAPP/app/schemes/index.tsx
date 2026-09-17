import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Dimensions,
  Animated,
  ActivityIndicator,
  Alert,
  Modal,
  StatusBar,
  Platform,
  DeviceEventEmitter,
} from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Circle as SvgCircle, Path } from 'react-native-svg';
import * as ImagePicker from 'expo-image-picker';
import { ListSkeleton } from '../../src/components/SkeletonLoader';

import { COLORS, TYPOGRAPHY, SHADOWS } from '../../src/theme/theme';
import { useAuthStore } from '../../src/store/authStore';
import { useLandStore } from '../../src/store/landStore';
import { useSchemeStore, GovtScheme } from '../../src/store/schemeStore';
import { useAgriStore } from '../../src/store/agriStore';
import { GovtTreasuryView } from '../../src/components/GovtTreasuryView';
import AppSafeArea from '../../src/components/AppSafeArea';

const { width, height } = Dimensions.get('window');

// Local dynamic schemes list for rich content
interface RichScheme extends GovtScheme {
  logo: string;
  deadline: string;
  benefitAmount: string;
  requiredDocs: string[];
  faqs: { q: string; a: string }[];
  interestRate?: string;
  tenure?: string;
  bankName?: string;
  category_id?: string;
}

const ALL_RICH_SCHEMES: RichScheme[] = [
  {
    id: 'sch_pmkisan',
    name: 'PM-KISAN (Kisan Samman Nidhi)',
    department: 'Ministry of Agriculture & Farmers Welfare',
    description: 'Direct income support of ₹6,000 per year paid in three equal installments of ₹2,000 directly to verified landholding farmer families bank accounts.',
    eligibility: ['Must hold cultivable agricultural land titles', 'Aadhaar linked active bank account required', 'Excludes taxpayers and institutional landholders'],
    subsidyPercentage: 100,
    status: 'Approved',
    applicationDate: '2026-04-12',
    applicationNumber: 'APP-PMK-90812',
    logo: 'government',
    deadline: '15th July 2026',
    benefitAmount: '₹6,000 / Year',
    requiredDocs: ['Aadhaar Card', 'Land Registry Copy (Khatauni)', 'Bank Passbook Details'],
    faqs: [
      { q: 'Who is eligible under this scheme?', a: 'All landholding farmer families having cultivable land in their names are eligible.' },
      { q: 'How is the payment credited?', a: 'Direct benefit transfer (DBT) directly into your linked bank account.' }
    ]
  },
  {
    id: 'sch_solar',
    name: 'Solar Pump Subsidy (PM-KUSUM)',
    department: 'Ministry of New & Renewable Energy',
    description: 'Eco-friendly sustainable energy scheme providing up to 60% direct subsidy on installation of stand-alone off-grid solar water pumps for crop irrigation.',
    eligibility: ['Must own registered agricultural land plots', 'Must provide ground water access feasibility proof', 'Excludes plots with previous solar engine subsidies'],
    subsidyPercentage: 60,
    status: 'Not Applied',
    logo: 'solar-power',
    deadline: '30th June 2026',
    benefitAmount: 'Up to 60% Subsidy',
    requiredDocs: ['Aadhaar Card', 'Land Registry Proof', 'Water Source Feasibility report', 'Panchayat NOC'],
    faqs: [
      { q: 'Can diesel pump owners apply?', a: 'Yes! Replacing active diesel engines with solar tube-wells is highly recommended.' },
      { q: 'What pump sizes are subsidized?', a: 'Resilient off-grid stand-alone pumps from 3 HP up to 10 HP.' }
    ]
  },
  {
    id: 'sch_organic',
    name: 'Organic Farming Promotion (PKVY)',
    department: 'National Mission on Sustainable Agriculture',
    description: 'Financial support of ₹50,000 per hectare cluster transitioning to pesticide-free organic farming. Unlocks organic carbon offset verification schemes.',
    eligibility: ['Requires cluster group formation (min 20 farmers)', 'Requires Soil Health Card organic biomass baseline', 'Zero chemical fertilizers usage certified'],
    subsidyPercentage: 80,
    status: 'Applied',
    applicationDate: '2026-05-20',
    applicationNumber: 'APP-PKVY-87310',
    logo: 'sprout',
    deadline: '10th July 2026',
    benefitAmount: '₹50,000 / Hectare',
    requiredDocs: ['Aadhaar Card', 'Soil Carbon Health Card', 'Cluster Group ID Proof', 'Composting Pit selfie'],
    faqs: [
      { q: 'How is the ₹50,000 subsidy paid out?', a: '₹31,000 is distributed for organic seed/fertilizer sourcing, and ₹19,000 for value addition and packaging support.' },
      { q: 'Does BhumiCred verify this organic status?', a: 'Yes, our satellite MRV NDVI scan is utilized to certify chemical-free crop biomass.' }
    ]
  },
  {
    id: 'sch_cropins',
    name: 'PM Crop Insurance Scheme (PMFBY)',
    department: 'Ministry of Agriculture & Farmers Welfare',
    description: 'Comprehensive yield insurance protecting against crop damage from localized drought, floods, pest infestations, and unseasonal weather.',
    eligibility: ['Available to all food crop, oilseeds, and commercial horticultural farmers', 'Must register plot before sowing season ends'],
    subsidyPercentage: 90,
    status: 'Not Applied',
    logo: 'shield-check',
    deadline: '31st July 2026',
    benefitAmount: '98% Premium Subsidy',
    requiredDocs: ['Land Khasra Details', 'Sowing Certificate from Panchayat', 'Bank Passbook Details', 'Aadhaar Card'],
    faqs: [
      { q: 'What crops are covered?', a: 'All food crops, commercial cotton/sugarcane, pulses, and oilseeds sowed sowed sowed sowed sowed sowed sowed.' },
      { q: 'How is damage evaluated?', a: 'Through satellite crop biomass mapping and local field visual inspections.' }
    ]
  },
  {
    id: 'loan_sbi_gold',
    name: 'SBI Agriculture Gold Loan',
    department: 'State Bank of India',
    description: 'Instant gold-collateral agriculture credit with low interest rates for purchasing high-quality seeds, fertilizers, tractor accessories, or solar kits.',
    eligibility: ['Must be an active farmer sowing sowed agricultural plots', 'Must provide land title registration proofs', 'No active banking defaults history'],
    subsidyPercentage: 0,
    status: 'Not Applied',
    logo: 'bank',
    deadline: 'Continuous',
    benefitAmount: 'Up to ₹5,000,000',
    interestRate: '7.25% p.a.',
    tenure: '12 to 36 Months',
    bankName: 'SBI Agriculture',
    requiredDocs: ['Gold Collateral Jewellery', 'Land Title Documents', 'Passport Size Photos', 'Aadhaar Card'],
    faqs: [
      { q: 'How long does the loan take to sanction?', a: 'Typically instant or within 24 hours of gold assessment at rural branches.' },
      { q: 'Is there pre-payment penalty?', a: 'No, SBI rural gold credits support flexible early repayment options.' }
    ]
  },
  {
    id: 'loan_nabard_infra',
    name: 'NABARD Sustainable Farm Infrastructure Loan',
    department: 'NABARD Rural Support',
    description: 'Strategic credit program supporting installation of drip irrigation systems, water storage reservoirs, organic fertilizer compost digesters, and farm fencing.',
    eligibility: ['Farmer must own agricultural land', 'Project must fall under sustainable, zero-tillage, or agroforestry practices'],
    subsidyPercentage: 0,
    status: 'Not Applied',
    logo: 'tractor',
    deadline: 'Continuous',
    benefitAmount: 'Up to ₹2,500,000',
    interestRate: '4.50% p.a.',
    tenure: '3 to 7 Years',
    bankName: 'NABARD Support',
    requiredDocs: ['Farm Infrastructure Project Plan', 'Quotations for Drip/Solar kits', 'Land registry documents', 'Soil Health Card'],
    faqs: [
      { q: 'What is the loan interest subsidy?', a: 'NABARD subsidizes interest down to 4.5% specifically to promote eco-friendly farming setups.' },
      { q: 'Can smallholder farmers apply?', a: 'Yes! Group cooperative applications receive high approval priority.' }
    ]
  },
  {
    id: 'loan_hdfc_crop',
    name: 'HDFC Kisan Credit Card Crop Loan',
    department: 'HDFC Rural Banking',
    description: 'Flexible crop production credit card supporting post-harvest cash management, crop maintenance, and household agricultural consumption needs.',
    eligibility: ['Must hold active agricultural land', 'Requires positive crop baseline history sowed sowed'],
    subsidyPercentage: 0,
    status: 'Not Applied',
    logo: 'credit-card',
    deadline: 'Continuous',
    benefitAmount: 'Up to ₹300,000',
    interestRate: '6.99% p.a.',
    tenure: '12 Months (Renewable)',
    bankName: 'HDFC Rural Banking',
    requiredDocs: ['Land Khasra (Khatauni) Registry', 'Passport size photos', 'Bank passbook statements', 'Aadhaar Card'],
    faqs: [
      { q: 'Is there crop insurance tied with the card?', a: 'Yes, HDFC Kisan cards auto-enroll farmers in sowed sowed crop insurance benefits.' },
      { q: 'What is the repayment model?', a: 'Lump-sum repayment after crop harvest and sale.' }
    ]
  }
];

const MAIN_CATEGORIES = [
  { id: 'all', label: 'All Programs', icon: 'apps' },
  { id: 'schemes', label: 'Govt Schemes', icon: 'government' },
  { id: 'loans', label: 'Agri Loans', icon: 'bank' },
  { id: 'subsidies', label: 'Subsidies', icon: 'brightness-percent' },
  { id: 'solar', label: 'Solar Pumps', icon: 'solar-power' },
  { id: 'organic', label: 'Organic Farming', icon: 'sprout' },
  { id: 'irrigation', label: 'Irrigation', icon: 'water-pump' },
  { id: 'insurance', label: 'Crop Insurance', icon: 'shield-check' }
];

export default function GovtSchemesDashboard() {
  const router = useRouter();

  // Role check for Government Body
  const role = useAuthStore((state) => state.role);
  if (role === 'govt_body') {
    return (
      <AppSafeArea edges={['top']}>
        <StatusBar barStyle="dark-content" backgroundColor="#F8FAFC" />
        <GovtTreasuryView />
      </AppSafeArea>
    );
  }

  // Zustand State hooks
  const authUser = useAuthStore((state) => state.user);
  const plots = useLandStore((state) => state.plots);
  const storedSchemes = useSchemeStore((state) => state.schemes);
  const fetchSchemes = useSchemeStore((state) => state.fetchSchemes);
  const applyForScheme = useSchemeStore((state) => state.applyForScheme);

  // Agri Dashboard Integration
  const { 
    categories: agriCategories, 
    schemes: agriSchemes, 
    isLoading: isAgriLoading, 
    isDetailsLoading, 
    currentSchemeDetails, 
    isQuestionnaireLoading,
    currentQuestionnaire,
    isSubmittingQuestionnaire,
    currentApplicationId,
    fetchDashboard, 
    fetchSchemeDetails, 
    fetchSchemeQuestionnaire,
    startApplication,
    submitQuestionnaire,
    searchSchemes,
    clearSearch,
    searchResults,
    isSearching,
    error: agriError 
  } = useAgriStore();

  useEffect(() => {
    fetchDashboard();
    fetchSchemes();
  }, []);

  // Map Backend Data to UI structures
  const displayCategories = [
    { id: 'all', label: 'All Programs', icon: 'apps' },
    ...agriCategories.map(c => ({
      id: c.id,
      label: c.name,
      icon: c.icon || 'star'
    }))
  ];


  // App States
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 300);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  useEffect(() => {
    if (debouncedSearch.trim() !== '') {
      searchSchemes(debouncedSearch);
    } else {
      clearSearch();
    }
  }, [debouncedSearch]);
  const [selectedSchemeId, setSelectedSchemeId] = useState<string | null>(null);
  const [formAnswers, setFormAnswers] = useState<Record<string, any>>({});

  useEffect(() => {
    if (selectedSchemeId) {
      fetchSchemeDetails(selectedSchemeId);
    }
  }, [selectedSchemeId]);

  // Derived selected scheme for UI fallback mapping
  const selectedScheme = currentSchemeDetails ? {
    id: currentSchemeDetails.id,
    name: currentSchemeDetails.title,
    department: currentSchemeDetails.ministry || 'Unknown Ministry',
    description: currentSchemeDetails.description || currentSchemeDetails.short_description,
    eligibility: currentSchemeDetails.eligibility_summary || [],
    subsidyPercentage: 0,
    status: currentSchemeDetails.status,
    logo: currentSchemeDetails.thumbnail || 'bank',
    deadline: currentSchemeDetails.deadline ? new Date(currentSchemeDetails.deadline).toLocaleDateString() : 'Continuous',
    benefitAmount: currentSchemeDetails.benefit_amount,
    requiredDocs: currentSchemeDetails.required_documents || [],
    faqs: [] as { q: string; a: string }[],
    interestRate: currentSchemeDetails.interest_rate || undefined,
  } : null;
  
  // Dynamic recommendations based on profile
  const [recos, setRecos] = useState<string[]>([]);

  // Eligibility check modal states
  const [isEligibilityOpen, setIsEligibilityOpen] = useState(false);
  const [isEligibilityResultVisible, setIsEligibilityResultVisible] = useState(false);
  const [eligibilityResultData, setEligibilityResultData] = useState<any>(null);

  useEffect(() => {
    if (isEligibilityOpen && selectedSchemeId) {
      setFormAnswers({});
      fetchSchemeQuestionnaire(selectedSchemeId);
      startApplication(selectedSchemeId);
    }
  }, [isEligibilityOpen, selectedSchemeId]);

  // Handle questionnaire change
  const handleAnswerChange = (key: string, value: any) => {
    setFormAnswers(prev => ({...prev, [key]: value}));
  };

  // Application checkout wizard states
  const [isApplicationOpen, setIsApplicationOpen] = useState(false);
  const [appStep, setAppStep] = useState(1);
  const [applicationId, setApplicationId] = useState('');
  const [isAppSubmitting, setIsAppSubmitting] = useState(false);
  
  const { fetchApplicationDocuments, fetchApplicationReview, submitApplication, currentApplicationReview, isReviewLoading, applicationTimeline, fetchApplicationTimeline, isTimelineLoading, fetchClarification, clarificationData, isClarificationLoading, resubmitApplication } = useAgriStore();
  
  useEffect(() => {
    const targetAppId = currentApplicationId || applicationId;
    if (appStep === 1 && targetAppId) {
      fetchApplicationDocuments(targetAppId);
    }
    if (appStep === 2 && targetAppId) {
      fetchApplicationReview(targetAppId);
    }
  }, [appStep, currentApplicationId, applicationId]);

  const [aadhaarUploaded, setAadhaarUploaded] = useState(false);
  const [landUploaded, setLandUploaded] = useState(false);
  const [soilUploaded, setSoilUploaded] = useState(false);
  const [progressAadhaar, setProgressAadhaar] = useState(0);
  const [progressLand, setProgressLand] = useState(0);
  const [progressSoil, setProgressSoil] = useState(0);

  // Application tracking screen states
  const [isTrackingOpen, setIsTrackingOpen] = useState(false);
  const [trackingState, setTrackingState] = useState<any>(null);
  const [selectedTrackingNode, setSelectedTrackingNode] = useState(0);

  useEffect(() => {
    if (isTrackingOpen && trackingState?.applicationNumber) {
      fetchApplicationTimeline(trackingState.applicationNumber);
      if (trackingState.status === 'CLARIFICATION_REQUIRED') {
        fetchClarification(trackingState.applicationNumber);
      }
    }
  }, [isTrackingOpen, trackingState?.applicationNumber]);

  // EMI Calculator States
  const [emiAmount, setEmiAmount] = useState(100000); // 1 Lakh
  const [emiDuration, setEmiDuration] = useState(3); // 3 Years
  const [calculatedEmi, setCalculatedEmi] = useState(0);
  const [calculatedInterest, setCalculatedInterest] = useState(0);
  const [calculatedRepayment, setCalculatedRepayment] = useState(0);

  // Banner alerts notification
  const [bannerAlert, setBannerAlert] = useState<string | null>(null);

  // Load recommendations on mount
  useEffect(() => {
    const list: string[] = [];
    const crops = (authUser as any)?.cropType || 'Wheat';
    const land = plots.reduce((sum, p) => sum + (p.status === 'Approved' ? p.acres : 0), 0) || 4.5;
    const dist = (authUser as any)?.district || 'Bhopal';

    if (crops.toLowerCase().includes('soybean') || crops.toLowerCase().includes('pulses')) {
      list.push('Special dynamic subsidy for organic soybean cultivators available in Madhya Pradesh!');
    }
    if (land >= 3.0) {
      list.push('High eligibility baseline: Up to 60% Solar Pump Subsidies (PM-KUSUM) open for landholdings over 3 acres.');
    }
    if (dist.toLowerCase().includes('bhopal') || dist.toLowerCase().includes('sehore')) {
      list.push('Organic conversion incentives: Hectare support PKVY available for Sehore community clusters.');
    }
    list.push('Exclusive interest rate drop: 4.5% p.a. Agri gold credits unlocked for carbon verified plots.');

    setRecos(list);

    // Set countdown notifications alerts
    setBannerAlert('⚠️ PM-KUSUM Solar Water Pump Subsidies close in 6 days! Register coordinates now.');
  }, [authUser, plots]);

  // EMI computations
  useEffect(() => {
    // Nabard low rate 4.5% interest simulation
    const rate = 4.5 / 12 / 100;
    const months = emiDuration * 12;
    const emi = (emiAmount * rate * Math.pow(1 + rate, months)) / (Math.pow(1 + rate, months) - 1);
    
    if (isNaN(emi)) {
      setCalculatedEmi(0);
      setCalculatedInterest(0);
      setCalculatedRepayment(0);
    } else {
      const totalRepay = Math.round(emi * months);
      setCalculatedEmi(Math.round(emi));
      setCalculatedRepayment(totalRepay);
      setCalculatedInterest(totalRepay - emiAmount);
    }
  }, [emiAmount, emiDuration]);

  // Handle store state
  const { isUploadingDocument, uploadDocument, deleteDocument, uploadedDocuments } = useAgriStore();

  const handleDocumentUpload = async (docType: string) => {
    if (!applicationId && !currentApplicationId) {
      Alert.alert('Error', 'Please complete the questionnaire first to start an application.');
      return;
    }
    const targetAppId = currentApplicationId || applicationId;

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        // prepare file object for React Native FormData
        const fileToUpload = {
          uri: asset.uri,
          name: asset.fileName || `${docType.replace(/\s+/g, '_')}.jpg`,
          type: asset.mimeType || 'image/jpeg',
        };

        const uploadRes = await uploadDocument(targetAppId, docType, fileToUpload);
        if (!uploadRes.success) {
          Alert.alert('Upload Failed', uploadRes.error || 'Unknown error');
        } else {
          // Check if we have minimum docs to move to review
          const docs = useAgriStore.getState().uploadedDocuments;
          if (docs.length >= 3) {
             // We have enough docs
             setAppStep(2); // Move to review step conceptually (though not implemented yet, just visual progress if needed)
          }
        }
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  const handleAadhaarUpload = () => handleDocumentUpload("Aadhaar");
  const handleLandUpload = () => handleDocumentUpload("Land Ownership Proof");
  const handleSoilUpload = () => handleDocumentUpload("Soil Health Card");


  const handleCheckEligibility = async () => {
    const missingFields = currentQuestionnaire.filter(q => q.required && (formAnswers[q.field_key] === undefined || formAnswers[q.field_key] === null || formAnswers[q.field_key] === ''));
    if (missingFields.length > 0) {
      Alert.alert('Required Info Missing', 'Please complete all required fields before proceeding.');
      return;
    }

    if (!selectedSchemeId || !currentApplicationId) return;

    const res = await submitQuestionnaire(selectedSchemeId, currentApplicationId, formAnswers);
    if (res.success) {
      setEligibilityResultData(res.data);
      setIsEligibilityOpen(false);
      setTimeout(() => {
        setIsEligibilityResultVisible(true);
      }, 400);
    } else {
      Alert.alert('Submission Failed', res.error || 'Failed to submit questionnaire');
    }
  };

  const [applicationReference, setApplicationReference] = useState('');

  // Checkout Application submit
  const handleApplyScheme = async () => {
    const targetAppId = currentApplicationId || applicationId;
    if (!targetAppId) return;

    setIsAppSubmitting(true);
    try {
      const res = await submitApplication(targetAppId);
      setIsAppSubmitting(false);

      if (res.success) {
        setApplicationReference(res.data.application_reference);
        setAppStep(3); // success splash
      } else {
        Alert.alert('Submission Failed', res.error || 'Failed to submit application');
      }
    } catch (e) {
      setIsAppSubmitting(false);
      Alert.alert('Submission Failure', 'Government server portal handshake failed. Please try again.');
    }
  };

  // Category filtering & Search results mapping
  const sourceSchemes = debouncedSearch.trim() !== '' ? searchResults : agriSchemes;
  const backendSchemesMapped: RichScheme[] = sourceSchemes.map(s => ({
    id: s.id,
    name: s.title,
    department: s.ministry || 'Unknown Ministry',
    description: s.short_description,
    eligibility: [],
    subsidyPercentage: 0,
    status: (s.status as any) || 'Not Applied',
    logo: s.thumbnail || 'bank',
    deadline: s.deadline ? new Date(s.deadline).toLocaleDateString() : 'Continuous',
    benefitAmount: s.benefit_amount,
    requiredDocs: [],
    faqs: [] as { q: string; a: string }[],
    interestRate: s.interest_rate || undefined,
    category_id: s.category_id,
  }));

  const filteredSchemes = backendSchemesMapped.filter((sch) => {
    if (debouncedSearch.trim() !== '') return true; // search results already filtered by backend
    if (activeCategory === 'all') return true;
    return sch.category_id === activeCategory;
  });

  if (isAgriLoading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={{ marginTop: 12, color: COLORS.textDark, fontWeight: '600' }}>Loading Agri Financial Hub...</Text>
      </View>
    );
  }

  if (agriError) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center', padding: 20 }]}>
        <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />
        <MaterialCommunityIcons name="alert-circle-outline" size={48} color={COLORS.danger} />
        <Text style={{ marginTop: 12, color: COLORS.textDark, fontWeight: '600', textAlign: 'center' }}>{agriError}</Text>
        <TouchableOpacity style={{ marginTop: 24, backgroundColor: COLORS.primary, paddingVertical: 12, paddingHorizontal: 24, borderRadius: 8 }} onPress={() => fetchDashboard()}>
          <Text style={{ color: '#FFFFFF', fontWeight: 'bold' }}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />

      {/* Sticky top brand navigation header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <MaterialCommunityIcons name="arrow-left" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={styles.headerTitle}>Agri Financial Hub</Text>
          <Text style={styles.headerSub}>Government Subsidies & Banking Loans</Text>
        </View>
        <View style={styles.govtBadge}>
          <MaterialCommunityIcons name="shield-check" size={12} color="#FFFFFF" style={{ marginRight: 4 }} />
          <Text style={styles.govtBadgeText}>SECURE DBT</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* Dynamic Warning Banner */}
        {bannerAlert && (
          <TouchableOpacity style={styles.alertBanner} onPress={() => setBannerAlert(null)}>
            <Text style={styles.alertBannerText}>{bannerAlert}</Text>
            <MaterialCommunityIcons name="close" size={14} color="#78350F" />
          </TouchableOpacity>
        )}

        {/* Personalized Recommendation Banner */}
        <View style={styles.recoContainer}>
          <Text style={styles.sectionLabel}>Personalized Recommendation</Text>
          <LinearGradient
            colors={['#022C22', '#064E3B']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.recoCard}
          >
            <View style={styles.recoHeader}>
              <View style={styles.aiIconBox}>
                <MaterialCommunityIcons name="robot" size={18} color={COLORS.accent} />
              </View>
              <Text style={styles.recoTitle}>Bhumi Mitra AI subsidies scan</Text>
            </View>
            <Text style={styles.recoBody}>
              {recos.length > 0
                ? recos[0]
                : 'Complete your active crop details in profile tab to customize direct government payout subsidies.'}
            </Text>
            {recos.length > 1 && (
              <View style={styles.recoBulletShelf}>
                <MaterialCommunityIcons name="lightbulb-on" size={12} color={COLORS.accent} style={{ marginRight: 6 }} />
                <Text style={styles.recoBulletText} numberOfLines={1}>{recos[1]}</Text>
              </View>
            )}
          </LinearGradient>
        </View>

        {/* Categories Menu */}
        <Text style={styles.sectionLabel}>Subsidies & Credit categories</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoriesRow}>
          {displayCategories.map((cat) => {
            const isActive = activeCategory === cat.id;
            return (
              <TouchableOpacity
                key={cat.id}
                style={[styles.categoryPill, isActive && styles.categoryPillActive]}
                onPress={() => setActiveCategory(cat.id)}
              >
                <Text style={[styles.categoryPillLabel, isActive && styles.categoryPillLabelActive]}>
                  {cat.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Search Input Box */}
        <View style={styles.searchContainer}>
          <View style={styles.searchBar}>
            <MaterialCommunityIcons name="magnify" size={20} color={COLORS.textSecondary} style={{ marginRight: 8 }} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search PM-KISAN, gold loans, crop insurances..."
              placeholderTextColor="#94A3B8"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery !== '' && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <MaterialCommunityIcons name="close-circle" size={18} color="#94A3B8" />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Schemes List Cards */}
        <View style={styles.listingSection}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionLabel}>Available subsidies ({filteredSchemes.length})</Text>
            <Text style={styles.categoryFilterIndicator}>
              Filter: {displayCategories.find((c) => c.id === activeCategory)?.label}
            </Text>
          </View>

          {isSearching ? (
            <View style={{ paddingHorizontal: 20 }}>
              <ListSkeleton />
              <ListSkeleton />
              <ListSkeleton />
            </View>
          ) : filteredSchemes.length === 0 ? (
            <View style={styles.emptyCard}>
              <MaterialCommunityIcons name="magnify-close" size={48} color="#CBD5E1" />
              <Text style={styles.emptyTitle}>No subsidies found</Text>
              <Text style={styles.emptyDesc}>Try adjusting your search or filter</Text>
            </View>
          ) : (
            filteredSchemes.map((sch) => {
              // Read status from store for syncing
              const activeStatus = storedSchemes.find((s: GovtScheme) => s.id === sch.id)?.status || sch.status;
              const appNum = storedSchemes.find((s: GovtScheme) => s.id === sch.id)?.applicationNumber || sch.applicationNumber;

              return (
                <View key={sch.id} style={styles.schemeCard}>
                  <View style={styles.schemeCardHeader}>
                    <View style={styles.schemeDeptRow}>
                      <View style={styles.schemeLogoWrapper}>
                        <MaterialCommunityIcons
                          name={sch.logo === 'solar-power' ? 'solar-power' : sch.logo === 'sprout' ? 'sprout' : sch.logo === 'shield-check' ? 'shield-check' : 'bank'}
                          size={18}
                          color={COLORS.primary}
                        />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.schDeptLabel} numberOfLines={1}>{sch.department}</Text>
                        <Text style={styles.schNameTitle}>{sch.name}</Text>
                      </View>
                    </View>

                    {/* Eligibility / Application status badge */}
                    <View style={[
                      styles.statusPill,
                      activeStatus === 'Approved' ? styles.statusApproved : activeStatus === 'Applied' ? styles.statusApplied : styles.statusNotApplied
                    ] as any}>
                      <Text style={[
                        styles.statusText,
                        activeStatus === 'Approved' ? styles.statusApprovedText : activeStatus === 'Applied' ? styles.statusAppliedText : styles.statusNotAppliedText
                      ] as any}>
                        {activeStatus}
                      </Text>
                    </View>
                  </View>

                  <Text style={styles.schCardDesc} numberOfLines={2}>{sch.description}</Text>

                  {/* Benefit specs */}
                  <View style={styles.schSpecsRow}>
                    <View style={styles.specBox}>
                      <Text style={styles.specLabel}>BENEFIT ESTIMATION</Text>
                      <Text style={styles.specValue}>{sch.benefitAmount}</Text>
                    </View>
                    {sch.interestRate && (
                      <View style={styles.specBox}>
                        <Text style={styles.specLabel}>INTEREST RATE</Text>
                        <Text style={[styles.specValue, { color: '#B45309' }]}>{sch.interestRate}</Text>
                      </View>
                    )}
                    <View style={[styles.specBox, { alignItems: 'flex-end' }]}>
                      <Text style={styles.specLabel}>DEADLINE</Text>
                      <Text style={styles.specValue}>{sch.deadline}</Text>
                    </View>
                  </View>

                  {/* Actions buttons */}
                  <View style={styles.schActionButtonsRow}>
                    <TouchableOpacity
                      style={styles.detailsBtn}
                      onPress={() => setSelectedSchemeId(sch.id)}
                    >
                      <Text style={styles.detailsBtnText}>View program details</Text>
                    </TouchableOpacity>

                    {activeStatus === 'Not Applied' ? (
                      <TouchableOpacity
                        style={styles.applyBtn}
                        onPress={() => {
                          setSelectedSchemeId(sch.id);
                          setIsEligibilityOpen(true);
                        }}
                      >
                        <LinearGradient colors={[COLORS.primary, COLORS.secondary]} style={styles.applyBtnGrad as any}>
                          <Text style={styles.applyBtnText}>Apply Now</Text>
                        </LinearGradient>
                      </TouchableOpacity>
                    ) : (
                      <TouchableOpacity
                        style={styles.trackBtn}
                        onPress={() => {
                          setTrackingState({ ...sch, status: activeStatus, applicationNumber: appNum });
                          setSelectedTrackingNode(activeStatus === 'Approved' ? 5 : 1);
                          setIsTrackingOpen(true);
                        }}
                      >
                        <MaterialCommunityIcons name="radar" size={14} color={COLORS.primary} style={{ marginRight: 4 }} />
                        <Text style={styles.trackBtnText}>Track status</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              );
            })
          )}
        </View>

        {/* Live EMI Calculator Section */}
        <View style={styles.calculatorSection}>
          <View style={styles.calcHeader}>
            <MaterialCommunityIcons name="calculator" size={20} color={COLORS.primary} />
            <Text style={styles.calcHeaderTitle}>Agri Infrastructure Loan Calculator</Text>
          </View>
          <Text style={styles.calcHeaderDesc}>NABARD subsidized standard interest calculations (4.5% interest rate).</Text>

          {/* Amount Slider */}
          <View style={styles.sliderGroup}>
            <View style={styles.sliderLabelRow}>
              <Text style={styles.sliderLabel}>LOAN CREDIT AMOUNT</Text>
              <Text style={styles.sliderValText}>₹{emiAmount.toLocaleString()}</Text>
            </View>
            <View style={styles.quickOptionsRow}>
              {[50000, 100000, 250000, 500000].map((val) => (
                <TouchableOpacity
                  key={val}
                  style={[styles.quickCalcPill, emiAmount === val && styles.quickCalcPillActive]}
                  onPress={() => setEmiAmount(val)}
                >
                  <Text style={[styles.quickCalcPillLabel, emiAmount === val && styles.quickCalcPillLabelActive]}>
                    ₹{(val / 1000).toFixed(0)}K
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Duration Slider */}
          <View style={styles.sliderGroup}>
            <View style={styles.sliderLabelRow}>
              <Text style={styles.sliderLabel}>REPAYMENT TENURE</Text>
              <Text style={styles.sliderValText}>{emiDuration} Years</Text>
            </View>
            <View style={styles.quickOptionsRow}>
              {[1, 2, 3, 5, 7].map((yr) => (
                <TouchableOpacity
                  key={yr}
                  style={[styles.quickCalcPill, emiDuration === yr && styles.quickCalcPillActive]}
                  onPress={() => setEmiDuration(yr)}
                >
                  <Text style={[styles.quickCalcPillLabel, emiDuration === yr && styles.quickCalcPillLabelActive]}>
                    {yr} Yr
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Calculator Output Grid */}
          <View style={styles.calcResultGrid}>
            <View style={styles.calcResultBox}>
              <Text style={styles.calcResultLabel}>EST. MONTHLY EMI</Text>
              <Text style={styles.calcResultValue}>₹{calculatedEmi.toLocaleString()}</Text>
            </View>
            <View style={styles.calcResultBox}>
              <Text style={styles.calcResultLabel}>TOTAL REPAYMENT</Text>
              <Text style={styles.calcResultValue}>₹{calculatedRepayment.toLocaleString()}</Text>
            </View>
            <View style={styles.calcResultBox}>
              <Text style={styles.calcResultLabel}>INTEREST COMPONENT</Text>
              <Text style={[styles.calcResultValue, { color: '#B45309' }]}>₹{calculatedInterest.toLocaleString()}</Text>
            </View>
          </View>
        </View>

        {/* Dynamic Empty KYC checklist */}
        {plots.length === 0 && (
          <View style={styles.kycChecklistCard}>
            <View style={styles.kycHeader}>
              <MaterialCommunityIcons name="alert-decagram" size={20} color="#B45309" />
              <Text style={styles.kycTitle}>Complete Plot Verification for Better Recommendations</Text>
            </View>
            <Text style={styles.kycDesc}>
              No verified lands sowed in your account index. Register your acreage plot bounds in "Home {"->"} Add Land" to unlock tailored solar pump subsidies and higher cooperative bank approvals.
            </Text>
            <TouchableOpacity style={styles.kycActionBtn} onPress={() => { DeviceEventEmitter.emit('openGlobalScheduler'); }}>
              <Text style={styles.kycActionBtnText}>Launch Land Registry Wizard</Text>
            </TouchableOpacity>
          </View>
        )}

      </ScrollView>

      {/* ================================================= */}
      {/* 1. PREMIUM PROGRAM DETAILS SLIDE MODAL */}
      {/* ================================================= */}
      <Modal visible={selectedSchemeId !== null} transparent animationType="slide" onRequestClose={() => setSelectedSchemeId(null)}>
        <View style={styles.modalBackdrop}>
          <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={() => setSelectedSchemeId(null)} />
          <View style={styles.sheet}>
            {isDetailsLoading && (
              <View style={{ padding: 40, alignItems: 'center' }}>
                <ActivityIndicator size="large" color={COLORS.primary} />
                <Text style={{ marginTop: 12, color: COLORS.textDark }}>Fetching details...</Text>
              </View>
            )}
            {!isDetailsLoading && agriError && (
              <View style={{ padding: 40, alignItems: 'center' }}>
                <MaterialCommunityIcons name="alert-circle-outline" size={48} color={COLORS.danger} />
                <Text style={{ marginTop: 12, color: COLORS.textDark, textAlign: 'center' }}>{agriError}</Text>
              </View>
            )}
            {!isDetailsLoading && !agriError && selectedScheme && (
              <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.detailsModalScroll}>
                {/* Header */}
                <View style={styles.detailHeaderBlock}>
                  <View style={styles.detailTitleRow}>
                    <View style={styles.detailLogoCircle}>
                      <MaterialCommunityIcons
                        name={selectedScheme.logo === 'solar-power' ? 'solar-power' : selectedScheme.logo === 'sprout' ? 'sprout' : selectedScheme.logo === 'shield-check' ? 'shield-check' : 'bank'}
                        size={24}
                        color={COLORS.primary}
                      />
                    </View>
                    <View style={{ flex: 1, marginLeft: 14 }}>
                      <Text style={styles.detailDeptName}>{selectedScheme.department}</Text>
                      <Text style={styles.detailProgName}>{selectedScheme.name}</Text>
                    </View>
                    <TouchableOpacity onPress={() => setSelectedSchemeId(null)}>
                      <MaterialCommunityIcons name="close" size={24} color={COLORS.textSecondary} />
                    </TouchableOpacity>
                  </View>
                </View>

                <View style={styles.modalDivider} />

                {/* Subsidies benefit tag */}
                <View style={styles.specsHighlightsRow}>
                  <View style={styles.highlightPill}>
                    <Text style={styles.highlightPillLabel}>Estimated Benefit</Text>
                    <Text style={styles.highlightPillVal}>{selectedScheme.benefitAmount}</Text>
                  </View>
                  {selectedScheme.interestRate && (
                    <View style={[styles.highlightPill, { backgroundColor: '#FEF3C7' }]}>
                      <Text style={[styles.highlightPillLabel, { color: '#B45309' }]}>Interest Rate</Text>
                      <Text style={[styles.highlightPillVal, { color: '#B45309' }]}>{selectedScheme.interestRate}</Text>
                    </View>
                  )}
                  <View style={styles.highlightPill}>
                    <Text style={styles.highlightPillLabel}>Active Deadline</Text>
                    <Text style={styles.highlightPillVal}>{selectedScheme.deadline}</Text>
                  </View>
                </View>

                {/* Description */}
                <Text style={styles.detailSectionLabel}>Description</Text>
                <Text style={styles.detailDescContent}>{selectedScheme.description}</Text>

                {/* Eligibility requirements */}
                <Text style={styles.detailSectionLabel}>Eligibility Criteria</Text>
                {selectedScheme.eligibility.map((rule, idx) => (
                  <View key={idx} style={styles.bulletItemRow}>
                    <MaterialCommunityIcons name="check-circle" size={16} color={COLORS.primary} style={{ marginRight: 8, marginTop: 2 }} />
                    <Text style={styles.bulletItemText}>{rule}</Text>
                  </View>
                ))}

                {/* Required Documents */}
                <Text style={styles.detailSectionLabel}>Required Application Files</Text>
                {selectedScheme.requiredDocs.map((doc, idx) => (
                  <View key={idx} style={styles.bulletItemRow}>
                    <MaterialCommunityIcons name="file-document-outline" size={16} color={COLORS.secondary} style={{ marginRight: 8, marginTop: 2 }} />
                    <Text style={styles.bulletItemText}>{doc}</Text>
                  </View>
                ))}

                {/* FAQs */}
                <Text style={styles.detailSectionLabel}>Program FAQs</Text>
                {selectedScheme.faqs.map((faq, idx) => (
                  <View key={idx} style={styles.faqCard}>
                    <Text style={styles.faqQuestion}>Q: {faq.q}</Text>
                    <Text style={styles.faqAnswer}>{faq.a}</Text>
                  </View>
                ))}

                {/* Checkout Trigger Actions */}
                {selectedScheme.status === 'Not Applied' ? (
                  <TouchableOpacity
                    style={styles.sheetActionBtn}
                    onPress={() => {
                      setIsEligibilityOpen(true);
                    }}
                  >
                    <LinearGradient colors={[COLORS.primary, COLORS.secondary]} style={styles.sheetActionBtnGrad as any}>
                      <Text style={styles.sheetActionBtnText}>Evaluate Eligibility Status</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity
                    style={styles.sheetActionBtnOutline}
                    onPress={() => {
                      setSelectedSchemeId(null);
                      setTrackingState(selectedScheme);
                      setSelectedTrackingNode(selectedScheme.status === 'Approved' ? 5 : 1);
                      setIsTrackingOpen(true);
                    }}
                  >
                    <Text style={styles.sheetActionBtnOutlineText}>Track Application Progress</Text>
                  </TouchableOpacity>
                )}
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

      {/* ================================================= */}
      {/* 2. ASSESSMENT ELIGIBILITY CHECK FORM MODAL */}
      {/* ================================================= */}
      <Modal visible={isEligibilityOpen} transparent animationType="slide" onRequestClose={() => setIsEligibilityOpen(false)}>
        <View style={styles.modalBackdrop}>
          <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={() => setIsEligibilityOpen(false)} />
          <View style={styles.sheet}>
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.detailsModalScroll}>
              <View style={styles.detailHeaderBlock}>
                <View style={styles.detailTitleRow}>
                  <View style={styles.detailLogoCircle}>
                    <MaterialCommunityIcons name="calculator" size={24} color={COLORS.primary} />
                  </View>
                  <View style={{ flex: 1, marginLeft: 14 }}>
                    <Text style={styles.detailDeptName}>BhumiCheck Evaluator</Text>
                    <Text style={styles.detailProgName}>Scheme Eligibility Questionnaire</Text>
                  </View>
                  <TouchableOpacity onPress={() => setIsEligibilityOpen(false)}>
                    <MaterialCommunityIcons name="close" size={24} color={COLORS.textSecondary} />
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.modalDivider} />

              {/* Pre-filled read-only rows */}
              <Text style={styles.detailSectionLabel}>Auto-filled Profile Metadata</Text>
              <View style={styles.readOnlyPrefillBox}>
                <View style={styles.prefillRow}>
                  <Text style={styles.prefillLabel}>Farmer Name:</Text>
                  <Text style={styles.prefillVal}>{authUser?.fullName || ''}</Text>
                </View>
                <View style={styles.prefillRow}>
                  <Text style={styles.prefillLabel}>District Block:</Text>
                  <Text style={styles.prefillVal}>{authUser?.district || 'Bhopal'}</Text>
                </View>
                <View style={styles.prefillRow}>
                  <Text style={styles.prefillLabel}>Land size:</Text>
                  <Text style={styles.prefillVal}>{plots.reduce((sum, p) => sum + p.acres, 0) || 4.5} Acres</Text>
                </View>
              </View>

              {/* Dynamic Questionnaire fields */}
              {isQuestionnaireLoading && (
                <View style={{ padding: 40, alignItems: 'center' }}>
                  <ActivityIndicator size="large" color={COLORS.primary} />
                  <Text style={{ marginTop: 12, color: COLORS.textDark }}>Loading questionnaire...</Text>
                </View>
              )}
              
              {!isQuestionnaireLoading && agriError && (
                <View style={{ padding: 40, alignItems: 'center' }}>
                  <MaterialCommunityIcons name="alert-circle-outline" size={48} color={COLORS.danger} />
                  <Text style={{ marginTop: 12, color: COLORS.textDark, textAlign: 'center' }}>{agriError}</Text>
                </View>
              )}
              
              {!isQuestionnaireLoading && !agriError && currentQuestionnaire.length === 0 && (
                <View style={{ padding: 40, alignItems: 'center' }}>
                  <MaterialCommunityIcons name="clipboard-text-outline" size={48} color={COLORS.textSecondary} />
                  <Text style={{ marginTop: 12, color: COLORS.textDark, textAlign: 'center' }}>No questions configured for this scheme.</Text>
                </View>
              )}
              
              {!isQuestionnaireLoading && !agriError && currentQuestionnaire.map((q) => (
                <View key={q.id} style={q.field_type === 'boolean' ? styles.insuranceToggleBox : styles.formField}>
                  {q.field_type === 'boolean' ? (
                    <>
                      <Text style={styles.insuranceToggleLabel}>{q.question} {q.required && <Text style={styles.red}>*</Text>}</Text>
                      <TouchableOpacity
                        style={[styles.switchTrack, formAnswers[q.field_key] ? styles.switchTrackActive : styles.switchTrackInactive]}
                        activeOpacity={0.8}
                        onPress={() => handleAnswerChange(q.field_key, !formAnswers[q.field_key])}
                      >
                        <View style={[styles.switchThumb, formAnswers[q.field_key] ? styles.switchThumbActive : styles.switchThumbInactive]} />
                      </TouchableOpacity>
                    </>
                  ) : (
                    <>
                      <Text style={styles.fieldLabel}>{q.question} {q.required && <Text style={styles.red}>*</Text>}</Text>
                      {q.description && <Text style={{ fontSize: 12, color: COLORS.textSecondary, marginBottom: 8 }}>{q.description}</Text>}
                      
                      {(q.field_type === 'text' || q.field_type === 'textarea' || q.field_type === 'number') && (
                        <TextInput
                          style={[styles.boxInput, q.field_type === 'textarea' && { height: 80, textAlignVertical: 'top' }]}
                          placeholder={q.placeholder || ''}
                          placeholderTextColor="#94A3B8"
                          keyboardType={q.field_type === 'number' ? 'numeric' : 'default'}
                          multiline={q.field_type === 'textarea'}
                          value={formAnswers[q.field_key] || ''}
                          onChangeText={(val) => handleAnswerChange(q.field_key, val)}
                        />
                      )}
                      
                      {(q.field_type === 'radio' || q.field_type === 'dropdown') && (
                        <View style={styles.calcGridOptions}>
                          {q.options.map(opt => (
                            <TouchableOpacity
                              key={opt}
                              style={[styles.calcGridOptionBtn, formAnswers[q.field_key] === opt && styles.calcGridOptionBtnActive]}
                              onPress={() => handleAnswerChange(q.field_key, opt)}
                            >
                              <Text style={[styles.calcGridOptionText, formAnswers[q.field_key] === opt && styles.calcGridOptionTextActive]}>{opt}</Text>
                            </TouchableOpacity>
                          ))}
                        </View>
                      )}

                      {q.field_type === 'checkbox' && (
                        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 4 }}>
                          {q.options.map(opt => {
                            const isSelected = (formAnswers[q.field_key] || []).includes(opt);
                            return (
                              <TouchableOpacity
                                key={opt}
                                style={[styles.calcGridOptionBtn, isSelected && styles.calcGridOptionBtnActive, { flex: 0, paddingHorizontal: 16 }]}
                                onPress={() => {
                                  const current = formAnswers[q.field_key] || [];
                                  if (isSelected) {
                                    handleAnswerChange(q.field_key, current.filter((x: string) => x !== opt));
                                  } else {
                                    handleAnswerChange(q.field_key, [...current, opt]);
                                  }
                                }}
                              >
                                <Text style={[styles.calcGridOptionText, isSelected && styles.calcGridOptionTextActive]}>{opt}</Text>
                              </TouchableOpacity>
                            )
                          })}
                        </View>
                      )}
                    </>
                  )}
                </View>
              ))}

              {/* Submit checker button */}
              <TouchableOpacity style={styles.sheetActionBtn} onPress={handleCheckEligibility} disabled={isSubmittingQuestionnaire || currentApplicationReview?.status === 'SUBMITTED'}>
                <LinearGradient colors={[COLORS.primary, COLORS.secondary]} style={styles.sheetActionBtnGrad as any}>
                  {isSubmittingQuestionnaire ? (
                    <ActivityIndicator size="small" color="#FFF" />
                  ) : (
                    <Text style={styles.sheetActionBtnText}>Submit Assessment</Text>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ================================================= */}
      {/* 2.1 ELIGIBILITY ASSESSMENT RESULT SPLASH MODAL */}
      {/* ================================================= */}
      <Modal visible={isEligibilityResultVisible} transparent animationType="slide" onRequestClose={() => setIsEligibilityResultVisible(false)}>
        <View style={styles.modalBackdrop}>
          <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={() => setIsEligibilityResultVisible(false)} />
          <View style={styles.sheet}>
            {eligibilityResultData && (
              <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.detailsModalScroll}>
                <View style={styles.successHeader}>
                  <Text style={styles.detailProgName}>Assessment Submitted</Text>
                  <Text style={styles.detailDeptName}>Your response has been securely recorded.</Text>
                </View>

                {/* Score Circular progress medallion - Restored with actual data */}
                <View style={{ paddingVertical: 40, alignItems: 'center' }}>
                  <Text style={{ fontSize: 48, fontWeight: 'bold', color: COLORS.primary }}>
                    {eligibilityResultData.eligibility?.percentage ?? 0}%
                  </Text>
                  <Text style={{ fontSize: 18, color: COLORS.textLight, marginTop: 8, fontWeight: '600' }}>
                    {eligibilityResultData.eligibility?.status?.replace(/_/g, ' ') || 'UNKNOWN'}
                  </Text>
                </View>

                {/* Eligibility specs list */}
                <View style={styles.invoiceReceiptCompact}>
                  <View style={styles.receiptRow}>
                    <Text style={styles.receiptLabel}>Assessment ID:</Text>
                    <Text style={[styles.receiptVal, { color: COLORS.primary }]}>{eligibilityResultData.assessment_id}</Text>
                  </View>
                  <View style={styles.receiptRow}>
                    <Text style={styles.receiptLabel}>Next Step:</Text>
                    <Text style={styles.receiptVal}>{eligibilityResultData.next_step}</Text>
                  </View>
                </View>

                {/* Recommendations */}
                {eligibilityResultData.eligibility?.recommendations?.length > 0 && (
                  <View style={{ marginTop: 24, padding: 16, backgroundColor: '#f0f9ff', borderRadius: 12 }}>
                    <Text style={{ fontSize: 14, fontWeight: '700', color: '#0369a1', marginBottom: 8 }}>Recommendations</Text>
                    {eligibilityResultData.eligibility.recommendations.map((rec: string, i: number) => (
                      <View key={`rec-${i}`} style={{ flexDirection: 'row', marginBottom: 4 }}>
                        <Text style={{ color: '#0284c7', marginRight: 6 }}>•</Text>
                        <Text style={{ fontSize: 13, color: '#0284c7', flex: 1 }}>{rec}</Text>
                      </View>
                    ))}
                  </View>
                )}

                {/* Missing Requirements */}
                {eligibilityResultData.eligibility?.missing_requirements?.length > 0 && (
                  <View style={{ marginTop: 16, padding: 16, backgroundColor: '#fef2f2', borderRadius: 12, marginBottom: 12 }}>
                    <Text style={{ fontSize: 14, fontWeight: '700', color: '#991b1b', marginBottom: 8 }}>Missing Requirements</Text>
                    {eligibilityResultData.eligibility.missing_requirements.map((req: string, i: number) => (
                      <View key={`req-${i}`} style={{ flexDirection: 'row', marginBottom: 4 }}>
                        <Text style={{ color: '#b91c1c', marginRight: 6 }}>•</Text>
                        <Text style={{ fontSize: 13, color: '#b91c1c', flex: 1 }}>{req}</Text>
                      </View>
                    ))}
                  </View>
                )}

                {/* Application wizard router triggers */}
                <TouchableOpacity
                  style={styles.sheetActionBtn}
                  onPress={() => {
                    setIsEligibilityResultVisible(false);
                    setIsEligibilityOpen(false);
                    setAppStep(1);
                    setAadhaarUploaded(false);
                    setLandUploaded(false);
                    setSoilUploaded(false);
                    setIsApplicationOpen(true);
                  }}
                >
                  <LinearGradient colors={[COLORS.primary, COLORS.secondary]} style={styles.sheetActionBtnGrad as any}>
                    <Text style={styles.sheetActionBtnText}>Proceed to scheme checkout</Text>
                  </LinearGradient>
                </TouchableOpacity>

              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

      {/* ================================================= */}
      {/* 3. MULTI-STEP SCHEME APPLICATION MODAL */}
      {/* ================================================= */}
      <Modal visible={isApplicationOpen} transparent animationType="slide" onRequestClose={() => setIsApplicationOpen(false)}>
        <View style={styles.modalBackdrop}>
          <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={() => setIsApplicationOpen(false)} />
          <View style={styles.sheet}>
            {selectedScheme && (
              <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.detailsModalScroll}>
                <View style={styles.detailHeaderBlock}>
                  <View style={styles.detailTitleRow}>
                    <View style={styles.detailLogoCircle}>
                      <MaterialCommunityIcons name="file-document-edit-outline" size={24} color={COLORS.primary} />
                    </View>
                    <View style={{ flex: 1, marginLeft: 14 }}>
                      <Text style={styles.detailDeptName}>Registry Checkout</Text>
                      <Text style={styles.detailProgName}>Scheme Application Wizard</Text>
                    </View>
                    {appStep < 3 && (
                      <TouchableOpacity onPress={() => setIsApplicationOpen(false)}>
                        <MaterialCommunityIcons name="close" size={24} color={COLORS.textSecondary} />
                      </TouchableOpacity>
                    )}
                  </View>

                  {/* App Stepper */}
                  {appStep < 3 && (
                    <View style={styles.appStepperRow}>
                      <View style={styles.appStepperCol}>
                        <View style={[styles.appStepDot, appStep >= 1 && styles.appStepDotActive]}>
                          <Text style={[styles.appStepDotLabel, appStep >= 1 && styles.appStepDotLabelActive]}>1</Text>
                        </View>
                        <Text style={styles.appStepText}>Uploader</Text>
                      </View>
                      <View style={[styles.appStepLine, appStep >= 2 && styles.appStepLineActive]} />
                      <View style={styles.appStepperCol}>
                        <View style={[styles.appStepDot, appStep >= 2 && styles.appStepDotActive]}>
                          <Text style={[styles.appStepDotLabel, appStep >= 2 && styles.appStepDotLabelActive]}>2</Text>
                        </View>
                        <Text style={styles.appStepText}>Review</Text>
                      </View>
                    </View>
                  )}
                </View>

                <View style={styles.modalDivider} />

                {/* ================================================= */}
                {/* WIZARD STEP 1: DOCUMENT UPLOADER */}
                {/* ================================================= */}
                {appStep === 1 && (
                  <View style={{ flex: 1 }}>
                    <Text style={styles.detailSectionLabel}>Upload Official Land & Soil Credentials</Text>
                    <Text style={styles.stepSectionDesc}>Upload document scans to verify baseline agriculture parameters.</Text>

                    {/* Aadhaar link check upload */}
                    <View style={styles.uploadContainer}>
                      <View style={styles.uploadDetailsRow}>
                        <Text style={styles.uploadTitleLabel}>1. Farmer Aadhaar biometric Card <Text style={styles.red}>*</Text></Text>
                        <TouchableOpacity style={styles.uploadActionIconBtn} onPress={handleAadhaarUpload} disabled={isUploadingDocument || currentApplicationReview?.status === 'SUBMITTED'}>
                          <MaterialCommunityIcons name="upload" size={16} color={currentApplicationReview?.status === 'SUBMITTED' ? COLORS.textSecondary : COLORS.primary} />
                        </TouchableOpacity>
                      </View>
                      {uploadedDocuments.find(d => d.document_type === 'Aadhaar') && (
                        <View style={styles.uploadSuccessBox}>
                          <MaterialCommunityIcons name="check-circle" size={14} color={COLORS.success} style={{ marginRight: 6 }} />
                          <Text style={styles.uploadSuccessText}>{uploadedDocuments.find(d => d.document_type === 'Aadhaar').original_file_name} verified!</Text>
                          {currentApplicationReview?.status !== 'SUBMITTED' && (
                            <TouchableOpacity onPress={() => deleteDocument(currentApplicationId || applicationId, uploadedDocuments.find(d => d.document_type === 'Aadhaar').id)} style={{ marginLeft: 'auto' }}>
                               <MaterialCommunityIcons name="close" size={14} color={COLORS.danger} />
                            </TouchableOpacity>
                          )}
                        </View>
                      )}
                    </View>

                    {/* Land registry document upload */}
                    <View style={styles.uploadContainer}>
                      <View style={styles.uploadDetailsRow}>
                        <Text style={styles.uploadTitleLabel}>2. Land Khasra Registry copy <Text style={styles.red}>*</Text></Text>
                        <TouchableOpacity style={styles.uploadActionIconBtn} onPress={handleLandUpload} disabled={isUploadingDocument || currentApplicationReview?.status === 'SUBMITTED'}>
                          <MaterialCommunityIcons name="upload" size={16} color={currentApplicationReview?.status === 'SUBMITTED' ? COLORS.textSecondary : COLORS.primary} />
                        </TouchableOpacity>
                      </View>
                      {uploadedDocuments.find(d => d.document_type === 'Land Ownership Proof') && (
                        <View style={styles.uploadSuccessBox}>
                          <MaterialCommunityIcons name="check-circle" size={14} color={COLORS.success} style={{ marginRight: 6 }} />
                          <Text style={styles.uploadSuccessText}>{uploadedDocuments.find(d => d.document_type === 'Land Ownership Proof').original_file_name} verified!</Text>
                          {currentApplicationReview?.status !== 'SUBMITTED' && (
                            <TouchableOpacity onPress={() => deleteDocument(currentApplicationId || applicationId, uploadedDocuments.find(d => d.document_type === 'Land Ownership Proof').id)} style={{ marginLeft: 'auto' }}>
                               <MaterialCommunityIcons name="close" size={14} color={COLORS.danger} />
                            </TouchableOpacity>
                          )}
                        </View>
                      )}
                    </View>

                    {/* Soil health document upload */}
                    <View style={styles.uploadContainer}>
                      <View style={styles.uploadDetailsRow}>
                        <Text style={styles.uploadTitleLabel}>3. Soil carbon Health Card copy <Text style={styles.red}>*</Text></Text>
                        <TouchableOpacity style={styles.uploadActionIconBtn} onPress={handleSoilUpload} disabled={isUploadingDocument || currentApplicationReview?.status === 'SUBMITTED'}>
                          <MaterialCommunityIcons name="upload" size={16} color={currentApplicationReview?.status === 'SUBMITTED' ? COLORS.textSecondary : COLORS.primary} />
                        </TouchableOpacity>
                      </View>
                      {uploadedDocuments.find(d => d.document_type === 'Soil Health Card') && (
                        <View style={styles.uploadSuccessBox}>
                          <MaterialCommunityIcons name="check-circle" size={14} color={COLORS.success} style={{ marginRight: 6 }} />
                          <Text style={styles.uploadSuccessText}>{uploadedDocuments.find(d => d.document_type === 'Soil Health Card').original_file_name} verified!</Text>
                          {currentApplicationReview?.status !== 'SUBMITTED' && (
                            <TouchableOpacity onPress={() => deleteDocument(currentApplicationId || applicationId, uploadedDocuments.find(d => d.document_type === 'Soil Health Card').id)} style={{ marginLeft: 'auto' }}>
                               <MaterialCommunityIcons name="close" size={14} color={COLORS.danger} />
                            </TouchableOpacity>
                          )}
                        </View>
                      )}
                    </View>

                    {/* Navigation trigger */}
                    <TouchableOpacity
                      style={styles.sheetActionBtn}
                      onPress={() => {
                        const hasAadhaar = uploadedDocuments.find(d => d.document_type === 'Aadhaar');
                        const hasLand = uploadedDocuments.find(d => d.document_type === 'Land Ownership Proof');
                        const hasSoil = uploadedDocuments.find(d => d.document_type === 'Soil Health Card');
                        if (!hasAadhaar || !hasLand || !hasSoil) {
                          Alert.alert('Missing Documents', 'Please upload sowed agricultural credentials first.');
                          return;
                        }
                        setAppStep(2);
                      }}
                    >
                      <LinearGradient colors={[COLORS.primary, COLORS.secondary]} style={styles.sheetActionBtnGrad as any}>
                        <Text style={styles.sheetActionBtnText}>Proceed to application review</Text>
                      </LinearGradient>
                    </TouchableOpacity>
                  </View>
                )}

                {/* ================================================= */}
                {/* WIZARD STEP 2: SUMMARY REVIEW */}
                {/* ================================================= */}
                {appStep === 2 && (
                  <View style={{ flex: 1 }}>
                    <Text style={styles.detailSectionLabel}>Confirm Payout Details</Text>
                    <Text style={styles.stepSectionDesc}>Review details before handoff to agricultural ministry portal.</Text>

                    {isReviewLoading ? (
                       <View style={{ padding: 20, alignItems: 'center' }}>
                          <ActivityIndicator size="large" color={COLORS.primary} />
                          <Text style={{ marginTop: 10, color: COLORS.textSecondary }}>Loading application data...</Text>
                       </View>
                    ) : !currentApplicationReview ? (
                       <View style={{ padding: 20, alignItems: 'center' }}>
                          <Text style={{ color: COLORS.danger }}>Failed to load application review. Please try again.</Text>
                       </View>
                    ) : (
                      <>
                        {/* Invoice review card */}
                        <View style={styles.invoiceReceiptCompact}>
                          <View style={styles.receiptRow}>
                            <Text style={styles.receiptLabel}>Selected Subsidy:</Text>
                            <Text style={styles.receiptVal}>{currentApplicationReview.scheme?.title || selectedScheme?.name}</Text>
                          </View>
                          <View style={styles.receiptRow}>
                            <Text style={styles.receiptLabel}>Estimated Benefit Amount:</Text>
                            <Text style={[styles.receiptVal, { color: COLORS.primary }]}>{selectedScheme?.benefitAmount}</Text>
                          </View>
                          <View style={styles.receiptRow}>
                            <Text style={styles.receiptLabel}>Registered Farmer Name:</Text>
                            <Text style={styles.receiptVal}>{authUser?.fullName || ''}</Text>
                          </View>
                          <View style={styles.receiptRow}>
                            <Text style={styles.receiptLabel}>Verification Documents:</Text>
                            <Text style={styles.receiptVal}>{currentApplicationReview.documents?.length || 0} Files verified</Text>
                          </View>
                        </View>

                        {/* Questionnaire Answers Preview */}
                        <View style={[styles.guidelineCard, { marginTop: 10 }]}>
                          <Text style={[styles.receiptLabel, { marginBottom: 6, fontWeight: '700' }]}>Submitted Answers:</Text>
                          {currentApplicationReview.answers && Object.entries(currentApplicationReview.answers).map(([key, val]) => (
                             <Text key={key} style={[styles.receiptVal, { fontSize: 13, marginBottom: 4 }]}>
                               • {key.replace(/_/g, ' ')}: {String(val)}
                             </Text>
                          ))}
                        </View>

                        {/* Dynamic disclaimer */}
                        <View style={[styles.guidelineCard, { marginTop: 10 }]}>
                          <MaterialCommunityIcons name="shield-lock-outline" size={18} color={COLORS.primary} style={{ marginRight: 6 }} />
                          <Text style={styles.guidelineText}>
                            “Your verification credentials will be transmitted directly via secure DBT government channel.”
                          </Text>
                        </View>

                        {/* Submissions action triggers */}
                        {currentApplicationReview.status !== 'SUBMITTED' ? (
                          <>
                            <TouchableOpacity
                              style={styles.sheetActionBtn}
                              onPress={handleApplyScheme}
                              disabled={isAppSubmitting}
                            >
                              <LinearGradient colors={[COLORS.primary, COLORS.secondary]} style={styles.sheetActionBtnGrad as any}>
                                {isAppSubmitting ? (
                                  <ActivityIndicator size="small" color="#FFFFFF" />
                                ) : (
                                  <Text style={styles.sheetActionBtnText}>Submit Subsidy Application</Text>
                                )}
                              </LinearGradient>
                            </TouchableOpacity>

                            <TouchableOpacity style={styles.sheetActionBtnOutline} onPress={() => setAppStep(1)}>
                              <Text style={styles.sheetActionBtnOutlineText}>Back to uploader</Text>
                            </TouchableOpacity>
                          </>
                        ) : (
                          <View style={{ marginTop: 20, padding: 15, backgroundColor: COLORS.successLight, borderRadius: 8 }}>
                            <Text style={{ color: COLORS.success, textAlign: 'center', fontWeight: '600' }}>
                               This application has already been submitted.
                            </Text>
                          </View>
                        )}
                      </>
                    )}
                  </View>
                )}

                {/* ================================================= */}
                {/* WIZARD STEP 3: SUCCESS SPLASH ALERT */}
                {/* ================================================= */}
                {appStep === 3 && (
                  <View style={styles.successWrapper}>
                    <View style={styles.successIconOuterRing}>
                      <LinearGradient colors={['#DCFCE7', '#84CC16']} style={styles.successIconRing as any}>
                        <MaterialCommunityIcons name="check-decagram" size={54} color={COLORS.primary} />
                      </LinearGradient>
                    </View>

                    <Text style={styles.successTitle}>Application Submitted Successfully</Text>
                    <Text style={styles.successDesc}>
                      Your credentials have been queued in government agricultural ledger portal. Mapped to sowed baseline carbon project ID: {applicationReference}.
                    </Text>

                    <View style={styles.invoiceReceiptCompact}>
                      <View style={styles.receiptRow}>
                        <Text style={styles.receiptLabel}>Government Tracking ID:</Text>
                        <Text style={styles.receiptVal}>{applicationReference}</Text>
                      </View>
                      <View style={styles.receiptRow}>
                        <Text style={styles.receiptLabel}>Estimated Review Duration:</Text>
                        <Text style={styles.receiptVal}>7 Working Days</Text>
                      </View>
                      <View style={styles.receiptRow}>
                        <Text style={styles.receiptLabel}>Funding Channel Status:</Text>
                        <Text style={styles.receiptValGreen}>Awaiting biometric audit</Text>
                      </View>
                    </View>

                    {/* Payout tracking redirect */}
                    <TouchableOpacity
                      style={styles.sheetActionBtn}
                      onPress={() => {
                        setIsApplicationOpen(false);
                        setSelectedSchemeId(null);
                        setTrackingState({
                          ...selectedScheme,
                          status: 'Applied',
                          applicationNumber: applicationId
                        });
                        setSelectedTrackingNode(1);
                        setIsTrackingOpen(true);
                      }}
                    >
                      <LinearGradient colors={[COLORS.primary, COLORS.secondary]} style={styles.sheetActionBtnGrad as any}>
                        <Text style={styles.sheetActionBtnText}>Track Application Pipeline</Text>
                      </LinearGradient>
                    </TouchableOpacity>
                    
                    <TouchableOpacity style={styles.actionBtnFlat} onPress={() => setIsApplicationOpen(false)}>
                      <Text style={styles.actionBtnFlatText}>Back to Dashboard</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

      {/* ================================================= */}
      {/* 4. APPLICATION TRACKING LIFECYCLE MODAL */}
      {/* ================================================= */}
      <Modal visible={isTrackingOpen} transparent animationType="slide" onRequestClose={() => setIsTrackingOpen(false)}>
        <View style={styles.modalBackdrop}>
          <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={() => setIsTrackingOpen(false)} />
          <View style={styles.sheet}>
            {trackingState && (
              <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.detailsModalScroll}>
                <View style={styles.detailHeaderBlock}>
                  <View style={styles.detailTitleRow}>
                    <View style={styles.detailLogoCircle}>
                      <MaterialCommunityIcons name="radar" size={24} color={COLORS.primary} />
                    </View>
                    <View style={{ flex: 1, marginLeft: 14 }}>
                      <Text style={styles.detailDeptName}>DBT Tracking System</Text>
                      <Text style={styles.detailProgName}>{trackingState.name}</Text>
                    </View>
                    <TouchableOpacity onPress={() => setIsTrackingOpen(false)}>
                      <MaterialCommunityIcons name="close" size={24} color={COLORS.textSecondary} />
                    </TouchableOpacity>
                  </View>
                </View>

                <View style={styles.modalDivider} />

                {/* Vertical tracking timeline nodes */}
                <Text style={styles.detailSectionLabel}>Application Lifecycle Nodes</Text>
                
                <View style={styles.timelineList}>
                  {isTimelineLoading ? (
                    <ActivityIndicator size="large" color={COLORS.primary} style={{ marginVertical: 30 }} />
                  ) : applicationTimeline && applicationTimeline.length > 0 ? (
                    applicationTimeline.map((node: any, index: number) => {
                      const isSelected = selectedTrackingNode === index;
                      const statusIcon = index === 0 ? 'active' : 'done';
                      
                      return (
                        <View key={index} style={styles.timelineNodeWrapper}>
                          <View style={styles.timelineConnectorCol}>
                            <TouchableOpacity
                              style={[
                                styles.nodeBullet,
                                statusIcon === 'done' && styles.nodeBulletDone,
                                statusIcon === 'active' && styles.nodeBulletActive,
                              ] as any}
                              onPress={() => setSelectedTrackingNode(index)}
                            >
                              {statusIcon === 'done' && <MaterialCommunityIcons name="check" size={12} color="#FFFFFF" />}
                              {statusIcon === 'active' && <View style={styles.nodeActiveCore} />}
                            </TouchableOpacity>
                            {index < applicationTimeline.length - 1 && <View style={[styles.nodeConnectorLine, statusIcon === 'done' && styles.nodeConnectorLineDone]} />}
                          </View>

                          <TouchableOpacity
                            style={[styles.nodeTextCard, isSelected && styles.nodeTextCardActive] as any}
                            onPress={() => setSelectedTrackingNode(index)}
                          >
                            <View style={styles.nodeCardHeader}>
                              <Text style={[styles.nodeCardTitle, statusIcon === 'active' && styles.nodeCardTitleActive] as any}>{node.title}</Text>
                              <Text style={styles.nodeCardDate}>{new Date(node.timestamp).toLocaleDateString()}</Text>
                            </View>
                            <Text style={styles.nodeCardDesc}>{node.description}</Text>

                            {isSelected && node.info && (
                              <View style={styles.nodeCardExpanded}>
                                <View style={styles.nodeCardExpandedDivider} />
                                <Text style={styles.nodeCardExpandedLabel}>TECHNICAL AUDIT INFO</Text>
                                <Text style={styles.nodeCardExpandedVal}>{node.info}</Text>
                              </View>
                            )}
                          </TouchableOpacity>
                        </View>
                      );
                    })
                  ) : (
                    <Text style={{ textAlign: 'center', marginTop: 20, color: COLORS.textSecondary }}>No timeline events found.</Text>
                  )}
                </View>

                {trackingState.status === 'CLARIFICATION_REQUIRED' && (
                  <View style={{ marginTop: 20, backgroundColor: '#FEF2F2', padding: 15, borderRadius: 12, borderWidth: 1, borderColor: '#FECACA' }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                      <MaterialCommunityIcons name="alert-circle" size={20} color="#DC2626" />
                      <Text style={{ marginLeft: 8, fontSize: 14, fontWeight: '800', color: '#7F1D1D' }}>Action Required</Text>
                    </View>
                    
                    {isClarificationLoading ? (
                      <ActivityIndicator size="small" color="#DC2626" style={{ marginVertical: 10 }} />
                    ) : (
                      <>
                        <Text style={{ fontSize: 12, color: '#991B1B', marginBottom: 12 }}>
                          {clarificationData?.remarks || 'Admin has requested additional clarification.'}
                        </Text>
                        <Text style={{ fontSize: 11, color: '#991B1B', fontWeight: 'bold', marginBottom: 15 }}>
                          Requested by: {clarificationData?.requested_by}
                        </Text>
                        
                        <View style={{ gap: 10 }}>
                          <TouchableOpacity 
                            style={{ backgroundColor: '#DC2626', paddingVertical: 10, borderRadius: 8, alignItems: 'center' }}
                            onPress={async () => {
                              // Resubmit
                              const res = await resubmitApplication(trackingState.applicationNumber);
                              if (res.success) {
                                setTrackingState({ ...trackingState, status: 'RESUBMITTED' });
                                fetchApplicationTimeline(trackingState.applicationNumber);
                              }
                            }}
                          >
                            <Text style={{ color: 'white', fontSize: 12, fontWeight: 'bold' }}>Submit Clarification</Text>
                          </TouchableOpacity>
                        </View>
                      </>
                    )}
                  </View>
                )}

                <TouchableOpacity style={styles.sheetActionBtn} onPress={() => setIsTrackingOpen(false)}>
                  <LinearGradient colors={[COLORS.primary, COLORS.secondary]} style={styles.sheetActionBtnGrad as any}>
                    <Text style={styles.sheetActionBtnText}>Confirm and Return</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </ScrollView>
            )}
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
    paddingTop: Platform.OS === 'ios' ? 60 : 45,
    paddingBottom: 20,
    paddingHorizontal: 20,
    backgroundColor: COLORS.primary,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    ...SHADOWS.soft,
  },
  backBtn: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  headerSub: {
    fontSize: 10,
    color: '#A7F3D0',
    marginTop: 2,
    fontWeight: '600',
  },
  govtBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  govtBadgeText: {
    fontSize: 8.5,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
    paddingTop: 14,
  },
  alertBanner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    borderWidth: 1,
    borderColor: '#F59E0B',
    borderRadius: 14,
    padding: 12,
    marginBottom: 16,
  },
  alertBannerText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#78350F',
    flex: 1,
    marginRight: 10,
    lineHeight: 15,
  },
  recoContainer: {
    marginBottom: 20,
  },
  sectionLabel: {
    fontSize: 11,
    color: COLORS.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 10,
    marginLeft: 4,
    fontWeight: '800',
  },
  recoCard: {
    borderRadius: 20,
    padding: 16,
    ...SHADOWS.limeGlow,
    borderWidth: 1.5,
    borderColor: COLORS.accent,
  },
  recoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  aiIconBox: {
    backgroundColor: 'rgba(132, 204, 22, 0.15)',
    padding: 6,
    borderRadius: 8,
  },
  recoTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#84CC16',
    marginLeft: 8,
    letterSpacing: 0.5,
  },
  recoBody: {
    fontSize: 12.5,
    color: '#FFFFFF',
    lineHeight: 18,
    fontWeight: '700',
  },
  recoBulletShelf: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    marginTop: 12,
  },
  recoBulletText: {
    color: '#FFFFFF',
    fontSize: 10.5,
    fontWeight: '800',
    maxWidth: width * 0.65,
  },
  categoriesRow: {
    gap: 8,
    paddingBottom: 14,
  },
  categoryPill: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOWS.soft,
  },
  categoryPillActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  categoryPillLabel: {
    fontSize: 11.5,
    fontWeight: '800',
    color: COLORS.textSecondary,
  },
  categoryPillLabelActive: {
    color: '#FFFFFF',
  },
  searchContainer: {
    marginBottom: 20,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
    ...SHADOWS.soft,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: COLORS.textDark,
    fontWeight: '600',
  },
  listingSection: {
    marginBottom: 24,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  categoryFilterIndicator: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.primaryLight,
  },
  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    padding: 24,
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.textDark,
    marginTop: 10,
  },
  emptyDesc: {
    fontSize: 11,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: 4,
    lineHeight: 15,
  },
  schemeCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    padding: 16,
    marginBottom: 14,
    ...SHADOWS.soft,
  },
  schemeCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  schemeDeptRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1.2,
  },
  schemeLogoWrapper: {
    backgroundColor: '#F0FDF4',
    padding: 8,
    borderRadius: 10,
    marginRight: 10,
  },
  schDeptLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: COLORS.textSecondary,
    textTransform: 'uppercase',
  },
  schNameTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.textDark,
    marginTop: 2,
    lineHeight: 16,
  },
  statusPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 8.5,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  statusApproved: {
    backgroundColor: '#ECFDF5',
  },
  statusApprovedText: {
    color: COLORS.success,
  },
  statusApplied: {
    backgroundColor: '#FEF3C7',
  },
  statusAppliedText: {
    color: COLORS.warning,
  },
  statusNotApplied: {
    backgroundColor: '#F1F5F9',
  },
  statusNotAppliedText: {
    color: COLORS.textSecondary,
  },
  schCardDesc: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 10,
    lineHeight: 15,
    fontWeight: '500',
  },
  schSpecsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 10,
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  specBox: {
    flex: 1,
  },
  specLabel: {
    fontSize: 8,
    fontWeight: '800',
    color: COLORS.textSecondary,
  },
  specValue: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.primaryDark,
    marginTop: 2,
  },
  schActionButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 14,
    gap: 8,
  },
  detailsBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: COLORS.primary,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 10,
  },
  detailsBtnText: {
    color: COLORS.primary,
    fontSize: 11,
    fontWeight: '800',
  },
  applyBtn: {
    flex: 1,
    borderRadius: 20,
    overflow: 'hidden',
  },
  applyBtnGrad: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 10,
  },
  applyBtnText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
  },
  trackBtn: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#DCFCE7',
    borderWidth: 1,
    borderColor: COLORS.success,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 10,
  },
  trackBtnText: {
    color: COLORS.primary,
    fontSize: 11,
    fontWeight: '800',
  },
  calculatorSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    padding: 16,
    marginBottom: 20,
    ...SHADOWS.soft,
  },
  calcHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  calcHeaderTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.primary,
    marginLeft: 8,
  },
  calcHeaderDesc: {
    fontSize: 10.5,
    color: COLORS.textSecondary,
    marginTop: 4,
    lineHeight: 14,
  },
  sliderGroup: {
    marginTop: 14,
  },
  sliderLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  sliderLabel: {
    fontSize: 8.5,
    fontWeight: '800',
    color: COLORS.textSecondary,
  },
  sliderValText: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.primary,
  },
  quickOptionsRow: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 4,
  },
  quickCalcPill: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 10,
    paddingVertical: 8,
    alignItems: 'center',
  },
  quickCalcPillActive: {
    backgroundColor: '#DCFCE7',
    borderColor: COLORS.accent,
  },
  quickCalcPillLabel: {
    fontSize: 10.5,
    fontWeight: '800',
    color: COLORS.textSecondary,
  },
  quickCalcPillLabelActive: {
    color: COLORS.primary,
  },
  calcResultGrid: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 14,
  },
  calcResultBox: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  calcResultLabel: {
    fontSize: 7.5,
    fontWeight: '800',
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  calcResultValue: {
    fontSize: 11.5,
    fontWeight: '900',
    color: COLORS.primaryDark,
    marginTop: 4,
  },
  kycChecklistCard: {
    backgroundColor: '#FFFBEB',
    borderWidth: 1,
    borderColor: '#F59E0B',
    borderRadius: 20,
    padding: 14,
    marginBottom: 20,
  },
  kycHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  kycTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#B45309',
    marginLeft: 6,
    flex: 1,
  },
  kycDesc: {
    fontSize: 11,
    color: '#B45309',
    lineHeight: 15,
  },
  kycActionBtn: {
    backgroundColor: '#B45309',
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 12,
  },
  kycActionBtnText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
  },
  modalBackdrop: {
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
  detailsModalScroll: {
    padding: 20,
    paddingBottom: 36,
  },
  detailHeaderBlock: {
    marginBottom: 10,
  },
  detailTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailLogoCircle: {
    backgroundColor: '#F0FDF4',
    padding: 10,
    borderRadius: 22,
  },
  detailDeptName: {
    fontSize: 9,
    fontWeight: '800',
    color: COLORS.textSecondary,
    textTransform: 'uppercase',
  },
  detailProgName: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.primaryDark,
    marginTop: 2,
    lineHeight: 18,
  },
  modalDivider: {
    height: 1,
    backgroundColor: '#E2E8F0',
    marginVertical: 12,
  },
  specsHighlightsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14,
  },
  highlightPill: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  highlightPillLabel: {
    fontSize: 8,
    fontWeight: '800',
    color: COLORS.textSecondary,
  },
  highlightPillVal: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.primary,
    marginTop: 2,
  },
  detailSectionLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 14,
    marginBottom: 8,
  },
  detailDescContent: {
    fontSize: 12.5,
    color: COLORS.textSecondary,
    lineHeight: 18,
    fontWeight: '500',
  },
  bulletItemRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginVertical: 4,
  },
  bulletItemText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    lineHeight: 17,
    fontWeight: '500',
  },
  faqCard: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 14,
    padding: 12,
    marginVertical: 4,
  },
  faqQuestion: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.primary,
  },
  faqAnswer: {
    fontSize: 11.5,
    color: COLORS.textSecondary,
    marginTop: 4,
    lineHeight: 16,
    fontWeight: '500',
  },
  sheetActionBtn: {
    borderRadius: 24,
    overflow: 'hidden',
    marginTop: 18,
    ...SHADOWS.limeGlow,
  },
  sheetActionBtnGrad: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
  },
  sheetActionBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
  sheetActionBtnOutline: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: COLORS.primary,
    borderRadius: 24,
    paddingVertical: 13,
    alignItems: 'center',
    marginTop: 14,
  },
  sheetActionBtnOutlineText: {
    color: COLORS.primary,
    fontSize: 13,
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
  readOnlyPrefillBox: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 16,
    padding: 12,
    marginBottom: 16,
    gap: 8,
  },
  prefillRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  prefillLabel: {
    fontSize: 11.5,
    color: COLORS.textSecondary,
  },
  prefillVal: {
    fontSize: 11.5,
    fontWeight: '800',
    color: COLORS.textDark,
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
  calcGridOptions: {
    flexDirection: 'row',
    gap: 8,
  },
  calcGridOptionBtn: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: 'center',
  },
  calcGridOptionBtnActive: {
    backgroundColor: '#DCFCE7',
    borderColor: COLORS.accent,
  },
  calcGridOptionText: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.textSecondary,
  },
  calcGridOptionTextActive: {
    color: COLORS.primary,
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
    fontSize: 12.5,
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
  circleProgressWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 18,
  },
  circleProgressInner: {
    position: 'absolute',
    alignItems: 'center',
  },
  circleProgressVal: {
    fontSize: 22,
    fontWeight: '900',
    color: COLORS.primaryDark,
  },
  circleProgressLabel: {
    fontSize: 8.5,
    fontWeight: '900',
    color: COLORS.textSecondary,
    textTransform: 'uppercase',
    marginTop: 2,
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
  recoCardHighlight: {
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: COLORS.accent,
    borderRadius: 14,
    padding: 12,
    marginVertical: 4,
  },
  recoHighlightText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: COLORS.primary,
    lineHeight: 16,
  },
  missingDocItem: {
    fontSize: 11.5,
    color: COLORS.textSecondary,
    fontWeight: '700',
    marginVertical: 2,
    marginLeft: 4,
  },
  appStepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 14,
    paddingHorizontal: 20,
  },
  appStepperCol: {
    alignItems: 'center',
  },
  appStepDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  appStepDotActive: {
    backgroundColor: COLORS.primary,
  },
  appStepDotLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.textSecondary,
  },
  appStepDotLabelActive: {
    color: '#FFFFFF',
  },
  appStepText: {
    fontSize: 9,
    fontWeight: '800',
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  appStepLine: {
    height: 2.5,
    flex: 0.8,
    backgroundColor: '#E2E8F0',
    marginHorizontal: 8,
    marginTop: -12,
  },
  appStepLineActive: {
    backgroundColor: COLORS.primary,
  },
  stepSectionDesc: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 4,
    marginBottom: 16,
    lineHeight: 16,
  },
  uploadContainer: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 16,
    padding: 12,
    marginBottom: 12,
  },
  uploadDetailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  uploadTitleLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.textDark,
  },
  uploadActionIconBtn: {
    backgroundColor: '#E2E8F0',
    padding: 6,
    borderRadius: 10,
  },
  progressUploadBg: {
    height: 4,
    backgroundColor: '#E2E8F0',
    borderRadius: 2,
    marginTop: 8,
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
    marginTop: 8,
  },
  uploadSuccessText: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.success,
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
  successHeader: {
    alignItems: 'center',
    marginBottom: 20,
    paddingTop: 10,
  },
  guidelineCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    borderRadius: 12,
    padding: 12,
    marginTop: 18,
    marginBottom: 10,
  },
  guidelineText: {
    flex: 1,
    fontSize: 10.5,
    fontStyle: 'italic',
    color: '#065F46',
    lineHeight: 15,
  },
});

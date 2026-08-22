import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions, Animated, Modal, Pressable, StatusBar, Platform, Image, DeviceEventEmitter, FlatList, RefreshControl, Alert, OpaqueColorValue, TextInput } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path, Circle } from 'react-native-svg';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { COLORS, TYPOGRAPHY, SHADOWS } from '../../src/theme/theme';
import api, { API_ROOT_URL } from '../../src/api/apiClient';
import { useAuthStore } from '../../src/store/authStore';
import { useLandStore } from '../../src/store/landStore';
import { useCarbonStore } from '../../src/store/carbonStore';
import { useInsuranceStore } from '../../src/store/insuranceStore';
import { useWalletStore } from '../../src/store/walletStore';
import { useNotificationStore } from '../../src/store/notificationStore';
import { useConnectivityStore } from '../../src/store/connectivityStore';
import { useAgriStore } from '../../src/store/agriStore';

import { LocationPickerModal } from '../../src/components/LocationPickerModal';
import { SevaBotModal } from '../../src/components/SevaBotModal';
import { CardSkeleton, ListSkeleton, TimelineSkeleton, SkeletonBase } from '../../src/components/SkeletonLoader';
import { AmbientEcoBackground, SeasonType } from '../../src/components/AmbientEcoBackground';
import { SuccessOverlay } from '../../src/components/SuccessOverlay';
import TrackingModal from '../../src/components/TrackingModal';
import { NotificationDropdown } from '../../src/components/NotificationDropdown';
import { PartnerHubModal, PartnerHubTab } from '../../src/components/PartnerHubModal';
import { GovtBodyDashboardView } from '../../src/components/GovtBodyDashboardView';

const { width } = Dimensions.get('window');

const HERO_SLIDES = [
  {
    id: '1',
    title: 'Soil Carbon Verification',
    subtitle: 'Claim carbon points for zero tillage',
    discount: 'EARN UP TO ₹5000',
    code: 'CARBONSOIL',
    colors: ['#064E3B', '#0F766E'] as [string, string],
    icon: 'sprout',
  },
  {
    id: '2',
    title: 'Solar Water Subsidy Open',
    subtitle: 'PM-KUSUM 60% direct subsidy',
    discount: 'REGISTER BY JUNE 15',
    code: 'SOLAR60',
    colors: ['#0F766E', '#0D9488'] as [string, string],
    icon: 'solar-power',
  },
  {
    id: '3',
    title: 'Green Family Milestone Bonus',
    subtitle: 'Group 5 trees & earn credits',
    discount: 'FLAT ₹1000 REWARD',
    code: 'FAMILYSAP',
    colors: ['#4D7C0F', '#84CC16'] as [string, string],
    icon: 'forest',
  },
];

// Derives the "City, State" label from the logged-in farmer's own profile data
// (populated via the existing auth/profile store — see fetchProfile in authStore.ts)
// instead of any hardcoded placeholder.
function formatFarmerLocation(profile: { city?: string | null; state?: string | null } | null | undefined): string {
  const city = profile?.city?.trim();
  const state = profile?.state?.trim();
  if (city && state) return `${city}, ${state}`;
  if (city) return city;
  if (state) return state;
  return 'Location not available';
}

export default function HomeScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();

  // Connectivity
  const isOnline = useConnectivityStore((state) => state.isOnline);
  const toggleOnline = useConnectivityStore((state) => state.toggleOnline);

  // Loading shimmers
  const { fetchHomeDashboard, fetchHomeSchemes, dashboardRecommendation, homeSchemes, isHomeLoading, error } = useAgriStore();
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [indexIsLoading, setIndexIsLoading] = useState<boolean>(false);
  const isLoading = isHomeLoading || indexIsLoading;
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [cmsDashboardData, setCmsDashboardData] = useState<any>(null);
  const [badgeCabinet, setBadgeCabinet] = useState<any[]>([]);

  const [apiBanners, setApiBanners] = useState<any[]>([]);

  const fetchBadgeCabinet = async () => {
    try {
      const response = await api.get('/farmer/badges/my-cabinet');
      if (response.data && response.data.success && response.data.data?.badges) {
        setBadgeCabinet(response.data.data.badges);
      }
    } catch (error) {
      console.warn('[HomeScreen] Error fetching badge cabinet:', error);
    }
  };

  const fetchBannersData = async () => {
    try {
      const response = await api.get('/banners');
      if (Array.isArray(response.data)) {
        setApiBanners(response.data);
      }
    } catch (error) {
      console.warn('[HomeScreen] Error fetching banners data:', error);
    }
  };

  const fetchDashboardData = async () => {
    try {
      const response = await api.get('/farmer/homescreen/dashboard');
      if (response.data && response.data.success) {
        setDashboardData(response.data.data);
      } else if (response.data && response.data.data) {
        setDashboardData(response.data.data);
      }
    } catch (error) {
      console.warn('[HomeScreen] Error fetching dashboard data:', error);
    }
  };

  const fetchCmsData = async () => {
    try {
      const response = await api.get('/cms/user-dashboard');
      if (response.data) {
        setCmsDashboardData(response.data);
      }
    } catch (error) {
      console.warn('[HomeScreen] Error fetching CMS dashboard data:', error);
    }
  };

  const { fetchNotifications } = useNotificationStore();

  const fetchProfile = useAuthStore((state) => state.fetchProfile);

  useEffect(() => {
    fetchHomeDashboard();
    fetchHomeSchemes();
    fetchNotifications();
    fetchProfile().catch(() => {});
    const loadData = async () => {
      setIndexIsLoading(true);
      await Promise.all([fetchDashboardData(), fetchBannersData(), fetchCmsData(), fetchBadgeCabinet()]);
      setIndexIsLoading(false);
    };
    loadData();
  }, []);

  const onRefresh = React.useCallback(async () => {
    setRefreshing(true);
    fetchProfile().catch(() => {});
    await Promise.all([fetchHomeDashboard(), fetchHomeSchemes(), fetchDashboardData(), fetchBannersData(), fetchCmsData()]);
    fetchNotifications();
    setRefreshing(false);
  }, []);

  // Partner Hub Modal State
  const [partnerHubVisible, setPartnerHubVisible] = useState(false);
  const [partnerHubTab, setPartnerHubTab] = useState<PartnerHubTab>('land');

  const openPartnerHub = (tab: PartnerHubTab) => {
    setPartnerHubTab(tab);
    setPartnerHubVisible(true);
  };

  // Success Overlay milestone state
  const [successVisible, setSuccessVisible] = useState(false);
  const [successData, setSuccessData] = useState({
    title: '',
    message: '',
    reward: '',
    icon: 'check-decagram'
  });

  // Season & Pulse System States
  const [season, setSeason] = useState<SeasonType>('Plantation');

  const pulseRingScale1 = useRef(new Animated.Value(1)).current;
  const pulseRingScale2 = useRef(new Animated.Value(1)).current;
  const pulseRingOpacity1 = useRef(new Animated.Value(0.8)).current;
  const pulseRingOpacity2 = useRef(new Animated.Value(0.4)).current;
  const glowAnim = useRef(new Animated.Value(0.35)).current;

  useEffect(() => {
    // 1. Concentric double pulse loops for eco heartbeat
    const pulseRingAnimation = Animated.loop(
      Animated.parallel([
        Animated.sequence([
          Animated.timing(pulseRingScale1, {
            toValue: 2.2,
            duration: 2200,
            useNativeDriver: true,
          }),
          Animated.timing(pulseRingScale1, {
            toValue: 1,
            duration: 0,
            useNativeDriver: true,
          }),
        ]),
        Animated.sequence([
          Animated.timing(pulseRingOpacity1, {
            toValue: 0,
            duration: 2200,
            useNativeDriver: true,
          }),
          Animated.timing(pulseRingOpacity1, {
            toValue: 0.8,
            duration: 0,
            useNativeDriver: true,
          }),
        ]),
        Animated.sequence([
          Animated.delay(1100),
          Animated.timing(pulseRingScale2, {
            toValue: 2.2,
            duration: 2200,
            useNativeDriver: true,
          }),
          Animated.timing(pulseRingScale2, {
            toValue: 1,
            duration: 0,
            useNativeDriver: true,
          }),
        ]),
        Animated.sequence([
          Animated.delay(1100),
          Animated.timing(pulseRingOpacity2, {
            toValue: 0,
            duration: 2200,
            useNativeDriver: true,
          }),
          Animated.timing(pulseRingOpacity2, {
            toValue: 0.4,
            duration: 0,
            useNativeDriver: true,
          }),
        ]),
      ])
    );
    pulseRingAnimation.start();

    // 2. Auxiliary slow breathing glow animation for dynamic indicator bars
    const pulseGlow = Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, {
          toValue: 0.85,
          duration: 3000,
          useNativeDriver: true,
        }),
        Animated.timing(glowAnim, {
          toValue: 0.35,
          duration: 3000,
          useNativeDriver: true,
        }),
      ])
    );
    pulseGlow.start();

    return () => {
      pulseRingAnimation.stop();
      pulseGlow.stop();
    };
  }, [pulseRingScale1, pulseRingScale2, pulseRingOpacity1, pulseRingOpacity2, glowAnim]);

  const apiJourney = dashboardData?.journey?.map((step: any) => {
    let status = 'Locked';
    if (step.status?.toLowerCase() === 'completed') status = 'Completed';
    else if (step.status?.toLowerCase() === 'active') status = 'Active';

    let detail = '';
    if (step.id === 'step_registered') detail = "You registered successfully on India's carbon super app!";
    else if (step.id === 'step_kyc') detail = 'Aadhaar mapping and land title documents verified.';
    else if (step.id === 'step_land') detail = 'Plot #103 verified by drone scan.';
    else if (step.id === 'step_plantation') detail = 'Saplings registered in the global scheduler.';
    else if (step.id === 'step_family') detail = '5 trees grouped into a Carbon Sponge Family unit, yielding ₹1,000 milestones.';
    else if (step.id === 'step_score') detail = 'Live soil NPK indicators and organic density tracking.';
    else if (step.id === 'step_carbon') detail = 'Requires active zero-tillage field compliance.';
    else if (step.id === 'step_community') detail = 'Share boundary saplings metrics with Bhopal block.';
    else if (step.id === 'step_leader') detail = 'Verify over 150 boundary trees and zero-tillage practices.';

    return {
      id: step.step_number || 1,
      title: step.name,
      desc: step.description,
      status: status,
      detail: detail
    };
  });

  const JOURNEY_STAGES = apiJourney && apiJourney.length > 0 ? apiJourney : [
    { id: 1, title: 'Farmer Registered', desc: 'Welcome to BhumiCred network.', status: 'Completed', detail: 'You registered successfully on India\'s carbon super app!' },
    { id: 2, title: 'KYC Verified', desc: 'Secure aadhaar mapping active.', status: 'Completed', detail: 'Aadhaar mapping and land title documents verified.' },
    { id: 3, title: 'Land Approved', desc: 'Satellite scanning baseline set.', status: 'Completed', detail: 'Plot #103 verified by drone scan.' },
    { id: 4, title: 'Plantation Added', desc: '30 boundary trees tag registered.', status: 'Completed', detail: 'Saplings registered in the global scheduler.' },
    { id: 5, title: 'Green Family Created', desc: 'Tree sponge units active.', status: 'Completed', detail: '5 trees grouped into a Carbon Sponge Family unit, yielding ₹1,000 milestones.' },
    { id: 6, title: 'Sustainability Score Active', desc: 'Current: 85/100 score.', status: 'Active', detail: 'Live soil NPK indicators and organic density tracking.' },
    { id: 7, title: 'Carbon Program Joined', desc: 'Zero-tillage program locked.', status: 'Locked', detail: 'Requires active zero-tillage field compliance.' },
    { id: 8, title: 'Community Contributor', desc: 'Help 3 neighbours register.', status: 'Locked', detail: 'Share boundary saplings metrics with Bhopal block.' },
    { id: 9, title: 'Sustainability Leader', desc: 'Achieve District Rank #1.', status: 'Locked', detail: 'Verify over 150 boundary trees and zero-tillage practices.' },
  ];

  const apiMilestones = dashboardData?.milestones?.map((m: any) => {
    let icon = 'leaf';
    let iconColor = COLORS.primaryLight;
    let bgColor = '#F8FAFC';

    if (m.badge_type === 'npk_active') {
      icon = 'check-decagram';
      iconColor = '#10B981';
      bgColor = '#ECFDF5';
    } else if (m.badge_type === 'subsidies') {
      icon = 'sprout';
      iconColor = '#059669';
      bgColor = '#F0FDF4';
    } else if (m.badge_type === 'biomass') {
      icon = 'forest';
      iconColor = '#D97706';
      bgColor = '#FFFBEB';
    } else if (m.badge_type === 'cash') {
      icon = 'wallet-giftcard';
      iconColor = '#E11D48';
      bgColor = '#FFF1F2';
    }

    return {
      id: m.id,
      title: m.title,
      story: m.subtitle || '',
      desc: m.description || '',
      time: m.time_ago,
      icon,
      iconColor,
      bgColor,
      impact: m.badge_text || '',
    };
  });

  const MILESTONES_LIST = apiMilestones && apiMilestones.length > 0 ? apiMilestones : [
    {
      id: 'act1',
      type: 'land',
      title: 'First Land Verified 🌱',
      story: 'Bhopal Rural Plot #103. Mapped successfully.',
      desc: 'Your soil baseline is certified, breathing clean oxygen for 12 local families.',
      time: '2 hours ago',
      icon: 'check-decagram',
      iconColor: '#10B981',
      bgColor: '#ECFDF5',
      impact: 'Baseline NPK Active',
    },
    {
      id: 'act2',
      type: 'plantation',
      title: 'First Plantation Added 🌳',
      story: '30 Border Saplings registered.',
      desc: 'Saplings mapped successfully! These growth nodes will generate ₹4,000 yearly carbon payouts as they mature.',
      time: 'Yesterday',
      icon: 'sprout',
      iconColor: '#059669',
      bgColor: '#F0FDF4',
      impact: 'Subsidies Scheduled',
    },
    {
      id: 'act3',
      type: 'family',
      title: 'First Green Family Created 🌿',
      story: 'Sponge units mapped by drone scan.',
      desc: '5 trees grouped into a Carbon Sponge Family unit, yielding ₹1,000 milestones.',
      time: '3 days ago',
      icon: 'forest',
      iconColor: '#D97706',
      bgColor: '#FFFBEB',
      impact: '1.5x Biomass Bonus',
    },
    {
      id: 'act4',
      type: 'wallet',
      title: 'First Carbon Payout claimed 💰',
      story: 'Direct payout completed.',
      desc: '₹1,250 reward claimed. Sustainable zero-tillage boundary agriculture is paying off.',
      time: '5 days ago',
      icon: 'wallet-giftcard',
      iconColor: '#E11D48',
      bgColor: '#FFF1F2',
      impact: '₹1,250 direct cash',
    },
  ];

  const handleStagePress = (stage: any) => {
    Alert.alert(
      stage.title,
      `${stage.detail}\n\nStatus: ${stage.status === 'Completed' ? '✅ Unlocked & Active' : stage.status === 'Active' ? '⚡ Current Active Stage' : '🔒 Locked - Complete active milestones to unlock'}`
    );
  };

  useEffect(() => {
    const successSub = DeviceEventEmitter.addListener('onRegistrySuccess', (data: any) => {
      setSuccessData({
        title: data?.title || 'Milestone Unlocked! 🎉',
        message: data?.message || 'Verification completed successfully.',
        reward: data?.reward || 'Captured 250 kg CO₂e',
        icon: data?.icon || 'check-decagram'
      });
      setSuccessVisible(true);
    });
    return () => {
      successSub.remove();
    };
  }, []);

  // Zustand states
  const user = useAuthStore((state) => state.user);
  const role = useAuthStore((state) => state.role);
  const plots = useLandStore((state) => state.plots);
  const totalCredits = user?.carbonCreditsGenerated ?? 0;
  const activeProjectsCount = useCarbonStore((state) => state.projects.filter(p => p.joined).length);
  const greenFamily = useInsuranceStore((state) => state.greenFamily);
  const walletBalance = useWalletStore((state) => state.balance);
  const unreadNotifications = useNotificationStore((state) => state.notifications.filter(n => !n.read).length);

  // Computed total stats
  const totalLandAcres = plots.reduce((sum, plot) => sum + (plot.status === 'Approved' ? plot.acres : 0), 0);
  const ecoScore = dashboardData?.overview?.eco_index ?? user?.sustainability_score ?? greenFamily?.score ?? 0;
  const ecoChangePercent = dashboardData?.overview?.eco_index_change_percent ?? 0;
  const totalCreditsVal = dashboardData?.overview?.co2_captures ?? totalCredits;
  const districtGreenRankVal = dashboardData?.overview?.district_green_rank ?? 1;
  const walletBalanceVal = dashboardData?.overview?.wallet_balance ?? walletBalance;

  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [selectedLocation, setSelectedLocation] = useState<string>(() => formatFarmerLocation(user));
  const [isLocationPickerOpen, setLocationPickerOpen] = useState<boolean>(false);

  // Keep the displayed location in sync with the farmer's profile (city, state),
  // so it reflects updates made via the existing profile refresh flow.
  useEffect(() => {
    setSelectedLocation(formatFarmerLocation(user));
  }, [user?.city, user?.state]);
  const [isBotVisible, setBotVisible] = useState<boolean>(false);
  const [isNotificationOpen, setNotificationOpen] = useState<boolean>(false);
  
  const [dashboardSearchQuery, setDashboardSearchQuery] = useState('');
  const [selectedPlotForTracking, setSelectedPlotForTracking] = useState<any>(null);
  const [trackingModalVisible, setTrackingModalVisible] = useState(false);
  
  // Journey S-Curve Dimension hooks
  const [journeyWidth, setJourneyWidth] = useState(width - 32 - 40);

  const getJourneyPath9 = () => {
    const xLeft = 32;
    const xMid = journeyWidth / 2;
    const xRight = journeyWidth - 32;
    const Y1 = 30;
    const Y2 = 90;
    const Y3 = 150;
    const Y4 = 210;
    const Y5 = 270;
    const Y6 = 330;
    const Y7 = 390;
    const Y8 = 450;
    const Y9 = 510;

    return `
      M ${xLeft} ${Y1}
      C ${xLeft} ${Y1 + 30}, ${xMid - 30} ${Y2 - 30}, ${xMid} ${Y2}
      C ${xMid + 30} ${Y2 + 30}, ${xRight} ${Y3 - 30}, ${xRight} ${Y3}
      L ${xRight} ${Y4}
      C ${xRight} ${Y4 + 30}, ${xMid + 30} ${Y5 - 30}, ${xMid} ${Y5}
      C ${xMid - 30} ${Y5 + 30}, ${xLeft} ${Y6 - 30}, ${xLeft} ${Y6}
      L ${xLeft} ${Y7}
      C ${xLeft} ${Y7 + 30}, ${xMid - 30} ${Y8 - 30}, ${xMid} ${Y8}
      C ${xMid + 30} ${Y8 + 30}, ${xRight} ${Y9 - 30}, ${xRight} ${Y9}
    `;
  };

  const getStageCoords = (index: number) => {
    const xLeft = 32;
    const xMid = journeyWidth / 2;
    const xRight = journeyWidth - 32;

    const Ys = [30, 90, 150, 210, 270, 330, 390, 450, 510];
    const Xs = [xLeft, xMid, xRight, xRight, xMid, xLeft, xLeft, xMid, xRight];

    return { left: Xs[index], top: Ys[index] };
  };

  // Hero carousel scrolling hooks
  const LOCAL_BANNER_ASSETS: Record<string, any> = {
    '/banners/solar_irrigation.jpg': require('../../assets/banners/solar_irrigation.jpg'),
    '/banners/bio_fertilizer.jpg': require('../../assets/banners/bio_fertilizer.jpg'),
    '/banners/monsoon_reforestation.jpg': require('../../assets/banners/monsoon_reforestation.jpg'),
    'solar_irrigation.jpg': require('../../assets/banners/solar_irrigation.jpg'),
    'bio_fertilizer.jpg': require('../../assets/banners/bio_fertilizer.jpg'),
    'monsoon_reforestation.jpg': require('../../assets/banners/monsoon_reforestation.jpg'),
  };

  const resolveBannerSource = (url: string | undefined) => {
    if (!url) return require('../../assets/banners/solar_irrigation.jpg');
    if (LOCAL_BANNER_ASSETS[url]) {
      return LOCAL_BANNER_ASSETS[url];
    }
    const cleanKey = url.split('/').pop() || '';
    if (LOCAL_BANNER_ASSETS[cleanKey]) {
      return LOCAL_BANNER_ASSETS[cleanKey];
    }
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return { uri: url };
    }
    return { uri: `${API_ROOT_URL}${url.startsWith('/') ? '' : '/'}${url}` };
  };

  const [activeHeroIndex, setActiveHeroIndex] = useState(0);
  const heroFlatListRef = useRef<FlatList>(null);
  const heroTimerRef = useRef<any>(null);

  const heroData = apiBanners
    .filter((b: any) => b.is_active !== false)
    .sort((a: any, b: any) => (a.priority || 999) - (b.priority || 999));

  const heroDataRef = useRef(heroData);
  useEffect(() => {
    heroDataRef.current = heroData;
    if (activeHeroIndex >= heroData.length) {
      setActiveHeroIndex(0);
      if (heroData.length > 0) {
        heroFlatListRef.current?.scrollToIndex({ index: 0, animated: false });
      }
    }
  }, [heroData]);

  const startHeroTimer = () => {
    stopHeroTimer();
    heroTimerRef.current = setInterval(() => {
      setActiveHeroIndex((prevIndex) => {
        const length = heroDataRef.current.length;
        if (length === 0) return prevIndex;

        const nextIndex = (prevIndex + 1) % length;
        if (nextIndex >= 0 && nextIndex < length) {
          heroFlatListRef.current?.scrollToIndex({
            index: nextIndex,
            animated: true,
          });
        }
        return nextIndex;
      });
    }, 4000);
  };

  const stopHeroTimer = () => {
    if (heroTimerRef.current) {
      clearInterval(heroTimerRef.current);
      heroTimerRef.current = null;
    }
  };

  const onHeroScrollToIndexFailed = (info: { index: number; highestMeasuredFrameIndex: number; averageItemLength: number }) => {
    const length = heroDataRef.current.length;
    if (length === 0) return;
    const safeIndex = Math.min(info.index, length - 1);
    setTimeout(() => {
      heroFlatListRef.current?.scrollToIndex({ index: safeIndex, animated: true });
    }, 100);
  };

  const getHeroItemLayout = (_: any, index: number) => ({
    length: width,
    offset: width * index,
    index,
  });

  useEffect(() => {
    startHeroTimer();
    return () => stopHeroTimer();
  }, []);

  const onHeroViewableItemsChanged = useRef(({ viewableItems }: any) => {
    if (viewableItems && viewableItems.length > 0) {
      setActiveHeroIndex(viewableItems[0].index || 0);
    }
  }).current;

  const heroViewabilityConfig = useRef({
    itemVisiblePercentThreshold: 50
  }).current;

  // Drawer Animated states
  const [isDrawerVisible, setDrawerVisible] = useState(false);
  const slideAnim = useRef(new Animated.Value(-width * 0.75)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  const openDrawer = () => {
    setDrawerVisible(true);
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const closeDrawer = (callback?: () => void) => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: -width * 0.75,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setDrawerVisible(false);
      if (callback) callback();
    });
  };

  const handleDrawerNavigation = (path: string) => {
    closeDrawer(() => {
      router.push(path as any);
    });
  };

  return (
    <AmbientEcoBackground style={styles.container} season={season}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />

      {/* Premium Sticky TopAppBar */}
      <View style={[styles.stickyHeader, { paddingTop: insets.top > 0 ? insets.top + 10 : (Platform.OS === 'ios' ? 50 : 16) }]}>
        <TouchableOpacity style={styles.hamburgerBtn} onPress={openDrawer}>
          <MaterialCommunityIcons name="menu" size={24} color={COLORS.textLight} />
        </TouchableOpacity>
        {/* Centered Profile Avatar & Brand Title */}
        <TouchableOpacity 
          style={styles.brandContainer} 
          onPress={() => router.push('/(tabs)/profile' as any)}
          activeOpacity={0.8}
        >
          <View style={styles.headerAvatarWrapper}>
            {user?.farmerPhoto ? (
              <Image source={{ uri: user.farmerPhoto }} style={styles.headerAvatarImg} />
            ) : (
              <MaterialCommunityIcons name="account-circle" size={22} color={COLORS.accent} />
            )}
          </View>
          <Text style={styles.brandTitle}>BhumiCred</Text>
        </TouchableOpacity>

        <View style={styles.headerRight}>
          <TouchableOpacity
            style={[
              styles.connectivityPill,
              isOnline ? styles.connectivityOnline : styles.connectivityOffline
            ]}
            onPress={toggleOnline}
            activeOpacity={0.8}
          >
            <MaterialCommunityIcons
              name={isOnline ? "wifi" : "wifi-off"}
              size={12}
              color={isOnline ? "#84CC16" : "#EF4444"}
              style={{ marginRight: 4 }}
            />
            <Text style={[
              styles.connectivityPillText,
              { color: isOnline ? "#84CC16" : "#EF4444" }
            ]}>
              {isOnline ? "Online" : "Offline"}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.iconBtn, { marginRight: 6, marginLeft: 6 }]} onPress={() => setBotVisible(true)}>
            <MaterialCommunityIcons name="robot-outline" size={22} color={COLORS.textLight} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.iconBtn} onPress={() => router.push('/notifications')}>
            <MaterialCommunityIcons name="bell-outline" size={22} color={COLORS.textLight} />
            {unreadNotifications > 0 && (
              <View style={styles.cartBadge}>
                <Text style={styles.cartBadgeText}>{unreadNotifications}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>

      <NotificationDropdown 
        visible={isNotificationOpen} 
        onClose={() => setNotificationOpen(false)} 
      />

      <ScrollView 
        style={styles.mainScrollView}
        contentContainerStyle={styles.scrollContent} 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh} 
            tintColor={COLORS.primaryLight} 
            colors={[COLORS.primaryLight]} 
          />
        }
      >
        {/* Banner with Greeting & Location */}
        <View style={styles.headerBanner}>
          <View style={styles.bannerRow}>
            <View style={styles.greetingBox}>
              <Text style={styles.greetingText}>
                {role === 'govt_body' 
                  ? 'Welcome, Govt Representative' 
                  : role === 'partner' 
                    ? 'Welcome, Ecosystem Partner' 
                    : t('dashboard.greeting', { name: user?.fullName || '' })}
              </Text>
              <TouchableOpacity
                style={styles.locationRow}
                activeOpacity={0.8}
                onPress={() => setLocationPickerOpen(true)}
              >
                <MaterialCommunityIcons name="map-marker-outline" size={14} color={COLORS.accent} />
                <Text style={styles.locationText} numberOfLines={1}>{selectedLocation}</Text>
                <MaterialCommunityIcons name="chevron-down" size={16} color={COLORS.textLight} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Search Field */}
          <View style={styles.searchBarContainer}>
            <View style={styles.searchBarBox}>
              <MaterialCommunityIcons name="magnify" size={20} color="#64748B" style={{ marginRight: 8 }} />
              <TextInput
                style={styles.searchBarInput}
                placeholder="Search lands, carbon projects, products..."
                placeholderTextColor="#94A3B8"
                value={dashboardSearchQuery}
                onChangeText={(text) => setDashboardSearchQuery(text)}
              />
            </View>
          </View>

        {role === 'govt_body' && (
          <GovtBodyDashboardView />
        )}

        {(role === 'partner') && (
          <View style={{ paddingHorizontal: 4, marginTop: 16 }}>
            {/* Top Metrics Grid */}
            <View style={styles.partnerMetricsBlock}>
              <Text style={styles.partnerSectionTitle}>Partner Dashboard Metrics</Text>

              <View style={styles.partnerGridRow}>
                <View style={styles.partnerMetricCard}>
                  <MaterialCommunityIcons name="chart-areaspline" size={24} color={COLORS.primary} />
                  <Text style={styles.partnerMetricValue}>12</Text>
                  <Text style={styles.partnerMetricLabel}>Total Projects</Text>
                </View>

                <View style={styles.partnerMetricCard}>
                  <MaterialCommunityIcons name="account-group" size={24} color="#0284C7" />
                  <Text style={styles.partnerMetricValue}>4</Text>
                  <Text style={styles.partnerMetricLabel}>Assigned Farmers</Text>
                </View>
              </View>

              <View style={styles.partnerGridRow}>
                <View style={styles.partnerMetricCard}>
                  <MaterialCommunityIcons name="map-marker-path" size={24} color="#16A34A" />
                  <Text style={styles.partnerMetricValue}>124.5</Text>
                  <Text style={styles.partnerMetricLabel}>Total Acres</Text>
                </View>

                <View style={styles.partnerMetricCard}>
                  <MaterialCommunityIcons name="leaf" size={24} color="#0F766E" />
                  <Text style={styles.partnerMetricValue}>1,850</Text>
                  <Text style={styles.partnerMetricLabel}>Carbon Credits</Text>
                </View>
              </View>

              <View style={styles.partnerGridRow}>
                <View style={styles.partnerMetricCard}>
                  <MaterialCommunityIcons name="wallet-outline" size={24} color="#D97706" />
                  <Text style={styles.partnerMetricValue}>₹1,45,000</Text>
                  <Text style={styles.partnerMetricLabel}>Earnings</Text>
                </View>

                <View style={styles.partnerMetricCard}>
                  <MaterialCommunityIcons name="clipboard-alert-outline" size={24} color="#DC2626" />
                  <Text style={styles.partnerMetricValue}>3</Text>
                  <Text style={styles.partnerMetricLabel}>Pending Tasks</Text>
                </View>
              </View>
            </View>

            {/* Quick Access Services & Tools */}
            <View style={styles.partnerServicesBlock}>
              <Text style={styles.partnerSectionTitle}>More Services & Tools</Text>

              <View style={styles.servicesGrid}>
                <TouchableOpacity
                  style={styles.serviceItem}
                  activeOpacity={0.85}
                  onPress={() => openPartnerHub('land')}
                >
                  <View style={[styles.serviceIconCircle, { backgroundColor: '#DCFCE7' }]}>
                    <MaterialCommunityIcons name="map-marker-path" size={22} color="#16A34A" />
                  </View>
                  <Text style={styles.serviceItemTitle}>Land & GIS</Text>
                  <Text style={styles.serviceItemSub}>Map & Polygons</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.serviceItem}
                  activeOpacity={0.85}
                  onPress={() => openPartnerHub('mrv')}
                >
                  <View style={[styles.serviceIconCircle, { backgroundColor: '#FEF3C7' }]}>
                    <MaterialCommunityIcons name="eye-check-outline" size={22} color="#D97706" />
                  </View>
                  <Text style={styles.serviceItemTitle}>MRV Status</Text>
                  <Text style={styles.serviceItemSub}>Field Audits</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.serviceItem}
                  activeOpacity={0.85}
                  onPress={() => openPartnerHub('carbon')}
                >
                  <View style={[styles.serviceIconCircle, { backgroundColor: '#ECFDF5' }]}>
                    <MaterialCommunityIcons name="leaf" size={22} color={COLORS.primary} />
                  </View>
                  <Text style={styles.serviceItemTitle}>Carbon Credits</Text>
                  <Text style={styles.serviceItemSub}>Ledger & Sales</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.serviceItem}
                  activeOpacity={0.85}
                  onPress={() => openPartnerHub('documents')}
                >
                  <View style={[styles.serviceIconCircle, { backgroundColor: '#E0F2FE' }]}>
                    <MaterialCommunityIcons name="file-multiple-outline" size={22} color="#0284C7" />
                  </View>
                  <Text style={styles.serviceItemTitle}>Documents</Text>
                  <Text style={styles.serviceItemSub}>Company Vault</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.serviceItem}
                  activeOpacity={0.85}
                  onPress={() => openPartnerHub('notifications')}
                >
                  <View style={[styles.serviceIconCircle, { backgroundColor: '#F1F5F9' }]}>
                    <MaterialCommunityIcons name="bell-ring-outline" size={22} color="#475569" />
                  </View>
                  <Text style={styles.serviceItemTitle}>Notifications</Text>
                  <Text style={styles.serviceItemSub}>Updates & Alerts</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.serviceItem}
                  activeOpacity={0.85}
                  onPress={() => openPartnerHub('support')}
                >
                  <View style={[styles.serviceIconCircle, { backgroundColor: '#FAE8FF' }]}>
                    <MaterialCommunityIcons name="headphones" size={22} color="#A21CAF" />
                  </View>
                  <Text style={styles.serviceItemTitle}>Support</Text>
                  <Text style={styles.serviceItemSub}>Helpdesk & Chat</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}
        </View>

        {/* Top Live Sustainability Meter Dashboard Overlay */}
        <View style={styles.metersDashboard}>
          <View style={styles.metersDashboardRow}>
            {/* Left Circular Meter Index */}
            <View style={styles.circularMeterCol}>
              <View style={styles.meterGlowRing}>
                <LinearGradient colors={['#84CC16', '#10B981']} style={styles.meterProgressCircle}>
                  <View style={styles.innerMeterCircle}>
                    {isLoading ? (
                      <SkeletonBase style={{ width: 44, height: 20, borderRadius: 4 }} />
                    ) : (
                      <Text style={styles.meterScoreText}>{ecoScore}</Text>
                    )}
                    <Text style={styles.meterSubLabel}>Eco Index</Text>
                  </View>
                </LinearGradient>
              </View>
              <View style={styles.meterTrendRow}>
                <MaterialCommunityIcons
                  name={ecoChangePercent >= 0 ? "trending-up" : "trending-down"}
                  size={14}
                  color={ecoChangePercent >= 0 ? "#22C55E" : "#EF4444"}
                  style={{ marginRight: 4 }}
                />
                <Text style={styles.meterTrendText}>
                  {ecoChangePercent >= 0 ? `+${ecoChangePercent}%` : `${ecoChangePercent}%`} this month
                </Text>
              </View>
            </View>

            {/* Right Quick Stats Grid */}
            <View style={styles.rightStatsGrid}>
              <View style={styles.rightStatRow}>
                <MaterialCommunityIcons name="molecule-co2" size={18} color={COLORS.primary} style={{ marginRight: 8 }} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.rightStatLabel}>CO₂  Captures</Text>
                  {isLoading ? (
                    <SkeletonBase style={{ width: '60%', height: 12, marginTop: 4 }} />
                  ) : (
                    <Text style={styles.rightStatValue}>{Number(totalCreditsVal).toFixed(1)} CO₂e</Text>
                  )}
                </View>
              </View>

              <View style={styles.rightStatRow}>
                <MaterialCommunityIcons name="trophy-outline" size={18} color="#D97706" style={{ marginRight: 8 }} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.rightStatLabel}>District  Green  Rank</Text>
                  {isLoading ? (
                    <SkeletonBase style={{ width: '40%', height: 12, marginTop: 4 }} />
                  ) : (
                    <Text style={[styles.rightStatValue, { color: '#D97706' }]}>Rank #{districtGreenRankVal}</Text>
                  )}
                </View>
              </View>

              <View style={styles.rightStatRow}>
                <MaterialCommunityIcons name="wallet-outline" size={18} color="#0D9488" style={{ marginRight: 8 }} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.rightStatLabel}>Eco  Wallet  Balance</Text>
                  {isLoading ? (
                    <SkeletonBase style={{ width: '80%', height: 12, marginTop: 4 }} />
                  ) : (
                    <Text style={styles.rightStatValue}>₹{walletBalanceVal}</Text>
                  )}
                </View>
              </View>
            </View>
          </View>

          {/* Contextual CTA on Hero Card */}
          <TouchableOpacity
            style={styles.heroCtaBtn}
            onPress={() => {
              const latestPlot = plots[0];
              if (!latestPlot) {
                DeviceEventEmitter.emit('openGlobalScheduler');
              } else if (latestPlot.status !== 'Verified' && latestPlot.status !== 'Approved') {
                setSelectedPlotForTracking(latestPlot);
                setTrackingModalVisible(true);
              } else {
                router.push('/(tabs)/projects' as any);
              }
            }}
            activeOpacity={0.85}
          >
            <MaterialCommunityIcons name="leaf" size={14} color="#FFFFFF" style={{ marginRight: 6 }} />
            <Text style={styles.heroCtaText}>
              {!plots.length 
                ? 'Register Your First Land 🚜' 
                : plots[0].status !== 'Verified' && plots[0].status !== 'Approved'
                  ? 'Track Land Verification ⏳'
                  : 'Enroll in Carbon Program 🌿'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Carousel Slider */}
        {heroData.length > 0 && (
          <View style={styles.heroCarouselSection}>
            {isLoading ? (
              <SkeletonBase style={{ width: width - 40, aspectRatio: 3, alignSelf: 'center', borderRadius: 20 }} />
            ) : (
              <>
                <FlatList
                  ref={heroFlatListRef}
                  data={heroData}
                  horizontal
                  pagingEnabled
                  showsHorizontalScrollIndicator={false}
                  keyExtractor={(item, index) => item.id || String(index)}
                  onViewableItemsChanged={onHeroViewableItemsChanged}
                  viewabilityConfig={heroViewabilityConfig}
                  onScrollBeginDrag={stopHeroTimer}
                  onScrollEndDrag={startHeroTimer}
                  onScrollToIndexFailed={onHeroScrollToIndexFailed}
                  getItemLayout={getHeroItemLayout}
                  renderItem={({ item }) => {
                    const rawUrl = item.image_url || item.imageUrl;
                    const bannerSource = resolveBannerSource(rawUrl);
                    return (
                      <View style={styles.heroSlideWrapper}>
                        <TouchableOpacity
                          activeOpacity={0.95}
                          onPress={() => item.link_url ? router.push(item.link_url as any) : null}
                          style={styles.heroSlide}
                        >
                          <Image
                            source={bannerSource}
                            style={styles.heroImage}
                            resizeMode="stretch"
                          />
                        </TouchableOpacity>
                      </View>
                    );
                  }}
                />
                <View style={styles.heroDotsRow}>
                  {heroData.map((_, idx) => (
                    <View
                      key={idx}
                      style={[
                        styles.heroDot,
                        activeHeroIndex === idx && styles.heroDotActive
                      ]}
                    />
                  ))}
                </View>
              </>
            )}
          </View>
        )}

        {/* Quick Actions Panel */}
        <View style={styles.quickActionsContainer}>
          <Text style={styles.sectionTitle}>{t('dashboard.quick_actions')}</Text>
          <View style={styles.quickActionsGrid}>
            {/* 1. Add Land */}
            <TouchableOpacity style={styles.actionPill} onPress={() => DeviceEventEmitter.emit('openGlobalScheduler')}>
              <View style={[styles.actionIconBox, { backgroundColor: '#DCFCE7' }]}>
                <MaterialCommunityIcons name="map-marker-plus" size={26} color="#16A34A" />
              </View>
              <Text style={styles.actionLabel}>Add Land</Text>
            </TouchableOpacity>

            {/* 2. Tree Insurance */}
            <TouchableOpacity style={styles.actionPill} onPress={() => router.push('/insurance' as any)}>
              <View style={[styles.actionIconBox, { backgroundColor: '#ECFDF5' }]}>
                <MaterialCommunityIcons name="tree" size={26} color="#059669" />
              </View>
              <Text style={styles.actionLabel}>Tree Insurance</Text>
            </TouchableOpacity>

            {/* 3. My Projects */}
            <TouchableOpacity style={styles.actionPill} onPress={() => router.push('/(tabs)/projects' as any)}>
              <View style={[styles.actionIconBox, { backgroundColor: '#E0F2FE' }]}>
                <MaterialCommunityIcons name="molecule-co2" size={28} color="#0284C7" />
              </View>
              <Text style={styles.actionLabel}>My Projects</Text>
            </TouchableOpacity>

            {/* 4. Soil Testing */}
            <TouchableOpacity style={styles.actionPill} onPress={() => router.push('/soil-testing' as any)}>
              <View style={[styles.actionIconBox, { backgroundColor: '#F3E8FF' }]}>
                <MaterialCommunityIcons name="test-tube" size={26} color="#7C3AED" />
              </View>
              <Text style={styles.actionLabel}>Soil Testing</Text>
            </TouchableOpacity>

            {/* 5. Marketplace */}
            <TouchableOpacity style={styles.actionPill} onPress={() => router.push('/(tabs)/marketplace' as any)}>
              <View style={[styles.actionIconBox, { backgroundColor: '#FEF3C7' }]}>
                <MaterialCommunityIcons name="storefront-outline" size={26} color="#D97706" />
              </View>
              <Text style={styles.actionLabel}>Marketplace</Text>
            </TouchableOpacity>

            {/* 6. Track Assets */}
            <TouchableOpacity 
              style={styles.actionPill} 
              onPress={() => {
                const latestPlot = plots[0];
                if (latestPlot) {
                  setSelectedPlotForTracking(latestPlot);
                  setTrackingModalVisible(true);
                } else {
                  Alert.alert('Track Assets', 'No land plots registered yet. Register a plot to track verification status.');
                }
              }}
            >
              <View style={[styles.actionIconBox, { backgroundColor: '#FFE4E6' }]}>
                <MaterialCommunityIcons name="radar" size={26} color="#E11D48" />
              </View>
              <Text style={styles.actionLabel}>Track Assets</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Wallet / Earnings Card */}
        <TouchableOpacity 
          style={styles.walletCardContainer}
          activeOpacity={0.9}
          onPress={() => router.push('/(tabs)/wallet' as any)}
        >
          <LinearGradient
            colors={['#0F766E', '#115E59']}
            style={styles.walletCardGrad}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <View style={styles.walletCardHeader}>
              <View>
                <Text style={styles.walletCardTitle}>Eco Earnings Wallet</Text>
                <Text style={styles.walletCardSubtitle}>Carbon Payouts & Subsidies</Text>
              </View>
              <MaterialCommunityIcons name="wallet-outline" size={28} color="#FFFFFF" />
            </View>
            <View style={styles.walletCardAmountRow}>
              <Text style={styles.walletCardSymbol}>₹</Text>
              <Text style={styles.walletCardAmount}>{walletBalanceVal}</Text>
            </View>
            <View style={styles.walletCardFooter}>
              <Text style={styles.walletWithdrawLink}>Withdraw Funds & View Ledger</Text>
              <MaterialCommunityIcons name="arrow-right" size={16} color="#FFFFFF" />
            </View>
          </LinearGradient>
        </TouchableOpacity>

        {/* Application / Project Timeline Card */}
        <View style={styles.timelineCard}>
          <Text style={styles.timelineCardTitle}>Land Verification & Enrollment</Text>
          {plots.length === 0 ? (
            <View style={styles.timelineEmpty}>
              <MaterialCommunityIcons name="information-outline" size={20} color="#64748B" style={{ marginRight: 8 }} />
              <Text style={styles.timelineEmptyText}>No active registrations. Get started with Add Land.</Text>
            </View>
          ) : (
            <View style={styles.timelineFlow}>
              {[
                { label: 'GIS Geofence', status: 'done', icon: 'map-marker-radius' },
                { label: 'Soil Baseline', status: plots[0].status === 'Verified' || plots[0].status === 'Approved' || plots[0].status === 'Project Assigned' || plots[0].status === 'Auditing' ? 'done' : 'current', icon: 'test-tube' },
                { label: 'Admin Approval', status: plots[0].status === 'Verified' || plots[0].status === 'Approved' || plots[0].status === 'Project Assigned' ? 'done' : 'pending', icon: 'check-decagram' },
                { label: 'Enrolled Program', status: plots[0].status === 'Project Assigned' ? 'done' : 'pending', icon: 'leaf' },
              ].map((step, idx) => {
                const isDone = step.status === 'done';
                const isCurrent = step.status === 'current';
                return (
                  <View key={idx} style={styles.timelineStepItem}>
                    <View style={[
                      styles.timelineNode,
                      isDone && styles.timelineNodeDone,
                      isCurrent && styles.timelineNodeCurrent
                    ]}>
                      <MaterialCommunityIcons 
                        name={step.icon as any} 
                        size={16} 
                        color={isDone ? '#FFFFFF' : isCurrent ? COLORS.primary : '#94A3B8'} 
                      />
                    </View>
                    <Text style={[
                      styles.timelineNodeLabel,
                      isDone && styles.timelineNodeLabelDone,
                      isCurrent && styles.timelineNodeLabelCurrent
                    ]}>
                      {step.label}
                    </Text>
                  </View>
                );
              })}
            </View>
          )}
          {plots.length > 0 && (
            <TouchableOpacity 
              style={styles.timelineTrackLink}
              onPress={() => {
                setSelectedPlotForTracking(plots[0]);
                setTrackingModalVisible(true);
              }}
            >
              <Text style={styles.timelineTrackLinkText}>View Detailed Timeline Logs</Text>
              <MaterialCommunityIcons name="chevron-right" size={16} color={COLORS.primary} />
            </TouchableOpacity>
          )}
        </View>

        {/* Referral & Rewards Card */}
        <TouchableOpacity 
          style={styles.referralCard}
          activeOpacity={0.9}
          onPress={() => router.push('/referral' as any)}
        >
          <View style={styles.referralIconBox}>
            <MaterialCommunityIcons name="gift-outline" size={24} color="#E11D48" />
          </View>
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={styles.referralTitle}>Refer & Earn Rewards</Text>
            <Text style={styles.referralDesc}>
              Get ₹150 inside your Eco Wallet for every farmer you invite.
            </Text>
          </View>
          <MaterialCommunityIcons name="chevron-right" size={20} color="#94A3B8" />
        </TouchableOpacity>

        {/* Sustainability Badge Collection Shelf */}
        <View style={styles.badgeShelfSection}>
          <View style={styles.badgeShelfHeader}>
            <Text style={styles.sectionTitle}>Eco Badge Cabinet</Text>
            <TouchableOpacity onPress={() => router.push('/(tabs)/profile')}>
              <Text style={styles.viewAllText}>View Cabinet</Text>
            </TouchableOpacity>
          </View>
          {isLoading ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.badgeShimmerRow}>
              {[1, 2, 3, 4].map((i) => (
                <View key={i} style={styles.badgeShimmerCard}>
                  <SkeletonBase style={styles.badgeShimmerCircle} />
                  <SkeletonBase style={styles.badgeShimmerText} />
                </View>
              ))}
            </ScrollView>
          ) : (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.badgeScrollContent}
            >
              {(badgeCabinet && badgeCabinet.length > 0 ? badgeCabinet : [
                { id: 'badge_land_owner', title: 'Land Owner', icon: 'terrain', status: 'UNLOCKED', level: 1, unlocked_reason: 'Registered land parcel' },
                { id: 'badge_agro_hero', title: 'Agro Hero', icon: 'shovel', status: 'UNLOCKED', level: 1, unlocked_reason: 'Soil test audit ready' },
                { id: 'badge_plant_champion', title: 'Plant Champion', icon: 'tree', status: 'LOCKED', level: 0 },
                { id: 'badge_eco_networker', title: 'Eco Networker', icon: 'account-group', status: 'LOCKED', level: 0 },
                { id: 'badge_carbon_pioneer', title: 'Carbon Pioneer', icon: 'medal', status: 'LOCKED', level: 0 },
              ]).map((badge: any) => {
                const isUnlocked = badge.status === 'UNLOCKED' || badge.unlocked === true;
                const levelLabel = isUnlocked ? `LVL ${badge.level || 1}` : 'LOCKED';
                const badgeColor = isUnlocked ? '#10B981' : '#94A3B8';

                return (
                  <TouchableOpacity
                    key={badge.id || badge.badge_code}
                    style={[
                      styles.badgeCard,
                      isUnlocked ? styles.badgeUnlocked : styles.badgeLocked
                    ]}
                    activeOpacity={0.8}
                    onPress={() => Alert.alert(badge.title, `${badge.description || ''}\n\nReason: ${badge.unlocked_reason || 'Complete activity to unlock'}`)}
                  >
                    <LinearGradient
                      colors={isUnlocked ? ['#F0FDF4', '#DCFCE7'] : ['#F1F5F9', '#E2E8F0']}
                      style={styles.badgeGradient}
                    >
                      <View style={[
                        styles.badgeIconCircle,
                        { backgroundColor: isUnlocked ? '#FFFFFF' : '#CBD5E1' }
                      ]}>
                        <MaterialCommunityIcons
                          name={(badge.icon || 'sprout') as any}
                          size={20}
                          color={isUnlocked ? badgeColor : '#64748B'}
                        />
                      </View>
                      <Text style={[
                        styles.badgeCardTitle,
                        { color: isUnlocked ? COLORS.primaryDark : '#64748B' }
                      ]} numberOfLines={1}>{badge.title}</Text>
                      <View style={[
                        styles.badgeLevelBadge,
                        { backgroundColor: isUnlocked ? COLORS.primary : '#94A3B8' }
                      ]}>
                        <Text style={styles.badgeLevelText}>{levelLabel}</Text>
                      </View>
                    </LinearGradient>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          )}
        </View>

        {/* AI Advice Card slotted between header and quick actions */}
        <View style={styles.aiAdviceContainer}>
          {isLoading ? (
            <SkeletonBase style={{ width: '90%', height: 120, alignSelf: 'center', borderRadius: 16 }} />
          ) : (
            <TouchableOpacity
              style={styles.aiAdviceCard}
              onPress={() => setBotVisible(true)}
              activeOpacity={0.9}
            >
              <LinearGradient
                colors={['#022C22', '#0F766E']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.aiAdviceGrad}
              >
                <View style={styles.aiHeaderRow}>
                  <View style={styles.aiAvatar}>
                    <MaterialCommunityIcons name="robot" size={18} color="#84CC16" />
                  </View>
                  <View style={{ flex: 1, marginLeft: 10 }}>
                    <Text style={styles.aiTitle}>{dashboardRecommendation?.title || 'Bhumi Mitra AI Advice'}</Text>
                    <Text style={styles.aiTime}>• {dashboardRecommendation?.subtitle || 'Active moisture scan analysis'}</Text>
                  </View>
                  <View style={styles.aiStatusBadge}>
                    <Text style={styles.aiStatusText}>{dashboardRecommendation?.priority || 'TAP TO TALK'}</Text>
                  </View>
                </View>
                <Text style={styles.aiBodyText}>
                  &quot;{dashboardRecommendation?.message || "Your wheat field boundary segment #3 is 20% below organic biomass threshold. Planting 5 more border saplings can unlock next Green Family bonus this season."}&quot;
                </Text>
                {dashboardRecommendation?.reason && (
                  <Text style={[styles.aiBodyText, { marginTop: 4, color: '#A7F3D0', fontStyle: 'italic' }]}>
                    Reason: {dashboardRecommendation.reason}
                  </Text>
                )}
                <View style={styles.aiFooterRow}>
                  <MaterialCommunityIcons name="gesture-tap" size={12} color="#84CC16" style={{ marginRight: 4 }} />
                  <Text style={styles.aiActionLabel}>Tap to consult your simulated agricultural helper</Text>
                </View>
              </LinearGradient>
            </TouchableOpacity>
          )}
        </View>

        {/* Live Environmental Pulse System Widget */}
        {isLoading ? (
          <View style={styles.pulseCard}>
            <View style={styles.pulseHeaderRow}>
              <View style={styles.pulseIconContainer}>
                <Animated.View style={[
                  styles.pulseRing,
                  {
                    transform: [{ scale: pulseRingScale1 }],
                    opacity: pulseRingOpacity1
                  }
                ]} />
                <Animated.View style={[
                  styles.pulseRing,
                  {
                    transform: [{ scale: pulseRingScale2 }],
                    opacity: pulseRingOpacity2
                  }
                ]} />
                <View style={styles.pulseCoreDot} />
              </View>
              <View style={{ flex: 1, marginLeft: 16 }}>
                <Text style={styles.pulseTitle}>Live Environmental Pulse</Text>
                <Text style={styles.pulseSub}>Continuous satellite MRV soil carbon heartbeat</Text>
              </View>
              <View style={styles.pulseBadge}>
                <Text style={styles.pulseBadgeText}>LIVE SYNC</Text>
              </View>
            </View>
          </View>
        ) : (
          <View style={styles.pulseCard}>
            <View style={styles.pulseHeaderRow}>
              <View style={styles.pulseIconContainer}>
                <Animated.View style={[
                  styles.pulseRing,
                  {
                    transform: [{ scale: pulseRingScale1 }],
                    opacity: pulseRingOpacity1
                  }
                ]} />
                <Animated.View style={[
                  styles.pulseRing,
                  {
                    transform: [{ scale: pulseRingScale2 }],
                    opacity: pulseRingOpacity2
                  }
                ]} />
                <View style={styles.pulseCoreDot} />
              </View>
              <View style={{ flex: 1, marginLeft: 16 }}>
                <Text style={styles.pulseTitle}>Live Environmental Pulse</Text>
                <Text style={styles.pulseSub}>Continuous satellite MRV soil carbon heartbeat</Text>
              </View>
              <View style={styles.pulseBadge}>
                <Text style={styles.pulseBadgeText}>LIVE SYNC</Text>
              </View>
            </View>

            {/* Environmental Activities Grid */}
            <View style={styles.pulseActivityGrid}>
              <View style={styles.pulseActivityItem}>
                <View style={styles.pulseActivityHeader}>
                  <MaterialCommunityIcons name="solar-power" size={16} color="#EAB308" />
                  <Text style={styles.pulseActivityTitle}>Solar Energy</Text>
                </View>
                <View style={styles.pulseProgressBarBg}>
                  <Animated.View style={[
                    styles.pulseProgressBarFill,
                    {
                      width: `${cmsDashboardData?.solar_energy ?? 99}%`,
                      backgroundColor: "#EAB308",
                      opacity: glowAnim
                    }
                  ]} />
                </View>
                <Text style={styles.pulseActivityVal}>{cmsDashboardData?.solar_energy ?? 99}% Absorption</Text>
              </View>

              <View style={styles.pulseActivityItem}>
                <View style={styles.pulseActivityHeader}>
                  <MaterialCommunityIcons name="drone" size={16} color="#10B981" />
                  <Text style={styles.pulseActivityTitle}>Plantation Health</Text>
                </View>
                <View style={styles.pulseProgressBarBg}>
                  <Animated.View style={[
                    styles.pulseProgressBarFill,
                    {
                      width: `${cmsDashboardData?.plantation_health ?? 64}%`,
                      backgroundColor: "#10B981",
                      opacity: glowAnim
                    }
                  ]} />
                </View>
                <Text style={styles.pulseActivityVal}>{cmsDashboardData?.plantation_health ?? 64}% NDVI Healthy</Text>
              </View>
            </View>

            <View style={styles.pulseTickerRow}>
              <MaterialCommunityIcons name="text-box-search-outline" size={14} color={COLORS.primaryLight} style={{ marginRight: 6 }} />
              <Text style={styles.pulseTickerText} numberOfLines={1}>
                BhumiCred: Verified farmers are earning carbon credits faster than ever.
              </Text>
            </View>
          </View>
        )}

        {/* Environmental Contribution Trend Card */}
        {isLoading ? (
          <View style={[styles.trendCard, { padding: 0 }]}>
            <SkeletonBase style={{ width: '100%', height: 260, borderRadius: 24 }} />
          </View>
        ) : (
          <View style={styles.trendCard}>
            <View style={styles.trendHeader}>
              <MaterialCommunityIcons name="chart-bell-curve-cumulative" size={20} color={COLORS.primary} style={{ marginRight: 6 }} />
              <Text style={styles.trendTitle}>Environmental Trends</Text>
            </View>
            <Text style={styles.trendSub}>Continuous organic soil and border density metrics</Text>

            <View style={styles.trendMetrics}>
              <View style={styles.trendMetricRow}>
                <Text style={styles.trendMetricLabel}>Nitrogen Retention Rate</Text>
                <View style={styles.trendProgressBarBg}>
                  <View style={[styles.trendProgressBarFill, { width: `${cmsDashboardData?.nitrogen_retention_rate ?? 88}%`, backgroundColor: "#22C55E" }]} />
                </View>
                <Text style={styles.trendMetricVal}>{cmsDashboardData?.nitrogen_retention_rate ?? 88}% Excellent</Text>
              </View>

              <View style={styles.trendMetricRow}>
                <Text style={styles.trendMetricLabel}>Soil Organic Carbon (SOC)</Text>
                <View style={styles.trendProgressBarBg}>
                  <View style={[styles.trendProgressBarFill, { width: `${cmsDashboardData?.soil_organic_carbon ?? 97}%`, backgroundColor: "#0D9488", maxWidth: '100%' }]} />
                </View>
                <Text style={styles.trendMetricVal}>{cmsDashboardData?.soil_organic_carbon ?? 97}% Healthy</Text>
              </View>

              <View style={styles.trendMetricRow}>
                <Text style={styles.trendMetricLabel}>Boundary Tree Cover</Text>
                <View style={styles.trendProgressBarBg}>
                  <View style={[styles.trendProgressBarFill, { width: `${cmsDashboardData?.boundary_tree_cover ?? 62}%`, backgroundColor: "#84CC16" }]} />
                </View>
                <Text style={styles.trendMetricVal}>{cmsDashboardData?.boundary_tree_cover ?? 62}% Growing</Text>
              </View>
            </View>
          </View>
        )}

        {/* Farmer Journey Progression Map */}
        <View style={styles.journeyCard}>
          <Text style={styles.journeyTitle}>Farmer Journey Progression Map</Text>
          <Text style={styles.journeySub}>Your ecological journey to a Climate-Tech Leader</Text>

          <View
            style={[styles.timelineWrapper, { height: 560 }]}
            onLayout={(event) => {
              const { width } = event.nativeEvent.layout;
              if (width > 0) setJourneyWidth(width);
            }}
          >
            <Svg style={StyleSheet.absoluteFillObject} pointerEvents="none">
              <Path
                d={getJourneyPath9()}
                fill="none"
                stroke={COLORS.primaryLight}
                strokeWidth={2}
                strokeDasharray="6, 6"
                opacity={0.6}
              />
            </Svg>

            {JOURNEY_STAGES.map((stage: any, idx: number) => {
              const coords = getStageCoords(idx);
              const isCompleted = stage.status === 'Completed';
              const isActive = stage.status === 'Active';

              return (
                <TouchableOpacity
                  key={stage.id}
                  style={[
                    styles.journeyNode,
                    { left: coords.left - 20, top: coords.top - 20 },
                    isCompleted ? styles.nodeCompleted : isActive ? styles.nodeActive : styles.nodeLocked
                  ]}
                  onPress={() => handleStagePress(stage)}
                  activeOpacity={0.8}
                >
                  {isActive && (
                    <Animated.View style={[
                      styles.activePulseRing,
                      {
                        transform: [{ scale: pulseRingScale1 }],
                        opacity: pulseRingOpacity1
                      }
                    ]} />
                  )}
                  <MaterialCommunityIcons
                    name={isCompleted ? "check-decagram" : isActive ? "sprout" : "lock"}
                    size={16}
                    color={isCompleted ? "#FFFFFF" : isActive ? "#FFFFFF" : "#94A3B8"}
                  />

                  {/* Label text bubble */}
                  <View style={[
                    styles.nodeTextBubble,
                    coords.left < journeyWidth / 3 ? styles.bubbleRight :
                      coords.left > (journeyWidth * 2) / 3 ? styles.bubbleLeft :
                        idx % 2 === 0 ? styles.bubbleLeft : styles.bubbleRight
                  ]}>
                    <Text style={styles.nodeBubbleTitle} numberOfLines={1}>{stage.title}</Text>
                    <Text style={styles.nodeBubbleDesc} numberOfLines={1}>{stage.desc}</Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Emotional Sustainability Milestone Timeline */}
        <View style={styles.activitySection}>
          <Text style={styles.sectionTitle}>Ecosystem Milestone Timeline</Text>
          {isLoading ? (
            <View style={{ paddingHorizontal: 4 }}>
              <TimelineSkeleton />
              <TimelineSkeleton />
            </View>
          ) : (
            <View style={styles.timelineFeed}>
              {MILESTONES_LIST.map((activity: any, index: number, arr: any[]) => (
                <View key={activity.id} style={styles.activityRow}>
                  <View style={styles.activityLeft}>
                    <View style={[styles.activityIconCircle, { backgroundColor: activity.bgColor }]}>
                      <MaterialCommunityIcons name={activity.icon as any} size={18} color={activity.iconColor} />
                    </View>
                    {index < arr.length - 1 && <View style={styles.activityConnectorLine} />}
                  </View>
                  <View style={styles.activityRight}>
                    <View style={styles.activityCard}>
                      <View style={styles.activityCardHeader}>
                        <Text style={styles.activityCardTitle}>{activity.title}</Text>
                        <Text style={styles.activityCardTime}>{activity.time}</Text>
                      </View>
                      <Text style={styles.activityCardStory}>{activity.story}</Text>
                      <Text style={styles.activityCardDesc}>{activity.desc}</Text>
                      <View style={styles.impactBadge}>
                        <MaterialCommunityIcons name="molecule-co2" size={12} color={COLORS.primaryLight} style={{ marginRight: 4 }} />
                        <Text style={styles.impactBadgeText}>{activity.impact}</Text>
                      </View>
                    </View>
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>
        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Side Hamburger Drawer Modal */}
      <Modal
        transparent
        visible={isDrawerVisible}
        animationType="none"
        onRequestClose={() => closeDrawer()}
      >
        <View style={styles.drawerOverlay}>
          <Pressable style={styles.drawerBackdrop} onPress={() => closeDrawer()}>
            <Animated.View style={[styles.drawerBackdropFill, { opacity: opacityAnim }]} />
          </Pressable>

          <Animated.View
            style={[
              styles.drawerContent,
              { transform: [{ translateX: slideAnim }] }
            ]}
          >
            <LinearGradient colors={[COLORS.primary, COLORS.primaryDark]} style={styles.drawerHeader}>
              <View style={styles.drawerUserBox}>
                <View style={styles.drawerAvatar}>
                  {user?.farmerPhoto ? (
                    <Image source={{ uri: user.farmerPhoto }} style={{ width: 44, height: 44, borderRadius: 22 }} />
                  ) : (
                    <Text style={styles.drawerAvatarText}>
                      {(user?.fullName?.[0] ?? '?').toUpperCase()}
                    </Text>
                  )}
                </View>
                <View style={styles.drawerUserInfo}>
                  <Text style={styles.drawerUserName}>
                    {role === 'govt_body' 
                      ? 'Govt Representative' 
                      : role === 'partner' 
                        ? 'Ecosystem Partner' 
                        : user?.fullName || ''}
                  </Text>
                  <Text style={styles.drawerUserSub}>
                    {role === 'govt_body'
                      ? 'Govt Representative ID'
                      : role === 'partner'
                        ? 'Ecosystem Partner ID'
                        : 'Verified Farmer ID'}
                  </Text>
                </View>
              </View>
              <TouchableOpacity style={styles.drawerCloseBtn} onPress={() => closeDrawer()}>
                <MaterialCommunityIcons name="close" size={20} color={COLORS.textLight} />
              </TouchableOpacity>
            </LinearGradient>

            <ScrollView style={styles.drawerItemsContainer} showsVerticalScrollIndicator={false}>
              {[
                { label: 'Home Dashboard', icon: 'home-variant', route: '/(tabs)' },
                { label: 'Carbon Programs', icon: 'molecule-co2', route: '/(tabs)/projects' },
                { label: 'Tree Insurance', icon: 'shield-check-outline', route: '/insurance' },
                { label: 'Agri Store', icon: 'shopping-outline', route: '/(tabs)/marketplace' },
                { label: 'Eco Wallet', icon: 'wallet-outline', route: '/(tabs)/wallet' },
                { label: 'Farmer Profile', icon: 'account-outline', route: '/(tabs)/profile' },
              ].map((item, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.drawerItem}
                  onPress={() => handleDrawerNavigation(item.route)}
                >
                  <View style={styles.drawerItemIconBox}>
                    <MaterialCommunityIcons name={item.icon as any} size={22} color={COLORS.primary} />
                  </View>
                  <Text style={styles.drawerItemLabel}>{item.label}</Text>
                  <MaterialCommunityIcons name="chevron-right" size={18} color="#CBD5E1" />
                </TouchableOpacity>
              ))}
            </ScrollView>

            <View style={[styles.drawerFooter, { paddingBottom: 20 + insets.bottom }]}>
              <TouchableOpacity style={styles.logoutBtn} onPress={async () => { closeDrawer(); await useAuthStore.getState().logout(); router.replace('/(auth)/welcome'); }}>
                <MaterialCommunityIcons name="logout" size={20} color={COLORS.danger} />
                <Text style={styles.logoutBtnText}>Logout</Text>
              </TouchableOpacity>
              <Text style={styles.appVersion}>BhumiCred v1.2.0</Text>
            </View>
          </Animated.View>
        </View>
      </Modal>

      {/* Dynamic Support AI Chat */}
      <SevaBotModal visible={isBotVisible} onClose={() => setBotVisible(false)} />

      {selectedPlotForTracking && (
        <TrackingModal
          visible={trackingModalVisible}
          onClose={() => setTrackingModalVisible(false)}
          plotId={selectedPlotForTracking.id}
          status={selectedPlotForTracking.status}
        />
      )}

      {/* Dynamic location selector */}
      <LocationPickerModal
        visible={isLocationPickerOpen}
        onClose={() => setLocationPickerOpen(false)}
        onSelect={(loc) => setSelectedLocation(loc)}
        currentLocation={selectedLocation}
      />
      <PartnerHubModal
        visible={partnerHubVisible}
        initialTab={partnerHubTab}
        onClose={() => setPartnerHubVisible(false)}
      />

      {/* Bhumitra AI Floating Action Button (FAB) */}
      <TouchableOpacity
        style={styles.floatingAiFab}
        onPress={() => setBotVisible(true)}
        activeOpacity={0.85}
      >
        <LinearGradient
          colors={['#10B981', '#047857']}
          style={styles.floatingAiFabGradient}
        >
          <MaterialCommunityIcons name="robot" size={26} color="#FFFFFF" />
          <View style={styles.floatingFabBadge} />
        </LinearGradient>
      </TouchableOpacity>
    </AmbientEcoBackground>
  );
}

const styles = StyleSheet.create({
  partnerMetricsBlock: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    ...SHADOWS.soft,
  },
  partnerSectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 14,
  },
  partnerGridRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  partnerMetricCard: {
    flex: 0.48,
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  partnerMetricValue: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
    marginTop: 6,
  },
  partnerMetricLabel: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '600',
    marginTop: 2,
  },
  partnerServicesBlock: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 18,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    ...SHADOWS.soft,
  },
  servicesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  serviceItem: {
    width: '48%',
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  serviceIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  serviceItemTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
  },
  serviceItemSub: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  stickyHeader: {
    backgroundColor: COLORS.primary,
    paddingTop: Platform.OS === 'ios' ? 50 : 45,
    paddingBottom: 16,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    zIndex: 10,
    ...Platform.select({
      android: { elevation: 4 },
      ios: {
        shadowColor: '#064E3B',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      }
    }),
  },
  hamburgerBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  brandContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  brandTitle: {
    ...TYPOGRAPHY.h2,
    color: '#FFFFFF',
    fontWeight: '900',
    fontSize: 20,
  },
  headerRight: {
    flexDirection: 'row',
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cartBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: COLORS.accent,
    width: 16,
    height: 16,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cartBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: COLORS.primaryDark,
  },
  mainScrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  headerBanner: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 20,
    paddingBottom: 60,
    overflow: 'visible',
  },
  bannerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  greetingBox: {
    flex: 1,
  },
  greetingText: {
    ...TYPOGRAPHY.h2,
    color: '#FFFFFF',
    fontWeight: '800',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  locationText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
    marginHorizontal: 4,
  },
  quickActionsContainer: {
    marginTop: 12,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    ...TYPOGRAPHY.h3,
    color: '#FFFFFF',
    fontWeight: '800',
    marginBottom: 16,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  actionPill: {
    width: '31%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 8,
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    ...SHADOWS.soft,
  },
  actionIconBox: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  actionLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textDark,
    textAlign: 'center',
  },
  // Carbon Banner
  carbonBannerCard: {
    marginHorizontal: 20,
    marginTop: 20,
    borderRadius: 24,
    overflow: 'hidden',
    ...SHADOWS.glow,
  },
  carbonBannerGradient: {
    padding: 24,
    position: 'relative',
  },
  carbonBannerContent: {
    zIndex: 2,
  },
  carbonBadge: {
    backgroundColor: '#10B981',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginBottom: 12,
  },
  carbonBadgeText: {
    fontSize: 9,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  carbonBannerTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#FFFFFF',
    marginBottom: 6,
  },
  carbonBannerDesc: {
    fontSize: 12,
    color: '#A7F3D0',
    lineHeight: 18,
    marginBottom: 16,
    width: '80%',
  },
  carbonBannerAction: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    alignSelf: 'flex-start',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  carbonBannerActionText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#064E3B',
    marginRight: 4,
  },
  carbonBannerBgIcon: {
    position: 'absolute',
    right: -10,
    bottom: -10,
    zIndex: 1,
  },
  heroCarouselSection: {
    marginTop: 8,
    paddingBottom: 12,
  },
  heroSlideWrapper: {
    width: width,
    paddingHorizontal: 20,
  },
  heroSlide: {
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: '#052E16',
  },
  heroImage: {
    width: '100%',
    height: 155,
    borderRadius: 20,
  },
  heroLeft: {
    flex: 1.4,
    justifyContent: 'space-between',
  },
  heroCodeBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  heroCodeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  heroTitleSlide: {
    fontSize: 16,
    fontWeight: '900',
    color: '#FFFFFF',
    marginTop: 6,
  },
  heroSubtitleSlide: {
    fontSize: 12,
    color: '#E0F2F1',
    fontWeight: '500',
  },
  heroActionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  heroDiscount: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.accent,
  },
  heroClaimBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  heroClaimBtnText: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.primary,
  },
  heroRight: {
    flex: 0.6,
    justifyContent: 'center',
    alignItems: 'flex-end',
  },
  heroDotsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 10,
  },
  heroDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#CBD5E1',
    marginHorizontal: 3,
  },
  heroDotActive: {
    width: 18,
    backgroundColor: COLORS.primary,
  },
  journeyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    marginHorizontal: 20,
    padding: 20,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    ...SHADOWS.soft,
  },
  journeyTitle: {
    ...TYPOGRAPHY.h3,
    color: COLORS.primaryDark,
    fontWeight: '800',
  },
  journeySub: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginBottom: 20,
    fontWeight: '500',
  },
  timelineWrapper: {
    position: 'relative',
    paddingVertical: 10,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 44,
  },
  iconBoxWrapper: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOWS.soft,
  },
  stepTextColLeft: {
    marginLeft: 16,
    flex: 1,
  },
  stepTextColRight: {
    marginRight: 16,
    flex: 1,
  },
  stepTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.textDark,
  },
  stepDesc: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 2,
    lineHeight: 15,
    fontWeight: '500',
  },
  // DRAWER STYLES
  drawerOverlay: {
    flex: 1,
    flexDirection: 'row',
  },
  drawerBackdrop: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
  },
  drawerBackdropFill: {
    flex: 1,
    backgroundColor: 'rgba(2, 44, 34, 0.4)',
  },
  drawerContent: {
    width: width * 0.75,
    backgroundColor: '#FFFFFF',
    height: '100%',
    ...SHADOWS.glow,
  },
  drawerHeader: {
    paddingTop: Platform.OS === 'ios' ? 60 : 45,
    paddingBottom: 24,
    paddingHorizontal: 20,
  },
  drawerUserBox: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  drawerAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.accent,
    justifyContent: 'center',
    alignItems: 'center',
  },
  drawerAvatarText: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.primaryDark,
  },
  drawerUserInfo: {
    marginLeft: 12,
    flex: 1,
  },
  drawerUserName: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  drawerUserSub: {
    fontSize: 11,
    color: COLORS.accent,
    fontWeight: '600',
    marginTop: 2,
  },
  drawerCloseBtn: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 60 : 45,
    right: 16,
    backgroundColor: 'rgba(255,255,255,0.15)',
    padding: 4,
    borderRadius: 14,
  },
  drawerItemsContainer: {
    padding: 16,
  },
  drawerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 12,
    marginBottom: 8,
    backgroundColor: '#F8FAFC',
  },
  drawerItemIconBox: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: '#ECFDF5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  drawerItemLabel: {
    flex: 1,
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textDark,
  },
  drawerFooter: {
    padding: 20,
    borderTopWidth: 1,
    borderColor: '#F1F5F9',
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  logoutBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.danger,
    marginLeft: 8,
  },
  appVersion: {
    fontSize: 10,
    color: '#94A3B8',
    marginTop: 8,
    fontWeight: '600',
  },
  // Connectivity styles
  connectivityPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    height: 24,
    alignSelf: 'center',
    marginLeft: 6,
  },
  connectivityOnline: {
    backgroundColor: '#ECFDF5',
    borderColor: '#D1FAE5',
  },
  connectivityOffline: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FEE2E2',
  },
  connectivityPillText: {
    fontSize: 9,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  // Badge shelf styles
  badgeShelfSection: {
    marginTop: 24,
    paddingHorizontal: 20,
  },
  badgeShelfHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  viewAllText: {
    fontSize: 12,
    color: COLORS.primaryLight,
    fontWeight: '800',
  },
  badgeShimmerRow: {
    flexDirection: 'row',
    paddingVertical: 4,
  },
  badgeShimmerCard: {
    width: 90,
    height: 104,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 12,
    marginRight: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeShimmerCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginBottom: 8,
  },
  badgeShimmerText: {
    width: '70%',
    height: 10,
    borderRadius: 5,
  },
  badgeScrollContent: {
    paddingVertical: 4,
    paddingRight: 20,
  },
  badgeCard: {
    width: 90,
    borderRadius: 16,
    marginRight: 10,
    overflow: 'hidden',
    borderWidth: 1,
    ...SHADOWS.soft,
  },
  badgeUnlocked: {
    borderColor: COLORS.primaryLight,
  },
  badgeLocked: {
    borderColor: '#E2E8F0',
    opacity: 0.8,
  },
  badgeGradient: {
    padding: 10,
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 110,
  },
  badgeIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOWS.soft,
  },
  badgeCardTitle: {
    fontSize: 10,
    fontWeight: '800',
    marginTop: 6,
    textAlign: 'center',
  },
  badgeLevelBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    marginTop: 6,
  },
  badgeLevelText: {
    fontSize: 7,
    fontWeight: '900',
    color: '#FFFFFF',
    textTransform: 'uppercase',
  },
  // Recent Activity timeline styles
  activitySection: {
    marginTop: 24,
    paddingHorizontal: 20,
  },
  timelineFeed: {
    marginTop: 10,
  },
  activityRow: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  activityLeft: {
    width: 36,
    alignItems: 'center',
  },
  activityIconCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
    zIndex: 2,
  },
  activityConnectorLine: {
    width: 2,
    flex: 1,
    backgroundColor: '#E2E8F0',
    marginVertical: 4,
    zIndex: 1,
  },
  activityRight: {
    flex: 1,
    marginLeft: 8,
    paddingBottom: 16,
  },
  activityCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    ...SHADOWS.soft,
  },
  activityCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  activityCardTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.textDark,
  },
  activityCardTime: {
    fontSize: 9,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  activityCardDesc: {
    fontSize: 10.5,
    color: COLORS.textSecondary,
    lineHeight: 14,
    fontWeight: '500',
  },
  // Premium metersDashboard styles
  metersDashboard: {
    marginHorizontal: 20,
    marginTop: -45,
    marginBottom: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 16,
    flexDirection: 'column',
    borderWidth: 1.5,
    borderColor: COLORS.border,
    ...SHADOWS.glow,
  },
  metersDashboardRow: {
    flexDirection: 'row',
    gap: 5,
    width: '100%',
  },
  circularMeterCol: {
    flex: 1.1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRightWidth: 1,
    borderRightColor: '#F1F5F9',
    paddingRight: 10,
  },
  meterGlowRing: {
    width: 86,
    height: 86,
    borderRadius: 43,
    backgroundColor: '#F0FDF4',
    padding: 4,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.limeGlow,
  },
  meterProgressCircle: {
    flex: 1,
    width: '100%',
    borderRadius: 39,
    padding: 4,
  },
  innerMeterCircle: {
    flex: 1,
    borderRadius: 35,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  meterScoreText: {
    fontSize: 22,
    fontWeight: '900',
    color: COLORS.primaryDark,
  },
  meterSubLabel: {
    fontSize: 7.5,
    color: COLORS.textSecondary,
    fontWeight: '800',
    textTransform: 'uppercase',
    marginTop: 1,
  },
  meterTrendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  meterTrendText: {
    fontSize: 9,
    color: '#22C55E',
    fontWeight: '800',
  },
  rightStatsGrid: {
    flex: 1.4,
    paddingLeft: 12,
    justifyContent: 'space-between',
  },
  rightStatRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 4,
  },
  rightStatLabel: {
    fontSize: 9,
    color: COLORS.textSecondary,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  rightStatValue: {
    fontSize: 12.5,
    fontWeight: '800',
    color: COLORS.textDark,
    marginTop: 1,
  },
  // Trend Card styles
  trendCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    marginHorizontal: 20,
    marginTop: 20,
    marginBottom: 20,
    padding: 20,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    ...SHADOWS.soft,
  },
  trendHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  trendTitle: {
    ...TYPOGRAPHY.h3,
    color: COLORS.primaryDark,
    fontWeight: '800',
  },
  trendSub: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 2,
    marginBottom: 16,
    fontWeight: '500',
  },
  trendMetrics: {
    marginTop: 4,
  },
  trendMetricRow: {
    marginBottom: 12,
  },
  trendMetricLabel: {
    fontSize: 11,
    color: COLORS.textDark,
    fontWeight: '700',
    marginBottom: 4,
  },
  trendProgressBarBg: {
    height: 8,
    backgroundColor: '#F1F5F9',
    borderRadius: 4,
    position: 'relative',
    overflow: 'hidden',
  },
  trendProgressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  trendMetricVal: {
    fontSize: 10,
    color: COLORS.textSecondary,
    fontWeight: '700',
    marginTop: 4,
    textAlign: 'right',
  },
  seasonPickerContainer: {
    marginTop: 18,
    marginBottom: 8,
    width: '100%',
  },
  seasonScroll: {
    gap: 10,
  },
  seasonPill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    marginRight: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  seasonPillActive: {
    backgroundColor: '#FFFFFF',
    borderColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  seasonPillText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: 'rgba(255, 255, 255, 0.9)',
    letterSpacing: 0.3,
  },
  seasonPillTextActive: {
    color: COLORS.primaryDark,
    fontWeight: '800',
  },
  // AI Advice Card
  aiAdviceContainer: {
    marginTop: 20,
    paddingHorizontal: 20,
  },
  aiAdviceCard: {
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#0F766E',
    ...SHADOWS.glow,
  },
  aiAdviceGrad: {
    padding: 16,
  },
  aiHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  aiAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#022C22',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#84CC16',
  },
  aiTitle: {
    fontSize: 12,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  aiTime: {
    fontSize: 9,
    color: '#A7F3D0',
    fontWeight: '600',
    marginTop: 1,
  },
  aiStatusBadge: {
    backgroundColor: '#84CC16',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  aiStatusText: {
    fontSize: 8,
    fontWeight: '900',
    color: '#022C22',
    letterSpacing: 0.2,
  },
  aiBodyText: {
    fontSize: 12,
    color: '#FFFFFF',
    lineHeight: 17,
    fontWeight: '600',
    marginBottom: 10,
    fontStyle: 'italic',
  },
  aiFooterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
    paddingTop: 8,
  },
  aiActionLabel: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#84CC16',
  },
  // Live Pulse Widget styles
  pulseCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    marginHorizontal: 20,
    marginTop: 20,
    padding: 20,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    ...SHADOWS.soft,
  },
  pulseHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  pulseIconContainer: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  pulseRing: {
    position: 'absolute',
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#22C55E',
  },
  pulseCoreDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#22C55E',
    shadowColor: '#22C55E',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 6,
    elevation: 2,
  },
  pulseTitle: {
    ...TYPOGRAPHY.h3,
    color: COLORS.primaryDark,
    fontWeight: '800',
  },
  pulseSub: {
    fontSize: 10.5,
    color: COLORS.textSecondary,
    fontWeight: '500',
    marginTop: 1,
  },
  pulseBadge: {
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 0.5,
    borderColor: '#A7F3D0',
  },
  pulseBadgeText: {
    fontSize: 8.5,
    fontWeight: '900',
    color: COLORS.success,
  },
  pulseActivityGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  pulseActivityItem: {
    width: '48%',
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  pulseActivityHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  pulseActivityTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.textDark,
    marginLeft: 6,
  },
  pulseProgressBarBg: {
    height: 6,
    backgroundColor: '#E2E8F0',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 6,
  },
  pulseProgressBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  pulseActivityVal: {
    fontSize: 10,
    color: COLORS.textSecondary,
    fontWeight: '700',
  },
  pulseTickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 0.5,
    borderColor: '#DCFCE7',
  },
  pulseTickerText: {
    fontSize: 10,
    fontWeight: '700',
    color: COLORS.primaryDark,
    flex: 1,
  },
  // 9-Stage progression map styles
  journeyNode: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    zIndex: 10,
    ...SHADOWS.soft,
  },
  nodeCompleted: {
    backgroundColor: '#22C55E',
  },
  nodeActive: {
    backgroundColor: '#84CC16',
  },
  nodeLocked: {
    backgroundColor: '#E2E8F0',
    borderColor: '#CBD5E1',
  },
  activePulseRing: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2.5,
    borderColor: '#84CC16',
  },
  nodeTextBubble: {
    position: 'absolute',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 6,
    width: 130,
    ...SHADOWS.soft,
  },
  bubbleLeft: {
    left: -142,
    top: 0,
  },
  bubbleRight: {
    left: 52,
    top: 0,
  },
  nodeBubbleTitle: {
    fontSize: 9.5,
    fontWeight: '900',
    color: COLORS.textDark,
  },
  nodeBubbleDesc: {
    fontSize: 8.5,
    color: COLORS.textSecondary,
    fontWeight: '600',
    marginTop: 2,
  },
  // Timeline Emotional items
  activityCardStory: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.primary,
    marginTop: 2,
  },
  impactBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginTop: 8,
    borderWidth: 0.5,
    borderColor: '#DCFCE7',
  },
  impactBadgeText: {
    fontSize: 8.5,
    fontWeight: '800',
    color: COLORS.primaryLight,
  },
  heroGradient: {
    flex: 1,
    padding: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  floatingAiFab: {
    position: 'absolute',
    bottom: 28,
    right: 20,
    zIndex: 999,
    elevation: 8,
    shadowColor: '#047857',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
  },
  floatingAiFabGradient: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  floatingFabBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#84CC16',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  headerAvatarWrapper: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 6,
    overflow: 'hidden',
  },
  headerAvatarImg: {
    width: '100%',
    height: '100%',
  },
  searchBarContainer: {
    width: '100%',
    paddingHorizontal: 0,
    marginTop: 2,
    marginBottom: 6,
  },
  searchBarBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 12,
    paddingVertical: 10,
    width: '100%',
    ...SHADOWS.small,
  },
  searchBarInput: {
    flex: 1,
    fontSize: 13,
    color: COLORS.textDark,
    padding: 0,
  },
  heroCtaBtn: {
    backgroundColor: COLORS.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 12,
    marginTop: 14,
    borderWidth: 1,
    borderColor: '#059669',
    ...SHADOWS.small,
  },
  heroCtaText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
  walletCardContainer: {
    marginHorizontal: 16,
    marginVertical: 10,
    borderRadius: 20,
    overflow: 'hidden',
    ...SHADOWS.medium,
  },
  walletCardGrad: {
    padding: 20,
  },
  walletCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  walletCardTitle: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  walletCardSubtitle: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
    marginTop: 2,
  },
  walletCardAmountRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginTop: 14,
  },
  walletCardSymbol: {
    color: '#34D399',
    fontSize: 18,
    fontWeight: '800',
    marginRight: 4,
  },
  walletCardAmount: {
    color: '#FFFFFF',
    fontSize: 32,
    fontWeight: '900',
  },
  walletCardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
    marginTop: 18,
    paddingTop: 12,
  },
  walletWithdrawLink: {
    color: '#FFFFFF',
    fontSize: 11.5,
    fontWeight: '800',
  },
  timelineCard: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginVertical: 10,
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    ...SHADOWS.soft,
  },
  timelineCardTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.textDark,
    marginBottom: 14,
  },
  timelineEmpty: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
  },
  timelineEmptyText: {
    fontSize: 11.5,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  timelineFlow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 6,
  },
  timelineStepItem: {
    alignItems: 'center',
    width: (width - 64) / 4,
  },
  timelineNode: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#E2E8F0',
  },
  timelineNodeDone: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  timelineNodeCurrent: {
    backgroundColor: '#EFF6FF',
    borderColor: COLORS.primary,
  },
  timelineNodeLabel: {
    fontSize: 9.5,
    color: COLORS.textSecondary,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 6,
  },
  timelineNodeLabelDone: {
    color: COLORS.textDark,
    fontWeight: '700',
  },
  timelineNodeLabelCurrent: {
    color: COLORS.primary,
    fontWeight: '800',
  },
  timelineTrackLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    marginTop: 14,
    paddingTop: 10,
  },
  timelineTrackLinkText: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.primary,
    marginRight: 4,
  },
  referralCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginVertical: 10,
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    ...SHADOWS.soft,
  },
  referralIconBox: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFE4E6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  referralTitle: {
    fontSize: 13.5,
    fontWeight: '800',
    color: COLORS.textDark,
  },
  referralDesc: {
    fontSize: 10.5,
    color: COLORS.textSecondary,
    fontWeight: '600',
    marginTop: 2,
    lineHeight: 14,
  },
});

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Dimensions,
  Platform,
  RefreshControl,
  Modal,
  StatusBar,
  TextInput,
  DeviceEventEmitter,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useLandStore } from '../../src/store/landStore';
import TrackingModal from '../../src/components/TrackingModal';
import { LinearGradient } from 'expo-linear-gradient';

import { COLORS, TYPOGRAPHY, SHADOWS } from '../../src/theme/theme';
import { useAuthStore } from '../../src/store/authStore';
import { ManagerChatModal } from '../../src/components/ManagerChatModal';
import { useCarbonStore } from '../../src/store/carbonStore';
import { useInsuranceStore } from '../../src/store/insuranceStore';
import api from '../../src/api/apiClient';
import { isFarmerVerified } from '../../src/utils/verificationGuard';
import { getEnglishApiErrorMessage } from '../../src/utils/apiErrorMessage';

const { width, height } = Dimensions.get('window');

// Extended interface representing a premium project with story metrics
interface RichProject {
  id: string;
  name: string;
  type: 'Carbon Capture' | 'Tree Insurance';
  category: 'Sustainable Agriculture' | 'AgroForestry' | 'Organic Farming' | 'Sustainability Mission' | 'Tree Protection' | 'Canopy Cover';
  description: string;
  objective: string;
  state: string;
  district: string;
  farmerCount: number;
  sustainabilityTarget: string;
  duration: string;
  startDate: string;
  endDate: string;
  roadmapSteps: RoadmapStep[]; // fixed 9-step Carbon Program roadmap, each independently completed
  supportedBy: {
    ngo: string;
    partner: string;
    govt: string;
    sponsor: string;
  };
  projectManager: {
    name: string;
    designation: string;
    team: string;
  };

  // CARBON SUSTAINABILITY SPECIFIC METRICS (Land + Acreage + Trees + MRV + Carbon)
  carbonEstimatedAnnual?: number;
  totalLandArea?: string;
  totalTreesRegistered?: number;
  agroforestryParticipation?: boolean;
  plantationDensity?: string;
  mrvVerificationProgress?: number; // %
  isTrackingActive?: boolean;

  // TREE PROTECTION SPECIFIC METRICS (Trees + Policies + Claims + Health)
  totalTreesInsured?: number;
  farmersProtected?: number;
  villagesCovered?: number;
  districtCoverage?: number;
  activePoliciesCount?: number;
  plantationHealthScore?: number; // %
  treeSurvivalRate?: number; // %
  climateProtectionCoverage?: string;
}

type ApiProjectSummary = {
  id: string;
  title: string;
  category: string;
  description: string;
  district: string;
  state: string;
  target_area_acres: number;
  estimated_carbon_impact: number;
  status_label: string;
  is_tracking_active: boolean;
  progress_percent?: number;
  current_stage?: string;
  trees_registered?: number;
};

type ApiProjectsHub = {
  active_project: null | {
    enrollment_id: string;
    project: ApiProjectSummary;
    status: string;
    current_stage: string;
    current_stage_label: string;
    progress_percent: number;
    joined_at: string;
    ngo_partner?: string | null;
    land_verified: boolean;
    trees_verified: boolean;
    mrv_verified: boolean;
    insurance_active: boolean;
    // Independent per-stage roadmap status — each flag is the sole source of
    // truth for whether that step is complete. Never derive completion from
    // current_stage/progress_percent or from another step's position.
    stage_project_assigned: boolean;
    stage_land_registered: boolean;
    stage_inspection_completed: boolean;
    stage_soil_verified: boolean;
    stage_trees_registered: boolean;
    stage_insurance_activated: boolean;
    stage_mrv_monitoring_started: boolean;
    stage_carbon_estimation_running: boolean;
    stage_reward_eligible: boolean;
  };
  contribution: {
    total_land_added_acres: number;
    trees_registered: number;
    trees_insured: number;
    sustainability_score: number;
    estimated_carbon_impact: number;
    green_family_count: number;
  };
  insurance: null | {
    policy_name: string;
    status: string;
    protected_trees: number;
    claim_eligibility_percent: number;
    duration_years: number;
    expiry_date?: string | null;
  };
  explore_projects: ApiProjectSummary[];
};

const normalizeCategory = (category: string): RichProject['category'] => {
  const allowed: RichProject['category'][] = [
    'Sustainable Agriculture',
    'AgroForestry',
    'Organic Farming',
    'Sustainability Mission',
    'Tree Protection',
    'Canopy Cover',
  ];
  return allowed.includes(category as RichProject['category'])
    ? (category as RichProject['category'])
    : 'Sustainability Mission';
};

interface RoadmapStep {
  order: number;
  key: string;
  title: string;
  desc: string;
  completed: boolean;
  log?: { date: string; inspector: string; data: string };
}

// The Carbon Program roadmap, in the required fixed order. Each step's
// `completed` flag comes directly and exclusively from its own backend
// status field — never from a single currentStep/progress value, and never
// implied by a neighboring step. This is the sole source of truth for every
// roadmap rendering in this screen.
const buildRoadmapSteps = (
  active?: ApiProjectsHub['active_project'],
  contribution?: ApiProjectsHub['contribution'],
  insuranceProtection?: ApiProjectsHub['insurance'],
): RoadmapStep[] => {
  const treesCount = contribution?.trees_registered ?? 0;

  const definitions: Array<Omit<RoadmapStep, 'completed' | 'log'>> = [
    { order: 1, key: 'project_assigned', title: 'Project Assigned', desc: 'Enrollment initiated and project dashboard generated.' },
    { order: 2, key: 'land_registered', title: 'MRV Scheduled', desc: 'Remote sensing satellite scans and audit windows locked.' },
    { order: 3, key: 'inspection_completed', title: 'Soil Testing', desc: 'Core soil NPK baseline sample checks scheduled.' },
    { order: 4, key: 'soil_verified', title: 'Inspection', desc: 'On-site field verification by assigned inspector completed.' },
    { order: 5, key: 'trees_registered', title: 'GIS Mapping', desc: 'Dynamic boundary geofencing synced in global ecological registry.' },
    { order: 6, key: 'insurance_activated', title: 'MRV Progress', desc: 'Active remote canopy monitoring and tree shield insurance active.' },
    { order: 7, key: 'mrv_monitoring_started', title: 'Carbon Calculation', desc: 'Live remote biomass calculation models active.' },
    { order: 8, key: 'carbon_estimation_running', title: 'Registry', desc: 'Environmental credits registered under verification standard.' },
    { order: 9, key: 'reward_eligible', title: 'Credits Issued', desc: 'Carbon credit rewards minted and deposited in Eco-Wallet.' },
  ];

  if (!active) {
    return definitions.map((step) => ({ ...step, completed: false }));
  }

  const completedByKey: Record<string, boolean> = {
    project_assigned: active.stage_project_assigned,
    land_registered: active.stage_land_registered,
    inspection_completed: active.stage_inspection_completed,
    soil_verified: active.stage_soil_verified,
    trees_registered: active.stage_trees_registered,
    insurance_activated: active.stage_insurance_activated,
    mrv_monitoring_started: active.stage_mrv_monitoring_started,
    carbon_estimation_running: active.stage_carbon_estimation_running,
    reward_eligible: active.stage_reward_eligible,
  };

  const logByKey: Record<string, { date: string; inspector: string; data: string }> = {
    project_assigned: { date: active.joined_at?.split('T')[0] || 'Submitted', inspector: 'Project Operations', data: 'Enrollment created for this farmer.' },
    land_registered: { date: 'Verified', inspector: 'BhumiCred Field Inspector', data: 'Registered land parcel confirmed for this project.' },
    inspection_completed: { date: 'Admin verified', inspector: 'BhumiCred Field Inspector', data: 'Baseline inspection completed from the admin project lifecycle panel.' },
    soil_verified: { date: 'Admin verified', inspector: 'SOC Lab Desk', data: 'Soil Organic Carbon baseline review marked verified by admin.' },
    trees_registered: { date: 'Admin approved', inspector: 'Project Operations', data: `${treesCount} trees approved for monitoring.` },
    insurance_activated: { date: 'Admin verified', inspector: 'Green Shield Desk', data: 'Insurance protection activated from the admin panel.' },
    mrv_monitoring_started: { date: 'Admin started', inspector: 'Sentinel MRV Scan', data: 'MRV monitoring started from the admin lifecycle controls.' },
    carbon_estimation_running: { date: 'Admin started', inspector: 'Carbon Estimation Engine', data: 'Carbon estimation is running with verified land, soil, tree, and MRV inputs.' },
    reward_eligible: { date: 'Admin completed', inspector: 'Rewards Desk', data: 'Sustainability rewards eligibility marked complete from admin panel.' },
  };

  return definitions.map((step) => {
    const completed = !!completedByKey[step.key];
    return { ...step, completed, log: completed ? logByKey[step.key] : undefined };
  });
};

const getCurrentStageLabel = (steps: RoadmapStep[]): string => {
  const lastCompleted = [...steps].reverse().find((step) => step.completed);
  if (!lastCompleted) return 'Getting Started';
  return `Stage ${lastCompleted.order}: ${lastCompleted.title}`;
};

// The next actionable step — the first one not yet completed — used only to
// decide which timeline node opens expanded by default. Purely a cosmetic
// "what's next" pointer; it never affects any step's completed state.
const getFirstPendingStepOrder = (steps: RoadmapStep[]): number => {
  const firstPending = steps.find((step) => !step.completed);
  return firstPending ? firstPending.order : steps[steps.length - 1]?.order ?? 1;
};

const mapApiProjectToRichProject = (
  project: ApiProjectSummary,
  active?: ApiProjectsHub['active_project'],
  contribution?: ApiProjectsHub['contribution'],
  insuranceProtection?: ApiProjectsHub['insurance'],
): RichProject => ({
  id: project.id,
  name: project.title,
  type: 'Carbon Capture',
  category: normalizeCategory(project.category),
  description: project.description,
  objective: project.description,
  state: project.state,
  district: project.district,
  farmerCount: 0,
  sustainabilityTarget: `${project.estimated_carbon_impact.toLocaleString()} CO₂e Target`,
  duration: '3 Years',
  startDate: active?.joined_at?.split('T')[0] || 'Pending',
  endDate: 'Renewable',
  roadmapSteps: buildRoadmapSteps(active, contribution, insuranceProtection),
  supportedBy: {
    ngo: active?.ngo_partner || 'BhumiCred Partner',
    partner: 'BhumiCred Foundation',
    govt: 'District Sustainability Mission',
    sponsor: 'Climate Partner',
  },
  projectManager: {
    name: 'BhumiCred MRV Team',
    designation: 'Carbon Project Operations',
    team: 'Projects Hub',
  },
  carbonEstimatedAnnual: project.estimated_carbon_impact,
  totalLandArea: `${project.target_area_acres.toLocaleString()} Acres`,
  totalTreesRegistered: active ? (contribution?.trees_registered ?? 0) : (project.trees_registered ?? undefined),
  agroforestryParticipation: project.category.toLowerCase().includes('forest'),
  plantationDensity: active?.land_verified ? 'Baseline inspection complete' : 'Pending verification',
  mrvVerificationProgress: active?.progress_percent || project.progress_percent || 0,
  isTrackingActive: project.is_tracking_active,
});

export default function ProjectsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(tabs)' as any);
    }
  };

  // Zustand Store states
  const carbonProjects = useCarbonStore((state) => state.projects);
  const joinCarbonProject = useCarbonStore((state) => state.joinProject);

  const policies = useInsuranceStore((state) => state.policies);
  const greenFamily = useInsuranceStore((state) => state.greenFamily);

  const authUser = useAuthStore((state) => state.user);

  // App States
  const [activeTab, setActiveTab] = useState<'projects' | 'lands'>('projects');
  const [selectedPlot, setSelectedPlot] = useState<any>(null);
  const [trackingModalVisible, setTrackingModalVisible] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<string>('All');

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProject, setSelectedProject] = useState<RichProject | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [activeTimelineNode, setActiveTimelineNode] = useState<number | null>(null);

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [joiningId, setJoiningId] = useState<string | null>(null);
  const [treeCountInput, setTreeCountInput] = useState('25');
  const [isRegisteringTrees, setIsRegisteringTrees] = useState(false);
  const [isManagerChatOpen, setIsManagerChatOpen] = useState(false);
  const [projectsHub, setProjectsHub] = useState<ApiProjectsHub | null>(null);
  const [apiProjects, setApiProjects] = useState<RichProject[]>([]);

  const plots = useLandStore((state) => state.plots);
  const fetchPlots = useLandStore((state) => state.fetchPlots);

  const fetchProjectsData = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const [hubRes, listRes] = await Promise.all([
        api.get('/projects/hub'),
        api.get('/projects'),
      ]);
      const hubData = hubRes.data?.data as ApiProjectsHub;
      const listData = (listRes.data?.data || []) as ApiProjectSummary[];
      setProjectsHub(hubData);
      setApiProjects(listData.map((project) => mapApiProjectToRichProject(project)));

      // Fetch lands as well
      await fetchPlots();

      // Sync latest profile (wallet & carbon credits) from the backend
      useAuthStore.getState().fetchProfile().catch(() => {});
    } catch (error) {
      console.warn('[Projects] Failed to load real projects data', error);
      setProjectsHub(null);
      setApiProjects([]);
      // Fallback local plots fetch
      fetchPlots().catch(() => {});
    } finally {
      setIsLoading(false);
    }
  }, [fetchPlots]);

  useEffect(() => {
    fetchProjectsData();
  }, [fetchProjectsData]);

  useFocusEffect(
    React.useCallback(() => {
      // Fetch immediately when screen gains focus
      fetchProjectsData();
      // Auto-poll every 30 seconds while Projects screen is open
      // This ensures admin project assignment reflects quickly without manual pull-to-refresh
      const interval = setInterval(() => {
        fetchProjectsData();
      }, 30000);
      return () => clearInterval(interval);
    }, [fetchProjectsData]),
  );

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    fetchProjectsData().finally(() => {
      setRefreshing(false);
    });
  }, [fetchProjectsData]);

  const activeProj = projectsHub?.active_project
    ? mapApiProjectToRichProject(projectsHub.active_project.project, projectsHub.active_project, projectsHub.contribution, projectsHub.insurance)
    : null;

  useEffect(() => {
    if (selectedProject && activeProj && selectedProject.id === activeProj.id) {
      setSelectedProject(activeProj);
    }
  }, [projectsHub]);
  
  // Resolve live metrics only from the backend Projects Hub API.
  const totalApprovedLandAcres = projectsHub?.contribution.total_land_added_acres ?? 0;
  const totalRegisteredTrees = projectsHub?.contribution.trees_registered ?? 0;
  const totalInsuredTreesCount = projectsHub?.contribution.trees_insured ?? 0;
  const greenFamilyCount = projectsHub?.contribution.green_family_count ?? Math.floor(totalInsuredTreesCount / 5);
  const sustainabilityScore = projectsHub?.contribution.sustainability_score ?? 0;
  // Calculate total credits exactly as it is in the Home Screen to ensure perfect sync
  const totalCredits = authUser?.carbonCreditsGenerated ?? 0;
  const insuranceProtection = projectsHub?.insurance;
  const displayRegisteredTrees = activeProj?.totalTreesRegistered ?? totalRegisteredTrees;
  const displayInsuredTrees = totalInsuredTreesCount;

  // Enroll in a real backend carbon project.
  const handleJoinProject = async (proj: RichProject) => {
    if (!isFarmerVerified()) return;
    setJoiningId(proj.id);
    try {
      await api.post(`/projects/${proj.id}/join`, {
        land_area_acres: totalApprovedLandAcres,
        tree_count: totalRegisteredTrees,
      });
      await fetchProjectsData();
      Alert.alert('Enrolled in Project!', `Successfully submitted "${proj.name}" for admin verification.`);
    } catch (err: any) {
      const message = getEnglishApiErrorMessage(err, 'Project registration failed. Please complete land registration first.');
      Alert.alert('Registration Failed', message);
    } finally {
      setJoiningId(null);
    }
  };

  const handleRegisterTrees = async (proj: RichProject) => {
    const treeCount = Number(treeCountInput);
    if (!Number.isFinite(treeCount) || treeCount <= 0) {
      Alert.alert('Tree Count Required', 'Please enter a valid number of trees.');
      return;
    }

    if (!isFarmerVerified()) return;

    setIsRegisteringTrees(true);
    try {
      await api.post(`/projects/${proj.id}/trees`, {
        tree_count: treeCount,
        plantation_photo_urls: [],
        geo_latitude: 23.2032,
        geo_longitude: 77.0844,
      });
      await fetchProjectsData();
      Alert.alert('Trees Registered', `${treeCount} trees submitted. Refresh Carbon Programs in the admin panel and approve the trees.`);
    } catch (err: any) {
      const message = getEnglishApiErrorMessage(err, 'Tree registration failed. Please try again.');
      Alert.alert('Registration Failed', message);
    } finally {
      setIsRegisteringTrees(false);
    }
  };

  // Helper mapping: resolves joined status dynamically from global stores
  const getProjectLiveStatus = (proj: RichProject) => {
    if (projectsHub?.active_project?.project.id === proj.id) return true;
    if (proj.isTrackingActive) return true;
    return false;
  };

  // Filter explore other projects
  const exploreProjects = apiProjects.filter((proj) => {
    if (projectsHub?.active_project?.project.id === proj.id) return false;
    return (
      proj.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      proj.supportedBy.ngo.toLowerCase().includes(searchQuery.toLowerCase()) ||
      proj.district.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />

      {/* Sticky top brand navigation header */}
      <View style={styles.header}>
        <View style={styles.headerInfoRow}>
          <TouchableOpacity onPress={handleBack} style={{ marginRight: 10, padding: 4 }}>
            <MaterialCommunityIcons name="arrow-left" size={22} color="#FFFFFF" />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={styles.headerTitle}>BhumiCred Projects Hub</Text>
            <Text style={styles.headerSubtitle}>Carbon Sustainability & Climate Protection Ecosystem</Text>
          </View>
          <View style={styles.ecoImpactBadge}>
            <MaterialCommunityIcons name="leaf" size={12} color="#FFFFFF" style={{ marginRight: 4 }} />
            <Text style={styles.ecoImpactText}>SECURE MRV</Text>
          </View>
        </View>
      </View>

      {/* Segmented Tab Switcher */}
      <View style={styles.tabSwitcherContainer}>
        <TouchableOpacity
          style={[styles.switcherTab, activeTab === 'projects' && styles.switcherTabActive]}
          onPress={() => setActiveTab('projects')}
        >
          <MaterialCommunityIcons
            name={activeTab === 'projects' ? 'chart-areaspline-variant' : 'chart-areaspline'}
            size={18}
            color={activeTab === 'projects' ? '#FFFFFF' : COLORS.textSecondary}
            style={{ marginRight: 6 }}
          />
          <Text style={[styles.switcherTabText, activeTab === 'projects' && styles.switcherTabTextActive]}>
            My Projects
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.switcherTab, activeTab === 'lands' && styles.switcherTabActive]}
          onPress={() => setActiveTab('lands')}
        >
          <MaterialCommunityIcons
            name={activeTab === 'lands' ? 'image-filter-hdr' : 'image-filter-hdr-outline'}
            size={18}
            color={activeTab === 'lands' ? '#FFFFFF' : COLORS.textSecondary}
            style={{ marginRight: 6 }}
          />
          <Text style={[styles.switcherTabText, activeTab === 'lands' && styles.switcherTabTextActive]}>
            My Lands
          </Text>
        </TouchableOpacity>
      </View>

      {activeTab === 'projects' ? (
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} colors={[COLORS.primary]} />
          }
        >
        {/* ================================================= */}
        {/* SECTION 1: YOUR ACTIVE SUSTAINABILITY PROJECT */}
        {/* ================================================= */}
        <Text style={styles.sectionHeading}>Your Active Sustainability Project</Text>
        {activeProj ? (
        <LinearGradient
          colors={['#022C22', '#064E3B']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.activeProjectCard}
        >
          <View style={styles.activeHeaderRow}>
            <View style={styles.activeLogoWrapper}>
              <MaterialCommunityIcons name="sprout" size={26} color="#FFFFFF" />
            </View>
            <View style={{ flex: 1, marginLeft: 14 }}>
              <Text style={styles.activeBadgeText}>YOU ARE ACTIVELY PARTICIPATING IN THIS MISSION</Text>
              <Text style={styles.activeProjectName}>{activeProj.name}</Text>
            </View>
          </View>

          <View style={styles.activeDetailsBlock}>
            <Text style={styles.activeObjectiveText}>{activeProj.objective}</Text>
            
            {/* Operational connection indicators */}
            <View style={styles.connectionChecklist}>
              <View style={styles.checkItem}>
                <MaterialCommunityIcons name="check-circle" size={16} color="#84CC16" style={{ marginRight: 8 }} />
                <Text style={styles.checkText}>Land Parcel: {totalApprovedLandAcres.toFixed(1)} Acres Registered</Text>
              </View>
              <View style={styles.checkItem}>
                <MaterialCommunityIcons name="check-circle" size={16} color="#84CC16" style={{ marginRight: 8 }} />
                <Text style={styles.checkText}>Enrolled Trees: {displayRegisteredTrees} saplings monitored</Text>
              </View>
              <View style={styles.checkItem}>
                <MaterialCommunityIcons name="account-group" size={16} color="#84CC16" style={{ marginRight: 8 }} />
                <Text style={styles.checkText}>Verification Team: Bhopal East Agronomy Unit</Text>
              </View>
            </View>

            {/* Dynamic statistics */}
            <View style={styles.activeMetaGrid}>
              <View style={styles.activeMetaItem}>
                <Text style={styles.activeMetaLabel}>ASSIGNED DATE</Text>
                <Text style={styles.activeMetaValue}>{activeProj.startDate}</Text>
              </View>
              <View style={styles.activeMetaItem}>
                <Text style={styles.activeMetaLabel}>CURRENT STAGE</Text>
                <Text style={[styles.activeMetaValue, { color: '#84CC16' }]}>{getCurrentStageLabel(activeProj.roadmapSteps)}</Text>
              </View>
              <View style={styles.activeMetaItem}>
                <Text style={styles.activeMetaLabel}>EST. CARBON YIELD</Text>
                <Text style={[styles.activeMetaValue, { color: '#F59E0B' }]}>{totalCredits.toFixed(1)} CO₂e</Text>
              </View>
              <View style={styles.activeMetaItem}>
                <Text style={styles.activeMetaLabel}>SUPPORTING NGO</Text>
                <Text style={styles.activeMetaValue}>{activeProj.supportedBy.ngo}</Text>
              </View>
            </View>
          </View>

          {/* Premium Horizontal Status Chips shelf */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipsRow}>
            {['Land Verified', 'Trees Protected', 'Insurance Active', 'MRV Monitoring Active', 'Carbon Estimation Running', 'Sustainability Score Active'].map((chip, idx) => (
              <View key={idx} style={styles.statusChip}>
                <View style={styles.statusChipDot} />
                <Text style={styles.statusChipText}>{chip}</Text>
              </View>
            ))}
          </ScrollView>

          <View style={styles.activeCardDivider} />

          <View style={{ flexDirection: 'row', gap: 10 }}>
            <TouchableOpacity
              style={[styles.activeViewDetailsBtn, { flex: 1.2 }]}
              onPress={() => {
                setSelectedProject(activeProj);
                setActiveTimelineNode(getFirstPendingStepOrder(activeProj.roadmapSteps));
                setIsDetailOpen(true);
              }}
            >
              <Text style={styles.activeViewDetailsBtnText}>View Project Info</Text>
              <MaterialCommunityIcons name="arrow-right" size={14} color="#84CC16" style={{ marginLeft: 4 }} />
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.activeViewDetailsBtn, { flex: 1, backgroundColor: 'rgba(255, 255, 255, 0.12)', borderColor: 'rgba(255,255,255,0.2)' }]}
              onPress={() => router.push('/soil-testing' as any)}
            >
              <Text style={[styles.activeViewDetailsBtnText, { color: '#FFFFFF' }]}>Soil Testing</Text>
              <MaterialCommunityIcons name="test-tube" size={14} color="#FFFFFF" style={{ marginLeft: 4 }} />
            </TouchableOpacity>
          </View>
        </LinearGradient>
        ) : (
          <View style={styles.emptyStateCard}>
            <MaterialCommunityIcons name="sprout-outline" size={44} color="#94A3B8" />
            <Text style={styles.emptyStateTitle}>No active project yet</Text>
            <Text style={styles.emptyStateDesc}>Join a real sustainability project after admin creates it.</Text>
          </View>
        )}

        {/* ================================================= */}
        {/* SECTION 2: YOUR SUSTAINABILITY CONTRIBUTION */}
        {/* ================================================= */}
        <Text style={styles.sectionHeading}>Your Contribution</Text>
        <View style={styles.contributionGrid}>
          <View style={styles.contribBox}>
            <View style={styles.contribIconBox}>
              <MaterialCommunityIcons name="image-filter-hdr" size={18} color={COLORS.primary} />
            </View>
            <Text style={styles.contribLabel}>TOTAL LAND ADDED</Text>
            <Text style={styles.contribValue}>{totalApprovedLandAcres.toFixed(1)} Acres</Text>
          </View>
          
          <View style={styles.contribBox}>
            <View style={styles.contribIconBox}>
              <MaterialCommunityIcons name="tree" size={18} color={COLORS.primary} />
            </View>
            <Text style={styles.contribLabel}>TREES REGISTERED</Text>
            <Text style={styles.contribValue}>{displayRegisteredTrees} Trees</Text>
          </View>

          <View style={styles.contribBox}>
            <View style={styles.contribIconBox}>
              <MaterialCommunityIcons name="shield-check" size={18} color="#0D9488" />
            </View>
            <Text style={styles.contribLabel}>TREES INSURED</Text>
            <Text style={[styles.contribValue, { color: '#0D9488' }]}>{displayInsuredTrees} Trees</Text>
          </View>

          <View style={styles.contribBox}>
            <View style={styles.contribIconBox}>
              <MaterialCommunityIcons name="seed" size={18} color="#84CC16" />
            </View>
            <Text style={styles.contribLabel}>SUSTAINABILITY SCORE</Text>
            <Text style={[styles.contribValue, { color: '#84CC16' }]}>{sustainabilityScore}</Text>
          </View>

          <View style={styles.contribBox}>
            <View style={styles.contribIconBox}>
              <MaterialCommunityIcons name="molecule-co2" size={18} color={COLORS.primary} />
            </View>
            <Text style={styles.contribLabel}>EST. CARBON IMPACT</Text>
            <Text style={styles.contribValue}>{totalCredits.toFixed(1)} CO₂e</Text>
          </View>

          <View style={styles.contribBox}>
            <View style={styles.contribIconBox}>
              <MaterialCommunityIcons name="account-group-outline" size={18} color={COLORS.primary} />
            </View>
            <Text style={styles.contribLabel}>GREEN FAMILY COUNT</Text>
            <Text style={styles.contribValue}>{greenFamilyCount} Families</Text>
          </View>
        </View>

        {/* ================================================= */}
        {/* SECTION 3: ACTIVE INSURANCE PROTECTION CARD */}
        {/* ================================================= */}
        <Text style={styles.sectionHeading}>Your Insurance Protection</Text>
        <LinearGradient
          colors={['#F0FDFA', '#E6F4EA']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.insuranceCoverCard}
        >
          <View style={styles.insCoverHeaderRow}>
            <View style={styles.insCoverIconBox}>
              <MaterialCommunityIcons name="shield-account" size={24} color="#0D9488" />
            </View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={styles.insCoverBadgeText}>YOUR TREES ARE PROTECTED</Text>
              <Text style={styles.insCoverPolicyName}>{projectsHub?.active_project?.insurance_active ? insuranceProtection?.policy_name || 'Green Shield + Green Family Plan' : 'Insurance Verification Pending'}</Text>
            </View>
            <View style={styles.insCoverStatusBadge}>
              <Text style={styles.insCoverStatusBadgeText}>{projectsHub?.active_project?.insurance_active ? 'ACTIVE COVER' : 'PENDING'}</Text>
            </View>
          </View>

          <View style={styles.insCoverDetailsGrid}>
            <View style={styles.insCoverDetailBox}>
              <Text style={styles.insCoverDetailLabel}>PROTECTED TREES</Text>
              <Text style={styles.insCoverDetailVal}>{totalInsuredTreesCount} saplings insured</Text>
            </View>
            <View style={styles.insCoverDetailBox}>
              <Text style={styles.insCoverDetailLabel}>CLAIM ELIGIBILITY</Text>
              <Text style={[styles.insCoverDetailVal, { color: '#0D9488', fontWeight: '800' }]}>{insuranceProtection?.claim_eligibility_percent || 0}% Verified</Text>
            </View>
            <View style={styles.insCoverDetailBox}>
              <Text style={styles.insCoverDetailLabel}>POLICY DURATION</Text>
              <Text style={styles.insCoverDetailVal}>{insuranceProtection?.duration_years || 0} Years</Text>
            </View>
            <View style={styles.insCoverDetailBox}>
              <Text style={styles.insCoverDetailLabel}>EXPIRY DATE</Text>
              <Text style={styles.insCoverDetailVal}>{insuranceProtection?.expiry_date?.split('T')[0] || 'Not active'}</Text>
            </View>
          </View>
        </LinearGradient>



        {/* ================================================= */}
        {/* SECTION 5: EXPLORE OTHER SUSTAINABILITY PROJECTS */}
        {/* ================================================= */}
        <Text style={styles.sectionHeading}>Explore Other Sustainability Projects</Text>
        <View style={styles.searchBarWrapper}>
          <View style={styles.searchBar}>
            <MaterialCommunityIcons name="magnify" size={20} color={COLORS.textSecondary} style={{ marginRight: 8 }} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search other carbon or tree protection programs..."
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

        {isLoading ? (
          <View style={styles.loadingWrapper}>
            <ActivityIndicator color={COLORS.primary} />
            <Text style={styles.loadingText}>Loading real projects...</Text>
          </View>
        ) : exploreProjects.length === 0 ? (
          <View style={styles.emptyStateCard}>
            <MaterialCommunityIcons name="sprout" size={44} color="#94A3B8" />
            <Text style={styles.emptyStateTitle}>No real projects found</Text>
            <Text style={styles.emptyStateDesc}>Create a project from admin to show it here.</Text>
          </View>
        ) : (
          exploreProjects.map((proj) => {
            const isJoined = getProjectLiveStatus(proj);

            return (
              <View
                key={proj.id}
                style={[
                  styles.exploreCard,
                  proj.type === 'Carbon Capture' ? styles.borderCarbon : styles.borderInsurance
                ]}
              >
                <View style={styles.exploreCardHeader}>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.exploreCategoryText, { color: proj.type === 'Carbon Capture' ? COLORS.primaryLight : COLORS.secondary }]}>
                      {proj.category}
                    </Text>
                    <Text style={styles.exploreTitleText}>{proj.name}</Text>
                  </View>
                  <View style={[styles.joinedBadge, isJoined ? styles.badgeJoined : styles.badgeNotJoined]}>
                    <Text style={[isJoined ? styles.badgeJoinedText : styles.badgeNotJoinedText]}>
                      {isJoined ? 'Active Tracking' : 'Available'}
                    </Text>
                  </View>
                </View>

                <Text style={styles.exploreDescText} numberOfLines={2}>{proj.description}</Text>

                {/* Metrics divisions based on project type */}
                {proj.type === 'Carbon Capture' ? (
                  <View style={styles.exploreMetricsRow}>
                    <View style={styles.detailPill}>
                      <MaterialCommunityIcons name="map-marker-outline" size={11} color={COLORS.textSecondary} />
                      <Text style={styles.detailPillText}>{proj.district}</Text>
                    </View>
                    <View style={styles.detailPill}>
                      <MaterialCommunityIcons name="gate" size={11} color={COLORS.textSecondary} />
                      <Text style={styles.detailPillText}>{proj.totalLandArea}</Text>
                    </View>
                    <View style={styles.detailPill}>
                      <MaterialCommunityIcons name="molecule-co2" size={11} color={COLORS.textSecondary} />
                      <Text style={styles.detailPillText}>{(proj.carbonEstimatedAnnual ?? 0).toLocaleString()} CO₂e</Text>
                    </View>
                  </View>
                ) : (
                  <View style={styles.exploreMetricsRow}>
                    <View style={styles.detailPill}>
                      <MaterialCommunityIcons name="tree" size={11} color={COLORS.textSecondary} />
                      <Text style={styles.detailPillText}>{(proj.totalTreesInsured ?? 0).toLocaleString()} Insured</Text>
                    </View>
                    <View style={styles.detailPill}>
                      <MaterialCommunityIcons name="account-group" size={11} color={COLORS.textSecondary} />
                      <Text style={styles.detailPillText}>{proj.farmersProtected} Farmers</Text>
                    </View>
                    <View style={styles.detailPill}>
                      <MaterialCommunityIcons name="shield-outline" size={11} color={COLORS.textSecondary} />
                      <Text style={styles.detailPillText}>{proj.climateProtectionCoverage}</Text>
                    </View>
                  </View>
                )}

                <View style={styles.exploreDivider} />

                <View style={styles.exploreFooterRow}>
                  <TouchableOpacity
                    style={styles.exploreDetailsBtn}
                    onPress={() => {
                      setSelectedProject(proj);
                      setActiveTimelineNode(getFirstPendingStepOrder(proj.roadmapSteps));
                      setIsDetailOpen(true);
                    }}
                  >
                    <Text style={[styles.exploreDetailsBtnText, { color: proj.type === 'Carbon Capture' ? COLORS.primary : COLORS.secondary }]}>
                      View Program Roadmap
                    </Text>
                  </TouchableOpacity>

                  {!isJoined ? (
                    <TouchableOpacity
                      style={styles.exploreJoinBtn}
                      onPress={() => {
                        if (proj.type === 'Carbon Capture') {
                          handleJoinProject(proj);
                        } else {
                          Alert.alert(
                            'Opt-In Insurance',
                            'To protect your boundary saplings under this program, activate dynamic tree insurance policies sowed in land registration.',
                            [
                              { text: 'Cancel', style: 'cancel' },
                              { text: 'Launch Registration Policy', onPress: () => router.push('/insurance' as any) },
                            ]
                          );
                        }
                      }}
                      disabled={joiningId !== null}
                    >
                      <LinearGradient
                        colors={proj.type === 'Carbon Capture' ? [COLORS.primary, COLORS.secondary] : ['#0F766E', '#0D9488']}
                        style={styles.exploreJoinBtnGrad}
                      >
                        {joiningId === proj.id ? (
                          <ActivityIndicator size="small" color="#FFFFFF" />
                        ) : (
                          <>
                            <MaterialCommunityIcons name="plus-circle" size={13} color="#FFFFFF" style={{ marginRight: 4 }} />
                            <Text style={styles.exploreJoinBtnText}>Join Mission</Text>
                          </>
                        )}
                      </LinearGradient>
                    </TouchableOpacity>
                  ) : (
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                      <View style={styles.exploreActiveBadge}>
                        <MaterialCommunityIcons name="radar" size={13} color={COLORS.success} style={{ marginRight: 4 }} />
                        <Text style={styles.exploreActiveBadgeText}>Active Tracking</Text>
                      </View>
                    </View>
                  )}
                </View>
              </View>
            );
          })
        )}
        <View style={{ height: 40 }} />
      </ScrollView>
      ) : (
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} colors={[COLORS.primary]} />
          }
        >
          {/* Lands tab content */}
          <View style={styles.landsTabHeaderRow}>
            <Text style={styles.sectionHeading}>Registered Land Parcels</Text>
            <TouchableOpacity
              style={styles.addLandTabBtn}
              onPress={() => DeviceEventEmitter.emit('openGlobalScheduler')}
            >
              <MaterialCommunityIcons name="map-marker-plus" size={16} color="#FFFFFF" style={{ marginRight: 4 }} />
              <Text style={styles.addLandTabBtnText}>Add Land</Text>
            </TouchableOpacity>
          </View>

          {/* Filters Chips Shelf */}
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false} 
            contentContainerStyle={styles.filterChipsRow as any}
          >
            {['All', 'Pending', 'Under Review', 'Approved', 'Rejected'].map((filterItem) => {
              const isActive = selectedFilter === filterItem;
              return (
                <TouchableOpacity
                  key={filterItem}
                  style={[styles.filterChip, isActive && styles.filterChipActive] as any}
                  onPress={() => setSelectedFilter(filterItem)}
                >
                  <Text style={[styles.filterChipText, isActive && styles.filterChipTextActive] as any}>
                    {filterItem}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {plots.length === 0 ? (
            <View style={styles.emptyLandsCard}>
              <MaterialCommunityIcons name="image-filter-hdr" size={60} color={COLORS.border} />
              <Text style={styles.emptyLandsTitle}>No land parcels registered yet</Text>
              <Text style={styles.emptyLandsDesc}>
                Register your agricultural land to enroll in carbon capture programs and claim carbon payouts.
              </Text>
              <TouchableOpacity
                style={styles.emptyLandsBtn}
                onPress={() => DeviceEventEmitter.emit('openGlobalScheduler')}
              >
                <Text style={styles.emptyLandsBtnText}>Register Your First Plot</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.landsGrid}>
              {(() => {
                const filteredPlots = plots.filter((plot) => {
                  if (selectedFilter === 'All') return true;
                  const s = (plot.status || '').toLowerCase();
                  if (selectedFilter === 'Pending') return s === 'pending' || s === 'submitted';
                  if (selectedFilter === 'Under Review') return s === 'under_review' || s === 'auditing';
                  if (selectedFilter === 'Approved') return s === 'approved' || s === 'verified' || s === 'project_assigned';
                  if (selectedFilter === 'Rejected') return s === 'rejected' || s === 'correction_required';
                  return true;
                });

                if (filteredPlots.length === 0) {
                  return (
                    <View style={{ flex: 1, padding: 30, alignItems: 'center', justifyContent: 'center', width: width - 32 }}>
                      <MaterialCommunityIcons name="filter-remove-outline" size={32} color={COLORS.textSecondary} />
                      <Text style={{ fontSize: 13, color: COLORS.textSecondary, fontWeight: '700', marginTop: 10 }}>
                        No lands match the selected filter.
                      </Text>
                    </View>
                  );
                }

                return filteredPlots.map((plot) => {
                  const statusLower = (plot.status || '').toLowerCase().replace(/\s+/g, '_');
                  let statusColor = COLORS.primary;
                  let displayLabel = plot.status;

                  if (statusLower === 'pending' || statusLower === 'submitted') {
                    statusColor = COLORS.warning;
                    displayLabel = 'Submitted';
                  } else if (statusLower === 'rejected') {
                    statusColor = COLORS.danger;
                    displayLabel = 'Rejected';
                  } else if (statusLower === 'under_review' || statusLower === 'auditing') {
                    statusColor = '#3B82F6';
                    displayLabel = 'Under Review';
                  } else if (statusLower === 'correction_required') {
                    statusColor = '#EA580C';
                    displayLabel = 'Correction Req.';
                  } else if (statusLower === 'verified' || statusLower === 'approved') {
                    statusColor = COLORS.success;
                    displayLabel = 'Approved';
                  } else if (statusLower === 'project_assigned') {
                    statusColor = '#8B5CF6';
                    displayLabel = 'Project Assigned';
                  }

                  const isApproved = statusLower === 'approved' || statusLower === 'verified' || statusLower === 'project_assigned';
                  const totalTreeCount = plot.trees ? plot.trees.reduce((acc, t) => acc + (t.count || 0), 0) : 0;

                  return (
                    <TouchableOpacity
                      key={plot.id}
                      style={styles.landCard}
                      onPress={() => {
                        setSelectedPlot(plot);
                        setTrackingModalVisible(true);
                      }}
                    >
                      <View style={styles.landCardHeader}>
                        <View style={styles.landCardIconWrapper}>
                          <MaterialCommunityIcons name="image-filter-hdr" size={22} color={COLORS.primary} />
                        </View>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                          {isApproved && (
                            <MaterialCommunityIcons name="shield-check" size={14} color={COLORS.success} />
                          )}
                          <View style={[styles.landStatusBadge, { backgroundColor: `${statusColor}15` }]}>
                            <Text style={[styles.landStatusText, { color: statusColor, fontSize: 9, fontWeight: '800' }]}>
                              {displayLabel}
                            </Text>
                          </View>
                        </View>
                      </View>

                      <Text style={styles.landCardTitle} numberOfLines={1}>{plot.name || `${plot.acres} Acres Farm`}</Text>
                      <Text style={styles.landCardKhasra}>Khasra: {plot.khasraNumber || 'N/A'} • {plot.acres} Acres</Text>
                      <Text style={styles.landCardLocation} numberOfLines={1}>
                        {plot.village || 'Unknown'}, {plot.district || 'Unknown'}
                      </Text>

                      <View style={styles.dottedDivider} />
                      <Text style={styles.cropTreeSummaryText as any} numberOfLines={1}>
                        🌾 {plot.cropType || 'Crop: Pending'} • 🌳 {totalTreeCount} Trees
                      </Text>

                      <View style={styles.landCardFooter}>
                        <Text style={styles.trackProgressText}>Track Verification</Text>
                        <MaterialCommunityIcons name="chevron-right" size={14} color={COLORS.primary} />
                      </View>
                    </TouchableOpacity>
                  );
                });
              })()}
            </View>
          )}

          {/* Verification Process Help Card */}
          <View style={styles.verificationGuideCard}>
            <View style={styles.guideHeader}>
              <MaterialCommunityIcons name="information" size={20} color={COLORS.primary} style={{ marginRight: 8 }} />
              <Text style={styles.guideTitle}>Verification Guide</Text>
            </View>
            <Text style={styles.guideDesc}>
              Every land parcel goes through a standard 3-step compliance process: GIS Geofencing, Physical Soil Baseline audit, and final Admin verification. Ensure documents are clear to avoid delay.
            </Text>
          </View>
          <View style={{ height: 40 }} />
        </ScrollView>
      )}

      {selectedPlot && (
        <TrackingModal
          visible={trackingModalVisible}
          onClose={() => setTrackingModalVisible(false)}
          plotId={selectedPlot.id}
          status={selectedPlot.status}
        />
      )}

      {/* ================================================= */}
      {/* 6. HIGH-FIDELITY PROJECTS DETAIL SLIDE MODAL */}
      {/* ================================================= */}
      <Modal
        visible={isDetailOpen}
        transparent
        animationType="slide"
        onRequestClose={() => {
          setIsDetailOpen(false);
          setSelectedProject(null);
        }}
      >
        <View style={styles.modalBackdrop}>
          <TouchableOpacity
            style={StyleSheet.absoluteFill}
            activeOpacity={1}
            onPress={() => {
              setIsDetailOpen(false);
              setSelectedProject(null);
            }}
          />
          <View style={styles.sheet}>
            {selectedProject && (
              <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={[styles.detailScroll, { paddingBottom: 40 + insets.bottom }]}>
                {/* Header Banner */}
                <LinearGradient
                  colors={selectedProject.type === 'Carbon Capture' ? ['#022C22', '#064E3B'] : ['#042F2E', '#0F766E']}
                  style={styles.modalBanner}
                >
                  <View style={styles.modalHeaderRow}>
                    <View style={styles.modalLogoCircle}>
                      <MaterialCommunityIcons
                        name={selectedProject.type === 'Carbon Capture' ? 'molecule-co2' : 'shield-check-outline'}
                        size={28}
                        color={selectedProject.type === 'Carbon Capture' ? COLORS.primary : COLORS.secondary}
                      />
                    </View>
                    <View style={{ flex: 1, marginLeft: 14 }}>
                      <Text style={styles.modalLabel}>{selectedProject.category}</Text>
                      <Text style={styles.modalTitle}>{selectedProject.name}</Text>
                    </View>
                    <TouchableOpacity
                      onPress={() => {
                        setIsDetailOpen(false);
                        setSelectedProject(null);
                      }}
                      style={styles.closeBtn}
                    >
                      <MaterialCommunityIcons name="close" size={24} color="#FFFFFF" />
                    </TouchableOpacity>
                  </View>

                  {/* Highlights row */}
                  <View style={styles.modalHighlightsRow}>
                    <View style={styles.modalBadge}>
                      <MaterialCommunityIcons name="calendar-range" size={12} color="#84CC16" style={{ marginRight: 4 }} />
                      <Text style={styles.modalBadgeText}>{selectedProject.duration}</Text>
                    </View>
                    <View style={styles.modalBadge}>
                      <MaterialCommunityIcons name="map-marker-radius" size={12} color="#84CC16" style={{ marginRight: 4 }} />
                      <Text style={styles.modalBadgeText}>{selectedProject.district}</Text>
                    </View>
                    <View style={[styles.modalBadge, { backgroundColor: '#84CC16' }]}>
                      <Text style={[styles.modalBadgeText, { color: '#022C22', fontWeight: '900' }]}>
                        {getProjectLiveStatus(selectedProject) ? 'PARTICIPATING' : 'AVAILABLE'}
                      </Text>
                    </View>
                  </View>
                </LinearGradient>

                {/* Onboarding connection callout */}
                <LinearGradient
                  colors={['#ECFDF5', '#F0FDFA']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.flowConnectionBanner}
                >
                  <View style={styles.flowConnectionHeader}>
                    <MaterialCommunityIcons name="swap-horizontal" size={18} color="#047857" style={{ marginRight: 6 }} />
                    <Text style={styles.flowConnectionTitle}>BHUMICRED TWIN ONBOARDING ECOSYSTEM</Text>
                  </View>
                  <Text style={styles.flowConnectionDesc}>
                    Both carbon auditing and tree insurance are operationally connected during land registrations. 
                    Your registered land coordinates feed directly into satellite carbon carbon credit programs while cover policies protect trees sowed on the exact same plots.
                  </Text>
                </LinearGradient>

                {/* Objective */}
                <View style={styles.detailSection}>
                  <Text style={styles.detailSectionLabel}>Project Mission Objective</Text>
                  <Text style={styles.detailBodyText}>{selectedProject.objective}</Text>
                  <Text style={[styles.detailBodyText, { marginTop: 8, color: COLORS.textSecondary }]}>
                    {selectedProject.description}
                  </Text>
                </View>

                {/* Separate Analytics Grids */}
                {selectedProject.type === 'Carbon Capture' ? (
                  <View style={styles.analyticsSection}>
                    <Text style={styles.detailSectionLabel}>Carbon Sequestration Indicators</Text>
                    <View style={styles.analyticsGrid}>
                      <View style={styles.analyticBox}>
                        <Text style={styles.analyticLabel}>REGISTERED LAND SCALE</Text>
                        <Text style={styles.analyticVal}>{selectedProject.totalLandArea || '0 Acres'}</Text>
                      </View>
                      <View style={styles.analyticBox}>
                        <Text style={styles.analyticLabel}>TOTAL MAPPED TREES</Text>
                        <Text style={styles.analyticVal}>{(selectedProject.totalTreesRegistered ?? 0).toLocaleString()} Trees</Text>
                      </View>
                      <View style={styles.analyticBox}>
                        <Text style={styles.analyticLabel}>AGROFORESTRY ACTIVE</Text>
                        <Text style={styles.analyticVal}>{selectedProject.agroforestryParticipation ? 'Yes (Canopy Sponges)' : 'No (Standard crop)'}</Text>
                      </View>
                      <View style={styles.analyticBox}>
                        <Text style={styles.analyticLabel}>PLANTATION DENSITY</Text>
                        <Text style={styles.analyticVal}>{selectedProject.plantationDensity || 'Pending verification'}</Text>
                      </View>
                      <View style={styles.analyticBox}>
                        <Text style={styles.analyticLabel}>ESTIMATED ANNUAL CREDITS</Text>
                        <Text style={[styles.analyticVal, { color: COLORS.primary }]}>
                          {(selectedProject.carbonEstimatedAnnual ?? 0).toLocaleString()} CO₂e
                        </Text>
                      </View>
                      <View style={styles.analyticBox}>
                        <Text style={styles.analyticLabel}>MRV VERIFICATION PROGRESS</Text>
                        <Text style={[styles.analyticVal, { color: COLORS.success }]}>{selectedProject.mrvVerificationProgress ?? 0}%</Text>
                      </View>
                    </View>
                  </View>
                ) : (
                  <View style={styles.analyticsSection}>
                    <Text style={styles.detailSectionLabel}>Plantation Insurance & Risk Indicators</Text>
                    <View style={styles.analyticsGrid}>
                      <View style={styles.analyticBox}>
                        <Text style={styles.analyticLabel}>TOTAL TREES INSURED</Text>
                        <Text style={styles.analyticVal}>{(selectedProject.totalTreesInsured ?? 0).toLocaleString()} Trees</Text>
                      </View>
                      <View style={styles.analyticBox}>
                        <Text style={styles.analyticLabel}>PROTECTED FARMERS</Text>
                        <Text style={styles.analyticVal}>{selectedProject.farmersProtected} Farmers</Text>
                      </View>
                      <View style={styles.analyticBox}>
                        <Text style={styles.analyticLabel}>COVERED VILLAGES</Text>
                        <Text style={styles.analyticVal}>{selectedProject.villagesCovered} Villages</Text>
                      </View>
                      <View style={styles.analyticBox}>
                        <Text style={styles.analyticLabel}>DISTRICT COVERAGE</Text>
                        <Text style={styles.analyticVal}>{selectedProject.districtCoverage} Districts</Text>
                      </View>
                      <View style={styles.analyticBox}>
                        <Text style={styles.analyticLabel}>CLIMATE POLICY GUARANTEE</Text>
                        <Text style={[styles.analyticVal, { color: COLORS.secondary }]}>{selectedProject.climateProtectionCoverage}</Text>
                      </View>
                      <View style={styles.analyticBox}>
                        <Text style={styles.analyticLabel}>TREE SURVIVAL RATE</Text>
                        <Text style={[styles.analyticVal, { color: COLORS.success }]}>{selectedProject.treeSurvivalRate || 95}% Target</Text>
                      </View>
                    </View>
                  </View>
                )}

                {/* Journey Timeline */}
                <View style={styles.timelineSection}>
                  <View style={styles.timelineHeaderRow}>
                    <Text style={styles.detailSectionLabel}>Roadmap Journey Timeline</Text>
                    <View style={styles.timelinePercentBadge}>
                      <Text style={styles.timelinePercentBadgeText}>
                        {getProjectLiveStatus(selectedProject)
                          ? `${selectedProject.roadmapSteps.filter((step) => step.completed).length}/9 Completed`
                          : '0/9 Completed'}
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.timelineSubtitle}>
                    {selectedProject.type === 'Carbon Capture'
                      ? 'Expand nodes to review GIS Soil Organic Carbon (SOC) lab baselines.'
                      : 'Expand nodes to review geocoded drone tree survival health indexes.'}
                  </Text>

                  <View style={styles.verticalTimeline}>
                    {(() => {
                      const firstPendingOrder = getFirstPendingStepOrder(selectedProject.roadmapSteps);
                      return selectedProject.roadmapSteps.map((node) => {
                        // Completion is read directly from the backend's independent
                        // per-stage status — never derived from position/index.
                        // "active" is purely a cosmetic "what's next" highlight.
                        let nodeStatus: 'done' | 'active' | 'lock' = 'lock';
                        if (node.completed) nodeStatus = 'done';
                        else if (node.order === firstPendingOrder) nodeStatus = 'active';

                        const isExpanded = activeTimelineNode === node.order;
                        const hasLog = node.log;

                        return (
                          <View key={node.key} style={styles.timelineNodeRow}>
                            <View style={styles.bulletConnectorCol}>
                              <TouchableOpacity
                                style={[
                                  styles.nodeCircle,
                                  nodeStatus === 'done' && styles.nodeCircleDone,
                                  nodeStatus === 'active' && styles.nodeCircleActive,
                                  nodeStatus === 'lock' && styles.nodeCircleLock,
                                ]}
                                onPress={() => setActiveTimelineNode(isExpanded ? null : node.order)}
                              >
                                {nodeStatus === 'done' && <MaterialCommunityIcons name="check" size={11} color="#FFFFFF" />}
                                {nodeStatus === 'active' && <View style={styles.nodeActiveDot} />}
                                {nodeStatus === 'lock' && <MaterialCommunityIcons name="lock-outline" size={10} color="#94A3B8" />}
                              </TouchableOpacity>
                              {node.order < 9 && (
                                <View
                                  style={[
                                    styles.nodeConnectorLine,
                                    nodeStatus === 'done' && styles.nodeConnectorLineDone,
                                  ]}
                                />
                              )}
                            </View>

                            <TouchableOpacity
                              style={[styles.nodeContentCard, isExpanded && styles.nodeContentCardExpanded]}
                              onPress={() => setActiveTimelineNode(isExpanded ? null : node.order)}
                            >
                              <View style={styles.nodeCardHeader}>
                                <Text
                                  style={[
                                    styles.nodeCardTitleText,
                                    nodeStatus === 'active' && styles.nodeCardTitleTextActive,
                                  ]}
                                >
                                  {node.order}. {node.title}
                                </Text>
                                <MaterialCommunityIcons
                                  name={isExpanded ? 'chevron-up' : 'chevron-down'}
                                  size={16}
                                  color={COLORS.textSecondary}
                                />
                              </View>
                              <Text style={styles.nodeCardDescText}>{node.desc}</Text>

                              {isExpanded && (
                                <View style={styles.logSlideDrawer}>
                                  <View style={styles.logDivider} />
                                  {hasLog ? (
                                    <View>
                                      <View style={styles.logMetaRow}>
                                        <Text style={styles.logMetaText}>AUDITOR: {hasLog.inspector}</Text>
                                        <Text style={styles.logMetaText}>{hasLog.date}</Text>
                                      </View>
                                      <Text style={styles.logBodyText}>“{hasLog.data}”</Text>
                                    </View>
                                  ) : (
                                    <View style={styles.logEmpty}>
                                      <MaterialCommunityIcons name="clock-outline" size={14} color="#94A3B8" style={{ marginRight: 6 }} />
                                      <Text style={styles.logEmptyText}>Ecosystem calibration pending.</Text>
                                    </View>
                                  )}
                                </View>
                              )}
                            </TouchableOpacity>
                          </View>
                        );
                      });
                    })()}
                  </View>
                </View>

                {/* NGO & CORPORATE PARTNERS */}
                <View style={styles.supportSection}>
                  <Text style={styles.detailSectionLabel}>NGO & Corporate Supporting Sponsors</Text>
                  <View style={styles.supportBadgesRow}>
                    <View style={styles.supportBadgeItem}>
                      <View style={styles.supportBadgeIcon}>
                        <MaterialCommunityIcons name="heart-outline" size={18} color={selectedProject.type === 'Carbon Capture' ? COLORS.primary : COLORS.secondary} />
                      </View>
                      <Text style={styles.supportBadgeTitle}>SUPPORTED BY</Text>
                      <Text style={styles.supportBadgeVal}>{selectedProject.supportedBy.ngo}</Text>
                    </View>
                    <View style={styles.supportBadgeItem}>
                      <View style={styles.supportBadgeIcon}>
                        <MaterialCommunityIcons name="handshake-outline" size={18} color={selectedProject.type === 'Carbon Capture' ? COLORS.primary : COLORS.secondary} />
                      </View>
                      <Text style={styles.supportBadgeTitle}>POWERED BY</Text>
                      <Text style={styles.supportBadgeVal}>{selectedProject.supportedBy.partner}</Text>
                    </View>
                    <View style={styles.supportBadgeItem}>
                      <View style={styles.supportBadgeIcon}>
                        <MaterialCommunityIcons name="bank-outline" size={18} color={selectedProject.type === 'Carbon Capture' ? COLORS.primary : COLORS.secondary} />
                      </View>
                      <Text style={styles.supportBadgeTitle}>GOVT BODY</Text>
                      <Text style={styles.supportBadgeVal}>{selectedProject.supportedBy.govt}</Text>
                    </View>
                  </View>
                </View>

                {/* MANAGER CARD */}
                <View style={styles.managerSection}>
                  <Text style={styles.detailSectionLabel}>BhumiCred Program Leader</Text>
                  <View style={styles.managerCard}>
                    <View style={styles.managerAvatarBox}>
                      <MaterialCommunityIcons name="account-tie" size={28} color={selectedProject.type === 'Carbon Capture' ? COLORS.primary : COLORS.secondary} />
                    </View>
                    <View style={{ flex: 1, marginLeft: 12 }}>
                      <Text style={styles.managerName}>{selectedProject.projectManager.name}</Text>
                      <Text style={styles.managerRole}>{selectedProject.projectManager.designation}</Text>
                      <Text style={styles.managerTeam}>{selectedProject.projectManager.team}</Text>
                    </View>
                    <View style={styles.managerContactRow}>
                      <TouchableOpacity
                        style={[
                          styles.contactBtn,
                          { backgroundColor: selectedProject.type === 'Carbon Capture' ? COLORS.primary : COLORS.secondary }
                        ]}
                        onPress={() => setIsManagerChatOpen(true)}
                      >
                        <MaterialCommunityIcons name="message-text-outline" size={18} color="#FFFFFF" />
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>

                {/* ACTION TRIGGER BUTTONS */}
                <View style={styles.sheetActionsPanel}>
                  {getProjectLiveStatus(selectedProject) ? (
                    <TouchableOpacity
                      style={[
                        styles.sheetSecondaryBtn,
                        { borderColor: selectedProject.type === 'Carbon Capture' ? COLORS.success : COLORS.secondary }
                      ]}
                      onPress={() => {
                        setIsDetailOpen(false);
                        setSelectedProject(null);
                      }}
                    >
                      <Text
                        style={[
                          styles.sheetSecondaryBtnText,
                          { color: selectedProject.type === 'Carbon Capture' ? COLORS.success : COLORS.secondary }
                        ]}
                      >
                        Currently Enrolled & Active
                      </Text>
                    </TouchableOpacity>
                  ) : (
                    <TouchableOpacity
                      style={styles.sheetPrimaryBtn}
                      onPress={() => {
                        if (selectedProject.type === 'Carbon Capture') {
                          handleJoinProject(selectedProject);
                        } else {
                          setIsDetailOpen(false);
                          Alert.alert(
                            'Opt-In Insurance',
                            'To protect your boundary saplings under this program, activate dynamic tree insurance policies sowed in land registration.',
                            [
                              { text: 'Cancel', style: 'cancel' },
                              { text: 'Launch Registration Policy', onPress: () => router.push('/insurance' as any) },
                            ]
                          );
                        }
                      }}
                      disabled={joiningId !== null}
                    >
                      <LinearGradient
                        colors={selectedProject.type === 'Carbon Capture' ? [COLORS.primary, COLORS.secondary] : ['#0F766E', '#0D9488']}
                        style={styles.sheetPrimaryBtnGrad}
                      >
                        {joiningId === selectedProject.id ? (
                          <ActivityIndicator size="small" color="#FFFFFF" />
                        ) : (
                          <>
                            <MaterialCommunityIcons name="plus-circle" size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
                            <Text style={styles.sheetPrimaryBtnText}>Join Sustainability Mission</Text>
                          </>
                        )}
                      </LinearGradient>
                    </TouchableOpacity>
                  )}
                </View>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

      <ManagerChatModal
        visible={isManagerChatOpen}
        onClose={() => setIsManagerChatOpen(false)}
        managerName={selectedProject?.projectManager.name}
        managerRole={selectedProject?.projectManager.designation}
      />
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
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    ...SHADOWS.soft,
  },
  headerInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  headerSubtitle: {
    fontSize: 10,
    color: '#A7F3D0',
    fontWeight: '600',
    marginTop: 2,
  },
  ecoImpactBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.18)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  ecoImpactText: {
    fontSize: 8,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 14,
  },
  sectionHeading: {
    fontSize: 11,
    color: COLORS.textSecondary,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 10,
    marginTop: 14,
    marginLeft: 4,
  },
  activeProjectCard: {
    borderRadius: 20,
    padding: 16,
    borderWidth: 1.5,
    borderColor: COLORS.accent,
    ...SHADOWS.limeGlow,
    marginBottom: 14,
  },
  activeHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  activeLogoWrapper: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(132,204,22,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#84CC16',
  },
  activeBadgeText: {
    fontSize: 8,
    fontWeight: '900',
    color: '#84CC16',
    letterSpacing: 0.5,
  },
  activeProjectName: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
    marginTop: 2,
  },
  activeDetailsBlock: {
    marginTop: 12,
  },
  activeObjectiveText: {
    fontSize: 12,
    color: '#E0F2F1',
    lineHeight: 17,
    fontWeight: '600',
  },
  connectionChecklist: {
    marginTop: 12,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 14,
    padding: 10,
  },
  checkItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  checkText: {
    fontSize: 11.5,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  activeMetaGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 12,
    justifyContent: 'space-between',
  },
  activeMetaItem: {
    width: '48%',
    marginBottom: 8,
  },
  activeMetaLabel: {
    fontSize: 8,
    fontWeight: '700',
    color: '#A7F3D0',
    letterSpacing: 0.3,
  },
  activeMetaValue: {
    fontSize: 11.5,
    fontWeight: '800',
    color: '#FFFFFF',
    marginTop: 1,
  },
  chipsRow: {
    marginTop: 8,
    paddingVertical: 4,
  },
  statusChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginRight: 6,
  },
  statusChipDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#84CC16',
    marginRight: 6,
  },
  statusChipText: {
    fontSize: 9.5,
    color: '#FFFFFF',
    fontWeight: '800',
  },
  activeCardDivider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.15)',
    marginVertical: 12,
  },
  activeTreeRegisterBox: {
    borderWidth: 1,
    borderColor: 'rgba(132,204,22,0.35)',
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 12,
    padding: 10,
    marginBottom: 12,
  },
  activeTreeRegisterTitle: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  activeTreeRegisterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
  },
  activeTreeInput: {
    width: 84,
    height: 38,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.22)',
    borderRadius: 9,
    color: '#FFFFFF',
    paddingHorizontal: 10,
    fontWeight: '900',
  },
  activeTreeBtn: {
    flex: 1,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#84CC16',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  activeTreeBtnText: {
    color: '#022C22',
    fontSize: 11,
    fontWeight: '900',
  },
  activeTreeRegisterHint: {
    color: 'rgba(255,255,255,0.72)',
    fontSize: 8.5,
    fontWeight: '700',
    marginTop: 7,
    lineHeight: 12,
  },
  activeViewDetailsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
  },
  activeViewDetailsBtnText: {
    color: '#84CC16',
    fontSize: 12,
    fontWeight: '800',
  },
  contributionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  contribBox: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 16,
    padding: 12,
    marginBottom: 10,
    ...SHADOWS.soft,
  },
  contribIconBox: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  contribLabel: {
    fontSize: 8,
    fontWeight: '700',
    color: COLORS.textSecondary,
    letterSpacing: 0.3,
  },
  contribValue: {
    fontSize: 13,
    fontWeight: '900',
    color: COLORS.textDark,
    marginTop: 2,
  },
  insuranceCoverCard: {
    borderRadius: 20,
    padding: 16,
    borderWidth: 1.5,
    borderColor: '#5EEAD4',
    ...SHADOWS.soft,
    marginBottom: 14,
  },
  insCoverHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  insCoverIconBox: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: 'rgba(13,148,136,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  insCoverBadgeText: {
    fontSize: 8,
    fontWeight: '900',
    color: '#0D9488',
    letterSpacing: 0.5,
  },
  insCoverPolicyName: {
    fontSize: 13.5,
    fontWeight: '800',
    color: COLORS.textDark,
    marginTop: 1,
  },
  insCoverStatusBadge: {
    backgroundColor: '#E6F4EA',
    borderWidth: 1,
    borderColor: COLORS.success,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  insCoverStatusBadgeText: {
    fontSize: 8.5,
    fontWeight: '900',
    color: COLORS.success,
  },
  insCoverDetailsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 12,
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255,255,255,0.5)',
    borderRadius: 14,
    padding: 10,
  },
  insCoverDetailBox: {
    width: '48%',
    marginBottom: 6,
  },
  insCoverDetailLabel: {
    fontSize: 8,
    fontWeight: '700',
    color: COLORS.textSecondary,
  },
  insCoverDetailVal: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.textDark,
    marginTop: 1,
  },
  timelineCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 20,
    padding: 14,
    marginBottom: 14,
    ...SHADOWS.soft,
  },
  timelineHeadingDesc: {
    fontSize: 10.5,
    color: COLORS.textSecondary,
    fontWeight: '600',
    marginBottom: 14,
  },
  verticalTimeline: {
    paddingLeft: 4,
  },
  timelineRow: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  bulletCol: {
    width: 24,
    alignItems: 'center',
  },
  timelineCircle: {
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  circleDone: {
    backgroundColor: COLORS.success,
  },
  circleActive: {
    backgroundColor: '#FFFFFF',
    borderWidth: 3.5,
    borderColor: COLORS.accent,
  },
  circleActiveCore: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: COLORS.accent,
  },
  circleLock: {
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  timelineConnector: {
    width: 2,
    flex: 1,
    backgroundColor: '#E2E8F0',
    marginTop: 2,
    marginBottom: -4,
  },
  connectorDone: {
    backgroundColor: COLORS.success,
  },
  timelineContentCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginLeft: 10,
  },
  timelineContentCardExpanded: {
    borderColor: COLORS.primaryLight,
  },
  timelineCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  timelineCardTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.textDark,
  },
  timelineCardTitleActive: {
    color: COLORS.primary,
  },
  timelineCardDesc: {
    fontSize: 9.5,
    color: COLORS.textSecondary,
    fontWeight: '500',
    marginTop: 2,
  },
  drawerLogBlock: {
    marginTop: 6,
  },
  drawerLogDivider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginBottom: 6,
  },
  drawerLogMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  drawerLogMetaText: {
    fontSize: 8,
    fontWeight: '700',
    color: COLORS.primary,
  },
  drawerLogText: {
    fontSize: 9.5,
    color: COLORS.textSecondary,
    fontStyle: 'italic',
    lineHeight: 13,
  },
  drawerLogEmpty: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
  },
  drawerLogEmptyText: {
    fontSize: 9,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  searchBarWrapper: {
    marginTop: 6,
    marginBottom: 12,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 12,
    color: COLORS.textDark,
    padding: 0,
    fontWeight: '600',
  },
  exploreCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderRadius: 20,
    padding: 16,
    marginBottom: 14,
    ...SHADOWS.soft,
  },
  borderCarbon: {
    borderColor: '#E2E8F0',
  },
  borderInsurance: {
    borderColor: '#E2E8F0',
  },
  exploreCardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  exploreCategoryText: {
    fontSize: 9,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  exploreTitleText: {
    fontSize: 13.5,
    fontWeight: '800',
    color: COLORS.textDark,
    marginTop: 2,
  },
  joinedBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  badgeJoined: {
    backgroundColor: '#DCFCE7',
  },
  badgeJoinedText: {
    fontSize: 8.5,
    fontWeight: '900',
    color: COLORS.success,
  },
  badgeNotJoined: {
    backgroundColor: '#F1F5F9',
  },
  badgeNotJoinedText: {
    fontSize: 8.5,
    fontWeight: '900',
    color: COLORS.textSecondary,
  },
  exploreDescText: {
    fontSize: 11.5,
    color: COLORS.textSecondary,
    marginTop: 8,
    lineHeight: 16,
    fontWeight: '500',
  },
  exploreMetricsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 10,
  },
  detailPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginRight: 6,
    marginBottom: 6,
  },
  detailPillText: {
    fontSize: 9.5,
    color: COLORS.textSecondary,
    fontWeight: '700',
    marginLeft: 4,
  },
  exploreDivider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 12,
  },
  exploreFooterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  exploreDetailsBtn: {
    paddingVertical: 6,
  },
  exploreDetailsBtnText: {
    fontSize: 11,
    fontWeight: '800',
  },
  exploreJoinBtn: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  exploreJoinBtnGrad: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  exploreJoinBtnText: {
    fontSize: 10.5,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  exploreActiveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E6F4EA',
    borderWidth: 1,
    borderColor: COLORS.success,
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  exploreActiveBadgeText: {
    fontSize: 10.5,
    fontWeight: '800',
    color: COLORS.success,
  },
  loadingWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    fontSize: 11,
    color: COLORS.textSecondary,
    fontWeight: '700',
    marginTop: 10,
  },
  emptyStateCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
  },
  emptyStateTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.textDark,
    marginTop: 12,
  },
  emptyStateDesc: {
    fontSize: 11,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 16,
    fontWeight: '500',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(2, 44, 34, 0.45)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: COLORS.background,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: height * 0.9,
    minHeight: height * 0.6,
    overflow: 'hidden',
  },
  detailScroll: {
    paddingBottom: 40,
  },
  modalBanner: {
    paddingTop: 24,
    paddingBottom: 20,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  modalHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  modalLogoCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: '#A7F3D0',
    textTransform: 'uppercase',
  },
  modalTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
    marginTop: 2,
  },
  closeBtn: {
    padding: 4,
  },
  modalHighlightsRow: {
    flexDirection: 'row',
    marginTop: 16,
  },
  modalBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginRight: 6,
  },
  modalBadgeText: {
    fontSize: 9.5,
    color: '#FFFFFF',
    fontWeight: '800',
  },
  flowConnectionBanner: {
    marginHorizontal: 20,
    marginTop: 14,
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  flowConnectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  flowConnectionTitle: {
    fontSize: 9,
    fontWeight: '900',
    color: '#065F46',
    letterSpacing: 0.5,
  },
  flowConnectionDesc: {
    fontSize: 10.5,
    color: '#047857',
    fontWeight: '500',
    lineHeight: 15,
  },
  detailSection: {
    paddingHorizontal: 20,
    marginTop: 16,
  },
  detailSectionLabel: {
    fontSize: 11,
    color: COLORS.textSecondary,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  detailBodyText: {
    fontSize: 12,
    color: COLORS.textDark,
    lineHeight: 18,
    fontWeight: '500',
  },
  analyticsSection: {
    paddingHorizontal: 20,
    marginTop: 18,
  },
  analyticsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  analyticBox: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 14,
    padding: 10,
    marginBottom: 10,
  },
  analyticLabel: {
    fontSize: 8,
    fontWeight: '700',
    color: COLORS.textSecondary,
  },
  analyticVal: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.textDark,
    marginTop: 2,
  },
  timelineSection: {
    paddingHorizontal: 20,
    marginTop: 14,
  },
  timelineHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  timelinePercentBadge: {
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: COLORS.primaryLight,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  timelinePercentBadgeText: {
    fontSize: 9.5,
    fontWeight: '800',
    color: COLORS.primary,
  },
  timelineSubtitle: {
    fontSize: 10.5,
    color: COLORS.textSecondary,
    fontWeight: '600',
    marginBottom: 14,
  },
  timelineNodeRow: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  bulletConnectorCol: {
    width: 24,
    alignItems: 'center',
  },
  nodeCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  nodeCircleDone: {
    backgroundColor: COLORS.success,
  },
  nodeCircleActive: {
    backgroundColor: '#FFFFFF',
    borderWidth: 4,
    borderColor: COLORS.accent,
  },
  nodeActiveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.accent,
  },
  nodeCircleLock: {
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  nodeConnectorLine: {
    width: 2.5,
    flex: 1,
    backgroundColor: '#E2E8F0',
    marginTop: 2,
    marginBottom: -4,
  },
  nodeConnectorLineDone: {
    backgroundColor: COLORS.success,
  },
  nodeContentCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginLeft: 10,
  },
  nodeContentCardExpanded: {
    borderColor: COLORS.primaryLight,
  },
  nodeCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  nodeCardTitleText: {
    fontSize: 11.5,
    fontWeight: '800',
    color: COLORS.textDark,
  },
  nodeCardTitleTextActive: {
    color: COLORS.primary,
  },
  nodeCardDescText: {
    fontSize: 9.5,
    color: COLORS.textSecondary,
    fontWeight: '500',
    marginTop: 2,
  },
  logSlideDrawer: {
    marginTop: 8,
  },
  logDivider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginBottom: 6,
  },
  logMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  logMetaText: {
    fontSize: 8,
    fontWeight: '700',
    color: COLORS.primary,
  },
  logBodyText: {
    fontSize: 9.5,
    color: COLORS.textSecondary,
    fontStyle: 'italic',
    lineHeight: 13,
  },
  logEmpty: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
  },
  logEmptyText: {
    fontSize: 9,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  supportSection: {
    paddingHorizontal: 20,
    marginTop: 18,
  },
  supportBadgesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  supportBadgeItem: {
    width: '31%',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    padding: 8,
    alignItems: 'center',
  },
  supportBadgeIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#F0FDF4',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  supportBadgeTitle: {
    fontSize: 7.5,
    fontWeight: '700',
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  supportBadgeVal: {
    fontSize: 9.5,
    fontWeight: '800',
    color: COLORS.textDark,
    textAlign: 'center',
    marginTop: 2,
  },
  managerSection: {
    paddingHorizontal: 20,
    marginTop: 18,
  },
  managerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 16,
    padding: 12,
  },
  managerAvatarBox: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  managerName: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.textDark,
  },
  managerRole: {
    fontSize: 9.5,
    color: COLORS.textSecondary,
    fontWeight: '600',
    marginTop: 1,
  },
  managerTeam: {
    fontSize: 9,
    color: COLORS.primaryLight,
    fontWeight: '700',
    marginTop: 1,
  },
  managerContactRow: {
    justifyContent: 'center',
  },
  contactBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sheetActionsPanel: {
    paddingHorizontal: 20,
    marginTop: 24,
  },
  sheetPrimaryBtn: {
    borderRadius: 24,
    overflow: 'hidden',
    ...SHADOWS.soft,
  },
  sheetPrimaryBtnGrad: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
  },
  sheetPrimaryBtnText: {
    fontSize: 12.5,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  sheetSecondaryBtn: {
    backgroundColor: '#E6F4EA',
    borderWidth: 1.5,
    borderRadius: 24,
    paddingVertical: 13,
    alignItems: 'center',
  },
  sheetSecondaryBtnText: {
    fontSize: 12.5,
    fontWeight: '800',
  },
  treeActionCard: {
    borderWidth: 1,
    borderColor: '#B7E4D4',
    backgroundColor: '#F0FDF4',
    borderRadius: 14,
    padding: 12,
  },
  treeActionTitle: {
    fontSize: 11,
    fontWeight: '900',
    color: COLORS.primary,
    textTransform: 'uppercase',
  },
  treeActionHint: {
    fontSize: 9,
    color: COLORS.textSecondary,
    fontWeight: '600',
    marginTop: 4,
    lineHeight: 13,
  },
  treeActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 10,
  },
  treeCountInput: {
    width: 86,
    height: 40,
    borderWidth: 1,
    borderColor: '#B7E4D4',
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 10,
    color: COLORS.textDark,
    fontWeight: '800',
  },
  treeSubmitBtn: {
    flex: 1,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  treeSubmitText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '900',
  },
  tabSwitcherContainer: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    padding: 4,
    marginHorizontal: 16,
    marginVertical: 12,
  },
  switcherTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 10,
  },
  switcherTabActive: {
    backgroundColor: COLORS.primary,
    ...SHADOWS.small,
  },
  switcherTabText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: COLORS.textSecondary,
  },
  switcherTabTextActive: {
    color: '#FFFFFF',
  },
  landsTabHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    marginTop: 4,
  },
  addLandTabBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    ...SHADOWS.small,
  },
  addLandTabBtnText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
  },
  emptyLandsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 20,
  },
  emptyLandsTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.textDark,
    marginTop: 12,
  },
  emptyLandsDesc: {
    fontSize: 11.5,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 17,
    paddingHorizontal: 16,
  },
  emptyLandsBtn: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    marginTop: 16,
  },
  emptyLandsBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
  landsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 20,
  },
  landCard: {
    width: (width - 44) / 2, // 2 columns minus gap and margins
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    padding: 12,
    ...SHADOWS.small,
  },
  landCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  landCardIconWrapper: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  landStatusBadge: {
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
  },
  landStatusText: {
    fontSize: 9,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  landCardTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.textDark,
  },
  landCardKhasra: {
    fontSize: 11,
    color: COLORS.textSecondary,
    fontWeight: '600',
    marginTop: 2,
  },
  landCardLocation: {
    fontSize: 10,
    color: '#64748B',
    marginTop: 4,
  },
  landCardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#F8FAFC',
    marginTop: 10,
    paddingTop: 8,
  },
  trackProgressText: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.primary,
  },
  verificationGuideCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 12,
    marginTop: 8,
  },
  guideHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  guideTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.textDark,
  },
  guideDesc: {
    fontSize: 10.5,
    color: COLORS.textSecondary,
    lineHeight: 15,
  },
  filterChipsRow: {
    paddingHorizontal: 4,
    gap: 8,
    marginBottom: 14,
    flexDirection: 'row',
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginRight: 6,
  },
  filterChipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  filterChipText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textSecondary,
  },
  filterChipTextActive: {
    color: '#FFFFFF',
  },
  cropTreeSummaryText: {
    fontSize: 10,
    color: COLORS.textSecondary,
    fontWeight: '600',
    marginVertical: 4,
  },
  dottedDivider: {
    height: 1,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    borderStyle: 'dashed',
    marginVertical: 6,
  },
});

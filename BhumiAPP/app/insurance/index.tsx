import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, StatusBar, Platform, Dimensions, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, TYPOGRAPHY, SHADOWS } from '../../src/theme/theme';
import { useInsuranceStore } from '../../src/store/insuranceStore';

const { width } = Dimensions.get('window');

export default function InsuranceLandingScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const landPremium = params.landPremium as string | undefined;
  const acres = params.acres as string | undefined;
  
  // Zustand store
  const policies = useInsuranceStore((state) => state.policies);
  const greenFamily = useInsuranceStore((state) => state.greenFamily);
  const isLoading = useInsuranceStore((state) => state.isLoading);
  const fetchPolicies = useInsuranceStore((state) => state.fetchPolicies);

  const [activeTab, setActiveTab] = useState<'active' | 'discover'>('active');
  const [localLoading, setLocalLoading] = useState(true);

  useEffect(() => {
    fetchPolicies().then(() => setLocalLoading(false));
  }, []);

  // Compute stats
  const activePolicies = policies.filter(p => p.status === 'Active');
  const totalInsuredTrees = policies.reduce((sum, p) => sum + p.registeredTreesCount, 0);
  const totalCoverageAmount = policies.reduce((sum, p) => sum + (p.status === 'Active' ? p.coverage * p.registeredTreesCount : 0), 0);
  const totalFamilyUnits = Math.floor(totalInsuredTrees / 5);

  const handleSelectOption = (option: 'single' | 'family') => {
    if (option === 'single') {
      router.push({ pathname: '/insurance/register-single' as any, params: { landPremium, acres } });
    } else {
      router.push({ pathname: '/insurance/register-family' as any, params: { landPremium, acres } });
    }
  };

  const handleRaiseClaim = (policyId: string, policyName: string) => {
    router.push({
      pathname: '/insurance/claim' as any,
      params: { policyId, policyName }
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />
      
      {/* Top Header Card */}
      <LinearGradient 
        colors={[COLORS.primary, COLORS.primaryDark]} 
        style={styles.header}
      >
        <View style={styles.topRow}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.replace('/(tabs)')}>
            <MaterialCommunityIcons name="arrow-left" size={22} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Tree Insurance Shield</Text>
          <TouchableOpacity style={styles.infoBtn} onPress={() => router.push('/insurance/policy-details' as any)}>
            <MaterialCommunityIcons name="information-outline" size={22} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        <Text style={styles.headerSubtitle}>Digital environmental protection & climate cover for crop assets</Text>
        
        {/* Dynamic Key Stats Board */}
        <View style={styles.statsBoard}>
          <View style={styles.statCell}>
            <Text style={styles.statLabel}>Active Shield</Text>
            <Text style={styles.statValue}>{activePolicies.length} Plans</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statCell}>
            <Text style={styles.statLabel}>Insured Trees</Text>
            <Text style={styles.statValue}>{totalInsuredTrees} Trees</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statCell}>
            <Text style={styles.statLabel}>Total Cover</Text>
            <Text style={[styles.statValue, { color: COLORS.accent }]}>₹{totalCoverageAmount}</Text>
          </View>
        </View>
      </LinearGradient>

      <ScrollView 
        contentContainerStyle={styles.scrollArea} 
        showsVerticalScrollIndicator={false}
      >
        {/* Choice Panel: Double massive premium cards */}
        <Text style={styles.sectionTitle}>Get New Plantation Cover / नई सुरक्षा नीति चुनें</Text>
        
        <View style={styles.choiceGrid}>
          {/* Card Option 1: Single Tree */}
          <TouchableOpacity 
            style={styles.choiceCard} 
            activeOpacity={0.9}
            onPress={() => handleSelectOption('single')}
          >
            <LinearGradient colors={['#ECFDF5', '#D1FAE5']} style={styles.choiceGrad}>
              <View style={styles.iconCircle}>
                <MaterialCommunityIcons name="tree-outline" size={28} color={COLORS.primary} />
              </View>
              <Text style={styles.choiceTitle}>Single Tree Shield</Text>
              <Text style={styles.choiceDesc}>Protect precious, high-value timber, or spiritual heritage trees.</Text>
              <View style={styles.choiceFooter}>
                <Text style={styles.choiceCta}>Insure Asset</Text>
                <MaterialCommunityIcons name="chevron-right" size={16} color={COLORS.primary} />
              </View>
            </LinearGradient>
          </TouchableOpacity>

          {/* Card Option 2: Green Family */}
          <TouchableOpacity 
            style={styles.choiceCard} 
            activeOpacity={0.9}
            onPress={() => handleSelectOption('family')}
          >
            <LinearGradient colors={['#FFFBEB', '#FEF3C7']} style={styles.choiceGrad}>
              <View style={[styles.iconCircle, { backgroundColor: '#FEF3C7' }]}>
                <MaterialCommunityIcons name="forest" size={28} color="#D97706" />
              </View>
              <Text style={styles.choiceTitle}>Green Family Cover</Text>
              <Text style={styles.choiceDesc}>Group 5 trees = 1 Family. Unlocks satellite MRV & carbon bonuses.</Text>
              <View style={styles.choiceFooter}>
                <Text style={[styles.choiceCta, { color: '#D97706' }]}>Group Bundle</Text>
                <MaterialCommunityIcons name="chevron-right" size={16} color="#D97706" />
              </View>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* Dynamic Indicators for Green Family level */}
        {greenFamily && (
          <View style={styles.greenFamilyIndicator}>
            <View style={styles.familyHeader}>
              <MaterialCommunityIcons name="badge-account-alert" size={20} color="#D97706" />
              <View style={{ flex: 1, marginLeft: 8 }}>
                <Text style={styles.familyTitle}>Green Family Badge Cabinet</Text>
                <Text style={styles.familySub}>Current: {greenFamily.badge} ({totalFamilyUnits} Mapped Families)</Text>
              </View>
              <View style={styles.badgeLevel}>
                <Text style={styles.badgeLevelText}>{greenFamily.score}/100 Score</Text>
              </View>
            </View>
            <View style={styles.meterBg}>
              <View style={[styles.meterFill, { width: `${greenFamily.score}%` }]} />
            </View>
            <Text style={styles.familyBonusNote}>
              🔥 Your trees absorb carbon, securing ₹{greenFamily.rewardsEarned} eco rewards to date.
            </Text>
          </View>
        )}

        {/* Skip to Payment for Land Registration */}
        {landPremium && (
          <TouchableOpacity 
            style={[styles.choiceCard, { width: '100%', marginTop: 20, borderWidth: 1, borderColor: '#ccc', borderStyle: 'dashed' }]} 
            activeOpacity={0.9}
            onPress={() => router.push({ pathname: '/insurance/payment' as any, params: { mode: 'land_only', landPremium, acres } })}
          >
            <LinearGradient colors={['#F8FAFC', '#F1F5F9']} style={[styles.choiceGrad, { height: 90, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }]}>
              <Text style={{ fontSize: 16, fontWeight: '700', color: COLORS.textDark, marginRight: 8 }}>Skip Insurance & Pay Land Registry Fee</Text>
              <MaterialCommunityIcons name="arrow-right-circle" size={24} color={COLORS.textDark} />
            </LinearGradient>
          </TouchableOpacity>
        )}

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    paddingTop: Platform.OS === 'ios' ? 20 : 40,
    paddingBottom: 28,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    ...SHADOWS.glow,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  backBtn: {
    padding: 6,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
  },
  headerTitle: {
    fontSize: 19,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  infoBtn: {
    padding: 6,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#E0F2F1',
    lineHeight: 16,
    fontWeight: '600',
    marginBottom: 20,
  },
  statsBoard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  statCell: {
    flex: 1,
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 10,
    color: '#E0F2F1',
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  statValue: {
    fontSize: 16,
    fontWeight: '900',
    color: '#FFFFFF',
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    marginVertical: 4,
  },
  scrollArea: {
    padding: 20,
  },
  sectionTitle: {
    ...TYPOGRAPHY.h3,
    color: COLORS.primaryDark,
    fontWeight: '800',
    marginVertical: 14,
  },
  choiceGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  choiceCard: {
    width: '48%',
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: COLORS.border,
    ...SHADOWS.soft,
  },
  choiceGrad: {
    padding: 14,
    height: 180,
    justifyContent: 'space-between',
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#D1FAE5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  choiceTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.textDark,
  },
  choiceDesc: {
    fontSize: 10,
    color: COLORS.textSecondary,
    fontWeight: '600',
    lineHeight: 14,
  },
  choiceFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  choiceCta: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.primary,
    marginRight: 2,
  },
  greenFamilyIndicator: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
    ...SHADOWS.soft,
  },
  familyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  familyTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.textDark,
  },
  familySub: {
    fontSize: 10,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  badgeLevel: {
    backgroundColor: '#FFFBEB',
    borderWidth: 1,
    borderColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  badgeLevelText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#D97706',
  },
  meterBg: {
    height: 6,
    backgroundColor: '#E2E8F0',
    borderRadius: 3,
    marginTop: 12,
  },
  meterFill: {
    height: '100%',
    backgroundColor: '#F59E0B',
    borderRadius: 3,
  },
  familyBonusNote: {
    fontSize: 11,
    fontWeight: '700',
    color: '#B45309',
    marginTop: 8,
  },
  centerLoading: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 11,
    color: COLORS.textSecondary,
    fontWeight: '700',
    marginTop: 8,
  },
  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 30,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: COLORS.border,
    ...SHADOWS.soft,
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
    marginTop: 6,
    lineHeight: 15,
  },
  policyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    ...SHADOWS.soft,
  },
  policyHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  policyTitleCol: {
    flex: 1,
    marginRight: 10,
  },
  policyName: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.textDark,
  },
  policyDesc: {
    fontSize: 11,
    color: COLORS.textSecondary,
    fontWeight: '600',
    marginTop: 4,
    lineHeight: 14,
  },
  activeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#D1FAE5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  activeText: {
    fontSize: 9,
    fontWeight: '900',
    color: COLORS.success,
    marginLeft: 3,
  },
  policyDivider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 12,
  },
  policyStatsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 10,
  },
  pStatItem: {
    flex: 1,
    alignItems: 'center',
  },
  pStatLabel: {
    fontSize: 9,
    color: COLORS.textSecondary,
    fontWeight: '700',
  },
  pStatValue: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.textDark,
    marginTop: 2,
  },
  policyActionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  actionItemBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1.1,
    backgroundColor: '#F4FDF9',
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 10,
    paddingVertical: 8,
    marginRight: 6,
  },
  dangerActionBtn: {
    backgroundColor: '#FEF2F2',
    borderColor: '#FEE2E2',
    marginRight: 0,
    marginLeft: 6,
  },
  actionBtnLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.primary,
  },
});

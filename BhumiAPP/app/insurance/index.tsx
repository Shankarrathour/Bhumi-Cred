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
        
        <View style={styles.choiceList}>
          {/* Card Option 1: Single Tree */}
          <TouchableOpacity 
            style={styles.choiceCardRow} 
            activeOpacity={0.9}
            onPress={() => handleSelectOption('single')}
          >
            <LinearGradient colors={['#ECFDF5', '#D1FAE5']} style={styles.choiceGradRow} start={{x:0, y:0}} end={{x:1, y:0}}>
              <View style={styles.iconCircle}>
                <MaterialCommunityIcons name="tree-outline" size={24} color={COLORS.primary} />
              </View>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={styles.choiceTitle}>Single Tree Shield</Text>
                <Text style={styles.choiceDesc}>Protect precious, high-value timber, or spiritual heritage trees.</Text>
              </View>
              <MaterialCommunityIcons name="chevron-right" size={20} color={COLORS.primary} style={{ marginLeft: 6 }} />
            </LinearGradient>
          </TouchableOpacity>

          {/* Card Option 2: Green Family */}
          <TouchableOpacity 
            style={styles.choiceCardRow} 
            activeOpacity={0.9}
            onPress={() => handleSelectOption('family')}
          >
            <LinearGradient colors={['#FFFBEB', '#FEF3C7']} style={styles.choiceGradRow} start={{x:0, y:0}} end={{x:1, y:0}}>
              <View style={[styles.iconCircle, { backgroundColor: '#FEF3C7' }]}>
                <MaterialCommunityIcons name="forest" size={24} color="#D97706" />
              </View>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={[styles.choiceTitle, { color: '#B45309' }]}>Green Family Cover</Text>
                <Text style={styles.choiceDesc}>Group 5 trees = 1 Family. Unlocks satellite MRV & carbon bonuses.</Text>
              </View>
              <MaterialCommunityIcons name="chevron-right" size={20} color="#D97706" style={{ marginLeft: 6 }} />
            </LinearGradient>
          </TouchableOpacity>

          {/* Card Option 3: Farm / Plantation protection */}
          <TouchableOpacity 
            style={styles.choiceCardRow} 
            activeOpacity={0.9}
            onPress={() => {
              router.push({
                pathname: '/insurance/register-family' as any,
                params: { landPremium, acres, mode: 'plantation' }
              });
            }}
          >
            <LinearGradient colors={['#EFF6FF', '#DBEAFE']} style={styles.choiceGradRow} start={{x:0, y:0}} end={{x:1, y:0}}>
              <View style={[styles.iconCircle, { backgroundColor: '#DBEAFE' }]}>
                <MaterialCommunityIcons name="sprout" size={24} color="#1E40AF" />
              </View>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={[styles.choiceTitle, { color: '#1E40AF' }]}>Farm / Plantation Protection</Text>
                <Text style={styles.choiceDesc}>Protect entire orchards or high-density timber plantation blocks.</Text>
              </View>
              <MaterialCommunityIcons name="chevron-right" size={20} color="#1E40AF" style={{ marginLeft: 6 }} />
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
              <Text style={{ fontSize: 16, fontWeight: '700', color: COLORS.textDark, marginRight: 8 }}>Skip Registration & Pay Land Fee</Text>
              <MaterialCommunityIcons name="arrow-right-circle" size={24} color={COLORS.textDark} />
            </LinearGradient>
          </TouchableOpacity>
        )}

        {/* Your Active & Expired Policies Shelf */}
        <Text style={styles.sectionTitle}>Your Protected Assets & Policies</Text>

        {policies.length === 0 ? (
          <View style={styles.emptyPoliciesBox as any}>
            <MaterialCommunityIcons name="shield-off-outline" size={40} color="#94A3B8" />
            <Text style={{ fontSize: 13, color: COLORS.textSecondary, marginTop: 10, fontWeight: '700' }}>
              No policies registered yet.
            </Text>
          </View>
        ) : (
          <View style={{ gap: 14 }}>
            {/* Let's render the list of policies, including a mocked expired one for showcase */}
            {[
              ...policies,
              {
                id: 'pol_expired_demo',
                name: 'Eco Life',
                premium: 18,
                coverage: 800,
                registeredTreesCount: 8,
                status: 'Inactive' as any,
                description: 'Demo expired policy'
              }
            ].map((p, idx) => {
              const isExpired = p.status === 'Inactive' && p.registeredTreesCount > 0;
              const isActive = p.status === 'Active';
              
              // Mock dates
              const startDate = isExpired ? '14 Aug 2025' : '14 Aug 2026';
              const endDate = isExpired ? '14 Aug 2026' : '14 Aug 2027';

              let statusColor = COLORS.warning;
              if (isActive) statusColor = COLORS.success;
              if (isExpired) statusColor = COLORS.danger;

              return (
                <View key={p.id || idx} style={styles.policyCard as any}>
                  {/* Status Banner / Expiry Alert */}
                  {isExpired && (
                    <View style={styles.expiryReminderAlert as any}>
                      <MaterialCommunityIcons name="alert-circle-outline" size={16} color="#B91C1C" style={{ marginRight: 6 }} />
                      <Text style={styles.expiryReminderText as any}>
                        Policy has expired! Tap Renew below to keep protection active.
                      </Text>
                    </View>
                  )}

                  <View style={styles.policyCardHeader as any}>
                    <View style={styles.policyTitleArea as any}>
                      <Text style={styles.policyCardName as any}>{p.name} Shield</Text>
                      <Text style={styles.policyCardId as any}>Policy ID: POL-{(p?.id || 'POL9021').slice(-6).toUpperCase()}</Text>
                    </View>
                    <View style={[styles.policyStatusBadge, { backgroundColor: `${statusColor}15` }] as any}>
                      <Text style={[styles.policyStatusText, { color: statusColor }] as any}>
                        {isActive ? 'ACTIVE' : isExpired ? 'EXPIRED' : 'PENDING'}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.policyCardDetails as any}>
                    <View style={styles.detailItem as any}>
                      <Text style={styles.detailLabel as any}>INSURED TREES</Text>
                      <Text style={styles.detailValue as any}>{p.registeredTreesCount || 0} Trees</Text>
                    </View>
                    <View style={styles.detailItem as any}>
                      <Text style={styles.detailLabel as any}>SUM INSURED</Text>
                      <Text style={styles.detailValue as any}>₹{(p.coverage * (p.registeredTreesCount || 10)).toLocaleString('en-IN')}</Text>
                    </View>
                    <View style={styles.detailItem as any}>
                      <Text style={styles.detailLabel as any}>COVERAGE DATES</Text>
                      <Text style={styles.detailValue as any}>{startDate} - {endDate}</Text>
                    </View>
                  </View>

                  <View style={styles.policyCardActions as any}>
                    {/* View Certificate Document */}
                    <TouchableOpacity 
                      style={styles.policyCardBtn as any}
                      onPress={() => router.push({
                        pathname: '/insurance/certificate' as any,
                        params: { policyId: p.id, policyName: p.name, treeCount: p.registeredTreesCount, startDate, endDate }
                      })}
                    >
                      <MaterialCommunityIcons name="file-pdf-box" size={16} color={COLORS.primary} style={{ marginRight: 4 }} />
                      <Text style={styles.policyCardBtnText as any}>Certificate</Text>
                    </TouchableOpacity>

                    {/* Claim Button (only if active) */}
                    {isActive && p.registeredTreesCount > 0 && (
                      <TouchableOpacity 
                        style={styles.policyCardBtn as any}
                        onPress={() => handleRaiseClaim(p.id, p.name)}
                      >
                        <MaterialCommunityIcons name="alert-decagram-outline" size={16} color="#EA580C" style={{ marginRight: 4 }} />
                        <Text style={[styles.policyCardBtnText, { color: '#EA580C' }] as any}>Raise Claim</Text>
                      </TouchableOpacity>
                    )}

                    {/* Renew Button (if expired) */}
                    {isExpired && (
                      <TouchableOpacity 
                        style={[styles.policyCardBtn, { borderColor: COLORS.primary, backgroundColor: '#ECFDF5' }] as any}
                        onPress={() => {
                          Alert.alert(
                            'Renew Policy',
                            `Do you want to renew the ${p.name} Policy for 12 more months at ₹${p.premium}/tree?`,
                            [
                              { text: 'Cancel', style: 'cancel' },
                              { 
                                text: 'Renew Now', 
                                onPress: () => {
                                  router.push({
                                    pathname: '/insurance/payment' as any,
                                    params: { mode: 'insurance_only', landPremium: '0', acres: '14.5', selectedPlanName: p.name }
                                  });
                                }
                              }
                            ]
                          );
                        }}
                      >
                        <MaterialCommunityIcons name="sync" size={16} color={COLORS.primary} style={{ marginRight: 4 }} />
                        <Text style={[styles.policyCardBtnText, { color: COLORS.primary }] as any}>Renew Plan</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              );
            })}
          </View>
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
  choiceList: {
    flexDirection: 'column',
    marginBottom: 16,
  },
  choiceCardRow: {
    width: '100%',
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: COLORS.border,
    marginBottom: 12,
    ...SHADOWS.soft,
  },
  choiceGradRow: {
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 90,
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
  emptyPoliciesBox: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 16,
    padding: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 10,
  },
  policyCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    paddingBottom: 10,
    marginBottom: 10,
  },
  policyTitleArea: {
    flex: 1,
  },
  policyCardName: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.textDark,
  },
  policyCardId: {
    fontSize: 10,
    color: COLORS.textSecondary,
    fontWeight: '600',
    marginTop: 2,
  },
  policyStatusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  policyStatusText: {
    fontSize: 9,
    fontWeight: '900',
  },
  policyCardDetails: {
    gap: 8,
    marginBottom: 12,
  },
  detailItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  detailLabel: {
    fontSize: 9.5,
    color: COLORS.textSecondary,
    fontWeight: '700',
  },
  detailValue: {
    fontSize: 11.5,
    fontWeight: '800',
    color: COLORS.textDark,
  },
  policyCardActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 6,
  },
  policyCardBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderRadius: 10,
    paddingVertical: 8,
  },
  policyCardBtnText: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.primary,
  },
  expiryReminderAlert: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FCA5A5',
    borderRadius: 10,
    padding: 8,
    marginBottom: 12,
  },
  expiryReminderText: {
    fontSize: 10,
    color: '#991B1B',
    fontWeight: '700',
    flex: 1,
  },
});

import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, StatusBar, Platform, Dimensions, Alert, Image } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, TYPOGRAPHY, SHADOWS } from '../../src/theme/theme';
import { useLandStore } from '../../src/store/landStore';

const { width } = Dimensions.get('window');

export default function InsuranceSummaryScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const insets = useSafeAreaInsets();

  // Route Params
  const mode = params.mode as 'single' | 'family' | 'land_only';
  const treeName = params.treeName as string;
  const species = params.species as string;
  const treeCountVal = parseInt(params.treeCount as string || '1', 10);
  const premium = parseFloat(params.premium as string || '99');
  const coverage = parseFloat(params.coverage as string || '3000');
  const policyName = params.policyName as string || 'Eco Life';
  const treeListData = params.treeListData as string | undefined;
  const plantationConfiguration = params.plantationType as string | undefined;

  const [acknowledged, setAcknowledged] = useState(false);

  // Get total acres for carbon profile fee if landPremium is present
  const plots = useLandStore((state) => state.plots);
  const paramsAcres = params.acres ? parseFloat(params.acres as string) : 0;
  const storeAcres = plots.reduce((sum, p) => sum + (parseFloat(p.acres as any) || 0), 0);
  const totalAcres = paramsAcres > 0 ? paramsAcres : (storeAcres > 0 ? storeAcres : 1);
  const hasLandPremium = !!params.landPremium;
  const carbonProfileFee = hasLandPremium ? parseFloat((totalAcres * 119).toFixed(2)) : 0;

  // Premium breakdown
  const basePrice = mode === 'land_only' ? 0 : premium;
  const mrvAuditFee = mode === 'land_only' ? 0 : Math.round(premium * 0.2);
  const soilNPKFee = mode === 'land_only' ? 0 : Math.round(premium * 0.1);
  const registryFee = mode === 'land_only' ? 0 : Math.round(premium * 0.1);
  const totalPrice = carbonProfileFee + basePrice + mrvAuditFee + soilNPKFee + registryFee;

  // Tree categories breakdown
  const parsedTreeList = treeListData ? JSON.parse(treeListData) : [];
  const categories: Record<string, number> = {};
  if (mode === 'family') {
    parsedTreeList.forEach((tree: any) => {
      const sp = tree.species || 'Unknown Species';
      categories[sp] = (categories[sp] || 0) + 1;
    });
  }

  // Coverage Period (1 Year duration from today)
  const getCoveragePeriod = () => {
    const today = new Date();
    const nextYear = new Date();
    nextYear.setFullYear(today.getFullYear() + 1);
    
    const formatDate = (date: Date) => {
      return date.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });
    };
    
    return `${formatDate(today)} to ${formatDate(nextYear)} (12 Months)`;
  };

  const handleProceed = () => {
    if (!acknowledged) {
      Alert.alert('Terms Required', 'Please acknowledge the terms and conditions before proceeding.');
      return;
    }

    router.push({
      pathname: '/insurance/payment' as any,
      params: params
    });
  };

  return (
    <View style={styles.container as any}>
      <StatusBar barStyle="dark-content" />
      
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top > 0 ? insets.top + 10 : 35 }] as any}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn as any}>
          <MaterialCommunityIcons name="arrow-left" size={24} color="#1E293B" />
        </TouchableOpacity>
        <Text style={styles.headerTitle as any}>Insurance Summary</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent as any} showsVerticalScrollIndicator={false}>
        {/* Selected Plan Details Card */}
        <View style={styles.sectionCard as any}>
          <View style={styles.sectionHeader as any}>
            <MaterialCommunityIcons name="shield-check" size={22} color={COLORS.primary} />
            <Text style={styles.sectionTitle as any}>Selected Plan / चयनित योजना</Text>
          </View>
          
          <LinearGradient colors={['#F0FDF4', '#DCFCE7']} style={styles.planBadge as any}>
            <View style={styles.planBadgeLeft as any}>
              <Text style={styles.planNameText as any}>{policyName}</Text>
              <Text style={styles.planModeText as any}>
                {mode === 'single' ? 'Single Tree Shield' : 'Group Tree Family Cover'}
              </Text>
            </View>
            <View style={styles.planBadgeRight as any}>
              <Text style={styles.planCoverLabel as any}>Total Cover / कुल कवरेज</Text>
              <Text style={styles.planCoverValue as any}>
                ₹{(coverage * (mode === 'single' ? 1 : treeCountVal)).toLocaleString('en-IN')}
              </Text>
            </View>
          </LinearGradient>
          
          <TouchableOpacity onPress={() => router.back()} style={styles.editLink as any}>
            <MaterialCommunityIcons name="pencil-outline" size={14} color={COLORS.primary} />
            <Text style={styles.editLinkText as any}>Edit Plan / योजना बदलें</Text>
          </TouchableOpacity>
        </View>

        {/* Tree Count & Categories Card */}
        <View style={styles.sectionCard as any}>
          <View style={styles.sectionHeader as any}>
            <MaterialCommunityIcons name="tree" size={22} color="#16A34A" />
            <Text style={styles.sectionTitle as any}>Registered Trees / पंजीकृत पेड़</Text>
          </View>

          {mode === 'single' ? (
            <View style={styles.treeRow as any}>
              <View style={styles.treeInfo as any}>
                <Text style={styles.treeNameTitle as any}>{treeName || 'My Single Tree'}</Text>
                <Text style={styles.treeDetailSub as any}>
                  Species: <Text style={styles.boldText as any}>{species || 'Teak'}</Text> • Age: <Text style={styles.boldText as any}>{params.age || '2-5'} Years</Text>
                </Text>
              </View>
              <Text style={styles.treeQtyBadge as any}>1 Tree</Text>
            </View>
          ) : (
            <View style={styles.treeCategoryList as any}>
              <View style={styles.familyHeaderRow as any}>
                <Text style={styles.totalTreesText as any}>Total Insured Trees: <Text style={styles.boldPrimaryText as any}>{treeCountVal} Trees</Text></Text>
                <Text style={styles.configText as any}>Config: {plantationConfiguration || 'Row Plantation'}</Text>
              </View>
              
              {Object.keys(categories).map((sp) => (
                <View key={sp} style={styles.categoryItemRow as any}>
                  <View style={styles.bulletRow as any}>
                    <MaterialCommunityIcons name="circle-medium" size={18} color="#475569" />
                    <Text style={styles.categorySpeciesName as any}>{sp}</Text>
                  </View>
                  <Text style={styles.categoryCountVal as any}>{categories[sp]} Trees</Text>
                </View>
              ))}
            </View>
          )}

          <TouchableOpacity onPress={() => router.back()} style={styles.editLink as any}>
            <MaterialCommunityIcons name="pencil-outline" size={14} color={COLORS.primary} />
            <Text style={styles.editLinkText as any}>Edit Tree Details / विवरण बदलें</Text>
          </TouchableOpacity>
        </View>

        {/* Coverage Period Card */}
        <View style={styles.sectionCard as any}>
          <View style={styles.sectionHeader as any}>
            <MaterialCommunityIcons name="clock-outline" size={22} color="#D97706" />
            <Text style={styles.sectionTitle as any}>Coverage Period / कवरेज अवधि</Text>
          </View>
          <View style={styles.periodBox as any}>
            <Text style={styles.periodText as any}>{getCoveragePeriod()}</Text>
            <Text style={styles.periodHint as any}>Note: Subject to physical field inspection approval.</Text>
          </View>
        </View>

        {/* Premium Breakdown Card */}
        <View style={styles.sectionCard as any}>
          <View style={styles.sectionHeader as any}>
            <MaterialCommunityIcons name="calculator-variant" size={22} color="#0284C7" />
            <Text style={styles.sectionTitle as any}>Premium Breakdown / प्रीमियम विवरण</Text>
          </View>

          <View style={styles.breakdownTable as any}>
            {mode !== 'land_only' && (
              <>
                <View style={styles.breakdownRow as any}>
                  <Text style={styles.breakdownLabel as any}>Base Premium / मूल प्रीमियम</Text>
                  <Text style={styles.breakdownValue as any}>₹{basePrice}</Text>
                </View>
                <View style={styles.breakdownRow as any}>
                  <Text style={styles.breakdownLabel as any}>MRV Satellite Audit Fee (20%)</Text>
                  <Text style={styles.breakdownValue as any}>₹{mrvAuditFee}</Text>
                </View>
                <View style={styles.breakdownRow as any}>
                  <Text style={styles.breakdownLabel as any}>Soil Health baseline NPK (10%)</Text>
                  <Text style={styles.breakdownValue as any}>₹{soilNPKFee}</Text>
                </View>
                <View style={styles.breakdownRow as any}>
                  <Text style={styles.breakdownLabel as any}>Environmental Registry Fee (10%)</Text>
                  <Text style={styles.breakdownValue as any}>₹{registryFee}</Text>
                </View>
              </>
            )}

            {hasLandPremium && (
              <View style={styles.breakdownRow as any}>
                <Text style={styles.breakdownLabel as any}>Land Carbon GIS Profile Fee</Text>
                <Text style={styles.breakdownValue as any}>₹{carbonProfileFee}</Text>
              </View>
            )}

            <View style={[styles.breakdownRow, styles.totalRow] as any}>
              <Text style={styles.totalLabel as any}>Total Payable / कुल भुगतान</Text>
              <Text style={styles.totalValue as any}>₹{totalPrice.toLocaleString('en-IN')}</Text>
            </View>
          </View>
        </View>

        {/* Terms and Conditions Acknowledgement */}
        <View style={styles.sectionCard as any}>
          <TouchableOpacity 
            activeOpacity={0.8} 
            onPress={() => setAcknowledged(!acknowledged)} 
            style={styles.termsAckRow as any}
          >
            <View style={[styles.checkbox, acknowledged && styles.checkboxActive] as any}>
              {acknowledged && <MaterialCommunityIcons name="check" size={16} color="#FFFFFF" />}
            </View>
            <Text style={styles.termsText as any}>
              I acknowledge and agree to the <Text style={styles.underlineText as any}>Tree Shield Terms and Conditions</Text>, including allowing remote satellite audits and baseline soil sampling.
            </Text>
          </TouchableOpacity>
        </View>

        {/* Action Button */}
        <TouchableOpacity 
          style={[styles.actionBtn, !acknowledged && { opacity: 0.6 }] as any} 
          onPress={handleProceed}
          disabled={!acknowledged}
        >
          <LinearGradient colors={[COLORS.primary, COLORS.secondary]} style={styles.actionBtnGrad as any}>
            <Text style={styles.actionBtnLabel as any}>Proceed to Payment</Text>
            <MaterialCommunityIcons name="credit-card-outline" size={20} color="#FFFFFF" style={{ marginLeft: 8 }} />
          </LinearGradient>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 14,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderColor: '#E2E8F0',
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    ...SHADOWS.small,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#1E293B',
    marginLeft: 8,
    textTransform: 'uppercase',
  },
  planBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#DCFCE7',
  },
  planBadgeLeft: {
    flex: 1,
  },
  planNameText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#14532D',
  },
  planModeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#166534',
    marginTop: 2,
  },
  planBadgeRight: {
    alignItems: 'flex-end',
  },
  planCoverLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#15803D',
    textTransform: 'uppercase',
  },
  planCoverValue: {
    fontSize: 18,
    fontWeight: '900',
    color: '#14532D',
  },
  editLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: 12,
  },
  editLinkText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.primary,
    marginLeft: 4,
  },
  treeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFC',
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  treeInfo: {
    flex: 1,
  },
  treeNameTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#1E293B',
  },
  treeDetailSub: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  boldText: {
    fontWeight: '700',
    color: '#334155',
  },
  treeQtyBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: '#DCFCE7',
    color: '#15803D',
    fontWeight: '800',
    fontSize: 12,
  },
  treeCategoryList: {
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  familyHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderColor: '#E2E8F0',
    paddingBottom: 10,
    marginBottom: 8,
  },
  totalTreesText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
  },
  boldPrimaryText: {
    fontWeight: '800',
    color: COLORS.primaryDark,
  },
  configText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
  },
  categoryItemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  categorySpeciesName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#334155',
  },
  categoryCountVal: {
    fontSize: 12,
    fontWeight: '800',
    color: '#1E293B',
  },
  periodBox: {
    backgroundColor: '#FFFBEB',
    borderWidth: 1,
    borderColor: '#FDE68A',
    borderRadius: 14,
    padding: 14,
  },
  periodText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#92400E',
  },
  periodHint: {
    fontSize: 10.5,
    fontWeight: '600',
    color: '#B45309',
    marginTop: 4,
  },
  breakdownTable: {
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  breakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  breakdownLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
  },
  breakdownValue: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1E293B',
  },
  totalRow: {
    borderTopWidth: 1.5,
    borderColor: '#E2E8F0',
    paddingTop: 10,
    marginTop: 6,
  },
  totalLabel: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F172A',
  },
  totalValue: {
    fontSize: 17,
    fontWeight: '900',
    color: COLORS.primaryDark,
  },
  termsAckRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: '#94A3B8',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    marginTop: 2,
    backgroundColor: '#FFFFFF',
  },
  checkboxActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  termsText: {
    flex: 1,
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
    lineHeight: 18,
  },
  underlineText: {
    textDecorationLine: 'underline',
    fontWeight: '700',
    color: '#1E293B',
  },
  actionBtn: {
    width: '100%',
    height: 56,
    borderRadius: 16,
    overflow: 'hidden',
    marginTop: 8,
    ...SHADOWS.medium,
  },
  actionBtnGrad: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionBtnLabel: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },
});

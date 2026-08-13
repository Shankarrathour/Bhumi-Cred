import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, StatusBar, Platform, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, TYPOGRAPHY, SHADOWS } from '../../src/theme/theme';

const { width } = Dimensions.get('window');

export default function ClaimStatusTrackingScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();

  // Route Params
  const policyId = params.policyId as string || 'BS-492104';
  const policyName = params.policyName as string || 'Green Shield Basic';
  const damageType = params.damageType as string || 'Cyclone / Storm Wind';
  const explanation = params.explanation as string || 'Trunk break due to heavy storm winds.';

  const claimId = `CLM-${Math.floor(400000 + Math.random() * 600000)}`;

  const TIMELINE_STAGES = [
    {
      id: 1,
      stage: 'Claim Submitted / दावा प्रस्तुत किया',
      status: 'Completed',
      notes: 'Environmental damage report synchronized on ledger. Evidence files verified.',
      date: 'Today, 10:02 AM',
      icon: 'check-circle',
      iconColor: COLORS.success,
    },
    {
      id: 2,
      stage: 'Under Admin Review / समीक्षा के तहत',
      status: 'Completed',
      notes: 'Agritech damage assessment parameters approved by Bhopal block verify team.',
      date: 'Today, 10:05 AM',
      icon: 'check-circle',
      iconColor: COLORS.success,
    },
    {
      id: 3,
      stage: 'Satellite spectral scan / उपग्रह स्कैन',
      status: 'In Progress',
      notes: 'Sentinel-2 orbital spectrometer is scheduled to capture boundary NPK leaf biomass changes.',
      date: 'Active Scan',
      icon: 'sync',
      iconColor: COLORS.warning,
    },
    {
      id: 4,
      stage: 'Field Inspection Booking / भूमि निरीक्षण',
      status: 'Pending',
      notes: 'Drone auditor will be dispatched for physical validation if satellite results are inconclusive.',
      date: 'Scheduled',
      icon: 'clock-outline',
      iconColor: '#CBD5E1',
    },
    {
      id: 5,
      stage: 'Compensation Payout / दावा भुगतान',
      status: 'Pending',
      notes: 'Direct transfer to Eco Wallet balance upon positive agritech threshold approval.',
      date: 'Awaiting Verification',
      icon: 'cash',
      iconColor: '#CBD5E1',
    },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#F4FDF9" />
      
      {/* Header */}
      <View style={styles.navBar}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.replace('/insurance' as any)}>
          <MaterialCommunityIcons name="arrow-left" size={22} color={COLORS.primary} />
        </TouchableOpacity>
        <Text style={styles.navTitle}>Satellite Claim Tracker</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollArea} showsVerticalScrollIndicator={false}>
        
        {/* Banner */}
        <View style={styles.banner}>
          <Text style={styles.bannerTitle}>Active MRV Claim Audit</Text>
          <Text style={styles.bannerSub}>Claim ID: {claimId} • Mapped to {policyName}</Text>
        </View>

        {/* Claim Summary Card */}
        <View style={styles.card}>
          <Text style={styles.cardSectionTitle}>Claim Request Summary</Text>
          <View style={styles.summaryMetaRow}>
            <View style={styles.summaryMetaItem}>
              <Text style={styles.metaLabel}>Linked Policy</Text>
              <Text style={styles.metaValue}>{policyName}</Text>
            </View>
            <View style={styles.summaryMetaItem}>
              <Text style={styles.metaLabel}>Damage Category</Text>
              <Text style={[styles.metaValue, { color: COLORS.danger }]}>{damageType}</Text>
            </View>
          </View>
          <Text style={[styles.metaLabel, { marginTop: 12 }]}>Farmer Statement Description</Text>
          <Text style={styles.explanationText}>“{explanation}”</Text>
        </View>

        {/* Timeline Progression */}
        <Text style={styles.sectionTitle}>Satellite Progression Timeline / दावा प्रगति</Text>

        <View style={styles.timelineContainer}>
          {TIMELINE_STAGES.map((item, index, arr) => {
            const isCompleted = item.status === 'Completed';
            const isInProgress = item.status === 'In Progress';
            
            return (
              <View key={item.id} style={styles.timelineRow}>
                {/* Left line indicator */}
                <View style={styles.timelineLeft}>
                  <View style={[
                    styles.iconCircle,
                    isCompleted && styles.circleCompleted,
                    isInProgress && styles.circleProgress,
                  ]}>
                    <MaterialCommunityIcons 
                      name={item.icon as any} 
                      size={18} 
                      color={isCompleted ? '#FFFFFF' : isInProgress ? COLORS.warning : '#64748B'} 
                    />
                  </View>
                  {index < arr.length - 1 && (
                    <View style={[
                      styles.connectorLine,
                      isCompleted && styles.lineCompleted
                    ]} />
                  )}
                </View>

                {/* Right card info */}
                <View style={styles.timelineRight}>
                  <View style={[
                    styles.stageCard,
                    isInProgress && styles.stageCardActive
                  ]}>
                    <View style={styles.stageHeader}>
                      <Text style={styles.stageName}>{item.stage}</Text>
                      <Text style={[
                        styles.stageDate,
                        isInProgress && { color: COLORS.warning }
                      ]}>{item.date}</Text>
                    </View>
                    <Text style={styles.stageNotes}>{item.notes}</Text>
                  </View>
                </View>
              </View>
            );
          })}
        </View>

        {/* Action Button */}
        <TouchableOpacity 
          style={styles.doneBtn}
          activeOpacity={0.85}
          onPress={() => router.replace('/insurance' as any)}
        >
          <LinearGradient colors={[COLORS.primary, COLORS.secondary]} style={styles.doneGrad}>
            <Text style={styles.doneBtnText}>Return to Insurance Ledger</Text>
          </LinearGradient>
        </TouchableOpacity>
        
        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
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
    height: 56,
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
  banner: {
    marginBottom: 20,
  },
  bannerTitle: {
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
  card: {
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
    marginBottom: 12,
  },
  summaryMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  summaryMetaItem: {
    flex: 1,
  },
  metaLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: COLORS.textSecondary,
    textTransform: 'uppercase',
  },
  metaValue: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.textDark,
    marginTop: 2,
  },
  explanationText: {
    fontSize: 11,
    color: COLORS.textSecondary,
    fontWeight: '600',
    lineHeight: 15,
    marginTop: 4,
    backgroundColor: '#F8FAFC',
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    fontStyle: 'italic',
  },
  sectionTitle: {
    ...TYPOGRAPHY.h3,
    color: COLORS.primaryDark,
    fontWeight: '800',
    marginVertical: 14,
  },
  timelineContainer: {
    paddingHorizontal: 6,
    marginBottom: 20,
  },
  timelineRow: {
    flexDirection: 'row',
  },
  timelineLeft: {
    alignItems: 'center',
    marginRight: 14,
  },
  iconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    zIndex: 2,
  },
  circleCompleted: {
    backgroundColor: COLORS.success,
    borderColor: COLORS.success,
  },
  circleProgress: {
    backgroundColor: '#FFFBEB',
    borderColor: COLORS.warning,
  },
  connectorLine: {
    width: 2,
    flex: 1,
    backgroundColor: '#CBD5E1',
    marginVertical: 4,
    zIndex: 1,
  },
  lineCompleted: {
    backgroundColor: COLORS.success,
  },
  timelineRight: {
    flex: 1,
    paddingBottom: 20,
  },
  stageCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderRadius: 16,
    padding: 12,
    ...SHADOWS.soft,
  },
  stageCardActive: {
    borderColor: COLORS.warning,
    backgroundColor: '#FFFDF5',
  },
  stageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  stageName: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.textDark,
  },
  stageDate: {
    fontSize: 9,
    color: COLORS.textSecondary,
    fontWeight: '700',
  },
  stageNotes: {
    fontSize: 10.5,
    color: COLORS.textSecondary,
    fontWeight: '600',
    lineHeight: 14,
  },
  doneBtn: {
    borderRadius: 30,
    overflow: 'hidden',
    marginTop: 10,
    ...SHADOWS.glow,
  },
  doneGrad: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  doneBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '900',
  },
});

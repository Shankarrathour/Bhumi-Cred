import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, ActivityIndicator, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import { COLORS, TYPOGRAPHY, SHADOWS } from '../../src/theme/theme';
import { MOCK_REPORTS_DETAILS } from '../../src/mock/reportMockData';
import { downloadAndShareReportPDF } from '../../src/utils/pdfGenerator';
import { useAuthStore } from '../../src/store/authStore';
import { GovtTreeInsuranceView } from '../../src/components/GovtTreeInsuranceView';

const MOCK_REPORTS = [
  {
    id: 'REP-001',
    testName: 'Soil Organic Carbon (SOC) Audit',
    date: '10 May 2026',
    status: 'Ready',
    abnormal: true,
    flags: ['Low Carbon Sponge', 'Nitrogen Deficit'],
  },
  {
    id: 'REP-002',
    testName: 'Satellite NDVI & Canopy Audit',
    date: '15 Apr 2026',
    status: 'Ready',
    abnormal: false,
    flags: [],
  },
  {
    id: 'REP-003',
    testName: 'Agroforestry Biomass Audit',
    date: '12 May 2026',
    status: 'Processing',
    abnormal: false,
    flags: [],
  },
];

export default function ReportsScreen() {
  const router = useRouter();
  const role = useAuthStore((state) => state.role);
  const [activeTab, setActiveTab] = useState('all');
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  if (role === 'govt_body') {
    return <GovtTreeInsuranceView />;
  }

  const triggerHaptic = (style: Haptics.ImpactFeedbackStyle) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(style);
    }
  };

  const handleDownload = async (id: string) => {
    const reportDetail = MOCK_REPORTS_DETAILS[id];
    if (!reportDetail) return;
    
    triggerHaptic(Haptics.ImpactFeedbackStyle.Light);
    setDownloadingId(id);
    await downloadAndShareReportPDF(reportDetail);
    setDownloadingId(null);
  };

  const renderReportCard = ({ item }: { item: typeof MOCK_REPORTS[0] }) => {
    const isDownloading = downloadingId === item.id;
    return (
      <View style={styles.reportCard}>
        <View style={styles.cardHeader}>
          <View style={styles.iconContainer}>
            <MaterialCommunityIcons 
              name={item.status === 'Processing' ? 'satellite-uplink' : 'file-certificate-outline'} 
              size={24} 
              color={COLORS.primary} 
            />
          </View>
          <View style={styles.headerTextContainer}>
            <Text style={styles.testName}>{item.testName}</Text>
            <Text style={styles.dateText}>{item.date}</Text>
          </View>
          <View style={[
            styles.statusBadge, 
            item.status === 'Processing' ? styles.statusProcessing : styles.statusReady
          ]}>
            <Text style={[
              styles.statusText,
              item.status === 'Processing' ? styles.statusTextProcessing : styles.statusTextReady
            ]}>
              {item.status === 'Processing' ? 'SYNCS' : 'VERIFIED'}
            </Text>
          </View>
        </View>

        {item.abnormal && (
          <View style={styles.abnormalContainer}>
            <MaterialCommunityIcons name="alert-decagram" size={16} color="#B45309" />
            <Text style={styles.abnormalText}>
              Attention Required: {item.flags.join(', ')}
            </Text>
          </View>
        )}

        {item.status === 'Ready' ? (
          <View style={styles.actionRow}>
            <TouchableOpacity 
              style={styles.actionButtonSecondary} 
              onPress={() => {
                triggerHaptic(Haptics.ImpactFeedbackStyle.Light);
                router.push(`/report/${item.id}` as any);
              }}
              activeOpacity={0.7}
              accessibilityRole="button"
            >
              <MaterialCommunityIcons name="eye-outline" size={20} color={COLORS.primary} />
              <Text style={styles.actionButtonTextSecondary}>View Details</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.actionButtonPrimary, isDownloading && { backgroundColor: COLORS.success }]} 
              onPress={() => handleDownload(item.id)}
              disabled={isDownloading}
              activeOpacity={0.7}
              accessibilityRole="button"
            >
              {isDownloading ? (
                <ActivityIndicator color={COLORS.textLight} size="small" />
              ) : (
                <MaterialCommunityIcons name="cloud-download-outline" size={20} color={COLORS.textLight} />
              )}
              <Text style={styles.actionButtonTextPrimary}>
                {isDownloading ? "Downloading..." : "Download PDF"}
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.processingRow}>
            <MaterialCommunityIcons name="timer-sand" size={16} color="#B45309" style={{ marginRight: 6 }} />
            <Text style={styles.processingText}>Sentinel drone core baseline mapping is in progress...</Text>
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Verification Registry</Text>
      </View>

      {/* Analytics Summary Box */}
      <View style={styles.analyticsContainer}>
        <View style={styles.analyticBox}>
          <Text style={styles.analyticNumber}>3</Text>
          <Text style={styles.analyticLabel}>Verified Audits</Text>
        </View>
        <View style={styles.analyticDivider} />
        <View style={styles.analyticBox}>
          <Text style={[styles.analyticNumber, { color: '#B45309' }]}>1</Text>
          <Text style={styles.analyticLabel}>Requires Attention</Text>
        </View>
        <View style={styles.analyticDivider} />
        <View style={styles.analyticBox}>
          <Text style={[styles.analyticNumber, { color: COLORS.primaryLight }]}>1</Text>
          <Text style={styles.analyticLabel}>Syncing Baseline</Text>
        </View>
      </View>

      {/* Status Tabs Filter Row */}
      <View style={styles.tabsContainer}>
        {[
          { code: 'all', label: 'All Certificates' },
          { code: 'abnormal', label: 'Deficient Plots' },
          { code: 'processing', label: 'In Progress' }
        ].map((tab) => (
          <TouchableOpacity 
            key={tab.code} 
            style={[styles.tab, activeTab === tab.code && styles.activeTab]}
            onPress={() => {
              triggerHaptic(Haptics.ImpactFeedbackStyle.Light);
              setActiveTab(tab.code);
            }}
            activeOpacity={0.8}
            accessibilityRole="tab"
            accessibilityState={{ selected: activeTab === tab.code }}
          >
            <Text style={[styles.tabText, activeTab === tab.code && styles.activeTabText]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Main Reports List */}
      <FlatList
        data={MOCK_REPORTS.filter(r => 
          activeTab === 'all' ? true : 
          activeTab === 'abnormal' ? r.abnormal : 
          r.status.toLowerCase() === activeTab
        )}
        keyExtractor={item => item.id}
        renderItem={renderReportCard}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <MaterialCommunityIcons name="file-document-remove-outline" size={48} color="#CBD5E1" />
            <Text style={styles.emptyText}>No certificates matching this status</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F4FDF9',
  },
  header: {
    paddingTop: 60,
    paddingBottom: 40,
    paddingHorizontal: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
  },
  headerTitle: {
    ...TYPOGRAPHY.h1,
    color: COLORS.textLight,
  },

  analyticsContainer: {
    flexDirection: 'row',
    backgroundColor: COLORS.surface,
    marginHorizontal: 16,
    marginTop: -20,
    borderRadius: 22,
    padding: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.soft,
    marginBottom: 24,
  },
  analyticBox: {
    flex: 1,
    alignItems: 'center',
  },
  analyticNumber: {
    ...TYPOGRAPHY.h2,
    color: COLORS.primary,
    marginBottom: 4,
    fontWeight: 'bold',
  },
  analyticLabel: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    textAlign: 'center',
    fontWeight: '600',
  },
  analyticDivider: {
    width: 1,
    backgroundColor: COLORS.border,
    marginHorizontal: 10,
  },
  tabsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  tab: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    marginRight: 8,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  activeTab: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  tabText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    fontWeight: 'bold',
  },
  activeTabText: {
    color: '#FFFFFF',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 40,
  },
  reportCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 22,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.soft,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#E6F4EA',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  headerTextContainer: {
    flex: 1,
  },
  testName: {
    ...TYPOGRAPHY.subtitle,
    color: COLORS.textDark,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  dateText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusReady: {
    backgroundColor: COLORS.successLight,
  },
  statusProcessing: {
    backgroundColor: COLORS.warningLight,
  },
  statusText: {
    ...TYPOGRAPHY.caption,
    fontWeight: 'bold',
    fontSize: 9,
  },
  statusTextReady: {
    color: COLORS.success,
  },
  statusTextProcessing: {
    color: '#B45309',
  },
  abnormalContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFBEB',
    padding: 12,
    borderRadius: 12,
    marginBottom: 16,
    borderLeftWidth: 3,
    borderLeftColor: '#F59E0B',
  },
  abnormalText: {
    ...TYPOGRAPHY.caption,
    color: '#B45309',
    marginLeft: 8,
    fontWeight: '600',
  },
  actionRow: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingTop: 16,
  },
  actionButtonSecondary: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 30,
    backgroundColor: '#F1F5F9',
    marginRight: 10,
  },
  actionButtonPrimary: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 30,
    backgroundColor: COLORS.primary,
  },
  actionButtonTextSecondary: {
    ...TYPOGRAPHY.caption,
    color: COLORS.primary,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  actionButtonTextPrimary: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textLight,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  processingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFBEB',
    padding: 12,
    borderRadius: 12,
    marginTop: 8,
  },
  processingText: {
    ...TYPOGRAPHY.caption,
    color: '#B45309',
    fontWeight: '600',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 60,
  },
  emptyText: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
    marginTop: 12,
  }
});

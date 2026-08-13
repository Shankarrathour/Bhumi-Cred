import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Modal,
  FlatList,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, TYPOGRAPHY, SHADOWS } from '../theme/theme';

const { width } = Dimensions.get('window');

interface GovtSchemeRecord {
  id: string;
  schemeName: string;
  department: string;
  activeApplications: number;
  disbursedAmount: string;
  status: 'Active' | 'Under Review' | 'Closing Soon';
}

const GOVT_SCHEMES: GovtSchemeRecord[] = [
  {
    id: 'SCH-101',
    schemeName: 'PM-KUSUM Solar Water Pump Subsidy',
    department: 'Ministry of New & Renewable Energy',
    activeApplications: 342,
    disbursedAmount: '₹1.24 Cr',
    status: 'Active',
  },
  {
    id: 'SCH-102',
    schemeName: 'Soil Health Card & Organic Fertilizer Subsidy',
    department: 'Department of Agriculture & Farmers Welfare',
    activeApplications: 890,
    disbursedAmount: '₹85 Lakhs',
    status: 'Active',
  },
  {
    id: 'SCH-103',
    schemeName: 'Sub-Mission on Agroforestry (SMAF)',
    department: 'Ministry of Environment, Forest & Climate Change',
    activeApplications: 156,
    disbursedAmount: '₹42 Lakhs',
    status: 'Under Review',
  },
];

export function GovtBodyDashboardView() {
  const [selectedScheme, setSelectedScheme] = useState<GovtSchemeRecord | null>(null);

  return (
    <View style={styles.container}>
      {/* Top Banner / Welcome Card */}
      <View style={styles.heroCard}>
        <View style={styles.heroHeader}>
          <View style={styles.badgeGovt}>
            <MaterialCommunityIcons name="shield-account" size={16} color="#0F766E" />
            <Text style={styles.badgeGovtText}>Official Govt Portal</Text>
          </View>
          <Text style={styles.heroTitle}>Government Body Command Center</Text>
          <Text style={styles.heroSub}>
            District Agriculture & Environmental Policy Verification
          </Text>
        </View>
      </View>

      {/* Primary Key Performance Indicators */}
      <Text style={styles.sectionHeader}>District Policy Metrics</Text>
      <View style={styles.kpiGrid}>
        <View style={styles.kpiCard}>
          <MaterialCommunityIcons name="file-document-check" size={24} color={COLORS.primary} />
          <Text style={styles.kpiValue}>1,388</Text>
          <Text style={styles.kpiLabel}>Total Subsidy Apps</Text>
        </View>

        <View style={styles.kpiCard}>
          <MaterialCommunityIcons name="cash-multiple" size={24} color="#16A34A" />
          <Text style={styles.kpiValue}>₹2.51 Cr</Text>
          <Text style={styles.kpiLabel}>Disbursed Funds</Text>
        </View>

        <View style={styles.kpiCard}>
          <MaterialCommunityIcons name="tree" size={24} color="#0F766E" />
          <Text style={styles.kpiValue}>4,520</Text>
          <Text style={styles.kpiLabel}>Verified Saplings</Text>
        </View>

        <View style={styles.kpiCard}>
          <MaterialCommunityIcons name="account-group" size={24} color="#0284C7" />
          <Text style={styles.kpiValue}>1,240</Text>
          <Text style={styles.kpiLabel}>Verified Farmers</Text>
        </View>
      </View>

      {/* Schemes & Subsidies Management */}
      <View style={styles.schemesSection}>
        <Text style={styles.sectionHeader}>Active Govt Schemes & Allocations</Text>
        {GOVT_SCHEMES.map((scheme) => (
          <TouchableOpacity
            key={scheme.id}
            style={styles.schemeCard}
            activeOpacity={0.85}
            onPress={() => setSelectedScheme(scheme)}
          >
            <View style={styles.schemeHeaderRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.schemeTitle}>{scheme.schemeName}</Text>
                <Text style={styles.schemeDept}>{scheme.department}</Text>
              </View>
              <Text style={styles.schemeBadge}>{scheme.status}</Text>
            </View>

            <View style={styles.schemeFooter}>
              <Text style={styles.schemeFooterText}>
                Applications: <Text style={{ fontWeight: '800' }}>{scheme.activeApplications}</Text>
              </Text>
              <Text style={styles.schemeFooterText}>
                Disbursed: <Text style={{ fontWeight: '800', color: '#16A34A' }}>{scheme.disbursedAmount}</Text>
              </Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>

      {/* Scheme Detail Modal */}
      {selectedScheme && (
        <Modal
          animationType="slide"
          transparent
          visible={!!selectedScheme}
          onRequestClose={() => setSelectedScheme(null)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalCard}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Scheme Allocation Details</Text>
                <TouchableOpacity onPress={() => setSelectedScheme(null)}>
                  <MaterialCommunityIcons name="close" size={24} color="#0F172A" />
                </TouchableOpacity>
              </View>

              <Text style={styles.modalSchemeName}>{selectedScheme.schemeName}</Text>
              <Text style={styles.modalDept}>{selectedScheme.department}</Text>

              <View style={styles.modalInfoBox}>
                <View style={styles.modalInfoRow}>
                  <Text style={styles.modalInfoLabel}>Total Applications</Text>
                  <Text style={styles.modalInfoVal}>{selectedScheme.activeApplications}</Text>
                </View>
                <View style={styles.modalInfoRow}>
                  <Text style={styles.modalInfoLabel}>Funds Disbursed</Text>
                  <Text style={[styles.modalInfoVal, { color: '#16A34A' }]}>
                    {selectedScheme.disbursedAmount}
                  </Text>
                </View>
                <View style={styles.modalInfoRow}>
                  <Text style={styles.modalInfoLabel}>Verification Status</Text>
                  <Text style={styles.modalInfoVal}>{selectedScheme.status}</Text>
                </View>
              </View>
            </View>
          </View>
        </Modal>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 4,
    paddingTop: 16,
  },
  heroCard: {
    backgroundColor: '#0F766E',
    borderRadius: 22,
    padding: 22,
    marginBottom: 20,
    width: '100%',
    ...SHADOWS.soft,
  },
  heroHeader: {
    alignItems: 'flex-start',
  },
  badgeGovt: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#CCFBF1',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 10,
  },
  badgeGovtText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#0F766E',
    marginLeft: 6,
  },
  heroTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  heroSub: {
    fontSize: 13,
    color: '#99F6E4',
    marginTop: 4,
  },
  sectionHeader: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 12,
  },
  kpiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  kpiCard: {
    width: '48.8%',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    ...SHADOWS.soft,
  },
  kpiValue: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
    marginTop: 8,
  },
  kpiLabel: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '600',
    marginTop: 2,
  },
  schemesSection: {
    marginBottom: 24,
  },
  schemeCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    ...SHADOWS.soft,
  },
  schemeHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  schemeTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
  },
  schemeDept: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  schemeBadge: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0F766E',
    backgroundColor: '#CCFBF1',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    overflow: 'hidden',
  },
  schemeFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  schemeFooterText: {
    fontSize: 12,
    color: '#475569',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 24,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
  },
  modalSchemeName: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.primary,
  },
  modalDept: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 2,
    marginBottom: 16,
  },
  modalInfoBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  modalInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  modalInfoLabel: {
    fontSize: 13,
    color: '#64748B',
  },
  modalInfoVal: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F172A',
  },
});

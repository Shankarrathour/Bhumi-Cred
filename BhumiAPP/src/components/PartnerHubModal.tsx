import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  TextInput,
  Alert,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, TYPOGRAPHY, SHADOWS } from '../theme/theme';

const { width } = Dimensions.get('window');

export type PartnerHubTab = 'land' | 'mrv' | 'carbon' | 'documents' | 'notifications' | 'support';

interface PartnerHubModalProps {
  visible: boolean;
  initialTab?: PartnerHubTab;
  onClose: () => void;
}

export function PartnerHubModal({ visible, initialTab = 'land', onClose }: PartnerHubModalProps) {
  const [activeTab, setActiveTab] = useState<PartnerHubTab>(initialTab);

  // Search & Filter States
  const [supportQuery, setSupportQuery] = useState('');
  const [ticketCreatedMsg, setTicketCreatedMsg] = useState(false);

  const renderTabHeader = () => {
    const tabs: { key: PartnerHubTab; label: string; icon: string }[] = [
      { key: 'land', label: 'Land & GIS', icon: 'map-marker-path' },
      { key: 'mrv', label: 'MRV Status', icon: 'eye-check-outline' },
      { key: 'carbon', label: 'Carbon Credits', icon: 'leaf' },
      { key: 'documents', label: 'Documents Vault', icon: 'file-multiple-outline' },
      { key: 'notifications', label: 'Notifications', icon: 'bell-outline' },
      { key: 'support', label: 'Support & Tickets', icon: 'headphones' },
    ];

    return (
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.tabHeaderContainer}
      >
        {tabs.map((tab) => {
          const isActive = activeTab === tab.key;
          return (
            <TouchableOpacity
              key={tab.key}
              style={[styles.tabButton, isActive && styles.tabButtonActive]}
              onPress={() => setActiveTab(tab.key)}
              activeOpacity={0.8}
            >
              <MaterialCommunityIcons
                name={tab.icon as any}
                size={18}
                color={isActive ? '#FFFFFF' : COLORS.textSecondary}
              />
              <Text style={[styles.tabLabel, isActive && styles.tabLabelActive]}>{tab.label}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    );
  };

  const renderLandGis = () => (
    <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
      <View style={styles.cardBox}>
        <View style={styles.cardHeaderRow}>
          <MaterialCommunityIcons name="google-maps" size={24} color={COLORS.primary} />
          <Text style={styles.cardTitle}>Assigned Land & GIS Polygons</Text>
        </View>
        <Text style={styles.cardDesc}>
          Interactive satellite mapping & land parcel boundary verification.
        </Text>

        <View style={styles.mapMockBlock}>
          <MaterialCommunityIcons name="map-legend" size={48} color={COLORS.primary} />
          <Text style={styles.mapMockText}>GIS Satellite Polygon Verified</Text>
          <Text style={styles.mapMockSub}>14 Plots • 124.5 Total Acres • Hoshangabad Cluster</Text>
        </View>

        <View style={styles.metricGrid}>
          <View style={styles.metricCard}>
            <Text style={styles.metricVal}>124.5</Text>
            <Text style={styles.metricSub}>Acres Surveyed</Text>
          </View>
          <View style={styles.metricCard}>
            <Text style={[styles.metricVal, { color: '#16A34A' }]}>100%</Text>
            <Text style={styles.metricSub}>GIS Polygon Approved</Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );

  const renderMrv = () => (
    <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
      <View style={styles.cardBox}>
        <View style={styles.cardHeaderRow}>
          <MaterialCommunityIcons name="shield-search" size={24} color={COLORS.primary} />
          <Text style={styles.cardTitle}>MRV Monitoring & Verification</Text>
        </View>
        <Text style={styles.cardDesc}>
          Measurement, Reporting & Verification of field visits, tree growth & soil sample testing.
        </Text>

        <View style={styles.mrvItem}>
          <MaterialCommunityIcons name="checkbox-marked-circle-outline" size={22} color="#16A34A" />
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={styles.mrvTitle}>Quarterly Field Visit Audit</Text>
            <Text style={styles.mrvSub}>Completed by Agro-specialist • 450 Trees Sampled</Text>
          </View>
          <Text style={styles.statusBadgeGreen}>Verified</Text>
        </View>

        <View style={styles.mrvItem}>
          <MaterialCommunityIcons name="clock-outline" size={22} color="#D97706" />
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={styles.mrvTitle}>Soil Organic Carbon Test</Text>
            <Text style={styles.mrvSub}>Lab testing in progress • Expected June 20</Text>
          </View>
          <Text style={styles.statusBadgeAmber}>Pending</Text>
        </View>
      </View>
    </ScrollView>
  );

  const renderCarbon = () => (
    <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
      <View style={styles.cardBox}>
        <View style={styles.cardHeaderRow}>
          <MaterialCommunityIcons name="leaf" size={24} color="#16A34A" />
          <Text style={styles.cardTitle}>Carbon Credits Dashboard</Text>
        </View>
        <Text style={styles.cardDesc}>
          Track verified carbon offsets, generated credits, available inventory & sales.
        </Text>

        <View style={styles.metricGrid3}>
          <View style={styles.metricCard3}>
            <Text style={styles.metricVal3}>1,850</Text>
            <Text style={styles.metricSub3}>Generated Credits</Text>
          </View>
          <View style={styles.metricCard3}>
            <Text style={[styles.metricVal3, { color: '#0F766E' }]}>1,200</Text>
            <Text style={styles.metricSub3}>Available Inventory</Text>
          </View>
          <View style={styles.metricCard3}>
            <Text style={[styles.metricVal3, { color: '#16A34A' }]}>650</Text>
            <Text style={styles.metricSub3}>Sold Credits</Text>
          </View>
        </View>

        <View style={styles.historyBlock}>
          <Text style={styles.sectionTitle}>Recent Credit Issuance</Text>
          <View style={styles.historyRow}>
            <Text style={styles.historyTitle}>Verra Certified Batch #8812</Text>
            <Text style={styles.historyAmount}>+450 tCO2e</Text>
          </View>
          <View style={styles.historyRow}>
            <Text style={styles.historyTitle}>Gold Standard Batch #7741</Text>
            <Text style={styles.historyAmount}>+200 tCO2e</Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );

  const renderDocuments = () => (
    <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
      <View style={styles.cardBox}>
        <View style={styles.cardHeaderRow}>
          <MaterialCommunityIcons name="folder-text-outline" size={24} color={COLORS.primary} />
          <Text style={styles.cardTitle}>Documents & Compliance Vault</Text>
        </View>
        <Text style={styles.cardDesc}>
          Access company agreements, project contracts, GIS reports & upload compliance files.
        </Text>

        <TouchableOpacity
          style={styles.uploadBox}
          activeOpacity={0.8}
          onPress={() => Alert.alert('Upload', 'Select file to upload to compliance vault')}
        >
          <MaterialCommunityIcons name="cloud-upload-outline" size={32} color={COLORS.primary} />
          <Text style={styles.uploadTitle}>Upload New Compliance Document</Text>
          <Text style={styles.uploadSub}>PDF, PNG, JPG (Max 10MB)</Text>
        </TouchableOpacity>

        <View style={styles.docList}>
          <View style={styles.docRow}>
            <MaterialCommunityIcons name="file-pdf-box" size={24} color="#DC2626" />
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={styles.docTitle}>Partner Master Agreement 2026.pdf</Text>
              <Text style={styles.docMeta}>Approved • Verra Compliant</Text>
            </View>
            <MaterialCommunityIcons name="download" size={20} color={COLORS.primary} />
          </View>
          <View style={styles.docRow}>
            <MaterialCommunityIcons name="file-document" size={24} color="#0F766E" />
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={styles.docTitle}>GIS Satellite Survey Report Q1.pdf</Text>
              <Text style={styles.docMeta}>Approved • 124.5 Acres</Text>
            </View>
            <MaterialCommunityIcons name="download" size={20} color={COLORS.primary} />
          </View>
        </View>
      </View>
    </ScrollView>
  );

  const renderNotifications = () => (
    <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
      <View style={styles.cardBox}>
        <View style={styles.cardHeaderRow}>
          <MaterialCommunityIcons name="bell-ring-outline" size={24} color={COLORS.primary} />
          <Text style={styles.cardTitle}>Partner Updates & Notifications</Text>
        </View>
        <Text style={styles.cardDesc}>
          Live updates regarding project progress, document approvals & payment settlements.
        </Text>

        <View style={styles.notifRow}>
          <View style={[styles.notifIconCircle, { backgroundColor: '#DCFCE7' }]}>
            <MaterialCommunityIcons name="cash-check" size={20} color="#16A34A" />
          </View>
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={styles.notifTitle}>Settlement Disbursement Complete</Text>
            <Text style={styles.notifDesc}>₹45,000 credited to Partner Wallet for Batch #8812.</Text>
            <Text style={styles.notifTime}>Today • 2:30 PM</Text>
          </View>
        </View>

        <View style={styles.notifRow}>
          <View style={[styles.notifIconCircle, { backgroundColor: '#E0F2FE' }]}>
            <MaterialCommunityIcons name="file-check-outline" size={20} color="#0284C7" />
          </View>
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={styles.notifTitle}>GIS Survey Approved</Text>
            <Text style={styles.notifDesc}>Hoshangabad Cluster 14 plots polygon verified.</Text>
            <Text style={styles.notifTime}>Yesterday • 11:15 AM</Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );

  const renderSupport = () => (
    <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
      <View style={styles.cardBox}>
        <View style={styles.cardHeaderRow}>
          <MaterialCommunityIcons name="headphones" size={24} color={COLORS.primary} />
          <Text style={styles.cardTitle}>Partner Help & Support Center</Text>
        </View>
        <Text style={styles.cardDesc}>
          Submit tickets, complaints, or raise queries with the BhumiCred Operations Team.
        </Text>

        {ticketCreatedMsg && (
          <View style={styles.successBanner}>
            <MaterialCommunityIcons name="check-circle" size={18} color="#16A34A" />
            <Text style={styles.successBannerText}>
              Support Ticket submitted successfully! Desk ID #TK-902
            </Text>
          </View>
        )}

        <View style={styles.formGroup}>
          <Text style={styles.formLabel}>Describe Query or Issue</Text>
          <TextInput
            style={styles.formInput}
            placeholder="Type your question or issue description..."
            placeholderTextColor="#94A3B8"
            multiline
            numberOfLines={4}
            value={supportQuery}
            onChangeText={setSupportQuery}
          />
        </View>

        <TouchableOpacity
          style={styles.submitTicketBtn}
          activeOpacity={0.85}
          onPress={() => {
            if (!supportQuery.trim()) return;
            setTicketCreatedMsg(true);
            setSupportQuery('');
          }}
        >
          <MaterialCommunityIcons name="send" size={18} color={COLORS.primaryDark} />
          <Text style={styles.submitTicketBtnText}>Submit Support Ticket</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );

  return (
    <Modal animationType="slide" transparent visible={visible} onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalCard}>
          {/* Top Bar */}
          <View style={styles.modalHeader}>
            <View>
              <Text style={styles.headerTitle}>Partner Hub & Services</Text>
              <Text style={styles.headerSub}>Manage Land, MRV, Carbon & Compliance</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <MaterialCommunityIcons name="close" size={24} color="#0F172A" />
            </TouchableOpacity>
          </View>

          {/* Horizontal Tab Headers */}
          {renderTabHeader()}

          {/* Tab Content */}
          {activeTab === 'land' && renderLandGis()}
          {activeTab === 'mrv' && renderMrv()}
          {activeTab === 'carbon' && renderCarbon()}
          {activeTab === 'documents' && renderDocuments()}
          {activeTab === 'notifications' && renderNotifications()}
          {activeTab === 'support' && renderSupport()}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingTop: 20,
    paddingBottom: 24,
    maxHeight: '90%',
    minHeight: '75%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
  },
  headerSub: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabHeaderContainer: {
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  tabButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 10,
  },
  tabButtonActive: {
    backgroundColor: COLORS.primary,
  },
  tabLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textSecondary,
    marginLeft: 6,
  },
  tabLabelActive: {
    color: '#FFFFFF',
  },
  tabContent: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  cardBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 20,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
    marginLeft: 10,
  },
  cardDesc: {
    fontSize: 13,
    color: '#64748B',
    lineHeight: 18,
    marginBottom: 16,
  },
  mapMockBlock: {
    backgroundColor: '#ECFDF5',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    marginBottom: 16,
  },
  mapMockText: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.primary,
    marginTop: 8,
  },
  mapMockSub: {
    fontSize: 12,
    color: '#0F766E',
    marginTop: 4,
  },
  metricGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  metricCard: {
    flex: 0.48,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
  },
  metricVal: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
  },
  metricSub: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '600',
    marginTop: 2,
  },
  mrvItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  mrvTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
  },
  mrvSub: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  statusBadgeGreen: {
    fontSize: 11,
    fontWeight: '700',
    color: '#16A34A',
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  statusBadgeAmber: {
    fontSize: 11,
    fontWeight: '700',
    color: '#D97706',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  metricGrid3: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  metricCard3: {
    flex: 0.31,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
  },
  metricVal3: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  metricSub3: {
    fontSize: 10,
    color: '#64748B',
    fontWeight: '600',
    marginTop: 2,
    textAlign: 'center',
  },
  historyBlock: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 10,
  },
  historyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  historyTitle: {
    fontSize: 12,
    color: '#334155',
    fontWeight: '600',
  },
  historyAmount: {
    fontSize: 12,
    fontWeight: '700',
    color: '#16A34A',
  },
  uploadBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: COLORS.primary,
    borderStyle: 'dashed',
    marginBottom: 16,
  },
  uploadTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.primary,
    marginTop: 8,
  },
  uploadSub: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  docList: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  docRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  docTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  docMeta: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  notifRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  notifIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notifTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
  },
  notifDesc: {
    fontSize: 12,
    color: '#475569',
    marginTop: 2,
  },
  notifTime: {
    fontSize: 10,
    color: '#94A3B8',
    marginTop: 4,
  },
  formGroup: {
    marginBottom: 16,
  },
  formLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 8,
  },
  formInput: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    fontSize: 14,
    color: '#0F172A',
    textAlignVertical: 'top',
  },
  submitTicketBtn: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.accent,
    paddingVertical: 14,
    borderRadius: 14,
    ...SHADOWS.soft,
  },
  submitTicketBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.primaryDark,
    marginLeft: 8,
  },
  successBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DCFCE7',
    padding: 12,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#86EFAC',
  },
  successBannerText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#15803D',
    marginLeft: 8,
  },
});

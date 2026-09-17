import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Modal,
  ScrollView,
  ActivityIndicator,
  TextInput,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, TYPOGRAPHY, SHADOWS } from '../theme/theme';
import api from '../api/apiClient';
import { useConnectivityStore } from '../store/connectivityStore';

const { width } = Dimensions.get('window');

interface GovtMetrics {
  total_farmers: number;
  public_land_acres: number;
  trees_count: number;
  soil_testing_requests: number;
  insurance_activity: number;
  active_projects: number;
  campaigns_count: number;
  carbon_activity_tco2e: number;
  pending_approvals: number;
  notification_count: number;
  pending_approval_count: number;
  canopy_health_score: number;
}

interface JurisdictionInfo {
  state: string;
  district: string;
  govt_type: string;
  org_name: string;
  department: string;
}

interface AuditEvent {
  id: string;
  action: string;
  timestamp: string;
  actor: string;
  notes?: string;
}

interface GovtSchemeRecord {
  id: string;
  schemeName: string;
  department: string;
  activeApplications: number;
  disbursedAmount: string;
  status: 'Active' | 'Under Review' | 'Closing Soon';
}

export function GovtBodyDashboardView() {
  const router = useRouter();
  const isOnline = useConnectivityStore((state) => state.isOnline);

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [metrics, setMetrics] = useState<GovtMetrics | null>(null);
  const [jurisdiction, setJurisdiction] = useState<JurisdictionInfo | null>(null);
  const [recentActivity, setRecentActivity] = useState<AuditEvent[]>([]);
  const [schemes, setSchemes] = useState<GovtSchemeRecord[]>([]);

  // Modal states
  const [selectedScheme, setSelectedScheme] = useState<GovtSchemeRecord | null>(null);
  const [isAddAssetModalVisible, setIsAddAssetModalVisible] = useState<boolean>(false);

  // Form state for Add Public Asset Modal
  const [assetForm, setAssetForm] = useState({
    name: '',
    category: 'Public Land',
    authority: 'Gram Panchayat',
    area_acres: '',
    mature_trees_count: '',
    saplings_count: '',
    khasra_number: '',
    district: 'Hoshangabad',
    state: 'Madhya Pradesh',
  });
  const [isSubmittingAsset, setIsSubmittingAsset] = useState<boolean>(false);

  const fetchDashboardStats = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await api.get('/govt/dashboard/stats');
      if (response.data && response.data.success && response.data.data) {
        const d = response.data.data;
        setMetrics(d.metrics || null);
        setJurisdiction(d.jurisdiction || null);
        setRecentActivity(d.recent_activity || []);
        setSchemes(d.schemes || []);
      } else {
        throw new Error('Invalid dashboard response structure.');
      }
    } catch (err: any) {
      console.warn('[GovtBodyDashboardView] Fetch stats error:', err);
      setError(err?.message || 'Unable to load government dashboard statistics.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const handleCreateAsset = async () => {
    if (!assetForm.name.trim()) {
      Alert.alert('Validation Error', 'Please enter public asset name.');
      return;
    }
    if (!assetForm.area_acres || isNaN(Number(assetForm.area_acres)) || Number(assetForm.area_acres) <= 0) {
      Alert.alert('Validation Error', 'Please enter a valid area in acres.');
      return;
    }

    setIsSubmittingAsset(true);
    try {
      const payload = {
        name: assetForm.name.trim(),
        category: assetForm.category,
        authority: assetForm.authority,
        area_acres: Number(assetForm.area_acres),
        mature_trees_count: Number(assetForm.mature_trees_count) || 0,
        saplings_count: Number(assetForm.saplings_count) || 0,
        khasra_number: assetForm.khasra_number.trim(),
        district: assetForm.district,
        state: assetForm.state,
      };

      const res = await api.post('/govt/assets', payload);
      if (res.data && res.data.success) {
        Alert.alert('Success', 'Public Asset submitted for satellite MRV baseline!');
        setIsAddAssetModalVisible(false);
        setAssetForm({
          name: '',
          category: 'Public Land',
          authority: 'Gram Panchayat',
          area_acres: '',
          mature_trees_count: '',
          saplings_count: '',
          khasra_number: '',
          district: 'Hoshangabad',
          state: 'Madhya Pradesh',
        });
        fetchDashboardStats();
      }
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.detail || 'Failed to submit public asset.');
    } finally {
      setIsSubmittingAsset(false);
    }
  };

  if (!isOnline) {
    return (
      <View style={styles.stateContainer}>
        <MaterialCommunityIcons name="wifi-off" size={48} color="#EF4444" />
        <Text style={styles.stateTitle}>Offline Mode</Text>
        <Text style={styles.stateSubtitle}>You are currently offline. Connect to the internet to view real-time government policy analytics.</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={fetchDashboardStats}>
          <Text style={styles.retryBtnText}>Retry Connection</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (isLoading) {
    return (
      <View style={styles.stateContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Fetching Government Jurisdiction Statistics...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.stateContainer}>
        <MaterialCommunityIcons name="alert-circle-outline" size={48} color="#EF4444" />
        <Text style={styles.stateTitle}>Unable to Load Dashboard</Text>
        <Text style={styles.stateSubtitle}>{error}</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={fetchDashboardStats}>
          <Text style={styles.retryBtnText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Top Banner / Welcome Card */}
      <View style={styles.heroCard}>
        <View style={styles.heroHeader}>
          <View style={styles.badgeGovt}>
            <MaterialCommunityIcons name="shield-account" size={16} color="#0F766E" />
            <Text style={styles.badgeGovtText}>Official Govt Command Center</Text>
          </View>
          <Text style={styles.heroTitle}>
            {jurisdiction?.org_name || 'Government Body Portal'}
          </Text>
          <Text style={styles.heroSub}>
            {jurisdiction?.department || 'Department of Agriculture & Rural Policy'} • {jurisdiction?.district || 'Hoshangabad'}, {jurisdiction?.state || 'Madhya Pradesh'}
          </Text>
        </View>

        {/* Notifications & Pending Badges */}
        <View style={styles.statusBadgesRow}>
          <View style={styles.statusBadgePill}>
            <MaterialCommunityIcons name="clock-alert-outline" size={14} color="#D97706" />
            <Text style={styles.statusBadgeText}>
              Pending Approvals: <Text style={{ fontWeight: '800' }}>{metrics?.pending_approvals || 0}</Text>
            </Text>
          </View>
          <View style={[styles.statusBadgePill, { backgroundColor: '#E0F2FE' }]}>
            <MaterialCommunityIcons name="bell-ring-outline" size={14} color="#0284C7" />
            <Text style={[styles.statusBadgeText, { color: '#0369A1' }]}>
              Notifications: <Text style={{ fontWeight: '800' }}>{metrics?.notification_count || 0}</Text>
            </Text>
          </View>
        </View>
      </View>

      {/* Quick Action Navigation Grid */}
      <Text style={styles.sectionHeader}>Quick Actions & Operations</Text>
      <View style={styles.quickActionsGrid}>
        <TouchableOpacity
          style={styles.actionBtn}
          activeOpacity={0.8}
          onPress={() => setIsAddAssetModalVisible(true)}
        >
          <View style={[styles.actionIconWrap, { backgroundColor: '#ECFDF5' }]}>
            <MaterialCommunityIcons name="plus-box" size={22} color="#059669" />
          </View>
          <Text style={styles.actionLabel}>Add Asset</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionBtn}
          activeOpacity={0.8}
          onPress={() => router.push('/(tabs)/farmers')}
        >
          <View style={[styles.actionIconWrap, { backgroundColor: '#E0F2FE' }]}>
            <MaterialCommunityIcons name="account-group" size={22} color="#0284C7" />
          </View>
          <Text style={styles.actionLabel}>Farmers</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionBtn}
          activeOpacity={0.8}
          onPress={() => router.push('/soil-testing')}
        >
          <View style={[styles.actionIconWrap, { backgroundColor: '#FEF3C7' }]}>
            <MaterialCommunityIcons name="flask-outline" size={22} color="#D97706" />
          </View>
          <Text style={styles.actionLabel}>Soil Testing</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionBtn}
          activeOpacity={0.8}
          onPress={() => router.push('/insurance')}
        >
          <View style={[styles.actionIconWrap, { backgroundColor: '#FEE2E2' }]}>
            <MaterialCommunityIcons name="shield-check" size={22} color="#DC2626" />
          </View>
          <Text style={styles.actionLabel}>Insurance</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionBtn}
          activeOpacity={0.8}
          onPress={() => router.push('/(tabs)/projects')}
        >
          <View style={[styles.actionIconWrap, { backgroundColor: '#F3E8FF' }]}>
            <MaterialCommunityIcons name="folder-text-outline" size={22} color="#9333EA" />
          </View>
          <Text style={styles.actionLabel}>Projects</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionBtn}
          activeOpacity={0.8}
          onPress={() => router.push('/(tabs)/track')}
        >
          <View style={[styles.actionIconWrap, { backgroundColor: '#CCFBF1' }]}>
            <MaterialCommunityIcons name="map-search-outline" size={22} color="#0F766E" />
          </View>
          <Text style={styles.actionLabel}>GIS Map</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionBtn}
          activeOpacity={0.8}
          onPress={() => router.push('/(tabs)/reports')}
        >
          <View style={[styles.actionIconWrap, { backgroundColor: '#E0E7FF' }]}>
            <MaterialCommunityIcons name="chart-box-outline" size={22} color="#4F46E5" />
          </View>
          <Text style={styles.actionLabel}>Reports</Text>
        </TouchableOpacity>
      </View>

      {/* Dynamic Key Performance Indicators */}
      <Text style={styles.sectionHeader}>Live Jurisdiction Metrics</Text>
      <View style={styles.kpiGrid}>
        <TouchableOpacity
          style={styles.kpiCard}
          activeOpacity={0.8}
          onPress={() => router.push('/(tabs)/farmers')}
        >
          <MaterialCommunityIcons name="account-group" size={24} color="#0284C7" />
          <Text style={styles.kpiValue}>{metrics?.total_farmers.toLocaleString() || '0'}</Text>
          <Text style={styles.kpiLabel}>Total Farmers</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.kpiCard}
          activeOpacity={0.8}
          onPress={() => router.push('/(tabs)/track')}
        >
          <MaterialCommunityIcons name="map-marker-path" size={24} color={COLORS.primary} />
          <Text style={styles.kpiValue}>{metrics?.public_land_acres || '0'} Acres</Text>
          <Text style={styles.kpiLabel}>Public Land / Assets</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.kpiCard}
          activeOpacity={0.8}
          onPress={() => router.push('/(tabs)/projects')}
        >
          <MaterialCommunityIcons name="tree" size={24} color="#0F766E" />
          <Text style={styles.kpiValue}>{metrics?.trees_count.toLocaleString() || '0'}</Text>
          <Text style={styles.kpiLabel}>Trees & Saplings</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.kpiCard}
          activeOpacity={0.8}
          onPress={() => router.push('/soil-testing')}
        >
          <MaterialCommunityIcons name="flask-outline" size={24} color="#D97706" />
          <Text style={styles.kpiValue}>{metrics?.soil_testing_requests || '0'}</Text>
          <Text style={styles.kpiLabel}>Soil Requests</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.kpiCard}
          activeOpacity={0.8}
          onPress={() => router.push('/insurance')}
        >
          <MaterialCommunityIcons name="shield-check" size={24} color="#DC2626" />
          <Text style={styles.kpiValue}>{metrics?.insurance_activity || '0'}</Text>
          <Text style={styles.kpiLabel}>Active Policies</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.kpiCard}
          activeOpacity={0.8}
          onPress={() => router.push('/(tabs)/projects')}
        >
          <MaterialCommunityIcons name="folder-clock-outline" size={24} color="#9333EA" />
          <Text style={styles.kpiValue}>{metrics?.active_projects || '0'}</Text>
          <Text style={styles.kpiLabel}>Active Projects</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.kpiCard}
          activeOpacity={0.8}
          onPress={() => router.push('/(tabs)/reports')}
        >
          <MaterialCommunityIcons name="molecule-co2" size={24} color="#16A34A" />
          <Text style={styles.kpiValue}>{metrics?.carbon_activity_tco2e.toLocaleString() || '0'} tCO₂e</Text>
          <Text style={styles.kpiLabel}>Carbon Sequestration</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.kpiCard}
          activeOpacity={0.8}
          onPress={() => router.push('/(tabs)/reports')}
        >
          <MaterialCommunityIcons name="sine-wave" size={24} color="#2563EB" />
          <Text style={styles.kpiValue}>{metrics?.canopy_health_score || '92'}%</Text>
          <Text style={styles.kpiLabel}>Canopy Health Score</Text>
        </TouchableOpacity>
      </View>

      {/* Recent Activity Audit Timeline */}
      {recentActivity.length > 0 && (
        <View style={styles.activitySection}>
          <Text style={styles.sectionHeader}>Recent Audit & Field Activity</Text>
          {recentActivity.slice(0, 5).map((ev) => (
            <View key={ev.id} style={styles.activityCard}>
              <View style={styles.activityIconWrap}>
                <MaterialCommunityIcons name="clock-outline" size={18} color="#0F766E" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.activityTitle}>{ev.action}</Text>
                <Text style={styles.activityNotes}>{ev.notes || 'Activity logged in jurisdiction'}</Text>
                <Text style={styles.activityMeta}>By: {ev.actor} • {new Date(ev.timestamp).toLocaleDateString()}</Text>
              </View>
            </View>
          ))}
        </View>
      )}

      {/* Schemes & Subsidies Management */}
      <View style={styles.schemesSection}>
        <Text style={styles.sectionHeader}>Active Govt Schemes & Allocations</Text>
        {schemes.map((scheme) => (
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

      {/* Add Public Asset Modal */}
      <Modal
        animationType="slide"
        transparent
        visible={isAddAssetModalVisible}
        onRequestClose={() => setIsAddAssetModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <ScrollView contentContainerStyle={styles.modalCardScroll}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Register Public Asset</Text>
              <TouchableOpacity onPress={() => setIsAddAssetModalVisible(false)}>
                <MaterialCommunityIcons name="close" size={24} color="#0F172A" />
              </TouchableOpacity>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Asset Name *</Text>
              <TextInput
                style={styles.textInput}
                placeholder="e.g. Narmada Riverbank Green Belt"
                value={assetForm.name}
                onChangeText={(text) => setAssetForm({ ...assetForm, name: text })}
              />
            </View>

            <View style={styles.inputRow}>
              <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
                <Text style={styles.inputLabel}>Area (Acres) *</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="e.g. 12.5"
                  keyboardType="numeric"
                  value={assetForm.area_acres}
                  onChangeText={(text) => setAssetForm({ ...assetForm, area_acres: text })}
                />
              </View>
              <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
                <Text style={styles.inputLabel}>Khasra Number</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="e.g. 142/2"
                  value={assetForm.khasra_number}
                  onChangeText={(text) => setAssetForm({ ...assetForm, khasra_number: text })}
                />
              </View>
            </View>

            <View style={styles.inputRow}>
              <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
                <Text style={styles.inputLabel}>Mature Trees Count</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="e.g. 1200"
                  keyboardType="numeric"
                  value={assetForm.mature_trees_count}
                  onChangeText={(text) => setAssetForm({ ...assetForm, mature_trees_count: text })}
                />
              </View>
              <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
                <Text style={styles.inputLabel}>Saplings Count</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="e.g. 450"
                  keyboardType="numeric"
                  value={assetForm.saplings_count}
                  onChangeText={(text) => setAssetForm({ ...assetForm, saplings_count: text })}
                />
              </View>
            </View>

            <TouchableOpacity
              style={[styles.submitAssetBtn, isSubmittingAsset && { opacity: 0.6 }]}
              onPress={handleCreateAsset}
              disabled={isSubmittingAsset}
            >
              {isSubmittingAsset ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.submitAssetBtnText}>Submit for Satellite MRV</Text>
              )}
            </TouchableOpacity>
          </ScrollView>
        </View>
      </Modal>

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
  stateContainer: {
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 280,
  },
  stateTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
    marginTop: 12,
  },
  stateSubtitle: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 18,
  },
  loadingText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.primary,
    marginTop: 12,
  },
  retryBtn: {
    marginTop: 16,
    backgroundColor: COLORS.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 12,
  },
  retryBtnText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 13,
  },
  heroCard: {
    backgroundColor: '#0F766E',
    borderRadius: 22,
    padding: 20,
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
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  heroSub: {
    fontSize: 12,
    color: '#99F6E4',
    marginTop: 4,
  },
  statusBadgesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 14,
    gap: 8,
  },
  statusBadgePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#B45309',
    marginLeft: 4,
  },
  sectionHeader: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 12,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
    gap: 10,
    marginBottom: 20,
  },
  actionBtn: {
    width: '23%',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    ...SHADOWS.soft,
  },
  actionIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  actionLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#334155',
    textAlign: 'center',
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
    fontSize: 18,
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
  activitySection: {
    marginBottom: 20,
  },
  activityCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  activityIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#CCFBF1',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
    marginTop: 2,
  },
  activityTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F172A',
  },
  activityNotes: {
    fontSize: 12,
    color: '#475569',
    marginTop: 2,
  },
  activityMeta: {
    fontSize: 10,
    color: '#94A3B8',
    marginTop: 4,
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
  modalCardScroll: {
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
  inputGroup: {
    marginBottom: 12,
  },
  inputRow: {
    flexDirection: 'row',
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 4,
  },
  textInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    color: '#0F172A',
  },
  submitAssetBtn: {
    backgroundColor: '#0F766E',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 12,
  },
  submitAssetBtnText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 14,
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

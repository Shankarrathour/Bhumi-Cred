import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Modal,
  ActivityIndicator,
  Alert,
  Dimensions,
  FlatList,
} from 'react-native';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { COLORS, SHADOWS } from '../theme/theme';
import api from '../api/apiClient';
import { useConnectivityStore } from '../store/connectivityStore';

const { width } = Dimensions.get('window');

export interface NPKResults {
  nitrogen_kg_ha: number;
  nitrogen_rating: string;
  phosphorus_kg_ha: number;
  phosphorus_rating: string;
  potassium_kg_ha: number;
  potassium_rating: string;
  soc_percent: number;
  ph_value: number;
  soil_texture: string;
  recommendations: string;
}

export interface SoilTestRequest {
  id: string;
  target_name: string;
  target_type: 'public_asset' | 'farmer' | 'land_parcel';
  target_id?: string;
  target_farmer_name?: string;
  target_khasra?: string;
  test_type: string;
  sample_count: number;
  location_address: string;
  district: string;
  state: string;
  preferred_date: string;
  status: string; // 'Submitted' | 'Assigned' | 'Scheduled' | 'Sample Collected' | 'Lab Processing' | 'Report Ready' | 'Completed'
  assigned_partner?: string;
  assigned_lab?: string;
  assigned_field_officer?: string;
  scheduled_date?: string;
  npk_results?: NPKResults;
  report_date?: string;
  pdf_url?: string;
  scheme_program?: string;
  submitted_at?: string;
  audit_timeline?: Array<{ timestamp: string; action: string; actor: string; notes?: string }>;
}

export interface DistrictAnalytics {
  district: string;
  state: string;
  average_soc_percent: number;
  average_ph_level: number;
  total_samples_analyzed: number;
  health_card_coverage_percent: number;
  npk_distribution: {
    nitrogen: { medium: number; low: number; high: number };
    phosphorus: { medium: number; low: number; high: number };
    potassium: { medium: number; low: number; high: number };
  };
  recommendation_summary: string;
}

export function GovtSoilTestingView() {
  const isOnline = useConnectivityStore((state) => state.isOnline);

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'requests' | 'campaigns' | 'analytics'>('requests');

  // Soil Requests State
  const [soilRequests, setSoilRequests] = useState<SoilTestRequest[]>([]);
  const [selectedRequest, setSelectedRequest] = useState<SoilTestRequest | null>(null);
  const [selectedRequestIds, setSelectedRequestIds] = useState<string[]>([]);

  // Analytics State
  const [analytics, setAnalytics] = useState<DistrictAnalytics | null>(null);

  // Order Soil Test Modal State
  const [isOrderModalOpen, setIsOrderModalOpen] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const [orderForm, setOrderForm] = useState({
    target_type: 'public_asset' as 'public_asset' | 'farmer' | 'land_parcel',
    target_name: 'Narmada Riverbank Green Belt & Miyawaki Park',
    target_id: 'AST-101',
    target_farmer_name: 'Gram Panchayat Sehore',
    target_khasra: '142/2',
    test_type: 'Standard NPK + Soil Organic Carbon (SOC)',
    sample_count: '10',
    location_address: 'Pipariya, Hoshangabad',
    district: 'Hoshangabad',
    state: 'Madhya Pradesh',
    preferred_date: '2026-09-25',
    scheme_program: 'PM-Soil Health Card & Organic Fertilizer Subsidy',
    notes: 'Order baseline soil test under Panchayat subsidy scheme.',
  });

  const fetchData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [reqRes, analyticsRes] = await Promise.all([
        api.get('/govt/soil-tests'),
        api.get('/govt/soil-tests/analytics/district'),
      ]);

      if (reqRes.data && reqRes.data.success) {
        setSoilRequests(reqRes.data.data);
      }
      if (analyticsRes.data && analyticsRes.data.success) {
        setAnalytics(analyticsRes.data.data);
      }
    } catch (err: any) {
      console.warn('[GovtSoilTestingView] Fetch error:', err);
      setError(err?.message || 'Unable to load soil testing records.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOrderSoilTest = async () => {
    if (!orderForm.target_name.trim()) {
      Alert.alert('Validation Error', 'Target name is required.');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        target_type: orderForm.target_type,
        target_name: orderForm.target_name.trim(),
        target_id: orderForm.target_id,
        target_farmer_name: orderForm.target_farmer_name,
        target_khasra: orderForm.target_khasra,
        test_type: orderForm.test_type,
        sample_count: Number(orderForm.sample_count) || 10,
        location_address: orderForm.location_address,
        district: orderForm.district,
        state: orderForm.state,
        preferred_date: orderForm.preferred_date,
        scheme_program: orderForm.scheme_program,
        notes: orderForm.notes,
      };

      const res = await api.post('/govt/soil-tests', payload);
      if (res.data && res.data.success) {
        Alert.alert('Success', 'Soil Testing Order submitted under Government Scheme!');
        setIsOrderModalOpen(false);
        fetchData();
      }
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.detail || 'Failed to submit soil test order.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBulkApprove = async () => {
    if (selectedRequestIds.length === 0) {
      Alert.alert('Selection Required', 'Select at least 1 pending soil request to approve.');
      return;
    }

    try {
      const payload = {
        request_ids: selectedRequestIds,
        action: 'APPROVE',
        scheme_name: 'PM-Soil Health Card & Organic Fertilizer Subsidy',
      };
      const res = await api.post('/govt/soil-tests/bulk-approve', payload);
      if (res.data && res.data.success) {
        Alert.alert('Bulk Approved', `Approved ${res.data.approved_count} soil testing orders under PM-Soil Health Card subsidy.`);
        setSelectedRequestIds([]);
        fetchData();
      }
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.detail || 'Failed to execute bulk approval.');
    }
  };

  const toggleSelectRequest = (id: string) => {
    if (selectedRequestIds.includes(id)) {
      setSelectedRequestIds(selectedRequestIds.filter((item) => item !== id));
    } else {
      setSelectedRequestIds([...selectedRequestIds, id]);
    }
  };

  if (!isOnline) {
    return (
      <View style={styles.stateContainer}>
        <MaterialCommunityIcons name="wifi-off" size={48} color="#EF4444" />
        <Text style={styles.stateTitle}>Offline Mode</Text>
        <Text style={styles.stateSubtitle}>Connect to network to view Soil Health Cards and order lab testing.</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={fetchData}>
          <Text style={styles.retryBtnText}>Retry Connection</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (isLoading) {
    return (
      <View style={styles.stateContainer}>
        <ActivityIndicator size="large" color="#0F766E" />
        <Text style={styles.loadingText}>Loading Soil Testing Workflow & District Analytics...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.stateContainer}>
        <MaterialCommunityIcons name="alert-circle-outline" size={48} color="#EF4444" />
        <Text style={styles.stateTitle}>Failed to Load Soil Records</Text>
        <Text style={styles.stateSubtitle}>{error}</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={fetchData}>
          <Text style={styles.retryBtnText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* ── 1. HEADER & ACTION CONTROLS ── */}
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.headerTitle}>Soil Testing & Health Cards</Text>
          <Text style={styles.headerSub}>Jurisdiction NPK & Organic Carbon (SOC) Desk</Text>
        </View>
        <TouchableOpacity style={styles.orderBtnCTA} onPress={() => setIsOrderModalOpen(true)}>
          <MaterialCommunityIcons name="flask-plus-outline" size={16} color="#FFFFFF" />
          <Text style={styles.orderBtnCTAText}>Order Test</Text>
        </TouchableOpacity>
      </View>

      {/* Segment Tabs */}
      <View style={styles.tabContainer}>
        {[
          { key: 'requests', label: 'Soil Requests', icon: 'flask-outline' },
          { key: 'analytics', label: 'District Index', icon: 'chart-arc' },
        ].map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[styles.tabBtn, activeTab === tab.key && styles.tabBtnActive]}
            onPress={() => setActiveTab(tab.key as any)}
          >
            <MaterialCommunityIcons
              name={tab.icon as any}
              size={16}
              color={activeTab === tab.key ? '#FFFFFF' : '#64748B'}
            />
            <Text style={[styles.tabBtnText, activeTab === tab.key && styles.tabBtnTextActive]}>{tab.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* ── TAB 1: SOIL REQUESTS DIRECTORY ── */}
      {activeTab === 'requests' && (
        <ScrollView contentContainerStyle={{ paddingBottom: 120 }}>
          {/* Bulk Approval Bar */}
          {selectedRequestIds.length > 0 && (
            <View style={styles.bulkApproveBar}>
              <Text style={styles.bulkText}>{selectedRequestIds.length} Requests Selected</Text>
              <TouchableOpacity style={styles.bulkCTA} onPress={handleBulkApprove}>
                <MaterialCommunityIcons name="check-all" size={16} color="#FFFFFF" />
                <Text style={styles.bulkCTAText}>Approve Scheme Subsidy</Text>
              </TouchableOpacity>
            </View>
          )}

          {soilRequests.length === 0 ? (
            <View style={styles.emptyCard}>
              <MaterialCommunityIcons name="flask-empty-outline" size={48} color="#94A3B8" />
              <Text style={styles.emptyTitle}>No Soil Testing Orders</Text>
              <Text style={styles.emptySub}>No active soil testing orders found in your jurisdiction.</Text>
              <TouchableOpacity style={styles.orderBtnCTA} onPress={() => setIsOrderModalOpen(true)}>
                <Text style={styles.orderBtnCTAText}>+ Order Scheme Soil Test</Text>
              </TouchableOpacity>
            </View>
          ) : (
            soilRequests.map((req) => {
              const isSelected = selectedRequestIds.includes(req.id);
              const isReportReady = req.status === 'Report Ready' || req.status === 'Completed';

              return (
                <TouchableOpacity
                  key={req.id}
                  style={[styles.requestCard, isSelected && styles.requestCardSelected]}
                  activeOpacity={0.88}
                  onPress={() => setSelectedRequest(req)}
                >
                  <View style={styles.cardHeader}>
                    <TouchableOpacity
                      style={styles.checkboxTouch}
                      onPress={() => toggleSelectRequest(req.id)}
                    >
                      <MaterialCommunityIcons
                        name={isSelected ? 'checkbox-marked-circle' : 'checkbox-blank-circle-outline'}
                        size={20}
                        color={isSelected ? '#0F766E' : '#94A3B8'}
                      />
                    </TouchableOpacity>
                    <View style={{ flex: 1, marginLeft: 8 }}>
                      <Text style={styles.targetName}>{req.target_name}</Text>
                      <Text style={styles.targetType}>Target: {req.target_type.toUpperCase()} • Scheme: {req.scheme_program || 'Panchayat Fund'}</Text>
                    </View>
                    <View
                      style={[
                        styles.statusBadge,
                        { backgroundColor: isReportReady ? '#DCFCE7' : '#EFF6FF' },
                      ]}
                    >
                      <Text
                        style={[
                          styles.statusBadgeText,
                          { color: isReportReady ? '#166534' : '#2563EB' },
                        ]}
                      >
                        {req.status}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.detailsGrid}>
                    <View style={styles.gridItem}>
                      <Text style={styles.gridLabel}>Test Type</Text>
                      <Text style={styles.gridVal} numberOfLines={1}>{req.test_type}</Text>
                    </View>
                    <View style={styles.gridItem}>
                      <Text style={styles.gridLabel}>Sample Count</Text>
                      <Text style={styles.gridVal}>{req.sample_count} Cores</Text>
                    </View>
                    <View style={styles.gridItem}>
                      <Text style={styles.gridLabel}>Assigned Lab</Text>
                      <Text style={styles.gridVal} numberOfLines={1}>{req.assigned_lab || 'Pending'}</Text>
                    </View>
                  </View>

                  {/* NPK & SOC Preview if Report Ready */}
                  {req.npk_results && (
                    <View style={styles.npkPreviewCard}>
                      <View style={styles.npkMetric}>
                        <Text style={styles.npkLabel}>Organic Carbon (SOC)</Text>
                        <Text style={styles.npkVal}>{req.npk_results.soc_percent}% (Healthy Sponge)</Text>
                      </View>
                      <View style={styles.npkMetric}>
                        <Text style={styles.npkLabel}>pH Balance</Text>
                        <Text style={styles.npkVal}>{req.npk_results.ph_value}</Text>
                      </View>
                    </View>
                  )}

                  <View style={styles.cardFooter}>
                    <Text style={styles.dateText}>Preferred Date: {req.preferred_date}</Text>
                    <Text style={styles.viewDetailsText}>View Health Card →</Text>
                  </View>
                </TouchableOpacity>
              );
            })
          )}
        </ScrollView>
      )}

      {/* ── TAB 2: DISTRICT ANALYTICS ── */}
      {activeTab === 'analytics' && analytics && (
        <ScrollView contentContainerStyle={{ paddingBottom: 120 }}>
          <View style={styles.analyticsCard}>
            <Text style={styles.analyticsTitle}>District Soil Health Index ({analytics.district})</Text>
            <Text style={styles.analyticsSub}>Aggregate NPK & Soil Organic Carbon (SOC) Benchmarks</Text>

            <View style={styles.metricsGrid}>
              <View style={styles.metricBox}>
                <Text style={styles.metricVal}>{analytics.average_soc_percent}%</Text>
                <Text style={styles.metricLabel}>Average SOC %</Text>
              </View>

              <View style={styles.metricBox}>
                <Text style={styles.metricVal}>{analytics.average_ph_level}</Text>
                <Text style={styles.metricLabel}>Average pH Level</Text>
              </View>

              <View style={styles.metricBox}>
                <Text style={styles.metricVal}>{analytics.total_samples_analyzed}</Text>
                <Text style={styles.metricLabel}>Samples Tested</Text>
              </View>

              <View style={styles.metricBox}>
                <Text style={styles.metricVal}>{analytics.health_card_coverage_percent}%</Text>
                <Text style={styles.metricLabel}>Health Card Coverage</Text>
              </View>
            </View>

            <View style={styles.recommendationBox}>
              <MaterialCommunityIcons name="lightbulb-outline" size={20} color="#B45309" />
              <Text style={styles.recommendationText}>{analytics.recommendation_summary}</Text>
            </View>
          </View>
        </ScrollView>
      )}

      {/* ── ORDER SOIL TEST MODAL ── */}
      <Modal animationType="slide" transparent visible={isOrderModalOpen} onRequestClose={() => setIsOrderModalOpen(false)}>
        <View style={styles.modalOverlay}>
          <ScrollView contentContainerStyle={styles.modalScroll}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Order Government Scheme Soil Test</Text>
              <TouchableOpacity onPress={() => setIsOrderModalOpen(false)}>
                <Ionicons name="close" size={24} color="#0F172A" />
              </TouchableOpacity>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Target Selection Category *</Text>
              <View style={{ flexDirection: 'row', gap: 6 }}>
                {[
                  { key: 'public_asset', label: 'Public Asset' },
                  { key: 'farmer', label: 'Farmer' },
                  { key: 'land_parcel', label: 'Land Parcel' },
                ].map((typeItem) => (
                  <TouchableOpacity
                    key={typeItem.key}
                    style={[styles.typeChip, orderForm.target_type === typeItem.key && styles.typeChipActive]}
                    onPress={() => setOrderForm({ ...orderForm, target_type: typeItem.key as any })}
                  >
                    <Text style={[styles.typeChipText, orderForm.target_type === typeItem.key && styles.typeChipTextActive]}>{typeItem.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Target Name *</Text>
              <TextInput
                style={styles.textInput}
                placeholder="e.g. Narmada Riverbank Green Belt or Ramkumar Sharma Plot"
                value={orderForm.target_name}
                onChangeText={(t) => setOrderForm({ ...orderForm, target_name: t })}
              />
            </View>

            <View style={styles.inputRow}>
              <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
                <Text style={styles.inputLabel}>Sample Count</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="10"
                  keyboardType="numeric"
                  value={orderForm.sample_count}
                  onChangeText={(t) => setOrderForm({ ...orderForm, sample_count: t })}
                />
              </View>
              <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
                <Text style={styles.inputLabel}>Preferred Date</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="2026-09-25"
                  value={orderForm.preferred_date}
                  onChangeText={(t) => setOrderForm({ ...orderForm, preferred_date: t })}
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Government Scheme / Program</Text>
              <TextInput
                style={styles.textInput}
                value={orderForm.scheme_program}
                onChangeText={(t) => setOrderForm({ ...orderForm, scheme_program: t })}
              />
            </View>

            <TouchableOpacity style={[styles.submitCTA, isSubmitting && { opacity: 0.6 }]} onPress={handleOrderSoilTest} disabled={isSubmitting}>
              {isSubmitting ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.submitCTAText}>Submit Order to KVK Central Lab</Text>}
            </TouchableOpacity>
          </ScrollView>
        </View>
      </Modal>

      {/* ── SOIL REPORT DETAILS MODAL ── */}
      {selectedRequest && (
        <Modal animationType="slide" transparent visible={!!selectedRequest} onRequestClose={() => setSelectedRequest(null)}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalCard}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Certified Soil Health Card</Text>
                <TouchableOpacity onPress={() => setSelectedRequest(null)}>
                  <Ionicons name="close" size={24} color="#0F172A" />
                </TouchableOpacity>
              </View>

              <ScrollView showsVerticalScrollIndicator={false}>
                <Text style={{ fontSize: 16, fontWeight: '800', color: '#0F172A' }}>{selectedRequest.target_name}</Text>
                <Text style={{ fontSize: 12, color: '#64748B', marginTop: 2 }}>Order ID: {selectedRequest.id} • Status: {selectedRequest.status}</Text>

                {selectedRequest.npk_results ? (
                  <View style={styles.certifiedCard}>
                    <Text style={styles.certifiedTitle}>NPK & Organic Carbon Spectrometry Analysis</Text>
                    <View style={styles.npkGrid}>
                      <View style={styles.npkBox}>
                        <Text style={styles.npkLabel}>Nitrogen (N)</Text>
                        <Text style={styles.npkValue}>{selectedRequest.npk_results.nitrogen_rating}</Text>
                      </View>

                      <View style={styles.npkBox}>
                        <Text style={styles.npkLabel}>Phosphorus (P)</Text>
                        <Text style={styles.npkValue}>{selectedRequest.npk_results.phosphorus_rating}</Text>
                      </View>

                      <View style={styles.npkBox}>
                        <Text style={styles.npkLabel}>Potassium (K)</Text>
                        <Text style={styles.npkValue}>{selectedRequest.npk_results.potassium_rating}</Text>
                      </View>

                      <View style={styles.npkBox}>
                        <Text style={styles.npkLabel}>SOC %</Text>
                        <Text style={styles.npkValue}>{selectedRequest.npk_results.soc_percent}%</Text>
                      </View>
                    </View>

                    <Text style={styles.recommendationTitle}>KVK Agronomist Recommendation:</Text>
                    <Text style={styles.recommendationTextModal}>{selectedRequest.npk_results.recommendations}</Text>
                  </View>
                ) : (
                  <View style={styles.pendingCard}>
                    <MaterialCommunityIcons name="clock-outline" size={32} color="#2563EB" />
                    <Text style={{ fontSize: 14, fontWeight: '800', color: '#0F172A', marginTop: 6 }}>Lab Processing Pending</Text>
                    <Text style={{ fontSize: 12, color: '#64748B', textAlign: 'center', marginTop: 4 }}>Field officer check-in and spectrometer chemical extraction in progress.</Text>
                  </View>
                )}
              </ScrollView>
            </View>
          </View>
        </Modal>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC', paddingHorizontal: 12, paddingTop: 12 },
  stateContainer: { padding: 32, alignItems: 'center', justifyContent: 'center', minHeight: 280 },
  stateTitle: { fontSize: 18, fontWeight: '800', color: '#0F172A', marginTop: 12 },
  stateSubtitle: { fontSize: 13, color: '#64748B', textAlign: 'center', marginTop: 6, lineHeight: 18 },
  loadingText: { fontSize: 14, fontWeight: '600', color: '#0F766E', marginTop: 12 },
  retryBtn: { marginTop: 16, backgroundColor: '#0F766E', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 12 },
  retryBtnText: { color: '#FFFFFF', fontWeight: '800', fontSize: 13 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  headerTitle: { fontSize: 16, fontWeight: '800', color: '#0F172A' },
  headerSub: { fontSize: 11, color: '#64748B' },
  orderBtnCTA: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#0F766E', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12, gap: 4 },
  orderBtnCTAText: { color: '#FFFFFF', fontWeight: '800', fontSize: 12 },
  tabContainer: { flexDirection: 'row', backgroundColor: '#E2E8F0', borderRadius: 12, padding: 4, marginBottom: 12 },
  tabBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 8, borderRadius: 10, gap: 4 },
  tabBtnActive: { backgroundColor: '#0F766E' },
  tabBtnText: { fontSize: 12, fontWeight: '700', color: '#64748B' },
  tabBtnTextActive: { color: '#FFFFFF' },
  bulkApproveBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#ECFDF5', borderWidth: 1, borderColor: '#A7F3D0', padding: 10, borderRadius: 12, marginBottom: 12 },
  bulkText: { fontSize: 12, fontWeight: '800', color: '#0F766E' },
  bulkCTA: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#0F766E', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, gap: 4 },
  bulkCTAText: { color: '#FFFFFF', fontSize: 11, fontWeight: '800' },
  emptyCard: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 32, alignItems: 'center', borderWidth: 1, borderColor: '#E2E8F0' },
  emptyTitle: { fontSize: 16, fontWeight: '800', color: '#0F172A', marginTop: 8 },
  emptySub: { fontSize: 12, color: '#64748B', textAlign: 'center', marginTop: 4, marginBottom: 16 },
  requestCard: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 14, marginBottom: 12, borderWidth: 1, borderColor: '#E2E8F0', ...SHADOWS.soft },
  requestCardSelected: { borderColor: '#0F766E', backgroundColor: '#F0FDF4' },
  cardHeader: { flexDirection: 'row', alignItems: 'center' },
  checkboxTouch: { padding: 4 },
  targetName: { fontSize: 14, fontWeight: '800', color: '#0F172A' },
  targetType: { fontSize: 11, color: '#64748B', marginTop: 2 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 10 },
  statusBadgeText: { fontSize: 11, fontWeight: '700' },
  detailsGrid: { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: '#F8FAFC', padding: 8, borderRadius: 10, marginVertical: 8 },
  gridItem: { flex: 1 },
  gridLabel: { fontSize: 10, color: '#94A3B8' },
  gridVal: { fontSize: 11, fontWeight: '700', color: '#0F172A', marginTop: 2 },
  npkPreviewCard: { backgroundColor: '#ECFDF5', padding: 8, borderRadius: 10, flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  npkMetric: { flex: 1 },
  npkLabel: { fontSize: 10, color: '#047857' },
  npkVal: { fontSize: 11, fontWeight: '800', color: '#065F46', marginTop: 2 },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 6, borderTopWidth: 1, borderTopColor: '#F1F5F9' },
  dateText: { fontSize: 10, color: '#64748B' },
  viewDetailsText: { fontSize: 11, fontWeight: '800', color: '#0F766E' },
  analyticsCard: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#E2E8F0', ...SHADOWS.soft },
  analyticsTitle: { fontSize: 16, fontWeight: '800', color: '#0F172A' },
  analyticsSub: { fontSize: 12, color: '#64748B', marginTop: 2 },
  metricsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginVertical: 14 },
  metricBox: { width: '47%', backgroundColor: '#F8FAFC', padding: 12, borderRadius: 12, borderWidth: 1, borderColor: '#E2E8F0', alignItems: 'center' },
  metricVal: { fontSize: 18, fontWeight: '800', color: '#0F766E' },
  metricLabel: { fontSize: 11, color: '#64748B', marginTop: 2 },
  recommendationBox: { flexDirection: 'row', backgroundColor: '#FFFBEB', padding: 12, borderRadius: 12, borderWidth: 1, borderColor: '#FCD34D', gap: 8, alignItems: 'flex-start' },
  recommendationText: { flex: 1, fontSize: 12, color: '#92400E', lineHeight: 16 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.65)', justifyContent: 'flex-end' },
  modalScroll: { backgroundColor: '#FFFFFF', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20 },
  modalCard: { backgroundColor: '#FFFFFF', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, maxHeight: '80%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  modalTitle: { fontSize: 16, fontWeight: '800', color: '#0F172A' },
  inputGroup: { marginBottom: 12 },
  inputRow: { flexDirection: 'row', marginBottom: 12 },
  inputLabel: { fontSize: 12, fontWeight: '700', color: '#334155', marginBottom: 4 },
  typeChip: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, backgroundColor: '#F1F5F9', borderWidth: 1, borderColor: '#E2E8F0' },
  typeChipActive: { backgroundColor: '#0F766E', borderColor: '#0F766E' },
  typeChipText: { fontSize: 11, fontWeight: '700', color: '#475569' },
  typeChipTextActive: { color: '#FFFFFF' },
  textInput: { backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#CBD5E1', borderRadius: 10, paddingHorizontal: 12, height: 44, fontSize: 13, color: '#0F172A' },
  submitCTA: { backgroundColor: '#0F766E', paddingVertical: 12, borderRadius: 12, alignItems: 'center', marginTop: 12, marginBottom: 24 },
  submitCTAText: { color: '#FFFFFF', fontWeight: '800', fontSize: 14 },
  certifiedCard: { backgroundColor: '#F0FDF4', padding: 14, borderRadius: 14, borderWidth: 1, borderColor: '#A7F3D0', marginTop: 12 },
  certifiedTitle: { fontSize: 13, fontWeight: '800', color: '#166534', marginBottom: 10 },
  npkGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 10 },
  npkBox: { width: '48%', backgroundColor: '#FFFFFF', padding: 8, borderRadius: 8, borderWidth: 1, borderColor: '#BBF7D0' },
  npkValue: { fontSize: 12, fontWeight: '800', color: '#065F46', marginTop: 2 },
  recommendationTitle: { fontSize: 11, fontWeight: '800', color: '#166534', marginTop: 4 },
  recommendationTextModal: { fontSize: 11, color: '#14532D', marginTop: 2 },
  pendingCard: { alignItems: 'center', justifyContent: 'center', padding: 24, backgroundColor: '#EFF6FF', borderRadius: 14, marginTop: 12 },
});

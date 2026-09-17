import React, { useState, useEffect, useMemo } from 'react';
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

export interface LandParcelItem {
  khasra: string;
  acres: number;
  trees_count: number;
  soil_status: string;
  crop_type: string;
}

export interface ProjectItem {
  id: string;
  name: string;
  status: string;
  role: string;
}

export interface SoilReportItem {
  id: string;
  date: string;
  lab: string;
  soc_percent: number;
  status: string;
}

export interface InsurancePolicyItem {
  id: string;
  sum_insured: string;
  trees_covered: number;
  status: string;
}

export interface TimelineItem {
  timestamp: string;
  action: string;
  notes?: string;
}

export interface JurisdictionFarmer {
  id: string;
  name: string;
  village_ward: string;
  district: string;
  state: string;
  contact_masked: string;
  aadhaar_masked: string;
  bank_masked: string;
  land_parcels_count: number;
  total_land_acres: number;
  project_status: string;
  assigned_project_name?: string;
  soil_testing_status: string;
  latest_soil_score?: string;
  tree_insurance_status: string;
  trees_insured_count: number;
  onboarding_status: string;
  joined_date: string;
  land_parcels?: LandParcelItem[];
  projects?: ProjectItem[];
  soil_reports?: SoilReportItem[];
  insurance_policies?: InsurancePolicyItem[];
  activity_timeline?: TimelineItem[];
}

export function GovtFarmerManagementView() {
  const isOnline = useConnectivityStore((state) => state.isOnline);

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [farmers, setFarmers] = useState<JurisdictionFarmer[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Selected Detail Modal
  const [selectedFarmer, setSelectedFarmer] = useState<JurisdictionFarmer | null>(null);
  const [isFilterModalOpen, setIsFilterModalOpen] = useState<boolean>(false);

  // Filter States
  const [filters, setFilters] = useState({
    village_ward: 'All',
    land_size: 'All', // 'All' | '<5' | '5-10' | '>10'
    project_status: 'All', // 'All' | 'Enrolled' | 'None'
    soil_status: 'All', // 'All' | 'Verified' | 'Needs Test'
    insurance_status: 'All', // 'All' | 'Active' | 'None'
    onboarding_status: 'All', // 'All' | 'Approved & Verified' | 'Pending KYC'
  });

  const fetchFarmers = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await api.get('/govt/farmers');
      if (response.data && response.data.success && Array.isArray(response.data.data)) {
        setFarmers(response.data.data);
      } else {
        throw new Error('Invalid farmers payload from server.');
      }
    } catch (err: any) {
      console.warn('[GovtFarmerManagementView] Fetch error:', err);
      setError(err?.message || 'Unable to load jurisdiction farmer records.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchFarmers();
  }, []);

  // Filter & Search computation
  const filteredFarmers = useMemo(() => {
    return farmers.filter((f) => {
      // Search
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        f.name.toLowerCase().includes(q) ||
        f.village_ward.toLowerCase().includes(q) ||
        f.id.toLowerCase().includes(q);

      if (!matchesSearch) return false;

      // Village Filter
      if (filters.village_ward !== 'All' && !f.village_ward.toLowerCase().includes(filters.village_ward.toLowerCase())) {
        return false;
      }

      // Land Size Filter
      if (filters.land_size !== 'All') {
        const acres = f.total_land_acres || 0;
        if (filters.land_size === '<5' && acres >= 5) return false;
        if (filters.land_size === '5-10' && (acres < 5 || acres > 10)) return false;
        if (filters.land_size === '>10' && acres <= 10) return false;
      }

      // Project Status Filter
      if (filters.project_status !== 'All') {
        if (filters.project_status === 'Enrolled' && f.project_status !== 'Enrolled') return false;
        if (filters.project_status === 'None' && f.project_status === 'Enrolled') return false;
      }

      // Soil Status Filter
      if (filters.soil_status !== 'All') {
        if (f.soil_testing_status.toLowerCase() !== filters.soil_status.toLowerCase()) return false;
      }

      // Insurance Status Filter
      if (filters.insurance_status !== 'All') {
        if (f.tree_insurance_status.toLowerCase() !== filters.insurance_status.toLowerCase()) return false;
      }

      // Onboarding Status Filter
      if (filters.onboarding_status !== 'All') {
        if (!f.onboarding_status.toLowerCase().includes(filters.onboarding_status.toLowerCase())) return false;
      }

      return true;
    });
  }, [farmers, searchQuery, filters]);

  const activeFilterCount = useMemo(() => {
    let cnt = 0;
    if (filters.village_ward !== 'All') cnt++;
    if (filters.land_size !== 'All') cnt++;
    if (filters.project_status !== 'All') cnt++;
    if (filters.soil_status !== 'All') cnt++;
    if (filters.insurance_status !== 'All') cnt++;
    if (filters.onboarding_status !== 'All') cnt++;
    return cnt;
  }, [filters]);

  const resetFilters = () => {
    setFilters({
      village_ward: 'All',
      land_size: 'All',
      project_status: 'All',
      soil_status: 'All',
      insurance_status: 'All',
      onboarding_status: 'All',
    });
  };

  if (!isOnline) {
    return (
      <View style={styles.stateContainer}>
        <MaterialCommunityIcons name="wifi-off" size={48} color="#EF4444" />
        <Text style={styles.stateTitle}>Offline Mode</Text>
        <Text style={styles.stateSubtitle}>Connect to network to fetch jurisdiction farmer directory and land titles.</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={fetchFarmers}>
          <Text style={styles.retryBtnText}>Retry Connection</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (isLoading) {
    return (
      <View style={styles.stateContainer}>
        <ActivityIndicator size="large" color="#0F766E" />
        <Text style={styles.loadingText}>Loading Jurisdiction Farmers Directory...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.stateContainer}>
        <MaterialCommunityIcons name="alert-circle-outline" size={48} color="#EF4444" />
        <Text style={styles.stateTitle}>Failed to Load Farmers</Text>
        <Text style={styles.stateSubtitle}>{error}</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={fetchFarmers}>
          <Text style={styles.retryBtnText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* ── 1. SEARCH & FILTER CONTROLS ── */}
      <View style={styles.controlsRow}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={18} color="#64748B" style={{ marginRight: 6 }} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search farmer name, village, or ID..."
            placeholderTextColor="#94A3B8"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {!!searchQuery && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={18} color="#94A3B8" />
            </TouchableOpacity>
          )}
        </View>

        <TouchableOpacity
          style={[styles.filterTriggerBtn, activeFilterCount > 0 && styles.filterTriggerActive]}
          onPress={() => setIsFilterModalOpen(true)}
        >
          <MaterialCommunityIcons
            name="tune-variant"
            size={20}
            color={activeFilterCount > 0 ? '#FFFFFF' : '#0F766E'}
          />
          {activeFilterCount > 0 && (
            <View style={styles.filterBadge}>
              <Text style={styles.filterBadgeText}>{activeFilterCount}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Active Filter Chips Bar */}
      {activeFilterCount > 0 && (
        <View style={styles.activeChipsRow}>
          <Text style={styles.activeChipsLabel}>Active Filters:</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6 }}>
            {filters.land_size !== 'All' && (
              <View style={styles.chipItem}>
                <Text style={styles.chipText}>Land: {filters.land_size}</Text>
              </View>
            )}
            {filters.project_status !== 'All' && (
              <View style={styles.chipItem}>
                <Text style={styles.chipText}>Project: {filters.project_status}</Text>
              </View>
            )}
            {filters.soil_status !== 'All' && (
              <View style={styles.chipItem}>
                <Text style={styles.chipText}>Soil: {filters.soil_status}</Text>
              </View>
            )}
            {filters.insurance_status !== 'All' && (
              <View style={styles.chipItem}>
                <Text style={styles.chipText}>Insurance: {filters.insurance_status}</Text>
              </View>
            )}
            <TouchableOpacity onPress={resetFilters}>
              <Text style={styles.clearAllText}>Clear All</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      )}

      {/* ── 2. FARMERS LIST ── */}
      {filteredFarmers.length === 0 ? (
        <View style={styles.emptyCard}>
          <MaterialCommunityIcons name="account-search-outline" size={48} color="#94A3B8" />
          <Text style={styles.emptyTitle}>No Farmers Found</Text>
          <Text style={styles.emptySub}>No jurisdiction farmers match the specified search or filter criteria.</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={resetFilters}>
            <Text style={styles.retryBtnText}>Reset All Filters</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={filteredFarmers}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingBottom: 120 }}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => {
            const isVerified = item.onboarding_status.includes('Approved');
            return (
              <TouchableOpacity
                style={styles.farmerCard}
                activeOpacity={0.88}
                onPress={() => setSelectedFarmer(item)}
              >
                <View style={styles.cardHeader}>
                  <View style={styles.avatarCircle}>
                    <Text style={styles.avatarText}>{item.name.charAt(0)}</Text>
                  </View>
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <Text style={styles.farmerName}>{item.name}</Text>
                      {isVerified && <MaterialCommunityIcons name="check-decagram" size={16} color="#059669" />}
                    </View>
                    <Text style={styles.farmerVillage}>
                      <MaterialCommunityIcons name="map-marker-outline" size={12} color="#64748B" /> {item.village_ward}, {item.district}
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.onboardingBadge,
                      { backgroundColor: isVerified ? '#DCFCE7' : '#FEF3C7' },
                    ]}
                  >
                    <Text
                      style={[
                        styles.onboardingBadgeText,
                        { color: isVerified ? '#166534' : '#B45309' },
                      ]}
                    >
                      {item.onboarding_status}
                    </Text>
                  </View>
                </View>

                {/* Sanitized PII Info Row */}
                <View style={styles.piiRow}>
                  <Text style={styles.piiText}>📱 {item.contact_masked}</Text>
                  <Text style={styles.piiText}>🆔 {item.aadhaar_masked}</Text>
                  <Text style={styles.piiText}>🏦 {item.bank_masked}</Text>
                </View>

                <View style={styles.cardGrid}>
                  <View style={styles.gridItem}>
                    <Text style={styles.gridLabel}>Land Count</Text>
                    <Text style={styles.gridVal}>{item.land_parcels_count} Parcels</Text>
                  </View>
                  <View style={styles.gridItem}>
                    <Text style={styles.gridLabel}>Total Area</Text>
                    <Text style={styles.gridVal}>{item.total_land_acres} Acres</Text>
                  </View>
                  <View style={styles.gridItem}>
                    <Text style={styles.gridLabel}>Soil Health</Text>
                    <Text style={styles.gridVal}>{item.soil_testing_status}</Text>
                  </View>
                </View>

                {/* Status Badges Footer */}
                <View style={styles.badgesFooter}>
                  <View style={styles.statusChip}>
                    <MaterialCommunityIcons name="sprout" size={12} color="#0F766E" />
                    <Text style={styles.statusChipText}>Project: {item.project_status}</Text>
                  </View>

                  <View style={styles.statusChip}>
                    <MaterialCommunityIcons name="shield-check" size={12} color="#059669" />
                    <Text style={styles.statusChipText}>Insurance: {item.tree_insurance_status}</Text>
                  </View>
                </View>
              </TouchableOpacity>
            );
          }}
        />
      )}

      {/* ── 3. FARMER DETAILS MODAL ── */}
      {selectedFarmer && (
        <Modal animationType="slide" transparent visible={!!selectedFarmer} onRequestClose={() => setSelectedFarmer(null)}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalCard}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Farmer Record & Profile Summary</Text>
                <TouchableOpacity onPress={() => setSelectedFarmer(null)}>
                  <Ionicons name="close" size={24} color="#0F172A" />
                </TouchableOpacity>
              </View>

              <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 24 }}>
                {/* Profile Header */}
                <View style={styles.profileHeaderBlock}>
                  <View style={styles.largeAvatar}>
                    <Text style={styles.largeAvatarText}>{selectedFarmer.name.charAt(0)}</Text>
                  </View>
                  <Text style={styles.modalFarmerName}>{selectedFarmer.name}</Text>
                  <Text style={styles.modalFarmerSub}>ID: {selectedFarmer.id} • Joined: {selectedFarmer.joined_date}</Text>
                  <Text style={styles.modalAddress}>{selectedFarmer.village_ward}, {selectedFarmer.district}, {selectedFarmer.state}</Text>
                </View>

                {/* Masked PII Box */}
                <View style={styles.maskedPiiBox}>
                  <Text style={styles.maskedPiiHeading}>🔒 Protected PII Information (Government Desk View)</Text>
                  <View style={styles.maskedPiiGrid}>
                    <View>
                      <Text style={styles.maskedLabel}>Contact Number</Text>
                      <Text style={styles.maskedVal}>{selectedFarmer.contact_masked}</Text>
                    </View>
                    <View>
                      <Text style={styles.maskedLabel}>Aadhaar Identity</Text>
                      <Text style={styles.maskedVal}>{selectedFarmer.aadhaar_masked}</Text>
                    </View>
                    <View style={{ width: '100%' }}>
                      <Text style={styles.maskedLabel}>Bank Account Settlement</Text>
                      <Text style={styles.maskedVal}>{selectedFarmer.bank_masked}</Text>
                    </View>
                  </View>
                </View>

                {/* Land Parcels Section */}
                <View style={styles.sectionCard}>
                  <Text style={styles.sectionTitle}>🌱 Registered Land Parcels ({selectedFarmer.land_parcels_count})</Text>
                  {selectedFarmer.land_parcels && selectedFarmer.land_parcels.length > 0 ? (
                    selectedFarmer.land_parcels.map((lp, idx) => (
                      <View key={idx} style={styles.parcelRow}>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.parcelKhasra}>Khasra No: {lp.khasra}</Text>
                          <Text style={styles.parcelCrop}>{lp.crop_type} • {lp.trees_count} Trees</Text>
                        </View>
                        <View style={{ alignItems: 'flex-end' }}>
                          <Text style={styles.parcelAcres}>{lp.acres} Acres</Text>
                          <Text style={styles.parcelSoil}>{lp.soil_status}</Text>
                        </View>
                      </View>
                    ))
                  ) : (
                    <Text style={styles.noDataText}>No land parcel details recorded.</Text>
                  )}
                </View>

                {/* Projects Managed */}
                <View style={styles.sectionCard}>
                  <Text style={styles.sectionTitle}>🌳 Enrolled Sustainability Projects</Text>
                  {selectedFarmer.projects && selectedFarmer.projects.length > 0 ? (
                    selectedFarmer.projects.map((proj, idx) => (
                      <View key={idx} style={styles.itemRow}>
                        <MaterialCommunityIcons name="sprout-outline" size={18} color="#0F766E" />
                        <View style={{ flex: 1, marginLeft: 8 }}>
                          <Text style={styles.itemTitle}>{proj.name}</Text>
                          <Text style={styles.itemSub}>Role: {proj.role} • Status: {proj.status}</Text>
                        </View>
                      </View>
                    ))
                  ) : (
                    <Text style={styles.noDataText}>No active sustainability projects enrolled.</Text>
                  )}
                </View>

                {/* Soil Reports */}
                <View style={styles.sectionCard}>
                  <Text style={styles.sectionTitle}>🧪 KVK Soil Testing Reports</Text>
                  {selectedFarmer.soil_reports && selectedFarmer.soil_reports.length > 0 ? (
                    selectedFarmer.soil_reports.map((rep, idx) => (
                      <View key={idx} style={styles.itemRow}>
                        <MaterialCommunityIcons name="flask-outline" size={18} color="#2563EB" />
                        <View style={{ flex: 1, marginLeft: 8 }}>
                          <Text style={styles.itemTitle}>SOC: {rep.soc_percent}% Organic Carbon</Text>
                          <Text style={styles.itemSub}>Lab: {rep.lab} ({rep.date})</Text>
                        </View>
                        <View style={styles.badgeSuccess}>
                          <Text style={styles.badgeSuccessText}>{rep.status}</Text>
                        </View>
                      </View>
                    ))
                  ) : (
                    <Text style={styles.noDataText}>No baseline soil test reports filed yet.</Text>
                  )}
                </View>

                {/* Tree Insurance */}
                <View style={styles.sectionCard}>
                  <Text style={styles.sectionTitle}>🛡️ Tree Insurance Policies</Text>
                  {selectedFarmer.insurance_policies && selectedFarmer.insurance_policies.length > 0 ? (
                    selectedFarmer.insurance_policies.map((ins, idx) => (
                      <View key={idx} style={styles.itemRow}>
                        <MaterialCommunityIcons name="shield-check-outline" size={18} color="#059669" />
                        <View style={{ flex: 1, marginLeft: 8 }}>
                          <Text style={styles.itemTitle}>Sum Insured: {ins.sum_insured}</Text>
                          <Text style={styles.itemSub}>Covered: {ins.trees_covered} Trees • Policy ID: {ins.id}</Text>
                        </View>
                        <View style={styles.badgeSuccess}>
                          <Text style={styles.badgeSuccessText}>{ins.status}</Text>
                        </View>
                      </View>
                    ))
                  ) : (
                    <Text style={styles.noDataText}>No tree insurance policy active.</Text>
                  )}
                </View>

                {/* Activity Audit Timeline */}
                <View style={styles.sectionCard}>
                  <Text style={styles.sectionTitle}>📜 Farmer Activity Audit Timeline</Text>
                  {selectedFarmer.activity_timeline && selectedFarmer.activity_timeline.length > 0 ? (
                    selectedFarmer.activity_timeline.map((ev, idx) => (
                      <View key={idx} style={styles.timelineRow}>
                        <View style={styles.timelineDot} />
                        <View style={{ flex: 1, marginLeft: 10 }}>
                          <Text style={styles.timelineAction}>{ev.action}</Text>
                          <Text style={styles.timelineTime}>{ev.timestamp}</Text>
                          {ev.notes ? <Text style={styles.timelineNotes}>{ev.notes}</Text> : null}
                        </View>
                      </View>
                    ))
                  ) : (
                    <Text style={styles.noDataText}>No activity audit trail available.</Text>
                  )}
                </View>
              </ScrollView>
            </View>
          </View>
        </Modal>
      )}

      {/* ── 4. MULTI-CRITERIA FILTERS MODAL ── */}
      <Modal animationType="slide" transparent visible={isFilterModalOpen} onRequestClose={() => setIsFilterModalOpen(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Filter Jurisdiction Farmers</Text>
              <TouchableOpacity onPress={() => setIsFilterModalOpen(false)}>
                <Ionicons name="close" size={24} color="#0F172A" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Land Size Filter */}
              <View style={styles.filterGroup}>
                <Text style={styles.filterLabel}>Land Size (Acres)</Text>
                <View style={styles.optionsRow}>
                  {['All', '<5', '5-10', '>10'].map((opt) => (
                    <TouchableOpacity
                      key={opt}
                      style={[styles.optChip, filters.land_size === opt && styles.optChipActive]}
                      onPress={() => setFilters({ ...filters, land_size: opt })}
                    >
                      <Text style={[styles.optChipText, filters.land_size === opt && styles.optChipTextActive]}>{opt}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Project Status Filter */}
              <View style={styles.filterGroup}>
                <Text style={styles.filterLabel}>Project Status</Text>
                <View style={styles.optionsRow}>
                  {['All', 'Enrolled', 'None'].map((opt) => (
                    <TouchableOpacity
                      key={opt}
                      style={[styles.optChip, filters.project_status === opt && styles.optChipActive]}
                      onPress={() => setFilters({ ...filters, project_status: opt })}
                    >
                      <Text style={[styles.optChipText, filters.project_status === opt && styles.optChipTextActive]}>{opt}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Soil Status Filter */}
              <View style={styles.filterGroup}>
                <Text style={styles.filterLabel}>Soil Testing Status</Text>
                <View style={styles.optionsRow}>
                  {['All', 'Verified', 'Needs Test'].map((opt) => (
                    <TouchableOpacity
                      key={opt}
                      style={[styles.optChip, filters.soil_status === opt && styles.optChipActive]}
                      onPress={() => setFilters({ ...filters, soil_status: opt })}
                    >
                      <Text style={[styles.optChipText, filters.soil_status === opt && styles.optChipTextActive]}>{opt}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Tree Insurance Filter */}
              <View style={styles.filterGroup}>
                <Text style={styles.filterLabel}>Tree Insurance Status</Text>
                <View style={styles.optionsRow}>
                  {['All', 'Active', 'None'].map((opt) => (
                    <TouchableOpacity
                      key={opt}
                      style={[styles.optChip, filters.insurance_status === opt && styles.optChipActive]}
                      onPress={() => setFilters({ ...filters, insurance_status: opt })}
                    >
                      <Text style={[styles.optChipText, filters.insurance_status === opt && styles.optChipTextActive]}>{opt}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Action CTAs */}
              <View style={styles.modalActionsRow}>
                <TouchableOpacity style={styles.resetBtn} onPress={resetFilters}>
                  <Text style={styles.resetBtnText}>Reset All</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.applyBtn} onPress={() => setIsFilterModalOpen(false)}>
                  <Text style={styles.applyBtnText}>Apply Filters</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
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
  controlsRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  searchBar: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 12, paddingHorizontal: 12, height: 44 },
  searchInput: { flex: 1, fontSize: 13, color: '#0F172A' },
  filterTriggerBtn: { width: 44, height: 44, borderRadius: 12, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#0F766E', alignItems: 'center', justifyContent: 'center' },
  filterTriggerActive: { backgroundColor: '#0F766E' },
  filterBadge: { position: 'absolute', top: 4, right: 4, backgroundColor: '#EF4444', borderRadius: 8, width: 16, height: 16, alignItems: 'center', justifyContent: 'center' },
  filterBadgeText: { color: '#FFFFFF', fontSize: 9, fontWeight: '800' },
  activeChipsRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12, gap: 6 },
  activeChipsLabel: { fontSize: 11, fontWeight: '700', color: '#64748B' },
  chipItem: { backgroundColor: '#CCFBF1', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, borderWidth: 1, borderColor: '#99F6E4' },
  chipText: { fontSize: 11, fontWeight: '700', color: '#0F766E' },
  clearAllText: { fontSize: 11, fontWeight: '800', color: '#EF4444', marginLeft: 6 },
  emptyCard: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 32, alignItems: 'center', borderWidth: 1, borderColor: '#E2E8F0' },
  emptyTitle: { fontSize: 16, fontWeight: '800', color: '#0F172A', marginTop: 8 },
  emptySub: { fontSize: 12, color: '#64748B', textAlign: 'center', marginTop: 4, marginBottom: 16 },
  farmerCard: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 14, marginBottom: 12, borderWidth: 1, borderColor: '#E2E8F0', ...SHADOWS.soft },
  cardHeader: { flexDirection: 'row', alignItems: 'center' },
  avatarCircle: { width: 42, height: 42, borderRadius: 21, backgroundColor: '#0F766E', justifyContent: 'center', alignItems: 'center' },
  avatarText: { fontSize: 18, fontWeight: '800', color: '#FFFFFF' },
  farmerName: { fontSize: 15, fontWeight: '800', color: '#0F172A' },
  farmerVillage: { fontSize: 12, color: '#64748B', marginTop: 2 },
  onboardingBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 },
  onboardingBadgeText: { fontSize: 10, fontWeight: '700' },
  piiRow: { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: '#F8FAFC', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10, marginVertical: 8 },
  piiText: { fontSize: 11, fontWeight: '600', color: '#475569' },
  cardGrid: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  gridItem: { flex: 1 },
  gridLabel: { fontSize: 10, color: '#94A3B8' },
  gridVal: { fontSize: 12, fontWeight: '800', color: '#0F172A', marginTop: 2 },
  badgesFooter: { flexDirection: 'row', gap: 6, paddingTop: 8, borderTopWidth: 1, borderTopColor: '#F1F5F9' },
  statusChip: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F1F5F9', paddingHorizontal: 6, paddingVertical: 3, borderRadius: 6, gap: 4 },
  statusChipText: { fontSize: 10, fontWeight: '700', color: '#334155' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.65)', justifyContent: 'flex-end' },
  modalCard: { backgroundColor: '#FFFFFF', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, maxHeight: '85%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  modalTitle: { fontSize: 16, fontWeight: '800', color: '#0F172A' },
  profileHeaderBlock: { alignItems: 'center', marginBottom: 16 },
  largeAvatar: { width: 56, height: 56, borderRadius: 28, backgroundColor: '#0F766E', justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
  largeAvatarText: { fontSize: 24, fontWeight: '800', color: '#FFFFFF' },
  modalFarmerName: { fontSize: 17, fontWeight: '800', color: '#0F172A' },
  modalFarmerSub: { fontSize: 12, color: '#64748B', marginTop: 2 },
  modalAddress: { fontSize: 12, color: '#0F766E', fontWeight: '700', marginTop: 2 },
  maskedPiiBox: { backgroundColor: '#FFFBEB', borderWidth: 1, borderColor: '#FCD34D', borderRadius: 12, padding: 12, marginBottom: 14 },
  maskedPiiHeading: { fontSize: 11, fontWeight: '800', color: '#B45309', marginBottom: 8 },
  maskedPiiGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  maskedLabel: { fontSize: 10, color: '#92400E' },
  maskedVal: { fontSize: 12, fontWeight: '800', color: '#78350F', marginTop: 2 },
  sectionCard: { backgroundColor: '#FAFCFF', borderRadius: 14, padding: 12, borderWidth: 1, borderColor: '#E2E8F0', marginBottom: 12 },
  sectionTitle: { fontSize: 13, fontWeight: '800', color: '#0F172A', marginBottom: 8 },
  parcelRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  parcelKhasra: { fontSize: 12, fontWeight: '800', color: '#0F172A' },
  parcelCrop: { fontSize: 11, color: '#64748B', marginTop: 2 },
  parcelAcres: { fontSize: 12, fontWeight: '800', color: '#0F766E' },
  parcelSoil: { fontSize: 10, color: '#059669', fontWeight: '700', marginTop: 2 },
  itemRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 6 },
  itemTitle: { fontSize: 12, fontWeight: '800', color: '#0F172A' },
  itemSub: { fontSize: 11, color: '#64748B', marginTop: 2 },
  badgeSuccess: { backgroundColor: '#DCFCE7', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  badgeSuccessText: { fontSize: 10, fontWeight: '700', color: '#166534' },
  timelineRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 8 },
  timelineDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#0F766E', marginTop: 4 },
  timelineAction: { fontSize: 12, fontWeight: '800', color: '#0F172A' },
  timelineTime: { fontSize: 10, color: '#94A3B8' },
  timelineNotes: { fontSize: 11, color: '#475569', marginTop: 2 },
  noDataText: { fontSize: 11, color: '#94A3B8', fontStyle: 'italic' },
  filterGroup: { marginBottom: 16 },
  filterLabel: { fontSize: 13, fontWeight: '800', color: '#0F172A', marginBottom: 8 },
  optionsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  optChip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10, backgroundColor: '#F1F5F9', borderWidth: 1, borderColor: '#E2E8F0' },
  optChipActive: { backgroundColor: '#0F766E', borderColor: '#0F766E' },
  optChipText: { fontSize: 12, fontWeight: '700', color: '#475569' },
  optChipTextActive: { color: '#FFFFFF' },
  modalActionsRow: { flexDirection: 'row', gap: 10, marginTop: 12 },
  resetBtn: { flex: 1, paddingVertical: 12, borderRadius: 12, borderWidth: 1, borderColor: '#CBD5E1', alignItems: 'center' },
  resetBtnText: { color: '#475569', fontWeight: '800', fontSize: 13 },
  applyBtn: { flex: 1, paddingVertical: 12, borderRadius: 12, backgroundColor: '#0F766E', alignItems: 'center' },
  applyBtnText: { color: '#FFFFFF', fontWeight: '800', fontSize: 13 },
});

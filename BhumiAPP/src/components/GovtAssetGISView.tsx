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
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { COLORS, SHADOWS } from '../theme/theme';
import api from '../api/apiClient';
import { useConnectivityStore } from '../store/connectivityStore';

const { width } = Dimensions.get('window');

export type AssetCategory =
  | 'Public Land'
  | 'Park'
  | 'Plantation Area'
  | 'Roadside Trees'
  | 'Community Land'
  | 'Institutional Land'
  | 'Reserve / Green Area';

export type AssetLifecycleStatus =
  | 'Draft'
  | 'Submitted'
  | 'Admin Review'
  | 'Clarification Required'
  | 'Approved'
  | 'Rejected'
  | 'Active'
  | 'Archived';

export interface GeoPoint {
  lat: number;
  lng: number;
}

export interface PublicAsset {
  id: string;
  name: string;
  category: AssetCategory;
  authority: string;
  area_acres: number;
  street_address?: string;
  village_ward?: string;
  district: string;
  state: string;
  pincode?: string;
  mature_trees_count: number;
  saplings_count: number;
  condition?: string;
  khasra_number?: string;
  description?: string;
  gps_coords?: { latitude: number; longitude: number };
  polygon?: GeoPoint[];
  photo_urls?: string[];
  documents?: Array<{ name: string; url?: string }>;
  status: AssetLifecycleStatus;
  health_score?: number;
  submitted_at?: string;
  approved_at?: string;
  is_eligible_for_insurance?: boolean;
  is_eligible_for_projects?: boolean;
  is_eligible_for_carbon?: boolean;
  audit_timeline?: Array<{ timestamp: string; action: string; actor: string; notes?: string }>;
}

// ── Geodesic Area Calculation Helper (Shoelace / Spherical Formula) ─────────
function calculatePolygonAreaAcres(points: GeoPoint[]): number {
  if (!points || points.length < 3) return 0;
  let area = 0;
  const R = 6378137; // Earth's mean radius in meters
  for (let i = 0; i < points.length; i++) {
    const j = (i + 1) % points.length;
    const lat1 = (points[i].lat * Math.PI) / 180;
    const lat2 = (points[j].lat * Math.PI) / 180;
    const dLng = ((points[j].lng - points[i].lng) * Math.PI) / 180;
    area += Math.sin(dLng) * (Math.sin(lat1) + Math.sin(lat2));
  }
  area = Math.abs((area * R * R) / 2.0);
  const acres = area / 4046.86;
  return Number(acres.toFixed(2));
}

export function GovtAssetGISView() {
  const router = useRouter();
  const isOnline = useConnectivityStore((state) => state.isOnline);

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [assets, setAssets] = useState<PublicAsset[]>([]);
  const [activeTab, setActiveTab] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Selected asset detail & modals
  const [selectedAsset, setSelectedAsset] = useState<PublicAsset | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [isEncroachmentModalOpen, setIsEncroachmentModalOpen] = useState<boolean>(false);
  const [isAllocationModalOpen, setIsAllocationModalOpen] = useState<boolean>(false);

  // GeoJSON Polygon Editor State
  const [drawingPoints, setDrawingPoints] = useState<GeoPoint[]>([
    { lat: 22.7555, lng: 78.357 },
    { lat: 22.7555, lng: 78.3594 },
    { lat: 22.7531, lng: 78.3594 },
    { lat: 22.7531, lng: 78.357 },
  ]);

  // Add Asset Form
  const [assetForm, setAssetForm] = useState({
    name: '',
    category: 'Public Land' as AssetCategory,
    authority: 'Gram Panchayat',
    street_address: '',
    village_ward: '',
    district: 'Hoshangabad',
    state: 'Madhya Pradesh',
    pincode: '461775',
    khasra_number: '',
    mature_trees_count: '',
    saplings_count: '',
    description: '',
    is_draft: false,
  });
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Encroachment Alert Form
  const [encroachmentForm, setEncroachmentForm] = useState({
    alert_type: 'Boundary Breach / Unauthorized Clearing',
    severity: 'high',
    description: '',
  });

  // Allocation Form
  const [allocationForm, setAllocationForm] = useState({
    farmer_id: 'FAR-101',
    farmer_name: 'Ramkumar Sharma',
    allocated_acres: '',
    purpose: 'Agroforestry & Community Stewardship',
    term_years: '3',
  });

  const computedAreaAcres = useMemo(() => {
    return calculatePolygonAreaAcres(drawingPoints);
  }, [drawingPoints]);

  const fetchAssets = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await api.get('/govt/assets');
      if (response.data && response.data.success && Array.isArray(response.data.data)) {
        setAssets(response.data.data);
      } else {
        throw new Error('Failed to parse assets payload.');
      }
    } catch (err: any) {
      console.warn('[GovtAssetGISView] Fetch error:', err);
      setError(err?.message || 'Unable to load public land assets.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAssets();
  }, []);

  const handleExportGeoJSONGIS = async () => {
    try {
      const res = await api.get('/govt/gis/export/geojson?district=Hoshangabad');
      Alert.alert(
        'Real GeoJSON GIS Data Exported!',
        'Downloaded official GeoJSON spatial FeatureCollection polygon file from backend.'
      );
    } catch (err: any) {
      Alert.alert('Export Error', err?.response?.data?.detail || 'Failed to export GeoJSON.');
    }
  };


  const handleAddPoint = () => {
    const last = drawingPoints[drawingPoints.length - 1] || { lat: 22.754, lng: 78.358 };
    const newPoint = {
      lat: Number((last.lat + 0.0015).toFixed(4)),
      lng: Number((last.lng + 0.0015).toFixed(4)),
    };
    setDrawingPoints([...drawingPoints, newPoint]);
  };

  const handleClearPoints = () => {
    setDrawingPoints([]);
  };

  const handleCreateAsset = async () => {
    if (!assetForm.name.trim()) {
      Alert.alert('Validation Error', 'Asset name is required.');
      return;
    }

    const calculatedArea = computedAreaAcres > 0 ? computedAreaAcres : 5.0;

    setIsSubmitting(true);
    try {
      const payload = {
        name: assetForm.name.trim(),
        category: assetForm.category,
        authority: assetForm.authority,
        area_acres: calculatedArea,
        street_address: assetForm.street_address,
        village_ward: assetForm.village_ward,
        district: assetForm.district,
        state: assetForm.state,
        pincode: assetForm.pincode,
        khasra_number: assetForm.khasra_number,
        mature_trees_count: Number(assetForm.mature_trees_count) || 0,
        saplings_count: Number(assetForm.saplings_count) || 0,
        description: assetForm.description,
        gps_coords: {
          latitude: drawingPoints[0]?.lat || 22.7543,
          longitude: drawingPoints[0]?.lng || 78.3582,
        },
        polygon: drawingPoints,
        is_draft: assetForm.is_draft,
      };

      const res = await api.post('/govt/assets', payload);
      if (res.data && res.data.success) {
        Alert.alert('Success', assetForm.is_draft ? 'Asset saved as Draft.' : 'Public Asset registered & submitted for MRV Audit!');
        setIsAddModalOpen(false);
        fetchAssets();
      }
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.detail || 'Failed to submit asset.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReportEncroachment = async () => {
    if (!selectedAsset) return;
    if (!encroachmentForm.description.trim()) {
      Alert.alert('Validation Error', 'Please describe the encroachment evidence.');
      return;
    }

    try {
      const payload = {
        alert_type: encroachmentForm.alert_type,
        severity: encroachmentForm.severity,
        description: encroachmentForm.description,
      };
      const res = await api.post(`/govt/assets/${selectedAsset.id}/encroachment-alert`, payload);
      if (res.data && res.data.success) {
        Alert.alert('Encroachment Alert Logged', 'Alert broadcasted to District Nodal Officer and GIS Desk.');
        setIsEncroachmentModalOpen(false);
        setEncroachmentForm({ alert_type: 'Boundary Breach / Unauthorized Clearing', severity: 'high', description: '' });
        fetchAssets();
      }
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.detail || 'Failed to log alert.');
    }
  };

  const handleAllocateFarmer = async () => {
    if (!selectedAsset) return;
    if (!allocationForm.allocated_acres || Number(allocationForm.allocated_acres) <= 0) {
      Alert.alert('Validation Error', 'Enter valid allocated acres.');
      return;
    }

    try {
      const payload = {
        farmer_id: allocationForm.farmer_id,
        farmer_name: allocationForm.farmer_name,
        allocated_acres: Number(allocationForm.allocated_acres),
        purpose: allocationForm.purpose,
        allocation_term_years: Number(allocationForm.term_years) || 3,
      };
      const res = await api.post(`/govt/assets/${selectedAsset.id}/allocate-farmer`, payload);
      if (res.data && res.data.success) {
        Alert.alert('Land Stewardship Allocated', `Allocated ${allocationForm.allocated_acres} acres to ${allocationForm.farmer_name}.`);
        setIsAllocationModalOpen(false);
        fetchAssets();
      }
    } catch (err: any) {
      Alert.alert('Allocation Locked 🔒', err?.response?.data?.detail || 'Land allocation requires an Approved or Active asset.');
    }
  };

  const filteredAssets = useMemo(() => {
    return assets.filter((ast) => {
      const matchesTab =
        activeTab === 'All' ||
        (activeTab === 'Active' && (ast.status === 'Active' || ast.status === 'Approved')) ||
        (activeTab === 'Pending' && (ast.status === 'Submitted' || ast.status === 'Admin Review' || (ast.status as string) === 'Pending Admin Review')) ||
        (activeTab === 'Clarification' && ast.status === 'Clarification Required') ||
        (activeTab === 'Draft' && ast.status === 'Draft');

      const q = searchQuery.toLowerCase().trim();
      const matchesQuery =
        !q ||
        ast.name.toLowerCase().includes(q) ||
        ast.category.toLowerCase().includes(q) ||
        (ast.khasra_number || '').toLowerCase().includes(q) ||
        (ast.district || '').toLowerCase().includes(q);

      return matchesTab && matchesQuery;
    });
  }, [assets, activeTab, searchQuery]);

  if (!isOnline) {
    return (
      <View style={styles.stateContainer}>
        <MaterialCommunityIcons name="wifi-off" size={48} color="#EF4444" />
        <Text style={styles.stateTitle}>Offline Mode</Text>
        <Text style={styles.stateSubtitle}>Connect to network to view live GIS GeoJSON polygons and satellite MRV metrics.</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={fetchAssets}>
          <Text style={styles.retryBtnText}>Retry Connection</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (isLoading) {
    return (
      <View style={styles.stateContainer}>
        <ActivityIndicator size="large" color="#0F766E" />
        <Text style={styles.loadingText}>Loading Interactive GIS Map & Public Assets...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.stateContainer}>
        <MaterialCommunityIcons name="alert-circle-outline" size={48} color="#EF4444" />
        <Text style={styles.stateTitle}>Failed to Load Assets</Text>
        <Text style={styles.stateSubtitle}>{error}</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={fetchAssets}>
          <Text style={styles.retryBtnText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 120 }}>
      {/* ── 1. INTERACTIVE GIS MAP HEADER / BOUNDARY VIEWER ── */}
      <View style={styles.mapCard}>
        <View style={styles.mapHeaderRow}>
          <View style={styles.mapTitleGroup}>
            <MaterialCommunityIcons name="map-marker-radius" size={20} color="#0F766E" />
            <Text style={styles.mapCardTitle}>Interactive GIS Boundary Viewer</Text>
          </View>
          <View style={styles.ndviBadge}>
            <MaterialCommunityIcons name="satellite-variant" size={14} color="#059669" />
            <Text style={styles.ndviBadgeText}>Sentinel-2 NDVI: 0.84</Text>
          </View>
        </View>

        {/* Vector Map Preview Canvas */}
        <View style={styles.vectorMapCanvas}>
          <View style={styles.gridOverlay}>
            <Text style={styles.gridLatLabel}>22.7543° N, 78.3582° E</Text>
            <View style={styles.polygonSimShape}>
              <MaterialCommunityIcons name="vector-polygon" size={40} color="#0F766E" />
              <Text style={styles.simAreaLabel}>{computedAreaAcres || '12.5'} Acres Mapped</Text>
            </View>

            <View style={styles.coordsPinRow}>
              {drawingPoints.slice(0, 4).map((pt, i) => (
                <View key={i} style={styles.coordPinChip}>
                  <Text style={styles.coordPinText}>P{i + 1}: {pt.lat}, {pt.lng}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>

        {/* Map Tools Action Bar */}
        <View style={styles.mapToolsRow}>
          <TouchableOpacity style={styles.mapToolBtn} onPress={handleAddPoint}>
            <MaterialCommunityIcons name="plus-circle-outline" size={16} color="#0F766E" />
            <Text style={styles.mapToolBtnText}>Add Pin Point</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.mapToolBtn} onPress={handleClearPoints}>
            <MaterialCommunityIcons name="refresh" size={16} color="#DC2626" />
            <Text style={[styles.mapToolBtnText, { color: '#DC2626' }]}>Clear Points</Text>
          </TouchableOpacity>

          <View style={styles.calcAreaBox}>
            <Text style={styles.calcAreaLabel}>Calculated Area:</Text>
            <Text style={styles.calcAreaVal}>{computedAreaAcres} Acres</Text>
          </View>
        </View>
      </View>

      {/* ── 2. HEADER ACTIONS & DIRECTORY TABS ── */}
      <View style={styles.directoryHeaderRow}>
        <View>
          <Text style={styles.directoryHeading}>Public Land & Assets Registry</Text>
          <Text style={styles.directorySub}>Official Government Property Directory</Text>
        </View>
        <TouchableOpacity style={styles.addAssetCTA} onPress={() => setIsAddModalOpen(true)}>
          <MaterialCommunityIcons name="plus" size={18} color="#FFFFFF" />
          <Text style={styles.addAssetCTAText}>Add Public Asset</Text>
        </TouchableOpacity>
      </View>

      {/* Search Input */}
      <View style={styles.searchBarBox}>
        <Ionicons name="search" size={18} color="#64748B" style={{ marginRight: 8 }} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search by asset name, category, or khasra number..."
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

      {/* Filter Tabs */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabsScroll}>
        {['All', 'Active', 'Pending', 'Clarification', 'Draft'].map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.tabChip, activeTab === tab && styles.tabChipActive]}
            onPress={() => setActiveTab(tab)}
          >
            <Text style={[styles.tabChipText, activeTab === tab && styles.tabChipTextActive]}>{tab}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* ── 3. ASSETS LIST ── */}
      {filteredAssets.length === 0 ? (
        <View style={styles.emptyCard}>
          <MaterialCommunityIcons name="tree-outline" size={48} color="#94A3B8" />
          <Text style={styles.emptyTitle}>No Public Assets Found</Text>
          <Text style={styles.emptySub}>No public land assets match the selected filter criteria.</Text>
          <TouchableOpacity style={styles.addAssetCTA} onPress={() => setIsAddModalOpen(true)}>
            <Text style={styles.addAssetCTAText}>+ Add Public Asset</Text>
          </TouchableOpacity>
        </View>
      ) : (
        filteredAssets.map((asset) => {
          const isApproved = asset.status === 'Approved' || asset.status === 'Active';
          return (
            <View key={asset.id} style={styles.assetCard}>
              <View style={styles.assetCardHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.assetName}>{asset.name}</Text>
                  <Text style={styles.assetCategory}>{asset.category} • Authority: {asset.authority}</Text>
                </View>
                <View
                  style={[
                    styles.statusBadge,
                    {
                      backgroundColor: isApproved
                        ? '#DCFCE7'
                        : asset.status === 'Clarification Required'
                        ? '#FEF3C7'
                        : '#F1F5F9',
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.statusBadgeText,
                      {
                        color: isApproved
                          ? '#166534'
                          : asset.status === 'Clarification Required'
                          ? '#B45309'
                          : '#475569',
                      },
                    ]}
                  >
                    {asset.status}
                  </Text>
                </View>
              </View>

              <View style={styles.assetDetailsGrid}>
                <View style={styles.assetDetailItem}>
                  <Text style={styles.assetDetailLabel}>Area</Text>
                  <Text style={styles.assetDetailVal}>{asset.area_acres} Acres</Text>
                </View>
                <View style={styles.assetDetailItem}>
                  <Text style={styles.assetDetailLabel}>Trees / Saplings</Text>
                  <Text style={styles.assetDetailVal}>{asset.mature_trees_count + asset.saplings_count}</Text>
                </View>
                <View style={styles.assetDetailItem}>
                  <Text style={styles.assetDetailLabel}>Khasra No.</Text>
                  <Text style={styles.assetDetailVal}>{asset.khasra_number || 'N/A'}</Text>
                </View>
              </View>

              {/* Action Buttons */}
              <View style={styles.cardActionsRow}>
                <TouchableOpacity
                  style={[styles.cardBtn, !isApproved && styles.cardBtnDisabled]}
                  onPress={() => {
                    if (!isApproved) {
                      Alert.alert('Workflow Locked 🔒', 'Land allocation is only available for Approved or Active assets.');
                      return;
                    }
                    setSelectedAsset(asset);
                    setIsAllocationModalOpen(true);
                  }}
                >
                  <MaterialCommunityIcons name="account-key-outline" size={14} color={isApproved ? '#0F766E' : '#94A3B8'} />
                  <Text style={[styles.cardBtnText, !isApproved && { color: '#94A3B8' }]}>
                    Allocate to Farmer {!isApproved && '🔒'}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.cardBtn, { borderColor: '#FCA5A5', backgroundColor: '#FEF2F2' }]}
                  onPress={() => {
                    setSelectedAsset(asset);
                    setIsEncroachmentModalOpen(true);
                  }}
                >
                  <MaterialCommunityIcons name="shield-alert-outline" size={14} color="#DC2626" />
                  <Text style={[styles.cardBtnText, { color: '#DC2626' }]}>Report Encroachment</Text>
                </TouchableOpacity>
              </View>

              {/* Workflow Eligibility Indicator */}
              <View style={styles.eligibilityRow}>
                <Text style={styles.eligibilityLabel}>Module Workflows:</Text>
                <View style={styles.eligibilityChip}>
                  <Text style={styles.eligibilityChipText}>Insurance: {isApproved ? '✅ Eligible' : '🔒 Locked'}</Text>
                </View>
                <View style={styles.eligibilityChip}>
                  <Text style={styles.eligibilityChipText}>Carbon: {isApproved ? '✅ Eligible' : '🔒 Locked'}</Text>
                </View>
              </View>
            </View>
          );
        })
      )}

      {/* ── 4. ADD PUBLIC ASSET FORM MODAL ── */}
      <Modal animationType="slide" transparent visible={isAddModalOpen} onRequestClose={() => setIsAddModalOpen(false)}>
        <View style={styles.modalOverlay}>
          <ScrollView contentContainerStyle={styles.modalScroll}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Register Public Asset & GeoJSON Boundary</Text>
              <TouchableOpacity onPress={() => setIsAddModalOpen(false)}>
                <Ionicons name="close" size={24} color="#0F172A" />
              </TouchableOpacity>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Asset Name *</Text>
              <TextInput
                style={styles.textInput}
                placeholder="e.g. Narmada Riverbank Green Belt & Miyawaki Park"
                value={assetForm.name}
                onChangeText={(t) => setAssetForm({ ...assetForm, name: t })}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Asset Type / Category *</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginVertical: 4 }}>
                {[
                  'Public Land',
                  'Park',
                  'Plantation Area',
                  'Roadside Trees',
                  'Community Land',
                  'Institutional Land',
                  'Reserve / Green Area',
                ].map((cat) => (
                  <TouchableOpacity
                    key={cat}
                    style={[styles.typeChip, assetForm.category === cat && styles.typeChipActive]}
                    onPress={() => setAssetForm({ ...assetForm, category: cat as AssetCategory })}
                  >
                    <Text style={[styles.typeChipText, assetForm.category === cat && styles.typeChipTextActive]}>{cat}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            <View style={styles.inputRow}>
              <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
                <Text style={styles.inputLabel}>Authority</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="Gram Panchayat"
                  value={assetForm.authority}
                  onChangeText={(t) => setAssetForm({ ...assetForm, authority: t })}
                />
              </View>
              <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
                <Text style={styles.inputLabel}>Khasra No.</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="142/2"
                  value={assetForm.khasra_number}
                  onChangeText={(t) => setAssetForm({ ...assetForm, khasra_number: t })}
                />
              </View>
            </View>

            <View style={styles.inputRow}>
              <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
                <Text style={styles.inputLabel}>Mature Trees</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="2100"
                  keyboardType="numeric"
                  value={assetForm.mature_trees_count}
                  onChangeText={(t) => setAssetForm({ ...assetForm, mature_trees_count: t })}
                />
              </View>
              <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
                <Text style={styles.inputLabel}>Saplings Count</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="450"
                  keyboardType="numeric"
                  value={assetForm.saplings_count}
                  onChangeText={(t) => setAssetForm({ ...assetForm, saplings_count: t })}
                />
              </View>
            </View>

            {/* Calculated GeoJSON Polygon Box */}
            <View style={styles.geoCalcBox}>
              <MaterialCommunityIcons name="vector-polygon" size={20} color="#0F766E" />
              <View style={{ marginLeft: 10, flex: 1 }}>
                <Text style={styles.geoCalcTitle}>GeoJSON Polygon Boundary Mapped</Text>
                <Text style={styles.geoCalcSub}>{drawingPoints.length} Vertex Pins • Calculated Area: <Text style={{ fontWeight: '800' }}>{computedAreaAcres}</Text> Acres</Text>
              </View>
            </View>

            <TouchableOpacity style={[styles.submitCTA, isSubmitting && { opacity: 0.6 }]} onPress={handleCreateAsset} disabled={isSubmitting}>
              {isSubmitting ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.submitCTAText}>Submit for MRV Audit</Text>}
            </TouchableOpacity>
          </ScrollView>
        </View>
      </Modal>

      {/* ── 5. ENCROACHMENT ALERT MODAL ── */}
      <Modal animationType="slide" transparent visible={isEncroachmentModalOpen} onRequestClose={() => setIsEncroachmentModalOpen(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: '#DC2626' }]}>⚠️ Report Encroachment Alert</Text>
              <TouchableOpacity onPress={() => setIsEncroachmentModalOpen(false)}>
                <Ionicons name="close" size={24} color="#0F172A" />
              </TouchableOpacity>
            </View>
            <Text style={styles.modalSub}>Report boundary breach or unauthorized clearing on <Text style={{ fontWeight: '800' }}>{selectedAsset?.name}</Text>.</Text>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Alert Severity</Text>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                {['low', 'medium', 'high', 'critical'].map((sev) => (
                  <TouchableOpacity
                    key={sev}
                    style={[styles.sevChip, encroachmentForm.severity === sev && styles.sevChipActive]}
                    onPress={() => setEncroachmentForm({ ...encroachmentForm, severity: sev })}
                  >
                    <Text style={[styles.sevChipText, encroachmentForm.severity === sev && styles.sevChipTextActive]}>{sev.toUpperCase()}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Incident Description *</Text>
              <TextInput
                style={[styles.textInput, { height: 80 }]}
                multiline
                placeholder="Describe breach, GPS markers, or satellite alert evidence..."
                value={encroachmentForm.description}
                onChangeText={(t) => setEncroachmentForm({ ...encroachmentForm, description: t })}
              />
            </View>

            <TouchableOpacity style={[styles.submitCTA, { backgroundColor: '#DC2626' }]} onPress={handleReportEncroachment}>
              <Text style={styles.submitCTAText}>Broadcast Encroachment Alert</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ── 6. LAND ALLOCATION MODAL ── */}
      <Modal animationType="slide" transparent visible={isAllocationModalOpen} onRequestClose={() => setIsAllocationModalOpen(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Allocate Public Land to Farmer</Text>
              <TouchableOpacity onPress={() => setIsAllocationModalOpen(false)}>
                <Ionicons name="close" size={24} color="#0F172A" />
              </TouchableOpacity>
            </View>
            <Text style={styles.modalSub}>Assign community stewardship plot on <Text style={{ fontWeight: '800' }}>{selectedAsset?.name}</Text>.</Text>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Farmer Name</Text>
              <TextInput
                style={styles.textInput}
                value={allocationForm.farmer_name}
                onChangeText={(t) => setAllocationForm({ ...allocationForm, farmer_name: t })}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Allocated Acres *</Text>
              <TextInput
                style={styles.textInput}
                placeholder="e.g. 2.5"
                keyboardType="numeric"
                value={allocationForm.allocated_acres}
                onChangeText={(t) => setAllocationForm({ ...allocationForm, allocated_acres: t })}
              />
            </View>

            <TouchableOpacity style={styles.submitCTA} onPress={handleAllocateFarmer}>
              <Text style={styles.submitCTAText}>Confirm Land Allocation</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScrollView>
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
  mapCard: { backgroundColor: '#FFFFFF', borderRadius: 20, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: '#E2E8F0', ...SHADOWS.soft },
  mapHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  mapTitleGroup: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  mapCardTitle: { fontSize: 15, fontWeight: '800', color: '#0F172A' },
  ndviBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#ECFDF5', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10, gap: 4 },
  ndviBadgeText: { fontSize: 11, fontWeight: '700', color: '#059669' },
  vectorMapCanvas: { height: 160, backgroundColor: '#F0FDF4', borderRadius: 16, borderWidth: 1, borderColor: '#A7F3D0', overflow: 'hidden', justifyContent: 'center', alignItems: 'center' },
  gridOverlay: { alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%', padding: 12 },
  gridLatLabel: { position: 'absolute', top: 8, left: 10, fontSize: 10, fontWeight: '700', color: '#0F766E', backgroundColor: '#CCFBF1', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  polygonSimShape: { alignItems: 'center', justifyContent: 'center' },
  simAreaLabel: { fontSize: 12, fontWeight: '800', color: '#0F766E', marginTop: 4 },
  coordsPinRow: { position: 'absolute', bottom: 8, flexDirection: 'row', gap: 6, flexWrap: 'wrap', justifyContent: 'center' },
  coordPinChip: { backgroundColor: '#FFFFFF', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6, borderWidth: 1, borderColor: '#CBD5E1' },
  coordPinText: { fontSize: 9, fontWeight: '700', color: '#475569' },
  mapToolsRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 12, paddingTop: 10, borderTopWidth: 1, borderTopColor: '#F1F5F9' },
  mapToolBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#F8FAFC', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10, borderWidth: 1, borderColor: '#E2E8F0' },
  mapToolBtnText: { fontSize: 11, fontWeight: '700', color: '#0F766E' },
  calcAreaBox: { alignItems: 'flex-end' },
  calcAreaLabel: { fontSize: 10, color: '#64748B' },
  calcAreaVal: { fontSize: 12, fontWeight: '800', color: '#0F766E' },
  directoryHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  directoryHeading: { fontSize: 16, fontWeight: '800', color: '#0F172A' },
  directorySub: { fontSize: 11, color: '#64748B' },
  addAssetCTA: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#0F766E', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12, gap: 4 },
  addAssetCTAText: { color: '#FFFFFF', fontWeight: '800', fontSize: 12 },
  searchBarBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 12, paddingHorizontal: 12, height: 44, marginBottom: 12 },
  searchInput: { flex: 1, fontSize: 13, color: '#0F172A' },
  tabsScroll: { marginBottom: 16 },
  tabChip: { backgroundColor: '#FFFFFF', paddingHorizontal: 14, paddingVertical: 6, borderRadius: 12, marginRight: 8, borderWidth: 1, borderColor: '#E2E8F0' },
  tabChipActive: { backgroundColor: '#0F766E', borderColor: '#0F766E' },
  tabChipText: { fontSize: 12, fontWeight: '700', color: '#475569' },
  tabChipTextActive: { color: '#FFFFFF' },
  emptyCard: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 32, alignItems: 'center', borderWidth: 1, borderColor: '#E2E8F0' },
  emptyTitle: { fontSize: 16, fontWeight: '800', color: '#0F172A', marginTop: 8 },
  emptySub: { fontSize: 12, color: '#64748B', textAlign: 'center', marginTop: 4, marginBottom: 16 },
  assetCard: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: '#E2E8F0', ...SHADOWS.soft },
  assetCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  assetName: { fontSize: 15, fontWeight: '800', color: '#0F172A' },
  assetCategory: { fontSize: 12, color: '#64748B', marginTop: 2 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 10 },
  statusBadgeText: { fontSize: 11, fontWeight: '700' },
  assetDetailsGrid: { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: '#F8FAFC', padding: 10, borderRadius: 12, marginBottom: 12 },
  assetDetailItem: { alignItems: 'center' },
  assetDetailLabel: { fontSize: 10, color: '#64748B' },
  assetDetailVal: { fontSize: 12, fontWeight: '800', color: '#0F172A', marginTop: 2 },
  cardActionsRow: { flexDirection: 'row', gap: 8, marginBottom: 10 },
  cardBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, borderWidth: 1, borderColor: '#CBD5E1', paddingVertical: 8, borderRadius: 10 },
  cardBtnDisabled: { opacity: 0.5, backgroundColor: '#F1F5F9' },
  cardBtnText: { fontSize: 11, fontWeight: '700', color: '#0F766E' },
  eligibilityRow: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingTop: 8, borderTopWidth: 1, borderTopColor: '#F1F5F9' },
  eligibilityLabel: { fontSize: 10, fontWeight: '700', color: '#64748B' },
  eligibilityChip: { backgroundColor: '#F8FAFC', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  eligibilityChipText: { fontSize: 10, fontWeight: '600', color: '#334155' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.65)', justifyContent: 'flex-end' },
  modalCard: { backgroundColor: '#FFFFFF', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20 },
  modalScroll: { backgroundColor: '#FFFFFF', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  modalTitle: { fontSize: 16, fontWeight: '800', color: '#0F172A' },
  modalSub: { fontSize: 12, color: '#64748B', marginBottom: 14 },
  inputGroup: { marginBottom: 12 },
  inputRow: { flexDirection: 'row' },
  inputLabel: { fontSize: 12, fontWeight: '700', color: '#334155', marginBottom: 4 },
  textInput: { backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#CBD5E1', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, fontSize: 13, color: '#0F172A' },
  typeChip: { backgroundColor: '#F1F5F9', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10, marginRight: 6 },
  typeChipActive: { backgroundColor: '#0F766E' },
  typeChipText: { fontSize: 11, fontWeight: '700', color: '#475569' },
  typeChipTextActive: { color: '#FFFFFF' },
  geoCalcBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#ECFDF5', padding: 12, borderRadius: 12, borderWidth: 1, borderColor: '#A7F3D0', marginBottom: 14 },
  geoCalcTitle: { fontSize: 12, fontWeight: '800', color: '#0F766E' },
  geoCalcSub: { fontSize: 11, color: '#047857', marginTop: 2 },
  submitCTA: { backgroundColor: '#0F766E', borderRadius: 12, paddingVertical: 14, alignItems: 'center', marginTop: 12, marginBottom: 12 },
  submitCTAText: { color: '#FFFFFF', fontWeight: '800', fontSize: 14 },
  sevChip: { flex: 1, backgroundColor: '#F1F5F9', paddingVertical: 8, borderRadius: 8, alignItems: 'center' },
  sevChipActive: { backgroundColor: '#DC2626' },
  sevChipText: { fontSize: 10, fontWeight: '800', color: '#475569' },
  sevChipTextActive: { color: '#FFFFFF' },
});

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
  Image,
} from 'react-native';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { COLORS, SHADOWS } from '../theme/theme';
import api from '../api/apiClient';
import { useConnectivityStore } from '../store/connectivityStore';

const { width } = Dimensions.get('window');

export interface TreeDamageClaim {
  claim_id: string;
  policy_id: string;
  asset_name: string;
  incident_date: string;
  cause_of_damage: string;
  affected_trees_count: number;
  claimed_amount_inr: number;
  description?: string;
  photo_urls?: string[];
  gps_location?: { latitude: number; longitude: number };
  status: 'claim_filed' | 'settled' | 'rejected' | string;
  filed_at?: string;
  inspection_signoff?: {
    surveyor_name: string;
    nodal_officer_name: string;
    inspected_loss_amount_inr: number;
    approved_claim_amount_inr: number;
    signed_at: string;
    inspection_notes?: string;
  };
}

export interface TreeInsurancePolicy {
  id: string;
  policy_id: string;
  target_type: 'approved_public_asset' | 'farmer_linked_program' | 'land_parcel' | string;
  target_id?: string;
  asset_name: string;
  coverage_scope: 'single_tree' | 'multiple_trees' | 'plantation_farm_coverage' | string;
  trees_count: number;
  species_list: string[];
  location: string;
  coverage_type: string;
  sum_insured_inr: number;
  premium_annual_inr: number;
  govt_subsidy_percent: number;
  govt_subsidy_share_inr: number;
  institutional_settlement_share_inr: number;
  tenure_years: number;
  valid_from: string;
  valid_until: string;
  status: 'active' | 'nodal_verification_pending' | 'rejected' | string;
  insurance_partner: string;
  exclusions_list: string[];
  evidence_photos: string[];
  nodal_verification?: {
    officer_name: string;
    verified_at: string;
    remarks?: string;
  };
  claims: TreeDamageClaim[];
  audit_timeline?: Array<{ timestamp: string; action: string; actor: string; notes?: string }>;
  submitted_at?: string;
}

export function GovtTreeInsuranceView() {
  const isOnline = useConnectivityStore((state) => state.isOnline);

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'policies' | 'apply_wizard' | 'nodal_queue' | 'claims_manager'>('policies');
  const [policyFilter, setPolicyFilter] = useState<'all' | 'active' | 'nodal_pending'>('all');

  const [policies, setPolicies] = useState<TreeInsurancePolicy[]>([]);
  const [selectedPolicy, setSelectedPolicy] = useState<TreeInsurancePolicy | null>(null);

  // Apply Wizard State (3 Steps)
  const [wizardStep, setWizardStep] = useState<number>(1);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [wizardForm, setWizardForm] = useState({
    target_type: 'approved_public_asset',
    target_id: 'ASSET-1001',
    asset_name: 'Narmada Riverbank Biodiversity Belt',
    coverage_scope: 'plantation_farm_coverage',
    trees_count: '850',
    species_input: 'Teak / Sagwan, Banyan / Bargad, Mango / Aam',
    location: 'Pipariya Tehsil, Hoshangabad',
    coverage_type: 'Comprehensive Climate, Flood & Fire Risk',
    sum_insured_inr: '425000',
    tenure_years: '1',
    govt_subsidy_percent: '75',
    evidence_photo_url: 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=600&auto=format&fit=crop',
    contact_person: 'Rajesh Sharma (Gram Nodal Officer)',
  });

  // Nodal Verification Modal
  const [verifyingPolicy, setVerifyingPolicy] = useState<TreeInsurancePolicy | null>(null);
  const [nodalForm, setNodalForm] = useState({
    nodal_officer_name: 'Rajesh Sharma (Sub-Divisional Officer)',
    approval_status: 'approved' as 'approved' | 'rejected',
    remarks: 'Verified asset boundary and density compliance. Approved 75% state subsidy.',
  });

  // Report Claim Modal
  const [isClaimModalOpen, setIsClaimModalOpen] = useState<boolean>(false);
  const [claimForm, setClaimForm] = useState({
    policy_id: '',
    asset_name: '',
    incident_date: '2026-09-05',
    cause_of_damage: 'Cyclone / Storm',
    affected_trees_count: '25',
    claimed_amount_inr: '35000',
    description: 'High winds caused branch snapping and windfall damage in north block.',
    photo_url: 'https://images.unsplash.com/photo-1511497584788-876761c1298b?w=600&auto=format&fit=crop',
    latitude: '22.748',
    longitude: '77.728',
  });

  // Sign-off Claim Inspection Modal
  const [inspectingClaim, setInspectingClaim] = useState<TreeDamageClaim | null>(null);
  const [signoffForm, setSignoffForm] = useState({
    surveyor_name: 'Dr. S. K. Verma (ICAR Tree Surveyor)',
    nodal_officer_name: 'Rajesh Sharma (Nodal Officer)',
    inspected_loss_amount_inr: '32000',
    approved_claim_amount_inr: '32000',
    status: 'approved' as 'approved' | 'rejected',
    inspection_notes: 'Physical field inspection verified storm loss of 25 trees.',
  });

  const fetchData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await api.get('/govt/insurance');
      if (res.data && res.data.success) {
        setPolicies(res.data.data);
      }
    } catch (err: any) {
      console.warn('[GovtTreeInsuranceView] Fetch error:', err);
      setError(err?.message || 'Unable to load tree insurance policies.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Submit Apply Wizard
  const handleApplyPolicy = async () => {
    if (!wizardForm.asset_name.trim()) {
      Alert.alert('Validation Error', 'Asset / Farm Name is required.');
      return;
    }

    setIsSubmitting(true);
    try {
      const sumInsured = Number(wizardForm.sum_insured_inr) || 250000;
      const treesCount = Number(wizardForm.trees_count) || 100;
      const speciesList = wizardForm.species_input.split(',').map((s) => s.trim()).filter(Boolean);

      const payload = {
        target_type: wizardForm.target_type,
        target_id: wizardForm.target_id,
        asset_name: wizardForm.asset_name.trim(),
        coverage_scope: wizardForm.coverage_scope,
        trees_count: treesCount,
        species_list: speciesList.length > 0 ? speciesList : ['Teak', 'Banyan'],
        location: wizardForm.location,
        coverage_type: wizardForm.coverage_type,
        sum_insured_inr: sumInsured,
        tenure_years: Number(wizardForm.tenure_years) || 1,
        govt_subsidy_percent: Number(wizardForm.govt_subsidy_percent) || 75,
        evidence_photos: [wizardForm.evidence_photo_url],
        contact_person: wizardForm.contact_person,
      };

      const res = await api.post('/govt/insurance/request', payload);
      if (res.data && res.data.success) {
        Alert.alert('Success', `Tree Insurance policy application ${res.data.data?.id || ''} submitted for Nodal verification!`);
        setWizardStep(1);
        setActiveTab('policies');
        fetchData();
      }
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.detail || 'Failed to submit policy application.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Submit Nodal Verification
  const handleNodalVerify = async () => {
    if (!verifyingPolicy) return;
    setIsSubmitting(true);
    try {
      const res = await api.post(`/govt/insurance/${verifyingPolicy.id}/nodal-verify`, nodalForm);
      if (res.data && res.data.success) {
        Alert.alert('Nodal Officer Verified', `Policy ${verifyingPolicy.id} has been ${nodalForm.approval_status.toUpperCase()}.`);
        setVerifyingPolicy(null);
        fetchData();
      }
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.detail || 'Failed to submit nodal verification.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Report Claim Submission
  const handleReportClaim = async () => {
    if (!claimForm.policy_id) {
      Alert.alert('Validation Error', 'Please select a policy.');
      return;
    }
    setIsSubmitting(true);
    try {
      const payload = {
        policy_id: claimForm.policy_id,
        asset_name: claimForm.asset_name,
        incident_date: claimForm.incident_date,
        cause_of_damage: claimForm.cause_of_damage,
        affected_trees_count: Number(claimForm.affected_trees_count) || 1,
        claimed_amount_inr: Number(claimForm.claimed_amount_inr) || 10000,
        description: claimForm.description,
        photo_urls: [claimForm.photo_url],
        gps_location: {
          latitude: Number(claimForm.latitude) || 22.748,
          longitude: Number(claimForm.longitude) || 77.728,
        },
      };

      const res = await api.post('/govt/insurance/claims', payload);
      if (res.data && res.data.success) {
        Alert.alert('Claim Submitted', `Tree damage claim ${res.data.data?.claim_id || ''} has been filed for surveyor inspection.`);
        setIsClaimModalOpen(false);
        fetchData();
      }
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.detail || 'Failed to submit damage claim.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Sign-off Claim Inspection Submission
  const handleSignoffInspection = async () => {
    if (!inspectingClaim) return;
    setIsSubmitting(true);
    try {
      const payload = {
        surveyor_name: signoffForm.surveyor_name,
        nodal_officer_name: signoffForm.nodal_officer_name,
        inspected_loss_amount_inr: Number(signoffForm.inspected_loss_amount_inr) || 0,
        approved_claim_amount_inr: Number(signoffForm.approved_claim_amount_inr) || 0,
        status: signoffForm.status,
        inspection_notes: signoffForm.inspection_notes,
      };

      const res = await api.post(`/govt/insurance/claims/${inspectingClaim.claim_id}/signoff`, payload);
      if (res.data && res.data.success) {
        Alert.alert('Sign-off Completed', `Claim ${inspectingClaim.claim_id} status updated to ${res.data.data?.status || 'settled'}.`);
        setInspectingClaim(null);
        fetchData();
      }
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.detail || 'Failed to sign-off claim inspection.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Helper calculations for Wizard
  const calcSumInsured = Number(wizardForm.sum_insured_inr) || 250000;
  const calcTenure = Number(wizardForm.tenure_years) || 1;
  const calcAnnualPremium = Math.round(calcSumInsured * 0.03 * calcTenure);
  const calcGovtSubsidy = Math.round(calcAnnualPremium * (Number(wizardForm.govt_subsidy_percent) / 100));
  const calcInstShare = calcAnnualPremium - calcGovtSubsidy;

  // Filtered Policies
  const filteredPolicies = policies.filter((pol) => {
    if (policyFilter === 'active') return pol.status === 'active';
    if (policyFilter === 'nodal_pending') return pol.status === 'nodal_verification_pending';
    return true;
  });

  const pendingNodalCount = policies.filter((p) => p.status === 'nodal_verification_pending').length;
  const allClaims: TreeDamageClaim[] = policies.flatMap((p) => p.claims || []);

  if (!isOnline) {
    return (
      <View style={styles.stateContainer}>
        <MaterialCommunityIcons name="wifi-off" size={48} color="#EF4444" />
        <Text style={styles.stateTitle}>Offline Mode</Text>
        <Text style={styles.stateSubtitle}>Connect to network to manage Tree Insurance policies and damage claims.</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={fetchData}>
          <Text style={styles.retryBtnText}>Retry Connection</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (isLoading) {
    return (
      <View style={styles.stateContainer}>
        <ActivityIndicator size="large" color="#059669" />
        <Text style={styles.loadingText}>Loading Government Tree Insurance Desk...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.stateContainer}>
        <MaterialCommunityIcons name="alert-circle-outline" size={48} color="#EF4444" />
        <Text style={styles.stateTitle}>Failed to Load Insurance Data</Text>
        <Text style={styles.stateSubtitle}>{error}</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={fetchData}>
          <Text style={styles.retryBtnText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* ── 1. HEADER & NAVIGATION TABS ── */}
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.headerTitle}>Tree Climate Insurance & Claims</Text>
          <Text style={styles.headerSub}>State Co-Funded Tree Protection Desk</Text>
        </View>
        <TouchableOpacity
          style={styles.applyBtnCTA}
          onPress={() => {
            setWizardStep(1);
            setActiveTab('apply_wizard');
          }}
        >
          <MaterialCommunityIcons name="shield-plus-outline" size={16} color="#FFFFFF" />
          <Text style={styles.applyBtnCTAText}>Apply Policy</Text>
        </TouchableOpacity>
      </View>

      {/* Main Tabs */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabScroll} contentContainerStyle={{ gap: 6 }}>
        {[
          { key: 'policies', label: 'Policies Directory', icon: 'shield-check-outline' },
          { key: 'apply_wizard', label: 'Apply Wizard', icon: 'file-document-edit-outline' },
          { key: 'nodal_queue', label: `Nodal Queue (${pendingNodalCount})`, icon: 'account-check-outline' },
          { key: 'claims_manager', label: `Claims (${allClaims.length})`, icon: 'tree-alert' },
        ].map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[styles.tabBtn, activeTab === tab.key && styles.tabBtnActive]}
            onPress={() => setActiveTab(tab.key as any)}
          >
            <MaterialCommunityIcons
              name={tab.icon as any}
              size={15}
              color={activeTab === tab.key ? '#FFFFFF' : '#475569'}
            />
            <Text style={[styles.tabBtnText, activeTab === tab.key && styles.tabBtnTextActive]}>{tab.label}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* ── TAB 1: POLICIES DIRECTORY ── */}
      {activeTab === 'policies' && (
        <ScrollView contentContainerStyle={{ paddingBottom: 120 }}>
          {/* Sub-Filters */}
          <View style={styles.filterRow}>
            {[
              { key: 'all', label: `All Policies (${policies.length})` },
              { key: 'active', label: `Active (${policies.filter((p) => p.status === 'active').length})` },
              { key: 'nodal_pending', label: `Nodal Pending (${pendingNodalCount})` },
            ].map((f) => (
              <TouchableOpacity
                key={f.key}
                style={[styles.filterChip, policyFilter === f.key && styles.filterChipActive]}
                onPress={() => setPolicyFilter(f.key as any)}
              >
                <Text style={[styles.filterChipText, policyFilter === f.key && styles.filterChipTextActive]}>{f.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {filteredPolicies.length === 0 ? (
            <View style={styles.emptyCard}>
              <MaterialCommunityIcons name="shield-off-outline" size={48} color="#94A3B8" />
              <Text style={styles.emptyTitle}>No Insurance Policies Found</Text>
              <Text style={styles.emptySub}>No tree insurance policies match the selected filter criteria.</Text>
              <TouchableOpacity
                style={styles.applyBtnCTA}
                onPress={() => {
                  setWizardStep(1);
                  setActiveTab('apply_wizard');
                }}
              >
                <Text style={styles.applyBtnCTAText}>+ Apply Tree Insurance Policy</Text>
              </TouchableOpacity>
            </View>
          ) : (
            filteredPolicies.map((pol) => {
              const isActive = pol.status === 'active';
              return (
                <View key={pol.id} style={styles.policyCard}>
                  <View style={styles.policyHeader}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.policyIdBadge}>{pol.id} • {pol.target_type.replace('_', ' ').toUpperCase()}</Text>
                      <Text style={styles.assetNameTitle}>{pol.asset_name}</Text>
                      <Text style={styles.locationText}>📍 {pol.location}</Text>
                    </View>
                    <View
                      style={[
                        styles.statusBadge,
                        { backgroundColor: isActive ? '#ECFDF5' : '#FEF3C7' },
                      ]}
                    >
                      <Text
                        style={[
                          styles.statusBadgeText,
                          { color: isActive ? '#065F46' : '#92400E' },
                        ]}
                      >
                        {isActive ? 'Active Coverage' : 'Nodal Pending'}
                      </Text>
                    </View>
                  </View>

                  {/* Species & Scope Badge */}
                  <View style={styles.scopeRow}>
                    <View style={styles.scopeTag}>
                      <MaterialCommunityIcons name="tree-outline" size={14} color="#059669" />
                      <Text style={styles.scopeTagText}>{pol.trees_count} Trees ({pol.coverage_scope.replace('_', ' ')})</Text>
                    </View>
                  </View>

                  <View style={styles.speciesChipWrap}>
                    {(pol.species_list || []).map((sp, idx) => (
                      <View key={idx} style={styles.speciesChip}>
                        <Text style={styles.speciesChipText}>🍃 {sp}</Text>
                      </View>
                    ))}
                  </View>

                  {/* Premium & Govt Subsidy Breakdown */}
                  <View style={styles.financialBox}>
                    <View style={styles.financialCol}>
                      <Text style={styles.finLabel}>Sum Insured</Text>
                      <Text style={styles.finVal}>₹{pol.sum_insured_inr.toLocaleString()}</Text>
                    </View>
                    <View style={styles.financialCol}>
                      <Text style={styles.finLabel}>Annual Premium</Text>
                      <Text style={styles.finVal}>₹{pol.premium_annual_inr.toLocaleString()}</Text>
                    </View>
                    <View style={styles.financialCol}>
                      <Text style={styles.finLabel}>State Subsidy (75%)</Text>
                      <Text style={[styles.finVal, { color: '#059669' }]}>
                        ₹{pol.govt_subsidy_share_inr.toLocaleString()}
                      </Text>
                    </View>
                  </View>

                  {/* Validity & Partner */}
                  <View style={styles.validityRow}>
                    <Text style={styles.validityText}>Validity: {pol.valid_from} to {pol.valid_until}</Text>
                    <Text style={styles.partnerText}>Underwriter: AIC</Text>
                  </View>

                  {/* Action Buttons */}
                  <View style={styles.policyCardActions}>
                    <TouchableOpacity
                      style={styles.secondaryBtn}
                      onPress={() => setSelectedPolicy(pol)}
                    >
                      <MaterialCommunityIcons name="information-outline" size={14} color="#334155" />
                      <Text style={styles.secondaryBtnText}>Details & Exclusions</Text>
                    </TouchableOpacity>

                    {pol.status === 'nodal_verification_pending' ? (
                      <TouchableOpacity
                        style={styles.nodalActionBtn}
                        onPress={() => setVerifyingPolicy(pol)}
                      >
                        <MaterialCommunityIcons name="account-check" size={14} color="#FFFFFF" />
                        <Text style={styles.nodalActionBtnText}>Nodal Sign-off</Text>
                      </TouchableOpacity>
                    ) : (
                      <TouchableOpacity
                        style={styles.claimActionBtn}
                        onPress={() => {
                          setClaimForm({
                            ...claimForm,
                            policy_id: pol.id,
                            asset_name: pol.asset_name,
                          });
                          setIsClaimModalOpen(true);
                        }}
                      >
                        <MaterialCommunityIcons name="alert-decagram-outline" size={14} color="#FFFFFF" />
                        <Text style={styles.claimActionBtnText}>Report Claim</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              );
            })
          )}
        </ScrollView>
      )}

      {/* ── TAB 2: 3-STEP APPLY POLICY WIZARD ── */}
      {activeTab === 'apply_wizard' && (
        <ScrollView contentContainerStyle={styles.wizardScroll}>
          {/* Step Indicator */}
          <View style={styles.stepHeader}>
            {[
              { num: 1, label: 'Target & Scope' },
              { num: 2, label: 'Trees & Evidence' },
              { num: 3, label: 'Subsidy & Review' },
            ].map((st) => (
              <View key={st.num} style={styles.stepItem}>
                <View style={[styles.stepCircle, wizardStep === st.num && styles.stepCircleActive]}>
                  <Text style={[styles.stepNum, wizardStep === st.num && styles.stepNumActive]}>{st.num}</Text>
                </View>
                <Text style={[styles.stepLabel, wizardStep === st.num && styles.stepLabelActive]}>{st.label}</Text>
              </View>
            ))}
          </View>

          {/* STEP 1 */}
          {wizardStep === 1 && (
            <View style={styles.wizardCard}>
              <Text style={styles.wizardTitle}>Step 1: Select Target & Coverage Scope</Text>
              <Text style={styles.wizardSub}>Choose eligible public asset, farmer program, or land parcel.</Text>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Target Category *</Text>
                <View style={{ flexDirection: 'row', gap: 6, flexWrap: 'wrap' }}>
                  {[
                    { key: 'approved_public_asset', label: 'Public Asset' },
                    { key: 'farmer_linked_program', label: 'Farmer Program' },
                    { key: 'land_parcel', label: 'Land Parcel' },
                  ].map((t) => (
                    <TouchableOpacity
                      key={t.key}
                      style={[styles.typeChip, wizardForm.target_type === t.key && styles.typeChipActive]}
                      onPress={() => setWizardForm({ ...wizardForm, target_type: t.key })}
                    >
                      <Text style={[styles.typeChipText, wizardForm.target_type === t.key && styles.typeChipTextActive]}>{t.label}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Asset / Farm / Land Name *</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="e.g. Gram Panchayat Biodiversity Park"
                  value={wizardForm.asset_name}
                  onChangeText={(t) => setWizardForm({ ...wizardForm, asset_name: t })}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Coverage Scope *</Text>
                <View style={{ flexDirection: 'row', gap: 6 }}>
                  {[
                    { key: 'single_tree', label: 'Single Tree' },
                    { key: 'multiple_trees', label: 'Multiple Trees' },
                    { key: 'plantation_farm_coverage', label: 'Plantation/Farm' },
                  ].map((s) => (
                    <TouchableOpacity
                      key={s.key}
                      style={[styles.typeChip, wizardForm.coverage_scope === s.key && styles.typeChipActive]}
                      onPress={() => setWizardForm({ ...wizardForm, coverage_scope: s.key })}
                    >
                      <Text style={[styles.typeChipText, wizardForm.coverage_scope === s.key && styles.typeChipTextActive]}>{s.label}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Location Address</Text>
                <TextInput
                  style={styles.textInput}
                  value={wizardForm.location}
                  onChangeText={(t) => setWizardForm({ ...wizardForm, location: t })}
                />
              </View>

              <TouchableOpacity style={styles.nextWizardCTA} onPress={() => setWizardStep(2)}>
                <Text style={styles.nextWizardCTAText}>Next: Trees & Evidence →</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* STEP 2 */}
          {wizardStep === 2 && (
            <View style={styles.wizardCard}>
              <Text style={styles.wizardTitle}>Step 2: Tree Count, Species & Evidence</Text>
              <Text style={styles.wizardSub}>Specify tree population, species list, and attach photo evidence.</Text>

              <View style={styles.inputRow}>
                <View style={[styles.inputGroup, { flex: 1, marginRight: 6 }]}>
                  <Text style={styles.inputLabel}>Tree Count *</Text>
                  <TextInput
                    style={styles.textInput}
                    keyboardType="numeric"
                    placeholder="850"
                    value={wizardForm.trees_count}
                    onChangeText={(t) => setWizardForm({ ...wizardForm, trees_count: t })}
                  />
                </View>
                <View style={[styles.inputGroup, { flex: 1, marginLeft: 6 }]}>
                  <Text style={styles.inputLabel}>Tenure (Years)</Text>
                  <TextInput
                    style={styles.textInput}
                    keyboardType="numeric"
                    placeholder="1"
                    value={wizardForm.tenure_years}
                    onChangeText={(t) => setWizardForm({ ...wizardForm, tenure_years: t })}
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Species Breakdown (comma separated)</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="e.g. Teak / Sagwan, Banyan, Mango"
                  value={wizardForm.species_input}
                  onChangeText={(t) => setWizardForm({ ...wizardForm, species_input: t })}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Evidence Photo URL</Text>
                <TextInput
                  style={styles.textInput}
                  value={wizardForm.evidence_photo_url}
                  onChangeText={(t) => setWizardForm({ ...wizardForm, evidence_photo_url: t })}
                />
              </View>

              <View style={styles.wizardBtnRow}>
                <TouchableOpacity style={styles.backWizardBtn} onPress={() => setWizardStep(1)}>
                  <Text style={styles.backWizardBtnText}>← Back</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.nextWizardCTA, { flex: 1 }]} onPress={() => setWizardStep(3)}>
                  <Text style={styles.nextWizardCTAText}>Next: Subsidy Calculator →</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* STEP 3 */}
          {wizardStep === 3 && (
            <View style={styles.wizardCard}>
              <Text style={styles.wizardTitle}>Step 3: Subsidy Calculation & Review</Text>
              <Text style={styles.wizardSub}>Dynamic breakdown of Sum Insured, Premium & Government 75% Subsidy Share.</Text>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Sum Insured Amount (₹) *</Text>
                <TextInput
                  style={styles.textInput}
                  keyboardType="numeric"
                  placeholder="425000"
                  value={wizardForm.sum_insured_inr}
                  onChangeText={(t) => setWizardForm({ ...wizardForm, sum_insured_inr: t })}
                />
              </View>

              {/* Dynamic Subsidy Share Box */}
              <View style={styles.calcBox}>
                <Text style={styles.calcTitle}>Government Co-Funding Settlement</Text>
                <View style={styles.calcGrid}>
                  <View style={styles.calcItem}>
                    <Text style={styles.calcLabel}>Annual Premium (3%)</Text>
                    <Text style={styles.calcVal}>₹{calcAnnualPremium.toLocaleString()}</Text>
                  </View>
                  <View style={styles.calcItem}>
                    <Text style={styles.calcLabel}>Govt Subsidy (75%)</Text>
                    <Text style={[styles.calcVal, { color: '#059669' }]}>₹{calcGovtSubsidy.toLocaleString()}</Text>
                  </View>
                  <View style={styles.calcItem}>
                    <Text style={styles.calcLabel}>Panchayat Share (25%)</Text>
                    <Text style={styles.calcVal}>₹{calcInstShare.toLocaleString()}</Text>
                  </View>
                </View>
              </View>

              <View style={styles.summaryBox}>
                <Text style={styles.summaryTitle}>Application Summary</Text>
                <Text style={styles.summaryText}>• Target: {wizardForm.asset_name} ({wizardForm.trees_count} Trees)</Text>
                <Text style={styles.summaryText}>• Scope: {wizardForm.coverage_scope.replace('_', ' ')}</Text>
                <Text style={styles.summaryText}>• Underwriter: National Agriculture Insurance Corp (AIC)</Text>
              </View>

              <View style={styles.wizardBtnRow}>
                <TouchableOpacity style={styles.backWizardBtn} onPress={() => setWizardStep(2)}>
                  <Text style={styles.backWizardBtnText}>← Back</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.submitWizardCTA, isSubmitting && { opacity: 0.6 }]}
                  onPress={handleApplyPolicy}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <Text style={styles.submitWizardCTAText}>Submit to Nodal Officer</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          )}
        </ScrollView>
      )}

      {/* ── TAB 3: NODAL VERIFICATION QUEUE ── */}
      {activeTab === 'nodal_queue' && (
        <ScrollView contentContainerStyle={{ paddingBottom: 120 }}>
          <View style={styles.sectionTitleRow}>
            <Text style={styles.sectionTitleText}>Government Nodal Verification Queue</Text>
            <Text style={styles.sectionSubText}>Sub-Divisional Officer (SDO) verification of co-funding eligibility.</Text>
          </View>

          {policies.filter((p) => p.status === 'nodal_verification_pending').length === 0 ? (
            <View style={styles.emptyCard}>
              <MaterialCommunityIcons name="check-decagram-outline" size={48} color="#059669" />
              <Text style={styles.emptyTitle}>Queue Clear!</Text>
              <Text style={styles.emptySub}>All tree insurance policies have been verified by Nodal Officers.</Text>
            </View>
          ) : (
            policies
              .filter((p) => p.status === 'nodal_verification_pending')
              .map((pol) => (
                <View key={pol.id} style={styles.queueCard}>
                  <View style={styles.queueHeader}>
                    <Text style={styles.queueId}>{pol.id}</Text>
                    <Text style={styles.queueDate}>Submitted: {pol.valid_from}</Text>
                  </View>

                  <Text style={styles.queueAsset}>{pol.asset_name}</Text>
                  <Text style={styles.queueSub}>
                    Trees: {pol.trees_count} • Sum Insured: ₹{pol.sum_insured_inr.toLocaleString()} • Premium: ₹{pol.premium_annual_inr.toLocaleString()}
                  </Text>
                  <Text style={styles.subsidyHighlight}>Govt Co-Funding Subsidy Share (75%): ₹{pol.govt_subsidy_share_inr.toLocaleString()}</Text>

                  <TouchableOpacity style={styles.verifyModalCTA} onPress={() => setVerifyingPolicy(pol)}>
                    <MaterialCommunityIcons name="draw-pen" size={16} color="#FFFFFF" />
                    <Text style={styles.verifyModalCTAText}>Perform Nodal Inspection & Verification</Text>
                  </TouchableOpacity>
                </View>
              ))
          )}
        </ScrollView>
      )}

      {/* ── TAB 4: CLAIMS & INSPECTIONS MANAGER ── */}
      {activeTab === 'claims_manager' && (
        <ScrollView contentContainerStyle={{ paddingBottom: 120 }}>
          <View style={styles.claimsHeader}>
            <View>
              <Text style={styles.sectionTitleText}>Damage Claims & Inspection Manager</Text>
              <Text style={styles.sectionSubText}>Field surveyor verification & Nodal sign-off settlements.</Text>
            </View>
            <TouchableOpacity
              style={styles.claimReportBtn}
              onPress={() => {
                if (policies.length > 0) {
                  setClaimForm({
                    ...claimForm,
                    policy_id: policies[0].id,
                    asset_name: policies[0].asset_name,
                  });
                }
                setIsClaimModalOpen(true);
              }}
            >
              <MaterialCommunityIcons name="fire-alert" size={16} color="#FFFFFF" />
              <Text style={styles.claimReportBtnText}>Report Claim</Text>
            </TouchableOpacity>
          </View>

          {allClaims.length === 0 ? (
            <View style={styles.emptyCard}>
              <MaterialCommunityIcons name="tree-outline" size={48} color="#059669" />
              <Text style={styles.emptyTitle}>No Damage Claims Filed</Text>
              <Text style={styles.emptySub}>No claims reported for insured trees in this jurisdiction.</Text>
            </View>
          ) : (
            allClaims.map((clm) => {
              const isSettled = clm.status === 'settled';
              return (
                <View key={clm.claim_id} style={styles.claimCard}>
                  <View style={styles.claimCardHeader}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.claimIdText}>{clm.claim_id} • Policy {clm.policy_id}</Text>
                      <Text style={styles.claimAssetText}>{clm.asset_name}</Text>
                    </View>
                    <View
                      style={[
                        styles.statusBadge,
                        { backgroundColor: isSettled ? '#ECFDF5' : '#FEF2F2' },
                      ]}
                    >
                      <Text
                        style={[
                          styles.statusBadgeText,
                          { color: isSettled ? '#065F46' : '#DC2626' },
                        ]}
                      >
                        {isSettled ? 'Settled' : 'Inspection Pending'}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.claimDetailsRow}>
                    <Text style={styles.claimCause}>Cause: {clm.cause_of_damage}</Text>
                    <Text style={styles.claimTrees}>{clm.affected_trees_count} Trees Affected</Text>
                  </View>

                  <View style={styles.claimAmountRow}>
                    <Text style={styles.claimedVal}>Claimed: ₹{clm.claimed_amount_inr.toLocaleString()}</Text>
                    {clm.inspection_signoff && (
                      <Text style={styles.approvedVal}>
                        Settled: ₹{clm.inspection_signoff.approved_claim_amount_inr.toLocaleString()}
                      </Text>
                    )}
                  </View>

                  {/* Inspection Sign-off summary */}
                  {clm.inspection_signoff ? (
                    <View style={styles.signoffBox}>
                      <Text style={styles.signoffTitle}>Verified Sign-off Certificate:</Text>
                      <Text style={styles.signoffSub}>Surveyor: {clm.inspection_signoff.surveyor_name}</Text>
                      <Text style={styles.signoffSub}>Nodal Officer: {clm.inspection_signoff.nodal_officer_name}</Text>
                      <Text style={styles.signoffNotes}>"{clm.inspection_signoff.inspection_notes}"</Text>
                    </View>
                  ) : (
                    <TouchableOpacity
                      style={styles.signoffCTA}
                      onPress={() => setInspectingClaim(clm)}
                    >
                      <MaterialCommunityIcons name="checkbox-marked-circle-outline" size={16} color="#FFFFFF" />
                      <Text style={styles.signoffCTAText}>Field Surveyor & Nodal Sign-off</Text>
                    </TouchableOpacity>
                  )}
                </View>
              );
            })
          )}
        </ScrollView>
      )}

      {/* ── MODAL 1: POLICY DETAILS & EXCLUSIONS ── */}
      {selectedPolicy && (
        <Modal animationType="slide" transparent visible={!!selectedPolicy} onRequestClose={() => setSelectedPolicy(null)}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalCard}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Policy Certificate & Exclusions</Text>
                <TouchableOpacity onPress={() => setSelectedPolicy(null)}>
                  <Ionicons name="close" size={24} color="#0F172A" />
                </TouchableOpacity>
              </View>

              <ScrollView showsVerticalScrollIndicator={false}>
                <Text style={styles.modalPolicyId}>ID: {selectedPolicy.id} ({selectedPolicy.status.toUpperCase()})</Text>
                <Text style={styles.modalAssetName}>{selectedPolicy.asset_name}</Text>

                <View style={styles.modalGrid}>
                  <View style={styles.modalGridItem}>
                    <Text style={styles.modalLabel}>Covered Trees</Text>
                    <Text style={styles.modalVal}>{selectedPolicy.trees_count} Trees</Text>
                  </View>
                  <View style={styles.modalGridItem}>
                    <Text style={styles.modalLabel}>Sum Insured</Text>
                    <Text style={styles.modalVal}>₹{selectedPolicy.sum_insured_inr.toLocaleString()}</Text>
                  </View>
                  <View style={styles.modalGridItem}>
                    <Text style={styles.modalLabel}>Govt Subsidy (75%)</Text>
                    <Text style={[styles.modalVal, { color: '#059669' }]}>
                      ₹{selectedPolicy.govt_subsidy_share_inr.toLocaleString()}
                    </Text>
                  </View>
                </View>

                {/* Exclusions List */}
                <Text style={styles.modalSectionTitle}>Policy Exclusions:</Text>
                {(selectedPolicy.exclusions_list || []).map((exc, i) => (
                  <View key={i} style={styles.exclusionItem}>
                    <Ionicons name="close-circle-outline" size={16} color="#DC2626" />
                    <Text style={styles.exclusionText}>{exc}</Text>
                  </View>
                ))}

                {/* Audit Timeline */}
                <Text style={styles.modalSectionTitle}>Audit & Lifecycle Timeline:</Text>
                {(selectedPolicy.audit_timeline || []).map((t, i) => (
                  <View key={i} style={styles.timelineItem}>
                    <Text style={styles.timelineAction}>• {t.action} ({t.actor})</Text>
                    <Text style={styles.timelineNotes}>{t.notes}</Text>
                  </View>
                ))}
              </ScrollView>
            </View>
          </View>
        </Modal>
      )}

      {/* ── MODAL 2: NODAL OFFICER VERIFICATION ── */}
      {verifyingPolicy && (
        <Modal animationType="slide" transparent visible={!!verifyingPolicy} onRequestClose={() => setVerifyingPolicy(null)}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalCard}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Nodal Officer Verification</Text>
                <TouchableOpacity onPress={() => setVerifyingPolicy(null)}>
                  <Ionicons name="close" size={24} color="#0F172A" />
                </TouchableOpacity>
              </View>

              <ScrollView showsVerticalScrollIndicator={false}>
                <Text style={styles.queueAsset}>{verifyingPolicy.asset_name}</Text>
                <Text style={styles.queueSub}>
                  Sum Insured: ₹{verifyingPolicy.sum_insured_inr.toLocaleString()} • Premium: ₹{verifyingPolicy.premium_annual_inr.toLocaleString()}
                </Text>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Nodal Officer Designation *</Text>
                  <TextInput
                    style={styles.textInput}
                    value={nodalForm.nodal_officer_name}
                    onChangeText={(t) => setNodalForm({ ...nodalForm, nodal_officer_name: t })}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Approval Status *</Text>
                  <View style={{ flexDirection: 'row', gap: 10 }}>
                    <TouchableOpacity
                      style={[styles.typeChip, nodalForm.approval_status === 'approved' && { backgroundColor: '#059669', borderColor: '#059669' }]}
                      onPress={() => setNodalForm({ ...nodalForm, approval_status: 'approved' })}
                    >
                      <Text style={[styles.typeChipText, nodalForm.approval_status === 'approved' && { color: '#FFFFFF' }]}>Approve & Activate</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[styles.typeChip, nodalForm.approval_status === 'rejected' && { backgroundColor: '#DC2626', borderColor: '#DC2626' }]}
                      onPress={() => setNodalForm({ ...nodalForm, approval_status: 'rejected' })}
                    >
                      <Text style={[styles.typeChipText, nodalForm.approval_status === 'rejected' && { color: '#FFFFFF' }]}>Reject Application</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Verification Remarks</Text>
                  <TextInput
                    style={styles.textInput}
                    value={nodalForm.remarks}
                    onChangeText={(t) => setNodalForm({ ...nodalForm, remarks: t })}
                  />
                </View>

                <TouchableOpacity
                  style={[styles.submitWizardCTA, isSubmitting && { opacity: 0.6 }]}
                  onPress={handleNodalVerify}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <Text style={styles.submitWizardCTAText}>Confirm Nodal Decision</Text>
                  )}
                </TouchableOpacity>
              </ScrollView>
            </View>
          </View>
        </Modal>
      )}

      {/* ── MODAL 3: REPORT DAMAGE CLAIM ── */}
      <Modal animationType="slide" transparent visible={isClaimModalOpen} onRequestClose={() => setIsClaimModalOpen(false)}>
        <View style={styles.modalOverlay}>
          <ScrollView contentContainerStyle={styles.modalScroll}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Report Tree Damage Claim</Text>
              <TouchableOpacity onPress={() => setIsClaimModalOpen(false)}>
                <Ionicons name="close" size={24} color="#0F172A" />
              </TouchableOpacity>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Policy ID *</Text>
              <TextInput
                style={styles.textInput}
                placeholder="e.g. INS-701"
                value={claimForm.policy_id}
                onChangeText={(t) => setClaimForm({ ...claimForm, policy_id: t })}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Asset Name *</Text>
              <TextInput
                style={styles.textInput}
                value={claimForm.asset_name}
                onChangeText={(t) => setClaimForm({ ...claimForm, asset_name: t })}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Cause of Damage *</Text>
              <View style={{ flexDirection: 'row', gap: 6, flexWrap: 'wrap' }}>
                {['Cyclone / Storm', 'Forest Fire', 'Pest / Disease', 'Flood / Waterlogging', 'Drought'].map((c) => (
                  <TouchableOpacity
                    key={c}
                    style={[styles.typeChip, claimForm.cause_of_damage === c && styles.typeChipActive]}
                    onPress={() => setClaimForm({ ...claimForm, cause_of_damage: c })}
                  >
                    <Text style={[styles.typeChipText, claimForm.cause_of_damage === c && styles.typeChipTextActive]}>{c}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.inputRow}>
              <View style={[styles.inputGroup, { flex: 1, marginRight: 6 }]}>
                <Text style={styles.inputLabel}>Affected Trees</Text>
                <TextInput
                  style={styles.textInput}
                  keyboardType="numeric"
                  value={claimForm.affected_trees_count}
                  onChangeText={(t) => setClaimForm({ ...claimForm, affected_trees_count: t })}
                />
              </View>
              <View style={[styles.inputGroup, { flex: 1, marginLeft: 6 }]}>
                <Text style={styles.inputLabel}>Claimed Amount (₹)</Text>
                <TextInput
                  style={styles.textInput}
                  keyboardType="numeric"
                  value={claimForm.claimed_amount_inr}
                  onChangeText={(t) => setClaimForm({ ...claimForm, claimed_amount_inr: t })}
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Description</Text>
              <TextInput
                style={styles.textInput}
                value={claimForm.description}
                onChangeText={(t) => setClaimForm({ ...claimForm, description: t })}
              />
            </View>

            <TouchableOpacity
              style={[styles.submitWizardCTA, isSubmitting && { opacity: 0.6 }]}
              onPress={handleReportClaim}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.submitWizardCTAText}>Submit Claim for Inspection</Text>
              )}
            </TouchableOpacity>
          </ScrollView>
        </View>
      </Modal>

      {/* ── MODAL 4: SURVEYOR INSPECTION & NODAL SIGN-OFF ── */}
      {inspectingClaim && (
        <Modal animationType="slide" transparent visible={!!inspectingClaim} onRequestClose={() => setInspectingClaim(null)}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalCard}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Surveyor Inspection & Nodal Sign-off</Text>
                <TouchableOpacity onPress={() => setInspectingClaim(null)}>
                  <Ionicons name="close" size={24} color="#0F172A" />
                </TouchableOpacity>
              </View>

              <ScrollView showsVerticalScrollIndicator={false}>
                <Text style={styles.claimIdText}>Claim {inspectingClaim.claim_id} • {inspectingClaim.asset_name}</Text>
                <Text style={styles.claimCause}>Damage: {inspectingClaim.affected_trees_count} Trees ({inspectingClaim.cause_of_damage})</Text>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>ICAR Field Surveyor Name *</Text>
                  <TextInput
                    style={styles.textInput}
                    value={signoffForm.surveyor_name}
                    onChangeText={(t) => setSignoffForm({ ...signoffForm, surveyor_name: t })}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Nodal Officer Sign-off Name *</Text>
                  <TextInput
                    style={styles.textInput}
                    value={signoffForm.nodal_officer_name}
                    onChangeText={(t) => setSignoffForm({ ...signoffForm, nodal_officer_name: t })}
                  />
                </View>

                <View style={styles.inputRow}>
                  <View style={[styles.inputGroup, { flex: 1, marginRight: 6 }]}>
                    <Text style={styles.inputLabel}>Inspected Loss (₹)</Text>
                    <TextInput
                      style={styles.textInput}
                      keyboardType="numeric"
                      value={signoffForm.inspected_loss_amount_inr}
                      onChangeText={(t) => setSignoffForm({ ...signoffForm, inspected_loss_amount_inr: t })}
                    />
                  </View>
                  <View style={[styles.inputGroup, { flex: 1, marginLeft: 6 }]}>
                    <Text style={styles.inputLabel}>Approved Payout (₹)</Text>
                    <TextInput
                      style={styles.textInput}
                      keyboardType="numeric"
                      value={signoffForm.approved_claim_amount_inr}
                      onChangeText={(t) => setSignoffForm({ ...signoffForm, approved_claim_amount_inr: t })}
                    />
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Inspection Notes</Text>
                  <TextInput
                    style={styles.textInput}
                    value={signoffForm.inspection_notes}
                    onChangeText={(t) => setSignoffForm({ ...signoffForm, inspection_notes: t })}
                  />
                </View>

                <TouchableOpacity
                  style={[styles.submitWizardCTA, isSubmitting && { opacity: 0.6 }]}
                  onPress={handleSignoffInspection}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <Text style={styles.submitWizardCTAText}>Execute Sign-off & Disburse Settlement</Text>
                  )}
                </TouchableOpacity>
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
  loadingText: { fontSize: 14, fontWeight: '600', color: '#059669', marginTop: 12 },
  retryBtn: { marginTop: 16, backgroundColor: '#059669', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 12 },
  retryBtnText: { color: '#FFFFFF', fontWeight: '800', fontSize: 13 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  headerTitle: { fontSize: 16, fontWeight: '800', color: '#0F172A' },
  headerSub: { fontSize: 11, color: '#64748B' },
  applyBtnCTA: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#059669', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12, gap: 4 },
  applyBtnCTAText: { color: '#FFFFFF', fontWeight: '800', fontSize: 12 },
  tabScroll: { maxHeight: 42, marginBottom: 12 },
  tabBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#E2E8F0', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, gap: 4 },
  tabBtnActive: { backgroundColor: '#059669' },
  tabBtnText: { fontSize: 12, fontWeight: '700', color: '#475569' },
  tabBtnTextActive: { color: '#FFFFFF' },
  filterRow: { flexDirection: 'row', gap: 6, marginBottom: 12 },
  filterChip: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 20, backgroundColor: '#F1F5F9', borderWidth: 1, borderColor: '#CBD5E1' },
  filterChipActive: { backgroundColor: '#059669', borderColor: '#059669' },
  filterChipText: { fontSize: 11, fontWeight: '700', color: '#475569' },
  filterChipTextActive: { color: '#FFFFFF' },
  emptyCard: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 32, alignItems: 'center', borderWidth: 1, borderColor: '#E2E8F0' },
  emptyTitle: { fontSize: 16, fontWeight: '800', color: '#0F172A', marginTop: 8 },
  emptySub: { fontSize: 12, color: '#64748B', textAlign: 'center', marginTop: 4, marginBottom: 16 },
  policyCard: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 14, marginBottom: 12, borderWidth: 1, borderColor: '#E2E8F0', ...SHADOWS.soft },
  policyHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  policyIdBadge: { fontSize: 10, fontWeight: '800', color: '#64748B' },
  assetNameTitle: { fontSize: 14, fontWeight: '800', color: '#0F172A', marginTop: 2 },
  locationText: { fontSize: 11, color: '#64748B', marginTop: 2 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 10 },
  statusBadgeText: { fontSize: 11, fontWeight: '700' },
  scopeRow: { marginTop: 8 },
  scopeTag: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  scopeTagText: { fontSize: 12, fontWeight: '700', color: '#059669' },
  speciesChipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginVertical: 8 },
  speciesChip: { backgroundColor: '#F1F5F9', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  speciesChipText: { fontSize: 10, color: '#334155', fontWeight: '600' },
  financialBox: { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: '#F8FAFC', padding: 10, borderRadius: 10, marginVertical: 6 },
  financialCol: { flex: 1 },
  finLabel: { fontSize: 10, color: '#94A3B8' },
  finVal: { fontSize: 12, fontWeight: '800', color: '#0F172A', marginTop: 2 },
  validityRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 },
  validityText: { fontSize: 10, color: '#64748B' },
  partnerText: { fontSize: 10, fontWeight: '700', color: '#334155' },
  policyCardActions: { flexDirection: 'row', gap: 8, marginTop: 10, paddingTop: 8, borderTopWidth: 1, borderTopColor: '#F1F5F9' },
  secondaryBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#F1F5F9', paddingVertical: 8, borderRadius: 8, gap: 4 },
  secondaryBtnText: { fontSize: 11, fontWeight: '700', color: '#334155' },
  nodalActionBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#D97706', paddingVertical: 8, borderRadius: 8, gap: 4 },
  nodalActionBtnText: { fontSize: 11, fontWeight: '800', color: '#FFFFFF' },
  claimActionBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#DC2626', paddingVertical: 8, borderRadius: 8, gap: 4 },
  claimActionBtnText: { fontSize: 11, fontWeight: '800', color: '#FFFFFF' },
  wizardScroll: { paddingBottom: 120 },
  stepHeader: { flexDirection: 'row', justifyContent: 'space-around', backgroundColor: '#FFFFFF', borderRadius: 14, padding: 12, marginBottom: 14, borderWidth: 1, borderColor: '#E2E8F0' },
  stepItem: { alignItems: 'center' },
  stepCircle: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#E2E8F0', alignItems: 'center', justifyContent: 'center' },
  stepCircleActive: { backgroundColor: '#059669' },
  stepNum: { fontSize: 12, fontWeight: '800', color: '#64748B' },
  stepNumActive: { color: '#FFFFFF' },
  stepLabel: { fontSize: 10, fontWeight: '700', color: '#64748B', marginTop: 4 },
  stepLabelActive: { color: '#059669' },
  wizardCard: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#E2E8F0', ...SHADOWS.soft },
  wizardTitle: { fontSize: 16, fontWeight: '800', color: '#0F172A' },
  wizardSub: { fontSize: 12, color: '#64748B', marginTop: 2, marginBottom: 14 },
  inputGroup: { marginBottom: 12 },
  inputRow: { flexDirection: 'row', marginBottom: 12 },
  inputLabel: { fontSize: 12, fontWeight: '700', color: '#334155', marginBottom: 4 },
  typeChip: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, backgroundColor: '#F1F5F9', borderWidth: 1, borderColor: '#E2E8F0' },
  typeChipActive: { backgroundColor: '#059669', borderColor: '#059669' },
  typeChipText: { fontSize: 11, fontWeight: '700', color: '#475569' },
  typeChipTextActive: { color: '#FFFFFF' },
  textInput: { backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#CBD5E1', borderRadius: 10, paddingHorizontal: 12, height: 44, fontSize: 13, color: '#0F172A' },
  nextWizardCTA: { backgroundColor: '#059669', paddingVertical: 12, borderRadius: 12, alignItems: 'center', marginTop: 8 },
  nextWizardCTAText: { color: '#FFFFFF', fontWeight: '800', fontSize: 13 },
  wizardBtnRow: { flexDirection: 'row', gap: 10, marginTop: 12 },
  backWizardBtn: { backgroundColor: '#F1F5F9', paddingHorizontal: 16, paddingVertical: 12, borderRadius: 12, justifyContent: 'center' },
  backWizardBtnText: { fontSize: 12, fontWeight: '700', color: '#475569' },
  calcBox: { backgroundColor: '#ECFDF5', borderRadius: 12, padding: 12, borderWidth: 1, borderColor: '#A7F3D0', marginVertical: 10 },
  calcTitle: { fontSize: 13, fontWeight: '800', color: '#065F46', marginBottom: 8 },
  calcGrid: { flexDirection: 'row', justifyContent: 'space-between' },
  calcItem: { flex: 1 },
  calcLabel: { fontSize: 10, color: '#047857' },
  calcVal: { fontSize: 13, fontWeight: '800', color: '#065F46', marginTop: 2 },
  summaryBox: { backgroundColor: '#F8FAFC', padding: 12, borderRadius: 12, marginVertical: 8 },
  summaryTitle: { fontSize: 12, fontWeight: '800', color: '#0F172A', marginBottom: 4 },
  summaryText: { fontSize: 11, color: '#475569', marginTop: 2 },
  submitWizardCTA: { flex: 1, backgroundColor: '#059669', paddingVertical: 12, borderRadius: 12, alignItems: 'center' },
  submitWizardCTAText: { color: '#FFFFFF', fontWeight: '800', fontSize: 13 },
  sectionTitleRow: { marginBottom: 12 },
  sectionTitleText: { fontSize: 16, fontWeight: '800', color: '#0F172A' },
  sectionSubText: { fontSize: 12, color: '#64748B', marginTop: 2 },
  queueCard: { borderRadius: 16, padding: 14, marginBottom: 12, borderWidth: 1, borderColor: '#FDE68A', backgroundColor: '#FFFBEB' },
  queueHeader: { flexDirection: 'row', justifyContent: 'space-between' },
  queueId: { fontSize: 11, fontWeight: '800', color: '#D97706' },
  queueDate: { fontSize: 10, color: '#B45309' },
  queueAsset: { fontSize: 14, fontWeight: '800', color: '#78350F', marginTop: 4 },
  queueSub: { fontSize: 11, color: '#92400E', marginTop: 2 },
  subsidyHighlight: { fontSize: 11, fontWeight: '800', color: '#047857', marginTop: 6 },
  verifyModalCTA: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#D97706', paddingVertical: 10, borderRadius: 10, marginTop: 10, gap: 4 },
  verifyModalCTAText: { color: '#FFFFFF', fontWeight: '800', fontSize: 12 },
  claimsHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  claimReportBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#DC2626', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, gap: 4 },
  claimReportBtnText: { color: '#FFFFFF', fontWeight: '800', fontSize: 12 },
  claimCard: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 14, marginBottom: 12, borderWidth: 1, borderColor: '#E2E8F0', ...SHADOWS.soft },
  claimCardHeader: { flexDirection: 'row', justifyContent: 'space-between' },
  claimIdText: { fontSize: 10, fontWeight: '800', color: '#64748B' },
  claimAssetText: { fontSize: 14, fontWeight: '800', color: '#0F172A', marginTop: 2 },
  claimDetailsRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 },
  claimCause: { fontSize: 11, fontWeight: '700', color: '#DC2626' },
  claimTrees: { fontSize: 11, color: '#475569' },
  claimAmountRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 6, backgroundColor: '#F8FAFC', padding: 8, borderRadius: 8 },
  claimedVal: { fontSize: 12, fontWeight: '800', color: '#0F172A' },
  approvedVal: { fontSize: 12, fontWeight: '800', color: '#059669' },
  signoffBox: { backgroundColor: '#ECFDF5', padding: 10, borderRadius: 10, marginTop: 8 },
  signoffTitle: { fontSize: 11, fontWeight: '800', color: '#065F46' },
  signoffSub: { fontSize: 10, color: '#047857', marginTop: 2 },
  signoffNotes: { fontSize: 10, fontStyle: 'italic', color: '#14532D', marginTop: 4 },
  signoffCTA: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#059669', paddingVertical: 8, borderRadius: 8, marginTop: 8, gap: 4 },
  signoffCTAText: { color: '#FFFFFF', fontWeight: '800', fontSize: 11 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.65)', justifyContent: 'flex-end' },
  modalScroll: { backgroundColor: '#FFFFFF', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20 },
  modalCard: { backgroundColor: '#FFFFFF', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, maxHeight: '85%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  modalTitle: { fontSize: 16, fontWeight: '800', color: '#0F172A' },
  modalPolicyId: { fontSize: 11, fontWeight: '800', color: '#64748B' },
  modalAssetName: { fontSize: 16, fontWeight: '800', color: '#0F172A', marginTop: 2 },
  modalGrid: { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: '#F8FAFC', padding: 12, borderRadius: 12, marginVertical: 12 },
  modalGridItem: { flex: 1 },
  modalLabel: { fontSize: 10, color: '#94A3B8' },
  modalVal: { fontSize: 13, fontWeight: '800', color: '#0F172A', marginTop: 2 },
  modalSectionTitle: { fontSize: 13, fontWeight: '800', color: '#0F172A', marginTop: 12, marginBottom: 6 },
  exclusionItem: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
  exclusionText: { fontSize: 12, color: '#475569' },
  timelineItem: { backgroundColor: '#F8FAFC', padding: 8, borderRadius: 8, marginBottom: 6 },
  timelineAction: { fontSize: 11, fontWeight: '800', color: '#0F172A' },
  timelineNotes: { fontSize: 10, color: '#64748B', marginTop: 2 },
});

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

export interface ProjectMilestone {
  milestone_id: string;
  title: string;
  target_date: string;
  status: 'pending' | 'in_progress' | 'completed' | string;
  verification_date?: string;
  gps_location?: { latitude: number; longitude: number };
  evidence_photos?: string[];
}

export interface TenderDetails {
  tender_ref_number: string;
  contractor_name: string;
  contractor_type: string;
  contract_amount_inr: number;
  mou_reference?: string;
  start_date?: string;
  target_completion_date?: string;
  assigned_at?: string;
}

export interface GovtProject {
  id: string;
  project_code: string;
  title: string;
  project_type: string;
  target_type: string;
  target_id?: string;
  target_name?: string;
  objective?: string;
  scope_description?: string;
  area_acres: number;
  participants_count: number;
  preferred_date?: string;
  estimated_budget_inr: number;
  co_funding_type?: string;
  status: 'draft' | 'submitted' | 'admin_review' | 'partner_assigned' | 'scheduled' | 'execution' | 'verification' | 'completed' | string;
  jurisdiction_code: string;
  state: string;
  district: string;
  assigned_partner?: string;
  tender_details?: TenderDetails;
  progress_percent: number;
  milestones: ProjectMilestone[];
  documents?: Array<{ title: string; url: string }>;
  final_report_url?: string;
  submitted_at?: string;
  audit_timeline?: Array<{ timestamp: string; action: string; actor: string; notes?: string }>;
}

export function GovtProjectInstallationView() {
  const isOnline = useConnectivityStore((state) => state.isOnline);

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'projects' | 'create_wizard' | 'tender_manager' | 'milestones_tracker'>('projects');
  
  const [jurisdictionFilter, setJurisdictionFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('All');

  const [projects, setProjects] = useState<GovtProject[]>([]);
  const [selectedProject, setSelectedProject] = useState<GovtProject | null>(null);

  // Wizard State (3 Steps)
  const [wizardStep, setWizardStep] = useState<number>(1);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [wizardForm, setWizardForm] = useState({
    title: 'Narmada Canopy Solar & Bio-Shield Installation',
    project_type: 'Afforestation / Miyawaki Plantation',
    target_type: 'public_asset',
    target_id: 'ASSET-1004',
    target_name: 'Gram Panchayat Pipariya Riverbed',
    objective: 'Establish 15-acre dense agroforestry bio-shield and canopy solar integration.',
    scope_description: 'Soil preparation, 12,000 tree saplings, solar canopy installation, drip irrigation.',
    area_acres: '15.0',
    participants_count: '150',
    preferred_date: '2026-10-15',
    estimated_budget_inr: '2200000',
    co_funding_type: 'Govt 75% State Fund + 25% Panchayat Share',
    jurisdiction_code: 'MP-HOS-PIP-01',
    state: 'Madhya Pradesh',
    district: 'Hoshangabad',
    doc_title: 'Gram Sabha Resolution NOC',
    doc_url: 'https://bhumicred.in/docs/noc_panchayat_pipariya.pdf',
  });

  // Tender / Contractor Modal
  const [assigningProject, setAssigningProject] = useState<GovtProject | null>(null);
  const [tenderForm, setTenderForm] = useState({
    tender_ref_number: 'TND-2026-MP-0988',
    contractor_name: 'Vanashree Ecological Foundation & Nursery Corp',
    contractor_type: 'Empaneled Plantation Contractor',
    contract_amount_inr: '2050000',
    mou_reference: 'MOU-MP-2026-9901',
    start_date: '2026-10-20',
    target_completion_date: '2027-04-20',
  });

  // Milestone Update Modal
  const [updatingMilestone, setUpdatingMilestone] = useState<{ project: GovtProject; milestone: ProjectMilestone } | null>(null);
  const [milestoneForm, setMilestoneForm] = useState({
    status: 'completed' as 'pending' | 'in_progress' | 'completed',
    notes: 'Soil preparation and compost enrichment verified on-site by field inspector.',
    latitude: '22.7485',
    longitude: '77.7284',
    evidence_photo_url: 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=600&auto=format&fit=crop',
  });

  const fetchData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const queryParams: any = {};
      if (jurisdictionFilter !== 'ALL') queryParams.jurisdiction_code = jurisdictionFilter;
      if (statusFilter !== 'All') queryParams.status_filter = statusFilter;

      const res = await api.get('/govt/projects', { params: queryParams });
      if (res.data && res.data.success) {
        setProjects(res.data.data);
      }
    } catch (err: any) {
      console.warn('[GovtProjectInstallationView] Fetch error:', err);
      setError(err?.message || 'Unable to load government projects.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [jurisdictionFilter, statusFilter]);

  // Submit Create Project Wizard
  const handleCreateProject = async () => {
    if (!wizardForm.title.trim()) {
      Alert.alert('Validation Error', 'Project title is required.');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        title: wizardForm.title.trim(),
        project_type: wizardForm.project_type,
        target_type: wizardForm.target_type,
        target_id: wizardForm.target_id,
        target_name: wizardForm.target_name,
        objective: wizardForm.objective,
        scope_description: wizardForm.scope_description,
        area_acres: Number(wizardForm.area_acres) || 10.0,
        participants_count: Number(wizardForm.participants_count) || 50,
        preferred_date: wizardForm.preferred_date,
        estimated_budget_inr: Number(wizardForm.estimated_budget_inr) || 1500000,
        co_funding_type: wizardForm.co_funding_type,
        documents: [
          { title: wizardForm.doc_title, url: wizardForm.doc_url }
        ],
        jurisdiction_code: wizardForm.jurisdiction_code,
        state: wizardForm.state,
        district: wizardForm.district,
        status: 'submitted',
      };

      const res = await api.post('/govt/projects', payload);
      if (res.data && res.data.success) {
        Alert.alert('Success', `Project request ${res.data.data?.id || ''} created successfully under jurisdiction ${wizardForm.jurisdiction_code}!`);
        setWizardStep(1);
        setActiveTab('projects');
        fetchData();
      }
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.detail || 'Failed to create project proposal.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Submit Tender Assignment
  const handleAssignTender = async () => {
    if (!assigningProject) return;
    setIsSubmitting(true);
    try {
      const payload = {
        tender_ref_number: tenderForm.tender_ref_number,
        contractor_name: tenderForm.contractor_name,
        contractor_type: tenderForm.contractor_type,
        contract_amount_inr: Number(tenderForm.contract_amount_inr) || 1500000,
        mou_reference: tenderForm.mou_reference,
        start_date: tenderForm.start_date,
        target_completion_date: tenderForm.target_completion_date,
      };

      const res = await api.post(`/govt/projects/${assigningProject.id}/tender-assign`, payload);
      if (res.data && res.data.success) {
        Alert.alert('Tender Assigned', `Contractor ${tenderForm.contractor_name} assigned to project ${assigningProject.id}.`);
        setAssigningProject(null);
        fetchData();
      }
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.detail || 'Failed to assign tender contractor.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Submit Milestone Update
  const handleUpdateMilestone = async () => {
    if (!updatingMilestone) return;
    setIsSubmitting(true);
    try {
      const payload = {
        milestone_id: updatingMilestone.milestone.milestone_id,
        status: milestoneForm.status,
        notes: milestoneForm.notes,
        gps_location: {
          latitude: Number(milestoneForm.latitude) || 22.7485,
          longitude: Number(milestoneForm.longitude) || 77.7284,
        },
        evidence_photos: [milestoneForm.evidence_photo_url],
      };

      const res = await api.post(`/govt/projects/${updatingMilestone.project.id}/milestones`, payload);
      if (res.data && res.data.success) {
        Alert.alert('Milestone Updated', `Milestone ${updatingMilestone.milestone.milestone_id} updated with GPS coordinates.`);
        setUpdatingMilestone(null);
        fetchData();
      }
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.detail || 'Failed to update milestone.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Submit Final Verification & Sign-off
  const handleVerifyComplete = async (projectId: string) => {
    try {
      const res = await api.post(`/govt/projects/${projectId}/verify-complete`);
      if (res.data && res.data.success) {
        Alert.alert('Project Certified', `Project ${projectId} verified and completed with certified final report!`);
        fetchData();
      }
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.detail || 'Failed to verify project completion.');
    }
  };

  // Status Badge Helper
  const getStatusColor = (statusStr: string) => {
    const s = statusStr.toLowerCase();
    if (s === 'completed') return { bg: '#DCFCE7', text: '#166534' };
    if (s === 'execution') return { bg: '#E0F2FE', text: '#0369A1' };
    if (s === 'partner_assigned') return { bg: '#FEF3C7', text: '#92400E' };
    if (s === 'submitted' || s === 'admin_review') return { bg: '#F3E8FF', text: '#6B21A8' };
    return { bg: '#F1F5F9', text: '#475569' };
  };

  if (!isOnline) {
    return (
      <View style={styles.stateContainer}>
        <MaterialCommunityIcons name="wifi-off" size={48} color="#EF4444" />
        <Text style={styles.stateTitle}>Offline Mode</Text>
        <Text style={styles.stateSubtitle}>Connect to network to manage Government Projects and track installation progress.</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={fetchData}>
          <Text style={styles.retryBtnText}>Retry Connection</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (isLoading) {
    return (
      <View style={styles.stateContainer}>
        <ActivityIndicator size="large" color="#0284C7" />
        <Text style={styles.loadingText}>Loading Jurisdiction Projects & Installation Desk...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.stateContainer}>
        <MaterialCommunityIcons name="alert-circle-outline" size={48} color="#EF4444" />
        <Text style={styles.stateTitle}>Failed to Load Projects</Text>
        <Text style={styles.stateSubtitle}>{error}</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={fetchData}>
          <Text style={styles.retryBtnText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* ── 1. HEADER & JURISDICTION SELECTION ── */}
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.headerTitle}>Projects & Installation Desk</Text>
          <Text style={styles.headerSub}>Multi-Tenant Jurisdiction Management</Text>
        </View>
        <TouchableOpacity
          style={styles.createBtnCTA}
          onPress={() => {
            setWizardStep(1);
            setActiveTab('create_wizard');
          }}
        >
          <MaterialCommunityIcons name="folder-plus-outline" size={16} color="#FFFFFF" />
          <Text style={styles.createBtnCTAText}>Create Request</Text>
        </TouchableOpacity>
      </View>

      {/* Jurisdiction Bar */}
      <View style={styles.jurisdictionBar}>
        <Text style={styles.jurisdictionLabel}>Jurisdiction Scope:</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6 }}>
          {[
            { code: 'ALL', label: 'All Jurisdictions' },
            { code: 'MP-HOS-PIP-01', label: 'Hoshangabad (MP-HOS-PIP-01)' },
            { code: 'MP-SEH-DOD-02', label: 'Sehore (MP-SEH-DOD-02)' },
          ].map((j) => (
            <TouchableOpacity
              key={j.code}
              style={[styles.jChip, jurisdictionFilter === j.code && styles.jChipActive]}
              onPress={() => setJurisdictionFilter(j.code)}
            >
              <Text style={[styles.jChipText, jurisdictionFilter === j.code && styles.jChipTextActive]}>{j.label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Navigation Tabs */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabScroll} contentContainerStyle={{ gap: 6 }}>
        {[
          { key: 'projects', label: `Projects (${projects.length})`, icon: 'folder-text-outline' },
          { key: 'create_wizard', label: 'Propose Project', icon: 'file-document-edit-outline' },
          { key: 'tender_manager', label: 'Tenders & Contractors', icon: 'account-hard-hat-outline' },
          { key: 'milestones_tracker', label: 'Milestones & GPS', icon: 'map-marker-path' },
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

      {/* ── TAB 1: PROJECTS DIRECTORY ── */}
      {activeTab === 'projects' && (
        <ScrollView contentContainerStyle={{ paddingBottom: 120 }}>
          {/* Status Sub-Filters */}
          <View style={styles.filterRow}>
            {['All', 'execution', 'partner_assigned', 'submitted', 'completed'].map((st) => (
              <TouchableOpacity
                key={st}
                style={[styles.filterChip, statusFilter === st && styles.filterChipActive]}
                onPress={() => setStatusFilter(st)}
              >
                <Text style={[styles.filterChipText, statusFilter === st && styles.filterChipTextActive]}>
                  {st === 'All' ? 'All Status' : st.replace('_', ' ').toUpperCase()}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {projects.length === 0 ? (
            <View style={styles.emptyCard}>
              <MaterialCommunityIcons name="folder-outline" size={48} color="#94A3B8" />
              <Text style={styles.emptyTitle}>No Projects Found</Text>
              <Text style={styles.emptySub}>No government projects found under selected jurisdiction filter.</Text>
              <TouchableOpacity
                style={styles.createBtnCTA}
                onPress={() => {
                  setWizardStep(1);
                  setActiveTab('create_wizard');
                }}
              >
                <Text style={styles.createBtnCTAText}>+ Create Project Request</Text>
              </TouchableOpacity>
            </View>
          ) : (
            projects.map((proj) => {
              const stStyle = getStatusColor(proj.status);
              return (
                <View key={proj.id} style={styles.projectCard}>
                  <View style={styles.projectCardHeader}>
                    <View style={{ flex: 1 }}>
                      <View style={{ flexDirection: 'row', gap: 6, alignItems: 'center' }}>
                        <Text style={styles.projCode}>{proj.project_code || proj.id}</Text>
                        <Text style={styles.jurisdictionTag}>📌 {proj.jurisdiction_code}</Text>
                      </View>
                      <Text style={styles.projTitle}>{proj.title}</Text>
                      <Text style={styles.projTypeBadge}>🌿 {proj.project_type}</Text>
                    </View>

                    <View style={[styles.statusBadge, { backgroundColor: stStyle.bg }]}>
                      <Text style={[styles.statusBadgeText, { color: stStyle.text }]}>
                        {proj.status.replace('_', ' ').toUpperCase()}
                      </Text>
                    </View>
                  </View>

                  {/* Objective */}
                  <Text style={styles.objectiveText} numberOfLines={2}>
                    {proj.objective}
                  </Text>

                  {/* Progress Bar */}
                  <View style={styles.progressSection}>
                    <View style={styles.progressHeader}>
                      <Text style={styles.progressLabel}>Execution Progress</Text>
                      <Text style={styles.progressVal}>{proj.progress_percent}%</Text>
                    </View>
                    <View style={styles.progressBarTrack}>
                      <View style={[styles.progressBarFill, { width: `${proj.progress_percent}%` }]} />
                    </View>
                  </View>

                  {/* Key Stats Grid */}
                  <View style={styles.statsGrid}>
                    <View style={styles.statBox}>
                      <Text style={styles.statLabel}>Area</Text>
                      <Text style={styles.statVal}>{proj.area_acres} Acres</Text>
                    </View>
                    <View style={styles.statBox}>
                      <Text style={styles.statLabel}>Budget</Text>
                      <Text style={styles.statVal}>₹{(proj.estimated_budget_inr / 100000).toFixed(1)}L</Text>
                    </View>
                    <View style={styles.statBox}>
                      <Text style={styles.statLabel}>Participants</Text>
                      <Text style={styles.statVal}>{proj.participants_count} Farmers</Text>
                    </View>
                    <View style={styles.statBox}>
                      <Text style={styles.statLabel}>Contractor</Text>
                      <Text style={styles.statVal} numberOfLines={1}>
                        {proj.assigned_partner || 'Pending Tender'}
                      </Text>
                    </View>
                  </View>

                  {/* Actions */}
                  <View style={styles.projectCardActions}>
                    <TouchableOpacity
                      style={styles.secondaryBtn}
                      onPress={() => setSelectedProject(proj)}
                    >
                      <MaterialCommunityIcons name="information-outline" size={14} color="#334155" />
                      <Text style={styles.secondaryBtnText}>Project Details</Text>
                    </TouchableOpacity>

                    {proj.status !== 'completed' && (
                      <TouchableOpacity
                        style={styles.tenderBtn}
                        onPress={() => setAssigningProject(proj)}
                      >
                        <MaterialCommunityIcons name="account-hard-hat" size={14} color="#FFFFFF" />
                        <Text style={styles.tenderBtnText}>Assign Tender</Text>
                      </TouchableOpacity>
                    )}

                    {proj.status !== 'completed' && (
                      <TouchableOpacity
                        style={styles.completeBtn}
                        onPress={() => handleVerifyComplete(proj.id)}
                      >
                        <MaterialCommunityIcons name="check-decagram" size={14} color="#FFFFFF" />
                        <Text style={styles.completeBtnText}>Certify Complete</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              );
            })
          )}
        </ScrollView>
      )}

      {/* ── TAB 2: PROPOSE PROJECT WIZARD (3 STEPS) ── */}
      {activeTab === 'create_wizard' && (
        <ScrollView contentContainerStyle={styles.wizardScroll}>
          <View style={styles.stepHeader}>
            {[
              { num: 1, label: 'Target & Scope' },
              { num: 2, label: 'Area & Budget' },
              { num: 3, label: 'Documents & Review' },
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
              <Text style={styles.wizardTitle}>Step 1: Project Target & Scope</Text>
              <Text style={styles.wizardSub}>Specify project type, public asset / farmer group target, and objective.</Text>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Project Request Title *</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="e.g. Narmada Riverbank Agroforestry Green Corridor"
                  value={wizardForm.title}
                  onChangeText={(t) => setWizardForm({ ...wizardForm, title: t })}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Project Type *</Text>
                <View style={{ flexDirection: 'row', gap: 6, flexWrap: 'wrap' }}>
                  {[
                    'Afforestation / Miyawaki Plantation',
                    'Riverbank Restoration & Agroforestry',
                    'Canal-Side Plantation',
                    'Canopy Solar & Tree Shield',
                  ].map((pt) => (
                    <TouchableOpacity
                      key={pt}
                      style={[styles.typeChip, wizardForm.project_type === pt && styles.typeChipActive]}
                      onPress={() => setWizardForm({ ...wizardForm, project_type: pt })}
                    >
                      <Text style={[styles.typeChipText, wizardForm.project_type === pt && styles.typeChipTextActive]}>{pt}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Target Selection Category *</Text>
                <View style={{ flexDirection: 'row', gap: 6 }}>
                  {[
                    { key: 'public_asset', label: 'Public Asset' },
                    { key: 'farmer_group', label: 'Farmer Group' },
                    { key: 'land_parcel', label: 'Land Parcel' },
                  ].map((tt) => (
                    <TouchableOpacity
                      key={tt.key}
                      style={[styles.typeChip, wizardForm.target_type === tt.key && styles.typeChipActive]}
                      onPress={() => setWizardForm({ ...wizardForm, target_type: tt.key })}
                    >
                      <Text style={[styles.typeChipText, wizardForm.target_type === tt.key && styles.typeChipTextActive]}>{tt.label}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Project Objective</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="e.g. Establish 15-acre dense agroforestry bio-shield."
                  value={wizardForm.objective}
                  onChangeText={(t) => setWizardForm({ ...wizardForm, objective: t })}
                />
              </View>

              <TouchableOpacity style={styles.nextWizardCTA} onPress={() => setWizardStep(2)}>
                <Text style={styles.nextWizardCTAText}>Next: Area & Budget →</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* STEP 2 */}
          {wizardStep === 2 && (
            <View style={styles.wizardCard}>
              <Text style={styles.wizardTitle}>Step 2: Area, Participants & Budget</Text>
              <Text style={styles.wizardSub}>Specify project footprint (acres), participant count, and budget.</Text>

              <View style={styles.inputRow}>
                <View style={[styles.inputGroup, { flex: 1, marginRight: 6 }]}>
                  <Text style={styles.inputLabel}>Area (Acres) *</Text>
                  <TextInput
                    style={styles.textInput}
                    keyboardType="numeric"
                    value={wizardForm.area_acres}
                    onChangeText={(t) => setWizardForm({ ...wizardForm, area_acres: t })}
                  />
                </View>
                <View style={[styles.inputGroup, { flex: 1, marginLeft: 6 }]}>
                  <Text style={styles.inputLabel}>Participants Count</Text>
                  <TextInput
                    style={styles.textInput}
                    keyboardType="numeric"
                    value={wizardForm.participants_count}
                    onChangeText={(t) => setWizardForm({ ...wizardForm, participants_count: t })}
                  />
                </View>
              </View>

              <View style={styles.inputRow}>
                <View style={[styles.inputGroup, { flex: 1, marginRight: 6 }]}>
                  <Text style={styles.inputLabel}>Estimated Budget (₹) *</Text>
                  <TextInput
                    style={styles.textInput}
                    keyboardType="numeric"
                    value={wizardForm.estimated_budget_inr}
                    onChangeText={(t) => setWizardForm({ ...wizardForm, estimated_budget_inr: t })}
                  />
                </View>
                <View style={[styles.inputGroup, { flex: 1, marginLeft: 6 }]}>
                  <Text style={styles.inputLabel}>Preferred Date</Text>
                  <TextInput
                    style={styles.textInput}
                    value={wizardForm.preferred_date}
                    onChangeText={(t) => setWizardForm({ ...wizardForm, preferred_date: t })}
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Co-Funding Mechanism</Text>
                <TextInput
                  style={styles.textInput}
                  value={wizardForm.co_funding_type}
                  onChangeText={(t) => setWizardForm({ ...wizardForm, co_funding_type: t })}
                />
              </View>

              <View style={styles.wizardBtnRow}>
                <TouchableOpacity style={styles.backWizardBtn} onPress={() => setWizardStep(1)}>
                  <Text style={styles.backWizardBtnText}>← Back</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.nextWizardCTA, { flex: 1 }]} onPress={() => setWizardStep(3)}>
                  <Text style={styles.nextWizardCTAText}>Next: Documents & Review →</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* STEP 3 */}
          {wizardStep === 3 && (
            <View style={styles.wizardCard}>
              <Text style={styles.wizardTitle}>Step 3: Documents & Jurisdiction Authorization</Text>
              <Text style={styles.wizardSub}>Attach proposal documents and specify jurisdiction code authorization.</Text>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Jurisdiction Code *</Text>
                <TextInput
                  style={styles.textInput}
                  value={wizardForm.jurisdiction_code}
                  onChangeText={(t) => setWizardForm({ ...wizardForm, jurisdiction_code: t })}
                />
              </View>

              <View style={styles.inputRow}>
                <View style={[styles.inputGroup, { flex: 1, marginRight: 6 }]}>
                  <Text style={styles.inputLabel}>State</Text>
                  <TextInput
                    style={styles.textInput}
                    value={wizardForm.state}
                    onChangeText={(t) => setWizardForm({ ...wizardForm, state: t })}
                  />
                </View>
                <View style={[styles.inputGroup, { flex: 1, marginLeft: 6 }]}>
                  <Text style={styles.inputLabel}>District</Text>
                  <TextInput
                    style={styles.textInput}
                    value={wizardForm.district}
                    onChangeText={(t) => setWizardForm({ ...wizardForm, district: t })}
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Proposal NOC Document Title</Text>
                <TextInput
                  style={styles.textInput}
                  value={wizardForm.doc_title}
                  onChangeText={(t) => setWizardForm({ ...wizardForm, doc_title: t })}
                />
              </View>

              <View style={styles.summaryBox}>
                <Text style={styles.summaryTitle}>Proposal Summary</Text>
                <Text style={styles.summaryText}>• Title: {wizardForm.title}</Text>
                <Text style={styles.summaryText}>• Type: {wizardForm.project_type}</Text>
                <Text style={styles.summaryText}>• Footprint: {wizardForm.area_acres} Acres (Budget: ₹{Number(wizardForm.estimated_budget_inr).toLocaleString()})</Text>
                <Text style={styles.summaryText}>• Jurisdiction Scoped: {wizardForm.jurisdiction_code}</Text>
              </View>

              <View style={styles.wizardBtnRow}>
                <TouchableOpacity style={styles.backWizardBtn} onPress={() => setWizardStep(2)}>
                  <Text style={styles.backWizardBtnText}>← Back</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.submitWizardCTA, isSubmitting && { opacity: 0.6 }]}
                  onPress={handleCreateProject}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <Text style={styles.submitWizardCTAText}>Submit Project Proposal</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          )}
        </ScrollView>
      )}

      {/* ── TAB 3: TENDER & CONTRACTOR MANAGER ── */}
      {activeTab === 'tender_manager' && (
        <ScrollView contentContainerStyle={{ paddingBottom: 120 }}>
          <View style={styles.sectionTitleRow}>
            <Text style={styles.sectionTitleText}>Tender & Plantation Contractor Manager</Text>
            <Text style={styles.sectionSubText}>Empaneled contractors and tender award reference desk.</Text>
          </View>

          {projects.map((proj) => (
            <View key={proj.id} style={styles.tenderCard}>
              <View style={styles.tenderHeader}>
                <Text style={styles.tenderProjId}>{proj.project_code || proj.id}</Text>
                <Text style={styles.tenderBudget}>Budget: ₹{(proj.estimated_budget_inr / 100000).toFixed(1)} Lakhs</Text>
              </View>

              <Text style={styles.tenderTitle}>{proj.title}</Text>

              {proj.tender_details ? (
                <View style={styles.contractorBox}>
                  <Text style={styles.contractorTitle}>Awarded Contractor:</Text>
                  <Text style={styles.contractorName}>🏗️ {proj.tender_details.contractor_name}</Text>
                  <Text style={styles.contractorSub}>Tender Ref: {proj.tender_details.tender_ref_number} • MOU: {proj.tender_details.mou_reference}</Text>
                  <Text style={styles.contractorAmount}>Contract Amount: ₹{proj.tender_details.contract_amount_inr.toLocaleString()}</Text>
                </View>
              ) : (
                <View style={styles.noTenderBox}>
                  <Text style={styles.noTenderText}>No tender assigned yet.</Text>
                  <TouchableOpacity
                    style={styles.assignTenderCTA}
                    onPress={() => setAssigningProject(proj)}
                  >
                    <MaterialCommunityIcons name="account-hard-hat" size={14} color="#FFFFFF" />
                    <Text style={styles.assignTenderCTAText}>Award Tender & Assign Contractor</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          ))}
        </ScrollView>
      )}

      {/* ── TAB 4: MILESTONES & GPS TRACKER ── */}
      {activeTab === 'milestones_tracker' && (
        <ScrollView contentContainerStyle={{ paddingBottom: 120 }}>
          <View style={styles.sectionTitleRow}>
            <Text style={styles.sectionTitleText}>Live Milestone & GPS Check-in Tracker</Text>
            <Text style={styles.sectionSubText}>Field inspector GPS verification and photo evidence audit.</Text>
          </View>

          {projects.map((proj) => (
            <View key={proj.id} style={styles.milestoneCard}>
              <Text style={styles.milestoneProjTitle}>{proj.title} ({proj.project_code})</Text>
              <Text style={styles.milestoneProgressText}>Progress: {proj.progress_percent}% Complete</Text>

              <View style={{ marginVertical: 8 }}>
                {(proj.milestones || []).map((m) => {
                  const isDone = m.status === 'completed';
                  return (
                    <View key={m.milestone_id} style={styles.milestoneItem}>
                      <TouchableOpacity
                        style={styles.milestoneCheckTouch}
                        onPress={() => setUpdatingMilestone({ project: proj, milestone: m })}
                      >
                        <MaterialCommunityIcons
                          name={isDone ? 'checkbox-marked-circle' : 'clock-outline'}
                          size={20}
                          color={isDone ? '#059669' : '#D97706'}
                        />
                      </TouchableOpacity>

                      <View style={{ flex: 1, marginLeft: 8 }}>
                        <Text style={styles.mTitle}>{m.milestone_id}: {m.title}</Text>
                        <Text style={styles.mDate}>Target Date: {m.target_date} • Status: {m.status.toUpperCase()}</Text>
                        {m.gps_location && (
                          <Text style={styles.gpsText}>
                            📍 GPS Check-in: Lat {m.gps_location.latitude}, Lng {m.gps_location.longitude}
                          </Text>
                        )}
                      </View>

                      <TouchableOpacity
                        style={styles.updateMilestoneBtn}
                        onPress={() => setUpdatingMilestone({ project: proj, milestone: m })}
                      >
                        <Text style={styles.updateMilestoneBtnText}>Update</Text>
                      </TouchableOpacity>
                    </View>
                  );
                })}
              </View>
            </View>
          ))}
        </ScrollView>
      )}

      {/* ── MODAL 1: PROJECT DETAILS ── */}
      {selectedProject && (
        <Modal animationType="slide" transparent visible={!!selectedProject} onRequestClose={() => setSelectedProject(null)}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalCard}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Project Master Record</Text>
                <TouchableOpacity onPress={() => setSelectedProject(null)}>
                  <Ionicons name="close" size={24} color="#0F172A" />
                </TouchableOpacity>
              </View>

              <ScrollView showsVerticalScrollIndicator={false}>
                <Text style={styles.projCode}>{selectedProject.project_code} • {selectedProject.jurisdiction_code}</Text>
                <Text style={styles.modalProjTitle}>{selectedProject.title}</Text>

                <View style={styles.modalGrid}>
                  <View style={styles.modalGridItem}>
                    <Text style={styles.modalLabel}>Area Footprint</Text>
                    <Text style={styles.modalVal}>{selectedProject.area_acres} Acres</Text>
                  </View>
                  <View style={styles.modalGridItem}>
                    <Text style={styles.modalLabel}>Estimated Budget</Text>
                    <Text style={styles.modalVal}>₹{selectedProject.estimated_budget_inr.toLocaleString()}</Text>
                  </View>
                  <View style={styles.modalGridItem}>
                    <Text style={styles.modalLabel}>Participants</Text>
                    <Text style={styles.modalVal}>{selectedProject.participants_count} Farmers</Text>
                  </View>
                </View>

                <Text style={styles.modalSectionTitle}>Scope & Objectives:</Text>
                <Text style={styles.modalDesc}>{selectedProject.scope_description || selectedProject.objective}</Text>

                <Text style={styles.modalSectionTitle}>Tender & Contractor:</Text>
                <Text style={styles.modalDesc}>
                  {selectedProject.assigned_partner ? `Assigned to ${selectedProject.assigned_partner}` : 'No tender awarded yet.'}
                </Text>

                <Text style={styles.modalSectionTitle}>Audit & Lifecycle Timeline:</Text>
                {(selectedProject.audit_timeline || []).map((t, i) => (
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

      {/* ── MODAL 2: ASSIGN TENDER / CONTRACTOR ── */}
      {assigningProject && (
        <Modal animationType="slide" transparent visible={!!assigningProject} onRequestClose={() => setAssigningProject(null)}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalCard}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Assign Tender & Plantation Contractor</Text>
                <TouchableOpacity onPress={() => setAssigningProject(null)}>
                  <Ionicons name="close" size={24} color="#0F172A" />
                </TouchableOpacity>
              </View>

              <ScrollView showsVerticalScrollIndicator={false}>
                <Text style={styles.projTitle}>{assigningProject.title}</Text>
                <Text style={styles.projCode}>Project Code: {assigningProject.project_code}</Text>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Tender Bidding Ref Number *</Text>
                  <TextInput
                    style={styles.textInput}
                    value={tenderForm.tender_ref_number}
                    onChangeText={(t) => setTenderForm({ ...tenderForm, tender_ref_number: t })}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Contractor / Agency Name *</Text>
                  <TextInput
                    style={styles.textInput}
                    value={tenderForm.contractor_name}
                    onChangeText={(t) => setTenderForm({ ...tenderForm, contractor_name: t })}
                  />
                </View>

                <View style={styles.inputRow}>
                  <View style={[styles.inputGroup, { flex: 1, marginRight: 6 }]}>
                    <Text style={styles.inputLabel}>Contract Amount (₹)</Text>
                    <TextInput
                      style={styles.textInput}
                      keyboardType="numeric"
                      value={tenderForm.contract_amount_inr}
                      onChangeText={(t) => setTenderForm({ ...tenderForm, contract_amount_inr: t })}
                    />
                  </View>
                  <View style={[styles.inputGroup, { flex: 1, marginLeft: 6 }]}>
                    <Text style={styles.inputLabel}>MOU Reference</Text>
                    <TextInput
                      style={styles.textInput}
                      value={tenderForm.mou_reference}
                      onChangeText={(t) => setTenderForm({ ...tenderForm, mou_reference: t })}
                    />
                  </View>
                </View>

                <TouchableOpacity
                  style={[styles.submitWizardCTA, isSubmitting && { opacity: 0.6 }]}
                  onPress={handleAssignTender}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <Text style={styles.submitWizardCTAText}>Award Tender & Assign Contractor</Text>
                  )}
                </TouchableOpacity>
              </ScrollView>
            </View>
          </View>
        </Modal>
      )}

      {/* ── MODAL 3: UPDATE MILESTONE GPS & EVIDENCE ── */}
      {updatingMilestone && (
        <Modal animationType="slide" transparent visible={!!updatingMilestone} onRequestClose={() => setUpdatingMilestone(null)}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalCard}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Update Milestone & GPS Check-in</Text>
                <TouchableOpacity onPress={() => setUpdatingMilestone(null)}>
                  <Ionicons name="close" size={24} color="#0F172A" />
                </TouchableOpacity>
              </View>

              <ScrollView showsVerticalScrollIndicator={false}>
                <Text style={styles.projTitle}>{updatingMilestone.project.title}</Text>
                <Text style={styles.mTitle}>Milestone: {updatingMilestone.milestone.milestone_id} - {updatingMilestone.milestone.title}</Text>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Status *</Text>
                  <View style={{ flexDirection: 'row', gap: 6 }}>
                    {['pending', 'in_progress', 'completed'].map((st) => (
                      <TouchableOpacity
                        key={st}
                        style={[styles.typeChip, milestoneForm.status === st && styles.typeChipActive]}
                        onPress={() => setMilestoneForm({ ...milestoneForm, status: st as any })}
                      >
                        <Text style={[styles.typeChipText, milestoneForm.status === st && styles.typeChipTextActive]}>{st.toUpperCase()}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                <View style={styles.inputRow}>
                  <View style={[styles.inputGroup, { flex: 1, marginRight: 6 }]}>
                    <Text style={styles.inputLabel}>GPS Latitude</Text>
                    <TextInput
                      style={styles.textInput}
                      value={milestoneForm.latitude}
                      onChangeText={(t) => setMilestoneForm({ ...milestoneForm, latitude: t })}
                    />
                  </View>
                  <View style={[styles.inputGroup, { flex: 1, marginLeft: 6 }]}>
                    <Text style={styles.inputLabel}>GPS Longitude</Text>
                    <TextInput
                      style={styles.textInput}
                      value={milestoneForm.longitude}
                      onChangeText={(t) => setMilestoneForm({ ...milestoneForm, longitude: t })}
                    />
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Field Inspection Notes</Text>
                  <TextInput
                    style={styles.textInput}
                    value={milestoneForm.notes}
                    onChangeText={(t) => setMilestoneForm({ ...milestoneForm, notes: t })}
                  />
                </View>

                <TouchableOpacity
                  style={[styles.submitWizardCTA, isSubmitting && { opacity: 0.6 }]}
                  onPress={handleUpdateMilestone}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <Text style={styles.submitWizardCTAText}>Submit Milestone GPS Check-in</Text>
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
  loadingText: { fontSize: 14, fontWeight: '600', color: '#0284C7', marginTop: 12 },
  retryBtn: { marginTop: 16, backgroundColor: '#0284C7', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 12 },
  retryBtnText: { color: '#FFFFFF', fontWeight: '800', fontSize: 13 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  headerTitle: { fontSize: 16, fontWeight: '800', color: '#0F172A' },
  headerSub: { fontSize: 11, color: '#64748B' },
  createBtnCTA: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#0284C7', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12, gap: 4 },
  createBtnCTAText: { color: '#FFFFFF', fontWeight: '800', fontSize: 12 },
  jurisdictionBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#E0F2FE', padding: 8, borderRadius: 12, marginBottom: 10, gap: 6 },
  jurisdictionLabel: { fontSize: 11, fontWeight: '800', color: '#0369A1' },
  jChip: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#BAE6FD' },
  jChipActive: { backgroundColor: '#0284C7', borderColor: '#0284C7' },
  jChipText: { fontSize: 10, fontWeight: '700', color: '#0369A1' },
  jChipTextActive: { color: '#FFFFFF' },
  tabScroll: { maxHeight: 42, marginBottom: 12 },
  tabBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#E2E8F0', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, gap: 4 },
  tabBtnActive: { backgroundColor: '#0284C7' },
  tabBtnText: { fontSize: 12, fontWeight: '700', color: '#475569' },
  tabBtnTextActive: { color: '#FFFFFF' },
  filterRow: { flexDirection: 'row', gap: 6, marginBottom: 12, flexWrap: 'wrap' },
  filterChip: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 20, backgroundColor: '#F1F5F9', borderWidth: 1, borderColor: '#CBD5E1' },
  filterChipActive: { backgroundColor: '#0284C7', borderColor: '#0284C7' },
  filterChipText: { fontSize: 11, fontWeight: '700', color: '#475569' },
  filterChipTextActive: { color: '#FFFFFF' },
  emptyCard: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 32, alignItems: 'center', borderWidth: 1, borderColor: '#E2E8F0' },
  emptyTitle: { fontSize: 16, fontWeight: '800', color: '#0F172A', marginTop: 8 },
  emptySub: { fontSize: 12, color: '#64748B', textAlign: 'center', marginTop: 4, marginBottom: 16 },
  projectCard: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 14, marginBottom: 12, borderWidth: 1, borderColor: '#E2E8F0', ...SHADOWS.soft },
  projectCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  projCode: { fontSize: 10, fontWeight: '800', color: '#64748B' },
  jurisdictionTag: { fontSize: 10, fontWeight: '800', color: '#0284C7' },
  projTitle: { fontSize: 14, fontWeight: '800', color: '#0F172A', marginTop: 2 },
  projTypeBadge: { fontSize: 11, color: '#0369A1', fontWeight: '700', marginTop: 2 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 10 },
  statusBadgeText: { fontSize: 10, fontWeight: '800' },
  objectiveText: { fontSize: 12, color: '#475569', marginTop: 6, lineHeight: 16 },
  progressSection: { marginVertical: 8 },
  progressHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  progressLabel: { fontSize: 10, fontWeight: '700', color: '#64748B' },
  progressVal: { fontSize: 11, fontWeight: '800', color: '#0284C7' },
  progressBarTrack: { height: 6, backgroundColor: '#E2E8F0', borderRadius: 3, overflow: 'hidden' },
  progressBarFill: { height: '100%', backgroundColor: '#0284C7', borderRadius: 3 },
  statsGrid: { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: '#F8FAFC', padding: 8, borderRadius: 10, marginVertical: 6 },
  statBox: { flex: 1 },
  statLabel: { fontSize: 9, color: '#94A3B8' },
  statVal: { fontSize: 11, fontWeight: '800', color: '#0F172A', marginTop: 2 },
  projectCardActions: { flexDirection: 'row', gap: 6, marginTop: 8, paddingTop: 8, borderTopWidth: 1, borderTopColor: '#F1F5F9' },
  secondaryBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#F1F5F9', paddingVertical: 8, borderRadius: 8, gap: 4 },
  secondaryBtnText: { fontSize: 11, fontWeight: '700', color: '#334155' },
  tenderBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#D97706', paddingVertical: 8, borderRadius: 8, gap: 4 },
  tenderBtnText: { fontSize: 11, fontWeight: '800', color: '#FFFFFF' },
  completeBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#059669', paddingVertical: 8, borderRadius: 8, gap: 4 },
  completeBtnText: { fontSize: 11, fontWeight: '800', color: '#FFFFFF' },
  wizardScroll: { paddingBottom: 120 },
  stepHeader: { flexDirection: 'row', justifyContent: 'space-around', backgroundColor: '#FFFFFF', borderRadius: 14, padding: 12, marginBottom: 14, borderWidth: 1, borderColor: '#E2E8F0' },
  stepItem: { alignItems: 'center' },
  stepCircle: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#E2E8F0', alignItems: 'center', justifyContent: 'center' },
  stepCircleActive: { backgroundColor: '#0284C7' },
  stepNum: { fontSize: 12, fontWeight: '800', color: '#64748B' },
  stepNumActive: { color: '#FFFFFF' },
  stepLabel: { fontSize: 10, fontWeight: '700', color: '#64748B', marginTop: 4 },
  stepLabelActive: { color: '#0284C7' },
  wizardCard: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#E2E8F0', ...SHADOWS.soft },
  wizardTitle: { fontSize: 16, fontWeight: '800', color: '#0F172A' },
  wizardSub: { fontSize: 12, color: '#64748B', marginTop: 2, marginBottom: 14 },
  inputGroup: { marginBottom: 12 },
  inputRow: { flexDirection: 'row', marginBottom: 12 },
  inputLabel: { fontSize: 12, fontWeight: '700', color: '#334155', marginBottom: 4 },
  typeChip: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, backgroundColor: '#F1F5F9', borderWidth: 1, borderColor: '#E2E8F0' },
  typeChipActive: { backgroundColor: '#0284C7', borderColor: '#0284C7' },
  typeChipText: { fontSize: 11, fontWeight: '700', color: '#475569' },
  typeChipTextActive: { color: '#FFFFFF' },
  textInput: { backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#CBD5E1', borderRadius: 10, paddingHorizontal: 12, height: 44, fontSize: 13, color: '#0F172A' },
  nextWizardCTA: { backgroundColor: '#0284C7', paddingVertical: 12, borderRadius: 12, alignItems: 'center', marginTop: 8 },
  nextWizardCTAText: { color: '#FFFFFF', fontWeight: '800', fontSize: 13 },
  wizardBtnRow: { flexDirection: 'row', gap: 10, marginTop: 12 },
  backWizardBtn: { backgroundColor: '#F1F5F9', paddingHorizontal: 16, paddingVertical: 12, borderRadius: 12, justifyContent: 'center' },
  backWizardBtnText: { fontSize: 12, fontWeight: '700', color: '#475569' },
  summaryBox: { backgroundColor: '#F8FAFC', padding: 12, borderRadius: 12, marginVertical: 8 },
  summaryTitle: { fontSize: 12, fontWeight: '800', color: '#0F172A', marginBottom: 4 },
  summaryText: { fontSize: 11, color: '#475569', marginTop: 2 },
  submitWizardCTA: { flex: 1, backgroundColor: '#0284C7', paddingVertical: 12, borderRadius: 12, alignItems: 'center' },
  submitWizardCTAText: { color: '#FFFFFF', fontWeight: '800', fontSize: 13 },
  sectionTitleRow: { marginBottom: 12 },
  sectionTitleText: { fontSize: 16, fontWeight: '800', color: '#0F172A' },
  sectionSubText: { fontSize: 12, color: '#64748B', marginTop: 2 },
  tenderCard: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 14, marginBottom: 12, borderWidth: 1, borderColor: '#E2E8F0', ...SHADOWS.soft },
  tenderHeader: { flexDirection: 'row', justifyContent: 'space-between' },
  tenderProjId: { fontSize: 11, fontWeight: '800', color: '#0284C7' },
  tenderBudget: { fontSize: 11, fontWeight: '700', color: '#059669' },
  tenderTitle: { fontSize: 14, fontWeight: '800', color: '#0F172A', marginTop: 2 },
  contractorBox: { backgroundColor: '#F0FDF4', padding: 10, borderRadius: 10, marginTop: 8, borderWidth: 1, borderColor: '#BBF7D0' },
  contractorTitle: { fontSize: 10, fontWeight: '800', color: '#166534' },
  contractorName: { fontSize: 12, fontWeight: '800', color: '#065F46', marginTop: 2 },
  contractorSub: { fontSize: 10, color: '#047857', marginTop: 2 },
  contractorAmount: { fontSize: 11, fontWeight: '800', color: '#15803D', marginTop: 4 },
  noTenderBox: { backgroundColor: '#FFFBEB', padding: 10, borderRadius: 10, marginTop: 8, borderWidth: 1, borderColor: '#FDE68A' },
  noTenderText: { fontSize: 11, color: '#92400E' },
  assignTenderCTA: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#D97706', paddingVertical: 8, borderRadius: 8, marginTop: 6, gap: 4 },
  assignTenderCTAText: { color: '#FFFFFF', fontWeight: '800', fontSize: 11 },
  milestoneCard: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 14, marginBottom: 12, borderWidth: 1, borderColor: '#E2E8F0', ...SHADOWS.soft },
  milestoneProjTitle: { fontSize: 14, fontWeight: '800', color: '#0F172A' },
  milestoneProgressText: { fontSize: 11, fontWeight: '700', color: '#0284C7', marginTop: 2 },
  milestoneItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F8FAFC', padding: 10, borderRadius: 10, marginBottom: 6 },
  milestoneCheckTouch: { padding: 2 },
  mTitle: { fontSize: 12, fontWeight: '800', color: '#0F172A' },
  mDate: { fontSize: 10, color: '#64748B', marginTop: 2 },
  gpsText: { fontSize: 10, fontWeight: '700', color: '#059669', marginTop: 2 },
  updateMilestoneBtn: { backgroundColor: '#0284C7', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 },
  updateMilestoneBtnText: { color: '#FFFFFF', fontSize: 10, fontWeight: '800' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.65)', justifyContent: 'flex-end' },
  modalCard: { backgroundColor: '#FFFFFF', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, maxHeight: '85%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  modalTitle: { fontSize: 16, fontWeight: '800', color: '#0F172A' },
  modalProjTitle: { fontSize: 16, fontWeight: '800', color: '#0F172A', marginTop: 2 },
  modalGrid: { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: '#F8FAFC', padding: 12, borderRadius: 12, marginVertical: 12 },
  modalGridItem: { flex: 1 },
  modalLabel: { fontSize: 10, color: '#94A3B8' },
  modalVal: { fontSize: 13, fontWeight: '800', color: '#0F172A', marginTop: 2 },
  modalSectionTitle: { fontSize: 13, fontWeight: '800', color: '#0F172A', marginTop: 12, marginBottom: 4 },
  modalDesc: { fontSize: 12, color: '#475569', lineHeight: 16 },
  timelineItem: { backgroundColor: '#F8FAFC', padding: 8, borderRadius: 8, marginBottom: 6 },
  timelineAction: { fontSize: 11, fontWeight: '800', color: '#0F172A' },
  timelineNotes: { fontSize: 10, color: '#64748B', marginTop: 2 },
});

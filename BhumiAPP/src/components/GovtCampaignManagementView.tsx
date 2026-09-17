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
} from 'react-native';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { COLORS, SHADOWS } from '../theme/theme';
import api from '../api/apiClient';
import { useConnectivityStore } from '../store/connectivityStore';

const { width } = Dimensions.get('window');

export interface CampaignProgress {
  estimated_farmers: number;
  farmers_invited: number;
  otp_sent: number;
  registered: number;
  kyc_completed: number;
  land_added: number;
  onboarding_completed: number;
}

export interface CampaignAudit {
  timestamp: string;
  action: string;
  actor: string;
  notes?: string;
}

export interface BudgetTranche {
  tranche: number;
  amount_inr: number;
  milestone: string;
  date: string;
  status: string;
}

export interface CampaignRecord {
  id: string;
  campaign_code?: string;
  title: string;
  category: string;
  target_area: string;
  target_villages: string;
  target_farmers: number;
  objective: string;
  start_date: string;
  end_date: string;
  allocated_budget_inr?: number;
  released_budget_inr?: number;
  budget_tranches?: BudgetTranche[];
  tree_planting_target?: number;
  tree_planting_achieved?: number;
  status: string; // 'Draft' | 'Submitted' | 'Admin Approval' | 'Resource Assignment' | 'Active' | 'Progress' | 'Completed'
  jurisdiction_code?: string;
  assigned_partner?: string;
  assigned_field_officer?: string;
  progress: CampaignProgress;
  final_report_url?: string;
  submitted_at?: string;
  audit_timeline?: CampaignAudit[];
}

const CATEGORIES = [
  'All',
  'Farmer Onboarding',
  'Soil Testing',
  'Land Mapping',
  'Plantation',
  'Tree Insurance',
  'Carbon Awareness',
];

export function GovtCampaignManagementView() {
  const isOnline = useConnectivityStore((state) => state.isOnline);

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [campaigns, setCampaigns] = useState<CampaignRecord[]>([]);

  // Filter
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  // Modals
  const [selectedCampaign, setSelectedCampaign] = useState<CampaignRecord | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [isBudgetModalOpen, setIsBudgetModalOpen] = useState<boolean>(false);
  const [isTreeModalOpen, setIsTreeModalOpen] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Budget Release Form
  const [budgetForm, setBudgetForm] = useState({
    amount_inr: '250000',
    milestone: 'Phase 1 Onboarding & Land Mapping Completed',
    notes: 'Disbursed milestone tranche payment.',
  });

  // Tree Tracker Form
  const [treeForm, setTreeForm] = useState({
    trees_add: '500',
    species: 'Teak / Sagwan, Banyan / Bargad',
  });

  // Create Campaign Form
  const [form, setForm] = useState({
    title: '',
    category: 'Farmer Onboarding',
    target_area: 'Hoshangabad Watershed Corridor',
    target_villages: 'Pipariya, Sehore, Babai',
    target_farmers: '150',
    allocated_budget_inr: '500000',
    tree_planting_target: '5000',
    objective: 'Promote institutional farmer aggregation and sustainable agroforestry.',
    start_date: '2026-09-01',
    end_date: '2026-10-31',
    is_draft: false,
  });

  const fetchCampaigns = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await api.get('/govt/campaigns', {
        params: {
          category: selectedCategory !== 'All' ? selectedCategory : undefined,
        },
      });
      if (response.data && response.data.success && Array.isArray(response.data.data)) {
        setCampaigns(response.data.data);
      } else {
        throw new Error('Failed to load campaigns list.');
      }
    } catch (err: any) {
      console.warn('[GovtCampaignManagementView] Fetch error:', err);
      setError(err?.message || 'Unable to load outreach campaigns.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCampaigns();
  }, [selectedCategory]);

  const handleCreateCampaign = async () => {
    if (!form.title.trim()) {
      Alert.alert('Validation Error', 'Campaign title is required.');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        title: form.title.trim(),
        category: form.category,
        target_area: form.target_area,
        target_villages: form.target_villages,
        target_farmers: Number(form.target_farmers) || 150,
        allocated_budget_inr: Number(form.allocated_budget_inr) || 500000,
        tree_planting_target: Number(form.tree_planting_target) || 5000,
        objective: form.objective,
        start_date: form.start_date,
        end_date: form.end_date,
        is_draft: form.is_draft,
      };

      const res = await api.post('/govt/campaigns', payload);
      if (res.data && res.data.success) {
        Alert.alert(
          'Success',
          form.is_draft ? 'Campaign saved as Draft.' : 'Campaign submitted for Admin approval!'
        );
        setIsAddModalOpen(false);
        fetchCampaigns();
      }
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.detail || 'Failed to create campaign.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReleaseBudget = async () => {
    if (!selectedCampaign) return;
    setIsSubmitting(true);
    try {
      const payload = {
        amount_inr: Number(budgetForm.amount_inr) || 100000,
        milestone_verified: budgetForm.milestone,
        notes: budgetForm.notes,
      };
      const res = await api.post(`/govt/campaigns/${selectedCampaign.id}/release-budget`, payload);
      if (res.data && res.data.success) {
        Alert.alert('Budget Tranche Released', `₹${Number(budgetForm.amount_inr).toLocaleString('en-IN')} disbursed successfully.`);
        setIsBudgetModalOpen(false);
        fetchCampaigns();
      }
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.detail || 'Failed to release budget.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateTreeTracker = async () => {
    if (!selectedCampaign) return;
    setIsSubmitting(true);
    try {
      const payload = {
        trees_planted_add: Number(treeForm.trees_add) || 100,
        species_list: treeForm.species.split(',').map((s) => s.trim()),
      };
      const res = await api.post(`/govt/campaigns/${selectedCampaign.id}/tree-tracker`, payload);
      if (res.data && res.data.success) {
        Alert.alert('Tree Progress Recorded', `Added ${treeForm.trees_add} planted saplings.`);
        setIsTreeModalOpen(false);
        fetchCampaigns();
      }
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.detail || 'Failed to update tree progress.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGenerateReport = async (cmp: CampaignRecord) => {
    try {
      const res = await api.post(`/govt/campaigns/${cmp.id}/generate-report`);
      if (res.data && res.data.success) {
        Alert.alert('Campaign Completed', `Certified final report issued:\n${res.data.final_report_url}`);
        fetchCampaigns();
      }
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.detail || 'Failed to generate campaign report.');
    }
  };

  if (!isOnline) {
    return (
      <View style={styles.stateContainer}>
        <MaterialCommunityIcons name="wifi-off" size={48} color="#EF4444" />
        <Text style={styles.stateTitle}>Offline Mode</Text>
        <Text style={styles.stateSubtitle}>Connect to network to manage Government outreach campaigns & budget allocation.</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={fetchCampaigns}>
          <Text style={styles.retryBtnText}>Retry Connection</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (isLoading) {
    return (
      <View style={styles.stateContainer}>
        <ActivityIndicator size="large" color="#0F766E" />
        <Text style={styles.loadingText}>Loading On-Demand Farmer Campaigns...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 120 }}>
      {/* ── 1. HEADER ROW ── */}
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.headerTitle}>On-Demand Farmer Campaigns</Text>
          <Text style={styles.headerSub}>Government Jurisdiction Outreach & Aggregation Drives</Text>
        </View>
        <TouchableOpacity style={styles.addBtn} onPress={() => setIsAddModalOpen(true)}>
          <MaterialCommunityIcons name="plus" size={18} color="#FFFFFF" />
          <Text style={styles.addBtnText}>Create Drive</Text>
        </TouchableOpacity>
      </View>

      {/* ── 2. CATEGORY CHIPS SCROLL ── */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll} contentContainerStyle={{ gap: 6, paddingBottom: 12 }}>
        {CATEGORIES.map((cat) => {
          const isSelected = selectedCategory === cat;
          return (
            <TouchableOpacity
              key={cat}
              style={[styles.categoryChip, isSelected && styles.categoryChipActive]}
              onPress={() => setSelectedCategory(cat)}
            >
              <Text style={[styles.categoryChipText, isSelected && styles.categoryChipTextActive]}>{cat}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* ── 3. CAMPAIGN CARDS LIST ── */}
      {campaigns.length === 0 ? (
        <View style={styles.emptyCard}>
          <MaterialCommunityIcons name="bullhorn-outline" size={48} color="#94A3B8" />
          <Text style={styles.emptyTitle}>No Campaigns Found</Text>
          <Text style={styles.emptySub}>Create a campaign for farmer onboarding, soil testing, or tree insurance in your jurisdiction.</Text>
          <TouchableOpacity style={styles.addBtn} onPress={() => setIsAddModalOpen(true)}>
            <Text style={styles.addBtnText}>+ Create New Campaign</Text>
          </TouchableOpacity>
        </View>
      ) : (
        campaigns.map((cmp) => {
          const p = cmp.progress || {
            estimated_farmers: cmp.target_farmers,
            farmers_invited: 0,
            registered: 0,
            kyc_completed: 0,
            land_added: 0,
            onboarding_completed: 0,
          };

          const targetTrees = cmp.tree_planting_target || 0;
          const achievedTrees = cmp.tree_planting_achieved || 0;
          const treeProgressPercent = targetTrees > 0 ? Math.min(Math.round((achievedTrees / targetTrees) * 100), 100) : 0;

          const allocatedBudget = cmp.allocated_budget_inr || 0;
          const releasedBudget = cmp.released_budget_inr || 0;

          return (
            <View key={cmp.id} style={styles.campaignCard}>
              <View style={styles.cardHeader}>
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Text style={styles.categoryBadge}>{cmp.category}</Text>
                    <Text style={styles.campaignCode}>{cmp.campaign_code || cmp.id}</Text>
                  </View>
                  <Text style={styles.campaignTitle}>{cmp.title}</Text>
                  <Text style={styles.campaignMeta}>Villages: {cmp.target_villages}</Text>
                </View>
                <View style={styles.statusBadge}>
                  <Text style={styles.statusBadgeText}>{cmp.status}</Text>
                </View>
              </View>

              {/* Objective */}
              <Text style={styles.objectiveText} numberOfLines={2}>{cmp.objective}</Text>

              {/* 6 Core Dashboard Metrics */}
              <View style={styles.progressGrid}>
                <View style={styles.progressItem}>
                  <Text style={styles.progressNum}>{p.estimated_farmers}</Text>
                  <Text style={styles.progressLabel}>Target</Text>
                </View>
                <View style={styles.progressItem}>
                  <Text style={[styles.progressNum, { color: '#2563EB' }]}>{p.farmers_invited}</Text>
                  <Text style={styles.progressLabel}>Invited</Text>
                </View>
                <View style={styles.progressItem}>
                  <Text style={[styles.progressNum, { color: '#7C3AED' }]}>{p.registered}</Text>
                  <Text style={styles.progressLabel}>Registered</Text>
                </View>
                <View style={styles.progressItem}>
                  <Text style={[styles.progressNum, { color: '#D97706' }]}>{p.kyc_completed}</Text>
                  <Text style={styles.progressLabel}>KYC Done</Text>
                </View>
                <View style={styles.progressItem}>
                  <Text style={[styles.progressNum, { color: '#0F766E' }]}>{p.land_added}</Text>
                  <Text style={styles.progressLabel}>Land Added</Text>
                </View>
                <View style={styles.progressItem}>
                  <Text style={[styles.progressNum, { color: '#059669' }]}>{p.onboarding_completed}</Text>
                  <Text style={styles.progressLabel}>Completed</Text>
                </View>
              </View>

              {/* Tree Planting Achievement Bar if applicable */}
              {targetTrees > 0 && (
                <View style={styles.trackerContainer}>
                  <View style={styles.trackerHeader}>
                    <Text style={styles.trackerTitle}>Tree Planting Tracker</Text>
                    <Text style={styles.trackerStats}>
                      {achievedTrees} / {targetTrees} Trees ({treeProgressPercent}%)
                    </Text>
                  </View>
                  <View style={styles.progressBarBg}>
                    <View style={[styles.progressBarFill, { width: `${treeProgressPercent}%` }]} />
                  </View>
                </View>
              )}

              {/* Financial Ledger */}
              <View style={styles.budgetRow}>
                <MaterialCommunityIcons name="cash-register" size={16} color="#0F766E" />
                <Text style={styles.budgetText}>
                  Budget Disbursed: <Text style={{ fontWeight: '800', color: '#0F172A' }}>₹{releasedBudget.toLocaleString('en-IN')}</Text> / ₹{allocatedBudget.toLocaleString('en-IN')}
                </Text>
              </View>

              {/* Partner */}
              <View style={styles.partnerInfoRow}>
                <MaterialCommunityIcons name="account-tie" size={14} color="#64748B" />
                <Text style={styles.partnerInfoText}>
                  Partner: <Text style={{ fontWeight: '700', color: '#0F172A' }}>{cmp.assigned_partner || 'Pending Allocation'}</Text>
                </Text>
              </View>

              {/* Action Buttons */}
              <View style={styles.actionsFooter}>
                <TouchableOpacity
                  style={styles.actionCTA}
                  onPress={() => {
                    setSelectedCampaign(cmp);
                    setIsBudgetModalOpen(true);
                  }}
                >
                  <MaterialCommunityIcons name="cash-plus" size={14} color="#0F766E" />
                  <Text style={styles.actionCTAText}>Release Budget</Text>
                </TouchableOpacity>

                {targetTrees > 0 && (
                  <TouchableOpacity
                    style={styles.actionCTA}
                    onPress={() => {
                      setSelectedCampaign(cmp);
                      setIsTreeModalOpen(true);
                    }}
                  >
                    <MaterialCommunityIcons name="tree" size={14} color="#059669" />
                    <Text style={[styles.actionCTAText, { color: '#059669' }]}>Tree Progress</Text>
                  </TouchableOpacity>
                )}

                <TouchableOpacity
                  style={styles.actionOutlineCTA}
                  onPress={() => {
                    setSelectedCampaign(cmp);
                  }}
                >
                  <MaterialCommunityIcons name="history" size={14} color="#475569" />
                  <Text style={styles.actionOutlineCTAText}>Audit</Text>
                </TouchableOpacity>

                {cmp.status !== 'Completed' ? (
                  <TouchableOpacity style={styles.completeBtn} onPress={() => handleGenerateReport(cmp)}>
                    <MaterialCommunityIcons name="check-decagram" size={14} color="#FFFFFF" />
                    <Text style={styles.completeBtnText}>Complete & Report</Text>
                  </TouchableOpacity>
                ) : (
                  <View style={styles.certifiedTag}>
                    <MaterialCommunityIcons name="shield-check" size={14} color="#059669" />
                    <Text style={styles.certifiedTagText}>Report Ready</Text>
                  </View>
                )}
              </View>
            </View>
          );
        })
      )}

      {/* ── 4. CREATE CAMPAIGN MODAL ── */}
      <Modal animationType="slide" transparent visible={isAddModalOpen} onRequestClose={() => setIsAddModalOpen(false)}>
        <View style={styles.modalOverlay}>
          <ScrollView contentContainerStyle={styles.modalScroll}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Create On-Demand Farmer Campaign</Text>
              <TouchableOpacity onPress={() => setIsAddModalOpen(false)}>
                <Ionicons name="close" size={24} color="#0F172A" />
              </TouchableOpacity>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Campaign Category *</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexDirection: 'row', gap: 6 }}>
                {CATEGORIES.filter((c) => c !== 'All').map((cat) => (
                  <TouchableOpacity
                    key={cat}
                    style={[styles.miniChip, form.category === cat && styles.miniChipActive]}
                    onPress={() => setForm({ ...form, category: cat })}
                  >
                    <Text style={[styles.miniChipText, form.category === cat && styles.miniChipTextActive]}>{cat}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Campaign Title *</Text>
              <TextInput
                style={styles.textInput}
                placeholder="e.g. Mission Amrit Sarovar Farmer Outreach Drive"
                value={form.title}
                onChangeText={(t) => setForm({ ...form, title: t })}
              />
            </View>

            <View style={styles.inputRow}>
              <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
                <Text style={styles.inputLabel}>Target Farmers</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="150"
                  keyboardType="numeric"
                  value={form.target_farmers}
                  onChangeText={(t) => setForm({ ...form, target_farmers: t })}
                />
              </View>
              <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
                <Text style={styles.inputLabel}>Budget (₹ INR)</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="500000"
                  keyboardType="numeric"
                  value={form.allocated_budget_inr}
                  onChangeText={(t) => setForm({ ...form, allocated_budget_inr: t })}
                />
              </View>
            </View>

            <View style={styles.inputRow}>
              <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
                <Text style={styles.inputLabel}>Tree Planting Target</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="5000"
                  keyboardType="numeric"
                  value={form.tree_planting_target}
                  onChangeText={(t) => setForm({ ...form, tree_planting_target: t })}
                />
              </View>
              <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
                <Text style={styles.inputLabel}>Target Corridor</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="Hoshangabad Corridor"
                  value={form.target_area}
                  onChangeText={(t) => setForm({ ...form, target_area: t })}
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Target Villages / Wards *</Text>
              <TextInput
                style={styles.textInput}
                placeholder="Pipariya, Sehore, Babai"
                value={form.target_villages}
                onChangeText={(t) => setForm({ ...form, target_villages: t })}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Objective & Expected Outputs</Text>
              <TextInput
                style={[styles.textInput, { height: 70 }]}
                multiline
                placeholder="Onboard 150 smallholder farmers for agroforestry..."
                value={form.objective}
                onChangeText={(t) => setForm({ ...form, objective: t })}
              />
            </View>

            <TouchableOpacity
              style={[styles.submitCTA, isSubmitting && { opacity: 0.6 }]}
              onPress={handleCreateCampaign}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.submitCTAText}>Submit Campaign Proposal</Text>
              )}
            </TouchableOpacity>
          </ScrollView>
        </View>
      </Modal>

      {/* ── 5. RELEASE BUDGET MODAL ── */}
      {selectedCampaign && isBudgetModalOpen && (
        <Modal animationType="slide" transparent visible={isBudgetModalOpen} onRequestClose={() => setIsBudgetModalOpen(false)}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalCard}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Release Campaign Budget Tranche</Text>
                <TouchableOpacity onPress={() => setIsBudgetModalOpen(false)}>
                  <Ionicons name="close" size={24} color="#0F172A" />
                </TouchableOpacity>
              </View>
              <Text style={{ fontSize: 13, fontWeight: '700', color: '#0F766E', marginBottom: 12 }}>
                {selectedCampaign.title} (Allocated: ₹{(selectedCampaign.allocated_budget_inr || 0).toLocaleString('en-IN')})
              </Text>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Tranche Amount (₹ INR) *</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="250000"
                  keyboardType="numeric"
                  value={budgetForm.amount_inr}
                  onChangeText={(t) => setBudgetForm({ ...budgetForm, amount_inr: t })}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Verified Milestone *</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="Phase 1 Onboarding Completed"
                  value={budgetForm.milestone}
                  onChangeText={(t) => setBudgetForm({ ...budgetForm, milestone: t })}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Disbursement Remarks</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="Notes for treasury log"
                  value={budgetForm.notes}
                  onChangeText={(t) => setBudgetForm({ ...budgetForm, notes: t })}
                />
              </View>

              <TouchableOpacity
                style={[styles.submitCTA, isSubmitting && { opacity: 0.6 }]}
                onPress={handleReleaseBudget}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.submitCTAText}>Confirm & Disburse Tranche</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      )}

      {/* ── 6. TREE TRACKER MODAL ── */}
      {selectedCampaign && isTreeModalOpen && (
        <Modal animationType="slide" transparent visible={isTreeModalOpen} onRequestClose={() => setIsTreeModalOpen(false)}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalCard}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Update Tree Planting Progress</Text>
                <TouchableOpacity onPress={() => setIsTreeModalOpen(false)}>
                  <Ionicons name="close" size={24} color="#0F172A" />
                </TouchableOpacity>
              </View>
              <Text style={{ fontSize: 13, fontWeight: '700', color: '#059669', marginBottom: 12 }}>
                Current Achieved: {selectedCampaign.tree_planting_achieved || 0} / {selectedCampaign.tree_planting_target || 0} Trees
              </Text>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Additional Planted Trees Count *</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="500"
                  keyboardType="numeric"
                  value={treeForm.trees_add}
                  onChangeText={(t) => setTreeForm({ ...treeForm, trees_add: t })}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Species Planted *</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="Teak / Sagwan, Banyan / Bargad"
                  value={treeForm.species}
                  onChangeText={(t) => setTreeForm({ ...treeForm, species: t })}
                />
              </View>

              <TouchableOpacity
                style={[styles.submitCTA, { backgroundColor: '#059669' }, isSubmitting && { opacity: 0.6 }]}
                onPress={handleUpdateTreeTracker}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.submitCTAText}>Log Verified Saplings</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      )}

      {/* ── 7. AUDIT TIMELINE MODAL ── */}
      {selectedCampaign && !isBudgetModalOpen && !isTreeModalOpen && (
        <Modal animationType="slide" transparent visible={!!selectedCampaign} onRequestClose={() => setSelectedCampaign(null)}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalCard}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Campaign Audit & Financial Trail</Text>
                <TouchableOpacity onPress={() => setSelectedCampaign(null)}>
                  <Ionicons name="close" size={24} color="#0F172A" />
                </TouchableOpacity>
              </View>
              <Text style={{ fontSize: 13, fontWeight: '800', color: '#0F172A', marginBottom: 12 }}>{selectedCampaign.title}</Text>

              <ScrollView showsVerticalScrollIndicator={false}>
                {selectedCampaign.audit_timeline && selectedCampaign.audit_timeline.length > 0 ? (
                  selectedCampaign.audit_timeline.map((ev, idx) => (
                    <View key={idx} style={styles.timelineRow}>
                      <View style={styles.timelineDot} />
                      <View style={{ flex: 1, marginLeft: 10 }}>
                        <Text style={styles.timelineAction}>{ev.action} • {ev.actor}</Text>
                        <Text style={styles.timelineTime}>{ev.timestamp}</Text>
                        {ev.notes ? <Text style={styles.timelineNotes}>{ev.notes}</Text> : null}
                      </View>
                    </View>
                  ))
                ) : (
                  <Text style={styles.noDataText}>No audit trail entries found.</Text>
                )}
              </ScrollView>
            </View>
          </View>
        </Modal>
      )}
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
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  headerTitle: { fontSize: 16, fontWeight: '800', color: '#0F172A' },
  headerSub: { fontSize: 11, color: '#64748B' },
  addBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#0F766E', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12, gap: 4 },
  addBtnText: { color: '#FFFFFF', fontWeight: '800', fontSize: 12 },
  categoryScroll: { marginBottom: 10 },
  categoryChip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, backgroundColor: '#E2E8F0', marginRight: 6 },
  categoryChipActive: { backgroundColor: '#0F766E' },
  categoryChipText: { fontSize: 12, fontWeight: '700', color: '#475569' },
  categoryChipTextActive: { color: '#FFFFFF' },
  miniChip: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12, backgroundColor: '#F1F5F9', marginRight: 6 },
  miniChipActive: { backgroundColor: '#0F766E' },
  miniChipText: { fontSize: 11, fontWeight: '700', color: '#475569' },
  miniChipTextActive: { color: '#FFFFFF' },
  emptyCard: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 32, alignItems: 'center', borderWidth: 1, borderColor: '#E2E8F0' },
  emptyTitle: { fontSize: 16, fontWeight: '800', color: '#0F172A', marginTop: 8 },
  emptySub: { fontSize: 12, color: '#64748B', textAlign: 'center', marginTop: 4, marginBottom: 16 },
  campaignCard: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 16, marginBottom: 14, borderWidth: 1, borderColor: '#E2E8F0', ...SHADOWS.soft },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 },
  categoryBadge: { fontSize: 10, fontWeight: '800', color: '#0F766E', backgroundColor: '#CCFBF1', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  campaignCode: { fontSize: 10, fontWeight: '700', color: '#64748B' },
  campaignTitle: { fontSize: 15, fontWeight: '800', color: '#0F172A', marginTop: 2 },
  campaignMeta: { fontSize: 11, color: '#64748B', marginTop: 2 },
  statusBadge: { backgroundColor: '#ECFDF5', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 10 },
  statusBadgeText: { fontSize: 11, fontWeight: '700', color: '#059669' },
  objectiveText: { fontSize: 12, color: '#475569', marginVertical: 6, lineHeight: 16 },
  progressGrid: { flexDirection: 'row', flexWrap: 'wrap', backgroundColor: '#F8FAFC', padding: 10, borderRadius: 12, marginVertical: 8, gap: 8 },
  progressItem: { width: '30%', alignItems: 'center', marginVertical: 4 },
  progressNum: { fontSize: 15, fontWeight: '800', color: '#0F172A' },
  progressLabel: { fontSize: 10, color: '#64748B', marginTop: 2 },
  trackerContainer: { marginVertical: 8, backgroundColor: '#F0FDF4', padding: 10, borderRadius: 10, borderWidth: 1, borderColor: '#BBF7D0' },
  trackerHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  trackerTitle: { fontSize: 11, fontWeight: '800', color: '#166534' },
  trackerStats: { fontSize: 11, fontWeight: '700', color: '#15803D' },
  progressBarBg: { height: 8, backgroundColor: '#DCFCE7', borderRadius: 4, overflow: 'hidden' },
  progressBarFill: { height: 8, backgroundColor: '#16A34A' },
  budgetRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
  budgetText: { fontSize: 12, color: '#475569' },
  partnerInfoRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginVertical: 4 },
  partnerInfoText: { fontSize: 11, color: '#64748B' },
  actionsFooter: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, paddingTop: 10, borderTopWidth: 1, borderTopColor: '#F1F5F9', marginTop: 8 },
  actionCTA: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#ECFDF5', borderWidth: 1, borderColor: '#A7F3D0', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, gap: 4 },
  actionCTAText: { fontSize: 11, fontWeight: '700', color: '#0F766E' },
  actionOutlineCTA: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#CBD5E1', paddingHorizontal: 8, paddingVertical: 6, borderRadius: 8, gap: 4 },
  actionOutlineCTAText: { fontSize: 11, fontWeight: '700', color: '#475569' },
  completeBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#059669', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, gap: 4 },
  completeBtnText: { fontSize: 11, fontWeight: '800', color: '#FFFFFF' },
  certifiedTag: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F0FDF4', borderWidth: 1, borderColor: '#BBF7D0', paddingHorizontal: 8, paddingVertical: 6, borderRadius: 8, gap: 4 },
  certifiedTagText: { fontSize: 11, fontWeight: '800', color: '#059669' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.65)', justifyContent: 'flex-end' },
  modalScroll: { backgroundColor: '#FFFFFF', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20 },
  modalCard: { backgroundColor: '#FFFFFF', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, maxHeight: '80%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  modalTitle: { fontSize: 16, fontWeight: '800', color: '#0F172A' },
  inputGroup: { marginBottom: 12 },
  inputRow: { flexDirection: 'row', marginBottom: 12 },
  inputLabel: { fontSize: 12, fontWeight: '700', color: '#334155', marginBottom: 4 },
  textInput: { backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#CBD5E1', borderRadius: 10, paddingHorizontal: 12, height: 42, fontSize: 13, color: '#0F172A' },
  submitCTA: { backgroundColor: '#0F766E', paddingVertical: 12, borderRadius: 12, alignItems: 'center', marginTop: 12, marginBottom: 20 },
  submitCTAText: { color: '#FFFFFF', fontWeight: '800', fontSize: 13 },
  timelineRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 10 },
  timelineDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#0F766E', marginTop: 4 },
  timelineAction: { fontSize: 12, fontWeight: '800', color: '#0F172A' },
  timelineTime: { fontSize: 10, color: '#94A3B8' },
  timelineNotes: { fontSize: 11, color: '#475569', marginTop: 2 },
  noDataText: { fontSize: 11, color: '#94A3B8', fontStyle: 'italic' },
});

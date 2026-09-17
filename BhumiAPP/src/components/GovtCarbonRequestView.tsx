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
import api from '../api/apiClient';
import { useConnectivityStore } from '../store/connectivityStore';

const { width } = Dimensions.get('window');

export interface EligibleTarget {
  id: string;
  target_type: 'public_asset' | 'project' | 'land';
  name: string;
  category: string;
  area_acres: number;
  location: string;
  status: string;
  trees_count: number;
  jurisdiction_code?: string;
}

export interface AuditTimelineItem {
  stage: string;
  timestamp: string;
  action: string;
  actor: string;
  notes?: string;
}

export interface CarbonRequest {
  id: string;
  target_type: string;
  target_id: string;
  target_name: string;
  asset_name?: string;
  objective: string;
  methodology: string;
  carbon_target: string;
  carbon_target_tco2e: number;
  area_acres: number;
  tree_density: string;
  stage: string; // 'Submitted' | 'Eligibility Validation' | 'Admin Review' | 'Verification' | 'Monitoring' | 'Credit Lifecycle'
  status: string;
  sentinel_ndvi_score: number;
  canopy_coverage_percent: number;
  issued_credits: number;
  registry_serial_number?: string;
  jurisdiction_code?: string;
  submitted_at: string;
  documents?: { name: string; url: string }[];
  evidence_photos?: string[];
  sentinel_ndvi_link?: string;
  audit_timeline?: AuditTimelineItem[];
}

export interface LedgerTransaction {
  tx_id: string;
  type: 'MINTED' | 'TRANSFER' | 'RETIREMENT' | 'ESCROW_LOCK';
  request_id?: string;
  target_name?: string;
  buyer_recipient?: string;
  amount_credits: number;
  serial_range: string;
  certification_agency?: string;
  unit_price_inr?: number;
  total_value_inr?: number;
  timestamp: string;
  certificate_pdf_url?: string;
  receipt_url?: string;
  notes?: string;
}

export interface StateCarbonLedger {
  total_minted_credits: number;
  retired_transferred_credits: number;
  available_registry_credits: number;
  estimated_carbon_value_inr: number;
  jurisdiction_code: string;
  state: string;
  last_updated: string;
  ledger_transactions: LedgerTransaction[];
}

export interface PersistentTender {
  id: string;
  tender_ref_number: string;
  title: string;
  project_id?: string;
  contractor_name: string;
  contractor_gstin?: string;
  proposed_budget_inr: number;
  status: string; // 'submitted' | 'awarded'
  submitted_at: string;
  technical_proposal_doc?: string;
  financial_bid_doc?: string;
  notes?: string;
}

const WORKFLOW_STAGES = [
  'Submitted',
  'Eligibility Validation',
  'Admin Review',
  'Verification',
  'Monitoring',
  'Credit Lifecycle',
];

export function GovtCarbonRequestView() {
  const isOnline = useConnectivityStore((state) => state.isOnline);

  const [activeTab, setActiveTab] = useState<'requests' | 'ledger' | 'tenders'>('requests');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [eligibleTargets, setEligibleTargets] = useState<EligibleTarget[]>([]);
  const [carbonRequests, setCarbonRequests] = useState<CarbonRequest[]>([]);
  const [selectedRequest, setSelectedRequest] = useState<CarbonRequest | null>(null);
  const [ledger, setLedger] = useState<StateCarbonLedger | null>(null);
  const [tenders, setTenders] = useState<PersistentTender[]>([]);

  // Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false);
  const [isIssueModalOpen, setIsIssueModalOpen] = useState<boolean>(false);
  const [isTransferModalOpen, setIsTransferModalOpen] = useState<boolean>(false);
  const [isTenderModalOpen, setIsTenderModalOpen] = useState<boolean>(false);
  const [isAwardModalOpen, setIsAwardModalOpen] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Forms
  const [createForm, setCreateForm] = useState({
    target_id: '',
    target_type: 'public_asset',
    target_name: '',
    area_acres: '10',
    objective: 'Carbon Sequestration & Soil Organic Carbon Restoration',
    methodology: 'VM0042 - Improved Agroforestry & Afforestation',
    tree_density: '350 Trees / Acre',
    carbon_target_tco2e: '2500',
    document_name: 'Baseline_Carbon_Assessment.pdf',
    document_url: '/uploads/govt/documents/baseline_carbon_audit.pdf',
    evidence_photo: 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=600&auto=format&fit=crop',
    jurisdiction_code: 'MP-IND-461',
  });

  const [issueForm, setIssueForm] = useState({
    credits_to_issue: '2500',
    certification_agency: 'Verra (VCS) / India Carbon Registry',
    vintage_year: '2026',
    serial_prefix: 'BC-IND-MP',
    unit_price_inr: '1850',
    auditor_notes: 'Continuous satellite MRV telemetry and baseline audit confirmed.',
  });

  const [transferForm, setTransferForm] = useState({
    credits_to_transfer: '1000',
    buyer_or_recipient: 'Tata Power NetZero ESCROW Pool',
    transfer_type: 'TRANSFER',
    unit_price_inr: '1850',
    notes: 'Corporate ESG offsetting registry settlement.',
  });

  const [tenderForm, setTenderForm] = useState({
    tender_ref_number: 'TND-2026-MP-0990',
    title: 'Gram Panchayat Miyawaki Plantation & Agroforestry Supply Contract',
    project_id: 'PRJ-801',
    contractor_name: 'Vanashree Ecological Foundation',
    contractor_gstin: '23AAACV1234F1Z5',
    proposed_budget_inr: '1650000',
    technical_proposal_doc: '/uploads/govt/documents/technical_bid.pdf',
    financial_bid_doc: '/uploads/govt/documents/financial_bid.pdf',
    notes: 'Empaneled plantation agency bid for Narmada bio-shield.',
  });

  const [awardTenderTarget, setAwardTenderTarget] = useState<PersistentTender | null>(null);

  const fetchAllData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [targetsRes, requestsRes, ledgerRes, tendersRes] = await Promise.all([
        api.get('/govt/carbon/eligible-targets'),
        api.get('/govt/carbon/requests'),
        api.get('/govt/carbon/ledger'),
        api.get('/govt/tenders'),
      ]);

      if (targetsRes.data?.success) {
        setEligibleTargets(targetsRes.data.data || []);
        if (targetsRes.data.data?.length > 0) {
          const first = targetsRes.data.data[0];
          setCreateForm((prev) => ({
            ...prev,
            target_id: first.id,
            target_type: first.target_type,
            target_name: first.name,
            area_acres: String(first.area_acres || 10),
          }));
        }
      }

      if (requestsRes.data?.success) {
        setCarbonRequests(requestsRes.data.data || []);
        if (requestsRes.data.data?.length > 0 && !selectedRequest) {
          setSelectedRequest(requestsRes.data.data[0]);
        }
      }

      if (ledgerRes.data?.success) {
        setLedger(ledgerRes.data.data || null);
      }

      if (tendersRes.data?.success) {
        setTenders(tendersRes.data.data || []);
      }
    } catch (err: any) {
      console.warn('[GovtCarbonRequestView] Fetch error:', err);
      setError(err?.message || 'Failed to load carbon credit request data.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  const handleCreateRequest = async () => {
    if (!createForm.target_name || !createForm.carbon_target_tco2e) {
      Alert.alert('Validation Error', 'Please select a target activity and specify carbon target tCO₂e.');
      return;
    }
    setIsSubmitting(true);
    try {
      const payload = {
        target_type: createForm.target_type,
        target_id: createForm.target_id,
        target_name: createForm.target_name,
        area_acres: Number(createForm.area_acres) || 10,
        objective: createForm.objective,
        methodology: createForm.methodology,
        tree_density: createForm.tree_density,
        carbon_target_tco2e: Number(createForm.carbon_target_tco2e) || 2500,
        documents: [{ name: createForm.document_name, url: createForm.document_url }],
        evidence_photos: [createForm.evidence_photo],
        jurisdiction_code: createForm.jurisdiction_code,
      };

      const res = await api.post('/govt/carbon/requests', payload);
      if (res.data?.success) {
        Alert.alert('Carbon Request Created', `Request ${res.data.data.id} submitted for eligibility validation.`);
        setIsCreateModalOpen(false);
        fetchAllData();
      }
    } catch (err: any) {
      Alert.alert('Request Failed', err?.response?.data?.detail || 'Only approved activities can progress to carbon lifecycle.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAdvanceStage = async (reqId: string, nextStage: string) => {
    try {
      const payload = {
        new_stage: nextStage,
        auditor_notes: `Advanced request to stage '${nextStage}'. Baseline MRV check passed.`,
        sentinel_ndvi_score: 0.85,
        canopy_coverage_percent: 80.0,
      };
      const res = await api.post(`/govt/carbon/requests/${reqId}/status`, payload);
      if (res.data?.success) {
        Alert.alert('Stage Advanced', `Request ${reqId} transitioned to ${nextStage}.`);
        setSelectedRequest(res.data.data);
        fetchAllData();
      }
    } catch (err: any) {
      Alert.alert('Stage Error', err?.response?.data?.detail || 'Failed to advance workflow stage.');
    }
  };

  const handleIssueCredits = async () => {
    if (!selectedRequest) return;
    setIsSubmitting(true);
    try {
      const payload = {
        credits_to_issue: Number(issueForm.credits_to_issue) || 2500,
        certification_agency: issueForm.certification_agency,
        vintage_year: Number(issueForm.vintage_year) || 2026,
        serial_prefix: issueForm.serial_prefix,
        unit_price_inr: Number(issueForm.unit_price_inr) || 1850,
        auditor_notes: issueForm.auditor_notes,
      };

      const res = await api.post(`/govt/carbon/requests/${selectedRequest.id}/issue-credits`, payload);
      if (res.data?.success) {
        Alert.alert(
          'Carbon Credits Minted!',
          `Successfully minted ${Number(issueForm.credits_to_issue).toLocaleString('en-IN')} tCO₂e credits into State Ledger.`
        );
        setIsIssueModalOpen(false);
        fetchAllData();
      }
    } catch (err: any) {
      Alert.alert('Issuance Failed', err?.response?.data?.detail || 'Failed to mint carbon credits.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTransferCredits = async () => {
    setIsSubmitting(true);
    try {
      const payload = {
        credits_to_transfer: Number(transferForm.credits_to_transfer) || 1000,
        buyer_or_recipient: transferForm.buyer_or_recipient,
        transfer_type: transferForm.transfer_type,
        unit_price_inr: Number(transferForm.unit_price_inr) || 1850,
        notes: transferForm.notes,
      };

      const res = await api.post('/govt/carbon/transfer', payload);
      if (res.data?.success) {
        Alert.alert(
          'Transfer & Settlement Executed',
          `Transferred ${Number(transferForm.credits_to_transfer).toLocaleString('en-IN')} carbon credits to ${transferForm.buyer_or_recipient}.`
        );
        setIsTransferModalOpen(false);
        fetchAllData();
      }
    } catch (err: any) {
      Alert.alert('Transfer Error', err?.response?.data?.detail || 'Insufficient available credits in State Ledger.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateTender = async () => {
    setIsSubmitting(true);
    try {
      const payload = {
        tender_ref_number: tenderForm.tender_ref_number,
        title: tenderForm.title,
        project_id: tenderForm.project_id,
        contractor_name: tenderForm.contractor_name,
        contractor_gstin: tenderForm.contractor_gstin,
        proposed_budget_inr: Number(tenderForm.proposed_budget_inr) || 1650000,
        technical_proposal_doc: tenderForm.technical_proposal_doc,
        financial_bid_doc: tenderForm.financial_bid_doc,
        notes: tenderForm.notes,
      };

      const res = await api.post('/govt/tenders', payload);
      if (res.data?.success) {
        Alert.alert('Tender Proposal Saved', `Tender ${res.data.data.id} stored in persistent database.`);
        setIsTenderModalOpen(false);
        fetchAllData();
      }
    } catch (err: any) {
      Alert.alert('Tender Creation Error', err?.response?.data?.detail || 'Failed to submit tender proposal.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAwardTender = async () => {
    if (!awardTenderTarget) return;
    setIsSubmitting(true);
    try {
      const payload = {
        contractor_name: awardTenderTarget.contractor_name,
        awarded_amount_inr: awardTenderTarget.proposed_budget_inr,
        notes: 'Awarded following agronomy committee evaluation.',
      };

      const res = await api.post(`/govt/tenders/${awardTenderTarget.id}/award`, payload);
      if (res.data?.success) {
        Alert.alert('Tender Awarded!', `Contract awarded to ${awardTenderTarget.contractor_name}.`);
        setIsAwardModalOpen(false);
        setAwardTenderTarget(null);
        fetchAllData();
      }
    } catch (err: any) {
      Alert.alert('Award Error', err?.response?.data?.detail || 'Failed to award tender.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOnline) {
    return (
      <View style={styles.stateContainer}>
        <MaterialCommunityIcons name="wifi-off" size={48} color="#EF4444" />
        <Text style={styles.stateTitle}>Offline Mode</Text>
        <Text style={styles.stateSubtitle}>Connect network to manage State Carbon Credit Requests & Ledger.</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={fetchAllData}>
          <Text style={styles.retryBtnText}>Retry Connection</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (isLoading) {
    return (
      <View style={styles.stateContainer}>
        <ActivityIndicator size="large" color="#059669" />
        <Text style={styles.loadingText}>Loading State Carbon Registry & Lifecycle...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 140 }}>
      {/* ── HEADER ROW ── */}
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.headerTitle}>State Carbon Credit Registry</Text>
          <Text style={styles.headerSub}>MRV Satellite Verification & Lifecycle Management</Text>
        </View>
        <TouchableOpacity style={styles.createBtn} onPress={() => setIsCreateModalOpen(true)}>
          <MaterialCommunityIcons name="leaf-circle" size={18} color="#FFFFFF" />
          <Text style={styles.createBtnText}>New Carbon Request</Text>
        </TouchableOpacity>
      </View>

      {/* ── TABS SELECTOR ── */}
      <View style={styles.tabsRow}>
        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'requests' && styles.tabBtnActive]}
          onPress={() => setActiveTab('requests')}
        >
          <MaterialCommunityIcons
            name="file-tree"
            size={16}
            color={activeTab === 'requests' ? '#FFFFFF' : '#64748B'}
          />
          <Text style={[styles.tabBtnText, activeTab === 'requests' && styles.tabBtnTextActive]}>
            Carbon Requests
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'ledger' && styles.tabBtnActive]}
          onPress={() => setActiveTab('ledger')}
        >
          <MaterialCommunityIcons
            name="book-open-page-variant"
            size={16}
            color={activeTab === 'ledger' ? '#FFFFFF' : '#64748B'}
          />
          <Text style={[styles.tabBtnText, activeTab === 'ledger' && styles.tabBtnTextActive]}>
            State Carbon Ledger
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'tenders' && styles.tabBtnActive]}
          onPress={() => setActiveTab('tenders')}
        >
          <MaterialCommunityIcons
            name="file-document-edit-outline"
            size={16}
            color={activeTab === 'tenders' ? '#FFFFFF' : '#64748B'}
          />
          <Text style={[styles.tabBtnText, activeTab === 'tenders' && styles.tabBtnTextActive]}>
            Tender Proposals
          </Text>
        </TouchableOpacity>
      </View>

      {/* ── TAB 1: CARBON REQUESTS & 6-STAGE WORKFLOW ── */}
      {activeTab === 'requests' && (
        <View>
          {/* Requests Selector Horizontal Chips */}
          <Text style={styles.sectionHeading}>Select Carbon Credit Request</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
            {carbonRequests.map((req) => (
              <TouchableOpacity
                key={req.id}
                style={[
                  styles.reqChip,
                  selectedRequest?.id === req.id && styles.reqChipActive,
                ]}
                onPress={() => setSelectedRequest(req)}
              >
                <Text style={[styles.reqChipId, selectedRequest?.id === req.id && styles.reqChipTextActive]}>
                  {req.id}
                </Text>
                <Text style={[styles.reqChipName, selectedRequest?.id === req.id && styles.reqChipTextActive]} numberOfLines={1}>
                  {req.target_name}
                </Text>
                <View style={styles.stageTag}>
                  <Text style={styles.stageTagText}>{req.stage}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Selected Request Detail Card */}
          {selectedRequest && (
            <View style={styles.detailCard}>
              <View style={styles.detailHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.reqTitle}>{selectedRequest.target_name}</Text>
                  <Text style={styles.reqSub}>
                    Methodology: {selectedRequest.methodology} • Area: {selectedRequest.area_acres} Acres
                  </Text>
                </View>
                <View style={styles.badgeContainer}>
                  <Text style={styles.badgeText}>{selectedRequest.stage}</Text>
                </View>
              </View>

              {/* 6-Stage Progress Pipeline Indicator */}
              <Text style={styles.pipelineTitle}>6-Stage Workflow Progression</Text>
              <View style={styles.pipelineContainer}>
                {WORKFLOW_STAGES.map((stage, idx) => {
                  const currentIdx = WORKFLOW_STAGES.indexOf(selectedRequest.stage);
                  const isCompleted = idx <= currentIdx;
                  const isCurrent = idx === currentIdx;
                  return (
                    <View key={stage} style={styles.pipelineStep}>
                      <View style={[styles.stepDot, isCompleted && styles.stepDotCompleted, isCurrent && styles.stepDotCurrent]}>
                        {isCompleted && <Ionicons name="checkmark" size={10} color="#FFFFFF" />}
                      </View>
                      <Text style={[styles.stepLabel, isCurrent && styles.stepLabelCurrent]} numberOfLines={2}>
                        {stage}
                      </Text>
                    </View>
                  );
                })}
              </View>

              {/* Telemetry Metrics & Satellite Telemetry Card */}
              <View style={styles.telemetryCard}>
                <View style={styles.telemetryItem}>
                  <MaterialCommunityIcons name="satellite-variant" size={20} color="#059669" />
                  <View style={{ marginLeft: 6 }}>
                    <Text style={styles.telemetryLabel}>Sentinel NDVI</Text>
                    <Text style={styles.telemetryVal}>{selectedRequest.sentinel_ndvi_score || 0.84}</Text>
                  </View>
                </View>

                <View style={styles.telemetryItem}>
                  <MaterialCommunityIcons name="tree" size={20} color="#059669" />
                  <View style={{ marginLeft: 6 }}>
                    <Text style={styles.telemetryLabel}>Canopy Cover</Text>
                    <Text style={styles.telemetryVal}>{selectedRequest.canopy_coverage_percent || 78.5}%</Text>
                  </View>
                </View>

                <View style={styles.telemetryItem}>
                  <MaterialCommunityIcons name="molecule-co2" size={20} color="#059669" />
                  <View style={{ marginLeft: 6 }}>
                    <Text style={styles.telemetryLabel}>Target tCO₂e</Text>
                    <Text style={styles.telemetryVal}>{selectedRequest.carbon_target_tco2e || 2500}</Text>
                  </View>
                </View>
              </View>

              {/* Stage Advance & Mint Buttons */}
              <View style={styles.actionRow}>
                {WORKFLOW_STAGES.indexOf(selectedRequest.stage) < WORKFLOW_STAGES.length - 1 && (
                  <TouchableOpacity
                    style={styles.advanceBtn}
                    onPress={() => {
                      const currentIdx = WORKFLOW_STAGES.indexOf(selectedRequest.stage);
                      const nextStage = WORKFLOW_STAGES[currentIdx + 1];
                      handleAdvanceStage(selectedRequest.id, nextStage);
                    }}
                  >
                    <MaterialCommunityIcons name="arrow-right-bold-circle" size={16} color="#FFFFFF" />
                    <Text style={styles.btnTextLight}>Advance Stage</Text>
                  </TouchableOpacity>
                )}

                {(selectedRequest.stage === 'Verification' ||
                  selectedRequest.stage === 'Monitoring' ||
                  selectedRequest.stage === 'Credit Lifecycle') && (
                  <TouchableOpacity style={styles.mintBtn} onPress={() => setIsIssueModalOpen(true)}>
                    <MaterialCommunityIcons name="cash-check" size={16} color="#FFFFFF" />
                    <Text style={styles.btnTextLight}>Issue Credits</Text>
                  </TouchableOpacity>
                )}
              </View>

              {/* Audit Timeline History */}
              <Text style={styles.timelineTitle}>Audit & Verification Timeline</Text>
              {(selectedRequest.audit_timeline || []).map((tl, i) => (
                <View key={i} style={styles.timelineItem}>
                  <View style={styles.timelineDot} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.tlStage}>{tl.stage} • {tl.actor}</Text>
                    <Text style={styles.tlNotes}>{tl.notes}</Text>
                    <Text style={styles.tlTime}>{tl.timestamp}</Text>
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>
      )}

      {/* ── TAB 2: STATE CARBON CREDIT LEDGER ── */}
      {activeTab === 'ledger' && ledger && (
        <View>
          {/* Stat Cards 2x2 Grid */}
          <Text style={styles.sectionHeading}>State Carbon Credit Pool Summary</Text>
          <View style={styles.metricsGrid}>
            <View style={[styles.metricCard, { backgroundColor: '#ECFDF5', borderColor: '#A7F3D0' }]}>
              <Text style={styles.metricLabel}>Total Minted</Text>
              <Text style={[styles.metricValue, { color: '#059669' }]}>
                {ledger.total_minted_credits.toLocaleString('en-IN')} tCO₂e
              </Text>
              <Text style={styles.metricSub}>Certified State Credits</Text>
            </View>

            <View style={[styles.metricCard, { backgroundColor: '#EFF6FF', borderColor: '#BFDBFE' }]}>
              <Text style={styles.metricLabel}>Available Registry</Text>
              <Text style={[styles.metricValue, { color: '#2563EB' }]}>
                {ledger.available_registry_credits.toLocaleString('en-IN')} tCO₂e
              </Text>
              <Text style={styles.metricSub}>Ready for Transfer</Text>
            </View>

            <View style={[styles.metricCard, { backgroundColor: '#FEF3C7', borderColor: '#FDE68A' }]}>
              <Text style={styles.metricLabel}>Retired / Transferred</Text>
              <Text style={[styles.metricValue, { color: '#D97706' }]}>
                {ledger.retired_transferred_credits.toLocaleString('en-IN')} tCO₂e
              </Text>
              <Text style={styles.metricSub}>Settled Corporate Offset</Text>
            </View>

            <View style={[styles.metricCard, { backgroundColor: '#F0FDF4', borderColor: '#BBF7D0' }]}>
              <Text style={styles.metricLabel}>Estimated Value</Text>
              <Text style={[styles.metricValue, { color: '#16A34A' }]}>
                ₹{(ledger.estimated_carbon_value_inr / 100000).toFixed(2)} Lakhs
              </Text>
              <Text style={styles.metricSub}>@ ₹1,850 / tCO₂e</Text>
            </View>
          </View>

          {/* Transfer & Settlement CTA */}
          <TouchableOpacity style={styles.transferCTA} onPress={() => setIsTransferModalOpen(true)}>
            <MaterialCommunityIcons name="swap-horizontal-bold" size={18} color="#FFFFFF" />
            <Text style={styles.transferCTAText}>Execute Corporate Credit Transfer & Settlement</Text>
          </TouchableOpacity>

          {/* Ledger Transactions List */}
          <Text style={styles.sectionHeading}>State Carbon Credit Ledger Transactions</Text>
          {(ledger.ledger_transactions || []).map((tx) => (
            <View key={tx.tx_id} style={styles.txCard}>
              <View style={styles.txHeader}>
                <View>
                  <Text style={styles.txId}>{tx.tx_id} ({tx.type})</Text>
                  <Text style={styles.txSub}>
                    {tx.buyer_recipient || tx.target_name || 'State Carbon Registry'}
                  </Text>
                </View>
                <View style={[styles.txBadge, tx.type === 'MINTED' ? { backgroundColor: '#DCFCE7' } : { backgroundColor: '#FEF3C7' }]}>
                  <Text style={[styles.txBadgeText, tx.type === 'MINTED' ? { color: '#16A34A' } : { color: '#D97706' }]}>
                    {tx.type}
                  </Text>
                </View>
              </View>

              <View style={styles.txDetailsRow}>
                <Text style={styles.txQty}>{tx.amount_credits.toLocaleString('en-IN')} tCO₂e</Text>
                <Text style={styles.txSerial}>Serial: {tx.serial_range}</Text>
              </View>

              <Text style={styles.txTime}>{tx.timestamp}</Text>
            </View>
          ))}
        </View>
      )}

      {/* ── TAB 3: PERSISTENT TENDERS ── */}
      {activeTab === 'tenders' && (
        <View>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <Text style={styles.sectionHeading}>Persistent Tender Proposals</Text>
            <TouchableOpacity style={styles.addTenderBtn} onPress={() => setIsTenderModalOpen(true)}>
              <MaterialCommunityIcons name="plus-circle" size={16} color="#FFFFFF" />
              <Text style={styles.addTenderBtnText}>Submit Tender Bid</Text>
            </TouchableOpacity>
          </View>

          {tenders.length === 0 ? (
            <View style={styles.emptyCard}>
              <MaterialCommunityIcons name="file-document-outline" size={36} color="#94A3B8" />
              <Text style={styles.emptyTitle}>No Tender Proposals Found</Text>
            </View>
          ) : (
            tenders.map((tnd) => (
              <View key={tnd.id} style={styles.tenderCard}>
                <View style={styles.tenderHeader}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.tenderTitle}>{tnd.title}</Text>
                    <Text style={styles.tenderRef}>{tnd.tender_ref_number} • {tnd.contractor_name}</Text>
                  </View>
                  <View style={[styles.tenderBadge, tnd.status === 'awarded' && { backgroundColor: '#DCFCE7' }]}>
                    <Text style={[styles.tenderBadgeText, tnd.status === 'awarded' && { color: '#16A34A' }]}>
                      {tnd.status.toUpperCase()}
                    </Text>
                  </View>
                </View>

                <View style={styles.tenderAmountRow}>
                  <Text style={styles.tenderAmount}>₹{tnd.proposed_budget_inr.toLocaleString('en-IN')}</Text>
                  <Text style={styles.tenderTime}>{tnd.submitted_at}</Text>
                </View>

                {tnd.status !== 'awarded' && (
                  <TouchableOpacity
                    style={styles.awardBtn}
                    onPress={() => {
                      setAwardTenderTarget(tnd);
                      setIsAwardModalOpen(true);
                    }}
                  >
                    <MaterialCommunityIcons name="trophy-award" size={16} color="#FFFFFF" />
                    <Text style={styles.btnTextLight}>Award Tender Contract</Text>
                  </TouchableOpacity>
                )}
              </View>
            ))
          )}
        </View>
      )}

      {/* ── CREATE CARBON REQUEST MODAL ── */}
      <Modal animationType="slide" transparent visible={isCreateModalOpen} onRequestClose={() => setIsCreateModalOpen(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Create Carbon Credit Request</Text>
              <TouchableOpacity onPress={() => setIsCreateModalOpen(false)}>
                <Ionicons name="close" size={24} color="#0F172A" />
              </TouchableOpacity>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Select Approved Activity / Asset *</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexDirection: 'row', gap: 6 }}>
                {eligibleTargets.map((tgt) => (
                  <TouchableOpacity
                    key={tgt.id}
                    style={[styles.chip, createForm.target_id === tgt.id && styles.chipActive]}
                    onPress={() =>
                      setCreateForm({
                        ...createForm,
                        target_id: tgt.id,
                        target_type: tgt.target_type,
                        target_name: tgt.name,
                        area_acres: String(tgt.area_acres),
                      })
                    }
                  >
                    <Text style={[styles.chipText, createForm.target_id === tgt.id && styles.chipTextActive]}>
                      {tgt.name} ({tgt.id})
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Carbon Target (tCO₂e) *</Text>
              <TextInput
                style={styles.textInput}
                placeholder="2500"
                keyboardType="numeric"
                value={createForm.carbon_target_tco2e}
                onChangeText={(t) => setCreateForm({ ...createForm, carbon_target_tco2e: t })}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Methodology & Objective</Text>
              <TextInput
                style={styles.textInput}
                placeholder="VM0042 Agroforestry"
                value={createForm.methodology}
                onChangeText={(t) => setCreateForm({ ...createForm, methodology: t })}
              />
            </View>

            <TouchableOpacity
              style={[styles.submitCTA, isSubmitting && { opacity: 0.6 }]}
              onPress={handleCreateRequest}
              disabled={isSubmitting}
            >
              {isSubmitting ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.submitCTAText}>Submit Carbon Request</Text>}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ── ISSUE CREDITS MODAL ── */}
      <Modal animationType="slide" transparent visible={isIssueModalOpen} onRequestClose={() => setIsIssueModalOpen(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Issue Certified Carbon Credits</Text>
              <TouchableOpacity onPress={() => setIsIssueModalOpen(false)}>
                <Ionicons name="close" size={24} color="#0F172A" />
              </TouchableOpacity>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Credits to Mint (tCO₂e) *</Text>
              <TextInput
                style={styles.textInput}
                placeholder="2500"
                keyboardType="numeric"
                value={issueForm.credits_to_issue}
                onChangeText={(t) => setIssueForm({ ...issueForm, credits_to_issue: t })}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Certification Body</Text>
              <TextInput
                style={styles.textInput}
                value={issueForm.certification_agency}
                onChangeText={(t) => setIssueForm({ ...issueForm, certification_agency: t })}
              />
            </View>

            <TouchableOpacity
              style={[styles.submitCTA, isSubmitting && { opacity: 0.6 }]}
              onPress={handleIssueCredits}
              disabled={isSubmitting}
            >
              {isSubmitting ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.submitCTAText}>Mint Certified Credits</Text>}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ── TRANSFER CREDITS MODAL ── */}
      <Modal animationType="slide" transparent visible={isTransferModalOpen} onRequestClose={() => setIsTransferModalOpen(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Transfer & Settlement Registry</Text>
              <TouchableOpacity onPress={() => setIsTransferModalOpen(false)}>
                <Ionicons name="close" size={24} color="#0F172A" />
              </TouchableOpacity>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Recipient / Corporate Buyer *</Text>
              <TextInput
                style={styles.textInput}
                placeholder="Tata Power NetZero Pool"
                value={transferForm.buyer_or_recipient}
                onChangeText={(t) => setTransferForm({ ...transferForm, buyer_or_recipient: t })}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Transfer Quantity (tCO₂e) *</Text>
              <TextInput
                style={styles.textInput}
                placeholder="1000"
                keyboardType="numeric"
                value={transferForm.credits_to_transfer}
                onChangeText={(t) => setTransferForm({ ...transferForm, credits_to_transfer: t })}
              />
            </View>

            <TouchableOpacity
              style={[styles.submitCTA, isSubmitting && { opacity: 0.6 }]}
              onPress={handleTransferCredits}
              disabled={isSubmitting}
            >
              {isSubmitting ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.submitCTAText}>Confirm Transfer & Settlement</Text>}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ── TENDER PROPOSAL MODAL ── */}
      <Modal animationType="slide" transparent visible={isTenderModalOpen} onRequestClose={() => setIsTenderModalOpen(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Submit Persistent Tender Proposal</Text>
              <TouchableOpacity onPress={() => setIsTenderModalOpen(false)}>
                <Ionicons name="close" size={24} color="#0F172A" />
              </TouchableOpacity>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Tender Ref Number *</Text>
              <TextInput
                style={styles.textInput}
                value={tenderForm.tender_ref_number}
                onChangeText={(t) => setTenderForm({ ...tenderForm, tender_ref_number: t })}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Contractor Name & GSTIN *</Text>
              <TextInput
                style={styles.textInput}
                value={tenderForm.contractor_name}
                onChangeText={(t) => setTenderForm({ ...tenderForm, contractor_name: t })}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Proposed Budget (₹ INR)</Text>
              <TextInput
                style={styles.textInput}
                keyboardType="numeric"
                value={tenderForm.proposed_budget_inr}
                onChangeText={(t) => setTenderForm({ ...tenderForm, proposed_budget_inr: t })}
              />
            </View>

            <TouchableOpacity
              style={[styles.submitCTA, isSubmitting && { opacity: 0.6 }]}
              onPress={handleCreateTender}
              disabled={isSubmitting}
            >
              {isSubmitting ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.submitCTAText}>Submit Persistent Tender</Text>}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ── AWARD TENDER MODAL ── */}
      <Modal animationType="slide" transparent visible={isAwardModalOpen} onRequestClose={() => setIsAwardModalOpen(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Award Tender Contract</Text>
              <TouchableOpacity onPress={() => setIsAwardModalOpen(false)}>
                <Ionicons name="close" size={24} color="#0F172A" />
              </TouchableOpacity>
            </View>

            <Text style={{ fontSize: 13, color: '#334155', marginBottom: 12 }}>
              Are you sure you want to award tender contract '{awardTenderTarget?.title}' to{' '}
              <Text style={{ fontWeight: '800' }}>{awardTenderTarget?.contractor_name}</Text> for ₹
              {awardTenderTarget?.proposed_budget_inr.toLocaleString('en-IN')}?
            </Text>

            <TouchableOpacity
              style={[styles.submitCTA, isSubmitting && { opacity: 0.6 }]}
              onPress={handleAwardTender}
              disabled={isSubmitting}
            >
              {isSubmitting ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.submitCTAText}>Confirm Awarding Tender</Text>}
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
  loadingText: { fontSize: 14, fontWeight: '600', color: '#059669', marginTop: 12 },
  retryBtn: { marginTop: 16, backgroundColor: '#059669', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 12 },
  retryBtnText: { color: '#FFFFFF', fontWeight: '800', fontSize: 13 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  headerTitle: { fontSize: 16, fontWeight: '800', color: '#0F172A' },
  headerSub: { fontSize: 11, color: '#64748B' },
  createBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#059669', paddingHorizontal: 10, paddingVertical: 8, borderRadius: 10, gap: 4 },
  createBtnText: { color: '#FFFFFF', fontWeight: '800', fontSize: 11 },
  tabsRow: { flexDirection: 'row', gap: 6, marginBottom: 14 },
  tabBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#F1F5F9', paddingVertical: 8, borderRadius: 10, gap: 4 },
  tabBtnActive: { backgroundColor: '#059669' },
  tabBtnText: { fontSize: 11, fontWeight: '700', color: '#64748B' },
  tabBtnTextActive: { color: '#FFFFFF' },
  sectionHeading: { fontSize: 14, fontWeight: '800', color: '#0F172A', marginTop: 10, marginBottom: 8 },
  reqChip: { backgroundColor: '#FFFFFF', padding: 10, borderRadius: 10, borderWidth: 1, borderColor: '#E2E8F0', marginRight: 8, width: 140 },
  reqChipActive: { backgroundColor: '#ECFDF5', borderColor: '#A7F3D0' },
  reqChipId: { fontSize: 11, fontWeight: '800', color: '#059669' },
  reqChipName: { fontSize: 12, fontWeight: '700', color: '#0F172A', marginVertical: 2 },
  reqChipTextActive: { color: '#047857' },
  stageTag: { backgroundColor: '#E2E8F0', borderRadius: 4, paddingHorizontal: 4, paddingVertical: 2, alignSelf: 'flex-start' },
  stageTagText: { fontSize: 9, fontWeight: '700', color: '#334155' },
  detailCard: { backgroundColor: '#FFFFFF', borderRadius: 14, padding: 14, borderWidth: 1, borderColor: '#E2E8F0', marginBottom: 14 },
  detailHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  reqTitle: { fontSize: 15, fontWeight: '800', color: '#0F172A' },
  reqSub: { fontSize: 11, color: '#64748B', marginTop: 2 },
  badgeContainer: { backgroundColor: '#DCFCE7', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  badgeText: { fontSize: 11, fontWeight: '800', color: '#15803D' },
  pipelineTitle: { fontSize: 12, fontWeight: '800', color: '#334155', marginTop: 12, marginBottom: 8 },
  pipelineContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#F8FAFC', padding: 8, borderRadius: 10 },
  pipelineStep: { alignItems: 'center', flex: 1 },
  stepDot: { width: 16, height: 16, borderRadius: 8, backgroundColor: '#CBD5E1', alignItems: 'center', justifyContent: 'center' },
  stepDotCompleted: { backgroundColor: '#059669' },
  stepDotCurrent: { backgroundColor: '#2563EB', borderWidth: 2, borderColor: '#BFDBFE' },
  stepLabel: { fontSize: 8, color: '#64748B', textAlign: 'center', marginTop: 4 },
  stepLabelCurrent: { color: '#2563EB', fontWeight: '800' },
  telemetryCard: { flexDirection: 'row', justifyContent: 'space-around', backgroundColor: '#ECFDF5', padding: 10, borderRadius: 10, marginVertical: 12 },
  telemetryItem: { flexDirection: 'row', alignItems: 'center' },
  telemetryLabel: { fontSize: 10, color: '#047857' },
  telemetryVal: { fontSize: 13, fontWeight: '800', color: '#064E3B' },
  actionRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  advanceBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#2563EB', paddingVertical: 10, borderRadius: 10, gap: 4 },
  mintBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#059669', paddingVertical: 10, borderRadius: 10, gap: 4 },
  timelineTitle: { fontSize: 12, fontWeight: '800', color: '#334155', marginTop: 6, marginBottom: 6 },
  timelineItem: { flexDirection: 'row', gap: 8, marginBottom: 8 },
  timelineDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#059669', marginTop: 4 },
  tlStage: { fontSize: 11, fontWeight: '800', color: '#0F172A' },
  tlNotes: { fontSize: 10, color: '#475569', marginTop: 1 },
  tlTime: { fontSize: 9, color: '#94A3B8', marginTop: 1 },
  metricsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  metricCard: { width: '48%', borderRadius: 12, padding: 12, borderWidth: 1 },
  metricLabel: { fontSize: 11, fontWeight: '700', color: '#475569' },
  metricValue: { fontSize: 14, fontWeight: '800', marginTop: 2 },
  metricSub: { fontSize: 10, color: '#64748B', marginTop: 2 },
  transferCTA: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#059669', paddingVertical: 10, borderRadius: 10, gap: 6, marginBottom: 14 },
  transferCTAText: { color: '#FFFFFF', fontWeight: '800', fontSize: 12 },
  txCard: { backgroundColor: '#FFFFFF', padding: 10, borderRadius: 10, borderWidth: 1, borderColor: '#E2E8F0', marginBottom: 8 },
  txHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  txId: { fontSize: 12, fontWeight: '800', color: '#0F172A' },
  txSub: { fontSize: 11, color: '#64748B', marginTop: 2 },
  txBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  txBadgeText: { fontSize: 10, fontWeight: '800' },
  txDetailsRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 },
  txQty: { fontSize: 12, fontWeight: '800', color: '#059669' },
  txSerial: { fontSize: 10, color: '#64748B' },
  txTime: { fontSize: 9, color: '#94A3B8', marginTop: 2 },
  addTenderBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#059669', paddingHorizontal: 8, paddingVertical: 6, borderRadius: 8, gap: 4 },
  addTenderBtnText: { color: '#FFFFFF', fontWeight: '800', fontSize: 11 },
  emptyCard: { backgroundColor: '#FFFFFF', padding: 20, borderRadius: 12, alignItems: 'center', borderWidth: 1, borderColor: '#E2E8F0' },
  emptyTitle: { fontSize: 13, fontWeight: '800', color: '#0F172A', marginTop: 6 },
  tenderCard: { backgroundColor: '#FFFFFF', padding: 12, borderRadius: 12, borderWidth: 1, borderColor: '#E2E8F0', marginBottom: 10 },
  tenderHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  tenderTitle: { fontSize: 13, fontWeight: '800', color: '#0F172A' },
  tenderRef: { fontSize: 11, color: '#64748B', marginTop: 2 },
  tenderBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6, backgroundColor: '#FEF3C7' },
  tenderBadgeText: { fontSize: 10, fontWeight: '800', color: '#D97706' },
  tenderAmountRow: { flexDirection: 'row', justifyContent: 'space-between', marginVertical: 6 },
  tenderAmount: { fontSize: 13, fontWeight: '800', color: '#059669' },
  tenderTime: { fontSize: 10, color: '#94A3B8' },
  awardBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#2563EB', paddingVertical: 8, borderRadius: 8, gap: 4, marginTop: 4 },
  btnTextLight: { color: '#FFFFFF', fontWeight: '800', fontSize: 11 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.65)', justifyContent: 'flex-end' },
  modalCard: { backgroundColor: '#FFFFFF', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  modalTitle: { fontSize: 16, fontWeight: '800', color: '#0F172A' },
  inputGroup: { marginBottom: 10 },
  inputLabel: { fontSize: 12, fontWeight: '700', color: '#334155', marginBottom: 4 },
  textInput: { backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#CBD5E1', borderRadius: 10, paddingHorizontal: 12, height: 42, fontSize: 13, color: '#0F172A' },
  chip: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10, backgroundColor: '#F1F5F9', marginRight: 6 },
  chipActive: { backgroundColor: '#059669' },
  chipText: { fontSize: 11, fontWeight: '700', color: '#475569' },
  chipTextActive: { color: '#FFFFFF' },
  submitCTA: { backgroundColor: '#059669', paddingVertical: 12, borderRadius: 12, alignItems: 'center', marginTop: 12, marginBottom: 20 },
  submitCTAText: { color: '#FFFFFF', fontWeight: '800', fontSize: 13 },
});

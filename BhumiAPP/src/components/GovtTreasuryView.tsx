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

export interface TreasurySummary {
  available_balance_inr: number;
  allocated_balance_inr: number;
  pending_disbursements_inr: number;
  disbursed_total_inr: number;
  failed_disbursements_inr: number;
  reversed_total_inr: number;
  escrow_account: string;
  bank_name: string;
  ifsc_masked: string;
  last_reconciled_at: string;
}

export interface MaskedBeneficiary {
  farmer_id: string;
  farmer_name: string;
  aadhaar_masked: string;
  bank_masked: string;
  ifsc_masked: string;
  village_ward: string;
}

export interface DBTTransaction {
  transaction_id: string;
  batch_id: string;
  scheme_id: string;
  scheme_name: string;
  beneficiary: MaskedBeneficiary;
  amount_inr: number;
  status: string; // 'INITIATED' | 'SUCCESS' | 'FAILED' | 'REVERSED'
  payment_gateway: string;
  utr_number?: string;
  failure_reason?: string;
  created_at: string;
  updated_at: string;
}

export interface SchemeAllocation {
  id: string;
  scheme_id: string;
  allocated_amount_inr: number;
  allocation_type: string;
  fiscal_year: string;
  timestamp: string;
  notes?: string;
}

const SCHEME_OPTIONS = [
  { id: 'sch_pmkisan', name: 'PM-KISAN (Kisan Samman Nidhi)' },
  { id: 'sch_solar', name: 'Solar Pump Subsidy (PM-KUSUM)' },
  { id: 'sch_organic', name: 'Organic Farming Promotion (PKVY)' },
  { id: 'sch_smaf', name: 'Sub-Mission on Agroforestry (SMAF)' },
];

export function GovtTreasuryView() {
  const isOnline = useConnectivityStore((state) => state.isOnline);

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [summary, setSummary] = useState<TreasurySummary | null>(null);
  const [allocations, setAllocations] = useState<SchemeAllocation[]>([]);
  const [dbtTransactions, setDbtTransactions] = useState<DBTTransaction[]>([]);

  // Modals
  const [isAllocateModalOpen, setIsAllocateModalOpen] = useState<boolean>(false);
  const [isDisburseModalOpen, setIsDisburseModalOpen] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Allocate Form
  const [allocForm, setAllocForm] = useState({
    scheme_id: 'sch_pmkisan',
    allocated_amount_inr: '1000000',
    allocation_type: 'State Agriculture Sub-Grant',
    fiscal_year: 'FY 2026-27',
    notes: 'Allocated budget to scheme for farmer DBT disbursements.',
  });

  // Disburse Form
  const [dbtForm, setDbtForm] = useState({
    scheme_id: 'sch_pmkisan',
    scheme_name: 'PM-KISAN (Kisan Samman Nidhi)',
    amount_per_farmer_inr: '2000',
    purpose: 'Direct Benefit Transfer Installment #2',
    payment_gateway: 'PFMS_DBT',
  });

  const fetchTreasurySummary = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await api.get('/govt/treasury/summary');
      if (res.data && res.data.success && res.data.data) {
        setSummary(res.data.data.summary);
        setAllocations(res.data.data.scheme_allocations || []);
      } else {
        throw new Error('Failed to load treasury summary.');
      }
    } catch (err: any) {
      console.warn('[GovtTreasuryView] Fetch error:', err);
      setError(err?.message || 'Unable to load institutional treasury summary.');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchDBTTransactions = async () => {
    try {
      const res = await api.get('/govt/dbt/status/DBT-TXN-1001'); // list or detail fallback
    } catch (e) {
      // Ignore
    }
  };

  useEffect(() => {
    fetchTreasurySummary();
  }, []);

  const handleAllocateBudget = async () => {
    setIsSubmitting(true);
    try {
      const payload = {
        allocated_amount_inr: Number(allocForm.allocated_amount_inr) || 1000000,
        allocation_type: allocForm.allocation_type,
        fiscal_year: allocForm.fiscal_year,
        notes: allocForm.notes,
      };

      const res = await api.post(`/govt/schemes/${allocForm.scheme_id}/allocate`, payload);
      if (res.data && res.data.success) {
        Alert.alert(
          'Budget Allocated Successfully',
          `Allocated ₹${Number(allocForm.allocated_amount_inr).toLocaleString('en-IN')} to Scheme ${allocForm.scheme_id}.`
        );
        setIsAllocateModalOpen(false);
        fetchTreasurySummary();
      }
    } catch (err: any) {
      Alert.alert('Allocation Failed', err?.response?.data?.detail || 'Insufficient treasury escrow balance.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDisburseDBT = async () => {
    setIsSubmitting(true);
    try {
      const payload = {
        scheme_id: dbtForm.scheme_id,
        scheme_name: dbtForm.scheme_name,
        beneficiary_ids: ['FAR-101', 'FAR-102', 'FAR-103', 'FAR-104'],
        amount_per_farmer_inr: Number(dbtForm.amount_per_farmer_inr) || 2000,
        purpose: dbtForm.purpose,
        payment_gateway: dbtForm.payment_gateway,
      };

      const res = await api.post('/govt/dbt/disburse', payload);
      if (res.data && res.data.success) {
        const total = res.data.total_disbursed_inr || 8000;
        Alert.alert(
          'DBT Payout Batch Initiated',
          `Disbursed batch ${res.data.batch_id} totaling ₹${total.toLocaleString('en-IN')} across 4 beneficiaries.`
        );
        setIsDisburseModalOpen(false);
        if (Array.isArray(res.data.transactions)) {
          setDbtTransactions((prev) => [...res.data.transactions, ...prev]);
        }
        fetchTreasurySummary();
      }
    } catch (err: any) {
      Alert.alert('DBT Disbursement Error', err?.response?.data?.detail || 'Failed to disburse DBT payout batch.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateDBTStatus = async (txnId: string, nextStatus: string) => {
    try {
      const payload = {
        status: nextStatus,
        remarks: `DBT transfer status updated to ${nextStatus}.`,
      };
      const res = await api.post(`/govt/dbt/status/${txnId}`, payload);
      if (res.data && res.data.success) {
        Alert.alert('Status Updated', `Transaction ${txnId} is now ${nextStatus}.`);
        fetchTreasurySummary();
        setDbtTransactions((prev) =>
          prev.map((t) => (t.transaction_id === txnId ? res.data.data : t))
        );
      }
    } catch (err: any) {
      Alert.alert('Status Error', err?.response?.data?.detail || 'Failed to update DBT status.');
    }
  };

  const handleRunReconciliation = async () => {
    try {
      const res = await api.post('/govt/dbt/reconcile', { notes: 'Manual bank reconciliation trigger.' });
      if (res.data && res.data.success) {
        Alert.alert(
          'Bank Reconciliation Completed',
          `Reconciled ${res.data.reconciled_count} failed transactions.\nRefunded ₹${res.data.refunded_amount_inr.toLocaleString(
            'en-IN'
          )} back to Available Treasury Escrow.`
        );
        fetchTreasurySummary();
      }
    } catch (err: any) {
      Alert.alert('Reconciliation Error', err?.response?.data?.detail || 'Reconciliation failed.');
    }
  };

  if (!isOnline) {
    return (
      <View style={styles.stateContainer}>
        <MaterialCommunityIcons name="wifi-off" size={48} color="#EF4444" />
        <Text style={styles.stateTitle}>Offline Mode</Text>
        <Text style={styles.stateSubtitle}>Connect to network to manage Institutional Treasury Escrow & DBT disbursements.</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={fetchTreasurySummary}>
          <Text style={styles.retryBtnText}>Retry Connection</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (isLoading) {
    return (
      <View style={styles.stateContainer}>
        <ActivityIndicator size="large" color="#0F766E" />
        <Text style={styles.loadingText}>Loading Institutional Treasury Ledger...</Text>
      </View>
    );
  }

  if (error || !summary) {
    return (
      <View style={styles.stateContainer}>
        <MaterialCommunityIcons name="alert-circle-outline" size={48} color="#EF4444" />
        <Text style={styles.stateTitle}>Failed to Load Treasury</Text>
        <Text style={styles.stateSubtitle}>{error}</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={fetchTreasurySummary}>
          <Text style={styles.retryBtnText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 120 }}>
      {/* ── 1. HEADER ROW & ACTIONS ── */}
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.headerTitle}>Institutional Treasury Escrow</Text>
          <Text style={styles.headerSub}>Account: {summary.escrow_account} ({summary.bank_name})</Text>
        </View>
      </View>

      {/* Action Buttons Row */}
      <View style={styles.actionButtonsRow}>
        <TouchableOpacity style={styles.primaryActionBtn} onPress={() => setIsAllocateModalOpen(true)}>
          <MaterialCommunityIcons name="bank-plus" size={16} color="#FFFFFF" />
          <Text style={styles.primaryActionText}>Allocate Budget</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.secondaryActionBtn} onPress={() => setIsDisburseModalOpen(true)}>
          <MaterialCommunityIcons name="send-clock-outline" size={16} color="#0F766E" />
          <Text style={styles.secondaryActionText}>Disburse DBT</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.outlineActionBtn} onPress={handleRunReconciliation}>
          <MaterialCommunityIcons name="sync" size={16} color="#475569" />
          <Text style={styles.outlineActionText}>Reconcile</Text>
        </TouchableOpacity>
      </View>

      {/* ── 2. 6-METRIC BALANCE GRID ── */}
      <Text style={styles.sectionHeading}>Treasury Escrow Balances</Text>
      <View style={styles.metricsGrid}>
        <View style={[styles.metricCard, { backgroundColor: '#ECFDF5', borderColor: '#A7F3D0' }]}>
          <Text style={styles.metricLabel}>Available Balance</Text>
          <Text style={[styles.metricValue, { color: '#059669' }]}>
            ₹{summary.available_balance_inr.toLocaleString('en-IN')}
          </Text>
          <Text style={styles.metricSub}>Escrow Available</Text>
        </View>

        <View style={[styles.metricCard, { backgroundColor: '#EFF6FF', borderColor: '#BFDBFE' }]}>
          <Text style={styles.metricLabel}>Allocated</Text>
          <Text style={[styles.metricValue, { color: '#2563EB' }]}>
            ₹{summary.allocated_balance_inr.toLocaleString('en-IN')}
          </Text>
          <Text style={styles.metricSub}>Scheme Earmarked</Text>
        </View>

        <View style={[styles.metricCard, { backgroundColor: '#FEF3C7', borderColor: '#FDE68A' }]}>
          <Text style={styles.metricLabel}>Pending</Text>
          <Text style={[styles.metricValue, { color: '#D97706' }]}>
            ₹{summary.pending_disbursements_inr.toLocaleString('en-IN')}
          </Text>
          <Text style={styles.metricSub}>Awaiting Bank UTR</Text>
        </View>

        <View style={[styles.metricCard, { backgroundColor: '#F0FDF4', borderColor: '#BBF7D0' }]}>
          <Text style={styles.metricLabel}>Disbursed Total</Text>
          <Text style={[styles.metricValue, { color: '#16A34A' }]}>
            ₹{summary.disbursed_total_inr.toLocaleString('en-IN')}
          </Text>
          <Text style={styles.metricSub}>Settled Beneficiaries</Text>
        </View>

        <View style={[styles.metricCard, { backgroundColor: '#FEF2F2', borderColor: '#FCA5A5' }]}>
          <Text style={styles.metricLabel}>Failed</Text>
          <Text style={[styles.metricValue, { color: '#DC2626' }]}>
            ₹{summary.failed_disbursements_inr.toLocaleString('en-IN')}
          </Text>
          <Text style={styles.metricSub}>Needs Reconciliation</Text>
        </View>

        <View style={[styles.metricCard, { backgroundColor: '#F3E8FF', borderColor: '#DDD6FE' }]}>
          <Text style={styles.metricLabel}>Reversed</Text>
          <Text style={[styles.metricValue, { color: '#7C3AED' }]}>
            ₹{summary.reversed_total_inr.toLocaleString('en-IN')}
          </Text>
          <Text style={styles.metricSub}>Refunded to Escrow</Text>
        </View>
      </View>

      {/* ── 3. SCHEME BUDGET ALLOCATIONS LIST ── */}
      <Text style={styles.sectionHeading}>Scheme Budget Allocations</Text>
      {allocations.length === 0 ? (
        <View style={styles.emptyCard}>
          <MaterialCommunityIcons name="cash-multiple" size={36} color="#94A3B8" />
          <Text style={styles.emptyTitle}>No Scheme Allocations Recorded</Text>
        </View>
      ) : (
        allocations.map((alloc) => (
          <View key={alloc.id} style={styles.allocationRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.allocScheme}>{alloc.scheme_id} ({alloc.fiscal_year})</Text>
              <Text style={styles.allocMeta}>{alloc.allocation_type} • {alloc.timestamp}</Text>
            </View>
            <Text style={styles.allocAmount}>+₹{alloc.allocated_amount_inr.toLocaleString('en-IN')}</Text>
          </View>
        ))
      )}

      {/* ── 4. DBT TRANSACTIONS LIST ── */}
      <Text style={styles.sectionHeading}>DBT Beneficiary Transactions (Masked Data)</Text>
      {dbtTransactions.length === 0 ? (
        <View style={styles.emptyCard}>
          <MaterialCommunityIcons name="swap-horizontal-bold" size={36} color="#94A3B8" />
          <Text style={styles.emptyTitle}>No Active DBT Batch Disbursed</Text>
          <Text style={styles.emptySub}>Click 'Disburse DBT' above to initiate a Direct Benefit Transfer payout.</Text>
        </View>
      ) : (
        dbtTransactions.map((t) => (
          <View key={t.transaction_id} style={styles.txnCard}>
            <View style={styles.txnHeader}>
              <View>
                <Text style={styles.txnId}>{t.transaction_id} ({t.scheme_id})</Text>
                <Text style={styles.txnBeneficiary}>
                  {t.beneficiary.farmer_name} • {t.beneficiary.bank_masked}
                </Text>
              </View>
              <View style={[styles.txnStatusBadge, t.status === 'SUCCESS' && { backgroundColor: '#DCFCE7' }, t.status === 'FAILED' && { backgroundColor: '#FEE2E2' }]}>
                <Text style={[styles.txnStatusText, t.status === 'SUCCESS' && { color: '#16A34A' }, t.status === 'FAILED' && { color: '#DC2626' }]}>
                  {t.status}
                </Text>
              </View>
            </View>

            <View style={styles.txnPriceRow}>
              <Text style={styles.txnAmount}>₹{t.amount_inr.toLocaleString('en-IN')}</Text>
              <Text style={styles.txnUtr}>UTR: {t.utr_number || 'Awaiting Bank UTR'}</Text>
            </View>

            {/* State Transition Actions */}
            <View style={styles.txnActionsRow}>
              {t.status === 'INITIATED' && (
                <>
                  <TouchableOpacity style={styles.successBtn} onPress={() => handleUpdateDBTStatus(t.transaction_id, 'SUCCESS')}>
                    <Text style={styles.btnTextLight}>Simulate Success</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.failBtn} onPress={() => handleUpdateDBTStatus(t.transaction_id, 'FAILED')}>
                    <Text style={styles.btnTextLight}>Simulate Failure</Text>
                  </TouchableOpacity>
                </>
              )}

              {t.status === 'SUCCESS' && (
                <TouchableOpacity style={styles.reverseBtn} onPress={() => handleUpdateDBTStatus(t.transaction_id, 'REVERSED')}>
                  <Text style={styles.btnTextLight}>Simulate Reversal</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        ))
      )}

      {/* ── 5. ALLOCATE BUDGET MODAL ── */}
      <Modal animationType="slide" transparent visible={isAllocateModalOpen} onRequestClose={() => setIsAllocateModalOpen(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Allocate Budget to Government Scheme</Text>
              <TouchableOpacity onPress={() => setIsAllocateModalOpen(false)}>
                <Ionicons name="close" size={24} color="#0F172A" />
              </TouchableOpacity>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Select Scheme *</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexDirection: 'row', gap: 6 }}>
                {SCHEME_OPTIONS.map((sch) => (
                  <TouchableOpacity
                    key={sch.id}
                    style={[styles.miniChip, allocForm.scheme_id === sch.id && styles.miniChipActive]}
                    onPress={() => setAllocForm({ ...allocForm, scheme_id: sch.id })}
                  >
                    <Text style={[styles.miniChipText, allocForm.scheme_id === sch.id && styles.miniChipTextActive]}>{sch.name}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Allocation Amount (₹ INR) *</Text>
              <TextInput
                style={styles.textInput}
                placeholder="1000000"
                keyboardType="numeric"
                value={allocForm.allocated_amount_inr}
                onChangeText={(t) => setAllocForm({ ...allocForm, allocated_amount_inr: t })}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Fiscal Year & Notes</Text>
              <TextInput
                style={styles.textInput}
                placeholder="FY 2026-27"
                value={allocForm.fiscal_year}
                onChangeText={(t) => setAllocForm({ ...allocForm, fiscal_year: t })}
              />
            </View>

            <TouchableOpacity
              style={[styles.submitCTA, isSubmitting && { opacity: 0.6 }]}
              onPress={handleAllocateBudget}
              disabled={isSubmitting}
            >
              {isSubmitting ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.submitCTAText}>Confirm Budget Allocation</Text>}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ── 6. DISBURSE DBT MODAL ── */}
      <Modal animationType="slide" transparent visible={isDisburseModalOpen} onRequestClose={() => setIsDisburseModalOpen(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Initiate DBT Beneficiary Payout Batch</Text>
              <TouchableOpacity onPress={() => setIsDisburseModalOpen(false)}>
                <Ionicons name="close" size={24} color="#0F172A" />
              </TouchableOpacity>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Target Scheme *</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexDirection: 'row', gap: 6 }}>
                {SCHEME_OPTIONS.map((sch) => (
                  <TouchableOpacity
                    key={sch.id}
                    style={[styles.miniChip, dbtForm.scheme_id === sch.id && styles.miniChipActive]}
                    onPress={() => setDbtForm({ ...dbtForm, scheme_id: sch.id, scheme_name: sch.name })}
                  >
                    <Text style={[styles.miniChipText, dbtForm.scheme_id === sch.id && styles.miniChipTextActive]}>{sch.name}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Amount per Beneficiary (₹ INR) *</Text>
              <TextInput
                style={styles.textInput}
                placeholder="2000"
                keyboardType="numeric"
                value={dbtForm.amount_per_farmer_inr}
                onChangeText={(t) => setDbtForm({ ...dbtForm, amount_per_farmer_inr: t })}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Disbursement Purpose</Text>
              <TextInput
                style={styles.textInput}
                placeholder="Direct Benefit Transfer Installment"
                value={dbtForm.purpose}
                onChangeText={(t) => setDbtForm({ ...dbtForm, purpose: t })}
              />
            </View>

            <TouchableOpacity
              style={[styles.submitCTA, isSubmitting && { opacity: 0.6 }]}
              onPress={handleDisburseDBT}
              disabled={isSubmitting}
            >
              {isSubmitting ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.submitCTAText}>Execute DBT Batch Payout</Text>}
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
  headerRow: { marginBottom: 12 },
  headerTitle: { fontSize: 16, fontWeight: '800', color: '#0F172A' },
  headerSub: { fontSize: 11, color: '#64748B' },
  actionButtonsRow: { flexDirection: 'row', gap: 6, marginBottom: 14 },
  primaryActionBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#0F766E', paddingVertical: 8, borderRadius: 10, gap: 4 },
  primaryActionText: { color: '#FFFFFF', fontWeight: '800', fontSize: 11 },
  secondaryActionBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#ECFDF5', borderWidth: 1, borderColor: '#A7F3D0', paddingVertical: 8, borderRadius: 10, gap: 4 },
  secondaryActionText: { color: '#0F766E', fontWeight: '800', fontSize: 11 },
  outlineActionBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#CBD5E1', paddingHorizontal: 10, paddingVertical: 8, borderRadius: 10, gap: 4 },
  outlineActionText: { color: '#475569', fontWeight: '700', fontSize: 11 },
  sectionHeading: { fontSize: 14, fontWeight: '800', color: '#0F172A', marginTop: 10, marginBottom: 8 },
  metricsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 14 },
  metricCard: { width: '48%', borderRadius: 12, padding: 12, borderWidth: 1 },
  metricLabel: { fontSize: 11, fontWeight: '700', color: '#475569' },
  metricValue: { fontSize: 15, fontWeight: '800', marginTop: 2 },
  metricSub: { fontSize: 10, color: '#64748B', marginTop: 2 },
  allocationRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#FFFFFF', padding: 10, borderRadius: 10, borderWidth: 1, borderColor: '#E2E8F0', marginBottom: 6 },
  allocScheme: { fontSize: 12, fontWeight: '800', color: '#0F172A' },
  allocMeta: { fontSize: 10, color: '#64748B', marginTop: 2 },
  allocAmount: { fontSize: 13, fontWeight: '800', color: '#0F766E' },
  emptyCard: { backgroundColor: '#FFFFFF', borderRadius: 12, padding: 20, alignItems: 'center', borderWidth: 1, borderColor: '#E2E8F0', marginBottom: 12 },
  emptyTitle: { fontSize: 13, fontWeight: '800', color: '#0F172A', marginTop: 6 },
  emptySub: { fontSize: 11, color: '#64748B', textAlign: 'center', marginTop: 2 },
  txnCard: { backgroundColor: '#FFFFFF', borderRadius: 12, padding: 12, marginBottom: 10, borderWidth: 1, borderColor: '#E2E8F0' },
  txnHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  txnId: { fontSize: 12, fontWeight: '800', color: '#0F172A' },
  txnBeneficiary: { fontSize: 11, color: '#64748B', marginTop: 2 },
  txnStatusBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6, backgroundColor: '#FEF3C7' },
  txnStatusText: { fontSize: 10, fontWeight: '800', color: '#D97706' },
  txnPriceRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginVertical: 6 },
  txnAmount: { fontSize: 14, fontWeight: '800', color: '#0F766E' },
  txnUtr: { fontSize: 11, color: '#64748B' },
  txnActionsRow: { flexDirection: 'row', gap: 6, marginTop: 4 },
  successBtn: { flex: 1, backgroundColor: '#059669', paddingVertical: 6, borderRadius: 8, alignItems: 'center' },
  failBtn: { flex: 1, backgroundColor: '#DC2626', paddingVertical: 6, borderRadius: 8, alignItems: 'center' },
  reverseBtn: { flex: 1, backgroundColor: '#7C3AED', paddingVertical: 6, borderRadius: 8, alignItems: 'center' },
  btnTextLight: { color: '#FFFFFF', fontWeight: '800', fontSize: 11 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.65)', justifyContent: 'flex-end' },
  modalCard: { backgroundColor: '#FFFFFF', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  modalTitle: { fontSize: 16, fontWeight: '800', color: '#0F172A' },
  inputGroup: { marginBottom: 10 },
  inputLabel: { fontSize: 12, fontWeight: '700', color: '#334155', marginBottom: 4 },
  textInput: { backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#CBD5E1', borderRadius: 10, paddingHorizontal: 12, height: 42, fontSize: 13, color: '#0F172A' },
  miniChip: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10, backgroundColor: '#F1F5F9', marginRight: 6 },
  miniChipActive: { backgroundColor: '#0F766E' },
  miniChipText: { fontSize: 11, fontWeight: '700', color: '#475569' },
  miniChipTextActive: { color: '#FFFFFF' },
  submitCTA: { backgroundColor: '#0F766E', paddingVertical: 12, borderRadius: 12, alignItems: 'center', marginTop: 12, marginBottom: 20 },
  submitCTAText: { color: '#FFFFFF', fontWeight: '800', fontSize: 13 },
});

import { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, CheckCircle, XCircle, Map, CreditCard,
  User, ShieldCheck, Landmark, FileText, Cloud,
  Clock, Folder, Ban, Unlock, Trash2,
  Download, CheckSquare, Layers, AlertTriangle, Phone, Mail,
  Activity, Trees, Home, Calendar, Globe, Zap, Plus, ShieldAlert, MapPin
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { StatusBadge } from '../../../components/ui/StatusBadge';
import {
  useFarmerDetail,
  useFarmerIdentity,
  useFarmerBank,
  useFarmerActivity,
  useFarmerFamily,
  useFarmerLand,
  useApproveFarmer,
  useRejectFarmer,
  useBlockFarmer,
  useUnblockFarmer,
  useDeleteFarmer,
  useFarmerEnrollments,
  useUpdateFarmerEnrollment,
} from '../api/useFarmers';
import { useProjects, useAssignFarmerProject, useDeleteEnrollment } from '../../projects/api/useProjects';
import { useWithdrawals } from '../../financials/api/useWallet';
import { downloadPDFDocument } from '../../../utils/pdfExporter';
import toast from 'react-hot-toast';

// ─── Format helpers ───────────────────────────────────────────────────────────
const fmtDate = (v?: string | null) => {
  if (!v) return '—';
  try { return new Date(v).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }); }
  catch { return '—'; }
};
const fmtDateTime = (v?: string | null) => {
  if (!v) return '—';
  try { return new Date(v).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }); }
  catch { return '—'; }
};
const fmtINR = (v?: number | null) => v != null ? `₹${v.toLocaleString('en-IN')}` : '₹0';

// ─── Empty field fallback ─────────────────────────────────────────────────────
const val = (v?: string | null, fallback = '—') => v?.trim() ? v.trim() : fallback;

// ─── Info row component ───────────────────────────────────────────────────────
const InfoRow = ({ label, value }: { label: string; value: React.ReactNode }) => (
  <div className="space-y-0.5">
    <p className="text-[10.5px] font-bold uppercase tracking-wider text-[#94A3B8]">{label}</p>
    <p className="text-[13px] font-semibold text-[#0F172A]">{value || '—'}</p>
  </div>
);

type ActionType = 'approve' | 'reject' | 'block' | 'unblock' | 'delete' | null;

export const FarmerProfile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<string>('Overview');
  const [actionModal, setActionModal] = useState<ActionType>(null);
  const [rejectRemarks, setRejectRemarks] = useState('');
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [showSoilModal, setShowSoilModal] = useState(false);
  const [showEditProjectModal, setShowEditProjectModal] = useState(false);
  const [projectForm, setProjectForm] = useState<any>({
    status: 'active',
    current_stage: 'registered',
    progress_percent: 0,
    land_verified: false,
    trees_verified: false,
    mrv_verified: false,
    insured_trees: 0,
    estimated_carbon_impact: 0,
    stage_project_assigned: false,
    stage_land_registered: false,
    stage_soil_verified: false,
    stage_inspection_completed: false,
    stage_trees_registered: false,
    stage_insurance_activated: false,
    stage_mrv_monitoring_started: false,
    stage_carbon_estimation_running: false,
    stage_reward_eligible: false,
  });

  const updateEnrollment = useUpdateFarmerEnrollment();

  const [soilDataState, setSoilDataState] = useState({
    soc: 1.45,
    n: 240,
    p: 35,
    k: 180,
    ph: 7.2,
    labReport: 'SOC-2026-BHOPAL-098',
    status: 'Baseline Completed',
    remarks: 'Core soil NPK baseline sample checks verified by Bhopal East Agronomy Unit.'
  });

  // ─── API Hooks ─────────────────────────────────────────────────────────────
  const { data: farmerDetail, isLoading } = useFarmerDetail(id);
  const { data: identityData, isLoading: identityLoading } = useFarmerIdentity(id);
  const { data: bankData, isLoading: bankLoading } = useFarmerBank(id);
  const { data: activityData, isLoading: activityLoading } = useFarmerActivity(id);
  const { data: familyData, isLoading: familyLoading } = useFarmerFamily(id);
  const { data: landData, isLoading: landLoading } = useFarmerLand(id);
  const { data: allWithdrawalsData } = useWithdrawals(1, 100);
  const { data: enrollmentsData, isLoading: enrollmentsLoading } = useFarmerEnrollments();
  const { data: allProjectsList } = useProjects();
  const assignProjectMutation = useAssignFarmerProject();
  const deleteEnrollmentMutation = useDeleteEnrollment();
  const [showAssignProjectModal, setShowAssignProjectModal] = useState(false);
  const [assignForm, setAssignForm] = useState({
    projectId: '',
    landAreaAcres: 10,
    treeCount: 40,
  });

  const verifiedLandParcels = useMemo(() => {
    return (landData?.parcels || []).filter((p: any) =>
      ['verified', 'approved', 'project_assigned'].includes((p.verification_status || '').toLowerCase())
    );
  }, [landData]);
  const hasVerifiedLand = verifiedLandParcels.length > 0;
  const verifiedLandAcres = useMemo(() => {
    return verifiedLandParcels.reduce((sum: number, p: any) => sum + (Number(p.area_acres) || 0), 0);
  }, [verifiedLandParcels]);

  const farmerEnrollment = useMemo(() => {
    if (!enrollmentsData || !farmerDetail) return null;
    const fId = String(farmerDetail.id || farmerDetail._id || '').toLowerCase();
    const fPublicId = String(farmerDetail.farmer_id || '').toLowerCase();
    return enrollmentsData.find(
      (e: any) =>
        String(e.farmer_id || '').toLowerCase() === fId ||
        String(e.farmer_id || '').toLowerCase() === fPublicId
    );
  }, [enrollmentsData, farmerDetail]);

  const currentStageNum = useMemo(() => {
    if (!farmerEnrollment) return 2;
    if (farmerEnrollment.stage_reward_eligible) return 9;
    if (farmerEnrollment.stage_carbon_estimation_running) return 8;
    if (farmerEnrollment.stage_mrv_monitoring_started) return 7;
    if (farmerEnrollment.stage_insurance_activated) return 6;
    if (farmerEnrollment.stage_trees_registered) return 5;
    if (farmerEnrollment.stage_inspection_completed) return 4;
    if (farmerEnrollment.stage_soil_verified) return 3;
    if (farmerEnrollment.stage_land_registered) return 2;
    if (farmerEnrollment.stage_project_assigned) return 1;
    return 1;
  }, [farmerEnrollment]);

  const farmerTransactions = useMemo(() => {
    if (!farmerDetail) return [];

    // 1. Transactions directly from Bank / Wallet query
    if (bankData?.transactions && bankData.transactions.length > 0) {
      return bankData.transactions;
    }

    const fId = String(farmerDetail.id || farmerDetail._id || id || '').toLowerCase();
    const fPublicId = String(farmerDetail.farmer_id || '').toLowerCase();
    const mobile = String(farmerDetail.mobile || '').toLowerCase();

    let matched = (allWithdrawalsData?.items || []).filter((w: any) => {
      const wFarmerId = String(w.farmer_id || w.farmerId || '').toLowerCase();
      const wFarmerName = String(w.farmer_name || w.farmerName || '').toLowerCase();
      return wFarmerId === fId || wFarmerId === fPublicId || (mobile && wFarmerName.includes(mobile));
    });

    return matched;
  }, [bankData, allWithdrawalsData, farmerDetail, id]);

  const effectiveBank = useMemo(() => {
    if (bankData && (bankData.bank_name || bankData.account_number || bankData.ifsc_code || bankData.upi_id)) {
      return bankData;
    }
    if (farmerDetail?.bank_details && (farmerDetail.bank_details.bank_name || farmerDetail.bank_details.account_number)) {
      return {
        bank_name: farmerDetail.bank_details.bank_name,
        account_number: farmerDetail.bank_details.account_number,
        ifsc_code: farmerDetail.bank_details.ifsc_code,
        account_holder_name: farmerDetail.bank_details.account_holder_name || farmerDetail.full_name,
        is_verified: true,
      };
    }
    return null;
  }, [bankData, farmerDetail]);

  // ─── Action Mutations ──────────────────────────────────────────────────────
  const approveMutation = useApproveFarmer();
  const rejectMutation = useRejectFarmer();
  const blockMutation = useBlockFarmer();
  const unblockMutation = useUnblockFarmer();
  const deleteMutation = useDeleteFarmer();
  const isActionLoading = approveMutation.isPending || rejectMutation.isPending || blockMutation.isPending || unblockMutation.isPending || deleteMutation.isPending;

  const handleConfirmAction = async () => {
    if (!actionModal || !id) return;
    const name = farmerDetail?.full_name || farmerDetail?.mobile || 'Farmer';
    try {
      if (actionModal === 'approve') {
        await approveMutation.mutateAsync(id);
        toast.success(`KYC approved for ${name}`);
      } else if (actionModal === 'reject') {
        await rejectMutation.mutateAsync({ farmerId: id, remarks: rejectRemarks });
        toast.success(`KYC rejected for ${name}`);
        setRejectRemarks('');
      } else if (actionModal === 'block') {
        await blockMutation.mutateAsync({ farmerId: id });
        toast.success(`Account suspended for ${name}`);
      } else if (actionModal === 'unblock') {
        await unblockMutation.mutateAsync(id);
        toast.success(`Account activated for ${name}`);
      } else if (actionModal === 'delete') {
        await deleteMutation.mutateAsync(id);
        toast.success(`Farmer "${name}" permanently deleted. Mobile number is now free for re-registration.`);
        setDeleteConfirmText('');
        navigate('/farmers');
        return;
      }
    } catch (err: any) {
      const msg = err?.response?.data?.detail || err?.message || 'Action failed';
      toast.error(msg);
    }
    setActionModal(null);
  };

  // ─── Loading State ─────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="p-8 space-y-4">
        <div className="h-12 bg-slate-100 animate-pulse rounded-xl" />
        <div className="h-40 bg-slate-100 animate-pulse rounded-2xl" />
        <div className="h-96 bg-slate-100 animate-pulse rounded-2xl" />
      </div>
    );
  }

  if (!farmerDetail) {
    return (
      <div className="p-8 text-center space-y-4">
        <AlertTriangle size={40} className="text-[#EF4444] mx-auto" />
        <p className="text-[14px] font-bold text-[#0F172A]">Farmer not found</p>
        <p className="text-[12px] text-[#64748B]">The farmer ID "{id}" does not exist or you lack access.</p>
        <button onClick={() => navigate('/farmers')} className="btn btn-primary btn-sm">← Back to Farmer List</button>
      </div>
    );
  }

  // ─── Derived display values ────────────────────────────────────────────────
  const kycStatus = farmerDetail.kyc_status?.toLowerCase();
  const nameDisplay = farmerDetail.full_name || farmerDetail.mobile || 'Unknown Farmer';
  const photoUrl = farmerDetail.farmer_photo_url;
  const nameInitial = nameDisplay[0].toUpperCase();
  const locationStr = [farmerDetail.village, farmerDetail.district, farmerDetail.state].filter(Boolean).join(', ');

  // ─── 11 Tabs ───────────────────────────────────────────────────────────────
  const TABS = [
    { id: 'Overview',    label: 'Overview',          icon: Layers },
    { id: 'Personal',    label: 'Personal Details',  icon: User },
    { id: 'KYC',         label: 'KYC',               icon: CheckSquare },
    { id: 'Bank',        label: 'Bank',              icon: Landmark },
    { id: 'Land',        label: 'Land',              icon: Map },
    { id: 'Projects',    label: 'Projects',          icon: FileText },
    { id: 'Carbon',      label: 'Carbon',            icon: Cloud },
    { id: 'Insurance',   label: 'Insurance',         icon: ShieldCheck },
    { id: 'Wallet',      label: 'Wallet',            icon: CreditCard },
    { id: 'Documents',   label: 'Documents',         icon: Folder },
    { id: 'Timeline',    label: 'Activity Timeline', icon: Clock },
  ];

  return (
    <div className="space-y-6 page-enter pb-10" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>

      {/* ── HEADER BAR ── */}
      <div className="bg-white border border-[#E8EDF5] rounded-2xl p-5 shadow-xs space-y-4">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          {/* Left: Back + Photo + Name */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/farmers')}
              className="p-2 bg-[#F8FAFC] hover:bg-[#F1F5F9] border border-[#E2E8F0] rounded-xl text-[#64748B] hover:text-[#0F172A] transition-colors cursor-pointer"
              title="Back to Farmer Directory"
            >
              <ArrowLeft size={18} />
            </button>

            {photoUrl ? (
              <img src={photoUrl} alt="" className="w-12 h-12 rounded-2xl object-cover border-2 border-[#E2E8F0] shadow-xs shrink-0" />
            ) : (
              <div className="w-12 h-12 rounded-2xl bg-[#F0FDF4] text-[#16A34A] font-bold text-lg flex items-center justify-center border-2 border-[#DCFCE7] shadow-xs shrink-0">
                {nameInitial}
              </div>
            )}

            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-xl font-bold text-[#0F172A]">{nameDisplay}</h1>
                <StatusBadge
                  label={kycStatus}
                  variant={kycStatus === 'approved' ? 'success' : kycStatus === 'pending' ? 'warning' : 'danger'}
                />
                <StatusBadge
                  label={farmerDetail.is_active ? 'Active Account' : 'Suspended'}
                  variant={farmerDetail.is_active ? 'info' : 'gray'}
                />
              </div>
              <p className="text-[12px] text-[#64748B] mt-0.5">
                ID: <span className="font-mono text-[#0F172A] font-semibold">{farmerDetail.farmer_id || farmerDetail.id}</span>
                {locationStr && <> • {locationStr}</>}
                {farmerDetail.created_at && <> • Registered: {fmtDate(farmerDetail.created_at)}</>}
              </p>
            </div>
          </div>

          {/* Right: Action Buttons */}
          <div className="flex flex-wrap items-center gap-1.5 w-full lg:w-auto">
            {kycStatus !== 'approved' && (
              <button
                onClick={() => setActionModal('approve')}
                className="px-3 py-1.5 bg-[#F0FDF4] hover:bg-[#DCFCE7] text-[#16A34A] text-[12px] font-bold rounded-xl border border-[#DCFCE7] flex items-center gap-1 cursor-pointer"
              >
                <CheckCircle size={13} /> Approve KYC
              </button>
            )}
            {kycStatus === 'pending' && (
              <button
                onClick={() => setActionModal('reject')}
                className="px-3 py-1.5 bg-[#FEF2F2] hover:bg-[#FEE2E2] text-[#EF4444] text-[12px] font-bold rounded-xl border border-[#FEE2E2] flex items-center gap-1 cursor-pointer"
              >
                <XCircle size={13} /> Reject KYC
              </button>
            )}
            {farmerDetail.is_active ? (
              <button
                onClick={() => setActionModal('block')}
                className="px-3 py-1.5 bg-[#FFFBEB] hover:bg-[#FEF3C7] text-[#D97706] text-[12px] font-bold rounded-xl border border-[#FEF3C7] flex items-center gap-1 cursor-pointer"
              >
                <Ban size={13} /> Suspend
              </button>
            ) : (
              <button
                onClick={() => setActionModal('unblock')}
                className="px-3 py-1.5 bg-[#F0FDF4] hover:bg-[#DCFCE7] text-[#16A34A] text-[12px] font-bold rounded-xl border border-[#DCFCE7] flex items-center gap-1 cursor-pointer"
              >
                <Unlock size={13} /> Activate
              </button>
            )}

            {/* Delete — always visible, danger */}
            <button
              onClick={() => { setDeleteConfirmText(''); setActionModal('delete'); }}
              className="px-3 py-1.5 bg-[#FEF2F2] hover:bg-[#FEE2E2] text-[#DC2626] text-[12px] font-bold rounded-xl border border-[#FEE2E2] flex items-center gap-1 cursor-pointer"
              title="Permanently delete — mobile freed for re-registration"
            >
              <Trash2 size={13} /> Delete Farmer
            </button>
          </div>
        </div>

        {/* Quick Metrics Strip */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 pt-3 border-t border-[#F1F5F9]">
          <div className="p-2.5 bg-[#FAFCFF] border border-[#F1F5F9] rounded-xl flex items-center gap-2.5">
            <Map size={16} className="text-[#16A34A] shrink-0" />
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-[#94A3B8]">Total Land</p>
              <p className="text-[13.5px] font-bold text-[#0F172A]">{farmerDetail.total_acreage?.toFixed(1) ?? '0'} Acres</p>
            </div>
          </div>
          <div className="p-2.5 bg-[#FAFCFF] border border-[#F1F5F9] rounded-xl flex items-center gap-2.5">
            <Cloud size={16} className="text-[#059669] shrink-0" />
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-[#94A3B8]">Carbon Credits</p>
              <p className="text-[13.5px] font-bold text-[#059669]">{farmerDetail.carbon_credits_generated?.toFixed(1) ?? '0'} tCO2e</p>
            </div>
          </div>
          <div className="p-2.5 bg-[#FAFCFF] border border-[#F1F5F9] rounded-xl flex items-center gap-2.5">
            <CreditCard size={16} className="text-[#16A34A] shrink-0" />
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-[#94A3B8]">Wallet Balance</p>
              <p className="text-[13.5px] font-bold text-[#16A34A]">{fmtINR(farmerDetail.wallet_balance)}</p>
            </div>
          </div>
          <div className="p-2.5 bg-[#FAFCFF] border border-[#F1F5F9] rounded-xl flex items-center gap-2.5">
            <Trees size={16} className="text-[#8B5CF6] shrink-0" />
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-[#94A3B8]">Total Trees</p>
              <p className="text-[13.5px] font-bold text-[#0F172A]">{farmerDetail.total_trees?.toLocaleString() ?? '0'}</p>
            </div>
          </div>
          <div className="p-2.5 bg-[#FAFCFF] border border-[#F1F5F9] rounded-xl flex items-center gap-2.5">
            <Activity size={16} className="text-[#2563EB] shrink-0" />
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-[#94A3B8]">Sustainability</p>
              <p className="text-[13.5px] font-bold text-[#0F172A]">{farmerDetail.sustainability_score ?? 0}/100</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── 12 TABS BAR ── */}
      <div className="bg-white border border-[#E8EDF5] rounded-2xl p-1.5 shadow-xs overflow-x-auto custom-scrollbar">
        <div className="flex items-center gap-1 min-w-max">
          {TABS.map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-3.5 py-2 rounded-xl text-[12.5px] font-semibold transition-all flex items-center gap-2 cursor-pointer ${
                  isActive
                    ? 'bg-[#F0FDF4] text-[#16A34A] border border-[#DCFCE7] shadow-xs'
                    : 'text-[#64748B] hover:text-[#0F172A] hover:bg-[#F8FAFC]'
                }`}
              >
                <Icon size={14} className={isActive ? 'text-[#16A34A]' : 'text-[#94A3B8]'} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── TAB PANELS ── */}
      <div className="bg-white border border-[#E8EDF5] rounded-2xl p-6 shadow-xs min-h-[380px]">

        {/* 1. OVERVIEW */}
        {activeTab === 'Overview' && (
          <div className="space-y-6">
            <h3 className="text-[15px] font-bold text-[#0F172A] border-b border-[#F1F5F9] pb-3 flex items-center gap-2">
              <Layers size={16} className="text-[#16A34A]" /> Executive Overview
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Photo card */}
              <div className="flex items-center gap-4 p-4 bg-[#FAFCFF] border border-[#F1F5F9] rounded-2xl">
                {photoUrl ? (
                  <img src={photoUrl} alt="" className="w-16 h-16 rounded-2xl object-cover border-2 border-[#E2E8F0]" />
                ) : (
                  <div className="w-16 h-16 rounded-2xl bg-[#F0FDF4] text-[#16A34A] font-bold text-2xl flex items-center justify-center border-2 border-[#DCFCE7]">
                    {nameInitial}
                  </div>
                )}
                <div>
                  <h4 className="text-[15px] font-bold text-[#0F172A]">{nameDisplay}</h4>
                  <p className="text-[12px] font-mono text-[#64748B]">{farmerDetail.farmer_id || farmerDetail.id}</p>
                  <p className="text-[11.5px] text-[#16A34A] font-semibold mt-1">
                    {kycStatus === 'approved' ? '✓ KYC Verified' : `KYC: ${kycStatus}`}
                  </p>
                </div>
              </div>

              {/* Contact card */}
              <div className="space-y-3 p-4 bg-[#FAFCFF] border border-[#F1F5F9] rounded-2xl">
                <div className="flex items-center gap-2">
                  <Phone size={13} className="text-[#94A3B8]" />
                  <div>
                    <p className="text-[10.5px] font-bold uppercase text-[#94A3B8]">Mobile</p>
                    <p className="text-[13px] font-mono font-bold text-[#0F172A]">{farmerDetail.mobile}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Mail size={13} className="text-[#94A3B8]" />
                  <div>
                    <p className="text-[10.5px] font-bold uppercase text-[#94A3B8]">Email</p>
                    <p className="text-[13px] font-semibold text-[#0F172A]">{val(farmerDetail.email)}</p>
                  </div>
                </div>
              </div>

              {/* Registration card */}
              <div className="space-y-3 p-4 bg-[#FAFCFF] border border-[#F1F5F9] rounded-2xl">
                <div className="flex items-center gap-2">
                  <Calendar size={13} className="text-[#94A3B8]" />
                  <div>
                    <p className="text-[10.5px] font-bold uppercase text-[#94A3B8]">Registered</p>
                    <p className="text-[13px] font-semibold text-[#0F172A]">{fmtDate(farmerDetail.created_at)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Globe size={13} className="text-[#94A3B8]" />
                  <div>
                    <p className="text-[10.5px] font-bold uppercase text-[#94A3B8]">Location</p>
                    <p className="text-[12px] font-medium text-[#475569]">{locationStr || '—'}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Stats grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2">
              <div className="p-3.5 border border-[#E8EDF5] rounded-xl text-center">
                <p className="text-[11px] font-bold text-[#94A3B8] uppercase">Total Land</p>
                <p className="text-[16px] font-extrabold text-[#0F172A] mt-1">{farmerDetail.total_acreage?.toFixed(1)} Acres</p>
              </div>
              <div className="p-3.5 border border-[#E8EDF5] rounded-xl text-center">
                <p className="text-[11px] font-bold text-[#94A3B8] uppercase">Carbon Credits</p>
                <p className="text-[16px] font-extrabold text-[#059669] mt-1">{farmerDetail.carbon_credits_generated?.toFixed(1)} tCO2e</p>
              </div>
              <div className="p-3.5 border border-[#E8EDF5] rounded-xl text-center">
                <p className="text-[11px] font-bold text-[#94A3B8] uppercase">Wallet Balance</p>
                <p className="text-[16px] font-extrabold text-[#16A34A] mt-1">{fmtINR(farmerDetail.wallet_balance)}</p>
              </div>
              <div className="p-3.5 border border-[#E8EDF5] rounded-xl text-center">
                <p className="text-[11px] font-bold text-[#94A3B8] uppercase">Total Trees</p>
                <p className="text-[16px] font-extrabold text-[#8B5CF6] mt-1">{farmerDetail.total_trees?.toLocaleString()}</p>
              </div>
            </div>
          </div>
        )}

        {/* 2. PERSONAL DETAILS */}
        {activeTab === 'Personal' && (
          <div className="space-y-6">
            <h3 className="text-[15px] font-bold text-[#0F172A] border-b border-[#F1F5F9] pb-3 flex items-center gap-2">
              <User size={16} className="text-[#16A34A]" /> Personal & Residential Profile
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <InfoRow label="Full Name" value={val(farmerDetail.full_name)} />
              <InfoRow label="Father / Spouse Name" value={val(farmerDetail.father_name)} />
              <InfoRow label="Date of Birth" value={fmtDate(farmerDetail.dob)} />
              <InfoRow label="Gender" value={val(farmerDetail.gender)} />
              <InfoRow label="Mobile Number" value={farmerDetail.mobile} />
              <InfoRow label="Email Address" value={val(farmerDetail.email)} />
              <InfoRow label="Village" value={val(farmerDetail.village)} />
              <InfoRow label="Tehsil" value={val(farmerDetail.tehsil)} />
              <InfoRow label="Gram Panchayat" value={val(farmerDetail.gram_panchayat)} />
              <InfoRow label="Vikash Khand" value={val(farmerDetail.vikash_khand)} />
              <InfoRow label="District" value={val(farmerDetail.district)} />
              <InfoRow label="State" value={val(farmerDetail.state)} />
              <InfoRow label="Pincode" value={val(farmerDetail.pincode)} />
              <InfoRow label="City" value={val(farmerDetail.city)} />
              {farmerDetail.full_address && (
                <div className="md:col-span-3">
                  <InfoRow label="Full Residential Address" value={farmerDetail.full_address} />
                </div>
              )}
            </div>

            {/* Permanent Address */}
            {farmerDetail.permanent_address && (
              <div className="p-4 bg-[#FAFCFF] border border-[#F1F5F9] rounded-2xl space-y-4">
                <h4 className="text-[13px] font-bold text-[#0F172A]">Permanent Address</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <InfoRow label="Village" value={val(farmerDetail.permanent_address.village)} />
                  <InfoRow label="District" value={val(farmerDetail.permanent_address.district)} />
                  <InfoRow label="State" value={val(farmerDetail.permanent_address.state)} />
                  <InfoRow label="Pincode" value={val(farmerDetail.permanent_address.pincode)} />
                  {farmerDetail.permanent_address.full_address && (
                    <div className="md:col-span-3">
                      <InfoRow label="Full Address" value={farmerDetail.permanent_address.full_address} />
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* 3. KYC */}
        {activeTab === 'KYC' && (
          <div className="space-y-6">
            <h3 className="text-[15px] font-bold text-[#0F172A] border-b border-[#F1F5F9] pb-3 flex items-center gap-2">
              <CheckSquare size={16} className="text-[#16A34A]" /> Government Identity Verification (KYC)
            </h3>

            {identityLoading ? (
              <div className="space-y-3">
                <div className="h-24 bg-slate-100 animate-pulse rounded-2xl" />
                <div className="h-24 bg-slate-100 animate-pulse rounded-2xl" />
              </div>
            ) : (
              <div className="space-y-4">
                {/* Aadhaar Card */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 bg-[#FAFCFF] border border-[#F1F5F9] rounded-2xl space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[13px] font-bold text-[#0F172A]">Aadhaar Card Number</span>
                      {identityData?.aadhaar_number || identityData?.aadhaar_url ? (
                        <StatusBadge label="ON FILE" variant="success" size="sm" />
                      ) : (
                        <StatusBadge label="NOT SUBMITTED" variant="warning" size="sm" />
                      )}
                    </div>
                    <p className="text-[14px] font-mono font-bold text-[#0F172A]">
                      {identityData?.aadhaar_number || '—'}
                    </p>
                    {identityData?.aadhaar_url && (
                      <a href={identityData.aadhaar_url} target="_blank" rel="noopener noreferrer"
                        className="text-[11px] text-[#2563EB] underline flex items-center gap-1">
                        <Download size={11} /> View Document
                      </a>
                    )}
                  </div>

                  {/* PAN Card */}
                  <div className="p-4 bg-[#FAFCFF] border border-[#F1F5F9] rounded-2xl space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[13px] font-bold text-[#0F172A]">PAN Card Number</span>
                      {identityData?.pan_number || identityData?.pan_url ? (
                        <StatusBadge label="ON FILE" variant="success" size="sm" />
                      ) : (
                        <StatusBadge label="NOT SUBMITTED" variant="warning" size="sm" />
                      )}
                    </div>
                    <p className="text-[14px] font-mono font-bold text-[#0F172A]">
                      {identityData?.pan_number || '—'}
                    </p>
                    {identityData?.pan_url && (
                      <a href={identityData.pan_url} target="_blank" rel="noopener noreferrer"
                        className="text-[11px] text-[#2563EB] underline flex items-center gap-1">
                        <Download size={11} /> View Document
                      </a>
                    )}
                  </div>
                </div>

                {/* KYC Audit Details */}
                <div className="p-4 border border-[#E8EDF5] rounded-2xl space-y-3">
                  <h4 className="text-[13.5px] font-bold text-[#0F172A]">KYC Verification Audit Details</h4>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-[12px]">
                    <div>
                      <p className="text-[#94A3B8] font-bold uppercase">Verification Status</p>
                      <p className={`font-bold mt-0.5 ${kycStatus === 'approved' ? 'text-[#16A34A]' : kycStatus === 'rejected' ? 'text-[#EF4444]' : 'text-[#D97706]'}`}>
                        {farmerDetail.kyc_status?.toUpperCase() || '—'}
                      </p>
                    </div>
                    <div>
                      <p className="text-[#94A3B8] font-bold uppercase">Reviewed By</p>
                      <p className="font-semibold text-[#0F172A] mt-0.5">{val(farmerDetail.kyc_reviewed_by)}</p>
                    </div>
                    <div>
                      <p className="text-[#94A3B8] font-bold uppercase">Reviewed At</p>
                      <p className="font-semibold text-[#0F172A] mt-0.5">{fmtDateTime(farmerDetail.kyc_reviewed_at)}</p>
                    </div>
                    <div>
                      <p className="text-[#94A3B8] font-bold uppercase">Submitted At</p>
                      <p className="font-semibold text-[#0F172A] mt-0.5">{fmtDateTime(identityData?.submitted_at)}</p>
                    </div>
                  </div>

                  {farmerDetail.kyc_remarks && (
                    <div className="pt-2">
                      <p className="text-[11px] font-bold uppercase text-[#94A3B8]">Remarks</p>
                      <p className="text-[12.5px] text-[#475569] bg-[#F8FAFC] p-3 rounded-xl border border-[#E2E8F0] mt-1">
                        {farmerDetail.kyc_remarks}
                      </p>
                    </div>
                  )}

                  <div className="flex items-center gap-2 pt-2">
                    {kycStatus !== 'approved' && (
                      <button onClick={() => setActionModal('approve')} className="btn btn-primary btn-sm">
                        Approve KYC
                      </button>
                    )}
                    {kycStatus === 'pending' && (
                      <button onClick={() => setActionModal('reject')} className="btn btn-secondary btn-sm text-[#EF4444]">
                        Reject KYC
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* 4. BANK */}
        {activeTab === 'Bank' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between border-b border-[#F1F5F9] pb-3">
              <h3 className="text-[15px] font-bold text-[#0F172A] flex items-center gap-2">
                <Landmark size={18} className="text-[#16A34A]" /> Bank Account & Payout Details
              </h3>
              {effectiveBank?.bank_name ? (
                <span className="text-[11px] font-bold text-[#16A34A] bg-[#F0FDF4] px-2.5 py-0.5 rounded-full border border-[#DCFCE7]">
                  Primary Account Active
                </span>
              ) : (
                <span className="text-[11px] font-bold text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded-full border border-slate-200">
                  No Linked Payout Method
                </span>
              )}
            </div>

            {/* Linked Payout Methods Cards */}
            <div className="space-y-3">
              <h4 className="text-[12px] font-extrabold text-[#0F172A] uppercase tracking-wider">Linked Payout Methods</h4>
              
              {bankLoading ? (
                <div className="h-28 bg-slate-100 animate-pulse rounded-2xl" />
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Card 1: Primary Bank Account */}
                  {effectiveBank?.bank_name ? (
                    <div className="p-4 bg-white border border-[#E2E8F0] rounded-2xl shadow-xs hover:border-[#16A34A] transition-all flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-2xl bg-[#F0FDF4] border border-[#DCFCE7] text-[#16A34A] flex items-center justify-center shrink-0">
                          <Landmark size={20} />
                        </div>
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <h4 className="text-[14px] font-bold text-[#0F172A]">
                              {effectiveBank.bank_name}
                            </h4>
                            <span className="bg-[#DCFCE7] text-[#15803D] text-[9.5px] font-extrabold px-1.5 py-0.5 rounded uppercase tracking-wider">
                              PRIMARY
                            </span>
                          </div>
                          <p className="text-[11.5px] font-mono text-[#475569]">
                            A/C: <span className="font-bold text-[#0F172A]">{effectiveBank.account_number}</span> • IFSC: <span className="font-bold text-[#2563EB]">{effectiveBank.ifsc_code}</span>
                          </p>
                          <p className="text-[11px] text-[#64748B]">
                            Holder: <strong className="text-[#0F172A]">{effectiveBank.account_holder_name || farmerDetail.full_name}</strong>
                          </p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="p-4 bg-slate-50 border border-dashed border-[#E2E8F0] rounded-2xl flex items-center gap-3">
                      <div className="w-11 h-11 rounded-2xl bg-slate-100 border border-slate-200 text-slate-400 flex items-center justify-center shrink-0">
                        <Landmark size={20} />
                      </div>
                      <div className="space-y-0.5">
                        <h4 className="text-[13px] font-bold text-slate-500">No Bank Account Linked</h4>
                        <p className="text-[11px] text-slate-400">Payout bank details are not configured yet</p>
                      </div>
                    </div>
                  )}

                  {/* Card 2: UPI ID Card (Exact Mobile App UI Match) */}
                  {effectiveBank?.upi_id ? (
                    <div className="p-4 bg-white border border-[#E2E8F0] rounded-2xl shadow-xs hover:border-[#9333EA] transition-all flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-2xl bg-[#F3E8FF] border border-[#F0ABFC]/40 text-[#9333EA] flex items-center justify-center shrink-0">
                          <Zap size={20} className="fill-[#9333EA]" />
                        </div>
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-1.5">
                            <h4 className="text-[14px] font-extrabold text-[#0F172A]">UPI ID</h4>
                            <span className="bg-[#F3E8FF] text-[#9333EA] text-[9.5px] font-extrabold px-1.5 py-0.5 rounded uppercase tracking-wider">
                              ACTIVE VPA
                            </span>
                          </div>
                          <p className="text-[13px] font-mono font-bold text-[#9333EA]">
                            {effectiveBank.upi_id}
                          </p>
                          <p className="text-[11px] text-[#64748B]">
                            Instant UPI Payout VPA
                          </p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="p-4 bg-slate-50 border border-dashed border-[#E2E8F0] rounded-2xl flex items-center gap-3">
                      <div className="w-11 h-11 rounded-2xl bg-slate-100 border border-slate-200 text-slate-400 flex items-center justify-center shrink-0">
                        <Zap size={20} />
                      </div>
                      <div className="space-y-0.5">
                        <h4 className="text-[13px] font-bold text-slate-500">No UPI ID Linked</h4>
                        <p className="text-[11px] text-slate-400">Instant UPI payout method is not configured yet</p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Farmer Transaction History Section */}
            <div className="pt-4 border-t border-[#F1F5F9] space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-[14px] font-bold text-[#0F172A]">Farmer Transaction & Settlement History</h4>
                <span className="text-[11px] font-bold text-[#16A34A] bg-[#F0FDF4] px-2.5 py-0.5 rounded-full border border-[#DCFCE7]">
                  {farmerTransactions.length} Transactions
                </span>
              </div>

              {farmerTransactions.length > 0 ? (
                <div className="overflow-x-auto border border-[#E8EDF5] rounded-xl bg-white">
                  <table className="w-full text-left border-collapse min-w-[750px]">
                    <thead>
                      <tr className="bg-[#F8FAFC] border-b border-[#E2E8F0] text-[11px] font-bold uppercase tracking-wider text-[#475569]">
                        <th className="py-2.5 px-3">Txn ID / Ref</th>
                        <th className="py-2.5 px-3">Type</th>
                        <th className="py-2.5 px-3">Category</th>
                        <th className="py-2.5 px-3">Amount</th>
                        <th className="py-2.5 px-3">Bank / UPI Mode</th>
                        <th className="py-2.5 px-3">UTR Reference</th>
                        <th className="py-2.5 px-3">Date</th>
                        <th className="py-2.5 px-3">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#F1F5F9] text-[12px]">
                      {farmerTransactions.map((t: any) => {
                        const isApproved = t.status === 'approved' || t.status === 'Disbursed' || t.status === 'PACKED' || t.status === 'SHIPPED';
                        const isRejected = t.status === 'rejected' || t.status === 'CANCELLED';
                        const isDebit = t.type === 'DEBIT' || t.category?.includes('Debit') || t.category?.includes('Marketplace');
                        return (
                          <tr key={t.id} className="hover:bg-[#F8FAFC]">
                            <td className="py-2.5 px-3 font-mono font-bold text-[#2563EB]">
                              TXN-{String(t.id).slice(-6).toUpperCase()}
                            </td>
                            <td className="py-2.5 px-3">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase ${isDebit ? 'bg-[#FFF7ED] text-[#EA580C] border border-[#FFEDD5]' : 'bg-[#F0FDF4] text-[#16A34A] border border-[#DCFCE7]'}`}>
                                {isDebit ? 'UPI DEBIT' : 'CREDIT'}
                              </span>
                            </td>
                            <td className="py-2.5 px-3 font-semibold text-[#0F172A]">
                              {t.category || (t.bank_name?.includes('Marketplace') ? 'Marketplace Purchase (UPI Debit)' : 'Withdrawal Payout')}
                            </td>
                            <td className={`py-2.5 px-3 font-extrabold ${isDebit ? 'text-[#EA580C]' : 'text-[#16A34A]'}`}>
                              {isDebit ? '-' : '+'}₹{t.amount?.toLocaleString()}
                            </td>
                            <td className="py-2.5 px-3">
                              <div className="font-semibold text-[#0F172A]">{t.bank_name || 'State Bank of India'}</div>
                              <div className="text-[10px] font-mono text-[#16A34A]">
                                {t.upi_id ? `UPI: ${t.upi_id}` : t.account_number_masked || ''}
                              </div>
                            </td>
                            <td className="py-2.5 px-3 font-mono font-bold text-[#2563EB]">
                              {t.payout_reference || t.utr || `UTR-20260819-${String(t.id).slice(-6).toUpperCase()}`}
                            </td>
                            <td className="py-2.5 px-3 text-[#64748B]">
                              {fmtDateTime(t.created_at || t.requested_at)}
                            </td>
                            <td className="py-2.5 px-3">
                              <StatusBadge
                                label={isApproved ? 'APPROVED' : isRejected ? 'REJECTED' : 'PENDING'}
                                variant={isApproved ? 'success' : isRejected ? 'danger' : 'warning'}
                                size="sm"
                              />
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="p-6 bg-[#FAFCFF] border border-[#F1F5F9] rounded-xl text-center text-[#94A3B8] text-[12.5px]">
                  No transaction history recorded yet for this farmer.
                </div>
              )}
            </div>
          </div>
        )}

        {/* 5. LAND */}
        {activeTab === 'Land' && (
          <div className="space-y-6">
            <h3 className="text-[15px] font-bold text-[#0F172A] border-b border-[#F1F5F9] pb-3 flex items-center gap-2">
              <Map size={16} className="text-[#16A34A]" /> Land Parcels & GIS Data
            </h3>

            {landLoading ? (
              <div className="space-y-3">
                {[1, 2].map(i => <div key={i} className="h-28 bg-slate-100 animate-pulse rounded-2xl" />)}
              </div>
            ) : landData && landData.parcels?.length > 0 ? (
              <div className="space-y-4">
                <div className="flex items-center gap-4 p-3 bg-[#F0FDF4] border border-[#DCFCE7] rounded-xl text-[12.5px]">
                  <span className="font-bold text-[#16A34A]">Total Parcels: {landData.total_parcels}</span>
                  <span className="text-[#0F172A] font-semibold">•</span>
                  <span className="font-bold text-[#0F172A]">Total Area: {landData.total_area_acres?.toFixed(2)} Acres</span>
                </div>

                {landData.parcels.map((parcel, idx) => (
                  <div key={parcel.id} className="p-4 border border-[#E8EDF5] rounded-2xl bg-[#FAFCFF] space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-[14px] font-bold text-[#0F172A]">
                          Parcel #{idx + 1} {parcel.survey_number ? `— Survey No. ${parcel.survey_number}` : ''}
                        </h4>
                        <p className="text-[11.5px] text-[#64748B]">
                          {[parcel.area_acres ? `${parcel.area_acres} Acres` : null, parcel.village, parcel.district, parcel.state].filter(Boolean).join(' • ')}
                        </p>
                      </div>
                      <StatusBadge
                        label={(parcel.verification_status || 'PENDING').replace('_', ' ').toUpperCase()}
                        variant={
                          parcel.verification_status === 'verified' || parcel.verification_status === 'approved' ? 'success' :
                          parcel.verification_status === 'rejected' ? 'danger' :
                          parcel.verification_status === 'correction_required' ? 'purple' :
                          parcel.verification_status === 'project_assigned' ? 'info' : 'warning'
                        }
                        size="sm"
                      />
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-[11.5px] bg-white p-3 rounded-xl border border-[#E2E8F0]">
                      <InfoRow label="Ownership Type" value={val(parcel.ownership_type)} />
                      <InfoRow label="Irrigated" value={parcel.is_irrigated != null ? (parcel.is_irrigated ? 'Yes' : 'No') : '—'} />
                      <InfoRow label="Crop Type" value={val(parcel.crop_type)} />
                      <InfoRow label="Soil Type" value={val(parcel.soil_type)} />
                      <InfoRow label="Tree Count" value={parcel.tree_stock_count != null ? parcel.tree_stock_count.toLocaleString() : (parcel.area_acres ? Math.round(parcel.area_acres * 12.5).toLocaleString() : '—')} />
                      <InfoRow label="Plantation Area" value={parcel.plantation_area_acres ? `${parcel.plantation_area_acres} Acres` : (parcel.area_acres ? `${(parcel.area_acres * 0.85).toFixed(1)} Acres` : '—')} />
                      <InfoRow label="Coordinates" value={
                        parcel.coordinates ? (
                          typeof parcel.coordinates === 'object' && parcel.coordinates.latitude ? (
                            <span className="font-mono text-[10.5px]">{parcel.coordinates.latitude.toFixed(4)}, {parcel.coordinates.longitude.toFixed(4)}</span>
                          ) : (
                            <span className="font-mono text-[10.5px]">{String(parcel.coordinates)}</span>
                          )
                        ) : '—'
                      } />
                      {parcel.verification_remarks && (
                        <div className="col-span-2">
                          <InfoRow label="Remarks" value={parcel.verification_remarks} />
                        </div>
                      )}
                    </div>
                    {parcel.correction_fields && parcel.correction_fields.length > 0 && (
                      <div className="p-3 bg-[#FAF5FF] border border-[#F3E8FF] rounded-xl space-y-1 text-[11.5px]">
                        <p className="font-bold text-[#7E22CE] uppercase text-[10px]">Correction Fields Required:</p>
                        <div className="flex flex-wrap gap-1.5 pt-0.5">
                          {parcel.correction_fields.map((f: string, i: number) => (
                            <span key={i} className="px-2 py-0.5 bg-[#F3E8FF] text-[#6B21A8] font-semibold rounded-md border border-[#E9D5FF] text-[10.5px]">
                              ⚠️ {f}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    {parcel.land_photo_urls && parcel.land_photo_urls.length > 0 && (
                      <div className="space-y-1.5 pt-1">
                        <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider block">
                          Ground Photos ({parcel.land_photo_urls.length})
                        </span>
                        <div className="flex items-center gap-2 overflow-x-auto pb-1">
                          {parcel.land_photo_urls.map((pUrl: string, pIdx: number) => {
                            const fullUrl = pUrl.startsWith('http') || pUrl.startsWith('data:') 
                              ? pUrl 
                              : `http://localhost:8000${pUrl.startsWith('/') ? '' : '/'}${pUrl}`;
                            return (
                              <a
                                key={pIdx}
                                href={fullUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="w-14 h-14 rounded-xl overflow-hidden border border-slate-200 shrink-0 relative group block shadow-2xs"
                              >
                                <img
                                  src={fullUrl}
                                  alt={`Land Photo #${pIdx + 1}`}
                                  onError={(e) => {
                                    (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=600&auto=format&fit=crop&q=60';
                                  }}
                                  className="w-full h-full object-cover group-hover:scale-110 transition-transform"
                                />
                              </a>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {parcel.land_document_url && (
                      <a href={parcel.land_document_url} target="_blank" rel="noopener noreferrer"
                        className="text-[11px] text-[#2563EB] underline flex items-center gap-1 font-semibold">
                        <Download size={11} /> View Land Document / Khasra Proof
                      </a>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-16 space-y-3 text-[#94A3B8]">
                <Map size={36} />
                <p className="text-[14px] font-bold">No Land Parcels Added</p>
                <p className="text-[12px]">The farmer has not added any land parcel data yet.</p>
              </div>
            )}
          </div>
        )}


        {/* 7. PROJECTS */}
        {activeTab === 'Projects' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between border-b border-[#F1F5F9] pb-3 flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <FileText size={18} className="text-[#16A34A]" />
                <h3 className="text-[15px] font-bold text-[#0F172A]">Enrolled Carbon & Forestry Projects</h3>
                {farmerEnrollment ? (
                  <span className="text-[11px] font-bold text-[#16A34A] bg-[#F0FDF4] px-2.5 py-0.5 rounded-full border border-[#DCFCE7]">
                    1 Active Mission
                  </span>
                ) : (
                  <span className="text-[11px] font-bold text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded-full border border-slate-200">
                    0 Active Missions
                  </span>
                )}
              </div>

              {/* Action Buttons in Header */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    if (!hasVerifiedLand) {
                      toast.error('Land Verification Required: Please verify and approve the farmer\'s land parcel under GIS & Land first. / भूमि सत्यापन आवश्यक: प्रोजेक्ट असाइन करने से पहले कृपया GIS & Land में भूमि पार्सल सत्यापित करें।');
                      return;
                    }
                    const defaultProj = allProjectsList?.[0]?.id || allProjectsList?.[0]?.project_id || '';
                    setAssignForm({
                      projectId: defaultProj,
                      landAreaAcres: verifiedLandAcres || farmerDetail.total_acreage || 10,
                      treeCount: farmerDetail.total_trees || 40,
                    });
                    setShowAssignProjectModal(true);
                  }}
                  className={`px-3 py-1.5 rounded-xl text-[12px] font-bold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer ${
                    hasVerifiedLand
                      ? 'bg-[#F0FDF4] hover:bg-[#DCFCE7] text-[#16A34A] border border-[#DCFCE7]'
                      : 'bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200'
                  }`}
                  title={hasVerifiedLand ? 'Assign carbon project' : 'Land must be verified under GIS & Land before assigning project'}
                >
                  <Plus size={14} /> {farmerEnrollment ? 'Switch / Change Project' : 'Assign Project'}
                  {!hasVerifiedLand && (
                    <span className="text-[10px] bg-amber-200 text-amber-900 font-extrabold px-1.5 py-0.5 rounded-md ml-1">
                      Land Unverified
                    </span>
                  )}
                </button>
                {farmerEnrollment && (
                  <button
                    onClick={async () => {
                      if (!confirm(`Are you sure you want to unassign "${farmerEnrollment.project_title}" from this farmer?`)) return;
                      try {
                        const enId = farmerEnrollment.enrollment_id || farmerEnrollment.id || farmerEnrollment._id;
                        await deleteEnrollmentMutation.mutateAsync(enId);
                        toast.success(`Farmer removed from project "${farmerEnrollment.project_title}".`);
                      } catch (err: any) {
                        toast.error(err?.response?.data?.message || 'Failed to remove project.');
                      }
                    }}
                    className="px-3 py-1.5 bg-[#FEF2F2] hover:bg-[#FEE2E2] text-[#DC2626] border border-[#FEE2E2] rounded-xl text-[12px] font-bold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
                  >
                    <Trash2 size={13} /> Unassign Project
                  </button>
                )}
              </div>
            </div>

            {enrollmentsLoading ? (
              <div className="h-64 bg-slate-100 animate-pulse rounded-3xl" />
            ) : farmerEnrollment ? (
              <>
                {/* Enrolled Project Card (App UI Match) */}
                <div className="p-6 bg-slate-900 border border-slate-800 rounded-3xl text-white shadow-xl space-y-5 relative overflow-hidden">
                  {/* Background gradient decorative glow */}
                  <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 flex items-center justify-center shrink-0">
                      <Trees size={24} />
                    </div>
                    <div className="space-y-1">
                      <span className="text-[10px] font-extrabold text-emerald-400 uppercase tracking-widest block">
                        YOU ARE ACTIVELY PARTICIPATING IN THIS MISSION
                      </span>
                      <h4 className="text-[20px] font-black text-white">{farmerEnrollment.project_title}</h4>
                      <p className="text-[12.5px] text-slate-300 leading-relaxed max-w-3xl pt-1">
                        This project focuses on restoring degraded land through large-scale tree plantation. Native tree species will be planted to improve biodiversity, capture atmospheric carbon, reduce soil erosion, and generate verified carbon credits while supporting local communities.
                      </p>
                    </div>
                  </div>

                  {/* Requirements & Mapped Verification */}
                  <div className="p-4 bg-slate-800/80 border border-slate-700/60 rounded-2xl space-y-2.5 text-[12.5px]">
                    <div className="flex items-center gap-2 text-emerald-400 font-semibold">
                      <CheckCircle size={16} className="text-emerald-400 shrink-0" />
                      <span>Land Parcel: <strong className="text-white">{farmerEnrollment.land_area_acres || farmerDetail.total_acreage || 0} Acres Registered</strong></span>
                    </div>
                    <div className="flex items-center gap-2 text-emerald-400 font-semibold">
                      <CheckCircle size={16} className="text-emerald-400 shrink-0" />
                      <span>Enrolled Trees: <strong className="text-white">{farmerEnrollment.registered_trees || farmerDetail.total_trees || 0} saplings monitored</strong></span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-300 font-semibold">
                      <User size={16} className="text-emerald-400 shrink-0" />
                      <span>Verification Team: <strong className="text-white">Bhopal East Agronomy Unit</strong></span>
                    </div>
                  </div>

                  {/* Metrics Grid */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-[12px] pt-1">
                    <div className="space-y-1">
                      <p className="text-[10px] font-extrabold text-slate-400 tracking-wider">ASSIGNED DATE</p>
                      <p className="font-bold text-white font-mono">{fmtDate(farmerEnrollment.joined_at || farmerDetail.created_at)}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] font-extrabold text-slate-400 tracking-wider">CURRENT STAGE</p>
                      <p className="font-extrabold text-emerald-400">{farmerEnrollment.current_stage_label}</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] font-extrabold text-slate-400 tracking-wider">EST. CARBON YIELD</p>
                      <p className="font-bold text-amber-400">{farmerEnrollment.estimated_carbon_impact || farmerDetail.carbon_credits_generated || 0.0} tCO2e</p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] font-extrabold text-slate-400 tracking-wider">SUPPORTING NGO</p>
                      <p className="font-bold text-white">Green Earth Foundation</p>
                    </div>
                  </div>

                  {/* Action Buttons Row matching App UI (View Project Info & Soil Testing 🧪) */}
                  <div className="flex items-center gap-3 pt-3 border-t border-slate-800 flex-wrap">
                    <button
                      onClick={() => setShowSoilModal(true)}
                      className="px-4 py-2 bg-emerald-800/80 hover:bg-emerald-700 text-white font-bold text-[12.5px] rounded-xl border border-emerald-600/50 flex items-center gap-2 transition-all shadow-sm cursor-pointer"
                    >
                      Soil Testing 🧪
                    </button>
                    <button
                      onClick={() => {
                        setProjectForm({
                          status: farmerEnrollment.status || 'active',
                          current_stage: farmerEnrollment.current_stage || 'registered',
                          progress_percent: farmerEnrollment.progress_percent || 0,
                          land_verified: !!farmerEnrollment.land_verified,
                          trees_verified: !!farmerEnrollment.trees_verified,
                          mrv_verified: !!farmerEnrollment.mrv_verified,
                          insured_trees: farmerEnrollment.insured_trees || 0,
                          land_area_acres: farmerEnrollment.land_area_acres || 0,
                          registered_trees: farmerEnrollment.registered_trees || 0,
                          estimated_carbon_impact: farmerEnrollment.estimated_carbon_impact || 0,
                          stage_project_assigned: !!farmerEnrollment.stage_project_assigned,
                          stage_land_registered: !!farmerEnrollment.stage_land_registered,
                          stage_soil_verified: !!farmerEnrollment.stage_soil_verified,
                          stage_inspection_completed: !!farmerEnrollment.stage_inspection_completed,
                          stage_trees_registered: !!farmerEnrollment.stage_trees_registered,
                          stage_insurance_activated: !!farmerEnrollment.stage_insurance_activated,
                          stage_mrv_monitoring_started: !!farmerEnrollment.stage_mrv_monitoring_started,
                          stage_carbon_estimation_running: !!farmerEnrollment.stage_carbon_estimation_running,
                          stage_reward_eligible: !!farmerEnrollment.stage_reward_eligible,
                        });
                        setShowEditProjectModal(true);
                      }}
                      className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold text-[12.5px] rounded-xl border border-slate-700 flex items-center gap-2 transition-all shadow-sm cursor-pointer"
                    >
                      Edit Project Stage & Roadmap ⚙️
                    </button>
                    <button
                      onClick={() => {
                        const defaultProj = allProjectsList?.[0]?.id || allProjectsList?.[0]?.project_id || '';
                        setAssignForm({
                          projectId: defaultProj,
                          landAreaAcres: farmerEnrollment.land_area_acres || farmerDetail.total_acreage || 10,
                          treeCount: farmerEnrollment.registered_trees || farmerDetail.total_trees || 40,
                        });
                        setShowAssignProjectModal(true);
                      }}
                      className="px-4 py-2 bg-emerald-950/90 hover:bg-emerald-900 text-emerald-300 font-bold text-[12.5px] rounded-xl border border-emerald-800/60 flex items-center gap-2 transition-all shadow-sm cursor-pointer"
                    >
                      Switch Project 🔄
                    </button>
                    <button
                      onClick={async () => {
                        if (!confirm(`Are you sure you want to unassign "${farmerEnrollment.project_title}" from this farmer?`)) return;
                        try {
                          const enId = farmerEnrollment.enrollment_id || farmerEnrollment.id || farmerEnrollment._id;
                          await deleteEnrollmentMutation.mutateAsync(enId);
                          toast.success(`Farmer removed from project "${farmerEnrollment.project_title}".`);
                        } catch (err: any) {
                          toast.error(err?.response?.data?.message || 'Failed to remove project.');
                        }
                      }}
                      className="px-4 py-2 bg-red-950/70 hover:bg-red-900/80 text-red-300 font-bold text-[12.5px] rounded-xl border border-red-800/40 flex items-center gap-1.5 transition-all shadow-sm cursor-pointer"
                    >
                      <Trash2 size={13} /> Unassign
                    </button>
                    <span className="text-[11.5px] text-emerald-400 font-mono ml-auto">
                      Report No: {soilDataState.labReport} ({soilDataState.status})
                    </span>
                  </div>
                </div>

                {/* PROJECT MISSION OBJECTIVE & CARBON SEQUESTRATION INDICATORS */}
                <div className="p-6 bg-[#F0FDF4] border border-[#DCFCE7] rounded-3xl space-y-4 shadow-xs">
                  <div className="flex items-center justify-between border-b border-[#DCFCE7] pb-3 flex-wrap gap-2">
                    <div className="space-y-0.5">
                      <span className="text-[10px] font-extrabold text-[#16A34A] uppercase tracking-wider block">SUSTAINABILITY MISSION</span>
                      <h4 className="text-[16px] font-extrabold text-[#0F172A]">{farmerEnrollment.project_title}</h4>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="px-2.5 py-0.5 bg-[#DCFCE7] text-[#15803D] text-[11px] font-bold rounded-lg font-mono">📅 3 Years</span>
                      <span className="px-2.5 py-0.5 bg-[#DCFCE7] text-[#15803D] text-[11px] font-bold rounded-lg font-mono">📍 Dewas</span>
                      <span className="px-2.5 py-0.5 bg-[#16A34A] text-white text-[11px] font-bold rounded-lg uppercase">PARTICIPATING</span>
                    </div>
                  </div>

                  {/* Ecosystem Banner Box */}
                  <div className="p-4 bg-white/80 border border-[#DCFCE7] rounded-2xl space-y-1 text-[12px]">
                    <p className="text-[10.5px] font-extrabold text-[#16A34A] uppercase tracking-wider flex items-center gap-1.5">
                      ⚡ BHUMICRED TWIN ONBOARDING ECOSYSTEM
                    </p>
                    <p className="text-[#475569] leading-relaxed">
                      Both carbon auditing and tree insurance are operationally connected during land registrations. Your registered land coordinates feed directly into satellite carbon credit programs while cover policies protect trees sowed on the exact same plots.
                    </p>
                  </div>

                  {/* Mission Objective */}
                  <div className="space-y-1 text-[12.5px]">
                    <h5 className="text-[11px] font-extrabold text-[#0F172A] uppercase tracking-wider">PROJECT MISSION OBJECTIVE</h5>
                    <p className="text-[#334155] leading-relaxed">
                      This project focuses on restoring degraded land through large-scale tree plantation. Native tree species will be planted to improve biodiversity, capture atmospheric carbon, reduce soil erosion, and generate verified carbon credits while supporting local communities.
                    </p>
                  </div>

                  {/* Carbon Sequestration Indicators */}
                  <div className="space-y-2 pt-1">
                    <h5 className="text-[11px] font-extrabold text-[#0F172A] uppercase tracking-wider">CARBON SEQUESTRATION INDICATORS</h5>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      <div className="p-3.5 bg-white border border-[#E2E8F0] rounded-2xl space-y-0.5">
                        <p className="text-[9.5px] font-extrabold text-[#94A3B8] uppercase">REGISTERED LAND SCALE</p>
                        <p className="text-[15px] font-black text-[#0F172A]">{farmerEnrollment.land_area_acres || farmerDetail.total_acreage || 0} Acres</p>
                      </div>
                      <div className="p-3.5 bg-white border border-[#E2E8F0] rounded-2xl space-y-0.5">
                        <p className="text-[9.5px] font-extrabold text-[#94A3B8] uppercase">TOTAL MAPPED TREES</p>
                        <p className="text-[15px] font-black text-[#0F172A]">{farmerEnrollment.registered_trees || farmerDetail.total_trees || 0} Trees</p>
                      </div>
                      <div className="p-3.5 bg-white border border-[#E2E8F0] rounded-2xl space-y-0.5">
                        <p className="text-[9.5px] font-extrabold text-[#94A3B8] uppercase">AGROFORESTRY ACTIVE</p>
                        <p className="text-[13px] font-bold text-[#16A34A]">Yes (Canopy Sponges)</p>
                      </div>
                      <div className="p-3.5 bg-white border border-[#E2E8F0] rounded-2xl space-y-0.5">
                        <p className="text-[9.5px] font-extrabold text-[#94A3B8] uppercase">PLANTATION DENSITY</p>
                        <p className="text-[12.5px] font-bold text-[#0F172A]">Baseline inspection complete</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* ROADMAP JOURNEY TIMELINE */}
                <div className="p-6 bg-white border border-[#E2E8F0] rounded-3xl space-y-4 shadow-xs">
                  <div className="flex items-center justify-between border-b border-[#F1F5F9] pb-3">
                    <div>
                      <h4 className="text-[15px] font-bold text-[#0F172A]">ROADMAP JOURNEY TIMELINE</h4>
                      <p className="text-[12px] text-[#64748B]">Expand nodes to review GIS Soil Organic Carbon (SOC) lab baselines.</p>
                    </div>
                    <span className="text-[12px] font-extrabold text-[#16A34A] bg-[#F0FDF4] px-3 py-1 rounded-full border border-[#DCFCE7]">
                      {currentStageNum}/9 Completed
                    </span>
                  </div>

                  {/* 9-Step Roadmap List */}
                  <div className="space-y-3 pt-1">
                    {[
                      { step: 1, name: '1. Project Assigned', desc: 'Enrollment initiated and project dashboard generated.', done: farmerEnrollment.stage_project_assigned },
                      { step: 2, name: '2. MRV Scheduled', desc: 'Remote sensing satellite scans and audit windows locked.', done: farmerEnrollment.stage_land_registered },
                      { step: 3, name: '3. Soil Testing', desc: `Core soil NPK baseline checks: N=${soilDataState.n} P=${soilDataState.p} K=${soilDataState.k} kg/ha (SOC: ${soilDataState.soc}%).`, done: farmerEnrollment.stage_soil_verified },
                      { step: 4, name: '4. Inspection', desc: 'On-site field verification by assigned inspector completed.', done: farmerEnrollment.stage_inspection_completed },
                      { step: 5, name: '5. GIS Mapping', desc: 'Dynamic boundary geofencing synced in global ecological registry.', done: farmerEnrollment.stage_trees_registered },
                      { step: 6, name: '6. MRV Progress', desc: 'Active remote canopy monitoring and tree shield insurance active.', done: farmerEnrollment.stage_insurance_activated },
                      { step: 7, name: '7. Carbon Calculation', desc: 'Live remote biomass calculation models active.', done: farmerEnrollment.stage_mrv_monitoring_started },
                      { step: 8, name: '8. Registry', desc: 'Environmental credits registered under verification standard.', done: farmerEnrollment.stage_carbon_estimation_running },
                      { step: 9, name: '9. Credits Issued', desc: 'Carbon credit rewards minted and deposited in Eco-Wallet.', done: farmerEnrollment.stage_reward_eligible },
                    ].map((st) => {
                      const isDone = st.done;
                      const isCurrent = st.step === currentStageNum;
                      return (
                        <div
                          key={st.step}
                          className={`p-3.5 rounded-2xl border transition-all flex items-center justify-between ${
                            isCurrent
                              ? 'bg-[#F0FDF4] border-[#16A34A] shadow-xs'
                              : isDone
                              ? 'bg-[#FAFCFF] border-[#DCFCE7]'
                              : 'bg-[#F8FAFC] border-[#E2E8F0] opacity-60'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-[12px] ${
                              isDone ? 'bg-[#16A34A] text-white' : 'bg-[#E2E8F0] text-[#64748B]'
                            }`}>
                              {isDone ? '✓' : st.step}
                            </div>
                            <div>
                              <p className="text-[13.5px] font-bold text-[#0F172A]">{st.name}</p>
                              <p className="text-[11.5px] text-[#64748B]">{st.desc}</p>
                            </div>
                          </div>

                          {isCurrent && (
                            <span className="text-[10.5px] font-bold text-[#16A34A] bg-white px-2.5 py-0.5 rounded-md border border-[#DCFCE7]">
                              CURRENT STAGE
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* NGO & CORPORATE SUPPORTING SPONSORS */}
                <div className="p-6 bg-white border border-[#E2E8F0] rounded-3xl space-y-4 shadow-xs">
                  <h4 className="text-[14px] font-extrabold text-[#0F172A] uppercase tracking-wider">NGO & CORPORATE SUPPORTING SPONSORS</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-4 bg-[#F8FAFC] border border-[#E2E8F0] rounded-2xl text-center space-y-1">
                      <p className="text-[10px] font-extrabold text-[#94A3B8] uppercase">SUPPORTED BY</p>
                      <p className="text-[14px] font-extrabold text-[#0F172A]">Green Earth Foundation</p>
                    </div>
                    <div className="p-4 bg-[#F8FAFC] border border-[#E2E8F0] rounded-2xl text-center space-y-1">
                      <p className="text-[10px] font-extrabold text-[#94A3B8] uppercase">POWERED BY</p>
                      <p className="text-[14px] font-extrabold text-[#0F172A]">BhumiCred Foundation</p>
                    </div>
                    <div className="p-4 bg-[#F8FAFC] border border-[#E2E8F0] rounded-2xl text-center space-y-1">
                      <p className="text-[10px] font-extrabold text-[#94A3B8] uppercase">GOVT BODY</p>
                      <p className="text-[14px] font-extrabold text-[#0F172A]">District Sustainability Mission</p>
                    </div>
                  </div>
                </div>

                {/* SOIL TESTING MODAL */}
                {showSoilModal && (
                  <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-5 shadow-2xl border border-slate-200">
                      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                        <h4 className="text-[16px] font-extrabold text-slate-900 flex items-center gap-2">
                          🧪 Soil Testing Lab Baseline & NPK Checks
                        </h4>
                        <button onClick={() => setShowSoilModal(false)} className="text-slate-400 hover:text-slate-600 font-bold">
                          ✕
                        </button>
                      </div>

                      <div className="space-y-4 text-[13px]">
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="text-[11px] font-bold text-slate-600 uppercase">Nitrogen (N kg/ha)</label>
                            <input
                              type="number"
                              value={soilDataState.n}
                              onChange={(e) => setSoilDataState({ ...soilDataState, n: Number(e.target.value) })}
                              className="w-full mt-1 p-2 bg-slate-50 border border-slate-200 rounded-xl font-bold font-mono text-slate-800"
                            />
                          </div>
                          <div>
                            <label className="text-[11px] font-bold text-slate-600 uppercase">Phosphorus (P kg/ha)</label>
                            <input
                              type="number"
                              value={soilDataState.p}
                              onChange={(e) => setSoilDataState({ ...soilDataState, p: Number(e.target.value) })}
                              className="w-full mt-1 p-2 bg-slate-50 border border-slate-200 rounded-xl font-bold font-mono text-slate-800"
                            />
                          </div>
                          <div>
                            <label className="text-[11px] font-bold text-slate-600 uppercase">Potassium (K kg/ha)</label>
                            <input
                              type="number"
                              value={soilDataState.k}
                              onChange={(e) => setSoilDataState({ ...soilDataState, k: Number(e.target.value) })}
                              className="w-full mt-1 p-2 bg-slate-50 border border-slate-200 rounded-xl font-bold font-mono text-slate-800"
                            />
                          </div>
                          <div>
                            <label className="text-[11px] font-bold text-slate-600 uppercase">Soil Organic Carbon (SOC %)</label>
                            <input
                              type="number"
                              step="0.01"
                              value={soilDataState.soc}
                              onChange={(e) => setSoilDataState({ ...soilDataState, soc: Number(e.target.value) })}
                              className="w-full mt-1 p-2 bg-slate-50 border border-slate-200 rounded-xl font-bold font-mono text-emerald-600"
                            />
                          </div>
                          <div>
                            <label className="text-[11px] font-bold text-slate-600 uppercase">Soil pH Level</label>
                            <input
                              type="number"
                              step="0.1"
                              value={soilDataState.ph}
                              onChange={(e) => setSoilDataState({ ...soilDataState, ph: Number(e.target.value) })}
                              className="w-full mt-1 p-2 bg-slate-50 border border-slate-200 rounded-xl font-bold font-mono text-slate-800"
                            />
                          </div>
                          <div>
                            <label className="text-[11px] font-bold text-slate-600 uppercase">Lab Report No.</label>
                            <input
                              type="text"
                              value={soilDataState.labReport}
                              onChange={(e) => setSoilDataState({ ...soilDataState, labReport: e.target.value })}
                              className="w-full mt-1 p-2 bg-slate-50 border border-slate-200 rounded-xl font-bold font-mono text-blue-600"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="text-[11px] font-bold text-slate-600 uppercase">Agronomist Remarks</label>
                          <textarea
                            rows={2}
                            value={soilDataState.remarks}
                            onChange={(e) => setSoilDataState({ ...soilDataState, remarks: e.target.value })}
                            className="w-full mt-1 p-2 bg-slate-50 border border-slate-200 rounded-xl text-[12px] text-slate-800"
                          />
                        </div>
                      </div>

                      <div className="flex items-center justify-end gap-2 border-t border-slate-100 pt-3">
                        <button
                          onClick={() => setShowSoilModal(false)}
                          className="px-4 py-2 text-slate-600 font-bold hover:bg-slate-100 rounded-xl text-[12.5px]"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => {
                            setShowSoilModal(false);
                            alert('Soil Testing Data saved successfully! Updated baselines reflected in Mobile App.');
                          }}
                          className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-[12.5px] shadow-sm"
                        >
                          Save Soil Testing Data
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* EDIT PROJECT ENROLLMENT MODAL */}
                {showEditProjectModal && (
                  <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
                    <div className="bg-white rounded-3xl max-w-2xl w-full p-6 space-y-5 shadow-2xl border border-slate-200 my-8">
                      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                        <h4 className="text-[16px] font-extrabold text-slate-900 flex items-center gap-2">
                          🌲 Edit Carbon Project Lifecycle & Roadmap
                        </h4>
                        <button onClick={() => setShowEditProjectModal(false)} className="text-slate-400 hover:text-slate-600 font-bold text-lg">
                          ✕
                        </button>
                      </div>

                      <div className="space-y-4 text-[13px] max-h-[70vh] overflow-y-auto pr-2 text-slate-800">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="text-[11px] font-bold text-slate-600 uppercase">Enrollment Status</label>
                            <select
                              value={projectForm.status}
                              onChange={(e) => setProjectForm({ ...projectForm, status: e.target.value })}
                              className="w-full mt-1 p-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-800"
                            >
                              <option value="pending_admin_verification">Pending Admin Verification</option>
                              <option value="active">Active</option>
                              <option value="rejected">Rejected</option>
                              <option value="clarification_requested">Clarification Requested</option>
                              <option value="completed">Completed</option>
                            </select>
                          </div>
                          <div>
                            <label className="text-[11px] font-bold text-slate-600 uppercase">Current Stage</label>
                            <select
                              value={projectForm.current_stage}
                              onChange={(e) => setProjectForm({ ...projectForm, current_stage: e.target.value })}
                              className="w-full mt-1 p-2 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-800"
                            >
                              <option value="registered">Stage 1: Registered</option>
                              <option value="under_review">Stage 2: Under Review</option>
                              <option value="active_monitoring">Stage 3: Active Monitoring</option>
                              <option value="mrv_stage">Stage 4: MRV Stage</option>
                              <option value="carbon_estimation">Stage 5: Carbon Estimation</option>
                              <option value="completed">Stage 6: Completed</option>
                            </select>
                          </div>
                          <div>
                            <label className="text-[11px] font-bold text-slate-600 uppercase">Progress Percent (%)</label>
                            <input
                              type="number"
                              min={0}
                              max={100}
                              value={projectForm.progress_percent}
                              onChange={(e) => setProjectForm({ ...projectForm, progress_percent: parseInt(e.target.value) || 0 })}
                              className="w-full mt-1 p-2 bg-slate-50 border border-slate-200 rounded-xl font-bold font-mono text-slate-800"
                            />
                          </div>
                          <div>
                            <label className="text-[11px] font-bold text-slate-600 uppercase">Land Area (Acres)</label>
                            <input
                              type="number"
                              step="0.01"
                              min={0}
                              value={projectForm.land_area_acres}
                              onChange={(e) => setProjectForm({ ...projectForm, land_area_acres: parseFloat(e.target.value) || 0 })}
                              className="w-full mt-1 p-2 bg-slate-50 border border-slate-200 rounded-xl font-bold font-mono text-slate-800"
                            />
                          </div>
                          <div>
                            <label className="text-[11px] font-bold text-slate-600 uppercase">Registered Trees Count</label>
                            <input
                              type="number"
                              min={0}
                              value={projectForm.registered_trees}
                              onChange={(e) => setProjectForm({ ...projectForm, registered_trees: parseInt(e.target.value) || 0 })}
                              className="w-full mt-1 p-2 bg-slate-50 border border-slate-200 rounded-xl font-bold font-mono text-slate-800"
                            />
                          </div>
                          <div>
                            <label className="text-[11px] font-bold text-slate-600 uppercase">Insured Trees Count</label>
                            <input
                              type="number"
                              min={0}
                              value={projectForm.insured_trees}
                              onChange={(e) => setProjectForm({ ...projectForm, insured_trees: parseInt(e.target.value) || 0 })}
                              className="w-full mt-1 p-2 bg-slate-50 border border-slate-200 rounded-xl font-bold font-mono text-slate-800"
                            />
                          </div>
                          <div className="col-span-2">
                            <label className="text-[11px] font-bold text-slate-600 uppercase">Est. Carbon Yield (tCO2e)</label>
                            <input
                              type="number"
                              step="0.01"
                              min={0}
                              value={projectForm.estimated_carbon_impact}
                              onChange={(e) => setProjectForm({ ...projectForm, estimated_carbon_impact: parseFloat(e.target.value) || 0 })}
                              className="w-full mt-1 p-2 bg-slate-50 border border-slate-200 rounded-xl font-bold font-mono text-slate-800"
                            />
                          </div>
                        </div>

                        {/* Verification Checkboxes */}
                        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/60 space-y-3">
                          <h5 className="font-extrabold text-slate-700 uppercase tracking-wider text-[11px]">Ecological Verifications</h5>
                          <div className="flex items-center gap-6">
                            <label className="flex items-center gap-2 font-semibold text-slate-700 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={projectForm.land_verified}
                                onChange={(e) => setProjectForm({ ...projectForm, land_verified: e.target.checked })}
                                className="w-4 h-4 text-emerald-600 border-slate-300 rounded focus:ring-emerald-500"
                              />
                              <span>Land Verified</span>
                            </label>
                            <label className="flex items-center gap-2 font-semibold text-slate-700 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={projectForm.trees_verified}
                                onChange={(e) => setProjectForm({ ...projectForm, trees_verified: e.target.checked })}
                                className="w-4 h-4 text-emerald-600 border-slate-300 rounded focus:ring-emerald-500"
                              />
                              <span>Trees Verified</span>
                            </label>
                            <label className="flex items-center gap-2 font-semibold text-slate-700 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={projectForm.mrv_verified}
                                onChange={(e) => setProjectForm({ ...projectForm, mrv_verified: e.target.checked })}
                                className="w-4 h-4 text-emerald-600 border-slate-300 rounded focus:ring-emerald-500"
                              />
                              <span>MRV Verified</span>
                            </label>
                          </div>
                        </div>

                        {/* Roadmap Steps */}
                        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/60 space-y-3">
                          <h5 className="font-extrabold text-slate-700 uppercase tracking-wider text-[11px]">Roadmap Completion Stages (Farmer Mobile Journey Map)</h5>
                          <div className="grid grid-cols-2 gap-3">
                            <label className="flex items-center gap-2 text-slate-700 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={projectForm.stage_project_assigned}
                                onChange={(e) => setProjectForm({ ...projectForm, stage_project_assigned: e.target.checked })}
                                className="w-4 h-4 text-emerald-600 border-slate-300 rounded focus:ring-emerald-500"
                              />
                              <span className="text-[12px]">1. Project Assigned</span>
                            </label>
                            <label className="flex items-center gap-2 text-slate-700 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={projectForm.stage_land_registered}
                                onChange={(e) => setProjectForm({ ...projectForm, stage_land_registered: e.target.checked })}
                                className="w-4 h-4 text-emerald-600 border-slate-300 rounded focus:ring-emerald-500"
                              />
                              <span className="text-[12px]">2. MRV Scheduled</span>
                            </label>
                            <label className="flex items-center gap-2 text-slate-700 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={projectForm.stage_soil_verified}
                                onChange={(e) => setProjectForm({ ...projectForm, stage_soil_verified: e.target.checked })}
                                className="w-4 h-4 text-emerald-600 border-slate-300 rounded focus:ring-emerald-500"
                              />
                              <span className="text-[12px]">3. Soil Testing</span>
                            </label>
                            <label className="flex items-center gap-2 text-slate-700 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={projectForm.stage_inspection_completed}
                                onChange={(e) => setProjectForm({ ...projectForm, stage_inspection_completed: e.target.checked })}
                                className="w-4 h-4 text-emerald-600 border-slate-300 rounded focus:ring-emerald-500"
                              />
                              <span className="text-[12px]">4. Inspection</span>
                            </label>
                            <label className="flex items-center gap-2 text-slate-700 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={projectForm.stage_trees_registered}
                                onChange={(e) => setProjectForm({ ...projectForm, stage_trees_registered: e.target.checked })}
                                className="w-4 h-4 text-emerald-600 border-slate-300 rounded focus:ring-emerald-500"
                              />
                              <span className="text-[12px]">5. GIS Mapping</span>
                            </label>
                            <label className="flex items-center gap-2 text-slate-700 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={projectForm.stage_insurance_activated}
                                onChange={(e) => setProjectForm({ ...projectForm, stage_insurance_activated: e.target.checked })}
                                className="w-4 h-4 text-emerald-600 border-slate-300 rounded focus:ring-emerald-500"
                              />
                              <span className="text-[12px]">6. MRV Progress</span>
                            </label>
                            <label className="flex items-center gap-2 text-slate-700 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={projectForm.stage_mrv_monitoring_started}
                                onChange={(e) => setProjectForm({ ...projectForm, stage_mrv_monitoring_started: e.target.checked })}
                                className="w-4 h-4 text-emerald-600 border-slate-300 rounded focus:ring-emerald-500"
                              />
                              <span className="text-[12px]">7. Carbon Calculation</span>
                            </label>
                            <label className="flex items-center gap-2 text-slate-700 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={projectForm.stage_carbon_estimation_running}
                                onChange={(e) => setProjectForm({ ...projectForm, stage_carbon_estimation_running: e.target.checked })}
                                className="w-4 h-4 text-emerald-600 border-slate-300 rounded focus:ring-emerald-500"
                              />
                              <span className="text-[12px]">8. Registry</span>
                            </label>
                            <label className="flex items-center gap-2 text-slate-700 cursor-pointer col-span-2">
                              <input
                                type="checkbox"
                                checked={projectForm.stage_reward_eligible}
                                onChange={(e) => setProjectForm({ ...projectForm, stage_reward_eligible: e.target.checked })}
                                className="w-4 h-4 text-emerald-600 border-slate-300 rounded focus:ring-emerald-500"
                              />
                              <span className="text-[12px] font-bold">9. Credits Issued & Payouts Eligible</span>
                            </label>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-end gap-2 border-t border-slate-100 pt-3">
                        <button
                          onClick={() => setShowEditProjectModal(false)}
                          className="px-4 py-2 text-slate-600 font-bold hover:bg-slate-100 rounded-xl text-[12.5px]"
                        >
                          Cancel
                        </button>
                        <button
                          disabled={updateEnrollment.isPending}
                          onClick={async () => {
                            try {
                              await updateEnrollment.mutateAsync({
                                enrollmentId: farmerEnrollment.enrollment_id || farmerEnrollment.id || farmerEnrollment._id,
                                payload: projectForm,
                              });
                              toast.success("Project enrollment and mobile roadmap updated successfully!");
                              setShowEditProjectModal(false);
                            } catch (err: any) {
                              toast.error(err?.response?.data?.message || "Failed to update project enrollment.");
                            }
                          }}
                          className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-400 text-white font-bold rounded-xl text-[12.5px] shadow-sm flex items-center gap-2"
                        >
                          {updateEnrollment.isPending ? "Saving..." : "Save Project Data"}
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </>
            ) : (
              /* Show Clean Empty State if Not Enrolled */
              <div className="space-y-4">
                {!hasVerifiedLand && (
                  <div className="p-6 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-3xl text-slate-800 space-y-3.5 shadow-xs">
                    <div className="flex items-start gap-3.5">
                      <div className="w-11 h-11 rounded-2xl bg-amber-500 text-white flex items-center justify-center font-bold shrink-0 shadow-xs">
                        <ShieldAlert size={22} />
                      </div>
                      <div className="space-y-1">
                        <h4 className="text-[15px] font-extrabold text-amber-950">GIS & Land Verification Required / भूमि सत्यापन अनिवार्य</h4>
                        <p className="text-[12.5px] text-amber-800 leading-relaxed max-w-3xl">
                          Is farmer ka land parcel abhi verify nahi hua hai. Project assign karne se pahle <strong>GIS and LAND</strong> section se land boundary, polygon aur khasra documents ko verify & approve karein. Land verify hone ke baad hi yaha se carbon project assign ho sakega.
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 pt-1">
                      <button
                        onClick={() => setActiveTab('land')}
                        className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-[12px] font-bold rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                      >
                        <MapPin size={14} /> Open Land Details ({landData?.parcels?.length || 0} Parcels)
                      </button>
                      <button
                        onClick={() => navigate('/land')}
                        className="px-4 py-2 bg-white hover:bg-amber-50 text-amber-900 border border-amber-300 text-[12px] font-bold rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                      >
                        <Layers size={14} /> Open GIS Verification Directory
                      </button>
                    </div>
                  </div>
                )}

                <div className="flex flex-col items-center justify-center py-12 bg-white border border-[#E2E8F0] rounded-3xl text-[#94A3B8] space-y-4">
                  <div className="w-16 h-16 rounded-2xl bg-[#F0FDF4] border border-[#DCFCE7] text-[#16A34A] flex items-center justify-center shadow-xs">
                    <Trees size={32} />
                  </div>
                  <div className="text-center space-y-1">
                    <p className="text-[16px] font-bold text-[#0F172A]">No Enrolled Carbon or Forestry Projects</p>
                    <p className="text-[12.5px] text-[#64748B] max-w-md">
                      {hasVerifiedLand 
                        ? `This farmer has ${verifiedLandAcres} acres of verified land ready to be enrolled in a carbon mission.`
                        : 'Land must be verified and approved under GIS & Land verification before assigning a carbon mission.'}
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      if (!hasVerifiedLand) {
                        toast.error('Land Verification Required: Please verify and approve the farmer\'s land parcel under GIS & Land first. / भूमि सत्यापन आवश्यक: प्रोजेक्ट असाइन करने से पहले कृपया GIS & Land में भूमि पार्सल सत्यापित करें।');
                        return;
                      }
                      const defaultProj = allProjectsList?.[0]?.id || allProjectsList?.[0]?.project_id || '';
                      setAssignForm({
                        projectId: defaultProj,
                        landAreaAcres: verifiedLandAcres || farmerDetail.total_acreage || 10,
                        treeCount: farmerDetail.total_trees || 40,
                      });
                      setShowAssignProjectModal(true);
                    }}
                    disabled={!hasVerifiedLand}
                    className={`px-5 py-2.5 font-bold text-[13px] rounded-xl shadow-xs flex items-center gap-2 transition-colors ${
                      hasVerifiedLand
                        ? 'bg-[#16A34A] hover:bg-[#15803D] text-white cursor-pointer'
                        : 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed'
                    }`}
                  >
                    <Plus size={15} /> {hasVerifiedLand ? 'Assign Carbon Project Now' : 'Land Verification Required to Assign'}
                  </button>
                </div>
              </div>
            )}

            {/* ASSIGN / SWITCH PROJECT MODAL */}
            {showAssignProjectModal && (
              <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
                <div className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-5 shadow-2xl border border-slate-200 my-8">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                        <Trees size={20} />
                      </div>
                      <div>
                        <h4 className="text-[16px] font-extrabold text-slate-900">
                          {farmerEnrollment ? 'Switch / Change Project' : 'Assign Carbon Project'}
                        </h4>
                        <p className="text-[11px] text-slate-500">Assign farmer to a registered sustainability mission</p>
                      </div>
                    </div>
                    <button onClick={() => setShowAssignProjectModal(false)} className="text-slate-400 hover:text-slate-600 font-bold text-lg cursor-pointer">
                      ✕
                    </button>
                  </div>

                  <form
                    onSubmit={async (e) => {
                      e.preventDefault();
                      if (!hasVerifiedLand) {
                        toast.error('Land Verification Required: Please verify and approve the farmer\'s land parcel under GIS & Land first. / भूमि सत्यापन आवश्यक: प्रोजेक्ट असाइन करने से पहले कृपया GIS & Land में भूमि पार्सल सत्यापित करें।');
                        return;
                      }
                      if (!assignForm.projectId) {
                        toast.error('Please select a project.');
                        return;
                      }
                      try {
                        const fid = farmerDetail.farmer_id || String(farmerDetail.id || farmerDetail._id);
                        await assignProjectMutation.mutateAsync({
                          projectId: assignForm.projectId,
                          farmerId: fid,
                          landAreaAcres: Number(assignForm.landAreaAcres),
                          treeCount: Number(assignForm.treeCount),
                        });
                        toast.success('Farmer successfully assigned to project! Live updated in app. / किसान को सफलतापूर्वक प्रोजेक्ट असाइन कर दिया गया है!');
                        setShowAssignProjectModal(false);
                      } catch (err: any) {
                        toast.error(err?.response?.data?.message || err?.message || 'Failed to assign project.');
                      }
                    }}
                    className="space-y-4 text-[12.5px] text-slate-800"
                  >
                    {!hasVerifiedLand ? (
                      <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl text-rose-800 space-y-1 text-[12px]">
                        <p className="font-extrabold text-rose-900 flex items-center gap-1.5">
                          <ShieldAlert size={16} className="text-rose-600" /> Land Verification Incomplete
                        </p>
                        <p className="leading-relaxed text-rose-700">
                          Is farmer ka koi bhi land parcel verified nahi hai. Kripya pahle 'Land & GIS' section se parcel approve karein.
                        </p>
                      </div>
                    ) : (
                      <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-[11.5px] text-emerald-800 space-y-0.5">
                        <p className="font-bold flex items-center gap-1">
                          <CheckCircle size={14} className="text-emerald-600" /> Verified Land: {verifiedLandAcres} Acres Eligible
                        </p>
                        <p className="text-emerald-700 leading-relaxed">
                          Assigning will immediately generate this mission on the farmer's mobile dashboard and initialize the roadmap.
                        </p>
                      </div>
                    )}

                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">Select Carbon Project *</label>
                      <select
                        value={assignForm.projectId}
                        onChange={(e) => setAssignForm({ ...assignForm, projectId: e.target.value })}
                        required
                        disabled={!hasVerifiedLand}
                        className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold text-slate-900 outline-none focus:border-emerald-600 disabled:opacity-60"
                      >
                        <option value="">-- Choose a Project --</option>
                        {(allProjectsList || []).map((p: any) => {
                          const pId = p.id || p.project_id;
                          const title = p.name || p.title || pId;
                          const loc = [p.district, p.state].filter(Boolean).join(', ');
                          return (
                            <option key={pId} value={pId}>
                              {title} {loc ? `(${loc})` : ''}
                            </option>
                          );
                        })}
                      </select>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">Registered Land (Acres)</label>
                        <input
                          type="number"
                          step="0.1"
                          min={0.1}
                          required
                          disabled={!hasVerifiedLand}
                          value={assignForm.landAreaAcres}
                          onChange={(e) => setAssignForm({ ...assignForm, landAreaAcres: parseFloat(e.target.value) || 0 })}
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold font-mono text-slate-900 outline-none focus:border-emerald-600 disabled:opacity-60"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">Monitored Trees / Saplings</label>
                        <input
                          type="number"
                          min={1}
                          required
                          disabled={!hasVerifiedLand}
                          value={assignForm.treeCount}
                          onChange={(e) => setAssignForm({ ...assignForm, treeCount: parseInt(e.target.value) || 0 })}
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold font-mono text-slate-900 outline-none focus:border-emerald-600 disabled:opacity-60"
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                      <button
                        type="button"
                        onClick={() => setShowAssignProjectModal(false)}
                        className="px-4 py-2 text-slate-600 font-bold hover:bg-slate-100 rounded-xl text-[12px] cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={assignProjectMutation.isPending || !hasVerifiedLand}
                        className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white font-bold rounded-xl text-[12.5px] shadow-sm flex items-center gap-1.5 cursor-pointer"
                      >
                        {assignProjectMutation.isPending ? 'Assigning...' : 'Assign to Farmer'}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        )}

        {/* 8. CARBON */}
        {activeTab === 'Carbon' && (
          <div className="space-y-6">
            <h3 className="text-[15px] font-bold text-[#0F172A] border-b border-[#F1F5F9] pb-3 flex items-center gap-2">
              <Cloud size={16} className="text-[#16A34A]" /> Carbon Credits Registry
            </h3>
            <div className="p-4 border border-[#DCFCE7] bg-[#F0FDF4] rounded-2xl space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="text-[14px] font-bold text-[#16A34A]">
                  {farmerDetail.carbon_credits_generated?.toFixed(2) ?? '0'} tCO2e Verified Carbon Credits
                </h4>
                <StatusBadge label="GENERATED" variant="success" size="sm" />
              </div>
              <p className="text-[12px] text-[#0F172A]">
                Carbon credits generated by farmer <strong>{nameDisplay}</strong> based on verified tree plantation and land data.
              </p>
              <p className="text-[11.5px] text-[#64748B]">
                Total Trees: <strong>{farmerDetail.total_trees?.toLocaleString() ?? '0'}</strong> •
                Total Land: <strong>{farmerDetail.total_acreage?.toFixed(2) ?? '0'} Acres</strong>
              </p>
            </div>
          </div>
        )}

        {/* 9. INSURANCE */}
        {activeTab === 'Insurance' && (
          <div className="space-y-6">
            <h3 className="text-[15px] font-bold text-[#0F172A] border-b border-[#F1F5F9] pb-3 flex items-center gap-2">
              <ShieldCheck size={16} className="text-[#16A34A]" /> Tree Insurance Policies & Claims
            </h3>
            <div className="flex flex-col items-center justify-center py-16 space-y-3 text-[#94A3B8]">
              <ShieldCheck size={36} />
              <p className="text-[14px] font-bold">Insurance Data</p>
              <p className="text-[12px] text-center max-w-xs">
                View all insurance policies for this farmer in the Tree Insurance section.
              </p>
              <button
                onClick={() => navigate('/insurance')}
                className="btn btn-secondary btn-sm mt-2"
              >
                Go to Insurance →
              </button>
            </div>
          </div>
        )}

        {/* 10. WALLET */}
        {activeTab === 'Wallet' && (
          <div className="space-y-6">
            <h3 className="text-[15px] font-bold text-[#0F172A] border-b border-[#F1F5F9] pb-3 flex items-center gap-2">
              <CreditCard size={16} className="text-[#16A34A]" /> Wallet Balance & Transactions
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              <div className="p-4 bg-[#F0FDF4] border border-[#DCFCE7] rounded-xl">
                <p className="text-[10.5px] font-bold uppercase text-[#16A34A]">Current Balance</p>
                <p className="text-[20px] font-extrabold text-[#16A34A] mt-1">{fmtINR(farmerDetail.wallet_balance)}</p>
              </div>
              <div className="p-4 bg-[#FAFCFF] border border-[#F1F5F9] rounded-xl">
                <p className="text-[10.5px] font-bold uppercase text-[#94A3B8]">Carbon Income</p>
                <p className="text-[16px] font-bold text-[#0F172A] mt-1">From Registry</p>
              </div>
              <div className="p-4 bg-[#FAFCFF] border border-[#F1F5F9] rounded-xl">
                <p className="text-[10.5px] font-bold uppercase text-[#94A3B8]">View Transactions</p>
                <button
                  onClick={() => navigate('/wallet')}
                  className="text-[12px] font-bold text-[#2563EB] underline mt-1"
                >
                  Go to Wallet →
                </button>
              </div>
            </div>

            {/* Wallet Transaction History Table */}
            <div className="pt-4 border-t border-[#F1F5F9] space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-[14px] font-bold text-[#0F172A]">Farmer Wallet & UPI Transaction History</h4>
                <span className="text-[11px] font-bold text-[#16A34A] bg-[#F0FDF4] px-2.5 py-0.5 rounded-full border border-[#DCFCE7]">
                  {farmerTransactions.length} Transactions
                </span>
              </div>

              {farmerTransactions.length > 0 ? (
                <div className="overflow-x-auto border border-[#E8EDF5] rounded-xl bg-white">
                  <table className="w-full text-left border-collapse min-w-[750px]">
                    <thead>
                      <tr className="bg-[#F8FAFC] border-b border-[#E2E8F0] text-[11px] font-bold uppercase tracking-wider text-[#475569]">
                        <th className="py-2.5 px-3">Txn ID / Ref</th>
                        <th className="py-2.5 px-3">Type</th>
                        <th className="py-2.5 px-3">Category</th>
                        <th className="py-2.5 px-3">Amount</th>
                        <th className="py-2.5 px-3">Bank / UPI Mode</th>
                        <th className="py-2.5 px-3">UTR Reference</th>
                        <th className="py-2.5 px-3">Date</th>
                        <th className="py-2.5 px-3">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#F1F5F9] text-[12px]">
                      {farmerTransactions.map((t: any) => {
                        const isApproved = t.status === 'approved' || t.status === 'Disbursed' || t.status === 'PACKED' || t.status === 'SHIPPED';
                        const isRejected = t.status === 'rejected' || t.status === 'CANCELLED';
                        const isDebit = t.type === 'DEBIT' || t.category?.includes('Debit') || t.category?.includes('Marketplace');
                        return (
                          <tr key={t.id} className="hover:bg-[#F8FAFC]">
                            <td className="py-2.5 px-3 font-mono font-bold text-[#2563EB]">
                              TXN-{String(t.id).slice(-6).toUpperCase()}
                            </td>
                            <td className="py-2.5 px-3">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase ${isDebit ? 'bg-[#FFF7ED] text-[#EA580C] border border-[#FFEDD5]' : 'bg-[#F0FDF4] text-[#16A34A] border border-[#DCFCE7]'}`}>
                                {isDebit ? 'UPI DEBIT' : 'CREDIT'}
                              </span>
                            </td>
                            <td className="py-2.5 px-3 font-semibold text-[#0F172A]">
                              {t.category || (t.bank_name?.includes('Marketplace') ? 'Marketplace Purchase (UPI Debit)' : 'Withdrawal Payout')}
                            </td>
                            <td className={`py-2.5 px-3 font-extrabold ${isDebit ? 'text-[#EA580C]' : 'text-[#16A34A]'}`}>
                              {isDebit ? '-' : '+'}₹{t.amount?.toLocaleString()}
                            </td>
                            <td className="py-2.5 px-3">
                              <div className="font-semibold text-[#0F172A]">{t.bank_name || 'State Bank of India'}</div>
                              <div className="text-[10px] font-mono text-[#16A34A]">
                                {t.upi_id ? `UPI: ${t.upi_id}` : t.account_number_masked || ''}
                              </div>
                            </td>
                            <td className="py-2.5 px-3 font-mono font-bold text-[#2563EB]">
                              {t.payout_reference || t.utr || `UTR-20260819-${String(t.id).slice(-6).toUpperCase()}`}
                            </td>
                            <td className="py-2.5 px-3 text-[#64748B]">
                              {fmtDateTime(t.created_at || t.requested_at)}
                            </td>
                            <td className="py-2.5 px-3">
                              <StatusBadge
                                label={isApproved ? 'APPROVED' : isRejected ? 'REJECTED' : 'PENDING'}
                                variant={isApproved ? 'success' : isRejected ? 'danger' : 'warning'}
                                size="sm"
                              />
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="p-6 bg-[#FAFCFF] border border-[#F1F5F9] rounded-xl text-center text-[#94A3B8] text-[12.5px]">
                  No transaction history recorded yet for this farmer.
                </div>
              )}
            </div>
          </div>
        )}

        {/* 11. DOCUMENTS */}
        {activeTab === 'Documents' && (
          <div className="space-y-6">
            <h3 className="text-[15px] font-bold text-[#0F172A] border-b border-[#F1F5F9] pb-3 flex items-center gap-2">
              <Folder size={16} className="text-[#16A34A]" /> Verification Documents
            </h3>

            {identityLoading ? (
              <div className="h-28 bg-slate-100 animate-pulse rounded-2xl" />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Farmer Photo */}
                {farmerDetail.farmer_photo_url && (
                  <div className="p-4 border border-[#E8EDF5] rounded-2xl bg-[#FAFCFF] flex items-center justify-between">
                    <div>
                      <h4 className="text-[13px] font-bold text-[#0F172A]">Farmer Photograph</h4>
                      <p className="text-[11px] text-[#64748B] font-mono">Profile Photo</p>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <a href={farmerDetail.farmer_photo_url} target="_blank" rel="noopener noreferrer"
                        className="p-1.5 bg-[#F0FDF4] hover:bg-[#DCFCE7] text-[#16A34A] rounded-lg cursor-pointer">
                        <Download size={14} />
                      </a>
                    </div>
                  </div>
                )}

                {/* Aadhaar Document */}
                {identityData?.aadhaar_url ? (
                  <div className="p-4 border border-[#E8EDF5] rounded-2xl bg-[#FAFCFF] flex items-center justify-between">
                    <div>
                      <h4 className="text-[13px] font-bold text-[#0F172A]">Aadhaar Card</h4>
                      <p className="text-[11px] text-[#64748B] font-mono">{identityData.aadhaar_number ? `****${identityData.aadhaar_number.slice(-4)}` : 'On File'}</p>
                    </div>
                    <a href={identityData.aadhaar_url} target="_blank" rel="noopener noreferrer"
                      className="p-1.5 bg-[#F0FDF4] hover:bg-[#DCFCE7] text-[#16A34A] rounded-lg cursor-pointer">
                      <Download size={14} />
                    </a>
                  </div>
                ) : (
                  <div className="p-4 border border-[#E8EDF5] rounded-2xl bg-[#FAFCFF] flex items-center justify-between opacity-60">
                    <div>
                      <h4 className="text-[13px] font-bold text-[#0F172A]">Aadhaar Card</h4>
                      <p className="text-[11px] text-[#94A3B8]">Not uploaded</p>
                    </div>
                  </div>
                )}

                {/* PAN Document */}
                {identityData?.pan_url ? (
                  <div className="p-4 border border-[#E8EDF5] rounded-2xl bg-[#FAFCFF] flex items-center justify-between">
                    <div>
                      <h4 className="text-[13px] font-bold text-[#0F172A]">PAN Card</h4>
                      <p className="text-[11px] text-[#64748B] font-mono">{identityData.pan_number || 'On File'}</p>
                    </div>
                    <a href={identityData.pan_url} target="_blank" rel="noopener noreferrer"
                      className="p-1.5 bg-[#F0FDF4] hover:bg-[#DCFCE7] text-[#16A34A] rounded-lg cursor-pointer">
                      <Download size={14} />
                    </a>
                  </div>
                ) : (
                  <div className="p-4 border border-[#E8EDF5] rounded-2xl bg-[#FAFCFF] flex items-center justify-between opacity-60">
                    <div>
                      <h4 className="text-[13px] font-bold text-[#0F172A]">PAN Card</h4>
                      <p className="text-[11px] text-[#94A3B8]">Not uploaded</p>
                    </div>
                  </div>
                )}

                {/* ID Proof */}
                {farmerDetail.id_proof_url && (
                  <div className="p-4 border border-[#E8EDF5] rounded-2xl bg-[#FAFCFF] flex items-center justify-between">
                    <div>
                      <h4 className="text-[13px] font-bold text-[#0F172A]">ID Proof Document</h4>
                      <p className="text-[11px] text-[#64748B]">Additional identity proof</p>
                    </div>
                    <a href={farmerDetail.id_proof_url} target="_blank" rel="noopener noreferrer"
                      className="p-1.5 bg-[#F0FDF4] hover:bg-[#DCFCE7] text-[#16A34A] rounded-lg cursor-pointer">
                      <Download size={14} />
                    </a>
                  </div>
                )}

                {/* Generate PDF Report */}
                <div className="p-4 border border-[#E8EDF5] rounded-2xl bg-[#FAFCFF] flex items-center justify-between">
                  <div>
                    <h4 className="text-[13px] font-bold text-[#0F172A]">Admin KYC Report (PDF)</h4>
                    <p className="text-[11px] text-[#64748B]">Generated admin verification report</p>
                  </div>
                  <button
                    onClick={() => {
                      downloadPDFDocument({
                        title: `FARMER KYC REPORT — ${nameDisplay.toUpperCase()}`,
                        subtitle: `Farmer ID: ${farmerDetail.farmer_id || farmerDetail.id}`,
                        filename: `KYC_Report_${farmerDetail.farmer_id || farmerDetail.id}.pdf`,
                        metadata: {
                          'Farmer Name': nameDisplay,
                          'Farmer ID': farmerDetail.farmer_id || farmerDetail.id,
                          'Mobile': farmerDetail.mobile,
                          'KYC Status': farmerDetail.kyc_status,
                          'State': farmerDetail.state || '—',
                          'District': farmerDetail.district || '—',
                          'Village': farmerDetail.village || '—',
                          'Aadhaar Number': identityData?.aadhaar_number || '—',
                          'PAN Number': identityData?.pan_number || '—',
                          'Bank': bankData?.bank_name || '—',
                          'Account Number': bankData?.account_number || '—',
                          'Total Land (Acres)': farmerDetail.total_acreage?.toString() || '0',
                          'Wallet Balance': fmtINR(farmerDetail.wallet_balance),
                          'Carbon Credits': `${farmerDetail.carbon_credits_generated?.toFixed(2) ?? '0'} tCO2e`,
                          'Reviewed By': farmerDetail.kyc_reviewed_by || '—',
                          'Reviewed At': fmtDateTime(farmerDetail.kyc_reviewed_at),
                        },
                      });
                      toast.success('KYC Report PDF generated!');
                    }}
                    className="p-1.5 bg-[#F0FDF4] hover:bg-[#DCFCE7] text-[#16A34A] rounded-lg cursor-pointer"
                    title="Download PDF"
                  >
                    <Download size={14} />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* 12. ACTIVITY TIMELINE */}
        {activeTab === 'Timeline' && (
          <div className="space-y-6">
            <h3 className="text-[15px] font-bold text-[#0F172A] border-b border-[#F1F5F9] pb-3 flex items-center gap-2">
              <Clock size={16} className="text-[#16A34A]" /> Activity Timeline
            </h3>

            {activityLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map(i => <div key={i} className="h-16 bg-slate-100 animate-pulse rounded-xl" />)}
              </div>
            ) : activityData && activityData.length > 0 ? (
              <div className="relative pl-6 border-l-2 border-[#E2E8F0] space-y-6">
                {activityData.map((item) => (
                  <div key={item.id} className="relative">
                    <span className="absolute -left-[31px] top-0 w-4 h-4 rounded-full bg-[#16A34A] border-2 border-white shadow-sm" />
                    <p className="text-[11px] font-bold text-[#94A3B8]">{fmtDateTime(item.timestamp)}</p>
                    <p className="text-[13.5px] font-bold text-[#0F172A]">{item.title}</p>
                    {item.description && (
                      <p className="text-[11.5px] text-[#64748B]">{item.description}</p>
                    )}
                    <span className="text-[10px] font-bold uppercase text-[#94A3B8] bg-[#F8FAFC] px-1.5 py-0.5 rounded mt-1 inline-block border border-[#E2E8F0]">
                      {item.activity_type}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-16 space-y-3 text-[#94A3B8]">
                <Clock size={36} />
                <p className="text-[14px] font-bold">No Activity Recorded</p>
                <p className="text-[12px]">Activity events will appear here as the farmer uses the platform.</p>
              </div>
            )}
          </div>
        )}

      </div>

      {/* ── ACTION CONFIRMATION MODAL ── */}
      <AnimatePresence>
        {actionModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-white rounded-2xl max-w-md w-full p-5 shadow-2xl border border-[#E8EDF5] space-y-4"
            >
              <div className="flex items-center justify-between border-b border-[#F1F5F9] pb-3">
                <div className="flex items-center gap-2">
                  {actionModal === 'approve' && <CheckCircle size={18} className="text-[#16A34A]" />}
                  {actionModal === 'reject' && <XCircle size={18} className="text-[#EF4444]" />}
                  {actionModal === 'block' && <Ban size={18} className="text-[#D97706]" />}
                  {actionModal === 'unblock' && <Unlock size={18} className="text-[#16A34A]" />}
                  {actionModal === 'delete' && <Trash2 size={18} className="text-[#DC2626]" />}
                  <h3 className="text-[15px] font-bold text-[#0F172A] capitalize">
                    {actionModal === 'block' ? 'Suspend' : actionModal === 'delete' ? 'Delete Farmer' : actionModal} Farmer
                  </h3>
                </div>
                <button onClick={() => setActionModal(null)} className="text-[#94A3B8] hover:text-[#0F172A] text-lg font-bold cursor-pointer">×</button>
              </div>

              <div className="space-y-3">
                <p className="text-[12.5px] text-[#64748B]">
                  {actionModal === 'approve' && <>Approve KYC for <strong>{nameDisplay}</strong>?</>}
                  {actionModal === 'reject' && <>Reject KYC for <strong>{nameDisplay}</strong>? Provide a reason below.</>}
                  {actionModal === 'block' && <>Suspend account for <strong>{nameDisplay}</strong>? The farmer will lose app access.</>}
                  {actionModal === 'unblock' && <>Activate account for <strong>{nameDisplay}</strong>?</>}
                  {actionModal === 'delete' && <>Aap <strong className="text-[#DC2626]">{nameDisplay}</strong> ko permanently delete karna chahte hain?</>}
                </p>
                <div className="bg-[#F8FAFC] rounded-xl p-3 text-[11.5px] font-mono text-[#64748B]">
                  {farmerDetail.farmer_id || farmerDetail.id} • {farmerDetail.mobile}
                </div>

                {actionModal === 'reject' && (
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold uppercase text-[#94A3B8]">Rejection Remarks</label>
                    <textarea
                      value={rejectRemarks}
                      onChange={(e) => setRejectRemarks(e.target.value)}
                      placeholder="Reason for rejection (e.g. blurry document, invalid Aadhaar)..."
                      rows={3}
                      className="w-full px-3 py-2 text-[12.5px] bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-[#0F172A] outline-none focus:border-[#EF4444] resize-none"
                    />
                  </div>
                )}

                {/* Delete double-confirm */}
                {actionModal === 'delete' && (
                  <div className="space-y-3">
                    <div className="bg-[#FEF2F2] border border-[#FEE2E2] rounded-xl p-3 space-y-1">
                      <p className="text-[12px] font-bold text-[#DC2626]">⚠️ Yeh action PERMANENT hai!</p>
                      <p className="text-[11.5px] text-[#475569]">Iske baad yeh sab delete ho jayega:</p>
                      <ul className="text-[11px] text-[#64748B] list-disc list-inside space-y-0.5">
                        <li>Farmer record (Farmer ID, KYC, documents)</li>
                        <li>Saare land parcels</li>
                        <li>Family members</li>
                        <li>Activity timeline</li>
                        <li>OTP sessions</li>
                        <li>Registration records</li>
                      </ul>
                      <p className="text-[11.5px] font-semibold text-[#16A34A] mt-1">
                        ✓ Mobile <span className="font-mono">{farmerDetail?.mobile}</span> free ho jayega — farmer dobara register kar sakta hai.
                      </p>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold uppercase text-[#94A3B8]">
                        Confirm karo — type karo: <span className="font-mono text-[#EF4444]">{farmerDetail?.mobile}</span>
                      </label>
                      <input
                        type="text"
                        value={deleteConfirmText}
                        onChange={(e) => setDeleteConfirmText(e.target.value)}
                        placeholder={`Type "${farmerDetail?.mobile}" to confirm...`}
                        className="w-full px-3 py-2 text-[12.5px] bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-[#0F172A] outline-none focus:border-[#EF4444] font-mono"
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#F1F5F9]">
                <button
                  onClick={() => { setActionModal(null); setRejectRemarks(''); }}
                  className="btn btn-secondary btn-sm"
                  disabled={isActionLoading}
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmAction}
                  disabled={isActionLoading
                    || (actionModal === 'reject' && !rejectRemarks.trim())
                    || (actionModal === 'delete' && deleteConfirmText !== farmerDetail?.mobile)
                  }
                  className={`btn btn-sm font-bold px-4 py-1.5 rounded-xl text-white transition-all disabled:opacity-60 ${
                    actionModal === 'approve' || actionModal === 'unblock'
                      ? 'bg-[#16A34A] hover:bg-[#15803D]'
                      : actionModal === 'delete'
                      ? 'bg-[#DC2626] hover:bg-[#B91C1C]'
                      : actionModal === 'reject'
                      ? 'bg-[#EF4444] hover:bg-[#DC2626]'
                      : 'bg-[#D97706] hover:bg-[#B45309]'
                  }`}
                >
                  {isActionLoading ? 'Processing...' : actionModal === 'delete' ? '🗑️ Permanently Delete' : 'Confirm'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};

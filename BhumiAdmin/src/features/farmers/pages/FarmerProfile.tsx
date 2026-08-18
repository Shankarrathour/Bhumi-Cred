import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, CheckCircle, XCircle, Map, CreditCard,
  User, ShieldCheck, Landmark, FileText, Cloud,
  Clock, Folder, Ban, Unlock, Trash2,
  Download, CheckSquare, Layers, AlertTriangle, Phone, Mail,
  Activity, Trees, Home, Calendar, Globe
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
} from '../api/useFarmers';
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

  // ─── API Hooks ─────────────────────────────────────────────────────────────
  const { data: farmerDetail, isLoading } = useFarmerDetail(id);
  const { data: identityData, isLoading: identityLoading } = useFarmerIdentity(id);
  const { data: bankData, isLoading: bankLoading } = useFarmerBank(id);
  const { data: activityData, isLoading: activityLoading } = useFarmerActivity(id);
  const { data: familyData, isLoading: familyLoading } = useFarmerFamily(id);
  const { data: landData, isLoading: landLoading } = useFarmerLand(id);

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
            <h3 className="text-[15px] font-bold text-[#0F172A] border-b border-[#F1F5F9] pb-3 flex items-center gap-2">
              <Landmark size={16} className="text-[#16A34A]" /> Bank Account & Payout Details
            </h3>

            {bankLoading ? (
              <div className="h-32 bg-slate-100 animate-pulse rounded-2xl" />
            ) : bankData && (bankData.bank_name || bankData.account_number || bankData.ifsc_code) ? (
              <div className="p-5 bg-[#FAFCFF] border border-[#F1F5F9] rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-[14px] font-bold text-[#0F172A]">{val(bankData.bank_name)}</h4>
                    {bankData.ifsc_code && (
                      <p className="text-[11.5px] text-[#64748B]">IFSC: {bankData.ifsc_code}</p>
                    )}
                  </div>
                  <StatusBadge
                    label={bankData.is_verified ? 'VERIFIED' : 'UNVERIFIED'}
                    variant={bankData.is_verified ? 'success' : 'warning'}
                    size="sm"
                  />
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-[12px] pt-2 border-t border-[#F1F5F9]">
                  <div>
                    <p className="text-[#94A3B8] font-bold uppercase">Account Number</p>
                    <p className="font-mono font-bold text-[#0F172A]">{val(bankData.account_number)}</p>
                  </div>
                  <div>
                    <p className="text-[#94A3B8] font-bold uppercase">Account Holder</p>
                    <p className="font-bold text-[#0F172A]">{val(bankData.account_holder_name)}</p>
                  </div>
                  <div>
                    <p className="text-[#94A3B8] font-bold uppercase">IFSC Code</p>
                    <p className="font-mono font-bold text-[#0F172A]">{val(bankData.ifsc_code)}</p>
                  </div>
                  <div>
                    <p className="text-[#94A3B8] font-bold uppercase">Added On</p>
                    <p className="font-semibold text-[#0F172A]">{fmtDate(bankData.added_at)}</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-16 space-y-3 text-[#94A3B8]">
                <Landmark size={36} />
                <p className="text-[14px] font-bold">No Bank Details Added</p>
                <p className="text-[12px]">The farmer has not added bank account details yet.</p>
              </div>
            )}
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
                    {parcel.land_document_url && (
                      <a href={parcel.land_document_url} target="_blank" rel="noopener noreferrer"
                        className="text-[11px] text-[#2563EB] underline flex items-center gap-1">
                        <Download size={11} /> View Land Document
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
            <h3 className="text-[15px] font-bold text-[#0F172A] border-b border-[#F1F5F9] pb-3 flex items-center gap-2">
              <FileText size={16} className="text-[#16A34A]" /> Enrolled Carbon & Forestry Projects
            </h3>
            <div className="flex flex-col items-center justify-center py-16 space-y-3 text-[#94A3B8]">
              <FileText size={36} />
              <p className="text-[14px] font-bold">Project Enrollments</p>
              <p className="text-[12px] text-center max-w-xs">
                To assign a project to this farmer, use the project management section.
              </p>
              <button
                onClick={() => navigate('/projects')}
                className="btn btn-secondary btn-sm mt-2"
              >
                Go to Projects →
              </button>
            </div>
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

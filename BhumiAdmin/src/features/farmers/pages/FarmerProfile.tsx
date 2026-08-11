import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, CheckCircle, XCircle, Map, CreditCard, Leaf,
  User, ShieldCheck, Landmark, FileText, Cloud,
  ShoppingBag, Clock, Folder, Ban, Lock,
  Send, Building2, Eye, Download, CheckSquare, Layers, AlertTriangle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { StatusBadge } from '../../../components/ui/StatusBadge';
import { useFarmerDetail } from '../api/useFarmers';
import { downloadPDFDocument } from '../../../utils/pdfExporter';
import toast from 'react-hot-toast';

export const FarmerProfile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<string>('Overview');
  const [actionModal, setActionModal] = useState<string | null>(null);

  const { data: farmerDetail, isLoading } = useFarmerDetail(id);

  const handleAction = (actionName: string) => {
    setActionModal(null);
    toast.success(`Action "${actionName}" executed successfully!`);
  };

  if (isLoading) {
    return (
      <div className="p-8 space-y-4">
        <div className="h-12 bg-slate-100 animate-pulse rounded-xl" />
        <div className="h-40 bg-slate-100 animate-pulse rounded-2xl" />
        <div className="h-96 bg-slate-100 animate-pulse rounded-2xl" />
      </div>
    );
  }

  // Master Farmer Dataset covering all Screen 2 fields
  const farmer = {
    id: farmerDetail?.farmer_id || id || 'FARM-MP-8091',
    photo_url: (farmerDetail as any)?.photo_url || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200',
    name: farmerDetail?.full_name || `${farmerDetail?.first_name || 'Ramesh'} ${farmerDetail?.last_name || 'Patel'}`,
    first_name: farmerDetail?.first_name || 'Ramesh',
    last_name: farmerDetail?.last_name || 'Patel',
    mobile: farmerDetail?.mobile || '+91 98261 44102',
    email: 'ramesh.patel@bhumicred.com',
    dob: '12 Aug 1978',
    gender: 'Male',
    father_name: 'Harishchandra Patel',
    occupation: 'Organic Farmer & Agro-Forestry Practitioner',
    village: farmerDetail?.village || 'Sehore Khas',
    district: farmerDetail?.district || 'Sehore',
    state: farmerDetail?.state || 'Madhya Pradesh',
    pincode: '466001',
    address: 'House #42, Village Sehore Khas, Tehsil Sehore, District Sehore, MP - 466001',
    kycStatus: farmerDetail?.kyc_status || 'APPROVED',
    isActive: farmerDetail?.is_active ?? true,
    registeredDate: farmerDetail?.created_at ? new Date(farmerDetail.created_at).toLocaleDateString('en-IN') : '14 Jan 2025',
    lastLogin: 'Today, 10:30 AM (IP: 49.36.18.90)',
    totalLand: `${farmerDetail?.total_acreage || 14.5} Acres`,
    walletBalance: `₹${(farmerDetail?.wallet_balance || 48500).toLocaleString()}`,
    carbonCredits: `${farmerDetail?.carbon_credits_generated || 14.2} tCO2e`,
    insurancePoliciesCount: 2,
    activeProjectsCount: 1,
    aadhaar_number: 'XXXX-XXXX-8921',
    pan_number: 'ABCPP1290K',
    verified_by: 'Admin Verifier (Suresh Verma)',
    verified_date: '16 Jan 2025',
    kyc_remarks: 'All documents authentic. Land khasra verified via GIS map.',
    reject_reason: 'None',
  };

  // 12 Specified Tabs
  const TABS = [
    { id: 'Overview',         label: 'Overview',         icon: Layers },
    { id: 'Personal',         label: 'Personal Details', icon: User },
    { id: 'KYC',              label: 'KYC',              icon: CheckSquare },
    { id: 'Bank',             label: 'Bank',             icon: Landmark },
    { id: 'Land',             label: 'Land',             icon: Map },
    { id: 'Projects',         label: 'Projects',         icon: FileText },
    { id: 'Carbon',           label: 'Carbon',           icon: Cloud },
    { id: 'Insurance',        label: 'Insurance',        icon: ShieldCheck },
    { id: 'Wallet',           label: 'Wallet',           icon: CreditCard },
    { id: 'Marketplace',      label: 'Marketplace',      icon: ShoppingBag },
    { id: 'Documents',        label: 'Documents',        icon: Folder },
    { id: 'Timeline',         label: 'Activity Timeline',icon: Clock },
  ];

  return (
    <div className="space-y-6 page-enter pb-10" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>

      {/* ── HEADER & ACTIONS BAR ── */}
      <div className="bg-white border border-[#E8EDF5] rounded-2xl p-5 shadow-xs space-y-4">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/farmers')}
              className="p-2 bg-[#F8FAFC] hover:bg-[#F1F5F9] border border-[#E2E8F0] rounded-xl text-[#64748B] hover:text-[#0F172A] transition-colors cursor-pointer"
              title="Back to Farmer Directory"
            >
              <ArrowLeft size={18} />
            </button>

            <img
              src={farmer.photo_url}
              alt=""
              className="w-12 h-12 rounded-2xl object-cover border-2 border-[#E2E8F0] shadow-xs shrink-0"
            />

            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-2xl font-bold text-[#0F172A]">{farmer.name}</h1>
                <StatusBadge label={farmer.kycStatus} variant={farmer.kycStatus === 'APPROVED' ? 'success' : 'warning'} />
                <StatusBadge label={farmer.isActive ? 'Active Account' : 'Suspended'} variant={farmer.isActive ? 'info' : 'gray'} />
              </div>
              <p className="text-[12px] text-[#64748B] mt-0.5">
                Farmer ID: <span className="font-mono text-[#0F172A] font-semibold">{farmer.id}</span> • Registered: {farmer.registeredDate} • {farmer.village}, {farmer.district}
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-1.5 w-full lg:w-auto">
            <button onClick={() => setActionModal('Approve Farmer')} className="px-3 py-1.5 bg-[#F0FDF4] hover:bg-[#DCFCE7] text-[#16A34A] text-[12px] font-bold rounded-xl border border-[#DCFCE7] flex items-center gap-1 cursor-pointer">
              <CheckCircle size={13} /> Approve
            </button>
            <button onClick={() => setActionModal('Reject Farmer')} className="px-3 py-1.5 bg-[#FEF2F2] hover:bg-[#FEE2E2] text-[#EF4444] text-[12px] font-bold rounded-xl border border-[#FEE2E2] flex items-center gap-1 cursor-pointer">
              <XCircle size={13} /> Reject
            </button>
            <button onClick={() => setActionModal('Suspend Account')} className="px-3 py-1.5 bg-[#FFFBEB] hover:bg-[#FEF3C7] text-[#D97706] text-[12px] font-bold rounded-xl border border-[#FEF3C7] flex items-center gap-1 cursor-pointer">
              <Ban size={13} /> Suspend
            </button>
            <button onClick={() => setActionModal('Assign Carbon Project')} className="px-3 py-1.5 bg-[#F5F3FF] hover:bg-[#DDD6FE] text-[#8B5CF6] text-[12px] font-bold rounded-xl border border-[#DDD6FE] flex items-center gap-1 cursor-pointer">
              <FileText size={13} /> Assign Project
            </button>
          </div>
        </div>

        {/* ── QUICK METRICS STRIP ── */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 pt-3 border-t border-[#F1F5F9]">
          <div className="p-2.5 bg-[#FAFCFF] border border-[#F1F5F9] rounded-xl flex items-center gap-2.5">
            <Map size={16} className="text-[#16A34A] shrink-0" />
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-[#94A3B8]">Total Land</p>
              <p className="text-[13.5px] font-bold text-[#0F172A]">{farmer.totalLand}</p>
            </div>
          </div>

          <div className="p-2.5 bg-[#FAFCFF] border border-[#F1F5F9] rounded-xl flex items-center gap-2.5">
            <Cloud size={16} className="text-[#059669] shrink-0" />
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-[#94A3B8]">Carbon Credits</p>
              <p className="text-[13.5px] font-bold text-[#059669]">{farmer.carbonCredits}</p>
            </div>
          </div>

          <div className="p-2.5 bg-[#FAFCFF] border border-[#F1F5F9] rounded-xl flex items-center gap-2.5">
            <CreditCard size={16} className="text-[#16A34A] shrink-0" />
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-[#94A3B8]">Wallet Balance</p>
              <p className="text-[13.5px] font-bold text-[#16A34A]">{farmer.walletBalance}</p>
            </div>
          </div>

          <div className="p-2.5 bg-[#FAFCFF] border border-[#F1F5F9] rounded-xl flex items-center gap-2.5">
            <ShieldCheck size={16} className="text-[#8B5CF6] shrink-0" />
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-[#94A3B8]">Insurance</p>
              <p className="text-[13.5px] font-bold text-[#0F172A]">{farmer.insurancePoliciesCount} Policies</p>
            </div>
          </div>

          <div className="p-2.5 bg-[#FAFCFF] border border-[#F1F5F9] rounded-xl flex items-center gap-2.5">
            <FileText size={16} className="text-[#2563EB] shrink-0" />
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-[#94A3B8]">Projects</p>
              <p className="text-[13.5px] font-bold text-[#0F172A]">{farmer.activeProjectsCount} Enrolled</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── 12 TABS SCROLLABLE BAR ── */}
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

      {/* ── TAB PANELS CONTENT ── */}
      <div className="bg-white border border-[#E8EDF5] rounded-2xl p-6 shadow-xs min-h-[380px]">

        {/* 1. OVERVIEW TAB */}
        {activeTab === 'Overview' && (
          <div className="space-y-6">
            <h3 className="text-[15px] font-bold text-[#0F172A] border-b border-[#F1F5F9] pb-3 flex items-center gap-2">
              <Layers size={16} className="text-[#16A34A]" /> Executive Overview Summary
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="flex items-center gap-4 p-4 bg-[#FAFCFF] border border-[#F1F5F9] rounded-2xl">
                <img src={farmer.photo_url} alt="" className="w-16 h-16 rounded-2xl object-cover border-2 border-[#E2E8F0]" />
                <div>
                  <h4 className="text-[15px] font-bold text-[#0F172A]">{farmer.name}</h4>
                  <p className="text-[12px] font-mono text-[#64748B]">{farmer.id}</p>
                  <p className="text-[11.5px] text-[#16A34A] font-semibold mt-1">✓ Verified Organic Farmer</p>
                </div>
              </div>

              <div className="space-y-3 p-4 bg-[#FAFCFF] border border-[#F1F5F9] rounded-2xl">
                <div>
                  <p className="text-[10.5px] font-bold uppercase text-[#94A3B8]">Mobile Number</p>
                  <p className="text-[13px] font-mono font-bold text-[#0F172A]">{farmer.mobile}</p>
                </div>
                <div>
                  <p className="text-[10.5px] font-bold uppercase text-[#94A3B8]">Email Address</p>
                  <p className="text-[13px] font-semibold text-[#0F172A]">{farmer.email}</p>
                </div>
              </div>

              <div className="space-y-3 p-4 bg-[#FAFCFF] border border-[#F1F5F9] rounded-2xl">
                <div>
                  <p className="text-[10.5px] font-bold uppercase text-[#94A3B8]">Registration Date</p>
                  <p className="text-[13px] font-semibold text-[#0F172A]">{farmer.registeredDate}</p>
                </div>
                <div>
                  <p className="text-[10.5px] font-bold uppercase text-[#94A3B8]">Last App Activity</p>
                  <p className="text-[12px] font-medium text-[#475569]">{farmer.lastLogin}</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2">
              <div className="p-3.5 border border-[#E8EDF5] rounded-xl text-center">
                <p className="text-[11px] font-bold text-[#94A3B8] uppercase">Total Land Area</p>
                <p className="text-[16px] font-extrabold text-[#0F172A] mt-1">{farmer.totalLand}</p>
              </div>
              <div className="p-3.5 border border-[#E8EDF5] rounded-xl text-center">
                <p className="text-[11px] font-bold text-[#94A3B8] uppercase">Carbon Credits</p>
                <p className="text-[16px] font-extrabold text-[#059669] mt-1">{farmer.carbonCredits}</p>
              </div>
              <div className="p-3.5 border border-[#E8EDF5] rounded-xl text-center">
                <p className="text-[11px] font-bold text-[#94A3B8] uppercase">Wallet Balance</p>
                <p className="text-[16px] font-extrabold text-[#16A34A] mt-1">{farmer.walletBalance}</p>
              </div>
              <div className="p-3.5 border border-[#E8EDF5] rounded-xl text-center">
                <p className="text-[11px] font-bold text-[#94A3B8] uppercase">Tree Policies</p>
                <p className="text-[16px] font-extrabold text-[#8B5CF6] mt-1">{farmer.insurancePoliciesCount} Active</p>
              </div>
            </div>
          </div>
        )}

        {/* 2. PERSONAL DETAILS TAB */}
        {activeTab === 'Personal' && (
          <div className="space-y-6">
            <h3 className="text-[15px] font-bold text-[#0F172A] border-b border-[#F1F5F9] pb-3 flex items-center gap-2">
              <User size={16} className="text-[#16A34A]" /> Personal & Residential Profile
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-1">
                <p className="text-[11px] font-bold uppercase text-[#94A3B8]">Father / Spouse Name</p>
                <p className="text-[13.5px] font-semibold text-[#0F172A]">{farmer.father_name}</p>
              </div>
              <div className="space-y-1">
                <p className="text-[11px] font-bold uppercase text-[#94A3B8]">Date of Birth</p>
                <p className="text-[13.5px] font-semibold text-[#0F172A]">{farmer.dob}</p>
              </div>
              <div className="space-y-1">
                <p className="text-[11px] font-bold uppercase text-[#94A3B8]">Gender</p>
                <p className="text-[13.5px] font-semibold text-[#0F172A]">{farmer.gender}</p>
              </div>
              <div className="space-y-1">
                <p className="text-[11px] font-bold uppercase text-[#94A3B8]">Occupation</p>
                <p className="text-[13.5px] font-semibold text-[#0F172A]">{farmer.occupation}</p>
              </div>
              <div className="space-y-1">
                <p className="text-[11px] font-bold uppercase text-[#94A3B8]">Village</p>
                <p className="text-[13.5px] font-semibold text-[#0F172A]">{farmer.village}</p>
              </div>
              <div className="space-y-1">
                <p className="text-[11px] font-bold uppercase text-[#94A3B8]">District</p>
                <p className="text-[13.5px] font-semibold text-[#0F172A]">{farmer.district}</p>
              </div>
              <div className="space-y-1">
                <p className="text-[11px] font-bold uppercase text-[#94A3B8]">State</p>
                <p className="text-[13.5px] font-semibold text-[#0F172A]">{farmer.state}</p>
              </div>
              <div className="space-y-1">
                <p className="text-[11px] font-bold uppercase text-[#94A3B8]">Pincode</p>
                <p className="text-[13.5px] font-mono font-semibold text-[#0F172A]">{farmer.pincode}</p>
              </div>
              <div className="space-y-1 md:col-span-3">
                <p className="text-[11px] font-bold uppercase text-[#94A3B8]">Full Residential Address</p>
                <p className="text-[13.5px] font-semibold text-[#0F172A]">{farmer.address}</p>
              </div>
            </div>
          </div>
        )}

        {/* 3. KYC TAB */}
        {activeTab === 'KYC' && (
          <div className="space-y-6">
            <h3 className="text-[15px] font-bold text-[#0F172A] border-b border-[#F1F5F9] pb-3 flex items-center gap-2">
              <CheckSquare size={16} className="text-[#16A34A]" /> Government Identity Verification (KYC)
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-[#FAFCFF] border border-[#F1F5F9] rounded-2xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[13px] font-bold text-[#0F172A]">Aadhaar Card Number</span>
                  <StatusBadge label="VERIFIED" variant="success" size="sm" />
                </div>
                <p className="text-[14px] font-mono font-bold text-[#0F172A]">{farmer.aadhaar_number}</p>
                <p className="text-[11px] text-[#16A34A]">✓ UIDAI Biometric & OTP Verified</p>
              </div>

              <div className="p-4 bg-[#FAFCFF] border border-[#F1F5F9] rounded-2xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[13px] font-bold text-[#0F172A]">PAN Card Number</span>
                  <StatusBadge label="VERIFIED" variant="success" size="sm" />
                </div>
                <p className="text-[14px] font-mono font-bold text-[#0F172A]">{farmer.pan_number}</p>
                <p className="text-[11px] text-[#16A34A]">✓ NSDL Name Match: 98.4% Confidence</p>
              </div>
            </div>

            <div className="p-4 border border-[#E8EDF5] rounded-2xl space-y-3">
              <h4 className="text-[13.5px] font-bold text-[#0F172A]">KYC Verification Audit Details</h4>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-[12px]">
                <div>
                  <p className="text-[#94A3B8] font-bold">VERIFICATION STATUS</p>
                  <p className="font-bold text-[#16A34A] mt-0.5">{farmer.kycStatus}</p>
                </div>
                <div>
                  <p className="text-[#94A3B8] font-bold">VERIFIED BY</p>
                  <p className="font-semibold text-[#0F172A] mt-0.5">{farmer.verified_by}</p>
                </div>
                <div>
                  <p className="text-[#94A3B8] font-bold">VERIFICATION DATE</p>
                  <p className="font-semibold text-[#0F172A] mt-0.5">{farmer.verified_date}</p>
                </div>
                <div>
                  <p className="text-[#94A3B8] font-bold">REJECT REASON</p>
                  <p className="font-semibold text-[#64748B] mt-0.5">{farmer.reject_reason}</p>
                </div>
              </div>

              <div className="pt-2">
                <p className="text-[11px] font-bold uppercase text-[#94A3B8]">Audit Remarks</p>
                <p className="text-[12.5px] text-[#475569] bg-[#F8FAFC] p-3 rounded-xl border border-[#E2E8F0] mt-1">{farmer.kyc_remarks}</p>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button onClick={() => handleAction('Approve KYC')} className="btn btn-primary btn-sm">Approve KYC</button>
                <button onClick={() => handleAction('Reject KYC')} className="btn btn-secondary btn-sm text-[#EF4444]">Reject KYC</button>
              </div>
            </div>
          </div>
        )}

        {/* 4. BANK TAB */}
        {activeTab === 'Bank' && (
          <div className="space-y-6">
            <h3 className="text-[15px] font-bold text-[#0F172A] border-b border-[#F1F5F9] pb-3 flex items-center gap-2">
              <Landmark size={16} className="text-[#16A34A]" /> Bank Account & Payout Details
            </h3>
            <div className="p-5 bg-[#FAFCFF] border border-[#F1F5F9] rounded-2xl space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-[14px] font-bold text-[#0F172A]">State Bank of India (SBI)</h4>
                  <p className="text-[11.5px] text-[#64748B]">Branch: Sehore Main Branch • IFSC: SBIN0001240</p>
                </div>
                <StatusBadge label="IMPS ACTIVE" variant="success" size="sm" />
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-[12px] pt-2 border-t border-[#F1F5F9]">
                <div>
                  <p className="text-[#94A3B8] font-bold">ACCOUNT NUMBER</p>
                  <p className="font-mono font-bold text-[#0F172A]">XXXX-XXXX-4091</p>
                </div>
                <div>
                  <p className="text-[#94A3B8] font-bold">ACCOUNT TYPE</p>
                  <p className="font-bold text-[#0F172A]">Savings (KCC)</p>
                </div>
                <div>
                  <p className="text-[#94A3B8] font-bold">UPI ID</p>
                  <p className="font-mono font-bold text-[#0F172A]">9826144102@sbi</p>
                </div>
                <div>
                  <p className="text-[#94A3B8] font-bold">PFMS VERIFICATION</p>
                  <p className="font-bold text-[#16A34A]">✓ Verified (Code #901)</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 5. LAND TAB */}
        {activeTab === 'Land' && (
          <div className="space-y-6">
            <h3 className="text-[15px] font-bold text-[#0F172A] border-b border-[#F1F5F9] pb-3 flex items-center gap-2">
              <Map size={16} className="text-[#16A34A]" /> Land Parcels List & GIS Boundaries
            </h3>
            <div className="space-y-4">
              <div className="p-4 border border-[#E8EDF5] rounded-2xl bg-[#FAFCFF] space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-[14px] font-bold text-[#0F172A]">Parcel #1 — Khasra No. 412/1</h4>
                    <p className="text-[11.5px] text-[#64748B]">Area: 8.5 Acres • Survey Number: #412/1 • Village Sehore Khas</p>
                  </div>
                  <StatusBadge label="VERIFIED GIS" variant="success" size="sm" />
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-[11.5px] bg-white p-3 rounded-xl border border-[#E2E8F0]">
                  <div><span className="text-[#94A3B8]">Polygon Coordinates:</span> <p className="font-mono font-semibold">23.2014° N, 77.0812° E</p></div>
                  <div><span className="text-[#94A3B8]">Land Photos:</span> <p className="font-semibold text-[#16A34A]">3 Geotagged Photos</p></div>
                  <div><span className="text-[#94A3B8]">Assigned Project:</span> <p className="font-semibold text-[#2563EB]">MP Afforestation Q1</p></div>
                  <div><span className="text-[#94A3B8]">Insurance Policy:</span> <p className="font-semibold text-[#8B5CF6]">Tree Policy #TS-9021</p></div>
                </div>
              </div>

              <div className="p-4 border border-[#E8EDF5] rounded-2xl bg-[#FAFCFF] space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-[14px] font-bold text-[#0F172A]">Parcel #2 — Khasra No. 415/B</h4>
                    <p className="text-[11.5px] text-[#64748B]">Area: 6.0 Acres • Survey Number: #415/B • Tehsil Sehore</p>
                  </div>
                  <StatusBadge label="VERIFIED GIS" variant="success" size="sm" />
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-[11.5px] bg-white p-3 rounded-xl border border-[#E2E8F0]">
                  <div><span className="text-[#94A3B8]">Polygon Coordinates:</span> <p className="font-mono font-semibold">23.2089° N, 77.0890° E</p></div>
                  <div><span className="text-[#94A3B8]">Land Photos:</span> <p className="font-semibold text-[#16A34A]">2 Geotagged Photos</p></div>
                  <div><span className="text-[#94A3B8]">Assigned Project:</span> <p className="font-semibold text-[#2563EB]">MP Afforestation Q1</p></div>
                  <div><span className="text-[#94A3B8]">Insurance Policy:</span> <p className="font-semibold text-[#8B5CF6]">Tree Policy #TS-9021</p></div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 6. PROJECTS TAB */}
        {activeTab === 'Projects' && (
          <div className="space-y-6">
            <h3 className="text-[15px] font-bold text-[#0F172A] border-b border-[#F1F5F9] pb-3 flex items-center gap-2">
              <FileText size={16} className="text-[#16A34A]" /> Enrolled Carbon & Forestry Projects
            </h3>
            <div className="p-4 border border-[#E8EDF5] rounded-2xl bg-[#FAFCFF] space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-[14px] font-bold text-[#0F172A]">MP Green Afforestation Drive Q1</h4>
                  <p className="text-[11.5px] text-[#64748B]">Partner: GreenAgri Ltd • Carbon Yield: 14.2 tCO2e</p>
                </div>
                <StatusBadge label="ACTIVE" variant="success" size="sm" />
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-[11.5px] bg-white p-3 rounded-xl border border-[#E2E8F0]">
                <div><span className="text-[#94A3B8]">Timeline:</span> <p className="font-semibold">Jan 2025 – Dec 2029</p></div>
                <div><span className="text-[#94A3B8]">MRV Audit Status:</span> <p className="font-semibold text-[#16A34A]">Passed (Drone Audited)</p></div>
                <div><span className="text-[#94A3B8]">Planted Species:</span> <p className="font-semibold">1,250 Teak & Mango</p></div>
                <div><span className="text-[#94A3B8]">Annual Credits:</span> <p className="font-semibold text-[#059669]">~3.2 tCO2e/yr</p></div>
              </div>
            </div>
          </div>
        )}

        {/* 7. CARBON TAB */}
        {activeTab === 'Carbon' && (
          <div className="space-y-6">
            <h3 className="text-[15px] font-bold text-[#0F172A] border-b border-[#F1F5F9] pb-3 flex items-center gap-2">
              <Cloud size={16} className="text-[#16A34A]" /> Carbon Credits Registry
            </h3>
            <div className="p-4 border border-[#DCFCE7] bg-[#F0FDF4] rounded-2xl space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="text-[14px] font-bold text-[#16A34A]">14.2 tCO2e Verified Carbon Credits</h4>
                <StatusBadge label="VERRA REGISTERED" variant="success" size="sm" />
              </div>
              <p className="text-[12px] text-[#0F172A] font-mono">Serial: BHUMI-CC-2025-MP-8091-001</p>
              <p className="text-[11.5px] text-[#64748B]">Issued on 20 Jan 2025 • Market Value: ₹17,040</p>
            </div>
          </div>
        )}

        {/* 8. INSURANCE TAB */}
        {activeTab === 'Insurance' && (
          <div className="space-y-6">
            <h3 className="text-[15px] font-bold text-[#0F172A] border-b border-[#F1F5F9] pb-3 flex items-center gap-2">
              <ShieldCheck size={16} className="text-[#16A34A]" /> Tree Insurance Policies & Claims
            </h3>
            <div className="p-4 border border-[#E8EDF5] rounded-2xl bg-[#FAFCFF] space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="text-[14px] font-bold text-[#0F172A]">Tree Shield Policy #TS-9021</h4>
                <StatusBadge label="ACTIVE POLICY" variant="info" size="sm" />
              </div>
              <p className="text-[12px] text-[#64748B]">Insured Trees: 1,250 Saplings • Premium Paid: ₹2,400 • Sum Insured: ₹2,50,000</p>
              <p className="text-[11px] text-[#16A34A] font-semibold">✓ Claim Status: 0 Active Claims (1 Settle History)</p>
            </div>
          </div>
        )}

        {/* 9. WALLET TAB */}
        {activeTab === 'Wallet' && (
          <div className="space-y-6">
            <h3 className="text-[15px] font-bold text-[#0F172A] border-b border-[#F1F5F9] pb-3 flex items-center gap-2">
              <CreditCard size={16} className="text-[#16A34A]" /> Wallet Balance & Transaction History
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="p-3.5 bg-[#F0FDF4] border border-[#DCFCE7] rounded-xl">
                <p className="text-[10.5px] font-bold uppercase text-[#16A34A]">Current Balance</p>
                <p className="text-[18px] font-extrabold text-[#16A34A]">{farmer.walletBalance}</p>
              </div>
              <div className="p-3.5 bg-[#FAFCFF] border border-[#F1F5F9] rounded-xl">
                <p className="text-[10.5px] font-bold uppercase text-[#94A3B8]">Carbon Income</p>
                <p className="text-[16px] font-bold text-[#0F172A]">₹17,040</p>
              </div>
              <div className="p-3.5 bg-[#FAFCFF] border border-[#F1F5F9] rounded-xl">
                <p className="text-[10.5px] font-bold uppercase text-[#94A3B8]">Insurance Claim</p>
                <p className="text-[16px] font-bold text-[#0F172A]">₹12,500</p>
              </div>
              <div className="p-3.5 bg-[#FAFCFF] border border-[#F1F5F9] rounded-xl">
                <p className="text-[10.5px] font-bold uppercase text-[#94A3B8]">Withdrawals</p>
                <p className="text-[16px] font-bold text-[#EF4444]">₹25,000</p>
              </div>
            </div>
          </div>
        )}

        {/* 10. MARKETPLACE TAB */}
        {activeTab === 'Marketplace' && (
          <div className="space-y-6">
            <h3 className="text-[15px] font-bold text-[#0F172A] border-b border-[#F1F5F9] pb-3 flex items-center gap-2">
              <ShoppingBag size={16} className="text-[#16A34A]" /> Marketplace Orders
            </h3>
            <div className="p-4 border border-[#E8EDF5] rounded-xl flex items-center justify-between">
              <div>
                <h4 className="text-[13px] font-bold text-[#0F172A]">Order #ORD-8821 — Bio-Fertilizer Kit</h4>
                <p className="text-[11.5px] text-[#64748B]">Date: 18 Jan 2025 • Amount: ₹1,850 • Refund Status: No Refund Requested</p>
              </div>
              <StatusBadge label="DELIVERED" variant="success" size="sm" />
            </div>
          </div>
        )}

        {/* 11. DOCUMENTS TAB */}
        {activeTab === 'Documents' && (
          <div className="space-y-6">
            <h3 className="text-[15px] font-bold text-[#0F172A] border-b border-[#F1F5F9] pb-3 flex items-center gap-2">
              <Folder size={16} className="text-[#16A34A]" /> Verification Documents (Aadhaar, PAN, Khata, Land Record, Photos)
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                { name: 'Aadhaar Card (Front & Back)', file: 'Aadhaar_Doc.pdf' },
                { name: 'PAN Card Copy', file: 'PAN_Doc.pdf' },
                { name: 'Khata Extract & Khasra', file: 'Khata_Land_Record.pdf' },
                { name: 'Land Geotagged Photos', file: 'Land_Photos.zip' },
              ].map((doc, idx) => (
                <div key={idx} className="p-4 border border-[#E8EDF5] rounded-2xl bg-[#FAFCFF] flex items-center justify-between">
                  <div>
                    <h4 className="text-[13px] font-bold text-[#0F172A]">{doc.name}</h4>
                    <p className="text-[11px] font-mono text-[#64748B]">{doc.file}</p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => {
                        downloadPDFDocument({
                          title: `VERIFICATION DOCUMENT — ${doc.name.toUpperCase()}`,
                          subtitle: `Farmer Name: ${farmer.name} (${farmer.farmer_id})`,
                          filename: doc.file,
                          metadata: {
                            'Farmer Name': farmer.name,
                            'Farmer ID': farmer.farmer_id,
                            'Document Category': doc.name,
                            'Filename': doc.file,
                            'Aadhaar Reference': farmer.aadhaar_number,
                            'PAN Reference': farmer.pan_number,
                            'Village & State': `${farmer.village}, ${farmer.state}`,
                            'KYC Status': farmer.kycStatus,
                          },
                        });
                        toast.success(`Generated official ${doc.file}!`);
                      }}
                      className="p-1.5 bg-[#F0FDF4] hover:bg-[#DCFCE7] text-[#16A34A] rounded-lg cursor-pointer"
                      title="Download"
                    >
                      <Download size={14} />
                    </button>
                    <button onClick={() => toast.success(`${doc.name} Approved`)} className="p-1.5 bg-[#EFF6FF] hover:bg-[#DBEAFE] text-[#2563EB] rounded-lg cursor-pointer" title="Approve Document">
                      <CheckCircle size={14} />
                    </button>
                    <button onClick={() => toast.success(`${doc.name} Rejected`)} className="p-1.5 bg-[#FEF2F2] hover:bg-[#FEE2E2] text-[#EF4444] rounded-lg cursor-pointer" title="Reject Document">
                      <XCircle size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 12. ACTIVITY TIMELINE TAB */}
        {activeTab === 'Timeline' && (
          <div className="space-y-6">
            <h3 className="text-[15px] font-bold text-[#0F172A] border-b border-[#F1F5F9] pb-3 flex items-center gap-2">
              <Clock size={16} className="text-[#16A34A]" /> Complete Life Cycle Timeline
            </h3>
            
            <div className="relative pl-6 border-l-2 border-[#E2E8F0] space-y-6">
              {[
                { time: '14 Jan 2025', title: 'Registered', desc: 'Farmer registered via mobile OTP app' },
                { time: '15 Jan 2025', title: 'KYC Uploaded', desc: 'Aadhaar & PAN document images uploaded' },
                { time: '15 Jan 2025', title: 'Land Added', desc: 'Khasra #412/1 & 415/B mapped via GIS coordinates' },
                { time: '16 Jan 2025', title: 'Approved', desc: 'Admin approved KYC & Land verifications' },
                { time: '18 Jan 2025', title: 'Project Assigned', desc: 'Enrolled into MP Green Afforestation Drive Q1' },
                { time: '20 Jan 2025', title: 'Carbon Generated', desc: '14.2 tCO2e Carbon credits verified by Verra' },
                { time: '25 Jan 2025', title: 'Withdrawal', desc: '₹25,000 payout processed directly to SBI Bank account' },
              ].map((item, idx) => (
                <div key={idx} className="relative">
                  <span className="absolute -left-[31px] top-0 w-4 h-4 rounded-full bg-[#16A34A] border-2 border-white" />
                  <p className="text-[11px] font-bold text-[#94A3B8]">{item.time}</p>
                  <p className="text-[13.5px] font-bold text-[#0F172A]">{item.title}</p>
                  <p className="text-[11.5px] text-[#64748B]">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>

      {/* ── ACTION DIALOG MODAL ── */}
      <AnimatePresence>
        {actionModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-2xl border border-[#E8EDF5] space-y-4"
            >
              <h3 className="text-[15px] font-bold text-[#0F172A]">Confirm {actionModal}</h3>
              <p className="text-[12px] text-[#64748B]">
                Are you sure you want to perform <strong>{actionModal}</strong> for {farmer.name} ({farmer.id})?
              </p>
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#F1F5F9]">
                <button onClick={() => setActionModal(null)} className="btn btn-secondary btn-sm">Cancel</button>
                <button onClick={() => handleAction(actionModal)} className="btn btn-primary btn-sm">Confirm Action</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};

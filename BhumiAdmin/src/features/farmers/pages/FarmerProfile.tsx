import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, CheckCircle, XCircle, Map, CreditCard, Leaf,
  User, Users, ShieldCheck, Landmark, FileText, Cloud,
  ShoppingBag, LifeBuoy, Clock, Folder, Ban, Lock,
  Send, Building2, Eye, CheckSquare
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { StatusBadge } from '../../../components/ui/StatusBadge';
import { useFarmerDetail } from '../api/useFarmers';
import toast from 'react-hot-toast';

export const FarmerProfile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<string>('Personal');
  const [actionModal, setActionModal] = useState<string | null>(null);

  const { data: farmerDetail, isLoading } = useFarmerDetail(id);

  const handleAction = (actionName: string) => {
    setActionModal(null);
    toast.success(`Action "${actionName}" executed successfully for farmer!`);
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

  // Master Farmer Object with complete fields
  const farmer = {
    id: farmerDetail?.farmer_id || id || 'FARM-MP-8091',
    name: farmerDetail?.full_name || `${farmerDetail?.first_name || 'Ramesh'} ${farmerDetail?.last_name || 'Patel'}`,
    first_name: farmerDetail?.first_name || 'Ramesh',
    last_name: farmerDetail?.last_name || 'Patel',
    mobile: farmerDetail?.mobile || '+91 98261 44102',
    alt_mobile: '+91 94250 11290',
    email: 'ramesh.patel@bhumicred.com',
    dob: '12 Aug 1978 (Age 47)',
    gender: 'Male',
    father_name: 'Harishchandra Patel',
    village: farmerDetail?.village || 'Sehore Khas',
    district: farmerDetail?.district || 'Sehore',
    state: farmerDetail?.state || 'Madhya Pradesh',
    pincode: '466001',
    address: 'House #42, Village Sehore Khas, Tehsil Sehore, MP - 466001',
    kycStatus: farmerDetail?.kyc_status || 'APPROVED',
    isActive: farmerDetail?.is_active ?? true,
    registeredDate: farmerDetail?.created_at ? new Date(farmerDetail.created_at).toLocaleDateString('en-IN') : '14 Jan 2025',
    totalLand: `${farmerDetail?.total_acreage || 14.5} Acres`,
    walletBalance: `₹${(farmerDetail?.wallet_balance || 48500).toLocaleString()}`,
    totalTrees: farmerDetail?.total_trees || 1250,
    carbonCredits: `${farmerDetail?.carbon_credits_generated || 14.2} tCO2e`,
  };

  // 13 BRD TABS LIST
  const TABS = [
    { id: 'Personal',          label: 'Personal Details', icon: User },
    { id: 'Family',            label: 'Family & Nominee', icon: Users },
    { id: 'KYC',               label: 'KYC Verification', icon: CheckSquare },
    { id: 'Bank',              label: 'Bank Account',     icon: Landmark },
    { id: 'Land',              label: 'Land Parcels',     icon: Map },
    { id: 'Projects',          label: 'Projects',         icon: FileText },
    { id: 'Wallet',            label: 'Wallet & Payouts', icon: CreditCard },
    { id: 'Carbon',            label: 'Carbon Credits',   icon: Cloud },
    { id: 'Insurance',         label: 'Tree Insurance',   icon: ShieldCheck },
    { id: 'Marketplace',       label: 'Marketplace',      icon: ShoppingBag },
    { id: 'Support',           label: 'Support Tickets',  icon: LifeBuoy },
    { id: 'Timeline',          label: 'Activity Log',     icon: Clock },
    { id: 'Documents',         label: 'Documents',        icon: Folder },
  ];

  return (
    <div className="space-y-6 page-enter pb-10">

      {/* ── HEADER & 8 ACTIONS BAR ── */}
      <div className="bg-white border border-[#E8EDF5] rounded-2xl p-5 shadow-xs space-y-4">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/farmers')}
              className="p-2 bg-[#F8FAFC] hover:bg-[#F1F5F9] border border-[#E2E8F0] rounded-xl text-[#64748B] hover:text-[#0F172A] transition-colors cursor-pointer"
              title="Back to Farmers Directory"
            >
              <ArrowLeft size={18} />
            </button>
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-2xl font-bold text-[#0F172A]">{farmer.name}</h1>
                <StatusBadge label={farmer.kycStatus} variant={farmer.kycStatus === 'APPROVED' ? 'success' : 'warning'} />
                <StatusBadge label={farmer.isActive ? 'Active Account' : 'Inactive'} variant={farmer.isActive ? 'info' : 'gray'} />
              </div>
              <p className="text-[12px] text-[#64748B] mt-0.5">
                Farmer ID: <span className="font-mono text-[#0F172A] font-semibold">{farmer.id}</span> • Registered: {farmer.registeredDate} • Village: {farmer.village}, {farmer.district}
              </p>
            </div>
          </div>

          {/* 8 Administrative Action Buttons */}
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
            <button onClick={() => setActionModal('Deactivate Account')} className="px-3 py-1.5 bg-[#F8FAFC] hover:bg-[#F1F5F9] text-[#64748B] text-[12px] font-bold rounded-xl border border-[#E2E8F0] flex items-center gap-1 cursor-pointer">
              <User size={13} /> Deactivate
            </button>
            <button onClick={() => setActionModal('Reset Login PIN')} className="px-3 py-1.5 bg-[#EFF6FF] hover:bg-[#DBEAFE] text-[#2563EB] text-[12px] font-bold rounded-xl border border-[#DBEAFE] flex items-center gap-1 cursor-pointer">
              <Lock size={13} /> Reset Login
            </button>
            <button onClick={() => setActionModal('Assign Carbon Project')} className="px-3 py-1.5 bg-[#F5F3FF] hover:bg-[#DDD6FE] text-[#8B5CF6] text-[12px] font-bold rounded-xl border border-[#DDD6FE] flex items-center gap-1 cursor-pointer">
              <FileText size={13} /> Assign Project
            </button>
            <button onClick={() => setActionModal('Assign Partner Franchise')} className="px-3 py-1.5 bg-[#ECFDF5] hover:bg-[#A7F3D0] text-[#059669] text-[12px] font-bold rounded-xl border border-[#A7F3D0] flex items-center gap-1 cursor-pointer">
              <Building2 size={13} /> Assign Partner
            </button>
            <button onClick={() => setActionModal('Send App Notification')} className="px-3 py-1.5 bg-[#FFF7ED] hover:bg-[#FFEDD5] text-[#EA580C] text-[12px] font-bold rounded-xl border border-[#FFEDD5] flex items-center gap-1 cursor-pointer">
              <Send size={13} /> Notify
            </button>
          </div>
        </div>

        {/* ── PROFILE QUICK METRICS STRIP ── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-3 border-t border-[#F1F5F9]">
          <div className="p-3 bg-[#FAFCFF] border border-[#F1F5F9] rounded-xl flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#F0FDF4] text-[#16A34A] flex items-center justify-center font-bold">
              <Map size={18} />
            </div>
            <div>
              <p className="text-[10.5px] font-bold uppercase tracking-wider text-[#94A3B8]">Total Land</p>
              <p className="text-[15px] font-bold text-[#0F172A]">{farmer.totalLand}</p>
            </div>
          </div>

          <div className="p-3 bg-[#FAFCFF] border border-[#F1F5F9] rounded-xl flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#EFF6FF] text-[#2563EB] flex items-center justify-center font-bold">
              <Leaf size={18} />
            </div>
            <div>
              <p className="text-[10.5px] font-bold uppercase tracking-wider text-[#94A3B8]">Planted Trees</p>
              <p className="text-[15px] font-bold text-[#0F172A]">{farmer.totalTrees} Trees</p>
            </div>
          </div>

          <div className="p-3 bg-[#FAFCFF] border border-[#F1F5F9] rounded-xl flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#ECFDF5] text-[#059669] flex items-center justify-center font-bold">
              <Cloud size={18} />
            </div>
            <div>
              <p className="text-[10.5px] font-bold uppercase tracking-wider text-[#94A3B8]">Carbon Credits</p>
              <p className="text-[15px] font-bold text-[#059669]">{farmer.carbonCredits}</p>
            </div>
          </div>

          <div className="p-3 bg-[#FAFCFF] border border-[#F1F5F9] rounded-xl flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#FEF2F2] text-[#EF4444] flex items-center justify-center font-bold">
              <CreditCard size={18} />
            </div>
            <div>
              <p className="text-[10.5px] font-bold uppercase tracking-wider text-[#94A3B8]">Wallet Balance</p>
              <p className="text-[15px] font-bold text-[#16A34A]">{farmer.walletBalance}</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── 13 BRD TABS SCROLLABLE BAR ── */}
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
      <div className="bg-white border border-[#E8EDF5] rounded-2xl p-6 shadow-xs min-h-[360px]">

        {/* TAB 1: PERSONAL DETAILS */}
        {activeTab === 'Personal' && (
          <div className="space-y-6">
            <h3 className="text-[15px] font-bold text-[#0F172A] border-b border-[#F1F5F9] pb-3 flex items-center gap-2">
              <User size={16} className="text-[#16A34A]" /> Personal & Contact Details
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-1">
                <p className="text-[11px] font-bold uppercase text-[#94A3B8]">Full Name</p>
                <p className="text-[13.5px] font-semibold text-[#0F172A]">{farmer.name}</p>
              </div>
              <div className="space-y-1">
                <p className="text-[11px] font-bold uppercase text-[#94A3B8]">Primary Mobile</p>
                <p className="text-[13.5px] font-mono text-[#0F172A]">{farmer.mobile}</p>
              </div>
              <div className="space-y-1">
                <p className="text-[11px] font-bold uppercase text-[#94A3B8]">Alternate Contact</p>
                <p className="text-[13.5px] font-mono text-[#0F172A]">{farmer.alt_mobile}</p>
              </div>
              <div className="space-y-1">
                <p className="text-[11px] font-bold uppercase text-[#94A3B8]">Date of Birth & Age</p>
                <p className="text-[13.5px] font-semibold text-[#0F172A]">{farmer.dob}</p>
              </div>
              <div className="space-y-1">
                <p className="text-[11px] font-bold uppercase text-[#94A3B8]">Father / Spouse Name</p>
                <p className="text-[13.5px] font-semibold text-[#0F172A]">{farmer.father_name}</p>
              </div>
              <div className="space-y-1">
                <p className="text-[11px] font-bold uppercase text-[#94A3B8]">Gender</p>
                <p className="text-[13.5px] font-semibold text-[#0F172A]">{farmer.gender}</p>
              </div>
              <div className="space-y-1 md:col-span-2">
                <p className="text-[11px] font-bold uppercase text-[#94A3B8]">Residential Address</p>
                <p className="text-[13.5px] font-semibold text-[#0F172A]">{farmer.address}</p>
              </div>
              <div className="space-y-1">
                <p className="text-[11px] font-bold uppercase text-[#94A3B8]">Village / Tehsil</p>
                <p className="text-[13.5px] font-semibold text-[#0F172A]">{farmer.village}, {farmer.district}</p>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: FAMILY & NOMINEE */}
        {activeTab === 'Family' && (
          <div className="space-y-6">
            <h3 className="text-[15px] font-bold text-[#0F172A] border-b border-[#F1F5F9] pb-3 flex items-center gap-2">
              <Users size={16} className="text-[#16A34A]" /> Family Members & Nominee Information
            </h3>
            <div className="p-4 bg-[#FAFCFF] border border-[#F1F5F9] rounded-2xl space-y-4">
              <div className="flex items-center justify-between border-b border-[#F1F5F9] pb-3">
                <div>
                  <p className="text-[13px] font-bold text-[#0F172A]">Primary Nominee: Sunita Patel (Wife)</p>
                  <p className="text-[11.5px] text-[#64748B]">Share: 100% • Aadhaar: XXXX-XXXX-4412 • Mobile: +91 98261 99012</p>
                </div>
                <span className="text-[11px] font-bold text-[#16A34A] bg-[#F0FDF4] px-2 py-0.5 rounded-full border border-[#DCFCE7]">Verified Nominee</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-[12.5px]">
                <div className="p-3 bg-white border border-[#E8EDF5] rounded-xl">
                  <p className="font-bold text-[#0F172A]">Son: Akash Patel (Age 22)</p>
                  <p className="text-[#64748B] text-[11px] mt-0.5">Joint Land Shareholder • Survey #421/B</p>
                </div>
                <div className="p-3 bg-white border border-[#E8EDF5] rounded-xl">
                  <p className="font-bold text-[#0F172A]">Daughter: Priya Patel (Age 19)</p>
                  <p className="text-[#64748B] text-[11px] mt-0.5">Dependent • Student</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: KYC VERIFICATION */}
        {activeTab === 'KYC' && (
          <div className="space-y-6">
            <h3 className="text-[15px] font-bold text-[#0F172A] border-b border-[#F1F5F9] pb-3 flex items-center gap-2">
              <CheckSquare size={16} className="text-[#16A34A]" /> Government Identity Verification (KYC)
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-[#FAFCFF] border border-[#F1F5F9] rounded-2xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[13px] font-bold text-[#0F172A]">Aadhaar Card Verification</span>
                  <StatusBadge label="VERIFIED" variant="success" size="sm" />
                </div>
                <p className="text-[12px] font-mono text-[#64748B]">Aadhaar #: XXXX-XXXX-8921</p>
                <p className="text-[11px] text-[#16A34A]">✓ UIDAI Biometric & OTP Verified</p>
              </div>
              <div className="p-4 bg-[#FAFCFF] border border-[#F1F5F9] rounded-2xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[13px] font-bold text-[#0F172A]">PAN Card Verification</span>
                  <StatusBadge label="VERIFIED" variant="success" size="sm" />
                </div>
                <p className="text-[12px] font-mono text-[#64748B]">PAN #: ABCPP1290K</p>
                <p className="text-[11px] text-[#16A34A]">✓ NSDL Name Match: 98.4% Confidence</p>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: BANK ACCOUNT */}
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

        {/* TAB 5: LAND PARCELS */}
        {activeTab === 'Land' && (
          <div className="space-y-6">
            <h3 className="text-[15px] font-bold text-[#0F172A] border-b border-[#F1F5F9] pb-3 flex items-center gap-2">
              <Map size={16} className="text-[#16A34A]" /> Registered Land Parcels (14.5 Acres)
            </h3>
            <div className="space-y-3">
              <div className="p-4 border border-[#E8EDF5] rounded-xl flex items-center justify-between hover:bg-[#FAFCFF]">
                <div>
                  <p className="text-[13px] font-bold text-[#0F172A]">Parcel #1 — Khasra No. 412/1 (8.5 Acres)</p>
                  <p className="text-[11.5px] text-[#64748B]">Village Sehore Khas • Soil: Black Cotton • GIS Boundaries Verified</p>
                </div>
                <button onClick={() => navigate('/land')} className="btn btn-secondary btn-sm">View GIS Polygon</button>
              </div>
              <div className="p-4 border border-[#E8EDF5] rounded-xl flex items-center justify-between hover:bg-[#FAFCFF]">
                <div>
                  <p className="text-[13px] font-bold text-[#0F172A]">Parcel #2 — Khasra No. 415/B (6.0 Acres)</p>
                  <p className="text-[11.5px] text-[#64748B]">Tehsil Sehore • Drip Irrigated • Afforestation Enrolled</p>
                </div>
                <button onClick={() => navigate('/land')} className="btn btn-secondary btn-sm">View GIS Polygon</button>
              </div>
            </div>
          </div>
        )}

        {/* TAB 6: PROJECTS */}
        {activeTab === 'Projects' && (
          <div className="space-y-6">
            <h3 className="text-[15px] font-bold text-[#0F172A] border-b border-[#F1F5F9] pb-3 flex items-center gap-2">
              <FileText size={16} className="text-[#16A34A]" /> Enrolled Afforestation & Carbon Projects
            </h3>
            <div className="p-4 border border-[#E8EDF5] rounded-2xl bg-[#FAFCFF] flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold text-[#2563EB] bg-[#EFF6FF] px-2 py-0.5 rounded-md border border-[#DBEAFE]">ACTIVE PROJECT</span>
                <h4 className="text-[14px] font-bold text-[#0F172A] mt-1.5">MP Green Afforestation Drive Q1</h4>
                <p className="text-[11.5px] text-[#64748B]">Planted: 1,250 Teak & Mango Saplings • MRV Audit Status: Passed</p>
              </div>
              <button onClick={() => navigate('/projects')} className="btn btn-secondary btn-sm">Project Details</button>
            </div>
          </div>
        )}

        {/* TAB 7: WALLET */}
        {activeTab === 'Wallet' && (
          <div className="space-y-6">
            <h3 className="text-[15px] font-bold text-[#0F172A] border-b border-[#F1F5F9] pb-3 flex items-center gap-2">
              <CreditCard size={16} className="text-[#16A34A]" /> Wallet Balance & Payout History
            </h3>
            <div className="p-4 bg-[#F0FDF4] border border-[#DCFCE7] rounded-xl flex items-center justify-between">
              <div>
                <p className="text-[11px] font-bold uppercase text-[#16A34A]">Current Available Balance</p>
                <p className="text-[22px] font-extrabold text-[#16A34A]">{farmer.walletBalance}</p>
              </div>
              <button onClick={() => navigate('/wallet')} className="btn btn-primary btn-sm">Payout Log</button>
            </div>
          </div>
        )}

        {/* TAB 8: CARBON CREDITS */}
        {activeTab === 'Carbon' && (
          <div className="space-y-6">
            <h3 className="text-[15px] font-bold text-[#0F172A] border-b border-[#F1F5F9] pb-3 flex items-center gap-2">
              <Cloud size={16} className="text-[#16A34A]" /> Carbon Credit Minting & Certificate Ledger
            </h3>
            <div className="p-4 border border-[#E8EDF5] rounded-xl bg-[#FAFCFF] space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[13px] font-bold text-[#0F172A]">14.2 tCO2e Carbon Credits Issued</span>
                <StatusBadge label="VERRA CERTIFIED" variant="success" size="sm" />
              </div>
              <p className="text-[11.5px] text-[#64748B]">Batch Serial #: `BHUMI-CC-2025-MP-8091` • Value: ₹17,040</p>
            </div>
          </div>
        )}

        {/* TAB 9: TREE INSURANCE */}
        {activeTab === 'Insurance' && (
          <div className="space-y-6">
            <h3 className="text-[15px] font-bold text-[#0F172A] border-b border-[#F1F5F9] pb-3 flex items-center gap-2">
              <ShieldCheck size={16} className="text-[#16A34A]" /> Active Tree Shield Policies
            </h3>
            <div className="p-4 border border-[#E8EDF5] rounded-xl bg-[#FAFCFF] space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[13px] font-bold text-[#0F172A]">Tree Shield Policy #TS-9021</span>
                <StatusBadge label="ACTIVE POLICY" variant="info" size="sm" />
              </div>
              <p className="text-[11.5px] text-[#64748B]">Insured Trees: 1,250 • Premium Paid: ₹2,400 • Sum Insured: ₹2,50,000</p>
            </div>
          </div>
        )}

        {/* TAB 10: MARKETPLACE */}
        {activeTab === 'Marketplace' && (
          <div className="space-y-6">
            <h3 className="text-[15px] font-bold text-[#0F172A] border-b border-[#F1F5F9] pb-3 flex items-center gap-2">
              <ShoppingBag size={16} className="text-[#16A34A]" /> Marketplace Orders & Sapling Purchases
            </h3>
            <div className="p-4 border border-[#E8EDF5] rounded-xl flex items-center justify-between">
              <div>
                <span className="text-[12px] font-bold text-[#0F172A]">Order #ORD-8821 — Organic Bio-Fertilizer Kit (50kg)</span>
                <p className="text-[11px] text-[#64748B] mt-0.5">Delivered on 18 Jan 2025 • Total: ₹1,850</p>
              </div>
              <StatusBadge label="DELIVERED" variant="success" size="sm" />
            </div>
          </div>
        )}

        {/* TAB 11: SUPPORT TICKETS */}
        {activeTab === 'Support' && (
          <div className="space-y-6">
            <h3 className="text-[15px] font-bold text-[#0F172A] border-b border-[#F1F5F9] pb-3 flex items-center gap-2">
              <LifeBuoy size={16} className="text-[#16A34A]" /> Support Ticket History
            </h3>
            <div className="p-4 border border-[#E8EDF5] rounded-xl flex items-center justify-between">
              <div>
                <span className="text-[12.5px] font-bold text-[#0F172A]">Ticket #TCK-401 — Sapling Drip Irrigation Inquiry</span>
                <p className="text-[11px] text-[#64748B] mt-0.5">Opened 2 days ago • Agent: Support Team</p>
              </div>
              <StatusBadge label="RESOLVED" variant="gray" size="sm" />
            </div>
          </div>
        )}

        {/* TAB 12: ACTIVITY TIMELINE */}
        {activeTab === 'Timeline' && (
          <div className="space-y-6">
            <h3 className="text-[15px] font-bold text-[#0F172A] border-b border-[#F1F5F9] pb-3 flex items-center gap-2">
              <Clock size={16} className="text-[#16A34A]" /> Activity Audit Trail
            </h3>
            <div className="relative pl-6 border-l-2 border-[#E2E8F0] space-y-6">
              <div className="relative">
                <span className="absolute -left-[31px] top-0 w-4 h-4 rounded-full bg-[#16A34A] border-2 border-white" />
                <p className="text-[11px] font-bold text-[#94A3B8]">Today, 10:30 AM</p>
                <p className="text-[13px] font-bold text-[#0F172A]">Logged in via Mobile OTP</p>
              </div>
              <div className="relative">
                <span className="absolute -left-[31px] top-0 w-4 h-4 rounded-full bg-[#2563EB] border-2 border-white" />
                <p className="text-[11px] font-bold text-[#94A3B8]">14 Jan 2025</p>
                <p className="text-[13px] font-bold text-[#0F172A]">Registered on BhumiCred Platform</p>
              </div>
            </div>
          </div>
        )}

        {/* TAB 13: DOCUMENTS */}
        {activeTab === 'Documents' && (
          <div className="space-y-6">
            <h3 className="text-[15px] font-bold text-[#0F172A] border-b border-[#F1F5F9] pb-3 flex items-center gap-2">
              <Folder size={16} className="text-[#16A34A]" /> Uploaded Verification Documents
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 border border-[#E8EDF5] rounded-xl bg-[#FAFCFF] flex items-center justify-between">
                <div>
                  <p className="text-[12.5px] font-bold text-[#0F172A]">Aadhaar_Front_Back.pdf</p>
                  <p className="text-[10.5px] text-[#94A3B8]">Uploaded 14 Jan • 1.2 MB</p>
                </div>
                <button onClick={() => toast.success('Opening Aadhaar PDF')} className="btn btn-ghost btn-icon btn-sm"><Eye size={14} /></button>
              </div>
              <div className="p-4 border border-[#E8EDF5] rounded-xl bg-[#FAFCFF] flex items-center justify-between">
                <div>
                  <p className="text-[12.5px] font-bold text-[#0F172A]">Land_Registry_Khasra.pdf</p>
                  <p className="text-[10.5px] text-[#94A3B8]">Uploaded 15 Jan • 3.4 MB</p>
                </div>
                <button onClick={() => toast.success('Opening Land Registry PDF')} className="btn btn-ghost btn-icon btn-sm"><Eye size={14} /></button>
              </div>
              <div className="p-4 border border-[#E8EDF5] rounded-xl bg-[#FAFCFF] flex items-center justify-between">
                <div>
                  <p className="text-[12.5px] font-bold text-[#0F172A]">Bank_Passbook_Copy.jpg</p>
                  <p className="text-[10.5px] text-[#94A3B8]">Uploaded 14 Jan • 850 KB</p>
                </div>
                <button onClick={() => toast.success('Opening Bank Passbook')} className="btn btn-ghost btn-icon btn-sm"><Eye size={14} /></button>
              </div>
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

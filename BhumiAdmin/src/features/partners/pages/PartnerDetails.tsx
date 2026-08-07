import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, CheckCircle, Building, User,
  FileText, Download, Award, ShieldCheck, Clock, Ban, Key,
  DollarSign
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { StatusBadge } from '../../../components/ui/StatusBadge';
import toast from 'react-hot-toast';

export const PartnerDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'registration' | 'contact' | 'agreement' | 'projects' | 'performance' | 'commission' | 'status'>('registration');
  const [partnerStatus, setPartnerStatus] = useState<'Active' | 'Pending' | 'Suspended'>('Active');
  const [commissionRate] = useState<string>('8.5%');
  const [actionModal, setActionModal] = useState<string | null>(null);

  const partner = {
    id: id || 'PRT-1001',
    companyName: 'AgriCorp Solutions Pvt Ltd',
    partnerType: 'Carbon Partner',
    cinNumber: 'CIN-U01100MP2021PTC054129',
    gstNumber: '23AAACA9012A1Z5',
    panNumber: 'AAACA9012A',
    incorporationDate: '14 May 2021',
    regAddress: 'Corporate Tower #402, Arera Colony, Bhopal, Madhya Pradesh - 462016',
    contactPerson: 'Vikram Mehta',
    designation: 'Managing Director',
    phone: '+91 98260 11902',
    email: 'v.mehta@agricorp.in',
    bankAccount: 'SBI Escrow Account #XXXX-XXXX-9901 (IFSC: SBIN0001024)',
    agreementDate: '01 Jan 2024',
    agreementExpiry: '31 Dec 2027 (3 Years Remaining)',
    assignedProjectsCount: 14,
    coveredLandArea: '1,42,500 Acres',
    performanceScore: 96.5,
    walletBalance: '₹3,45,000',
    totalPayouts: '₹48.2 Lakhs',
  };

  const handleAction = (actionName: string) => {
    setActionModal(null);
    if (actionName === 'Approve Partner') setPartnerStatus('Active');
    if (actionName === 'Suspend Partner') setPartnerStatus('Suspended');
    toast.success(`Action "${actionName}" completed successfully!`);
  };

  return (
    <div className="space-y-6 page-enter pb-12" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>

      {/* ── HEADER & ACTIONS BAR ── */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white border border-[#E8EDF5] rounded-2xl p-5 shadow-xs">
        <div className="flex items-center gap-3.5 min-w-0">
          <button
            onClick={() => navigate('/partners')}
            className="w-10 h-10 rounded-xl border border-[#E2E8F0] bg-white flex items-center justify-center text-[#64748B] hover:text-[#0F172A] hover:bg-[#F8FAFC] transition-all cursor-pointer"
            title="Back to Partners"
          >
            <ArrowLeft size={18} />
          </button>
          <div className="w-11 h-11 rounded-2xl bg-[#F0FDF4] border border-[#DCFCE7] flex items-center justify-center text-[#16A34A] shrink-0">
            <Building size={22} />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-[22px] font-bold text-[#0F172A] leading-tight">{partner.companyName}</h1>
              <StatusBadge status={partnerStatus === 'Active' ? 'success' : partnerStatus === 'Suspended' ? 'danger' : 'warning'} label={partnerStatus} />
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#EFF6FF] text-[#2563EB] border border-[#DBEAFE]">
                {partner.partnerType}
              </span>
            </div>
            <p className="text-[13px] text-[#64748B] mt-0.5">
              Partner ID: <span className="font-mono text-[#0F172A] font-bold">{partner.id}</span> • GSTIN: <span className="font-mono text-[#0F172A] font-bold">{partner.gstNumber}</span> • Contact: {partner.contactPerson}
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setActionModal('Suspend Partner')}
            className="px-3.5 py-2 bg-white border border-[#FECACA] hover:bg-[#FEF2F2] text-[#EF4444] font-bold text-[12.5px] rounded-xl transition-all cursor-pointer flex items-center gap-1.5"
          >
            <Ban size={14} /> Suspend
          </button>
          <button
            onClick={() => setActionModal('Approve Partner')}
            className="px-3.5 py-2 bg-[#16A34A] hover:bg-[#15803D] text-white font-bold text-[12.5px] rounded-xl shadow-xs transition-all cursor-pointer flex items-center gap-1.5"
          >
            <CheckCircle size={14} /> Approve Partner
          </button>
          <button
            onClick={() => setActionModal('Reset API Keys')}
            className="px-3.5 py-2 bg-[#F8FAFC] border border-[#E2E8F0] text-[#0F172A] font-bold text-[12.5px] rounded-xl hover:bg-[#F1F5F9] transition-all cursor-pointer flex items-center gap-1.5"
          >
            <Key size={14} /> API Key
          </button>
        </div>
      </div>

      {/* ── TABS BAR (7 BRD Sections) ── */}
      <div className="flex items-center gap-2 border-b border-[#E8EDF5] overflow-x-auto pb-1 scrollbar-none">
        {[
          { id: 'registration', label: 'Company & Registration', icon: Building },
          { id: 'contact', label: 'Contact Person', icon: User },
          { id: 'agreement', label: 'Agreement & SLA', icon: FileText },
          { id: 'projects', label: 'Projects Assigned', icon: ShieldCheck },
          { id: 'performance', label: 'SLA Performance', icon: Award },
          { id: 'commission', label: 'Commission & Wallet', icon: DollarSign },
          { id: 'status', label: 'Status Audit Logs', icon: Clock },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-[13px] transition-all whitespace-nowrap cursor-pointer ${
                isActive
                  ? 'bg-[#F0FDF4] text-[#16A34A] border border-[#DCFCE7]'
                  : 'text-[#64748B] hover:text-[#0F172A] hover:bg-[#F8FAFC]'
              }`}
            >
              <Icon size={16} className={isActive ? 'text-[#16A34A]' : 'text-[#94A3B8]'} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* ── TAB CONTENT ── */}
      <div className="bg-white border border-[#E8EDF5] rounded-2xl p-6 shadow-xs min-h-[360px]">

        {/* 1. COMPANY & REGISTRATION */}
        {activeTab === 'registration' && (
          <div className="space-y-6">
            <h3 className="text-[15px] font-bold text-[#0F172A] border-b border-[#F1F5F9] pb-3 flex items-center gap-2">
              <Building size={18} className="text-[#16A34A]" /> Company & Incorporation Details
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <p className="text-[11px] font-bold uppercase text-[#94A3B8]">Company Name</p>
                <p className="text-[14px] font-bold text-[#0F172A]">{partner.companyName}</p>
              </div>
              <div>
                <p className="text-[11px] font-bold uppercase text-[#94A3B8]">Partner Category</p>
                <p className="text-[13.5px] font-bold text-[#2563EB]">{partner.partnerType}</p>
              </div>
              <div>
                <p className="text-[11px] font-bold uppercase text-[#94A3B8]">Incorporation / CIN</p>
                <p className="text-[13.5px] font-mono font-semibold text-[#0F172A]">{partner.cinNumber}</p>
              </div>
              <div>
                <p className="text-[11px] font-bold uppercase text-[#94A3B8]">GSTIN Number</p>
                <p className="text-[13.5px] font-mono font-bold text-[#16A34A]">{partner.gstNumber}</p>
              </div>
              <div>
                <p className="text-[11px] font-bold uppercase text-[#94A3B8]">Company PAN</p>
                <p className="text-[13.5px] font-mono font-bold text-[#0F172A]">{partner.panNumber}</p>
              </div>
              <div>
                <p className="text-[11px] font-bold uppercase text-[#94A3B8]">Incorporation Date</p>
                <p className="text-[13.5px] font-semibold text-[#0F172A]">{partner.incorporationDate}</p>
              </div>
              <div className="md:col-span-3">
                <p className="text-[11px] font-bold uppercase text-[#94A3B8]">Registered Corporate Office</p>
                <p className="text-[13.5px] font-medium text-[#475569] mt-0.5">{partner.regAddress}</p>
              </div>
            </div>
          </div>
        )}

        {/* 2. CONTACT PERSON */}
        {activeTab === 'contact' && (
          <div className="space-y-6">
            <h3 className="text-[15px] font-bold text-[#0F172A] border-b border-[#F1F5F9] pb-3 flex items-center gap-2">
              <User size={18} className="text-[#2563EB]" /> Primary Contact & Escrow Account
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-4 bg-[#FAFCFF] border border-[#F1F5F9] rounded-2xl space-y-3">
                <div className="text-[13px] font-bold text-[#0F172A]">Nodal Contact Officer</div>
                <div className="space-y-2 text-[13px]">
                  <div><span className="text-[#94A3B8] text-[11px] uppercase font-bold block">Name & Designation</span><span className="font-bold text-[#0F172A]">{partner.contactPerson} ({partner.designation})</span></div>
                  <div><span className="text-[#94A3B8] text-[11px] uppercase font-bold block">Official Email</span><span className="font-semibold text-[#2563EB]">{partner.email}</span></div>
                  <div><span className="text-[#94A3B8] text-[11px] uppercase font-bold block">Mobile Phone</span><span className="font-mono font-semibold text-[#0F172A]">{partner.phone}</span></div>
                </div>
              </div>
              <div className="p-4 bg-[#FAFCFF] border border-[#F1F5F9] rounded-2xl space-y-3">
                <div className="text-[13px] font-bold text-[#0F172A]">Escrow Disbursement Account</div>
                <div className="space-y-2 text-[13px]">
                  <div><span className="text-[#94A3B8] text-[11px] uppercase font-bold block">Bank & Account</span><span className="font-mono font-semibold text-[#0F172A]">{partner.bankAccount}</span></div>
                  <div><span className="text-[#94A3B8] text-[11px] uppercase font-bold block">Wallet Available Balance</span><span className="font-extrabold text-[#16A34A]">{partner.walletBalance}</span></div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 3. AGREEMENT */}
        {activeTab === 'agreement' && (
          <div className="space-y-6">
            <h3 className="text-[15px] font-bold text-[#0F172A] border-b border-[#F1F5F9] pb-3 flex items-center gap-2">
              <FileText size={18} className="text-[#16A34A]" /> Legal Agreement & MoU Contract
            </h3>
            <div className="p-5 border border-[#E8EDF5] rounded-2xl bg-[#FAFCFF] flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold text-[#16A34A] bg-[#F0FDF4] px-2 py-0.5 rounded-md border border-[#DCFCE7]">ACTIVE CONTRACT</span>
                <h4 className="text-[14px] font-bold text-[#0F172A] mt-1.5">BhumiCred Master Partner Service Agreement (MPSA)</h4>
                <p className="text-[11.5px] text-[#64748B]">Effective Date: {partner.agreementDate} • Expiry: {partner.agreementExpiry}</p>
              </div>
              <button onClick={() => toast.success('Downloading Master Agreement PDF')} className="btn btn-secondary btn-sm flex items-center gap-1.5">
                <Download size={14} /> Download Contract
              </button>
            </div>
          </div>
        )}

        {/* 4. PROJECTS */}
        {activeTab === 'projects' && (
          <div className="space-y-6">
            <h3 className="text-[15px] font-bold text-[#0F172A] border-b border-[#F1F5F9] pb-3 flex items-center gap-2">
              <ShieldCheck size={18} className="text-[#2563EB]" /> Assigned Carbon & Agroforestry Projects ({partner.assignedProjectsCount})
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 border border-[#E8EDF5] rounded-xl bg-white space-y-1">
                <span className="text-[11px] font-bold text-[#2563EB]">PRJ-1042</span>
                <p className="text-[13px] font-bold text-[#0F172A]">MP Agroforestry Carbon Sink Drive</p>
                <p className="text-[11.5px] text-[#64748B]">Land Area: {partner.coveredLandArea} • Status: Active</p>
              </div>
            </div>
          </div>
        )}

        {/* 5. PERFORMANCE */}
        {activeTab === 'performance' && (
          <div className="space-y-6">
            <h3 className="text-[15px] font-bold text-[#0F172A] border-b border-[#F1F5F9] pb-3 flex items-center gap-2">
              <Award size={18} className="text-[#8B5CF6]" /> SLA Performance & Verification Rating
            </h3>
            <div className="p-5 border border-[#DCFCE7] bg-[#F0FDF4] rounded-2xl flex items-center justify-between">
              <div>
                <p className="text-[11px] font-bold uppercase text-[#16A34A]">Overall SLA Compliance Score</p>
                <p className="text-[28px] font-extrabold text-[#16A34A]">{partner.performanceScore}%</p>
              </div>
              <StatusBadge status="success" label="EXCELLENT RATING" />
            </div>
          </div>
        )}

        {/* 6. COMMISSION */}
        {activeTab === 'commission' && (
          <div className="space-y-6">
            <h3 className="text-[15px] font-bold text-[#0F172A] border-b border-[#F1F5F9] pb-3 flex items-center gap-2">
              <DollarSign size={18} className="text-[#16A34A]" /> Revenue Share & Commission Settings
            </h3>
            <div className="p-5 border border-[#E8EDF5] rounded-2xl bg-[#FAFCFF] flex items-center justify-between">
              <div>
                <p className="text-[11px] font-bold uppercase text-[#94A3B8]">Active Platform Commission Rate</p>
                <p className="text-[24px] font-extrabold text-[#0F172A] mt-0.5">{commissionRate}</p>
              </div>
              <button onClick={() => setActionModal('Update Commission')} className="btn btn-secondary btn-sm">
                Update Rate
              </button>
            </div>
          </div>
        )}

        {/* 7. STATUS LOGS */}
        {activeTab === 'status' && (
          <div className="space-y-6">
            <h3 className="text-[15px] font-bold text-[#0F172A] border-b border-[#F1F5F9] pb-3 flex items-center gap-2">
              <Clock size={18} className="text-[#2563EB]" /> Audit & Status Change Logs
            </h3>
            <div className="relative pl-6 space-y-4">
              <div className="relative">
                <span className="absolute -left-[31px] top-1 w-3 h-3 rounded-full bg-[#16A34A]" />
                <p className="text-[11px] font-bold text-[#94A3B8]">01 Jan 2024</p>
                <p className="text-[13px] font-bold text-[#0F172A]">Partner Account Approved & MOU Activated</p>
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
                Are you sure you want to perform <strong>{actionModal}</strong> for {partner.companyName}?
              </p>
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#F1F5F9]">
                <button onClick={() => setActionModal(null)} className="btn btn-secondary btn-sm">Cancel</button>
                <button onClick={() => handleAction(actionModal)} className="btn btn-primary btn-sm">Confirm</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};

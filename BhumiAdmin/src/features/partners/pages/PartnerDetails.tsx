import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, CheckCircle, Building, User,
  FileText, Download, Award, ShieldCheck, Clock, Ban, Key,
  DollarSign, CheckSquare, CreditCard, Sparkles, Folder
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { StatusBadge } from '../../../components/ui/StatusBadge';
import { downloadPDFDocument } from '../../../utils/pdfExporter';
import toast from 'react-hot-toast';

export const PartnerDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  // 6 Specified Partner Dashboard Tabs: Projects, Pending Tasks, Documents, Invoices, Payments, Carbon Projects
  const [activeTab, setActiveTab] = useState<'Projects' | 'Pending Tasks' | 'Documents' | 'Invoices' | 'Payments' | 'Carbon Projects'>('Projects');
  const [partnerStatus, setPartnerStatus] = useState<'Active' | 'Pending' | 'Suspended'>('Active');
  const [actionModal, setActionModal] = useState<string | null>(null);

  const partner = {
    id: id || 'PRT-1001',
    companyName: 'AgriCorp Solutions Pvt Ltd',
    partnerType: 'Carbon Developer',
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
    performanceRating: 4.8,
    walletBalance: '₹3,45,000',
    totalPayouts: '₹46.5 Lakhs',
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

      {/* ── 6 SPECIFIED PARTNER DASHBOARD TABS ── */}
      <div className="flex items-center gap-2 border-b border-[#E8EDF5] overflow-x-auto pb-1 custom-scrollbar">
        {[
          { id: 'Projects', label: 'Projects', icon: ShieldCheck },
          { id: 'Pending Tasks', label: 'Pending Tasks', icon: CheckSquare },
          { id: 'Documents', label: 'Documents', icon: Folder },
          { id: 'Invoices', label: 'Invoices', icon: FileText },
          { id: 'Payments', label: 'Payments', icon: CreditCard },
          { id: 'Carbon Projects', label: 'Carbon Projects', icon: Sparkles },
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

      {/* ── TAB CONTENT AREA ── */}
      <div className="bg-white border border-[#E8EDF5] rounded-2xl p-6 shadow-xs min-h-[380px]">

        {/* 1. PROJECTS TAB */}
        {activeTab === 'Projects' && (
          <div className="space-y-6">
            <h3 className="text-[15px] font-bold text-[#0F172A] border-b border-[#F1F5F9] pb-3 flex items-center gap-2">
              <ShieldCheck size={18} className="text-[#2563EB]" /> Assigned Projects ({partner.assignedProjectsCount})
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 border border-[#E8EDF5] rounded-xl bg-[#FAFCFF] space-y-2">
                <span className="text-[11px] font-bold text-[#2563EB] bg-[#EFF6FF] px-2 py-0.5 rounded-md border border-[#DBEAFE]">PRJ-1042</span>
                <h4 className="text-[14px] font-bold text-[#0F172A]">MP Agroforestry Carbon Sink Drive</h4>
                <p className="text-[11.5px] text-[#64748B]">Land Area: {partner.coveredLandArea} • Rating: ★ {partner.performanceRating}</p>
              </div>
            </div>
          </div>
        )}

        {/* 2. PENDING TASKS TAB */}
        {activeTab === 'Pending Tasks' && (
          <div className="space-y-6">
            <h3 className="text-[15px] font-bold text-[#0F172A] border-b border-[#F1F5F9] pb-3 flex items-center gap-2">
              <CheckSquare size={18} className="text-[#D97706]" /> Action Items & SLA Verification Queue
            </h3>
            <div className="space-y-3">
              <div className="p-4 border border-[#E8EDF5] rounded-xl bg-[#FAFCFF] flex items-center justify-between">
                <div>
                  <h4 className="text-[13px] font-bold text-[#0F172A]">Upload Q3 Drone Canopy Imagery Batch</h4>
                  <p className="text-[11px] text-[#64748B]">Project: MP Agroforestry Carbon Sink • Due: 15 Aug 2026</p>
                </div>
                <button onClick={() => toast.success('Task marked in progress')} className="btn btn-secondary btn-sm">Take Action</button>
              </div>
            </div>
          </div>
        )}

        {/* 3. DOCUMENTS TAB */}
        {activeTab === 'Documents' && (
          <div className="space-y-6">
            <h3 className="text-[15px] font-bold text-[#0F172A] border-b border-[#F1F5F9] pb-3 flex items-center gap-2">
              <Folder size={18} className="text-[#16A34A]" /> Legal Contracts & Statutory Certificates
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                { name: 'Master_Partner_Service_Agreement_MPSA.pdf', date: '01 Jan 2024' },
                { name: 'GSTIN_Registration_Certificate.pdf', date: '14 May 2021' },
                { name: 'Company_PAN_Card_Copy.pdf', date: '14 May 2021' },
                { name: 'NABL_MoU_Compliance_Certification.pdf', date: '10 Feb 2024' },
              ].map((doc, idx) => (
                <div key={idx} className="p-4 border border-[#E8EDF5] rounded-2xl bg-[#FAFCFF] flex items-center justify-between">
                  <div>
                    <h4 className="text-[13px] font-bold text-[#0F172A]">{doc.name}</h4>
                    <p className="text-[11px] text-[#64748B]">Issued: {doc.date}</p>
                  </div>
                  <button
                    onClick={() => {
                      downloadPDFDocument({
                        title: doc.name.replace('.pdf', '').replace(/_/g, ' '),
                        subtitle: `Issued To: ${partner.companyName} (${partner.id})`,
                        filename: doc.name,
                        metadata: {
                          'Partner Name': partner.companyName,
                          'Partner ID': partner.id,
                          'Partner Type': partner.partnerType,
                          'GSTIN Number': partner.gstNumber,
                          'PAN Number': partner.panNumber,
                          'Issue Date': doc.date,
                        },
                      });
                      toast.success(`Generated official ${doc.name}!`);
                    }}
                    className="p-2 bg-[#F0FDF4] hover:bg-[#DCFCE7] text-[#16A34A] rounded-xl cursor-pointer"
                  >
                    <Download size={14} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 4. INVOICES TAB */}
        {activeTab === 'Invoices' && (
          <div className="space-y-6">
            <h3 className="text-[15px] font-bold text-[#0F172A] border-b border-[#F1F5F9] pb-3 flex items-center gap-2">
              <FileText size={18} className="text-[#2563EB]" /> Tax Invoices & Fee Statements
            </h3>
            <div className="p-4 border border-[#E8EDF5] rounded-xl bg-[#FAFCFF] flex items-center justify-between">
              <div>
                <h4 className="text-[13.5px] font-bold text-[#0F172A]">Invoice #INV-2026-8801 — Commission Share Q2</h4>
                <p className="text-[11.5px] text-[#64748B]">Amount: ₹4,65,000 • Date: 01 Jul 2026</p>
              </div>
              <button
                onClick={() => {
                  downloadPDFDocument({
                    title: 'TAX INVOICE — COMMISSION SHARE Q2',
                    subtitle: 'Invoice Number: INV-2026-8801',
                    filename: 'Invoice_INV-2026-8801.pdf',
                    metadata: {
                      'Invoice Number': 'INV-2026-8801',
                      'Invoice Date': '01 Jul 2026',
                      'Billed To': partner.companyName,
                      'GSTIN': partner.gstNumber,
                      'Net Amount': '₹4,65,000',
                      'Payment Status': 'Paid via Escrow Settlement',
                    },
                  });
                  toast.success('Generated Tax Invoice PDF!');
                }}
                className="btn btn-secondary btn-sm flex items-center gap-1 cursor-pointer"
              >
                <Download size={14} /> Download Invoice PDF
              </button>
            </div>
          </div>
        )}

        {/* 5. PAYMENTS TAB */}
        {activeTab === 'Payments' && (
          <div className="space-y-6">
            <h3 className="text-[15px] font-bold text-[#0F172A] border-b border-[#F1F5F9] pb-3 flex items-center gap-2">
              <CreditCard size={18} className="text-[#16A34A]" /> Disbursement & Escrow Payments
            </h3>
            <div className="p-4 bg-[#F0FDF4] border border-[#DCFCE7] rounded-2xl flex items-center justify-between">
              <div>
                <p className="text-[11px] font-bold uppercase text-[#16A34A]">Total Payouts Settled</p>
                <p className="text-[22px] font-extrabold text-[#16A34A]">{partner.totalPayouts}</p>
              </div>
              <p className="text-[12px] text-[#64748B] font-mono">{partner.bankAccount}</p>
            </div>
          </div>
        )}

        {/* 6. CARBON PROJECTS TAB */}
        {activeTab === 'Carbon Projects' && (
          <div className="space-y-6">
            <h3 className="text-[15px] font-bold text-[#0F172A] border-b border-[#F1F5F9] pb-3 flex items-center gap-2">
              <Sparkles size={18} className="text-[#059669]" /> Carbon Sequestration Projects & Credit Yield
            </h3>
            <div className="p-4 border border-[#DCFCE7] bg-[#F0FDF4] rounded-2xl space-y-2">
              <h4 className="text-[14px] font-bold text-[#16A34A]">MP Agroforestry Carbon Sink (310,000 tCO₂e Issued)</h4>
              <p className="text-[12px] text-[#64748B]">Verra Registry Batch: #VR-8091 • Offtake Agreement: EcoCredits EU</p>
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
                Are you sure you want to perform <strong>{actionModal}</strong> for {partner.companyName} ({partner.id})?
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

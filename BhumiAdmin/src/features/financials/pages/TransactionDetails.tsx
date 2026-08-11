import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, CheckCircle, XCircle, Send, History, Building2,
  User, DollarSign, Download, ShieldCheck, FileText
} from 'lucide-react';
import { StatusBadge } from '../../../components/ui/StatusBadge';
import { KpiCard } from '../../../components/ui/KpiCard';
import { downloadPDFDocument } from '../../../utils/pdfExporter';
import toast from 'react-hot-toast';

export const TransactionDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  // 5 Specified Withdrawal Action Controls & Tabs: Approve, Reject, Transfer, UTR, History
  const [activeTab, setActiveTab] = useState<'Overview' | 'Transfer' | 'UTR' | 'History'>('Overview');
  const [txnStatus, setTxnStatus] = useState<'Approved' | 'Pending' | 'Rejected'>('Pending');
  const [utrNumber, setUtrNumber] = useState('UTR-2026-9021-SBIN');

  const safeId = id || 'TXN-9001';

  const transaction = {
    id: safeId,
    txnId: safeId.startsWith('TXN-') ? safeId : `TXN-CRB-${safeId.slice(-4).toUpperCase()}`,
    user_name: 'Ramesh Patel',
    user_id: 'FARM-MP-8091',
    user_type: 'Farmer',
    amount: 42500,
    category: 'Carbon Credit Income Payout',
    utr: utrNumber,
    bankName: 'State Bank of India (SBI)',
    bankAccount: 'SBI Escrow A/C #XXXX-XXXX-9901',
    ifscCode: 'SBIN0001024',
    requestedAt: '05 Aug 2026, 10:30 AM',
    processedAt: '05 Aug 2026, 11:15 AM',
  };

  const handleApprove = () => {
    setTxnStatus('Approved');
    toast.success(`Transaction ${transaction.txnId} approved successfully!`);
  };

  const handleReject = () => {
    setTxnStatus('Rejected');
    toast.error(`Transaction ${transaction.txnId} rejected.`);
  };

  return (
    <div className="space-y-6 page-enter pb-12" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>

      {/* ── HEADER & CONTROL BAR ── */}
      <div className="bg-white border border-[#E8EDF5] rounded-2xl p-5 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3.5 min-w-0">
          <button
            onClick={() => navigate('/wallet')}
            className="w-10 h-10 rounded-xl border border-[#E2E8F0] bg-white flex items-center justify-center text-[#64748B] hover:text-[#0F172A] hover:bg-[#F8FAFC] transition-all cursor-pointer"
            title="Back to Wallet"
          >
            <ArrowLeft size={18} />
          </button>
          <div className="w-11 h-11 rounded-2xl bg-[#F0FDF4] border border-[#DCFCE7] flex items-center justify-center text-[#16A34A] shrink-0">
            <DollarSign size={22} />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-[18px] font-bold text-[#0F172A]">Transaction Details — {transaction.txnId}</h1>
              <StatusBadge
                label={txnStatus}
                variant={txnStatus === 'Approved' ? 'success' : txnStatus === 'Pending' ? 'warning' : 'danger'}
                size="sm"
              />
            </div>
            <p className="text-[12px] text-[#64748B] mt-0.5 flex items-center gap-2">
              <span>Beneficiary: <strong>{transaction.user_name}</strong> ({transaction.user_id})</span> • <span>Category: {transaction.category}</span>
            </p>
          </div>
        </div>

        {/* 5 Specified Actions: Approve, Reject, Transfer, UTR, History */}
        <div className="flex items-center gap-2 flex-wrap">
          {txnStatus === 'Pending' && (
            <>
              <button
                onClick={handleReject}
                className="px-3.5 py-2 bg-[#FEF2F2] border border-[#FECACA] hover:bg-[#FEE2E2] text-[#EF4444] text-[12.5px] font-bold rounded-xl transition-all cursor-pointer flex items-center gap-1.5"
              >
                <XCircle size={14} /> 1. Reject
              </button>
              <button
                onClick={handleApprove}
                className="px-3.5 py-2 bg-[#16A34A] hover:bg-[#15803D] text-white text-[12.5px] font-bold rounded-xl shadow-xs transition-all cursor-pointer flex items-center gap-1.5"
              >
                <CheckCircle size={14} /> 2. Approve
              </button>
            </>
          )}

          <button
            onClick={() => {
              downloadPDFDocument({
                title: `BANK DISBURSEMENT RECEIPT — ${transaction.txnId}`,
                subtitle: `Beneficiary: ${transaction.user_name} (${transaction.user_id})`,
                filename: `Disbursement_${transaction.txnId}.pdf`,
                metadata: {
                  'Transaction Reference': transaction.txnId,
                  'Bank UTR Number': transaction.utr,
                  'Beneficiary Name': transaction.user_name,
                  'Disbursement Amount': `₹${transaction.amount.toLocaleString()}`,
                  'Bank & Account': transaction.bankAccount,
                  'IFSC Code': transaction.ifscCode,
                  'Status': txnStatus,
                },
              });
              toast.success('Generated official Receipt PDF!');
            }}
            className="btn btn-secondary btn-sm gap-1.5 cursor-pointer"
          >
            <Download size={14} /> Download Receipt
          </button>
        </div>
      </div>

      {/* ── KPI METRIC CARDS ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KpiCard title="PAYOUT AMOUNT" value={`₹${transaction.amount.toLocaleString()}`} icon={DollarSign} iconBg="#F0FDF4" iconColor="#16A34A" />
        <KpiCard title="UTR REFERENCE" value={transaction.utr} icon={Send} iconBg="#EFF6FF" iconColor="#2563EB" />
        <KpiCard title="BENEFICIARY" value={transaction.user_name} icon={User} iconBg="#F5F3FF" iconColor="#8B5CF6" />
        <KpiCard title="STATUS" value={txnStatus} icon={ShieldCheck} iconBg="#ECFDF5" iconColor="#059669" />
      </div>

      {/* ── INTERACTIVE TABS NAV ── */}
      <div className="bg-white border border-[#E8EDF5] rounded-2xl p-1.5 shadow-xs flex items-center gap-1">
        {[
          { id: 'Overview', label: '1. Transaction Overview', icon: FileText },
          { id: 'Transfer', label: '2. Bank Transfer Details', icon: Building2 },
          { id: 'UTR', label: '3. UTR Reference', icon: Send },
          { id: 'History', label: '4. Audit History', icon: History },
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-[12.5px] font-bold transition-all cursor-pointer ${
                isActive
                  ? 'bg-[#F0FDF4] text-[#16A34A] border border-[#DCFCE7] shadow-xs'
                  : 'text-[#64748B] hover:bg-[#F8FAFC]'
              }`}
            >
              <Icon size={14} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* ── TAB 1: OVERVIEW ── */}
      {activeTab === 'Overview' && (
        <div className="bg-white border border-[#E8EDF5] rounded-2xl p-6 shadow-xs space-y-4">
          <h3 className="text-[15px] font-bold text-[#0F172A] border-b border-[#F1F5F9] pb-3">Transaction Summary</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-[13px]">
            <div><span className="text-[#94A3B8] font-bold block text-[11px] uppercase">Transaction ID</span><span className="font-mono font-bold text-[#2563EB]">{transaction.txnId}</span></div>
            <div><span className="text-[#94A3B8] font-bold block text-[11px] uppercase">Amount</span><span className="font-bold text-[#16A34A]">₹{transaction.amount.toLocaleString()}</span></div>
            <div><span className="text-[#94A3B8] font-bold block text-[11px] uppercase">Category</span><span className="font-semibold text-[#0F172A]">{transaction.category}</span></div>
          </div>
        </div>
      )}

      {/* ── TAB 2: TRANSFER ── */}
      {activeTab === 'Transfer' && (
        <div className="bg-white border border-[#E8EDF5] rounded-2xl p-6 shadow-xs space-y-4">
          <h3 className="text-[15px] font-bold text-[#0F172A] border-b border-[#F1F5F9] pb-3">Bank Transfer & Escrow Details</h3>
          <div className="p-4 bg-[#FAFCFF] border border-[#F1F5F9] rounded-2xl space-y-2 text-[13px]">
            <p><strong>Bank Name:</strong> {transaction.bankName}</p>
            <p><strong>Account Number:</strong> <span className="font-mono">{transaction.bankAccount}</span></p>
            <p><strong>IFSC Code:</strong> <span className="font-mono text-[#2563EB]">{transaction.ifscCode}</span></p>
          </div>
        </div>
      )}

      {/* ── TAB 3: UTR ── */}
      {activeTab === 'UTR' && (
        <div className="bg-white border border-[#E8EDF5] rounded-2xl p-6 shadow-xs space-y-4">
          <h3 className="text-[15px] font-bold text-[#0F172A] border-b border-[#F1F5F9] pb-3">Bank UTR Transaction Reference</h3>
          <div className="p-4 bg-[#EFF6FF] border border-[#DBEAFE] rounded-2xl space-y-2">
            <span className="text-[11px] font-bold text-[#2563EB]">UTR NUMBER</span>
            <p className="text-[22px] font-mono font-bold text-[#2563EB]">{utrNumber}</p>
          </div>
        </div>
      )}

      {/* ── TAB 4: HISTORY ── */}
      {activeTab === 'History' && (
        <div className="bg-white border border-[#E8EDF5] rounded-2xl p-6 shadow-xs space-y-4">
          <h3 className="text-[15px] font-bold text-[#0F172A] border-b border-[#F1F5F9] pb-3">Audit Trail & Processing Timeline</h3>
          <div className="space-y-3 text-[12.5px]">
            <p className="text-[#64748B]">05 Aug 2026, 10:30 AM — Requested by Farmer {transaction.user_id}</p>
            <p className="text-[#16A34A] font-bold">05 Aug 2026, 11:15 AM — Approved by Admin (UTR: {utrNumber})</p>
          </div>
        </div>
      )}

    </div>
  );
};

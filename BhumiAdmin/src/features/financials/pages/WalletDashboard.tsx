import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Wallet, ArrowUpRight, CheckCircle2, Clock, RefreshCw, Eye, Check, X,
  IndianRupee, Download, Building2, Handshake, DollarSign, Send, RotateCcw,
  CheckCircle, ShieldCheck, Tag, Sparkles
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AreaChart, Area, ResponsiveContainer, Tooltip, CartesianGrid, XAxis, YAxis
} from 'recharts';
import { PageHeader } from '../../../components/ui/PageHeader';
import { KpiCard } from '../../../components/ui/KpiCard';
import { StatusBadge } from '../../../components/ui/StatusBadge';
import { EmptyState, SkeletonTable } from '../../../components/ui/EmptyState';
import { useWithdrawals, useApproveWithdrawal, useRejectWithdrawal } from '../api/useWallet';
import { downloadPDFDocument, downloadCSVDocument } from '../../../utils/pdfExporter';
import toast from 'react-hot-toast';

// 6 Specified Transaction Types
export const TRANSACTION_TYPES = [
  'Carbon',
  'Marketplace',
  'Insurance',
  'Referral',
  'Adjustment',
  'Withdrawal'
] as const;

export interface WalletTransactionItem {
  id: string;
  txn_id: string;
  user_name: string;
  user_id: string;
  user_type: 'Farmer' | 'Partner' | 'Govt' | 'Platform';
  amount: number;
  category: (typeof TRANSACTION_TYPES)[number];
  utr_number: string;
  bank_details: string;
  requested_at: string;
  status: 'Approved' | 'Pending' | 'Rejected';
}

const SEEDED_TRANSACTIONS: WalletTransactionItem[] = [
  {
    id: 'WLT-9001',
    txn_id: 'TXN-CRB-9001',
    user_name: 'Ramesh Patel',
    user_id: 'FARM-MP-8091',
    user_type: 'Farmer',
    amount: 42500,
    category: 'Carbon',
    utr_number: 'UTR-2026-9021-SBIN',
    bank_details: 'SBI A/C #XXXX9901 (IFSC: SBIN0001024)',
    requested_at: '05 Aug 2026, 10:30 AM',
    status: 'Approved',
  },
  {
    id: 'WLT-9002',
    txn_id: 'TXN-WTH-9002',
    user_name: 'Suresh Verma',
    user_id: 'FARM-MP-8092',
    user_type: 'Farmer',
    amount: 25000,
    category: 'Withdrawal',
    utr_number: 'UTR-2026-8802-HDFC',
    bank_details: 'HDFC A/C #XXXX1234 (IFSC: HDFC0001024)',
    requested_at: '04 Aug 2026, 02:15 PM',
    status: 'Pending',
  },
  {
    id: 'WLT-9003',
    txn_id: 'TXN-MKT-9003',
    user_name: 'AgriCorp Solutions Pvt Ltd',
    user_id: 'PRT-1001',
    user_type: 'Partner',
    amount: 145000,
    category: 'Marketplace',
    utr_number: 'UTR-2026-7712-ICIC',
    bank_details: 'ICICI Escrow A/C #XXXX4412',
    requested_at: '03 Aug 2026, 11:45 AM',
    status: 'Approved',
  },
  {
    id: 'WLT-9004',
    txn_id: 'TXN-INS-9004',
    user_name: 'Sita Devi',
    user_id: 'FARM-MP-8093',
    user_type: 'Farmer',
    amount: 18500,
    category: 'Insurance',
    utr_number: 'UTR-2026-5510-AXIS',
    bank_details: 'Axis A/C #XXXX8810',
    requested_at: '02 Aug 2026, 04:20 PM',
    status: 'Approved',
  },
  {
    id: 'WLT-9005',
    txn_id: 'TXN-REF-9005',
    user_name: 'Vijay Deshmukh',
    user_id: 'FARM-MH-4011',
    user_type: 'Farmer',
    amount: 3500,
    category: 'Referral',
    utr_number: 'UTR-2026-3390-PAYT',
    bank_details: 'Paytm Bank A/C #XXXX9912',
    requested_at: '01 Aug 2026, 09:10 AM',
    status: 'Approved',
  },
  {
    id: 'WLT-9006',
    txn_id: 'TXN-ADJ-9006',
    user_name: 'MP Forest Dept Board',
    user_id: 'GOVT-MP-401',
    user_type: 'Govt',
    amount: 250000,
    category: 'Adjustment',
    utr_number: 'UTR-2026-1100-GOVT',
    bank_details: 'Treasury Govt A/C #XXXX4012',
    requested_at: '28 Jul 2026, 05:00 PM',
    status: 'Approved',
  },
];

const WALLET_TREND = [
  { day: 'Mon', amount: 4.2 }, { day: 'Tue', amount: 6.1 }, { day: 'Wed', amount: 5.3 },
  { day: 'Thu', amount: 8.4 }, { day: 'Fri', amount: 7.2 }, { day: 'Sat', amount: 9.8 }, { day: 'Sun', amount: 12.8 },
];

export const WalletDashboard = () => {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const [transactionsList, setTransactionsList] = useState<WalletTransactionItem[]>(SEEDED_TRANSACTIONS);
  const [utrModalTxn, setUtrModalTxn] = useState<WalletTransactionItem | null>(null);
  const [newUtrNumber, setNewUtrNumber] = useState('');

  const { data: apiData, isLoading, refetch, isFetching } = useWithdrawals(1, 30);
  const approveMutation = useApproveWithdrawal();
  const rejectMutation = useRejectWithdrawal();

  const transactions = useMemo(() => {
    if (apiData && Array.isArray(apiData.items) && apiData.items.length > 0) {
      return apiData.items.map((w: any) => ({
        id: w.id || `WLT-${Math.floor(9000 + Math.random() * 900)}`,
        txn_id: `TXN-${String(w.id || '9001').slice(-6).toUpperCase()}`,
        user_name: w.farmer_id ? `Farmer (${w.farmer_id.slice(-6)})` : 'Beneficiary Farmer',
        user_id: w.farmer_id || 'FARM-MP-8091',
        user_type: 'Farmer' as const,
        amount: w.amount || 25000,
        category: 'Withdrawal' as const,
        utr_number: w.utr || `UTR-2026-${Math.floor(1000 + Math.random() * 9000)}-SBIN`,
        bank_details: 'Linked Bank Escrow Account',
        requested_at: new Date(w.requested_at || Date.now()).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }),
        status: w.status === 'approved' ? 'Approved' : w.status === 'rejected' ? 'Rejected' : 'Pending',
      }));
    }
    return transactionsList;
  }, [apiData, transactionsList]);

  const filteredTransactions = useMemo(() => {
    return transactions.filter(t => {
      const q = search.toLowerCase();
      const matchSearch = !q || [t.user_name, t.user_id, t.txn_id, t.utr_number, t.category].some(v => v?.toLowerCase().includes(q));
      const matchCat = !categoryFilter || t.category.toLowerCase() === categoryFilter.toLowerCase();
      const matchStatus = !statusFilter || t.status.toLowerCase() === statusFilter.toLowerCase();
      return matchSearch && matchCat && matchStatus;
    });
  }, [transactions, search, categoryFilter, statusFilter]);

  // 6 Specified KPI Cards (Platform Revenue, Farmer Wallet, Govt Wallet, Partner Wallet, Pending, Withdrawn)
  const platformRevenue = '₹48.2 Lakhs';
  const farmerWallet = '₹1.85 Crore';
  const govtWallet = '₹65.0 Lakhs';
  const partnerWallet = '₹42.8 Lakhs';
  const pendingAmount = transactions.filter(t => t.status === 'Pending').reduce((acc, t) => acc + t.amount, 0);
  const totalWithdrawn = transactions.filter(t => t.status === 'Approved').reduce((acc, t) => acc + t.amount, 0);

  const handleApprove = (id: string) => {
    const isRealWithdrawal = id.length === 24;
    
    if (isRealWithdrawal) {
      approveMutation.mutate(id, {
        onSuccess: () => {
          toast.success("Withdrawal approved successfully!");
          refetch();
        },
        onError: (err: any) => {
          toast.error(err?.response?.data?.message || "Failed to approve withdrawal on server.");
        }
      });
    } else {
      setTransactionsList(prev => prev.map(t => {
        if (t.id === id) {
          toast.success(`Transaction ${t.txn_id} approved! Payout of ₹${t.amount.toLocaleString()} disbursed.`);
          return { ...t, status: 'Approved' };
        }
        return t;
      }));
    }
  };

  const handleReject = (id: string) => {
    const isRealWithdrawal = id.length === 24;
    
    if (isRealWithdrawal) {
      const reason = prompt("Enter rejection reason (minimum 3 characters):");
      if (!reason) return;
      if (reason.trim().length < 3) {
        toast.error("Rejection reason must be at least 3 characters.");
        return;
      }
      
      rejectMutation.mutate({ withdrawalId: id, reason }, {
        onSuccess: () => {
          toast.success("Withdrawal request rejected.");
          refetch();
        },
        onError: (err: any) => {
          toast.error(err?.response?.data?.message || "Failed to reject withdrawal.");
        }
      });
    } else {
      setTransactionsList(prev => prev.map(t => {
        if (t.id === id) {
          toast.error(`Transaction ${t.txn_id} rejected.`);
          return { ...t, status: 'Rejected' };
        }
        return t;
      }));
    }
  };

  const handleSaveUTR = (e: React.FormEvent) => {
    e.preventDefault();
    if (!utrModalTxn || !newUtrNumber) return;

    setTransactionsList(prev => prev.map(t => {
      if (t.id === utrModalTxn.id) {
        toast.success(`UTR Reference Number updated to "${newUtrNumber}" for ${t.txn_id}!`);
        return { ...t, utr_number: newUtrNumber, status: 'Approved' };
      }
      return t;
    }));

    setUtrModalTxn(null);
    setNewUtrNumber('');
  };

  return (
    <div className="space-y-6 page-enter pb-12" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>

      {/* ── Page Header ── */}
      <PageHeader
        title="Wallet & Financial Operations"
        description="Platform revenue, farmer escrow wallets, Govt nodal balances, partner commissions, bank UTR transfer settlements, and withdrawal approvals."
        badge={{ label: `₹${(totalWithdrawn / 100000).toFixed(1)} Lakhs Disbursed`, variant: 'success' }}
        icon={Wallet}
        iconColor="#16A34A"
        actions={
          <div className="flex items-center gap-2">
            <button onClick={() => refetch()} className="btn btn-secondary btn-sm gap-1.5 cursor-pointer">
              <RefreshCw size={13} className={isFetching ? 'animate-spin' : ''} /> Sync Ledger
            </button>
            <button
              onClick={() => {
                downloadCSVDocument(
                  'Wallet_Transactions_Report.csv',
                  ['Txn ID', 'User Name', 'User ID', 'Category', 'Amount', 'UTR Number', 'Status', 'Date'],
                  transactions.map(t => [t.txn_id, t.user_name, t.user_id, t.category, t.amount, t.utr_number, t.status, t.requested_at])
                );
                toast.success('Exported Wallet Financials CSV!');
              }}
              className="btn btn-primary btn-sm gap-1.5 cursor-pointer"
            >
              <Download size={14} /> Export Financial CSV
            </button>
          </div>
        }
      />

      {/* ── 6 SPECIFIED KPI CARDS (Platform Revenue, Farmer Wallet, Govt Wallet, Partner Wallet, Pending, Withdrawn) ── */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <KpiCard title="PLATFORM REVENUE" value={platformRevenue} icon={DollarSign} iconBg="#F0FDF4" iconColor="#16A34A" loading={isLoading} />
        <KpiCard title="FARMER WALLET" value={farmerWallet} icon={Wallet} iconBg="#EFF6FF" iconColor="#2563EB" loading={isLoading} />
        <KpiCard title="GOVT WALLET" value={govtWallet} icon={Building2} iconBg="#FFFBEB" iconColor="#D97706" loading={isLoading} />
        <KpiCard title="PARTNER WALLET" value={partnerWallet} icon={Handshake} iconBg="#F5F3FF" iconColor="#8B5CF6" loading={isLoading} />
        <KpiCard title="PENDING" value={`₹${(pendingAmount / 1000).toFixed(1)}k`} icon={Clock} iconBg="#FEF3C7" iconColor="#B45309" loading={isLoading} />
        <KpiCard title="WITHDRAWN" value={`₹${(totalWithdrawn / 100000).toFixed(1)}L`} icon={CheckCircle} iconBg="#ECFDF5" iconColor="#059669" loading={isLoading} />
      </div>

      {/* ── 6 SPECIFIED TRANSACTION CATEGORY FILTERS (Carbon, Marketplace, Insurance, Referral, Adjustment, Withdrawal) ── */}
      <div className="bg-white border border-[#E8EDF5] rounded-2xl p-4 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search transactions by Txn ID, User Name, Farmer ID, UTR Number..."
              className="w-full pl-4 pr-4 py-2 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-[13px] text-[#0F172A] outline-none focus:border-[#16A34A] focus:bg-white transition-all"
            />
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* 6 Category Filters */}
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-3 py-2 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-[12px] font-medium text-[#0F172A] outline-none cursor-pointer focus:border-[#16A34A]"
            >
              <option value="">All 6 Transaction Types</option>
              {TRANSACTION_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-[12px] font-medium text-[#0F172A] outline-none cursor-pointer focus:border-[#16A34A]"
            >
              <option value="">All Statuses</option>
              <option value="Approved">Approved</option>
              <option value="Pending">Pending</option>
              <option value="Rejected">Rejected</option>
            </select>
          </div>
        </div>
      </div>

      {/* ── TRANSACTIONS & WITHDRAWALS DIRECTORY TABLE (With 5 Specified Actions: Approve, Reject, Transfer, UTR, History) ── */}
      <div className="bg-white border border-[#E8EDF5] rounded-2xl overflow-hidden shadow-xs">
        <div className="p-4 border-b border-[#F1F5F9] flex items-center justify-between">
          <h3 className="text-[14px] font-bold text-[#0F172A]">Financial Transactions & Withdrawal Settlement Queue</h3>
          <span className="text-[11px] font-bold text-[#16A34A] bg-[#F0FDF4] px-2 py-0.5 rounded-full border border-[#DCFCE7]">
            {filteredTransactions.length} Transactions
          </span>
        </div>

        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left border-collapse min-w-[1150px]">
            <thead>
              <tr className="bg-[#F8FAFC] border-b border-[#E2E8F0] text-[11px] font-bold uppercase tracking-wider text-[#475569]">
                <th className="py-3 px-4">Txn ID</th>
                <th className="py-3 px-4">User Details</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Amount</th>
                <th className="py-3 px-4">UTR Number</th>
                <th className="py-3 px-4">Requested At</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions (Approve, Reject, UTR)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F1F5F9]">
              {filteredTransactions.map((t) => (
                <tr key={t.id} className="hover:bg-[#F8FAFC] transition-colors">
                  <td className="py-3 px-4 font-mono text-[12px] font-bold text-[#2563EB]">
                    {t.txn_id}
                  </td>

                  <td className="py-3 px-4">
                    <div className="text-[13px] font-bold text-[#0F172A]">{t.user_name}</div>
                    <div className="text-[10.5px] font-mono text-[#64748B]">{t.user_id} • {t.user_type}</div>
                  </td>

                  {/* 6 Category Badge */}
                  <td className="py-3 px-4">
                    <span className="text-[11.5px] font-bold text-[#16A34A] bg-[#F0FDF4] px-2.5 py-0.5 rounded-md border border-[#DCFCE7]">
                      {t.category}
                    </span>
                  </td>

                  <td className="py-3 px-4 text-[13.5px] font-extrabold text-[#0F172A]">
                    ₹{t.amount.toLocaleString()}
                  </td>

                  {/* UTR Reference Number */}
                  <td className="py-3 px-4 font-mono text-[11.5px] font-bold text-[#2563EB]">
                    {t.utr_number}
                  </td>

                  <td className="py-3 px-4 text-[12px] text-[#64748B]">
                    {t.requested_at}
                  </td>

                  <td className="py-3 px-4">
                    <StatusBadge
                      label={t.status}
                      variant={t.status === 'Approved' ? 'success' : t.status === 'Pending' ? 'warning' : 'danger'}
                      size="sm"
                    />
                  </td>

                  {/* 5 Specified Withdrawal Actions (Approve, Reject, Transfer, UTR, History) */}
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      {t.status === 'Pending' && (
                        <>
                          <button
                            onClick={() => handleApprove(t.id)}
                            className="px-2.5 py-1 bg-[#F0FDF4] hover:bg-[#DCFCE7] text-[#16A34A] text-[11px] font-bold rounded-md transition-colors flex items-center gap-1 cursor-pointer"
                            title="Approve Payout"
                          >
                            <Check size={12} /> Approve
                          </button>
                          <button
                            onClick={() => handleReject(t.id)}
                            className="px-2.5 py-1 bg-[#FEF2F2] hover:bg-[#FEE2E2] text-[#EF4444] text-[11px] font-bold rounded-md transition-colors flex items-center gap-1 cursor-pointer"
                            title="Reject Request"
                          >
                            <X size={12} /> Reject
                          </button>
                        </>
                      )}

                      <button
                        onClick={() => { setUtrModalTxn(t); setNewUtrNumber(t.utr_number); }}
                        className="px-2.5 py-1 bg-[#EFF6FF] hover:bg-[#DBEAFE] text-[#2563EB] text-[11px] font-bold rounded-md transition-colors flex items-center gap-1 cursor-pointer"
                        title="Enter / Edit Bank UTR"
                      >
                        <Send size={12} /> UTR
                      </button>

                      <button
                        onClick={() => navigate(`/wallet/${t.id}`)}
                        className="p-1.5 text-[#64748B] hover:text-[#0F172A] hover:bg-[#F1F5F9] rounded-md transition-colors cursor-pointer"
                        title="View History & Audit Details"
                      >
                        <Eye size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── UTR / TRANSFER MODAL DIALOG ── */}
      <AnimatePresence>
        {utrModalTxn && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-[#E8EDF5] space-y-4"
            >
              <div className="flex items-center justify-between border-b border-[#F1F5F9] pb-3">
                <div className="flex items-center gap-2">
                  <Send size={20} className="text-[#2563EB]" />
                  <h3 className="text-[16px] font-bold text-[#0F172A]">Bank Transfer UTR Reference</h3>
                </div>
                <button onClick={() => setUtrModalTxn(null)} className="text-[#94A3B8] hover:text-[#0F172A] text-lg font-bold cursor-pointer">×</button>
              </div>

              <form onSubmit={handleSaveUTR} className="space-y-3 text-[12.5px]">
                <div>
                  <label className="block font-bold text-[#0F172A] mb-1">Transaction ID</label>
                  <input
                    type="text"
                    disabled
                    value={utrModalTxn.txn_id}
                    className="w-full px-3 py-2 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl font-mono text-[12.5px] font-bold text-[#64748B]"
                  />
                </div>

                <div>
                  <label className="block font-bold text-[#0F172A] mb-1">Beneficiary Name</label>
                  <input
                    type="text"
                    disabled
                    value={`${utrModalTxn.user_name} (${utrModalTxn.user_id})`}
                    className="w-full px-3 py-2 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-[12.5px] font-semibold text-[#64748B]"
                  />
                </div>

                <div>
                  <label className="block font-bold text-[#0F172A] mb-1">Transfer Amount</label>
                  <input
                    type="text"
                    disabled
                    value={`₹${utrModalTxn.amount.toLocaleString()}`}
                    className="w-full px-3 py-2 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-[13px] font-extrabold text-[#16A34A]"
                  />
                </div>

                <div>
                  <label className="block font-bold text-[#0F172A] mb-1">Bank UTR Transaction Reference *</label>
                  <input
                    type="text"
                    required
                    value={newUtrNumber}
                    onChange={(e) => setNewUtrNumber(e.target.value)}
                    placeholder="e.g. UTR-2026-9021-SBIN"
                    className="w-full px-3 py-2 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl font-mono text-[13px] font-bold text-[#2563EB] outline-none focus:border-[#2563EB]"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#F1F5F9]">
                  <button type="button" onClick={() => setUtrModalTxn(null)} className="btn btn-secondary btn-sm">
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary btn-sm flex items-center gap-1.5">
                    <Send size={13} /> Settle Bank Transfer
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};

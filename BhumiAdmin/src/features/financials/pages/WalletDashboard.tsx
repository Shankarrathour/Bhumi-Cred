import React, { useState } from 'react';
import {
  Wallet, ArrowDownRight, ArrowUpRight, CheckCircle2, XCircle,
  Clock, RefreshCw, Download, Eye, Check, X, IndianRupee
} from 'lucide-react';
import { motion } from 'framer-motion';
import {
  AreaChart, Area, ResponsiveContainer, Tooltip, CartesianGrid, XAxis, YAxis
} from 'recharts';
import { PageHeader } from '../../../components/ui/PageHeader';
import { FilterBar } from '../../../components/ui/FilterBar';
import { KpiCard } from '../../../components/ui/KpiCard';
import { ChartCard } from '../../../components/ui/ChartCard';
import { StatusBadge } from '../../../components/ui/StatusBadge';
import { EmptyState, SkeletonTable } from '../../../components/ui/EmptyState';
import { useWithdrawals, useApproveWithdrawal, useRejectWithdrawal } from '../api/useWallet';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

const WALLET_TREND = [
  { day: 'Mon', amount: 4.2 }, { day: 'Tue', amount: 6.1 }, { day: 'Wed', amount: 5.3 },
  { day: 'Thu', amount: 8.4 }, { day: 'Fri', amount: 7.2 }, { day: 'Sat', amount: 9.8 }, { day: 'Sun', amount: 12.8 },
];

export const WalletDashboard = () => {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [processingId, setProcessingId] = useState<string | null>(null);

  const { data, isLoading, refetch, isFetching } = useWithdrawals(page, 20);
  const approveW = useApproveWithdrawal();
  const rejectW  = useRejectWithdrawal();

  const withdrawals = data?.items ?? [];
  const total = data?.total ?? 0;
  const pages = data?.pages ?? 1;

  const filtered = withdrawals.filter(w => {
    const matchSearch = !search || w.farmer_id?.toLowerCase().includes(search.toLowerCase()) || w.id.includes(search);
    const matchStatus = !statusFilter || w.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const pendingCount  = withdrawals.filter(w => w.status === 'pending').length;
  const approvedCount = withdrawals.filter(w => w.status === 'approved').length;
  const totalAmount   = withdrawals.reduce((s, w) => s + w.amount, 0);

  const handleApprove = async (id: string) => {
    setProcessingId(id);
    try {
      await approveW.mutateAsync(id);
      toast.success('Withdrawal approved successfully');
    } catch { toast.error('Failed to approve withdrawal'); }
    finally { setProcessingId(null); }
  };

  const handleReject = async (id: string) => {
    setProcessingId(id);
    try {
      await rejectW.mutateAsync({ withdrawalId: id, reason: 'Rejected by admin' });
      toast.success('Withdrawal rejected');
    } catch { toast.error('Failed to reject withdrawal'); }
    finally { setProcessingId(null); }
  };

  const statusVariant = (s: string) =>
    s === 'approved' ? 'success' : s === 'rejected' ? 'danger' : 'warning';

  return (
    <div className="space-y-5 page-enter">
      <PageHeader
        title="Wallet & Financials"
        description="Manage farmer withdrawals, transaction history, and platform wallet balances."
        badge={{ label: `${pendingCount} Pending`, variant: pendingCount > 0 ? 'warning' : 'success' }}
        icon={Wallet}
        actions={
          <>
            <button onClick={() => refetch()} className="btn btn-secondary btn-sm">
              <RefreshCw size={13} className={isFetching ? 'animate-spin' : ''} />
            </button>
            <button className="btn btn-secondary btn-sm">
              <Download size={13} /> Export
            </button>
          </>
        }
      />

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KpiCard title="Total Withdrawals" value={total}           icon={Wallet}       iconBg="#F5F3FF" iconColor="#8B5CF6" loading={isLoading} />
        <KpiCard title="Pending"           value={pendingCount}    icon={Clock}        iconBg="#FFFBEB" iconColor="#F59E0B" loading={isLoading} />
        <KpiCard title="Approved"          value={approvedCount}   icon={CheckCircle2} iconBg="#F0FDF4" iconColor="#16A34A" loading={isLoading} />
        <KpiCard title="Total Volume"      value={`₹${(totalAmount/100000).toFixed(1)}L`} icon={IndianRupee} iconBg="#EFF6FF" iconColor="#2563EB" loading={isLoading} />
      </div>

      {/* Chart */}
      <ChartCard title="Withdrawal Volume" subtitle="Daily withdrawal requests (₹ Lakhs)" height={180}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={WALLET_TREND} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="gradWallet" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor="#8B5CF6" stopOpacity={0.15} />
                <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0}    />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
            <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
            <Tooltip formatter={(v: any) => [`₹${v}L`, 'Amount']} />
            <Area type="monotone" dataKey="amount" stroke="#8B5CF6" strokeWidth={2} fill="url(#gradWallet)" dot={false} />
          </AreaChart>
        </ResponsiveContainer>
      </ChartCard>

      {/* Table */}
      <div className="ent-card overflow-hidden">
        <div className="p-4 border-b border-[#F1F5F9]">
          <FilterBar
            search={search} onSearchChange={setSearch}
            searchPlaceholder="Search by farmer ID or withdrawal ID..."
            filters={[{
              key: 'status', label: 'Status', value: statusFilter, onChange: setStatusFilter,
              options: [
                { label: 'Pending',  value: 'pending'  },
                { label: 'Approved', value: 'approved' },
                { label: 'Rejected', value: 'rejected' },
              ],
            }]}
            onExport={() => {}}
            onRefresh={() => refetch()}
            loading={isFetching}
            resultCount={filtered.length}
          />
        </div>

        <div className="overflow-x-auto">
          <table className="ent-table">
            <thead>
              <tr>
                <th>Withdrawal ID</th>
                <th>Farmer</th>
                <th>Amount</th>
                <th>Requested At</th>
                <th>Processed At</th>
                <th>Status</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={7} className="p-0"><SkeletonTable rows={6} cols={6} /></td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={7}>
                  <EmptyState icon={Wallet} title="No withdrawal requests" description="All caught up! No pending or matching requests." />
                </td></tr>
              ) : filtered.map((w, i) => (
                <motion.tr
                  key={w.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.03 }}
                >
                  <td>
                    <span className="font-mono text-[12px] text-[#64748B] bg-[#F8FAFC] px-2 py-0.5 rounded-[6px]">
                      {w.id.slice(-10).toUpperCase()}
                    </span>
                  </td>
                  <td>
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-[8px] bg-[#F0FDF4] flex items-center justify-center text-[#16A34A] text-[11px] font-700 shrink-0" style={{ fontWeight: 700 }}>
                        F
                      </div>
                      <span className="text-[12.5px] text-[#64748B] font-mono">{w.farmer_id?.slice(-8) || '—'}</span>
                    </div>
                  </td>
                  <td>
                    <div className="flex items-center gap-1">
                      <ArrowUpRight size={13} className="text-[#EF4444]" />
                      <span className="text-[13px] font-600 text-[#EF4444]" style={{ fontWeight: 600 }}>₹{w.amount?.toLocaleString()}</span>
                    </div>
                  </td>
                  <td className="text-[12.5px] text-[#64748B]">
                    {new Date(w.requested_at).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
                  </td>
                  <td className="text-[12.5px] text-[#64748B]">
                    {w.processed_at ? new Date(w.processed_at).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }) : '—'}
                  </td>
                  <td>
                    <StatusBadge label={w.status} variant={statusVariant(w.status) as any} size="sm" />
                  </td>
                  <td>
                    <div className="flex items-center justify-end gap-1">
                      {w.status === 'pending' && (
                        <>
                          <button
                            onClick={() => handleApprove(w.id)}
                            disabled={processingId === w.id}
                            className="btn btn-sm gap-1 text-[#16A34A] bg-[#F0FDF4] border-[#BBF7D0] hover:bg-[#DCFCE7]"
                          >
                            <Check size={12} /> Approve
                          </button>
                          <button
                            onClick={() => handleReject(w.id)}
                            disabled={processingId === w.id}
                            className="btn btn-sm gap-1 text-[#EF4444] bg-[#FEF2F2] border-[#FECACA] hover:bg-[#FEE2E2]"
                          >
                            <X size={12} /> Reject
                          </button>
                        </>
                      )}
                      <button onClick={() => navigate(`/wallet/${w.id}`)} className="btn btn-ghost btn-icon btn-sm"><Eye size={14} /></button>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>

        {pages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-[#F1F5F9]">
            <span className="text-[12px] text-[#94A3B8]">Page {page} of {pages} · {total} total</span>
            <div className="flex gap-1">
              <button onClick={() => setPage(p => Math.max(1, p-1))} disabled={page === 1} className="btn btn-secondary btn-sm">Previous</button>
              <button onClick={() => setPage(p => Math.min(pages, p+1))} disabled={page === pages} className="btn btn-secondary btn-sm">Next</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

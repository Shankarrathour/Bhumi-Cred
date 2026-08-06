import React, { useState } from 'react';
import {
  Gift, Users, Award, TrendingUp, Search, Share2, Copy, Check, Filter, Download,
  CheckCircle, Clock, AlertTriangle, RefreshCw
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { PageHeader } from '../../../components/ui/PageHeader';
import { KpiCard } from '../../../components/ui/KpiCard';
import { StatusBadge } from '../../../components/ui/StatusBadge';

const REFERRAL_STATS = {
  totalReferrals: '3,842',
  activeCampaigns: '2 Active',
  totalPaidOut: '₹19,21,000',
  carbonBonusIssued: '38,420 tCO₂e',
};

const REFERRAL_LOGS = [
  { id: 'REF-9021', referrer: 'Ramesh Patel (F-84920)', referee: 'Suresh Verma', code: 'BHUMI-9021', date: '04 Aug 2026', rewardCash: '₹500', rewardCarbon: '10 tCO₂e', status: 'Approved' },
  { id: 'REF-9022', referrer: 'Mohan Singh (F-71029)', referee: 'Kavita Rao', code: 'BHUMI-1029', date: '03 Aug 2026', rewardCash: '₹500', rewardCarbon: '10 tCO₂e', status: 'Pending Land Verification' },
  { id: 'REF-9023', referrer: 'Anita Devi (F-40291)', referee: 'Rajesh Sharma', code: 'BHUMI-0291', date: '01 Aug 2026', rewardCash: '₹500', rewardCarbon: '10 tCO₂e', status: 'Approved' },
  { id: 'REF-9024', referrer: 'Virendra Kumar (F-50124)', referee: 'Deepak Patel', code: 'BHUMI-0124', date: '29 Jul 2026', rewardCash: '₹500', rewardCarbon: '10 tCO₂e', status: 'Approved' },
  { id: 'REF-9025', referrer: 'Sunita Sharma (F-30482)', referee: 'Manoj Verma', code: 'BHUMI-0482', date: '25 Jul 2026', rewardCash: '₹500', rewardCarbon: '10 tCO₂e', status: 'Rejected (Duplicate IP)' },
];

export const ReferralManagement = () => {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const filteredLogs = REFERRAL_LOGS.filter(r => {
    const matchesSearch = r.referrer.toLowerCase().includes(search.toLowerCase()) ||
                          r.referee.toLowerCase().includes(search.toLowerCase()) ||
                          r.code.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'All' || r.status.includes(statusFilter);
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6 page-enter pb-12" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>
      <PageHeader
        title="Referral & Earn Rewards Program"
        description="Monitor farmer referral campaigns, track code conversions, and manage automated cash + carbon disbursements."
        icon={Gift}
        iconColor="#16A34A"
        actions={
          <button
            onClick={() => {
              const csvStr = 'data:text/csv;charset=utf-8,ID,Referrer,Referee,Code,Date,Cash Reward,Carbon Reward,Status\n' +
                REFERRAL_LOGS.map(l => `${l.id},${l.referrer},${l.referee},${l.code},${l.date},${l.rewardCash},${l.rewardCarbon},${l.status}`).join('\n');
              const link = document.createElement('a');
              link.setAttribute('href', encodeURI(csvStr));
              link.setAttribute('download', 'Referral_Campaign_Report.csv');
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);
              triggerToast('Referral report exported to CSV');
            }}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-[#E2E8F0] hover:bg-[#F8FAFC] text-[#0F172A] font-semibold text-[13px] rounded-xl shadow-xs transition-all cursor-pointer"
          >
            <Download size={15} /> Export Referral Report
          </button>
        }
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          title="TOTAL REFERRALS"
          value={REFERRAL_STATS.totalReferrals}
          icon={Users}
          iconBg="#F0FDF4"
          iconColor="#16A34A"
          trend={24.5}
          sparkColor="#16A34A"
          sparkData={[20, 25, 30, 42, 55, 68, 85]}
        />
        <KpiCard
          title="ACTIVE CAMPAIGNS"
          value={REFERRAL_STATS.activeCampaigns}
          icon={Gift}
          iconBg="#EFF6FF"
          iconColor="#2563EB"
          trend={0.0}
          sparkColor="#2563EB"
          sparkData={[2, 2, 2, 2, 2, 2, 2]}
        />
        <KpiCard
          title="TOTAL CASH PAID"
          value={REFERRAL_STATS.totalPaidOut}
          icon={Award}
          iconBg="#FFFBEB"
          iconColor="#D97706"
          trend={18.2}
          sparkColor="#D97706"
          sparkData={[10, 12, 14, 16, 17, 18, 19]}
        />
        <KpiCard
          title="CARBON CREDITS ISSUED"
          value={REFERRAL_STATS.carbonBonusIssued}
          icon={TrendingUp}
          iconBg="#F5F3FF"
          iconColor="#8B5CF6"
          trend={32.1}
          sparkColor="#8B5CF6"
          sparkData={[12000, 18000, 24000, 31000, 38420]}
        />
      </div>

      {/* Campaign Config Card */}
      <div className="bg-white border border-[#E8EDF5] rounded-2xl p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-[#F1F5F9] pb-3">
          <h3 className="text-[15px] font-bold text-[#0F172A] flex items-center gap-2">
            <Gift size={18} className="text-[#16A34A]" /> Active Referral Campaign Rules
          </h3>
          <span className="px-2.5 py-0.5 bg-[#F0FDF4] text-[#16A34A] border border-[#DCFCE7] text-[11px] font-bold rounded-full">
            CAMPAIGN ACTIVE
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-[13px]">
          <div className="p-4 rounded-xl bg-[#FAFCFF] border border-[#F1F5F9]">
            <span className="text-[#94A3B8] font-semibold text-[11px] uppercase block mb-1">Inviter Reward</span>
            <span className="text-[18px] font-extrabold text-[#16A34A]">₹500 Cash + 10 tCO₂e</span>
            <span className="text-[#64748B] text-[11px] block mt-1">Credited upon referee land verification</span>
          </div>

          <div className="p-4 rounded-xl bg-[#FAFCFF] border border-[#F1F5F9]">
            <span className="text-[#94A3B8] font-semibold text-[11px] uppercase block mb-1">New Farmer Sign-up Bonus</span>
            <span className="text-[18px] font-extrabold text-[#2563EB]">₹500 Wallet Credit</span>
            <span className="text-[#64748B] text-[11px] block mt-1">Instant welcome credit in wallet</span>
          </div>

          <div className="p-4 rounded-xl bg-[#FAFCFF] border border-[#F1F5F9]">
            <span className="text-[#94A3B8] font-semibold text-[11px] uppercase block mb-1">Monthly Referral Cap</span>
            <span className="text-[18px] font-extrabold text-[#0F172A]">50 Farmers / User</span>
            <span className="text-[#64748B] text-[11px] block mt-1">Maximum ₹25,000 monthly earning limit</span>
          </div>
        </div>
      </div>

      {/* Referrals Activity Table */}
      <div className="bg-white border border-[#E8EDF5] rounded-2xl p-6 shadow-xs space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#F1F5F9] pb-4">
          <h3 className="text-[15px] font-bold text-[#0F172A]">Referral Conversions & Disbursements</h3>

          <div className="flex items-center gap-3">
            {/* Search */}
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8]" />
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search referrer, code..."
                className="h-9 pl-9 pr-3 text-[12px] bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl outline-none focus:border-[#16A34A]"
              />
            </div>

            {/* Filter */}
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="h-9 px-3 text-[12px] bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl outline-none font-medium"
            >
              <option value="All">All Statuses</option>
              <option value="Approved">Approved</option>
              <option value="Pending">Pending</option>
              <option value="Rejected">Rejected</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-[13px]">
            <thead>
              <tr className="border-b border-[#F1F5F9] text-[#94A3B8] font-bold uppercase text-[11px]">
                <th className="py-2.5 px-3">Ref ID</th>
                <th className="py-2.5 px-3">Inviter (Referrer)</th>
                <th className="py-2.5 px-3">Joined Farmer (Referee)</th>
                <th className="py-2.5 px-3">Code Used</th>
                <th className="py-2.5 px-3">Date</th>
                <th className="py-2.5 px-3">Rewards</th>
                <th className="py-2.5 px-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F8FAFC]">
              {filteredLogs.map((log) => (
                <tr key={log.id} className="hover:bg-[#F8FAFC] transition-colors">
                  <td className="py-3 px-3 font-bold text-[#2563EB]">{log.id}</td>
                  <td className="py-3 px-3 font-semibold text-[#0F172A]">{log.referrer}</td>
                  <td className="py-3 px-3 text-[#475569]">{log.referee}</td>
                  <td className="py-3 px-3 font-mono font-bold text-[#16A34A]">{log.code}</td>
                  <td className="py-3 px-3 text-[#94A3B8] text-[12px]">{log.date}</td>
                  <td className="py-3 px-3 font-bold text-[#0F172A]">
                    {log.rewardCash} <span className="text-[#16A34A] text-[11px] font-medium">+ {log.rewardCarbon}</span>
                  </td>
                  <td className="py-3 px-3">
                    <StatusBadge
                      status={log.status === 'Approved' ? 'success' : log.status.includes('Pending') ? 'warning' : 'danger'}
                      label={log.status}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Floating Toast Notification */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className="fixed bottom-6 right-6 z-50 bg-[#0F172A] text-white px-5 py-3.5 rounded-xl shadow-2xl flex items-center gap-3 border border-slate-700"
          >
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs font-semibold">{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

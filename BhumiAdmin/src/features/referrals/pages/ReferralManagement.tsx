import { useState } from 'react';
import {
  Gift, Users, Award, TrendingUp, Search, Download, Plus,
  CheckCircle, XCircle, Edit3, PauseCircle, PlayCircle, X
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { PageHeader } from '../../../components/ui/PageHeader';
import { KpiCard } from '../../../components/ui/KpiCard';
import { StatusBadge } from '../../../components/ui/StatusBadge';
import toast from 'react-hot-toast';

export interface ReferralCampaign {
  id: string;
  name: string;
  targetCategory: string;
  inviterCashReward: number;
  inviterCarbonReward: number;
  refereeWelcomeBonus: number;
  triggerCondition: string;
  monthlyLimit: number;
  startDate: string;
  endDate: string;
  status: 'Active' | 'Paused' | 'Expired';
}

const INITIAL_CAMPAIGNS: ReferralCampaign[] = [
  {
    id: 'CAM-2026-01',
    name: 'Kisan Mitra Referral Scheme V2',
    targetCategory: 'Farmers',
    inviterCashReward: 500,
    inviterCarbonReward: 10,
    refereeWelcomeBonus: 500,
    triggerCondition: 'Land Verification Completed',
    monthlyLimit: 50,
    startDate: '01 Jan 2026',
    endDate: '31 Dec 2026',
    status: 'Active',
  },
  {
    id: 'CAM-2026-02',
    name: 'Monsoon Afforestation Tree Bonus',
    targetCategory: 'All Users',
    inviterCashReward: 1000,
    inviterCarbonReward: 25,
    refereeWelcomeBonus: 750,
    triggerCondition: 'First 10 Trees Planted',
    monthlyLimit: 20,
    startDate: '01 Jun 2026',
    endDate: '30 Sep 2026',
    status: 'Active',
  },
  {
    id: 'CAM-2025-09',
    name: 'Govt Nodal Officer Onboarding Bonus',
    targetCategory: 'Government',
    inviterCashReward: 2500,
    inviterCarbonReward: 50,
    refereeWelcomeBonus: 2500,
    triggerCondition: 'Official MOU Signed',
    monthlyLimit: 10,
    startDate: '01 Oct 2025',
    endDate: '31 Dec 2025',
    status: 'Expired',
  },
];

const INITIAL_LOGS = [
  { id: 'REF-9021', referrer: 'Ramesh Patel (F-84920)', referee: 'Suresh Verma', code: 'BHUMI-9021', date: '04 Aug 2026', rewardCash: 500, rewardCarbon: 10, status: 'Approved' },
  { id: 'REF-9022', referrer: 'Mohan Singh (F-71029)', referee: 'Kavita Rao', code: 'BHUMI-1029', date: '03 Aug 2026', rewardCash: 500, rewardCarbon: 10, status: 'Pending Verification' },
  { id: 'REF-9023', referrer: 'Anita Devi (F-40291)', referee: 'Rajesh Sharma', code: 'BHUMI-0291', date: '01 Aug 2026', rewardCash: 500, rewardCarbon: 10, status: 'Approved' },
  { id: 'REF-9024', referrer: 'Virendra Kumar (F-50124)', referee: 'Deepak Patel', code: 'BHUMI-0124', date: '29 Jul 2026', rewardCash: 500, rewardCarbon: 10, status: 'Approved' },
  { id: 'REF-9025', referrer: 'Sunita Sharma (F-30482)', referee: 'Manoj Verma', code: 'BHUMI-0482', date: '25 Jul 2026', rewardCash: 500, rewardCarbon: 10, status: 'Rejected' },
];

export const ReferralManagement = () => {
  const [campaigns, setCampaigns] = useState<ReferralCampaign[]>(INITIAL_CAMPAIGNS);
  const [logs, setLogs] = useState(INITIAL_LOGS);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState<ReferralCampaign | null>(null);

  // Form Fields for Create / Edit Campaign
  const [formName, setFormName] = useState('');
  const [formTarget, setFormTarget] = useState('Farmers');
  const [formInviterCash, setFormInviterCash] = useState('500');
  const [formInviterCarbon, setFormInviterCarbon] = useState('10');
  const [formRefereeBonus, setFormRefereeBonus] = useState('500');
  const [formTrigger, setFormTrigger] = useState('Land Verification Completed');
  const [formLimit, setFormLimit] = useState('50');
  const [formStartDate, setFormStartDate] = useState('2026-08-01');
  const [formEndDate, setFormEndDate] = useState('2026-12-31');

  const openCreateModal = () => {
    setEditingCampaign(null);
    setFormName('');
    setFormTarget('Farmers');
    setFormInviterCash('500');
    setFormInviterCarbon('10');
    setFormRefereeBonus('500');
    setFormTrigger('Land Verification Completed');
    setFormLimit('50');
    setFormStartDate('2026-08-01');
    setFormEndDate('2026-12-31');
    setIsModalOpen(true);
  };

  const openEditModal = (c: ReferralCampaign) => {
    setEditingCampaign(c);
    setFormName(c.name);
    setFormTarget(c.targetCategory);
    setFormInviterCash(c.inviterCashReward.toString());
    setFormInviterCarbon(c.inviterCarbonReward.toString());
    setFormRefereeBonus(c.refereeWelcomeBonus.toString());
    setFormTrigger(c.triggerCondition);
    setFormLimit(c.monthlyLimit.toString());
    setIsModalOpen(true);
  };

  const handleSaveCampaign = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      toast.error('Please enter a campaign name');
      return;
    }

    if (editingCampaign) {
      setCampaigns(prev => prev.map(c => c.id === editingCampaign.id ? {
        ...c,
        name: formName,
        targetCategory: formTarget,
        inviterCashReward: Number(formInviterCash) || 0,
        inviterCarbonReward: Number(formInviterCarbon) || 0,
        refereeWelcomeBonus: Number(formRefereeBonus) || 0,
        triggerCondition: formTrigger,
        monthlyLimit: Number(formLimit) || 1,
      } : c));
      toast.success(`Campaign "${formName}" updated successfully!`);
    } else {
      const newCamp: ReferralCampaign = {
        id: `CAM-2026-0${campaigns.length + 1}`,
        name: formName,
        targetCategory: formTarget,
        inviterCashReward: Number(formInviterCash) || 0,
        inviterCarbonReward: Number(formInviterCarbon) || 0,
        refereeWelcomeBonus: Number(formRefereeBonus) || 0,
        triggerCondition: formTrigger,
        monthlyLimit: Number(formLimit) || 1,
        startDate: formStartDate,
        endDate: formEndDate,
        status: 'Active',
      };
      setCampaigns([newCamp, ...campaigns]);
      toast.success(`New Campaign "${formName}" created & activated!`);
    }

    setIsModalOpen(false);
  };

  const toggleCampaignStatus = (id: string) => {
    setCampaigns(prev => prev.map(c => {
      if (c.id === id) {
        const nextStatus = c.status === 'Active' ? 'Paused' : 'Active';
        toast.success(`Campaign ${c.name} is now ${nextStatus}`);
        return { ...c, status: nextStatus };
      }
      return c;
    }));
  };

  const handleLogStatusChange = (logId: string, newStatus: string) => {
    setLogs(prev => prev.map(l => l.id === logId ? { ...l, status: newStatus } : l));
    toast.success(`Referral ${logId} marked as ${newStatus}`);
  };

  const filteredLogs = logs.filter(r => {
    const q = search.toLowerCase();
    const matchesSearch = !q || r.referrer.toLowerCase().includes(q) || r.referee.toLowerCase().includes(q) || r.code.toLowerCase().includes(q);
    const matchesStatus = statusFilter === 'All' || r.status.includes(statusFilter);
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6 page-enter pb-12" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>

      {/* ── Page Header ── */}
      <PageHeader
        title="Referral & Earn Rewards Program"
        description="Module 15: Create custom referral campaigns, configure reward amounts (cash + carbon credits), and approve payouts."
        icon={Gift}
        iconColor="#16A34A"
        actions={
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                const csvStr = 'data:text/csv;charset=utf-8,ID,Referrer,Referee,Code,Date,Cash Reward,Carbon Reward,Status\n' +
                  logs.map(l => `${l.id},${l.referrer},${l.referee},${l.code},${l.date},₹${l.rewardCash},${l.rewardCarbon} tCO2e,${l.status}`).join('\n');
                const link = document.createElement('a');
                link.setAttribute('href', encodeURI(csvStr));
                link.setAttribute('download', 'Referral_Disbursements.csv');
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                toast.success('Referral report exported to CSV');
              }}
              className="px-3.5 py-2 bg-white border border-[#E2E8F0] hover:bg-[#F8FAFC] text-[#0F172A] font-bold text-[12.5px] rounded-xl shadow-xs transition-all cursor-pointer flex items-center gap-1.5"
            >
              <Download size={14} /> Export Report
            </button>
            <button
              onClick={openCreateModal}
              className="px-4 py-2 bg-[#16A34A] hover:bg-[#15803D] text-white font-bold text-[12.5px] rounded-xl shadow-xs transition-all cursor-pointer flex items-center gap-1.5"
            >
              <Plus size={15} /> Create Referral Campaign
            </button>
          </div>
        }
      />

      {/* ── KPI Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard title="TOTAL REFERRALS" value="3,842" icon={Users} iconBg="#F0FDF4" iconColor="#16A34A" trend={24.5} sparkColor="#16A34A" sparkData={[20, 25, 30, 42, 55, 68, 85]} />
        <KpiCard title="ACTIVE CAMPAIGNS" value={`${campaigns.filter(c=>c.status==='Active').length} Active`} icon={Gift} iconBg="#EFF6FF" iconColor="#2563EB" trend={0.0} sparkColor="#2563EB" sparkData={[2, 2, 3, 3, 2, 3]} />
        <KpiCard title="TOTAL CASH DISBURSED" value="₹19.21 Lakhs" icon={Award} iconBg="#FFFBEB" iconColor="#D97706" trend={18.2} sparkColor="#D97706" sparkData={[10, 12, 14, 16, 17, 18, 19]} />
        <KpiCard title="CARBON BONUSES ISSUED" value="38,420 tCO₂e" icon={TrendingUp} iconBg="#F5F3FF" iconColor="#8B5CF6" trend={32.1} sparkColor="#8B5CF6" sparkData={[12000, 18000, 24000, 31000, 38420]} />
      </div>

      {/* ── CAMPAIGN RULES & CREATOR SECTION ── */}
      <div className="bg-white border border-[#E8EDF5] rounded-2xl p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-[#F1F5F9] pb-3">
          <div className="flex items-center gap-2">
            <Gift size={18} className="text-[#16A34A]" />
            <h3 className="text-[15px] font-bold text-[#0F172A]">Active Referral Campaigns & Reward Schemes</h3>
          </div>
          <button
            onClick={openCreateModal}
            className="text-[12px] font-bold text-[#16A34A] hover:underline flex items-center gap-1 cursor-pointer"
          >
            <Plus size={13} /> Add New Campaign
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {campaigns.map((c) => (
            <div key={c.id} className="p-4 rounded-2xl border border-[#E8EDF5] bg-[#FAFCFF] space-y-3 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[11px] font-mono font-bold text-[#64748B]">{c.id}</span>
                  <StatusBadge status={c.status === 'Active' ? 'success' : c.status === 'Paused' ? 'warning' : 'danger'} label={c.status} size="sm" />
                </div>
                <h4 className="text-[14px] font-bold text-[#0F172A] mt-1">{c.name}</h4>
                <p className="text-[11px] text-[#64748B] font-medium">Target: {c.targetCategory} • Trigger: {c.triggerCondition}</p>

                <div className="mt-3 p-3 bg-white border border-[#F1F5F9] rounded-xl space-y-1.5 text-[12px]">
                  <div className="flex justify-between items-center">
                    <span className="text-[#94A3B8] font-medium">Inviter Cash:</span>
                    <span className="font-bold text-[#16A34A]">₹{c.inviterCashReward}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[#94A3B8] font-medium">Inviter Carbon Bonus:</span>
                    <span className="font-bold text-[#8B5CF6]">{c.inviterCarbonReward} tCO₂e</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[#94A3B8] font-medium">Referee Welcome Bonus:</span>
                    <span className="font-bold text-[#2563EB]">₹{c.refereeWelcomeBonus}</span>
                  </div>
                  <div className="flex justify-between items-center pt-1 border-t border-[#F1F5F9]">
                    <span className="text-[#94A3B8] font-medium">Monthly Cap:</span>
                    <span className="font-semibold text-[#0F172A]">{c.monthlyLimit} / month</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons for Campaign */}
              <div className="flex items-center justify-between pt-2 border-t border-[#F1F5F9]">
                <button
                  onClick={() => toggleCampaignStatus(c.id)}
                  className={`px-2.5 py-1 text-[11.5px] font-bold rounded-lg transition-colors flex items-center gap-1 cursor-pointer ${
                    c.status === 'Active' ? 'bg-[#FFFBEB] text-[#D97706] hover:bg-[#FEF3C7]' : 'bg-[#F0FDF4] text-[#16A34A] hover:bg-[#DCFCE7]'
                  }`}
                >
                  {c.status === 'Active' ? <PauseCircle size={13} /> : <PlayCircle size={13} />}
                  <span>{c.status === 'Active' ? 'Pause' : 'Activate'}</span>
                </button>

                <button
                  onClick={() => openEditModal(c)}
                  className="px-2.5 py-1 bg-[#EFF6FF] hover:bg-[#DBEAFE] text-[#2563EB] text-[11.5px] font-bold rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <Edit3 size={13} /> Edit Rates
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── REFERRAL DISBURSEMENTS TABLE ── */}
      <div className="bg-white border border-[#E8EDF5] rounded-2xl p-6 shadow-xs space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#F1F5F9] pb-4">
          <div>
            <h3 className="text-[15px] font-bold text-[#0F172A]">Referral Conversions & Payout Ledger</h3>
            <p className="text-[12px] text-[#64748B]">Real-time tracking of referrals, sign-up codes, and bonus disbursements.</p>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8]" />
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search referrer, referee, code..."
                className="h-9 pl-9 pr-3 text-[12px] bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl outline-none focus:border-[#16A34A]"
              />
            </div>

            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="h-9 px-3 text-[12px] bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl outline-none font-medium"
            >
              <option value="All">All Statuses</option>
              <option value="Approved">Approved</option>
              <option value="Pending">Pending Verification</option>
              <option value="Rejected">Rejected</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left text-[13px] min-w-[900px]">
            <thead>
              <tr className="border-b border-[#F1F5F9] text-[#94A3B8] font-bold uppercase text-[11px]">
                <th className="py-2.5 px-3">Ref ID</th>
                <th className="py-2.5 px-3">Inviter (Referrer)</th>
                <th className="py-2.5 px-3">Joined Farmer (Referee)</th>
                <th className="py-2.5 px-3">Code Used</th>
                <th className="py-2.5 px-3">Date</th>
                <th className="py-2.5 px-3">Cash + Carbon Reward</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F8FAFC]">
              {filteredLogs.map((log) => (
                <tr key={log.id} className="hover:bg-[#F8FAFC] transition-colors">
                  <td className="py-3 px-3 font-mono font-bold text-[#2563EB]">{log.id}</td>
                  <td className="py-3 px-3 font-semibold text-[#0F172A]">{log.referrer}</td>
                  <td className="py-3 px-3 text-[#475569]">{log.referee}</td>
                  <td className="py-3 px-3 font-mono font-bold text-[#16A34A]">{log.code}</td>
                  <td className="py-3 px-3 text-[#94A3B8] text-[12px]">{log.date}</td>
                  <td className="py-3 px-3 font-bold text-[#0F172A]">
                    ₹{log.rewardCash} <span className="text-[#8B5CF6] text-[11px] font-medium">+ {log.rewardCarbon} tCO₂e</span>
                  </td>
                  <td className="py-3 px-3">
                    <StatusBadge
                      status={log.status === 'Approved' ? 'success' : log.status.includes('Pending') ? 'warning' : 'danger'}
                      label={log.status}
                    />
                  </td>
                  <td className="py-3 px-3 text-right">
                    {log.status.includes('Pending') ? (
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleLogStatusChange(log.id, 'Approved')}
                          className="px-2 py-1 bg-[#F0FDF4] hover:bg-[#DCFCE7] text-[#16A34A] text-[11px] font-bold rounded-lg cursor-pointer flex items-center gap-1"
                        >
                          <CheckCircle size={12} /> Approve
                        </button>
                        <button
                          onClick={() => handleLogStatusChange(log.id, 'Rejected')}
                          className="px-2 py-1 bg-[#FEF2F2] hover:bg-[#FEE2E2] text-[#EF4444] text-[11px] font-bold rounded-lg cursor-pointer flex items-center gap-1"
                        >
                          <XCircle size={12} /> Reject
                        </button>
                      </div>
                    ) : (
                      <span className="text-[11px] font-medium text-[#94A3B8]">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── CREATE / EDIT CAMPAIGN MODAL ── */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-[#E8EDF5] space-y-5"
            >
              <div className="flex items-center justify-between border-b border-[#F1F5F9] pb-3">
                <div className="flex items-center gap-2">
                  <Gift size={20} className="text-[#16A34A]" />
                  <h3 className="text-[16px] font-bold text-[#0F172A]">
                    {editingCampaign ? 'Edit Referral Campaign & Rates' : 'Create New Referral Campaign'}
                  </h3>
                </div>
                <button onClick={() => setIsModalOpen(false)} className="text-[#94A3B8] hover:text-[#0F172A] cursor-pointer">
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleSaveCampaign} className="space-y-4 text-[13px]">
                <div>
                  <label className="block text-[11.5px] font-bold text-[#0F172A] mb-1">Campaign Name</label>
                  <input
                    type="text"
                    required
                    value={formName}
                    onChange={e => setFormName(e.target.value)}
                    placeholder="e.g. Kisan Mitra Monsoon Bonus 2026"
                    className="w-full px-3.5 py-2 bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl text-[#0F172A] font-medium outline-none focus:border-[#16A34A]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11.5px] font-bold text-[#0F172A] mb-1">Target User Group</label>
                    <select
                      value={formTarget}
                      onChange={e => setFormTarget(e.target.value)}
                      className="w-full px-3 py-2 bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl text-[#0F172A] font-medium outline-none"
                    >
                      <option value="Farmers">Farmers</option>
                      <option value="Government">Government Bodies</option>
                      <option value="Partners">Partners</option>
                      <option value="All Users">All Users</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11.5px] font-bold text-[#0F172A] mb-1">Trigger Condition</label>
                    <select
                      value={formTrigger}
                      onChange={e => setFormTrigger(e.target.value)}
                      className="w-full px-3 py-2 bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl text-[#0F172A] font-medium outline-none"
                    >
                      <option value="Land Verification Completed">Land Verification Completed</option>
                      <option value="App Sign-up">App Sign-up</option>
                      <option value="First Tree Planted">First Tree Planted</option>
                      <option value="MOU Signed">MOU Signed</option>
                    </select>
                  </div>
                </div>

                <div className="p-4 bg-[#F0FDF4] border border-[#DCFCE7] rounded-xl space-y-3">
                  <h4 className="text-[12px] font-bold text-[#16A34A] uppercase tracking-wider">Reward & Bonus Amounts</h4>
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-[#475569] mb-1">Inviter Cash (₹)</label>
                      <input
                        type="number"
                        value={formInviterCash}
                        onChange={e => setFormInviterCash(e.target.value)}
                        className="w-full px-3 py-1.5 bg-white border border-[#CBD5E1] rounded-lg font-bold text-[#16A34A]"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-[#475569] mb-1">Carbon Bonus (tCO₂e)</label>
                      <input
                        type="number"
                        value={formInviterCarbon}
                        onChange={e => setFormInviterCarbon(e.target.value)}
                        className="w-full px-3 py-1.5 bg-white border border-[#CBD5E1] rounded-lg font-bold text-[#8B5CF6]"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-[#475569] mb-1">Referee Bonus (₹)</label>
                      <input
                        type="number"
                        value={formRefereeBonus}
                        onChange={e => setFormRefereeBonus(e.target.value)}
                        className="w-full px-3 py-1.5 bg-white border border-[#CBD5E1] rounded-lg font-bold text-[#2563EB]"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11.5px] font-bold text-[#0F172A] mb-1">Max Referrals / User / Month</label>
                    <input
                      type="number"
                      value={formLimit}
                      onChange={e => setFormLimit(e.target.value)}
                      className="w-full px-3 py-2 bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl text-[#0F172A] font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-[11.5px] font-bold text-[#0F172A] mb-1">Start & End Dates</label>
                    <div className="flex items-center gap-1.5 text-[11px] text-[#64748B]">
                      <input type="date" value={formStartDate} onChange={e => setFormStartDate(e.target.value)} className="w-full p-1 border border-[#CBD5E1] rounded-lg" />
                      <span>to</span>
                      <input type="date" value={formEndDate} onChange={e => setFormEndDate(e.target.value)} className="w-full p-1 border border-[#CBD5E1] rounded-lg" />
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#F1F5F9]">
                  <button type="button" onClick={() => setIsModalOpen(false)} className="btn btn-secondary btn-sm">Cancel</button>
                  <button type="submit" className="btn btn-primary btn-sm">Save & Activate Campaign</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};

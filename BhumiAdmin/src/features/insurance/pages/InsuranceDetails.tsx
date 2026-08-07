import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, ShieldCheck, DollarSign, Download, Sparkles,
  Cpu, FileText, User
} from 'lucide-react';
import { StatusBadge } from '../../../components/ui/StatusBadge';
import { KpiCard } from '../../../components/ui/KpiCard';
import toast from 'react-hot-toast';

export const InsuranceDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'info' | 'farmers' | 'claims' | 'weather' | 'commission'>('info');

  const safeId = id || 'INS-800101';

  const policy = {
    id: safeId,
    policyNumber: `POL-HDFC-TEAK-${safeId.slice(-4).toUpperCase()}`,
    name: 'Teak Tree Weather & Fire Guard',
    provider: 'HDFC ERGO Agri Insurance',
    speciesCovered: 'Teak (Tectona grandis)',
    premiumPerTree: 50,
    coverageAmount: 500000,
    enrolledTrees: 42500,
    totalPremiumCollected: 2125000,
    commissionEarned: 318750,
    claimsCount: 3,
    surveyStatus: 'Completed',
    status: 'Active',
  };

  return (
    <div className="space-y-6 page-enter pb-12" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>

      {/* ── HEADER & CONTROL BAR ── */}
      <div className="bg-white border border-[#E8EDF5] rounded-2xl p-5 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3.5 min-w-0">
          <button
            onClick={() => navigate('/insurance')}
            className="w-10 h-10 rounded-xl border border-[#E2E8F0] bg-white flex items-center justify-center text-[#64748B] hover:text-[#0F172A] hover:bg-[#F8FAFC] transition-all cursor-pointer"
            title="Back to Insurance Policies"
          >
            <ArrowLeft size={18} />
          </button>
          <div className="w-11 h-11 rounded-2xl bg-[#F0FDF4] border border-[#DCFCE7] flex items-center justify-center text-[#16A34A] shrink-0">
            <ShieldCheck size={22} />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-[18px] font-bold text-[#0F172A]">{policy.name}</h1>
              <span className="font-mono text-[11px] font-bold text-[#2563EB] bg-[#EFF6FF] px-2.5 py-0.5 rounded-md border border-[#DBEAFE]">
                {policy.policyNumber}
              </span>
              <StatusBadge label={policy.status} variant="success" size="sm" />
            </div>
            <p className="text-[12px] text-[#64748B] mt-0.5 flex items-center gap-2">
              <span>{policy.provider}</span> • <span>Species: {policy.speciesCovered}</span>
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          <button onClick={() => toast.success('Exported Policy Terms & Underwriter SLA document')} className="btn btn-secondary btn-sm gap-1.5 cursor-pointer">
            <Download size={14} /> Policy SLA Document
          </button>
          <button onClick={() => toast.success('Initiated annual policy renewal notice dispatch')} className="btn btn-primary btn-sm gap-1.5 cursor-pointer">
            <Sparkles size={14} /> Renew Policy
          </button>
        </div>
      </div>

      {/* ── KPI METRIC CARDS ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KpiCard title="TOTAL COVERAGE AMOUNT" value={`₹${policy.coverageAmount.toLocaleString()}`} icon={ShieldCheck} iconBg="#F0FDF4" iconColor="#16A34A" />
        <KpiCard title="TOTAL PREMIUM COLLECTED" value={`₹${(policy.totalPremiumCollected / 100000).toFixed(2)} Lakhs`} icon={DollarSign} iconBg="#EFF6FF" iconColor="#2563EB" />
        <KpiCard title="ENROLLED TREES" value={policy.enrolledTrees.toLocaleString()} icon={User} iconBg="#F5F3FF" iconColor="#8B5CF6" />
        <KpiCard title="PLATFORM COMMISSION (15%)" value={`₹${policy.commissionEarned.toLocaleString()}`} icon={Sparkles} iconBg="#FFFBEB" iconColor="#D97706" />
      </div>

      {/* ── INTERACTIVE TABS NAV ── */}
      <div className="bg-white border border-[#E8EDF5] rounded-2xl p-1.5 shadow-xs flex items-center gap-1">
        {[
          { id: 'info', label: '1. Policy Info & Terms', icon: FileText },
          { id: 'farmers', label: '2. Enrolled Farmers & Plots', icon: User },
          { id: 'claims', label: '3. Loss Claims & Settlement', icon: ShieldCheck },
          { id: 'weather', label: '4. Drone & Weather Telemetry', icon: Cpu },
          { id: 'commission', label: '5. Premium & Commission', icon: DollarSign },
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

      {/* ── TAB 1: POLICY INFO & TERMS ── */}
      {activeTab === 'info' && (
        <div className="bg-white border border-[#E8EDF5] rounded-2xl p-6 shadow-xs space-y-4">
          <h3 className="text-[15px] font-bold text-[#0F172A] flex items-center gap-2">
            <FileText size={18} className="text-[#16A34A]" /> Underwriter Terms & Coverage Parameters
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl space-y-1">
              <span className="text-[11px] font-bold text-[#64748B]">Underwriter Provider</span>
              <p className="text-[14px] font-bold text-[#0F172A]">{policy.provider}</p>
            </div>
            <div className="p-4 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl space-y-1">
              <span className="text-[11px] font-bold text-[#64748B]">Premium Rate</span>
              <p className="text-[14px] font-bold text-[#16A34A]">₹{policy.premiumPerTree} / tree / year</p>
            </div>
            <div className="p-4 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl space-y-1">
              <span className="text-[11px] font-bold text-[#64748B]">Covered Species</span>
              <p className="text-[14px] font-bold text-[#2563EB]">{policy.speciesCovered}</p>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 2: ENROLLED FARMERS ── */}
      {activeTab === 'farmers' && (
        <div className="ent-card overflow-hidden">
          <div className="p-4 border-b border-[#F1F5F9] flex items-center justify-between">
            <h3 className="text-[14px] font-bold text-[#0F172A]">Farmers Enrolled Under Policy</h3>
            <span className="text-[11px] font-bold text-[#16A34A] bg-[#F0FDF4] px-2 py-0.5 rounded-full border border-[#DCFCE7]">
              125 Farmers
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="ent-table min-w-[900px]">
              <thead>
                <tr>
                  <th>Farmer Name & ID</th>
                  <th>Location</th>
                  <th>Insured Trees</th>
                  <th>Premium Paid</th>
                  <th>Covered Amount</th>
                  <th>Policy Status</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { name: 'Ramesh Patel', id: 'F-84920', loc: 'Ichhawar, Sehore', trees: '850', prem: '₹42,500', cover: '₹4,25,000', status: 'Covered' },
                  { name: 'Suresh Verma', id: 'F-71029', loc: 'Ashta, Sehore', trees: '600', prem: '₹30,000', cover: '₹3,00,000', status: 'Covered' },
                ].map((f, i) => (
                  <tr key={i}>
                    <td>
                      <div className="text-[13px] font-bold text-[#0F172A]">{f.name}</div>
                      <div className="text-[11px] font-mono text-[#64748B]">{f.id}</div>
                    </td>
                    <td className="text-[12.5px] text-[#475569]">{f.loc}</td>
                    <td className="text-[13px] font-bold text-[#0F172A]">{f.trees} Trees</td>
                    <td className="text-[13px] font-bold text-[#16A34A]">{f.prem}</td>
                    <td className="text-[13px] font-bold text-[#2563EB]">{f.cover}</td>
                    <td><StatusBadge label={f.status} variant="success" size="sm" /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── TAB 3: LOSS CLAIMS ── */}
      {activeTab === 'claims' && (
        <div className="bg-white border border-[#E8EDF5] rounded-2xl p-6 shadow-xs space-y-4">
          <h3 className="text-[15px] font-bold text-[#0F172A] flex items-center gap-2">
            <ShieldCheck size={18} className="text-[#16A34A]" /> Loss Claims & Payout Disbursements
          </h3>

          <div className="p-4 bg-[#F0FDF4] border border-[#DCFCE7] rounded-xl flex items-center justify-between">
            <div>
              <span className="text-[11px] font-bold text-[#16A34A]">Claims Settled This Year</span>
              <p className="text-[20px] font-extrabold text-[#16A34A]">3 Claims Settled (₹1.08 Lakhs Payout)</p>
            </div>
            <StatusBadge label="100% Payout Rate" variant="success" size="md" />
          </div>
        </div>
      )}

      {/* ── TAB 4: WEATHER TELEMETRY ── */}
      {activeTab === 'weather' && (
        <div className="bg-white border border-[#E8EDF5] rounded-2xl p-6 shadow-xs space-y-4">
          <h3 className="text-[15px] font-bold text-[#0F172A] flex items-center gap-2">
            <Cpu size={18} className="text-[#2563EB]" /> Drone & Satellite Damage Survey Telemetry
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl">
              <span className="text-[11px] font-bold text-[#64748B]">Pre-Disaster NDVI</span>
              <p className="text-[20px] font-bold text-[#16A34A]">0.84 NDVI</p>
            </div>
            <div className="p-4 bg-[#FEF2F2] border border-[#FECACA] rounded-xl">
              <span className="text-[11px] font-bold text-[#EF4444]">Post-Disaster Loss Index</span>
              <p className="text-[20px] font-bold text-[#EF4444]">12% Canopy Loss</p>
            </div>
            <div className="p-4 bg-[#F0FDF4] border border-[#DCFCE7] rounded-xl">
              <span className="text-[11px] font-bold text-[#16A34A]">Audit Verification</span>
              <p className="text-[20px] font-bold text-[#16A34A]">100% Verified</p>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 5: COMMISSION DISTRIBUTION ── */}
      {activeTab === 'commission' && (
        <div className="bg-white border border-[#E8EDF5] rounded-2xl p-6 shadow-xs space-y-4">
          <h3 className="text-[15px] font-bold text-[#0F172A] flex items-center gap-2">
            <DollarSign size={18} className="text-[#8B5CF6]" /> Premium Monetization & Partner Commission Split
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-[#FAFAFA] border border-[#E5E5E5] rounded-xl">
              <span className="text-[11px] font-bold text-[#525252]">Total Premium Collected</span>
              <p className="text-[22px] font-extrabold text-[#0F172A]">₹{(policy.totalPremiumCollected / 100000).toFixed(2)} Lakhs</p>
            </div>
            <div className="p-4 bg-[#EFF6FF] border border-[#DBEAFE] rounded-xl">
              <span className="text-[11px] font-bold text-[#2563EB]">Underwriter Share (85%)</span>
              <p className="text-[22px] font-extrabold text-[#2563EB]">₹{((policy.totalPremiumCollected * 0.85) / 100000).toFixed(2)} Lakhs</p>
            </div>
            <div className="p-4 bg-[#F5F3FF] border border-[#DDD6FE] rounded-xl">
              <span className="text-[11px] font-bold text-[#8B5CF6]">Platform Commission (15%)</span>
              <p className="text-[22px] font-extrabold text-[#8B5CF6]">₹{(policy.commissionEarned / 100000).toFixed(2)} Lakhs</p>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

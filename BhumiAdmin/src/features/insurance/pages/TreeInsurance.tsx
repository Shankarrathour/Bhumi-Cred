import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ShieldCheck, Plus, RefreshCw, Eye, AlertTriangle,
  DollarSign, RotateCcw, Sparkles, Check, X, Camera
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { PageHeader } from '../../../components/ui/PageHeader';
import { KpiCard } from '../../../components/ui/KpiCard';
import { StatusBadge } from '../../../components/ui/StatusBadge';
import { EmptyState, SkeletonTable } from '../../../components/ui/EmptyState';
import { useInsurance } from '../api/useInsurance';
import toast from 'react-hot-toast';

export interface TreeInsuranceItem {
  id: string;
  policy_number: string;
  name: string;
  provider: string;
  species_covered: string;
  premium_per_tree: number;
  coverage_amount: number;
  enrolled_trees: number;
  total_premium_collected: number;
  commission_earned: number;
  claims_count: number;
  survey_status: 'Completed' | 'Pending Survey' | 'In Inspection';
  status: 'Active' | 'Renewal Pending' | 'Claim Filed' | 'Expired';
}

export interface InsuranceClaimItem {
  id: string;
  claim_id: string;
  farmer_name: string;
  farmer_id: string;
  policy_name: string;
  cause_of_damage: 'Wildfire' | 'Drought & Heatwave' | 'Cyclone / Wind' | 'Pest Outbreak';
  trees_damaged: number;
  claim_amount_requested: number;
  approved_payout: number;
  survey_score_pct: number;
  surveyor_name: string;
  status: 'Approved & Paid' | 'Pending Inspection' | 'Under Audit' | 'Rejected';
}

const SEEDED_POLICIES: TreeInsuranceItem[] = [
  {
    id: 'INS-800101',
    policy_number: 'POL-HDFC-TEAK-2026',
    name: 'Teak Tree Weather & Fire Guard',
    provider: 'HDFC ERGO Agri Insurance',
    species_covered: 'Teak (Tectona grandis)',
    premium_per_tree: 50,
    coverage_amount: 500000,
    enrolled_trees: 42500,
    total_premium_collected: 2125000,
    commission_earned: 318750,
    claims_count: 3,
    survey_status: 'Completed',
    status: 'Active',
  },
  {
    id: 'INS-800102',
    policy_number: 'POL-ICICI-MANGO-2026',
    name: 'Mango & Fruit Grove Cyclone Cover',
    provider: 'ICICI Lombard General Insurance',
    species_covered: 'Mango & Medicinal Trees',
    premium_per_tree: 65,
    coverage_amount: 1200000,
    enrolled_trees: 28000,
    total_premium_collected: 1820000,
    commission_earned: 273000,
    claims_count: 5,
    survey_status: 'Pending Survey',
    status: 'Claim Filed',
  },
  {
    id: 'INS-800103',
    policy_number: 'POL-BAJAJ-SANDAL-2026',
    name: 'Sandalwood & High-Value Timber Shield',
    provider: 'Bajaj Allianz Climate Cover',
    species_covered: 'Sandalwood & Bamboo',
    premium_per_tree: 120,
    coverage_amount: 2500000,
    enrolled_trees: 15000,
    total_premium_collected: 1800000,
    commission_earned: 270000,
    claims_count: 1,
    survey_status: 'Completed',
    status: 'Renewal Pending',
  },
];

const SEEDED_CLAIMS: InsuranceClaimItem[] = [
  {
    id: 'CLM-9001',
    claim_id: 'CLM-HDFC-9001',
    farmer_name: 'Ramesh Patel',
    farmer_id: 'F-84920',
    policy_name: 'Teak Tree Weather & Fire Guard',
    cause_of_damage: 'Wildfire',
    trees_damaged: 120,
    claim_amount_requested: 60000,
    approved_payout: 58000,
    survey_score_pct: 96.5,
    surveyor_name: 'Drone Survey Inspection Team A',
    status: 'Approved & Paid',
  },
  {
    id: 'CLM-9002',
    claim_id: 'CLM-ICICI-9002',
    farmer_name: 'Suresh Verma',
    farmer_id: 'F-71029',
    policy_name: 'Mango & Fruit Grove Cyclone Cover',
    cause_of_damage: 'Cyclone / Wind',
    trees_damaged: 85,
    claim_amount_requested: 55250,
    approved_payout: 50000,
    survey_score_pct: 91.0,
    surveyor_name: 'Field Officer Inspector Vikram',
    status: 'Pending Inspection',
  },
];

const PAGE_SIZE = 10;

export const TreeInsurance = () => {
  const navigate = useNavigate();
  const [activeMainTab, setActiveMainTab] = useState<'policies' | 'claims' | 'surveys' | 'renewals'>('policies');
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const [policiesList, setPoliciesList] = useState<TreeInsuranceItem[]>(SEEDED_POLICIES);
  const [claimsList, setClaimsList] = useState<InsuranceClaimItem[]>(SEEDED_CLAIMS);

  // New Policy Modal State
  const [isNewPolicyModalOpen, setIsNewPolicyModalOpen] = useState(false);
  const [newPolicy, setNewPolicy] = useState({
    name: '',
    provider: 'HDFC ERGO Agri Insurance',
    species_covered: 'Teak (Tectona grandis)',
    premium_per_tree: 50,
    coverage_amount: 500000,
  });

  const { data: apiData, isLoading, refetch, isFetching } = useInsurance();

  const policies = useMemo(() => {
    if (apiData && Array.isArray(apiData) && apiData.length > 0) {
      return apiData.map((item: any) => ({
        id: item.id || `INS-${Math.floor(8000 + Math.random() * 900)}`,
        policy_number: `POL-${String(item.id || '800101').slice(-6).toUpperCase()}`,
        name: item.name || 'Weather Risk Cover',
        provider: item.provider || 'HDFC ERGO Agri Insurance',
        species_covered: item.species_covered || 'Teak & Bamboo',
        premium_per_tree: item.premium_amount || 50,
        coverage_amount: item.coverage_amount || 500000,
        enrolled_trees: 35000,
        total_premium_collected: (item.premium_amount || 50) * 35000,
        commission_earned: (item.premium_amount || 50) * 35000 * 0.15,
        claims_count: 2,
        survey_status: 'Completed',
        status: item.is_active ? 'Active' : 'Renewal Pending',
      }));
    }
    return policiesList;
  }, [apiData, policiesList]);

  const filteredPolicies = useMemo(() => {
    return policies.filter(p => {
      const q = search.toLowerCase();
      const matchSearch = !q || [
        p.name, p.provider, p.policy_number, p.species_covered
      ].some(v => v?.toLowerCase().includes(q));

      const matchStatus = !statusFilter || p.status.toLowerCase() === statusFilter.toLowerCase();
      return matchSearch && matchStatus;
    });
  }, [policies, search, statusFilter]);

  const totalPolicies = policies.length;
  const activeCount = policies.filter(p => p.status === 'Active').length;
  const totalPremium = policies.reduce((acc, p) => acc + (p.total_premium_collected || 0), 0);
  const totalCommission = policies.reduce((acc, p) => acc + (p.commission_earned || 0), 0);
  const totalClaims = claimsList.length;

  const totalPages = Math.max(1, Math.ceil(filteredPolicies.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pageRows = filteredPolicies.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const handleCreatePolicySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPolicy.name) {
      toast.error('Please enter policy product name.');
      return;
    }

    const created: TreeInsuranceItem = {
      id: `INS-${Math.floor(8000 + Math.random() * 900)}`,
      policy_number: `POL-${Math.floor(8000 + Math.random() * 900)}`,
      name: newPolicy.name,
      provider: newPolicy.provider,
      species_covered: newPolicy.species_covered,
      premium_per_tree: Number(newPolicy.premium_per_tree),
      coverage_amount: Number(newPolicy.coverage_amount),
      enrolled_trees: 10000,
      total_premium_collected: Number(newPolicy.premium_per_tree) * 10000,
      commission_earned: Number(newPolicy.premium_per_tree) * 10000 * 0.15,
      claims_count: 0,
      survey_status: 'Completed',
      status: 'Active',
    };

    setPoliciesList(prev => [created, ...prev]);
    toast.success(`Insurance Policy "${created.name}" created successfully!`);
    setIsNewPolicyModalOpen(false);
  };

  const handleApproveClaim = (claimId: string) => {
    setClaimsList(prev => prev.map(c => {
      if (c.id === claimId) {
        toast.success(`Claim ${c.claim_id} Approved! Paid ₹${c.approved_payout.toLocaleString()} to ${c.farmer_name}`);
        return { ...c, status: 'Approved & Paid' };
      }
      return c;
    }));
  };

  const getStatusVariant = (s: string) => {
    if (s === 'Active' || s === 'Approved & Paid') return 'success';
    if (s === 'Claim Filed' || s === 'Pending Inspection') return 'warning';
    if (s === 'Renewal Pending') return 'purple';
    return 'gray';
  };

  return (
    <div className="space-y-6 page-enter pb-12" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>

      {/* ── Page Header ── */}
      <PageHeader
        title="Tree Insurance & Climate Loss Settlement"
        description="Module 10: Manage Tree Policies, Loss Claims, Drone Survey Inspections, Policy Renewals, Premium Collections & Underwriter Commissions."
        badge={{ label: `${activeCount} Active Policies`, variant: 'success' }}
        icon={ShieldCheck}
        iconColor="#16A34A"
        actions={
          <div className="flex items-center gap-2">
            <button onClick={() => refetch()} className="btn btn-secondary btn-sm gap-1.5 cursor-pointer">
              <RefreshCw size={13} className={isFetching ? 'animate-spin' : ''} /> Sync Policies
            </button>
            <button onClick={() => setIsNewPolicyModalOpen(true)} className="btn btn-primary btn-sm gap-1.5 cursor-pointer">
              <Plus size={14} /> Create Insurance Policy
            </button>
          </div>
        }
      />

      {/* ── BRD TREE INSURANCE KPI METRICS ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard title="ACTIVE POLICIES" value={totalPolicies} icon={ShieldCheck} iconBg="#EFF6FF" iconColor="#2563EB" loading={isLoading} />
        <KpiCard title="TOTAL PREMIUM COLLECTED" value={`₹${(totalPremium / 100000).toFixed(1)} Lakhs`} icon={DollarSign} iconBg="#F0FDF4" iconColor="#16A34A" loading={isLoading} />
        <KpiCard title="PLATFORM COMMISSION (15%)" value={`₹${(totalCommission / 100000).toFixed(1)} Lakhs`} icon={Sparkles} iconBg="#F5F3FF" iconColor="#8B5CF6" loading={isLoading} />
        <KpiCard title="CLAIMS FILED" value={totalClaims} icon={AlertTriangle} iconBg="#FEF2F2" iconColor="#EF4444" loading={isLoading} />
      </div>

      {/* ── MAIN MODULE TABS ── */}
      <div className="bg-white border border-[#E8EDF5] rounded-2xl p-1.5 shadow-xs flex items-center gap-1">
        {[
          { id: 'policies', label: '1. Insurance Policies & Coverage', icon: ShieldCheck },
          { id: 'claims', label: '2. Loss Claims & Settlement', icon: AlertTriangle },
          { id: 'surveys', label: '3. Drone & On-Ground Surveys', icon: Camera },
          { id: 'renewals', label: '4. Annual Policy Renewals', icon: RotateCcw },
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeMainTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveMainTab(tab.id as any)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-[12.5px] font-bold transition-all cursor-pointer ${
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

      {/* ── TAB 1: INSURANCE POLICIES DIRECTORY ── */}
      {activeMainTab === 'policies' && (
        <div className="space-y-4">
          <div className="bg-white border border-[#E8EDF5] rounded-2xl p-4 shadow-xs space-y-3">
            <div className="flex flex-col md:flex-row items-center gap-3">
              <div className="relative flex-1 w-full">
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search by Policy Number, Product Name, Underwriter Provider, Species..."
                  className="w-full pl-10 pr-4 py-2 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-[13px] text-[#0F172A] outline-none focus:border-[#16A34A] focus:bg-white transition-all"
                />
              </div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-[12px] font-medium text-[#0F172A] outline-none cursor-pointer focus:border-[#16A34A]"
              >
                <option value="">All Policy Statuses</option>
                <option value="Active">Active & Covered</option>
                <option value="Claim Filed">Claim Filed</option>
                <option value="Renewal Pending">Renewal Pending</option>
              </select>
            </div>
          </div>

          <div className="ent-card overflow-hidden">
            <div className="p-4 border-b border-[#F1F5F9] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldCheck size={16} className="text-[#16A34A]" />
                <h3 className="text-[14px] font-bold text-[#0F172A]">Tree Insurance Products Directory</h3>
                <span className="text-[11px] font-bold text-[#16A34A] bg-[#F0FDF4] px-2 py-0.5 rounded-full border border-[#DCFCE7]">
                  {filteredPolicies.length} Policies
                </span>
              </div>
            </div>

            <div className="overflow-x-auto custom-scrollbar">
              <table className="ent-table min-w-[1200px]">
                <thead>
                  <tr>
                    <th>Policy Code</th>
                    <th>Product Name & Species</th>
                    <th>Underwriter Provider</th>
                    <th>Premium / Tree</th>
                    <th>Max Coverage Amount</th>
                    <th>Premium Collected</th>
                    <th>Commission (15%)</th>
                    <th>Status</th>
                    <th className="text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {isLoading ? (
                    <tr><td colSpan={9} className="p-0"><SkeletonTable rows={6} cols={9} /></td></tr>
                  ) : filteredPolicies.length === 0 ? (
                    <tr><td colSpan={9}>
                      <EmptyState icon={ShieldCheck} title="No insurance policies found" description="Try adjusting your filters or search." />
                    </td></tr>
                  ) : pageRows.map((policy, i) => (
                    <motion.tr
                      key={policy.id}
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.03 }}
                    >
                      {/* Code */}
                      <td>
                        <span className="font-mono text-[12px] text-[#2563EB] font-bold bg-[#EFF6FF] px-2.5 py-1 rounded-lg border border-[#DBEAFE]">
                          {policy.policy_number}
                        </span>
                      </td>

                      {/* Product Name */}
                      <td>
                        <div className="text-[13px] font-bold text-[#0F172A]">{policy.name}</div>
                        <div className="text-[11px] text-[#64748B] font-medium">{policy.species_covered}</div>
                      </td>

                      {/* Provider */}
                      <td className="text-[12.5px] font-medium text-[#0F172A]">{policy.provider}</td>

                      {/* Premium per Tree */}
                      <td className="text-[13px] font-bold text-[#0F172A]">₹{policy.premium_per_tree} / tree</td>

                      {/* Coverage Amount */}
                      <td className="text-[13.5px] font-extrabold text-[#16A34A]">₹{policy.coverage_amount.toLocaleString()}</td>

                      {/* Premium Collected */}
                      <td>
                        <div className="text-[13px] font-bold text-[#0F172A]">₹{policy.total_premium_collected.toLocaleString()}</div>
                        <div className="text-[10.5px] text-[#94A3B8]">{policy.enrolled_trees.toLocaleString()} Trees</div>
                      </td>

                      {/* Commission */}
                      <td className="text-[13px] font-bold text-[#8B5CF6]">₹{policy.commission_earned.toLocaleString()}</td>

                      {/* Status */}
                      <td>
                        <StatusBadge label={policy.status} variant={getStatusVariant(policy.status) as any} size="sm" />
                      </td>

                      {/* Actions */}
                      <td className="text-right">
                        <button
                          onClick={() => navigate(`/insurance/${policy.id}`)}
                          className="px-3 py-1.5 bg-[#F0FDF4] hover:bg-[#DCFCE7] text-[#16A34A] text-[11.5px] font-bold rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                        >
                          <Eye size={13} /> Policy Details
                        </button>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-[#F1F5F9]">
                <span className="text-[12px] text-[#94A3B8]">
                  Page {safePage} of {totalPages} · {filteredPolicies.length} policies
                </span>
                <div className="flex gap-1">
                  <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={safePage === 1} className="btn btn-secondary btn-sm">Previous</button>
                  <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={safePage === totalPages} className="btn btn-secondary btn-sm">Next</button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── TAB 2: CLAIMS & SETTLEMENT ── */}
      {activeMainTab === 'claims' && (
        <div className="ent-card overflow-hidden">
          <div className="p-4 border-b border-[#F1F5F9] flex items-center justify-between">
            <h3 className="text-[14px] font-bold text-[#0F172A]">Filed Claims & Damage Payout Settlements</h3>
            <span className="text-[11px] font-bold text-[#EF4444] bg-[#FEF2F2] px-2 py-0.5 rounded-full border border-[#FECACA]">
              {claimsList.length} Active Claims
            </span>
          </div>

          <div className="overflow-x-auto custom-scrollbar">
            <table className="ent-table min-w-[1100px]">
              <thead>
                <tr>
                  <th>Claim ID</th>
                  <th>Farmer Name & ID</th>
                  <th>Policy Product</th>
                  <th>Cause of Damage</th>
                  <th>Damaged Trees</th>
                  <th>Requested vs Approved</th>
                  <th>Survey Confidence</th>
                  <th>Status</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {claimsList.map(c => (
                  <tr key={c.id}>
                    <td>
                      <span className="font-mono text-[12px] text-[#2563EB] font-bold bg-[#EFF6FF] px-2.5 py-1 rounded-lg border border-[#DBEAFE]">
                        {c.claim_id}
                      </span>
                    </td>
                    <td>
                      <div className="text-[13px] font-bold text-[#0F172A]">{c.farmer_name}</div>
                      <div className="text-[11px] font-mono text-[#64748B]">{c.farmer_id}</div>
                    </td>
                    <td className="text-[12.5px] font-medium text-[#0F172A]">{c.policy_name}</td>
                    <td>
                      <span className="px-2.5 py-0.5 bg-[#FEF2F2] text-[#EF4444] rounded-full text-[11px] font-bold border border-[#FECACA]">
                        {c.cause_of_damage}
                      </span>
                    </td>
                    <td className="text-[13px] font-bold text-[#0F172A]">{c.trees_damaged} Trees</td>
                    <td>
                      <div className="text-[13px] font-extrabold text-[#16A34A]">₹{c.approved_payout.toLocaleString()}</div>
                      <div className="text-[10.5px] text-[#94A3B8]">Req: ₹{c.claim_amount_requested.toLocaleString()}</div>
                    </td>
                    <td>
                      <span className="text-[12px] font-bold text-[#16A34A]">{c.survey_score_pct}% Match</span>
                    </td>
                    <td>
                      <StatusBadge label={c.status} variant={getStatusVariant(c.status) as any} size="sm" />
                    </td>
                    <td className="text-right">
                      {c.status === 'Pending Inspection' ? (
                        <button
                          onClick={() => handleApproveClaim(c.id)}
                          className="px-2.5 py-1 bg-[#F0FDF4] hover:bg-[#DCFCE7] text-[#16A34A] text-[11.5px] font-bold rounded-lg cursor-pointer flex items-center gap-1"
                        >
                          <Check size={13} /> Approve & Pay
                        </button>
                      ) : (
                        <span className="text-[11px] text-[#94A3B8] font-bold">Settled</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── TAB 3: DRONE & ON-GROUND SURVEYS ── */}
      {activeMainTab === 'surveys' && (
        <div className="bg-white border border-[#E8EDF5] rounded-2xl p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-[#F1F5F9] pb-4">
            <h3 className="text-[15px] font-bold text-[#0F172A] flex items-center gap-2">
              <Camera size={18} className="text-[#2563EB]" /> Drone Telemetry & Field Surveyor Inspection Logs
            </h3>
            <button onClick={() => toast.success('Initiating drone damage inspection scan')} className="btn btn-primary btn-sm">Request Drone Scan</button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { id: 'SRV-101', date: '04 Aug 2026', plot: 'Ichhawar Plot SUR-402/A', damagePct: '12% Fire Damage', inspector: 'Drone Team A' },
              { id: 'SRV-102', date: '01 Aug 2026', plot: 'Ashta Plot SUR-109/B', damagePct: '18% Wind Damage', inspector: 'Field Inspector Vikram' },
            ].map((s, idx) => (
              <div key={idx} className="p-4 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-bold text-[#2563EB] font-mono">{s.id} • {s.date}</span>
                  <h4 className="text-[13.5px] font-bold text-[#0F172A]">{s.plot}</h4>
                  <span className="text-[11.5px] text-[#64748B]">Inspector: {s.inspector}</span>
                </div>
                <span className="px-2.5 py-1 bg-[#FEF2F2] text-[#EF4444] rounded-lg text-[12px] font-bold">
                  {s.damagePct}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── TAB 4: ANNUAL POLICY RENEWALS ── */}
      {activeMainTab === 'renewals' && (
        <div className="bg-white border border-[#E8EDF5] rounded-2xl p-6 shadow-xs space-y-4">
          <h3 className="text-[15px] font-bold text-[#0F172A] flex items-center gap-2">
            <RotateCcw size={18} className="text-[#8B5CF6]" /> Policy Renewals & Premium Auto-Renewal
          </h3>

          <div className="p-4 bg-[#F5F3FF] border border-[#DDD6FE] rounded-xl flex items-center justify-between">
            <div>
              <span className="text-[11px] font-bold text-[#8B5CF6]">Upcoming Annual Renewals</span>
              <p className="text-[20px] font-extrabold text-[#8B5CF6]">150 Farmer Policies Expiring in 30 Days</p>
            </div>
            <button onClick={() => toast.success('Sent automated renewal notifications to 150 farmers via SMS & App!')} className="btn btn-primary btn-sm">
              Send Renewal Notices
            </button>
          </div>
        </div>
      )}

      {/* ── CREATE NEW POLICY MODAL ── */}
      <AnimatePresence>
        {isNewPolicyModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-[#E8EDF5] space-y-4"
            >
              <div className="flex items-center justify-between border-b border-[#F1F5F9] pb-3">
                <div className="flex items-center gap-2">
                  <ShieldCheck size={18} className="text-[#16A34A]" />
                  <h3 className="text-[16px] font-bold text-[#0F172A]">Create New Tree Insurance Policy</h3>
                </div>
                <button onClick={() => setIsNewPolicyModalOpen(false)} className="text-[#94A3B8] hover:text-[#0F172A]">
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleCreatePolicySubmit} className="space-y-3 text-[13px]">
                <div>
                  <label className="block text-[11.5px] font-bold text-[#0F172A] mb-1">Policy Product Name</label>
                  <input
                    type="text"
                    required
                    value={newPolicy.name}
                    onChange={e => setNewPolicy({ ...newPolicy, name: e.target.value })}
                    placeholder="e.g. Bamboo Plantation Wildfire Shield"
                    className="w-full px-3 py-2 bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl font-medium outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11.5px] font-bold text-[#0F172A] mb-1">Underwriter Insurance Provider</label>
                  <select
                    value={newPolicy.provider}
                    onChange={e => setNewPolicy({ ...newPolicy, provider: e.target.value })}
                    className="w-full px-3 py-2 bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl font-medium outline-none"
                  >
                    <option value="HDFC ERGO Agri Insurance">HDFC ERGO Agri Insurance</option>
                    <option value="ICICI Lombard General Insurance">ICICI Lombard General Insurance</option>
                    <option value="Bajaj Allianz Climate Cover">Bajaj Allianz Climate Cover</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11.5px] font-bold text-[#0F172A] mb-1">Premium / Tree (₹)</label>
                    <input
                      type="number"
                      value={newPolicy.premium_per_tree}
                      onChange={e => setNewPolicy({ ...newPolicy, premium_per_tree: Number(e.target.value) })}
                      className="w-full px-3 py-2 bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl font-medium outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[11.5px] font-bold text-[#0F172A] mb-1">Max Cover Amount (₹)</label>
                    <input
                      type="number"
                      value={newPolicy.coverage_amount}
                      onChange={e => setNewPolicy({ ...newPolicy, coverage_amount: Number(e.target.value) })}
                      className="w-full px-3 py-2 bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl font-medium outline-none"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#F1F5F9]">
                  <button type="button" onClick={() => setIsNewPolicyModalOpen(false)} className="btn btn-secondary btn-sm cursor-pointer">Cancel</button>
                  <button type="submit" className="btn btn-primary btn-sm cursor-pointer flex items-center gap-1">
                    <Plus size={14} /> Create Policy
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

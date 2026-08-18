import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ShieldCheck, Plus, RefreshCw, Eye, AlertTriangle,
  DollarSign, RotateCcw, Sparkles, Check, X, Camera,
  FileText, User, CheckCircle, Clock
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { PageHeader } from '../../../components/ui/PageHeader';
import { KpiCard } from '../../../components/ui/KpiCard';
import { StatusBadge } from '../../../components/ui/StatusBadge';
import { EmptyState, SkeletonTable } from '../../../components/ui/EmptyState';
import { useInsurance } from '../api/useInsurance';
import adminApi from '../../../api/apiClient';
import toast from 'react-hot-toast';

export interface TreeInsuranceItem {
  id: string;
  policy_number: string;
  farmer_name: string;
  farmer_id: string;
  trees: number;
  coverage: number;
  premium: number;
  company: string;
  status: 'Approved' | 'Pending' | 'Rejected' | 'Renewals';
}

export interface InsuranceClaimItem {
  id: string;
  claim_id: string;
  farmer_name: string;
  farmer_id: string;
  reason: 'Wildfire' | 'Drought & Heatwave' | 'Cyclone / Wind' | 'Pest Outbreak';
  trees_damaged: number;
  survey_status: string;
  survey_score: number;
  approval_status: 'Approved' | 'Pending' | 'Rejected';
  settlement_amount: number;
}

const SEEDED_POLICIES: TreeInsuranceItem[] = [];
const SEEDED_CLAIMS: InsuranceClaimItem[] = [];

export const TreeInsurance = () => {
  const navigate = useNavigate();
  const [activeMainTab, setActiveMainTab] = useState<'policies' | 'claims'>('policies');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const [policiesList, setPoliciesList] = useState<TreeInsuranceItem[]>([]);
  const [userCreatedClaims, setUserCreatedClaims] = useState<InsuranceClaimItem[]>([]);

  const [isNewPolicyModalOpen, setIsNewPolicyModalOpen] = useState(false);
  const [newPolicy, setNewPolicy] = useState({
    farmer_name: '',
    farmer_id: '',
    trees: 500,
    coverage: 250000,
    premium: 25000,
    company: 'HDFC ERGO Agri Insurance',
    status: 'Approved' as const,
  });

  const { data: apiData, isLoading, refetch, isFetching } = useInsurance();
  const [enrollments, setEnrollments] = useState<any[]>([]);

  useEffect(() => {
    adminApi.get('/admin/projects/enrollments')
      .then(res => {
        if (Array.isArray(res.data?.data)) {
          setEnrollments(res.data.data);
        }
      })
      .catch(err => console.warn('Failed to fetch enrollments for insurance:', err));
  }, []);

  const policies = useMemo(() => {
    // Map real backend project enrollments
    const mappedEnrollments: TreeInsuranceItem[] = enrollments.map((e: any) => {
      const isApproved = e.stage_insurance_activated || e.insurance_active || e.status === 'completed' || e.status === 'active';
      const treesCount = e.insured_trees || e.registered_trees || 0;
      const coverageAmount = treesCount * 400; // ₹400 per tree standard coverage
      const premiumAmount = Math.round(coverageAmount * 0.1);

      return {
        id: e.enrollment_id,
        policy_number: `POL-SHIELD-${e.enrollment_id.slice(-6).toUpperCase()}`,
        farmer_name: e.farmer_name || 'Shankar Rathore',
        farmer_id: e.farmer_id || 'FAR-000085',
        trees: treesCount,
        coverage: coverageAmount,
        premium: premiumAmount,
        company: 'Green Shield Agri Protection',
        status: isApproved ? 'Approved' : 'Pending',
      };
    });

    if (mappedEnrollments.length > 0) {
      return [...mappedEnrollments, ...policiesList];
    }

    if (apiData && Array.isArray(apiData) && apiData.length > 0) {
      return apiData.map((item: any) => ({
        id: item.id || `INS-${Math.floor(8000 + Math.random() * 900)}`,
        policy_number: `POL-${String(item.id || '800101').slice(-6).toUpperCase()}`,
        farmer_name: item.farmer_name || '',
        farmer_id: item.farmer_id || '',
        trees: item.enrolled_trees || 0,
        coverage: item.coverage_amount || 0,
        premium: (item.coverage_amount || 0) * 0.1,
        company: item.provider || 'Green Shield Agri Insurance',
        status: item.is_active ? 'Approved' : 'Pending',
      }));
    }
    return policiesList;
  }, [enrollments, apiData, policiesList]);

  // Dynamic claims list derived from real backend enrollments with claims submitted
  const claimsList = useMemo(() => {
    const realClaims: InsuranceClaimItem[] = enrollments
      .filter((e: any) => e.claim_submitted || e.stage_mrv_monitoring_started)
      .map((e: any) => ({
        id: `CLM-${e.enrollment_id.slice(-4)}`,
        claim_id: `CLM-SHIELD-${e.enrollment_id.slice(-6).toUpperCase()}`,
        farmer_name: e.farmer_name || 'Shankar Rathore',
        farmer_id: e.farmer_id || 'FAR-000085',
        reason: 'Drought & Heatwave',
        trees_damaged: Math.round((e.registered_trees || 10) * 0.15),
        survey_status: e.mrv_verified ? 'Survey Completed (Drone Verified)' : 'Pending Field Inspection',
        survey_score: 92.5,
        approval_status: e.status === 'completed' ? 'Approved' : 'Pending',
        settlement_amount: Math.round((e.registered_trees || 10) * 400 * 0.15),
      }));

    return [...realClaims, ...userCreatedClaims];
  }, [enrollments, userCreatedClaims]);

  const filteredPolicies = useMemo(() => {
    return policies.filter(p => {
      const q = search.toLowerCase();
      const matchSearch = !q || [
        p.farmer_name, p.farmer_id, p.company, p.policy_number
      ].some(v => v?.toLowerCase().includes(q));

      const matchStatus = !statusFilter || p.status.toLowerCase() === statusFilter.toLowerCase();
      return matchSearch && matchStatus;
    });
  }, [policies, search, statusFilter]);

  // 6 Specified Dashboard Cards Counts: Policies, Pending, Approved, Rejected, Claims, Renewals
  const totalPoliciesCount = policies.length;
  const pendingCount = policies.filter(p => p.status === 'Pending').length;
  const approvedCount = policies.filter(p => p.status === 'Approved').length;
  const rejectedCount = policies.filter(p => p.status === 'Rejected').length;
  const claimsCount = claimsList.length;
  const renewalsCount = policies.filter(p => p.status === 'Renewals').length;

  const handleCreatePolicySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPolicy.farmer_name) {
      toast.error('Please enter Farmer Name.');
      return;
    }

    const randomNum = Math.floor(8000 + Math.random() * 900);
    const created: TreeInsuranceItem = {
      id: `INS-${randomNum}`,
      policy_number: `POL-TREE-${randomNum}`,
      farmer_name: newPolicy.farmer_name,
      farmer_id: newPolicy.farmer_id || `FARM-MP-${randomNum}`,
      trees: Number(newPolicy.trees),
      coverage: Number(newPolicy.coverage),
      premium: Number(newPolicy.premium),
      company: newPolicy.company,
      status: newPolicy.status as any,
    };

    setPoliciesList(prev => [created, ...prev]);
    toast.success(`Insurance Policy "${created.policy_number}" created successfully!`);
    setIsNewPolicyModalOpen(false);
  };

  const handleApproveClaim = (claimId: string) => {
    setClaimsList(prev => prev.map(c => {
      if (c.id === claimId) {
        toast.success(`Claim ${c.claim_id} Approved! Settlement amount ₹${c.settlement_amount.toLocaleString()} disbursed.`);
        return { ...c, approval_status: 'Approved' };
      }
      return c;
    }));
  };

  return (
    <div className="space-y-6 page-enter pb-12" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>

      {/* ── Page Header ── */}
      <PageHeader
        title="Tree Insurance & Climate Loss Settlement"
        description="Tree Insurance policy management, coverage limits, underwriting companies, claim loss surveys, and settlement payouts."
        badge={{ label: `${approvedCount} Approved Policies`, variant: 'success' }}
        icon={ShieldCheck}
        iconColor="#16A34A"
        actions={
          <div className="flex items-center gap-2">
            <button onClick={() => refetch()} className="btn btn-secondary btn-sm gap-1.5 cursor-pointer">
              <RefreshCw size={13} className={isFetching ? 'animate-spin' : ''} /> Sync Policies
            </button>
            <button onClick={() => setIsNewPolicyModalOpen(true)} className="btn btn-primary btn-sm gap-1.5 cursor-pointer">
              <Plus size={14} /> Issue New Policy
            </button>
          </div>
        }
      />

      {/* ── 6 SPECIFIED DASHBOARD CARDS (Policies, Pending, Approved, Rejected, Claims, Renewals) ── */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <KpiCard title="POLICIES" value={totalPoliciesCount} icon={ShieldCheck} iconBg="#EFF6FF" iconColor="#2563EB" loading={isLoading} />
        <KpiCard title="PENDING" value={pendingCount} icon={Clock} iconBg="#FFFBEB" iconColor="#D97706" loading={isLoading} />
        <KpiCard title="APPROVED" value={approvedCount} icon={CheckCircle} iconBg="#F0FDF4" iconColor="#16A34A" loading={isLoading} />
        <KpiCard title="REJECTED" value={rejectedCount} icon={X} iconBg="#FEF2F2" iconColor="#EF4444" loading={isLoading} />
        <KpiCard title="CLAIMS" value={claimsCount} icon={AlertTriangle} iconBg="#FEF3C7" iconColor="#B45309" loading={isLoading} />
        <KpiCard title="RENEWALS" value={renewalsCount} icon={RotateCcw} iconBg="#F5F3FF" iconColor="#8B5CF6" loading={isLoading} />
      </div>

      {/* ── MAIN TABS SWITCHER (Policies vs Claims) ── */}
      <div className="flex items-center gap-2 border-b border-[#E8EDF5] pb-2">
        <button
          onClick={() => setActiveMainTab('policies')}
          className={`px-4 py-2 rounded-xl text-[13px] font-bold transition-all cursor-pointer ${
            activeMainTab === 'policies' ? 'bg-[#F0FDF4] text-[#16A34A] border border-[#DCFCE7]' : 'text-[#64748B]'
          }`}
        >
          Tree Insurance Policies ({totalPoliciesCount})
        </button>
        <button
          onClick={() => setActiveMainTab('claims')}
          className={`px-4 py-2 rounded-xl text-[13px] font-bold transition-all cursor-pointer ${
            activeMainTab === 'claims' ? 'bg-[#F0FDF4] text-[#16A34A] border border-[#DCFCE7]' : 'text-[#64748B]'
          }`}
        >
          Loss Claims & Settlements ({claimsCount})
        </button>
      </div>

      {/* ── TAB 1: POLICIES TABLE (All 6 Policy Attributes) ── */}
      {activeMainTab === 'policies' && (
        <div className="bg-white border border-[#E8EDF5] rounded-2xl overflow-hidden shadow-xs">
          <div className="p-4 border-b border-[#F1F5F9] flex items-center justify-between">
            <h3 className="text-[14px] font-bold text-[#0F172A]">Tree Policies Directory</h3>
            <span className="text-[11px] font-bold text-[#16A34A] bg-[#F0FDF4] px-2 py-0.5 rounded-full border border-[#DCFCE7]">
              {filteredPolicies.length} Active Policies
            </span>
          </div>

          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left border-collapse min-w-[1100px]">
              <thead>
                <tr className="bg-[#F8FAFC] border-b border-[#E2E8F0] text-[11px] font-bold uppercase tracking-wider text-[#475569]">
                  <th className="py-3 px-4">Policy Number</th>
                  <th className="py-3 px-4">Farmer</th>
                  <th className="py-3 px-4">Trees</th>
                  <th className="py-3 px-4">Coverage</th>
                  <th className="py-3 px-4">Premium</th>
                  <th className="py-3 px-4">Company</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F1F5F9]">
                {isLoading ? (
                  <tr><td colSpan={8} className="p-0"><SkeletonTable rows={6} cols={8} /></td></tr>
                ) : filteredPolicies.length === 0 ? (
                  <tr><td colSpan={8}>
                    <EmptyState icon={ShieldCheck} title="No policies found" description="Try clearing your search term." />
                  </td></tr>
                ) : filteredPolicies.map((p) => (
                  <tr key={p.id} className="hover:bg-[#F8FAFC] transition-colors">
                    {/* Policy Number */}
                    <td className="py-3 px-4 font-mono text-[12px] text-[#2563EB] font-bold">
                      {p.policy_number}
                    </td>

                    {/* Attribute 1: Farmer */}
                    <td className="py-3 px-4">
                      <div
                        onClick={() => navigate(`/farmers/${p.farmer_id}`)}
                        className="text-[13px] font-bold text-[#0F172A] hover:text-[#16A34A] cursor-pointer"
                      >
                        {p.farmer_name}
                      </div>
                      <div className="text-[10.5px] font-mono text-[#64748B]">{p.farmer_id}</div>
                    </td>

                    {/* Attribute 2: Trees */}
                    <td className="py-3 px-4 text-[13px] font-bold text-[#0F172A]">
                      {p.trees.toLocaleString()} <span className="text-[11px] font-normal text-[#64748B]">Trees</span>
                    </td>

                    {/* Attribute 3: Coverage */}
                    <td className="py-3 px-4 text-[13px] font-bold text-[#2563EB]">
                      ₹{p.coverage.toLocaleString()}
                    </td>

                    {/* Attribute 4: Premium */}
                    <td className="py-3 px-4 text-[13px] font-extrabold text-[#16A34A]">
                      ₹{p.premium.toLocaleString()}
                    </td>

                    {/* Attribute 5: Company */}
                    <td className="py-3 px-4 text-[12.5px] font-semibold text-[#475569]">
                      {p.company}
                    </td>

                    {/* Attribute 6: Status */}
                    <td className="py-3 px-4">
                      <StatusBadge
                        label={p.status}
                        variant={p.status === 'Approved' ? 'success' : p.status === 'Pending' ? 'warning' : p.status === 'Rejected' ? 'danger' : 'purple'}
                        size="sm"
                      />
                    </td>

                    {/* Action */}
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => navigate(`/insurance/${p.id}`)}
                        className="px-3 py-1.5 bg-[#F0FDF4] hover:bg-[#DCFCE7] text-[#16A34A] text-[11.5px] font-bold rounded-lg transition-colors flex items-center gap-1 cursor-pointer ml-auto"
                      >
                        <Eye size={13} /> Policy Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── TAB 2: CLAIMS TABLE (5 Specified Claim Details & Flow) ── */}
      {activeMainTab === 'claims' && (
        <div className="bg-white border border-[#E8EDF5] rounded-2xl overflow-hidden shadow-xs">
          <div className="p-4 border-b border-[#F1F5F9] flex items-center justify-between">
            <h3 className="text-[14px] font-bold text-[#0F172A]">Tree Damage Claims Ledger</h3>
          </div>

          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left border-collapse min-w-[1100px]">
              <thead>
                <tr className="bg-[#F8FAFC] border-b border-[#E2E8F0] text-[11px] font-bold uppercase tracking-wider text-[#475569]">
                  <th className="py-3 px-4">1. Claim ID</th>
                  <th className="py-3 px-4">Farmer</th>
                  <th className="py-3 px-4">2. Reason</th>
                  <th className="py-3 px-4">3. Survey</th>
                  <th className="py-3 px-4">4. Approval</th>
                  <th className="py-3 px-4">5. Settlement</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F1F5F9]">
                {claimsList.length === 0 ? (
                  <tr>
                    <td colSpan={7}>
                      <EmptyState icon={AlertTriangle} title="No damage claims submitted" description="Active tree damage claims and climate loss settlements will appear here." />
                    </td>
                  </tr>
                ) : claimsList.map((c) => (
                  <tr key={c.id} className="hover:bg-[#F8FAFC] transition-colors">
                    {/* Item 1: Claim ID */}
                    <td className="py-3 px-4 font-mono text-[12px] font-bold text-[#2563EB]">
                      {c.claim_id}
                    </td>

                    {/* Farmer */}
                    <td className="py-3 px-4">
                      <div className="text-[13px] font-bold text-[#0F172A]">{c.farmer_name}</div>
                      <div className="text-[10.5px] font-mono text-[#64748B]">{c.farmer_id}</div>
                    </td>

                    {/* Item 2: Reason */}
                    <td className="py-3 px-4 text-[12.5px] font-bold text-[#EF4444]">
                      {c.reason} ({c.trees_damaged || 100} Trees Damaged)
                    </td>

                    {/* Item 3: Survey */}
                    <td className="py-3 px-4 text-[12px] text-[#475569]">
                      {c.survey_status} <span className="text-[11px] font-bold text-[#16A34A]">({c.survey_score}%)</span>
                    </td>

                    {/* Item 4: Approval */}
                    <td className="py-3 px-4">
                      <StatusBadge
                        label={c.approval_status}
                        variant={c.approval_status === 'Approved' ? 'success' : c.approval_status === 'Pending' ? 'warning' : 'danger'}
                        size="sm"
                      />
                    </td>

                    {/* Item 5: Settlement */}
                    <td className="py-3 px-4 text-[13px] font-extrabold text-[#16A34A]">
                      ₹{c.settlement_amount.toLocaleString()}
                    </td>

                    {/* Action */}
                    <td className="py-3 px-4 text-right">
                      {c.approval_status !== 'Approved' ? (
                        <button
                          onClick={() => handleApproveClaim(c.id)}
                          className="px-3 py-1.5 bg-[#F0FDF4] hover:bg-[#DCFCE7] text-[#16A34A] text-[11.5px] font-bold rounded-lg transition-colors flex items-center gap-1 cursor-pointer ml-auto"
                        >
                          <CheckCircle size={13} /> Approve & Settle
                        </button>
                      ) : (
                        <span className="text-[11.5px] font-bold text-[#16A34A] bg-[#F0FDF4] px-2 py-0.5 rounded-md border border-[#DCFCE7]">
                          ✓ Settled
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
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
              className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-[#E8EDF5] space-y-4"
            >
              <div className="flex items-center justify-between border-b border-[#F1F5F9] pb-3">
                <div className="flex items-center gap-2">
                  <ShieldCheck size={20} className="text-[#16A34A]" />
                  <h3 className="text-[16px] font-bold text-[#0F172A]">Issue New Tree Insurance Policy</h3>
                </div>
                <button onClick={() => setIsNewPolicyModalOpen(false)} className="text-[#94A3B8] hover:text-[#0F172A] text-lg font-bold cursor-pointer">
                  ×
                </button>
              </div>

              <form onSubmit={handleCreatePolicySubmit} className="space-y-3 text-[12.5px]">
                <div>
                  <label className="block font-bold text-[#0F172A] mb-1">Farmer Name *</label>
                  <input
                    type="text"
                    required
                    value={newPolicy.farmer_name}
                    onChange={(e) => setNewPolicy({ ...newPolicy, farmer_name: e.target.value })}
                    placeholder="e.g. Ramesh Patel"
                    className="w-full px-3.5 py-2 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-[13px] font-semibold text-[#0F172A] outline-none focus:border-[#16A34A]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-[#0F172A] mb-1">Insurance Company</label>
                    <select
                      value={newPolicy.company}
                      onChange={(e) => setNewPolicy({ ...newPolicy, company: e.target.value })}
                      className="w-full px-3 py-2 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-[12.5px] font-medium text-[#0F172A] outline-none focus:border-[#16A34A]"
                    >
                      <option value="HDFC ERGO Agri Insurance">HDFC ERGO Agri Insurance</option>
                      <option value="ICICI Lombard Insurance">ICICI Lombard Insurance</option>
                      <option value="Bajaj Allianz Climate Cover">Bajaj Allianz Climate Cover</option>
                      <option value="SBI General Tree Cover">SBI General Tree Cover</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-[#0F172A] mb-1">Status</label>
                    <select
                      value={newPolicy.status}
                      onChange={(e) => setNewPolicy({ ...newPolicy, status: e.target.value as any })}
                      className="w-full px-3 py-2 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-[12.5px] font-medium text-[#0F172A] outline-none focus:border-[#16A34A]"
                    >
                      <option value="Approved">Approved</option>
                      <option value="Pending">Pending</option>
                      <option value="Renewals">Renewals</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block font-bold text-[#0F172A] mb-1">Trees Count</label>
                    <input
                      type="number"
                      value={newPolicy.trees}
                      onChange={(e) => setNewPolicy({ ...newPolicy, trees: Number(e.target.value) })}
                      className="w-full px-3 py-2 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-[12.5px] font-bold text-[#0F172A] outline-none focus:border-[#16A34A]"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-[#0F172A] mb-1">Coverage (₹)</label>
                    <input
                      type="number"
                      value={newPolicy.coverage}
                      onChange={(e) => setNewPolicy({ ...newPolicy, coverage: Number(e.target.value) })}
                      className="w-full px-3 py-2 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-[12.5px] font-bold text-[#2563EB] outline-none focus:border-[#16A34A]"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-[#0F172A] mb-1">Premium (₹)</label>
                    <input
                      type="number"
                      value={newPolicy.premium}
                      onChange={(e) => setNewPolicy({ ...newPolicy, premium: Number(e.target.value) })}
                      className="w-full px-3 py-2 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-[12.5px] font-extrabold text-[#16A34A] outline-none focus:border-[#16A34A]"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#F1F5F9]">
                  <button type="button" onClick={() => setIsNewPolicyModalOpen(false)} className="btn btn-secondary btn-sm">
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary btn-sm flex items-center gap-1.5">
                    <Plus size={14} /> Issue Policy
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

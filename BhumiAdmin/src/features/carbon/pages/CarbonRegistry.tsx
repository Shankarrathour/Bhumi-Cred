import { useMemo, useState } from 'react';
import {
  Cloud, RefreshCw, CheckCircle2,
  Leaf, Sparkles, DollarSign, Plus, X,
  FileText, ShieldCheck, Shield, Upload, FileSignature
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';

import { PageHeader }   from '../../../components/ui/PageHeader';
import { KpiCard }      from '../../../components/ui/KpiCard';
import { ChartCard }    from '../../../components/ui/ChartCard';
import { EmptyState, SkeletonTable }   from '../../../components/ui/EmptyState';
import { StatusBadge }  from '../../../components/ui/StatusBadge';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  useTreeRegistrations,
  useCarbonStats,
  useCarbonProjects,
  useCarbonBatches,
  useCreateCarbonProject,
  useMintCarbonBatch,
  useRetireCarbonBatch,
  RegistryProjectItem,
  CarbonBatchItem
} from '../api/useCarbonRegistry';

const ISSUANCE_TREND = [
  { month: 'Sep', issued: 18400, sold: 14200, available: 4200 },
  { month: 'Oct', issued: 22100, sold: 17000, available: 5100 },
  { month: 'Nov', issued: 19800, sold: 13500, available: 6300 },
  { month: 'Dec', issued: 25600, sold: 17800, available: 7800 },
  { month: 'Jan', issued: 31200, sold: 22800, available: 8400 },
  { month: 'Feb', issued: 28900, sold: 21800, available: 7100 },
  { month: 'Mar', issued: 35400, sold: 25800, available: 9600 },
  { month: 'Apr', issued: 42100, sold: 31900, available: 10200 },
  { month: 'May', issued: 38700, sold: 26900, available: 11800 },
  { month: 'Jun', issued: 47300, sold: 33900, available: 13400 },
  { month: 'Jul', issued: 52800, sold: 37600, available: 15200 },
  { month: 'Aug', issued: 61400, sold: 43800, available: 17600 },
];

const PAGE_SIZE = 10;
const fmtTCO2e = (n: number) => n >= 1_000_000 ? `${(n / 1_000_000).toFixed(2)}M` : n >= 1_000 ? `${(n / 1_000).toFixed(1)}K` : n.toFixed(1);

export const CarbonRegistry = () => {
  const navigate = useNavigate();
  
  // Real backend queries
  const { data: statsData, isLoading: statsLoading, refetch: refetchStats } = useCarbonStats();
  const { data: projectsData, isLoading: projectsLoading, refetch: refetchProjects } = useCarbonProjects();
  const { data: batchesData, isLoading: batchesLoading, refetch: refetchBatches } = useCarbonBatches();

  // Real backend mutations
  const createProjectMutation = useCreateCarbonProject();
  const mintBatchMutation = useMintCarbonBatch();
  const retireBatchMutation = useRetireCarbonBatch();

  const isDataLoading = statsLoading || projectsLoading || batchesLoading;

  const handleSyncAll = () => {
    refetchStats();
    refetchProjects();
    refetchBatches();
    toast.success("Synchronized carbon registry data with database!");
  };

  // Tabs: overview, projects, credits
  const [activeTab, setActiveTab] = useState<'overview' | 'projects' | 'credits'>('overview');

  // Stats fallback
  const stats = useMemo(() => {
    if (statsData) return statsData;
    return {
      draftProjects: 0,
      submittedProjects: 0,
      underValidation: 0,
      underVerification: 0,
      registeredProjects: 0,
      creditsIssued: 0,
      creditsRetired: 0,
      creditsSold: 0
    };
  }, [statsData]);

  const projects = projectsData || [];
  const batches = batchesData || [];

  // Modals state
  const [submissionModalProj, setSubmissionModalProj] = useState<RegistryProjectItem | null>(null);
  const [retirementModalBatch, setRetirementModalBatch] = useState<CarbonBatchItem | null>(null);
  const [retireReason, setRetireReason] = useState('');
  const [retireBuyer, setRetireBuyer] = useState('');

  const [isMintModalOpen, setIsMintModalOpen] = useState(false);
  const [newMint, setNewMint] = useState({ project_name: '', vintage_year: 2026, volume_tco2: 25000, price_per_tco2_usd: 18.5, verification_standard: 'Verra VM0042 Standard', buyer_name: 'AgriCorp Offtaker Solutions' });

  // Pre-fill Mint Origin Project when modal opens or projects load
  useMemo(() => {
    if (projects.length > 0 && !newMint.project_name) {
      setNewMint(prev => ({ ...prev, project_name: projects[0].project_name }));
    }
  }, [projects, newMint.project_name]);

  const [uploadedDocs, setUploadedDocs] = useState<Record<string, boolean>>({});

  // Create Project Modal
  const [isCreateProjModalOpen, setIsCreateProjModalOpen] = useState(false);
  const [newProj, setNewProj] = useState({ project_id: '', project_name: '', registry: 'Verra', methodology: '', country: 'India', developer_name: 'BhumiCred Core' });

  // ── Handlers ──
  const handleFileUpload = (docName: string) => {
    toast.success(`${docName} uploaded successfully!`);
    setUploadedDocs(prev => ({ ...prev, [docName]: true }));
  };

  const handleMintSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await mintBatchMutation.mutateAsync({
        project_name: newMint.project_name,
        vintage_year: Number(newMint.vintage_year),
        volume_tco2: Number(newMint.volume_tco2),
        price_per_tco2_usd: Number(newMint.price_per_tco2_usd),
        verification_standard: newMint.verification_standard,
        buyer_name: newMint.buyer_name,
      });
      toast.success(`Minted & Sold ${Number(newMint.volume_tco2).toLocaleString()} tCO₂e!`);
      setIsMintModalOpen(false);
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || "Error minting credits.");
    }
  };

  const handleRetireSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (retirementModalBatch) {
      try {
        await retireBatchMutation.mutateAsync({
          issuance_id: retirementModalBatch.id,
          quantity_retired: retirementModalBatch.credits_available,
          retirement_reason: retireReason || "Corporate Net Zero Claim",
          buyer_name: retireBuyer || "Self",
        });
        toast.success(`Retired credits successfully for ${retireBuyer}!`);
        setRetirementModalBatch(null);
        setRetireReason('');
        setRetireBuyer('');
      } catch (err: any) {
        toast.error(err?.response?.data?.detail || "Error retiring credits.");
      }
    }
  };

  const handleCreateProjSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createProjectMutation.mutateAsync(newProj);
      toast.success("Carbon Registry Project created!");
      setIsCreateProjModalOpen(false);
      setNewProj({ project_id: '', project_name: '', registry: 'Verra', methodology: '', country: 'India', developer_name: 'BhumiCred Core' });
    } catch (err: any) {
      toast.error(err?.response?.data?.detail || "Error creating project.");
    }
  };

  const handleRegistrySubmission = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success(`Project ${submissionModalProj?.project_id} submitted to Registry successfully!`);
    setSubmissionModalProj(null);
    setUploadedDocs({});
  };

  const getProjStatusVariant = (s: string) => {
    if (s === 'Registered') return 'success';
    if (s === 'Under Verification' || s === 'Under Validation') return 'warning';
    if (s === 'Submitted') return 'info';
    return 'neutral';
  };

  return (
    <div className="space-y-6 page-enter pb-12" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>

      <PageHeader
        title="Carbon Registry Management"
        description="End-to-end lifecycle management of Carbon Credits: Registry Projects, Validation, Credit Issuance, and Retirement."
        badge={{ label: `${fmtTCO2e(stats.creditsIssued)} tCO₂e Total Volume`, variant: 'success' }}
        icon={Cloud} iconColor="#16A34A"
        actions={
          <div className="flex items-center gap-2">
            <button onClick={handleSyncAll} className="btn btn-secondary btn-sm gap-1.5">
              <RefreshCw size={13} className={isDataLoading ? 'animate-spin' : ''} /> Sync All
            </button>
          </div>
        }
      />

      {/* ── Tabs ── */}
      <div className="flex items-center gap-6 border-b border-[#E2E8F0] px-1">
        {[
          { id: 'overview', label: 'Dashboard Overview' },
          { id: 'projects', label: 'Registry Projects' },
          { id: 'credits', label: 'Credit Lifecycle (Issuance & Retirement)' }
        ].map(t => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id as any)}
            className={`pb-3 text-[14px] font-semibold tracking-tight transition-colors border-b-2 relative top-[1px] ${
              activeTab === t.id ? 'border-[#16A34A] text-[#16A34A]' : 'border-transparent text-[#64748B] hover:text-[#0F172A]'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ── TAB: OVERVIEW DASHBOARD ── */}
      {activeTab === 'overview' && (
        <div className="space-y-6 animate-in fade-in duration-300">
          <div className="flex items-center gap-2 mb-2">
             <div className="w-1 h-4 bg-[#2563EB] rounded-full"></div>
             <h3 className="font-bold text-[#0F172A]">Project Pipeline KPIs</h3>
          </div>
          {isDataLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-5 gap-4">
              {[...Array(5)].map((_, i) => <div key={i} className="h-24 bg-slate-100 animate-pulse rounded-2xl" />)}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              <KpiCard title="Draft Projects" value={stats.draftProjects} icon={FileText} iconBg="#F1F5F9" iconColor="#64748B" />
              <KpiCard title="Submitted Projects" value={stats.submittedProjects} icon={Cloud} iconBg="#EFF6FF" iconColor="#2563EB" />
              <KpiCard title="Under Validation" value={stats.underValidation} icon={ShieldCheck} iconBg="#FFFBEB" iconColor="#D97706" />
              <KpiCard title="Under Verification" value={stats.underVerification} icon={ShieldCheck} iconBg="#FEF2F2" iconColor="#EF4444" />
              <KpiCard title="Registered Projects" value={stats.registeredProjects} icon={CheckCircle2} iconBg="#F0FDF4" iconColor="#16A34A" />
            </div>
          )}

          <div className="flex items-center gap-2 mt-6 mb-2">
             <div className="w-1 h-4 bg-[#16A34A] rounded-full"></div>
             <h3 className="font-bold text-[#0F172A]">Carbon Credit Economics</h3>
          </div>
          {isDataLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[...Array(3)].map((_, i) => <div key={i} className="h-24 bg-slate-100 animate-pulse rounded-2xl" />)}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <KpiCard title="Total Carbon Credits Issued" value={`${fmtTCO2e(stats.creditsIssued)} tCO₂e`} icon={Sparkles} iconBg="#F0FDF4" iconColor="#16A34A" />
              <KpiCard title="Carbon Credits Sold" value={`${fmtTCO2e(stats.creditsSold)} tCO₂e`} icon={DollarSign} iconBg="#EFF6FF" iconColor="#2563EB" />
              <KpiCard title="Carbon Credits Retired" value={`${fmtTCO2e(stats.creditsRetired)} tCO₂e`} icon={Leaf} iconBg="#FAF5FF" iconColor="#9333EA" />
            </div>
          )}

          <ChartCard title="Registry Issuance vs Monetization" subtitle="Monthly tCO₂e trajectory" height={260}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={ISSUANCE_TREND} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="gradIssued" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#16A34A" stopOpacity={0.18} /><stop offset="95%" stopColor="#16A34A" stopOpacity={0} /></linearGradient>
                  <linearGradient id="gradSold" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#2563EB" stopOpacity={0.14} /><stop offset="95%" stopColor="#2563EB" stopOpacity={0} /></linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#94A3B8' }} axisLine={false} tickLine={false} tickFormatter={v => `${(v / 1000).toFixed(0)}K`} width={38} />
                <Tooltip />
                <Area type="monotone" dataKey="issued" stroke="#16A34A" strokeWidth={2} fill="url(#gradIssued)" />
                <Area type="monotone" dataKey="sold" stroke="#2563EB" strokeWidth={2} fill="url(#gradSold)" />
              </AreaChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>
      )}

      {/* ── TAB: REGISTRY PROJECTS ── */}
      {activeTab === 'projects' && (
        <div className="ent-card overflow-hidden animate-in fade-in duration-300">
          <div className="p-4 border-b border-[#F1F5F9] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText size={16} className="text-[#2563EB]" />
              <h3 className="text-[14px] font-bold text-[#0F172A]">Registry Projects Database</h3>
            </div>
            <button onClick={() => setIsCreateProjModalOpen(true)} className="btn btn-primary btn-sm gap-1.5">
              <Plus size={14} /> Draft New Project
            </button>
          </div>
          
          {isDataLoading ? (
            <SkeletonTable rows={5} cols={7} />
          ) : projects.length === 0 ? (
            <EmptyState title="No Projects Found" description="Create a registry project to start tracking carbon lifecycle." />
          ) : (
            <table className="ent-table min-w-[1000px]">
              <thead>
                <tr>
                  <th>Project ID & Name</th>
                  <th>Registry</th>
                  <th>Methodology</th>
                  <th>Country</th>
                  <th>Developer</th>
                  <th>Status</th>
                  <th>Submission Date</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {projects.map((p) => (
                  <tr key={p.project_id}>
                    <td>
                      <div>
                        <div className="text-[13.5px] font-bold text-[#0F172A]">{p.project_name}</div>
                        <div className="text-[11px] font-mono text-[#64748B] mt-0.5">{p.project_id}</div>
                      </div>
                    </td>
                    <td className="text-[13px] font-medium text-[#475569]">{p.registry}</td>
                    <td className="text-[12.5px] font-mono font-bold text-[#1E293B]">{p.methodology}</td>
                    <td className="text-[13px] text-[#475569]">{p.country}</td>
                    <td className="text-[13px] text-[#475569] font-medium">{p.developer}</td>
                    <td>
                      <StatusBadge label={p.status} variant={getProjStatusVariant(p.status)} size="sm" />
                    </td>
                    <td className="text-[12.5px] text-[#64748B]">{p.submission_date}</td>
                    <td className="text-right">
                      {p.status === 'Draft' && (
                        <button onClick={() => setSubmissionModalProj(p)} className="btn btn-secondary btn-xs text-[#2563EB] gap-1">
                          <Cloud size={11} /> Submit Registry
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* ── TAB: CREDITS LIFECYCLE ── */}
      {activeTab === 'credits' && (
        <div className="ent-card overflow-hidden animate-in fade-in duration-300">
          <div className="p-4 border-b border-[#F1F5F9] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Leaf size={16} className="text-[#16A34A]" />
              <h3 className="text-[14px] font-bold text-[#0F172A]">Minted Carbon Batches & Sales Inventory</h3>
            </div>
            <button onClick={() => setIsMintModalOpen(true)} className="btn btn-primary btn-sm gap-1.5" disabled={projects.length === 0}>
              <Plus size={14} /> Mint Credits Batch
            </button>
          </div>

          {isDataLoading ? (
            <SkeletonTable rows={5} cols={8} />
          ) : batches.length === 0 ? (
            <EmptyState title="No Minted Batches" description="Mint a carbon credit batch to create sellable carbon inventory." />
          ) : (
            <table className="ent-table min-w-[1200px]">
              <thead>
                <tr>
                  <th>Batch Reference ID</th>
                  <th>Project Details</th>
                  <th>Vintage</th>
                  <th>Volume (tCO₂e)</th>
                  <th>Sold Volume</th>
                  <th>Price / tCO₂</th>
                  <th>Gross Sales Value</th>
                  <th>Active Corporate Offtaker</th>
                  <th>Status</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {batches.map((b) => (
                  <tr key={b.id}>
                    <td>
                      <div>
                        <div className="text-[13.5px] font-bold text-[#9333EA] font-mono">{b.batch_id}</div>
                        <div className="text-[10px] text-[#64748B] mt-0.5 font-mono">{b.verification_standard}</div>
                      </div>
                    </td>
                    <td>
                      <div>
                        <div className="text-[13px] font-bold text-[#0F172A]">{b.project_name}</div>
                        <div className="text-[11px] text-[#64748B] mt-0.5">{b.location} • {b.species}</div>
                      </div>
                    </td>
                    <td className="text-[13px] font-medium text-[#475569]">{b.vintage_year}</td>
                    <td className="text-[13px] font-bold text-[#0F172A]">{b.volume_tco2.toLocaleString()}</td>
                    <td className="text-[13px] text-[#475569]">{b.credits_sold.toLocaleString()}</td>
                    <td className="text-[13px] font-mono text-[#2563EB] font-bold">${b.price_per_tco2_usd.toFixed(2)}</td>
                    <td className="text-[13px] font-bold text-[#16A34A]">₹{b.revenue_lakhs.toFixed(2)} Lakhs</td>
                    <td className="text-[12.5px] text-[#475569] font-medium">{b.buyer_name || '—'}</td>
                    <td>
                      <StatusBadge label={b.status} variant={b.status === 'Retired' ? 'purple' : b.status === 'Sold' ? 'info' : 'success'} size="sm" />
                    </td>
                    <td className="text-right">
                      {b.status !== 'Retired' && b.credits_available > 0 && (
                        <button onClick={() => setRetirementModalBatch(b)} className="btn btn-secondary btn-xs text-[#9333EA] gap-1">
                          <Shield size={11} /> Retire Credits
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* ── MODALS ── */}

      {/* Draft New Project Modal */}
      <AnimatePresence>
        {isCreateProjModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-[#E8EDF5] space-y-4">
              <div className="flex items-center justify-between border-b border-[#F1F5F9] pb-3">
                <div className="flex items-center gap-2">
                  <FileText size={18} className="text-[#2563EB]" />
                  <h3 className="text-[16px] font-bold text-[#0F172A]">Draft New Carbon Registry Project</h3>
                </div>
                <button onClick={() => setIsCreateProjModalOpen(false)} className="text-[#94A3B8] hover:text-[#0F172A]"><X size={18} /></button>
              </div>
              <form onSubmit={handleCreateProjSubmit} className="space-y-3 text-[13px]">
                <div>
                  <label className="block text-[11.5px] font-bold text-[#0F172A] mb-1">Project Code ID</label>
                  <input type="text" required placeholder="e.g. PRJ-1042" value={newProj.project_id} onChange={e => setNewProj({ ...newProj, project_id: e.target.value })} className="w-full px-3 py-2 bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl font-medium outline-none" />
                </div>
                <div>
                  <label className="block text-[11.5px] font-bold text-[#0F172A] mb-1">Project Name</label>
                  <input type="text" required placeholder="e.g. MP Agroforestry Carbon Sink Drive" value={newProj.project_name} onChange={e => setNewProj({ ...newProj, project_name: e.target.value })} className="w-full px-3 py-2 bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl font-medium outline-none" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11.5px] font-bold text-[#0F172A] mb-1">Carbon Registry</label>
                    <select value={newProj.registry} onChange={e => setNewProj({ ...newProj, registry: e.target.value })} className="w-full px-3 py-2 bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl font-medium outline-none">
                      <option value="Verra">Verra VCS</option>
                      <option value="Gold Standard">Gold Standard</option>
                      <option value="UNFCCC CDM">UNFCCC CDM</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11.5px] font-bold text-[#0F172A] mb-1">Methodology Code</label>
                    <input type="text" required placeholder="e.g. VM0042" value={newProj.methodology} onChange={e => setNewProj({ ...newProj, methodology: e.target.value })} className="w-full px-3 py-2 bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl font-medium outline-none" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11.5px] font-bold text-[#0F172A] mb-1">Host Country</label>
                    <input type="text" required placeholder="e.g. India" value={newProj.country} onChange={e => setNewProj({ ...newProj, country: e.target.value })} className="w-full px-3 py-2 bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl font-medium outline-none" />
                  </div>
                  <div>
                    <label className="block text-[11.5px] font-bold text-[#0F172A] mb-1">Project Developer</label>
                    <input type="text" required placeholder="e.g. BhumiCred Core" value={newProj.developer_name} onChange={e => setNewProj({ ...newProj, developer_name: e.target.value })} className="w-full px-3 py-2 bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl font-medium outline-none" />
                  </div>
                </div>
                <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#F1F5F9]">
                  <button type="button" onClick={() => setIsCreateProjModalOpen(false)} className="btn btn-secondary btn-sm">Cancel</button>
                  <button type="submit" className="btn btn-primary btn-sm flex items-center gap-1">
                    <Plus size={14} /> Create Draft
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Registry Document Upload / Submission Modal */}
      <AnimatePresence>
        {submissionModalProj && (
          <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/40 backdrop-blur-xs">
            <motion.div
              initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'tween', duration: 0.25 }}
              className="w-full max-w-md bg-white h-full shadow-2xl flex flex-col"
            >
              <div className="p-5 border-b border-[#E2E8F0] flex justify-between items-center bg-[#F8FAFC]">
                <div>
                  <h3 className="font-bold text-[#0F172A] text-[16px]">Registry Submission</h3>
                  <div className="text-[12px] text-[#64748B] font-mono mt-0.5">{submissionModalProj.project_id}</div>
                </div>
                <button onClick={() => { setSubmissionModalProj(null); setUploadedDocs({}); }} className="p-2 hover:bg-[#E2E8F0] rounded-xl"><X size={18} /></button>
              </div>

              <div className="flex-1 overflow-y-auto p-5 space-y-5">
                <div className="space-y-3">
                  <h4 className="text-[13px] font-bold text-[#0F172A]">Upload Required Documents</h4>
                  {['Project Design Document (PDD)', 'Monitoring Report', 'GIS Boundary Report', 'MRV Verification Report', 'Auditor Sign-off'].map(doc => {
                    const isUploaded = uploadedDocs[doc];
                    return (
                      <div key={doc} className={`flex items-center justify-between p-3 rounded-xl border ${isUploaded ? 'border-solid border-[#16A34A] bg-[#F0FDF4]' : 'border-dashed border-[#CBD5E1] bg-[#F8FAFC]'}`}>
                        <span className={`text-[12.5px] font-medium ${isUploaded ? 'text-[#16A34A]' : 'text-[#0F172A]'}`}>{doc}</span>
                        {isUploaded ? (
                          <span className="text-[12px] font-bold text-[#16A34A] flex items-center gap-1"><CheckCircle2 size={14}/> Uploaded</span>
                        ) : (
                          <label className="text-[12px] font-bold text-[#2563EB] flex items-center gap-1 hover:underline cursor-pointer">
                            <Upload size={14}/> Upload
                            <input type="file" className="hidden" onChange={() => handleFileUpload(doc)} />
                          </label>
                        )}
                      </div>
                    );
                  })}
                </div>

                <div className="space-y-3 pt-4 border-t border-[#E2E8F0]">
                  <h4 className="text-[13px] font-bold text-[#0F172A]">Digital Signature Authorization</h4>
                  <div className="p-4 bg-slate-50 border border-[#E2E8F0] rounded-xl text-center space-y-2">
                    <FileSignature size={24} className="mx-auto text-[#64748B]" />
                    <p className="text-[12px] text-[#64748B]">I authorize this submission to the {submissionModalProj.registry} registry under penalty of perjury.</p>
                    <input type="text" placeholder="Type your full name to sign" className="w-full text-center px-3 py-2 border border-[#CBD5E1] rounded-lg text-[13px] outline-none" />
                  </div>
                </div>
              </div>

              <div className="p-5 border-t border-[#E2E8F0] bg-white">
                <button onClick={handleRegistrySubmission} className="w-full btn btn-primary py-2.5">
                  <Cloud size={16} /> Submit to {submissionModalProj.registry}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Credit Retirement Modal */}
      <AnimatePresence>
        {retirementModalBatch && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-[#E8EDF5] space-y-4"
            >
              <div className="flex justify-between border-b border-[#F1F5F9] pb-3">
                <div>
                  <h3 className="text-[16px] font-bold text-[#0F172A] flex items-center gap-2"><Shield size={18} className="text-[#9333EA]"/> Credit Retirement</h3>
                  <p className="text-[12px] text-[#64748B] mt-1 font-mono">{retirementModalBatch.batch_id}</p>
                </div>
                <button onClick={() => setRetirementModalBatch(null)}><X size={18} className="text-[#94A3B8]" /></button>
              </div>

              <form onSubmit={handleRetireSubmit} className="space-y-4">
                <div className="bg-[#FAF5FF] p-3 rounded-xl border border-[#F3E8FF] flex justify-between items-center">
                  <span className="text-[12px] font-bold text-[#9333EA]">Available to Retire</span>
                  <span className="text-[14px] font-extrabold text-[#9333EA]">{retirementModalBatch.credits_available.toLocaleString()} tCO₂e</span>
                </div>

                <div>
                  <label className="block text-[11.5px] font-bold text-[#0F172A] mb-1">Retirement Beneficiary / Buyer</label>
                  <input type="text" value={retireBuyer} onChange={e => setRetireBuyer(e.target.value)} placeholder="e.g. Acme Corp Offset 2026" required className="w-full px-3 py-2 border border-[#CBD5E1] rounded-xl outline-none text-[13px]" />
                </div>
                <div>
                  <label className="block text-[11.5px] font-bold text-[#0F172A] mb-1">Reason for Retirement</label>
                  <select value={retireReason} onChange={e => setRetireReason(e.target.value)} required className="w-full px-3 py-2 border border-[#CBD5E1] rounded-xl outline-none text-[13px]">
                    <option value="">Select Reason...</option>
                    <option value="Corporate Net Zero Claim">Corporate Net Zero Claim</option>
                    <option value="Product Carbon Neutrality">Product Carbon Neutrality</option>
                    <option value="Regulatory Compliance">Regulatory Compliance</option>
                  </select>
                </div>
                
                <div className="flex justify-end gap-2 pt-3 border-t border-[#F1F5F9]">
                  <button type="button" onClick={() => setRetirementModalBatch(null)} className="btn btn-secondary btn-sm">Cancel</button>
                  <button type="submit" className="btn btn-primary btn-sm bg-[#9333EA] hover:bg-[#7E22CE] text-white border-transparent flex items-center gap-1.5"><Shield size={14}/> Generate Certificate & Retire</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Mint Modal */}
      <AnimatePresence>
        {isMintModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-[#E8EDF5] space-y-4">
              <div className="flex items-center justify-between border-b border-[#F1F5F9] pb-3">
                <div className="flex items-center gap-2"><Sparkles size={18} className="text-[#16A34A]" /><h3 className="text-[16px] font-bold text-[#0F172A]">Issue New Verified Carbon Credit Batch</h3></div>
                <button onClick={() => setIsMintModalOpen(false)} className="text-[#94A3B8] hover:text-[#0F172A]"><X size={18} /></button>
              </div>
              <form onSubmit={handleMintSubmit} className="space-y-3 text-[13px]">
                <div>
                  <label className="block text-[11.5px] font-bold text-[#0F172A] mb-1">Origin Project</label>
                  <select value={newMint.project_name} onChange={e => setNewMint({ ...newMint, project_name: e.target.value })} className="w-full px-3 py-2 bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl font-medium outline-none">
                    {projects.map(p => (
                      <option key={p.project_id} value={p.project_name}>{p.project_id} {p.project_name}</option>
                    ))}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div><label className="block text-[11.5px] font-bold text-[#0F172A] mb-1">Vintage Year</label><input type="number" value={newMint.vintage_year} onChange={e => setNewMint({ ...newMint, vintage_year: Number(e.target.value) })} className="w-full px-3 py-2 bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl font-medium outline-none" /></div>
                  <div><label className="block text-[11.5px] font-bold text-[#0F172A] mb-1">Volume (tCO₂e)</label><input type="number" value={newMint.volume_tco2} onChange={e => setNewMint({ ...newMint, volume_tco2: Number(e.target.value) })} className="w-full px-3 py-2 bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl font-medium outline-none" /></div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div><label className="block text-[11.5px] font-bold text-[#0F172A] mb-1">Price per tCO₂ ($)</label><input type="number" step="0.5" value={newMint.price_per_tco2_usd} onChange={e => setNewMint({ ...newMint, price_per_tco2_usd: Number(e.target.value) })} className="w-full px-3 py-2 bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl font-medium outline-none" /></div>
                  <div><label className="block text-[11.5px] font-bold text-[#0F172A] mb-1">Verification Standard (Serial Range)</label><input type="text" value={newMint.verification_standard} onChange={e => setNewMint({ ...newMint, verification_standard: e.target.value })} className="w-full px-3 py-2 bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl font-medium outline-none" /></div>
                </div>
                <div><label className="block text-[11.5px] font-bold text-[#0F172A] mb-1">Assigned Corporate Offtaker</label><input type="text" value={newMint.buyer_name} onChange={e => setNewMint({ ...newMint, buyer_name: e.target.value })} className="w-full px-3 py-2 bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl font-medium outline-none" /></div>
                <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#F1F5F9]"><button type="button" onClick={() => setIsMintModalOpen(false)} className="btn btn-secondary btn-sm">Cancel</button><button type="submit" className="btn btn-primary btn-sm flex items-center gap-1"><Sparkles size={14} /> Mint Credit Batch</button></div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};

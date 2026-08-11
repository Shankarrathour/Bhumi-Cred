import { useMemo, useState } from 'react';
import {
  Cloud, DownloadCloud, RefreshCw, CheckCircle2,
  Eye, Leaf, Sparkles, DollarSign, Plus, X,
  FileText, ShieldCheck, Map, Activity, Shield, Upload, FileSignature
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
import { useTreeRegistrations } from '../api/useCarbonRegistry';

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

// ── Types ──
export interface CarbonBatchItem {
  id: string; batch_id: string; project_name: string; project_code: string; vintage_year: number; species: string; location: string;
  volume_tco2: number; credits_issued: number; credits_sold: number; credits_available: number; buyer_name: string;
  price_per_tco2_usd: number; revenue_lakhs: number; verification_standard: string; status: 'Issued' | 'Sold' | 'Pending Verification' | 'Retired'; created_at: string;
}

export interface RegistryProjectItem {
  project_id: string; project_name: string; registry: string; methodology: string; country: string; status: 'Draft' | 'Submitted' | 'Under Validation' | 'Under Verification' | 'Registered';
  developer: string; submission_date: string;
}

// ── Mocks ──
const MOCK_REGISTRY_PROJECTS: RegistryProjectItem[] = [
  { project_id: 'PRJ-1042', project_name: 'MP Agroforestry Carbon Sink Drive', registry: 'Verra', methodology: 'VM0042', country: 'India', status: 'Registered', developer: 'BhumiCred Core', submission_date: '10 Jan 2026' },
  { project_id: 'PRJ-2089', project_name: 'Gujarat Coastal Mangrove Reforestation', registry: 'Gold Standard', methodology: 'AR-AM0014', country: 'India', status: 'Under Verification', developer: 'EcoDev NGO', submission_date: '05 Mar 2026' },
  { project_id: 'PRJ-3041', project_name: 'Maharashtra Farmer Biochar Sequestration', registry: 'Puro.earth', methodology: 'Biochar V1.1', country: 'India', status: 'Under Validation', developer: 'BhumiCred SoilTech', submission_date: '22 May 2026' },
  { project_id: 'PRJ-4012', project_name: 'Rajasthan Arid Agro-Forestry Belt', registry: 'Verra', methodology: 'ARR Protocol', country: 'India', status: 'Submitted', developer: 'Green Desert Initiative', submission_date: '12 Jul 2026' },
  { project_id: 'PRJ-5099', project_name: 'UP Bamboo Biomass Generation', registry: 'U.N. CDM', methodology: 'AMS-III.D', country: 'India', status: 'Draft', developer: 'BhumiCred Core', submission_date: '-' },
];

const SEEDED_BATCHES: CarbonBatchItem[] = [
  { id: 'CRD-9001', batch_id: 'BCH-CRD-9001', project_name: 'MP Agroforestry Carbon Sink Drive', project_code: 'PRJ-1042', vintage_year: 2025, species: 'Teak & Bamboo', location: 'Sehore, MP', volume_tco2: 150000, credits_issued: 150000, credits_sold: 120000, credits_available: 30000, buyer_name: 'AgriCorp Offtaker Solutions', price_per_tco2_usd: 18.5, revenue_lakhs: 222.0, verification_standard: 'Verra VM0042 Standard', status: 'Issued', created_at: '01 Aug 2026' },
  { id: 'CRD-9002', batch_id: 'BCH-CRD-9002', project_name: 'Gujarat Coastal Mangrove Reforestation', project_code: 'PRJ-2089', vintage_year: 2025, species: 'Avicennia Mangroves', location: 'Kutch, Gujarat', volume_tco2: 85000, credits_issued: 85000, credits_sold: 85000, credits_available: 0, buyer_name: 'EcoShield Climate Corp', price_per_tco2_usd: 22.0, revenue_lakhs: 149.6, verification_standard: 'Gold Standard Blue Carbon', status: 'Sold', created_at: '28 Jul 2026' },
  { id: 'CRD-9003', batch_id: 'BCH-CRD-9003', project_name: 'Maharashtra Farmer Biochar Sequestration', project_code: 'PRJ-3041', vintage_year: 2026, species: 'Soil Biochar Organic', location: 'Nashik, MH', volume_tco2: 60000, credits_issued: 60000, credits_sold: 25000, credits_available: 35000, buyer_name: 'CarbonX Global Offtakers', price_per_tco2_usd: 19.0, revenue_lakhs: 91.2, verification_standard: 'Puro.earth Biochar Standard', status: 'Issued', created_at: '15 Jul 2026' },
  { id: 'CRD-9004', batch_id: 'BCH-CRD-9004', project_name: 'Rajasthan Arid Agro-Forestry Belt', project_code: 'PRJ-4012', vintage_year: 2024, species: 'Acacia & Khejri', location: 'Barmer, RJ', volume_tco2: 45000, credits_issued: 45000, credits_sold: 45000, credits_available: 0, buyer_name: 'GreenFields Sustainability Fund', price_per_tco2_usd: 16.5, revenue_lakhs: 59.4, verification_standard: 'Verra ARR Protocol', status: 'Retired', created_at: '02 Jun 2026' },
];

export const CarbonRegistry = () => {
  const navigate = useNavigate();
  const { isLoading, refetch } = useTreeRegistrations();
  
  // Tabs: overview, projects, credits
  const [activeTab, setActiveTab] = useState<'overview' | 'projects' | 'credits'>('overview');

  const [projects] = useState<RegistryProjectItem[]>(MOCK_REGISTRY_PROJECTS);
  const [batches, setBatches] = useState<CarbonBatchItem[]>(SEEDED_BATCHES);

  // Stats for Dashboard Tab
  const stats = useMemo(() => {
    return {
      draftProjects: projects.filter(p => p.status === 'Draft').length,
      submittedProjects: projects.filter(p => p.status === 'Submitted').length,
      underValidation: projects.filter(p => p.status === 'Under Validation').length,
      underVerification: projects.filter(p => p.status === 'Under Verification').length,
      registeredProjects: projects.filter(p => p.status === 'Registered').length,
      creditsIssued: batches.reduce((acc, b) => acc + (b.credits_issued || 0), 0),
      creditsRetired: batches.filter(b => b.status === 'Retired').reduce((acc, b) => acc + (b.volume_tco2 || 0), 0),
      creditsSold: batches.reduce((acc, b) => acc + (b.credits_sold || 0), 0),
    };
  }, [projects, batches]);

  // Modals state
  const [submissionModalProj, setSubmissionModalProj] = useState<RegistryProjectItem | null>(null);
  const [retirementModalBatch, setRetirementModalBatch] = useState<CarbonBatchItem | null>(null);
  const [retireReason, setRetireReason] = useState('');
  const [retireBuyer, setRetireBuyer] = useState('');

  const [isMintModalOpen, setIsMintModalOpen] = useState(false);
  const [newMint, setNewMint] = useState({ project_name: 'MP Agroforestry Carbon Sink Drive', vintage_year: 2026, volume_tco2: 25000, price_per_tco2_usd: 18.5, verification_standard: 'Verra VM0042 Standard', buyer_name: 'AgriCorp Offtaker Solutions' });

  const [uploadedDocs, setUploadedDocs] = useState<Record<string, boolean>>({});

  // ── Functions ──
  const handleFileUpload = (docName: string) => {
    toast.success(`${docName} uploaded successfully!`);
    setUploadedDocs(prev => ({ ...prev, [docName]: true }));
  };
  const handleMintSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const created: CarbonBatchItem = {
      id: `CRD-${Math.floor(9000 + Math.random() * 900)}`, batch_id: `BCH-CRD-${Math.floor(9000 + Math.random() * 900)}`,
      project_name: newMint.project_name, project_code: 'PRJ-1042', vintage_year: Number(newMint.vintage_year),
      species: 'Mixed', location: 'India', volume_tco2: Number(newMint.volume_tco2), credits_issued: Number(newMint.volume_tco2),
      credits_sold: 0, credits_available: Number(newMint.volume_tco2), buyer_name: newMint.buyer_name, price_per_tco2_usd: Number(newMint.price_per_tco2_usd),
      revenue_lakhs: (Number(newMint.volume_tco2) * Number(newMint.price_per_tco2_usd) * 80) / 100000,
      verification_standard: newMint.verification_standard, status: 'Issued',
      created_at: new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
    };
    setBatches(prev => [created, ...prev]);
    toast.success(`Minted ${created.volume_tco2.toLocaleString()} tCO₂e!`);
    setIsMintModalOpen(false);
  };

  const handleRetireSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (retirementModalBatch) {
      setBatches(prev => prev.map(b => b.id === retirementModalBatch.id ? { ...b, status: 'Retired', credits_available: 0, credits_sold: b.credits_issued } : b));
      toast.success(`Carbon Credits from ${retirementModalBatch.batch_id} successfully retired for ${retireBuyer || 'Self'}. Certificate generated!`);
      setRetirementModalBatch(null);
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
    return 'default';
  };
  
  const getBatchStatusVariant = (s: string) => {
    if (s === 'Issued') return 'success';
    if (s === 'Sold') return 'info';
    if (s === 'Retired') return 'purple';
    return 'warning';
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
            <button onClick={() => refetch()} className="btn btn-secondary btn-sm gap-1.5"><RefreshCw size={13} className={isLoading ? 'animate-spin' : ''} /> Sync All</button>
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <KpiCard title="Draft Projects" value={stats.draftProjects} icon={FileText} iconBg="#F1F5F9" iconColor="#64748B" />
            <KpiCard title="Submitted Projects" value={stats.submittedProjects} icon={Cloud} iconBg="#EFF6FF" iconColor="#2563EB" />
            <KpiCard title="Under Validation" value={stats.underValidation} icon={Shield} iconBg="#FFFBEB" iconColor="#D97706" />
            <KpiCard title="Under Verification" value={stats.underVerification} icon={ShieldCheck} iconBg="#FEF2F2" iconColor="#EF4444" />
            <KpiCard title="Registered Projects" value={stats.registeredProjects} icon={CheckCircle2} iconBg="#F0FDF4" iconColor="#16A34A" />
          </div>

          <div className="flex items-center gap-2 mt-6 mb-2">
             <div className="w-1 h-4 bg-[#16A34A] rounded-full"></div>
             <h3 className="font-bold text-[#0F172A]">Carbon Credit Economics</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <KpiCard title="Total Carbon Credits Issued" value={`${fmtTCO2e(stats.creditsIssued)} tCO₂e`} icon={Sparkles} iconBg="#F0FDF4" iconColor="#16A34A" />
            <KpiCard title="Carbon Credits Sold" value={`${fmtTCO2e(stats.creditsSold)} tCO₂e`} icon={DollarSign} iconBg="#EFF6FF" iconColor="#2563EB" />
            <KpiCard title="Carbon Credits Retired" value={`${fmtTCO2e(stats.creditsRetired)} tCO₂e`} icon={Leaf} iconBg="#FAF5FF" iconColor="#9333EA" />
          </div>

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
            <button className="btn btn-primary btn-sm gap-1.5"><Plus size={14} /> Draft New Project</button>
          </div>
          
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
              {projects.map(p => (
                <tr key={p.project_id}>
                  <td>
                    <div className="font-bold text-[13px] text-[#0F172A]">{p.project_name}</div>
                    <div className="font-mono text-[11px] text-[#64748B]">{p.project_id}</div>
                  </td>
                  <td><span className="font-semibold text-[#0F172A] text-[12px]">{p.registry}</span></td>
                  <td><span className="bg-[#F1F5F9] px-2 py-0.5 rounded text-[11.5px] font-mono">{p.methodology}</span></td>
                  <td>{p.country}</td>
                  <td><div className="text-[12px]">{p.developer}</div></td>
                  <td><StatusBadge label={p.status} variant={getProjStatusVariant(p.status) as any} size="sm" /></td>
                  <td className="text-[#64748B] text-[12.5px]">{p.submission_date}</td>
                  <td className="text-right">
                    <button 
                      onClick={() => setSubmissionModalProj(p)}
                      className="px-3 py-1.5 bg-[#EFF6FF] hover:bg-[#DBEAFE] text-[#2563EB] text-[11.5px] font-bold rounded-lg transition-colors flex items-center gap-1 ml-auto"
                    >
                      <Upload size={13} /> Registry Submission
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ── TAB: CREDIT LIFECYCLE ── */}
      {activeTab === 'credits' && (
        <div className="ent-card overflow-hidden animate-in fade-in duration-300">
          <div className="p-4 border-b border-[#F1F5F9] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Leaf size={16} className="text-[#16A34A]" />
              <h3 className="text-[14px] font-bold text-[#0F172A]">Credit Issuance & Retirement Ledger</h3>
            </div>
            <button onClick={() => setIsMintModalOpen(true)} className="btn btn-primary btn-sm gap-1.5">
              <Plus size={14} /> Issue New Credit Batch
            </button>
          </div>
          
          <table className="ent-table min-w-[1100px]">
            <thead>
              <tr>
                <th>Batch / Serial No.</th>
                <th>Project & Vintage</th>
                <th>Volume (tCO₂e)</th>
                <th>Corporate Buyer</th>
                <th>Standard</th>
                <th>Status</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {batches.map(b => (
                <tr key={b.id}>
                  <td>
                    <span className="font-mono text-[12px] text-[#2563EB] font-bold bg-[#EFF6FF] px-2.5 py-1 rounded-lg border border-[#DBEAFE]">
                      {b.batch_id}
                    </span>
                  </td>
                  <td>
                    <div className="text-[13px] font-bold text-[#0F172A]">{b.project_name}</div>
                    <div className="text-[11px] font-mono text-[#64748B]">Vintage {b.vintage_year}</div>
                  </td>
                  <td>
                    <div className="text-[13.5px] font-extrabold text-[#16A34A]">{b.volume_tco2.toLocaleString()} tCO₂e</div>
                    <div className="text-[10.5px] text-[#94A3B8] font-mono">Available: {b.credits_available.toLocaleString()}</div>
                  </td>
                  <td>
                    <div className="text-[12.5px] font-bold text-[#0F172A]">{b.buyer_name}</div>
                  </td>
                  <td><span className="px-2 py-0.5 bg-[#F8FAFC] text-[#0F172A] border border-[#CBD5E1] rounded-md text-[11px] font-bold">{b.verification_standard}</span></td>
                  <td><StatusBadge label={b.status} variant={getBatchStatusVariant(b.status) as any} size="sm" /></td>
                  <td className="text-right flex items-center justify-end gap-2">
                    {b.status !== 'Retired' && (
                      <button 
                        onClick={() => setRetirementModalBatch(b)}
                        className="px-3 py-1.5 bg-[#FAF5FF] hover:bg-[#F3E8FF] text-[#9333EA] text-[11.5px] font-bold rounded-lg transition-colors flex items-center gap-1"
                      >
                        <Shield size={13} /> Retire Credits
                      </button>
                    )}
                    <button 
                      onClick={() => navigate(`/carbon/${b.id}`)}
                      className="p-1.5 text-[#64748B] hover:text-[#0F172A] hover:bg-[#F1F5F9] rounded-lg transition-colors"
                    >
                      <Eye size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ── MODALS ── */}

      {/* Registry Submission Side Modal */}
      <AnimatePresence>
        {submissionModalProj && (
          <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/40 backdrop-blur-xs">
            <motion.div
              initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ bounce: 0, duration: 0.25 }}
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

      {/* Mint Modal (Existing) */}
      <AnimatePresence>
        {isMintModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-[#E8EDF5] space-y-4">
              <div className="flex items-center justify-between border-b border-[#F1F5F9] pb-3">
                <div className="flex items-center gap-2"><Sparkles size={18} className="text-[#16A34A]" /><h3 className="text-[16px] font-bold text-[#0F172A]">Issue New Verified Carbon Credit Batch</h3></div>
                <button onClick={() => setIsMintModalOpen(false)} className="text-[#94A3B8] hover:text-[#0F172A]"><X size={18} /></button>
              </div>
              <form onSubmit={handleMintSubmit} className="space-y-3 text-[13px]">
                <div><label className="block text-[11.5px] font-bold text-[#0F172A] mb-1">Origin Project</label><select value={newMint.project_name} onChange={e => setNewMint({ ...newMint, project_name: e.target.value })} className="w-full px-3 py-2 bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl font-medium outline-none"><option value="MP Agroforestry Carbon Sink Drive">PRJ-1042 MP Agroforestry Carbon Sink Drive</option></select></div>
                <div className="grid grid-cols-2 gap-3">
                  <div><label className="block text-[11.5px] font-bold text-[#0F172A] mb-1">Vintage Year</label><input type="number" value={newMint.vintage_year} onChange={e => setNewMint({ ...newMint, vintage_year: Number(e.target.value) })} className="w-full px-3 py-2 bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl font-medium outline-none" /></div>
                  <div><label className="block text-[11.5px] font-bold text-[#0F172A] mb-1">Volume (tCO₂e)</label><input type="number" value={newMint.volume_tco2} onChange={e => setNewMint({ ...newMint, volume_tco2: Number(e.target.value) })} className="w-full px-3 py-2 bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl font-medium outline-none" /></div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div><label className="block text-[11.5px] font-bold text-[#0F172A] mb-1">Price per tCO₂ ($)</label><input type="number" step="0.5" value={newMint.price_per_tco2_usd} onChange={e => setNewMint({ ...newMint, price_per_tco2_usd: Number(e.target.value) })} className="w-full px-3 py-2 bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl font-medium outline-none" /></div>
                  <div><label className="block text-[11.5px] font-bold text-[#0F172A] mb-1">Verification Standard</label><select value={newMint.verification_standard} onChange={e => setNewMint({ ...newMint, verification_standard: e.target.value })} className="w-full px-3 py-2 bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl font-medium outline-none"><option value="Verra VM0042 Standard">Verra VM0042 Standard</option></select></div>
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

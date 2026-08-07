import { useMemo, useState } from 'react';
import {
  Cloud, DownloadCloud, RefreshCw, CheckCircle2,
  Eye, Leaf, Sparkles, DollarSign, Plus, X
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
import { useTreeRegistrations } from '../api/useCarbonRegistry';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

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

const fmtTCO2e = (n: number) =>
  n >= 1_000_000 ? `${(n / 1_000_000).toFixed(2)}M` : n >= 1_000 ? `${(n / 1_000).toFixed(1)}K` : n.toFixed(1);

export interface CarbonBatchItem {
  id: string;
  batch_id: string;
  project_name: string;
  project_code: string;
  vintage_year: number;
  species: string;
  location: string;
  volume_tco2: number;
  credits_issued: number;
  credits_sold: number;
  credits_available: number;
  buyer_name: string;
  price_per_tco2_usd: number;
  revenue_lakhs: number;
  verification_standard: string;
  status: 'Issued' | 'Sold' | 'Pending Verification' | 'Retired';
  created_at: string;
}

const SEEDED_BATCHES: CarbonBatchItem[] = [
  {
    id: 'CRD-9001',
    batch_id: 'BCH-CRD-9001',
    project_name: 'MP Agroforestry Carbon Sink Drive',
    project_code: 'PRJ-1042',
    vintage_year: 2025,
    species: 'Teak & Bamboo',
    location: 'Sehore, Madhya Pradesh',
    volume_tco2: 150000,
    credits_issued: 150000,
    credits_sold: 120000,
    credits_available: 30000,
    buyer_name: 'AgriCorp Offtaker Solutions',
    price_per_tco2_usd: 18.5,
    revenue_lakhs: 222.0,
    verification_standard: 'Verra VM0042 Standard',
    status: 'Issued',
    created_at: '01 Aug 2026',
  },
  {
    id: 'CRD-9002',
    batch_id: 'BCH-CRD-9002',
    project_name: 'Gujarat Coastal Mangrove Reforestation',
    project_code: 'PRJ-2089',
    vintage_year: 2025,
    species: 'Avicennia Mangroves',
    location: 'Kutch, Gujarat',
    volume_tco2: 85000,
    credits_issued: 85000,
    credits_sold: 85000,
    credits_available: 0,
    buyer_name: 'EcoShield Climate Corp',
    price_per_tco2_usd: 22.0,
    revenue_lakhs: 149.6,
    verification_standard: 'Gold Standard Blue Carbon',
    status: 'Sold',
    created_at: '28 Jul 2026',
  },
  {
    id: 'CRD-9003',
    batch_id: 'BCH-CRD-9003',
    project_name: 'Maharashtra Farmer Biochar Sequestration',
    project_code: 'PRJ-3041',
    vintage_year: 2026,
    species: 'Soil Biochar Organic',
    location: 'Nashik, Maharashtra',
    volume_tco2: 60000,
    credits_issued: 60000,
    credits_sold: 25000,
    credits_available: 35000,
    buyer_name: 'CarbonX Global Offtakers',
    price_per_tco2_usd: 19.0,
    revenue_lakhs: 91.2,
    verification_standard: 'Puro.earth Biochar Standard',
    status: 'Issued',
    created_at: '15 Jul 2026',
  },
  {
    id: 'CRD-9004',
    batch_id: 'BCH-CRD-9004',
    project_name: 'Rajasthan Arid Agro-Forestry Belt',
    project_code: 'PRJ-4012',
    vintage_year: 2024,
    species: 'Acacia & Khejri',
    location: 'Barmer, Rajasthan',
    volume_tco2: 45000,
    credits_issued: 45000,
    credits_sold: 45000,
    credits_available: 0,
    buyer_name: 'GreenFields Sustainability Fund',
    price_per_tco2_usd: 16.5,
    revenue_lakhs: 59.4,
    verification_standard: 'Verra ARR Protocol',
    status: 'Retired',
    created_at: '02 Jun 2026',
  },
];

export const CarbonRegistry = () => {
  const navigate = useNavigate();
  const { isLoading, refetch } = useTreeRegistrations();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [batches, setBatches] = useState<CarbonBatchItem[]>(SEEDED_BATCHES);

  // Mint Credit Modal State
  const [isMintModalOpen, setIsMintModalOpen] = useState(false);
  const [newMint, setNewMint] = useState({
    project_name: 'MP Agroforestry Carbon Sink Drive',
    vintage_year: 2026,
    volume_tco2: 25000,
    price_per_tco2_usd: 18.5,
    verification_standard: 'Verra VM0042 Standard',
    buyer_name: 'AgriCorp Offtaker Solutions',
  });

  const filtered = useMemo(() => {
    return batches.filter(b => {
      const q = search.toLowerCase();
      const matchSearch = !q || [
        b.batch_id, b.project_name, b.project_code, b.location, b.buyer_name, b.species
      ].some(v => v?.toLowerCase().includes(q));

      const matchStatus = !statusFilter || b.status.toLowerCase() === statusFilter.toLowerCase();
      return matchSearch && matchStatus;
    });
  }, [batches, search, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pageRows = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const totalIssued = batches.reduce((acc, b) => acc + (b.credits_issued || 0), 0);
  const totalSold = batches.reduce((acc, b) => acc + (b.credits_sold || 0), 0);
  const totalAvailable = batches.reduce((acc, b) => acc + (b.credits_available || 0), 0);
  const totalRevenue = batches.reduce((acc, b) => acc + (b.revenue_lakhs || 0), 0);

  const handleMintSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const created: CarbonBatchItem = {
      id: `CRD-${Math.floor(9000 + Math.random() * 900)}`,
      batch_id: `BCH-CRD-${Math.floor(9000 + Math.random() * 900)}`,
      project_name: newMint.project_name,
      project_code: 'PRJ-1042',
      vintage_year: Number(newMint.vintage_year),
      species: 'Teak & Bamboo',
      location: 'Sehore, Madhya Pradesh',
      volume_tco2: Number(newMint.volume_tco2),
      credits_issued: Number(newMint.volume_tco2),
      credits_sold: 0,
      credits_available: Number(newMint.volume_tco2),
      buyer_name: newMint.buyer_name,
      price_per_tco2_usd: Number(newMint.price_per_tco2_usd),
      revenue_lakhs: (Number(newMint.volume_tco2) * Number(newMint.price_per_tco2_usd) * 80) / 100000,
      verification_standard: newMint.verification_standard,
      status: 'Issued',
      created_at: new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
    };

    setBatches(prev => [created, ...prev]);
    toast.success(`Minted ${created.volume_tco2.toLocaleString()} tCO₂e Carbon Credits! Batch: ${created.batch_id}`);
    setIsMintModalOpen(false);
  };

  const handleExport = () => {
    const csv = [
      ['Batch ID', 'Project Name', 'Vintage', 'Species', 'Location', 'Volume (tCO2e)', 'Sold', 'Available', 'Buyer', 'Revenue (Lakhs)', 'Status'],
      ...filtered.map(b => [b.batch_id, b.project_name, b.vintage_year, b.species, b.location, b.volume_tco2, b.credits_sold, b.credits_available, b.buyer_name, b.revenue_lakhs, b.status]),
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'bhumi-carbon-registry.csv'; a.click();
    URL.revokeObjectURL(url);
    toast.success('Carbon Credit Registry exported cleanly to CSV!');
  };

  const getStatusVariant = (s: string) => {
    if (s === 'Issued') return 'success';
    if (s === 'Sold') return 'info';
    if (s === 'Retired') return 'purple';
    return 'warning';
  };

  return (
    <div className="space-y-6 page-enter pb-12" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>

      {/* ── Page Header ── */}
      <PageHeader
        title="Carbon Credit Registry & Offsetting Ledger"
        description="Module 9: Issue, Verify, Mint, Trade, & Retire Carbon Credits across Verra, Gold Standard & Bhumi Registries."
        badge={{ label: `${fmtTCO2e(totalIssued)} tCO₂e Issued`, variant: 'success' }}
        icon={Cloud}
        iconColor="#16A34A"
        actions={
          <div className="flex items-center gap-2">
            <button onClick={() => refetch()} className="btn btn-secondary btn-sm gap-1.5 cursor-pointer">
              <RefreshCw size={13} className={isLoading ? 'animate-spin' : ''} /> Sync Registry
            </button>
            <button onClick={handleExport} className="btn btn-secondary btn-sm gap-1.5 cursor-pointer">
              <DownloadCloud size={14} /> Export Registry
            </button>
            <button onClick={() => setIsMintModalOpen(true)} className="btn btn-primary btn-sm gap-1.5 cursor-pointer">
              <Plus size={14} /> Issue New Credit Batch
            </button>
          </div>
        }
      />

      {/* ── BRD CARBON CREDIT KPI METRIC CARDS ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard title="TOTAL CREDITS ISSUED" value={`${fmtTCO2e(totalIssued)} tCO₂e`} icon={Cloud} iconBg="#F0FDF4" iconColor="#16A34A" />
        <KpiCard title="CREDITS SOLD" value={`${fmtTCO2e(totalSold)} tCO₂e`} icon={CheckCircle2} iconBg="#EFF6FF" iconColor="#2563EB" />
        <KpiCard title="AVAILABLE IN REGISTRY" value={`${fmtTCO2e(totalAvailable)} tCO₂e`} icon={Sparkles} iconBg="#FFFBEB" iconColor="#D97706" />
        <KpiCard title="TOTAL CARBON REVENUE" value={`₹${totalRevenue.toFixed(1)} Lakhs`} icon={DollarSign} iconBg="#FEF2F2" iconColor="#EF4444" />
      </div>

      {/* ── ISSUANCE & TRADING TREND CHART ── */}
      <ChartCard title="Carbon Credit Issuance vs Monetized Sales Trend" subtitle="Monthly tCO₂e credits issued vs corporate buyer sales volume over last 12 months" height={260}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={ISSUANCE_TREND} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="gradIssued" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#16A34A" stopOpacity={0.18} />
                <stop offset="95%" stopColor="#16A34A" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="gradSold" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#2563EB" stopOpacity={0.14} />
                <stop offset="95%" stopColor="#2563EB" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
            <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: '#94A3B8' }} axisLine={false} tickLine={false} tickFormatter={v => `${(v / 1000).toFixed(0)}K`} width={38} />
            <Tooltip />
            <Area type="monotone" dataKey="issued" name="Issued Credits" stroke="#16A34A" strokeWidth={2} fill="url(#gradIssued)" dot={false} />
            <Area type="monotone" dataKey="sold" name="Sold Credits" stroke="#2563EB" strokeWidth={2} fill="url(#gradSold)" dot={false} />
          </AreaChart>
        </ResponsiveContainer>
      </ChartCard>

      {/* ── SEARCH & FILTERS ── */}
      <div className="bg-white border border-[#E8EDF5] rounded-2xl p-4 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by Batch ID, Project Name, Location, Species, Buyer Corporate Entity..."
              className="w-full pl-10 pr-4 py-2 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-[13px] text-[#0F172A] outline-none focus:border-[#16A34A] focus:bg-white transition-all"
            />
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-[12px] font-medium text-[#0F172A] outline-none cursor-pointer focus:border-[#16A34A]"
            >
              <option value="">All Batch Statuses</option>
              <option value="Issued">Issued & Available</option>
              <option value="Sold">Sold / Offtaken</option>
              <option value="Retired">Retired / Offset</option>
            </select>
          </div>
        </div>
      </div>

      {/* ── CARBON REGISTRY BATCHES TABLE ── */}
      <div className="ent-card overflow-hidden">
        <div className="p-4 border-b border-[#F1F5F9] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Leaf size={16} className="text-[#16A34A]" />
            <h3 className="text-[14px] font-bold text-[#0F172A]">Verified Carbon Credit Batches Ledger</h3>
            <span className="text-[11px] font-bold text-[#16A34A] bg-[#F0FDF4] px-2 py-0.5 rounded-full border border-[#DCFCE7]">
              {filtered.length} Batches
            </span>
          </div>
        </div>

        <div className="overflow-x-auto custom-scrollbar">
          <table className="ent-table min-w-[1200px]">
            <thead>
              <tr>
                <th>Batch Serial ID</th>
                <th>Origin Project</th>
                <th>Vintage & Species</th>
                <th>Volume (tCO₂e)</th>
                <th>Corporate Buyer</th>
                <th>Price / Revenue</th>
                <th>Standard</th>
                <th>Status</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={9} className="p-0"><SkeletonTable rows={6} cols={9} /></td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={9}>
                  <EmptyState icon={Cloud} title="No carbon credit batches found" description="Try adjusting your filters or search." />
                </td></tr>
              ) : pageRows.map((batch, i) => (
                <motion.tr
                  key={batch.id}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03 }}
                >
                  {/* Batch ID */}
                  <td>
                    <span className="font-mono text-[12px] text-[#2563EB] font-bold bg-[#EFF6FF] px-2.5 py-1 rounded-lg border border-[#DBEAFE]">
                      {batch.batch_id}
                    </span>
                  </td>

                  {/* Origin Project */}
                  <td>
                    <div className="text-[13px] font-bold text-[#0F172A]">{batch.project_name}</div>
                    <div className="text-[11px] font-mono text-[#64748B]">{batch.project_code} • {batch.location}</div>
                  </td>

                  {/* Vintage & Species */}
                  <td>
                    <div className="text-[12.5px] font-bold text-[#0F172A]">Vintage {batch.vintage_year}</div>
                    <div className="text-[11px] text-[#64748B] font-medium">{batch.species}</div>
                  </td>

                  {/* Volume */}
                  <td>
                    <div className="text-[13.5px] font-extrabold text-[#16A34A]">{batch.volume_tco2.toLocaleString()} tCO₂e</div>
                    <div className="text-[10.5px] text-[#94A3B8] font-mono">Available: {batch.credits_available.toLocaleString()}</div>
                  </td>

                  {/* Buyer */}
                  <td>
                    <div className="text-[12.5px] font-bold text-[#0F172A]">{batch.buyer_name}</div>
                    <span className="text-[10.5px] font-medium text-[#2563EB]">Offtaker Contract</span>
                  </td>

                  {/* Price / Revenue */}
                  <td>
                    <div className="text-[13px] font-extrabold text-[#0F172A]">${batch.price_per_tco2_usd} / tCO₂</div>
                    <div className="text-[11px] text-[#16A34A] font-bold">₹{batch.revenue_lakhs} Lakhs</div>
                  </td>

                  {/* Standard */}
                  <td>
                    <span className="px-2 py-0.5 bg-[#F8FAFC] text-[#0F172A] border border-[#CBD5E1] rounded-md text-[11px] font-bold">
                      {batch.verification_standard}
                    </span>
                  </td>

                  {/* Status */}
                  <td>
                    <StatusBadge label={batch.status} variant={getStatusVariant(batch.status) as any} size="sm" />
                  </td>

                  {/* Actions */}
                  <td className="text-right">
                    <button
                      onClick={() => navigate(`/carbon/${batch.id}`)}
                      className="px-3 py-1.5 bg-[#F0FDF4] hover:bg-[#DCFCE7] text-[#16A34A] text-[11.5px] font-bold rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                    >
                      <Eye size={13} /> Batch Details
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
              Page {safePage} of {totalPages} · {filtered.length} credit batches
            </span>
            <div className="flex gap-1">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={safePage === 1} className="btn btn-secondary btn-sm">Previous</button>
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={safePage === totalPages} className="btn btn-secondary btn-sm">Next</button>
            </div>
          </div>
        )}
      </div>

      {/* ── ISSUE NEW CARBON CREDIT BATCH MODAL ── */}
      <AnimatePresence>
        {isMintModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-[#E8EDF5] space-y-4"
            >
              <div className="flex items-center justify-between border-b border-[#F1F5F9] pb-3">
                <div className="flex items-center gap-2">
                  <Sparkles size={18} className="text-[#16A34A]" />
                  <h3 className="text-[16px] font-bold text-[#0F172A]">Issue New Verified Carbon Credit Batch</h3>
                </div>
                <button onClick={() => setIsMintModalOpen(false)} className="text-[#94A3B8] hover:text-[#0F172A]">
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleMintSubmit} className="space-y-3 text-[13px]">
                <div>
                  <label className="block text-[11.5px] font-bold text-[#0F172A] mb-1">Origin Project</label>
                  <select
                    value={newMint.project_name}
                    onChange={e => setNewMint({ ...newMint, project_name: e.target.value })}
                    className="w-full px-3 py-2 bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl font-medium outline-none"
                  >
                    <option value="MP Agroforestry Carbon Sink Drive">PRJ-1042 MP Agroforestry Carbon Sink Drive</option>
                    <option value="Gujarat Coastal Mangrove Reforestation">PRJ-2089 Gujarat Coastal Mangrove Reforestation</option>
                    <option value="Maharashtra Farmer Biochar Sequestration">PRJ-3041 Maharashtra Farmer Biochar Sequestration</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11.5px] font-bold text-[#0F172A] mb-1">Vintage Year</label>
                    <input
                      type="number"
                      value={newMint.vintage_year}
                      onChange={e => setNewMint({ ...newMint, vintage_year: Number(e.target.value) })}
                      className="w-full px-3 py-2 bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl font-medium outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[11.5px] font-bold text-[#0F172A] mb-1">Volume (tCO₂e)</label>
                    <input
                      type="number"
                      value={newMint.volume_tco2}
                      onChange={e => setNewMint({ ...newMint, volume_tco2: Number(e.target.value) })}
                      className="w-full px-3 py-2 bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl font-medium outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11.5px] font-bold text-[#0F172A] mb-1">Price per tCO₂ ($)</label>
                    <input
                      type="number"
                      step="0.5"
                      value={newMint.price_per_tco2_usd}
                      onChange={e => setNewMint({ ...newMint, price_per_tco2_usd: Number(e.target.value) })}
                      className="w-full px-3 py-2 bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl font-medium outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[11.5px] font-bold text-[#0F172A] mb-1">Verification Standard</label>
                    <select
                      value={newMint.verification_standard}
                      onChange={e => setNewMint({ ...newMint, verification_standard: e.target.value })}
                      className="w-full px-3 py-2 bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl font-medium outline-none"
                    >
                      <option value="Verra VM0042 Standard">Verra VM0042 Standard</option>
                      <option value="Gold Standard Blue Carbon">Gold Standard Blue Carbon</option>
                      <option value="Puro.earth Biochar Standard">Puro.earth Biochar Standard</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[11.5px] font-bold text-[#0F172A] mb-1">Assigned Corporate Offtaker</label>
                  <input
                    type="text"
                    value={newMint.buyer_name}
                    onChange={e => setNewMint({ ...newMint, buyer_name: e.target.value })}
                    className="w-full px-3 py-2 bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl font-medium outline-none"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#F1F5F9]">
                  <button type="button" onClick={() => setIsMintModalOpen(false)} className="btn btn-secondary btn-sm cursor-pointer">Cancel</button>
                  <button type="submit" className="btn btn-primary btn-sm cursor-pointer flex items-center gap-1">
                    <Sparkles size={14} /> Mint Credit Batch
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

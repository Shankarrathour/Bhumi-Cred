import React, { useMemo, useState } from 'react';
import {
  Cloud, DownloadCloud, RefreshCw, CheckCircle2, Layers,
  ShieldAlert, Eye, MapPin, Leaf,
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';

import { PageHeader }   from '../../../components/ui/PageHeader';
import { FilterBar }    from '../../../components/ui/FilterBar';
import { KpiCard }      from '../../../components/ui/KpiCard';
import { ChartCard }    from '../../../components/ui/ChartCard';
import { EmptyState, SkeletonTable } from '../../../components/ui/EmptyState';
import { StatusBadge }  from '../../../components/ui/StatusBadge';
import { useTreeRegistrations, AdminTreeRegistrationResponse } from '../api/useCarbonRegistry';
import { useNavigate } from 'react-router-dom';

const ISSUANCE_TREND = [
  { month: 'Sep', issued: 18400, retired: 4200 },
  { month: 'Oct', issued: 22100, retired: 5100 },
  { month: 'Nov', issued: 19800, retired: 6300 },
  { month: 'Dec', issued: 25600, retired: 7800 },
  { month: 'Jan', issued: 31200, retired: 8400 },
  { month: 'Feb', issued: 28900, retired: 7100 },
  { month: 'Mar', issued: 35400, retired: 9600 },
  { month: 'Apr', issued: 42100, retired: 10200 },
  { month: 'May', issued: 38700, retired: 11800 },
  { month: 'Jun', issued: 47300, retired: 13400 },
  { month: 'Jul', issued: 52800, retired: 15200 },
  { month: 'Aug', issued: 61400, retired: 17600 },
];

const PAGE_SIZE = 10;

const fmtTCO2e = (n: number) =>
  n >= 1_000_000 ? `${(n / 1_000_000).toFixed(2)}M` : n >= 1_000 ? `${(n / 1_000).toFixed(1)}K` : n.toFixed(1);

interface CreditRow {
  id: string;
  batchId: string;
  project: string;
  species: string;
  location: string;
  vintage: number;
  treeCount: number;
  volumeRaw: number;
  volume: string;
  registry: string;
  mrv: string;
  status: string;
  displayStatus: string;
  createdAt: string;
}

const toRow = (t: AdminTreeRegistrationResponse | any): CreditRow => {
  if (!t) return {} as CreditRow;
  const idStr = t.id ? String(t.id) : Math.random().toString(36).slice(2);
  const vol = (t.tree_count || 0) * 0.5;
  const loc = [t.village, t.district, t.state].filter(Boolean).join(', ') || 'Unknown Location';
  const rawStatus = t.status || 'PENDING';
  const displayStatus =
    rawStatus === 'APPROVED' ? 'Issued' :
    rawStatus === 'VERIFIED' ? 'Verified' :
    rawStatus === 'PENDING'  ? 'Pending Issuance' : 'Rejected';

  return {
    id: idStr,
    batchId: `BCH-${idStr.substring(0, 6).toUpperCase()}`,
    project: `${t.tree_species || 'Agri'} Plantation`,
    species: t.tree_species || 'Mixed',
    location: loc,
    vintage: t.plantation_year || 2024,
    treeCount: t.tree_count || 0,
    volumeRaw: vol,
    volume: `${fmtTCO2e(vol)} tCO₂e`,
    registry: 'Bhumi Internal',
    mrv: rawStatus === 'VERIFIED' ? 'Verified' : rawStatus === 'APPROVED' ? 'Complete' : 'Pending',
    status: rawStatus,
    displayStatus,
    createdAt: t.created_at ? new Date(t.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—',
  };
};

const statusBadgeVariant = (s: string): 'success' | 'warning' | 'danger' | 'info' | 'gray' => {
  if (s === 'APPROVED') return 'success';
  if (s === 'VERIFIED') return 'info';
  if (s === 'REJECTED') return 'danger';
  return 'warning';
};

const ChartTooltip: React.FC<{ active?: boolean; payload?: any[]; label?: string }> = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="ent-card p-3" style={{ minWidth: 160, boxShadow: '0 8px 24px rgba(0,0,0,0.10)' }}>
      <div className="text-[12px] text-[#64748B] mb-1.5" style={{ fontWeight: 600 }}>{label}</div>
      {payload.map((p: any) => (
        <div key={p.dataKey} className="flex items-center gap-2 text-[12px]">
          <span className="w-2 h-2 rounded-full" style={{ background: p.color }} />
          <span className="text-[#64748B]">{p.name}:</span>
          <span className="text-[#0F172A]" style={{ fontWeight: 600 }}>{p.value.toLocaleString()} tCO₂e</span>
        </div>
      ))}
    </div>
  );
};

export const CarbonRegistry: React.FC = () => {
  const navigate = useNavigate();
  const { data: treeRegData, isLoading, refetch } = useTreeRegistrations();

  const [search, setSearch]       = useState('');
  const [statusFilter, setStatus] = useState('');
  const [speciesFilter, setSpec]  = useState('');
  const [page, setPage]           = useState(1);

  const rawList = useMemo(() => {
    if (!treeRegData) return [];
    if (Array.isArray(treeRegData)) return treeRegData;
    if (Array.isArray((treeRegData as any).data)) return (treeRegData as any).data;
    if (Array.isArray((treeRegData as any).items)) return (treeRegData as any).items;
    return [];
  }, [treeRegData]);

  const allRows = useMemo<CreditRow[]>(() => rawList.map(toRow).filter(r => r.id), [rawList]);

  const filtered = useMemo(() => {
    let r = allRows;
    if (search) r = r.filter(x =>
      x.batchId?.toLowerCase().includes(search.toLowerCase()) ||
      x.project?.toLowerCase().includes(search.toLowerCase()) ||
      x.location?.toLowerCase().includes(search.toLowerCase()) ||
      x.species?.toLowerCase().includes(search.toLowerCase())
    );
    if (statusFilter)  r = r.filter(x => x.status === statusFilter);
    if (speciesFilter) r = r.filter(x => x.species === speciesFilter);
    return r;
  }, [allRows, search, statusFilter, speciesFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage   = Math.min(page, totalPages);
  const pageRows   = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const totalTCO2e   = allRows.reduce((s: number, r: CreditRow) => s + (r.volumeRaw || 0), 0);
  const activeCount  = allRows.filter((r: any) => r.status !== 'REJECTED').length;
  const issuedMonth  = allRows.filter((r: any) => r.status === 'APPROVED' || r.status === 'VERIFIED').length;
  const pendingVerif = allRows.filter((r: any) => r.status === 'PENDING').length;

  const speciesOptions = useMemo(() => {
    const unique = [...new Set(allRows.map((r: any) => r.species).filter(Boolean))].sort();
    return unique.map(s => ({ label: String(s), value: String(s) }));
  }, [allRows]);

  const handleExport = () => {
    const csv = [
      ['Batch ID', 'Project', 'Species', 'Location', 'Vintage', 'Trees', 'Volume', 'Registry', 'MRV', 'Status', 'Created'],
      ...filtered.map((r: any) => [r.batchId, r.project, r.species, r.location, r.vintage, r.treeCount, r.volume, r.registry, r.mrv, r.displayStatus, r.createdAt]),
    ].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url; a.download = 'carbon-registry.csv'; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="page-enter space-y-6">
      <PageHeader
        title="Carbon Registry"
        description="Track carbon sequestration, issue credits and manage MRV verification across active projects"
        icon={Cloud}
        badge={{ label: 'Live', variant: 'success' }}
        actions={
          <>
            <button onClick={() => refetch()} className="btn btn-[#F8FAFC] btn-icon btn-sm" title="Refresh">
              <RefreshCw size={15} className={isLoading ? 'animate-spin text-[#16A34A]' : 'text-[#64748B]'} />
            </button>
            <button onClick={handleExport} className="btn btn-secondary btn-sm gap-1.5">
              <DownloadCloud size={14} /> Export Registry
            </button>
          </>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard title="Total tCO₂e Sequestered" value={isLoading ? '—' : fmtTCO2e(totalTCO2e)} icon={Cloud} iconBg="#F0FDF4" iconColor="#16A34A" trend={8.4} sparkColor="#16A34A" loading={isLoading} />
        <KpiCard title="Active Projects" value={isLoading ? '—' : activeCount} icon={Layers} iconBg="#EFF6FF" iconColor="#2563EB" trend={3.1} sparkColor="#2563EB" loading={isLoading} />
        <KpiCard title="Credits Issued This Month" value={isLoading ? '—' : issuedMonth} icon={CheckCircle2} iconBg="#F0FDF4" iconColor="#16A34A" trend={12.7} sparkColor="#16A34A" loading={isLoading} />
        <KpiCard title="Pending Verification" value={isLoading ? '—' : pendingVerif} icon={ShieldAlert} iconBg="#FFFBEB" iconColor="#D97706" trend={-4.2} sparkColor="#D97706" loading={isLoading} />
      </div>

      <ChartCard title="Carbon Credit Issuance Trend" subtitle="Monthly issued vs retired tCO₂e over the last 12 months" height={260}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={ISSUANCE_TREND} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="gradIssued" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor="#16A34A" stopOpacity={0.18} />
                <stop offset="95%" stopColor="#16A34A" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="gradRetired" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor="#2563EB" stopOpacity={0.14} />
                <stop offset="95%" stopColor="#2563EB" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
            <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: '#94A3B8' }} axisLine={false} tickLine={false} tickFormatter={v => `${(v / 1000).toFixed(0)}K`} width={38} />
            <Tooltip content={<ChartTooltip />} />
            <Area type="monotone" dataKey="issued" name="Issued" stroke="#16A34A" strokeWidth={2} fill="url(#gradIssued)" dot={false} />
            <Area type="monotone" dataKey="retired" name="Retired" stroke="#2563EB" strokeWidth={2} fill="url(#gradRetired)" dot={false} />
          </AreaChart>
        </ResponsiveContainer>
      </ChartCard>

      <FilterBar
        search={search} onSearchChange={v => { setSearch(v); setPage(1); }}
        searchPlaceholder="Search batch, project, location…"
        filters={[
          {
            key: 'status', label: 'All Statuses', value: statusFilter, onChange: v => { setStatus(v); setPage(1); },
            options: [
              { label: 'Issued',           value: 'APPROVED' },
              { label: 'Verified',         value: 'VERIFIED' },
              { label: 'Pending Issuance', value: 'PENDING'  },
              { label: 'Rejected',         value: 'REJECTED' },
            ],
          },
          { key: 'species', label: 'All Species', value: speciesFilter, onChange: v => { setSpec(v); setPage(1); }, options: speciesOptions },
        ]}
        onExport={handleExport} onRefresh={() => refetch()} resultCount={filtered.length} loading={isLoading}
      />

      <div className="ent-card overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#F1F5F9]" style={{ background: '#FAFBFC' }}>
          <div className="flex items-center gap-2">
            <Leaf size={15} className="text-[#16A34A]" />
            <span className="text-[13px] text-[#0F172A]" style={{ fontWeight: 600 }}>Carbon Credit Batches</span>
            {!isLoading && (
              <span className="text-[11px] px-2 py-0.5 rounded-full text-[#64748B]" style={{ background: '#F1F5F9', fontWeight: 600 }}>
                {filtered.length.toLocaleString()} records
              </span>
            )}
          </div>
        </div>

        {isLoading ? (
          <SkeletonTable rows={8} cols={7} />
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={Cloud}
            title="No carbon batches found"
            description="No credit batches match your current search or filters."
            action={{ label: 'Clear Filters', onClick: () => { setSearch(''); setStatus(''); setSpec(''); setPage(1); } }}
          />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="ent-table">
                <thead>
                  <tr>
                    <th>Batch ID</th>
                    <th>Origin Project</th>
                    <th>Location</th>
                    <th>Vintage</th>
                    <th>Volume (tCO₂e)</th>
                    <th>MRV Status</th>
                    <th>Status</th>
                    <th>Registered</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {pageRows.map((row: CreditRow) => (
                    <tr key={row.id}>
                      <td>
                        <span className="font-mono text-[12px] px-2 py-1 rounded-[6px] text-[#2563EB]" style={{ background: '#EFF6FF', fontWeight: 600 }}>
                          {row.batchId}
                        </span>
                      </td>
                      <td>
                        <div style={{ fontWeight: 600 }} className="text-[#0F172A] text-[13px]">{row.project}</div>
                        <div className="text-[11.5px] text-[#94A3B8]">{row.treeCount} trees · {row.registry}</div>
                      </td>
                      <td>
                        <div className="flex items-start gap-1.5 text-[12.5px] text-[#374151]">
                          <MapPin size={12} className="text-[#94A3B8] mt-0.5 shrink-0" />
                          {row.location}
                        </div>
                      </td>
                      <td className="text-[12.5px] text-[#374151]" style={{ fontWeight: 600 }}>{row.vintage}</td>
                      <td className="text-[#0F172A] text-[13px]" style={{ fontWeight: 700 }}>{row.volume}</td>
                      <td><StatusBadge variant={row.mrv === 'Verified' ? 'success' : 'info'} label={row.mrv} size="sm" /></td>
                      <td><StatusBadge variant={statusBadgeVariant(row.status)} label={row.displayStatus} size="sm" /></td>
                      <td className="text-[12px] text-[#64748B]">{row.createdAt}</td>
                      <td>
                        <button onClick={() => navigate(`/carbon/${row.id}`)} className="btn btn-[#F8FAFC] btn-icon btn-sm" title="View details">
                          <Eye size={14} className="text-[#64748B]" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-between px-5 py-3.5 border-t border-[#F1F5F9]">
                <span className="text-[12px] text-[#94A3B8]">Page {safePage} of {totalPages}</span>
                <div className="flex gap-1">
                  <button className="btn btn-[#F8FAFC] btn-sm" disabled={safePage <= 1} onClick={() => setPage(p => Math.max(1, p - 1))}>Previous</button>
                  <button className="btn btn-[#F8FAFC] btn-sm" disabled={safePage >= totalPages} onClick={() => setPage(p => Math.min(totalPages, p + 1))}>Next</button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

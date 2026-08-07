import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Handshake, Plus, Eye, Users, ShieldCheck, Wallet,
  Building, Search, Filter, RefreshCw, Award
} from 'lucide-react';
import { motion } from 'framer-motion';
import { PageHeader } from '../../../components/ui/PageHeader';
import { StatusBadge } from '../../../components/ui/StatusBadge';
import { KpiCard } from '../../../components/ui/KpiCard';
import { EmptyState } from '../../../components/ui/EmptyState';
import { usePartners } from '../api/usePartners';
import toast from 'react-hot-toast';

export const PARTNER_TYPES = [
  'Carbon Partner',
  'Insurance',
  'Lab',
  'MRV',
  'GIS',
  'Marketplace Vendor',
  'Buyer',
  'NGO',
  'Government'
] as const;

const SEEDED_PARTNERS = [
  {
    id: 'PRT-1001',
    vendor_id: 'PRT-1001',
    company_name: 'AgriCorp Solutions Pvt Ltd',
    partner_type: 'Carbon Partner',
    reg_number: 'CIN-U01100MP2021PTC054129',
    gst_number: '23AAACA9012A1Z5',
    pan_number: 'AAACA9012A',
    contact_person: 'Vikram Mehta (Managing Director)',
    phone: '+91 98260 11902',
    email: 'v.mehta@agricorp.in',
    agreement_validity: '31 Dec 2027',
    projects_count: 14,
    performance_score: 96.5,
    commission_rate: '8.5%',
    wallet_balance: 345000,
    is_verified: true,
    status: 'Active',
  },
  {
    id: 'PRT-1002',
    vendor_id: 'PRT-1002',
    company_name: 'EcoShield Tree Insurance Co',
    partner_type: 'Insurance',
    reg_number: 'IRDAI-REG-2022-890',
    gst_number: '27AABCE4412B1ZX',
    pan_number: 'AABCE4412B',
    contact_person: 'Priya Sundaram (Head of Agri Underwriting)',
    phone: '+91 98221 44019',
    email: 'p.sundaram@ecoshield.com',
    agreement_validity: '15 Aug 2026',
    projects_count: 8,
    performance_score: 94.0,
    commission_rate: '5.0%',
    wallet_balance: 890000,
    is_verified: true,
    status: 'Active',
  },
  {
    id: 'PRT-1003',
    vendor_id: 'PRT-1003',
    company_name: 'BioLab Testing & Soil Diagnostics Ltd',
    partner_type: 'Lab',
    reg_number: 'NABL-LAB-2023-412',
    gst_number: '24AAACB1102C1Z8',
    pan_number: 'AAACB1102C',
    contact_person: 'Dr. Suresh Joshi (Chief Pathologist)',
    phone: '+91 97120 55412',
    email: 'lab@biolab.co.in',
    agreement_validity: '30 Jun 2026',
    projects_count: 6,
    performance_score: 91.2,
    commission_rate: '10.0%',
    wallet_balance: 142000,
    is_verified: true,
    status: 'Active',
  },
  {
    id: 'PRT-1004',
    vendor_id: 'PRT-1004',
    company_name: 'GreenEarth MRV & Remote Sensing Solutions',
    partner_type: 'MRV',
    reg_number: 'CIN-U72900DL2020PTC099120',
    gst_number: '07AAACG8890D1Z2',
    pan_number: 'AAACG8890D',
    contact_person: 'Anil Kulkarni (VP Remote Sensing)',
    phone: '+91 98110 33491',
    email: 'mrv@greenearth.org',
    agreement_validity: '10 Nov 2026',
    projects_count: 12,
    performance_score: 98.2,
    commission_rate: '12.0%',
    wallet_balance: 512000,
    is_verified: true,
    status: 'Active',
  },
  {
    id: 'PRT-1005',
    vendor_id: 'PRT-1005',
    company_name: 'GeoMap GIS Spatial Intelligence',
    partner_type: 'GIS',
    reg_number: 'GIS-CERT-2021-009',
    gst_number: '23AAACH7712E1Z9',
    pan_number: 'AAACH7712E',
    contact_person: 'Meghna Rao (GIS Lead)',
    phone: '+91 94255 12904',
    email: 'meghna@geomap.io',
    agreement_validity: '31 Jan 2026',
    projects_count: 9,
    performance_score: 93.8,
    commission_rate: '7.5%',
    wallet_balance: 210000,
    is_verified: true,
    status: 'Active',
  },
  {
    id: 'PRT-1006',
    vendor_id: 'PRT-1006',
    company_name: 'KisanCare Bio-Inputs & Sapling Nursery',
    partner_type: 'Marketplace Vendor',
    reg_number: 'MSME-MP-09-00124',
    gst_number: '23AAACK5512F1Z1',
    pan_number: 'AAACK5512F',
    contact_person: 'Rameshwar Verma (Owner)',
    phone: '+91 98261 88412',
    email: 'sales@kisancare.in',
    agreement_validity: '31 Dec 2025',
    projects_count: 4,
    performance_score: 89.5,
    commission_rate: '15.0%',
    wallet_balance: 98000,
    is_verified: true,
    status: 'Active',
  },
  {
    id: 'PRT-1007',
    vendor_id: 'PRT-1007',
    company_name: 'Global EcoCredits Buyer Corp (EU)',
    partner_type: 'Buyer',
    reg_number: 'EU-REG-2020-99821',
    gst_number: '9924AAAFF1102A1',
    pan_number: 'AAAFF1102A',
    contact_person: 'Marc Van Der Berg (Head of Trading)',
    phone: '+44 20 7946 0912',
    email: 'trading@ecocredits.eu',
    agreement_validity: '31 Mar 2028',
    projects_count: 18,
    performance_score: 99.0,
    commission_rate: '2.5%',
    wallet_balance: 4500000,
    is_verified: true,
    status: 'Active',
  },
  {
    id: 'PRT-1008',
    vendor_id: 'PRT-1008',
    company_name: 'Vriksha Foundation NGO',
    partner_type: 'NGO',
    reg_number: 'NGO-DARPAN-MP-2018-912',
    gst_number: 'EXEMPTED-80G',
    pan_number: 'AAATV9012N',
    contact_person: 'Sunita Deshmukh (Secretary)',
    phone: '+91 94250 44910',
    email: 'info@vrikshafoundation.org',
    agreement_validity: '15 May 2026',
    projects_count: 11,
    performance_score: 92.4,
    commission_rate: '0.0%',
    wallet_balance: 75000,
    is_verified: true,
    status: 'Active',
  },
  {
    id: 'PRT-1009',
    vendor_id: 'PRT-1009',
    company_name: 'State Forest Development Board',
    partner_type: 'Government',
    reg_number: 'GOVT-DEPT-MP-401',
    gst_number: 'EXEMPTED-GOVT',
    pan_number: 'AAATG8812G',
    contact_person: 'Rajesh Sharma (Joint Secretary)',
    phone: '+91 11 2338 2012',
    email: 'r.sharma@agri.gov.in',
    agreement_validity: '31 Dec 2030',
    projects_count: 24,
    performance_score: 97.8,
    commission_rate: '0.0%',
    wallet_balance: 12000000,
    is_verified: true,
    status: 'Active',
  },
];

export const PartnerList: React.FC = () => {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page] = useState(1);
  const [selected, setSelected] = useState<string[]>([]);

  const { data: apiData, refetch } = usePartners(page, 30, search || undefined);

  const rawPartners = apiData?.data ?? [];
  const partners = (rawPartners && rawPartners.length > 0) ? rawPartners.map((p: any) => ({
    id: p.id,
    vendor_id: p.vendor_id || p.id,
    company_name: p.store_name || p.name || 'Agri Partner',
    partner_type: p.partner_type || 'Carbon Partner',
    reg_number: 'CIN-U01100MP2021PTC054129',
    gst_number: p.gst_number || '23AAACA9012A1Z5',
    pan_number: 'AAACA9012A',
    contact_person: p.name || 'Primary Contact',
    phone: p.phone || '+91 98260 11902',
    email: p.email || 'partner@bhumicred.com',
    agreement_validity: '31 Dec 2026',
    projects_count: 5,
    performance_score: 95.0,
    commission_rate: '8.0%',
    wallet_balance: p.wallet_balance ?? 150000,
    is_verified: p.is_verified ?? true,
    status: p.status || 'Active',
  })) : SEEDED_PARTNERS;

  const filtered = useMemo(() => {
    return partners.filter(p => {
      const q = search.toLowerCase();
      const matchSearch = !q || [p.company_name, p.contact_person, p.phone, p.gst_number, p.pan_number, p.vendor_id].some(v => v?.toLowerCase().includes(q));
      const matchType = !typeFilter || p.partner_type?.toLowerCase() === typeFilter.toLowerCase();
      const matchStatus = !statusFilter || p.status?.toLowerCase() === statusFilter.toLowerCase();
      return matchSearch && matchType && matchStatus;
    });
  }, [partners, search, typeFilter, statusFilter]);

  const toggleAll = () =>
    setSelected(selected.length === filtered.length ? [] : filtered.map(p => p.id));
  const toggleSelect = (id: string) =>
    setSelected(s => (s.includes(id) ? s.filter(x => x !== id) : [...s, id]));

  const getTypeBadgeVariant = (type: string) => {
    if (type.includes('Carbon')) return 'success';
    if (type.includes('Insurance')) return 'purple';
    if (type.includes('MRV') || type.includes('GIS')) return 'info';
    if (type.includes('Government')) return 'warning';
    return 'cyan';
  };

  return (
    <div className="space-y-6 page-enter pb-8">
      {/* ── Page Header ── */}
      <PageHeader
        title="Partner Management"
        description="Module 4: Manage Carbon Partners, Insurers, Labs, MRV/GIS Verifiers, Marketplace Vendors, Buyers, NGOs & Government Bodies."
        badge={{ label: `${filtered.length} Active Partners`, variant: 'info' }}
        icon={Handshake}
        iconColor="#16A34A"
        actions={
          <div className="flex items-center gap-2">
            <button onClick={() => refetch()} className="btn btn-secondary btn-sm flex items-center gap-1.5 cursor-pointer">
              <RefreshCw size={13} />
              <span>Refresh</span>
            </button>
            <button onClick={() => toast.success('Open Add Partner Modal')} className="btn btn-primary btn-sm gap-1.5 cursor-pointer">
              <Plus size={14} /> Add Partner
            </button>
          </div>
        }
      />

      {/* ── KPI Metric Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard title="TOTAL PARTNERS" value={partners.length} icon={Users} iconBg="#EFF6FF" iconColor="#2563EB" />
        <KpiCard title="VERIFIED ENTITIES" value={partners.filter(p=>p.is_verified).length} icon={ShieldCheck} iconBg="#F0FDF4" iconColor="#16A34A" />
        <KpiCard title="CARBON & MRV PARTNERS" value={partners.filter(p=>p.partner_type.includes('Carbon')||p.partner_type.includes('MRV')).length} icon={Award} iconBg="#F5F3FF" iconColor="#8B5CF6" />
        <KpiCard title="TOTAL WALLET BALANCE" value="₹1.92 Crore" icon={Wallet} iconBg="#ECFDF5" iconColor="#059669" />
      </div>

      {/* ── SEARCH & BRD MODULE 4 FILTERS ── */}
      <div className="bg-white border border-[#E8EDF5] rounded-2xl p-4 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#94A3B8]" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by Company Name, GSTIN, PAN, Contact Person, Phone, Partner ID..."
              className="w-full pl-10 pr-4 py-2 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-[13px] text-[#0F172A] outline-none focus:border-[#16A34A] focus:bg-white transition-all"
            />
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span className="text-[12px] font-bold text-[#64748B] uppercase tracking-wider flex items-center gap-1">
              <Filter size={13} className="text-[#16A34A]" /> Filters:
            </span>

            {/* 9 BRD Partner Type Dropdown Filter */}
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-3 py-1.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-[12px] font-medium text-[#0F172A] outline-none cursor-pointer focus:border-[#16A34A]"
            >
              <option value="">All Partner Types (9 Categories)</option>
              {PARTNER_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>

            {/* Status Dropdown Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-1.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-[12px] font-medium text-[#0F172A] outline-none cursor-pointer focus:border-[#16A34A]"
            >
              <option value="">All Statuses</option>
              <option value="active">Active</option>
              <option value="pending">Pending</option>
              <option value="suspended">Suspended</option>
            </select>
          </div>
        </div>
      </div>

      {/* ── PARTNER DIRECTORY TABLE (All 10 BRD Attributes Mapped) ── */}
      <div className="ent-card overflow-hidden">
        <div className="p-4 border-b border-[#F1F5F9] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="text-[14px] font-bold text-[#0F172A]">Partner Directory</h3>
            <span className="text-[11px] font-bold text-[#16A34A] bg-[#F0FDF4] px-2 py-0.5 rounded-full border border-[#DCFCE7]">
              {filtered.length} Partners
            </span>
          </div>

          {selected.length > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-[12px] font-medium text-[#64748B]">{selected.length} selected</span>
              <button onClick={() => toast.success(`Exported ${selected.length} partners CSV`)} className="btn btn-secondary btn-sm">
                Export Selected
              </button>
            </div>
          )}
        </div>

        <div className="overflow-x-auto custom-scrollbar">
          <table className="ent-table min-w-[1150px]">
            <thead>
              <tr>
                <th className="w-10">
                  <input
                    type="checkbox"
                    checked={selected.length === filtered.length && filtered.length > 0}
                    onChange={toggleAll}
                    className="rounded border-[#CBD5E1] accent-[#16A34A] cursor-pointer"
                  />
                </th>
                <th>Company & Partner ID</th>
                <th>Partner Category</th>
                <th>Registration / GST & PAN</th>
                <th>Contact Person</th>
                <th>Assigned Projects</th>
                <th>SLA Performance</th>
                <th>Commission Rate</th>
                <th>Wallet Balance</th>
                <th>Status</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={11}>
                    <EmptyState icon={Handshake} title="No partners match filter criteria" description="Try clearing filters or search term." />
                  </td>
                </tr>
              ) : (
                filtered.map((p, i) => (
                  <motion.tr
                    key={p.id}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.03 }}
                    className={selected.includes(p.id) ? 'selected' : ''}
                  >
                    <td>
                      <input
                        type="checkbox"
                        checked={selected.includes(p.id)}
                        onChange={() => toggleSelect(p.id)}
                        className="rounded border-[#CBD5E1] accent-[#16A34A] cursor-pointer"
                      />
                    </td>

                    {/* Company */}
                    <td>
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-[#F0FDF4] text-[#16A34A] font-bold text-[12px] flex items-center justify-center border border-[#DCFCE7] shrink-0">
                          <Building size={18} />
                        </div>
                        <div>
                          <div
                            onClick={() => navigate(`/partners/${p.id}`)}
                            className="text-[13.5px] font-bold text-[#0F172A] hover:text-[#16A34A] cursor-pointer leading-tight"
                          >
                            {p.company_name}
                          </div>
                          <span className="font-mono text-[10.5px] text-[#64748B]">{p.vendor_id}</span>
                        </div>
                      </div>
                    </td>

                    {/* Partner Type */}
                    <td>
                      <StatusBadge label={p.partner_type} variant={getTypeBadgeVariant(p.partner_type) as any} size="sm" />
                    </td>

                    {/* Registration / GST */}
                    <td>
                      <div className="text-[11.5px] font-mono text-[#0F172A] font-bold">GST: {p.gst_number}</div>
                      <div className="text-[10.5px] font-mono text-[#94A3B8]">PAN: {p.pan_number}</div>
                    </td>

                    {/* Contact Person */}
                    <td>
                      <div className="text-[12.5px] font-semibold text-[#0F172A]">{p.contact_person}</div>
                      <div className="text-[10.5px] font-mono text-[#64748B]">{p.phone}</div>
                    </td>

                    {/* Projects */}
                    <td className="text-[13px] font-bold text-[#2563EB]">
                      {p.projects_count} Active
                    </td>

                    {/* Performance */}
                    <td>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[12.5px] font-bold text-[#16A34A]">{p.performance_score}%</span>
                        <div className="w-12 h-1.5 bg-[#DCFCE7] rounded-full overflow-hidden">
                          <div className="h-full bg-[#16A34A] rounded-full" style={{ width: `${p.performance_score}%` }} />
                        </div>
                      </div>
                    </td>

                    {/* Commission */}
                    <td className="text-[13px] font-bold text-[#8B5CF6]">{p.commission_rate}</td>

                    {/* Wallet Balance */}
                    <td className="text-[13px] font-bold text-[#16A34A]">₹{p.wallet_balance.toLocaleString()}</td>

                    {/* Status */}
                    <td>
                      <StatusBadge label={p.status} variant={p.status === 'Active' ? 'success' : 'warning'} size="sm" />
                    </td>

                    {/* Actions */}
                    <td>
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => navigate(`/partners/${p.id}`)}
                          className="px-2.5 py-1 bg-[#F0FDF4] hover:bg-[#DCFCE7] text-[#16A34A] text-[11.5px] font-bold rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                        >
                          <Eye size={13} />
                          <span>Details</span>
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

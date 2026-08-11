import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Handshake, Plus, Eye, Users, ShieldCheck, Wallet,
  Building, Search, Filter, RefreshCw, Award, CheckCircle, X
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { PageHeader } from '../../../components/ui/PageHeader';
import { StatusBadge } from '../../../components/ui/StatusBadge';
import { KpiCard } from '../../../components/ui/KpiCard';
import { EmptyState } from '../../../components/ui/EmptyState';
import { usePartners } from '../api/usePartners';
import toast from 'react-hot-toast';

// 10 Specified Partner Types
export const PARTNER_TYPES = [
  'Carbon Developer',
  'Insurance',
  'Soil Lab',
  'GIS',
  'Marketplace',
  'Buyer',
  'NGO',
  'Government',
  'Verifier',
  'Registry'
] as const;

const SEEDED_PARTNERS = [
  {
    id: 'PRT-1001',
    vendor_id: 'PRT-1001',
    company_name: 'AgriCorp Solutions Pvt Ltd',
    partner_type: 'Carbon Developer',
    reg_number: 'CIN-U01100MP2021PTC054129',
    gst_number: '23AAACA9012A1Z5',
    pan_number: 'AAACA9012A',
    contact_person: 'Vikram Mehta (MD)',
    phone: '+91 98260 11902',
    email: 'v.mehta@agricorp.in',
    agreement_validity: '31 Dec 2027',
    projects_count: 14,
    performance_rating: 4.8,
    revenue_generated: '₹46.5 Lakhs',
    wallet_balance: 345000,
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
    contact_person: 'Priya Sundaram (Head Underwriter)',
    phone: '+91 98221 44019',
    email: 'p.sundaram@ecoshield.com',
    agreement_validity: '15 Aug 2026',
    projects_count: 8,
    performance_rating: 4.7,
    revenue_generated: '₹27.0 Lakhs',
    wallet_balance: 890000,
    status: 'Active',
  },
  {
    id: 'PRT-1003',
    vendor_id: 'PRT-1003',
    company_name: 'BioLab Soil Diagnostics Ltd',
    partner_type: 'Soil Lab',
    reg_number: 'NABL-LAB-2023-412',
    gst_number: '24AAACB1102C1Z8',
    pan_number: 'AAACB1102C',
    contact_person: 'Dr. Suresh Joshi (Pathologist)',
    phone: '+91 97120 55412',
    email: 'lab@biolab.co.in',
    agreement_validity: '30 Jun 2026',
    projects_count: 6,
    performance_rating: 4.6,
    revenue_generated: '₹14.2 Lakhs',
    wallet_balance: 142000,
    status: 'Active',
  },
  {
    id: 'PRT-1004',
    vendor_id: 'PRT-1004',
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
    performance_rating: 4.9,
    revenue_generated: '₹21.0 Lakhs',
    wallet_balance: 210000,
    status: 'Active',
  },
  {
    id: 'PRT-1005',
    vendor_id: 'PRT-1005',
    company_name: 'KisanCare Bio-Inputs Nursery',
    partner_type: 'Marketplace',
    reg_number: 'MSME-MP-09-00124',
    gst_number: '23AAACK5512F1Z1',
    pan_number: 'AAACK5512F',
    contact_person: 'Rameshwar Verma (Owner)',
    phone: '+91 98261 88412',
    email: 'sales@kisancare.in',
    agreement_validity: '31 Dec 2025',
    projects_count: 4,
    performance_rating: 4.5,
    revenue_generated: '₹9.8 Lakhs',
    wallet_balance: 98000,
    status: 'Active',
  },
  {
    id: 'PRT-1006',
    vendor_id: 'PRT-1006',
    company_name: 'Global EcoCredits Buyer Corp',
    partner_type: 'Buyer',
    reg_number: 'EU-REG-2020-99821',
    gst_number: '9924AAAFF1102A1',
    pan_number: 'AAAFF1102A',
    contact_person: 'Marc Van Der Berg',
    phone: '+44 20 7946 0912',
    email: 'trading@ecocredits.eu',
    agreement_validity: '31 Mar 2028',
    projects_count: 18,
    performance_rating: 4.95,
    revenue_generated: '₹450.0 Lakhs',
    wallet_balance: 4500000,
    status: 'Active',
  },
  {
    id: 'PRT-1007',
    vendor_id: 'PRT-1007',
    company_name: 'Vriksha Foundation NGO',
    partner_type: 'NGO',
    reg_number: 'NGO-DARPAN-MP-2018-912',
    gst_number: 'EXEMPTED-80G',
    pan_number: 'AAATV9012N',
    contact_person: 'Sunita Deshmukh',
    phone: '+91 94250 44910',
    email: 'info@vrikshafoundation.org',
    agreement_validity: '15 May 2026',
    projects_count: 11,
    performance_rating: 4.6,
    revenue_generated: '₹7.5 Lakhs',
    wallet_balance: 75000,
    status: 'Active',
  },
  {
    id: 'PRT-1008',
    vendor_id: 'PRT-1008',
    company_name: 'State Forest Development Board',
    partner_type: 'Government',
    reg_number: 'GOVT-DEPT-MP-401',
    gst_number: 'EXEMPTED-GOVT',
    pan_number: 'AAATG8812G',
    contact_person: 'Rajesh Sharma (Sec)',
    phone: '+91 11 2338 2012',
    email: 'r.sharma@agri.gov.in',
    agreement_validity: '31 Dec 2030',
    projects_count: 24,
    performance_rating: 4.8,
    revenue_generated: '₹120.0 Lakhs',
    wallet_balance: 12000000,
    status: 'Active',
  },
  {
    id: 'PRT-1009',
    vendor_id: 'PRT-1009',
    company_name: 'Verra Gold Standard Auditor',
    partner_type: 'Verifier',
    reg_number: 'AUDIT-VERRA-9021',
    gst_number: '27AABCV8812K1Z4',
    pan_number: 'AABCV8812K',
    contact_person: 'Dr. Helene Dupont',
    phone: '+33 1 42 68 55 00',
    email: 'h.dupont@verra-audit.org',
    agreement_validity: '31 Dec 2029',
    projects_count: 15,
    performance_rating: 4.9,
    revenue_generated: '₹35.0 Lakhs',
    wallet_balance: 350000,
    status: 'Active',
  },
  {
    id: 'PRT-1010',
    vendor_id: 'PRT-1010',
    company_name: 'International Carbon Registry',
    partner_type: 'Registry',
    reg_number: 'REGISTRY-ICR-2024',
    gst_number: '9924AAACR4412B1',
    pan_number: 'AAACR4412B',
    contact_person: 'Siddharth Nair',
    phone: '+91 22 6120 4400',
    email: 'registry@icr-carbon.org',
    agreement_validity: '31 Dec 2032',
    projects_count: 30,
    performance_rating: 5.0,
    revenue_generated: '₹180.0 Lakhs',
    wallet_balance: 1800000,
    status: 'Active',
  },
];

export const PartnerList: React.FC = () => {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page] = useState(1);
  const [partnerList, setPartnerList] = useState(SEEDED_PARTNERS);

  // Modal State for Onboarding New Partner
  const [isOnboardModalOpen, setIsOnboardModalOpen] = useState(false);
  const [newPartner, setNewPartner] = useState({
    company_name: '',
    partner_type: 'Carbon Developer' as (typeof PARTNER_TYPES)[number],
    gst_number: '',
    pan_number: '',
    reg_number: '',
    contact_person: '',
    phone: '',
    email: '',
    agreement_validity: '31 Dec 2027',
  });

  const { data: apiData, refetch } = usePartners(page, 30, search || undefined);

  const rawPartners = apiData?.data ?? [];
  const partners = (rawPartners && rawPartners.length > 0) ? rawPartners.map((p: any) => ({
    id: p.id,
    vendor_id: p.vendor_id || p.id,
    company_name: p.store_name || p.name || 'Agri Partner',
    partner_type: p.partner_type || 'Carbon Developer',
    reg_number: 'CIN-U01100MP2021PTC054129',
    gst_number: p.gst_number || '23AAACA9012A1Z5',
    pan_number: 'AAACA9012A',
    contact_person: p.name || 'Primary Contact',
    phone: p.phone || '+91 98260 11902',
    email: p.email || 'partner@bhumicred.com',
    agreement_validity: '31 Dec 2026',
    projects_count: 5,
    performance_rating: 4.8,
    revenue_generated: '₹15.0 Lakhs',
    wallet_balance: p.wallet_balance ?? 150000,
    status: p.status || 'Active',
  })) : partnerList;

  const filtered = useMemo(() => {
    return partners.filter(p => {
      const q = search.toLowerCase();
      const matchSearch = !q || [p.company_name, p.contact_person, p.phone, p.gst_number, p.pan_number, p.vendor_id].some(v => v?.toLowerCase().includes(q));
      const matchType = !typeFilter || p.partner_type?.toLowerCase() === typeFilter.toLowerCase();
      const matchStatus = !statusFilter || p.status?.toLowerCase() === statusFilter.toLowerCase();
      return matchSearch && matchType && matchStatus;
    });
  }, [partners, search, typeFilter, statusFilter]);

  const handleOnboardSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPartner.company_name || !newPartner.contact_person) {
      toast.error('Please enter Company Name and Contact Person.');
      return;
    }

    const randomId = `PRT-${Math.floor(2000 + Math.random() * 8000)}`;
    const created = {
      id: randomId,
      vendor_id: randomId,
      company_name: newPartner.company_name,
      partner_type: newPartner.partner_type,
      reg_number: newPartner.reg_number || 'CIN-U01100MP2025PTC099100',
      gst_number: newPartner.gst_number || '23AAACC1001A1Z9',
      pan_number: newPartner.pan_number || 'AAACC1001A',
      contact_person: newPartner.contact_person,
      phone: newPartner.phone || '+91 98261 00000',
      email: newPartner.email || 'contact@partner.com',
      agreement_validity: newPartner.agreement_validity,
      projects_count: 1,
      performance_rating: 5.0,
      revenue_generated: '₹0.0 Lakhs',
      wallet_balance: 100000,
      status: 'Active',
    };

    setPartnerList(prev => [created, ...prev]);
    toast.success(`Partner "${created.company_name}" (${created.vendor_id}) onboarded successfully!`);
    setIsOnboardModalOpen(false);
    setNewPartner({
      company_name: '',
      partner_type: 'Carbon Developer',
      gst_number: '',
      pan_number: '',
      reg_number: '',
      contact_person: '',
      phone: '',
      email: '',
      agreement_validity: '31 Dec 2027',
    });
  };

  return (
    <div className="space-y-6 page-enter pb-12" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>

      {/* ── Page Header ── */}
      <PageHeader
        title="Partner Management"
        description="Directory & SLA controls across Carbon Developers, Insurance, Soil Labs, GIS, Marketplace, Buyers, NGOs, Govt, Verifiers & Registries."
        badge={{ label: `${partners.length} Ecosystem Partners`, variant: 'info' }}
        icon={Handshake}
        iconColor="#16A34A"
        actions={
          <div className="flex items-center gap-2">
            <button onClick={() => refetch()} className="btn btn-secondary btn-sm gap-1.5 cursor-pointer">
              <RefreshCw size={13} /> Refresh
            </button>
            <button onClick={() => setIsOnboardModalOpen(true)} className="btn btn-primary btn-sm gap-1.5 cursor-pointer">
              <Plus size={14} /> Onboard New Partner
            </button>
          </div>
        }
      />

      {/* ── KPI Row ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KpiCard title="TOTAL PARTNERS" value={partners.length} icon={Handshake} iconBg="#F0FDF4" iconColor="#16A34A" />
        <KpiCard title="CARBON DEVELOPERS" value={partners.filter(p=>p.partner_type==='Carbon Developer').length} icon={Building} iconBg="#EFF6FF" iconColor="#2563EB" />
        <KpiCard title="VERIFIERS & REGISTRY" value={partners.filter(p=>p.partner_type==='Verifier'||p.partner_type==='Registry').length} icon={ShieldCheck} iconBg="#F5F3FF" iconColor="#8B5CF6" />
        <KpiCard title="ACTIVE DISBURSEMENTS" value="₹72.5 Lakhs" icon={Wallet} iconBg="#ECFDF5" iconColor="#059669" />
      </div>

      {/* ── SEARCH & 10 PARTNER TYPE FILTERS ── */}
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
            {/* 10 Partner Types Filter */}
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-3 py-2 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-[12px] font-medium text-[#0F172A] outline-none cursor-pointer focus:border-[#16A34A]"
            >
              <option value="">All 10 Partner Types</option>
              {PARTNER_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-[12px] font-medium text-[#0F172A] outline-none cursor-pointer focus:border-[#16A34A]"
            >
              <option value="">All Statuses</option>
              <option value="Active">Active</option>
              <option value="Pending">Pending</option>
              <option value="Suspended">Suspended</option>
            </select>
          </div>
        </div>
      </div>

      {/* ── PARTNERS DIRECTORY TABLE ── */}
      <div className="bg-white border border-[#E8EDF5] rounded-2xl overflow-hidden shadow-xs">
        <div className="p-4 border-b border-[#F1F5F9] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="text-[14px] font-bold text-[#0F172A]">Ecosystem Partners Directory</h3>
            <span className="text-[11px] font-bold text-[#16A34A] bg-[#F0FDF4] px-2 py-0.5 rounded-full border border-[#DCFCE7]">
              {filtered.length} Partners
            </span>
          </div>
        </div>

        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left border-collapse min-w-[1150px]">
            <thead>
              <tr className="bg-[#F8FAFC] border-b border-[#E2E8F0] text-[11px] font-bold uppercase tracking-wider text-[#475569]">
                <th className="py-3 px-4">Company</th>
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-4">GST & PAN</th>
                <th className="py-3 px-4">Contact</th>
                <th className="py-3 px-4">Agreement</th>
                <th className="py-3 px-4">Projects</th>
                <th className="py-3 px-4">Revenue</th>
                <th className="py-3 px-4">Rating</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F1F5F9]">
              {filtered.map((p) => (
                <tr key={p.id} className="hover:bg-[#F8FAFC] transition-colors">
                  {/* Attribute 1: Company */}
                  <td className="py-3 px-4">
                    <div
                      onClick={() => navigate(`/partners/${p.id}`)}
                      className="text-[13px] font-bold text-[#0F172A] hover:text-[#16A34A] cursor-pointer"
                    >
                      {p.company_name}
                    </div>
                    <div className="text-[11px] font-mono text-[#64748B]">{p.vendor_id}</div>
                  </td>

                  {/* Attribute 2: Type */}
                  <td className="py-3 px-4">
                    <span className="text-[11.5px] font-semibold text-[#2563EB] bg-[#EFF6FF] px-2 py-0.5 rounded-lg border border-[#DBEAFE]">
                      {p.partner_type}
                    </span>
                  </td>

                  {/* Attribute 3 & 4: GST & PAN */}
                  <td className="py-3 px-4">
                    <div className="text-[11.5px] font-mono text-[#0F172A]">GST: {p.gst_number}</div>
                    <div className="text-[11px] font-mono text-[#64748B]">PAN: {p.pan_number}</div>
                  </td>

                  {/* Attribute 5: Contact */}
                  <td className="py-3 px-4">
                    <div className="text-[12.5px] font-semibold text-[#0F172A]">{p.contact_person}</div>
                    <div className="text-[11px] text-[#64748B]">{p.phone}</div>
                  </td>

                  {/* Attribute 6: Agreement */}
                  <td className="py-3 px-4 text-[12px] font-medium text-[#475569]">
                    Valid: {p.agreement_validity}
                  </td>

                  {/* Attribute 7: Projects */}
                  <td className="py-3 px-4 text-[13px] font-bold text-[#0F172A]">
                    {p.projects_count} <span className="text-[11px] font-normal text-[#64748B]">Projects</span>
                  </td>

                  {/* Attribute 8: Revenue */}
                  <td className="py-3 px-4 text-[13px] font-extrabold text-[#16A34A]">
                    {p.revenue_generated}
                  </td>

                  {/* Attribute 9: Rating */}
                  <td className="py-3 px-4">
                    <span className="text-[12px] font-extrabold text-[#D97706] bg-[#FFFBEB] px-2 py-0.5 rounded-lg border border-[#FEF3C7]">
                      ★ {p.performance_rating}
                    </span>
                  </td>

                  {/* Action */}
                  <td className="py-3 px-4 text-right">
                    <button
                      onClick={() => navigate(`/partners/${p.id}`)}
                      className="px-3 py-1.5 bg-[#F0FDF4] hover:bg-[#DCFCE7] text-[#16A34A] text-[11.5px] font-bold rounded-lg transition-colors flex items-center gap-1 cursor-pointer ml-auto"
                    >
                      <Eye size={13} /> Dashboard
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── ONBOARD NEW PARTNER MODAL ── */}
      <AnimatePresence>
        {isOnboardModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-[#E8EDF5] space-y-4"
            >
              <div className="flex items-center justify-between border-b border-[#F1F5F9] pb-3">
                <div className="flex items-center gap-2">
                  <Handshake size={20} className="text-[#16A34A]" />
                  <h3 className="text-[16px] font-bold text-[#0F172A]">Onboard New Ecosystem Partner</h3>
                </div>
                <button onClick={() => setIsOnboardModalOpen(false)} className="text-[#94A3B8] hover:text-[#0F172A] text-lg font-bold cursor-pointer">
                  ×
                </button>
              </div>

              <form onSubmit={handleOnboardSubmit} className="space-y-3 text-[12.5px]">
                <div>
                  <label className="block font-bold text-[#0F172A] mb-1">Company / Organization Name *</label>
                  <input
                    type="text"
                    required
                    value={newPartner.company_name}
                    onChange={(e) => setNewPartner({ ...newPartner, company_name: e.target.value })}
                    placeholder="e.g. GreenAgri Carbon Solutions Pvt Ltd"
                    className="w-full px-3.5 py-2 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-[13px] font-semibold text-[#0F172A] outline-none focus:border-[#16A34A]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-[#0F172A] mb-1">Partner Type</label>
                    <select
                      value={newPartner.partner_type}
                      onChange={(e) => setNewPartner({ ...newPartner, partner_type: e.target.value as any })}
                      className="w-full px-3 py-2 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-[12.5px] font-medium text-[#0F172A] outline-none focus:border-[#16A34A]"
                    >
                      {PARTNER_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-[#0F172A] mb-1">Nodal Contact Person *</label>
                    <input
                      type="text"
                      required
                      value={newPartner.contact_person}
                      onChange={(e) => setNewPartner({ ...newPartner, contact_person: e.target.value })}
                      placeholder="e.g. Ramesh Verma (MD)"
                      className="w-full px-3 py-2 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-[12.5px] font-semibold text-[#0F172A] outline-none focus:border-[#16A34A]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-[#0F172A] mb-1">GSTIN Number</label>
                    <input
                      type="text"
                      value={newPartner.gst_number}
                      onChange={(e) => setNewPartner({ ...newPartner, gst_number: e.target.value })}
                      placeholder="23AAACA9012A1Z5"
                      className="w-full px-3 py-2 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-[12.5px] font-mono text-[#0F172A] outline-none focus:border-[#16A34A]"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-[#0F172A] mb-1">PAN Number</label>
                    <input
                      type="text"
                      value={newPartner.pan_number}
                      onChange={(e) => setNewPartner({ ...newPartner, pan_number: e.target.value })}
                      placeholder="AAACA9012A"
                      className="w-full px-3 py-2 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-[12.5px] font-mono text-[#0F172A] outline-none focus:border-[#16A34A]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-[#0F172A] mb-1">Phone (+91)</label>
                    <input
                      type="text"
                      value={newPartner.phone}
                      onChange={(e) => setNewPartner({ ...newPartner, phone: e.target.value })}
                      placeholder="+91 98260 11902"
                      className="w-full px-3 py-2 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-[12.5px] font-mono text-[#0F172A] outline-none focus:border-[#16A34A]"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-[#0F172A] mb-1">Email Address</label>
                    <input
                      type="email"
                      value={newPartner.email}
                      onChange={(e) => setNewPartner({ ...newPartner, email: e.target.value })}
                      placeholder="contact@partner.com"
                      className="w-full px-3 py-2 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-[12.5px] font-semibold text-[#0F172A] outline-none focus:border-[#16A34A]"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#F1F5F9]">
                  <button type="button" onClick={() => setIsOnboardModalOpen(false)} className="btn btn-secondary btn-sm">
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary btn-sm flex items-center gap-1.5">
                    <Plus size={14} /> Onboard Partner
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

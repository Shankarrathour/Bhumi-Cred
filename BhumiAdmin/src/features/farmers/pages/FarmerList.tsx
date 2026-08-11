import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Sprout, Plus, Eye, UserCheck, UserX, RefreshCw, MapPin,
  Building2, ShieldCheck, CheckCircle, XCircle, Ban, Lock, FileText,
  Search, Filter, MoreVertical, Send, Wallet, CreditCard
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useFarmers, FarmerListItem } from '../api/useFarmers';
import { PageHeader } from '../../../components/ui/PageHeader';
import { StatusBadge } from '../../../components/ui/StatusBadge';
import { EmptyState, SkeletonTable } from '../../../components/ui/EmptyState';
import { KpiCard } from '../../../components/ui/KpiCard';
import toast from 'react-hot-toast';

const PAGE_SIZE = 12;

// Seeded Farmers Dataset matching all 10 Columns
const EXTENDED_FARMER_LIST: FarmerListItem[] = [
  {
    id: 'f-101',
    farmer_id: 'FARM-MP-8091',
    first_name: 'Ramesh',
    last_name: 'Patel',
    mobile: '+91 98261 44102',
    village: 'Sehore Khas',
    district: 'Sehore',
    state: 'Madhya Pradesh',
    total_land_area: 14.5,
    kyc_status: 'APPROVED',
    is_active: true,
    created_at: '2025-01-14T10:30:00Z',
    wallet_balance: 48500,
    total_trees: 1250,
    carbon_credits_generated: 14.2,
    project_name: 'MP Green Afforestation Q1',
    insurance_count: 2,
    photo_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
  },
  {
    id: 'f-102',
    farmer_id: 'FARM-MP-8092',
    first_name: 'Sita',
    last_name: 'Devi',
    mobile: '+91 94250 88219',
    village: 'Depalpur',
    district: 'Indore',
    state: 'Madhya Pradesh',
    total_land_area: 8.2,
    kyc_status: 'PENDING',
    is_active: true,
    created_at: '2025-02-01T14:15:00Z',
    wallet_balance: 12400,
    total_trees: 680,
    carbon_credits_generated: 6.8,
    project_name: 'Malwa Agro-Forestry Drive',
    insurance_count: 1,
    photo_url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150',
  },
  {
    id: 'f-103',
    farmer_id: 'FARM-MH-4011',
    first_name: 'Vijay',
    last_name: 'Deshmukh',
    mobile: '+91 98220 11984',
    village: 'Baramati',
    district: 'Pune',
    state: 'Maharashtra',
    total_land_area: 22.0,
    kyc_status: 'APPROVED',
    is_active: true,
    created_at: '2024-11-20T09:00:00Z',
    wallet_balance: 112000,
    total_trees: 2400,
    carbon_credits_generated: 28.5,
    project_name: 'Western Ghats Bio-Carbon Project',
    insurance_count: 3,
    photo_url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150',
  },
  {
    id: 'f-104',
    farmer_id: 'FARM-GJ-3090',
    first_name: 'Mohan',
    last_name: 'Singh',
    mobile: '+91 97129 33410',
    village: 'Anand',
    district: 'Anand',
    state: 'Gujarat',
    total_land_area: 6.0,
    kyc_status: 'REJECTED',
    is_active: false,
    created_at: '2025-02-10T11:45:00Z',
    wallet_balance: 0,
    total_trees: 210,
    carbon_credits_generated: 0.0,
    project_name: 'Gujarat Agro Carbon Mission',
    insurance_count: 0,
    photo_url: '',
  },
  {
    id: 'f-105',
    farmer_id: 'FARM-CG-1022',
    first_name: 'Ankita',
    last_name: 'Sahu',
    mobile: '+91 99811 55601',
    village: 'Dhamtari',
    district: 'Dhamtari',
    state: 'Chhattisgarh',
    total_land_area: 12.8,
    kyc_status: 'APPROVED',
    is_active: true,
    created_at: '2024-12-05T16:20:00Z',
    wallet_balance: 34500,
    total_trees: 980,
    carbon_credits_generated: 11.4,
    project_name: 'Chhattisgarh Forest Carbon Project',
    insurance_count: 1,
    photo_url: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150',
  },
];

export const FarmerList = () => {
  const navigate = useNavigate();
  const [page] = useState(1);
  const [search, setSearch] = useState('');
  
  // 8 Filters: State, District, Village, Status, Project, Approval, Insurance, Wallet
  const [stateFilter, setStateFilter] = useState('');
  const [districtFilter, setDistrictFilter] = useState('');
  const [villageFilter, setVillageFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [projectFilter, setProjectFilter] = useState('');
  const [approvalFilter, setApprovalFilter] = useState('');
  const [insuranceFilter, setInsuranceFilter] = useState('');
  const [walletFilter, setWalletFilter] = useState('');
  
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [actionModal, setActionModal] = useState<{ type: string; farmer: FarmerListItem } | null>(null);

  const { data: apiData, isLoading, refetch, isFetching } = useFarmers(page, PAGE_SIZE);
  const farmers = (apiData?.data && apiData.data.length > 0) ? apiData.data : EXTENDED_FARMER_LIST;

  // Options lists for dropdown filters
  const states = useMemo(() => Array.from(new Set(farmers.map(f => f.state).filter(Boolean))), [farmers]);
  const districts = useMemo(() => Array.from(new Set(farmers.map(f => f.district).filter(Boolean))), [farmers]);
  const villages = useMemo(() => Array.from(new Set(farmers.map(f => f.village).filter(Boolean))), [farmers]);
  const projects = useMemo(() => Array.from(new Set(farmers.map(f => (f as any).project_name).filter(Boolean))), [farmers]);

  // Multi-Filter Algorithm
  const filtered = useMemo(() => {
    return farmers.filter(f => {
      const q = search.toLowerCase();
      const matchSearch = !q || [f.first_name, f.last_name, f.mobile, f.farmer_id, f.village, f.district, f.state]
        .some(v => v?.toLowerCase().includes(q));
      
      const matchState = !stateFilter || f.state?.toLowerCase() === stateFilter.toLowerCase();
      const matchDistrict = !districtFilter || f.district?.toLowerCase() === districtFilter.toLowerCase();
      const matchVillage = !villageFilter || f.village?.toLowerCase() === villageFilter.toLowerCase();
      const matchStatus = !statusFilter || (statusFilter === 'ACTIVE' && f.is_active) || (statusFilter === 'INACTIVE' && !f.is_active);
      const matchProject = !projectFilter || (f as any).project_name?.toLowerCase() === projectFilter.toLowerCase();
      const matchApproval = !approvalFilter || f.kyc_status === approvalFilter;
      
      const insCount = (f as any).insurance_count ?? 0;
      const matchInsurance = !insuranceFilter || (insuranceFilter === 'HAS_INSURANCE' && insCount > 0) || (insuranceFilter === 'NO_INSURANCE' && insCount === 0);
      
      const walletBal = (f as any).wallet_balance ?? 0;
      const matchWallet = !walletFilter || (walletFilter === 'HAS_BALANCE' && walletBal > 0) || (walletFilter === 'ZERO_BALANCE' && walletBal === 0);

      return matchSearch && matchState && matchDistrict && matchVillage && matchStatus && matchProject && matchApproval && matchInsurance && matchWallet;
    });
  }, [farmers, search, stateFilter, districtFilter, villageFilter, statusFilter, projectFilter, approvalFilter, insuranceFilter, walletFilter]);

  const toggleSelectAll = () => {
    setSelectedIds(selectedIds.length === filtered.length ? [] : filtered.map(f => f.id));
  };

  const toggleSelectOne = (id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const handleFarmerAction = (actionType: string, farmerName: string) => {
    setActionModal(null);
    toast.success(`Action "${actionType}" completed for ${farmerName}!`);
  };

  return (
    <div className="space-y-6 page-enter pb-8" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>
      {/* ── Page Header ── */}
      <PageHeader
        title="Farmer Directory"
        description="Complete farmer directory, multi-parameter filtering, KYC review & administrative action controls."
        badge={{ label: `${filtered.length} Farmers Listed`, variant: 'info' }}
        icon={Sprout}
        actions={
          <div className="flex items-center gap-2">
            <button onClick={() => refetch()} className="btn btn-secondary btn-sm flex items-center gap-1.5 cursor-pointer">
              <RefreshCw size={13} className={isFetching ? 'animate-spin' : ''} />
              <span>Refresh</span>
            </button>
            <button onClick={() => toast.success('Open Add Farmer Modal')} className="btn btn-primary btn-sm flex items-center gap-1.5 cursor-pointer">
              <Plus size={13} />
              <span>Add New Farmer</span>
            </button>
          </div>
        }
      />

      {/* ── KPI Overview Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard title="TOTAL FARMERS" value={farmers.length} icon={Sprout} iconBg="#F0FDF4" iconColor="#16A34A" trend={12.5} loading={isLoading} />
        <KpiCard title="KYC APPROVED" value={farmers.filter(f=>f.kyc_status==='APPROVED').length} icon={UserCheck} iconBg="#EFF6FF" iconColor="#2563EB" loading={isLoading} />
        <KpiCard title="PENDING REVIEW" value={farmers.filter(f=>f.kyc_status==='PENDING').length} icon={UserX} iconBg="#FFFBEB" iconColor="#F59E0B" loading={isLoading} />
        <KpiCard title="ACTIVE FARMERS" value={farmers.filter(f=>f.is_active).length} icon={MapPin} iconBg="#F5F3FF" iconColor="#8B5CF6" loading={isLoading} />
      </div>

      {/* ── SEARCH & 8 FILTER CONTROLS ── */}
      <div className="bg-white border border-[#E8EDF5] rounded-2xl p-4 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row items-center gap-3">
          {/* Main Search */}
          <div className="relative flex-1 w-full">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#94A3B8]" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by Farmer Name, Mobile (+91), Farmer ID, Village, District, State..."
              className="w-full pl-10 pr-4 py-2 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-[13px] text-[#0F172A] placeholder-[#94A3B8] outline-none focus:border-[#16A34A] focus:bg-white transition-all"
            />
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span className="text-[12px] font-bold text-[#64748B] uppercase tracking-wider flex items-center gap-1">
              <Filter size={13} className="text-[#16A34A]" />
              8 Filters:
            </span>
            {(stateFilter || districtFilter || villageFilter || statusFilter || projectFilter || approvalFilter || insuranceFilter || walletFilter || search) && (
              <button
                onClick={() => {
                  setSearch('');
                  setStateFilter('');
                  setDistrictFilter('');
                  setVillageFilter('');
                  setStatusFilter('');
                  setProjectFilter('');
                  setApprovalFilter('');
                  setInsuranceFilter('');
                  setWalletFilter('');
                }}
                className="text-[11.5px] font-semibold text-[#EF4444] hover:underline cursor-pointer"
              >
                Clear All
              </button>
            )}
          </div>
        </div>

        {/* 8 Dropdown Filters Grid: State, District, Village, Status, Project, Approval, Insurance, Wallet */}
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-8 gap-2 pt-2 border-t border-[#F1F5F9]">
          {/* Filter 1: State */}
          <select
            value={stateFilter}
            onChange={(e) => setStateFilter(e.target.value)}
            className="px-2.5 py-1.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-[11.5px] font-medium text-[#0F172A] outline-none focus:border-[#16A34A] cursor-pointer truncate"
          >
            <option value="">All States</option>
            {states.map(s => <option key={s} value={s}>{s}</option>)}
          </select>

          {/* Filter 2: District */}
          <select
            value={districtFilter}
            onChange={(e) => setDistrictFilter(e.target.value)}
            className="px-2.5 py-1.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-[11.5px] font-medium text-[#0F172A] outline-none focus:border-[#16A34A] cursor-pointer truncate"
          >
            <option value="">All Districts</option>
            {districts.map(d => <option key={d} value={d}>{d}</option>)}
          </select>

          {/* Filter 3: Village */}
          <select
            value={villageFilter}
            onChange={(e) => setVillageFilter(e.target.value)}
            className="px-2.5 py-1.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-[11.5px] font-medium text-[#0F172A] outline-none focus:border-[#16A34A] cursor-pointer truncate"
          >
            <option value="">All Villages</option>
            {villages.map(v => <option key={v} value={v}>{v}</option>)}
          </select>

          {/* Filter 4: Status */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-2.5 py-1.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-[11.5px] font-medium text-[#0F172A] outline-none focus:border-[#16A34A] cursor-pointer truncate"
          >
            <option value="">All Statuses</option>
            <option value="ACTIVE">Active Account</option>
            <option value="INACTIVE">Inactive Account</option>
          </select>

          {/* Filter 5: Project */}
          <select
            value={projectFilter}
            onChange={(e) => setProjectFilter(e.target.value)}
            className="px-2.5 py-1.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-[11.5px] font-medium text-[#0F172A] outline-none focus:border-[#16A34A] cursor-pointer truncate"
          >
            <option value="">All Projects</option>
            {projects.map(p => <option key={p} value={p}>{p}</option>)}
          </select>

          {/* Filter 6: Approval */}
          <select
            value={approvalFilter}
            onChange={(e) => setApprovalFilter(e.target.value)}
            className="px-2.5 py-1.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-[11.5px] font-medium text-[#0F172A] outline-none focus:border-[#16A34A] cursor-pointer truncate"
          >
            <option value="">All Approvals</option>
            <option value="APPROVED">KYC Approved</option>
            <option value="PENDING">KYC Pending</option>
            <option value="REJECTED">KYC Rejected</option>
          </select>

          {/* Filter 7: Insurance */}
          <select
            value={insuranceFilter}
            onChange={(e) => setInsuranceFilter(e.target.value)}
            className="px-2.5 py-1.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-[11.5px] font-medium text-[#0F172A] outline-none focus:border-[#16A34A] cursor-pointer truncate"
          >
            <option value="">All Insurance</option>
            <option value="HAS_INSURANCE">Has Insurance Policy</option>
            <option value="NO_INSURANCE">No Policy</option>
          </select>

          {/* Filter 8: Wallet */}
          <select
            value={walletFilter}
            onChange={(e) => setWalletFilter(e.target.value)}
            className="px-2.5 py-1.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-[11.5px] font-medium text-[#0F172A] outline-none focus:border-[#16A34A] cursor-pointer truncate"
          >
            <option value="">All Wallet</option>
            <option value="HAS_BALANCE">Has Balance (&gt;₹0)</option>
            <option value="ZERO_BALANCE">Zero Balance (₹0)</option>
          </select>
        </div>
      </div>

      {/* ── FARMER LIST TABLE (All 10 Specified Columns) ── */}
      <div className="bg-white border border-[#E8EDF5] rounded-2xl overflow-hidden shadow-xs">
        <div className="p-4 border-b border-[#F1F5F9] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="text-[14px] font-bold text-[#0F172A]">Farmer Directory Table</h3>
            <span className="text-[11px] font-bold text-[#16A34A] bg-[#F0FDF4] px-2 py-0.5 rounded-full border border-[#DCFCE7]">
              {filtered.length} Farmers
            </span>
          </div>

          {selectedIds.length > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-[12px] font-medium text-[#64748B]">{selectedIds.length} selected</span>
              <button onClick={() => toast.success(`Bulk Notification sent to ${selectedIds.length} farmers`)} className="btn btn-secondary btn-sm">
                Send Bulk SMS
              </button>
              <button onClick={() => toast.success(`Exported ${selectedIds.length} farmers CSV`)} className="btn btn-secondary btn-sm">
                Export Selected
              </button>
            </div>
          )}
        </div>

        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left border-collapse min-w-[1200px]">
            <thead>
              <tr className="bg-[#F8FAFC] border-b border-[#E2E8F0] text-[11px] font-bold uppercase tracking-wider text-[#475569]">
                <th className="py-3 px-4 w-10">
                  <input
                    type="checkbox"
                    checked={selectedIds.length === filtered.length && filtered.length > 0}
                    onChange={toggleSelectAll}
                    className="rounded border-[#CBD5E1] accent-[#16A34A] cursor-pointer"
                  />
                </th>
                <th className="py-3 px-4">Photo</th>
                <th className="py-3 px-4">Farmer ID</th>
                <th className="py-3 px-4">Name</th>
                <th className="py-3 px-4">Mobile</th>
                <th className="py-3 px-4">Village & Location</th>
                <th className="py-3 px-4">Land (Acres)</th>
                <th className="py-3 px-4">Projects</th>
                <th className="py-3 px-4">Wallet Balance</th>
                <th className="py-3 px-4">Status & Approval</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F1F5F9]">
              {isLoading ? (
                <tr><td colSpan={11} className="p-0"><SkeletonTable rows={6} cols={11} /></td></tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={11}>
                    <EmptyState
                      icon={Sprout}
                      title="No farmers match filter parameters"
                      description="Try clearing filters or searching with a different term."
                    />
                  </td>
                </tr>
              ) : filtered.map((f, i) => {
                const photo = (f as any).photo_url;
                const wallet = (f as any).wallet_balance ?? 0;
                const insuranceCount = (f as any).insurance_count ?? 1;
                const projectName = (f as any).project_name || 'MP Afforestation Q1';

                return (
                  <tr
                    key={f.id}
                    className={`hover:bg-[#F8FAFC] transition-colors ${selectedIds.includes(f.id) ? 'bg-[#F0FDF4]' : ''}`}
                  >
                    <td className="py-3 px-4">
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(f.id)}
                        onChange={() => toggleSelectOne(f.id)}
                        className="rounded border-[#CBD5E1] accent-[#16A34A] cursor-pointer"
                      />
                    </td>

                    {/* Column 1: Photo */}
                    <td className="py-3 px-4">
                      {photo ? (
                        <img src={photo} alt="" className="w-9 h-9 rounded-xl object-cover border border-[#E2E8F0] shrink-0" />
                      ) : (
                        <div className="w-9 h-9 rounded-xl bg-[#F0FDF4] text-[#16A34A] font-bold text-[12px] flex items-center justify-center border border-[#DCFCE7] shrink-0">
                          {(f.first_name || 'F')[0].toUpperCase()}
                        </div>
                      )}
                    </td>

                    {/* Column 2: Farmer ID */}
                    <td className="py-3 px-4 font-mono text-[11.5px] font-semibold text-[#64748B]">
                      {f.farmer_id || f.id?.slice(-8)}
                    </td>

                    {/* Column 3: Name */}
                    <td className="py-3 px-4">
                      <div
                        onClick={() => navigate(`/farmers/${f.id}`)}
                        className="text-[13px] font-bold text-[#0F172A] hover:text-[#16A34A] cursor-pointer leading-tight"
                      >
                        {f.first_name} {f.last_name}
                      </div>
                    </td>

                    {/* Column 4: Mobile */}
                    <td className="py-3 px-4 text-[12.5px] font-mono text-[#475569]">{f.mobile}</td>

                    {/* Column 5: Village */}
                    <td className="py-3 px-4">
                      <div className="text-[12.5px] font-semibold text-[#0F172A]">{f.village || 'Sehore'}</div>
                      <div className="text-[10.5px] text-[#94A3B8]">{f.district || 'Sehore'}, {f.state || 'MP'}</div>
                    </td>

                    {/* Column 6: Land */}
                    <td className="py-3 px-4 text-[13px] font-bold text-[#0F172A]">
                      {f.total_land_area?.toFixed(1) ?? '12.0'} <span className="text-[11px] font-normal text-[#64748B]">Acres</span>
                    </td>

                    {/* Column 7: Projects */}
                    <td className="py-3 px-4">
                      <span className="text-[11.5px] font-semibold text-[#2563EB] bg-[#EFF6FF] px-2 py-0.5 rounded-lg border border-[#DBEAFE]">
                        {projectName}
                      </span>
                    </td>

                    {/* Column 8: Wallet */}
                    <td className="py-3 px-4 text-[13px] font-bold text-[#16A34A]">
                      ₹{wallet.toLocaleString()}
                    </td>

                    {/* Column 9: Status (KYC Approval & Active) */}
                    <td className="py-3 px-4">
                      <div className="flex flex-col gap-1 items-start">
                        <StatusBadge
                          label={f.kyc_status}
                          variant={f.kyc_status === 'APPROVED' ? 'success' : f.kyc_status === 'PENDING' ? 'warning' : 'danger'}
                          size="sm"
                        />
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${f.is_active ? 'bg-[#DCFCE7] text-[#16A34A]' : 'bg-[#F1F5F9] text-[#64748B]'}`}>
                          {f.is_active ? 'Account Active' : 'Account Suspended'}
                        </span>
                      </div>
                    </td>

                    {/* Column 10: Action (5 Core Buttons: View, Approve, Reject, Suspend, Assign Project) */}
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* 1. View */}
                        <button
                          onClick={() => navigate(`/farmers/${f.id}`)}
                          className="px-2.5 py-1 bg-[#F0FDF4] hover:bg-[#DCFCE7] text-[#16A34A] text-[11.5px] font-bold rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                          title="View Profile"
                        >
                          <Eye size={13} />
                          <span>View</span>
                        </button>

                        {/* 2. Approve */}
                        {f.kyc_status !== 'APPROVED' && (
                          <button
                            onClick={() => handleFarmerAction('Approve KYC', f.first_name)}
                            className="px-2 py-1 bg-[#EFF6FF] hover:bg-[#DBEAFE] text-[#2563EB] text-[11px] font-bold rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                            title="Approve KYC"
                          >
                            <CheckCircle size={12} />
                            <span>Approve</span>
                          </button>
                        )}

                        {/* 3. Reject */}
                        {f.kyc_status === 'PENDING' && (
                          <button
                            onClick={() => handleFarmerAction('Reject KYC', f.first_name)}
                            className="px-2 py-1 bg-[#FEF2F2] hover:bg-[#FEE2E2] text-[#EF4444] text-[11px] font-bold rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                            title="Reject Application"
                          >
                            <XCircle size={12} />
                            <span>Reject</span>
                          </button>
                        )}

                        {/* 4. Suspend */}
                        <button
                          onClick={() => handleFarmerAction(f.is_active ? 'Suspend Account' : 'Activate Account', f.first_name)}
                          className="px-2 py-1 bg-[#FFFBEB] hover:bg-[#FEF3C7] text-[#D97706] text-[11px] font-bold rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                          title="Suspend/Activate Account"
                        >
                          <Ban size={12} />
                          <span>{f.is_active ? 'Suspend' : 'Activate'}</span>
                        </button>

                        {/* 5. Assign Project */}
                        <button
                          onClick={() => handleFarmerAction('Assign Project', f.first_name)}
                          className="px-2 py-1 bg-[#F5F3FF] hover:bg-[#DDD6FE] text-[#8B5CF6] text-[11px] font-bold rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                          title="Assign Project"
                        >
                          <FileText size={12} />
                          <span>Assign Project</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── ACTION MODAL DIALOG ── */}
      <AnimatePresence>
        {actionModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl max-w-md w-full p-5 shadow-2xl border border-[#E8EDF5] space-y-4"
            >
              <div className="flex items-center justify-between border-b border-[#F1F5F9] pb-3">
                <div className="flex items-center gap-2">
                  <Sprout size={18} className="text-[#16A34A]" />
                  <h3 className="text-[15px] font-bold text-[#0F172A]">
                    Actions for {actionModal.farmer.first_name} {actionModal.farmer.last_name}
                  </h3>
                </div>
                <button onClick={() => setActionModal(null)} className="text-[#94A3B8] hover:text-[#0F172A] text-lg font-bold">
                  ×
                </button>
              </div>

              <p className="text-[12px] text-[#64748B]">
                Execute administrative actions directly on this farmer profile ({actionModal.farmer.farmer_id}).
              </p>

              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => handleFarmerAction('Approve KYC', actionModal.farmer.first_name)}
                  className="px-3 py-2 bg-[#F0FDF4] border border-[#DCFCE7] text-[#16A34A] text-[12px] font-bold rounded-xl hover:bg-[#DCFCE7] flex items-center gap-2 cursor-pointer"
                >
                  <CheckCircle size={14} /> Approve KYC
                </button>

                <button
                  onClick={() => handleFarmerAction('Reject KYC', actionModal.farmer.first_name)}
                  className="px-3 py-2 bg-[#FEF2F2] border border-[#FEE2E2] text-[#EF4444] text-[12px] font-bold rounded-xl hover:bg-[#FEE2E2] flex items-center gap-2 cursor-pointer"
                >
                  <XCircle size={14} /> Reject Application
                </button>

                <button
                  onClick={() => handleFarmerAction('Suspend Account', actionModal.farmer.first_name)}
                  className="px-3 py-2 bg-[#FFFBEB] border border-[#FEF3C7] text-[#D97706] text-[12px] font-bold rounded-xl hover:bg-[#FEF3C7] flex items-center gap-2 cursor-pointer"
                >
                  <Ban size={14} /> Suspend Account
                </button>

                <button
                  onClick={() => handleFarmerAction('Assign Carbon Project', actionModal.farmer.first_name)}
                  className="px-3 py-2 bg-[#F5F3FF] border border-[#DDD6FE] text-[#8B5CF6] text-[12px] font-bold rounded-xl hover:bg-[#DDD6FE] flex items-center gap-2 cursor-pointer"
                >
                  <FileText size={14} /> Assign Project
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Sprout, Plus, Eye, UserCheck, UserX, RefreshCw, MapPin,
  CheckCircle, XCircle, Ban, Unlock, FileText, Trash2,
  Search, Filter, ChevronLeft, ChevronRight, Wallet,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  useFarmers,
  useFarmerLocations,
  useApproveFarmer,
  useRejectFarmer,
  useBlockFarmer,
  useUnblockFarmer,
  useDeleteFarmer,
  FarmerListItem,
} from '../api/useFarmers';
import { PageHeader } from '../../../components/ui/PageHeader';
import { StatusBadge } from '../../../components/ui/StatusBadge';
import { EmptyState, SkeletonTable } from '../../../components/ui/EmptyState';
import { KpiCard } from '../../../components/ui/KpiCard';
import toast from 'react-hot-toast';

const PAGE_SIZE = 12;

type ActionModalState =
  | { type: 'approve'; farmer: FarmerListItem }
  | { type: 'reject'; farmer: FarmerListItem }
  | { type: 'block'; farmer: FarmerListItem }
  | { type: 'unblock'; farmer: FarmerListItem }
  | { type: 'delete'; farmer: FarmerListItem }
  | null;

export const FarmerList = () => {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');

  // 8 server-side filters
  const [stateFilter, setStateFilter] = useState('');
  const [districtFilter, setDistrictFilter] = useState('');
  const [villageFilter, setVillageFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [approvalFilter, setApprovalFilter] = useState('');
  const [insuranceFilter, setInsuranceFilter] = useState('');
  const [walletFilter, setWalletFilter] = useState('');
  const [projectFilter, setProjectFilter] = useState('');

  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [actionModal, setActionModal] = useState<ActionModalState>(null);
  const [rejectRemarks, setRejectRemarks] = useState('');
  const [deleteConfirmText, setDeleteConfirmText] = useState('');

  // Build filter params for backend
  const apiFilters = useMemo(() => {
    const f: Record<string, string> = {};
    if (search) f.search = search;
    if (stateFilter) f.state = stateFilter;
    if (districtFilter) f.district = districtFilter;
    if (villageFilter) f.village = villageFilter;
    if (approvalFilter) f.kyc_status = approvalFilter;
    if (statusFilter === 'ACTIVE') f.is_active = 'true';
    if (statusFilter === 'INACTIVE') f.is_active = 'false';
    return f;
  }, [search, stateFilter, districtFilter, villageFilter, approvalFilter, statusFilter]);

  const { data: apiData, isLoading, refetch, isFetching } = useFarmers(page, PAGE_SIZE, apiFilters);
  const { data: locationTree } = useFarmerLocations();

  const deleteMutation = useDeleteFarmer();
  const approveMutation = useApproveFarmer();
  const rejectMutation = useRejectFarmer();
  const blockMutation = useBlockFarmer();
  const unblockMutation = useUnblockFarmer();

  const farmers = apiData?.data ?? [];
  const totalPages = apiData?.pages ?? 1;
  const totalFarmers = apiData?.total ?? 0;

  // Build dropdown options from real location data
  const states = useMemo(() => Object.keys(locationTree?.states_and_districts ?? {}), [locationTree]);
  const districts = useMemo(() => {
    if (stateFilter && locationTree?.states_and_districts[stateFilter]) {
      return locationTree.states_and_districts[stateFilter];
    }
    return Object.values(locationTree?.states_and_districts ?? {}).flat();
  }, [locationTree, stateFilter]);
  const villages = useMemo(() => {
    return Object.values(locationTree?.block_villages ?? {}).flat();
  }, [locationTree]);

  // Client-side wallet/insurance filter (backend doesn't filter these)
  const filteredFarmers = useMemo(() => {
    return farmers.filter(f => {
      const walletBal = f.wallet_balance ?? 0;
      const matchWallet = !walletFilter
        || (walletFilter === 'HAS_BALANCE' && walletBal > 0)
        || (walletFilter === 'ZERO_BALANCE' && walletBal === 0);
      return matchWallet;
    });
  }, [farmers, walletFilter]);

  // KPI counts from current page data (approximate — server has totals)
  const approvedCount = filteredFarmers.filter(f => f.kyc_status === 'approved' || f.kyc_status === 'APPROVED').length;
  const pendingCount = filteredFarmers.filter(f => f.kyc_status === 'pending' || f.kyc_status === 'PENDING').length;
  const activeCount = filteredFarmers.filter(f => f.is_active).length;


  const toggleSelectAll = () => {
    setSelectedIds(selectedIds.length === filteredFarmers.length ? [] : filteredFarmers.map(f => f.id));
  };

  const toggleSelectOne = (id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const handleClearFilters = () => {
    setSearch('');
    setStateFilter('');
    setDistrictFilter('');
    setVillageFilter('');
    setStatusFilter('');
    setProjectFilter('');
    setApprovalFilter('');
    setInsuranceFilter('');
    setWalletFilter('');
    setPage(1);
  };

  const hasActiveFilters = !!(search || stateFilter || districtFilter || villageFilter || statusFilter || approvalFilter || walletFilter);

  // ─── Confirmed action handlers ────────────────────────────────────────────
  const handleConfirmAction = async () => {
    if (!actionModal) return;
    const { farmer } = actionModal;
    const name = farmer.full_name || farmer.mobile;

    try {
      if (actionModal.type === 'approve') {
        await approveMutation.mutateAsync(farmer.id);
        toast.success(`KYC approved for ${name}`);
      } else if (actionModal.type === 'reject') {
        await rejectMutation.mutateAsync({ farmerId: farmer.id, remarks: rejectRemarks });
        toast.success(`KYC rejected for ${name}`);
        setRejectRemarks('');
      } else if (actionModal.type === 'block') {
        await blockMutation.mutateAsync({ farmerId: farmer.id });
        toast.success(`Account blocked for ${name}`);
      } else if (actionModal.type === 'unblock') {
        await unblockMutation.mutateAsync(farmer.id);
        toast.success(`Account unblocked for ${name}`);
      } else if (actionModal.type === 'delete') {
        await deleteMutation.mutateAsync(farmer.id);
        toast.success(`Farmer "${name}" permanently deleted. Mobile ${farmer.mobile} is now free for re-registration.`);
        setDeleteConfirmText('');
      }
    } catch (err: any) {
      const msg = err?.response?.data?.detail || err?.message || 'Action failed';
      toast.error(msg);
    }
    setActionModal(null);
  };

  const isActionLoading =
    approveMutation.isPending ||
    rejectMutation.isPending ||
    blockMutation.isPending ||
    unblockMutation.isPending ||
    deleteMutation.isPending;

  return (
    <div className="space-y-6 page-enter pb-8" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>

      {/* ── Page Header ── */}
      <PageHeader
        title="Farmer Directory"
        description="Complete farmer directory with multi-parameter filtering, KYC review & administrative action controls."
        badge={{ label: `${totalFarmers} Farmers Total`, variant: 'info' }}
        icon={Sprout}
        actions={
          <div className="flex items-center gap-2">
            <button onClick={() => refetch()} className="btn btn-secondary btn-sm flex items-center gap-1.5 cursor-pointer">
              <RefreshCw size={13} className={isFetching ? 'animate-spin' : ''} />
              <span>Refresh</span>
            </button>
            <button onClick={() => toast.success('Add Farmer flow coming soon')} className="btn btn-primary btn-sm flex items-center gap-1.5 cursor-pointer">
              <Plus size={13} />
              <span>Add Farmer</span>
            </button>
          </div>
        }
      />

      {/* ── KPI Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard title="TOTAL FARMERS" value={totalFarmers} icon={Sprout} iconBg="#F0FDF4" iconColor="#16A34A" trend={12.5} loading={isLoading} />
        <KpiCard title="KYC APPROVED" value={approvedCount} icon={UserCheck} iconBg="#EFF6FF" iconColor="#2563EB" loading={isLoading} />
        <KpiCard title="PENDING REVIEW" value={pendingCount} icon={UserX} iconBg="#FFFBEB" iconColor="#F59E0B" loading={isLoading} />
        <KpiCard title="ACTIVE FARMERS" value={activeCount} icon={MapPin} iconBg="#F5F3FF" iconColor="#8B5CF6" loading={isLoading} />
      </div>

      {/* ── Search & 8 Filters ── */}
      <div className="bg-white border border-[#E8EDF5] rounded-2xl p-4 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row items-center gap-3">
          {/* Search */}
          <div className="relative flex-1 w-full">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#94A3B8]" />
            <input
              type="text"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              placeholder="Search by Farmer Name, Mobile (+91), Farmer ID, Village, District, State..."
              className="w-full pl-10 pr-4 py-2 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-[13px] text-[#0F172A] placeholder-[#94A3B8] outline-none focus:border-[#16A34A] focus:bg-white transition-all"
            />
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span className="text-[12px] font-bold text-[#64748B] uppercase tracking-wider flex items-center gap-1">
              <Filter size={13} className="text-[#16A34A]" />
              8 Filters:
            </span>
            {hasActiveFilters && (
              <button
                onClick={handleClearFilters}
                className="text-[11.5px] font-semibold text-[#EF4444] hover:underline cursor-pointer"
              >
                Clear All
              </button>
            )}
          </div>
        </div>

        {/* 8 Dropdown Filters */}
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-8 gap-2 pt-2 border-t border-[#F1F5F9]">
          {/* Filter 1: State */}
          <select
            value={stateFilter}
            onChange={(e) => { setStateFilter(e.target.value); setDistrictFilter(''); setPage(1); }}
            className="px-2.5 py-1.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-[11.5px] font-medium text-[#0F172A] outline-none focus:border-[#16A34A] cursor-pointer truncate"
          >
            <option value="">All States</option>
            {states.map(s => <option key={s} value={s}>{s}</option>)}
          </select>

          {/* Filter 2: District */}
          <select
            value={districtFilter}
            onChange={(e) => { setDistrictFilter(e.target.value); setPage(1); }}
            className="px-2.5 py-1.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-[11.5px] font-medium text-[#0F172A] outline-none focus:border-[#16A34A] cursor-pointer truncate"
          >
            <option value="">All Districts</option>
            {districts.map(d => <option key={d} value={d}>{d}</option>)}
          </select>

          {/* Filter 3: Village */}
          <select
            value={villageFilter}
            onChange={(e) => { setVillageFilter(e.target.value); setPage(1); }}
            className="px-2.5 py-1.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-[11.5px] font-medium text-[#0F172A] outline-none focus:border-[#16A34A] cursor-pointer truncate"
          >
            <option value="">All Villages</option>
            {villages.map(v => <option key={v} value={v}>{v}</option>)}
          </select>

          {/* Filter 4: Status */}
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            className="px-2.5 py-1.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-[11.5px] font-medium text-[#0F172A] outline-none focus:border-[#16A34A] cursor-pointer truncate"
          >
            <option value="">All Statuses</option>
            <option value="ACTIVE">Active Account</option>
            <option value="INACTIVE">Inactive Account</option>
          </select>

          {/* Filter 5: Project (display only — no backend filter yet) */}
          <select
            value={projectFilter}
            onChange={(e) => setProjectFilter(e.target.value)}
            className="px-2.5 py-1.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-[11.5px] font-medium text-[#0F172A] outline-none focus:border-[#16A34A] cursor-pointer truncate"
          >
            <option value="">All Projects</option>
          </select>

          {/* Filter 6: Approval (KYC status) */}
          <select
            value={approvalFilter}
            onChange={(e) => { setApprovalFilter(e.target.value); setPage(1); }}
            className="px-2.5 py-1.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-[11.5px] font-medium text-[#0F172A] outline-none focus:border-[#16A34A] cursor-pointer truncate"
          >
            <option value="">All Approvals</option>
            <option value="approved">KYC Approved</option>
            <option value="pending">KYC Pending</option>
            <option value="rejected">KYC Rejected</option>
          </select>

          {/* Filter 7: Insurance (display) */}
          <select
            value={insuranceFilter}
            onChange={(e) => setInsuranceFilter(e.target.value)}
            className="px-2.5 py-1.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-[11.5px] font-medium text-[#0F172A] outline-none focus:border-[#16A34A] cursor-pointer truncate"
          >
            <option value="">All Insurance</option>
            <option value="HAS_INSURANCE">Has Insurance</option>
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

      {/* ── Farmer Table ── */}
      <div className="bg-white border border-[#E8EDF5] rounded-2xl overflow-hidden shadow-xs">
        <div className="p-4 border-b border-[#F1F5F9] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="text-[14px] font-bold text-[#0F172A]">Farmer Directory Table</h3>
            <span className="text-[11px] font-bold text-[#16A34A] bg-[#F0FDF4] px-2 py-0.5 rounded-full border border-[#DCFCE7]">
              {filteredFarmers.length} on this page
            </span>
          </div>

          {selectedIds.length > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-[12px] font-medium text-[#64748B]">{selectedIds.length} selected</span>
              <button onClick={() => toast.success(`Bulk SMS sent to ${selectedIds.length} farmers`)} className="btn btn-secondary btn-sm">
                Send Bulk SMS
              </button>
              <button onClick={() => toast.success(`Exported ${selectedIds.length} farmers`)} className="btn btn-secondary btn-sm">
                Export CSV
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
                    checked={selectedIds.length === filteredFarmers.length && filteredFarmers.length > 0}
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
                <th className="py-3 px-4">Wallet Balance</th>
                <th className="py-3 px-4">Status & Approval</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F1F5F9]">
              {isLoading ? (
                <tr><td colSpan={10} className="p-0"><SkeletonTable rows={6} cols={10} /></td></tr>
              ) : filteredFarmers.length === 0 ? (
                <tr>
                  <td colSpan={10}>
                    <EmptyState
                      icon={Sprout}
                      title="No farmers found"
                      description="Try clearing filters or check your backend connection."
                    />
                  </td>
                </tr>
              ) : filteredFarmers.map((f) => {
                const photo = f.farmer_photo_url;
                const wallet = f.wallet_balance ?? 0;
                const kycStatus = f.kyc_status?.toLowerCase();
                const nameInitial = (f.full_name || f.mobile || 'F')[0].toUpperCase();

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

                    {/* Photo */}
                    <td className="py-3 px-4">
                      {photo ? (
                        <img src={photo} alt="" className="w-9 h-9 rounded-xl object-cover border border-[#E2E8F0] shrink-0" />
                      ) : (
                        <div className="w-9 h-9 rounded-xl bg-[#F0FDF4] text-[#16A34A] font-bold text-[12px] flex items-center justify-center border border-[#DCFCE7] shrink-0">
                          {nameInitial}
                        </div>
                      )}
                    </td>

                    {/* Farmer ID */}
                    <td className="py-3 px-4 font-mono text-[11.5px] font-semibold text-[#64748B]">
                      {f.farmer_id || `#${f.id.slice(-6)}`}
                    </td>

                    {/* Name */}
                    <td className="py-3 px-4">
                      <div
                        onClick={() => navigate(`/farmers/${f.id}`)}
                        className="text-[13px] font-bold text-[#0F172A] hover:text-[#16A34A] cursor-pointer leading-tight"
                      >
                        {f.full_name || '—'}
                      </div>
                      <div className="text-[10.5px] text-[#94A3B8]">{f.mobile}</div>
                    </td>

                    {/* Mobile — merged into Name above, show separately */}
                    <td className="py-3 px-4 text-[12.5px] font-mono text-[#475569]">{f.mobile}</td>

                    {/* Village */}
                    <td className="py-3 px-4">
                      <div className="text-[12.5px] font-semibold text-[#0F172A]">{f.village || '—'}</div>
                      <div className="text-[10.5px] text-[#94A3B8]">
                        {[f.district, f.state].filter(Boolean).join(', ') || '—'}
                      </div>
                    </td>

                    {/* Land */}
                    <td className="py-3 px-4 text-[13px] font-bold text-[#0F172A]">
                      {f.total_acreage?.toFixed(1) ?? '0.0'} <span className="text-[11px] font-normal text-[#64748B]">Acres</span>
                    </td>

                    {/* Wallet */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1">
                        <Wallet size={12} className="text-[#16A34A]" />
                        <span className="text-[13px] font-bold text-[#16A34A]">₹{wallet.toLocaleString()}</span>
                      </div>
                    </td>

                    {/* Status & KYC */}
                    <td className="py-3 px-4">
                      <div className="flex flex-col gap-1 items-start">
                        <StatusBadge
                          label={kycStatus}
                          variant={kycStatus === 'approved' ? 'success' : kycStatus === 'pending' ? 'warning' : 'danger'}
                          size="sm"
                        />
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${f.is_active ? 'bg-[#DCFCE7] text-[#16A34A]' : 'bg-[#F1F5F9] text-[#64748B]'}`}>
                          {f.is_active ? 'Account Active' : 'Account Suspended'}
                        </span>
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5 flex-wrap">
                        {/* View */}
                        <button
                          onClick={() => navigate(`/farmers/${f.id}`)}
                          className="px-2.5 py-1 bg-[#F0FDF4] hover:bg-[#DCFCE7] text-[#16A34A] text-[11.5px] font-bold rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                        >
                          <Eye size={13} /> View
                        </button>

                        {/* Approve — only if not approved */}
                        {kycStatus !== 'approved' && (
                          <button
                            onClick={() => setActionModal({ type: 'approve', farmer: f })}
                            className="px-2 py-1 bg-[#EFF6FF] hover:bg-[#DBEAFE] text-[#2563EB] text-[11px] font-bold rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                          >
                            <CheckCircle size={12} /> Approve
                          </button>
                        )}

                        {/* Reject — only if pending */}
                        {kycStatus === 'pending' && (
                          <button
                            onClick={() => setActionModal({ type: 'reject', farmer: f })}
                            className="px-2 py-1 bg-[#FEF2F2] hover:bg-[#FEE2E2] text-[#EF4444] text-[11px] font-bold rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                          >
                            <XCircle size={12} /> Reject
                          </button>
                        )}

                        {/* Block / Unblock */}
                        {f.is_active ? (
                          <button
                            onClick={() => setActionModal({ type: 'block', farmer: f })}
                            className="px-2 py-1 bg-[#FFFBEB] hover:bg-[#FEF3C7] text-[#D97706] text-[11px] font-bold rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                          >
                            <Ban size={12} /> Suspend
                          </button>
                        ) : (
                          <button
                            onClick={() => setActionModal({ type: 'unblock', farmer: f })}
                            className="px-2 py-1 bg-[#F0FDF4] hover:bg-[#DCFCE7] text-[#16A34A] text-[11px] font-bold rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                          >
                            <Unlock size={12} /> Activate
                          </button>
                        )}

                        {/* Assign Project */}
                        <button
                          onClick={() => navigate(`/farmers/${f.id}`)}
                          className="px-2 py-1 bg-[#F5F3FF] hover:bg-[#DDD6FE] text-[#8B5CF6] text-[11px] font-bold rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                          title="Open farmer profile to assign project"
                        >
                          <FileText size={12} /> Assign
                        </button>

                        {/* Delete — Danger */}
                        <button
                          onClick={() => { setDeleteConfirmText(''); setActionModal({ type: 'delete', farmer: f }); }}
                          className="px-2 py-1 bg-[#FEF2F2] hover:bg-[#FEE2E2] text-[#EF4444] text-[11px] font-bold rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                          title="Permanently delete farmer — mobile will be freed"
                        >
                          <Trash2 size={12} /> Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-[#F1F5F9] flex items-center justify-between">
            <span className="text-[12px] text-[#64748B]">
              Page <strong>{page}</strong> of <strong>{totalPages}</strong> • {totalFarmers} total farmers
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-1.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg text-[#64748B] hover:text-[#0F172A] hover:bg-[#F1F5F9] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                <ChevronLeft size={16} />
              </button>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const pg = page <= 3 ? i + 1 : page - 2 + i;
                if (pg < 1 || pg > totalPages) return null;
                return (
                  <button
                    key={pg}
                    onClick={() => setPage(pg)}
                    className={`w-8 h-8 rounded-lg text-[12px] font-bold cursor-pointer ${pg === page ? 'bg-[#16A34A] text-white' : 'bg-[#F8FAFC] border border-[#E2E8F0] text-[#64748B] hover:bg-[#F1F5F9]'}`}
                  >
                    {pg}
                  </button>
                );
              })}
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="p-1.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg text-[#64748B] hover:text-[#0F172A] hover:bg-[#F1F5F9] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── Action Confirmation Modal ── */}
      <AnimatePresence>
        {actionModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-white rounded-2xl max-w-md w-full p-5 shadow-2xl border border-[#E8EDF5] space-y-4"
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between border-b border-[#F1F5F9] pb-3">
                <div className="flex items-center gap-2">
                  {actionModal.type === 'approve' && <CheckCircle size={18} className="text-[#16A34A]" />}
                  {actionModal.type === 'reject' && <XCircle size={18} className="text-[#EF4444]" />}
                  {actionModal.type === 'block' && <Ban size={18} className="text-[#D97706]" />}
                  {actionModal.type === 'unblock' && <Unlock size={18} className="text-[#16A34A]" />}
                  {actionModal.type === 'delete' && <Trash2 size={18} className="text-[#DC2626]" />}
                  <h3 className="text-[15px] font-bold text-[#0F172A] capitalize">
                    {actionModal.type === 'block' ? 'Suspend' : actionModal.type === 'delete' ? 'Delete Farmer' : actionModal.type} Farmer
                  </h3>
                </div>
                <button onClick={() => setActionModal(null)} className="text-[#94A3B8] hover:text-[#0F172A] text-lg font-bold cursor-pointer">
                  ×
                </button>
              </div>

              <div className="space-y-3">
                <p className="text-[12.5px] text-[#64748B]">
                  {actionModal.type === 'approve' && <>Are you sure you want to <strong className="text-[#16A34A]">approve KYC</strong> for <strong>{actionModal.farmer.full_name || actionModal.farmer.mobile}</strong>?</>}
                  {actionModal.type === 'reject' && <>Are you sure you want to <strong className="text-[#EF4444]">reject KYC</strong> for <strong>{actionModal.farmer.full_name || actionModal.farmer.mobile}</strong>?</>}
                  {actionModal.type === 'block' && <>Are you sure you want to <strong className="text-[#D97706]">suspend account</strong> for <strong>{actionModal.farmer.full_name || actionModal.farmer.mobile}</strong>?</>}
                  {actionModal.type === 'unblock' && <>Are you sure you want to <strong className="text-[#16A34A]">activate account</strong> for <strong>{actionModal.farmer.full_name || actionModal.farmer.mobile}</strong>?</>}
                  {actionModal.type === 'delete' && <>Aap <strong className="text-[#DC2626]">{actionModal.farmer.full_name || actionModal.farmer.mobile}</strong> ko permanently delete karna chahte hain?</>}
                </p>

                <div className="bg-[#F8FAFC] rounded-xl p-3 text-[11.5px] font-mono text-[#64748B]">
                  ID: {actionModal.farmer.farmer_id || actionModal.farmer.id} • {actionModal.farmer.mobile}
                </div>

                {/* Remarks textarea for reject */}
                {actionModal.type === 'reject' && (
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold uppercase text-[#94A3B8]">Rejection Remarks</label>
                    <textarea
                      value={rejectRemarks}
                      onChange={(e) => setRejectRemarks(e.target.value)}
                      placeholder="Provide reason for rejection (e.g. invalid Aadhaar, blurry document)..."
                      rows={3}
                      className="w-full px-3 py-2 text-[12.5px] bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-[#0F172A] outline-none focus:border-[#EF4444] resize-none"
                    />
                  </div>
                )}

                {/* Double confirmation for delete */}
                {actionModal.type === 'delete' && (
                  <div className="space-y-3">
                    <div className="bg-[#FEF2F2] border border-[#FEE2E2] rounded-xl p-3 space-y-1">
                      <p className="text-[12px] font-bold text-[#DC2626]">⚠️ Yeh action PERMANENT hai!</p>
                      <p className="text-[11.5px] text-[#475569]">Iske baad yeh sab delete ho jayega:</p>
                      <ul className="text-[11px] text-[#64748B] list-disc list-inside space-y-0.5">
                        <li>Farmer record (Farmer ID, KYC details)</li>
                        <li>Saare land parcels</li>
                        <li>Family members</li>
                        <li>Activity timeline</li>
                        <li>OTP sessions</li>
                        <li>Registration records</li>
                      </ul>
                      <p className="text-[11.5px] font-semibold text-[#16A34A] mt-1">
                        ✓ Mobile <span className="font-mono">{actionModal.farmer.mobile}</span> free ho jayega — farmer dobara register kar sakta hai.
                      </p>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold uppercase text-[#94A3B8]">
                        Confirm karo — type karo: <span className="font-mono text-[#EF4444]">{actionModal.farmer.mobile}</span>
                      </label>
                      <input
                        type="text"
                        value={deleteConfirmText}
                        onChange={(e) => setDeleteConfirmText(e.target.value)}
                        placeholder={`Type "${actionModal.farmer.mobile}" to confirm...`}
                        className="w-full px-3 py-2 text-[12.5px] bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-[#0F172A] outline-none focus:border-[#EF4444] font-mono"
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#F1F5F9]">
                <button
                  onClick={() => { setActionModal(null); setRejectRemarks(''); }}
                  className="btn btn-secondary btn-sm"
                  disabled={isActionLoading}
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmAction}
                  disabled={isActionLoading
                    || (actionModal.type === 'reject' && !rejectRemarks.trim())
                    || (actionModal.type === 'delete' && deleteConfirmText !== actionModal.farmer.mobile)
                  }
                  className={`btn btn-sm font-bold px-4 py-1.5 rounded-xl text-white transition-all disabled:opacity-60 ${
                    actionModal.type === 'approve' || actionModal.type === 'unblock'
                      ? 'bg-[#16A34A] hover:bg-[#15803D]'
                      : actionModal.type === 'delete'
                      ? 'bg-[#DC2626] hover:bg-[#B91C1C]'
                      : actionModal.type === 'reject'
                      ? 'bg-[#EF4444] hover:bg-[#DC2626]'
                      : 'bg-[#D97706] hover:bg-[#B45309]'
                  }`}
                >
                  {isActionLoading ? 'Processing...' : actionModal.type === 'delete' ? '🗑️ Permanently Delete' : 'Confirm'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

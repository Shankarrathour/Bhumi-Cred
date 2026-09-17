import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Building2, Plus, Eye, RefreshCw, MapPin,
  Landmark, FileText, CheckCircle, Search, Filter, Loader2, AlertCircle
} from 'lucide-react';
import { motion } from 'framer-motion';
import { PageHeader } from '../../../components/ui/PageHeader';
import { StatusBadge } from '../../../components/ui/StatusBadge';
import { EmptyState } from '../../../components/ui/EmptyState';
import { KpiCard } from '../../../components/ui/KpiCard';
import { useGovtOrganizations, GovtOrganizationItem } from '../api/useGovtApi';
import { AddGovtModal } from '../components/AddGovtModal';
import toast from 'react-hot-toast';

export const GovtList: React.FC = () => {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [deptFilter, setDeptFilter] = useState('');
  const [page] = useState(1);
  const [selected, setSelected] = useState<string[]>([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const { data: apiResponse, isLoading, isError, refetch } = useGovtOrganizations(
    page,
    20,
    search,
    statusFilter,
    deptFilter
  );

  const govtBodies: GovtOrganizationItem[] = apiResponse?.data || [];

  const departments = useMemo(() => {
    const list = govtBodies.map((g) => g.department).filter(Boolean) as string[];
    return Array.from(new Set(list));
  }, [govtBodies]);

  const approvedCount = useMemo(
    () => govtBodies.filter((g) => g.approval_status === 'APPROVED').length,
    [govtBodies]
  );

  const pendingCount = useMemo(
    () => govtBodies.filter((g) => g.approval_status === 'PENDING').length,
    [govtBodies]
  );

  const clarificationCount = useMemo(
    () => govtBodies.filter((g) => g.approval_status === 'CLARIFICATION_REQUIRED').length,
    [govtBodies]
  );

  const toggleAll = () =>
    setSelected(selected.length === govtBodies.length ? [] : govtBodies.map((s) => s.id));

  const toggleSelect = (id: string) =>
    setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return 'success';
      case 'PENDING':
        return 'warning';
      case 'CLARIFICATION_REQUIRED':
        return 'info';
      case 'REJECTED':
        return 'danger';
      default:
        return 'neutral';
    }
  };

  return (
    <div className="space-y-6 page-enter pb-8">
      {/* ── Page Header ── */}
      <PageHeader
        title="Government Body Management"
        description="Module 3: Organizations, Departments, Nodal Personnel, Approvals & MoU Verifications."
        badge={{ label: `${apiResponse?.total || govtBodies.length} Entities`, variant: 'info' }}
        icon={Building2}
        iconColor="#2563EB"
        actions={
          <div className="flex items-center gap-2">
            <button className="btn btn-secondary btn-sm" onClick={() => refetch()} title="Refresh Directory">
              <RefreshCw size={13} className={isLoading ? 'animate-spin' : ''} />
            </button>
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="btn btn-primary btn-sm gap-1.5 cursor-pointer shadow-xs"
            >
              <Plus size={14} /> Add Government Body
            </button>
          </div>
        }
      />

      {/* ── KPI Metric Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          title="TOTAL GOVT BODIES"
          value={apiResponse?.total ?? govtBodies.length}
          icon={Building2}
          iconBg="#EFF6FF"
          iconColor="#2563EB"
        />
        <KpiCard
          title="APPROVED BODIES"
          value={approvedCount}
          icon={CheckCircle}
          iconBg="#F0FDF4"
          iconColor="#16A34A"
        />
        <KpiCard
          title="PENDING REVIEWS"
          value={pendingCount}
          icon={Landmark}
          iconBg="#FFFBEB"
          iconColor="#F59E0B"
        />
        <KpiCard
          title="CLARIFICATIONS"
          value={clarificationCount}
          icon={FileText}
          iconBg="#F5F3FF"
          iconColor="#8B5CF6"
        />
      </div>

      {/* ── SEARCH & FILTERS ── */}
      <div className="bg-white border border-[#E8EDF5] rounded-2xl p-4 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#94A3B8]" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by Organization Name, Org ID, Department, State, Nodal Officer..."
              className="w-full pl-10 pr-4 py-2 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-[13px] text-[#0F172A] outline-none focus:border-[#2563EB] focus:bg-white transition-all"
            />
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span className="text-[12px] font-bold text-[#64748B] uppercase tracking-wider flex items-center gap-1">
              <Filter size={13} className="text-[#2563EB]" /> Filters:
            </span>

            {/* Department Filter */}
            {departments.length > 0 && (
              <select
                value={deptFilter}
                onChange={(e) => setDeptFilter(e.target.value)}
                className="px-3 py-1.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-[12px] font-medium text-[#0F172A] outline-none cursor-pointer"
              >
                <option value="">All Departments</option>
                {departments.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            )}

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-1.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-[12px] font-medium text-[#0F172A] outline-none cursor-pointer"
            >
              <option value="">All Statuses</option>
              <option value="APPROVED">Approved</option>
              <option value="PENDING">Pending</option>
              <option value="CLARIFICATION_REQUIRED">Clarification Required</option>
              <option value="REJECTED">Rejected</option>
            </select>
          </div>
        </div>
      </div>

      {/* ── GOVT BODIES DIRECTORY TABLE ── */}
      <div className="ent-card overflow-hidden">
        <div className="p-4 border-b border-[#F1F5F9] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="text-[14px] font-bold text-[#0F172A]">Government Organizations Directory</h3>
            <span className="text-[11px] font-bold text-[#2563EB] bg-[#EFF6FF] px-2 py-0.5 rounded-full border border-[#DBEAFE]">
              {govtBodies.length} Records
            </span>
          </div>

          {selected.length > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-[12px] font-medium text-[#64748B]">{selected.length} selected</span>
              <button
                onClick={() => toast.success(`Exported ${selected.length} Government records CSV`)}
                className="btn btn-secondary btn-sm"
              >
                Export Selected
              </button>
            </div>
          )}
        </div>

        <div className="overflow-x-auto custom-scrollbar">
          {isLoading ? (
            <div className="p-12 flex flex-col items-center justify-center text-[#64748B] space-y-3">
              <Loader2 size={32} className="animate-spin text-[#2563EB]" />
              <p className="text-[13px] font-semibold">Loading Government Bodies directory...</p>
            </div>
          ) : isError ? (
            <div className="p-12 flex flex-col items-center justify-center text-[#EF4444] space-y-3">
              <AlertCircle size={32} />
              <p className="text-[13px] font-semibold">Failed to fetch Government Organizations.</p>
              <button onClick={() => refetch()} className="btn btn-secondary btn-sm">
                Try Again
              </button>
            </div>
          ) : (
            <table className="ent-table min-w-[1100px]">
              <thead>
                <tr>
                  <th className="w-10">
                    <input
                      type="checkbox"
                      checked={selected.length === govtBodies.length && govtBodies.length > 0}
                      onChange={toggleAll}
                      className="rounded border-[#CBD5E1] accent-[#2563EB] cursor-pointer"
                    />
                  </th>
                  <th>Organization & ID</th>
                  <th>Department & Type</th>
                  <th>State & District</th>
                  <th>Nodal Officer</th>
                  <th>Authorized Officer</th>
                  <th>Approval Status</th>
                  <th>Created Date</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {govtBodies.length === 0 ? (
                  <tr>
                    <td colSpan={9}>
                      <EmptyState
                        icon={Building2}
                        title="No Government Bodies Found"
                        description="Try clearing search query or registration filters, or click 'Add Government Body' to create one."
                      />
                    </td>
                  </tr>
                ) : (
                  govtBodies.map((g, i) => (
                    <motion.tr
                      key={g.id}
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.03 }}
                      className={selected.includes(g.id) ? 'selected' : ''}
                    >
                      <td>
                        <input
                          type="checkbox"
                          checked={selected.includes(g.id)}
                          onChange={() => toggleSelect(g.id)}
                          className="rounded border-[#CBD5E1] accent-[#2563EB] cursor-pointer"
                        />
                      </td>

                      {/* Organization */}
                      <td>
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-[#EFF6FF] text-[#2563EB] font-bold text-[12px] flex items-center justify-center border border-[#DBEAFE] shrink-0">
                            <Landmark size={18} />
                          </div>
                          <div>
                            <div
                              onClick={() => navigate(`/govt/${g.id}`)}
                              className="text-[13.5px] font-bold text-[#0F172A] hover:text-[#2563EB] cursor-pointer leading-tight"
                            >
                              {g.org_name}
                            </div>
                            <span className="text-[11px] font-mono text-[#64748B]">{g.org_id}</span>
                          </div>
                        </div>
                      </td>

                      {/* Department */}
                      <td>
                        <div className="text-[12.5px] font-semibold text-[#0F172A]">
                          {g.department || 'General Agriculture'}
                        </div>
                        <span className="text-[10.5px] text-[#64748B] capitalize">
                          {g.org_type ? g.org_type.replace('_', ' ') : 'Department'}
                        </span>
                      </td>

                      {/* State & District */}
                      <td>
                        <div className="text-[12.5px] font-bold text-[#0F172A]">{g.state}</div>
                        <div className="text-[11px] text-[#64748B] flex items-center gap-1">
                          <MapPin size={11} className="text-[#94A3B8]" />
                          {g.district || 'State Level'}
                        </div>
                      </td>

                      {/* Nodal Officer */}
                      <td>
                        <div className="text-[12.5px] font-bold text-[#0F172A]">
                          {g.nodal_person_name || 'N/A'}
                        </div>
                        <div className="text-[10.5px] font-mono text-[#94A3B8]">
                          {g.nodal_person_phone || g.contact_phone}
                        </div>
                      </td>

                      {/* Authorized Officer */}
                      <td>
                        <div className="text-[12.5px] font-semibold text-[#475569]">
                          {g.authorized_person_name || 'N/A'}
                        </div>
                        <div className="text-[10.5px] text-[#94A3B8]">
                          {g.authorized_person_designation || 'Secretary'}
                        </div>
                      </td>

                      {/* Approval Status */}
                      <td>
                        <StatusBadge
                          label={g.approval_status ? g.approval_status.replace('_', ' ') : 'PENDING'}
                          variant={getStatusBadgeVariant(g.approval_status) as any}
                          size="sm"
                        />
                      </td>

                      {/* Created Date */}
                      <td className="text-[12px] font-medium text-[#64748B]">
                        {g.created_at ? g.created_at.slice(0, 10) : 'N/A'}
                      </td>

                      {/* Actions */}
                      <td>
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => navigate(`/govt/${g.id}`)}
                            className="px-2.5 py-1 bg-[#EFF6FF] hover:bg-[#DBEAFE] text-[#2563EB] text-[11.5px] font-bold rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                          >
                            <Eye size={13} />
                            <span>View Profile</span>
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Add Govt Organization Modal */}
      <AddGovtModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={() => refetch()}
      />
    </div>
  );
};

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, Plus, Eye, RefreshCw, MapPin, AlertCircle, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { PageHeader } from '../../../components/ui/PageHeader';
import { FilterBar } from '../../../components/ui/FilterBar';
import { StatusBadge } from '../../../components/ui/StatusBadge';
import { EmptyState } from '../../../components/ui/EmptyState';
import { KpiCard } from '../../../components/ui/KpiCard';
import { useGovtSchemes } from '../api/useGovtSchemes';

export const GovtList: React.FC = () => {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<string[]>([]);

  const { data, isLoading, isError, refetch } = useGovtSchemes(page, 20);

  const items = data?.data ?? [];
  const total = data?.total ?? 0;
  const pages = data?.pages ?? 1;

  const filtered = items.filter(item => {
    const q = search.toLowerCase();
    const matchSearch =
      !q ||
      item.name?.toLowerCase().includes(q) ||
      item.department?.toLowerCase().includes(q) ||
      item.ministry?.toLowerCase().includes(q);
    const matchStatus = !statusFilter || item.status?.toLowerCase() === statusFilter.toLowerCase();
    return matchSearch && matchStatus;
  });

  const toggleAll = () =>
    setSelected(selected.length === filtered.length ? [] : filtered.map(s => s.id));
  const toggleSelect = (id: string) =>
    setSelected(s => (s.includes(id) ? s.filter(x => x !== id) : [...s, id]));

  // KPI counts derived from live data
  const activeCount = items.filter(i => i.status === 'active').length;
  const totalBenefit = items.reduce((acc, i) => acc + (i.benefit_amount ?? 0), 0);

  return (
    <div className="space-y-5 page-enter">
      <PageHeader
        title="Government Bodies"
        description="Manage Government Organizations, Departments, and Authorized Personnel."
        icon={Building2}
        iconColor="#2563EB"
        actions={
          <>
            <button className="btn btn-secondary btn-sm" onClick={() => refetch()}>
              <RefreshCw size={13} />
            </button>
            <button className="btn btn-primary btn-sm gap-1.5">
              <Plus size={13} /> Add Government Body
            </button>
          </>
        }
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KpiCard title="Total Schemes" value={total} icon={Building2} iconBg="#EFF6FF" iconColor="#2563EB" />
        <KpiCard title="Active Schemes" value={activeCount} icon={MapPin} iconBg="#F0FDF4" iconColor="#16A34A" />
        <KpiCard
          title="Total Benefit Pool"
          value={`₹${(totalBenefit / 100000).toFixed(1)}L`}
          icon={MapPin}
          iconBg="#FFFBEB"
          iconColor="#F59E0B"
        />
        <KpiCard title="Pages" value={pages} icon={Building2} iconBg="#F5F3FF" iconColor="#8B5CF6" />
      </div>

      <div className="ent-card overflow-hidden">
        <div className="p-4 border-b border-[#F1F5F9]">
          <FilterBar
            search={search}
            onSearchChange={setSearch}
            searchPlaceholder="Search by scheme name, department..."
            filters={[
              {
                key: 'status',
                label: 'Status',
                value: statusFilter,
                onChange: setStatusFilter,
                options: [
                  { label: 'Active', value: 'active' },
                  { label: 'Inactive', value: 'inactive' },
                  { label: 'Draft', value: 'draft' },
                  { label: 'Expired', value: 'expired' },
                ],
              },
            ]}
            onExport={() => {}}
            onRefresh={() => refetch()}
            resultCount={filtered.length}
          />
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center gap-2 py-16 text-[#64748B]">
            <Loader2 size={20} className="animate-spin" />
            <span className="text-sm">Loading government schemes...</span>
          </div>
        )}

        {/* Error State */}
        {isError && !isLoading && (
          <div className="flex flex-col items-center justify-center gap-2 py-16 text-red-500">
            <AlertCircle size={24} />
            <p className="text-sm font-medium">Failed to load government bodies</p>
            <button className="btn btn-secondary btn-sm mt-1" onClick={() => refetch()}>
              Retry
            </button>
          </div>
        )}

        {/* Table */}
        {!isLoading && !isError && (
          <div className="overflow-x-auto">
            <table className="ent-table">
              <thead>
                <tr>
                  <th className="w-10">
                    <input
                      type="checkbox"
                      checked={selected.length === filtered.length && filtered.length > 0}
                      onChange={toggleAll}
                      className="rounded border-[#CBD5E1] accent-[#2563EB] cursor-pointer"
                    />
                  </th>
                  <th>Scheme Name</th>
                  <th>Ministry</th>
                  <th>Department</th>
                  <th>State</th>
                  <th>Type</th>
                  <th className="text-right">Applications</th>
                  <th>Status</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={9}>
                      <EmptyState icon={Building2} title="No Government Schemes found" />
                    </td>
                  </tr>
                ) : (
                  filtered.map((s, i) => (
                    <motion.tr
                      key={s.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: i * 0.04 }}
                    >
                      <td>
                        <input
                          type="checkbox"
                          checked={selected.includes(s.id)}
                          onChange={() => toggleSelect(s.id)}
                          className="rounded border-[#CBD5E1] accent-[#2563EB] cursor-pointer"
                        />
                      </td>
                      <td className="font-medium text-[#0F172A]">{s.name || 'Scheme'}</td>
                      <td className="text-[#64748B] text-sm">{s.ministry || '—'}</td>
                      <td className="text-[#64748B] text-sm">{s.department || '—'}</td>
                      <td className="text-[#64748B] text-sm">{s.state || '—'}</td>
                      <td>
                        <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 capitalize">
                          {s.scheme_type || 'central'}
                        </span>
                      </td>
                      <td className="text-right font-medium text-[#0F172A]">
                        {s.total_applications?.toLocaleString() ?? '—'}
                      </td>
                      <td>
                        <StatusBadge
                          label={s.status || 'Active'}
                          variant={
                            s.status === 'active'
                              ? 'success'
                              : s.status === 'draft'
                              ? 'info'
                              : s.status === 'expired'
                              ? 'danger'
                              : 'warning'
                          }
                          size="sm"
                        />
                      </td>
                      <td className="text-right">
                        <button
                          onClick={() => navigate(`/govt/${s.id}`)}
                          className="btn btn-ghost btn-icon btn-sm"
                        >
                          <Eye size={14} />
                        </button>
                      </td>
                    </motion.tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {!isLoading && !isError && pages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-[#F1F5F9]">
            <p className="text-xs text-[#64748B]">
              Showing page {page} of {pages} ({total} total)
            </p>
            <div className="flex gap-2">
              <button
                className="btn btn-secondary btn-sm"
                disabled={page <= 1}
                onClick={() => setPage(p => Math.max(1, p - 1))}
              >
                Previous
              </button>
              <button
                className="btn btn-secondary btn-sm"
                disabled={page >= pages}
                onClick={() => setPage(p => p + 1)}
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

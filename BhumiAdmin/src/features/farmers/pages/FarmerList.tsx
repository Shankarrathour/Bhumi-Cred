import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sprout, Plus, Eye, UserCheck, UserX, Download, RefreshCw, MapPin } from 'lucide-react';
import { motion } from 'framer-motion';
import { useFarmers, FarmerListItem } from '../api/useFarmers';
import { PageHeader } from '../../../components/ui/PageHeader';
import { FilterBar } from '../../../components/ui/FilterBar';
import { StatusBadge, getStatusVariant } from '../../../components/ui/StatusBadge';
import { EmptyState, SkeletonTable } from '../../../components/ui/EmptyState';
import { KpiCard } from '../../../components/ui/KpiCard';

const PAGE_SIZE = 15;

export const FarmerList = () => {
  const navigate = useNavigate();
  const [page, setPage]       = useState(1);
  const [search, setSearch]   = useState('');
  const [kycFilter, setKyc]   = useState('');
  const [selected, setSelected] = useState<string[]>([]);

  const { data, isLoading, refetch, isFetching } = useFarmers(page, PAGE_SIZE);
  const farmers = data?.data ?? [];
  const total   = data?.total ?? 0;
  const pages   = data?.pages ?? 1;

  const filtered = farmers.filter(f => {
    const q = search.toLowerCase();
    const matchSearch = !q || [f.first_name, f.last_name, f.mobile, f.farmer_id, f.village, f.state, f.district]
      .some(v => v?.toLowerCase().includes(q));
    const matchKyc = !kycFilter || f.kyc_status === kycFilter;
    return matchSearch && matchKyc;
  });

  const toggleSelect = (id: string) =>
    setSelected(s => s.includes(id) ? s.filter(x => x !== id) : [...s, id]);
  const toggleAll = () =>
    setSelected(selected.length === filtered.length ? [] : filtered.map(f => f.id));

  const kycVariant = (status: string) => {
    if (status === 'APPROVED') return 'success';
    if (status === 'PENDING')  return 'warning';
    if (status === 'REJECTED') return 'danger';
    return 'gray';
  };

  return (
    <div className="space-y-5 page-enter">

      <PageHeader
        title="Farmer Management"
        description="Manage, verify and track all farmers registered on the BhumiCred platform."
        badge={{ label: `${total.toLocaleString()} registered`, variant: 'info' }}
        icon={Sprout}
        actions={
          <>
            <button onClick={() => refetch()} className="btn btn-secondary btn-sm">
              <RefreshCw size={13} className={isFetching ? 'animate-spin' : ''} />
            </button>
            <button className="btn btn-primary btn-sm">
              <Plus size={13} /> Add Farmer
            </button>
          </>
        }
      />

      {/* KPI row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KpiCard title="Total Farmers"    value={total}  icon={Sprout}   iconBg="#F0FDF4" iconColor="#16A34A" trend={12.5} loading={isLoading} />
        <KpiCard title="KYC Approved"     value={farmers.filter(f=>f.kyc_status==='APPROVED').length} icon={UserCheck} iconBg="#EFF6FF" iconColor="#2563EB" loading={isLoading} />
        <KpiCard title="Pending Review"   value={farmers.filter(f=>f.kyc_status==='PENDING').length}  icon={UserX}    iconBg="#FFFBEB" iconColor="#F59E0B" loading={isLoading} />
        <KpiCard title="Active Farmers"   value={farmers.filter(f=>f.is_active).length}               icon={MapPin}   iconBg="#F5F3FF" iconColor="#8B5CF6" loading={isLoading} />
      </div>

      {/* Table card */}
      <div className="ent-card overflow-hidden">
        <div className="p-4 border-b border-[#F1F5F9]">
          <FilterBar
            search={search} onSearchChange={setSearch}
            searchPlaceholder="Search by name, mobile, ID, village..."
            filters={[{
              key: 'kyc', label: 'KYC Status', value: kycFilter, onChange: setKyc,
              options: [
                { label: 'Approved', value: 'APPROVED' },
                { label: 'Pending',  value: 'PENDING'  },
                { label: 'Rejected', value: 'REJECTED' },
              ],
            }]}
            onExport={() => {}}
            onRefresh={() => refetch()}
            loading={isFetching}
            resultCount={filtered.length}
            extraActions={
              selected.length > 0 ? (
                <div className="flex items-center gap-2">
                  <span className="text-[12px] text-[#64748B]">{selected.length} selected</span>
                  <button className="btn btn-secondary btn-sm">Bulk Export</button>
                  <button className="btn btn-danger btn-sm">Delete</button>
                </div>
              ) : null
            }
          />
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="ent-table">
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
                <th>Farmer ID</th>
                <th>Farmer</th>
                <th>Mobile</th>
                <th>Location</th>
                <th>Land (acres)</th>
                <th>KYC Status</th>
                <th>Status</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={9} className="p-0"><SkeletonTable rows={8} cols={7} /></td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={9}>
                  <EmptyState
                    icon={Sprout}
                    title="No farmers found"
                    description="Try adjusting your search or filters."
                  />
                </td></tr>
              ) : filtered.map((f, i) => (
                <motion.tr
                  key={f.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.025 }}
                  className={selected.includes(f.id) ? 'selected' : ''}
                >
                  <td>
                    <input
                      type="checkbox"
                      checked={selected.includes(f.id)}
                      onChange={() => toggleSelect(f.id)}
                      className="rounded border-[#CBD5E1] accent-[#16A34A] cursor-pointer"
                    />
                  </td>
                  <td>
                    <span className="font-mono text-[12px] text-[#64748B] bg-[#F8FAFC] px-2 py-0.5 rounded-[6px]">
                      {f.farmer_id || f.id?.slice(-8)}
                    </span>
                  </td>
                  <td>
                    <div className="flex items-center gap-2.5">
                      <div className="shrink-0 w-8 h-8 rounded-[10px] bg-[#F0FDF4] flex items-center justify-center text-[#16A34A] font-700 text-[12px]" style={{ fontWeight: 700 }}>
                        {(f.first_name || 'U')[0].toUpperCase()}
                      </div>
                      <div>
                        <div className="text-[13px] font-500 text-[#0F172A]" style={{ fontWeight: 500 }}>
                          {f.first_name} {f.last_name}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="text-[13px] text-[#64748B] font-mono">{f.mobile}</td>
                  <td>
                    <div className="flex items-center gap-1 text-[12.5px] text-[#64748B]">
                      <MapPin size={11} className="text-[#94A3B8] shrink-0" />
                      {f.village ? `${f.village}, ` : ''}{f.district || f.state || '—'}
                    </div>
                  </td>
                  <td className="text-[13px] text-[#0F172A]">{f.total_land_area?.toFixed(1) ?? '—'}</td>
                  <td>
                    <StatusBadge label={f.kyc_status} variant={kycVariant(f.kyc_status) as any} size="sm" />
                  </td>
                  <td>
                    <StatusBadge label={f.is_active ? 'Active' : 'Inactive'} variant={f.is_active ? 'success' : 'gray'} size="sm" />
                  </td>
                  <td>
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => navigate(`/farmers/${f.id}`)}
                        className="btn btn-ghost btn-icon btn-sm"
                        title="View profile"
                      >
                        <Eye size={14} />
                      </button>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-[#F1F5F9]">
            <span className="text-[12px] text-[#94A3B8]">
              Page {page} of {pages} · {total.toLocaleString()} total farmers
            </span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="btn btn-secondary btn-sm"
              >
                Previous
              </button>
              <button
                onClick={() => setPage(p => Math.min(pages, p + 1))}
                disabled={page === pages}
                className="btn btn-secondary btn-sm"
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

import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Map, Layers, CheckCircle2, Clock, ShieldAlert, Eye, RefreshCw, MapPin, Plus, Download } from 'lucide-react';
import { PageHeader } from '../../../components/ui/PageHeader';
import { FilterBar } from '../../../components/ui/FilterBar';
import { KpiCard } from '../../../components/ui/KpiCard';
import { StatusBadge } from '../../../components/ui/StatusBadge';
import { EmptyState, SkeletonTable } from '../../../components/ui/EmptyState';
import { useLandVerificationQueue, AdminLandVerificationItem } from '../api/useLand';

const PAGE_SIZE = 10;

export const LandList = () => {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const { data: landQueue = [], isLoading, refetch, isFetching } = useLandVerificationQueue();

  const filtered = useMemo(() => {
    return landQueue.filter(item => {
      const q = search.toLowerCase();
      const matchSearch = !q || [
        item.farmer_name, item.farmer_id, item.farmer_mobile, item.survey_number, item.district, item.state, item.village
      ].some(v => v?.toLowerCase().includes(q));
      const matchStatus = !statusFilter || item.verification_status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [landQueue, search, statusFilter]);

  const total = landQueue.length;
  const verifiedCount = landQueue.filter(l => l.verification_status === 'VERIFIED' || l.verification_status === 'APPROVED').length;
  const pendingCount = landQueue.filter(l => l.verification_status === 'PENDING').length;
  const totalAcreage = landQueue.reduce((acc, l) => acc + (l.area_acres || 0), 0);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pageRows = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const getStatusVariant = (s: string) => {
    if (s === 'VERIFIED' || s === 'APPROVED') return 'success';
    if (s === 'PENDING') return 'warning';
    if (s === 'REJECTED') return 'danger';
    return 'gray';
  };

  return (
    <div className="space-y-5 page-enter">
      <PageHeader
        title="Land & GIS Management"
        description="Verify land parcels, manage GIS data and satellite boundary polygons for registered farm plots."
        badge={{ label: `${total} Parcels`, variant: 'info' }}
        icon={Map}
        actions={
          <>
            <button onClick={() => refetch()} className="btn btn-secondary btn-sm">
              <RefreshCw size={13} className={isFetching ? 'animate-spin' : ''} />
            </button>
            <button className="btn btn-primary btn-sm">
              <Plus size={13} /> Verify Plot
            </button>
          </>
        }
      />

      {/* KPI Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KpiCard title="Total Parcels" value={total} icon={Map} iconBg="#EFF6FF" iconColor="#2563EB" loading={isLoading} />
        <KpiCard title="Verified Plots" value={verifiedCount} icon={CheckCircle2} iconBg="#F0FDF4" iconColor="#16A34A" loading={isLoading} />
        <KpiCard title="Pending Review" value={pendingCount} icon={Clock} iconBg="#FFFBEB" iconColor="#F59E0B" loading={isLoading} />
        <KpiCard title="Total Acreage" value={`${totalAcreage.toFixed(1)} ac`} icon={Layers} iconBg="#F5F3FF" iconColor="#8B5CF6" loading={isLoading} />
      </div>

      {/* Data Table */}
      <div className="ent-card overflow-hidden">
        <div className="p-4 border-b border-[#F1F5F9]">
          <FilterBar
            search={search} onSearchChange={setSearch}
            searchPlaceholder="Search by farmer, survey no, district..."
            filters={[{
              key: 'status', label: 'Status', value: statusFilter, onChange: setStatusFilter,
              options: [
                { label: 'Verified', value: 'VERIFIED' },
                { label: 'Pending', value: 'PENDING' },
                { label: 'Rejected', value: 'REJECTED' },
              ],
            }]}
            onExport={() => {}}
            onRefresh={() => refetch()}
            loading={isFetching}
            resultCount={filtered.length}
          />
        </div>

        <div className="overflow-x-auto">
          <table className="ent-table">
            <thead>
              <tr>
                <th>Plot / Parcel ID</th>
                <th>Farmer Name</th>
                <th>Survey Number</th>
                <th>Area (Acres)</th>
                <th>Ownership</th>
                <th>Location</th>
                <th>Irrigated</th>
                <th>Status</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={9} className="p-0"><SkeletonTable rows={6} cols={8} /></td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={9}>
                  <EmptyState icon={Map} title="No land records found" description="Try adjusting your filters or search." />
                </td></tr>
              ) : pageRows.map((item, i) => (
                <motion.tr
                  key={item.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.03 }}
                >
                  <td>
                    <span className="font-mono text-[12px] text-[#64748B] bg-[#F8FAFC] px-2 py-0.5 rounded-[6px]">
                      LND-{item.id.slice(-6).toUpperCase()}
                    </span>
                  </td>
                  <td>
                    <div>
                      <div className="text-[13px] font-500 text-[#0F172A]" style={{ fontWeight: 500 }}>{item.farmer_name || 'N/A'}</div>
                      <div className="text-[11.5px] text-[#94A3B8] font-mono">{item.farmer_mobile || ''}</div>
                    </div>
                  </td>
                  <td className="text-[13px] font-mono text-[#0F172A]">{item.survey_number || 'N/A'}</td>
                  <td className="text-[13px] font-600 text-[#0F172A]" style={{ fontWeight: 600 }}>{item.area_acres} ac</td>
                  <td className="text-[13px] text-[#64748B]">{item.ownership_type || 'Owned'}</td>
                  <td>
                    <div className="flex items-center gap-1 text-[12.5px] text-[#64748B]">
                      <MapPin size={11} className="text-[#94A3B8] shrink-0" />
                      {item.village ? `${item.village}, ` : ''}{item.district || item.state || 'N/A'}
                    </div>
                  </td>
                  <td>
                    <StatusBadge label={item.is_irrigated ? 'Yes' : 'No'} variant={item.is_irrigated ? 'cyan' : 'gray'} size="sm" />
                  </td>
                  <td>
                    <StatusBadge label={item.verification_status} variant={getStatusVariant(item.verification_status) as any} size="sm" />
                  </td>
                  <td>
                    <div className="flex items-center justify-end gap-1">
                      <button className="btn btn-ghost btn-icon btn-sm" title="View Map Polygon">
                        <Eye size={14} />
                      </button>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-[#F1F5F9]">
            <span className="text-[12px] text-[#94A3B8]">
              Page {safePage} of {totalPages} · {filtered.length} parcels
            </span>
            <div className="flex gap-1">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={safePage === 1} className="btn btn-secondary btn-sm">Previous</button>
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={safePage === totalPages} className="btn btn-secondary btn-sm">Next</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

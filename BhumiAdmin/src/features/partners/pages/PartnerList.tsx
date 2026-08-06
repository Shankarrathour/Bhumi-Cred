import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Handshake, Plus, Eye, Users, ShieldCheck, Wallet, Loader2, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { PageHeader } from '../../../components/ui/PageHeader';
import { FilterBar } from '../../../components/ui/FilterBar';
import { StatusBadge } from '../../../components/ui/StatusBadge';
import { KpiCard } from '../../../components/ui/KpiCard';
import { EmptyState } from '../../../components/ui/EmptyState';
import { usePartners } from '../api/usePartners';

export const PartnerList: React.FC = () => {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<string[]>([]);

  const { data, isLoading, isError, refetch } = usePartners(page, 30, search || undefined);

  const partners = data?.data ?? [];
  const total = data?.total ?? 0;
  const pages = data?.pages ?? 1;

  // Client-side status filter (since API may not support it yet)
  const filtered = partners.filter(p => {
    const matchStatus = !statusFilter || p.status?.toLowerCase() === statusFilter.toLowerCase();
    return matchStatus;
  });

  const toggleAll = () =>
    setSelected(selected.length === filtered.length ? [] : filtered.map(p => p.id));
  const toggleSelect = (id: string) =>
    setSelected(s => (s.includes(id) ? s.filter(x => x !== id) : [...s, id]));

  // KPI counts from live data
  const verifiedCount = partners.filter(p => p.is_verified).length;
  const pendingCount = partners.filter(p => !p.is_verified).length;
  const totalWallet = partners.reduce((acc, p) => acc + (p.wallet_balance ?? 0), 0);

  return (
    <div className="space-y-5 page-enter">
      <PageHeader
        title="Partner Management"
        description="Manage Carbon Developers, Verifiers, Insurers, NGOs, and Marketplace Vendors."
        icon={Handshake}
        iconColor="#16A34A"
        actions={
          <button className="btn btn-primary btn-sm gap-1.5" onClick={() => navigate('/partners/add')}>
            <Plus size={14} /> Add Partner
          </button>
        }
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KpiCard title="Total Partners" value={total} icon={Users} iconBg="#EFF6FF" iconColor="#2563EB" />
        <KpiCard title="Verified" value={verifiedCount} icon={ShieldCheck} iconBg="#F0FDF4" iconColor="#16A34A" />
        <KpiCard title="Pending Review" value={pendingCount} icon={Handshake} iconBg="#FFFBEB" iconColor="#F59E0B" />
        <KpiCard
          title="Total Wallet"
          value={`₹${(totalWallet / 100000).toFixed(1)}L`}
          icon={Wallet}
          iconBg="#F5F3FF"
          iconColor="#7C3AED"
        />
      </div>

      <div className="ent-card overflow-hidden">
        <div className="p-4 border-b border-[#F1F5F9]">
          <FilterBar
            search={search}
            onSearchChange={val => { setSearch(val); setPage(1); }}
            searchPlaceholder="Search by name, store, phone..."
            filters={[
              {
                key: 'status',
                label: 'Status',
                value: statusFilter,
                onChange: setStatusFilter,
                options: [
                  { label: 'Active', value: 'active' },
                  { label: 'Pending', value: 'pending' },
                  { label: 'Suspended', value: 'suspended' },
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
            <span className="text-sm">Loading partners...</span>
          </div>
        )}

        {/* Error State */}
        {isError && !isLoading && (
          <div className="flex flex-col items-center justify-center gap-2 py-16 text-red-500">
            <AlertCircle size={24} />
            <p className="text-sm font-medium">Failed to load partners</p>
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
                      className="rounded border-[#CBD5E1] accent-[#16A34A] cursor-pointer"
                    />
                  </th>
                  <th>Partner ID</th>
                  <th>Company / Store</th>
                  <th>Phone</th>
                  <th>GST Number</th>
                  <th className="text-right">Wallet Balance</th>
                  <th>Verified</th>
                  <th>Status</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={9}>
                      <EmptyState icon={Handshake} title="No partners found" />
                    </td>
                  </tr>
                ) : (
                  filtered.map((p, i) => (
                    <motion.tr
                      key={p.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: i * 0.04 }}
                    >
                      <td>
                        <input
                          type="checkbox"
                          checked={selected.includes(p.id)}
                          onChange={() => toggleSelect(p.id)}
                          className="rounded border-[#CBD5E1] accent-[#16A34A] cursor-pointer"
                        />
                      </td>
                      <td className="font-mono text-[#64748B] text-[12px]">
                        {p.vendor_id || p.id}
                      </td>
                      <td>
                        <div>
                          <p className="font-medium text-[#0F172A]">{p.store_name || p.name}</p>
                          {p.name && p.store_name && (
                            <p className="text-xs text-[#94A3B8]">{p.name}</p>
                          )}
                        </div>
                      </td>
                      <td className="text-[#64748B] text-[12px]">{p.phone}</td>
                      <td className="text-[#64748B] text-[12px] font-mono">
                        {p.gst_number || '—'}
                      </td>
                      <td className="text-right font-medium text-[#0F172A]">
                        ₹{(p.wallet_balance ?? 0).toLocaleString()}
                      </td>
                      <td>
                        <StatusBadge
                          label={p.is_verified ? 'Verified' : 'Unverified'}
                          variant={p.is_verified ? 'success' : 'warning'}
                          size="sm"
                        />
                      </td>
                      <td>
                        <StatusBadge
                          label={p.status}
                          variant={
                            p.status?.toLowerCase() === 'active'
                              ? 'success'
                              : p.status?.toLowerCase() === 'suspended'
                              ? 'error'
                              : 'warning'
                          }
                          size="sm"
                        />
                      </td>
                      <td className="text-right">
                        <button
                          onClick={() => navigate(`/partners/${p.id}`)}
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
              Showing page {page} of {pages} ({total} total partners)
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

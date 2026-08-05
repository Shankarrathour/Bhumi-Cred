import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, Plus, RefreshCw, Eye, Pencil, AlertTriangle, CheckCircle2, XCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { PageHeader } from '../../../components/ui/PageHeader';
import { FilterBar } from '../../../components/ui/FilterBar';
import { KpiCard } from '../../../components/ui/KpiCard';
import { StatusBadge } from '../../../components/ui/StatusBadge';
import { EmptyState, SkeletonTable } from '../../../components/ui/EmptyState';
import { useInsurance } from '../api/useInsurance';

const MOCK_FALLBACK_POLICIES = [
  { id: 'INS-800101', name: 'Teak Tree Weather Guard', provider: 'HDFC ERGO Agri', premium_amount: 1200, coverage_amount: 50000, description: 'Covers drought, flood and fire damage for Teak plantations', is_active: true },
  { id: 'INS-800102', name: 'Mango Grove Cyclone Cover', provider: 'ICICI Lombard', premium_amount: 2500, coverage_amount: 120000, description: 'Comprehensive storm and pest outbreak protection', is_active: true },
  { id: 'INS-800103', name: 'Sandalwood Fire Shield', provider: 'Bajaj Allianz', premium_amount: 3400, coverage_amount: 200000, description: 'Specialized wildfire insurance for high-value timber', is_active: false },
];

export const TreeInsurance = () => {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatus] = useState('');
  const { data, isLoading, refetch, isFetching } = useInsurance();

  const policies = useMemo(() => {
    if (!data) return MOCK_FALLBACK_POLICIES;
    let list: any[] = [];
    if (Array.isArray(data)) list = data;
    else if (Array.isArray((data as any).data)) list = (data as any).data;
    else if (Array.isArray((data as any).items)) list = (data as any).items;
    
    return list.length > 0 ? list : MOCK_FALLBACK_POLICIES;
  }, [data]);

  const filtered = useMemo(() => {
    return policies.filter(p => {
      if (!p) return false;
      const q = search.toLowerCase();
      const matchSearch = !q || [p.name, p.provider, String(p.id)].some(v => v?.toLowerCase().includes(q));
      const matchStatus = !statusFilter ||
        (statusFilter === 'active' ? p.is_active : !p.is_active);
      return matchSearch && matchStatus;
    });
  }, [policies, search, statusFilter]);

  const active   = policies.filter(p => p?.is_active).length;
  const inactive = policies.length - active;
  const totalPremium = policies.reduce((s, p) => s + (p?.premium_amount || 0), 0);

  return (
    <div className="space-y-5 page-enter">
      <PageHeader
        title="Tree & Climate Insurance"
        description="Manage climate risk insurance products, policies, and coverage for registered farmers."
        badge={{ label: `${active} Active Policies`, variant: 'success' }}
        icon={ShieldCheck}
        actions={
          <>
            <button onClick={() => refetch()} className="btn btn-secondary btn-sm">
              <RefreshCw size={13} className={isFetching ? 'animate-spin' : ''} />
            </button>
            <button className="btn btn-primary btn-sm">
              <Plus size={13} /> New Policy
            </button>
          </>
        }
      />

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KpiCard title="Total Policies"  value={policies.length} icon={ShieldCheck} iconBg="#EFF6FF" iconColor="#2563EB" loading={isLoading} />
        <KpiCard title="Active"          value={active}          icon={CheckCircle2} iconBg="#F0FDF4" iconColor="#16A34A" loading={isLoading} />
        <KpiCard title="Inactive"        value={inactive}        icon={XCircle}     iconBg="#FEF2F2" iconColor="#EF4444" loading={isLoading} />
        <KpiCard title="Total Premium"   value={`₹${(totalPremium / 1000).toFixed(1)}K`} icon={AlertTriangle} iconBg="#FFFBEB" iconColor="#F59E0B" loading={isLoading} />
      </div>

      {/* Table card */}
      <div className="ent-card overflow-hidden">
        <div className="p-4 border-b border-[#F1F5F9]">
          <FilterBar
            search={search} onSearchChange={setSearch}
            searchPlaceholder="Search by policy name or provider..."
            filters={[{
              key: 'status', label: 'Status', value: statusFilter, onChange: setStatus,
              options: [{ label: 'Active', value: 'active' }, { label: 'Inactive', value: 'inactive' }],
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
                <th>Policy ID</th>
                <th>Product Name</th>
                <th>Provider</th>
                <th>Premium (₹)</th>
                <th>Coverage (₹)</th>
                <th>Status</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={7} className="p-0"><SkeletonTable rows={6} cols={6} /></td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={7}>
                  <EmptyState icon={ShieldCheck} title="No policies found" description="No insurance policies match your current search or filters." />
                </td></tr>
              ) : filtered.map((policy, i) => {
                const safeId = policy.id ? String(policy.id) : `POL-${i}`;
                return (
                  <motion.tr
                    key={safeId}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.03 }}
                  >
                    <td>
                      <span className="font-mono text-[12px] text-[#64748B] bg-[#F8FAFC] px-2 py-0.5 rounded-[6px]">
                        {safeId.slice(-10).toUpperCase()}
                      </span>
                    </td>
                    <td>
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-[10px] bg-[#F5F3FF] flex items-center justify-center shrink-0">
                          <ShieldCheck size={14} className="text-[#8B5CF6]" />
                        </div>
                        <div>
                          <div className="text-[13px] font-500 text-[#0F172A]" style={{ fontWeight: 500 }}>{policy.name}</div>
                          <div className="text-[11.5px] text-[#94A3B8] truncate max-w-[220px]">{policy.description || 'Climate risk policy'}</div>
                        </div>
                      </div>
                    </td>
                    <td className="text-[13px] text-[#64748B]">{policy.provider || 'Bhumi Insurance'}</td>
                    <td className="text-[13px] font-500 text-[#0F172A]" style={{ fontWeight: 500 }}>
                      ₹{policy.premium_amount?.toLocaleString() || '0'}
                    </td>
                    <td className="text-[13px] font-600 text-[#16A34A]" style={{ fontWeight: 600 }}>
                      ₹{policy.coverage_amount?.toLocaleString() || '0'}
                    </td>
                    <td>
                      <StatusBadge label={policy.is_active ? 'Active' : 'Inactive'} variant={policy.is_active ? 'success' : 'gray'} size="sm" />
                    </td>
                    <td>
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => navigate(`/insurance/${safeId}`)} className="btn btn-ghost btn-icon btn-sm" title="View"><Eye size={14} /></button>
                        <button className="btn btn-ghost btn-icon btn-sm" title="Edit"><Pencil size={14} /></button>
                      </div>
                    </td>
                  </motion.tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

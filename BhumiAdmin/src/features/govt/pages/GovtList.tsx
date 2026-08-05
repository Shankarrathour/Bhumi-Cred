import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, Plus, Eye, RefreshCw, MapPin, Download } from 'lucide-react';
import { motion } from 'framer-motion';
import { PageHeader } from '../../../components/ui/PageHeader';
import { FilterBar } from '../../../components/ui/FilterBar';
import { StatusBadge } from '../../../components/ui/StatusBadge';
import { EmptyState } from '../../../components/ui/EmptyState';
import { KpiCard } from '../../../components/ui/KpiCard';

const MOCK_GOVT_BODIES = [
  { id: 'GOV-2001', organization: 'Ministry of Agriculture', department: 'Dept of Agriculture', authorizedPerson: 'Rajesh Sharma', land: 14500, projects: 12, status: 'Approved' },
  { id: 'GOV-2002', organization: 'Forest Department', department: 'State Forestry', authorizedPerson: 'Suresh Kumar', land: 89000, projects: 5, status: 'Pending' },
  { id: 'GOV-2003', organization: 'Panchayat Raj', department: 'Village Admin', authorizedPerson: 'Amit Patel', land: 3200, projects: 2, status: 'Approved' },
];

export const GovtList: React.FC = () => {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selected, setSelected] = useState<string[]>([]);

  const filtered = MOCK_GOVT_BODIES.filter(item => {
    const q = search.toLowerCase();
    const matchSearch = !q || item.organization.toLowerCase().includes(q) || item.department.toLowerCase().includes(q);
    const matchStatus = !statusFilter || item.status.toLowerCase() === statusFilter.toLowerCase();
    return matchSearch && matchStatus;
  });

  const toggleAll = () => setSelected(selected.length === filtered.length ? [] : filtered.map(s => s.id));
  const toggleSelect = (id: string) => setSelected(s => (s.includes(id) ? s.filter(x => x !== id) : [...s, id]));

  return (
    <div className="space-y-5 page-enter">
      <PageHeader
        title="Government Bodies"
        description="Manage Government Organizations, Departments, and Authorized Personnel."
        icon={Building2}
        iconColor="#2563EB"
        actions={
          <>
            <button className="btn btn-secondary btn-sm"><RefreshCw size={13} /></button>
            <button className="btn btn-primary btn-sm gap-1.5"><Plus size={13} /> Add Government Body</button>
          </>
        }
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KpiCard title="Total Organizations" value={124} icon={Building2} iconBg="#EFF6FF" iconColor="#2563EB" />
        <KpiCard title="Active Departments" value={342} icon={MapPin} iconBg="#F0FDF4" iconColor="#16A34A" />
        <KpiCard title="Total Land Assigned" value="1.2M ac" icon={MapPin} iconBg="#FFFBEB" iconColor="#F59E0B" />
        <KpiCard title="Total Projects" value={89} icon={Building2} iconBg="#F5F3FF" iconColor="#8B5CF6" />
      </div>

      <div className="ent-card overflow-hidden">
        <div className="p-4 border-b border-[#F1F5F9]">
          <FilterBar
            search={search} onSearchChange={setSearch}
            searchPlaceholder="Search by organization or department..."
            filters={[{
              key: 'status', label: 'Status', value: statusFilter, onChange: setStatusFilter,
              options: [ { label: 'Approved', value: 'approved' }, { label: 'Pending', value: 'pending' } ]
            }]}
            onExport={() => {}} onRefresh={() => {}} resultCount={filtered.length}
          />
        </div>

        <div className="overflow-x-auto">
          <table className="ent-table">
            <thead>
              <tr>
                <th className="w-10">
                  <input type="checkbox" checked={selected.length === filtered.length && filtered.length > 0} onChange={toggleAll} className="rounded border-[#CBD5E1] accent-[#2563EB] cursor-pointer" />
                </th>
                <th>Organization</th>
                <th>Department</th>
                <th>Authorized Person</th>
                <th className="text-right">Land (Acres)</th>
                <th className="text-right">Projects</th>
                <th>Status</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={8}><EmptyState icon={Building2} title="No Government Bodies found" /></td></tr>
              ) : (
                filtered.map((s, i) => (
                  <motion.tr key={s.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.05 }}>
                    <td>
                      <input type="checkbox" checked={selected.includes(s.id)} onChange={() => toggleSelect(s.id)} className="rounded border-[#CBD5E1] accent-[#2563EB] cursor-pointer" />
                    </td>
                    <td className="font-medium text-[#0F172A]">{s.organization}</td>
                    <td className="text-[#64748B]">{s.department}</td>
                    <td className="text-[#64748B]">{s.authorizedPerson}</td>
                    <td className="text-right font-medium text-[#0F172A]">{s.land.toLocaleString()}</td>
                    <td className="text-right font-medium text-[#0F172A]">{s.projects}</td>
                    <td><StatusBadge label={s.status} variant={s.status === 'Approved' ? 'success' : 'warning'} size="sm" /></td>
                    <td className="text-right">
                      <button onClick={() => navigate(`/govt/${s.id}`)} className="btn btn-ghost btn-icon btn-sm"><Eye size={14} /></button>
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

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Handshake, Plus, Eye, Users, ShieldCheck, Wallet, Download } from 'lucide-react';
import { motion } from 'framer-motion';
import { PageHeader } from '../../../components/ui/PageHeader';
import { FilterBar } from '../../../components/ui/FilterBar';
import { StatusBadge } from '../../../components/ui/StatusBadge';
import { KpiCard } from '../../../components/ui/KpiCard';
import { EmptyState } from '../../../components/ui/EmptyState';

const MOCK_PARTNERS = [
  { id: 'PRT-1001', name: 'AgriCorp Solutions', type: 'Carbon Partner', gst: '22AAAAA0000A1Z5', phone: '+91 9876543210', wallet: 450000, status: 'Active' },
  { id: 'PRT-1002', name: 'GeoTech India', type: 'GIS', gst: '27BBBBB1111B1Z2', phone: '+91 8765432109', wallet: 120000, status: 'Pending' },
  { id: 'PRT-1003', name: 'SafeCrop Insurance', type: 'Insurance', gst: '09CCCCC2222C1Z3', phone: '+91 7654321098', wallet: 890000, status: 'Active' },
];

export const PartnerList: React.FC = () => {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selected, setSelected] = useState<string[]>([]);

  const filtered = MOCK_PARTNERS.filter(p => {
    const q = search.toLowerCase();
    const matchSearch = !q || p.name.toLowerCase().includes(q) || p.gst.toLowerCase().includes(q);
    const matchType = !typeFilter || p.type.toLowerCase() === typeFilter.toLowerCase();
    const matchStatus = !statusFilter || p.status.toLowerCase() === statusFilter.toLowerCase();
    return matchSearch && matchType && matchStatus;
  });

  const toggleAll = () => setSelected(selected.length === filtered.length ? [] : filtered.map(s => s.id));
  const toggleSelect = (id: string) => setSelected(s => (s.includes(id) ? s.filter(x => x !== id) : [...s, id]));

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
        <KpiCard title="Total Partners" value={145} icon={Users} iconBg="#EFF6FF" iconColor="#2563EB" />
        <KpiCard title="Verified" value={130} icon={ShieldCheck} iconBg="#F0FDF4" iconColor="#16A34A" />
        <KpiCard title="Pending Review" value={15} icon={Handshake} iconBg="#FFFBEB" iconColor="#F59E0B" />
        <KpiCard title="Total Wallet" value="₹1.4M" icon={Wallet} iconBg="#F5F3FF" iconColor="#7C3AED" />
      </div>

      <div className="ent-card overflow-hidden">
        <div className="p-4 border-b border-[#F1F5F9]">
          <FilterBar
            search={search} onSearchChange={setSearch}
            searchPlaceholder="Search by name, GST..."
            filters={[
              {
                key: 'type', label: 'Partner Type', value: typeFilter, onChange: setTypeFilter,
                options: [
                  { label: 'Carbon Partner', value: 'Carbon Partner' },
                  { label: 'Insurance', value: 'Insurance' },
                  { label: 'Lab', value: 'Lab' },
                  { label: 'MRV', value: 'MRV' },
                  { label: 'GIS', value: 'GIS' },
                  { label: 'NGO', value: 'NGO' },
                ]
              },
              {
                key: 'status', label: 'Status', value: statusFilter, onChange: setStatusFilter,
                options: [ { label: 'Active', value: 'active' }, { label: 'Pending', value: 'pending' } ]
              }
            ]}
            onExport={() => {}} onRefresh={() => {}} resultCount={filtered.length}
          />
        </div>

        <div className="overflow-x-auto">
          <table className="ent-table">
            <thead>
              <tr>
                <th className="w-10">
                  <input type="checkbox" checked={selected.length === filtered.length && filtered.length > 0} onChange={toggleAll} className="rounded border-[#CBD5E1] accent-[#16A34A] cursor-pointer" />
                </th>
                <th>Partner ID</th>
                <th>Company Name</th>
                <th>Type</th>
                <th>GST Number</th>
                <th>Phone</th>
                <th className="text-right">Wallet Balance</th>
                <th>Status</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={9}><EmptyState icon={Handshake} title="No partners found" /></td></tr>
              ) : (
                filtered.map((p, i) => (
                  <motion.tr key={p.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.05 }}>
                    <td>
                      <input type="checkbox" checked={selected.includes(p.id)} onChange={() => toggleSelect(p.id)} className="rounded border-[#CBD5E1] accent-[#16A34A] cursor-pointer" />
                    </td>
                    <td className="font-mono text-[#64748B] text-[12px]">{p.id}</td>
                    <td className="font-medium text-[#0F172A]">{p.name}</td>
                    <td className="text-[#64748B]">{p.type}</td>
                    <td className="text-[#64748B] text-[12px] font-mono">{p.gst}</td>
                    <td className="text-[#64748B] text-[12px]">{p.phone}</td>
                    <td className="text-right font-medium text-[#0F172A]">₹{p.wallet.toLocaleString()}</td>
                    <td><StatusBadge label={p.status} variant={p.status === 'Active' ? 'success' : 'warning'} size="sm" /></td>
                    <td className="text-right">
                      <button onClick={() => navigate(`/partners/${p.id}`)} className="btn btn-ghost btn-icon btn-sm"><Eye size={14} /></button>
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

import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Building2, Plus, Eye, RefreshCw, MapPin,
  Landmark, FileText, CheckCircle, Search, Filter
} from 'lucide-react';
import { motion } from 'framer-motion';
import { PageHeader } from '../../../components/ui/PageHeader';
import { StatusBadge } from '../../../components/ui/StatusBadge';
import { EmptyState } from '../../../components/ui/EmptyState';
import { KpiCard } from '../../../components/ui/KpiCard';
import { useGovtSchemes } from '../api/useGovtSchemes';
import toast from 'react-hot-toast';

const SEEDED_GOVT_BODIES = [
  {
    id: 'GOV-2001',
    organization: 'Ministry of Agriculture & Farmers Welfare',
    department: 'Department of Agriculture & Farmers Welfare (DAC&FW)',
    ministry: 'Ministry of Agriculture, Govt. of India',
    authorizedPerson: 'Rajesh Sharma (Joint Secretary)',
    mobile: '+91 11 2338 2012',
    coveredLand: '1,42,500 Acres',
    activeProjects: 14,
    documentsCount: 6,
    approvalStatus: 'Approved',
    mouDate: '12 Jan 2025',
    budget: '₹480 Crore',
    schemesCount: 8,
  },
  {
    id: 'GOV-2002',
    organization: 'MP Department of Horticulture & Food Processing',
    department: 'Horticulture & Farm Forestry Division',
    ministry: 'Govt. of Madhya Pradesh',
    authorizedPerson: 'Dr. Vikramaditya Singh (Director)',
    mobile: '+91 755 255 1204',
    coveredLand: '85,400 Acres',
    activeProjects: 9,
    documentsCount: 4,
    approvalStatus: 'Approved',
    mouDate: '28 Jan 2025',
    budget: '₹210 Crore',
    schemesCount: 5,
  },
  {
    id: 'GOV-2003',
    organization: 'Maharashtra Social Forestry Directorate',
    department: 'Afforestation & Carbon Cell',
    ministry: 'Govt. of Maharashtra',
    authorizedPerson: 'Sanjay Kulkarni (Chief Forest Conservator)',
    mobile: '+91 22 2202 4410',
    coveredLand: '62,100 Acres',
    activeProjects: 7,
    documentsCount: 5,
    approvalStatus: 'Pending',
    mouDate: '04 Feb 2025',
    budget: '₹175 Crore',
    schemesCount: 4,
  },
  {
    id: 'GOV-2004',
    organization: 'Gujarat State Watershed Management Agency',
    department: 'Soil Conservation & Water Harvesting Cell',
    ministry: 'Govt. of Gujarat',
    authorizedPerson: 'Bhavesh Patel (Executive Engineer)',
    mobile: '+91 79 2325 8091',
    coveredLand: '98,000 Acres',
    activeProjects: 11,
    documentsCount: 8,
    approvalStatus: 'Approved',
    mouDate: '15 Dec 2024',
    budget: '₹340 Crore',
    schemesCount: 6,
  },
  {
    id: 'GOV-2005',
    organization: 'Chhattisgarh Rajya Forest Development Corp',
    department: 'Tribal Land Agroforestry Cell',
    ministry: 'Govt. of Chhattisgarh',
    authorizedPerson: 'Anita Sahu (Nodal Officer)',
    mobile: '+91 771 242 9011',
    coveredLand: '41,200 Acres',
    activeProjects: 5,
    documentsCount: 3,
    approvalStatus: 'Rejected',
    mouDate: '10 Feb 2025',
    budget: '₹95 Crore',
    schemesCount: 3,
  },
];

export const GovtList: React.FC = () => {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [deptFilter, setDeptFilter] = useState('');
  const [page] = useState(1);
  const [selected, setSelected] = useState<string[]>([]);
  const { data: apiData, refetch } = useGovtSchemes(page, 20);

  const govtBodies = (apiData?.data && apiData.data.length > 0) ? apiData.data.map(item => ({
    id: item.id,
    organization: item.name || item.ministry || 'Ministry of Agriculture',
    department: item.department || 'Agri Extension Division',
    ministry: item.ministry || 'Govt. of India',
    authorizedPerson: 'Nodal Officer',
    mobile: '+91 11 2338 2012',
    coveredLand: '45,000 Acres',
    activeProjects: 6,
    documentsCount: 4,
    approvalStatus: item.status === 'active' ? 'Approved' : 'Pending',
    mouDate: '2025-01-15',
    budget: `₹${((item.benefit_amount || 50000) / 1000).toFixed(0)}L`,
    schemesCount: 4,
  })) : SEEDED_GOVT_BODIES;

  const departments = useMemo(() => Array.from(new Set(govtBodies.map(g => g.department))), [govtBodies]);

  const filtered = useMemo(() => {
    return govtBodies.filter(g => {
      const q = search.toLowerCase();
      const matchSearch = !q || [g.organization, g.department, g.authorizedPerson, g.ministry].some(v => v?.toLowerCase().includes(q));
      const matchStatus = !statusFilter || g.approvalStatus?.toLowerCase() === statusFilter.toLowerCase();
      const matchDept = !deptFilter || g.department?.toLowerCase() === deptFilter.toLowerCase();
      return matchSearch && matchStatus && matchDept;
    });
  }, [govtBodies, search, statusFilter, deptFilter]);

  const toggleAll = () =>
    setSelected(selected.length === filtered.length ? [] : filtered.map(s => s.id));
  const toggleSelect = (id: string) =>
    setSelected(s => (s.includes(id) ? s.filter(x => x !== id) : [...s, id]));

  return (
    <div className="space-y-6 page-enter pb-8">
      {/* ── Page Header ── */}
      <PageHeader
        title="Government Body Management"
        description="Module 3: Organizations, Departments, Authorized Personnel, Land Allotments, Projects & MoU Verifications."
        badge={{ label: `${filtered.length} Govt Bodies`, variant: 'info' }}
        icon={Building2}
        iconColor="#2563EB"
        actions={
          <div className="flex items-center gap-2">
            <button className="btn btn-secondary btn-sm" onClick={() => refetch()}>
              <RefreshCw size={13} />
            </button>
            <button onClick={() => toast.success('Open Add Government Body Modal')} className="btn btn-primary btn-sm gap-1.5 cursor-pointer">
              <Plus size={13} /> Add Government Body
            </button>
          </div>
        }
      />

      {/* ── KPI Metric Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard title="GOVT ORGANIZATIONS" value={govtBodies.length} icon={Building2} iconBg="#EFF6FF" iconColor="#2563EB" />
        <KpiCard title="APPROVED BODIES" value={govtBodies.filter(g=>g.approvalStatus==='Approved').length} icon={CheckCircle} iconBg="#F0FDF4" iconColor="#16A34A" />
        <KpiCard title="COVERED LAND" value="4,29,200 Acres" icon={MapPin} iconBg="#FFFBEB" iconColor="#F59E0B" />
        <KpiCard title="TOTAL BUDGET POOL" value="₹1,300 Crore" icon={Landmark} iconBg="#F5F3FF" iconColor="#8B5CF6" />
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
              placeholder="Search by Organization, Department, Nodal Officer, Ministry..."
              className="w-full pl-10 pr-4 py-2 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-[13px] text-[#0F172A] outline-none focus:border-[#2563EB] focus:bg-white transition-all"
            />
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span className="text-[12px] font-bold text-[#64748B] uppercase tracking-wider flex items-center gap-1">
              <Filter size={13} className="text-[#2563EB]" /> Filters:
            </span>

            {/* Department Filter */}
            <select
              value={deptFilter}
              onChange={(e) => setDeptFilter(e.target.value)}
              className="px-3 py-1.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-[12px] font-medium text-[#0F172A] outline-none cursor-pointer"
            >
              <option value="">All Departments ({departments.length})</option>
              {departments.map(d => <option key={d} value={d}>{d}</option>)}
            </select>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-1.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-[12px] font-medium text-[#0F172A] outline-none cursor-pointer"
            >
              <option value="">All Statuses</option>
              <option value="approved">Approved</option>
              <option value="pending">Pending</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
        </div>
      </div>

      {/* ── GOVT BODIES DIRECTORY TABLE (All 9 BRD Specifications Mapped) ── */}
      <div className="ent-card overflow-hidden">
        <div className="p-4 border-b border-[#F1F5F9] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="text-[14px] font-bold text-[#0F172A]">Government Organizations Directory</h3>
            <span className="text-[11px] font-bold text-[#2563EB] bg-[#EFF6FF] px-2 py-0.5 rounded-full border border-[#DBEAFE]">
              {filtered.length} Entities
            </span>
          </div>

          {selected.length > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-[12px] font-medium text-[#64748B]">{selected.length} selected</span>
              <button onClick={() => toast.success(`Exported ${selected.length} Govt records CSV`)} className="btn btn-secondary btn-sm">
                Export Selected
              </button>
            </div>
          )}
        </div>

        <div className="overflow-x-auto custom-scrollbar">
          <table className="ent-table min-w-[1100px]">
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
                <th>Organization & Ministry</th>
                <th>Department</th>
                <th>Authorized Person (Nodal Officer)</th>
                <th>Covered Land</th>
                <th>Projects</th>
                <th>Documents</th>
                <th>Approval Status</th>
                <th>MoU Date</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={10}>
                    <EmptyState icon={Building2} title="No Government Bodies Found" description="Try clearing filters or search query." />
                  </td>
                </tr>
              ) : (
                filtered.map((g, i) => (
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
                            {g.organization}
                          </div>
                          <span className="text-[11px] text-[#64748B]">{g.ministry}</span>
                        </div>
                      </div>
                    </td>

                    {/* Department */}
                    <td className="text-[12.5px] font-semibold text-[#475569]">{g.department}</td>

                    {/* Authorized Person */}
                    <td>
                      <div className="text-[12.5px] font-bold text-[#0F172A]">{g.authorizedPerson}</div>
                      <div className="text-[10.5px] font-mono text-[#94A3B8]">{g.mobile}</div>
                    </td>

                    {/* Land */}
                    <td className="text-[13px] font-bold text-[#0F172A]">{g.coveredLand}</td>

                    {/* Projects */}
                    <td>
                      <span className="text-[11.5px] font-semibold text-[#16A34A] bg-[#F0FDF4] px-2 py-0.5 rounded-lg border border-[#DCFCE7]">
                        {g.activeProjects} Projects
                      </span>
                    </td>

                    {/* Documents */}
                    <td>
                      <span className="text-[11.5px] font-semibold text-[#8B5CF6] bg-[#F5F3FF] px-2 py-0.5 rounded-lg border border-[#DDD6FE] flex items-center gap-1 w-max">
                        <FileText size={11} /> {g.documentsCount} Documents
                      </span>
                    </td>

                    {/* Approval Status */}
                    <td>
                      <StatusBadge
                        label={g.approvalStatus}
                        variant={g.approvalStatus === 'Approved' ? 'success' : g.approvalStatus === 'Pending' ? 'warning' : 'danger'}
                        size="sm"
                      />
                    </td>

                    {/* MoU Date */}
                    <td className="text-[12px] font-medium text-[#64748B]">{g.mouDate}</td>

                    {/* Actions */}
                    <td>
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => navigate(`/govt/${g.id}`)}
                          className="px-2.5 py-1 bg-[#EFF6FF] hover:bg-[#DBEAFE] text-[#2563EB] text-[11.5px] font-bold rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                        >
                          <Eye size={13} />
                          <span>View Body</span>
                        </button>
                      </div>
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

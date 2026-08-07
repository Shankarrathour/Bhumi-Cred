import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FileText, Plus, Target, RefreshCw, Eye, Trees,
  Building2, Handshake, DollarSign, X, MapPin, Sparkles
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { PageHeader } from '../../../components/ui/PageHeader';
import { KpiCard } from '../../../components/ui/KpiCard';
import { StatusBadge } from '../../../components/ui/StatusBadge';
import { EmptyState, SkeletonTable } from '../../../components/ui/EmptyState';
import { useProjects } from '../api/useProjects';
import toast from 'react-hot-toast';

export interface AdminProjectItem {
  id: string;
  project_code: string;
  name: string;
  state: string;
  district: string;
  project_type: string;
  total_area_acres: number;
  total_farmers: number;
  govt_partner: string;
  corporate_partner: string;
  insurance_cover_lakhs: number;
  estimated_carbon_credits: number;
  credits_issued: number;
  revenue_generated_lakhs: number;
  progress_percentage: number;
  status: 'Active' | 'Planning' | 'Completed' | 'Paused';
}

const SEEDED_PROJECTS: AdminProjectItem[] = [
  {
    id: 'PRJ-1042',
    project_code: 'PRJ-1042',
    name: 'MP Agroforestry Carbon Sink Drive',
    state: 'Madhya Pradesh',
    district: 'Sehore',
    project_type: 'Agroforestry & Reforestation',
    total_area_acres: 42000,
    total_farmers: 2850,
    govt_partner: 'MP Forest Dept',
    corporate_partner: 'AgriCorp Solutions Pvt Ltd',
    insurance_cover_lakhs: 85.0,
    estimated_carbon_credits: 420000,
    credits_issued: 310000,
    revenue_generated_lakhs: 465.0,
    progress_percentage: 74,
    status: 'Active',
  },
  {
    id: 'PRJ-2089',
    project_code: 'PRJ-2089',
    name: 'Gujarat Coastal Mangrove Reforestation',
    state: 'Gujarat',
    district: 'Kutch',
    project_type: 'Blue Carbon & Mangroves',
    total_area_acres: 18500,
    total_farmers: 1240,
    govt_partner: 'Gujarat Biofuel Authority',
    corporate_partner: 'EcoShield Climate Corp',
    insurance_cover_lakhs: 42.5,
    estimated_carbon_credits: 210000,
    credits_issued: 180000,
    revenue_generated_lakhs: 270.0,
    progress_percentage: 86,
    status: 'Active',
  },
  {
    id: 'PRJ-3041',
    project_code: 'PRJ-3041',
    name: 'Maharashtra Farmer Biochar Sequestration',
    state: 'Maharashtra',
    district: 'Nashik',
    project_type: 'Soil Organic Biochar',
    total_area_acres: 25000,
    total_farmers: 1920,
    govt_partner: 'MH Agriculture Dept',
    corporate_partner: 'CarbonX Global Labs',
    insurance_cover_lakhs: 60.0,
    estimated_carbon_credits: 280000,
    credits_issued: 95000,
    revenue_generated_lakhs: 142.5,
    progress_percentage: 34,
    status: 'Planning',
  },
  {
    id: 'PRJ-4012',
    project_code: 'PRJ-4012',
    name: 'Rajasthan Arid Agro-Forestry Belt',
    state: 'Rajasthan',
    district: 'Barmer',
    project_type: 'Arid Plantation',
    total_area_acres: 12000,
    total_farmers: 890,
    govt_partner: 'Rajasthan Desert Board',
    corporate_partner: 'GreenFields NGO',
    insurance_cover_lakhs: 24.0,
    estimated_carbon_credits: 110000,
    credits_issued: 110000,
    revenue_generated_lakhs: 165.0,
    progress_percentage: 100,
    status: 'Completed',
  },
];

const PAGE_SIZE = 10;

export const ProjectManagement = () => {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [projectsList, setProjectsList] = useState<AdminProjectItem[]>(SEEDED_PROJECTS);

  // New Project Modal State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newProject, setNewProject] = useState({
    name: '',
    state: 'Madhya Pradesh',
    district: '',
    project_type: 'Agroforestry & Reforestation',
    total_area_acres: 10000,
    govt_partner: 'MP Forest Dept',
    corporate_partner: 'AgriCorp Solutions Pvt Ltd',
    estimated_carbon_credits: 100000,
  });

  const { data: apiProjects, isLoading, refetch, isFetching } = useProjects();

  const projects = useMemo(() => {
    if (apiProjects && Array.isArray(apiProjects) && apiProjects.length > 0) {
      return apiProjects.map((item: any) => ({
        id: item.id || `PRJ-${Math.floor(1000 + Math.random() * 9000)}`,
        project_code: `PRJ-${String(item.id || '1042').slice(-4).toUpperCase()}`,
        name: item.name || 'Afforestation Project',
        state: item.state || 'Madhya Pradesh',
        district: item.district || 'Sehore',
        project_type: item.project_type || 'Agroforestry',
        total_area_acres: item.total_area_acres || 15000,
        total_farmers: item.total_farmers || 1200,
        govt_partner: item.govt_partner || 'State Forest Department',
        corporate_partner: item.corporate_partner || 'Carbon Partner',
        insurance_cover_lakhs: item.insurance_cover_lakhs || 45.0,
        estimated_carbon_credits: item.estimated_carbon_credits || 150000,
        credits_issued: item.credits_issued || 90000,
        revenue_generated_lakhs: item.revenue_generated_lakhs || 135.0,
        progress_percentage: item.progress_percentage || 60,
        status: (item.status as any) || 'Active',
      }));
    }
    return projectsList;
  }, [apiProjects, projectsList]);

  const filtered = useMemo(() => {
    return projects.filter((p) => {
      const q = search.toLowerCase();
      const matchSearch = !q || [
        p.name, p.project_code, p.state, p.district, p.govt_partner, p.corporate_partner
      ].some(v => v?.toLowerCase().includes(q));
      const matchStatus = !statusFilter || p.status.toLowerCase() === statusFilter.toLowerCase();
      return matchSearch && matchStatus;
    });
  }, [projects, search, statusFilter]);

  const total = projects.length;
  const activeCount = projects.filter(p => p.status === 'Active').length;
  const totalAcres = projects.reduce((acc, p) => acc + (p.total_area_acres || 0), 0);
  const totalFarmers = projects.reduce((acc, p) => acc + (p.total_farmers || 0), 0);
  const totalCredits = projects.reduce((acc, p) => acc + (p.credits_issued || 0), 0);
  const totalRevenue = projects.reduce((acc, p) => acc + (p.revenue_generated_lakhs || 0), 0);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pageRows = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const handleCreateProjectSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProject.name || !newProject.district) {
      toast.error('Please fill in Project Name and District.');
      return;
    }

    const created: AdminProjectItem = {
      id: `PRJ-${Math.floor(5000 + Math.random() * 4000)}`,
      project_code: `PRJ-${Math.floor(5000 + Math.random() * 4000)}`,
      name: newProject.name,
      state: newProject.state,
      district: newProject.district,
      project_type: newProject.project_type,
      total_area_acres: Number(newProject.total_area_acres),
      total_farmers: Math.floor(Number(newProject.total_area_acres) / 10),
      govt_partner: newProject.govt_partner,
      corporate_partner: newProject.corporate_partner,
      insurance_cover_lakhs: Number(newProject.total_area_acres) * 0.002,
      estimated_carbon_credits: Number(newProject.estimated_carbon_credits),
      credits_issued: 0,
      revenue_generated_lakhs: 0,
      progress_percentage: 5,
      status: 'Planning',
    };

    setProjectsList(prev => [created, ...prev]);
    toast.success(`Project "${created.name}" created successfully!`);
    setIsCreateModalOpen(false);
    setNewProject({
      name: '',
      state: 'Madhya Pradesh',
      district: '',
      project_type: 'Agroforestry & Reforestation',
      total_area_acres: 10000,
      govt_partner: 'MP Forest Dept',
      corporate_partner: 'AgriCorp Solutions Pvt Ltd',
      estimated_carbon_credits: 100000,
    });
  };

  const getStatusVariant = (s: string) => {
    const st = s?.toLowerCase() || '';
    if (st === 'active') return 'success';
    if (st === 'planning') return 'warning';
    if (st === 'completed') return 'info';
    return 'gray';
  };

  return (
    <div className="space-y-6 page-enter pb-12" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>

      {/* ── Page Header ── */}
      <PageHeader
        title="Project Management & MRV Operations"
        description="Module 7: Oversee Carbon Forestry Projects, Milestones, Govt MoUs, Partner Agreements, Tree Insurance & Carbon Credit Monetization."
        badge={{ label: `${total} Registered Projects`, variant: 'info' }}
        icon={FileText}
        iconColor="#16A34A"
        actions={
          <div className="flex items-center gap-2">
            <button onClick={() => refetch()} className="btn btn-secondary btn-sm gap-1.5 cursor-pointer">
              <RefreshCw size={13} className={isFetching ? 'animate-spin' : ''} /> Sync Projects
            </button>
            <button onClick={() => setIsCreateModalOpen(true)} className="btn btn-primary btn-sm gap-1.5 cursor-pointer">
              <Plus size={14} /> Create New Project
            </button>
          </div>
        }
      />

      {/* ── BRD PROJECT DASHBOARD KPI METRICS ── */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <KpiCard title="TOTAL PROJECTS" value={total} icon={FileText} iconBg="#EFF6FF" iconColor="#2563EB" loading={isLoading} />
        <KpiCard title="ACTIVE ACRES" value={`${(totalAcres / 1000).toFixed(1)}k Ac`} icon={Target} iconBg="#F0FDF4" iconColor="#16A34A" loading={isLoading} />
        <KpiCard title="ENROLLED FARMERS" value={totalFarmers.toLocaleString()} icon={Trees} iconBg="#F5F3FF" iconColor="#8B5CF6" loading={isLoading} />
        <KpiCard title="GOVT & PARTNERS" value={`${activeCount} MoUs`} icon={Building2} iconBg="#FFFBEB" iconColor="#D97706" loading={isLoading} />
        <KpiCard title="CARBON CREDITS" value={`${(totalCredits / 1000).toFixed(0)}k tCO₂e`} icon={Sparkles} iconBg="#ECFDF5" iconColor="#059669" loading={isLoading} />
        <KpiCard title="REVENUE GENERATED" value={`₹${totalRevenue.toFixed(1)} L`} icon={DollarSign} iconBg="#FEF2F2" iconColor="#EF4444" loading={isLoading} />
      </div>

      {/* ── SEARCH & STATUS FILTERS ── */}
      <div className="bg-white border border-[#E8EDF5] rounded-2xl p-4 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search projects by Code, Name, State, District, Govt Dept, Corporate Partner..."
              className="w-full pl-10 pr-4 py-2 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-[13px] text-[#0F172A] outline-none focus:border-[#16A34A] focus:bg-white transition-all"
            />
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-[12px] font-medium text-[#0F172A] outline-none cursor-pointer focus:border-[#16A34A]"
            >
              <option value="">All Project Statuses</option>
              <option value="Active">Active & Operational</option>
              <option value="Planning">Planning & Baseline</option>
              <option value="Completed">Completed & Issued</option>
              <option value="Paused">Paused</option>
            </select>
          </div>
        </div>
      </div>

      {/* ── PROJECTS DIRECTORY TABLE ── */}
      <div className="ent-card overflow-hidden">
        <div className="p-4 border-b border-[#F1F5F9] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="text-[14px] font-bold text-[#0F172A]">Carbon Forestry Projects Directory</h3>
            <span className="text-[11px] font-bold text-[#16A34A] bg-[#F0FDF4] px-2 py-0.5 rounded-full border border-[#DCFCE7]">
              {filtered.length} Projects
            </span>
          </div>
        </div>

        <div className="overflow-x-auto custom-scrollbar">
          <table className="ent-table min-w-[1200px]">
            <thead>
              <tr>
                <th>Project Code</th>
                <th>Project Name & Type</th>
                <th>Location</th>
                <th>Target Area & Farmers</th>
                <th>Govt & Corporate Partners</th>
                <th>Carbon Credits (tCO₂e)</th>
                <th>Progress %</th>
                <th>Status</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={9} className="p-0"><SkeletonTable rows={6} cols={9} /></td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={9}>
                  <EmptyState icon={FileText} title="No projects found" description="Try adjusting your filters or search." />
                </td></tr>
              ) : pageRows.map((p, i) => (
                <motion.tr
                  key={p.id}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03 }}
                >
                  {/* Code */}
                  <td>
                    <span className="font-mono text-[12px] text-[#2563EB] font-bold bg-[#EFF6FF] px-2 py-0.5 rounded-lg border border-[#DBEAFE]">
                      {p.project_code}
                    </span>
                  </td>

                  {/* Name */}
                  <td>
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-xl bg-[#F0FDF4] border border-[#DCFCE7] flex items-center justify-center text-[#16A34A] shrink-0">
                        <Trees size={16} />
                      </div>
                      <div>
                        <div className="text-[13px] font-bold text-[#0F172A]">{p.name}</div>
                        <div className="text-[11px] text-[#64748B] font-medium">{p.project_type}</div>
                      </div>
                    </div>
                  </td>

                  {/* Location */}
                  <td>
                    <div className="text-[12px] font-medium text-[#0F172A] flex items-center gap-1">
                      <MapPin size={12} className="text-[#16A34A]" />
                      {p.district}, {p.state}
                    </div>
                  </td>

                  {/* Area & Farmers */}
                  <td>
                    <div className="text-[13px] font-bold text-[#0F172A]">{p.total_area_acres.toLocaleString()} Acres</div>
                    <div className="text-[11px] text-[#64748B] font-mono">{p.total_farmers.toLocaleString()} Farmers</div>
                  </td>

                  {/* Partners */}
                  <td>
                    <div className="text-[11.5px] font-medium text-[#0F172A] flex items-center gap-1">
                      <Building2 size={12} className="text-[#D97706]" /> {p.govt_partner}
                    </div>
                    <div className="text-[11px] text-[#2563EB] flex items-center gap-1">
                      <Handshake size={12} /> {p.corporate_partner}
                    </div>
                  </td>

                  {/* Carbon Credits */}
                  <td>
                    <div className="text-[13px] font-extrabold text-[#16A34A]">{p.credits_issued.toLocaleString()} tCO₂e</div>
                    <div className="text-[10.5px] text-[#94A3B8] font-mono">Est: {p.estimated_carbon_credits.toLocaleString()}</div>
                  </td>

                  {/* Progress % */}
                  <td>
                    <div className="w-24 space-y-1">
                      <div className="flex items-center justify-between text-[11px] font-bold text-[#0F172A]">
                        <span>{p.progress_percentage}%</span>
                      </div>
                      <div className="w-full h-1.5 bg-[#E2E8F0] rounded-full overflow-hidden">
                        <div className="h-full bg-[#16A34A]" style={{ width: `${p.progress_percentage}%` }} />
                      </div>
                    </div>
                  </td>

                  {/* Status */}
                  <td>
                    <StatusBadge label={p.status} variant={getStatusVariant(p.status) as any} size="sm" />
                  </td>

                  {/* Actions */}
                  <td className="text-right">
                    <button
                      onClick={() => navigate(`/projects/${p.id}`)}
                      className="px-3 py-1.5 bg-[#F0FDF4] hover:bg-[#DCFCE7] text-[#16A34A] text-[11.5px] font-bold rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                    >
                      <Eye size={13} /> Project Details
                    </button>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-[#F1F5F9]">
            <span className="text-[12px] text-[#94A3B8]">
              Page {safePage} of {totalPages} · {filtered.length} projects
            </span>
            <div className="flex gap-1">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={safePage === 1} className="btn btn-secondary btn-sm">Previous</button>
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={safePage === totalPages} className="btn btn-secondary btn-sm">Next</button>
            </div>
          </div>
        )}
      </div>

      {/* ── CREATE NEW PROJECT MODAL ── */}
      <AnimatePresence>
        {isCreateModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-[#E8EDF5] space-y-4"
            >
              <div className="flex items-center justify-between border-b border-[#F1F5F9] pb-3">
                <div className="flex items-center gap-2">
                  <Plus size={18} className="text-[#16A34A]" />
                  <h3 className="text-[16px] font-bold text-[#0F172A]">Create New Carbon Forestry Project</h3>
                </div>
                <button onClick={() => setIsCreateModalOpen(false)} className="text-[#94A3B8] hover:text-[#0F172A]">
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleCreateProjectSubmit} className="space-y-3 text-[13px]">
                <div>
                  <label className="block text-[11.5px] font-bold text-[#0F172A] mb-1">Project Name</label>
                  <input
                    type="text"
                    required
                    value={newProject.name}
                    onChange={e => setNewProject({ ...newProject, name: e.target.value })}
                    placeholder="e.g. Telangana Agroforestry Carbon Sink Phase 1"
                    className="w-full px-3 py-2 bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl font-medium outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11.5px] font-bold text-[#0F172A] mb-1">State</label>
                    <select
                      value={newProject.state}
                      onChange={e => setNewProject({ ...newProject, state: e.target.value })}
                      className="w-full px-3 py-2 bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl font-medium outline-none"
                    >
                      <option value="Madhya Pradesh">Madhya Pradesh</option>
                      <option value="Gujarat">Gujarat</option>
                      <option value="Maharashtra">Maharashtra</option>
                      <option value="Telangana">Telangana</option>
                      <option value="Rajasthan">Rajasthan</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11.5px] font-bold text-[#0F172A] mb-1">District</label>
                    <input
                      type="text"
                      required
                      value={newProject.district}
                      onChange={e => setNewProject({ ...newProject, district: e.target.value })}
                      placeholder="e.g. Warangal"
                      className="w-full px-3 py-2 bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl font-medium outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11.5px] font-bold text-[#0F172A] mb-1">Target Area (Acres)</label>
                    <input
                      type="number"
                      value={newProject.total_area_acres}
                      onChange={e => setNewProject({ ...newProject, total_area_acres: Number(e.target.value) })}
                      className="w-full px-3 py-2 bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl font-medium outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[11.5px] font-bold text-[#0F172A] mb-1">Estimated Credits (tCO₂e)</label>
                    <input
                      type="number"
                      value={newProject.estimated_carbon_credits}
                      onChange={e => setNewProject({ ...newProject, estimated_carbon_credits: Number(e.target.value) })}
                      className="w-full px-3 py-2 bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl font-medium outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11.5px] font-bold text-[#0F172A] mb-1">Govt Nodal Department</label>
                    <input
                      type="text"
                      value={newProject.govt_partner}
                      onChange={e => setNewProject({ ...newProject, govt_partner: e.target.value })}
                      className="w-full px-3 py-2 bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl font-medium outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[11.5px] font-bold text-[#0F172A] mb-1">Corporate / Offtaker Partner</label>
                    <input
                      type="text"
                      value={newProject.corporate_partner}
                      onChange={e => setNewProject({ ...newProject, corporate_partner: e.target.value })}
                      className="w-full px-3 py-2 bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl font-medium outline-none"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#F1F5F9]">
                  <button type="button" onClick={() => setIsCreateModalOpen(false)} className="btn btn-secondary btn-sm cursor-pointer">Cancel</button>
                  <button type="submit" className="btn btn-primary btn-sm cursor-pointer flex items-center gap-1">
                    <Plus size={14} /> Initialize Project
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};

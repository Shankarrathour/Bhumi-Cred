import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FileText, Plus, Target, RefreshCw, Eye, Trees,
  Building2, Handshake, DollarSign, X, MapPin, Sparkles,
  Layers, ShieldCheck, CheckCircle
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
  status: 'Draft' | 'Ongoing' | 'MRV' | 'Verification' | 'Issued' | 'Completed';
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
    status: 'Ongoing',
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
    status: 'MRV',
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
    status: 'Verification',
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
    status: 'Issued',
  },
  {
    id: 'PRJ-5090',
    project_code: 'PRJ-5090',
    name: 'Chhattisgarh Tribal Bamboo Carbon Drive',
    state: 'Chhattisgarh',
    district: 'Dhamtari',
    project_type: 'Bamboo Afforestation',
    total_area_acres: 15000,
    total_farmers: 980,
    govt_partner: 'CG Tribal Dept',
    corporate_partner: 'BambooTech India',
    insurance_cover_lakhs: 30.0,
    estimated_carbon_credits: 150000,
    credits_issued: 150000,
    revenue_generated_lakhs: 210.0,
    progress_percentage: 100,
    status: 'Completed',
  },
  {
    id: 'PRJ-6011',
    project_code: 'PRJ-6011',
    name: 'UP Agro-Solar Carbon Project Baseline',
    state: 'Uttar Pradesh',
    district: 'Lucknow',
    project_type: 'Agri-Solar',
    total_area_acres: 8000,
    total_farmers: 540,
    govt_partner: 'UP Renewable Energy',
    corporate_partner: 'SolarGrid Ltd',
    insurance_cover_lakhs: 18.0,
    estimated_carbon_credits: 80000,
    credits_issued: 0,
    revenue_generated_lakhs: 0,
    progress_percentage: 10,
    status: 'Draft',
  },
];

export const ProjectManagement = () => {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [projectsList, setProjectsList] = useState<AdminProjectItem[]>(SEEDED_PROJECTS);

  // Modal State for Creating New Project
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newProject, setNewProject] = useState({
    name: '',
    state: 'Madhya Pradesh',
    district: 'Sehore',
    project_type: 'Agroforestry & Reforestation',
    total_area_acres: 15000,
    govt_partner: 'MP Forest Dept',
    corporate_partner: 'AgriCorp Solutions Pvt Ltd',
    estimated_carbon_credits: 150000,
    status: 'Draft' as const,
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
        status: (item.status as any) || 'Ongoing',
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

  // 6 Specified Dashboard Cards Counts: Draft, Ongoing, MRV, Verification, Issued, Completed
  const draftCount = projects.filter(p => p.status === 'Draft').length;
  const ongoingCount = projects.filter(p => p.status === 'Ongoing').length;
  const mrvCount = projects.filter(p => p.status === 'MRV').length;
  const verificationCount = projects.filter(p => p.status === 'Verification').length;
  const issuedCount = projects.filter(p => p.status === 'Issued').length;
  const completedCount = projects.filter(p => p.status === 'Completed').length;

  const handleCreateProjectSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProject.name) {
      toast.error('Please enter a Project Name.');
      return;
    }

    const randomNum = Math.floor(7000 + Math.random() * 2000);
    const createdItem: AdminProjectItem = {
      id: `PRJ-${randomNum}`,
      project_code: `PRJ-${randomNum}`,
      name: newProject.name,
      state: newProject.state,
      district: newProject.district,
      project_type: newProject.project_type,
      total_area_acres: Number(newProject.total_area_acres),
      total_farmers: Math.floor(Number(newProject.total_area_acres) / 10),
      govt_partner: newProject.govt_partner,
      corporate_partner: newProject.corporate_partner,
      insurance_cover_lakhs: Math.round(Number(newProject.total_area_acres) * 0.002 * 10) / 10,
      estimated_carbon_credits: Number(newProject.estimated_carbon_credits),
      credits_issued: 0,
      revenue_generated_lakhs: 0,
      progress_percentage: newProject.status === 'Draft' ? 5 : 25,
      status: newProject.status as any,
    };

    setProjectsList(prev => [createdItem, ...prev]);
    toast.success(`Project "${createdItem.name}" (${createdItem.project_code}) created successfully!`);
    setIsCreateModalOpen(false);
    setNewProject({
      name: '',
      state: 'Madhya Pradesh',
      district: 'Sehore',
      project_type: 'Agroforestry & Reforestation',
      total_area_acres: 15000,
      govt_partner: 'MP Forest Dept',
      corporate_partner: 'AgriCorp Solutions Pvt Ltd',
      estimated_carbon_credits: 150000,
      status: 'Draft',
    });
  };

  const getStatusVariant = (s: string) => {
    if (s === 'Ongoing') return 'success';
    if (s === 'MRV') return 'info';
    if (s === 'Verification') return 'warning';
    if (s === 'Issued') return 'success';
    if (s === 'Completed') return 'gray';
    return 'gray';
  };

  return (
    <div className="space-y-6 page-enter pb-12" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>

      {/* ── Page Header ── */}
      <PageHeader
        title="Project Management & Operations"
        description="Oversee Carbon Forestry Projects, MRV Audits, Verification Lifecycle, Govt MoUs & Carbon Monetization."
        badge={{ label: `${projects.length} Registered Projects`, variant: 'info' }}
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

      {/* ── 6 SPECIFIED DASHBOARD CARDS ── */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <KpiCard title="DRAFT" value={draftCount} icon={FileText} iconBg="#F8FAFC" iconColor="#64748B" loading={isLoading} />
        <KpiCard title="ONGOING" value={ongoingCount} icon={Target} iconBg="#F0FDF4" iconColor="#16A34A" loading={isLoading} />
        <KpiCard title="MRV" value={mrvCount} icon={Sparkles} iconBg="#EFF6FF" iconColor="#2563EB" loading={isLoading} />
        <KpiCard title="VERIFICATION" value={verificationCount} icon={ShieldCheck} iconBg="#FFFBEB" iconColor="#D97706" loading={isLoading} />
        <KpiCard title="ISSUED" value={issuedCount} icon={CheckCircle} iconBg="#ECFDF5" iconColor="#059669" loading={isLoading} />
        <KpiCard title="COMPLETED" value={completedCount} icon={Layers} iconBg="#F5F3FF" iconColor="#8B5CF6" loading={isLoading} />
      </div>

      {/* ── SEARCH & STATUS FILTERS ── */}
      <div className="bg-white border border-[#E8EDF5] rounded-2xl p-4 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search projects by Code, Name, State, District, Partner..."
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
              <option value="Draft">Draft</option>
              <option value="Ongoing">Ongoing</option>
              <option value="MRV">MRV</option>
              <option value="Verification">Verification</option>
              <option value="Issued">Issued</option>
              <option value="Completed">Completed</option>
            </select>
          </div>
        </div>
      </div>

      {/* ── PROJECT LIST TABLE (All 6 Specified Columns) ── */}
      <div className="bg-white border border-[#E8EDF5] rounded-2xl overflow-hidden shadow-xs">
        <div className="p-4 border-b border-[#F1F5F9] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="text-[14px] font-bold text-[#0F172A]">Project Directory</h3>
            <span className="text-[11px] font-bold text-[#16A34A] bg-[#F0FDF4] px-2 py-0.5 rounded-full border border-[#DCFCE7]">
              {filtered.length} Projects
            </span>
          </div>
        </div>

        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left border-collapse min-w-[1100px]">
            <thead>
              <tr className="bg-[#F8FAFC] border-b border-[#E2E8F0] text-[11px] font-bold uppercase tracking-wider text-[#475569]">
                <th className="py-3 px-4">Project Name</th>
                <th className="py-3 px-4">Area</th>
                <th className="py-3 px-4">Farmer Count</th>
                <th className="py-3 px-4">Partner</th>
                <th className="py-3 px-4">Credits</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F1F5F9]">
              {isLoading ? (
                <tr><td colSpan={7} className="p-0"><SkeletonTable rows={6} cols={7} /></td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={7}>
                  <EmptyState icon={FileText} title="No projects found" description="Try adjusting your filters or search." />
                </td></tr>
              ) : filtered.map((p) => (
                <tr
                  key={p.id}
                  className="hover:bg-[#F8FAFC] transition-colors"
                >
                  {/* Column 1: Project Name */}
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-xl bg-[#F0FDF4] border border-[#DCFCE7] flex items-center justify-center text-[#16A34A] shrink-0">
                        <Trees size={16} />
                      </div>
                      <div>
                        <div
                          onClick={() => navigate(`/projects/${p.id}`)}
                          className="text-[13px] font-bold text-[#0F172A] hover:text-[#16A34A] cursor-pointer"
                        >
                          {p.name}
                        </div>
                        <div className="text-[11px] text-[#64748B] font-mono">{p.project_code} • {p.district}, {p.state}</div>
                      </div>
                    </div>
                  </td>

                  {/* Column 2: Area */}
                  <td className="py-3 px-4 text-[13px] font-bold text-[#0F172A]">
                    {p.total_area_acres.toLocaleString()} <span className="text-[11px] font-normal text-[#64748B]">Acres</span>
                  </td>

                  {/* Column 3: Farmer Count */}
                  <td className="py-3 px-4 text-[13px] font-bold text-[#2563EB]">
                    {p.total_farmers.toLocaleString()} <span className="text-[11px] font-normal text-[#64748B]">Farmers</span>
                  </td>

                  {/* Column 4: Partner */}
                  <td className="py-3 px-4">
                    <div className="text-[11.5px] font-medium text-[#0F172A]">
                      {p.govt_partner}
                    </div>
                    <div className="text-[11px] text-[#2563EB]">
                      {p.corporate_partner}
                    </div>
                  </td>

                  {/* Column 5: Credits */}
                  <td className="py-3 px-4 text-[13px] font-extrabold text-[#16A34A]">
                    {p.credits_issued.toLocaleString()} <span className="text-[11px] font-normal text-[#64748B]">tCO₂e</span>
                  </td>

                  {/* Column 6: Status */}
                  <td className="py-3 px-4">
                    <StatusBadge label={p.status} variant={getStatusVariant(p.status) as any} size="sm" />
                  </td>

                  {/* Action */}
                  <td className="py-3 px-4 text-right">
                    <button
                      onClick={() => navigate(`/projects/${p.id}`)}
                      className="px-3 py-1.5 bg-[#F0FDF4] hover:bg-[#DCFCE7] text-[#16A34A] text-[11.5px] font-bold rounded-lg transition-colors flex items-center gap-1 cursor-pointer ml-auto"
                    >
                      <Eye size={13} /> Project Details
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── CREATE NEW PROJECT MODAL DIALOG ── */}
      <AnimatePresence>
        {isCreateModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-[#E8EDF5] space-y-4"
            >
              <div className="flex items-center justify-between border-b border-[#F1F5F9] pb-3">
                <div className="flex items-center gap-2">
                  <Trees size={20} className="text-[#16A34A]" />
                  <h3 className="text-[16px] font-bold text-[#0F172A]">Create New Carbon Forestry Project</h3>
                </div>
                <button onClick={() => setIsCreateModalOpen(false)} className="text-[#94A3B8] hover:text-[#0F172A] text-lg font-bold cursor-pointer">
                  ×
                </button>
              </div>

              <form onSubmit={handleCreateProjectSubmit} className="space-y-3 text-[12.5px]">
                <div>
                  <label className="block font-bold text-[#0F172A] mb-1">Project Name *</label>
                  <input
                    type="text"
                    required
                    value={newProject.name}
                    onChange={(e) => setNewProject({ ...newProject, name: e.target.value })}
                    placeholder="e.g. Malwa Climate & Agroforestry Drive"
                    className="w-full px-3.5 py-2 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-[13px] font-semibold text-[#0F172A] outline-none focus:border-[#16A34A]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-[#0F172A] mb-1">State</label>
                    <select
                      value={newProject.state}
                      onChange={(e) => setNewProject({ ...newProject, state: e.target.value })}
                      className="w-full px-3 py-2 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-[12.5px] font-medium text-[#0F172A] outline-none focus:border-[#16A34A]"
                    >
                      <option value="Madhya Pradesh">Madhya Pradesh</option>
                      <option value="Gujarat">Gujarat</option>
                      <option value="Maharashtra">Maharashtra</option>
                      <option value="Chhattisgarh">Chhattisgarh</option>
                      <option value="Rajasthan">Rajasthan</option>
                      <option value="Uttar Pradesh">Uttar Pradesh</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-[#0F172A] mb-1">District</label>
                    <input
                      type="text"
                      required
                      value={newProject.district}
                      onChange={(e) => setNewProject({ ...newProject, district: e.target.value })}
                      placeholder="e.g. Sehore / Indore"
                      className="w-full px-3 py-2 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-[12.5px] font-semibold text-[#0F172A] outline-none focus:border-[#16A34A]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-[#0F172A] mb-1">Project Type</label>
                    <select
                      value={newProject.project_type}
                      onChange={(e) => setNewProject({ ...newProject, project_type: e.target.value })}
                      className="w-full px-3 py-2 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-[12.5px] font-medium text-[#0F172A] outline-none focus:border-[#16A34A]"
                    >
                      <option value="Agroforestry & Reforestation">Agroforestry & Reforestation</option>
                      <option value="Blue Carbon & Mangroves">Blue Carbon & Mangroves</option>
                      <option value="Soil Organic Biochar">Soil Organic Biochar</option>
                      <option value="Arid Plantation">Arid Plantation</option>
                      <option value="Bamboo Afforestation">Bamboo Afforestation</option>
                      <option value="Agri-Solar">Agri-Solar</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-bold text-[#0F172A] mb-1">Initial Status</label>
                    <select
                      value={newProject.status}
                      onChange={(e) => setNewProject({ ...newProject, status: e.target.value as any })}
                      className="w-full px-3 py-2 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-[12.5px] font-medium text-[#0F172A] outline-none focus:border-[#16A34A]"
                    >
                      <option value="Draft">Draft</option>
                      <option value="Ongoing">Ongoing</option>
                      <option value="MRV">MRV</option>
                      <option value="Verification">Verification</option>
                      <option value="Issued">Issued</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-[#0F172A] mb-1">Total Target Area (Acres)</label>
                    <input
                      type="number"
                      required
                      value={newProject.total_area_acres}
                      onChange={(e) => setNewProject({ ...newProject, total_area_acres: Number(e.target.value) })}
                      className="w-full px-3 py-2 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-[12.5px] font-bold text-[#0F172A] outline-none focus:border-[#16A34A]"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-[#0F172A] mb-1">Est. Carbon Credits (tCO₂e)</label>
                    <input
                      type="number"
                      required
                      value={newProject.estimated_carbon_credits}
                      onChange={(e) => setNewProject({ ...newProject, estimated_carbon_credits: Number(e.target.value) })}
                      className="w-full px-3 py-2 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-[12.5px] font-bold text-[#16A34A] outline-none focus:border-[#16A34A]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-[#0F172A] mb-1">Govt Nodal Partner</label>
                    <input
                      type="text"
                      value={newProject.govt_partner}
                      onChange={(e) => setNewProject({ ...newProject, govt_partner: e.target.value })}
                      className="w-full px-3 py-2 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-[12.5px] font-semibold text-[#0F172A] outline-none focus:border-[#16A34A]"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-[#0F172A] mb-1">Corporate B2B Partner</label>
                    <input
                      type="text"
                      value={newProject.corporate_partner}
                      onChange={(e) => setNewProject({ ...newProject, corporate_partner: e.target.value })}
                      className="w-full px-3 py-2 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-[12.5px] font-semibold text-[#0F172A] outline-none focus:border-[#16A34A]"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#F1F5F9]">
                  <button type="button" onClick={() => setIsCreateModalOpen(false)} className="btn btn-secondary btn-sm">
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary btn-sm flex items-center gap-1.5">
                    <Plus size={14} /> Create Project
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

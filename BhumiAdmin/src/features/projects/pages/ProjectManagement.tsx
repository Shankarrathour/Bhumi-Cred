import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FileText, Plus, Target, RefreshCw, Eye, Trees,
  Building2, Handshake, DollarSign, X, MapPin, Sparkles,
  Layers, ShieldCheck, CheckCircle, Trash2, Edit3
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { PageHeader } from '../../../components/ui/PageHeader';
import { KpiCard } from '../../../components/ui/KpiCard';
import { StatusBadge } from '../../../components/ui/StatusBadge';
import { EmptyState, SkeletonTable } from '../../../components/ui/EmptyState';
import {
  useProjects,
  useCreateProject,
  useUpdateProject,
  useDeleteProject,
  useAssignFarmerProject,
} from '../api/useProjects';
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

export const ProjectManagement = () => {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Modal State for Assigning Project to Farmer
  const [assignModalProject, setAssignModalProject] = useState<AdminProjectItem | null>(null);
  const [assignFarmerId, setAssignFarmerId] = useState('6a843e2b61baba8ac361df93');
  const [assigning, setAssigning] = useState(false);

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

  // Modal State for Editing Project
  const [editModalProject, setEditModalProject] = useState<AdminProjectItem | null>(null);

  // Modal State for Deleting Project
  const [deleteModalProject, setDeleteModalProject] = useState<AdminProjectItem | null>(null);

  const { data: apiProjects, isLoading, refetch, isFetching } = useProjects();
  const createProjectMutation = useCreateProject();
  const updateProjectMutation = useUpdateProject();
  const deleteProjectMutation = useDeleteProject();
  const assignProjectMutation = useAssignFarmerProject();

  const handleAssignProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assignModalProject) return;
    setAssigning(true);
    try {
      await assignProjectMutation.mutateAsync({
        projectId: assignModalProject.id,
        farmerId: assignFarmerId,
        landAreaAcres: 10,
        treeCount: 40,
      });
      toast.success(`Project "${assignModalProject.name}" assigned to Farmer successfully! Updated live in App.`);
      setAssignModalProject(null);
      refetch();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || err?.message || 'Failed to assign project.');
    } finally {
      setAssigning(false);
    }
  };

  const projects = useMemo(() => {
    return (apiProjects || []).map((item: any) => {
      let mappedStatus: AdminProjectItem['status'] = 'Ongoing';
      const st = (item.status || item.status_label || '').toLowerCase();
      if (st.includes('draft') || st.includes('planning') || st.includes('available')) mappedStatus = 'Draft';
      else if (st.includes('mrv') || st.includes('monitoring')) mappedStatus = 'MRV';
      else if (st.includes('verification')) mappedStatus = 'Verification';
      else if (st.includes('issued')) mappedStatus = 'Issued';
      else if (st.includes('completed')) mappedStatus = 'Completed';
      else mappedStatus = 'Ongoing';

      return {
        id: item.project_id || item.id || `PRJ-${Math.floor(1000 + Math.random() * 9000)}`,
        project_code: (item.project_id || item.id || 'PRJ-1042').toUpperCase(),
        name: item.title || item.name || 'Afforestation Project',
        state: item.state || 'Madhya Pradesh',
        district: item.district || 'Sehore',
        project_type: item.category || item.project_type || 'Agroforestry & Reforestation',
        total_area_acres: item.target_area_acres || item.total_area_acres || 15000,
        total_farmers: item.farmers_enrolled || item.total_farmers || 0,
        govt_partner: item.ngo_partner || item.govt_partner || 'State Forest Department',
        corporate_partner: item.corporate_partner || 'Green Shield Carbon',
        insurance_cover_lakhs: item.insurance_cover_lakhs || 45.0,
        estimated_carbon_credits: item.estimated_carbon_impact || item.estimated_carbon_credits || 150000,
        credits_issued: item.credits_issued || 0,
        revenue_generated_lakhs: item.revenue_generated_lakhs || 0,
        progress_percentage: item.progress_percent || item.progress_percentage || 50,
        status: mappedStatus,
      };
    });
  }, [apiProjects]);

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

  const handleCreateProjectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProject.name) {
      toast.error('Please enter a Project Name.');
      return;
    }

    const randomNum = Math.floor(7000 + Math.random() * 2000);
    const projectId = `prj-${newProject.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 30)}-${randomNum}`;

    try {
      await createProjectMutation.mutateAsync({
        project_id: projectId,
        title: newProject.name,
        category: newProject.project_type,
        description: `Project dedicated to ${newProject.project_type} across ${newProject.district}, ${newProject.state}. Supporting local farmers with high-yield carbon sequestration and satellite MRV monitoring.`,
        district: newProject.district,
        state: newProject.state,
        target_area_acres: Number(newProject.total_area_acres),
        estimated_carbon_impact: Number(newProject.estimated_carbon_credits),
        ngo_partner: newProject.govt_partner || 'State Forest Department',
        status: newProject.status === 'Draft' ? 'available' : 'active_tracking',
        is_public: true,
        is_active: true,
      });

      toast.success(`Project "${newProject.name}" created successfully in Database!`);
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
      refetch();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || err?.message || 'Failed to create project.');
    }
  };

  const handleUpdateProjectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editModalProject) return;
    try {
      await updateProjectMutation.mutateAsync({
        projectId: editModalProject.id,
        payload: {
          title: editModalProject.name,
          category: editModalProject.project_type,
          district: editModalProject.district,
          state: editModalProject.state,
          target_area_acres: Number(editModalProject.total_area_acres),
          estimated_carbon_impact: Number(editModalProject.estimated_carbon_credits),
          ngo_partner: editModalProject.govt_partner,
          status: editModalProject.status === 'Draft' ? 'available' : 'active_tracking',
        },
      });
      toast.success(`Project "${editModalProject.name}" updated successfully!`);
      setEditModalProject(null);
      refetch();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || err?.message || 'Failed to update project.');
    }
  };

  const handleDeleteProject = async () => {
    if (!deleteModalProject) return;
    try {
      await deleteProjectMutation.mutateAsync(deleteModalProject.id);
      toast.success(`Project "${deleteModalProject.name}" deleted successfully!`);
      setDeleteModalProject(null);
      refetch();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || err?.message || 'Failed to delete project.');
    }
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
                    <div className="flex items-center justify-end gap-1.5 flex-wrap">
                      <button
                        onClick={() => setAssignModalProject(p)}
                        className="px-2.5 py-1.5 bg-[#EEF2FF] hover:bg-[#E0E7FF] text-[#4F46E5] text-[11.5px] font-bold rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                        title="Assign project to a farmer"
                      >
                        <Plus size={13} /> Assign
                      </button>
                      <button
                        onClick={() => setEditModalProject({ ...p })}
                        className="px-2.5 py-1.5 bg-[#F0FDF4] hover:bg-[#DCFCE7] text-[#16A34A] text-[11.5px] font-bold rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                        title="Edit project details"
                      >
                        <Edit3 size={13} /> Edit
                      </button>
                      <button
                        onClick={() => setDeleteModalProject(p)}
                        className="px-2.5 py-1.5 bg-[#FEF2F2] hover:bg-[#FEE2E2] text-[#DC2626] text-[11.5px] font-bold rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                        title="Delete this project"
                      >
                        <Trash2 size={13} /> Delete
                      </button>
                      <button
                        onClick={() => navigate(`/projects/${p.id}`)}
                        className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11.5px] font-bold rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                        title="View full project details"
                      >
                        <Eye size={13} /> View
                      </button>
                    </div>
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

      {/* ── ASSIGN PROJECT TO FARMER MODAL ── */}
      <AnimatePresence>
        {assignModalProject && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl border border-[#E2E8F0] space-y-4"
            >
              <div className="flex items-center justify-between border-b border-[#F1F5F9] pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-[#EEF2FF] text-[#4F46E5] flex items-center justify-center font-bold">
                    <Plus size={18} />
                  </div>
                  <div>
                    <h3 className="font-bold text-[16px] text-[#0F172A]">Assign Project to Farmer</h3>
                    <p className="text-[11px] text-[#64748B]">{assignModalProject.name}</p>
                  </div>
                </div>
                <button onClick={() => setAssignModalProject(null)} className="p-1 hover:bg-[#F1F5F9] rounded-lg">
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleAssignProject} className="space-y-4">
                <div>
                  <label className="block text-[12px] font-bold text-[#0F172A] mb-1">Select Farmer to Assign</label>
                  <select
                    value={assignFarmerId}
                    onChange={(e) => setAssignFarmerId(e.target.value)}
                    className="w-full px-3 py-2.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-[13px] font-semibold text-[#0F172A] outline-none focus:border-[#4F46E5]"
                  >
                    <option value="6a843e2b61baba8ac361df93">Shankar Rathore (+91 98260 12345)</option>
                    <option value="6a82e4f53771f3116c8c3eff">Rajesh Kumar (+91 98930 54321)</option>
                    <option value="6a84253561baba8ac361df56">Gopal Verma (+91 94250 99887)</option>
                    <option value="6a84475961baba8ac361dfbe">Amit Patel (+91 97550 11223)</option>
                  </select>
                </div>

                <div className="p-3 bg-[#F0FDF4] border border-[#DCFCE7] rounded-xl text-[12px] text-[#166534] space-y-1">
                  <div className="font-bold">✅ Immediate Sync to Mobile App</div>
                  <div>Assigning will automatically register all 9 roadmap stages for this farmer and enable active project tracking in BhumiAPP.</div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button type="button" onClick={() => setAssignModalProject(null)} className="btn btn-secondary btn-sm">
                    Cancel
                  </button>
                  <button type="submit" disabled={assigning} className="btn btn-primary btn-sm flex items-center gap-1 bg-[#4F46E5] hover:bg-[#4338CA] border-none text-white">
                    {assigning ? 'Assigning...' : 'Assign Project Now'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── EDIT PROJECT MODAL ── */}
      <AnimatePresence>
        {editModalProject && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-[#E8EDF5] space-y-4"
            >
              <div className="flex items-center justify-between border-b border-[#F1F5F9] pb-3">
                <div className="flex items-center gap-2">
                  <Edit3 size={20} className="text-[#16A34A]" />
                  <div>
                    <h3 className="text-[16px] font-bold text-[#0F172A]">Edit Project Details</h3>
                    <p className="text-[11px] text-[#64748B] font-mono">{editModalProject.project_code}</p>
                  </div>
                </div>
                <button onClick={() => setEditModalProject(null)} className="text-[#94A3B8] hover:text-[#0F172A] text-lg font-bold cursor-pointer">
                  ×
                </button>
              </div>

              <form onSubmit={handleUpdateProjectSubmit} className="space-y-3 text-[12.5px]">
                <div>
                  <label className="block font-bold text-[#0F172A] mb-1">Project Name *</label>
                  <input
                    type="text"
                    required
                    value={editModalProject.name}
                    onChange={(e) => setEditModalProject({ ...editModalProject, name: e.target.value })}
                    className="w-full px-3.5 py-2 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-[13px] font-semibold text-[#0F172A] outline-none focus:border-[#16A34A]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-[#0F172A] mb-1">State</label>
                    <select
                      value={editModalProject.state}
                      onChange={(e) => setEditModalProject({ ...editModalProject, state: e.target.value })}
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
                      value={editModalProject.district}
                      onChange={(e) => setEditModalProject({ ...editModalProject, district: e.target.value })}
                      className="w-full px-3 py-2 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-[12.5px] font-semibold text-[#0F172A] outline-none focus:border-[#16A34A]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-[#0F172A] mb-1">Project Type</label>
                    <select
                      value={editModalProject.project_type}
                      onChange={(e) => setEditModalProject({ ...editModalProject, project_type: e.target.value })}
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
                    <label className="block font-bold text-[#0F172A] mb-1">Status</label>
                    <select
                      value={editModalProject.status}
                      onChange={(e) => setEditModalProject({ ...editModalProject, status: e.target.value as any })}
                      className="w-full px-3 py-2 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-[12.5px] font-medium text-[#0F172A] outline-none focus:border-[#16A34A]"
                    >
                      <option value="Draft">Draft (Available)</option>
                      <option value="Ongoing">Ongoing</option>
                      <option value="MRV">MRV</option>
                      <option value="Verification">Verification</option>
                      <option value="Issued">Issued</option>
                      <option value="Completed">Completed</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-[#0F172A] mb-1">Target Area (Acres)</label>
                    <input
                      type="number"
                      required
                      value={editModalProject.total_area_acres}
                      onChange={(e) => setEditModalProject({ ...editModalProject, total_area_acres: Number(e.target.value) })}
                      className="w-full px-3 py-2 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-[12.5px] font-bold text-[#0F172A] outline-none focus:border-[#16A34A]"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-[#0F172A] mb-1">Est. Carbon Credits (tCO₂e)</label>
                    <input
                      type="number"
                      required
                      value={editModalProject.estimated_carbon_credits}
                      onChange={(e) => setEditModalProject({ ...editModalProject, estimated_carbon_credits: Number(e.target.value) })}
                      className="w-full px-3 py-2 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-[12.5px] font-bold text-[#16A34A] outline-none focus:border-[#16A34A]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-[#0F172A] mb-1">Govt Nodal / NGO Partner</label>
                    <input
                      type="text"
                      value={editModalProject.govt_partner}
                      onChange={(e) => setEditModalProject({ ...editModalProject, govt_partner: e.target.value })}
                      className="w-full px-3 py-2 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-[12.5px] font-semibold text-[#0F172A] outline-none focus:border-[#16A34A]"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-[#0F172A] mb-1">Corporate Partner</label>
                    <input
                      type="text"
                      value={editModalProject.corporate_partner}
                      onChange={(e) => setEditModalProject({ ...editModalProject, corporate_partner: e.target.value })}
                      className="w-full px-3 py-2 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-[12.5px] font-semibold text-[#0F172A] outline-none focus:border-[#16A34A]"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#F1F5F9]">
                  <button type="button" onClick={() => setEditModalProject(null)} className="btn btn-secondary btn-sm">
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={updateProjectMutation.isPending}
                    className="btn btn-primary btn-sm flex items-center gap-1.5"
                  >
                    {updateProjectMutation.isPending ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── DELETE PROJECT CONFIRMATION MODAL ── */}
      <AnimatePresence>
        {deleteModalProject && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl border border-red-100 space-y-4"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center font-bold shrink-0">
                  <Trash2 size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-[16px] text-[#0F172A]">Delete Project</h3>
                  <p className="text-[12px] text-red-600 font-semibold">{deleteModalProject.name}</p>
                </div>
              </div>

              <p className="text-[12.5px] text-slate-600 leading-relaxed">
                Are you sure you want to permanently delete this project? This will remove the project from the admin dashboard and clear active enrollments linked to it.
              </p>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setDeleteModalProject(null)}
                  className="btn btn-secondary btn-sm"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleDeleteProject}
                  disabled={deleteProjectMutation.isPending}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:opacity-60 text-white font-bold rounded-xl text-[12.5px] shadow-sm flex items-center gap-1.5 cursor-pointer"
                >
                  {deleteProjectMutation.isPending ? 'Deleting...' : 'Yes, Delete Project'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

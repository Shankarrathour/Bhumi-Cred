import React, { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import {
  Check,
  Eye,
  Leaf,
  Loader2,
  Pencil,
  Plus,
  RefreshCcw,
  Save,
  Search,
  UserPlus,
  X,
  ChevronDown,
  ChevronUp,
  FolderKanban,
  Users,
  ShieldCheck,
  MapPin,
  Target,
  Cloud,
  Handshake,
  Globe,
  CheckCircle2,
} from 'lucide-react';
import adminApi from '../api/apiClient';
import { cn } from '../utils/cn';
import { getEnglishApiErrorMessage } from '../utils/apiErrorMessage';

type ProjectStatus = 'available' | 'active_tracking' | 'paused' | 'completed';
type EnrollmentStatus = 'pending_admin_verification' | 'active' | 'rejected' | 'clarification_requested' | 'completed';
type ProjectStage = 'registered' | 'under_review' | 'active_monitoring' | 'mrv_stage' | 'carbon_estimation' | 'completed';

interface AdminProject {
  id: string;
  project_id: string;
  title: string;
  category: string;
  description: string;
  district: string;
  state: string;
  target_area_acres: number;
  estimated_carbon_impact: number;
  ngo_partner?: string | null;
  status: ProjectStatus;
  status_label: string;
  is_public: boolean;
  is_active: boolean;
  eligibility: string[];
  required_documents: string[];
  created_at: string;
  updated_at: string;
}

interface AdminEnrollment {
  enrollment_id: string;
  farmer_id: string;
  farmer_name?: string | null;
  project_id: string;
  project_title: string;
  status: EnrollmentStatus;
  current_stage: ProjectStage;
  current_stage_label: string;
  progress_percent: number;
  land_area_acres: number;
  registered_trees: number;
  insured_trees: number;
  green_family_count: number;
  estimated_carbon_impact: number;
  land_verified: boolean;
  trees_verified: boolean;
  mrv_verified: boolean;
  insurance_active: boolean;
  joined_at: string;
  updated_at: string;
  stage_project_assigned: boolean;
  stage_land_registered: boolean;
  stage_inspection_completed: boolean;
  stage_soil_verified: boolean;
  stage_trees_registered: boolean;
  stage_insurance_activated: boolean;
  stage_mrv_monitoring_started: boolean;
  stage_carbon_estimation_running: boolean;
  stage_reward_eligible: boolean;
}

type PendingReview = {
  enrollment: AdminEnrollment;
  payload: any;
  successMessage: string;
  label: string;
};

interface ProjectForm {
  project_id: string;
  title: string;
  category: string;
  description: string;
  district: string;
  state: string;
  target_area_acres: string;
  estimated_carbon_impact: string;
  ngo_partner: string;
  status: ProjectStatus;
  eligibility: string;
  required_documents: string;
  is_public: boolean;
}

const emptyForm: ProjectForm = {
  project_id: '',
  title: '',
  category: 'Sustainability Mission',
  description: '',
  district: '',
  state: '',
  target_area_acres: '',
  estimated_carbon_impact: '',
  ngo_partner: '',
  status: 'available',
  eligibility: 'Farmer profile and KYC submitted\nAt least one registered land parcel',
  required_documents: 'Aadhaar or PAN\nLand proof\nPlantation photos\nGeo-location',
  is_public: true,
};

const statusOptions: ProjectStatus[] = ['available', 'active_tracking', 'paused', 'completed'];

const toLines = (value: string) =>
  value
    .split('\n')
    .map((item) => item.trim())
    .filter(Boolean);

const statusLabel = (status: ProjectStatus) =>
  status
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');

const slugify = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

const projectToForm = (project: AdminProject): ProjectForm => ({
  project_id: project.project_id,
  title: project.title,
  category: project.category,
  description: project.description,
  district: project.district,
  state: project.state,
  target_area_acres: String(project.target_area_acres),
  estimated_carbon_impact: String(project.estimated_carbon_impact),
  ngo_partner: project.ngo_partner || '',
  status: project.status,
  eligibility: project.eligibility.join('\n'),
  required_documents: project.required_documents.join('\n'),
  is_public: project.is_public,
});

export const CarbonProjectsPage: React.FC = () => {
  const [projects, setProjects] = useState<AdminProject[]>([]);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<AdminProject | null>(null);
  const [form, setForm] = useState<ProjectForm>(emptyForm);
  const [enrollments, setEnrollments] = useState<AdminEnrollment[]>([]);
  const [reviewingEnrollmentId, setReviewingEnrollmentId] = useState<string | null>(null);
  const [pendingReview, setPendingReview] = useState<PendingReview | null>(null);

  // Assign project to farmer modal state
  const [assigningProject, setAssigningProject] = useState<AdminProject | null>(null);
  const [assignFarmerId, setAssignFarmerId] = useState('');
  const [assignLandAcres, setAssignLandAcres] = useState('');
  const [assignTreeCount, setAssignTreeCount] = useState('0');
  const [isAssigning, setIsAssigning] = useState(false);
  const [expandedProjects, setExpandedProjects] = useState<Record<string, boolean>>({});

  const filteredProjects = useMemo(() => {
    const needle = search.toLowerCase().trim();
    if (!needle) return projects;
    return projects.filter((project) =>
      [
        project.title,
        project.project_id,
        project.category,
        project.district,
        project.state,
        project.ngo_partner || '',
      ]
        .join(' ')
        .toLowerCase()
        .includes(needle),
    );
  }, [projects, search]);

  const stats = useMemo(
    () => ({
      total: projects.length,
      publicCount: projects.filter((item) => item.is_public && item.is_active).length,
      tracking: projects.filter((item) => item.status === 'active_tracking').length,
      impact: projects.reduce((sum, item) => sum + item.estimated_carbon_impact, 0),
    }),
    [projects],
  );

  const isFetchingRef = React.useRef(false);

  const fetchProjects = async (silent = false) => {
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;
    if (!silent) setIsLoading(true);
    try {
      const [projectsRes, enrollmentsRes] = await Promise.all([
        adminApi.get('/admin/projects', {
          params: { include_inactive: true },
        }),
        adminApi.get('/admin/projects/enrollments'),
      ]);
      const fetchedProjects = projectsRes.data.data || [];
      const fetchedEnrollments = enrollmentsRes.data.data || [];
      setProjects(fetchedProjects);
      setEnrollments(fetchedEnrollments);
    } catch {
      // Keep existing state on transient network error
    } finally {
      isFetchingRef.current = false;
      if (!silent) setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
    const interval = window.setInterval(() => {
      fetchProjects(true);
    }, 15000);
    return () => window.clearInterval(interval);
  }, []);

  const openCreate = () => {
    setEditingProject(null);
    setForm(emptyForm);
    setIsDrawerOpen(true);
  };

  const openEdit = (project: AdminProject) => {
    setEditingProject(project);
    setForm(projectToForm(project));
    setIsDrawerOpen(true);
  };

  const updateForm = <K extends keyof ProjectForm>(key: K, value: ProjectForm[K]) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const handleTitleChange = (title: string) => {
    setForm((current) => ({
      ...current,
      title,
      project_id: editingProject ? current.project_id : slugify(title),
    }));
  };

  const validateForm = () => {
    if (!form.project_id || !form.title || !form.description || !form.district || !form.state) {
      toast.error('Fill project ID, title, description, district, and state.');
      return false;
    }
    if (!Number(form.target_area_acres) || Number(form.target_area_acres) <= 0) {
      toast.error('Target area must be greater than zero.');
      return false;
    }
    if (Number(form.estimated_carbon_impact) < 0) {
      toast.error('Estimated carbon impact cannot be negative.');
      return false;
    }
    return true;
  };

  const buildPayload = () => ({
    project_id: form.project_id,
    title: form.title,
    category: form.category,
    description: form.description,
    district: form.district,
    state: form.state,
    target_area_acres: Number(form.target_area_acres),
    estimated_carbon_impact: Number(form.estimated_carbon_impact),
    ngo_partner: form.ngo_partner || null,
    status: form.status,
    eligibility: toLines(form.eligibility),
    required_documents: toLines(form.required_documents),
    is_public: form.is_public,
  });

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!validateForm()) return;

    setIsSaving(true);
    try {
      if (editingProject) {
        const payload = buildPayload();
        const { project_id, ...updatePayload } = payload;
        const { data } = await adminApi.patch(`/admin/projects/${editingProject.project_id}`, updatePayload);
        setProjects((current) =>
          current.map((item) => (item.project_id === editingProject.project_id ? data.data : item)),
        );
        toast.success('Project updated.');
      } else {
        const { data } = await adminApi.post('/admin/projects', buildPayload());
        setProjects((current) => [data.data, ...current]);
        toast.success('Project created. It is now available to the mobile app.');
      }
      setIsDrawerOpen(false);
      setEditingProject(null);
      setForm(emptyForm);
    } catch (error: any) {
      toast.error(getEnglishApiErrorMessage(error, 'Project save failed.'));
    } finally {
      setIsSaving(false);
    }
  };

  const toggleProject = async (project: AdminProject, patch: Partial<AdminProject>) => {
    try {
      const { data } = await adminApi.patch(`/admin/projects/${project.project_id}`, patch);
      setProjects((current) =>
        current.map((item) => (item.project_id === project.project_id ? data.data : item)),
      );
      toast.success('Project status updated.');
    } catch (error: any) {
      toast.error(getEnglishApiErrorMessage(error, 'Status update failed.'));
    }
  };

  const handleAssign = async () => {
    if (!assigningProject) return;
    if (!assignFarmerId.trim()) { toast.error('Farmer ID required.'); return; }
    if (!Number(assignLandAcres) || Number(assignLandAcres) <= 0) { toast.error('Valid land acres required.'); return; }
    setIsAssigning(true);
    try {
      await adminApi.post(`/admin/projects/${assigningProject.project_id}/assign`, {
        farmer_id: assignFarmerId.trim(),
        land_area_acres: Number(assignLandAcres),
        tree_count: Number(assignTreeCount) || 0,
      });
      toast.success(`Farmer assigned to "${assigningProject.title}" successfully.`);
      setAssigningProject(null);
      setAssignFarmerId('');
      setAssignLandAcres('');
      setAssignTreeCount('0');
      fetchProjects();
    } catch (error: any) {
      toast.error(getEnglishApiErrorMessage(error, 'Assign failed. Check farmer ID.'));
    } finally {
      setIsAssigning(false);
    }
  };

  const reviewEnrollment = async (
    enrollment: AdminEnrollment,
    payload: {
      status: EnrollmentStatus;
      current_stage?: ProjectStage;
      progress_percent?: number;
      land_verified?: boolean;
      trees_verified?: boolean;
      mrv_verified?: boolean;
      insured_trees?: number;
      stage_inspection_completed?: boolean;
      stage_soil_verified?: boolean;
      stage_trees_registered?: boolean;
      stage_insurance_activated?: boolean;
      stage_mrv_monitoring_started?: boolean;
      stage_carbon_estimation_running?: boolean;
      stage_reward_eligible?: boolean;
    },
    successMessage: string,
  ) => {
    setReviewingEnrollmentId(enrollment.enrollment_id);
    try {
      await adminApi.patch(`/projects/admin/enrollments/${enrollment.enrollment_id}/review`, payload);
      toast.success(successMessage);
      fetchProjects();
    } catch (error: any) {
      toast.error(getEnglishApiErrorMessage(error, 'Lifecycle update failed.'));
    } finally {
      setReviewingEnrollmentId(null);
    }
  };

  const groupedEnrollments = useMemo(() => {
    const groups: Record<string, AdminEnrollment[]> = {};
    enrollments.forEach((e) => {
      const key = e.project_title || 'Unknown Project';
      if (!groups[key]) groups[key] = [];
      groups[key].push(e);
    });
    return groups;
  }, [enrollments]);

  return (
    <div className="space-y-6 pb-12 text-foreground select-none">
      {/* ── Page Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-[22px] font-bold text-foreground tracking-tight leading-none">
            Carbon Programs Control
          </h1>
          <p className="text-[13px] text-muted-foreground mt-1">
            Create real BhumiCred projects for the mobile Projects Hub and manage live visibility.
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          <button
            onClick={() => fetchProjects()}
            className="h-9 px-3.5 border border-border bg-card hover:bg-muted text-foreground rounded-xl text-[13px] font-medium transition-all flex items-center gap-2 shadow-xs"
          >
            <RefreshCcw className={cn('w-3.5 h-3.5 text-primary', isLoading && 'animate-spin')} />
            Refresh
          </button>
          <button onClick={openCreate} className="btn-primary h-9 px-4 rounded-xl shadow-xs">
            <Plus className="w-4 h-4" />
            <span>Create Project</span>
          </button>
        </div>
      </div>

      {/* ── Top Stats Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { title: 'TOTAL PROJECTS', value: stats.total, icon: FolderKanban, bg: 'bg-emerald-100 dark:bg-emerald-900/30', color: 'text-emerald-600 dark:text-emerald-400' },
          { title: 'PUBLIC IN APP', value: stats.publicCount, icon: Eye, bg: 'bg-blue-100 dark:bg-blue-900/30', color: 'text-blue-600 dark:text-blue-400' },
          { title: 'ACTIVE TRACKING', value: stats.tracking, icon: Check, bg: 'bg-teal-100 dark:bg-teal-900/30', color: 'text-teal-600 dark:text-teal-400' },
          { title: 'CO2e IMPACT (TONNES)', value: stats.impact.toLocaleString('en-IN'), icon: Leaf, bg: 'bg-emerald-100 dark:bg-emerald-900/30', color: 'text-emerald-600 dark:text-emerald-400' },
        ].map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.title} className="bg-card border border-border rounded-2xl p-4 flex items-center justify-between shadow-sm hover:shadow-md transition-all">
              <div>
                <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide block">
                  {stat.title}
                </span>
                <span className="text-[24px] font-bold text-foreground leading-none mt-1.5 block">{stat.value}</span>
              </div>
              <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0', stat.bg)}>
                <Icon className={cn('w-5 h-5', stat.color)} />
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Search Bar ── */}
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input
          type="text"
          placeholder="Search by project title, district, state, NGO partner..."
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          className="w-full pl-10 pr-4 h-10 bg-card border border-border rounded-xl text-[13px] text-foreground outline-none focus:border-primary/50 transition-colors shadow-xs placeholder:text-muted-foreground"
        />
      </div>

      {/* ── Farmer Enrollment Lifecycle Accordion ── */}
      <div className="bg-card border border-border rounded-2xl p-5 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border pb-4 mb-4">
          <div>
            <h2 className="text-[15px] font-bold text-foreground">Farmer Enrollment Lifecycle</h2>
            <p className="text-[12px] text-muted-foreground mt-0.5">
              Admin &amp; inspector steps: Inspection, soil verification, tree approval, insurance, MRV, carbon estimation &amp; rewards.
            </p>
          </div>
          <div className="inline-flex items-center gap-1.5 bg-primary/10 border border-primary/20 text-primary text-[12px] font-semibold px-3 py-1 rounded-lg self-start sm:self-auto">
            <Users className="w-3.5 h-3.5" />
            {enrollments.length} Enrollments
          </div>
        </div>

        {enrollments.length === 0 ? (
          <div className="h-28 border border-dashed border-border rounded-xl flex items-center justify-center text-[13px] text-muted-foreground font-medium">
            No farmer enrollments yet. Farmers join projects from the mobile application.
          </div>
        ) : (
          <div className="space-y-3">
            {Object.entries(groupedEnrollments).map(([projectTitle, projectEnrollments]) => {
              const isExpanded = expandedProjects[projectTitle];
              return (
                <div key={projectTitle} className="border border-border rounded-xl overflow-hidden bg-background">
                  <button
                    onClick={() => setExpandedProjects((prev) => ({ ...prev, [projectTitle]: !prev[projectTitle] }))}
                    className="p-3.5 w-full flex items-center justify-between text-left bg-card hover:bg-muted/40 transition-colors select-none"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold text-[13px]">
                        {projectEnrollments.length}
                      </div>
                      <div>
                        <h3 className="text-[14px] font-bold text-foreground">{projectTitle}</h3>
                        <p className="text-[12px] text-muted-foreground mt-0.5">{projectEnrollments.length} Farmers Joined</p>
                      </div>
                    </div>
                    <div className="w-7 h-7 rounded-lg border border-border bg-background flex items-center justify-center text-muted-foreground">
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </div>
                  </button>

                  {isExpanded && (
                    <div className="p-4 pt-2 space-y-3 border-t border-border bg-card/50">
                      {projectEnrollments.map((enrollment) => {
                        const busy = reviewingEnrollmentId === enrollment.enrollment_id;
                        return (
                          <div key={enrollment.enrollment_id} className="border border-border rounded-xl bg-card p-4 shadow-2xs space-y-3">
                            <div className="flex items-center justify-between gap-2 flex-wrap">
                              <div className="flex items-center gap-2 flex-wrap">
                                {enrollment.farmer_name && (
                                  <span className="text-[13.5px] font-bold text-foreground">
                                    {enrollment.farmer_name}
                                  </span>
                                )}
                                <span className="text-[12px] font-mono font-medium text-muted-foreground bg-muted/60 px-2 py-0.5 rounded-md border border-border">
                                  ID: {enrollment.farmer_id.slice(-6).toUpperCase()}
                                </span>
                                <span className="text-[12px] text-muted-foreground">
                                  · {enrollment.land_area_acres.toLocaleString('en-IN')} Acres · {enrollment.registered_trees} Trees
                                </span>
                              </div>
                              <span className="text-[12px] border border-primary/20 bg-primary/10 text-primary font-bold px-2.5 py-0.5 rounded-full">
                                {enrollment.progress_percent}% Complete
                              </span>
                            </div>

                            {/* Stage Metric Boxes */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                              <Metric label="Land Register" value={enrollment.stage_land_registered ? 'Done' : 'Pending'} />
                              <Metric label="Inspection" value={enrollment.stage_inspection_completed ? 'Done' : 'Pending'} />
                              <Metric label="Trees" value={enrollment.stage_trees_registered ? 'Approved' : `${enrollment.registered_trees} Submitted`} />
                              <Metric label="Insurance" value={enrollment.stage_insurance_activated ? 'Active' : 'Pending'} />
                            </div>

                            {/* Stage Action Buttons */}
                            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-2 pt-1">
                              <LifecycleButton
                                label="Inspection"
                                disabled={busy || !enrollment.stage_land_registered || enrollment.stage_inspection_completed}
                                onClick={() =>
                                  setPendingReview({
                                    enrollment,
                                    payload: {
                                      status: 'active',
                                      current_stage: 'active_monitoring',
                                      progress_percent: 35,
                                      stage_inspection_completed: true,
                                    },
                                    successMessage: 'Inspection completed.',
                                    label: 'Complete Inspection',
                                  })
                                }
                              />
                              <LifecycleButton
                                label="Verify Soil"
                                disabled={busy || !enrollment.stage_inspection_completed || enrollment.stage_soil_verified}
                                onClick={() =>
                                  setPendingReview({
                                    enrollment,
                                    payload: {
                                      status: 'active',
                                      current_stage: 'active_monitoring',
                                      progress_percent: 45,
                                      stage_soil_verified: true,
                                    },
                                    successMessage: 'Soil baseline verified.',
                                    label: 'Verify Soil',
                                  })
                                }
                              />
                              <LifecycleButton
                                label="Approve Trees"
                                disabled={busy || enrollment.registered_trees <= 0 || !enrollment.stage_soil_verified || enrollment.stage_trees_registered}
                                onClick={() =>
                                  setPendingReview({
                                    enrollment,
                                    payload: {
                                      status: 'active',
                                      current_stage: 'active_monitoring',
                                      progress_percent: 55,
                                      trees_verified: true,
                                      insured_trees: enrollment.registered_trees,
                                      stage_trees_registered: true,
                                    },
                                    successMessage: 'Trees approved.',
                                    label: 'Approve Trees',
                                  })
                                }
                              />
                              <LifecycleButton
                                label="Activate Insurance"
                                disabled={busy || !enrollment.stage_trees_registered || enrollment.stage_insurance_activated}
                                onClick={() =>
                                  setPendingReview({
                                    enrollment,
                                    payload: {
                                      status: 'active',
                                      insured_trees: enrollment.registered_trees,
                                      stage_insurance_activated: true,
                                    },
                                    successMessage: 'Insurance activated.',
                                    label: 'Activate Insurance',
                                  })
                                }
                              />
                              <LifecycleButton
                                label="Start MRV"
                                disabled={busy || !enrollment.stage_insurance_activated || enrollment.stage_mrv_monitoring_started}
                                onClick={() =>
                                  setPendingReview({
                                    enrollment,
                                    payload: {
                                      status: 'active',
                                      current_stage: 'mrv_stage',
                                      progress_percent: 70,
                                      mrv_verified: true,
                                      stage_mrv_monitoring_started: true,
                                    },
                                    successMessage: 'MRV monitoring started.',
                                    label: 'Start MRV',
                                  })
                                }
                              />
                              <LifecycleButton
                                label="Run Estimation"
                                disabled={busy || !enrollment.stage_mrv_monitoring_started || enrollment.stage_carbon_estimation_running}
                                onClick={() =>
                                  setPendingReview({
                                    enrollment,
                                    payload: {
                                      status: 'active',
                                      current_stage: 'carbon_estimation',
                                      progress_percent: 85,
                                      stage_carbon_estimation_running: true,
                                    },
                                    successMessage: 'Carbon estimation started.',
                                    label: 'Run Carbon Estimation',
                                  })
                                }
                              />
                              <LifecycleButton
                                label="Reward Eligible"
                                disabled={busy || !enrollment.stage_carbon_estimation_running || enrollment.stage_reward_eligible}
                                onClick={() =>
                                  setPendingReview({
                                    enrollment,
                                    payload: {
                                      status: 'completed',
                                      current_stage: 'completed',
                                      progress_percent: 100,
                                      stage_reward_eligible: true,
                                    },
                                    successMessage: 'Rewards eligibility marked complete.',
                                    label: 'Mark Reward Eligible',
                                  })
                                }
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Main Projects List Grid ── */}
      {isLoading ? (
        <div className="h-64 border border-border bg-card rounded-2xl flex flex-col items-center justify-center text-muted-foreground shadow-sm">
          <Loader2 className="w-8 h-8 text-primary animate-spin mb-2" />
          <span className="text-[13px] font-medium">Loading projects catalog…</span>
        </div>
      ) : filteredProjects.length === 0 ? (
        <div className="h-64 border border-dashed border-border bg-card rounded-2xl flex flex-col items-center justify-center text-center p-6 shadow-sm">
          <Leaf className="w-10 h-10 text-primary/40 mb-2" />
          <h3 className="text-[15px] font-bold text-foreground">No Projects In Database</h3>
          <p className="text-[13px] text-muted-foreground mt-1 max-w-sm">
            Create a project here to show it in the mobile Projects Hub for farmers.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {filteredProjects.map((project) => {
            return (
              <div
                key={project.project_id}
                className="bg-card border border-border/80 rounded-[28px] p-5 md:p-6 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col justify-between space-y-4"
              >
                {/* Content Area */}
                <div className="space-y-4">
                  {/* Top Bar: Status Badge, Project ID Pill, Edit Button */}
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-2">
                      {/* Status Badge */}
                      <span className={cn(
                        'inline-flex items-center gap-1.5 h-7 px-3 rounded-full text-xs font-semibold border shadow-2xs',
                        project.status === 'available' ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20 dark:text-emerald-400' :
                        project.status === 'active_tracking' ? 'bg-blue-500/10 text-blue-600 border-blue-500/20 dark:text-blue-400' :
                        project.status === 'paused' ? 'bg-amber-500/10 text-amber-600 border-amber-500/20 dark:text-amber-400' :
                        'bg-purple-500/10 text-purple-600 border-purple-500/20 dark:text-purple-400'
                      )}>
                        <span className={cn(
                          "w-1.5 h-1.5 rounded-full",
                          project.status === 'available' ? "bg-emerald-500" :
                          project.status === 'active_tracking' ? "bg-blue-500 animate-pulse" :
                          project.status === 'paused' ? "bg-amber-500" : "bg-purple-500"
                        )} />
                        {statusLabel(project.status)}
                      </span>

                      {/* Project ID Pill */}
                      <span className="inline-flex items-center h-7 px-2.5 rounded-lg text-[11px] font-mono font-medium text-muted-foreground bg-muted/60 border border-border">
                        {project.project_id}
                      </span>
                    </div>

                    {/* Edit Button */}
                    <button
                      onClick={() => openEdit(project)}
                      className="inline-flex items-center gap-1.5 h-7 px-3 rounded-lg border border-primary/30 text-primary hover:bg-primary/10 text-xs font-semibold transition-colors"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                      Edit
                    </button>
                  </div>

                  {/* Title & Description */}
                  <div>
                    <h3 className="text-[18px] font-bold text-foreground tracking-tight leading-snug">
                      {project.title}
                    </h3>
                    <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed mt-1">
                      {project.description}
                    </p>
                  </div>

                  {/* Divider */}
                  <div className="border-b border-border/60" />

                  {/* 4 Metric Sub-Cards Row */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    {/* Metric 1: District / State */}
                    <div className="bg-muted/30 border border-border rounded-xl p-3 flex flex-col justify-between min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400 mb-1.5 flex-shrink-0">
                        <MapPin className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider block truncate">District / State</span>
                        <span className="text-xs font-bold text-foreground truncate block mt-0.5" title={`${project.district}, ${project.state}`}>
                          {project.district}, {project.state}
                        </span>
                      </div>
                    </div>

                    {/* Metric 2: Target Area */}
                    <div className="bg-muted/30 border border-border rounded-xl p-3 flex flex-col justify-between min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-600 dark:text-blue-400 mb-1.5 flex-shrink-0">
                        <Target className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider block truncate">Target Area</span>
                        <span className="text-xs font-bold text-foreground truncate block mt-0.5">
                          {project.target_area_acres.toLocaleString('en-IN')} Ac
                        </span>
                      </div>
                    </div>

                    {/* Metric 3: Est. CO2e */}
                    <div className="bg-muted/30 border border-border rounded-xl p-3 flex flex-col justify-between min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400 mb-1.5 flex-shrink-0">
                        <Cloud className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider block truncate">Est. CO2e</span>
                        <span className="text-xs font-bold text-foreground truncate block mt-0.5">
                          {project.estimated_carbon_impact.toLocaleString('en-IN')} t
                        </span>
                      </div>
                    </div>

                    {/* Metric 4: NGO Partner */}
                    <div className="bg-muted/30 border border-border rounded-xl p-3 flex flex-col justify-between min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-600 dark:text-amber-400 mb-1.5 flex-shrink-0">
                        <Handshake className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider block truncate">NGO Partner</span>
                        <span className="text-xs font-bold text-foreground truncate block mt-0.5" title={project.ngo_partner || 'Unassigned'}>
                          {project.ngo_partner || 'Unassigned'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Bottom Control Row */}
                  <div className="flex items-center justify-between gap-3 pt-2 flex-wrap border-t border-border/50">
                    <div className="flex items-center gap-2 flex-wrap">
                      {/* Public Toggle */}
                      <button
                        onClick={() => toggleProject(project, { is_public: !project.is_public })}
                        className={cn(
                          'inline-flex items-center gap-1.5 h-8 px-3 rounded-lg text-xs font-semibold border transition-all',
                          project.is_public
                            ? 'border-emerald-500/30 text-emerald-600 bg-emerald-500/10 hover:bg-emerald-500/20'
                            : 'border-border text-muted-foreground bg-muted hover:bg-muted/80',
                        )}
                        title="Toggle App Visibility"
                      >
                        <Globe className="w-3.5 h-3.5" />
                        {project.is_public ? 'Public' : 'Hidden'}
                      </button>

                      {/* Active Toggle */}
                      <button
                        onClick={() => toggleProject(project, { is_active: !project.is_active })}
                        className={cn(
                          'inline-flex items-center gap-1.5 h-8 px-3 rounded-lg text-xs font-semibold border transition-all',
                          project.is_active
                            ? 'border-emerald-500/30 text-emerald-600 bg-emerald-500/10 hover:bg-emerald-500/20'
                            : 'border-rose-500/30 text-rose-600 bg-rose-500/10 hover:bg-rose-500/20',
                        )}
                        title="Toggle Project Active Status"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        {project.is_active ? 'Active' : 'Archived'}
                      </button>

                      {/* Assign Farmer Button */}
                      <button
                        onClick={() => {
                          setAssigningProject(project);
                          setAssignFarmerId('');
                          setAssignLandAcres('');
                          setAssignTreeCount('0');
                        }}
                        className="inline-flex items-center gap-1.5 h-9 px-4 rounded-full bg-[#15803D] hover:bg-[#166534] text-white text-[12.5px] font-semibold transition-all shadow-xs"
                      >
                        <UserPlus className="w-3.5 h-3.5 text-white" />
                        Assign Farmer
                      </button>
                    </div>

                    {/* Status Select Dropdown */}
                    <select
                      value={project.status}
                      onChange={(event) => toggleProject(project, { status: event.target.value as ProjectStatus })}
                      className="h-9 bg-card border border-border rounded-full px-3 text-[12.5px] font-medium text-foreground outline-none focus:border-primary/50 cursor-pointer shadow-2xs"
                    >
                      {statusOptions.map((status) => (
                        <option key={status} value={status} className="bg-card text-foreground">
                          {statusLabel(status)}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Assign Project to Farmer Modal ── */}
      {assigningProject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-xs" onClick={() => setAssigningProject(null)} />
          <div className="relative w-full max-w-md bg-card border border-border rounded-2xl shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div>
                <h3 className="text-[16px] font-bold text-foreground">Assign Project to Farmer</h3>
                <p className="text-[12px] text-muted-foreground mt-0.5 truncate max-w-xs">{assigningProject.title}</p>
              </div>
              <button onClick={() => setAssigningProject(null)} className="p-1.5 border border-border rounded-lg text-muted-foreground hover:bg-muted">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <Field label="Farmer ID (Copy from Farmers Portal)">
                <input
                  value={assignFarmerId}
                  onChange={(e) => setAssignFarmerId(e.target.value.toLowerCase().trim())}
                  placeholder="e.g. 6aaf7578382306854c668508"
                  className="ent-input font-mono text-[13px]"
                />
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Land Area (Acres)">
                  <input
                    type="number"
                    value={assignLandAcres}
                    onChange={(e) => setAssignLandAcres(e.target.value)}
                    placeholder="e.g. 4.5"
                    className="ent-input"
                  />
                </Field>
                <Field label="Tree Count (Optional)">
                  <input
                    type="number"
                    value={assignTreeCount}
                    onChange={(e) => setAssignTreeCount(e.target.value)}
                    placeholder="e.g. 50"
                    className="ent-input"
                  />
                </Field>
              </div>

              <div className="p-3 border border-border bg-muted/30 rounded-xl text-[12px] text-muted-foreground leading-relaxed">
                Farmer ID can be copied directly from <strong>Farmers Portal</strong> drawer.
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-border">
              <button
                type="button"
                onClick={() => setAssigningProject(null)}
                className="btn-outline h-9 px-4 rounded-xl"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isAssigning}
                onClick={handleAssign}
                className="btn-primary h-9 px-4 rounded-xl"
              >
                {isAssigning ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
                <span>Assign Project</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Create / Edit Project Drawer ── */}
      {isDrawerOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-xs" onClick={() => setIsDrawerOpen(false)} />
          <form
            onSubmit={handleSubmit}
            className="relative w-full max-w-xl h-full bg-card border-l border-border shadow-2xl flex flex-col"
          >
            <div className="h-16 px-6 border-b border-border flex items-center justify-between bg-card flex-shrink-0">
              <div>
                <h3 className="text-[16px] font-bold text-foreground">
                  {editingProject ? 'Edit Carbon Project' : 'Create Carbon Project'}
                </h3>
                <p className="text-[12px] text-muted-foreground mt-0.5">
                  Records save to MongoDB and sync with BhumiAPP.
                </p>
              </div>
              <button type="button" onClick={() => setIsDrawerOpen(false)} className="p-1.5 border border-border rounded-lg text-muted-foreground hover:bg-muted">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <Field label="Project Title">
                  <input value={form.title} onChange={(e) => handleTitleChange(e.target.value)} className="ent-input" />
                </Field>
                <Field label="Project ID">
                  <input
                    value={form.project_id}
                    onChange={(e) => updateForm('project_id', slugify(e.target.value))}
                    disabled={Boolean(editingProject)}
                    className="ent-input disabled:opacity-60 font-mono"
                  />
                </Field>
                <Field label="Category">
                  <input value={form.category} onChange={(e) => updateForm('category', e.target.value)} className="ent-input" />
                </Field>
                <Field label="NGO Partner">
                  <input value={form.ngo_partner} onChange={(e) => updateForm('ngo_partner', e.target.value)} className="ent-input" />
                </Field>
                <Field label="District">
                  <input value={form.district} onChange={(e) => updateForm('district', e.target.value)} className="ent-input" />
                </Field>
                <Field label="State">
                  <input value={form.state} onChange={(e) => updateForm('state', e.target.value)} className="ent-input" />
                </Field>
                <Field label="Target Area (Acres)">
                  <input type="number" value={form.target_area_acres} onChange={(e) => updateForm('target_area_acres', e.target.value)} className="ent-input" />
                </Field>
                <Field label="Estimated CO2e">
                  <input type="number" value={form.estimated_carbon_impact} onChange={(e) => updateForm('estimated_carbon_impact', e.target.value)} className="ent-input" />
                </Field>
              </div>

              <Field label="Description">
                <textarea value={form.description} onChange={(e) => updateForm('description', e.target.value)} rows={3} className="ent-input h-auto py-2.5 resize-none" />
              </Field>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <Field label="Eligibility (One per line)">
                  <textarea value={form.eligibility} onChange={(e) => updateForm('eligibility', e.target.value)} rows={4} className="ent-input h-auto py-2.5 resize-none" />
                </Field>
                <Field label="Required Documents (One per line)">
                  <textarea value={form.required_documents} onChange={(e) => updateForm('required_documents', e.target.value)} rows={4} className="ent-input h-auto py-2.5 resize-none" />
                </Field>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
                <Field label="Status">
                  <select value={form.status} onChange={(e) => updateForm('status', e.target.value as ProjectStatus)} className="ent-input cursor-pointer">
                    {statusOptions.map((status) => (
                      <option key={status} value={status}>{statusLabel(status)}</option>
                    ))}
                  </select>
                </Field>
                <label className="h-9 mt-5 border border-border bg-background rounded-lg flex items-center gap-2 px-3 text-[13px] font-medium text-foreground cursor-pointer">
                  <input type="checkbox" checked={form.is_public} onChange={(e) => updateForm('is_public', e.target.checked)} className="rounded text-primary focus:ring-0" />
                  Show in mobile application
                </label>
              </div>
            </div>

            <div className="h-16 px-6 border-t border-border flex items-center justify-end gap-3 bg-card flex-shrink-0">
              <button type="button" onClick={() => setIsDrawerOpen(false)} className="btn-outline h-9 px-4 rounded-xl">
                Cancel
              </button>
              <button type="submit" disabled={isSaving} className="btn-primary h-9 px-4 rounded-xl">
                {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                <span>{editingProject ? 'Save Changes' : 'Create Project'}</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ── Review Modal ── */}
      {pendingReview && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-2xl shadow-2xl max-w-md w-full overflow-hidden space-y-4 p-6">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h2 className="text-[16px] font-bold text-foreground flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-primary" />
                Authorize: {pendingReview.label}
              </h2>
              <button onClick={() => setPendingReview(null)} className="p-1 border border-border rounded-lg text-muted-foreground hover:bg-muted">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <Metric label="Farmer ID" value={pendingReview.enrollment.farmer_id.slice(-6).toUpperCase()} />
                <Metric label="Land Area" value={`${pendingReview.enrollment.land_area_acres} Acres`} />
                <Metric label="Registered Trees" value={`${pendingReview.enrollment.registered_trees}`} />
                <Metric label="Current Stage" value={pendingReview.enrollment.current_stage_label} />
              </div>

              <div className="border border-border rounded-xl p-3.5 bg-muted/20">
                <span className="text-[11px] font-bold text-primary block uppercase tracking-wider mb-1">
                  Verification Log Summary
                </span>
                <p className="text-[13px] text-foreground leading-relaxed">
                  {(() => {
                    switch (pendingReview.label) {
                      case 'Inspection Complete': return "Land coordinates matched with satellite data. Area boundaries verified.";
                      case 'Soil Verified': return "Soil Organic Carbon (SOC) baseline detected at 1.8%.";
                      case 'Approve Trees': return "Drone imagery confirms tree count matches submitted data.";
                      case 'Start MRV': return "Sentinel-2 satellite link established for continuous monitoring.";
                      case 'Carbon Estimation': return "AI models predict significant CO2e sequestration based on canopy density.";
                      case 'Rewards Eligible': return "All milestones achieved. Ready for carbon credit minting.";
                      default: return "Verification details confirmed.";
                    }
                  })()}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-border">
              <button onClick={() => setPendingReview(null)} className="btn-outline h-9 px-4 rounded-xl">
                Cancel
              </button>
              <button
                onClick={() => {
                  reviewEnrollment(pendingReview.enrollment, pendingReview.payload, pendingReview.successMessage);
                  setPendingReview(null);
                }}
                className="btn-primary h-9 px-4 rounded-xl"
              >
                <span>Confirm &amp; Authorize</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const Field: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <label className="space-y-1 block">
    <span className="text-[12px] font-medium text-muted-foreground block">{label}</span>
    {children}
  </label>
);

const Metric: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div className="border border-border bg-background rounded-xl p-2.5 min-w-0">
    <span className="text-[11px] font-medium text-muted-foreground block truncate">{label}</span>
    <span className="text-[13px] font-semibold text-foreground truncate block mt-0.5">{value}</span>
  </div>
);

const LifecycleButton: React.FC<{
  label: string;
  disabled: boolean;
  onClick: () => void;
}> = ({ label, disabled, onClick }) => (
  <button
    type="button"
    disabled={disabled}
    onClick={onClick}
    className={cn(
      'h-8 border px-2.5 rounded-lg text-[12px] font-semibold transition-all truncate text-center flex items-center justify-center',
      disabled
        ? 'border-border text-muted-foreground/50 bg-muted/20 cursor-not-allowed'
        : 'border-primary/40 text-primary bg-primary/10 hover:bg-primary/20 cursor-pointer',
    )}
  >
    {label}
  </button>
);

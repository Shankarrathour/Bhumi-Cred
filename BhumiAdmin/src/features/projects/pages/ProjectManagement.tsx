import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, Plus, Target, CheckCircle2, Clock, RefreshCw, Eye, Trees } from 'lucide-react';
import { motion } from 'framer-motion';
import { PageHeader } from '../../../components/ui/PageHeader';
import { FilterBar } from '../../../components/ui/FilterBar';
import { KpiCard } from '../../../components/ui/KpiCard';
import { StatusBadge } from '../../../components/ui/StatusBadge';
import { EmptyState, SkeletonTable } from '../../../components/ui/EmptyState';
import { useProjects } from '../api/useProjects';

const PAGE_SIZE = 10;

export const ProjectManagement = () => {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const { data: projectsData, isLoading, refetch, isFetching } = useProjects();

  const projects = useMemo(() => {
    if (!projectsData) return [];
    if (Array.isArray(projectsData)) return projectsData;
    if (Array.isArray((projectsData as any).data)) return (projectsData as any).data;
    if (Array.isArray((projectsData as any).items)) return (projectsData as any).items;
    return [];
  }, [projectsData]);

  const filtered = useMemo(() => {
    return projects.filter((p: any) => {
      const q = search.toLowerCase();
      const matchSearch = !q || [p.name, p.id, p.description].some((v: any) => v?.toLowerCase().includes(q));
      const matchStatus = !statusFilter || p.status?.toLowerCase() === statusFilter.toLowerCase();
      return matchSearch && matchStatus;
    });
  }, [projects, search, statusFilter]);

  const total = projects.length;
  const activeCount = projects.filter((p: any) => p.status?.toLowerCase() === 'active').length;
  const planningCount = projects.filter((p: any) => p.status?.toLowerCase() === 'planning').length;
  const totalArea = projects.reduce((acc: number, p: any) => acc + (p.total_area_acres || 0), 0);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pageRows = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const getStatusVariant = (s: string) => {
    const st = s?.toLowerCase() || '';
    if (st === 'active') return 'success';
    if (st === 'planning') return 'warning';
    if (st === 'completed') return 'info';
    return 'gray';
  };

  return (
    <div className="space-y-5 page-enter">
      <PageHeader
        title="Project Management"
        description="Oversee carbon forestry projects, afforestation goals, and regional project developments."
        badge={{ label: `${total} Projects`, variant: 'info' }}
        icon={FileText}
        actions={
          <>
            <button onClick={() => refetch()} className="btn btn-secondary btn-sm">
              <RefreshCw size={13} className={isFetching ? 'animate-spin' : ''} />
            </button>
            <button className="btn btn-primary btn-sm">
              <Plus size={13} /> New Project
            </button>
          </>
        }
      />

      {/* KPI Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KpiCard title="Total Projects" value={total} icon={FileText} iconBg="#EFF6FF" iconColor="#2563EB" loading={isLoading} />
        <KpiCard title="Active Projects" value={activeCount} icon={CheckCircle2} iconBg="#F0FDF4" iconColor="#16A34A" loading={isLoading} />
        <KpiCard title="In Planning" value={planningCount} icon={Clock} iconBg="#FFFBEB" iconColor="#F59E0B" loading={isLoading} />
        <KpiCard title="Total Target Area" value={`${totalArea.toLocaleString()} ac`} icon={Target} iconBg="#F5F3FF" iconColor="#8B5CF6" loading={isLoading} />
      </div>

      {/* Data Table */}
      <div className="ent-card overflow-hidden">
        <div className="p-4 border-b border-[#F1F5F9]">
          <FilterBar
            search={search} onSearchChange={setSearch}
            searchPlaceholder="Search projects by name, ID..."
            filters={[{
              key: 'status', label: 'Status', value: statusFilter, onChange: setStatusFilter,
              options: [
                { label: 'Active', value: 'active' },
                { label: 'Planning', value: 'planning' },
                { label: 'Completed', value: 'completed' },
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
                <th>Project ID</th>
                <th>Project Name</th>
                <th>Target Area</th>
                <th>Estimated Credits</th>
                <th>Status</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={6} className="p-0"><SkeletonTable rows={6} cols={5} /></td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={6}>
                  <EmptyState icon={FileText} title="No projects found" description="Try adjusting your filters or search." />
                </td></tr>
              ) : pageRows.map((p: any, i: number) => (
                <motion.tr
                  key={p.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.03 }}
                >
                  <td>
                    <span className="font-mono text-[12px] text-[#64748B] bg-[#F8FAFC] px-2 py-0.5 rounded-[6px]">
                      PRJ-{String(p.id).slice(-6).toUpperCase()}
                    </span>
                  </td>
                  <td>
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-[10px] bg-[#F0FDF4] flex items-center justify-center shrink-0">
                        <Trees size={15} className="text-[#16A34A]" />
                      </div>
                      <div>
                        <div className="text-[13px] font-500 text-[#0F172A]" style={{ fontWeight: 500 }}>{p.name}</div>
                        <div className="text-[11.5px] text-[#94A3B8]">{p.description || 'Afforestation project'}</div>
                      </div>
                    </div>
                  </td>
                  <td className="text-[13px] font-600 text-[#0F172A]" style={{ fontWeight: 600 }}>{p.total_area_acres?.toLocaleString() || 0} acres</td>
                  <td className="text-[13px] font-600 text-[#16A34A]" style={{ fontWeight: 600 }}>{(p.estimated_carbon_credits || 0).toLocaleString()} tCO₂e</td>
                  <td>
                    <StatusBadge label={p.status ? p.status.charAt(0).toUpperCase() + p.status.slice(1) : 'Active'} variant={getStatusVariant(p.status) as any} size="sm" />
                  </td>
                  <td>
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => navigate(`/projects/${p.id}`)} className="btn btn-ghost btn-icon btn-sm" title="View details">
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
              Page {safePage} of {totalPages} · {filtered.length} projects
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

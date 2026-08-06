import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Activity, Map, Cloud, RefreshCw, AlertTriangle, Download, Leaf, Globe, AlertCircle, Loader2 } from 'lucide-react';
import { PageHeader } from '../../../components/ui/PageHeader';
import { KpiCard } from '../../../components/ui/KpiCard';
import { ChartCard } from '../../../components/ui/ChartCard';
import { StatusBadge } from '../../../components/ui/StatusBadge';
import { EmptyState } from '../../../components/ui/EmptyState';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { Grid, Typography, Card, CardContent } from '@mui/material';
import { useAdminProjects } from '../api/useMrv';

const BIOMASS_GROWTH_DATA = [
  { month: 'Jan', biomass: 400 },
  { month: 'Feb', biomass: 420 },
  { month: 'Mar', biomass: 460 },
  { month: 'Apr', biomass: 510 },
  { month: 'May', biomass: 580 },
  { month: 'Jun', biomass: 650 },
];

const mrvStatusVariant = (status: string): 'success' | 'warning' | 'danger' | 'gray' => {
  switch (status?.toLowerCase()) {
    case 'active': return 'success';
    case 'available': return 'warning';
    case 'completed': return 'gray';
    case 'paused': return 'danger';
    default: return 'gray';
  }
};

export const MrvDashboard: React.FC = () => {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { data: projects, isLoading, isError, refetch } = useAdminProjects();

  const totalProjects = projects?.length ?? 0;
  const activeProjects = projects?.filter(p => p.is_active && p.is_tracking_active).length ?? 0;
  const inactiveProjects = projects?.filter(p => !p.is_active || !p.is_tracking_active).length ?? 0;
  const totalCarbon = projects?.reduce((sum, p) => sum + (p.estimated_carbon_impact ?? 0), 0) ?? 0;

  const handleRefresh = () => {
    setIsRefreshing(true);
    refetch().finally(() => setIsRefreshing(false));
  };

  return (
    <div className="space-y-5 page-enter">
      <PageHeader
        title="MRV Operations & Telemetry"
        description="Monitor active sustainability projects, biomass estimates, and carbon sequestration in real-time."
        icon={Activity}
        iconColor="#0EA5E9"
        actions={
          <>
            <button onClick={handleRefresh} className="btn btn-secondary btn-sm gap-1.5">
              <RefreshCw size={14} className={isRefreshing ? 'animate-spin' : ''} /> Sync Data
            </button>
          </>
        }
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KpiCard title="Total Projects" value={totalProjects} icon={Globe} iconBg="#EFF6FF" iconColor="#2563EB" />
        <KpiCard title="Active & Tracking" value={activeProjects} icon={Activity} iconBg="#F0FDF4" iconColor="#16A34A" />
        <KpiCard title="Inactive / Paused" value={inactiveProjects} icon={AlertTriangle} iconBg="#FEF2F2" iconColor="#EF4444" />
        <KpiCard title="Est. Carbon (tCO₂)" value={totalCarbon.toFixed(1)} icon={Cloud} iconBg="#F5F3FF" iconColor="#8B5CF6" />
      </div>

      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <ChartCard title="Biomass Growth Tracking" subtitle="Estimated biomass (tons) across active projects over last 6 months" height={300}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={BIOMASS_GROWTH_DATA}>
                <defs>
                  <linearGradient id="colorBiomass" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#16A34A" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#16A34A" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Area type="monotone" dataKey="biomass" stroke="#16A34A" fillOpacity={1} fill="url(#colorBiomass)" />
              </AreaChart>
            </ResponsiveContainer>
          </ChartCard>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card className="h-full border border-[#E2E8F0] shadow-sm rounded-xl">
            <CardContent className="h-full flex flex-col p-5">
              <Typography variant="h6" className="font-semibold text-slate-800 mb-2">Project Heatmap</Typography>
              <Typography variant="body2" className="text-slate-500 mb-4">Live view of project deployments globally.</Typography>
              <div className="flex-1 bg-slate-100 rounded-lg flex flex-col items-center justify-center border-2 border-dashed border-slate-300">
                <Map className="text-slate-400 mb-2" size={32} />
                <Typography color="text.secondary">Global Map View Placeholder</Typography>
                <Typography variant="caption" color="text.secondary">(Integrates with Mapbox/Google Maps)</Typography>
              </div>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Projects Table */}
      <div className="ent-card overflow-hidden mt-6">
        <div className="p-4 border-b border-[#F1F5F9] flex justify-between items-center">
          <Typography variant="h6" className="font-semibold text-slate-800">Active MRV Projects</Typography>
          <button className="btn btn-ghost btn-sm text-indigo-600">
            <Download size={14} className="mr-1" /> Export Log
          </button>
        </div>

        {isLoading && (
          <div className="flex items-center justify-center gap-2 py-16 text-slate-400">
            <Loader2 size={20} className="animate-spin" />
            <span className="text-sm">Loading projects…</span>
          </div>
        )}

        {isError && !isLoading && (
          <div className="flex flex-col items-center justify-center gap-3 py-16">
            <AlertCircle size={24} className="text-red-400" />
            <p className="text-sm text-slate-500">Failed to load projects.</p>
            <button className="btn btn-secondary btn-sm" onClick={() => refetch()}>Retry</button>
          </div>
        )}

        {!isLoading && !isError && projects && projects.length === 0 && (
          <EmptyState icon={Activity} title="No projects found" />
        )}

        {!isLoading && !isError && projects && projects.length > 0 && (
          <div className="overflow-x-auto">
            <table className="ent-table">
              <thead>
                <tr>
                  <th>Project Name</th>
                  <th>Category</th>
                  <th>Area (acres)</th>
                  <th>NGO Partner</th>
                  <th>Carbon Impact</th>
                  <th>MRV Status</th>
                  <th>Last Updated</th>
                </tr>
              </thead>
              <tbody>
                {projects.map((project, i) => (
                  <motion.tr
                    key={project.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.05 }}
                  >
                    <td className="font-medium text-slate-800">{project.title}</td>
                    <td className="text-slate-500 text-sm">{project.category}</td>
                    <td className="font-mono text-sm text-slate-600">{project.target_area_acres?.toFixed(1)}</td>
                    <td className="text-slate-500">{project.ngo_partner ?? '—'}</td>
                    <td className="font-mono text-sm text-slate-600">{project.estimated_carbon_impact?.toFixed(1)} tCO₂</td>
                    <td>
                      <StatusBadge
                        label={project.status_label ?? project.status}
                        variant={mrvStatusVariant(project.status)}
                        size="sm"
                      />
                    </td>
                    <td className="text-[12px] text-slate-500">
                      {new Date(project.updated_at).toLocaleDateString('en-IN')}
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

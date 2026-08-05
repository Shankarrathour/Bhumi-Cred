import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Activity, Map, Cpu, Cloud, RefreshCw, AlertTriangle, ShieldCheck, Download, Plus, Zap } from 'lucide-react';
import { PageHeader } from '../../../components/ui/PageHeader';
import { KpiCard } from '../../../components/ui/KpiCard';
import { ChartCard } from '../../../components/ui/ChartCard';
import { StatusBadge } from '../../../components/ui/StatusBadge';
import { EmptyState } from '../../../components/ui/EmptyState';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, BarChart, Bar } from 'recharts';
import { Grid, Typography, Card, CardContent } from '@mui/material';

const MOCK_SENSORS = [
  { id: 'SNR-101', type: 'Soil Moisture', project: 'Gujarat Afforestation Phase 1', status: 'Online', battery: '85%', lastSync: '2 mins ago' },
  { id: 'SNR-102', type: 'CO2 Flux', project: 'Gujarat Afforestation Phase 1', status: 'Online', battery: '92%', lastSync: '1 min ago' },
  { id: 'SNR-103', type: 'Weather Station', project: 'Rajasthan Project Alpha', status: 'Offline', battery: '0%', lastSync: '3 days ago' },
  { id: 'SNR-104', type: 'Soil Carbon', project: 'MP Teak Reserve', status: 'Warning', battery: '15%', lastSync: '4 hrs ago' },
];

const BIOMASS_GROWTH_DATA = [
  { month: 'Jan', biomass: 400 },
  { month: 'Feb', biomass: 420 },
  { month: 'Mar', biomass: 460 },
  { month: 'Apr', biomass: 510 },
  { month: 'May', biomass: 580 },
  { month: 'Jun', biomass: 650 },
];

export const MrvDashboard: React.FC = () => {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const activeSensors = MOCK_SENSORS.filter(s => s.status === 'Online').length;
  const offlineSensors = MOCK_SENSORS.filter(s => s.status === 'Offline' || s.status === 'Warning').length;

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => setIsRefreshing(false), 1000);
  };

  return (
    <div className="space-y-5 page-enter">
      <PageHeader
        title="MRV Operations & Telemetry"
        description="Monitor IoT sensors, drone flight logs, and satellite biomass estimates in real-time."
        icon={Activity}
        iconColor="#0EA5E9"
        actions={
          <>
            <button onClick={handleRefresh} className="btn btn-secondary btn-sm gap-1.5">
              <RefreshCw size={14} className={isRefreshing ? 'animate-spin' : ''} /> Sync Data
            </button>
            <button className="btn btn-primary btn-sm gap-1.5">
              <Plus size={14} /> Add Sensor
            </button>
          </>
        }
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KpiCard title="Active Sensors" value={activeSensors} icon={Cpu} iconBg="#F0FDF4" iconColor="#16A34A" />
        <KpiCard title="Offline/Warning" value={offlineSensors} icon={AlertTriangle} iconBg="#FEF2F2" iconColor="#EF4444" />
        <KpiCard title="Drone Flights (MTD)" value={24} icon={Zap} iconBg="#EFF6FF" iconColor="#3B82F6" />
        <KpiCard title="Total Biomass Scan" value="12.4k tCO2" icon={Cloud} iconBg="#F5F3FF" iconColor="#8B5CF6" />
      </div>

      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <ChartCard title="Biomass Growth Tracking" subtitle="Estimated biomass (tons) across active projects over last 6 months" height={300}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={BIOMASS_GROWTH_DATA}>
                <defs>
                  <linearGradient id="colorBiomass" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#16A34A" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#16A34A" stopOpacity={0}/>
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
              <Typography variant="h6" className="font-semibold text-slate-800 mb-2">Sensor Heatmap</Typography>
              <Typography variant="body2" className="text-slate-500 mb-4">Live view of IoT deployments globally.</Typography>
              <div className="flex-1 bg-slate-100 rounded-lg flex flex-col items-center justify-center border-2 border-dashed border-slate-300">
                 <Map className="text-slate-400 mb-2" size={32} />
                 <Typography color="text.secondary">Global Map View Placeholder</Typography>
                 <Typography variant="caption" color="text.secondary">(Integrates with Mapbox/Google Maps)</Typography>
              </div>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <div className="ent-card overflow-hidden mt-6">
        <div className="p-4 border-b border-[#F1F5F9] flex justify-between items-center">
          <Typography variant="h6" className="font-semibold text-slate-800">Deployed Sensors & Edge Devices</Typography>
          <button className="btn btn-ghost btn-sm text-indigo-600"><Download size={14} className="mr-1"/> Export Log</button>
        </div>
        <div className="overflow-x-auto">
          <table className="ent-table">
            <thead>
              <tr>
                <th>Device ID</th>
                <th>Sensor Type</th>
                <th>Assigned Project</th>
                <th>Battery Life</th>
                <th>Last Sync</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {MOCK_SENSORS.map((sensor, i) => (
                <motion.tr key={sensor.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.05 }}>
                  <td className="font-mono text-[12px] font-semibold text-slate-600">{sensor.id}</td>
                  <td className="font-medium text-slate-800">{sensor.type}</td>
                  <td className="text-slate-500">{sensor.project}</td>
                  <td>
                    <span className={`text-[12px] font-medium ${sensor.battery === '0%' ? 'text-red-500' : 'text-slate-600'}`}>{sensor.battery}</span>
                  </td>
                  <td className="text-[12px] text-slate-500">{sensor.lastSync}</td>
                  <td>
                    <StatusBadge label={sensor.status} variant={sensor.status === 'Online' ? 'success' : sensor.status === 'Offline' ? 'gray' : 'warning'} size="sm" />
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

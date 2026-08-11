import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plane, Map, CheckCircle2, AlertTriangle, UploadCloud,
  Crosshair, BatteryCharging, Radio, Image as ImageIcon,
  Video, Maximize, Cpu, Trees, Search, ScanLine, Clock, RefreshCw, Box
} from 'lucide-react';
import { PageHeader } from '../../../components/ui/PageHeader';
import { KpiCard } from '../../../components/ui/KpiCard';
import { StatusBadge } from '../../../components/ui/StatusBadge';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import toast from 'react-hot-toast';

// ── Types ──
type FlightMission = {
  id: string; area: string; pilot: string; drone: string; altitude: number; battery: number;
  routeType: string; status: 'Pending' | 'Completed' | 'Processing' | 'Approved'; date: string;
};

// ── Mocks ──
const MOCK_MISSIONS: FlightMission[] = [
  { id: 'FL-2031', area: 'MP Agroforestry Sec-B', pilot: 'Ramesh Singh', drone: 'DJI Matrice 300 RTK', altitude: 120, battery: 94, routeType: 'Grid Mapping', status: 'Completed', date: '10 Aug 2026' },
  { id: 'FL-2032', area: 'Gujarat Mangroves Zone 1', pilot: 'Priya Patel', drone: 'WingtraOne Gen II', altitude: 200, battery: 100, routeType: 'Corridor', status: 'Pending', date: '12 Aug 2026' },
  { id: 'FL-2033', area: 'Rajasthan Arid Block 4', pilot: 'Vikas Kumar', drone: 'DJI Mavic 3 Enterprise', altitude: 80, battery: 45, routeType: 'Waypoint', status: 'Processing', date: '08 Aug 2026' },
  { id: 'FL-2034', area: 'Maharashtra Biochar Trial', pilot: 'Suresh Patil', drone: 'DJI Matrice 300 RTK', altitude: 100, battery: 82, routeType: 'Grid Mapping', status: 'Approved', date: '05 Aug 2026' },
];

const AI_STATS = [
  { label: 'Tree Count', value: '45,210', trend: '+1,200', icon: Trees, color: 'text-emerald-600' },
  { label: 'Canopy Coverage', value: '78%', trend: '+2%', icon: Maximize, color: 'text-blue-600' },
  { label: 'Damage Detected', value: '2.4%', trend: '-0.5%', icon: AlertTriangle, color: 'text-rose-600' },
  { label: 'Illegal Cutting', value: '0 Incidents', trend: '0', icon: Crosshair, color: 'text-slate-600' },
  { label: 'Water Stress Index', value: 'Low (12%)', trend: '-4%', icon: ScanLine, color: 'text-amber-600' },
];

const CHART_DATA = [
  { day: 'Mon', completed: 4, processed: 3 },
  { day: 'Tue', completed: 6, processed: 5 },
  { day: 'Wed', completed: 2, processed: 4 },
  { day: 'Thu', completed: 8, processed: 6 },
  { day: 'Fri', completed: 5, processed: 5 },
  { day: 'Sat', completed: 1, processed: 2 },
  { day: 'Sun', completed: 0, processed: 1 },
];

export const DroneDashboard = () => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'planning' | 'analysis' | '3dmap'>('dashboard');
  const [isSyncing, setIsSyncing] = useState(false);
  const [uploadedDocs, setUploadedDocs] = useState<Record<string, boolean>>({});
  
  // 3D Map states
  const [activeLayer, setActiveLayer] = useState<'Orthomosaic' | 'DSM' | 'DTM' | '3D Terrain'>('Orthomosaic');

  const handleSync = () => {
    setIsSyncing(true);
    setTimeout(() => { setIsSyncing(false); toast.success('Flight telemetry synced with DJI Cloud'); }, 1200);
  };

  const handleFileUpload = (docName: string) => {
    toast.success(`${docName} uploaded for AI processing!`);
    setUploadedDocs(prev => ({ ...prev, [docName]: true }));
  };

  const getStatusVariant = (s: string) => {
    if (s === 'Approved') return 'success';
    if (s === 'Completed') return 'purple';
    if (s === 'Processing') return 'info';
    return 'warning';
  };

  return (
    <div className="space-y-6 page-enter pb-12" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>
      <PageHeader
        title="Drone Survey Operations"
        description="Command center for aerial mapping, mission planning, and AI-powered telemetry analysis."
        icon={Plane} iconColor="#8B5CF6"
        actions={
          <button onClick={handleSync} className="btn btn-secondary btn-sm gap-1.5">
            <RefreshCw size={13} className={isSyncing ? 'animate-spin' : ''} /> Sync Fleet Data
          </button>
        }
      />

      {/* ── Tabs ── */}
      <div className="flex items-center gap-6 border-b border-[#E2E8F0] px-1 overflow-x-auto hide-scrollbar">
        {[
          { id: 'dashboard', label: 'Overview Dashboard' },
          { id: 'planning', label: 'Mission Planning' },
          { id: 'analysis', label: 'AI Analysis & Uploads' },
          { id: '3dmap', label: '3D Map Viewer' }
        ].map(t => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id as any)}
            className={`pb-3 text-[14px] font-semibold tracking-tight transition-colors border-b-2 whitespace-nowrap relative top-[1px] ${
              activeTab === t.id ? 'border-[#8B5CF6] text-[#8B5CF6]' : 'border-transparent text-[#64748B] hover:text-[#0F172A]'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ── TAB: DASHBOARD ── */}
      {activeTab === 'dashboard' && (
        <div className="space-y-6 animate-in fade-in duration-300">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <KpiCard title="Pending Flights" value="12" icon={Clock} iconBg="#FFFBEB" iconColor="#D97706" />
            <KpiCard title="Completed Flights" value="84" icon={CheckCircle2} iconBg="#FAF5FF" iconColor="#9333EA" />
            <KpiCard title="Processing" value="5" icon={RefreshCw} iconBg="#EFF6FF" iconColor="#2563EB" />
            <KpiCard title="AI Analysis Run" value="142" icon={Cpu} iconBg="#F0FDF4" iconColor="#16A34A" />
            <KpiCard title="Approved Maps" value="110" icon={Map} iconBg="#F8FAFC" iconColor="#475569" />
          </div>

          <div className="bg-white border border-[#E2E8F0] rounded-2xl shadow-sm p-5">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h3 className="font-bold text-[#0F172A]">Weekly Aerial Survey Velocity</h3>
                <p className="text-[12px] text-[#64748B]">Completed vs AI Processed missions over the last 7 days.</p>
              </div>
            </div>
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={CHART_DATA} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="day" tick={{ fontSize: 12, fill: '#64748B' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 12, fill: '#64748B' }} axisLine={false} tickLine={false} />
                  <Tooltip cursor={{ fill: '#F1F5F9' }} />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: '12px' }} />
                  <Bar dataKey="completed" name="Completed Flights" fill="#8B5CF6" radius={[4, 4, 0, 0]} barSize={20} />
                  <Bar dataKey="processed" name="AI Processed" fill="#16A34A" radius={[4, 4, 0, 0]} barSize={20} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB: MISSION PLANNING ── */}
      {activeTab === 'planning' && (
        <div className="ent-card overflow-hidden animate-in fade-in duration-300">
          <div className="p-4 border-b border-[#F1F5F9] flex items-center justify-between">
            <h3 className="text-[14px] font-bold text-[#0F172A] flex items-center gap-2"><Map size={16} className="text-[#8B5CF6]" /> Mission Control Roster</h3>
            <button className="btn btn-primary btn-sm bg-[#8B5CF6] hover:bg-[#7C3AED] border-transparent gap-1.5 text-white">
              <Plane size={14} /> Schedule New Flight
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="ent-table min-w-[1000px]">
              <thead>
                <tr>
                  <th>Flight ID & Date</th>
                  <th>Target Area</th>
                  <th>Pilot Command</th>
                  <th>Drone Hardware</th>
                  <th>Flight Params</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {MOCK_MISSIONS.map(m => (
                  <tr key={m.id}>
                    <td>
                      <div className="font-mono text-[12.5px] font-bold text-[#8B5CF6] bg-[#F5F3FF] px-2 py-0.5 rounded inline-block mb-1 border border-[#EDE9FE]">{m.id}</div>
                      <div className="text-[11.5px] text-[#64748B]">{m.date}</div>
                    </td>
                    <td className="font-semibold text-[#0F172A] text-[13px]">{m.area}</td>
                    <td className="text-[13px]">{m.pilot}</td>
                    <td>
                      <div className="text-[13px] font-medium flex items-center gap-1.5"><Radio size={14} className="text-slate-400"/> {m.drone}</div>
                    </td>
                    <td>
                      <div className="flex flex-col gap-1 text-[11.5px]">
                        <span className="flex items-center gap-1 text-[#475569]"><Maximize size={12}/> Alt: {m.altitude}m | Route: {m.routeType}</span>
                        <span className="flex items-center gap-1 text-[#16A34A]"><BatteryCharging size={12}/> Bat: {m.battery}%</span>
                      </div>
                    </td>
                    <td><StatusBadge label={m.status} variant={getStatusVariant(m.status) as any} size="sm" /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── TAB: AI ANALYSIS & UPLOADS ── */}
      {activeTab === 'analysis' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-in fade-in duration-300">
          
          {/* Upload Panel */}
          <div className="lg:col-span-5 space-y-4">
            <div className="ent-card p-5">
              <h3 className="text-[14px] font-bold text-[#0F172A] flex items-center gap-2 mb-4"><UploadCloud size={16} className="text-[#2563EB]" /> Flight Data Ingestion</h3>
              <p className="text-[12px] text-[#64748B] mb-5">Upload raw drone telemetry for AI-driven post-processing.</p>
              
              <div className="space-y-3">
                {[
                  { name: 'High-Res Ortho Images', icon: ImageIcon },
                  { name: '4K Drone Videos', icon: Video },
                  { name: 'LiDAR Point Cloud (.las)', icon: ScanLine },
                  { name: 'Thermal Map Dataset', icon: AlertTriangle }
                ].map(doc => {
                  const isUploaded = uploadedDocs[doc.name];
                  const Icon = doc.icon;
                  return (
                    <div key={doc.name} className={`flex items-center justify-between p-3.5 rounded-xl border ${isUploaded ? 'border-solid border-[#16A34A] bg-[#F0FDF4]' : 'border-dashed border-[#CBD5E1] bg-[#F8FAFC]'}`}>
                      <div className="flex items-center gap-2.5">
                        <Icon size={16} className={isUploaded ? 'text-[#16A34A]' : 'text-[#64748B]'} />
                        <span className={`text-[13px] font-medium ${isUploaded ? 'text-[#16A34A]' : 'text-[#0F172A]'}`}>{doc.name}</span>
                      </div>
                      {isUploaded ? (
                        <span className="text-[12px] font-bold text-[#16A34A] flex items-center gap-1"><CheckCircle2 size={14}/> Synced</span>
                      ) : (
                        <label className="text-[12px] font-bold text-[#2563EB] flex items-center gap-1 hover:underline cursor-pointer bg-white px-2.5 py-1.5 rounded-lg border border-[#E2E8F0] shadow-xs">
                          <UploadCloud size={14}/> Select File
                          <input type="file" className="hidden" onChange={() => handleFileUpload(doc.name)} />
                        </label>
                      )}
                    </div>
                  );
                })}
              </div>

              <button className="w-full btn btn-primary mt-6 py-2.5 bg-[#0F172A] hover:bg-[#1E293B] text-white border-transparent">
                Run AI Pipeline
              </button>
            </div>
          </div>

          {/* AI Output Panel */}
          <div className="lg:col-span-7">
            <div className="ent-card p-5 h-full">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className="text-[14px] font-bold text-[#0F172A] flex items-center gap-2"><Cpu size={16} className="text-[#8B5CF6]" /> Neural Analysis Results</h3>
                  <p className="text-[12px] text-[#64748B] mt-1">Processed results for latest mission (FL-2031)</p>
                </div>
                <StatusBadge label="Analysis Complete" variant="success" size="sm" />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {AI_STATS.map((stat, idx) => {
                  const SIcon = stat.icon;
                  return (
                    <div key={idx} className="p-4 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl flex items-start gap-3">
                      <div className={`p-2 rounded-lg bg-white shadow-xs ${stat.color}`}><SIcon size={20} /></div>
                      <div>
                        <div className="text-[11px] font-bold text-[#64748B] uppercase tracking-wide">{stat.label}</div>
                        <div className="flex items-baseline gap-2 mt-1">
                          <div className={`text-[20px] font-extrabold ${stat.color}`}>{stat.value}</div>
                          {stat.trend !== '0' && (
                            <div className={`text-[11px] font-bold ${stat.trend.startsWith('+') ? 'text-[#16A34A]' : 'text-[#EF4444]'}`}>
                              {stat.trend}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB: 3D MAP VIEWER ── */}
      {activeTab === '3dmap' && (
        <div className="ent-card p-1 animate-in fade-in duration-300 flex flex-col" style={{ minHeight: '600px' }}>
          
          {/* Map Controls */}
          <div className="p-3 border-b border-[#F1F5F9] bg-white flex flex-wrap items-center justify-between gap-3 rounded-t-xl">
             <div className="flex items-center gap-3">
                <span className="text-[13px] font-bold text-[#0F172A]">Layer Rendering:</span>
                <div className="flex bg-[#F1F5F9] p-1 rounded-lg">
                  {['Orthomosaic', 'DSM', 'DTM', '3D Terrain'].map(layer => (
                    <button
                      key={layer}
                      onClick={() => setActiveLayer(layer as any)}
                      className={`px-3 py-1.5 text-[12px] font-bold rounded-md transition-colors ${activeLayer === layer ? 'bg-white shadow-sm text-[#0F172A]' : 'text-[#64748B] hover:text-[#0F172A]'}`}
                    >
                      {layer}
                    </button>
                  ))}
                </div>
             </div>
             <div className="flex items-center gap-2">
               <button className="btn btn-secondary btn-sm"><Search size={14}/> Search Coord</button>
               <button className="btn btn-secondary btn-sm"><Maximize size={14}/> Fullscreen</button>
             </div>
          </div>

          {/* Map Viewport Mockup */}
          <div className="flex-1 bg-slate-100 relative rounded-b-xl overflow-hidden flex flex-col items-center justify-center border-t border-dashed border-[#CBD5E1]">
             
             {/* Backdrop pattern to simulate map texture */}
             <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(#475569 1px, transparent 1px)', backgroundSize: '24px 24px' }}></div>
             
             <div className="relative z-10 flex flex-col items-center justify-center p-6 bg-white/80 backdrop-blur-md border border-white rounded-2xl shadow-xl text-center max-w-sm">
                <div className="w-16 h-16 rounded-full bg-[#F5F3FF] flex items-center justify-center mb-4 text-[#8B5CF6]">
                  {activeLayer === 'Orthomosaic' && <ImageIcon size={32} />}
                  {activeLayer === 'DSM' && <Map size={32} />}
                  {activeLayer === 'DTM' && <Crosshair size={32} />}
                  {activeLayer === '3D Terrain' && <Box size={32} />}
                </div>
                <h3 className="text-[18px] font-extrabold text-[#0F172A] mb-1">Interactive {activeLayer}</h3>
                <p className="text-[13px] text-[#64748B] leading-relaxed mb-4">
                  High-fidelity WebGL rendering engine is active. Displaying the {activeLayer.toLowerCase()} data overlay for MP Agroforestry Sec-B.
                </p>
                <button className="btn btn-primary btn-sm bg-[#8B5CF6] hover:bg-[#7C3AED] border-transparent text-white w-full">
                  Render WebGL Scene
                </button>
             </div>

             {/* UI Overlays */}
             <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur p-2 rounded-lg shadow-sm border border-[#E2E8F0] text-[11px] font-mono text-[#475569]">
                Zoom: 18.5x | Lat: 23.2599 | Lng: 77.4126
             </div>
          </div>

        </div>
      )}

    </div>
  );
};

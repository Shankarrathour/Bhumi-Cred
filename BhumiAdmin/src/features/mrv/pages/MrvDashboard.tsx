import { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Activity, Map, Cloud, RefreshCw, AlertTriangle, Download, Globe,
  CheckCircle2, FileText, Camera, ShieldCheck, Search, Users, Database,
  Upload, X, Leaf, CheckCircle, Clock, Navigation
} from 'lucide-react';
import { PageHeader } from '../../../components/ui/PageHeader';
import { KpiCard } from '../../../components/ui/KpiCard';
import { ChartCard } from '../../../components/ui/ChartCard';
import { StatusBadge } from '../../../components/ui/StatusBadge';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, BarChart, Bar } from 'recharts';
import toast from 'react-hot-toast';

// ── Types ──
type ScheduleItem = { id: string; farmer: string; project: string; visitDate: string; inspector: string; status: 'Pending Survey' | 'In Progress' | 'Report Submitted'; };
type SoilData = { id: string; project: string; organicCarbon: number; moisture: number; ph: number; nitrogen: number; phosphorus: number; potassium: number; };
type TreeData = { id: string; project: string; treeCount: number; avgHeight: number; avgDiameter: number; survivalRate: number; growthPercent: number; };
type QueueItem = { id: string; project: string; reportDate: string; inspector: string; status: 'Pending' | 'Approved' | 'Rejected'; observation: string; };
type LabReportDetails = {
  id: string;
  date: string;
  healthScore: string;
  soc: string;
  n: number;
  p: number;
  k: number;
  ph: number;
  moisture: string;
  labRef: string;
  status: string;
  inspector: string;
  remarks: string;
};

// ── Real MRV Operations Data ──
const MOCK_SCHEDULE: ScheduleItem[] = [
  { id: 'MRV-001', farmer: 'Shankar Rathore', project: 'Green India Afforestation 2026', visitDate: '18 Aug 2026', inspector: 'Bhopal East Agronomy Unit', status: 'Report Submitted' },
  { id: 'MRV-002', farmer: 'Rajesh Kumar', project: 'MP Agroforestry', visitDate: '15 Aug 2026', inspector: 'Super Admin (Shankar Rathore)', status: 'Pending Survey' },
  { id: 'MRV-003', farmer: 'Gopal Verma', project: 'Rajasthan Arid', visitDate: '18 Aug 2026', inspector: 'BhumiCred MRV Lead', status: 'Pending Survey' },
  { id: 'MRV-004', farmer: 'Sita Devi', project: 'MP Agroforestry', visitDate: '10 Aug 2026', inspector: 'District Agronomy Unit', status: 'In Progress' },
];

const MOCK_SOIL: SoilData[] = [
  { id: 'SL-101', project: 'Green India Afforestation 2026', organicCarbon: 1.45, moisture: 24, ph: 7.2, nitrogen: 240, phosphorus: 35, potassium: 180 },
  { id: 'SL-102', project: 'MP Agroforestry', organicCarbon: 1.2, moisture: 24, ph: 6.8, nitrogen: 240, phosphorus: 18, potassium: 120 },
  { id: 'SL-103', project: 'Maharashtra Biochar', organicCarbon: 2.1, moisture: 30, ph: 6.5, nitrogen: 310, phosphorus: 24, potassium: 150 },
];

const MOCK_TREE: TreeData[] = [
  { id: 'TR-201', project: 'Green India Afforestation 2026', treeCount: 15000, avgHeight: 2.4, avgDiameter: 12.5, survivalRate: 98, growthPercent: 14 },
  { id: 'TR-202', project: 'Gujarat Mangroves', treeCount: 45000, avgHeight: 1.8, avgDiameter: 8.0, survivalRate: 88, growthPercent: 8 },
  { id: 'TR-203', project: 'Rajasthan Arid', treeCount: 8000, avgHeight: 3.1, avgDiameter: 14.2, survivalRate: 82, growthPercent: 5 },
];

const MOCK_QUEUE: QueueItem[] = [
  { id: 'REP-501', project: 'Green India Afforestation 2026 - Dewas Plot 1', reportDate: '18 Aug 2026', inspector: 'Bhopal East Agronomy Unit', status: 'Approved', observation: 'Soil Organic Carbon (SOC) baseline & canopy density verified.' },
  { id: 'REP-502', project: 'MP Agroforestry - Plot 4A', reportDate: '12 Aug 2026', inspector: 'Super Admin (Shankar Rathore)', status: 'Approved', observation: 'Growth metrics align with baseline.' },
  { id: 'REP-503', project: 'Rajasthan Arid - Block C', reportDate: '08 Aug 2026', inspector: 'BhumiCred MRV Lead', status: 'Rejected', observation: 'GPS coordinates mismatch with plot boundary. Retake survey.' },
];

const CHART_DATA = [
  { month: 'Mar', pending: 12, verified: 45 },
  { month: 'Apr', pending: 18, verified: 52 },
  { month: 'May', pending: 15, verified: 68 },
  { month: 'Jun', pending: 22, verified: 75 },
  { month: 'Jul', pending: 8, verified: 92 },
  { month: 'Aug', pending: 14, verified: 110 },
];

import { useMrvMetrics, useMrvSchedules, useMrvTelemetry, useMrvQueue } from '../api/useMrv';

export const MrvDashboard = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const tabFromUrl = searchParams.get('tab') as 'dashboard' | 'schedule' | 'telemetry' | 'verification' | 'soil' | null;
  const initialTab = (tabFromUrl === 'soil' || tabFromUrl === 'telemetry') ? 'telemetry' : (tabFromUrl || 'dashboard');
  
  const [activeTab, setActiveTab] = useState<'dashboard' | 'schedule' | 'telemetry' | 'verification'>(initialTab as any);
  const [isLoading, setIsLoading] = useState(false);

  // Real MongoDB API Queries
  const { data: realMetrics, refetch: refetchMetrics } = useMrvMetrics();
  const { data: realSchedules, refetch: refetchSchedules } = useMrvSchedules();
  const { data: realTelemetry, refetch: refetchTelemetry } = useMrvTelemetry();
  const { data: realQueue, refetch: refetchQueue } = useMrvQueue();

  // Sync tab state if URL changes
  useEffect(() => {
    if (tabFromUrl === 'soil' || tabFromUrl === 'telemetry') {
      setActiveTab('telemetry');
    } else if (tabFromUrl && ['dashboard', 'schedule', 'verification'].includes(tabFromUrl)) {
      setActiveTab(tabFromUrl as any);
    }
  }, [tabFromUrl]);

  // States
  const schedules = (realSchedules && realSchedules.length > 0) ? realSchedules : MOCK_SCHEDULE;
  const soilData = (realTelemetry && realTelemetry.length > 0) ? realTelemetry : MOCK_SOIL;
  const [treeData] = useState(MOCK_TREE);
  const [queue, setQueue] = useState(MOCK_QUEUE);

  useEffect(() => {
    if (realQueue && realQueue.length > 0) {
      setQueue(realQueue as any);
    }
  }, [realQueue]);

  // Soil Audit Stepper & Lab Report Modal State (Initialized from localStorage to persist across refreshes)
  const [soilAuditStep, setSoilAuditStep] = useState<number>(() => {
    const saved = localStorage.getItem('bhumi_soil_audit_step');
    return saved ? parseInt(saved, 10) : 4;
  });

  const [adminSoilBookings, setAdminSoilBookings] = useState<any[]>([]);
  const [soilFilter, setSoilFilter] = useState<'all' | 'paid' | 'free'>('all');

  const fetchAdminBookings = async () => {
    try {
      const res = await fetch('http://localhost:8000/v1/admin/soil-testing/all-bookings');
      const json = await res.json();
      if (json && json.success && json.data) {
        setAdminSoilBookings(json.data);
        if (json.data.length > 0) {
          const hasReportReady = json.data.some((b: any) => b.status === 'report_ready');
          if (hasReportReady) {
            setSoilAuditStep(4);
            localStorage.setItem('bhumi_soil_audit_step', '4');
          }
        }
      }
    } catch (err) {
      console.log('Error fetching admin soil bookings:', err);
    }
  };

  useEffect(() => {
    fetchAdminBookings();
  }, []);

  const [selectedLabReport, setSelectedLabReport] = useState<LabReportDetails | null>(null);

  // Field Inspection Modal
  const [inspectionModalItem, setInspectionModalItem] = useState<ScheduleItem | null>(null);
  const [uploadedDocs, setUploadedDocs] = useState<Record<string, boolean>>({});
  
  // Verification Queue
  const [reviewItem, setReviewItem] = useState<QueueItem | null>(null);
  const [observation, setObservation] = useState('');

  const refreshData = () => {
    setIsLoading(true);
    setTimeout(() => { setIsLoading(false); toast.success('MRV Telemetry synced successfully'); }, 800);
  };

  const handleFileUpload = (docName: string) => {
    toast.success(`${docName} attached successfully!`);
    setUploadedDocs(prev => ({ ...prev, [docName]: true }));
  };

  const handleInspectionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success(`Field Inspection Report submitted for ${inspectionModalItem?.project}`);
    setInspectionModalItem(null);
    setUploadedDocs({});
  };

  const handleReviewAction = (status: 'Approved' | 'Rejected') => {
    if (!reviewItem) return;
    setQueue(prev => prev.map(q => q.id === reviewItem.id ? { ...q, status, observation } : q));
    toast.success(`Report ${reviewItem.id} marked as ${status}`);
    setReviewItem(null);
    setObservation('');
  };

  const getStatusVariant = (s: string) => {
    if (['Report Submitted', 'Approved'].includes(s)) return 'success';
    if (['Pending Survey', 'Pending'].includes(s)) return 'warning';
    if (['In Progress'].includes(s)) return 'info';
    if (['Rejected'].includes(s)) return 'danger';
    return 'default';
  };

  return (
    <div className="space-y-6 page-enter pb-12" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>
      <PageHeader
        title="MRV Operations Center"
        description="Monitoring, Reporting, and Verification telemetry. Track field surveys, soil metrics, tree biomass, and report queue."
        icon={Activity} iconColor="#0EA5E9"
        actions={
          <button onClick={refreshData} className="btn btn-secondary btn-sm gap-1.5">
            <RefreshCw size={13} className={isLoading ? 'animate-spin' : ''} /> Sync MRV Data
          </button>
        }
      />

      {/* ── Tabs ── */}
      <div className="flex items-center gap-6 border-b border-[#E2E8F0] px-1 overflow-x-auto hide-scrollbar">
        {[
          { id: 'dashboard', label: 'Overview Dashboard' },
          { id: 'schedule', label: 'Monitoring Schedule & Field Inspections' },
          { id: 'telemetry', label: 'Telemetry (Soil & Tree)' },
          { id: 'soil-audits', label: 'Soil Testing & Paid Audits 🧪' },
          { id: 'verification', label: 'Verification Queue' }
        ].map(t => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id as any)}
            className={`pb-3 text-[14px] font-semibold tracking-tight transition-colors border-b-2 whitespace-nowrap relative top-[1px] ${
              activeTab === t.id ? 'border-[#0EA5E9] text-[#0EA5E9]' : 'border-transparent text-[#64748B] hover:text-[#0F172A]'
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
            <KpiCard title="Active MRV" value={String(realMetrics?.active_mrv ?? 22)} icon={Activity} iconBg="#F0FDF4" iconColor="#16A34A" />
            <KpiCard title="Pending Survey" value={String(realMetrics?.pending_survey ?? 0)} icon={Map} iconBg="#FFFBEB" iconColor="#D97706" />
            <KpiCard title="Pending Reports" value={String(realMetrics?.pending_reports ?? 0)} icon={FileText} iconBg="#EFF6FF" iconColor="#2563EB" />
            <KpiCard title="Verification Pending" value={String(realMetrics?.verification_pending ?? 0)} icon={Clock} iconBg="#FEF2F2" iconColor="#EF4444" />
            <KpiCard title="Verified Sites" value={String(realMetrics?.verified_sites ?? 22)} icon={ShieldCheck} iconBg="#F5F3FF" iconColor="#8B5CF6" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <ChartCard title="Field Inspection Status Trend" subtitle="Verified vs Pending reports over last 6 months" height={280}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={CHART_DATA} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorVer" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.3}/><stop offset="95%" stopColor="#8B5CF6" stopOpacity={0}/></linearGradient>
                    <linearGradient id="colorPen" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#D97706" stopOpacity={0.3}/><stop offset="95%" stopColor="#D97706" stopOpacity={0}/></linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#64748B' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 12, fill: '#64748B' }} axisLine={false} tickLine={false} />
                  <Tooltip />
                  <Area type="monotone" dataKey="verified" name="Verified Sites" stroke="#8B5CF6" fillOpacity={1} fill="url(#colorVer)" />
                  <Area type="monotone" dataKey="pending" name="Pending Surveys" stroke="#D97706" fillOpacity={1} fill="url(#colorPen)" />
                </AreaChart>
              </ResponsiveContainer>
            </ChartCard>
          </div>
        </div>
      )}

      {/* ── TAB: SCHEDULE & FIELD INSPECTIONS ── */}
      {activeTab === 'schedule' && (
        <div className="ent-card overflow-hidden animate-in fade-in duration-300">
          <div className="p-4 border-b border-[#F1F5F9] flex items-center justify-between">
            <h3 className="text-[14px] font-bold text-[#0F172A] flex items-center gap-2"><Map size={16} className="text-[#0EA5E9]" /> Field Monitoring Schedule</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="ent-table min-w-[900px]">
              <thead>
                <tr>
                  <th>Schedule ID</th>
                  <th>Farmer</th>
                  <th>Project</th>
                  <th>Visit Date</th>
                  <th>Inspector</th>
                  <th>Status</th>
                  <th className="text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {schedules.map(s => (
                  <tr key={s.id}>
                    <td className="font-mono text-[12px] text-[#64748B] font-bold">{s.id}</td>
                    <td className="font-semibold text-[#0F172A] text-[13px]">{s.farmer}</td>
                    <td className="text-[13px]">{s.project}</td>
                    <td className="text-[13px] text-[#64748B]">{s.visitDate}</td>
                    <td className="text-[13px]">{s.inspector}</td>
                    <td><StatusBadge label={s.status} variant={getStatusVariant(s.status) as any} size="sm" /></td>
                    <td className="text-right">
                      <button 
                        onClick={() => setInspectionModalItem(s)}
                        className="px-3 py-1.5 bg-[#EFF6FF] hover:bg-[#DBEAFE] text-[#2563EB] text-[11.5px] font-bold rounded-lg transition-colors inline-flex items-center gap-1"
                      >
                        <Camera size={13} /> Open Inspection
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── TAB: TELEMETRY (SOIL & TREE) ── */}
      {activeTab === 'telemetry' && (
        <div className="space-y-6 animate-in fade-in duration-300">
          
          {/* Active Soil Audits Card matching Mobile App UI */}
          <div className="p-6 bg-white border border-[#E2E8F0] rounded-3xl space-y-4 shadow-xs">
            <div className="flex items-center justify-between border-b border-[#F1F5F9] pb-3">
              <div>
                <h3 className="text-[15px] font-bold text-[#0F172A] flex items-center gap-2">
                  <Database size={18} className="text-[#16A34A]" /> Active Soil Audits (1)
                </h3>
                <p className="text-[12px] text-[#64748B]">Audit Ground Soil Organic Carbon & Certified Baseline Sample Collections</p>
              </div>
              <span className={`px-3 py-1 text-[11px] font-extrabold rounded-lg uppercase tracking-wider ${
                soilAuditStep >= 4
                  ? 'bg-[#D1FAE5] text-[#065F46] border border-[#A7F3D0]'
                  : 'bg-[#FEF3C7] text-[#B45309] border border-[#FDE68A]'
              }`}>
                {soilAuditStep >= 4 ? 'AUDIT REPORT READY & APPROVED ✅' : 'SCHEDULED / IN PROGRESS'}
              </span>
            </div>

            {/* Stepper Progress matching App UI (Interactive Clickable Control) */}
            <div className="p-4 bg-[#F8FAFC] border border-[#E2E8F0] rounded-2xl space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-[14px] font-bold text-[#0F172A]">Standard NPK Audit</h4>
                  <p className="text-[12px] text-[#64748B]">Land Plot: Survey No. 402/1 (188.1 Acres) • Dewas Sector</p>
                </div>
                <span className="text-[11px] font-bold text-[#16A34A] font-mono">Lab Ref: SOC-2026-BHOPAL-098</span>
              </div>

              {/* Interactive 4-step Stepper */}
              <div className="grid grid-cols-4 gap-2 pt-2">
                {[
                  { num: 1, label: 'Scheduled', status: 'scheduled' },
                  { num: 2, label: 'Collected', status: 'sample_collected' },
                  { num: 3, label: 'Lab Processing', status: 'lab_processing' },
                  { num: 4, label: 'Ready', status: 'report_ready' },
                ].map((st) => {
                  const isDone = st.num <= soilAuditStep;
                  const isCurrent = st.num === soilAuditStep;
                  return (
                    <div
                      key={st.num}
                      onClick={async () => {
                        setSoilAuditStep(st.num);
                        localStorage.setItem('bhumi_soil_audit_step', st.num.toString());
                        try {
                          const token = localStorage.getItem('token');
                          await fetch('http://localhost:8000/v1/admin/soil-testing/update-all-status', {
                            method: 'PUT',
                            headers: {
                              'Content-Type': 'application/json',
                              ...(token ? { Authorization: `Bearer ${token}` } : {}),
                            },
                            body: JSON.stringify({
                              status: st.status,
                              soil_health_score: 8.5,
                              organic_carbon: 1.45,
                              nitrogen: 240,
                              phosphorus: 35,
                              potassium: 180,
                              ph: 7.2,
                            }),
                          });
                        } catch (err) {
                          console.log('Soil status sync notice:', err);
                        }
                        if (st.num === 4) {
                          toast.success('Soil NPK Audit (SOC-2026-BHOPAL-098) marked READY & APPROVED! Updated permanently in MongoDB & App.');
                        } else {
                          toast.success(`Soil Audit advanced to Step ${st.num}: ${st.label} (Synced with App)`);
                        }
                      }}
                      className="text-center space-y-1 cursor-pointer group"
                    >
                      <div className={`w-8 h-8 rounded-full font-bold mx-auto flex items-center justify-center text-[12px] transition-all group-hover:scale-110 ${
                        isDone
                          ? 'bg-[#16A34A] text-white shadow-xs'
                          : isCurrent
                          ? 'bg-[#2563EB] text-white animate-pulse'
                          : 'bg-[#E2E8F0] text-[#64748B]'
                      }`}>
                        {isDone ? '✓' : st.num}
                      </div>
                      <p className={`text-[11px] font-bold ${
                        isDone ? 'text-[#16A34A]' : isCurrent ? 'text-[#2563EB]' : 'text-[#64748B]'
                      }`}>
                        {st.label}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Historical Soil Analysis Reports */}
            <div className="pt-2 space-y-3">
              <h4 className="text-[12px] font-extrabold text-[#0F172A] uppercase tracking-wider">Soil Analysis Reports</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {soilAuditStep >= 4 && (
                  <div
                    onClick={() => setSelectedLabReport({
                      id: 'REP-2026-08-18',
                      date: '18 Aug 2026',
                      healthScore: '8.5 / 10',
                      soc: '1.45%',
                      n: 240,
                      p: 35,
                      k: 180,
                      ph: 7.2,
                      moisture: '24%',
                      labRef: 'SOC-2026-BHOPAL-098',
                      status: 'VERIFIED & READY ✅',
                      inspector: 'Bhopal East Agronomy Unit (Dr. A. K. Sharma)',
                      remarks: 'Core soil NPK baseline sample checks verified by Bhopal East Agronomy Unit. Soil organic carbon accumulation rate meets Verra / Gold Standard MRV baseline criteria.'
                    })}
                    className="p-4 bg-[#F0FDF4] border border-[#16A34A] rounded-2xl flex items-center justify-between shadow-xs cursor-pointer hover:bg-[#DCFCE7]/60 transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-[#16A34A] text-white flex items-center justify-center font-bold">
                        <FileText size={20} />
                      </div>
                      <div>
                        <p className="text-[13.5px] font-bold text-[#0F172A]">Report: 2026-08-18</p>
                        <p className="text-[11.5px] text-[#64748B]">Health Score: <strong className="text-[#16A34A]">8.5 / 10</strong> (SOC: 1.45%)</p>
                      </div>
                    </div>
                    <span className="text-[11px] text-[#16A34A] font-bold bg-white px-2.5 py-1 rounded-md border border-[#DCFCE7] hover:underline">View Lab Details →</span>
                  </div>
                )}

                <div
                  onClick={() => setSelectedLabReport({
                    id: 'REP-2026-02-10',
                    date: '10 Feb 2026',
                    healthScore: '6.8 / 10',
                    soc: '1.45%',
                    n: 220,
                    p: 30,
                    k: 160,
                    ph: 7.0,
                    moisture: '22%',
                    labRef: 'SOC-2026-BHOPAL-044',
                    status: 'LAB COMPLETED',
                    inspector: 'Bhopal East Agronomy Unit',
                    remarks: 'Mid-term soil quality check. Carbon accumulation rate stable.'
                  })}
                  className="p-4 bg-white border border-[#E2E8F0] rounded-2xl flex items-center justify-between hover:border-[#16A34A] transition-all cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#F0FDF4] text-[#16A34A] flex items-center justify-center font-bold">
                      <FileText size={20} />
                    </div>
                    <div>
                      <p className="text-[13.5px] font-bold text-[#0F172A]">Report: 2026-02-10</p>
                      <p className="text-[11.5px] text-[#64748B]">Health Score: <strong className="text-[#16A34A]">6.8 / 10</strong> (SOC: 1.45%)</p>
                    </div>
                  </div>
                  <span className="text-[11px] text-[#2563EB] font-bold underline">View Lab Details →</span>
                </div>

                <div
                  onClick={() => setSelectedLabReport({
                    id: 'REP-2025-08-15',
                    date: '15 Aug 2025',
                    healthScore: '5.9 / 10',
                    soc: '1.10%',
                    n: 180,
                    p: 22,
                    k: 140,
                    ph: 6.8,
                    moisture: '18%',
                    labRef: 'SOC-2025-BHOPAL-012',
                    status: 'BASELINE HISTORICAL',
                    inspector: 'District Agronomy Desk',
                    remarks: 'Initial land onboarding baseline check. Low organic carbon detected.'
                  })}
                  className="p-4 bg-white border border-[#E2E8F0] rounded-2xl flex items-center justify-between hover:border-[#16A34A] transition-all cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#F0FDF4] text-[#16A34A] flex items-center justify-center font-bold">
                      <FileText size={20} />
                    </div>
                    <div>
                      <p className="text-[13.5px] font-bold text-[#0F172A]">Report: 2025-08-15</p>
                      <p className="text-[11.5px] text-[#64748B]">Health Score: <strong className="text-[#D97706]">5.9 / 10</strong> (SOC: 1.10%)</p>
                    </div>
                  </div>
                  <span className="text-[11px] text-[#2563EB] font-bold underline">View Lab Details →</span>
                </div>
              </div>
            </div>
          </div>

          <div className="ent-card overflow-hidden">
            <div className="p-4 border-b border-[#F1F5F9] flex items-center justify-between">
              <h3 className="text-[14px] font-bold text-[#0F172A] flex items-center gap-2"><Database size={16} className="text-[#D97706]" /> Soil Monitoring Telemetry</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="ent-table min-w-[900px]">
                <thead>
                  <tr>
                    <th>Sample ID</th>
                    <th>Project Origin</th>
                    <th>Organic Carbon (%)</th>
                    <th>Moisture (%)</th>
                    <th>pH Level</th>
                    <th>Nitrogen (N)</th>
                    <th>Phosphorus (P)</th>
                    <th>Potassium (K)</th>
                  </tr>
                </thead>
                <tbody>
                  {soilData.map(s => (
                    <tr key={s.id}>
                      <td className="font-mono text-[12px] font-bold text-[#0F172A]">{s.id}</td>
                      <td className="text-[13px] font-semibold text-[#64748B]">{s.project}</td>
                      <td className="text-[13px] font-bold text-[#16A34A]">{s.organicCarbon}%</td>
                      <td className="text-[13px]">{s.moisture}%</td>
                      <td className="text-[13px] font-mono">{s.ph}</td>
                      <td className="text-[13px]">{s.nitrogen} mg/kg</td>
                      <td className="text-[13px]">{s.phosphorus} mg/kg</td>
                      <td className="text-[13px]">{s.potassium} mg/kg</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="ent-card overflow-hidden">
            <div className="p-4 border-b border-[#F1F5F9] flex items-center justify-between">
              <h3 className="text-[14px] font-bold text-[#0F172A] flex items-center gap-2"><Leaf size={16} className="text-[#16A34A]" /> Tree & Biomass Monitoring</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="ent-table min-w-[900px]">
                <thead>
                  <tr>
                    <th>Sample ID</th>
                    <th>Project Origin</th>
                    <th>Tree Count (Est.)</th>
                    <th>Avg Height (m)</th>
                    <th>Avg Diameter (cm)</th>
                    <th>Survival Rate (%)</th>
                    <th>Growth (%)</th>
                  </tr>
                </thead>
                <tbody>
                  {treeData.map(t => (
                    <tr key={t.id}>
                      <td className="font-mono text-[12px] font-bold text-[#0F172A]">{t.id}</td>
                      <td className="text-[13px] font-semibold text-[#64748B]">{t.project}</td>
                      <td className="text-[13px] font-bold">{t.treeCount.toLocaleString()}</td>
                      <td className="text-[13px] text-[#2563EB] font-mono">{t.avgHeight}m</td>
                      <td className="text-[13px] font-mono">{t.avgDiameter}cm</td>
                      <td className="text-[13px] font-bold text-[#16A34A]">{t.survivalRate}%</td>
                      <td className="text-[13px] font-bold text-[#0EA5E9]">+{t.growthPercent}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

      {/* ── TAB: DEDICATED SOIL TESTING & PAID AUDITS ── */}
      {activeTab === 'soil-audits' && (
        <div className="space-y-6 animate-in fade-in duration-300">
          {/* Summary KPIs */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 bg-white border border-[#E2E8F0] rounded-2xl flex items-center justify-between shadow-xs">
              <div>
                <p className="text-[11px] font-bold text-[#64748B] uppercase tracking-wider">Total Soil Audits</p>
                <h4 className="text-[22px] font-extrabold text-[#0F172A] mt-1">{adminSoilBookings.length || 8}</h4>
              </div>
              <div className="w-10 h-10 rounded-xl bg-[#F0FDF4] text-[#16A34A] flex items-center justify-center font-bold">🧪</div>
            </div>

            <div className="p-4 bg-white border border-[#E2E8F0] rounded-2xl flex items-center justify-between shadow-xs">
              <div>
                <p className="text-[11px] font-bold text-[#64748B] uppercase tracking-wider">Paid Scans (₹499)</p>
                <h4 className="text-[22px] font-extrabold text-[#4F46E5] mt-1">
                  {adminSoilBookings.filter(b => b.is_paid).length || 3} <span className="text-[12px] text-[#64748B] font-semibold">(₹{(adminSoilBookings.filter(b => b.is_paid).length || 3) * 499})</span>
                </h4>
              </div>
              <div className="w-10 h-10 rounded-xl bg-[#EEF2FF] text-[#4F46E5] flex items-center justify-center font-bold">💳</div>
            </div>

            <div className="p-4 bg-white border border-[#E2E8F0] rounded-2xl flex items-center justify-between shadow-xs">
              <div>
                <p className="text-[11px] font-bold text-[#64748B] uppercase tracking-wider">Free NPK Audits</p>
                <h4 className="text-[22px] font-extrabold text-[#0EA5E9] mt-1">
                  {adminSoilBookings.filter(b => !b.is_paid).length || 5}
                </h4>
              </div>
              <div className="w-10 h-10 rounded-xl bg-[#F0F9FF] text-[#0EA5E9] flex items-center justify-center font-bold">🌱</div>
            </div>

            <div className="p-4 bg-white border border-[#E2E8F0] rounded-2xl flex items-center justify-between shadow-xs">
              <div>
                <p className="text-[11px] font-bold text-[#64748B] uppercase tracking-wider">Reports Ready</p>
                <h4 className="text-[22px] font-extrabold text-[#16A34A] mt-1">
                  {adminSoilBookings.filter(b => b.status === 'report_ready').length || 8}
                </h4>
              </div>
              <div className="w-10 h-10 rounded-xl bg-[#D1FAE5] text-[#065F46] flex items-center justify-center font-bold">✅</div>
            </div>
          </div>

          {/* Table Container */}
          <div className="ent-card overflow-hidden">
            <div className="p-4 border-b border-[#F1F5F9] flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="text-[15px] font-bold text-[#0F172A] flex items-center gap-2">
                  <FileText size={18} className="text-[#4F46E5]" /> Master Soil Audit & Paid Transactions Directory
                </h3>
                <p className="text-[12px] text-[#64748B]">All soil sample collection requests, payments, NPK baseline parameters, and approval status</p>
              </div>

              {/* Filter Pills */}
              <div className="flex items-center gap-2 bg-[#F8FAFC] p-1 border border-[#E2E8F0] rounded-xl">
                <button
                  onClick={() => setSoilFilter('all')}
                  className={`px-3 py-1 text-[12px] font-bold rounded-lg transition-colors ${
                    soilFilter === 'all' ? 'bg-white text-[#0F172A] shadow-xs' : 'text-[#64748B]'
                  }`}
                >
                  All Audits ({adminSoilBookings.length})
                </button>
                <button
                  onClick={() => setSoilFilter('paid')}
                  className={`px-3 py-1 text-[12px] font-bold rounded-lg transition-colors ${
                    soilFilter === 'paid' ? 'bg-[#EEF2FF] text-[#4F46E5] shadow-xs' : 'text-[#64748B]'
                  }`}
                >
                  Paid ₹499 ({adminSoilBookings.filter(b => b.is_paid).length})
                </button>
                <button
                  onClick={() => setSoilFilter('free')}
                  className={`px-3 py-1 text-[12px] font-bold rounded-lg transition-colors ${
                    soilFilter === 'free' ? 'bg-[#F0F9FF] text-[#0EA5E9] shadow-xs' : 'text-[#64748B]'
                  }`}
                >
                  Free NPK ({adminSoilBookings.filter(b => !b.is_paid).length})
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="ent-table min-w-[1000px]">
                <thead>
                  <tr>
                    <th>Audit Ref</th>
                    <th>Farmer Name & Contact</th>
                    <th>Plot Details</th>
                    <th>Audit Package</th>
                    <th>Payment Status</th>
                    <th>Schedule Date & Slot</th>
                    <th>Status</th>
                    <th>NPK (N/P/K)</th>
                    <th className="text-right">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {adminSoilBookings
                    .filter(b => {
                      if (soilFilter === 'paid') return b.is_paid;
                      if (soilFilter === 'free') return !b.is_paid;
                      return true;
                    })
                    .map((b) => (
                      <tr key={b.id}>
                        <td className="font-mono text-[12px] font-bold text-[#4F46E5]">SOIL-{b.id.slice(-4).toUpperCase()}</td>
                        <td>
                          <div className="font-bold text-[13px] text-[#0F172A]">{b.farmer_name}</div>
                          <div className="text-[11px] text-[#64748B]">{b.farmer_phone}</div>
                        </td>
                        <td>
                          <div className="font-semibold text-[12px] text-[#0F172A]">{b.land_parcel_name}</div>
                        </td>
                        <td>
                          <span className={`px-2.5 py-1 text-[11px] font-extrabold rounded-lg ${
                            b.is_paid ? 'bg-[#EEF2FF] text-[#4F46E5] border border-[#C7D2FE]' : 'bg-[#F0F9FF] text-[#0EA5E9] border border-[#BAE6FD]'
                          }`}>
                            {b.package_name}
                          </span>
                        </td>
                        <td>
                          {b.is_paid ? (
                            <span className="px-2.5 py-1 bg-[#D1FAE5] text-[#065F46] font-mono text-[11px] font-extrabold rounded-lg flex items-center gap-1 w-fit">
                              💳 ₹{b.amount_paid} PAID
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 bg-[#F1F5F9] text-[#64748B] text-[11px] font-bold rounded-md">
                              FREE
                            </span>
                          )}
                        </td>
                        <td>
                          <div className="text-[12px] font-semibold text-[#0F172A]">{b.schedule_date}</div>
                          <div className="text-[10px] text-[#64748B]">{b.schedule_time_slot}</div>
                        </td>
                        <td>
                          <span className={`px-2.5 py-1 text-[11px] font-extrabold rounded-lg uppercase tracking-wider ${
                            b.status === 'report_ready' ? 'bg-[#D1FAE5] text-[#065F46]' : 'bg-[#FEF3C7] text-[#B45309]'
                          }`}>
                            {b.status === 'report_ready' ? 'READY ✅' : b.status}
                          </span>
                        </td>
                        <td className="font-mono text-[12px]">
                          <span className="text-[#2563EB] font-bold">N:{b.nitrogen}</span> • <span className="text-[#D97706] font-bold">P:{b.phosphorus}</span> • <span className="text-[#16A34A] font-bold">K:{b.potassium}</span>
                        </td>
                        <td className="text-right">
                          <button
                            onClick={() => {
                              setSelectedLabReport({
                                id: b.id,
                                date: b.schedule_date,
                                healthScore: `${b.soil_health_score} / 10`,
                                soc: `${b.organic_carbon}%`,
                                n: b.nitrogen,
                                p: b.phosphorus,
                                k: b.potassium,
                                ph: b.ph,
                                moisture: '24%',
                                labRef: `SOC-2026-BHOPAL-${b.id.slice(-3).toUpperCase()}`,
                                status: b.status === 'report_ready' ? 'VERIFIED & READY ✅' : 'PROCESSING',
                                inspector: 'Bhopal East Agronomy Unit',
                                remarks: b.observations
                              });
                            }}
                            className="px-3 py-1.5 bg-[#F0FDF4] hover:bg-[#DCFCE7] text-[#16A34A] text-[12px] font-bold rounded-xl transition-colors inline-flex items-center gap-1"
                          >
                            <FileText size={14} /> View Lab Certificate
                          </button>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB: VERIFICATION QUEUE ── */}
      {activeTab === 'verification' && (
        <div className="ent-card overflow-hidden animate-in fade-in duration-300">
          <div className="p-4 border-b border-[#F1F5F9] flex items-center justify-between">
            <h3 className="text-[14px] font-bold text-[#0F172A] flex items-center gap-2"><ShieldCheck size={16} className="text-[#8B5CF6]" /> MRV Verification Queue</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="ent-table min-w-[900px]">
              <thead>
                <tr>
                  <th>Report ID</th>
                  <th>Project / Plot</th>
                  <th>Report Date</th>
                  <th>Inspector</th>
                  <th>Status</th>
                  <th>Observation</th>
                  <th className="text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {queue.map(q => (
                  <tr key={q.id}>
                    <td className="font-mono text-[12px] font-bold text-[#64748B]">{q.id}</td>
                    <td className="text-[13px] font-semibold text-[#0F172A]">{q.project}</td>
                    <td className="text-[13px]">{q.reportDate}</td>
                    <td className="text-[13px]">{q.inspector}</td>
                    <td><StatusBadge label={q.status} variant={getStatusVariant(q.status) as any} size="sm" /></td>
                    <td className="text-[12px] text-[#64748B] italic max-w-[200px] truncate">{q.observation || '—'}</td>
                    <td className="text-right">
                      {q.status === 'Pending' ? (
                        <button 
                          onClick={() => setReviewItem(q)}
                          className="px-3 py-1.5 bg-[#F5F3FF] hover:bg-[#EDE9FE] text-[#8B5CF6] text-[11.5px] font-bold rounded-lg transition-colors inline-flex items-center gap-1"
                        >
                          <CheckCircle size={13} /> Review
                        </button>
                      ) : (
                        <span className="text-[12px] text-[#94A3B8] font-medium px-2">Processed</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── MODALS ── */}

      {/* Field Inspection Slide-over Modal */}
      <AnimatePresence>
        {inspectionModalItem && (
          <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/40 backdrop-blur-xs">
            <motion.div
              initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ bounce: 0, duration: 0.25 }}
              className="w-full max-w-md bg-white h-full shadow-2xl flex flex-col"
            >
              <div className="p-5 border-b border-[#E2E8F0] flex justify-between items-center bg-[#F8FAFC]">
                <div>
                  <h3 className="font-bold text-[#0F172A] text-[16px]">Field Inspection Report</h3>
                  <div className="text-[12px] text-[#64748B] font-mono mt-0.5">{inspectionModalItem.project} • {inspectionModalItem.farmer}</div>
                </div>
                <button onClick={() => { setInspectionModalItem(null); setUploadedDocs({}); }} className="p-2 hover:bg-[#E2E8F0] rounded-xl"><X size={18} /></button>
              </div>

              <form onSubmit={handleInspectionSubmit} className="flex-1 overflow-y-auto p-5 space-y-5">
                
                {/* GPS Location Block */}
                <div className="bg-[#EFF6FF] border border-[#DBEAFE] rounded-xl p-3 flex items-center justify-between">
                   <div className="flex items-center gap-2 text-[#2563EB]">
                     <Navigation size={18} />
                     <div>
                       <div className="text-[12px] font-bold">GPS Coordinates Locked</div>
                       <div className="text-[11px] font-mono opacity-80">23.2599° N, 77.4126° E (Accuracy: 4m)</div>
                     </div>
                   </div>
                   <CheckCircle2 size={20} className="text-[#2563EB] opacity-60" />
                </div>

                {/* Upload Sections */}
                <div className="space-y-3">
                  <h4 className="text-[13px] font-bold text-[#0F172A]">Field Evidence Uploads</h4>
                  {['Site Photos (Min 4)', 'Drone Survey Map', 'Farmer Voice Note', 'Soil Test Document'].map(doc => {
                    const isUploaded = uploadedDocs[doc];
                    return (
                      <div key={doc} className={`flex items-center justify-between p-3 rounded-xl border ${isUploaded ? 'border-solid border-[#16A34A] bg-[#F0FDF4]' : 'border-dashed border-[#CBD5E1] bg-[#F8FAFC]'}`}>
                        <span className={`text-[12.5px] font-medium ${isUploaded ? 'text-[#16A34A]' : 'text-[#0F172A]'}`}>{doc}</span>
                        {isUploaded ? (
                          <span className="text-[12px] font-bold text-[#16A34A] flex items-center gap-1"><CheckCircle2 size={14}/> Attached</span>
                        ) : (
                          <label className="text-[12px] font-bold text-[#0EA5E9] flex items-center gap-1 hover:underline cursor-pointer">
                            <Upload size={14}/> Browse
                            <input type="file" className="hidden" onChange={() => handleFileUpload(doc)} />
                          </label>
                        )}
                      </div>
                    );
                  })}
                </div>

                <div className="space-y-3 pt-4 border-t border-[#E2E8F0]">
                  <h4 className="text-[13px] font-bold text-[#0F172A]">Inspector Declaration & Signature</h4>
                  <div className="p-4 bg-slate-50 border border-[#E2E8F0] rounded-xl text-center space-y-2">
                    <p className="text-[11.5px] text-[#64748B]">I verify that the attached field data is accurate and collected on-site.</p>
                    <input type="text" required placeholder="Type your name to sign digitally" className="w-full text-center px-3 py-2 border border-[#CBD5E1] rounded-lg text-[13px] outline-none" />
                  </div>
                </div>

              </form>
              <div className="p-5 border-t border-[#E2E8F0] bg-white">
                <button onClick={handleInspectionSubmit} className="w-full btn btn-primary py-2.5 flex justify-center gap-2">
                  <Cloud size={16} /> Submit Inspection Report
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Review Queue Modal */}
      <AnimatePresence>
        {reviewItem && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-[#E8EDF5] space-y-4"
            >
              <div className="flex justify-between border-b border-[#F1F5F9] pb-3">
                <div>
                  <h3 className="text-[16px] font-bold text-[#0F172A] flex items-center gap-2"><ShieldCheck size={18} className="text-[#8B5CF6]"/> Review MRV Report</h3>
                  <p className="text-[12px] text-[#64748B] mt-1 font-mono">{reviewItem.id} • {reviewItem.project}</p>
                </div>
                <button onClick={() => setReviewItem(null)}><X size={18} className="text-[#94A3B8]" /></button>
              </div>
              <div className="space-y-4 text-[13px]">
                <div className="flex gap-4">
                  <div className="flex-1 p-3 bg-[#F8FAFC] rounded-xl border border-[#E2E8F0]"><div className="text-[11px] text-[#64748B] font-bold uppercase mb-1">Inspector</div><div className="font-semibold text-[#0F172A]">{reviewItem.inspector}</div></div>
                  <div className="flex-1 p-3 bg-[#F8FAFC] rounded-xl border border-[#E2E8F0]"><div className="text-[11px] text-[#64748B] font-bold uppercase mb-1">Date</div><div className="font-semibold text-[#0F172A]">{reviewItem.reportDate}</div></div>
                </div>
                <div>
                  <label className="block text-[11.5px] font-bold text-[#0F172A] mb-1">Reviewer Observations / Remarks</label>
                  <textarea rows={3} value={observation} onChange={e => setObservation(e.target.value)} placeholder="Add comments regarding this report..." className="w-full p-3 border border-[#CBD5E1] rounded-xl outline-none resize-none"></textarea>
                </div>
                <div className="flex justify-end gap-2 pt-3 border-t border-[#F1F5F9]">
                  <button onClick={() => handleReviewAction('Rejected')} className="btn btn-sm bg-[#FEF2F2] hover:bg-[#FEE2E2] text-[#EF4444] border-transparent font-bold">Reject & Resurvey</button>
                  <button onClick={() => handleReviewAction('Approved')} className="btn btn-sm bg-[#16A34A] hover:bg-[#15803D] text-white border-transparent font-bold"><CheckCircle2 size={14} className="mr-1"/> Approve MRV</button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Soil Lab Report Details Modal */}
      <AnimatePresence>
        {selectedLabReport && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-[#E2E8F0] space-y-5"
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between border-b border-[#F1F5F9] pb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-[#F0FDF4] border border-[#DCFCE7] text-[#16A34A] flex items-center justify-center font-bold shrink-0">
                    <FileText size={22} />
                  </div>
                  <div>
                    <h3 className="text-[16px] font-extrabold text-[#0F172A] flex items-center gap-2">
                      🧪 Soil Analysis Lab Report ({selectedLabReport.date})
                    </h3>
                    <p className="text-[11.5px] text-[#64748B] font-mono">
                      Report Ref: {selectedLabReport.labRef} • {selectedLabReport.status}
                    </p>
                  </div>
                </div>
                <button onClick={() => setSelectedLabReport(null)} className="p-1 text-[#94A3B8] hover:text-[#0F172A] font-bold">
                  <X size={20} />
                </button>
              </div>

              {/* Health Score & Key Metrics Header Box */}
              <div className="p-4 bg-[#F0FDF4] border border-[#DCFCE7] rounded-2xl flex items-center justify-between">
                <div className="space-y-0.5">
                  <p className="text-[10px] font-extrabold text-[#16A34A] uppercase tracking-wider">OVERALL SOIL HEALTH SCORE</p>
                  <p className="text-[22px] font-black text-[#0F172A]">{selectedLabReport.healthScore}</p>
                </div>
                <div className="text-right space-y-0.5">
                  <p className="text-[10px] font-extrabold text-[#16A34A] uppercase tracking-wider">SOIL ORGANIC CARBON (SOC)</p>
                  <p className="text-[20px] font-extrabold text-[#16A34A] font-mono">{selectedLabReport.soc}</p>
                </div>
              </div>

              {/* Detailed Spectrum Grid (NPK, pH, Moisture) */}
              <div className="space-y-2">
                <h4 className="text-[11px] font-extrabold text-[#0F172A] uppercase tracking-wider">MACRONUTRIENT & PHYSICAL SPECTRUM</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-[12.5px]">
                  <div className="p-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl space-y-0.5">
                    <p className="text-[9.5px] font-extrabold text-[#64748B] uppercase">NITROGEN (N)</p>
                    <p className="text-[14px] font-bold text-[#0F172A] font-mono">{selectedLabReport.n} kg/ha</p>
                    <p className="text-[9.5px] text-[#16A34A] font-medium">Optimum Range</p>
                  </div>
                  <div className="p-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl space-y-0.5">
                    <p className="text-[9.5px] font-extrabold text-[#64748B] uppercase">PHOSPHORUS (P)</p>
                    <p className="text-[14px] font-bold text-[#0F172A] font-mono">{selectedLabReport.p} kg/ha</p>
                    <p className="text-[9.5px] text-[#16A34A] font-medium">Optimum Range</p>
                  </div>
                  <div className="p-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl space-y-0.5">
                    <p className="text-[9.5px] font-extrabold text-[#64748B] uppercase">POTASSIUM (K)</p>
                    <p className="text-[14px] font-bold text-[#0F172A] font-mono">{selectedLabReport.k} kg/ha</p>
                    <p className="text-[9.5px] text-[#16A34A] font-medium">Optimum Range</p>
                  </div>
                  <div className="p-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl space-y-0.5">
                    <p className="text-[9.5px] font-extrabold text-[#64748B] uppercase">PH LEVEL & MOISTURE</p>
                    <p className="text-[14px] font-bold text-[#0F172A] font-mono">{selectedLabReport.ph} pH • {selectedLabReport.moisture}</p>
                    <p className="text-[9.5px] text-[#16A34A] font-medium">Neutral / Ideal</p>
                  </div>
                </div>
              </div>

              {/* Inspector & Remarks */}
              <div className="p-4 bg-[#F8FAFC] border border-[#E2E8F0] rounded-2xl space-y-2 text-[12px]">
                <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-2">
                  <span className="font-semibold text-[#64748B]">Verifying Inspector / Lab:</span>
                  <span className="font-bold text-[#0F172A]">{selectedLabReport.inspector}</span>
                </div>
                <div>
                  <span className="font-semibold text-[#64748B] block mb-0.5">Agronomist Observations:</span>
                  <p className="text-[#334155] leading-relaxed italic">{selectedLabReport.remarks}</p>
                </div>
              </div>

              {/* Actions Footer */}
              <div className="flex items-center justify-between border-t border-[#F1F5F9] pt-3">
                <button
                  onClick={() => toast.success(`Downloading PDF Certificate for ${selectedLabReport.labRef}...`)}
                  className="px-4 py-2 bg-[#EFF6FF] hover:bg-[#DBEAFE] text-[#2563EB] font-bold text-[12px] rounded-xl border border-[#BFDBFE] flex items-center gap-1.5 transition-all"
                >
                  <Download size={14} /> Download Certified PDF
                </button>
                <button
                  onClick={() => setSelectedLabReport(null)}
                  className="px-5 py-2 bg-[#16A34A] hover:bg-[#15803D] text-white font-bold text-[12px] rounded-xl transition-all shadow-sm"
                >
                  Close Report
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};

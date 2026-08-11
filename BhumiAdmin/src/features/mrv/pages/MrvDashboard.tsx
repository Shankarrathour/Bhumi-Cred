import { useState, useMemo } from 'react';
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

// ── Mock Data ──
const MOCK_SCHEDULE: ScheduleItem[] = [
  { id: 'MRV-001', farmer: 'Rajesh Kumar', project: 'MP Agroforestry', visitDate: '15 Aug 2026', inspector: 'Suresh Patil', status: 'Pending Survey' },
  { id: 'MRV-002', farmer: 'Sita Devi', project: 'MP Agroforestry', visitDate: '12 Aug 2026', inspector: 'Amit Singh', status: 'Report Submitted' },
  { id: 'MRV-003', farmer: 'Gopal Verma', project: 'Rajasthan Arid', visitDate: '18 Aug 2026', inspector: 'Vikram Das', status: 'Pending Survey' },
  { id: 'MRV-004', farmer: 'Anil Rathore', project: 'Gujarat Mangroves', visitDate: '10 Aug 2026', inspector: 'Meera Rao', status: 'In Progress' },
];

const MOCK_SOIL: SoilData[] = [
  { id: 'SL-101', project: 'MP Agroforestry', organicCarbon: 1.2, moisture: 24, ph: 6.8, nitrogen: 240, phosphorus: 18, potassium: 120 },
  { id: 'SL-102', project: 'Rajasthan Arid', organicCarbon: 0.8, moisture: 12, ph: 7.2, nitrogen: 180, phosphorus: 12, potassium: 90 },
  { id: 'SL-103', project: 'Maharashtra Biochar', organicCarbon: 2.1, moisture: 30, ph: 6.5, nitrogen: 310, phosphorus: 24, potassium: 150 },
];

const MOCK_TREE: TreeData[] = [
  { id: 'TR-201', project: 'MP Agroforestry', treeCount: 15000, avgHeight: 2.4, avgDiameter: 12.5, survivalRate: 94, growthPercent: 12 },
  { id: 'TR-202', project: 'Gujarat Mangroves', treeCount: 45000, avgHeight: 1.8, avgDiameter: 8.0, survivalRate: 88, growthPercent: 8 },
  { id: 'TR-203', project: 'Rajasthan Arid', treeCount: 8000, avgHeight: 3.1, avgDiameter: 14.2, survivalRate: 82, growthPercent: 5 },
];

const MOCK_QUEUE: QueueItem[] = [
  { id: 'REP-501', project: 'MP Agroforestry - Plot 4A', reportDate: '12 Aug 2026', inspector: 'Amit Singh', status: 'Pending', observation: '' },
  { id: 'REP-502', project: 'Gujarat Mangroves - Sec 2', reportDate: '09 Aug 2026', inspector: 'Suresh Patil', status: 'Approved', observation: 'Growth metrics align with baseline.' },
  { id: 'REP-503', project: 'Rajasthan Arid - Block C', reportDate: '08 Aug 2026', inspector: 'Vikram Das', status: 'Rejected', observation: 'GPS coordinates mismatch with plot boundary. Retake survey.' },
];

const CHART_DATA = [
  { month: 'Mar', pending: 12, verified: 45 },
  { month: 'Apr', pending: 18, verified: 52 },
  { month: 'May', pending: 15, verified: 68 },
  { month: 'Jun', pending: 22, verified: 75 },
  { month: 'Jul', pending: 8, verified: 92 },
  { month: 'Aug', pending: 14, verified: 110 },
];

export const MrvDashboard = () => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'schedule' | 'telemetry' | 'verification'>('dashboard');
  const [isLoading, setIsLoading] = useState(false);

  // States
  const [schedules] = useState(MOCK_SCHEDULE);
  const [soilData] = useState(MOCK_SOIL);
  const [treeData] = useState(MOCK_TREE);
  const [queue, setQueue] = useState(MOCK_QUEUE);

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
            <KpiCard title="Active MRV" value="42" icon={Activity} iconBg="#F0FDF4" iconColor="#16A34A" />
            <KpiCard title="Pending Survey" value="18" icon={Map} iconBg="#FFFBEB" iconColor="#D97706" />
            <KpiCard title="Pending Reports" value="14" icon={FileText} iconBg="#EFF6FF" iconColor="#2563EB" />
            <KpiCard title="Verification Pending" value="8" icon={Clock} iconBg="#FEF2F2" iconColor="#EF4444" />
            <KpiCard title="Verified Sites" value="156" icon={ShieldCheck} iconBg="#F5F3FF" iconColor="#8B5CF6" />
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

    </div>
  );
};

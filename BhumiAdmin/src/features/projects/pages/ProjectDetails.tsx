import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Trees, Building2, Handshake, ShieldCheck, DollarSign,
  Calendar, Globe, FileText, Download,
  Cpu, Sparkles, Activity, Layers, User
} from 'lucide-react';
import { StatusBadge } from '../../../components/ui/StatusBadge';
import { KpiCard } from '../../../components/ui/KpiCard';
import { GISMapViewer } from '../../../components/ui/GISMapViewer';
import { LatLngExpression } from 'leaflet';
import toast from 'react-hot-toast';

export const ProjectDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<
    'overview' | 'timeline' | 'farmers' | 'govt' | 'partners' | 'mrv' | 'gis' | 'carbon' | 'revenue' | 'reports'
  >('overview');

  const [projectStatus, setProjectStatus] = useState<'Active' | 'Planning' | 'Completed' | 'Paused'>('Active');

  const safeId = id || 'PRJ-1042';

  const project = {
    id: safeId,
    code: safeId.startsWith('PRJ-') ? safeId : `PRJ-${safeId.slice(-4).toUpperCase()}`,
    name: 'MP Agroforestry Carbon Sink Drive',
    state: 'Madhya Pradesh',
    district: 'Sehore',
    projectType: 'Agroforestry & Soil Reforestation',
    totalAcres: 42000,
    enrolledFarmers: 2850,
    activeTrees: 425000,
    govtNodal: 'MP Forest Development Board',
    corporatePartner: 'AgriCorp Solutions Pvt Ltd',
    mrvPartner: 'CarbonX Sentinel Drone Labs',
    insurancePartner: 'EcoShield Tree Insurance Ltd',
    insuranceCoverLakhs: 85.0,
    estimatedCredits: 420000,
    creditsIssued: 310000,
    creditsSold: 280000,
    creditPriceUsd: 18.5,
    revenueGeneratedLakhs: 465.0,
    farmerPayoutLakhs: 325.5,
    progressPercentage: 74,
    coordinates: { lat: 23.0225, lng: 77.0124 },
  };

  const center: LatLngExpression = [project.coordinates.lat, project.coordinates.lng];
  const projectPolygon: LatLngExpression[] = [
    [project.coordinates.lat - 0.015, project.coordinates.lng - 0.015],
    [project.coordinates.lat + 0.015, project.coordinates.lng - 0.015],
    [project.coordinates.lat + 0.015, project.coordinates.lng + 0.015],
    [project.coordinates.lat - 0.015, project.coordinates.lng + 0.015],
  ];

  const handleStatusChange = (newStatus: 'Active' | 'Planning' | 'Completed' | 'Paused') => {
    setProjectStatus(newStatus);
    toast.success(`Project status updated to ${newStatus}`);
  };

  return (
    <div className="space-y-6 page-enter pb-12" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>

      {/* ── HEADER CONTROL ── */}
      <div className="bg-white border border-[#E8EDF5] rounded-2xl p-5 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3.5 min-w-0">
          <button
            onClick={() => navigate('/projects')}
            className="w-10 h-10 rounded-xl border border-[#E2E8F0] bg-white flex items-center justify-center text-[#64748B] hover:text-[#0F172A] hover:bg-[#F8FAFC] transition-all cursor-pointer"
            title="Back to Projects"
          >
            <ArrowLeft size={18} />
          </button>
          <div className="w-11 h-11 rounded-2xl bg-[#F0FDF4] border border-[#DCFCE7] flex items-center justify-center text-[#16A34A] shrink-0">
            <Trees size={22} />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-[18px] font-bold text-[#0F172A]">{project.name}</h1>
              <span className="font-mono text-[11px] font-bold text-[#2563EB] bg-[#EFF6FF] px-2.5 py-0.5 rounded-md border border-[#DBEAFE]">
                {project.code}
              </span>
              <StatusBadge label={projectStatus} variant={projectStatus === 'Active' ? 'success' : 'warning'} size="sm" />
            </div>
            <p className="text-[12px] text-[#64748B] mt-0.5 flex items-center gap-2">
              <span>{project.projectType}</span> • <span>{project.district}, {project.state}</span>
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => toast.success('MRV Telemetry verification scan requested')}
            className="btn btn-secondary btn-sm gap-1.5 cursor-pointer"
          >
            <Cpu size={14} /> Request MRV Audit
          </button>
          <button
            onClick={() => handleStatusChange(projectStatus === 'Active' ? 'Paused' : 'Active')}
            className="btn btn-primary btn-sm gap-1.5 cursor-pointer"
          >
            <Activity size={14} /> {projectStatus === 'Active' ? 'Pause Project' : 'Activate Project'}
          </button>
        </div>
      </div>

      {/* ── 10 BRD INTERACTIVE TABS NAV ── */}
      <div className="bg-white border border-[#E8EDF5] rounded-2xl p-1.5 shadow-xs overflow-x-auto custom-scrollbar flex items-center gap-1">
        {[
          { id: 'overview', label: '1. Overview', icon: FileText },
          { id: 'timeline', label: '2. Timeline & Milestones', icon: Calendar },
          { id: 'farmers', label: '3. Enrolled Farmers', icon: User },
          { id: 'govt', label: '4. Govt MoU', icon: Building2 },
          { id: 'partners', label: '5. Partners', icon: Handshake },
          { id: 'mrv', label: '6. MRV Operations', icon: Cpu },
          { id: 'gis', label: '7. GIS Boundary Map', icon: Globe },
          { id: 'carbon', label: '8. Carbon Credits', icon: Sparkles },
          { id: 'revenue', label: '9. Revenue & Payouts', icon: DollarSign },
          { id: 'reports', label: '10. Reports & Audit', icon: ShieldCheck },
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-[12px] font-bold transition-all whitespace-nowrap cursor-pointer ${
                isActive
                  ? 'bg-[#F0FDF4] text-[#16A34A] border border-[#DCFCE7] shadow-xs'
                  : 'text-[#64748B] hover:bg-[#F8FAFC] hover:text-[#0F172A]'
              }`}
            >
              <Icon size={14} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* ── TAB 1: OVERVIEW & DASHBOARD ── */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <KpiCard title="TOTAL PROJECT ACRES" value={`${project.totalAcres.toLocaleString()} Ac`} icon={Layers} iconBg="#EFF6FF" iconColor="#2563EB" />
            <KpiCard title="ENROLLED FARMERS" value={project.enrolledFarmers.toLocaleString()} icon={User} iconBg="#F0FDF4" iconColor="#16A34A" />
            <KpiCard title="PLANTED TREES" value={project.activeTrees.toLocaleString()} icon={Trees} iconBg="#F5F3FF" iconColor="#8B5CF6" />
            <KpiCard title="REVENUE GENERATED" value={`₹${project.revenueGeneratedLakhs} Lakhs`} icon={DollarSign} iconBg="#FEF2F2" iconColor="#EF4444" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-8 bg-white border border-[#E8EDF5] rounded-2xl p-5 shadow-xs space-y-4">
              <h3 className="text-[14px] font-bold text-[#0F172A] flex items-center gap-2">
                <Activity size={16} className="text-[#16A34A]" /> Project Execution Progress
              </h3>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-[13px] font-bold text-[#0F172A]">
                  <span>Overall Milestone Completion</span>
                  <span className="text-[#16A34A]">{project.progressPercentage}%</span>
                </div>
                <div className="w-full h-3 bg-[#E2E8F0] rounded-full overflow-hidden">
                  <div className="h-full bg-[#16A34A] rounded-full" style={{ width: `${project.progressPercentage}%` }} />
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2">
                <div className="p-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl">
                  <span className="text-[11px] font-bold text-[#64748B]">Govt Department</span>
                  <p className="text-[13px] font-bold text-[#0F172A]">{project.govtNodal}</p>
                </div>
                <div className="p-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl">
                  <span className="text-[11px] font-bold text-[#64748B]">Corporate Partner</span>
                  <p className="text-[13px] font-bold text-[#0F172A]">{project.corporatePartner}</p>
                </div>
                <div className="p-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl">
                  <span className="text-[11px] font-bold text-[#64748B]">Tree Insurance</span>
                  <p className="text-[13px] font-bold text-[#16A34A]">₹{project.insuranceCoverLakhs} L Cover</p>
                </div>
              </div>
            </div>

            <div className="lg:col-span-4 bg-white border border-[#E8EDF5] rounded-2xl p-5 shadow-xs space-y-3">
              <h3 className="text-[14px] font-bold text-[#0F172A] flex items-center gap-2">
                <Trees size={16} className="text-[#16A34A]" /> Afforestation Species Mix
              </h3>
              <div className="space-y-2.5 text-[12.5px]">
                {[
                  { name: 'Teak (Tectona grandis)', pct: 40, trees: '170,000' },
                  { name: 'Bamboo (Dendrocalamus)', pct: 30, trees: '127,500' },
                  { name: 'Neem (Azadirachta indica)', pct: 20, trees: '85,000' },
                  { name: 'Fruit & Medicinal', pct: 10, trees: '42,500' },
                ].map((s, i) => (
                  <div key={i} className="flex items-center justify-between p-2 bg-[#F8FAFC] rounded-lg border border-[#F1F5F9]">
                    <div>
                      <span className="font-bold text-[#0F172A]">{s.name}</span>
                      <span className="text-[11px] text-[#64748B] block">{s.trees} Trees</span>
                    </div>
                    <span className="font-mono text-[12px] font-bold text-[#2563EB]">{s.pct}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 2: TIMELINE & MILESTONES ── */}
      {activeTab === 'timeline' && (
        <div className="bg-white border border-[#E8EDF5] rounded-2xl p-6 shadow-xs space-y-6">
          <h3 className="text-[15px] font-bold text-[#0F172A] flex items-center gap-2">
            <Calendar size={18} className="text-[#16A34A]" /> Project Execution Timeline & Milestones
          </h3>

          <div className="relative border-l-2 border-[#E2E8F0] ml-4 space-y-6 pl-6">
            {[
              { title: 'Baseline GIS Survey & Land Geofencing', date: 'Jan 2026', status: 'Completed', actor: 'GIS Partner Labs' },
              { title: 'Farmer Onboarding & Sapling Distribution', date: 'Mar 2026', status: 'Completed', actor: 'Operations Admin' },
              { title: 'Phase 1 Planting & Satellite Canopy Tracking', date: 'May 2026', status: 'In Progress', actor: 'CarbonX Sentinel Labs' },
              { title: 'Third-Party Verra Baseline Audit', date: 'Sep 2026', status: 'Upcoming', actor: 'Gold Standard Auditor' },
              { title: 'First Batch Carbon Credit Issuance', date: 'Nov 2026', status: 'Upcoming', actor: 'BhumiCred Registry' },
            ].map((m, idx) => (
              <div key={idx} className="relative">
                <div className={`absolute -left-[31px] top-0 w-4 h-4 rounded-full border-2 bg-white ${
                  m.status === 'Completed' ? 'border-[#16A34A] bg-[#16A34A]' : m.status === 'In Progress' ? 'border-[#2563EB]' : 'border-[#CBD5E1]'
                }`} />
                <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-4 flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h4 className="text-[13.5px] font-bold text-[#0F172A]">{m.title}</h4>
                    <span className="text-[11px] text-[#64748B] font-medium">{m.date} • Lead: {m.actor}</span>
                  </div>
                  <StatusBadge label={m.status} variant={m.status === 'Completed' ? 'success' : m.status === 'In Progress' ? 'warning' : 'gray'} size="sm" />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── TAB 3: ENROLLED FARMERS ── */}
      {activeTab === 'farmers' && (
        <div className="ent-card overflow-hidden">
          <div className="p-4 border-b border-[#F1F5F9] flex items-center justify-between">
            <h3 className="text-[14px] font-bold text-[#0F172A]">Enrolled Farmers in Project ({project.enrolledFarmers})</h3>
            <button onClick={() => navigate('/farmers')} className="btn btn-secondary btn-sm">View All Farmers</button>
          </div>
          <div className="overflow-x-auto">
            <table className="ent-table min-w-[900px]">
              <thead>
                <tr>
                  <th>Farmer Name & ID</th>
                  <th>Village & District</th>
                  <th>Land Area</th>
                  <th>Planted Trees</th>
                  <th>Tree Insurance</th>
                  <th>Payout Status</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { name: 'Ramesh Patel', id: 'F-84920', village: 'Ichhawar, Sehore', acres: '14.5 Ac', trees: '850', ins: 'Insured', payout: 'Paid ₹42,500' },
                  { name: 'Suresh Verma', id: 'F-71029', village: 'Ashta, Sehore', acres: '12.0 Ac', trees: '600', ins: 'Insured', payout: 'Pending ₹30,000' },
                  { name: 'Anita Devi', id: 'F-40291', village: 'Shyampur, Sehore', acres: '8.2 Ac', trees: '400', ins: 'Pending', payout: 'Processing' },
                ].map((f, i) => (
                  <tr key={i}>
                    <td>
                      <div className="text-[13px] font-bold text-[#0F172A]">{f.name}</div>
                      <div className="text-[11px] font-mono text-[#64748B]">{f.id}</div>
                    </td>
                    <td className="text-[12.5px] text-[#475569]">{f.village}</td>
                    <td className="text-[13px] font-bold text-[#16A34A]">{f.acres}</td>
                    <td className="text-[13px] font-bold text-[#0F172A]">{f.trees} Trees</td>
                    <td><StatusBadge label={f.ins} variant={f.ins === 'Insured' ? 'success' : 'warning'} size="sm" /></td>
                    <td className="text-[12.5px] font-bold text-[#2563EB]">{f.payout}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── TAB 4: GOVERNMENT MOU & COMPLIANCE ── */}
      {activeTab === 'govt' && (
        <div className="bg-white border border-[#E8EDF5] rounded-2xl p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-[#F1F5F9] pb-4">
            <div>
              <h3 className="text-[15px] font-bold text-[#0F172A] flex items-center gap-2">
                <Building2 size={18} className="text-[#D97706]" /> Government Nodal Department Compliance
              </h3>
              <p className="text-[12px] text-[#64748B]">Official MoU & Land Lease Sanctions</p>
            </div>
            <button onClick={() => toast.success('Downloading Official MoU PDF')} className="btn btn-secondary btn-sm gap-1.5 cursor-pointer">
              <Download size={14} /> Download MoU PDF
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl space-y-1">
              <span className="text-[11px] font-bold text-[#64748B]">Nodal Organization</span>
              <p className="text-[14px] font-bold text-[#0F172A]">{project.govtNodal}</p>
            </div>
            <div className="p-4 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl space-y-1">
              <span className="text-[11px] font-bold text-[#64748B]">MoU Sanction No</span>
              <p className="text-[14px] font-mono font-bold text-[#2563EB]">MOU-GOVT-MP-2026-8801</p>
            </div>
            <div className="p-4 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl space-y-1">
              <span className="text-[11px] font-bold text-[#64748B]">Compliance Status</span>
              <p className="text-[14px] font-bold text-[#16A34A]">100% Compliant & Approved</p>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 5: PARTNER ECOSYSTEM ── */}
      {activeTab === 'partners' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            { role: 'Corporate Offtaker Partner', name: project.corporatePartner, type: 'Carbon Buyer', status: 'Active SLA' },
            { role: 'MRV & Drone Sensor Partner', name: project.mrvPartner, type: 'MRV Telemetry', status: 'Active SLA' },
            { role: 'Tree Insurance Underwriter', name: project.insurancePartner, type: 'Insurance Agency', status: 'Active SLA' },
            { role: 'GIS Mapping & Satellite Partner', name: 'GeoSpatial GIS Analytics Ltd', type: 'GIS Mapping', status: 'Active SLA' },
          ].map((p, i) => (
            <div key={i} className="p-5 bg-white border border-[#E8EDF5] rounded-2xl shadow-xs flex items-start justify-between">
              <div>
                <span className="text-[11px] font-bold uppercase text-[#94A3B8]">{p.role}</span>
                <h4 className="text-[14px] font-bold text-[#0F172A] mt-0.5">{p.name}</h4>
                <span className="text-[11.5px] text-[#2563EB] font-medium">{p.type}</span>
              </div>
              <StatusBadge label={p.status} variant="success" size="sm" />
            </div>
          ))}
        </div>
      )}

      {/* ── TAB 6: MRV OPERATIONS ── */}
      {activeTab === 'mrv' && (
        <div className="bg-white border border-[#E8EDF5] rounded-2xl p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-[#F1F5F9] pb-4">
            <h3 className="text-[15px] font-bold text-[#0F172A] flex items-center gap-2">
              <Cpu size={18} className="text-[#16A34A]" /> Satellite Telemetry & Drone MRV Data
            </h3>
            <button onClick={() => toast.success('Initiating live satellite telemetry sync...')} className="btn btn-primary btn-sm">Sync Telemetry</button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-[#F0FDF4] border border-[#DCFCE7] rounded-xl">
              <span className="text-[11px] font-bold text-[#16A34A]">Canopy Cover Index (NDVI)</span>
              <p className="text-[22px] font-extrabold text-[#16A34A]">0.78 NDVI</p>
            </div>
            <div className="p-4 bg-[#EFF6FF] border border-[#DBEAFE] rounded-xl">
              <span className="text-[11px] font-bold text-[#2563EB]">Soil Organic Carbon (SOC)</span>
              <p className="text-[22px] font-extrabold text-[#2563EB]">1.42% SOC</p>
            </div>
            <div className="p-4 bg-[#F5F3FF] border border-[#DDD6FE] rounded-xl">
              <span className="text-[11px] font-bold text-[#8B5CF6]">Estimated Biomass Sequestration</span>
              <p className="text-[22px] font-extrabold text-[#8B5CF6]">10.2 tCO₂e/Ha</p>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 7: GIS BOUNDARY MAP ── */}
      {activeTab === 'gis' && (
        <div className="bg-white border border-[#E8EDF5] rounded-2xl p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-[14px] font-bold text-[#0F172A] flex items-center gap-2">
              <Globe size={16} className="text-[#16A34A]" /> Geofenced Project Boundary & Cadastral Overlay
            </h3>
            <span className="text-[11px] font-bold text-[#2563EB] bg-[#EFF6FF] px-2.5 py-0.5 rounded-full border border-[#DBEAFE]">
              42,000 Acres Geofenced
            </span>
          </div>
          <GISMapViewer
            center={center}
            polygons={[{ id: 'proj-poly', positions: projectPolygon, color: '#16A34A', popupInfo: 'MP Agroforestry Project Boundary (42,000 Acres)' }]}
            height="450px"
          />
        </div>
      )}

      {/* ── TAB 8: CARBON CREDITS ── */}
      {activeTab === 'carbon' && (
        <div className="bg-white border border-[#E8EDF5] rounded-2xl p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-[#F1F5F9] pb-4">
            <h3 className="text-[15px] font-bold text-[#0F172A] flex items-center gap-2">
              <Sparkles size={18} className="text-[#059669]" /> Verified Carbon Credits Ledger
            </h3>
            <button onClick={() => toast.success('Minted 10,000 tCO₂e Carbon Credits to Registry!')} className="btn btn-primary btn-sm">Issue New Credits</button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-[#ECFDF5] border border-[#A7F3D0] rounded-xl">
              <span className="text-[11px] font-bold text-[#059669]">Credits Issued</span>
              <p className="text-[22px] font-extrabold text-[#059669]">{project.creditsIssued.toLocaleString()} tCO₂e</p>
            </div>
            <div className="p-4 bg-[#EFF6FF] border border-[#DBEAFE] rounded-xl">
              <span className="text-[11px] font-bold text-[#2563EB]">Credits Sold</span>
              <p className="text-[22px] font-extrabold text-[#2563EB]">{project.creditsSold.toLocaleString()} tCO₂e</p>
            </div>
            <div className="p-4 bg-[#FFFBEB] border border-[#FDE68A] rounded-xl">
              <span className="text-[11px] font-bold text-[#D97706]">Avg Price per Credit</span>
              <p className="text-[22px] font-extrabold text-[#D97706]">${project.creditPriceUsd} / tCO₂e</p>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 9: REVENUE & PAYOUTS ── */}
      {activeTab === 'revenue' && (
        <div className="bg-white border border-[#E8EDF5] rounded-2xl p-6 shadow-xs space-y-4">
          <h3 className="text-[15px] font-bold text-[#0F172A] flex items-center gap-2">
            <DollarSign size={18} className="text-[#EF4444]" /> Revenue Monetization & Payout Distribution
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-[#FAFAFA] border border-[#E5E5E5] rounded-xl">
              <span className="text-[11px] font-bold text-[#525252]">Gross Revenue</span>
              <p className="text-[22px] font-extrabold text-[#0F172A]">₹{project.revenueGeneratedLakhs} Lakhs</p>
            </div>
            <div className="p-4 bg-[#F0FDF4] border border-[#DCFCE7] rounded-xl">
              <span className="text-[11px] font-bold text-[#16A34A]">Farmer Share (70%)</span>
              <p className="text-[22px] font-extrabold text-[#16A34A]">₹{project.farmerPayoutLakhs} Lakhs</p>
            </div>
            <div className="p-4 bg-[#EFF6FF] border border-[#DBEAFE] rounded-xl">
              <span className="text-[11px] font-bold text-[#2563EB]">Platform & Partner Share (30%)</span>
              <p className="text-[22px] font-extrabold text-[#2563EB]">₹{(project.revenueGeneratedLakhs * 0.3).toFixed(1)} Lakhs</p>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 10: REPORTS & AUDIT CERTIFICATES ── */}
      {activeTab === 'reports' && (
        <div className="bg-white border border-[#E8EDF5] rounded-2xl p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-[#F1F5F9] pb-4">
            <h3 className="text-[15px] font-bold text-[#0F172A] flex items-center gap-2">
              <ShieldCheck size={18} className="text-[#16A34A]" /> Verra & ESG Compliance Reports
            </h3>
            <button onClick={() => toast.success('Exporting full project audit log in CSV format')} className="btn btn-secondary btn-sm gap-1.5 cursor-pointer">
              <Download size={14} /> Export CSV Audit
            </button>
          </div>

          <div className="space-y-3 text-[12.5px]">
            {[
              { name: 'Verra_VM0042_Agroforestry_Audit_Certificate.pdf', size: '4.8 MB', date: '02 Aug 2026' },
              { name: 'Gold_Standard_Carbon_Sequestration_Report.pdf', size: '6.1 MB', date: '28 Jul 2026' },
              { name: 'Third_Party_MRV_Drone_Scan_Log.pdf', size: '3.4 MB', date: '15 Jul 2026' },
            ].map((r, i) => (
              <div key={i} className="p-3 border border-[#E8EDF5] rounded-xl bg-[#FAFCFF] flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText size={16} className="text-[#2563EB]" />
                  <div>
                    <span className="font-bold text-[#0F172A] block">{r.name}</span>
                    <span className="text-[11px] text-[#94A3B8]">{r.size} • Issued: {r.date}</span>
                  </div>
                </div>
                <button onClick={() => toast.success(`Downloading ${r.name}`)} className="btn btn-ghost btn-icon btn-sm">
                  <Download size={14} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
};

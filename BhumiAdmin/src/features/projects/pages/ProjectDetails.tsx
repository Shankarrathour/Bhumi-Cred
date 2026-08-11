import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Trees, Building2, Handshake, ShieldCheck, DollarSign,
  Calendar, Globe, FileText, Download,
  Cpu, Sparkles, Activity, Layers, User, Camera, CheckCircle
} from 'lucide-react';
import { StatusBadge } from '../../../components/ui/StatusBadge';
import { KpiCard } from '../../../components/ui/KpiCard';
import { GISMapViewer } from '../../../components/ui/GISMapViewer';
import { LatLngExpression } from 'leaflet';
import { downloadPDFDocument, downloadCSVDocument } from '../../../utils/pdfExporter';
import toast from 'react-hot-toast';

export const ProjectDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  // 10 Specified Tabs: Overview, Timeline, Farmers, Govt, Partner, MRV, GIS, Carbon, Revenue, Reports
  const [activeTab, setActiveTab] = useState<
    'Overview' | 'Timeline' | 'Farmers' | 'Govt' | 'Partner' | 'MRV' | 'GIS' | 'Carbon' | 'Revenue' | 'Reports'
  >('Overview');

  const [projectStatus, setProjectStatus] = useState<'Draft' | 'Ongoing' | 'MRV' | 'Verification' | 'Issued' | 'Completed'>('Ongoing');

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
    creditsAvailable: 30000,
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

  return (
    <div className="space-y-6 page-enter pb-12" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>

      {/* ── HEADER ── */}
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
              <StatusBadge label={projectStatus} variant={projectStatus === 'Ongoing' ? 'success' : 'warning'} size="sm" />
            </div>
            <p className="text-[12px] text-[#64748B] mt-0.5 flex items-center gap-2">
              <span>{project.projectType}</span> • <span>{project.district}, {project.state}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => toast.success('MRV Audit inspection triggered')}
            className="btn btn-secondary btn-sm gap-1.5 cursor-pointer"
          >
            <Cpu size={14} /> Request MRV Audit
          </button>
        </div>
      </div>

      {/* ── 10 SPECIFIED TABS ── */}
      <div className="bg-white border border-[#E8EDF5] rounded-2xl p-1.5 shadow-xs overflow-x-auto custom-scrollbar flex items-center gap-1">
        {[
          { id: 'Overview', label: 'Overview', icon: FileText },
          { id: 'Timeline', label: 'Timeline', icon: Calendar },
          { id: 'Farmers', label: 'Farmers', icon: User },
          { id: 'Govt', label: 'Govt', icon: Building2 },
          { id: 'Partner', label: 'Partner', icon: Handshake },
          { id: 'MRV', label: 'MRV', icon: Cpu },
          { id: 'GIS', label: 'GIS', icon: Globe },
          { id: 'Carbon', label: 'Carbon', icon: Sparkles },
          { id: 'Revenue', label: 'Revenue', icon: DollarSign },
          { id: 'Reports', label: 'Reports', icon: ShieldCheck },
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

      {/* ── TAB CONTENT AREA ── */}
      <div className="bg-white border border-[#E8EDF5] rounded-2xl p-6 shadow-xs min-h-[420px]">

        {/* 1. OVERVIEW TAB */}
        {activeTab === 'Overview' && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <KpiCard title="TOTAL AREA" value={`${project.totalAcres.toLocaleString()} Ac`} icon={Layers} iconBg="#EFF6FF" iconColor="#2563EB" />
              <KpiCard title="ENROLLED FARMERS" value={project.enrolledFarmers.toLocaleString()} icon={User} iconBg="#F0FDF4" iconColor="#16A34A" />
              <KpiCard title="PLANTED TREES" value={project.activeTrees.toLocaleString()} icon={Trees} iconBg="#F5F3FF" iconColor="#8B5CF6" />
              <KpiCard title="TOTAL REVENUE" value={`₹${project.revenueGeneratedLakhs} L`} icon={DollarSign} iconBg="#FEF2F2" iconColor="#EF4444" />
            </div>
          </div>
        )}

        {/* 2. TIMELINE TAB (Registration, GIS, MRV, Verification, Registry, Carbon Generated, Carbon Sold) */}
        {activeTab === 'Timeline' && (
          <div className="space-y-6">
            <h3 className="text-[15px] font-bold text-[#0F172A] border-b border-[#F1F5F9] pb-3 flex items-center gap-2">
              <Calendar size={18} className="text-[#16A34A]" /> Project Life Cycle Timeline
            </h3>

            <div className="relative border-l-2 border-[#E2E8F0] ml-4 space-y-6 pl-6">
              {[
                { title: 'Registration', date: 'Jan 2025', desc: 'Project registered on BhumiCred Platform' },
                { title: 'GIS', date: 'Feb 2025', desc: 'Cadastral GIS boundary geofencing completed' },
                { title: 'MRV', date: 'May 2025', desc: 'Drone & Satellite telemetry baseline established' },
                { title: 'Verification', date: 'Jul 2025', desc: 'Verra Gold Standard audit verification passed' },
                { title: 'Registry', date: 'Aug 2025', desc: 'Registered under Verra Registry Registry Code #VR-801' },
                { title: 'Carbon Generated', date: 'Sep 2025', desc: '310,000 tCO₂e Carbon Credits generated' },
                { title: 'Carbon Sold', date: 'Oct 2025', desc: '280,000 tCO₂e Credits sold to corporate partners' },
              ].map((step, idx) => (
                <div key={idx} className="relative">
                  <span className="absolute -left-[31px] top-0 w-4 h-4 rounded-full bg-[#16A34A] border-2 border-white" />
                  <p className="text-[11px] font-bold text-[#94A3B8]">{step.date}</p>
                  <p className="text-[13.5px] font-bold text-[#0F172A]">{step.title}</p>
                  <p className="text-[11.5px] text-[#64748B]">{step.desc}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 3. FARMERS TAB */}
        {activeTab === 'Farmers' && (
          <div className="space-y-4">
            <h3 className="text-[15px] font-bold text-[#0F172A] border-b border-[#F1F5F9] pb-3">Enrolled Farmers List</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {[
                { name: 'Ramesh Patel', id: 'FARM-MP-8091', area: '14.5 Acres', village: 'Sehore Khas' },
                { name: 'Sita Devi', id: 'FARM-MP-8092', area: '8.2 Acres', village: 'Depalpur' },
              ].map((f, i) => (
                <div key={i} className="p-3 bg-[#FAFCFF] border border-[#F1F5F9] rounded-xl flex justify-between">
                  <div>
                    <span className="font-bold text-[#0F172A]">{f.name}</span>
                    <span className="text-[11px] text-[#64748B] block">{f.id} • {f.village}</span>
                  </div>
                  <span className="font-bold text-[#16A34A]">{f.area}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 4. GOVT TAB */}
        {activeTab === 'Govt' && (
          <div className="space-y-4">
            <h3 className="text-[15px] font-bold text-[#0F172A] border-b border-[#F1F5F9] pb-3">Govt Nodal MoU</h3>
            <p className="text-[13px] font-bold text-[#0F172A]">{project.govtNodal}</p>
            <p className="text-[12px] text-[#64748B]">Sanction MoU Ref: MOU-GOVT-MP-2026-8801</p>
          </div>
        )}

        {/* 5. PARTNER TAB */}
        {activeTab === 'Partner' && (
          <div className="space-y-4">
            <h3 className="text-[15px] font-bold text-[#0F172A] border-b border-[#F1F5F9] pb-3">Corporate & B2B Partners</h3>
            <p className="text-[13px] font-bold text-[#0F172A]">{project.corporatePartner}</p>
          </div>
        )}

        {/* 6. MRV TAB (Inspection, Soil, Satellite, Drone, Photos, Reports) */}
        {activeTab === 'MRV' && (
          <div className="space-y-6">
            <h3 className="text-[15px] font-bold text-[#0F172A] border-b border-[#F1F5F9] pb-3 flex items-center gap-2">
              <Cpu size={18} className="text-[#16A34A]" /> MRV Operations (Inspection, Soil, Satellite, Drone, Photos, Reports)
            </h3>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div className="p-3.5 border border-[#E8EDF5] rounded-xl bg-[#FAFCFF]">
                <p className="text-[11px] font-bold text-[#94A3B8]">INSPECTION STATUS</p>
                <p className="font-bold text-[#16A34A] mt-1">✓ Audit Passed</p>
              </div>
              <div className="p-3.5 border border-[#E8EDF5] rounded-xl bg-[#FAFCFF]">
                <p className="text-[11px] font-bold text-[#94A3B8]">SOIL ORGANIC CARBON (SOC)</p>
                <p className="font-bold text-[#2563EB] mt-1">1.45% SOC</p>
              </div>
              <div className="p-3.5 border border-[#E8EDF5] rounded-xl bg-[#FAFCFF]">
                <p className="text-[11px] font-bold text-[#94A3B8]">SATELLITE NDIV CANOPY</p>
                <p className="font-bold text-[#059669] mt-1">0.82 NDVI</p>
              </div>
              <div className="p-3.5 border border-[#E8EDF5] rounded-xl bg-[#FAFCFF]">
                <p className="text-[11px] font-bold text-[#94A3B8]">DRONE FLYOVER LOG</p>
                <p className="font-bold text-[#8B5CF6] mt-1">Completed 02 Aug</p>
              </div>
              <div className="p-3.5 border border-[#E8EDF5] rounded-xl bg-[#FAFCFF]">
                <p className="text-[11px] font-bold text-[#94A3B8]">GEOTAGGED PHOTOS</p>
                <p className="font-bold text-[#0F172A] mt-1">142 Photos</p>
              </div>
              <div className="p-3.5 border border-[#E8EDF5] rounded-xl bg-[#FAFCFF]">
                <p className="text-[11px] font-bold text-[#94A3B8]">MRV AUDIT REPORT</p>
                <p className="font-bold text-[#16A34A] mt-1">Verra Verified</p>
              </div>
            </div>
          </div>
        )}

        {/* 7. GIS TAB */}
        {activeTab === 'GIS' && (
          <div className="space-y-4">
            <h3 className="text-[15px] font-bold text-[#0F172A] border-b border-[#F1F5F9] pb-3">GIS Boundary Map</h3>
            <GISMapViewer center={center} polygons={[{ id: 'prj-gis', positions: projectPolygon, color: '#16A34A', popupInfo: project.name }]} height="380px" />
          </div>
        )}

        {/* 8. CARBON TAB (Estimated Credits, Issued, Available, Sold) */}
        {activeTab === 'Carbon' && (
          <div className="space-y-6">
            <h3 className="text-[15px] font-bold text-[#0F172A] border-b border-[#F1F5F9] pb-3 flex items-center gap-2">
              <Sparkles size={18} className="text-[#059669]" /> Carbon Credit Ledger
            </h3>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-4 bg-[#FAFCFF] border border-[#F1F5F9] rounded-2xl">
                <p className="text-[10.5px] font-bold uppercase text-[#94A3B8]">Estimated Credits</p>
                <p className="text-[18px] font-extrabold text-[#0F172A]">{project.estimatedCredits.toLocaleString()} tCO₂e</p>
              </div>
              <div className="p-4 bg-[#ECFDF5] border border-[#A7F3D0] rounded-2xl">
                <p className="text-[10.5px] font-bold uppercase text-[#059669]">Issued Credits</p>
                <p className="text-[18px] font-extrabold text-[#059669]">{project.creditsIssued.toLocaleString()} tCO₂e</p>
              </div>
              <div className="p-4 bg-[#EFF6FF] border border-[#DBEAFE] rounded-2xl">
                <p className="text-[10.5px] font-bold uppercase text-[#2563EB]">Available Credits</p>
                <p className="text-[18px] font-extrabold text-[#2563EB]">{project.creditsAvailable.toLocaleString()} tCO₂e</p>
              </div>
              <div className="p-4 bg-[#FFFBEB] border border-[#FDE68A] rounded-2xl">
                <p className="text-[10.5px] font-bold uppercase text-[#D97706]">Sold Credits</p>
                <p className="text-[18px] font-extrabold text-[#D97706]">{project.creditsSold.toLocaleString()} tCO₂e</p>
              </div>
            </div>
          </div>
        )}

        {/* 9. REVENUE TAB */}
        {activeTab === 'Revenue' && (
          <div className="space-y-4">
            <h3 className="text-[15px] font-bold text-[#0F172A] border-b border-[#F1F5F9] pb-3">Revenue & Payouts</h3>
            <p className="text-[16px] font-extrabold text-[#16A34A]">Total Gross Revenue: ₹{project.revenueGeneratedLakhs} Lakhs</p>
            <p className="text-[13px] text-[#475569]">Farmer Payout Share: ₹{project.farmerPayoutLakhs} Lakhs</p>
          </div>
        )}

        {/* 10. REPORTS TAB */}
        {activeTab === 'Reports' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-[#F1F5F9] pb-3">
              <h3 className="text-[15px] font-bold text-[#0F172A]">Reports & Audit Certificates</h3>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    downloadCSVDocument(
                      `Project_${project.code}_Audit_Log.csv`,
                      ['Project Code', 'Project Name', 'Enrolled Farmers', 'Acres', 'Credits Issued', 'Status'],
                      [[project.code, project.name, project.enrolledFarmers, project.totalAcres, project.creditsIssued, projectStatus]]
                    );
                    toast.success('Downloaded CSV Audit Log!');
                  }}
                  className="btn btn-secondary btn-sm flex items-center gap-1 cursor-pointer"
                >
                  <Download size={13} /> Export CSV Audit
                </button>
              </div>
            </div>

            <div className="space-y-3 text-[12.5px]">
              {[
                { name: 'Verra_VM0042_Agroforestry_Audit_Certificate.pdf', size: '4.8 MB', date: '02 Aug 2026' },
                { name: 'Gold_Standard_Carbon_Sequestration_Report.pdf', size: '6.1 MB', date: '28 Jul 2026' },
                { name: 'Third_Party_MRV_Drone_Scan_Log.pdf', size: '3.4 MB', date: '15 Jul 2026' },
              ].map((r, i) => (
                <div key={i} className="p-3 border border-[#E8EDF5] rounded-xl bg-[#FAFCFF] flex items-center justify-between">
                  <div>
                    <span className="font-bold text-[#0F172A] block">{r.name}</span>
                    <span className="text-[11px] text-[#94A3B8]">{r.size} • Issued: {r.date}</span>
                  </div>
                  <button
                    onClick={() => {
                      downloadPDFDocument({
                        title: r.name.replace('.pdf', '').replace(/_/g, ' '),
                        subtitle: `Project: ${project.name} (${project.code})`,
                        filename: r.name,
                        metadata: {
                          'Project Name': project.name,
                          'Project Code': project.code,
                          'Report Type': r.name.replace(/_/g, ' '),
                          'Issue Date': r.date,
                          'Audit Verification': '100% Verra & Gold Standard Compliant',
                        },
                      });
                      toast.success(`Generated official ${r.name}!`);
                    }}
                    className="p-2 bg-[#F0FDF4] hover:bg-[#DCFCE7] text-[#16A34A] rounded-xl cursor-pointer"
                  >
                    <Download size={14} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>

    </div>
  );
};

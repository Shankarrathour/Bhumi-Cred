import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, CheckCircle, XCircle, FileText, Download,
  Camera, History, ShieldCheck, Cloud, Globe, Trees
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { StatusBadge } from '../../../components/ui/StatusBadge';
import { GISMapViewer } from '../../../components/ui/GISMapViewer';
import { colors } from '../../../theme/colors';
import { LatLngExpression } from 'leaflet';
import { useLandVerificationQueue } from '../api/useLand';
import toast from 'react-hot-toast';

export const LandDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'map' | 'photos' | 'documents' | 'history' | 'mrv' | 'insurance' | 'carbon'>('map');
  const [verificationStatus, setVerificationStatus] = useState<'VERIFIED' | 'PENDING' | 'REJECTED'>('VERIFIED');
  const [actionModal, setActionModal] = useState<string | null>(null);

  const { data: queueData } = useLandVerificationQueue();
  const liveLand = queueData?.find(l => l.id === id);

  const safeLat = (liveLand?.coordinates?.lat && typeof liveLand.coordinates.lat === 'number') ? liveLand.coordinates.lat : 23.0225;
  const safeLng = (liveLand?.coordinates?.lng && typeof liveLand.coordinates.lng === 'number') ? liveLand.coordinates.lng : 77.0124;

  const land = {
    id: id || 'LND-8001',
    surveyNumber: liveLand?.survey_number || 'SUR-402/A',
    farmerName: liveLand?.farmer_name || 'Ramesh Patel',
    farmerId: liveLand?.farmer_id || 'F-84920',
    areaAcres: liveLand?.area_acres || 14.5,
    ownershipType: liveLand?.ownership_type || 'Self Owned',
    village: liveLand?.village || 'Ichhawar',
    district: liveLand?.district || 'Sehore',
    state: liveLand?.state || 'Madhya Pradesh',
    isIrrigated: liveLand?.is_irrigated ?? true,
    coordinates: { lat: safeLat, lng: safeLng },
    assignedProject: 'PRJ-1042 MP Agroforestry Carbon Sink Drive',
    treeCount: 850,
    carbonYieldTco2: 145.0,
    insuredTrees: 850,
    insuranceCover: '₹4.25 Lakhs',
  };

  const center: LatLngExpression = [safeLat, safeLng];
  const polygonCoords: LatLngExpression[] = [
    [safeLat - 0.002, safeLng - 0.002],
    [safeLat + 0.002, safeLng - 0.002],
    [safeLat + 0.002, safeLng + 0.002],
    [safeLat - 0.002, safeLng + 0.002],
  ];

  const handleAction = (actionName: string) => {
    setActionModal(null);
    if (actionName === 'Approve Land') setVerificationStatus('VERIFIED');
    if (actionName === 'Reject Land') setVerificationStatus('REJECTED');
    toast.success(`Action "${actionName}" completed successfully!`);
  };

  return (
    <div className="space-y-6 page-enter pb-12" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>

      {/* ── HEADER & ACTION CONTROLS ── */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white border border-[#E8EDF5] rounded-2xl p-5 shadow-xs">
        <div className="flex items-center gap-3.5 min-w-0">
          <button
            onClick={() => navigate('/land')}
            className="w-10 h-10 rounded-xl border border-[#E2E8F0] bg-white flex items-center justify-center text-[#64748B] hover:text-[#0F172A] hover:bg-[#F8FAFC] transition-all cursor-pointer"
            title="Back to Land List"
          >
            <ArrowLeft size={18} />
          </button>
          <div className="w-11 h-11 rounded-2xl bg-[#F0FDF4] border border-[#DCFCE7] flex items-center justify-center text-[#16A34A] shrink-0">
            <Globe size={22} />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-[22px] font-bold text-[#0F172A] leading-tight">Parcel ID: {land.id}</h1>
              <StatusBadge status={verificationStatus === 'VERIFIED' ? 'success' : verificationStatus === 'REJECTED' ? 'danger' : 'warning'} label={verificationStatus} />
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#EFF6FF] text-[#2563EB] border border-[#DBEAFE]">
                {land.areaAcres} Acres
              </span>
            </div>
            <p className="text-[13px] text-[#64748B] mt-0.5">
              Owner: <span className="font-bold text-[#0F172A]">{land.farmerName} ({land.farmerId})</span> • Khasra/Survey: <span className="font-mono text-[#0F172A] font-bold">{land.surveyNumber}</span> • Location: {land.village}, {land.district}, {land.state}
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setActionModal('Reject Land')}
            className="px-3.5 py-2 bg-white border border-[#FECACA] hover:bg-[#FEF2F2] text-[#EF4444] font-bold text-[12.5px] rounded-xl transition-all cursor-pointer flex items-center gap-1.5"
          >
            <XCircle size={14} /> Reject Land
          </button>
          <button
            onClick={() => setActionModal('Approve Land')}
            className="px-3.5 py-2 bg-[#16A34A] hover:bg-[#15803D] text-white font-bold text-[12.5px] rounded-xl shadow-xs transition-all cursor-pointer flex items-center gap-1.5"
          >
            <CheckCircle size={14} /> Approve & Verify GIS
          </button>
        </div>
      </div>

      {/* ── TABS BAR (7 BRD Land Detail Sections) ── */}
      <div className="flex items-center gap-2 border-b border-[#E8EDF5] overflow-x-auto pb-1 scrollbar-none">
        {[
          { id: 'map', label: 'Map & GIS Polygon', icon: Globe },
          { id: 'photos', label: 'Ground & Drone Photos', icon: Camera },
          { id: 'documents', label: 'Land Registry Documents', icon: FileText },
          { id: 'history', label: 'Audit History', icon: History },
          { id: 'mrv', label: 'MRV Telemetry & Canopy', icon: Trees },
          { id: 'insurance', label: 'Tree Insurance', icon: ShieldCheck },
          { id: 'carbon', label: 'Carbon Sequestration Yield', icon: Cloud },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-[13px] transition-all whitespace-nowrap cursor-pointer ${
                isActive
                  ? 'bg-[#F0FDF4] text-[#16A34A] border border-[#DCFCE7]'
                  : 'text-[#64748B] hover:text-[#0F172A] hover:bg-[#F8FAFC]'
              }`}
            >
              <Icon size={16} className={isActive ? 'text-[#16A34A]' : 'text-[#94A3B8]'} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* ── TAB CONTENT AREA ── */}
      <div className="bg-white border border-[#E8EDF5] rounded-2xl p-6 shadow-xs min-h-[420px]">

        {/* 1. MAP & GIS POLYGON */}
        {activeTab === 'map' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-8 rounded-2xl overflow-hidden border border-[#E8EDF5] shadow-xs">
              <GISMapViewer
                center={center}
                polygons={[
                  {
                    id: land.id,
                    positions: polygonCoords,
                    color: colors.primary.green,
                    popupInfo: (
                      <div>
                        <strong>Parcel: {land.id}</strong><br />
                        Owner: {land.farmerName}<br />
                        Area: {land.areaAcres} Acres
                      </div>
                    ),
                  },
                ]}
                height="500px"
              />
            </div>

            <div className="lg:col-span-4 space-y-4">
              <h3 className="text-[15px] font-bold text-[#0F172A] border-b border-[#F1F5F9] pb-3">GIS Boundary Parameters</h3>
              <div className="p-4 bg-[#FAFCFF] border border-[#F1F5F9] rounded-2xl space-y-3 text-[13px]">
                <div><span className="text-[#94A3B8] text-[11px] uppercase font-bold block">Parcel ID & Khasra</span><span className="font-bold text-[#0F172A]">{land.id} ({land.surveyNumber})</span></div>
                <div><span className="text-[#94A3B8] text-[11px] uppercase font-bold block">Total Geofenced Acreage</span><span className="font-extrabold text-[#16A34A]">{land.areaAcres} Acres</span></div>
                <div><span className="text-[#94A3B8] text-[11px] uppercase font-bold block">Assigned Project</span><span className="font-semibold text-[#2563EB]">{land.assignedProject}</span></div>
                <div><span className="text-[#94A3B8] text-[11px] uppercase font-bold block">GPS Center Coordinates</span><span className="font-mono text-[#0F172A]">Lat: {land.coordinates.lat}, Lng: {land.coordinates.lng}</span></div>
              </div>

              <div className="p-4 bg-[#F0FDF4] border border-[#DCFCE7] rounded-2xl space-y-2 text-[12px]">
                <div className="flex items-center justify-between"><span className="text-[#16A34A] font-bold">Polygon Geometry Match</span><CheckCircle size={16} className="text-[#16A34A]" /></div>
                <div className="flex items-center justify-between"><span className="text-[#16A34A] font-bold">AI Duplicate Scan</span><CheckCircle size={16} className="text-[#16A34A]" /></div>
                <div className="flex items-center justify-between"><span className="text-[#16A34A] font-bold">Revenue Record Match</span><CheckCircle size={16} className="text-[#16A34A]" /></div>
              </div>
            </div>
          </div>
        )}

        {/* 2. PHOTOS */}
        {activeTab === 'photos' && (
          <div className="space-y-6">
            <h3 className="text-[15px] font-bold text-[#0F172A] border-b border-[#F1F5F9] pb-3 flex items-center gap-2">
              <Camera size={18} className="text-[#16A34A]" /> Ground Inspection & Drone Inspection Photos
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {[
                { title: 'Drone Canopy Survey #1', tag: 'Geo-tagged Drone', date: '02 Aug 2026' },
                { title: 'Ground Inspection Plot Marker', tag: 'GPS Verification', date: '01 Aug 2026' },
                { title: 'Soil Quality Sample Location', tag: 'Lab Sample Site', date: '28 Jul 2026' },
              ].map((ph, idx) => (
                <div key={idx} className="border border-[#E8EDF5] rounded-2xl overflow-hidden bg-white space-y-2 p-3">
                  <div className="w-full h-40 bg-slate-100 rounded-xl flex items-center justify-center text-[#94A3B8] font-bold text-[12px] border border-dashed border-[#CBD5E1]">
                    📷 Photo Inspection Sample #{idx + 1}
                  </div>
                  <div className="text-[13px] font-bold text-[#0F172A]">{ph.title}</div>
                  <div className="flex items-center justify-between text-[11px] text-[#64748B]">
                    <span>{ph.tag}</span>
                    <span>{ph.date}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 3. DOCUMENTS */}
        {activeTab === 'documents' && (
          <div className="space-y-6">
            <h3 className="text-[15px] font-bold text-[#0F172A] border-b border-[#F1F5F9] pb-3 flex items-center gap-2">
              <FileText size={18} className="text-[#2563EB]" /> Official Land Registry & Khasra Documents
            </h3>
            <div className="space-y-3">
              {[
                { name: 'Khasra_Khatauni_7_12_Extract_2026.pdf', size: '2.4 MB', date: '15 Jan 2026' },
                { name: 'Patwari_Land_Ownership_Verification_Certificate.pdf', size: '1.8 MB', date: '20 Jan 2026' },
                { name: 'Encumbrance_Certificate_NOC.pdf', size: '1.2 MB', date: '02 Feb 2026' },
              ].map((doc, idx) => (
                <div key={idx} className="p-4 border border-[#E8EDF5] rounded-2xl bg-[#FAFCFF] flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#EFF6FF] text-[#2563EB] flex items-center justify-center font-bold">
                      <FileText size={20} />
                    </div>
                    <div>
                      <h4 className="text-[13.5px] font-bold text-[#0F172A]">{doc.name}</h4>
                      <p className="text-[11.5px] text-[#64748B]">{doc.size} • Uploaded on {doc.date}</p>
                    </div>
                  </div>
                  <button onClick={() => toast.success(`Downloading ${doc.name}`)} className="btn btn-secondary btn-sm flex items-center gap-1.5 cursor-pointer">
                    <Download size={14} /> Download PDF
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 4. HISTORY */}
        {activeTab === 'history' && (
          <div className="space-y-6">
            <h3 className="text-[15px] font-bold text-[#0F172A] border-b border-[#F1F5F9] pb-3 flex items-center gap-2">
              <History size={18} className="text-[#8B5CF6]" /> Cadastral Audit & Verification Trail
            </h3>
            <div className="relative pl-6 space-y-4 border-l-2 border-[#E2E8F0] ml-2">
              {[
                { title: 'Project Assignment', desc: 'Assigned to PRJ-1042 MP Agroforestry Carbon Sink Drive', date: '02 Aug 2026' },
                { title: 'GIS Polygon Approval', desc: 'Verified by Lead GIS Administrator (Zero Overlap)', date: '01 Aug 2026' },
                { title: 'AI Duplicate Overlap Scan', desc: 'Passed AI Geometry scan with 0% overlap match', date: '28 Jul 2026' },
                { title: 'Initial Land Onboarding', desc: 'Submitted by farmer Ramesh Patel via Mobile App', date: '20 Jul 2026' },
              ].map((h, idx) => (
                <div key={idx} className="relative">
                  <span className="absolute -left-[31px] top-1 w-3 h-3 rounded-full bg-[#16A34A] border-2 border-white" />
                  <p className="text-[11px] font-bold text-[#94A3B8]">{h.date}</p>
                  <p className="text-[13.5px] font-bold text-[#0F172A]">{h.title}</p>
                  <p className="text-[12px] text-[#64748B]">{h.desc}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 5. MRV */}
        {activeTab === 'mrv' && (
          <div className="space-y-6">
            <h3 className="text-[15px] font-bold text-[#0F172A] border-b border-[#F1F5F9] pb-3 flex items-center gap-2">
              <Trees size={18} className="text-[#16A34A]" /> MRV Drone Telemetry & Biomass Estimates
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-[#F0FDF4] border border-[#DCFCE7] rounded-2xl">
                <span className="text-[11px] font-bold uppercase text-[#16A34A]">Tree Stock Density</span>
                <p className="text-[24px] font-extrabold text-[#16A34A] mt-1">{land.treeCount} Trees</p>
                <span className="text-[11.5px] text-[#64748B]">58 Trees / Acre average</span>
              </div>
              <div className="p-4 bg-[#EFF6FF] border border-[#DBEAFE] rounded-2xl">
                <span className="text-[11px] font-bold uppercase text-[#2563EB]">Biomass Volume</span>
                <p className="text-[24px] font-extrabold text-[#2563EB] mt-1">420 Tons</p>
                <span className="text-[11.5px] text-[#64748B]">Estimated via Sentinel-2 satellite</span>
              </div>
              <div className="p-4 bg-[#F5F3FF] border border-[#DDD6FE] rounded-2xl">
                <span className="text-[11px] font-bold uppercase text-[#8B5CF6]">Canopy Cover</span>
                <p className="text-[24px] font-extrabold text-[#8B5CF6] mt-1">68.4%</p>
                <span className="text-[11.5px] text-[#64748B]">Healthy growth rate</span>
              </div>
            </div>
          </div>
        )}

        {/* 6. INSURANCE */}
        {activeTab === 'insurance' && (
          <div className="space-y-6">
            <h3 className="text-[15px] font-bold text-[#0F172A] border-b border-[#F1F5F9] pb-3 flex items-center gap-2">
              <ShieldCheck size={18} className="text-[#8B5CF6]" /> Active Tree Insurance Policies
            </h3>
            <div className="p-5 border border-[#E8EDF5] bg-[#FAFCFF] rounded-2xl flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold text-[#8B5CF6] bg-[#F5F3FF] px-2 py-0.5 rounded-md border border-[#DDD6FE]">ACTIVE POLICY</span>
                <h4 className="text-[15px] font-bold text-[#0F172A] mt-1">EcoShield Comprehensive Tree Cover Policy</h4>
                <p className="text-[12px] text-[#64748B]">Covered Trees: {land.insuredTrees} • Maximum Claim Cover: {land.insuranceCover}</p>
              </div>
              <button onClick={() => toast.success('Downloading Insurance Certificate')} className="btn btn-secondary btn-sm">
                Policy Document
              </button>
            </div>
          </div>
        )}

        {/* 7. CARBON */}
        {activeTab === 'carbon' && (
          <div className="space-y-6">
            <h3 className="text-[15px] font-bold text-[#0F172A] border-b border-[#F1F5F9] pb-3 flex items-center gap-2">
              <Cloud size={18} className="text-[#16A34A]" /> Annual Carbon Credit Yield Estimate
            </h3>
            <div className="p-5 border border-[#DCFCE7] bg-[#F0FDF4] rounded-2xl flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold uppercase text-[#16A34A]">Estimated Carbon Sequestration</span>
                <p className="text-[28px] font-extrabold text-[#16A34A]">{land.carbonYieldTco2} tCO₂e / Year</p>
                <p className="text-[12px] text-[#64748B]">Verra / Gold Standard Certified Project Registry</p>
              </div>
              <StatusBadge status="success" label="VERIFIED CARBON YIELD" />
            </div>
          </div>
        )}

      </div>

      {/* ── ACTION DIALOG MODAL ── */}
      <AnimatePresence>
        {actionModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-2xl border border-[#E8EDF5] space-y-4"
            >
              <h3 className="text-[15px] font-bold text-[#0F172A]">Confirm {actionModal}</h3>
              <p className="text-[12px] text-[#64748B]">
                Are you sure you want to perform <strong>{actionModal}</strong> for parcel {land.id}?
              </p>
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#F1F5F9]">
                <button onClick={() => setActionModal(null)} className="btn btn-secondary btn-sm">Cancel</button>
                <button onClick={() => handleAction(actionModal)} className="btn btn-primary btn-sm">Confirm</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};

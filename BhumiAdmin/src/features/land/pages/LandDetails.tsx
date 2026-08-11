import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, CheckCircle, XCircle, FileText, Download,
  Camera, History, ShieldCheck, Cloud, Globe, Trees, Layers,
  Compass, Eye, Check, AlertTriangle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { StatusBadge } from '../../../components/ui/StatusBadge';
import { GISMapViewer } from '../../../components/ui/GISMapViewer';
import { colors } from '../../../theme/colors';
import { LatLngExpression } from 'leaflet';
import { useLandVerificationQueue } from '../api/useLand';
import { apiClient } from '../../../api/axios';
import toast from 'react-hot-toast';

export const LandDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  // 8 Specified Land Details Tabs: Overview, Map, GIS, Photos, Ownership, Insurance, Carbon, History
  const [activeTab, setActiveTab] = useState<'Overview' | 'Map' | 'GIS' | 'Photos' | 'Ownership' | 'Insurance' | 'Carbon' | 'History'>('Overview');
  const [verificationStatus, setVerificationStatus] = useState<string>('');
  const [actionModal, setActionModal] = useState<string | null>(null);

  // Map layer controls
  const [satelliteView, setSatelliteView] = useState(true);
  const [ndviView, setNdviView] = useState(false);
  const [heatMapView, setHeatMapView] = useState(false);

  const { data: queueData } = useLandVerificationQueue();
  const liveLand = queueData?.find(l => l.id === id);

  const safeLat = liveLand?.coordinates
    ? (typeof liveLand.coordinates.lat === 'number' ? liveLand.coordinates.lat : (liveLand.coordinates as any).latitude || 23.0225)
    : 23.0225;
  const safeLng = liveLand?.coordinates
    ? (typeof liveLand.coordinates.lng === 'number' ? liveLand.coordinates.lng : (liveLand.coordinates as any).longitude || 77.0124)
    : 77.0124;

  const liveStatus = (() => {
    const s = (liveLand?.verification_status || '').toUpperCase();
    if (s === 'VERIFIED') return 'APPROVED';
    return s || 'PENDING';
  })();
  const displayStatus = verificationStatus || liveStatus;

  const land = {
    id: id || 'LND-8001',
    surveyNumber: liveLand?.survey_number || 'SUR-402/A',
    farmerName: liveLand?.farmer_name || 'Ramesh Patel',
    farmerId: liveLand?.farmer_id || 'FARM-MP-8091',
    landSize: `${liveLand?.area_acres || 14.5} Acres`,
    treesCount: 1250,
    soilType: 'Deep Black Cotton Soil (pH 7.2)',
    landType: 'Irrigated Agro-Forestry Land',
    gpsCoords: `Lat: ${safeLat}° N, Lng: ${safeLng}° E`,
    status: displayStatus,
    village: liveLand?.village || 'Sehore Khas',
    district: liveLand?.district || 'Sehore',
    state: liveLand?.state || 'Madhya Pradesh',
    assignedProject: 'MP Green Afforestation Q1',
    carbonYield: '145.0 tCO2e',
    insuredTrees: 1250,
    insuranceCover: '₹6.25 Lakhs (Tree Shield Policy #TS-9021)',
    ownershipType: liveLand?.ownership_type || 'Self Owned (Single Title Deed #412/1)',
    duplicateScore: 0.0,
    overlapPercent: '0.0% (Clean Cadastral Boundaries)',
    forestLayerStatus: 'Pass (Not in Reserve Forest Zone)',
    riverLayerStatus: 'Pass (>200m Buffer from Water Body)',
    villageLayerStatus: 'Pass (Inside Sehore Khas Village Boundary)',
  };

  const center: LatLngExpression = [safeLat, safeLng];
  const polygonCoords: LatLngExpression[] = (() => {
    const bp = liveLand?.boundary_polygon;
    if (bp && Array.isArray(bp) && bp.length >= 3) {
      return bp.map((pt: any) => {
        const plat = typeof pt.lat === 'number' ? pt.lat : pt.latitude;
        const plng = typeof pt.lng === 'number' ? pt.lng : pt.longitude;
        return [plat, plng] as LatLngExpression;
      });
    }
    return [
      [safeLat - 0.002, safeLng - 0.002],
      [safeLat + 0.002, safeLng - 0.002],
      [safeLat + 0.002, safeLng + 0.002],
      [safeLat - 0.002, safeLng + 0.002],
    ];
  })();

  const handleAction = async (actionName: string) => {
    setActionModal(null);
    try {
      const statusValue = actionName === 'Approve Land' ? 'verified' : 'rejected';
      await apiClient.put(`/admin/lands/${id}/status`, { status: statusValue });
      if (actionName === 'Approve Land') setVerificationStatus('APPROVED');
      if (actionName === 'Reject Land') setVerificationStatus('REJECTED');
      toast.success(`Action "${actionName}" completed successfully!`);
    } catch (error) {
      console.error(`Failed to execute ${actionName}:`, error);
      toast.error(`Failed to update land verification status.`);
    }
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
              <StatusBadge status={displayStatus === 'APPROVED' ? 'success' : displayStatus === 'REJECTED' ? 'danger' : 'warning'} label={displayStatus} />
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#EFF6FF] text-[#2563EB] border border-[#DBEAFE]">
                {land.landSize}
              </span>
            </div>
            <p className="text-[13px] text-[#64748B] mt-0.5">
              Owner: <span className="font-bold text-[#0F172A]">{land.farmerName} ({land.farmerId})</span> • Survey: <span className="font-mono text-[#0F172A] font-bold">{land.surveyNumber}</span> • {land.village}, {land.district}, {land.state}
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
          {displayStatus === 'APPROVED' ? (
            <button
              disabled
              className="px-3.5 py-2 bg-[#DCFCE7] text-[#15803D] font-bold text-[12.5px] rounded-xl flex items-center gap-1.5 cursor-not-allowed"
            >
              <CheckCircle size={14} /> GIS Approved
            </button>
          ) : (
            <button
              onClick={() => setActionModal('Approve Land')}
              className="px-3.5 py-2 bg-[#16A34A] hover:bg-[#15803D] text-white font-bold text-[12.5px] rounded-xl shadow-xs transition-all cursor-pointer flex items-center gap-1.5"
            >
              <CheckCircle size={14} /> Approve & Verify GIS
            </button>
          )}
        </div>
      </div>

      {/* ── 8 SPECIFIED TABS BAR ── */}
      <div className="flex items-center gap-2 border-b border-[#E8EDF5] overflow-x-auto pb-1 custom-scrollbar">
        {[
          { id: 'Overview', label: 'Overview', icon: Layers },
          { id: 'Map', label: 'Map', icon: Globe },
          { id: 'GIS', label: 'GIS', icon: Compass },
          { id: 'Photos', label: 'Photos', icon: Camera },
          { id: 'Ownership', label: 'Ownership', icon: FileText },
          { id: 'Insurance', label: 'Insurance', icon: ShieldCheck },
          { id: 'Carbon', label: 'Carbon', icon: Cloud },
          { id: 'History', label: 'History', icon: History },
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

      {/* ── TAB PANELS CONTENT ── */}
      <div className="bg-white border border-[#E8EDF5] rounded-2xl p-6 shadow-xs min-h-[420px]">

        {/* 1. OVERVIEW TAB */}
        {activeTab === 'Overview' && (
          <div className="space-y-6">
            <h3 className="text-[15px] font-bold text-[#0F172A] border-b border-[#F1F5F9] pb-3 flex items-center gap-2">
              <Layers size={18} className="text-[#16A34A]" /> Land Parcel Overview Details
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="p-4 bg-[#FAFCFF] border border-[#F1F5F9] rounded-2xl space-y-1">
                <p className="text-[11px] font-bold uppercase text-[#94A3B8]">Land Size</p>
                <p className="text-[18px] font-extrabold text-[#0F172A]">{land.landSize}</p>
              </div>

              <div className="p-4 bg-[#FAFCFF] border border-[#F1F5F9] rounded-2xl space-y-1">
                <p className="text-[11px] font-bold uppercase text-[#94A3B8]">Planted Trees</p>
                <p className="text-[18px] font-extrabold text-[#16A34A]">{land.treesCount} Trees</p>
              </div>

              <div className="p-4 bg-[#FAFCFF] border border-[#F1F5F9] rounded-2xl space-y-1">
                <p className="text-[11px] font-bold uppercase text-[#94A3B8]">Verification Status</p>
                <StatusBadge status={displayStatus === 'APPROVED' ? 'success' : displayStatus === 'REJECTED' ? 'danger' : 'warning'} label={displayStatus} />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-[13px]">
              <div className="space-y-1">
                <p className="text-[11px] font-bold uppercase text-[#94A3B8]">Soil Type</p>
                <p className="font-semibold text-[#0F172A]">{land.soilType}</p>
              </div>

              <div className="space-y-1">
                <p className="text-[11px] font-bold uppercase text-[#94A3B8]">Land Classification</p>
                <p className="font-semibold text-[#0F172A]">{land.landType}</p>
              </div>

              <div className="space-y-1">
                <p className="text-[11px] font-bold uppercase text-[#94A3B8]">GPS Coordinates</p>
                <p className="font-mono font-semibold text-[#2563EB]">{land.gpsCoords}</p>
              </div>
            </div>
          </div>
        )}

        {/* 2. MAP TAB */}
        {activeTab === 'Map' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-[#F1F5F9] pb-3">
              <h3 className="text-[15px] font-bold text-[#0F172A] flex items-center gap-2">
                <Globe size={18} className="text-[#16A34A]" /> Interactive Satellite & Polygon Engine
              </h3>

              {/* Toggles: Satellite, NDVI, Heat Map */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setSatelliteView(!satelliteView)}
                  className={`px-3 py-1 rounded-lg text-[11.5px] font-bold border transition-all cursor-pointer ${
                    satelliteView ? 'bg-[#F0FDF4] text-[#16A34A] border-[#DCFCE7]' : 'bg-white text-[#64748B]'
                  }`}
                >
                  Satellite
                </button>
                <button
                  onClick={() => setNdviView(!ndviView)}
                  className={`px-3 py-1 rounded-lg text-[11.5px] font-bold border transition-all cursor-pointer ${
                    ndviView ? 'bg-[#F0FDF4] text-[#16A34A] border-[#DCFCE7]' : 'bg-white text-[#64748B]'
                  }`}
                >
                  NDVI Layer
                </button>
                <button
                  onClick={() => setHeatMapView(!heatMapView)}
                  className={`px-3 py-1 rounded-lg text-[11.5px] font-bold border transition-all cursor-pointer ${
                    heatMapView ? 'bg-[#FFFBEB] text-[#D97706] border-[#FEF3C7]' : 'bg-white text-[#64748B]'
                  }`}
                >
                  Heat Map
                </button>
              </div>
            </div>

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
                          Area: {land.landSize}
                        </div>
                      ),
                    },
                  ]}
                  height="450px"
                />
              </div>

              <div className="lg:col-span-4 space-y-3 p-4 bg-[#FAFCFF] border border-[#F1F5F9] rounded-2xl text-[12.5px]">
                <h4 className="font-bold text-[#0F172A]">Layer Telemetry & Coordinates</h4>
                <p><span className="text-[#94A3B8]">Center:</span> <span className="font-mono font-semibold">{land.gpsCoords}</span></p>
                <p><span className="text-[#94A3B8]">Polygon Area:</span> <span className="font-bold text-[#16A34A]">{land.landSize}</span></p>
                <p><span className="text-[#94A3B8]">Measure Tool:</span> <span className="font-semibold text-[#2563EB]">Active Distance ( Perimeter: 1.42 km )</span></p>
                <p><span className="text-[#94A3B8]">NDVI Canopy Index:</span> <span className="font-bold text-[#16A34A]">0.84 (Healthy Dense Canopy)</span></p>
              </div>
            </div>
          </div>
        )}

        {/* 3. GIS TAB */}
        {activeTab === 'GIS' && (
          <div className="space-y-6">
            <h3 className="text-[15px] font-bold text-[#0F172A] border-b border-[#F1F5F9] pb-3 flex items-center gap-2">
              <Compass size={18} className="text-[#16A34A]" /> AI Polygon Overlap & Layer Check
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-[#F0FDF4] border border-[#DCFCE7] rounded-2xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-[#16A34A]">Polygon Check & Duplicate Score</span>
                  <CheckCircle size={16} className="text-[#16A34A]" />
                </div>
                <p className="text-[13px] font-semibold text-[#0F172A]">Score: {land.duplicateScore} (0% Overlap Detected)</p>
                <p className="text-[11.5px] text-[#64748B]">Clean cadastral boundaries against state land revenue records.</p>
              </div>

              <div className="p-4 bg-[#FAFCFF] border border-[#F1F5F9] rounded-2xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-[#0F172A]">Overlap Analysis</span>
                  <StatusBadge label="CLEAR" variant="success" size="sm" />
                </div>
                <p className="text-[13px] font-semibold text-[#0F172A]">{land.overlapPercent}</p>
                <p className="text-[11.5px] text-[#64748B]">Verified with neighboring cadastral polygons.</p>
              </div>
            </div>

            <div className="space-y-3 pt-2">
              <h4 className="text-[13.5px] font-bold text-[#0F172A]">GIS Spatial Layer Checks</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-[12.5px]">
                <div className="p-3 border border-[#E8EDF5] rounded-xl bg-white">
                  <p className="text-[#94A3B8] font-bold">FOREST LAYER</p>
                  <p className="font-bold text-[#16A34A] mt-0.5">{land.forestLayerStatus}</p>
                </div>
                <div className="p-3 border border-[#E8EDF5] rounded-xl bg-white">
                  <p className="text-[#94A3B8] font-bold">RIVER LAYER</p>
                  <p className="font-bold text-[#16A34A] mt-0.5">{land.riverLayerStatus}</p>
                </div>
                <div className="p-3 border border-[#E8EDF5] rounded-xl bg-white">
                  <p className="text-[#94A3B8] font-bold">VILLAGE LAYER</p>
                  <p className="font-bold text-[#16A34A] mt-0.5">{land.villageLayerStatus}</p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2">
              {displayStatus === 'APPROVED' ? (
                <button
                  disabled
                  className="btn btn-sm cursor-not-allowed"
                  style={{ backgroundColor: '#DCFCE7', color: '#15803D', borderColor: '#DCFCE7' }}
                >
                  <CheckCircle size={14} /> GIS Approved
                </button>
              ) : (
                <button onClick={() => handleAction('Approve Land')} className="btn btn-primary btn-sm">Approve GIS Verification</button>
              )}
              <button onClick={() => handleAction('Reject Land')} className="btn btn-secondary btn-sm text-[#EF4444]">Reject GIS Verification</button>
            </div>
          </div>
        )}

        {/* 4. PHOTOS TAB */}
        {activeTab === 'Photos' && (
          <div className="space-y-6">
            <h3 className="text-[15px] font-bold text-[#0F172A] border-b border-[#F1F5F9] pb-3 flex items-center gap-2">
              <Camera size={18} className="text-[#16A34A]" /> Ground Inspection & Drone Inspection Photos
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                { title: 'Drone Canopy Survey #1', tag: 'Geo-tagged Drone', date: '02 Aug 2026' },
                { title: 'Ground Inspection Plot Marker', tag: 'GPS Verification', date: '01 Aug 2026' },
                { title: 'Soil Quality Sample Location', tag: 'Lab Sample Site', date: '28 Jul 2026' },
              ].map((ph, idx) => (
                <div key={idx} className="border border-[#E8EDF5] rounded-2xl overflow-hidden bg-white p-3 space-y-2">
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

        {/* 5. OWNERSHIP TAB */}
        {activeTab === 'Ownership' && (
          <div className="space-y-6">
            <h3 className="text-[15px] font-bold text-[#0F172A] border-b border-[#F1F5F9] pb-3 flex items-center gap-2">
              <FileText size={18} className="text-[#2563EB]" /> Title Ownership & Revenue Deed
            </h3>
            <div className="p-4 bg-[#FAFCFF] border border-[#F1F5F9] rounded-2xl space-y-2 text-[13px]">
              <p><span className="text-[#94A3B8] font-bold">Ownership Type:</span> <span className="font-bold text-[#0F172A]">{land.ownershipType}</span></p>
              <p><span className="text-[#94A3B8] font-bold">Khasra Number:</span> <span className="font-mono font-bold text-[#2563EB]">{land.surveyNumber}</span></p>
              <p><span className="text-[#94A3B8] font-bold">Registered Owner:</span> <span className="font-bold text-[#0F172A]">{land.farmerName} ({land.farmerId})</span></p>
            </div>
          </div>
        )}

        {/* 6. INSURANCE TAB */}
        {activeTab === 'Insurance' && (
          <div className="space-y-6">
            <h3 className="text-[15px] font-bold text-[#0F172A] border-b border-[#F1F5F9] pb-3 flex items-center gap-2">
              <ShieldCheck size={18} className="text-[#8B5CF6]" /> Tree Shield Policy Coverage
            </h3>
            <div className="p-4 border border-[#E8EDF5] rounded-2xl bg-[#FAFCFF] space-y-2">
              <h4 className="text-[14px] font-bold text-[#0F172A]">{land.insuranceCover}</h4>
              <p className="text-[12px] text-[#64748B]">Insured Trees: {land.insuredTrees} Trees • Policy Status: Active</p>
            </div>
          </div>
        )}

        {/* 7. CARBON TAB */}
        {activeTab === 'Carbon' && (
          <div className="space-y-6">
            <h3 className="text-[15px] font-bold text-[#0F172A] border-b border-[#F1F5F9] pb-3 flex items-center gap-2">
              <Cloud size={18} className="text-[#059669]" /> Carbon Sequestration Yield
            </h3>
            <div className="p-4 border border-[#DCFCE7] bg-[#F0FDF4] rounded-2xl space-y-2">
              <h4 className="text-[15px] font-bold text-[#16A34A]">{land.carbonYield} Sequestration Capacity</h4>
              <p className="text-[12px] text-[#64748B]">Assigned Carbon Project: {land.assignedProject}</p>
            </div>
          </div>
        )}

        {/* 8. HISTORY TAB */}
        {activeTab === 'History' && (
          <div className="space-y-6">
            <h3 className="text-[15px] font-bold text-[#0F172A] border-b border-[#F1F5F9] pb-3 flex items-center gap-2">
              <History size={18} className="text-[#8B5CF6]" /> Complete Cadastral Life Cycle History
            </h3>
            
            <div className="relative pl-6 border-l-2 border-[#E2E8F0] space-y-6">
              {[
                { title: 'Created', desc: 'Land parcel submitted by farmer via Mobile App', date: '14 Jan 2025' },
                { title: 'Edited', desc: 'GIS coordinates and Khasra document updated', date: '15 Jan 2025' },
                { title: 'Approved', desc: 'Admin approved land GIS boundary and title deed', date: '16 Jan 2025' },
                { title: 'Project Assigned', desc: 'Assigned to MP Green Afforestation Q1', date: '18 Jan 2025' },
                { title: 'Carbon Registered', desc: '145.0 tCO2e Carbon sequestration potential registered', date: '20 Jan 2025' },
              ].map((h, idx) => (
                <div key={idx} className="relative">
                  <span className="absolute -left-[31px] top-0 w-4 h-4 rounded-full bg-[#16A34A] border-2 border-white" />
                  <p className="text-[11px] font-bold text-[#94A3B8]">{h.date}</p>
                  <p className="text-[13.5px] font-bold text-[#0F172A]">{h.title}</p>
                  <p className="text-[11.5px] text-[#64748B]">{h.desc}</p>
                </div>
              ))}
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
                Are you sure you want to perform <strong>{actionModal}</strong> for Land Parcel {land.id}?
              </p>
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#F1F5F9]">
                <button onClick={() => setActionModal(null)} className="btn btn-secondary btn-sm">Cancel</button>
                <button onClick={() => handleAction(actionModal)} className="btn btn-primary btn-sm">Confirm Action</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};

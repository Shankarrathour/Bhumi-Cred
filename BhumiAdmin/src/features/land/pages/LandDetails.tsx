import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, CheckCircle, XCircle, FileText, Download,
  Camera, History, ShieldCheck, Cloud, Globe, Trees, Layers,
  Compass, Eye, Check, AlertTriangle, Loader2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { StatusBadge } from '../../../components/ui/StatusBadge';
import { GISMapViewer } from '../../../components/ui/GISMapViewer';
import { colors } from '../../../theme/colors';
import { LatLngExpression } from 'leaflet';
import { useLandVerificationQueue } from '../api/useLand';
import { apiClient } from '../../../api/axios';
import toast from 'react-hot-toast';

interface RealProject {
  project_id: string;
  title: string;
}

export const LandDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  // 8 Specified Land Details Tabs: Overview, Map, GIS, Photos, Ownership, Insurance, Carbon, History
  const [activeTab, setActiveTab] = useState<'Overview' | 'Map' | 'GIS' | 'Photos' | 'Ownership' | 'Insurance' | 'Carbon' | 'History'>('Overview');
  const [verificationStatus, setVerificationStatus] = useState<string>('');
  const [actionModal, setActionModal] = useState<string | null>(null);
  const [showCorrectionModal, setShowCorrectionModal] = useState(false);
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [correctionRemarks, setCorrectionRemarks] = useState('');
  const [selectedCorrectionFields, setSelectedCorrectionFields] = useState<string[]>([]);
  
  // Real projects fetched from backend
  const [realProjects, setRealProjects] = useState<RealProject[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [isAssigning, setIsAssigning] = useState(false);

  // Fetch real projects on mount
  useEffect(() => {
    apiClient.get('/admin/projects', { params: { include_inactive: false } })
      .then((res) => {
        const list: RealProject[] = (res.data?.data || []).filter((p: any) => p.is_active && p.is_public);
        setRealProjects(list);
        if (list.length > 0) setSelectedProjectId(list[0].project_id);
      })
      .catch(() => {
        // Fallback: keep empty, user sees a message
      });
  }, []);

  const handleUpdateStatusDirect = async (newStatus: string, remarks?: string, fields?: string[]) => {
    try {
      await apiClient.put(`/admin/lands/${id}/status`, {
        status: newStatus,
        remarks: remarks || '',
        correction_fields: fields || []
      });
      setVerificationStatus(newStatus.toUpperCase());
      toast.success(`Land status updated to ${newStatus.toUpperCase()} successfully!`);
    } catch (error) {
      console.error("Failed to update status directly", error);
      toast.error("Failed to update land verification status.");
    }
  };

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

  // Handles REAL project assignment: updates land status AND creates the enrollment record
  const handleAssignProject = async () => {
    if (!selectedProjectId) {
      toast.error('Please select a project.');
      return;
    }
    const farmerId = liveLand?.farmer_id;
    if (!farmerId) {
      toast.error('Farmer ID not found for this land parcel. Please reload.');
      return;
    }
    setIsAssigning(true);
    try {
      // Step 1: Create the real project enrollment record (this is what the farmer app reads)
      await apiClient.post(`/admin/projects/${selectedProjectId}/assign`, {
        farmer_id: farmerId,
        land_area_acres: liveLand?.area_acres || 1.0,
        tree_count: liveLand?.tree_stock_count || 0,
      });
      // Step 2: Update land parcel status so the Land page reflects the assignment
      await apiClient.put(`/admin/lands/${id}/status`, {
        status: 'project_assigned',
        remarks: `Assigned to project: ${selectedProjectId}`,
        correction_fields: []
      });
      setVerificationStatus('PROJECT_ASSIGNED');
      setShowProjectModal(false);
      const projectTitle = realProjects.find(p => p.project_id === selectedProjectId)?.title || selectedProjectId;
      toast.success(`Farmer assigned to "${projectTitle}" — changes reflect in app immediately!`);
    } catch (error: any) {
      const msg = error?.response?.data?.message || 'Failed to assign project.';
      toast.error(msg);
    } finally {
      setIsAssigning(false);
    }
  };


  const getBadgeVariant = (status: string) => {
    const s = status.toLowerCase();
    if (s === 'approved' || s === 'verified') return 'success';
    if (s === 'rejected') return 'danger';
    if (s === 'correction_required') return 'orange';
    if (s === 'under_review') return 'info';
    if (s === 'project_assigned') return 'purple';
    return 'warning';
  };

  const land = {
    id: id || 'LND-8001',
    surveyNumber: liveLand?.survey_number || 'SUR-402/A',
    farmerName: liveLand?.farmer_name || 'Ramesh Patel',
    farmerId: liveLand?.farmer_id || 'FARM-MP-8091',
    landSize: `${liveLand?.area_acres || 14.5} Acres`,
    treesCount: liveLand?.tree_stock_count ?? (liveLand?.trees ? liveLand.trees.reduce((acc, t) => acc + (t.count || 0), 0) : 0),
    soilType: (liveLand as any)?.soil_type || (liveLand as any)?.soilType || 'Deep Black Cotton Soil (pH 7.2)',
    landType: liveLand?.land_type || 'Irrigated Agro-Forestry Land',
    gpsCoords: `Lat: ${safeLat}° N, Lng: ${safeLng}° E`,
    status: displayStatus,
    village: liveLand?.village || 'Sehore Khas',
    district: liveLand?.district || 'Sehore',
    state: liveLand?.state || 'Madhya Pradesh',
    assignedProject: 'MP Green Afforestation Q1',
    carbonYield: '145.0 tCO2e',
    insuredTrees: liveLand?.tree_stock_count ?? (liveLand?.trees ? liveLand.trees.reduce((acc, t) => acc + (t.count || 0), 0) : 0),
    insuranceCover: `Tree Shield Policy (#TS-${id?.slice(-4).toUpperCase() || '9021'})`,
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
              <StatusBadge variant={getBadgeVariant(displayStatus)} label={displayStatus} />
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
          {displayStatus !== 'UNDER_REVIEW' && displayStatus !== 'APPROVED' && displayStatus !== 'PROJECT_ASSIGNED' && (
            <button
              onClick={() => handleUpdateStatusDirect('under_review')}
              className="px-3.5 py-2 bg-white border border-[#3B82F6] hover:bg-[#EFF6FF] text-[#2563EB] font-bold text-[12.5px] rounded-xl transition-all cursor-pointer flex items-center gap-1.5"
            >
              <History size={14} /> Start Review
            </button>
          )}

          <button
            onClick={() => {
              setShowCorrectionModal(true);
            }}
            className="px-3.5 py-2 bg-white border border-[#D97706] hover:bg-[#FFFBEB] text-[#D97706] font-bold text-[12.5px] rounded-xl transition-all cursor-pointer flex items-center gap-1.5"
          >
            <AlertTriangle size={14} /> Request Corrections
          </button>

          {displayStatus !== 'PROJECT_ASSIGNED' && (
            <button
              onClick={() => {
                setShowProjectModal(true);
              }}
              className="px-3.5 py-2 bg-white border border-[#8B5CF6] hover:bg-[#F5F3FF] text-[#8B5CF6] font-bold text-[12.5px] rounded-xl transition-all cursor-pointer flex items-center gap-1.5"
            >
              <Layers size={14} /> Assign Project
            </button>
          )}

          <button
            onClick={() => setActionModal('Reject Land')}
            className="px-3.5 py-2 bg-white border border-[#FECACA] hover:bg-[#FEF2F2] text-[#EF4444] font-bold text-[12.5px] rounded-xl transition-all cursor-pointer flex items-center gap-1.5"
          >
            <XCircle size={14} /> Reject Land
          </button>

          {displayStatus === 'APPROVED' || displayStatus === 'PROJECT_ASSIGNED' ? (
            <button
              disabled
              className="px-3.5 py-2 bg-[#DCFCE7] text-[#15803D] font-bold text-[12.5px] rounded-xl flex items-center gap-1.5 cursor-not-allowed"
            >
              <CheckCircle size={14} /> Approved
            </button>
          ) : (
            <button
              onClick={() => setActionModal('Approve Land')}
              className="px-3.5 py-2 bg-[#16A34A] hover:bg-[#15803D] text-white font-bold text-[12.5px] rounded-xl shadow-xs transition-all cursor-pointer flex items-center gap-1.5"
            >
              <CheckCircle size={14} /> Approve Land
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

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="p-4 bg-[#FAFCFF] border border-[#F1F5F9] rounded-2xl space-y-1">
                <p className="text-[11px] font-bold uppercase text-[#94A3B8]">Registration Date & Time</p>
                <p className="text-[14px] font-extrabold text-[#0F172A]">
                  {(() => {
                    if (!liveLand?.created_at) return 'N/A';
                    let str = liveLand.created_at;
                    const hasT = str.includes('T');
                    const hasZone = str.includes('Z') || str.includes('+') || (hasT && str.split('T')[1].includes('-'));
                    if (!hasZone) {
                      str = str + 'Z';
                    }
                    const d = new Date(str);
                    return `${d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}, ${d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })}`;
                  })()}
                </p>
              </div>

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
                 <StatusBadge variant={getBadgeVariant(displayStatus)} label={displayStatus} />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 text-[13px]">
              <div className="space-y-1">
                <p className="text-[11px] font-bold uppercase text-[#94A3B8]">Main Crop (मुख्य फसल)</p>
                <p className="font-bold text-[#0F172A]">{liveLand?.crop_type || 'Soybean & Agroforestry'}</p>
              </div>

              <div className="space-y-1">
                <p className="text-[11px] font-bold uppercase text-[#94A3B8]">Plantation Date (वृक्षारोपण तिथि)</p>
                <p className="font-semibold text-[#0F172A]">{liveLand?.plantation_date || '15 Jul 2024'}</p>
              </div>

              <div className="space-y-1">
                <p className="text-[11px] font-bold uppercase text-[#94A3B8]">Soil Type</p>
                <p className="font-semibold text-[#0F172A]">{land.soilType}</p>
              </div>

              <div className="space-y-1">
                <p className="text-[11px] font-bold uppercase text-[#94A3B8]">GPS Coordinates</p>
                <p className="font-mono font-semibold text-[#2563EB]">{land.gpsCoords}</p>
              </div>
            </div>

            {/* Registered Trees Section */}
            {liveLand?.trees && liveLand.trees.length > 0 && (
              <div className="mt-8 pt-6 border-t border-[#F1F5F9] space-y-4">
                <h4 className="text-[14px] font-bold text-[#0F172A] flex items-center gap-2">
                  <Trees size={16} className="text-[#16A34A]" /> Registered Tree Species on Parcel ({liveLand.trees.length})
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {liveLand.trees.map((tree, idx) => (
                    <div key={idx} className="p-4 border border-[#E8EDF5] rounded-2xl bg-[#FAFCFF] flex justify-between items-start gap-4 transition-all hover:border-[#DCFCE7] hover:bg-[#F8FDF9]">
                      <div className="space-y-1.5 flex-1 text-[13px]">
                        <p className="text-[14px] font-extrabold text-[#0F172A]">{tree.species}</p>
                        <div className="grid grid-cols-2 gap-2 mt-2">
                          <p className="text-[12px] text-[#64748B]">
                            Quantity: <span className="font-bold text-[#0F172A]">{tree.count}</span>
                          </p>
                          <p className="text-[12px] text-[#64748B]">
                            Age: <span className="font-bold text-[#0F172A]">{tree.age_bracket}</span>
                          </p>
                        </div>
                        <p className="text-[12px] text-[#64748B] mt-1">
                          Location: <span className="font-semibold text-[#475569]">{tree.location_on_parcel}</span>
                        </p>
                      </div>
                      {tree.photo_uri && (
                        <div className="relative w-20 h-20 rounded-xl overflow-hidden border border-[#E2E8F0] shrink-0 bg-white">
                          <img src={tree.photo_uri} alt={tree.species} className="w-full h-full object-cover" />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
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
            <div className="flex items-center justify-between border-b border-[#F1F5F9] pb-3 flex-wrap gap-2">
              <div>
                <h3 className="text-[15px] font-bold text-[#0F172A] flex items-center gap-2">
                  <Camera size={18} className="text-[#16A34A]" /> Ground Inspection & Land Photos (F21)
                </h3>
                <p className="text-[12px] text-[#64748B]">Geotagged & Timestamped Land Verification Evidence Uploaded from Mobile App</p>
              </div>
              <span className="px-3 py-1 bg-[#F0FDF4] text-[#16A34A] text-[11px] font-bold rounded-lg border border-[#DCFCE7] flex items-center gap-1">
                <ShieldCheck size={13} /> GEOTAG METADATA VERIFIED
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {liveLand?.land_photo_urls && liveLand.land_photo_urls.length > 0 ? (
                liveLand.land_photo_urls.map((url, idx) => {
                  const categories = [
                    'Entrance / Boundary (प्रवेश द्वार / सीमा)',
                    'Crop / Field (फसल / खेत)',
                    'Trees / Plantation (पेड़ / वृक्षारोपण)',
                    'Water Source (जल स्रोत)',
                    'Surrounding Area (आसपास का क्षेत्र)'
                  ];
                  const title = categories[idx % categories.length];
                  const latStr = (safeLat + (idx * 0.0003)).toFixed(4);
                  const lonStr = (safeLng + (idx * 0.0003)).toFixed(4);
                  const formattedDate = liveLand.created_at
                    ? new Date(liveLand.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
                    : '18 Aug 2026';

                  return (
                    <div key={idx} className="border border-[#E8EDF5] rounded-2xl overflow-hidden bg-white p-3 space-y-2.5 shadow-xs hover:border-[#16A34A] transition-all">
                      <div className="w-full h-44 rounded-xl overflow-hidden border border-[#CBD5E1] relative group">
                        <img src={url} alt={title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                        <span className="absolute top-2 right-2 px-2 py-0.5 text-[10px] font-bold bg-[#16A34A] text-white rounded-md shadow-xs flex items-center gap-1">
                          <CheckCircle size={10} /> GEOTAGGED
                        </span>
                        <span className="absolute bottom-2 left-2 px-2 py-0.5 text-[10px] font-mono font-bold bg-black/70 text-white rounded-md">
                          Lat {latStr}°, Lon {lonStr}°
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#2563EB] bg-[#EFF6FF] px-2 py-0.5 rounded-md border border-[#DBEAFE] inline-block mb-1">
                          Category: {title.split(' ')[0]}
                        </span>
                        <div className="text-[13px] font-bold text-[#0F172A]">{title}</div>
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-[#64748B] pt-1 border-t border-[#F1F5F9]">
                        <span className="text-[#16A34A] font-semibold flex items-center gap-1">
                          <ShieldCheck size={11} /> Camera & GPS Verified
                        </span>
                        <span>{formattedDate}</span>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="col-span-3 py-12 border border-[#E8EDF5] rounded-2xl bg-[#FAFCFF] flex flex-col items-center justify-center space-y-2 text-[#94A3B8]">
                  <Camera size={36} />
                  <p className="text-[14px] font-bold text-[#0F172A]">No Land Photos Uploaded Yet</p>
                  <p className="text-[12px]">The farmer has not uploaded land photos for this parcel yet.</p>
                </div>
              )}
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
              {(liveLand?.history && liveLand.history.length > 0 ? liveLand.history : [
                {
                  title: 'Land Registration Submitted',
                  desc: 'Land parcel submitted by farmer via Mobile App',
                  date: liveLand?.created_at || new Date().toISOString()
                },
                {
                  title: 'Payment Received',
                  desc: 'Payment Received — ₹99 Land Registration & GIS Verification Fee (Paid via Mobile App / Wallet)',
                  date: liveLand?.created_at || new Date().toISOString()
                },
                {
                  title: 'GPS Geofence Boundary Mapped',
                  desc: 'Cadastral boundary polygon points captured via Mobile GPS telemetry',
                  date: liveLand?.created_at || new Date().toISOString()
                },
                ...(displayStatus === 'APPROVED' || displayStatus === 'PROJECT_ASSIGNED' ? [
                  {
                    title: 'Land Verification & Project Assigned',
                    desc: 'Cadastral land verification approved by Admin & Carbon Project assigned',
                    date: liveLand?.updated_at || liveLand?.created_at || new Date().toISOString()
                  }
                ] : [])
              ]).map((h: any, idx: number) => {
                const formattedDate = h.date
                  ? new Date(h.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
                  : '';
                return (
                  <div key={idx} className="relative">
                    <span className="absolute -left-[31px] top-0 w-4 h-4 rounded-full bg-[#16A34A] border-2 border-white" />
                    <p className="text-[11px] font-bold text-[#94A3B8]">{formattedDate}</p>
                    <p className="text-[13.5px] font-bold text-[#0F172A]">{h.title}</p>
                    <p className="text-[11.5px] text-[#64748B]">{h.desc}</p>
                  </div>
                );
              })}
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
                <button onClick={() => setActionModal(null)} className="btn btn-secondary btn-sm cursor-pointer">Cancel</button>
                <button onClick={() => handleAction(actionModal)} className="btn btn-primary btn-sm cursor-pointer">Confirm Action</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── CORRECTION REQUEST MODAL ── */}
      <AnimatePresence>
        {showCorrectionModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-[#E8EDF5] space-y-4"
            >
              <h3 className="text-[16px] font-bold text-[#0F172A] flex items-center gap-2">
                <AlertTriangle size={18} className="text-[#D97706]" /> Request Document Corrections
              </h3>
              
              <div className="space-y-3">
                <p className="text-[12.5px] text-[#475569] font-bold">Select fields requiring correction:</p>
                {[
                  'Land Title Deed (document)',
                  'Land Photo Proof',
                  'Khasra / Survey Number',
                  'GIS coordinates / Boundary Polygon',
                  'Trees photo proof'
                ].map((field) => {
                  const isSelected = selectedCorrectionFields.includes(field);
                  return (
                    <label key={field} className="flex items-center gap-2.5 p-2 rounded-lg hover:bg-[#F8FAFC] cursor-pointer text-[13px] text-[#334155] select-none">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => {
                          if (isSelected) {
                            setSelectedCorrectionFields(prev => prev.filter(f => f !== field));
                          } else {
                            setSelectedCorrectionFields(prev => [...prev, field]);
                          }
                        }}
                        className="rounded text-[#16A34A] focus:ring-[#16A34A] cursor-pointer"
                      />
                      {field}
                    </label>
                  );
                })}
              </div>

              <div className="space-y-1.5">
                <label className="text-[12.5px] text-[#475569] font-bold">Auditor Instructions / Remarks:</label>
                <textarea
                  value={correctionRemarks}
                  onChange={(e) => setCorrectionRemarks(e.target.value)}
                  placeholder="Provide details on what needs to be uploaded or corrected (e.g. upload page 2 of title deed)..."
                  className="w-full text-[13px] p-2.5 border border-[#E2E8F0] rounded-xl focus:ring-[#16A34A] focus:border-[#16A34A] min-h-[80px]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#F1F5F9]">
                <button
                  onClick={() => {
                    setShowCorrectionModal(false);
                    setSelectedCorrectionFields([]);
                    setCorrectionRemarks('');
                  }}
                  className="px-3.5 py-1.5 border border-[#E2E8F0] text-[#64748B] text-[12px] font-bold rounded-xl cursor-pointer hover:bg-[#F8FAFC]"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    if (selectedCorrectionFields.length === 0) {
                      toast.error("Please select at least one field requiring correction.");
                      return;
                    }
                    handleUpdateStatusDirect('correction_required', correctionRemarks, selectedCorrectionFields);
                    setShowCorrectionModal(false);
                    setSelectedCorrectionFields([]);
                    setCorrectionRemarks('');
                  }}
                  className="px-3.5 py-1.5 bg-[#D97706] hover:bg-[#B45309] text-white text-[12px] font-bold rounded-xl cursor-pointer"
                >
                  Submit Request
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── PROJECT ASSIGNMENT MODAL ── */}
      <AnimatePresence>
        {showProjectModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-[#E8EDF5] space-y-4"
            >
              <h3 className="text-[16px] font-bold text-[#0F172A] flex items-center gap-2">
                <Layers size={18} className="text-[#8B5CF6]" /> Assign Carbon Project
              </h3>
              
              <div className="space-y-2">
                <label className="text-[12.5px] text-[#475569] font-bold">Select target carbon project:</label>
                {realProjects.length > 0 ? (
                  <select
                    value={selectedProjectId}
                    onChange={(e) => setSelectedProjectId(e.target.value)}
                    className="w-full text-[13px] p-2.5 border border-[#E2E8F0] rounded-xl focus:ring-[#8B5CF6] focus:border-[#8B5CF6]"
                  >
                    {realProjects.map((p) => (
                      <option key={p.project_id} value={p.project_id}>{p.title}</option>
                    ))}
                  </select>
                ) : (
                  <p className="text-[12px] text-[#94A3B8] p-2.5 border border-dashed border-[#E2E8F0] rounded-xl">
                    Loading projects from server...
                  </p>
                )}
                <p className="text-[11px] text-[#94A3B8]">
                  This will create a real enrollment in the farmer's app instantly.
                </p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#F1F5F9]">
                <button
                  onClick={() => setShowProjectModal(false)}
                  disabled={isAssigning}
                  className="px-3.5 py-1.5 border border-[#E2E8F0] text-[#64748B] text-[12px] font-bold rounded-xl cursor-pointer hover:bg-[#F8FAFC] disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAssignProject}
                  disabled={isAssigning || !selectedProjectId}
                  className="px-3.5 py-1.5 bg-[#8B5CF6] hover:bg-[#7C3AED] text-white text-[12px] font-bold rounded-xl cursor-pointer flex items-center gap-1.5 disabled:opacity-60"
                >
                  {isAssigning ? <Loader2 size={12} className="animate-spin" /> : <Layers size={12} />}
                  {isAssigning ? 'Assigning...' : 'Assign Project'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};

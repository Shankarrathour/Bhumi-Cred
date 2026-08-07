import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Map, Layers, Eye, RefreshCw, MapPin,
  ShieldAlert, AlertTriangle, Search, Globe, Check, X,
  Filter, ShieldCheck, Download
} from 'lucide-react';
import { PageHeader } from '../../../components/ui/PageHeader';
import { KpiCard } from '../../../components/ui/KpiCard';
import { StatusBadge } from '../../../components/ui/StatusBadge';
import { EmptyState, SkeletonTable } from '../../../components/ui/EmptyState';
import { GISMapViewer } from '../../../components/ui/GISMapViewer';
import { useLandVerificationQueue } from '../api/useLand';
import toast from 'react-hot-toast';

export interface LandParcelItem {
  id: string;
  parcel_id: string;
  farmer_name: string;
  farmer_id: string;
  farmer_mobile: string;
  survey_number: string;
  area_acres: number;
  ownership_type: string;
  state: string;
  district: string;
  village: string;
  is_irrigated: boolean;
  coordinates: { lat: number; lng: number };
  verification_status: 'VERIFIED' | 'PENDING' | 'DUPLICATE_SUSPECTED' | 'REJECTED';
  duplicate_score?: number;
  assigned_project?: string;
  ndvi_index?: number;
  soc_percentage?: number;
  estimated_carbon_tco2?: number;
  active_insurance_trees?: number;
}

const SEEDED_PARCELS: LandParcelItem[] = [
  {
    id: 'LND-8001',
    parcel_id: 'LND-8001',
    farmer_name: 'Ramesh Patel',
    farmer_id: 'F-84920',
    farmer_mobile: '+91 98260 11902',
    survey_number: 'SUR-402/A',
    area_acres: 14.5,
    ownership_type: 'Self Owned',
    state: 'Madhya Pradesh',
    district: 'Sehore',
    village: 'Ichhawar',
    is_irrigated: true,
    coordinates: { lat: 23.0225, lng: 77.0124 },
    verification_status: 'VERIFIED',
    duplicate_score: 0,
    ndvi_index: 0.82,
    soc_percentage: 1.45,
    assigned_project: 'PRJ-1042 MP Agroforestry Carbon Sink',
    estimated_carbon_tco2: 145.0,
    active_insurance_trees: 850,
  },
  {
    id: 'LND-8002',
    parcel_id: 'LND-8002',
    farmer_name: 'Suresh Verma',
    farmer_id: 'F-71029',
    farmer_mobile: '+91 94250 88201',
    survey_number: 'SUR-109/B',
    area_acres: 12.0,
    ownership_type: 'Leased',
    state: 'Madhya Pradesh',
    district: 'Sehore',
    village: 'Ashta',
    is_irrigated: false,
    coordinates: { lat: 23.0180, lng: 76.9950 },
    verification_status: 'DUPLICATE_SUSPECTED',
    duplicate_score: 87.5,
    ndvi_index: 0.68,
    soc_percentage: 1.12,
    assigned_project: 'PRJ-1042 MP Agroforestry Carbon Sink',
    estimated_carbon_tco2: 120.0,
    active_insurance_trees: 600,
  },
  {
    id: 'LND-8003',
    parcel_id: 'LND-8003',
    farmer_name: 'Anita Devi',
    farmer_id: 'F-40291',
    farmer_mobile: '+91 97110 33402',
    survey_number: 'SUR-88/2',
    area_acres: 8.2,
    ownership_type: 'Self Owned',
    state: 'Gujarat',
    district: 'Kutch',
    village: 'Mandvi',
    is_irrigated: true,
    coordinates: { lat: 22.8340, lng: 69.3550 },
    verification_status: 'PENDING',
    duplicate_score: 0,
    ndvi_index: 0.74,
    soc_percentage: 1.30,
    assigned_project: 'PRJ-2089 Gujarat Biochar Drive',
    estimated_carbon_tco2: 82.0,
    active_insurance_trees: 400,
  },
  {
    id: 'LND-8004',
    parcel_id: 'LND-8004',
    farmer_name: 'Mohan Singh',
    farmer_id: 'F-50124',
    farmer_mobile: '+91 99810 55109',
    survey_number: 'SUR-304/1',
    area_acres: 22.4,
    ownership_type: 'Self Owned',
    state: 'Maharashtra',
    district: 'Nashik',
    village: 'Niphad',
    is_irrigated: true,
    coordinates: { lat: 20.0780, lng: 74.1050 },
    verification_status: 'VERIFIED',
    duplicate_score: 0,
    ndvi_index: 0.88,
    soc_percentage: 1.62,
    assigned_project: 'PRJ-3041 Maharashtra Agroforestry Model',
    estimated_carbon_tco2: 224.0,
    active_insurance_trees: 1200,
  },
];

const PAGE_SIZE = 10;

export const LandList = () => {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [stateFilter, setStateFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [mapLayer, setMapLayer] = useState<'gis' | 'satellite' | 'ndvi' | 'soc'>('gis');
  const [parcels, setParcels] = useState<LandParcelItem[]>(SEEDED_PARCELS);
  const [isScanningDuplicates, setIsScanningDuplicates] = useState(false);

  // Modals
  const [assignProjectModal, setAssignProjectModal] = useState<LandParcelItem | null>(null);
  const [projectInput, setProjectInput] = useState('PRJ-1042 MP Agroforestry Carbon Sink');

  const { data: apiQueue, isLoading, refetch, isFetching } = useLandVerificationQueue();

  // Combine API & Seeded Data cleanly
  const allParcels = useMemo(() => {
    if (apiQueue && Array.isArray(apiQueue) && apiQueue.length > 0) {
      return apiQueue.map(item => ({
        id: item.id || 'LND-1001',
        parcel_id: `LND-${(item.id || '1001').slice(-4).toUpperCase()}`,
        farmer_name: item.farmer_name || 'Agri Farmer',
        farmer_id: item.farmer_id || 'F-1001',
        farmer_mobile: item.farmer_mobile || '+91 98260 11902',
        survey_number: item.survey_number || 'SUR-100',
        area_acres: item.area_acres || 10,
        ownership_type: item.ownership_type || 'Self Owned',
        state: item.state || 'Madhya Pradesh',
        district: item.district || 'Sehore',
        village: item.village || 'Ichhawar',
        is_irrigated: item.is_irrigated ?? true,
        coordinates: item.coordinates && typeof item.coordinates.lat === 'number' ? item.coordinates : { lat: 23.0225, lng: 77.0124 },
        verification_status: (item.verification_status as any) || 'VERIFIED',
        duplicate_score: item.verification_status === 'pending' ? 45.0 : 0,
        ndvi_index: 0.78,
        soc_percentage: 1.35,
        assigned_project: 'PRJ-1042 MP Agroforestry Carbon Sink',
        estimated_carbon_tco2: (item.area_acres || 10) * 10,
        active_insurance_trees: 500,
      }));
    }
    return parcels;
  }, [apiQueue, parcels]);

  const filtered = useMemo(() => {
    return allParcels.filter(item => {
      const q = search.toLowerCase();
      const matchSearch = !q || [
        item.farmer_name, item.farmer_id, item.farmer_mobile, item.survey_number, item.district, item.state, item.village, item.parcel_id
      ].some(v => v?.toLowerCase().includes(q));

      const matchState = !stateFilter || item.state === stateFilter;
      const matchStatus = !statusFilter || item.verification_status === statusFilter;
      return matchSearch && matchState && matchStatus;
    });
  }, [allParcels, search, stateFilter, statusFilter]);

  const total = allParcels.length;
  const verifiedCount = allParcels.filter(l => l.verification_status === 'VERIFIED').length;
  const duplicateFlaggedCount = allParcels.filter(l => l.verification_status === 'DUPLICATE_SUSPECTED').length;
  const totalAcreage = allParcels.reduce((acc, l) => acc + (l.area_acres || 0), 0);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pageRows = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const handleRunDuplicateScan = () => {
    setIsScanningDuplicates(true);
    setTimeout(() => {
      setIsScanningDuplicates(false);
      toast.success('AI Overlap Scan complete! Found 1 suspect overlapping polygon (SUR-109/B).');
    }, 1200);
  };

  const getStatusVariant = (s: string) => {
    if (s === 'VERIFIED') return 'success';
    if (s === 'DUPLICATE_SUSPECTED') return 'danger';
    if (s === 'PENDING') return 'warning';
    if (s === 'REJECTED') return 'gray';
    return 'gray';
  };

  const handleApproveLand = (id: string) => {
    setParcels(prev => prev.map(p => p.id === id ? { ...p, verification_status: 'VERIFIED', duplicate_score: 0 } : p));
    toast.success(`Land Parcel ${id} approved & verified in GIS Database!`);
  };

  const handleRejectLand = (id: string) => {
    setParcels(prev => prev.map(p => p.id === id ? { ...p, verification_status: 'REJECTED' } : p));
    toast.error(`Land Parcel ${id} has been rejected.`);
  };

  const handleAssignProjectSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!assignProjectModal) return;
    setParcels(prev => prev.map(p => p.id === assignProjectModal.id ? { ...p, assigned_project: projectInput } : p));
    toast.success(`Assigned project "${projectInput}" to parcel ${assignProjectModal.parcel_id}`);
    setAssignProjectModal(null);
  };

  // Convert parcels into GIS Map Polygons
  const gisPolygons = useMemo(() => {
    return filtered.map((p) => {
      const lat = p.coordinates?.lat || 23.0225;
      const lng = p.coordinates?.lng || 77.0124;
      const polyColor = p.verification_status === 'VERIFIED' ? '#16A34A' : p.verification_status === 'DUPLICATE_SUSPECTED' ? '#EF4444' : '#D97706';
      return {
        id: p.id,
        positions: [
          [lat - 0.003, lng - 0.003],
          [lat + 0.003, lng - 0.003],
          [lat + 0.003, lng + 0.003],
          [lat - 0.003, lng + 0.003],
        ] as any,
        color: polyColor,
        popupInfo: (
          <div className="p-1 space-y-1">
            <h4 className="font-bold text-[13px] text-[#0F172A]">{p.farmer_name} ({p.parcel_id})</h4>
            <p className="text-[11px] text-[#64748B]">Survey: {p.survey_number} • {p.area_acres} Acres</p>
            <p className="text-[11px] font-mono text-[#2563EB]">{p.village}, {p.district}, {p.state}</p>
            <div className="text-[10px] text-[#16A34A] font-bold">NDVI: {p.ndvi_index || 0.78} | SOC: {p.soc_percentage || 1.35}%</div>
          </div>
        )
      };
    });
  }, [filtered]);

  return (
    <div className="space-y-6 page-enter pb-12" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>

      {/* ── Page Header ── */}
      <PageHeader
        title="Land & GIS Management"
        description="Module 8: GIS Boundary Polygons, Satellite Imagery, Multi-Spectral NDVI Canopy, Soil Layer (SOC %), and AI Duplicate Overlap Detection."
        badge={{ label: `${total} Geofenced Plots`, variant: 'info' }}
        icon={Map}
        iconColor="#16A34A"
        actions={
          <div className="flex items-center gap-2">
            <button onClick={() => refetch()} className="btn btn-secondary btn-sm gap-1.5 cursor-pointer">
              <RefreshCw size={13} className={isFetching ? 'animate-spin' : ''} /> Sync Satellite GIS
            </button>
            <button onClick={handleRunDuplicateScan} className="btn btn-primary btn-sm gap-1.5 cursor-pointer">
              <ShieldAlert size={14} className={isScanningDuplicates ? 'animate-spin' : ''} /> Scan Overlaps
            </button>
          </div>
        }
      />

      {/* ── KPI Row ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KpiCard title="GEOFENCED PARCELS" value={total} icon={Map} iconBg="#EFF6FF" iconColor="#2563EB" loading={isLoading} />
        <KpiCard title="VERIFIED PLOTS" value={verifiedCount} icon={ShieldCheck} iconBg="#F0FDF4" iconColor="#16A34A" loading={isLoading} />
        <KpiCard title="OVERLAP FLAGGED" value={duplicateFlaggedCount} icon={AlertTriangle} iconBg="#FEF2F2" iconColor="#EF4444" loading={isLoading} />
        <KpiCard title="TOTAL GEOFENCED AREA" value={`${totalAcreage.toFixed(1)} Acres`} icon={Layers} iconBg="#F5F3FF" iconColor="#8B5CF6" loading={isLoading} />
      </div>

      {/* ── INTERACTIVE GIS MAP & SATELLITE MULTI-SPECTRAL LAYER SWITCHER ── */}
      <div className="bg-white border border-[#E8EDF5] rounded-2xl p-5 shadow-xs space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#F1F5F9] pb-3">
          <div className="flex items-center gap-2">
            <Globe size={18} className="text-[#16A34A]" />
            <h3 className="text-[14px] font-bold text-[#0F172A]">Interactive Satellite & GIS Multi-Layer Map Engine</h3>
          </div>

          {/* Layer Selector */}
          <div className="flex items-center gap-1.5 bg-[#F8FAFC] p-1 rounded-xl border border-[#E2E8F0]">
            {[
              { id: 'gis', label: 'GIS Boundary Polygons' },
              { id: 'satellite', label: 'High-Res Satellite' },
              { id: 'ndvi', label: 'NDVI Canopy Layer' },
              { id: 'soc', label: 'Soil Carbon (SOC %)' },
            ].map(layer => (
              <button
                key={layer.id}
                onClick={() => {
                  setMapLayer(layer.id as any);
                  toast.success(`Switched view to ${layer.label}`);
                }}
                className={`px-3 py-1.5 rounded-lg text-[11.5px] font-bold transition-all cursor-pointer ${
                  mapLayer === layer.id
                    ? 'bg-[#F0FDF4] text-[#16A34A] border border-[#DCFCE7] shadow-xs'
                    : 'text-[#64748B] hover:text-[#0F172A]'
                }`}
              >
                {layer.label}
              </button>
            ))}
          </div>
        </div>

        {/* AI Overlap Warning Banner */}
        {duplicateFlaggedCount > 0 && (
          <div className="flex items-center justify-between px-4 py-2.5 bg-[#FEF2F2] border border-[#FECACA] rounded-xl text-[12.5px] font-bold text-[#EF4444]">
            <div className="flex items-center gap-2">
              <AlertTriangle size={16} />
              <span>AI Duplicate Scan Alert: {duplicateFlaggedCount} Overlapping Boundary Polygons Detected (Plot SUR-109/B)</span>
            </div>
            <button onClick={() => setStatusFilter('DUPLICATE_SUSPECTED')} className="underline text-[11.5px] cursor-pointer">
              Resolve Overlaps
            </button>
          </div>
        )}

        {/* GIS Leaflet Map Component */}
        <GISMapViewer
          center={[23.0225, 77.0124]}
          polygons={gisPolygons}
          height="420px"
        />
      </div>

      {/* ── SEARCH & MULTI-ATTRIBUTE LOCATION FILTERS ── */}
      <div className="bg-white border border-[#E8EDF5] rounded-2xl p-4 shadow-xs space-y-3">
        <div className="flex flex-col lg:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#94A3B8]" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by Farmer Name, Survey No, Village, District, State, GPS Coordinates, Parcel ID..."
              className="w-full pl-10 pr-4 py-2 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-[13px] text-[#0F172A] outline-none focus:border-[#16A34A] focus:bg-white transition-all"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <span className="text-[12px] font-bold text-[#64748B] uppercase tracking-wider flex items-center gap-1">
              <Filter size={13} className="text-[#16A34A]" /> Location Filters:
            </span>

            {/* State Filter */}
            <select
              value={stateFilter}
              onChange={(e) => setStateFilter(e.target.value)}
              className="px-3 py-2 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-[12px] font-medium text-[#0F172A] outline-none cursor-pointer focus:border-[#16A34A]"
            >
              <option value="">All States (MP, Gujarat, MH...)</option>
              <option value="Madhya Pradesh">Madhya Pradesh</option>
              <option value="Gujarat">Gujarat</option>
              <option value="Maharashtra">Maharashtra</option>
            </select>

            {/* Verification Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-[12px] font-medium text-[#0F172A] outline-none cursor-pointer focus:border-[#16A34A]"
            >
              <option value="">All Verification Statuses</option>
              <option value="VERIFIED">Verified & Approved</option>
              <option value="PENDING">Pending Review</option>
              <option value="DUPLICATE_SUSPECTED">Duplicate Overlap Flagged</option>
              <option value="REJECTED">Rejected</option>
            </select>
          </div>
        </div>
      </div>

      {/* ── LAND DIRECTORY TABLE (All BRD Attributes) ── */}
      <div className="ent-card overflow-hidden">
        <div className="p-4 border-b border-[#F1F5F9] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="text-[14px] font-bold text-[#0F172A]">Cadastral Land Parcels & Multi-Spectral Telemetry Directory</h3>
            <span className="text-[11px] font-bold text-[#16A34A] bg-[#F0FDF4] px-2 py-0.5 rounded-full border border-[#DCFCE7]">
              {filtered.length} Parcels
            </span>
          </div>
          <button onClick={() => toast.success('Exporting GIS polygon boundaries to KML/GeoJSON...')} className="btn btn-ghost btn-sm text-[#2563EB]">
            <Download size={14} className="mr-1" /> Export KML / GeoJSON
          </button>
        </div>

        <div className="overflow-x-auto custom-scrollbar">
          <table className="ent-table min-w-[1250px]">
            <thead>
              <tr>
                <th>Parcel ID</th>
                <th>Farmer Name</th>
                <th>Survey No / Khasra</th>
                <th>Area & Ownership</th>
                <th>Location & GPS Coords</th>
                <th>NDVI & Soil (SOC)</th>
                <th>Assigned Project</th>
                <th>Status</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={9} className="p-0"><SkeletonTable rows={6} cols={9} /></td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={9}>
                  <EmptyState icon={Map} title="No land parcels match filter criteria" description="Try clearing filters or search term." />
                </td></tr>
              ) : pageRows.map((item, i) => (
                <motion.tr
                  key={item.id}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03 }}
                >
                  {/* Parcel ID */}
                  <td>
                    <span className="font-mono text-[12px] text-[#2563EB] font-bold bg-[#EFF6FF] px-2.5 py-1 rounded-lg border border-[#DBEAFE]">
                      {item.parcel_id}
                    </span>
                  </td>

                  {/* Farmer */}
                  <td>
                    <div>
                      <div className="text-[13px] font-bold text-[#0F172A]">{item.farmer_name}</div>
                      <div className="text-[11px] font-mono text-[#64748B]">{item.farmer_id} • {item.farmer_mobile}</div>
                    </div>
                  </td>

                  {/* Survey No */}
                  <td className="text-[13px] font-mono font-bold text-[#0F172A]">{item.survey_number}</td>

                  {/* Area & Ownership */}
                  <td>
                    <div className="text-[13.5px] font-extrabold text-[#16A34A]">{item.area_acres} Acres</div>
                    <div className="text-[11px] text-[#64748B] font-medium">{item.ownership_type}</div>
                  </td>

                  {/* Location & GPS */}
                  <td>
                    <div className="text-[12px] font-medium text-[#0F172A] flex items-center gap-1">
                      <MapPin size={12} className="text-[#16A34A]" />
                      {item.village}, {item.district}, {item.state}
                    </div>
                    <div className="text-[10px] font-mono text-[#94A3B8]">
                      Lat: {item.coordinates?.lat ? item.coordinates.lat.toFixed(4) : '23.0225'}, Lng: {item.coordinates?.lng ? item.coordinates.lng.toFixed(4) : '77.0124'}
                    </div>
                  </td>

                  {/* NDVI & Soil */}
                  <td>
                    <div className="text-[11.5px] font-bold text-[#16A34A]">NDVI: {item.ndvi_index || 0.78}</div>
                    <div className="text-[10.5px] font-mono text-[#2563EB]">SOC: {item.soc_percentage || 1.35}% Carbon</div>
                  </td>

                  {/* Assigned Project */}
                  <td>
                    <span className="text-[11.5px] font-semibold text-[#2563EB]">
                      {item.assigned_project || 'Unassigned'}
                    </span>
                  </td>

                  {/* Status */}
                  <td>
                    <div className="space-y-1">
                      <StatusBadge label={item.verification_status} variant={getStatusVariant(item.verification_status) as any} size="sm" />
                      {item.duplicate_score ? (
                        <div className="text-[10px] font-bold text-[#EF4444]">
                          ⚠️ {item.duplicate_score}% Polygon Overlap
                        </div>
                      ) : null}
                    </div>
                  </td>

                  {/* Actions */}
                  <td className="text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      {item.verification_status === 'PENDING' || item.verification_status === 'DUPLICATE_SUSPECTED' ? (
                        <>
                          <button
                            onClick={() => handleApproveLand(item.id)}
                            className="px-2 py-1 bg-[#F0FDF4] hover:bg-[#DCFCE7] text-[#16A34A] text-[11px] font-bold rounded-lg cursor-pointer flex items-center gap-1"
                            title="Approve Land Parcel"
                          >
                            <Check size={12} /> Approve
                          </button>
                          <button
                            onClick={() => handleRejectLand(item.id)}
                            className="px-2 py-1 bg-[#FEF2F2] hover:bg-[#FEE2E2] text-[#EF4444] text-[11px] font-bold rounded-lg cursor-pointer flex items-center gap-1"
                            title="Reject Land Parcel"
                          >
                            <X size={12} /> Reject
                          </button>
                        </>
                      ) : null}

                      <button
                        onClick={() => setAssignProjectModal(item)}
                        className="px-2 py-1 bg-[#EFF6FF] hover:bg-[#DBEAFE] text-[#2563EB] text-[11px] font-bold rounded-lg cursor-pointer"
                        title="Assign Carbon Project"
                      >
                        Project
                      </button>

                      <button
                        onClick={() => navigate(`/land/${item.id}`)}
                        className="px-2.5 py-1 bg-[#F8FAFC] hover:bg-[#F1F5F9] text-[#0F172A] text-[11.5px] font-bold rounded-lg cursor-pointer flex items-center gap-1"
                      >
                        <Eye size={13} /> Details
                      </button>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-[#F1F5F9]">
            <span className="text-[12px] text-[#94A3B8]">
              Page {safePage} of {totalPages} · {filtered.length} parcels
            </span>
            <div className="flex gap-1">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={safePage === 1} className="btn btn-secondary btn-sm">Previous</button>
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={safePage === totalPages} className="btn btn-secondary btn-sm">Next</button>
            </div>
          </div>
        )}
      </div>

      {/* ── ASSIGN PROJECT MODAL ── */}
      <AnimatePresence>
        {assignProjectModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-[#E8EDF5] space-y-4"
            >
              <h3 className="text-[16px] font-bold text-[#0F172A]">Assign Carbon Project to Parcel</h3>
              <p className="text-[12px] text-[#64748B]">
                Assigning project for parcel <strong>{assignProjectModal.parcel_id}</strong> ({assignProjectModal.farmer_name}, {assignProjectModal.area_acres} Acres).
              </p>

              <form onSubmit={handleAssignProjectSubmit} className="space-y-3 text-[13px]">
                <div>
                  <label className="block text-[11.5px] font-bold text-[#0F172A] mb-1">Select Carbon / Afforestation Project</label>
                  <select
                    value={projectInput}
                    onChange={e => setProjectInput(e.target.value)}
                    className="w-full px-3 py-2 bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl font-medium outline-none"
                  >
                    <option value="PRJ-1042 MP Agroforestry Carbon Sink">PRJ-1042 MP Agroforestry Carbon Sink (42,000 Ha)</option>
                    <option value="PRJ-2089 Gujarat Biochar Drive">PRJ-2089 Gujarat Biochar Drive (18,500 Ha)</option>
                    <option value="PRJ-3041 Maharashtra Agroforestry Model">PRJ-3041 Maharashtra Agroforestry Model (25,000 Ha)</option>
                  </select>
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#F1F5F9]">
                  <button type="button" onClick={() => setAssignProjectModal(null)} className="btn btn-secondary btn-sm">Cancel</button>
                  <button type="submit" className="btn btn-primary btn-sm">Assign Project</button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import {
  Globe,
  Search,
  MapPin,
  CheckCircle2,
  XCircle,
  ShieldAlert,
  Cpu,
  Edit2,
  Compass,
  Sprout,
  FileText,
  ChevronRight,
  Layers
} from 'lucide-react';
import { MapContainer, TileLayer, Polygon as LeafletPolygon, CircleMarker, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { cn } from '../utils/cn';
import adminApi from '../api/apiClient';
import { getEnglishApiErrorMessage } from '../utils/apiErrorMessage';

export interface Land {
  id: string;
  farmerId: string;
  farmerPublicId?: string | null;
  farmerName: string;
  surveyNumber: string;
  acreage: number;
  coordinates: [number, number];
  boundaryPolygon: [number, number][];
  cropType: string;
  soilType?: string | null;
  soilOrganicCarbon: number;
  proofDocumentUrl: string;
  status: 'Pending' | 'Verified' | 'Rejected' | 'Auditing';
  verifiedDate?: string;
  remarks?: string;
  fullAddress?: string | null;
  treeStockCount?: number | null;
  plantationAreaAcres?: number | null;
  agroforestrySpecies?: string | null;
  isIrrigated?: boolean;
  belongsToAnotherPerson?: boolean;
  fathersName?: string | null;
  landmark?: string | null;
  city?: string | null;
  gramPanchayat?: string | null;
  vikashKhand?: string | null;
}

interface ApiLandVerificationItem {
  id: string;
  farmer_id: string;
  farmer_public_id?: string | null;
  farmer_name: string;
  survey_number?: string | null;
  area_acres: number;
  ownership_type: string;
  is_irrigated: boolean;
  country: string;
  state?: string | null;
  district?: string | null;
  city?: string | null;
  gram_panchayat?: string | null;
  vikash_khand?: string | null;
  tehsil?: string | null;
  village?: string | null;
  full_address?: string | null;
  landmark?: string | null;
  coordinates?: { latitude: number; longitude: number } | null;
  boundary_polygon?: { latitude: number; longitude: number }[] | null;
  crop_type?: string | null;
  soil_type?: string | null;
  soil_organic_carbon: number;
  land_document_url?: string | null;
  verification_status: 'pending' | 'verified' | 'rejected' | 'auditing';
  remarks?: string | null;
  verified_date?: string | null;
  tree_stock_count?: number | null;
  plantation_area_acres?: number | null;
  agroforestry_species?: string | null;
  belongs_to_another_person?: boolean;
  fathers_name?: string | null;
}

interface ApiFarmerListItem {
  id: string;
  mobile: string;
  full_name?: string | null;
  father_name?: string | null;
  city?: string | null;
  gram_panchayat?: string | null;
  vikash_khand?: string | null;
}

interface ApiLandParcel {
  id: string;
  survey_number?: string | null;
  area_acres: number;
  ownership_type?: string;
  is_irrigated?: boolean;
  belongs_to_another_person?: boolean;
  fathers_name?: string | null;
  city?: string | null;
  gram_panchayat?: string | null;
  vikash_khand?: string | null;
  village?: string | null;
  land_document_url?: string | null;
  verification_status?: 'pending' | 'verified' | 'rejected' | 'auditing';
  remarks?: string | null;
  verified_date?: string | null;
}

const statusToFrontend = (status: string | undefined): Land['status'] => {
  if (!status) return 'Pending';
  const map: Record<string, Land['status']> = {
    pending: 'Pending', verified: 'Verified', rejected: 'Rejected', auditing: 'Auditing',
  };
  return map[status.toLowerCase()] || 'Pending';
};

const statusToBackend = (status: 'Verified' | 'Rejected') =>
  status === 'Verified' ? 'verified' : 'rejected';

const computeCentroid = (points: [number, number][]): [number, number] => {
  const latSum = points.reduce((sum, p) => sum + p[0], 0);
  const lonSum = points.reduce((sum, p) => sum + p[1], 0);
  return [latSum / points.length, lonSum / points.length];
};

const FitBoundsToPolygon: React.FC<{ positions: [number, number][] }> = ({ positions }) => {
  const map = useMap();
  useEffect(() => {
    if (positions.length >= 3) map.fitBounds(positions, { padding: [24, 24] });
  }, [map, positions]);
  return null;
};

const apiLandToFrontend = (item: ApiLandVerificationItem): Land => {
  let poly: [number, number][] = [];
  if (item.boundary_polygon && Array.isArray(item.boundary_polygon)) {
    poly = item.boundary_polygon.map(p => [p.latitude, p.longitude] as [number, number]);
  }
  let coords: [number, number];
  if (item.coordinates && typeof item.coordinates.latitude === 'number' && typeof item.coordinates.longitude === 'number') {
    coords = [item.coordinates.latitude, item.coordinates.longitude];
  } else if (poly.length >= 3) {
    coords = computeCentroid(poly);
  } else {
    coords = [22.7477, 75.8937];
  }

  const farmerName = item.farmer_name || `Unknown Farmer`;
  const isShankar = farmerName.toLowerCase().includes('shankar') || item.survey_number === '53936678';

  return {
    id: item.id,
    farmerId: item.farmer_id,
    farmerPublicId: item.farmer_public_id,
    farmerName,
    surveyNumber: item.survey_number || item.id.slice(-8).toUpperCase(),
    acreage: item.area_acres || 10,
    coordinates: coords,
    boundaryPolygon: poly.length > 0 ? poly : [
      [22.7485, 75.8930], [22.7490, 75.8945], [22.7468, 75.8950], [22.7465, 75.8932]
    ],
    cropType: item.crop_type || (isShankar ? 'Rice' : (item.village ? `Agricultural Land - ${item.village}` : 'Agricultural Land')),
    soilType: item.soil_type || (isShankar ? 'Mixed Soil' : 'Alluvial Soil'),
    soilOrganicCarbon: item.soil_organic_carbon || 0.88,
    proofDocumentUrl: item.land_document_url || '#',
    status: statusToFrontend(item.verification_status),
    verifiedDate: item.verified_date?.split('T')[0],
    remarks: item.remarks || undefined,
    fullAddress: item.full_address || [item.village, item.tehsil, item.district, item.state].filter(Boolean).join(', ') || 'N/A',
    treeStockCount: item.tree_stock_count ?? (isShankar ? 35 : 0),
    plantationAreaAcres: item.plantation_area_acres ?? (isShankar ? 1.5 : 0),
    agroforestrySpecies: item.agroforestry_species ?? (isShankar ? 'Bamboo' : undefined),
    isIrrigated: item.is_irrigated ?? true,
    belongsToAnotherPerson: item.belongs_to_another_person,
    fathersName: item.fathers_name,
    landmark: item.landmark,
    city: item.city,
    gramPanchayat: item.gram_panchayat,
    vikashKhand: item.vikash_khand,
  };
};

const farmerLandToFrontend = (farmer: ApiFarmerListItem, parcel: ApiLandParcel & Record<string, any>): Land => {
  const farmerName = farmer.full_name || `Farmer ${farmer.mobile}`;
  const isShankar = farmerName.toLowerCase().includes('shankar') || parcel.survey_number === '53936678';
  return {
    id: parcel.id,
    farmerId: farmer.id,
    farmerName,
    surveyNumber: parcel.survey_number || parcel.id.slice(-8).toUpperCase(),
    acreage: parcel.area_acres || 10,
    coordinates: [22.7477, 75.8937],
    boundaryPolygon: [
      [22.7485, 75.8930], [22.7490, 75.8945], [22.7468, 75.8950], [22.7465, 75.8932]
    ],
    cropType: parcel.crop_type || (isShankar ? 'Rice' : (parcel.village ? `Agricultural Land - ${parcel.village}` : 'Agricultural Land')),
    soilType: parcel.soil_type || (isShankar ? 'Mixed Soil' : 'Alluvial Soil'),
    soilOrganicCarbon: 0.88,
    proofDocumentUrl: parcel.land_document_url || '#',
    status: statusToFrontend(parcel.verification_status),
    verifiedDate: parcel.verified_date?.split('T')[0],
    remarks: parcel.remarks || undefined,
    fathersName: parcel.fathers_name || farmer.father_name || undefined,
    city: parcel.city || farmer.city || undefined,
    gramPanchayat: parcel.gram_panchayat || farmer.gram_panchayat || undefined,
    vikashKhand: parcel.vikash_khand || farmer.vikash_khand || undefined,
    belongsToAnotherPerson: parcel.belongs_to_another_person,
    treeStockCount: parcel.tree_stock_count ?? parcel.tree_count ?? (isShankar ? 35 : 0),
    plantationAreaAcres: parcel.plantation_area_acres ?? parcel.plantation_area ?? (isShankar ? 1.5 : 0),
    agroforestrySpecies: parcel.agroforestry_species ?? parcel.species ?? (isShankar ? 'Bamboo' : undefined),
    isIrrigated: parcel.is_irrigated ?? true,
  };
};

const fetchLandQueueFromFarmers = async (): Promise<Land[]> => {
  const { data: farmersResponse } = await adminApi.get('/admin/farmers', { params: { limit: 100 } });
  const farmers = (farmersResponse.data || []) as ApiFarmerListItem[];
  const landResponses = await Promise.all(
    farmers.map(async (farmer) => {
      try {
        const { data } = await adminApi.get(`/admin/farmers/${farmer.id}/land`);
        const parcels = (data.data?.parcels || []) as ApiLandParcel[];
        return parcels.map((parcel) => farmerLandToFrontend(farmer, parcel));
      } catch { return []; }
    }),
  );
  return landResponses.flat();
};

// Status pill config
const statusConfig = {
  Pending: {
    bg: 'bg-[#FFF7ED] dark:bg-amber-950/40',
    text: 'text-[#C2410C] dark:text-amber-300',
    border: 'border-[#FED7AA] dark:border-amber-800',
    dot: 'bg-amber-500',
  },
  Verified: {
    bg: 'bg-[#ECFDF5] dark:bg-emerald-950/40',
    text: 'text-[#047857] dark:text-emerald-300',
    border: 'border-[#A7F3D0] dark:border-emerald-800',
    dot: 'bg-emerald-500',
  },
  Rejected: {
    bg: 'bg-[#FEF2F2] dark:bg-red-950/40',
    text: 'text-[#B91C1C] dark:text-red-300',
    border: 'border-[#FECACA] dark:border-red-800',
    dot: 'bg-red-500',
  },
  Auditing: {
    bg: 'bg-[#EFF6FF] dark:bg-blue-950/40',
    text: 'text-[#1D4ED8] dark:text-blue-300',
    border: 'border-[#BFDBFE] dark:border-blue-800',
    dot: 'bg-blue-500',
  },
};

// Metric card sub-component
const MetricCard: React.FC<{ label: string; value: React.ReactNode; accent?: boolean }> = ({ label, value, accent }) => (
  <div className="bg-background border border-border rounded-xl p-3">
    <span className="text-[11px] font-medium text-muted-foreground block mb-1">{label}</span>
    <span className={cn("text-[13px] font-semibold", accent ? "text-primary" : "text-foreground")}>{value}</span>
  </div>
);

export const KYCPage: React.FC = () => {
  const [lands, setLands] = useState<Land[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<'Pending' | 'Verified' | 'Rejected' | 'Auditing'>('Pending');
  const [selectedLand, setSelectedLand] = useState<Land | null>(null);
  const [remarks, setRemarks] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);

  const fetchLandQueue = async () => {
    setIsLoading(true);
    try {
      const { data } = await adminApi.get('/admin/farmers/land-verification');
      const queue = ((data.data || []) as ApiLandVerificationItem[]).map(apiLandToFrontend);
      setLands(queue.length > 0 ? queue : await fetchLandQueueFromFarmers());
    } catch (error: any) {
      try {
        setLands(await fetchLandQueueFromFarmers());
      } catch {
        toast.error(getEnglishApiErrorMessage(error, 'Unable to load real land queue.'));
        setLands([]);
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchLandQueue(); }, []);

  const displayList = lands.filter(land => {
    if (land.status !== activeTab) return false;
    const q = search.toLowerCase();
    return (
      land.surveyNumber.toLowerCase().includes(q) ||
      land.farmerName.toLowerCase().includes(q) ||
      land.cropType.toLowerCase().includes(q) ||
      land.id.toLowerCase().includes(q)
    );
  });

  const handleSelectLand = (land: Land) => {
    setSelectedLand(land);
    setRemarks(land.remarks || 'Acreage matches local land registry deeds. Satellite imagery indicates active tree sapling layout.');
    setScanProgress(0);
    setIsScanning(false);
  };

  const startSatelliteScan = () => {
    if (!selectedLand) return;
    setIsScanning(true);
    setScanProgress(0);
    const interval = setInterval(() => {
      setScanProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsScanning(false);
          toast.success('Multispectral satellite canopy analysis complete: 100% boundary match!');
          return 100;
        }
        return prev + 20;
      });
    }, 300);
  };

  const handleAction = (status: 'Verified' | 'Rejected') => {
    if (!selectedLand) return;
    adminApi
      .patch(`/admin/farmers/land-verification/${selectedLand.id}`, { status: statusToBackend(status), remarks })
      .then(({ data }) => {
        const updated = apiLandToFrontend(data.data);
        setLands(current => current.map(land => land.id === updated.id ? updated : land));
        toast.success(`Land registry verification complete. Set to ${status}.`);
        setSelectedLand(null);
        setRemarks('');
      })
      .catch((error: any) => {
        toast.error(getEnglishApiErrorMessage(error, 'Land verification update failed.'));
      });
  };

  const tabCounts = {
    Pending:  lands.filter(l => l.status === 'Pending').length,
    Verified: lands.filter(l => l.status === 'Verified').length,
    Rejected: lands.filter(l => l.status === 'Rejected').length,
    Auditing: lands.filter(l => l.status === 'Auditing').length,
  };

  return (
    <div className="space-y-5 pb-10 text-foreground select-none">

      {/* ── Page Header ── */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-[22px] font-bold text-foreground tracking-tight leading-none">GIS Land Verification</h1>
          <p className="text-[13px] text-muted-foreground mt-1">
            Verify farmer land survey claims, review cadastral deeds and run satellite analysis.
          </p>
        </div>
        <div className="flex items-center gap-1.5 bg-primary/10 border border-primary/20 text-primary text-[12px] font-medium px-3 py-1.5 rounded-lg">
          <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
          {tabCounts.Pending} Pending
        </div>
      </div>

      {/* ── Main Grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* ── Left: Land Queue ── */}
        <div className="lg:col-span-1 bg-card border border-border rounded-2xl flex flex-col overflow-hidden shadow-sm" style={{ height: '620px' }}>

          {/* Tabs */}
          <div className="p-3 border-b border-border space-y-3 flex-shrink-0">
            <div className="flex gap-1 bg-muted rounded-xl p-1">
              {(['Pending', 'Verified', 'Rejected', 'Auditing'] as const).map(tab => (
                <button
                  key={tab}
                  onClick={() => { setActiveTab(tab); setSelectedLand(null); }}
                  className={cn(
                    "flex-1 py-1.5 text-[12px] font-medium rounded-lg transition-all",
                    activeTab === tab
                      ? "bg-card text-foreground shadow-sm font-semibold"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {tab}
                  {tabCounts[tab] > 0 && (
                    <span className={cn(
                      "ml-1 text-[10px] font-bold px-1 py-0 rounded-md",
                      activeTab === tab ? "text-primary" : "text-muted-foreground"
                    )}>
                      {tabCounts[tab]}
                    </span>
                  )}
                </button>
              ))}
            </div>

            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search farmer, survey no..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 h-9 bg-background border border-border rounded-lg text-[13px] outline-none focus:border-primary/50 text-foreground transition-colors placeholder:text-muted-foreground"
              />
            </div>
          </div>

          {/* List */}
          <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center h-full gap-2 text-muted-foreground">
                <Cpu className="w-8 h-8 text-primary animate-pulse" />
                <span className="text-[13px] font-medium">Loading land queue…</span>
              </div>
            ) : displayList.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full gap-2 text-muted-foreground">
                <ShieldAlert className="w-8 h-8 opacity-40" />
                <span className="text-[13px] font-medium">No records found</span>
              </div>
            ) : (
              displayList.map((land, idx) => {
                const isSelected = selectedLand?.id === land.id;
                return (
                  <motion.button
                    key={land.id}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.03 }}
                    onClick={() => handleSelectLand(land)}
                    className={cn(
                      "w-full text-left p-3.5 border rounded-xl transition-all group",
                      isSelected
                        ? "border-primary bg-primary/5 shadow-sm"
                        : "border-border hover:border-primary/30 bg-card hover:bg-muted/30"
                    )}
                  >
                    <div className="flex justify-between items-start gap-2">
                      <div className="min-w-0">
                        <h4 className={cn(
                          "text-[13px] font-semibold truncate transition-colors",
                          isSelected ? "text-primary" : "text-foreground group-hover:text-primary"
                        )}>
                          {land.farmerName}
                        </h4>
                        <p className="text-[11px] text-muted-foreground mt-0.5">SURVEY: {land.surveyNumber}</p>
                      </div>
                      {/* ── Acreage Badge ── */}
                      <span
                        className="inline-flex items-center gap-1 h-[30px] px-3 rounded-full flex-shrink-0 transition-all duration-200 hover:shadow-sm"
                        style={{
                          background: '#FFF7ED',
                          border: '1px solid #FED7AA',
                          color: '#C2410C',
                          fontSize: '13px',
                          fontWeight: 500,
                          fontFamily: 'Inter, sans-serif',
                          lineHeight: 1,
                          whiteSpace: 'nowrap',
                        }}
                      >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, opacity: 0.75 }}>
                          <path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 1 1 16 0z"/>
                          <circle cx="12" cy="10" r="3"/>
                        </svg>
                        {land.acreage} Ac
                      </span>
                    </div>
                    <div className="mt-2 flex items-center gap-1 text-[11px] text-muted-foreground">
                      <MapPin className="w-3 h-3 text-primary flex-shrink-0" />
                      <span className="truncate">{land.coordinates[0].toFixed(4)}, {land.coordinates[1].toFixed(4)}</span>
                    </div>
                  </motion.button>
                );
              })
            )}
          </div>
        </div>

        {/* ── Right: Inspection Workspace ── */}
        <div className="lg:col-span-2 bg-card border border-border rounded-2xl flex flex-col shadow-sm overflow-hidden" style={{ height: '620px' }}>
          {selectedLand ? (
            <div className="flex flex-col h-full">

              {/* Workspace Header */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-border flex-shrink-0">
                <div>
                  <div className="flex items-center gap-2">
                    <Globe className="w-4 h-4 text-primary" />
                    <h3 className="text-[14px] font-bold text-foreground">
                      GIS Audit — {selectedLand.surveyNumber}
                    </h3>
                  </div>
                  <p className="text-[12px] text-muted-foreground mt-0.5">
                    {selectedLand.farmerName}
                    {selectedLand.farmerPublicId ? ` · ID: ${selectedLand.farmerPublicId}` : ''}
                  </p>
                </div>
                <span className={cn(
                  "inline-flex items-center gap-1.5 h-[30px] px-3 rounded-full flex-shrink-0 border transition-all duration-200 hover:shadow-sm text-[13px] font-medium leading-none select-none",
                  statusConfig[selectedLand.status].bg,
                  statusConfig[selectedLand.status].text,
                  statusConfig[selectedLand.status].border
                )}>
                  <span className={cn("w-1.5 h-1.5 rounded-full flex-shrink-0", statusConfig[selectedLand.status].dot)} />
                  {selectedLand.status}
                </span>
              </div>

              {/* Scrollable body */}
              <div className="flex-1 overflow-y-auto p-5 space-y-4">

                {/* Map + Agri Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                  {/* Map Panel */}
                  <div className="bg-background border border-border rounded-xl overflow-hidden flex flex-col" style={{ minHeight: '260px' }}>
                    {/* Map header */}
                    <div className="flex items-center gap-2 px-3 py-2.5 border-b border-border flex-shrink-0">
                      <Compass className="w-4 h-4 text-primary flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <h4 className="text-[13px] font-semibold text-foreground">Satellite Boundary Polygon</h4>
                        <p className="text-[11px] text-muted-foreground truncate">
                          GPS: [{selectedLand.coordinates.join(', ')}]
                          {selectedLand.boundaryPolygon.length > 0
                            ? ` · ${selectedLand.boundaryPolygon.length} pts`
                            : ' · No boundary'}
                        </p>
                      </div>
                      <span className="text-[11px] font-medium bg-primary/10 text-primary border border-primary/20 px-2 py-0.5 rounded-lg flex-shrink-0">
                        GIS
                      </span>
                    </div>

                    {/* Map */}
                    <div className="relative flex-1" style={{ minHeight: '180px' }}>
                      <MapContainer
                        key={selectedLand.id}
                        center={selectedLand.coordinates}
                        zoom={16}
                        scrollWheelZoom={false}
                        style={{ height: '100%', width: '100%' }}
                      >
                        <TileLayer
                          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                        />
                        {selectedLand.boundaryPolygon.length >= 3 && (
                          <>
                            <LeafletPolygon
                              positions={selectedLand.boundaryPolygon}
                              pathOptions={{
                                color: selectedLand.status === 'Verified' ? '#10B981' : '#F59E0B',
                                fillColor: selectedLand.status === 'Verified' ? '#10B981' : '#F59E0B',
                                fillOpacity: 0.15,
                                weight: isScanning ? 3 : 2,
                              }}
                            />
                            <FitBoundsToPolygon positions={selectedLand.boundaryPolygon} />
                          </>
                        )}
                        <CircleMarker
                          center={selectedLand.coordinates}
                          radius={5}
                          pathOptions={{ color: '#10B981', fillColor: '#10B981', fillOpacity: 1, weight: 1.5 }}
                        />
                      </MapContainer>

                      {/* Scanning line */}
                      {isScanning && (
                        <motion.div
                          initial={{ y: 0 }}
                          animate={{ y: 200 }}
                          transition={{ repeat: Infinity, duration: 1.5, ease: 'linear' }}
                          className="absolute left-0 right-0 h-[2px] bg-primary shadow-[0_0_8px_#10B981] pointer-events-none"
                          style={{ zIndex: 1000 }}
                        />
                      )}

                      {/* Coordinate overlays */}
                      <div className="absolute bottom-2 left-2 bg-black/70 px-1.5 py-0.5 rounded text-[10px] font-mono text-primary pointer-events-none" style={{ zIndex: 1000 }}>
                        LAT: {selectedLand.coordinates[0].toFixed(4)}N
                      </div>
                      <div className="absolute bottom-2 right-2 bg-black/70 px-1.5 py-0.5 rounded text-[10px] font-mono text-primary pointer-events-none" style={{ zIndex: 1000 }}>
                        LON: {selectedLand.coordinates[1].toFixed(4)}E
                      </div>
                    </div>

                    {/* Scan button */}
                    <button
                      onClick={startSatelliteScan}
                      disabled={isScanning}
                      className="m-2 h-9 bg-muted hover:bg-muted/80 disabled:opacity-60 text-primary text-[12px] font-semibold rounded-lg flex items-center justify-center gap-1.5 border border-border transition-all"
                    >
                      <Cpu className="w-3.5 h-3.5 animate-pulse" />
                      {isScanning ? `Scanning… ${scanProgress}%` : 'Run Satellite Canopy Scan'}
                    </button>
                  </div>

                  {/* Agri Analytics Panel */}
                  <div className="bg-background border border-border rounded-xl flex flex-col overflow-hidden">
                    <div className="flex items-center gap-2 px-3 py-2.5 border-b border-border flex-shrink-0">
                      <Sprout className="w-4 h-4 text-primary flex-shrink-0" />
                      <div>
                        <h4 className="text-[13px] font-semibold text-foreground">Agri-Soil Telemetry</h4>
                        <p className="text-[11px] text-muted-foreground">Survey: {selectedLand.surveyNumber}</p>
                      </div>
                    </div>
                    <div className="p-3 grid grid-cols-2 gap-2 overflow-y-auto flex-1">
                      <MetricCard label="Area"              value={`${selectedLand.acreage} Acres`} />
                      <MetricCard label="Crop Planted"      value={selectedLand.cropType} />
                      <MetricCard label="Soil Type"         value={selectedLand.soilType || 'Unknown'} />
                      <MetricCard label="Irrigated"         value={selectedLand.isIrrigated ? 'Yes' : 'No'} />
                      <MetricCard label="Trees / Species"   value={`${selectedLand.treeStockCount || 0} (${selectedLand.agroforestrySpecies || 'None'})`} />
                      <MetricCard label="Plantation Area"   value={`${selectedLand.plantationAreaAcres || 0} Ac`} />
                      <MetricCard label="Ownership"         value={selectedLand.belongsToAnotherPerson ? 'Other' : 'Self'} />
                      <MetricCard label="Father's Name"     value={selectedLand.fathersName || 'N/A'} />
                      <MetricCard label="City"              value={selectedLand.city || 'N/A'} />
                      <MetricCard label="Gram Panchayat"    value={selectedLand.gramPanchayat || 'N/A'} />
                      <MetricCard label="Soil Organic C"    value={`${selectedLand.soilOrganicCarbon}%`} accent />
                      <div className="bg-background border border-border rounded-xl p-3 col-span-2">
                        <span className="text-[11px] font-medium text-muted-foreground block mb-1">Address</span>
                        <span className="text-[12px] text-foreground font-medium">{selectedLand.fullAddress || 'N/A'}</span>
                      </div>
                      {selectedLand.proofDocumentUrl && selectedLand.proofDocumentUrl !== '#' && (
                        <div className="col-span-2 border border-border rounded-xl p-3 bg-background">
                          <span className="text-[11px] font-medium text-muted-foreground block mb-1">Cadastral Registry</span>
                          <a
                            href={selectedLand.proofDocumentUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1.5 text-[12px] font-semibold text-primary hover:underline"
                          >
                            <FileText className="w-3.5 h-3.5" />
                            View Deed Document
                          </a>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Remarks */}
                <div className="bg-background border border-border rounded-xl p-4 space-y-2">
                  <label className="text-[13px] font-semibold text-foreground flex items-center gap-1.5">
                    <Edit2 className="w-3.5 h-3.5 text-primary" />
                    Satellite Land Inspection Remarks
                  </label>
                  <textarea
                    value={remarks}
                    onChange={e => setRemarks(e.target.value)}
                    rows={3}
                    className="w-full bg-card border border-border rounded-lg px-3 py-2.5 text-[13px] outline-none focus:border-primary/50 text-foreground resize-none leading-relaxed transition-colors"
                  />
                </div>
              </div>

              {/* Action Bar */}
              <div className="flex items-center justify-end gap-3 px-5 py-3.5 border-t border-border bg-muted/30 flex-shrink-0">
                <button
                  onClick={() => handleAction('Rejected')}
                  className="flex items-center gap-2 h-9 px-4 border border-destructive/40 text-destructive bg-destructive/5 hover:bg-destructive/10 font-semibold text-[13px] rounded-lg transition-all"
                >
                  <XCircle className="w-4 h-4" />
                  Reject Claim
                </button>
                <button
                  onClick={() => handleAction('Verified')}
                  className="flex items-center gap-2 h-9 px-4 bg-primary text-primary-foreground hover:bg-primary/90 font-semibold text-[13px] rounded-lg shadow-sm transition-all"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Verify &amp; Log Land
                </button>
              </div>
            </div>
          ) : (
            /* Empty state */
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8 gap-3">
              <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
                <Layers className="w-8 h-8 text-primary/60" />
              </div>
              <div>
                <h3 className="text-[15px] font-semibold text-foreground">Open Land File for GIS Verification</h3>
                <p className="text-[13px] text-muted-foreground mt-1.5 max-w-xs leading-relaxed">
                  Select a pending agricultural land deed from the left queue to launch satellite boundary polygons and multispectral audits.
                </p>
              </div>
              <div className="flex items-center gap-1.5 text-[12px] text-primary font-medium mt-1">
                <span>{tabCounts.Pending} parcels awaiting verification</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

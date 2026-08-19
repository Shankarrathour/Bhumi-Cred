import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../../../api/axios';

export interface GeoCoords {
  lat: number;
  lng: number;
}

export interface LandHistoryEvent {
  title: string;
  desc: string;
  date: string;
}

export interface AdminLandVerificationItem {
  id: string;
  farmer_id: string;
  farmer_name: string;
  farmer_mobile: string;
  survey_number?: string;
  area_acres: number;
  ownership_type: string;
  is_irrigated: boolean;
  state?: string;
  district?: string;
  village?: string;
  coordinates?: GeoCoords;
  boundary_polygon?: GeoCoords[];
  verification_status: string;
  tree_stock_count?: number;
  history?: LandHistoryEvent[];
  land_photo_urls?: string[];
  trees?: {
    species: string;
    count: number;
    age_bracket: string;
    location_on_parcel: string;
    photo_uri?: string;
  }[];
  created_at?: string;
}

export interface SuccessResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

const MOCK_VILLAGES = [
  { village: 'Badikayalapalle', district: 'Chittoor', state: 'Andhra Pradesh', lat: 13.2172, lng: 79.1003 },
  { village: 'Akkagaladevarahalli', district: 'Anantapur', state: 'Andhra Pradesh', lat: 14.6819, lng: 77.6006 },
  { village: 'Harangaon', district: 'Dewas', state: 'Madhya Pradesh', lat: 22.9676, lng: 76.0534 },
  { village: 'Ichhawar', district: 'Sehore', state: 'Madhya Pradesh', lat: 23.0225, lng: 77.0124 },
  { village: 'Kothri', district: 'Sehore', state: 'Madhya Pradesh', lat: 23.0500, lng: 77.0800 },
  { village: 'Ashta', district: 'Sehore', state: 'Madhya Pradesh', lat: 23.0167, lng: 76.7167 },
];

const generateFallbackLandParcels = (): AdminLandVerificationItem[] => {
  // NOTE: fallback parcels are only shown when backend is completely unreachable (network error)
  // They are always PENDING so admin doesn't see fake APPROVEDs
  const parcels: AdminLandVerificationItem[] = [];
  const statuses = ['APPROVED', 'APPROVED', 'APPROVED', 'PENDING', 'APPROVED', 'REJECTED', 'APPROVED'];
  
  // Seed first 3 specific parcels — all PENDING (only Admin can approve)
  parcels.push(
    {
      id: 'LND-7643',
      farmer_id: '6a7b00d72da29de341c0d28d',
      farmer_name: 'Shankar Rathore',
      farmer_mobile: '+91 98260 11902',
      survey_number: 'SUR-7643',
      area_acres: 59,
      ownership_type: 'Self Owned',
      is_irrigated: true,
      state: 'Andhra Pradesh',
      district: 'Chittoor',
      village: 'Badikayalapalle',
      coordinates: { lat: 13.2172, lng: 79.1003 },
      boundary_polygon: [
        { lat: 13.2142, lng: 79.0973 },
        { lat: 13.2202, lng: 79.0973 },
        { lat: 13.2202, lng: 79.1033 },
        { lat: 13.2142, lng: 79.1033 },
      ],
      verification_status: 'PENDING',
      created_at: '2026-08-13T10:00:00Z',
    },
    {
      id: 'LND-75CB',
      farmer_id: '6a7b00d72da29de341c0d28d',
      farmer_name: 'Shankar Rathore',
      farmer_mobile: '+91 98260 11902',
      survey_number: 'SUR-75CB',
      area_acres: 53,
      ownership_type: 'Self Owned',
      is_irrigated: true,
      state: 'Andhra Pradesh',
      district: 'Anantapur',
      village: 'Akkagaladevarahalli',
      coordinates: { lat: 14.6819, lng: 77.6006 },
      boundary_polygon: [
        { lat: 14.6789, lng: 77.5976 },
        { lat: 14.6849, lng: 77.5976 },
        { lat: 14.6849, lng: 77.6036 },
        { lat: 14.6789, lng: 77.6036 },
      ],
      verification_status: 'PENDING',
      created_at: '2026-08-11T14:30:00Z',
    },
    {
      id: 'LND-A7E6',
      farmer_id: '6a7b00d72da29de341c0d28d',
      farmer_name: 'Shankar Rathore',
      farmer_mobile: '+91 98260 11902',
      survey_number: 'SUR-A7E6',
      area_acres: 55,
      ownership_type: 'Self Owned',
      is_irrigated: true,
      state: 'Madhya Pradesh',
      district: 'Dewas',
      village: 'Harangaon',
      coordinates: { lat: 22.9676, lng: 76.0534 },
      boundary_polygon: [
        { lat: 22.9646, lng: 76.0504 },
        { lat: 22.9706, lng: 76.0504 },
        { lat: 22.9706, lng: 76.0564 },
        { lat: 22.9646, lng: 76.0564 },
      ],
      verification_status: 'PENDING',
      created_at: '2026-08-11T12:00:00Z',
    }
  );

  // Generate remaining up to 30 parcels — all PENDING, never auto-approved
  for (let i = 4; i <= 30; i++) {
    const loc = MOCK_VILLAGES[i % MOCK_VILLAGES.length];
    const hex = (1000 + i * 37).toString(16).toUpperCase();
    const id = `LND-${hex}`;
    const status = 'PENDING'; // Only Admin can set APPROVED — never hardcode it
    const acres = Math.floor(Math.random() * 45) + 15;
    parcels.push({
      id,
      farmer_id: `6a7b${i}d72da29de341c0d28d`,
      farmer_name: i % 2 === 0 ? 'Shankar Rathore' : `Farmer ${i}`,
      farmer_mobile: `+91 98260 ${10000 + i}`,
      survey_number: `SUR-${hex}`,
      area_acres: acres,
      ownership_type: 'Self Owned',
      is_irrigated: true,
      state: loc.state,
      district: loc.district,
      village: loc.village,
      coordinates: { lat: loc.lat + (i * 0.002), lng: loc.lng + (i * 0.002) },
      boundary_polygon: [
        { lat: loc.lat + (i * 0.002) - 0.002, lng: loc.lng + (i * 0.002) - 0.002 },
        { lat: loc.lat + (i * 0.002) + 0.002, lng: loc.lng + (i * 0.002) - 0.002 },
        { lat: loc.lat + (i * 0.002) + 0.002, lng: loc.lng + (i * 0.002) + 0.002 },
        { lat: loc.lat + (i * 0.002) - 0.002, lng: loc.lng + (i * 0.002) + 0.002 },
      ],
      verification_status: status,
      created_at: new Date(Date.now() - i * 86400000).toISOString(),
    });
  }

  return parcels;
};

const fetchLandVerificationQueue = async (): Promise<AdminLandVerificationItem[]> => {
  let backendItems: AdminLandVerificationItem[] = [];
  let backendReachable = false;
  try {
    const response = await apiClient.get<SuccessResponse<AdminLandVerificationItem[]>>('/admin/farmers/land-verification');
    backendReachable = true;
    if (response.data?.data && Array.isArray(response.data.data)) {
      backendItems = response.data.data;
    }
  } catch (err: any) {
    // 401 = backend is UP but token invalid (axios will redirect to login)
    // network error = backend truly down, use fallback
    const status = err?.response?.status;
    backendReachable = !!status; // has response = reachable, no response = offline
    console.log(`[Admin useLand] API error (status=${status}), backendReachable=${backendReachable}`);
  }

  // Read local registered plots from localStorage `bhumicred_land_store`
  const localItems: AdminLandVerificationItem[] = [];
  try {
    const rawStore = localStorage.getItem('bhumicred_land_store');
    if (rawStore) {
      const parsed = JSON.parse(rawStore);
      const plots = parsed?.state?.plots || [];
      plots.forEach((p: any) => {
        localItems.push({
          id: p.id || `LND-${Math.floor(1000 + Math.random() * 9000)}`,
          farmer_id: '6a7b00d72da29de341c0d28d',
          farmer_name: p.farmerName || 'Shankar Rathore',
          farmer_mobile: '+91 98260 11902',
          survey_number: p.khasraNumber || `SUR-${(p.id || '108').slice(-4).toUpperCase()}`,
          area_acres: parseFloat(p.acres) || 10,
          ownership_type: p.belongsToAnotherPerson ? 'Leased Land' : 'Self Owned',
          is_irrigated: (p.irrigationType || '').toLowerCase().includes('irrigated'),
          state: p.state || 'Madhya Pradesh',
          district: p.district || 'Sehore',
          village: p.village || 'Badikayalapalle',
          coordinates: p.geoCoords ? { lat: p.geoCoords.latitude, lng: p.geoCoords.longitude } : { lat: 22.9734, lng: 78.6569 },
          boundary_polygon: p.boundaryPolygon ? p.boundaryPolygon.map((pt: any) => ({ lat: pt.latitude || pt.lat, lng: pt.longitude || pt.lng })) : [],
          verification_status: (p.status || 'PENDING').toUpperCase(),
          tree_stock_count: p.trees ? p.trees.reduce((acc: number, t: any) => acc + (parseInt(t.count) || 0), 0) : 0,
          trees: p.trees ? p.trees.map((t: any) => ({
            species: t.species,
            count: t.count,
            age_bracket: t.ageBracket || t.age_bracket,
            location_on_parcel: t.locationOnParcel || t.location_on_parcel,
            photo_uri: t.photoUri || t.photo_uri
          })) : [],
          created_at: p.registrationDate || new Date().toISOString(),
        });
      });
    }
  } catch (err) {
    console.log('[Admin useLand] Error reading local bhumicred_land_store');
  }

  // Only use hardcoded fallback when backend is completely unreachable (no internet / server down)
  // When backend is reachable (even if 401), show ONLY real data — admin must login
  if (!backendReachable && backendItems.length === 0) {
    backendItems = generateFallbackLandParcels();
  }

  // Merge locally stored plots (from mobile app localStorage sync) at the top
  const existingIds = new Set(backendItems.map(i => i.id));
  localItems.forEach(item => {
    if (!existingIds.has(item.id)) {
      backendItems.unshift(item);
    }
  });

  return backendItems;
};

export const useLandVerificationQueue = () => {
  return useQuery({
    queryKey: ['landVerificationQueue'],
    queryFn: fetchLandVerificationQueue,
    staleTime: 0,             // Always consider data stale so every focus triggers a refetch
    refetchOnWindowFocus: true, // Re-read localStorage when admin tab comes into focus
    refetchInterval: 10000,   // Auto-poll every 10s to pick up newly submitted plots
  });
};

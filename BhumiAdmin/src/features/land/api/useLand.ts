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
  farmer_public_id?: string;
  farmer_name: string;
  farmer_mobile: string;
  survey_number?: string;
  khasra_number?: string;
  area_acres: number;
  ownership_type: string;
  is_irrigated: boolean;
  state?: string;
  district?: string;
  village?: string;
  city?: string;
  gram_panchayat?: string;
  vikash_khand?: string;
  tehsil?: string;
  full_address?: string;
  landmark?: string;
  coordinates?: GeoCoords;
  boundary_polygon?: GeoCoords[];
  verification_status: string;
  verification_remarks?: string;
  tree_stock_count?: number;
  plantation_area_acres?: number;
  agroforestry_species?: string;
  history?: LandHistoryEvent[];
  land_photo_urls?: string[];
  land_document_url?: string;
  assigned_project?: string;
  assigned_project_id?: string;
  trees?: {
    species: string;
    count: number;
    age_bracket: string;
    location_on_parcel: string;
    photo_uri?: string;
  }[];
  verified_at?: string;
  created_at?: string;
  updated_at?: string;
}

export interface SuccessResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

const fetchLandVerificationQueue = async (): Promise<AdminLandVerificationItem[]> => {
  try {
    const response = await apiClient.get<SuccessResponse<AdminLandVerificationItem[]>>('/admin/farmers/land-verification');
    if (response.data?.data && Array.isArray(response.data.data)) {
      return response.data.data;
    }
    return [];
  } catch (err: any) {
    console.error('[Admin useLand] Error fetching land verification queue:', err);
    return [];
  }
};

export const useLandVerificationQueue = () => {
  return useQuery({
    queryKey: ['landVerificationQueue'],
    queryFn: fetchLandVerificationQueue,
    staleTime: 0,             // Always consider data stale so every focus triggers a refetch
    refetchOnWindowFocus: true, // Re-read when admin tab comes into focus
    refetchInterval: 10000,   // Auto-poll every 10s to pick up updates dynamically
  });
};


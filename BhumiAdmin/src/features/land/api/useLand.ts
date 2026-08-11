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
  history?: LandHistoryEvent[];
  land_photo_urls?: string[];
  created_at?: string;
}

export interface SuccessResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

const fetchLandVerificationQueue = async (): Promise<AdminLandVerificationItem[]> => {
  const response = await apiClient.get<SuccessResponse<AdminLandVerificationItem[]>>('/admin/farmers/land-verification');
  return response.data?.data || [];
};

export const useLandVerificationQueue = () => {
  return useQuery({
    queryKey: ['landVerificationQueue'],
    queryFn: fetchLandVerificationQueue,
    staleTime: 5 * 60 * 1000,
  });
};

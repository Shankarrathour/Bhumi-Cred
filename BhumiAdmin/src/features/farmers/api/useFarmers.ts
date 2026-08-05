import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../../../api/axios';

export interface FarmerListItem {
  id: string;
  farmer_id: string;
  first_name: string;
  last_name: string;
  mobile: string;
  state: string;
  district: string;
  village: string;
  kyc_status: string;
  is_active: boolean;
  total_land_area: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  size: number;
  pages: number;
}

const fetchFarmers = async (page = 1, limit = 10): Promise<PaginatedResponse<FarmerListItem>> => {
  try {
    const response = await apiClient.get('/admin/farmers', {
      params: { page, limit },
    });
    
    // Fallback to mock data structure if backend is not seeded or throws
    if (response.data && response.data.meta) {
      return {
        data: response.data.data,
        total: response.data.meta.total,
        page: response.data.meta.page,
        size: response.data.meta.limit,
        pages: response.data.meta.total_pages,
      };
    }
    return response.data;
  } catch (err) {
    console.error('Failed to fetch farmers, returning empty', err);
    return { data: [], total: 0, page, size: limit, pages: 0 };
  }
};

export const useFarmers = (page = 1, limit = 10) => {
  return useQuery({
    queryKey: ['farmers', page, limit],
    queryFn: () => fetchFarmers(page, limit),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export interface AdminFarmerDetailResponse {
  id: string;
  farmer_id?: string;
  mobile: string;
  full_name?: string;
  state?: string;
  district?: string;
  village?: string;
  kyc_status: string;
  wallet_balance: number;
  total_acreage: number;
  total_trees: number;
  carbon_credits_generated: number;
  created_at: string;
}

export const useFarmerDetail = (id: string | undefined) => {
  return useQuery({
    queryKey: ['farmer', id],
    queryFn: async (): Promise<AdminFarmerDetailResponse | null> => {
      if (!id) return null;
      try {
        const response = await apiClient.get(`/admin/farmers/${id}`);
        return response.data.data;
      } catch (err) {
        console.error('Failed to fetch farmer detail', err);
        return null;
      }
    },
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });
};

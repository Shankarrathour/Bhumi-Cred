import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../../../api/axios';

export type KYCStatus = 'pending' | 'submitted' | 'verified' | 'rejected' | 'not_started';

export interface FarmerDocument {
  id: string;
  farmer_id: string | null;
  full_name: string | null;
  mobile: string;
  kyc_status: KYCStatus;
  is_active: boolean;
  state: string | null;
  district: string | null;
  onboarding_completed: boolean;
  total_acreage: number;
  sustainability_score: number;
  created_at: string;
}

export interface PaginatedFarmers {
  items: FarmerDocument[];
  total: number;
  page: number;
  limit: number;
  pages: number;
}

export const useFarmerDocuments = (page = 1, limit = 20) =>
  useQuery<PaginatedFarmers>({
    queryKey: ['farmer-documents', page, limit],
    queryFn: async () => {
      const res = await apiClient.get('/admin/farmers', {
        params: { page, limit },
      });
      return res.data;
    },
  });

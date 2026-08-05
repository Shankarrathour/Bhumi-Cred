import { useQuery } from '@tanstack/react-query';
import { apiClient as api } from '../../../api/axios';

export interface AdminTreeRegistrationResponse {
  id: string;
  farmer_id: string;
  tree_species: string;
  tree_count: number;
  plantation_year: number;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'VERIFIED';
  village?: string;
  district?: string;
  state?: string;
  created_at: string;
}

export interface AdminTreeRegistrationListResponse {
  data: AdminTreeRegistrationResponse[];
  meta: {
    total: number;
    page: number;
    limit: number;
    total_pages: number;
  };
}

export const useTreeRegistrations = (skip: number = 0, limit: number = 50) => {
  return useQuery({
    queryKey: ['adminTreeRegistrations', skip, limit],
    queryFn: async (): Promise<AdminTreeRegistrationListResponse> => {
      const response = await api.get('/admin/tree-registrations', { params: { skip, limit } });
      return response.data;
    },
  });
};

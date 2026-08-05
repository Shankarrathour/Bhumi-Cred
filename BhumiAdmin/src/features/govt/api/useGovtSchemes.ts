import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../../../api/axios';

export interface GovtSchemeListItem {
  id: string;
  scheme_id: string;
  name: string;
  department: string;
  ministry: string;
  state: string;
  scheme_type: 'central' | 'state' | 'joint';
  eligibility_criteria: string;
  benefit_amount: number;
  currency: string;
  applications_today: number;
  total_applications: number;
  approved_applications: number;
  status: 'active' | 'inactive' | 'draft' | 'expired';
  start_date: string;
  end_date: string | null;
  created_at: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  size: number;
  pages: number;
}

const fetchGovtSchemes = async (
  page = 1,
  limit = 15,
): Promise<PaginatedResponse<GovtSchemeListItem>> => {
  const response = await apiClient.get<PaginatedResponse<GovtSchemeListItem>>(
    '/admin/govt-schemes',
    { params: { page, limit } },
  );
  return response.data;
};

export const useGovtSchemes = (page = 1, limit = 15) => {
  return useQuery({
    queryKey: ['govtSchemes', page, limit],
    queryFn: () => fetchGovtSchemes(page, limit),
    staleTime: 5 * 60 * 1000,
  });
};

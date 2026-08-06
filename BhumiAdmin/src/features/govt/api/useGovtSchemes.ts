import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../../../api/axios';

export interface GovtSchemeListItem {
  id: string;
  scheme_id?: string;
  name: string;
  department?: string;
  ministry?: string;
  state?: string;
  scheme_type?: 'central' | 'state' | 'joint';
  eligibility_criteria?: string;
  benefit_amount?: number;
  currency?: string;
  applications_today?: number;
  total_applications?: number;
  approved_applications?: number;
  status: string;
  start_date?: string;
  end_date?: string | null;
  created_at?: string;
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
  limit = 20,
): Promise<PaginatedResponse<GovtSchemeListItem>> => {
  const response = await apiClient.get('/admin/agri/schemes', {
    params: { page, limit },
  });

  const raw = response.data;

  // Handle both { success: true, data: [...] } and standard array/paginated shapes
  let items: GovtSchemeListItem[] = [];
  if (Array.isArray(raw)) {
    items = raw;
  } else if (Array.isArray(raw?.data)) {
    items = raw.data;
  } else if (Array.isArray(raw?.items)) {
    items = raw.items;
  }

  const total = items.length;
  return {
    data: items,
    total: raw?.total ?? total,
    page: raw?.page ?? page,
    size: raw?.size ?? limit,
    pages: (raw?.pages ?? Math.ceil(total / limit)) || 1,
  };
};

export const useGovtSchemes = (page = 1, limit = 20) => {
  return useQuery({
    queryKey: ['govtSchemes', page, limit],
    queryFn: () => fetchGovtSchemes(page, limit),
    staleTime: 5 * 60 * 1000,
  });
};

export const useGovtDetails = (id?: string | Record<string, any>) => {
  const targetId = typeof id === 'string' ? id : (id as any)?.id;
  const isValidObjectId = typeof targetId === 'string' && /^[0-9a-fA-F]{24}$/.test(targetId);

  return useQuery({
    queryKey: ['govtDetails', targetId],
    queryFn: async () => {
      if (!isValidObjectId) return null;
      try {
        const res = await apiClient.get(`/admin/agri/applications/${targetId}`);
        return res.data;
      } catch (err) {
        return null;
      }
    },
    enabled: isValidObjectId,
  });
};

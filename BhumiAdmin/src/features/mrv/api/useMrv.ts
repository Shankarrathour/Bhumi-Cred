import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../../../api/axios';

export interface AdminProject {
  id: string;
  project_id: string;
  title: string;
  category: string;
  description: string;
  district: string;
  state: string;
  target_area_acres: number;
  estimated_carbon_impact: number;
  status: string;
  status_label: string;
  is_public: boolean;
  is_active: boolean;
  is_tracking_active: boolean;
  progress_percent: number | null;
  current_stage: string | null;
  trees_registered: number | null;
  ngo_partner: string | null;
  created_at: string;
  updated_at: string;
}

export const useAdminProjects = (includeInactive = false) =>
  useQuery<AdminProject[]>({
    queryKey: ['admin-projects', includeInactive],
    queryFn: async () => {
      const res = await apiClient.get('/admin/projects', {
        params: { include_inactive: includeInactive },
      });
      // Backend returns SuccessResponse<list[AdminProjectResponse]>: { message, data }
      return res.data?.data ?? res.data;
    },
  });

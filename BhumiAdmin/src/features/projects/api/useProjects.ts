import { useQuery } from '@tanstack/react-query';
import { apiClient as api } from '../../../api/axios';

export interface AdminProjectResponse {
  id: string;
  name: string;
  location: string;
  estimated_carbon_credits: number;
  status: 'planning' | 'active' | 'completed' | 'suspended';
  start_date: string;
  farmers_enrolled: number;
  total_area_acres: number;
  created_at: string;
  updated_at: string;
}

export const useProjects = (includeInactive: boolean = false) => {
  return useQuery({
    queryKey: ['adminProjects', includeInactive],
    queryFn: async (): Promise<AdminProjectResponse[]> => {
      const response = await api.get('/admin/projects', { params: { include_inactive: includeInactive } });
      return response.data.data;
    },
  });
};

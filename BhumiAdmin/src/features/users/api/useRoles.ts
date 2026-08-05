import { useQuery } from '@tanstack/react-query';
import { apiClient as api } from '../../../api/axios';

export interface RoleResponse {
  id: string;
  name: string;
  code: string;
  description?: string;
  is_system_role: boolean;
  is_active: boolean;
  permissions: Record<string, Record<string, boolean>>;
  created_at: string;
}

export const useRoles = () => {
  return useQuery({
    queryKey: ['adminRoles'],
    queryFn: async (): Promise<RoleResponse[]> => {
      try {
        const response = await api.get('/admin/roles');
        return Array.isArray(response.data) ? response.data : [];
      } catch (err) {
        console.error('Failed to fetch admin roles:', err);
        return [];
      }
    },
    staleTime: 5 * 60 * 1000, // 5 mins
  });
};

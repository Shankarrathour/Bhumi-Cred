import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient as api } from '../../../api/axios';

export interface AdminProjectResponse {
  id: string;
  project_id?: string;
  name?: string;
  title?: string;
  category?: string;
  description?: string;
  location?: string;
  state?: string;
  district?: string;
  target_area_acres?: number;
  total_area_acres?: number;
  estimated_carbon_credits?: number;
  estimated_carbon_impact?: number;
  ngo_partner?: string;
  status: string;
  start_date?: string;
  farmers_enrolled?: number;
  created_at?: string;
  updated_at?: string;
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

export const useCreateProject = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: any) => {
      const response = await api.post('/admin/projects', payload);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminProjects'] });
    },
  });
};

export const useUpdateProject = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ projectId, payload }: { projectId: string; payload: any }) => {
      const response = await api.patch(`/admin/projects/${projectId}`, payload);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminProjects'] });
      queryClient.invalidateQueries({ queryKey: ['admin-project-enrollments'] });
    },
  });
};

export const useDeleteProject = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (projectId: string) => {
      const response = await api.delete(`/admin/projects/${projectId}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminProjects'] });
      queryClient.invalidateQueries({ queryKey: ['admin-project-enrollments'] });
    },
  });
};

export const useAssignFarmerProject = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ projectId, farmerId, landAreaAcres, treeCount }: { projectId: string; farmerId: string; landAreaAcres?: number; treeCount?: number }) => {
      const response = await api.post(`/admin/projects/${projectId}/assign`, {
        farmer_id: farmerId,
        land_area_acres: landAreaAcres || 10,
        tree_count: treeCount || 40,
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminProjects'] });
      queryClient.invalidateQueries({ queryKey: ['admin-project-enrollments'] });
      queryClient.invalidateQueries({ queryKey: ['farmer'] });
      queryClient.invalidateQueries({ queryKey: ['farmers'] });
    },
  });
};

export const useDeleteEnrollment = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (enrollmentId: string) => {
      const response = await api.delete(`/admin/projects/enrollments/${enrollmentId}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminProjects'] });
      queryClient.invalidateQueries({ queryKey: ['admin-project-enrollments'] });
      queryClient.invalidateQueries({ queryKey: ['farmer'] });
      queryClient.invalidateQueries({ queryKey: ['farmers'] });
    },
  });
};

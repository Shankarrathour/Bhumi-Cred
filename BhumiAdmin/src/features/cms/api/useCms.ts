import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../../../api/axios';

export interface Banner {
  id: string | number;
  title: string;
  image_url: string;
  is_active: boolean;
  position: number | string;
}

export interface CmsDashboardConfig {
  [key: string]: unknown;
}

export const useBanners = () =>
  useQuery<Banner[]>({
    queryKey: ['admin-banners'],
    queryFn: async () => {
      const res = await apiClient.get('/admin/banners');
      return res.data;
    },
  });

export const useCmsDashboard = () =>
  useQuery<CmsDashboardConfig>({
    queryKey: ['cms-user-dashboard'],
    queryFn: async () => {
      const res = await apiClient.get('/cms/user-dashboard');
      return res.data;
    },
    retry: false,
  });

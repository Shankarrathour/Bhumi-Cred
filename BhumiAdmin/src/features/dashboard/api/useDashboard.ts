import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../../../api/axios';

export interface DashboardSummary {
  product_summary: {
    total_products: number;
    approved_products: number;
    pending_approval: number;
  };
  vendor_summary: {
    total_vendors: number;
    active_vendors: number;
  };
  category_summary: {
    total_categories: number;
  };
}

const fetchDashboard = async (): Promise<DashboardSummary> => {
  const response = await apiClient.get<DashboardSummary>('/admin/dashboard');
  return response.data;
};

export const useDashboard = () => {
  return useQuery({
    queryKey: ['dashboard'],
    queryFn: fetchDashboard,
    staleTime: 60 * 1000,
  });
};

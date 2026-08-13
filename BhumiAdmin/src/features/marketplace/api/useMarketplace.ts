import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient as api } from '../../../api/axios';

export interface AdminProductResponse {
  id: string;
  name: string;
  sku: string;
  price: number;
  stock_quantity: number;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'SUSPENDED';
  vendor_id: string;
  category_id: string;
  brand: string;
}

export interface AdminProductListResponse {
  items: AdminProductResponse[];
  total: number;
  page: number;
  size: number;
  pages: number;
}

export const useMarketplaceProducts = (page: number = 1, limit: number = 20) => {
  return useQuery({
    queryKey: ['adminProducts', page, limit],
    queryFn: async (): Promise<AdminProductListResponse> => {
      const response = await api.get(`/admin/products`, { params: { page, limit } });
      return response.data;
    },
  });
};

export const useApproveProduct = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (productId: string) => {
      const response = await api.patch(`/admin/products/${productId}/approve`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminProducts'] });
    },
  });
};

export const useRejectProduct = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (productId: string) => {
      const response = await api.patch(`/admin/products/${productId}/reject`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminProducts'] });
    },
  });
};

export const useAdminOrders = () => {
  return useQuery({
    queryKey: ['adminOrders'],
    queryFn: async (): Promise<any> => {
      const response = await api.get(`/admin/marketplace-orders`);
      return response.data;
    },
  });
};

export const useUpdateAdminOrderStatus = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ orderId, status }: { orderId: string; status: string }) => {
      const response = await api.patch(`/admin/marketplace-orders/${orderId}/status`, { status });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminOrders'] });
    },
  });
};

import { useQuery } from '@tanstack/react-query';
import { apiClient as api } from '../../../api/axios';

export interface VendorResponse {
  id: string;
  vendor_id: string;
  name: string;
  store_name: string;
  phone: string;
  gst_number?: string;
  status: string;
  is_verified: boolean;
  wallet_balance: number;
}

export interface VendorListResponse {
  data: VendorResponse[];
  total: number;
  page: number;
  size: number;
  pages: number;
}

export const usePartners = (page: number = 1, limit: number = 50, search?: string) => {
  return useQuery({
    queryKey: ['adminVendors', page, limit, search],
    queryFn: async (): Promise<VendorListResponse> => {
      const response = await api.get('/admin/vendors', { params: { page, limit, search } });
      return response.data;
    },
  });
};

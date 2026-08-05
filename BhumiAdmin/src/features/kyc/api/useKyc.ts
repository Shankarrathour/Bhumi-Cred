import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient as api } from '../../../api/axios';

export interface KycRequest {
  id: string;
  type: string;
  name: string;
  submitDate: string;
  status: string;
  score: number;
}

export const useKycRequests = () => {
  return useQuery({
    queryKey: ['kycRequests'],
    queryFn: async (): Promise<KycRequest[]> => {
      try {
        const response = await api.get('/admin/farmers', { params: { kyc_status: 'PENDING', limit: 100 } });
        const farmers = response.data?.data || [];
        return farmers.map((f: any) => ({
          id: f.id,
          type: 'Farmer',
          name: f.name,
          submitDate: f.created_at,
          status: 'Pending',
          score: 85, // Mock score for now
        }));
      } catch (err) {
        console.error('Failed to fetch KYC requests', err);
        return [];
      }
    },
  });
};

export const useApproveKyc = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (farmerId: string) => {
      const response = await api.put(`/admin/farmers/${farmerId}/approve`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kycRequests'] });
    },
  });
};

export const useRejectKyc = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ farmerId, reason }: { farmerId: string, reason: string }) => {
      const response = await api.put(`/admin/farmers/${farmerId}/reject`, { kyc_remarks: reason });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kycRequests'] });
    },
  });
};

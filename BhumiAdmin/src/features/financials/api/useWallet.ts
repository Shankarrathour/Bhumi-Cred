import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient as api } from '../../../api/axios';

export interface AdminWithdrawalResponse {
  id: string;
  farmer_id: string;
  amount: number;
  status: 'pending' | 'approved' | 'rejected';
  requested_at: string;
  processed_at?: string;
  rejection_reason?: string;
}

export interface AdminWithdrawalListResponse {
  items: AdminWithdrawalResponse[];
  total: number;
  page: number;
  size: number;
  pages: number;
}

export const useWithdrawals = (page: number = 1, limit: number = 20) => {
  return useQuery({
    queryKey: ['adminWithdrawals', page, limit],
    queryFn: async (): Promise<AdminWithdrawalListResponse> => {
      try {
        const response = await api.get(`/admin/withdrawals`, { params: { page, limit } });
        if (response.data && response.data.meta) {
          return {
            items: response.data.data,
            total: response.data.meta.total,
            page: response.data.meta.page,
            size: response.data.meta.limit,
            pages: response.data.meta.total_pages,
          };
        }
        return response.data;
      } catch (err) {
        console.error('Failed to fetch withdrawals', err);
        return { items: [], total: 0, page, size: limit, pages: 0 };
      }
    },
  });
};

export const useApproveWithdrawal = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (withdrawalId: string) => {
      const response = await api.put(`/admin/withdrawals/${withdrawalId}/approve`, {
        transaction_reference: `TRX-APPROVE-${withdrawalId}`
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminWithdrawals'] });
    },
  });
};

export const useRejectWithdrawal = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ withdrawalId, reason }: { withdrawalId: string, reason: string }) => {
      const response = await api.put(`/admin/withdrawals/${withdrawalId}/reject`, {
        reason: reason
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminWithdrawals'] });
    },
  });
};

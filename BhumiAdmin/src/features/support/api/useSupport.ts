import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient as api } from '../../../api/axios';

export interface TicketMessage {
  sender: string;
  sender_name: string;
  message: string;
  timestamp: string;
}

export interface Ticket {
  id: string;
  vendor_id: string;
  vendor_name: string;
  subject: string;
  category?: string;
  description: string;
  status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  created_at: string;
  updated_at: string;
  messages: TicketMessage[];
}

export const useSupportTickets = () => {
  return useQuery({
    queryKey: ['supportTickets'],
    queryFn: async (): Promise<Ticket[]> => {
      try {
        const response = await api.get('/admin/support');
        return response.data.data;
      } catch (err) {
        console.error('Failed to fetch support tickets', err);
        return [];
      }
    }
  });
};

export const useReplyTicket = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ ticketId, message }: { ticketId: string; message: string }) => {
      const response = await api.post(`/admin/support/${ticketId}/reply`, { message });
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['supportTickets'] });
    }
  });
};

export const useUpdateTicketStatus = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ ticketId, status }: { ticketId: string; status: string }) => {
      const response = await api.patch(`/admin/support/${ticketId}/status`, { status });
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['supportTickets'] });
    }
  });
};

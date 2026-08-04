import api from './apiClient';

export interface TicketMessage {
  sender: 'vendor' | 'admin';
  sender_name: string;
  message: string;
  timestamp: string;
}

export interface SupportTicketResponse {
  id: string;
  vendor_id: string;
  vendor_name: string;
  subject: string;
  category: string | null;
  description: string;
  status: 'Open' | 'In Progress' | 'Resolved';
  priority: 'Low' | 'Medium' | 'High' | 'Critical';
  created_at: string;
  updated_at: string;
  messages: TicketMessage[];
}

export interface CreateTicketPayload {
  subject: string;
  category?: string;
  description: string;
}

export const createTicketAPI = async (payload: CreateTicketPayload): Promise<SupportTicketResponse> => {
  const response = await api.post('/vendor/support', payload);
  return response.data.data;
};

export const fetchTicketsAPI = async (): Promise<SupportTicketResponse[]> => {
  const response = await api.get('/vendor/support');
  return response.data.data;
};

export const fetchTicketAPI = async (ticketId: string): Promise<SupportTicketResponse> => {
  const response = await api.get(`/vendor/support/${ticketId}`);
  return response.data.data;
};

export const replyToTicketAPI = async (ticketId: string, message: string): Promise<SupportTicketResponse> => {
  const response = await api.post(`/vendor/support/${ticketId}/reply`, { message });
  return response.data.data;
};

import api from './apiClient';

export interface NotificationResponse {
  id: string;
  farmer_id?: string | null;
  vendor_id?: string | null;
  title: string;
  message: string;
  type: string;
  is_read: boolean;
  created_at: string;
}

export const fetchNotificationsAPI = async (limit: number = 50): Promise<NotificationResponse[]> => {
  const response = await api.get('/notifications', { params: { limit } });
  return response.data.data;
};

export const markNotificationAsReadAPI = async (id: string): Promise<NotificationResponse> => {
  const response = await api.patch(`/notifications/${id}/read`);
  return response.data.data;
};

export const fetchVendorNotificationsAPI = async (limit: number = 50): Promise<NotificationResponse[]> => {
  // Vendor notifications share the same backend endpoint as farmer notifications
  const response = await api.get('/notifications', { params: { limit } });
  return response.data.data;
};

export const markVendorNotificationAsReadAPI = async (id: string): Promise<NotificationResponse> => {
  // Vendor notifications share the same backend endpoint as farmer notifications
  const response = await api.patch(`/notifications/${id}/read`);
  return response.data.data;
};

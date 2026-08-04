import { create } from 'zustand';
import adminApi from '../api/apiClient';

export interface AdminNotification {
  id: string;
  title: string;
  message: string;
  type: string;
  actorType: 'farmer' | 'vendor' | null;
  isRead: boolean;
  createdAt: string;
}

function mapNotification(n: any): AdminNotification {
  return {
    id: n.id,
    title: n.title,
    message: n.message,
    type: n.type || 'system',
    actorType: n.actor_type ?? null,
    isRead: !!n.is_read,
    createdAt: n.created_at,
  };
}

interface AdminNotificationState {
  notifications: AdminNotification[];
  unreadCount: number;
  isLoading: boolean;
  fetchNotifications: () => Promise<void>;
  fetchUnreadCount: () => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
}

export const useAdminNotificationStore = create<AdminNotificationState>((set, get) => ({
  notifications: [],
  unreadCount: 0,
  isLoading: false,

  fetchNotifications: async () => {
    set({ isLoading: true });
    try {
      const res = await adminApi.get('/admin/notifications', { params: { limit: 100 } });
      const notifications: AdminNotification[] = (res.data?.data ?? []).map(mapNotification);
      set({ notifications, isLoading: false });
    } catch (err) {
      console.warn('[adminNotificationStore] fetchNotifications failed:', err);
      set({ isLoading: false });
    }
  },

  fetchUnreadCount: async () => {
    try {
      const res = await adminApi.get('/admin/notifications/unread-count');
      set({ unreadCount: res.data?.data?.count ?? 0 });
    } catch (err) {
      console.warn('[adminNotificationStore] fetchUnreadCount failed:', err);
    }
  },

  markAsRead: async (id: string) => {
    const target = get().notifications.find((n) => n.id === id);
    if (target?.isRead) return;
    try {
      await adminApi.patch(`/admin/notifications/${id}/read`);
      set({
        notifications: get().notifications.map((n) => (n.id === id ? { ...n, isRead: true } : n)),
        unreadCount: Math.max(0, get().unreadCount - 1),
      });
    } catch (err) {
      console.warn('[adminNotificationStore] markAsRead failed:', err);
    }
  },
}));

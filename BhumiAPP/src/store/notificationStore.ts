import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert } from 'react-native';

import {
  fetchNotificationsAPI,
  markNotificationAsReadAPI,
  fetchVendorNotificationsAPI,
  markVendorNotificationAsReadAPI,
  NotificationResponse,
} from '../api/notificationApi';

const isVendorRole = (): boolean => require('./authStore').useAuthStore.getState().role === 'vendor';

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  date: string;
  read: boolean;
  type: string;
}

interface NotificationState {
  notifications: NotificationItem[];
  fetchNotifications: () => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => void;
  clearNotifications: () => void;
}

export const useNotificationStore = create<NotificationState>()(
  persist(
    (set, get) => ({
      notifications: [],

      fetchNotifications: async () => {
        try {
          const data = isVendorRole() ? await fetchVendorNotificationsAPI(50) : await fetchNotificationsAPI(50);
          const existingIds = new Set(get().notifications.map(n => n.id));
          
          const formatted = data.map(n => ({
            id: n.id,
            title: n.title,
            message: n.message,
            date: new Date(n.created_at).toISOString().split('T')[0],
            read: n.is_read,
            type: n.type || 'system'
          }));
          
          // Trigger local push notification for newly received items
          data.forEach(n => {
            if (!existingIds.has(n.id) && !n.is_read) {
              Alert.alert(n.title, n.message);
            }
          });

          set({ notifications: formatted });
        } catch (error) {
          console.error("Failed to fetch notifications", error);
        }
      },

      markAsRead: async (id) => {
        try {
          if (isVendorRole()) {
            await markVendorNotificationAsReadAPI(id);
          } else {
            await markNotificationAsReadAPI(id);
          }
          set({
            notifications: get().notifications.map((not) =>
              not.id === id ? { ...not, read: true } : not
            ),
          });
        } catch (error) {
          console.error("Failed to mark notification as read", error);
        }
      },

      markAllAsRead: () => {
        set({
          notifications: get().notifications.map((not) => ({ ...not, read: true })),
        });
      },

      clearNotifications: () => {
        set({ notifications: [] });
      },
    }),
    {
      name: 'bhumicred_notifications_store',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);

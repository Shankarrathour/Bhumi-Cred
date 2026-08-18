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
  addNotification: (item: { title: string; message: string; type?: string }) => void;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => void;
  clearNotifications: () => void;
}

export const useNotificationStore = create<NotificationState>()(
  persist(
    (set, get) => ({
      notifications: [
        {
          id: 'notif_referral',
          title: 'Referral Reward Credited 🎁',
          message: 'Referral bonus of ₹500 + 10 tCO₂e has been credited to your wallet for inviting Ramesh Patel.',
          date: 'Just now',
          read: false,
          type: 'referral',
        },
        {
          id: 'notif_payment',
          title: 'Payment Receipt Available 💳',
          message: 'Transaction TXN-984210 of ₹499 for Premium Soil Scan was successful. Receipt ready.',
          date: 'Today',
          read: false,
          type: 'payment',
        },
        {
          id: 'notif_insurance',
          title: 'Tree Insurance Policy Active 🛡️',
          message: 'Policy POL-ECOLIFE-1829 for 8 boundary trees is active with ₹800/tree sum insured.',
          date: 'Today',
          read: false,
          type: 'insurance',
        },
        {
          id: 'notif_soil',
          title: 'Your Soil Report is Ready 🧪',
          message: 'Lab audit completed for Plot 1 (Bhopal). Soil Health Score: 8.4/10. Tap to download PDF.',
          date: 'Yesterday',
          read: true,
          type: 'soil_report',
        },
        {
          id: 'notif_mrv',
          title: 'MRV Activity Scheduled 🛰️',
          message: 'Drone spectrometer scan & satellite radar audit scheduled for 18 Aug 2026.',
          date: '14 Aug 2026',
          read: true,
          type: 'mrv_scheduled',
        },
        {
          id: 'notif_project',
          title: 'Project Assigned to Your Land 🌳',
          message: 'Land parcel MP-Bhopal Block A has been assigned to Carbon Credit Project MP-2026-08.',
          date: '12 Aug 2026',
          read: true,
          type: 'project_assigned',
        },
        {
          id: 'notif_approved',
          title: 'Your Land has Been Approved ✅',
          message: 'Congratulations! Land plot of 2.5 Acres in Sehore has been verified by the Admin.',
          date: '10 Aug 2026',
          read: true,
          type: 'approved',
        },
        {
          id: 'notif_correction',
          title: 'Action Required on Land Application ⚠️',
          message: 'Admin requested a clearer photo of boundary trees. Please replace document to resubmit.',
          date: '08 Aug 2026',
          read: true,
          type: 'correction',
        },
        {
          id: 'notif_review',
          title: 'Your Application is Under Review 🔍',
          message: 'GIS check & document verification in progress by the Admin field team.',
          date: '05 Aug 2026',
          read: true,
          type: 'admin_review',
        },
        {
          id: 'notif_submitted',
          title: 'Land Application Received 📋',
          message: 'Land application APP-2026-8801 for 2.5 Acres submitted successfully.',
          date: '04 Aug 2026',
          read: true,
          type: 'land_submitted',
        },
        {
          id: 'notif_otp',
          title: 'Verification Code Ready 🔑',
          message: 'Your OTP code is 482910 for secure BhumiCred authentication.',
          date: '01 Aug 2026',
          read: true,
          type: 'otp',
        },
      ],

      addNotification: (item) => {
        const newItem: NotificationItem = {
          id: `notif_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
          title: item.title,
          message: item.message,
          date: 'Just now',
          read: false,
          type: item.type || 'system',
        };
        set((state) => ({
          notifications: [newItem, ...state.notifications],
        }));
      },

      fetchNotifications: async () => {
        try {
          const data = isVendorRole() ? await fetchVendorNotificationsAPI(50) : await fetchNotificationsAPI(50);
          if (data && Array.isArray(data) && data.length > 0) {
            const formatted = data.map(n => ({
              id: n.id,
              title: n.title,
              message: n.message,
              date: new Date(n.created_at).toISOString().split('T')[0],
              read: n.is_read,
              type: n.type || 'system'
            }));
            
            const existingIds = new Set(get().notifications.map(n => n.id));
            const newNotifs = formatted.filter(n => !existingIds.has(n.id));
            set((state) => ({
              notifications: [...newNotifs, ...state.notifications],
            }));
          }
        } catch (error) {
          // Gracefully suppress 401 token errors, local notifications store will handle state
          console.log("[notificationStore] fetchNotifications API warning (handled gracefully)");
        }
      },

      markAsRead: async (id) => {
        try {
          if (id && !id.startsWith('notif_') && id !== 'welcome_notif') {
            if (isVendorRole()) {
              await markVendorNotificationAsReadAPI(id);
            } else {
              await markNotificationAsReadAPI(id);
            }
          }
        } catch (error) {
          // Suppress API errors
        }
        set({
          notifications: get().notifications.map((not) =>
            not.id === id ? { ...not, read: true } : not
          ),
        });
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

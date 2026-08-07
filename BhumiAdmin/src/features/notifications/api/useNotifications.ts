import { useQuery } from '@tanstack/react-query';
import { apiClient as api } from '../../../api/axios';

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: 'critical' | 'warning' | 'info' | 'success';
  category: 'Security' | 'MRV' | 'Payments' | 'Weather' | 'System';
  is_read: boolean;
  created_at: string;
  action_url?: string;
  meta?: Record<string, any>;
}

export const INITIAL_NOTIFICATIONS: NotificationItem[] = [
  {
    id: 'NOTIF-9001',
    title: 'Forest Fire Alert Detected',
    message: 'Satellite anomaly detected high thermal signature in Maharashtra Region, Sector 4B.',
    type: 'critical',
    category: 'Weather',
    is_read: false,
    created_at: new Date(Date.now() - 2 * 60 * 1000).toISOString(),
    action_url: '/command-center',
  },
  {
    id: 'NOTIF-9002',
    title: 'Land Plot Boundary Dispute Pending',
    message: 'Farmer Ramesh Patel requested manual GIS verification for survey plot #MP-4029.',
    type: 'warning',
    category: 'MRV',
    is_read: false,
    created_at: new Date(Date.now() - 22 * 60 * 1000).toISOString(),
    action_url: '/land',
  },
  {
    id: 'NOTIF-9003',
    title: 'Withdrawal Payout Batch Ready',
    message: '14 withdrawal requests totaling ₹4.85 Lakhs require Super Admin approval signature.',
    type: 'warning',
    category: 'Payments',
    is_read: false,
    created_at: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
    action_url: '/wallet',
  },
  {
    id: 'NOTIF-9004',
    title: 'Carbon Credit Issuance Approved',
    message: '1,250 VCU credits issued for Project Green Teak Plantation (Batch #BCH-84A190).',
    type: 'success',
    category: 'MRV',
    is_read: true,
    created_at: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
    action_url: '/carbon',
  },
  {
    id: 'NOTIF-9005',
    title: 'System Security Audit Completed',
    message: 'Quarterly RBAC & API key permission verification passed with 0 vulnerability flags.',
    type: 'info',
    category: 'Security',
    is_read: true,
    created_at: new Date(Date.now() - 5 * 3600 * 1000).toISOString(),
    action_url: '/audit',
  },
  {
    id: 'NOTIF-9006',
    title: 'Heavy Rainfall Warning — Gujarat',
    message: 'IMD alert issued for heavy precipitation (>120mm) across Surat and Vadodara districts.',
    type: 'warning',
    category: 'Weather',
    is_read: true,
    created_at: new Date(Date.now() - 8 * 3600 * 1000).toISOString(),
    action_url: '/command-center',
  },
];

export const useNotifications = () => {
  return useQuery({
    queryKey: ['adminNotifications'],
    queryFn: async (): Promise<NotificationItem[]> => {
      try {
        const response = await api.get('/admin/notifications');
        const data = response.data?.data || response.data;
        return Array.isArray(data) && data.length > 0 ? data : INITIAL_NOTIFICATIONS;
      } catch {
        return INITIAL_NOTIFICATIONS;
      }
    },
    staleTime: 60 * 1000,
  });
};

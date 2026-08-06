import { useQuery, useMutation } from '@tanstack/react-query';
import { apiClient } from '../../../api/axios';

export interface PlatformInfo {
  product_summary: { total_products: number; pending_approval: number };
  vendor_summary: { total_vendors: number; active_vendors: number };
}

export interface SettingsPayload {
  platform_name: string;
  support_email: string;
  carbon_price: string;
  razorpay_key: string;
  payout_webhook: string;
  auto_payouts: boolean;
  require_mfa: boolean;
  force_password_reset: boolean;
}

export const usePlatformInfo = () =>
  useQuery<PlatformInfo>({
    queryKey: ['platform-info-settings'],
    queryFn: async () => {
      const res = await apiClient.get('/admin/dashboard');
      return res.data;
    },
    retry: false,
  });

export const useSaveSettings = () =>
  useMutation({
    mutationFn: async (payload: SettingsPayload) => {
      console.log('[Settings] Saving settings payload:', payload);
      const res = await apiClient.post('/admin/settings', payload);
      return res.data;
    },
    onError: (err) => {
      console.warn('[Settings] Save failed (endpoint may not exist yet):', err);
    },
  });

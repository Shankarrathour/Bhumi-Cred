import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../../api/axios';

export interface PlatformInfo {
  product_summary?: { total_products: number; pending_approval: number };
  vendor_summary?: { total_vendors: number; active_vendors: number };
}

export interface SystemSettingsPayload {
  // 1. App & Platform Settings
  platform_name: string;
  app_name: string;
  support_email: string;
  support_phone: string;
  maintenance_mode: boolean;
  default_currency: string;
  timezone: string;

  // 2. Commissions & Fees (Platform Fee, Insurance, Marketplace, Carbon, Referral)
  commission_percent: number;
  platform_fee_percent: number;
  insurance_percent: number;
  marketplace_percent: number;
  carbon_percent: number;
  carbon_price: number;
  referral_commission_inr: number;

  // 3. Wallet Limits & Rules
  min_wallet_balance_inr: number;
  max_withdrawal_limit_inr: number;
  auto_payouts: boolean;
  auto_settlement_days: number;

  // 4. Tax Settings (GST & TDS)
  gst_percent: number;
  tds_percent: number;
  gstin_number: string;
  hsn_sac_code: string;

  // 5. OTP Settings
  otp_expiry_mins: number;
  otp_max_retries: number;

  // 6. Payment Gateways (Razorpay & Cashfree)
  razorpay_key: string;
  razorpay_secret: string;
  payout_webhook: string;
  cashfree_app_id: string;
  cashfree_secret_key: string;
  is_payment_test_mode: boolean;

  // 7. API Management Keys
  partner_api_keys_count: number;
  api_rate_limit_per_min: number;

  // 8. SMS Gateway
  sms_provider: string;
  sms_api_key: string;
  sms_sender_id: string;

  // 9. Email Gateway (SMTP)
  smtp_host: string;
  smtp_port: number;
  smtp_username: string;
  smtp_password?: string;
  sender_email: string;
  sender_name: string;

  // 10. Push Notifications (FCM)
  fcm_server_key: string;
  enable_push_notifications: boolean;

  // 11. Storage (Cloudinary & AWS S3)
  storage_provider: string;
  cloudinary_cloud_name: string;
  cloudinary_api_key: string;
  cloudinary_api_secret: string;
  aws_s3_bucket: string;
  aws_s3_region: string;

  // 12. Map APIs (Google Maps & Mapbox)
  google_maps_api_key: string;
  mapbox_access_token: string;

  // 13. AI Settings (Satellite AI Telemetry & LLM API Key)
  ai_model_api_key: string;
  satellite_ai_endpoint: string;

  // 14. Analytics
  google_analytics_id: string;
  posthog_project_api_key: string;

  // 15. Security Policies
  require_mfa: boolean;
  force_password_reset: boolean;
}

export interface APIKeyItem {
  key_id: string;
  partner_name: string;
  scopes: string[];
  rate_limit_per_min: number;
  is_active: boolean;
  created_at: string;
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

export const useGetSettings = () =>
  useQuery<SystemSettingsPayload>({
    queryKey: ['system-settings'],
    queryFn: async () => {
      const res = await apiClient.get('/admin/settings');
      return res.data?.settings || res.data;
    },
    retry: false,
  });

export const useSaveSettings = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Partial<SystemSettingsPayload>) => {
      const res = await apiClient.post('/admin/settings', payload);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['system-settings'] });
    },
  });
};

export const useApiKeys = () =>
  useQuery<{ api_keys: APIKeyItem[] }>({
    queryKey: ['system-api-keys'],
    queryFn: async () => {
      const res = await apiClient.get('/admin/settings/api-keys');
      return res.data;
    },
    retry: false,
  });

export const useCreateApiKey = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { partner_name: string; scopes: string[]; rate_limit_per_min: number }) => {
      const res = await apiClient.post('/admin/settings/api-keys', payload);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['system-api-keys'] });
    },
  });
};

export const useRevokeApiKey = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (keyId: string) => {
      const res = await apiClient.delete(`/admin/settings/api-keys/${keyId}`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['system-api-keys'] });
    },
  });
};

export const useTestIntegration = () =>
  useMutation({
    mutationFn: async (payload: { service: string; target?: string }) => {
      const res = await apiClient.post('/admin/settings/test-integration', payload);
      return res.data;
    },
  });

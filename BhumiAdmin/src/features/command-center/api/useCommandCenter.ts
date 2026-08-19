import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../../../api/axios';

// ── Dashboard response shape from GET /admin/dashboard ───────────────────────
export interface AdminDashboardStats {
  total_farmers?: number;
  total_govt_bodies?: number;
  total_partners?: number;
  total_vendors?: number;
  pending_approvals?: number;
  pending_kyc?: number;
  pending_land?: number;
  pending_projects?: number;
  pending_insurance?: number;
  pending_withdrawals?: number;
  total_revenue?: number;
  today_revenue?: number;

  total_carbon_credits?: number;
  total_marketplace_orders?: number;
  total_wallet_balance?: number;
  platform_wallet_balance?: number;
  active_projects?: number;
  // Fallback: any additional fields from the backend
  [key: string]: unknown;
}

const fetchDashboardStats = async (): Promise<AdminDashboardStats> => {
  const res = await apiClient.get<AdminDashboardStats>('/admin/dashboard');
  return res.data;
};

export const useCommandCenterStats = () => {
  return useQuery({
    queryKey: ['commandCenterStats'],
    queryFn: fetchDashboardStats,
    staleTime: 2 * 60 * 1000,   // refresh every 2 minutes
    refetchInterval: 5 * 60 * 1000, // auto-refresh every 5 minutes
  });
};

// ── Utility: format a raw number to Indian readable string ───────────────────
export const formatStat = (val: number | undefined | null, prefix = ''): string => {
  if (val == null) return '—';
  if (val >= 10_000_000) return `${prefix}${(val / 10_000_000).toFixed(2)}Cr`;
  if (val >= 100_000)    return `${prefix}${(val / 100_000).toFixed(1)}L`;
  if (val >= 1_000)      return `${prefix}${val.toLocaleString('en-IN')}`;
  return `${prefix}${val}`;
};

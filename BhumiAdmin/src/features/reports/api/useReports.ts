import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../../../api/axios';

export interface ProductSummary {
  total_products: number;
  pending_approval: number;
  approved_products: number;
  rejected_products: number;
  suspended_products: number;
  archived_products: number;
  hidden_products: number;
  visible_products: number;
}

export interface VendorSummary {
  total_vendors: number;
  active_vendors: number;
  inactive_vendors: number;
  vendors_with_products: number;
  vendors_without_products: number;
}

export interface CategorySummary {
  total_categories: number;
  active_categories: number;
  inactive_categories: number;
  products_per_category: number;
}

export interface MarketplaceSummary {
  products_added_today: number;
  products_added_this_week: number;
  products_added_this_month: number;
  newest_product_name: string | null;
  newest_product_id: string | null;
  latest_approved_product_name: string | null;
  latest_approved_product_id: string | null;
}

export interface InventorySummary {
  total_stock: number;
  low_stock_products: number;
  out_of_stock_products: number;
}

export interface AdminDashboardData {
  product_summary: ProductSummary;
  vendor_summary: VendorSummary;
  category_summary: CategorySummary;
  marketplace_summary: MarketplaceSummary;
  inventory_summary: InventorySummary;
}

export const useAdminDashboard = () =>
  useQuery<AdminDashboardData>({
    queryKey: ['admin-dashboard'],
    queryFn: async () => {
      const res = await apiClient.get('/admin/dashboard');
      return res.data;
    },
  });

export interface ReportsStats {
  farmer_report: { total_farmers: number; total_acres: number };
  govt_report: { total_mous: number; compliance_pct: number };
  partner_report: { total_partners: number };
  carbon_report: { total_projects: number; carbon_generated_tco2e: number; carbon_issued_tco2e: number };
  revenue_report: { revenue_lakhs: number };
  insurance_report: { total_trees_insured: number; coverage_lakhs: number };
  wallet_report: { total_escrow_balance: number; total_withdrawn: number };
  referral_report: { total_referrals: number; total_bonus_paid: number };
}

export const useReportsStats = () =>
  useQuery<ReportsStats>({
    queryKey: ['admin-reports-stats'],
    queryFn: async () => {
      const res = await apiClient.get('/admin/reports/stats');
      return res.data.data;
    },
    refetchInterval: 30000,
    staleTime: 15000,
  });

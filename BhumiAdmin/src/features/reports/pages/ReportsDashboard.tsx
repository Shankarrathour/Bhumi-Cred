import { motion } from 'framer-motion';
import { BarChart3, Download, TrendingUp, Users, Package, AlertCircle, Loader2, ShoppingBag, Tag } from 'lucide-react';
import { PageHeader } from '../../../components/ui/PageHeader';
import { KpiCard } from '../../../components/ui/KpiCard';
import { EmptyState } from '../../../components/ui/EmptyState';
import { Button } from '@mui/material';
import { useAdminDashboard } from '../api/useReports';

export const ReportsDashboard = () => {
  const { data, isLoading, isError, refetch } = useAdminDashboard();

  return (
    <div className="space-y-6 page-enter">
      <PageHeader
        title="Reports & Analytics"
        description="Exportable data insights covering products, vendors, inventory, and marketplace activity."
        icon={BarChart3}
        actions={<Button variant="outlined" startIcon={<Download size={16} />}>Export PDF Report</Button>}
      />

      {isLoading && (
        <div className="flex items-center justify-center gap-2 py-20 text-slate-400">
          <Loader2 size={20} className="animate-spin" />
          <span className="text-sm">Loading dashboard data…</span>
        </div>
      )}

      {isError && !isLoading && (
        <div className="flex flex-col items-center justify-center gap-3 py-20">
          <AlertCircle size={24} className="text-red-400" />
          <p className="text-sm text-slate-500">Failed to load dashboard data.</p>
          <button className="btn btn-secondary btn-sm" onClick={() => refetch()}>Retry</button>
        </div>
      )}

      {!isLoading && !isError && data && (
        <>
          {/* Product KPIs */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
            <p className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-3">Product Summary</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <KpiCard title="Total Products" value={data.product_summary.total_products} icon={ShoppingBag} iconBg="#EFF6FF" iconColor="#2563EB" />
              <KpiCard title="Pending Approval" value={data.product_summary.pending_approval} icon={AlertCircle} iconBg="#FFFBEB" iconColor="#F59E0B" />
              <KpiCard title="Approved" value={data.product_summary.approved_products} icon={TrendingUp} iconBg="#F0FDF4" iconColor="#16A34A" />
              <KpiCard title="Rejected" value={data.product_summary.rejected_products} icon={Package} iconBg="#FEF2F2" iconColor="#EF4444" />
            </div>
          </motion.div>

          {/* Vendor & Inventory KPIs */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <p className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-3">Vendor & Inventory</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <KpiCard title="Total Vendors" value={data.vendor_summary.total_vendors} icon={Users} iconBg="#EFF6FF" iconColor="#2563EB" />
              <KpiCard title="Active Vendors" value={data.vendor_summary.active_vendors} icon={TrendingUp} iconBg="#F0FDF4" iconColor="#16A34A" />
              <KpiCard title="Low Stock Products" value={data.inventory_summary.low_stock_products} icon={Package} iconBg="#FFFBEB" iconColor="#F59E0B" />
            </div>
          </motion.div>

          {/* Marketplace Activity */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
            <p className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-3">Marketplace Activity</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <KpiCard title="Added Today" value={data.marketplace_summary.products_added_today} icon={Tag} iconBg="#F5F3FF" iconColor="#8B5CF6" />
              <KpiCard title="Added This Week" value={data.marketplace_summary.products_added_this_week} icon={Tag} iconBg="#EEF2FF" iconColor="#6366F1" />
              <KpiCard title="Total Categories" value={data.category_summary.total_categories} icon={BarChart3} iconBg="#F0FDF4" iconColor="#16A34A" />
            </div>
          </motion.div>
        </>
      )}

      {!isLoading && !isError && !data && (
        <EmptyState icon={BarChart3} title="No dashboard data available" />
      )}

      {/* BI Integration Placeholder */}
      <div className="ent-card p-6 flex flex-col items-center justify-center text-center space-y-4 min-h-[200px]">
        <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center">
          <BarChart3 size={32} className="text-slate-400" />
        </div>
        <h3 className="text-lg font-semibold text-slate-800">Advanced Analytics Module</h3>
        <p className="text-slate-500 max-w-md">
          Detailed cross-module charting and scheduled report generation will be integrated with our upcoming Looker/Tableau BI instance.
        </p>
        <Button variant="contained" color="primary">Connect BI Tool</Button>
      </div>
    </div>
  );
};

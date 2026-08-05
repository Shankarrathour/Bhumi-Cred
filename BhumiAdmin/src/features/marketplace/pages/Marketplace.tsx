import React, { useState } from 'react';
import { ShoppingCart, Plus, RefreshCw, Eye, Check, X, Store, Tag, Package, TrendingUp } from 'lucide-react';
import { motion } from 'framer-motion';
import { PageHeader } from '../../../components/ui/PageHeader';
import { FilterBar } from '../../../components/ui/FilterBar';
import { KpiCard } from '../../../components/ui/KpiCard';
import { StatusBadge } from '../../../components/ui/StatusBadge';
import { EmptyState, SkeletonTable } from '../../../components/ui/EmptyState';
import { useMarketplaceProducts, useApproveProduct, useRejectProduct } from '../api/useMarketplace';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

const statusVariant = (s: string) => {
  if (s === 'APPROVED') return 'success';
  if (s === 'PENDING')  return 'warning';
  if (s === 'REJECTED') return 'danger';
  if (s === 'SUSPENDED') return 'gray';
  return 'gray';
};

const statusLabel = (s: string) =>
  s.charAt(0) + s.slice(1).toLowerCase();

export const Marketplace = () => {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [processingId, setProcessingId] = useState<string | null>(null);

  const { data, isLoading, refetch, isFetching } = useMarketplaceProducts(page, 20);
  const approve = useApproveProduct();
  const reject  = useRejectProduct();

  const products = data?.items ?? [];
  const total    = data?.total ?? 0;
  const pages    = data?.pages ?? 1;

  const filtered = products.filter(p => {
    const q = search.toLowerCase();
    const matchSearch = !q || [p.name, p.sku, p.brand, p.vendor_id].some(v => v?.toLowerCase().includes(q));
    const matchStatus = !statusFilter || p.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const approvedCount = products.filter(p => p.status === 'APPROVED').length;
  const pendingCount  = products.filter(p => p.status === 'PENDING').length;
  const avgPrice      = products.length ? Math.round(products.reduce((s, p) => s + p.price, 0) / products.length) : 0;

  const handleApprove = async (id: string) => {
    setProcessingId(id);
    try { await approve.mutateAsync(id); toast.success('Product approved'); }
    catch { toast.error('Approval failed'); }
    finally { setProcessingId(null); }
  };

  const handleReject = async (id: string) => {
    setProcessingId(id);
    try { await reject.mutateAsync(id); toast.success('Product rejected'); }
    catch { toast.error('Rejection failed'); }
    finally { setProcessingId(null); }
  };

  return (
    <div className="space-y-5 page-enter">
      <PageHeader
        title="Green Marketplace"
        description="Manage agri products, vendor listings, categories and marketplace approvals."
        badge={{ label: `${total} products`, variant: 'info' }}
        icon={ShoppingCart}
        actions={
          <>
            <button onClick={() => refetch()} className="btn btn-secondary btn-sm">
              <RefreshCw size={13} className={isFetching ? 'animate-spin' : ''} />
            </button>
            <button className="btn btn-primary btn-sm">
              <Plus size={13} /> Add Product
            </button>
          </>
        }
      />

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KpiCard title="Total Products" value={total}         icon={Package}      iconBg="#F5F3FF" iconColor="#8B5CF6" loading={isLoading} />
        <KpiCard title="Approved"       value={approvedCount} icon={Check}        iconBg="#F0FDF4" iconColor="#16A34A" loading={isLoading} />
        <KpiCard title="Pending Review" value={pendingCount}  icon={Store}        iconBg="#FFFBEB" iconColor="#F59E0B" loading={isLoading} />
        <KpiCard title="Avg. Price"     value={`₹${avgPrice.toLocaleString()}`} icon={TrendingUp} iconBg="#EFF6FF" iconColor="#2563EB" loading={isLoading} />
      </div>

      {/* Table card */}
      <div className="ent-card overflow-hidden">
        <div className="p-4 border-b border-[#F1F5F9]">
          <FilterBar
            search={search} onSearchChange={setSearch}
            searchPlaceholder="Search by name, SKU, brand..."
            filters={[{
              key: 'status', label: 'Status', value: statusFilter, onChange: setStatusFilter,
              options: [
                { label: 'Approved',  value: 'APPROVED'  },
                { label: 'Pending',   value: 'PENDING'   },
                { label: 'Rejected',  value: 'REJECTED'  },
                { label: 'Suspended', value: 'SUSPENDED' },
              ],
            }]}
            onExport={() => {}}
            onRefresh={() => refetch()}
            loading={isFetching}
            resultCount={filtered.length}
          />
        </div>

        <div className="overflow-x-auto">
          <table className="ent-table">
            <thead>
              <tr>
                <th>Product</th>
                <th>SKU</th>
                <th>Brand</th>
                <th>Price</th>
                <th>Stock</th>
                <th>Status</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={7} className="p-0"><SkeletonTable rows={6} cols={6} /></td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={7}>
                  <EmptyState icon={Package} title="No products found" description="No products match your filters." />
                </td></tr>
              ) : filtered.map((p, i) => (
                <motion.tr
                  key={p.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.03 }}
                >
                  <td>
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-[10px] bg-[#F8FAFC] border border-[#E2E8F0] flex items-center justify-center shrink-0">
                        <Package size={14} className="text-[#94A3B8]" />
                      </div>
                      <div>
                        <div className="text-[13px] font-500 text-[#0F172A]" style={{ fontWeight: 500 }}>{p.name}</div>
                        <div className="text-[11.5px] text-[#94A3B8]">{p.category_id || 'Uncategorized'}</div>
                      </div>
                    </div>
                  </td>
                  <td><span className="font-mono text-[12px] text-[#64748B]">{p.sku}</span></td>
                  <td className="text-[13px] text-[#64748B]">{p.brand || '—'}</td>
                  <td className="text-[13px] font-600 text-[#0F172A]" style={{ fontWeight: 600 }}>₹{p.price?.toLocaleString()}</td>
                  <td>
                    <span className={`text-[13px] font-500 ${p.stock_quantity === 0 ? 'text-[#EF4444]' : p.stock_quantity < 10 ? 'text-[#F59E0B]' : 'text-[#16A34A]'}`} style={{ fontWeight: 500 }}>
                      {p.stock_quantity.toLocaleString()}
                    </span>
                  </td>
                  <td>
                    <StatusBadge label={statusLabel(p.status)} variant={statusVariant(p.status) as any} size="sm" />
                  </td>
                  <td>
                    <div className="flex items-center justify-end gap-1">
                      {p.status === 'PENDING' && (
                        <>
                          <button onClick={() => handleApprove(p.id)} disabled={processingId === p.id}
                            className="btn btn-sm gap-1 text-[#16A34A] bg-[#F0FDF4] border-[#BBF7D0] hover:bg-[#DCFCE7]">
                            <Check size={12} /> Approve
                          </button>
                          <button onClick={() => handleReject(p.id)} disabled={processingId === p.id}
                            className="btn btn-sm gap-1 text-[#EF4444] bg-[#FEF2F2] border-[#FECACA] hover:bg-[#FEE2E2]">
                            <X size={12} /> Reject
                          </button>
                        </>
                      )}
                      <button onClick={() => navigate(`/marketplace/${p.id}`)} className="btn btn-ghost btn-icon btn-sm"><Eye size={14} /></button>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>

        {pages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-[#F1F5F9]">
            <span className="text-[12px] text-[#94A3B8]">Page {page} of {pages} · {total} products</span>
            <div className="flex gap-1">
              <button onClick={() => setPage(p => Math.max(1, p-1))} disabled={page===1} className="btn btn-secondary btn-sm">Previous</button>
              <button onClick={() => setPage(p => Math.min(pages, p+1))} disabled={page===pages} className="btn btn-secondary btn-sm">Next</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ShoppingCart, Plus, RefreshCw, Eye, Check, X, Store, Package,
  TrendingUp, Tag, Truck, RotateCcw, Star
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { PageHeader } from '../../../components/ui/PageHeader';
import { KpiCard } from '../../../components/ui/KpiCard';
import { StatusBadge } from '../../../components/ui/StatusBadge';
import { EmptyState, SkeletonTable } from '../../../components/ui/EmptyState';
import { useMarketplaceProducts } from '../api/useMarketplace';
import toast from 'react-hot-toast';

export interface MarketplaceProductItem {
  id: string;
  sku: string;
  name: string;
  category: 'Bio-Fertilizers' | 'High-Yield Seeds' | 'Solar Pumps' | 'Drip Irrigation' | 'Saplings & Nursery';
  brand: string;
  vendor_name: string;
  price: number;
  stock_quantity: number;
  rating_avg: number;
  reviews_count: number;
  status: 'APPROVED' | 'PENDING' | 'REJECTED' | 'SUSPENDED';
}

export interface MarketplaceOrderItem {
  id: string;
  order_id: string;
  customer_name: string;
  product_name: string;
  vendor_name: string;
  total_amount: number;
  delivery_status: 'Delivered' | 'In Transit' | 'Processing' | 'Cancelled';
  shipping_partner: string;
  order_date: string;
}

export interface CouponItem {
  id: string;
  code: string;
  discount_pct: number;
  min_order_amount: number;
  valid_until: string;
  total_uses: number;
  is_active: boolean;
}

const SEEDED_PRODUCTS: MarketplaceProductItem[] = [
  {
    id: 'PRD-1001',
    sku: 'SKU-BIO-401',
    name: 'Organic Bio-Fertilizer Soil Booster 50kg',
    category: 'Bio-Fertilizers',
    brand: 'EcoAgri Organic',
    vendor_name: 'GreenFields Agro Vendors',
    price: 1450,
    stock_quantity: 450,
    rating_avg: 4.8,
    reviews_count: 124,
    status: 'APPROVED',
  },
  {
    id: 'PRD-1002',
    sku: 'SKU-PUMP-201',
    name: '5HP Solar Water Pump System',
    category: 'Solar Pumps',
    brand: 'SunPower Agri',
    vendor_name: 'SolarTech Equipment Ltd',
    price: 85000,
    stock_quantity: 18,
    rating_avg: 4.9,
    reviews_count: 42,
    status: 'APPROVED',
  },
  {
    id: 'PRD-1003',
    sku: 'SKU-SEED-802',
    name: 'Hybrid Teak Saplings (Pack of 100)',
    category: 'Saplings & Nursery',
    brand: 'Bhumi Nursery',
    vendor_name: 'Central Agro Nursery',
    price: 3200,
    stock_quantity: 1200,
    rating_avg: 4.6,
    reviews_count: 88,
    status: 'APPROVED',
  },
  {
    id: 'PRD-1004',
    sku: 'SKU-IRR-305',
    name: 'Automatic Drip Irrigation Kit 1 Acre',
    category: 'Drip Irrigation',
    brand: 'Jain Irrigation Model',
    vendor_name: 'AgriCorp Equipment',
    price: 18500,
    stock_quantity: 4,
    rating_avg: 4.2,
    reviews_count: 15,
    status: 'PENDING',
  },
];

const SEEDED_ORDERS: MarketplaceOrderItem[] = [
  {
    id: 'ORD-9001',
    order_id: 'ORD-2026-9001',
    customer_name: 'Ramesh Patel (F-84920)',
    product_name: 'Organic Bio-Fertilizer Soil Booster 50kg',
    vendor_name: 'GreenFields Agro Vendors',
    total_amount: 2900,
    delivery_status: 'Delivered',
    shipping_partner: 'Delhivery Express',
    order_date: '03 Aug 2026',
  },
  {
    id: 'ORD-9002',
    order_id: 'ORD-2026-9002',
    customer_name: 'Suresh Verma (F-71029)',
    product_name: '5HP Solar Water Pump System',
    vendor_name: 'SolarTech Equipment Ltd',
    total_amount: 85000,
    delivery_status: 'In Transit',
    shipping_partner: 'Bluedart Logistics',
    order_date: '02 Aug 2026',
  },
];

const SEEDED_COUPONS: CouponItem[] = [
  { id: 'CPN-1', code: 'BHUMI10', discount_pct: 10, min_order_amount: 1000, valid_until: '31 Dec 2026', total_uses: 412, is_active: true },
  { id: 'CPN-2', code: 'AGRISOLAR', discount_pct: 15, min_order_amount: 50000, valid_until: '30 Nov 2026', total_uses: 89, is_active: true },
];

const PAGE_SIZE = 10;

export const Marketplace = () => {
  const navigate = useNavigate();
  const [activeMainTab, setActiveMainTab] = useState<'catalog' | 'orders' | 'returns' | 'coupons' | 'reviews'>('catalog');
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const [productsList, setProductsList] = useState<MarketplaceProductItem[]>(SEEDED_PRODUCTS);
  const [ordersList] = useState<MarketplaceOrderItem[]>(SEEDED_ORDERS);
  const [couponsList, setCouponsList] = useState<CouponItem[]>(SEEDED_COUPONS);

  // Modals
  const [isAddProductModalOpen, setIsAddProductModalOpen] = useState(false);
  const [newProduct, setNewProduct] = useState({
    name: '',
    sku: 'SKU-NEW-101',
    category: 'Bio-Fertilizers',
    brand: 'EcoAgri',
    vendor_name: 'GreenFields Agro',
    price: 1500,
    stock_quantity: 100,
  });

  const [isAddCouponModalOpen, setIsAddCouponModalOpen] = useState(false);
  const [newCoupon, setNewCoupon] = useState({
    code: 'FARM2026',
    discount_pct: 12,
    min_order_amount: 2000,
    valid_until: '31 Dec 2026',
  });

  const { data: apiData, isLoading, refetch, isFetching } = useMarketplaceProducts(page, 20);

  const products = useMemo(() => {
    if (apiData && Array.isArray((apiData as any).items) && (apiData as any).items.length > 0) {
      return (apiData as any).items.map((item: any) => ({
        id: item.id || `PRD-${Math.floor(1000 + Math.random() * 900)}`,
        sku: item.sku || 'SKU-100',
        name: item.name || 'Agri Product',
        category: item.category || 'Bio-Fertilizers',
        brand: item.brand || 'AgriBrand',
        vendor_name: item.vendor_name || 'Agri Vendor',
        price: item.price || 1200,
        stock_quantity: item.stock_quantity || 50,
        rating_avg: 4.5,
        reviews_count: 30,
        status: (item.status as any) || 'APPROVED',
      }));
    }
    return productsList;
  }, [apiData, productsList]);

  const filteredProducts = useMemo(() => {
    return products.filter((p: MarketplaceProductItem) => {
      const q = search.toLowerCase();
      const matchSearch = !q || [
        p.name, p.sku, p.brand, p.vendor_name
      ].some(v => v?.toLowerCase().includes(q));

      const matchCat = !categoryFilter || p.category === categoryFilter;
      const matchStatus = !statusFilter || p.status === statusFilter;
      return matchSearch && matchCat && matchStatus;
    });
  }, [products, search, categoryFilter, statusFilter]);

  const totalProducts = products.length;
  const approvedCount = products.filter((p: MarketplaceProductItem) => p.status === 'APPROVED').length;
  const pendingCount = products.filter((p: MarketplaceProductItem) => p.status === 'PENDING').length;
  const totalGmv = ordersList.reduce((acc, o) => acc + (o.total_amount || 0), 0);

  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pageRows = filteredProducts.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const handleApproveProduct = (id: string) => {
    setProductsList(prev => prev.map(p => p.id === id ? { ...p, status: 'APPROVED' } : p));
    toast.success(`Product ${id} approved & published to Green Marketplace!`);
  };

  const handleRejectProduct = (id: string) => {
    setProductsList(prev => prev.map(p => p.id === id ? { ...p, status: 'REJECTED' } : p));
    toast.error(`Product ${id} has been rejected.`);
  };

  const handleSuspendProduct = (id: string) => {
    setProductsList(prev => prev.map(p => p.id === id ? { ...p, status: 'SUSPENDED' } : p));
    toast.error(`Product ${id} has been suspended.`);
  };

  const handleReapproveProduct = (id: string) => {
    setProductsList(prev => prev.map(p => p.id === id ? { ...p, status: 'APPROVED' } : p));
    toast.success(`Product ${id} re-approved & live!`);
  };

  const handleAddProductSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProduct.name) {
      toast.error('Please fill in product name.');
      return;
    }

    const created: MarketplaceProductItem = {
      id: `PRD-${Math.floor(1000 + Math.random() * 900)}`,
      sku: newProduct.sku,
      name: newProduct.name,
      category: newProduct.category as any,
      brand: newProduct.brand,
      vendor_name: newProduct.vendor_name,
      price: Number(newProduct.price),
      stock_quantity: Number(newProduct.stock_quantity),
      rating_avg: 5.0,
      reviews_count: 1,
      status: 'APPROVED',
    };

    setProductsList(prev => [created, ...prev]);
    toast.success(`Product "${created.name}" created & published!`);
    setIsAddProductModalOpen(false);
  };

  const handleAddCouponSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const created: CouponItem = {
      id: `CPN-${Math.floor(10 + Math.random() * 90)}`,
      code: newCoupon.code.toUpperCase(),
      discount_pct: Number(newCoupon.discount_pct),
      min_order_amount: Number(newCoupon.min_order_amount),
      valid_until: newCoupon.valid_until,
      total_uses: 0,
      is_active: true,
    };

    setCouponsList(prev => [created, ...prev]);
    toast.success(`Coupon code ${created.code} created!`);
    setIsAddCouponModalOpen(false);
  };

  const getStatusVariant = (s: string) => {
    if (s === 'APPROVED' || s === 'Delivered') return 'success';
    if (s === 'PENDING' || s === 'In Transit' || s === 'Processing') return 'warning';
    if (s === 'REJECTED' || s === 'Cancelled') return 'danger';
    return 'gray';
  };

  return (
    <div className="space-y-6 page-enter pb-12" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>

      {/* ── Page Header ── */}
      <PageHeader
        title="Green Marketplace & Vendor Moderation"
        description="Module 11: Manage Agri Product Catalogs, Vendor Orders, Delivery Logistics, Returns, Coupons & Review Moderation."
        badge={{ label: `${totalProducts} Products Listed`, variant: 'info' }}
        icon={ShoppingCart}
        iconColor="#16A34A"
        actions={
          <div className="flex items-center gap-2">
            <button onClick={() => refetch()} className="btn btn-secondary btn-sm gap-1.5 cursor-pointer">
              <RefreshCw size={13} className={isFetching ? 'animate-spin' : ''} /> Sync Marketplace
            </button>
            <button onClick={() => setIsAddCouponModalOpen(true)} className="btn btn-secondary btn-sm gap-1.5 cursor-pointer">
              <Tag size={14} /> Create Coupon
            </button>
            <button onClick={() => setIsAddProductModalOpen(true)} className="btn btn-primary btn-sm gap-1.5 cursor-pointer">
              <Plus size={14} /> Add New Product
            </button>
          </div>
        }
      />

      {/* ── BRD MARKETPLACE KPI METRICS ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard title="TOTAL PRODUCTS" value={totalProducts} icon={Package} iconBg="#F5F3FF" iconColor="#8B5CF6" loading={isLoading} />
        <KpiCard title="APPROVED LISTINGS" value={approvedCount} icon={Check} iconBg="#F0FDF4" iconColor="#16A34A" loading={isLoading} />
        <KpiCard title="PENDING APPROVALS" value={pendingCount} icon={Store} iconBg="#FFFBEB" iconColor="#F59E0B" loading={isLoading} />
        <KpiCard title="MARKETPLACE GMV REVENUE" value={`₹${(totalGmv / 1000).toFixed(1)}K`} icon={TrendingUp} iconBg="#EFF6FF" iconColor="#2563EB" loading={isLoading} />
      </div>

      {/* ── MAIN MODULE TABS ── */}
      <div className="bg-white border border-[#E8EDF5] rounded-2xl p-1.5 shadow-xs flex items-center gap-1">
        {[
          { id: 'catalog', label: '1. Product Catalog & Approvals', icon: Package },
          { id: 'orders', label: '2. Orders & Delivery Logistics', icon: Truck },
          { id: 'returns', label: '3. Returns & Refunds', icon: RotateCcw },
          { id: 'coupons', label: '4. Coupons & Vouchers', icon: Tag },
          { id: 'reviews', label: '5. Rating & Review Moderation', icon: Star },
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeMainTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveMainTab(tab.id as any)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-[12.5px] font-bold transition-all cursor-pointer ${
                isActive
                  ? 'bg-[#F0FDF4] text-[#16A34A] border border-[#DCFCE7] shadow-xs'
                  : 'text-[#64748B] hover:bg-[#F8FAFC]'
              }`}
            >
              <Icon size={14} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* ── TAB 1: PRODUCT CATALOG & APPROVALS ── */}
      {activeMainTab === 'catalog' && (
        <div className="space-y-4">
          <div className="bg-white border border-[#E8EDF5] rounded-2xl p-4 shadow-xs space-y-3">
            <div className="flex flex-col lg:flex-row items-center gap-3">
              <div className="relative flex-1 w-full">
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search by Product Name, SKU, Brand, Vendor Name..."
                  className="w-full pl-10 pr-4 py-2 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-[13px] text-[#0F172A] outline-none focus:border-[#16A34A] focus:bg-white transition-all"
                />
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="px-3 py-2 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-[12px] font-medium text-[#0F172A] outline-none cursor-pointer focus:border-[#16A34A]"
                >
                  <option value="">All 5 Categories</option>
                  <option value="Bio-Fertilizers">Bio-Fertilizers</option>
                  <option value="High-Yield Seeds">High-Yield Seeds</option>
                  <option value="Solar Pumps">Solar Pumps</option>
                  <option value="Drip Irrigation">Drip Irrigation</option>
                  <option value="Saplings & Nursery">Saplings & Nursery</option>
                </select>

                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-3 py-2 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-[12px] font-medium text-[#0F172A] outline-none cursor-pointer focus:border-[#16A34A]"
                >
                  <option value="">All Statuses</option>
                  <option value="APPROVED">Approved & Live</option>
                  <option value="PENDING">Pending Approval</option>
                  <option value="REJECTED">Rejected</option>
                </select>
              </div>
            </div>
          </div>

          <div className="ent-card overflow-hidden">
            <div className="p-4 border-b border-[#F1F5F9] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Package size={16} className="text-[#16A34A]" />
                <h3 className="text-[14px] font-bold text-[#0F172A]">Green Agri Product Catalog</h3>
                <span className="text-[11px] font-bold text-[#16A34A] bg-[#F0FDF4] px-2 py-0.5 rounded-full border border-[#DCFCE7]">
                  {filteredProducts.length} Items
                </span>
              </div>
            </div>

            <div className="overflow-x-auto custom-scrollbar">
              <table className="ent-table min-w-[1150px]">
                <thead>
                  <tr>
                    <th>SKU ID</th>
                    <th>Product Name & Category</th>
                    <th>Vendor Name</th>
                    <th>Price (₹)</th>
                    <th>Stock Inventory</th>
                    <th>Rating</th>
                    <th>Status</th>
                    <th className="text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {isLoading ? (
                    <tr><td colSpan={8} className="p-0"><SkeletonTable rows={6} cols={8} /></td></tr>
                  ) : filteredProducts.length === 0 ? (
                    <tr><td colSpan={8}>
                      <EmptyState icon={Package} title="No products found" description="Try adjusting your filters or search." />
                    </td></tr>
                  ) : pageRows.map((p: MarketplaceProductItem, i: number) => (
                    <motion.tr
                      key={p.id}
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.03 }}
                    >
                      {/* SKU */}
                      <td>
                        <span className="font-mono text-[12px] text-[#2563EB] font-bold bg-[#EFF6FF] px-2.5 py-1 rounded-lg border border-[#DBEAFE]">
                          {p.sku}
                        </span>
                      </td>

                      {/* Name & Category */}
                      <td>
                        <div className="text-[13px] font-bold text-[#0F172A]">{p.name}</div>
                        <div className="text-[11px] text-[#64748B] font-medium">{p.category} • {p.brand}</div>
                      </td>

                      {/* Vendor */}
                      <td className="text-[12.5px] font-medium text-[#0F172A]">{p.vendor_name}</td>

                      {/* Price */}
                      <td className="text-[13.5px] font-extrabold text-[#16A34A]">₹{p.price.toLocaleString()}</td>

                      {/* Stock */}
                      <td>
                        <span className={`text-[12.5px] font-bold ${p.stock_quantity < 10 ? 'text-[#EF4444]' : 'text-[#0F172A]'}`}>
                          {p.stock_quantity.toLocaleString()} units
                        </span>
                      </td>

                      {/* Rating */}
                      <td>
                        <span className="text-[12px] font-bold text-[#D97706] flex items-center gap-1">
                          <Star size={13} fill="#D97706" /> {p.rating_avg} ({p.reviews_count})
                        </span>
                      </td>

                      {/* Status */}
                      <td>
                        <StatusBadge label={p.status} variant={getStatusVariant(p.status) as any} size="sm" />
                      </td>

                      {/* Actions */}
                      <td className="text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {p.status === 'PENDING' && (
                            <>
                              <button onClick={() => handleApproveProduct(p.id)} className="px-2 py-1 bg-[#F0FDF4] hover:bg-[#DCFCE7] text-[#16A34A] text-[11px] font-bold rounded-lg cursor-pointer flex items-center gap-1">
                                <Check size={12} /> Approve
                              </button>
                              <button onClick={() => handleRejectProduct(p.id)} className="px-2 py-1 bg-[#FEF2F2] hover:bg-[#FEE2E2] text-[#EF4444] text-[11px] font-bold rounded-lg cursor-pointer flex items-center gap-1">
                                <X size={12} /> Reject
                              </button>
                            </>
                          )}
                          {p.status === 'APPROVED' && (
                            <button onClick={() => handleSuspendProduct(p.id)} className="px-2 py-1 bg-[#FFFBEB] hover:bg-[#FEF3C7] text-[#D97706] text-[11px] font-bold rounded-lg cursor-pointer flex items-center gap-1">
                              Suspend
                            </button>
                          )}
                          {(p.status === 'REJECTED' || p.status === 'SUSPENDED') && (
                            <button onClick={() => handleReapproveProduct(p.id)} className="px-2 py-1 bg-[#F0FDF4] hover:bg-[#DCFCE7] text-[#16A34A] text-[11px] font-bold rounded-lg cursor-pointer flex items-center gap-1">
                              Re-approve
                            </button>
                          )}
                          <button onClick={() => navigate(`/marketplace/${p.id}`)} className="px-2.5 py-1 bg-[#F8FAFC] hover:bg-[#F1F5F9] text-[#0F172A] text-[11.5px] font-bold rounded-lg cursor-pointer flex items-center gap-1">
                            <Eye size={13} /> Details
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-[#F1F5F9]">
                <span className="text-[12px] text-[#94A3B8]">
                  Page {safePage} of {totalPages} · {filteredProducts.length} products
                </span>
                <div className="flex gap-1">
                  <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={safePage === 1} className="btn btn-secondary btn-sm">Previous</button>
                  <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={safePage === totalPages} className="btn btn-secondary btn-sm">Next</button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── TAB 2: ORDERS & DELIVERY LOGISTICS ── */}
      {activeMainTab === 'orders' && (
        <div className="ent-card overflow-hidden">
          <div className="p-4 border-b border-[#F1F5F9] flex items-center justify-between">
            <h3 className="text-[14px] font-bold text-[#0F172A]">Farmer Orders & Shipping Logistics</h3>
            <span className="text-[11px] font-bold text-[#2563EB] bg-[#EFF6FF] px-2 py-0.5 rounded-full border border-[#DBEAFE]">
              {ordersList.length} Orders
            </span>
          </div>

          <div className="overflow-x-auto custom-scrollbar">
            <table className="ent-table min-w-[1000px]">
              <thead>
                <tr>
                  <th>Order ID</th>
                  <th>Customer Farmer</th>
                  <th>Product Purchased</th>
                  <th>Vendor</th>
                  <th>Total Amount</th>
                  <th>Shipping Logistics</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {ordersList.map(o => (
                  <tr key={o.id}>
                    <td>
                      <span className="font-mono text-[12px] text-[#2563EB] font-bold bg-[#EFF6FF] px-2.5 py-1 rounded-lg border border-[#DBEAFE]">
                        {o.order_id}
                      </span>
                    </td>
                    <td className="text-[13px] font-bold text-[#0F172A]">{o.customer_name}</td>
                    <td className="text-[12.5px] font-medium text-[#0F172A]">{o.product_name}</td>
                    <td className="text-[12px] text-[#64748B]">{o.vendor_name}</td>
                    <td className="text-[13.5px] font-extrabold text-[#16A34A]">₹{o.total_amount.toLocaleString()}</td>
                    <td className="text-[12px] text-[#2563EB] font-medium">{o.shipping_partner}</td>
                    <td><StatusBadge label={o.delivery_status} variant={getStatusVariant(o.delivery_status) as any} size="sm" /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── TAB 3: RETURNS & REFUNDS ── */}
      {activeMainTab === 'returns' && (
        <div className="bg-white border border-[#E8EDF5] rounded-2xl p-6 shadow-xs space-y-4">
          <h3 className="text-[15px] font-bold text-[#0F172A] flex items-center gap-2">
            <RotateCcw size={18} className="text-[#EF4444]" /> Product Return & Refund Requests
          </h3>
          <div className="p-4 bg-[#FAFAFA] border border-[#E5E5E5] rounded-xl flex items-center justify-between">
            <div>
              <span className="text-[11px] font-bold text-[#64748B]">Active Return Requests</span>
              <p className="text-[18px] font-bold text-[#0F172A]">0 Pending Returns</p>
            </div>
            <StatusBadge label="All Settled" variant="success" size="sm" />
          </div>
        </div>
      )}

      {/* ── TAB 4: COUPONS & PROMO CREATOR ── */}
      {activeMainTab === 'coupons' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-[15px] font-bold text-[#0F172A]">Active Promotional Coupons & Discount Vouchers</h3>
            <button onClick={() => setIsAddCouponModalOpen(true)} className="btn btn-primary btn-sm flex items-center gap-1">
              <Plus size={14} /> Create New Coupon
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {couponsList.map(c => (
              <div key={c.id} className="p-5 bg-white border border-[#E8EDF5] rounded-2xl shadow-xs flex items-start justify-between">
                <div>
                  <span className="font-mono text-[14px] font-bold text-[#2563EB] bg-[#EFF6FF] px-3 py-1 rounded-xl border border-[#DBEAFE]">
                    {c.code}
                  </span>
                  <h4 className="text-[16px] font-extrabold text-[#16A34A] mt-2">{c.discount_pct}% OFF</h4>
                  <p className="text-[11.5px] text-[#64748B]">Min Order: ₹{c.min_order_amount.toLocaleString()} • Valid till {c.valid_until}</p>
                </div>
                <span className="text-[11px] font-bold text-[#16A34A] bg-[#F0FDF4] px-2 py-0.5 rounded-full border border-[#DCFCE7]">
                  {c.total_uses} Redeemed
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── TAB 5: RATING & REVIEW MODERATION ── */}
      {activeMainTab === 'reviews' && (
        <div className="bg-white border border-[#E8EDF5] rounded-2xl p-6 shadow-xs space-y-4">
          <h3 className="text-[15px] font-bold text-[#0F172A] flex items-center gap-2">
            <Star size={18} className="text-[#D97706]" /> Customer Rating & Review Moderation
          </h3>

          <div className="space-y-3">
            {[
              { id: 'REV-1', name: 'Ramesh Patel', product: 'Organic Bio-Fertilizer Soil Booster 50kg', rating: 5, comment: 'Excellent fertilizer! Saw 25% faster canopy growth in Teak saplings.', date: '02 Aug 2026' },
              { id: 'REV-2', name: 'Suresh Verma', product: '5HP Solar Water Pump System', rating: 5, comment: 'Very high pump pressure and reliable solar inverter.', date: '30 Jul 2026' },
            ].map(r => (
              <div key={r.id} className="p-4 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[13px] font-bold text-[#0F172A]">{r.name}</span>
                    <span className="text-[11px] font-bold text-[#D97706] flex items-center gap-0.5">
                      <Star size={12} fill="#D97706" /> {r.rating}.0
                    </span>
                  </div>
                  <p className="text-[12.5px] font-medium text-[#0F172A] mt-0.5">{r.product}</p>
                  <p className="text-[12px] text-[#64748B] italic mt-1">"{r.comment}"</p>
                </div>
                <StatusBadge label="Approved" variant="success" size="sm" />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── ADD PRODUCT MODAL ── */}
      <AnimatePresence>
        {isAddProductModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-[#E8EDF5] space-y-4"
            >
              <div className="flex items-center justify-between border-b border-[#F1F5F9] pb-3">
                <h3 className="text-[16px] font-bold text-[#0F172A]">Add New Product to Green Marketplace</h3>
                <button onClick={() => setIsAddProductModalOpen(false)} className="text-[#94A3B8] hover:text-[#0F172A]">
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleAddProductSubmit} className="space-y-3 text-[13px]">
                <div>
                  <label className="block text-[11.5px] font-bold text-[#0F172A] mb-1">Product Title</label>
                  <input
                    type="text"
                    required
                    value={newProduct.name}
                    onChange={e => setNewProduct({ ...newProduct, name: e.target.value })}
                    placeholder="e.g. Bio-Pest Control Liquid 5L"
                    className="w-full px-3 py-2 bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl font-medium outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11.5px] font-bold text-[#0F172A] mb-1">Category</label>
                    <select
                      value={newProduct.category}
                      onChange={e => setNewProduct({ ...newProduct, category: e.target.value as any })}
                      className="w-full px-3 py-2 bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl font-medium outline-none"
                    >
                      <option value="Bio-Fertilizers">Bio-Fertilizers</option>
                      <option value="High-Yield Seeds">High-Yield Seeds</option>
                      <option value="Solar Pumps">Solar Pumps</option>
                      <option value="Drip Irrigation">Drip Irrigation</option>
                      <option value="Saplings & Nursery">Saplings & Nursery</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11.5px] font-bold text-[#0F172A] mb-1">Price (₹)</label>
                    <input
                      type="number"
                      value={newProduct.price}
                      onChange={e => setNewProduct({ ...newProduct, price: Number(e.target.value) })}
                      className="w-full px-3 py-2 bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl font-medium outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11.5px] font-bold text-[#0F172A] mb-1">Stock Quantity</label>
                    <input
                      type="number"
                      value={newProduct.stock_quantity}
                      onChange={e => setNewProduct({ ...newProduct, stock_quantity: Number(e.target.value) })}
                      className="w-full px-3 py-2 bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl font-medium outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[11.5px] font-bold text-[#0F172A] mb-1">Vendor Name</label>
                    <input
                      type="text"
                      value={newProduct.vendor_name}
                      onChange={e => setNewProduct({ ...newProduct, vendor_name: e.target.value })}
                      className="w-full px-3 py-2 bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl font-medium outline-none"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#F1F5F9]">
                  <button type="button" onClick={() => setIsAddProductModalOpen(false)} className="btn btn-secondary btn-sm cursor-pointer">Cancel</button>
                  <button type="submit" className="btn btn-primary btn-sm cursor-pointer flex items-center gap-1">
                    <Plus size={14} /> Publish Product
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── CREATE COUPON MODAL ── */}
      <AnimatePresence>
        {isAddCouponModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-[#E8EDF5] space-y-4"
            >
              <div className="flex items-center justify-between border-b border-[#F1F5F9] pb-3">
                <h3 className="text-[16px] font-bold text-[#0F172A]">Create Promo Discount Coupon</h3>
                <button onClick={() => setIsAddCouponModalOpen(false)} className="text-[#94A3B8] hover:text-[#0F172A]">
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleAddCouponSubmit} className="space-y-3 text-[13px]">
                <div>
                  <label className="block text-[11.5px] font-bold text-[#0F172A] mb-1">Coupon Code</label>
                  <input
                    type="text"
                    required
                    value={newCoupon.code}
                    onChange={e => setNewCoupon({ ...newCoupon, code: e.target.value })}
                    placeholder="e.g. FARM2026"
                    className="w-full px-3 py-2 bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl font-medium outline-none uppercase"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11.5px] font-bold text-[#0F172A] mb-1">Discount %</label>
                    <input
                      type="number"
                      value={newCoupon.discount_pct}
                      onChange={e => setNewCoupon({ ...newCoupon, discount_pct: Number(e.target.value) })}
                      className="w-full px-3 py-2 bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl font-medium outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[11.5px] font-bold text-[#0F172A] mb-1">Min Order (₹)</label>
                    <input
                      type="number"
                      value={newCoupon.min_order_amount}
                      onChange={e => setNewCoupon({ ...newCoupon, min_order_amount: Number(e.target.value) })}
                      className="w-full px-3 py-2 bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl font-medium outline-none"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#F1F5F9]">
                  <button type="button" onClick={() => setIsAddCouponModalOpen(false)} className="btn btn-secondary btn-sm cursor-pointer">Cancel</button>
                  <button type="submit" className="btn btn-primary btn-sm cursor-pointer flex items-center gap-1">
                    <Tag size={14} /> Create Coupon
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};

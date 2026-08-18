import { useState, useMemo, useEffect, Component, ErrorInfo, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ShoppingCart, RefreshCw, Eye, Store, Package, TrendingUp, RotateCcw, Download, Layers
} from 'lucide-react';
import { PageHeader } from '../../../components/ui/PageHeader';
import { KpiCard } from '../../../components/ui/KpiCard';
import { StatusBadge } from '../../../components/ui/StatusBadge';
import { useMarketplaceProducts, useAdminOrders, useUpdateAdminOrderStatus } from '../api/useMarketplace';
import { downloadPDFDocument, downloadCSVDocument } from '../../../utils/pdfExporter';
import toast from 'react-hot-toast';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class ModalErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  public state: ErrorBoundaryState = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error in Modal:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="bg-red-50 border-l-4 border-red-500 p-6 rounded-2xl max-w-lg w-full shadow-2xl space-y-3">
          <div className="flex items-center gap-2">
            <span className="text-red-500 font-bold text-lg">⚠️</span>
            <h3 className="text-sm font-bold text-red-800">
              Modal Render Crash Catch
            </h3>
          </div>
          <div className="text-xs text-red-700 space-y-1">
            <p className="font-bold">{this.state.error?.toString()}</p>
            <p className="font-mono text-[10px] bg-red-100/60 p-2 rounded overflow-auto max-h-40 leading-relaxed">
              {this.state.error?.stack}
            </p>
          </div>
          <button
            onClick={() => window.location.reload()}
            className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer"
          >
            Reload Page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}


// 8 Specified Marketplace Categories
export const MARKETPLACE_CATEGORIES = [
  'Seeds',
  'Plants',
  'Fertilizer',
  'Organic',
  'Machinery',
  'Tools',
  'Drone',
  'Equipment'
] as const;

// 6 Specified Order Statuses
export const ORDER_STATUSES = [
  'Pending',
  'Packed',
  'Shipped',
  'Delivered',
  'Cancelled',
  'Returned'
] as const;

export interface MarketplaceProductItem {
  id: string;
  sku: string;
  name: string;
  category: (typeof MARKETPLACE_CATEGORIES)[number];
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
  buyer_name: string;
  buyer_id: string;
  vendor_name: string;
  vendor_gstin: string;
  product_name: string;
  category: string;
  total_amount: number;
  payment_mode: string;
  payment_status: 'PAID' | 'PENDING' | 'REFUNDED';
  order_status: (typeof ORDER_STATUSES)[number];
  tracking_id: string;
  shipping_partner: string;
  order_date: string;
}

export interface VendorProfileItem {
  id: string;
  vendor_id: string;
  company: string;
  gstin: string;
  pan: string;
  contact_person: string;
  phone: string;
  email: string;
  rating: number;
  total_products: number;
  total_orders: number;
  total_payouts: string;
}

const SEEDED_PRODUCTS: MarketplaceProductItem[] = [
  {
    id: 'PRD-1001',
    sku: 'SKU-SEED-401',
    name: 'High-Yield Hybrid Teak Seeds (Pack of 500g)',
    category: 'Seeds',
    brand: 'BhumiAgri Seeds',
    vendor_name: 'Central Seeds Corp',
    price: 1450,
    stock_quantity: 450,
    rating_avg: 4.8,
    reviews_count: 124,
    status: 'APPROVED',
  },
  {
    id: 'PRD-1002',
    sku: 'SKU-PLANT-201',
    name: 'Tissue Culture Bamboo Saplings (Pack of 50)',
    category: 'Plants',
    brand: 'GreenForest Nursery',
    vendor_name: 'Vriksha Nursery Pvt Ltd',
    price: 3200,
    stock_quantity: 1200,
    rating_avg: 4.9,
    reviews_count: 88,
    status: 'APPROVED',
  },
  {
    id: 'PRD-1003',
    sku: 'SKU-FERT-802',
    name: 'NPK Bio-Fertilizer Soil Nutrient 50kg',
    category: 'Fertilizer',
    brand: 'EcoFert Organics',
    vendor_name: 'GreenFields Agro Vendors',
    price: 1850,
    stock_quantity: 650,
    rating_avg: 4.7,
    reviews_count: 210,
    status: 'APPROVED',
  },
  {
    id: 'PRD-1004',
    sku: 'SKU-ORG-305',
    name: 'Vermi-Compost Organic Manure 25kg',
    category: 'Organic',
    brand: 'VermiPure India',
    vendor_name: 'Organic Roots Corp',
    price: 950,
    stock_quantity: 800,
    rating_avg: 4.6,
    reviews_count: 76,
    status: 'APPROVED',
  },
  {
    id: 'PRD-1005',
    sku: 'SKU-MACH-901',
    name: '5HP Solar Irrigation Pump Machine',
    category: 'Machinery',
    brand: 'SunPower Agri',
    vendor_name: 'SolarTech Equipment Ltd',
    price: 85000,
    stock_quantity: 18,
    rating_avg: 4.9,
    reviews_count: 42,
    status: 'APPROVED',
  },
  {
    id: 'PRD-1006',
    sku: 'SKU-TOOL-110',
    name: 'Ergonomic Plantation & Pruning Tools Kit',
    category: 'Tools',
    brand: 'AgriTool Pro',
    vendor_name: 'Kisan Care Hardware',
    price: 2400,
    stock_quantity: 320,
    rating_avg: 4.5,
    reviews_count: 95,
    status: 'APPROVED',
  },
  {
    id: 'PRD-1007',
    sku: 'SKU-DRONE-880',
    name: 'Agri Drone Sprayer & Mapping Telemetry 10L',
    category: 'Drone',
    brand: 'Sentinel Drone Labs',
    vendor_name: 'SkyAgri Robotics',
    price: 345000,
    stock_quantity: 6,
    rating_avg: 5.0,
    reviews_count: 18,
    status: 'APPROVED',
  },
  {
    id: 'PRD-1008',
    sku: 'SKU-EQP-550',
    name: 'Automatic Drip Irrigation Filter & Valves',
    category: 'Equipment',
    brand: 'Jain Irrigation Model',
    vendor_name: 'AgriCorp Equipment',
    price: 18500,
    stock_quantity: 42,
    rating_avg: 4.4,
    reviews_count: 31,
    status: 'PENDING',
  },
];

const SEEDED_ORDERS: MarketplaceOrderItem[] = [
  {
    id: 'ORD-9001',
    order_id: 'ORD-2026-9001',
    buyer_name: 'Ramesh Patel',
    buyer_id: 'FARM-MP-8091',
    vendor_name: 'GreenFields Agro Vendors',
    vendor_gstin: '23AAACG8890D1Z2',
    product_name: 'NPK Bio-Fertilizer Soil Nutrient 50kg',
    category: 'Fertilizer',
    total_amount: 3700,
    payment_mode: 'UPI / Online Wallet',
    payment_status: 'PAID',
    order_status: 'Delivered',
    tracking_id: 'TRACK-DELHIVERY-9901',
    shipping_partner: 'Delhivery Express',
    order_date: '03 Aug 2026',
  },
  {
    id: 'ORD-9002',
    order_id: 'ORD-2026-9002',
    buyer_name: 'Suresh Verma',
    buyer_id: 'FARM-MP-8092',
    vendor_name: 'SolarTech Equipment Ltd',
    vendor_gstin: '27AABCS4412B1ZX',
    product_name: '5HP Solar Irrigation Pump Machine',
    category: 'Machinery',
    total_amount: 85000,
    payment_mode: 'Direct Bank Transfer',
    payment_status: 'PAID',
    order_status: 'Shipped',
    tracking_id: 'TRACK-BLUEDART-8821',
    shipping_partner: 'Bluedart Logistics',
    order_date: '02 Aug 2026',
  },
  {
    id: 'ORD-9003',
    order_id: 'ORD-2026-9003',
    buyer_name: 'Sita Devi',
    buyer_id: 'FARM-MP-8093',
    vendor_name: 'SkyAgri Robotics',
    vendor_gstin: '07AAACS9012A1Z5',
    product_name: 'Agri Drone Sprayer & Mapping Telemetry 10L',
    category: 'Drone',
    total_amount: 345000,
    payment_mode: 'Escrow Financing',
    payment_status: 'PAID',
    order_status: 'Packed',
    tracking_id: 'TRACK-ECOM-7712',
    shipping_partner: 'Ecom Express',
    order_date: '01 Aug 2026',
  },
  {
    id: 'ORD-9004',
    order_id: 'ORD-2026-9004',
    buyer_name: 'Vijay Deshmukh',
    buyer_id: 'FARM-MH-4011',
    vendor_name: 'Central Seeds Corp',
    vendor_gstin: '24AAACC1102C1Z8',
    product_name: 'High-Yield Hybrid Teak Seeds (Pack of 500g)',
    category: 'Seeds',
    total_amount: 2900,
    payment_mode: 'UPI',
    payment_status: 'PENDING',
    order_status: 'Pending',
    tracking_id: 'TRACK-PENDING-001',
    shipping_partner: 'India Post Speed',
    order_date: '05 Aug 2026',
  },
  {
    id: 'ORD-9005',
    order_id: 'ORD-2026-9005',
    buyer_name: 'Mohan Singh',
    buyer_id: 'FARM-GJ-3090',
    vendor_name: 'Organic Roots Corp',
    vendor_gstin: '23AAACO4412E1Z9',
    product_name: 'Vermi-Compost Organic Manure 25kg',
    category: 'Organic',
    total_amount: 1900,
    payment_mode: 'Wallet Pay',
    payment_status: 'REFUNDED',
    order_status: 'Returned',
    tracking_id: 'TRACK-RETURN-102',
    shipping_partner: 'Delhivery Return',
    order_date: '28 Jul 2026',
  },
  {
    id: 'ORD-9006',
    order_id: 'ORD-2026-9006',
    buyer_name: 'Ankita Sahu',
    buyer_id: 'FARM-CG-1022',
    vendor_name: 'Kisan Care Hardware',
    vendor_gstin: '23AAACK5512F1Z1',
    product_name: 'Ergonomic Plantation & Pruning Tools Kit',
    category: 'Tools',
    total_amount: 2400,
    payment_mode: 'UPI',
    payment_status: 'REFUNDED',
    order_status: 'Cancelled',
    tracking_id: 'TRACK-CANCELLED-009',
    shipping_partner: 'N/A',
    order_date: '25 Jul 2026',
  },
];

export const SEEDED_VENDORS: VendorProfileItem[] = [
  {
    id: 'VND-101',
    vendor_id: 'VND-101',
    company: 'GreenFields Agro Vendors',
    gstin: '23AAACG8890D1Z2',
    pan: 'AAACG8890D',
    contact_person: 'Anil Kulkarni',
    phone: '+91 98260 11902',
    email: 'anil@greenfields.in',
    rating: 4.8,
    total_products: 24,
    total_orders: 412,
    total_payouts: '₹14.8 Lakhs',
  },
  {
    id: 'VND-102',
    vendor_id: 'VND-102',
    company: 'SolarTech Equipment Ltd',
    gstin: '27AABCS4412B1ZX',
    pan: 'AABCS4412B',
    contact_person: 'Priya Sundaram',
    phone: '+91 98221 44019',
    email: 'priya@solartech.com',
    rating: 4.9,
    total_products: 8,
    total_orders: 89,
    total_payouts: '₹75.2 Lakhs',
  },
];

export const Marketplace = () => {
  const navigate = useNavigate();

  // Tabs: Products, Categories, Orders, Vendors
  const [activeMainTab, setActiveMainTab] = useState<'products' | 'categories' | 'orders' | 'vendors'>('products');
  const [orderStatusFilter, setOrderStatusFilter] = useState<string>('');
  const [categoryFilter, setCategoryFilter] = useState<string>('');
  const [search, setSearch] = useState<string>('');

  const [productsList] = useState<MarketplaceProductItem[]>(SEEDED_PRODUCTS);
  const [ordersList, setOrdersList] = useState<MarketplaceOrderItem[]>(SEEDED_ORDERS);
  // Selected Order for Order Details Modal
  const [selectedOrder, setSelectedOrder] = useState<MarketplaceOrderItem | null>(null);

  const { refetch } = useMarketplaceProducts();
  const { data: adminOrdersData } = useAdminOrders();
  const { mutate: updateOrderStatus } = useUpdateAdminOrderStatus();

  useEffect(() => {
    if (adminOrdersData?.data) {
      const realOrders = adminOrdersData.data;
      const mockOrders = SEEDED_ORDERS.filter(so => !realOrders.some((ro: any) => ro.order_id === so.order_id));
      setOrdersList([...realOrders, ...mockOrders]);
    }
  }, [adminOrdersData]);

  const filteredProducts = useMemo(() => {
    return productsList.filter(p => {
      const q = search.toLowerCase();
      const matchSearch = !q || [p.name, p.sku, p.brand, p.vendor_name].some(v => v?.toLowerCase().includes(q));
      const matchCategory = !categoryFilter || p.category.toLowerCase() === categoryFilter.toLowerCase();
      return matchSearch && matchCategory;
    });
  }, [productsList, search, categoryFilter]);

  const filteredOrders = useMemo(() => {
    return ordersList.filter(o => {
      const q = search.toLowerCase();
      const matchSearch = !q || [o.order_id, o.buyer_name, o.buyer_id, o.vendor_name, o.product_name, o.tracking_id].some(v => v?.toLowerCase().includes(q));
      const matchStatus = !orderStatusFilter || o.order_status.toLowerCase() === orderStatusFilter.toLowerCase();
      return matchSearch && matchStatus;
    });
  }, [ordersList, search, orderStatusFilter]);

  const handleUpdateOrderStatus = (orderId: string, newStatus: (typeof ORDER_STATUSES)[number]) => {
    const orderObj = ordersList.find(o => o.id === orderId);
    const isRealOrder = orderId.length === 24;

    if (isRealOrder) {
      updateOrderStatus({ orderId, status: newStatus }, {
        onSuccess: () => {
          toast.success(`Order status updated to "${newStatus}" successfully!`);
        },
        onError: () => {
          toast.error("Failed to update order status on server.");
        }
      });
    } else {
      toast.success(`Order ${orderObj?.order_id || orderId} status updated to "${newStatus}"!`);
    }

    setOrdersList(prev => prev.map(o => {
      if (o.id === orderId) {
        return { ...o, order_status: newStatus };
      }
      return o;
    }));
    if (selectedOrder && selectedOrder.id === orderId) {
      setSelectedOrder(prev => prev ? { ...prev, order_status: newStatus } : null);
    }
  };

  const handleProcessRefund = (orderId: string) => {
    setOrdersList(prev => prev.map(o => {
      if (o.id === orderId) {
        toast.success(`Refund of ₹${(o.total_amount ?? 0).toLocaleString()} processed for Order ${o.order_id}!`);
        return { ...o, payment_status: 'REFUNDED', order_status: 'Returned' };
      }
      return o;
    }));
  };

  return (
    <div className="space-y-6 page-enter pb-12" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>

      {/* ── Page Header ── */}
      <PageHeader
        title="Agri Marketplace & Supply Operations"
        description="Catalog management, vendor onboarding profiles, order fulfillment pipeline, shipping tracking, and tax invoice generation."
        badge={{ label: `${productsList.length} Active SKUs`, variant: 'success' }}
        icon={ShoppingCart}
        iconColor="#16A34A"
        actions={
          <div className="flex items-center gap-2">
            <button onClick={() => refetch()} className="btn btn-secondary btn-sm gap-1.5 cursor-pointer">
              <RefreshCw size={13} /> Sync Catalog
            </button>
            <button
              onClick={() => {
                downloadCSVDocument(
                  'Marketplace_Orders_Report.csv',
                  ['Order ID', 'Buyer Name', 'Vendor', 'Product', 'Amount', 'Payment', 'Order Status', 'Tracking ID'],
                  ordersList.map(o => [o.order_id, o.buyer_name, o.vendor_name, o.product_name, o.total_amount ?? 0, o.payment_status, o.order_status, o.tracking_id])
                );
                toast.success('Exported Marketplace Orders CSV!');
              }}
              className="btn btn-primary btn-sm gap-1.5 cursor-pointer"
            >
              <Download size={14} /> Export Orders CSV
            </button>
          </div>
        }
      />

      {/* ── KPI METRICS ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KpiCard title="TOTAL SKUS IN CATALOG" value={productsList.length} icon={Package} iconBg="#F0FDF4" iconColor="#16A34A" />
        <KpiCard title="TOTAL ORDERS PROCESSED" value={ordersList.length} icon={ShoppingCart} iconBg="#EFF6FF" iconColor="#2563EB" />
        <KpiCard title="ACTIVE PARTNERS" value={892} icon={Store} iconBg="#F5F3FF" iconColor="#8B5CF6" />
        <KpiCard title="GROSS MARKETPLACE SALES" value="₹5,20,800" icon={TrendingUp} iconBg="#ECFDF5" iconColor="#059669" />
      </div>

      {/* ── MAIN TABS (Products, Categories, Orders) ── */}
      <div className="flex items-center justify-between border-b border-[#E8EDF5] pb-2 flex-wrap gap-2">
        <div className="flex items-center gap-2">
          {[
            { id: 'products', label: `Products (${productsList.length})`, icon: Package },
            { id: 'categories', label: `8 Categories`, icon: Layers },
            { id: 'orders', label: `Orders (${ordersList.length})`, icon: ShoppingCart },
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = activeMainTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveMainTab(tab.id as any)}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-[13px] font-bold transition-all cursor-pointer ${
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

        <div className="relative">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search catalog, orders, SKU, vendor..."
            className="px-3.5 py-1.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-[12.5px] outline-none focus:border-[#16A34A]"
          />
        </div>
      </div>

      {/* ── 1. PRODUCTS TAB ── */}
      {activeMainTab === 'products' && (
        <div className="bg-white border border-[#E8EDF5] rounded-2xl overflow-hidden shadow-xs">
          <div className="p-4 border-b border-[#F1F5F9] flex items-center justify-between">
            <h3 className="text-[14px] font-bold text-[#0F172A]">Products Directory</h3>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-3 py-1.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-[12px] font-semibold cursor-pointer"
            >
              <option value="">All 8 Categories</option>
              {MARKETPLACE_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left border-collapse min-w-[1100px]">
              <thead>
                <tr className="bg-[#F8FAFC] border-b border-[#E2E8F0] text-[11px] font-bold uppercase tracking-wider text-[#475569]">
                  <th className="py-3 px-4">Product Name & SKU</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Vendor</th>
                  <th className="py-3 px-4">Price</th>
                  <th className="py-3 px-4">Stock</th>
                  <th className="py-3 px-4">Rating</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F1F5F9]">
                {filteredProducts.map((p) => (
                  <tr key={p.id} className="hover:bg-[#F8FAFC] transition-colors">
                    <td className="py-3 px-4">
                      <div
                        onClick={() => navigate(`/marketplace/${p.id}`)}
                        className="text-[13px] font-bold text-[#0F172A] hover:text-[#16A34A] cursor-pointer"
                      >
                        {p.name}
                      </div>
                      <div className="text-[11px] font-mono text-[#64748B]">{p.sku} • {p.brand}</div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-[11.5px] font-bold text-[#2563EB] bg-[#EFF6FF] px-2 py-0.5 rounded-md border border-[#DBEAFE]">
                        {p.category}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-[12.5px] font-medium text-[#475569]">{p.vendor_name}</td>
                    <td className="py-3 px-4 text-[13px] font-bold text-[#16A34A]">₹{p.price.toLocaleString()}</td>
                    <td className="py-3 px-4 text-[13px] font-bold text-[#0F172A]">{p.stock_quantity} Units</td>
                    <td className="py-3 px-4 text-[12px] font-bold text-[#D97706]">★ {p.rating_avg} ({p.reviews_count})</td>
                    <td className="py-3 px-4"><StatusBadge label={p.status} variant="success" size="sm" /></td>
                    <td className="py-3 px-4 text-right">
                      <button onClick={() => navigate(`/marketplace/${p.id}`)} className="btn btn-secondary btn-sm gap-1 ml-auto cursor-pointer">
                        <Eye size={13} /> View Product
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── 2. CATEGORIES TAB (All 8 Specified Categories) ── */}
      {activeMainTab === 'categories' && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {MARKETPLACE_CATEGORIES.map((cat, idx) => {
            const count = productsList.filter(p => p.category === cat).length;
            return (
              <div key={idx} className="p-5 bg-white border border-[#E8EDF5] rounded-2xl shadow-xs space-y-2">
                <div className="w-10 h-10 rounded-xl bg-[#F0FDF4] border border-[#DCFCE7] flex items-center justify-center text-[#16A34A] font-bold">
                  <Layers size={20} />
                </div>
                <h3 className="text-[15px] font-bold text-[#0F172A]">{cat}</h3>
                <p className="text-[12px] text-[#64748B]">{count} Active Products</p>
                <button onClick={() => { setCategoryFilter(cat); setActiveMainTab('products'); }} className="text-[12px] font-bold text-[#16A34A] hover:underline cursor-pointer">
                  Browse {cat} Catalog →
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* ── 3. ORDERS TAB (All 6 Specified Order Status Filters: Pending, Packed, Shipped, Delivered, Cancelled, Returned) ── */}
      {activeMainTab === 'orders' && (
        <div className="bg-white border border-[#E8EDF5] rounded-2xl overflow-hidden shadow-xs space-y-4">
          {/* Order Status Filters (All 6 Specified: Pending, Packed, Shipped, Delivered, Cancelled, Returned) */}
          <div className="p-4 border-b border-[#F1F5F9] flex items-center justify-between flex-wrap gap-2">
            <h3 className="text-[14px] font-bold text-[#0F172A]">Fulfillment Pipeline</h3>
            <div className="flex items-center gap-1.5 flex-wrap">
              <button
                onClick={() => setOrderStatusFilter('')}
                className={`px-3 py-1 rounded-lg text-[12px] font-bold cursor-pointer ${!orderStatusFilter ? 'bg-[#16A34A] text-white' : 'bg-[#F8FAFC] text-[#64748B]'}`}
              >
                All Orders
              </button>
              {ORDER_STATUSES.map((status) => (
                <button
                  key={status}
                  onClick={() => setOrderStatusFilter(status)}
                  className={`px-3 py-1 rounded-lg text-[12px] font-bold cursor-pointer ${orderStatusFilter === status ? 'bg-[#16A34A] text-white' : 'bg-[#F8FAFC] text-[#64748B]'}`}
                >
                  {status} ({ordersList.filter(o => o.order_status === status).length})
                </button>
              ))}
            </div>
          </div>

          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left border-collapse min-w-[1100px]">
              <thead>
                <tr className="bg-[#F8FAFC] border-b border-[#E2E8F0] text-[11px] font-bold uppercase tracking-wider text-[#475569]">
                  <th className="py-3 px-4">Order ID</th>
                  <th className="py-3 px-4">Buyer</th>
                  <th className="py-3 px-4">Product</th>
                  <th className="py-3 px-4">Vendor</th>
                  <th className="py-3 px-4">Amount</th>
                  <th className="py-3 px-4">Payment</th>
                  <th className="py-3 px-4">Order Status</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F1F5F9]">
                {filteredOrders.map((o) => (
                  <tr key={o.id} className="hover:bg-[#F8FAFC] transition-colors">
                    <td className="py-3 px-4 font-mono text-[12.5px] font-bold text-[#2563EB]">{o.order_id}</td>
                    <td className="py-3 px-4">
                      <div className="text-[13px] font-bold text-[#0F172A]">{o.buyer_name}</div>
                      <div className="text-[10.5px] font-mono text-[#64748B]">{o.buyer_id}</div>
                    </td>
                    <td className="py-3 px-4 text-[12.5px] font-semibold text-[#0F172A]">{o.product_name}</td>
                    <td className="py-3 px-4 text-[12px] text-[#475569]">{o.vendor_name}</td>
                    <td className="py-3 px-4 text-[13px] font-extrabold text-[#16A34A]">₹{(o.total_amount ?? 0).toLocaleString()}</td>
                    <td className="py-3 px-4">
                      <span className={`text-[11px] font-bold px-2 py-0.5 rounded-md ${o.payment_status === 'PAID' ? 'bg-[#F0FDF4] text-[#16A34A]' : 'bg-[#FEF2F2] text-[#EF4444]'}`}>
                        {o.payment_status}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <StatusBadge
                        label={o.order_status}
                        variant={o.order_status === 'Delivered' ? 'success' : o.order_status === 'Shipped' || o.order_status === 'Packed' ? 'info' : o.order_status === 'Pending' ? 'warning' : 'danger'}
                        size="sm"
                      />
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button onClick={() => setSelectedOrder(o)} className="btn btn-secondary btn-sm gap-1 ml-auto cursor-pointer">
                        <Eye size={13} /> Order Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}


      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <ModalErrorBoundary>
            <div
              className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-[#E8EDF5] space-y-5 my-auto max-h-[90vh] overflow-y-auto custom-scrollbar"
            >
              <div className="flex items-center justify-between border-b border-[#F1F5F9] pb-3">
                <div className="flex items-center gap-2">
                  <ShoppingCart size={20} className="text-[#16A34A]" />
                  <h3 className="text-[16px] font-bold text-[#0F172A]">Order Fulfillment Details — {selectedOrder.order_id}</h3>
                </div>
                <button onClick={() => setSelectedOrder(null)} className="text-[#94A3B8] hover:text-[#0F172A] text-lg font-bold cursor-pointer">×</button>
              </div>

              {/* 6 Order Details Attributes & Sub-sections */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-[12.5px]">
                {/* 1. Buyer */}
                <div className="p-3.5 bg-[#FAFCFF] border border-[#F1F5F9] rounded-xl space-y-1">
                  <span className="text-[10.5px] font-bold uppercase text-[#94A3B8]">1. Buyer Details</span>
                  <p className="font-bold text-[#0F172A]">{selectedOrder.buyer_name}</p>
                  <p className="font-mono text-[11px] text-[#2563EB]">{selectedOrder.buyer_id}</p>
                </div>

                {/* 2. Vendor */}
                <div className="p-3.5 bg-[#FAFCFF] border border-[#F1F5F9] rounded-xl space-y-1">
                  <span className="text-[10.5px] font-bold uppercase text-[#94A3B8]">2. Vendor Company</span>
                  <p className="font-bold text-[#0F172A]">{selectedOrder.vendor_name}</p>
                  <p className="font-mono text-[11px] text-[#64748B]">GSTIN: {selectedOrder.vendor_gstin}</p>
                </div>

                {/* 3. Tracking */}
                <div className="p-3.5 bg-[#EFF6FF] border border-[#DBEAFE] rounded-xl space-y-1">
                  <span className="text-[10.5px] font-bold uppercase text-[#2563EB]">3. Tracking & Courier</span>
                  <p className="font-bold text-[#2563EB]">{selectedOrder.tracking_id}</p>
                  <p className="text-[11px] text-[#475569]">{selectedOrder.shipping_partner} • Status: {selectedOrder.order_status}</p>
                </div>

                {/* 4. Payment */}
                <div className="p-3.5 bg-[#F0FDF4] border border-[#DCFCE7] rounded-xl space-y-1">
                  <span className="text-[10.5px] font-bold uppercase text-[#16A34A]">4. Payment & Amount</span>
                  <p className="text-[16px] font-extrabold text-[#16A34A]">₹{(selectedOrder.total_amount ?? 0).toLocaleString()}</p>
                  <p className="text-[11px] text-[#475569]">Mode: {selectedOrder.payment_mode} ({selectedOrder.payment_status})</p>
                </div>
              </div>

              {/* Status Updater */}
              <div className="p-3.5 border border-[#E8EDF5] rounded-xl space-y-2 bg-[#F8FAFC]">
                <span className="text-[11px] font-bold text-[#0F172A] uppercase">Update Order Status</span>
                <div className="flex items-center gap-1.5 flex-wrap">
                  {ORDER_STATUSES.map(s => (
                    <button
                      key={s}
                      onClick={() => handleUpdateOrderStatus(selectedOrder.id, s)}
                      className={`px-2.5 py-1 rounded-lg text-[11.5px] font-bold cursor-pointer ${selectedOrder.order_status === s ? 'bg-[#16A34A] text-white' : 'bg-white border border-[#E2E8F0] text-[#475569]'}`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              {/* 5. Invoice & 6. Refund Actions */}
              <div className="flex items-center justify-between pt-3 border-t border-[#F1F5F9]">
                <button
                  onClick={() => {
                    handleProcessRefund(selectedOrder.id);
                  }}
                  className="btn btn-secondary btn-sm text-[#EF4444] hover:bg-[#FEF2F2] border-[#FECACA]"
                >
                  <RotateCcw size={13} /> 5. Process Refund
                </button>

                <button
                  onClick={() => {
                    downloadPDFDocument({
                      title: `TAX INVOICE — ORDER ${selectedOrder.order_id}`,
                      subtitle: `Buyer: ${selectedOrder.buyer_name} (${selectedOrder.buyer_id})`,
                      filename: `Invoice_${selectedOrder.order_id}.pdf`,
                      metadata: {
                        'Order ID': selectedOrder.order_id,
                        'Order Date': selectedOrder.order_date,
                        'Buyer': selectedOrder.buyer_name,
                        'Vendor': selectedOrder.vendor_name,
                        'Product': selectedOrder.product_name,
                        'Total Amount': `₹${(selectedOrder.total_amount ?? 0).toLocaleString()}`,
                        'Payment Mode': selectedOrder.payment_mode,
                      },
                    });
                    toast.success('Generated Tax Invoice PDF!');
                  }}
                  className="btn btn-primary btn-sm flex items-center gap-1.5 cursor-pointer"
                >
                  <Download size={14} /> 6. Download Invoice PDF
                </button>
              </div>
            </div>
          </ModalErrorBoundary>
        </div>
      )}



    </div>
  );
};

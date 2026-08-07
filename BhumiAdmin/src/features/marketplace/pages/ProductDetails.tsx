import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, ShoppingCart, Package, DollarSign, Download, Sparkles,
  Star, Truck
} from 'lucide-react';
import { StatusBadge } from '../../../components/ui/StatusBadge';
import { KpiCard } from '../../../components/ui/KpiCard';
import toast from 'react-hot-toast';

export const ProductDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'info' | 'orders' | 'reviews' | 'commission'>('info');

  const safeId = id || 'PRD-1001';

  const product = {
    id: safeId,
    sku: `SKU-BIO-${safeId.slice(-4).toUpperCase()}`,
    name: 'Organic Bio-Fertilizer Soil Booster 50kg',
    category: 'Bio-Fertilizers',
    brand: 'EcoAgri Organic',
    vendorName: 'GreenFields Agro Vendors Pvt Ltd',
    price: 1450,
    stockQuantity: 450,
    ratingAvg: 4.8,
    reviewsCount: 124,
    unitsSold: 1850,
    revenueLakhs: 26.8,
    vendorCommissionLakhs: 22.78,
    platformCommissionLakhs: 4.02,
    status: 'APPROVED',
  };

  return (
    <div className="space-y-6 page-enter pb-12" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>

      {/* ── HEADER & CONTROL BAR ── */}
      <div className="bg-white border border-[#E8EDF5] rounded-2xl p-5 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3.5 min-w-0">
          <button
            onClick={() => navigate('/marketplace')}
            className="w-10 h-10 rounded-xl border border-[#E2E8F0] bg-white flex items-center justify-center text-[#64748B] hover:text-[#0F172A] hover:bg-[#F8FAFC] transition-all cursor-pointer"
            title="Back to Marketplace"
          >
            <ArrowLeft size={18} />
          </button>
          <div className="w-11 h-11 rounded-2xl bg-[#F0FDF4] border border-[#DCFCE7] flex items-center justify-center text-[#16A34A] shrink-0">
            <Package size={22} />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-[18px] font-bold text-[#0F172A]">{product.name}</h1>
              <span className="font-mono text-[11px] font-bold text-[#2563EB] bg-[#EFF6FF] px-2.5 py-0.5 rounded-md border border-[#DBEAFE]">
                {product.sku}
              </span>
              <StatusBadge label={product.status} variant="success" size="sm" />
            </div>
            <p className="text-[12px] text-[#64748B] mt-0.5 flex items-center gap-2">
              <span>{product.category}</span> • <span>Brand: {product.brand}</span>
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          <button onClick={() => toast.success('Exporting Product Spec Sheet PDF')} className="btn btn-secondary btn-sm gap-1.5 cursor-pointer">
            <Download size={14} /> Product Spec Sheet
          </button>
          <button onClick={() => toast.success('Stock inventory updated successfully')} className="btn btn-primary btn-sm gap-1.5 cursor-pointer">
            <Sparkles size={14} /> Update Inventory
          </button>
        </div>
      </div>

      {/* ── KPI METRIC CARDS ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KpiCard title="UNIT PRICE" value={`₹${product.price.toLocaleString()}`} icon={DollarSign} iconBg="#F0FDF4" iconColor="#16A34A" />
        <KpiCard title="STOCK INVENTORY" value={`${product.stockQuantity.toLocaleString()} Units`} icon={Package} iconBg="#EFF6FF" iconColor="#2563EB" />
        <KpiCard title="UNITS SOLD" value={product.unitsSold.toLocaleString()} icon={ShoppingCart} iconBg="#F5F3FF" iconColor="#8B5CF6" />
        <KpiCard title="TOTAL PRODUCT REVENUE" value={`₹${product.revenueLakhs} Lakhs`} icon={DollarSign} iconBg="#FEF2F2" iconColor="#EF4444" />
      </div>

      {/* ── INTERACTIVE TABS NAV ── */}
      <div className="bg-white border border-[#E8EDF5] rounded-2xl p-1.5 shadow-xs flex items-center gap-1">
        {[
          { id: 'info', label: '1. Product Specifications', icon: Package },
          { id: 'orders', label: '2. Orders & Sales History', icon: Truck },
          { id: 'reviews', label: '3. Customer Ratings & Reviews', icon: Star },
          { id: 'commission', label: '4. Vendor SLA & Commission', icon: DollarSign },
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-[12.5px] font-bold transition-all cursor-pointer ${
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

      {/* ── TAB 1: PRODUCT SPECIFICATIONS ── */}
      {activeTab === 'info' && (
        <div className="bg-white border border-[#E8EDF5] rounded-2xl p-6 shadow-xs space-y-4">
          <h3 className="text-[15px] font-bold text-[#0F172A] flex items-center gap-2">
            <Package size={18} className="text-[#16A34A]" /> Product Specifications & Vendor Metadata
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl space-y-1">
              <span className="text-[11px] font-bold text-[#64748B]">Vendor Enterprise</span>
              <p className="text-[14px] font-bold text-[#0F172A]">{product.vendorName}</p>
            </div>
            <div className="p-4 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl space-y-1">
              <span className="text-[11px] font-bold text-[#64748B]">Stock Status</span>
              <p className="text-[14px] font-bold text-[#16A34A]">{product.stockQuantity} Units In Stock</p>
            </div>
            <div className="p-4 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl space-y-1">
              <span className="text-[11px] font-bold text-[#64748B]">Average Rating</span>
              <p className="text-[14px] font-bold text-[#D97706] flex items-center gap-1">
                <Star size={16} fill="#D97706" /> {product.ratingAvg} ({product.reviewsCount} Customer Reviews)
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 2: ORDERS & SALES HISTORY ── */}
      {activeTab === 'orders' && (
        <div className="ent-card overflow-hidden">
          <div className="p-4 border-b border-[#F1F5F9] flex items-center justify-between">
            <h3 className="text-[14px] font-bold text-[#0F172A]">Farmer Orders Placed for Product</h3>
            <span className="text-[11px] font-bold text-[#2563EB] bg-[#EFF6FF] px-2 py-0.5 rounded-full border border-[#DBEAFE]">
              1,850 Total Orders
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="ent-table min-w-[850px]">
              <thead>
                <tr>
                  <th>Order ID</th>
                  <th>Customer Farmer</th>
                  <th>Quantity</th>
                  <th>Order Total</th>
                  <th>Delivery Status</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { id: 'ORD-2026-9001', name: 'Ramesh Patel (F-84920)', qty: 2, total: '₹2,900', status: 'Delivered' },
                  { id: 'ORD-2026-9002', name: 'Suresh Verma (F-71029)', qty: 1, total: '₹1,450', status: 'In Transit' },
                ].map((o, i) => (
                  <tr key={i}>
                    <td className="font-mono text-[12.5px] font-bold text-[#2563EB]">{o.id}</td>
                    <td className="text-[13px] font-bold text-[#0F172A]">{o.name}</td>
                    <td className="text-[13px] font-medium text-[#0F172A]">{o.qty} bags</td>
                    <td className="text-[13.5px] font-extrabold text-[#16A34A]">{o.total}</td>
                    <td><StatusBadge label={o.status} variant={o.status === 'Delivered' ? 'success' : 'warning'} size="sm" /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── TAB 3: REVIEWS ── */}
      {activeTab === 'reviews' && (
        <div className="bg-white border border-[#E8EDF5] rounded-2xl p-6 shadow-xs space-y-4">
          <h3 className="text-[15px] font-bold text-[#0F172A] flex items-center gap-2">
            <Star size={18} className="text-[#D97706]" /> Customer Reviews ({product.reviewsCount})
          </h3>

          <div className="space-y-3">
            {[
              { name: 'Ramesh Patel', rating: 5, comment: 'Saw 25% faster canopy growth in Teak saplings within 45 days.', date: '02 Aug 2026' },
              { name: 'Suresh Verma', rating: 4, comment: 'Good quality organic bio-fertilizer.', date: '28 Jul 2026' },
            ].map((r, i) => (
              <div key={i} className="p-4 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[13px] font-bold text-[#0F172A]">{r.name}</span>
                    <span className="text-[11px] font-bold text-[#D97706] flex items-center gap-0.5">
                      <Star size={12} fill="#D97706" /> {r.rating}.0
                    </span>
                  </div>
                  <p className="text-[12px] text-[#64748B] italic mt-1">"{r.comment}"</p>
                </div>
                <StatusBadge label="Approved" variant="success" size="sm" />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── TAB 4: VENDOR COMMISSION ── */}
      {activeTab === 'commission' && (
        <div className="bg-white border border-[#E8EDF5] rounded-2xl p-6 shadow-xs space-y-4">
          <h3 className="text-[15px] font-bold text-[#0F172A] flex items-center gap-2">
            <DollarSign size={18} className="text-[#8B5CF6]" /> Vendor SLA Revenue & Commission Split
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-[#FAFAFA] border border-[#E5E5E5] rounded-xl">
              <span className="text-[11px] font-bold text-[#525252]">Total Product Sales Revenue</span>
              <p className="text-[22px] font-extrabold text-[#0F172A]">₹{product.revenueLakhs} Lakhs</p>
            </div>
            <div className="p-4 bg-[#EFF6FF] border border-[#DBEAFE] rounded-xl">
              <span className="text-[11px] font-bold text-[#2563EB]">Vendor Payout Share (85%)</span>
              <p className="text-[22px] font-extrabold text-[#2563EB]">₹{product.vendorCommissionLakhs} Lakhs</p>
            </div>
            <div className="p-4 bg-[#F5F3FF] border border-[#DDD6FE] rounded-xl">
              <span className="text-[11px] font-bold text-[#8B5CF6]">Platform Commission (15%)</span>
              <p className="text-[22px] font-extrabold text-[#8B5CF6]">₹{product.platformCommissionLakhs} Lakhs</p>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

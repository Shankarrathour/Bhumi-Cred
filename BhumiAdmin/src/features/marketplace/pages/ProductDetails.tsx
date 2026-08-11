import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, ShoppingCart, Package, DollarSign, Download, Sparkles,
  Star, Truck, Plus, RefreshCw, X
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { StatusBadge } from '../../../components/ui/StatusBadge';
import { KpiCard } from '../../../components/ui/KpiCard';
import { downloadPDFDocument } from '../../../utils/pdfExporter';
import toast from 'react-hot-toast';

export const ProductDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'info' | 'orders' | 'reviews' | 'commission'>('info');

  const safeId = id || 'PRD-1001';

  // Product State
  const [product, setProduct] = useState({
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
  });

  // Modal State for Update Inventory
  const [isUpdateInventoryOpen, setIsUpdateInventoryOpen] = useState(false);
  const [inventoryForm, setInventoryForm] = useState({
    newStock: 450,
    newPrice: 1450,
    stockStatus: 'IN_STOCK' as const,
  });

  const handleUpdateInventorySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setProduct(prev => ({
      ...prev,
      stockQuantity: Number(inventoryForm.newStock),
      price: Number(inventoryForm.newPrice),
    }));
    toast.success(`Inventory stock updated to ${inventoryForm.newStock} units (₹${inventoryForm.newPrice}/unit)!`);
    setIsUpdateInventoryOpen(false);
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
          <button
            onClick={() => {
              downloadPDFDocument({
                title: `PRODUCT SPECIFICATION SHEET — ${product.name}`,
                subtitle: `SKU Code: ${product.sku} • Category: ${product.category}`,
                filename: `Product_SpecSheet_${product.sku}.pdf`,
                metadata: {
                  'Product Name': product.name,
                  'SKU Code': product.sku,
                  'Category': product.category,
                  'Brand': product.brand,
                  'Vendor Enterprise': product.vendorName,
                  'Unit Price': `₹${product.price.toLocaleString()}`,
                  'Stock In Inventory': `${product.stockQuantity} Units`,
                  'Customer Rating': `★ ${product.ratingAvg} (${product.reviewsCount} Reviews)`,
                },
              });
              toast.success('Generated official Product Spec Sheet PDF!');
            }}
            className="btn btn-secondary btn-sm gap-1.5 cursor-pointer"
          >
            <Download size={14} /> Product Spec Sheet
          </button>

          <button
            onClick={() => {
              setInventoryForm({
                newStock: product.stockQuantity,
                newPrice: product.price,
                stockStatus: 'IN_STOCK',
              });
              setIsUpdateInventoryOpen(true);
            }}
            className="btn btn-primary btn-sm gap-1.5 cursor-pointer"
          >
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
      <div className="bg-white border border-[#E8EDF5] rounded-2xl p-1.5 shadow-xs flex items-center gap-1 overflow-x-auto custom-scrollbar">
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
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-[12.5px] font-bold transition-all cursor-pointer whitespace-nowrap ${
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
        <div className="bg-white border border-[#E8EDF5] rounded-2xl p-5 shadow-xs space-y-3">
          <h3 className="text-[14px] font-bold text-[#0F172A]">Sales & Order History</h3>
          <p className="text-[12.5px] text-[#64748B]">1,850 total units fulfilled for this product across Madhya Pradesh & Gujarat.</p>
        </div>
      )}

      {/* ── TAB 3: CUSTOMER REVIEWS ── */}
      {activeTab === 'reviews' && (
        <div className="bg-white border border-[#E8EDF5] rounded-2xl p-5 shadow-xs space-y-3">
          <h3 className="text-[14px] font-bold text-[#0F172A]">Customer Ratings & Feedback ({product.reviewsCount})</h3>
          <p className="text-[12.5px] text-[#D97706] font-bold">★ {product.ratingAvg} / 5.0 Average Satisfaction Score</p>
        </div>
      )}

      {/* ── TAB 4: VENDOR COMMISSION ── */}
      {activeTab === 'commission' && (
        <div className="bg-white border border-[#E8EDF5] rounded-2xl p-5 shadow-xs space-y-3">
          <h3 className="text-[14px] font-bold text-[#0F172A]">Vendor Revenue & Platform Fee Breakdown</h3>
          <p className="text-[13px] font-bold text-[#16A34A]">Vendor Payout (85%): ₹{product.vendorCommissionLakhs} Lakhs</p>
          <p className="text-[13px] font-bold text-[#2563EB]">Platform Fee (15%): ₹{product.platformCommissionLakhs} Lakhs</p>
        </div>
      )}

      {/* ── UPDATE INVENTORY MODAL DIALOG ── */}
      <AnimatePresence>
        {isUpdateInventoryOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-[#E8EDF5] space-y-4"
            >
              <div className="flex items-center justify-between border-b border-[#F1F5F9] pb-3">
                <div className="flex items-center gap-2">
                  <Package size={20} className="text-[#16A34A]" />
                  <h3 className="text-[16px] font-bold text-[#0F172A]">Update Product Inventory</h3>
                </div>
                <button onClick={() => setIsUpdateInventoryOpen(false)} className="text-[#94A3B8] hover:text-[#0F172A] text-lg font-bold cursor-pointer">×</button>
              </div>

              <form onSubmit={handleUpdateInventorySubmit} className="space-y-3 text-[12.5px]">
                <div>
                  <label className="block font-bold text-[#0F172A] mb-1">Product SKU</label>
                  <input
                    type="text"
                    disabled
                    value={product.sku}
                    className="w-full px-3 py-2 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-[12.5px] font-mono font-bold text-[#64748B]"
                  />
                </div>

                <div>
                  <label className="block font-bold text-[#0F172A] mb-1">Stock Quantity (Units) *</label>
                  <input
                    type="number"
                    required
                    value={inventoryForm.newStock}
                    onChange={(e) => setInventoryForm({ ...inventoryForm, newStock: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-[13px] font-bold text-[#0F172A] outline-none focus:border-[#16A34A]"
                  />
                </div>

                <div>
                  <label className="block font-bold text-[#0F172A] mb-1">Selling Unit Price (₹) *</label>
                  <input
                    type="number"
                    required
                    value={inventoryForm.newPrice}
                    onChange={(e) => setInventoryForm({ ...inventoryForm, newPrice: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-[13px] font-extrabold text-[#16A34A] outline-none focus:border-[#16A34A]"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#F1F5F9]">
                  <button type="button" onClick={() => setIsUpdateInventoryOpen(false)} className="btn btn-secondary btn-sm">
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary btn-sm flex items-center gap-1.5">
                    <Sparkles size={14} /> Save Inventory
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

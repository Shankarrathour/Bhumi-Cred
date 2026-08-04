import React, { useState, useEffect, useMemo } from 'react';
import api from '../api/apiClient';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Package, 
  Check, 
  X, 
  Search, 
  Eye, 
  ShieldCheck, 
  Clock, 
  Ban, 
  Tag, 
  RefreshCw, 
  Download, 
  CheckCircle2, 
  ShoppingBag
} from 'lucide-react';
import { cn } from '../utils/cn';

const STATUS_TABS = [
  { id: 'All', label: 'All Products' },
  { id: 'Pending', label: 'Pending Review' },
  { id: 'Approved', label: 'Approved' },
  { id: 'Rejected', label: 'Rejected' },
];

const PRODUCT_SMART_IMAGES: Record<string, string> = {
  'sunflower': 'https://images.unsplash.com/photo-1597848212624-a19eb35e2651?w=500&auto=format&fit=crop',
  'cucumber': 'https://images.unsplash.com/photo-1449300079323-02e209d9d3a6?w=500&auto=format&fit=crop',
  'graphics': 'https://images.unsplash.com/photo-1615485290382-441e4d049cb5?w=500&auto=format&fit=crop',
  'vermicompost': 'https://images.unsplash.com/photo-1625246333195-78d9c38ad449?w=500&auto=format&fit=crop',
  'wheat': 'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=500&auto=format&fit=crop',
  'mango': 'https://images.unsplash.com/photo-1553279768-865429fa0078?w=500&auto=format&fit=crop',
  'irrigation': 'https://images.unsplash.com/photo-1563514227147-6d2ff665a6a0?w=500&auto=format&fit=crop',
  'neem': 'https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?w=500&auto=format&fit=crop',
  'ladyfinger': 'https://images.unsplash.com/photo-1628088062854-d1870b4553da?w=500&auto=format&fit=crop',
  'jira': 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=500&auto=format&fit=crop',
  'potato': 'https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=500&auto=format&fit=crop',
  'tomato': 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=500&auto=format&fit=crop',
  'pea': 'https://images.unsplash.com/photo-1587735243615-c03f25aaff15?w=500&auto=format&fit=crop',
};

const getImageUrl = (url?: string | null, productName?: string) => {
  if (url && url.startsWith('https://res.cloudinary.com')) return url;
  
  // Smart match by product name for distinct relevant photos
  if (productName) {
    const lowerName = productName.toLowerCase();
    for (const [key, mappedUrl] of Object.entries(PRODUCT_SMART_IMAGES)) {
      if (lowerName.includes(key)) {
        return mappedUrl;
      }
    }
  }

  if (url && url.includes('/uploads/')) {
    const relativePath = url.substring(url.indexOf('/uploads/'));
    return `http://localhost:8000${relativePath}`;
  }
  return url || null;
};

const ProductThumbnail: React.FC<{ url?: string | null; alt: string; className?: string }> = ({ url, alt, className }) => {
  const [hasError, setHasError] = useState(false);
  const resolvedUrl = getImageUrl(url, alt);

  if (!resolvedUrl || hasError) {
    return <Package className="h-5 w-5 text-primary/70" />;
  }

  return (
    <img 
      src={resolvedUrl} 
      alt={alt} 
      onError={() => setHasError(true)}
      className={className || "h-full w-full object-cover group-hover/img:scale-105 transition-transform"} 
    />
  );
};

export const ProductsModeration: React.FC = () => {
  const [products, setProducts] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('All');
  const [isLoading, setIsLoading] = useState(true);
  const [viewingProduct, setViewingProduct] = useState<any | null>(null);

  const fetchProducts = async () => {
    setIsLoading(true);
    try {
      const res = await api.get('/admin/products', { params: { limit: 100 } });
      const data = res.data;
      const list = Array.isArray(data) ? data : (data?.items ?? []);
      setProducts(list);

      // Keep viewing modal in sync if updated
      if (viewingProduct) {
        const updated = list.find((p: any) => p.id === viewingProduct.id);
        if (updated) setViewingProduct(updated);
      }
    } catch (err) {
      console.error('Products fetch error:', err);
      toast.error('Failed to fetch products for moderation');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const updateStatus = async (id: string, action: 'approve' | 'reject') => {
    try {
      await api.patch(`/admin/products/${id}/${action}`);
      toast.success(`Product ${action === 'approve' ? 'approved & published' : 'rejected'}`);
      fetchProducts();
    } catch (err) {
      toast.error('Failed to update product status');
    }
  };

  // Filter products by search and active status tab
  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const matchesSearch = 
        p.name?.toLowerCase().includes(search.toLowerCase()) ||
        p.category?.name?.toLowerCase().includes(search.toLowerCase()) ||
        p.description?.toLowerCase().includes(search.toLowerCase());

      const productStatus = (p.status || 'Pending').toLowerCase();
      const matchesTab = activeTab === 'All' || productStatus === activeTab.toLowerCase();

      return matchesSearch && matchesTab;
    });
  }, [products, search, activeTab]);

  // Metrics
  const stats = useMemo(() => {
    const total = products.length;
    const approved = products.filter(p => (p.status || '').toLowerCase() === 'approved').length;
    const pending = products.filter(p => (p.status || '').toLowerCase() === 'pending').length;
    const rejected = products.filter(p => (p.status || '').toLowerCase() === 'rejected').length;

    return { total, approved, pending, rejected };
  }, [products]);

  const handleExportCSV = () => {
    if (filteredProducts.length === 0) {
      toast.error('No products to export');
      return;
    }
    const headers = ["Product ID", "Product Name", "Category", "Price", "Stock Quantity", "Status"];
    const rows = filteredProducts.map(p => [
      p.id || '',
      `"${(p.name || '').replace(/"/g, '""')}"`,
      p.category?.name || 'Uncategorized',
      p.price || 0,
      p.stock_quantity ?? 0,
      p.status || 'Pending'
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `BhumiCred_Products_Moderation_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Products moderation report exported to CSV');
  };

  return (
    <div className="w-full space-y-6 pb-12 text-foreground select-none">

      {/* ── Header ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/80 pb-5">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-primary/10 border border-primary/20 rounded-full text-[11px] font-semibold text-primary mb-2">
            <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
            BHUMICRED MARKETPLACE MODERATION: ACTIVE
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <ShoppingBag className="w-6 h-6 text-primary" />
            PRODUCTS MODERATION
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            Audit, review, and approve eco-friendly agri-inputs & vendor listings for the marketplace.
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start md:self-auto">
          <button
            onClick={fetchProducts}
            disabled={isLoading}
            className="btn-outline text-xs px-3 py-1.5 flex items-center gap-1.5 hover:border-primary/40 transition-colors"
            title="Refresh Products"
          >
            <RefreshCw className={cn("w-3.5 h-3.5 text-muted-foreground", isLoading && "animate-spin text-primary")} />
            <span>Refresh</span>
          </button>

          <button
            onClick={handleExportCSV}
            className="btn-primary text-xs px-3.5 py-1.5 shadow-sm"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* ── KPI Summary Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Total Products */}
        <div className="ent-card p-4 flex items-center justify-between">
          <div>
            <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Total Listings</p>
            <h3 className="text-2xl font-bold text-foreground mt-1">{stats.total}</h3>
            <p className="text-[10px] text-muted-foreground mt-0.5">Submitted catalog items</p>
          </div>
          <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
            <Package className="w-5 h-5" />
          </div>
        </div>

        {/* Approved Products */}
        <div className="ent-card p-4 flex items-center justify-between">
          <div>
            <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Approved Products</p>
            <h3 className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">{stats.approved}</h3>
            <p className="text-[10px] text-emerald-600/80 dark:text-emerald-400/80 mt-0.5 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" /> Live on Marketplace
            </p>
          </div>
          <div className="w-11 h-11 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
            <ShieldCheck className="w-5 h-5" />
          </div>
        </div>

        {/* Pending Moderation */}
        <div className="ent-card p-4 flex items-center justify-between">
          <div>
            <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Pending Review</p>
            <h3 className="text-2xl font-bold text-amber-600 dark:text-amber-400 mt-1">{stats.pending}</h3>
            <p className="text-[10px] text-amber-600/80 dark:text-amber-400/80 mt-0.5 flex items-center gap-1">
              <Clock className="w-3 h-3 animate-pulse" /> Moderation Required
            </p>
          </div>
          <div className="w-11 h-11 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-600 dark:text-amber-400">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        {/* Rejected Listings */}
        <div className="ent-card p-4 flex items-center justify-between">
          <div>
            <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Rejected Listings</p>
            <h3 className="text-2xl font-bold text-rose-600 dark:text-rose-400 mt-1">{stats.rejected}</h3>
            <p className="text-[10px] text-rose-600/80 dark:text-rose-400/80 mt-0.5">Non-compliant / Declined</p>
          </div>
          <div className="w-11 h-11 rounded-xl bg-rose-500/10 flex items-center justify-center text-rose-600 dark:text-rose-400">
            <Ban className="w-5 h-5" />
          </div>
        </div>

      </div>

      {/* ── Status Tabs & Search ── */}
      <div className="ent-card p-3 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        
        {/* Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
          {STATUS_TABS.map(tab => {
            const count = tab.id === 'All' 
              ? products.length 
              : products.filter(p => (p.status || 'Pending').toLowerCase() === tab.id.toLowerCase()).length;

            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all flex items-center gap-1.5",
                  activeTab === tab.id
                    ? "bg-primary text-white shadow-sm font-semibold"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <span>{tab.label}</span>
                <span className={cn(
                  "px-1.5 py-0.2 rounded-full text-[10px] font-semibold",
                  activeTab === tab.id ? "bg-white/20 text-white" : "bg-muted-foreground/10 text-muted-foreground"
                )}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Search */}
        <div className="relative w-full md:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search product, category..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-8 py-1.5 bg-background border border-border rounded-xl text-xs outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 text-foreground transition-all"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* ── Products Data Table ── */}
      <div className="ent-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-muted/40 border-b border-border text-[11px] font-semibold uppercase text-muted-foreground tracking-wider">
              <tr>
                <th className="py-3 px-4">Product</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Price & Inventory</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-border/60">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, idx) => (
                  <tr key={idx} className="animate-pulse">
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-muted rounded-xl" />
                        <div className="space-y-1.5">
                          <div className="h-3.5 w-36 bg-muted rounded" />
                          <div className="h-2.5 w-24 bg-muted rounded" />
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-4"><div className="h-3.5 w-24 bg-muted rounded" /></td>
                    <td className="py-4 px-4"><div className="h-3.5 w-20 bg-muted rounded" /></td>
                    <td className="py-4 px-4"><div className="h-5 w-16 bg-muted rounded-full" /></td>
                    <td className="py-4 px-4 text-right"><div className="h-7 w-20 bg-muted rounded ml-auto" /></td>
                  </tr>
                ))
              ) : filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-muted-foreground">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Package className="w-8 h-8 text-muted-foreground/40" />
                      <p className="font-semibold text-foreground">No Products Found</p>
                      <p className="text-xs text-muted-foreground">No marketplace listings match the selected criteria.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredProducts.map((product) => {
                  const status = (product.status || 'Pending').toLowerCase();
                  const images = product.images ?? [];
                  const primaryImage = product.primary_image || (images.length > 0 ? images[0] : null);

                  return (
                    <tr key={product.id} className="hover:bg-muted/30 transition-colors group">
                      
                      {/* Product Info */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          
                          {/* Image Thumbnail Button */}
                          <button
                            type="button"
                            onClick={() => setViewingProduct(product)}
                            className="relative shrink-0 h-10 w-10 rounded-xl border border-border overflow-hidden bg-muted flex items-center justify-center group/img hover:border-primary/50 transition-colors"
                            title="View full gallery & details"
                          >
                            <ProductThumbnail url={primaryImage} alt={product.name} />
                            {images.length > 1 && (
                              <span className="absolute bottom-0 right-0 bg-black/75 text-[8px] text-white font-bold px-1 py-0.2 rounded-tl">
                                +{images.length - 1}
                              </span>
                            )}
                          </button>

                          <div>
                            <p 
                              onClick={() => setViewingProduct(product)}
                              className="font-semibold text-foreground text-xs hover:text-primary transition-colors cursor-pointer"
                            >
                              {product.name}
                            </p>
                            <p className="text-[11px] text-muted-foreground mt-0.5 max-w-xs truncate">
                              {product.description || 'No description provided'}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Category */}
                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-primary">
                          <Tag className="w-3 h-3 text-primary/70" />
                          {product.category?.name || 'Agri-Inputs'}
                        </span>
                      </td>

                      {/* Price & Inventory */}
                      <td className="py-3.5 px-4">
                        <div className="space-y-0.5">
                          <p className="font-semibold text-foreground text-xs flex items-center gap-0.5">
                            ₹{Number(product.price || 0).toLocaleString('en-IN')}
                          </p>
                          <p className="text-[11px] text-muted-foreground">
                            {product.stock_quantity ?? 0} units in stock
                          </p>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4">
                        <span className={cn(
                          "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border capitalize",
                          status === 'approved' 
                            ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20 dark:text-emerald-400"
                            : status === 'pending'
                            ? "bg-amber-500/10 text-amber-600 border-amber-500/20 dark:text-amber-400"
                            : "bg-rose-500/10 text-rose-600 border-rose-500/20 dark:text-rose-400"
                        )}>
                          <span className={cn(
                            "w-1.5 h-1.5 rounded-full",
                            status === 'approved' ? "bg-emerald-500" : status === 'pending' ? "bg-amber-500 animate-pulse" : "bg-rose-500"
                          )} />
                          {product.status || 'Pending'}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          
                          {/* View Details */}
                          <button
                            onClick={() => setViewingProduct(product)}
                            className="p-1.5 rounded-lg border border-border text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                            title="View Gallery & Specs"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>

                          {/* Approve Action */}
                          {status !== 'approved' && (
                            <button
                              onClick={() => updateStatus(product.id, 'approve')}
                              className="p-1.5 rounded-lg border border-emerald-500/30 text-emerald-600 hover:bg-emerald-500/10 transition-colors"
                              title="Approve & Publish Listing"
                            >
                              <Check className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {/* Reject Action */}
                          {status !== 'rejected' && (
                            <button
                              onClick={() => updateStatus(product.id, 'reject')}
                              className="p-1.5 rounded-lg border border-rose-500/30 text-rose-600 hover:bg-rose-500/10 transition-colors"
                              title="Reject Product Listing"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>

                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Product Detail & Image Gallery Modal ── */}
      <AnimatePresence>
        {viewingProduct && (
          <div
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4"
            onClick={() => setViewingProduct(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className="bg-card border border-border rounded-2xl max-w-2xl w-full max-h-[85vh] overflow-hidden flex flex-col shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="p-4 border-b border-border flex items-center justify-between bg-card">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-foreground text-sm">{viewingProduct.name}</h3>
                    <span className={cn(
                      "px-2 py-0.5 rounded-full text-[10px] font-semibold border capitalize",
                      (viewingProduct.status || '').toLowerCase() === 'approved' ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" :
                      (viewingProduct.status || '').toLowerCase() === 'pending' ? "bg-amber-500/10 text-amber-600 border-amber-500/20" :
                      "bg-rose-500/10 text-rose-600 border-rose-500/20"
                    )}>
                      {viewingProduct.status || 'Pending'}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Category: <span className="font-medium text-primary">{viewingProduct.category?.name || 'Agri-Inputs'}</span>
                  </p>
                </div>

                <button
                  onClick={() => setViewingProduct(null)}
                  className="p-1.5 rounded-lg border border-border text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Modal Content */}
              <div className="p-5 space-y-5 flex-1 overflow-y-auto">
                
                {/* Specs Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                  <div className="ent-card p-3 space-y-0.5">
                    <span className="text-[10px] text-muted-foreground uppercase">Price</span>
                    <p className="font-bold text-foreground text-sm">₹{Number(viewingProduct.price || 0).toLocaleString('en-IN')}</p>
                  </div>
                  <div className="ent-card p-3 space-y-0.5">
                    <span className="text-[10px] text-muted-foreground uppercase">Stock Level</span>
                    <p className="font-bold text-foreground text-sm">{viewingProduct.stock_quantity ?? 0} units</p>
                  </div>
                  <div className="ent-card p-3 space-y-0.5 col-span-2 sm:col-span-1">
                    <span className="text-[10px] text-muted-foreground uppercase">Product ID</span>
                    <p className="font-mono text-xs text-primary truncate">{viewingProduct.id}</p>
                  </div>
                </div>

                {/* Description */}
                <div className="space-y-1.5">
                  <h4 className="text-xs font-bold text-foreground uppercase tracking-wider">Product Description</h4>
                  <div className="ent-card p-3 text-xs text-muted-foreground leading-relaxed bg-muted/20">
                    {viewingProduct.description || 'No detailed description provided by vendor.'}
                  </div>
                </div>

                {/* Image Gallery */}
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center justify-between">
                    <span>Uploaded Product Images</span>
                    <span className="text-[10px] font-normal text-muted-foreground">
                      {(viewingProduct.images ?? []).length} images
                    </span>
                  </h4>

                  {viewingProduct.images?.length > 0 ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {viewingProduct.images.map((url: string, idx: number) => (
                        <div key={idx} className="relative aspect-square rounded-xl overflow-hidden border border-border group bg-muted flex items-center justify-center">
                          <ProductThumbnail url={url} alt={`${viewingProduct.name} ${idx + 1}`} />
                          <span className="absolute bottom-1 right-1 bg-black/60 text-white text-[9px] px-1.5 py-0.5 rounded font-mono">
                            #{idx + 1}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : viewingProduct.primary_image ? (
                    <div className="w-full h-48 rounded-xl overflow-hidden border border-border bg-muted flex items-center justify-center">
                      <ProductThumbnail url={viewingProduct.primary_image} alt={viewingProduct.name} />
                    </div>
                  ) : (
                    <div className="ent-card p-8 text-center text-xs text-muted-foreground">
                      No product images uploaded
                    </div>
                  )}
                </div>

              </div>

              {/* Modal Footer */}
              <div className="p-4 border-t border-border bg-muted/20 flex items-center justify-end gap-2.5">
                {(viewingProduct.status || '').toLowerCase() !== 'approved' && (
                  <button
                    onClick={() => {
                      updateStatus(viewingProduct.id, 'approve');
                      setViewingProduct((prev: any) => prev ? { ...prev, status: 'Approved' } : null);
                    }}
                    className="btn-primary text-xs px-4 py-2 flex items-center gap-1.5"
                  >
                    <Check className="w-4 h-4" />
                    <span>Approve & Publish</span>
                  </button>
                )}

                {(viewingProduct.status || '').toLowerCase() !== 'rejected' && (
                  <button
                    onClick={() => {
                      updateStatus(viewingProduct.id, 'reject');
                      setViewingProduct((prev: any) => prev ? { ...prev, status: 'Rejected' } : null);
                    }}
                    className="btn-outline border-rose-500/30 text-rose-600 hover:bg-rose-500/10 text-xs px-4 py-2 flex items-center gap-1.5"
                  >
                    <X className="w-4 h-4" />
                    <span>Reject Listing</span>
                  </button>
                )}
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};

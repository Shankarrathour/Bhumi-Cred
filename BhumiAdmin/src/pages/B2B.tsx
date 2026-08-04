import React, { useState } from 'react';
import { useEcosystemStore } from '../store';
import { Product } from '../types';
import toast from 'react-hot-toast';
import { 
  ShoppingBag, 
  Search, 
  XCircle, 
  User,
  Star,
  StarOff,
  Check
} from 'lucide-react';
import { cn } from '../utils/cn';

export const B2BPage: React.FC = () => {
  const { products, moderateProduct, toggleFeaturedProduct } = useEcosystemStore();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'Pending' | 'Approved' | 'Rejected' | 'All'>('Pending');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  const filteredProducts = products.filter(prod => {
    // 1. Status Filter
    if (statusFilter !== 'All' && prod.moderationStatus !== statusFilter) return false;

    // 2. Search Query
    const matchesSearch = 
      prod.title.toLowerCase().includes(search.toLowerCase()) ||
      prod.vendorName.toLowerCase().includes(search.toLowerCase()) ||
      prod.category.toLowerCase().includes(search.toLowerCase());

    return matchesSearch;
  });

  const handleModerate = (productId: string, status: 'Approved' | 'Rejected') => {
    moderateProduct(productId, status);
    toast.success(`Marketplace product marked: ${status}`);
    
    // Refresh selection
    if (selectedProduct?.id === productId) {
      setSelectedProduct(prev => prev ? { ...prev, moderationStatus: status, isApproved: status === 'Approved' } : null);
    }
  };

  const handleToggleFeatured = (productId: string) => {
    toggleFeaturedProduct(productId);
    const isNowFeatured = !selectedProduct?.isFeatured;
    toast.success(`Product ${isNowFeatured ? 'marked as featured' : 'removed from featured list'}.`);
    if (selectedProduct?.id === productId) {
      setSelectedProduct(prev => prev ? { ...prev, isFeatured: !prev.isFeatured } : null);
    }
  };

  const handleSelectProduct = (prod: Product) => {
    setSelectedProduct(prod);
  };

  return (
    <div className="space-y-5 pb-10 font-mono text-xs text-foreground select-none">
      {/* Header */}
      <div className="border-b border-border pb-4">
        <h1 className="text-lg font-black uppercase tracking-wider leading-none">Marketplace Products Moderation</h1>
        <p className="text-muted-foreground text-[8.5px] uppercase tracking-widest mt-2">
          Review voluntary climate technology products uploaded by empanelled vendors. Verify carbon standards and organic certifications.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        
        {/* Left Side: Product Moderation Registry */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex flex-col md:flex-row items-center gap-3 bg-card border border-border p-3">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-primary" />
              <input 
                type="text"
                placeholder="SEARCH MARKEPLACE PRODUCTS BY TITLE, CATEGORY..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full bg-background border border-border pl-9 pr-3 py-2 text-[9px] outline-none focus:border-primary/50 text-foreground"
              />
            </div>
            
            {/* Status Selectors */}
            <div className="flex gap-1">
              {(['All', 'Pending', 'Approved', 'Rejected'] as const).map(tab => (
                <button
                  key={tab}
                  onClick={() => {
                    setStatusFilter(tab);
                    setSelectedProduct(null);
                  }}
                  className={cn(
                    "px-2.5 py-1.5 text-[8px] font-black uppercase tracking-widest border transition-all rounded-none",
                    statusFilter === tab 
                      ? "bg-primary text-primary-foreground border-primary" 
                      : "border-border text-muted-foreground hover:bg-muted/50"
                  )}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredProducts.map(prod => (
              <div 
                key={prod.id}
                className={cn(
                  "bg-card border p-4 flex flex-col justify-between gap-4 transition-all hover:border-primary/40 shadow-sm",
                  prod.moderationStatus === 'Rejected' ? "opacity-60 grayscale border-dashed border-destructive/50" : "border-border"
                )}
              >
                <div className="flex gap-4">
                  <img src={prod.imageUrl} alt={prod.title} className="w-16 h-16 object-cover border border-border shrink-0" />
                  <div className="space-y-1">
                    <span className="text-[7px] bg-primary/10 border border-primary/20 text-primary font-black px-1.5 py-0.2 uppercase">
                      {prod.category}
                    </span>
                    <h4 className="text-[10px] font-black text-foreground uppercase tracking-wider leading-snug">{prod.title}</h4>
                    <div className="text-[7.5px] text-muted-foreground font-black">
                      Vendor: {prod.vendorName}
                    </div>
                  </div>
                </div>

                <div className="flex justify-between items-center text-[9px] font-black uppercase tracking-wider border-t border-border/40 pt-2">
                  <div className="flex flex-col">
                    <span className="text-[7px] text-muted-foreground">Price</span>
                    <span className="text-primary font-extrabold">₹{prod.price.toLocaleString('en-IN')}</span>
                  </div>
                  <span className={cn(
                    "text-[6.5px] font-black uppercase px-1.5 py-0.2 border tracking-widest",
                    prod.moderationStatus === 'Approved' ? "bg-primary/5 text-primary border-primary/20" :
                    prod.moderationStatus === 'Rejected' ? "bg-destructive/5 text-destructive border-destructive/20" :
                    "bg-accent/5 text-accent border-accent/20"
                  )}>
                    {prod.moderationStatus}
                  </span>
                </div>

                <div className="flex justify-between items-center border-t border-border/30 pt-2">
                  <span className="text-[7.5px] text-muted-foreground uppercase">STOCK CAP: {prod.stock}</span>
                  <button
                    onClick={() => handleSelectProduct(prod)}
                    className="px-2.5 py-1 bg-primary text-primary-foreground font-black uppercase tracking-widest text-[8px] hover:shadow-[0_0_8px_rgba(0,255,135,0.3)] shrink-0 rounded-none border border-primary/20"
                  >
                    Moderate Listing
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Side: Product Details & Moderation Work Area */}
        <div className="lg:col-span-1 bg-card border border-border p-5 h-[520px] flex flex-col justify-between shadow-sm relative">
          
          {selectedProduct ? (
            <div className="flex-1 flex flex-col h-full overflow-hidden">
              <div className="border-b border-border pb-3 shrink-0">
                <span className="text-[7px] bg-primary/10 text-primary font-black px-2 py-0.5 border border-primary/20">
                  PRODUCT CATALOG AUDIT
                </span>
                <h3 className="text-[10px] font-black text-foreground mt-2 uppercase truncate">{selectedProduct.title}</h3>
              </div>

              <div className="flex-1 pt-4 space-y-4 overflow-y-auto scrollbar-thin">
                <div className="space-y-2 text-[9px] text-muted-foreground font-bold">
                  <div>
                    <span className="block text-[7px] mb-0.5">STORE MERCHANT</span>
                    <span className="text-foreground font-black flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-primary" /> {selectedProduct.vendorName}
                    </span>
                  </div>
                  <div className="pt-2">
                    <span className="block text-[7px] mb-0.5">ECO-FRIENDLY BADGES</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {selectedProduct.ecoBadges.map((badge, idx) => (
                        <span key={idx} className="text-[7px] bg-primary/10 border border-primary/20 text-primary px-1.5 py-0.2">{badge}</span>
                      ))}
                    </div>
                  </div>
                  <div className="pt-2 border-t border-border/30">
                    <span className="block text-[7px] mb-0.5">PRODUCT SPECIFICATIONS</span>
                    <p className="text-foreground leading-normal normal-case font-bold mt-1">{selectedProduct.description}</p>
                  </div>
                </div>

                {/* Moderation Controls */}
                <div className="border-t border-border/30 pt-3 space-y-2.5">
                  <span className="block text-[7px] text-muted-foreground">MODERATION ACTIONS</span>
                  
                  {selectedProduct.moderationStatus === 'Pending' ? (
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => handleModerate(selectedProduct.id, 'Rejected')}
                        className="py-2 border border-destructive text-destructive hover:bg-destructive/5 text-[8px] font-black uppercase text-center flex items-center justify-center gap-1 rounded-none"
                      >
                        <XCircle className="w-4 h-4" /> Reject
                      </button>
                      <button
                        onClick={() => handleModerate(selectedProduct.id, 'Approved')}
                        className="py-2 bg-primary text-primary-foreground border border-primary/20 hover:shadow-[0_0_8px_rgba(0,255,135,0.4)] text-[8px] font-black uppercase text-center flex items-center justify-center gap-1 rounded-none"
                      >
                        <Check className="w-4 h-4 text-primary-foreground" /> Approve
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="text-[8px] border border-border bg-muted/40 p-2 text-center text-primary font-black uppercase">
                        MODERATION CLOSED: LISTING IS {selectedProduct.moderationStatus}
                      </div>
                      
                      {selectedProduct.moderationStatus === 'Approved' && (
                        <button
                          onClick={() => handleToggleFeatured(selectedProduct.id)}
                          className={cn(
                            "w-full py-2 border text-[8px] font-black uppercase flex items-center justify-center gap-1.5 transition-colors duration-150 rounded-none",
                            selectedProduct.isFeatured 
                              ? "border-accent text-accent bg-accent/5 hover:bg-accent/10" 
                              : "border-primary text-primary hover:bg-primary/5"
                          )}
                        >
                          {selectedProduct.isFeatured ? (
                            <>
                              <StarOff className="w-3.5 h-3.5 shrink-0" />
                              <span>REMOVE FROM FEATURED</span>
                            </>
                          ) : (
                            <>
                              <Star className="w-3.5 h-3.5 fill-primary shrink-0" />
                              <span>MARK AS FEATURED ITEM</span>
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center">
              <ShoppingBag className="w-8 h-8 text-primary/30 opacity-60 mb-2 text-primary animate-pulse" />
              <h3 className="text-[10px] font-black uppercase tracking-widest text-foreground">Select Product listing</h3>
              <p className="text-[8px] text-muted-foreground uppercase font-bold mt-1 max-w-[150px] leading-relaxed">
                Click "Moderate Listing" to review voluntary organic certificates, stock levels, and carbon offset claims.
              </p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

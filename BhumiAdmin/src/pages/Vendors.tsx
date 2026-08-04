import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useEcosystemStore } from '../store';
import { Vendor } from '../types';
import toast from 'react-hot-toast';
import { 
  Store, 
  Search, 
  Phone, 
  User, 
  Star,
  CheckCircle,
  Ban,
  Tag,
  Mail,
  DollarSign,
  Download
} from 'lucide-react';
import { cn } from '../utils/cn';

export const VendorsPage: React.FC = () => {
  const { vendors, products, updateVendorStatus } = useEcosystemStore();
  const { id } = useParams<{ id: string }>();
  
  const [search, setSearch] = useState('');
  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<string>('All');

  useEffect(() => {
    if (id) {
      const match = vendors.find(v => v.id === id || v.id === `VND-${id}`);
      if (match) {
        setSelectedVendor(match);
      }
    }
  }, [id, vendors]);

  // Scoped filtering of vendors based on active geographic monitors
  const displayList = vendors.filter(vendor => {
    if (categoryFilter !== 'All' && vendor.category !== categoryFilter) return false;

    const matchesSearch = 
      vendor.storeName.toLowerCase().includes(search.toLowerCase()) ||
      vendor.ownerName.toLowerCase().includes(search.toLowerCase()) ||
      vendor.id.toLowerCase().includes(search.toLowerCase());

    return matchesSearch;
  });

  const handleSelectVendor = (vendor: Vendor) => {
    setSelectedVendor(vendor);
  };

  const handleToggleVerify = (vendorId: string, currentStatus: string) => {
    const isApproved = currentStatus === 'Approved';
    const nextStatus = isApproved ? 'Pending' : 'Approved';
    updateVendorStatus(vendorId, nextStatus);
    toast.success(`Vendor store status updated successfully to ${nextStatus}.`);
    
    // Refresh local selection
    if (selectedVendor?.id === vendorId) {
      setSelectedVendor(prev => prev ? { ...prev, kycStatus: nextStatus, verified: nextStatus === 'Approved' } : null);
    }
  };

  const handleExportCSV = () => {
    toast.success('Empanelled vendor directory exported as BhumiCred_Vendors_List.csv');
  };

  // Find products associated with the active vendor store
  const vendorProducts = selectedVendor 
    ? products.filter(p => p.vendorId === selectedVendor.id) 
    : [];

  return (
    <div className="space-y-5 pb-10 font-mono text-xs text-foreground select-none">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-border pb-4">
        <div>
          <h1 className="text-lg font-black uppercase tracking-wider leading-none">Empanelled Vendor Registry</h1>
          <p className="text-muted-foreground text-[8.5px] uppercase tracking-widest mt-2">
            Verify green-marketplace merchants, audit sustainable crop seeds and solar technologies, and manage store access.
          </p>
        </div>

        <button
          onClick={handleExportCSV}
          className="cyber-button-primary self-start lg:self-center"
        >
          <Download className="w-4 h-4 text-primary-foreground" />
          <span>Export Directory (CSV)</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        
        {/* Left Side: Vendors List */}
        <div className="lg:col-span-1 bg-card border border-border p-4 flex flex-col h-[520px] overflow-hidden">
          <div className="border-b border-border pb-3.5 space-y-3 shrink-0">
            <h3 className="text-[10px] font-black uppercase text-primary tracking-widest flex items-center gap-1.5">
              <Store className="w-4 h-4 text-primary" />
              Empanelled Dealers
            </h3>

            {/* Category Filter */}
            <div className="flex flex-wrap gap-1 border border-border p-1 bg-muted/20">
              {['All', 'Seeds & Organic', 'Bio-Fertilizers', 'Solar Tech', 'Farm Machinery'].map(cat => (
                <button
                  key={cat}
                  onClick={() => setCategoryFilter(cat)}
                  className={cn(
                    "px-2 py-1 text-[7.5px] font-black uppercase tracking-widest border transition-all rounded-none",
                    categoryFilter === cat 
                      ? "bg-primary text-primary-foreground border-primary" 
                      : "border-transparent text-muted-foreground hover:bg-muted"
                  )}
                >
                  {cat.split(' ')[0]}
                </button>
              ))}
            </div>

            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-primary" />
              <input 
                type="text"
                placeholder="SEARCH VENDORS STORE..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-background border border-border rounded-none text-[9px] outline-none focus:border-primary/50 text-foreground"
              />
            </div>
          </div>

          {/* Scrollable list */}
          <div className="flex-1 overflow-y-auto space-y-2 pt-3 pr-1 scrollbar-thin">
            {displayList.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <span>No vendors empanelled</span>
              </div>
            ) : (
              displayList.map(vendor => (
                <button
                  key={vendor.id}
                  onClick={() => handleSelectVendor(vendor)}
                  className={cn(
                    "w-full text-left p-3 border transition-all block rounded-none relative bg-card",
                    selectedVendor?.id === vendor.id 
                      ? "border-primary bg-primary/5 shadow-[inset_0_0_10px_rgba(0,255,135,0.05)]" 
                      : "border-border hover:border-primary/20"
                  )}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-extrabold text-[10px] text-foreground">{vendor.storeName}</h4>
                      <p className="text-[7.5px] text-muted-foreground mt-0.5">{vendor.id} • {vendor.ownerName}</p>
                    </div>
                    <span className={cn(
                      "text-[6.5px] font-black uppercase px-1.5 py-0.2 border tracking-widest shrink-0",
                      vendor.kycStatus === 'Approved' ? "bg-primary/5 text-primary border-primary/20" : "bg-accent/5 text-accent border-accent/20"
                    )}>
                      {vendor.kycStatus}
                    </span>
                  </div>

                  <div className="mt-2.5 flex justify-between items-center text-[7.5px] text-muted-foreground font-black pt-2 border-t border-border/40">
                    <span className="flex items-center gap-1">
                      <Tag className="w-3 h-3 text-primary" /> {vendor.category}
                    </span>
                    <span className="flex items-center gap-1">
                      <Star className="w-3 h-3 text-primary shrink-0" /> {vendor.rating} RATING
                    </span>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Right Side: Vendor Details & Eco-product Catalog */}
        <div className="lg:col-span-2 bg-card border border-border p-5 flex flex-col h-[520px] overflow-hidden">
          {selectedVendor ? (
            <div className="flex-1 flex flex-col h-full overflow-hidden">
              
              {/* Dossier Header */}
              <div className="flex items-center justify-between border-b border-border pb-3 shrink-0">
                <div>
                  <h3 className="text-[10px] font-black uppercase tracking-widest text-primary flex items-center gap-1.5">
                    <Store className="w-4 h-4 text-primary animate-pulse" />
                    Store Empanelment Dossier: {selectedVendor.storeName}
                  </h3>
                  <p className="text-[8px] font-bold text-muted-foreground mt-0.5">MSME REGISTERED • COMPLIANT GREEN MERCHANT</p>
                </div>
                <div className="text-[8px] font-black bg-muted px-2.5 py-1 border border-border text-foreground">
                  VND ID: {selectedVendor.id}
                </div>
              </div>

              {/* Work area scrollable */}
              <div className="flex-1 overflow-y-auto py-4 space-y-4 pr-1 scrollbar-thin">
                
                {/* General Bio */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 bg-muted/20 border border-border p-3">
                  <div className="space-y-1">
                    <span className="text-[7px] text-muted-foreground block">MERCHANT OWNER</span>
                    <span className="text-[10px] font-black text-foreground flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-primary" /> {selectedVendor.ownerName}
                    </span>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[7px] text-muted-foreground block">PHONE</span>
                    <span className="text-[10px] font-black text-foreground flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-primary" /> {selectedVendor.phone}
                    </span>
                  </div>
                  <div className="space-y-1 border-t border-border/30 pt-2">
                    <span className="text-[7px] text-muted-foreground block">EMAIL</span>
                    <span className="text-[10px] font-black text-foreground flex items-center gap-1.5 lowercase">
                      <Mail className="w-3.5 h-3.5 text-primary shrink-0" /> {selectedVendor.email}
                    </span>
                  </div>
                  <div className="space-y-1 border-t border-border/30 pt-2">
                    <span className="text-[7px] text-muted-foreground block">PLATFORM REVENUE GENERATED</span>
                    <span className="text-[10px] font-black text-primary flex items-center gap-1">
                      <DollarSign className="w-3.5 h-3.5 text-primary" /> ₹{selectedVendor.revenueGenerated.toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>

                {/* EMPANELLED ECO PRODUCT CATALOG */}
                <div className="space-y-3">
                  <h4 className="text-[9px] font-black text-primary border-b border-border pb-1.5">
                    Empanelled Eco-Products Catalog ({vendorProducts.length})
                  </h4>

                  {vendorProducts.length === 0 ? (
                    <p className="text-[7.5px] text-muted-foreground">This vendor store has no active products in the voluntary marketplace registry.</p>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                      {vendorProducts.map(prod => (
                        <div key={prod.id} className="border border-border bg-card flex flex-col justify-between overflow-hidden relative">
                          <img 
                            src={prod.imageUrl} 
                            alt={prod.title} 
                            className="h-24 w-full object-cover border-b border-border grayscale hover:grayscale-0 transition-all duration-300" 
                          />
                          <div className="p-3 space-y-1.5">
                            <h5 className="text-[9.5px] font-black text-foreground uppercase tracking-wider leading-snug">{prod.title}</h5>
                            <div className="flex justify-between items-center text-[8.5px] font-black uppercase tracking-wider">
                              <span className="text-muted-foreground">Price</span>
                              <span className="text-primary font-black">₹{prod.price.toLocaleString('en-IN')}</span>
                            </div>
                            <div className="flex gap-1 flex-wrap pt-1">
                              {prod.ecoBadges.slice(0, 2).map((badge, bIdx) => (
                                <span key={bIdx} className="text-[6.5px] bg-primary/10 border border-primary/20 text-primary px-1">{badge}</span>
                              ))}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

              </div>

              {/* Action buttons footer */}
              <div className="h-16 border-t border-border pt-3 shrink-0 flex items-center justify-end gap-3.5">
                <button
                  onClick={() => handleToggleVerify(selectedVendor.id, selectedVendor.kycStatus)}
                  className={cn(
                    "px-4 h-9 border font-black uppercase tracking-wider text-[9px] flex items-center gap-1.5 active:scale-97 transition-all rounded-none",
                    selectedVendor.kycStatus === 'Approved' 
                      ? "border-destructive text-destructive bg-destructive/5 hover:bg-destructive/10" 
                      : "bg-primary text-primary-foreground border-primary hover:shadow-[0_0_8px_rgba(0,255,135,0.4)]"
                  )}
                >
                  {selectedVendor.kycStatus === 'Approved' ? (
                    <>
                      <Ban className="w-4 h-4 shrink-0" />
                      <span>Suspend Store Access</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4 text-primary-foreground shrink-0" />
                      <span>Verify & Activate Store</span>
                    </>
                  )}
                </button>
              </div>

            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
              <Store className="w-8 h-8 text-primary/30 opacity-60 mb-2.5 text-primary animate-pulse" />
              <h3 className="text-[10px] font-black uppercase tracking-widest text-foreground">Select Empanelled Store</h3>
              <p className="text-[8.5px] text-muted-foreground uppercase font-bold tracking-wider mt-1 max-w-xs leading-normal">
                Click a climate technology input merchant from the left list to review msme registration credentials, catalog items, and transaction logs.
              </p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

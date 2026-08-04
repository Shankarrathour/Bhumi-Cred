import React, { useState, useEffect, useMemo } from 'react';
import api from '../api/apiClient';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Store, 
  Search, 
  Check, 
  X, 
  ChevronLeft, 
  ChevronRight, 
  Eye, 
  ShieldCheck, 
  Clock, 
  Ban, 
  Phone, 
  Mail, 
  MapPin, 
  Building2, 
  RefreshCw, 
  Download, 
  CheckCircle2, 
  User
} from 'lucide-react';
import { cn } from '../utils/cn';

const PAGE_LIMIT = 15;

const STATUS_TABS = [
  { id: 'All', label: 'All Vendors' },
  { id: 'Active', label: 'Active' },
  { id: 'Pending', label: 'Pending Audit' },
  { id: 'Rejected', label: 'Rejected' },
  { id: 'Suspended', label: 'Suspended' },
];

export const VendorsManager: React.FC = () => {
  const [vendors, setVendors] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [activeTab, setActiveTab] = useState('All');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedVendor, setSelectedVendor] = useState<any | null>(null);

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  // Fetch vendors on page or search change
  useEffect(() => {
    fetchVendors();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, debouncedSearch]);

  const fetchVendors = async () => {
    setIsLoading(true);
    try {
      const res = await api.get('/admin/vendors', {
        params: { page, limit: PAGE_LIMIT, search: debouncedSearch || undefined },
      });
      const items = res.data.items ?? [];
      setVendors(items);
      setTotalPages(res.data.total_pages ?? 1);
      setTotal(res.data.total ?? items.length);

      // Keep drawer selection synced if open
      if (selectedVendor) {
        const updated = items.find((v: any) => v.id === selectedVendor.id);
        if (updated) setSelectedVendor(updated);
      }
    } catch (err) {
      toast.error('Failed to fetch vendors list');
    } finally {
      setIsLoading(false);
    }
  };

  const updateStatus = async (id: string, newStatus: string) => {
    try {
      await api.put(`/admin/vendors/${id}/status?status=${newStatus}`);
      toast.success(`Vendor store status updated to ${newStatus}`);
      fetchVendors();
    } catch (err) {
      toast.error('Failed to update vendor status');
    }
  };

  // Filter vendors locally by status tab if API returned all
  const filteredVendors = useMemo(() => {
    if (activeTab === 'All') return vendors;
    return vendors.filter(v => (v.status || 'Pending').toLowerCase() === activeTab.toLowerCase());
  }, [vendors, activeTab]);

  // KPI Metrics calculations
  const stats = useMemo(() => {
    const active = vendors.filter(v => (v.status || '').toLowerCase() === 'active').length;
    const pending = vendors.filter(v => (v.status || '').toLowerCase() === 'pending').length;
    const rejectedOrSuspended = vendors.filter(v => ['rejected', 'suspended'].includes((v.status || '').toLowerCase())).length;
    return {
      total: total || vendors.length,
      active,
      pending,
      rejectedOrSuspended
    };
  }, [vendors, total]);

  const handleExportCSV = () => {
    if (filteredVendors.length === 0) {
      toast.error('No vendors to export');
      return;
    }
    const headers = ["Vendor ID", "Store Name", "Owner Name", "Phone", "GST Number", "Status", "Address"];
    const rows = filteredVendors.map(v => [
      v.vendor_id || v.id || '',
      v.store_name || v.business_name || '',
      v.name || '',
      v.phone || '',
      v.gst_number || 'N/A',
      v.status || 'Pending',
      `"${(v.address || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `BhumiCred_Vendors_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Vendors directory exported to CSV');
  };

  return (
    <div className="w-full space-y-6 pb-12 text-foreground select-none">

      {/* ── Page Header ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/80 pb-5">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-primary/10 border border-primary/20 rounded-full text-[11px] font-semibold text-primary mb-2">
            <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
            BHUMICRED VENDOR NETWORK: SYNCHRONIZED
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Store className="w-6 h-6 text-primary" />
            VENDORS MANAGER
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            Verify green-marketplace merchants, audit seller credentials, and control platform store access.
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start md:self-auto">
          <button
            onClick={fetchVendors}
            disabled={isLoading}
            className="btn-outline text-xs px-3 py-1.5 flex items-center gap-1.5 hover:border-primary/40 transition-colors"
            title="Refresh Vendors List"
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

      {/* ── KPI Summary Stats ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Total Vendors */}
        <div className="ent-card p-4 flex items-center justify-between">
          <div>
            <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Total Vendors</p>
            <h3 className="text-2xl font-bold text-foreground mt-1">{stats.total}</h3>
            <p className="text-[10px] text-muted-foreground mt-0.5">Empanelled merchants</p>
          </div>
          <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
            <Store className="w-5 h-5" />
          </div>
        </div>

        {/* Active Stores */}
        <div className="ent-card p-4 flex items-center justify-between">
          <div>
            <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Active Stores</p>
            <h3 className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">{stats.active}</h3>
            <p className="text-[10px] text-emerald-600/80 dark:text-emerald-400/80 mt-0.5 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" /> Verified & Active
            </p>
          </div>
          <div className="w-11 h-11 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
            <ShieldCheck className="w-5 h-5" />
          </div>
        </div>

        {/* Pending Audit */}
        <div className="ent-card p-4 flex items-center justify-between">
          <div>
            <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Pending Audit</p>
            <h3 className="text-2xl font-bold text-amber-600 dark:text-amber-400 mt-1">{stats.pending}</h3>
            <p className="text-[10px] text-amber-600/80 dark:text-amber-400/80 mt-0.5 flex items-center gap-1">
              <Clock className="w-3 h-3 animate-pulse" /> Action Needed
            </p>
          </div>
          <div className="w-11 h-11 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-600 dark:text-amber-400">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        {/* Rejected / Suspended */}
        <div className="ent-card p-4 flex items-center justify-between">
          <div>
            <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Restricted Access</p>
            <h3 className="text-2xl font-bold text-rose-600 dark:text-rose-400 mt-1">{stats.rejectedOrSuspended}</h3>
            <p className="text-[10px] text-rose-600/80 dark:text-rose-400/80 mt-0.5">Rejected or Suspended</p>
          </div>
          <div className="w-11 h-11 rounded-xl bg-rose-500/10 flex items-center justify-center text-rose-600 dark:text-rose-400">
            <Ban className="w-5 h-5" />
          </div>
        </div>

      </div>

      {/* ── Filter Bar & Search ── */}
      <div className="ent-card p-3 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        
        {/* Status Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
          {STATUS_TABS.map(tab => {
            const count = tab.id === 'All' 
              ? vendors.length 
              : vendors.filter(v => (v.status || 'Pending').toLowerCase() === tab.id.toLowerCase()).length;

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

        {/* Search Bar */}
        <div className="relative w-full md:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search store, owner, phone..."
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

      {/* ── Vendors Data Table ── */}
      <div className="ent-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-muted/40 border-b border-border text-[11px] font-semibold uppercase text-muted-foreground tracking-wider">
              <tr>
                <th className="py-3 px-4">Vendor ID</th>
                <th className="py-3 px-4">Store & Owner</th>
                <th className="py-3 px-4">Contact Info</th>
                <th className="py-3 px-4">GSTIN Number</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-border/60">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, idx) => (
                  <tr key={idx} className="animate-pulse">
                    <td className="py-4 px-4"><div className="h-4 w-16 bg-muted rounded" /></td>
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-muted rounded-xl" />
                        <div className="space-y-1.5">
                          <div className="h-3.5 w-32 bg-muted rounded" />
                          <div className="h-2.5 w-20 bg-muted rounded" />
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-4"><div className="h-3.5 w-28 bg-muted rounded" /></td>
                    <td className="py-4 px-4"><div className="h-3.5 w-24 bg-muted rounded" /></td>
                    <td className="py-4 px-4"><div className="h-5 w-16 bg-muted rounded-full" /></td>
                    <td className="py-4 px-4 text-right"><div className="h-7 w-20 bg-muted rounded ml-auto" /></td>
                  </tr>
                ))
              ) : filteredVendors.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-muted-foreground">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Store className="w-8 h-8 text-muted-foreground/40" />
                      <p className="font-semibold text-foreground">No Vendors Found</p>
                      <p className="text-xs text-muted-foreground">Try clearing search filters or checking other status tabs.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredVendors.map((vendor) => {
                  const status = (vendor.status || 'Pending').toLowerCase();
                  const vendorPublicId = vendor.vendor_id || vendor.id?.substring(0, 8) || 'N/A';
                  const storeName = vendor.store_name || vendor.business_name || 'Incomplete Profile';

                  return (
                    <tr 
                      key={vendor.id} 
                      className="hover:bg-muted/30 transition-colors group cursor-pointer"
                      onClick={() => setSelectedVendor(vendor)}
                    >
                      {/* Vendor ID */}
                      <td className="py-3.5 px-4 font-mono font-bold text-primary text-xs">
                        <span className="px-2 py-0.5 bg-primary/10 border border-primary/20 rounded-md">
                          {vendorPublicId}
                        </span>
                      </td>

                      {/* Store & Owner */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20 flex items-center justify-center text-primary font-bold text-sm shrink-0 uppercase shadow-xs">
                            {storeName.charAt(0)}
                          </div>
                          <div>
                            <p className="font-semibold text-foreground text-xs group-hover:text-primary transition-colors">
                              {storeName}
                            </p>
                            <p className="text-[11px] text-muted-foreground flex items-center gap-1 mt-0.5">
                              <User className="w-3 h-3 text-muted-foreground/60" />
                              {vendor.name || 'Merchant Owner'}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Contact Info */}
                      <td className="py-3.5 px-4">
                        <div className="space-y-0.5 text-xs">
                          <p className="text-foreground flex items-center gap-1.5">
                            <Phone className="w-3 h-3 text-primary shrink-0" />
                            <span>{vendor.phone || 'N/A'}</span>
                          </p>
                          <p className="text-[11px] text-muted-foreground flex items-center gap-1.5 truncate max-w-[200px]">
                            <MapPin className="w-3 h-3 text-muted-foreground/60 shrink-0" />
                            <span>{vendor.address || vendor.district || vendor.state || 'No Address Recorded'}</span>
                          </p>
                        </div>
                      </td>

                      {/* GST Number */}
                      <td className="py-3.5 px-4 font-mono text-xs text-muted-foreground">
                        {vendor.gst_number ? (
                          <span className="px-2 py-0.5 bg-muted border border-border rounded text-[11px] font-medium text-foreground">
                            {vendor.gst_number}
                          </span>
                        ) : (
                          <span className="text-muted-foreground/60">N/A</span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4">
                        <span className={cn(
                          "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border capitalize",
                          status === 'active' 
                            ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20 dark:text-emerald-400"
                            : status === 'pending'
                            ? "bg-amber-500/10 text-amber-600 border-amber-500/20 dark:text-amber-400"
                            : "bg-rose-500/10 text-rose-600 border-rose-500/20 dark:text-rose-400"
                        )}>
                          <span className={cn(
                            "w-1.5 h-1.5 rounded-full",
                            status === 'active' ? "bg-emerald-500" : status === 'pending' ? "bg-amber-500 animate-pulse" : "bg-rose-500"
                          )} />
                          {vendor.status || 'Pending'}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1.5">
                          
                          {/* View Details */}
                          <button
                            onClick={() => setSelectedVendor(vendor)}
                            className="p-1.5 rounded-lg border border-border text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                            title="View Store Dossier"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>

                          {/* Approve Action */}
                          {status !== 'active' && (
                            <button
                              onClick={() => updateStatus(vendor.id, 'Active')}
                              className="p-1.5 rounded-lg border border-emerald-500/30 text-emerald-600 hover:bg-emerald-500/10 transition-colors"
                              title="Approve & Activate Store"
                            >
                              <Check className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {/* Reject Action */}
                          {status !== 'rejected' && (
                            <button
                              onClick={() => updateStatus(vendor.id, 'Rejected')}
                              className="p-1.5 rounded-lg border border-rose-500/30 text-rose-600 hover:bg-rose-500/10 transition-colors"
                              title="Reject Vendor"
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

        {/* Pagination Footer */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-border flex items-center justify-between gap-4">
            <p className="text-xs text-muted-foreground">
              Showing page <span className="font-semibold text-foreground">{page}</span> of <span className="font-semibold text-foreground">{totalPages}</span> — Total <span className="font-semibold text-foreground">{total}</span> vendors
            </p>
            
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="btn-outline h-8 px-2.5 text-xs disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Prev</span>
              </button>

              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="btn-outline h-8 px-2.5 text-xs disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <span>Next</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── Slide-Over Vendor Dossier Drawer ── */}
      <AnimatePresence>
        {selectedVendor && (
          <div className="fixed inset-0 z-50 flex justify-end bg-black/50 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, x: 300 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 300 }}
              transition={{ duration: 0.2 }}
              className="w-full max-w-lg bg-card border-l border-border h-full overflow-y-auto flex flex-col shadow-2xl"
            >
              {/* Drawer Header */}
              <div className="p-5 border-b border-border flex items-center justify-between sticky top-0 bg-card z-10">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-bold text-foreground">
                      {selectedVendor.store_name || selectedVendor.business_name || 'Store Dossier'}
                    </h2>
                    <span className={cn(
                      "px-2 py-0.5 rounded-full text-[10px] font-semibold border capitalize",
                      selectedVendor.status === 'Active' ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" :
                      selectedVendor.status === 'Pending' ? "bg-amber-500/10 text-amber-600 border-amber-500/20" :
                      "bg-rose-500/10 text-rose-600 border-rose-500/20"
                    )}>
                      {selectedVendor.status || 'Pending'}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5 font-mono">
                    ID: {selectedVendor.vendor_id || selectedVendor.id}
                  </p>
                </div>

                <button
                  onClick={() => setSelectedVendor(null)}
                  className="p-1.5 rounded-lg border border-border text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Drawer Body */}
              <div className="p-5 space-y-6 flex-1">
                
                {/* Store Profile Header */}
                <div className="ent-card p-4 flex items-center gap-4 bg-muted/20">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20 flex items-center justify-center text-primary font-bold text-xl uppercase shrink-0">
                    {(selectedVendor.store_name || 'V').charAt(0)}
                  </div>
                  <div className="space-y-1">
                    <h4 className="font-bold text-foreground text-sm">
                      {selectedVendor.store_name || selectedVendor.business_name || 'Empanelled Merchant'}
                    </h4>
                    <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-primary" />
                      {selectedVendor.name || 'Owner Name Unspecified'}
                    </p>
                    <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-primary" />
                      {selectedVendor.phone}
                    </p>
                  </div>
                </div>

                {/* Business Information */}
                <div className="space-y-3">
                  <h3 className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-1.5">
                    <Building2 className="w-4 h-4 text-primary" />
                    Business & Compliance Details
                  </h3>
                  
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div className="ent-card p-3 space-y-1">
                      <span className="text-[10px] text-muted-foreground uppercase">GSTIN Number</span>
                      <p className="font-mono font-semibold text-foreground">{selectedVendor.gst_number || 'N/A'}</p>
                    </div>

                    <div className="ent-card p-3 space-y-1">
                      <span className="text-[10px] text-muted-foreground uppercase">Wallet Balance</span>
                      <p className="font-semibold text-emerald-600 dark:text-emerald-400">
                        ₹{(selectedVendor.wallet_balance || 0).toLocaleString('en-IN')}
                      </p>
                    </div>

                    <div className="ent-card p-3 space-y-1 col-span-2">
                      <span className="text-[10px] text-muted-foreground uppercase">Email Address</span>
                      <p className="font-medium text-foreground flex items-center gap-1.5">
                        <Mail className="w-3.5 h-3.5 text-primary" />
                        {selectedVendor.email || 'No email registered'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Location Information */}
                <div className="space-y-3">
                  <h3 className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-1.5">
                    <MapPin className="w-4 h-4 text-primary" />
                    Registered Location
                  </h3>

                  <div className="ent-card p-3 space-y-2 text-xs">
                    <p className="text-foreground">{selectedVendor.address || 'No complete street address specified'}</p>
                    <div className="pt-2 border-t border-border grid grid-cols-2 gap-2 text-[11px] text-muted-foreground">
                      <div><span className="font-medium text-foreground">District:</span> {selectedVendor.district || 'N/A'}</div>
                      <div><span className="font-medium text-foreground">State:</span> {selectedVendor.state || 'N/A'}</div>
                      <div><span className="font-medium text-foreground">Pincode:</span> {selectedVendor.pincode || 'N/A'}</div>
                    </div>
                  </div>
                </div>

              </div>

              {/* Drawer Footer Actions */}
              <div className="p-4 border-t border-border bg-muted/20 flex items-center justify-end gap-2.5 sticky bottom-0">
                
                {selectedVendor.status !== 'Active' && (
                  <button
                    onClick={() => {
                      updateStatus(selectedVendor.id, 'Active');
                      setSelectedVendor((prev: any) => prev ? { ...prev, status: 'Active' } : null);
                    }}
                    className="btn-primary text-xs px-4 py-2 flex items-center gap-1.5"
                  >
                    <Check className="w-4 h-4" />
                    <span>Activate Store</span>
                  </button>
                )}

                {selectedVendor.status !== 'Rejected' && (
                  <button
                    onClick={() => {
                      updateStatus(selectedVendor.id, 'Rejected');
                      setSelectedVendor((prev: any) => prev ? { ...prev, status: 'Rejected' } : null);
                    }}
                    className="btn-outline border-rose-500/30 text-rose-600 hover:bg-rose-500/10 text-xs px-4 py-2 flex items-center gap-1.5"
                  >
                    <X className="w-4 h-4" />
                    <span>Reject Application</span>
                  </button>
                )}

                {selectedVendor.status !== 'Suspended' && (
                  <button
                    onClick={() => {
                      updateStatus(selectedVendor.id, 'Suspended');
                      setSelectedVendor((prev: any) => prev ? { ...prev, status: 'Suspended' } : null);
                    }}
                    className="btn-outline border-amber-500/30 text-amber-600 hover:bg-amber-500/10 text-xs px-4 py-2 flex items-center gap-1.5"
                  >
                    <Ban className="w-4 h-4" />
                    <span>Suspend Access</span>
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

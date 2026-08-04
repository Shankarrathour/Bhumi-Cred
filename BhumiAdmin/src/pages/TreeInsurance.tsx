import React, { useState, useEffect } from 'react';
import {
  TreePine,
  CheckCircle2,
  XCircle,
  Eye,
  ChevronLeft,
  ChevronRight,
  Search,
  RefreshCw,
  User,
  MapPin
} from 'lucide-react';
import { cn } from '../utils/cn';
import toast from 'react-hot-toast';
import adminApi from '../api/apiClient';

const PAGE_LIMIT = 10;

export const TreeInsurancePage: React.FC = () => {
  const [registrations, setRegistrations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const [selectedRegistration, setSelectedRegistration] = useState<any>(null);
  const [adminRemarks, setAdminRemarks] = useState('');
  const [previewPhoto, setPreviewPhoto] = useState<string | null>(null);

  // Debounce search before it hits the backend, and reset to page 1 whenever it changes.
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    fetchRegistrations(page, debouncedSearch);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, debouncedSearch]);

  const fetchRegistrations = async (pageArg: number, searchArg: string) => {
    try {
      setLoading(true);
      setError('');

      const skip = (pageArg - 1) * PAGE_LIMIT;
      const res = await adminApi.get('/admin/tree-registrations', {
        params: { skip, limit: PAGE_LIMIT, search: searchArg || undefined },
      });

      if (res.data.success) {
        const data = res.data.data || [];
        setRegistrations(data);
        setTotalPages(res.data.meta?.total_pages ?? 1);
        setTotal(res.data.meta?.total ?? 0);

        setSelectedRegistration((prev: any) => {
          if (!prev) return prev;
          return data.find((r: any) => r.id === prev.id) || null;
        });
      } else {
        setError(res.data.message || 'Failed to fetch tree registrations');
      }
    } catch (err: any) {
      console.error(err);
      setError('Network error loading tree registrations');
      toast.error('Failed to load tree registrations');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!selectedRegistration) return;
    try {
      const res = await adminApi.patch(`/admin/tree-registrations/${selectedRegistration.id}/approve`, { remarks: adminRemarks || 'Approved by admin' });
      if (res.data.success) {
        toast.success('Registration approved');
        setAdminRemarks('');
        fetchRegistrations(page, debouncedSearch);
      } else {
        toast.error(res.data.message || 'Failed to approve');
      }
    } catch (err) {
      toast.error('Network error while approving');
    }
  };

  const handleReject = async () => {
    if (!selectedRegistration) return;
    try {
      const res = await adminApi.patch(`/admin/tree-registrations/${selectedRegistration.id}/reject`, { remarks: adminRemarks || 'Rejected by admin' });
      if (res.data.success) {
        toast.success('Registration rejected');
        setAdminRemarks('');
        fetchRegistrations(page, debouncedSearch);
      } else {
        toast.error(res.data.message || 'Failed to reject');
      }
    } catch (err) {
      toast.error('Network error while rejecting');
    }
  };

  return (
    <div className="pb-12 text-foreground font-sans space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2.5">
            <TreePine className="w-6 h-6 text-primary" /> Tree Insurance Registry
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Review tree insurance registrations and GIS photo audits across regions.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1.5fr_1fr] gap-6">
        
        {/* LEFT COLUMN */}
        <div className="space-y-4">
          {/* SEARCH & REFRESH BAR */}
          <div className="bg-card border border-border rounded-xl p-3 shadow-sm flex flex-col sm:flex-row gap-3 items-center justify-between">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input 
                type="text" 
                placeholder="Search by farmer name, mobile or species..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-background border border-border rounded-lg pl-10 pr-4 py-2 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all font-sans"
              />
            </div>
            <button
              onClick={() => fetchRegistrations(page, debouncedSearch)}
              className="h-9 px-4 rounded-lg bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 text-xs font-semibold flex items-center gap-2 transition-all font-sans shrink-0 cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Refresh
            </button>
          </div>

          {/* REGISTRATION CARDS */}
          {loading ? (
            <div className="flex flex-col justify-center items-center h-56 bg-card border border-border rounded-xl shadow-sm gap-3">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              <span className="text-xs text-muted-foreground font-medium">Loading registrations...</span>
            </div>
          ) : error ? (
            <div className="bg-destructive/10 border border-destructive/20 text-destructive p-4 rounded-xl font-medium text-center text-sm">
              {error}
            </div>
          ) : registrations.length === 0 ? (
            <div className="bg-card border border-border rounded-xl p-12 text-center shadow-sm">
              <TreePine className="w-12 h-12 text-muted-foreground/40 mx-auto mb-3" />
              <h3 className="text-base font-bold text-foreground">No Registrations Found</h3>
              <p className="text-muted-foreground text-xs mt-1">No tree registrations match your search query.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {registrations.map((reg) => (
                <div 
                  key={reg.id} 
                  className={cn(
                    "bg-card border rounded-xl p-4 transition-all shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 relative hover:shadow-md",
                    selectedRegistration?.id === reg.id ? "border-primary ring-1 ring-primary/20 bg-primary/5" : "border-border hover:border-primary/40"
                  )}
                >
                  <div className="flex-1 space-y-1.5">
                    <div className="flex items-center gap-2.5">
                      <span className={cn(
                        "px-2.5 py-0.5 text-[11px] font-semibold rounded-full border tracking-wide",
                        reg.tree_details?.status?.toUpperCase() === 'APPROVED' ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-400 dark:border-emerald-800" :
                        reg.tree_details?.status?.toUpperCase() === 'REJECTED' ? "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/50 dark:text-rose-400 dark:border-rose-800" :
                        "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/50 dark:text-amber-400 dark:border-amber-800"
                      )}>
                        {reg.tree_details?.status}
                      </span>
                      <span className="text-xs text-muted-foreground font-mono">
                        Date: {reg.created_at ? new Date(reg.created_at).toLocaleDateString('en-GB') : '17/07/2026'}
                      </span>
                    </div>
                    
                    <div className="text-sm font-bold text-foreground">
                      {reg.tree_details?.tree_name} ({reg.tree_details?.tree_species}) • {reg.tree_details?.tree_count} Trees
                    </div>
                    <div className="text-xs text-muted-foreground flex items-center gap-1.5 flex-wrap">
                      <User className="w-3.5 h-3.5 text-muted-foreground/70" />
                      <span className="font-medium text-foreground">{reg.farmer_details?.full_name || 'Unknown Farmer'}</span>
                      <span>•</span>
                      <span>{reg.farmer_details?.mobile || 'N/A'}</span>
                      {reg.farmer_details?.village && (
                        <>
                          <span>•</span>
                          <MapPin className="w-3.5 h-3.5 text-muted-foreground/70" />
                          <span>{reg.farmer_details.village}{reg.farmer_details.district ? `, ${reg.farmer_details.district}` : ''}</span>
                        </>
                      )}
                    </div>
                  </div>

                  <button 
                    onClick={() => {
                      setSelectedRegistration(reg);
                      setAdminRemarks('');
                    }}
                    className="h-8 px-3.5 rounded-lg bg-primary text-primary-foreground font-semibold text-xs flex items-center gap-1.5 hover:bg-primary/90 transition-all shrink-0 cursor-pointer shadow-sm"
                  >
                    <Eye className="w-3.5 h-3.5" /> View
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* PAGINATION */}
          {!loading && !error && totalPages > 1 && (
            <div className="flex items-center justify-between gap-4 bg-card border border-border rounded-xl px-4 py-3 shadow-sm">
              <p className="text-xs text-muted-foreground font-medium">
                Page {page} of {totalPages} — {total} registrations
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  className="h-8 px-3 rounded-lg border border-border text-foreground hover:bg-muted transition-all disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-1 text-xs font-semibold"
                >
                  <ChevronLeft className="w-3.5 h-3.5" /> Prev
                </button>
                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                  className="h-8 px-3 rounded-lg border border-border text-foreground hover:bg-muted transition-all disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-1 text-xs font-semibold"
                >
                  Next <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* RIGHT COLUMN — REVIEW DOSSIER */}
        <div>
          <div className="bg-card border border-border rounded-2xl p-6 sticky top-6 shadow-sm space-y-6">
            {!selectedRegistration ? (
              <div className="flex flex-col items-center justify-center h-[420px] text-muted-foreground text-center p-6">
                <TreePine className="w-12 h-12 mb-3 text-muted-foreground/30" />
                <h4 className="text-base font-bold text-foreground">Select a Registration</h4>
                <p className="text-xs text-muted-foreground mt-1 max-w-xs">
                  Choose a tree registration from the list to review details, inspect photos, and process verification.
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="border-b border-border pb-4">
                  <h2 className="text-xs font-bold text-primary uppercase tracking-wider mb-1">Registration Review</h2>
                  <div className="text-xl font-bold text-foreground">
                    {selectedRegistration.farmer_details?.full_name || 'Unknown Farmer'}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1 flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-muted-foreground/70" />
                    <span>{selectedRegistration.farmer_details?.mobile || 'N/A'}</span>
                  </div>
                </div>

                {/* Details Metrics Grid */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-muted/40 border border-border rounded-xl p-3">
                    <div className="text-xs text-muted-foreground">Tree Species</div>
                    <div className="text-sm font-bold text-foreground mt-0.5">{selectedRegistration.tree_details?.tree_name} / {selectedRegistration.tree_details?.tree_species}</div>
                  </div>
                  <div className="bg-muted/40 border border-border rounded-xl p-3">
                    <div className="text-xs text-muted-foreground">Tree Count</div>
                    <div className="text-sm font-bold text-foreground mt-0.5">{selectedRegistration.tree_details?.tree_count} Trees</div>
                  </div>
                  <div className="bg-muted/40 border border-border rounded-xl p-3">
                    <div className="text-xs text-muted-foreground">Plantation Year</div>
                    <div className="text-sm font-bold text-foreground mt-0.5">{selectedRegistration.tree_details?.plantation_year || '2026'}</div>
                  </div>
                  <div className="bg-muted/40 border border-border rounded-xl p-3">
                    <div className="text-xs text-muted-foreground">Status</div>
                    <div className="text-sm font-bold text-foreground mt-0.5 capitalize">{selectedRegistration.tree_details?.status?.toLowerCase()}</div>
                  </div>
                </div>

                {/* Tree Health Photos */}
                <div>
                  <h3 className="text-xs font-bold text-foreground uppercase tracking-wider mb-3">Tree Health Photos</h3>
                  <div className="grid grid-cols-2 gap-3">
                    {[0, 1, 2, 3].map((index) => {
                      const photoUrl = selectedRegistration.tree_details?.photos?.[index];
                      return (
                        <div key={index} className="border border-border rounded-xl overflow-hidden flex flex-col h-32 relative bg-muted/30 group">
                          {photoUrl ? (
                            <img src={photoUrl} alt={`Tree ${index + 1}`} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200" />
                          ) : (
                            <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground gap-1.5">
                              <TreePine className="w-5 h-5 opacity-40" />
                              <span className="text-xs font-medium">Photo {index + 1}</span>
                            </div>
                          )}
                          <button onClick={() => photoUrl && setPreviewPhoto(photoUrl)} className="absolute bottom-0 left-0 right-0 border-t border-border bg-card/90 backdrop-blur-sm text-primary text-xs py-1.5 flex items-center justify-center gap-1 hover:bg-primary/10 transition-colors cursor-pointer font-semibold">
                            <Eye className="w-3.5 h-3.5" /> View Photo
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {selectedRegistration.tree_details?.status?.toUpperCase() === 'PENDING' && (
                  <div className="space-y-4 pt-2">
                    <div>
                      <h3 className="text-xs font-bold text-foreground uppercase tracking-wider mb-2">Admin Remarks (Optional)</h3>
                      <textarea
                        value={adminRemarks}
                        onChange={(e) => setAdminRemarks(e.target.value)}
                        placeholder="Enter remarks for approval or rejection..."
                        className="w-full bg-background border border-border rounded-xl p-3 text-foreground text-xs outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 resize-none h-20 placeholder:text-muted-foreground font-sans"
                      />
                    </div>

                    <div className="flex gap-3">
                      <button 
                        onClick={handleReject}
                        className="flex-1 h-10 rounded-xl border border-destructive/30 text-destructive font-bold text-xs hover:bg-destructive/10 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <XCircle className="w-4 h-4" /> Reject
                      </button>
                      <button 
                        onClick={handleApprove}
                        className="flex-1 h-10 rounded-xl bg-primary text-primary-foreground font-bold text-xs hover:bg-primary/90 transition-all flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
                      >
                        <CheckCircle2 className="w-4 h-4" /> Approve
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

      </div>


      {/* PHOTO PREVIEW MODAL */}
      {previewPhoto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4" onClick={() => setPreviewPhoto(null)}>
          <div className="relative max-w-4xl max-h-[90vh] w-full flex flex-col items-center justify-center" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setPreviewPhoto(null)} className="absolute -top-12 right-0 text-white/70 hover:text-white transition-colors cursor-pointer">
              <XCircle className="w-8 h-8" />
            </button>
            <img src={previewPhoto} alt="Preview" className="max-w-full max-h-[85vh] object-contain border border-white/10 rounded-xl shadow-2xl" />
          </div>
        </div>
      )}
    </div>
  );
};



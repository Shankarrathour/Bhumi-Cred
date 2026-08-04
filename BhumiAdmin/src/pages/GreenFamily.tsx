import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Eye,
  ChevronLeft,
  ChevronRight,
  Search,
  RefreshCw,
  Download,
  TreePine,
  User,
  MapPin
} from 'lucide-react';
import { cn } from '../utils/cn';
import toast from 'react-hot-toast';
import adminApi from '../api/apiClient';

const PAGE_LIMIT = 10;

interface TreeDetail {
  species: string;
  age: string;
  health: string;
  hasPhoto: boolean;
  photo_url?: string | null;
}

interface GreenFamilyCover {
  id: string;
  farmer_id: string;
  cluster_size: number;
  plantation_configuration: string;
  plan_name: string;
  premium_amount: number;
  cover_amount: number;
  status: string;
  created_at: string;
  trees_details: TreeDetail[];
  farmer_details?: {
    full_name?: string;
    mobile?: string;
    village?: string;
    district?: string;
  };
}

export const GreenFamilyPage: React.FC = () => {
  const [covers, setCovers] = useState<GreenFamilyCover[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const [selectedCover, setSelectedCover] = useState<GreenFamilyCover | null>(null);

  // Full-size photo gallery/lightbox — supports any number of uploaded photos.
  const [galleryPhotos, setGalleryPhotos] = useState<string[]>([]);
  const [galleryIndex, setGalleryIndex] = useState(0);
  const [galleryOpen, setGalleryOpen] = useState(false);

  // Debounce search before it hits the backend, and reset to page 1 whenever it changes.
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    fetchData(page, debouncedSearch);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, debouncedSearch]);

  const fetchData = async (pageArg: number, searchArg: string) => {
    try {
      setLoading(true);
      setError('');

      const skip = (pageArg - 1) * PAGE_LIMIT;
      const res = await adminApi.get('/admin/green-family', {
        params: { skip, limit: PAGE_LIMIT, search: searchArg || undefined },
      });

      if (res.data && res.data.success !== false) {
        const coversList: GreenFamilyCover[] = res.data.data || [];
        setCovers(coversList);
        setTotalPages(res.data.meta?.total_pages ?? 1);
        setTotal(res.data.meta?.total ?? 0);

        setSelectedCover(prev => {
          if (!prev) return prev;
          return coversList.find(r => r.id === prev.id) || null;
        });
      } else {
        setError(res.data.message || 'Failed to fetch green family covers');
        toast.error('Failed to load data');
      }
    } catch (err: any) {
      console.error('Covers API Error:', err);
      setError('Error fetching covers: ' + (err.message || String(err)));
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!selectedCover) return;
    try {
      await adminApi.put(`/admin/green-family/${selectedCover.id}/status`, { status: 'Verified' });
      toast.success('Status updated to Verified');
      fetchData(page, debouncedSearch);
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Failed to update status');
    }
  };

  const handleReject = async () => {
    if (!selectedCover) return;
    try {
      await adminApi.put(`/admin/green-family/${selectedCover.id}/status`, { status: 'Rejected' });
      toast.success('Status updated to Rejected');
      fetchData(page, debouncedSearch);
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Failed to update status');
    }
  };

  // A cover's own trees_details carry its actual uploaded photos — the source of truth.
  const getPhotos = (cover: GreenFamilyCover): string[] =>
    (cover.trees_details || [])
      .map(t => t.photo_url)
      .filter((url): url is string => !!url);

  const openGallery = (photos: string[], index: number) => {
    setGalleryPhotos(photos);
    setGalleryIndex(index);
    setGalleryOpen(true);
  };

  const showNextPhoto = () => setGalleryIndex(i => (i + 1) % galleryPhotos.length);
  const showPrevPhoto = () => setGalleryIndex(i => (i - 1 + galleryPhotos.length) % galleryPhotos.length);

  const selectedPhotos = selectedCover ? getPhotos(selectedCover) : [];
  const visiblePhotoTiles = Math.min(4, Math.max(selectedPhotos.length, 4));

  return (
    <div className="pb-12 text-foreground font-sans space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2.5">
            <ShieldCheck className="w-6 h-6 text-primary" /> Green Family Covers
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Monitor and manage green family insurance applications across regions.
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
                placeholder="Search by farmer name, mobile or status..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-background border border-border rounded-lg pl-10 pr-4 py-2 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all font-sans"
              />
            </div>
            <button
              onClick={() => fetchData(page, debouncedSearch)}
              className="h-9 px-4 rounded-lg bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 text-xs font-semibold flex items-center gap-2 transition-all font-sans shrink-0 cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Refresh
            </button>
          </div>

          {/* COVER CARDS LIST */}
          {loading ? (
            <div className="flex flex-col justify-center items-center h-56 bg-card border border-border rounded-xl shadow-sm gap-3">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              <span className="text-xs text-muted-foreground font-medium">Loading applications...</span>
            </div>
          ) : error ? (
            <div className="bg-destructive/10 border border-destructive/20 text-destructive p-4 rounded-xl font-medium text-center text-sm">
              {error}
            </div>
          ) : covers.length === 0 ? (
            <div className="bg-card border border-border rounded-xl p-12 text-center shadow-sm">
              <ShieldCheck className="w-12 h-12 text-muted-foreground/40 mx-auto mb-3" />
              <h3 className="text-base font-bold text-foreground">No Applications Found</h3>
              <p className="text-muted-foreground text-xs mt-1">No green family applications match your search query.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {covers.map((cover) => (
                <div
                  key={cover.id}
                  className={cn(
                    "bg-card border rounded-xl p-4 transition-all shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 relative hover:shadow-md",
                    selectedCover?.id === cover.id ? "border-primary ring-1 ring-primary/20 bg-primary/5" : "border-border hover:border-primary/40"
                  )}
                >
                  <div className="flex-1 space-y-1.5">
                    <div className="flex items-center gap-2.5">
                      <span className={cn(
                        "px-2.5 py-0.5 text-[11px] font-semibold rounded-full border tracking-wide",
                        cover.status?.toUpperCase() === 'VERIFIED' ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-400 dark:border-emerald-800" :
                        cover.status?.toUpperCase() === 'REJECTED' ? "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/50 dark:text-rose-400 dark:border-rose-800" :
                        "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/50 dark:text-amber-400 dark:border-amber-800"
                      )}>
                        {cover.status}
                      </span>
                      <span className="text-xs text-muted-foreground font-mono">
                        Date: {cover.created_at ? new Date(cover.created_at).toLocaleDateString('en-GB') : '17/07/2026'}
                      </span>
                    </div>

                    <div className="text-sm font-bold text-foreground">
                      {cover.plan_name} ({cover.plantation_configuration}) • {cover.cluster_size} Trees
                    </div>
                    
                    <div className="text-xs text-muted-foreground flex items-center gap-1.5 flex-wrap">
                      <User className="w-3.5 h-3.5 text-muted-foreground/70" />
                      <span className="font-medium text-foreground">{cover.farmer_details?.full_name || 'Unknown Farmer'}</span>
                      <span>•</span>
                      <span>{cover.farmer_details?.mobile || 'N/A'}</span>
                    </div>
                  </div>

                  <button
                    onClick={() => setSelectedCover(cover)}
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
                Page {page} of {totalPages} — {total} applications
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
            {!selectedCover ? (
              <div className="flex flex-col items-center justify-center h-[420px] text-muted-foreground text-center p-6">
                <ShieldCheck className="w-12 h-12 mb-3 text-muted-foreground/30" />
                <h4 className="text-base font-bold text-foreground">Select an Application</h4>
                <p className="text-xs text-muted-foreground mt-1 max-w-xs">
                  Choose a green family cover application from the list to review details, inspect photos, and verify status.
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="border-b border-border pb-4">
                  <h2 className="text-xs font-bold text-primary uppercase tracking-wider mb-1">Application Review</h2>
                  <div className="text-xl font-bold text-foreground">
                    {selectedCover.farmer_details?.full_name || 'Unknown Farmer'}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1 flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-muted-foreground/70" />
                    <span>{selectedCover.farmer_details?.mobile || 'N/A'}</span>
                    {selectedCover.farmer_details?.village && (
                      <>
                        <span>•</span>
                        <MapPin className="w-3.5 h-3.5 text-muted-foreground/70" />
                        <span>{selectedCover.farmer_details.village}{selectedCover.farmer_details.district ? `, ${selectedCover.farmer_details.district}` : ''}</span>
                      </>
                    )}
                  </div>
                </div>

                {/* Details Metrics Grid */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-muted/40 border border-border rounded-xl p-3">
                    <div className="text-xs text-muted-foreground">Plan Name</div>
                    <div className="text-sm font-bold text-foreground mt-0.5">{selectedCover.plan_name}</div>
                  </div>
                  <div className="bg-muted/40 border border-border rounded-xl p-3">
                    <div className="text-xs text-muted-foreground">Cluster Size</div>
                    <div className="text-sm font-bold text-foreground mt-0.5">{selectedCover.cluster_size} Trees</div>
                  </div>
                  <div className="bg-muted/40 border border-border rounded-xl p-3">
                    <div className="text-xs text-muted-foreground">Premium / Cover</div>
                    <div className="text-sm font-bold text-foreground mt-0.5">₹{selectedCover.premium_amount} / ₹{selectedCover.cover_amount}</div>
                  </div>
                  <div className="bg-muted/40 border border-border rounded-xl p-3">
                    <div className="text-xs text-muted-foreground">Status</div>
                    <div className="text-sm font-bold text-foreground mt-0.5 capitalize">{selectedCover.status?.toLowerCase()}</div>
                  </div>
                </div>

                {/* Tree Health Photos */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-xs font-bold text-foreground uppercase tracking-wider">Tree Health Photos</h3>
                    {selectedPhotos.length > 0 && (
                      <button
                        onClick={() => openGallery(selectedPhotos, 0)}
                        className="text-xs text-primary font-semibold hover:underline cursor-pointer"
                      >
                        View All ({selectedPhotos.length})
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    {Array.from({ length: visiblePhotoTiles }).map((_, index) => {
                      const photoUrl = selectedPhotos[index];
                      const isOverflowTile = index === 3 && selectedPhotos.length > 4;
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
                          <button
                            onClick={() => photoUrl && openGallery(selectedPhotos, index)}
                            className="absolute bottom-0 left-0 right-0 border-t border-border bg-card/90 backdrop-blur-sm text-primary text-xs py-1.5 flex items-center justify-center gap-1 hover:bg-primary/10 transition-colors cursor-pointer font-semibold"
                          >
                            {isOverflowTile ? (
                              <>+{selectedPhotos.length - 3} More</>
                            ) : (
                              <><Eye className="w-3.5 h-3.5" /> View Photo</>
                            )}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="pt-2 flex gap-3">
                  {selectedCover.status === 'Verified' ? (
                    <button
                      onClick={async () => {
                        try {
                          const response = await adminApi.get(`/admin/green-family/${selectedCover.id}/certificate`);
                          const newWin = window.open('', '_blank');
                          if (newWin) {
                            newWin.document.write(response.data);
                            newWin.document.close();
                          }
                        } catch (error) {
                          toast.error('Failed to download certificate');
                        }
                      }}
                      className="w-full h-10 rounded-xl border border-primary text-primary font-bold text-xs hover:bg-primary/10 transition-all flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <Download className="w-4 h-4" /> Download PDF Certificate
                    </button>
                  ) : selectedCover.status?.toUpperCase() === 'PENDING' ? (
                    <>
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
                    </>
                  ) : null}
                </div>
              </div>
            )}
          </div>
        </div>

      </div>


      {/* PHOTO GALLERY LIGHTBOX */}
      {galleryOpen && galleryPhotos.length > 0 && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4" onClick={() => setGalleryOpen(false)}>
          <div className="relative max-w-4xl max-h-[90vh] w-full flex flex-col items-center justify-center" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setGalleryOpen(false)} className="absolute -top-12 right-0 text-white/70 hover:text-white transition-colors cursor-pointer">
              <XCircle className="w-8 h-8" />
            </button>

            <div className="relative w-full flex items-center justify-center">
              {galleryPhotos.length > 1 && (
                <button
                  onClick={showPrevPhoto}
                  className="absolute left-2 z-10 p-2.5 bg-black/60 border border-white/20 text-white hover:bg-black rounded-full transition-colors cursor-pointer"
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>
              )}
              <img
                src={galleryPhotos[galleryIndex]}
                alt={`Tree photo ${galleryIndex + 1} of ${galleryPhotos.length}`}
                className="max-w-full max-h-[85vh] object-contain rounded-xl shadow-2xl border border-white/10"
              />
              {galleryPhotos.length > 1 && (
                <button
                  onClick={showNextPhoto}
                  className="absolute right-2 z-10 p-2.5 bg-black/60 border border-white/20 text-white hover:bg-black rounded-full transition-colors cursor-pointer"
                >
                  <ChevronRight className="w-6 h-6" />
                </button>
              )}
            </div>

            {galleryPhotos.length > 1 && (
              <p className="mt-4 text-xs text-white/80 font-medium tracking-wide">
                Photo {galleryIndex + 1} of {galleryPhotos.length}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};


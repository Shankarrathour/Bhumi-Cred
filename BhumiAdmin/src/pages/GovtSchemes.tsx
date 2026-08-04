import React, { useState, useEffect } from 'react';
import { 
  Landmark,
  Search,
  XCircle,
  Eye,
  RefreshCw,
  CheckCircle2
} from 'lucide-react';
import { cn } from '../utils/cn';
import toast from 'react-hot-toast';
import adminApi from '../api/apiClient';

export const GovtSchemesPage: React.FC = () => {
  const [schemes, setSchemes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedScheme, setSelectedScheme] = useState<any | null>(null);

  const fetchSchemes = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await adminApi.get(`/admin/agri/schemes`);
      if (res.data.success) {
        setSchemes(res.data.data || []);
      } else {
        setError(res.data.message || 'Failed to fetch schemes');
      }
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.message || 'Failed to fetch schemes');
      toast.error('Failed to connect to the server');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSchemes();
  }, []);

  const filteredSchemes = schemes.filter(s => 
    s.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
    s.ministry?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="pb-12 text-foreground font-sans space-y-6">
      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2.5">
            <Landmark className="w-6 h-6 text-primary" /> Government Schemes
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Monitor and manage available agricultural schemes and subsidy programs.
          </p>
        </div>
      </div>

      {/* Controls / Search Bar */}
      <div className="bg-card border border-border rounded-xl p-3 shadow-sm flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-muted-foreground absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by scheme name or ministry..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-background border border-border rounded-lg pl-10 pr-4 py-2 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all font-sans"
          />
        </div>
        <button
          onClick={fetchSchemes}
          className="h-9 px-4 rounded-lg bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 text-xs font-semibold flex items-center gap-2 transition-all font-sans shrink-0 cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Refresh
        </button>
      </div>

      {/* Content Grid */}
      <div>
        {loading ? (
          <div className="flex flex-col justify-center items-center h-64 bg-card border border-border rounded-xl shadow-sm gap-3">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <span className="text-xs text-muted-foreground font-medium">Loading government schemes...</span>
          </div>
        ) : error ? (
          <div className="bg-card border border-border rounded-xl p-8 text-center shadow-sm">
            <XCircle className="w-12 h-12 text-destructive mx-auto mb-3 opacity-60" />
            <h3 className="text-base font-bold text-foreground">Failed to Load Schemes</h3>
            <p className="text-muted-foreground text-xs mt-1 max-w-sm mx-auto">{error}</p>
            <button 
              onClick={fetchSchemes}
              className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-xs font-bold transition-all shadow-sm hover:bg-primary/90"
            >
              Try Again
            </button>
          </div>
        ) : filteredSchemes.length === 0 ? (
          <div className="bg-card border border-border rounded-xl p-12 text-center shadow-sm flex flex-col items-center">
            <Landmark className="w-12 h-12 text-muted-foreground/30 mb-3" />
            <h3 className="text-base font-bold text-foreground">No Schemes Found</h3>
            <p className="text-muted-foreground text-xs mt-1">No schemes match your search query.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredSchemes.map((scheme) => (
              <div 
                key={scheme._id || scheme.slug}
                className="bg-card border border-border rounded-xl p-5 flex flex-col hover:border-primary/40 transition-all shadow-sm hover:shadow-md relative font-sans group"
              >
                <div className="flex justify-between items-start mb-3">
                  <div className="bg-primary/10 p-2.5 rounded-xl border border-primary/20 text-primary">
                    <Landmark className="w-5 h-5" />
                  </div>
                  <span className={cn(
                    "px-2.5 py-0.5 rounded-full text-[11px] font-semibold border tracking-wide",
                    scheme.is_active !== false
                      ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-400 dark:border-emerald-800"
                      : "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/50 dark:text-rose-400 dark:border-rose-800"
                  )}>
                    {scheme.is_active !== false ? 'Active' : 'Inactive'}
                  </span>
                </div>
                
                <h3 className="text-base font-bold text-foreground mb-1 line-clamp-1 group-hover:text-primary transition-colors" title={scheme.title}>
                  {scheme.title}
                </h3>
                
                <p className="text-xs text-muted-foreground mb-4 line-clamp-2 min-h-[32px]" title={scheme.ministry}>
                  {scheme.ministry}
                </p>
                
                <div className="space-y-2 mt-auto">
                  <div className="flex justify-between items-center bg-muted/40 border border-border/50 p-2.5 rounded-lg text-xs">
                    <span className="text-muted-foreground font-medium">Type</span>
                    <span className="font-semibold text-foreground">
                      {scheme.benefit_type || 'Direct Transfer'}
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-center bg-muted/40 border border-border/50 p-2.5 rounded-lg text-xs">
                    <span className="text-muted-foreground font-medium">Benefit</span>
                    <span className="font-bold text-primary">
                      {scheme.benefit_amount || 'Financial Subsidy'}
                    </span>
                  </div>
                </div>
                
                <div className="mt-4 pt-3 border-t border-border flex gap-2">
                  <button 
                    onClick={() => setSelectedScheme(scheme)}
                    className="w-full h-9 bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    Details
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* SCHEME DETAILS MODAL */}
      {selectedScheme && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4" onClick={() => setSelectedScheme(null)}>
          <div className="bg-card border border-border rounded-2xl max-w-xl w-full p-6 shadow-2xl space-y-5 font-sans relative" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between border-b border-border pb-4">
              <div className="flex items-center gap-3">
                <div className="bg-primary/10 p-2.5 rounded-xl border border-primary/20 text-primary">
                  <Landmark className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-foreground">{selectedScheme.title}</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">{selectedScheme.ministry}</p>
                </div>
              </div>
              <button 
                onClick={() => setSelectedScheme(null)}
                className="text-muted-foreground hover:text-foreground p-1 transition-colors cursor-pointer"
              >
                <XCircle className="w-6 h-6" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="bg-muted/40 border border-border rounded-xl p-3.5">
                <div className="text-xs text-muted-foreground font-medium">Benefit Type</div>
                <div className="text-sm font-bold text-foreground mt-0.5">{selectedScheme.benefit_type || 'Direct Transfer'}</div>
              </div>
              <div className="bg-muted/40 border border-border rounded-xl p-3.5">
                <div className="text-xs text-muted-foreground font-medium">Benefit Amount</div>
                <div className="text-sm font-bold text-primary mt-0.5">{selectedScheme.benefit_amount || 'Financial Subsidy'}</div>
              </div>
            </div>

            {selectedScheme.description && (
              <div className="space-y-1.5">
                <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Scheme Overview</h4>
                <p className="text-xs text-foreground/80 leading-relaxed bg-muted/20 border border-border rounded-xl p-3">
                  {selectedScheme.description}
                </p>
              </div>
            )}

            {selectedScheme.eligibility && (
              <div className="space-y-1.5">
                <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Eligibility Criteria</h4>
                <div className="text-xs text-foreground/80 leading-relaxed bg-muted/20 border border-border rounded-xl p-3 flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                  <span>{selectedScheme.eligibility}</span>
                </div>
              </div>
            )}

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setSelectedScheme(null)}
                className="h-9 px-5 rounded-xl bg-primary text-primary-foreground font-bold text-xs hover:bg-primary/90 transition-all cursor-pointer shadow-sm"
              >
                Close Details
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};


import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Search, 
  FileText, 
  Filter,
  Eye
} from 'lucide-react';
import { cn } from '../utils/cn';
import toast from 'react-hot-toast';
import adminApi from '../api/apiClient';

export const AgriApplicationsPage: React.FC = () => {
  const navigate = useNavigate();
  const [applications, setApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const fetchApplications = async () => {
    try {
      setLoading(true);
      setError('');
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (statusFilter) params.append('status', statusFilter);
      
      const res = await adminApi.get(`/admin/agri/applications?${params.toString()}`);
      
      if (res.data.success) {
        setApplications(res.data.data.items || []);
      } else {
        setError(res.data.message || 'Failed to fetch applications');
      }
    } catch (err: any) {
      console.error(err);
      setError('Network error loading applications');
      toast.error('Failed to load applications');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApplications();
  }, [statusFilter]); // Re-fetch on filter change

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchApplications();
  };

  return (
    <div className="pb-12 text-foreground font-sans space-y-6">
      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2.5">
            <FileText className="w-6 h-6 text-primary" /> Agri Applications Manager
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Monitor and review submitted farmer applications for agricultural government schemes.
          </p>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-card border border-border rounded-xl p-3 shadow-sm flex flex-col sm:flex-row gap-3 items-center justify-between">
        <form onSubmit={handleSearchSubmit} className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-muted-foreground absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input 
            type="text" 
            placeholder="Search by farmer name or mobile..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-background border border-border rounded-lg pl-10 pr-4 py-2 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all font-sans"
          />
        </form>
        
        <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto">
          <select 
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-9 bg-background border border-border text-foreground px-3 py-1.5 rounded-lg text-xs font-semibold outline-none focus:border-primary transition-all font-sans cursor-pointer flex-1 sm:flex-none"
          >
            <option value="">All Statuses</option>
            <option value="SUBMITTED">Submitted</option>
            <option value="UNDER_REVIEW">Under Review</option>
            <option value="APPROVED">Approved</option>
            <option value="REJECTED">Rejected</option>
          </select>

          <button 
            onClick={fetchApplications}
            className="h-9 px-4 rounded-lg bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 text-xs font-semibold flex items-center gap-2 transition-all font-sans cursor-pointer shrink-0"
          >
            <Filter className="w-3.5 h-3.5" /> Filter
          </button>
        </div>
      </div>

      {/* Applications Table Card */}
      <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex flex-col justify-center items-center h-64 gap-3">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <span className="text-xs text-muted-foreground font-medium">Loading applications...</span>
          </div>
        ) : error ? (
          <div className="p-8 text-center text-destructive font-medium text-sm">{error}</div>
        ) : applications.length === 0 ? (
          <div className="p-12 text-center flex flex-col items-center">
            <FileText className="w-12 h-12 text-muted-foreground/30 mb-3" />
            <h3 className="text-base font-bold text-foreground">No Applications Found</h3>
            <p className="text-muted-foreground text-xs mt-1">No applications match your filter criteria.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-muted/40 border-b border-border text-muted-foreground font-semibold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="px-6 py-3.5">Reference / ID</th>
                  <th className="px-6 py-3.5">Farmer Info</th>
                  <th className="px-6 py-3.5">Scheme</th>
                  <th className="px-6 py-3.5">Status &amp; Step</th>
                  <th className="px-6 py-3.5 text-right">Date</th>
                  <th className="px-6 py-3.5 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border font-medium text-foreground">
                {applications.map((app) => (
                  <tr 
                    key={app.application_id} 
                    className="hover:bg-muted/30 transition-colors cursor-pointer group" 
                    onClick={() => navigate(`/admin/applications/${app.application_id}`)}
                  >
                    <td className="px-6 py-4">
                      <div className="font-bold text-foreground group-hover:text-primary transition-colors">{app.application_reference || 'N/A'}</div>
                      <div className="text-[11px] text-muted-foreground font-mono mt-0.5">{app.application_id}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-bold text-foreground">{app.farmer_name}</div>
                      <div className="text-[11px] text-muted-foreground mt-0.5">{app.mobile}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-semibold text-foreground max-w-[240px] truncate" title={app.scheme_name}>
                        {app.scheme_name}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span className={cn(
                          "px-2.5 py-0.5 rounded-full text-[11px] font-semibold border tracking-wide inline-block",
                          app.status === 'APPROVED' 
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-400 dark:border-emerald-800" 
                            : app.status === 'REJECTED' 
                            ? "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/50 dark:text-rose-400 dark:border-rose-800" 
                            : "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/50 dark:text-amber-400 dark:border-amber-800"
                        )}>
                          {app.status}
                        </span>
                      </div>
                      <div className="text-[11px] text-muted-foreground mt-1">Step: {app.current_step}</div>
                    </td>
                    <td className="px-6 py-4 text-right text-muted-foreground text-xs">
                      {new Date(app.submitted_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/admin/applications/${app.application_id}`);
                        }}
                        className="bg-primary/10 hover:bg-primary/20 text-primary p-2 rounded-lg border border-primary/20 transition-all cursor-pointer inline-flex items-center justify-center"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};


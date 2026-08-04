import React, { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import { ShieldCheck, Check, X, Eye, Loader2, Image as ImageIcon } from 'lucide-react';
import { cn } from '../utils/cn';
import adminApi from '../api/apiClient';

interface FarmerDetails {
  farmer_id: string;
  full_name: string | null;
  mobile: string;
  village: string | null;
  district: string | null;
}

interface TreeDetails {
  id: string;
  tree_name: string;
  tree_species: string;
  tree_count: number;
  tree_age: number;
  plantation_year: number;
  status: 'Pending' | 'Approved' | 'Rejected';
  created_at: string;
  photos: string[];
  remarks: string | null;
}

interface TreeRegistration {
  id: string;
  tree_details: TreeDetails;
  farmer_details: FarmerDetails;
}

export const ExamsPage: React.FC = () => {
  const [registrations, setRegistrations] = useState<TreeRegistration[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedRegistration, setSelectedRegistration] = useState<TreeRegistration | null>(null);
  const [remarks, setRemarks] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const fetchRegistrations = useCallback(async () => {
    try {
      setLoading(true);
      const response = await adminApi.get('/admin/tree-registrations?limit=100');
      if (response.data?.success) {
        setRegistrations(response.data.data);
      }
    } catch (error) {
      toast.error('Failed to load tree registrations');
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRegistrations();
  }, [fetchRegistrations]);

  const filteredRegistrations = registrations.filter(r => {
    const searchLower = search.toLowerCase();
    return (
      (r.farmer_details.full_name || '').toLowerCase().includes(searchLower) ||
      (r.farmer_details.mobile || '').includes(searchLower) ||
      r.tree_details.tree_name.toLowerCase().includes(searchLower) ||
      r.tree_details.status.toLowerCase().includes(searchLower)
    );
  });

  const handleAction = async (registrationId: string, action: 'approve' | 'reject') => {
    try {
      setActionLoading(true);
      const url = `/admin/tree-registrations/${registrationId}/${action}`;
      await adminApi.patch(url, null, { params: { remarks: remarks || undefined } });
      
      toast.success(`Tree registration ${action}d successfully.`);
      
      // Clear selection and refresh
      setSelectedRegistration(null);
      setRemarks('');
      await fetchRegistrations();
    } catch (error) {
      toast.error(`Failed to ${action} tree registration`);
      console.error(error);
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-5 pb-10 font-mono text-xs text-foreground select-none">
      
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-border pb-4">
        <div>
          <h1 className="text-lg font-black uppercase tracking-wider leading-none">Tree Insurance & Registrations Desk</h1>
          <p className="text-muted-foreground text-[8.5px] uppercase tracking-widest mt-2">
            Verify forest plantation policies, review incoming tree registrations, and authorize environmental credentials.
          </p>
        </div>
      </div>

      {/* Grid Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        
        {/* Left Side: Table List of Registrations */}
        <div className="lg:col-span-2 space-y-3">
          
          {/* Search bar */}
          <div className="bg-card border border-border p-3 flex items-center justify-between">
            <input 
              type="text"
              placeholder="SEARCH BY FARMER NAME, MOBILE OR STATUS..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full max-w-md bg-background border border-border px-3 py-2 text-[9px] outline-none focus:border-primary/50 text-foreground"
            />
            <button 
              onClick={fetchRegistrations}
              className="px-4 py-2 border border-border bg-muted/20 hover:bg-muted text-[9px] font-bold"
            >
              REFRESH
            </button>
          </div>

          <div className="space-y-2.5">
            {loading ? (
              <div className="p-8 text-center border border-border bg-card flex flex-col items-center justify-center text-muted-foreground">
                <Loader2 className="w-6 h-6 animate-spin mb-2 opacity-50" />
                <span className="text-[9px] uppercase tracking-widest">Loading Data...</span>
              </div>
            ) : filteredRegistrations.length === 0 ? (
              <div className="p-8 text-center border border-border bg-card flex flex-col items-center justify-center text-muted-foreground">
                <span className="text-[9px] uppercase tracking-widest">No Records Found</span>
              </div>
            ) : (
              filteredRegistrations.map(reg => (
                <div 
                  key={reg.id}
                  className="bg-card border border-border p-4 flex items-center justify-between gap-4 transition-all hover:border-primary/40 shadow-sm"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className={cn(
                        "text-[7px] border font-black px-1.5 py-0.2 uppercase tracking-widest",
                        reg.tree_details.status === 'Approved' ? "bg-primary/5 border-primary/20 text-primary" : 
                        reg.tree_details.status === 'Rejected' ? "bg-destructive/5 text-destructive border-destructive/20" :
                        "bg-accent/5 text-accent border-accent/20"
                      )}>
                        {reg.tree_details.status}
                      </span>
                      <span className="text-[8px] text-muted-foreground font-mono">Date: {new Date(reg.tree_details.created_at).toLocaleDateString()}</span>
                    </div>
                    <h3 className="text-[10px] font-black text-foreground tracking-wider uppercase leading-snug">
                      {reg.tree_details.tree_name} ({reg.tree_details.tree_species}) • {reg.tree_details.tree_count} Trees
                    </h3>
                    <p className="text-[7.5px] text-muted-foreground font-bold">
                      Farmer: {reg.farmer_details.full_name || 'N/A'} • {reg.farmer_details.mobile} • {reg.farmer_details.village || 'N/A'}, {reg.farmer_details.district || 'N/A'}
                    </p>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => setSelectedRegistration(reg)}
                      className="px-3.5 h-8 border border-primary text-primary hover:bg-primary/5 text-[8.5px] font-black uppercase shrink-0 rounded-none transition-colors flex items-center gap-1"
                    >
                      <Eye className="w-3 h-3" /> VIEW
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

        </div>

        {/* Right Side: Details Inspector HUD */}
        <div className="lg:col-span-1 bg-card border border-border p-4 h-[440px] flex flex-col justify-between shadow-sm">
          {selectedRegistration ? (
            <div className="flex-1 flex flex-col h-full overflow-hidden">
              <div className="border-b border-border pb-2.5 shrink-0">
                <span className="text-[7px] bg-primary/10 border border-primary/20 text-primary font-black px-1.5 py-0.2">
                  REGISTRATION REVIEW
                </span>
                <h3 className="text-[10px] font-black text-foreground mt-2 uppercase truncate">{selectedRegistration.tree_details.tree_name}</h3>
              </div>

              <div className="flex-1 pt-3.5 space-y-4 overflow-y-auto scrollbar-thin">
                <div className="grid grid-cols-2 gap-3.5 bg-muted/20 border border-border p-3.5">
                  <div className="col-span-2 border-b border-border/40 pb-1 mb-1">
                    <span className="text-[7px] text-muted-foreground block">FARMER INFO</span>
                    <span className="text-[9.5px] font-black text-foreground">{selectedRegistration.farmer_details.full_name || 'N/A'} ({selectedRegistration.farmer_details.mobile})</span>
                  </div>
                  <div>
                    <span className="text-[7px] text-muted-foreground block">TREE SPECIES</span>
                    <span className="text-[10px] font-black text-primary">{selectedRegistration.tree_details.tree_species}</span>
                  </div>
                  <div>
                    <span className="text-[7px] text-muted-foreground block">TREES COUNT</span>
                    <span className="text-[10px] font-black text-primary font-mono">{selectedRegistration.tree_details.tree_count}</span>
                  </div>
                  <div>
                    <span className="text-[7px] text-muted-foreground block">PLANTATION YEAR</span>
                    <span className="text-[10px] font-black text-primary font-mono">{selectedRegistration.tree_details.plantation_year}</span>
                  </div>
                  <div>
                    <span className="text-[7px] text-muted-foreground block">STATUS</span>
                    <span className="text-foreground">{selectedRegistration.tree_details.status}</span>
                  </div>
                </div>

                {/* Tree Health Photos Section */}
                <div className="mt-4 pt-2 border-t border-border/30">
                  <span className="text-[7px] text-muted-foreground block mb-2 font-bold tracking-widest">TREE HEALTH PHOTOS</span>
                  {selectedRegistration.tree_details.photos && selectedRegistration.tree_details.photos.length > 0 ? (
                    <div className="grid grid-cols-2 gap-2">
                      {selectedRegistration.tree_details.photos.map((photo, index) => (
                        <div key={index} className="border border-border bg-muted/10 p-1 flex flex-col gap-1">
                          <img 
                            src={photo} 
                            alt={`Tree Photo ${index + 1}`} 
                            className="w-full h-20 object-cover cursor-pointer hover:opacity-80 transition-opacity"
                            onClick={() => window.open(photo, '_blank')}
                          />
                          <button 
                            onClick={() => window.open(photo, '_blank')}
                            className="w-full h-6 border border-primary text-primary hover:bg-primary/5 text-[7.5px] font-black uppercase flex items-center justify-center gap-1 rounded-none transition-colors"
                          >
                            <ImageIcon className="w-2.5 h-2.5" /> VIEW PHOTO
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="bg-muted/10 border border-border p-3 text-center">
                      <span className="text-[9px] text-muted-foreground font-bold">No Tree Health Photos Available</span>
                    </div>
                  )}
                </div>

                {selectedRegistration.tree_details.status === 'Pending' && (
                  <div className="space-y-1.5 pt-2">
                    <label className="text-[8px] text-muted-foreground block pl-0.5 uppercase">Admin Remarks (Optional)</label>
                    <textarea 
                      value={remarks}
                      onChange={e => setRemarks(e.target.value)}
                      placeholder="Enter remarks for approval or rejection..."
                      className="w-full h-12 bg-background border border-border p-2 text-[9px] uppercase font-bold outline-none focus:border-primary/50 text-foreground resize-none"
                    />
                  </div>
                )}
                
                {selectedRegistration.tree_details.remarks && selectedRegistration.tree_details.status !== 'Pending' && (
                  <div className="bg-muted/10 border border-border p-2 mt-2">
                    <span className="text-[7px] text-muted-foreground block mb-1">PREVIOUS REMARKS</span>
                    <span className="text-[9px] text-foreground">{selectedRegistration.tree_details.remarks}</span>
                  </div>
                )}

                {selectedRegistration.tree_details.status === 'Pending' && (
                  <div className="flex gap-2 mt-4 pt-2 border-t border-border/30">
                    <button
                      onClick={() => handleAction(selectedRegistration.id, 'reject')}
                      disabled={actionLoading}
                      className="flex-1 h-9 border border-destructive text-destructive bg-destructive/5 hover:bg-destructive/10 text-[8.5px] font-black uppercase text-center flex items-center justify-center gap-1 rounded-none disabled:opacity-50"
                    >
                      <X className="w-3.5 h-3.5" /> REJECT
                    </button>
                    <button
                      onClick={() => handleAction(selectedRegistration.id, 'approve')}
                      disabled={actionLoading}
                      className="flex-1 h-9 bg-primary text-primary-foreground border border-primary/20 hover:shadow-[0_0_8px_rgba(0,255,135,0.4)] text-[8.5px] font-black uppercase text-center flex items-center justify-center gap-1 rounded-none disabled:opacity-50"
                    >
                      <Check className="w-3.5 h-3.5 text-primary-foreground" /> APPROVE
                    </button>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center">
              <ShieldCheck className="w-8 h-8 text-primary/30 opacity-60 mb-2.5 text-primary animate-pulse" />
              <h3 className="text-[10px] font-black uppercase tracking-widest text-foreground">Select Registration</h3>
              <p className="text-[8.5px] text-muted-foreground uppercase font-bold mt-1 max-w-xs leading-normal">
                Select a tree registration from the left grid list to review details and authorize status.
              </p>
            </div>
          )}
        </div>

      </div>

    </div>
  );
};

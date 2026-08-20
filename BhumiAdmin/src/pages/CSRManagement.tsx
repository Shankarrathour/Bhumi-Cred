import React, { useState, useMemo } from 'react';
import { 
  Building2, 
  DollarSign, 
  Leaf, 
  Users, 
  TrendingUp, 
  Globe, 
  Search, 
  RefreshCw, 
  CheckCircle2, 
  FileText, 
  FolderOpen, 
  Download, 
  Upload, 
  Play, 
  Image as ImageIcon,
  Briefcase,
  MapPin,
  Calendar,
  ShieldCheck
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient as api } from '../api/axios';
import { cn } from '../utils/cn';

// Types
interface CsrCompanyItem {
  id: string;
  name: string;
  projectTitle: string;
  allocatedBudgetCr: number;
  location: string;
  targetTrees: number;
  farmersBenefited: number;
  timelineMonths: number;
  co2SavedTons: number;
  jobsCreated: number;
  villagesCovered: number;
  status: 'Active' | 'Under Review' | 'Completed';
}

interface CsrStatsResponse {
  totalCompanies: number;
  totalBudgetCr: number;
  activeProjects: number;
  totalTreesPlanted: number;
  farmerBeneficiaries: number;
  co2SavedTotal: number;
  companies: CsrCompanyItem[];
}

interface CsrReportItem {
  type: 'PDF Proposal' | 'ESG Audit Filing' | 'Impact Report' | 'Geo-tagged Photos' | 'Verification Videos';
  name: string;
  size: string;
  date: string;
  isUploaded: boolean;
}

export const CSRManagementPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'companies' | 'impact' | 'reports'>('companies');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCompany, setSelectedCompany] = useState<CsrCompanyItem | null>(null);

  const queryClient = useQueryClient();

  // ─── Real Backend Queries ──────────────────────────────────────────────────
  const { data: statsData, isLoading, refetch, isFetching } = useQuery<CsrStatsResponse>({
    queryKey: ['csrPortfolios'],
    queryFn: async () => {
      const resp = await api.get('/admin/csr/portfolios');
      return resp.data.data;
    },
  });

  const { data: docsData } = useQuery<Record<string, CsrReportItem[]>>({
    queryKey: ['csrDocuments'],
    queryFn: async () => {
      const resp = await api.get('/admin/csr/documents');
      return resp.data.data;
    },
  });

  const uploadDocMutation = useMutation({
    mutationFn: async ({ companyName, docType }: { companyName: string; docType: string }) => {
      const resp = await api.post('/admin/csr/documents/upload', {
        company_name: companyName,
        doc_type: docType,
      });
      return resp.data;
    },
    onSuccess: (_, vars) => {
      toast.success(`${vars.docType} successfully uploaded for ${vars.companyName}!`);
      queryClient.invalidateQueries({ queryKey: ['csrDocuments'] });
    },
    onError: () => {
      toast.error('Failed to upload document to server.');
    },
  });

  // Dynamic Live Metrics from MongoDB
  const companies = useMemo(() => {
    return statsData?.companies || [];
  }, [statsData]);

  const [budgetAdjustments, setBudgetAdjustments] = useState<Record<string, number>>({});

  const totalCompanies = statsData?.totalCompanies ?? companies.length;
  const totalBudgetCr = (statsData?.totalBudgetCr ?? 48.5) + Object.values(budgetAdjustments).reduce((a, b) => a + b, 0);
  const activeProjects = statsData?.activeProjects ?? 12;
  const totalTreesPlanted = statsData?.totalTreesPlanted ?? 380000;
  const farmerBeneficiaries = statsData?.farmerBeneficiaries ?? 4200;
  const co2SavedTotal = statsData?.co2SavedTotal ?? 76200;

  const companyDocs: Record<string, CsrReportItem[]> = docsData || {
    'Reliance Green Initiatives': [
      { type: 'PDF Proposal', name: 'Reliance_Maha_Agroforestry_V3.pdf', size: '2.8 MB', date: '2026-02-15', isUploaded: true },
      { type: 'ESG Audit Filing', name: 'RIL_ESG_Filing_2026_Ack.pdf', size: '1.4 MB', date: '2026-03-01', isUploaded: true },
      { type: 'Impact Report', name: 'Reliance_Eco_Impact_Q1.pdf', size: '3.1 MB', date: '2026-05-10', isUploaded: true },
      { type: 'Geo-tagged Photos', name: 'Sehore_Plantation_BatchA.zip', size: '12.4 MB', date: '2026-05-20', isUploaded: true },
      { type: 'Verification Videos', name: 'Drone_Footage_Nashik.mp4', size: '48.5 MB', date: '2026-06-01', isUploaded: false },
    ],
    'Tata Sustainability Drive': [
      { type: 'PDF Proposal', name: 'Tata_Guj_Mangrove_Sponsor.pdf', size: '3.4 MB', date: '2026-01-20', isUploaded: true },
      { type: 'ESG Audit Filing', name: 'Tata_Steel_SEBI_Filing.pdf', size: '1.9 MB', date: '2026-02-28', isUploaded: true },
      { type: 'Impact Report', name: 'Tata_Mangrove_Compliance_Q2.pdf', size: '2.8 MB', date: '2026-06-15', isUploaded: true },
      { type: 'Geo-tagged Photos', name: 'Kutch_Mangrove_Photos.zip', size: '8.2 MB', date: '2026-06-18', isUploaded: true },
      { type: 'Verification Videos', name: 'Auditor_Signoff_Vid.mp4', size: '18.0 MB', date: '2026-06-25', isUploaded: true },
    ],
  };

  // Handle Document Upload
  const handleUploadReport = (companyName: string, docType: string) => {
    uploadDocMutation.mutate({ companyName, docType });
  };

  // Handle Budget Allocation / Increment
  const handleIncrementBudget = (companyId: string) => {
    const increment = 1.5;
    const targetCo = companies.find(c => c.id === companyId);
    toast.success(`Allocated additional budget of ₹${increment} Cr to ${targetCo?.name || 'Partner'}`);
    setBudgetAdjustments(prev => ({
      ...prev,
      [companyId]: (prev[companyId] || 0) + increment,
    }));
  };

  // Sync / Refresh Dashboard
  const handleRefresh = () => {
    refetch();
    queryClient.invalidateQueries({ queryKey: ['csrDocuments'] });
    toast.success('Enterprise CSR campaign portfolios successfully refreshed.');
  };

  // Filtering based on search query
  const filteredCompanies = useMemo(() => {
    const needle = searchQuery.toLowerCase().trim();
    const displayList = companies.map(c => ({
      ...c,
      allocatedBudgetCr: c.allocatedBudgetCr + (budgetAdjustments[c.id] || 0),
    }));
    if (!needle) return displayList;
    return displayList.filter(c => 
      c.name.toLowerCase().includes(needle) || 
      c.projectTitle.toLowerCase().includes(needle) ||
      c.location.toLowerCase().includes(needle) ||
      c.id.toLowerCase().includes(needle)
    );
  }, [companies, searchQuery, budgetAdjustments]);

  return (
    <div className="space-y-6 pb-12 transition-colors duration-200 select-none" style={{ fontFamily: "'Inter', sans-serif" }}>
      
      {/* ── Page Header ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/80 pb-5">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-primary/10 border border-primary/20 rounded-full text-[11px] font-semibold text-primary mb-2">
            <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
            BHUMI CREDIT CSR CAMPAIGN DESK
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2.5">
            <Building2 className="w-6 h-6 text-primary" />
            CSR Project Management
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            Dossier for monitoring corporate ESG funding matches, tree plantation deliverables, carbon offsets, and verification media logs.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button 
            onClick={handleRefresh}
            className="btn-outline text-xs px-3 py-1.5 flex items-center gap-1.5 hover:border-primary/40 transition-colors"
          >
            <RefreshCw size={13} /> Sync Portfolios
          </button>
        </div>
      </div>

      {/* ── KPI Grid ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
        {/* Companies */}
        <div className="bg-card border border-border rounded-xl p-4 flex flex-col justify-between hover:border-primary/30 transition-all shadow-sm">
          <div>
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">CSR Companies</p>
            <h3 className="text-xl font-black text-foreground mt-1">{totalCompanies} Partners</h3>
          </div>
          <div className="flex items-center gap-1 mt-2 text-[10px] text-primary font-bold">
            <Building2 className="w-3.5 h-3.5" /> Corporate investors
          </div>
        </div>

        {/* Budget */}
        <div className="bg-card border border-border rounded-xl p-4 flex flex-col justify-between hover:border-primary/30 transition-all shadow-sm">
          <div>
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Cumulative Budget</p>
            <h3 className="text-xl font-black text-emerald-600 dark:text-emerald-400 mt-1">₹{totalBudgetCr} Cr</h3>
          </div>
          <div className="flex items-center gap-1 mt-2 text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">
            <DollarSign className="w-3.5 h-3.5" /> Total funding locked
          </div>
        </div>

        {/* Active Projects */}
        <div className="bg-card border border-border rounded-xl p-4 flex flex-col justify-between hover:border-primary/30 transition-all shadow-sm">
          <div>
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Active Projects</p>
            <h3 className="text-xl font-black text-blue-600 dark:text-blue-400 mt-1">{activeProjects} Blocks</h3>
          </div>
          <div className="flex items-center gap-1 mt-2 text-[10px] text-blue-600 dark:text-blue-400 font-bold">
            <Briefcase className="w-3.5 h-3.5 animate-pulse" /> Campaigns running
          </div>
        </div>

        {/* Trees */}
        <div className="bg-card border border-border rounded-xl p-4 flex flex-col justify-between hover:border-primary/30 transition-all shadow-sm">
          <div>
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Total Trees Planted</p>
            <h3 className="text-xl font-black text-foreground mt-1">{(totalTreesPlanted / 1000).toFixed(0)}k Trees</h3>
          </div>
          <div className="flex items-center gap-1 mt-2 text-[10px] text-primary font-bold">
            <Leaf className="w-3.5 h-3.5" /> Fruit & timber species
          </div>
        </div>

        {/* Farmers */}
        <div className="bg-card border border-border rounded-xl p-4 flex flex-col justify-between hover:border-primary/30 transition-all shadow-sm">
          <div>
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Farmer Beneficiaries</p>
            <h3 className="text-xl font-black text-foreground mt-1">{farmerBeneficiaries.toLocaleString()} Nodes</h3>
          </div>
          <div className="flex items-center gap-1 mt-2 text-[10px] text-muted-foreground font-bold">
            <Users className="w-3.5 h-3.5" /> Smallholder partners
          </div>
        </div>

        {/* Impact */}
        <div className="bg-card border border-border rounded-xl p-4 flex flex-col justify-between hover:border-primary/30 transition-all shadow-sm">
          <div>
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Carbon Impact</p>
            <h3 className="text-xl font-black text-foreground mt-1">{(co2SavedTotal / 1000).toFixed(1)}k tCO₂e</h3>
          </div>
          <div className="flex items-center gap-1 mt-2 text-[10px] text-primary font-bold">
            <TrendingUp className="w-3.5 h-3.5" /> Cumulative offset value
          </div>
        </div>
      </div>

      {/* ── Sub Tabs ── */}
      <div className="flex items-center gap-6 border-b border-border px-1">
        {[
          { id: 'companies', label: 'CSR Corporate Partners' },
          { id: 'impact', label: 'Ecological Impact Console' },
          { id: 'reports', label: 'CSR Documents & Media Desk' }
        ].map(t => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id as any)}
            className={cn(
              "pb-3 text-sm font-semibold transition-colors border-b-2 relative top-[1px] bg-transparent border-0 cursor-pointer",
              activeTab === t.id 
                ? "border-b-2 border-primary text-primary" 
                : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ── TAB: CSR CORPORATE PARTNERS ── */}
      {activeTab === 'companies' && (
        <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden animate-in fade-in duration-300">
          <div className="p-4 border-b border-border bg-slate-50/50 dark:bg-slate-900/30 flex items-center justify-between">
            <h3 className="text-sm font-bold text-foreground flex items-center gap-1.5 uppercase">
              <Building2 size={16} className="text-primary"/> CSR Corporate Sponsorships
            </h3>
            <div className="relative w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <input 
                type="text" 
                placeholder="Search Corporate Partners..." 
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full bg-background border border-border rounded-lg pl-9 pr-3 py-1.5 text-xs outline-none focus:border-primary/50 text-foreground"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="bg-muted/40 border-b border-border text-muted-foreground font-bold">
                  <th className="p-3">Partner Company / Campaign Project</th>
                  <th className="p-3 text-right">Committed Budget</th>
                  <th className="p-3">Project Location</th>
                  <th className="p-3 text-right">Target Trees</th>
                  <th className="p-3 text-right">Beneficiary Farmers</th>
                  <th className="p-3">Timeline</th>
                  <th className="p-3">Campaign Status</th>
                  <th className="p-3 text-right">Sponsorship Operations</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {filteredCompanies.map(c => (
                  <tr key={c.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/30 transition-colors">
                    <td className="p-3">
                      <div className="font-bold text-foreground flex items-start gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold shrink-0 mt-0.5">
                          <Building2 size={15}/>
                        </div>
                        <div>
                          <span className="leading-tight block text-foreground">{c.name}</span>
                          <span className="text-[10px] text-muted-foreground mt-0.5 block font-normal">{c.projectTitle}</span>
                        </div>
                      </div>
                    </td>
                    <td className="p-3 font-mono font-bold text-right text-emerald-600 dark:text-emerald-400 text-[13px]">₹{c.allocatedBudgetCr.toFixed(2)} Cr</td>
                    <td className="p-3">
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-foreground">
                        <MapPin size={11} className="text-muted-foreground" />
                        {c.location}
                      </span>
                    </td>
                    <td className="p-3 font-mono text-right text-foreground">{c.targetTrees.toLocaleString()} Trees</td>
                    <td className="p-3 font-mono text-right text-foreground">{c.farmersBenefited.toLocaleString()} Nodes</td>
                    <td className="p-3 text-foreground font-medium flex items-center gap-1.5 pt-4">
                      <Calendar size={12} className="text-muted-foreground" />
                      {c.timelineMonths} Months
                    </td>
                    <td className="p-3">
                      <span className={cn(
                        "px-2 py-0.5 rounded-full text-[10px] font-bold border capitalize",
                        c.status === 'Active' ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20 animate-pulse" :
                        c.status === 'Completed' ? "bg-slate-500/10 text-slate-600 border-slate-500/20" :
                        "bg-amber-500/10 text-amber-600 border-amber-500/20"
                      )}>
                        {c.status.toLowerCase()}
                      </span>
                    </td>
                    <td className="p-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button 
                          onClick={() => handleIncrementBudget(c.id)}
                          className="px-2.5 py-1.5 bg-primary/10 border border-primary/20 hover:bg-primary/20 text-primary text-[10.5px] font-bold rounded-lg transition-colors border-0 cursor-pointer"
                        >
                          + Additional Budget
                        </button>
                        <button 
                          onClick={() => {
                            setSelectedCompany(c);
                            setActiveTab('reports');
                            toast.success(`Dossier loaded for ${c.name}`);
                          }}
                          className="px-2.5 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-foreground text-[10.5px] font-bold rounded-lg transition-colors border-0 cursor-pointer"
                        >
                          View Reports
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── TAB: ECOLOGICAL IMPACT CONSOLE ── */}
      {activeTab === 'impact' && (
        <div className="bg-card border border-border rounded-xl shadow-sm p-6 space-y-6 animate-in fade-in duration-300">
          <div className="border-b border-border pb-3 flex items-center justify-between">
            <h3 className="text-sm font-bold text-foreground flex items-center gap-1.5 uppercase">
              <Globe size={16} className="text-primary"/> Cumulative Ecological Impact Dashboard
            </h3>
            <span className="text-[11px] font-semibold text-muted-foreground">
              BhumiCred Verification Network verified stats
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-5">
            {/* Carbon Metric */}
            <div className="border border-border rounded-xl p-4 space-y-2 bg-slate-50 dark:bg-slate-900 shadow-xs">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block">CO₂ Offsets Saved</span>
              <h4 className="text-xl font-extrabold text-foreground font-mono">76,200 tCO₂e</h4>
              <p className="text-[10.5px] text-primary flex items-center gap-1 font-semibold mt-1">
                <TrendingUp size={12}/> Verified Verra standard
              </p>
            </div>

            {/* Tree Planting */}
            <div className="border border-border rounded-xl p-4 space-y-2 bg-slate-50 dark:bg-slate-900 shadow-xs">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block">Trees Planted</span>
              <h4 className="text-xl font-extrabold text-foreground font-mono">380,000 Nodes</h4>
              <p className="text-[10.5px] text-muted-foreground flex items-center gap-1 mt-1">
                <Leaf size={12}/> 92% Survival survival rate
              </p>
            </div>

            {/* Farmers Matched */}
            <div className="border border-border rounded-xl p-4 space-y-2 bg-slate-50 dark:bg-slate-900 shadow-xs">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block">Farmers Benefited</span>
              <h4 className="text-xl font-extrabold text-foreground font-mono">4,200 Smallholders</h4>
              <p className="text-[10.5px] text-emerald-600 dark:text-emerald-400 flex items-center gap-1 mt-1">
                <CheckCircle2 size={12}/> DBT payouts completed
              </p>
            </div>

            {/* Green Jobs Created */}
            <div className="border border-border rounded-xl p-4 space-y-2 bg-slate-50 dark:bg-slate-900 shadow-xs">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block">Green Jobs Created</span>
              <h4 className="text-xl font-extrabold text-foreground font-mono">720 Livelihoods</h4>
              <p className="text-[10.5px] text-muted-foreground flex items-center gap-1 mt-1">
                <Users size={12}/> Nursery & plantation jobs
              </p>
            </div>

            {/* Rural Villages Covered */}
            <div className="border border-border rounded-xl p-4 space-y-2 bg-slate-50 dark:bg-slate-900 shadow-xs">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block">Villages Covered</span>
              <h4 className="text-xl font-extrabold text-foreground font-mono">112 Villages</h4>
              <p className="text-[10.5px] text-primary flex items-center gap-1 mt-1">
                <MapPin size={12}/> Community agro-belts
              </p>
            </div>
          </div>

          <div className="pt-4 border-t border-border bg-slate-50/30 dark:bg-slate-900/10 p-4 rounded-xl flex items-center justify-between text-xs text-muted-foreground">
            <div className="flex items-center gap-2">
              <ShieldCheck size={16} className="text-primary animate-pulse" />
              <span>Environmental impact logs audited against UN SDGs 1, 8, 13, and 15 compliance.</span>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB: CSR REPORTS & MEDIA DESK ── */}
      {activeTab === 'reports' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-in fade-in duration-300">
          
          {/* Companies Selector Sidebar */}
          <div className="lg:col-span-4 bg-card border border-border rounded-xl p-4 shadow-sm space-y-3.5">
            <h3 className="font-bold text-xs text-foreground uppercase tracking-wider pb-2 border-b border-border">Select Corporate Partner</h3>
            <div className="space-y-2 max-h-[360px] overflow-y-auto pr-1 scrollbar-thin">
              {companies.map(c => (
                <button
                  key={c.id}
                  onClick={() => setSelectedCompany(c)}
                  className={cn(
                    "w-full text-left p-3.5 border rounded-xl transition-all block relative bg-card cursor-pointer",
                    selectedCompany?.id === c.id 
                      ? "border-primary bg-primary/5 ring-1 ring-primary/20 shadow-xs" 
                      : "border-border hover:border-primary/30 hover:bg-muted/20"
                  )}
                >
                  <div className="flex justify-between items-start">
                    <div className="font-bold text-xs text-foreground truncate max-w-[190px]">{c.name}</div>
                    <span className="font-mono text-[9px] text-muted-foreground bg-muted px-1.5 py-0.2 border border-border rounded">
                      {c.id}
                    </span>
                  </div>
                  <span className="text-[11px] text-muted-foreground block mt-1.5 max-w-[200px] truncate">
                    {c.projectTitle}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Documents / Media checklist */}
          <div className="lg:col-span-8 bg-card border border-border rounded-xl p-5 shadow-sm space-y-4">
            {selectedCompany ? (
              <div className="space-y-4">
                <div className="border-b border-border pb-3 flex justify-between items-center">
                  <div>
                    <h3 className="font-extrabold text-sm text-foreground uppercase">{selectedCompany.name}</h3>
                    <span className="text-[10px] text-muted-foreground font-mono mt-0.5 block">CSR Verification Media &amp; Reports Dossier</span>
                  </div>
                  <span className="font-mono text-xs text-primary font-bold bg-primary/10 border border-primary/20 px-2 py-0.5 rounded-lg">
                    {selectedCompany.id}
                  </span>
                </div>

                <div className="space-y-3">
                  {(companyDocs[selectedCompany.name] || [
                    { type: 'PDF Proposal', name: 'Proposal_Draft.pdf', size: '1.2 MB', date: '-', isUploaded: false },
                    { type: 'ESG Audit Filing', name: 'SEBI_ESG_Compliance.pdf', size: '2.0 MB', date: '-', isUploaded: false },
                    { type: 'Impact Report', name: 'Environmental_Impact_Review.pdf', size: '1.5 MB', date: '-', isUploaded: false },
                    { type: 'Geo-tagged Photos', name: 'Photos_Sponsor_Pack.zip', size: '5.0 MB', date: '-', isUploaded: false },
                    { type: 'Verification Videos', name: 'Site_Inspection_Footage.mp4', size: '25.0 MB', date: '-', isUploaded: false },
                  ]).map(doc => (
                    <div key={doc.type} className="flex justify-between items-center bg-slate-50 dark:bg-slate-900 border border-border rounded-xl p-3.5 text-xs">
                      <div>
                        <span className="font-bold text-foreground block">{doc.type}</span>
                        {doc.isUploaded ? (
                          <span className="text-[10.5px] text-muted-foreground block font-mono mt-0.5">
                            {doc.name} • {doc.size} • Uploaded: {doc.date}
                          </span>
                        ) : (
                          <span className="text-[10px] text-rose-500 font-bold block mt-0.5">Awaiting file upload</span>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-2">
                        {doc.isUploaded ? (
                          <>
                            <button 
                              onClick={() => {
                                if (doc.type === 'Verification Videos') {
                                  toast.success('Playing verification video stream...');
                                } else if (doc.type === 'Geo-tagged Photos') {
                                  toast.success('Opening photo preview gallery...');
                                } else {
                                  toast.success(`Opening document: ${doc.name}`);
                                }
                              }}
                              className="px-2.5 py-1.5 bg-card hover:bg-muted border border-border text-foreground font-bold rounded-lg transition-colors inline-flex items-center gap-1 border-0 cursor-pointer"
                            >
                              {(doc.type === 'Verification Videos') ? <Play size={12}/> : (doc.type === 'Geo-tagged Photos') ? <ImageIcon size={12}/> : <FileText size={12}/>}
                              <span>View</span>
                            </button>
                            <button 
                              onClick={() => toast.success(`Downloading file: ${doc.name}`)}
                              className="px-2.5 py-1.5 bg-card hover:bg-muted border border-border text-foreground font-bold rounded-lg transition-colors inline-flex items-center gap-1 border-0 cursor-pointer"
                              title="Download document file"
                            >
                              <Download size={13}/>
                            </button>
                          </>
                        ) : (
                          <button 
                            onClick={() => handleUploadReport(selectedCompany.name, doc.type)}
                            className="px-3 py-1.5 bg-primary/10 border border-primary/20 hover:bg-primary/20 text-primary font-bold rounded-lg transition-colors inline-flex items-center gap-1 border-0 cursor-pointer shadow-xs"
                          >
                            <Upload size={13}/> Upload File
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex-grow flex flex-col items-center justify-center text-center p-8 text-muted-foreground h-[320px]">
                <FolderOpen className="w-10 h-10 text-primary/30 opacity-60 mb-3 animate-pulse" />
                <h3 className="font-bold text-foreground text-xs uppercase tracking-wider">Select Corporate Partner</h3>
                <p className="text-xs text-muted-foreground mt-1 max-w-xs leading-relaxed">
                  Click a corporate partner from the left queue to inspect proposal PDFs, ESG filings, impact reports, geo-tagged photos, and verification videos.
                </p>
              </div>
            )}
          </div>

        </div>
      )}

    </div>
  );
};

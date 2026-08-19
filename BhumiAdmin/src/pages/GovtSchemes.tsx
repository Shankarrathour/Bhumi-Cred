import React, { useState, useMemo } from 'react';
import { 
  Landmark, 
  Search, 
  RefreshCw, 
  CheckCircle2, 
  XCircle, 
  FileText, 
  FolderOpen, 
  Gavel, 
  DollarSign, 
  Calendar, 
  MapPin, 
  Upload, 
  Download, 
  ShieldCheck, 
  Award,
  TrendingUp
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { cn } from '../utils/cn';

// Types
interface TenderItem {
  id: string;
  title: string;
  department: string;
  budgetInrLakhs: number;
  state: string;
  deadline: string;
  status: 'OPEN' | 'APPLIED' | 'WON' | 'LOST' | 'COMPLETED';
  rfpUrl: string;
  boqUrl: string;
}

interface GovtSchemeDetail {
  code: string;
  name: string;
  description: string;
  allocatedBudgetCr: number;
  beneficiaryCount: number;
  activeProjects: number;
  fundingSource: 'Central Government' | 'State Government' | 'Joint / DBT Shared';
  status: 'Active' | 'Paused' | 'Review Stage';
}

interface SchemeBudgetLog {
  id: string;
  schemeCode: string;
  amountCr: number;
  allocatedTo: string;
  timestamp: string;
}

export const GovtSchemesPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'tenders' | 'schemes' | 'budget'>('tenders');
  
  // Dashboard Metrics
  const [openCount] = useState(14);
  const [appliedCount, setAppliedCount] = useState(6);
  const [wonCount] = useState(3);
  const [lostCount] = useState(2);
  const [completedCount] = useState(1);

  // Search Filter
  const [searchQuery, setSearchQuery] = useState('');

  // Selected Tender for Document Center Modal
  const [selectedTender, setSelectedTender] = useState<TenderItem | null>(null);
  const [uploadedDocs, setUploadedDocs] = useState<Record<string, boolean>>({});
  
  // Quick budget allocation state
  const [selectedSchemeCode, setSelectedSchemeCode] = useState('PMKSY');
  const [inputBudgetAmount, setInputBudgetAmount] = useState('');
  const [allocationTarget, setAllocationTarget] = useState('Central District Forestry');

  // Initial Seed Tenders Data
  const [tenders, setTenders] = useState<TenderItem[]>([
    { id: 'TND-2026-001', title: 'National Agroforestry Promotion Drive Phase III', department: 'Ministry of Agriculture & Farmers Welfare', budgetInrLakhs: 480.00, state: 'Madhya Pradesh', deadline: '2026-09-15', status: 'OPEN', rfpUrl: '#', boqUrl: '#' },
    { id: 'TND-2026-002', title: 'Community Waste-to-Biochar Plant Setup', department: 'National Clean Air Programme (NCAP)', budgetInrLakhs: 185.00, state: 'Maharashtra', deadline: '2026-09-02', status: 'APPLIED', rfpUrl: '#', boqUrl: '#' },
    { id: 'TND-2026-003', title: 'Coastal Mangrove Carbon Sequestration and Bunding', department: 'Gujarat Forest Department', budgetInrLakhs: 850.00, state: 'Gujarat', deadline: '2026-08-30', status: 'OPEN', rfpUrl: '#', boqUrl: '#' },
    { id: 'TND-2026-004', title: 'State Highway Green Plantation Drive', department: 'National Highways Authority (NHAI)', budgetInrLakhs: 320.00, state: 'Uttar Pradesh', deadline: '2026-08-15', status: 'WON', rfpUrl: '#', boqUrl: '#' },
    { id: 'TND-2026-005', title: 'Arid Belt Silviculture and Soil Moisture Restoration', department: 'Rajasthan Desertification Board', budgetInrLakhs: 240.00, state: 'Rajasthan', deadline: '2026-08-01', status: 'LOST', rfpUrl: '#', boqUrl: '#' },
    { id: 'TND-2026-006', title: 'Bamboo Plantation Afforestation Pilot', department: 'Chhattisgarh Forest Development Board', budgetInrLakhs: 120.00, state: 'Chhattisgarh', deadline: '2026-06-12', status: 'COMPLETED', rfpUrl: '#', boqUrl: '#' },
  ]);

  // Initial Seed Schemes Data
  const [schemes, setSchemes] = useState<GovtSchemeDetail[]>([
    { code: 'PMKSY', name: 'Pradhan Mantri Krishi Sinchayee Yojana', description: 'Promoting organic micro-irrigation and forest-based agriculture sub-programs.', allocatedBudgetCr: 450.00, beneficiaryCount: 22000, activeProjects: 145, fundingSource: 'Joint / DBT Shared', status: 'Active' },
    { code: 'MNREGA', name: 'Mahatma Gandhi National Rural Employment Guarantee Act', description: 'Afforestation, tree plantation, land development, and soil conservation schemes.', allocatedBudgetCr: 1200.00, beneficiaryCount: 85000, activeProjects: 412, fundingSource: 'Central Government', status: 'Active' },
    { code: 'CAMPA', name: 'Compensatory Afforestation Fund Management', description: 'Restoring forest lands, compensating tree cover loss, and soil retention systems.', allocatedBudgetCr: 350.00, beneficiaryCount: 14000, activeProjects: 68, fundingSource: 'Central Government', status: 'Active' },
    { code: 'GIM', name: 'National Mission for a Green India', description: 'Accelerating tree cover density on degraded forest lands with local farmer bodies.', allocatedBudgetCr: 180.00, beneficiaryCount: 8500, activeProjects: 34, fundingSource: 'Central Government', status: 'Active' },
    { code: 'SPP', name: 'State Plantation Program', description: 'State-administered horticulture and community agroforestry distribution systems.', allocatedBudgetCr: 95.00, beneficiaryCount: 12000, activeProjects: 49, fundingSource: 'State Government', status: 'Review Stage' },
    { code: 'NFM', name: 'National Forest Schemes', description: 'Preserving fragile ecological zones, wetlands, and buffer forests via community fencing.', allocatedBudgetCr: 150.00, beneficiaryCount: 5000, activeProjects: 18, fundingSource: 'Central Government', status: 'Paused' },
  ]);

  // Initial Budget Allocation Logs
  const [budgetLogs, setBudgetLogs] = useState<SchemeBudgetLog[]>([
    { id: 'LOG-881', schemeCode: 'PMKSY', amountCr: 12.5, allocatedTo: 'Sehore District Drip Subsidy', timestamp: '2026-08-11 08:30:00' },
    { id: 'LOG-882', schemeCode: 'CAMPA', amountCr: 8.0, allocatedTo: 'Kutch Mangrove Restoration Block B', timestamp: '2026-08-11 09:12:44' },
    { id: 'LOG-883', schemeCode: 'MNREGA', amountCr: 24.0, allocatedTo: 'Bundelkhand Water Shed Plantation', timestamp: '2026-08-11 10:05:12' },
  ]);

  // Handle Mock Document Upload
  const handleUploadDoc = (docType: string) => {
    toast.success(`${docType} upload simulation completed!`);
    setUploadedDocs(prev => ({ ...prev, [docType]: true }));
  };

  // Submit Proposal / Apply for Tender
  const handleApplyTender = () => {
    if (!selectedTender) return;

    // Check if proposal document is uploaded
    if (!uploadedDocs['Proposal Document']) {
      toast.error('Please upload your Proposal Document before submitting.');
      return;
    }

    // Mark tender as applied
    setTenders(prev => 
      prev.map(t => t.id === selectedTender.id ? { ...t, status: 'APPLIED' } : t)
    );
    setAppliedCount(prev => prev + 1);

    toast.success(`Proposal successfully submitted for ${selectedTender.title}! Tender ID: ${selectedTender.id}`);
    setSelectedTender(null);
    setUploadedDocs({});
  };

  // Quick Allocate Budget
  const handleAllocateBudget = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputBudgetAmount || isNaN(Number(inputBudgetAmount)) || Number(inputBudgetAmount) <= 0) {
      toast.error('Please enter a valid budget amount in Crores.');
      return;
    }
    if (!allocationTarget) {
      toast.error('Please specify the allocation target department/project.');
      return;
    }

    const amount = Number(inputBudgetAmount);

    // Update Scheme Budget
    setSchemes(prev => 
      prev.map(s => s.code === selectedSchemeCode ? { ...s, allocatedBudgetCr: s.allocatedBudgetCr + amount } : s)
    );

    // Add Log
    const newLog: SchemeBudgetLog = {
      id: `LOG-${Math.floor(800 + Math.random() * 100)}`,
      schemeCode: selectedSchemeCode,
      amountCr: amount,
      allocatedTo: allocationTarget,
      timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19)
    };

    setBudgetLogs(prev => [newLog, ...prev]);
    toast.success(`Allocated ₹${amount} Cr to ${allocationTarget} under ${selectedSchemeCode}`);
    setInputBudgetAmount('');
  };

  // Sync / Refresh Schemes data
  const handleRefresh = () => {
    toast.success('Schemes, CSR allocations, and active tenders synced.');
  };

  // Filtering based on search query
  const filteredTenders = useMemo(() => {
    const needle = searchQuery.toLowerCase().trim();
    if (!needle) return tenders;
    return tenders.filter(t => 
      t.title.toLowerCase().includes(needle) || 
      t.department.toLowerCase().includes(needle) ||
      t.state.toLowerCase().includes(needle) ||
      t.id.toLowerCase().includes(needle)
    );
  }, [tenders, searchQuery]);

  return (
    <div className="space-y-6 pb-12 transition-colors duration-200 select-none" style={{ fontFamily: "'Inter', sans-serif" }}>
      
      {/* ── Page Header ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/80 pb-5">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-primary/10 border border-primary/20 rounded-full text-[11px] font-semibold text-primary mb-2">
            <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
            BHUMI CREDIT TENDER & SCHEME CONTROL CENTRE
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2.5">
            <Landmark className="w-6 h-6 text-primary" />
            Tenders & Schemes Control
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            Governance portal for national forestry tenders, compensatory afforestation budgets, and direct benefit transfer (DBT) schemes.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button 
            onClick={handleRefresh}
            className="btn-outline text-xs px-3 py-1.5 flex items-center gap-1.5 hover:border-primary/40 transition-colors"
          >
            <RefreshCw size={13} /> Sync System
          </button>
        </div>
      </div>

      {/* ── KPI Grid ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Open Tenders */}
        <div className="bg-card border border-border rounded-xl p-4 flex flex-col justify-between hover:border-primary/30 transition-all shadow-sm">
          <div>
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Open Tenders</p>
            <h3 className="text-xl font-black text-foreground mt-1">{openCount} Active</h3>
          </div>
          <div className="flex items-center gap-1 mt-2 text-[10px] text-primary font-bold">
            <Gavel className="w-3.5 h-3.5" /> Awaiting bids
          </div>
        </div>

        {/* Applied Tenders */}
        <div className="bg-card border border-border rounded-xl p-4 flex flex-col justify-between hover:border-primary/30 transition-all shadow-sm">
          <div>
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Applied/Pending</p>
            <h3 className="text-xl font-black text-blue-600 dark:text-blue-400 mt-1">{appliedCount} Submitted</h3>
          </div>
          <div className="flex items-center gap-1 mt-2 text-[10px] text-blue-600 dark:text-blue-400 font-bold">
            <FileText className="w-3.5 h-3.5 animate-pulse" /> Proposals under review
          </div>
        </div>

        {/* Won Tenders */}
        <div className="bg-card border border-border rounded-xl p-4 flex flex-col justify-between hover:border-primary/30 transition-all shadow-sm">
          <div>
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Tenders Won</p>
            <h3 className="text-xl font-black text-emerald-600 dark:text-emerald-400 mt-1">{wonCount} Allocated</h3>
          </div>
          <div className="flex items-center gap-1 mt-2 text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">
            <Award className="w-3.5 h-3.5" /> Procurement contracts
          </div>
        </div>

        {/* Lost Tenders */}
        <div className="bg-card border border-border rounded-xl p-4 flex flex-col justify-between hover:border-primary/30 transition-all shadow-sm">
          <div>
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Tenders Lost</p>
            <h3 className="text-xl font-black text-foreground mt-1">{lostCount} Finished</h3>
          </div>
          <div className="flex items-center gap-1 mt-2 text-[10px] text-muted-foreground font-bold">
            <XCircle className="w-3.5 h-3.5" /> Non-allotted bids
          </div>
        </div>

        {/* Completed Tenders */}
        <div className="bg-card border border-border rounded-xl p-4 flex flex-col justify-between hover:border-primary/30 transition-all shadow-sm">
          <div>
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Completed Contracts</p>
            <h3 className="text-xl font-black text-foreground mt-1">{completedCount} Executed</h3>
          </div>
          <div className="flex items-center gap-1 mt-2 text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">
            <ShieldCheck className="w-3.5 h-3.5" /> Verification passed
          </div>
        </div>
      </div>

      {/* ── Tab Switcher ── */}
      <div className="flex items-center gap-6 border-b border-border px-1">
        {[
          { id: 'tenders', label: 'Forestry Tenders Desk' },
          { id: 'schemes', label: 'Government & CSR Schemes' },
          { id: 'budget', label: 'Compensatory Budget Allocator' }
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

      {/* ── TAB: FORESTRY TENDERS DESK ── */}
      {activeTab === 'tenders' && (
        <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden animate-in fade-in duration-300">
          <div className="p-4 border-b border-border bg-slate-50/50 dark:bg-slate-900/30 flex items-center justify-between">
            <h3 className="text-sm font-bold text-foreground flex items-center gap-1.5 uppercase">
              <Gavel size={16} className="text-primary"/> Active Forestry & Afforestation Tenders
            </h3>
            <div className="relative w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <input 
                type="text" 
                placeholder="Search Tenders / Departments..." 
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
                  <th className="p-3">Tender Ref / Project Name</th>
                  <th className="p-3">Department / Ministry</th>
                  <th className="p-3 text-right">Budget (INR)</th>
                  <th className="p-3">State / Zone</th>
                  <th className="p-3">Bid Deadline</th>
                  <th className="p-3">Contract Status</th>
                  <th className="p-3 text-right">Proposal Desk</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {filteredTenders.map(t => (
                  <tr key={t.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/30 transition-colors">
                    <td className="p-3">
                      <div className="font-bold text-foreground flex items-start gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold shrink-0 mt-0.5">
                          <Gavel size={15}/>
                        </div>
                        <div>
                          <span className="leading-tight block">{t.title}</span>
                          <span className="text-[10px] text-muted-foreground font-mono mt-0.5 block">{t.id}</span>
                        </div>
                      </div>
                    </td>
                    <td className="p-3 text-muted-foreground">{t.department}</td>
                    <td className="p-3 font-mono font-bold text-right text-foreground">₹{t.budgetInrLakhs.toFixed(2)} Lakhs</td>
                    <td className="p-3">
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-foreground">
                        <MapPin size={11} className="text-muted-foreground" />
                        {t.state}
                      </span>
                    </td>
                    <td className="p-3 text-foreground font-medium flex items-center gap-1.5 pt-4">
                      <Calendar size={12} className="text-muted-foreground" />
                      {t.deadline}
                    </td>
                    <td className="p-3">
                      <span className={cn(
                        "px-2 py-0.5 rounded-full text-[10px] font-bold border capitalize",
                        t.status === 'OPEN' ? "bg-amber-500/10 text-amber-600 border-amber-500/20" :
                        t.status === 'APPLIED' ? "bg-blue-500/10 text-blue-600 border-blue-500/20" :
                        t.status === 'WON' ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20 animate-pulse" :
                        t.status === 'COMPLETED' ? "bg-slate-500/10 text-slate-600 border-slate-500/20" :
                        "bg-rose-500/10 text-rose-600 border-rose-500/20"
                      )}>
                        {t.status.toLowerCase()}
                      </span>
                    </td>
                    <td className="p-3 text-right">
                      {t.status === 'OPEN' ? (
                        <button 
                          onClick={() => setSelectedTender(t)}
                          className="px-3.5 py-1.5 bg-primary hover:bg-primary/95 text-white text-[11px] font-bold rounded-lg transition-colors inline-flex items-center gap-1 border-0 cursor-pointer shadow-xs"
                        >
                          <FolderOpen size={12}/> Submit Proposal
                        </button>
                      ) : (
                        <button 
                          onClick={() => setSelectedTender(t)}
                          className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-foreground text-[11px] font-bold rounded-lg transition-colors inline-flex items-center gap-1 border-0 cursor-pointer"
                        >
                          <FileText size={12}/> View Documents
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── TAB: GOVERNMENT & CSR SCHEMES ── */}
      {activeTab === 'schemes' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 animate-in fade-in duration-300">
          {schemes.map(s => (
            <div key={s.code} className="bg-card border border-border rounded-xl p-5 flex flex-col justify-between hover:border-primary/40 transition-all shadow-sm hover:shadow-md">
              <div className="space-y-3.5">
                <div className="flex justify-between items-start">
                  <div className="bg-primary/10 p-2.5 rounded-xl border border-primary/20 text-primary">
                    <Landmark size={20} />
                  </div>
                  <span className={cn(
                    "px-2.5 py-0.5 rounded-full text-[10px] font-bold border uppercase tracking-wider",
                    s.status === 'Active' ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" :
                    s.status === 'Paused' ? "bg-rose-500/10 text-rose-600 border-rose-500/20" :
                    "bg-amber-500/10 text-amber-600 border-amber-500/20"
                  )}>
                    {s.status}
                  </span>
                </div>

                <div>
                  <h3 className="font-extrabold text-[15px] text-foreground leading-tight">{s.name}</h3>
                  <span className="text-[10px] text-muted-foreground font-mono mt-0.5 block">{s.code} • {s.fundingSource}</span>
                </div>

                <p className="text-xs text-muted-foreground leading-relaxed">{s.description}</p>
              </div>

              <div className="space-y-2 mt-5 border-t border-border/60 pt-3">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-muted-foreground">Budget Allocated:</span>
                  <span className="font-bold text-primary font-mono">₹{s.allocatedBudgetCr.toLocaleString()} Cr</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-muted-foreground">Farmers Enrolled:</span>
                  <span className="font-bold text-foreground font-mono">{s.beneficiaryCount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-muted-foreground">Active Projects:</span>
                  <span className="font-bold text-foreground font-mono">{s.activeProjects}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── TAB: BUDGET ALLOCATOR ── */}
      {activeTab === 'budget' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-in fade-in duration-300">
          
          {/* Allocator Form */}
          <div className="lg:col-span-4 bg-card border border-border rounded-xl p-5 shadow-sm space-y-4 h-fit">
            <div className="border-b border-border pb-3 flex items-center justify-between">
              <h3 className="font-bold text-sm text-foreground uppercase tracking-wider">Fund Allocator</h3>
              <span className="text-[10px] bg-primary/10 text-primary border border-primary/20 px-2 py-0.5 rounded-md font-bold uppercase">
                DBT Portal
              </span>
            </div>

            <form onSubmit={handleAllocateBudget} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-muted-foreground uppercase">Target Scheme</label>
                <select 
                  value={selectedSchemeCode} 
                  onChange={e => setSelectedSchemeCode(e.target.value)}
                  className="w-full bg-background border border-border rounded-lg px-3 py-2 text-xs outline-none focus:border-primary/50 text-foreground"
                >
                  {schemes.map(s => (
                    <option key={s.code} value={s.code}>{s.code} - {s.name.slice(0, 30)}...</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-muted-foreground uppercase">Allocation Amount (in Crores)</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-bold text-xs">₹</span>
                  <input 
                    type="number" 
                    placeholder="e.g. 15"
                    value={inputBudgetAmount} 
                    onChange={e => setInputBudgetAmount(e.target.value)}
                    className="w-full bg-background border border-border rounded-lg pl-6 pr-12 py-2 text-xs outline-none focus:border-primary/50 text-foreground font-mono font-bold"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground font-bold text-[10px]">CR</span>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-muted-foreground uppercase">Target Region / District Project</label>
                <input 
                  type="text" 
                  placeholder="e.g. Nashik Biochar Block D"
                  value={allocationTarget} 
                  onChange={e => setAllocationTarget(e.target.value)}
                  className="w-full bg-background border border-border rounded-lg px-3 py-2 text-xs outline-none focus:border-primary/50 text-foreground"
                />
              </div>

              <button 
                type="submit"
                className="w-full py-2.5 bg-primary hover:bg-primary/95 text-white font-bold uppercase tracking-wider text-xs rounded-lg transition-colors flex items-center justify-center gap-1.5 border-0 cursor-pointer shadow-xs"
              >
                <DollarSign size={13}/> Allocate Funds
              </button>
            </form>
          </div>

          {/* Allocation Logs */}
          <div className="lg:col-span-8 bg-card border border-border rounded-xl p-5 shadow-sm space-y-4">
            <h3 className="font-bold text-sm text-foreground uppercase tracking-wider pb-2 border-b border-border flex items-center gap-1.5">
              <TrendingUp size={15} className="text-primary"/> Compensatory Budget Allocation History
            </h3>
            
            <div className="space-y-2.5 max-h-[300px] overflow-y-auto pr-1 scrollbar-thin">
              {budgetLogs.map(log => (
                <div key={log.id} className="flex justify-between items-center bg-slate-50 dark:bg-slate-900 border border-border rounded-xl p-3.5">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-bold text-xs shrink-0">
                      {log.schemeCode.slice(0, 2)}
                    </div>
                    <div>
                      <h4 className="font-bold text-xs text-foreground uppercase leading-none">{log.allocatedTo}</h4>
                      <span className="text-[10px] text-muted-foreground block mt-1.5">
                        Tied under: {log.schemeCode} • ID: {log.id}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="font-mono font-black text-emerald-600 dark:text-emerald-400 text-sm block">₹{log.amountCr} Cr</span>
                    <span className="text-[10px] text-muted-foreground block mt-1 font-mono">{log.timestamp}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      )}

      {/* ── DOCUMENT CENTER MODAL ── */}
      {selectedTender && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-md p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-[#E8EDF5] relative space-y-4">
            {/* Close Button */}
            <button 
              onClick={() => setSelectedTender(null)}
              className="absolute right-4 top-4 p-1.5 hover:bg-slate-100 text-slate-400 hover:text-slate-700 rounded-lg transition-colors border-0 bg-transparent cursor-pointer"
            >
              <XCircle size={20} />
            </button>

            {/* Modal Header */}
            <div className="flex items-center gap-3 border-b border-[#F1F5F9] pb-4">
              <div className="bg-[#F0FDF4] p-2 rounded-xl border border-[#DCFCE7] text-[#16A34A]">
                <FolderOpen size={22} />
              </div>
              <div>
                <h3 className="font-extrabold text-[15px] text-[#0F172A] uppercase leading-tight">{selectedTender.title}</h3>
                <span className="text-[11px] text-[#64748B] font-mono mt-0.5 block">Tender ID: {selectedTender.id}</span>
              </div>
            </div>

            {/* Document center list */}
            <div className="py-2 space-y-3 text-xs">
              <span className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-widest block mb-1">Tender Document Center</span>
              
              {/* RFP Document (Download) */}
              <div className="flex justify-between items-center p-3 rounded-xl border border-[#E8EDF5] bg-[#F8FAFC]">
                <div>
                  <span className="font-bold text-[#0F172A] block">RFP (Request for Proposal)</span>
                  <span className="text-[10px] text-[#64748B] block font-mono mt-0.5">TND_RFP_V2.pdf • 2.4 MB</span>
                </div>
                <button 
                  onClick={() => toast.success('Downloaded RFP Document')}
                  className="px-3 py-1.5 bg-white hover:bg-[#F1F5F9] border border-[#E2E8F0] text-[#0F172A] font-bold text-[11px] rounded-lg transition-colors flex items-center gap-1 border-0 cursor-pointer"
                >
                  <Download size={13}/> Download
                </button>
              </div>

              {/* BOQ Document (Download) */}
              <div className="flex justify-between items-center p-3 rounded-xl border border-[#E8EDF5] bg-[#F8FAFC]">
                <div>
                  <span className="font-bold text-[#0F172A] block">BOQ (Bill of Quantities)</span>
                  <span className="text-[10px] text-[#64748B] block font-mono mt-0.5">TND_BOQ_V1.xlsx • 540 KB</span>
                </div>
                <button 
                  onClick={() => toast.success('Downloaded BOQ Document')}
                  className="px-3 py-1.5 bg-white hover:bg-[#F1F5F9] border border-[#E2E8F0] text-[#0F172A] font-bold text-[11px] rounded-lg transition-colors flex items-center gap-1 border-0 cursor-pointer"
                >
                  <Download size={13}/> Download
                </button>
              </div>

              {/* Uploads Section */}
              <div className="border-t border-[#F1F5F9] pt-3 space-y-3">
                
                {/* Eligibility Check list (Upload) */}
                <div className="flex justify-between items-center p-3 rounded-xl border border-[#E8EDF5] bg-[#F8FAFC]">
                  <div>
                    <span className="font-bold text-[#0F172A] block">Eligibility Checklist & Annexure</span>
                    <span className="text-[10px] text-[#64748B] block mt-0.5">Verification standard for forest land holding</span>
                  </div>
                  {uploadedDocs['Eligibility Checklist'] ? (
                    <span className="text-[11px] font-bold text-[#16A34A] flex items-center gap-1 font-mono">
                      <CheckCircle2 size={13}/> Uploaded
                    </span>
                  ) : (
                    <button 
                      onClick={() => handleUploadDoc('Eligibility Checklist')}
                      className="px-3 py-1.5 bg-[#F0FDF4] border border-[#DCFCE7] hover:bg-[#DCFCE7] text-[#16A34A] font-bold text-[11px] rounded-lg transition-colors flex items-center gap-1 border-0 cursor-pointer"
                    >
                      <Upload size={13}/> Upload
                    </button>
                  )}
                </div>

                {/* Certificates (Upload) */}
                <div className="flex justify-between items-center p-3 rounded-xl border border-[#E8EDF5] bg-[#F8FAFC]">
                  <div>
                    <span className="font-bold text-[#0F172A] block">Empanelment Certificates</span>
                    <span className="text-[10px] text-[#64748B] block mt-0.5">Auditor and land registration approvals</span>
                  </div>
                  {uploadedDocs['Certificates'] ? (
                    <span className="text-[11px] font-bold text-[#16A34A] flex items-center gap-1 font-mono">
                      <CheckCircle2 size={13}/> Uploaded
                    </span>
                  ) : (
                    <button 
                      onClick={() => handleUploadDoc('Certificates')}
                      className="px-3 py-1.5 bg-[#F0FDF4] border border-[#DCFCE7] hover:bg-[#DCFCE7] text-[#16A34A] font-bold text-[11px] rounded-lg transition-colors flex items-center gap-1 border-0 cursor-pointer"
                    >
                      <Upload size={13}/> Upload
                    </button>
                  )}
                </div>

                {/* Proposal Document (Upload) */}
                <div className="flex justify-between items-center p-3 rounded-xl border border-[#E8EDF5] bg-[#F8FAFC]">
                  <div>
                    <span className="font-bold text-[#0F172A] block">Proposal Document (Required)</span>
                    <span className="text-[10px] text-[#64748B] block mt-0.5">Submit financial bid & implementation layout</span>
                  </div>
                  {uploadedDocs['Proposal Document'] ? (
                    <span className="text-[11px] font-bold text-[#16A34A] flex items-center gap-1 font-mono">
                      <CheckCircle2 size={13}/> Uploaded
                    </span>
                  ) : (
                    <button 
                      onClick={() => handleUploadDoc('Proposal Document')}
                      className="px-3 py-1.5 bg-[#F0FDF4] border border-[#DCFCE7] hover:bg-[#DCFCE7] text-[#16A34A] font-bold text-[11px] rounded-lg transition-colors flex items-center gap-1 border-0 cursor-pointer"
                    >
                      <Upload size={13}/> Upload
                    </button>
                  )}
                </div>

              </div>
            </div>

            {/* Modal Footer */}
            <div className="pt-3 border-t border-[#F1F5F9] flex items-center justify-between gap-3">
              <span className="text-[10.5px] text-[#94A3B8]">
                All uploads require digital signatures.
              </span>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => setSelectedTender(null)}
                  className="px-4 py-2 bg-[#F8FAFC] hover:bg-[#E2E8F0] border border-[#CBD5E1] text-[#0F172A] text-[12px] font-bold rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                {selectedTender.status === 'OPEN' && (
                  <button 
                    onClick={handleApplyTender}
                    className="px-4 py-2 bg-[#16A34A] hover:bg-[#15803D] text-white text-[12px] font-bold rounded-xl flex items-center gap-1 shadow-xs border-0 cursor-pointer"
                  >
                    Submit Bid Application
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

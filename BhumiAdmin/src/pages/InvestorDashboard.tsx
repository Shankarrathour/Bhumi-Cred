import React, { useState, useMemo } from 'react';
import { 
  LineChart, 
  DollarSign, 
  Leaf, 
  Users, 
  TrendingUp, 
  Activity, 
  ShieldCheck, 
  RefreshCw, 
  Download, 
  FolderOpen, 
  Layers,
  Droplets,
  Coins,
  Percent,
  CheckCircle2
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { cn } from '../utils/cn';

// Types
interface CapTableItem {
  shareholder: string;
  sharesOwned: number;
  originalOwnership: number;
  currentOwnership: number;
  type: 'Founder' | 'Co-Founder' | 'Seed VC' | 'ESOP Pool' | 'New Investor';
}

interface FinancialLogItem {
  quarter: string;
  revenueInrCr: number;
  ebitdaInrCr: number;
  expensesInrCr: number;
  cashFlowInrCr: number;
  burnRateInrLakhs: number;
}

export const InvestorDashboardPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'esg' | 'financials' | 'cap-table' | 'documents'>('esg');
  
  // Real-time market state variables
  const [totalRevenueCr] = useState(14.80);
  const [growthPercent] = useState(145.2);
  const [carbonOffsetTons] = useState(128000);
  const [totalProjects] = useState(34);
  const [roiPercent] = useState(18.4);
  const [esgRating] = useState('AAA');

  // Dilution Modeler State
  const [newInvestmentAmountCr, setNewInvestmentAmountCr] = useState('');
  const [preMoneyValuationCr, setPreMoneyValuationCr] = useState('80');

  // ESG Predictor State
  const [predictorCapitalInrCr, setPredictorCapitalInrCr] = useState(10);

  // Initial Seed Shareholders list
  const [capTable] = useState<CapTableItem[]>([
    { shareholder: 'Aarav Sharma (Founder & CEO)', sharesOwned: 4200000, originalOwnership: 42.0, currentOwnership: 42.0, type: 'Founder' },
    { shareholder: 'Devika Patel (Co-Founder & CTO)', sharesOwned: 2800000, originalOwnership: 28.0, currentOwnership: 28.0, type: 'Co-Founder' },
    { shareholder: 'Green Canopy Capital (Seed VC)', sharesOwned: 1800000, originalOwnership: 18.0, currentOwnership: 18.0, type: 'Seed VC' },
    { shareholder: 'ESOP Option Allocation Pool', sharesOwned: 1200000, originalOwnership: 12.0, currentOwnership: 12.0, type: 'ESOP Pool' },
  ]);

  // Initial Financials Quarterly Log
  const [financialLogs] = useState<FinancialLogItem[]>([
    { quarter: 'Q2 FY27 (Curr)', revenueInrCr: 4.80, ebitdaInrCr: 1.10, expensesInrCr: 3.70, cashFlowInrCr: 0.95, burnRateInrLakhs: 42.0 },
    { quarter: 'Q1 FY27', revenueInrCr: 4.10, ebitdaInrCr: 0.90, expensesInrCr: 3.20, cashFlowInrCr: 0.72, burnRateInrLakhs: 45.0 },
    { quarter: 'Q4 FY26', revenueInrCr: 3.40, ebitdaInrCr: 0.65, expensesInrCr: 2.75, cashFlowInrCr: 0.54, burnRateInrLakhs: 48.0 },
    { quarter: 'Q3 FY26', revenueInrCr: 2.50, ebitdaInrCr: 0.40, expensesInrCr: 2.10, cashFlowInrCr: 0.38, burnRateInrLakhs: 50.0 },
  ]);

  // Documents checklist
  const [documents, setDocuments] = useState([
    { name: 'BhumiCred Pitch Deck V4 - August 2026.pdf', type: 'Pitch Deck', size: '4.8 MB', date: '2026-08-01', isDownloaded: false },
    { name: 'Financial Projection Model - FY27-FY31.xlsx', type: 'Financial Model', size: '2.4 MB', date: '2026-07-28', isDownloaded: false },
    { name: 'Series A Term Sheet Draft - Clean Copy.pdf', type: 'Term Sheet', size: '890 KB', date: '2026-08-05', isDownloaded: false },
    { name: 'Vyas Forest & Verra ESG Audit Certification.pdf', type: 'ESG Audit Certificate', size: '3.1 MB', date: '2026-06-12', isDownloaded: false },
  ]);

  // Calculate simulated dilution
  const calculatedCapTable = useMemo(() => {
    const preMoneyVal = Number(preMoneyValuationCr) || 80;
    const newCapital = Number(newInvestmentAmountCr) || 0;
    if (newCapital <= 0) return capTable;

    const postMoneyVal = preMoneyVal + newCapital;
    const newInvestorOwnership = (newCapital / postMoneyVal) * 100;
    const dilutionFactor = (100 - newInvestorOwnership) / 100;

    const dilutedShares = capTable.map(item => ({
      ...item,
      currentOwnership: item.originalOwnership * dilutionFactor,
    }));

    // Append new investor node
    dilutedShares.push({
      shareholder: 'Diluted Series A Investor Group',
      sharesOwned: Math.floor((newInvestorOwnership / 100) * 10000000), // Mock factor
      originalOwnership: 0,
      currentOwnership: newInvestorOwnership,
      type: 'New Investor',
    });

    return dilutedShares;
  }, [capTable, newInvestmentAmountCr, preMoneyValuationCr]);

  // Calculate Predictor outputs based on Capital sliding scale
  const predictorOutputs = useMemo(() => {
    const capital = predictorCapitalInrCr;
    return {
      co2ReducedTons: capital * 4200,
      treesPlanted: capital * 25000,
      farmersSupported: capital * 350,
      waterSavedLitersMillion: capital * 1.8,
      carbonCreditsGenerated: capital * 3800,
      revenueGeneratedLakhs: capital * 12.5
    };
  }, [predictorCapitalInrCr]);

  // Handle Mock Document download
  const handleDownloadDoc = (docName: string) => {
    toast.success(`Downloaded: ${docName}`);
    setDocuments(prev => 
      prev.map(d => d.name === docName ? { ...d, isDownloaded: true } : d)
    );
  };

  // Sync / Refresh Dashboard
  const handleRefresh = () => {
    toast.success('Cap Table, ESG performance ledger, and Pitch Deck sync completed.');
  };

  return (
    <div className="space-y-6 pb-12 transition-colors duration-200 select-none" style={{ fontFamily: "'Inter', sans-serif" }}>
      
      {/* ── Page Header ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/80 pb-5">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-primary/10 border border-primary/20 rounded-full text-[11px] font-semibold text-primary mb-2">
            <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
            BHUMI CREDIT INVESTOR RELATIONS &amp; ESG COMPLIANCE HUB
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2.5">
            <LineChart className="w-6 h-6 text-primary" />
            Investor &amp; ESG Dashboard
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            Real-time corporate cap table dilution calculator, quarterly financial logs, ESG environmental impact projections, and secure documents room.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button 
            onClick={handleRefresh}
            className="btn-outline text-xs px-3 py-1.5 flex items-center gap-1.5 hover:border-primary/40 transition-colors"
          >
            <RefreshCw size={13} /> Sync Financials
          </button>
        </div>
      </div>

      {/* ── KPI Grid ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
        {/* Revenue */}
        <div className="bg-card border border-border rounded-xl p-4 flex flex-col justify-between hover:border-primary/30 transition-all shadow-sm">
          <div>
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">ARR Revenue</p>
            <h3 className="text-xl font-black text-foreground mt-1">₹{totalRevenueCr} Cr</h3>
          </div>
          <div className="flex items-center gap-1 mt-2 text-[10px] text-primary font-bold">
            <DollarSign className="w-3.5 h-3.5" /> Annual Recurring Revenue
          </div>
        </div>

        {/* Growth */}
        <div className="bg-card border border-border rounded-xl p-4 flex flex-col justify-between hover:border-primary/30 transition-all shadow-sm">
          <div>
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">YoY Growth</p>
            <h3 className="text-xl font-black text-emerald-600 dark:text-emerald-400 mt-1">+{growthPercent}%</h3>
          </div>
          <div className="flex items-center gap-1 mt-2 text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">
            <TrendingUp className="w-3.5 h-3.5" /> Compounded velocity
          </div>
        </div>

        {/* Carbon */}
        <div className="bg-card border border-border rounded-xl p-4 flex flex-col justify-between hover:border-primary/30 transition-all shadow-sm">
          <div>
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Carbon Sequestered</p>
            <h3 className="text-xl font-black text-foreground mt-1">{(carbonOffsetTons / 1000).toFixed(0)}k Tons</h3>
          </div>
          <div className="flex items-center gap-1 mt-2 text-[10px] text-primary font-bold">
            <Leaf className="w-3.5 h-3.5 animate-pulse" /> Verified carbon logs
          </div>
        </div>

        {/* Projects */}
        <div className="bg-card border border-border rounded-xl p-4 flex flex-col justify-between hover:border-primary/30 transition-all shadow-sm">
          <div>
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Registered Projects</p>
            <h3 className="text-xl font-black text-foreground mt-1">{totalProjects} Clusters</h3>
          </div>
          <div className="flex items-center gap-1 mt-2 text-[10px] text-muted-foreground font-bold">
            <Layers className="w-3.5 h-3.5" /> Multi-state tree belts
          </div>
        </div>

        {/* ROI */}
        <div className="bg-card border border-border rounded-xl p-4 flex flex-col justify-between hover:border-primary/30 transition-all shadow-sm">
          <div>
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Average ROI</p>
            <h3 className="text-xl font-black text-foreground mt-1">{roiPercent}% Yield</h3>
          </div>
          <div className="flex items-center gap-1 mt-2 text-[10px] text-primary font-bold">
            <Activity className="w-3.5 h-3.5" /> Farmer profit distribution
          </div>
        </div>

        {/* Impact Rating */}
        <div className="bg-card border border-border rounded-xl p-4 flex flex-col justify-between hover:border-primary/30 transition-all shadow-sm">
          <div>
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">ESG Rating</p>
            <h3 className="text-xl font-black text-emerald-600 dark:text-emerald-400 mt-1">{esgRating} Rating</h3>
          </div>
          <div className="flex items-center gap-1 mt-2 text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">
            <ShieldCheck className="w-3.5 h-3.5" /> AAA environmental score
          </div>
        </div>
      </div>

      {/* ── Sub Tabs ── */}
      <div className="flex items-center gap-6 border-b border-border px-1">
        {[
          { id: 'esg', label: 'ESG Compliance Board' },
          { id: 'financials', label: 'ARR & EBITDA Ledger' },
          { id: 'cap-table', label: 'Cap Table Dilution Modeler' },
          { id: 'documents', label: 'Documents Room' }
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

      {/* ── TAB: ESG COMPLIANCE BOARD ── */}
      {activeTab === 'esg' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-in fade-in duration-300">
          
          {/* ESG KPIs */}
          <div className="lg:col-span-8 space-y-6">
            
            {/* E S G Pillar Breakdown */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {/* Environment Card */}
              <div className="bg-card border border-border rounded-xl p-5 space-y-4 shadow-sm">
                <div className="flex items-center gap-2 border-b border-border pb-2.5">
                  <div className="bg-emerald-50 dark:bg-emerald-950/40 p-2 rounded-lg text-emerald-600 dark:text-emerald-400">
                    <Leaf size={16}/>
                  </div>
                  <h4 className="font-extrabold text-xs text-foreground uppercase tracking-wider">Environment (E)</h4>
                </div>
                <div className="space-y-3 text-xs">
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">CO₂ Reduced:</span>
                    <span className="font-bold text-foreground">128,000 Tons</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Trees Planted:</span>
                    <span className="font-bold text-foreground">380,000 Trees</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Water Saved:</span>
                    <span className="font-bold text-foreground">11.4 Million Liters</span>
                  </div>
                </div>
              </div>

              {/* Social Card */}
              <div className="bg-card border border-border rounded-xl p-5 space-y-4 shadow-sm">
                <div className="flex items-center gap-2 border-b border-border pb-2.5">
                  <div className="bg-blue-50 dark:bg-blue-950/40 p-2 rounded-lg text-blue-600 dark:text-blue-400">
                    <Users size={16}/>
                  </div>
                  <h4 className="font-extrabold text-xs text-foreground uppercase tracking-wider">Social (S)</h4>
                </div>
                <div className="space-y-3 text-xs">
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Farmers Enrolled:</span>
                    <span className="font-bold text-foreground">4,200 smallholders</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Community Payouts:</span>
                    <span className="font-bold text-primary">₹3.8 Cr DBT Net</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Green Jobs Created:</span>
                    <span className="font-bold text-foreground">720 Livelihoods</span>
                  </div>
                </div>
              </div>

              {/* Governance Card */}
              <div className="bg-card border border-border rounded-xl p-5 space-y-4 shadow-sm">
                <div className="flex items-center gap-2 border-b border-border pb-2.5">
                  <div className="bg-amber-50 dark:bg-amber-950/40 p-2 rounded-lg text-amber-600 dark:text-amber-400">
                    <ShieldCheck size={16}/>
                  </div>
                  <h4 className="font-extrabold text-xs text-foreground uppercase tracking-wider">Governance (G)</h4>
                </div>
                <div className="space-y-3 text-xs">
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">ESG Rating Index:</span>
                    <span className="font-bold text-emerald-600 dark:text-emerald-400">AAA Verified</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Audit Compliance:</span>
                    <span className="font-bold text-foreground">100% Sign-off</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">SDGs Supported:</span>
                    <span className="font-bold text-foreground">SDG 1, 8, 13, 15</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Verification Sign-offs */}
            <div className="bg-slate-50 dark:bg-slate-900 border border-border rounded-xl p-4 flex items-center justify-between text-xs text-muted-foreground">
              <div className="flex items-center gap-2">
                <ShieldCheck size={16} className="text-primary" />
                <span>Voluntary carbon offsets audited against UN SDG compliance standards, Verra register tracking, and Vyas Forest compliance.</span>
              </div>
            </div>

          </div>

          {/* Impact Predictor Slider */}
          <div className="lg:col-span-4 bg-card border border-border rounded-xl p-5 shadow-sm space-y-4 h-fit">
            <div className="border-b border-border pb-3">
              <h3 className="font-bold text-xs text-foreground uppercase tracking-wider">ESG Impact Capital Predictor</h3>
              <p className="text-[10px] text-muted-foreground mt-0.5">Drag to forecast ecological returns based on capital investment.</p>
            </div>

            <div className="space-y-4 text-xs">
              <div className="space-y-2">
                <div className="flex justify-between font-bold">
                  <span className="text-muted-foreground uppercase text-[10px]">Investment Capital</span>
                  <span className="text-primary font-mono">₹{predictorCapitalInrCr} Cr</span>
                </div>
                <input 
                  type="range" 
                  min="2" 
                  max="100" 
                  step="2"
                  value={predictorCapitalInrCr}
                  onChange={e => setPredictorCapitalInrCr(Number(e.target.value))}
                  className="w-full accent-primary h-2 bg-muted border border-border rounded-lg outline-none cursor-pointer"
                />
              </div>

              <div className="space-y-2 pt-2 border-t border-border/80">
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block mb-2">Projected Deliverables</span>
                
                <div className="flex justify-between items-center p-2 rounded-lg bg-slate-50 dark:bg-slate-900/60 border border-border/50">
                  <span className="text-muted-foreground flex items-center gap-1"><Leaf size={12}/> Trees Planted:</span>
                  <span className="font-bold text-foreground font-mono">{predictorOutputs.treesPlanted.toLocaleString()}</span>
                </div>

                <div className="flex justify-between items-center p-2 rounded-lg bg-slate-50 dark:bg-slate-900/60 border border-border/50">
                  <span className="text-muted-foreground flex items-center gap-1"><TrendingUp size={12}/> CO₂ Offset (Tons):</span>
                  <span className="font-bold text-foreground font-mono">{predictorOutputs.co2ReducedTons.toLocaleString()}</span>
                </div>

                <div className="flex justify-between items-center p-2 rounded-lg bg-slate-50 dark:bg-slate-900/60 border border-border/50">
                  <span className="text-muted-foreground flex items-center gap-1"><Users size={12}/> Farmers Benefited:</span>
                  <span className="font-bold text-foreground font-mono">{predictorOutputs.farmersSupported.toLocaleString()}</span>
                </div>

                <div className="flex justify-between items-center p-2 rounded-lg bg-slate-50 dark:bg-slate-900/60 border border-border/50">
                  <span className="text-muted-foreground flex items-center gap-1"><Droplets size={12}/> Water Saved (Mn Ltr):</span>
                  <span className="font-bold text-foreground font-mono">{predictorOutputs.waterSavedLitersMillion.toFixed(1)}</span>
                </div>

                <div className="flex justify-between items-center p-2 rounded-lg bg-slate-50 dark:bg-slate-900/60 border border-border/50">
                  <span className="text-muted-foreground flex items-center gap-1"><Coins size={12}/> Carbon Credits:</span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400 font-mono">{predictorOutputs.carbonCreditsGenerated.toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>

        </div>
      )}

      {/* ── TAB: ARR & EBITDA LEDGER ── */}
      {activeTab === 'financials' && (
        <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden animate-in fade-in duration-300">
          <div className="p-4 border-b border-border bg-slate-50/50 dark:bg-slate-900/30 flex items-center justify-between">
            <h3 className="text-sm font-bold text-foreground flex items-center gap-1.5 uppercase">
              <DollarSign size={16} className="text-primary"/> Operational &amp; Financial Ledger
            </h3>
            <span className="text-[10px] text-muted-foreground font-mono">Runway remaining: ~36 Months</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="bg-muted/40 border-b border-border text-muted-foreground font-bold">
                  <th className="p-3">Quarter Period</th>
                  <th className="p-3 text-right">ARR Revenue</th>
                  <th className="p-3 text-right">EBITDA</th>
                  <th className="p-3 text-right">Operational Expenses</th>
                  <th className="p-3 text-right">Net Free Cash Flow</th>
                  <th className="p-3 text-right">Monthly Burn Rate</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {financialLogs.map(log => (
                  <tr key={log.quarter} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/30 transition-colors font-mono">
                    <td className="p-3 font-bold text-foreground font-sans">{log.quarter}</td>
                    <td className="p-3 font-bold text-right text-foreground">₹{log.revenueInrCr.toFixed(2)} Cr</td>
                    <td className="p-3 font-bold text-right text-emerald-600 dark:text-emerald-400">₹{log.ebitdaInrCr.toFixed(2)} Cr</td>
                    <td className="p-3 text-right text-muted-foreground">₹{log.expensesInrCr.toFixed(2)} Cr</td>
                    <td className="p-3 text-right text-foreground font-bold">₹{log.cashFlowInrCr.toFixed(2)} Cr</td>
                    <td className="p-3 text-right text-rose-500 font-bold">₹{log.burnRateInrLakhs.toFixed(1)} Lakhs</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── TAB: CAP TABLE DILUTION MODELER ── */}
      {activeTab === 'cap-table' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-in fade-in duration-300">
          
          {/* Dilution Calculator Form */}
          <div className="lg:col-span-4 bg-card border border-border rounded-xl p-5 shadow-sm space-y-4 h-fit">
            <div className="border-b border-border pb-3 flex items-center justify-between">
              <h3 className="font-bold text-xs text-foreground uppercase tracking-wider">Series A Investment Modeler</h3>
              <span className="text-[10px] bg-primary/10 text-primary border border-primary/20 px-2 py-0.5 rounded font-bold">
                Dilution
              </span>
            </div>

            <div className="space-y-4 text-xs">
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-muted-foreground uppercase">Pre-Money Valuation (INR Crores)</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-bold font-mono">₹</span>
                  <input 
                    type="number" 
                    placeholder="e.g. 80"
                    value={preMoneyValuationCr} 
                    onChange={e => setPreMoneyValuationCr(e.target.value)}
                    className="w-full bg-background border border-border rounded-lg pl-6 pr-12 py-2 text-xs outline-none focus:border-primary/50 text-foreground font-mono font-bold"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground font-bold font-mono">CR</span>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-muted-foreground uppercase">New Capital Investment Amount</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-bold font-mono">₹</span>
                  <input 
                    type="number" 
                    placeholder="Enter Series A amount..."
                    value={newInvestmentAmountCr} 
                    onChange={e => setNewInvestmentAmountCr(e.target.value)}
                    className="w-full bg-background border border-border rounded-lg pl-6 pr-12 py-2 text-xs outline-none focus:border-primary/50 text-primary font-mono font-bold"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground font-bold font-mono">CR</span>
                </div>
              </div>

              <div className="p-3 bg-muted/40 border border-border rounded-xl space-y-2 font-sans">
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block">Valuation Audit</span>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-muted-foreground">Post-Money Valuation:</span>
                  <span className="font-bold text-foreground font-mono">
                    ₹{(Number(preMoneyValuationCr) || 80) + (Number(newInvestmentAmountCr) || 0)} Cr
                  </span>
                </div>
                {Number(newInvestmentAmountCr) > 0 && (
                  <div className="flex justify-between items-center text-xs border-t border-border/60 pt-1">
                    <span className="text-muted-foreground">New Investor Allotment:</span>
                    <span className="font-extrabold text-emerald-600 dark:text-emerald-400 font-mono">
                      {((Number(newInvestmentAmountCr) / ((Number(preMoneyValuationCr) || 80) + Number(newInvestmentAmountCr))) * 100).toFixed(2)}% Shares
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Diluted Cap Table list */}
          <div className="lg:col-span-8 bg-card border border-border rounded-xl p-5 shadow-sm space-y-4">
            <h3 className="font-bold text-sm text-foreground uppercase tracking-wider pb-2 border-b border-border flex items-center gap-1.5">
              <Percent size={15} className="text-primary"/> Diluted Capitalization Table
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="bg-muted/40 border-b border-border text-muted-foreground font-bold">
                    <th className="p-3">Shareholder Entity</th>
                    <th className="p-3">Equity Type</th>
                    <th className="p-3 text-right">Shares Allocated</th>
                    <th className="p-3 text-right">Original Equity %</th>
                    <th className="p-3 text-right">Current/Diluted Equity %</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60 font-mono">
                  {calculatedCapTable.map(item => (
                    <tr key={item.shareholder} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/30 transition-colors">
                      <td className="p-3 font-bold text-foreground font-sans">{item.shareholder}</td>
                      <td className="p-3 font-sans">
                        <span className={cn(
                          "px-2 py-0.5 rounded text-[10px] font-bold border capitalize",
                          item.type === 'Founder' || item.type === 'Co-Founder' ? "bg-blue-500/10 text-blue-600 border-blue-500/20" :
                          item.type === 'Seed VC' ? "bg-amber-500/10 text-amber-600 border-amber-500/20" :
                          item.type === 'ESOP Pool' ? "bg-slate-500/10 text-slate-600 border-slate-500/20" :
                          "bg-emerald-500/10 text-emerald-600 border-emerald-500/20 animate-pulse"
                        )}>
                          {item.type}
                        </span>
                      </td>
                      <td className="p-3 text-right text-muted-foreground">{item.sharesOwned.toLocaleString()}</td>
                      <td className="p-3 text-right text-muted-foreground">{item.originalOwnership.toFixed(1)}%</td>
                      <td className="p-3 text-right text-foreground font-bold text-[13px]">{item.currentOwnership.toFixed(2)}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

      {/* ── TAB: DOCUMENTS ROOM ── */}
      {activeTab === 'documents' && (
        <div className="bg-card border border-border rounded-xl shadow-sm p-5 space-y-4 animate-in fade-in duration-300">
          <div className="border-b border-border pb-3">
            <h3 className="font-bold text-sm text-foreground uppercase tracking-wider flex items-center gap-1.5">
              <FolderOpen size={16} className="text-primary"/> Secure Investor Documents Room
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">Click download to inspect corporate pitch decks, compliance audits, and term sheets.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {documents.map(doc => (
              <div key={doc.name} className="flex justify-between items-center bg-slate-50 dark:bg-slate-900 border border-border rounded-xl p-4 text-xs">
                <div className="space-y-1 max-w-[70%]">
                  <span className="px-2 py-0.5 rounded text-[9.5px] bg-primary/10 text-primary border border-primary/20 font-bold uppercase tracking-wider">
                    {doc.type}
                  </span>
                  <h4 className="font-bold text-foreground truncate mt-1.5 block">{doc.name}</h4>
                  <span className="text-[10px] text-muted-foreground block font-mono">
                    Size: {doc.size} • Released: {doc.date}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {doc.isDownloaded ? (
                    <span className="text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1 text-[11px] font-sans">
                      <CheckCircle2 size={13}/> Downloaded
                    </span>
                  ) : (
                    <button 
                      onClick={() => handleDownloadDoc(doc.name)}
                      className="px-3.5 py-2 bg-primary hover:bg-primary/95 text-white font-bold rounded-lg transition-colors flex items-center gap-1 border-0 cursor-pointer"
                    >
                      <Download size={13}/> Download
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
};

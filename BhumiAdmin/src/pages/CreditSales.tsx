import React, { useState, useEffect, useMemo } from 'react';
import { 
  Leaf, 
  TrendingUp, 
  History, 
  Check, 
  X, 
  Search, 
  Coins, 
  ShieldCheck, 
  CheckCircle2, 
  XCircle, 
  RefreshCw, 
  Calculator, 
  Clock, 
  FileSpreadsheet
} from 'lucide-react';
import adminApi from '../api/apiClient';
import { toast } from 'react-hot-toast';
import { getEnglishApiErrorMessage } from '../utils/apiErrorMessage';
import { cn } from '../utils/cn';

interface SaleRequest {
  id: string;
  farmer_id: string;
  farmer_name: string;
  credits_to_sell: number;
  gross_amount: number;
  platform_fee: number;
  gst_amount: number;
  net_amount: number;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  created_at: string;
}

export const CreditSalesPage: React.FC = () => {
  const [sales, setSales] = useState<SaleRequest[]>([]);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<'PENDING' | 'APPROVED' | 'REJECTED'>('PENDING');
  const [selectedRequest, setSelectedRequest] = useState<SaleRequest | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Dynamic calculated payout state for selected request
  const [grossInput, setGrossInput] = useState<number>(0);

  const fetchSales = async () => {
    setIsLoading(true);
    try {
      const res = await adminApi.get('/admin/sales');
      const data = res.data?.data || [];
      setSales(data);

      // Keep selection synced if open
      if (selectedRequest) {
        const updated = data.find((s: SaleRequest) => s.id === selectedRequest.id);
        if (updated) {
          setSelectedRequest(updated);
          setGrossInput(updated.gross_amount || updated.credits_to_sell * 400);
        }
      }
    } catch (error) {
      toast.error('Failed to load carbon credit sales requests.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSales();
  }, []);

  const handleSelectRequest = (req: SaleRequest) => {
    setSelectedRequest(req);
    setGrossInput(req.gross_amount || req.credits_to_sell * 400);
  };

  const handleReview = async (action: 'APPROVE' | 'REJECT') => {
    if (!selectedRequest) return;
    setProcessingId(selectedRequest.id);
    try {
      const payload: any = { action };
      if (action === 'APPROVE') {
        payload.gross_amount = grossInput > 0 ? grossInput : selectedRequest.credits_to_sell * 400;
      }
      
      await adminApi.post(`/admin/sales/${selectedRequest.id}/review`, payload);
      toast.success(`Request ${action === 'APPROVE' ? 'authorized' : 'rejected'} successfully.`);
      fetchSales();
      setSelectedRequest(null);
    } catch (error) {
      toast.error(getEnglishApiErrorMessage(error, 'Review action failed.'));
    } finally {
      setProcessingId(null);
    }
  };

  // Filtered sales list
  const displayList = useMemo(() => {
    return sales.filter(s => {
      if (s.status !== activeTab) return false;
      const matchesSearch = 
        s.farmer_name.toLowerCase().includes(search.toLowerCase()) ||
        s.id.toLowerCase().includes(search.toLowerCase());
      return matchesSearch;
    });
  }, [sales, activeTab, search]);

  // Financial KPI Metrics
  const totalSoldCredits = useMemo(() => sales.filter(s => s.status === 'APPROVED').reduce((acc, s) => acc + s.credits_to_sell, 0), [sales]);
  const totalRev = useMemo(() => sales.filter(s => s.status === 'APPROVED').reduce((acc, s) => acc + s.gross_amount, 0), [sales]);
  const totalPending = useMemo(() => sales.filter(s => s.status === 'PENDING').reduce((acc, s) => acc + (s.gross_amount || s.credits_to_sell * 400), 0), [sales]);
  const pendingCount = useMemo(() => sales.filter(s => s.status === 'PENDING').length, [sales]);

  // Breakdown calculations
  const platformFee = grossInput * 0.02;
  const gstFee = grossInput * 0.18;
  const netPayout = grossInput - platformFee - gstFee;

  const handleExportCSV = () => {
    if (sales.length === 0) {
      toast.error('No sales data to export');
      return;
    }
    const headers = ["Sale ID", "Farmer Name", "Farmer ID", "Credits to Sell", "Gross Amount", "Net Payout", "Status", "Date"];
    const rows = sales.map(s => [
      s.id,
      `"${s.farmer_name.replace(/"/g, '""')}"`,
      s.farmer_id || 'N/A',
      s.credits_to_sell,
      s.gross_amount || (s.credits_to_sell * 400),
      s.net_amount || (s.credits_to_sell * 400 * 0.8),
      s.status,
      new Date(s.created_at).toLocaleDateString()
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `BhumiCred_Sales_Desk_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Credit sales log exported to CSV');
  };

  return (
    <div className="w-full space-y-6 pb-12 text-foreground select-none">
      
      {/* ── Page Header ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/80 pb-5">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-primary/10 border border-primary/20 rounded-full text-[11px] font-semibold text-primary mb-2">
            <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
            BHUMICRED CREDIT TRADING DESK: ACTIVE
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Coins className="w-6 h-6 text-primary" />
            CREDIT SALES DESK
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            Monitor carbon credit trading, audit buyer requests, and authorize revenue distribution to farmers.
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start md:self-auto">
          <button
            onClick={fetchSales}
            disabled={isLoading}
            className="btn-outline text-xs px-3 py-1.5 flex items-center gap-1.5 hover:border-primary/40 transition-colors"
            title="Refresh Sales Desk"
          >
            <RefreshCw className={cn("w-3.5 h-3.5 text-muted-foreground", isLoading && "animate-spin text-primary")} />
            <span>Refresh</span>
          </button>

          <button
            onClick={handleExportCSV}
            className="btn-primary text-xs px-3.5 py-1.5 shadow-sm"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Export Sales Log</span>
          </button>
        </div>
      </div>

      {/* ── KPI Summary Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Total Market Revenue */}
        <div className="ent-card p-4 flex items-center justify-between">
          <div>
            <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Total Market Revenue</p>
            <h3 className="text-2xl font-bold text-foreground mt-1">₹{totalRev.toLocaleString('en-IN')}</h3>
            <p className="text-[10px] text-muted-foreground mt-0.5">Authorized credit sales revenue</p>
          </div>
          <div className="w-11 h-11 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
            <TrendingUp className="w-5 h-5" />
          </div>
        </div>

        {/* Pending Liabilities */}
        <div className="ent-card p-4 flex items-center justify-between">
          <div>
            <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Pending Liabilities</p>
            <h3 className="text-2xl font-bold text-amber-600 dark:text-amber-400 mt-1">₹{totalPending.toLocaleString('en-IN')}</h3>
            <p className="text-[10px] text-amber-600/80 dark:text-amber-400/80 mt-0.5 flex items-center gap-1">
              <Clock className="w-3 h-3 animate-pulse" /> Awaiting authorization
            </p>
          </div>
          <div className="w-11 h-11 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-600 dark:text-amber-400">
            <History className="w-5 h-5" />
          </div>
        </div>

        {/* Total Credits Traded */}
        <div className="ent-card p-4 flex items-center justify-between">
          <div>
            <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Credits Traded</p>
            <h3 className="text-2xl font-bold text-blue-600 dark:text-blue-400 mt-1">{totalSoldCredits.toLocaleString('en-IN')} t</h3>
            <p className="text-[10px] text-blue-600/80 dark:text-blue-400/80 mt-0.5 flex items-center gap-1">
              <Leaf className="w-3 h-3" /> Transferred CO2e credits
            </p>
          </div>
          <div className="w-11 h-11 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-600 dark:text-blue-400">
            <Leaf className="w-5 h-5" />
          </div>
        </div>

        {/* Pending Queue Count */}
        <div className="ent-card p-4 flex items-center justify-between">
          <div>
            <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Pending Requests</p>
            <h3 className="text-2xl font-bold text-purple-600 dark:text-purple-400 mt-1">{pendingCount}</h3>
            <p className="text-[10px] text-purple-600/80 dark:text-purple-400/80 mt-0.5">In moderation queue</p>
          </div>
          <div className="w-11 h-11 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-600 dark:text-purple-400">
            <ShieldCheck className="w-5 h-5" />
          </div>
        </div>

      </div>

      {/* ── Main Work Grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Sales Queue List */}
        <div className="lg:col-span-1 ent-card p-4 flex flex-col h-[520px] overflow-hidden justify-between space-y-3">
          
          <div className="space-y-3 shrink-0">
            {/* Status Tabs */}
            <div className="flex items-center gap-1 bg-muted/40 p-1 rounded-xl border border-border">
              {(['PENDING', 'APPROVED', 'REJECTED'] as const).map(tab => {
                const count = sales.filter(s => s.status === tab).length;
                return (
                  <button
                    key={tab}
                    onClick={() => {
                      setActiveTab(tab);
                      setSelectedRequest(null);
                    }}
                    className={cn(
                      "flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1.5 capitalize",
                      activeTab === tab 
                        ? "bg-card text-foreground shadow-xs font-bold" 
                        : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                    )}
                  >
                    <span>{tab.toLowerCase()}</span>
                    <span className={cn(
                      "px-1.5 py-0.2 rounded-full text-[10px] font-mono",
                      activeTab === tab ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
                    )}>
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search farmer or request ID..."
                value={search}
                onChange={e => setSearch(e.target.value)}
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

          {/* Scrollable list */}
          <div className="flex-1 overflow-y-auto space-y-2 pt-1 pr-1 scrollbar-thin">
            {isLoading ? (
              Array.from({ length: 5 }).map((_, idx) => (
                <div key={idx} className="p-3 border border-border rounded-xl animate-pulse space-y-2">
                  <div className="h-3 w-32 bg-muted rounded" />
                  <div className="h-2.5 w-20 bg-muted rounded" />
                </div>
              ))
            ) : displayList.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 text-muted-foreground">
                <Coins className="w-8 h-8 text-muted-foreground/40 mb-2" />
                <p className="font-semibold text-foreground text-xs">No Requests Found</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">Sales queue is clear for this status filter.</p>
              </div>
            ) : (
              displayList.map(req => (
                <button
                  key={req.id}
                  onClick={() => handleSelectRequest(req)}
                  className={cn(
                    "w-full text-left p-3 rounded-xl border transition-all block relative bg-card cursor-pointer",
                    selectedRequest?.id === req.id 
                      ? "border-primary bg-primary/5 ring-1 ring-primary/20 shadow-xs" 
                      : "border-border hover:border-primary/30 hover:bg-muted/20"
                  )}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-bold text-xs shrink-0">
                        {req.farmer_name.charAt(0)}
                      </div>
                      <div>
                        <h4 className="font-semibold text-xs text-foreground">{req.farmer_name}</h4>
                        <p className="text-[11px] text-muted-foreground font-mono mt-0.5">
                          ID: {req.id.slice(-8).toUpperCase()} • {new Date(req.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>

                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-mono font-semibold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 dark:text-emerald-400 shrink-0">
                      <Leaf className="w-3 h-3" />
                      {req.credits_to_sell} t
                    </span>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Right Column: Authorization & Payout HUD */}
        <div className="lg:col-span-2 ent-card p-5 flex flex-col h-[520px] overflow-hidden justify-between">
          {selectedRequest ? (
            <div className="flex-1 flex flex-col h-full overflow-hidden justify-between space-y-4">
              
              {/* HUD Header */}
              <div className="flex items-center justify-between border-b border-border/80 pb-3 shrink-0">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-foreground text-sm flex items-center gap-1.5">
                      <Coins className="w-4 h-4 text-primary" />
                      {selectedRequest.farmer_name}
                    </h3>
                    <span className={cn(
                      "px-2.5 py-0.5 rounded-full text-[11px] font-semibold border capitalize",
                      selectedRequest.status === 'APPROVED' ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" :
                      selectedRequest.status === 'PENDING' ? "bg-amber-500/10 text-amber-600 border-amber-500/20" :
                      "bg-rose-500/10 text-rose-600 border-rose-500/20"
                    )}>
                      {selectedRequest.status.toLowerCase()}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    OPEN MARKET AUDIT • REVENUE CALCULATION CONNECTED
                  </p>
                </div>

                <span className="font-mono text-xs text-muted-foreground bg-muted px-2.5 py-1 rounded-lg border border-border">
                  SAL ID: {selectedRequest.id.slice(-12).toUpperCase()}
                </span>
              </div>

              {/* HUD Scrollable Body */}
              <div className="flex-1 overflow-y-auto space-y-4 pr-1 scrollbar-thin">
                
                {/* Farmer & Credit Summary */}
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="ent-card p-3 space-y-0.5">
                    <span className="text-[10px] text-muted-foreground uppercase">Farmer Name</span>
                    <p className="font-bold text-foreground text-sm">{selectedRequest.farmer_name}</p>
                  </div>

                  <div className="ent-card p-3 space-y-0.5">
                    <span className="text-[10px] text-muted-foreground uppercase">Credits To Sell</span>
                    <p className="font-mono font-bold text-emerald-600 dark:text-emerald-400 text-sm flex items-center gap-1">
                      <Leaf className="w-4 h-4" />
                      {selectedRequest.credits_to_sell.toLocaleString()} t CO2e
                    </p>
                  </div>
                </div>

                {/* Gross Amount Input */}
                <div className="ent-card p-4 space-y-2 bg-muted/20">
                  <label className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-1.5">
                    <Calculator className="w-4 h-4 text-primary" />
                    1. Enter Actual Sale Amount (Gross)
                  </label>
                  
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-foreground font-mono font-bold text-sm">₹</span>
                    <input 
                      type="number"
                      value={grossInput}
                      onChange={(e) => setGrossInput(Number(e.target.value) || 0)}
                      disabled={selectedRequest.status !== 'PENDING'}
                      className="w-full pl-8 pr-4 py-2 bg-background border border-border rounded-xl text-sm font-mono font-bold outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 text-foreground transition-all disabled:opacity-70"
                    />
                  </div>
                </div>

                {/* Payout Breakdown Preview */}
                <div className="ent-card p-4 space-y-3">
                  <h4 className="text-xs font-bold text-foreground uppercase tracking-wider">
                    2. Payout Breakdown Preview
                  </h4>

                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Gross Sale Amount:</span>
                      <span className="font-mono font-bold text-foreground">₹{grossInput.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                    </div>

                    <div className="flex justify-between items-center text-rose-600 dark:text-rose-400">
                      <span>Platform Fee (2%):</span>
                      <span className="font-mono font-bold">-₹{platformFee.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                    </div>

                    <div className="flex justify-between items-center text-rose-600 dark:text-rose-400">
                      <span>GST Tax (18%):</span>
                      <span className="font-mono font-bold">-₹{gstFee.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                    </div>

                    <div className="border-t border-border pt-2.5 mt-2 flex justify-between items-center">
                      <span className="font-bold text-foreground text-xs uppercase">NET PAYOUT TO FARMER:</span>
                      <span className="text-lg font-extrabold text-primary font-mono">
                        ₹{netPayout.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Transaction Status Banners */}
                {selectedRequest.status === 'APPROVED' && (
                  <div className="border border-emerald-500/30 bg-emerald-500/10 p-3.5 rounded-xl flex items-center justify-between text-xs">
                    <div>
                      <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold block uppercase">Transaction Authorized</span>
                      <span className="text-foreground font-bold">Revenue disbursed to farmer wallet</span>
                    </div>
                    <ShieldCheck className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                  </div>
                )}

                {selectedRequest.status === 'REJECTED' && (
                  <div className="border border-rose-500/30 bg-rose-500/10 p-3.5 rounded-xl flex items-center justify-between text-xs">
                    <div>
                      <span className="text-[10px] text-rose-600 dark:text-rose-400 font-bold block uppercase">Transaction Rejected</span>
                      <span className="text-foreground font-bold">Credits refunded to farmer account</span>
                    </div>
                    <XCircle className="w-6 h-6 text-rose-600 dark:text-rose-400" />
                  </div>
                )}

              </div>

              {/* Action Buttons Footer */}
              {selectedRequest.status === 'PENDING' && (
                <div className="pt-3 border-t border-border shrink-0 flex items-center gap-3">
                  <button
                    disabled={processingId === selectedRequest.id}
                    onClick={() => handleReview('APPROVE')}
                    className="btn-primary flex-1 h-10 text-xs font-bold justify-center"
                  >
                    {processingId === selectedRequest.id ? <Check className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                    <span>Authorize Sale & Transfer Revenue</span>
                  </button>

                  <button
                    disabled={processingId === selectedRequest.id}
                    onClick={() => handleReview('REJECT')}
                    className="btn-outline border-rose-500/30 text-rose-600 hover:bg-rose-500/10 h-10 px-4 text-xs font-bold justify-center"
                  >
                    <XCircle className="w-4 h-4" />
                    <span>Reject & Refund</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8 text-muted-foreground">
              <Coins className="w-10 h-10 text-primary/30 opacity-60 mb-3 animate-pulse" />
              <h3 className="font-bold text-foreground text-xs uppercase tracking-wider">Select Credit Sale Request</h3>
              <p className="text-xs text-muted-foreground mt-1 max-w-xs leading-relaxed">
                Click a pending carbon credit request from the left queue to audit buyer transactions and authorize revenue payout.
              </p>
            </div>
          )}
        </div>

      </div>

    </div>
  );
};

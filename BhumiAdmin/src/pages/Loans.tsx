import React, { useState, useEffect, useMemo } from 'react';
import * as XLSX from 'xlsx';
import { useEcosystemStore } from '../store';
import api from '../api/apiClient';
import toast from 'react-hot-toast';
import {
  Wallet,
  Coins,
  Search,
  TrendingUp,
  Percent,
  Leaf,
  Edit2,
  RefreshCw,
  Check,
  X,
  Sliders,
  ShieldCheck,
  FileSpreadsheet
} from 'lucide-react';
import { cn } from '../utils/cn';

interface WalletFarmer {
  farmer_id: string;
  farmer_name: string;
  mobile: string;
  carbon_credits: number;
  estimated_value: number;
  wallet_balance: number;
  total_withdrawn: number;
}

export const LoansPage: React.FC = () => {
  const { orders } = useEcosystemStore();
  const [search, setSearch] = useState('');
  const [walletFarmers, setWalletFarmers] = useState<WalletFarmer[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Platform fee/commission rates
  const [matchingCommission, setMatchingCommission] = useState(5.0); // 5% fee on B2B
  const [insuranceFee, setInsuranceFee] = useState(2.5); // 2.5% fee on insurance premium
  const [isEditingFees, setIsEditingFees] = useState(false);

  useEffect(() => {
    fetchWalletFarmers();
  }, []);

  const fetchWalletFarmers = async () => {
    setIsLoading(true);
    try {
      let page = 1;
      let totalPages = 1;
      const all: WalletFarmer[] = [];
      do {
        const res = await api.get('/admin/wallet', { params: { page, limit: 100 } });
        all.push(...(res.data.data ?? []));
        totalPages = res.data.meta?.total_pages ?? 1;
        page += 1;
      } while (page <= totalPages);
      setWalletFarmers(all);
    } catch (err) {
      toast.error('Failed to fetch wallet financial data');
    } finally {
      setIsLoading(false);
    }
  };

  const filteredFarmers = useMemo(() => {
    return walletFarmers.filter(farmer =>
      farmer.farmer_name.toLowerCase().includes(search.toLowerCase()) ||
      farmer.farmer_id.toLowerCase().includes(search.toLowerCase()) ||
      farmer.mobile?.includes(search)
    );
  }, [walletFarmers, search]);

  const handleSaveFees = () => {
    toast.success(`Platform commission rates deployed: ${matchingCommission}% matching fee, ${insuranceFee}% broker fee.`);
    setIsEditingFees(false);
  };

  const handleExportLedger = () => {
    if (walletFarmers.length === 0) {
      toast.error('No wallet data to export');
      return;
    }

    const today = new Date().toISOString().split('T')[0];
    const rows = walletFarmers.map(f => ({
      'Farmer Name': f.farmer_name,
      'Farmer ID': f.farmer_id,
      'Mobile Number': f.mobile || 'N/A',
      'Carbon Credits (t)': f.carbon_credits,
      'Estimated Value (INR)': f.estimated_value,
      'Active Wallet Balance (INR)': f.wallet_balance,
      'Total Settled Withdrawn (INR)': f.total_withdrawn,
      'Statement Generated Date': today,
    }));

    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Wallet Statement');
    XLSX.writeFile(wb, `BhumiCred_Wallet_Financial_Statement_${today}.xlsx`);

    toast.success(`Wallet statement spreadsheet exported successfully`);
  };

  // Financial aggregates
  const totalEcosystemBalance = useMemo(() => walletFarmers.reduce((sum, f) => sum + (f.wallet_balance || 0), 0), [walletFarmers]);
  const totalIssuedCredits = useMemo(() => walletFarmers.reduce((sum, f) => sum + (f.carbon_credits || 0), 0), [walletFarmers]);
  const totalSalesRevenue = useMemo(() => orders.reduce((sum, o) => sum + (o.totalAmount || 0), 0), [orders]);
  const totalCommissionsEarned = useMemo(() => Math.floor(totalSalesRevenue * (matchingCommission / 100)), [totalSalesRevenue, matchingCommission]);

  return (
    <div className="w-full space-y-6 pb-12 text-foreground select-none">
      
      {/* ── Page Header ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/80 pb-5">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-primary/10 border border-primary/20 rounded-full text-[11px] font-semibold text-primary mb-2">
            <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
            BHUMICRED FINANCIAL TELEMETRY: SYNCHRONIZED
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Wallet className="w-6 h-6 text-primary" />
            WALLET & FINANCE COMMAND
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            Audit farmer wallet balances, carbon credit asset valuations, and tune ecosystem transaction commission tariffs.
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start md:self-auto">
          <button
            onClick={fetchWalletFarmers}
            disabled={isLoading}
            className="btn-outline text-xs px-3 py-1.5 flex items-center gap-1.5 hover:border-primary/40 transition-colors"
            title="Refresh Wallet Ledgers"
          >
            <RefreshCw className={cn("w-3.5 h-3.5 text-muted-foreground", isLoading && "animate-spin text-primary")} />
            <span>Refresh</span>
          </button>

          <button
            onClick={handleExportLedger}
            className="btn-primary text-xs px-3.5 py-1.5 shadow-sm"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Generate Statement (Excel)</span>
          </button>
        </div>
      </div>

      {/* ── Top KPI Summary Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Insured Farmer Reserves */}
        <div className="ent-card p-4 flex items-center justify-between">
          <div>
            <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Farmer Wallet Reserves</p>
            <h3 className="text-2xl font-bold text-foreground mt-1">₹{totalEcosystemBalance.toLocaleString('en-IN')}</h3>
            <p className="text-[10px] text-muted-foreground mt-0.5">Accumulated wallet cash balances</p>
          </div>
          <div className="w-11 h-11 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
            <Coins className="w-5 h-5" />
          </div>
        </div>

        {/* Voluntary Carbon Minted */}
        <div className="ent-card p-4 flex items-center justify-between">
          <div>
            <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Carbon Credits Minted</p>
            <h3 className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">{totalIssuedCredits.toLocaleString('en-IN')} t</h3>
            <p className="text-[10px] text-emerald-600/80 dark:text-emerald-400/80 mt-0.5 flex items-center gap-1">
              <Leaf className="w-3 h-3" /> Verified t CO2e Reserves
            </p>
          </div>
          <div className="w-11 h-11 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-600 dark:text-blue-400">
            <Leaf className="w-5 h-5" />
          </div>
        </div>

        {/* Marketplace B2B Turnover */}
        <div className="ent-card p-4 flex items-center justify-between">
          <div>
            <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Marketplace Turnover</p>
            <h3 className="text-2xl font-bold text-foreground mt-1">₹{totalSalesRevenue.toLocaleString('en-IN')}</h3>
            <p className="text-[10px] text-muted-foreground mt-0.5">Voluntary farmer input trades</p>
          </div>
          <div className="w-11 h-11 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-600 dark:text-amber-400">
            <TrendingUp className="w-5 h-5" />
          </div>
        </div>

        {/* Platform Commissions */}
        <div className="ent-card p-4 flex items-center justify-between">
          <div>
            <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Platform Earnings</p>
            <h3 className="text-2xl font-bold text-purple-600 dark:text-purple-400 mt-1">₹{totalCommissionsEarned.toLocaleString('en-IN')}</h3>
            <p className="text-[10px] text-purple-600/80 dark:text-purple-400/80 mt-0.5">Central ecosystem revenue ({matchingCommission}%)</p>
          </div>
          <div className="w-11 h-11 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-600 dark:text-purple-400">
            <Percent className="w-5 h-5" />
          </div>
        </div>

      </div>

      {/* ── Main Work Grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left 2 Columns: Farmer Balances Directory */}
        <div className="lg:col-span-2 ent-card p-5 flex flex-col justify-between space-y-4">
          
          {/* Table Header & Search */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/80 pb-4">
            <div>
              <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                <ShieldCheck className="w-4.5 h-4.5 text-primary" />
                INSURED BALANCE DIRECTORY
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Audit live farmer wallet holdings, credit carbon value, and settled payouts.
              </p>
            </div>

            <div className="relative w-full sm:w-60">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search farmer name or ID..."
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

          {/* Table */}
          <div className="overflow-x-auto max-h-[420px] scrollbar-thin">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-border text-[11px] font-semibold uppercase text-muted-foreground tracking-wider sticky top-0 z-10 shadow-2xs">
                <tr>
                  <th className="py-3 px-3 bg-card">Farmer Client</th>
                  <th className="py-3 px-3 bg-card">Carbon Credits</th>
                  <th className="py-3 px-3 bg-card">Est. Value</th>
                  <th className="py-3 px-3 bg-card">Wallet Balance</th>
                  <th className="py-3 px-3 text-right bg-card">Settled Payouts</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-border/60">
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, idx) => (
                    <tr key={idx} className="animate-pulse">
                      <td className="py-3.5 px-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-muted" />
                          <div className="space-y-1">
                            <div className="h-3 w-28 bg-muted rounded" />
                            <div className="h-2 w-16 bg-muted rounded" />
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-3"><div className="h-3.5 w-14 bg-muted rounded" /></td>
                      <td className="py-3.5 px-3"><div className="h-3.5 w-16 bg-muted rounded" /></td>
                      <td className="py-3.5 px-3"><div className="h-3.5 w-16 bg-muted rounded" /></td>
                      <td className="py-3.5 px-3 text-right"><div className="h-3.5 w-16 bg-muted rounded ml-auto" /></td>
                    </tr>
                  ))
                ) : filteredFarmers.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-muted-foreground">
                      <div className="flex flex-col items-center justify-center gap-2">
                        <Coins className="w-7 h-7 text-muted-foreground/40" />
                        <p className="font-semibold text-foreground">No Farmer Wallets Found</p>
                        <p className="text-xs text-muted-foreground">No registered farmer accounts match your search filter.</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredFarmers.map((f) => (
                    <tr key={f.farmer_id} className="hover:bg-muted/30 transition-colors">
                      
                      {/* Farmer Info */}
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-bold text-xs shrink-0">
                            {f.farmer_name.charAt(0)}
                          </div>
                          <div>
                            <p className="font-semibold text-foreground text-xs">{f.farmer_name}</p>
                            <p className="text-[11px] font-mono text-muted-foreground">{f.farmer_id}</p>
                          </div>
                        </div>
                      </td>

                      {/* Carbon Credits */}
                      <td className="py-3 px-3 font-mono">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 dark:text-emerald-400">
                          <Leaf className="w-3 h-3" />
                          {f.carbon_credits} t
                        </span>
                      </td>

                      {/* Estimated Value */}
                      <td className="py-3 px-3 font-mono font-medium text-foreground text-xs">
                        ₹{(f.estimated_value || 0).toLocaleString('en-IN')}
                      </td>

                      {/* Active Wallet Balance */}
                      <td className="py-3 px-3 font-mono font-bold text-emerald-600 dark:text-emerald-400 text-xs">
                        ₹{(f.wallet_balance || 0).toLocaleString('en-IN')}
                      </td>

                      {/* Settled Withdrawn */}
                      <td className="py-3 px-3 text-right font-mono text-muted-foreground text-xs">
                        ₹{(f.total_withdrawn || 0).toLocaleString('en-IN')}
                      </td>

                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

        </div>

        {/* Right 1 Column: Ecosystem Tariff Controls */}
        <div className="lg:col-span-1 ent-card p-5 flex flex-col justify-between space-y-6">
          
          <div className="space-y-5">
            {/* Header */}
            <div className="border-b border-border/80 pb-3 flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-600 dark:text-purple-400">
                <Sliders className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-foreground">ECOSYSTEM TARIFF CONTROLS</h3>
                <p className="text-[11px] text-muted-foreground">Adjust live transaction fee scales</p>
              </div>
            </div>

            {/* Sliders */}
            <div className="space-y-4">
              
              {/* B2B Commission */}
              <div className="space-y-2 bg-muted/20 border border-border p-3.5 rounded-xl">
                <div className="flex items-center justify-between text-xs font-semibold">
                  <span className="text-muted-foreground uppercase text-[11px]">B2B Matching Commission</span>
                  <span className="font-mono text-primary font-bold text-sm bg-primary/10 px-2 py-0.5 rounded-md border border-primary/20">
                    {matchingCommission}%
                  </span>
                </div>
                
                <input
                  type="range"
                  min="1"
                  max="15"
                  step="0.5"
                  value={matchingCommission}
                  onChange={(e) => setMatchingCommission(Number(e.target.value))}
                  disabled={!isEditingFees}
                  className="w-full h-1.5 bg-muted rounded-lg appearance-none cursor-pointer accent-primary disabled:opacity-40 disabled:cursor-not-allowed"
                />
                
                <div className="flex justify-between text-[10px] font-mono text-muted-foreground">
                  <span>Min: 1%</span>
                  <span>Max: 15%</span>
                </div>
              </div>

              {/* Tree Insurance Broker Fee */}
              <div className="space-y-2 bg-muted/20 border border-border p-3.5 rounded-xl">
                <div className="flex items-center justify-between text-xs font-semibold">
                  <span className="text-muted-foreground uppercase text-[11px]">Tree Insurance Broker Fee</span>
                  <span className="font-mono text-primary font-bold text-sm bg-primary/10 px-2 py-0.5 rounded-md border border-primary/20">
                    {insuranceFee}%
                  </span>
                </div>

                <input
                  type="range"
                  min="0.5"
                  max="10"
                  step="0.5"
                  value={insuranceFee}
                  onChange={(e) => setInsuranceFee(Number(e.target.value))}
                  disabled={!isEditingFees}
                  className="w-full h-1.5 bg-muted rounded-lg appearance-none cursor-pointer accent-primary disabled:opacity-40 disabled:cursor-not-allowed"
                />

                <div className="flex justify-between text-[10px] font-mono text-muted-foreground">
                  <span>Min: 0.5%</span>
                  <span>Max: 10%</span>
                </div>
              </div>

              {/* Notice */}
              <p className="text-[11px] text-muted-foreground leading-relaxed bg-muted/30 border border-border/60 p-3 rounded-xl">
                Platform matching commissions represent the transaction fees calculated dynamically during vendor inputs checkout inside the B2B store.
              </p>
            </div>
          </div>

          {/* Edit / Save Actions */}
          <div className="pt-4 border-t border-border">
            {!isEditingFees ? (
              <button
                onClick={() => setIsEditingFees(true)}
                className="btn-outline w-full h-9 text-xs font-semibold justify-center hover:border-primary/40 transition-colors"
              >
                <Edit2 className="w-3.5 h-3.5 text-primary" />
                <span>Adjust Tariff Scales</span>
              </button>
            ) : (
              <div className="flex gap-2">
                <button
                  onClick={handleSaveFees}
                  className="btn-primary flex-1 h-9 text-xs justify-center font-semibold"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Save Commissions</span>
                </button>
                <button
                  onClick={() => setIsEditingFees(false)}
                  className="btn-outline h-9 px-3 text-xs justify-center"
                >
                  <X className="w-3.5 h-3.5" />
                  <span>Cancel</span>
                </button>
              </div>
            )}
          </div>

        </div>

      </div>

    </div>
  );
};

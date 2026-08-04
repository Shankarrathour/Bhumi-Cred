import React, { useState, useEffect } from 'react';
import { useEcosystemStore } from '../store';
import { WithdrawalRequest } from '../types';
import toast from 'react-hot-toast';
import { 
  Clock, 
  Receipt, 
  ArrowUpRight,
  Search,
  CheckCircle,
  XCircle,
  Coins,
  ShieldCheck,
  Download,
  Building2,
  CheckCircle2,
  RefreshCw,
  Wallet
} from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '../utils/cn';

export const PaymentsPage: React.FC = () => {
  const { withdrawals, processWithdrawal, fetchWithdrawals } = useEcosystemStore();
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<'Pending Approval' | 'Disbursed' | 'Rejected'>('Pending Approval');
  const [selectedRequest, setSelectedRequest] = useState<WithdrawalRequest | null>(null);
  const [remarks, setRemarks] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    fetchWithdrawals();
  }, []);

  const displayList = withdrawals.filter(w => {
    if (w.status !== activeTab) return false;

    const matchesSearch = 
      w.farmerName.toLowerCase().includes(search.toLowerCase()) ||
      w.id.toLowerCase().includes(search.toLowerCase());

    return matchesSearch;
  });

  const handleSelectRequest = (req: WithdrawalRequest) => {
    setSelectedRequest(req);
    setRemarks(req.remarks || 'Farmer identity e-KYC matches. Sufficient credit token balances verified for payout release.');
  };

  const handleProcess = async (status: 'Disbursed' | 'Rejected') => {
    if (!selectedRequest) return;
    setIsProcessing(true);
    try {
      await processWithdrawal(selectedRequest.id, status, 'super_admin', remarks);
      toast.success(`Withdrawal request ${selectedRequest.id} marked as ${status}.`);
      setSelectedRequest(null);
      setRemarks('');
    } catch {
      toast.error('Failed to process withdrawal payout.');
    } finally {
      setIsProcessing(false);
    }
  };

  // CSV Export
  const exportCsv = () => {
    const headers = ['Request ID', 'Farmer Name', 'Amount (INR)', 'Payment Method', 'Bank Name', 'Account Number', 'IFSC Code', 'UPI ID', 'Requested Date', 'Status'];
    const rows = withdrawals.map(w => [
      w.id,
      w.farmerName,
      w.amount,
      w.paymentMethod,
      w.bankName || 'N/A',
      w.accountNumber || 'N/A',
      w.ifscCode || 'N/A',
      w.upiId || 'N/A',
      w.requestedDate,
      w.status
    ]);
    const csvContent = [headers.join(','), ...rows.map(r => r.map(c => `"${c}"`).join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `bhumicred_withdrawals_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    toast.success('Withdrawals CSV exported successfully!');
  };

  // Financial aggregates
  const pendingRequests = withdrawals.filter(w => w.status === 'Pending Approval');
  const disbursedRequests = withdrawals.filter(w => w.status === 'Disbursed');
  const rejectedRequests = withdrawals.filter(w => w.status === 'Rejected');

  const totalPendingPayouts = pendingRequests.reduce((sum, w) => sum + w.amount, 0);
  const totalDisbursedPayouts = disbursedRequests.reduce((sum, w) => sum + w.amount, 0);

  return (
    <div className="w-full text-foreground select-none space-y-6">

      {/* ── Top Header Bar ── */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-primary/10 border border-primary/20 rounded-full text-xs font-semibold text-primary mb-2">
            <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />
            BHUMICRED ESCROW BANKING NETWORKS: LIVE
          </div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">
            Withdrawals &amp; Payouts Desk
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Audit bank accounts, verify e-KYC identities, and issue IMPS wire cashouts to farmers
          </p>
        </div>

        <button
          onClick={exportCsv}
          className="h-10 px-4 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-xs rounded-xl shadow-xs hover:shadow-md transition-all flex items-center gap-2 cursor-pointer self-start lg:self-auto"
        >
          <Download className="w-4 h-4" />
          <span>Export Directory (CSV)</span>
        </button>
      </div>

      {/* ── KPI Telemetry Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Total Disbursed */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card border border-border rounded-2xl p-5 shadow-xs relative overflow-hidden flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
              Total Disbursed Payouts
            </span>
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <ArrowUpRight className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black font-mono text-primary">
              ₹{totalDisbursedPayouts.toLocaleString('en-IN')}
            </div>
            <span className="text-[11px] text-muted-foreground mt-1 block font-medium">
              {disbursedRequests.length} IMPS wires released
            </span>
          </div>
        </motion.div>

        {/* Pending Liabilities */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="bg-card border border-border rounded-2xl p-5 shadow-xs relative overflow-hidden flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
              Pending Payout Liabilities
            </span>
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-600 dark:text-amber-400">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black font-mono text-amber-600 dark:text-amber-400">
              ₹{totalPendingPayouts.toLocaleString('en-IN')}
            </div>
            <span className="text-[11px] text-muted-foreground mt-1 block font-medium">
              {pendingRequests.length} claims awaiting audit
            </span>
          </div>
        </motion.div>

        {/* Successful Disbursements */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-card border border-border rounded-2xl p-5 shadow-xs relative overflow-hidden flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
              Approved Claims
            </span>
            <div className="w-9 h-9 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-600 dark:text-blue-400">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-foreground">
              {disbursedRequests.length}
            </div>
            <span className="text-[11px] text-muted-foreground mt-1 block font-medium">
              100% verified settlement
            </span>
          </div>
        </motion.div>

        {/* Total Claims Queue */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="bg-card border border-border rounded-2xl p-5 shadow-xs relative overflow-hidden flex flex-col justify-between"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
              Total Queue Claims
            </span>
            <div className="w-9 h-9 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center text-violet-600 dark:text-violet-400">
              <Wallet className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-foreground">
              {withdrawals.length}
            </div>
            <span className="text-[11px] text-muted-foreground mt-1 block font-medium">
              Lifetime requests submitted
            </span>
          </div>
        </motion.div>

      </div>

      {/* ── Main Queue & Authorization Work Area ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        
        {/* Left Side: Requests Queue */}
        <div className="lg:col-span-1 bg-card border border-border rounded-2xl p-4 flex flex-col h-[560px] shadow-xs">
          
          {/* Header Controls */}
          <div className="space-y-3 pb-3 border-b border-border">
            
            {/* Status Filter Tabs */}
            <div className="flex bg-muted/40 p-1 rounded-xl border border-border gap-1">
              {(
                [
                  { key: 'Pending Approval', label: 'Pending', count: pendingRequests.length },
                  { key: 'Disbursed',        label: 'Disbursed', count: disbursedRequests.length },
                  { key: 'Rejected',         label: 'Rejected', count: rejectedRequests.length },
                ] as const
              ).map(tab => {
                const isActive = activeTab === tab.key;
                return (
                  <button
                    key={tab.key}
                    onClick={() => {
                      setActiveTab(tab.key);
                      setSelectedRequest(null);
                    }}
                    className={cn(
                      "flex-1 py-1.5 px-2 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1.5 cursor-pointer",
                      isActive
                        ? "bg-card text-foreground shadow-xs border border-border"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    <span>{tab.label}</span>
                    <span className={cn(
                      "px-1.5 py-0.2 rounded-full text-[10px] font-bold",
                      isActive ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
                    )}>
                      {tab.count}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input 
                type="text"
                placeholder="Search farmer name or WTH ID..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-background border border-border rounded-xl text-xs text-foreground outline-none focus:border-primary transition-colors"
              />
            </div>
          </div>

          {/* Scrollable Requests Queue List */}
          <div className="flex-1 overflow-y-auto space-y-2 pt-3 pr-1 scrollbar-thin">
            {displayList.length === 0 ? (
              <div className="text-center py-16 text-muted-foreground border border-dashed border-border rounded-xl p-4 space-y-2">
                <CheckCircle2 className="w-8 h-8 mx-auto text-primary/40" />
                <p className="text-xs font-medium">No claims in {activeTab.toLowerCase()} queue</p>
              </div>
            ) : (
              displayList.map(req => {
                const isSelected = selectedRequest?.id === req.id;
                return (
                  <button
                    key={req.id}
                    onClick={() => handleSelectRequest(req)}
                    className={cn(
                      "w-full text-left p-3.5 rounded-xl border transition-all block cursor-pointer",
                      isSelected
                        ? "border-primary bg-primary/5 shadow-xs" 
                        : "border-border bg-card hover:border-primary/30"
                    )}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-8 h-8 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center font-bold text-xs text-primary shrink-0">
                          {req.farmerName.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <h4 className="font-bold text-xs text-foreground truncate">{req.farmerName}</h4>
                          <p className="text-[10px] text-muted-foreground mt-0.5 truncate">{req.id} · {req.requestedDate}</p>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="font-mono font-bold text-xs text-primary block">
                          ₹{req.amount.toLocaleString('en-IN')}
                        </span>
                        <span className="text-[9px] font-medium text-muted-foreground uppercase">
                          {req.paymentMethod === 'upi' ? 'UPI' : 'Bank Wire'}
                        </span>
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Right Side: Payout Authorization HUD */}
        <div className="lg:col-span-2 bg-card border border-border rounded-2xl p-5 flex flex-col h-[560px] shadow-xs">
          {selectedRequest ? (
            <div className="flex-1 flex flex-col justify-between overflow-hidden">
              
              {/* HUD Header */}
              <div className="flex items-center justify-between border-b border-border pb-4 shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                    <Coins className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-foreground">
                      Payout Authorization Desk: {selectedRequest.farmerName}
                    </h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Bank Ledger Audit · IMPS Gateway Status: Ready
                    </p>
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded-full text-xs font-mono font-bold bg-muted border border-border text-foreground">
                  {selectedRequest.id}
                </span>
              </div>

              {/* HUD Body */}
              <div className="flex-1 overflow-y-auto py-4 space-y-4 pr-1 scrollbar-thin">
                
                {/* Beneficiary Details Card */}
                <div className="bg-muted/20 border border-border rounded-xl p-4 space-y-3">
                  <h4 className="text-xs font-bold text-primary uppercase tracking-wider flex items-center gap-1.5">
                    <Building2 className="w-4 h-4" /> Beneficiary Account Details
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div>
                      <span className="text-[10px] font-semibold text-muted-foreground uppercase block">Farmer Name</span>
                      <span className="font-bold text-foreground text-sm">{selectedRequest.farmerName}</span>
                    </div>
                    <div>
                      <span className="text-[10px] font-semibold text-muted-foreground uppercase block">Transfer Amount</span>
                      <span className="font-mono font-bold text-primary text-sm">₹{selectedRequest.amount.toLocaleString('en-IN')}</span>
                    </div>

                    <div className="sm:col-span-2 pt-2 border-t border-border/50">
                      <span className="text-[10px] font-semibold text-muted-foreground uppercase block">Payment Channel</span>
                      <span className="font-semibold text-foreground">
                        {selectedRequest.paymentMethod === 'upi' ? 'UPI Transfer' : 'Direct Bank IMPS Wire'}
                      </span>
                    </div>

                    {selectedRequest.paymentMethod === 'upi' ? (
                      <div className="sm:col-span-2">
                        <span className="text-[10px] font-semibold text-muted-foreground uppercase block">VPA / UPI Address</span>
                        <span className="font-mono font-bold text-foreground">{selectedRequest.upiId || 'N/A'}</span>
                      </div>
                    ) : (
                      <>
                        <div>
                          <span className="text-[10px] font-semibold text-muted-foreground uppercase block">Bank Name</span>
                          <span className="font-bold text-foreground">{selectedRequest.bankName || 'HDFC Bank'}</span>
                        </div>
                        <div>
                          <span className="text-[10px] font-semibold text-muted-foreground uppercase block">Account Number</span>
                          <span className="font-mono font-bold text-foreground">{selectedRequest.accountNumber || '•••• •••• 4920'}</span>
                        </div>
                        <div>
                          <span className="text-[10px] font-semibold text-muted-foreground uppercase block">IFSC Serial</span>
                          <span className="font-mono font-bold text-foreground">{selectedRequest.ifscCode || 'HDFC000182'}</span>
                        </div>
                        <div>
                          <span className="text-[10px] font-semibold text-muted-foreground uppercase block">Account Holder</span>
                          <span className="font-semibold text-foreground">{selectedRequest.accountHolderName || selectedRequest.farmerName}</span>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* IMPS Hash (If Disbursed) */}
                {selectedRequest.status === 'Disbursed' && selectedRequest.transactionHash && (
                  <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center justify-between text-xs">
                    <div>
                      <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase block">IMPS Bank Transaction Hash</span>
                      <span className="font-mono font-bold text-foreground">{selectedRequest.transactionHash}</span>
                    </div>
                    <ShieldCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                  </div>
                )}

                {/* Auditor Remarks */}
                {selectedRequest.status === 'Pending Approval' && (
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-muted-foreground uppercase block">
                      Finance Auditor Verification Remarks
                    </label>
                    <textarea 
                      value={remarks}
                      onChange={e => setRemarks(e.target.value)}
                      rows={3}
                      className="w-full bg-background border border-border rounded-xl p-3 text-xs text-foreground outline-none focus:border-primary transition-colors resize-none font-sans"
                    />
                  </div>
                )}

              </div>

              {/* Action Buttons Footer */}
              {selectedRequest.status === 'Pending Approval' ? (
                <div className="pt-4 border-t border-border shrink-0 flex items-center justify-end gap-3">
                  <button
                    onClick={() => handleProcess('Rejected')}
                    disabled={isProcessing}
                    className="h-10 px-4 bg-destructive/10 text-destructive border border-destructive/20 hover:bg-destructive/20 font-bold text-xs rounded-xl transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    <XCircle className="w-4 h-4" />
                    <span>Reject Wire</span>
                  </button>
                  <button
                    onClick={() => handleProcess('Disbursed')}
                    disabled={isProcessing}
                    className="h-10 px-5 bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {isProcessing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                    <span>Release IMPS Payout</span>
                  </button>
                </div>
              ) : (
                <div className="pt-4 border-t border-border shrink-0">
                  <div className="p-3 rounded-xl bg-muted border border-border text-center text-xs font-bold text-primary uppercase">
                    Financial Wire Audit Closed: Transaction is {selectedRequest.status}
                  </div>
                </div>
              )}

            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8 space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary animate-pulse">
                <Receipt className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-foreground">Select Withdrawal Claim</h3>
                <p className="text-xs text-muted-foreground max-w-sm mt-1 leading-relaxed">
                  Click a pending cash-out request from the queue to inspect beneficiary bank accounts, IFSC routing details, and release IMPS payouts.
                </p>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};


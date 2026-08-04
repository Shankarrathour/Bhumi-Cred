import React, { useState } from 'react';
import { useEcosystemStore } from '../store';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ShieldCheck, 
  PenTool, 
  CheckSquare,
  ChevronRight,
  Clock,
  FileText,
  X,
  Building,
  Award,
  Sparkles
} from 'lucide-react';
import { cn } from '../utils/cn';
import toast from 'react-hot-toast';

interface EsgSponsorship {
  id: string;
  sponsorName: string;
  campaignTitle: string;
  targetCarbonTons: number;
  offsetCreditsPurchased: number;
  fundingDisbursed: number;
  status: 'Awaiting Matching' | 'Partially Matched' | 'Fulfilled';
  farmerAcreageMatched: number;
  emittedCertificates: {
    certId: string;
    date: string;
    creditsOffset: number;
    hash: string;
  }[];
}

export const ReportApprovalPage: React.FC = () => {

  // Mock initial ESG corporate sponsorships
  const [sponsorships, setSponsorships] = useState<EsgSponsorship[]>([
    {
      id: 'ESG-SPN-001',
      sponsorName: 'Tata Steel International',
      campaignTitle: 'Tata Deccan Afforestation Program',
      targetCarbonTons: 1000,
      offsetCreditsPurchased: 450,
      fundingDisbursed: 180000,
      status: 'Partially Matched',
      farmerAcreageMatched: 85.5,
      emittedCertificates: [
        { certId: 'CERT-TX-8291', date: '2026-03-12', creditsOffset: 250, hash: '0x4f82a9c1e28b3d09a82e91cf8e90bd02' },
        { certId: 'CERT-TX-9821', date: '2026-05-10', creditsOffset: 200, hash: '0x7e290acde82d49a0b12e1f98bcde29c1' }
      ]
    },
    {
      id: 'ESG-SPN-002',
      sponsorName: 'Infosys ESG Foundation',
      campaignTitle: 'Infosys Net-Zero Pune Canopy Drive',
      targetCarbonTons: 500,
      offsetCreditsPurchased: 500,
      fundingDisbursed: 200000,
      status: 'Fulfilled',
      farmerAcreageMatched: 94.0,
      emittedCertificates: [
        { certId: 'CERT-TX-1048', date: '2026-04-18', creditsOffset: 500, hash: '0x902facd82ed48c2a1e8bcde29c1048fd' }
      ]
    },
    {
      id: 'ESG-SPN-003',
      sponsorName: 'HDFC Climate Capital',
      campaignTitle: 'HDFC Karnal Agroforestry Initiative',
      targetCarbonTons: 2000,
      offsetCreditsPurchased: 0,
      fundingDisbursed: 0,
      status: 'Awaiting Matching',
      farmerAcreageMatched: 0,
      emittedCertificates: []
    }
  ]);

  const [selectedSponsorship, setSelectedSponsorship] = useState<EsgSponsorship | null>(sponsorships[0]);
  const [isMatchingDrawerOpen, setIsMatchingDrawerOpen] = useState(false);

  // Match state
  const [matchingCredits, setMatchingCredits] = useState(100);

  const pendingSponsorships = sponsorships.filter(s => s.status !== 'Fulfilled');
  const fulfilledSponsorships = sponsorships.filter(s => s.status === 'Fulfilled');

  const handleCreateOffsetMatch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSponsorship) return;

    const remainingToTarget = selectedSponsorship.targetCarbonTons - selectedSponsorship.offsetCreditsPurchased;
    if (matchingCredits > remainingToTarget) {
      toast.error('Offset match quantity exceeds campaign targets!');
      return;
    }

    const matchedCost = matchingCredits * 400; // INR 400/Credit
    const certId = `CERT-TX-${Math.floor(1000 + Math.random() * 9000)}`;
    const shaHash = `0x${Math.floor(100000000 + Math.random() * 900000000).toString(16)}${Math.floor(100000000 + Math.random() * 900000000).toString(16)}`;

    const updatedCerts = [
      ...selectedSponsorship.emittedCertificates,
      { certId, date: new Date().toISOString().split('T')[0], creditsOffset: matchingCredits, hash: shaHash }
    ];

    const updatedPurchased = selectedSponsorship.offsetCreditsPurchased + matchingCredits;
    const isNowFulfilled = updatedPurchased >= selectedSponsorship.targetCarbonTons;

    const updatedSpon: EsgSponsorship = {
      ...selectedSponsorship,
      offsetCreditsPurchased: updatedPurchased,
      fundingDisbursed: selectedSponsorship.fundingDisbursed + matchedCost,
      status: isNowFulfilled ? 'Fulfilled' : 'Partially Matched',
      farmerAcreageMatched: selectedSponsorship.farmerAcreageMatched + (matchingCredits * 0.15), // Mock factor
      emittedCertificates: updatedCerts
    };

    // Update list
    const newSponsorships = sponsorships.map(s => s.id === selectedSponsorship.id ? updatedSpon : s);
    setSponsorships(newSponsorships);
    setSelectedSponsorship(updatedSpon);
    setIsMatchingDrawerOpen(false);

    // Append audit log to store
    useEcosystemStore.getState().addActivityLog(
      'ESG Compliance Engine',
      'super_admin',
      `Matched ${matchingCredits} carbon credits to Corporate Sponsor ${selectedSponsorship.sponsorName}. Emitted Compliance Certificate ${certId}.`
    );

    toast.success(`E-Offset Match Completed! compliance certificate ${certId} emitted.`);
  };

  const handleRevokeSponsorship = (id: string) => {
    setSponsorships(sponsorships.filter(s => s.id !== id));
    setSelectedSponsorship(null);
    toast.success('ESG corporate sponsorship record revoked.');
  };

  return (
    <div className="pb-12 text-foreground font-sans space-y-6">
      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2.5">
            <Building className="w-6 h-6 text-primary" /> Corporate ESG Campaigns &amp; Carbon Matching
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Audit corporate carbon offset campaigns, match voluntary carbon credits to enterprise sponsors, and sign compliance certificates.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Queues */}
        <div className="space-y-6">
          {/* Active Campaigns */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-amber-600 dark:text-amber-400 flex items-center gap-2 uppercase tracking-wider border-b border-border pb-2">
              <Clock className="w-4 h-4" /> Awaiting Offsets ({pendingSponsorships.length})
            </h3>
            <div className="space-y-3">
              {pendingSponsorships.map(spon => (
                <button
                  key={spon.id}
                  onClick={() => setSelectedSponsorship(spon)}
                  className={cn(
                    "w-full text-left p-4 rounded-xl border transition-all flex justify-between items-center shadow-sm font-sans cursor-pointer group",
                    selectedSponsorship?.id === spon.id 
                      ? "bg-card border-primary ring-1 ring-primary/20" 
                      : "bg-card border-border hover:border-primary/40 hover:shadow-md"
                  )}
                >
                  <div className="space-y-1.5">
                    <div className="font-bold text-sm text-foreground group-hover:text-primary transition-colors">{spon.sponsorName}</div>
                    <div className="text-xs text-muted-foreground line-clamp-1">{spon.campaignTitle}</div>
                    
                    <div className="flex items-center gap-2 pt-1">
                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/50 dark:text-amber-400 dark:border-amber-800">
                        {spon.status}
                      </span>
                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-muted/60 text-muted-foreground border border-border">
                        {spon.offsetCreditsPurchased} / {spon.targetCarbonTons} Tons
                      </span>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                </button>
              ))}
              {pendingSponsorships.length === 0 && (
                <div className="bg-card border border-dashed border-border rounded-xl p-6 text-center text-xs text-muted-foreground">
                  No corporate campaigns requiring matches.
                </div>
              )}
            </div>
          </div>

          {/* Fulfilled Campaigns */}
          <div className="space-y-3 pt-4 border-t border-border">
            <h3 className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-2 uppercase tracking-wider border-b border-border pb-2">
              <ShieldCheck className="w-4 h-4" /> Fulfilled Offsets ({fulfilledSponsorships.length})
            </h3>
            <div className="space-y-2">
              {fulfilledSponsorships.map(spon => (
                <button
                  key={spon.id}
                  onClick={() => setSelectedSponsorship(spon)}
                  className={cn(
                    "w-full text-left p-3.5 rounded-xl border transition-all flex justify-between items-center shadow-sm font-sans cursor-pointer",
                    selectedSponsorship?.id === spon.id 
                      ? "bg-card border-emerald-500 ring-1 ring-emerald-500/20" 
                      : "bg-card border-border hover:border-emerald-500/40"
                  )}
                >
                  <div>
                    <div className="font-bold text-xs text-foreground">{spon.sponsorName}</div>
                    <div className="text-[11px] text-muted-foreground mt-0.5 line-clamp-1">{spon.campaignTitle}</div>
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-400 dark:border-emerald-800 shrink-0">
                    100% Offset
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right 2 Columns: Details & Audit Viewer */}
        <div className="lg:col-span-2">
          <AnimatePresence mode="wait">
            {selectedSponsorship ? (
              <motion.div
                key={selectedSponsorship.id}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-card border border-border rounded-xl shadow-sm overflow-hidden flex flex-col font-sans"
              >
                {/* Action Header Bar */}
                <div className="p-4 bg-muted/40 border-b border-border flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <FileText className="w-5 h-5 text-primary" />
                    <span className="font-bold text-sm text-foreground">Sponsorship Audit Dossier</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {selectedSponsorship.status !== 'Fulfilled' ? (
                      <button 
                        onClick={() => setIsMatchingDrawerOpen(true)}
                        className="h-9 px-4 rounded-lg bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer shadow-sm"
                      >
                        <PenTool className="w-3.5 h-3.5" /> Offset Payout Matching
                      </button>
                    ) : (
                      <div className="flex items-center gap-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-400 dark:border-emerald-800 px-3 py-1 rounded-full text-xs font-semibold">
                        <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" /> Fully Certified
                      </div>
                    )}
                    <button 
                      onClick={() => handleRevokeSponsorship(selectedSponsorship.id)}
                      className="h-9 px-3 rounded-lg border border-destructive/30 hover:bg-destructive/10 text-destructive text-xs font-semibold transition-all cursor-pointer"
                    >
                      Delete
                    </button>
                  </div>
                </div>

                {/* Simulated Sponsorship Details */}
                <div className="p-6 space-y-6">
                  {/* Corporate Info Card */}
                  <div className="border border-border rounded-xl bg-muted/20 p-5 relative">
                    <div className="absolute top-3 right-4 text-xs font-mono text-muted-foreground">ID: {selectedSponsorship.id}</div>
                    <div className="flex items-center gap-3 text-foreground">
                      <div className="bg-primary/10 p-2.5 rounded-xl border border-primary/20 text-primary">
                        <Building className="w-6 h-6" />
                      </div>
                      <div>
                        <h4 className="text-base font-bold text-foreground">{selectedSponsorship.sponsorName}</h4>
                        <p className="text-xs text-muted-foreground mt-0.5">{selectedSponsorship.campaignTitle}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4 mt-5 pt-4 border-t border-border">
                      <div className="bg-card p-3 rounded-lg border border-border">
                        <span className="text-[11px] font-medium text-muted-foreground block">Target Footprint</span>
                        <div className="text-sm font-bold text-foreground mt-0.5">{selectedSponsorship.targetCarbonTons} TCO2e</div>
                      </div>
                      <div className="bg-card p-3 rounded-lg border border-border">
                        <span className="text-[11px] font-medium text-muted-foreground block">Offset Volume</span>
                        <div className="text-sm font-bold text-primary mt-0.5">{selectedSponsorship.offsetCreditsPurchased} TCO2e</div>
                      </div>
                      <div className="bg-card p-3 rounded-lg border border-border">
                        <span className="text-[11px] font-medium text-muted-foreground block">Funding Disbursed</span>
                        <div className="text-sm font-bold text-foreground mt-0.5">₹{selectedSponsorship.fundingDisbursed.toLocaleString()}</div>
                      </div>
                    </div>
                  </div>

                  {/* Offset Progress Bar */}
                  <div className="space-y-2 p-4 border border-border rounded-xl bg-muted/20">
                    <div className="flex justify-between text-xs font-semibold">
                      <span className="text-foreground">Offset Matching Progress</span>
                      <span className="text-primary font-bold">
                        {((selectedSponsorship.offsetCreditsPurchased / selectedSponsorship.targetCarbonTons) * 100).toFixed(1)}%
                      </span>
                    </div>
                    <div className="bg-muted h-2.5 w-full rounded-full overflow-hidden border border-border">
                      <div 
                        className="bg-primary h-full rounded-full transition-all duration-500" 
                        style={{ width: `${(selectedSponsorship.offsetCreditsPurchased / selectedSponsorship.targetCarbonTons) * 100}%` }}
                      />
                    </div>
                  </div>

                  {/* Compliance Offset Certificates Emitted */}
                  <div className="space-y-3">
                    <h4 className="text-sm font-bold text-foreground border-b border-border pb-2 flex items-center gap-2">
                      <Award className="w-4.5 h-4.5 text-primary" /> Emitted Compliance Certificates
                    </h4>
                    
                    <div className="space-y-3 max-h-[240px] overflow-y-auto pr-1">
                      {selectedSponsorship.emittedCertificates.map(cert => (
                        <div key={cert.certId} className="bg-card border border-border rounded-xl p-4 flex justify-between items-center text-xs relative font-sans shadow-sm">
                          <div className="space-y-1">
                            <div className="font-bold text-primary flex items-center gap-2">
                              {cert.certId}
                              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-400 dark:border-emerald-800">Verified</span>
                            </div>
                            <div className="text-muted-foreground text-[11px]">Date: {cert.date}</div>
                            <div className="text-muted-foreground font-mono text-[11px] truncate max-w-[280px]">Hash: {cert.hash}</div>
                          </div>
                          
                          <div className="text-right">
                            <span className="font-bold text-foreground text-sm block">{cert.creditsOffset} Tons CO2</span>
                            <span className="text-[11px] text-muted-foreground">Retired Credits</span>
                          </div>
                        </div>
                      ))}
                      {selectedSponsorship.emittedCertificates.length === 0 && (
                        <div className="text-center p-8 border border-dashed border-border rounded-xl text-muted-foreground text-xs italic">
                          Awaiting environmental certificate emissions.
                        </div>
                      )}
                    </div>
                  </div>

                </div>
              </motion.div>
            ) : (
              <div className="bg-card border border-dashed border-border rounded-xl h-[380px] flex flex-col items-center justify-center text-center p-8 shadow-sm">
                <div className="w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 text-primary flex items-center justify-center mb-3">
                  <ShieldCheck className="w-7 h-7" />
                </div>
                <h3 className="text-base font-bold text-foreground mb-1">Select Sponsor Campaign</h3>
                <p className="text-xs text-muted-foreground max-w-sm leading-relaxed">
                  Choose a corporate sustainability sponsor from the left queue to analyze target metrics, manage acreage offsets, and allocate voluntary farmer credits.
                </p>
              </div>
            )}
          </AnimatePresence>
        </div>

      </div>

      {/* Credit Matching Drawer */}
      <AnimatePresence>
        {isMatchingDrawerOpen && selectedSponsorship && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.6 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 cursor-pointer"
              onClick={() => setIsMatchingDrawerOpen(false)}
            />
            <motion.div 
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-card border-l border-border z-50 shadow-2xl flex flex-col font-sans text-foreground"
            >
              <div className="p-5 border-b border-border bg-muted/30 flex justify-between items-center">
                <h2 className="text-base font-bold flex items-center gap-2 text-foreground">
                  <PenTool className="w-5 h-5 text-primary" /> Match Offset Payouts
                </h2>
                <button 
                  onClick={() => setIsMatchingDrawerOpen(false)} 
                  className="p-1.5 text-muted-foreground hover:text-foreground rounded-lg hover:bg-muted transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCreateOffsetMatch} className="flex-1 overflow-y-auto p-6 space-y-5 text-xs">
                <div className="p-4 bg-primary/10 border border-primary/20 rounded-xl text-primary space-y-1">
                  <div className="font-bold flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4" /> Matching Central Ledger
                  </div>
                  <p className="text-xs text-foreground/80 leading-relaxed font-normal">
                    Retires credits from voluntary carbon projects and credits matching revenue to farmer balances instantly.
                  </p>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground block">Corporate Sponsor</label>
                  <input 
                    disabled 
                    type="text" 
                    className="w-full p-2.5 border border-border bg-muted/40 text-foreground rounded-lg font-bold text-xs outline-none" 
                    value={selectedSponsorship.sponsorName} 
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground block">Sponsorship Campaign</label>
                  <input 
                    disabled 
                    type="text" 
                    className="w-full p-2.5 border border-border bg-muted/40 text-foreground rounded-lg font-bold text-xs outline-none" 
                    value={selectedSponsorship.campaignTitle} 
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground block">Retirement Match Quantity (Tons CO2) *</label>
                  <input 
                    required 
                    type="number" 
                    min={10} 
                    max={selectedSponsorship.targetCarbonTons - selectedSponsorship.offsetCreditsPurchased} 
                    className="w-full p-2.5 border border-border bg-background text-primary rounded-lg font-bold text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all" 
                    value={matchingCredits} 
                    onChange={e => setMatchingCredits(Number(e.target.value))} 
                  />
                  <div className="text-[11px] text-muted-foreground mt-1">
                    Remaining sponsor target: {selectedSponsorship.targetCarbonTons - selectedSponsorship.offsetCreditsPurchased} Tons CO2
                  </div>
                </div>

                <div className="p-4 border border-border bg-muted/30 rounded-xl flex justify-between items-center text-xs">
                  <span className="text-muted-foreground font-medium">Matched Sponsor Funding</span>
                  <span className="text-foreground font-bold text-sm">₹{(matchingCredits * 400).toLocaleString()}</span>
                </div>
                
                <div className="flex justify-end gap-3 pt-4 border-t border-border mt-auto">
                  <button 
                    type="button" 
                    onClick={() => setIsMatchingDrawerOpen(false)} 
                    className="h-9 px-4 border border-border hover:bg-muted font-semibold rounded-lg text-xs transition-all cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    className="h-9 px-5 bg-primary text-primary-foreground hover:bg-primary/90 font-bold rounded-lg text-xs flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
                  >
                    <CheckSquare className="w-4 h-4" /> Retire &amp; Certify
                  </button>
                </div>
              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>

    </div>
  );
};


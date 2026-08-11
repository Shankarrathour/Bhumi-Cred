import React, { useState, useEffect, useMemo } from 'react';
import { 
  Leaf, 
  ArrowLeftRight, 
  TrendingUp, 
  Users, 
  DollarSign, 
  Percent, 
  Clock, 
  Plus, 
  Search, 
  Building2, 
  User, 
  CheckCircle2, 
  XCircle, 
  FileText, 
  RefreshCw, 
  ShieldCheck, 
  Download, 
  CreditCard,
  Building,
  Gavel,
  History,
  TrendingDown,
  Printer
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { cn } from '../utils/cn';

// Types
interface BidAskOrder {
  id: string;
  party: string;
  type: 'BUY' | 'SELL';
  quantity: number;
  price: number;
  projectType: string;
  vintage: number;
  status: 'OPEN' | 'MATCHED' | 'CANCELLED';
  timestamp: string;
}

interface LiveAuction {
  id: string;
  projectName: string;
  volume: number;
  currentBid: number;
  buyNow: number;
  timeRemaining: number; // in seconds
  topBidder: string;
  vintage: number;
  projectType: string;
}

interface CorporateBuyer {
  id: string;
  company: string;
  demand: number;
  budget: number;
  projectType: string;
  vintage: number;
}

interface MatchedTrade {
  id: string;
  seller: string;
  buyer: string;
  quantity: number;
  price: number;
  totalAmount: number;
  commission: number;
  gst: number;
  netPayout: number;
  status: 'PENDING_DISBURSEMENT' | 'SETTLED' | 'INVOICED';
  timestamp: string;
}

export const CarbonExchangePage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'exchange' | 'buyers' | 'ledger' | 'settlement'>('exchange');
  
  // Real-time market state variables
  const [creditsAvailable, setCreditsAvailable] = useState(245000);
  const [creditsSold, setCreditsSold] = useState(154200);
  const [liveBuyersCount, setLiveBuyersCount] = useState(12);
  const [todayRate, setTodayRate] = useState(1285);
  const [averageRate, setAverageRate] = useState(1245);
  const [priceHistory, setPriceHistory] = useState<number[]>([1240, 1245, 1250, 1262, 1270, 1285]);
  const [priceChange, setPriceChange] = useState(2.4);

  // Forms states
  const [orderParty, setOrderParty] = useState('');
  const [orderQuantity, setOrderQuantity] = useState('');
  const [orderPrice, setOrderPrice] = useState('');
  const [orderProjectType, setOrderProjectType] = useState('Agroforestry');
  const [orderVintage, setOrderVintage] = useState(2025);

  // Search filter
  const [searchQuery, setSearchQuery] = useState('');

  // Selected trade for Invoice details
  const [selectedTrade, setSelectedTrade] = useState<MatchedTrade | null>(null);
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);

  // Initial order book seed data
  const [orderBook, setOrderBook] = useState<BidAskOrder[]>([
    { id: 'ORD-001', party: 'Tata Climate Solutions', type: 'BUY', quantity: 8000, price: 1282, projectType: 'Agroforestry', vintage: 2025, status: 'OPEN', timestamp: '10:02:15' },
    { id: 'ORD-002', party: 'Infosys ESG Fund', type: 'BUY', quantity: 5000, price: 1280, projectType: 'Mangrove Reforestation', vintage: 2025, status: 'OPEN', timestamp: '10:04:30' },
    { id: 'ORD-003', party: 'HDFC EcoCorp', type: 'BUY', quantity: 3500, price: 1275, projectType: 'Biochar', vintage: 2026, status: 'OPEN', timestamp: '10:05:12' },
    { id: 'ORD-004', party: 'Adani Green Ventures', type: 'BUY', quantity: 12000, price: 1272, projectType: 'Agroforestry', vintage: 2024, status: 'OPEN', timestamp: '10:05:58' },
    { id: 'ORD-005', party: 'Ramesh Patel (Farmer)', type: 'SELL', quantity: 4500, price: 1290, projectType: 'Agroforestry', vintage: 2025, status: 'OPEN', timestamp: '10:01:05' },
    { id: 'ORD-006', party: 'Suresh Kumar (Farmer)', type: 'SELL', quantity: 3000, price: 1295, projectType: 'Agroforestry', vintage: 2025, status: 'OPEN', timestamp: '10:03:22' },
    { id: 'ORD-007', party: 'MP Agro Forestry Group', type: 'SELL', quantity: 15000, price: 1300, projectType: 'Mangrove Reforestation', vintage: 2025, status: 'OPEN', timestamp: '10:04:55' },
    { id: 'ORD-008', party: 'Gujarat Coastal Farmers', type: 'SELL', quantity: 6000, price: 1305, projectType: 'Mangrove Reforestation', vintage: 2025, status: 'OPEN', timestamp: '10:05:40' },
  ]);

  // Initial Live Auctions seed data
  const [auctions, setAuctions] = useState<LiveAuction[]>([
    { id: 'AUC-101', projectName: 'Sehore Agroforestry Offset (MP)', volume: 15000, currentBid: 1285, buyNow: 1320, timeRemaining: 185, topBidder: 'Wipro Sustainability', vintage: 2025, projectType: 'Agroforestry' },
    { id: 'AUC-102', projectName: 'Kutch Mangrove Blue Carbon (GJ)', volume: 22000, currentBid: 1310, buyNow: 1350, timeRemaining: 420, topBidder: 'Reliance Climate Fund', vintage: 2025, projectType: 'Mangrove Reforestation' },
    { id: 'AUC-103', projectName: 'Nashik Biochar Soil Sink (MH)', volume: 8000, currentBid: 1290, buyNow: 1315, timeRemaining: 95, topBidder: 'ITC Greening India', vintage: 2026, projectType: 'Biochar' },
  ]);

  // Corporate Buyers seed data
  const [buyers] = useState<CorporateBuyer[]>([
    { id: 'BUY-201', company: 'Tata Climate Solutions', demand: 45000, budget: 60000000, projectType: 'Agroforestry', vintage: 2025 },
    { id: 'BUY-202', company: 'Infosys ESG Fund', demand: 30000, budget: 40000000, projectType: 'Mangrove Reforestation', vintage: 2025 },
    { id: 'BUY-203', company: 'Reliance Climate Fund', demand: 75000, budget: 100000000, projectType: 'Mangrove Reforestation', vintage: 2025 },
    { id: 'BUY-204', company: 'HDFC EcoCorp', demand: 15000, budget: 20000000, projectType: 'Biochar', vintage: 2026 },
    { id: 'BUY-205', company: 'Wipro Sustainability', demand: 25000, budget: 33000000, projectType: 'Agroforestry', vintage: 2025 },
    { id: 'BUY-206', company: 'ITC Greening India', demand: 50000, budget: 65000000, projectType: 'Biochar', vintage: 2026 },
  ]);

  // Matched Trades seed data
  const [trades, setTrades] = useState<MatchedTrade[]>([
    { id: 'TRD-901', seller: 'Kamal Kishor (Farmer)', buyer: 'Reliance Climate Fund', quantity: 5000, price: 1280, totalAmount: 6400000, commission: 128000, gst: 1152000, netPayout: 5120000, status: 'SETTLED', timestamp: '2026-08-11 09:30:15' },
    { id: 'TRD-902', seller: 'Venkatesh Rao (Farmer)', buyer: 'Tata Climate Solutions', quantity: 2500, price: 1285, totalAmount: 3212500, commission: 64250, gst: 578250, netPayout: 2570000, status: 'PENDING_DISBURSEMENT', timestamp: '2026-08-11 09:45:22' },
    { id: 'TRD-903', seller: 'Anil Deshmukh (Farmer)', buyer: 'Infosys ESG Fund', quantity: 4000, price: 1278, totalAmount: 5112000, commission: 102240, gst: 920160, netPayout: 4089600, status: 'PENDING_DISBURSEMENT', timestamp: '2026-08-11 10:02:11' },
  ]);

  // Real-time market updates simulation
  useEffect(() => {
    const marketInterval = setInterval(() => {
      // Simulate slight price rate fluctuation (from 1280 to 1295)
      setTodayRate(prev => {
        const diff = Math.random() > 0.45 ? 1 : -1;
        const newRate = Math.max(1275, Math.min(1298, prev + diff));
        
        // Update price change percentage
        const initialRate = 1255;
        const percent = ((newRate - initialRate) / initialRate) * 100;
        setPriceChange(Number(percent.toFixed(2)));
        
        // Append to history
        setPriceHistory(hist => [...hist.slice(1), newRate]);
        return newRate;
      });

      // Fluctuate live buyers slightly
      setLiveBuyersCount(prev => {
        const change = Math.random() > 0.5 ? 1 : -1;
        return Math.max(8, Math.min(18, prev + change));
      });

      // Countdown auctions
      setAuctions(prev => 
        prev.map(auc => {
          if (auc.timeRemaining <= 1) {
            // Restart auction for mock loop
            return {
              ...auc,
              timeRemaining: 300 + Math.floor(Math.random() * 200),
              currentBid: auc.currentBid - 15 - Math.floor(Math.random() * 10),
              topBidder: 'External Corporate'
            };
          }
          return { ...auc, timeRemaining: auc.timeRemaining - 1 };
        })
      );
    }, 3000);

    return () => clearInterval(marketInterval);
  }, []);

  // Filtered orders
  const bids = useMemo(() => orderBook.filter(o => o.type === 'BUY' && o.status === 'OPEN').sort((a, b) => b.price - a.price), [orderBook]);
  const asks = useMemo(() => orderBook.filter(o => o.type === 'SELL' && o.status === 'OPEN').sort((a, b) => a.price - b.price), [orderBook]);

  // Matching Engine Logic
  const checkMatches = (updatedBook: BidAskOrder[]) => {
    const activeBids = updatedBook.filter(o => o.type === 'BUY' && o.status === 'OPEN').sort((a, b) => b.price - a.price);
    const activeAsks = updatedBook.filter(o => o.type === 'SELL' && o.status === 'OPEN').sort((a, b) => a.price - b.price);

    if (activeBids.length > 0 && activeAsks.length > 0) {
      const topBid = activeBids[0];
      const topAsk = activeAsks[0];

      // If bid price is greater or equal to ask price, a match occurs
      if (topBid.price >= topAsk.price) {
        const executionPrice = Math.floor((topBid.price + topAsk.price) / 2);
        const quantity = Math.min(topBid.quantity, topAsk.quantity);
        const totalAmount = executionPrice * quantity;
        const commission = totalAmount * 0.02; // 2% Platform Fee
        const gst = totalAmount * 0.18; // 18% GST on match
        const netPayout = totalAmount - commission - gst;

        toast.success(`Trade Executed! matched ${quantity.toLocaleString()} credits at ₹${executionPrice}/tCO2e`, {
          duration: 5000,
          icon: '🤝'
        });

        // Add to Matched Trades Ledger
        const newTrade: MatchedTrade = {
          id: `TRD-${Math.floor(900 + Math.random() * 100)}`,
          seller: topAsk.party,
          buyer: topBid.party,
          quantity,
          price: executionPrice,
          totalAmount,
          commission,
          gst,
          netPayout,
          status: 'PENDING_DISBURSEMENT',
          timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19)
        };

        setTrades(prev => [newTrade, ...prev]);

        // Update overall stats
        setCreditsSold(prev => prev + quantity);
        setCreditsAvailable(prev => Math.max(0, prev - quantity));

        // Mark orders as matched or reduce quantity
        setOrderBook(prev => 
          prev.map(o => {
            if (o.id === topBid.id) {
              const remaining = o.quantity - quantity;
              return remaining === 0 
                ? { ...o, status: 'MATCHED', quantity } 
                : { ...o, quantity: remaining };
            }
            if (o.id === topAsk.id) {
              const remaining = o.quantity - quantity;
              return remaining === 0 
                ? { ...o, status: 'MATCHED', quantity } 
                : { ...o, quantity: remaining };
            }
            return o;
          })
        );
      }
    }
  };

  // Place order
  const handlePlaceOrder = (type: 'BUY' | 'SELL') => {
    if (!orderParty || !orderQuantity || !orderPrice) {
      toast.error('Please fill in all order details.');
      return;
    }

    const qty = Number(orderQuantity);
    const price = Number(orderPrice);

    if (isNaN(qty) || qty <= 0) {
      toast.error('Quantity must be greater than zero.');
      return;
    }
    if (isNaN(price) || price <= 0) {
      toast.error('Price must be greater than zero.');
      return;
    }

    const newOrder: BidAskOrder = {
      id: `ORD-${Math.floor(100 + Math.random() * 900)}`,
      party: orderParty,
      type,
      quantity: qty,
      price,
      projectType: orderProjectType,
      vintage: orderVintage,
      status: 'OPEN',
      timestamp: new Date().toLocaleTimeString('en-US', { hour12: false })
    };

    const updatedBook = [...orderBook, newOrder];
    setOrderBook(updatedBook);
    toast.success(`${type} Order placed for ${qty.toLocaleString()} tCO₂e at ₹${price}/tCO₂e`);

    // Reset inputs
    setOrderQuantity('');
    setOrderPrice('');

    // Trigger matching engine
    setTimeout(() => checkMatches(updatedBook), 600);
  };

  // Place Bid on Auction
  const handlePlaceBid = (auctionId: string) => {
    setAuctions(prev => 
      prev.map(auc => {
        if (auc.id === auctionId) {
          const increment = Math.floor(5 + Math.random() * 10);
          const newBid = auc.currentBid + increment;
          toast.success(`Bid placed on ${auc.projectName}! New high bid is ₹${newBid}`, {
            icon: '🔨'
          });
          return {
            ...auc,
            currentBid: newBid,
            topBidder: 'You (Admin Desk)',
            timeRemaining: auc.timeRemaining + 15 // Add 15s sniper protection
          };
        }
        return auc;
      })
    );
  };

  // Settle & Disburse DBT
  const handleDisbursePayout = (tradeId: string) => {
    setTrades(prev => 
      prev.map(t => {
        if (t.id === tradeId) {
          toast.success(`DBT Bank transfer of ₹${t.netPayout.toLocaleString('en-IN')} initiated successfully to ${t.seller}'s account!`, {
            duration: 4000,
            icon: '💸'
          });
          return { ...t, status: 'SETTLED' };
        }
        return t;
      })
    );
  };

  // Open Invoice View
  const handleOpenInvoice = (trade: MatchedTrade) => {
    setSelectedTrade(trade);
    setIsInvoiceModalOpen(true);
  };

  // Filtered lists based on search
  const filteredTrades = useMemo(() => {
    const needle = searchQuery.toLowerCase().trim();
    if (!needle) return trades;
    return trades.filter(t => 
      t.seller.toLowerCase().includes(needle) || 
      t.buyer.toLowerCase().includes(needle) ||
      t.id.toLowerCase().includes(needle)
    );
  }, [trades, searchQuery]);

  const filteredSettlements = useMemo(() => {
    return trades.filter(t => 
      !searchQuery || 
      t.seller.toLowerCase().includes(searchQuery.toLowerCase()) || 
      t.id.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [trades, searchQuery]);

  return (
    <div className="space-y-6 pb-12 transition-colors duration-200 select-none" style={{ fontFamily: "'Inter', sans-serif" }}>
      
      {/* ── Page Header ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/80 pb-5">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-primary/10 border border-primary/20 rounded-full text-[11px] font-semibold text-primary mb-2">
            <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
            BHUMI CREDIT TRADING ENGINE LIVE
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <ArrowLeftRight className="w-6 h-6 text-primary animate-pulse" />
            Carbon Credit Exchange
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            Real-time corporate order book, verified farmer credit matching, and direct automated bank DBT settlements.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button 
            onClick={() => {
              setTodayRate(1280);
              toast.success('Market tickers synchronized.');
            }}
            className="btn-outline text-xs px-3 py-1.5 flex items-center gap-1.5 hover:border-primary/40 transition-colors"
          >
            <RefreshCw size={13} /> Sync Market
          </button>
        </div>
      </div>

      {/* ── KPI Grid ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        
        {/* Credits Available */}
        <div className="bg-card border border-border rounded-xl p-4 flex flex-col justify-between hover:border-primary/30 transition-all shadow-sm">
          <div>
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Credits Available</p>
            <h3 className="text-xl font-black text-foreground mt-1">{creditsAvailable.toLocaleString()} tCO₂e</h3>
          </div>
          <div className="flex items-center gap-1 mt-2 text-[10px] text-primary font-bold">
            <Leaf className="w-3.5 h-3.5" /> Listed on order book
          </div>
        </div>

        {/* Credits Sold */}
        <div className="bg-card border border-border rounded-xl p-4 flex flex-col justify-between hover:border-primary/30 transition-all shadow-sm">
          <div>
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Total Credits Sold</p>
            <h3 className="text-xl font-black text-emerald-600 dark:text-emerald-400 mt-1">{creditsSold.toLocaleString()} tCO₂e</h3>
          </div>
          <div className="flex items-center gap-1 mt-2 text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">
            <CheckCircle2 className="w-3.5 h-3.5" /> Cleared settlements
          </div>
        </div>

        {/* Live Buyers */}
        <div className="bg-card border border-border rounded-xl p-4 flex flex-col justify-between hover:border-primary/30 transition-all shadow-sm">
          <div>
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Active Live Buyers</p>
            <h3 className="text-xl font-black text-blue-600 dark:text-blue-400 mt-1">{liveBuyersCount} Corporates</h3>
          </div>
          <div className="flex items-center gap-1 mt-2 text-[10px] text-blue-600 dark:text-blue-400 font-bold">
            <Users className="w-3.5 h-3.5 animate-pulse" /> Bidding currently
          </div>
        </div>

        {/* Today's Rate */}
        <div className="bg-card border border-border rounded-xl p-4 flex flex-col justify-between hover:border-primary/30 transition-all shadow-sm">
          <div>
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Today's Rate (VWAP)</p>
            <h3 className="text-xl font-black text-foreground mt-1">₹{todayRate} <span className="text-xs font-normal">/ t</span></h3>
          </div>
          <div className={cn(
            "flex items-center gap-1 mt-2 text-[10px] font-bold",
            priceChange >= 0 ? "text-primary" : "text-destructive"
          )}>
            {priceChange >= 0 ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
            {priceChange >= 0 ? '+' : ''}{priceChange}% since open
          </div>
        </div>

        {/* Average Rate */}
        <div className="bg-card border border-border rounded-xl p-4 flex flex-col justify-between hover:border-primary/30 transition-all shadow-sm">
          <div>
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Avg Historic Rate</p>
            <h3 className="text-xl font-black text-foreground mt-1">₹{averageRate} <span className="text-xs font-normal">/ t</span></h3>
          </div>
          <div className="flex items-center gap-1 mt-2 text-[10px] text-muted-foreground font-bold">
            <DollarSign className="w-3.5 h-3.5" /> Lifetime average
          </div>
        </div>

      </div>

      {/* ── Sub Navigation Tabs ── */}
      <div className="flex items-center gap-6 border-b border-border px-1">
        {[
          { id: 'exchange', label: 'Exchange & Trading Desk' },
          { id: 'buyers', label: 'Buyer Dashboard' },
          { id: 'ledger', label: 'Trade Match Ledger' },
          { id: 'settlement', label: 'Settlement & DBT Portal' }
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

      {/* ── TAB: EXCHANGE & TRADING DESK ── */}
      {activeTab === 'exchange' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-in fade-in duration-300">
          
          {/* Order Placement Form - 4 cols */}
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-card border border-border rounded-xl p-5 shadow-sm space-y-4">
              <div className="border-b border-border pb-3 flex items-center justify-between">
                <h3 className="font-bold text-sm text-foreground uppercase tracking-wider">Place Trading Order</h3>
                <span className="text-[10px] bg-primary/10 text-primary border border-primary/20 px-2 py-0.5 rounded-md font-bold uppercase">
                  Simulated desk
                </span>
              </div>

              <div className="space-y-3.5">
                {/* Party Name */}
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-muted-foreground uppercase">Executing Party</label>
                  <input 
                    type="text" 
                    placeholder="e.g. Ramesh Patel (Farmer) / Tata Power"
                    value={orderParty} 
                    onChange={e => setOrderParty(e.target.value)}
                    className="w-full bg-background border border-border rounded-lg px-3 py-2 text-xs outline-none focus:border-primary/50 text-foreground"
                  />
                </div>

                {/* Quantity & Price */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-muted-foreground uppercase">Credits (tCO₂e)</label>
                    <input 
                      type="number" 
                      placeholder="Volume"
                      value={orderQuantity} 
                      onChange={e => setOrderQuantity(e.target.value)}
                      className="w-full bg-background border border-border rounded-lg px-3 py-2 text-xs outline-none focus:border-primary/50 text-foreground font-mono"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-muted-foreground uppercase">Price / t (₹)</label>
                    <input 
                      type="number" 
                      placeholder="e.g. 1285"
                      value={orderPrice} 
                      onChange={e => setOrderPrice(e.target.value)}
                      className="w-full bg-background border border-border rounded-lg px-3 py-2 text-xs outline-none focus:border-primary/50 text-foreground font-mono"
                    />
                  </div>
                </div>

                {/* Project Type & Vintage */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-muted-foreground uppercase">Project Type</label>
                    <select 
                      value={orderProjectType} 
                      onChange={e => setOrderProjectType(e.target.value)}
                      className="w-full bg-background border border-border rounded-lg px-3 py-2 text-xs outline-none focus:border-primary/50 text-foreground"
                    >
                      <option value="Agroforestry">Agroforestry</option>
                      <option value="Mangrove Reforestation">Mangrove Blue</option>
                      <option value="Biochar Sequestration">Biochar</option>
                      <option value="Arid Forestry">Arid Forestry</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-muted-foreground uppercase">Vintage Year</label>
                    <select 
                      value={orderVintage} 
                      onChange={e => setOrderVintage(Number(e.target.value))}
                      className="w-full bg-background border border-border rounded-lg px-3 py-2 text-xs outline-none focus:border-primary/50 text-foreground"
                    >
                      <option value={2026}>2026</option>
                      <option value={2025}>2025</option>
                      <option value={2024}>2024</option>
                      <option value={2023}>2023</option>
                    </select>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="grid grid-cols-2 gap-3 pt-2">
                  <button 
                    onClick={() => handlePlaceOrder('BUY')}
                    className="py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold uppercase tracking-wider text-xs rounded-lg transition-colors flex items-center justify-center gap-1.5 shadow-sm border-0 cursor-pointer"
                  >
                    Place Buy Bid
                  </button>
                  <button 
                    onClick={() => handlePlaceOrder('SELL')}
                    className="py-2.5 bg-primary hover:bg-primary/90 text-white font-bold uppercase tracking-wider text-xs rounded-lg transition-colors flex items-center justify-center gap-1.5 shadow-sm border-0 cursor-pointer"
                  >
                    Place Sell Offer
                  </button>
                </div>
              </div>
            </div>

            {/* Quick Stats Panel */}
            <div className="bg-card border border-border rounded-xl p-5 shadow-sm space-y-3.5">
              <h3 className="font-bold text-xs text-foreground uppercase tracking-wider flex items-center gap-1.5"><TrendingUp size={14} className="text-primary"/> Market VWAP Index</h3>
              <div className="space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-muted-foreground">Today's High:</span>
                  <span className="font-bold font-mono text-foreground">₹1,298</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-muted-foreground">Today's Low:</span>
                  <span className="font-bold font-mono text-foreground">₹1,272</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-muted-foreground">Market Spread:</span>
                  <span className="font-bold font-mono text-primary">₹8.00 (0.62%)</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-muted-foreground">Exchange Fee:</span>
                  <span className="font-bold font-mono text-foreground">2% Commission</span>
                </div>
              </div>
              <div className="pt-3 border-t border-border flex items-center justify-between gap-1">
                <span className="text-[10px] text-muted-foreground uppercase">Real-Time Sparkline:</span>
                <div className="flex gap-0.5 items-end h-6 w-32 pb-0.5 bg-slate-50 dark:bg-slate-900 rounded border border-border px-1">
                  {priceHistory.map((val, idx) => {
                    const min = Math.min(...priceHistory);
                    const max = Math.max(...priceHistory);
                    const heightPercent = max === min ? 50 : ((val - min) / (max - min)) * 100;
                    return (
                      <div 
                        key={idx} 
                        style={{ height: `${Math.max(15, heightPercent)}%` }} 
                        className="bg-primary flex-1 transition-all duration-300 rounded-sm"
                      />
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Order Book Panel - 4 cols */}
          <div className="lg:col-span-4 bg-card border border-border rounded-xl p-5 shadow-sm flex flex-col justify-between h-[510px]">
            <div className="space-y-4 flex-1 overflow-hidden flex flex-col">
              <h3 className="font-bold text-sm text-foreground uppercase tracking-wider pb-2 border-b border-border flex items-center gap-1.5">
                <ArrowLeftRight size={15} className="text-primary"/> Order Book (Bids & Asks)
              </h3>
              
              <div className="flex-1 grid grid-rows-2 gap-4 overflow-hidden">
                {/* SELL OFFERS (Asks) - Upper half (asks show red/amber list) */}
                <div className="flex flex-col overflow-hidden">
                  <span className="text-[10px] font-bold text-primary dark:text-emerald-400 mb-1.5 uppercase tracking-widest">Asks / Sell Offers</span>
                  <div className="flex-1 overflow-y-auto space-y-1.5 pr-1 scrollbar-thin">
                    {asks.length === 0 ? (
                      <div className="text-center text-xs text-muted-foreground py-6">No active sell offers</div>
                    ) : (
                      asks.map(o => (
                        <div key={o.id} className="flex justify-between items-center text-xs bg-slate-50 dark:bg-slate-900 px-2.5 py-1.5 border border-border rounded-lg">
                          <div>
                            <span className="font-bold text-foreground truncate max-w-[120px] inline-block align-middle">{o.party}</span>
                            <span className="text-[9px] text-muted-foreground block font-mono">Vintage {o.vintage}</span>
                          </div>
                          <div className="text-right">
                            <span className="font-mono font-bold text-primary dark:text-emerald-500">{o.quantity.toLocaleString()} t</span>
                            <span className="text-[10px] text-foreground font-mono block font-bold">₹{o.price}</span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* BUY BIDS - Lower half (bids show blue list) */}
                <div className="flex flex-col overflow-hidden border-t border-border/60 pt-3">
                  <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 mb-1.5 uppercase tracking-widest">Bids / Buy Orders</span>
                  <div className="flex-1 overflow-y-auto space-y-1.5 pr-1 scrollbar-thin">
                    {bids.length === 0 ? (
                      <div className="text-center text-xs text-muted-foreground py-6">No active buy bids</div>
                    ) : (
                      bids.map(o => (
                        <div key={o.id} className="flex justify-between items-center text-xs bg-slate-50 dark:bg-slate-900 px-2.5 py-1.5 border border-border rounded-lg">
                          <div>
                            <span className="font-bold text-foreground truncate max-w-[120px] inline-block align-middle">{o.party}</span>
                            <span className="text-[9px] text-muted-foreground block font-mono">Vintage {o.vintage}</span>
                          </div>
                          <div className="text-right">
                            <span className="font-mono font-bold text-blue-600 dark:text-blue-400">{o.quantity.toLocaleString()} t</span>
                            <span className="text-[10px] text-foreground font-mono block font-bold">₹{o.price}</span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Live Auctions Panel - 4 cols */}
          <div className="lg:col-span-4 bg-card border border-border rounded-xl p-5 shadow-sm flex flex-col justify-between h-[510px]">
            <div className="space-y-4 flex-1 overflow-hidden flex flex-col">
              <h3 className="font-bold text-sm text-foreground uppercase tracking-wider pb-2 border-b border-border flex items-center gap-1.5">
                <Gavel size={15} className="text-primary"/> Live Auctions & Pools
              </h3>
              
              <div className="flex-1 overflow-y-auto space-y-4 pr-1 scrollbar-thin">
                {auctions.map(auc => (
                  <div key={auc.id} className="border border-border rounded-xl p-4 space-y-3 bg-slate-50/50 dark:bg-slate-900/30">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-bold text-xs text-foreground uppercase leading-tight">{auc.projectName}</h4>
                        <span className="text-[9px] bg-primary/10 text-primary border border-primary/20 px-1.5 py-0.2 rounded mt-1 inline-block font-mono">
                          {auc.projectType} • V{auc.vintage}
                        </span>
                      </div>
                      <span className="font-mono text-[10px] font-bold text-muted-foreground bg-muted px-2 py-0.5 border border-border rounded">
                        {auc.id}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-xs py-1.5 border-y border-border/60">
                      <div>
                        <span className="text-muted-foreground text-[10px] block">Volume Listed</span>
                        <span className="font-bold font-mono text-foreground">{auc.volume.toLocaleString()} tCO2e</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground text-[10px] block">Current High Bid</span>
                        <span className="font-bold font-mono text-primary">₹{auc.currentBid} / t</span>
                      </div>
                    </div>

                    <div className="flex justify-between items-center text-xs">
                      <div className="flex items-center gap-1 text-[11px] font-bold text-amber-600 dark:text-amber-400">
                        <Clock size={12} className="animate-pulse" />
                        <span>
                          {Math.floor(auc.timeRemaining / 60)}m {auc.timeRemaining % 60}s left
                        </span>
                      </div>
                      <span className="text-[9px] text-muted-foreground max-w-[120px] truncate text-right">
                        Bidder: {auc.topBidder}
                      </span>
                    </div>

                    <button 
                      onClick={() => handlePlaceBid(auc.id)}
                      className="w-full py-1.5 bg-card hover:bg-muted text-foreground border border-border hover:border-primary/50 text-[11px] font-bold uppercase rounded-lg transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Plus size={12}/> Place Increment Bid (+₹5-15)
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

        </div>
      )}

      {/* ── TAB: BUYER DASHBOARD ── */}
      {activeTab === 'buyers' && (
        <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden animate-in fade-in duration-300">
          <div className="p-4 border-b border-border bg-slate-50/50 dark:bg-slate-900/30 flex items-center justify-between">
            <h3 className="text-sm font-bold text-foreground flex items-center gap-1.5 uppercase">
              <Building2 size={16} className="text-primary"/> Corporate Buyers Directory
            </h3>
            <div className="relative w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <input 
                type="text" 
                placeholder="Search Corporates / Demands..." 
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
                  <th className="p-3">Buyer / Company</th>
                  <th className="p-3">Annual Demand (tCO₂e)</th>
                  <th className="p-3">Annual ESG Budget</th>
                  <th className="p-3">Preferred Project Type</th>
                  <th className="p-3">Preferred Vintage</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {buyers.filter(b => !searchQuery || b.company.toLowerCase().includes(searchQuery.toLowerCase())).map(b => (
                  <tr key={b.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/30 transition-colors">
                    <td className="p-3">
                      <div className="font-bold text-foreground flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold">
                          {b.company.charAt(0)}
                        </div>
                        <div>
                          <span className="text-foreground">{b.company}</span>
                          <span className="block text-[10px] text-muted-foreground font-mono mt-0.5">{b.id}</span>
                        </div>
                      </div>
                    </td>
                    <td className="p-3 font-mono font-bold text-foreground">{b.demand.toLocaleString()} tCO2e</td>
                    <td className="p-3 font-mono font-bold text-emerald-600 dark:text-emerald-400">₹{(b.budget / 10000000).toFixed(2)} Cr</td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-foreground border border-border rounded text-[10px] font-bold">
                        {b.projectType}
                      </span>
                    </td>
                    <td className="p-3 font-mono text-foreground font-semibold">Vintage {b.vintage}</td>
                    <td className="p-3 text-right">
                      <button 
                        onClick={() => {
                          setOrderParty(b.company);
                          setOrderQuantity(String(Math.floor(b.demand * 0.1)));
                          setOrderPrice(String(todayRate - 2));
                          setOrderProjectType(b.projectType);
                          setOrderVintage(b.vintage);
                          setActiveTab('exchange');
                          toast.success(`Loaded settings for ${b.company} onto Exchange Desk`);
                        }}
                        className="px-3.5 py-1.5 bg-primary/10 border border-primary/20 hover:bg-primary/20 text-primary text-[11px] font-bold rounded-lg transition-colors inline-flex items-center gap-1 cursor-pointer"
                      >
                        <ArrowLeftRight size={12}/> Load to Trade Desk
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── TAB: TRADE MATCH LEDGER ── */}
      {activeTab === 'ledger' && (
        <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden animate-in fade-in duration-300">
          <div className="p-4 border-b border-border bg-slate-50/50 dark:bg-slate-900/30 flex items-center justify-between">
            <h3 className="text-sm font-bold text-foreground flex items-center gap-1.5 uppercase">
              <History size={16} className="text-primary"/> Cleared Trades History
            </h3>
            <div className="relative w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <input 
                type="text" 
                placeholder="Search matching trades..." 
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
                  <th className="p-3">Trade ID</th>
                  <th className="p-3">Seller (Farmer)</th>
                  <th className="p-3">Buyer (Corporate)</th>
                  <th className="p-3 text-right">Volume (tCO2e)</th>
                  <th className="p-3 text-right">Execution Price</th>
                  <th className="p-3 text-right">Total Trade Amount</th>
                  <th className="p-3">Matched Timestamp</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 text-right">Invoice</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {filteredTrades.map(t => (
                  <tr key={t.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/30 transition-colors">
                    <td className="p-3 font-mono font-bold text-primary">{t.id}</td>
                    <td className="p-3">
                      <div className="flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-muted-foreground"/>
                        <span className="font-semibold text-foreground">{t.seller}</span>
                      </div>
                    </td>
                    <td className="p-3">
                      <div className="flex items-center gap-1.5">
                        <Building className="w-3.5 h-3.5 text-muted-foreground"/>
                        <span className="font-semibold text-foreground">{t.buyer}</span>
                      </div>
                    </td>
                    <td className="p-3 font-mono font-bold text-right text-emerald-600 dark:text-emerald-400">{t.quantity.toLocaleString()} t</td>
                    <td className="p-3 font-mono text-right text-foreground">₹{t.price}</td>
                    <td className="p-3 font-mono font-bold text-right text-foreground">₹{t.totalAmount.toLocaleString('en-IN')}</td>
                    <td className="p-3 text-muted-foreground">{t.timestamp}</td>
                    <td className="p-3">
                      <span className={cn(
                        "px-2 py-0.5 rounded-full text-[10px] font-bold border capitalize",
                        t.status === 'SETTLED' 
                          ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" 
                          : "bg-amber-500/10 text-amber-600 border-amber-500/20"
                      )}>
                        {t.status.replace(/_/g, ' ').toLowerCase()}
                      </span>
                    </td>
                    <td className="p-3 text-right font-bold">
                      <button 
                        onClick={() => handleOpenInvoice(t)}
                        className="p-1 hover:bg-muted text-muted-foreground hover:text-foreground rounded-lg transition-colors border-0 bg-transparent cursor-pointer"
                        title="View Trade Tax Invoice"
                      >
                        <FileText size={15} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── TAB: SETTLEMENT & DBT PORTAL ── */}
      {activeTab === 'settlement' && (
        <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden animate-in fade-in duration-300">
          <div className="p-4 border-b border-border bg-slate-50/50 dark:bg-slate-900/30 flex items-center justify-between">
            <h3 className="text-sm font-bold text-foreground flex items-center gap-1.5 uppercase">
              <CreditCard size={16} className="text-primary"/> Settlement Ledger & DBT Bank Disbursals
            </h3>
            <span className="text-[11px] font-semibold text-muted-foreground">
              Direct Benefit Transfer Payout Queue
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="bg-muted/40 border-b border-border text-muted-foreground font-bold">
                  <th className="p-3">Trade Ref</th>
                  <th className="p-3">Farmer Name</th>
                  <th className="p-3 text-right">Gross Amount</th>
                  <th className="p-3 text-right">Platform Fee (2%)</th>
                  <th className="p-3 text-right">GST (18% on Fee)</th>
                  <th className="p-3 text-right font-bold text-primary">Net Payout to Farmer</th>
                  <th className="p-3">Bank Transfer Status</th>
                  <th className="p-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {filteredSettlements.map(t => (
                  <tr key={t.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/30 transition-colors">
                    <td className="p-3 font-mono text-foreground">{t.id}</td>
                    <td className="p-3 font-bold text-foreground">{t.seller}</td>
                    <td className="p-3 font-mono text-right text-foreground">₹{t.totalAmount.toLocaleString('en-IN')}</td>
                    <td className="p-3 font-mono text-right text-destructive">-₹{t.commission.toLocaleString('en-IN')}</td>
                    <td className="p-3 font-mono text-right text-destructive">-₹{t.gst.toLocaleString('en-IN')}</td>
                    <td className="p-3 font-mono font-bold text-right text-emerald-600 dark:text-emerald-400 text-sm">
                      ₹{t.netPayout.toLocaleString('en-IN')}
                    </td>
                    <td className="p-3">
                      <span className={cn(
                        "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold border uppercase",
                        t.status === 'SETTLED' 
                          ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" 
                          : "bg-amber-500/10 text-amber-600 border-amber-500/20"
                      )}>
                        <span className={cn("w-1.5 h-1.5 rounded-full", t.status === 'SETTLED' ? "bg-emerald-500" : "bg-amber-500 animate-pulse")} />
                        {t.status === 'SETTLED' ? 'Paid to Bank' : 'Awaiting Disbursal'}
                      </span>
                    </td>
                    <td className="p-3 text-right">
                      {t.status !== 'SETTLED' ? (
                        <button 
                          onClick={() => handleDisbursePayout(t.id)}
                          className="px-3 py-1 bg-primary hover:bg-primary/95 text-white text-[11px] font-bold rounded-lg transition-colors shadow-xs border-0 cursor-pointer"
                        >
                          Disburse DBT
                        </button>
                      ) : (
                        <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1 justify-end">
                          <ShieldCheck size={14}/> Settle Core
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── MOCK TAX INVOICE MODAL ── */}
      {isInvoiceModalOpen && selectedTrade && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-card border border-border w-full max-w-lg rounded-2xl shadow-2xl p-6 relative animate-in fade-in zoom-in duration-200">
            {/* Close Button */}
            <button 
              onClick={() => setIsInvoiceModalOpen(false)}
              className="absolute right-4 top-4 p-1.5 hover:bg-muted text-muted-foreground hover:text-foreground rounded-lg transition-colors border-0 bg-transparent cursor-pointer"
            >
              <XCircle size={20} />
            </button>

            {/* Print Header */}
            <div className="flex justify-between items-start border-b border-border pb-4">
              <div>
                <h3 className="font-extrabold text-base text-foreground uppercase tracking-tight">BhumiCred Net Exchange</h3>
                <p className="text-[10px] text-muted-foreground font-mono">GST REGISTRATION NO: 27AAACB8901Z1Z0</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">Clearing & Settlement Node • Mumbai Hub</p>
              </div>
              <span className="font-mono text-xs text-primary font-bold bg-primary/10 border border-primary/20 px-2.5 py-1 rounded-lg">
                TAX INVOICE
              </span>
            </div>

            {/* Invoice Meta */}
            <div className="grid grid-cols-2 gap-4 py-4 text-[11px] border-b border-border">
              <div>
                <span className="text-muted-foreground block font-bold uppercase text-[9px]">Billing From (Seller)</span>
                <span className="font-bold text-foreground block">{selectedTrade.seller}</span>
                <span className="text-muted-foreground block mt-0.5">Empanelled Farmer Node</span>
              </div>
              <div>
                <span className="text-muted-foreground block font-bold uppercase text-[9px]">Billing To (Buyer)</span>
                <span className="font-bold text-foreground block">{selectedTrade.buyer}</span>
                <span className="text-muted-foreground block mt-0.5">Corporate Offtaker Account</span>
              </div>
            </div>

            {/* Invoice Specifics */}
            <div className="py-4 space-y-3.5 text-xs">
              <div className="flex justify-between items-center text-[10px] text-muted-foreground font-bold border-b border-border pb-1">
                <span>DESCRIPTION</span>
                <span>TOTAL</span>
              </div>

              <div className="flex justify-between items-center">
                <div>
                  <span className="font-bold text-foreground">Verified Voluntarily Carbon Credits (VCUs)</span>
                  <span className="block text-[10px] text-muted-foreground mt-0.5 font-mono">
                    Quantity: {selectedTrade.quantity.toLocaleString()} tCO2e @ ₹{selectedTrade.price}/t
                  </span>
                </div>
                <span className="font-bold font-mono text-foreground">₹{selectedTrade.totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
              </div>

              <div className="border-t border-border/80 pt-3 space-y-2 text-[11px]">
                <div className="flex justify-between items-center text-muted-foreground">
                  <span>Gross Trade Subtotal:</span>
                  <span className="font-mono text-foreground">₹{selectedTrade.totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between items-center text-rose-600 dark:text-rose-400">
                  <span>Platform Commission (2%):</span>
                  <span className="font-mono font-bold">-₹{selectedTrade.commission.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between items-center text-rose-600 dark:text-rose-400">
                  <span>CGST (9% on Commission):</span>
                  <span className="font-mono">-₹{(selectedTrade.gst / 2).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between items-center text-rose-600 dark:text-rose-400">
                  <span>SGST (9% on Commission):</span>
                  <span className="font-mono">-₹{(selectedTrade.gst / 2).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                </div>
                
                <div className="border-t border-border pt-3 flex justify-between items-center text-xs">
                  <span className="font-bold text-foreground">NET SETTLED DISBURSAL PAYOUT:</span>
                  <span className="text-base font-extrabold text-primary font-mono">
                    ₹{selectedTrade.netPayout.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
            </div>

            {/* Print Footer */}
            <div className="pt-4 border-t border-border flex items-center justify-between gap-3">
              <span className="text-[10px] text-muted-foreground font-mono">
                Ref ID: {selectedTrade.id} • {selectedTrade.timestamp}
              </span>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => toast.success('Sending request to print server...')}
                  className="px-3.5 py-1.5 bg-card hover:bg-muted border border-border text-foreground text-[11px] font-bold rounded-lg flex items-center gap-1 cursor-pointer"
                >
                  <Printer size={13} /> Print
                </button>
                <button 
                  onClick={() => toast.success('Invoice downloaded as PDF.')}
                  className="px-3.5 py-1.5 bg-primary hover:bg-primary-dark text-white text-[11px] font-bold rounded-lg flex items-center gap-1 shadow-xs border-0 cursor-pointer"
                >
                  <Download size={13} /> Download
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

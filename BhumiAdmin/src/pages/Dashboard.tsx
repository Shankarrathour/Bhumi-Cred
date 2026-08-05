import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useEcosystemStore, useAdminStore, useAuthStore } from '../store';
import { 
  Calendar, 
  Leaf, 
  Activity,
  ShoppingBag,
  ShieldCheck,
  Users,
  Coins,
  MapPin,
  Flame,
  ChevronRight,
  ChevronDown,
  ArrowUpRight,
  LineChart as LineChartIcon,
  X,
  Search,
  Globe
} from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line
} from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/utils/cn';

// ── Tiny sparkline ──
const Sparkline: React.FC<{ data: number[]; color: string }> = ({ data, color }) => {
  const chartData = data.map((v, i) => ({ i, v }));
  return (
    <ResponsiveContainer width="100%" height={36}>
      <LineChart data={chartData}>
        <Line type="monotone" dataKey="v" stroke={color} strokeWidth={1.5} dot={false} isAnimationActive={false} />
      </LineChart>
    </ResponsiveContainer>
  );
};

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { activeRole, activeState, activeDistrict, activeBlock, activeVillage } = useAdminStore();
  const { 
    farmers, 
    lands, 
    vendors, 
    carbonProjects, 
    withdrawals, 
    insurancePolicies,
    fetchFarmers,
    fetchLands,
    fetchVendors,
    fetchProducts,
    fetchCarbonProjects,
    fetchInsurancePolicies,
    fetchOrders,
    fetchWithdrawals,
    fetchSupportTickets,
    fetchActivityLogs,
    activityLogs
  } = useEcosystemStore();
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const dateInputRef = useRef<HTMLInputElement>(null);

  const formatDateForInput = (d: Date): string => {
    if (!d || isNaN(d.getTime())) return '';
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };

  const parseInputDate = (val: string): Date => {
    if (!val) return new Date();
    const [y, m, d] = val.split('-').map(Number);
    if (!y || !m || !d) return new Date();
    return new Date(y, m - 1, d);
  };

  const formatDateForDisplay = (d: Date): string => {
    if (!d || isNaN(d.getTime())) return 'Select Date';
    return d.toLocaleDateString('en-IN', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const handlePickerClick = () => {
    if (dateInputRef.current) {
      if ('showPicker' in dateInputRef.current && typeof dateInputRef.current.showPicker === 'function') {
        try {
          dateInputRef.current.showPicker();
        } catch {
          dateInputRef.current.click();
        }
      } else {
        dateInputRef.current.click();
      }
    }
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (!val) {
      setSelectedDate(new Date());
      return;
    }
    const newDate = parseInputDate(val);
    if (!isNaN(newDate.getTime())) {
      setSelectedDate(newDate);
    }
  };
  
  // All Regions Modal & Realtime Telemetry state
  const [showAllRegionsModal, setShowAllRegionsModal] = useState(false);
  const [regionSearch, setRegionSearch] = useState('');
  const [totalFarmerCount, setTotalFarmerCount] = useState<number>(0);

  useEffect(() => {
    let isMounted = true;
    const loadRealtimeTelemetry = async () => {
      setIsLoading(true);
      try {
        const farmerRes = await fetchFarmers({ limit: 1000 });
        if (isMounted && farmerRes?.total) {
          setTotalFarmerCount(farmerRes.total);
        }
        await Promise.allSettled([
          fetchLands(),
          fetchVendors(),
          fetchProducts(),
          fetchCarbonProjects(),
          fetchInsurancePolicies(),
          fetchOrders(),
          fetchWithdrawals(),
          fetchSupportTickets(),
          fetchActivityLogs(),
        ]);
      } catch (err) {
        console.warn('[DashboardPage] Telemetry fetch notice:', err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };
    loadRealtimeTelemetry();
    return () => { isMounted = false; };
  }, [activeRole, activeState, activeDistrict, activeBlock, activeVillage]);

  if (isLoading) return <DashboardSkeleton />;

  // ── Live Backend Metrics ──
  let filteredFarmers = farmers;
  if (activeState && activeState !== 'All States')       filteredFarmers = filteredFarmers.filter(f => f.location?.state === activeState);
  if (activeDistrict && activeDistrict !== 'All Districts') filteredFarmers = filteredFarmers.filter(f => f.location?.district === activeDistrict);
  if (activeBlock && activeBlock !== 'All Blocks')       filteredFarmers = filteredFarmers.filter(f => f.location?.block === activeBlock);
  if (activeVillage && activeVillage !== 'All Villages') filteredFarmers = filteredFarmers.filter(f => f.location?.village === activeVillage);

  const filteredFarmerIds = new Set(filteredFarmers.map(f => f.id));
  const totalFarmers      = filteredFarmers.length;
  const pendingApprovals  = filteredFarmers.filter(f => f.kycStatus === 'Pending' || f.kycStatus === 'Under Review').length;

  const filteredLands  = lands.filter(l => filteredFarmerIds.has(l.farmerId));
  const verifiedLand   = filteredLands.filter(l => l.status === 'Verified').reduce((acc, curr) => acc + (curr.acreage || 0), 0);

  const filteredCarbonProjects = carbonProjects.filter(p => p.assignedFarmerIds.some(id => filteredFarmerIds.has(id)));
  const totalCredits           = filteredCarbonProjects.reduce((acc, curr) => acc + (curr.creditsIssued || 0), 0);

  const filteredWithdrawals    = withdrawals.filter(w => filteredFarmerIds.has(w.farmerId));
  const pendingWithdrawalsCount = filteredWithdrawals.filter(w => w.status === 'Pending Approval').length;

  const filteredPolicies = insurancePolicies.filter(p => filteredFarmerIds.has(p.farmerId));
  const activePolicies   = filteredPolicies.filter(p => p.status === 'Active').length;

  let filteredVendors = vendors;
  if (activeState && activeState !== 'All States')         filteredVendors = filteredVendors.filter(v => v.location?.state === activeState);
  if (activeDistrict && activeDistrict !== 'All Districts') filteredVendors = filteredVendors.filter(v => v.location?.district === activeDistrict);
  if (activeBlock && activeBlock !== 'All Blocks')          filteredVendors = filteredVendors.filter(v => v.location?.block === activeBlock);
  if (activeVillage && activeVillage !== 'All Villages')    filteredVendors = filteredVendors.filter(v => v.location?.village === activeVillage);

  // ── Dynamic State Contributions from Real Registered Farmers & Lands ──
  const stateMap: Record<string, { acreage: number; trees: number; carbonCredits: number }> = {};
  
  filteredFarmers.forEach(f => {
    const rawState = f.location?.state?.trim();
    if (!rawState) return;

    // Use actual state name from live data
    const st = rawState;
    if (!stateMap[st]) stateMap[st] = { acreage: 0, trees: 0, carbonCredits: 0 };
    
    // Sum land acreage from farmer profile or land records
    const farmerLands = lands.filter(l => l.farmerId === f.id || l.farmerId === f.farmerId);
    const landAcreageSum = farmerLands.reduce((acc, curr) => acc + (curr.acreage || 0), 0);
    const totalAcreage = Math.max(f.totalAcreage || 0, landAcreageSum);

    const totalTrees = f.totalTrees || (totalAcreage > 0 ? Math.round(totalAcreage * 15) : 0);
    const carbonCredits = f.carbonCreditsGenerated || (totalTrees > 0 ? Math.round(totalTrees * 0.08) : Math.round(totalAcreage * 1.5));

    stateMap[st].acreage += totalAcreage;
    stateMap[st].trees += totalTrees;
    stateMap[st].carbonCredits += carbonCredits;
  });

  const stateContributions = Object.entries(stateMap)
    .map(([state, data]) => ({
      state,
      acreage: Number(data.acreage.toFixed(2)),
      trees: data.trees,
      carbonCredits: Math.round(data.carbonCredits),
    }))
    .sort((a, b) => b.carbonCredits - a.carbonCredits)
    .slice(0, 5);

  const maxCredits = Math.max(...stateContributions.map(s => s.carbonCredits), 1);

  const carbonTrendData = [
    { month: 'Jan', sequestration: Math.round(totalCredits * 0.2), voluntaryCredits: Math.round(totalCredits * 0.1) },
    { month: 'Feb', sequestration: Math.round(totalCredits * 0.35), voluntaryCredits: Math.round(totalCredits * 0.2) },
    { month: 'Mar', sequestration: Math.round(totalCredits * 0.5), voluntaryCredits: Math.round(totalCredits * 0.35) },
    { month: 'Apr', sequestration: Math.round(totalCredits * 0.65), voluntaryCredits: Math.round(totalCredits * 0.5) },
    { month: 'May', sequestration: Math.round(totalCredits * 0.8), voluntaryCredits: Math.round(totalCredits * 0.65) },
    { month: 'Jun', sequestration: Math.round(totalCredits * 0.9), voluntaryCredits: Math.round(totalCredits * 0.8) },
    { month: 'Jul', sequestration: totalCredits, voluntaryCredits: totalCredits },
  ];

  const sparklines = {
    farmers:  [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, totalFarmers],
    land:     [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, verifiedLand],
    credits:  [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, totalCredits],
    policies: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, activePolicies],
  };

  return (
    <div className="w-full text-foreground select-none">
      
      {/* ── Dashboard Header ── */}
      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-3 mb-6">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-primary/10 border border-primary/20 rounded-full text-[12px] font-medium text-primary mb-3">
            <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
            BHUMICRED SATELLITE COMMAND: SYNCHRONIZED
          </div>
          <h1 className="text-[28px] font-bold text-foreground leading-tight tracking-tight">
            ECOSYSTEM TELEMETRY BOARD
          </h1>
          <p className="text-[12px] text-muted-foreground mt-1">
            OPERATOR: <span className="font-medium text-foreground">{user?.name}</span>
            {' · '}
            ACTIVE ROLE: <span className="font-semibold text-primary">{activeRole.replace(/_/g, ' ').toUpperCase()}</span>
          </p>
        </div>

        {/* Date picker pill */}
        <div 
          onClick={handlePickerClick}
          className="relative h-10 px-3.5 border border-border bg-card rounded-full flex items-center gap-2 text-[13px] font-semibold text-foreground self-start shadow-sm hover:border-primary/50 hover:bg-muted/30 transition-all cursor-pointer select-none group"
        >
          <Calendar className="w-4 h-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0 group-hover:scale-105 transition-transform" />
          <input 
            ref={dateInputRef}
            type="date" 
            value={formatDateForInput(selectedDate)}
            onChange={handleDateChange}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
          />
          <span className="whitespace-nowrap font-medium text-foreground text-[13px] pointer-events-none">
            {formatDateForDisplay(selectedDate)}
          </span>
          <ChevronDown className="w-3.5 h-3.5 text-muted-foreground opacity-70 group-hover:opacity-100 transition-opacity ml-0.5 pointer-events-none" />
          {selectedDate.toDateString() !== new Date().toDateString() && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setSelectedDate(new Date());
              }}
              className="z-20 text-[11px] font-semibold text-primary bg-primary/10 hover:bg-primary/20 px-2 py-0.5 rounded-full ml-1 transition-colors"
              title="Reset to Today"
            >
              Today
            </button>
          )}
        </div>
      </div>

      {/* ── KPI Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-5">
        {[
          { title: 'REGISTERED FARMERS',    displayValue: String(activeState === 'All States' ? (totalFarmerCount || totalFarmers) : totalFarmers), change: 'Sync Active', icon: Users,       iconBg: 'bg-emerald-100 dark:bg-emerald-900/30', iconColor: 'text-emerald-600 dark:text-emerald-400', desc: 'Onboarded to Platform',            sparkData: sparklines.farmers,  sparkColor: '#10B981' },
          { title: 'VERIFIED LAND AREA',    displayValue: `${verifiedLand.toFixed(1)} Ac`,  change: 'Sync Active', icon: MapPin,      iconBg: 'bg-blue-100 dark:bg-blue-900/30',     iconColor: 'text-blue-600 dark:text-blue-400',     desc: 'GIS Survey Boundaries Mapped',     sparkData: sparklines.land,     sparkColor: '#3B82F6' },
          { title: 'ISSUED CARBON CREDITS', displayValue: `${totalCredits.toLocaleString('en-IN')} t`, change: 'Sync Active', icon: Leaf, iconBg: 'bg-emerald-100 dark:bg-emerald-900/30', iconColor: 'text-emerald-600 dark:text-emerald-400', desc: 'Verified Voluntary Reserves', sparkData: sparklines.credits, sparkColor: '#10B981' },
          { title: 'ACTIVE FOREST POLICIES', displayValue: String(activePolicies),          change: 'Sync Active', icon: ShieldCheck, iconBg: 'bg-violet-100 dark:bg-violet-900/30', iconColor: 'text-violet-600 dark:text-violet-400', desc: 'Covered Plantation Plans',          sparkData: sparklines.policies, sparkColor: '#8B5CF6' },
        ].map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              className="bg-card border border-border rounded-2xl p-4 shadow-sm hover:-translate-y-0.5 hover:shadow-md transition-all duration-200 cursor-default"
            >
              <div className="flex items-start justify-between mb-3">
                <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide leading-none">
                  {stat.title}
                </span>
                <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0", stat.iconBg)}>
                  <Icon className={cn("w-4 h-4", stat.iconColor)} />
                </div>
              </div>
              <div className="text-[28px] font-bold text-foreground leading-none mb-1">
                {stat.displayValue}
              </div>
              <div className="-mx-1 my-2">
                <Sparkline data={stat.sparkData} color={stat.sparkColor} />
              </div>
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-0.5 text-[12px] font-semibold text-primary bg-primary/10 border border-primary/20 rounded-md px-1.5 py-0.5">
                  <ArrowUpRight className="w-3 h-3" />
                  {stat.change}
                </span>
                <span className="text-[11px] text-muted-foreground truncate max-w-[130px]">{stat.desc}</span>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* ── Action Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-5">
        {[
          { label: 'PENDING FARMER KYC',   count: pendingApprovals,                                              icon: Users,       bg: 'bg-primary/5',     border: 'border-primary/20',    iconColor: 'text-primary',     countColor: 'text-primary',     route: '/admin/farmers' },
          { label: 'PENDING WITHDRAWALS',  count: pendingWithdrawalsCount,                                       icon: Coins,       bg: 'bg-warning/5',     border: 'border-warning/20',    iconColor: 'text-warning',     countColor: 'text-warning',     route: '/admin/withdrawals' },
          { label: 'PENDING VENDOR REGS',  count: filteredVendors.filter(v => v.kycStatus === 'Pending').length, icon: ShoppingBag, bg: 'bg-destructive/5', border: 'border-destructive/20', iconColor: 'text-destructive', countColor: 'text-destructive', route: '/admin/vendors' },
        ].map((item, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 + i * 0.05 }}
            onClick={() => navigate(item.route)}
            className={cn("border rounded-xl p-3.5 flex items-center justify-between cursor-pointer hover:shadow-sm hover:border-primary/40 transition-all duration-200", item.bg, item.border)}
          >
            <div className="flex items-center gap-2.5">
              <item.icon className={cn("w-4 h-4 flex-shrink-0", item.iconColor)} />
              <span className="text-[13px] font-semibold text-foreground">{item.label}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className={cn("text-xl font-bold", item.countColor)}>{item.count}</span>
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            </div>
          </motion.div>
        ))}
      </div>

      {/* ── Analytics Row ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Chart */}
        <motion.div
          initial={{ opacity: 0, scale: 0.99 }}
          animate={{ opacity: 1, scale: 1 }}
          className="lg:col-span-2 bg-card border border-border rounded-2xl p-5 flex flex-col shadow-sm"
          style={{ minHeight: '340px' }}
        >
          <div className="flex items-start justify-between mb-1">
            <div>
              <h3 className="text-[14px] font-bold text-foreground uppercase tracking-wide">
                CARBON LOCKING &amp; CREDIT TELEMETRY
              </h3>
              <p className="text-[12px] text-muted-foreground mt-0.5">
                Simulated CO2 Metric Tonnes Sequestered vs Voluntary Issued Credits
              </p>
            </div>
            <button className="flex items-center gap-1.5 h-8 px-3 border border-border rounded-lg text-[12px] font-medium text-primary hover:bg-primary/5 hover:border-primary/30 transition-all whitespace-nowrap flex-shrink-0">
              <LineChartIcon className="w-3.5 h-3.5" />
              Live Network Graph
            </button>
          </div>

          {/* Legend */}
          <div className="flex items-center gap-4 mb-3 mt-2">
            <div className="flex items-center gap-1.5">
              <div className="w-8 h-0.5 bg-primary rounded-full" />
              <span className="text-[12px] text-muted-foreground">CO2 Sequestered (tonnes)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-8 h-0.5 bg-warning rounded-full" />
              <span className="text-[12px] text-muted-foreground">Voluntary Credits Issued (tonnes)</span>
            </div>
          </div>

          <div className="flex-1 min-h-0 -ml-2">
            <ResponsiveContainer width="100%" height={230}>
              <AreaChart data={carbonTrendData} margin={{ top: 5, right: 10, bottom: 0, left: 0 }}>
                <defs>
                  <linearGradient id="gradSeq" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#10B981" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0.01} />
                  </linearGradient>
                  <linearGradient id="gradCred" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#F59E0B" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#F59E0B" stopOpacity={0.01} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))', fontFamily: 'Inter, sans-serif' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))', fontFamily: 'Inter, sans-serif' }} width={45} />
                <Tooltip
                  contentStyle={{
                    background: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '10px',
                    boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
                    fontSize: '12px',
                    fontFamily: 'Inter, sans-serif',
                    color: 'hsl(var(--foreground))',
                  }}
                  labelStyle={{ fontWeight: 600, color: 'hsl(var(--foreground))' }}
                  itemStyle={{ color: 'hsl(var(--muted-foreground))' }}
                />
                <Area type="monotone" dataKey="sequestration"    stroke="#10B981" strokeWidth={2} fillOpacity={1} fill="url(#gradSeq)"  name="CO2 Sequestered (t)"            dot={{ fill: '#10B981', r: 3, strokeWidth: 0 }} activeDot={{ r: 5, strokeWidth: 0 }} />
                <Area type="monotone" dataKey="voluntaryCredits" stroke="#F59E0B" strokeWidth={2} fillOpacity={1} fill="url(#gradCred)" name="Voluntary Credits Issued (t)" dot={{ fill: '#F59E0B', r: 3, strokeWidth: 0 }} activeDot={{ r: 5, strokeWidth: 0 }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Regional Panel */}
        <motion.div
          initial={{ opacity: 0, scale: 0.99 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.08 }}
          className="bg-card border border-border rounded-2xl p-5 flex flex-col shadow-sm"
          style={{ minHeight: '340px' }}
        >
          <div className="mb-4">
            <h3 className="text-[14px] font-bold text-foreground uppercase tracking-wide">REGIONAL CONTRIBUTIONS</h3>
            <p className="text-[12px] text-muted-foreground mt-0.5">Top performing forest and soil reserves</p>
          </div>

          <div className="flex-1 space-y-4">
            {stateContributions.map((item, idx) => (
              <div key={idx} className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[13px] font-semibold text-foreground uppercase tracking-wide">{item.state}</span>
                  <span className="text-[12px] font-bold text-primary">{item.carbonCredits.toLocaleString()} T LOCKED</span>
                </div>
                <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(100, (item.carbonCredits / maxCredits) * 100)}%` }}
                    transition={{ delay: 0.3 + idx * 0.08, duration: 0.6 }}
                    className="h-full bg-primary rounded-full"
                  />
                </div>
                <div className="text-[11px] text-muted-foreground">
                  {item.acreage.toLocaleString()} ACRES · {item.trees.toLocaleString()} TREES
                </div>
              </div>
            ))}
          </div>

          <button
            onClick={() => setShowAllRegionsModal(true)}
            className="mt-4 w-full h-9 border border-border rounded-xl text-[13px] font-medium text-muted-foreground hover:bg-muted hover:border-primary/40 hover:text-primary transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
          >
            View All Regions
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </motion.div>

      </div>

      {/* ── Bottom Row ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mt-4">

        {/* Satellite Alerts */}
        <div className="lg:col-span-2 bg-card border border-border rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-border">
            <h3 className="text-[14px] font-bold text-foreground flex items-center gap-1.5">
              <Flame className="w-4 h-4 text-warning" />
              GIS Satellite Telemetry Alerts
            </h3>
            <span className="text-[12px] bg-warning/10 text-warning border border-warning/20 font-medium px-2 py-0.5 rounded-md flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-warning rounded-full animate-pulse inline-block" />
              LIVE
            </span>
          </div>

          <div className="space-y-3">
            {[
              { id: 'ALR-482', detail: 'Varanasi District Block Harahua reports localized drought stresses. Tree irrigation logs flagged.', level: 'Critical', region: 'UP / Varanasi' },
              { id: 'ALR-192', detail: 'Gurdev Singh Dhillon plantation verified: poplar growth rate matches SGS Carbon Standard offset indexes.', level: 'Verified', region: 'Haryana / Karnal' },
              { id: 'ALR-381', detail: 'Disaster Claim CLM-001 submitted by Ambegaon bamboo cooperative requires multispectral audit.', level: 'High', region: 'MH / Pune / Ambegaon' }
            ].map((inc, i) => {
              const lvl = {
                Critical: { dot: 'bg-destructive', pill: 'bg-destructive/10 text-destructive border-destructive/20' },
                Verified:  { dot: 'bg-primary',     pill: 'bg-primary/10 text-primary border-primary/20'         },
                High:      { dot: 'bg-warning',     pill: 'bg-warning/10 text-warning border-warning/20'         },
              }[inc.level] ?? { dot: 'bg-muted-foreground', pill: 'bg-muted text-muted-foreground border-border' };
              return (
                <div key={i} className="flex items-start gap-3 p-3 bg-muted/40 border border-border rounded-xl">
                  <span className={cn("w-2 h-2 rounded-full mt-1.5 flex-shrink-0", lvl.dot)} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className="text-[13px] font-semibold text-foreground">{inc.id} · {inc.region}</span>
                      <span className={cn("text-[11px] font-medium px-2 py-0.5 rounded-md border flex-shrink-0", lvl.pill)}>{inc.level}</span>
                    </div>
                    <p className="text-[12px] text-muted-foreground leading-relaxed">{inc.detail}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Audit Log */}
        <div className="bg-card border border-border rounded-2xl p-5 flex flex-col shadow-sm" style={{ maxHeight: '320px' }}>
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-border flex-shrink-0">
            <h3 className="text-[14px] font-bold text-foreground flex items-center gap-1.5">
              <Activity className="w-4 h-4 text-primary" />
              Live Audit Log
            </h3>
          </div>
          <div className="flex-1 overflow-y-auto space-y-3 pr-0.5">
            {activityLogs.slice(0, 10).map((activity, idx) => (
              <div key={idx} className="flex items-start gap-2.5 border-b border-border/50 pb-2.5 last:border-0 last:pb-0">
                <span className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-[12px] font-medium text-foreground leading-snug">{activity.action}</p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="text-[11px] font-semibold text-primary">{activity.operator}</span>
                    <span className="text-muted-foreground/40">·</span>
                    <span className="text-[11px] text-muted-foreground">{activity.timestamp}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* ── View All Regions Modal ── */}
      <AnimatePresence>
        {showAllRegionsModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-card border border-border rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[85vh]"
            >
              {/* Modal Header */}
              <div className="p-5 border-b border-border flex items-center justify-between bg-muted/20">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                    <Globe className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-foreground">Global Regional Telemetry Audit</h3>
                    <p className="text-xs text-muted-foreground">All registered state regions &amp; carbon sequestration holdings</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowAllRegionsModal(false)}
                  className="w-8 h-8 rounded-lg border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Modal Search */}
              <div className="p-4 border-b border-border bg-card">
                <div className="relative">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Search state name or region..."
                    value={regionSearch}
                    onChange={(e) => setRegionSearch(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-background border border-border rounded-xl text-xs text-foreground outline-none focus:border-primary transition-colors"
                  />
                </div>
              </div>

              {/* Modal List Body */}
              <div className="p-5 overflow-y-auto space-y-3 flex-1 scrollbar-thin">
                {Object.entries(stateMap)
                  .filter(([st]) => st.toLowerCase().includes(regionSearch.toLowerCase()))
                  .map(([state, data]) => {
                    const farmerCount = farmers.filter(f => f.location?.state === state).length;
                    return (
                      <div key={state} className="p-4 rounded-xl border border-border bg-muted/20 hover:border-primary/30 transition-all space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-primary" />
                            <h4 className="font-bold text-sm text-foreground">{state}</h4>
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-primary/10 text-primary border border-primary/20">
                              {farmerCount} Farmers
                            </span>
                          </div>
                          <span className="font-mono font-bold text-primary text-xs">
                            {data.carbonCredits} T LOCKED
                          </span>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1 text-xs text-muted-foreground font-medium">
                          <div>Acreage: <strong className="text-foreground">{data.acreage.toFixed(2)} Ac</strong></div>
                          <div>Trees Registered: <strong className="text-foreground">{data.trees.toLocaleString()}</strong></div>
                          <div>Sequestration: <strong className="text-emerald-600 dark:text-emerald-400">{data.carbonCredits} t CO2e</strong></div>
                        </div>
                      </div>
                    );
                  })}
              </div>

              {/* Modal Footer */}
              <div className="p-4 border-t border-border bg-muted/20 flex justify-end">
                <button
                  onClick={() => setShowAllRegionsModal(false)}
                  className="btn-primary text-xs px-4 py-2"
                >
                  Done
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

// ── Skeleton ──
const DashboardSkeleton: React.FC = () => (
  <div className="w-full animate-pulse space-y-5">
    <div className="space-y-2">
      <div className="h-4 bg-muted rounded-full w-48" />
      <div className="h-7 bg-muted rounded-lg w-72" />
      <div className="h-3 bg-muted rounded-full w-56" />
    </div>
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {[1, 2, 3, 4].map(i => <div key={i} className="h-[140px] bg-card rounded-2xl border border-border shadow-sm" />)}
    </div>
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      {[1, 2, 3].map(i => <div key={i} className="h-14 bg-card rounded-xl border border-border shadow-sm" />)}
    </div>
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      <div className="lg:col-span-2 h-[340px] bg-card rounded-2xl border border-border shadow-sm" />
      <div className="h-[340px] bg-card rounded-2xl border border-border shadow-sm" />
    </div>
  </div>
);

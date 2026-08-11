import React, { useState, useEffect, useMemo } from 'react';
import { 
  Globe2, 
  Search, 
  RefreshCw, 
  MapPin, 
  Calendar, 
  Flame, 
  CloudRain, 
  Sprout, 
  CheckCircle2, 
  Satellite, 
  Plane, 
  Leaf, 
  ShoppingBag, 
  ShieldCheck, 
  UserPlus, 
  Sparkles,
  TrendingUp,
  DollarSign,
  Layers,
  Award,
  Database,
  Building2,
  Users
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { cn } from '../../../utils/cn';

// Types
interface AlertItem {
  id: string;
  type: 'FIRE' | 'FLOOD' | 'PLANTATION' | 'LAND' | 'SATELLITE' | 'DRONE' | 'CARBON' | 'MARKET' | 'INSURANCE' | 'USER';
  message: string;
  time: string;
  level: 'CRITICAL' | 'WARNING' | 'INFO';
}

interface RegionDetail {
  code: string;
  name: string;
  farmers: number;
  trees: number;
  acres: number;
  credits: number;
  activeProjects: number;
  colorDensity: string; // Tailwind class color for mapping cover
}

export const CommandCenter: React.FC = () => {
  // Time and date clock
  const [currentTime, setCurrentTime] = useState(new Date());

  // Interactive filters
  const [selectedState, setSelectedState] = useState('All States');
  const [selectedDistrict, setSelectedDistrict] = useState('All Districts');
  const [selectedVillage, setSelectedVillage] = useState('All Villages');
  const [selectedProject, setSelectedProject] = useState('All Projects');
  const [selectedPartner, setSelectedPartner] = useState('All Partners');
  const [selectedCarbonProject, setSelectedCarbonProject] = useState('All Carbon Projects');
  const [selectedInsuranceCompany, setSelectedInsuranceCompany] = useState('All Insurers');
  const [selectedBuyer, setSelectedBuyer] = useState('All Buyers');
  const [dateRange, setDateRange] = useState('Today');

  // Selected Region for Map Focus
  const [focusedRegion, setFocusedRegion] = useState<string>('MP');

  // Live Statistics counters state
  const [stats, setStats] = useState({
    farmers: 12480,
    govtBodies: 28,
    partners: 145,
    trees: 380000,
    acres: 24500,
    gisVerified: 22400,
    activeProjects: 89,
    carbonCredits: 128000,
    revenue: 4.80, // Cr
    marketplaceOrders: 820,
    insurancePolicies: 2450,
    pendingOrders: 18,
    withdrawalsCr: 0.95,
    growthPercent: 14.5
  });

  // Seed Region Details
  const [regions, setRegions] = useState<Record<string, RegionDetail>>({
    'MP': { code: 'MP', name: 'Madhya Pradesh', farmers: 4500, trees: 150000, acres: 9800, credits: 52000, activeProjects: 34, colorDensity: 'fill-emerald-500/80 stroke-emerald-400 hover:fill-emerald-400' },
    'RJ': { code: 'RJ', name: 'Rajasthan', farmers: 2100, trees: 65000, acres: 4500, credits: 18000, activeProjects: 14, colorDensity: 'fill-amber-600/70 stroke-amber-500 hover:fill-amber-400' },
    'GJ': { code: 'GJ', name: 'Gujarat', farmers: 1800, trees: 70000, acres: 3800, credits: 24000, activeProjects: 12, colorDensity: 'fill-emerald-600/70 stroke-emerald-500 hover:fill-emerald-400' },
    'MH': { code: 'MH', name: 'Maharashtra', farmers: 2200, trees: 55000, acres: 3200, credits: 19000, activeProjects: 16, colorDensity: 'fill-emerald-600/60 stroke-emerald-500 hover:fill-emerald-400' },
    'KA': { code: 'KA', name: 'Karnataka', farmers: 1080, trees: 25000, acres: 1800, credits: 9000, activeProjects: 8, colorDensity: 'fill-emerald-500/50 stroke-emerald-400 hover:fill-emerald-400' },
    'UP': { code: 'UP', name: 'Uttar Pradesh', farmers: 800, trees: 15000, acres: 1400, credits: 6000, activeProjects: 5, colorDensity: 'fill-emerald-500/40 stroke-emerald-400 hover:fill-emerald-400' }
  });

  // Live Alerts feed
  const [alerts, setAlerts] = useState<AlertItem[]>([
    { id: 'ALT-101', type: 'FIRE', message: 'FOREST FIRE ALERT: Critical heat signature detected near Sehore Block A.', time: 'Just Now', level: 'CRITICAL' },
    { id: 'ALT-102', type: 'FLOOD', message: 'FLOOD WARNING: High water accumulation index registered in Coastal Kutch.', time: '2m ago', level: 'WARNING' },
    { id: 'ALT-103', type: 'PLANTATION', message: 'NEW PLANTATION: Farmer Ramesh Patel completed planting 450 Teak saplings.', time: '5m ago', level: 'INFO' },
    { id: 'ALT-104', type: 'LAND', message: 'LAND APPROVED: 45 acres in Dewas GIS verified and added to carbon registry.', time: '8m ago', level: 'INFO' },
    { id: 'ALT-105', type: 'SATELLITE', message: 'SATELLITE UPDATE: Sentinel-2 pass registered new foliage growth indices.', time: '12m ago', level: 'INFO' },
    { id: 'ALT-106', type: 'DRONE', message: 'DRONE FLYOVER COMPLETED: Canopy verification report generated for project #21.', time: '18m ago', level: 'INFO' },
    { id: 'ALT-107', type: 'CARBON', message: 'CARBON CREDITS SOLD: 1,500 tCO₂e retired by Tata Steel International.', time: '22m ago', level: 'INFO' },
    { id: 'ALT-108', type: 'MARKET', message: 'MARKETPLACE ORDER: 1,200 Bamboo rootstocks dispatched to Ujjain cluster.', time: '25m ago', level: 'INFO' },
    { id: 'ALT-109', type: 'INSURANCE', message: 'INSURANCE CLAIM LOGGED: Drought claim filed for Ratlam block. Audit scheduled.', time: '30m ago', level: 'WARNING' },
    { id: 'ALT-110', type: 'USER', message: 'NEW FARMER ENROLLED: Suresh Verma registered from Sehore District.', time: '35m ago', level: 'INFO' }
  ]);

  // AI recommendations
  const aiRecommendations = [
    { text: 'MP region has highest carbon potential.', confidence: 'High Potential', color: 'text-emerald-400 bg-emerald-950/40 border-emerald-800' },
    { text: 'Rajasthan needs additional plantation.', confidence: 'High Priority', color: 'text-amber-400 bg-amber-950/40 border-amber-800' },
    { text: '1,200 acres are ready for verification.', confidence: 'GIS Ready', color: 'text-blue-400 bg-blue-950/40 border-blue-800' },
    { text: '8 projects can generate credits within 90 days.', confidence: 'Forecast Lock', color: 'text-purple-400 bg-purple-950/40 border-purple-800' },
    { text: '245 insurance policies expire this month.', confidence: 'Action Required', color: 'text-rose-400 bg-rose-950/40 border-rose-800' },
    { text: 'Marketplace demand for saplings is increasing.', confidence: 'Market Signal', color: 'text-cyan-400 bg-cyan-950/40 border-cyan-800' }
  ];

  // Dynamic state updates (clock & alert simulator)
  useEffect(() => {
    // Clock
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);

    // Live Alert Simulatation Ticker
    const alertSim = setInterval(() => {
      const alertTypes: Array<'FIRE' | 'FLOOD' | 'PLANTATION' | 'LAND' | 'SATELLITE' | 'DRONE' | 'CARBON' | 'MARKET' | 'INSURANCE' | 'USER'> = 
        ['FIRE', 'FLOOD', 'PLANTATION', 'LAND', 'SATELLITE', 'DRONE', 'CARBON', 'MARKET', 'INSURANCE', 'USER'];
      const randomType = alertTypes[Math.floor(Math.random() * alertTypes.length)];
      
      const newId = `ALT-${Math.floor(111 + Math.random() * 200)}`;
      let message = '';
      let level: 'CRITICAL' | 'WARNING' | 'INFO' = 'INFO';

      switch (randomType) {
        case 'FIRE':
          message = `FOREST FIRE ALERT: Thermal signature check flagged in ${focusedRegion === 'MP' ? 'Indore' : 'Kutch'} sector.`;
          level = 'CRITICAL';
          break;
        case 'FLOOD':
          message = `FLOOD ALERT: High moisture canopy saturation index near district water basins.`;
          level = 'WARNING';
          break;
        case 'PLANTATION':
          message = `NEW PLANTATION: Farmers added new geo-polygons for 1,200 saplings.`;
          break;
        case 'LAND':
          message = `LAND VERIFIED: Approved 12 acres. Verification index matches satellite parameters.`;
          break;
        case 'SATELLITE':
          message = `SATELLITE: GIS registry updated with latest NDVI reflectance coefficients.`;
          break;
        case 'DRONE':
          message = `DRONE LOG: Finished orthomosaic imagery map processing for project cluster.`;
          break;
        case 'CARBON':
          message = `CARBON CONTRACT: Corporate order matched at ₹450/credit.`;
          break;
        case 'MARKET':
          message = `SAPLINGS SHIPMENT: Order booked by local farmer cooperative.`;
          break;
        case 'INSURANCE':
          message = `CLAIM TRIGGERED: Satellite verified leaf-loss in drought-affected area.`;
          level = 'WARNING';
          break;
        case 'USER':
          message = `NODE CREATED: New agroforest block enrolled into carbon credit pipeline.`;
          break;
      }

      const newAlert: AlertItem = {
        id: newId,
        type: randomType,
        message,
        time: 'Just Now',
        level
      };

      // Push and slice
      setAlerts(prev => [newAlert, ...prev.slice(0, 9)]);

      // Dynamic stat micro-increments
      setStats(prev => ({
        ...prev,
        trees: prev.trees + (randomType === 'PLANTATION' ? 450 : 0),
        farmers: prev.farmers + (randomType === 'USER' ? 1 : 0),
        carbonCredits: prev.carbonCredits + (randomType === 'LAND' ? 12 : 0)
      }));

    }, 8000);

    return () => {
      clearInterval(timer);
      clearInterval(alertSim);
    };
  }, [focusedRegion]);

  // Sync / Refresh system
  const handleRefresh = () => {
    toast.success('Live GIS polygons and satellite monitoring feeds synchronized.');
  };

  // Selected focused region statistics
  const currentRegionStats = useMemo(() => {
    return regions[focusedRegion] || { name: 'Bhumi Network', farmers: 0, trees: 0, acres: 0, credits: 0, activeProjects: 0 };
  }, [focusedRegion, regions]);

  // Render vector alert icon
  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'FIRE': return <Flame className="w-4 h-4 text-rose-500 animate-pulse" />;
      case 'FLOOD': return <CloudRain className="w-4 h-4 text-cyan-400" />;
      case 'PLANTATION': return <Sprout className="w-4 h-4 text-emerald-400" />;
      case 'LAND': return <CheckCircle2 className="w-4 h-4 text-blue-400" />;
      case 'SATELLITE': return <Satellite className="w-4 h-4 text-purple-400 animate-spin-slow" />;
      case 'DRONE': return <Plane className="w-4 h-4 text-amber-400" />;
      case 'CARBON': return <Leaf className="w-4 h-4 text-emerald-500 animate-pulse" />;
      case 'MARKET': return <ShoppingBag className="w-4 h-4 text-cyan-500" />;
      case 'INSURANCE': return <ShieldCheck className="w-4 h-4 text-yellow-500" />;
      default: return <UserPlus className="w-4 h-4 text-slate-400" />;
    }
  };

  return (
    <div className="bg-[#0b0f19] text-[#e2e8f0] p-6 rounded-2xl border border-slate-800 min-h-screen space-y-6 select-none overflow-hidden" style={{ fontFamily: "'Inter', sans-serif" }}>
      
      {/* ── Header TV Banner ── */}
      <div className="flex flex-col md:flex-row items-center justify-between border-b border-slate-800 pb-5 gap-4">
        <div className="flex items-center gap-3">
          <div className="bg-[#10b981]/10 border border-[#10b981]/30 p-2.5 rounded-xl text-[#10b981] animate-pulse">
            <Globe2 className="w-7 h-7" />
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-widest text-white uppercase flex items-center gap-2">
              BhumiCred Command Center
              <span className="text-[9px] font-bold bg-[#10b981]/15 text-[#10b981] border border-[#10b981]/30 px-2 py-0.5 rounded-full tracking-normal uppercase">
                Live Console
              </span>
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Super Admin live surveillance cockpit • Connected via active Vyas Forest &amp; ESA satellite nodes
            </p>
          </div>
        </div>

        {/* Date and dynamic clock */}
        <div className="flex items-center gap-6">
          <div className="text-right">
            <span className="text-xs text-slate-500 font-bold uppercase tracking-wider block">Local Time</span>
            <span className="text-lg font-mono font-black text-[#10b981] block">
              {currentTime.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })} • {currentTime.toLocaleTimeString('en-IN', { hour12: false })}
            </span>
          </div>
          <button 
            onClick={handleRefresh}
            className="w-10 h-10 bg-slate-900 border border-slate-800 hover:border-emerald-500/50 rounded-xl flex items-center justify-center text-slate-400 hover:text-emerald-400 transition-all cursor-pointer"
          >
            <RefreshCw size={18} />
          </button>
        </div>
      </div>

      {/* ── Interactive Filters Header ── */}
      <div className="bg-[#0f172a] border border-slate-800 rounded-xl p-3.5 flex flex-wrap gap-3 items-center justify-between shadow-lg">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-400">
          <Search className="w-3.5 h-3.5" /> Filters:
        </div>

        <div className="flex flex-wrap gap-2.5 flex-1 justify-end">
          {/* State */}
          <select 
            value={selectedState} 
            onChange={e => setSelectedState(e.target.value)}
            className="bg-[#1e293b] border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-300 outline-none focus:border-emerald-500"
          >
            <option>All States</option>
            <option>Madhya Pradesh</option>
            <option>Rajasthan</option>
            <option>Gujarat</option>
            <option>Maharashtra</option>
            <option>Karnataka</option>
            <option>Uttar Pradesh</option>
          </select>

          {/* District */}
          <select 
            value={selectedDistrict} 
            onChange={e => setSelectedDistrict(e.target.value)}
            className="bg-[#1e293b] border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-300 outline-none focus:border-emerald-500"
          >
            <option>All Districts</option>
            <option>Sehore</option>
            <option>Kutch</option>
            <option>Dewas</option>
            <option>Ujjain</option>
            <option>Jhansi</option>
          </select>

          {/* Village */}
          <select 
            value={selectedVillage} 
            onChange={e => setSelectedVillage(e.target.value)}
            className="bg-[#1e293b] border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-300 outline-none focus:border-emerald-500"
          >
            <option>All Villages</option>
            <option>Amrapali Block</option>
            <option>Kalyanpur Cluster</option>
            <option>Pipariya</option>
          </select>

          {/* Project */}
          <select 
            value={selectedProject} 
            onChange={e => setSelectedProject(e.target.value)}
            className="bg-[#1e293b] border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-300 outline-none focus:border-emerald-500"
          >
            <option>All Projects</option>
            <option>Deccan Canopy III</option>
            <option>Coastal Afforestation V</option>
          </select>

          {/* Partner */}
          <select 
            value={selectedPartner} 
            onChange={e => setSelectedPartner(e.target.value)}
            className="bg-[#1e293b] border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-300 outline-none focus:border-emerald-500"
          >
            <option>All Partners</option>
            <option>Tata Steel</option>
            <option>Reliance Green</option>
            <option>Infosys Foundation</option>
          </select>

          {/* Carbon Project */}
          <select 
            value={selectedCarbonProject} 
            onChange={e => setSelectedCarbonProject(e.target.value)}
            className="bg-[#1e293b] border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-300 outline-none focus:border-emerald-500"
          >
            <option>All Carbon Projects</option>
            <option>VERRA-Agroforest-992</option>
            <option>GoldStd-Restoration-23</option>
          </select>

          {/* Insurer */}
          <select 
            value={selectedInsuranceCompany} 
            onChange={e => setSelectedInsuranceCompany(e.target.value)}
            className="bg-[#1e293b] border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-300 outline-none focus:border-emerald-500"
          >
            <option>All Insurers</option>
            <option>HDFC Agro Insure</option>
            <option>ICICI Climate Guard</option>
          </select>

          {/* Timeframe */}
          <select 
            value={dateRange} 
            onChange={e => setDateRange(e.target.value)}
            className="bg-[#1e293b] border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-[#10b981] font-bold outline-none focus:border-emerald-500"
          >
            <option>Today</option>
            <option>This Week</option>
            <option>This Month</option>
            <option>All Time</option>
          </select>
        </div>
      </div>

      {/* ── 3-Column Cockpit Layout ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
        
        {/* LEFT COLUMN: 14 Live Statistics Dashboard (3 cols) */}
        <div className="lg:col-span-3 space-y-4">
          <div className="border-b border-slate-800 pb-2">
            <span className="text-[10px] font-bold text-[#10b981] uppercase tracking-widest block">Bhumi Cred Node stats</span>
            <h3 className="font-extrabold text-xs text-white uppercase mt-0.5 flex items-center gap-1">
              <Database size={13}/> Live Performance Indices
            </h3>
          </div>

          <div className="grid grid-cols-2 gap-3 max-h-[72vh] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-slate-800">
            {[
              { label: 'Farmers', val: stats.farmers.toLocaleString(), desc: 'Nodes registered', color: 'text-white' },
              { label: 'Govt Bodies', val: stats.govtBodies, desc: 'States tied', color: 'text-white' },
              { label: 'Partners', val: stats.partners, desc: 'Corporate sponsors', color: 'text-white' },
              { label: 'Trees', val: (stats.trees / 1000).toFixed(0) + 'K', desc: 'Planted cover', color: 'text-emerald-400' },
              { label: 'Acres', val: stats.acres.toLocaleString(), desc: 'Afforested land', color: 'text-white' },
              { label: 'GIS Verified', val: stats.gisVerified.toLocaleString(), desc: 'Polygon approved', color: 'text-blue-400' },
              { label: 'Active Projects', val: stats.activeProjects, desc: 'Fenced clusters', color: 'text-white' },
              { label: 'Carbon Credits', val: (stats.carbonCredits / 1000).toFixed(0) + 'K t', desc: 'Registry volume', color: 'text-emerald-400 font-bold' },
              { label: 'Revenue', val: `₹${stats.revenue} Cr`, desc: 'ARR balance', color: 'text-[#10b981]' },
              { label: 'Market Orders', val: stats.marketplaceOrders, desc: 'Sapling dispatch', color: 'text-white' },
              { label: 'Policies', val: stats.insurancePolicies, desc: 'Tree cover insurance', color: 'text-white' },
              { label: 'Pending Orders', val: stats.pendingOrders, desc: 'Awaiting dispatch', color: 'text-rose-400' },
              { label: 'Withdrawals', val: `₹${stats.withdrawalsCr} Cr`, desc: 'Farmer DBT payout', color: 'text-white' },
              { label: 'Growth', val: `+${stats.growthPercent}%`, desc: 'YoY velocity', color: 'text-emerald-400' }
            ].map(s => (
              <div key={s.label} className="bg-[#0f172a] border border-slate-800 rounded-xl p-3 flex flex-col justify-between hover:border-slate-700 transition-colors shadow-sm">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">{s.label}</span>
                <h4 className={cn("text-base font-extrabold font-mono mt-1", s.color)}>{s.val}</h4>
                <span className="text-[9.5px] text-slate-500 mt-1 block leading-tight">{s.desc}</span>
              </div>
            ))}
          </div>
        </div>

        {/* MIDDLE COLUMN: Interactive Live India Map & AI Insights (6 cols) */}
        <div className="lg:col-span-6 space-y-5 flex flex-col justify-between">
          
          {/* Live India Map Dashboard Pane */}
          <div className="bg-[#0f172a] border border-slate-800 rounded-xl p-5 relative shadow-lg flex-1 flex flex-col justify-between" style={{ minHeight: 460 }}>
            {/* Map Header */}
            <div className="flex justify-between items-start border-b border-slate-800/80 pb-3">
              <div>
                <h3 className="text-sm font-extrabold text-white uppercase tracking-wider flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping inline-block" />
                  Live GIS Surveillance Grid
                </h3>
                <span className="text-[10.5px] text-slate-400 mt-1 block">Active Region Focus: {currentRegionStats.name}</span>
              </div>

              {/* Legend overlay */}
              <div className="flex items-center gap-3 text-[10px] text-slate-400">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded bg-emerald-500/80 border border-emerald-400 inline-block" /> High Density
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded bg-amber-600/70 border border-amber-500 inline-block" /> Arid Zone
                </div>
              </div>
            </div>

            {/* Styled Vector Map Canvas */}
            <div className="relative flex-grow flex items-center justify-center min-h-[300px] my-4 select-none">
              {/* Radar Radar sweep glow backdrop */}
              <div className="absolute w-64 h-64 border border-emerald-500/10 rounded-full animate-ping pointer-events-none" />
              <div className="absolute w-80 h-80 border border-emerald-500/5 rounded-full animate-pulse pointer-events-none" />

              {/* Map grid nodes vector graphic (India region highlights) */}
              <svg viewBox="0 0 600 480" className="w-full max-h-[320px] max-w-[420px] drop-shadow-[0_10px_20px_rgba(0,0,0,0.6)]">
                {/* Rajasthan */}
                <path 
                  onClick={() => setFocusedRegion('RJ')}
                  className={cn("transition-all duration-300 cursor-pointer", focusedRegion === 'RJ' ? 'fill-amber-500 stroke-white stroke-2 scale-[1.02]' : regions.RJ.colorDensity)}
                  d="M120,120 L200,100 L230,150 L190,210 L110,180 Z" 
                />
                <text x="160" y="150" className="fill-white font-black text-[12px] font-sans pointer-events-none text-center">RJ</text>

                {/* Madhya Pradesh */}
                <path 
                  onClick={() => setFocusedRegion('MP')}
                  className={cn("transition-all duration-300 cursor-pointer", focusedRegion === 'MP' ? 'fill-[#10b981] stroke-white stroke-2 scale-[1.02]' : regions.MP.colorDensity)}
                  d="M200,210 L290,190 L340,240 L280,290 L190,250 Z" 
                />
                <text x="250" y="240" className="fill-white font-black text-[12px] font-sans pointer-events-none">MP</text>

                {/* Gujarat */}
                <path 
                  onClick={() => setFocusedRegion('GJ')}
                  className={cn("transition-all duration-300 cursor-pointer", focusedRegion === 'GJ' ? 'fill-[#10b981] stroke-white stroke-2 scale-[1.02]' : regions.GJ.colorDensity)}
                  d="M70,200 L120,190 L160,250 L100,280 L70,250 Z" 
                />
                <text x="105" y="235" className="fill-white font-black text-[12px] font-sans pointer-events-none">GJ</text>

                {/* Maharashtra */}
                <path 
                  onClick={() => setFocusedRegion('MH')}
                  className={cn("transition-all duration-300 cursor-pointer", focusedRegion === 'MH' ? 'fill-[#10b981] stroke-white stroke-2 scale-[1.02]' : regions.MH.colorDensity)}
                  d="M165,260 L280,295 L270,360 L180,350 L140,310 Z" 
                />
                <text x="200" y="315" className="fill-white font-black text-[12px] font-sans pointer-events-none">MH</text>

                {/* Karnataka */}
                <path 
                  onClick={() => setFocusedRegion('KA')}
                  className={cn("transition-all duration-300 cursor-pointer", focusedRegion === 'KA' ? 'fill-[#10b981] stroke-white stroke-2 scale-[1.02]' : regions.KA.colorDensity)}
                  d="M175,355 L250,370 L240,440 L190,450 Z" 
                />
                <text x="200" y="405" className="fill-white font-black text-[12px] font-sans pointer-events-none">KA</text>

                {/* Uttar Pradesh */}
                <path 
                  onClick={() => setFocusedRegion('UP')}
                  className={cn("transition-all duration-300 cursor-pointer", focusedRegion === 'UP' ? 'fill-[#10b981] stroke-white stroke-2 scale-[1.02]' : regions.UP.colorDensity)}
                  d="M260,110 L340,130 L360,180 L295,185 L245,150 Z" 
                />
                <text x="290" y="155" className="fill-white font-black text-[12px] font-sans pointer-events-none">UP</text>
              </svg>

              {/* Map floating coordinates & status overlay */}
              <div className="absolute bottom-2 left-2 bg-slate-950/80 border border-slate-800 rounded-lg p-2.5 space-y-1 text-[10px] font-mono">
                <div>GRID COMPLIANCE: 100%</div>
                <div>SATELLITE ACCURACY: 99.8%</div>
                <div>GPS CALIBRATION: Vyas V3</div>
              </div>
            </div>

            {/* Drilldown Focus Detail box */}
            <div className="bg-slate-950/65 border border-slate-800 rounded-xl p-3.5 grid grid-cols-5 gap-3 text-center text-xs font-sans shadow-md">
              <div className="border-r border-slate-800/80 last:border-0 pr-1 text-center">
                <span className="text-[10px] text-slate-500 uppercase font-bold">State Focus</span>
                <span className="font-extrabold text-white block mt-1 truncate">{currentRegionStats.name}</span>
              </div>
              <div className="border-r border-slate-800/80 last:border-0 pr-1 text-center font-mono">
                <span className="text-[10px] text-slate-500 uppercase font-sans font-bold">Farmers</span>
                <span className="font-black text-[#10b981] block mt-1">{currentRegionStats.farmers.toLocaleString()}</span>
              </div>
              <div className="border-r border-slate-800/80 last:border-0 pr-1 text-center font-mono">
                <span className="text-[10px] text-slate-500 uppercase font-sans font-bold">Acreage</span>
                <span className="font-black text-white block mt-1">{currentRegionStats.acres.toLocaleString()} ac</span>
              </div>
              <div className="border-r border-slate-800/80 last:border-0 pr-1 text-center font-mono">
                <span className="text-[10px] text-slate-500 uppercase font-sans font-bold">Trees</span>
                <span className="font-black text-emerald-400 block mt-1">{(currentRegionStats.trees / 1000).toFixed(0)}K</span>
              </div>
              <div className="text-center font-mono">
                <span className="text-[10px] text-slate-500 uppercase font-sans font-bold">Carbon</span>
                <span className="font-black text-[#10b981] block mt-1">{(currentRegionStats.credits / 1000).toFixed(0)}K t</span>
              </div>
            </div>

          </div>

          {/* AI Insights & recommendations */}
          <div className="bg-[#0f172a] border border-slate-800 rounded-xl p-4 shadow-lg space-y-3">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-widest border-b border-slate-800 pb-2 flex items-center gap-1.5">
              <Sparkles size={14} className="text-emerald-400 animate-pulse"/> Live AI Recommendations
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              {aiRecommendations.map(rec => (
                <div key={rec.text} className={cn("p-2.5 rounded-lg border flex items-start gap-2 transition-all hover:scale-[1.01]", rec.color)}>
                  <Sparkles size={13} className="shrink-0 mt-0.5 text-primary"/>
                  <div>
                    <p className="font-bold leading-tight">{rec.text}</p>
                    <span className="text-[9px] uppercase tracking-wider block mt-1 opacity-70 font-semibold">{rec.confidence}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* RIGHT COLUMN: Real-Time Alerts Feed Ticker (3 cols) */}
        <div className="lg:col-span-3 space-y-4">
          <div className="border-b border-slate-800 pb-2 flex items-center justify-between">
            <h3 className="font-extrabold text-xs text-white uppercase mt-0.5 flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-rose-500 animate-ping inline-block" />
              Live Surveillance Feed
            </h3>
            <span className="text-[9.5px] text-slate-500 font-mono">Refresh: Ticking...</span>
          </div>

          {/* Live Alerts list */}
          <div className="space-y-2.5 max-h-[82vh] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-slate-800">
            {alerts.map(a => (
              <div 
                key={a.id} 
                className={cn(
                  "bg-[#0f172a] border rounded-xl p-3.5 space-y-2 relative transition-all duration-300 text-xs shadow-sm",
                  a.level === 'CRITICAL' ? 'border-rose-900 bg-rose-950/15 shadow-[0_0_15px_rgba(239,68,68,0.05)]' :
                  a.level === 'WARNING' ? 'border-yellow-900 bg-yellow-950/10' :
                  'border-slate-800 hover:border-slate-700'
                )}
              >
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-1.5 font-bold text-slate-200 uppercase tracking-wide">
                    {getAlertIcon(a.type)}
                    <span className={cn(
                      a.level === 'CRITICAL' ? 'text-rose-400' :
                      a.level === 'WARNING' ? 'text-yellow-400' :
                      'text-slate-300'
                    )}>{a.type}</span>
                  </div>
                  <span className="font-mono text-[9px] text-slate-500">{a.time}</span>
                </div>

                <p className="text-slate-300 leading-snug">{a.message}</p>

                {a.level === 'CRITICAL' && (
                  <div className="pt-1.5 border-t border-rose-900/40 flex justify-between items-center">
                    <span className="text-[9px] uppercase tracking-wider text-rose-500 font-black animate-pulse">Critical Emergency</span>
                    <button 
                      onClick={() => toast.success(`Audit task dispatched for emergency ${a.id}`)}
                      className="px-2 py-0.5 bg-rose-500 hover:bg-rose-600 text-white rounded text-[9.5px] font-bold border-0 cursor-pointer transition-colors"
                    >
                      Dispatch Team
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

      </div>

    </div>
  );
};

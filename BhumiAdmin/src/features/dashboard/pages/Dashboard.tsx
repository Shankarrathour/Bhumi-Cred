import { useState } from 'react';
import {
  Sprout, Cloud, ShieldCheck, Wallet,
  AlertTriangle, Map, Leaf, TrendingUp, Activity,
  RefreshCw, Zap, BarChart2, Building2, Handshake, Calendar, ChevronDown,
  UserCheck, FileText, ArrowUpRight, LifeBuoy, ShoppingBag, CloudLightning,
  Layers, UserPlus, Clock
} from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  ResponsiveContainer, Tooltip, CartesianGrid, XAxis, YAxis
} from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { KpiCard } from '../../../components/ui/KpiCard';
import { ChartCard } from '../../../components/ui/ChartCard';
import { StatusBadge } from '../../../components/ui/StatusBadge';
import { PageHeader } from '../../../components/ui/PageHeader';
import { useDashboard } from '../api/useDashboard';

// ── Datasets for Analytics Charts ──────────────────────────────────────────

const DAILY_REGISTRATION_DATA = [
  { day: 'Mon', farmers: 142, users: 210 },
  { day: 'Tue', farmers: 185, users: 280 },
  { day: 'Wed', farmers: 210, users: 340 },
  { day: 'Thu', farmers: 265, users: 410 },
  { day: 'Fri', farmers: 310, users: 480 },
  { day: 'Sat', farmers: 389, users: 560 },
  { day: 'Sun', farmers: 512, users: 690 },
];

const MONTHLY_REVENUE_DATA = [
  { month: 'Mar', totalRevenue: 1.8, marketplaceSales: 0.6 },
  { month: 'Apr', totalRevenue: 2.1, marketplaceSales: 0.8 },
  { month: 'May', totalRevenue: 1.9, marketplaceSales: 0.7 },
  { month: 'Jun', totalRevenue: 2.5, marketplaceSales: 1.1 },
  { month: 'Jul', totalRevenue: 2.2, marketplaceSales: 0.9 },
  { month: 'Aug', totalRevenue: 2.84, marketplaceSales: 1.4 },
];

const CARBON_CREDITS_DATA = [
  { month: 'Mar', generated: 180, sold: 120 },
  { month: 'Apr', generated: 240, sold: 175 },
  { month: 'May', generated: 290, sold: 210 },
  { month: 'Jun', generated: 350, sold: 280 },
  { month: 'Jul', generated: 410, sold: 340 },
  { month: 'Aug', generated: 490, sold: 410 },
];

const ACTIVE_PROJECTS_DATA = [
  { name: 'Forestry & Afforestation', value: 32, color: '#16A34A' },
  { name: 'Soil Carbon Sequestration', value: 28, color: '#2563EB' },
  { name: 'Agri-Solar Infrastructure', value: 18, color: '#F59E0B' },
  { name: 'Water Management',         value: 11, color: '#8B5CF6' },
];

const INSURANCE_SALES_DATA = [
  { month: 'Mar', activePolicies: 8200, claimsSettled: 42 },
  { month: 'Apr', activePolicies: 9400, claimsSettled: 58 },
  { month: 'May', activePolicies: 10100, claimsSettled: 64 },
  { month: 'Jun', activePolicies: 11200, claimsSettled: 79 },
  { month: 'Jul', activePolicies: 12000, claimsSettled: 85 },
  { month: 'Aug', activePolicies: 12450, claimsSettled: 92 },
];

const MARKETPLACE_SALES_DATA = [
  { month: 'Mar', orders: 1200, gmv: 45 },
  { month: 'Apr', orders: 1350, gmv: 52 },
  { month: 'May', orders: 1480, gmv: 61 },
  { month: 'Jun', orders: 1600, gmv: 74 },
  { month: 'Jul', orders: 1710, gmv: 82 },
  { month: 'Aug', orders: 1840, gmv: 96 },
];

// ── Recent Activities List (7 Events) ──────────────────────────────────────

const RECENT_ACTIVITIES_FEED = [
  { id: 'act_1', type: 'Farmer Registered',   icon: Sprout,        color: '#16A34A', bg: '#F0FDF4', title: 'Farmer Registered',     subtitle: 'Ramesh Patel registered from Sehore, MP',          time: '2 mins ago',  route: '/farmers' },
  { id: 'act_2', type: 'Land Submitted',       icon: Map,           color: '#F59E0B', bg: '#FFFBEB', title: 'Land Submitted',          subtitle: '45.2 acres parcel submitted in Betul district',   time: '5 mins ago',  route: '/land' },
  { id: 'act_3', type: 'Govt Body Approved',  icon: Building2,     color: '#2563EB', bg: '#EFF6FF', title: 'Govt Body Approved',     subtitle: 'Dept of Agriculture, MP approved on portal',       time: '12 mins ago', route: '/govt' },
  { id: 'act_4', type: 'Partner Registered',   icon: Handshake,     color: '#D97706', bg: '#FFFBEB', title: 'Partner Registered',      subtitle: 'GreenAgri Ltd onboarded as B2B Partner',           time: '18 mins ago', route: '/partners' },
  { id: 'act_5', type: 'Insurance Purchased',  icon: ShieldCheck,   color: '#8B5CF6', bg: '#F5F3FF', title: 'Insurance Purchased',     subtitle: 'Tree Cover Insurance Policy #TS-9081 issued',      time: '25 mins ago', route: '/insurance' },
  { id: 'act_6', type: 'Marketplace Order',    icon: ShoppingBag,   color: '#059669', bg: '#ECFDF5', title: 'Marketplace Order',       subtitle: 'Order #ORD-8812 for Bio-Fertilizers placed',      time: '32 mins ago', route: '/marketplace' },
  { id: 'act_7', type: 'Withdrawal Request',   icon: ArrowUpRight,  color: '#EF4444', bg: '#FEF2F2', title: 'Withdrawal Request',      subtitle: '₹45,000 payout requested by Sita Devi (Indore)',   time: '40 mins ago', route: '/wallet' },
];

const LIVE_ALERTS = [
  { title: 'Forest Fire Warning',        region: 'Maharashtra Region',  level: 'danger',  time: '2 mins ago', route: '/command-center' },
  { title: 'Heavy Rainfall Warning',     region: 'Gujarat Region',      level: 'warning', time: '14 mins ago', route: '/command-center' },
  { title: 'Land Verification Queue',    region: 'Madhya Pradesh',      level: 'warning', time: '22 mins ago', route: '/land' },
  { title: 'New Plantation (500 Trees)', region: 'Chhattisgarh',        level: 'success', time: '35 mins ago', route: '/projects' },
];

const DATE_RANGE_OPTIONS = [
  'Today (Live Data)',
  'This Week',
  'This Month',
  'Last Quarter',
  'This Year',
];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-[#E2E8F0] rounded-xl px-3 py-2 shadow-md text-[12px]">
      <div className="font-bold text-[#0F172A] mb-1">{label}</div>
      {payload.map((p: any) => (
        <div key={p.name} className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full" style={{ background: p.color }} />
          <span className="text-[#64748B]">{p.name}:</span>
          <span className="font-semibold text-[#0F172A]">{p.value}</span>
        </div>
      ))}
    </div>
  );
};

export const Dashboard = () => {
  const navigate = useNavigate();
  const { data: serverData, refetch } = useDashboard();
  const [refreshing, setRefreshing] = useState(false);
  const [dateRange, setDateRange] = useState('Today (Live Data)');
  const [showDatePicker, setShowDatePicker] = useState(false);
  
  // Charts tab selector
  const [activeChartTab, setActiveChartTab] = useState<'DailyReg' | 'MonthlyRev' | 'Carbon' | 'ActiveProjects' | 'Insurance' | 'Marketplace'>('DailyReg');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setTimeout(() => {
      setRefreshing(false);
      triggerToast('Dashboard metrics updated');
    }, 600);
  };

  return (
    <div className="space-y-6 page-enter pb-8" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>

      {/* ── Page Header ── */}
      <PageHeader
        title="Executive Dashboard"
        description="Platform overview, performance metrics, and recent activity."
        badge={{ label: 'Live Data', variant: 'success' }}
        icon={BarChart2}
        iconColor="#16A34A"
        actions={
          <div className="flex items-center gap-3 relative">
            <div className="relative">
              <button
                onClick={() => setShowDatePicker(!showDatePicker)}
                className="flex items-center gap-2 px-3 py-1.5 bg-white border border-[#E2E8F0] hover:border-[#CBD5E1] hover:bg-[#F8FAFC] rounded-xl text-[12px] text-[#64748B] shadow-xs cursor-pointer transition-colors"
              >
                <Calendar size={14} className="text-[#94A3B8]" />
                <span className="font-medium text-[#0F172A]">{dateRange}</span>
                <ChevronDown size={12} className="text-[#94A3B8]" />
              </button>

              <AnimatePresence>
                {showDatePicker && (
                  <motion.div
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 6 }}
                    className="absolute right-0 top-[calc(100%+6px)] w-[220px] bg-white rounded-2xl border border-[#E8EDF5] shadow-lg z-50 p-1.5"
                  >
                    <div className="px-3 py-1.5 border-b border-[#F1F5F9] mb-1">
                      <p className="text-[10.5px] font-bold uppercase tracking-wider text-[#94A3B8]">Filter Date Range</p>
                    </div>
                    {DATE_RANGE_OPTIONS.map((opt) => (
                      <button
                        key={opt}
                        onClick={() => {
                          setDateRange(opt);
                          setShowDatePicker(false);
                          triggerToast(`Filtered dashboard for ${opt}`);
                        }}
                        className={`w-full text-left px-3 py-2 rounded-xl text-[12px] font-medium transition-colors ${
                          dateRange === opt ? 'bg-[#F0FDF4] text-[#16A34A] font-bold' : 'hover:bg-[#F8FAFC] text-[#374151]'
                        }`}
                      >
                        {opt}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <button
              onClick={handleRefresh}
              className="flex items-center gap-2 px-3 py-1.5 bg-white border border-[#E2E8F0] hover:border-[#CBD5E1] hover:bg-[#F8FAFC] text-[#0F172A] font-semibold text-[12.5px] rounded-xl shadow-xs transition-all active:scale-95 cursor-pointer"
            >
              <RefreshCw size={13} className={`text-[#64748B] ${refreshing ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
          </div>
        }
      />

      {/* ── KEY METRICS (12 KPI Cards) ── */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-[13px] font-bold uppercase tracking-wider text-[#64748B] flex items-center gap-2">
            <Layers size={14} className="text-[#16A34A]" />
            <span>Key Metrics</span>
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {/* Card 1: Total Farmers */}
          <KpiCard
            title="TOTAL FARMERS"
            value={serverData?.overview_cards?.total_farmers ? serverData.overview_cards.total_farmers.toLocaleString() : "7,842"}
            icon={Sprout}
            iconBg="#F0FDF4"
            iconColor="#16A34A"
            trend={14.2}
            sparkColor="#16A34A"
            sparkData={[6200, 6500, 6900, 7200, 7500, 7700, 7842]}
            onClick={() => navigate('/farmers')}
          />

          {/* Card 2: Total Govt Bodies */}
          <KpiCard
            title="TOTAL GOVT BODIES"
            value={serverData?.overview_cards?.total_govt_bodies ? serverData.overview_cards.total_govt_bodies.toString() : "124"}
            icon={Building2}
            iconBg="#EFF6FF"
            iconColor="#2563EB"
            trend={4.2}
            sparkColor="#2563EB"
            sparkData={[110, 112, 115, 118, 120, 122, 124]}
            onClick={() => navigate('/govt')}
          />

          {/* Card 3: Total Partners */}
          <KpiCard
            title="TOTAL PARTNERS"
            value={serverData?.overview_cards?.total_partners ? serverData.overview_cards.total_partners.toString() : "892"}
            icon={Handshake}
            iconBg="#FFFBEB"
            iconColor="#D97706"
            trend={15.2}
            sparkColor="#D97706"
            sparkData={[720, 750, 780, 810, 840, 865, 892]}
            onClick={() => navigate('/partners')}
          />

          {/* Card 4: Pending Approval */}
          <KpiCard
            title="PENDING APPROVAL"
            value={serverData?.overview_cards?.pending_approval != null ? serverData.overview_cards.pending_approval.toString() : "38"}
            icon={Clock}
            iconBg="#FFFBEB"
            iconColor="#D97706"
            trend={-5.1}
            sparkColor="#D97706"
            sparkData={[52, 48, 45, 42, 40, 39, 38]}
            onClick={() => navigate('/kyc')}
          />

          {/* Card 5: Pending KYC */}
          <KpiCard
            title="PENDING KYC"
            value={serverData?.overview_cards?.pending_kyc != null ? serverData.overview_cards.pending_kyc.toString() : "148"}
            icon={UserCheck}
            iconBg="#FEF2F2"
            iconColor="#EF4444"
            trend={-8.4}
            sparkColor="#EF4444"
            sparkData={[190, 180, 172, 165, 158, 152, 148]}
            onClick={() => navigate('/kyc')}
          />

          {/* Card 6: Pending Land */}
          <KpiCard
            title="PENDING LAND"
            value={serverData?.overview_cards?.pending_land != null ? serverData.overview_cards.pending_land.toString() : "312"}
            icon={Map}
            iconBg="#FFFBEB"
            iconColor="#F59E0B"
            trend={-3.1}
            sparkColor="#F59E0B"
            sparkData={[350, 342, 335, 328, 320, 316, 312]}
            onClick={() => navigate('/land')}
          />

          {/* Card 7: Pending Projects */}
          <KpiCard
            title="PENDING PROJECTS"
            value={serverData?.overview_cards?.pending_projects != null ? serverData.overview_cards.pending_projects.toString() : "24"}
            icon={FileText}
            iconBg="#EFF6FF"
            iconColor="#2563EB"
            trend={2.5}
            sparkColor="#2563EB"
            sparkData={[18, 19, 20, 21, 22, 23, 24]}
            onClick={() => navigate('/projects')}
          />

          {/* Card 8: Pending Insurance */}
          <KpiCard
            title="PENDING INSURANCE"
            value={serverData?.overview_cards?.pending_insurance != null ? serverData.overview_cards.pending_insurance.toString() : "67"}
            icon={ShieldCheck}
            iconBg="#F5F3FF"
            iconColor="#8B5CF6"
            trend={-6.2}
            sparkColor="#8B5CF6"
            sparkData={[85, 80, 76, 73, 70, 68, 67]}
            onClick={() => navigate('/insurance')}
          />

          {/* Card 9: Pending Withdrawals */}
          <KpiCard
            title="PENDING WITHDRAWALS"
            value={serverData?.overview_cards?.pending_withdrawals != null ? serverData.overview_cards.pending_withdrawals.toString() : "42"}
            icon={ArrowUpRight}
            iconBg="#FEF2F2"
            iconColor="#EF4444"
            trend={-4.5}
            sparkColor="#EF4444"
            sparkData={[58, 54, 50, 48, 45, 43, 42]}
            onClick={() => navigate('/wallet')}
          />

          {/* Card 10: Total Revenue */}
          <KpiCard
            title="TOTAL REVENUE"
            value={serverData?.overview_cards?.total_revenue_inr ? `₹${(serverData.overview_cards.total_revenue_inr / 10000000).toFixed(2)}Cr` : "₹2.84Cr"}
            icon={TrendingUp}
            iconBg="#F0FDF4"
            iconColor="#16A34A"
            trend={18.5}
            sparkColor="#16A34A"
            sparkData={[1.8, 2.1, 1.9, 2.5, 2.2, 2.6, 2.84]}
            onClick={() => navigate('/reports')}
          />

          {/* Card 11: Total Carbon Credits */}
          <KpiCard
            title="TOTAL CARBON CREDITS"
            value={serverData?.overview_cards?.total_carbon_credits_tco2e ? `${(serverData.overview_cards.total_carbon_credits_tco2e / 1000000).toFixed(2)}M` : "1.24M"}
            suffix=" tCO2e"
            icon={Cloud}
            iconBg="#F0FDF4"
            iconColor="#16A34A"
            trend={8.1}
            sparkColor="#16A34A"
            sparkData={[0.9, 0.95, 1.0, 1.05, 1.1, 1.15, 1.24]}
            onClick={() => navigate('/carbon')}
          />

          {/* Card 12: Total Marketplace Orders */}
          <KpiCard
            title="TOTAL MARKETPLACE ORDERS"
            value={serverData?.overview_cards?.total_marketplace_orders ? serverData.overview_cards.total_marketplace_orders.toLocaleString() : "1,840"}
            icon={ShoppingBag}
            iconBg="#FFFBEB"
            iconColor="#D97706"
            trend={19.8}
            sparkColor="#D97706"
            sparkData={[1200, 1350, 1480, 1600, 1710, 1780, 1840]}
            onClick={() => navigate('/marketplace')}
          />
        </div>
      </div>

      {/* ── CHARTS SECTION ── */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">

        {/* Tabbed 6 Analytics Charts Container (2 Cols) */}
        <ChartCard
          title="Analytics Overview"
          subtitle="Track registrations, revenue, carbon credits, projects, insurance, and marketplace performance."
          height={280}
          className="xl:col-span-2"
          actions={
            <div className="flex items-center gap-1 bg-[#F8FAFC] border border-[#E2E8F0] p-1 rounded-xl overflow-x-auto">
              {([
                { key: 'DailyReg', label: 'Daily Registration' },
                { key: 'MonthlyRev', label: 'Monthly Revenue' },
                { key: 'Carbon', label: 'Carbon Credits' },
                { key: 'ActiveProjects', label: 'Active Projects' },
                { key: 'Insurance', label: 'Insurance Sales' },
                { key: 'Marketplace', label: 'Marketplace Sales' },
              ] as const).map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveChartTab(tab.key)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer whitespace-nowrap ${
                    activeChartTab === tab.key
                      ? 'bg-white text-[#16A34A] shadow-xs'
                      : 'text-[#64748B] hover:text-[#0F172A]'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          }
        >
          <ResponsiveContainer width="100%" height="100%">
            {activeChartTab === 'DailyReg' ? (
              <AreaChart data={DAILY_REGISTRATION_DATA} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="gradFarmersReg" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#16A34A" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#16A34A" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="farmers" name="Farmer Registrations" stroke="#16A34A" strokeWidth={2.5} fill="url(#gradFarmersReg)" />
                <Area type="monotone" dataKey="users" name="Platform Users" stroke="#2563EB" strokeWidth={2} fill="transparent" />
              </AreaChart>
            ) : activeChartTab === 'MonthlyRev' ? (
              <BarChart data={MONTHLY_REVENUE_DATA} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="totalRevenue" name="Total Revenue (₹Cr)" fill="#16A34A" radius={[6, 6, 0, 0]} />
                <Bar dataKey="marketplaceSales" name="Marketplace Sales (₹Cr)" fill="#F59E0B" radius={[6, 6, 0, 0]} />
              </BarChart>
            ) : activeChartTab === 'Carbon' ? (
              <AreaChart data={CARBON_CREDITS_DATA} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="generated" name="Credits Generated (k tCO2e)" stroke="#16A34A" fill="#F0FDF4" strokeWidth={2.5} />
                <Area type="monotone" dataKey="sold" name="Credits Sold (k tCO2e)" stroke="#059669" fill="#ECFDF5" strokeWidth={2.5} />
              </AreaChart>
            ) : activeChartTab === 'ActiveProjects' ? (
              <BarChart data={ACTIVE_PROJECTS_DATA} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="value" name="Active Projects" fill="#2563EB" radius={[6, 6, 0, 0]} />
              </BarChart>
            ) : activeChartTab === 'Insurance' ? (
              <BarChart data={INSURANCE_SALES_DATA} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="activePolicies" name="Active Tree Policies" fill="#8B5CF6" radius={[6, 6, 0, 0]} />
                <Bar dataKey="claimsSettled" name="Claims Settled" fill="#EF4444" radius={[6, 6, 0, 0]} />
              </BarChart>
            ) : (
              <BarChart data={MARKETPLACE_SALES_DATA} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="orders" name="Orders Count" fill="#D97706" radius={[6, 6, 0, 0]} />
                <Bar dataKey="gmv" name="Sales Volume (₹ Lakhs)" fill="#16A34A" radius={[6, 6, 0, 0]} />
              </BarChart>
            )}
          </ResponsiveContainer>
        </ChartCard>

        {/* Active Projects Donut Breakdown (1 Col) */}
        <ChartCard title="Active Projects Distribution" subtitle="89 Active Carbon & Forestry Projects" height={280}>
          <div className="flex items-center gap-4 h-full cursor-pointer" onClick={() => navigate('/projects')}>
            <ResponsiveContainer width="55%" height="100%">
              <PieChart>
                <Pie
                  data={ACTIVE_PROJECTS_DATA}
                  cx="50%" cy="50%"
                  innerRadius={55} outerRadius={78}
                  dataKey="value" paddingAngle={4}
                  startAngle={90} endAngle={-270}
                >
                  {ACTIVE_PROJECTS_DATA.map((entry, i) => (
                    <Cell key={i} fill={entry.color} strokeWidth={0} />
                  ))}
                </Pie>
                <Tooltip formatter={(v: any) => [`${v} projects`, '']} />
              </PieChart>
            </ResponsiveContainer>

            <div className="flex-1 space-y-3">
              {ACTIVE_PROJECTS_DATA.map(p => (
                <div key={p.name} className="flex items-center justify-between hover:opacity-80">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: p.color }} />
                    <span className="text-[11px] font-medium text-[#64748B]">{p.name}</span>
                  </div>
                  <span className="text-[12px] font-bold text-[#0F172A]">{p.value}</span>
                </div>
              ))}
            </div>
          </div>
        </ChartCard>

      </div>

      {/* ── RECENT ACTIVITIES (7 Events) ── */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">

        {/* Recent Activities Stream (2 Cols) */}
        <div className="bg-white border border-[#E8EDF5] rounded-2xl p-5 shadow-[0_2px_8px_rgba(0,0,0,0.03)] xl:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-[14px] font-bold text-[#0F172A] flex items-center gap-2">
                <Activity size={16} className="text-[#16A34A]" />
                <span>Recent Activity</span>
              </h3>
              <p className="text-[11.5px] text-[#94A3B8]">
                Real-time platform events across farmers, lands, government, partners, insurance, orders, and withdrawals
              </p>
            </div>
            <button onClick={() => navigate('/audit')} className="text-[12px] text-[#16A34A] hover:underline font-semibold cursor-pointer">
              View Audit Ledger
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
            {RECENT_ACTIVITIES_FEED.map((item, i) => (
              <motion.div
                key={item.id}
                onClick={() => navigate(item.route)}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                className="flex items-start gap-3 p-3 border border-[#F1F5F9] rounded-xl hover:bg-[#F8FAFC] hover:border-[#E2E8F0] cursor-pointer transition-all"
              >
                <div className="shrink-0 w-8 h-8 rounded-xl flex items-center justify-center mt-0.5" style={{ background: item.bg }}>
                  <item.icon size={16} style={{ color: item.color }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-[12.5px] font-semibold text-[#0F172A] truncate">{item.title}</span>
                    <span className="text-[10px] font-medium text-[#94A3B8] shrink-0">{item.time}</span>
                  </div>
                  <div className="text-[11px] text-[#64748B] mt-0.5 truncate">{item.subtitle}</div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Live System Flags & AI Intelligence (1 Col) */}
        <div className="bg-white border border-[#E8EDF5] rounded-2xl p-5 shadow-[0_2px_8px_rgba(0,0,0,0.03)] xl:col-span-1 space-y-4">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h3 className="text-[14px] font-bold text-[#0F172A]">Live System Flags</h3>
              <p className="text-[11.5px] text-[#94A3B8]">Priority operational alerts</p>
            </div>
            <button onClick={() => navigate('/notifications')} className="text-[12px] text-[#16A34A] hover:underline font-semibold cursor-pointer">
              Alerts Center
            </button>
          </div>

          <div className="space-y-2">
            {LIVE_ALERTS.map((alert, i) => (
              <motion.div
                key={i}
                onClick={() => navigate(alert.route)}
                initial={{ opacity: 0, x: 6 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className="flex items-start justify-between gap-2.5 p-2.5 rounded-xl bg-[#FAFCFF] border border-[#F1F5F9] hover:border-[#E2E8F0] cursor-pointer"
              >
                <div className="flex items-start gap-2.5">
                  <div className={`shrink-0 w-7 h-7 rounded-lg flex items-center justify-center mt-0.5 ${
                    alert.level === 'danger'  ? 'bg-[#FEF2F2]' :
                    alert.level === 'warning' ? 'bg-[#FFFBEB]' : 'bg-[#F0FDF4]'
                  }`}>
                    {alert.level === 'danger'  ? <AlertTriangle size={13} className="text-[#EF4444]" /> :
                     alert.level === 'warning' ? <AlertTriangle size={13} className="text-[#F59E0B]" /> :
                                                 <Leaf          size={13} className="text-[#16A34A]" />}
                  </div>
                  <div>
                    <div className="text-[12px] font-semibold text-[#0F172A] leading-tight">{alert.title}</div>
                    <div className="text-[10.5px] text-[#94A3B8] mt-0.5">{alert.region} • {alert.time}</div>
                  </div>
                </div>
                <StatusBadge
                  label={alert.level === 'danger' ? 'High' : alert.level === 'warning' ? 'Med' : 'Low'}
                  variant={alert.level === 'danger' ? 'danger' : alert.level === 'warning' ? 'warning' : 'success'}
                  size="sm"
                />
              </motion.div>
            ))}
          </div>

          {/* AI Analytics Card */}
          <div className="p-3.5 rounded-xl border border-[#DCFCE7] bg-[#F0FDF4]">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5">
                <Zap size={14} className="text-[#16A34A]" />
                <span className="text-[12px] font-bold text-[#16A34A]">BhumiAI Analytics</span>
              </div>
              <span className="text-[10px] font-bold bg-white text-[#16A34A] px-1.5 py-0.5 rounded border border-[#DCFCE7]">96% Confidence</span>
            </div>
            <p className="text-[11.5px] font-semibold text-[#0F172A] leading-snug mb-1">
              MP & MH land verification throughput increased by 28% this week.
            </p>
            <p className="text-[10.5px] text-[#64748B]">
              Real-time activity and analytics telemetry actively synchronized.
            </p>
          </div>
        </div>

      </div>

      {/* ── Floating Toast Notification ── */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-2xl flex items-center gap-3 border border-slate-700"
          >
            <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            <span className="text-xs font-medium">{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
};

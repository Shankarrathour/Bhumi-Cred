import { useState } from 'react';
import {
  Sprout, Cloud, ShieldCheck, Wallet,
  AlertTriangle, Map, Leaf, TrendingUp, Activity,
  RefreshCw, Zap, BarChart2, Building2, Handshake, Calendar, ChevronDown,
  UserCheck, FileText, CreditCard, ArrowUpRight, LifeBuoy, ShoppingBag, CloudLightning,
  Layers, UserPlus
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

// ── Mock Datasets for Dashboard Charts ────────────────────────────────────

const GROWTH_CHART_DATA = [
  { month: 'Mar', dailyUsers: 1420, farmers: 2800, govt: 18, partners: 120 },
  { month: 'Apr', dailyUsers: 1850, farmers: 3400, govt: 24, partners: 165 },
  { month: 'May', dailyUsers: 2100, farmers: 4100, govt: 31, partners: 210 },
  { month: 'Jun', dailyUsers: 2650, farmers: 5200, govt: 42, partners: 285 },
  { month: 'Jul', dailyUsers: 3100, farmers: 6400, govt: 55, partners: 350 },
  { month: 'Aug', dailyUsers: 3890, farmers: 7800, govt: 68, partners: 430 },
];

const REVENUE_MARKETPLACE_DATA = [
  { month: 'Mar', revenue: 1.8, marketplaceSales: 0.6 },
  { month: 'Apr', revenue: 2.1, marketplaceSales: 0.8 },
  { month: 'May', revenue: 1.9, marketplaceSales: 0.7 },
  { month: 'Jun', revenue: 2.5, marketplaceSales: 1.1 },
  { month: 'Jul', revenue: 2.2, marketplaceSales: 0.9 },
  { month: 'Aug', revenue: 2.8, marketplaceSales: 1.4 },
];

const CARBON_CREDIT_DATA = [
  { month: 'Mar', generated: 180, sold: 120 },
  { month: 'Apr', generated: 240, sold: 175 },
  { month: 'May', generated: 290, sold: 210 },
  { month: 'Jun', generated: 350, sold: 280 },
  { month: 'Jul', generated: 410, sold: 340 },
  { month: 'Aug', generated: 490, sold: 410 },
];

const INSURANCE_DATA = [
  { month: 'Mar', activePolicies: 8200, claimsApproved: 42 },
  { month: 'Apr', activePolicies: 9400, claimsApproved: 58 },
  { month: 'May', activePolicies: 10100, claimsApproved: 64 },
  { month: 'Jun', activePolicies: 11200, claimsApproved: 79 },
  { month: 'Jul', activePolicies: 12000, claimsApproved: 85 },
  { month: 'Aug', activePolicies: 12450, claimsApproved: 92 },
];

const PROJECT_STATUS = [
  { name: 'Completed',   value: 32, color: '#16A34A' },
  { name: 'In Progress', value: 28, color: '#2563EB' },
  { name: 'Pending Verification', value: 18, color: '#F59E0B' },
  { name: 'On Hold',     value: 11, color: '#EF4444' },
];

// ── Live Activity Feed (Includes all 7 BRD Event Types) ───────────────────
const LIVE_ACTIVITY_FEED = [
  { id: 1, type: 'Farmer Registered',     icon: Sprout,        color: '#16A34A', bg: '#F0FDF4', title: 'Farmer Registered',      subtitle: 'Ramesh Patel from Sehore, MP',          time: '2 mins ago',  route: '/farmers' },
  { id: 2, type: 'Government Registered', icon: Building2,     color: '#2563EB', bg: '#EFF6FF', title: 'Government Registered',  subtitle: 'Dept of Agriculture, MP joined portal',  time: '5 mins ago',  route: '/govt' },
  { id: 3, type: 'Land Approved',          icon: Map,           color: '#16A34A', bg: '#F0FDF4', title: 'Land Approved',          subtitle: '45.2 acres parcel in Betul verified',   time: '12 mins ago', route: '/land' },
  { id: 4, type: 'Insurance Purchased',    icon: ShieldCheck,   color: '#8B5CF6', bg: '#F5F3FF', title: 'Insurance Purchased',    subtitle: 'Tree Shield Policy #TS-9021 bought',    time: '18 mins ago', route: '/insurance' },
  { id: 5, type: 'Carbon Sold',            icon: CloudLightning,color: '#059669', bg: '#ECFDF5', title: 'Carbon Credit Sold',     subtitle: '500 tCO2e sold to EcoCorp Ltd',         time: '25 mins ago', route: '/carbon' },
  { id: 6, type: 'Withdrawal Requested',   icon: ArrowUpRight,  color: '#EF4444', bg: '#FEF2F2', title: 'Withdrawal Requested',   subtitle: '₹45,000 request by Sita Devi (Indore)', time: '32 mins ago', route: '/wallet' },
  { id: 7, type: 'Partner Joined',         icon: Handshake,     color: '#D97706', bg: '#FFFBEB', title: 'Partner Joined',         subtitle: 'GreenAgri Ltd onboarded as B2B Partner',time: '45 mins ago', route: '/partners' },
];

const LIVE_ALERTS = [
  { title: 'Forest Fire Warning',        region: 'Maharashtra Region',  level: 'danger',  time: '2 mins ago', route: '/command-center' },
  { title: 'Heavy Rainfall Warning',     region: 'Gujarat Region',      level: 'warning', time: '14 mins ago', route: '/command-center' },
  { title: 'Land Verification Queue',    region: 'Madhya Pradesh',      level: 'warning', time: '22 mins ago', route: '/land' },
  { title: 'New Plantation (500 Trees)', region: 'Chhattisgarh',        level: 'success', time: '35 mins ago', route: '/projects' },
];

const DATE_RANGE_OPTIONS = [
  'Today (Live Telemetry)',
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
  const { refetch } = useDashboard();
  const [refreshing, setRefreshing] = useState(false);
  const [dateRange, setDateRange] = useState('Today (Live Telemetry)');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [activeChartTab, setActiveChartTab] = useState<'Growth' | 'Revenue' | 'Carbon' | 'Insurance'>('Growth');
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
      triggerToast('Dashboard metrics re-synchronized with live server telemetry');
    }, 600);
  };

  return (
    <div className="space-y-6 page-enter pb-8">

      {/* ── Page Header ── */}
      <PageHeader
        title="Executive Dashboard"
        description="Module 1: Real-time telemetry, 16 core metric cards, analytics charts & live activity feed."
        badge={{ label: 'Live Telemetry', variant: 'success' }}
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

      {/* ── ALL 16 BRD CARDS GRID ── */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-[13px] font-bold uppercase tracking-wider text-[#64748B] flex items-center gap-2">
            <Layers size={14} className="text-[#16A34A]" />
            <span>Operational Key Metrics (16 Core Cards)</span>
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {/* Row 1 */}
          <KpiCard
            title="TODAY'S FARMERS"
            value="342"
            icon={Sprout}
            iconBg="#F0FDF4"
            iconColor="#16A34A"
            trend={14.2}
            sparkColor="#16A34A"
            sparkData={[210, 240, 270, 290, 310, 325, 342]}
            onClick={() => navigate('/farmers')}
          />
          <KpiCard
            title="GOVERNMENT BODIES"
            value="124"
            icon={Building2}
            iconBg="#EFF6FF"
            iconColor="#2563EB"
            trend={4.2}
            sparkColor="#2563EB"
            sparkData={[110, 112, 115, 118, 120, 122, 124]}
            onClick={() => navigate('/govt')}
          />
          <KpiCard
            title="PARTNERS"
            value="892"
            icon={Handshake}
            iconBg="#FFFBEB"
            iconColor="#D97706"
            trend={15.2}
            sparkColor="#D97706"
            sparkData={[720, 750, 780, 810, 840, 865, 892]}
            onClick={() => navigate('/partners')}
          />
          <KpiCard
            title="PENDING KYC"
            value="148"
            icon={UserCheck}
            iconBg="#FEF2F2"
            iconColor="#EF4444"
            trend={-8.4}
            sparkColor="#EF4444"
            sparkData={[190, 180, 172, 165, 158, 152, 148]}
            onClick={() => navigate('/kyc')}
          />

          {/* Row 2 */}
          <KpiCard
            title="PENDING LANDS"
            value="312"
            icon={Map}
            iconBg="#FFFBEB"
            iconColor="#F59E0B"
            trend={-3.1}
            sparkColor="#F59E0B"
            sparkData={[350, 342, 335, 328, 320, 316, 312]}
            onClick={() => navigate('/land')}
          />
          <KpiCard
            title="PENDING PROJECTS"
            value="24"
            icon={FileText}
            iconBg="#EFF6FF"
            iconColor="#2563EB"
            trend={2.5}
            sparkColor="#2563EB"
            sparkData={[18, 19, 20, 21, 22, 23, 24]}
            onClick={() => navigate('/projects')}
          />
          <KpiCard
            title="PENDING PAYMENTS"
            value="86"
            icon={CreditCard}
            iconBg="#F5F3FF"
            iconColor="#8B5CF6"
            trend={-12.0}
            sparkColor="#8B5CF6"
            sparkData={[120, 110, 105, 98, 92, 89, 86]}
            onClick={() => navigate('/wallet')}
          />
          <KpiCard
            title="PENDING WITHDRAWALS"
            value="42"
            icon={ArrowUpRight}
            iconBg="#FEF2F2"
            iconColor="#EF4444"
            trend={-4.5}
            sparkColor="#EF4444"
            sparkData={[58, 54, 50, 48, 45, 43, 42]}
            onClick={() => navigate('/wallet')}
          />

          {/* Row 3 */}
          <KpiCard
            title="PENDING INSURANCE"
            value="67"
            icon={ShieldCheck}
            iconBg="#F5F3FF"
            iconColor="#8B5CF6"
            trend={-6.2}
            sparkColor="#8B5CF6"
            sparkData={[85, 80, 76, 73, 70, 68, 67]}
            onClick={() => navigate('/insurance')}
          />
          <KpiCard
            title="PENDING TICKETS"
            value="19"
            icon={LifeBuoy}
            iconBg="#FEF2F2"
            iconColor="#EF4444"
            trend={-15.0}
            sparkColor="#EF4444"
            sparkData={[32, 28, 25, 23, 21, 20, 19]}
            onClick={() => navigate('/support')}
          />
          <KpiCard
            title="TODAY'S REVENUE"
            value="₹14.8L"
            icon={TrendingUp}
            iconBg="#F0FDF4"
            iconColor="#16A34A"
            trend={18.5}
            sparkColor="#16A34A"
            sparkData={[8.2, 9.5, 11.0, 12.4, 13.2, 14.0, 14.8]}
            onClick={() => navigate('/reports')}
          />
          <KpiCard
            title="TODAY'S REGISTRATIONS"
            value="512"
            icon={UserPlus}
            iconBg="#EFF6FF"
            iconColor="#2563EB"
            trend={22.4}
            sparkColor="#2563EB"
            sparkData={[340, 380, 410, 440, 470, 490, 512]}
            onClick={() => navigate('/users')}
          />

          {/* Row 4 */}
          <KpiCard
            title="CARBON CREDITS GENERATED"
            value="1.2M"
            suffix=" tCO2e"
            icon={Cloud}
            iconBg="#F0FDF4"
            iconColor="#16A34A"
            trend={8.1}
            sparkColor="#16A34A"
            sparkData={[0.9, 0.95, 1.0, 1.05, 1.1, 1.15, 1.2]}
            onClick={() => navigate('/carbon')}
          />
          <KpiCard
            title="CARBON CREDITS SOLD"
            value="840K"
            suffix=" tCO2e"
            icon={CloudLightning}
            iconBg="#ECFDF5"
            iconColor="#059669"
            trend={14.6}
            sparkColor="#059669"
            sparkData={[620, 660, 700, 740, 780, 810, 840]}
            onClick={() => navigate('/carbon')}
          />
          <KpiCard
            title="WALLET BALANCE"
            value="₹12.8Cr"
            icon={Wallet}
            iconBg="#FEF2F2"
            iconColor="#EF4444"
            trend={11.2}
            sparkColor="#EF4444"
            sparkData={[10.2, 10.6, 11.0, 11.5, 12.0, 12.4, 12.8]}
            onClick={() => navigate('/wallet')}
          />
          <KpiCard
            title="MARKETPLACE ORDERS"
            value="1,840"
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

        {/* Tabbed Growth & Financial Analytics (2 Cols) */}
        <ChartCard
          title="System Performance Analytics"
          subtitle="Interactive chart telemetry for growth, revenue, carbon credits & insurance"
          height={260}
          className="xl:col-span-2"
          actions={
            <div className="flex items-center gap-1 bg-[#F8FAFC] border border-[#E2E8F0] p-1 rounded-xl">
              {(['Growth', 'Revenue', 'Carbon', 'Insurance'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveChartTab(tab)}
                  className={`px-2.5 py-1 rounded-lg text-[11.5px] font-semibold transition-all cursor-pointer ${
                    activeChartTab === tab
                      ? 'bg-white text-[#16A34A] shadow-xs'
                      : 'text-[#64748B] hover:text-[#0F172A]'
                  }`}
                >
                  {tab === 'Growth' ? 'Users & Registrations' :
                   tab === 'Revenue' ? 'Revenue & Marketplace' :
                   tab === 'Carbon' ? 'Carbon Credits' : 'Insurance'}
                </button>
              ))}
            </div>
          }
        >
          <ResponsiveContainer width="100%" height="100%">
            {activeChartTab === 'Growth' ? (
              <AreaChart data={GROWTH_CHART_DATA} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="gradUsers" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563EB" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#2563EB" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="gradFarmers" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#16A34A" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#16A34A" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="dailyUsers" name="Daily Users" stroke="#2563EB" strokeWidth={2.5} fill="url(#gradUsers)" />
                <Area type="monotone" dataKey="farmers" name="Farmer Growth" stroke="#16A34A" strokeWidth={2.5} fill="url(#gradFarmers)" />
              </AreaChart>
            ) : activeChartTab === 'Revenue' ? (
              <BarChart data={REVENUE_MARKETPLACE_DATA} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="revenue" name="Total Revenue (₹Cr)" fill="#16A34A" radius={[6, 6, 0, 0]} />
                <Bar dataKey="marketplaceSales" name="Marketplace Sales (₹Cr)" fill="#F59E0B" radius={[6, 6, 0, 0]} />
              </BarChart>
            ) : activeChartTab === 'Carbon' ? (
              <AreaChart data={CARBON_CREDIT_DATA} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="generated" name="Credits Generated (k tCO2e)" stroke="#16A34A" fill="#F0FDF4" strokeWidth={2.5} />
                <Area type="monotone" dataKey="sold" name="Credits Sold (k tCO2e)" stroke="#059669" fill="#ECFDF5" strokeWidth={2.5} />
              </AreaChart>
            ) : (
              <BarChart data={INSURANCE_DATA} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="activePolicies" name="Active Tree Policies" fill="#8B5CF6" radius={[6, 6, 0, 0]} />
                <Bar dataKey="claimsApproved" name="Claims Approved" fill="#EF4444" radius={[6, 6, 0, 0]} />
              </BarChart>
            )}
          </ResponsiveContainer>
        </ChartCard>

        {/* Project Status Donut Chart (1 Col) */}
        <ChartCard title="Project Status Overview" subtitle="89 Active Carbon & Afforestation Projects" height={260}>
          <div className="flex items-center gap-4 h-full cursor-pointer" onClick={() => navigate('/projects')}>
            <ResponsiveContainer width="55%" height="100%">
              <PieChart>
                <Pie
                  data={PROJECT_STATUS}
                  cx="50%" cy="50%"
                  innerRadius={55} outerRadius={78}
                  dataKey="value" paddingAngle={4}
                  startAngle={90} endAngle={-270}
                >
                  {PROJECT_STATUS.map((entry, i) => (
                    <Cell key={i} fill={entry.color} strokeWidth={0} />
                  ))}
                </Pie>
                <Tooltip formatter={(v: any) => [`${v} projects`, '']} />
              </PieChart>
            </ResponsiveContainer>

            <div className="flex-1 space-y-3">
              {PROJECT_STATUS.map(p => (
                <div key={p.name} className="flex items-center justify-between hover:opacity-80">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: p.color }} />
                    <span className="text-[11.5px] font-medium text-[#64748B]">{p.name}</span>
                  </div>
                  <span className="text-[12.5px] font-bold text-[#0F172A]">{p.value}</span>
                </div>
              ))}
            </div>
          </div>
        </ChartCard>

      </div>

      {/* ── LIVE ACTIVITY FEED (7 Core Event Types) & ALERTS ── */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">

        {/* Live Activity Feed (2 Cols) */}
        <div className="bg-white border border-[#E8EDF5] rounded-2xl p-5 shadow-[0_2px_8px_rgba(0,0,0,0.03)] xl:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-[14px] font-bold text-[#0F172A] flex items-center gap-2">
                <Activity size={16} className="text-[#16A34A]" />
                <span>Live Activity Feed (Real-Time Operational Events)</span>
              </h3>
              <p className="text-[11.5px] text-[#94A3B8]">Includes Farmer, Govt, Land, Insurance, Carbon, Withdrawal & Partner events</p>
            </div>
            <button onClick={() => navigate('/audit')} className="text-[12px] text-[#16A34A] hover:underline font-semibold cursor-pointer">
              View Audit Ledger
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
            {LIVE_ACTIVITY_FEED.map((item, i) => (
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

        {/* Live Alerts & AI Telemetry (1 Col) */}
        <div className="bg-white border border-[#E8EDF5] rounded-2xl p-5 shadow-[0_2px_8px_rgba(0,0,0,0.03)] xl:col-span-1 space-y-4">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h3 className="text-[14px] font-bold text-[#0F172A]">Live System Alerts</h3>
              <p className="text-[11.5px] text-[#94A3B8]">Priority operational flags</p>
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

          {/* AI Insight Card */}
          <div className="p-3.5 rounded-xl border border-[#DCFCE7] bg-[#F0FDF4]">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5">
                <Zap size={14} className="text-[#16A34A]" />
                <span className="text-[12px] font-bold text-[#16A34A]">BhumiAI Engine</span>
              </div>
              <span className="text-[10px] font-bold bg-white text-[#16A34A] px-1.5 py-0.5 rounded border border-[#DCFCE7]">94% Confidence</span>
            </div>
            <p className="text-[11.5px] font-semibold text-[#0F172A] leading-snug mb-1">
              MP & MH land verification throughput increased by 28% this week.
            </p>
            <p className="text-[10.5px] text-[#64748B]">
              Recommend allocating 500 tCO2e credit batch for immediate market listing.
            </p>
          </div>
        </div>

      </div>

      {/* ── Toast Notification ── */}
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

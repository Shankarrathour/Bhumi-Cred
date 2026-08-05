import React, { useState } from 'react';
import {
  Sprout, ShoppingCart, Store, Tag, Trees, Cloud, ShieldCheck, Wallet,
  AlertTriangle, Droplets, Map, Leaf, TrendingUp, Users, Activity,
  ArrowUpRight, RefreshCw, Bell, ChevronRight, Zap, BarChart2,
  Building2, Handshake
} from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  ResponsiveContainer, Tooltip, CartesianGrid, XAxis, YAxis, Legend,
} from 'recharts';
import { motion } from 'framer-motion';
import { KpiCard } from '../../../components/ui/KpiCard';
import { ChartCard } from '../../../components/ui/ChartCard';
import { StatusBadge } from '../../../components/ui/StatusBadge';
import { PageHeader } from '../../../components/ui/PageHeader';
import { useDashboard } from '../api/useDashboard';

// ── Static mock data for visual richness ─────────────────────────────────────
const REVENUE_DATA = [
  { month: 'Mar', revenue: 1.8, credits: 0.9 },
  { month: 'Apr', revenue: 2.1, credits: 1.1 },
  { month: 'May', revenue: 1.9, credits: 1.0 },
  { month: 'Jun', revenue: 2.5, credits: 1.3 },
  { month: 'Jul', revenue: 2.2, credits: 1.2 },
  { month: 'Aug', revenue: 2.45, credits: 1.4 },
];

const PROJECT_STATUS = [
  { name: 'Completed',   value: 32, color: '#16A34A' },
  { name: 'In Progress', value: 28, color: '#2563EB' },
  { name: 'Pending',     value: 18, color: '#F59E0B' },
  { name: 'On Hold',     value: 11, color: '#EF4444' },
];

const ACTIVITY_FEED = [
  { id: 1, icon: Sprout,   color: '#16A34A', bg: '#F0FDF4', title: 'Farmer Registered',    subtitle: 'Ramesh Patel from Sehore, MP',   time: '10:32 AM' },
  { id: 2, icon: Map,      color: '#2563EB', bg: '#EFF6FF', title: 'Land Verified',          subtitle: '45.2 acres in Betul, MP',         time: '10:28 AM' },
  { id: 3, icon: Cloud,    color: '#16A34A', bg: '#F0FDF4', title: 'Carbon Credit Issued',  subtitle: '1,250 tCO2e to Project Green',    time: '10:21 AM' },
  { id: 4, icon: ShieldCheck, color: '#8B5CF6', bg: '#F5F3FF', title: 'Insurance Purchased', subtitle: 'Policy #IN312345 by Mohan Singh', time: '10:15 AM' },
  { id: 5, icon: Wallet,   color: '#F97316', bg: '#FFF7ED', title: 'Withdrawal Requested', subtitle: '₹45,000 by Sita Devi',            time: '10:10 AM' },
];

const LIVE_ALERTS = [
  { title: 'Forest Fire Detected',        region: 'Maharashtra Region',  level: 'danger',  time: '2 mins ago' },
  { title: 'Heavy Rainfall Alert',         region: 'Gujarat Region',      level: 'warning', time: '14 mins ago' },
  { title: 'Land Verification Pending',    region: 'Madhya Pradesh',      level: 'warning', time: '22 mins ago' },
  { title: 'New Plantation (500 Trees)',   region: 'Chhattisgarh',        level: 'success', time: '35 mins ago' },
];

const FARMER_TREND = [22, 28, 25, 32, 29, 38, 40, 42, 45];

// ── Custom Recharts tooltip ───────────────────────────────────────────────────
const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-[#E2E8F0] rounded-[10px] px-3 py-2.5 shadow-lg text-[12px]">
      <div className="font-600 text-[#0F172A] mb-1" style={{ fontWeight: 600 }}>{label}</div>
      {payload.map((p: any) => (
        <div key={p.name} className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full" style={{ background: p.color }} />
          <span className="text-[#64748B]">{p.name}:</span>
          <span className="font-500 text-[#0F172A]" style={{ fontWeight: 500 }}>₹{p.value}Cr</span>
        </div>
      ))}
    </div>
  );
};

// ── Dashboard Component ───────────────────────────────────────────────────────
export const Dashboard = () => {
  const { data: dashData, isLoading, refetch } = useDashboard();
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setTimeout(() => setRefreshing(false), 800);
  };

  return (
    <div className="space-y-6 page-enter">

      {/* ── Page Header ── */}
      <PageHeader
        title="Executive Dashboard"
        description="Welcome back, Super Admin. Here's what's happening across the ecosystem today."
        badge={{ label: 'Live', variant: 'success' }}
        icon={BarChart2}
        actions={
          <>
            <span className="text-[12px] text-[#94A3B8]">May 18 — May 24, 2025</span>
            <button onClick={handleRefresh} className="btn btn-secondary btn-sm">
              <RefreshCw size={13} className={refreshing ? 'animate-spin' : ''} />
              Refresh
            </button>
          </>
        }
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KpiCard
          title="Total Farmers" value="45,231"
          icon={Sprout} iconBg="#F0FDF4" iconColor="#16A34A"
          trend={12.5} sparkColor="#16A34A"
        />
        <KpiCard
          title="Govt Bodies" value="124"
          icon={Building2} iconBg="#EFF6FF" iconColor="#2563EB"
          trend={4.2} sparkColor="#2563EB"
        />
        <KpiCard
          title="Partners" value="892"
          icon={Handshake} iconBg="#FFFBEB" iconColor="#F59E0B"
          trend={15.2} sparkColor="#F59E0B"
        />
        <KpiCard
          title="Pending Approvals" value="1,432"
          icon={AlertTriangle} iconBg="#FEF2F2" iconColor="#EF4444"
          trend={-5.4} sparkColor="#EF4444"
        />
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KpiCard title="Active Projects"    value="89"      icon={Trees}       iconBg="#EFF6FF" iconColor="#2563EB" trend={18.2} sparkColor="#2563EB" />
        <KpiCard title="Carbon Credits"     value="1.2M"    icon={Cloud}       iconBg="#F0FDF4" iconColor="#16A34A" trend={8.1}  sparkColor="#16A34A" suffix=" tCO2e" />
        <KpiCard title="Insurance Policies" value="12,450"  icon={ShieldCheck} iconBg="#F5F3FF" iconColor="#8B5CF6" trend={15.3} sparkColor="#8B5CF6" />
        <KpiCard title="Platform Wallet"    value="₹12.8Cr" icon={Wallet}      iconBg="#FEF2F2" iconColor="#EF4444" trend={11.2} sparkColor="#EF4444" />
      </div>

      {/* ── Main Content Row ── */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">

        {/* Revenue Chart — 2/3 */}
        <ChartCard
          title="Revenue Overview"
          subtitle="Monthly revenue vs carbon credits (₹ Crore)"
          height={220}
          className="xl:col-span-2"
          actions={
            <select className="ent-input ent-select text-[12px] h-7 py-0 w-[110px]">
              <option>This Month</option>
              <option>Last Quarter</option>
              <option>This Year</option>
            </select>
          }
        >
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={REVENUE_DATA} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="gradRev" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#16A34A" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#16A34A" stopOpacity={0}    />
                </linearGradient>
                <linearGradient id="gradCred" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#2563EB" stopOpacity={0.1} />
                  <stop offset="95%" stopColor="#2563EB" stopOpacity={0}   />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="revenue" name="Revenue"       stroke="#16A34A" strokeWidth={2} fill="url(#gradRev)"  dot={false} />
              <Area type="monotone" dataKey="credits" name="Carbon Credits" stroke="#2563EB" strokeWidth={2} fill="url(#gradCred)" dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Project Status Donut — 1/3 */}
        <ChartCard title="Project Status" subtitle="89 total projects" height={220}>
          <div className="flex items-center gap-4 h-full">
            <ResponsiveContainer width="55%" height="100%">
              <PieChart>
                <Pie
                  data={PROJECT_STATUS} cx="50%" cy="50%"
                  innerRadius={55} outerRadius={78}
                  dataKey="value" paddingAngle={3}
                  startAngle={90} endAngle={-270}
                >
                  {PROJECT_STATUS.map((entry, i) => (
                    <Cell key={i} fill={entry.color} strokeWidth={0} />
                  ))}
                </Pie>
                <Tooltip formatter={(v: any) => [`${v} projects`, '']} />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex-1 space-y-2.5">
              {PROJECT_STATUS.map(p => (
                <div key={p.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: p.color }} />
                    <span className="text-[11.5px] text-[#64748B]">{p.name}</span>
                  </div>
                  <span className="text-[12px] font-600 text-[#0F172A]" style={{ fontWeight: 600 }}>{p.value}</span>
                </div>
              ))}
            </div>
          </div>
        </ChartCard>
      </div>

      {/* ── Bottom Row ── */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">

        {/* Activity Feed */}
        <div className="ent-card p-5 xl:col-span-1">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-[14px] font-600 text-[#0F172A]" style={{ fontWeight: 600 }}>Recent Activity</h3>
              <p className="text-[11.5px] text-[#94A3B8]">Live platform events</p>
            </div>
            <button className="text-[12px] text-[#16A34A] hover:underline font-500">View all</button>
          </div>
          <div className="space-y-0">
            {ACTIVITY_FEED.map((item, i) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.07 }}
                className="flex items-start gap-3 py-3 border-b border-[#F8FAFC] last:border-0"
              >
                <div className="shrink-0 w-8 h-8 rounded-[10px] flex items-center justify-center" style={{ background: item.bg }}>
                  <item.icon size={15} style={{ color: item.color }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[12.5px] font-500 text-[#0F172A] leading-tight truncate">{item.title}</div>
                  <div className="text-[11.5px] text-[#94A3B8] mt-0.5 truncate">{item.subtitle}</div>
                </div>
                <span className="text-[10.5px] text-[#CBD5E1] shrink-0">{item.time}</span>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Live Alerts */}
        <div className="ent-card p-5 xl:col-span-1">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-[14px] font-600 text-[#0F172A]" style={{ fontWeight: 600 }}>Live Alerts</h3>
              <p className="text-[11.5px] text-[#94A3B8]">Requires your attention</p>
            </div>
            <button className="text-[12px] text-[#16A34A] hover:underline font-500">View all</button>
          </div>
          <div className="space-y-2.5">
            {LIVE_ALERTS.map((alert, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08 }}
                className="flex items-start justify-between gap-3 p-3 rounded-[10px] bg-[#FAFCFF] border border-[#F1F5F9] hover:border-[#E2E8F0] transition-colors cursor-pointer"
              >
                <div className="flex items-start gap-2.5">
                  <div className={`shrink-0 w-7 h-7 rounded-[8px] flex items-center justify-center mt-0.5 ${
                    alert.level === 'danger'  ? 'bg-[#FEF2F2]' :
                    alert.level === 'warning' ? 'bg-[#FFFBEB]' : 'bg-[#F0FDF4]'
                  }`}>
                    {alert.level === 'danger'  ? <AlertTriangle size={13} className="text-[#EF4444]" /> :
                     alert.level === 'warning' ? <AlertTriangle size={13} className="text-[#F59E0B]" /> :
                                                 <Leaf          size={13} className="text-[#16A34A]" />}
                  </div>
                  <div>
                    <div className="text-[12.5px] font-500 text-[#0F172A] leading-tight">{alert.title}</div>
                    <div className="text-[11.5px] text-[#94A3B8] mt-0.5">{alert.region} • {alert.time}</div>
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
        </div>

        {/* AI Insights */}
        <div className="ent-card p-5 xl:col-span-1">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-[14px] font-600 text-[#0F172A]" style={{ fontWeight: 600 }}>AI Insights</h3>
              <p className="text-[11.5px] text-[#94A3B8]">Powered by BhumiAI</p>
            </div>
            <div className="flex items-center gap-1.5 px-2 py-1 bg-[#F0FDF4] rounded-[8px]">
              <Zap size={11} className="text-[#16A34A]" />
              <span className="text-[10.5px] font-600 text-[#16A34A]" style={{ fontWeight: 600 }}>Live</span>
            </div>
          </div>
          <div className="space-y-3">
            {[
              { icon: TrendingUp, bg: '#F0FDF4', color: '#16A34A', priority: 'High', confidence: 94,
                insight: 'MP region has the highest carbon credit potential for Q4.',
                points: ['1,200 acres ready for MRV verification', '245 insurance policies expire this month'] },
              { icon: Activity, bg: '#EFF6FF', color: '#2563EB', priority: 'Medium', confidence: 81,
                insight: 'Carbon credit demand high in EU market.',
                points: ['Consider listing 500 tCO2e on exchange', 'Prices up 12% vs last quarter'] },
            ].map((ins, i) => (
              <div key={i} className="p-3.5 rounded-[12px] border border-[#F1F5F9] bg-[#FAFCFF]">
                <div className="flex items-start gap-2.5 mb-2.5">
                  <div className="shrink-0 w-7 h-7 rounded-[8px] flex items-center justify-center" style={{ background: ins.bg }}>
                    <ins.icon size={14} style={{ color: ins.color }} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <StatusBadge label={ins.priority} variant={ins.priority === 'High' ? 'danger' : 'warning'} size="sm" />
                      <span className="text-[10.5px] text-[#94A3B8]">{ins.confidence}% confidence</span>
                    </div>
                    <div className="text-[12.5px] font-500 text-[#0F172A] leading-snug">{ins.insight}</div>
                  </div>
                </div>
                <ul className="space-y-1 pl-2">
                  {ins.points.map((p, j) => (
                    <li key={j} className="flex items-center gap-1.5 text-[11.5px] text-[#64748B]">
                      <span className="w-1 h-1 rounded-full bg-[#CBD5E1] shrink-0" />
                      {p}
                    </li>
                  ))}
                </ul>
                <button className="mt-2.5 text-[11.5px] text-[#16A34A] font-500 flex items-center gap-1 hover:underline">
                  View Full Analysis <ChevronRight size={11} />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Analytics Overview Bar Chart ── */}
      <ChartCard
        title="Analytics Overview"
        subtitle="Key metrics trend — last 7 months"
        height={160}
        actions={
          <button className="btn btn-secondary btn-sm">Export Report</button>
        }
      >
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={REVENUE_DATA} margin={{ top: 4, right: 5, left: -25, bottom: 0 }} barGap={2}>
            <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
            <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="revenue" name="Revenue"       fill="#16A34A" radius={[4,4,0,0]} maxBarSize={20} />
            <Bar dataKey="credits" name="Carbon Credits" fill="#2563EB" radius={[4,4,0,0]} maxBarSize={20} />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

    </div>
  );
};

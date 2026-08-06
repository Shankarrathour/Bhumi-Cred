import React, { useState } from 'react';
import {
  Sprout, Trees, Cloud, ShieldCheck, Wallet,
  AlertTriangle, Map, Leaf, TrendingUp, Activity,
  RefreshCw, Zap, BarChart2, Building2, Handshake, ChevronRight, Calendar
} from 'lucide-react';
import {
  AreaChart, Area, PieChart, Pie, Cell,
  ResponsiveContainer, Tooltip, CartesianGrid, XAxis, YAxis, BarChart, Bar
} from 'recharts';
import { motion } from 'framer-motion';
import { KpiCard } from '../../../components/ui/KpiCard';
import { ChartCard } from '../../../components/ui/ChartCard';
import { StatusBadge } from '../../../components/ui/StatusBadge';
import { PageHeader } from '../../../components/ui/PageHeader';
import { useDashboard } from '../api/useDashboard';

// ── Mock Data ─────────────────────────────────────────────────────────────
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
  { id: 1, icon: Sprout,     color: '#16A34A', bg: '#F0FDF4', title: 'Farmer Registered',      subtitle: 'Ramesh Patel from Sehore, MP',   time: '10:32 AM' },
  { id: 2, icon: Map,        color: '#2563EB', bg: '#EFF6FF', title: 'Land Parcel Verified',   subtitle: '45.2 acres in Betul, MP',         time: '10:28 AM' },
  { id: 3, icon: Cloud,      color: '#16A34A', bg: '#F0FDF4', title: 'Carbon Credit Issued',    subtitle: '1,250 tCO2e to Project Green',    time: '10:21 AM' },
  { id: 4, icon: ShieldCheck,color: '#8B5CF6', bg: '#F5F3FF', title: 'Tree Shield Purchased',  subtitle: 'Policy #TS-9021 by Mohan Singh', time: '10:15 AM' },
  { id: 5, icon: Wallet,     color: '#EF4444', bg: '#FEF2F2', title: 'Withdrawal Approved',   subtitle: '₹45,000 to Sita Devi (Indore)',   time: '10:10 AM' },
];

const LIVE_ALERTS = [
  { title: 'Forest Fire Alert',          region: 'Maharashtra Region',  level: 'danger',  time: '2 mins ago' },
  { title: 'Heavy Rainfall Warning',     region: 'Gujarat Region',      level: 'warning', time: '14 mins ago' },
  { title: 'Land Verification Pending',  region: 'Madhya Pradesh',      level: 'warning', time: '22 mins ago' },
  { title: 'New Plantation (500 Trees)', region: 'Chhattisgarh',        level: 'success', time: '35 mins ago' },
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
          <span className="font-semibold text-[#0F172A]">₹{p.value}Cr</span>
        </div>
      ))}
    </div>
  );
};

export const Dashboard = () => {
  const { refetch } = useDashboard();
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setTimeout(() => setRefreshing(false), 800);
  };

  return (
    <div className="space-y-6 page-enter pb-8">

      {/* ── Executive Dashboard Page Header ── */}
      <PageHeader
        title="Executive Dashboard"
        description="Welcome back, Super Admin. Here's what's happening across the ecosystem today."
        badge={{ label: 'Live', variant: 'success' }}
        icon={BarChart2}
        iconColor="#16A34A"
        actions={
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-white border border-[#E2E8F0] rounded-xl text-[12px] text-[#64748B] shadow-xs">
              <Calendar size={14} className="text-[#94A3B8]" />
              <span className="font-medium text-[#0F172A]">May 18 — May 24, 2025</span>
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

      {/* ── KPI Metric Cards Grid (Row 1) ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          title="TOTAL FARMERS"
          value="45,231"
          icon={Sprout}
          iconBg="#F0FDF4"
          iconColor="#16A34A"
          trend={12.5}
          sparkColor="#16A34A"
          sparkData={[28, 32, 30, 36, 34, 42, 45]}
        />
        <KpiCard
          title="GOVT BODIES"
          value="124"
          icon={Building2}
          iconBg="#EFF6FF"
          iconColor="#2563EB"
          trend={4.2}
          sparkColor="#2563EB"
          sparkData={[110, 112, 115, 118, 120, 122, 124]}
        />
        <KpiCard
          title="PARTNERS"
          value="892"
          icon={Handshake}
          iconBg="#FFFBEB"
          iconColor="#F59E0B"
          trend={15.2}
          sparkColor="#F59E0B"
          sparkData={[720, 750, 780, 810, 840, 865, 892]}
        />
        <KpiCard
          title="PENDING APPROVALS"
          value="1,432"
          icon={AlertTriangle}
          iconBg="#FEF2F2"
          iconColor="#EF4444"
          trend={-5.4}
          sparkColor="#EF4444"
          sparkData={[1600, 1550, 1520, 1490, 1470, 1450, 1432]}
        />
      </div>

      {/* ── KPI Metric Cards Grid (Row 2) ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          title="ACTIVE PROJECTS"
          value="89"
          icon={Trees}
          iconBg="#EFF6FF"
          iconColor="#2563EB"
          trend={18.2}
          sparkColor="#2563EB"
          sparkData={[65, 70, 74, 78, 82, 85, 89]}
        />
        <KpiCard
          title="CARBON CREDITS"
          value="1.2M"
          suffix=" tCO2e"
          icon={Cloud}
          iconBg="#F0FDF4"
          iconColor="#16A34A"
          trend={8.1}
          sparkColor="#16A34A"
          sparkData={[0.9, 0.95, 1.0, 1.05, 1.1, 1.15, 1.2]}
        />
        <KpiCard
          title="INSURANCE POLICIES"
          value="12,450"
          icon={ShieldCheck}
          iconBg="#F5F3FF"
          iconColor="#8B5CF6"
          trend={15.3}
          sparkColor="#8B5CF6"
          sparkData={[9800, 10200, 10700, 11200, 11700, 12100, 12450]}
        />
        <KpiCard
          title="PLATFORM WALLET"
          value="₹12.8Cr"
          icon={Wallet}
          iconBg="#FEF2F2"
          iconColor="#EF4444"
          trend={11.2}
          sparkColor="#EF4444"
          sparkData={[10.2, 10.6, 11.0, 11.5, 12.0, 12.4, 12.8]}
        />
      </div>

      {/* ── Revenue Overview & Project Status Row ── */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">

        {/* Revenue Overview (2 Cols) */}
        <ChartCard
          title="Revenue Overview"
          subtitle="Monthly revenue vs carbon credits (₹ Crore)"
          height={240}
          className="xl:col-span-2"
          actions={
            <select className="px-3 py-1 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-[12px] font-medium text-[#0F172A] outline-none cursor-pointer focus:border-[#16A34A]">
              <option>This Month</option>
              <option>Last Quarter</option>
              <option>This Year</option>
            </select>
          }
        >
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={REVENUE_DATA} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="gradRev" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#16A34A" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#16A34A" stopOpacity={0.0} />
                </linearGradient>
                <linearGradient id="gradCred" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#2563EB" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#2563EB" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="revenue" name="Revenue" stroke="#16A34A" strokeWidth={2.5} fill="url(#gradRev)" dot={false} />
              <Area type="monotone" dataKey="credits" name="Carbon Credits" stroke="#2563EB" strokeWidth={2.5} fill="url(#gradCred)" dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Project Status Donut (1 Col) */}
        <ChartCard title="Project Status" subtitle="89 total projects" height={240}>
          <div className="flex items-center gap-4 h-full">
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
                <div key={p.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: p.color }} />
                    <span className="text-[12px] font-medium text-[#64748B]">{p.name}</span>
                  </div>
                  <span className="text-[13px] font-bold text-[#0F172A]">{p.value}</span>
                </div>
              ))}
            </div>
          </div>
        </ChartCard>
      </div>

      {/* ── Bottom Section: Activity, Live Alerts & AI Insights ── */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">

        {/* Recent Activity */}
        <div className="bg-white border border-[#E8EDF5] rounded-2xl p-5 shadow-[0_2px_8px_rgba(0,0,0,0.03)] xl:col-span-1">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-[14px] font-bold text-[#0F172A]">Recent Activity</h3>
              <p className="text-[11.5px] text-[#94A3B8]">Live platform events</p>
            </div>
            <button className="text-[12px] text-[#16A34A] hover:underline font-semibold">View all</button>
          </div>
          <div className="space-y-1">
            {ACTIVITY_FEED.map((item, i) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className="flex items-start gap-3 py-2.5 border-b border-[#F8FAFC] last:border-0"
              >
                <div className="shrink-0 w-8 h-8 rounded-xl flex items-center justify-center mt-0.5" style={{ background: item.bg }}>
                  <item.icon size={15} style={{ color: item.color }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[12.5px] font-semibold text-[#0F172A] leading-tight truncate">{item.title}</div>
                  <div className="text-[11px] text-[#94A3B8] mt-0.5 truncate">{item.subtitle}</div>
                </div>
                <span className="text-[10.5px] font-medium text-[#CBD5E1] shrink-0">{item.time}</span>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Live Alerts */}
        <div className="bg-white border border-[#E8EDF5] rounded-2xl p-5 shadow-[0_2px_8px_rgba(0,0,0,0.03)] xl:col-span-1">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-[14px] font-bold text-[#0F172A]">Live Alerts</h3>
              <p className="text-[11.5px] text-[#94A3B8]">Requires your attention</p>
            </div>
            <button className="text-[12px] text-[#16A34A] hover:underline font-semibold">View all</button>
          </div>
          <div className="space-y-2.5">
            {LIVE_ALERTS.map((alert, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06 }}
                className="flex items-start justify-between gap-3 p-3 rounded-xl bg-[#FAFCFF] border border-[#F1F5F9] hover:border-[#E2E8F0] transition-colors cursor-pointer"
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
                    <div className="text-[12.5px] font-semibold text-[#0F172A] leading-tight">{alert.title}</div>
                    <div className="text-[11px] text-[#94A3B8] mt-0.5">{alert.region} • {alert.time}</div>
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
        <div className="bg-white border border-[#E8EDF5] rounded-2xl p-5 shadow-[0_2px_8px_rgba(0,0,0,0.03)] xl:col-span-1">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-[14px] font-bold text-[#0F172A]">AI Insights</h3>
              <p className="text-[11.5px] text-[#94A3B8]">Powered by BhumiAI</p>
            </div>
            <div className="flex items-center gap-1 px-2 py-0.5 bg-[#F0FDF4] border border-[#DCFCE7] rounded-md">
              <Zap size={11} className="text-[#16A34A]" />
              <span className="text-[10.5px] font-bold text-[#16A34A]">Live</span>
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
              <div key={i} className="p-3.5 rounded-xl border border-[#F1F5F9] bg-[#FAFCFF]">
                <div className="flex items-start gap-2.5 mb-2">
                  <div className="shrink-0 w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: ins.bg }}>
                    <ins.icon size={14} style={{ color: ins.color }} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <StatusBadge label={ins.priority} variant={ins.priority === 'High' ? 'danger' : 'warning'} size="sm" />
                      <span className="text-[10.5px] text-[#94A3B8]">{ins.confidence}% confidence</span>
                    </div>
                    <div className="text-[12px] font-semibold text-[#0F172A] leading-snug">{ins.insight}</div>
                  </div>
                </div>
                <ul className="space-y-1 pl-2 mb-2">
                  {ins.points.map((p, j) => (
                    <li key={j} className="flex items-center gap-1.5 text-[11px] text-[#64748B]">
                      <span className="w-1 h-1 rounded-full bg-[#CBD5E1] shrink-0" />
                      {p}
                    </li>
                  ))}
                </ul>
                <button className="text-[11.5px] text-[#16A34A] font-semibold flex items-center gap-1 hover:underline">
                  View Full Analysis <ChevronRight size={11} />
                </button>
              </div>
            ))}
          </div>
        </div>

      </div>

    </div>
  );
};

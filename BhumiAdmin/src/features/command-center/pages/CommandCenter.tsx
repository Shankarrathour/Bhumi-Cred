import React, { useState, useEffect, useRef } from 'react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line,
} from 'recharts';
import { motion, useInView, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useCommandCenterStats, formatStat } from '../api/useCommandCenter';
import { apiClient } from '../../../api/axios';

// ─── Types ───────────────────────────────────────────────────────────────────
interface SparklineProps { data: number[]; color: string; gradientId?: string; showDot?: boolean; }
interface KpiCardProps {
  title: string; value: string; icon: React.ReactNode; iconBg: string;
  change: string; positive: boolean; sparkData: number[]; sparkColor: string; gradientId: string;
}
interface KebabItem { label: string; icon: string; onClick: () => void; danger?: boolean; }
interface KebabMenuProps { items: KebabItem[]; }

// ─── Animated Counter ────────────────────────────────────────────────────────
const AnimatedNumber: React.FC<{ value: string }> = ({ value }) => {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });
  const [display, setDisplay] = useState('0');

  useEffect(() => {
    if (!inView) return;
    const num = parseFloat(value.replace(/[^0-9.]/g, ''));
    if (isNaN(num)) { setDisplay(value); return; }
    const end = num;
    const duration = 1200;
    const step = (timestamp: number, startTime: number) => {
      const progress = Math.min((timestamp - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = eased * end;
      const prefix = value.match(/^[₹]/) ? value[0] : '';
      const suffix = value.replace(/^[₹]/, '').replace(/[\d.,]+/, '');
      if (value.includes('M')) {
        setDisplay(`${prefix}${(current / 1000000).toFixed(2)}M${suffix.replace('M', '')}`);
      } else if (value.includes('Cr')) {
        setDisplay(`${prefix}${current.toFixed(1)}${suffix}`);
      } else if (current >= 1000) {
        setDisplay(`${prefix}${Math.round(current).toLocaleString('en-IN')}${suffix}`);
      } else {
        setDisplay(`${prefix}${Math.round(current)}${suffix}`);
      }
      if (progress < 1) requestAnimationFrame((t) => step(t, startTime));
      else setDisplay(value);
    };
    requestAnimationFrame((t) => step(t, t));
  }, [inView, value]);

  return <span ref={ref}>{display}</span>;
};

// ─── Sparkline ───────────────────────────────────────────────────────────────
const Sparkline: React.FC<SparklineProps> = ({ data, color, gradientId, showDot = true }) => {
  const chartData = data.map((v, i) => ({ i, v }));
  const id = gradientId || `grad-${color.replace('#', '')}`;
  return (
    <ResponsiveContainer width="100%" height={50}>
      <LineChart data={chartData} margin={{ top: 4, right: 4, bottom: 4, left: 4 }}>
        <defs>
          <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.3} />
            <stop offset="100%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <Line
          type="monotone" dataKey="v" stroke={color} strokeWidth={1.8}
          dot={showDot ? (props: any) => {
            const { cx, cy, index } = props;
            if (index !== data.length - 1) return <g key={index} />;
            return (
              <g key={index}>
                <circle cx={cx} cy={cy} r={4} fill={color} stroke="#fff" strokeWidth={2} />
              </g>
            );
          } : false}
          isAnimationActive={true}
          animationDuration={1000}
        />
      </LineChart>
    </ResponsiveContainer>
  );
};

// ─── Kebab Menu ──────────────────────────────────────────────────────────────
const KebabMenu: React.FC<KebabMenuProps> = ({ items }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all duration-150 ${
          open ? 'bg-[#F1F5F9] text-[#0F172A]' : 'text-[#94A3B8] hover:bg-[#F8FAFC] hover:text-[#64748B]'
        }`}
        aria-label="More options"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
          <circle cx="12" cy="5"  r="2" />
          <circle cx="12" cy="12" r="2" />
          <circle cx="12" cy="19" r="2" />
        </svg>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: -6 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: -6 }}
            transition={{ duration: 0.14, ease: [0.4, 0, 0.2, 1] }}
            className="absolute right-0 top-[calc(100%+6px)] z-50 min-w-[180px] bg-white border border-[#E8EDF5] rounded-xl shadow-[0_8px_28px_rgba(0,0,0,0.10)] py-1 overflow-hidden"
          >
            {items.map((item, idx) => (
              <button
                key={idx}
                onClick={() => { item.onClick(); setOpen(false); }}
                className={`w-full flex items-center gap-2.5 px-3.5 py-2 text-[12.5px] font-medium transition-colors text-left ${
                  item.danger
                    ? 'text-[#EF4444] hover:bg-[#FEF2F2]'
                    : 'text-[#374151] hover:bg-[#F8FAFC] hover:text-[#0F172A]'
                }`}
              >
                <span className="text-[14px] leading-none">{item.icon}</span>
                {item.label}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// ─── Data ────────────────────────────────────────────────────────────────────
const statusPills = [
  { label: 'Platform Status',  value: 'Healthy',    dot: '#22C55E', valueBg: '#F0FDF4', valueColor: '#16A34A' },
  { label: 'API Health',       value: 'Healthy',    dot: '#22C55E', valueBg: '#F0FDF4', valueColor: '#16A34A' },
  { label: 'GIS Services',     value: 'Online',     dot: '#22C55E', valueBg: '#F0FDF4', valueColor: '#16A34A' },
  { label: 'Wallet System',    value: 'Running',    dot: '#3B82F6', valueBg: '#EFF6FF', valueColor: '#2563EB' },
  { label: 'Carbon Market',    value: 'Open',       dot: '#F59E0B', valueBg: '#FFFBEB', valueColor: '#D97706' },
  { label: 'Insurance Claims', value: '18 Pending', dot: '#F59E0B', valueBg: '#FFFBEB', valueColor: '#D97706' },
  { label: 'System Load',      value: 'Normal',     dot: '#22C55E', valueBg: '#F0FDF4', valueColor: '#16A34A' },
];

const revenueData = [
  { month: 'Jan', platform: 5,  carbon: 2  },
  { month: 'Feb', platform: 8,  carbon: 4  },
  { month: 'Mar', platform: 11, carbon: 6  },
  { month: 'Apr', platform: 15, carbon: 9  },
  { month: 'May', platform: 20, carbon: 13 },
  { month: 'Jun', platform: 28, carbon: 20 },
];

const projectData = [
  { name: 'Completed',    value: 32, color: '#22C55E', pct: '35.9%' },
  { name: 'Verification', value: 29, color: '#3B82F6', pct: '32.6%' },
  { name: 'Under Review', value: 11, color: '#F59E0B', pct: '12.4%' },
  { name: 'Draft',        value: 17, color: '#CBD5E1', pct: '19.1%' },
];

const activityFeed = [
  { id: 1, user: 'Ramesh Patel',               action: 'registered a new land parcel in Dewas, MP', time: '2 min ago',  color: '#22C55E', initials: 'RP', iconBg: '#F0FDF4' },
  { id: 2, user: 'MP Forest Dept.',            action: 'approved project #PRJ-1042',                time: '11 min ago', color: '#3B82F6', initials: 'MP', iconBg: '#EFF6FF' },
  { id: 3, user: 'Carbon batch #CB-1042',      action: 'sold to Reliance ESG Fund',                 time: '28 min ago', color: '#22C55E', initials: 'CB', iconBg: '#F0FDF4' },
  { id: 4, user: 'Insurance claim #INS-887',   action: 'flagged for field survey',                  time: '44 min ago', color: '#F59E0B', initials: 'IC', iconBg: '#FFFBEB' },
  { id: 5, user: 'Partner AgroLab',            action: 'completed GIS polygon verification',        time: '1 hr ago',   color: '#8B5CF6', initials: 'AL', iconBg: '#F5F3FF' },
];

const pendingLands = [
  { id: 'LND-88213', farmer: 'Suresh Verma',  district: 'Indore', area: '4.2 ac', status: 'GIS Pending',    sc: '#2563EB', sb: '#EFF6FF' },
  { id: 'LND-88214', farmer: 'Kavita Rao',    district: 'Ujjain', area: '2.8 ac', status: 'Approved',       sc: '#16A34A', sb: '#F0FDF4' },
  { id: 'LND-88215', farmer: 'Manoj Tiwari',  district: 'Dewas',  area: '6.1 ac', status: 'Duplicate Flag', sc: '#EF4444', sb: '#FEF2F2' },
  { id: 'LND-88216', farmer: 'Anita Sharma',  district: 'Bhopal', area: '3.5 ac', status: 'GIS Pending',    sc: '#2563EB', sb: '#EFF6FF' },
  { id: 'LND-88217', farmer: 'Ravi Singh',    district: 'Ratlam', area: '5.0 ac', status: 'Under Review',   sc: '#D97706', sb: '#FFFBEB' },
];

const aiInsights = [
  { color: '#22C55E', bg: '#F0FDF4', text: 'Carbon price expected to increase by 4.2%',     sub: 'Based on current market trends' },
  { color: '#F59E0B', bg: '#FFFBEB', text: '38 land parcels require GIS re-verification',   sub: 'High confidence anomalies detected' },
  { color: '#EF4444', bg: '#FEF2F2', text: '16 duplicate land records found',               sub: 'Across 5 districts' },
  { color: '#8B5CF6', bg: '#F5F3FF', text: '9 insurance claims need immediate attention',   sub: 'High priority cases' },
];

// ─── KPI Card ────────────────────────────────────────────────────────────────
const KpiCard: React.FC<KpiCardProps> = ({
  title, value, icon, iconBg, change, positive, sparkData, sparkColor, gradientId,
}) => (
  <motion.div
    initial={{ opacity: 0, y: 16 }}
    animate={{ opacity: 1, y: 0 }}
    whileHover={{ y: -5, boxShadow: '0 12px 40px rgba(0,0,0,0.10)' }}
    transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
    className="bg-white border border-[#E8EDF5] rounded-[20px] px-5 pt-4 pb-3 flex flex-col cursor-default overflow-hidden"
    style={{ minHeight: 170 }}
  >
    <div className="flex items-start justify-between">
      <div>
        <p className="text-[11px] font-semibold tracking-widest uppercase text-[#94A3B8]">{title}</p>
        <div className="text-[28px] font-bold text-[#0F172A] leading-tight mt-0.5">
          <AnimatedNumber value={value} />
        </div>
      </div>
      <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: iconBg }}>
        {icon}
      </div>
    </div>
    <div className="-mx-2 mt-1 flex-1">
      <Sparkline data={sparkData} color={sparkColor} gradientId={gradientId} />
    </div>
    <div className="flex items-center gap-1.5 mt-0.5">
      <span className="inline-flex items-center gap-0.5 text-[12px] font-semibold" style={{ color: positive ? '#22C55E' : '#EF4444' }}>
        <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
          {positive
            ? <path d="M5 2L9 7H1L5 2Z" fill="currentColor" />
            : <path d="M5 8L1 3H9L5 8Z" fill="currentColor" />}
        </svg>
        {change}
      </span>
      <span className="text-[11.5px] text-[#94A3B8]">vs last week</span>
    </div>
  </motion.div>
);

// ─── Revenue Tooltip ─────────────────────────────────────────────────────────
const RevenueTooltip: React.FC<any> = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-[#E8EDF5] rounded-xl shadow-xl px-3.5 py-2.5 text-[12px]">
      <p className="font-bold text-[#0F172A] mb-1.5">{label}</p>
      {payload.map((p: any, i: number) => (
        <div key={i} className="flex items-center gap-2 mb-0.5">
          <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: p.stroke }} />
          <span className="text-[#64748B]">{p.name} :</span>
          <span className="font-semibold text-[#0F172A]">{p.value}</span>
        </div>
      ))}
    </div>
  );
};

// ─── Main Component ──────────────────────────────────────────────────────────
export const CommandCenter: React.FC = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(t);
  }, []);

  const timeStr = now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });

  const navigate = useNavigate();

  // ── Interactive State for Pending Lands ──────────────────────────────────
  const [lands, setLands] = useState(pendingLands);
  const [viewLand, setViewLand] = useState<any | null>(null);
  const [editingLand, setEditingLand] = useState<any | null>(null);
  const [selectedStatus, setSelectedStatus] = useState('Approved');
  const [remarks, setRemarks] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleUpdateLandStatus = async () => {
    if (!editingLand) return;
    setIsSubmitting(true);
    try {
      await apiClient.put(`/admin/lands/${editingLand.id}/status`, {
        status: selectedStatus,
        remarks: remarks || 'Status updated from Command Center',
      });
    } catch {
      // Mock ID fallback handling
    } finally {
      setIsSubmitting(false);
    }

    const styleMap: Record<string, { sc: string; sb: string }> = {
      Approved: { sc: '#16A34A', sb: '#F0FDF4' },
      'GIS Pending': { sc: '#2563EB', sb: '#EFF6FF' },
      'Duplicate Flag': { sc: '#EF4444', sb: '#FEF2F2' },
      'Under Review': { sc: '#D97706', sb: '#FFFBEB' },
      Rejected: { sc: '#EF4444', sb: '#FEF2F2' },
    };
    const st = styleMap[selectedStatus] || { sc: '#64748B', sb: '#F1F5F9' };

    setLands(prev =>
      prev.map(l => (l.id === editingLand.id ? { ...l, status: selectedStatus, sc: st.sc, sb: st.sb } : l))
    );

    triggerToast(`Land ${editingLand.id} status updated to ${selectedStatus}`);
    setEditingLand(null);
    setRemarks('');
  };

  const handleBulkApprove = () => {
    setLands(prev =>
      prev.map(l => ({ ...l, status: 'Approved', sc: '#16A34A', sb: '#F0FDF4' }))
    );
    triggerToast('All pending land records approved successfully!');
  };

  const handleExportCSV = () => {
    const headers = ['Land ID,Farmer,District,Area,Status'];
    const rows = lands.map(l => `${l.id},${l.farmer},${l.district},${l.area},${l.status}`);
    const csvStr = 'data:text/csv;charset=utf-8,' + [headers, ...rows].join('\n');
    const encodedUri = encodeURI(csvStr);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', 'Pending_Lands_Report.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    triggerToast('Pending land report exported to CSV');
  };

  // ── Live Dashboard Stats from Backend ──────────────────────────────────────
  const { data: stats } = useCommandCenterStats();

  const kpiCards = [
    {
      title: 'Total Farmers',
      value: stats?.total_farmers != null ? formatStat(stats.total_farmers) : '—',
      iconBg: '#F0FDF4', change: '+12.5%', positive: true,
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#22C55E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
          <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
        </svg>
      ),
      sparkData: [3,5,4,6,5,7,6,8,7,9,8,10], sparkColor: '#22C55E', gradientId: 'sk1',
    },
    {
      title: 'Government Bodies',
      value: stats?.total_govt_bodies != null ? formatStat(stats.total_govt_bodies) : '—',
      iconBg: '#EFF6FF', change: '+4.2%', positive: true,
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#3B82F6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="3" y1="22" x2="21" y2="22"/><line x1="6" y1="18" x2="6" y2="11"/>
          <line x1="10" y1="18" x2="10" y2="11"/><line x1="14" y1="18" x2="14" y2="11"/>
          <line x1="18" y1="18" x2="18" y2="11"/><polygon points="12 2 20 7 4 7"/>
        </svg>
      ),
      sparkData: [2,3,2,4,3,4,3,5,4,5,4,6], sparkColor: '#3B82F6', gradientId: 'sk2',
    },
    {
      title: 'Partners',
      value: stats?.total_partners != null ? formatStat(stats.total_partners) : (stats?.total_vendors != null ? formatStat(stats.total_vendors) : '—'),
      iconBg: '#FFF7ED', change: '+15.2%', positive: true,
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
        </svg>
      ),
      sparkData: [1,2,3,2,4,3,5,4,6,5,7,8], sparkColor: '#F59E0B', gradientId: 'sk3',
    },
    {
      title: 'Pending Approvals',
      value: stats?.pending_approvals != null ? formatStat(stats.pending_approvals) : '—',
      iconBg: '#FEF2F2', change: '-5.4%', positive: false,
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
          <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
        </svg>
      ),
      sparkData: [8,7,9,8,7,8,7,6,7,6,5,6], sparkColor: '#EF4444', gradientId: 'sk4',
    },
    {
      title: 'Carbon Credits',
      value: stats?.total_carbon_credits != null ? formatStat(stats.total_carbon_credits) + ' tCO₂e' : '—',
      iconBg: '#F0FDF4', change: '+8.1%', positive: true,
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#22C55E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10z"/>
          <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12"/>
        </svg>
      ),
      sparkData: [3,4,4,5,5,6,7,6,8,7,9,9], sparkColor: '#22C55E', gradientId: 'sk5',
    },
    {
      title: 'Platform Wallet',
      value: stats?.platform_wallet_balance != null
        ? formatStat(stats.platform_wallet_balance, '₹')
        : stats?.total_wallet_balance != null
        ? formatStat(stats.total_wallet_balance, '₹')
        : '—',
      iconBg: '#F5F3FF', change: '+11.2%', positive: true,
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#8B5CF6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="3" width="20" height="14" rx="2" ry="2"/>
          <line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/>
        </svg>
      ),
      sparkData: [2,3,3,4,5,5,6,6,7,7,8,9], sparkColor: '#8B5CF6', gradientId: 'sk6',
    },
  ];

  return (
    <div className="flex flex-col gap-4 w-full" style={{ fontFamily: "'Inter', system-ui, sans-serif", background: '#FAFBFC', minHeight: '100%' }}>

      {/* ── Status Ribbon ───────────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="flex flex-wrap items-center gap-x-6 gap-y-2 bg-white border border-[#E8EDF5] rounded-2xl px-5 py-3"
        style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}
      >
        {statusPills.map((s, i) => (
          <div key={i} className="flex items-center gap-2 text-[12px]">
            <span className="text-[#64748B] font-medium">{s.label}</span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11.5px] font-semibold" style={{ background: s.valueBg, color: s.valueColor }}>
              <span className="w-1.5 h-1.5 rounded-full inline-block" style={{ background: s.dot }} />
              {s.value}
            </span>
          </div>
        ))}
      </motion.div>

      {/* ── KPI Cards ───────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3.5">
        {kpiCards.map((card, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.06, duration: 0.3 }}
          >
            <KpiCard {...card} />
          </motion.div>
        ))}
      </div>

      {/* ── Middle Row: Revenue + Project Status ────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5">

        {/* Revenue Overview — 7 cols */}
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.15 }}
          className="lg:col-span-7 bg-white border border-[#E8EDF5] rounded-[20px] p-5"
          style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}
        >
          <div className="flex items-start justify-between mb-1">
            <div>
              <h3 className="text-[14px] font-bold text-[#0F172A]">Revenue Overview</h3>
              <p className="text-[11.5px] text-[#94A3B8] mt-0.5">Monthly revenue vs carbon credit income</p>
            </div>
            <div className="flex items-center gap-2">
              <button className="flex items-center gap-1 text-[12px] font-medium text-[#64748B] border border-[#E8EDF5] px-2.5 py-1 rounded-lg hover:bg-[#F8FAFC] transition-colors">
                This Month
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </button>
              <KebabMenu items={[
                { icon: '📊', label: 'View Full Report', onClick: () => {} },
                { icon: '📥', label: 'Export as CSV',    onClick: () => {} },
                { icon: '🖼️', label: 'Export as PNG',    onClick: () => {} },
                { icon: '🔄', label: 'Refresh Data',     onClick: () => {} },
                { icon: '📌', label: 'Pin to Top',       onClick: () => {} },
              ]} />
            </div>
          </div>

          {/* Legend */}
          <div className="flex items-center gap-5 mb-3 mt-2">
            <div className="flex items-center gap-2">
              <div className="w-5 h-0.5 bg-[#22C55E] rounded-full" />
              <span className="text-[11px] text-[#64748B]">Platform Revenue (₹ Cr)</span>
            </div>
            <div className="flex items-center gap-2">
              <svg width="20" height="3" viewBox="0 0 20 3">
                <line x1="0" y1="1.5" x2="20" y2="1.5" stroke="#3B82F6" strokeWidth="2" strokeDasharray="4 2" />
              </svg>
              <span className="text-[11px] text-[#64748B]">Carbon Credit Income (₹ Cr)</span>
            </div>
          </div>

          <ResponsiveContainer width="100%" height={185}>
            <AreaChart data={revenueData} margin={{ top: 5, right: 5, bottom: 0, left: -20 }}>
              <defs>
                <linearGradient id="gradPlatform" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%"   stopColor="#22C55E" stopOpacity={0.2} />
                  <stop offset="100%" stopColor="#22C55E" stopOpacity={0.02} />
                </linearGradient>
                <linearGradient id="gradCarbon" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%"   stopColor="#3B82F6" stopOpacity={0.15} />
                  <stop offset="100%" stopColor="#3B82F6" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
              <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#94A3B8' }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#94A3B8' }} width={28} />
              <Tooltip content={<RevenueTooltip />} cursor={{ stroke: '#E8EDF5', strokeWidth: 1 }} />
              <Area type="monotone" dataKey="platform" stroke="#22C55E" strokeWidth={2} fill="url(#gradPlatform)" name="Platform Revenue"
                dot={{ fill: '#22C55E', r: 3, strokeWidth: 0 }}
                activeDot={{ r: 5, fill: '#22C55E', strokeWidth: 2, stroke: '#fff' }} />
              <Area type="monotone" dataKey="carbon" stroke="#3B82F6" strokeWidth={1.8} strokeDasharray="5 3"
                fill="url(#gradCarbon)" name="Carbon Credit Income"
                dot={{ fill: '#3B82F6', r: 3, strokeWidth: 0 }}
                activeDot={{ r: 5, fill: '#3B82F6', strokeWidth: 2, stroke: '#fff' }} />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Project Status — 5 cols */}
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="lg:col-span-5 bg-white border border-[#E8EDF5] rounded-[20px] p-5"
          style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}
        >
          <div className="flex items-start justify-between mb-3">
            <div>
              <h3 className="text-[14px] font-bold text-[#0F172A]">Project Status</h3>
              <p className="text-[11.5px] text-[#94A3B8] mt-0.5">89 total projects</p>
            </div>
            <div className="flex items-center gap-2">
              <button className="flex items-center gap-1 text-[12px] font-medium text-[#64748B] border border-[#E8EDF5] px-2.5 py-1 rounded-lg hover:bg-[#F8FAFC] transition-colors">
                All Projects
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </button>
              <KebabMenu items={[
                { icon: '📋', label: 'View All Projects', onClick: () => {} },
                { icon: '📥', label: 'Export Report',     onClick: () => {} },
                { icon: '🔄', label: 'Refresh',           onClick: () => {} },
                { icon: '📌', label: 'Pin to Top',        onClick: () => {} },
              ]} />
            </div>
          </div>

          <div className="flex items-center gap-6">
            {/* Donut */}
            <div className="relative flex-shrink-0" style={{ width: 150, height: 150 }}>
              <PieChart width={150} height={150}>
                <Pie data={projectData} cx={71} cy={71} innerRadius={46} outerRadius={66}
                  dataKey="value" strokeWidth={0} animationBegin={200} animationDuration={900}>
                  {projectData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                </Pie>
              </PieChart>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-[26px] font-bold text-[#0F172A] leading-none">89</span>
                <span className="text-[11px] text-[#94A3B8] font-medium mt-0.5">Total</span>
              </div>
            </div>

            {/* Legend */}
            <div className="flex-1 space-y-3.5">
              {projectData.map((item, i) => (
                <div key={i} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: item.color }} />
                    <div>
                      <div className="text-[14px] font-bold text-[#0F172A] leading-none">{item.value}</div>
                      <div className="text-[11px] text-[#64748B] leading-none mt-0.5">{item.name}</div>
                    </div>
                  </div>
                  <span className="text-[11.5px] text-[#94A3B8] font-medium">{item.pct}</span>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>

      {/* ── Bottom Row ──────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5">

        {/* Live Activity Feed — 4 cols */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="lg:col-span-4 bg-white border border-[#E8EDF5] rounded-[20px] p-5"
          style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-[14px] font-bold text-[#0F172A]">Live Activity Feed</h3>
            <div className="flex items-center gap-2">
              <button className="text-[11.5px] font-semibold text-[#22C55E] hover:underline">View All</button>
              <KebabMenu items={[
                { icon: '👁️', label: 'View All Activity', onClick: () => {} },
                { icon: '📥', label: 'Export Log',         onClick: () => {} },
                { icon: '🔄', label: 'Refresh Feed',       onClick: () => {} },
                { icon: '🔕', label: 'Mute Alerts',        onClick: () => {} },
              ]} />
            </div>
          </div>

          <div className="relative">
            <div className="absolute left-[13px] top-0 bottom-0 w-px bg-[#F1F5F9]" />
            <div className="space-y-4">
              {activityFeed.map((item, i) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.35 + i * 0.07 }}
                  className="flex items-start gap-3 pl-1"
                >
                  <div
                    className="w-6 h-6 rounded-full flex items-center justify-center text-white text-[9px] font-bold flex-shrink-0 z-10 mt-0.5"
                    style={{ background: item.color, boxShadow: `0 0 0 3px ${item.iconBg}` }}
                  >
                    {item.initials}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[12px] text-[#0F172A] leading-snug">
                      <span className="font-semibold">{item.user}</span>{' '}
                      <span className="text-[#64748B]">{item.action}</span>
                    </p>
                    <p className="text-[10.5px] text-[#94A3B8] mt-0.5">{item.time}</p>
                  </div>
                  <div className="w-1.5 h-1.5 rounded-full flex-shrink-0 mt-2" style={{ background: item.color }} />
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Pending Land Approvals — 5 cols */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="lg:col-span-5 bg-white border border-[#E8EDF5] rounded-[20px] p-5 relative"
          style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-[14px] font-bold text-[#0F172A]">Pending Land Approvals</h3>
            <div className="flex items-center gap-2">
              <button onClick={() => navigate('/land')} className="text-[11.5px] font-semibold text-[#22C55E] hover:underline">View All</button>
              <KebabMenu items={[
                { icon: '👁️', label: 'View All Records', onClick: () => navigate('/land') },
                { icon: '📥', label: 'Export to CSV',     onClick: handleExportCSV },
                { icon: '✅', label: 'Bulk Approve',      onClick: handleBulkApprove },
                { icon: '🔄', label: 'Refresh Table',     onClick: () => triggerToast('Land table refreshed') },
                { icon: '🗑️', label: 'Reset Filter',      onClick: () => setLands(pendingLands), danger: true },
              ]} />
            </div>
          </div>

          <div className="overflow-x-auto pb-2" style={{ scrollbarWidth: 'thin' }}>
            <table className="w-full text-[11.5px] border-collapse min-w-[480px]">
              <thead>
                <tr>
                  {['Land ID', 'Farmer', 'District', 'Area', 'Status', 'Action'].map(h => (
                    <th key={h} className="text-left py-2 px-2.5 text-[10.5px] font-semibold text-[#94A3B8] uppercase tracking-wider whitespace-nowrap border-b border-[#F1F5F9]">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {lands.map((row, i) => (
                  <motion.tr
                    key={row.id || i}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.4 + i * 0.05 }}
                    className="border-b border-[#F8FAFC] hover:bg-[#FAFBFC] transition-colors group"
                  >
                    <td className="py-2.5 px-2.5 font-semibold text-[#0F172A] whitespace-nowrap">{row.id}</td>
                    <td className="py-2.5 px-2.5 text-[#64748B] whitespace-nowrap">{row.farmer}</td>
                    <td className="py-2.5 px-2.5 text-[#64748B] whitespace-nowrap">{row.district}</td>
                    <td className="py-2.5 px-2.5 text-[#0F172A] font-medium whitespace-nowrap">{row.area}</td>
                    <td className="py-2.5 px-2.5 whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10.5px] font-semibold whitespace-nowrap" style={{ background: row.sb, color: row.sc }}>
                        {row.status}
                      </span>
                    </td>
                    <td className="py-2.5 px-2.5 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => setViewLand(row)}
                          className="w-6 h-6 rounded-md border border-[#E8EDF5] flex items-center justify-center text-[#64748B] hover:border-[#22C55E] hover:text-[#22C55E] hover:bg-green-50 transition-colors"
                          title="View Details"
                        >
                          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                        </button>
                        <button
                          onClick={() => { setEditingLand(row); setSelectedStatus(row.status); setRemarks(''); }}
                          className="w-6 h-6 rounded-md border border-[#E8EDF5] flex items-center justify-center text-[#64748B] hover:border-[#3B82F6] hover:text-[#3B82F6] hover:bg-blue-50 transition-colors"
                          title="Update Status"
                        >
                          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-[#F1F5F9]">
            <span className="text-[11px] text-[#94A3B8]">Showing 1–5 of 20 entries</span>
            <div className="flex items-center gap-1">
              <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} className="w-6 h-6 rounded-md border border-[#E8EDF5] flex items-center justify-center text-[#64748B] hover:bg-[#F8FAFC]">
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="15 18 9 12 15 6"/></svg>
              </button>
              {[1, 2, 3, 4].map(n => (
                <button key={n} onClick={() => setCurrentPage(n)}
                  className="w-6 h-6 rounded-md text-[11.5px] font-semibold transition-all"
                  style={{ background: currentPage === n ? '#22C55E' : 'transparent', color: currentPage === n ? '#fff' : '#64748B', border: currentPage === n ? 'none' : '1px solid #E8EDF5' }}>
                  {n}
                </button>
              ))}
              <button onClick={() => setCurrentPage(p => Math.min(4, p + 1))} className="w-6 h-6 rounded-md border border-[#E8EDF5] flex items-center justify-center text-[#64748B] hover:bg-[#F8FAFC]">
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="9 18 15 12 9 6"/></svg>
              </button>
            </div>
          </div>
        </motion.div>

        {/* AI Insights — 3 cols */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="lg:col-span-3 bg-white border border-[#E8EDF5] rounded-[20px] p-5"
          style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <h3 className="text-[14px] font-bold text-[#0F172A]">AI Insights</h3>
              <span className="px-1.5 py-0.5 bg-[#F5F3FF] text-[#7C3AED] text-[9px] font-bold rounded-md border border-[#DDD6FE]">Beta</span>
            </div>
            <div className="flex items-center gap-2">
              <button className="text-[11.5px] font-semibold text-[#22C55E] hover:underline">View Report</button>
              <KebabMenu items={[
                { icon: '📄', label: 'Full AI Report',   onClick: () => {} },
                { icon: '🔔', label: 'Set Alert Rules',  onClick: () => {} },
                { icon: '📥', label: 'Export Insights',  onClick: () => {} },
                { icon: '🔄', label: 'Refresh Analysis', onClick: () => {} },
              ]} />
            </div>
          </div>

          <div className="space-y-2.5">
            {aiInsights.map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: 8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.45 + i * 0.08 }}
                whileHover={{ x: 3 }}
                className="flex items-start gap-3 p-3 rounded-xl border border-[#F1F5F9] hover:border-[#E8EDF5] hover:shadow-sm transition-all cursor-pointer group"
                style={{ background: '#FAFBFC' }}
              >
                <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: item.bg }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={item.color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/>
                    <polyline points="17 6 23 6 23 12"/>
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[12px] font-semibold text-[#0F172A] leading-snug">{item.text}</p>
                  <p className="text-[10.5px] text-[#94A3B8] mt-0.5">{item.sub}</p>
                </div>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#CBD5E1" strokeWidth="2.5" strokeLinecap="round" className="flex-shrink-0 mt-0.5 group-hover:stroke-[#94A3B8] transition-colors">
                  <polyline points="9 18 15 12 9 6"/>
                </svg>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* ── Footer Status Bar ────────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="flex flex-wrap items-center justify-between gap-4 bg-white border border-[#E8EDF5] rounded-2xl px-5 py-3"
        style={{ boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}
      >
        {[
          {
            icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#22C55E" strokeWidth="2" strokeLinecap="round"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/></svg>,
            bg: '#F0FDF4', label: 'Database', value: 'Connected', valueColor: '#16A34A',
          },
          {
            icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#3B82F6" strokeWidth="2" strokeLinecap="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>,
            bg: '#EFF6FF', label: 'API Response', value: '128ms', valueColor: '#0F172A',
          },
          {
            icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#8B5CF6" strokeWidth="2" strokeLinecap="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
            bg: '#F5F3FF', label: 'Active Users', value: '1,248', valueColor: '#0F172A',
          },
          {
            icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#22C55E" strokeWidth="2" strokeLinecap="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>,
            bg: '#F0FDF4', label: 'Backup Status', value: 'Up to date', valueColor: '#16A34A',
          },
          {
            icon: <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#64748B" strokeWidth="2" strokeLinecap="round"><polyline points="1 4 1 10 7 10"/><polyline points="23 20 23 14 17 14"/><path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15"/></svg>,
            bg: '#F8FAFC', label: 'Last Sync', value: timeStr, valueColor: '#0F172A',
          },
        ].map((item, i) => (
          <div key={i} className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: item.bg }}>
              {item.icon}
            </div>
            <div>
              <div className="text-[10px] font-semibold uppercase tracking-wide text-[#94A3B8]">{item.label}</div>
              <div className="text-[12px] font-bold" style={{ color: item.valueColor }}>{item.value}</div>
            </div>
          </div>
        ))}

        {/* Storage with progress bar */}
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-[#FFFBEB] flex items-center justify-center">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" strokeWidth="2" strokeLinecap="round">
              <polyline points="22 12 16 12 14 15 10 15 8 12 2 12"/>
              <path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/>
            </svg>
          </div>
          <div>
            <div className="text-[10px] font-semibold uppercase tracking-wide text-[#94A3B8]">Storage Used</div>
            <div className="flex items-center gap-2 mt-0.5">
              <div className="w-20 h-1.5 bg-[#F1F5F9] rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: '72%' }}
                  transition={{ delay: 0.6, duration: 0.8, ease: 'easeOut' }}
                  className="h-full rounded-full bg-gradient-to-r from-[#22C55E] to-[#16A34A]"
                />
              </div>
              <span className="text-[12px] font-bold text-[#0F172A]">72%</span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* ── View Land Modal ──────────────────────────────────────────────────── */}
      <AnimatePresence>
        {viewLand && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl border border-slate-100 space-y-4"
            >
              <div className="flex justify-between items-center border-b pb-3">
                <h3 className="font-bold text-slate-900 text-lg">Land Record #{viewLand.id}</h3>
                <button onClick={() => setViewLand(null)} className="text-slate-400 hover:text-slate-600 font-bold text-xl">&times;</button>
              </div>
              <div className="space-y-2 text-sm text-slate-700">
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500 font-medium">Farmer Name</span>
                  <span className="font-semibold text-slate-900">{viewLand.farmer}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500 font-medium">District</span>
                  <span className="font-semibold text-slate-900">{viewLand.district}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500 font-medium">Total Area</span>
                  <span className="font-semibold text-slate-900">{viewLand.area}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100">
                  <span className="text-slate-500 font-medium">Current Status</span>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold" style={{ background: viewLand.sb, color: viewLand.sc }}>{viewLand.status}</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-500 font-medium">GIS Geofence</span>
                  <span className="text-green-600 font-semibold">Polygon Verified</span>
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button onClick={() => setViewLand(null)} className="px-4 py-2 rounded-lg border border-slate-200 text-slate-600 text-sm hover:bg-slate-50">Close</button>
                <button onClick={() => { setEditingLand(viewLand); setViewLand(null); }} className="px-4 py-2 rounded-lg bg-green-600 text-white text-sm font-medium hover:bg-green-700">Update Status</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── Edit Status Modal ────────────────────────────────────────────────── */}
      <AnimatePresence>
        {editingLand && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl border border-slate-100 space-y-4"
            >
              <div className="flex justify-between items-center border-b pb-3">
                <h3 className="font-bold text-slate-900 text-lg">Update Status: {editingLand.id}</h3>
                <button onClick={() => setEditingLand(null)} className="text-slate-400 hover:text-slate-600 font-bold text-xl">&times;</button>
              </div>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Select New Status</label>
                  <select
                    value={selectedStatus}
                    onChange={e => setSelectedStatus(e.target.value)}
                    className="w-full p-2.5 rounded-lg border border-slate-200 text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  >
                    <option value="Approved">Approved (Green)</option>
                    <option value="GIS Pending">GIS Pending (Blue)</option>
                    <option value="Under Review">Under Review (Orange)</option>
                    <option value="Duplicate Flag">Duplicate Flag (Red)</option>
                    <option value="Rejected">Rejected (Red)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase mb-1">Audit Remarks</label>
                  <textarea
                    value={remarks}
                    onChange={e => setRemarks(e.target.value)}
                    placeholder="Enter approval or review notes..."
                    rows={3}
                    className="w-full p-2.5 rounded-lg border border-slate-200 text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button onClick={() => setEditingLand(null)} className="px-4 py-2 rounded-lg border border-slate-200 text-slate-600 text-sm hover:bg-slate-50">Cancel</button>
                <button
                  onClick={handleUpdateLandStatus}
                  disabled={isSubmitting}
                  className="px-4 py-2 rounded-lg bg-green-600 text-white text-sm font-semibold hover:bg-green-700 disabled:opacity-50"
                >
                  {isSubmitting ? 'Saving...' : 'Save & Submit'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── Floating Toast Notification ──────────────────────────────────────── */}
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

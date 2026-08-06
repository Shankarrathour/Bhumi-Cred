import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { AreaChart, Area, ResponsiveContainer } from 'recharts';

interface KpiCardProps {
  title: string;
  value: string | number;
  icon: React.ElementType;
  iconBg?: string;
  iconColor?: string;
  trend?: number;       // e.g. 12.5 for +12.5%
  trendLabel?: string;  // e.g. "vs last month"
  sparkData?: number[]; // array of numbers for sparkline
  sparkColor?: string;
  prefix?: string;
  suffix?: string;
  loading?: boolean;
  onClick?: () => void;
}

const DEFAULT_SPARK = [30, 25, 35, 28, 42, 38, 45, 40, 48];

export const KpiCard: React.FC<KpiCardProps> = ({
  title, value, icon: Icon,
  iconBg = '#F0FDF4', iconColor = '#16A34A',
  trend, trendLabel = 'vs last month',
  sparkData = DEFAULT_SPARK, sparkColor = '#16A34A',
  prefix = '', suffix = '',
  loading = false,
  onClick,
}) => {
  const spark = sparkData.map((v, i) => ({ i, v }));

  if (loading) {
    return (
      <div className="bg-white border border-[#E2E8F0] rounded-2xl p-4 shadow-xs">
        <div className="animate-pulse flex space-x-4">
          <div className="flex-1 space-y-3 py-1">
            <div className="h-3 bg-slate-100 rounded w-1/2"></div>
            <div className="h-7 bg-slate-200 rounded w-3/4"></div>
            <div className="h-3 bg-slate-100 rounded w-1/3"></div>
          </div>
        </div>
      </div>
    );
  }

  const isPositive = (trend ?? 0) >= 0;
  const trendBg = isPositive ? 'bg-[#F0FDF4]' : 'bg-[#FEF2F2]';
  const trendTextColor = isPositive ? 'text-[#16A34A]' : 'text-[#EF4444]';

  return (
    <motion.div
      onClick={onClick}
      whileHover={{ y: -3, boxShadow: '0 12px 30px -5px rgba(0,0,0,0.08)' }}
      transition={{ duration: 0.2 }}
      className={`bg-white border border-[#E8EDF5] rounded-2xl p-4 shadow-[0_2px_8px_rgba(0,0,0,0.03)] flex flex-col justify-between ${
        onClick ? 'cursor-pointer hover:border-emerald-300' : 'cursor-default'
      }`}
    >
      {/* Header Row */}
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10.5px] font-bold text-[#64748B] uppercase tracking-wider">
          {title}
        </span>
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 shadow-xs"
          style={{ background: iconBg }}
        >
          <Icon size={18} style={{ color: iconColor }} />
        </div>
      </div>

      {/* Metric Value */}
      <div className="mb-2">
        <div className="text-[26px] font-extrabold text-[#0F172A] leading-none tracking-tight">
          {prefix}
          <motion.span
            key={String(value)}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
          >
            {typeof value === 'number' ? value.toLocaleString() : value}
          </motion.span>
          {suffix}
        </div>
      </div>

      {/* Sleek Sparkline Wave */}
      <div className="h-8 -mx-2 my-1 overflow-hidden">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={spark} margin={{ top: 2, right: 0, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id={`grad-${title.replace(/\s+/g, '-')}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={sparkColor} stopOpacity={0.25} />
                <stop offset="100%" stopColor={sparkColor} stopOpacity={0.0} />
              </linearGradient>
            </defs>
            <Area
              type="monotone"
              dataKey="v"
              stroke={sparkColor}
              strokeWidth={2}
              fill={`url(#grad-${title.replace(/\s+/g, '-')})`}
              dot={false}
              isAnimationActive={true}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Footer Trend Pill */}
      <div className="flex items-center gap-1.5 pt-1">
        {trend !== undefined && (
          <div className={`flex items-center gap-0.5 px-2 py-0.5 rounded-md text-[11px] font-bold ${trendBg} ${trendTextColor}`}>
            {isPositive ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
            <span>{isPositive ? '+' : ''}{trend}%</span>
          </div>
        )}
        <span className="text-[11px] font-medium text-[#94A3B8]">{trendLabel}</span>
      </div>
    </motion.div>
  );
};

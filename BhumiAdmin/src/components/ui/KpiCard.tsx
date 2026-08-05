import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { AreaChart, Area, ResponsiveContainer, Tooltip } from 'recharts';

interface KpiCardProps {
  title: string;
  value: string | number;
  icon: React.ElementType;
  iconBg?: string;
  iconColor?: string;
  trend?: number;       // e.g. 12.5 for +12.5%
  trendLabel?: string;  // e.g. "vs last month"
  sparkData?: number[]; // array of 7 numbers for sparkline
  sparkColor?: string;
  prefix?: string;
  suffix?: string;
  loading?: boolean;
}

const genSpark = (base: number) =>
  Array.from({ length: 7 }, (_, i) => ({
    v: Math.max(0, base + Math.sin(i * 0.9) * base * 0.3 + (Math.random() - 0.5) * base * 0.1),
  }));

export const KpiCard: React.FC<KpiCardProps> = ({
  title, value, icon: Icon,
  iconBg = '#F0FDF4', iconColor = '#16A34A',
  trend, trendLabel = 'vs last month',
  sparkData, sparkColor = '#16A34A',
  prefix = '', suffix = '',
  loading = false,
}) => {
  const spark = sparkData
    ? sparkData.map(v => ({ v }))
    : genSpark(typeof value === 'number' ? value : 50);

  if (loading) {
    return (
      <div className="ent-card p-5">
        <div className="skeleton h-4 w-24 mb-3" />
        <div className="skeleton h-8 w-32 mb-3" />
        <div className="skeleton h-3 w-20" />
      </div>
    );
  }

  const isPositive = (trend ?? 0) >= 0;
  const TrendIcon = trend === undefined ? Minus : isPositive ? TrendingUp : TrendingDown;
  const trendColor = trend === undefined ? '#94A3B8' : isPositive ? '#16A34A' : '#EF4444';

  return (
    <motion.div
      whileHover={{ y: -2, boxShadow: '0 8px 24px rgba(0,0,0,0.08)' }}
      transition={{ duration: 0.2 }}
      className="ent-card p-5 cursor-default"
    >
      <div className="flex items-start justify-between mb-3">
        <div>
          <div className="text-[12px] font-500 text-[#64748B] mb-2 uppercase tracking-wide">{title}</div>
          <div className="text-[26px] font-700 text-[#0F172A] leading-none tracking-tight" style={{ fontWeight: 700 }}>
            {prefix}
            <motion.span
              key={String(value)}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              {typeof value === 'number' ? value.toLocaleString() : value}
            </motion.span>
            {suffix}
          </div>
        </div>
        <div
          className="shrink-0 w-10 h-10 rounded-[12px] flex items-center justify-center"
          style={{ background: iconBg }}
        >
          <Icon size={20} style={{ color: iconColor }} />
        </div>
      </div>

      {/* Sparkline */}
      <div className="h-9 -mx-1 mb-3">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={spark}>
            <defs>
              <linearGradient id={`grad-${title}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor={sparkColor} stopOpacity={0.15} />
                <stop offset="95%" stopColor={sparkColor} stopOpacity={0} />
              </linearGradient>
            </defs>
            <Area
              type="monotone" dataKey="v"
              stroke={sparkColor} strokeWidth={1.5}
              fill={`url(#grad-${title})`}
              dot={false} isAnimationActive={true}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Trend */}
      <div className="flex items-center gap-1.5">
        <div
          className="flex items-center gap-1 px-2 py-0.5 rounded-[6px] text-[11.5px] font-600"
          style={{ background: `${trendColor}14`, color: trendColor, fontWeight: 600 }}
        >
          <TrendIcon size={11} />
          {trend !== undefined ? `${isPositive ? '+' : ''}${trend}%` : '—'}
        </div>
        <span className="text-[11.5px] text-[#94A3B8]">{trendLabel}</span>
      </div>
    </motion.div>
  );
};

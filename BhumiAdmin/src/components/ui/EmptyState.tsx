import React from 'react';
import { motion } from 'framer-motion';
import { LucideIcon, Inbox } from 'lucide-react';

interface EmptyStateProps {
  icon?: LucideIcon;
  title?: string;
  description?: string;
  action?: { label: string; onClick: () => void };
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon = Inbox,
  title = 'No data found',
  description = 'There are no records matching your current filters.',
  action,
}) => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex flex-col items-center justify-center py-16 px-8 text-center"
    >
      <div className="w-14 h-14 rounded-[16px] bg-[#F1F5F9] flex items-center justify-center mb-4">
        <Icon size={24} className="text-[#94A3B8]" />
      </div>
      <h3 className="text-[14px] font-600 text-[#374151] mb-1" style={{ fontWeight: 600 }}>{title}</h3>
      <p className="text-[12.5px] text-[#94A3B8] max-w-[300px] leading-relaxed">{description}</p>
      {action && (
        <button onClick={action.onClick} className="btn btn-primary btn-sm mt-4">
          {action.label}
        </button>
      )}
    </motion.div>
  );
};

// ── Skeleton rows ─────────────────────────────────────────────────────────────
interface SkeletonTableProps { rows?: number; cols?: number; }
export const SkeletonTable: React.FC<SkeletonTableProps> = ({ rows = 5, cols = 5 }) => (
  <div className="space-y-0">
    {Array.from({ length: rows }).map((_, r) => (
      <div key={r} className="flex items-center gap-4 px-4 py-3.5 border-b border-[#F1F5F9]">
        <div className="skeleton w-4 h-4 rounded" />
        {Array.from({ length: cols }).map((_, c) => (
          <div key={c} className={`skeleton h-3.5 rounded flex-1 ${c === 0 ? 'max-w-[120px]' : c === cols-1 ? 'max-w-[80px]' : ''}`} />
        ))}
      </div>
    ))}
  </div>
);

// ── Skeleton KPI cards ────────────────────────────────────────────────────────
export const SkeletonKpi: React.FC<{ count?: number }> = ({ count = 4 }) => (
  <div className={`grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-${count}`}>
    {Array.from({ length: count }).map((_, i) => (
      <div key={i} className="ent-card p-5">
        <div className="flex items-start justify-between mb-3">
          <div className="skeleton h-3 w-20 rounded" />
          <div className="skeleton w-10 h-10 rounded-[12px]" />
        </div>
        <div className="skeleton h-7 w-28 rounded mb-3" />
        <div className="skeleton h-9 w-full rounded mb-3" />
        <div className="skeleton h-3 w-24 rounded" />
      </div>
    ))}
  </div>
);

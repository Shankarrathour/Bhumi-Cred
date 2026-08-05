import React from 'react';
import { motion } from 'framer-motion';
import { LucideIcon } from 'lucide-react';

interface ChartCardProps {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
  height?: number;
  className?: string;
}

export const ChartCard: React.FC<ChartCardProps> = ({
  title, subtitle, actions, children, height = 240, className = '',
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className={`ent-card p-5 ${className}`}
    >
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-[14px] font-600 text-[#0F172A]" style={{ fontWeight: 600 }}>{title}</h3>
          {subtitle && <p className="text-[12px] text-[#94A3B8] mt-0.5">{subtitle}</p>}
        </div>
        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </div>
      <div style={{ height }}>{children}</div>
    </motion.div>
  );
};

import React from 'react';

type Variant = 'success' | 'warning' | 'danger' | 'info' | 'purple' | 'gray' | 'orange' | 'cyan' | 'default';

interface StatusBadgeProps {
  label: string;
  variant?: Variant;
  status?: Variant;
  dot?: boolean;
  size?: 'sm' | 'md';
}

const variantMap: Record<Variant, { bg: string; text: string; dot: string }> = {
  success: { bg: '#F0FDF4', text: '#16A34A', dot: '#22C55E' },
  warning: { bg: '#FFFBEB', text: '#B45309', dot: '#F59E0B' },
  danger:  { bg: '#FEF2F2', text: '#DC2626', dot: '#EF4444' },
  info:    { bg: '#EFF6FF', text: '#1D4ED8', dot: '#3B82F6' },
  purple:  { bg: '#F5F3FF', text: '#7C3AED', dot: '#8B5CF6' },
  gray:    { bg: '#F1F5F9', text: '#475569', dot: '#94A3B8' },
  default: { bg: '#F1F5F9', text: '#475569', dot: '#94A3B8' },
  orange:  { bg: '#FFF7ED', text: '#C2410C', dot: '#F97316' },
  cyan:    { bg: '#ECFEFF', text: '#0E7490', dot: '#06B6D4' },
};

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  label, variant, status, dot = true, size = 'md',
}) => {
  const chosenKey = variant || status || 'gray';
  const v = variantMap[chosenKey] || variantMap.gray;
  return (
    <span
      className="inline-flex items-center gap-1.5 font-500 rounded-full whitespace-nowrap"
      style={{
        background: v.bg,
        color: v.text,
        padding: size === 'sm' ? '2px 8px' : '3px 10px',
        fontSize: size === 'sm' ? '11px' : '11.5px',
        fontWeight: 500,
      }}
    >
      {dot && (
        <span
          className="shrink-0 rounded-full"
          style={{ width: size === 'sm' ? 5 : 6, height: size === 'sm' ? 5 : 6, background: v.dot }}
        />
      )}
      {label}
    </span>
  );
};

// Helper to map common status strings to variants
export const getStatusVariant = (status: string): Variant => {
  const s = status.toLowerCase();
  if (['active', 'approved', 'verified', 'completed', 'success', 'paid'].some(k => s.includes(k))) return 'success';
  if (['pending', 'review', 'processing', 'warning', 'partial'].some(k => s.includes(k))) return 'warning';
  if (['rejected', 'failed', 'cancelled', 'error', 'suspended', 'danger'].some(k => s.includes(k))) return 'danger';
  if (['info', 'draft', 'scheduled', 'new'].some(k => s.includes(k))) return 'info';
  if (['paused', 'inactive', 'disabled'].some(k => s.includes(k))) return 'gray';
  return 'gray';
};

import React from 'react';
import { motion } from 'framer-motion';
import { LucideIcon, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface PageHeaderProps {
  title: string;
  description?: string;
  badge?: { label: string; variant?: 'success' | 'warning' | 'danger' | 'info' | 'purple' | 'gray' };
  actions?: React.ReactNode;
  icon?: LucideIcon;
  iconColor?: string;
  showBack?: boolean;
  onBack?: () => void;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  title, description, badge, actions, icon: Icon, iconColor = '#16A34A', showBack, onBack,
}) => {
  const navigate = useNavigate();

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      navigate(-1);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className="flex items-start justify-between gap-4 mb-6"
    >
      <div className="flex items-center gap-3 min-w-0">
        {(showBack || onBack) && (
          <button
            onClick={handleBack}
            className="shrink-0 w-9 h-9 rounded-xl border border-[#E2E8F0] bg-white flex items-center justify-center text-[#64748B] hover:text-[#0F172A] hover:bg-[#F8FAFC] hover:border-[#CBD5E1] transition-all shadow-xs cursor-pointer"
            title="Go Back"
            aria-label="Go Back"
          >
            <ArrowLeft size={18} />
          </button>
        )}
        {Icon && (
          <div
            className="shrink-0 w-10 h-10 rounded-[12px] flex items-center justify-center"
            style={{ background: `${iconColor}14` }}
          >
            <Icon size={20} style={{ color: iconColor }} />
          </div>
        )}
        <div className="min-w-0">
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-[20px] font-700 text-[#0F172A] leading-tight tracking-tight" style={{ fontWeight: 700 }}>
              {title}
            </h1>
            {badge && (
              <span className={`badge badge-${badge.variant || 'success'}`}>
                <span className="badge-dot" />
                {badge.label}
              </span>
            )}
          </div>
          {description && (
            <p className="text-[13px] text-[#64748B] mt-0.5 leading-relaxed">{description}</p>
          )}
        </div>
      </div>
      {actions && (
        <div className="flex items-center gap-2 shrink-0 flex-wrap justify-end">
          {actions}
        </div>
      )}
    </motion.div>
  );
};

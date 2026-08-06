import React from 'react';

interface BhumiLogoProps {
  showSubtitle?: boolean;
  isCollapsed?: boolean;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const BhumiTreeEmblem: React.FC<{ className?: string }> = ({ className = "w-9 h-9" }) => {
  return (
    <div className={`relative flex items-center justify-center shrink-0 rounded-full bg-gradient-to-br from-[#F0FDF4] via-white to-[#FEF3C7]/50 border border-[#A7F3D0] shadow-xs p-1 ${className}`}>
      <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full drop-shadow-xs">
        {/* Outer subtle circular ring */}
        <circle cx="50" cy="50" r="46" stroke="#22C55E" strokeWidth="2.5" strokeDasharray="3 3" opacity="0.35" />
        <circle cx="50" cy="50" r="42" stroke="#16A34A" strokeWidth="1.5" opacity="0.15" />

        {/* Central Vertical Trunk */}
        <path d="M50 82V28" stroke="#15803D" strokeWidth="5.5" strokeLinecap="round" />

        {/* Bottom Tier Leaves (Rich Green) */}
        <path d="M50 72C34 68 24 55 24 44C36 44 46 54 50 64" fill="#16A34A" />
        <path d="M50 72C66 68 76 55 76 44C64 44 54 54 50 64" fill="#22C55E" />

        {/* Middle Tier Leaves (Vibrant Emerald) */}
        <path d="M50 56C30 50 22 36 25 25C38 27 46 39 50 48" fill="#22C55E" />
        <path d="M50 56C70 50 78 36 75 25C62 27 54 39 50 48" fill="#4ADE80" />

        {/* Top Tier Leaves with Golden/Amber Gradient Accent (As in Design 2) */}
        <path d="M50 40C36 32 32 18 38 12C48 15 50 28 50 34" fill="url(#tree-gold-left)" />
        <path d="M50 40C64 32 68 18 62 12C52 15 50 28 50 34" fill="url(#tree-gold-right)" />

        {/* Top Center Crown Leaf */}
        <path d="M50 28C44 20 45 10 50 6C55 10 56 20 50 28" fill="url(#crown-gold)" />

        <defs>
          <linearGradient id="tree-gold-left" x1="32" y1="12" x2="50" y2="40" gradientUnits="userSpaceOnUse">
            <stop stopColor="#F59E0B" />
            <stop offset="0.5" stopColor="#EAB308" />
            <stop offset="1" stopColor="#22C55E" />
          </linearGradient>
          <linearGradient id="tree-gold-right" x1="68" y1="12" x2="50" y2="40" gradientUnits="userSpaceOnUse">
            <stop stopColor="#D97706" />
            <stop offset="0.5" stopColor="#F59E0B" />
            <stop offset="1" stopColor="#16A34A" />
          </linearGradient>
          <linearGradient id="crown-gold" x1="50" y1="6" x2="50" y2="28" gradientUnits="userSpaceOnUse">
            <stop stopColor="#EAB308" />
            <stop offset="1" stopColor="#F59E0B" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
};

export const BhumiLogo: React.FC<BhumiLogoProps> = ({
  showSubtitle = true,
  isCollapsed = false,
  className = "",
  size = 'md'
}) => {
  const iconSize = size === 'sm' ? 'w-8 h-8' : size === 'lg' ? 'w-11 h-11' : 'w-9 h-9';
  const titleSize = size === 'sm' ? 'text-[14px]' : size === 'lg' ? 'text-[18px]' : 'text-[16px]';
  const subtitleSize = size === 'sm' ? 'text-[9.5px]' : size === 'lg' ? 'text-[11px]' : 'text-[10px]';

  return (
    <div className={`flex items-center gap-3 overflow-hidden select-none ${className}`}>
      <BhumiTreeEmblem className={iconSize} />
      
      {!isCollapsed && (
        <div className="flex flex-col min-w-0">
          <div className={`${titleSize} font-bold leading-none tracking-tight flex items-center`}>
            <span className="text-[#0F172A] font-extrabold">Bhumi</span>
            <span className="text-[#D97706] font-bold">Cred</span>
          </div>
          {showSubtitle && (
            <div className={`${subtitleSize} font-medium text-[#64748B] mt-1 leading-none tracking-wide truncate`}>
              Enterprise Command Center
            </div>
          )}
        </div>
      )}
    </div>
  );
};

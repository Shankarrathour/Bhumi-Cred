import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Leaf, Globe2, LayoutDashboard, Sprout, Building2, Map,
  FileText, ShieldCheck, CreditCard, ShoppingBag, Wallet,
  KeyRound, ClipboardList, Settings, LogOut, X
} from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import { logout } from '../store/slices/authSlice';
import { RootState } from '../store/store';
import { useAuth } from '../context/AuthContext';
import { useSidebar } from '../context/SidebarContext';
import { Role } from '../store/slices/authSlice';
import { BhumiLogo } from '../components/BhumiLogo';

type NavItemType = {
  id: string;
  label: string;
  icon: any;
  path: string;
  allowedRoles?: (Role | string)[];
};

type NavGroupType = { label: string; items: NavItemType[] };

const NAV_GROUPS: NavGroupType[] = [
  {
    label: 'OVERVIEW',
    items: [
      { id: 'command-center',      label: 'Command Center',      icon: Globe2,          path: '/command-center' },
      { id: 'executive-dashboard', label: 'Executive Dashboard', icon: LayoutDashboard, path: '/' },
    ],
  },
  {
    label: 'OPERATIONS',
    items: [
      { id: 'farmers',  label: 'Farmers',           icon: Sprout,      path: '/farmers'   },
      { id: 'govt',     label: 'Government Bodies', icon: Building2,   path: '/govt'      },
      { id: 'land',     label: 'Land & GIS',        icon: Map,         path: '/land'      },
      { id: 'projects', label: 'Projects',          icon: FileText,    path: '/projects'  },
      { id: 'insurance',label: 'Tree Insurance',    icon: ShieldCheck, path: '/insurance' },
    ],
  },
  {
    label: 'BUSINESS',
    items: [
      { id: 'carbon',      label: 'Carbon Credits',    icon: CreditCard,  path: '/carbon'      },
      { id: 'marketplace', label: 'Marketplace',       icon: ShoppingBag, path: '/marketplace' },
      { id: 'wallet',      label: 'Wallet & Payments', icon: Wallet,      path: '/wallet'      },
    ],
  },
  {
    label: 'SYSTEM',
    items: [
      { id: 'users',    label: 'Roles & Access', icon: KeyRound,      path: '/users'    },
      { id: 'audit',    label: 'Audit Logs',     icon: ClipboardList, path: '/audit'    },
      { id: 'settings', label: 'Settings',       icon: Settings,      path: '/settings' },
    ],
  },
];

export const Sidebar: React.FC = () => {
  const { hasRole } = useAuth();
  const { collapsed, mobileOpen, closeMobile, isMobile } = useSidebar();
  const location = useLocation();
  const dispatch = useDispatch();
  const user = useSelector((s: RootState) => s.auth.user);

  const filtered = NAV_GROUPS.map(g => ({
    ...g,
    items: g.items.filter(i => !i.allowedRoles || hasRole(i.allowedRoles)),
  })).filter(g => g.items.length > 0);

  const initials = user?.name
    ? user.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
    : 'SA';

  const isCollapsed = isMobile ? false : collapsed;

  const sidebarContent = (
    <div className="flex flex-col h-full bg-white relative overflow-hidden select-none">
      {/* ── Brand Header (60px) ── */}
      <div className="h-[60px] flex items-center px-4 border-b border-[#F1F5F9] shrink-0 justify-between">
        <BhumiLogo isCollapsed={isCollapsed} size="md" />

        {isMobile && (
          <button
            onClick={closeMobile}
            className="w-8 h-8 flex items-center justify-center text-[#64748B] hover:text-[#0F172A] hover:bg-[#F8FAFC] rounded-xl border border-[#E2E8F0] bg-white shadow-xs transition-colors"
            title="Close Menu"
          >
            <X size={16} />
          </button>
        )}
      </div>

      {/* ── Navigation Links ── */}
      <div className="flex-1 overflow-y-auto py-3 px-3 space-y-4 custom-scrollbar">
        {filtered.map(group => (
          <div key={group.label} className="space-y-1">
            {!isCollapsed && (
              <div className="text-[10px] font-bold tracking-widest text-[#94A3B8] px-3 pt-1 pb-1 uppercase">
                {group.label}
              </div>
            )}

            {group.items.map(item => {
              const isActive = item.path === '/'
                ? location.pathname === '/'
                : location.pathname.startsWith(item.path);

              const Icon = item.icon;

              return (
                <NavLink
                  key={item.id}
                  to={item.path}
                  onClick={() => isMobile && closeMobile()}
                  className="block relative group"
                >
                  <div
                    className={`
                      flex items-center h-[42px] rounded-xl transition-all duration-200 cursor-pointer relative
                      ${isCollapsed ? 'justify-center px-0' : 'px-3.5 gap-3'}
                      ${
                        isActive
                          ? 'bg-[#F0FDF4] text-[#16A34A] font-semibold border-l-[3.5px] border-[#22C55E] shadow-sm'
                          : 'text-[#64748B] hover:bg-[#F8FAFC] hover:text-[#0F172A] font-medium'
                      }
                    `}
                  >
                    <Icon
                      size={18}
                      className={`shrink-0 transition-colors ${
                        isActive ? 'text-[#16A34A]' : 'text-[#94A3B8] group-hover:text-[#64748B]'
                      }`}
                    />

                    {!isCollapsed && (
                      <span className="truncate text-[13.5px] leading-none">
                        {item.label}
                      </span>
                    )}

                    {/* Floating Tooltip when Collapsed */}
                    {isCollapsed && (
                      <div className="absolute left-full ml-3 px-3 py-1.5 bg-[#0F172A] text-white text-[12px] font-semibold rounded-lg shadow-xl whitespace-nowrap z-50 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-150 flex items-center gap-1">
                        <span>{item.label}</span>
                        <div className="absolute -left-1 top-1/2 -translate-y-1/2 w-2 h-2 bg-[#0F172A] rotate-45 rounded-xs" />
                      </div>
                    )}
                  </div>
                </NavLink>
              );
            })}
          </div>
        ))}
      </div>

      {/* ── System Health Widget ── */}
      <AnimatePresence>
        {!isCollapsed && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="mx-3 mb-3 shrink-0"
          >
            <div className="bg-[#F0FDF4] border border-[#DCFCE7] rounded-2xl p-3 shadow-xs">
              <div className="flex items-center justify-between mb-2">
                <div className="text-[10px] font-bold uppercase tracking-widest text-[#16A34A]">
                  System Health
                </div>
                <span className="text-[10px] font-bold text-[#16A34A] bg-white px-1.5 py-0.5 rounded-md border border-[#DCFCE7]">
                  99.98%
                </span>
              </div>
              <div className="flex items-center gap-2 mb-2">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#22C55E] opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-[#22C55E]"></span>
                </span>
                <span className="text-[11.5px] font-semibold text-[#16A34A]">
                  All Systems Operational
                </span>
              </div>
              <div className="w-full h-1.5 bg-[#DCFCE7] rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-[#22C55E] to-[#16A34A] rounded-full w-[99.98%]" />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── User Profile Footer ── */}
      <div className="shrink-0 border-t border-[#F1F5F9] p-3">
        <div
          className={`flex items-center rounded-xl p-2 transition-colors relative group ${
            isCollapsed ? 'justify-center' : 'gap-3 hover:bg-[#F8FAFC]'
          }`}
        >
          <div className="relative shrink-0">
            <div className="w-8 h-8 rounded-xl bg-[#2563EB] flex items-center justify-center text-white text-[11px] font-bold shadow-sm">
              {initials}
            </div>
            <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-[#22C55E] border-2 border-white rounded-full" />
          </div>

          {!isCollapsed && (
            <div className="flex-1 min-w-0">
              <div className="text-[13px] font-semibold text-[#0F172A] truncate leading-tight">
                {user?.name || 'Super Admin'}
              </div>
              <div className="text-[10.5px] text-[#94A3B8] truncate leading-tight mt-0.5">
                {user?.email || 'admin@bhumicred.com'}
              </div>
            </div>
          )}

          {!isCollapsed && (
            <button
              onClick={() => dispatch(logout())}
              className="p-1.5 text-[#94A3B8] hover:text-[#EF4444] hover:bg-[#FEF2F2] rounded-lg transition-colors shrink-0"
              title="Sign Out"
            >
              <LogOut size={15} />
            </button>
          )}

          {/* Tooltip on User Profile when Collapsed */}
          {isCollapsed && (
            <div className="absolute left-full ml-3 px-3 py-1.5 bg-[#0F172A] text-white text-[12px] font-semibold rounded-lg shadow-xl whitespace-nowrap z-50 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-150">
              {user?.name || 'Super Admin'}
              <div className="absolute -left-1 top-1/2 -translate-y-1/2 w-2 h-2 bg-[#0F172A] rotate-45 rounded-xs" />
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* ── Mobile Overlay Drawer (<1024px) ── */}
      <AnimatePresence>
        {isMobile && mobileOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={closeMobile}
              className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-40 lg:hidden"
            />

            {/* Mobile Drawer Slide-in */}
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 280 }}
              className="fixed inset-y-0 left-0 w-[280px] bg-white z-50 shadow-2xl border-r border-[#F1F5F9] lg:hidden"
            >
              {sidebarContent}
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* ── Desktop Fixed/Inline Sidebar (≥1024px) ── */}
      <motion.aside
        animate={{ width: collapsed ? 88 : 280 }}
        transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
        className="hidden lg:block shrink-0 h-screen bg-white border-r border-[#F1F5F9] relative z-20"
      >
        {sidebarContent}
      </motion.aside>
    </>
  );
};

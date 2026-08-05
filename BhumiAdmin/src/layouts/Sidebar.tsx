import React, { useState, useRef, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Globe2, LayoutDashboard, Users, Sprout, Building2, Handshake,
  Map, FileText, Cloud, ShieldCheck, Trees, Wallet, Activity,
  Settings, ChevronLeft, ChevronRight, Search, Pin, Star,
  BarChart3, Bell, HelpCircle, ClipboardList, ChevronDown, LogOut,
  Leaf
} from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import { logout } from '../store/slices/authSlice';
import { RootState } from '../store/store';

import { useAuth } from '../context/AuthContext';
import { Role } from '../store/slices/authSlice';

// ── Navigation structure ──────────────────────────────────────────────────────

type NavItemType = {
  id: string;
  label: string;
  icon: any;
  path: string;
  allowedRoles?: (Role | string)[];
};

type NavGroupType = {
  label: string;
  items: NavItemType[];
};

const NAV_GROUPS: NavGroupType[] = [
  {
    label: 'Overview',
    items: [
      { id: 'command-center', label: 'Command Center', icon: Globe2,        path: '/command-center', allowedRoles: ['Super Admin'] },
      { id: 'dashboard',      label: 'Dashboard',      icon: LayoutDashboard, path: '/' },
    ],
  },
  {
    label: 'Operations',
    items: [
      { id: 'users',    label: 'User Management', icon: Users,     path: '/users', allowedRoles: ['Super Admin'] },
      { id: 'farmers',  label: 'Farmers',          icon: Sprout,    path: '/farmers', allowedRoles: ['Super Admin', 'Operations Admin', 'KYC Admin', 'Project Admin', 'Auditor'] },
      { id: 'govt',     label: 'Government',       icon: Building2, path: '/govt', allowedRoles: ['Super Admin', 'Operations Admin', 'KYC Admin', 'Project Admin', 'Auditor'] },
      { id: 'partners', label: 'Partners',          icon: Handshake, path: '/partners', allowedRoles: ['Super Admin', 'Operations Admin', 'KYC Admin', 'Project Admin', 'Auditor'] },
      { id: 'kyc',      label: 'KYC Center',        icon: ShieldCheck, path: '/kyc', allowedRoles: ['Super Admin', 'Operations Admin', 'KYC Admin', 'Auditor'] },
      { id: 'documents',label: 'Document Center',   icon: FileText,  path: '/documents', allowedRoles: ['Super Admin', 'Operations Admin', 'KYC Admin', 'Auditor'] },
      { id: 'land',     label: 'Land & GIS',        icon: Map,       path: '/land', allowedRoles: ['Super Admin', 'Operations Admin', 'GIS Admin', 'Project Admin', 'Auditor'] },
      { id: 'projects', label: 'Projects',          icon: FileText,  path: '/projects', allowedRoles: ['Super Admin', 'Operations Admin', 'Project Admin', 'Auditor'] },
    ],
  },
  {
    label: 'Business',
    items: [
      { id: 'carbon',      label: 'Carbon Credits', icon: Cloud,       path: '/carbon', allowedRoles: ['Super Admin', 'Operations Admin', 'Project Admin', 'Finance Admin', 'Auditor'] },
      { id: 'insurance',   label: 'Insurance',      icon: ShieldCheck, path: '/insurance', allowedRoles: ['Super Admin', 'Operations Admin', 'Insurance Admin', 'Auditor'] },
      { id: 'marketplace', label: 'Marketplace',    icon: Trees,       path: '/marketplace', allowedRoles: ['Super Admin', 'Operations Admin', 'Marketplace Admin', 'Finance Admin', 'Auditor'] },
      { id: 'wallet',      label: 'Wallet',         icon: Wallet,      path: '/wallet', allowedRoles: ['Super Admin', 'Finance Admin', 'Auditor'] },
      { id: 'mrv',         label: 'MRV Ops',        icon: Activity,    path: '/mrv', allowedRoles: ['Super Admin', 'Operations Admin', 'Project Admin', 'GIS Admin', 'Auditor'] },
    ],
  },
  {
    label: 'System',
    items: [
      { id: 'notifications', label: 'Notifications', icon: Bell,          path: '/notifications', allowedRoles: ['Super Admin', 'Content Admin'] },
      { id: 'reports',       label: 'Reports',        icon: BarChart3,     path: '/reports', allowedRoles: ['Super Admin', 'Finance Admin', 'Operations Admin', 'Auditor'] },
      { id: 'support',       label: 'Support Center', icon: HelpCircle,    path: '/support', allowedRoles: ['Super Admin', 'Support Admin'] },
      { id: 'audit',         label: 'Audit Logs',     icon: ClipboardList, path: '/audit', allowedRoles: ['Super Admin', 'Auditor'] },
      { id: 'cms',           label: 'CMS Content',    icon: FileText,      path: '/cms', allowedRoles: ['Super Admin', 'Content Admin'] },
      { id: 'settings',      label: 'Settings',       icon: Settings,      path: '/settings', allowedRoles: ['Super Admin'] },
    ],
  },
];

// ── Sidebar Component ─────────────────────────────────────────────────────────

export const Sidebar = () => {
  const { hasRole } = useAuth();
  const [collapsed, setCollapsed]   = useState(false);
  const [searchQ,   setSearchQ]     = useState('');
  const [pinned,    setPinned]       = useState<string[]>([]);
  const location = useLocation();
  const dispatch = useDispatch();
  const user     = useSelector((s: RootState) => s.auth.user);

  // Filter nav based on role and search
  const filtered = NAV_GROUPS.map(g => ({
    ...g,
    items: g.items.filter(i => {
      // First check role permission
      if (i.allowedRoles && !hasRole(i.allowedRoles)) return false;
      // Then check search query
      if (searchQ.trim() && !i.label.toLowerCase().includes(searchQ.toLowerCase())) return false;
      return true;
    }),
  })).filter(g => g.items.length > 0);

  const togglePin = (id: string) =>
    setPinned(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id]);

  const initials = user?.name
    ? user.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
    : 'SA';

  return (
    <motion.div
      animate={{ width: collapsed ? 68 : 240 }}
      transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1] }}
      className="shrink-0 flex flex-col h-screen bg-white border-r border-[#F1F5F9] relative overflow-hidden"
      style={{ boxShadow: '1px 0 0 0 #F1F5F9' }}
    >
      {/* ── Logo ── */}
      <div className="h-[60px] flex items-center px-4 border-b border-[#F1F5F9] shrink-0">
        <AnimatePresence mode="wait">
          {collapsed ? (
            <motion.div
              key="icon"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.15 }}
              className="w-8 h-8 bg-[#F0FDF4] rounded-xl flex items-center justify-center mx-auto"
            >
              <Leaf size={18} className="text-[#16A34A]" />
            </motion.div>
          ) : (
            <motion.div
              key="logo"
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -8 }}
              transition={{ duration: 0.15 }}
              className="flex items-center gap-2.5"
            >
              <div className="w-8 h-8 bg-[#F0FDF4] rounded-xl flex items-center justify-center shrink-0">
                <Leaf size={18} className="text-[#16A34A]" />
              </div>
              <div>
                <div className="text-[14px] font-700 text-[#0F172A] leading-none" style={{ fontWeight: 700 }}>BhumiCred</div>
                <div className="text-[10px] text-[#94A3B8] mt-0.5 leading-none">Enterprise Console</div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── Search ── */}
      <AnimatePresence>
        {!collapsed && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="px-3 py-2.5 shrink-0"
          >
            <div className="relative">
              <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8]" />
              <input
                type="text"
                value={searchQ}
                onChange={e => setSearchQ(e.target.value)}
                placeholder="Search modules..."
                className="w-full h-8 pl-8 pr-3 text-[12.5px] bg-[#F8FAFC] border border-[#E2E8F0] rounded-[8px] outline-none focus:border-[#16A34A] focus:bg-white text-[#0F172A] placeholder-[#94A3B8] transition-all"
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Navigation ── */}
      <div className="flex-1 overflow-y-auto py-2 px-2.5">
        {/* Pinned items */}
        {!collapsed && pinned.length > 0 && (
          <div className="mb-1">
            <div className="sidebar-section-label">Pinned</div>
            {NAV_GROUPS.flatMap(g => g.items)
              .filter(i => pinned.includes(i.id))
              .map(item => (
                <SidebarItem key={item.id} item={item} collapsed={collapsed}
                  isPinned={true} onPin={() => togglePin(item.id)}
                  isActive={location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path))}
                />
              ))
            }
          </div>
        )}

        {/* Main nav groups */}
        {filtered.map(group => (
          <div key={group.label} className="mb-1">
            {!collapsed && (
              <div className="sidebar-section-label">{group.label}</div>
            )}
            {group.items.map(item => {
              const isActive = item.path === '/'
                ? location.pathname === '/'
                : location.pathname.startsWith(item.path);
              return (
                <SidebarItem key={item.id} item={item} collapsed={collapsed}
                  isPinned={pinned.includes(item.id)} onPin={() => togglePin(item.id)}
                  isActive={isActive}
                />
              );
            })}
          </div>
        ))}
      </div>

      {/* ── User Profile ── */}
      <div className="shrink-0 p-2.5 border-t border-[#F1F5F9]">
        <div className={`flex items-center gap-2.5 rounded-[10px] p-2 hover:bg-[#F8FAFC] cursor-pointer transition-colors group ${collapsed ? 'justify-center' : ''}`}>
          <div className="shrink-0 w-8 h-8 rounded-[10px] bg-[#2563EB] flex items-center justify-center text-white text-[12px] font-700" style={{ fontWeight: 700 }}>
            {initials}
          </div>
          <AnimatePresence>
            {!collapsed && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex-1 overflow-hidden"
              >
                <div className="text-[12.5px] font-600 text-[#0F172A] truncate leading-tight" style={{ fontWeight: 600 }}>
                  {user?.name || 'Super Admin'}
                </div>
                <div className="text-[11px] text-[#94A3B8] truncate leading-tight">
                  {user?.role || 'Administrator'}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          {!collapsed && (
            <button
              onClick={() => dispatch(logout())}
              className="shrink-0 p-1 rounded-[6px] text-[#94A3B8] hover:text-[#EF4444] hover:bg-[#FEF2F2] opacity-0 group-hover:opacity-100 transition-all"
              title="Logout"
            >
              <LogOut size={14} />
            </button>
          )}
        </div>
      </div>

      {/* ── Collapse Toggle ── */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-3 top-[72px] w-6 h-6 bg-white border border-[#E2E8F0] rounded-full flex items-center justify-center shadow-sm hover:shadow-md hover:border-[#16A34A] hover:text-[#16A34A] text-[#64748B] transition-all z-10"
      >
        {collapsed ? <ChevronRight size={13} /> : <ChevronLeft size={13} />}
      </button>
    </motion.div>
  );
};

// ── Sidebar Item ──────────────────────────────────────────────────────────────

interface NavItem { id: string; label: string; icon: any; path: string; }

const SidebarItem = ({
  item, collapsed, isActive, isPinned, onPin,
}: {
  item: NavItem; collapsed: boolean; isActive: boolean; isPinned: boolean; onPin: () => void;
}) => {
  return (
    <NavLink to={item.path} title={collapsed ? item.label : undefined}>
      {({ isActive: navIsActive }) => {
        const active = isActive || navIsActive;
        return (
          <div className={`sidebar-nav-item group ${active ? 'active' : ''}`}>
            <item.icon size={17} className={`nav-icon shrink-0 ${active ? 'text-[#16A34A]' : 'text-[#64748B]'}`} />
            <AnimatePresence>
              {!collapsed && (
                <motion.span
                  initial={{ opacity: 0, width: 0 }}
                  animate={{ opacity: 1, width: 'auto' }}
                  exit={{ opacity: 0, width: 0 }}
                  className="flex-1 truncate text-[13px]"
                >
                  {item.label}
                </motion.span>
              )}
            </AnimatePresence>
            {!collapsed && (
              <button
                onClick={e => { e.preventDefault(); e.stopPropagation(); onPin(); }}
                className={`shrink-0 p-0.5 rounded opacity-0 group-hover:opacity-100 transition-all ${isPinned ? 'opacity-100 text-[#16A34A]' : 'text-[#CBD5E1]'}`}
              >
                <Pin size={11} className={isPinned ? 'fill-current' : ''} />
              </button>
            )}
          </div>
        );
      }}
    </NavLink>
  );
};

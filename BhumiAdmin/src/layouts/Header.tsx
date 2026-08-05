import React, { useState, useRef, useEffect } from 'react';
import {
  Search, Plus, Bell, MessageSquare, Globe, MapPin, Sun, Cloud,
  ChevronDown, Settings, LogOut, User, HelpCircle, X, Check,
  AlertTriangle, Info, Zap, RefreshCw
} from 'lucide-react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../store/store';
import { logout } from '../store/slices/authSlice';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

// ── Mock notifications ────────────────────────────────────────────────────────
const NOTIFICATIONS = [
  { id: 1, type: 'alert',   title: 'Forest Fire Detected',         body: 'Maharashtra Region • 2 mins ago',   read: false },
  { id: 2, type: 'warning', title: 'Land Verification Pending',    body: 'Madhya Pradesh • 22 mins ago',      read: false },
  { id: 3, type: 'info',    title: 'New Farmer Registration',       body: 'Ramesh Patel, MP • 35 mins ago',    read: false },
  { id: 4, type: 'success', title: 'Carbon Credit Issued',          body: '1,250 tCO2e • Project Green',        read: true  },
  { id: 5, type: 'warning', title: 'Heavy Rainfall Alert',          body: 'Gujarat Region • 14 mins ago',       read: true  },
];

// ── Breadcrumb generator ──────────────────────────────────────────────────────
const ROUTE_LABELS: Record<string, string> = {
  '':               'Home',
  'command-center': 'Command Center',
  'dashboard':      'Dashboard',
  'users':          'User Management',
  'farmers':        'Farmers',
  'govt':           'Government',
  'partners':       'Partners',
  'land':           'Land & GIS',
  'projects':       'Projects',
  'carbon':         'Carbon Credits',
  'insurance':      'Insurance',
  'marketplace':    'Marketplace',
  'wallet':         'Wallet',
  'mrv':            'MRV Ops',
  'notifications':  'Notifications',
  'reports':        'Reports',
  'support':        'Support',
  'audit':          'Audit Logs',
  'settings':       'Settings',
};

// ── Header Component ──────────────────────────────────────────────────────────
export const Header = () => {
  const [search,          setSearch]          = useState('');
  const [showNotif,       setShowNotif]       = useState(false);
  const [showProfile,     setShowProfile]     = useState(false);
  const [showLang,        setShowLang]        = useState(false);
  const [notifications,   setNotifications]   = useState(NOTIFICATIONS);
  const notifRef   = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);
  const langRef    = useRef<HTMLDivElement>(null);
  const dispatch   = useDispatch();
  const navigate   = useNavigate();
  const location   = useLocation();
  const user       = useSelector((s: RootState) => s.auth.user);

  const unread = notifications.filter(n => !n.read).length;

  // Breadcrumbs
  const paths = location.pathname.split('/').filter(Boolean);
  const crumbs = [{ label: 'Home', path: '/' }, ...paths.map((p, i) => ({
    label: ROUTE_LABELS[p] || (p.charAt(0).toUpperCase() + p.slice(1)),
    path: '/' + paths.slice(0, i + 1).join('/'),
  }))];

  // Close dropdowns on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node))   setShowNotif(false);
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) setShowProfile(false);
      if (langRef.current && !langRef.current.contains(e.target as Node)) setShowLang(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Cmd+K / Ctrl+K to focus search
  const searchInputRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  const markAllRead = () => setNotifications(n => n.map(x => ({ ...x, read: true })));

  const notifIcon = (type: string) => {
    if (type === 'alert')   return <AlertTriangle size={13} className="text-[#EF4444]" />;
    if (type === 'warning') return <AlertTriangle size={13} className="text-[#F59E0B]" />;
    if (type === 'success') return <Check        size={13} className="text-[#22C55E]" />;
    return                         <Info          size={13} className="text-[#3B82F6]" />;
  };

  const initials = user?.name
    ? user.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
    : 'SA';

  return (
    <header className="h-[60px] bg-white border-b border-[#E2E8F0] flex items-center px-5 gap-4 sticky top-0 z-30 shrink-0">

      {/* ── Breadcrumbs ── */}
      <nav className="hidden md:flex items-center gap-1.5 text-[12.5px] min-w-0 flex-1">
        {crumbs.map((c, i) => (
          <React.Fragment key={c.path}>
            {i > 0 && <span className="text-[#CBD5E1] select-none">/</span>}
            <button
              onClick={() => navigate(c.path)}
              className={`truncate transition-colors ${
                i === crumbs.length - 1
                  ? 'text-[#0F172A] font-600 cursor-default pointer-events-none'
                  : 'text-[#64748B] hover:text-[#16A34A]'
              }`}
              style={{ fontWeight: i === crumbs.length - 1 ? 600 : 400 }}
            >
              {c.label}
            </button>
          </React.Fragment>
        ))}
      </nav>

      {/* ── Global Search ── */}
      <div className="flex items-center flex-1 max-w-[380px] mx-auto">
        <div className="relative w-full">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8]" />
          <input
            ref={searchInputRef}
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search farmers, land, projects..."
            className="w-full h-[36px] pl-9 pr-12 text-[13px] bg-[#F8FAFC] border border-[#E2E8F0] rounded-[10px] outline-none focus:bg-white focus:border-[#16A34A] focus:shadow-[0_0_0_3px_rgba(22,163,74,0.1)] text-[#0F172A] placeholder-[#94A3B8] transition-all"
          />
          <kbd className="absolute right-3 top-1/2 -translate-y-1/2 px-1.5 py-0.5 text-[10px] font-mono text-[#94A3B8] bg-[#F1F5F9] border border-[#E2E8F0] rounded">
            ⌘K
          </kbd>
        </div>
      </div>

      {/* ── Right Actions ── */}
      <div className="flex items-center gap-1 shrink-0">

        {/* Location */}
        <div className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-[8px] text-[12px] text-[#64748B] hover:bg-[#F8FAFC] cursor-pointer transition-colors">
          <MapPin size={13} className="text-[#16A34A]" />
          <span>Indore, MP</span>
        </div>

        {/* Weather */}
        <div className="hidden lg:flex items-center gap-1 px-2.5 py-1.5 rounded-[8px] text-[12px] text-[#64748B] hover:bg-[#F8FAFC] cursor-pointer transition-colors">
          <Sun size={14} className="text-[#F59E0B]" />
          <span>32°C</span>
        </div>

        <div className="w-px h-5 bg-[#E2E8F0] mx-1" />

        {/* Quick Action */}
        <button 
          onClick={() => { window.location.href = '/projects'; }}
          className="hidden md:flex items-center gap-1.5 btn btn-primary btn-sm"
        >
          <Plus size={13} />
          <span>New Project</span>
        </button>

        {/* Language */}
        <div className="relative" ref={langRef}>
          <button 
            onClick={() => setShowLang(!showLang)}
            className={`btn btn-icon btn-sm relative ${showLang ? 'bg-[#F0FDF4] text-[#16A34A]' : 'btn-ghost'}`}
          >
            <Globe size={16} className={showLang ? "text-[#16A34A]" : "text-[#64748B]"} />
          </button>
          <AnimatePresence>
            {showLang && (
              <motion.div
                initial={{ opacity: 0, y: 6, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 6, scale: 0.97 }}
                transition={{ duration: 0.15 }}
                className="absolute right-0 top-[calc(100%+8px)] w-[120px] bg-white rounded-[12px] border border-[#E2E8F0] shadow-[0_10px_40px_rgba(0,0,0,0.1)] z-50 py-1.5"
              >
                <button onClick={() => setShowLang(false)} className="w-full flex items-center justify-between px-4 py-2 text-[12.5px] text-[#0F172A] bg-[#F8FAFC] font-500">
                  English <Check size={14} className="text-[#16A34A]" />
                </button>
                <button onClick={() => setShowLang(false)} className="w-full flex items-center justify-between px-4 py-2 text-[12.5px] text-[#64748B] hover:bg-[#FAFCFF] transition-colors">
                  Hindi
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Notifications */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => setShowNotif(!showNotif)}
            className={`btn btn-icon btn-sm relative ${showNotif ? 'bg-[#F0FDF4] text-[#16A34A]' : 'btn-ghost'}`}
          >
            <Bell size={16} />
            {unread > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-[#EF4444] text-white text-[9px] font-700 rounded-full flex items-center justify-center" style={{ fontWeight: 700 }}>
                {unread}
              </span>
            )}
          </button>

          <AnimatePresence>
            {showNotif && (
              <motion.div
                initial={{ opacity: 0, y: 6, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 6, scale: 0.97 }}
                transition={{ duration: 0.15 }}
                className="absolute right-0 top-[calc(100%+8px)] w-[340px] bg-white rounded-[16px] border border-[#E2E8F0] shadow-[0_10px_40px_rgba(0,0,0,0.1)] z-50"
              >
                <div className="flex items-center justify-between px-4 pt-4 pb-3 border-b border-[#F1F5F9]">
                  <div>
                    <div className="text-[13.5px] font-600 text-[#0F172A]" style={{ fontWeight: 600 }}>Notifications</div>
                    <div className="text-[11.5px] text-[#94A3B8]">{unread} unread</div>
                  </div>
                  <button onClick={markAllRead} className="text-[11.5px] text-[#16A34A] hover:underline font-500">
                    Mark all read
                  </button>
                </div>
                <div className="max-h-[320px] overflow-y-auto">
                  {notifications.map(n => (
                    <div
                      key={n.id}
                      className={`flex items-start gap-3 px-4 py-3 border-b border-[#F8FAFC] hover:bg-[#FAFCFF] transition-colors cursor-pointer last:border-0 ${!n.read ? 'bg-[#FDFFFE]' : ''}`}
                    >
                      <div className={`shrink-0 w-7 h-7 rounded-[8px] flex items-center justify-center mt-0.5 ${
                        n.type === 'alert'   ? 'bg-[#FEF2F2]' :
                        n.type === 'warning' ? 'bg-[#FFFBEB]' :
                        n.type === 'success' ? 'bg-[#F0FDF4]' : 'bg-[#EFF6FF]'
                      }`}>
                        {notifIcon(n.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className={`text-[12.5px] leading-tight ${!n.read ? 'font-600 text-[#0F172A]' : 'text-[#374151]'}`} style={{ fontWeight: !n.read ? 600 : 400 }}>
                          {n.title}
                        </div>
                        <div className="text-[11.5px] text-[#94A3B8] mt-0.5">{n.body}</div>
                      </div>
                      {!n.read && <div className="shrink-0 w-1.5 h-1.5 bg-[#16A34A] rounded-full mt-1.5" />}
                    </div>
                  ))}
                </div>
                <div className="px-4 py-2.5 border-t border-[#F1F5F9]">
                  <button 
                    onClick={() => { setShowNotif(false); navigate('/notifications'); }}
                    className="w-full text-[12px] text-[#16A34A] font-500 hover:underline"
                  >
                    View all notifications
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="w-px h-5 bg-[#E2E8F0] mx-1" />

        {/* Profile */}
        <div className="relative" ref={profileRef}>
          <button
            onClick={() => setShowProfile(!showProfile)}
            className={`flex items-center gap-2 pl-2 pr-2.5 py-1.5 rounded-[10px] transition-colors ${showProfile ? 'bg-[#F0FDF4]' : 'hover:bg-[#F8FAFC]'}`}
          >
            <div className="w-7 h-7 rounded-[8px] bg-[#2563EB] flex items-center justify-center text-white text-[11px] font-700 shrink-0" style={{ fontWeight: 700 }}>
              {initials}
            </div>
            <div className="hidden md:block text-left">
              <div className="text-[12px] font-600 text-[#0F172A] leading-tight" style={{ fontWeight: 600 }}>{user?.name || 'Super Admin'}</div>
              <div className="text-[10.5px] text-[#94A3B8] leading-tight">{user?.role || 'Administrator'}</div>
            </div>
            <ChevronDown size={13} className="text-[#94A3B8] hidden md:block" />
          </button>

          <AnimatePresence>
            {showProfile && (
              <motion.div
                initial={{ opacity: 0, y: 6, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 6, scale: 0.97 }}
                transition={{ duration: 0.15 }}
                className="absolute right-0 top-[calc(100%+8px)] w-[200px] bg-white rounded-[14px] border border-[#E2E8F0] shadow-[0_10px_40px_rgba(0,0,0,0.1)] z-50 py-1.5"
              >
                <div className="px-4 py-2.5 border-b border-[#F1F5F9] mb-1">
                  <div className="text-[12.5px] font-600 text-[#0F172A]" style={{ fontWeight: 600 }}>{user?.name}</div>
                  <div className="text-[11px] text-[#94A3B8] truncate">{user?.email}</div>
                </div>
                {[
                  { icon: User,     label: 'My Profile',   action: () => navigate('/users') },
                  { icon: Settings, label: 'Settings',      action: () => navigate('/settings') },
                  { icon: HelpCircle, label: 'Help Center', action: () => navigate('/support') },
                ].map(m => (
                  <button
                    key={m.label}
                    onClick={() => { m.action(); setShowProfile(false); }}
                    className="w-full flex items-center gap-2.5 px-4 py-2 text-[12.5px] text-[#374151] hover:bg-[#F8FAFC] hover:text-[#0F172A] transition-colors"
                  >
                    <m.icon size={14} className="text-[#94A3B8]" />
                    {m.label}
                  </button>
                ))}
                <div className="border-t border-[#F1F5F9] mt-1 pt-1">
                  <button
                    onClick={() => dispatch(logout())}
                    className="w-full flex items-center gap-2.5 px-4 py-2 text-[12.5px] text-[#EF4444] hover:bg-[#FEF2F2] transition-colors"
                  >
                    <LogOut size={14} />
                    Sign Out
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  );
};

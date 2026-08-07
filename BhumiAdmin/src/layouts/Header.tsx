import { useState, useRef, useEffect } from 'react';
import {
  Search, Bell, Mail, LayoutGrid, TrendingUp,
  ChevronDown, Settings, LogOut, User, HelpCircle,
  Check, AlertTriangle, Info, Menu, ArrowRight,
  Sprout, Map, ShieldCheck, ShoppingBag, Landmark,
  CloudSun, ExternalLink
} from 'lucide-react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../store/store';
import { logout } from '../store/slices/authSlice';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useSidebar } from '../context/SidebarContext';
import { BhumiLogo } from '../components/BhumiLogo';

const INITIAL_NOTIFICATIONS = [
  { id: 1, type: 'alert',   title: 'Forest Fire Detected',      body: 'Maharashtra Region • 2 mins ago', read: false, link: '/command-center' },
  { id: 2, type: 'warning', title: 'Land Verification Pending',  body: 'Madhya Pradesh • 22 mins ago',    read: false, link: '/land' },
  { id: 3, type: 'info',    title: 'New Farmer Registration',    body: 'Ramesh Patel, MP • 35 mins ago',  read: false, link: '/farmers' },
  { id: 4, type: 'success', title: 'Carbon Credit Issued',       body: '1,250 tCO₂e • Project Green',     read: true,  link: '/carbon' },
  { id: 5, type: 'warning', title: 'Heavy Rainfall Alert',       body: 'Gujarat Region • 14 mins ago',    read: true,  link: '/command-center' },
];

const QUICK_APPS = [
  { title: 'Command Center', icon: Landmark,    path: '/command-center', color: 'bg-indigo-50 text-indigo-600' },
  { title: 'Farmers Hub',    icon: Sprout,      path: '/farmers',        color: 'bg-emerald-50 text-emerald-600' },
  { title: 'Land Parcels',   icon: Map,         path: '/land',           color: 'bg-amber-50 text-amber-600' },
  { title: 'Carbon Registry',icon: TrendingUp,  path: '/carbon',         color: 'bg-green-50 text-green-600' },
  { title: 'Tree Insurance', icon: ShieldCheck, path: '/insurance',      color: 'bg-blue-50 text-blue-600' },
  { title: 'Marketplace',    icon: ShoppingBag, path: '/marketplace',    color: 'bg-purple-50 text-purple-600' },
];

const WEATHER_LOCATIONS = [
  { city: 'Indore, MP', temp: '32°C', cond: 'Sunny' },
  { city: 'Bhopal, MP', temp: '30°C', cond: 'Partly Cloudy' },
  { city: 'Sihore, MP', temp: '31°C', cond: 'Clear' },
  { city: 'Ahmedabad, GJ', temp: '35°C', cond: 'Sunny' },
];

const MESSAGES = [
  { id: 1, sender: 'Ramesh Patel', text: 'Submitted land core sample report for MP plot #402', time: '10m ago', unread: true },
  { id: 2, sender: 'Field Officer Verma', text: 'Drone audit completed for Indore citrus cluster', time: '1h ago', unread: true },
  { id: 3, sender: 'Carbon Registry ICAR', text: 'Batch verification #902 approved for issuance', time: '3h ago', unread: false },
];

const SEARCH_SUGGESTIONS = [
  { type: 'Farmer', label: 'Ramesh Patel (F-84920)', sub: 'Indore, MP • 12.4 Acres', path: '/farmers' },
  { type: 'Land', label: 'Parcel #MP-49201 Citrus Orchard', sub: 'Verified Baseline • 8.2 Ha', path: '/land' },
  { type: 'Carbon', label: 'Indore Agroforestry VCS Project #491', sub: '42,500 tCO₂e Available', path: '/carbon' },
  { type: 'Project', label: 'Madhya Pradesh Soil Carbon Program', sub: 'Active Inspection Phase', path: '/projects' },
  { type: 'Insurance', label: 'Tree Shield Policy #TS-9021', sub: 'Covered ₹4,50,000', path: '/insurance' },
];

export const Header = () => {
  const { toggleSidebar, collapsed } = useSidebar();
  const [search,            setSearch]          = useState('');
  const [showSearchDrop,    setShowSearchDrop]  = useState(false);
  const [showNotif,         setShowNotif]       = useState(false);
  const [showMail,          setShowMail]        = useState(false);
  const [showGrid,          setShowGrid]        = useState(false);
  const [showWeather,       setShowWeather]     = useState(false);
  const [showCarbon,        setShowCarbon]      = useState(false);
  const [showProfile,       setShowProfile]     = useState(false);
  
  const [notifications,    setNotifications]   = useState(INITIAL_NOTIFICATIONS);
  const [activeWeather,    setActiveWeather]   = useState(WEATHER_LOCATIONS[0]);
  const [messagesList,      setMessagesList]    = useState(MESSAGES);

  const searchRef   = useRef<HTMLDivElement>(null);
  const notifRef    = useRef<HTMLDivElement>(null);
  const mailRef     = useRef<HTMLDivElement>(null);
  const gridRef     = useRef<HTMLDivElement>(null);
  const weatherRef  = useRef<HTMLDivElement>(null);
  const carbonRef   = useRef<HTMLDivElement>(null);
  const profileRef  = useRef<HTMLDivElement>(null);
  
  const dispatch    = useDispatch();
  const navigate    = useNavigate();
  const user        = useSelector((s: RootState) => s.auth.user);
  
  const unreadNotifs = notifications.filter(n => !n.read).length;
  const unreadMails  = messagesList.filter(m => m.unread).length;

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const target = e.target as Node;
      if (searchRef.current && !searchRef.current.contains(target))   setShowSearchDrop(false);
      if (notifRef.current && !notifRef.current.contains(target))     setShowNotif(false);
      if (mailRef.current && !mailRef.current.contains(target))       setShowMail(false);
      if (gridRef.current && !gridRef.current.contains(target))       setShowGrid(false);
      if (weatherRef.current && !weatherRef.current.contains(target)) setShowWeather(false);
      if (carbonRef.current && !carbonRef.current.contains(target))   setShowCarbon(false);
      if (profileRef.current && !profileRef.current.contains(target)) setShowProfile(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const searchInputRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') { 
        e.preventDefault(); 
        searchInputRef.current?.focus(); 
        setShowSearchDrop(true);
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  const markAllNotifsRead = () => setNotifications(n => n.map(x => ({ ...x, read: true })));
  const markAllMailsRead = () => setMessagesList(m => m.map(x => ({ ...x, unread: false })));

  const handleNotifClick = (notif: typeof INITIAL_NOTIFICATIONS[0]) => {
    setNotifications(n => n.map(x => x.id === notif.id ? { ...x, read: true } : x));
    setShowNotif(false);
    navigate(notif.link);
  };

  const filteredSearch = SEARCH_SUGGESTIONS.filter(item => 
    !search || 
    item.label.toLowerCase().includes(search.toLowerCase()) || 
    item.type.toLowerCase().includes(search.toLowerCase()) ||
    item.sub.toLowerCase().includes(search.toLowerCase())
  );

  const notifIcon = (type: string) => {
    if (type === 'alert')   return <AlertTriangle size={13} className="text-[#EF4444]" />;
    if (type === 'warning') return <AlertTriangle size={13} className="text-[#F59E0B]" />;
    if (type === 'success') return <Check         size={13} className="text-[#22C55E]" />;
    return                         <Info          size={13} className="text-[#3B82F6]" />;
  };

  const initials = user?.name
    ? user.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
    : 'SA';

  return (
    <header
      className="h-[60px] bg-white border-b border-[#F1F5F9] flex items-center px-4 gap-3 sticky top-0 z-30 shrink-0 select-none"
      style={{ fontFamily: "'Inter', system-ui, sans-serif" }}
    >
      {/* ── Hamburger Toggle Button & Logo (Card Style - Design 2) ── */}
      <div className="flex items-center gap-3">
        <button
          onClick={toggleSidebar}
          className="w-9 h-9 flex items-center justify-center rounded-xl bg-white border border-[#E2E8F0] shadow-xs text-[#64748B] hover:text-[#0F172A] hover:border-[#CBD5E1] hover:bg-[#F8FAFC] active:scale-95 transition-all duration-150 shrink-0"
          title={collapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
          aria-label="Toggle Navigation Sidebar"
        >
          <Menu size={18} className="text-[#64748B]" />
        </button>

        {collapsed && (
          <BhumiLogo size="sm" showSubtitle={false} className="hidden sm:flex" />
        )}
      </div>

      {/* ── Global Search Bar with Live Results Dropdown ── */}
      <div className="flex items-center flex-1 max-w-[420px] relative" ref={searchRef}>
        <div className="relative w-full">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8]" />
          <input
            ref={searchInputRef}
            type="text"
            value={search}
            onFocus={() => setShowSearchDrop(true)}
            onChange={e => {
              setSearch(e.target.value);
              setShowSearchDrop(true);
            }}
            placeholder="Search farmers, land parcels, projects..."
            className="w-full h-[36px] pl-9 pr-12 text-[12.5px] bg-[#F8FAFC] border border-[#E8EDF5] rounded-xl outline-none focus:bg-white focus:border-[#22C55E] focus:shadow-[0_0_0_3px_rgba(34,197,94,0.1)] text-[#0F172A] placeholder-[#94A3B8] transition-all"
          />
          <kbd className="absolute right-3 top-1/2 -translate-y-1/2 px-1.5 py-0.5 text-[9.5px] font-mono text-[#94A3B8] bg-white border border-[#E8EDF5] rounded-md shadow-xs">
            ⌘K
          </kbd>
        </div>

        {/* Live Search Results Dropdown */}
        <AnimatePresence>
          {showSearchDrop && (
            <motion.div
              initial={{ opacity: 0, y: 6, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 6, scale: 0.98 }}
              transition={{ duration: 0.15 }}
              className="absolute left-0 right-0 top-[calc(100%+8px)] bg-white rounded-2xl border border-[#E8EDF5] shadow-[0_12px_36px_rgba(0,0,0,0.12)] z-50 overflow-hidden"
            >
              <div className="px-4 pt-3 pb-2 border-b border-[#F1F5F9] flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#94A3B8]">
                  {search ? 'Search Results' : 'Quick Jump'}
                </span>
                <span className="text-[10px] text-[#94A3B8]">{filteredSearch.length} items</span>
              </div>
              <div className="max-h-[300px] overflow-y-auto py-1">
                {filteredSearch.length > 0 ? (
                  filteredSearch.map((item, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        setShowSearchDrop(false);
                        setSearch('');
                        navigate(item.path);
                      }}
                      className="w-full px-4 py-2.5 flex items-center justify-between hover:bg-[#F8FAFC] transition-colors text-left group"
                    >
                      <div className="flex flex-col min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-bold px-1.5 py-0.5 bg-[#F0FDF4] text-[#16A34A] rounded-md border border-[#DCFCE7]">
                            {item.type}
                          </span>
                          <span className="text-[12.5px] font-semibold text-[#0F172A] truncate group-hover:text-[#16A34A] transition-colors">
                            {item.label}
                          </span>
                        </div>
                        <span className="text-[11px] text-[#94A3B8] mt-0.5 truncate">{item.sub}</span>
                      </div>
                      <ArrowRight size={13} className="text-[#CBD5E1] group-hover:text-[#16A34A] transition-colors shrink-0 ml-2" />
                    </button>
                  ))
                ) : (
                  <div className="px-4 py-6 text-center text-[12.5px] text-[#94A3B8]">
                    No matching records found for "{search}"
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── Right Action Cluster ── */}
      <div className="flex items-center gap-1.5 ml-auto">

        {/* Weather Location Dropdown Widget */}
        <div className="relative" ref={weatherRef}>
          <div
            onClick={() => setShowWeather(!showWeather)}
            className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-xl hover:bg-[#F8FAFC] cursor-pointer transition-colors border border-transparent hover:border-[#E8EDF5]"
          >
            <CloudSun size={17} className="text-[#F59E0B]" />
            <div>
              <div className="flex items-center gap-1 text-[10.5px] text-[#64748B] leading-none">
                <span className="font-semibold text-[#0F172A]">{activeWeather.city}</span>
                <ChevronDown size={10} className="text-[#94A3B8]" />
              </div>
              <div className="text-[12px] font-bold text-[#0F172A] leading-tight mt-0.5">{activeWeather.temp}</div>
            </div>
          </div>

          <AnimatePresence>
            {showWeather && (
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 6 }}
                className="absolute right-0 top-[calc(100%+8px)] w-[220px] bg-white rounded-2xl border border-[#E8EDF5] shadow-[0_8px_30px_rgba(0,0,0,0.1)] z-50 p-2 overflow-hidden"
              >
                <div className="px-3 py-2 border-b border-[#F1F5F9] mb-1">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-[#94A3B8]">Regional Weather</p>
                </div>
                {WEATHER_LOCATIONS.map(w => (
                  <button
                    key={w.city}
                    onClick={() => {
                      setActiveWeather(w);
                      setShowWeather(false);
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-[12px] transition-colors ${
                      activeWeather.city === w.city ? 'bg-[#F0FDF4] text-[#16A34A] font-bold' : 'hover:bg-[#F8FAFC] text-[#374151]'
                    }`}
                  >
                    <span>{w.city}</span>
                    <span className="font-semibold">{w.temp}</span>
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Carbon Rate Ticker Widget */}
        <div className="relative" ref={carbonRef}>
          <div
            onClick={() => setShowCarbon(!showCarbon)}
            className="hidden xl:flex flex-col items-start px-3 py-1 border-l border-[#F1F5F9] cursor-pointer hover:bg-[#F8FAFC] rounded-xl transition-colors"
          >
            <span className="text-[9.5px] font-semibold uppercase tracking-wider text-[#94A3B8]">Carbon Rate</span>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="text-[12px] font-bold text-[#0F172A]">₹1,842 / tCO₂e</span>
              <span className="flex items-center gap-0.5 text-[10.5px] font-bold text-[#22C55E]">
                <TrendingUp size={9} />+2.1%
              </span>
            </div>
          </div>

          <AnimatePresence>
            {showCarbon && (
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 6 }}
                className="absolute right-0 top-[calc(100%+8px)] w-[260px] bg-white rounded-2xl border border-[#E8EDF5] shadow-[0_8px_30px_rgba(0,0,0,0.1)] z-50 p-4"
              >
                <div className="flex items-center justify-between pb-2 border-b border-[#F1F5F9] mb-3">
                  <span className="text-[12px] font-bold text-[#0F172A]">Live Carbon Ticker</span>
                  <span className="text-[10px] font-bold px-2 py-0.5 bg-[#F0FDF4] text-[#16A34A] rounded-full">LIVE</span>
                </div>
                <div className="space-y-2 text-[12px]">
                  <div className="flex justify-between">
                    <span className="text-[#64748B]">Spot Price:</span>
                    <span className="font-bold text-[#0F172A]">₹1,842 / tCO₂e</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#64748B]">24h Volume:</span>
                    <span className="font-semibold text-[#0F172A]">18,400 tCO₂e</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#64748B]">Total Issued:</span>
                    <span className="font-semibold text-[#0F172A]">1.2M tCO₂e</span>
                  </div>
                </div>
                <button
                  onClick={() => { setShowCarbon(false); navigate('/carbon'); }}
                  className="w-full mt-3 py-2 bg-[#F0FDF4] hover:bg-[#DCFCE7] text-[#16A34A] font-bold text-[12px] rounded-xl flex items-center justify-center gap-1 transition-colors"
                >
                  Go to Carbon Registry <ExternalLink size={12} />
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="w-px h-5 bg-[#F1F5F9] mx-1 hidden sm:block" />

        {/* Bell Notifications Button & Dropdown */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => setShowNotif(!showNotif)}
            className={`w-9 h-9 rounded-xl flex items-center justify-center relative transition-colors ${
              showNotif ? 'bg-[#F0FDF4] text-[#22C55E] border border-[#DCFCE7]' : 'text-[#64748B] hover:bg-[#F8FAFC] hover:text-[#0F172A]'
            }`}
            title="Notifications"
          >
            <Bell size={17} />
            {unreadNotifs > 0 && (
              <span className="absolute top-1 right-1 min-w-[16px] h-4 px-1 bg-[#EF4444] text-white text-[9px] font-bold rounded-full flex items-center justify-center leading-none">
                {unreadNotifs}
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
                className="absolute right-0 top-[calc(100%+8px)] w-[340px] bg-white rounded-2xl border border-[#E8EDF5] shadow-[0_8px_32px_rgba(0,0,0,0.1)] z-50 overflow-hidden"
              >
                <div className="flex items-center justify-between px-4 pt-4 pb-3 border-b border-[#F1F5F9]">
                  <div>
                    <p className="text-[13px] font-bold text-[#0F172A]">Notifications</p>
                    <p className="text-[11px] text-[#94A3B8]">{unreadNotifs} unread alerts</p>
                  </div>
                  <button onClick={markAllNotifsRead} className="text-[11.5px] font-semibold text-[#22C55E] hover:underline">
                    Mark all read
                  </button>
                </div>
                <div className="max-h-[300px] overflow-y-auto">
                  {notifications.map(n => (
                    <div
                      key={n.id}
                      onClick={() => handleNotifClick(n)}
                      className={`flex items-start gap-3 px-4 py-3 border-b border-[#F8FAFC] hover:bg-[#FAFBFC] cursor-pointer last:border-0 ${!n.read ? 'bg-[#FDFFFE]' : ''}`}
                    >
                      <div className={`shrink-0 w-7 h-7 rounded-lg flex items-center justify-center mt-0.5 ${
                        n.type === 'alert' ? 'bg-[#FEF2F2]' : n.type === 'warning' ? 'bg-[#FFFBEB]' :
                        n.type === 'success' ? 'bg-[#F0FDF4]' : 'bg-[#EFF6FF]'
                      }`}>
                        {notifIcon(n.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[12.5px] leading-tight" style={{ fontWeight: !n.read ? 600 : 400, color: !n.read ? '#0F172A' : '#374151' }}>
                          {n.title}
                        </p>
                        <p className="text-[11px] text-[#94A3B8] mt-0.5">{n.body}</p>
                      </div>
                      {!n.read && <div className="w-1.5 h-1.5 bg-[#22C55E] rounded-full mt-1.5 flex-shrink-0" />}
                    </div>
                  ))}
                </div>
                <div className="px-4 py-2.5 border-t border-[#F1F5F9]">
                  <button onClick={() => { setShowNotif(false); navigate('/notifications'); }} className="w-full text-[12px] font-semibold text-[#22C55E] hover:underline text-center">
                    View all notifications
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Mail / Support Messages Dropdown */}
        <div className="relative" ref={mailRef}>
          <button
            onClick={() => setShowMail(!showMail)}
            className={`w-9 h-9 rounded-xl flex items-center justify-center relative transition-colors ${
              showMail ? 'bg-[#F0FDF4] text-[#22C55E] border border-[#DCFCE7]' : 'text-[#64748B] hover:bg-[#F8FAFC] hover:text-[#0F172A]'
            }`}
            title="Field Messages"
          >
            <Mail size={17} />
            {unreadMails > 0 && (
              <span className="absolute top-1 right-1 min-w-[16px] h-4 px-1 bg-[#2563EB] text-white text-[9px] font-bold rounded-full flex items-center justify-center leading-none">
                {unreadMails}
              </span>
            )}
          </button>

          <AnimatePresence>
            {showMail && (
              <motion.div
                initial={{ opacity: 0, y: 6, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 6, scale: 0.97 }}
                transition={{ duration: 0.15 }}
                className="absolute right-0 top-[calc(100%+8px)] w-[320px] bg-white rounded-2xl border border-[#E8EDF5] shadow-[0_8px_32px_rgba(0,0,0,0.1)] z-50 overflow-hidden"
              >
                <div className="flex items-center justify-between px-4 pt-4 pb-3 border-b border-[#F1F5F9]">
                  <div>
                    <p className="text-[13px] font-bold text-[#0F172A]">Field Messages</p>
                    <p className="text-[11px] text-[#94A3B8]">{unreadMails} unread messages</p>
                  </div>
                  <button onClick={markAllMailsRead} className="text-[11.5px] font-semibold text-[#2563EB] hover:underline">
                    Mark read
                  </button>
                </div>
                <div className="max-h-[280px] overflow-y-auto">
                  {messagesList.map(m => (
                    <div
                      key={m.id}
                      onClick={() => {
                        setMessagesList(list => list.map(x => x.id === m.id ? { ...x, unread: false } : x));
                        setShowMail(false);
                        navigate('/support');
                      }}
                      className={`p-3.5 border-b border-[#F8FAFC] hover:bg-[#FAFBFC] cursor-pointer last:border-0 ${m.unread ? 'bg-[#F4F7FF]' : ''}`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[12px] font-bold text-[#0F172A]">{m.sender}</span>
                        <span className="text-[10px] text-[#94A3B8]">{m.time}</span>
                      </div>
                      <p className="text-[11.5px] text-[#475569] line-clamp-2">{m.text}</p>
                    </div>
                  ))}
                </div>
                <div className="px-4 py-2.5 border-t border-[#F1F5F9]">
                  <button onClick={() => { setShowMail(false); navigate('/support'); }} className="w-full text-[12px] font-semibold text-[#2563EB] hover:underline text-center">
                    Open Support Hub
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Quick Launcher / App Grid Dropdown */}
        <div className="relative" ref={gridRef}>
          <button
            onClick={() => setShowGrid(!showGrid)}
            className={`w-9 h-9 rounded-xl flex items-center justify-center transition-colors ${
              showGrid ? 'bg-[#F0FDF4] text-[#22C55E] border border-[#DCFCE7]' : 'text-[#64748B] hover:bg-[#F8FAFC] hover:text-[#0F172A]'
            }`}
            title="Quick Apps Launcher"
          >
            <LayoutGrid size={17} />
          </button>

          <AnimatePresence>
            {showGrid && (
              <motion.div
                initial={{ opacity: 0, y: 6, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 6, scale: 0.97 }}
                transition={{ duration: 0.15 }}
                className="absolute right-0 top-[calc(100%+8px)] w-[280px] bg-white rounded-2xl border border-[#E8EDF5] shadow-[0_8px_32px_rgba(0,0,0,0.1)] z-50 p-3"
              >
                <div className="px-2 pb-2 mb-2 border-b border-[#F1F5F9]">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-[#94A3B8]">Ecosystem Apps</p>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {QUICK_APPS.map(app => (
                    <button
                      key={app.title}
                      onClick={() => {
                        setShowGrid(false);
                        navigate(app.path);
                      }}
                      className="flex flex-col items-center justify-center p-3 rounded-xl hover:bg-[#F8FAFC] border border-transparent hover:border-[#E8EDF5] transition-all group"
                    >
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-1.5 ${app.color} group-hover:scale-110 transition-transform`}>
                        <app.icon size={18} />
                      </div>
                      <span className="text-[11.5px] font-semibold text-[#0F172A] text-center">{app.title}</span>
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="w-px h-5 bg-[#F1F5F9] mx-1" />

        {/* Profile Dropdown Menu */}
        <div className="relative" ref={profileRef}>
          <button
            onClick={() => setShowProfile(!showProfile)}
            className={`flex items-center gap-1.5 pl-1 pr-2 py-1 rounded-xl transition-colors ${
              showProfile ? 'bg-[#F0FDF4]' : 'hover:bg-[#F8FAFC]'
            }`}
          >
            <div className="w-7 h-7 rounded-lg bg-[#2563EB] flex items-center justify-center text-white text-[10.5px] font-bold shrink-0 shadow-xs">
              {initials}
            </div>
            <ChevronDown size={12} className="text-[#94A3B8]" />
          </button>

          <AnimatePresence>
            {showProfile && (
              <motion.div
                initial={{ opacity: 0, y: 6, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 6, scale: 0.97 }}
                transition={{ duration: 0.15 }}
                className="absolute right-0 top-[calc(100%+8px)] w-[210px] bg-white rounded-2xl border border-[#E8EDF5] shadow-[0_8px_32px_rgba(0,0,0,0.1)] z-50 py-1.5 overflow-hidden"
              >
                <div className="px-4 py-2.5 border-b border-[#F1F5F9] mb-1">
                  <p className="text-[12.5px] font-bold text-[#0F172A] truncate">{user?.name || 'Super Admin'}</p>
                  <p className="text-[11px] text-[#94A3B8] truncate">{user?.email || 'admin@bhumicred.com'}</p>
                </div>
                {[
                  { icon: User,       label: 'My Profile',  fn: () => navigate('/users')    },
                  { icon: Settings,   label: 'Settings',    fn: () => navigate('/settings') },
                  { icon: HelpCircle, label: 'Help Center', fn: () => navigate('/support')  },
                ].map(m => (
                  <button
                    key={m.label}
                    onClick={() => { m.fn(); setShowProfile(false); }}
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

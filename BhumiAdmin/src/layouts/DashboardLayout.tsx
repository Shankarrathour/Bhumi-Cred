import React, { useState, useEffect } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAdminStore, useAuthStore, useEcosystemStore } from '../store';
import { useAdminNotificationStore } from '../store/notificationStore';
import { NAVIGATION_ITEMS } from '../constants/navigation';
import { RoleSwitcher } from '../components/RoleSwitcher';
import { GlobalContextBar } from '../components/GlobalContextBar';
import { 
  Menu, 
  X, 
  LogOut, 
  Bell, 
  ChevronRight,
  User2,
  ArrowLeftRight,
  Sun,
  Moon,
  ShieldCheck,
  Leaf,
  ChevronDown
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/utils/cn';
import { BhumiLogo } from '../components/BhumiLogo';

export const DashboardLayout: React.FC = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    return localStorage.getItem('theme') === 'dark';
  });
  
  const { user, logout } = useAuthStore();
  const { activeRole } = useAdminStore();
  const { fetchLocationTree, fetchVendors, fetchLands } = useEcosystemStore();
  const { unreadCount, fetchUnreadCount } = useAdminNotificationStore();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);

  useEffect(() => {
    fetchLocationTree();
    fetchVendors();
    fetchLands();
  }, []);

  useEffect(() => {
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 60000);
    return () => clearInterval(interval);
  }, [fetchUnreadCount]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const filteredNavItems = NAVIGATION_ITEMS.filter(
    item => !item.roles || (activeRole && item.roles.includes(activeRole))
  );

  const activeItem = NAVIGATION_ITEMS.find(
    item => item.path === location.pathname || (item.path !== '/admin/dashboard' && location.pathname.startsWith(item.path))
  ) || NAVIGATION_ITEMS[0];

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  return (
    <div className={cn(
      "min-h-screen flex text-foreground overflow-hidden selection:bg-primary/20 transition-colors duration-200 font-sans bg-background",
      isDarkMode ? "dark" : ""
    )}>
      
      {/* ── Desktop Sidebar ── */}
      <motion.aside 
        animate={{ width: isSidebarOpen ? 240 : 64 }}
        transition={{ duration: 0.2, ease: "easeOut" }}
        className="hidden md:flex flex-col h-screen bg-card border-r border-border sticky top-0 left-0 z-20 flex-shrink-0"
      >
        {/* Brand */}
        <div className="h-[72px] flex items-center px-4 border-b border-border overflow-hidden whitespace-nowrap flex-shrink-0">
          <Link to="/admin/dashboard" className="flex items-center active:scale-95 transition-transform">
            <BhumiLogo isCollapsed={!isSidebarOpen} size="md" />
          </Link>
        </div>

        {/* Nav */}
        <nav className="flex-1 py-3 overflow-y-auto px-2 space-y-0.5 custom-scrollbar">
          {filteredNavItems.map((item) => {
            const isActive = location.pathname === item.path || (item.path !== '/admin/dashboard' && location.pathname.startsWith(item.path));
            const Icon = item.icon;
            return (
              <Link
                key={item.path}
                to={item.path}
                title={!isSidebarOpen ? item.title : undefined}
                className={cn(
                  "group flex items-center h-9 rounded-lg transition-all duration-150 select-none relative",
                  isSidebarOpen ? "px-3 gap-3" : "justify-center px-0",
                  isActive
                    ? "bg-primary/10 text-primary font-semibold"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                )}
              >
                {isActive && (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-primary rounded-r-full" />
                )}
                <Icon className={cn(
                  "w-4 h-4 flex-shrink-0 transition-colors",
                  isActive ? "text-primary" : "text-muted-foreground/70 group-hover:text-muted-foreground"
                )} />
                {isSidebarOpen && (
                  <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-[13px] truncate">
                    {item.title}
                  </motion.span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Collapse */}
        <div className="p-3 border-t border-border flex-shrink-0">
          <button
            onClick={toggleSidebar}
            className={cn(
              "w-full flex items-center h-8 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors px-2",
              isSidebarOpen ? "gap-2" : "justify-center"
            )}
          >
            <ArrowLeftRight className="w-3.5 h-3.5 flex-shrink-0" />
            {isSidebarOpen && <span className="text-[13px] font-medium">Collapse Menu</span>}
          </button>
        </div>
      </motion.aside>

      {/* ── Mobile Drawer ── */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 0.4 }} exit={{ opacity: 0 }}
              onClick={() => setIsMobileMenuOpen(false)}
              className="fixed inset-0 z-40 bg-black md:hidden"
            />
            <motion.aside
              initial={{ x: '-100%' }} animate={{ x: 0 }} exit={{ x: '-100%' }}
              transition={{ type: 'spring', bounce: 0, duration: 0.25 }}
              className="fixed inset-y-0 left-0 z-50 w-64 bg-card flex flex-col h-full shadow-xl md:hidden border-r border-border"
            >
              <div className="h-[72px] flex items-center justify-between px-4 border-b border-border">
                <BhumiLogo size="sm" showSubtitle={false} />
                <button onClick={() => setIsMobileMenuOpen(false)} className="w-8 h-8 flex items-center justify-center border border-[#E2E8F0] bg-white rounded-xl shadow-xs text-muted-foreground hover:bg-muted">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <nav className="flex-1 py-3 px-2 space-y-0.5 overflow-y-auto">
                {filteredNavItems.map((item) => {
                  const isActive = location.pathname === item.path || (item.path !== '/admin/dashboard' && location.pathname.startsWith(item.path));
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={cn(
                        "flex items-center h-9 px-3 gap-3 rounded-lg transition-colors",
                        isActive ? "bg-primary/10 text-primary font-semibold" : "text-muted-foreground hover:bg-muted hover:text-foreground"
                      )}
                    >
                      <Icon className="w-4 h-4 flex-shrink-0" />
                      <span className="text-[13px]">{item.title}</span>
                    </Link>
                  );
                })}
              </nav>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* ── Main ── */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden bg-background relative">
        
        {/* ── Header 72px ── */}
        <header className="h-[72px] bg-card border-b border-border sticky top-0 z-30 flex items-center justify-between px-4 md:px-6 flex-shrink-0">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setIsMobileMenuOpen(true)}
              className="p-1.5 md:hidden hover:bg-muted rounded-lg text-muted-foreground"
            >
              <Menu className="w-4 h-4" />
            </button>
            <div className="flex items-center text-[13px] text-muted-foreground select-none">
              <span className="hover:text-primary transition-colors cursor-pointer">BhumiCred Network</span>
              <ChevronRight className="w-3.5 h-3.5 mx-1.5 opacity-40" />
              <span className="text-foreground font-semibold">{activeItem.title}</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Role Badge */}
            <div className="hidden sm:inline-flex items-center h-7 bg-primary/10 text-primary border border-primary/20 rounded-lg px-2.5 gap-1.5 text-[12px] font-medium select-none">
              <ShieldCheck className="w-3.5 h-3.5" />
              {activeRole.replace(/_/g, ' ').toUpperCase()}
            </div>

            {/* Theme Toggle */}
            <button 
              onClick={() => setIsDarkMode(prev => !prev)}
              className="w-8 h-8 border border-border rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-all flex items-center justify-center"
            >
              {!isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            {/* Notifications */}
            <button
              onClick={() => navigate('/admin/notifications')}
              className="relative w-8 h-8 border border-border rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-all flex items-center justify-center"
            >
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 flex items-center justify-center bg-destructive text-[10px] font-bold text-white rounded-full leading-none">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            <div className="w-px h-5 bg-border hidden md:block" />

            {/* Profile */}
            <div className="relative">
              <button
                onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                className="flex items-center gap-2 px-2 py-1.5 border border-border rounded-lg hover:bg-muted/50 transition-colors select-none"
              >
                {user?.avatarUrl ? (
                  <img src={user.avatarUrl} alt={user.name} className="w-7 h-7 object-cover rounded-full border border-border" />
                ) : (
                  <div className="w-7 h-7 bg-primary/10 rounded-full flex items-center justify-center text-primary">
                    <User2 className="w-3.5 h-3.5" />
                  </div>
                )}
                <div className="hidden md:flex flex-col text-left leading-none select-none">
                  <span className="text-[13px] font-semibold text-foreground">{user?.name}</span>
                  <span className="text-[11px] text-muted-foreground mt-0.5">{user?.email}</span>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-muted-foreground hidden md:block" />
              </button>

              <AnimatePresence>
                {isProfileMenuOpen && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setIsProfileMenuOpen(false)} />
                    <motion.div
                      initial={{ opacity: 0, y: 4, scale: 0.97 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 4, scale: 0.97 }}
                      transition={{ duration: 0.12 }}
                      className="absolute right-0 mt-2 w-52 z-20 bg-card border border-border rounded-xl shadow-lg py-1"
                    >
                      <div className="px-3 py-2.5 border-b border-border md:hidden">
                        <p className="text-[13px] font-semibold text-foreground truncate">{user?.name}</p>
                        <p className="text-[12px] text-muted-foreground truncate mt-0.5">{user?.email}</p>
                      </div>
                      <div className="p-1">
                        <button
                          onClick={handleLogout}
                          className="w-full flex items-center gap-2 px-2.5 py-2 text-[13px] text-destructive hover:bg-destructive/10 font-medium rounded-lg transition-colors text-left"
                        >
                          <LogOut className="w-3.5 h-3.5" />
                          <span>Sign Out</span>
                        </button>
                      </div>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
          </div>
        </header>

        <GlobalContextBar />

        <main className="flex-1 flex flex-col overflow-y-auto p-4 md:p-6 bg-background custom-scrollbar">
          <div className="flex-1 w-full max-w-7xl mx-auto flex flex-col">
            <Outlet />
          </div>
        </main>
      </div>

      <RoleSwitcher />
    </div>
  );
};

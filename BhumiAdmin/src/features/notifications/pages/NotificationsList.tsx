import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bell, AlertTriangle, Info, CheckCircle2, ShieldAlert, Filter,
  CheckCheck, Trash2, ArrowRight, RefreshCw, Layers, Shield, CloudRain
} from 'lucide-react';
import { PageHeader } from '../../../components/ui/PageHeader';
import { FilterBar } from '../../../components/ui/FilterBar';
import { KpiCard } from '../../../components/ui/KpiCard';
import { StatusBadge } from '../../../components/ui/StatusBadge';
import { EmptyState, SkeletonTable } from '../../../components/ui/EmptyState';
import { useNotifications, NotificationItem, INITIAL_NOTIFICATIONS } from '../api/useNotifications';
import toast from 'react-hot-toast';

export const NotificationsList = () => {
  const navigate = useNavigate();
  const { data: apiNotifications, isLoading, refetch, isFetching } = useNotifications();

  // Local state to allow instant mark-as-read / clear actions
  const [localItems, setLocalItems] = useState<NotificationItem[] | null>(null);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');

  const items = useMemo(() => {
    return localItems !== null ? localItems : (apiNotifications || INITIAL_NOTIFICATIONS);
  }, [localItems, apiNotifications]);

  const filtered = useMemo(() => {
    return items.filter(n => {
      const q = search.toLowerCase();
      const matchSearch = !q || [n.title, n.message, n.category, n.id].some(v => v?.toLowerCase().includes(q));
      const matchType = !typeFilter || n.type === typeFilter;
      const matchCat = !categoryFilter || n.category === categoryFilter;
      return matchSearch && matchType && matchCat;
    });
  }, [items, search, typeFilter, categoryFilter]);

  const unreadCount = items.filter(n => !n.is_read).length;
  const criticalCount = items.filter(n => n.type === 'critical').length;
  const warningCount = items.filter(n => n.type === 'warning').length;

  const handleMarkAllRead = () => {
    setLocalItems(items.map(n => ({ ...n, is_read: true })));
    toast.success('All notifications marked as read');
  };

  const handleToggleRead = (id: string) => {
    setLocalItems(items.map(n => n.id === id ? { ...n, is_read: !n.is_read } : n));
  };

  const handleClearAll = () => {
    setLocalItems([]);
    toast.success('Notifications cleared');
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'critical': return <ShieldAlert size={16} className="text-[#EF4444]" />;
      case 'warning':  return <AlertTriangle size={16} className="text-[#F59E0B]" />;
      case 'success':  return <CheckCircle2 size={16} className="text-[#16A34A]" />;
      default:         return <Info size={16} className="text-[#2563EB]" />;
    }
  };

  const getBadgeVariant = (type: string) => {
    switch (type) {
      case 'critical': return 'danger';
      case 'warning':  return 'warning';
      case 'success':  return 'success';
      default:         return 'info';
    }
  };

  return (
    <div className="space-y-5 page-enter">
      <PageHeader
        title="Notifications & Alerts"
        description="Real-time system telemetry alerts, MRV verification flags, and operational broadcasts."
        badge={{ label: `${unreadCount} Unread`, variant: unreadCount > 0 ? 'warning' : 'success' }}
        icon={Bell}
        actions={
          <>
            <button onClick={() => refetch()} className="btn btn-secondary btn-sm">
              <RefreshCw size={13} className={isFetching ? 'animate-spin' : ''} />
            </button>
            {unreadCount > 0 && (
              <button onClick={handleMarkAllRead} className="btn btn-secondary btn-sm gap-1.5">
                <CheckCheck size={14} /> Mark all read
              </button>
            )}
            {items.length > 0 && (
              <button onClick={handleClearAll} className="btn btn-ghost btn-sm text-[#EF4444] hover:bg-[#FEF2F2]">
                <Trash2 size={13} /> Clear all
              </button>
            )}
          </>
        }
      />

      {/* KPI Cards Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KpiCard title="Total Notifications" value={items.length} icon={Bell} iconBg="#EFF6FF" iconColor="#2563EB" loading={isLoading} />
        <KpiCard title="Unread Alerts" value={unreadCount} icon={CheckCheck} iconBg="#FFFBEB" iconColor="#F59E0B" loading={isLoading} />
        <KpiCard title="Critical System Flags" value={criticalCount} icon={ShieldAlert} iconBg="#FEF2F2" iconColor="#EF4444" loading={isLoading} />
        <KpiCard title="Warning Alerts" value={warningCount} icon={AlertTriangle} iconBg="#F5F3FF" iconColor="#8B5CF6" loading={isLoading} />
      </div>

      {/* Filter Bar & Feed Container */}
      <div className="ent-card overflow-hidden">
        <div className="p-4 border-b border-[#F1F5F9]">
          <FilterBar
            search={search} onSearchChange={setSearch}
            searchPlaceholder="Search notifications by title, category..."
            filters={[
              {
                key: 'type', label: 'Alert Priority', value: typeFilter, onChange: setTypeFilter,
                options: [
                  { label: 'Critical', value: 'critical' },
                  { label: 'Warning',  value: 'warning'  },
                  { label: 'Success',  value: 'success'  },
                  { label: 'Info',     value: 'info'     },
                ],
              },
              {
                key: 'category', label: 'Category', value: categoryFilter, onChange: setCategoryFilter,
                options: [
                  { label: 'Weather',  value: 'Weather'  },
                  { label: 'MRV',      value: 'MRV'      },
                  { label: 'Payments', value: 'Payments' },
                  { label: 'Security', value: 'Security' },
                  { label: 'System',   value: 'System'   },
                ],
              },
            ]}
            onRefresh={() => refetch()}
            loading={isFetching}
            resultCount={filtered.length}
          />
        </div>

        {/* Notifications Timeline Feed */}
        <div className="divide-y divide-[#F1F5F9]">
          {isLoading ? (
            <SkeletonTable rows={5} cols={4} />
          ) : filtered.length === 0 ? (
            <EmptyState
              icon={Bell}
              title="No notifications found"
              description="You're all caught up! No notifications match your current filters."
            />
          ) : (
            filtered.map((item, i) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
                className={`p-4 flex items-start gap-4 transition-colors ${!item.is_read ? 'bg-[#FAFCFF]' : 'hover:bg-[#F8FAFC]'}`}
              >
                {/* Icon box */}
                <div className={`shrink-0 w-9 h-9 rounded-[10px] flex items-center justify-center ${
                  item.type === 'critical' ? 'bg-[#FEF2F2]' :
                  item.type === 'warning'  ? 'bg-[#FFFBEB]' :
                  item.type === 'success'  ? 'bg-[#F0FDF4]' : 'bg-[#EFF6FF]'
                }`}>
                  {getIcon(item.type)}
                </div>

                {/* Body */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="text-[13.5px] font-600 text-[#0F172A]" style={{ fontWeight: 600 }}>
                      {item.title}
                    </span>
                    <StatusBadge label={item.type.toUpperCase()} variant={getBadgeVariant(item.type) as any} size="sm" />
                    <span className="text-[11px] font-mono text-[#94A3B8] bg-[#F1F5F9] px-2 py-0.5 rounded-[4px]">
                      {item.category}
                    </span>
                  </div>

                  <p className="text-[13px] text-[#64748B] leading-relaxed mb-2">
                    {item.message}
                  </p>

                  <div className="flex items-center gap-3 text-[11.5px] text-[#94A3B8]">
                    <span>{new Date(item.created_at).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}</span>
                    {item.action_url && (
                      <button
                        onClick={() => navigate(item.action_url!)}
                        className="text-[#16A34A] font-500 hover:underline flex items-center gap-1"
                      >
                        View Module <ArrowRight size={11} />
                      </button>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="shrink-0 flex items-center gap-2">
                  <button
                    onClick={() => handleToggleRead(item.id)}
                    className="btn btn-ghost btn-icon btn-sm"
                    title={item.is_read ? 'Mark as unread' : 'Mark as read'}
                  >
                    <CheckCheck size={14} className={item.is_read ? 'text-[#94A3B8]' : 'text-[#16A34A]'} />
                  </button>
                </div>
              </motion.div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

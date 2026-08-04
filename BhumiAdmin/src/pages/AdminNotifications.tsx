import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bell,
  UserPlus,
  ClipboardCheck,
  Globe,
  FileText,
  TreePine,
  Leaf,
  Coins,
  ArrowDownRight,
  ShoppingBag,
  PackagePlus,
  PackageCheck,
  MessageSquare,
  Users,
  Store,
  BellOff,
} from 'lucide-react';
import { useAdminNotificationStore, AdminNotification } from '../store/notificationStore';
import { cn } from '../utils/cn';

const TYPE_ICON: Record<string, any> = {
  registration: UserPlus,
  profile: ClipboardCheck,
  land: Globe,
  land_document: FileText,
  tree: TreePine,
  project: Leaf,
  credit_sale: Coins,
  withdrawal: ArrowDownRight,
  purchase: ShoppingBag,
  product_added: PackagePlus,
  product_updated: PackageCheck,
  support: MessageSquare,
  system: Bell,
};

const getIcon = (type: string) => TYPE_ICON[type] || Bell;

function formatTimestamp(raw: string): string {
  const d = new Date(raw);
  if (isNaN(d.getTime())) return raw;
  return d.toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export const AdminNotifications: React.FC = () => {
  const { notifications, isLoading, fetchNotifications, markAsRead } = useAdminNotificationStore();

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const handlePress = (n: AdminNotification) => {
    if (!n.isRead) markAsRead(n.id);
  };

  return (
    <div className="space-y-5 pb-10 font-mono text-xs text-foreground select-none">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-border pb-4">
        <div>
          <h1 className="text-lg font-black uppercase tracking-wider leading-none flex items-center gap-2">
            <Bell className="h-5 w-5 text-primary" /> Admin Notification Center
          </h1>
          <p className="text-muted-foreground text-[8.5px] uppercase tracking-widest mt-2">
            Live feed of important Farmer and Vendor activity across the BhumiCred platform.
          </p>
        </div>

        <div className="flex bg-card p-1 border shrink-0">
          <span className="px-3 py-1.5 text-[8px] font-black uppercase tracking-widest text-primary">
            Unread ({unreadCount})
          </span>
        </div>
      </div>

      {/* Feed */}
      <div className="bg-card border overflow-hidden shadow-sm min-h-[440px] flex flex-col">
        <div className="p-3 border-b bg-muted/10 flex justify-between items-center gap-4">
          <h3 className="text-[9px] font-black uppercase tracking-widest text-primary">Activity Feed</h3>
        </div>

        <div className="flex-1 overflow-y-auto divide-y divide-border/50 scrollbar-thin scroll-smooth max-h-[70vh]">
          {isLoading ? (
            <div className="p-4 space-y-3">
              {[0, 1, 2, 3, 4].map((i) => (
                <div key={i} className="flex items-center gap-3 animate-pulse">
                  <div className="w-9 h-9 bg-muted/40 border border-border shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="h-2.5 w-1/3 bg-muted/40" />
                    <div className="h-2 w-2/3 bg-muted/30" />
                  </div>
                </div>
              ))}
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center py-20 text-center opacity-70">
              <BellOff className="h-9 w-9 text-primary/30 mb-3" />
              <p className="text-[9px] font-extrabold text-muted-foreground uppercase tracking-widest leading-relaxed max-w-[220px]">
                No notifications yet. Farmer and Vendor activity will appear here as it happens.
              </p>
            </div>
          ) : (
            <AnimatePresence initial={false}>
              {notifications.map((n) => {
                const Icon = getIcon(n.type);
                const ActorIcon = n.actorType === 'vendor' ? Store : Users;
                return (
                  <motion.div
                    key={n.id}
                    layout
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    onClick={() => handlePress(n)}
                    className={cn(
                      'p-4 flex items-start gap-3 cursor-pointer transition-all border-l-2',
                      !n.isRead ? 'border-l-primary bg-primary/5 hover:bg-primary/10' : 'border-l-transparent hover:bg-muted/30'
                    )}
                  >
                    <div className="w-9 h-9 flex items-center justify-center bg-primary/10 border border-primary/20 shrink-0">
                      <Icon className="h-4 w-4 text-primary" />
                    </div>

                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="text-[10px] font-black text-foreground uppercase tracking-wider">{n.title}</h4>
                        {n.actorType && (
                          <span
                            className={cn(
                              'inline-flex items-center gap-1 text-[7px] font-black uppercase px-1.5 py-0.5 border',
                              n.actorType === 'vendor'
                                ? 'bg-accent/5 border-accent/20 text-accent'
                                : 'bg-primary/5 border-primary/20 text-primary'
                            )}
                          >
                            <ActorIcon className="h-2.5 w-2.5" />
                            {n.actorType}
                          </span>
                        )}
                        {!n.isRead && <span className="w-1.5 h-1.5 rounded-full bg-primary shadow-[0_0_6px_rgba(0,255,135,0.8)]" />}
                      </div>
                      <p className="text-[9.5px] text-muted-foreground font-bold normal-case leading-relaxed">{n.message}</p>
                      <p className="text-[7.5px] text-muted-foreground/70 font-bold uppercase tracking-wider">
                        {formatTimestamp(n.createdAt)}
                      </p>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          )}
        </div>
      </div>
    </div>
  );
};

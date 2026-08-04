import React, { useState } from 'react';
import { useAdminStore } from '../store';
import { UserRole } from '../types';
import { 
  Users, ChevronUp, ShieldAlert, BadgeCent, 
  Tractor, TreePine, Users2, HelpCircle, Minimize2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/utils/cn';

const ROLES: { role: UserRole; label: string; icon: any }[] = [
  { role: 'super_admin',            label: 'Super Admin',       icon: ShieldAlert },
  { role: 'operations_admin',       label: 'Operations Admin',  icon: Tractor     },
  { role: 'finance_manager',        label: 'Finance Manager',   icon: BadgeCent   },
  { role: 'vendor_manager',         label: 'Vendor Manager',    icon: Users       },
  { role: 'carbon_project_manager', label: 'Carbon Manager',    icon: TreePine    },
  { role: 'employee_manager',       label: 'Employee Manager',  icon: Users2      },
  { role: 'support_manager',        label: 'Support Manager',   icon: HelpCircle  },
];

export const RoleSwitcher: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const { activeRole, setActiveRole } = useAdminStore();

  const handleRoleSwitch = (role: UserRole) => {
    setActiveRole(role);
    setIsOpen(false);
  };

  const activeRoleData = ROLES.find(r => r.role === activeRole) || ROLES[0];
  const ActiveIcon = activeRoleData.icon;

  if (isMinimized) {
    return (
      <div className="fixed bottom-4 right-4 z-50 select-none">
        <button
          onClick={() => setIsMinimized(false)}
          className="w-10 h-10 rounded-full bg-primary text-primary-foreground shadow-lg hover:scale-105 active:scale-95 transition-all flex items-center justify-center cursor-pointer border border-primary/30"
          title={`Active Role: ${activeRoleData.label} (Click to expand)`}
          style={{ boxShadow: '0 4px 16px rgba(16,185,129,0.35)' }}
        >
          <ActiveIcon className="w-5 h-5" />
        </button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end select-none">

      {/* ── Role Panel ── */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.97 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className="mb-2 w-[240px] bg-card border border-border rounded-2xl overflow-hidden shadow-xl"
          >
            {/* Header */}
            <div className="px-3.5 py-2.5 border-b border-border flex items-center justify-between">
              <span className="text-[11px] font-bold tracking-widest text-primary uppercase">
                Select Active Role
              </span>
              <button
                onClick={() => setIsMinimized(true)}
                className="text-muted-foreground hover:text-foreground p-0.5 rounded-md hover:bg-muted transition-colors"
                title="Minimize Switcher"
              >
                <Minimize2 className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Role list */}
            <div className="p-1.5 space-y-0.5">
              {ROLES.map(({ role, label, icon: Icon }) => {
                const isActive = activeRole === role;
                return (
                  <button
                    key={role}
                    onClick={() => handleRoleSwitch(role)}
                    className={cn(
                      "w-full flex items-center gap-2.5 px-3 py-2 rounded-[10px] text-[13px] font-medium transition-all text-left cursor-pointer",
                      isActive
                        ? "bg-primary text-primary-foreground shadow-sm"
                        : "text-foreground hover:bg-muted"
                    )}
                  >
                    <Icon className={cn("w-4 h-4 flex-shrink-0", isActive ? "text-primary-foreground" : "text-muted-foreground")} />
                    <span className="uppercase tracking-wide text-[12px]">{label}</span>
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Trigger Button ── */}
      <div className="flex items-center gap-1.5 bg-primary text-primary-foreground rounded-[14px] p-1 shadow-lg transition-all duration-200" style={{ boxShadow: '0 4px 16px rgba(16,185,129,0.35)' }}>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2.5 px-3 py-1.5 hover:bg-primary-foreground/10 rounded-[10px] transition-all cursor-pointer"
        >
          <ActiveIcon className="w-4 h-4 flex-shrink-0" />
          <div className="text-left">
            <div className="text-[9px] opacity-75 font-semibold uppercase tracking-widest leading-none">
              Operator View
            </div>
            <div className="text-[12px] font-bold uppercase tracking-wide leading-tight mt-0.5">
              {activeRoleData.label}
            </div>
          </div>
          <ChevronUp className={cn("w-3.5 h-3.5 flex-shrink-0 transition-transform duration-250", isOpen && "rotate-180")} />
        </button>

        {/* Minimize Button */}
        <button
          onClick={() => setIsMinimized(true)}
          className="p-2 hover:bg-primary-foreground/20 rounded-[10px] text-primary-foreground/80 hover:text-primary-foreground transition-all cursor-pointer"
          title="Minimize button"
        >
          <Minimize2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};

export type { UserRole };

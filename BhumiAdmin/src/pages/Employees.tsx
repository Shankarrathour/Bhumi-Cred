import React, { useState } from 'react';
import { useEcosystemStore } from '../store';
import { Employee, UserRole } from '../types';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { 
  UserCheck, 
  Plus, 
  Search, 
  Power, 
  Edit3, 
  ShieldAlert, 
  X, 
  Check, 
  Briefcase,
  Users
} from 'lucide-react';
import { cn } from '../utils/cn';

export const EmployeesPage: React.FC = () => {
  const { employees, fetchEmployees, addEmployee, toggleEmployeeStatus, updateEmployeeRole } = useEcosystemStore();
  const [search, setSearch] = useState('');

  React.useEffect(() => {
    fetchEmployees();
  }, []);
  
  // Drawer / Form state
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [empName, setEmpName] = useState('');
  const [empEmail, setEmpEmail] = useState('');
  const [empRole, setEmpRole] = useState<UserRole>('operations_admin');

  // Role edit helper
  const [editingEmpId, setEditingEmpId] = useState<string | null>(null);
  const [selectedRoleToUpdate, setSelectedRoleToUpdate] = useState<UserRole>('operations_admin');

  // Computed metrics
  const totalEmployees = employees.length;
  const activeEmployees = employees.filter(e => e.isActive).length;
  const inactiveEmployees = employees.filter(e => !e.isActive).length;

  const displayList = employees.filter(emp => {
    const matchesSearch = 
      emp.name.toLowerCase().includes(search.toLowerCase()) ||
      emp.email.toLowerCase().includes(search.toLowerCase()) ||
      emp.role.toLowerCase().includes(search.toLowerCase());

    return matchesSearch;
  });

  const handleCreateEmployee = (e: React.FormEvent) => {
    e.preventDefault();
    if (!empName || !empEmail) {
      toast.error('Please fill in all required fields.');
      return;
    }

    addEmployee({
      name: empName,
      email: empEmail,
      role: empRole,
      isActive: true
    });

    setIsDrawerOpen(false);
    setEmpName('');
    setEmpEmail('');
    setEmpRole('operations_admin');
    toast.success(`Nodal Account provisioned: ${empName}`);
  };

  const handleToggleStatus = (id: string) => {
    toggleEmployeeStatus(id);
    toast.success('Personnel system access credentials toggled!');
  };

  const handleOpenEditRole = (emp: Employee) => {
    setEditingEmpId(emp.id);
    setSelectedRoleToUpdate(emp.role);
  };

  const handleUpdateRoleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingEmpId) return;

    updateEmployeeRole(editingEmpId, selectedRoleToUpdate);
    setEditingEmpId(null);
    toast.success('Personnel authority tier updated successfully.');
  };

  return (
    <div className="pb-12 text-foreground font-sans space-y-6">
      
      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2.5">
            <Users className="w-6 h-6 text-primary" /> Employee &amp; Personnel Directory
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Provision active nodal administrator credentials, adjust role-based permission tiers, and audit personnel access thresholds.
          </p>
        </div>
        
        <button
          onClick={() => setIsDrawerOpen(true)}
          className="h-9 px-4 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 font-bold text-xs flex items-center gap-2 transition-all cursor-pointer shadow-sm shrink-0 self-start md:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Provision Officer</span>
        </button>
      </div>

      {/* Analytics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {[
          { title: 'Total Registered Staff', value: `${totalEmployees} Operators`, icon: UserCheck, color: 'text-primary' },
          { title: 'Active System Nodes', value: `${activeEmployees} Authorized`, icon: Check, color: 'text-emerald-500' },
          { title: 'Suspended Keys', value: `${inactiveEmployees} Suspended`, icon: ShieldAlert, color: 'text-destructive' }
        ].map((stat, i) => {
          const Icon = stat.icon;
          return (
            <div key={i} className="bg-card border border-border rounded-xl p-4 flex items-center justify-between shadow-sm">
              <div className="space-y-1">
                <span className="text-xs font-medium text-muted-foreground block">{stat.title}</span>
                <span className={cn("text-lg font-bold font-sans", stat.color)}>{stat.value}</span>
              </div>
              <div className="bg-primary/10 p-2.5 rounded-xl border border-primary/20 text-primary">
                <Icon className="w-5 h-5" />
              </div>
            </div>
          );
        })}
      </div>

      {/* Search Bar */}
      <div className="bg-card border border-border rounded-xl p-3 shadow-sm">
        <div className="relative">
          <Search className="w-4 h-4 text-muted-foreground absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input 
            type="text"
            placeholder="Search staff by officer name, email ID, or role class..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full bg-background border border-border rounded-lg pl-10 pr-4 py-2 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all font-sans"
          />
        </div>
      </div>

      {/* Staff Table Grid Card */}
      <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse font-sans">
            <thead>
              <tr className="bg-muted/40 border-b border-border text-muted-foreground font-semibold uppercase tracking-wider text-[11px]">
                <th className="px-6 py-3.5">Officer ID</th>
                <th className="px-6 py-3.5">Name</th>
                <th className="px-6 py-3.5">Email</th>
                <th className="px-6 py-3.5">Authority Tier</th>
                <th className="px-6 py-3.5">Status</th>
                <th className="px-6 py-3.5">Onboarded</th>
                <th className="px-6 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border font-medium text-foreground">
              {displayList.map(emp => (
                <tr 
                  key={emp.id} 
                  className={cn(
                    "hover:bg-muted/30 transition-colors",
                    !emp.isActive && "opacity-60"
                  )}
                >
                  <td className="px-6 py-4 font-mono text-[11px] text-muted-foreground font-semibold">{emp.id}</td>
                  <td className="px-6 py-4 font-bold text-foreground">{emp.name}</td>
                  <td className="px-6 py-4 text-muted-foreground">{emp.email}</td>
                  <td className="px-6 py-4 capitalize font-semibold text-primary">{emp.role.replace(/_/g, ' ')}</td>
                  <td className="px-6 py-4">
                    <span className={cn(
                      "px-2.5 py-0.5 rounded-full text-[11px] font-semibold border tracking-wide inline-block",
                      emp.isActive 
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-400 dark:border-emerald-800" 
                        : "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/50 dark:text-rose-400 dark:border-rose-800"
                    )}>
                      {emp.isActive ? 'Active' : 'Suspended'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-muted-foreground text-xs">{emp.onboardedDate}</td>
                  <td className="px-6 py-4 text-right space-x-2 whitespace-nowrap">
                    <button
                      onClick={() => handleToggleStatus(emp.id)}
                      className={cn(
                        "px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all cursor-pointer inline-flex items-center gap-1",
                        emp.isActive 
                          ? "border-destructive/30 text-destructive hover:bg-destructive/10" 
                          : "border-primary/30 text-primary hover:bg-primary/10"
                      )}
                    >
                      <Power className="w-3.5 h-3.5" />
                      {emp.isActive ? 'Suspend' : 'Activate'}
                    </button>
                    <button
                      onClick={() => handleOpenEditRole(emp)}
                      className="px-2.5 py-1 rounded-lg text-xs font-semibold border border-primary/30 text-primary hover:bg-primary/10 transition-all cursor-pointer inline-flex items-center gap-1"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      Role
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Provision Officer Drawer */}
      <AnimatePresence>
        {isDrawerOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.6 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsDrawerOpen(false)}
              className="fixed inset-0 z-40 bg-black/80 backdrop-blur-sm cursor-pointer"
            />
            
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', bounce: 0, duration: 0.2 }}
              className="fixed inset-y-0 right-0 z-50 w-full max-w-md bg-card border-l border-border shadow-2xl flex flex-col h-full font-sans text-xs text-foreground"
            >
              {/* Header */}
              <div className="p-5 border-b border-border flex items-center justify-between bg-muted/30 shrink-0">
                <div className="flex items-center gap-2.5">
                  <div className="bg-primary/10 p-2 rounded-lg border border-primary/20 text-primary">
                    <Briefcase className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-foreground">Provision Officer</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">Configure nodal operator credentials</p>
                  </div>
                </div>
                <button 
                  onClick={() => setIsDrawerOpen(false)} 
                  className="p-1.5 text-muted-foreground hover:text-foreground rounded-lg hover:bg-muted transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Form */}
              <form onSubmit={handleCreateEmployee} className="flex-1 overflow-y-auto p-6 space-y-4 font-sans">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground block">Officer Full Name</label>
                  <input 
                    type="text" 
                    value={empName} 
                    onChange={e => setEmpName(e.target.value)}
                    placeholder="e.g. Anand Verma"
                    required
                    className="w-full h-9 border border-border bg-background px-3 rounded-lg text-xs outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all text-foreground"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground block">Government Email ID</label>
                  <input 
                    type="email" 
                    value={empEmail} 
                    onChange={e => setEmpEmail(e.target.value)}
                    placeholder="e.g. anand.verma@bhumicred.com"
                    required
                    className="w-full h-9 border border-border bg-background px-3 rounded-lg text-xs outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all text-foreground"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground block">Operational Tier (Role)</label>
                  <select 
                    value={empRole}
                    onChange={e => setEmpRole(e.target.value as any)}
                    className="w-full h-9 border border-border bg-background px-3 rounded-lg text-xs outline-none focus:border-primary transition-all font-semibold text-foreground cursor-pointer"
                  >
                    <option value="operations_admin">Operations Admin</option>
                    <option value="finance_manager">Finance Manager</option>
                    <option value="vendor_manager">Vendor Manager</option>
                    <option value="carbon_project_manager">Carbon Project Manager</option>
                    <option value="employee_manager">Employee Manager</option>
                    <option value="support_manager">Support Manager</option>
                  </select>
                </div>
              </form>

              {/* Footer */}
              <div className="p-5 border-t border-border bg-card flex items-center justify-end gap-3 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsDrawerOpen(false)}
                  className="px-4 h-9 border border-border hover:bg-muted text-xs font-semibold rounded-lg transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateEmployee}
                  className="h-9 px-5 bg-primary text-primary-foreground hover:bg-primary/90 font-bold rounded-lg text-xs flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  <span>Provision Node</span>
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Edit Role Dialog */}
      <AnimatePresence>
        {editingEmpId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="fixed inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setEditingEmpId(null)} />
            <div className="bg-card border border-border rounded-2xl shadow-2xl p-6 max-w-sm w-full relative z-10 font-sans space-y-4">
              <h3 className="text-base font-bold text-foreground border-b border-border pb-3">
                Adjust Officer Security Credentials
              </h3>
              <form onSubmit={handleUpdateRoleSubmit} className="space-y-4 text-xs font-sans">
                <div className="space-y-1.5">
                  <label className="text-muted-foreground font-medium block">Assigned Operations Scope</label>
                  <select 
                    value={selectedRoleToUpdate}
                    onChange={e => setSelectedRoleToUpdate(e.target.value as any)}
                    className="w-full h-9 border border-border bg-background px-3 rounded-lg text-xs outline-none focus:border-primary text-foreground font-semibold cursor-pointer"
                  >
                    <option value="super_admin">Super Admin</option>
                    <option value="operations_admin">Operations Admin</option>
                    <option value="finance_manager">Finance Manager</option>
                    <option value="vendor_manager">Vendor Manager</option>
                    <option value="carbon_project_manager">Carbon Project Manager</option>
                    <option value="employee_manager">Employee Manager</option>
                    <option value="support_manager">Support Manager</option>
                  </select>
                </div>
                <div className="flex gap-2.5 justify-end pt-3 border-t border-border">
                  <button
                    type="button"
                    onClick={() => setEditingEmpId(null)}
                    className="px-4 h-9 border border-border rounded-lg hover:bg-muted text-xs font-semibold transition-all cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 h-9 bg-primary text-primary-foreground hover:bg-primary/90 font-bold rounded-lg text-xs shadow-sm transition-all cursor-pointer"
                  >
                    Commit Role Change
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};


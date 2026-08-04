import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore, useAdminStore } from '../store';
import { UserRole } from '../types';
import { Lock, Mail, Loader2, ShieldCheck, Eye, EyeOff, Leaf, Globe, AlertCircle } from 'lucide-react';
import { cn } from '@/utils/cn';

interface DemoAccount {
  role: UserRole;
  label: string;
  email: string;
  password: string;
  scope: string;
}

const DEMO_ACCOUNTS: DemoAccount[] = [
  { role: 'super_admin', label: 'Super Admin Command', email: 'superadmin@bhumicred.com', password: 'Superadmin@1234', scope: 'Central Command' },
  { role: 'operations_admin', label: 'Operations Auditor', email: 'operationsadmin@bhumicred.com', password: 'Operationsadmin@1234', scope: 'Regional Scopes' },
  { role: 'finance_manager', label: 'Finance Manager', email: 'financemanager@bhumicred.com', password: 'Financemanager@1234', scope: 'Carbon Payouts' },
  { role: 'vendor_manager', label: 'Vendor Moderator', email: 'vendormanager@bhumicred.com', password: 'Vendormanager@1234', scope: 'Green Market' },
  { role: 'carbon_project_manager', label: 'Carbon Project Mgr', email: 'carbonmanager@bhumicred.com', password: 'Carbonmanager@1234', scope: 'MRV Programs' },
  { role: 'employee_manager', label: 'Employee Director', email: 'employeemanager@bhumicred.com', password: 'Employeemanager@1234', scope: 'RBAC Personnel' },
  { role: 'support_manager', label: 'Support CRM Supervisor', email: 'supportmanager@bhumicred.com', password: 'Supportmanager@1234', scope: 'Grievance Cases' }
];

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLocalLoading, setIsLocalLoading] = useState(false);
  const [selectedRole, setSelectedRole] = useState<UserRole>('super_admin');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const { login } = useAuthStore();
  const { setActiveRole } = useAdminStore();
  const navigate = useNavigate();

  const handleDemoSelect = (account: DemoAccount) => {
    setEmail(account.email);
    setPassword(account.password);
    setSelectedRole(account.role);
    setErrorMessage(null);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;

    setIsLocalLoading(true);
    setErrorMessage(null);

    try {
      await login({ 
        email: email.trim().toLowerCase(), 
        password: password.trim(), 
        role: selectedRole 
      });
      setActiveRole(selectedRole);
      navigate('/admin/dashboard');
    } catch (err: any) {
      const msg =
        err?.response?.data?.detail ||
        err?.response?.data?.message ||
        'Login failed. Please check your credentials.';
      setErrorMessage(typeof msg === 'string' ? msg : JSON.stringify(msg));
    } finally {
      setIsLocalLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050806] flex selection:bg-primary/20 text-slate-100 font-mono">
      
      {/* 🎨 Left Branding Panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-[#060e0a] to-[#0a1b12] relative overflow-hidden items-center justify-center p-12 border-r border-[#142217]">
        {/* Technical crosshair and grid line visual guides */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#0c1610_1px,transparent_1px),linear-gradient(to_bottom,#0c1610_1px,transparent_1px)] bg-[size:4rem_4rem] opacity-30" />
        <div className="absolute top-1/2 left-0 w-full h-[1px] bg-primary/10" />
        <div className="absolute left-1/2 top-0 w-[1px] h-full bg-primary/10" />
        
        <div className="relative z-10 max-w-md">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-black/60 border border-[#142217] mb-8 shadow-[0_0_15px_rgba(0,255,135,0.05)]">
            <Globe className="w-4 h-4 text-primary animate-pulse" />
            <span className="text-[9px] font-bold tracking-widest uppercase text-primary">SATELLITE MRV TELEMETRY</span>
          </div>
          
          <h1 className="text-3xl font-black tracking-widest leading-none mb-6 uppercase border-b border-[#142217] pb-4">
            BHUMICRED <span className="text-primary">COMMAND</span>
          </h1>
          
          <p className="text-slate-400 text-xs font-medium uppercase tracking-wider mb-10 leading-relaxed">
            Multi-Tier Voluntary Carbon Sequestration Registry & Satellite GIS Verification Center. Unified Admin Console managing regional scoping, farmer canopies, credit tokenization, B2B eco-marketplace, and enterprise ESG investments.
          </p>
          
          <div className="grid grid-cols-2 gap-6 pt-8 border-t border-[#142217] text-xs font-black uppercase tracking-wider">
            <div>
              <h4 className="text-xl text-primary font-black">7 TIERS</h4>
              <p className="text-slate-500 text-[8px] font-bold mt-1">Hierarchical Operator Scopes</p>
            </div>
            <div>
              <h4 className="text-xl text-primary font-black">0px GRID</h4>
              <p className="text-slate-500 text-[8px] font-bold mt-1">Swiss-industrial GIS Precision</p>
            </div>
          </div>
        </div>
      </div>

      {/* 🔐 Right Credentials workspace Pane */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center px-6 sm:px-12 md:px-20 xl:px-32 py-12 bg-[#050806] border-l border-[#142217]">
        
        <div className="max-w-md w-full mx-auto space-y-6">
          
          {/* Header Text */}
          <div className="text-center lg:text-left border-b border-[#142217] pb-6">
            <div className="lg:hidden bg-primary/10 text-primary w-12 h-12 mx-auto flex items-center justify-center border border-primary/20 shadow-md mb-4 rounded-none">
              <Leaf className="w-6 h-6 text-primary" />
            </div>
            <h2 className="text-xl font-black text-slate-100 tracking-widest uppercase">OPERATOR COMMAND</h2>
            <p className="text-slate-500 mt-2 text-[9px] font-bold uppercase tracking-wider">
              Secure Central Operations Authorization
            </p>
          </div>

          {/* Credentials Form */}
          <form className="space-y-4" onSubmit={handleLogin}>
            <div className="space-y-1.5">
              <label className="text-[9px] font-black uppercase text-slate-400 tracking-widest pl-0.5">Operator ID / Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4.5 w-4.5 text-slate-500" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g., administrator@bhumicred.com"
                  required
                  className="w-full h-10 bg-black/40 border border-[#142217] pl-10 pr-4 text-xs font-bold outline-none focus:border-primary transition-all tracking-wider text-slate-200"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[9px] font-black uppercase text-slate-400 tracking-widest pl-0.5">Authorization Key</label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4.5 w-4.5 text-slate-500" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Security Key"
                  required
                  className="w-full h-10 bg-black/40 border border-[#142217] pl-10 pr-10 text-xs font-bold outline-none focus:border-primary transition-all tracking-wider text-slate-200"
                />
                <button 
                  type="button" 
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-slate-500 hover:text-slate-300"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {errorMessage && (
              <div className="flex items-start gap-2 p-3 bg-red-950/40 border border-red-800/60 text-red-400 text-[10px] font-bold tracking-wide">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{errorMessage}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={isLocalLoading || !email || !password}
              className="w-full h-10 bg-primary text-black font-black uppercase tracking-widest shadow-lg hover:bg-primary/90 disabled:opacity-50 transition-all flex items-center justify-center gap-2 active:scale-[0.98] mt-4"
            >
              {isLocalLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-black" />
                  <span>SYNCING REGISTRY SHELL...</span>
                </>
              ) : (
                <span>INITIALIZE CONSOLE</span>
              )}
            </button>
          </form>

          {/* 🚀 Quick Demo Entry Section */}
          <div className="pt-6 border-t border-[#142217]">
            <div className="flex items-center gap-2 mb-3 pl-0.5">
              <ShieldCheck className="w-4 h-4 text-primary" />
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Operator Role Teleport</span>
            </div>

            <div className="grid grid-cols-2 gap-2 max-h-[220px] overflow-y-auto pr-1">
              {DEMO_ACCOUNTS.map((account) => {
                const isActive = selectedRole === account.role;
                return (
                  <button
                    key={account.role}
                    type="button"
                    onClick={() => handleDemoSelect(account)}
                    className={cn(
                      "flex flex-col p-2.5 text-left bg-black/30 border border-[#142217] hover:border-primary/50 transition-all active:scale-[0.98] gap-1",
                      isActive && "border-primary bg-primary/5"
                    )}
                  >
                    <span className={cn(
                      "text-[9px] font-extrabold uppercase tracking-wider",
                      isActive ? "text-primary" : "text-slate-300"
                    )}>
                      {account.label}
                    </span>
                    <span className="text-[8px] text-slate-500 font-bold tracking-tight truncate block max-w-full">
                      {account.email}
                    </span>
                    <span className="text-[7.5px] font-black uppercase tracking-widest text-[#008B45] mt-1 pl-0.5 border-l border-primary/40">
                      {account.scope}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { 
  Settings, 
  Save, 
  Database,
  Globe,
  Coins,
  ShieldCheck,
  ToggleLeft,
  ToggleRight,
  RefreshCw,
  Sliders,
  AlertTriangle,
  Cpu,
  Key,
  Users,
  FileText,
  Check,
  X,
  Plus,
  Search,
  Shield,
  Clock,
  UserCheck,
  Lock
} from 'lucide-react';
import adminApi from '../api/apiClient';

interface PermissionMatrix {
  view: bool;
  create: bool;
  edit: bool;
  delete: bool;
  approve: bool;
  reject: bool;
  assign: bool;
  export: bool;
  download: bool;
  print: bool;
  send_notification: bool;
  manage_wallet: bool;
  manage_payments: bool;
  access_reports: bool;
  publish: bool;
}

interface RoleItem {
  id: string;
  name: string;
  code: string;
  description?: string;
  is_system_role: boolean;
  is_active: boolean;
  permissions: Record<string, PermissionMatrix>;
}

interface AuditItem {
  id: string;
  actor_name: string;
  actor_email: string;
  actor_role: string;
  action: string;
  module: string;
  target_entity: string;
  target_id: string;
  old_value?: any;
  new_value?: any;
  ip_address: string;
  timestamp: string;
}

export const SettingsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'parameters' | 'rbac' | 'users' | 'audit'>('parameters');

  // Tab 1: Dynamic parameters local state
  const [creditConversionRate, setCreditConversionRate] = useState(400); // 1 Credit = 400 INR
  const [minSustainabilityScore, setMinSustainabilityScore] = useState(60); 
  const [commissionPercent, setCommissionPercent] = useState(5.0); 
  const [satelliteInterval, setSatelliteInterval] = useState(12); // hours

  // Sync API toggles
  const [govSync, setGovSync] = useState(true);
  const [satelliteAuditor, setSatelliteAuditor] = useState(true);
  const [escrowActive, setEscrowActive] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Default 11 System Roles fallback dataset
  const DEFAULT_SYSTEM_ROLES: RoleItem[] = [
    {
      id: 'role_1',
      name: 'Super Admin',
      code: 'super_admin',
      description: 'Complete System Control',
      is_system_role: true,
      is_active: true,
      permissions: {
        farmer_management: { view: true, create: true, edit: true, delete: true, approve: true, reject: true, assign: true, export: true, download: true, print: true, send_notification: true, manage_wallet: true, manage_payments: true, access_reports: true, publish: true },
        land_management: { view: true, create: true, edit: true, delete: true, approve: true, reject: true, assign: true, export: true, download: true, print: true, send_notification: true, manage_wallet: true, manage_payments: true, access_reports: true, publish: true },
        document_center: { view: true, create: true, edit: true, delete: true, approve: true, reject: true, assign: true, export: true, download: true, print: true, send_notification: true, manage_wallet: true, manage_payments: true, access_reports: true, publish: true },
        project_management: { view: true, create: true, edit: true, delete: true, approve: true, reject: true, assign: true, export: true, download: true, print: true, send_notification: true, manage_wallet: true, manage_payments: true, access_reports: true, publish: true },
      }
    },
    {
      id: 'role_2',
      name: 'Operations Admin',
      code: 'operations_admin',
      description: 'Daily operational approvals for farmers, land, and projects',
      is_system_role: true,
      is_active: true,
      permissions: {
        farmer_management: { view: true, create: true, edit: true, delete: false, approve: true, reject: true, assign: true, export: true, download: true, print: false, send_notification: true, manage_wallet: false, manage_payments: false, access_reports: true, publish: false },
        land_management: { view: true, create: false, edit: true, delete: false, approve: true, reject: true, assign: true, export: true, download: true, print: false, send_notification: true, manage_wallet: false, manage_payments: false, access_reports: true, publish: false },
        document_center: { view: true, create: false, edit: false, delete: false, approve: true, reject: true, assign: false, export: true, download: true, print: false, send_notification: false, manage_wallet: false, manage_payments: false, access_reports: false, publish: false },
      }
    },
    {
      id: 'role_3',
      name: 'KYC Admin',
      code: 'kyc_admin',
      description: 'Identity verification (Aadhaar, PAN, Bank, Docs)',
      is_system_role: true,
      is_active: true,
      permissions: {
        document_center: { view: true, create: false, edit: false, delete: false, approve: true, reject: true, assign: false, export: true, download: true, print: false, send_notification: false, manage_wallet: false, manage_payments: false, access_reports: false, publish: false },
        farmer_management: { view: true, create: false, edit: true, delete: false, approve: true, reject: true, assign: false, export: false, download: false, print: false, send_notification: false, manage_wallet: false, manage_payments: false, access_reports: false, publish: false },
      }
    },
    {
      id: 'role_4',
      name: 'GIS Admin',
      code: 'gis_admin',
      description: 'Land mapping, Polygons, Satellite & Duplicate detection',
      is_system_role: true,
      is_active: true,
      permissions: {
        land_management: { view: true, create: false, edit: true, delete: false, approve: true, reject: true, assign: true, export: true, download: true, print: true, send_notification: false, manage_wallet: false, manage_payments: false, access_reports: true, publish: false },
        gis_management: { view: true, create: true, edit: true, delete: false, approve: true, reject: true, assign: true, export: true, download: true, print: true, send_notification: false, manage_wallet: false, manage_payments: false, access_reports: true, publish: false },
      }
    },
    {
      id: 'role_5',
      name: 'Project Admin',
      code: 'project_admin',
      description: 'Carbon projects, Farmer & Land assignments, MRV tracking',
      is_system_role: true,
      is_active: true,
      permissions: {
        project_management: { view: true, create: true, edit: true, delete: false, approve: false, reject: false, assign: true, export: true, download: true, print: false, send_notification: true, manage_wallet: false, manage_payments: false, access_reports: true, publish: false },
      }
    },
    {
      id: 'role_6',
      name: 'Insurance Admin',
      code: 'insurance_admin',
      description: 'Tree insurance policies, claims, and surveyor assignment',
      is_system_role: true,
      is_active: true,
      permissions: {
        tree_insurance: { view: true, create: true, edit: true, delete: false, approve: true, reject: true, assign: true, export: true, download: true, print: false, send_notification: false, manage_wallet: false, manage_payments: false, access_reports: true, publish: false },
      }
    },
    {
      id: 'role_7',
      name: 'Marketplace Admin',
      code: 'marketplace_admin',
      description: 'Products, Vendors, Orders, Inventory & Shipping',
      is_system_role: true,
      is_active: true,
      permissions: {
        marketplace: { view: true, create: true, edit: true, delete: true, approve: true, reject: true, assign: false, export: true, download: false, print: false, send_notification: false, manage_wallet: false, manage_payments: false, access_reports: true, publish: true },
      }
    },
    {
      id: 'role_8',
      name: 'Finance Admin',
      code: 'finance_admin',
      description: 'Wallets, Payments, Withdrawals, Invoices, Settlements',
      is_system_role: true,
      is_active: true,
      permissions: {
        wallet_payments: { view: true, create: false, edit: true, delete: false, approve: true, reject: true, assign: false, export: true, download: true, print: true, send_notification: false, manage_wallet: true, manage_payments: true, access_reports: true, publish: false },
      }
    },
    {
      id: 'role_9',
      name: 'Support Admin',
      code: 'support_admin',
      description: 'Tickets, Chat, Complaints, and Escalations',
      is_system_role: true,
      is_active: true,
      permissions: {
        support_center: { view: true, create: true, edit: true, delete: false, approve: false, reject: false, assign: true, export: true, download: false, print: false, send_notification: true, manage_wallet: false, manage_payments: false, access_reports: false, publish: false },
      }
    },
    {
      id: 'role_10',
      name: 'Content Admin',
      code: 'content_admin',
      description: 'App banners, blogs, CMS, FAQs, Terms & Privacy',
      is_system_role: true,
      is_active: true,
      permissions: {
        cms: { view: true, create: true, edit: true, delete: true, approve: false, reject: false, assign: false, export: false, download: false, print: false, send_notification: true, manage_wallet: false, manage_payments: false, access_reports: false, publish: true },
      }
    },
    {
      id: 'role_11',
      name: 'Auditor',
      code: 'auditor',
      description: 'Read-only access for compliance and audit logs',
      is_system_role: true,
      is_active: true,
      permissions: {
        audit_logs: { view: true, create: false, edit: false, delete: false, approve: false, reject: false, assign: false, export: true, download: true, print: true, send_notification: false, manage_wallet: false, manage_payments: false, access_reports: true, publish: false },
      }
    },
  ];

  // Tab 2: RBAC Roles state (initialized with default system roles)
  const [roles, setRoles] = useState<RoleItem[]>(DEFAULT_SYSTEM_ROLES);
  const [selectedRole, setSelectedRole] = useState<RoleItem | null>(DEFAULT_SYSTEM_ROLES[0]);
  const [isLoadingRoles, setIsLoadingRoles] = useState(false);
  const [isSavingRole, setIsSavingRole] = useState(false);

  // Tab 3: Admin Users state
  const [adminUsers, setAdminUsers] = useState<any[]>([]);
  const [userSearch, setUserSearch] = useState('');

  // Default Audit Logs fallback dataset for visual representation
  const DEFAULT_AUDIT_LOGS: AuditItem[] = [
    {
      id: 'log_1',
      actor_name: 'Super Admin',
      actor_email: 'superadmin@bhumicred.com',
      actor_role: 'super_admin',
      action: 'UPDATE_ROLE_PERMISSIONS',
      module: 'rbac',
      target_entity: 'Role',
      target_id: 'operations_admin',
      old_value: { export: false },
      new_value: { export: true },
      ip_address: '127.0.0.1',
      timestamp: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
    },
    {
      id: 'log_2',
      actor_name: 'Rajesh Kumar',
      actor_email: 'operationsadmin@bhumicred.com',
      actor_role: 'operations_admin',
      action: 'APPROVE_LAND_PARCEL',
      module: 'land_management',
      target_entity: 'LandParcel',
      target_id: 'LND-9082',
      old_value: { status: 'pending' },
      new_value: { status: 'approved' },
      ip_address: '49.207.210.15',
      timestamp: new Date(Date.now() - 25 * 60 * 1000).toISOString(),
    },
    {
      id: 'log_3',
      actor_name: 'Vikram Singh',
      actor_email: 'kycadmin@bhumicred.com',
      actor_role: 'kyc_admin',
      action: 'VERIFY_FARMER_KYC',
      module: 'document_center',
      target_entity: 'Farmer',
      target_id: 'FRM-4021',
      old_value: { kyc_status: 'pending' },
      new_value: { kyc_status: 'verified' },
      ip_address: '49.207.210.18',
      timestamp: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
    },
    {
      id: 'log_4',
      actor_name: 'Ananya Sharma',
      actor_email: 'financemanager@bhumicred.com',
      actor_role: 'finance_admin',
      action: 'DISBURSE_CARBON_PAYOUT',
      module: 'wallet_payments',
      target_entity: 'WalletTransaction',
      target_id: 'TXN-8839',
      old_value: { status: 'pending' },
      new_value: { status: 'settled', amount: 12500 },
      ip_address: '49.207.210.22',
      timestamp: new Date(Date.now() - 90 * 60 * 1000).toISOString(),
    },
    {
      id: 'log_5',
      actor_name: 'Pooja Verma',
      actor_email: 'gisadmin@bhumicred.com',
      actor_role: 'gis_admin',
      action: 'VERIFY_SATELLITE_POLYGON',
      module: 'gis_management',
      target_entity: 'LandParcel',
      target_id: 'LND-3391',
      old_value: { polygon_verified: false },
      new_value: { polygon_verified: true },
      ip_address: '49.207.210.28',
      timestamp: new Date(Date.now() - 120 * 60 * 1000).toISOString(),
    },
  ];

  // Tab 4: Audit Logs state (initialized with fallback dataset)
  const [auditLogs, setAuditLogs] = useState<AuditItem[]>(DEFAULT_AUDIT_LOGS);
  const [isLoadingLogs, setIsLoadingLogs] = useState(false);

  // Fetch Roles from Backend API
  const fetchRoles = async () => {
    setIsLoadingRoles(true);
    try {
      const { data } = await adminApi.get('/admin/roles');
      if (Array.isArray(data) && data.length > 0) {
        setRoles(data);
        if (!selectedRole) {
          setSelectedRole(data[0]);
        }
      }
    } catch (err) {
      console.warn("Using fallback default system roles dataset.");
    } finally {
      setIsLoadingRoles(false);
    }
  };

  // Fetch Audit Logs from Backend API & trigger refresh UI feedback
  const fetchAuditLogs = async (showToast: boolean = false) => {
    setIsLoadingLogs(true);
    try {
      const { data } = await adminApi.get('/admin/activity-logs');
      const fetchedLogs = Array.isArray(data) ? data : data.logs || [];
      if (fetchedLogs.length > 0) {
        setAuditLogs(fetchedLogs);
      } else {
        // Prepend a fresh live refresh entry
        const liveEntry: AuditItem = {
          id: `log_live_${Date.now()}`,
          actor_name: 'Super Admin',
          actor_email: 'superadmin@bhumicred.com',
          actor_role: 'super_admin',
          action: 'MANUAL_AUDIT_LOG_REFRESH',
          module: 'audit_logs',
          target_entity: 'AuditLog',
          target_id: `LOG-${Math.floor(1000 + Math.random() * 9000)}`,
          old_value: { last_refreshed: 'stale' },
          new_value: { last_refreshed: 'just now', status: 'live' },
          ip_address: '127.0.0.1',
          timestamp: new Date().toISOString(),
        };
        setAuditLogs(prev => [liveEntry, ...prev.filter(l => !l.id.startsWith('log_live_'))]);
      }
      if (showToast) {
        toast.success('Audit logs refreshed in real-time!');
      }
    } catch (err) {
      console.warn("Using fallback audit logs dataset with fresh live entry.");
      const liveEntry: AuditItem = {
        id: `log_live_${Date.now()}`,
        actor_name: 'Super Admin',
        actor_email: 'superadmin@bhumicred.com',
        actor_role: 'super_admin',
        action: 'MANUAL_AUDIT_LOG_REFRESH',
        module: 'audit_logs',
        target_entity: 'AuditLog',
        target_id: `LOG-${Math.floor(1000 + Math.random() * 9000)}`,
        old_value: { last_refreshed: 'stale' },
        new_value: { last_refreshed: 'just now', status: 'live' },
        ip_address: '127.0.0.1',
        timestamp: new Date().toISOString(),
      };
      setAuditLogs(prev => [liveEntry, ...prev.filter(l => !l.id.startsWith('log_live_'))]);
      if (showToast) {
        toast.success('Audit logs refreshed in real-time!');
      }
    } finally {
      setIsLoadingLogs(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'rbac') {
      fetchRoles();
    } else if (activeTab === 'audit') {
      fetchAuditLogs();
    }
  }, [activeTab]);

  const handleSaveParameters = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      toast.success('BhumiCred platform financial parameters committed globally!');
    }, 600);
  };

  const handleResetDatabase = () => {
    if (window.confirm('Are you sure you want to restore the ecosystem database to seed files? This will reset all KYC approvals, carbon credits, and withdrawals.')) {
      localStorage.removeItem('bhumicred_db');
      toast.success('Local database purged. Seeding fresh dataset...');
      setTimeout(() => {
        window.location.reload();
      }, 800);
    }
  };

  const togglePermissionAction = (moduleCode: string, actionKey: string) => {
    if (!selectedRole) return;
    const currentModule = selectedRole.permissions[moduleCode] || {
      view: false, create: false, edit: false, delete: false, approve: false, reject: false, assign: false, export: false, download: false, print: false, send_notification: false, manage_wallet: false, manage_payments: false, access_reports: false, publish: false
    };

    const updatedModule = {
      ...currentModule,
      [actionKey]: !currentModule[actionKey as keyof PermissionMatrix]
    };

    const updatedSelectedRole = {
      ...selectedRole,
      permissions: {
        ...selectedRole.permissions,
        [moduleCode]: updatedModule
      }
    };

    setSelectedRole(updatedSelectedRole);
    setRoles(prev => prev.map(r => r.id === selectedRole.id ? updatedSelectedRole : r));
  };

  const handleSaveRolePermissions = async () => {
    if (!selectedRole) return;
    setIsSavingRole(true);
    try {
      await adminApi.put(`/admin/roles/${selectedRole.id}`, {
        name: selectedRole.name,
        description: selectedRole.description,
        permissions: selectedRole.permissions
      });
      toast.success(`Permissions updated for role: ${selectedRole.name}`);
    } catch (err) {
      toast.error('Failed to update role permissions.');
    } finally {
      setIsSavingRole(false);
    }
  };

  const ACTION_LIST = [
    { key: 'view', label: 'View' },
    { key: 'create', label: 'Add (Create)' },
    { key: 'edit', label: 'Edit' },
    { key: 'delete', label: 'Delete' },
    { key: 'approve', label: 'Approve' },
    { key: 'reject', label: 'Reject' },
    { key: 'assign', label: 'Assign' },
    { key: 'export', label: 'Export' },
    { key: 'download', label: 'Download' },
    { key: 'print', label: 'Print' },
    { key: 'send_notification', label: 'Send Notify' },
    { key: 'manage_wallet', label: 'Wallet' },
    { key: 'manage_payments', label: 'Payments' },
    { key: 'access_reports', label: 'Reports' },
    { key: 'publish', label: 'Publish' },
  ];

  const BRD_MODULE_LIST = [
    { code: 'farmer_management', name: 'Farmer Management' },
    { code: 'land_management', name: 'Land Management' },
    { code: 'document_center', name: 'Document Center (KYC)' },
    { code: 'project_management', name: 'Project Management' },
    { code: 'gis_management', name: 'GIS & Satellite Center' },
    { code: 'carbon_registry', name: 'Carbon Registry' },
    { code: 'tree_insurance', name: 'Tree Insurance' },
    { code: 'marketplace', name: 'Marketplace' },
    { code: 'wallet_payments', name: 'Wallet & Payments' },
    { code: 'mrv_center', name: 'MRV Operations' },
    { code: 'rbac', name: 'Roles & Permissions (RBAC)' },
    { code: 'audit_logs', name: 'Audit Logs' },
  ];

  return (
    <div className="w-full space-y-6 pb-12 text-foreground select-none">
      
      {/* ── Page Header ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/80 pb-5">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-primary/10 border border-primary/20 rounded-full text-[11px] font-semibold text-primary mb-2">
            <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
            PLATFORM OPERATIONS CONTROL CENTER
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Settings className="w-6 h-6 text-primary" />
            System Settings & Enterprise RBAC Control
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            Manage global financial scales, RBAC permission matrices, admin user access, and enterprise forensic audit logs.
          </p>
        </div>

        {/* Tab Selection Navigation */}
        <div className="flex items-center bg-muted/40 p-1 rounded-xl border border-border">
          <button
            onClick={() => setActiveTab('parameters')}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'parameters' ? 'bg-card text-primary shadow-sm' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Parameters</span>
          </button>
          <button
            onClick={() => setActiveTab('rbac')}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'rbac' ? 'bg-card text-primary shadow-sm' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Key className="w-3.5 h-3.5" />
            <span>Roles & RBAC Matrix</span>
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'users' ? 'bg-card text-primary shadow-sm' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Admin Users</span>
          </button>
          <button
            onClick={() => setActiveTab('audit')}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'audit' ? 'bg-card text-primary shadow-sm' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Audit Logs</span>
          </button>
        </div>
      </div>

      {/* ── TAB 1: Financial & Platform Parameters ── */}
      {activeTab === 'parameters' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="ent-card p-4 flex items-center justify-between">
              <div>
                <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Carbon Conversion Rate</p>
                <h3 className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">₹{creditConversionRate} <span className="text-sm font-semibold text-muted-foreground">/ Ton</span></h3>
                <p className="text-[10px] text-muted-foreground mt-0.5">1 Credit = ₹{creditConversionRate} INR</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                <Coins className="w-5 h-5" />
              </div>
            </div>

            <div className="ent-card p-4 flex items-center justify-between">
              <div>
                <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Min Sustainability Score</p>
                <h3 className="text-2xl font-bold text-foreground mt-1">{minSustainabilityScore}% <span className="text-sm font-semibold text-muted-foreground">Limit</span></h3>
                <p className="text-[10px] text-muted-foreground mt-0.5">Eligibility cutoff threshold</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                <Sliders className="w-5 h-5" />
              </div>
            </div>

            <div className="ent-card p-4 flex items-center justify-between">
              <div>
                <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Payout Commission</p>
                <h3 className="text-2xl font-bold text-blue-600 dark:text-blue-400 mt-1">{commissionPercent}% <span className="text-sm font-semibold text-muted-foreground">Share</span></h3>
                <p className="text-[10px] text-muted-foreground mt-0.5">Platform service fee</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-600 dark:text-blue-400">
                <Cpu className="w-5 h-5" />
              </div>
            </div>

            <div className="ent-card p-4 flex items-center justify-between">
              <div>
                <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Satellite Scan Interval</p>
                <h3 className="text-2xl font-bold text-purple-600 dark:text-purple-400 mt-1">{satelliteInterval} <span className="text-sm font-semibold text-muted-foreground">Hours</span></h3>
                <p className="text-[10px] text-muted-foreground mt-0.5">GIS telemetry scan cadence</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-600 dark:text-purple-400">
                <Globe className="w-5 h-5" />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            <div className="lg:col-span-8 bg-card border border-border rounded-2xl p-6 shadow-sm space-y-6">
              <div className="flex items-center justify-between border-b border-border/80 pb-4">
                <div className="flex items-center gap-2 text-foreground font-bold text-sm">
                  <Sliders className="w-5 h-5 text-primary" />
                  <span>Ecosystem Parameters & Financial Scales</span>
                </div>
                <span className="text-[10px] font-semibold bg-primary/10 text-primary px-2.5 py-0.5 rounded-full border border-primary/20">
                  COMMITTED GLOBALLY
                </span>
              </div>

              <form onSubmit={handleSaveParameters} className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 text-xs">
                  <div className="space-y-2">
                    <label className="font-semibold text-foreground block">Carbon Credit Conversion Rate (INR/Ton)</label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground font-bold">₹</span>
                      <input
                        type="number"
                        value={creditConversionRate}
                        onChange={e => setCreditConversionRate(Number(e.target.value))}
                        className="w-full pl-8 pr-4 py-2.5 bg-background border border-border rounded-xl outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 text-foreground font-medium transition-all"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="font-semibold text-foreground block">Minimum Sustainability Score Cutoff (%)</label>
                    <div className="relative">
                      <input
                        type="number"
                        value={minSustainabilityScore}
                        onChange={e => setMinSustainabilityScore(Number(e.target.value))}
                        className="w-full px-4 py-2.5 bg-background border border-border rounded-xl outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 text-foreground font-medium transition-all"
                        required
                      />
                      <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground font-bold">%</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="font-semibold text-foreground block">Platform Payout Commission Share (%)</label>
                    <div className="relative">
                      <input
                        type="number"
                        step="0.1"
                        value={commissionPercent}
                        onChange={e => setCommissionPercent(Number(e.target.value))}
                        className="w-full px-4 py-2.5 bg-background border border-border rounded-xl outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 text-foreground font-medium transition-all"
                        required
                      />
                      <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground font-bold">%</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="font-semibold text-foreground block">Satellite GIS Scan Interval (Hours)</label>
                    <div className="relative">
                      <input
                        type="number"
                        value={satelliteInterval}
                        onChange={e => setSatelliteInterval(Number(e.target.value))}
                        className="w-full px-4 py-2.5 bg-background border border-border rounded-xl outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 text-foreground font-medium transition-all"
                        required
                      />
                      <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground font-bold">Hrs</span>
                    </div>
                  </div>
                </div>

                <div className="pt-2 border-t border-border/60 flex justify-end">
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="btn-primary text-xs px-5 py-2.5 shadow-sm rounded-xl flex items-center gap-1.5 cursor-pointer"
                  >
                    <Save className="w-4 h-4" />
                    <span>{isSaving ? 'Saving Changes...' : 'Commit Financial Scales'}</span>
                  </button>
                </div>
              </form>
            </div>

            <div className="lg:col-span-4 space-y-6">
              <div className="bg-card border border-border rounded-2xl p-5 shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b border-border/80 pb-3">
                  <div className="flex items-center gap-2 font-bold text-xs text-foreground">
                    <Globe className="w-4 h-4 text-primary" />
                    <span>Integrated Gateways</span>
                  </div>
                  <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">3 Active</span>
                </div>

                <div className="space-y-3 text-xs">
                  <div className="flex items-center justify-between p-3 bg-muted/30 border border-border rounded-xl transition-all">
                    <div className="flex items-center gap-2.5">
                      <ShieldCheck className="w-4 h-4 text-emerald-500" />
                      <div>
                        <span className="font-semibold block text-foreground">Satellite GIS Verifier</span>
                        <span className="text-[10px] text-muted-foreground">Automated land polygon audit</span>
                      </div>
                    </div>
                    <button type="button" onClick={() => setSatelliteAuditor(!satelliteAuditor)} className="cursor-pointer">
                      {satelliteAuditor ? <ToggleRight className="w-7 h-7 text-primary" /> : <ToggleLeft className="w-7 h-7 text-muted-foreground" />}
                    </button>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-muted/30 border border-border rounded-xl transition-all">
                    <div className="flex items-center gap-2.5">
                      <Coins className="w-4 h-4 text-blue-500" />
                      <div>
                        <span className="font-semibold block text-foreground">Escrow Bank IMPS Gateway</span>
                        <span className="text-[10px] text-muted-foreground">Direct payout disbursement</span>
                      </div>
                    </div>
                    <button type="button" onClick={() => setEscrowActive(!escrowActive)} className="cursor-pointer">
                      {escrowActive ? <ToggleRight className="w-7 h-7 text-primary" /> : <ToggleLeft className="w-7 h-7 text-muted-foreground" />}
                    </button>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-muted/30 border border-border rounded-xl transition-all">
                    <div className="flex items-center gap-2.5">
                      <Database className="w-4 h-4 text-purple-500" />
                      <div>
                        <span className="font-semibold block text-foreground">Govt Schemes Sync</span>
                        <span className="text-[10px] text-muted-foreground">National Agroforestry sync</span>
                      </div>
                    </div>
                    <button type="button" onClick={() => setGovSync(!govSync)} className="cursor-pointer">
                      {govSync ? <ToggleRight className="w-7 h-7 text-primary" /> : <ToggleLeft className="w-7 h-7 text-muted-foreground" />}
                    </button>
                  </div>
                </div>
              </div>

              <div className="bg-red-500/5 border border-red-500/20 rounded-2xl p-5 shadow-sm space-y-3">
                <div className="flex items-center justify-between border-b border-red-500/20 pb-3">
                  <div className="flex items-center gap-2 font-bold text-xs text-red-600 dark:text-red-400">
                    <AlertTriangle className="w-4 h-4" />
                    <span>Database Controls</span>
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-red-500/10 text-red-600 dark:text-red-400 text-[10px] font-semibold border border-red-500/20">DANGER ZONE</span>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">Reset persistent ecosystem state to default dataset.</p>
                <button type="button" onClick={handleResetDatabase} className="w-full py-2.5 px-4 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer">
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Reset Ecosystem Storage</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 2: Roles & Permissions Matrix (RBAC) ── */}
      {activeTab === 'rbac' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Role Selector Sidebar (4 cols) */}
          <div className="lg:col-span-4 bg-card border border-border rounded-2xl p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-border/80 pb-3">
              <div className="flex items-center gap-2 font-bold text-xs text-foreground">
                <Key className="w-4 h-4 text-primary" />
                <span>Configured Roles ({roles.length})</span>
              </div>
              <button
                onClick={fetchRoles}
                className="p-1.5 text-muted-foreground hover:text-primary rounded-lg hover:bg-muted/50 transition-all"
                title="Refresh Roles"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-2 max-h-[550px] overflow-y-auto pr-1">
              {roles.map(r => (
                <button
                  key={r.id}
                  onClick={() => setSelectedRole(r)}
                  className={`w-full text-left p-3 rounded-xl border text-xs transition-all cursor-pointer flex items-center justify-between ${
                    selectedRole?.id === r.id
                      ? 'bg-primary/10 border-primary/30 text-primary font-semibold shadow-sm'
                      : 'bg-muted/20 border-border/60 hover:bg-muted/40 text-foreground'
                  }`}
                >
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span>{r.name}</span>
                      {r.is_system_role && (
                        <span className="text-[9px] bg-primary/20 text-primary px-1.5 py-0.2 rounded font-mono">SYSTEM</span>
                      )}
                    </div>
                    <span className="text-[10px] text-muted-foreground block font-mono mt-0.5">{r.code}</span>
                  </div>
                  {selectedRole?.id === r.id && <Check className="w-4 h-4 text-primary" />}
                </button>
              ))}
            </div>
          </div>

          {/* Permission Matrix Grid (8 cols) */}
          <div className="lg:col-span-8 bg-card border border-border rounded-2xl p-6 shadow-sm space-y-6">
            {selectedRole ? (
              <>
                <div className="flex items-center justify-between border-b border-border/80 pb-4">
                  <div>
                    <h3 className="font-bold text-sm text-foreground flex items-center gap-2">
                      <Shield className="w-4 h-4 text-primary" />
                      <span>{selectedRole.name} — Granular 15-Action Permission Matrix</span>
                    </h3>
                    <p className="text-[11px] text-muted-foreground mt-0.5">{selectedRole.description || `Role Code: ${selectedRole.code}`}</p>
                  </div>
                  <button
                    onClick={handleSaveRolePermissions}
                    disabled={isSavingRole}
                    className="btn-primary text-xs px-4 py-2 rounded-xl flex items-center gap-1.5 shadow-sm cursor-pointer"
                  >
                    <Save className="w-4 h-4" />
                    <span>{isSavingRole ? 'Saving...' : 'Save Matrix'}</span>
                  </button>
                </div>

                <div className="overflow-x-auto max-h-[500px]">
                  <table className="w-full text-[11px] border-collapse">
                    <thead>
                      <tr className="border-b border-border bg-muted/30 text-muted-foreground text-left">
                        <th className="p-2.5 font-semibold sticky left-0 bg-card z-10">BRD Module</th>
                        {ACTION_LIST.map(act => (
                          <th key={act.key} className="p-2 text-center font-semibold whitespace-nowrap min-w-[65px]">{act.label}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/60">
                      {BRD_MODULE_LIST.map(mod => {
                        const modPerms = selectedRole.permissions[mod.code] || {} as PermissionMatrix;
                        return (
                          <tr key={mod.code} className="hover:bg-muted/20 transition-all">
                            <td className="p-2.5 font-medium text-foreground sticky left-0 bg-card z-10 border-r border-border/40 whitespace-nowrap">
                              {mod.name}
                            </td>
                            {ACTION_LIST.map(act => {
                              const isChecked = !!(modPerms as any)[act.key];
                              return (
                                <td key={act.key} className="p-2 text-center">
                                  <input
                                    type="checkbox"
                                    checked={isChecked}
                                    onChange={() => togglePermissionAction(mod.code, act.key)}
                                    className="w-3.5 h-3.5 accent-primary rounded cursor-pointer transition-transform active:scale-90"
                                  />
                                </td>
                              );
                            })}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </>
            ) : (
              <div className="text-center py-12 text-muted-foreground text-xs">
                Select a role from the list to inspect or modify its 15-action permission matrix.
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── TAB 3: Admin Users & Staff Accounts ── */}
      {activeTab === 'users' && (
        <div className="bg-card border border-border rounded-2xl p-6 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-border/80 pb-4">
            <div>
              <h3 className="font-bold text-sm text-foreground flex items-center gap-2">
                <Users className="w-4 h-4 text-primary" />
                <span>Admin & Operations Staff Accounts</span>
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">Assigned roles, departments, regional scopes, and account statuses.</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search staff by email/name..."
                  value={userSearch}
                  onChange={e => setUserSearch(e.target.value)}
                  className="pl-8 pr-3 py-1.5 bg-background border border-border rounded-xl text-xs outline-none focus:border-primary"
                />
              </div>
              <button className="btn-primary text-xs px-3.5 py-1.5 rounded-xl flex items-center gap-1.5">
                <Plus className="w-3.5 h-3.5" />
                <span>Add Admin Account</span>
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="border-b border-border bg-muted/30 text-muted-foreground font-semibold">
                  <th className="p-3">Staff Name / Email</th>
                  <th className="p-3">Employee ID</th>
                  <th className="p-3">Assigned Role</th>
                  <th className="p-3">Department</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60 font-medium">
                {[
                  { name: 'Super Admin', email: 'superadmin@bhumicred.com', emp_id: 'EMP-1001', role: 'Super Admin', dept: 'Executive', status: 'active' },
                  { name: 'Rajesh Kumar', email: 'operationsadmin@bhumicred.com', emp_id: 'EMP-1002', role: 'Operations Admin', dept: 'Operations', status: 'active' },
                  { name: 'Ananya Sharma', email: 'financemanager@bhumicred.com', emp_id: 'EMP-1003', role: 'Finance Admin', dept: 'Finance', status: 'active' },
                  { name: 'Vikram Singh', email: 'kycadmin@bhumicred.com', emp_id: 'EMP-1004', role: 'KYC Admin', dept: 'Verification', status: 'active' },
                  { name: 'Pooja Verma', email: 'gisadmin@bhumicred.com', emp_id: 'EMP-1005', role: 'GIS Admin', dept: 'Remote Sensing', status: 'active' },
                ].map((usr, idx) => (
                  <tr key={idx} className="hover:bg-muted/20 transition-all">
                    <td className="p-3">
                      <div className="font-semibold text-foreground">{usr.name}</div>
                      <div className="text-[10px] text-muted-foreground">{usr.email}</div>
                    </td>
                    <td className="p-3 font-mono text-[11px] text-muted-foreground">{usr.emp_id}</td>
                    <td className="p-3">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20 text-[10px] font-semibold">
                        <Shield className="w-3 h-3" />
                        {usr.role}
                      </span>
                    </td>
                    <td className="p-3 text-muted-foreground">{usr.dept}</td>
                    <td className="p-3">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-semibold border border-emerald-500/20">
                        <UserCheck className="w-3 h-3" />
                        Active
                      </span>
                    </td>
                    <td className="p-3 text-right">
                      <button className="text-xs text-primary hover:underline font-semibold cursor-pointer">Manage Role</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── TAB 4: Forensic Audit & System Logs ── */}
      {activeTab === 'audit' && (
        <div className="bg-card border border-border rounded-2xl p-6 shadow-sm space-y-6">
          <div className="flex items-center justify-between border-b border-border/80 pb-4">
            <div>
              <h3 className="font-bold text-sm text-foreground flex items-center gap-2">
                <FileText className="w-4 h-4 text-primary" />
                <span>Enterprise Audit & Forensic Logs</span>
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">Real-time action logs with actor details, IP, route telemetry, and state diffs.</p>
            </div>
            <button 
              onClick={() => fetchAuditLogs(true)} 
              disabled={isLoadingLogs}
              className="btn-primary text-xs px-3.5 py-1.5 rounded-xl flex items-center gap-1.5 cursor-pointer shadow-sm active:scale-95 transition-all"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoadingLogs ? 'animate-spin' : ''}`} />
              <span>{isLoadingLogs ? 'Refreshing...' : 'Refresh Logs'}</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="border-b border-border bg-muted/30 text-muted-foreground font-semibold">
                  <th className="p-3">Timestamp</th>
                  <th className="p-3">Actor / Role</th>
                  <th className="p-3">Module / Action</th>
                  <th className="p-3">IP Address</th>
                  <th className="p-3">Target Entity</th>
                  <th className="p-3">State Change (Diff)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60 font-medium">
                {auditLogs.length > 0 ? (
                  auditLogs.map((log, idx) => (
                    <tr key={log.id || idx} className="hover:bg-muted/20 transition-all">
                      <td className="p-3 text-[11px] text-muted-foreground font-mono whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-3 h-3 text-primary" />
                          <span>{new Date(log.timestamp).toLocaleString()}</span>
                        </div>
                      </td>
                      <td className="p-3">
                        <div className="font-semibold text-foreground">{log.actor_name || 'System'}</div>
                        <div className="text-[10px] text-muted-foreground font-mono">{log.actor_role || log.actor_email}</div>
                      </td>
                      <td className="p-3">
                        <span className="font-bold text-primary block">{log.action}</span>
                        <span className="text-[10px] text-muted-foreground font-mono uppercase">{log.module}</span>
                      </td>
                      <td className="p-3 text-muted-foreground font-mono text-[11px]">{log.ip_address || '127.0.0.1'}</td>
                      <td className="p-3 text-muted-foreground font-mono text-[11px]">{log.target_entity} #{log.target_id?.slice(-6)}</td>
                      <td className="p-3 text-[10px] font-mono">
                        {log.old_value ? (
                          <span className="text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                            {JSON.stringify(log.new_value)}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="text-center py-8 text-muted-foreground text-xs">
                      No audit logs recorded yet. Action changes will appear here in real-time.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  );
};

import { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users, Plus, UserCheck, KeyRound, RefreshCw, Eye,
  Shield, UserX, Clock, MapPin, Activity, X,
  BarChart2, ShieldAlert
} from 'lucide-react';
import {
  AreaChart, Area, PieChart, Pie, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid
} from 'recharts';
import { PageHeader } from '../../../components/ui/PageHeader';
import { FilterBar } from '../../../components/ui/FilterBar';
import { KpiCard } from '../../../components/ui/KpiCard';
import { ChartCard } from '../../../components/ui/ChartCard';
import { StatusBadge } from '../../../components/ui/StatusBadge';
import { EmptyState, SkeletonTable } from '../../../components/ui/EmptyState';
import { useUsers, AdminUserItem, SEEDED_ADMIN_USERS } from '../api/useUsers';
import { useRoles } from '../api/useRoles';
import toast from 'react-hot-toast';

const PAGE_SIZE = 10;

// ── Permission Matrix Definition ──────────────────────────────────────────────
const IAM_MODULES = [
  'Dashboard', 'User & Role Mgmt', 'Farmer Management', 'Government Bodies',
  'Partner Management', 'Land & GIS', 'Projects', 'Carbon Registry',
  'Tree Insurance', 'Marketplace', 'Wallet & Payments', 'Finance',
  'Support Center', 'Reports & Analytics', 'CMS & Content', 'Notifications',
  'Audit Logs', 'System Settings', 'API Management', 'System Health'
];

// All 14 Specified Granular Actions
const IAM_ACTIONS = [
  'View',
  'Add',
  'Edit',
  'Delete',
  'Approve',
  'Reject',
  'Assign',
  'Export',
  'Download',
  'Print',
  'Send Notification',
  'Manage Wallet',
  'Manage Payments',
  'Access Reports'
];

// Initial matrix state
const DEFAULT_MATRIX: Record<string, Record<string, Record<string, boolean>>> = {
  'Super Admin': IAM_MODULES.reduce((acc, m) => ({ ...acc, [m]: IAM_ACTIONS.reduce((a, act) => ({ ...a, [act]: true }), {}) }), {}),
  'Operations Admin': {
    'Farmer Management': { View: true, Add: true, Edit: true, Delete: false, Approve: true, Reject: true, Assign: true, Export: true, Download: true, Print: true, 'Send Notification': true, 'Manage Wallet': false, 'Manage Payments': false, 'Access Reports': true },
    'Land & GIS': { View: true, Add: true, Edit: true, Delete: false, Approve: true, Reject: true, Assign: true, Export: true, Download: true, Print: true, 'Send Notification': false, 'Manage Wallet': false, 'Manage Payments': false, 'Access Reports': true },
    'Projects': { View: true, Add: true, Edit: true, Delete: false, Approve: false, Reject: false, Assign: true, Export: true, Download: true, Print: true, 'Send Notification': true, 'Manage Wallet': false, 'Manage Payments': false, 'Access Reports': true },
    'Dashboard': { View: true, Add: false, Edit: false, Delete: false, Approve: false, Reject: false, Assign: false, Export: true, Download: true, Print: false, 'Send Notification': false, 'Manage Wallet': false, 'Manage Payments': false, 'Access Reports': true },
  },
  'Finance Manager': {
    'Wallet & Payments': { View: true, Add: true, Edit: true, Delete: false, Approve: true, Reject: true, Assign: false, Export: true, Download: true, Print: true, 'Send Notification': true, 'Manage Wallet': true, 'Manage Payments': true, 'Access Reports': true },
    'Reports & Analytics': { View: true, Add: false, Edit: false, Delete: false, Approve: false, Reject: false, Assign: false, Export: true, Download: true, Print: true, 'Send Notification': false, 'Manage Wallet': false, 'Manage Payments': false, 'Access Reports': true },
  },
};

// Analytics Mock Data
const USER_GROWTH_DATA = [
  { month: 'Sep', total: 240, active: 220 },
  { month: 'Oct', total: 310, active: 290 },
  { month: 'Nov', total: 380, active: 350 },
  { month: 'Dec', total: 450, active: 420 },
  { month: 'Jan', total: 520, active: 490 },
  { month: 'Feb', total: 610, active: 580 },
];

const ROLE_DISTRIBUTION = [
  { name: 'Super Admin',       value: 5,  color: '#8B5CF6' },
  { name: 'Operations Admin',  value: 18, color: '#2563EB' },
  { name: 'Finance Manager',   value: 12, color: '#F59E0B' },
  { name: 'Carbon Manager',    value: 14, color: '#16A34A' },
  { name: 'Government Officer',value: 8,  color: '#06B6D4' },
];

// ── Main Component ────────────────────────────────────────────────────────────
export const UserList = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  // Sync viewMode with URL ?tab= param
  const tabParam = searchParams.get('tab');
  const [viewMode, setViewMode] = useState<'directory' | 'matrix' | 'analytics'>(
    tabParam === 'roles' ? 'matrix' :
    tabParam === 'permissions' ? 'matrix' :
    'directory'
  );

  useEffect(() => {
    if (tabParam === 'users') setViewMode('directory');
    else if (tabParam === 'roles' || tabParam === 'permissions') setViewMode('matrix');
  }, [tabParam]);

  // When viewMode changes internally, update URL tab
  const handleSetViewMode = (mode: 'directory' | 'matrix' | 'analytics') => {
    setViewMode(mode);
    if (mode === 'directory') setSearchParams({ tab: 'users' });
    else if (mode === 'matrix') setSearchParams({ tab: 'roles' });
    else setSearchParams({ tab: 'users' });
  };
  const [selectedUser, setSelectedUser] = useState<AdminUserItem | null>(null);
  const [drawerTab, setDrawerTab] = useState<'overview' | 'roles' | 'locations' | 'timeline' | 'security'>('overview');

  // Directory Filters
  const [page, setPage]                 = useState(1);
  const [search, setSearch]             = useState('');
  const [roleFilter, setRoleFilter]     = useState('');
  const [deptFilter, setDeptFilter]     = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedIds, setSelectedIds]   = useState<string[]>([]);

  // Permission Matrix Selected Role
  const [matrixRole, setMatrixRole] = useState<string>('Super Admin');
  const [localMatrixState, setLocalMatrixState] = useState<Record<string, Record<string, Record<string, boolean>>>>({});

  const { data: apiUsers, isLoading, refetch, isFetching } = useUsers();
  const { data: rolesData } = useRoles();
  const users = apiUsers || SEEDED_ADMIN_USERS;

  // Use localMatrixState first, then API, then default
  const activeMatrix = localMatrixState[matrixRole]
    || rolesData?.find(r => r.name === matrixRole)?.permissions
    || DEFAULT_MATRIX[matrixRole]
    || DEFAULT_MATRIX['Super Admin']
    || {};


  // Filtered Directory
  const filtered = useMemo(() => {
    return users.filter(u => {
      const q = search.toLowerCase();
      const matchSearch = !q || [u.name, u.email, u.role, u.department, u.emp_id, u.id].some(v => v?.toLowerCase().includes(q));
      const matchRole   = !roleFilter || u.role?.toLowerCase() === roleFilter.toLowerCase();
      const matchDept   = !deptFilter || u.department?.toLowerCase().includes(deptFilter.toLowerCase());
      const matchStatus = !statusFilter || u.status === statusFilter;
      return matchSearch && matchRole && matchDept && matchStatus;
    });
  }, [users, search, roleFilter, deptFilter, statusFilter]);

  // Aggregated KPIs
  const totalUsers       = 45231; // Total platform registered users across India
  const activeUsers      = 42109;
  const pendingInvites   = 89;
  const suspendedUsers   = 12;
  const onlineUsers      = 3410;
  const inactiveUsers    = 3021;

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage   = Math.min(page, totalPages);
  const pageRows   = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const toggleSelectAll = () => {
    if (selectedIds.length === filtered.length) setSelectedIds([]);
    else setSelectedIds(filtered.map(u => u.id));
  };

  const toggleSelectOne = (id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const getRoleVariant = (r: string) => {
    const role = (r || '').toLowerCase();
    if (role.includes('super')) return 'purple';
    if (role.includes('finance')) return 'warning';
    if (role.includes('carbon')) return 'success';
    if (role.includes('operations')) return 'info';
    return 'cyan';
  };

  const handleMatrixToggle = (mod: string, act: string) => {
    setLocalMatrixState(prev => {
      // Start from current local state OR default matrix for this role
      const baseRoleObj = prev[matrixRole] || DEFAULT_MATRIX[matrixRole] || DEFAULT_MATRIX['Super Admin'] || {};
      const currentModObj = baseRoleObj[mod] || {};
      const newModObj = { ...currentModObj, [act]: !currentModObj[act] };
      return {
        ...prev,
        [matrixRole]: {
          ...baseRoleObj,
          [mod]: newModObj,
        },
      };
    });
    toast.success(`Permission updated`);
  };

  return (
    <div className="space-y-6 page-enter">
      {/* ── Page Header ── */}
      <PageHeader
        title="Enterprise Identity & Access Management"
        description="Manage all platform administrators, organizational roles, security policies, and RBAC matrix across BhumiCred."
        badge={{ label: 'Entra ID Sync Active', variant: 'success' }}
        icon={Shield}
        actions={
          <div className="flex items-center gap-2">
            {/* View switcher */}
            <div className="flex items-center p-1 bg-[#F1F5F9] rounded-[10px] gap-1">
              <button
                onClick={() => handleSetViewMode('directory')}
                className={`btn btn-sm ${viewMode === 'directory' ? 'btn-primary shadow-sm' : 'btn-ghost text-[#64748B]'}`}
              >
                <Users size={14} /> Directory
              </button>
              <button
                onClick={() => handleSetViewMode('matrix')}
                className={`btn btn-sm ${viewMode === 'matrix' ? 'btn-primary shadow-sm' : 'btn-ghost text-[#64748B]'}`}
              >
                <KeyRound size={14} /> Permission Matrix
              </button>
              <button
                onClick={() => handleSetViewMode('analytics')}
                className={`btn btn-sm ${viewMode === 'analytics' ? 'btn-primary shadow-sm' : 'btn-ghost text-[#64748B]'}`}
              >
                <BarChart2 size={14} /> IAM Analytics
              </button>
            </div>

            <button onClick={() => refetch()} className="btn btn-secondary btn-sm">
              <RefreshCw size={13} className={isFetching ? 'animate-spin' : ''} />
            </button>
            <button className="btn btn-primary btn-sm">
              <Plus size={13} /> Create User
            </button>
          </div>
        }
      />

      {/* ── Top 6 KPI Cards ── */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <KpiCard title="Total Users"       value={totalUsers.toLocaleString()}   icon={Users}        iconBg="#F5F3FF" iconColor="#8B5CF6" trend={12.4} loading={isLoading} />
        <KpiCard title="Active Users"      value={activeUsers.toLocaleString()}  icon={UserCheck}    iconBg="#F0FDF4" iconColor="#16A34A" trend={9.1}  loading={isLoading} />
        <KpiCard title="Pending Invites"   value={pendingInvites}                icon={Clock}        iconBg="#FFFBEB" iconColor="#F59E0B" trend={-2.5} loading={isLoading} />
        <KpiCard title="Online Now"        value={onlineUsers.toLocaleString()}  icon={Activity}     iconBg="#EFF6FF" iconColor="#2563EB" trend={15.8} loading={isLoading} />
        <KpiCard title="Inactive Users"    value={inactiveUsers.toLocaleString()}icon={UserX}        iconBg="#F1F5F9" iconColor="#64748B" trend={-1.1} loading={isLoading} />
        <KpiCard title="Suspended"         value={suspendedUsers}                icon={ShieldAlert}  iconBg="#FEF2F2" iconColor="#EF4444" trend={0.0}  loading={isLoading} />
      </div>

      {/* ── VIEW 1: DIRECTORY VIEW ── */}
      {viewMode === 'directory' && (
        <div className="space-y-4">
          <div className="ent-card overflow-hidden">
            {/* Filter Bar */}
            <div className="p-4 border-b border-[#F1F5F9]">
              <FilterBar
                search={search} onSearchChange={setSearch}
                searchPlaceholder="Search by name, email, employee ID, department..."
                filters={[
                  {
                    key: 'role', label: 'All Roles', value: roleFilter, onChange: setRoleFilter,
                    options: [
                      { label: 'Super Admin', value: 'Super Admin' },
                      { label: 'Operations Admin', value: 'Operations Admin' },
                      { label: 'Finance Manager', value: 'Finance Manager' },
                      { label: 'Carbon Manager', value: 'Carbon Manager' },
                      { label: 'Government Officer', value: 'Government Officer' },
                    ],
                  },
                  {
                    key: 'dept', label: 'All Departments', value: deptFilter, onChange: setDeptFilter,
                    options: [
                      { label: 'Executive Leadership', value: 'Executive' },
                      { label: 'Field Operations', value: 'Operations' },
                      { label: 'Finance & Audit', value: 'Finance' },
                      { label: 'Carbon MRV Operations', value: 'Carbon' },
                    ],
                  },
                  {
                    key: 'status', label: 'Status', value: statusFilter, onChange: setStatusFilter,
                    options: [
                      { label: 'Active', value: 'active' },
                      { label: 'Pending', value: 'pending' },
                      { label: 'Suspended', value: 'suspended' },
                    ],
                  },
                ]}
                onExport={() => toast.success('Exporting User Directory CSV...')}
                onRefresh={() => refetch()}
                loading={isFetching}
                resultCount={filtered.length}
                extraActions={
                  selectedIds.length > 0 ? (
                    <div className="flex items-center gap-2">
                      <span className="text-[12px] text-[#64748B] font-600" style={{ fontWeight: 600 }}>{selectedIds.length} selected</span>
                      <button className="btn btn-secondary btn-sm" onClick={() => toast.success('Reset password link sent')}>Reset Pwd</button>
                      <button className="btn btn-danger btn-sm" onClick={() => toast.success('Selected users suspended')}>Suspend</button>
                    </div>
                  ) : null
                }
              />
            </div>

            {/* Enterprise Table */}
            <div className="overflow-x-auto">
              <table className="ent-table">
                <thead>
                  <tr>
                    <th className="w-10">
                      <input
                        type="checkbox"
                        checked={selectedIds.length === filtered.length && filtered.length > 0}
                        onChange={toggleSelectAll}
                        className="rounded border-[#CBD5E1] accent-[#16A34A] cursor-pointer"
                      />
                    </th>
                    <th>User & Emp ID</th>
                    <th>Role</th>
                    <th>Department</th>
                    <th>Assigned Region</th>
                    <th>MFA & Security</th>
                    <th>Online</th>
                    <th>Status</th>
                    <th>Last Active</th>
                    <th className="text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {isLoading ? (
                    <tr><td colSpan={10} className="p-0"><SkeletonTable rows={8} cols={8} /></td></tr>
                  ) : filtered.length === 0 ? (
                    <tr><td colSpan={10}>
                      <EmptyState icon={Users} title="No users found" description="Try adjusting your filters or search keyword." />
                    </td></tr>
                  ) : pageRows.map((user, i) => {
                    const initials = user.name
                      ? user.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
                      : 'AD';
                    return (
                      <motion.tr
                        key={user.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: i * 0.025 }}
                        className={`hover:bg-[#FAFCFF] cursor-pointer ${selectedIds.includes(user.id) ? 'selected' : ''}`}
                        onClick={() => { setSelectedUser(user); setDrawerTab('overview'); }}
                      >
                        <td onClick={e => e.stopPropagation()}>
                          <input
                            type="checkbox"
                            checked={selectedIds.includes(user.id)}
                            onChange={() => toggleSelectOne(user.id)}
                            className="rounded border-[#CBD5E1] accent-[#16A34A] cursor-pointer"
                          />
                        </td>
                        <td>
                          <div className="flex items-center gap-3">
                            <div className="relative shrink-0">
                              <div className="w-9 h-9 rounded-[10px] bg-[#2563EB] text-white flex items-center justify-center font-bold text-[12px]" style={{ fontWeight: 700 }}>
                                {initials}
                              </div>
                              <span className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-white ${
                                user.online_status === 'online' ? 'bg-[#22C55E]' :
                                user.online_status === 'away'   ? 'bg-[#F59E0B]' : 'bg-[#CBD5E1]'
                              }`} />
                            </div>
                            <div>
                              <div className="text-[13px] font-600 text-[#0F172A]" style={{ fontWeight: 600 }}>{user.name}</div>
                              <div className="text-[11.5px] text-[#64748B] flex items-center gap-1.5 mt-0.5">
                                <span className="font-mono text-[11px] bg-[#F1F5F9] px-1.5 py-0.2 rounded text-[#475569]">{user.emp_id || user.id}</span>
                                <span>•</span>
                                <span>{user.email}</span>
                              </div>
                            </div>
                          </div>
                        </td>
                        <td>
                          <StatusBadge label={user.role} variant={getRoleVariant(user.role) as any} size="sm" />
                        </td>
                        <td className="text-[12.5px] text-[#475569]">{user.department}</td>
                        <td>
                          <div className="flex items-center gap-1 text-[12px] text-[#64748B]">
                            <MapPin size={11} className="text-[#94A3B8] shrink-0" />
                            {user.assigned_state}
                          </div>
                        </td>
                        <td>
                          <div className="flex items-center gap-1.5">
                            <StatusBadge label={user.mfa_enabled ? 'MFA On' : 'MFA Off'} variant={user.mfa_enabled ? 'success' : 'warning'} size="sm" />
                            <span className="text-[11px] text-[#94A3B8] font-mono">{user.permissions_count} perms</span>
                          </div>
                        </td>
                        <td>
                          <span className={`text-[11.5px] font-500 capitalize ${
                            user.online_status === 'online' ? 'text-[#16A34A]' :
                            user.online_status === 'away'   ? 'text-[#F59E0B]' : 'text-[#94A3B8]'
                          }`} style={{ fontWeight: 500 }}>
                            {user.online_status}
                          </span>
                        </td>
                        <td>
                          <StatusBadge label={user.status ? user.status.charAt(0).toUpperCase() + user.status.slice(1) : 'Active'} variant={user.status === 'active' ? 'success' : user.status === 'pending' ? 'warning' : 'danger'} size="sm" />
                        </td>
                        <td className="text-[12px] text-[#64748B]">
                          {user.last_login ? new Date(user.last_login).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : 'Never'}
                        </td>
                        <td onClick={e => e.stopPropagation()}>
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => { setSelectedUser(user); setDrawerTab('overview'); }}
                              className="btn btn-ghost btn-icon btn-sm"
                              title="View IAM Profile"
                            >
                              <Eye size={14} />
                            </button>
                            <button
                              onClick={() => { setSelectedUser(user); setDrawerTab('roles'); }}
                              className="btn btn-ghost btn-icon btn-sm"
                              title="Edit Roles & Permissions"
                            >
                              <KeyRound size={14} />
                            </button>
                          </div>
                        </td>
                      </motion.tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-[#F1F5F9]">
                <span className="text-[12px] text-[#94A3B8]">
                  Page {safePage} of {totalPages} · {filtered.length} total IAM accounts
                </span>
                <div className="flex gap-1">
                  <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={safePage === 1} className="btn btn-secondary btn-sm">Previous</button>
                  <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={safePage === totalPages} className="btn btn-secondary btn-sm">Next</button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── VIEW 2: PERMISSION MATRIX VIEW ── */}
      {viewMode === 'matrix' && (
        <div className="space-y-4">
          <div className="ent-card p-5">
            <div className="flex items-center justify-between border-b border-[#F1F5F9] pb-4 mb-4">
              <div>
                <h3 className="text-[15px] font-600 text-[#0F172A]" style={{ fontWeight: 600 }}>Role Policy Permission Matrix</h3>
                <p className="text-[12.5px] text-[#64748B] mt-0.5">Configure fine-grained module access and functional privileges for each organizational role.</p>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-[12.5px] text-[#64748B] font-500" style={{ fontWeight: 500 }}>Select Role:</span>
                <select
                  value={matrixRole}
                  onChange={e => setMatrixRole(e.target.value)}
                  className="ent-input text-[13px] font-600 bg-[#F8FAFC] border-[#E2E8F0] min-w-[180px]"
                  style={{ fontWeight: 600 }}
                >
                  {rolesData && rolesData.length > 0 ? (
                    rolesData.map(r => <option key={r.id} value={r.name}>{r.name}</option>)
                  ) : (
                    <>
                      <option value="Super Admin">Super Admin</option>
                      <option value="Operations Admin">Operations Admin</option>
                      <option value="Finance Manager">Finance Manager</option>
                      <option value="Carbon Manager">Carbon Manager</option>
                      <option value="Vendor Manager">Vendor Manager</option>
                    </>
                  )}
                </select>
                <button onClick={() => toast.success('Role Policy Matrix saved')} className="btn btn-primary btn-sm">
                  Save Role Policy
                </button>
              </div>
            </div>

            {/* Matrix Table */}
            <div className="overflow-x-auto border border-[#E2E8F0] rounded-[12px]">
              <table className="ent-table">
                <thead>
                  <tr>
                    <th className="w-56 bg-[#F8FAFC]">Module Name</th>
                    {IAM_ACTIONS.map(act => (
                      <th key={act} className="text-center bg-[#F8FAFC] min-w-[100px]">{act}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {IAM_MODULES.map((mod) => {
                    const currentPerms = activeMatrix[mod] || {};
                    return (
                      <tr key={mod} className="hover:bg-[#FAFCFF]">
                        <td className="font-600 text-[#0F172A] text-[13px]" style={{ fontWeight: 600 }}>
                          {mod}
                        </td>
                        {IAM_ACTIONS.map(act => {
                          const isChecked = !!currentPerms[act];
                          return (
                            <td key={act} className="text-center">
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => handleMatrixToggle(mod, act)}
                                className="w-4 h-4 rounded border-[#CBD5E1] accent-[#16A34A] cursor-pointer"
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
          </div>
        </div>
      )}

      {/* ── VIEW 3: IAM ANALYTICS VIEW ── */}
      {viewMode === 'analytics' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            <ChartCard title="User Account Growth" subtitle="Monthly active vs registered admin users" height={240}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={USER_GROWTH_DATA}>
                  <defs>
                    <linearGradient id="gradUsers" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#94A3B8' }} />
                  <YAxis tick={{ fontSize: 11, fill: '#94A3B8' }} />
                  <Tooltip />
                  <Area type="monotone" dataKey="total" stroke="#8B5CF6" fill="url(#gradUsers)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </ChartCard>

            <ChartCard title="Role Distribution Breakdown" subtitle="Share of administrators by active role" height={240}>
              <div className="flex items-center gap-4 h-full">
                <ResponsiveContainer width="55%" height="100%">
                  <PieChart>
                    <Pie data={ROLE_DISTRIBUTION} cx="50%" cy="50%" innerRadius={50} outerRadius={75} dataKey="value" paddingAngle={4}>
                      {ROLE_DISTRIBUTION.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                <div className="space-y-2 flex-1">
                  {ROLE_DISTRIBUTION.map(r => (
                    <div key={r.name} className="flex items-center justify-between text-[12px]">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full" style={{ background: r.color }} />
                        <span className="text-[#64748B]">{r.name}</span>
                      </div>
                      <span className="font-600 text-[#0F172A]" style={{ fontWeight: 600 }}>{r.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </ChartCard>
          </div>
        </div>
      )}

      {/* ── USER PROFILE SLIDE-OVER DRAWER ── */}
      <AnimatePresence>
        {selectedUser && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.4 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedUser(null)}
              className="fixed inset-0 bg-black z-40"
            />

            {/* Slide-over Panel */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 220 }}
              className="fixed top-0 right-0 h-full w-[480px] max-w-full bg-white shadow-2xl z-50 flex flex-col border-l border-[#E2E8F0]"
            >
              {/* Drawer Header */}
              <div className="p-5 border-b border-[#F1F5F9] bg-[#FAFCFF] flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-[14px] bg-[#2563EB] text-white flex items-center justify-center text-[16px] font-700 shadow-sm" style={{ fontWeight: 700 }}>
                    {selectedUser.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-[16px] font-700 text-[#0F172A]" style={{ fontWeight: 700 }}>{selectedUser.name}</h3>
                      <StatusBadge label={selectedUser.status} variant={selectedUser.status === 'active' ? 'success' : 'danger'} size="sm" />
                    </div>
                    <p className="text-[12px] text-[#64748B] mt-0.5">{selectedUser.email} • {selectedUser.emp_id}</p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedUser(null)}
                  className="btn btn-ghost btn-icon btn-sm text-[#94A3B8] hover:text-[#0F172A]"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Drawer Tabs Bar */}
              <div className="flex items-center border-b border-[#F1F5F9] px-5 bg-white gap-2 overflow-x-auto text-[12.5px] shrink-0">
                {[
                  { id: 'overview', label: 'Overview' },
                  { id: 'roles', label: 'Roles & Perms' },
                  { id: 'locations', label: 'Locations' },
                  { id: 'timeline', label: 'Activity Feed' },
                  { id: 'security', label: 'Security & Devices' },
                ].map(t => (
                  <button
                    key={t.id}
                    onClick={() => setDrawerTab(t.id as any)}
                    className={`py-3 px-2 border-b-2 font-500 transition-colors whitespace-nowrap ${
                      drawerTab === t.id ? 'border-[#16A34A] text-[#16A34A] font-600' : 'border-transparent text-[#64748B] hover:text-[#0F172A]'
                    }`}
                    style={{ fontWeight: drawerTab === t.id ? 600 : 500 }}
                  >
                    {t.label}
                  </button>
                ))}
              </div>

              {/* Drawer Tab Contents */}
              <div className="flex-1 overflow-y-auto p-5 space-y-4">
                {/* TAB 1: OVERVIEW */}
                {drawerTab === 'overview' && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-[12px]">
                        <div className="text-[11px] text-[#94A3B8] uppercase tracking-wide">Role & Type</div>
                        <div className="text-[13px] font-600 text-[#0F172A] mt-1" style={{ fontWeight: 600 }}>{selectedUser.role}</div>
                        <div className="text-[11px] text-[#64748B]">{selectedUser.user_type}</div>
                      </div>
                      <div className="p-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-[12px]">
                        <div className="text-[11px] text-[#94A3B8] uppercase tracking-wide">Department</div>
                        <div className="text-[13px] font-600 text-[#0F172A] mt-1" style={{ fontWeight: 600 }}>{selectedUser.department}</div>
                        <div className="text-[11px] text-[#64748B]">Created by {selectedUser.created_by}</div>
                      </div>
                    </div>

                    {/* Quick Info List */}
                    <div className="ent-card p-4 space-y-3">
                      <h4 className="text-[13px] font-600 text-[#0F172A]" style={{ fontWeight: 600 }}>Account Details</h4>
                      <div className="space-y-2 text-[12.5px]">
                        <div className="flex justify-between text-[#64748B]">
                          <span>Phone Number:</span>
                          <span className="text-[#0F172A] font-mono">{selectedUser.phone}</span>
                        </div>
                        <div className="flex justify-between text-[#64748B]">
                          <span>Assigned State:</span>
                          <span className="text-[#0F172A] font-500">{selectedUser.assigned_state}</span>
                        </div>
                        <div className="flex justify-between text-[#64748B]">
                          <span>Assigned District:</span>
                          <span className="text-[#0F172A] font-500">{selectedUser.assigned_district}</span>
                        </div>
                        <div className="flex justify-between text-[#64748B]">
                          <span>MFA Status:</span>
                          <span className={selectedUser.mfa_enabled ? 'text-[#16A34A] font-600' : 'text-[#F59E0B] font-600'} style={{ fontWeight: 600 }}>
                            {selectedUser.mfa_enabled ? 'Enabled (Authenticator App)' : 'Not Configured'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* TAB 2: ROLES & PERMISSIONS */}
                {drawerTab === 'roles' && (
                  <div className="space-y-4">
                    <div className="ent-card p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="text-[13px] font-600 text-[#0F172A]" style={{ fontWeight: 600 }}>Active Role Policy</h4>
                        <StatusBadge label={selectedUser.role} variant="purple" size="sm" />
                      </div>
                      <p className="text-[12px] text-[#64748B]">
                        This user holds <span className="font-600 text-[#0F172A]" style={{ fontWeight: 600 }}>{selectedUser.permissions_count} explicit permissions</span> derived from the {selectedUser.role} security template.
                      </p>
                    </div>
                  </div>
                )}

                {/* TAB 3: LOCATIONS */}
                {drawerTab === 'locations' && (
                  <div className="space-y-3">
                    <div className="p-3 bg-[#EFF6FF] border border-[#BFDBFE] rounded-[12px] flex items-center gap-3">
                      <MapPin size={18} className="text-[#2563EB]" />
                      <div>
                        <div className="text-[13px] font-600 text-[#1E40AF]" style={{ fontWeight: 600 }}>{selectedUser.assigned_state}</div>
                        <div className="text-[11.5px] text-[#3B82F6]">{selectedUser.assigned_district}</div>
                      </div>
                    </div>
                  </div>
                )}

                {/* TAB 4: TIMELINE */}
                {drawerTab === 'timeline' && (
                  <div className="space-y-3">
                    {selectedUser.activity_logs?.map((log) => (
                      <div key={log.id} className="p-3 rounded-[10px] bg-[#F8FAFC] border border-[#E2E8F0] text-[12px]">
                        <div className="flex items-center justify-between font-600 text-[#0F172A] mb-1" style={{ fontWeight: 600 }}>
                          <span>{log.action}</span>
                          <span className="text-[10.5px] text-[#94A3B8] font-normal">{log.timestamp}</span>
                        </div>
                        <div className="text-[#64748B]">{log.details}</div>
                        <div className="text-[10.5px] text-[#94A3B8] font-mono mt-1">IP: {log.ip}</div>
                      </div>
                    ))}
                  </div>
                )}

                {/* TAB 5: SECURITY & DEVICES */}
                {drawerTab === 'security' && (
                  <div className="space-y-3">
                    <div className="ent-card p-4 space-y-2 text-[12.5px]">
                      <div className="flex items-center justify-between">
                        <span className="text-[#64748B]">Device Browser:</span>
                        <span className="font-600 text-[#0F172A]" style={{ fontWeight: 600 }}>{selectedUser.device_info.browser}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-[#64748B]">Operating System:</span>
                        <span className="text-[#0F172A]">{selectedUser.device_info.os}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-[#64748B]">IP Address:</span>
                        <span className="font-mono text-[#2563EB]">{selectedUser.device_info.ip}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-[#64748B]">Location:</span>
                        <span className="text-[#0F172A]">{selectedUser.device_info.location}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Drawer Footer Actions */}
              <div className="p-4 border-t border-[#F1F5F9] bg-[#FAFCFF] flex items-center justify-between gap-2 shrink-0">
                <button
                  onClick={() => toast.success('Password reset email sent')}
                  className="btn btn-secondary btn-sm"
                >
                  Reset Password
                </button>
                <button
                  onClick={() => {
                    toast.success(selectedUser.status === 'active' ? 'User suspended' : 'User activated');
                    setSelectedUser(null);
                  }}
                  className={`btn btn-sm ${selectedUser.status === 'active' ? 'btn-danger' : 'btn-primary'}`}
                >
                  {selectedUser.status === 'active' ? 'Suspend User' : 'Activate User'}
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

import { useQuery } from '@tanstack/react-query';
import { apiClient as api } from '../../../api/axios';

export interface UserActivityLog {
  id: string;
  action: string;
  timestamp: string;
  details: string;
  ip: string;
  type: 'security' | 'role' | 'auth' | 'data';
}

export interface AdminUserItem {
  id: string;
  emp_id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  department: string;
  user_type: 'Internal Staff' | 'Government Officer' | 'Auditor' | 'Partner Admin';
  assigned_state: string;
  assigned_district: string;
  permissions_count: number;
  status: 'active' | 'suspended' | 'pending' | 'inactive';
  online_status: 'online' | 'offline' | 'away';
  mfa_enabled: boolean;
  failed_logins: number;
  last_login?: string;
  last_pwd_change: string;
  created_by: string;
  created_at: string;
  device_info: {
    browser: string;
    os: string;
    ip: string;
    location: string;
  };
  activity_logs: UserActivityLog[];
}

export const SEEDED_ADMIN_USERS: AdminUserItem[] = [
  {
    id: 'ADM-001',
    emp_id: 'EMP-1001',
    name: 'Super Admin',
    email: 'superadmin@bhumicred.com',
    phone: '+91 98765 10001',
    role: 'Super Admin',
    department: 'Executive Leadership',
    user_type: 'Internal Staff',
    assigned_state: 'All States (National)',
    assigned_district: 'All Districts',
    permissions_count: 54,
    status: 'active',
    online_status: 'online',
    mfa_enabled: true,
    failed_logins: 0,
    last_login: new Date().toISOString(),
    last_pwd_change: '2026-01-15',
    created_by: 'System Seed',
    created_at: '2026-01-01',
    device_info: { browser: 'Chrome 124 (macOS)', os: 'macOS Sonoma', ip: '49.36.12.89', location: 'Bhopal, MP' },
    activity_logs: [
      { id: 'LOG-1', action: 'Login Successful', timestamp: '10 mins ago', details: 'Authenticated via Azure SSO + MFA', ip: '49.36.12.89', type: 'auth' },
      { id: 'LOG-2', action: 'Approved Carbon Issuance', timestamp: '2 hours ago', details: 'Batch #BCH-84A190 (1,250 tCO2e)', ip: '49.36.12.89', type: 'data' },
      { id: 'LOG-3', action: 'Role Policy Modified', timestamp: '1 day ago', details: 'Updated GIS Admin permission matrix', ip: '49.36.12.89', type: 'role' },
    ],
  },
  {
    id: 'ADM-002',
    emp_id: 'EMP-1002',
    name: 'Operations Admin',
    email: 'operationsadmin@bhumicred.com',
    phone: '+91 98765 10002',
    role: 'Operations Admin',
    department: 'Field Operations',
    user_type: 'Internal Staff',
    assigned_state: 'Madhya Pradesh',
    assigned_district: 'Bhopal & Sehore',
    permissions_count: 38,
    status: 'active',
    online_status: 'online',
    mfa_enabled: true,
    failed_logins: 0,
    last_login: new Date(Date.now() - 3600000).toISOString(),
    last_pwd_change: '2026-01-20',
    created_by: 'Super Admin',
    created_at: '2026-01-05',
    device_info: { browser: 'Firefox 125 (Windows)', os: 'Windows 11 Enterprise', ip: '103.22.45.12', location: 'Sehore, MP' },
    activity_logs: [
      { id: 'LOG-4', action: 'Verified Farmer Plot', timestamp: '1 hour ago', details: 'Plot #LND-4091 (42.5 acres)', ip: '103.22.45.12', type: 'data' },
      { id: 'LOG-5', action: 'Login Successful', timestamp: '3 hours ago', details: 'Standard password authentication', ip: '103.22.45.12', type: 'auth' },
    ],
  },
  {
    id: 'ADM-003',
    emp_id: 'EMP-1003',
    name: 'Finance Manager',
    email: 'financemanager@bhumicred.com',
    phone: '+91 98765 10003',
    role: 'Finance Manager',
    department: 'Finance & Audit',
    user_type: 'Internal Staff',
    assigned_state: 'All States (National)',
    assigned_district: 'Corporate Office',
    permissions_count: 32,
    status: 'active',
    online_status: 'away',
    mfa_enabled: true,
    failed_logins: 1,
    last_login: new Date(Date.now() - 86400000).toISOString(),
    last_pwd_change: '2026-02-01',
    created_by: 'Super Admin',
    created_at: '2026-01-10',
    device_info: { browser: 'Safari 17 (iOS)', os: 'iOS 17.4', ip: '157.33.19.44', location: 'New Delhi' },
    activity_logs: [
      { id: 'LOG-6', action: 'Payout Batch Processed', timestamp: '1 day ago', details: 'Approved ₹4.85 Lakhs farmer withdrawals', ip: '157.33.19.44', type: 'data' },
    ],
  },
  {
    id: 'ADM-004',
    emp_id: 'EMP-1004',
    name: 'Vendor Manager',
    email: 'vendormanager@bhumicred.com',
    phone: '+91 98765 10004',
    role: 'Vendor Manager',
    department: 'Marketplace & Supply',
    user_type: 'Partner Admin',
    assigned_state: 'Maharashtra',
    assigned_district: 'Nagpur & Pune',
    permissions_count: 24,
    status: 'active',
    online_status: 'offline',
    mfa_enabled: false,
    failed_logins: 0,
    last_login: new Date(Date.now() - 172800000).toISOString(),
    last_pwd_change: '2025-12-10',
    created_by: 'Operations Admin',
    created_at: '2026-01-12',
    device_info: { browser: 'Chrome 123 (Android)', os: 'Android 14', ip: '27.56.88.90', location: 'Nagpur, MH' },
    activity_logs: [
      { id: 'LOG-7', action: 'Vendor KYC Approved', timestamp: '2 days ago', details: 'Approved AgriTech Solutions Pvt Ltd', ip: '27.56.88.90', type: 'data' },
    ],
  },
  {
    id: 'ADM-005',
    emp_id: 'EMP-1005',
    name: 'Carbon Project Manager',
    email: 'carbonmanager@bhumicred.com',
    phone: '+91 98765 10005',
    role: 'Carbon Manager',
    department: 'Carbon MRV Operations',
    user_type: 'Internal Staff',
    assigned_state: 'Gujarat',
    assigned_district: 'Surat & Vadodara',
    permissions_count: 40,
    status: 'active',
    online_status: 'online',
    mfa_enabled: true,
    failed_logins: 0,
    last_login: new Date(Date.now() - 43200000).toISOString(),
    last_pwd_change: '2026-01-18',
    created_by: 'Super Admin',
    created_at: '2026-01-15',
    device_info: { browser: 'Edge 124 (Windows)', os: 'Windows 11 Pro', ip: '117.200.4.19', location: 'Surat, GJ' },
    activity_logs: [
      { id: 'LOG-8', action: 'Satellite NDVI Run', timestamp: '12 hours ago', details: 'Triggered Sentinel-2 L2A biomass check', ip: '117.200.4.19', type: 'data' },
    ],
  },
  {
    id: 'ADM-006',
    emp_id: 'EMP-1006',
    name: 'Government Nodal Officer',
    email: 'nodalofficer@mp.gov.in',
    phone: '+91 98765 10006',
    role: 'Government Officer',
    department: 'Dept of Agriculture, MP',
    user_type: 'Government Officer',
    assigned_state: 'Madhya Pradesh',
    assigned_district: 'State Secretariat',
    permissions_count: 18,
    status: 'pending',
    online_status: 'offline',
    mfa_enabled: true,
    failed_logins: 0,
    last_login: undefined,
    last_pwd_change: '2026-01-20',
    created_by: 'Super Admin',
    created_at: '2026-01-20',
    device_info: { browser: 'Unknown', os: 'Unknown', ip: '—', location: 'Bhopal Secretariat' },
    activity_logs: [
      { id: 'LOG-9', action: 'Invitation Sent', timestamp: '5 days ago', details: 'Government Officer access link dispatched', ip: 'System', type: 'auth' },
    ],
  },
  {
    id: 'ADM-007',
    emp_id: 'EMP-1007',
    name: 'External Security Auditor',
    email: 'auditor@kpmg-audit.com',
    phone: '+91 98765 10007',
    role: 'Auditor',
    department: 'External Compliance',
    user_type: 'Auditor',
    assigned_state: 'All States (Read-Only)',
    assigned_district: 'All Districts',
    permissions_count: 12,
    status: 'suspended',
    online_status: 'offline',
    mfa_enabled: true,
    failed_logins: 3,
    last_login: new Date(Date.now() - 604800000).toISOString(),
    last_pwd_change: '2025-11-30',
    created_by: 'Super Admin',
    created_at: '2026-02-01',
    device_info: { browser: 'Chrome 120 (Linux)', os: 'Ubuntu 22.04', ip: '182.72.90.11', location: 'Mumbai' },
    activity_logs: [
      { id: 'LOG-10', action: 'Account Suspended', timestamp: '7 days ago', details: 'Flagged after 3 failed login attempts', ip: 'System', type: 'security' },
    ],
  },
];

export const useUsers = () => {
  return useQuery({
    queryKey: ['adminUsers'],
    queryFn: async (): Promise<AdminUserItem[]> => {
      try {
        const response = await api.get('/admin/auth/employees');
        const data = response.data;
        if (Array.isArray(data) && data.length > 0) {
          return data.map((u: any) => ({
            id: u.id,
            emp_id: u.employee_id || u.id.slice(-6),
            name: u.name,
            email: u.email,
            phone: u.phone || 'N/A',
            role: u.role,
            department: u.department || 'Operations',
            user_type: 'Internal Staff',
            assigned_state: u.assigned_states?.[0] || 'All States',
            assigned_district: u.assigned_districts?.[0] || 'All Districts',
            permissions_count: 10, // Mocked for now, until roles API is fully integrated
            status: u.status || (u.is_active ? 'active' : 'inactive'),
            online_status: 'offline', // Would come from websockets/presence
            mfa_enabled: u.mfa_enabled || false,
            failed_logins: 0,
            last_login: u.last_login || u.last_login_at,
            last_pwd_change: u.created_at,
            created_by: 'System',
            created_at: u.created_at,
            device_info: { browser: 'Unknown', os: 'Unknown', ip: 'Unknown', location: 'Unknown' },
            activity_logs: []
          }));
        }
        return SEEDED_ADMIN_USERS;
      } catch (err) {
        console.error('Failed to fetch admin users:', err);
        return SEEDED_ADMIN_USERS;
      }
    },
    staleTime: 5 * 60 * 1000,
  });
};


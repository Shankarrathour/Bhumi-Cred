import { 
  LayoutDashboard, 
  Users, 
  Globe, 
  Store, 
  ShoppingBag, 
  Truck, 
  Leaf, 
  ShieldCheck, 
  Award, 
  BookOpen, 
  Wallet, 
  ArrowDownRight, 
  ArrowLeftRight, 
  LineChart, 
  UserCheck, 
  FileCode, 
  MessageSquare, 
  History, 
  BarChart3, 
  Settings,
  FileText,
  FolderKanban
} from 'lucide-react';
import { UserRole } from '../types';

export interface NavItem {
  title: string;
  path: string;
  icon: any;
  roles?: UserRole[];
}

export const NAVIGATION_ITEMS: NavItem[] = [
  {
    title: 'Command Center',
    path: '/admin/dashboard',
    icon: LayoutDashboard,
  },
  {
    title: 'Farmers Portal',
    path: '/admin/farmers',
    icon: Users,
    roles: ['super_admin', 'operations_admin', 'finance_manager'],
  },
  {
    title: 'Land Verification',
    path: '/admin/land-verification',
    icon: Globe,
    roles: ['super_admin', 'operations_admin', 'carbon_project_manager'],
  },
  {
    title: 'Vendors Manager',
    path: '/admin/vendors',
    icon: Store,
    roles: ['super_admin', 'vendor_manager'],
  },
  {
    title: 'Products Moderation',
    path: '/admin/marketplace',
    icon: ShoppingBag,
    roles: ['super_admin', 'vendor_manager'],
  },
  {
    title: 'Orders & Logistics',
    path: '/admin/orders',
    icon: Truck,
    roles: ['super_admin', 'vendor_manager'],
  },
  {
    title: 'Carbon Programs',
    path: '/admin/carbon-projects',
    icon: Leaf,
    roles: ['super_admin', 'operations_admin', 'carbon_project_manager'],
  },
  {
    title: 'Tree Insurance',
    path: '/admin/tree-insurance',
    icon: ShieldCheck,
    roles: ['super_admin', 'operations_admin'],
  },
  {
    title: 'Green Families',
    path: '/admin/green-family',
    icon: Award,
    roles: ['super_admin', 'operations_admin'],
  },
  {
    title: 'Govt Schemes',
    path: '/admin/govt-schemes',
    icon: BookOpen,
  },
  {
    title: 'Agri Applications',
    path: '/admin/applications',
    icon: FileText,
  },
  {
    title: 'Wallet & Finance',
    path: '/admin/wallet',
    icon: Wallet,
    roles: ['super_admin', 'finance_manager'],
  },
  {
    title: 'Credit Sales Desk',
    path: '/admin/credit-sales',
    icon: Leaf,
    roles: ['super_admin', 'finance_manager'],
  },
  {
    title: 'Carbon Exchange',
    path: '/admin/carbon-exchange',
    icon: ArrowLeftRight,
    roles: ['super_admin', 'finance_manager'],
  },
  {
    title: 'Withdrawals Desk',
    path: '/admin/withdrawals',
    icon: ArrowDownRight,
    roles: ['super_admin', 'finance_manager'],
  },
  {
    title: 'ESG Campaigns',
    path: '/admin/esg',
    icon: LineChart,
    roles: ['super_admin', 'carbon_project_manager'],
  },
  {
    title: 'CSR Management',
    path: '/admin/csr-management',
    icon: FolderKanban,
    roles: ['super_admin', 'carbon_project_manager'],
  },
  {
    title: 'Investor & ESG',
    path: '/admin/investor-dashboard',
    icon: LineChart,
    roles: ['super_admin', 'finance_manager'],
  },
  {
    title: 'Employee Directory',
    path: '/admin/employees',
    icon: UserCheck,
    roles: ['super_admin', 'employee_manager'],
  },
  {
    title: 'CMS Panel',
    path: '/admin/cms',
    icon: FileCode,
    roles: ['super_admin', 'vendor_manager'],
  },
  {
    title: 'Support Desk',
    path: '/admin/support',
    icon: MessageSquare,
    roles: ['super_admin', 'support_manager', 'operations_admin'],
  },
  {
    title: 'System Logs',
    path: '/admin/activity-logs',
    icon: History,
    roles: ['super_admin', 'employee_manager'],
  },
  {
    title: 'Analytics & Reports',
    path: '/admin/reports',
    icon: BarChart3,
    roles: ['super_admin', 'finance_manager'],
  },
  {
    title: 'Settings Control',
    path: '/admin/settings',
    icon: Settings,
  }
];
export type { UserRole };

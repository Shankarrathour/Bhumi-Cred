import { createBrowserRouter, Navigate } from 'react-router-dom';
import { DashboardLayout } from '../layouts/DashboardLayout';
import { ProtectedRoute } from './ProtectedRoute';
import { LoginPage } from '../pages/Login';
import { DashboardPage } from '../pages/Dashboard';
import { UsersPage } from '../pages/Users';
import { KYCPage } from '../pages/KYC';

import { ProductsModeration } from '../pages/ProductsModeration';
import { OrdersLogistics } from '../pages/OrdersLogistics';
import { EmployeesPage } from '../pages/Employees';
import { ReportsPage } from '../pages/Reports';
import { CMSPage } from '../pages/CMS';
import { AgriApplicationsPage } from '../pages/AgriApplications';
import { AgriApplicationDetailsPage } from '../pages/AgriApplicationDetails';
import { CreditSalesPage } from '../pages/CreditSales';
import { CarbonExchangePage } from '../pages/CarbonExchange';
import { TreeInsurancePage } from '../pages/TreeInsurance';
import { GovtSchemesPage } from '../pages/GovtSchemes';
import { GreenFamilyPage } from '../pages/GreenFamily';
import { CarbonProjectsPage } from '../pages/CarbonProjects';

import { LogsPage } from '../pages/Logs';
import { SettingsPage } from '../pages/Settings';
import { LoansPage } from '../pages/Loans';
import { PaymentsPage } from '../pages/Payments';
import { ReportApprovalPage } from '../pages/ReportApproval';
import { CSRManagementPage } from '../pages/CSRManagement';
import { InvestorDashboardPage } from '../pages/InvestorDashboard';
import { AdminNotifications } from '../pages/AdminNotifications';



export const router = createBrowserRouter([
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    path: '/',
    element: <Navigate to="/admin/dashboard" replace />,
  },
  {
    path: '/admin',
    element: (
      <ProtectedRoute>
        <DashboardLayout />
      </ProtectedRoute>
    ),
    children: [
      {
        path: 'dashboard',
        element: <DashboardPage />,
      },
      {
        path: 'farmers',
        element: <UsersPage />,
      },
      {
        path: 'land-verification',
        element: <KYCPage />,
      },

      {
        path: 'marketplace',
        element: <ProductsModeration />,
      },
      {
        path: 'orders',
        element: <OrdersLogistics />,
      },
      {
        path: 'carbon-projects',
        element: <CarbonProjectsPage />,
      },
      {
        path: 'tree-insurance',
        element: <TreeInsurancePage />,
      },
      {
        path: 'green-family',
        element: <GreenFamilyPage />,
      },
      {
        path: 'govt-schemes',
        element: <GovtSchemesPage />,
      },
      {
        path: 'wallet',
        element: <LoansPage />,
      },
      {
        path: 'withdrawals',
        element: <PaymentsPage />,
      },
      {
        path: 'esg',
        element: <ReportApprovalPage />,
      },
      {
        path: 'csr-management',
        element: <CSRManagementPage />,
      },
      {
        path: 'investor-dashboard',
        element: <InvestorDashboardPage />,
      },
      {
        path: 'employees',
        element: <EmployeesPage />,
      },
      {
        path: 'cms',
        element: <CMSPage />,
      },
      {
        path: 'applications',
        element: <AgriApplicationsPage />,
      },
      {
        path: 'applications/:id',
        element: <AgriApplicationDetailsPage />,
      },
      {
        path: 'credit-sales',
        element: <CreditSalesPage />,
      },
      {
        path: 'carbon-exchange',
        element: <CarbonExchangePage />,
      },

      {
        path: 'activity-logs',
        element: <LogsPage />,
      },
      {
        path: 'reports',
        element: <ReportsPage />,
      },
      {
        path: 'settings',
        element: <SettingsPage />,
      },
      {
        path: 'notifications',
        element: <AdminNotifications />,
      },
      {
        path: 'unauthorized',
        element: (
          <div className="flex flex-col items-center justify-center h-[500px] text-center bg-card border border-border p-8 shadow-sm">
            <h2 className="text-sm font-black text-destructive uppercase tracking-widest mb-3">Access Denied</h2>
            <p className="text-muted-foreground text-[8px] uppercase font-bold tracking-wider max-w-md">
              Your active control tier lacks authorization credentials to audit this registry. Please elevate your operational view mode.
            </p>
          </div>
        )
      }
    ],
  },
  {
    path: '*',
    element: <Navigate to="/admin/dashboard" replace />,
  },
]);

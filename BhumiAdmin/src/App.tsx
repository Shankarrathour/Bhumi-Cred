import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { theme } from './theme/muiTheme';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { MainLayout } from './layouts/MainLayout';
import { Dashboard } from './features/dashboard/pages/Dashboard';
import { FarmerList } from './features/farmers/pages/FarmerList';
import { FarmerProfile } from './features/farmers/pages/FarmerProfile';
import { GovtList } from './features/govt/pages/GovtList';
import { GovtDetails } from './features/govt/pages/GovtDetails';
import { GovtSchemesPage } from './pages/GovtSchemes';
import { CSRManagementPage } from './pages/CSRManagement';
import { InvestorDashboardPage } from './pages/InvestorDashboard';
import { PartnerList } from './features/partners/pages/PartnerList';
import { PartnerDetails } from './features/partners/pages/PartnerDetails';
import { DocumentCenter } from './features/documents/pages/DocumentCenter';
import { LandList } from './features/land/pages/LandList';
import { LandDetails } from './features/land/pages/LandDetails';
import { CommandCenter } from './features/command-center/pages/CommandCenter';
import { WalletDashboard } from './features/financials/pages/WalletDashboard';
import { TransactionDetails } from './features/financials/pages/TransactionDetails';
import { Marketplace } from './features/marketplace/pages/Marketplace';
import { ProjectManagement } from './features/projects/pages/ProjectManagement';
import { ProjectDetails } from './features/projects/pages/ProjectDetails';
import { CarbonRegistry } from './features/carbon/pages/CarbonRegistry';
import { CarbonCreditDetails } from './features/carbon/pages/CarbonCreditDetails';
import { CarbonExchangePage } from './pages/CarbonExchange';
import { TreeInsurance } from './features/insurance/pages/TreeInsurance';
import { InsuranceDetails } from './features/insurance/pages/InsuranceDetails';

import { ProductDetails } from './features/marketplace/pages/ProductDetails';
import { MrvDashboard } from './features/mrv/pages/MrvDashboard';
import { DroneDashboard } from './features/drone/pages/DroneDashboard';
import { KycCenter } from './features/kyc/pages/KycCenter';
import { SupportCenter } from './features/support/pages/SupportCenter';
import { CmsDashboard } from './features/cms/pages/CmsDashboard';
import { ReportsDashboard } from './features/reports/pages/ReportsDashboard';
import { AuditLogs } from './features/audit/pages/AuditLogs';
import { SystemSettings } from './features/settings/pages/SystemSettings';
import { NotificationsList } from './features/notifications/pages/NotificationsList';
import { UserList } from './features/users/pages/UserList';
import { Login } from './features/auth/pages/Login';
import { ProtectedRoute } from './components/ui/ProtectedRoute';
import { Provider } from 'react-redux';
import { store } from './store/store';
import { AuthProvider, PermissionGuard } from './context/AuthContext';
import { QueryProvider } from './context/QueryProvider';
import { Toaster } from 'react-hot-toast';

import { SidebarProvider } from './context/SidebarContext';

import { ReferralManagement } from './features/referrals/pages/ReferralManagement';

function App() {
  return (
    <Provider store={store}>
      <QueryProvider>
        <AuthProvider>
          <SidebarProvider>
            <ThemeProvider theme={theme}>
              <CssBaseline />
              <Toaster 
                position="top-right"
                toastOptions={{
                  className: 'text-xs font-bold font-mono select-none rounded-xl shadow-xl border border-[#E8EDF5] uppercase tracking-wider',
                  style: {
                    background: '#ffffff',
                    color: '#0F172A',
                    borderRadius: '12px',
                    border: '1px solid #E8EDF5'
                  },
                  success: {
                    iconTheme: {
                      primary: '#16A34A',
                      secondary: '#ffffff',
                    },
                  },
                }}
              />
              <BrowserRouter>
              <Routes>
                <Route path="/login" element={<Login />} />
                <Route element={<ProtectedRoute />}>
                  <Route path="/" element={<MainLayout />}>
                    <Route index element={<Dashboard />} />
                    <Route path="command-center" element={<CommandCenter />} />
                    <Route path="referrals" element={<ReferralManagement />} />
                    <Route 
                      path="users" 
                      element={
                        <PermissionGuard roles={['Super Admin', 'Operations Admin', 'super_admin', 'operations_admin']}>
                          <UserList />
                        </PermissionGuard>
                      } 
                    />
                    <Route path="farmers">
                      <Route index element={<FarmerList />} />
                      <Route path=":id" element={<FarmerProfile />} />
                    </Route>
                    <Route path="govt">
                      <Route index element={<GovtList />} />
                      <Route path=":id" element={<GovtDetails />} />
                    </Route>
                    <Route path="govt-schemes" element={<GovtSchemesPage />} />
                    <Route path="csr-management" element={<CSRManagementPage />} />
                    <Route path="investor-dashboard" element={<InvestorDashboardPage />} />
                    <Route path="partners">
                      <Route index element={<PartnerList />} />
                      <Route path=":id" element={<PartnerDetails />} />
                    </Route>
                    <Route path="documents" element={<DocumentCenter />} />
                    <Route path="projects">
                      <Route index element={<ProjectManagement />} />
                      <Route path=":id" element={<ProjectDetails />} />
                    </Route>
                    <Route path="land">
                      <Route index element={<LandList />} />
                      <Route path=":id" element={<LandDetails />} />
                    </Route>
                    <Route path="carbon">
                      <Route index element={<CarbonRegistry />} />
                      <Route path=":id" element={<CarbonCreditDetails />} />
                    </Route>
                    <Route path="carbon-exchange" element={<CarbonExchangePage />} />
                    <Route path="insurance">
                      <Route index element={<TreeInsurance />} />
                      <Route path=":id" element={<InsuranceDetails />} />
                    </Route>
                    <Route path="marketplace">
                      <Route index element={<Marketplace />} />
                      <Route path=":id" element={<ProductDetails />} />
                    </Route>
                    <Route path="wallet">
                      <Route index element={<WalletDashboard />} />
                      <Route path=":id" element={<TransactionDetails />} />
                    </Route>
                    <Route path="kyc" element={<KycCenter />} />
                    <Route path="cms" element={<CmsDashboard />} />
                    <Route path="notifications" element={<NotificationsList />} />
                    <Route path="reports" element={<ReportsDashboard />} />
                    <Route path="support" element={<SupportCenter />} />
                    <Route path="audit" element={<AuditLogs />} />
                    <Route path="mrv" element={<MrvDashboard />} />
                    <Route path="drone" element={<DroneDashboard />} />
                    <Route path="settings" element={<SystemSettings />} />
                  </Route>
                </Route>
              </Routes>
            </BrowserRouter>
          </ThemeProvider>
        </SidebarProvider>
      </AuthProvider>
    </QueryProvider>
  </Provider>
  );
}

export default App;

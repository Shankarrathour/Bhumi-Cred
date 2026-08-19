import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import adminApi, { setAdminTokens, setAdminCallbacks } from '../api/apiClient';
import {
  seedFarmers,
  seedLands,
  seedOrders,
} from '../data/mockData';
import { 
  Farmer, 
  Land, 
  Vendor, 
  Product, 
  CarbonProject, 
  InsurancePolicy, 
  InsuranceClaim, 
  WithdrawalRequest, 
  Order,
  SupportTicket, 
  Employee,
  ActivityLog,
  GatewayLog,
  CMSConfig,
  UserRole,
  OnboardingStatus,
  LandVerificationStatus,
  CarbonProjectPhase,
  InsurancePolicyStatus,
  ClaimStatus,
  WithdrawalStatus,
  TicketStatus
} from '../types';

// ── Backend → Frontend Farmer mapper ─────────────────────────────────────────
const KYC_MAP: Record<string, OnboardingStatus> = {
  unverified: 'Under Review',
  pending: 'Pending',
  approved: 'Approved',
  rejected: 'Rejected',
  blocked: 'Blocked',
};

function backendFarmerToFrontend(f: any): Farmer {
  return {
    id: f.id,
    farmerId: f.farmer_id,
    name: f.full_name || '',
    phone: f.mobile || '',
    email: f.email || '',
    location: {
      village: f.village || '',
      block: f.tehsil || f.vikash_khand || '',
      district: f.district || '',
      state: f.state || '',
    },
    kycStatus: KYC_MAP[f.kyc_status] ?? 'Under Review',
    isActive: f.is_active ?? true,
    kycDocuments: {
      aadharNumber: f.aadhaar_number || '',
      panNumber: f.pan_number || '',
      proofUrl: f.id_proof_url || '',
    },
    sustainabilityScore: f.sustainability_score ?? 0,
    registeredDate: f.created_at
      ? new Date(f.created_at).toISOString().split('T')[0]
      : new Date().toISOString().split('T')[0],
    totalAcreage: f.total_acreage ?? 0,
    totalTrees: f.total_trees ?? 0,
    carbonCreditsGenerated: f.carbon_credits_generated ?? 0,
    walletBalance: f.wallet_balance ?? 0,
  };
}

const WITHDRAWAL_STATUS_MAP: Record<string, WithdrawalStatus> = {
  pending: 'Pending Approval',
  approved: 'Disbursed',
  rejected: 'Rejected',
};

function backendWithdrawalToFrontend(w: any): WithdrawalRequest {
  return {
    id: w.id,
    farmerId: w.farmer_id,
    farmerName: w.farmer_name,
    amount: w.amount,
    paymentMethod: w.payment_method ?? 'bank',
    bankName: w.bank_name ?? undefined,
    accountNumber: w.account_number_masked ?? undefined,
    ifscCode: w.ifsc_code ?? undefined,
    accountHolderName: w.account_holder_name ?? undefined,
    isPrimaryAccount: w.is_primary_account ?? undefined,
    upiId: w.upi_id ?? undefined,
    requestedDate: w.created_at
      ? new Date(w.created_at).toISOString().split('T')[0]
      : new Date().toISOString().split('T')[0],
    status: WITHDRAWAL_STATUS_MAP[w.status] ?? 'Pending Approval',
    transactionHash: w.payout_reference ?? undefined,
    processedBy: w.processed_by ?? undefined,
    remarks: w.rejection_reason ?? undefined,
  };
}

function backendTicketToFrontend(t: any): SupportTicket {
  const messages = t.messages ?? [];
  // The first message is always the vendor's original ticket description (seeded at creation
  // time by the backend) — the admin UI displays it separately via `message`, not `responses`.
  const replies = messages.slice(1);
  return {
    id: t.id,
    userName: t.vendor_name,
    userType: 'Vendor',
    subject: t.subject,
    message: t.description,
    status: t.status,
    priority: t.priority,
    createdDate: t.created_at ? new Date(t.created_at).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
    responses: replies.map((m: any) => ({
      sender: m.sender_name,
      message: m.message,
      date: m.timestamp ? new Date(m.timestamp).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
    })),
  };
}

function backendAuditLogToFrontend(log: any): ActivityLog {
  return {
    id: log.id,
    // Backend sends an ISO-8601 datetime; render it the same "YYYY-MM-DD HH:MM:SS" shape
    // the rest of this table (and locally-appended entries) already use.
    timestamp: log.timestamp ? new Date(log.timestamp).toISOString().replace('T', ' ').substring(0, 19) : '',
    operator: log.actor_name,
    // The backend always populates actor_role for every actor type going forward. The
    // actor_type fallback (not a hardcoded role) only covers audit documents written
    // before that fix, where actor_type itself ('farmer' / 'vendor' / 'admin' / 'system')
    // is still an accurate description of who performed the action.
    role: (log.actor_role ?? log.actor_type) as ActivityLog['role'],
    action: log.action,
    ipAddress: log.ip_address ?? 'N/A',
    success: log.success ?? true,
  };
}

function backendGatewayLogToFrontend(log: any): GatewayLog {
  return {
    id: log.id,
    timestamp: log.timestamp ? new Date(log.timestamp).toISOString().replace('T', ' ').substring(0, 19) : '',
    method: log.method,
    endpoint: log.path,
    statusCode: log.status_code,
    responseTimeMs: log.response_time_ms,
    error: log.error ?? null,
  };
}

function backendVendorToFrontend(v: any): Vendor {
  return {
    id: v.id,
    vendorId: v.vendor_id,
    storeName: v.store_name || '',
    ownerName: v.name || '',
    email: v.email || '',
    phone: v.phone || '',
    category: v.category || 'Seeds & Organic',
    kycStatus: (v.status as OnboardingStatus) || 'Pending',
    verified: v.status === 'Active' || v.is_verified === true,
    revenueGenerated: v.revenue_generated || 0,
    rating: v.rating || 0,
    registeredDate: v.created_at
      ? new Date(v.created_at).toISOString().split('T')[0]
      : new Date().toISOString().split('T')[0],
    location: {
      state: v.state || '',
      district: v.district || '',
      block: v.tehsil || '',
      village: v.village_city || '',
    },
  };
}

function backendLandToFrontend(l: any): Land {
  return {
    id: l.id,
    farmerId: l.farmer_id,
    farmerName: l.farmer_name || 'Unknown Farmer',
    surveyNumber: l.survey_number || 'N/A',
    acreage: l.area_acres || 0,
    cropType: l.crop_type || 'Unknown',
    soilOrganicCarbon: l.soil_organic_carbon || 0.0,
    coordinates: l.coordinates ? [l.coordinates.latitude, l.coordinates.longitude] : [20.5937, 78.9629],
    boundaryPolygon: l.boundary_polygon ? l.boundary_polygon.map((c: any) => [c.latitude, c.longitude]) : [],
    proofDocumentUrl: l.land_document_url || '',
    status: l.verification_status,
    verifiedDate: l.verified_date ? new Date(l.verified_date).toISOString().split('T')[0] : undefined,
    remarks: l.remarks || undefined,
  };
}

function backendEmployeeToFrontend(e: any): Employee {
  return {
    id: e.id,
    name: e.name,
    email: e.email,
    role: e.role,
    isActive: e.is_active ?? true,
    onboardedDate: e.onboarded_date ? new Date(e.onboarded_date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
    lastLogin: e.last_login ? new Date(e.last_login).toISOString().replace('T', ' ').substring(0, 16) : 'Never',
  };
}

function backendProductToFrontend(p: any): Product {
  return {
    id: p.id || p._id,
    vendorId: p.vendor_id || '',
    vendorName: p.vendor_name || 'Vendor',
    title: p.title || p.name || '',
    description: p.description || '',
    price: p.price || 0,
    stock: p.stock || 0,
    imageUrl: p.image_url || p.images?.[0] || 'https://images.unsplash.com/photo-1615485290382-441e4d049cb5?w=500&auto=format&fit=crop&q=80',
    category: p.category_name || p.category || 'General',
    sustainabilityRating: p.sustainability_rating || 5,
    isApproved: p.is_approved ?? p.status === 'Approved',
    moderationStatus: p.status || (p.is_approved ? 'Approved' : 'Pending'),
    ecoBadges: p.eco_badges || ['Organic'],
    isFeatured: p.is_featured ?? false,
  };
}

function backendProjectToFrontend(p: any): CarbonProject {
  return {
    id: p.id || p._id,
    title: p.name || p.title || '',
    description: p.description || '',
    manager: p.manager_name || p.manager || 'Carbon Manager',
    assignedFarmerIds: p.assigned_farmer_ids || [],
    totalCreditsTarget: p.target_credits || p.totalCreditsTarget || 0,
    creditsIssued: p.issued_credits || p.creditsIssued || 0,
    phase: (p.status || p.phase) as CarbonProjectPhase || 'Registration',
    progressPercentage: p.progress_percentage || p.progressPercentage || 0,
    mrvReports: (p.mrv_reports || p.mrvReports || []).map((r: any) => ({
      reportId: r.report_id || r.reportId || '',
      auditor: r.auditor || '',
      date: r.date || '',
      pdfUrl: r.pdf_url || r.pdfUrl || '',
      status: r.status || 'Verified',
    })),
    startDate: p.created_at ? new Date(p.created_at).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
  };
}

function backendOrderToFrontend(o: any): Order {
  return {
    id: o.id || o.order_number || o._id,
    buyerName: o.farmer_name || o.buyer_name || 'Customer',
    farmerName: o.farmer_name,
    products: (o.items || o.products || []).map((i: any) => ({
      productId: i.product_id || i.productId || '',
      title: i.product_name || i.title || '',
      quantity: i.quantity || 1,
      price: i.unit_price || i.price || 0,
    })),
    totalAmount: o.total_amount || o.totalAmount || 0,
    shippingAddress: typeof o.shipping_address === 'string' ? o.shipping_address : (o.shipping_address?.full_address || 'N/A'),
    status: o.status === 'confirmed' ? 'Pending' : o.status === 'shipped' ? 'Shipped' : o.status === 'delivered' ? 'Delivered' : 'Pending',
    orderDate: o.created_at ? new Date(o.created_at).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
  };
}

function backendPolicyToFrontend(p: any): InsurancePolicy {
  return {
    id: p.id || p._id,
    farmerId: p.farmer_id || '',
    farmerName: p.farmer_name || 'Farmer',
    policyType: p.plan_name || p.policy_type || 'Green Family Plan',
    treeCount: p.tree_count || 0,
    premiumAmount: p.premium_amount || 0,
    coverageAmount: p.sum_insured || p.coverage_amount || 0,
    plantationDate: p.created_at ? new Date(p.created_at).toISOString().split('T')[0] : '',
    status: p.status === 'approved' ? 'Active' : p.status === 'pending' ? 'Pending Verification' : 'Active',
    greenFamilySerial: p.certificate_number,
  };
}

// ==========================================
// 1. AUTH & OPERATOR CONFIGURATION
// ==========================================
export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatarUrl: string;
}

interface AuthState {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isInitializing: boolean;
  accessToken: string | null;
  refreshToken: string | null;
  login: (params: { email: string; password: string; role: UserRole }) => Promise<void>;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      isInitializing: false,
      accessToken: null,
      refreshToken: null,

      login: async ({ email, password, role }) => {
        const { data } = await adminApi.post('/admin/auth/login', { email, password, role });
        const { tokens, admin } = data;

        setAdminTokens(tokens.access_token, tokens.refresh_token);
        setAdminCallbacks(
          (newAccess, newRefresh) => {
            setAdminTokens(newAccess, newRefresh);
            useAuthStore.setState({ accessToken: newAccess, refreshToken: newRefresh });
          },
          () => {
            setAdminTokens(null, null);
            useAuthStore.setState({ user: null, isAuthenticated: false, accessToken: null, refreshToken: null });
          },
        );

        set({
          user: {
            id: admin.id,
            name: admin.name,
            email: admin.email,
            role: admin.role as UserRole,
            avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&q=80',
          },
          isAuthenticated: true,
          accessToken: tokens.access_token,
          refreshToken: tokens.refresh_token,
        });

        await useEcosystemStore.getState().fetchFarmers();
        await useEcosystemStore.getState().fetchWithdrawals();
        await useEcosystemStore.getState().fetchLands();
        await useEcosystemStore.getState().fetchVendors();
        await useEcosystemStore.getState().fetchLocationTree();
      },

      logout: async () => {
        const { refreshToken } = get();
        try {
          if (refreshToken) {
            await adminApi.post('/admin/auth/logout', { refresh_token: refreshToken });
          }
        } catch {
          // Proceed regardless — clear local state.
        } finally {
          setAdminTokens(null, null);
          set({ user: null, isAuthenticated: false, accessToken: null, refreshToken: null });
        }
      },
    }),
    {
      name: 'bhumicred_admin_auth',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
      }),
      onRehydrateStorage: () => (state) => {
        if (state?.accessToken && state?.refreshToken) {
          setAdminTokens(state.accessToken, state.refreshToken);
          setAdminCallbacks(
            (newAccess, newRefresh) => {
              setAdminTokens(newAccess, newRefresh);
              useAuthStore.setState({ accessToken: newAccess, refreshToken: newRefresh });
            },
            () => {
              setAdminTokens(null, null);
              useAuthStore.setState({ user: null, isAuthenticated: false, accessToken: null, refreshToken: null });
            },
          );
        }
      },
    },
  )
);

// ==========================================
// 2. REGIONAL SCOPE SELECTOR
// ==========================================
interface ScopeState {
  activeRole: UserRole;
  activeState: string;
  activeDistrict: string;
  activeBlock: string;
  activeVillage: string;
  setActiveRole: (role: UserRole) => void;
  setActiveState: (state: string) => void;
  setActiveDistrict: (district: string) => void;
  setActiveBlock: (block: string) => void;
  setActiveVillage: (village: string) => void;
  resetScope: () => void;
}

export const useAdminStore = create<ScopeState>((set) => ({
  activeRole: 'super_admin',
  activeState: 'All States',
  activeDistrict: 'All Districts',
  activeBlock: 'All Blocks',
  activeVillage: 'All Villages',
  setActiveRole: (role) => {
    // Sync scope restrictions with the active role
    if (role === 'super_admin') {
      set({ activeRole: role, activeState: 'All States', activeDistrict: 'All Districts', activeBlock: 'All Blocks', activeVillage: 'All Villages' });
    } else if (role === 'carbon_project_manager') {
      set({ activeRole: role, activeState: 'Haryana', activeDistrict: 'Karnal', activeBlock: 'Gharaunda', activeVillage: 'All Villages' });
    } else if (role === 'operations_admin') {
      set({ activeRole: role, activeState: 'Uttar Pradesh', activeDistrict: 'Varanasi', activeBlock: 'Harahua', activeVillage: 'All Villages' });
    } else {
      set({ activeRole: role });
    }
  },
  setActiveState: (state) => set({ activeState: state }),
  setActiveDistrict: (district) => set({ activeDistrict: district }),
  setActiveBlock: (block) => set({ activeBlock: block }),
  setActiveVillage: (village) => set({ activeVillage: village }),
  resetScope: () => set({
    activeState: 'All States',
    activeDistrict: 'All Districts',
    activeBlock: 'All Blocks',
    activeVillage: 'All Villages'
  })
}));

// ==========================================
// 3. CENTRAL PERSISTENT ECOSYSTEM DB
// ==========================================
interface EcosystemState {
  farmers: Farmer[];
  lands: Land[];
  vendors: Vendor[];
  products: Product[];
  carbonProjects: CarbonProject[];
  insurancePolicies: InsurancePolicy[];
  insuranceClaims: InsuranceClaim[];
  withdrawals: WithdrawalRequest[];
  orders: Order[];
  supportTickets: SupportTicket[];
  employees: Employee[];
  activityLogs: ActivityLog[];
  activityLogsError: string | null;
  gatewayLogs: GatewayLog[];
  cmsConfig: CMSConfig;
  notifications: { id: string; message: string; date: string; type: 'info' | 'success' | 'warning' }[];
  locationTree: {
    statesAndDistricts: Record<string, string[]>;
    districtBlocks: Record<string, string[]>;
    blockVillages: Record<string, string[]>;
  };

  // 🔄 Data Sync
  fetchFarmers: (params?: {
    page?: number;
    limit?: number;
    search?: string;
    state?: string;
    district?: string;
    kyc_status?: string;
    is_active?: boolean;
  }) => Promise<{ total: number; page: number; limit: number; totalPages: number }>;
  fetchLands: () => Promise<void>;
  fetchVendors: () => Promise<void>;
  fetchProducts: () => Promise<void>;
  fetchCarbonProjects: () => Promise<void>;
  fetchInsurancePolicies: () => Promise<void>;
  fetchOrders: () => Promise<void>;
  fetchEmployees: () => Promise<void>;
  fetchCMSConfig: () => Promise<void>;
  fetchWithdrawals: () => Promise<void>;
  fetchSupportTickets: () => Promise<void>;
  fetchActivityLogs: () => Promise<void>;
  fetchGatewayLogs: () => Promise<void>;
  fetchLocationTree: () => Promise<void>;

  // 📝 Farmer Operations
  updateFarmerKYC: (farmerId: string, status: OnboardingStatus) => void;
  updateFarmerSustainabilityScore: (farmerId: string, score: number) => void;
  blockFarmer: (farmerId: string, isBlocked: boolean) => void;

  // 🗺️ Land Operations
  verifyLand: (landId: string, status: LandVerificationStatus, remarks?: string) => Promise<void>;
  geoTagSimulate: (landId: string, coordinates: [number, number], polygon: [number, number][]) => void;

  // 🏪 Vendor & Product Operations
  updateVendorStatus: (vendorId: string, status: OnboardingStatus) => void;
  moderateProduct: (productId: string, status: 'Approved' | 'Rejected') => void;
  toggleFeaturedProduct: (productId: string) => void;

  // 🌲 Carbon Project Operations
  createCarbonProject: (project: Omit<CarbonProject, 'id' | 'assignedFarmerIds' | 'creditsIssued' | 'progressPercentage' | 'mrvReports'>) => void;
  assignFarmerToProject: (projectId: string, farmerId: string) => void;
  updateProjectPhase: (projectId: string, phase: CarbonProjectPhase) => void;
  addMRVReport: (projectId: string, report: { auditor: string; date: string; pdfUrl: string; status: 'Verified' | 'Flagged' }) => void;

  // 🛡️ Tree Insurance & Green Family Operations
  verifyInsurancePolicy: (policyId: string, status: InsurancePolicyStatus) => void;
  issueGreenFamilyCertificate: (policyId: string, serial: string) => void;
  moderateInsuranceClaim: (claimId: string, status: ClaimStatus, remarks?: string) => void;

  // 💰 Wallet & Payout Operations
  processWithdrawal: (withdrawalId: string, status: WithdrawalStatus, processedBy: string, remarks?: string) => void;
  adjustFarmerBalance: (farmerId: string, amount: number, type: 'credit' | 'debit') => void;

  // 👥 Employee RBAC Operations
  addEmployee: (employee: Omit<Employee, 'id' | 'onboardedDate' | 'lastLogin'>) => void;
  toggleEmployeeStatus: (employeeId: string) => void;
  updateEmployeeRole: (employeeId: string, role: UserRole) => void;

  // 💬 Citizen Support CRM Operations
  addTicketResponse: (ticketId: string, sender: string, message: string) => void;
  updateTicketStatus: (ticketId: string, status: TicketStatus) => void;

  // 🖥️ Content Management Operations
  updateAnnouncementMarquee: (text: string, isActive: boolean) => void;
  addCMSBanner: (title: string, imageUrl: string, linkUrl: string) => void;
  toggleCMSBanner: (bannerId: string) => void;

  // 📜 Log Audit Operations
  addActivityLog: (operatorName: string, role: UserRole, actionText: string) => void;
}

export const useEcosystemStore = create<EcosystemState>()(
  persist(
    (set, get) => ({
      farmers: [],
      lands: [],
      vendors: [],
      products: [],
      carbonProjects: [],
      insurancePolicies: [],
      insuranceClaims: [],
      withdrawals: [],
      orders: [],
      supportTickets: [],
      employees: [],
      activityLogs: [],
      activityLogsError: null,
      gatewayLogs: [],
      cmsConfig: {
        banners: [],
        announcementMarquee: '',
        isMarqueeActive: false,
        featuredCampaigns: [],
      },
      notifications: [],
      locationTree: {
        statesAndDistricts: {},
        districtBlocks: {},
        blockVillages: {},
      },

      // 🔄 Data Sync
      fetchFarmers: async (params) => {
        try {
          const queryParams: Record<string, any> = {
            page: params?.page ?? 1,
            limit: params?.limit ?? 12,
          };
          if (params?.search) queryParams.search = params.search;
          if (params?.state && params.state !== 'All States') queryParams.state = params.state;
          if (params?.district && params.district !== 'All Districts') queryParams.district = params.district;
          if (params?.kyc_status && params.kyc_status !== 'All') queryParams.kyc_status = params.kyc_status;
          if (params?.is_active !== undefined) queryParams.is_active = params.is_active;

          const { data: response } = await adminApi.get('/admin/farmers', {
            params: queryParams,
          });

          const rawData = response?.data ?? [];
          const meta = response?.meta ?? { total: rawData.length, page: queryParams.page, limit: queryParams.limit, total_pages: 1 };
          const backendFarmers: Farmer[] = rawData.map(backendFarmerToFrontend);
          
          set({ farmers: backendFarmers });
          return {
            total: meta.total ?? backendFarmers.length,
            page: meta.page ?? 1,
            limit: meta.limit ?? 12,
            totalPages: meta.total_pages ?? 1,
          };
        } catch (err) {
          console.warn('[ecosystemStore] fetchFarmers failed:', err);
          return {
            total: 0,
            page: 1,
            limit: 12,
            totalPages: 1,
          };
        }
      },

      fetchLands: async () => {
        try {
          const { data: response } = await adminApi.get('/admin/lands', {
            params: { limit: 100 },
          });
          const backendLands: Land[] = (response.data ?? []).map(backendLandToFrontend);
          set({ lands: backendLands });
        } catch (err) {
          console.warn('[ecosystemStore] fetchLands failed:', err);
          if (get().lands.length === 0) {
            set({ lands: seedLands });
          }
        }
      },

      fetchVendors: async () => {
        try {
          const { data } = await adminApi.get('/admin/vendors');
          const vendors: Vendor[] = (data ?? []).map(backendVendorToFrontend);
          set({ vendors });
        } catch (err) {
          console.warn('[ecosystemStore] fetchVendors failed:', err);
        }
      },

      fetchProducts: async () => {
        try {
          const { data } = await adminApi.get('/marketplace/products');
          const prods = (Array.isArray(data) ? data : data?.data || []).map(backendProductToFrontend);
          set({ products: prods });
        } catch (err) {
          console.warn('[ecosystemStore] fetchProducts failed:', err);
        }
      },

      fetchCarbonProjects: async () => {
        try {
          const { data } = await adminApi.get('/admin/projects');
          const projects = (Array.isArray(data) ? data : data?.data || []).map(backendProjectToFrontend);
          set({ carbonProjects: projects });
        } catch (err) {
          console.warn('[ecosystemStore] fetchCarbonProjects failed:', err);
        }
      },

      fetchInsurancePolicies: async () => {
        try {
          const { data } = await adminApi.get('/admin/green-family');
          const policies = (Array.isArray(data) ? data : data?.data || []).map(backendPolicyToFrontend);
          set({ insurancePolicies: policies });
        } catch (err) {
          console.warn('[ecosystemStore] fetchInsurancePolicies failed:', err);
        }
      },

      fetchOrders: async () => {
        try {
          const { data } = await adminApi.get('/admin/marketplace-orders');
          const rawList = Array.isArray(data) ? data : data?.data || [];
          const apiOrders: Order[] = rawList.map(backendOrderToFrontend);
          if (apiOrders.length > 0) {
            set({ orders: apiOrders });
          } else if (get().orders.length === 0) {
            set({ orders: seedOrders });
          }
        } catch (err) {
          console.warn('[ecosystemStore] fetchOrders failed:', err);
          if (get().orders.length === 0) {
            set({ orders: seedOrders });
          }
        }
      },

      fetchEmployees: async () => {
        try {
          const { data } = await adminApi.get('/admin/auth/employees');
          const employees = (Array.isArray(data) ? data : []).map(backendEmployeeToFrontend);
          set({ employees });
        } catch (err) {
          console.warn('[ecosystemStore] fetchEmployees failed:', err);
        }
      },

      fetchCMSConfig: async () => {
        try {
          const [cmsRes, bannersRes] = await Promise.allSettled([
            adminApi.get('/cms/user-dashboard'),
            adminApi.get('/admin/banners'),
          ]);

          const cmsData = cmsRes.status === 'fulfilled' ? cmsRes.value.data : null;
          const bannersData = bannersRes.status === 'fulfilled' ? bannersRes.value.data : [];

          const currentConfig = get().cmsConfig;
          const updatedBanners = Array.isArray(bannersData) && bannersData.length > 0
            ? bannersData.map((b: any) => ({
                id: b.id || b._id,
                title: b.title || '',
                imageUrl: b.image_url || b.imageUrl || '',
                linkUrl: b.target_url || b.linkUrl || '',
                isActive: b.is_active ?? true,
              }))
            : currentConfig.banners;

          set({
            cmsConfig: {
              ...currentConfig,
              banners: updatedBanners,
              announcementMarquee: cmsData?.announcement || currentConfig.announcementMarquee || 'Join the Carbon Revolution: Monsoon Program Active!',
              isMarqueeActive: cmsData?.is_announcement_active ?? true,
            }
          });
        } catch (err) {
          console.warn('[ecosystemStore] fetchCMSConfig failed:', err);
        }
      },

      fetchLocationTree: async () => {
        try {
          const { data: response } = await adminApi.get('/admin/farmers/locations');
          const tree = response.data ?? {};
          set({
            locationTree: {
              statesAndDistricts: tree.states_and_districts ?? {},
              districtBlocks: tree.district_blocks ?? {},
              blockVillages: tree.block_villages ?? {},
            },
          });
        } catch (err) {
          console.warn('[ecosystemStore] fetchLocationTree failed:', err);
        }
      },

      fetchWithdrawals: async () => {
        try {
          const { data: response } = await adminApi.get('/admin/withdrawals', {
            params: { limit: 100 },
          });
          const withdrawals: WithdrawalRequest[] = (response.data ?? []).map(backendWithdrawalToFrontend);
          set({ withdrawals });
        } catch (err) {
          console.warn('[ecosystemStore] fetchWithdrawals failed:', err);
        }
      },

      fetchSupportTickets: async () => {
        try {
          const { data: response } = await adminApi.get('/admin/support', {
            params: { limit: 100 },
          });
          const supportTickets: SupportTicket[] = (response.data ?? []).map(backendTicketToFrontend);
          set({ supportTickets });
        } catch (err) {
          console.warn('[ecosystemStore] fetchSupportTickets failed:', err);
        }
      },

      fetchActivityLogs: async () => {
        try {
          const { data: response } = await adminApi.get('/admin/activity-logs/security-audit', {
            params: { limit: 100 },
          });
          const logs: ActivityLog[] = (response.data ?? []).map(backendAuditLogToFrontend);
          set({ activityLogs: logs, activityLogsError: null });
        } catch (err) {
          console.warn('[ecosystemStore] fetchActivityLogs failed:', err);
          set({ activityLogsError: 'Unable to load audit log data from the server.' });
        }
      },

      fetchGatewayLogs: async () => {
        try {
          const { data: response } = await adminApi.get('/admin/activity-logs/gateway-stream', {
            params: { limit: 50 },
          });
          const logs: GatewayLog[] = (response.data ?? []).map(backendGatewayLogToFrontend);
          set({ gatewayLogs: logs });
        } catch (err) {
          console.warn('[ecosystemStore] fetchGatewayLogs failed:', err);
        }
      },

      // 📝 Farmer Operations
      updateFarmerKYC: (farmerId: string, status: OnboardingStatus) => {
        set((state: EcosystemState) => {
          const updatedFarmers = state.farmers.map((f: Farmer) => 
            f.id === farmerId ? { ...f, kycStatus: status } : f
          );
          return { farmers: updatedFarmers };
        });
        const farmerName = get().farmers.find((f: Farmer) => f.id === farmerId)?.name || 'Farmer';
        get().addActivityLog(
          useAuthStore.getState().user?.name || 'Admin',
          useAdminStore.getState().activeRole,
          `Modified KYC status of ${farmerName} (${farmerId}) to ${status}`
        );
      },

      updateFarmerSustainabilityScore: (farmerId: string, score: number) => {
        set((state: EcosystemState) => ({
          farmers: state.farmers.map((f: Farmer) => f.id === farmerId ? { ...f, sustainabilityScore: score } : f)
        }));
        const farmerName = get().farmers.find((f: Farmer) => f.id === farmerId)?.name || 'Farmer';
        get().addActivityLog(
          useAuthStore.getState().user?.name || 'Admin',
          useAdminStore.getState().activeRole,
          `Recalculated sustainability score of ${farmerName} to ${score}%`
        );
      },

      blockFarmer: (farmerId: string, isBlocked: boolean) => {
        set((state: EcosystemState) => ({
          farmers: state.farmers.map((f: Farmer) => 
            f.id === farmerId ? { ...f, kycStatus: isBlocked ? 'Blocked' as OnboardingStatus : 'Approved' as OnboardingStatus } : f
          )
        }));
        const farmerName = get().farmers.find((f: Farmer) => f.id === farmerId)?.name || 'Farmer';
        get().addActivityLog(
          useAuthStore.getState().user?.name || 'Admin',
          useAdminStore.getState().activeRole,
          `${isBlocked ? 'Blocked' : 'Unblocked'} access credentials for farmer ${farmerName}`
        );
      },

      // 🗺️ Land Operations
      verifyLand: async (landId: string, status: LandVerificationStatus, remarks?: string) => {
        try {
          await adminApi.put(`/admin/lands/${landId}/status`, { status, remarks });
        } catch (err) {
          console.warn('[ecosystemStore] verifyLand failed:', err);
          return;
        }

        set((state: EcosystemState) => ({
          lands: state.lands.map((l: Land) => 
            l.id === landId ? { ...l, status, remarks, verifiedDate: status === 'Verified' ? new Date().toISOString().split('T')[0] : undefined } : l
          )
        }));

        const land = get().lands.find((l: Land) => l.id === landId);
        if (land) {
          get().addActivityLog(
            useAuthStore.getState().user?.name || 'Admin',
            useAdminStore.getState().activeRole,
            `Logged GIS audit status for Land Survey ${land.surveyNumber} as ${status}. Remarks: ${remarks || 'None'}`
          );

          // If verifying land, adjust farmer's total acreage, and update score
          if (status === 'Verified') {
            set((state: EcosystemState) => ({
              farmers: state.farmers.map((f: Farmer) => 
                f.id === land.farmerId ? { ...f, totalAcreage: f.totalAcreage + land.acreage } : f
              )
            }));
          }
        }
      },

      geoTagSimulate: (landId: string, coordinates: [number, number], polygon: [number, number][]) => {
        set((state: EcosystemState) => ({
          lands: state.lands.map((l: Land) => 
            l.id === landId ? { ...l, coordinates, boundaryPolygon: polygon } : l
          )
        }));
        get().addActivityLog(
          useAuthStore.getState().user?.name || 'Admin',
          useAdminStore.getState().activeRole,
          `Simulated GIS boundaries and geo-tags for Land ID ${landId}`
        );
      },

      // 🏪 Vendor & Product Operations
      updateVendorStatus: (vendorId: string, status: OnboardingStatus) => {
        set((state: EcosystemState) => ({
          vendors: state.vendors.map((v: Vendor) => 
            v.id === vendorId ? { ...v, kycStatus: status, verified: status === 'Approved' } : v
          )
        }));
        const vendor = get().vendors.find((v: Vendor) => v.id === vendorId);
        if (vendor) {
          get().addActivityLog(
            useAuthStore.getState().user?.name || 'Admin',
            useAdminStore.getState().activeRole,
            `Moderated climate vendor profile ${vendor.storeName}: Set status to ${status}`
          );
        }
      },

      moderateProduct: (productId: string, status: 'Approved' | 'Rejected') => {
        set((state: EcosystemState) => ({
          products: state.products.map((p: Product) => 
            p.id === productId ? { ...p, moderationStatus: status, isApproved: status === 'Approved' } : p
          )
        }));
        const product = get().products.find((p: Product) => p.id === productId);
        if (product) {
          get().addActivityLog(
            useAuthStore.getState().user?.name || 'Admin',
            useAdminStore.getState().activeRole,
            `Moderated marketplace product listing [${product.title}] as ${status}`
          );
        }
      },

      toggleFeaturedProduct: (productId: string) => {
        set((state: EcosystemState) => ({
          products: state.products.map((p: Product) => 
            p.id === productId ? { ...p, isFeatured: !p.isFeatured } : p
          )
        }));
      },

      // 🌲 Carbon Project Operations
      createCarbonProject: (proj: Omit<CarbonProject, 'id' | 'assignedFarmerIds' | 'creditsIssued' | 'progressPercentage' | 'mrvReports'>) => {
        const newProj: CarbonProject = {
          ...proj,
          id: `PRJ-00${get().carbonProjects.length + 1}`,
          assignedFarmerIds: [],
          creditsIssued: 0,
          progressPercentage: 0,
          mrvReports: []
        };
        set((state: EcosystemState) => ({
          carbonProjects: [...state.carbonProjects, newProj]
        }));
        get().addActivityLog(
          useAuthStore.getState().user?.name || 'Admin',
          useAdminStore.getState().activeRole,
          `Configured and registered new voluntary carbon project: ${proj.title}`
        );
      },

      assignFarmerToProject: (projectId: string, farmerId: string) => {
        set((state: EcosystemState) => ({
          carbonProjects: state.carbonProjects.map((p: CarbonProject) => {
            if (p.id === projectId && !p.assignedFarmerIds.includes(farmerId)) {
              return { ...p, assignedFarmerIds: [...p.assignedFarmerIds, farmerId] };
            }
            return p;
          })
        }));
        const pTitle = get().carbonProjects.find((p: CarbonProject) => p.id === projectId)?.title || 'Project';
        const fName = get().farmers.find((f: Farmer) => f.id === farmerId)?.name || 'Farmer';
        get().addActivityLog(
          useAuthStore.getState().user?.name || 'Admin',
          useAdminStore.getState().activeRole,
          `Assigned farmer ${fName} to voluntary project [${pTitle}]`
        );
      },

      updateProjectPhase: (projectId: string, phase: CarbonProjectPhase) => {
        let progress = 5;
        if (phase === 'Registration') progress = 20;
        else if (phase === 'Active MRV') progress = 60;
        else if (phase === 'Credit Issuance') progress = 100;

        set((state: EcosystemState) => ({
          carbonProjects: state.carbonProjects.map((p: CarbonProject) => 
            p.id === projectId ? { ...p, phase, progressPercentage: progress } : p
          )
        }));

        const pTitle = get().carbonProjects.find((p: CarbonProject) => p.id === projectId)?.title || 'Project';
        get().addActivityLog(
          useAuthStore.getState().user?.name || 'Admin',
          useAdminStore.getState().activeRole,
          `Shifted voluntary project [${pTitle}] operational phase to ${phase}`
        );

        // If phase becomes credit issuance, issue credits to assigned farmers!
        if (phase === 'Credit Issuance') {
          const project = get().carbonProjects.find((p: CarbonProject) => p.id === projectId);
          if (project) {
            const issuedPerFarmer = Math.floor(project.totalCreditsTarget / Math.max(project.assignedFarmerIds.length, 1));
            set((state: EcosystemState) => ({
              farmers: state.farmers.map((f: Farmer) => {
                if (project.assignedFarmerIds.includes(f.id)) {
                  // Increment carbon credits & add cash equivalents to balance (1 credit = INR 400)
                  return { 
                    ...f, 
                    carbonCreditsGenerated: f.carbonCreditsGenerated + issuedPerFarmer,
                    walletBalance: f.walletBalance + (issuedPerFarmer * 400)
                  };
                }
                return f;
              }),
              carbonProjects: state.carbonProjects.map((p: CarbonProject) => 
                p.id === projectId ? { ...p, creditsIssued: p.totalCreditsTarget } : p
              )
            }));
            
            get().addActivityLog(
              'Carbon Credit Engine',
              'super_admin',
              `Disbursed carbon credits payout: Minted ${project.totalCreditsTarget} total credits across assigned farmers. Wallet balances credited.`
            );
          }
        }
      },

      addMRVReport: (projectId: string, report: { auditor: string; date: string; pdfUrl: string; status: 'Verified' | 'Flagged' }) => {
        const reportId = `MRV-RPT-00${(get().carbonProjects.find((p: CarbonProject) => p.id === projectId)?.mrvReports.length || 0) + 1}`;
        const newReport = {
          reportId,
          ...report
        };
        set((state: EcosystemState) => ({
          carbonProjects: state.carbonProjects.map((p: CarbonProject) => 
            p.id === projectId ? { ...p, mrvReports: [...p.mrvReports, newReport] } : p
          )
        }));
        const pTitle = get().carbonProjects.find((p: CarbonProject) => p.id === projectId)?.title || 'Project';
        get().addActivityLog(
          useAuthStore.getState().user?.name || 'Admin',
          useAdminStore.getState().activeRole,
          `Appended MRV environmental inspection report ${reportId} for project [${pTitle}]`
        );
      },

      // 🛡️ Tree Insurance & Green Family Operations
      verifyInsurancePolicy: (policyId: string, status: InsurancePolicyStatus) => {
        set((state: EcosystemState) => ({
          insurancePolicies: state.insurancePolicies.map((p: InsurancePolicy) => 
            p.id === policyId ? { ...p, status } : p
          )
        }));
        const policy = get().insurancePolicies.find((p: InsurancePolicy) => p.id === policyId);
        if (policy) {
          get().addActivityLog(
            useAuthStore.getState().user?.name || 'Admin',
            useAdminStore.getState().activeRole,
            `Authorized tree plantation insurance coverage POL-${policyId} as ${status}`
          );

          if (status === 'Active') {
            // Subtract premium from farmer wallet balance
            set((state: EcosystemState) => ({
              farmers: state.farmers.map((f: Farmer) => 
                f.id === policy.farmerId ? { ...f, walletBalance: Math.max(0, f.walletBalance - policy.premiumAmount) } : f
              )
            }));
            // Auto issue Green Family certificate
            const serial = `GF-${policy.farmerId.split('-')[1]}-${Math.floor(100000 + Math.random() * 900000)}`;
            get().issueGreenFamilyCertificate(policyId, serial);
          }
        }
      },

      issueGreenFamilyCertificate: (policyId: string, serial: string) => {
        set((state: EcosystemState) => ({
          insurancePolicies: state.insurancePolicies.map((p: InsurancePolicy) => 
            p.id === policyId ? { ...p, greenFamilySerial: serial } : p
          )
        }));
        get().addActivityLog(
          'Green Certification Registry',
          'super_admin',
          `Emitted voluntary environmental family credential certificate ${serial} linked to policy POL-${policyId}`
        );
      },

      moderateInsuranceClaim: (claimId: string, status: ClaimStatus, remarks?: string) => {
        set((state: EcosystemState) => ({
          insuranceClaims: state.insuranceClaims.map((c: InsuranceClaim) => 
            c.id === claimId ? { ...c, status, remarks } : c
          )
        }));

        const claim = get().insuranceClaims.find((c: InsuranceClaim) => c.id === claimId);
        if (claim) {
          get().addActivityLog(
            useAuthStore.getState().user?.name || 'Admin',
            useAdminStore.getState().activeRole,
            `Moderated disaster claim ${claimId} with audit result: ${status}. Remarks: ${remarks || 'None'}`
          );

          // If claim is approved, pay coverage amount to farmer's wallet
          if (status === 'Approved') {
            set((state: EcosystemState) => ({
              farmers: state.farmers.map((f: Farmer) => 
                f.id === claim.farmerId ? { ...f, walletBalance: f.walletBalance + claim.requestedAmount } : f
              ),
              insuranceClaims: state.insuranceClaims.map((c: InsuranceClaim) => 
                c.id === claimId ? { ...c, status: 'Paid' } : c
              ),
              insurancePolicies: state.insurancePolicies.map((p: InsurancePolicy) => 
                p.id === claim.policyId ? { ...p, status: 'Claimed' } : p
              )
            }));
            get().addActivityLog(
              'Finance Ledger Engine',
              'finance_manager',
              `Disbursed climate claim payout of INR ${claim.requestedAmount} to farmer ${claim.farmerName}`
            );
          }
        }
      },

      // 💰 Wallet & Payout Operations
      processWithdrawal: (withdrawalId: string, status: WithdrawalStatus, processedBy: string, remarks?: string) => {
        (async () => {
          try {
            if (status === 'Disbursed') {
              await adminApi.put(`/admin/withdrawals/${withdrawalId}/approve`, { remarks: remarks ?? '' });
            } else if (status === 'Rejected') {
              await adminApi.put(`/admin/withdrawals/${withdrawalId}/reject`, {
                reason: remarks?.trim() || 'Rejected by admin',
              });
            }
            await get().fetchWithdrawals();
            get().addActivityLog(
              processedBy,
              useAdminStore.getState().activeRole,
              `Finance ledger audited: Withdrawal request ${withdrawalId} set to ${status}. Remarks: ${remarks || 'None'}`
            );
          } catch (err) {
            console.warn('[processWithdrawal] backend call failed:', err);
          }
        })();
      },

      adjustFarmerBalance: (farmerId: string, amount: number, type: 'credit' | 'debit') => {
        set((state: EcosystemState) => ({
          farmers: state.farmers.map((f: Farmer) => 
            f.id === farmerId ? { 
              ...f, 
              walletBalance: type === 'credit' ? f.walletBalance + amount : Math.max(0, f.walletBalance - amount) 
            } : f
          )
        }));
      },

      // 👥 Employee RBAC Operations
      addEmployee: (emp: Omit<Employee, 'id' | 'onboardedDate' | 'lastLogin'>) => {
        const id = `EMP-00${get().employees.length + 1}`;
        const newEmp: Employee = {
          ...emp,
          id,
          onboardedDate: new Date().toISOString().split('T')[0],
          lastLogin: 'Never logged in'
        };
        set((state: EcosystemState) => ({
          employees: [...state.employees, newEmp]
        }));
        get().addActivityLog(
          useAuthStore.getState().user?.name || 'Admin',
          useAdminStore.getState().activeRole,
          `Provisioned system admin access credentials for ${emp.name} as ${emp.role}`
        );
      },

      toggleEmployeeStatus: (employeeId: string) => {
        set((state: EcosystemState) => ({
          employees: state.employees.map((e: Employee) => 
            e.id === employeeId ? { ...e, isActive: !e.isActive } : e
          )
        }));
        const empName = get().employees.find((e: Employee) => e.id === employeeId)?.name || 'Employee';
        get().addActivityLog(
          useAuthStore.getState().user?.name || 'Admin',
          useAdminStore.getState().activeRole,
          `Toggled login permission status for internal employee ${empName}`
        );
      },

      updateEmployeeRole: (employeeId: string, role: UserRole) => {
        set((state: EcosystemState) => ({
          employees: state.employees.map((e: Employee) => 
            e.id === employeeId ? { ...e, role } : e
          )
        }));
        const empName = get().employees.find((e: Employee) => e.id === employeeId)?.name || 'Employee';
        get().addActivityLog(
          useAuthStore.getState().user?.name || 'Admin',
          useAdminStore.getState().activeRole,
          `Elevated internal user role of ${empName} to ${role}`
        );
      },

      // 💬 Citizen Support CRM Operations
      addTicketResponse: (ticketId: string, sender: string, message: string) => {
        // Optimistic local update first — Support.tsx reads getState().supportTickets
        // synchronously right after calling this, so the mutation must be visible immediately.
        set((state: EcosystemState) => ({
          supportTickets: state.supportTickets.map((t: SupportTicket) => {
            if (t.id === ticketId) {
              return {
                ...t,
                status: 'In Progress' as TicketStatus,
                responses: [...t.responses, { sender, message, date: new Date().toISOString().split('T')[0] }]
              };
            }
            return t;
          })
        }));
        (async () => {
          try {
            await adminApi.post(`/admin/support/${ticketId}/reply`, { message });
            await get().fetchSupportTickets();
          } catch (err) {
            console.warn('[addTicketResponse] backend call failed:', err);
          }
        })();
      },

      updateTicketStatus: (ticketId: string, status: TicketStatus) => {
        set((state: EcosystemState) => ({
          supportTickets: state.supportTickets.map((t: SupportTicket) =>
            t.id === ticketId ? { ...t, status } : t
          )
        }));
        get().addActivityLog(
          useAuthStore.getState().user?.name || 'Admin',
          useAdminStore.getState().activeRole,
          `Updated support CRM ticket ${ticketId} status to ${status}`
        );
        (async () => {
          try {
            await adminApi.patch(`/admin/support/${ticketId}/status`, { status });
            await get().fetchSupportTickets();
          } catch (err) {
            console.warn('[updateTicketStatus] backend call failed:', err);
          }
        })();
      },

      // 🖥️ Content Management Operations
      updateAnnouncementMarquee: (text: string, isActive: boolean) => {
        set((state: EcosystemState) => ({
          cmsConfig: {
            ...state.cmsConfig,
            announcementMarquee: text,
            isMarqueeActive: isActive
          }
        }));
        get().addActivityLog(
          useAuthStore.getState().user?.name || 'Admin',
          useAdminStore.getState().activeRole,
          `Dispatched global network emergency announcement: "${text}"`
        );
      },

      addCMSBanner: (title: string, imageUrl: string, linkUrl: string) => {
        const id = `BNR-00${get().cmsConfig.banners.length + 1}`;
        set((state: EcosystemState) => ({
          cmsConfig: {
            ...state.cmsConfig,
            banners: [...state.cmsConfig.banners, { id, title, imageUrl, linkUrl, isActive: true }]
          }
        }));
      },

      toggleCMSBanner: (bannerId: string) => {
        set((state: EcosystemState) => ({
          cmsConfig: {
            ...state.cmsConfig,
            banners: state.cmsConfig.banners.map((b: any) => 
              b.id === bannerId ? { ...b, isActive: !b.isActive } : b
            )
          }
        }));
      },

      // 📜 Log Audit Operations
      addActivityLog: (operatorName: string, role: UserRole, actionText: string) => {
        const id = `LOG-${Math.floor(100000 + Math.random() * 900000)}`;
        const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 19);
        const newLog: ActivityLog = {
          id,
          timestamp,
          operator: operatorName,
          role,
          action: actionText,
          ipAddress: '10.0.12.' + Math.floor(2 + Math.random() * 253),
          success: true,
        };
        set((state: EcosystemState) => ({
          activityLogs: [newLog, ...state.activityLogs].slice(0, 200) // Keep last 200 logs
        }));
      }
    }),
    {
      name: 'bhumicred_db', // PERSIST TO LOCAL STORAGE FOR CROSS-SESSION SYNC WITH USER-SIDE FRONTEND
      partialize: (state: EcosystemState) => ({
        farmers: state.farmers,
        lands: state.lands,
        vendors: state.vendors,
        products: state.products,
        carbonProjects: state.carbonProjects,
        insurancePolicies: state.insurancePolicies,
        insuranceClaims: state.insuranceClaims,
        orders: state.orders,
        supportTickets: state.supportTickets,
        employees: state.employees,
        activityLogs: state.activityLogs,
        cmsConfig: state.cmsConfig
      })
    }
  )
);
export type { UserRole };

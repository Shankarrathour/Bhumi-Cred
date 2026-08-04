import { create } from 'zustand';
console.log("[authStore] Module Start");
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api, { setAuthTokens, setAuthCallbacks } from '../api/apiClient';
// import { useWalletStore } from './walletStore';
// import { useMarketplaceStore } from './marketplaceStore';

export type AuthRole = 'farmer' | 'vendor';

export interface VendorProfile {
  id: string;
  vendorId: string | null;
  name: string | null;
  fatherName: string | null;
  email: string | null;
  phone: string;
  dob: string | null;
  gender: string | null;
  profilePhotoUrl: string | null;
  businessName: string | null;
  gstNumber: string | null;
  yearsOfExperience: number | null;
  businessDescription: string | null;
  address: string | null;
  state: string | null;
  district: string | null;
  tehsil: string | null;
  gramPanchayat: string | null;
  villageCity: string | null;
  pincode: string | null;
  latitude: number | null;
  longitude: number | null;
  kycIdentityType: string | null;
  kycIdentityNumber: string | null;
  kycDocumentFrontUrl: string | null;
  kycDocumentBackUrl: string | null;
  bankAccountNumber: string | null;
  bankIfsc: string | null;
  bankHolderName: string | null;
  status: string; // "Pending" | "Active" | "Rejected" | "Suspended"
  rejectionReason: string | null;
  isVerified: boolean;
  walletBalance: number;
}

export interface VendorWizardData {
  name?: string;
  fatherName?: string;
  email?: string;
  dob?: string;
  gender?: string;
  businessName?: string;
  gstNumber?: string;
  yearsOfExperience?: number;
  businessDescription?: string;
  address?: string;
  state?: string;
  district?: string;
  tehsil?: string;
  gramPanchayat?: string;
  villageCity?: string;
  pincode?: string;
  latitude?: number;
  longitude?: number;
  kycIdentityType?: string;
  kycIdentityNumber?: string;
  bankAccountNumber?: string;
  bankIfsc?: string;
  bankHolderName?: string;
}

export interface UserProfile {
  farmerId?: string;
  fullName: string;
  fatherName: string;
  dob: string;
  mobile: string;
  email: string;
  state: string;
  district: string;
  village: string;
  city?: string;
  country?: string;
  gramPanchayat?: string;
  vikashKhand?: string;
  fullAddress: string;
  identityType?: 'Aadhaar' | 'PAN';
  identityNumber?: string;
  farmerPhoto?: string;
  aadhaarProof?: string;
  panProof?: string;
  verificationStatus: 'unverified' | 'pending' | 'approved' | 'rejected';
  carbonCreditsGenerated: number;
  isActive?: boolean;
}

interface AuthState {
  isAuthenticated: boolean;
  role: AuthRole;
  user: UserProfile | null;
  vendor: VendorProfile | null;
  accessToken: string | null;
  refreshToken: string | null;
  onboardingStep: number;
  isLoading: boolean;
  error: string | null;
  otpDebug: string | null;  // populated by backend only when ENVIRONMENT=development
  walletBalance: number;
  sustainabilityScore: number;
  login: (mobile: string, role?: AuthRole) => Promise<void>;
  verifyOtp: (otp: string) => Promise<boolean>;
  fetchProfile: () => Promise<void>;
  fetchVendorProfile: () => Promise<void>;
  updateVendorProfile: (payload: VendorWizardData) => Promise<boolean>;
  logout: () => void;
  updateOnboardingData: (data: Partial<UserProfile>) => void;
  setVerificationStatus: (status: UserProfile['verificationStatus']) => void;
  setOnboardingStep: (step: number) => void;
  completeOnboarding: () => Promise<void>;
  registerMobile: (mobile: string, role?: AuthRole) => Promise<void>;
  _hasHydrated: boolean;
  setHasHydrated: (state: boolean) => void;
}

const defaultUser: UserProfile = {
  fullName: '',
  fatherName: '',
  dob: '',
  mobile: '',
  email: '',
  state: '',
  district: '',
  village: '',
  city: '',
  country: 'India',
  gramPanchayat: '',
  vikashKhand: '',
  fullAddress: '',
  verificationStatus: 'unverified',
  carbonCreditsGenerated: 0,
};

function mapVendorResponse(v: any): VendorProfile {
  return {
    id: v.id,
    vendorId: v.vendor_id ?? null,
    name: v.name,
    fatherName: v.father_name,
    email: v.email,
    phone: v.phone,
    dob: v.dob,
    gender: v.gender,
    profilePhotoUrl: v.profile_photo_url,
    businessName: v.business_name,
    gstNumber: v.gst_number,
    yearsOfExperience: v.years_of_experience,
    businessDescription: v.business_description,
    address: v.address,
    state: v.state,
    district: v.district,
    tehsil: v.tehsil,
    gramPanchayat: v.gram_panchayat,
    villageCity: v.village_city,
    pincode: v.pincode,
    latitude: v.latitude,
    longitude: v.longitude,
    kycIdentityType: v.kyc_identity_type,
    kycIdentityNumber: v.kyc_identity_number,
    kycDocumentFrontUrl: v.kyc_document_front_url,
    kycDocumentBackUrl: v.kyc_document_back_url,
    bankAccountNumber: v.bank_account_number,
    bankIfsc: v.bank_ifsc,
    bankHolderName: v.bank_holder_name,
    status: v.status,
    rejectionReason: v.rejection_reason,
    isVerified: v.is_verified,
    walletBalance: v.wallet_balance,
  };
}

function kycStatusToVerification(
  kycStatus: string,
  onboardingCompleted: boolean,
): UserProfile['verificationStatus'] {
  if (kycStatus === 'approved') return 'approved';
  if (kycStatus === 'rejected') return 'rejected';
  if (kycStatus === 'pending' || onboardingCompleted) return 'pending';
  return 'unverified';
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      isAuthenticated: false,
      role: 'farmer',
      user: null,
      vendor: null,
      accessToken: null,
      refreshToken: null,
      onboardingStep: 1,
      isLoading: false,
      error: null,
      otpDebug: null,
      walletBalance: 0,
      sustainabilityScore: 0,
      _hasHydrated: false,
      setHasHydrated: (state: boolean) => set({ _hasHydrated: state }),

      login: async (mobile: string, role: AuthRole = 'farmer') => {
        set({ isLoading: true, error: null, role });
        try {
          const { data } = await api.post('/auth/login/send-otp', { mobile, role });
          set({
            user: { ...defaultUser, mobile },
            isLoading: false,
            otpDebug: data.otp_debug ?? null,
          });
        } catch (err: any) {
          const status = err?.response?.status;
          const errorCode = err?.response?.data?.error_code;
          const msg = err?.response?.data?.message || 'Failed to send OTP.';
          set({ isLoading: false, error: msg });
          const error = new Error(msg) as Error & { code?: string };
          if (status === 404) error.code = 'MOBILE_NOT_REGISTERED';
          if (errorCode === 'ACCOUNT_ROLE_MISMATCH') error.code = 'ACCOUNT_ROLE_MISMATCH';
          throw error;
        }
      },

      verifyOtp: async (otp: string) => {
        const role = get().role;
        // login()/registerMobile() always stash the pending mobile on `user.mobile`
        // (a temporary holding place pre-verification) regardless of role.
        const mobile = get().user?.mobile;
        if (!mobile) {
          set({ error: 'Mobile number not set.' });
          return false;
        }
        set({ isLoading: true, error: null });
        try {
          const { data } = await api.post('/auth/verify-otp', { mobile, otp, role });
          const { tokens } = data;

          setAuthTokens(tokens.access_token, tokens.refresh_token);

          // Wire refresh/logout callbacks so the interceptor can update store state.
          setAuthCallbacks(
            (newAccess, newRefresh) => {
              set({ accessToken: newAccess, refreshToken: newRefresh });
            },
            () => {
              set({ isAuthenticated: false, accessToken: null, refreshToken: null });
            },
          );

          if (data.role === 'vendor') {
            set({
              accessToken: tokens.access_token,
              refreshToken: tokens.refresh_token,
              vendor: mapVendorResponse(data.vendor),
              isAuthenticated: data.vendor.status === 'Active',
              isLoading: false,
            });
            return true;
          }

          // ── Farmer path — unchanged behavior ──────────────────────────────
          const farmer = data.farmer;
          const verificationStatus = kycStatusToVerification(
            farmer.kyc_status,
            farmer.onboarding_completed,
          );

          const updatedUser: UserProfile = {
            ...defaultUser,
            farmerId: farmer.farmer_id,
            mobile: farmer.mobile,
            fullName: farmer.full_name || '',
            verificationStatus,
          };

          set({
            accessToken: tokens.access_token,
            refreshToken: tokens.refresh_token,
            user: updatedUser,
            isAuthenticated: verificationStatus === 'approved',
            isLoading: false,
          });

          // Fetch the full farmer profile from the backend (fire-and-forget).
          // This populates all profile fields (address, photo, email, etc.) beyond
          // the minimal data returned by the auth token response.
          get().fetchProfile().catch(() => {});

          return true;
        } catch (err: any) {
          const msg = err?.response?.data?.message || 'Invalid OTP.';
          set({ isLoading: false, error: msg });
          return false;
        }
      },

      fetchProfile: async () => {
        if (get().role !== 'farmer') return;
        const currentUser = get().user;
        if (!currentUser) return;
        try {
          const [profileRes, addressRes] = await Promise.allSettled([
            api.get('/farmer/profile'),
            api.get('/farmer/address'),
          ]);

          const p = profileRes.status === 'fulfilled' ? profileRes.value.data?.data : null;
          const a = addressRes.status === 'fulfilled' ? addressRes.value.data?.data : null;
          const addr = a?.current_address;

          console.log('[authStore] fetchProfile API response:', {
            kyc_status: p?.kyc_status,
            is_active: p?.is_active,
            onboarding_completed: p?.onboarding_completed,
          });

          const computedVerificationStatus = p ? kycStatusToVerification(p.kyc_status, p.onboarding_completed) : currentUser.verificationStatus;
          const computedIsActive = p != null ? (p.is_active ?? true) : true;

          console.log('[authStore] fetchProfile computed:', {
            verificationStatus: computedVerificationStatus,
            isActive: computedIsActive,
          });

          const updatedUser: UserProfile = {
            ...currentUser,
            verificationStatus: computedVerificationStatus,
            farmerId: p?.farmer_id || currentUser.farmerId,
            fullName: p?.full_name || currentUser.fullName,
            fatherName: p?.father_name || currentUser.fatherName,
            dob: p?.dob
              ? new Date(p.dob).toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' })
              : currentUser.dob,
            email: p?.email || currentUser.email,
            farmerPhoto: p?.farmer_photo_url || currentUser.farmerPhoto,
            state: addr?.state || currentUser.state,
            district: addr?.district || currentUser.district,
            village: addr?.village || currentUser.village,
            city: addr?.city || currentUser.city,
            gramPanchayat: addr?.gram_panchayat || currentUser.gramPanchayat,
            vikashKhand: addr?.vikash_khand || currentUser.vikashKhand,
            fullAddress: addr?.full_address || currentUser.fullAddress,
            carbonCreditsGenerated: p?.carbon_credits_generated ?? currentUser.carbonCreditsGenerated,
          };

          const walletBal: number = p?.wallet_balance ?? get().walletBalance;
          const ecoScore: number = p?.sustainability_score ?? get().sustainabilityScore;

          set({
            user: updatedUser,
            walletBalance: walletBal,
            sustainabilityScore: ecoScore,
            // Promote isAuthenticated when admin has approved the farmer.
            // This unblocks routing from /onboarding step 4 to /(tabs) on next app open.
            ...(computedVerificationStatus === 'approved' && computedIsActive !== false
              ? { isAuthenticated: true }
              : {}),
          });

          // Sync wallet balance into walletStore so the Wallet screen reflects real data.
          require('./walletStore').useWalletStore.getState().syncBalance(walletBal);
        } catch (err) {
          console.warn('[authStore] fetchProfile failed:', err);
        }
      },

      logout: async () => {
        const { refreshToken } = get();
        try {
          if (refreshToken) {
            await api.post('/auth/logout', { refresh_token: refreshToken });
          }
        } catch {
          // Proceed regardless — clear local state.
        } finally {
          setAuthTokens(null, null);
          set({
            isAuthenticated: false,
            role: 'farmer',
            user: null,
            vendor: null,
            accessToken: null,
            refreshToken: null,
            onboardingStep: 1,
            otpDebug: null,
          });
          require('./marketplaceStore').useMarketplaceStore.getState().clearCart();
          require('./walletStore').useWalletStore.getState().resetWallet();
          require('./landStore').useLandStore.getState().resetLandStore();
          require('./notificationStore').useNotificationStore.getState().clearNotifications();
        }
      },

      updateOnboardingData: (data: Partial<UserProfile>) => {
        const currentUser = get().user || defaultUser;
        set({ user: { ...currentUser, ...data } });
      },

      setVerificationStatus: (status: UserProfile['verificationStatus']) => {
        const currentUser = get().user;
        if (currentUser) {
          set({
            user: { ...currentUser, verificationStatus: status },
            isAuthenticated: status === 'approved',
          });
        }
      },

      setOnboardingStep: (step: number) => {
        set({ onboardingStep: step });
      },

      completeOnboarding: async () => {
        const user = get().user;
        if (!user) return;

        // Optimistic: advance to success screen immediately (original behavior).
        set({
          user: { ...user, verificationStatus: 'pending' },
          onboardingStep: 4,
        });

        // Background: persist to backend. Errors are logged but do not block UX.
        try {
          const profilePayload: Record<string, any> = {
            full_name: user.fullName || undefined,
            father_name: user.fatherName || undefined,
            email: user.email || undefined,
          };
          if (user.dob) {
            try {
              profilePayload.dob = new Date(user.dob).toISOString();
            } catch {
              // Skip invalid dob.
            }
          }
          await api.put('/farmer/profile', profilePayload);
        } catch (err) {
          console.warn('[authStore] profile save failed:', err);
        }

        try {
          await api.put('/farmer/address', {
            current_address: {
              state: user.state || undefined,
              district: user.district || undefined,
              village: user.village || undefined,
              city: user.city || undefined,
              gram_panchayat: user.gramPanchayat || undefined,
              vikash_khand: user.vikashKhand || undefined,
              full_address: user.fullAddress || undefined,
            },
          });
        } catch (err) {
          console.warn('[authStore] address save failed:', err);
        }

        if (user.identityNumber) {
          try {
            const identityPayload =
              user.identityType === 'Aadhaar'
                ? { aadhaar_number: user.identityNumber }
                : { pan_number: user.identityNumber };
            await api.put('/farmer/identity', identityPayload);
          } catch (err) {
            console.warn('[authStore] identity save failed:', err);
          }
        }

      },

      registerMobile: async (mobile: string, role: AuthRole = 'farmer') => {
        set({ isLoading: true, error: null, role });
        try {
          const { data } = await api.post('/auth/register/send-otp', { mobile, role });
          set({
            user: { ...defaultUser, mobile },
            isLoading: false,
            otpDebug: data.otp_debug ?? null,
          });
        } catch (err: any) {
          const status = err?.response?.status;
          const errorCode = err?.response?.data?.error_code;
          const msg = err?.response?.data?.message || 'Failed to send OTP.';
          set({ isLoading: false, error: msg });
          const error = new Error(msg) as Error & { code?: string };
          if (status === 409) error.code = 'MOBILE_ALREADY_REGISTERED';
          if (errorCode === 'ACCOUNT_ROLE_MISMATCH') error.code = 'ACCOUNT_ROLE_MISMATCH';
          throw error;
        }
      },

      fetchVendorProfile: async () => {
        if (get().role !== 'vendor') return;
        try {
          const { data } = await api.get('/vendor/auth/me');
          set({
            vendor: mapVendorResponse(data),
            isAuthenticated: data.status === 'Active',
          });
        } catch (err) {
          console.warn('[authStore] fetchVendorProfile failed:', err);
        }
      },

      updateVendorProfile: async (payload: VendorWizardData) => {
        set({ isLoading: true, error: null });
        try {
          const { data } = await api.put('/vendor/auth/me', {
            name: payload.name,
            father_name: payload.fatherName,
            email: payload.email,
            dob: payload.dob,
            gender: payload.gender,
            business_name: payload.businessName,
            gst_number: payload.gstNumber,
            years_of_experience: payload.yearsOfExperience,
            business_description: payload.businessDescription,
            address: payload.address,
            state: payload.state,
            district: payload.district,
            tehsil: payload.tehsil,
            gram_panchayat: payload.gramPanchayat,
            village_city: payload.villageCity,
            pincode: payload.pincode,
            latitude: payload.latitude,
            longitude: payload.longitude,
            kyc_identity_type: payload.kycIdentityType,
            kyc_identity_number: payload.kycIdentityNumber,
            bank_account_number: payload.bankAccountNumber,
            bank_ifsc: payload.bankIfsc,
            bank_holder_name: payload.bankHolderName,
          });
          set({ vendor: mapVendorResponse(data), isLoading: false });
          return true;
        } catch (err: any) {
          const msg = err?.response?.data?.message || 'Unable to submit your details. Please try again.';
          set({ isLoading: false, error: msg });
          return false;
        }
      },
    }),
    {
      name: 'bhumicred_auth_store',
      storage: createJSONStorage(() => AsyncStorage),
      onRehydrateStorage: (initialState) => {
        console.log("[DEBUG-AUTH] 1. onRehydrateStorage STARTED. Waiting for AsyncStorage...");
        return (state, error) => {
          console.log("[DEBUG-AUTH] 2. onRehydrateStorage FINISHED. Hydrated State:", {
            hasAccessToken: !!state?.accessToken,
            isAuthenticated: state?.isAuthenticated,
            error
          });
          
          if (state?.accessToken && state?.refreshToken) {
            console.log("[DEBUG-AUTH] 3. Calling setAuthTokens() with restored tokens");
            setAuthTokens(state.accessToken, state.refreshToken);
            setAuthCallbacks(
              (newAccess, newRefresh) => {
                useAuthStore.setState({ accessToken: newAccess, refreshToken: newRefresh });
              },
              () => {
                useAuthStore.setState({ isAuthenticated: false, accessToken: null, refreshToken: null });
              },
            );
          } else {
            console.log("[DEBUG-AUTH] 3. No access token in hydrated state.");
          }
          
          useAuthStore.setState({ _hasHydrated: true });
          console.log("[DEBUG-AUTH] 4. _hasHydrated set to true.");
        };
      },
    },
  ),
);

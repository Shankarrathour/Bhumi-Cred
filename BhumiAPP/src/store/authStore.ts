import { create } from 'zustand';
console.log("[authStore] Module Start");
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api, { setAuthTokens, setAuthCallbacks } from '../api/apiClient';
import { resolveMediaUrl } from '../utils/resolveMediaUrl';
// import { useWalletStore } from './walletStore';
// import { useMarketplaceStore } from './marketplaceStore';

export type AuthRole = 'farmer' | 'govt_body' | 'partner';

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
  gender?: string;
  pincode?: string;
  tehsil?: string;
  category?: string;
  education?: string;
  occupation?: string;
}

interface AuthState {
  isAuthenticated: boolean;
  role: AuthRole;
  user: UserProfile | null;
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
  logout: () => void;
  deleteAccount: () => Promise<void>;
  updateOnboardingData: (data: Partial<UserProfile>) => void;
  setVerificationStatus: (status: UserProfile['verificationStatus']) => void;
  setIsActive: (isActive: boolean) => void;
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
  gender: 'Male',
  pincode: '',
  tehsil: '',
  category: '',
  education: '',
  occupation: '',
};



function kycStatusToVerification(
  kycStatus: string,
  onboardingCompleted: boolean,
): UserProfile['verificationStatus'] {
  const s = (kycStatus || '').toLowerCase();
  if (s === 'approved' || s === 'verified') return 'approved';
  if (s === 'rejected') return 'rejected';
  if (s === 'pending' || onboardingCompleted) return 'pending';
  return 'unverified';
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      isAuthenticated: false,
      role: 'farmer',
      user: null,
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
          const apiRole = role;
          const { data } = await api.post('/auth/login/send-otp', { mobile, role: apiRole });
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
        const mobile = get().user?.mobile;
        if (!mobile) {
          set({ error: 'Mobile number not set.' });
          return false;
        }
        set({ isLoading: true, error: null });
        try {
          const apiRole = role;
          const { data } = await api.post('/auth/verify-otp', { mobile, otp, role: apiRole });
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

          const userRecord = data.farmer || data.vendor || {};
          const verificationStatus = userRecord.kyc_status
            ? kycStatusToVerification(
                userRecord.kyc_status,
                userRecord.onboarding_completed,
              )
            : 'approved';

          const updatedUser: UserProfile = {
            ...defaultUser,
            farmerId: userRecord.farmer_id || userRecord.vendor_id || 'ID-001',
            mobile: userRecord.mobile || userRecord.phone || mobile,
            fullName: userRecord.full_name || userRecord.name || '',
            verificationStatus,
          };

          set({
            accessToken: tokens.access_token,
            refreshToken: tokens.refresh_token,
            user: updatedUser,
            isAuthenticated: true,
            isLoading: false,
          });

          if (data.farmer) {
            get().fetchProfile().catch(() => {});
          }

          return true;
        } catch (err: any) {
          const msg = err?.response?.data?.message || 'OTP verification failed. Please try again.';
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

          if (profileRes.status === 'rejected') {
            throw profileRes.reason;
          }

          const p = profileRes.status === 'fulfilled' ? profileRes.value.data?.data : null;
          const a = addressRes.status === 'fulfilled' ? addressRes.value.data?.data : null;
          const addr = a?.current_address;

          console.log('[authStore] fetchProfile API response:', {
            kyc_status: p?.kyc_status,
            is_active: p?.is_active,
            onboarding_completed: p?.onboarding_completed,
          });

          const computedVerificationStatus = p ? kycStatusToVerification(p.kyc_status, p.onboarding_completed) : currentUser.verificationStatus;
          const computedIsActive = p != null ? (p.is_active ?? true) : (currentUser.isActive ?? true);

          console.log('[authStore] fetchProfile computed:', {
            verificationStatus: computedVerificationStatus,
            isActive: computedIsActive,
          });

          const updatedUser: UserProfile = {
            ...currentUser,
            verificationStatus: computedVerificationStatus,
            isActive: computedIsActive,
            farmerId: p?.farmer_id || currentUser.farmerId,
            fullName: p?.full_name || currentUser.fullName,
            fatherName: p?.father_name || currentUser.fatherName,
            dob: p?.dob
              ? new Date(p.dob).toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' })
              : currentUser.dob,
            email: p?.email || currentUser.email,
            farmerPhoto: resolveMediaUrl(p?.farmer_photo_url) || currentUser.farmerPhoto,
            state: addr?.state || currentUser.state,
            district: addr?.district || currentUser.district,
            village: addr?.village || currentUser.village,
            city: addr?.city || currentUser.city,
            gramPanchayat: addr?.gram_panchayat || currentUser.gramPanchayat,
            vikashKhand: addr?.vikash_khand || currentUser.vikashKhand,
            fullAddress: addr?.full_address || currentUser.fullAddress,
            carbonCreditsGenerated: p?.carbon_credits_generated ?? currentUser.carbonCreditsGenerated,
            gender: p?.gender || currentUser.gender,
            category: p?.category || currentUser.category,
            education: p?.education || currentUser.education,
            occupation: p?.occupation || currentUser.occupation,
            pincode: addr?.pincode || currentUser.pincode,
            tehsil: addr?.tehsil || currentUser.tehsil,
          };

          if (computedIsActive === false && currentUser.isActive !== false) {
            try {
              require('./notificationStore').useNotificationStore.getState().addNotification({
                title: 'Account Suspended by Admin ⚠️',
                message: 'Your farmer profile account has been suspended by the Admin. Features and transactions are temporarily locked.',
                type: 'system'
              });
            } catch (e) {
              console.log('Error adding suspension notification', e);
            }
          }

          const walletBal: number = p?.wallet_balance ?? get().walletBalance;
          const ecoScore: number = p?.sustainability_score ?? get().sustainabilityScore;

          if (computedIsActive === false) {
            console.warn('[authStore] Farmer account is inactive/deleted. Auto logging out...');
            get().logout();
            return;
          }

          set({
            user: updatedUser,
            walletBalance: walletBal,
            sustainabilityScore: ecoScore,
            ...(computedVerificationStatus === 'approved' && computedIsActive !== false
              ? { isAuthenticated: true }
              : {}),
          });

          // Sync wallet balance into walletStore so the Wallet screen reflects real data.
          require('./walletStore').useWalletStore.getState().syncBalance(walletBal);
        } catch (err: any) {
          console.warn('[authStore] fetchProfile failed:', err);
          const status = err?.response?.status;
          const errCode = err?.response?.data?.error_code;
          if (status === 404 || status === 401 || status === 403 || errCode === 'FARMER_NOT_FOUND' || errCode === 'FARMER_BLOCKED') {
            get().logout();
          }
        }
      },

      logout: async () => {
        const { refreshToken } = get();
        // 1. Immediately clear local auth tokens and Zustand state
        setAuthTokens(null, null);
        set({
          isAuthenticated: false,
          role: 'farmer',
          user: null,
          accessToken: null,
          refreshToken: null,
          onboardingStep: 1,
          otpDebug: null,
        });

        // 2. Clear feature stores
        try { require('./marketplaceStore').useMarketplaceStore.getState().clearCart(); } catch {}
        try { require('./walletStore').useWalletStore.getState().resetWallet(); } catch {}
        try { require('./landStore').useLandStore.getState().resetLandStore(); } catch {}
        try { require('./notificationStore').useNotificationStore.getState().clearNotifications(); } catch {}

        // 3. Fire-and-forget backend notification
        if (refreshToken) {
          api.post('/auth/logout', { refresh_token: refreshToken }).catch(() => {});
        }
      },

      deleteAccount: async () => {
        try {
          await api.delete('/farmer/account');
        } catch (err) {
          console.warn('[authStore] deleteAccount API error:', err);
        } finally {
          setAuthTokens(null, null);
          set({
            isAuthenticated: false,
            role: 'farmer',
            user: null,
            accessToken: null,
            refreshToken: null,
            onboardingStep: 1,
            otpDebug: null,
          });
          try { require('./marketplaceStore').useMarketplaceStore.getState().clearCart(); } catch {}
          try { require('./walletStore').useWalletStore.getState().resetWallet(); } catch {}
          try { require('./landStore').useLandStore.getState().resetLandStore(); } catch {}
          try { require('./notificationStore').useNotificationStore.getState().clearNotifications(); } catch {}
        }
      },

      updateOnboardingData: (data: Partial<UserProfile>) => {
        const currentUser = get().user || defaultUser;
        if (data.farmerPhoto !== undefined) {
          data.farmerPhoto = resolveMediaUrl(data.farmerPhoto);
        }
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

      setIsActive: (isActive: boolean) => {
        const currentUser = get().user;
        const prevIsActive = currentUser?.isActive;
        const newUser = currentUser
          ? { ...currentUser, isActive }
          : { ...defaultUser, isActive };
        set({ user: newUser });

        if (isActive === false && prevIsActive !== false) {
          try {
            require('./notificationStore').useNotificationStore.getState().addNotification({
              title: 'Account Suspended by Admin ⚠️',
              message: 'Your farmer profile account has been suspended by the Admin. Features and transactions are temporarily locked.',
              type: 'system'
            });
          } catch (e) {
            console.log('Error adding suspension notification', e);
          }
        }
      },

      setOnboardingStep: (step: number) => {
        set({ onboardingStep: step });
      },

      completeOnboarding: async () => {
        const user = get().user;
        if (!user) return;

        set({
          user: { ...user, verificationStatus: 'pending' },
          onboardingStep: 4,
        });

        // Background: persist to backend database.
        try {
          const profilePayload: Record<string, any> = {
            full_name: user.fullName || undefined,
            father_name: user.fatherName || undefined,
            email: user.email || undefined,
            gender: user.gender ? user.gender.toLowerCase() : undefined,
            category: user.category ? user.category.toLowerCase() : undefined,
            education: user.education ? user.education.toLowerCase() : undefined,
            occupation: user.occupation || undefined,
          };
          if (user.dob) {
            try {
              if (user.dob.includes('/')) {
                const [d, m, y] = user.dob.split('/');
                profilePayload.dob = new Date(Number(y), Number(m) - 1, Number(d)).toISOString();
              } else {
                profilePayload.dob = new Date(user.dob).toISOString();
              }
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
              tehsil: user.tehsil || undefined,
              village: user.village || undefined,
              city: user.city || undefined,
              pincode: user.pincode || undefined,
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

        // Refresh profile from database so local state reflects true MongoDB state
        try {
          await get().fetchProfile();
        } catch (err) {
          console.warn('[authStore] fetchProfile after onboarding failed:', err);
        }
      },

      registerMobile: async (mobile: string, role: AuthRole = 'farmer') => {
        set({ isLoading: true, error: null, role });
        try {
          const apiRole = role;
          const { data } = await api.post('/auth/register/send-otp', { mobile, role: apiRole });
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
          
          useAuthStore.setState({ _hasHydrated: true, isLoading: false, error: null });
          console.log("[DEBUG-AUTH] 4. _hasHydrated set to true.");
        };
      },
    },
  ),
);

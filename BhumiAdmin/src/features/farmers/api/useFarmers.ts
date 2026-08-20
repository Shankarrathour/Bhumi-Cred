import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../../api/axios';

// ─── List Types ───────────────────────────────────────────────────────────────
export interface FarmerListItem {
  id: string;
  farmer_id?: string;
  full_name?: string;
  mobile: string;
  state?: string;
  district?: string;
  village?: string;
  kyc_status: string;
  is_active: boolean;
  total_acreage: number;
  wallet_balance?: number;
  total_trees?: number;
  carbon_credits_generated?: number;
  farmer_photo_url?: string;
  sustainability_score?: number;
  onboarding_completed?: boolean;
  created_at?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  size: number;
  pages: number;
}

// ─── Detail Types ─────────────────────────────────────────────────────────────
export interface AdminFarmerDetailResponse {
  id: string;
  farmer_id?: string;
  mobile: string;
  full_name?: string;
  father_name?: string;
  dob?: string;
  email?: string;
  gender?: string;
  category?: string;
  education?: string;
  occupation?: string;
  state?: string;
  district?: string;
  village?: string;
  tehsil?: string;
  city?: string;
  pincode?: string;
  gram_panchayat?: string;
  vikash_khand?: string;
  full_address?: string;
  permanent_address?: {
    state?: string;
    district?: string;
    tehsil?: string;
    village?: string;
    city?: string;
    pincode?: string;
    full_address?: string;
  };
  kyc_status: string;
  kyc_remarks?: string;
  kyc_reviewed_by?: string;
  kyc_reviewed_at?: string;
  is_active: boolean;
  onboarding_completed?: boolean;
  wallet_balance: number;
  total_acreage: number;
  total_trees: number;
  carbon_credits_generated: number;
  sustainability_score?: number;
  farmer_photo_url?: string;
  id_proof_url?: string;
  identity_type?: string;
  locale?: string;
  created_at?: string;
  updated_at?: string;
}

export interface IdentityResponse {
  aadhaar_number?: string;
  pan_number?: string;
  aadhaar_url?: string;
  pan_url?: string;
  submitted_at?: string;
}

export interface BankResponse {
  bank_name?: string;
  account_number?: string;
  ifsc_code?: string;
  account_holder_name?: string;
  is_verified?: boolean;
  added_at?: string;
}

export interface ActivityLogItem {
  id: string;
  activity_type: string;
  title: string;
  description?: string;
  timestamp: string;
}

export interface FamilyMember {
  id: string;
  name: string;
  relationship: string;
  age?: number;
  occupation?: string;
  created_at?: string;
}

export interface LandParcelItem {
  id: string;
  survey_number?: string;
  area_acres?: number;
  ownership_type?: string;
  is_irrigated?: boolean;
  state?: string;
  district?: string;
  tehsil?: string;
  village?: string;
  land_document_url?: string;
  verification_status?: string;
  verification_remarks?: string;
  verified_at?: string;
  coordinates?: string;
  crop_type?: string;
  soil_type?: string;
  tree_stock_count?: number;
  plantation_area_acres?: number;
  created_at?: string;
}

export interface LandSummaryResponse {
  total_parcels: number;
  total_area_acres: number;
  parcels: LandParcelItem[];
}

export interface LandVerificationItem {
  id: string;
  farmer_id: string;
  farmer_public_id?: string;
  farmer_name?: string;
  farmer_mobile?: string;
  survey_number?: string;
  area_acres?: number;
  ownership_type?: string;
  state?: string;
  district?: string;
  village?: string;
  crop_type?: string;
  verification_status?: string;
  coordinates?: string;
  land_document_url?: string;
  created_at?: string;
}

export interface LocationTree {
  states_and_districts: Record<string, string[]>;
  district_blocks: Record<string, string[]>;
  block_villages: Record<string, string[]>;
}

// ─── Farmer List Hook ─────────────────────────────────────────────────────────
const fetchFarmers = async (
  page = 1,
  limit = 12,
  filters?: Record<string, string>
): Promise<PaginatedResponse<FarmerListItem>> => {
  try {
    const response = await apiClient.get('/admin/farmers', {
      params: { page, limit, ...filters },
    });
    if (response.data?.meta) {
      return {
        data: response.data.data ?? [],
        total: response.data.meta.total ?? 0,
        page: response.data.meta.page ?? page,
        size: response.data.meta.limit ?? limit,
        pages: response.data.meta.total_pages ?? 0,
      };
    }
    return response.data;
  } catch (err) {
    console.error('Failed to fetch farmers', err);
    return { data: [], total: 0, page, size: limit, pages: 0 };
  }
};

export const useFarmers = (page = 1, limit = 12, filters?: Record<string, string>) => {
  return useQuery({
    queryKey: ['farmers', page, limit, filters],
    queryFn: () => fetchFarmers(page, limit, filters),
    staleTime: 2 * 60 * 1000,
    placeholderData: (prev) => prev,
  });
};

// ─── Location Tree Hook (for filter dropdowns) ────────────────────────────────
export const useFarmerLocations = () => {
  return useQuery({
    queryKey: ['farmer-locations'],
    queryFn: async (): Promise<LocationTree> => {
      const response = await apiClient.get('/admin/farmers/locations');
      return response.data.data ?? { states_and_districts: {}, district_blocks: {}, block_villages: {} };
    },
    staleTime: 10 * 60 * 1000,
  });
};

// ─── Detail Hook ─────────────────────────────────────────────────────────────
export const useFarmerDetail = (id: string | undefined) => {
  return useQuery({
    queryKey: ['farmer', id],
    queryFn: async (): Promise<AdminFarmerDetailResponse | null> => {
      if (!id) return null;
      const response = await apiClient.get(`/admin/farmers/${id}`);
      return response.data.data ?? response.data;
    },
    enabled: !!id,
    staleTime: 2 * 60 * 1000,
  });
};

// ─── Tab-Specific Hooks ───────────────────────────────────────────────────────
export const useFarmerIdentity = (id: string | undefined) => {
  return useQuery({
    queryKey: ['farmer-identity', id],
    queryFn: async (): Promise<IdentityResponse | null> => {
      if (!id) return null;
      const response = await apiClient.get(`/admin/farmers/${id}/identity`);
      return response.data.data ?? response.data;
    },
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });
};

export const useFarmerBank = (id: string | undefined) => {
  return useQuery({
    queryKey: ['farmer-bank', id],
    queryFn: async (): Promise<BankResponse | null> => {
      if (!id) return null;
      const response = await apiClient.get(`/admin/farmers/${id}/bank`);
      return response.data.data ?? response.data;
    },
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });
};

export const useFarmerActivity = (id: string | undefined) => {
  return useQuery({
    queryKey: ['farmer-activity', id],
    queryFn: async (): Promise<ActivityLogItem[]> => {
      if (!id) return [];
      const response = await apiClient.get(`/admin/farmers/${id}/activity`);
      return response.data.data ?? [];
    },
    enabled: !!id,
    staleTime: 60 * 1000,
  });
};

export const useFarmerFamily = (id: string | undefined) => {
  return useQuery({
    queryKey: ['farmer-family', id],
    queryFn: async (): Promise<FamilyMember[]> => {
      if (!id) return [];
      const response = await apiClient.get(`/admin/farmers/${id}/family`);
      return response.data.data ?? [];
    },
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });
};

export const useFarmerLand = (id: string | undefined) => {
  return useQuery({
    queryKey: ['farmer-land', id],
    queryFn: async (): Promise<LandSummaryResponse | null> => {
      if (!id) return null;
      const response = await apiClient.get(`/admin/farmers/${id}/land`);
      return response.data.data ?? null;
    },
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });
};

// ─── Land Verification Hooks ─────────────────────────────────────────────────
export const useLandVerification = () => {
  return useQuery({
    queryKey: ['land-verification'],
    queryFn: async (): Promise<LandVerificationItem[]> => {
      const response = await apiClient.get('/admin/farmers/land-verification');
      return response.data.data ?? [];
    },
    staleTime: 60 * 1000,
  });
};

export const useVerifyLandParcel = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      parcelId,
      action,
      remarks,
    }: { parcelId: string; action: 'approved' | 'rejected'; remarks?: string }) => {
      const response = await apiClient.patch(
        `/admin/farmers/land-verification/${parcelId}`,
        { status: action, remarks }
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['land-verification'] });
    },
  });
};

// ─── Action Mutation Hooks ───────────────────────────────────────────────────
export const useApproveFarmer = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (farmerId: string) => {
      const response = await apiClient.put(`/admin/farmers/${farmerId}/approve`);
      return response.data;
    },
    onSuccess: (_data, farmerId) => {
      queryClient.invalidateQueries({ queryKey: ['farmer', farmerId] });
      queryClient.invalidateQueries({ queryKey: ['farmers'] });
    },
  });
};

export const useRejectFarmer = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ farmerId, remarks }: { farmerId: string; remarks?: string }) => {
      const response = await apiClient.put(`/admin/farmers/${farmerId}/reject`, {
        kyc_remarks: remarks,
      });
      return response.data;
    },
    onSuccess: (_data, vars) => {
      queryClient.invalidateQueries({ queryKey: ['farmer', vars.farmerId] });
      queryClient.invalidateQueries({ queryKey: ['farmers'] });
    },
  });
};

export const useBlockFarmer = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ farmerId }: { farmerId: string }) => {
      const response = await apiClient.put(`/admin/farmers/${farmerId}/block`);
      return response.data;
    },
    onSuccess: (_data, vars) => {
      queryClient.invalidateQueries({ queryKey: ['farmer', vars.farmerId] });
      queryClient.invalidateQueries({ queryKey: ['farmers'] });
    },
  });
};

export const useUnblockFarmer = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (farmerId: string) => {
      const response = await apiClient.put(`/admin/farmers/${farmerId}/unblock`);
      return response.data;
    },
    onSuccess: (_data, farmerId) => {
      queryClient.invalidateQueries({ queryKey: ['farmer', farmerId] });
      queryClient.invalidateQueries({ queryKey: ['farmers'] });
    },
  });
};

export const useAssignProject = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ farmerId, projectId }: { farmerId: string; projectId: string }) => {
      const response = await apiClient.put(`/admin/farmers/${farmerId}/assign-project`, null, {
        params: { project_id: projectId },
      });
      return response.data;
    },
    onSuccess: (_data, vars) => {
      queryClient.invalidateQueries({ queryKey: ['farmer', vars.farmerId] });
      queryClient.invalidateQueries({ queryKey: ['farmers'] });
    },
  });
};

export const useDeleteFarmer = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (farmerId: string) => {
      const response = await apiClient.delete(`/admin/farmers/${farmerId}`);
      return response.data;
    },
    onSuccess: () => {
      // Invalidate entire farmer list — deleted farmer should disappear
      queryClient.invalidateQueries({ queryKey: ['farmers'] });
      queryClient.invalidateQueries({ queryKey: ['farmer-locations'] });
    },
  });
};

export const useFarmerEnrollments = () => {
  return useQuery({
    queryKey: ['admin-project-enrollments'],
    queryFn: async (): Promise<any[]> => {
      const response = await apiClient.get('/admin/projects/enrollments');
      return response.data.data ?? [];
    },
    staleTime: 60 * 1000,
  });
};

export const useUpdateFarmerEnrollment = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ enrollmentId, payload }: { enrollmentId: string; payload: any }) => {
      const response = await apiClient.patch(`/projects/admin/enrollments/${enrollmentId}/review`, payload);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-project-enrollments'] });
    },
  });
};

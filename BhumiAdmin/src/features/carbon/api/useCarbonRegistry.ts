import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient as api } from '../../../api/axios';

// ── Types ────────────────────────────────────────────────────────────────────

export interface CarbonStats {
  draftProjects: number;
  submittedProjects: number;
  underValidation: number;
  underVerification: number;
  registeredProjects: number;
  creditsIssued: number;
  creditsRetired: number;
  creditsSold: number;
}

export interface RegistryProjectItem {
  project_id: string;
  project_name: string;
  registry: string;
  methodology: string;
  country: string;
  status: string;
  developer: string;
  submission_date: string;
}

export interface CarbonBatchItem {
  id: string;
  batch_id: string;
  project_name: string;
  project_code: string;
  vintage_year: number;
  species: string;
  location: string;
  volume_tco2: number;
  credits_issued: number;
  credits_sold: number;
  credits_available: number;
  buyer_name: string;
  price_per_tco2_usd: number;
  revenue_lakhs: number;
  verification_standard: string;
  status: 'Issued' | 'Sold' | 'Retired';
  created_at: string;
}

export interface AdminTreeRegistrationResponse {
  id: string;
  farmer_id: string;
  tree_species: string;
  tree_count: number;
  plantation_year: number;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'VERIFIED';
  village?: string;
  district?: string;
  state?: string;
  created_at: string;
}

export interface AdminTreeRegistrationListResponse {
  data: AdminTreeRegistrationResponse[];
  meta: {
    total: number;
    page: number;
    limit: number;
    total_pages: number;
  };
}

// ── Hooks ────────────────────────────────────────────────────────────────────

export const useTreeRegistrations = (skip: number = 0, limit: number = 50) => {
  return useQuery({
    queryKey: ['adminTreeRegistrations', skip, limit],
    queryFn: async (): Promise<AdminTreeRegistrationListResponse> => {
      const response = await api.get('/admin/tree-registrations', { params: { skip, limit } });
      return response.data;
    },
  });
};

export const useCarbonStats = () => {
  return useQuery({
    queryKey: ['carbonStats'],
    queryFn: async (): Promise<CarbonStats> => {
      const response = await api.get('/admin/carbon/stats');
      return response.data.data;
    },
    refetchInterval: 15000,
  });
};

export const useCarbonProjects = () => {
  return useQuery({
    queryKey: ['carbonProjects'],
    queryFn: async (): Promise<RegistryProjectItem[]> => {
      const response = await api.get('/admin/carbon/projects');
      return response.data.data;
    },
  });
};

export const useCarbonBatches = () => {
  return useQuery({
    queryKey: ['carbonBatches'],
    queryFn: async (): Promise<CarbonBatchItem[]> => {
      const response = await api.get('/admin/carbon/batches');
      return response.data.data;
    },
  });
};

export const useCreateCarbonProject = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: {
      project_id: string;
      project_name: string;
      registry: string;
      methodology: string;
      country: string;
      developer_name: string;
    }): Promise<RegistryProjectItem> => {
      const response = await api.post('/admin/carbon/projects', payload);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['carbonProjects'] });
      queryClient.invalidateQueries({ queryKey: ['carbonStats'] });
    },
  });
};

export const useMintCarbonBatch = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: {
      project_name: string;
      vintage_year: number;
      volume_tco2: number;
      price_per_tco2_usd: number;
      verification_standard: string;
      buyer_name: string;
    }): Promise<CarbonBatchItem> => {
      const response = await api.post('/admin/carbon/batches', payload);
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['carbonBatches'] });
      queryClient.invalidateQueries({ queryKey: ['carbonStats'] });
    },
  });
};

export const useRetireCarbonBatch = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (args: {
      issuance_id: string;
      quantity_retired: number;
      retirement_reason: string;
      buyer_name: string;
    }): Promise<CarbonBatchItem> => {
      const response = await api.post(`/admin/carbon/batches/${args.issuance_id}/retire`, {
        quantity_retired: args.quantity_retired,
        retirement_reason: args.retirement_reason,
        buyer_name: args.buyer_name,
      });
      return response.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['carbonBatches'] });
      queryClient.invalidateQueries({ queryKey: ['carbonStats'] });
    },
  });
};

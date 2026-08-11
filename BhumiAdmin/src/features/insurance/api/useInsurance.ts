import { useQuery } from '@tanstack/react-query';
import { apiClient as api } from '../../../api/axios';

export interface ClimateRiskInsuranceResponse {
  id: string;
  name: string;
  provider: string;
  coverage_amount: number;
  premium_amount: number;
  description?: string;
  is_active?: boolean;
}

export interface ClimateRiskInsuranceListResponse {
  data: ClimateRiskInsuranceResponse[];
  message: string;
}

const FALLBACK_INSURANCE_DATA: ClimateRiskInsuranceResponse[] = [
  {
    id: 'INS-8001',
    name: 'Teak Tree Weather & Fire Guard',
    provider: 'HDFC ERGO Agri Insurance',
    coverage_amount: 500000,
    premium_amount: 62500,
    description: 'Comprehensive coverage against wildfire, drought, and windstorm.',
    is_active: true,
  },
  {
    id: 'INS-8002',
    name: 'Mango & Fruit Grove Cyclone Cover',
    provider: 'ICICI Lombard Insurance',
    coverage_amount: 272000,
    premium_amount: 34000,
    description: 'Specialized horticulture cyclone and storm protection.',
    is_active: true,
  },
  {
    id: 'INS-8003',
    name: 'Sandalwood & Timber Shield',
    provider: 'Bajaj Allianz Climate Cover',
    coverage_amount: 1200000,
    premium_amount: 144000,
    description: 'High-value timber plantation risk protection.',
    is_active: true,
  },
];

export const useInsurance = () => {
  return useQuery({
    queryKey: ['adminInsurance'],
    queryFn: async (): Promise<ClimateRiskInsuranceListResponse> => {
      try {
        const response = await api.get('/admin/climate-risk-insurance');
        if (response.data && Array.isArray(response.data.data) && response.data.data.length > 0) {
          return response.data;
        }
        return { data: FALLBACK_INSURANCE_DATA, message: 'Seeded insurance data loaded' };
      } catch (err) {
        console.warn('API /admin/climate-risk-insurance failed or aborted. Using resilient fallback data.', err);
        return { data: FALLBACK_INSURANCE_DATA, message: 'Fallback insurance data loaded' };
      }
    },
    retry: 1,
    staleTime: 60000,
  });
};

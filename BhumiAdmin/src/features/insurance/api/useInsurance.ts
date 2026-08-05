import { useQuery } from '@tanstack/react-query';
import { apiClient as api } from '../../../api/axios';

export interface ClimateRiskInsuranceResponse {
  id: string;
  name: string;
  provider: string;
  coverage_amount: number;
  premium_amount: number;
  description: string;
  is_active: boolean;
}

export interface ClimateRiskInsuranceListResponse {
  data: ClimateRiskInsuranceResponse[];
  message: string;
}

export const useInsurance = () => {
  return useQuery({
    queryKey: ['adminInsurance'],
    queryFn: async (): Promise<ClimateRiskInsuranceListResponse> => {
      const response = await api.get('/admin/climate-risk-insurance');
      return response.data;
    },
  });
};

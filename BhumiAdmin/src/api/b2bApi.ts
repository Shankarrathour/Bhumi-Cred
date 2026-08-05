import adminApi from './apiClient';

export interface B2BContract {
  id?: string;
  company_name: string;
  mandate_details: string;
  target_credits: number;
  status: 'PENDING' | 'ACTIVE' | 'FULFILLED' | 'CANCELLED';
}

export const b2bApi = {
  getContracts: async () => {
    const res = await adminApi.get('/admin/b2b/contracts');
    return res.data;
  },
  getContractDetails: async (id: string) => {
    const res = await adminApi.get(`/admin/b2b/contracts/${id}`);
    return res.data;
  },
  createContract: async (payload: B2BContract) => {
    const res = await adminApi.post('/admin/b2b/contracts', payload);
    return res.data;
  },
  updateContractStatus: async (id: string, status: string) => {
    const res = await adminApi.put(`/admin/b2b/contracts/${id}/status`, { status });
    return res.data;
  },
};

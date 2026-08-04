import adminApi from './apiClient';

export interface ReportQuery {
  module: string;
  filters: Record<string, any>;
  fields: string[];
}

export const reportBuilderApi = {
  getAvailableModules: async () => {
    const res = await adminApi.get('/admin/reports/modules');
    return res.data;
  },
  generateCustomReport: async (query: ReportQuery) => {
    const res = await adminApi.post('/admin/reports/build', query);
    return res.data;
  },
  exportCustomReportToCSV: async (query: ReportQuery) => {
    const res = await adminApi.post('/admin/reports/build/export', query, {
      responseType: 'blob',
    });
    return res.data;
  }
};

import adminApi from './apiClient';

export interface Exam {
  id?: string;
  title: string;
  passing_score: number;
  is_active: boolean;
}

export const examApi = {
  getExams: async () => {
    const res = await adminApi.get('/admin/exams');
    return res.data;
  },
  createExam: async (payload: Exam) => {
    const res = await adminApi.post('/admin/exams', payload);
    return res.data;
  },
  updateExam: async (id: string, payload: Partial<Exam>) => {
    const res = await adminApi.put(`/admin/exams/${id}`, payload);
    return res.data;
  },
  deleteExam: async (id: string) => {
    const res = await adminApi.delete(`/admin/exams/${id}`);
    return res.data;
  },
  getExamResults: async (examId: string) => {
    const res = await adminApi.get(`/admin/exams/${examId}/results`);
    return res.data;
  }
};

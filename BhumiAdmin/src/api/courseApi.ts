import adminApi from './apiClient';

export interface Course {
  id?: string;
  title: string;
  description: string;
  video_url: string;
  is_active: boolean;
}

export const courseApi = {
  getCourses: async () => {
    const res = await adminApi.get('/admin/courses');
    return res.data;
  },
  createCourse: async (payload: Course) => {
    const res = await adminApi.post('/admin/courses', payload);
    return res.data;
  },
  updateCourse: async (id: string, payload: Partial<Course>) => {
    const res = await adminApi.put(`/admin/courses/${id}`, payload);
    return res.data;
  },
  deleteCourse: async (id: string) => {
    const res = await adminApi.delete(`/admin/courses/${id}`);
    return res.data;
  },
};

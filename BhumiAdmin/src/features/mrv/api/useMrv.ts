import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../../../api/axios';

export interface AdminProject {
  id: string;
  project_id: string;
  title: string;
  category: string;
  description: string;
  district: string;
  state: string;
  target_area_acres: number;
  estimated_carbon_impact: number;
  status: string;
  status_label: string;
  is_public: boolean;
  is_active: boolean;
  is_tracking_active: boolean;
  progress_percent: number | null;
  current_stage: string | null;
  trees_registered: number | null;
  ngo_partner: string | null;
  created_at: string;
  updated_at: string;
}

export interface MrvMetrics {
  active_mrv: number;
  pending_survey: number;
  pending_reports: number;
  verification_pending: number;
  verified_sites: number;
}

export interface MrvScheduleItem {
  id: string;
  farmer: string;
  project: string;
  visitDate: string;
  inspector: string;
  status: string;
}

export interface MrvSoilTelemetryItem {
  id: string;
  project: string;
  organicCarbon: number;
  moisture: number;
  ph: number;
  nitrogen: number;
  phosphorus: number;
  potassium: number;
}

export interface MrvQueueItem {
  id: string;
  project: string;
  reportDate: string;
  inspector: string;
  status: string;
  observation: string;
}

export const useAdminProjects = (includeInactive = false) =>
  useQuery<AdminProject[]>({
    queryKey: ['admin-projects', includeInactive],
    queryFn: async () => {
      const res = await apiClient.get('/admin/projects', {
        params: { include_inactive: includeInactive },
      });
      return res.data?.data ?? res.data;
    },
  });

export const useMrvMetrics = () =>
  useQuery<MrvMetrics>({
    queryKey: ['admin-mrv-metrics'],
    queryFn: async () => {
      const res = await apiClient.get('/admin/mrv/metrics');
      return res.data?.data ?? res.data;
    },
  });

export const useMrvSchedules = () =>
  useQuery<MrvScheduleItem[]>({
    queryKey: ['admin-mrv-schedules'],
    queryFn: async () => {
      const res = await apiClient.get('/admin/mrv/schedules');
      return res.data?.data ?? [];
    },
  });

export const useMrvTelemetry = () =>
  useQuery<MrvSoilTelemetryItem[]>({
    queryKey: ['admin-mrv-telemetry'],
    queryFn: async () => {
      const res = await apiClient.get('/admin/mrv/telemetry');
      return res.data?.data ?? [];
    },
  });

export const useMrvQueue = () =>
  useQuery<MrvQueueItem[]>({
    queryKey: ['admin-mrv-queue'],
    queryFn: async () => {
      const res = await apiClient.get('/admin/mrv/queue');
      return res.data?.data ?? [];
    },
  });

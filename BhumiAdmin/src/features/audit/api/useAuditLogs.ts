import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../../../api/axios';

// ── Matching exact backend SecurityAuditLogItem schema ─────────────────────────
export interface SecurityAuditLogItem {
  id: string;
  timestamp: string;
  action: string;
  actor_name: string;
  actor_type: string;
  actor_role?: string;
  ip_address?: string;
  success: boolean;
}

// ── Matching exact backend GatewayRequestLogItem schema ────────────────────────
export interface GatewayRequestLogItem {
  id: string;
  timestamp: string;
  method: string;
  path: string;
  status_code: number;
  response_time_ms: number;
  error?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  size: number;
  pages: number;
}

// ── Security Audit Hook ───────────────────────────────────────────────────────
const fetchSecurityAuditLogs = async (
  page = 1,
  limit = 50,
): Promise<PaginatedResponse<SecurityAuditLogItem>> => {
  const res = await apiClient.get<PaginatedResponse<SecurityAuditLogItem>>(
    '/admin/activity-logs/security-audit',
    { params: { page, limit } },
  );
  return res.data;
};

export const useAuditLogs = (page = 1, limit = 50) => {
  return useQuery({
    queryKey: ['auditLogs', page, limit],
    queryFn: () => fetchSecurityAuditLogs(page, limit),
    staleTime: 30 * 1000,
  });
};

// ── Gateway Stream Hook ───────────────────────────────────────────────────────
const fetchGatewayLogs = async (
  page = 1,
  limit = 50,
): Promise<PaginatedResponse<GatewayRequestLogItem>> => {
  const res = await apiClient.get<PaginatedResponse<GatewayRequestLogItem>>(
    '/admin/activity-logs/gateway-stream',
    { params: { page, limit } },
  );
  return res.data;
};

export const useGatewayLogs = (page = 1, limit = 50) => {
  return useQuery({
    queryKey: ['gatewayLogs', page, limit],
    queryFn: () => fetchGatewayLogs(page, limit),
    staleTime: 30 * 1000,
  });
};

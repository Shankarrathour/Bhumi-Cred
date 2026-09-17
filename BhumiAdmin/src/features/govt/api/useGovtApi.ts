import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../../api/axios';

export type OrgType = 'ministry' | 'state_department' | 'district_collectorate' | 'ngo_nodal_body' | 'panchayat_raj';
export type JurisdictionLevel = 'central' | 'state' | 'district' | 'block' | 'panchayat';
export type ApprovalStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'CLARIFICATION_REQUIRED';

export interface Address {
  building?: string;
  street: string;
  city: string;
  district: string;
  state: string;
  pincode: string;
}

export interface AuditTrailItem {
  timestamp: string;
  action: string;
  status: string;
  actor: string;
  remarks: string;
}

export interface GovtOrganizationItem {
  id: string;
  org_id: string;
  org_name: string;
  org_type: OrgType;
  department?: string;
  registration_code?: string;
  jurisdiction_level: JurisdictionLevel;
  state: string;
  district?: string;
  block_tehsil?: string;
  village_ward?: string;
  headquarters_address: Address;
  contact_email: string;
  contact_phone: string;

  authorized_person_name?: string;
  authorized_person_designation?: string;
  authorized_person_email?: string;
  authorized_person_phone?: string;

  nodal_person_name?: string;
  nodal_person_designation?: string;
  nodal_person_email?: string;
  nodal_person_phone?: string;

  mou_document_url?: string;
  authority_document_url?: string;

  approval_status: ApprovalStatus;
  status_remarks?: string;
  clarification_notes?: string;
  rejection_reason?: string;
  audit_trail?: AuditTrailItem[];

  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface PaginatedGovtResponse {
  success: boolean;
  data: GovtOrganizationItem[];
  total: number;
  page: number;
  limit: number;
  pages: number;
}

export interface CreateGovtOrgPayload {
  org_id: string;
  org_name: string;
  org_type: OrgType;
  department: string;
  registration_code?: string;
  jurisdiction_level?: JurisdictionLevel;
  state: string;
  district: string;
  block_tehsil?: string;
  village_ward?: string;
  headquarters_address: Address;
  contact_email: string;
  contact_phone: string;

  authorized_person_name: string;
  authorized_person_designation: string;
  authorized_person_email: string;
  authorized_person_phone: string;

  nodal_person_name: string;
  nodal_person_designation: string;
  nodal_person_email: string;
  nodal_person_phone: string;

  mou_document_url?: string;
  authority_document_url?: string;
}

export interface UpdateGovtOrgStatusPayload {
  action: 'APPROVE' | 'REJECT' | 'CLARIFICATION_REQUIRED';
  remarks?: string;
  clarification_notes?: string;
  rejection_reason?: string;
}

// ── React Query Hooks ─────────────────────────────────────────────────────────

export const useGovtOrganizations = (
  page = 1,
  limit = 20,
  search = '',
  status = '',
  dept = ''
) => {
  return useQuery({
    queryKey: ['govtOrganizations', page, limit, search, status, dept],
    queryFn: async (): Promise<PaginatedGovtResponse> => {
      const response = await apiClient.get('/admin/govt/organizations', {
        params: { page, limit, search: search || undefined, status: status || undefined },
      });
      return response.data;
    },
    staleTime: 30 * 1000,
  });
};

export const useGovtOrgDetails = (id?: string) => {
  return useQuery({
    queryKey: ['govtOrgDetails', id],
    queryFn: async (): Promise<GovtOrganizationItem | null> => {
      if (!id) return null;
      const res = await apiClient.get(`/admin/govt/organizations/${id}`);
      return res.data?.data || null;
    },
    enabled: Boolean(id),
  });
};

export const useCreateGovtOrg = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: CreateGovtOrgPayload) => {
      const res = await apiClient.post('/admin/govt/organizations', payload);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['govtOrganizations'] });
    },
  });
};

export const useUpdateGovtOrgStatus = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload: UpdateGovtOrgStatusPayload }) => {
      const res = await apiClient.patch(`/admin/govt/organizations/${id}/status`, payload);
      return res.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['govtOrganizations'] });
      queryClient.invalidateQueries({ queryKey: ['govtOrgDetails', variables.id] });
    },
  });
};

export const useUpdateGovtOrg = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload: Partial<CreateGovtOrgPayload> & { resubmit?: boolean } }) => {
      const res = await apiClient.patch(`/admin/govt/organizations/${id}`, payload);
      return res.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['govtOrganizations'] });
      queryClient.invalidateQueries({ queryKey: ['govtOrgDetails', variables.id] });
    },
  });
};

export const useUploadDocument = () => {
  return useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      const res = await apiClient.post('/uploads/document?folder=mou_documents', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return res.data;
    },
  });
};

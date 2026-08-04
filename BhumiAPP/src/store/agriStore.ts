import { create } from 'zustand';
import api from '../api/apiClient';

export interface AgriCategory {
  id: string;
  name: string;
  slug: string;
  icon: string | null;
  description: string | null;
  is_active: boolean;
  display_order: number;
}

export interface AgriScheme {
  id: string;
  title: string;
  slug: string;
  category_id: string;
  category_name: string;
  ministry: string | null;
  short_description: string;
  benefit_type: string;
  benefit_amount: string;
  interest_rate: string | null;
  deadline: string | null;
  thumbnail: string | null;
  status: string;
  is_active: boolean;
  display_order: number;
}

export interface AgriSchemeDetails extends AgriScheme {
  description: string | null;
  benefits: string[];
  eligibility_summary: string[];
  required_documents: string[];
  official_link: string | null;
}

export interface HomeScheme {
  scheme_id: string;
  scheme_name: string;
  short_description: string | null;
  thumbnail: string | null;
  status: string;
  application_id: string | null;
  current_step: string | null;
}

export interface AgriQuestion {
  id: string;
  scheme_id: string;
  question: string;
  description: string | null;
  field_key: string;
  field_type: string;
  options: string[];
  placeholder: string | null;
  required: boolean;
  validation: string | null;
  display_order: number;
}

interface AgriState {
  categories: AgriCategory[];
  schemes: AgriScheme[];
  currentSchemeDetails: AgriSchemeDetails | null;
  currentQuestionnaire: AgriQuestion[];
  currentApplicationId: string | null;
  uploadedDocuments: any[];
  currentApplicationReview: any | null;
  applicationTimeline: any[];
  clarificationData: any | null;
  homeSchemes: HomeScheme[];
  dashboardRecommendation: any | null;
  searchResults: any[];
  isLoading: boolean;
  isHomeLoading: boolean;
  isSearching: boolean;
  isDetailsLoading: boolean;
  isClarificationLoading: boolean;
  isQuestionnaireLoading: boolean;
  isSubmittingQuestionnaire: boolean;
  isLoadingDocuments: boolean;
  isUploadingDocument: boolean;
  isReviewLoading: boolean;
  isTimelineLoading: boolean;
  error: string | null;
  fetchDashboard: () => Promise<void>;
  fetchHomeDashboard: () => Promise<void>;
  fetchHomeSchemes: () => Promise<void>;
  fetchSchemeDetails: (id: string) => Promise<void>;
  fetchSchemeQuestionnaire: (id: string) => Promise<void>;
  searchSchemes: (query: string) => Promise<void>;
  clearSearch: () => void;
  startApplication: (schemeId: string) => Promise<{ success: boolean; data?: any; error?: string }>;
  submitQuestionnaire: (schemeId: string, applicationId: string, answers: Record<string, any>) => Promise<{ success: boolean; data?: any; error?: string }>;
  fetchApplicationDocuments: (applicationId: string) => Promise<void>;
  uploadDocument: (applicationId: string, documentType: string, file: any) => Promise<{ success: boolean; data?: any; error?: string }>;
  deleteDocument: (applicationId: string, documentId: string) => Promise<{ success: boolean; error?: string }>;
  fetchApplicationReview: (applicationId: string) => Promise<void>;
  submitApplication: (applicationId: string) => Promise<{ success: boolean; data?: any; error?: string }>;
  fetchApplicationTimeline: (applicationId: string) => Promise<void>;
  fetchClarification: (applicationId: string) => Promise<void>;
  resubmitApplication: (applicationId: string) => Promise<{ success: boolean; data?: any; error?: string }>;
}

export const useAgriStore = create<AgriState>((set, get) => ({
  categories: [],
  schemes: [],
  currentSchemeDetails: null,
  currentQuestionnaire: [],
  currentApplicationId: null,
  uploadedDocuments: [],
  currentApplicationReview: null,
  applicationTimeline: [],
  clarificationData: null,
  homeSchemes: [],
  dashboardRecommendation: null,
  searchResults: [],
  isLoading: false,
  isHomeLoading: false,
  isSearching: false,
  isDetailsLoading: false,
  isClarificationLoading: false,
  isQuestionnaireLoading: false,
  isSubmittingQuestionnaire: false,
  isLoadingDocuments: false,
  isUploadingDocument: false,
  isReviewLoading: false,
  isTimelineLoading: false,
  error: null,
  fetchDashboard: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.get('/agri/dashboard');
      if (response.data.success) {
        set({
          categories: response.data.data.categories,
          schemes: response.data.data.schemes,
          isLoading: false,
        });
      } else {
        set({ error: response.data.message || 'Failed to fetch dashboard', isLoading: false });
      }
    } catch (error: any) {
      set({ error: error.message || 'Error fetching dashboard', isLoading: false });
    }
  },
  fetchHomeDashboard: async () => {
    set({ isHomeLoading: true, error: null });
    try {
      const response = await api.get('/agri/dashboard');
      if (response.data.success) {
        set({
          categories: response.data.data.categories,
          schemes: response.data.data.schemes,
          dashboardRecommendation: response.data.data.recommendation,
          isHomeLoading: false,
        });
      } else {
        set({ error: response.data.message || 'Failed to fetch dashboard', isHomeLoading: false });
      }
    } catch (error: any) {
      set({ error: error.message || 'Error fetching dashboard', isHomeLoading: false });
    }
  },
  fetchHomeSchemes: async () => {
    set({ isHomeLoading: true, error: null });
    try {
      const response = await api.get('/agri/home-schemes');
      if (response.data.success) {
        set({
          homeSchemes: response.data.data,
          isHomeLoading: false,
        });
      } else {
        set({ error: response.data.message || 'Failed to fetch home schemes', isHomeLoading: false });
      }
    } catch (error: any) {
      set({ error: error.message || 'Error fetching home schemes', isHomeLoading: false });
    }
  },
  searchSchemes: async (query: string) => {
    set({ isSearching: true, error: null });
    try {
      const response = await api.get(`/agri/search?q=${encodeURIComponent(query)}`);
      if (response.data.success) {
        set({
          searchResults: response.data.data,
          isSearching: false,
        });
      } else {
        set({ error: response.data.message || 'Failed to search schemes', isSearching: false });
      }
    } catch (error: any) {
      set({ error: error.message || 'Error searching schemes', isSearching: false });
    }
  },
  clearSearch: () => {
    set({ searchResults: [], isSearching: false, error: null });
  },
  fetchSchemeDetails: async (id: string) => {
    set({ isDetailsLoading: true, error: null, currentSchemeDetails: null });
    try {
      const response = await api.get(`/agri/schemes/${id}`);
      if (response.data.success) {
        set({
          currentSchemeDetails: response.data.data,
          isDetailsLoading: false,
        });
      } else {
        set({ error: response.data.message || 'Failed to fetch scheme details', isDetailsLoading: false });
      }
    } catch (error: any) {
      set({ error: error.message || 'Error fetching scheme details', isDetailsLoading: false });
    }
  },
  fetchSchemeQuestionnaire: async (id: string) => {
    set({ isQuestionnaireLoading: true, error: null, currentQuestionnaire: [] });
    try {
      const response = await api.get(`/agri/schemes/${id}/questionnaire`);
      if (response.data.success) {
        set({
          currentQuestionnaire: response.data.data,
          isQuestionnaireLoading: false,
        });
      } else {
        set({ error: response.data.message || 'Failed to fetch questionnaire', isQuestionnaireLoading: false });
      }
    } catch (error: any) {
      set({ error: error.message || 'Error fetching questionnaire', isQuestionnaireLoading: false });
    }
  },
  startApplication: async (schemeId: string) => {
    try {
      const response = await api.post(`/agri/schemes/${schemeId}/application`);
      if (response.data.success) {
        set({ currentApplicationId: response.data.data.application_id });
        return { success: true, data: response.data.data };
      } else {
        return { success: false, error: response.data.message };
      }
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  },
  submitQuestionnaire: async (schemeId: string, applicationId: string, answers: Record<string, any>) => {
    set({ isSubmittingQuestionnaire: true, error: null });
    try {
      const response = await api.post(`/agri/schemes/${schemeId}/assessment`, { application_id: applicationId, answers });
      set({ isSubmittingQuestionnaire: false });
      if (response.data.success) {
        return { success: true, data: response.data.data };
      } else {
        const errorMsg = response.data.message || 'Failed to submit questionnaire';
        set({ error: errorMsg });
        return { success: false, error: errorMsg };
      }
    } catch (error: any) {
      const errorMsg = error.response?.data?.detail || error.message || 'Error submitting questionnaire';
      set({ isSubmittingQuestionnaire: false, error: errorMsg });
      return { success: false, error: errorMsg };
    }
  },
  fetchApplicationDocuments: async (applicationId: string) => {
    set({ isLoadingDocuments: true, error: null });
    try {
      const response = await api.get(`/agri/applications/${applicationId}/documents`);
      if (response.data.success) {
        set({ uploadedDocuments: response.data.data, isLoadingDocuments: false });
      } else {
        set({ error: response.data.message, isLoadingDocuments: false });
      }
    } catch (error: any) {
      set({ error: error.message, isLoadingDocuments: false });
    }
  },
  uploadDocument: async (applicationId: string, documentType: string, file: any) => {
    set({ isUploadingDocument: true, error: null });
    try {
      const formData = new FormData();
      formData.append('document_type', documentType);
      formData.append('file', file as any);

      const response = await api.post(`/agri/applications/${applicationId}/documents`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      set({ isUploadingDocument: false });
      if (response.data.success) {
        // Automatically fetch to update list
        useAgriStore.getState().fetchApplicationDocuments(applicationId);
        return { success: true, data: response.data.data };
      } else {
        return { success: false, error: response.data.message };
      }
    } catch (error: any) {
      set({ isUploadingDocument: false, error: error.message });
      return { success: false, error: error.message };
    }
  },
  deleteDocument: async (applicationId: string, documentId: string) => {
    try {
      const response = await api.delete(`/agri/applications/${applicationId}/documents/${documentId}`);
      if (response.data.success) {
        // Automatically fetch to update list
        useAgriStore.getState().fetchApplicationDocuments(applicationId);
        return { success: true };
      } else {
        return { success: false, error: response.data.message };
      }
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  },
  fetchApplicationReview: async (applicationId: string) => {
    set({ isReviewLoading: true, error: null, currentApplicationReview: null });
    try {
      const response = await api.get(`/agri/applications/${applicationId}/review`);
      if (response.data.success) {
        set({
          currentApplicationReview: response.data.data,
          isReviewLoading: false,
        });
      } else {
        set({ error: response.data.message || 'Failed to fetch application review', isReviewLoading: false });
      }
    } catch (error: any) {
      const errorMsg = error.response?.data?.detail || error.message || 'Error fetching review';
      set({ error: errorMsg, isReviewLoading: false });
    }
  },
  submitApplication: async (applicationId: string) => {
    try {
      const response = await api.post(`/agri/applications/${applicationId}/submit`);
      if (response.data.success) {
        // Trigger dashboard refresh
        get().fetchHomeSchemes();
        return { success: true, data: response.data.data };
      } else {
        const errorMsg = response.data.message || 'Failed to submit application';
        set({ error: errorMsg });
        return { success: false, error: errorMsg };
      }
    } catch (error: any) {
      const errorMsg = error.response?.data?.detail || error.message || 'Error submitting application';
      set({ error: errorMsg });
      return { success: false, error: errorMsg };
    }
  },
  fetchApplicationTimeline: async (applicationId: string) => {
    set({ isTimelineLoading: true, error: null });
    try {
      const response = await api.get(`/agri/applications/${applicationId}/timeline`);
      if (response.data.success) {
        set({ applicationTimeline: response.data.data, isTimelineLoading: false });
      } else {
        set({ error: response.data.message || 'Failed to fetch timeline', isTimelineLoading: false });
      }
    } catch (error: any) {
      const errorMsg = error.response?.data?.detail || error.message || 'Error fetching timeline';
      set({ error: errorMsg, isTimelineLoading: false });
    }
  },
  fetchClarification: async (applicationId: string) => {
    set({ isClarificationLoading: true, error: null, clarificationData: null });
    try {
      const response = await api.get(`/agri/applications/${applicationId}/clarification`);
      if (response.data.success) {
        set({ clarificationData: response.data.data, isClarificationLoading: false });
      } else {
        set({ error: response.data.message || 'Failed to fetch clarification', isClarificationLoading: false });
      }
    } catch (error: any) {
      const errorMsg = error.response?.data?.detail || error.message || 'Error fetching clarification';
      set({ error: errorMsg, isClarificationLoading: false });
    }
  },
  resubmitApplication: async (applicationId: string) => {
    try {
      const response = await api.post(`/agri/applications/${applicationId}/resubmit`);
      if (response.data.success) {
        return { success: true, data: response.data.data };
      } else {
        const errorMsg = response.data.message || 'Failed to resubmit application';
        set({ error: errorMsg });
        return { success: false, error: errorMsg };
      }
    } catch (error: any) {
      const errorMsg = error.response?.data?.detail || error.message || 'Error resubmitting application';
      set({ error: errorMsg });
      return { success: false, error: errorMsg };
    }
  },
}));

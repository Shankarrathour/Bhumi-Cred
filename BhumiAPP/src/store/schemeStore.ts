import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../api/apiClient';

export interface GovtScheme {
  id: string;
  name: string;
  department: string;
  description: string;
  eligibility: string[];
  subsidyPercentage: number;
  status: 'Not Applied' | 'Applied' | 'Approved' | 'Rejected';
  applicationDate?: string;
  applicationNumber?: string;
}

interface SchemeState {
  schemes: GovtScheme[];
  isLoading: boolean;
  fetchSchemes: () => Promise<void>;
  applyForScheme: (id: string) => Promise<void>;
  updateSchemeStatus: (id: string, status: GovtScheme['status']) => void;
}

export const useSchemeStore = create<SchemeState>()(
  persist(
    (set, get) => ({
      schemes: [],
      isLoading: false,

      fetchSchemes: async () => {
        set({ isLoading: true });
        try {
          const { data } = await api.get('/agri/home-schemes');
          if (data && data.data) {
             const mappedSchemes: GovtScheme[] = data.data.map((sch: any) => ({
                id: sch.id,
                name: sch.title,
                department: sch.ministry || 'Govt. of India',
                description: sch.short_description,
                eligibility: [], // Can be extracted if provided by summary
                subsidyPercentage: sch.benefit_amount ? parseInt(sch.benefit_amount) : 0,
                status: sch.application_status === 'APPROVED' ? 'Approved' :
                        sch.application_status === 'SUBMITTED' ? 'Applied' :
                        sch.application_status === 'REJECTED' ? 'Rejected' :
                        sch.application_status === 'UNDER_REVIEW' ? 'Applied' : 'Not Applied',
                applicationDate: sch.application_date,
                applicationNumber: sch.application_reference,
             }));
             set({ schemes: mappedSchemes });
          }
        } catch (error) {
          console.warn('[schemeStore] fetchSchemes failed:', error);
        } finally {
          set({ isLoading: false });
        }
      },

      applyForScheme: async (id) => {
        set({ isLoading: true });
        try {
           // We will start an application by calling the backend
           const { data } = await api.post(`/agri/schemes/${id}/application`);
           // The API just starts an application, it would normally require answering a questionnaire.
           // For simple UI continuity, we refresh the list.
           await get().fetchSchemes();
        } catch (error) {
           console.warn('[schemeStore] applyForScheme failed:', error);
           set({ isLoading: false });
           throw error;
        }
      },

      updateSchemeStatus: (id, status) => {
        set({
          schemes: get().schemes.map((sch) =>
            sch.id === id ? { ...sch, status } : sch
          ),
        });
      },
    }),
    {
      name: 'bhumicred_scheme_store',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);

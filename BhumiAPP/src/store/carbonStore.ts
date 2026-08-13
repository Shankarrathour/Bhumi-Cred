import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../api/apiClient';

export interface MRVLog {
  stage: 'Measurement' | 'Reporting' | 'Verification' | 'Issuance';
  status: 'Completed' | 'In Progress' | 'Pending';
  date: string;
  notes: string;
}

export interface CarbonProject {
  id: string;
  name: string;
  type: string;
  description: string;
  creditsEarned: number;
  creditsEstimated: number;
  joined: boolean;
  joinedDate?: string;
  mrvLogs: MRVLog[];
  sustainabilityScoreBonus: number;
}

interface CarbonState {
  projects: CarbonProject[];
  isLoading: boolean;
  fetchProjects: () => Promise<void>;
  joinProject: (id: string, payload: any) => Promise<void>;
  updateMRVStatus: (projectId: string, logIndex: number, status: MRVLog['status'], notes?: string) => void;
  getTotalCredits: () => number;
}

export const useCarbonStore = create<CarbonState>()(
  persist(
    (set, get) => ({
      projects: [],
      isLoading: false,

      fetchProjects: async () => {
        set({ isLoading: true });
        try {
          const { data } = await api.get('/projects');
          const projects = data.data.map((proj: any) => ({
            id: proj.id,
            name: proj.title || proj.name,
            type: proj.type || 'Sustainable Agriculture',
            description: proj.description,
            creditsEarned: proj.credits_earned || 0,
            creditsEstimated: proj.credits_estimated || 0,
            joined: proj.is_enrolled || false,
            joinedDate: proj.enrolled_at || undefined,
            sustainabilityScoreBonus: proj.score_bonus || 0,
            mrvLogs: proj.mrv_logs || [],
          }));
          set({ projects, isLoading: false });
        } catch (error) {
          console.warn('[carbonStore] fetchProjects failed:', error);
          set({ isLoading: false });
        }
      },

      joinProject: async (id, payload) => {
        set({ isLoading: true });
        try {
          await api.post(`/projects/${id}/join`, payload);
          await get().fetchProjects();
        } catch (error) {
          console.warn('[carbonStore] joinProject failed:', error);
          set({ isLoading: false });
          throw error;
        }
      },

      updateMRVStatus: (projectId, logIndex, status, notes) => {
        // Handled via backend mostly, but kept for optimistic UI compatibility if needed
        set({
          projects: get().projects.map((proj) => {
            if (proj.id !== projectId) return proj;
            const updatedLogs = [...proj.mrvLogs];
            if (updatedLogs[logIndex]) {
               updatedLogs[logIndex] = {
                 ...updatedLogs[logIndex],
                 status,
                 ...(notes ? { notes } : {}),
                 date: new Date().toISOString().split('T')[0],
               };
            }
            return { ...proj, mrvLogs: updatedLogs };
          }),
        });
      },

      getTotalCredits: () => {
        return get().projects.reduce((total, proj) => total + (proj.joined ? proj.creditsEarned : 0), 0);
      },
    }),
    {
      name: 'bhumicred_carbon_store',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);

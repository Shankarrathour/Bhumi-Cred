import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

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
  joinProject: (id: string) => Promise<void>;
  updateMRVStatus: (projectId: string, logIndex: number, status: MRVLog['status'], notes?: string) => void;
  getTotalCredits: () => number;
}

const defaultProjects: CarbonProject[] = [
  {
    id: 'carb_wheat',
    name: 'MP Sustainable Wheat Program',
    type: 'Sustainable Agriculture',
    description: 'Reduce water usage and chemical inputs in wheat cultivation to capture soil organic carbon.',
    creditsEarned: 12.5,
    creditsEstimated: 35.0,
    joined: true,
    joinedDate: '2026-05-01',
    sustainabilityScoreBonus: 15,
    mrvLogs: [
      { stage: 'Measurement', status: 'Completed', date: '2026-05-05', notes: 'Soil carbon levels sampled successfully.' },
      { stage: 'Reporting', status: 'Completed', date: '2026-05-15', notes: 'Fertilizer reduction reports submitted.' },
      { stage: 'Verification', status: 'In Progress', date: '2026-05-28', notes: 'Satellite audit verifying canopy cover.' },
      { stage: 'Issuance', status: 'Pending', date: '2026-06-10', notes: 'Credits to be issued upon verification.' },
    ],
  },
  {
    id: 'carb_agro',
    name: 'Agro Forestry Program',
    type: 'Afforestation',
    description: 'Plant high-density timber trees on bunds and borders to create permanent carbon sinks.',
    creditsEarned: 0.0,
    creditsEstimated: 60.0,
    joined: false,
    sustainabilityScoreBonus: 25,
    mrvLogs: [
      { stage: 'Measurement', status: 'Pending', date: '---', notes: 'Initial boundary scan pending tree registration.' },
      { stage: 'Reporting', status: 'Pending', date: '---', notes: 'Tree density reports to be uploaded.' },
      { stage: 'Verification', status: 'Pending', date: '---', notes: 'Verification via geolocated selfie uploads.' },
      { stage: 'Issuance', status: 'Pending', date: '---', notes: 'First carbon payout issuance scheduled in 6 months.' },
    ],
  },
  {
    id: 'carb_organic',
    name: 'Organic Farming Carbon Program',
    type: 'Soil Carbon Capture',
    description: 'Zero chemical tillage and bio-manure additions to rapidly scale humic soil carbon contents.',
    creditsEarned: 5.2,
    creditsEstimated: 25.0,
    joined: true,
    joinedDate: '2026-05-12',
    sustainabilityScoreBonus: 20,
    mrvLogs: [
      { stage: 'Measurement', status: 'Completed', date: '2026-05-14', notes: 'Baseline soil microbial tests completed.' },
      { stage: 'Reporting', status: 'In Progress', date: '2026-05-26', notes: 'Compost application invoices verified.' },
      { stage: 'Verification', status: 'Pending', date: '---', notes: 'On-site physical inspection scheduled.' },
      { stage: 'Issuance', status: 'Pending', date: '---', notes: 'Credits to be issued in July 2026.' },
    ],
  },
];

export const useCarbonStore = create<CarbonState>()(
  persist(
    (set, get) => ({
      projects: defaultProjects,
      isLoading: false,

      joinProject: async (id) => {
        set({ isLoading: true });
        await new Promise((resolve) => setTimeout(resolve, 800));

        set({
          projects: get().projects.map((proj) =>
            proj.id === id
              ? {
                  ...proj,
                  joined: true,
                  joinedDate: new Date().toISOString().split('T')[0],
                  mrvLogs: proj.mrvLogs.map((log, index) =>
                    index === 0
                      ? { ...log, status: 'In Progress' as const, date: new Date().toISOString().split('T')[0] }
                      : log
                  ),
                }
              : proj
          ),
          isLoading: false,
        });
      },

      updateMRVStatus: (projectId, logIndex, status, notes) => {
        set({
          projects: get().projects.map((proj) => {
            if (proj.id !== projectId) return proj;
            const updatedLogs = [...proj.mrvLogs];
            updatedLogs[logIndex] = {
              ...updatedLogs[logIndex],
              status,
              ...(notes ? { notes } : {}),
              date: new Date().toISOString().split('T')[0],
            };
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

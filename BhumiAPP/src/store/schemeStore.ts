import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

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
  applyForScheme: (id: string) => Promise<void>;
  updateSchemeStatus: (id: string, status: GovtScheme['status']) => void;
}

const defaultSchemes: GovtScheme[] = [
  {
    id: 'sch_pmkisan',
    name: 'PM-KISAN (Kisan Samman Nidhi)',
    department: 'Ministry of Agriculture & Farmers Welfare',
    description: 'Income support of ₹6,000 per year in three equal installments to all landholding farmer families.',
    eligibility: ['Must hold cultivable land', 'Must have Aadhaar card linked bank account', 'Excludes institutional land holders'],
    subsidyPercentage: 100,
    status: 'Approved',
    applicationDate: '2026-04-12',
    applicationNumber: 'APP-PMK-90812',
  },
  {
    id: 'sch_solar',
    name: 'Solar Pump Subsidy (PM-KUSUM)',
    department: 'Ministry of New and Renewable Energy',
    description: 'Provides up to 60% subsidy on installation of stand-alone off-grid solar water pumps for irrigation.',
    eligibility: ['Must own agricultural land plot', 'Requires water access proof', 'Excludes lands with diesel tube-wells already subsidized'],
    subsidyPercentage: 60,
    status: 'Not Applied',
  },
  {
    id: 'sch_organic',
    name: 'Organic Farming Promotion (PKVY)',
    department: 'National Mission on Sustainable Agriculture',
    description: 'Financial assistance of ₹50,000 per hectare for clusters transitioning to organic farming practices.',
    eligibility: ['Requires cluster group formation (min 20 farmers)', 'Requires soil test certificate', 'No chemical fertilizer usage certified'],
    subsidyPercentage: 80,
    status: 'Applied',
    applicationDate: '2026-05-20',
    applicationNumber: 'APP-PKVY-87310',
  },
];

export const useSchemeStore = create<SchemeState>()(
  persist(
    (set, get) => ({
      schemes: defaultSchemes,
      isLoading: false,

      applyForScheme: async (id) => {
        set({ isLoading: true });
        await new Promise((resolve) => setTimeout(resolve, 1000));

        set({
          schemes: get().schemes.map((sch) =>
            sch.id === id
              ? {
                  ...sch,
                  status: 'Applied' as const,
                  applicationDate: new Date().toISOString().split('T')[0],
                  applicationNumber: `APP-SCH-${Math.floor(Math.random() * 90000) + 10000}`,
                }
              : sch
          ),
          isLoading: false,
        });
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

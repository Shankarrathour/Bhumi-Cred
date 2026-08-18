import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../api/apiClient';

export interface InsurancePolicy {
  id: string;
  name: string;
  premium: number; // Annually per tree
  coverage: number; // Insurance sum per tree
  registeredTreesCount: number;
  status: 'Active' | 'Inactive' | 'Pending';
  description: string;
}

export interface GreenFamilyUnit {
  familyId: string;
  treesCount: number;
  score: number; // 0-100
  badge: 'Silver Sprout' | 'Golden Leaf' | 'Banyan Master';
  rewardsEarned: number; // Eco Credits
  growthRate: number; // % annual growth
}

interface InsuranceState {
  policies: InsurancePolicy[];
  greenFamily: GreenFamilyUnit | null;
  isLoading: boolean;
  fetchPolicies: () => Promise<void>;
  registerTrees: (policyId: string, treeCount: number) => Promise<void>;
  updateGreenFamily: (treeCount: number) => void;
  claimInsurance: (policyId: string, amount: number) => Promise<boolean>;
}

const defaultPolicies: InsurancePolicy[] = [
  {
    id: 'pol_shield',
    name: 'Green Shield',
    premium: 12,
    coverage: 500,
    registeredTreesCount: 15,
    status: 'Active',
    description: 'Protection against extreme heat waves, localized floods, and primary fungal infections.',
  },
  {
    id: 'pol_ecolife',
    name: 'Eco Life',
    premium: 18,
    coverage: 800,
    registeredTreesCount: 0,
    status: 'Inactive',
    description: 'Elite policy protecting organic and long-living fruit-bearing or timber-yielding trees.',
  },
  {
    id: 'pol_agrosec',
    name: 'Agro Forest Secure',
    premium: 8,
    coverage: 300,
    registeredTreesCount: 10,
    status: 'Active',
    description: 'Basic standard cover protecting young border plantation saplings up to 3 years old.',
  },
  {
    id: 'pol_greenfam',
    name: 'Green Family Plan',
    premium: 45, // bundled per family unit (5 trees)
    coverage: 3000,
    registeredTreesCount: 5,
    status: 'Active',
    description: 'Strategic group policy covering entire Green Family structures (sets of 5 saplings).',
  },
];

// Initial Green Family Unit logic: 5 trees = 1 family
// Total trees registered above is 15 + 10 + 5 = 30 trees (30 / 5 = 6 Green Families)
const initialGreenFamily = (totalTrees: number): GreenFamilyUnit => {
  const families = Math.floor(totalTrees / 5);
  const badge = families >= 8 ? 'Banyan Master' : families >= 4 ? 'Golden Leaf' : 'Silver Sprout';
  return {
    familyId: 'GF-MH-893',
    treesCount: totalTrees,
    score: Math.min(80 + families * 3, 100),
    badge,
    rewardsEarned: families * 250,
    growthRate: 14.5,
  };
};

export const useInsuranceStore = create<InsuranceState>()(
  persist(
    (set, get) => ({
      policies: [],
      greenFamily: initialGreenFamily(30), // standard 30 trees initially
      isLoading: false,

      fetchPolicies: async () => {
        set({ isLoading: true });
        try {
          const { data } = await api.get('/climate-risk-insurance');
          const apiPolicies = data.data.map((item: any) => ({
            id: item.id,
            name: item.name,
            premium: item.premium_amount,
            coverage: item.coverage_amount,
            registeredTreesCount: 0,
            status: item.is_active ? 'Active' : 'Inactive',
            description: item.description || '',
          }));
          
          // Merge with existing registeredTreesCount if they exist in store
          const currentPolicies = get().policies;
          const mergedPolicies = apiPolicies.map((apiPol: InsurancePolicy) => {
             const existing = currentPolicies.find(p => p.id === apiPol.id);
             if (existing) {
               return { ...apiPol, registeredTreesCount: existing.registeredTreesCount, status: existing.registeredTreesCount > 0 ? 'Active' : apiPol.status };
             }
             return apiPol;
          });

          set({ policies: mergedPolicies, isLoading: false });
        } catch (error) {
          console.warn('[insuranceStore] fetchPolicies failed:', error);
          set({ isLoading: false });
        }
      },

      registerTrees: async (policyId, treeCount) => {
        set({ isLoading: true });
        try {
          if (policyId && !policyId.startsWith('pol_')) {
            await api.post(`/climate-risk-insurance/${policyId}/register`, { tree_count: treeCount });
          }
        } catch (error: any) {
          console.warn('[insuranceStore] registerTrees backend warning (persisted locally):', error?.message);
        } finally {
          const updatedPolicies = get().policies.map((pol) =>
            pol.id === policyId
              ? {
                  ...pol,
                  registeredTreesCount: pol.registeredTreesCount + treeCount,
                  status: 'Active' as const,
                }
              : pol
          );
          set({ policies: updatedPolicies, isLoading: false });

          // Update Green Family recalculation
          const totalTrees = updatedPolicies.reduce((sum, pol) => sum + pol.registeredTreesCount, 0);
          get().updateGreenFamily(totalTrees);
        }
      },

      updateGreenFamily: (totalTrees) => {
        const families = Math.floor(totalTrees / 5);
        const badge = families >= 8 ? 'Banyan Master' : families >= 4 ? 'Golden Leaf' : 'Silver Sprout';
        set({
          greenFamily: {
            familyId: get().greenFamily?.familyId || 'GF-MH-893',
            treesCount: totalTrees,
            score: Math.min(75 + families * 3, 100),
            badge,
            rewardsEarned: families * 250,
            growthRate: 14.5 + parseFloat((families * 0.5).toFixed(1)),
          },
        });
      },

      claimInsurance: async (policyId, amount) => {
        set({ isLoading: true });
        try {
          if (policyId && !policyId.startsWith('pol_')) {
            await api.post(`/climate-risk-insurance/${policyId}/claim`, { amount });
          }
        } catch (error) {
          console.warn('[insuranceStore] claimInsurance warning (handled locally):', error);
        } finally {
          set({ isLoading: false });
        }
        return true;
      },
    }),
    {
      name: 'bhumicred_insurance_store',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);

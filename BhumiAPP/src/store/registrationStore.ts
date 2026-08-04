import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../api/apiClient';

interface RegistrationState {
  registrationId: string | null;
  currentStep: number;
  setRegistrationId: (id: string | null) => void;
  setCurrentStep: (step: number) => void;
  clearRegistration: () => void;
  resumeRegistrationFromServer: () => Promise<any>;
}

export const useRegistrationStore = create<RegistrationState>()(
  persist(
    (set, get) => ({
      registrationId: null,
      currentStep: 1,

      setRegistrationId: (id) => set({ registrationId: id }),
      setCurrentStep: (step) => set({ currentStep: step }),
      clearRegistration: () => set({ registrationId: null, currentStep: 1 }),

      resumeRegistrationFromServer: async () => {
        try {
          const { data } = await api.get('/registration/resume');
          if (data && data.success && data.data) {
            const reg = data.data;
            set({
              registrationId: reg.id,
              currentStep: reg.current_step,
            });
            return reg;
          }
        } catch (err) {
          console.warn('[registrationStore] failed to resume registration from server:', err);
        }
        return null;
      },
    }),
    {
      name: 'bhumicred_registration_store',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface ConnectivityState {
  isOnline: boolean;
  isWeakNetwork: boolean;
  toggleOnline: () => void;
  setWeakNetwork: (weak: boolean) => void;
}

export const useConnectivityStore = create<ConnectivityState>()(
  persist(
    (set, get) => ({
      isOnline: true,
      isWeakNetwork: false,

      toggleOnline: () => {
        set({ isOnline: !get().isOnline });
      },

      setWeakNetwork: (weak: boolean) => {
        set({ isWeakNetwork: weak });
      },
    }),
    {
      name: 'bhumicred_connectivity_store',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);

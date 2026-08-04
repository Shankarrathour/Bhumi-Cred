import { configureStore, createListenerMiddleware } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import cartReducer from './slices/cartSlice';
import bookingReducer from './slices/bookingSlice';
import addressReducer from './slices/addressSlice';
import familyReducer, { addFamilyMember, FamilyMember } from './slices/familySlice';
import api from '../api/apiClient';

// ── Relationship mapping: Redux slice → Backend enum ─────────────────────────
const RELATION_MAP: Record<FamilyMember['relation'], string> = {
  Wife: 'spouse',
  Husband: 'spouse',
  Son: 'child',
  Daughter: 'child',
  Father: 'parent',
  Mother: 'parent',
  Other: 'other',
};

// ── Listener middleware: syncs addFamilyMember dispatches to backend ──────────
const listenerMiddleware = createListenerMiddleware();

listenerMiddleware.startListening({
  actionCreator: addFamilyMember,
  effect: async (action) => {
    const member: FamilyMember = action.payload;
    const relationship = RELATION_MAP[member.relation] ?? 'other';
    try {
      await api.post('/farmer/family', {
        name: member.name,
        relationship,
        age: member.age ?? undefined,
      });
    } catch (err) {
      console.warn('[familyListener] failed to persist family member to backend:', err);
    }
  },
});

export const store = configureStore({
  reducer: {
    auth: authReducer,
    cart: cartReducer,
    booking: bookingReducer,
    address: addressReducer,
    family: familyReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().prepend(listenerMiddleware.middleware),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

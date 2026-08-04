import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface Address {
  id: string;
  type: 'Home' | 'Work' | 'Other';
  name: string;
  phone: string;
  address: string;
  flatNo?: string;
  landmark?: string;
  area?: string;
  city?: string;
  pincode?: string;
  state?: string;
  latitude?: number;
  longitude?: number;
}

interface AddressState {
  addresses: Address[];
}

const initialState: AddressState = {
  addresses: [],
};

const addressSlice = createSlice({
  name: 'address',
  initialState,
  reducers: {
    addAddress: (state, action: PayloadAction<Address>) => {
      state.addresses.unshift(action.payload);
    },
    removeAddress: (state, action: PayloadAction<string>) => {
      state.addresses = state.addresses.filter(a => a.id !== action.payload);
    },
    updateAddress: (state, action: PayloadAction<Address>) => {
      const index = state.addresses.findIndex(a => a.id === action.payload.id);
      if (index !== -1) {
        state.addresses[index] = action.payload;
      }
    },
  },
});

export const { addAddress, removeAddress, updateAddress } = addressSlice.actions;
export default addressSlice.reducer;

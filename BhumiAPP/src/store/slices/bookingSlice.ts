import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface FarmerDetails {
  name: string;
  acres: string;
  farmingType: string;
  mobile: string;
  instructions: string;
}

interface BookingState {
  selectedAddress: string | null;
  selectedDate: string | null;
  selectedTimeSlot: string | null;
  farmerDetails: FarmerDetails | null;
  paymentMethod: string | null;
  pastBookings: any[];
}

const initialState: BookingState = {
  selectedAddress: null,
  selectedDate: null,
  selectedTimeSlot: null,
  farmerDetails: null,
  paymentMethod: null,
  pastBookings: [],
};

const bookingSlice = createSlice({
  name: 'booking',
  initialState,
  reducers: {
    setAddress: (state, action: PayloadAction<string>) => {
      state.selectedAddress = action.payload;
    },
    setSlot: (state, action: PayloadAction<{ date: string; time: string }>) => {
      state.selectedDate = action.payload.date;
      state.selectedTimeSlot = action.payload.time;
    },
    setFarmerDetails: (state, action: PayloadAction<FarmerDetails>) => {
      state.farmerDetails = action.payload;
    },
    setPaymentMethod: (state, action: PayloadAction<string>) => {
      state.paymentMethod = action.payload;
    },
    finalizeBooking: (state, action: PayloadAction<any>) => {
      state.pastBookings.unshift(action.payload); // Add to history
      // Clear current flow state
      state.selectedAddress = null;
      state.selectedDate = null;
      state.selectedTimeSlot = null;
      state.farmerDetails = null;
      state.paymentMethod = null;
    },
    clearBookingFlow: (state) => {
      state.selectedAddress = null;
      state.selectedDate = null;
      state.selectedTimeSlot = null;
      state.farmerDetails = null;
      state.paymentMethod = null;
    }
  },
});

export const { 
  setAddress, 
  setSlot, 
  setFarmerDetails, 
  setPaymentMethod, 
  finalizeBooking,
  clearBookingFlow 
} = bookingSlice.actions;

export default bookingSlice.reducer;

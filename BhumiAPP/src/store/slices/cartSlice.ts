import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { mockTests } from '../../mock/mockData';

export interface CartItem {
  testId: string;
  name: string;
  price: number;
  discountedPrice: number;
  homeCollection: boolean;
  quantity: number;
}

interface CartState {
  items: CartItem[];
  totalPrice: number;
  totalDiscount: number;
  finalAmount: number;
  homeCollectionCharge: number;
}

const initialState: CartState = {
  items: [],
  totalPrice: 0,
  totalDiscount: 0,
  finalAmount: 0,
  homeCollectionCharge: 150, // Fixed charge for home collection
};

const calculateTotals = (state: CartState) => {
  let price = 0;
  let final = 0;
  let hasHomeCollection = false;

  state.items.forEach(item => {
    price += item.price * item.quantity;
    final += item.discountedPrice * item.quantity;
    if (item.homeCollection) hasHomeCollection = true;
  });

  const gst = Math.round(final * 0.18); // 18% GST
  const collectionCharge = (hasHomeCollection && state.items.length > 0) ? state.homeCollectionCharge : 0;

  state.totalPrice = price;
  state.totalDiscount = price - final;
  state.finalAmount = final + collectionCharge + gst;
};

const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {
    addToCart: (state, action: PayloadAction<CartItem>) => {
      const existingItem = state.items.find(item => item.testId === action.payload.testId);
      if (existingItem) {
        existingItem.quantity += 1;
      } else {
        state.items.push(action.payload);
      }
      calculateTotals(state);
    },
    removeFromCart: (state, action: PayloadAction<string>) => {
      state.items = state.items.filter(item => item.testId !== action.payload);
      calculateTotals(state);
    },
    updateQuantity: (state, action: PayloadAction<{ testId: string; quantity: number }>) => {
      const item = state.items.find(item => item.testId === action.payload.testId);
      if (item && action.payload.quantity > 0) {
        item.quantity = action.payload.quantity;
      } else if (item && action.payload.quantity === 0) {
        state.items = state.items.filter(i => i.testId !== action.payload.testId);
      }
      calculateTotals(state);
    },
    clearCart: (state) => {
      state.items = [];
      calculateTotals(state);
    },
  },
});

export const { addToCart, removeFromCart, updateQuantity, clearCart } = cartSlice.actions;
export default cartSlice.reducer;

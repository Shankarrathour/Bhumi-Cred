import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export type Role = 'Super Admin' | 'Operations Admin' | 'KYC Admin' | 'GIS Admin' | 'Project Admin' | 'Insurance Admin' | 'Marketplace Admin' | 'Finance Admin' | 'Support Admin' | 'Content Admin' | 'Auditor';

interface AuthState {
  isAuthenticated: boolean;
  user: {
    id: string;
    name: string;
    email: string;
    role: Role;
    permissions: string[];
  } | null;
  token: string | null;
}

const token = localStorage.getItem('token');
const userStr = localStorage.getItem('user');

const initialState: AuthState = {
  isAuthenticated: !!token,
  user: userStr ? JSON.parse(userStr) : null,
  token: token,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    login: (state, action: PayloadAction<{ user: AuthState['user']; token: string }>) => {
      state.isAuthenticated = true;
      state.user = action.payload.user;
      state.token = action.payload.token;
      localStorage.setItem('user', JSON.stringify(action.payload.user));
    },
    logout: (state) => {
      state.isAuthenticated = false;
      state.user = null;
      state.token = null;
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
    },
    updatePermissions: (state, action: PayloadAction<string[]>) => {
      if (state.user) {
        state.user.permissions = action.payload;
      }
    }
  },
});

export const { login, logout, updatePermissions } = authSlice.actions;
export default authSlice.reducer;

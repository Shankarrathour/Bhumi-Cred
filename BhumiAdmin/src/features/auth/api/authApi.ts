import { apiClient } from '../../../api/axios';

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface AuthResponse {
  tokens: {
    access_token: string;
    refresh_token: string;
  };
  admin: {
    id: string;
    email: string;
    name: string;
    role: string;
  };
}

export const loginApi = async (credentials: LoginCredentials): Promise<AuthResponse> => {
  const response = await apiClient.post<AuthResponse>('/admin/auth/login', credentials);
  return response.data;
};

export const verifySessionApi = async () => {
  const response = await apiClient.get('/admin/auth/verify');
  return response.data;
};

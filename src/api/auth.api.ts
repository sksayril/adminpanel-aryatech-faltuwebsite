import axios from 'axios';
import axiosInstance from './axios';
import { API_BASE_URL } from '@/utils/constants';

// Create a separate axios instance for auth endpoints (not under /api/admin)
const authAxiosInstance = axios.create({
  baseURL: API_BASE_URL.replace('/api/admin', '/api'),
  headers: {
    'Content-Type': 'application/json',
  },
});

export interface LoginCredentials {
  Email: string;
  Password: string;
}

export interface LoginResponse {
  success: boolean;
  message: string;
  data: {
    token: string;
    user: {
      _id: string;
      Email: string;
      Name: string;
      Role: string;
      ReferralCode?: string;
      ReferralEarnings?: number;
    };
  };
}

export const authApi = {
  login: async (credentials: LoginCredentials): Promise<LoginResponse> => {
    const response = await authAxiosInstance.post<LoginResponse>('/auth/signin', credentials);
    return response.data;
  },

  logout: async (): Promise<void> => {
    await axiosInstance.post('/auth/logout');
  },

  getCurrentUser: async () => {
    const response = await axiosInstance.get('/auth/me');
    return response.data;
  },
};


import axios from 'axios';
import { api } from '@/lib/axios';
import { API_BASE_URL } from '@/config/api';
import type { ApiResponse } from '@/types/api.types';

const ADMIN_TOKEN_KEY = 'admin-token';

const adminAxios = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

adminAxios.interceptors.request.use((config) => {
  const token = localStorage.getItem(ADMIN_TOKEN_KEY);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

adminAxios.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem(ADMIN_TOKEN_KEY);
      window.location.href = '/admin';
    }
    return Promise.reject(error);
  }
);

export interface PackageItem {
  _id: string;
  key: string;
  title: string;
  englishTitle: string;
  price: number;
  order: number;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export const packagesApi = {
  getPublic: async (): Promise<ApiResponse<PackageItem[]>> => {
    const response = await api.get('/api/packages');
    return response.data;
  },

  getAllAdmin: async (): Promise<ApiResponse<PackageItem[]>> => {
    const response = await adminAxios.get('/api/packages/admin');
    return response.data;
  },

  update: async (
    key: string,
    data: Partial<Pick<PackageItem, 'title' | 'englishTitle' | 'price' | 'order' | 'isActive'>>
  ): Promise<ApiResponse<PackageItem>> => {
    const response = await adminAxios.patch(`/api/packages/admin/${key}`, data);
    return response.data;
  },
};

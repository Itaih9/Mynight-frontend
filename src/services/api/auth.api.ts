import { api } from '@/lib/axios';
import { API_ENDPOINTS } from '@/config/api';
import type { User, AuthResponse, ApiResponse } from '@/types/api.types';

export interface LoginSendOtpRequest {
  phoneNumber: string;
}

export interface LoginVerifyOtpRequest {
  phoneNumber: string;
  otp: string;
}

export interface RegisterSendOtpRequest {
  phoneNumber: string;
  referralCode?: string;
}

export interface RegisterVerifyOtpRequest {
  phoneNumber: string;
  otp: string;
  partnerName1: string;
  partnerName2: string;
  weddingDate: string;
  packageName?: string;
}

export interface UpdateProfileRequest {
  name?: string;
  email?: string;
  partnerName1?: string;
  partnerName2?: string;
  weddingDate?: string;
  phoneNumber?: string;
}

export const authApi = {
  loginSendOtp: async (data: LoginSendOtpRequest): Promise<ApiResponse<{ message: string }>> => {
    const response = await api.post(API_ENDPOINTS.AUTH.LOGIN_SEND_OTP, data);
    return response.data;
  },

  loginVerifyOtp: async (data: LoginVerifyOtpRequest): Promise<ApiResponse<AuthResponse>> => {
    const response = await api.post(API_ENDPOINTS.AUTH.LOGIN_VERIFY_OTP, data);
    return response.data;
  },

  loginWithPassword: async (data: { phoneNumber: string; password: string }): Promise<ApiResponse<AuthResponse>> => {
    const response = await api.post(API_ENDPOINTS.AUTH.LOGIN_PASSWORD, data);
    return response.data;
  },

  // Couple gallery login by identifier only (phone or email) — gallery-scoped session.
  galleryLogin: async (data: { identifier: string }): Promise<ApiResponse<AuthResponse>> => {
    const response = await api.post('/api/auth/gallery-login', data);
    return response.data;
  },

  registerSendOtp: async (data: RegisterSendOtpRequest): Promise<ApiResponse<{ message: string; isNewUser: boolean }>> => {
    const response = await api.post(API_ENDPOINTS.AUTH.REGISTER_SEND_OTP, data);
    return response.data;
  },

  registerVerifyOtp: async (data: RegisterVerifyOtpRequest): Promise<ApiResponse<AuthResponse>> => {
    const response = await api.post(API_ENDPOINTS.AUTH.REGISTER_VERIFY_OTP, data);
    return response.data;
  },

  getProfile: async (): Promise<ApiResponse<User>> => {
    const response = await api.get(API_ENDPOINTS.AUTH.PROFILE);
    return response.data;
  },

  updateProfile: async (data: UpdateProfileRequest): Promise<ApiResponse<User>> => {
    const response = await api.put(API_ENDPOINTS.AUTH.PROFILE, data);
    return response.data;
  },

  registerDirect: async (data: {
    partnerName1: string;
    partnerName2: string;
    weddingDate: string;
    phoneNumber?: string;
    referralCode?: string;
    packageName?: string;
  }): Promise<ApiResponse<AuthResponse>> => {
    const response = await api.post(API_ENDPOINTS.AUTH.REGISTER_DIRECT, data);
    return response.data;
  },

  setPassword: async (data: { password: string; phoneNumber?: string; email?: string }): Promise<ApiResponse<User>> => {
    const response = await api.put(API_ENDPOINTS.AUTH.SET_PASSWORD, data);
    return response.data;
  },

  logout: async (): Promise<void> => {
    localStorage.removeItem('token');
  },
};

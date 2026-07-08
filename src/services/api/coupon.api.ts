import { api } from '@/lib/axios';
import { API_ENDPOINTS } from '@/config/api';
import type { Coupon, CouponValidation, ApiResponse } from '@/types/api.types';

export interface ValidateCouponRequest {
  code: string;
}

export interface CreateCouponRequest {
  code: string;
  discountPercent: number;
  maxUses?: number;
  expiresAt?: string;
}

export const couponApi = {
  validate: async (data: ValidateCouponRequest): Promise<ApiResponse<CouponValidation>> => {
    const response = await api.post(API_ENDPOINTS.COUPONS.VALIDATE, data);
    return response.data;
  },

  create: async (data: CreateCouponRequest): Promise<ApiResponse<Coupon>> => {
    const response = await api.post(API_ENDPOINTS.COUPONS.CREATE, data);
    return response.data;
  },

  getAll: async (): Promise<ApiResponse<Coupon[]>> => {
    const response = await api.get(API_ENDPOINTS.COUPONS.LIST);
    return response.data;
  },

  getActiveStandard: async (): Promise<ApiResponse<{ code: string; discountPercent: number } | null>> => {
    const response = await api.get(API_ENDPOINTS.COUPONS.ACTIVE_STANDARD);
    return response.data;
  },

  getMyPersonal: async (): Promise<ApiResponse<{
    code: string;
    discountAmount?: number;
    discountPercent: number;
    maxUses: number;
    usedCount: number;
    isActive: boolean;
  }>> => {
    const response = await api.get('/api/coupons/mine');
    return response.data;
  },

  getEventCoupon: async (eventId: string): Promise<ApiResponse<{
    code: string;
    discountAmount?: number;
    discountPercent: number;
    maxUses: number;
    usedCount: number;
    isActive: boolean;
  } | null>> => {
    const response = await api.get(`/api/coupons/event/${eventId}`);
    return response.data;
  },

  deactivate: async (couponId: string): Promise<ApiResponse<void>> => {
    const response = await api.patch(API_ENDPOINTS.COUPONS.DEACTIVATE(couponId));
    return response.data;
  },
};

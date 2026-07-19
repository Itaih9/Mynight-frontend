import { api } from '@/lib/axios';
import type { ApiResponse } from '@/types/api.types';

export interface CreateGiftRequest {
  amount: number;
  packageName?: string;
  coupleName?: string;
  gifterEmail?: string;
  message?: string;
  couponCode?: string;
}

export interface CreateGiftResponse {
  giftId: string;
  amount: number;
  chargeAmount: number;
  publicKey?: string;
  companyId?: string;
}

export interface ChargeGiftResponse {
  couponCode: string;
  amount: number;
  coupleName?: string;
  message?: string;
}

export interface GiftInfo {
  amount: number;
  coupleName?: string;
  message?: string;
  packageName?: string;
  redeemed: boolean;
}

export const giftApi = {
  create: async (data: CreateGiftRequest): Promise<ApiResponse<CreateGiftResponse>> => {
    const res = await api.post('/api/gifts/create', data);
    return res.data;
  },
  charge: async (giftId: string, token: string): Promise<ApiResponse<ChargeGiftResponse>> => {
    const res = await api.post('/api/gifts/charge', { giftId, token });
    return res.data;
  },
  beginRedirect: async (giftId: string): Promise<ApiResponse<{ redirectUrl: string }>> => {
    const res = await api.post('/api/gifts/begin-redirect', { giftId });
    return res.data;
  },
  verifyRedirect: async (giftId: string): Promise<ApiResponse<ChargeGiftResponse>> => {
    const res = await api.post('/api/gifts/verify-redirect', { giftId });
    return res.data;
  },
  getByCode: async (code: string): Promise<ApiResponse<GiftInfo>> => {
    const res = await api.get(`/api/gifts/${code}`);
    return res.data;
  },
};

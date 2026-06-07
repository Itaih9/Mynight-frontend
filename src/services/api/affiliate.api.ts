import { api, affiliateApiClient } from '@/lib/axios';
import { API_ENDPOINTS } from '@/config/api';
import type { Affiliate, Referral, AffiliateStats, Withdrawal, ApiResponse } from '@/types/api.types';

export interface AffiliateRegisterRequest {
  email: string;
  password: string;
  phone: string;
  category: string;
  intent: string;
}

export interface AffiliateLoginRequest {
  email: string;
  password: string;
}

export interface AffiliateLoginResponse {
  token: string;
  affiliate: Affiliate;
}

export interface UpdateAffiliateProfileRequest {
  name?: string;
  phone?: string;
  paypalEmail?: string;
  bankDetails?: string;
  bankName?: string;
  bankBranch?: string;
  bankAccountNumber?: string;
  bankAccountHolder?: string;
}

export interface RequestWithdrawalPayload {
  amount: number;
  note?: string;
}

export const affiliateApi = {
  register: async (data: AffiliateRegisterRequest): Promise<ApiResponse<Affiliate>> => {
    const response = await api.post(API_ENDPOINTS.AFFILIATE.REGISTER, data);
    return response.data;
  },

  login: async (data: AffiliateLoginRequest): Promise<ApiResponse<AffiliateLoginResponse>> => {
    const response = await api.post(API_ENDPOINTS.AFFILIATE.LOGIN, data);
    return response.data;
  },

  getMe: async (): Promise<ApiResponse<Affiliate>> => {
    const response = await affiliateApiClient.get(API_ENDPOINTS.AFFILIATE.ME);
    return response.data;
  },

  updateProfile: async (data: UpdateAffiliateProfileRequest): Promise<ApiResponse<Affiliate>> => {
    const response = await affiliateApiClient.patch(API_ENDPOINTS.AFFILIATE.ME, data);
    return response.data;
  },

  getStats: async (affiliateId: string): Promise<ApiResponse<AffiliateStats>> => {
    const response = await affiliateApiClient.get(API_ENDPOINTS.AFFILIATE.STATS(affiliateId));
    return response.data;
  },

  getReferrals: async (affiliateId: string): Promise<ApiResponse<Referral[]>> => {
    const response = await affiliateApiClient.get(API_ENDPOINTS.AFFILIATE.REFERRALS(affiliateId));
    return response.data;
  },

  requestWithdrawal: async (data: RequestWithdrawalPayload): Promise<ApiResponse<Withdrawal>> => {
    const response = await affiliateApiClient.post(API_ENDPOINTS.AFFILIATE.WITHDRAWALS, data);
    return response.data;
  },

  getWithdrawals: async (): Promise<ApiResponse<Withdrawal[]>> => {
    const response = await affiliateApiClient.get(API_ENDPOINTS.AFFILIATE.WITHDRAWALS);
    return response.data;
  },

  getPrepaid: async (): Promise<ApiResponse<PrepaidSummary>> => {
    const response = await affiliateApiClient.get(API_ENDPOINTS.AFFILIATE.PREPAID);
    return response.data;
  },
};

export interface PrepaidUsage {
  _id: string;
  eventId?: { _id: string; name?: string; eventCode?: string; customSlug?: string } | string;
  userId?: string;
  couponCode: string;
  eventName: string;
  coupleName?: string;
  usedAt: string;
  createdAt: string;
}

export interface LinkedCoupon {
  _id: string;
  code: string;
  discountPercent: number;
  maxUses: number;
  usedCount: number;
  expiresAt?: string;
  isActive: boolean;
  createdAt: string;
}

export interface PrepaidSummary {
  balance: number;
  used: number;
  couponCode?: string;
  usages: PrepaidUsage[];
  linkedCoupons?: LinkedCoupon[];
}

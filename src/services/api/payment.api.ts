import { api } from '@/lib/axios';
import { API_ENDPOINTS } from '@/config/api';
import type { Payment, ApiResponse } from '@/types/api.types';

export interface CreatePaymentRequest {
  eventId: string;
  amount: number;
  couponCode?: string;
}

export interface ChargePaymentRequest {
  paymentId: string;
  token: string;
}

export interface PayWithCouponRequest {
  eventId: string;
  couponCode: string;
  amount: number;
}

export interface CreatePaymentResponse {
  success: boolean;
  message: string;
  paymentId?: string;
  publicKey?: string;
  companyId?: string;
  payment?: Payment;
}

export const paymentApi = {
  create: async (data: CreatePaymentRequest): Promise<ApiResponse<CreatePaymentResponse>> => {
    const response = await api.post(API_ENDPOINTS.PAYMENT.CREATE, data);
    return response.data;
  },

  charge: async (data: ChargePaymentRequest): Promise<ApiResponse<Payment>> => {
    const response = await api.post(API_ENDPOINTS.PAYMENT.CHARGE, data);
    return response.data;
  },

  beginSumitRedirect: async (paymentId: string): Promise<ApiResponse<{ redirectUrl: string }>> => {
    const response = await api.post(API_ENDPOINTS.PAYMENT.SUMIT_REDIRECT_BEGIN, { paymentId });
    return response.data;
  },

  verifySumitRedirect: async (paymentId: string): Promise<ApiResponse<Payment> & { success: boolean; message?: string }> => {
    const response = await api.post(API_ENDPOINTS.PAYMENT.SUMIT_REDIRECT_VERIFY, { paymentId });
    return response.data;
  },

  payWithCoupon: async (data: PayWithCouponRequest): Promise<ApiResponse<Payment>> => {
    const response = await api.post(API_ENDPOINTS.PAYMENT.PAY_WITH_COUPON, data);
    return response.data;
  },

  getStatus: async (eventId: string): Promise<ApiResponse<{ isPaid: boolean; payment?: Payment }>> => {
    const response = await api.get(API_ENDPOINTS.PAYMENT.STATUS(eventId));
    return response.data;
  },

  getHistory: async (): Promise<ApiResponse<Payment[]>> => {
    const response = await api.get(API_ENDPOINTS.PAYMENT.HISTORY);
    return response.data;
  },

  getById: async (paymentId: string): Promise<ApiResponse<Payment>> => {
    const response = await api.get(API_ENDPOINTS.PAYMENT.BY_ID(paymentId));
    return response.data;
  },
};

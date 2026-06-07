import { api } from '@/lib/axios';
import { API_ENDPOINTS } from '@/config/api';
import type { ApiResponse } from '@/types/api.types';

export interface ReviewSubmitRequest {
  rating: number;
  text: string;
}

export interface ApprovedReview {
  _id: string;
  rating: number;
  text: string;
  name?: string;
  createdAt: string;
}

export const reviewApi = {
  submit: async (data: ReviewSubmitRequest): Promise<ApiResponse<{ id: string }>> => {
    const response = await api.post(API_ENDPOINTS.REVIEWS.SUBMIT, data);
    return response.data;
  },

  getApproved: async (): Promise<ApiResponse<ApprovedReview[]>> => {
    const response = await api.get(API_ENDPOINTS.REVIEWS.APPROVED);
    return response.data;
  },
};

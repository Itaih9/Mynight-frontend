import { api } from '@/lib/axios';
import { API_ENDPOINTS } from '@/config/api';
import type { ApiResponse } from '@/types/api.types';

export interface ContactSubmitRequest {
  name: string;
  email: string;
  phone?: string;
  subject: string;
  message: string;
}

export const contactApi = {
  submit: async (data: ContactSubmitRequest): Promise<ApiResponse<{ message: string }>> => {
    const response = await api.post(API_ENDPOINTS.CONTACT.SUBMIT, data);
    return response.data;
  },
};

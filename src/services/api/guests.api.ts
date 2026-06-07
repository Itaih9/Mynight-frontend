import { api } from '@/lib/axios';
import { API_ENDPOINTS } from '@/config/api';
import type { ApiResponse } from '@/types/api.types';

export interface Guest {
  _id: string;
  eventId: string;
  name: string;
  phone: string;
  email?: string;
  status: 'pending' | 'invited' | 'viewed' | 'uploaded';
  invitedAt?: string;
  viewedAt?: string;
  uploadedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AddGuestRequest {
  name: string;
  phone: string;
  email?: string;
}

export interface BulkAddResult {
  added: number;
  skipped: number;
  errors: string[];
}

export const guestsApi = {
  add: async (eventId: string, data: AddGuestRequest): Promise<ApiResponse<Guest>> => {
    const response = await api.post(API_ENDPOINTS.GUESTS.ADD(eventId), data);
    return response.data;
  },

  addBulk: async (eventId: string, guests: AddGuestRequest[]): Promise<ApiResponse<BulkAddResult>> => {
    const response = await api.post(API_ENDPOINTS.GUESTS.BULK(eventId), { guests });
    return response.data;
  },

  list: async (eventId: string): Promise<ApiResponse<Guest[]>> => {
    const response = await api.get(API_ENDPOINTS.GUESTS.LIST(eventId));
    return response.data;
  },

  update: async (eventId: string, guestId: string, data: Partial<AddGuestRequest>): Promise<ApiResponse<Guest>> => {
    const response = await api.put(API_ENDPOINTS.GUESTS.UPDATE(eventId, guestId), data);
    return response.data;
  },

  delete: async (eventId: string, guestId: string): Promise<ApiResponse<void>> => {
    const response = await api.delete(API_ENDPOINTS.GUESTS.DELETE(eventId, guestId));
    return response.data;
  },

  deleteAll: async (eventId: string): Promise<ApiResponse<void>> => {
    const response = await api.delete(API_ENDPOINTS.GUESTS.DELETE_ALL(eventId));
    return response.data;
  },
};

import { api } from '@/lib/axios';
import { API_ENDPOINTS } from '@/config/api';
import type { Event, ApiResponse, SharingPermissions } from '@/types/api.types';

export interface CreateEventRequest {
  name: string;
}

export interface UpdateSharingPermissionsRequest {
  showProPhotos?: boolean;
  showGuestPhotos?: boolean;
  showGuestStories?: boolean;
}

export interface GuestListFile {
  s3Key: string;
  originalName: string;
  size: number;
  mimeType: string;
  uploadedAt: string;
}

export const eventsApi = {
  create: async (data: CreateEventRequest): Promise<ApiResponse<Event>> => {
    const response = await api.post(API_ENDPOINTS.EVENTS.CREATE, data);
    return response.data;
  },

  getMyEvents: async (): Promise<ApiResponse<Event[]>> => {
    const response = await api.get(API_ENDPOINTS.EVENTS.MY_EVENTS);
    return response.data;
  },

  getByCode: async (code: string): Promise<ApiResponse<Event>> => {
    const response = await api.get(API_ENDPOINTS.EVENTS.BY_CODE(code));
    return response.data;
  },

  getBySlug: async (slug: string): Promise<ApiResponse<Event>> => {
    const response = await api.get(API_ENDPOINTS.EVENTS.BY_SLUG(slug));
    return response.data;
  },

  getByCodeOrSlug: async (identifier: string): Promise<ApiResponse<Event>> => {
    const response = await api.get(API_ENDPOINTS.EVENTS.FIND(identifier));
    return response.data;
  },

  getById: async (id: string): Promise<ApiResponse<Event>> => {
    const response = await api.get(API_ENDPOINTS.EVENTS.BY_ID(id));
    return response.data;
  },

  delete: async (id: string): Promise<ApiResponse<void>> => {
    const response = await api.delete(API_ENDPOINTS.EVENTS.BY_ID(id));
    return response.data;
  },

  updateSlug: async (eventId: string, customSlug: string): Promise<ApiResponse<Event>> => {
    const response = await api.patch(API_ENDPOINTS.EVENTS.UPDATE_SLUG(eventId), { customSlug });
    return response.data;
  },

  updateSharingPermissions: async (
    eventId: string,
    data: UpdateSharingPermissionsRequest
  ): Promise<ApiResponse<{ sharingPermissions: SharingPermissions }>> => {
    const response = await api.patch(API_ENDPOINTS.EVENTS.SHARING_PERMISSIONS(eventId), data);
    return response.data;
  },

  uploadGuestListFile: async (
    eventId: string,
    file: File
  ): Promise<ApiResponse<GuestListFile>> => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post(API_ENDPOINTS.EVENTS.GUEST_LIST_FILE(eventId), formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },

  getGuestListFile: async (eventId: string): Promise<ApiResponse<GuestListFile | null>> => {
    const response = await api.get(API_ENDPOINTS.EVENTS.GUEST_LIST_FILE(eventId));
    return response.data;
  },

  deleteGuestListFile: async (eventId: string): Promise<ApiResponse<void>> => {
    const response = await api.delete(API_ENDPOINTS.EVENTS.GUEST_LIST_FILE(eventId));
    return response.data;
  },
};

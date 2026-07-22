import { api } from '@/lib/axios';
import axios from 'axios';
import type { ApiResponse } from '@/types/api.types';

export interface DisposableStatus {
  enabled: boolean;
  coupleName: string;
  weddingDate: string | null;
  shotLimit: number;
  taken: number;
  remaining: number;
}

export const disposableApi = {
  status: async (code: string, deviceId: string): Promise<ApiResponse<DisposableStatus>> => {
    const res = await api.get('/api/photos/disposable/status', { params: { code, deviceId } });
    return res.data;
  },

  presignedUrl: async (
    eventCode: string,
    deviceId: string,
    fileName: string,
    fileType: string
  ): Promise<ApiResponse<{ uploadUrl: string; key: string; eventId: string; remaining: number }>> => {
    const res = await api.post('/api/photos/disposable/presigned-url', { eventCode, deviceId, fileName, fileType });
    return res.data;
  },

  uploadToS3: async (uploadUrl: string, blob: Blob): Promise<void> => {
    await axios.put(uploadUrl, blob, { headers: { 'Content-Type': blob.type || 'image/jpeg' } });
  },

  complete: async (
    eventCode: string,
    deviceId: string,
    s3Key: string,
    guestName: string,
    metadata: { size: number; mimeType: string }
  ): Promise<ApiResponse<{ remaining: number }>> => {
    const res = await api.post('/api/photos/disposable/complete', { eventCode, deviceId, s3Key, guestName, metadata });
    return res.data;
  },
};

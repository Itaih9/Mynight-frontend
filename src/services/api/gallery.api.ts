import { api, apiFormData } from '@/lib/axios';
import { API_ENDPOINTS } from '@/config/api';
import type { Photo, PresignedUrlResponse, MatchPhotosResponse, FaceGroup, ApiResponse } from '@/types/api.types';
import axios from 'axios';

export interface ShowcaseFace {
  faceId: string;
  boundingBox: { Width: number; Height: number; Left: number; Top: number };
}

export interface ShowcaseMedia {
  url: string;
  /** Small rendition (thumbnails/{key}) when it exists. */
  thumbnailUrl?: string;
  /** Capped rendition (display/{key}) when it exists. */
  displayUrl?: string;
  type: 'photo' | 'video';
  /** Story name (S3 subfolder under gallery_showcase/), or null for grid-only. */
  story: string | null;
  /** Faces detected in this photo, for the face circles (when indexed). */
  indexedFaces?: ShowcaseFace[];
}

export interface GetPresignedUrlRequest {
  eventId: string;
  fileName: string;
  fileType: string;
}

export interface CompleteUploadRequest {
  eventId: string;
  s3Key: string;
  metadata: {
    size: number;
    mimeType: string;
    width?: number;
    height?: number;
  };
}

export interface UploadProgress {
  loaded: number;
  total: number;
  percentage: number;
}

export const galleryApi = {
  getPresignedUrl: async (data: GetPresignedUrlRequest): Promise<ApiResponse<PresignedUrlResponse>> => {
    const response = await api.post(API_ENDPOINTS.PHOTOS.PRESIGNED_URL, data);
    return response.data;
  },

  uploadToS3: async (
    uploadUrl: string,
    file: File,
    onProgress?: (progress: UploadProgress) => void
  ): Promise<void> => {
    await axios.put(uploadUrl, file, {
      headers: {
        'Content-Type': file.type,
      },
      onUploadProgress: (progressEvent) => {
        if (onProgress && progressEvent.total) {
          onProgress({
            loaded: progressEvent.loaded,
            total: progressEvent.total,
            percentage: Math.round((progressEvent.loaded / progressEvent.total) * 100),
          });
        }
      },
    });
  },

  completeUpload: async (data: CompleteUploadRequest): Promise<ApiResponse<Photo>> => {
    const response = await api.post(API_ENDPOINTS.PHOTOS.COMPLETE, data);
    return response.data;
  },

  uploadPhoto: async (
    eventId: string,
    file: File,
    onProgress?: (progress: UploadProgress) => void
  ): Promise<Photo> => {
    const presignedResponse = await galleryApi.getPresignedUrl({
      eventId,
      fileName: file.name,
      fileType: file.type,
    });

    if (!presignedResponse.data) {
      throw new Error('Failed to get presigned URL');
    }

    const { uploadUrl, key } = presignedResponse.data;

    await galleryApi.uploadToS3(uploadUrl, file, onProgress);

    const completeResponse = await galleryApi.completeUpload({
      eventId,
      s3Key: key,
      metadata: {
        size: file.size,
        mimeType: file.type,
      },
    });

    if (!completeResponse.data) {
      throw new Error('Failed to complete upload');
    }

    return completeResponse.data;
  },

  guestUpload: async (eventCode: string, file: File, guestName?: string): Promise<ApiResponse<Photo>> => {
    const formData = new FormData();
    formData.append('eventCode', eventCode);
    formData.append('photo', file);
    if (guestName) {
      formData.append('guestName', guestName);
    }
    const response = await apiFormData.post(API_ENDPOINTS.PHOTOS.GUEST_UPLOAD, formData);
    return response.data;
  },

  guestPresignedUrl: async (eventCode: string, fileName: string, fileType: string): Promise<ApiResponse<PresignedUrlResponse & { eventId: string }>> => {
    const response = await api.post(API_ENDPOINTS.PHOTOS.GUEST_PRESIGNED_URL, { eventCode, fileName, fileType });
    return response.data;
  },

  guestCompleteUpload: async (eventCode: string, s3Key: string, guestName: string, metadata: { size: number; mimeType: string }): Promise<ApiResponse<Photo>> => {
    const response = await api.post(API_ENDPOINTS.PHOTOS.GUEST_COMPLETE, { eventCode, s3Key, guestName, metadata });
    return response.data;
  },

  matchPhotos: async (eventId: string, selfie: File): Promise<ApiResponse<MatchPhotosResponse>> => {
    const formData = new FormData();
    formData.append('eventId', eventId);
    formData.append('selfie', selfie);
    const response = await apiFormData.post(API_ENDPOINTS.PHOTOS.MATCH, formData);
    return response.data;
  },

  getEventPhotos: async (eventId: string, page: number = 1, limit: number = 20, seed?: string): Promise<any> => {
    const response = await api.get(API_ENDPOINTS.PHOTOS.EVENT_PHOTOS(eventId), {
      params: seed ? { page, limit, seed } : { page, limit },
    });
    return response.data;
  },

  getEventStoryGroups: async (eventId: string): Promise<any> => {
    const response = await api.get(API_ENDPOINTS.PHOTOS.EVENT_STORY_GROUPS(eventId));
    return response.data;
  },

  deletePhoto: async (photoId: string): Promise<ApiResponse<void>> => {
    const response = await api.delete(API_ENDPOINTS.PHOTOS.DELETE(photoId));
    return response.data;
  },

  getDownloadUrl: async (photoId: string): Promise<ApiResponse<{ url: string }>> => {
    const response = await api.get(API_ENDPOINTS.PHOTOS.DOWNLOAD_URL(photoId));
    return response.data;
  },

  downloadZip: async (photoIds: string[]): Promise<Blob> => {
    const response = await api.post(
      API_ENDPOINTS.PHOTOS.DOWNLOAD_ZIP,
      { photoIds },
      { responseType: 'blob' }
    );
    return response.data;
  },

  getEventFaces: async (eventId: string): Promise<ApiResponse<FaceGroup[]>> => {
    const response = await api.get(API_ENDPOINTS.FACES.EVENT_FACES(eventId));
    return response.data;
  },

  getFacePhotos: async (eventId: string, faceId: string): Promise<ApiResponse<Photo[]>> => {
    const response = await api.get(API_ENDPOINTS.FACES.FACE_PHOTOS(eventId, faceId));
    return response.data;
  },

  downloadFaceZip: async (eventId: string, faceId: string): Promise<Blob> => {
    const response = await api.get(API_ENDPOINTS.FACES.FACE_DOWNLOAD(eventId, faceId), {
      responseType: 'blob',
    });
    return response.data;
  },

  getShowcaseImages: async (): Promise<ApiResponse<ShowcaseMedia[]>> => {
    const response = await api.get(API_ENDPOINTS.PHOTOS.SHOWCASE_IMAGES);
    return response.data;
  },

  getShowcaseFacePhotos: async (faceId: string): Promise<ApiResponse<ShowcaseMedia[]>> => {
    const response = await api.get(`/api/photos/showcase/faces/${faceId}`);
    return response.data;
  },
};

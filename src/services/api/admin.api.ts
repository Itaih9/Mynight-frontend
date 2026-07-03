import axios from 'axios';
import { API_BASE_URL } from '@/config/api';
import type { ApiResponse } from '@/types/api.types';

const ADMIN_TOKEN_KEY = 'admin-token';

const adminAxios = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

adminAxios.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem(ADMIN_TOKEN_KEY);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

adminAxios.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem(ADMIN_TOKEN_KEY);
      window.location.href = '/admin';
    }
    return Promise.reject(error);
  }
);

export interface AdminLoginResponse {
  admin: {
    id: string;
    email: string;
    name: string;
  };
  token: string;
}

export interface AdminLoginOtpRequestResponse {
  email: string;
  requiresOtp: true;
}

export interface DashboardStats {
  users: { total: number };
  events: { total: number; paid: number; unpaid: number };
  coupons: { total: number; active: number };
  referrals: { total: number; converted: number };
  contacts: { total: number; new: number };
  reviews: { total: number; pending: number };
}

export interface User {
  _id: string;
  phoneNumber: string;
  name?: string;
  email?: string;
  referralCode?: string;
  createdAt: string;
}

export interface AdminEvent {
  _id: string;
  name: string;
  eventCode: string;
  customSlug?: string;
  slugChangeCount?: number;
  isPaid: boolean;
  packageName?: string;
  photoCount: number;
  userId: {
    _id: string;
    name?: string;
    phoneNumber: string;
    email?: string;
  };
  uploadStartedAt?: string;
  uploadExpiresAt?: string;
  guestListFile?: {
    s3Key: string;
    originalName: string;
    size: number;
    mimeType: string;
    uploadedAt: string;
  };
  guestListUploadCount?: number;
  coverImage?: { s3Key: string; url: string; uploadedAt: string };
  referredByAffiliate?: { name: string; email: string; referralCode: string } | null;
  couponCode?: string | null;
  createdAt: string;
}

export interface AdminCoupon {
  _id: string;
  code: string;
  discountPercent: number;
  discountAmount?: number;
  maxUses: number | null;
  usedCount: number;
  expiresAt: string | null;
  isActive: boolean;
  affiliateId?: string;
  ownerUserId?: string;
  type?: 'standard' | 'affiliate' | 'prepaid' | 'personal';
  ownerCoupleName?: string;
  ownerEventCode?: string;
  ownerEventName?: string;
  createdAt: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface AdminReferral {
  _id: string;
  affiliateId: {
    _id: string;
    name: string;
    email: string;
    referralCode: string;
  };
  referredUserId: {
    _id: string;
    name?: string;
    phone: string;
    email?: string;
  };
  status: 'pending' | 'converted' | 'expired';
  commissionAmount?: number;
  paymentAmount?: number;
  createdAt: string;
  convertedAt?: string;
}

export interface AdminContact {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  subject: string;
  message: string;
  status: 'new' | 'read' | 'replied' | 'archived';
  createdAt: string;
}

export interface AdminAffiliate {
  _id: string;
  name?: string;
  email: string;
  phone: string;
  category: 'photographer' | 'makeup' | 'costume' | 'manager' | 'venue' | 'other';
  intent: 'resell' | 'affiliate';
  paypalEmail?: string;
  bankDetails?: string;
  bankName?: string;
  bankBranch?: string;
  bankAccountNumber?: string;
  bankAccountHolder?: string;
  referralCode: string;
  status: 'pending' | 'approved' | 'rejected';
  totalEarnings: number;
  pendingEarnings: number;
  paidEarnings: number;
  referralCount: number;
  prepaidBalance?: number;
  prepaidUsed?: number;
  prepaidCouponCode?: string;
  createdAt: string;
}

export interface AdminPrepaidUsage {
  _id: string;
  eventId?: { _id: string; name?: string; eventCode?: string; customSlug?: string } | string;
  userId?: string;
  couponCode: string;
  eventName: string;
  coupleName?: string;
  usedAt: string;
  createdAt: string;
}

export interface AdminLinkedCoupon {
  _id: string;
  code: string;
  discountPercent: number;
  maxUses: number;
  usedCount: number;
  expiresAt?: string;
  isActive: boolean;
  createdAt: string;
}

export interface AdminPrepaidSummary {
  balance: number;
  used: number;
  couponCode?: string;
  usages: AdminPrepaidUsage[];
  linkedCoupons?: AdminLinkedCoupon[];
}

export interface AdminReview {
  _id: string;
  rating: number;
  text: string;
  userId?: string;
  name?: string;
  coupleName?: string;
  eventName?: string;
  eventCode?: string;
  eventSlug?: string;
  status: 'pending' | 'approved' | 'hidden';
  createdAt: string;
}

export interface ZipJobStatus {
  jobId: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  totalFiles: number;
  completedFiles: number;
  failedFiles: number;
  failedEntries: string[];
  error?: string;
}

export const adminApi = {
  setToken: (token: string) => {
    localStorage.setItem(ADMIN_TOKEN_KEY, token);
  },

  getToken: (): string | null => {
    return localStorage.getItem(ADMIN_TOKEN_KEY);
  },

  clearToken: () => {
    localStorage.removeItem(ADMIN_TOKEN_KEY);
  },

  login: async (email: string, password: string): Promise<AdminLoginOtpRequestResponse> => {
    const response = await adminAxios.post<ApiResponse<AdminLoginOtpRequestResponse>>(
      '/api/admin/login',
      { email, password }
    );
    return response.data.data!;
  },

  verifyOtp: async (email: string, otp: string): Promise<AdminLoginResponse> => {
    const response = await adminAxios.post<ApiResponse<AdminLoginResponse>>(
      '/api/admin/verify-otp',
      { email, otp }
    );
    const data = response.data.data!;
    adminApi.setToken(data.token);
    return data;
  },

  logout: () => {
    adminApi.clearToken();
  },

  changePassword: async (currentPassword: string, newPassword: string): Promise<void> => {
    await adminAxios.post('/api/admin/change-password', { currentPassword, newPassword });
  },

  getDashboard: async (): Promise<DashboardStats> => {
    const response = await adminAxios.get<ApiResponse<DashboardStats>>('/api/admin/dashboard');
    return response.data.data!;
  },

  getUsers: async (page: number = 1, limit: number = 20): Promise<{ users: User[]; pagination: any }> => {
    const response = await adminAxios.get<ApiResponse<{ users: User[]; pagination: any }>>(
      `/api/admin/users?page=${page}&limit=${limit}`
    );
    return response.data.data!;
  },

  resetUserPassword: async (userId: string, newPassword: string): Promise<void> => {
    await adminAxios.patch(`/api/admin/users/${userId}/reset-password`, { newPassword });
  },

  deleteUser: async (userId: string): Promise<void> => {
    await adminAxios.delete(`/api/admin/users/${userId}`);
  },

  getPendingCounts: async (): Promise<{ pendingAffiliates: number; pendingWithdrawals: number }> => {
    const response = await adminAxios.get<ApiResponse<{ pendingAffiliates: number; pendingWithdrawals: number }>>(
      '/api/admin/pending-counts'
    );
    return response.data.data || { pendingAffiliates: 0, pendingWithdrawals: 0 };
  },

  listWithdrawals: async (status?: 'pending' | 'paid' | 'rejected'): Promise<any[]> => {
    const url = status ? `/api/admin/withdrawals?status=${status}` : '/api/admin/withdrawals';
    const response = await adminAxios.get<ApiResponse<any[]>>(url);
    return response.data.data || [];
  },

  markWithdrawalPaid: async (withdrawalId: string, adminNote?: string): Promise<void> => {
    await adminAxios.patch(`/api/admin/withdrawals/${withdrawalId}/paid`, { adminNote });
  },

  rejectWithdrawal: async (withdrawalId: string, adminNote?: string): Promise<void> => {
    await adminAxios.patch(`/api/admin/withdrawals/${withdrawalId}/reject`, { adminNote });
  },

  payoutAffiliate: async (affiliateId: string, amount: number, adminNote?: string): Promise<void> => {
    await adminAxios.post(`/api/admin/affiliates/${affiliateId}/payout`, { amount, adminNote });
  },

  topUpPrepaid: async (affiliateId: string, events: number, adminNote?: string): Promise<{ prepaidBalance: number; prepaidUsed: number; prepaidCouponCode?: string }> => {
    const response = await adminAxios.post<ApiResponse<{ prepaidBalance: number; prepaidUsed: number; prepaidCouponCode?: string }>>(
      `/api/admin/affiliates/${affiliateId}/prepaid/topup`,
      { events, adminNote }
    );
    return response.data.data!;
  },

  getAffiliatePrepaid: async (affiliateId: string): Promise<AdminPrepaidSummary> => {
    const response = await adminAxios.get<ApiResponse<AdminPrepaidSummary>>(
      `/api/admin/affiliates/${affiliateId}/prepaid`
    );
    return response.data.data!;
  },

  getEvents: async (page: number = 1, limit: number = 20): Promise<{ events: AdminEvent[]; pagination: any }> => {
    const response = await adminAxios.get<ApiResponse<{ events: AdminEvent[]; pagination: any }>>(
      `/api/admin/events?page=${page}&limit=${limit}`
    );
    return response.data.data!;
  },

  getCoupons: async (page: number = 1, limit: number = 20): Promise<{ coupons: AdminCoupon[]; pagination: any }> => {
    const response = await adminAxios.get<ApiResponse<{ coupons: AdminCoupon[]; pagination: any }>>(
      `/api/admin/coupons?page=${page}&limit=${limit}`
    );
    return response.data.data!;
  },

  createCoupon: async (data: {
    code: string;
    discountPercent: number;
    maxUses?: number;
    expiresAt?: string;
    affiliateId?: string;
  }): Promise<AdminCoupon> => {
    const response = await adminAxios.post<ApiResponse<AdminCoupon>>('/api/admin/coupons', data);
    return response.data.data!;
  },

  deleteCoupon: async (couponId: string): Promise<void> => {
    await adminAxios.delete(`/api/admin/coupons/${couponId}`);
  },

  getReferrals: async (page: number = 1, limit: number = 20): Promise<{ referrals: AdminReferral[]; pagination: any }> => {
    const response = await adminAxios.get<ApiResponse<{ referrals: AdminReferral[]; pagination: any }>>(
      `/api/admin/referrals?page=${page}&limit=${limit}`
    );
    return response.data.data!;
  },

  getContacts: async (page: number = 1, limit: number = 20, status?: string): Promise<{ contacts: AdminContact[]; pagination: any }> => {
    const url = status
      ? `/api/contact?page=${page}&limit=${limit}&status=${status}`
      : `/api/contact?page=${page}&limit=${limit}`;
    const response = await adminAxios.get<ApiResponse<{ contacts: AdminContact[]; pagination: any }>>(url);
    return response.data.data!;
  },

  updateContactStatus: async (contactId: string, status: string): Promise<void> => {
    await adminAxios.patch(`/api/contact/${contactId}/status`, { status });
  },

  deleteContact: async (contactId: string): Promise<void> => {
    await adminAxios.delete(`/api/contact/${contactId}`);
  },

  getAffiliates: async (page: number = 1, limit: number = 20): Promise<{ affiliates: AdminAffiliate[]; pagination: any }> => {
    const response = await adminAxios.get<ApiResponse<{ affiliates: AdminAffiliate[]; pagination: any }>>(
      `/api/admin/affiliates?page=${page}&limit=${limit}`
    );
    return response.data.data!;
  },

  updateAffiliateStatus: async (affiliateId: string, status: 'pending' | 'approved' | 'rejected'): Promise<AdminAffiliate> => {
    const response = await adminAxios.patch<ApiResponse<AdminAffiliate>>(
      `/api/admin/affiliates/${affiliateId}/status`,
      { status }
    );
    return response.data.data!;
  },

  extendEventUpload: async (eventId: string, days: number = 30): Promise<{ message: string }> => {
    const response = await adminAxios.patch<ApiResponse<{ message: string }>>(
      `/api/admin/events/${eventId}/extend`,
      { days }
    );
    return response.data.data!;
  },

  updateEventSlug: async (eventId: string, customSlug: string, resetCount: boolean = false): Promise<AdminEvent> => {
    const response = await adminAxios.patch<ApiResponse<AdminEvent>>(
      `/api/admin/events/${eventId}/slug`,
      { customSlug, resetCount }
    );
    return response.data.data!;
  },

  downloadGuestList: async (eventId: string): Promise<{ url: string; fileName: string }> => {
    const response = await adminAxios.get<ApiResponse<{ url: string; fileName: string }>>(
      `/api/admin/events/${eventId}/guest-list-download`
    );
    return response.data.data!;
  },

  getGuestListData: async (
    eventId: string
  ): Promise<{ guests: { name: string; phone: string }[]; total: number; fileName: string }> => {
    const response = await adminAxios.get<
      ApiResponse<{ guests: { name: string; phone: string }[]; total: number; fileName: string }>
    >(`/api/admin/events/${eventId}/guest-list-data`);
    return response.data.data!;
  },

  uploadPhotosToEvent: async (eventId: string, files: File[], onProgress?: (progress: number) => void): Promise<{ uploaded: number }> => {
    const formData = new FormData();
    files.forEach((file) => formData.append('photos', file));

    const response = await adminAxios.post<ApiResponse<{ uploaded: number }>>(
      `/api/admin/events/${eventId}/photos`,
      formData,
      {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (progressEvent) => {
          if (onProgress && progressEvent.total) {
            const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            onProgress(percent);
          }
        },
      }
    );
    return response.data.data!;
  },

  getEventPhotos: async (eventId: string): Promise<{ event: AdminEvent; photos: any[] }> => {
    const response = await adminAxios.get<ApiResponse<{ event: AdminEvent; photos: any[] }>>(
      `/api/admin/events/${eventId}/photos`
    );
    return response.data.data!;
  },

  deleteEvent: async (eventId: string): Promise<void> => {
    await adminAxios.delete(`/api/admin/events/${eventId}`);
  },

  deleteEventPhoto: async (eventId: string, photoId: string): Promise<void> => {
    await adminAxios.delete(`/api/admin/events/${eventId}/photos/${photoId}`);
  },

  deleteEventPhotosBulk: async (eventId: string, photoIds: string[]): Promise<{ deleted: number; message: string }> => {
    const response = await adminAxios.post<ApiResponse<{ deleted: number; message: string }>>(
      `/api/admin/events/${eventId}/photos/bulk-delete`,
      { photoIds }
    );
    return response.data.data!;
  },

  getBatchPresignedUrls: async (
    eventId: string,
    files: { fileName: string; fileType: string }[]
  ): Promise<{ fileName: string; uploadUrl: string; key: string }[]> => {
    const response = await adminAxios.post<ApiResponse<{ fileName: string; uploadUrl: string; key: string }[]>>(
      `/api/admin/events/${eventId}/presigned-urls`,
      { files }
    );
    return response.data.data!;
  },

  batchCompleteUpload: async (
    eventId: string,
    uploads: { s3Key: string; size: number; mimeType: string; width?: number; height?: number; path?: string }[]
  ): Promise<{ created: number }> => {
    const response = await adminAxios.post<ApiResponse<{ created: number }>>(
      `/api/admin/events/${eventId}/complete-batch`,
      { uploads }
    );
    return response.data.data!;
  },

  initiateZipMultipart: async (
    eventId: string,
    fileName: string,
    fileSize: number
  ): Promise<{ uploadId: string; s3Key: string; totalParts: number; chunkSize: number }> => {
    const response = await adminAxios.post<
      ApiResponse<{ uploadId: string; s3Key: string; totalParts: number; chunkSize: number }>
    >(`/api/admin/events/${eventId}/zip-multipart/initiate`, { fileName, fileSize });
    return response.data.data!;
  },

  getZipPartPresignedUrls: async (
    s3Key: string,
    uploadId: string,
    partNumbers: number[]
  ): Promise<{ partNumber: number; uploadUrl: string }[]> => {
    const response = await adminAxios.post<
      ApiResponse<{ partNumber: number; uploadUrl: string }[]>
    >('/api/admin/zip-multipart/presign-parts', { s3Key, uploadId, partNumbers });
    return response.data.data!;
  },

  completeZipMultipart: async (
    s3Key: string,
    uploadId: string,
    parts: { partNumber: number; etag: string }[]
  ): Promise<{ s3Key: string }> => {
    const response = await adminAxios.post<ApiResponse<{ s3Key: string }>>(
      '/api/admin/zip-multipart/complete',
      { s3Key, uploadId, parts }
    );
    return response.data.data!;
  },

  abortZipMultipart: async (s3Key: string, uploadId: string): Promise<void> => {
    await adminAxios.post('/api/admin/zip-multipart/abort', { s3Key, uploadId });
  },

  getZipPresignedUrl: async (
    eventId: string,
    fileName: string,
    fileSize: number
  ): Promise<{ uploadUrl: string; s3Key: string }> => {
    const response = await adminAxios.post<ApiResponse<{ uploadUrl: string; s3Key: string }>>(
      `/api/admin/events/${eventId}/zip-presigned-url`,
      { fileName, fileSize }
    );
    return response.data.data!;
  },

  startZipProcessing: async (
    eventId: string,
    s3Key: string
  ): Promise<{ jobId: string }> => {
    const response = await adminAxios.post<ApiResponse<{ jobId: string }>>(
      `/api/admin/events/${eventId}/process-zip`,
      { s3Key }
    );
    return response.data.data!;
  },

  getZipJobStatus: async (eventId: string, jobId: string): Promise<ZipJobStatus> => {
    const response = await adminAxios.get<ApiResponse<ZipJobStatus>>(
      `/api/admin/events/${eventId}/zip-jobs/${jobId}`
    );
    return response.data.data!;
  },

  uploadFileToS3: async (uploadUrl: string, file: File): Promise<void> => {
    await fetch(uploadUrl, {
      method: 'PUT',
      body: file,
      headers: { 'Content-Type': file.type },
    });
  },

  getReviews: async (page: number = 1, limit: number = 20, status?: string): Promise<{ reviews: AdminReview[]; pagination: any }> => {
    const url = status
      ? `/api/reviews?page=${page}&limit=${limit}&status=${status}`
      : `/api/reviews?page=${page}&limit=${limit}`;
    const response = await adminAxios.get<ApiResponse<{ reviews: AdminReview[]; pagination: any }>>(url);
    return response.data.data!;
  },

  updateReviewStatus: async (reviewId: string, status: 'pending' | 'approved' | 'hidden'): Promise<AdminReview> => {
    const response = await adminAxios.patch<ApiResponse<AdminReview>>(
      `/api/reviews/${reviewId}/status`,
      { status }
    );
    return response.data.data!;
  },

  uploadCoverImage: async (eventId: string, file: File): Promise<{ s3Key: string; url: string; uploadedAt: string }> => {
    const formData = new FormData();
    formData.append('coverImage', file);
    const response = await adminAxios.post<ApiResponse<{ s3Key: string; url: string; uploadedAt: string }>>(
      `/api/admin/events/${eventId}/cover-image`,
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } }
    );
    return response.data.data!;
  },

  deleteCoverImage: async (eventId: string): Promise<void> => {
    await adminAxios.delete(`/api/admin/events/${eventId}/cover-image`);
  },
};

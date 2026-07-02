export interface User {
  id: string;
  phoneNumber: string;
  name?: string;
  email?: string;
  partnerName1?: string;
  partnerName2?: string;
  weddingDate?: string;
  referredBy?: string;
  referralCode: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface SharingPermissions {
  showProPhotos: boolean;
  showGuestPhotos: boolean;
  showGuestStories: boolean;
}

export interface Event {
  _id: string;
  userId: string;
  name: string;
  eventCode: string;
  customSlug?: string;
  slugChangeCount?: number;
  collectionId: string;
  isPaid: boolean;
  packageName?: string;
  paymentId?: string;
  photoCount: number;
  lastPhotoUploadedAt?: string;
  uploadStartedAt?: string;
  uploadExpiresAt?: string;
  expiresAt: string;
  eventDate?: string;
  sharingPermissions?: SharingPermissions;
  coverImage?: { s3Key: string; url: string; uploadedAt: string };
  createdAt: string;
  updatedAt: string;
}

export interface EventSummary {
  id: string;
  eventCode: string;
  customSlug?: string;
  isPaid: boolean;
  packageName?: string;
  sharingPermissions?: SharingPermissions;
}

export interface Photo {
  _id: string;
  eventId: string;
  s3Key: string;
  url: string;
  thumbnailUrl: string;
  /** Web-optimized ~2048px rendition; may 404 for photos uploaded before the
   *  display pipeline existed — consumers must fall back to url. */
  displayUrl?: string;
  posterUrl?: string;
  faceId?: string;
  indexedFaces?: IndexedFace[];
  uploadedBy?: 'owner' | 'guest';
  uploaderName?: string;
  metadata: PhotoMetadata;
  createdAt: string;
  updatedAt: string;
}

export interface IndexedFace {
  faceId: string;
  confidence: number;
  boundingBox: {
    Width: number;
    Height: number;
    Left: number;
    Top: number;
  };
}

export interface PhotoMetadata {
  size: number;
  mimeType: string;
  width?: number;
  height?: number;
}

export interface Payment {
  _id: string;
  userId: string;
  eventId: string;
  amount: number;
  originalAmount?: number;
  discountAmount: number;
  currency: string;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'refunded';
  paymentIntentId: string;
  provider: 'sumit' | 'coupon' | 'stripe';
  metadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface Coupon {
  _id: string;
  code: string;
  discountPercent: number;
  maxUses: number;
  usedCount: number;
  expiresAt?: string;
  isActive: boolean;
  createdBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Affiliate {
  _id: string;
  name?: string;
  email: string;
  paypalEmail?: string;
  phone: string;
  bankDetails?: string;
  bankName?: string;
  bankBranch?: string;
  bankAccountNumber?: string;
  bankAccountHolder?: string;
  category: 'photographer' | 'makeup' | 'costume' | 'manager' | 'venue' | 'other';
  intent: 'resell' | 'affiliate';
  status: 'pending' | 'approved' | 'rejected';
  referralCode: string;
  totalEarnings: number;
  pendingEarnings: number;
  paidEarnings: number;
  totalReferrals: number;
  prepaidBalance?: number;
  prepaidUsed?: number;
  prepaidCouponCode?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Withdrawal {
  _id: string;
  affiliateId: string;
  amount: number;
  status: 'pending' | 'paid' | 'rejected';
  note?: string;
  adminNote?: string;
  paidAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Referral {
  _id: string;
  affiliateId: string;
  referredUserId: string;
  referralCode: string;
  status: 'pending' | 'converted' | 'paid';
  commissionAmount: number;
  commissionRate: number;
  paymentId?: string;
  paymentAmount?: number;
  convertedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Contact {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  subject: string;
  message: string;
  status: 'new' | 'read' | 'replied' | 'archived';
  createdAt: string;
  updatedAt: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface AuthResponse {
  token: string;
  user: User;
  event?: EventSummary;
}

export interface PresignedUrlResponse {
  uploadUrl: string;
  key: string;
}

export interface MatchPhotosResponse {
  matchedPhotos: Photo[];
  faceId?: string;
}

export interface CouponValidation {
  valid: boolean;
  discount?: number;
  discountPercent?: number;
  discountAmount?: number;
  message?: string;
}

export interface AffiliateStats {
  totalReferrals: number;
  activeReferrals: number;
  totalEarnings: number;
  pendingEarnings: number;
}

export interface FaceGroup {
  faceId: string;
  photoCount: number;
  samplePhotoUrl: string;
}

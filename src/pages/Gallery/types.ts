export interface MediaItem {
  id: string;
  type: 'photo' | 'video';
  source: 'guest' | 'pro';
  url: string;
  thumbnail: string;
  poster?: string;
  uploaderName: string;
  timestamp: Date;
  orientation?: 'landscape' | 'portrait';
  width?: number;
  height?: number;
}

export interface StoryGroup {
  uploaderName: string;
  avatar: string;
  items: MediaItem[];
}

export interface GalleryPageProps {
  coupleName?: string;
  isOwner?: boolean;
  guestLink?: string;
  isShowcase?: boolean;
}

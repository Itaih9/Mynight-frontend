import { startTransition, useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { eventsApi, galleryApi } from '@/services/api';
import type { Event, Photo } from '@/types/api.types';
import type { MediaItem } from '../types';

const PAGE_SIZE = 50;
const WARM_ASSET_COUNT = 18;

interface PhotosPage {
  page: number;
  photos: Photo[];
  hasMore: boolean;
}

const getPhotoPreviewUrl = (photo: Photo) => {
  if (photo.metadata?.mimeType?.startsWith('video/')) {
    return photo.posterUrl || photo.thumbnailUrl || '';
  }

  return photo.thumbnailUrl || photo.url || '';
};

export const useGalleryData = (eventId?: string, preloadedEvent?: Event | null, shuffleSeed?: string) => {
  const [event, setEvent] = useState<Event | null>(preloadedEvent ?? null);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [loadMoreError, setLoadMoreError] = useState<string | null>(null);

  const mountedRef = useRef(true);
  const pageRef = useRef(1);
  const hasMoreRef = useRef(false);
  const isLoadingMoreRef = useRef(false);
  const loadMoreErrorRef = useRef<string | null>(null);
  const eventRef = useRef<Event | null>(preloadedEvent ?? null);
  const requestIdRef = useRef(0);
  const prefetchedPageRef = useRef<PhotosPage | null>(null);
  const prefetchingPageRef = useRef<number | null>(null);
  const prefetchPromiseRef = useRef<Promise<PhotosPage | null> | null>(null);
  const warmedAssetLinksRef = useRef<HTMLLinkElement[]>([]);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const mapPhotosToMediaItems = useCallback((items: Photo[]): MediaItem[] => {
    return items.map((photo) => {
      const metadata = photo.metadata ?? ({} as Photo['metadata']);
      const mimeType = metadata.mimeType || '';
      const width = metadata.width;
      const height = metadata.height;

      return {
        id: photo._id,
        type: mimeType.startsWith('video/') ? 'video' : 'photo',
        source: photo.uploadedBy === 'guest' ? 'guest' : 'pro',
        url: photo.url,
        thumbnail: photo.thumbnailUrl,
        displayUrl: photo.displayUrl,
        poster: photo.posterUrl,
        category: photo.category ?? null,
        indexedFaces: photo.indexedFaces,
        uploaderName:
          photo.uploaderName || (photo.uploadedBy === 'guest' ? 'אורח' : 'צלם האירוע'),
        timestamp: new Date(photo.createdAt),
        orientation:
          width && height
            ? height > width
              ? 'portrait'
              : 'landscape'
            : 'landscape',
        width,
        height,
      };
    });
  }, []);

  useEffect(() => {
    eventRef.current = event;
  }, [event]);

  useEffect(() => {
    hasMoreRef.current = hasMore;
  }, [hasMore]);

  useEffect(() => {
    isLoadingMoreRef.current = isLoadingMore;
  }, [isLoadingMore]);

  useEffect(() => {
    loadMoreErrorRef.current = loadMoreError;
  }, [loadMoreError]);

  const clearWarmedAssets = useCallback(() => {
    warmedAssetLinksRef.current.forEach((link) => link.parentNode?.removeChild(link));
    warmedAssetLinksRef.current = [];
  }, []);

  const warmPhotoAssets = useCallback((items: Photo[]) => {
    if (typeof document === 'undefined' || typeof navigator === 'undefined') return;

    const connection = (navigator as any).connection;
    if (connection?.saveData || /(^|-)2g$/.test(connection?.effectiveType || '')) return;

    clearWarmedAssets();

    const seen = new Set<string>();
    items.slice(0, WARM_ASSET_COUNT).forEach((photo) => {
      const href = getPhotoPreviewUrl(photo);
      if (!href || seen.has(href)) return;
      seen.add(href);

      const link = document.createElement('link');
      link.rel = 'prefetch';
      link.as = 'image';
      link.href = href;
      link.fetchPriority = 'low' as any;
      document.head.appendChild(link);
      warmedAssetLinksRef.current.push(link);
    });
  }, [clearWarmedAssets]);

  useEffect(() => {
    return () => clearWarmedAssets();
  }, [clearWarmedAssets]);

  const fetchPhotosPage = useCallback(async (activeEventId: string, page: number): Promise<PhotosPage> => {
    const photosResponse = await galleryApi.getEventPhotos(activeEventId, page, PAGE_SIZE, shuffleSeed);
    const photosArray = Array.isArray(photosResponse.data) ? photosResponse.data : [];
    const backendHasMore = Boolean((photosResponse as any).pagination?.hasMore);

    return {
      page,
      photos: photosArray,
      hasMore: backendHasMore && photosArray.length > 0,
    };
  }, [shuffleSeed]);

  const prefetchPage = useCallback((activeEventId: string, page: number, requestId: number = requestIdRef.current) => {
    if (prefetchedPageRef.current?.page === page) return Promise.resolve(prefetchedPageRef.current);
    if (prefetchingPageRef.current === page && prefetchPromiseRef.current) return prefetchPromiseRef.current;

    prefetchingPageRef.current = page;
    const promise = fetchPhotosPage(activeEventId, page)
      .then((pageData) => {
        if (!mountedRef.current || requestId !== requestIdRef.current) return null;
        if (eventRef.current?._id !== activeEventId) return null;
        prefetchedPageRef.current = pageData;
        warmPhotoAssets(pageData.photos);
        return pageData;
      })
      .catch(() => null)
      .finally(() => {
        if (prefetchingPageRef.current === page) {
          prefetchingPageRef.current = null;
          prefetchPromiseRef.current = null;
        }
      });

    prefetchPromiseRef.current = promise;
    return promise;
  }, [fetchPhotosPage]);

  useEffect(() => {
    if (eventId === '__showcase__') {
      setEvent(preloadedEvent ?? null);
      setPhotos([]);
      setError(null);
      setHasMore(false);
      setIsLoading(false);
      pageRef.current = 1;
      hasMoreRef.current = false;
      isLoadingMoreRef.current = false;
      prefetchedPageRef.current = null;
      prefetchingPageRef.current = null;
      prefetchPromiseRef.current = null;
      clearWarmedAssets();
      eventRef.current = preloadedEvent ?? null;
      return;
    }

    const currentRequestId = ++requestIdRef.current;

    const fetchData = async () => {
      const hasToken = !!localStorage.getItem('token');
      const isValidId = typeof eventId === 'string' && eventId.length === 24;

      if (!eventId) {
        if (!mountedRef.current || currentRequestId !== requestIdRef.current) return;
        setError(null);
        setIsLoading(true);
        return;
      }

      if (!preloadedEvent && !isValidId && !hasToken) {
        if (!mountedRef.current || currentRequestId !== requestIdRef.current) return;
        setEvent(null);
        setPhotos([]);
        setError('לא נמצא אירוע');
        setHasMore(false);
        setIsLoading(false);
        setLoadMoreError(null);
        pageRef.current = 1;
        hasMoreRef.current = false;
        isLoadingMoreRef.current = false;
        loadMoreErrorRef.current = null;
        prefetchedPageRef.current = null;
        prefetchingPageRef.current = null;
        prefetchPromiseRef.current = null;
        clearWarmedAssets();
        eventRef.current = null;
        return;
      }

      if (!mountedRef.current || currentRequestId !== requestIdRef.current) return;

      setIsLoading(true);
      setError(null);
      setPhotos([]);
      setHasMore(false);
      setIsLoadingMore(false);
      setLoadMoreError(null);

      pageRef.current = 1;
      hasMoreRef.current = false;
      isLoadingMoreRef.current = false;
      loadMoreErrorRef.current = null;
      prefetchedPageRef.current = null;
      prefetchingPageRef.current = null;
      prefetchPromiseRef.current = null;
      clearWarmedAssets();

      try {
        let eventData: Event | null = preloadedEvent ?? null;

        if (!eventData && isValidId && hasToken) {
          const eventResponse = await eventsApi.getById(eventId!);
          eventData = eventResponse.data || null;
        } else if (!eventData && hasToken) {
          const eventsResponse = await eventsApi.getMyEvents();
          if (eventsResponse.data && eventsResponse.data.length > 0) {
            eventData = eventsResponse.data[0];
          }
        }

        if (!mountedRef.current || currentRequestId !== requestIdRef.current) return;

        if (!eventData) {
          setEvent(null);
          setPhotos([]);
          setError('לא נמצא אירוע');
          setHasMore(false);
          setIsLoading(false);
          eventRef.current = null;
          return;
        }

        setEvent(eventData);
        eventRef.current = eventData;

        const firstPage = await fetchPhotosPage(eventData._id, 1);

        if (!mountedRef.current || currentRequestId !== requestIdRef.current) return;

        startTransition(() => {
          setPhotos(firstPage.photos);
        });
        setHasMore(firstPage.hasMore);

        pageRef.current = 1;
        hasMoreRef.current = firstPage.hasMore;

        if (firstPage.hasMore) {
          prefetchPage(eventData._id, 2, currentRequestId);
        }
      } catch (err: any) {
        if (!mountedRef.current || currentRequestId !== requestIdRef.current) return;
        console.error('Failed to fetch gallery data:', err);
        setEvent(null);
        setPhotos([]);
        setHasMore(false);
        setError(err.response?.data?.error || 'שגיאה בטעינת הגלריה');
      } finally {
        if (!mountedRef.current || currentRequestId !== requestIdRef.current) return;
        setIsLoading(false);
      }
    };

    fetchData();
  }, [eventId, preloadedEvent?._id, fetchPhotosPage, prefetchPage]);

  const mediaItems = useMemo(() => {
    return mapPhotosToMediaItems(photos);
  }, [photos, mapPhotosToMediaItems]);

  const loadMore = useCallback(async () => {
    const activeEvent = eventRef.current;

    if (!activeEvent || isLoadingMoreRef.current || !hasMoreRef.current || loadMoreErrorRef.current) return;

    isLoadingMoreRef.current = true;
    if (mountedRef.current) setIsLoadingMore(true);

    try {
      const nextPage = pageRef.current + 1;
      let pageData = prefetchedPageRef.current?.page === nextPage ? prefetchedPageRef.current : null;

      if (!pageData && prefetchingPageRef.current === nextPage && prefetchPromiseRef.current) {
        pageData = await prefetchPromiseRef.current;
      }

      if (!pageData) {
        pageData = await fetchPhotosPage(activeEvent._id, nextPage);
      }

      if (!mountedRef.current) return;

      prefetchedPageRef.current = null;
      clearWarmedAssets();
      const newPhotos = pageData.photos;
      loadMoreErrorRef.current = null;
      setLoadMoreError(null);

      startTransition(() => {
        setPhotos((prev) => {
          const existingIds = new Set(prev.map((p) => p._id));
          const uniqueNewPhotos = newPhotos.filter((p) => !existingIds.has(p._id));
          return uniqueNewPhotos.length ? [...prev, ...uniqueNewPhotos] : prev;
        });
      });

      pageRef.current = nextPage;
      const nextHasMore = pageData.hasMore;

      hasMoreRef.current = nextHasMore;
      setHasMore(nextHasMore);

      if (nextHasMore) {
        prefetchPage(activeEvent._id, nextPage + 1);
      }
    } catch (err: any) {
      console.error('Failed to load more photos:', err);
      if (!mountedRef.current) return;
      hasMoreRef.current = true;
      setHasMore(true);
      const message = err.response?.data?.error || 'שגיאה בטעינת תמונות נוספות';
      loadMoreErrorRef.current = message;
      setLoadMoreError(message);
    } finally {
      isLoadingMoreRef.current = false;
      if (mountedRef.current) setIsLoadingMore(false);
    }
  }, [fetchPhotosPage, prefetchPage]);

  const retryLoadMore = useCallback(() => {
    loadMoreErrorRef.current = null;
    setLoadMoreError(null);
    loadMore();
  }, [loadMore]);

  const deletePhoto = useCallback(async (photoId: string) => {
    await galleryApi.deletePhoto(photoId);
    if (!mountedRef.current) return;
    setPhotos((prev) => prev.filter((p) => p._id !== photoId));
  }, []);

  return {
    event,
    photos,
    mediaItems,
    isLoading,
    error,
    deletePhoto,
    loadMore,
    retryLoadMore,
    hasMore,
    isLoadingMore,
    loadMoreError,
  };
};

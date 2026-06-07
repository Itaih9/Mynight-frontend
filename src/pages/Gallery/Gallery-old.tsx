import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ROUTES } from '@/config/routes';
import { useUserStore } from '@/store/userStore';
import { eventsApi, galleryApi, couponApi } from '@/services/api';
import type { MediaItem, StoryGroup, GalleryPageProps } from './types';
import { cubeVariants } from './constants';
import { useGalleryData } from './hooks';
import { AnimatedGiftIcon, OpeningGiftAnimation, HeroVerticalCollage } from './components';
import logoSvg from '@/assets/logo.svg';
import {
  Play,
  X,
  ChevronRight,
  ChevronLeft,
  Search,
  Download,
  Share2,
  Check,
  Loader2,
  Gift,
  Send,
  Facebook,
  Instagram,
  MoreHorizontal,
  Link as LinkIcon,
  MessageCircle,
  Smartphone,
  Monitor,
  HardDrive,
  Trash2,
  AlertTriangle,
  Pause,
  Heart,
  ArrowRight,
  LayoutDashboard,
  Ticket,
  Star,
  HelpCircle,
  Sparkles,
  Camera,
  Users,
  Copy,
  Lock,
  Menu,
  Eye
} from 'lucide-react';
import { motion, AnimatePresence, PanInfo } from 'framer-motion';
import confetti from 'canvas-confetti';

const WhatsAppIcon = ({ size = 24, className = '' }: { size?: number; className?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
  </svg>
);

const SAMPLE_UPLOADER_NAMES = ['דנה', 'יוסי', 'מיכל', 'אורן', 'שירה', 'עומר', 'נועה', 'איתי'];

const createSampleMediaItems = (urls: string[]): MediaItem[] => {
  return urls.map((url, i) => ({
    id: `sample-${i}`,
    type: 'photo' as const,
    source: (i % 3 === 0 ? 'pro' : 'guest') as 'guest' | 'pro',
    url,
    thumbnail: url,
    uploaderName: SAMPLE_UPLOADER_NAMES[i % SAMPLE_UPLOADER_NAMES.length],
    timestamp: new Date(Date.now() - i * 3600000),
    orientation: (i % 3 === 0 ? 'portrait' : 'landscape') as 'portrait' | 'landscape',
  }));
};

const Gallery: React.FC<GalleryPageProps> = ({ coupleName: propCoupleName, isOwner = false, guestLink, isShowcase = false }) => {
  const navigate = useNavigate();
  const { eventId, eventCode } = useParams();
  const { currentEvent } = useUserStore();
  const [resolvedEventId, setResolvedEventId] = useState<string | undefined>(undefined);
  const [eventCodeError, setEventCodeError] = useState<string | null>(null);

  useEffect(() => {
    if (isShowcase) {
      setResolvedEventId('__showcase__');
      return;
    }

    if (eventCode) {
      eventsApi.getByCodeOrSlug(eventCode)
        .then(response => {
          if (response.data?._id) {
            setResolvedEventId(response.data._id);
          } else {
            setEventCodeError('אירוע לא נמצא');
          }
        })
        .catch(() => {
          setEventCodeError('שגיאה בטעינת האירוע');
        });
    } else if (currentEvent) {
      setResolvedEventId((currentEvent as any)._id || (currentEvent as any).id);
    } else if (eventId) {
      setResolvedEventId(eventId);
    }
  }, [eventCode, currentEvent?._id, eventId, isShowcase]);

  const [showcaseImageUrls, setShowcaseImageUrls] = useState<string[]>([]);
  const [showcaseLoading, setShowcaseLoading] = useState(false);

  useEffect(() => {
    if (!isShowcase) return;

    setShowcaseLoading(true);
    galleryApi.getShowcaseImages()
      .then((response: any) => {
        const urls = response.data || [];
        setShowcaseImageUrls(urls);

        urls.slice(0, 20).forEach((url: string) => {
          const img = new Image();
          img.src = url;
        });

        urls.slice(0, 20).forEach((url: string) => {
          const link = document.createElement('link');
          link.rel = 'preload';
          link.as = 'image';
          link.href = url;
          document.head.appendChild(link);
        });
      })
      .catch(() => {
      })
      .finally(() => setShowcaseLoading(false));
  }, [isShowcase]);

  const sampleMediaItems = useMemo(
    () => isShowcase ? createSampleMediaItems(showcaseImageUrls) : [],
    [isShowcase, showcaseImageUrls]
  );
  const galleryData = useGalleryData(resolvedEventId);
  const event = isShowcase ? null : galleryData.event;
  const mediaItems = isShowcase ? sampleMediaItems : galleryData.mediaItems;
  const isLoading = eventCodeError ? false : (isShowcase ? showcaseLoading : galleryData.isLoading);
  const error = eventCodeError || (isShowcase ? null : galleryData.error);
  const deletePhoto = galleryData.deletePhoto;

  const coupleName = isShowcase ? 'נועה ואיתי' : (event?.name || propCoupleName || 'נועה ואיתי');

  const [filterType, setFilterType] = useState<'all' | 'photo' | 'video'>('all');
  const [filterSource, setFilterSource] = useState<'all' | 'guest' | 'pro'>('all');
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMedia, setSelectedMedia] = useState<MediaItem | null>(null);
  const [fullImageLoaded, setFullImageLoaded] = useState(false);
  const [isShareMenuOpen, setIsShareMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [deletedIds, setDeletedIds] = useState<Set<string>>(new Set());
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [isGiftModalOpen, setIsGiftModalOpen] = useState(false);
  const [giftCodeCopied, setGiftCodeCopied] = useState(false);
  const [discountCode, setDiscountCode] = useState('');
  const [discountAmount, setDiscountAmount] = useState('');
  const [storyGroups, setStoryGroups] = useState<StoryGroup[]>([]);
  const [activeStoryGroup, setActiveStoryGroup] = useState<StoryGroup | null>(null);
  const [activeStoryIndex, setActiveStoryIndex] = useState(0);
  const [storyProgress, setStoryProgress] = useState(0);
  const [isStoryPaused, setIsStoryPaused] = useState(false);
  const [direction, setDirection] = useState(0);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const storyIntervalRef = useRef<number | null>(null);
  const gridRef = useRef<HTMLDivElement>(null);

  const storiesScrollRef = useRef<HTMLDivElement>(null);
  const isStoriesDragging = useRef(false);
  const storiesStartX = useRef(0);
  const storiesScrollLeft = useRef(0);
  const storiesHasMoved = useRef(false);

  const [isStoryShareOpen, setIsStoryShareOpen] = useState(false);

  const [isSideMenuOpen, setIsSideMenuOpen] = useState(false);
  const [showMobileMenuTrigger, setShowMobileMenuTrigger] = useState(false);
  const [showDesktopMenuTrigger, setShowDesktopMenuTrigger] = useState(false);

  const [isShareSettingsOpen, setIsShareSettingsOpen] = useState(false);
  const [shareSettings, setShareSettings] = useState({
    pro: true,
    guests: true,
    stories: true
  });
  const [linkCopied, setLinkCopied] = useState(false);

  const [name1, name2] = useMemo(() => {
    const separator = ' ו';
    if (coupleName.includes(separator)) {
      return coupleName.split(separator);
    }
    return [coupleName, ''];
  }, [coupleName]);


  useEffect(() => {
    if (selectedMedia || activeStoryGroup || isShareSettingsOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [selectedMedia, activeStoryGroup, isShareSettingsOpen]);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      const windowHeight = window.innerHeight;

      if (window.innerWidth < 768) {
          setShowMobileMenuTrigger(scrollY > windowHeight * 0.30);
          setShowDesktopMenuTrigger(false);
      } else {
          setShowMobileMenuTrigger(false);
          setShowDesktopMenuTrigger(scrollY > windowHeight * 0.15 && scrollY < windowHeight - 120);
      }

      if (!isShowcase && window.innerHeight + window.scrollY >= document.body.offsetHeight - 300) {
        galleryData.loadMore();
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, [isOwner, isShowcase, galleryData]);

  useEffect(() => {
    if (mediaItems.length === 0) return;

    const groups: { [key: string]: MediaItem[] } = {};
    mediaItems.forEach(item => {
        if (!groups[item.uploaderName]) {
            groups[item.uploaderName] = [];
        }
        groups[item.uploaderName].push(item);
    });

    const storyList: StoryGroup[] = Object.keys(groups).map(name => {
        const firstItem = groups[name][0];
        const avatar = firstItem.thumbnail || firstItem.url;
        return {
            uploaderName: name,
            items: groups[name],
            avatar
        };
    });

    if (!isShowcase) {
      for (let i = storyList.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [storyList[i], storyList[j]] = [storyList[j], storyList[i]];
      }
    }

    setStoryGroups(storyList);
  }, [mediaItems, isShowcase]);

  const getShareText = () => {
    const footer = "\n\n- שותף עם MyNight.co.il";
    if (isOwner) {
      return `תראו איזה רגע מהחתונה! היה מטורף${footer}`;
    }
    return `תראו איזה רגע מהחתונה של ${coupleName}! היה מדהים${footer}`;
  };

  const handleStoriesMouseDown = (e: React.MouseEvent) => {
    if (!storiesScrollRef.current) return;
    isStoriesDragging.current = true;
    storiesHasMoved.current = false;
    storiesStartX.current = e.pageX - storiesScrollRef.current.offsetLeft;
    storiesScrollLeft.current = storiesScrollRef.current.scrollLeft;
  };

  const handleStoriesMouseLeave = () => {
    isStoriesDragging.current = false;
  };

  const handleStoriesMouseUp = () => {
    isStoriesDragging.current = false;
  };

  const handleStoriesMouseMove = (e: React.MouseEvent) => {
    if (!isStoriesDragging.current || !storiesScrollRef.current) return;
    e.preventDefault();
    const x = e.pageX - storiesScrollRef.current.offsetLeft;
    const walk = (x - storiesStartX.current) * 2;
    if (Math.abs(walk) > 5) storiesHasMoved.current = true;
    storiesScrollRef.current.scrollLeft = storiesScrollLeft.current - walk;
  };

  const handleStoryClick = (group: StoryGroup, validItems: MediaItem[]) => {
    if (storiesHasMoved.current) return;
    setActiveStoryGroup({...group, items: validItems});
    setActiveStoryIndex(0);
    setStoryProgress(0);
    setIsStoryShareOpen(false);
  };

  const jumpToNextGroup = useCallback(() => {
      if (!activeStoryGroup) return;
      const currentGroupIndex = storyGroups.findIndex(g => g.uploaderName === activeStoryGroup.uploaderName);

      if (currentGroupIndex !== -1 && currentGroupIndex < storyGroups.length - 1) {
          setDirection(1);
          const nextGroup = storyGroups[currentGroupIndex + 1];
          const validItems = nextGroup.items.filter(i => !deletedIds.has(i.id));
          if (validItems.length > 0) {
              setActiveStoryGroup({...nextGroup, items: validItems});
              setActiveStoryIndex(0);
              setStoryProgress(0);
              setIsStoryShareOpen(false);
          } else {
              setActiveStoryGroup(null);
          }
      } else {
          setActiveStoryGroup(null);
      }
  }, [activeStoryGroup, storyGroups, deletedIds]);

  const jumpToPrevGroup = useCallback(() => {
      if (!activeStoryGroup) return;
      const currentGroupIndex = storyGroups.findIndex(g => g.uploaderName === activeStoryGroup.uploaderName);

      if (currentGroupIndex > 0) {
          setDirection(-1);
          const prevGroup = storyGroups[currentGroupIndex - 1];
          const validItems = prevGroup.items.filter(i => !deletedIds.has(i.id));
          if (validItems.length > 0) {
              setActiveStoryGroup({...prevGroup, items: validItems});
              setActiveStoryIndex(0);
              setStoryProgress(0);
              setIsStoryShareOpen(false);
          }
      }
  }, [activeStoryGroup, storyGroups, deletedIds]);

  useEffect(() => {
    if (!activeStoryGroup || isStoryPaused) {
        if (storyIntervalRef.current) clearInterval(storyIntervalRef.current);
        return;
    }
    setStoryProgress(0);
    const duration = 5000;
    const interval = 50;
    const step = 100 / (duration / interval);

    storyIntervalRef.current = window.setInterval(() => {
        setStoryProgress(prev => {
            if (prev >= 100) {
                handleNextStorySlide();
                return 0;
            }
            return prev + step;
        });
    }, interval);

    return () => {
        if (storyIntervalRef.current) clearInterval(storyIntervalRef.current);
    };
  }, [activeStoryGroup, activeStoryIndex, isStoryPaused]);

  const handleNextStorySlide = useCallback(() => {
      if (!activeStoryGroup) return;
      if (activeStoryIndex < activeStoryGroup.items.length - 1) {
          setActiveStoryIndex(prev => prev + 1);
          setStoryProgress(0);
      } else {
          jumpToNextGroup();
      }
  }, [activeStoryGroup, activeStoryIndex, jumpToNextGroup]);

  const handlePrevStorySlide = useCallback(() => {
      if (!activeStoryGroup) return;
      if (activeStoryIndex > 0) {
          setActiveStoryIndex(prev => prev - 1);
          setStoryProgress(0);
      } else {
          const currentGroupIndex = storyGroups.findIndex(g => g.uploaderName === activeStoryGroup.uploaderName);
          if (currentGroupIndex > 0) {
              setDirection(-1);
              const prevGroup = storyGroups[currentGroupIndex - 1];
              const validItems = prevGroup.items.filter(i => !deletedIds.has(i.id));
              if (validItems.length > 0) {
                  setActiveStoryGroup({...prevGroup, items: validItems});
                  setActiveStoryIndex(validItems.length - 1);
                  setStoryProgress(0);
              } else {
                  setActiveStoryGroup(null);
              }
          }
      }
  }, [activeStoryGroup, activeStoryIndex, storyGroups, deletedIds]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
        if (activeStoryGroup) {
            switch (e.key) {
                case 'ArrowLeft': handleNextStorySlide(); break;
                case 'ArrowRight': handlePrevStorySlide(); break;
                case 'Escape': setActiveStoryGroup(null); break;
            }
        } else if (selectedMedia) {
            switch (e.key) {
                case 'ArrowLeft': navigateLightbox('next'); break;
                case 'ArrowRight': navigateLightbox('prev'); break;
                case 'Escape': closeLightbox(); break;
            }
        }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeStoryGroup, handleNextStorySlide, handlePrevStorySlide, selectedMedia]);

  const handleStoryDelete = async () => {
      if (!activeStoryGroup) return;
      const currentItem = activeStoryGroup.items[activeStoryIndex];
      try {
          await deletePhoto(currentItem.id);
      } catch (err) {
      }
      const newSet = new Set(deletedIds);
      newSet.add(currentItem.id);
      setDeletedIds(newSet);
      const updatedItems = activeStoryGroup.items.filter(i => i.id !== currentItem.id);
      if (updatedItems.length === 0) {
          setActiveStoryGroup(null);
      } else {
          setActiveStoryGroup({ ...activeStoryGroup, items: updatedItems });
          if (activeStoryIndex >= updatedItems.length) {
              setActiveStoryIndex(updatedItems.length - 1);
          }
      }
      setIsDeleteConfirmOpen(false);
  };

  const toggleFavorite = useCallback((id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setFavorites(prev => {
      const newFavs = new Set(prev);
      if (newFavs.has(id)) newFavs.delete(id);
      else newFavs.add(id);
      return newFavs;
    });
  }, []);

  const filteredMedia = useMemo(() => {
    const filtered = mediaItems.filter(item => {
      if (deletedIds.has(item.id)) return false;
      if (item.orientation === 'portrait') return false;

      const matchType = filterType === 'all' || item.type === filterType;
      const matchSource = filterSource === 'all' || item.source === filterSource;
      const matchSearch = searchQuery === '' || item.uploaderName.toLowerCase().includes(searchQuery.toLowerCase());
      const matchFavorite = !showFavoritesOnly || favorites.has(item.id);

      return matchType && matchSource && matchSearch && matchFavorite;
    });
    return filtered.sort((a, b) => new Date(a.uploadedAt).getTime() - new Date(b.uploadedAt).getTime());
  }, [mediaItems, filterType, filterSource, searchQuery, deletedIds, showFavoritesOnly, favorites]);

  const collageItems = useMemo(() => mediaItems, [mediaItems]);

  const openLightbox = (item: MediaItem) => {
    setSelectedMedia(item);
    setFullImageLoaded(false);
    setIsShareMenuOpen(false);
    setIsDeleteConfirmOpen(false);
  };

  const closeLightbox = () => {
    setSelectedMedia(null);
    setFullImageLoaded(false);
    setIsShareMenuOpen(false);
    setIsDeleteConfirmOpen(false);
  };

  const navigateLightbox = (direction: 'next' | 'prev') => {
    if (!selectedMedia) return;
    const currentIndex = filteredMedia.findIndex(m => m.id === selectedMedia.id);
    let nextIndex = direction === 'next' ? currentIndex + 1 : currentIndex - 1;
    if (nextIndex >= 0 && nextIndex < filteredMedia.length) {
      openLightbox(filteredMedia[nextIndex]);
    }
  };

  const handleDelete = async () => {
    if (selectedMedia) {
        try {
            await deletePhoto(selectedMedia.id);
            const newSet = new Set(deletedIds);
            newSet.add(selectedMedia.id);
            setDeletedIds(newSet);
            setIsDeleteConfirmOpen(false);
            closeLightbox();
        } catch (err) {
            console.error('Failed to delete photo:', err);
        }
    }
  };

  const confirmDelete = () => {
      if (activeStoryGroup) {
          handleStoryDelete();
      } else if (selectedMedia) {
          handleDelete();
      }
  };

  const handleDownload = async () => {
    if (!selectedMedia) return;
    try {
      const response = await galleryApi.getDownloadUrl(selectedMedia.id);
      if (!response.data?.url) throw new Error('No download URL');
      const downloadUrl = response.data.url;
      const extension = selectedMedia.type === 'video' ? 'mp4' : 'jpg';
      const filename = `mynight-${selectedMedia.id}.${extension}`;

      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      window.open(selectedMedia.url, '_blank');
    }
  };

  const handleStoryDownload = async () => {
    if (!activeStoryGroup) return;
    const item = activeStoryGroup.items[activeStoryIndex];
    if (!item) return;
    try {
      const extension = item.type === 'video' ? 'mp4' : 'jpg';
      const filename = `mynight-story-${item.id}.${extension}`;
      const response = await fetch(item.url);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(link);
    } catch (error) {
      window.open(item.url, '_blank');
    }
  };

  const handleCopyLink = async () => {
    if (!selectedMedia && !activeStoryGroup) return;
    const item = selectedMedia || (activeStoryGroup ? activeStoryGroup.items[activeStoryIndex] : null);
    if (!item) return;
    try {
        await navigator.clipboard.writeText(item.url);
        setIsShareMenuOpen(false);
        setIsStoryShareOpen(false);
    } catch (err) {
    }
  };

  const handleCopyGuestLink = () => {
    if (!guestLink) return;
    navigator.clipboard.writeText(guestLink);
    setLinkCopied(true);
    setTimeout(() => setLinkCopied(false), 2000);
  };

  const handleWhatsAppShare = async () => {
      const item = selectedMedia || (activeStoryGroup ? activeStoryGroup.items[activeStoryIndex] : null);
      if (!item) return;
      const text = getShareText();
      try {
        const response = await fetch(item.url);
        const blob = await response.blob();
        const ext = item.type === 'video' ? 'mp4' : 'jpg';
        const mimeType = item.type === 'video' ? 'video/mp4' : 'image/jpeg';
        const file = new File([blob], `mynight-${item.id}.${ext}`, { type: mimeType });
        if (navigator.canShare && navigator.canShare({ files: [file] })) {
          await navigator.share({ files: [file], text });
        } else {
          window.open(`https://wa.me/?text=${encodeURIComponent(text + ' ' + item.url)}`, '_blank');
        }
      } catch {
        window.open(`https://wa.me/?text=${encodeURIComponent(text + ' ' + item.url)}`, '_blank');
      }
      setIsShareMenuOpen(false);
      setIsStoryShareOpen(false);
  };

  const handleFacebookShare = async () => {
      const item = selectedMedia || (activeStoryGroup ? activeStoryGroup.items[activeStoryIndex] : null);
      if (!item) return;
      const text = getShareText();
      try {
        const response = await fetch(item.url);
        const blob = await response.blob();
        const file = new File([blob], `mynight-${item.id}.jpg`, { type: 'image/jpeg' });
        if (navigator.canShare && navigator.canShare({ files: [file] })) {
          await navigator.share({ files: [file], text });
        } else {
          window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(item.url)}&quote=${encodeURIComponent(text)}`, '_blank');
        }
      } catch {
        window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(item.url)}&quote=${encodeURIComponent(text)}`, '_blank');
      }
      setIsShareMenuOpen(false);
      setIsStoryShareOpen(false);
  };

  const handleInstagramStory = async () => {
    const item = selectedMedia || (activeStoryGroup ? activeStoryGroup.items[activeStoryIndex] : null);
    if (!item) return;
    try {
      const response = await fetch(item.url);
      const blob = await response.blob();
      const mimeType = item.type === 'video' ? 'video/mp4' : 'image/jpeg';
      const ext = item.type === 'video' ? 'mp4' : 'jpg';
      const file = new File([blob], `mynight-${item.id}.${ext}`, { type: mimeType });
      if (navigator.share) {
        await navigator.share({
          files: [file],
          title: `My Night`,
          text: `From the wedding of ${coupleName}`
        });
      } else {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = file.name;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      }
    } catch (error) {
    } finally {
       setIsShareMenuOpen(false);
       setIsStoryShareOpen(false);
    }
  };

  const handleNativeShare = async () => {
    const item = selectedMedia || (activeStoryGroup ? activeStoryGroup.items[activeStoryIndex] : null);
    if (!item) return;
    if (navigator.share) {
      try {
        await navigator.share({
          title: `זיכרון מהחתונה של ${coupleName}`,
          text: getShareText(),
          url: item.url,
        });
      } catch (error) { }
    } else {
        handleCopyLink();
    }
    setIsShareMenuOpen(false);
    setIsStoryShareOpen(false);
  };

  const handleGiftClick = async (e: React.MouseEvent<HTMLButtonElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (rect.left + rect.width / 2) / window.innerWidth;
    const y = (rect.top + rect.height / 2) / window.innerHeight;
    confetti({ origin: { x, y }, particleCount: 150, spread: 80, startVelocity: 35, colors: ['#F5C518', '#000000', '#FFFFFF', '#CCCCCC'], zIndex: 201 });

    try {
      const response = await couponApi.getAll();
      if (response.data && response.data.length > 0) {
        const activeCoupon = response.data.find((c: any) => c.isActive);
        if (activeCoupon) {
          setDiscountCode(activeCoupon.code);
          setDiscountAmount(activeCoupon.discountPercent === 100 ? '100%' : `${activeCoupon.discountPercent}%`);
        }
      }
    } catch (err) {
    }

    setIsGiftModalOpen(true);
  };

  const handleCopyDiscountCode = () => {
    navigator.clipboard.writeText(discountCode);
    setGiftCodeCopied(true);
    setTimeout(() => setGiftCodeCopied(false), 2000);
  };

  const handleShareDiscount = (method: 'whatsapp' | 'copy') => {
    const message = `קיבלתי קוד הנחה מיוחד עבורך! השתמש/י בקוד ${discountCode} וקבל/י ${discountAmount} הנחה על אלבום החתונה הדיגיטלי שלך ב-MyNight`;
    if (method === 'whatsapp') {
      window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank');
    } else {
      navigator.clipboard.writeText(message);
      setGiftCodeCopied(true);
      setTimeout(() => setGiftCodeCopied(false), 2000);
    }
  };

  const handleDragEnd = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    const swipeThreshold = window.innerWidth * 0.2;
    if (info.offset.x > swipeThreshold) {
        jumpToNextGroup();
    } else if (info.offset.x < -swipeThreshold) {
        jumpToPrevGroup();
    }
  };

  const toggleShareSetting = (key: keyof typeof shareSettings) => {
    setShareSettings(prev => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="min-h-screen bg-white text-black font-sans w-full" dir="rtl">

      <section
        className="relative min-h-[100dvh] w-full overflow-hidden bg-black flex flex-col justify-between"
        style={{ touchAction: 'pan-y' }}
      >
        <motion.div
          initial={{ scale: 1.05 }}
          animate={{ scale: 1 }}
          transition={{ duration: 1.5, ease: "easeOut" }}
          className="absolute inset-0 z-0 transform-gpu pointer-events-none"
        >
          <HeroVerticalCollage items={collageItems} />
          <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/10 to-black/60 pointer-events-none" />
        </motion.div>

        <AnimatePresence>
          {showDesktopMenuTrigger && (
            <motion.button
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              onClick={() => setIsSideMenuOpen(true)}
              className="hidden md:flex fixed top-6 right-6 z-[100] p-3 bg-black/80 hover:bg-black text-white rounded-full transition-colors shadow-lg border border-white/10 backdrop-blur-md"
            >
              <ArrowRight size={24} strokeWidth={1.5} />
            </motion.button>
          )}
        </AnimatePresence>

        <div className="relative z-10 p-8 md:p-12 flex justify-end items-start">
        </div>

        <div className="relative z-10 w-full p-8 md:p-16 flex justify-between items-end">

          <AnimatePresence>
            {showMobileMenuTrigger && (
              <motion.div
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                exit={{ x: '100%' }}
                transition={{ type: "spring", stiffness: 400, damping: 30 }}
                onClick={() => setIsSideMenuOpen(true)}
                className="absolute right-0 z-50 bg-gold-primary rounded-l-full shadow-lg flex items-center justify-center cursor-pointer active:scale-95 touch-none"
                style={{ top: '-32px', width: '32px', height: '40px' }}
              >
                <div className="mr-[-4px]">
                   <svg width="10" height="14" viewBox="0 0 12 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M0 8L12 0V16L0 8Z" fill="white"/>
                   </svg>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="text-right">
            <motion.p
              initial={{ x: 40, opacity: 0 }}
              animate={{ x: isMobile ? -3 : -6, opacity: 1 }}
              transition={{ delay: 0.5, duration: 0.8, ease: "easeOut" }}
              className="text-white/50 text-xl md:text-3xl font-bold tracking-wide mb-0 font-bona translate-y-[88px]"
            >
              הלילה של
            </motion.p>
            <h2 className="text-white/55 text-5xl md:text-9xl font-bold tracking-wide leading-none flex flex-row flex-wrap items-baseline gap-y-2 gap-x-3 md:gap-x-4 font-bona justify-start">
              <motion.span
                initial={{ x: 40, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.8, duration: 0.8, ease: "easeOut" }}
              >
                {name1}
              </motion.span>

              {name2 && (
                <div className="flex items-center gap-x-3 md:gap-x-4">
                    <motion.span
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 1.0, duration: 0.8 }}
                        className="font-serif italic text-5xl md:text-8xl text-white/55 font-normal px-1 inline-block md:translate-y-[20px]"
                    >
                        &
                    </motion.span>
                    <motion.span
                        initial={{ x: 40, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ delay: 1.1, duration: 0.8, ease: "easeOut" }}
                    >
                        {name2}
                    </motion.span>
                </div>
              )}
            </h2>
          </div>

          <div className="text-left hidden md:block">
             <motion.div
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 1.8, duration: 0.8 }}
              className="text-white/80 font-serif tracking-[0.1em] uppercase flex items-baseline gap-2 md:gap-3 scale-[1.07] origin-left"
              dir="ltr"
            >
              <span className="text-xl md:text-3xl">25</span>
              <span className="text-sm md:text-xl font-light scale-[1.1]">May</span>
              <span className="text-xl md:text-3xl">2025</span>
            </motion.div>
          </div>
        </div>
      </section>

      <AnimatePresence>
        {isDeleteConfirmOpen && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4" dir="rtl">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsDeleteConfirmOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="bg-white rounded-3xl p-8 w-full max-w-sm relative z-10 shadow-2xl text-center"
            >
              <div className="w-16 h-16 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Trash2 size={32} />
              </div>
              <h3 className="text-2xl font-bold mb-2">למחוק את המדיה?</h3>
              <p className="text-gray-500 mb-8">הפעולה תסיר את הקובץ מהגלריה לצמיתות.</p>

              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => setIsDeleteConfirmOpen(false)}
                  className="py-3 rounded-xl font-bold text-gray-500 bg-gray-50 hover:bg-gray-100 transition-colors"
                >
                  ביטול
                </button>
                <button
                  onClick={confirmDelete}
                  className="py-3 rounded-xl font-bold text-white bg-red-500 hover:bg-red-600 transition-colors"
                >
                  מחיקה
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isShareSettingsOpen && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4" dir="rtl">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsShareSettingsOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="bg-white rounded-3xl p-6 w-full max-w-md relative z-10 shadow-2xl overflow-hidden"
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold">ניהול שיתוף לאורחים</h3>
                <button onClick={() => setIsShareSettingsOpen(false)} className="p-2 bg-gray-50 hover:bg-gray-100 rounded-full">
                  <X size={20} />
                </button>
              </div>

              <p className="text-gray-500 mb-6 text-sm">בחרו מה האורחים יראו בקישור האישי</p>

              <div className="space-y-4 mb-8">
                <div
                  onClick={() => toggleShareSetting('pro')}
                  className={`flex items-center justify-between p-4 rounded-xl border cursor-pointer transition-all ${shareSettings.pro ? 'border-gold-primary bg-gold-primary/5' : 'border-gray-100 bg-white'}`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${shareSettings.pro ? 'bg-gold-primary text-black' : 'bg-gray-100 text-gray-400'}`}>
                      <Camera size={20} />
                    </div>
                    <span className={`font-medium ${shareSettings.pro ? 'text-black' : 'text-gray-500'}`}>תמונות וסרטונים מהצלם</span>
                  </div>
                  <div className={`w-11 h-6 rounded-full p-1 transition-colors flex items-center ${shareSettings.pro ? 'bg-gold-primary justify-end' : 'bg-gray-200 justify-start'}`}>
                    <motion.div layout className="w-4 h-4 bg-white rounded-full shadow-sm" />
                  </div>
                </div>

                <div
                  onClick={() => toggleShareSetting('guests')}
                  className={`flex items-center justify-between p-4 rounded-xl border cursor-pointer transition-all ${shareSettings.guests ? 'border-gold-primary bg-gold-primary/5' : 'border-gray-100 bg-white'}`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${shareSettings.guests ? 'bg-gold-primary text-black' : 'bg-gray-100 text-gray-400'}`}>
                      <Users size={20} />
                    </div>
                    <span className={`font-medium ${shareSettings.guests ? 'text-black' : 'text-gray-500'}`}>תמונות וסרטונים מאורחים</span>
                  </div>
                  <div className={`w-11 h-6 rounded-full p-1 transition-colors flex items-center ${shareSettings.guests ? 'bg-gold-primary justify-end' : 'bg-gray-200 justify-start'}`}>
                    <motion.div layout className="w-4 h-4 bg-white rounded-full shadow-sm" />
                  </div>
                </div>

                <div
                  onClick={() => toggleShareSetting('stories')}
                  className={`flex items-center justify-between p-4 rounded-xl border cursor-pointer transition-all ${shareSettings.stories ? 'border-gold-primary bg-gold-primary/5' : 'border-gray-100 bg-white'}`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${shareSettings.stories ? 'bg-gold-primary text-black' : 'bg-gray-100 text-gray-400'}`}>
                      <Smartphone size={20} />
                    </div>
                    <span className={`font-medium ${shareSettings.stories ? 'text-black' : 'text-gray-500'}`}>סטוריז</span>
                  </div>
                  <div className={`w-11 h-6 rounded-full p-1 transition-colors flex items-center ${shareSettings.stories ? 'bg-gold-primary justify-end' : 'bg-gray-200 justify-start'}`}>
                    <motion.div layout className="w-4 h-4 bg-white rounded-full shadow-sm" />
                  </div>
                </div>
              </div>

              {guestLink && (
                <div className="mb-6">
                  <p className="text-xs font-bold text-gray-400 mb-2">קישור לשיתוף</p>
                  <div className="relative">
                    <input
                      type="text"
                      readOnly
                      value={guestLink}
                      className="w-full pl-12 pr-4 py-3 bg-gray-50 rounded-xl border border-gray-200 text-gray-600 text-sm focus:outline-none font-mono"
                      dir="ltr"
                    />
                    <button
                      onClick={handleCopyGuestLink}
                      className="absolute left-2 top-1/2 -translate-y-1/2 p-1.5 hover:bg-white rounded-lg transition-colors text-gray-500 hover:text-black"
                    >
                      {linkCopied ? <Check size={18} className="text-green-500" /> : <Copy size={18} />}
                    </button>
                  </div>
                </div>
              )}

              <div className="flex items-center gap-2 justify-center bg-gray-50 p-3 rounded-xl border border-gray-100">
                <Lock size={14} className="text-gray-400" />
                <span className="text-xs text-gray-500 font-medium">האורחים אינם יכולים לערוך את הגלריה</span>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isGiftModalOpen && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4" dir="rtl">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsGiftModalOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="bg-white rounded-3xl p-8 w-full max-w-sm relative z-10 shadow-2xl text-center"
            >
              <button onClick={() => setIsGiftModalOpen(false)} className="absolute top-4 left-4 p-2 bg-gray-50 hover:bg-gray-100 rounded-full transition-colors">
                <X size={20} />
              </button>

              <div className="mb-6 flex justify-center">
                <OpeningGiftAnimation />
              </div>

              <h3 className="text-2xl font-bold mb-2">מתנה לחברים</h3>
              <p className="text-gray-500 mb-6">שתפו את הקוד עם חברים וקבלו {discountAmount} הנחה</p>

              {discountCode ? (
                <>
                  <div className="bg-gray-50 border-2 border-dashed border-gray-200 rounded-2xl p-4 mb-6">
                    <p className="text-xs text-gray-400 mb-2">קוד הנחה {discountAmount}</p>
                    <div className="flex items-center justify-center gap-3">
                      <span className="text-2xl font-bold font-mono tracking-wider">{discountCode}</span>
                      <button
                        onClick={handleCopyDiscountCode}
                        className="p-2 hover:bg-white rounded-lg transition-colors"
                      >
                        {giftCodeCopied ? <Check size={20} className="text-green-500" /> : <Copy size={20} className="text-gray-400" />}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <button
                      onClick={() => handleShareDiscount('whatsapp')}
                      className="w-full flex flex-row-reverse items-center justify-center gap-3 bg-[#25D366] hover:bg-[#20bd5a] text-white py-4 rounded-xl font-bold transition-colors"
                    >
                      <WhatsAppIcon size={20} />
                      <span>שיתוף בוואטסאפ</span>
                    </button>

                    <button
                      onClick={() => handleShareDiscount('copy')}
                      className="w-full flex flex-row-reverse items-center justify-center gap-3 bg-gray-100 hover:bg-gray-200 text-gray-700 py-4 rounded-xl font-bold transition-colors"
                    >
                      <Copy size={20} />
                      <span>העתקת הודעה</span>
                    </button>
                  </div>
                </>
              ) : (
                <p className="text-gray-400 text-sm">אין קוד הנחה זמין כרגע</p>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isSideMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsSideMenuOpen(false)}
              className="fixed inset-0 bg-black/60 z-[160] backdrop-blur-sm"
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: '0%' }}
              exit={{ x: '100%' }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed top-0 right-0 h-full w-full max-w-sm bg-white z-[170] shadow-2xl p-8 flex flex-col"
            >
               <button onClick={() => setIsSideMenuOpen(false)} className="absolute top-6 right-6 p-2 text-black hover:bg-gray-100 rounded-full transition-colors">
                 <ArrowRight size={24} strokeWidth={1.5} className="rotate-180" />
               </button>

               {isShowcase ? (
                 <>
                   <div className="mt-24 flex flex-col gap-8">
                      <button onClick={() => navigate(ROUTES.UPLOAD)} className="flex items-center gap-4 text-xl font-medium text-black hover:text-gold-primary transition-colors text-right group">
                         <LayoutDashboard size={24} strokeWidth={1.5} className="text-gray-400 group-hover:text-gold-primary transition-colors" />
                         <span>ניהול האירוע</span>
                      </button>
                      <button onClick={() => navigate(ROUTES.REGISTER)} className="flex items-center gap-4 text-xl font-medium text-black hover:text-gold-primary transition-colors text-right group">
                         <Sparkles size={24} strokeWidth={1.5} className="text-gray-400 group-hover:text-gold-primary transition-colors" />
                         <span>לפתיחת אלבום חכם</span>
                      </button>
                   </div>
                   <div className="mt-auto flex flex-col gap-8 pb-20">
                      <button onClick={() => { const slug = event?.customSlug || event?.eventCode || eventId || 'demo'; navigate(ROUTES.GUEST_LANDING.replace(':eventCode', slug)); }} className="flex items-center gap-4 text-xl font-medium text-black hover:text-gold-primary transition-colors text-right group">
                          <Eye size={24} strokeWidth={1.5} className="text-gray-400 group-hover:text-gold-primary transition-colors" />
                          <span>איך זה נראה לאורחים</span>
                      </button>
                      <button onClick={() => navigate(ROUTES.HELP)} className="flex items-center gap-4 text-xl font-medium text-black hover:text-gold-primary transition-colors text-right group">
                         <HelpCircle size={24} strokeWidth={1.5} className="text-gray-400 group-hover:text-gold-primary transition-colors" />
                         <span>עזרה</span>
                      </button>
                   </div>
                 </>
               ) : (
                 <>
                   <div className="mt-24 flex flex-col gap-8">
                      <button onClick={() => navigate(ROUTES.UPLOAD)} className="flex items-center gap-4 text-xl font-medium text-black hover:text-gold-primary transition-colors text-right group">
                         <LayoutDashboard size={24} strokeWidth={1.5} className="text-gray-400 group-hover:text-gold-primary transition-colors" />
                         <span>ניהול האירוע</span>
                      </button>
                      <button onClick={() => navigate(ROUTES.COUPON)} className="flex items-center gap-4 text-xl font-medium text-black hover:text-gold-primary transition-colors text-right group">
                         <Ticket size={24} strokeWidth={1.5} className="text-gray-400 group-hover:text-gold-primary transition-colors" />
                         <span>קופון אישי</span>
                      </button>
                      <button onClick={() => navigate(ROUTES.REVIEW)} className="flex items-center gap-4 text-xl font-medium text-black hover:text-gold-primary transition-colors text-right group">
                         <Star size={24} strokeWidth={1.5} className="text-gray-400 group-hover:text-gold-primary transition-colors" />
                         <span>השארת ביקורת</span>
                      </button>
                   </div>
                   <div className="mt-auto flex flex-col gap-8 pb-20">
                      <button onClick={() => { const slug = event?.customSlug || event?.eventCode || eventId || 'demo'; navigate(ROUTES.GUEST_LANDING.replace(':eventCode', slug)); }} className="flex items-center gap-4 text-xl font-medium text-black hover:text-gold-primary transition-colors text-right group">
                          <Eye size={24} strokeWidth={1.5} className="text-gray-400 group-hover:text-gold-primary transition-colors" />
                          <span>איך זה נראה לאורחים</span>
                      </button>
                      <button onClick={() => navigate(ROUTES.HELP)} className="flex items-center gap-4 text-xl font-medium text-black hover:text-gold-primary transition-colors text-right group">
                         <HelpCircle size={24} strokeWidth={1.5} className="text-gray-400 group-hover:text-gold-primary transition-colors" />
                         <span>עזרה</span>
                      </button>
                   </div>
                 </>
               )}

               <div className="mt-auto flex justify-center pb-8">
                  <button onClick={() => navigate(ROUTES.HOME)} className="transition-opacity hover:opacity-100 opacity-100 group">
                    <img src={logoSvg} alt="MY NIGHT" className="h-8 opacity-20 grayscale group-hover:grayscale-0 group-hover:opacity-100 transition-all duration-300" />
                  </button>
               </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <div ref={gridRef} className="sticky top-0 z-40 bg-white/95 backdrop-blur-xl border-b border-gray-100 px-4 py-3 md:px-6 md:py-4">
        <div className="max-w-[1800px] mx-auto flex items-center justify-between gap-4">

          {isMobile && isSearchOpen ? (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-center gap-3 w-full"
              >
                  <div className="relative flex-grow">
                      <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                      <input
                        type="text"
                        autoFocus
                        placeholder="חיפוש לפי שם..."
                        className="w-full pr-10 pl-4 py-2 bg-gray-50 border border-gray-200 rounded-full focus:border-black focus:bg-white transition-all outline-none text-sm"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                      />
                  </div>
                  <button onClick={() => { setIsSearchOpen(false); setSearchQuery(''); }} className="p-2 bg-gray-100 rounded-full">
                      <X size={18} />
                  </button>
              </motion.div>
          ) : (
              <>
                <button onClick={() => setIsSideMenuOpen(true)} className="hidden md:flex p-2 -mr-2 hover:bg-gray-100 rounded-full transition-colors text-black">
                    <Menu size={24} strokeWidth={1.5} />
                </button>

                <div className="flex items-center gap-0.5 md:gap-6 overflow-x-auto flex-1 scroll-smooth [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none'] mask-linear-fade mr-0.5 md:mr-0">
                   {[
                     { label: 'הכל', isActive: filterType === 'all' && filterSource === 'all' && !showFavoritesOnly, onClick: () => { setFilterType('all'); setFilterSource('all'); } },
                     { label: 'צלם', isActive: filterSource === 'pro' && !showFavoritesOnly, onClick: () => { setFilterSource('pro'); setShowFavoritesOnly(false); } },
                     { label: 'אורחים', isActive: filterSource === 'guest' && !showFavoritesOnly, onClick: () => { setFilterSource('guest'); setShowFavoritesOnly(false); } },
                     { label: 'תמונות', isActive: filterType === 'photo' && !showFavoritesOnly, onClick: () => { setFilterType('photo'); setShowFavoritesOnly(false); } },
                     { label: 'סרטונים', isActive: filterType === 'video' && !showFavoritesOnly, onClick: () => { setFilterType('video'); setShowFavoritesOnly(false); } },
                   ].map(({ label, isActive, onClick }) => (
                     <button key={label} onClick={onClick} className={`text-[12px] md:text-base uppercase tracking-widest transition-all whitespace-nowrap px-1 md:px-1.5 py-1 ${isActive ? 'text-black' : 'text-gray-400 hover:text-black'}`}>
                       <span className="relative inline-flex flex-col items-center">
                         <span className="invisible font-bold">{label}</span>
                         <span className={`absolute inset-0 flex items-center justify-center ${isActive ? 'font-bold' : ''}`}>{label}</span>
                       </span>
                     </button>
                   ))}
                </div>

                <div className="flex items-center gap-3 md:gap-6 shrink-0 -ml-[7px]">
                  <button
                      onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
                      className={`p-2 rounded-full transition-all ${showFavoritesOnly ? 'bg-red-50 text-red-500' : 'text-gray-400 hover:text-red-500 hover:bg-gray-50'}`}
                  >
                      <Heart size={20} className={showFavoritesOnly ? 'fill-current' : ''} />
                  </button>

                  <div className="hidden md:block relative w-48">
                      <Search className="absolute right-0 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
                      <input type="text" placeholder="חיפוש לפי שם..." className="w-full pr-6 py-1 bg-transparent border-b border-transparent focus:border-black transition-all outline-none text-base uppercase tracking-widest placeholder:text-gray-300 text-right" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
                  </div>

                  <button
                      className="md:hidden p-2 text-gray-400 hover:text-black transition-colors"
                      onClick={() => setIsSearchOpen(true)}
                  >
                      <Search size={20} />
                  </button>
                </div>
              </>
          )}
        </div>
      </div>

      <div
        ref={storiesScrollRef}
        className="w-full overflow-x-auto py-6 bg-white border-b border-gray-100 cursor-grab active:cursor-grabbing [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none']"
        onMouseDown={handleStoriesMouseDown}
        onMouseLeave={handleStoriesMouseLeave}
        onMouseUp={handleStoriesMouseUp}
        onMouseMove={handleStoriesMouseMove}
      >
        <div className="flex gap-4 px-4 min-w-max">
            {storyGroups.map((group) => {
                const validItems = group.items.filter(i => !deletedIds.has(i.id));
                if (validItems.length === 0) return null;
                const firstItem = group.items[0];
                const isVideo = firstItem.type === 'video';
                return (
                    <button
                        key={group.uploaderName}
                        onClick={(e) => {
                            if (isStoriesDragging.current || storiesHasMoved.current) {
                                e.preventDefault();
                                e.stopPropagation();
                                return;
                            }
                            handleStoryClick(group, validItems);
                        }}
                        className="flex flex-col items-center gap-2 group w-[22vw] md:w-[8vw] flex-shrink-0 select-none"
                    >
                        <div className="relative p-[3px] rounded-full bg-gradient-to-tr from-[#E5B24B] via-[#FFEC1C] to-[#D6A230] group-hover:scale-105 transition-transform duration-300 shadow-md">
                            <div className="bg-white p-[3px] rounded-full">
                                {isVideo ? (
                                  <video src={group.avatar} className="w-[4.2rem] h-[4.2rem] md:w-20 md:h-20 rounded-full object-cover border border-gray-100 pointer-events-none" />
                                ) : (
                                  <img src={group.avatar} alt={group.uploaderName} className="w-[4.2rem] h-[4.2rem] md:w-20 md:h-20 rounded-full object-cover border border-gray-100 pointer-events-none" />
                                )}
                            </div>
                        </div>
                        <span className="text-[11px] md:text-sm font-medium text-black truncate w-full text-center">{group.uploaderName}</span>
                    </button>
                );
            })}
        </div>
      </div>

      <main className="w-full px-[3px] py-4">
        {filteredMedia.length === 0 && (
            <div className="py-20 text-center text-gray-400">
                <p>לא נמצאו תמונות</p>
                {showFavoritesOnly && <p className="text-sm mt-2">סמנו תמונות כפייבוריט כדי לראות אותן כאן</p>}
            </div>
        )}
        <div className="columns-2 md:columns-3 lg:columns-4 gap-[3px] space-y-[3px] overflow-hidden">
          <AnimatePresence>
            {filteredMedia.map((item) => (
                <motion.div key={item.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.2 }} onClick={() => openLightbox(item)} className="group relative overflow-hidden bg-gray-50 border-[0.5px] border-gray-100 cursor-pointer mb-[3px] break-inside-avoid" style={{ aspectRatio: item.width && item.height ? `${item.width} / ${item.height}` : undefined }}>
                {item.type === 'video' ? (
                  <video src={item.url} className="w-full h-full object-cover transition-transform duration-[1.5s] ease-out group-hover:scale-105" style={{ imageRendering: 'high-quality' }} loading="lazy" />
                ) : (
                  <img src={item.thumbnail.includes('postimg.cc') ? `${item.thumbnail}?dl=1` : item.thumbnail} alt={`Wedding Moment ${item.id}`} className="w-full h-full object-cover transition-transform duration-[1.5s] ease-out group-hover:scale-105" style={{ imageRendering: 'high-quality', imageOrientation: 'from-image' }} loading="lazy" />
                )}
                {item.type === 'video' && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <div className="p-3 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white"><Play size={20} fill="white" /></div>
                    </div>
                )}
                <button
                    onClick={(e) => toggleFavorite(item.id, e)}
                    className="absolute top-2 left-2 z-20 p-2 rounded-full hover:bg-black/10 transition-colors"
                >
                    <motion.div whileTap={{ scale: 1.2 }}>
                        <Heart
                            size={20}
                            className={`transition-colors duration-300 ${favorites.has(item.id) ? 'fill-red-500 text-red-500' : 'text-white hover:text-red-500'} ${favorites.has(item.id) ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}
                        />
                    </motion.div>
                </button>

                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex flex-col justify-end p-8 pointer-events-none">
                    <div className="translate-y-4 group-hover:translate-y-0 transition-transform duration-500">
                        <p className="text-white text-[10px] uppercase tracking-widest font-light mb-1">{item.uploaderName}</p>
                        <p className="text-white/60 text-[8px] uppercase tracking-tighter">{item.timestamp.toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })}</p>
                    </div>
                </div>
                </motion.div>
            ))}
          </AnimatePresence>
        </div>
        {galleryData.isLoadingMore && (
          <div className="flex justify-center py-12">
            <Loader2 size={40} className="animate-spin text-gray-400" />
          </div>
        )}
      </main>

      <AnimatePresence>
        {selectedMedia && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[180] bg-white flex flex-col"
            onClick={closeLightbox}
          >
            <div className="absolute top-0 left-0 right-0 z-50 p-6 flex justify-between items-start pointer-events-none">

                <div className="flex items-center gap-3 pointer-events-auto">
                    <button onClick={(e) => { e.stopPropagation(); setIsShareMenuOpen(true); }} className="flex items-center gap-2 px-5 py-3 bg-black text-white rounded-xl hover:bg-gray-800 transition-colors shadow-md group">
                        <span className="hidden md:inline text-sm font-medium">שיתוף</span>
                        <Share2 size={18} className="-translate-x-[3px]" />
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); handleDownload(); }} className="flex items-center gap-2 px-5 py-3 bg-gray-100 text-black rounded-xl hover:bg-gray-200 transition-colors shadow-sm group">
                        <span className="hidden md:inline text-sm font-medium">הורדה</span>
                        <Download size={18} />
                    </button>
                </div>

                <div className="flex items-center gap-3 pointer-events-auto">
                    <button onClick={(e) => toggleFavorite(selectedMedia.id, e)} className="p-3 bg-white border border-gray-100 hover:bg-gray-50 rounded-full shadow-md transition-all group">
                        <Heart size={24} className={favorites.has(selectedMedia.id) ? "fill-red-500 text-red-500" : "text-gray-400 group-hover:text-red-500"} />
                    </button>
                    <button onClick={closeLightbox} className="p-3 bg-gray-100 hover:bg-gray-200 rounded-full text-black transition-colors shadow-sm">
                        <X size={20} />
                    </button>
                </div>

            </div>

            <div className="flex-1 relative flex items-center justify-center w-full h-full overflow-hidden p-4 md:p-8" onClick={(e) => e.stopPropagation()}>
               <AnimatePresence mode="popLayout">
                  <motion.div
                     key={selectedMedia.id}
                     initial={{ opacity: 0, scale: 0.9 }}
                     animate={{ opacity: 1, scale: 1 }}
                     exit={{ opacity: 0, scale: 0.9 }}
                     transition={{ type: "spring", stiffness: 300, damping: 30 }}
                     className="relative w-full h-full flex items-center justify-center"
                  >
                     {selectedMedia.type === 'video' ? (
                        <video
                          src={selectedMedia.url}
                          className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
                          autoPlay controls playsInline loop
                        />
                     ) : (
                        <div className="relative w-full h-full flex items-center justify-center">
                          <img
                            src={selectedMedia.thumbnail.includes('postimg.cc') ? `${selectedMedia.thumbnail}?dl=1` : selectedMedia.thumbnail}
                            className="absolute max-w-full max-h-full object-contain rounded-lg shadow-2xl transition-opacity duration-300"
                            style={{
                              opacity: fullImageLoaded ? 0 : 1,
                              imageRendering: 'low',
                              imageOrientation: 'from-image'
                            }}
                            alt=""
                          />
                          <img
                            src={selectedMedia.url}
                            className="max-w-full max-h-full object-contain rounded-lg shadow-2xl transition-opacity duration-500"
                            style={{
                              opacity: fullImageLoaded ? 1 : 0,
                              imageRendering: 'high-quality',
                              imageOrientation: 'from-image'
                            }}
                            alt=""
                            onLoad={() => setFullImageLoaded(true)}
                          />
                        </div>
                     )}
                  </motion.div>
               </AnimatePresence>

               <button onClick={(e) => { e.stopPropagation(); navigateLightbox('next'); }} className="absolute left-4 top-1/2 -translate-y-1/2 p-3 bg-white/80 hover:bg-white text-black rounded-full backdrop-blur-md transition-all z-50 shadow-lg">
                  <ChevronLeft size={32} />
               </button>
               <button onClick={(e) => { e.stopPropagation(); navigateLightbox('prev'); }} className="absolute right-4 top-1/2 -translate-y-1/2 p-3 bg-white/80 hover:bg-white text-black rounded-full backdrop-blur-md transition-all z-50 shadow-lg">
                  <ChevronRight size={32} />
               </button>
            </div>

            <div className="absolute bottom-0 left-0 right-0 z-50 p-6 flex justify-between items-end pointer-events-none">

                <div className="flex flex-col items-start pointer-events-auto">
                     <div className="bg-white/90 backdrop-blur-sm px-4 py-2 rounded-2xl shadow-sm border border-gray-100 text-right">
                        <p className="font-bold text-sm text-black">{selectedMedia.uploaderName}</p>
                        <p className="text-xs text-gray-500">{selectedMedia.timestamp.toLocaleTimeString('he-IL', {hour: '2-digit', minute:'2-digit'})}</p>
                     </div>
                </div>

                <div className="pointer-events-auto">
                   <button onClick={(e) => { e.stopPropagation(); setIsDeleteConfirmOpen(true); }} className="p-3 bg-white border border-red-100 text-red-500 hover:bg-red-50 rounded-full transition-colors shadow-md">
                      <Trash2 size={20} />
                   </button>
                </div>

            </div>

            <AnimatePresence>
              {isShareMenuOpen && (
                 <motion.div
                   initial={{ opacity: 0, y: 100 }}
                   animate={{ opacity: 1, y: 0 }}
                   exit={{ opacity: 0, y: 100 }}
                   className="absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl p-6 z-[200] text-center shadow-[0_-10px_40px_rgba(0,0,0,0.1)]"
                   onClick={(e) => e.stopPropagation()}
                 >
                    <div className="flex flex-col gap-3">
                        <div className="flex justify-around mb-4">
                            <button onClick={handleWhatsAppShare} className="flex flex-col items-center gap-2">
                                <div className="p-3 bg-green-100 rounded-full text-green-600"><WhatsAppIcon size={24} /></div>
                                <span className="text-xs font-medium text-gray-600">WhatsApp</span>
                            </button>
                            <button onClick={handleInstagramStory} className="flex flex-col items-center gap-2">
                                <div className="p-3 bg-pink-100 rounded-full text-pink-600"><Instagram size={24} /></div>
                                <span className="text-xs font-medium text-gray-600">Instagram</span>
                            </button>
                            <button onClick={handleFacebookShare} className="flex flex-col items-center gap-2">
                                <div className="p-3 bg-blue-100 rounded-full text-blue-600"><Facebook size={24} /></div>
                                <span className="text-xs font-medium text-gray-600">Facebook</span>
                            </button>
                            <button onClick={handleNativeShare} className="flex flex-col items-center gap-2">
                                <div className="p-3 bg-gray-100 rounded-full text-gray-600"><MoreHorizontal size={24} /></div>
                                <span className="text-xs font-medium text-gray-600">עוד</span>
                            </button>
                        </div>
                        <button onClick={() => setIsShareMenuOpen(false)} className="w-full py-3 bg-gray-100 hover:bg-gray-200 rounded-xl font-bold transition-colors">ביטול</button>
                    </div>
                 </motion.div>
              )}
            </AnimatePresence>

          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {activeStoryGroup && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[150] bg-black/90 flex items-center justify-center overflow-hidden" dir="rtl">

                {(() => {
                    const currentGroupIndex = storyGroups.findIndex(g => g.uploaderName === activeStoryGroup.uploaderName);
                    const prevGroup = currentGroupIndex > 0 ? storyGroups[currentGroupIndex - 1] : null;
                    const nextGroup = currentGroupIndex < storyGroups.length - 1 ? storyGroups[currentGroupIndex + 1] : null;
                    return (
                        <>
                           <div className="hidden md:flex absolute right-[10%] z-10 items-center justify-center h-[60vh] aspect-[9/16] cursor-pointer group" onClick={jumpToPrevGroup}>
                               {prevGroup && (
                                   <div className="relative w-full h-full rounded-xl overflow-hidden transform scale-75 opacity-40 group-hover:opacity-80 group-hover:scale-85 transition-all duration-300 ease-out border border-white/10 shadow-2xl">
                                       <img src={prevGroup.items[0].thumbnail} className="w-full h-full object-cover grayscale-[30%]" alt="" />
                                       <div className="absolute inset-0 bg-black/60" />
                                       <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
                                           <div className="w-16 h-16 rounded-full p-[2px] bg-gradient-to-tr from-gold-primary to-orange-500 shadow-lg ring-4 ring-black/50">
                                                <img src={prevGroup.avatar} className="w-full h-full rounded-full object-cover border-2 border-black" alt="" />
                                           </div>
                                           <span className="text-white font-bold text-lg drop-shadow-md tracking-wide">{prevGroup.uploaderName}</span>
                                       </div>
                                   </div>
                               )}
                           </div>

                           {prevGroup && (
                               <button onClick={jumpToPrevGroup} className="hidden md:flex absolute right-4 z-50 p-4 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all backdrop-blur-md shadow-lg border border-white/5"><ChevronRight size={32} /></button>
                           )}

                           <div className="hidden md:flex absolute left-[10%] z-10 items-center justify-center h-[60vh] aspect-[9/16] cursor-pointer group" onClick={jumpToNextGroup}>
                               {nextGroup && (
                                   <div className="relative w-full h-full rounded-xl overflow-hidden transform scale-75 opacity-40 group-hover:opacity-80 group-hover:scale-85 transition-all duration-300 ease-out border border-white/10 shadow-2xl">
                                        <img src={nextGroup.items[0].thumbnail} className="w-full h-full object-cover grayscale-[30%]" alt="" />
                                        <div className="absolute inset-0 bg-black/60" />
                                        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
                                            <div className="w-16 h-16 rounded-full p-[2px] bg-gradient-to-tr from-gold-primary to-orange-500 shadow-lg ring-4 ring-black/50">
                                                 <img src={nextGroup.avatar} className="w-full h-full rounded-full object-cover border-2 border-black" alt="" />
                                            </div>
                                            <span className="text-white font-bold text-lg drop-shadow-md tracking-wide">{nextGroup.uploaderName}</span>
                                        </div>
                                   </div>
                               )}
                           </div>

                           {nextGroup && (
                               <button onClick={jumpToNextGroup} className="hidden md:flex absolute left-4 z-50 p-4 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all backdrop-blur-md shadow-lg border border-white/5"><ChevronLeft size={32} /></button>
                           )}
                        </>
                    );
                })()}

                <div className="relative w-full h-full perspective-1000 flex items-center justify-center z-20 pointer-events-none">
                    <AnimatePresence initial={false} custom={direction} mode="popLayout">
                        <motion.div key={activeStoryGroup.uploaderName} custom={direction} variants={cubeVariants} initial="enter" animate="center" exit="exit" className="absolute w-full h-full flex items-center justify-center pointer-events-none" drag="x" dragConstraints={{ left: 0, right: 0 }} dragElastic={0.2} onDragEnd={handleDragEnd}>
                            <div className="relative w-full h-full md:w-[45vh] md:aspect-[9/16] bg-black md:rounded-2xl overflow-hidden flex flex-col pointer-events-auto shadow-[0_0_50px_rgba(0,0,0,0.7)] border-0 md:border md:border-white/10">
                                <div className="absolute top-0 left-0 right-0 z-50 p-4 bg-gradient-to-b from-black/60 to-transparent">
                                    <div className="flex gap-1 mb-3">
                                        {activeStoryGroup.items.map((_, idx) => (
                                            <div key={idx} className="h-0.5 flex-1 bg-white/30 rounded-full overflow-hidden">
                                                <motion.div className="h-full bg-white" initial={{ width: idx < activeStoryIndex ? '100%' : '0%' }} animate={{ width: idx < activeStoryIndex ? '100%' : (idx === activeStoryIndex ? `${storyProgress}%` : '0%') }} transition={{ ease: "linear", duration: 0 }} />
                                            </div>
                                        ))}
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <img src={activeStoryGroup.avatar} className="w-8 h-8 rounded-full border border-white/50" />
                                            <span className="text-white font-bold text-sm">{activeStoryGroup.uploaderName}</span>
                                            <span className="text-white/60 text-xs">{activeStoryGroup.items[activeStoryIndex].timestamp.toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })}</span>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <button onClick={() => setIsStoryPaused(!isStoryPaused)} className="text-white/80">{isStoryPaused ? <Play size={16} fill="currentColor" /> : <Pause size={16} fill="currentColor" />}</button>
                                            <button onClick={() => setActiveStoryGroup(null)} className="text-white"><X size={24} /></button>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex-grow relative flex items-center justify-center bg-black overflow-hidden" onMouseDown={() => setIsStoryPaused(true)} onMouseUp={() => setIsStoryPaused(false)} onTouchStart={() => setIsStoryPaused(true)} onTouchEnd={() => setIsStoryPaused(false)}>

                                    <div className="absolute inset-0 z-0">
                                        <AnimatePresence mode="popLayout">
                                            <motion.img
                                                key={`bg-${activeStoryGroup.items[activeStoryIndex].id}`}
                                                initial={{ opacity: 0.6 }}
                                                animate={{ opacity: 0.6 }}
                                                exit={{ opacity: 0.6 }}
                                                transition={{ duration: 0 }}
                                                src={activeStoryGroup.items[activeStoryIndex].url}
                                                className="w-full h-full object-cover blur-[50px] scale-125 brightness-75"
                                                alt=""
                                            />
                                        </AnimatePresence>
                                    </div>

                                    <div className="absolute inset-0 flex z-20">
                                        <div className="w-1/3 h-full" onClick={(e) => { e.stopPropagation(); handlePrevStorySlide(); }}></div>
                                        <div className="w-2/3 h-full" onClick={(e) => { e.stopPropagation(); handleNextStorySlide(); }}></div>
                                    </div>
                                    <AnimatePresence mode="popLayout">
                                    {activeStoryGroup.items[activeStoryIndex].type === 'video' ? (
                                        <motion.video key={`fg-${activeStoryGroup.items[activeStoryIndex].id}`} initial={{ opacity: 1 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.05 }} src={activeStoryGroup.items[activeStoryIndex].url} className="w-full h-full object-contain relative z-10 shadow-[0_0_40px_rgba(0,0,0,0.5)]" autoPlay playsInline loop={false} onEnded={handleNextStorySlide} />
                                    ) : (
                                        <motion.img key={`fg-${activeStoryGroup.items[activeStoryIndex].id}`} initial={{ opacity: 1 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.05 }} src={activeStoryGroup.items[activeStoryIndex].url} className="w-full h-full object-contain relative z-10 shadow-[0_0_40px_rgba(0,0,0,0.5)]" />
                                    )}
                                    </AnimatePresence>
                                </div>
                                <div className="absolute bottom-0 left-0 right-0 z-30 px-6 pb-[27px] pt-20 flex items-center justify-between bg-gradient-to-t from-black/80 to-transparent pointer-events-none">
                                    <div className="relative pointer-events-auto">
                                      <AnimatePresence>
                                        {isStoryShareOpen && (
                                          <motion.div
                                            initial={{ opacity: 0, y: 10, scale: 0.9, x: "-50%" }}
                                            animate={{ opacity: 1, y: 0, scale: 1, x: "-50%" }}
                                            exit={{ opacity: 0, y: 10, scale: 0.9, x: "-50%" }}
                                            className="absolute bottom-full left-1/2 mb-4 bg-white/20 backdrop-blur-md border border-white/20 rounded-2xl p-3 flex flex-col gap-3 min-w-[50px] shadow-lg"
                                          >
                                            <button onClick={handleInstagramStory} className="p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors"><Instagram size={20} className="text-white" /></button>
                                            <button onClick={handleWhatsAppShare} className="p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors"><WhatsAppIcon size={20} className="text-white" /></button>
                                            <button onClick={handleFacebookShare} className="p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors"><Facebook size={20} className="text-white" /></button>
                                            <button onClick={handleNativeShare} className="p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors"><MoreHorizontal size={20} className="text-white" /></button>
                                            <div className="h-px bg-white/20 w-full my-1"></div>
                                            <button onClick={(e) => { e.stopPropagation(); handleStoryDownload(); setIsStoryShareOpen(false); }} className="p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors"><Download size={20} className="text-white" /></button>
                                          </motion.div>
                                        )}
                                      </AnimatePresence>
                                      <button onClick={(e) => { e.stopPropagation(); setIsStoryShareOpen(!isStoryShareOpen); }} className="p-3 bg-black/20 hover:bg-black/40 backdrop-blur-md rounded-full text-white transition-colors border border-white/10 flex items-center justify-center"><Send size={20} className="pr-[2px] pt-[2px]" /></button>
                                    </div>
                                    <div className="pointer-events-auto flex gap-3">
                                      <button onClick={(e) => { e.stopPropagation(); setIsDeleteConfirmOpen(true); }} className="p-3 bg-black/20 hover:bg-black/40 backdrop-blur-md rounded-full text-white hover:text-white transition-colors border border-white/10 group"><Trash2 size={20} className="group-hover:text-white" /></button>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </AnimatePresence>
                </div>
            </motion.div>
        )}
      </AnimatePresence>

      <footer className="pb-8 pt-20 px-6 bg-white border-t border-gray-100">
         <div className="max-w-[1800px] mx-auto flex flex-col gap-16">

            <div className="flex flex-col items-center justify-center gap-3 text-center">
                <span className="font-serif italic text-5xl md:text-6xl leading-none" dir="ltr">The End.</span>
                <p className="text-gray-400 text-[10px] md:text-xs uppercase tracking-[0.3em] whitespace-nowrap" dir="ltr">Thank you for being a part of our story</p>
            </div>

            <div className="flex flex-row items-center justify-between w-full">

                <button onClick={handleGiftClick} className="group flex items-center gap-3 bg-gray-50 hover:bg-gold-primary/10 border border-gray-200 hover:border-gold-primary/30 px-4 py-2 md:px-6 md:py-3 rounded-full transition-all duration-300 shadow-sm hover:shadow-md">
                    <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform"><AnimatedGiftIcon /></div>
                    <span className="font-medium text-xs md:text-sm text-gray-600 group-hover:text-black">מתנה לאורחים</span>
                </button>

                <div className="flex flex-col items-end">
                    <button onClick={() => navigate(ROUTES.HOME)} className="focus:outline-none hover:opacity-100 transition-opacity">
                      <img src={logoSvg} alt="MY NIGHT" className="h-10 md:h-12 w-auto object-contain opacity-80" />
                    </button>
                    <p className="text-gray-300 text-[9px] uppercase mt-1 hidden md:block">© 2025 All Rights Reserved</p>
                </div>

            </div>
         </div>
      </footer>
    </div>
  );
};

export default Gallery;

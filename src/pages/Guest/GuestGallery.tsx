import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { ROUTES } from '@/config/routes';
import { Share2, Download, Play, X, Camera, Heart, ArrowLeft, ChevronLeft, ChevronRight, MoreHorizontal, Loader2, Check } from 'lucide-react';
import { useSwipeNavigation } from '../../hooks/useSwipeNavigation';

const WhatsAppIcon = ({ size = 24, className = '' }: { size?: number; className?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
  </svg>
);
import { motion, AnimatePresence } from 'framer-motion';
import { eventsApi, galleryApi } from '@/services/api';
import type { Event, Photo } from '@/types/api.types';
import logoSvg from '@/assets/logo.svg';

interface GuestPhotoCardProps {
  item: Photo;
  isSelecting: boolean;
  isSelected: boolean;
  isVideoItem: boolean;
  thumbnailUrl: string;
  onClick: (e: React.MouseEvent) => void;
  onShare: (e: React.MouseEvent) => void;
}

const GuestPhotoCard = React.memo(({
  item,
  isSelecting,
  isSelected,
  isVideoItem,
  thumbnailUrl,
  onClick,
  onShare,
}: GuestPhotoCardProps) => {
  const known = (item as any).width && (item as any).height
    ? (item as any).width / (item as any).height
    : null;
  const [measured, setMeasured] = useState<number | null>(null);
  const ratio = known ?? measured;

  const handleImgLoad = useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
    if (known !== null) return;
    const img = e.currentTarget;
    if (img.naturalWidth && img.naturalHeight) {
      setMeasured(img.naturalWidth / img.naturalHeight);
    }
  }, [known]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2 }}
      onClick={onClick}
      className={`group relative overflow-hidden bg-gray-50 border-[0.5px] border-gray-100 cursor-pointer mb-[3px] break-inside-avoid ${
        isSelecting && isSelected ? 'ring-2 ring-inset ring-[#FACD21]' : ''
      }`}
      style={{ aspectRatio: ratio ? `${ratio}` : undefined }}
    >
      <img
        src={thumbnailUrl}
        alt=""
        loading="lazy"
        decoding="async"
        onLoad={handleImgLoad}
        className="w-full h-full object-cover transition-transform duration-[1.5s] ease-out group-hover:scale-105"
        style={{ imageRendering: 'high-quality' as any, imageOrientation: 'from-image' as any }}
      />

      {isSelecting && (
        <div className={`absolute top-2 right-2 z-10 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
          isSelected ? 'bg-[#FACD21] border-[#FACD21]' : 'bg-white/60 border-white'
        }`}>
          {isSelected && <Check size={14} className="text-black" />}
        </div>
      )}

      {isVideoItem && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="p-3 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white">
            <Play size={20} fill="white" />
          </div>
        </div>
      )}

      {!isSelecting && (
        <>
          {/* Hover overlay - desktop only */}
          <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
          {/* Always-visible share button - disappears in select mode */}
          <div className="absolute bottom-2 left-2 z-10">
            <button
              onClick={onShare}
              className="p-2 bg-black/50 hover:bg-black/70 backdrop-blur-sm rounded-full text-white transition-colors shadow-md"
            >
              <Share2 size={15} />
            </button>
          </div>
        </>
      )}
    </motion.div>
  );
});
GuestPhotoCard.displayName = 'GuestPhotoCard';

const GuestGallery: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { eventCode } = useParams();

  const [event, setEvent] = useState<Event | null>(null);
  const [isLoadingEvent, setIsLoadingEvent] = useState(true);
  const [eventError, setEventError] = useState<string | null>(null);

  const [photos, setPhotos] = useState<Photo[]>([]);
  const [isLoadingPhotos, setIsLoadingPhotos] = useState(false);

  const [selectedItem, setSelectedItem] = useState<Photo | null>(null);
  const [fullImageLoaded, setFullImageLoaded] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(true);
  const [authStep, setAuthStep] = useState<'welcome' | 'photo' | 'processing'>('welcome');
  const [guestImage, setGuestImage] = useState<string | null>(null);
  const [isShareMenuOpen, setIsShareMenuOpen] = useState(false);
  const [shareTarget, setShareTarget] = useState<Photo | null>(null);

  // Closing the share menu via UI (backdrop, cancel, or an action button) pops
  // the history entry the menu pushed on open. The popstate handler then clears
  // the menu state, keeping the history stack consistent with the back button.
  const closeShareMenu = () => {
    if (isShareMenuOpen) {
      window.history.back();
    } else {
      setShareTarget(null);
    }
  };
  const [isSharing, setIsSharing] = useState(false);
  const [isDownloadExpanded, setIsDownloadExpanded] = useState(false);
  const [isSelecting, setIsSelecting] = useState(false);
  const [selectedPhotoIds, setSelectedPhotoIds] = useState<Set<string>>(new Set());
  const [isDownloadingAll, setIsDownloadingAll] = useState(false);
  const [isDownloadingSelected, setIsDownloadingSelected] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const coupleName = event?.name || '';

  useEffect(() => {
    const fetchEvent = async () => {
      if (!eventCode) {
        setEventError('קוד אירוע חסר');
        setIsLoadingEvent(false);
        return;
      }

      try {
        const response = await eventsApi.getByCodeOrSlug(eventCode);
        if (response.data) {
          setEvent(response.data);
        } else {
          setEventError('האירוע לא נמצא');
        }
      } catch (err: any) {
        setEventError(err.response?.data?.error || 'שגיאה בטעינת האירוע');
      } finally {
        setIsLoadingEvent(false);
      }
    };

    fetchEvent();
  }, [eventCode]);

  useEffect(() => {
    const state = location.state as { matchedPhotos?: Photo[], fromSelfie?: boolean } | null;
    if (state?.fromSelfie && state?.matchedPhotos) {
      setPhotos(state.matchedPhotos);
      setShowAuthModal(false);
    }
  }, [location.state]);

  const handleBack = () => {
    if (eventCode) {
      navigate(ROUTES.GUEST_LANDING.replace(':eventCode', eventCode));
    } else {
      navigate(-1);
    }
  };

  const handleGoHome = () => {
    navigate(ROUTES.HOME);
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0] && event) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result) {
            setGuestImage(e.target.result as string);
            setAuthStep('processing');
            performFaceMatch(file);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const performFaceMatch = async (file: File) => {
    if (!event) return;

    try {
      const response = await galleryApi.matchPhotos(event._id, file);

      if (response.data?.matchedPhotos && response.data.matchedPhotos.length > 0) {
        setPhotos(response.data.matchedPhotos);
        setShowAuthModal(false);
      } else {
        setPhotos([]);
        setShowAuthModal(false);
      }
    } catch (err: any) {
      console.error('Face match failed:', err);
      setPhotos([]);
      setShowAuthModal(false);
    }
  };

  const getPhotoUrl = (photo: Photo) => {
    return photo.url || photo.thumbnailUrl;
  };

  const getThumbnailUrl = (photo: Photo) => {
    return photo.thumbnailUrl || photo.url;
  };

  const handleDownload = async (photo: Photo, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    try {
      const response = await galleryApi.getDownloadUrl(photo._id);
      if (response.data?.url) {
        const a = document.createElement('a');
        a.href = response.data.url;
        a.download = `mynight-${photo._id}.jpg`;
        a.target = '_blank';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      }
    } catch (err) {
      console.error("Download failed", err);
      window.open(getPhotoUrl(photo), '_blank');
    }
  };

  const handleDownloadAll = async () => {
    if (photos.length === 0 || isDownloadingAll) return;

    setIsDownloadingAll(true);
    try {
      const photoIds = photos.map(p => p._id);
      const blob = await galleryApi.downloadZip(photoIds);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `mynight-album-${eventCode}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Download all failed:', err);
      alert('שגיאה בהורדת האלבום. נסה שוב.');
    } finally {
      setIsDownloadingAll(false);
    }
    setIsSelecting(false);
    setIsDownloadExpanded(false);
    setSelectedPhotoIds(new Set());
  };

  const togglePhotoSelection = (photoId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedPhotoIds(prev => {
      const next = new Set(prev);
      if (next.has(photoId)) next.delete(photoId);
      else next.add(photoId);
      return next;
    });
  };

  const handleDownloadSelected = async () => {
    if (selectedPhotoIds.size === 0 || isDownloadingSelected) return;
    setIsDownloadingSelected(true);
    try {
      const blob = await galleryApi.downloadZip([...selectedPhotoIds]);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `mynight-selected-${eventCode}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Download selected failed:', err);
      alert('שגיאה בהורדת התמונות הנבחרות. נסה שוב.');
    } finally {
      setIsDownloadingSelected(false);
    }
    setIsSelecting(false);
    setIsDownloadExpanded(false);
    setSelectedPhotoIds(new Set());
  };

  const handleWhatsAppShare = async (photo: Photo) => {
      if (isSharing) return;
      const text = `תראו איזו תמונה מדהימה שלי מהחתונה של ${coupleName}! 😍\nנשלח דרך MyNight - האלבום החכם`;
      const fallback = () => {
        const url = `https://wa.me/?text=${encodeURIComponent(text + '\n' + getPhotoUrl(photo))}`;
        window.open(url, '_blank');
      };

      setIsSharing(true);
      try {
        const signedRes = await galleryApi.getDownloadUrl(photo._id);
        const fileUrl = signedRes.data?.url || getPhotoUrl(photo);
        const response = await fetch(fileUrl);
        const blob = await response.blob();
        const isVid = isVideo(photo);
        const ext = isVid ? 'mp4' : 'jpg';
        const mimeType = isVid ? 'video/mp4' : 'image/jpeg';
        const file = new File([blob], `mynight-${photo._id}.${ext}`, { type: mimeType });

        if (navigator.canShare && navigator.canShare({ files: [file] })) {
          await navigator.share({ files: [file], text });
        } else {
          fallback();
        }
      } catch {
        fallback();
      } finally {
        setIsSharing(false);
      }

      closeShareMenu();
  };

  const handleNativeShare = async (photo: Photo) => {
    if (navigator.share) {
        try {
            await navigator.share({
                title: `תמונה מהחתונה של ${coupleName}`,
                text: `תראו את התמונה המדהימה הזו מהחתונה של ${coupleName}!`,
                url: getPhotoUrl(photo)
            });
        } catch (err) {
            console.log('Share canceled', err);
        }
    } else {
        try {
            await navigator.clipboard.writeText(getPhotoUrl(photo));
            alert('הקישור הועתק ללוח!');
        } catch (err) {
            console.error('Failed to copy', err);
        }
    }
    closeShareMenu();
  };

  const handleShareClick = (photo: Photo, e?: React.MouseEvent) => {
      if (e) e.stopPropagation();
      setShareTarget(photo);
      setIsShareMenuOpen(true);
  };

  const navigateLightbox = (direction: 'next' | 'prev') => {
    if (!selectedItem) return;
    const currentIndex = photos.findIndex(item => item._id === selectedItem._id);
    if (currentIndex === -1) return;

    let newIndex;
    if (direction === 'next') {
        newIndex = (currentIndex + 1) % photos.length;
    } else {
        newIndex = (currentIndex - 1 + photos.length) % photos.length;
    }
    setFullImageLoaded(false);
    setSelectedItem(photos[newIndex]);
  };

  const swipeHandlers = useSwipeNavigation(navigateLightbox);

  const closeLightbox = () => {
    // Pop the history entry pushed below; the popstate handler below
    // actually clears selectedItem, keeping history state consistent
    // regardless of whether the lightbox was closed via the back button,
    // the X button, the backdrop, or Escape.
    if (selectedItem) {
      window.history.back();
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
        if (!selectedItem) return;
        if (e.key === 'ArrowLeft') navigateLightbox('next');
        if (e.key === 'ArrowRight') navigateLightbox('prev');
        if (e.key === 'Escape') closeLightbox();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedItem, photos]);

  // Tapping the phone's back button while a photo is enlarged should close
  // the lightbox and return to the gallery grid — not navigate away from
  // this page entirely. We push a dedicated history entry the moment the
  // lightbox opens, so the back button pops that entry first.
  useEffect(() => {
    if (!selectedItem) return;

    window.history.pushState({ lightbox: true }, '');

    const handlePopState = () => {
      setSelectedItem(null);
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
    // Intentionally only re-runs on open/close, not on every photo swipe
    // inside the lightbox (navigateLightbox also changes selectedItem).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedItem !== null]);

  // The share menu manages its own history entry so the phone back button
  // closes just the menu (returning to the gallery or lightbox underneath),
  // instead of navigating the whole page back to the selfie screen. This is
  // independent of the lightbox effect above, so it works whether the menu
  // was opened from the gallery grid or from inside the enlarged-photo view.
  useEffect(() => {
    if (!isShareMenuOpen) return;

    window.history.pushState({ shareMenu: true }, '');

    const handlePopState = () => {
      setIsShareMenuOpen(false);
      setShareTarget(null);
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isShareMenuOpen]);

  const isVideo = (photo: Photo) => photo.metadata?.mimeType?.startsWith('video/');

  if (isLoadingEvent) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center" dir="rtl">
        <div className="text-center">
          <Loader2 size={48} className="animate-spin text-gold-primary mx-auto mb-4" />
          <p className="text-gray-500 font-medium">טוען אירוע...</p>
        </div>
      </div>
    );
  }

  if (eventError) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-6" dir="rtl">
        <div className="text-center max-w-sm">
          <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <span className="text-4xl">😕</span>
          </div>
          <h1 className="text-2xl font-bold mb-2">אופס!</h1>
          <p className="text-gray-500 mb-6">{eventError}</p>
          <button
            onClick={handleGoHome}
            className="bg-black text-white px-8 py-3 rounded-xl font-bold hover:bg-gray-800 transition-all"
          >
            חזרה לדף הבית
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white text-charcoal flex flex-col relative" dir="rtl">

      <AnimatePresence>
        {showAuthModal && (
            <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 bg-black/80 backdrop-blur-md"
                />

                <motion.div
                    initial={{ scale: 0.9, opacity: 0, y: 20 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.9, opacity: 0, y: 20 }}
                    className="bg-white rounded-[32px] p-8 w-full max-w-sm relative z-10 shadow-2xl text-center overflow-hidden"
                >
                    <AnimatePresence mode="wait">
                        {authStep === 'welcome' && (
                            <motion.div
                                key="welcome-step"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="flex flex-col items-center"
                            >
                                <div className="w-16 h-16 bg-gold-primary/10 rounded-2xl flex items-center justify-center mb-6 border border-gold-primary/20">
                                    <Heart size={32} className="text-gold-primary fill-gold-primary/20" />
                                </div>
                                <h2 className="text-2xl font-black mb-3">איזה כיף שהייתם!</h2>
                                <p className="text-gray-500 text-sm mb-8 leading-relaxed">
                                    תודה שחגגתם איתנו בחתונה.<br/>
                                    - {coupleName}
                                    <br/><br/>
                                    כדי למצוא את התמונות שלכם מהאירוע,<br/>
                                    נצטרך סלפי קצר לזיהוי פנים.
                                </p>
                                <button
                                    onClick={() => setAuthStep('photo')}
                                    className="w-full bg-charcoal text-white py-4 rounded-xl font-bold text-lg shadow-lg hover:bg-black transition-all flex items-center justify-center gap-3 border border-gray-800"
                                >
                                    <span>יאללה, בואו נתחיל</span>
                                    <ArrowLeft size={20} />
                                </button>
                                <button
                                    onClick={handleBack}
                                    className="mt-4 text-gray-400 text-sm font-medium hover:text-black transition-colors"
                                >
                                    חזרה
                                </button>
                            </motion.div>
                        )}

                        {authStep === 'photo' && (
                            <motion.div
                                key="photo-step"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="flex flex-col items-center"
                            >
                                <div className="w-16 h-16 bg-gold-primary/10 rounded-2xl flex items-center justify-center mb-6 border border-gold-primary/20">
                                    <Camera size={32} className="text-gold-primary" />
                                </div>
                                <h2 className="text-2xl font-black mb-2">זיהוי פנים מהיר</h2>
                                <p className="text-gray-500 text-sm mb-6 max-w-[240px] mx-auto leading-relaxed">
                                    תמונה אחת והאלבום שלך מוכן<br/>
                                    <span className="text-xs text-gray-400">(נמחק את התמונה מיד לאחר הזיהוי)</span>
                                </p>

                                <input
                                    type="file"
                                    accept="image/*"
                                    capture="user"
                                    className="hidden"
                                    ref={fileInputRef}
                                    onChange={handleFileSelect}
                                />

                                <div className="space-y-3 w-full">
                                    <button
                                        onClick={() => fileInputRef.current?.click()}
                                        className="w-full bg-charcoal text-white py-4 rounded-xl font-bold text-lg shadow-lg hover:bg-black transition-all flex items-center justify-center gap-3 border border-gray-800"
                                    >
                                        <Camera size={22} />
                                        <span>צילום סלפי / העלאה</span>
                                    </button>
                                    <button
                                        onClick={() => setAuthStep('welcome')}
                                        className="text-gray-400 text-sm font-medium hover:text-black transition-colors"
                                    >
                                        חזרה
                                    </button>
                                </div>
                            </motion.div>
                        )}

                        {authStep === 'processing' && (
                            <motion.div
                                key="processing-step"
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="flex flex-col items-center py-4"
                            >
                                <div className="relative mb-6">
                                    <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-gray-100 relative z-10">
                                        {guestImage && <img src={guestImage} className="w-full h-full object-cover" alt="Me" />}
                                    </div>
                                    <div className="absolute inset-[-4px] rounded-full border-2 border-transparent border-t-gold-primary border-r-gold-primary animate-spin z-20" />
                                </div>
                                <h2 className="text-xl font-bold mb-1">מחפש תמונות...</h2>
                                <p className="text-gray-400 text-sm">סורק את הגלריה של {coupleName}</p>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </motion.div>
            </div>
        )}
      </AnimatePresence>

      <div className="sticky top-0 z-40 bg-white/95 backdrop-blur-xl border-b border-gray-100 px-4 py-3 md:px-6 md:py-4">
         <div className="max-w-[1800px] mx-auto flex items-center justify-between">
            <div className="text-right">
                <h1 className="font-bold text-xl leading-none">האלבום האישי שלי</h1>
            </div>
            <button onClick={handleGoHome} className="focus:outline-none">
                <img src={logoSvg} alt="Logo" className="h-[36px] md:h-[42px] w-auto object-contain" />
            </button>
         </div>
      </div>

      <div className="flex-grow w-full">

         <div className="max-w-[1800px] mx-auto p-4 md:p-6">
             <div className="bg-gradient-to-br from-gold-primary/10 to-transparent p-6 rounded-3xl flex items-center gap-6 border border-gold-primary/10 relative overflow-hidden">

                <div>
                   <p className="text-sm text-gray-600 leading-relaxed">
                      {photos.length > 0
                        ? `כיכבת ב${photos.length} תמונות בחתונה של ${coupleName}.`
                        : `לא מצאנו תמונות שלך מהחתונה של ${coupleName}. נסה לצלם סלפי אחר.`
                      }
                   </p>
                </div>
             </div>
         </div>

         {photos.length > 0 ? (
           <div className="px-[3px] pb-32">
              <div className="columns-2 md:columns-3 lg:columns-4 gap-[3px] space-y-[3px]">
                  {photos.map((item) => (
                    <GuestPhotoCard
                      key={item._id}
                      item={item}
                      isSelecting={isSelecting}
                      isSelected={selectedPhotoIds.has(item._id)}
                      isVideoItem={isVideo(item)}
                      thumbnailUrl={getThumbnailUrl(item)}
                      onClick={(e) => isSelecting ? togglePhotoSelection(item._id, e) : setSelectedItem(item)}
                      onShare={(e) => handleShareClick(item, e)}
                    />
                  ))}
              </div>
           </div>
         ) : !showAuthModal && (
           <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
             <Camera size={64} className="text-gray-300 mb-6" />
             <h3 className="text-2xl font-bold mb-2">אין תמונות להצגה</h3>
             <p className="text-gray-500 mb-6">נסה לצלם סלפי אחר או חזור מאוחר יותר</p>
             <button
               onClick={() => setShowAuthModal(true)}
               className="bg-black text-white px-8 py-3 rounded-xl font-bold hover:bg-gray-800 transition-all"
             >
               נסה שוב
             </button>
           </div>
         )}
      </div>

      {!showAuthModal && photos.length > 0 && (
        <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="fixed bottom-[30px] left-0 right-0 flex flex-col items-center gap-2 z-30 pointer-events-none"
        >
            <AnimatePresence>
              {isDownloadExpanded && (
                <motion.button
                    initial={{ opacity: 0, y: 20, scale: 0.9 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 20, scale: 0.9 }}
                    onClick={isSelecting ? handleDownloadSelected : () => setIsSelecting(true)}
                    disabled={isDownloadingSelected}
                    className="bg-gradient-to-r from-[#FACD21] to-[#F5DB5E] text-black px-8 py-3.5 rounded-full shadow-2xl font-bold flex items-center gap-3 pointer-events-auto transition-all active:scale-95 disabled:opacity-80"
                >
                    {isDownloadingSelected ? <Loader2 size={20} className="animate-spin" /> : <Check size={20} />}
                    <span>{isDownloadingSelected ? 'כמה שניות...' : isSelecting ? `הורדת נבחרות (${selectedPhotoIds.size})` : 'בחירת תמונות'}</span>
                </motion.button>
              )}
            </AnimatePresence>
            <button
                onClick={isDownloadExpanded ? handleDownloadAll : () => setIsDownloadExpanded(true)}
                disabled={isDownloadingAll}
                className="bg-black text-white px-8 py-3.5 rounded-full shadow-2xl font-bold flex items-center gap-3 pointer-events-auto hover:bg-gray-900 transition-all hover:scale-105 active:scale-95 border border-white/10 disabled:opacity-80 disabled:hover:scale-100"
            >
                {isDownloadingAll ? <Loader2 size={20} className="animate-spin" /> : <Download size={20} />}
                <span>{isDownloadingAll ? 'כמה שניות...' : isDownloadExpanded ? 'הורדת הכל' : 'הורדת האלבום'}</span>
            </button>
        </motion.div>
      )}

      <AnimatePresence>
        {selectedItem && (
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[180] bg-white flex items-center justify-center"
                onClick={closeLightbox}
            >
                <div className="absolute top-4 left-4 z-20">
                   <button onClick={(e) => { e.stopPropagation(); closeLightbox(); }} className="p-3 bg-gray-100 hover:bg-gray-200 rounded-full text-black transition-colors shadow-sm">
                        <X size={24} />
                   </button>
                </div>

                <div className="absolute top-4 right-4 flex gap-3 z-20">
                   <button onClick={(e) => { e.stopPropagation(); setShareTarget(selectedItem); setIsShareMenuOpen(true); }} className="p-3 bg-black text-white hover:bg-gray-800 rounded-full transition-colors shadow-md">
                        <Share2 size={24} />
                   </button>
                   <button onClick={(e) => handleDownload(selectedItem, e)} className="p-3 bg-gray-100 text-black hover:bg-gray-200 rounded-full transition-colors shadow-sm">
                        <Download size={24} />
                   </button>
                </div>

                <button onClick={(e) => { e.stopPropagation(); navigateLightbox('next'); }} className="absolute left-6 bottom-8 p-4 bg-white/90 hover:bg-white text-black rounded-full backdrop-blur-md transition-all z-20 shadow-xl border border-gray-100/50 hover:scale-105 active:scale-95">
                    <ChevronLeft size={32} />
                </button>
                <button onClick={(e) => { e.stopPropagation(); navigateLightbox('prev'); }} className="absolute right-6 bottom-8 p-4 bg-white/90 hover:bg-white text-black rounded-full backdrop-blur-md transition-all z-20 shadow-xl border border-gray-100/50 hover:scale-105 active:scale-95">
                    <ChevronRight size={32} />
                </button>

                <div className="w-full h-full p-4 flex items-center justify-center" onClick={(e) => e.stopPropagation()} {...swipeHandlers}>
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={selectedItem._id}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            transition={{ duration: 0.2 }}
                            className="w-full h-full flex items-center justify-center"
                        >
                            {isVideo(selectedItem) ? (
                                <video
                                    src={getPhotoUrl(selectedItem)}
                                    className="max-w-full max-h-full rounded-lg shadow-2xl"
                                    controls
                                    autoPlay
                                    onLoadedMetadata={(e) => { e.currentTarget.volume = 0.3; }}
                                />
                            ) : (
                                <div className="relative w-full h-full flex items-center justify-center">
                                    {/* Thumbnail shown immediately while full image loads */}
                                    <img
                                        src={selectedItem.thumbnailUrl || getPhotoUrl(selectedItem)}
                                        alt=""
                                        className="absolute max-w-full max-h-full object-contain rounded-lg shadow-2xl transition-opacity duration-300"
                                        style={{ opacity: fullImageLoaded ? 0 : 1 }}
                                    />
                                    {/* Full-resolution image fades in on top */}
                                    <img
                                        src={getPhotoUrl(selectedItem)}
                                        alt=""
                                        className="max-w-full max-h-full object-contain rounded-lg shadow-2xl transition-opacity duration-500"
                                        style={{ opacity: fullImageLoaded ? 1 : 0 }}
                                        onLoad={() => setFullImageLoaded(true)}
                                    />
                                </div>
                            )}
                        </motion.div>
                    </AnimatePresence>
                </div>

            </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isShareMenuOpen && (shareTarget || selectedItem) && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[210] bg-black/40"
              onClick={closeShareMenu}
            />
            <motion.div
              initial={{ opacity: 0, y: 100 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 100 }}
              className="fixed bottom-0 left-0 right-0 bg-white rounded-t-3xl p-6 z-[220] text-center shadow-[0_-10px_40px_rgba(0,0,0,0.1)]"
              onClick={(e) => e.stopPropagation()}
              dir="rtl"
            >
              <h3 className="text-lg font-bold mb-6">שיתוף תמונה</h3>
              <div className="grid grid-cols-3 gap-3 mb-6">
                <button disabled={isSharing} onClick={() => { const t = shareTarget || selectedItem; if (t) handleWhatsAppShare(t); }} className="flex flex-col items-center gap-3 disabled:opacity-70">
                  <div className="p-4 bg-[#25D366]/10 rounded-full text-[#25D366]">
                    {isSharing ? <Loader2 size={28} className="animate-spin" /> : <WhatsAppIcon size={28} />}
                  </div>
                  <span className="text-xs font-medium text-gray-600">{isSharing ? 'מכין...' : 'WhatsApp'}</span>
                </button>
                <button onClick={() => { const t = shareTarget || selectedItem; if (t) { handleDownload(t); closeShareMenu(); } }} className="flex flex-col items-center gap-3">
                  <div className="p-4 bg-gray-100 rounded-full text-gray-700"><Download size={28} /></div>
                  <span className="text-xs font-medium text-gray-600">הורדה</span>
                </button>
                <button onClick={() => { const t = shareTarget || selectedItem; if (t) handleNativeShare(t); }} className="flex flex-col items-center gap-3">
                  <div className="p-4 bg-gray-100 rounded-full text-gray-600"><MoreHorizontal size={28} /></div>
                  <span className="text-xs font-medium text-gray-600">עוד</span>
                </button>
              </div>
              <button onClick={closeShareMenu} className="w-full py-4 bg-gray-50 hover:bg-gray-100 rounded-xl font-bold transition-colors text-gray-500">ביטול</button>
            </motion.div>
          </>
        )}
      </AnimatePresence>

    </div>
  );
};

export default GuestGallery;

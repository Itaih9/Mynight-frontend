import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronsRight, X, Download, Share2, ChevronLeft, ChevronRight, Loader2, Heart } from 'lucide-react';
import { galleryApi } from '@/services/api';
import type { Photo } from '@/types/api.types';
import { faceCircleImageStyle, type FaceEntry } from './faceCrop';
import { FaceCircles } from './FaceCircles';
import { PhotographerCard } from '@/components/gallery/PhotographerCard';

interface FacePhotosOverlayProps {
  /** Present for event galleries; omitted for the showcase (uses fetchPhotos). */
  eventId?: string;
  /**
   * Override how this person's photos are fetched. The showcase passes a
   * faceId-only fetch since it has no eventId. Defaults to the event endpoint.
   */
  fetchPhotos?: (faceId: string) => Promise<Photo[]>;
  face: FaceEntry;
  /** Display rendition of the source photo, cropped for the header face thumb. */
  faceImageUrl: string;
  imgWidth?: number;
  imgHeight?: number;
  /** Couple names for the header, e.g. "נועה & איתי". */
  coupleName: string;
  onBack: () => void;
  /** Optional favorites support (Gallery passes these; GuestGallery omits them). */
  favorites?: Set<string>;
  onToggleFavorite?: (id: string, e?: React.MouseEvent) => void;
  /** Event photographer, credited at the bottom of this gallery when present. */
  photographer?: { name?: string; instagram?: string };
}

const photoCountText = (n: number) => (n === 1 ? 'תמונה אחת' : `${n} תמונות`);

const isVideo = (photo: Photo) => photo.metadata?.mimeType?.startsWith('video/');
const previewUrl = (photo: Photo) => (isVideo(photo) ? photo.posterUrl || photo.thumbnailUrl : photo.thumbnailUrl) || photo.url;

/**
 * A dedicated rekognition-style gallery of every photo containing a given face.
 * Rendered as a full-screen overlay above the lightbox so the previously-open
 * photo and the gallery scroll position underneath are preserved — the back
 * control (») just unmounts this overlay.
 */
export const FacePhotosOverlay = ({
  eventId,
  fetchPhotos,
  face,
  faceImageUrl,
  imgWidth,
  imgHeight,
  coupleName,
  onBack,
  favorites,
  onToggleFavorite,
  photographer,
}: FacePhotosOverlayProps) => {
  // Download-all needs the event zip endpoint; the showcase (no eventId) hides it.
  const canDownloadAll = Boolean(eventId);
  const [showPhotog, setShowPhotog] = useState(false);
  const hasPhotographer = Boolean(photographer && (photographer.name || photographer.instagram));
  // The "current person" — starts from the tapped face and its source photo, but
  // changes when the user taps another face inside a photo in this gallery
  // (recursive: person A's photo → tap person B → person B's gallery).
  const [current, setCurrent] = useState({ face, imageUrl: faceImageUrl, imgW: imgWidth, imgH: imgHeight });
  // Reset to the person the parent opened whenever that changes.
  useEffect(() => {
    setCurrent({ face, imageUrl: faceImageUrl, imgW: imgWidth, imgH: imgHeight });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [face.faceId]);

  const [photos, setPhotos] = useState<Photo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selected, setSelected] = useState<Photo | null>(null);
  const [fullLoaded, setFullLoaded] = useState(false);
  const [isDownloadingAll, setIsDownloadingAll] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    const load = fetchPhotos
      ? fetchPhotos(current.face.faceId)
      : galleryApi.getFacePhotos(eventId!, current.face.faceId).then((res) => (Array.isArray(res.data) ? res.data : []));
    load
      .then((list) => {
        if (!cancelled) setPhotos(Array.isArray(list) ? list : []);
      })
      .catch(() => {
        if (!cancelled) setPhotos([]);
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [eventId, fetchPhotos, current.face.faceId]);

  // Open another person's gallery from a face tapped inside the currently-open photo.
  const openPerson = (f: FaceEntry, sourcePhoto: Photo) => {
    setSelected(null);
    setFullLoaded(false);
    setCurrent({
      face: f,
      imageUrl: sourcePhoto.thumbnailUrl || sourcePhoto.displayUrl || sourcePhoto.url,
      imgW: sourcePhoto.metadata?.width,
      imgH: sourcePhoto.metadata?.height,
    });
  };

  const navigate = (dir: 'next' | 'prev') => {
    if (!selected) return;
    const idx = photos.findIndex((p) => p._id === selected._id);
    if (idx === -1) return;
    const nextIdx = dir === 'next' ? (idx + 1) % photos.length : (idx - 1 + photos.length) % photos.length;
    setFullLoaded(false);
    setSelected(photos[nextIdx]);
  };

  // While the full-size photo is open, Esc returns to the face grid (not the
  // original photo) and arrows navigate within this person's photos. Captured so
  // the parent gallery's key handler (which would close the whole face gallery)
  // never sees these keys.
  useEffect(() => {
    if (!selected) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { e.stopPropagation(); setSelected(null); }
      else if (e.key === 'ArrowLeft') { e.stopPropagation(); navigate('next'); }
      else if (e.key === 'ArrowRight') { e.stopPropagation(); navigate('prev'); }
    };
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected, photos]);

  const swipeStartX = useRef<number | null>(null);
  const onTouchStart = (e: React.TouchEvent) => {
    swipeStartX.current = e.touches[0].clientX;
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    if (swipeStartX.current === null) return;
    const dx = e.changedTouches[0].clientX - swipeStartX.current;
    if (Math.abs(dx) > 50) navigate(dx < 0 ? 'next' : 'prev');
    swipeStartX.current = null;
  };

  // Download every photo of the current person as a zip (same backend stream
  // as the rekognition/guest gallery's "download all").
  const handleDownloadAll = async () => {
    if (!eventId || photos.length === 0 || isDownloadingAll) return;
    setIsDownloadingAll(true);
    try {
      const blob = await galleryApi.downloadFaceZip(eventId, current.face.faceId);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `mynight-${coupleName || 'album'}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Download all failed:', err);
      alert('שגיאה בהורדת התמונות. נסו שוב.');
    } finally {
      setIsDownloadingAll(false);
    }
  };

  const handleShare = async (photo: Photo, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const url = photo.displayUrl || photo.url;
    try {
      if (navigator.share) {
        await navigator.share({ title: 'MyNight', text: `תמונה מהלילה של ${coupleName}`, url });
        return;
      }
    } catch {
      return; // native share dismissed/cancelled
    }
    // Fallback for browsers without the Web Share API.
    window.open(`https://wa.me/?text=${encodeURIComponent(url)}`, '_blank');
  };

  const handleDownload = async (photo: Photo, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    try {
      const res = await galleryApi.getDownloadUrl(photo._id);
      const url = res.data?.url || photo.url;
      const a = document.createElement('a');
      a.href = url;
      a.download = `mynight-${photo._id}.jpg`;
      a.target = '_blank';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch {
      window.open(photo.url, '_blank');
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[200] bg-white flex flex-col"
      dir="rtl"
    >
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white/95 backdrop-blur-xl border-b border-gray-100 px-4 py-3 md:px-6 md:py-4">
        <div className="max-w-[1800px] mx-auto flex items-center">
          <button
            onClick={onBack}
            className="p-1 -mr-1 hover:bg-gray-100 rounded-full transition-colors text-black shrink-0"
            aria-label="חזרה"
          >
            <ChevronsRight size={26} />
          </button>

          {/* The arrow↔circle distance is the back button's padding (now p-1); the
              circle↔count gap (ml-1) is kept equal to it. */}
          <span className="relative block shrink-0 rounded-full bg-gold-primary shadow-md ml-1" style={{ width: 46, height: 46 }}>
            <span className="absolute inset-[2px] rounded-full overflow-hidden bg-gray-200" style={{ clipPath: 'circle(50%)' }}>
              <img src={current.imageUrl} alt="" draggable={false} style={faceCircleImageStyle(current.face.boundingBox, current.imgW, current.imgH, 42)} />
            </span>
          </span>

          <div className="min-w-0 flex-1">
            <p className="font-bold text-base md:text-lg text-black leading-tight truncate">
              {photoCountText(photos.length)} בלילה של {coupleName}
            </p>
          </div>

          {photos.length > 0 && canDownloadAll && (
            <button
              onClick={handleDownloadAll}
              disabled={isDownloadingAll}
              className="shrink-0 flex items-center gap-2 px-4 py-2 md:px-5 md:py-2.5 bg-black text-white rounded-full hover:bg-gray-800 transition-colors shadow-sm disabled:opacity-60"
            >
              {isDownloadingAll ? <Loader2 size={18} className="animate-spin" /> : <Download size={18} />}
              <span className="text-sm font-medium whitespace-nowrap">הורדת הכל</span>
            </button>
          )}
        </div>
      </div>

      {/* Grid */}
      <div className="flex-grow overflow-y-auto">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <Loader2 size={40} className="animate-spin text-gold-primary mb-3" />
            <p className="text-gray-500 font-medium">טוען תמונות...</p>
          </div>
        ) : photos.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 px-6 text-center">
            <h3 className="text-xl font-bold mb-2">אין תמונות להצגה</h3>
          </div>
        ) : (
          <div className="px-[3px] pb-24 pt-[3px]">
            <div className="columns-2 md:columns-3 lg:columns-4 gap-[3px] space-y-[3px]">
              {photos.map((photo) => (
                <div
                  key={photo._id}
                  role="button"
                  tabIndex={0}
                  onClick={() => { setFullLoaded(false); setSelected(photo); }}
                  className="group relative block w-full overflow-hidden bg-gray-50 border-[0.5px] border-gray-100 mb-[3px] break-inside-avoid cursor-pointer"
                >
                  <img
                    src={previewUrl(photo)}
                    alt=""
                    loading="lazy"
                    decoding="async"
                    className="w-full h-auto object-cover transition-transform duration-[1.5s] ease-out group-hover:scale-105"
                  />
                  {isVideo(photo) && (
                    <span className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <span className="p-3 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white text-xs">▶</span>
                    </span>
                  )}
                  {/* Favorited photos show an interactive heart (to un-favorite),
                      matching the main grid — un-favorited photos have none. */}
                  {favorites && onToggleFavorite && favorites.has(photo._id) && (
                    <button
                      onClick={(e) => onToggleFavorite(photo._id, e)}
                      className="absolute top-2 left-2 z-20 p-2 rounded-full hover:bg-black/10 transition-colors"
                    >
                      <Heart size={18} className="fill-red-500 text-red-500" />
                    </button>
                  )}
                </div>
              ))}
            </div>
            {hasPhotographer && (
              <div className="text-center pt-10 pb-4">
                <button onClick={() => setShowPhotog(true)} className="text-xs text-gray-500 hover:text-black transition-colors" dir="rtl">
                  צילום: <span className="font-semibold">{photographer!.name || `@${photographer!.instagram}`}</span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {showPhotog && hasPhotographer && (
        <PhotographerCard photographer={photographer!} onClose={() => setShowPhotog(false)} />
      )}

      {/* Internal viewer */}
      <AnimatePresence>
        {selected && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[210] bg-white flex items-center justify-center"
            onClick={() => setSelected(null)}
          >
            {/* Close + download — top-left toolbar (download behaves like the
                rekognition gallery's: getDownloadUrl → save the photo). */}
            <div dir="ltr" className="absolute top-4 left-4 flex gap-3 z-20">
              <button onClick={(e) => { e.stopPropagation(); setSelected(null); }} className="p-3 bg-gray-100 hover:bg-gray-200 rounded-full text-black transition-colors shadow-sm">
                <X size={22} />
              </button>
              <button onClick={(e) => handleDownload(selected, e)} className="p-3 bg-gray-100 text-black hover:bg-gray-200 rounded-full transition-colors shadow-sm">
                <Download size={22} />
              </button>
              <button onClick={(e) => handleShare(selected, e)} className="p-3 bg-black text-white hover:bg-gray-800 rounded-full transition-colors shadow-sm">
                <Share2 size={22} className="-translate-x-[1px]" />
              </button>
            </div>

            {/* Favorite — top-right */}
            {favorites && onToggleFavorite && (
              <div className="absolute top-4 right-4 z-20">
                <button onClick={(e) => { e.stopPropagation(); onToggleFavorite(selected._id, e); }} className="p-3 bg-white border border-gray-100 hover:bg-gray-50 rounded-full shadow-sm transition-all group">
                  <Heart size={22} className={favorites.has(selected._id) ? 'fill-red-500 text-red-500' : 'text-gray-400 group-hover:text-red-500'} />
                </button>
              </div>
            )}

            {photos.length > 1 && (
              <>
                <button onClick={(e) => { e.stopPropagation(); navigate('next'); }} className="absolute left-4 top-1/2 -translate-y-1/2 p-3 bg-white/80 hover:bg-white text-black rounded-full backdrop-blur-md transition-all z-20 shadow-lg">
                  <ChevronLeft size={30} />
                </button>
                <button onClick={(e) => { e.stopPropagation(); navigate('prev'); }} className="absolute right-4 top-1/2 -translate-y-1/2 p-3 bg-white/80 hover:bg-white text-black rounded-full backdrop-blur-md transition-all z-20 shadow-lg">
                  <ChevronRight size={30} />
                </button>
              </>
            )}

            <div className="w-full h-full p-4 md:p-8 flex items-center justify-center" onClick={(e) => e.stopPropagation()} onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
              {isVideo(selected) ? (
                <video src={selected.url} className="max-w-full max-h-full rounded-lg shadow-2xl" controls autoPlay playsInline onLoadedMetadata={(e) => { e.currentTarget.volume = 0.3; }} />
              ) : (
                <div className="relative w-full h-full flex items-center justify-center" style={{ filter: 'drop-shadow(0 12px 32px rgba(0,0,0,0.20))' }}>
                  <img
                    src={selected.thumbnailUrl || selected.url}
                    alt=""
                    className="absolute inset-0 w-full h-full object-contain"
                  />
                  <img
                    src={selected.displayUrl || selected.url}
                    alt=""
                    className="absolute inset-0 w-full h-full object-contain"
                    style={{ opacity: fullLoaded ? 1 : 0 }}
                    ref={(node) => { if (node && node.complete && node.naturalWidth > 0) setFullLoaded(true); }}
                    onLoad={() => setFullLoaded(true)}
                    onError={(e) => {
                      if (selected.displayUrl && e.currentTarget.src !== selected.url) {
                        e.currentTarget.src = selected.url;
                      }
                    }}
                  />
                </div>
              )}
            </div>

            {!isVideo(selected) && (selected.indexedFaces?.length ?? 0) > 0 && (
              <FaceCircles
                imageUrl={selected.thumbnailUrl || selected.displayUrl || selected.url}
                imgWidth={selected.metadata?.width}
                imgHeight={selected.metadata?.height}
                faces={(selected.indexedFaces ?? []).map((f) => ({ faceId: f.faceId, boundingBox: f.boundingBox }))}
                onFaceClick={(f) => openPerson(f, selected)}
              />
            )}

            {hasPhotographer && (
              <div className="absolute bottom-6 right-6 z-20 pointer-events-auto">
                <button onClick={(e) => { e.stopPropagation(); setShowPhotog(true); }} className="bg-white/90 backdrop-blur-sm px-4 py-2 rounded-2xl shadow-sm border border-gray-100 text-right block">
                  <span className="block text-[10px] text-gray-400 leading-none">צלם</span>
                  <span className="block font-bold text-sm text-black leading-tight">{photographer!.name || `@${photographer!.instagram}`}</span>
                  <span className="block text-xs font-semibold text-gold-primary underline underline-offset-2 leading-none -mt-0.5">לפרטים</span>
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default FacePhotosOverlay;

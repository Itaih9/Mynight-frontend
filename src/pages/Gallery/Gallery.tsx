import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ROUTES } from '@/config/routes';
import { useUserStore } from '@/store/userStore';
import { eventsApi, galleryApi, couponApi } from '@/services/api';
import type { MediaItem, StoryGroup, GalleryPageProps } from './types';
import { cubeVariants } from './constants';
import { useGalleryData } from './hooks';
import { formatCategoryLabel, getTokenScope } from '@/lib/utils';
import { FaceCircles } from '@/components/faces/FaceCircles';
import { FacePhotosOverlay } from '@/components/faces/FacePhotosOverlay';
import type { FaceEntry } from '@/components/faces/faceCrop';
import { OpeningGiftAnimation, HeroVerticalCollage, AnimatedGiftIcon } from './components';
import logoSvg from '@/assets/logo.svg';
import {
  Play,
  X,
  ChevronRight,
  ChevronLeft,
  ChevronDown,
  Search,
  Download,
  Share2,
  Send,
  Check,
  Loader2,
  Facebook,
  Instagram,
  MoreHorizontal,
  Smartphone,
  Trash2,
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
  Eye,
} from 'lucide-react';
import { motion, AnimatePresence, PanInfo } from 'framer-motion';
import confetti from 'canvas-confetti';
import { useSwipeNavigation } from '@/hooks/useSwipeNavigation';
import { useNetworkQuality } from '@/hooks/useNetworkQuality';

const SAMPLE_UPLOADER_NAMES = ['דנה', 'יוסי', 'מיכל', 'אורן', 'שירה', 'עומר', 'נועה', 'איתי'];

type ShareTarget = 'lightbox' | 'story';

const WhatsAppIcon = React.memo(({ size = 24, className = '' }: { size?: number; className?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
  </svg>
));
WhatsAppIcon.displayName = 'WhatsAppIcon';

const createSampleMediaItems = (urls: string[]): MediaItem[] => {
  return urls.map((url, i) => ({
    id: `sample-${i}`,
    type: 'photo',
    source: i % 3 === 0 ? 'pro' : 'guest',
    url,
    thumbnail: url,
    uploaderName: SAMPLE_UPLOADER_NAMES[i % SAMPLE_UPLOADER_NAMES.length],
    timestamp: new Date(Date.now() - i * 3600000),
    orientation: i % 3 === 0 ? 'portrait' : 'landscape',
  })) as MediaItem[];
};

const getItemDate = (item: MediaItem): Date => {
  const raw = (item as any).uploadedAt ?? item.timestamp;
  const date = raw instanceof Date ? raw : new Date(raw);
  return Number.isFinite(date.getTime()) ? date : new Date(0);
};

const getItemTime = (item: MediaItem): number => getItemDate(item).getTime();

const formatItemTime = (item: MediaItem) =>
  getItemDate(item).toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' });

const getSafeImageSrc = (src?: string) => {
  if (!src) return '';
  return src.includes('postimg.cc') ? `${src}?dl=1` : src;
};

const getVideoThumb = (item: MediaItem) => getSafeImageSrc(item.poster || item.thumbnail || '');

const getShareText = (coupleName: string, isOwner: boolean) => {
  const footer = '\n\n- שותף עם MyNight.co.il';
  return isOwner
    ? `תראו איזה רגע מהחתונה! היה מטורף${footer}`
    : `תראו איזה רגע מהחתונה של ${coupleName}! היה מדהים${footer}`;
};

const getCurrentStoryItem = (group: StoryGroup | null, index: number) => {
  if (!group) return null;
  return group.items[index] ?? null;
};

// ============================================================================
// Modals (unchanged from original)
// ============================================================================

const DeleteConfirmModal = ({
  open,
  onClose,
  onConfirm,
  isDeleting = false,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isDeleting?: boolean;
}) => (
  <AnimatePresence>
    {open && (
      <div className="fixed inset-0 z-[200] flex items-center justify-center p-4" dir="rtl">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => { if (!isDeleting) onClose(); }}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        />
        <motion.div
          initial={{ scale: 0.94, opacity: 0, y: 16 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.94, opacity: 0, y: 16 }}
          className="bg-white rounded-3xl p-8 w-full max-w-sm relative z-10 shadow-2xl text-center"
        >
          <div className="w-16 h-16 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Trash2 size={32} />
          </div>
          <h3 className="text-2xl font-bold mb-2">{isDeleting ? 'מוחק את המדיה…' : 'למחוק את המדיה?'}</h3>
          <p className="text-gray-500 mb-8">{isDeleting ? 'אנא המתינו רגע' : 'הפעולה תסיר את הקובץ מהגלריה לצמיתות.'}</p>
          <div className="grid grid-cols-2 gap-4">
            <button onClick={onClose} disabled={isDeleting} className="py-3 rounded-xl font-bold text-gray-500 bg-gray-50 hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
              ביטול
            </button>
            <button onClick={onConfirm} disabled={isDeleting} className="py-3 rounded-xl font-bold text-white bg-red-500 hover:bg-red-600 transition-colors disabled:opacity-70 disabled:cursor-not-allowed inline-flex items-center justify-center gap-2">
              {isDeleting ? <Loader2 size={18} className="animate-spin" /> : 'מחיקה'}
            </button>
          </div>
        </motion.div>
      </div>
    )}
  </AnimatePresence>
);

const ShareSettingsModal = ({
  open,
  onClose,
  shareSettings,
  toggleShareSetting,
  guestLink,
  linkCopied,
  onCopyGuestLink,
}: {
  open: boolean;
  onClose: () => void;
  shareSettings: { pro: boolean; guests: boolean; stories: boolean };
  toggleShareSetting: (key: 'pro' | 'guests' | 'stories') => void;
  guestLink?: string;
  linkCopied: boolean;
  onCopyGuestLink: () => void;
}) => (
  <AnimatePresence>
    {open && (
      <div className="fixed inset-0 z-[200] flex items-center justify-center p-4" dir="rtl">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        />
        <motion.div
          initial={{ scale: 0.94, opacity: 0, y: 16 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.94, opacity: 0, y: 16 }}
          className="bg-white rounded-3xl p-6 w-full max-w-md relative z-10 shadow-2xl overflow-hidden"
        >
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-bold">ניהול שיתוף לאורחים</h3>
            <button onClick={onClose} className="p-2 bg-gray-50 hover:bg-gray-100 rounded-full">
              <X size={20} />
            </button>
          </div>

          <p className="text-gray-500 mb-6 text-sm">בחרו מה האורחים יראו בקישור האישי</p>

          <div className="space-y-4 mb-8">
            {[
              { key: 'pro' as const, label: 'תמונות וסרטונים מהצלם', icon: Camera },
              { key: 'guests' as const, label: 'תמונות וסרטונים מאורחים', icon: Users },
              { key: 'stories' as const, label: 'סטוריז', icon: Smartphone },
            ].map(({ key, label, icon: Icon }) => (
              <div
                key={key}
                onClick={() => toggleShareSetting(key)}
                className={`flex items-center justify-between p-4 rounded-xl border cursor-pointer transition-all ${
                  shareSettings[key] ? 'border-gold-primary bg-gold-primary/5' : 'border-gray-100 bg-white'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${shareSettings[key] ? 'bg-gold-primary text-black' : 'bg-gray-100 text-gray-400'}`}>
                    <Icon size={20} />
                  </div>
                  <span className={`font-medium ${shareSettings[key] ? 'text-black' : 'text-gray-500'}`}>{label}</span>
                </div>
                <div
                  className={`w-11 h-6 rounded-full p-1 transition-colors flex items-center ${
                    shareSettings[key] ? 'bg-gold-primary justify-end' : 'bg-gray-200 justify-start'
                  }`}
                >
                  <motion.div layout className="w-4 h-4 bg-white rounded-full shadow-sm" />
                </div>
              </div>
            ))}
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
                  onClick={onCopyGuestLink}
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
);

const GiftModal = ({
  open,
  onClose,
  discountCode,
  discountAmount,
  giftCodeCopied,
  onCopyDiscountCode,
  onShareDiscount,
}: {
  open: boolean;
  onClose: () => void;
  discountCode: string;
  discountAmount: string;
  giftCodeCopied: boolean;
  onCopyDiscountCode: () => void;
  onShareDiscount: (method: 'whatsapp' | 'copy') => void;
}) => (
  <AnimatePresence>
    {open && (
      <div className="fixed inset-0 z-[200] flex items-center justify-center p-4" dir="rtl">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        />
        <motion.div
          initial={{ scale: 0.94, opacity: 0, y: 16 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.94, opacity: 0, y: 16 }}
          className="bg-white rounded-3xl p-8 w-full max-w-sm relative z-10 shadow-2xl text-center"
        >
          <button onClick={onClose} className="absolute top-4 left-4 p-2 bg-gray-50 hover:bg-gray-100 rounded-full transition-colors">
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
                  <button onClick={onCopyDiscountCode} className="p-2 hover:bg-white rounded-lg transition-colors">
                    {giftCodeCopied ? <Check size={20} className="text-green-500" /> : <Copy size={20} className="text-gray-400" />}
                  </button>
                </div>
              </div>

              <div className="space-y-3">
                <button
                  onClick={() => onShareDiscount('whatsapp')}
                  className="w-full flex flex-row-reverse items-center justify-center gap-3 bg-[#25D366] hover:bg-[#20bd5a] text-white py-4 rounded-xl font-bold transition-colors"
                >
                  <WhatsAppIcon size={20} />
                  <span>שיתוף בוואטסאפ</span>
                </button>

                <button
                  onClick={() => onShareDiscount('copy')}
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
);

// The event's auto gift coupon, shown inline in the couple's slug menu.
const SlugMenuGiftCoupon = ({ eventId }: { eventId?: string }) => {
  const [coupon, setCoupon] = useState<{ code: string; discountAmount?: number; discountPercent: number } | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!eventId || eventId === '__showcase__') return;
    let cancelled = false;
    couponApi.getEventCoupon(eventId)
      .then((res) => {
        if (!cancelled && res.data && res.data.isActive) setCoupon(res.data);
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [eventId]);

  if (!coupon) return null;

  const label = coupon.discountAmount && coupon.discountAmount > 0 ? `${coupon.discountAmount}₪` : `${coupon.discountPercent}%`;
  const copy = () => {
    navigator.clipboard.writeText(coupon.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="rounded-2xl border border-gold-primary/30 bg-gold-primary/5 p-4 text-right" dir="rtl">
      <div className="flex items-center gap-2 text-black mb-1 flex-row-reverse justify-end">
        <Ticket size={22} strokeWidth={1.5} className="text-gold-primary" />
        <span className="text-lg font-semibold">קופון מתנה לחברים</span>
      </div>
      <p className="text-sm text-gray-500 mb-3">שתפו את הקוד וחברים יקבלו {label} הנחה</p>
      <button
        onClick={copy}
        className="w-full flex items-center justify-between gap-3 rounded-xl bg-white border border-gray-200 px-4 py-2.5 hover:border-gold-primary transition-colors"
      >
        <span className="font-mono font-bold tracking-wider text-black">{coupon.code}</span>
        <span className="text-xs text-gray-400">{copied ? 'הועתק!' : 'העתקה'}</span>
      </button>
    </div>
  );
};

const SideMenu = ({
  open,
  onClose,
  isShowcase,
  event,
  eventId,
  couponEventId,
  navigate,
  allowManagement = true,
}: {
  open: boolean;
  onClose: () => void;
  isShowcase: boolean;
  event: any;
  eventId?: string;
  couponEventId?: string;
  navigate: ReturnType<typeof useNavigate>;
  allowManagement?: boolean;
}) => (
  <AnimatePresence>
    {open && (
      <>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/60 z-[160] backdrop-blur-sm"
        />
        <motion.div
          initial={{ x: '100%' }}
          animate={{ x: '0%' }}
          exit={{ x: '100%' }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          className="fixed top-0 right-0 h-full w-full max-w-sm bg-white z-[170] shadow-2xl p-8 flex flex-col"
        >
          <button onClick={onClose} className="absolute top-6 right-6 p-2 text-black hover:bg-gray-100 rounded-full transition-colors">
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
                <button
                  onClick={() => {
                    const slug = event?.customSlug || event?.eventCode || eventId || 'demo';
                    navigate(ROUTES.GUEST_LANDING.replace(':eventCode', slug));
                  }}
                  className="flex items-center gap-4 text-xl font-medium text-black hover:text-gold-primary transition-colors text-right group"
                >
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
              <div className="mt-20 flex flex-col gap-8">
                <SlugMenuGiftCoupon eventId={couponEventId} />
                {allowManagement && (
                  <button onClick={() => navigate(ROUTES.UPLOAD)} className="flex items-center gap-4 text-xl font-medium text-black hover:text-gold-primary transition-colors text-right group">
                    <LayoutDashboard size={24} strokeWidth={1.5} className="text-gray-400 group-hover:text-gold-primary transition-colors" />
                    <span>ניהול האירוע</span>
                  </button>
                )}
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
                <button
                  onClick={() => {
                    const slug = event?.customSlug || event?.eventCode || eventId || 'demo';
                    navigate(ROUTES.GUEST_LANDING.replace(':eventCode', slug));
                  }}
                  className="flex items-center gap-4 text-xl font-medium text-black hover:text-gold-primary transition-colors text-right group"
                >
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
);

// Category filter as a single "עוד" dropdown, sitting alongside the existing
// filter pills. The chevron renders to the left of the label (RTL). Shows the
// active category name on the button, with a "הכל" option to clear.
const CategoryDropdown = ({
  availableCategories,
  selectedCategory,
  setSelectedCategory,
}: {
  availableCategories: string[];
  selectedCategory: string | null;
  setSelectedCategory: React.Dispatch<React.SetStateAction<string | null>>;
}) => {
  const [open, setOpen] = useState(false);
  const label = selectedCategory ? formatCategoryLabel(selectedCategory) : 'עוד';

  return (
    <div className="relative shrink-0">
      <button
        onClick={() => setOpen((prev) => !prev)}
        className={`flex items-center gap-0 md:gap-1 text-[12px] md:text-base uppercase tracking-widest transition-all whitespace-nowrap px-0 md:px-1.5 py-1 ${selectedCategory ? 'text-black font-bold' : 'text-gray-400 hover:text-black'}`}
      >
        <span className="truncate max-w-[40px] md:max-w-none">{label}</span>
        <ChevronDown size={12} className={`shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute top-full right-0 mt-2 z-50 min-w-[160px] max-h-[60vh] overflow-y-auto bg-white rounded-2xl shadow-xl border border-gray-100 py-2">
            <button
              onClick={() => { setSelectedCategory(null); setOpen(false); }}
              className={`w-full text-right px-4 py-2 text-sm transition-colors hover:bg-gray-50 ${!selectedCategory ? 'text-black font-bold' : 'text-gray-500'}`}
            >
              הכל
            </button>
            {availableCategories.map((cat) => (
              <button
                key={cat}
                onClick={() => { setSelectedCategory(cat); setOpen(false); }}
                className={`w-full text-right px-4 py-2 text-sm transition-colors hover:bg-gray-50 ${selectedCategory === cat ? 'text-black font-bold' : 'text-gray-500'}`}
              >
                {formatCategoryLabel(cat)}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

const StickyToolbar = ({
  isMobile,
  isSearchOpen,
  setIsSearchOpen,
  searchQuery,
  setSearchQuery,
  filterType,
  setFilterType,
  filterSource,
  setFilterSource,
  selectedCategory,
  setSelectedCategory,
  availableCategories,
  showFavoritesOnly,
  setShowFavoritesOnly,
  setIsSideMenuOpen,
  showMenuButton = true,
  showFavorites = true,
}: {
  isMobile: boolean;
  isSearchOpen: boolean;
  setIsSearchOpen: React.Dispatch<React.SetStateAction<boolean>>;
  searchQuery: string;
  setSearchQuery: React.Dispatch<React.SetStateAction<string>>;
  filterType: 'all' | 'photo' | 'video';
  setFilterType: React.Dispatch<React.SetStateAction<'all' | 'photo' | 'video'>>;
  filterSource: 'all' | 'guest' | 'pro';
  setFilterSource: React.Dispatch<React.SetStateAction<'all' | 'guest' | 'pro'>>;
  selectedCategory: string | null;
  setSelectedCategory: React.Dispatch<React.SetStateAction<string | null>>;
  availableCategories: string[];
  showFavoritesOnly: boolean;
  setShowFavoritesOnly: React.Dispatch<React.SetStateAction<boolean>>;
  setIsSideMenuOpen: React.Dispatch<React.SetStateAction<boolean>>;
  showMenuButton?: boolean;
  showFavorites?: boolean;
}) => (
  <div className="sticky top-0 z-40 bg-white/95 backdrop-blur-xl border-b border-gray-100 px-4 py-3 md:px-6 md:py-4">
    <div className="max-w-[1800px] mx-auto flex items-center justify-between gap-4">
      {isMobile && isSearchOpen ? (
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="flex items-center gap-3 w-full">
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
          <button
            onClick={() => {
              setIsSearchOpen(false);
              setSearchQuery('');
            }}
            className="p-2 bg-gray-100 rounded-full"
          >
            <X size={18} />
          </button>
        </motion.div>
      ) : (
        <>
          {showMenuButton && (
            <button onClick={() => setIsSideMenuOpen(true)} className="hidden md:flex p-2 -mr-2 hover:bg-gray-100 rounded-full transition-colors text-black">
              <Menu size={24} strokeWidth={1.5} />
            </button>
          )}

          <div className="flex items-center gap-0.5 md:gap-6 overflow-x-auto flex-1 scroll-smooth [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none'] mask-linear-fade mr-0.5 md:mr-0">
            {[
              { label: 'הכל', isActive: filterType === 'all' && filterSource === 'all' && !showFavoritesOnly, onClick: () => { setFilterType('all'); setFilterSource('all'); setShowFavoritesOnly(false); } },
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

          {availableCategories.length > 0 && (
            <div className="shrink-0 mr-3 md:mr-0">
              <CategoryDropdown
                availableCategories={availableCategories}
                selectedCategory={selectedCategory}
                setSelectedCategory={setSelectedCategory}
              />
            </div>
          )}

          <div className="flex items-center gap-3 md:gap-6 shrink-0 -ml-[7px]">
            {showFavorites && (
              <button
                onClick={() => setShowFavoritesOnly((prev) => !prev)}
                className={`p-2 rounded-full transition-all -translate-x-[5px] md:translate-x-0 ${showFavoritesOnly ? 'bg-red-50 text-red-500' : 'text-gray-400 hover:text-red-500 hover:bg-gray-50'}`}
              >
                <Heart size={20} className={showFavoritesOnly ? 'fill-current' : ''} />
              </button>
            )}

            <div className="hidden md:block relative w-48">
              <Search className="absolute right-0 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
              <input
                type="text"
                placeholder="חיפוש לפי שם..."
                className="w-full pr-6 py-1 bg-transparent border-b border-transparent focus:border-black transition-all outline-none text-base uppercase tracking-widest placeholder:text-gray-300 text-right"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <button className="md:hidden p-2 text-gray-400 hover:text-black transition-colors" onClick={() => setIsSearchOpen(true)}>
              <Search size={20} />
            </button>
          </div>
        </>
      )}
    </div>
  </div>
);

const StoriesRail = ({
  storyGroups,
  deletedIds,
  onOpenStory,
}: {
  storyGroups: StoryGroup[];
  deletedIds: Set<string>;
  onOpenStory: (group: StoryGroup, validItems: MediaItem[]) => void;
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);
  const startX = useRef(0);
  const scrollLeft = useRef(0);
  const hasMoved = useRef(false);

  const onPointerDown = (e: React.PointerEvent) => {
    if (!scrollRef.current) return;
    isDragging.current = true;
    hasMoved.current = false;
    startX.current = e.clientX;
    scrollLeft.current = scrollRef.current.scrollLeft;
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!isDragging.current || !scrollRef.current) return;
    const walk = (e.clientX - startX.current) * 1.6;
    if (Math.abs(walk) > 5) hasMoved.current = true;
    scrollRef.current.scrollLeft = scrollLeft.current - walk;
  };

  const onPointerUp = () => {
    isDragging.current = false;
  };

  return (
    <div
      ref={scrollRef}
      className="w-full overflow-x-auto py-6 bg-white border-b border-gray-100 cursor-grab active:cursor-grabbing [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none']"
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      onPointerLeave={onPointerUp}
    >
      <div className="flex gap-4 px-4 min-w-max">
        {storyGroups.map((group) => {
          const validItems = group.items.filter((i) => !deletedIds.has(i.id));
          if (!validItems.length) return null;

          return (
            <button
              key={group.uploaderName}
              onClick={(e) => {
                if (isDragging.current || hasMoved.current) {
                  e.preventDefault();
                  e.stopPropagation();
                  return;
                }
                onOpenStory(group, validItems);
              }}
              className="flex flex-col items-center gap-2 group w-[22vw] md:w-[8vw] flex-shrink-0 select-none"
            >
              <div className="relative p-[3px] rounded-full bg-gradient-to-tr from-[#E5B24B] via-[#FFEC1C] to-[#D6A230] group-hover:scale-105 transition-transform duration-300 shadow-md">
                <div className="bg-white p-[3px] rounded-full">
                  <img
                    src={group.avatar}
                    alt={group.uploaderName}
                    loading="lazy"
                    decoding="async"
                    width={80}
                    height={80}
                    className="w-[4.2rem] h-[4.2rem] md:w-20 md:h-20 rounded-full object-cover border border-gray-100 pointer-events-none"
                  />
                </div>
              </div>
              <span className="text-[11px] md:text-sm font-medium text-black truncate w-full text-center">{group.uploaderName}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

// ============================================================================
// MediaCard — wrapped in React.memo, prefers item.width/height to avoid setState
// ============================================================================

interface MediaCardProps {
  item: MediaItem;
  priority?: boolean;
  isFavorite: boolean;
  onOpen: (item: MediaItem) => void;
  onToggleFavorite: (id: string, e?: React.MouseEvent) => void;
}

const MediaCard = React.memo(({ item, priority = false, isFavorite, onOpen, onToggleFavorite }: MediaCardProps) => {
  // If the backend provides intrinsic dimensions, use them directly — no measurement, no setState
  const knownRatio = item.width && item.height ? item.width / item.height : null;
  const [measuredRatio, setMeasuredRatio] = useState<number | null>(null);
  const [thumbFailed, setThumbFailed] = useState(false);

  const ratio = knownRatio ?? measuredRatio;

  const handleImageLoad = useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
    if (knownRatio !== null) return; // dimensions already known, skip measurement
    const img = e.currentTarget;
    if (img.naturalWidth && img.naturalHeight) {
      setMeasuredRatio(img.naturalWidth / img.naturalHeight);
    }
  }, [knownRatio]);

  const handleVideoMeta = useCallback((e: React.SyntheticEvent<HTMLVideoElement>) => {
    if (knownRatio !== null) return;
    const v = e.currentTarget;
    if (v.videoWidth && v.videoHeight) {
      setMeasuredRatio(v.videoWidth / v.videoHeight);
    }
  }, [knownRatio]);

  const handleClick = useCallback(() => onOpen(item), [item, onOpen]);
  const handleFavoriteClick = useCallback((e: React.MouseEvent) => onToggleFavorite(item.id, e), [item.id, onToggleFavorite]);
  const loading = priority ? 'eager' : 'lazy';
  const fetchPriority = priority ? 'high' : 'auto';
  const { dataSaver } = useNetworkQuality();
  const isLandscape = item.orientation !== 'portrait';
  // On constrained mobile data, keep landscape tiles light: the small thumbnail
  // only, and if it's missing fall back to the capped display rendition rather
  // than the full-size original.
  const gridImgSrc = dataSaver && isLandscape
    ? getSafeImageSrc(item.thumbnail || item.displayUrl || item.url)
    : getSafeImageSrc(item.thumbnail || item.url);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2 }}
      onClick={handleClick}
      className="group relative overflow-hidden bg-gray-50 border-[0.5px] border-gray-100 cursor-pointer mb-[3px] break-inside-avoid"
      style={{ aspectRatio: ratio ? `${ratio}` : (item.orientation === 'portrait' ? '2 / 3' : '3 / 2') }}
    >
      {item.type === 'video' ? (
        getVideoThumb(item) && !thumbFailed ? (
          <img
            src={getVideoThumb(item)}
            alt={`Wedding Moment ${item.id}`}
            loading={loading}
            decoding="async"
            {...({ fetchpriority: fetchPriority } as any)}
            width={item.width || undefined}
            height={item.height || undefined}
            sizes="(min-width: 1024px) 25vw, (min-width: 768px) 33vw, 50vw"
            onLoad={handleImageLoad}
            onError={() => setThumbFailed(true)}
            className="w-full h-full object-cover transition-transform duration-[1.5s] ease-out group-hover:scale-105"
            style={{ imageOrientation: 'from-image' as any }}
          />
        ) : (
          <video
            src={item.url}
            preload="metadata"
            muted
            playsInline
            width={item.width || undefined}
            height={item.height || undefined}
            onLoadedMetadata={handleVideoMeta}
            className="w-full h-full object-cover bg-gradient-to-br from-gray-200 to-gray-300"
          />
        )
      ) : (
        <img
          src={gridImgSrc}
          alt={`Wedding Moment ${item.id}`}
          loading={loading}
          decoding="async"
          {...({ fetchpriority: fetchPriority } as any)}
          width={item.width || undefined}
          height={item.height || undefined}
          sizes="(min-width: 1024px) 25vw, (min-width: 768px) 33vw, 50vw"
          onLoad={handleImageLoad}
          className="w-full h-full object-cover transition-transform duration-[1.5s] ease-out group-hover:scale-105"
          style={{ imageRendering: 'high-quality' as any, imageOrientation: 'from-image' as any }}
        />
      )}

      {item.type === 'video' && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="p-3 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white">
            <Play size={20} fill="white" />
          </div>
        </div>
      )}

      {/* Only favorited photos get an interactive heart (to un-favorite). An
          un-favorited photo has no clickable heart in the grid — tapping the
          card just opens it (favoriting is done from the lightbox). */}
      {isFavorite && (
        <button onClick={handleFavoriteClick} className="absolute top-2 left-2 z-20 p-2 rounded-full hover:bg-black/10 transition-colors">
          <motion.div whileTap={{ scale: 1.2 }}>
            <Heart size={20} className="fill-red-500 text-red-500" />
          </motion.div>
        </button>
      )}

      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex flex-col justify-end p-8 pointer-events-none">
        <div className="translate-y-4 group-hover:translate-y-0 transition-transform duration-500">
          <p className="text-white text-[10px] uppercase tracking-widest font-light mb-1">{item.uploaderName}</p>
          <p className="text-white/60 text-[8px] uppercase tracking-tighter">{formatItemTime(item)}</p>
        </div>
      </div>
    </motion.div>
  );
});
MediaCard.displayName = 'MediaCard';

// ============================================================================
// GalleryGrid — removed redundant AnimatePresence (no exit anims defined on cards),
// added sentinel ref for IntersectionObserver-driven infinite scroll
// ============================================================================

const GalleryGrid = ({
  items,
  favorites,
  onOpen,
  onToggleFavorite,
  isLoadingMore,
  loadMoreError,
  onRetryLoadMore,
  hasMore,
  sentinelRef,
}: {
  items: MediaItem[];
  favorites: Set<string>;
  onOpen: (item: MediaItem) => void;
  onToggleFavorite: (id: string, e?: React.MouseEvent) => void;
  isLoadingMore: boolean;
  loadMoreError?: string | null;
  onRetryLoadMore: () => void;
  hasMore: boolean;
  sentinelRef: React.RefObject<HTMLDivElement>;
}) => (
  <main className="w-full px-[3px] py-4">
    {items.length === 0 && (
      <div className="py-20 text-center text-gray-400">
        <p>לא נמצאו תמונות</p>
      </div>
    )}

    <div className="columns-2 md:columns-3 lg:columns-4 gap-[3px] space-y-[3px] overflow-hidden">
      {items.map((item, index) => (
        <MediaCard
          key={item.id}
          item={item}
          priority={index < 8}
          isFavorite={favorites.has(item.id)}
          onOpen={onOpen}
          onToggleFavorite={onToggleFavorite}
        />
      ))}
    </div>

    {hasMore && (
      <div ref={sentinelRef} className="flex justify-center py-12 min-h-[88px]">
        {isLoadingMore && <Loader2 size={40} className="animate-spin text-gray-400" />}
        {!isLoadingMore && loadMoreError && (
          <button
            onClick={onRetryLoadMore}
            className="px-5 py-2 rounded-full border border-gray-200 bg-white text-sm font-medium text-gray-600 hover:text-black hover:border-gray-300 transition-colors"
          >
            נסה שוב
          </button>
        )}
      </div>
    )}
  </main>
);

const ShareSheet = ({
  open,
  onClose,
  onWhatsApp,
  onInstagram,
  onFacebook,
  onMore,
}: {
  open: boolean;
  onClose: () => void;
  onWhatsApp: () => void;
  onInstagram: () => void;
  onFacebook: () => void;
  onMore: () => void;
}) => (
  <AnimatePresence>
    {open && (
      <motion.div
        initial={{ opacity: 0, y: 100 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 100 }}
        className="absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl p-6 z-[200] text-center shadow-[0_-10px_40px_rgba(0,0,0,0.1)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex flex-col gap-3">
          <div className="flex justify-around mb-4">
            <button onClick={onWhatsApp} className="flex flex-col items-center gap-2">
              <div className="p-3 bg-green-100 rounded-full text-green-600">
                <WhatsAppIcon size={24} />
              </div>
              <span className="text-xs font-medium text-gray-600">WhatsApp</span>
            </button>
            <button onClick={onInstagram} className="flex flex-col items-center gap-2">
              <div className="p-3 bg-pink-100 rounded-full text-pink-600">
                <Instagram size={24} />
              </div>
              <span className="text-xs font-medium text-gray-600">Instagram</span>
            </button>
            <button onClick={onFacebook} className="flex flex-col items-center gap-2">
              <div className="p-3 bg-blue-100 rounded-full text-blue-600">
                <Facebook size={24} />
              </div>
              <span className="text-xs font-medium text-gray-600">Facebook</span>
            </button>
            <button onClick={onMore} className="flex flex-col items-center gap-2">
              <div className="p-3 bg-gray-100 rounded-full text-gray-600">
                <MoreHorizontal size={24} />
              </div>
              <span className="text-xs font-medium text-gray-600">עוד</span>
            </button>
          </div>
          <button onClick={onClose} className="w-full py-3 bg-gray-100 hover:bg-gray-200 rounded-xl font-bold transition-colors">
            ביטול
          </button>
        </div>
      </motion.div>
    )}
  </AnimatePresence>
);

const StoryMedia = ({
  item,
  paused,
  onVideoEnded,
  onVideoProgress,
}: {
  item: MediaItem;
  paused?: boolean;
  onVideoEnded: () => void;
  onVideoProgress?: (progress: number) => void;
}) => {
  const [fullLoaded, setFullLoaded] = useState(false);
  const [previewFailed, setPreviewFailed] = useState(false);
  const [displayFailed, setDisplayFailed] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const previewSrc = getSafeImageSrc(item.type === 'video' ? getVideoThumb(item) : item.thumbnail || item.url);
  const hasPreview = Boolean(previewSrc && !previewFailed);
  // Prefer the transcoded rendition; fall back to the original if it 404s
  // (not yet transcoded / legacy upload).
  const videoSrc = !displayFailed && item.displayUrl ? item.displayUrl : item.url;

  useEffect(() => {
    setFullLoaded(false);
    setPreviewFailed(false);
    setDisplayFailed(false);
  }, [item.id]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || item.type !== 'video') return;
    if (paused) {
      video.pause();
    } else {
      video.play().catch(() => {});
    }
  }, [paused, item.id, item.type]);

  const updateVideoProgress = useCallback((video: HTMLVideoElement) => {
    if (!Number.isFinite(video.duration) || video.duration <= 0) return;
    onVideoProgress?.(Math.min(100, (video.currentTime / video.duration) * 100));
  }, [onVideoProgress]);

  if (item.type === 'video') {
    return (
      <div className="relative z-10 w-full h-full">
        {!hasPreview && !fullLoaded && (
          <div className="absolute inset-0 bg-black flex items-center justify-center">
            <Loader2 size={28} className="text-white/70 animate-spin" />
          </div>
        )}
        {hasPreview && (
          <img
            key={`preview-${item.id}`}
            src={previewSrc}
            alt=""
            className={`absolute inset-0 w-full h-full object-contain shadow-[0_0_40px_rgba(0,0,0,0.5)] transition-opacity duration-500 ease-in-out ${fullLoaded ? 'opacity-0' : 'opacity-100'}`}
            loading="eager"
            decoding="async"
            onError={() => setPreviewFailed(true)}
          />
        )}
        <video
          ref={videoRef}
          key={`fg-${item.id}`}
          src={videoSrc}
          poster={previewSrc || undefined}
          className={`absolute inset-0 w-full h-full object-contain shadow-[0_0_40px_rgba(0,0,0,0.5)] transition-opacity duration-500 ease-in-out ${fullLoaded ? 'opacity-100' : 'opacity-0'}`}
          autoPlay={!paused}
          playsInline
          loop={false}
          preload="auto"
          onError={() => { if (item.displayUrl && !displayFailed) setDisplayFailed(true); }}
          onLoadedMetadata={(e) => { e.currentTarget.volume = 0.3; }}
          onLoadedData={(e) => {
            setFullLoaded(true);
            updateVideoProgress(e.currentTarget);
          }}
          onCanPlay={(e) => {
            setFullLoaded(true);
            if (!paused) e.currentTarget.play().catch(() => {});
          }}
          onPlaying={(e) => updateVideoProgress(e.currentTarget)}
          onTimeUpdate={(e) => updateVideoProgress(e.currentTarget)}
          onEnded={(e) => {
            onVideoProgress?.(100);
            onVideoEnded();
          }}
        />
      </div>
    );
  }

  return (
    <div className="relative z-10 w-full h-full">
      {previewSrc && (
        <img
          key={`preview-${item.id}`}
          src={previewSrc}
          alt=""
          className={`absolute inset-0 w-full h-full object-contain shadow-[0_0_40px_rgba(0,0,0,0.5)] transition-opacity duration-500 ease-in-out ${fullLoaded ? 'opacity-0' : 'opacity-100'}`}
          loading="eager"
          decoding="async"
        />
      )}
      <img
        key={`fg-${item.id}`}
        src={item.url}
        alt=""
        className={`absolute inset-0 w-full h-full object-contain shadow-[0_0_40px_rgba(0,0,0,0.5)] transition-opacity duration-500 ease-in-out ${fullLoaded ? 'opacity-100' : 'opacity-0'}`}
        loading="eager"
        decoding="async"
        onLoad={() => setFullLoaded(true)}
      />
    </div>
  );
};

const LightboxModal = ({
  item,
  favorites,
  fullImageLoaded,
  setFullImageLoaded,
  onClose,
  onOpenShare,
  onDownload,
  onToggleFavorite,
  onDelete,
  onNavigate,
  shareOpen,
  onCloseShare,
  onWhatsApp,
  onInstagram,
  onFacebook,
  onMore,
  onFaceClick,
  canFavorite = false,
}: {
  item: MediaItem | null;
  favorites: Set<string>;
  canFavorite?: boolean;
  fullImageLoaded: boolean;
  setFullImageLoaded: React.Dispatch<React.SetStateAction<boolean>>;
  onClose: () => void;
  onOpenShare: () => void;
  onDownload: () => void;
  onToggleFavorite: (id: string, e?: React.MouseEvent) => void;
  onDelete?: () => void;
  onNavigate: (dir: 'next' | 'prev') => void;
  shareOpen: boolean;
  onCloseShare: () => void;
  onWhatsApp: () => void;
  onInstagram: () => void;
  onFacebook: () => void;
  onMore: () => void;
  onFaceClick: (face: FaceEntry) => void;
}) => {
  const swipeHandlers = useSwipeNavigation(onNavigate);
  return (
  <AnimatePresence>
    {item && (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[180] bg-white flex flex-col" onClick={onClose}>
        {/* dir=ltr so the close X is unambiguously top-left and the actions top-right,
            regardless of the surrounding RTL context. */}
        <div dir="ltr" className="absolute top-0 left-0 right-0 z-50 p-6 flex justify-between items-start pointer-events-none">
          {/* Close — top-left */}
          <div className="flex items-center gap-3 pointer-events-auto">
            <button onClick={onClose} className="p-3 bg-gray-100 hover:bg-gray-200 rounded-full text-black transition-colors shadow-sm">
              <X size={20} />
            </button>
            {canFavorite && (
              <button onClick={(e) => onToggleFavorite(item.id, e)} className="p-3 bg-white border border-gray-100 hover:bg-gray-50 rounded-full shadow-md transition-all group">
                <Heart size={24} className={favorites.has(item.id) ? 'fill-red-500 text-red-500' : 'text-gray-400 group-hover:text-red-500'} />
              </button>
            )}
          </div>

          {/* Actions — top-right (rtl keeps the original Hebrew button layout) */}
          <div dir="rtl" className="flex items-center gap-3 pointer-events-auto">
            <button onClick={(e) => { e.stopPropagation(); onOpenShare(); }} className="flex items-center gap-2 px-5 py-3 bg-black text-white rounded-xl hover:bg-gray-800 transition-colors shadow-md group">
              <span className="hidden md:inline text-sm font-medium">שיתוף</span>
              <Share2 size={18} className="-translate-x-[3px]" />
            </button>
            <button onClick={(e) => { e.stopPropagation(); onDownload(); }} className="flex items-center gap-2 px-5 py-3 bg-gray-100 text-black rounded-xl hover:bg-gray-200 transition-colors shadow-sm group">
              <span className="hidden md:inline text-sm font-medium">הורדה</span>
              <Download size={18} />
            </button>
          </div>
        </div>

        <div className="flex-1 relative flex items-center justify-center w-full h-full overflow-hidden p-4 md:p-8" onClick={(e) => e.stopPropagation()} {...swipeHandlers}>
          <AnimatePresence mode="popLayout">
            <motion.div
              key={item.id}
              initial={{ opacity: 0, scale: 0.94 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.94 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="relative w-full h-full flex items-center justify-center"
            >
              {item.type === 'video' ? (
                <video key={`lb-${item.id}`} src={item.displayUrl || item.url} poster={getVideoThumb(item) || undefined} className="max-w-full max-h-full object-contain rounded-lg shadow-2xl" autoPlay controls playsInline loop preload="metadata" onError={(e) => { const v = e.currentTarget; if (item.displayUrl && !v.dataset.fellBack) { v.dataset.fellBack = '1'; v.src = item.url; v.load(); } }} onLoadedMetadata={(e) => { e.currentTarget.volume = 0.3; }} />
              ) : (
                // Both imgs fill the same box (absolute inset-0 w-full h-full +
                // object-contain), so the blurry thumbnail is scaled to the exact
                // display size from the start — only sharpness changes, no size
                // jump. drop-shadow on the container follows the image's edges.
                <div className="relative w-full h-full flex items-center justify-center" style={{ filter: 'drop-shadow(0 12px 32px rgba(0,0,0,0.20))' }}>
                  <img
                    src={getSafeImageSrc(item.thumbnail || item.url)}
                    className="absolute inset-0 w-full h-full object-contain"
                    style={{ imageOrientation: 'from-image' as any }}
                    alt=""
                  />
                  <img
                    src={item.displayUrl || item.url}
                    className="absolute inset-0 w-full h-full object-contain"
                    style={{ opacity: fullImageLoaded ? 1 : 0, imageOrientation: 'from-image' as any }}
                    alt=""
                    // If the display image is already cached, onLoad won't fire —
                    // mark it loaded on mount so we don't get stuck on the thumbnail.
                    ref={(node) => { if (node && node.complete && node.naturalWidth > 0) setFullImageLoaded(true); }}
                    onLoad={() => setFullImageLoaded(true)}
                    onError={(e) => {
                      // Display rendition missing (photo predates the pipeline
                      // and isn't backfilled yet) — fall back to the original.
                      if (item.displayUrl && e.currentTarget.src !== item.url) {
                        e.currentTarget.src = item.url;
                      }
                    }}
                  />
                </div>
              )}
            </motion.div>
          </AnimatePresence>

          <button onClick={(e) => { e.stopPropagation(); onNavigate('next'); }} className="absolute left-4 top-1/2 -translate-y-1/2 p-3 bg-white/80 hover:bg-white text-black rounded-full backdrop-blur-md transition-all z-50 shadow-lg">
            <ChevronLeft size={32} />
          </button>
          <button onClick={(e) => { e.stopPropagation(); onNavigate('prev'); }} className="absolute right-4 top-1/2 -translate-y-1/2 p-3 bg-white/80 hover:bg-white text-black rounded-full backdrop-blur-md transition-all z-50 shadow-lg">
            <ChevronRight size={32} />
          </button>

          {item.type === 'photo' && (item.indexedFaces?.length ?? 0) > 0 && (
            <FaceCircles
              imageUrl={item.thumbnail || item.displayUrl || item.url}
              imgWidth={item.width}
              imgHeight={item.height}
              faces={item.indexedFaces!.map((f) => ({ faceId: f.faceId, boundingBox: f.boundingBox }))}
              onFaceClick={onFaceClick}
            />
          )}
        </div>

        <div className="absolute bottom-0 left-0 right-0 z-50 p-6 flex justify-between items-end pointer-events-none">
          {/* Uploader identity: bottom-right on mobile, bottom-left on desktop
              (the desktop face circles live on the right, mobile faces bottom-left). */}
          <div className="flex flex-col items-start pointer-events-auto order-first md:order-last">
            <div className="bg-white/90 backdrop-blur-sm px-4 py-2 rounded-2xl shadow-sm border border-gray-100 text-right">
              <p className="font-bold text-sm text-black">{item.uploaderName}</p>
              <p className="text-xs text-gray-500">{formatItemTime(item)}</p>
            </div>
          </div>

          {onDelete ? (
            <div className="pointer-events-auto order-last md:order-first">
              <button onClick={(e) => { e.stopPropagation(); onDelete(); }} className="p-3 bg-white border border-red-100 text-red-500 hover:bg-red-50 rounded-full transition-colors shadow-md">
                <Trash2 size={20} />
              </button>
            </div>
          ) : (
            <div className="order-last md:order-first" aria-hidden />
          )}
        </div>

        <ShareSheet open={shareOpen} onClose={onCloseShare} onWhatsApp={onWhatsApp} onInstagram={onInstagram} onFacebook={onFacebook} onMore={onMore} />
      </motion.div>
    )}
  </AnimatePresence>
  );
};

// ============================================================================
// StoryViewerModal — progress bar uses ref-based DOM update (no 60fps re-renders).
// Past bars: 100%. Future bars: 0%. Active bar: width set imperatively via activeBarRef.
// ============================================================================

const STORY_PROGRESS_MIN_WIDTH = '2px';
const STORY_PROGRESS_MAX_SEGMENTS = 12;

const StoryViewerModal = ({
  group,
  storyGroups,
  deletedIds,
  activeIndex,
  paused,
  direction,
  favorites,
  shareOpen,
  activeBarRef,
  onClose,
  onTogglePause,
  onNavigateSlide,
  onNavigateGroup,
  onOpenShare,
  onCloseShare,
  onDelete,
  onDownload,
  onToggleFavorite,
  onWhatsApp,
  onInstagram,
  onFacebook,
  onMore,
  onDragEnd,
  onPressDown,
  onPressUp,
  onVideoProgress,
}: {
  group: StoryGroup | null;
  storyGroups: StoryGroup[];
  deletedIds: Set<string>;
  activeIndex: number;
  paused: boolean;
  direction: number;
  favorites: Set<string>;
  shareOpen: boolean;
  activeBarRef: React.RefObject<HTMLDivElement>;
  onClose: () => void;
  onTogglePause: () => void;
  onNavigateSlide: (dir: 'next' | 'prev') => void;
  onNavigateGroup: (dir: 'next' | 'prev') => void;
  onOpenShare: () => void;
  onCloseShare: () => void;
  onDelete?: () => void;
  onDownload: () => void;
  onToggleFavorite: (id: string, e?: React.MouseEvent) => void;
  onWhatsApp: () => void;
  onInstagram: () => void;
  onFacebook: () => void;
  onMore: () => void;
  onDragEnd: (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => void;
  onPressDown: () => void;
  onPressUp: () => void;
  onVideoProgress?: (progress: number) => void;
}) => {
  const item = getCurrentStoryItem(group, activeIndex);
  const storyItemCount = group?.items.length ?? 0;
  const useCompactProgress = storyItemCount > STORY_PROGRESS_MAX_SEGMENTS;
  const progressItems = item
    ? useCompactProgress || storyItemCount === 0
      ? [item]
      : group?.items ?? [item]
    : [];
  const progressActiveIndex = useCompactProgress ? 0 : activeIndex;
  const compactProgressWidth = `${Math.max(
    0.6,
    (Math.max(activeIndex, 0) / Math.max(storyItemCount, 1)) * 100
  )}%`;

  const currentGroupIndex = group ? storyGroups.findIndex((g) => g.uploaderName === group.uploaderName) : -1;
  const prevGroup = currentGroupIndex > 0 ? storyGroups[currentGroupIndex - 1] : null;
  const nextGroup = currentGroupIndex >= 0 && currentGroupIndex < storyGroups.length - 1 ? storyGroups[currentGroupIndex + 1] : null;

  // Warm the next slide's video so advancing is instant. Only one clip ahead,
  // low priority, so it barely competes with the one that's playing.
  const nextStoryItem = group
    ? (activeIndex < group.items.length - 1 ? group.items[activeIndex + 1] : nextGroup?.items?.[0] ?? null)
    : null;
  const prefetchVideoUrl = nextStoryItem && nextStoryItem.type === 'video'
    ? (nextStoryItem.displayUrl || nextStoryItem.url)
    : null;

  // Skip warming the next clip on Data Saver / slow connections so we don't
  // burn cellular data on a video the viewer may never reach.
  const { dataSaver } = useNetworkQuality();
  useEffect(() => {
    if (!prefetchVideoUrl || dataSaver) return;
    const link = document.createElement('link');
    link.rel = 'prefetch';
    link.href = prefetchVideoUrl;
    document.head.appendChild(link);
    return () => { link.parentNode?.removeChild(link); };
  }, [prefetchVideoUrl, dataSaver]);

  void favorites;
  void deletedIds;

  const blurSrc = item ? (item.thumbnail || item.url) : '';

  return (
    <AnimatePresence>
      {group && item && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[150] bg-black/90 flex items-center justify-center overflow-hidden"
          dir="rtl"
        >
          <div
            className="hidden md:flex absolute right-[10%] z-10 items-center justify-center h-[60vh] aspect-[9/16] cursor-pointer group"
            onClick={() => onNavigateGroup('prev')}
          >
            {prevGroup && (
              <div className="relative w-full h-full rounded-xl overflow-hidden transform scale-75 opacity-40 group-hover:opacity-80 group-hover:scale-85 transition-all duration-300 ease-out border border-white/10 shadow-2xl">
                <img src={(prevGroup.items[0]?.type === 'video' ? prevGroup.items[0]?.poster : prevGroup.items[0]?.thumbnail) || prevGroup.avatar} className="w-full h-full object-cover grayscale-[30%]" alt="" loading="lazy" decoding="async" />
                <div className="absolute inset-0 bg-black/60" />
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
                  <div className="w-16 h-16 rounded-full p-[2px] bg-gradient-to-tr from-gold-primary to-orange-500 shadow-lg ring-4 ring-black/50">
                    <img src={prevGroup.avatar} className="w-full h-full rounded-full object-cover border-2 border-black" alt="" loading="lazy" decoding="async" />
                  </div>
                  <span className="text-white font-bold text-lg drop-shadow-md tracking-wide">{prevGroup.uploaderName}</span>
                </div>
              </div>
            )}
          </div>

          {prevGroup && (
            <button
              onClick={() => onNavigateGroup('prev')}
              className="hidden md:flex absolute right-4 z-50 p-4 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all backdrop-blur-md shadow-lg border border-white/5"
            >
              <ChevronRight size={32} />
            </button>
          )}

          <div
            className="hidden md:flex absolute left-[10%] z-10 items-center justify-center h-[60vh] aspect-[9/16] cursor-pointer group"
            onClick={() => onNavigateGroup('next')}
          >
            {nextGroup && (
              <div className="relative w-full h-full rounded-xl overflow-hidden transform scale-75 opacity-40 group-hover:opacity-80 group-hover:scale-85 transition-all duration-300 ease-out border border-white/10 shadow-2xl">
                <img src={(nextGroup.items[0]?.type === 'video' ? nextGroup.items[0]?.poster : nextGroup.items[0]?.thumbnail) || nextGroup.avatar} className="w-full h-full object-cover grayscale-[30%]" alt="" loading="lazy" decoding="async" />
                <div className="absolute inset-0 bg-black/60" />
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
                  <div className="w-16 h-16 rounded-full p-[2px] bg-gradient-to-tr from-gold-primary to-orange-500 shadow-lg ring-4 ring-black/50">
                    <img src={nextGroup.avatar} className="w-full h-full rounded-full object-cover border-2 border-black" alt="" loading="lazy" decoding="async" />
                  </div>
                  <span className="text-white font-bold text-lg drop-shadow-md tracking-wide">{nextGroup.uploaderName}</span>
                </div>
              </div>
            )}
          </div>

          {nextGroup && (
            <button
              onClick={() => onNavigateGroup('next')}
              className="hidden md:flex absolute left-4 z-50 p-4 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all backdrop-blur-md shadow-lg border border-white/5"
            >
              <ChevronLeft size={32} />
            </button>
          )}

          <div className="relative w-full h-full flex items-center justify-center z-20 pointer-events-none" style={{ perspective: '1000px' }}>
            <AnimatePresence initial={false} custom={direction} mode="popLayout">
              <motion.div
                key={group.uploaderName}
                custom={direction}
                variants={cubeVariants}
                initial="enter"
                animate="center"
                exit="exit"
                drag="x"
                dragConstraints={{ left: 0, right: 0 }}
                dragElastic={0.2}
                onDragEnd={onDragEnd}
                className="absolute w-full h-full flex items-center justify-center pointer-events-none"
              >
                <div className="relative w-full h-full md:w-[45vh] md:aspect-[9/16] bg-black md:rounded-2xl overflow-hidden flex flex-col pointer-events-auto shadow-[0_0_50px_rgba(0,0,0,0.7)] border-0 md:border md:border-white/10">
                  <div className="absolute top-0 left-0 right-0 z-50 p-4 bg-gradient-to-b from-black/60 to-transparent">
                    <div className="flex gap-1 mb-3 drop-shadow-[0_1px_2px_rgba(0,0,0,0.55)]">
                      {progressItems.map((_, idx) => (
                        <div key={idx} className="h-[3px] flex-1 bg-white/40 rounded-full overflow-hidden">
                          <div
                            ref={idx === progressActiveIndex ? activeBarRef : undefined}
                            className="h-full bg-white rounded-full shadow-[0_0_6px_rgba(255,255,255,0.55)]"
                            style={{
                              width: useCompactProgress
                                ? compactProgressWidth
                                : idx < activeIndex
                                  ? '100%'
                                  : idx === progressActiveIndex
                                    ? STORY_PROGRESS_MIN_WIDTH
                                    : '0%',
                            }}
                          />
                        </div>
                      ))}
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <img src={group.avatar} className="w-8 h-8 rounded-full border border-white/50" alt={group.uploaderName} loading="lazy" decoding="async" />
                        <span className="text-white font-bold text-sm">{group.uploaderName}</span>
                        <span className="text-white/60 text-xs">{formatItemTime(item)}</span>
                      </div>
                      <div className="flex items-center gap-4">
                        <button onClick={onTogglePause} className="text-white/80">
                          {paused ? <Play size={16} fill="currentColor" /> : <Pause size={16} fill="currentColor" />}
                        </button>
                        <button onClick={onClose} className="text-white">
                          <X size={24} />
                        </button>
                      </div>
                    </div>
                  </div>

                  <div
                    className="flex-grow relative flex items-center justify-center bg-black overflow-hidden"
                    onMouseDown={onPressDown}
                    onMouseUp={onPressUp}
                    onTouchStart={onPressDown}
                    onTouchEnd={onPressUp}
                  >
                    <div className="absolute inset-0 z-0 bg-neutral-900">
                      <img
                        key={`bg-${item.id}`}
                        src={blurSrc}
                        className="w-full h-full object-cover blur-[20px] scale-110 brightness-75 opacity-60"
                        alt=""
                        loading="eager"
                        decoding="async"
                      />
                    </div>

                    <div className="absolute inset-0 flex z-20">
                      <div
                        className="w-1/3 h-full"
                        onClick={(e) => {
                          e.stopPropagation();
                          onNavigateSlide('prev');
                        }}
                      />
                      <div
                        className="w-2/3 h-full"
                        onClick={(e) => {
                          e.stopPropagation();
                          onNavigateSlide('next');
                        }}
                      />
                    </div>

                    <StoryMedia item={item} paused={paused} onVideoEnded={() => onNavigateSlide('next')} onVideoProgress={onVideoProgress} />
                  </div>

                  <div className="absolute bottom-0 left-0 right-0 z-30 px-6 pb-[27px] pt-20 flex items-center justify-between bg-gradient-to-t from-black/80 to-transparent pointer-events-none">
                    <div className="relative pointer-events-auto">
                      <AnimatePresence>
                        {shareOpen && (
                          <motion.div
                            initial={{ opacity: 0, y: 10, scale: 0.9, x: '-50%' }}
                            animate={{ opacity: 1, y: 0, scale: 1, x: '-50%' }}
                            exit={{ opacity: 0, y: 10, scale: 0.9, x: '-50%' }}
                            className="absolute bottom-full left-1/2 mb-4 bg-white/20 backdrop-blur-md border border-white/20 rounded-2xl p-3 flex flex-col gap-3 min-w-[50px] shadow-lg"
                          >
                            <button onClick={onInstagram} className="p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors">
                              <Instagram size={20} className="text-white" />
                            </button>
                            <button onClick={onWhatsApp} className="p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors">
                              <WhatsAppIcon size={20} className="text-white" />
                            </button>
                            <button onClick={onFacebook} className="p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors">
                              <Facebook size={20} className="text-white" />
                            </button>
                            <button onClick={onMore} className="p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors">
                              <MoreHorizontal size={20} className="text-white" />
                            </button>
                            <div className="h-px bg-white/20 w-full my-1" />
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onDownload();
                                onCloseShare();
                              }}
                              className="p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors"
                            >
                              <Download size={20} className="text-white" />
                            </button>
                          </motion.div>
                        )}
                      </AnimatePresence>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          shareOpen ? onCloseShare() : onOpenShare();
                        }}
                        className="p-3 bg-black/20 hover:bg-black/40 backdrop-blur-md rounded-full text-white transition-colors border border-white/10 flex items-center justify-center"
                      >
                        <Send size={20} className="pr-[2px] pt-[2px]" />
                      </button>
                    </div>

                    {onDelete && (
                      <div className="pointer-events-auto flex gap-3">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onDelete();
                          }}
                          className="p-3 bg-black/20 hover:bg-black/40 backdrop-blur-md rounded-full text-white transition-colors border border-white/10"
                        >
                          <Trash2 size={20} />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// ============================================================================
// Gallery — main component
// ============================================================================

const Gallery: React.FC<GalleryPageProps> = ({
  coupleName: propCoupleName,
  isOwner = false,
  guestLink,
  isShowcase = false,
}) => {
  const navigate = useNavigate();
  const { eventId, eventCode } = useParams();
  const { currentEvent, user, token } = useUserStore();

  const [resolvedEventId, setResolvedEventId] = useState<string | undefined>(undefined);
  const [prefetchedEvent, setPrefetchedEvent] = useState<any | null>(null);
  const [eventCodeError, setEventCodeError] = useState<string | null>(null);

  const [showcaseImageUrls, setShowcaseImageUrls] = useState<string[]>([]);
  const [showcaseLoading, setShowcaseLoading] = useState(false);
  const [allStoryItems, setAllStoryItems] = useState<MediaItem[]>([]);

  const [filterType, setFilterType] = useState<'all' | 'photo' | 'video'>('all');
  const [filterSource, setFilterSource] = useState<'all' | 'guest' | 'pro'>('all');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMedia, setSelectedMedia] = useState<MediaItem | null>(null);
  // Face gallery opened from a face circle in the lightbox. Kept as an overlay
  // above the lightbox so the open photo + grid scroll underneath are preserved.
  const [faceView, setFaceView] = useState<{ face: FaceEntry; imageUrl: string; imgW?: number; imgH?: number } | null>(null);

  // Phone back button closes the face gallery (returns to the open photo) instead
  // of leaving the site — push a history entry on open, pop it on close.
  useEffect(() => {
    if (!faceView) return;
    window.history.pushState({ faceGallery: true }, '');
    const handlePopState = () => setFaceView(null);
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [faceView !== null]);
  const [fullImageLoaded, setFullImageLoaded] = useState(false);
  const [isShareMenuOpen, setIsShareMenuOpen] = useState(false);
  const [isStoryShareOpen, setIsStoryShareOpen] = useState(false);
  const [isPreparingShare, setIsPreparingShare] = useState(false);

  // Initialize from window synchronously to avoid mobile→desktop flicker on first paint
  const [isMobile, setIsMobile] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.innerWidth < 768;
  });

  const [deletedIds, setDeletedIds] = useState<Set<string>>(new Set());
  const [favorites, setFavorites] = useState<Set<string>>(new Set());

  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<'lightbox' | 'story' | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [isGiftModalOpen, setIsGiftModalOpen] = useState(false);
  const [giftCodeCopied, setGiftCodeCopied] = useState(false);
  const [discountCode, setDiscountCode] = useState('');
  const [discountAmount, setDiscountAmount] = useState('');

  const [activeStoryGroup, setActiveStoryGroup] = useState<StoryGroup | null>(null);
  const [activeStoryIndex, setActiveStoryIndex] = useState(0);
  const [isStoryPaused, setIsStoryPaused] = useState(false);
  const [direction, setDirection] = useState(0);

  // Story progress: held in a ref, written to DOM by the rAF tick. No setState on every frame.
  const activeBarRef = useRef<HTMLDivElement>(null);

  const getStoryProgressWidth = useCallback((slidePct = 0) => {
    if (!activeStoryGroup || activeStoryGroup.items.length <= STORY_PROGRESS_MAX_SEGMENTS) {
      return slidePct < 1 ? STORY_PROGRESS_MIN_WIDTH : `${slidePct}%`;
    }

    const itemCount = Math.max(activeStoryGroup.items.length, 1);
    const overallPct = ((activeStoryIndex + slidePct / 100) / itemCount) * 100;
    return `${Math.max(0.6, overallPct)}%`;
  }, [activeStoryGroup, activeStoryIndex]);

  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isSideMenuOpen, setIsSideMenuOpen] = useState(false);
  const [showMobileMenuTrigger, setShowMobileMenuTrigger] = useState(false);
  const [showDesktopMenuTrigger, setShowDesktopMenuTrigger] = useState(false);

  const [isShareSettingsOpen, setIsShareSettingsOpen] = useState(false);
  const [shareSettings, setShareSettings] = useState({
    pro: true,
    guests: true,
    stories: true,
  });
  const [shareSettingsSynced, setShareSettingsSynced] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);

  // Sentinel for IntersectionObserver-driven infinite scroll
  const sentinelRef = useRef<HTMLDivElement>(null);
  const heroCollageItemsRef = useRef<MediaItem[]>([]);
  const heroCollageKeyRef = useRef('');

  useEffect(() => {
    if (isShowcase) {
      setResolvedEventId('__showcase__');
      return;
    }

    if (eventCode) {
      setEventCodeError(null);
      eventsApi
        .getByCodeOrSlug(eventCode)
        .then((response) => {
          if (response.data?._id) {
            setResolvedEventId(response.data._id);
            setPrefetchedEvent(response.data);
          } else {
            setEventCodeError('אירוע לא נמצא');
          }
        })
        .catch(() => setEventCodeError('שגיאה בטעינת האירוע'));
    } else if (currentEvent) {
      setResolvedEventId((currentEvent as any)._id || (currentEvent as any).id);
    } else if (eventId) {
      setResolvedEventId(eventId);
    }
  }, [eventCode, currentEvent, eventId, isShowcase]);

  // Showcase preload — use link rel="preload" only (no duplicate Image() requests)
  useEffect(() => {
    if (!isShowcase) return;

    let cancelled = false;
    const preloadLinks: HTMLLinkElement[] = [];

    setShowcaseLoading(true);
    galleryApi
      .getShowcaseImages()
      .then((response: any) => {
        if (cancelled) return;
        const urls = response.data || [];
        setShowcaseImageUrls(urls);

        // Single preload mechanism — browser will fetch with high priority
        urls.slice(0, 20).forEach((url: string) => {
          const link = document.createElement('link');
          link.rel = 'preload';
          link.as = 'image';
          link.href = url;
          link.fetchPriority = 'high' as any;
          document.head.appendChild(link);
          preloadLinks.push(link);
        });
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setShowcaseLoading(false);
      });

    return () => {
      cancelled = true;
      preloadLinks.forEach((link) => link.parentNode?.removeChild(link));
    };
  }, [isShowcase]);

  const sampleMediaItems = useMemo(
    () => (isShowcase ? createSampleMediaItems(showcaseImageUrls) : []),
    [isShowcase, showcaseImageUrls]
  );

  const shuffleSeed = useMemo<string | undefined>(() => {
    if (isShowcase) return undefined;
    if (!eventCode) return undefined;
    if (typeof window === 'undefined') return undefined;
    const key = `mynight_shuffle_${eventCode}`;
    let s = window.sessionStorage.getItem(key);
    if (!s) {
      s = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
      try { window.sessionStorage.setItem(key, s); } catch {}
    }
    return s;
  }, [isShowcase, eventCode]);

  const galleryData = useGalleryData(resolvedEventId, prefetchedEvent, shuffleSeed);
  const event = isShowcase ? null : galleryData.event;
  const mediaItems = isShowcase ? sampleMediaItems : galleryData.mediaItems;
  const isLoading = eventCodeError ? false : isShowcase ? showcaseLoading : galleryData.isLoading;
  const error = eventCodeError || (isShowcase ? null : galleryData.error);
  const deletePhoto = galleryData.deletePhoto;

  useEffect(() => {
    if (isShowcase) return;
    if (!resolvedEventId || resolvedEventId === '__showcase__') return;
    if (galleryData.isLoading) return;

    let cancelled = false;
    let timeoutId: number | undefined;
    const requestIdle =
      typeof window !== 'undefined' && 'requestIdleCallback' in window
        ? (window as any).requestIdleCallback
        : null;
    const cancelIdle =
      typeof window !== 'undefined' && 'cancelIdleCallback' in window
        ? (window as any).cancelIdleCallback
        : null;
    let idleId: number | undefined;

    const loadStories = () => {
      if (cancelled) return;
      galleryApi
        .getEventStoryGroups(resolvedEventId)
        .then((response: any) => {
          if (cancelled) return;
          const groupsResp: any[] = response?.data || [];
          const flat: MediaItem[] = groupsResp.flatMap((g: any) =>
            (g.items || []).map((photo: any) => ({
              id: photo._id,
              type: photo.metadata?.mimeType?.startsWith('video/') ? 'video' : 'photo',
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
                photo.metadata?.width && photo.metadata?.height
                  ? photo.metadata.height > photo.metadata.width
                    ? 'portrait'
                    : 'landscape'
                  : 'landscape',
              width: photo.metadata?.width,
              height: photo.metadata?.height,
            }))
          );
          setAllStoryItems(flat);
        })
        .catch(() => {});
    };

    if (requestIdle) {
      idleId = requestIdle(loadStories, { timeout: 1800 });
    } else {
      timeoutId = window.setTimeout(loadStories, 700);
    }

    return () => {
      cancelled = true;
      if (idleId !== undefined && cancelIdle) cancelIdle(idleId);
      if (timeoutId !== undefined) window.clearTimeout(timeoutId);
    };
  }, [isShowcase, resolvedEventId, galleryData.isLoading]);

  const coupleName = isShowcase ? 'נועה ואיתי' : event?.name || propCoupleName || 'נועה ואיתי';

  const isOwnerView = useMemo(() => {
    if (isShowcase) return false;
    if (!token) return false;
    if (!eventCode) return true;
    if (!event) return false;
    const ownerId = (event as any).userId ?? (event as any).user?._id ?? (event as any).user;
    const myId = user?.id ?? (user as any)?._id;
    if (myId && ownerId && String(myId) === String(ownerId)) return true;
    if (currentEvent && (event as any)._id && String((currentEvent as any)._id) === String((event as any)._id)) return true;
    return false;
  }, [isShowcase, token, eventCode, event, user, currentEvent]);

  const effectiveShareSettings = useMemo(
    () => (isOwnerView ? { pro: true, guests: true, stories: true } : shareSettings),
    [isOwnerView, shareSettings]
  );

  useEffect(() => {
    if (shareSettingsSynced || isShowcase) return;
    const perms = (event as any)?.sharingPermissions;
    if (!perms) return;
    setShareSettings({
      pro: perms.showProPhotos ?? true,
      guests: perms.showGuestPhotos ?? true,
      stories: perms.showGuestStories ?? true,
    });
    setShareSettingsSynced(true);
  }, [event, isShowcase, shareSettingsSynced]);

  const [name1, name2] = useMemo(() => {
    const separator = ' ו';
    if (coupleName.includes(separator)) return coupleName.split(separator);
    return [coupleName, ''];
  }, [coupleName]);

  useEffect(() => {
    if (selectedMedia || activeStoryGroup || isShareSettingsOpen) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [selectedMedia, activeStoryGroup, isShareSettingsOpen]);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Scroll handler — only for menu trigger states; bottom-detect moved to IntersectionObserver
  useEffect(() => {
    let rafId: number | null = null;
    let ticking = false;

    const update = () => {
      ticking = false;

      const scrollY = window.scrollY;
      const windowHeight = window.innerHeight;
      const nextMobile = window.innerWidth < 768 && scrollY > windowHeight * 0.3;
      const nextDesktop = window.innerWidth >= 768 && scrollY > windowHeight * 0.15 && scrollY < windowHeight - 120;

      setShowMobileMenuTrigger((prev) => (prev === nextMobile ? prev : nextMobile));
      setShowDesktopMenuTrigger((prev) => (prev === nextDesktop ? prev : nextDesktop));
    };

    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      rafId = requestAnimationFrame(update);
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    update();

    return () => {
      window.removeEventListener('scroll', onScroll);
      if (rafId !== null) cancelAnimationFrame(rafId);
    };
  }, []);

  // IntersectionObserver-driven infinite scroll — no document.body layout reads
  useEffect(() => {
    if (isShowcase) return;
    if (!galleryData.hasMore) return;

    const node = sentinelRef.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry.isIntersecting && galleryData.hasMore && !galleryData.isLoadingMore) {
          galleryData.loadMore();
        }
      },
      { rootMargin: '600px 0px 600px 0px' }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [isShowcase, galleryData.hasMore, galleryData.isLoadingMore, galleryData.loadMore, mediaItems.length]);

  const storyGroups = useMemo<StoryGroup[]>(() => {
    const sourceItems = !isShowcase && allStoryItems.length > 0 ? allStoryItems : mediaItems;
    if (!sourceItems.length) return [];

    const filteredForStories = sourceItems.filter((item) => {
      if (item.source === 'pro' && !effectiveShareSettings.pro) return false;
      if (item.source === 'guest' && !effectiveShareSettings.guests) return false;
      if (item.source === 'guest' && !effectiveShareSettings.stories) return false;
      return true;
    });

    if (!filteredForStories.length) return [];

    const groups = new Map<string, MediaItem[]>();

    for (const item of filteredForStories) {
      const arr = groups.get(item.uploaderName);
      if (arr) arr.push(item);
      else groups.set(item.uploaderName, [item]);
    }

    const getPreviewSrc = (item?: MediaItem): string => {
      if (!item) return '';
      if (item.type === 'video') return item.poster || item.thumbnail || '';
      return item.thumbnail || item.url || '';
    };

    const list: StoryGroup[] = Array.from(groups.entries()).map(([uploaderName, items]) => {
      const sortedItems = [...items].sort((a, b) => getItemTime(b) - getItemTime(a));
      const firstPhoto = sortedItems.find((i) => i.type === 'photo');
      const firstVideoWithPoster = sortedItems.find((i) => i.type === 'video' && i.poster);
      const avatarSource = firstPhoto ?? firstVideoWithPoster ?? sortedItems[0];
      return {
        uploaderName,
        items: sortedItems,
        avatar: getSafeImageSrc(getPreviewSrc(avatarSource)),
      };
    });

    list.sort((a, b) => getItemTime(b.items[0]) - getItemTime(a.items[0]));
    return list;
  }, [isShowcase, allStoryItems, mediaItems, effectiveShareSettings]);

  const filteredMedia = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();

    return mediaItems
      .filter((item) => {
        if (deletedIds.has(item.id)) return false;
        if (item.source === 'pro' && !effectiveShareSettings.pro) return false;
        if (item.source === 'guest' && !effectiveShareSettings.guests) return false;

        if (filterType !== 'all' && item.type !== filterType) return false;
        if (filterSource !== 'all' && item.source !== filterSource) return false;
        if (selectedCategory && item.category !== selectedCategory) return false;
        if (showFavoritesOnly && !favorites.has(item.id)) return false;
        if (q !== '' && !(item.uploaderName?.toLowerCase().includes(q) ?? false)) return false;

        return true;
      })
      .sort((a, b) => getItemTime(b) - getItemTime(a));
  }, [mediaItems, filterType, filterSource, selectedCategory, searchQuery, deletedIds, showFavoritesOnly, favorites, effectiveShareSettings]);

  // Categories present among the event's photos. Prefer the complete flat list
  // (allStoryItems, loaded unpaginated) so every category shows even before its
  // photos have been paged into the grid, falling back to the loaded page while
  // it warms up — the same source-selection storyGroups uses. Uncategorized
  // photos (category null) are excluded so they only surface under the "all"
  // view. Sorted alphabetically for a stable chip order.
  const availableCategories = useMemo(() => {
    const source = !isShowcase && allStoryItems.length > 0 ? allStoryItems : mediaItems;
    const seen = new Set<string>();
    for (const item of source) {
      if (deletedIds.has(item.id)) continue;
      if (item.source === 'pro' && !effectiveShareSettings.pro) continue;
      if (item.source === 'guest' && !effectiveShareSettings.guests) continue;
      if (item.category) seen.add(item.category);
    }
    return Array.from(seen).sort((a, b) => a.localeCompare(b, 'he'));
  }, [isShowcase, allStoryItems, mediaItems, deletedIds, effectiveShareSettings]);

  // If the active category disappears (e.g. share settings changed), fall back to all.
  useEffect(() => {
    if (selectedCategory && !availableCategories.includes(selectedCategory)) {
      setSelectedCategory(null);
    }
  }, [availableCategories, selectedCategory]);

  useEffect(() => {
    if (!filteredMedia.length) return;

    const preloadLinks: HTMLLinkElement[] = [];
    filteredMedia.slice(0, 10).forEach((item) => {
      const href = item.type === 'video' ? getVideoThumb(item) : getSafeImageSrc(item.thumbnail || item.url);
      if (!href) return;

      const link = document.createElement('link');
      link.rel = 'preload';
      link.as = 'image';
      link.href = href;
      link.fetchPriority = 'high' as any;
      document.head.appendChild(link);
      preloadLinks.push(link);
    });

    return () => {
      preloadLinks.forEach((link) => link.parentNode?.removeChild(link));
    };
  }, [filteredMedia]);

  const filteredCollageItems = useMemo(() => {
    if (!effectiveShareSettings.pro && !effectiveShareSettings.guests && !effectiveShareSettings.stories) return [];
    return mediaItems.filter((item: MediaItem) => {
      if (item.type !== 'photo' || !item.url) return false;
      if (item.source === 'pro' && !effectiveShareSettings.pro) return false;
      if (item.source === 'guest' && !effectiveShareSettings.guests) return false;
      return true;
    });
  }, [mediaItems, effectiveShareSettings]);

  const collagePermissionKey = `${effectiveShareSettings.pro ? '1' : '0'}${effectiveShareSettings.guests ? '1' : '0'}${effectiveShareSettings.stories ? '1' : '0'}`;
  const collageIdentityKey = `${resolvedEventId || 'showcase'}:${collagePermissionKey}`;

  const collageItems = useMemo(() => {
    if (heroCollageKeyRef.current !== collageIdentityKey) {
      heroCollageKeyRef.current = collageIdentityKey;
      heroCollageItemsRef.current = [];
    }

    if (!filteredCollageItems.length) return [];

    if (heroCollageItemsRef.current.length === 0) {
      heroCollageItemsRef.current = filteredCollageItems.slice(0, 50);
    }

    return heroCollageItemsRef.current;
  }, [filteredCollageItems, collageIdentityKey]);

  const openLightbox = useCallback((item: MediaItem) => {
    setSelectedMedia(item);
    setFullImageLoaded(false);
    setIsShareMenuOpen(false);
    setIsDeleteConfirmOpen(false);
  }, []);

  const closeLightbox = useCallback(() => {
    setSelectedMedia(null);
    setFullImageLoaded(false);
    setIsShareMenuOpen(false);
    setIsDeleteConfirmOpen(false);
  }, []);

  const openStory = useCallback((group: StoryGroup, validItems: MediaItem[]) => {
    setActiveStoryGroup({ ...group, items: validItems });
    setActiveStoryIndex(0);
    setIsStoryPaused(false);
    setIsStoryShareOpen(false);
    // Reset bar width imperatively
    if (activeBarRef.current) activeBarRef.current.style.width = getStoryProgressWidth(0);
  }, []);

  const closeStory = useCallback(() => {
    setActiveStoryGroup(null);
    setActiveStoryIndex(0);
    setIsStoryPaused(false);
    setIsStoryShareOpen(false);
  }, []);

  const jumpToNextGroup = useCallback(() => {
    if (!activeStoryGroup) return;
    const currentGroupIndex = storyGroups.findIndex((g) => g.uploaderName === activeStoryGroup.uploaderName);

    if (currentGroupIndex !== -1 && currentGroupIndex < storyGroups.length - 1) {
      setDirection(1);
      const nextGroup = storyGroups[currentGroupIndex + 1];
      const validItems = nextGroup.items.filter((i) => !deletedIds.has(i.id));
      if (validItems.length > 0) {
        setActiveStoryGroup({ ...nextGroup, items: validItems });
        setActiveStoryIndex(0);
        setIsStoryShareOpen(false);
        if (activeBarRef.current) activeBarRef.current.style.width = STORY_PROGRESS_MIN_WIDTH;
      } else {
        closeStory();
      }
    } else {
      closeStory();
    }
  }, [activeStoryGroup, storyGroups, deletedIds, closeStory]);

  const jumpToPrevGroup = useCallback(() => {
    if (!activeStoryGroup) return;
    const currentGroupIndex = storyGroups.findIndex((g) => g.uploaderName === activeStoryGroup.uploaderName);

    if (currentGroupIndex > 0) {
      setDirection(-1);
      const prevGroup = storyGroups[currentGroupIndex - 1];
      const validItems = prevGroup.items.filter((i) => !deletedIds.has(i.id));
      if (validItems.length > 0) {
        setActiveStoryGroup({ ...prevGroup, items: validItems });
        setActiveStoryIndex(0);
        setIsStoryShareOpen(false);
        if (activeBarRef.current) activeBarRef.current.style.width = STORY_PROGRESS_MIN_WIDTH;
      }
    }
  }, [activeStoryGroup, storyGroups, deletedIds]);

  const handleNextStorySlide = useCallback(() => {
    if (!activeStoryGroup) return;
    if (activeStoryIndex < activeStoryGroup.items.length - 1) {
      setActiveStoryIndex((prev) => prev + 1);
      setIsStoryShareOpen(false);
      if (activeBarRef.current) activeBarRef.current.style.width = STORY_PROGRESS_MIN_WIDTH;
    } else {
      jumpToNextGroup();
    }
  }, [activeStoryGroup, activeStoryIndex, jumpToNextGroup]);

  const handlePrevStorySlide = useCallback(() => {
    if (!activeStoryGroup) return;

    if (activeStoryIndex > 0) {
      setActiveStoryIndex((prev) => prev - 1);
      setIsStoryShareOpen(false);
      if (activeBarRef.current) activeBarRef.current.style.width = STORY_PROGRESS_MIN_WIDTH;
      return;
    }

    const currentGroupIndex = storyGroups.findIndex((g) => g.uploaderName === activeStoryGroup.uploaderName);
    if (currentGroupIndex > 0) {
      setDirection(-1);
      const prevGroup = storyGroups[currentGroupIndex - 1];
      const validItems = prevGroup.items.filter((i) => !deletedIds.has(i.id));
      if (validItems.length > 0) {
        setActiveStoryGroup({ ...prevGroup, items: validItems });
        setActiveStoryIndex(validItems.length - 1);
        setIsStoryShareOpen(false);
        if (activeBarRef.current) activeBarRef.current.style.width = STORY_PROGRESS_MIN_WIDTH;
      } else {
        closeStory();
      }
    }
  }, [activeStoryGroup, activeStoryIndex, storyGroups, deletedIds, closeStory]);

  const handleStoryVideoProgress = useCallback((progress: number) => {
    if (activeBarRef.current) {
      activeBarRef.current.style.width = getStoryProgressWidth(progress);
    }
  }, [getStoryProgressWidth]);

  // Story progress rAF — writes directly to DOM via ref. No setState per frame.
  useEffect(() => {
    if (!activeStoryGroup || isStoryPaused) return;

    const currentItem = getCurrentStoryItem(activeStoryGroup, activeStoryIndex);
    if (currentItem?.type === 'video') return;

    const duration = 5000;
    let rafId = 0;
    const startTs = performance.now();

    // Reset bar at the start of each slide
    if (activeBarRef.current) activeBarRef.current.style.width = STORY_PROGRESS_MIN_WIDTH;

    const tick = (now: number) => {
      const elapsed = now - startTs;
      const pct = Math.min(100, (elapsed / duration) * 100);

      if (activeBarRef.current) {
        activeBarRef.current.style.width = getStoryProgressWidth(pct);
      }

      if (pct >= 100) {
        handleNextStorySlide();
        return;
      }

      rafId = requestAnimationFrame(tick);
    };

    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [activeStoryGroup, activeStoryIndex, isStoryPaused, handleNextStorySlide, getStoryProgressWidth]);

  const navigateLightbox = useCallback(
    (dir: 'next' | 'prev') => {
      if (!selectedMedia) return;
      const currentIndex = filteredMedia.findIndex((m) => m.id === selectedMedia.id);
      if (currentIndex === -1) return;

      const nextIndex = dir === 'next' ? currentIndex + 1 : currentIndex - 1;
      if (nextIndex < 0 || nextIndex >= filteredMedia.length) return;

      openLightbox(filteredMedia[nextIndex]);
    },
    [selectedMedia, filteredMedia, openLightbox]
  );

  useEffect(() => {
    if (!selectedMedia) return;
    if (deletedIds.has(selectedMedia.id)) {
      closeLightbox();
      return;
    }
    const stillThere = filteredMedia.some((m) => m.id === selectedMedia.id);
    if (!stillThere) closeLightbox();
  }, [selectedMedia, filteredMedia, deletedIds, closeLightbox]);

  // Preload the display renditions of the previous/next photos while one is
  // open, so arrow/swipe navigation shows them instantly from browser cache.
  useEffect(() => {
    if (!selectedMedia) return;
    const idx = filteredMedia.findIndex((m) => m.id === selectedMedia.id);
    if (idx === -1) return;
    const neighbors = [
      filteredMedia[(idx + 1) % filteredMedia.length],
      filteredMedia[(idx - 1 + filteredMedia.length) % filteredMedia.length],
    ];
    for (const n of neighbors) {
      if (n && n.type === 'photo') {
        const img = new Image();
        img.src = n.displayUrl || n.url;
      }
    }
  }, [selectedMedia, filteredMedia]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (faceView) {
        // Face gallery is on top — Esc closes it (returns to the photo); ignore
        // the other keys so they don't drive the lightbox underneath.
        if (e.key === 'Escape') window.history.back();
        return;
      }
      if (activeStoryGroup) {
        switch (e.key) {
          case 'ArrowLeft':
            handleNextStorySlide();
            break;
          case 'ArrowRight':
            handlePrevStorySlide();
            break;
          case 'Escape':
            closeStory();
            break;
        }
      } else if (selectedMedia) {
        switch (e.key) {
          case 'ArrowLeft':
            navigateLightbox('next');
            break;
          case 'ArrowRight':
            navigateLightbox('prev');
            break;
          case 'Escape':
            closeLightbox();
            break;
        }
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [faceView, activeStoryGroup, selectedMedia, handleNextStorySlide, handlePrevStorySlide, navigateLightbox, closeLightbox, closeStory]);

  const toggleFavorite = useCallback((id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setFavorites((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const currentShareItem = useMemo(() => {
    if (selectedMedia) return selectedMedia;
    return getCurrentStoryItem(activeStoryGroup, activeStoryIndex);
  }, [selectedMedia, activeStoryGroup, activeStoryIndex]);

  const openDeleteConfirm = useCallback((target: 'lightbox' | 'story') => {
    setDeleteTarget(target);
    setIsDeleteConfirmOpen(true);
  }, []);

  const handleDeleteLightbox = useCallback(async () => {
    if (!selectedMedia || isDeleting) return;
    const targetId = selectedMedia.id;
    setIsDeleting(true);
    try {
      await deletePhoto(targetId);
      setDeletedIds((prev) => new Set(prev).add(targetId));
      closeLightbox();
      setIsDeleteConfirmOpen(false);
    } catch (err) {
      console.error('Failed to delete photo:', err);
    } finally {
      setIsDeleting(false);
    }
  }, [selectedMedia, deletePhoto, closeLightbox, isDeleting]);

  const handleDeleteStory = useCallback(async () => {
    if (!activeStoryGroup || isDeleting) return;
    const currentItem = activeStoryGroup.items[activeStoryIndex];
    if (!currentItem) return;
    const targetId = currentItem.id;

    setIsDeleting(true);
    try {
      try {
        await deletePhoto(targetId);
      } catch (err) {
        console.error('Failed to delete story item:', err);
      }

      const updatedItems = activeStoryGroup.items.filter((i) => i.id !== targetId);
      const isLast = updatedItems.length === 0;

      if (isLast) {
        closeStory();
      } else {
        const nextIndex = activeStoryIndex >= updatedItems.length ? updatedItems.length - 1 : activeStoryIndex;
        setActiveStoryGroup({ ...activeStoryGroup, items: updatedItems });
        setActiveStoryIndex(nextIndex);
      }

      setDeletedIds((prev) => {
        const next = new Set(prev);
        next.add(targetId);
        return next;
      });
      setIsDeleteConfirmOpen(false);
    } finally {
      setIsDeleting(false);
    }
  }, [activeStoryGroup, activeStoryIndex, deletePhoto, closeStory, isDeleting]);

  const confirmDelete = useCallback(() => {
    if (deleteTarget === 'story') handleDeleteStory();
    else if (deleteTarget === 'lightbox') handleDeleteLightbox();
  }, [deleteTarget, handleDeleteStory, handleDeleteLightbox]);

  const handleDownload = useCallback(async () => {
    if (!selectedMedia) return;
    try {
      const response = await galleryApi.getDownloadUrl(selectedMedia.id);
      if (!response.data?.url) throw new Error('No download URL');

      const extension = selectedMedia.type === 'video' ? 'mp4' : 'jpg';
      const filename = `mynight-${selectedMedia.id}.${extension}`;

      const link = document.createElement('a');
      link.href = response.data.url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch {
      window.open(selectedMedia.url, '_blank');
    }
  }, [selectedMedia]);

  const handleStoryDownload = useCallback(async () => {
    const item = getCurrentStoryItem(activeStoryGroup, activeStoryIndex);
    if (!item) return;

    try {
      const response = await galleryApi.getDownloadUrl(item.id);
      if (!response.data?.url) throw new Error('No download URL');

      const extension = item.type === 'video' ? 'mp4' : 'jpg';
      const filename = `mynight-story-${item.id}.${extension}`;

      const link = document.createElement('a');
      link.href = response.data.url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch {
      window.open(item.url, '_blank');
    }
  }, [activeStoryGroup, activeStoryIndex]);

  const closeShareMenus = useCallback(() => {
    setIsShareMenuOpen(false);
    setIsStoryShareOpen(false);
  }, []);

  const handleCopyLink = useCallback(async () => {
    if (!currentShareItem) return;
    try {
      await navigator.clipboard.writeText(currentShareItem.url);
      closeShareMenus();
    } catch {}
  }, [currentShareItem, closeShareMenus]);

  const handleCopyGuestLink = useCallback(() => {
    if (!guestLink) return;
    navigator.clipboard.writeText(guestLink);
    setLinkCopied(true);
    setTimeout(() => setLinkCopied(false), 2000);
  }, [guestLink]);

  const handleWhatsAppShare = useCallback(async () => {
    if (!currentShareItem || isPreparingShare) return;
    const text = getShareText(coupleName, isOwner);

    setIsPreparingShare(true);
    try {
      const signedRes = await galleryApi.getDownloadUrl(currentShareItem.id);
      const fileUrl = signedRes.data?.url || currentShareItem.url;
      const response = await fetch(fileUrl);
      const blob = await response.blob();
      const ext = currentShareItem.type === 'video' ? 'mp4' : 'jpg';
      const mimeType = currentShareItem.type === 'video' ? 'video/mp4' : 'image/jpeg';
      const file = new File([blob], `mynight-${currentShareItem.id}.${ext}`, { type: mimeType });

      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({ files: [file], text });
      } else {
        window.open(`https://wa.me/?text=${encodeURIComponent(`${text} ${currentShareItem.url}`)}`, '_blank');
      }
    } catch {
      window.open(`https://wa.me/?text=${encodeURIComponent(`${text} ${currentShareItem.url}`)}`, '_blank');
    } finally {
      setIsPreparingShare(false);
    }

    closeShareMenus();
  }, [currentShareItem, coupleName, isOwner, closeShareMenus, isPreparingShare]);

  const handleFacebookShare = useCallback(async () => {
    if (!currentShareItem || isPreparingShare) return;
    const text = getShareText(coupleName, isOwner);

    setIsPreparingShare(true);
    try {
      const signedRes = await galleryApi.getDownloadUrl(currentShareItem.id);
      const fileUrl = signedRes.data?.url || currentShareItem.url;
      const response = await fetch(fileUrl);
      const blob = await response.blob();
      const file = new File([blob], `mynight-${currentShareItem.id}.jpg`, { type: 'image/jpeg' });

      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({ files: [file], text });
      } else {
        window.open(
          `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(currentShareItem.url)}&quote=${encodeURIComponent(text)}`,
          '_blank'
        );
      }
    } catch {
      window.open(
        `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(currentShareItem.url)}&quote=${encodeURIComponent(text)}`,
        '_blank'
      );
    } finally {
      setIsPreparingShare(false);
    }

    closeShareMenus();
  }, [currentShareItem, coupleName, isOwner, closeShareMenus, isPreparingShare]);

  const handleInstagramStory = useCallback(async () => {
    if (!currentShareItem) return;

    try {
      const response = await fetch(currentShareItem.url);
      const blob = await response.blob();
      const mimeType = currentShareItem.type === 'video' ? 'video/mp4' : 'image/jpeg';
      const ext = currentShareItem.type === 'video' ? 'mp4' : 'jpg';
      const file = new File([blob], `mynight-${currentShareItem.id}.${ext}`, { type: mimeType });

      if (navigator.share) {
        await navigator.share({
          files: [file],
          title: 'My Night',
          text: `From the wedding of ${coupleName}`,
        });
      } else {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = file.name;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      }
    } catch {
    } finally {
      closeShareMenus();
    }
  }, [currentShareItem, coupleName, closeShareMenus]);

  const handleNativeShare = useCallback(async () => {
    if (!currentShareItem) return;

    if (navigator.share) {
      try {
        await navigator.share({
          title: `זיכרון מהחתונה של ${coupleName}`,
          text: getShareText(coupleName, isOwner),
          url: currentShareItem.url,
        });
      } catch {}
    } else {
      handleCopyLink();
    }

    closeShareMenus();
  }, [currentShareItem, coupleName, isOwner, handleCopyLink, closeShareMenus]);

  const handleGiftClick = useCallback(async (e: React.MouseEvent<HTMLButtonElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (rect.left + rect.width / 2) / window.innerWidth;
    const y = (rect.top + rect.height / 2) / window.innerHeight;

    confetti({
      origin: { x, y },
      particleCount: 150,
      spread: 80,
      startVelocity: 35,
      colors: ['#F5C518', '#000000', '#FFFFFF', '#CCCCCC'],
      zIndex: 201,
    });

    try {
      let code: string | null = null;
      let label: string | null = null;

      // Prefer this event's own gift coupon; fall back to the global standard one.
      if (resolvedEventId && resolvedEventId !== '__showcase__') {
        const response = await couponApi.getEventCoupon(resolvedEventId);
        const d = response.data;
        if (d && d.isActive) {
          code = d.code;
          label = d.discountAmount && d.discountAmount > 0
            ? `${d.discountAmount}₪`
            : (d.discountPercent === 100 ? '100%' : `${d.discountPercent}%`);
        }
      }

      if (!code) {
        const fallback = await couponApi.getActiveStandard();
        if (fallback.data) {
          code = fallback.data.code;
          label = fallback.data.discountPercent === 100 ? '100%' : `${fallback.data.discountPercent}%`;
        }
      }

      if (code) {
        setDiscountCode(code);
        setDiscountAmount(label || '');
      }
    } catch {}

    setIsGiftModalOpen(true);
  }, [resolvedEventId]);

  const handleCopyDiscountCode = useCallback(() => {
    navigator.clipboard.writeText(discountCode);
    setGiftCodeCopied(true);
    setTimeout(() => setGiftCodeCopied(false), 2000);
  }, [discountCode]);

  const handleShareDiscount = useCallback((method: 'whatsapp' | 'copy') => {
    const message = `קיבלתי קוד הנחה מיוחד עבורך! השתמש/י בקוד ${discountCode} וקבל/י ${discountAmount} הנחה על אלבום החתונה הדיגיטלי שלך ב-MyNight`;
    if (method === 'whatsapp') window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank');
    else {
      navigator.clipboard.writeText(message);
      setGiftCodeCopied(true);
      setTimeout(() => setGiftCodeCopied(false), 2000);
    }
  }, [discountCode, discountAmount]);

  const handleStoryDragEnd = useCallback((_event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    const swipeThreshold = window.innerWidth * 0.2;
    if (info.offset.x > swipeThreshold) jumpToNextGroup();
    else if (info.offset.x < -swipeThreshold) jumpToPrevGroup();
  }, [jumpToNextGroup, jumpToPrevGroup]);

  const toggleShareSetting = useCallback((key: 'pro' | 'guests' | 'stories') => {
    setShareSettings((prev) => ({ ...prev, [key]: !prev[key] }));
  }, []);

  const handleOpenStory = useCallback((group: StoryGroup, validItems: MediaItem[]) => {
    openStory(group, validItems);
  }, [openStory]);

  const handleNavigateSlide = useCallback((dir: 'next' | 'prev') => {
    if (dir === 'next') handleNextStorySlide();
    else handlePrevStorySlide();
  }, [handleNextStorySlide, handlePrevStorySlide]);

  const handleNavigateGroup = useCallback((dir: 'next' | 'prev') => {
    if (dir === 'next') jumpToNextGroup();
    else jumpToPrevGroup();
  }, [jumpToNextGroup, jumpToPrevGroup]);

  if (isLoading && !mediaItems.length) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <Loader2 size={40} className="animate-spin text-gray-400" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-6 text-center">
        <div>
          <h2 className="text-2xl font-bold mb-2">שגיאה</h2>
          <p className="text-gray-500">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white text-black font-sans w-full" dir="rtl">
      <section className="relative min-h-[100dvh] w-full overflow-hidden bg-black flex flex-col justify-between" style={{ touchAction: 'pan-y' }}>
        <motion.div initial={{ scale: 1.05 }} animate={{ scale: 1 }} transition={{ duration: 1.5, ease: 'easeOut' }} className="absolute inset-0 z-0 transform-gpu pointer-events-none">
          <HeroVerticalCollage items={collageItems} />
          <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/10 to-black/60 pointer-events-none" />
        </motion.div>

        <AnimatePresence>
          {showDesktopMenuTrigger && (isOwnerView || isShowcase) && (
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

        <div className="relative z-10 p-8 md:p-12 flex justify-end items-start" />

        <div className="relative z-10 w-full p-8 md:p-16 flex justify-between items-end">
          <AnimatePresence>
            {showMobileMenuTrigger && (isOwnerView || isShowcase) && (
              <motion.div
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                exit={{ x: '100%' }}
                transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                onClick={() => setIsSideMenuOpen(true)}
                className="absolute right-0 z-50 bg-gold-primary rounded-l-full shadow-lg flex items-center justify-center cursor-pointer active:scale-95 touch-none"
                style={{ top: '-32px', width: '32px', height: '40px' }}
              >
                <div className="mr-[-4px]">
                  <svg width="10" height="14" viewBox="0 0 12 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M0 8L12 0V16L0 8Z" fill="white" />
                  </svg>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="text-right flex flex-col items-start">
            <motion.p
              initial={{ x: 40, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.5, duration: 0.8, ease: 'easeOut' }}
              className="text-white/50 text-xl md:text-3xl font-bold tracking-wide mb-0 font-bona translate-y-[88px]"
            >
              הלילה של
            </motion.p>

            <h2 dir="rtl" className="text-white/55 text-5xl md:text-9xl font-bold tracking-wide leading-none flex flex-row flex-wrap items-baseline gap-y-2 gap-x-3 md:gap-x-4 font-bona justify-start">
              <motion.span initial={{ x: 40, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.8, duration: 0.8, ease: 'easeOut' }}>
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
                  <motion.span initial={{ x: 40, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 1.1, duration: 0.8, ease: 'easeOut' }}>
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
              {(() => {
                const rawDate = (event as any)?.weddingDate || (event as any)?.eventDate;
                const d = rawDate ? new Date(rawDate) : null;
                if (!d || isNaN(d.getTime())) {
                  return (
                    <>
                      <span className="text-xl md:text-3xl">25</span>
                      <span className="text-sm md:text-xl font-light scale-[1.1]">May</span>
                      <span className="text-xl md:text-3xl">2025</span>
                    </>
                  );
                }
                const day = d.getDate();
                const month = d.toLocaleString('en-US', { month: 'short' });
                const year = d.getFullYear();
                return (
                  <>
                    <span className="text-xl md:text-3xl">{day}</span>
                    <span className="text-sm md:text-xl font-light scale-[1.1]">{month}</span>
                    <span className="text-xl md:text-3xl">{year}</span>
                  </>
                );
              })()}
            </motion.div>
          </div>
        </div>
      </section>

      {(isOwnerView || isShowcase) && (
        <SideMenu open={isSideMenuOpen} onClose={() => setIsSideMenuOpen(false)} isShowcase={isShowcase} event={event} eventId={eventId} couponEventId={resolvedEventId} navigate={navigate} allowManagement={getTokenScope(token) !== 'gallery'} />
      )}

      <StickyToolbar
        isMobile={isMobile}
        isSearchOpen={isSearchOpen}
        setIsSearchOpen={setIsSearchOpen}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        filterType={filterType}
        setFilterType={setFilterType}
        filterSource={filterSource}
        setFilterSource={setFilterSource}
        selectedCategory={selectedCategory}
        setSelectedCategory={setSelectedCategory}
        availableCategories={availableCategories}
        showFavoritesOnly={showFavoritesOnly}
        setShowFavoritesOnly={setShowFavoritesOnly}
        setIsSideMenuOpen={setIsSideMenuOpen}
        showMenuButton={isOwnerView || isShowcase}
        showFavorites={isOwnerView}
      />

      {(isOwnerView || effectiveShareSettings.pro || effectiveShareSettings.guests || effectiveShareSettings.stories) && storyGroups.length > 0 && (
        <StoriesRail
          storyGroups={storyGroups}
          deletedIds={deletedIds}
          onOpenStory={handleOpenStory}
        />
      )}

      {!isOwnerView && !effectiveShareSettings.pro && !effectiveShareSettings.guests && !effectiveShareSettings.stories ? (
        <div className="w-full px-6 py-32 flex flex-col items-center justify-center text-center" dir="rtl">
          <div className="w-16 h-16 bg-gray-50 text-gray-400 rounded-2xl flex items-center justify-center mb-6">
            <Lock size={32} strokeWidth={1.5} />
          </div>
          <h3 className="text-2xl md:text-3xl font-bold text-black mb-2">הגלריה אינה משותפת כרגע</h3>
          <p className="text-gray-500 text-base md:text-lg max-w-md">
            בעלי האירוע בחרו להסתיר את התוכן מקישור זה. ניתן לפנות אליהם להפעלה מחדש.
          </p>
        </div>
      ) : (
        <>
          <GalleryGrid
            items={filteredMedia}
            favorites={favorites}
            onOpen={openLightbox}
            onToggleFavorite={toggleFavorite}
            isLoadingMore={galleryData.isLoadingMore}
            loadMoreError={galleryData.loadMoreError}
            onRetryLoadMore={galleryData.retryLoadMore}
            hasMore={!isShowcase && galleryData.hasMore}
            sentinelRef={sentinelRef}
          />

          {!galleryData.hasMore && filteredMedia.length > 0 && (
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
                    <button onClick={() => { navigate(ROUTES.HOME); window.scrollTo({ top: 0, left: 0, behavior: 'auto' }); }} className="focus:outline-none hover:opacity-100 transition-opacity">
                      <img src={logoSvg} alt="MY NIGHT" className="h-10 md:h-12 w-auto object-contain opacity-80" />
                    </button>
                    <p className="text-gray-300 text-[9px] uppercase mt-1 hidden md:block">© 2025 All Rights Reserved</p>
                  </div>
                </div>
              </div>
            </footer>
          )}
        </>
      )}

      <LightboxModal
        item={selectedMedia}
        favorites={favorites}
        fullImageLoaded={fullImageLoaded}
        setFullImageLoaded={setFullImageLoaded}
        onClose={closeLightbox}
        onOpenShare={() => setIsShareMenuOpen(true)}
        onDownload={handleDownload}
        onToggleFavorite={toggleFavorite}
        onDelete={isOwnerView ? () => openDeleteConfirm('lightbox') : undefined}
        onNavigate={navigateLightbox}
        shareOpen={isShareMenuOpen}
        onCloseShare={() => setIsShareMenuOpen(false)}
        onWhatsApp={handleWhatsAppShare}
        onInstagram={handleInstagramStory}
        onFacebook={handleFacebookShare}
        onMore={handleNativeShare}
        canFavorite={isOwnerView}
        onFaceClick={(face) => {
          if (!selectedMedia) return;
          setFaceView({
            face,
            imageUrl: selectedMedia.displayUrl || selectedMedia.url,
            imgW: selectedMedia.width,
            imgH: selectedMedia.height,
          });
        }}
      />

      <AnimatePresence>
        {faceView && resolvedEventId && resolvedEventId !== '__showcase__' && (
          <FacePhotosOverlay
            eventId={resolvedEventId}
            face={faceView.face}
            faceImageUrl={faceView.imageUrl}
            imgWidth={faceView.imgW}
            imgHeight={faceView.imgH}
            coupleName={event?.name || ''}
            onBack={() => window.history.back()}
            favorites={isOwnerView ? favorites : undefined}
            onToggleFavorite={isOwnerView ? toggleFavorite : undefined}
          />
        )}
      </AnimatePresence>

      <StoryViewerModal
        group={activeStoryGroup}
        storyGroups={storyGroups}
        deletedIds={deletedIds}
        activeIndex={activeStoryIndex}
        paused={isStoryPaused}
        direction={direction}
        favorites={favorites}
        shareOpen={isStoryShareOpen}
        activeBarRef={activeBarRef}
        onClose={closeStory}
        onVideoProgress={handleStoryVideoProgress}
        onTogglePause={() => setIsStoryPaused((prev) => !prev)}
        onNavigateSlide={handleNavigateSlide}
        onNavigateGroup={handleNavigateGroup}
        onOpenShare={() => setIsStoryShareOpen(true)}
        onCloseShare={() => setIsStoryShareOpen(false)}
        onDelete={isOwnerView ? () => openDeleteConfirm('story') : undefined}
        onDownload={handleStoryDownload}
        onToggleFavorite={toggleFavorite}
        onWhatsApp={handleWhatsAppShare}
        onInstagram={handleInstagramStory}
        onFacebook={handleFacebookShare}
        onMore={handleNativeShare}
        onDragEnd={handleStoryDragEnd}
        onPressDown={() => setIsStoryPaused(true)}
        onPressUp={() => setIsStoryPaused(false)}
      />

      <AnimatePresence>
        {isPreparingShare && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[300] bg-black/60 backdrop-blur-sm flex items-center justify-center pointer-events-auto"
          >
            <div className="bg-white rounded-2xl px-6 py-5 flex items-center gap-3 shadow-2xl">
              <Loader2 size={22} className="animate-spin text-black" />
              <span className="font-bold text-black text-base">מכין שיתוף...</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <DeleteConfirmModal open={isDeleteConfirmOpen} isDeleting={isDeleting} onClose={() => { if (!isDeleting) setIsDeleteConfirmOpen(false); }} onConfirm={confirmDelete} />

      <ShareSettingsModal
        open={isShareSettingsOpen}
        onClose={() => setIsShareSettingsOpen(false)}
        shareSettings={shareSettings}
        toggleShareSetting={toggleShareSetting}
        guestLink={guestLink}
        linkCopied={linkCopied}
        onCopyGuestLink={handleCopyGuestLink}
      />

      <GiftModal
        open={isGiftModalOpen}
        onClose={() => setIsGiftModalOpen(false)}
        discountCode={discountCode}
        discountAmount={discountAmount}
        giftCodeCopied={giftCodeCopied}
        onCopyDiscountCode={handleCopyDiscountCode}
        onShareDiscount={handleShareDiscount}
      />
    </div>
  );
};

export default Gallery;

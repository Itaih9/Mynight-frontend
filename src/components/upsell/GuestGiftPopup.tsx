import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X, Check, Copy, Gift, MessageCircle } from 'lucide-react';
import { couponApi } from '@/services/api';

/**
 * Gift offered to a guest right after face recognition finds their photos.
 *
 * This is the warmest moment the product ever gets: someone has just seen
 * themselves in a wedding album that assembled itself. If they are getting
 * married too, that is when they are most likely to care — so the coupon is
 * framed as a gift FROM the couple, not an ad from us.
 *
 * Deliberately delayed rather than shown on arrival: interrupting someone in
 * the second before they see their own photos would sour the exact feeling the
 * offer depends on.
 */
export const GuestGiftPopup = ({
  eventId,
  coupleName,
  ready,
  delayMs = 2000,
}: {
  eventId?: string;
  coupleName?: string;
  /** True once matched photos are on screen. */
  ready: boolean;
  delayMs?: number;
}) => {
  const [open, setOpen] = useState(false);
  const [coupon, setCoupon] = useState<{ code: string; discountAmount?: number; expiresAt?: string } | null>(null);
  const [copied, setCopied] = useState(false);

  // Once per guest per event. A returning guest browsing their photos again
  // should not be pitched every visit — the album is the product, and nagging
  // inside it is how you make people stop opening it.
  const seenKey = eventId ? `mynight_gift_seen_${eventId}` : '';

  useEffect(() => {
    if (!ready || !eventId) return;
    if (seenKey && localStorage.getItem(seenKey)) return;

    let cancelled = false;
    let timer: number;

    couponApi
      .getEventCoupon(eventId)
      .then((res) => {
        if (cancelled) return;
        const c = res.data;
        // No coupon configured for this event is a perfectly normal state —
        // stay silent rather than showing an empty offer.
        if (!c?.code) return;
        setCoupon({ code: c.code, discountAmount: c.discountAmount, expiresAt: (c as any).expiresAt });
        timer = window.setTimeout(() => {
          if (cancelled) return;
          setOpen(true);
          if (seenKey) localStorage.setItem(seenKey, '1');
        }, delayMs);
      })
      .catch(() => {
        /* the album matters more than the offer — fail silently */
      });

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [ready, eventId, seenKey, delayMs]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const copy = async () => {
    if (!coupon) return;
    try {
      await navigator.clipboard.writeText(coupon.code);
    } catch {
      // Safari refuses clipboard writes outside a user gesture in some
      // versions; select the text so a long-press copy still works.
      const el = document.getElementById('gift-code');
      if (el) {
        const range = document.createRange();
        range.selectNodeContents(el);
        const sel = window.getSelection();
        sel?.removeAllRanges();
        sel?.addRange(range);
      }
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!coupon) return null;
  const amount = coupon.discountAmount || 200;

  // Written from the GUEST's side, not the couple's — they are forwarding this
  // to a friend, so it has to read like a person passing on a tip rather than
  // a brand talking. The code goes on its own line so it survives WhatsApp's
  // link preview and is easy to long-press.
  const shareText =
    `הייתי בחתונה של ${coupleName || 'חברים'} וכל התמונות שלי הגיעו אליי אוטומטית 📸\n\n` +
    `מתחתנים בקרוב? יש לכם גיפט קארד של ${amount} שקלים ל-My Night:\n` +
    `${coupon.code}\n\n` +
    `https://mynight.co.il`;
  const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(shareText)}`;

  const expiryLabel = coupon.expiresAt
    ? new Date(coupon.expiresAt).toLocaleDateString('he-IL', { day: 'numeric', month: 'long', year: 'numeric' })
    : '';

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setOpen(false)}
          className="fixed inset-0 z-[120] bg-black/70 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-6"
          dir="rtl"
          role="dialog"
          aria-modal="true"
          aria-labelledby="gift-title"
        >
          <motion.div
            initial={{ y: 40, opacity: 0, scale: 0.98 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 30, opacity: 0 }}
            transition={{ type: 'spring', damping: 26, stiffness: 280 }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full sm:max-w-sm bg-white text-charcoal rounded-t-3xl sm:rounded-3xl overflow-hidden shadow-2xl"
          >
            <button
              onClick={() => setOpen(false)}
              aria-label="סגירה"
              className="absolute top-4 left-4 z-10 w-9 h-9 rounded-full bg-black/5 hover:bg-black/10 flex items-center justify-center transition-colors"
            >
              <X size={18} />
            </button>

            <div className="px-6 pt-9 pb-7 text-center">
              <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-gold-primary/15 flex items-center justify-center">
                <Gift size={26} className="text-gold-primary" />
              </div>

              <h2 id="gift-title" className="text-[22px] font-black leading-tight mb-3">
                החגיגה נגמרה — אבל המתנות עוד מגיעות!
              </h2>

              <p className="text-gray-800/65 text-[15px] leading-relaxed mb-1">מכירים מישהו שמתחתן בקרוב?</p>
              <p className="text-gray-800/65 text-[15px] leading-relaxed mb-6">
                כל האורחים של {coupleName || 'הזוג'} מקבלים גיפט קארד של{' '}
                <strong className="text-charcoal">{amount} שקלים</strong> — למימוש לאלבום המושלם!
              </p>

              <div className="w-full mb-2 rounded-2xl border-2 border-dashed border-gold-primary/60 bg-gold-primary/5 px-4 py-4">
                <span id="gift-code" className="font-mono font-black text-lg tracking-wider" dir="ltr">
                  {coupon.code}
                </span>
              </div>
              {expiryLabel && (
                <p className="text-gray-800/45 text-xs mb-4">גיפט קארד תקף לשימוש עד {expiryLabel}</p>
              )}

              <button
                onClick={copy}
                className="w-full py-3.5 rounded-2xl bg-charcoal text-white font-bold text-lg active:scale-[0.99] transition-transform mb-3 flex items-center justify-center gap-2"
              >
                {copied ? <Check size={20} /> : <Copy size={18} />}
                {copied ? 'הקוד הועתק' : 'להעתקה'}
              </button>

              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setOpen(false)}
                className="w-full py-3.5 rounded-2xl bg-[#25D366] text-white font-bold text-lg active:scale-[0.99] transition-transform mb-3 flex items-center justify-center gap-2"
              >
                <MessageCircle size={20} />
                לשיתוף בווצאפ
              </a>

              <button
                onClick={() => setOpen(false)}
                className="text-gray-800/45 text-sm hover:text-gray-800/70 transition-colors"
              >
                אולי אחר כך
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default GuestGiftPopup;

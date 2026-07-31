import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X, ScanFace } from 'lucide-react';
import { ROUTES } from '@/config/routes';
import { eventsApi } from '@/services/api/events.api';

/**
 * Here I Am upsell popup for free פלאש couples.
 *
 * Suppression is decided by the SERVER, not local state: all three payment
 * paths (Sumit tokenized charge, Sumit hosted redirect, and a 100% coupon) set
 * `isPaid` on the event, so that flag is the single source of truth and works
 * on any device. We fetch the event by code and stay hidden if it's paid.
 *
 * Otherwise it reappears every visit — dismissible and never blocking, since
 * the free tier is the goodwill engine and a trapped user would undo that.
 */
export const HereIAmUpsellModal = ({
  eventCode,
  delayMs = 900,
}: {
  eventCode?: string;
  delayMs?: number;
}) => {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    let timer: number;

    const decide = async () => {
      // No code to check means we can't confirm payment — err toward showing it,
      // since a free couple seeing the offer is the expected case.
      if (eventCode) {
        try {
          const res = await eventsApi.getByCode(eventCode);
          if (res.data?.isPaid) return; // already bought — never nag
        } catch { /* lookup failed; fall through and show */ }
      }
      if (!cancelled) timer = window.setTimeout(() => setOpen(true), delayMs);
    };

    void decide();
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [eventCode, delayMs]);

  // Escape closes, and body scroll is locked while open.
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

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setOpen(false)}
          className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-6"
          dir="rtl"
          role="dialog"
          aria-modal="true"
          aria-labelledby="upsell-title"
        >
          <motion.div
            initial={{ y: 40, opacity: 0, scale: 0.98 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 30, opacity: 0 }}
            transition={{ type: 'spring', damping: 26, stiffness: 280 }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full sm:max-w-md bg-white text-charcoal rounded-t-3xl sm:rounded-3xl overflow-hidden shadow-2xl"
          >
            <button
              onClick={() => setOpen(false)}
              aria-label="סגירה"
              className="absolute top-4 left-4 z-10 w-9 h-9 rounded-full bg-black/5 hover:bg-black/10 flex items-center justify-center transition-colors"
            >
              <X size={18} />
            </button>

            <div className="bg-gradient-to-b from-[#faf7f2] to-white pt-8 px-6 flex justify-center">
              <img
                src="/images/woman-holding-phone.png"
                alt=""
                loading="lazy"
                className="h-40 w-auto object-contain drop-shadow-[0_20px_40px_rgba(0,0,0,0.14)]"
              />
            </div>

            <div className="px-6 pb-7 pt-5 text-center">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-gold-primary/15 text-[12px] font-bold mb-3">
                <ScanFace size={13} /> החכמה · Here I Am
              </div>
              <h2 id="upsell-title" className="text-2xl font-black mb-3 leading-tight">
                רוצים שכל אורח יקבל
                <br />את התמונות שלו?
              </h2>
              <p className="text-gray-800/65 text-[15px] leading-relaxed mb-6">
                פלאש אוסף את הצילומים. זיהוי הפנים שולח לכל אורח אלבום אישי —
                רק עם התמונות שהוא מופיע בהן, כולל התמונות מהצלם.
              </p>

              <a
                href={ROUTES.HERE_I_AM}
                className="block w-full py-3.5 rounded-2xl bg-charcoal text-white font-bold text-lg active:scale-[0.99] transition-transform mb-3"
              >
                רוצה לשמוע עוד
              </a>
              <button
                onClick={() => setOpen(false)}
                className="text-gray-800/50 text-sm hover:text-gray-800/70 transition-colors"
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

export default HereIAmUpsellModal;

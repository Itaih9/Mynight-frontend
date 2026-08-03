import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, X, Sparkles, Video, ScanFace, Camera } from 'lucide-react';
import { eventsApi } from '@/services/api/events.api';
import { paymentApi } from '@/services/api';
import { SumitHostedCheckout } from '@/components/payment/SumitHostedCheckout';
import { ROUTES } from '@/config/routes';

/**
 * פלאש / פלאש+ plans on one page: a pill toggle switches between the two tiers,
 * and the selected tier's details (and, for פלאש+, the upgrade checkout) appear
 * below. Reached with ?code=<eventCode>; on a successful פלאש+ payment the
 * backend sets flashTier='plus'.
 */

// Must match the backend price in src/shared/config/flashPlans.ts
// (FLASH_PLUS_PRICE_ILS).
const FLASH_PLUS_PRICE = 50;

const BASIC_FEATURES = [
  { icon: Camera, label: '8 צילומים לכל אורח' },
  { icon: Check, label: 'מצלמה חד-פעמית לכל האורחים' },
  { icon: Check, label: 'הכל מתפתח בבוקר שאחרי' },
];

const PLUS_FEATURES = [
  { icon: Camera, label: '24 צילומים לכל אורח' },
  { icon: Video, label: 'וידאו — לא רק תמונות' },
  { icon: ScanFace, label: 'זיהוי פנים: כל אורח מקבל את התמונות שלו' },
  { icon: Check, label: 'כולל התמונות מהצלם המקצועי' },
];

type Tier = 'basic' | 'plus';

export const FlashPlus = () => {
  const [params] = useSearchParams();
  const code = params.get('code') || '';
  const [tier, setTier] = useState<Tier>('plus');
  const [eventId, setEventId] = useState('');
  const [alreadyPlus, setAlreadyPlus] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [paymentId, setPaymentId] = useState('');
  const [error, setError] = useState('');
  const [needLogin, setNeedLogin] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      // Reached with ?code=<eventCode>: resolve that event.
      if (code) {
        try {
          const res = await eventsApi.getByCode(code);
          const ev = res.data as any;
          if (!cancelled) {
            setEventId(ev?._id || '');
            setAlreadyPlus(ev?.flashTier === 'plus');
          }
        } catch { /* invalid/expired code — upgrade will guide them */ }
        return;
      }
      // No code: resolve the logged-in couple's own event. If they're not
      // logged in, surface the login prompt instead of "event not found".
      try {
        const res = await eventsApi.getMyEvents();
        const evs = (res.data as any) || [];
        const ev = Array.isArray(evs) ? evs[0] : evs;
        if (!cancelled && ev) {
          setEventId(ev._id || '');
          setAlreadyPlus(ev.flashTier === 'plus');
        }
      } catch (e: any) {
        if (!cancelled && e?.response?.status === 401) setNeedLogin(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [code]);

  const upgrade = async () => {
    setError('');
    setNeedLogin(false);
    if (!eventId) {
      setError('לא נמצא אירוע לשדרוג — היכנסו מהקישור שקיבלתם.');
      return;
    }
    setSubmitting(true);
    try {
      const res = await paymentApi.create({ eventId, product: 'flash_plus' });
      const pid = (res.data as any)?.paymentId;
      if (!pid) throw new Error('no paymentId');
      setPaymentId(pid); // triggers the Sumit hosted redirect below
    } catch (err: any) {
      const status = err?.response?.status;
      if (status === 401) setNeedLogin(true);
      else setError(err?.response?.data?.error || err?.response?.data?.message || 'משהו השתבש, נסו שוב');
      setSubmitting(false);
    }
  };

  // Once a payment is created, hand off to Sumit's hosted page.
  if (paymentId) {
    return (
      <div className="min-h-screen bg-neutral-950 text-white flex flex-col items-center justify-center px-6" dir="rtl">
        <SumitHostedCheckout
          paymentId={paymentId}
          onFailure={(m) => {
            setError(m || 'שגיאה ביצירת דף התשלום');
            setPaymentId('');
            setSubmitting(false);
          }}
        />
        <p className="text-white/60">מעבירים אתכם לתשלום מאובטח…</p>
      </div>
    );
  }

  const isPlus = tier === 'plus';
  const features = isPlus ? PLUS_FEATURES : BASIC_FEATURES;

  return (
    <div className="min-h-screen bg-neutral-950 text-white" dir="rtl">
      <div className="max-w-md mx-auto px-6 py-14">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-xs font-bold mb-5">
              <Sparkles size={13} /> המצלמה של החתונה שלכם
            </div>
            <p className="text-white/70 text-lg leading-relaxed">בחרו את החבילה שלכם.</p>
          </div>

          {/* Pill toggle */}
          <div className="flex bg-white/10 rounded-full p-1 mb-7">
            <button
              onClick={() => setTier('basic')}
              className={`flex-1 py-3 rounded-full font-black text-lg transition-all ${
                tier === 'basic' ? 'bg-white text-black shadow' : 'text-white/60'
              }`}
            >
              פלאש
            </button>
            <button
              onClick={() => setTier('plus')}
              className={`flex-1 py-3 rounded-full font-black text-lg transition-all ${
                tier === 'plus' ? 'bg-gold-primary text-black shadow' : 'text-white/60'
              }`}
            >
              פלאש+
            </button>
          </div>

          {/* Details for the selected tier */}
          <AnimatePresence mode="wait">
            <motion.div
              key={tier}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.18 }}
              className={`rounded-2xl p-6 mb-6 ring-1 ${
                isPlus
                  ? 'bg-gradient-to-b from-gold-primary/15 to-white/[0.03] ring-gold-primary/30'
                  : 'bg-white/5 ring-white/10'
              }`}
            >
              <div className="flex items-baseline justify-between mb-5">
                <span className="font-black text-xl">{isPlus ? 'פלאש+' : 'פלאש'}</span>
                <span className={isPlus ? 'text-gold-primary font-black text-2xl' : 'text-white/60 font-bold text-lg'}>
                  {isPlus ? `₪${FLASH_PLUS_PRICE}` : 'חינם'}
                </span>
              </div>
              <ul className="space-y-3 text-sm">
                {features.map((f) => (
                  <li key={f.label} className={`flex gap-2.5 ${isPlus ? 'text-white' : 'text-white/75'}`}>
                    <f.icon size={17} className={`shrink-0 mt-0.5 ${isPlus ? 'text-gold-primary' : 'text-white/40'}`} />
                    <span>{f.label}</span>
                  </li>
                ))}
                {!isPlus && (
                  <li className="flex gap-2.5 text-white/35">
                    <X size={17} className="shrink-0 mt-0.5" />
                    <span>ללא וידאו וללא זיהוי פנים</span>
                  </li>
                )}
              </ul>
            </motion.div>
          </AnimatePresence>

          {/* Action — only פלאש+ has a CTA */}
          {isPlus ? (
            alreadyPlus ? (
              <div className="w-full py-4 rounded-2xl bg-white/10 text-white/80 font-bold text-center">
                האירוע שלכם כבר משודרג לפלאש+ ✓
              </div>
            ) : needLogin ? (
              <Link
                to={`${ROUTES.LOGIN}?redirect=${encodeURIComponent(`/flash-plus?code=${code}`)}`}
                className="block w-full py-4 rounded-2xl bg-white text-black font-black text-lg text-center active:scale-[0.99] transition-transform"
              >
                התחברו כדי לשדרג
              </Link>
            ) : (
              <button
                onClick={upgrade}
                disabled={submitting}
                className="w-full py-4 rounded-2xl bg-gold-primary text-black font-black text-lg disabled:opacity-50 active:scale-[0.99] transition-transform"
              >
                {submitting ? 'רגע…' : `שדרוג לפלאש+ ₪${FLASH_PLUS_PRICE}`}
              </button>
            )
          ) : (
            <p className="text-center text-white/40 text-sm py-4">זו החבילה החינמית — מוכנה לשימוש מיד.</p>
          )}

          {error && <p className="text-red-400 text-sm text-center mt-4">{error}</p>}
          {isPlus && <p className="text-center text-white/35 text-xs mt-4">תשלום מאובטח דרך Sumit. חד-פעמי.</p>}
        </motion.div>
      </div>
    </div>
  );
};

export default FlashPlus;

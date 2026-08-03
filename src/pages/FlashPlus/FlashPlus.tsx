import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Check, X, Sparkles, Video, ScanFace, Camera } from 'lucide-react';
import { eventsApi } from '@/services/api/events.api';
import { paymentApi } from '@/services/api';
import { SumitHostedCheckout } from '@/components/payment/SumitHostedCheckout';
import { ROUTES } from '@/config/routes';

/**
 * פלאש+ plans + upgrade checkout.
 *
 * Reached with ?code=<eventCode> (from the couple's dashboard / upsell). Shows
 * the free Basic vs paid פלאש+ comparison and, for the logged-in couple, starts
 * the Sumit hosted checkout for the upgrade. On success the backend sets the
 * event's flashTier='plus' (see payment.service.ts).
 */

// ⚠️ Must match the backend price in src/shared/config/flashPlans.ts
// (FLASH_PLUS_PRICE_ILS). PLACEHOLDER — set your real price in both places.
const FLASH_PLUS_PRICE = 149;

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

export const FlashPlus = () => {
  const [params] = useSearchParams();
  const code = params.get('code') || '';
  const [eventId, setEventId] = useState('');
  const [alreadyPlus, setAlreadyPlus] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [paymentId, setPaymentId] = useState('');
  const [error, setError] = useState('');
  const [needLogin, setNeedLogin] = useState(false);

  useEffect(() => {
    if (!code) return;
    let cancelled = false;
    eventsApi
      .getByCode(code)
      .then((res) => {
        if (cancelled) return;
        const ev = res.data as any;
        setEventId(ev?._id || '');
        setAlreadyPlus(ev?.flashTier === 'plus');
      })
      .catch(() => {});
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

  return (
    <div className="min-h-screen bg-neutral-950 text-white" dir="rtl">
      <div className="max-w-md mx-auto px-6 py-14">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gold-primary/15 text-gold-primary text-xs font-bold mb-5">
              <Sparkles size={13} /> שדרוג
            </div>
            <h1 className="text-4xl font-black mb-3 leading-tight">פלאש+</h1>
            <p className="text-white/70 text-lg leading-relaxed">
              יותר צילומים, וידאו, וזיהוי פנים —<br />כל אורח מקבל את התמונות שלו.
            </p>
          </div>

          {/* Basic (free) */}
          <div className="rounded-2xl bg-white/5 ring-1 ring-white/10 p-5 mb-4">
            <div className="flex items-baseline justify-between mb-4">
              <span className="font-bold text-lg">פלאש</span>
              <span className="text-white/50 text-sm font-bold">חינם</span>
            </div>
            <ul className="space-y-2.5 text-sm">
              {BASIC_FEATURES.map((f) => (
                <li key={f.label} className="flex gap-2.5 text-white/70">
                  <Check size={17} className="text-white/40 shrink-0 mt-0.5" />
                  <span>{f.label}</span>
                </li>
              ))}
              <li className="flex gap-2.5 text-white/35">
                <X size={17} className="shrink-0 mt-0.5" />
                <span>ללא וידאו וללא זיהוי פנים</span>
              </li>
            </ul>
          </div>

          {/* פלאש+ (paid) */}
          <div className="rounded-2xl bg-gradient-to-b from-gold-primary/15 to-white/[0.03] ring-1 ring-gold-primary/30 p-6 mb-6">
            <div className="flex items-baseline justify-between mb-4">
              <span className="font-black text-xl">פלאש+</span>
              <span className="text-gold-primary font-black text-2xl">₪{FLASH_PLUS_PRICE}</span>
            </div>
            <ul className="space-y-2.5 text-sm">
              {PLUS_FEATURES.map((f) => (
                <li key={f.label} className="flex gap-2.5 text-white">
                  <f.icon size={17} className="text-gold-primary shrink-0 mt-0.5" />
                  <span>{f.label}</span>
                </li>
              ))}
            </ul>
          </div>

          {alreadyPlus ? (
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
              {submitting ? 'רגע…' : `שדרגו לפלאש+ · ₪${FLASH_PLUS_PRICE}`}
            </button>
          )}

          {error && <p className="text-red-400 text-sm text-center mt-4">{error}</p>}
          <p className="text-center text-white/35 text-xs mt-4">תשלום מאובטח דרך Sumit. חד-פעמי.</p>
        </motion.div>
      </div>
    </div>
  );
};

export default FlashPlus;

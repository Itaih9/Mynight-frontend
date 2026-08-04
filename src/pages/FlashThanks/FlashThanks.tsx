import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { paymentApi } from '@/services/api';
import { ROUTES } from '@/config/routes';

/**
 * Flash+ (code-in-link) payment return page. Sumit redirects here as
 * /flash/thanks?paymentId=<id>. We verify the payment publicly (no auth); on
 * approval the backend has already flipped the event to flashTier='plus'.
 */
type Status = 'verifying' | 'success' | 'failed';

export const FlashThanks = () => {
  const [params] = useSearchParams();
  const paymentId = params.get('paymentId') || '';
  const [status, setStatus] = useState<Status>('verifying');
  const [message, setMessage] = useState('');
  const [eventCode, setEventCode] = useState('');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!paymentId) {
        setStatus('failed');
        setMessage('לא נמצא מזהה תשלום.');
        return;
      }
      try {
        const res = await paymentApi.verifyFlashPlus(paymentId);
        const data = (res.data as any) || {};
        if (cancelled) return;
        setEventCode(data.eventCode || '');
        if (res.success && (data.flashTier === 'plus' || data.success)) {
          setStatus('success');
        } else {
          setStatus('failed');
          setMessage((res as any)?.message || data.message || 'התשלום לא הושלם.');
        }
      } catch (e: any) {
        if (!cancelled) {
          setStatus('failed');
          setMessage(e?.response?.data?.message || 'שגיאה באימות התשלום.');
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [paymentId]);

  const backHref = eventCode ? `${ROUTES.FLASH_PLUS}?code=${eventCode}` : ROUTES.FLASH_PLUS;

  return (
    <div className="min-h-screen bg-neutral-950 text-white flex flex-col items-center justify-center px-6 text-center" dir="rtl">
      {status === 'verifying' && (
        <>
          <div className="w-12 h-12 rounded-full border-4 border-white/20 border-t-gold-primary animate-spin mb-5" />
          <p className="text-white/70">מאמתים את התשלום…</p>
        </>
      )}

      {status === 'success' && (
        <div className="max-w-sm">
          <div className="text-5xl mb-4">🎉</div>
          <h1 className="text-3xl font-black mb-3">פלאש+ פעיל</h1>
          <p className="text-white/70 leading-relaxed mb-8">
            האירוע שלכם שודרג — וידאו, 24 צילומים לכל אורח, וזיהוי פנים לכל אורח.
            הכול מתפתח בבוקר שאחרי החתונה.
          </p>
          <Link
            to={backHref}
            className="block w-full py-4 rounded-2xl bg-gold-primary text-black font-black text-lg active:scale-[0.99] transition-transform"
          >
            חזרה לאירוע שלי
          </Link>
        </div>
      )}

      {status === 'failed' && (
        <div className="max-w-sm">
          <div className="text-5xl mb-4">😕</div>
          <h1 className="text-2xl font-black mb-3">התשלום לא הושלם</h1>
          <p className="text-white/60 mb-8">{message || 'אפשר לנסות שוב.'}</p>
          <Link
            to={backHref}
            className="block w-full py-4 rounded-2xl bg-white text-black font-black text-lg active:scale-[0.99] transition-transform"
          >
            חזרה לשדרוג
          </Link>
        </div>
      )}
    </div>
  );
};

export default FlashThanks;

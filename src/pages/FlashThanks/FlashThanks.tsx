import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { paymentApi } from '@/services/api';
import { ROUTES } from '@/config/routes';
import logoSvg from '@/assets/logo.svg';
// reuse the sign-up screen's stationery system so the funnel stays one design
import '../FlashRegister/FlashRegister.css';

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

  /* After paying, send them to their own event page (QR, link, print tips) —
     not back to the plan-picker, which they've just bought out of. */
  const backHref = eventCode ? `${ROUTES.FLASH_EVENT}?code=${eventCode}` : ROUTES.FLASH;
  const retryHref = eventCode ? `${ROUTES.FLASH_PLUS}?code=${eventCode}` : ROUTES.FLASH_PLUS;

  return (
    <div className="frg" dir="rtl">
      <div className="frg-col thanks-wrap">
        <img src={logoSvg} alt="My Night" className="frg-logo thanks-logo" />
      {status === 'verifying' && (
        <>
          <div className="w-12 h-12 rounded-full border-4 border-black/10 border-t-[#F5C518] animate-spin mb-5" />
          <p className="thanks-sub">מאמתים את התשלום…</p>
        </>
      )}

      {status === 'success' && (
        <div className="max-w-sm">
          <div className="text-5xl mb-4">🎉</div>
          <h1 className="thanks-h">פלאש+ פעיל</h1>
          <p className="thanks-sub">
            האירוע שלכם שודרג — וידאו, 24 צילומים לכל אורח, וזיהוי פנים לכל אורח.
            הכול מתפתח בבוקר שאחרי החתונה.
          </p>
          <Link
            to={backHref}
            className="btn thanks-btn"
          >
            חזרה לאירוע שלי
          </Link>
        </div>
      )}

      {status === 'failed' && (
        <div className="max-w-sm">
          <div className="text-5xl mb-4">😕</div>
          <h1 className="thanks-h">התשלום לא הושלם</h1>
          <p className="thanks-sub">{message || 'אפשר לנסות שוב.'}</p>
          <Link
            to={retryHref}
            className="btn thanks-btn"
          >
            חזרה לשדרוג
          </Link>
        </div>
      )}
      </div>
    </div>
  );
};

export default FlashThanks;

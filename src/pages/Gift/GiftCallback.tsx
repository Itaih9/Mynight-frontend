import { useEffect, useMemo, useState } from 'react';
import { useSearchParams, useLocation } from 'react-router-dom';
import { Navbar } from '@/components/common';
import { giftApi } from '@/services/api/gift.api';
import { Loader2, Check, Copy, Share2 } from 'lucide-react';

/**
 * Landing after the Sumit hosted payment page. Verifies the gift transaction,
 * mints the coupon, and shows the shareable success screen.
 */
export const GiftCallback = () => {
  const [params] = useSearchParams();
  const location = useLocation();
  const giftId = params.get('giftId') || '';
  // A free (100%-coupon) gift is finalized before navigating here and passed in
  // via router state, so no Sumit verification is needed.
  const preFinalized = (location.state as any)?.gift as
    | { couponCode: string; amount: number; coupleName?: string }
    | undefined;

  const [status, setStatus] = useState<'loading' | 'success' | 'failed'>(preFinalized ? 'success' : 'loading');
  const [error, setError] = useState('');
  const [result, setResult] = useState<{ couponCode: string; amount: number; coupleName?: string } | null>(preFinalized || null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (preFinalized) return;
    if (!giftId) {
      setStatus('failed');
      setError('חסר מזהה מתנה');
      return;
    }
    giftApi
      .verifyRedirect(giftId)
      .then((res) => {
        setResult(res.data!);
        setStatus('success');
      })
      .catch((e: any) => {
        setError(e?.response?.data?.error || e?.response?.data?.message || 'התשלום לא הושלם');
        setStatus('failed');
      });
  }, [giftId, preFinalized]);

  const giftLink = result ? `${window.location.origin}/gift/${result.couponCode}` : '';

  const whatsappText = useMemo(() => {
    if (!result) return '';
    const msg =
      `🎁 יש לכם מתנה מ-MyNight!\n` +
      `הכנתי לכם מתנה בשווי ₪${result.amount} לאלבום החתונה החכם שלכם — כל התמונות והסרטונים במקום אחד, וכל אורח מוצא את עצמו בסלפי אחד.\n` +
      `להפעלת המתנה: ${giftLink}\n` +
      `קוד המתנה: ${result.couponCode}`;
    return encodeURIComponent(msg);
  }, [result, giftLink]);

  const copyLink = async () => {
    try { await navigator.clipboard.writeText(giftLink); } catch { /* visible anyway */ }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-[#FAFAFA] flex flex-col" dir="rtl">
      <Navbar />
      <div className="flex-grow flex flex-col items-center justify-center px-4 py-10">
        <div className="w-full max-w-md text-center">
          {status === 'loading' && (
            <>
              <Loader2 className="animate-spin text-gold-primary mx-auto mb-4" size={40} />
              <p className="text-gray-500">מאמתים את התשלום…</p>
            </>
          )}

          {status === 'failed' && (
            <>
              <h1 className="text-2xl font-bold text-black mb-2">התשלום לא הושלם</h1>
              <p className="text-gray-500">{error}</p>
            </>
          )}

          {status === 'success' && result && (
            <>
              <div className="text-6xl mb-4">🎁</div>
              <h1 className="text-3xl font-bold text-black mb-2">המתנה נרכשה בהצלחה!</h1>
              <p className="text-gray-500 mb-8">
                רכשתם מתנה בשווי ₪{result.amount}{result.coupleName ? ` עבור ${result.coupleName}` : ''}. שלחו להם את הקישור כדי שיתחילו.
              </p>

              <div className="bg-white border-2 border-dashed border-gold-primary rounded-2xl p-5 mb-4">
                <p className="text-xs text-gray-400 mb-1">קוד המתנה</p>
                <p className="text-2xl font-black tracking-widest text-black" dir="ltr">{result.couponCode}</p>
              </div>

              <div className="flex gap-3">
                <button onClick={copyLink} className="flex-1 flex items-center justify-center gap-2 py-4 rounded-2xl border-2 border-gray-200 font-bold text-gray-700 hover:bg-gray-50">
                  {copied ? <><Check size={18} /> הועתק</> : <><Copy size={18} /> העתקת קישור</>}
                </button>
                <a href={`https://wa.me/?text=${whatsappText}`} target="_blank" rel="noopener noreferrer" className="flex-1 flex items-center justify-center gap-2 py-4 rounded-2xl bg-[#25D366] text-white font-bold hover:brightness-105">
                  <Share2 size={18} /> וואטסאפ
                </a>
              </div>
              <p className="text-gray-400 text-sm mt-6">המתנה תחכה להם עד שיפתחו אותה 💛</p>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default GiftCallback;

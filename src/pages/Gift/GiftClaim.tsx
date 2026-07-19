import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Navbar } from '@/components/common';
import { giftApi, type GiftInfo } from '@/services/api/gift.api';
import { ROUTES } from '@/config/routes';
import { GIFT_COUPON_KEY } from './giftData';
import { Loader2 } from 'lucide-react';

/**
 * What the couple sees when they open the gift link. Stores the coupon so it
 * auto-applies at their checkout, then sends them into registration.
 */
export const GiftClaim = () => {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();
  const [gift, setGift] = useState<GiftInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!code) return;
    giftApi
      .getByCode(code)
      .then((res) => setGift(res.data || null))
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [code]);

  const start = () => {
    if (code) sessionStorage.setItem(GIFT_COUPON_KEY, code.toUpperCase());
    navigate(ROUTES.REGISTER);
  };

  return (
    <div className="min-h-screen bg-[#FAFAFA] flex flex-col" dir="rtl">
      <Navbar />
      <div className="flex-grow flex flex-col items-center justify-center px-4">
        {loading ? (
          <Loader2 className="animate-spin text-gold-primary" size={40} />
        ) : notFound || !gift ? (
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-2">המתנה לא נמצאה</h1>
            <p className="text-gray-500">ייתכן שהקישור שגוי. בדקו את הקוד ונסו שוב.</p>
          </div>
        ) : gift.redeemed ? (
          <div className="text-center">
            <div className="text-5xl mb-4">🎁</div>
            <h1 className="text-2xl font-bold mb-2">המתנה כבר מומשה</h1>
            <p className="text-gray-500">נראה שכבר השתמשתם במתנה הזו.</p>
          </div>
        ) : (
          <div className="w-full max-w-md text-center">
            <div className="text-6xl mb-4">🎁</div>
            <h1 className="text-3xl md:text-4xl font-bold text-black mb-4">קיבלתם מתנה!</h1>
            <p className="text-gray-600 leading-relaxed mb-6">
              מישהו שאוהב אתכם רכש עבורכם את <b>MyNight</b> — האלבום החכם שאוסף את כל התמונות והסרטונים מהחתונה שלכם, ומאפשר לכל אורח למצוא את עצמו בסלפי אחד.
            </p>
            {gift.message && (
              <div className="bg-white border-r-4 border-gold-primary rounded-xl p-4 mb-6 text-right text-gray-700 italic">
                "{gift.message}"
              </div>
            )}
            <div className="bg-gold-primary/10 rounded-2xl py-4 mb-8">
              <p className="text-sm text-gray-500">שווי המתנה</p>
              <p className="text-3xl font-black text-black">₪{gift.amount}</p>
            </div>
            <button
              onClick={start}
              className="w-full bg-gradient-to-r from-gold-primary to-gold-secondary text-white font-bold text-xl py-5 rounded-2xl shadow-xl hover:brightness-105 active:scale-[0.98] transition-all"
            >
              פתיחת המתנה
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default GiftClaim;

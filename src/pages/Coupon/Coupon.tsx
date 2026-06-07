import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Ticket, Copy, Check, Share2, Loader2 } from 'lucide-react';
import { couponApi } from '@/services/api';

const Coupon: React.FC = () => {
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);
  const [code, setCode] = useState('');
  const [discountAmount, setDiscountAmount] = useState<number>(100);
  const [usedCount, setUsedCount] = useState(0);
  const [maxUses, setMaxUses] = useState(3);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    couponApi.getMyPersonal()
      .then((res) => {
        if (cancelled || !res.data) return;
        setCode(res.data.code);
        if (res.data.discountAmount) setDiscountAmount(res.data.discountAmount);
        setUsedCount(res.data.usedCount || 0);
        setMaxUses(res.data.maxUses || 3);
      })
      .catch(() => {
        if (!cancelled) setError('לא ניתן לטעון את קוד הקופון כרגע');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  const remainingUses = Math.max(0, maxUses - usedCount);

  const handleBack = () => {
    navigate(-1);
  };

  const handleCopy = () => {
    if (!code) return;
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = () => {
    if (!code) return;
    const text = `עפנו על האלבום החכם של My Night בחתונה שלנו - ורצינו לדאוג שתחוו גם את הקסם. קבלו קופון של ${discountAmount}₪ מאיתנו. מזל טוב!!\n\nקוד קופון: ${code}\nhttps://mynight.co.il`;
    const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center p-6 text-right" dir="rtl">
      <div className="max-w-md w-full space-y-8 animate-fade-in">
        <div className="flex flex-col items-center gap-6 text-center">
          <div className="w-20 h-20 bg-gold-primary/10 text-gold-primary rounded-3xl flex items-center justify-center">
            <Ticket size={40} strokeWidth={1.5} />
          </div>
          <div className="space-y-2">
            <h1 className="text-3xl font-bold text-black">קופון אישי</h1>
            <p className="text-gray-500 text-lg">החברים מתחתנים? שתפו את הקוד האישי והעבירו להם מתנה מוקדמת בשווי {discountAmount}₪ (מוגבל ל-{maxUses} מימושים)</p>
          </div>
        </div>

        <div className="bg-gray-50 border-2 border-dashed border-gray-200 rounded-2xl p-8 flex flex-col items-center gap-4 relative overflow-hidden">
          <p className="text-sm font-medium text-gray-400 uppercase tracking-widest">קוד הקופון שלכם</p>
          {loading ? (
            <Loader2 size={32} className="animate-spin text-gray-400 my-2" />
          ) : error ? (
            <p className="text-red-500 text-sm font-medium">{error}</p>
          ) : (
            <>
              <p className="text-4xl font-mono font-bold text-black tracking-wider">{code}</p>
              <p className="text-xs text-gray-400 font-medium">נוצלו {usedCount} מתוך {maxUses} ({remainingUses} נותרו)</p>
            </>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <button
            onClick={handleCopy}
            disabled={!code || loading}
            className={`flex flex-row-reverse items-center justify-center gap-2 py-4 rounded-xl font-bold text-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed ${copied ? 'bg-green-500 text-white' : 'bg-black text-white hover:bg-gray-800'}`}
          >
            {copied ? <Check size={20} /> : <Copy size={20} />}
            <span className="whitespace-nowrap">{copied ? 'הועתק!' : 'העתקה'}</span>
          </button>

          <button
            onClick={handleShare}
            disabled={!code || loading}
            className="flex flex-row-reverse items-center justify-center gap-2 py-4 px-2 rounded-xl font-bold text-base bg-gray-100 text-black hover:bg-gray-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Share2 size={20} className="shrink-0" />
            <span className="whitespace-nowrap">שיתוף בוואטסאפ</span>
          </button>
        </div>

        <button
          onClick={handleBack}
          className="w-full text-gray-400 hover:text-black font-medium flex items-center justify-center gap-2 pt-4 transition-colors"
        >
          <ArrowRight size={20} />
          <span>חזרה לגלריה</span>
        </button>
      </div>
    </div>
  );
};

export default Coupon;

import { useState } from 'react';
import { Navbar } from '@/components/common';
import { Packages } from '@/components/mobile-landing/Packages';
import { giftApi } from '@/services/api/gift.api';
import { couponApi } from '@/services/api';
import { SUGGESTED_AMOUNTS } from './giftData';
import { Loader2, Check, Lock } from 'lucide-react';

type Step = 'select' | 'details' | 'checkout';
type Mode = 'amount' | 'package';

// Package key -> the canonical Hebrew name stored on events (event.packageName),
// so a full-package gift's coupon restriction matches the couple's package.
const KEY_TO_PACKAGE_NAME: Record<string, string> = {
  starter: 'האוספת',
  smart: 'החכמה',
  unlimited: 'המושלמת',
};

export const Gift = () => {
  const [step, setStep] = useState<Step>('select');
  const [mode, setMode] = useState<Mode>('amount');
  const [amount, setAmount] = useState<number | null>(null);
  // For a full-package gift: the chosen package's Hebrew name + price.
  const [pkg, setPkg] = useState<{ name: string; price: number } | null>(null);

  const [coupleName, setCoupleName] = useState('');
  const [gifterEmail, setGifterEmail] = useState('');
  const [message, setMessage] = useState('');

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  // Coupon on the pre-payment page (discounts what the gifter pays).
  const [coupon, setCoupon] = useState('');
  const [couponApplied, setCouponApplied] = useState(false);
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponError, setCouponError] = useState(false);
  const [savings, setSavings] = useState(0);

  const giftValue = mode === 'amount' ? amount : pkg?.price ?? null;
  const total = Math.max(0, (giftValue ?? 0) - savings);

  const goToDetails = () => setStep('details');

  const applyCoupon = async () => {
    if (!coupon.trim() || !giftValue) return;
    setCouponLoading(true);
    setCouponError(false);
    try {
      const res = await couponApi.validate({ code: coupon.trim(), packageName: mode === 'package' ? pkg?.name : undefined });
      const d = res.data;
      if (d?.valid && ((d.discountAmount && d.discountAmount > 0) || (d.discountPercent && d.discountPercent > 0))) {
        const fixed = d.discountAmount && d.discountAmount > 0 ? Math.min(d.discountAmount, giftValue) : 0;
        const off = fixed > 0 ? fixed : Math.round((giftValue * (d.discountPercent || 0)) / 100 * 100) / 100;
        setSavings(off);
        setCouponApplied(true);
      } else {
        setCouponError(true);
        setSavings(0);
        setCouponApplied(false);
      }
    } catch {
      setCouponError(true);
      setSavings(0);
      setCouponApplied(false);
    } finally {
      setCouponLoading(false);
    }
  };

  const pay = async () => {
    if (!giftValue || !coupleName.trim()) {
      setError('נא למלא את שמות הזוג');
      return;
    }
    setError('');
    setBusy(true);
    try {
      const created = await giftApi.create({
        amount: giftValue,
        packageName: mode === 'package' ? pkg?.name : undefined,
        coupleName: coupleName.trim(),
        gifterEmail: gifterEmail.trim() || undefined,
        message: message.trim() || undefined,
        couponCode: couponApplied ? coupon.trim() : undefined,
      });
      const { redirectUrl } = (await giftApi.beginRedirect(created.data!.giftId)).data!;
      // Hand off to Sumit's hosted payment page; return lands on /gift-callback.
      window.location.href = redirectUrl;
    } catch (e: any) {
      setError(e?.response?.data?.error || e?.response?.data?.message || e?.message || 'שגיאה במעבר לתשלום');
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAFAFA] flex flex-col" dir="rtl">
      <Navbar />
      <div className="flex-grow flex flex-col items-center px-4 py-8 md:py-14">
        <div className="w-full max-w-lg">

          {step === 'select' && (
            <>
              <h1 className="text-3xl md:text-4xl font-bold text-black text-center mb-6">בחרו את המתנה 🎁</h1>
              <div className="relative flex bg-gray-100 rounded-full p-1.5 mb-8 select-none">
                <span
                  className="absolute top-1.5 bottom-1.5 w-[calc(50%-6px)] rounded-full bg-white shadow-md transition-transform duration-300"
                  style={{ transform: mode === 'amount' ? 'translateX(0)' : 'translateX(-100%)' }}
                />
                <button onClick={() => setMode('amount')} className={`relative z-10 flex-1 py-3 rounded-full font-bold ${mode === 'amount' ? 'text-black' : 'text-gray-400'}`}>סכום</button>
                <button onClick={() => setMode('package')} className={`relative z-10 flex-1 py-3 rounded-full font-bold ${mode === 'package' ? 'text-black' : 'text-gray-400'}`}>חבילה מלאה</button>
              </div>

              {mode === 'amount' ? (
                <>
                  <div className="grid grid-cols-2 gap-3 mb-8">
                    {SUGGESTED_AMOUNTS.map((a) => (
                      <button
                        key={a}
                        onClick={() => setAmount(a)}
                        className={`py-6 rounded-2xl text-2xl font-black border-2 transition-all ${amount === a ? 'border-gold-primary bg-gold-primary/10 text-black' : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'}`}
                      >
                        ₪{a}
                      </button>
                    ))}
                  </div>
                  <button
                    disabled={!amount}
                    onClick={goToDetails}
                    className="w-full bg-black text-white font-bold text-lg py-4 rounded-2xl disabled:opacity-40 hover:bg-gray-900 transition"
                  >
                    המשך
                  </button>
                </>
              ) : (
                // Reuse the landing package selector; choosing a package advances.
                <div className="-mx-4">
                  <Packages
                    onChoosePackage={(key, price) => {
                      setPkg({ name: KEY_TO_PACKAGE_NAME[key] || key, price });
                      goToDetails();
                    }}
                  />
                </div>
              )}
            </>
          )}

          {step === 'details' && (
            <>
              <h1 className="text-3xl font-bold text-black text-center mb-2">פרטי המתנה</h1>
              <p className="text-center text-gray-500 mb-8">מתנה בשווי ₪{giftValue}</p>
              <label className="block text-sm font-medium text-gray-700 mb-1">שמות הזוג</label>
              <input value={coupleName} onChange={(e) => setCoupleName(e.target.value)} placeholder="נועה ואיתי" className="w-full px-4 py-3 mb-4 rounded-2xl border border-gray-200 focus:border-gold-primary outline-none" />
              <label className="block text-sm font-medium text-gray-700 mb-1">האימייל שלכם (לקבלה)</label>
              <input value={gifterEmail} onChange={(e) => setGifterEmail(e.target.value)} type="email" placeholder="name@example.com" className="w-full px-4 py-3 mb-4 rounded-2xl border border-gray-200 focus:border-gold-primary outline-none" />
              <label className="block text-sm font-medium text-gray-700 mb-1">הודעה אישית (אופציונלי)</label>
              <textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={3} placeholder="מזל טוב! מתנה קטנה ליום הגדול 💛" className="w-full px-4 py-3 mb-6 rounded-2xl border border-gray-200 focus:border-gold-primary outline-none resize-none" />
              {error && <p className="text-red-600 text-sm mb-4 text-center">{error}</p>}
              <div className="flex gap-3">
                <button onClick={() => setStep('select')} className="flex-1 py-4 rounded-2xl border border-gray-200 font-bold text-gray-600">חזרה</button>
                <button
                  onClick={() => { if (!coupleName.trim()) { setError('נא למלא את שמות הזוג'); return; } setError(''); setStep('checkout'); }}
                  className="flex-[2] bg-black text-white font-bold py-4 rounded-2xl hover:bg-gray-900"
                >
                  לתשלום
                </button>
              </div>
            </>
          )}

          {step === 'checkout' && (
            <>
              <div className="text-center mb-6">
                <h1 className="text-3xl font-bold text-black mb-2">תשלום מאובטח</h1>
                <p className="text-gray-500">דף תשלום מאובטח של Sumit — פרטי הכרטיס לא נשמרים אצלנו</p>
              </div>

              <div className="bg-gray-50 p-6 rounded-3xl border border-gray-100 flex justify-between items-center mb-6">
                <h3 className="font-black text-black text-xl">{mode === 'package' ? `החבילה ${pkg?.name}` : 'מתנה'}</h3>
                <p className="text-3xl font-black text-black">₪{giftValue}</p>
              </div>

              <label className="block text-sm font-bold text-gray-400 mb-2 pr-1">קוד קופון (אם יש)</label>
              <div className="flex gap-3 mb-2">
                <input
                  value={coupon}
                  onChange={(e) => { setCoupon(e.target.value); if (couponError) setCouponError(false); }}
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), applyCoupon())}
                  placeholder="הכנס קוד"
                  className={`flex-grow px-5 py-4 rounded-2xl border bg-gray-50 focus:bg-white outline-none text-right ${couponError ? 'border-red-500' : 'border-gray-100 focus:border-black'}`}
                />
                <button
                  onClick={applyCoupon}
                  disabled={couponLoading || !coupon.trim()}
                  className={`px-6 rounded-2xl font-bold min-w-[130px] flex items-center justify-center ${couponApplied ? 'bg-green-500 text-white' : (!coupon.trim() ? 'bg-gray-200 text-gray-400' : 'bg-black text-white hover:bg-gray-800')}`}
                >
                  {couponLoading ? <Loader2 className="animate-spin w-5 h-5" /> : couponApplied ? <Check size={18} /> : 'הפעלת קופון'}
                </button>
              </div>
              {couponApplied && <p className="text-green-600 font-bold text-sm mb-2 text-right">חסכתם {savings} שקלים עם הקופון!</p>}
              {couponError && <p className="text-red-500 font-bold text-sm mb-2 text-right">אופס! הקופון לא עבר. נסו קוד אחר.</p>}

              <div className="mt-6 flex justify-between items-center bg-gray-50 p-5 rounded-2xl border border-gray-100 mb-6">
                <span className="font-bold text-gray-600 text-lg">סה"כ לתשלום:</span>
                <span className="font-black text-3xl text-black">₪{total}</span>
              </div>

              {error && <p className="text-red-600 text-sm mb-4 text-center">{error}</p>}

              <button
                onClick={pay}
                disabled={busy}
                className="w-full bg-gradient-to-r from-gold-primary to-gold-secondary text-white font-bold text-xl py-5 rounded-2xl shadow-lg flex items-center justify-center gap-3 disabled:opacity-60"
              >
                {busy ? <Loader2 className="animate-spin" /> : <><span>המשך לתשלום מאובטח</span><Lock size={22} /></>}
              </button>
              <button onClick={() => setStep('details')} className="w-full mt-3 text-gray-500 text-sm">חזרה</button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Gift;

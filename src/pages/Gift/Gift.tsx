import { useState } from 'react';
import { Navbar } from '@/components/common';
import { Packages } from '@/components/mobile-landing/Packages';
import { giftApi } from '@/services/api/gift.api';
import { SUGGESTED_AMOUNTS } from './giftData';
import { Loader2 } from 'lucide-react';

type Step = 'select' | 'details';
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

  const giftValue = mode === 'amount' ? amount : pkg?.price ?? null;

  const goToDetails = () => setStep('details');

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
                <button onClick={pay} disabled={busy} className="flex-[2] bg-gradient-to-r from-gold-primary to-gold-secondary text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-2 disabled:opacity-60">
                  {busy ? <Loader2 className="animate-spin" size={22} /> : 'לתשלום'}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Gift;

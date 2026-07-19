import { useEffect, useMemo, useState } from 'react';
import { Navbar } from '@/components/common';
import { packagesApi } from '@/services/api';
import { giftApi } from '@/services/api/gift.api';
import { tokenizeCard } from '@/services/sumit';
import { ROUTES } from '@/config/routes';
import { SUGGESTED_AMOUNTS, PACKAGE_FEATURES } from './giftData';
import { Loader2, Check, Copy, Share2 } from 'lucide-react';

type Step = 'select' | 'details' | 'pay' | 'success';
type Mode = 'amount' | 'package';

interface Pkg {
  key: string;
  title: string;
  englishTitle: string;
  price: number;
}

export const Gift = () => {
  const [step, setStep] = useState<Step>('select');
  const [mode, setMode] = useState<Mode>('amount');
  const [amount, setAmount] = useState<number | null>(null);
  const [selectedPkg, setSelectedPkg] = useState<Pkg | null>(null);
  const [packages, setPackages] = useState<Pkg[]>([]);

  const [coupleName, setCoupleName] = useState('');
  const [gifterEmail, setGifterEmail] = useState('');
  const [message, setMessage] = useState('');

  const [card, setCard] = useState({ number: '', exp: '', cvv: '' });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const [result, setResult] = useState<{ couponCode: string; amount: number } | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    packagesApi
      .getPublic()
      .then((res) => setPackages((res.data || []) as Pkg[]))
      .catch(() => {});
  }, []);

  const giftValue = mode === 'amount' ? amount : selectedPkg?.price ?? null;
  const giftLink = result ? `${window.location.origin}/gift/${result.couponCode}` : '';

  const canProceedSelect = mode === 'amount' ? !!amount : !!selectedPkg;

  const startPayment = async () => {
    if (!giftValue || !coupleName.trim()) {
      setError('נא למלא את שמות הזוג');
      return;
    }
    setError('');
    setStep('pay');
  };

  const pay = async () => {
    setError('');
    if (!giftValue) return;
    const [mm, yy] = card.exp.split('/').map((s) => s.trim());
    if (!card.number || !mm || !yy || !card.cvv) {
      setError('נא למלא את פרטי האשראי');
      return;
    }
    setBusy(true);
    try {
      const created = await giftApi.create({
        amount: giftValue,
        packageName: mode === 'package' ? PACKAGE_FEATURES[selectedPkg!.englishTitle]?.hebrewName : undefined,
        coupleName: coupleName.trim(),
        gifterEmail: gifterEmail.trim() || undefined,
        message: message.trim() || undefined,
      });
      const data = created.data!;
      const { token } = await tokenizeCard({
        companyId: data.companyId!,
        publicKey: data.publicKey!,
        cardNumber: card.number,
        expirationMonth: Number(mm),
        expirationYear: Number(yy.length === 2 ? `20${yy}` : yy),
        cvv: card.cvv,
      });
      const charged = await giftApi.charge(data.giftId, token);
      setResult({ couponCode: charged.data!.couponCode, amount: charged.data!.amount });
      setStep('success');
    } catch (e: any) {
      setError(e?.response?.data?.error || e?.response?.data?.message || e?.message || 'התשלום נכשל');
    } finally {
      setBusy(false);
    }
  };

  const copyLink = async () => {
    try { await navigator.clipboard.writeText(giftLink); } catch { /* visible anyway */ }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const whatsappText = useMemo(() => {
    if (!result) return '';
    const msg =
      `🎁 יש לכם מתנה מ-MyNight!\n` +
      `הכנתי לכם מתנה בשווי ₪${result.amount} לאלבום החתונה החכם שלכם — כל התמונות והסרטונים במקום אחד, וכל אורח מוצא את עצמו בסלפי אחד.\n` +
      `להפעלת המתנה: ${giftLink}\n` +
      `קוד המתנה: ${result.couponCode}`;
    return encodeURIComponent(msg);
  }, [result, giftLink]);

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
              ) : (
                <div className="space-y-3 mb-8">
                  {packages.map((p) => {
                    const feat = PACKAGE_FEATURES[p.englishTitle];
                    const active = selectedPkg?.key === p.key;
                    return (
                      <button
                        key={p.key}
                        onClick={() => setSelectedPkg(p)}
                        className={`w-full text-right p-5 rounded-2xl border-2 transition-all ${active ? 'border-gold-primary bg-gold-primary/5' : 'border-gray-200 bg-white hover:border-gray-300'}`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xl font-bold text-black">{p.title}</span>
                          <span className="text-xl font-black text-gold-primary">₪{p.price}</span>
                        </div>
                        {feat && (
                          <ul className="space-y-1">
                            {feat.features.map((f, i) => (
                              <li key={i} className="flex items-center gap-2 text-sm text-gray-600">
                                <Check size={14} className="text-gold-primary shrink-0" /> {f}
                              </li>
                            ))}
                          </ul>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}

              <button
                disabled={!canProceedSelect}
                onClick={() => setStep('details')}
                className="w-full bg-black text-white font-bold text-lg py-4 rounded-2xl disabled:opacity-40 hover:bg-gray-900 transition"
              >
                המשך
              </button>
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
                <button onClick={startPayment} className="flex-[2] bg-black text-white font-bold py-4 rounded-2xl hover:bg-gray-900">לתשלום</button>
              </div>
            </>
          )}

          {step === 'pay' && (
            <>
              <h1 className="text-3xl font-bold text-black text-center mb-2">תשלום מאובטח</h1>
              <p className="text-center text-gray-500 mb-8">מתנה בשווי ₪{giftValue}</p>
              <label className="block text-sm font-medium text-gray-700 mb-1">מספר כרטיס</label>
              <input value={card.number} onChange={(e) => setCard({ ...card, number: e.target.value })} inputMode="numeric" placeholder="0000 0000 0000 0000" dir="ltr" className="w-full px-4 py-3 mb-4 rounded-2xl border border-gray-200 focus:border-gold-primary outline-none text-left" />
              <div className="flex gap-3 mb-6">
                <input value={card.exp} onChange={(e) => setCard({ ...card, exp: e.target.value })} placeholder="MM/YY" dir="ltr" className="flex-1 px-4 py-3 rounded-2xl border border-gray-200 focus:border-gold-primary outline-none text-left" />
                <input value={card.cvv} onChange={(e) => setCard({ ...card, cvv: e.target.value })} inputMode="numeric" placeholder="CVV" dir="ltr" className="flex-1 px-4 py-3 rounded-2xl border border-gray-200 focus:border-gold-primary outline-none text-left" />
              </div>
              {error && <p className="text-red-600 text-sm mb-4 text-center">{error}</p>}
              <button onClick={pay} disabled={busy} className="w-full bg-gradient-to-r from-gold-primary to-gold-secondary text-white font-bold text-lg py-4 rounded-2xl flex items-center justify-center gap-2 disabled:opacity-60">
                {busy ? <Loader2 className="animate-spin" size={22} /> : `שלם ₪${giftValue}`}
              </button>
              <button onClick={() => setStep('details')} className="w-full mt-3 text-gray-500 text-sm">חזרה</button>
            </>
          )}

          {step === 'success' && result && (
            <div className="text-center">
              <div className="text-6xl mb-4">🎁</div>
              <h1 className="text-3xl font-bold text-black mb-2">המתנה נרכשה בהצלחה!</h1>
              <p className="text-gray-500 mb-8">רכשתם מתנה בשווי ₪{result.amount} עבור {coupleName}. שלחו להם את הקישור כדי שיתחילו.</p>

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
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Gift;

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Camera, Check, Copy, Sparkles } from 'lucide-react';
import { eventsApi, type FlashRegisterResult } from '@/services/api/events.api';

/**
 * Free פלאש landing + signup — the top of the lead funnel.
 *
 * Deliberately its own page rather than a tier on /packages: couples arrive here
 * from ads and from פלאש links seen at other weddings, sign up free, and only
 * then meet the paid Here I Am upsell (here, by email, and in the dashboard).
 */
export const Flash = () => {
  const [coupleName, setCoupleName] = useState('');
  const [weddingDate, setWeddingDate] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<FlashRegisterResult | null>(null);
  const [copied, setCopied] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const res = await eventsApi.registerFlash({
        coupleName: coupleName.trim(),
        weddingDate,
        phoneNumber: phoneNumber.trim(),
        email: email.trim() || undefined,
      });
      setResult(res.data!);
    } catch (err: any) {
      setError(err?.response?.data?.error || 'משהו השתבש, נסו שוב');
    } finally {
      setSubmitting(false);
    }
  };

  const copyLink = async () => {
    if (!result) return;
    try {
      await navigator.clipboard.writeText(result.cameraUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { /* clipboard blocked — the link is on screen anyway */ }
  };

  // ---- Success: hand them the link, then pitch Here I Am ----
  if (result) {
    return (
      <div className="min-h-screen bg-neutral-950 text-white flex flex-col items-center px-6 py-14" dir="rtl">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md text-center"
        >
          <div className="text-5xl mb-4">📸</div>
          <h1 className="text-3xl font-black mb-2">פלאש שלכם מוכן</h1>
          <p className="text-white/60 mb-8">
            שתפו את הקישור עם האורחים ביום החתונה. כל אורח מקבל {result.shotLimit} צילומים.
          </p>

          <div className="rounded-2xl bg-white/5 ring-1 ring-white/10 p-5 mb-4 text-right">
            <p className="text-white/40 text-xs mb-2">הקישור לאורחים</p>
            <p className="text-white text-sm break-all mb-4" dir="ltr">{result.cameraUrl}</p>
            <button
              onClick={copyLink}
              className="w-full py-3 rounded-xl bg-white text-black font-bold flex items-center justify-center gap-2 active:scale-[0.99] transition-transform"
            >
              {copied ? <><Check size={18} /> הועתק</> : <><Copy size={18} /> העתקת הקישור</>}
            </button>
          </div>

          <p className="text-white/40 text-xs mb-10">
            שמרו את הקישור — שלחנו אותו גם למייל. הצילומים מתפתחים בבוקר שאחרי החתונה.
          </p>

          {/* The upsell — free covers the shooting, this is the smart layer */}
          <div className="rounded-2xl bg-gradient-to-b from-white/10 to-white/[0.03] ring-1 ring-white/15 p-6 text-right">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles size={18} className="text-gold-primary" />
              <span className="font-bold text-lg">רוצים שכל אורח יקבל את התמונות שלו?</span>
            </div>
            <p className="text-white/65 text-sm leading-relaxed mb-4">
              פלאש אוסף את הצילומים. <strong className="text-white">Here I Am</strong> מוסיף זיהוי פנים —
              כל אורח מקבל אלבום אישי רק עם התמונות שהוא מופיע בהן, כולל התמונות מהצלם המקצועי.
            </p>
            <a
              href="/packages"
              className="block w-full py-3.5 rounded-xl bg-gold-primary text-black font-bold text-center active:scale-[0.99] transition-transform"
            >
              לפרטים על Here I Am
            </a>
          </div>
        </motion.div>
      </div>
    );
  }

  // ---- Signup ----
  return (
    <div className="min-h-screen bg-neutral-950 text-white" dir="rtl">
      <div className="max-w-md mx-auto px-6 py-14">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-xs font-bold mb-5">
              <Camera size={13} /> חינם לחלוטין
            </div>
            <h1 className="text-4xl font-black mb-3 leading-tight">פלאש</h1>
            <p className="text-white/70 text-lg leading-relaxed">
              מצלמה חד-פעמית לכל אורח בחתונה שלכם.
              <br />16 צילומים, בלי לראות, בלי לחזור אחורה.
            </p>
          </div>

          <div className="rounded-2xl bg-white/5 ring-1 ring-white/10 p-5 mb-8">
            <ul className="space-y-3 text-sm text-white/75">
              {[
                'האורחים סורקים קישור — בלי להתקין שום אפליקציה',
                'כל אורח מקבל 16 צילומים בלבד. כל צילום נחשב',
                'הכל מתפתח בבוקר שאחרי — וכל התמונות שלכם',
              ].map((t) => (
                <li key={t} className="flex gap-2.5">
                  <Check size={17} className="text-gold-primary shrink-0 mt-0.5" />
                  <span>{t}</span>
                </li>
              ))}
            </ul>
          </div>

          <form onSubmit={submit} className="space-y-4">
            <Field label="שמות בני הזוג" value={coupleName} onChange={setCoupleName} placeholder="דנה & יואב" required />
            <Field label="תאריך החתונה" value={weddingDate} onChange={setWeddingDate} type="date" required />
            <Field label="טלפון" value={phoneNumber} onChange={setPhoneNumber} type="tel" placeholder="050-0000000" required />
            <Field label="אימייל (לשליחת הקישור)" value={email} onChange={setEmail} type="email" placeholder="you@example.com" />

            {error && <p className="text-red-400 text-sm text-center">{error}</p>}

            <button
              type="submit"
              disabled={submitting || !coupleName.trim() || !weddingDate || !phoneNumber.trim()}
              className="w-full py-4 rounded-2xl bg-white text-black font-black text-lg disabled:opacity-40 active:scale-[0.99] transition-transform"
            >
              {submitting ? 'רגע…' : 'קבלו פלאש בחינם'}
            </button>
            <p className="text-center text-white/35 text-xs">
              בלי כרטיס אשראי. בלי התחייבות.
            </p>
          </form>
        </motion.div>
      </div>
    </div>
  );
};

const Field = ({
  label, value, onChange, type = 'text', placeholder, required,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
  required?: boolean;
}) => (
  <label className="block">
    <span className="block text-sm text-white/60 mb-1.5">{label}</span>
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      required={required}
      className="w-full px-4 py-3.5 rounded-xl bg-white/10 border border-white/15 text-white outline-none focus:border-white/40 transition-colors"
    />
  </label>
);

export default Flash;

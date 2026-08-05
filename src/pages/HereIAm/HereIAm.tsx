import { useState } from 'react';
import { motion } from 'framer-motion';
import { Check, ScanFace, Camera, Send } from 'lucide-react';
import { contactApi } from '@/services/api/contact.api';

/**
 * Dedicated product page for the Here I Am package (החכמה).
 *
 * Single-product on purpose — it's the destination for every upsell CTA (the
 * פלאש success screen, the popup, and the pre-wedding emails), so it never
 * competes with the other tiers. No price shown: this captures a lead through
 * the existing contact endpoint and the sale is closed by hand.
 */
/** Guest photos that float behind the woman, same set as the mobile-landing hero. */
const FLOATING_SHOTS = [
  'https://d1sayt91mdit04.cloudfront.net/static/landing/upsell-smiling.jpg',
  'https://d1sayt91mdit04.cloudfront.net/static/landing/QMjzvJk9.png',
  'https://d1sayt91mdit04.cloudfront.net/static/landing/upsell-hugging.jpg',
  'https://d1sayt91mdit04.cloudfront.net/static/landing/vmGKCtLq.png',
];

export const HereIAm = () => {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [weddingDate, setWeddingDate] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSending(true);
    try {
      await contactApi.submit({
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim(),
        // Distinctive subject so these are filterable in the admin inbox.
        subject: 'ליד — Here I Am',
        message: `בקשת פרטים על Here I Am\nשם: ${name.trim()}\nטלפון: ${phone.trim()}\nתאריך חתונה: ${weddingDate || 'לא צוין'}`,
      });
      setSent(true);
    } catch (err: any) {
      setError(err?.response?.data?.error || 'משהו השתבש, נסו שוב');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="min-h-screen bg-white text-charcoal" dir="rtl">
      {/* ---- Hero ---- */}
      <section className="relative overflow-hidden bg-gradient-to-b from-[#faf7f2] to-white">
        <div className="max-w-6xl mx-auto px-6 pt-16 pb-0 md:pt-24 grid md:grid-cols-2 gap-8 items-end">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="pb-16 md:pb-28"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gold-primary/15 text-[13px] font-bold text-charcoal mb-5">
              <ScanFace size={14} /> החבילה החכמה של My Night
            </div>
            <h1 className="text-4xl md:text-5xl font-black leading-[1.15] mb-5">
              כל אורח מקבל
              <br />
              <span className="text-gold-primary">רק את התמונות שלו</span>
            </h1>
            <p className="text-lg text-gray-800/70 leading-relaxed mb-8 max-w-lg">
              זיהוי פנים סורק את כל התמונות מהחתונה — מהאורחים ומהצלם המקצועי — ושולח
              לכל אחד אלבום אישי רק עם התמונות שהוא מופיע בהן.
            </p>
            <a
              href="#lead"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-full bg-charcoal text-white font-bold text-lg hover:opacity-90 active:scale-[0.99] transition-all"
            >
              רוצה פרטים <Send size={18} />
            </a>
          </motion.div>

          <div className="relative flex items-end justify-center min-h-[320px] md:min-h-[460px]">
            {/* guest photos floating behind her — same motif as the mobile hero */}
            <div className="pointer-events-none absolute inset-0" aria-hidden="true">
              {FLOATING_SHOTS.map((src, i) => (
                <motion.img
                  key={src}
                  src={src}
                  alt=""
                  loading="lazy"
                  initial={{ opacity: 0, y: 18, rotate: [-10, 8, -6, 10][i] }}
                  animate={{ opacity: 1, y: 0, rotate: [-10, 8, -6, 10][i] }}
                  transition={{ delay: 0.25 + i * 0.1, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                  className="absolute w-[92px] md:w-[122px] rounded-xl shadow-[0_18px_38px_-14px_rgba(0,0,0,0.32)] ring-1 ring-black/5"
                  style={[
                    { top: '6%', right: '4%' },
                    { top: '18%', left: '2%' },
                    { bottom: '24%', right: '0%' },
                    { bottom: '10%', left: '6%' },
                  ][i]}
                />
              ))}
            </div>
            <img
              src="/images/woman-holding-phone.png"
              alt="אישה מחזיקה טלפון עם האלבום האישי"
              loading="eager"
              decoding="async"
              fetchPriority="high"
              className="relative z-[1] object-contain max-h-[460px] w-auto drop-shadow-[0_42px_72px_rgba(0,0,0,0.14)]"
            />
          </div>
        </div>
      </section>

      {/* ---- What it does ---- */}
      <section className="max-w-5xl mx-auto px-6 py-16 md:py-20">
        <h2 className="text-2xl md:text-3xl font-black text-center mb-10">מה נכנס לזיהוי הפנים</h2>
        <div className="grid md:grid-cols-3 gap-5">
          {[
            { icon: Camera, title: 'התמונות מהאורחים', text: 'כל מה שמאות האורחים צילמו במהלך הערב — מכל הזוויות שהצלם לא היה בהן.' },
            { icon: ScanFace, title: 'התמונות מהצלם', text: 'גם הסט המקצועי נסרק, כך שכל אורח מוצא את עצמו גם בתמונות הצלם.' },
            { icon: Send, title: 'אלבום אישי לכל אחד', text: 'כל אורח מקבל לנייד אלבום שמכיל רק את התמונות שהוא מופיע בהן. בלי לחפש.' },
          ].map(({ icon: Icon, title, text }) => (
            <div key={title} className="rounded-2xl border border-gray-200 p-6">
              <Icon size={22} className="text-gold-primary mb-3" />
              <h3 className="font-bold text-lg mb-2">{title}</h3>
              <p className="text-gray-800/65 text-[15px] leading-relaxed">{text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ---- Included ---- */}
      <section className="bg-[#faf7f2] py-16 md:py-20">
        <div className="max-w-3xl mx-auto px-6">
          <h2 className="text-2xl md:text-3xl font-black text-center mb-8">מה כלול</h2>
          <ul className="grid sm:grid-cols-2 gap-x-8 gap-y-4">
            {[
              'מיון אורחים ואלבום אישי בווצאפ',
              'שליחת אלבום אישי ישירות לנייד',
              'סריקת אלפי תמונות בדיוק מירבי',
              'חוסך לאורחים חיפוש בגלריות',
              'חוויה אישית לכל אורח ואורחת',
              'עובד גם על התמונות מהצלם',
            ].map((f) => (
              <li key={f} className="flex gap-3 items-start">
                <Check size={19} className="text-gold-primary shrink-0 mt-0.5" />
                <span className="text-[15px] text-gray-900">{f}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ---- Lead form ---- */}
      <section id="lead" className="max-w-md mx-auto px-6 py-16 md:py-20">
        {sent ? (
          <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} className="text-center">
            <div className="text-5xl mb-4">💛</div>
            <h2 className="text-2xl font-black mb-2">קיבלנו!</h2>
            <p className="text-gray-800/65">נחזור אליכם בהקדם עם כל הפרטים.</p>
          </motion.div>
        ) : (
          <>
            <h2 className="text-2xl md:text-3xl font-black text-center mb-2">רוצים לשמוע עוד?</h2>
            <p className="text-center text-gray-800/60 mb-8">השאירו פרטים ונחזור אליכם.</p>
            <form onSubmit={submit} className="space-y-4">
              <Field label="שמות בני הזוג" value={name} onChange={setName} placeholder="דנה & יואב" required />
              <Field label="טלפון" value={phone} onChange={setPhone} type="tel" placeholder="050-0000000" required />
              <Field label="אימייל" value={email} onChange={setEmail} type="email" placeholder="you@example.com" required />
              <Field label="תאריך החתונה" value={weddingDate} onChange={setWeddingDate} type="date" />

              {error && <p className="text-red-600 text-sm text-center">{error}</p>}

              <button
                type="submit"
                disabled={sending || !name.trim() || !phone.trim() || !email.trim()}
                className="w-full py-4 rounded-2xl bg-charcoal text-white font-black text-lg disabled:opacity-40 active:scale-[0.99] transition-transform"
              >
                {sending ? 'שולח…' : 'שלחו לי פרטים'}
              </button>
            </form>
          </>
        )}
      </section>
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
    <span className="block text-sm text-gray-800/70 mb-1.5">{label}</span>
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      required={required}
      className="w-full px-4 py-3.5 rounded-xl bg-white border border-gray-200 outline-none focus:border-gold-primary transition-colors"
    />
  </label>
);

export default HereIAm;

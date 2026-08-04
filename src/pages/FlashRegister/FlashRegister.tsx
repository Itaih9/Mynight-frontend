import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Check, Copy, Sparkles, Download, Calendar as CalendarIcon } from 'lucide-react';
import { Calendar } from '@/components/ui/Calendar';
import { eventsApi, type FlashRegisterResult } from '@/services/api/events.api';
import { paymentApi } from '@/services/api';
import { HereIAmUpsellModal } from '@/components/upsell/HereIAmUpsellModal';
import { API_BASE_URL } from '@/config/api';
import { ROUTES } from '@/config/routes';
import logoSvg from '@/assets/logo.svg';
import './FlashRegister.css';

/**
 * Free פלאש sign-up — the "stationery" designed form.
 *
 * The FORM is the ported letterpress mockup (scoped under .frg); on a
 * successful register we hand back Flash.tsx's proven QR / link success
 * screen (dark, functional) plus the Here I Am upsell.
 */
/** YYYY-MM-DD → 12.08.2026 for display */
const formatHebDate = (iso: string) => {
  const [y, m, d] = iso.split('-');
  return y && m && d ? `${d}.${m}.${y}` : iso;
};

export const FlashRegister = () => {
  const navigate = useNavigate();

  const [coupleName, setCoupleName] = useState('');
  const [weddingDate, setWeddingDate] = useState('');
  const [dateOpen, setDateOpen] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<FlashRegisterResult | null>(null);
  const [copied, setCopied] = useState(false);
  const [params] = useSearchParams();
  const wantsPlus = params.get('plan') === 'plus';

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const res = await eventsApi.registerFlash({
        coupleName: coupleName.trim(),
        weddingDate,
        phoneNumber: phoneNumber.trim(),
        email: email.trim(),
      });

      // Arrived from the פלאש+ pill: the event now exists, so hand straight
      // off to Sumit instead of showing the free success screen.
      if (wantsPlus && res.data?.eventCode) {
        try {
          const pay = await paymentApi.beginFlashPlus(res.data.eventCode);
          const url = (pay.data as any)?.redirectUrl;
          if (url) {
            window.location.href = url;
            return; // leaving the page — keep the button in its busy state
          }
        } catch {
          /* upgrade couldn't start — fall through to the normal success
             screen, where the upgrade CTA is still available. */
        }
      }

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

  const canSubmit =
    !submitting && !!coupleName.trim() && !!weddingDate && !!phoneNumber.trim() && !!email.trim();

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
          <h1 className="text-3xl font-black mb-2">הפלאש שלכם מוכן</h1>
          <p className="text-white/70 mb-2">
            {coupleName.trim()}, מזל טוב! הכנו לכם מצלמה חד-פעמית לאורחים
            {weddingDate ? ` לחתונה ב-${formatHebDate(weddingDate)}` : ''}.
          </p>
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

          {/* QR of the camera link — the couple prints/displays it, guests scan it. */}
          <div className="rounded-2xl bg-white/5 ring-1 ring-white/10 p-5 mb-4 text-center">
            <p className="text-white font-bold mb-1">קוד ה-QR לאורחים</p>
            <p className="text-white/40 text-xs mb-4">הדפיסו והציבו — האורחים סורקים ומצלמים, בלי אפליקציה.</p>
            <img
              src={`${API_BASE_URL}/api/events/code/${result.eventCode}/qr.png`}
              alt="קוד QR"
              width={200}
              height={200}
              className="mx-auto rounded-xl bg-white p-2"
            />
            <a
              href={`${API_BASE_URL}/api/events/code/${result.eventCode}/qr.png?download=1`}
              download={`mynight-flash-${result.eventCode}.png`}
              className="mt-4 w-full py-3 rounded-xl bg-white text-black font-bold flex items-center justify-center gap-2 active:scale-[0.99] transition-transform"
            >
              <Download size={18} /> הורדת קוד ה-QR
            </a>
            <div className="mt-4 text-right bg-white/5 rounded-xl p-4">
              <p className="text-white/80 text-xs font-bold mb-2">איפה להדפיס ולהציב</p>
              <ul className="text-white/60 text-xs space-y-1.5 list-disc pr-4">
                <li>הדפיסו בגודל A5–A4 על נייר מט</li>
                <li>על שולחן קבלת הפנים וליד ספר הברכות</li>
                <li>מסגרת קטנה על כל שולחן אורחים</li>
                <li>ליד הבר ובאזור רחבת הריקודים</li>
              </ul>
            </div>
          </div>

          {/* How they reach the album — same instruction the email gives */}
          <div className="rounded-2xl bg-white/5 ring-1 ring-white/10 p-5 mb-4 text-right">
            <p className="text-white font-bold mb-2">איך רואים את התמונות?</p>
            <p className="text-white/60 text-sm leading-relaxed">
              בבוקר שאחרי החתונה היכנסו ל-
              <a href={ROUTES.LOGIN} className="text-gold-primary underline underline-offset-2">
                mynight.co.il/login
              </a>{' '}
              עם מספר הטלפון{' '}
              {phoneNumber.trim() ? (
                <strong className="text-white" dir="ltr">{phoneNumber.trim()}</strong>
              ) : (
                'שאיתו נרשמתם'
              )}{' '}
              — האלבום שלכם יחכה שם.
            </p>
          </div>

          <p className="text-white/40 text-xs mb-10">
            שמרו את הקישור — שלחנו אותו גם למייל. הצילומים מתפתחים בבוקר שאחרי החתונה.
          </p>

          {/* The upsell — free covers the shooting, this is the smart layer.
              A plain button here (no plan pill): they've already got פלאש. */}
          <div className="rounded-2xl bg-gradient-to-b from-white/10 to-white/[0.03] ring-1 ring-white/15 p-6 text-right">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles size={18} className="text-gold-primary" />
              <span className="font-bold text-lg">רוצים שכל אורח יקבל את התמונות שלו?</span>
            </div>
            <p className="text-white/65 text-sm leading-relaxed mb-4">
              פלאש אוסף את הצילומים. <strong className="text-white">החבילה החכמה של My Night</strong>{' '}
              מוסיפה זיהוי פנים — כל אורח מקבל אלבום אישי רק עם התמונות שהוא מופיע בהן, כולל התמונות
              מהצלם המקצועי.
            </p>
            <a
              href={ROUTES.HERE_I_AM}
              className="block w-full py-3.5 rounded-xl bg-gold-primary text-black font-bold text-center active:scale-[0.99] transition-transform"
            >
              לפרטים על החבילה החכמה
            </a>
          </div>
        </motion.div>

        {/* Post-registration upsell. Recurs every visit; suppressed only once the
            server reports the event as paid. */}
        <HereIAmUpsellModal eventCode={result.eventCode} />
      </div>
    );
  }

  // ---- Sign-up: the ported "stationery" form ----
  return (
    <div className="frg" dir="rtl">
      {/* foil gradient defs (shared by all inline ornaments) */}
      <svg width="0" height="0" style={{ position: 'absolute' }} aria-hidden="true">
        <defs>
          <linearGradient id="foil" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#C79A16" />
            <stop offset=".3" stopColor="#F9D970" />
            <stop offset=".55" stopColor="#F5C518" />
            <stop offset=".78" stopColor="#F9D970" />
            <stop offset="1" stopColor="#C79A16" />
          </linearGradient>
        </defs>
      </svg>

      <div className="frg-col">
        {/* TOP NAV — back chevron (RTL → points right), logo, פלאש label */}
        <div className="nav">
          <button className="nav-back" type="button" aria-label="חזרה" onClick={() => navigate(-1)}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M9.5 5.5 L16 12 L9.5 18.5" stroke="#44403C" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <img src={logoSvg} alt="My Night" className="frg-logo" />
          <span className="nav-tag">פלאש</span>
        </div>

        {/* REGISTRATION */}
        <section className="reg">
          <div className="eyebrow"><i></i>הרשמה · חינם<i></i></div>
          <h1 className="h-sec">צרו את הפלאש שלכם</h1>
          <p className="sub">דקה אחת וזה מוכן — בלי אפליקציה, בלי כרטיס אשראי.</p>

          <div className="rule">
            <span className="rl"></span>
            <svg width="30" height="8" viewBox="0 0 30 8" fill="none" aria-hidden="true">
              <circle cx="4" cy="4" r="1" fill="url(#foil)" />
              <rect x="12.6" y="1.6" width="4.8" height="4.8" transform="rotate(45 15 4)" fill="none" stroke="url(#foil)" strokeWidth="1" />
              <circle cx="26" cy="4" r="1" fill="url(#foil)" />
            </svg>
            <span className="rl rev"></span>
          </div>

          {/* FORM — wired to real state + the signup API */}
          <form className="form" onSubmit={submit} noValidate>
            <div className="field">
              <label htmlFor="f-names">שמות בני הזוג</label>
              <input
                id="f-names"
                name="names"
                type="text"
                autoComplete="name"
                placeholder="מאיה ויונתן"
                value={coupleName}
                onChange={(e) => setCoupleName(e.target.value)}
              />
            </div>

            <div className="field">
              <label htmlFor="f-date">תאריך החתונה</label>
              <button
                id="f-date"
                type="button"
                className={`date-trigger${weddingDate ? ' has-value' : ''}`}
                onClick={() => setDateOpen((v) => !v)}
                aria-expanded={dateOpen}
              >
                <CalendarIcon size={17} aria-hidden="true" />
                <span>{weddingDate ? formatHebDate(weddingDate) : 'בחרו תאריך'}</span>
              </button>
              {dateOpen && (
                <div className="date-pop">
                  <Calendar
                    selected={weddingDate ? new Date(weddingDate) : undefined}
                    onSelect={(d) => {
                      // store as YYYY-MM-DD (what the API expects), local-time safe
                      const iso = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
                        d.getDate()
                      ).padStart(2, '0')}`;
                      setWeddingDate(iso);
                      setDateOpen(false);
                    }}
                  />
                </div>
              )}
            </div>

            <div className="field">
              <label htmlFor="f-phone">מספר טלפון</label>
              <input
                id="f-phone"
                name="phone"
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                placeholder="050-000-0000"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
              />
              <p className="help">המספר שאיתו תיכנסו לאלבום.</p>
            </div>

            {/* email — omitted from the mockup; the backend needs it to email the QR/link */}
            <div className="field">
              <label htmlFor="f-email">אימייל (לשליחת הקישור)</label>
              <input
                id="f-email"
                name="email"
                type="email"
                inputMode="email"
                autoComplete="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            {/* primary submit — gold fill, charcoal text, sparkle to the LEFT of the label */}
            <div className="cta">
              <button className="btn" type="submit" disabled={!canSubmit}>
                <span>{submitting ? 'יוצרים את הפלאש…' : 'צרו פלאש — חינם'}</span>
                <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path d="M12 3 C12.5 9 15 11.5 21 12 C15 12.5 12.5 15 12 21 C11.5 15 9 12.5 3 12 C9 11.5 11.5 9 12 3 Z" fill="#1C1917" />
                  <path d="M18.6 2.6 C18.8 4.4 19.4 5 21.2 5.2 C19.4 5.4 18.8 6 18.6 7.8 C18.4 6 17.8 5.4 16 5.2 C17.8 5 18.4 4.4 18.6 2.6 Z" fill="#1C1917" />
                </svg>
              </button>
              {error && <p className="err">{error}</p>}
              <p className="trust">חינם להתחיל · תשדרגו לפלאש+ מתי שתרצו.</p>
            </div>
          </form>

          {/* reassurance footer */}
          <div className="foot-div">
            <div className="rule">
              <span className="rl"></span>
              <svg width="20" height="8" viewBox="0 0 20 8" fill="none" aria-hidden="true">
                <rect x="7.6" y="1.6" width="4.8" height="4.8" transform="rotate(45 10 4)" fill="none" stroke="url(#foil)" strokeWidth="1" />
              </svg>
              <span className="rl rev"></span>
            </div>
          </div>

          <p className="whatnext">
            <svg width="15" height="15" viewBox="0 0 15 15" fill="none" aria-hidden="true">
              <rect x="1" y="1" width="4.6" height="4.6" rx=".6" stroke="url(#foil)" strokeWidth="1" />
              <rect x="9.4" y="1" width="4.6" height="4.6" rx=".6" stroke="url(#foil)" strokeWidth="1" />
              <rect x="1" y="9.4" width="4.6" height="4.6" rx=".6" stroke="url(#foil)" strokeWidth="1" />
              <rect x="9.4" y="9.4" width="2" height="2" fill="url(#foil)" />
              <rect x="12" y="12" width="2" height="2" fill="url(#foil)" />
            </svg>
            מיד אחרי ההרשמה תקבלו קוד QR מוכן להדפסה.
          </p>

          <div className="login">
            <button className="btn-sec" type="button" onClick={() => navigate(ROUTES.LOGIN)}>
              כבר יש לכם פלאש? <strong>התחברו</strong>
            </button>
          </div>
        </section>
      </div>
    </div>
  );
};

export default FlashRegister;

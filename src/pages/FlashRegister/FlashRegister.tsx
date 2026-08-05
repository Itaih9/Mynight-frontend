import { useEffect, useState } from 'react';
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
 * Both screens live in the same letterpress system (scoped under .frg): the
 * sign-up form, and — after a successful register — the QR / link success
 * screen plus the Here I Am upsell. Same cream paper, white cards, gold
 * hairlines, so the couple never jumps between two themes on their phone.
 */
/** Keep in sync with backend FLASH_PLUS_PRICE_ILS. */
const FLASH_PLUS_PRICE = 50;

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
  const [upgradeNote, setUpgradeNote] = useState('');
  const [params] = useSearchParams();
  /* Arriving from the bottom CTA the plan is already chosen (?plan=…), so no
     pill here. Arriving from the hero CTA there's no param — show the pill so
     they can still pick before signing up. */
  const planParam = params.get('plan');
  const showPlanPill = !planParam;
  const [plan, setPlan] = useState<'free' | 'plus'>(planParam === 'plus' ? 'plus' : 'free');
  const wantsPlus = plan === 'plus';

  /* Reached as /flash/event?code=XXXX (e.g. straight after paying): load that
     event and show the same post-registration screen, instead of the plan page. */
  const existingCode = params.get('code') || '';
  useEffect(() => {
    if (!existingCode || result) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await eventsApi.getByCode(existingCode);
        const ev: any = res.data;
        if (cancelled || !ev) return;
        if (ev.weddingDate) setWeddingDate(String(ev.weddingDate).slice(0, 10));
        if (ev.coupleName) setCoupleName(ev.coupleName);
        setResult({
          eventCode: ev.eventCode || existingCode,
          cameraUrl: `${window.location.origin}/camera/${ev.eventCode || existingCode}`,
          weddingDate: ev.weddingDate,
          shotLimit: ev.flashTier === 'plus' ? 24 : 8,
          isNew: false,
        } as FlashRegisterResult);
      } catch { /* bad code — fall through to the normal signup form */ }
    })();
    return () => { cancelled = true; };
  }, [existingCode, result]);

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
          throw new Error('no redirectUrl');
        } catch (payErr: any) {
          /* Never fail silently here — the couple asked to pay. The common
             case is a repeat signup on a phone whose event is already פלאש+
             (registration is idempotent per phone), which the server rejects. */
          const msg =
            payErr?.response?.data?.error ||
            payErr?.response?.data?.message ||
            'לא הצלחנו לפתוח את דף התשלום. הפלאש נוצר — אפשר לשדרג מהכפתור למטה.';
          setUpgradeNote(msg);
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
  // Same "stationery" system as the form below (scoped under .frg) so the
  // couple stays on cream paper instead of dropping into a dark screen.
  if (result) {
    return (
      <>
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
            {/* TOP NAV — same row as the form (spacer stands in for the back
                chevron so the logo keeps its exact position across screens) */}
            <div className="nav">
              <span className="nav-spacer" aria-hidden="true" />
              <img src={logoSvg} alt="My Night" className="frg-logo" />
              <span className="nav-tag">פלאש</span>
            </div>

            <motion.section
              className="reg success"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
            >
              {/* foil seal — the letterpress stand-in for the old emoji */}
              <div className="seal" aria-hidden="true">
                <svg viewBox="0 0 44 44" fill="none">
                  <circle cx="22" cy="22" r="20.5" stroke="url(#foil)" strokeWidth="1" />
                  <circle cx="22" cy="22" r="17" stroke="url(#foil)" strokeWidth=".6" opacity=".55" />
                  <path
                    d="M14.8 22.4 L19.6 27.2 L29.2 16.8"
                    stroke="url(#foil)"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>

              <div className="eyebrow"><i></i>הרשמה · הושלמה<i></i></div>
              <h1 className="h-sec">הפלאש שלכם מוכן</h1>
              <p className="sub">
                {coupleName.trim()}, מזל טוב! הכנו לכם מצלמה חד-פעמית לאורחים
                {weddingDate ? ` לחתונה ב-${formatHebDate(weddingDate)}` : ''}.
              </p>
              <p className="sub">
                שתפו את הקישור עם האורחים ביום החתונה. כל אורח מקבל {result.shotLimit} צילומים.
              </p>

              {upgradeNote && (
                <p className="upgrade-note">{upgradeNote}</p>
              )}

              <div className="rule">
                <span className="rl"></span>
                <svg width="30" height="8" viewBox="0 0 30 8" fill="none" aria-hidden="true">
                  <circle cx="4" cy="4" r="1" fill="url(#foil)" />
                  <rect x="12.6" y="1.6" width="4.8" height="4.8" transform="rotate(45 15 4)" fill="none" stroke="url(#foil)" strokeWidth="1" />
                  <circle cx="26" cy="4" r="1" fill="url(#foil)" />
                </svg>
                <span className="rl rev"></span>
              </div>

              <div className="card">
                <p className="card-label">הקישור לאורחים</p>
                <p className="link-url" dir="ltr">{result.cameraUrl}</p>
                <button className="btn" type="button" onClick={copyLink}>
                  {copied ? <Check size={18} aria-hidden="true" /> : <Copy size={18} aria-hidden="true" />}
                  <span>{copied ? 'הועתק' : 'העתקת הקישור'}</span>
                </button>
              </div>

              {/* QR of the camera link — the couple prints/displays it, guests scan it.
                  The PNG is dark-on-white, so its frame stays white. */}
              <div className="card qr-card">
                <p className="card-title">קוד ה-QR לאורחים</p>
                <p className="card-note">הדפיסו והציבו — האורחים סורקים ומצלמים, בלי אפליקציה.</p>
                <div className="qr-frame">
                  <img
                    src={`${API_BASE_URL}/api/events/code/${result.eventCode}/qr.png`}
                    alt="קוד QR"
                    width={200}
                    height={200}
                  />
                </div>
                <a
                  className="btn-sec btn-line"
                  href={`${API_BASE_URL}/api/events/code/${result.eventCode}/qr.png?download=1`}
                  download={`mynight-flash-${result.eventCode}.png`}
                >
                  <Download size={18} aria-hidden="true" />
                  <span>הורדת קוד ה-QR</span>
                </a>
                <div className="tips">
                  <p className="tips-title">איפה להדפיס ולהציב</p>
                  <ul>
                    <li>הדפיסו בגודל A5–A4 על נייר מט</li>
                    <li>על שולחן קבלת הפנים וליד ספר הברכות</li>
                    <li>מסגרת קטנה על כל שולחן אורחים</li>
                    <li>ליד הבר ובאזור רחבת הריקודים</li>
                  </ul>
                </div>
              </div>

              {/* How they reach the album — same instruction the email gives */}
              <div className="card">
                <p className="card-title">איך רואים את התמונות?</p>
                <p className="card-body">
                  בבוקר שאחרי החתונה היכנסו ל-
                  <a href={ROUTES.LOGIN} className="ilink">
                    mynight.co.il/login
                  </a>{' '}
                  עם מספר הטלפון{' '}
                  {phoneNumber.trim() ? (
                    <strong dir="ltr">{phoneNumber.trim()}</strong>
                  ) : (
                    'שאיתו נרשמתם'
                  )}{' '}
                  — האלבום שלכם יחכה שם.
                </p>
              </div>

              <p className="save-note">
                שמרו את הקישור — שלחנו אותו גם למייל. הצילומים מתפתחים בבוקר שאחרי החתונה.
              </p>

              {/* The upsell — free covers the shooting, this is the smart layer.
                  A plain button here (no plan pill): they've already got פלאש. */}
              <div className="card upsell">
                <div className="upsell-head">
                  <Sparkles size={18} aria-hidden="true" />
                  <span>רוצים שכל אורח יקבל את התמונות שלו?</span>
                </div>
                <p className="card-body">
                  פלאש אוסף את הצילומים. <strong>החבילה החכמה של My Night</strong>{' '}
                  מוסיפה זיהוי פנים — כל אורח מקבל אלבום אישי רק עם התמונות שהוא מופיע בהן, כולל התמונות
                  מהצלם המקצועי.
                </p>
                <a className="btn" href={ROUTES.HERE_I_AM}>
                  <span>לפרטים על החבילה החכמה</span>
                </a>
              </div>
            </motion.section>
          </div>
        </div>

        {/* Post-registration upsell. Recurs every visit; suppressed only once the
            server reports the event as paid. */}
        <HereIAmUpsellModal eventCode={result.eventCode} />
      </>
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
          <div className="eyebrow"><i></i>{wantsPlus ? 'חבילה משודרגת' : 'הרשמה · חינם'}<i></i></div>
          <h1 className="h-sec">צרו את הפלאש שלכם</h1>
          <p className="sub">
            {wantsPlus
              ? 'דקה אחת וזה מוכן — ואז מעבר לתשלום מאובטח.'
              : 'דקה אחת וזה מוכן — בלי אפליקציה, בלי כרטיס אשראי.'}
          </p>

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
              {showPlanPill && (
                <div className={`toggle${plan === 'plus' ? ' is-plus' : ''}`}>
                  <span className="thumb" />
                  <button
                    className={`seg${plan === 'free' ? ' is-on' : ''}`}
                    type="button"
                    aria-pressed={plan === 'free'}
                    onClick={() => setPlan('free')}
                  >
                    פלאש
                  </button>
                  <button
                    className={`seg${plan === 'plus' ? ' is-on' : ''}`}
                    type="button"
                    aria-pressed={plan === 'plus'}
                    onClick={() => setPlan('plus')}
                  >
                    פלאש+
                  </button>
                </div>
              )}
              {plan === 'plus' && (
                <ul className="plan-benefits">
                              <li><b>24 צילומים</b> לכל אורח (במקום 8)</li>
                              <li>זיהוי פנים לכל אורח</li>
                              <li>וידאו — לא רק תמונות</li>
                            </ul>
              )}
              <button className="btn" type="submit" disabled={!canSubmit}>
                <span>
                  {submitting
                    ? wantsPlus
                      ? 'מעבירים לתשלום…'
                      : 'יוצרים את הפלאש…'
                    : wantsPlus
                      ? `המשך לתשלום — פלאש+ ₪${FLASH_PLUS_PRICE}`
                      : 'צרו פלאש — חינם'}
                </span>
                <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path d="M12 3 C12.5 9 15 11.5 21 12 C15 12.5 12.5 15 12 21 C11.5 15 9 12.5 3 12 C9 11.5 11.5 9 12 3 Z" fill="#1C1917" />
                  <path d="M18.6 2.6 C18.8 4.4 19.4 5 21.2 5.2 C19.4 5.4 18.8 6 18.6 7.8 C18.4 6 17.8 5.4 16 5.2 C17.8 5 18.4 4.4 18.6 2.6 Z" fill="#1C1917" />
                </svg>
              </button>
              {error && <p className="err">{error}</p>}
              <p className="trust">
                {wantsPlus
                  ? 'תשלום מאובטח דרך Sumit · חד-פעמי.'
                  : 'חינם להתחיל · תשדרגו לפלאש+ מתי שתרצו.'}
              </p>
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

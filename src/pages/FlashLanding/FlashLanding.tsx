import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import logoSvg from '@/assets/logo.svg';
import './FlashLanding.css';

/**
 * FlashLanding — the marketing landing page ads point to.
 * Ported from the ad-landing-stationery.html mockup: the presentation
 * phone frame / fake status bar / grain have been removed, and the
 * content now lives in a real full-page, mobile-first column.
 */
/**
 * Photos actually uploaded BY GUESTS (disposable-camera shots and guest
 * uploads), pulled from five different real weddings — not the photographer's
 * set. That's the whole point of the strip: this is what פלאש collects.
 */
const CDN = 'https://d1sayt91mdit04.cloudfront.net/events';
const GUEST_SHOTS = [
  `${CDN}/DWVQNRW4/guest-uploads/WdVkTCc-LkzjMzPzpb2OT-1000406952.jpg`,
  `${CDN}/KW97NB6J/disposable/otOvrOL43L89GXyDes6yo-shot-1784724918322.jpg`,
  `${CDN}/B92JNJ55/guest-uploads/ns--pz68CpGz72cyJ5qo6-1000119281.jpg`,
  `${CDN}/HNN6UFS9/guest-uploads/-ixzOLeV6Ys2lfQPdhT28-1000119281.jpg`,
  `${CDN}/PCLKZS21/guest-uploads/QzYnC3wa9q_dgVqWLnH0m-IMG_7484.jpeg`,
  `${CDN}/DWVQNRW4/guest-uploads/ZxPAYUeVDFg4AJyHahGoS-1000406814.jpg`,
  `${CDN}/DWVQNRW4/guest-uploads/Ga7wozPWHqJE01y6SnvPs-1000406808.jpg`,
];

/** Keep in sync with backend FLASH_PLUS_PRICE_ILS. */
const FLASH_PLUS_PRICE = 1; // ⚠️ TEMP ₪1 for payment testing — restore to 50

export default function FlashLanding() {
  const navigate = useNavigate();
  const [plan, setPlan] = useState<'free' | 'plus'>('free');
  /* A payment needs an event to exist, so פלאש+ still registers first — the
     intent rides along as ?plan=plus and signup hands straight off to Sumit. */
  const goRegister = () => navigate(plan === 'plus' ? '/flash/register?plan=plus' : '/flash/register');
  const rootRef = useRef<HTMLDivElement>(null);

  /* Scroll reveal — each [data-reveal] block fades up once, like a print
     coming into focus. Respects prefers-reduced-motion (CSS handles that). */
  useEffect(() => {
    const els = rootRef.current?.querySelectorAll('[data-reveal]');
    if (!els?.length) return;
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add('is-in');
            io.unobserve(e.target);
          }
        });
      },
      { threshold: 0.18, rootMargin: '0px 0px -8% 0px' }
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  return (
    <div className="flp" ref={rootRef}>
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

      <div className="page">
        {/* ================= HERO — "פזורה" (scattered editorial) ================= */}
        <section className="hero o4">
          {/* guest photos scattered asymmetrically around a clean centre */}
          <div className="o4-scatter" aria-hidden="true">
            {GUEST_SHOTS.slice(0, 6).map((src, i) => (
              <div className={`sc s${i + 1}`} key={src}>
                <img src={src} alt="" loading={i < 2 ? 'eager' : 'lazy'} />
              </div>
            ))}
          </div>

          <div className="o4-inner">
            <div className="o4-block" data-reveal>
              <img src={logoSvg} alt="My Night" className="flp-logo" />
              <div className="brandline-photo">
                <i />
                <span>פלאש</span>
                <i className="rev" />
              </div>
              <h1 className="o4-h1">
                החתונה שלכם,
                <br />
                מהעיניים של כולם
              </h1>
              <p className="hero-sub">
                מצלמה חד-פעמית לכל אורח. סורקים קוד, מצלמים מהטלפון בלי אפליקציה.
              </p>
            </div>
          </div>

          <div className="o4-foot">
            <button className="btn hero-cta" type="button" onClick={() => navigate('/flash/register')}>
              <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path
                  d="M12 3.4c.7 4 1.6 4.9 5.6 5.6-4 .7-4.9 1.6-5.6 5.6-.7-4-1.6-4.9-5.6-5.6 4-.7 4.9-1.6 5.6-5.6Z"
                  fill="#1C1917"
                />
                <circle cx="19" cy="17" r="1.4" fill="#1C1917" />
              </svg>
              להתחיל בחינם
            </button>

            <div className="trust">בלי אפליקציה · מוכן תוך דקה</div>
          </div>
        </section>

        {/* ================= PHOTO STRIP =================
            Real guest-uploaded photos from actual weddings (the same
            gallery_showcase set the album showcase uses). */}
        <section className="gallery">
          <h2 className="gallery-h" data-reveal>החגיגה מעיניים של האורחים</h2>
          <div className="strip-g">
            {GUEST_SHOTS.map((src, i) => (
              <div className={i % 2 ? 'shot tall' : 'shot'} key={src} style={{ ['--i']: i } as React.CSSProperties}>
                <img src={src} alt="" loading="lazy" />
                <span className="veil" />
              </div>
            ))}
          </div>
        </section>

        <div className="body">
          {/* ================= HOW IT WORKS ================= */}
          <section>
            <div className="eyebrow">
              <i />
              שלושה צעדים
              <i />
            </div>
            <h2 className="h-sec">איך זה עובד</h2>

            <div className="hiw" data-reveal>
              <div className="hiw-item">
                <span className="hiw-num foiltext">01</span>
                <div className="hiw-text">
                  <h3 className="hiw-h">יוצרים פלאש</h3>
                  <p className="hiw-p">נרשמים בחינם ומקבלים קוד QR לאירוע.</p>
                </div>
              </div>
              <div className="hiw-item">
                <span className="hiw-num foiltext">02</span>
                <div className="hiw-text">
                  <h3 className="hiw-h">האורחים מצלמים</h3>
                  <p className="hiw-p">סורקים את הקוד ומצלמים מהטלפון, בלי להוריד כלום.</p>
                </div>
              </div>
              <div className="hiw-item">
                <span className="hiw-num foiltext">03</span>
                <div className="hiw-text">
                  <h3 className="hiw-h">מקבלים אלבום</h3>
                  <p className="hiw-p">כל התמונות מתפתחות לאלבום אחד בבוקר שאחרי.</p>
                </div>
              </div>
            </div>
          </section>

          <div className="band">
            <div className="rule">
              <span className="rl" />
              <svg width="46" height="10" viewBox="0 0 46 10" fill="none" aria-hidden="true">
                <circle cx="6" cy="5" r="1" fill="url(#foil)" />
                <path
                  d="M15 5c2.4-3.4 4.8-3.4 6 0-1.2 3.4-3.6 3.4-6 0Z"
                  fill="none"
                  stroke="url(#foil)"
                  strokeWidth=".8"
                />
                <rect
                  x="20.6"
                  y="2.4"
                  width="5.2"
                  height="5.2"
                  transform="rotate(45 23.2 5)"
                  fill="none"
                  stroke="url(#foil)"
                  strokeWidth="1"
                />
                <path
                  d="M31 5c-2.4-3.4-4.8-3.4-6 0 1.2 3.4 3.6 3.4 6 0Z"
                  fill="none"
                  stroke="url(#foil)"
                  strokeWidth=".8"
                />
                <circle cx="40" cy="5" r="1" fill="url(#foil)" />
              </svg>
              <span className="rl rev" />
            </div>
          </div>

          {/* ================= WHY COUPLES LOVE IT ================= */}
          <section>
            <div className="eyebrow">
              <i />
              למה אתם צריכים
              <i />
            </div>
            <h2 className="h-sec">הזוגות אהבו במיוחד</h2>

            <div className="values" data-reveal>
              <div className="value">
                <svg className="vm" width="13" height="13" viewBox="0 0 13 13" fill="none" aria-hidden="true">
                  <rect
                    x="3.2"
                    y="3.2"
                    width="6.6"
                    height="6.6"
                    transform="rotate(45 6.5 6.5)"
                    fill="none"
                    stroke="url(#foil)"
                    strokeWidth="1.1"
                  />
                  <circle cx="6.5" cy="6.5" r="1" fill="url(#foil)" />
                </svg>
                <p>כל אורח מצלם — זוויות שהצלם לא תופס</p>
              </div>
              <div className="value">
                <svg className="vm" width="13" height="13" viewBox="0 0 13 13" fill="none" aria-hidden="true">
                  <rect
                    x="3.2"
                    y="3.2"
                    width="6.6"
                    height="6.6"
                    transform="rotate(45 6.5 6.5)"
                    fill="none"
                    stroke="url(#foil)"
                    strokeWidth="1.1"
                  />
                  <circle cx="6.5" cy="6.5" r="1" fill="url(#foil)" />
                </svg>
                <p>בלי אפליקציה, עובד על כל טלפון</p>
              </div>
              <div className="value">
                <svg className="vm" width="13" height="13" viewBox="0 0 13 13" fill="none" aria-hidden="true">
                  <rect
                    x="3.2"
                    y="3.2"
                    width="6.6"
                    height="6.6"
                    transform="rotate(45 6.5 6.5)"
                    fill="none"
                    stroke="url(#foil)"
                    strokeWidth="1.1"
                  />
                  <circle cx="6.5" cy="6.5" r="1" fill="url(#foil)" />
                </svg>
                <p>הכול במקום אחד, בבוקר שאחרי</p>
              </div>
              <div className="value">
                <svg className="vm" width="13" height="13" viewBox="0 0 13 13" fill="none" aria-hidden="true">
                  <rect
                    x="3.2"
                    y="3.2"
                    width="6.6"
                    height="6.6"
                    transform="rotate(45 6.5 6.5)"
                    fill="none"
                    stroke="url(#foil)"
                    strokeWidth="1.1"
                  />
                  <circle cx="6.5" cy="6.5" r="1" fill="url(#foil)" />
                </svg>
                <p>מתחילים בחינם, משדרגים אם רוצים</p>
              </div>
            </div>
          </section>

          <div className="band">
            <div className="rule">
              <span className="rl" />
              <svg width="30" height="8" viewBox="0 0 30 8" fill="none" aria-hidden="true">
                <circle cx="4" cy="4" r="1" fill="url(#foil)" />
                <rect
                  x="12.6"
                  y="1.6"
                  width="4.8"
                  height="4.8"
                  transform="rotate(45 15 4)"
                  fill="none"
                  stroke="url(#foil)"
                  strokeWidth="1"
                />
                <circle cx="26" cy="4" r="1" fill="url(#foil)" />
              </svg>
              <span className="rl rev" />
            </div>
          </div>

          {/* ================= TIERS TEASER ================= */}
          <section>
            <div className="eyebrow">
              <i />
              התוכניות
              <i />
            </div>
            <h2 className="h-sec">מתחילים בחינם</h2>

            <div className="tiers" data-reveal>
              {/* FREE */}
              <div className="tier free" role="button" tabIndex={0} onClick={goRegister}
                   onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && goRegister()}>
                <span className="badge">מתחילים כאן</span>
                <div className="tier-name">פלאש</div>
                <div className="tier-price">חינם</div>
                <div className="rule tier-rule">
                  <span className="rl" />
                  <svg width="18" height="7" viewBox="0 0 18 7" fill="none" aria-hidden="true">
                    <rect
                      x="6.4"
                      y="1.1"
                      width="4.4"
                      height="4.4"
                      transform="rotate(45 8.6 3.3)"
                      fill="none"
                      stroke="url(#foil)"
                      strokeWidth="1"
                    />
                  </svg>
                  <span className="rl rev" />
                </div>
                <div className="tier-feats">
                  <div className="tier-feat">
                    <b>8 צילומים</b> לכל אורח
                  </div>
                  <div className="tier-feat">מצלמה חד-פעמית</div>
                </div>
              </div>

              {/* PLUS — also starts with the free signup; the upgrade is offered right after. */}
              <div className="tier plus" role="button" tabIndex={0} onClick={goRegister}
                   onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && goRegister()}>
                <div className="tier-name">פלאש+</div>
                <div className="tier-price">₪50</div>
                <div className="rule tier-rule">
                  <span className="rl" />
                  <svg width="18" height="7" viewBox="0 0 18 7" fill="none" aria-hidden="true">
                    <rect
                      x="6.4"
                      y="1.1"
                      width="4.4"
                      height="4.4"
                      transform="rotate(45 8.6 3.3)"
                      fill="none"
                      stroke="url(#foil)"
                      strokeWidth="1"
                    />
                  </svg>
                  <span className="rl rev" />
                </div>
                <div className="tier-feats">
                  <div className="tier-feat">וידאו</div>
                  <div className="tier-feat">
                    <b>24 צילומים</b> לכל אורח
                  </div>
                  <div className="tier-feat">זיהוי פנים לכל אורח</div>
                </div>
              </div>
            </div>

            <p className="tiers-note">מתחילים בפלאש בחינם — משדרגים לפלאש+ רק אם בא לכם.</p>
          </section>

          {/* ================= FINAL CTA ================= */}
          <section className="final" data-reveal>
            <svg className="final-orn" width="48" height="26" viewBox="0 0 48 26" fill="none" aria-hidden="true">
              <path d="M24 5 C18 5 14 9 14 15" stroke="url(#foil)" strokeWidth="1" fill="none" />
              <path d="M24 5 C30 5 34 9 34 15" stroke="url(#foil)" strokeWidth="1" fill="none" />
              <path
                d="M14 15c-3-1-5-3-5.5-6 3 .3 5 2 5.5 6Z"
                fill="none"
                stroke="url(#foil)"
                strokeWidth=".8"
              />
              <path
                d="M34 15c3-1 5-3 5.5-6-3 .3-5 2-5.5 6Z"
                fill="none"
                stroke="url(#foil)"
                strokeWidth=".8"
              />
              <rect
                x="21"
                y="2"
                width="6"
                height="6"
                transform="rotate(45 24 5)"
                fill="none"
                stroke="url(#foil)"
                strokeWidth="1"
              />
              <path d="M24 15v6M21 18h6" stroke="url(#foil)" strokeWidth="1.1" strokeLinecap="round" />
            </svg>
            <h2 className="final-h">הפלאש של החתונה שלכם מתחיל כאן</h2>

            {/* פלאש / פלאש+ pill — choosing פלאש+ carries the upgrade intent
                through signup and hands straight off to payment. */}
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

            <button className="btn" type="button" onClick={goRegister}>
              <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path
                  d="M12 3.4c.7 4 1.6 4.9 5.6 5.6-4 .7-4.9 1.6-5.6 5.6-.7-4-1.6-4.9-5.6-5.6 4-.7 4.9-1.6 5.6-5.6Z"
                  fill="#1C1917"
                />
                <circle cx="19" cy="17" r="1.4" fill="#1C1917" />
              </svg>
              {plan === 'plus' ? `שדרוג לפלאש+ ₪${FLASH_PLUS_PRICE}` : 'צרו פלאש — חינם'}
            </button>
            <p className="final-sub">
              {plan === 'plus'
                ? 'נרשמים ועוברים ישר לתשלום מאובטח. חד-פעמי.'
                : 'בלי כרטיס אשראי. משדרגים לפלאש+ מתי שרוצים.'}
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}

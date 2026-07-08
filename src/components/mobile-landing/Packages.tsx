import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '@/config/routes';
import { packagesApi } from '@/services/api';

interface PackagesProps {
  highlightedPackageIndex: number | null;
  animatingPackageIndex: number | null;
  isHoverDisabled: boolean;
}

// Inline fractal-noise texture reused across the stone / gold surfaces.
const NOISE =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")";

// Column highlight tint per package (shown behind the selected column).
const TINTS: Record<string, string> = {
  starter: 'rgba(92,92,92,0.13)',
  smart: 'rgba(36,36,36,0.11)',
  unlimited: 'rgba(227,180,68,0.22)',
};

const INFO_CONTENT: Record<string, { title: string; body: string }> = {
  guarantee: {
    title: 'הבטחת החזר מלא',
    body: 'אנחנו בטוחים ב-100% בחוויה שאנחנו מספקים. אם מכל סיבה שהיא לא תהיו מרוצים מהשירות, צרו איתנו קשר עד שלושה חודשים לאחר החתונה ותקבלו החזר כספי מלא. בלי שאלות, בלי אותיות קטנות.',
  },
  collect: {
    title: 'אוספים הכל מהאורחים',
    body: 'כל אורח מקבל קישור אישי בווצאפ להעלאת התמונות והסרטונים שצילם באירוע, ואתם מקבלים את כולם במקום אחד מיד לאחר החתונה.',
  },
};

interface RawPackage {
  key: string;
  backendKey: string;
  name: string;
  englishName: string;
  price: number;
  recommended: boolean;
  gradient: string;
  ringColor: string;
  solidGradient: string;
  ctaVeil: string;
}

const RAW_PACKAGES: RawPackage[] = [
  {
    key: 'starter', backendKey: 'morning_after', name: 'האוספת', englishName: 'Morning After', price: 425, recommended: false,
    gradient: 'linear-gradient(299deg,rgba(146,143,142,.78) 0%,rgba(92,92,92,.82) 34%)',
    ringColor: 'rgba(92,92,92,.7)',
    solidGradient: 'linear-gradient(299deg,hsl(35,2%,56%) 0%,hsl(35,0%,36%) 34%)',
    ctaVeil: 'linear-gradient(rgba(0,0,0,.22),rgba(0,0,0,.22))',
  },
  {
    key: 'smart', backendKey: 'here_i_am', name: 'החכמה', englishName: 'Here I Am', price: 575, recommended: false,
    gradient: 'linear-gradient(307deg,rgba(85,87,90,.8) 0%,rgba(36,36,36,.85) 41%)',
    ringColor: 'rgba(36,36,36,.7)',
    solidGradient: 'linear-gradient(307deg,hsl(200,2%,34%) 0%,hsl(200,0%,14%) 41%)',
    ctaVeil: 'linear-gradient(rgba(0,0,0,.22),rgba(0,0,0,.22))',
  },
  {
    key: 'unlimited', backendKey: 'unlimited', name: 'המושלמת', englishName: 'Perfect Night', price: 975, recommended: true,
    gradient: 'linear-gradient(112deg,rgba(243,221,161,.8) 0%,rgba(227,180,68,.85) 50%)',
    ringColor: 'rgba(227,180,68,.7)',
    solidGradient: 'linear-gradient(112deg,hsl(43,80%,80%) 0%,hsl(43,78%,60%) 50%)',
    ctaVeil: 'linear-gradient(187deg,hsla(45,100%,81%,.44) 0%,hsla(45,100%,66%,.44) 100%)',
  },
];

// [label, starter?, smart?, unlimited?, bold?, infoKey, shiftInfoRight?]
const FEATURE_DEFS: Array<[string, boolean, boolean, boolean, boolean, string | null, boolean]> = [
  ['ללא צורך בהתקנת אפליקציה', true, true, true, false, null, false],
  ['אוספים הכל מהאורחים', true, false, true, false, 'collect', true],
  ['מיון אורחים ואלבום אורח בוואטסאפ', false, true, true, false, null, false],
  ['שליחת אלבום אורח ישירות לנייד', false, true, true, false, null, false],
  ['סטורי יום אחרי מצילומי האורחים', true, false, true, false, null, false],
  ['QR לסריקה בחתונה', false, false, true, false, null, false],
  ['הבטחת החזר מלא', false, false, true, true, 'guarantee', false],
];

// A filled circle + checkmark, reused for the per-column marks.
const CheckMark: React.FC<{ circle: string; stroke: string; strokeWidth?: number }> = ({ circle, stroke, strokeWidth = 2.3 }) => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style={{ display: 'block' }}>
    <circle cx="12" cy="12" r="12" fill={circle} />
    <path d="M7 12.5l3 3 7-7" stroke={stroke} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export const Packages: React.FC<PackagesProps> = ({ highlightedPackageIndex, animatingPackageIndex, isHoverDisabled }) => {
  const navigate = useNavigate();
  const [selected, setSelected] = useState<string>('unlimited');
  const [infoOpenKey, setInfoOpenKey] = useState<string | null>(null);
  const [pkgData, setPkgData] = useState<RawPackage[]>(RAW_PACKAGES);

  // Force one repaint after mount so the noise-blend / gradient layers paint on
  // first load instead of only appearing after the first interaction.
  const [, setPainted] = useState(false);
  useEffect(() => {
    const id = requestAnimationFrame(() => setPainted(true));
    return () => cancelAnimationFrame(id);
  }, []);

  void highlightedPackageIndex;
  void animatingPackageIndex;
  void isHoverDisabled;

  // Override display name / english title / price from the admin-managed packages.
  useEffect(() => {
    let cancelled = false;
    packagesApi.getPublic()
      .then((res) => {
        if (cancelled || !res.data?.length) return;
        const overrides = new Map(res.data.map((p) => [p.key, p]));
        setPkgData(RAW_PACKAGES.map((pkg) => {
          const o = overrides.get(pkg.backendKey);
          if (!o) return pkg;
          // Strip a leading "The " so e.g. "The Morning After" reads "Morning After".
          return { ...pkg, name: o.title, englishName: o.englishTitle.replace(/^The\s+/i, ''), price: o.price };
        }));
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, []);

  const infoModal = infoOpenKey ? INFO_CONTENT[infoOpenKey] : null;
  const closeInfo = () => setInfoOpenKey(null);

  const stone = 'linear-gradient(299deg,#9c968f 0%,#6b655e 60%)';

  const labels = {
    barCellStyle: { display: 'flex', borderRadius: '14px 14px 0 0', padding: '0 0 6px' } as React.CSSProperties,
    barStyle: {
      position: 'relative', overflow: 'hidden', width: '100%', background: stone,
      border: '1px solid rgba(255,255,255,.28)', borderRadius: '12px', padding: '9px 8px',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      boxShadow: 'inset 0 1px 0 rgba(255,255,255,.4), 0 4px 9px -6px rgba(0,0,0,.42)',
    } as React.CSSProperties,
    barNoiseStyle: { position: 'absolute', inset: 0, backgroundImage: NOISE, backgroundSize: '120px 120px', mixBlendMode: 'overlay', opacity: 0.05, filter: 'grayscale(1)', pointerEvents: 'none' } as React.CSSProperties,
    barSheenStyle: { position: 'absolute', top: 0, left: 0, right: 0, height: '58%', background: 'linear-gradient(180deg, rgba(255,255,255,.42) 0%, rgba(255,255,255,0) 100%)', pointerEvents: 'none' } as React.CSSProperties,
    barTextStyle: { position: 'relative', zIndex: 1, fontSize: '13px', fontWeight: 800, color: '#fff', fontFamily: "'Assistant',sans-serif", textShadow: '0 1px 2px rgba(0,0,0,.3)', lineHeight: 1.1 } as React.CSSProperties,
    priceLabelStyle: { display: 'flex', alignItems: 'center', justifyContent: 'flex-start', paddingTop: '12px', paddingRight: '2px', fontSize: '15px', fontWeight: 800, color: '#232323', fontFamily: "'Assistant',sans-serif" } as React.CSSProperties,
    ctaCellWrapStyle: { display: 'flex', paddingTop: '6px', paddingBottom: '2px' } as React.CSSProperties,
    ctaBlockStyle: {
      position: 'relative', overflow: 'hidden', width: '100%', padding: '11px 0', borderRadius: '12px',
      border: '1px solid rgba(255,255,255,.28)', fontFamily: "'Assistant',sans-serif", fontSize: '14px', fontWeight: 800,
      background: `linear-gradient(rgba(0,0,0,.22),rgba(0,0,0,.22)), ${stone}`,
      color: '#fff', textShadow: '0 1px 2px rgba(0,0,0,.3)', textAlign: 'center',
      boxShadow: '0 4px 10px -6px rgba(0,0,0,.45), inset 0 1px 0 rgba(255,255,255,.3)',
    } as React.CSSProperties,
    ctaBlockNoiseStyle: { position: 'absolute', inset: 0, backgroundImage: NOISE, backgroundSize: '120px 120px', mixBlendMode: 'overlay', opacity: 0.045, filter: 'grayscale(1)', pointerEvents: 'none' } as React.CSSProperties,
  };

  const packages = pkgData.map((p) => {
    const isSelected = selected === p.key;
    const tint = isSelected ? TINTS[p.key] : 'transparent';
    return {
      ...p,
      selected: isSelected,
      // The name box spans the full column width and sits above the tint (higher
      // z-index), so the column highlight stays fully behind/below it — no clipped
      // box top, no highlight corners poking out above the box.
      headerCellStyle: {
        position: 'relative', display: 'flex',
        // Start the column tint 8px below the top so the highlight's corners
        // stay tucked behind the rounded name box instead of peeking out.
        background: isSelected ? `linear-gradient(to bottom, transparent 8px, ${TINTS[p.key]} 8px)` : 'transparent',
        borderRadius: '0', padding: '0 0 6px', cursor: 'pointer', zIndex: 1,
      } as React.CSSProperties,
      colHeaderStyle: {
        position: 'relative', overflow: 'hidden', width: '100%', background: p.gradient,
        borderRadius: '12px', padding: '9px 2px', textAlign: 'center',
        border: '1px solid rgba(255,255,255,.28)', cursor: 'pointer',
        boxShadow: isSelected
          ? `inset 0 1px 0 rgba(255,255,255,.45), 0 4px 9px -6px rgba(0,0,0,.42), 0 0 0 2px ${p.ringColor}`
          : 'inset 0 1px 0 rgba(255,255,255,.45), 0 4px 9px -6px rgba(0,0,0,.42)',
        zIndex: 2,
      } as React.CSSProperties,
      noiseStyle: { position: 'absolute', inset: 0, backgroundImage: NOISE, backgroundSize: '120px 120px', mixBlendMode: 'overlay', opacity: p.recommended ? 0.65 : 0.5, pointerEvents: 'none', filter: p.recommended ? 'none' : 'grayscale(1)' } as React.CSSProperties,
      sheenStyle: { position: 'absolute', top: 0, left: 0, right: 0, height: '58%', background: 'linear-gradient(180deg, rgba(255,255,255,.42) 0%, rgba(255,255,255,0) 100%)', pointerEvents: 'none' } as React.CSSProperties,
      colNameStyle: { fontSize: '16px', fontWeight: 800, color: '#fff', fontFamily: "'Assistant',sans-serif", textShadow: '0 1px 2px rgba(0,0,0,.3)', lineHeight: 1.05, letterSpacing: '-0.3px', whiteSpace: 'nowrap' } as React.CSSProperties,
      colEnglishStyle: { fontSize: '8.5px', fontWeight: 600, letterSpacing: '.5px', color: 'rgba(255,255,255,.85)', marginTop: '2px', textShadow: p.recommended ? '0 1px 1px rgba(0,0,0,.2)' : 'none' } as React.CSSProperties,
      priceCellStyle: { paddingTop: '2px', paddingBottom: '14px', background: tint, borderRadius: '0 0 16px 16px', position: 'relative', zIndex: 1 } as React.CSSProperties,
      priceNoteStyle: { width: '82%', margin: '0 auto', background: '#fff', padding: '9px 4px', textAlign: 'center', borderRadius: '4px 4px 11px 11px', boxShadow: '0 4px 8px -4px rgba(0,0,0,.28)' } as React.CSSProperties,
      priceStyle: { position: 'relative', zIndex: 1, fontSize: '17px', fontWeight: 700, color: '#232323', fontFamily: "'Miriam Libre',serif" } as React.CSSProperties,
      ctaCellStyle: { display: 'flex', paddingTop: '6px', paddingBottom: '0', background: tint, position: 'relative', zIndex: 1 } as React.CSSProperties,
      ctaText: isSelected ? 'להמשיך' : 'בחירה',
      ctaCheckStroke: p.recommended ? '#DDA935' : '#3a3a3a',
      ctaStyle: {
        position: 'relative', overflow: 'hidden', width: '100%', padding: '11px 0', borderRadius: '12px', cursor: 'pointer',
        border: '1px solid rgba(255,255,255,.28)', fontFamily: "'Assistant',sans-serif", fontSize: '14px', fontWeight: 800,
        background: `${p.ctaVeil}, ${p.solidGradient}`, color: '#fff', textShadow: '0 1px 2px rgba(0,0,0,.3)',
        boxShadow: isSelected
          ? '0 6px 14px -6px rgba(0,0,0,.5), inset 0 1px 0 rgba(255,255,255,.35), 0 0 0 2px rgba(255,255,255,.7)'
          : '0 4px 10px -6px rgba(0,0,0,.45), inset 0 1px 0 rgba(255,255,255,.3)',
      } as React.CSSProperties,
      ctaNoiseStyle: { position: 'absolute', inset: 0, backgroundImage: NOISE, backgroundSize: '120px 120px', mixBlendMode: 'overlay', opacity: p.recommended ? 0.6 : 0.45, pointerEvents: 'none', filter: p.recommended ? 'none' : 'grayscale(1)' } as React.CSSProperties,
      onSelect: () => setSelected(p.key),
      // First tap selects the column (ADD -> להמשיך); tapping the already-selected
      // package proceeds. Perfect Night is selected by default, so it needs only
      // a single tap to continue.
      onCta: () => {
        if (isSelected) navigate(`${ROUTES.REGISTER}?package=${p.name}&price=${p.price}`);
        else setSelected(p.key);
      },
    };
  });

  const markBase: React.CSSProperties = { display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '11px 0', borderBottom: '1px solid #e3ddcc', position: 'relative', zIndex: 1 };
  const baseInfoBtn: React.CSSProperties = { width: '15px', height: '15px', minWidth: '15px', flexShrink: 0, border: 'none', background: 'transparent', padding: 0, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', lineHeight: 0 };
  const cellBg = (key: string): string => (selected === key ? TINTS[key] : 'transparent');

  const featureRows = FEATURE_DEFS.map(([label, s, sm, u, bold, infoKey, shiftRight]) => ({
    label,
    labelStyle: { fontSize: '12px', color: '#232323', lineHeight: 1.25, fontWeight: bold ? 800 : 500, display: 'flex', alignItems: 'center', gap: '5px', fontFamily: "'Assistant',sans-serif", padding: '11px 2px 11px 0', borderBottom: '1px solid #e3ddcc', position: 'relative', zIndex: 1 } as React.CSSProperties,
    starterCellStyle: { ...markBase, background: cellBg('starter') } as React.CSSProperties,
    smartCellStyle: { ...markBase, background: cellBg('smart') } as React.CSSProperties,
    unlimitedCellStyle: { ...markBase, background: cellBg('unlimited') } as React.CSSProperties,
    starterOn: s, smartOn: sm, unlimitedOn: u,
    hasInfo: !!infoKey,
    infoBtnStyle: shiftRight ? { ...baseInfoBtn, transform: 'translateX(8px)' } : { ...baseInfoBtn, transform: 'translateX(-2px)' },
    onInfo: infoKey ? () => setInfoOpenKey(infoKey) : undefined,
  }));

  const dashLight: React.CSSProperties = { display: 'block', width: '16px', height: '1px', background: '#c9c0aa' };

  return (
    <section
      id="packages"
      className="pt-[35px] mt-[-67px] pb-[68px] bg-[#F7F7F7] rounded-t-[40px] shadow-[0_-25px_50px_rgba(0,0,0,0.15)] relative z-[350] overflow-x-clip"
    >
      <style dangerouslySetInnerHTML={{ __html: `
        @import url('https://fonts.googleapis.com/css2?family=Assistant:wght@200..800&family=Miriam+Libre:wght@400;700&display=swap');
      `}} />

      <div className="max-w-[1400px] mx-auto px-6" dir="rtl">
        <div style={{ maxWidth: '520px', margin: '0 auto' }}>

          <div style={{ padding: '24px 8px 14px', textAlign: 'center' }}>
            <div style={{ fontSize: 'clamp(42px, 14vw, 66px)', fontWeight: 900, color: '#292524', fontFamily: "'Assistant',sans-serif", lineHeight: 1, whiteSpace: 'nowrap' }}>החבילות שלנו</div>
            <div style={{ fontSize: 'clamp(20px, 5.5vw, 24px)', fontWeight: 300, color: '#78716c', marginTop: '12px', letterSpacing: '0.1px', lineHeight: 1.25, maxWidth: '360px', marginInline: 'auto' }}>
              <span style={{ whiteSpace: 'nowrap' }}>בחרו את הדרך המושלמת לחבר את</span>{' '}
              <span style={{ whiteSpace: 'nowrap' }}>הרגעים המיוחדים</span>
            </div>
          </div>

          <div style={{ padding: '14px 0 4px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1.1fr minmax(0,1fr) minmax(0,1fr) minmax(0,1fr)', columnGap: '6px', rowGap: 0 }}>

              {/* Header row: label bar + package name boxes */}
              <div style={labels.barCellStyle}>
                <div style={labels.barStyle}>
                  <div style={labels.barNoiseStyle} />
                  <div style={labels.barSheenStyle} />
                  <div style={labels.barTextStyle}>בחרו חבילה</div>
                </div>
              </div>
              {packages.map((pkg) => (
                <div key={pkg.key} style={pkg.headerCellStyle} onClick={pkg.onSelect}>
                  <div style={pkg.colHeaderStyle}>
                    <div style={pkg.noiseStyle} />
                    <div style={pkg.sheenStyle} />
                    <div style={{ position: 'relative', zIndex: 1 }}>
                      <div style={pkg.colNameStyle}>{pkg.name}</div>
                      <div style={pkg.colEnglishStyle}>{pkg.englishName}</div>
                    </div>
                  </div>
                </div>
              ))}

              {/* Feature rows */}
              {featureRows.map((row, ri) => (
                <React.Fragment key={ri}>
                  <div style={row.labelStyle}>
                    {row.label}
                    {row.hasInfo && (
                      <button onClick={row.onInfo} style={row.infoBtnStyle}>
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" style={{ position: 'relative', left: '5px' }}>
                          <circle cx="12" cy="12" r="10" stroke="#f59e0b" strokeWidth="2" />
                          <path d="M12 11v5" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" />
                          <circle cx="12" cy="7.8" r="1.1" fill="#f59e0b" />
                        </svg>
                      </button>
                    )}
                  </div>
                  <div style={row.starterCellStyle}>
                    {row.starterOn ? <CheckMark circle="#5C5C5C" stroke="#fff" /> : <span style={dashLight} />}
                  </div>
                  <div style={row.smartCellStyle}>
                    {row.smartOn ? <CheckMark circle="#242424" stroke="#fff" /> : <span style={dashLight} />}
                  </div>
                  <div style={row.unlimitedCellStyle}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(112deg,#F3DDA1,#E3B444)', borderRadius: '8px', minHeight: '26px', width: '100%' }}>
                      {row.unlimitedOn
                        ? <CheckMark circle="#FFFDF5" stroke="#DDA935" strokeWidth={2.8} />
                        : <span style={{ display: 'block', width: '16px', height: '1.5px', background: 'rgba(255,255,255,.6)' }} />}
                    </div>
                  </div>
                </React.Fragment>
              ))}

              {/* CTA row */}
              <div style={labels.ctaCellWrapStyle}>
                <div style={labels.ctaBlockStyle}>
                  <div style={labels.ctaBlockNoiseStyle} />
                  <span style={{ position: 'relative', zIndex: 1, fontSize: '13px' }}>בחרו</span>
                </div>
              </div>
              {packages.map((pkg) => (
                <div key={pkg.key} style={pkg.ctaCellStyle}>
                  <button onClick={pkg.onCta} style={pkg.ctaStyle}>
                    <div style={pkg.ctaNoiseStyle} />
                    <span style={{ position: 'relative', zIndex: 1, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '5px' }}>
                      {pkg.ctaText}
                      {pkg.selected && <CheckMark circle="#fff" stroke={pkg.ctaCheckStroke} strokeWidth={2.8} />}
                    </span>
                  </button>
                </div>
              ))}

              {/* Price row */}
              <div style={labels.priceLabelStyle} />
              {packages.map((pkg) => (
                <div key={pkg.key} style={pkg.priceCellStyle}>
                  <div style={pkg.priceNoteStyle}>
                    <div style={pkg.priceStyle}>₪{pkg.price}</div>
                  </div>
                </div>
              ))}

            </div>
          </div>
        </div>
      </div>

      {infoModal && (
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center p-6"
          style={{ background: 'rgba(35,35,35,.55)' }}
          onClick={closeInfo}
          dir="rtl"
        >
          <div style={{ background: '#fff', borderRadius: '20px', padding: '22px 20px', maxWidth: '280px', boxShadow: '0 20px 40px rgba(0,0,0,.3)' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', marginBottom: '8px' }}>
              <div style={{ fontSize: '16px', fontWeight: 800, color: '#232323', fontFamily: "'Assistant',sans-serif" }}>{infoModal.title}</div>
              <button onClick={closeInfo} style={{ flexShrink: 0, width: '28px', height: '28px', border: 'none', background: '#f4f0ea', borderRadius: '50%', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                  <path d="M6 6l12 12M18 6L6 18" stroke="#8a8378" strokeWidth="2.4" strokeLinecap="round" />
                </svg>
              </button>
            </div>
            <div style={{ fontSize: '13px', color: '#5F5F5F', lineHeight: 1.6 }}>{infoModal.body}</div>
            <button onClick={closeInfo} style={{ marginTop: '16px', width: '100%', padding: '10px 0', borderRadius: '10px', border: 'none', background: '#232323', color: '#fff', fontFamily: "'Assistant',sans-serif", fontSize: '14px', fontWeight: 700, cursor: 'pointer' }}>אפשר להתקדם</button>
          </div>
        </div>
      )}
    </section>
  );
};

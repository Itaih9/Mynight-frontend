import { useEffect, useMemo, useRef, useState } from 'react';

/**
 * Landing-page discount popup, driven by the ?promo= URL param so Meta ads can
 * point at a variant (or at the plain URL for no popup):
 *   /?promo=summer40  -> 40% off, code SUMMER40
 *   /?promo=summer25  -> 25% off, code SUMMER25
 * Appears 3s after load, on every load/refresh (no session guard, by design).
 * Self-expires after the promo window so it needs no redeploy to end.
 */

// Stops showing at this instant (end of July 2026, local).
const EXPIRES_AT = new Date('2026-08-01T00:00:00');

const VARIANTS: Record<string, { percent: number; code: string }> = {
  summer40: { percent: 40, code: 'SUMMER40' },
  summer25: { percent: 25, code: 'SUMMER25' },
};

const CONFETTI_COLORS = ['#F5C518', '#F9D970', '#111111', '#E8B923', '#ffffff'];

const Confetti = () => {
  // 70 pieces, each with randomised position/delay/spin, animated purely in CSS.
  const pieces = useMemo(
    () =>
      Array.from({ length: 70 }).map((_, i) => ({
        id: i,
        left: Math.random() * 100,
        delay: Math.random() * 0.6,
        duration: 2.4 + Math.random() * 1.8,
        size: 6 + Math.random() * 8,
        color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
        rotate: Math.random() * 360,
        drift: (Math.random() - 0.5) * 160,
      })),
    []
  );

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      {pieces.map((p) => (
        <span
          key={p.id}
          style={{
            position: 'absolute',
            top: '-16px',
            left: `${p.left}%`,
            width: `${p.size}px`,
            height: `${p.size * 0.5}px`,
            background: p.color,
            borderRadius: '1px',
            opacity: 0.9,
            animation: `mn-confetti-fall ${p.duration}s ${p.delay}s ease-in forwards`,
            // @ts-expect-error custom props consumed by the keyframes below
            '--mn-drift': `${p.drift}px`,
            '--mn-rot': `${p.rotate}deg`,
          }}
        />
      ))}
    </div>
  );
};

export const DiscountPopup = () => {
  const variant = useMemo(() => {
    if (typeof window === 'undefined') return null;
    if (new Date() >= EXPIRES_AT) return null;
    const promo = new URLSearchParams(window.location.search).get('promo');
    return promo ? VARIANTS[promo.toLowerCase()] ?? null : null;
  }, []);

  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const timerRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    if (!variant) return;
    timerRef.current = window.setTimeout(() => setOpen(true), 3000);
    return () => window.clearTimeout(timerRef.current);
  }, [variant]);

  if (!variant || !open) return null;

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(variant.code);
    } catch {
      // Clipboard blocked — select-as-fallback isn't worth it; the code is visible.
    }
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      dir="rtl"
      className="fixed inset-0 z-[999] flex items-center justify-center px-4"
      onClick={() => setOpen(false)}
    >
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-[mn-fade_0.3s_ease]" />
      <Confetti />

      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-md bg-white rounded-[28px] shadow-2xl px-8 py-10 text-center animate-[mn-pop_0.45s_cubic-bezier(0.2,0.8,0.2,1)]"
      >
        <button
          onClick={() => setOpen(false)}
          aria-label="סגירה"
          className="absolute top-4 left-4 w-9 h-9 rounded-full text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors flex items-center justify-center text-2xl leading-none"
        >
          ×
        </button>

        <div className="text-[64px] leading-none font-black text-transparent bg-clip-text bg-gradient-to-b from-gold-primary to-gold-secondary">
          {variant.percent}%
        </div>
        <h2 className="mt-2 text-2xl font-bold text-stone-900">הנחה על כל החבילות</h2>
        <p className="mt-2 text-base text-stone-500">לרוכשים עד סוף חודש יולי</p>

        <button
          onClick={copyCode}
          className="mt-7 w-full group flex items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-gold-primary bg-gold-primary/10 py-4 transition-colors hover:bg-gold-primary/20"
        >
          <span className="text-sm text-stone-500">קוד:</span>
          <span className="text-2xl font-black tracking-[0.15em] text-stone-900" dir="ltr">
            {variant.code}
          </span>
          <span className="text-sm font-bold text-gold-primary group-hover:text-gold-secondary min-w-[56px]">
            {copied ? 'הועתק ✓' : 'העתקה'}
          </span>
        </button>
      </div>

      <style>{`
        @keyframes mn-fade { from { opacity: 0 } to { opacity: 1 } }
        @keyframes mn-pop {
          0% { transform: scale(0.85) translateY(20px); opacity: 0 }
          100% { transform: scale(1) translateY(0); opacity: 1 }
        }
        @keyframes mn-confetti-fall {
          0% { transform: translate(0, 0) rotate(0deg); opacity: 1 }
          100% { transform: translate(var(--mn-drift), 105vh) rotate(calc(var(--mn-rot) + 540deg)); opacity: 0.9 }
        }
      `}</style>
    </div>
  );
};

export default DiscountPopup;

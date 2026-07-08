import { useEffect, useRef } from 'react';
import { useLocation, useNavigationType } from 'react-router-dom';

// Remembers the scroll position of each history entry and restores it on
// back/forward (POP) navigation, so returning to a page lands at the exact spot
// you left. Keyed by the router's per-entry location.key, with a path-based
// fallback because pages that call history.pushState/replaceState directly
// (e.g. the Register back-trap) can clobber the router's entry keys.
const byKey = new Map<string, number>();
const byPath = new Map<string, number>();

export const ScrollRestoration = () => {
  const location = useLocation();
  const navType = useNavigationType(); // 'POP' | 'PUSH' | 'REPLACE'
  const keyRef = useRef(location.key);
  const pathRef = useRef(location.pathname + location.search);

  // Continuously record the current entry's scroll offset while it is visible.
  useEffect(() => {
    keyRef.current = location.key;
    pathRef.current = location.pathname + location.search;
    const save = () => {
      byKey.set(keyRef.current, window.scrollY);
      byPath.set(pathRef.current, window.scrollY);
    };
    window.addEventListener('scroll', save, { passive: true });
    return () => {
      save(); // capture the final position before the entry changes
      window.removeEventListener('scroll', save);
    };
  }, [location.key, location.pathname, location.search]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if ('scrollRestoration' in window.history) window.history.scrollRestoration = 'manual';

    if (navType === 'POP') {
      const target =
        byKey.get(location.key) ??
        byPath.get(location.pathname + location.search) ??
        0;
      if (target <= 0) {
        window.scrollTo(0, 0);
        return;
      }

      let cancelled = false;
      const start = performance.now();
      const stop = () => { cancelled = true; };
      // A real user gesture wins over our restoration attempts.
      window.addEventListener('wheel', stop, { passive: true });
      window.addEventListener('touchmove', stop, { passive: true });

      // Re-apply the offset across frames: the landing page grows as lazy
      // images/sections load, so a single scrollTo would clamp short and land
      // at the wrong place. Keep going until the page is tall enough (up to
      // ~1.5s), plus a short hold to beat late layout shifts.
      const tick = () => {
        if (cancelled) return;
        const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
        window.scrollTo(0, Math.min(target, Math.max(0, maxScroll)));
        const elapsed = performance.now() - start;
        if ((maxScroll < target && elapsed < 1500) || elapsed < 500) {
          requestAnimationFrame(tick);
        } else {
          cancelled = true;
        }
      };
      requestAnimationFrame(tick);

      return () => {
        cancelled = true;
        window.removeEventListener('wheel', stop);
        window.removeEventListener('touchmove', stop);
      };
    }

    // New navigation: top of page, unless a #hash anchor owns the scroll.
    if (!location.hash) window.scrollTo(0, 0);
  }, [location.key, navType, location.hash, location.pathname, location.search]);

  return null;
};

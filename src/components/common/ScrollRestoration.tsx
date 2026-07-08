import { useEffect, useRef } from 'react';
import { useLocation, useNavigationType } from 'react-router-dom';

// Remembers the scroll position of each history entry (keyed by the router's
// per-entry location.key) and restores it on back/forward (POP) navigation, so
// returning to a page lands at the exact spot you left. Forward navigations
// (PUSH) start at the top unless the URL targets a #hash anchor.
const positions = new Map<string, number>();

export const ScrollRestoration = () => {
  const location = useLocation();
  const navType = useNavigationType(); // 'POP' | 'PUSH' | 'REPLACE'
  const keyRef = useRef(location.key);

  // Continuously record the current entry's scroll offset while it is visible.
  useEffect(() => {
    keyRef.current = location.key;
    const save = () => positions.set(keyRef.current, window.scrollY);
    window.addEventListener('scroll', save, { passive: true });
    return () => {
      save(); // capture the final position before the entry unmounts
      window.removeEventListener('scroll', save);
    };
  }, [location.key]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if ('scrollRestoration' in window.history) window.history.scrollRestoration = 'manual';

    if (navType === 'POP') {
      // Restore the saved position; retry a couple of times so async content
      // (lazy images/sections) that grows the page doesn't clamp the offset.
      const target = positions.get(location.key) ?? 0;
      const restore = () => window.scrollTo(0, target);
      restore();
      const t1 = setTimeout(restore, 100);
      const t2 = setTimeout(restore, 300);
      return () => { clearTimeout(t1); clearTimeout(t2); };
    }

    // New navigation: top of page, unless a #hash anchor owns the scroll.
    if (!location.hash) window.scrollTo(0, 0);
  }, [location.key, navType, location.hash]);

  return null;
};

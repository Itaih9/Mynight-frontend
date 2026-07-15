import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';

declare global {
  interface Window {
    fbq?: (...args: any[]) => void;
  }
}

/**
 * The base pixel in index.html only fires PageView on a hard load. This app is
 * client-side routed, so every navigation after the first would go unreported.
 * Fire one PageView per route change — skipping the first, which index.html
 * already sent, so the landing page isn't counted twice.
 */
export const PixelPageViews = () => {
  const location = useLocation();
  const firstRender = useRef(true);

  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    window.fbq?.('track', 'PageView');
  }, [location.pathname]);

  return null;
};

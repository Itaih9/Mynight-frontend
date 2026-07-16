import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';

declare global {
  interface Window {
    gtag?: (...args: any[]) => void;
  }
}

const GA_ID = 'G-12VW19EYZC';

/**
 * The gtag config in index.html sends page_view only on hard load. This app is
 * client-side routed, so every navigation after the first would go uncounted.
 * Send a page_view per route change — skipping the first, which index.html
 * already sent, so the landing page isn't counted twice.
 */
export const GaPageViews = () => {
  const location = useLocation();
  const firstRender = useRef(true);

  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    window.gtag?.('event', 'page_view', {
      page_path: location.pathname + location.search,
      page_location: window.location.href,
      send_to: GA_ID,
    });
  }, [location.pathname, location.search]);

  return null;
};

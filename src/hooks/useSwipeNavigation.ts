import { useRef, useCallback, type TouchEvent } from 'react';

interface SwipeNavigationHandlers {
  onTouchStart: (e: TouchEvent) => void;
  onTouchMove: (e: TouchEvent) => void;
  onTouchEnd: (e: TouchEvent) => void;
}

interface SwipeNavigationOptions {
  /** Minimum horizontal distance (px) before a swipe counts as a navigation gesture. */
  minDistance?: number;
}

/**
 * Adds swipe-to-navigate gestures to a photo/video lightbox, in addition to
 * the existing arrow buttons / keyboard arrows.
 *
 * Direction matches this app's existing RTL convention used by the arrow
 * buttons and ArrowLeft/ArrowRight key handlers: swiping left calls
 * onNavigate('next'), swiping right calls onNavigate('prev').
 *
 * Only a single-finger horizontal swipe past `minDistance`, dominant over
 * vertical movement, triggers navigation. Any multi-touch gesture (pinch to
 * zoom) is ignored, so zooming doesn't accidentally change photos, and neither
 * do vertical scrolls or taps.
 */
export function useSwipeNavigation(
  onNavigate: (direction: 'next' | 'prev') => void,
  options?: SwipeNavigationOptions
): SwipeNavigationHandlers {
  const minDistance = options?.minDistance ?? 50;
  const touchStart = useRef<{ x: number; y: number } | null>(null);
  const multiTouch = useRef(false);

  const onTouchStart = useCallback((e: TouchEvent) => {
    if (e.touches.length > 1) {
      // Second finger down — this is a pinch/zoom, not a swipe.
      multiTouch.current = true;
      touchStart.current = null;
      return;
    }
    multiTouch.current = false;
    const touch = e.touches[0];
    if (!touch) return;
    touchStart.current = { x: touch.clientX, y: touch.clientY };
  }, []);

  const onTouchMove = useCallback((e: TouchEvent) => {
    // A finger added mid-gesture also means pinch/zoom — abandon the swipe.
    if (e.touches.length > 1) {
      multiTouch.current = true;
      touchStart.current = null;
    }
  }, []);

  const onTouchEnd = useCallback(
    (e: TouchEvent) => {
      // Fingers still on screen (e.g. lifting one finger of a pinch) — not a
      // completed single-finger swipe.
      if (e.touches.length > 0) {
        touchStart.current = null;
        return;
      }

      const wasMultiTouch = multiTouch.current;
      multiTouch.current = false;
      const start = touchStart.current;
      touchStart.current = null;
      if (wasMultiTouch || !start) return;

      const touch = e.changedTouches[0];
      if (!touch) return;

      const deltaX = touch.clientX - start.x;
      const deltaY = touch.clientY - start.y;

      if (Math.abs(deltaX) < minDistance) return;
      if (Math.abs(deltaX) < Math.abs(deltaY)) return;

      onNavigate(deltaX < 0 ? 'next' : 'prev');
    },
    [onNavigate, minDistance]
  );

  return { onTouchStart, onTouchMove, onTouchEnd };
}

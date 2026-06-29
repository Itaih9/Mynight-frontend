import { useRef, useCallback, type TouchEvent } from 'react';

interface SwipeNavigationHandlers {
  onTouchStart: (e: TouchEvent) => void;
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
 * Only a horizontal swipe past `minDistance`, and dominant over vertical
 * movement, triggers navigation — so vertical scrolling, taps, and pinch
 * gestures aren't mistaken for a swipe.
 */
export function useSwipeNavigation(
  onNavigate: (direction: 'next' | 'prev') => void,
  options?: SwipeNavigationOptions
): SwipeNavigationHandlers {
  const minDistance = options?.minDistance ?? 50;
  const touchStart = useRef<{ x: number; y: number } | null>(null);

  const onTouchStart = useCallback((e: TouchEvent) => {
    const touch = e.touches[0];
    if (!touch) return;
    touchStart.current = { x: touch.clientX, y: touch.clientY };
  }, []);

  const onTouchEnd = useCallback(
    (e: TouchEvent) => {
      const start = touchStart.current;
      touchStart.current = null;
      if (!start) return;

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

  return { onTouchStart, onTouchEnd };
}

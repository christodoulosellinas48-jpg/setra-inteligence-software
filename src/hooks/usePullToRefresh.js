import { useEffect, useRef, useState } from 'react';

/**
 * Custom pull-to-refresh hook.
 * Returns { containerRef, isRefreshing } and calls onRefresh when pulled.
 */
export default function usePullToRefresh(onRefresh, threshold = 70) {
  const containerRef = useRef(null);
  const startYRef = useRef(null);
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    const el = containerRef.current || window;

    const onTouchStart = (e) => {
      const scrollTop = containerRef.current
        ? containerRef.current.scrollTop
        : window.scrollY;
      if (scrollTop <= 0) {
        startYRef.current = e.touches[0].clientY;
      }
    };

    const onTouchMove = (e) => {
      if (startYRef.current === null) return;
      const dy = e.touches[0].clientY - startYRef.current;
      if (dy > 0) {
        setPullDistance(Math.min(dy, threshold * 1.5));
      }
    };

    const onTouchEnd = async () => {
      if (pullDistance >= threshold && !isRefreshing) {
        setIsRefreshing(true);
        setPullDistance(0);
        startYRef.current = null;
        await onRefresh();
        setIsRefreshing(false);
      } else {
        setPullDistance(0);
        startYRef.current = null;
      }
    };

    const target = containerRef.current || window;
    target.addEventListener('touchstart', onTouchStart, { passive: true });
    target.addEventListener('touchmove', onTouchMove, { passive: true });
    target.addEventListener('touchend', onTouchEnd);

    return () => {
      target.removeEventListener('touchstart', onTouchStart);
      target.removeEventListener('touchmove', onTouchMove);
      target.removeEventListener('touchend', onTouchEnd);
    };
  }, [onRefresh, pullDistance, isRefreshing, threshold]);

  return { containerRef, isRefreshing, pullDistance };
}
import { useEffect, useRef, useCallback } from 'react';

const DEFAULT_IDLE_TIMEOUT_MS = 15 * 60 * 1000; // 15 minutes

export const useIdleTimeout = (onTimeout: () => void, enabled = true, timeoutMs = DEFAULT_IDLE_TIMEOUT_MS) => {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const resetTimer = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (enabled) {
      timerRef.current = setTimeout(onTimeout, timeoutMs);
    }
  }, [onTimeout, enabled, timeoutMs]);

  useEffect(() => {
    if (!enabled) return;

    const events = ['mousedown', 'keydown', 'scroll', 'touchstart', 'mousemove'];
    events.forEach(e => window.addEventListener(e, resetTimer, { passive: true }));
    resetTimer();

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      events.forEach(e => window.removeEventListener(e, resetTimer));
    };
  }, [resetTimer, enabled]);
};

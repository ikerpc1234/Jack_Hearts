import { useState, useEffect, useCallback, useRef } from 'react';

interface UseRobustTimerProps {
  targetTime: number; // Unix timestamp when timer should end
  onComplete?: () => void;
  enabled?: boolean;
}

export function useRobustTimer({ targetTime, onComplete, enabled = true }: UseRobustTimerProps) {
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const onCompleteRef = useRef(onComplete);
  const hasCompletedRef = useRef(false);

  // Keep callback ref updated
  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  const calculateTimeRemaining = useCallback(() => {
    if (!targetTime || !enabled) return 0;
    const remaining = Math.max(0, targetTime - Date.now());
    return remaining;
  }, [targetTime, enabled]);

  useEffect(() => {
    if (!enabled || !targetTime) {
      setTimeRemaining(0);
      setIsComplete(false);
      hasCompletedRef.current = false;
      return;
    }

    // Reset completion state when target changes
    hasCompletedRef.current = false;
    setIsComplete(false);

    const updateTimer = () => {
      const remaining = calculateTimeRemaining();
      setTimeRemaining(remaining);

      if (remaining === 0 && !hasCompletedRef.current) {
        hasCompletedRef.current = true;
        setIsComplete(true);
        onCompleteRef.current?.();
      }
    };

    // Initial update
    updateTimer();

    // Use both interval and visibility change for robustness
    const intervalId = setInterval(updateTimer, 1000);

    // Handle visibility change (when phone is unlocked or tab becomes visible)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        updateTimer();
      }
    };

    // Handle focus (additional check when window gains focus)
    const handleFocus = () => {
      updateTimer();
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);

    return () => {
      clearInterval(intervalId);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
    };
  }, [targetTime, enabled, calculateTimeRemaining]);

  const minutes = Math.floor(timeRemaining / 60000);
  const seconds = Math.floor((timeRemaining % 60000) / 1000);
  const progress = targetTime ? 1 - (timeRemaining / (targetTime - Date.now() + timeRemaining)) : 0;

  return {
    timeRemaining,
    minutes,
    seconds,
    isComplete,
    progress: Math.min(1, Math.max(0, progress)),
    formattedTime: `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`,
  };
}

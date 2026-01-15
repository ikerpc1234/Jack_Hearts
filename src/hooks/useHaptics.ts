// Haptic feedback utility using the Vibration API
// Works on most mobile browsers (Android Chrome, etc.)
// iOS Safari has limited support

type HapticPattern = 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'error' | 'double';

const PATTERNS: Record<HapticPattern, number | number[]> = {
  light: 10,
  medium: 25,
  heavy: 50,
  success: [10, 50, 10],
  warning: [50, 100, 50],
  error: [100, 50, 100, 50, 100],
  double: [25, 100, 25],
};

export function vibrate(pattern: HapticPattern = 'medium'): boolean {
  if (typeof navigator === 'undefined' || !navigator.vibrate) {
    return false;
  }

  try {
    return navigator.vibrate(PATTERNS[pattern]);
  } catch {
    return false;
  }
}

export function useHaptics() {
  const trigger = (pattern: HapticPattern = 'medium') => {
    vibrate(pattern);
  };

  const votingStart = () => vibrate('warning');
  const eliminated = () => vibrate('error');
  const roundEnd = () => vibrate('double');
  const success = () => vibrate('success');
  const tap = () => vibrate('light');

  return {
    trigger,
    votingStart,
    eliminated,
    roundEnd,
    success,
    tap,
  };
}

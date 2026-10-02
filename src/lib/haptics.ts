/** Best-effort vibration; unsupported browsers (e.g. iOS Safari) silently do nothing. */
export function haptic(pattern: number | number[] = 10): void {
  try {
    navigator.vibrate?.(pattern);
  } catch {
    // Some browsers throw when vibration is blocked by permissions policy.
  }
}

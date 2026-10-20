/**
 * Exponential backoff: attempt 0 -> 1s, 1 -> 2s, 2 -> 4s, 3 -> 8s ...
 * Capped so a long outage never waits longer than `capMs` between tries.
 */
export function backoffDelay(attempt: number, baseMs = 1000, capMs = 30000): number {
  if (attempt < 0) return baseMs;
  return Math.min(capMs, baseMs * 2 ** attempt);
}

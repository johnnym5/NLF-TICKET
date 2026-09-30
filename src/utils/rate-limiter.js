/**
 * Sliding Window Rate Limiter
 * Tracks action attempts in memory / sessionStorage.
 */
class RateLimiter {
  constructor() {
    this.storageKey = 'gcc_rate_limits_v1';
    this.limits = this.loadLimits();
  }

  loadLimits() {
    try {
      if (typeof window !== 'undefined' && window.sessionStorage) {
        const stored = sessionStorage.getItem(this.storageKey);
        return stored ? JSON.parse(stored) : {};
      }
    } catch (e) {}
    return {};
  }

  saveLimits() {
    try {
      if (typeof window !== 'undefined' && window.sessionStorage) {
        sessionStorage.setItem(this.storageKey, JSON.stringify(this.limits));
      }
    } catch (e) {}
  }

  /**
   * check
   * @param {string} actionKey - Unique key for the action (e.g. 'auth:login')
   * @param {number} maxAttempts - Max allowed attempts in window
   * @param {number} windowMs - Time window in milliseconds
   * @returns {{ allowed: boolean, remainingMs: number, remainingSeconds: number, remainingAttempts: number }}
   */
  check(actionKey, maxAttempts = 5, windowMs = 60000) {
    const now = Date.now();
    const timestamps = (this.limits[actionKey] || []).filter(ts => now - ts < windowMs);

    if (timestamps.length >= maxAttempts) {
      const oldest = timestamps[0];
      const remainingMs = Math.ceil(windowMs - (now - oldest));
      return {
        allowed: false,
        remainingMs,
        remainingSeconds: Math.ceil(remainingMs / 1000),
        remainingAttempts: 0
      };
    }

    timestamps.push(now);
    this.limits[actionKey] = timestamps;
    this.saveLimits();

    return {
      allowed: true,
      remainingMs: 0,
      remainingSeconds: 0,
      remainingAttempts: maxAttempts - timestamps.length
    };
  }

  /**
   * reset
   * Resets the attempts counter for a given action.
   */
  reset(actionKey) {
    delete this.limits[actionKey];
    this.saveLimits();
  }
}

export const rateLimiter = new RateLimiter();

/**
 * checkRateLimit
 * Helper function that returns boolean or throws error if limit exceeded.
 */
export function checkRateLimit(actionKey, maxAttempts = 5, windowMs = 60000) {
  const result = rateLimiter.check(actionKey, maxAttempts, windowMs);
  if (!result.allowed) {
    throw new Error(`Too many requests. Please wait ${result.remainingSeconds}s before trying again.`);
  }
  return true;
}

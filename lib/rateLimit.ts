type Key = string;

class SlidingWindowLimiter {
  private windowMs: number;
  private limit: number;
  private store: Map<Key, number[]> = new Map();

  constructor(limit: number, windowMs: number) {
    this.limit = limit;
    this.windowMs = windowMs;
  }

  allow(key: Key) {
    const now = Date.now();
    const cutoff = now - this.windowMs;
    const arr = (this.store.get(key) || []).filter((t) => t > cutoff);
    if (arr.length >= this.limit) return false;
    arr.push(now);
    this.store.set(key, arr);
    return true;
  }
}

// Global singletons per route
const perRouteLimiters: Record<string, SlidingWindowLimiter> = {};

export function rateLimit(routeKey: string, key: string, limit = 30, windowMs = 60_000) {
  const k = `${routeKey}:${limit}:${windowMs}`;
  let limiter = perRouteLimiters[k];
  if (!limiter) {
    limiter = new SlidingWindowLimiter(limit, windowMs);
    perRouteLimiters[k] = limiter;
  }
  return limiter.allow(key);
}


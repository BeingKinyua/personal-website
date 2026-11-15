/**
 * Tovu Intelligence Layer — Bounded Sliding-Window Rate Limiter
 * Includes expired-entry eviction, bounded map capacity to prevent memory DoS,
 * and standard Retry-After computation.
 */

export interface RateLimitRecord {
  count: number;
  resetAt: number;
}

export interface RateLimitOptions {
  windowMs: number;
  maxRequests: number;
}

export interface RateLimitResult {
  allowed: boolean;
  limit: number;
  remaining: number;
  resetInMs: number;
  retryAfterSeconds: number;
}

const MAX_TRACKED_KEYS = 10_000;
const rateLimitMap = new Map<string, RateLimitRecord>();

function pruneExpired(now: number): void {
  if (rateLimitMap.size === 0) return;

  for (const [key, record] of rateLimitMap.entries()) {
    if (now >= record.resetAt) {
      rateLimitMap.delete(key);
    }
  }

  // Hard cap: evict oldest keys if map still exceeds MAX_TRACKED_KEYS
  if (rateLimitMap.size >= MAX_TRACKED_KEYS) {
    const excess = rateLimitMap.size - MAX_TRACKED_KEYS + 1;
    let removed = 0;
    for (const key of rateLimitMap.keys()) {
      rateLimitMap.delete(key);
      removed++;
      if (removed >= excess) break;
    }
  }
}

export function checkRateLimit(
  identifier: string,
  options: RateLimitOptions = { windowMs: 60_000, maxRequests: 20 }
): RateLimitResult {
  const now = Date.now();

  if (rateLimitMap.size >= MAX_TRACKED_KEYS || Math.random() < 0.02) {
    pruneExpired(now);
  }

  const existing = rateLimitMap.get(identifier);

  if (!existing || now >= existing.resetAt) {
    rateLimitMap.set(identifier, {
      count: 1,
      resetAt: now + options.windowMs,
    });
    return {
      allowed: true,
      limit: options.maxRequests,
      remaining: Math.max(0, options.maxRequests - 1),
      resetInMs: options.windowMs,
      retryAfterSeconds: 0,
    };
  }

  const resetInMs = Math.max(0, existing.resetAt - now);

  if (existing.count >= options.maxRequests) {
    return {
      allowed: false,
      limit: options.maxRequests,
      remaining: 0,
      resetInMs,
      retryAfterSeconds: Math.max(1, Math.ceil(resetInMs / 1000)),
    };
  }

  existing.count++;
  return {
    allowed: true,
    limit: options.maxRequests,
    remaining: Math.max(0, options.maxRequests - existing.count),
    resetInMs,
    retryAfterSeconds: 0,
  };
}

export function clearRateLimits(): void {
  rateLimitMap.clear();
}

export function getRateLimitStoreSize(): number {
  return rateLimitMap.size;
}

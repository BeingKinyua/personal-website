/**
 * Shared fixed-window limiter backed by Upstash Redis REST.
 * The Lua script increments and sets expiry atomically across instances.
 * Configure both UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN.
 */
import { createHash } from "node:crypto";
import { checkRateLimit, type RateLimitOptions, type RateLimitResult } from "./rateLimit";

const SCRIPT = `local n=redis.call('INCR',KEYS[1]); if n==1 then redis.call('PEXPIRE',KEYS[1],ARGV[1]) end; local ttl=redis.call('PTTL',KEYS[1]); return {n,ttl}`;

export async function checkSharedRateLimit(
  identifier: string,
  options: RateLimitOptions
): Promise<RateLimitResult> {
  const url = process.env.UPSTASH_REDIS_REST_URL?.trim();
  const token = process.env.UPSTASH_REDIS_REST_TOKEN?.trim();
  if (!url && !token) {
    // Local development only. Production must use a shared store.
    if (process.env.NODE_ENV === "production") {
      throw new Error("Distributed rate limiter is not configured");
    }
    return checkRateLimit(identifier, options);
  }
  if (!url || !token || !/^https:\/\//.test(url)) {
    throw new Error("Invalid distributed rate limiter configuration");
  }
  const key = "tovu:limit:" + createHash("sha256").update(identifier).digest("hex");
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 3000);
  try {
    const response = await fetch(url.replace(/\/$/, ""), {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify(["EVAL", SCRIPT, 1, key, Math.max(1, Math.floor(options.windowMs))]),
      signal: controller.signal,
    });
    if (!response.ok) throw new Error("Rate limit storage unavailable");
    const payload: unknown = await response.json();
    if (!payload || typeof payload !== "object" || !("result" in payload)) {
      throw new Error("Unexpected rate limit storage response");
    }
    const result = (payload as { result: unknown }).result;
    if (!Array.isArray(result) || result.length !== 2) throw new Error("Invalid rate limit response");
    const count = Number(result[0]);
    const ttl = Number(result[1]);
    if (!Number.isSafeInteger(count) || count < 1 || !Number.isFinite(ttl) || ttl < 0) {
      throw new Error("Invalid rate limit counters");
    }
    const resetInMs = Math.ceil(ttl);
    const allowed = count <= options.maxRequests;
    return {
      allowed,
      limit: options.maxRequests,
      remaining: Math.max(0, options.maxRequests - count),
      resetInMs,
      retryAfterSeconds: allowed ? 0 : Math.max(1, Math.ceil(resetInMs / 1000)),
    };
  } finally {
    clearTimeout(timer);
  }
}

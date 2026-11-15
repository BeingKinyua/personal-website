# Phase 2 API rate limiting deployment

The API now uses a Redis-backed atomic fixed-window counter for search, Tovu, conversation retrieval and indexing. This prevents separate server instances from independently granting the same allowance.

## Required production configuration (before merging/deploying)

Set `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` as server-side environment variables on every production instance. Use a dedicated Redis database with access restricted to this app. Never expose the token in `VITE_*` variables or frontend bundles.

**This is a breaking deployment prerequisite:** when `NODE_ENV=production` and the store is not configured, protected endpoints fail closed rather than silently reverting to per-process counters. Do not merge until the Redis service and secrets are provisioned and a staging smoke test passes.

In development/test, the existing in-memory limiter remains available when both Redis variables are absent. Partial or invalid Redis configuration always errors. Storage failures and timeouts error rather than permitting requests.

The counter uses a fixed window (not a sliding window) and keys are SHA-256 hashes of the existing rate-limit identifiers. A Redis Lua script atomically increments the counter and initializes expiry on the first request.

## Verification

- Run `npm ci`, `npm run lint`, and `npm run build`.
- In staging, verify allowed requests and 429 responses after the configured threshold.
- Verify requests across two instances share the same allowance.
- Verify the Redis credentials are server-only, and simulate Redis unavailability to ensure requests do not reach Gemini.
- Check rate-limit response headers and ensure API failures do not leak secrets.

## Remaining work

The shared counter is request-count limiting, not Gemini token-cost budgeting. Introduce separate per-user/daily token budgets, model concurrency caps, and explicit upstream cancellation in subsequent commits. Also review Express trusted-proxy configuration: `req.ip` currently uses the socket address unless trusted proxy settings are configured. IP-based quotas may group visitors behind one proxy.

# Stage 1: Request authentication and conversation isolation

## Required deployment configuration

Set `VISITOR_SESSION_SECRET` to a cryptographically random secret of at least 32 characters in the **server-only** environment for every deployment (including previews that use Tovu AI). Do not prefix it with `VITE_` or `NEXT_PUBLIC_`. Use the same value on all instances in an environment; rotate intentionally because rotation invalidates visitor cookies.

The visitor session is stored in an HttpOnly, SameSite=Lax cookie; Secure is enabled in production. Browser API requests must include cookies when applicable. Do not use caller-supplied `sessionId`, `userId`, `x-session-id`, or `x-forwarded-for` as proof of ownership.

## Implemented

- Bearer tokens are verified via Supabase Auth per request.
- Authenticated content routes receive a request-scoped Supabase client; anonymous requests retain public RLS access.
- Profile lookup uses `profiles.user_id`.
- Tovu conversation reads and writes require ownership checks.
- Conversation and message inserts use UUIDs and deployed column names.
- Visitor session cookies are HMAC signed and HttpOnly.
- API middleware serializes invalid-token errors as JSON.
- The database itself has not been modified.

## Important limitations and follow-up checks

- This change does **not** prove the entire backend is secure. Review all service-role uses, particularly search and indexing, before deploying.
- The legacy `/api/chat` and `/api/scope` routes in `server.ts` still need schema validation, rate limiting and unified error handling.
- The in-memory rate limiter is per process and is not sufficient for horizontally scaled production. Move to a shared rate-limit store.
- There is no test execution evidence from the GitHub connector. Run `npm ci && npm run lint && npm run build` in CI and exercise the authorization cases below.
- The hand-maintained Supabase types are only partially reconciled with the deployed schema; regenerate and review all table types in a separate change.
- Existing client code may expect client-managed visitor sessions; confirm same-origin cookies work across the deployed frontend and API.
- Conversation creation is not currently exposed by the router; add a secure creation endpoint and integration tests before relying on multi-turn persistence.

## Security acceptance tests

1. Unauthenticated POST /api/v1/projects returns 401.
2. Invalid Bearer token returns 401 without falling back to anonymous.
3. Viewer cannot mutate published content; admin can.
4. Authenticated user profile is loaded using `user_id`.
5. Visitor A cannot read Visitor B's conversation or messages, even with a known UUID.
6. Spoofing request body `sessionId` or `userId` does not change identity.
7. Missing `VISITOR_SESSION_SECRET` does not break public content endpoints, but disables conversation endpoints.
8. Service-role secrets never appear in browser bundles or API responses.
9. Draft content is inaccessible to anonymous visitors.
10. Verify authorization errors are JSON and do not leak stack traces.

## Deployment

Deploy this branch only after the checks above pass. Do not merge it into `main` until it has been reviewed.

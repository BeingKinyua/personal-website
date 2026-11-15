/**
 * Tovu Cryptographic Visitor Session Manager
 * Issues and verifies HMAC-SHA256 signed HttpOnly visitor cookies so visitor session IDs
 * cannot be forged or hijacked via request body, query params, or custom headers.
 */

import crypto from "node:crypto";
import type { Request, Response } from "express";
import { getServerEnv } from "../shared/env";
import { logger } from "../shared/logger";

export const VISITOR_SESSION_COOKIE = "tovu_sid";
const VISITOR_COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 30; // 30 days

// Ephemeral per-process fallback secret if SESSION_SECRET is unset (never leaves server)
let ephemeralDevSecret: string | null = null;
let warnedMissingSecret = false;

function getSigningSecret(): string {
  const { sessionSecret, supabaseServiceRoleKey, nodeEnv } = getServerEnv();
  if (sessionSecret && sessionSecret.length >= 16) {
    return sessionSecret;
  }

  // Derive a deterministic HMAC key from server-only service role key if configured,
  // avoiding a distinct secret requirement in minimal deployments while keeping it server-only.
  if (
    supabaseServiceRoleKey &&
    !supabaseServiceRoleKey.includes("your-supabase") &&
    !supabaseServiceRoleKey.includes("placeholder")
  ) {
    return crypto
      .createHash("sha256")
      .update(`tovu-visitor-session:${supabaseServiceRoleKey}`)
      .digest("hex");
  }

  if (!ephemeralDevSecret) {
    ephemeralDevSecret = crypto.randomBytes(32).toString("hex");
  }

  if (!warnedMissingSecret) {
    warnedMissingSecret = true;
    const msg =
      nodeEnv === "production"
        ? "SESSION_SECRET is missing in production; using ephemeral per-process visitor signing key."
        : "SESSION_SECRET is not set; using ephemeral per-process dev key for visitor cookies.";
    logger.warn(msg);
  }

  return ephemeralDevSecret;
}

export function parseCookieHeader(cookieHeader?: string): Record<string, string> {
  if (!cookieHeader) return {};
  const result: Record<string, string> = {};
  for (const part of cookieHeader.split(";")) {
    const eqIndex = part.indexOf("=");
    if (eqIndex <= 0) continue;
    const key = part.slice(0, eqIndex).trim();
    const rawVal = part.slice(eqIndex + 1).trim();
    if (!key) continue;
    try {
      result[key] = decodeURIComponent(rawVal);
    } catch {
      result[key] = rawVal;
    }
  }
  return result;
}

function signSessionId(sessionId: string): string {
  const mac = crypto
    .createHmac("sha256", getSigningSecret())
    .update(sessionId)
    .digest("hex");
  return `${sessionId}.${mac}`;
}

/**
 * Verifies a signed visitor cookie token using timing-safe comparison.
 * Returns the raw sessionId if valid, or null if tampered / malformed.
 */
export function verifySignedVisitorSession(cookieValue?: string): string | null {
  if (!cookieValue || typeof cookieValue !== "string") return null;
  const dotIdx = cookieValue.lastIndexOf(".");
  if (dotIdx <= 0) return null;

  const sessionId = cookieValue.slice(0, dotIdx);
  const providedMac = cookieValue.slice(dotIdx + 1);

  if (!/^sid_[a-f0-9]{32}$/.test(sessionId) || !/^[a-f0-9]{64}$/.test(providedMac)) {
    return null;
  }

  const expectedMac = crypto
    .createHmac("sha256", getSigningSecret())
    .update(sessionId)
    .digest("hex");

  const providedBuf = Buffer.from(providedMac, "hex");
  const expectedBuf = Buffer.from(expectedMac, "hex");

  if (providedBuf.length !== expectedBuf.length) {
    return null;
  }

  if (!crypto.timingSafeEqual(providedBuf, expectedBuf)) {
    return null;
  }

  return sessionId;
}

/**
 * Creates a signed cookie string for tests or manual Set-Cookie emission.
 */
export function issueSignedVisitorToken(): { sessionId: string; cookieToken: string } {
  const sessionId = `sid_${crypto.randomBytes(16).toString("hex")}`;
  return {
    sessionId,
    cookieToken: signSessionId(sessionId),
  };
}

function appendSetCookie(res: Response, cookieLine: string): void {
  const existing = res.getHeader("Set-Cookie");
  if (!existing) {
    res.setHeader("Set-Cookie", [cookieLine]);
  } else if (Array.isArray(existing)) {
    res.setHeader("Set-Cookie", [...existing.map(String), cookieLine]);
  } else {
    res.setHeader("Set-Cookie", [String(existing), cookieLine]);
  }
}

/**
 * Resolves the verified visitor session from the HttpOnly cookie, or issues a new
 * cryptographically signed HttpOnly SameSite=Lax cookie if absent/invalid.
 */
export function resolveOrIssueVisitorSession(
  req: Pick<Request, "headers">,
  res?: Pick<Response, "getHeader" | "setHeader">
): { sessionId: string; isNew: boolean } {
  const cookies = parseCookieHeader(req.headers.cookie);
  const verified = verifySignedVisitorSession(cookies[VISITOR_SESSION_COOKIE]);

  if (verified) {
    return { sessionId: verified, isNew: false };
  }

  const { sessionId, cookieToken } = issueSignedVisitorToken();

  if (res) {
    const isProd = process.env.NODE_ENV === "production";
    const attributes = [
      `${VISITOR_SESSION_COOKIE}=${encodeURIComponent(cookieToken)}`,
      "Path=/",
      "HttpOnly",
      "SameSite=Lax",
      `Max-Age=${VISITOR_COOKIE_MAX_AGE_SECONDS}`,
      ...(isProd ? ["Secure"] : []),
    ];
    appendSetCookie(res as Response, attributes.join("; "));
  }

  return { sessionId, isNew: true };
}

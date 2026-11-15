import type { Request, Response, NextFunction } from "express";
import { randomBytes, createHmac, timingSafeEqual } from "node:crypto";
import { createSupabaseClientWithToken } from "../supabase/server";
import { AuthenticationError } from "../shared/errors";
import type { User, SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../supabase/types";

export interface RequestIdentity {
  user: User | null;
  client: SupabaseClient<Database> | null;
  visitorSession: string;
}
export interface AuthenticatedRequest extends Request {
  identity: RequestIdentity;
}
const COOKIE = "tovu_visitor";
const MAX_AGE = 60 * 60 * 24 * 30;

function sign(value: string): string {
  const secret = process.env.VISITOR_SESSION_SECRET;
  if (!secret || secret.length < 32) throw new Error("VISITOR_SESSION_SECRET must be at least 32 characters");
  return createHmac("sha256", secret).update(value).digest("hex");
}
function verify(value: string): string | null {
  const [id, signature, extra] = value.split(".");
  if (extra || !id || !signature || !/^[a-f0-9]{64}$/.test(id) || !/^[a-f0-9]{64}$/.test(signature)) return null;
  const expected = Buffer.from(sign(id), "hex");
  const supplied = Buffer.from(signature, "hex");
  return expected.length === supplied.length && timingSafeEqual(expected, supplied) ? id : null;
}
function readCookie(req: Request): string | undefined {
  const entry = (req.headers.cookie || "").split(";").map(s => s.trim()).find(s => s.startsWith(COOKIE + "="));
  return entry?.slice(COOKIE.length + 1);
}
/** Verifies caller identity and issues a tamper-evident, HTTP-only visitor cookie. */
export async function bindRequestIdentity(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const bearer = req.headers.authorization;
    let user: User | null = null;
    let client: SupabaseClient<Database> | null = null;
    if (bearer) {
      const match = /^Bearer\s+([^\s]+)$/i.exec(bearer);
      if (!match) throw new AuthenticationError("Invalid Authorization header");
      client = createSupabaseClientWithToken(match[1]);
      const result = await client.auth.getUser(match[1]);
      if (result.error || !result.data.user) throw new AuthenticationError("Invalid or expired access token");
      user = result.data.user;
    }
    let visitorSession = readCookie(req) ? verify(readCookie(req)!) : null;
    if (!visitorSession) {
      visitorSession = randomBytes(32).toString("hex");
      const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
      res.setHeader("Set-Cookie", COOKIE + "=" + visitorSession + "." + sign(visitorSession) +
        "; Path=/; HttpOnly; SameSite=Lax; Max-Age=" + MAX_AGE + secure);
    }
    (req as AuthenticatedRequest).identity = { user, client, visitorSession };
    next();
  } catch (error) {
    next(error);
  }
}
export function identity(req: Request): RequestIdentity {
  const result = (req as AuthenticatedRequest).identity;
  if (!result) throw new AuthenticationError("Request identity unavailable");
  return result;
}

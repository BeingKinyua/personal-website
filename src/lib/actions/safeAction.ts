/**
 * VictorOS Safe Server Action Wrapper
 * Standardized execution harness for Next.js Server Actions and Command Center operations:
 * 1. Authenticates active session (optional or required)
 * 2. Enforces role-based authorization
 * 3. Validates client input via Zod schemas
 * 4. Dispatches to domain services
 * 5. Masks and logs operation diagnostics
 * 6. Returns standardized, serializable response format
 */

import { z } from "zod";
import { getCurrentProfile, getCurrentUser } from "../auth/session";
import { hasRole, type Role } from "../auth/roles";
import { AuthenticationError, AuthorizationError, ValidationError, toSafeErrorResponse } from "../shared/errors";
import { logger } from "../shared/logger";
import type { ProfileRecord } from "../auth/authorization";
import type { User } from "@supabase/supabase-js";

export interface ActionResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    statusCode: number;
    details?: unknown;
  };
}

export interface ActionContext {
  user: User | null;
  profile: ProfileRecord | null;
}

export interface ActionOptions<TSchema extends z.ZodTypeAny> {
  schema?: TSchema;
  requireAuth?: boolean;
  requireRole?: Role;
  actionName?: string;
}

/**
 * Higher-order Server Action builder ensuring validation, auth, and error trapping.
 */
export function createSafeAction<TSchema extends z.ZodTypeAny, TResult>(
  options: ActionOptions<TSchema>,
  handler: (input: z.infer<TSchema>, ctx: ActionContext) => Promise<TResult>
) {
  return async (rawInput: unknown): Promise<ActionResponse<TResult>> => {
    const actionName = options.actionName || "AnonymousAction";
    const actionLogger = logger.child({ action: actionName });

    try {
      // 1. Session verification
      const user = await getCurrentUser();
      const profile = await getCurrentProfile();

      if (options.requireAuth && !user) {
        throw new AuthenticationError("Authentication required to perform this action.");
      }

      // 2. Role authorization check
      if (options.requireRole) {
        if (!profile || !hasRole(profile.role, options.requireRole)) {
          throw new AuthorizationError(
            `Insufficient permissions. Required role: ${options.requireRole}`
          );
        }
      }

      // 3. Input validation
      let validatedInput: z.infer<TSchema> = rawInput as z.infer<TSchema>;
      if (options.schema) {
        const parseResult = options.schema.safeParse(rawInput);
        if (!parseResult.success) {
          throw new ValidationError("Input validation failed", {
            errors: parseResult.error.format(),
          });
        }
        validatedInput = parseResult.data;
      }

      actionLogger.info(`Executing server action: ${actionName}`, {
        userId: user?.id,
        role: profile?.role,
      });

      // 4. Execution
      const result = await handler(validatedInput, { user, profile });

      return {
        success: true,
        data: result,
      };
    } catch (err) {
      actionLogger.error(`Server action failed: ${actionName}`, err);
      const safeError = toSafeErrorResponse(err);
      return safeError;
    }
  };
}

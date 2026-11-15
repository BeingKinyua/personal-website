import { TovuRequest, TovuResponse } from "../types/tovu";
import { apiRequest, shouldFallbackToDevFixture } from "./apiClient";
import { PROJECTS } from "../data/projects";
import { ARTICLES } from "../data/articles";

interface BackendTovuPayload {
  message: string;
  actions?: Array<{ label: string; action: string; target?: string }>;
  references?: Array<{
    type: string;
    id: string;
    title: string;
    slug?: string;
    badge?: string;
  }>;
  intent?: string;
  confidence?: number;
  conversationId?: string;
  fallbackUsed?: boolean;
  persistenceStatus?: "persisted" | "ephemeral" | "failed";
}

function buildDevFixtureTovuResponse(message: string): TovuResponse {
  const query = message.trim().toLowerCase();

  if (query.includes("ai") || query.includes("project") || query.includes("nyayo") || query.includes("football")) {
    const matched = PROJECTS.filter(
      (p) =>
        p.title.toLowerCase().includes(query) ||
        p.category.toLowerCase().includes("ai") ||
        p.technologies.some((t) => t.toLowerCase().includes("ai") || t.toLowerCase().includes("python"))
    ).slice(0, 3);

    return {
      message:
        `[Development Fixture] Evaluated portfolio records for "${message}". Highlighted systems include:\n\n` +
        matched.map((p) => `• **${p.number} — ${p.title}**: ${p.subtitle}`).join("\n"),
      references: matched.map((p) => ({
        type: "project",
        id: p.id,
        title: p.title,
        slug: p.slug,
        badge: p.category,
      })),
      actions: [
        ...matched.slice(0, 2).map((p) => ({
          label: `Open ${p.title}`,
          type: "open_project" as const,
          target: p.slug,
        })),
        { label: "Explore Work", type: "navigate", target: "work" },
      ],
      fallbackUsed: true,
      persistenceStatus: "ephemeral",
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };
  }

  return {
    message:
      `[Development Fixture] Supabase is not configured in local dev mode. Explore Tovu modules below to inspect documented projects, essays, experiments, and concepts.`,
    references: ARTICLES.slice(0, 2).map((a) => ({
      type: "article",
      id: a.id,
      title: a.title,
      slug: a.slug,
      badge: a.category,
    })),
    actions: [
      { label: "Explore Work", type: "navigate", target: "work" },
      { label: "Read Journal", type: "navigate", target: "journal" },
      { label: "Open Lab", type: "navigate", target: "lab" },
    ],
    fallbackUsed: true,
    persistenceStatus: "ephemeral",
    timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
  };
}

/**
 * Tovu — System Intelligence Layer
 * Sends queries to canonical POST /api/v1/tovu using HTTP-only visitor session cookies.
 * Never swallows 400/403/429/500 errors; dev fixtures run only when explicitly enabled
 * and Supabase returns 503 SUPABASE_NOT_CONFIGURED.
 */
export async function askTovu(request: TovuRequest): Promise<TovuResponse> {
  try {
    const data = await apiRequest<BackendTovuPayload>("/tovu", {
      method: "POST",
      body: {
        message: request.message,
        conversationId: request.conversationId,
        context: request.context,
      },
      signal: request.signal,
    });

    return {
      message: data.message,
      intent: data.intent,
      confidence: data.confidence,
      conversationId: data.conversationId,
      fallbackUsed: data.fallbackUsed,
      persistenceStatus: data.persistenceStatus,
      actions: data.actions?.map((a) => ({
        label: a.label,
        type: a.action as any,
        target: a.target || "work",
      })),
      references: data.references?.map((r) => ({
        type: r.type as any,
        id: r.id,
        title: r.title,
        slug: r.slug || r.id,
        badge: r.badge,
      })),
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };
  } catch (err) {
    if (shouldFallbackToDevFixture(err)) {
      return buildDevFixtureTovuResponse(request.message);
    }
    throw err;
  }
}

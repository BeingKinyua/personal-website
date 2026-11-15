/**
 * Tovu Backend API Router
 * Dispatches HTTP requests to request-scoped domain services with strict authentication,
 * role-based authorization, cryptographic visitor sessions, and standard error framing.
 */

import { Router, type Request, type Response } from "express";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "../supabase/types";
import { executeApiHandler } from "../shared/api";
import { ProjectRepository } from "../projects/repository";
import { ProjectService } from "../projects/service";
import { ArticleRepository } from "../articles/repository";
import { ArticleService } from "../articles/service";
import { LabRepository } from "../labs/repository";
import { LabService } from "../labs/service";
import { KnowledgeRepository } from "../knowledge/repository";
import { KnowledgeService } from "../knowledge/service";
import { MediaRepository } from "../media/repository";
import { MediaService } from "../media/service";
import { HybridSearchService } from "../search/hybrid";
import { TovuService } from "../ai/tovu/service";
import { ContentIndexer } from "../ai/embeddings/indexer";
import { ConversationService, toPublicConversation } from "../ai/conversations/service";
import { checkRateLimit } from "../shared/rateLimit";
import {
  resolveRequestAuthContext,
  requireRequestAuthContext,
} from "../auth/session";
import { canAccessCommandCenter, canManageSystem } from "../auth/authorization";
import { resolveOrIssueVisitorSession } from "../auth/visitorSession";
import { SYSTEM, HTTP_STATUS } from "../shared/constants";
import { assertSupabaseConfigured, getServerEnv, isSupabaseConfigured } from "../shared/env";
import {
  AuthorizationError,
  TooManyRequestsError,
  ValidationError,
} from "../shared/errors";

function buildScopedServices(client?: SupabaseClient<Database> | null) {
  const c = client || undefined;
  return {
    projects: new ProjectService(new ProjectRepository(c)),
    articles: new ArticleService(new ArticleRepository(c)),
    labs: new LabService(new LabRepository(c)),
    knowledge: new KnowledgeService(new KnowledgeRepository(c)),
    media: new MediaService(new MediaRepository(c)),
  };
}

function getClientIp(req: Request): string {
  // Express derives req.ip from the socket unless a trusted proxy is configured.
  // Never trust a caller-supplied X-Forwarded-For header directly.
  return req.ip || req.socket.remoteAddress || "unknown";
}

export function createBackendRouter(): Router {
  const router = Router();

  // Health and System Diagnostics
  router.get("/health", (_req, res) => {
    executeApiHandler(res, async () => {
      const serverEnv = getServerEnv();

      return {
        system: SYSTEM.NAME,
        version: SYSTEM.VERSION,
        status: "operational",
        timestamp: new Date().toISOString(),
        environment: serverEnv.nodeEnv,
        features: {
          supabaseConfigured: isSupabaseConfigured(false),
          adminKeyConfigured: isSupabaseConfigured(true),
          geminiKeyConfigured: Boolean(
            serverEnv.geminiApiKey && serverEnv.geminiApiKey !== "MY_GEMINI_API_KEY"
          ),
        },
      };
    });
  });

  // Authentication & Session inspection (strictly scoped to caller credentials)
  router.get("/auth/session", (req, res) => {
    executeApiHandler(res, async () => {
      const { user, profile } = await resolveRequestAuthContext(req, res);

      return {
        authenticated: Boolean(user),
        user: user ? { id: user.id, email: user.email } : null,
        profile: profile
          ? { id: profile.id, username: profile.username, role: profile.role }
          : null,
      };
    });
  });

  // Projects Endpoints
  router.get("/projects", (req, res) => {
    executeApiHandler(res, async () => {
      const { client, profile } = await resolveRequestAuthContext(req, res);
      return await buildScopedServices(client).projects.listProjects(req.query, profile);
    });
  });

  router.get("/projects/:slug", (req, res) => {
    executeApiHandler(res, async () => {
      const { client, profile } = await resolveRequestAuthContext(req, res);
      return await buildScopedServices(client).projects.getProjectBySlug(
        req.params.slug,
        profile
      );
    });
  });

  router.post("/projects", (req, res) => {
    executeApiHandler(
      res,
      async () => {
        const { client, profile } = await requireRequestAuthContext(req, res);
        return await buildScopedServices(client).projects.createProject(req.body, profile);
      },
      HTTP_STATUS.CREATED
    );
  });

  router.put("/projects/:id", (req, res) => {
    executeApiHandler(res, async () => {
      const { client, profile } = await requireRequestAuthContext(req, res);
      return await buildScopedServices(client).projects.updateProject(
        req.params.id,
        req.body,
        profile
      );
    });
  });

  router.post("/projects/:id/publish", (req, res) => {
    executeApiHandler(res, async () => {
      const { client, profile } = await requireRequestAuthContext(req, res);
      return await buildScopedServices(client).projects.publishProject(
        req.params.id,
        profile
      );
    });
  });

  router.post("/projects/:id/archive", (req, res) => {
    executeApiHandler(res, async () => {
      const { client, profile } = await requireRequestAuthContext(req, res);
      return await buildScopedServices(client).projects.archiveProject(
        req.params.id,
        profile
      );
    });
  });

  router.delete("/projects/:id", (req, res) => {
    executeApiHandler(res, async () => {
      const { client, profile } = await requireRequestAuthContext(req, res);
      await buildScopedServices(client).projects.deleteProject(req.params.id, profile);
      return { id: req.params.id, deleted: true };
    });
  });

  // Project Sections Endpoints (enforces parent project visibility)
  router.get("/projects/:id/sections", (req, res) => {
    executeApiHandler(res, async () => {
      const { client, profile } = await resolveRequestAuthContext(req, res);
      return await buildScopedServices(client).projects.getProjectSections(
        req.params.id,
        profile
      );
    });
  });

  router.post("/projects/:id/sections", (req, res) => {
    executeApiHandler(
      res,
      async () => {
        const { client, profile } = await requireRequestAuthContext(req, res);
        return await buildScopedServices(client).projects.createProjectSection(
          req.params.id,
          req.body,
          profile
        );
      },
      HTTP_STATUS.CREATED
    );
  });

  router.put("/projects/sections/:sectionId", (req, res) => {
    executeApiHandler(res, async () => {
      const { client, profile } = await requireRequestAuthContext(req, res);
      return await buildScopedServices(client).projects.updateProjectSection(
        req.params.sectionId,
        req.body,
        profile
      );
    });
  });

  router.delete("/projects/sections/:sectionId", (req, res) => {
    executeApiHandler(res, async () => {
      const { client, profile } = await requireRequestAuthContext(req, res);
      await buildScopedServices(client).projects.deleteProjectSection(
        req.params.sectionId,
        profile
      );
      return { sectionId: req.params.sectionId, deleted: true };
    });
  });

  router.post("/projects/:id/sections/reorder", (req, res) => {
    executeApiHandler(res, async () => {
      const { client, profile } = await requireRequestAuthContext(req, res);
      await buildScopedServices(client).projects.reorderProjectSections(
        req.params.id,
        req.body,
        profile
      );
      return { success: true };
    });
  });

  // Project Relations Endpoints
  router.post("/projects/:id/tags", (req, res) => {
    executeApiHandler(res, async () => {
      const { client, profile } = await requireRequestAuthContext(req, res);
      await buildScopedServices(client).projects.attachTag(
        req.params.id,
        req.body.tag_id,
        profile
      );
      return { success: true };
    });
  });

  router.delete("/projects/:id/tags/:tagId", (req, res) => {
    executeApiHandler(res, async () => {
      const { client, profile } = await requireRequestAuthContext(req, res);
      await buildScopedServices(client).projects.detachTag(
        req.params.id,
        req.params.tagId,
        profile
      );
      return { success: true };
    });
  });

  router.post("/projects/:id/technologies", (req, res) => {
    executeApiHandler(res, async () => {
      const { client, profile } = await requireRequestAuthContext(req, res);
      await buildScopedServices(client).projects.attachTechnology(
        req.params.id,
        req.body.technology_id,
        profile
      );
      return { success: true };
    });
  });

  router.delete("/projects/:id/technologies/:techId", (req, res) => {
    executeApiHandler(res, async () => {
      const { client, profile } = await requireRequestAuthContext(req, res);
      await buildScopedServices(client).projects.detachTechnology(
        req.params.id,
        req.params.techId,
        profile
      );
      return { success: true };
    });
  });

  router.post("/projects/:id/media", (req, res) => {
    executeApiHandler(res, async () => {
      const { client, profile } = await requireRequestAuthContext(req, res);
      await buildScopedServices(client).projects.attachMedia(
        req.params.id,
        req.body,
        profile
      );
      return { success: true };
    });
  });

  router.delete("/projects/:id/media/:mediaAssetId", (req, res) => {
    executeApiHandler(res, async () => {
      const { client, profile } = await requireRequestAuthContext(req, res);
      await buildScopedServices(client).projects.detachMedia(
        req.params.id,
        req.params.mediaAssetId,
        profile
      );
      return { success: true };
    });
  });

  // Articles Endpoints
  router.get("/articles", (req, res) => {
    executeApiHandler(res, async () => {
      const { client, profile } = await resolveRequestAuthContext(req, res);
      return await buildScopedServices(client).articles.listArticles(req.query, profile);
    });
  });

  router.get("/articles/:slug", (req, res) => {
    executeApiHandler(res, async () => {
      const { client, profile } = await resolveRequestAuthContext(req, res);
      return await buildScopedServices(client).articles.getArticleBySlug(
        req.params.slug,
        profile
      );
    });
  });

  router.post("/articles", (req, res) => {
    executeApiHandler(
      res,
      async () => {
        const { client, profile } = await requireRequestAuthContext(req, res);
        return await buildScopedServices(client).articles.createArticle(req.body, profile);
      },
      HTTP_STATUS.CREATED
    );
  });

  router.put("/articles/:id", (req, res) => {
    executeApiHandler(res, async () => {
      const { client, profile } = await requireRequestAuthContext(req, res);
      return await buildScopedServices(client).articles.updateArticle(
        req.params.id,
        req.body,
        profile
      );
    });
  });

  router.post("/articles/:id/publish", (req, res) => {
    executeApiHandler(res, async () => {
      const { client, profile } = await requireRequestAuthContext(req, res);
      return await buildScopedServices(client).articles.publishArticle(
        req.params.id,
        profile
      );
    });
  });

  router.post("/articles/:id/archive", (req, res) => {
    executeApiHandler(res, async () => {
      const { client, profile } = await requireRequestAuthContext(req, res);
      return await buildScopedServices(client).articles.archiveArticle(
        req.params.id,
        profile
      );
    });
  });

  router.delete("/articles/:id", (req, res) => {
    executeApiHandler(res, async () => {
      const { client, profile } = await requireRequestAuthContext(req, res);
      await buildScopedServices(client).articles.deleteArticle(req.params.id, profile);
      return { id: req.params.id, deleted: true };
    });
  });

  // Article Relations Endpoints
  router.post("/articles/:id/tags", (req, res) => {
    executeApiHandler(res, async () => {
      const { client, profile } = await requireRequestAuthContext(req, res);
      await buildScopedServices(client).articles.attachTag(
        req.params.id,
        req.body.tag_id,
        profile
      );
      return { success: true };
    });
  });

  router.delete("/articles/:id/tags/:tagId", (req, res) => {
    executeApiHandler(res, async () => {
      const { client, profile } = await requireRequestAuthContext(req, res);
      await buildScopedServices(client).articles.detachTag(
        req.params.id,
        req.params.tagId,
        profile
      );
      return { success: true };
    });
  });

  router.post("/articles/:id/technologies", (req, res) => {
    executeApiHandler(res, async () => {
      const { client, profile } = await requireRequestAuthContext(req, res);
      await buildScopedServices(client).articles.attachTechnology(
        req.params.id,
        req.body.technology_id,
        profile
      );
      return { success: true };
    });
  });

  router.delete("/articles/:id/technologies/:techId", (req, res) => {
    executeApiHandler(res, async () => {
      const { client, profile } = await requireRequestAuthContext(req, res);
      await buildScopedServices(client).articles.detachTechnology(
        req.params.id,
        req.params.techId,
        profile
      );
      return { success: true };
    });
  });

  router.post("/articles/:id/media", (req, res) => {
    executeApiHandler(res, async () => {
      const { client, profile } = await requireRequestAuthContext(req, res);
      await buildScopedServices(client).articles.attachMedia(
        req.params.id,
        req.body.media_asset_id,
        req.body.role,
        req.body.order_index,
        profile
      );
      return { success: true };
    });
  });

  router.delete("/articles/:id/media/:mediaAssetId", (req, res) => {
    executeApiHandler(res, async () => {
      const { client, profile } = await requireRequestAuthContext(req, res);
      await buildScopedServices(client).articles.detachMedia(
        req.params.id,
        req.params.mediaAssetId,
        profile
      );
      return { success: true };
    });
  });

  // Labs Endpoints (archived labs strictly hidden from public callers)
  router.get("/labs", (req, res) => {
    executeApiHandler(res, async () => {
      const { client, profile } = await resolveRequestAuthContext(req, res);
      return await buildScopedServices(client).labs.listLabs(req.query, profile);
    });
  });

  router.get("/labs/:slug", (req, res) => {
    executeApiHandler(res, async () => {
      const { client, profile } = await resolveRequestAuthContext(req, res);
      return await buildScopedServices(client).labs.getLabBySlug(req.params.slug, profile);
    });
  });

  router.post("/labs", (req, res) => {
    executeApiHandler(
      res,
      async () => {
        const { client, profile } = await requireRequestAuthContext(req, res);
        return await buildScopedServices(client).labs.createLab(req.body, profile);
      },
      HTTP_STATUS.CREATED
    );
  });

  router.put("/labs/:id", (req, res) => {
    executeApiHandler(res, async () => {
      const { client, profile } = await requireRequestAuthContext(req, res);
      return await buildScopedServices(client).labs.updateLab(
        req.params.id,
        req.body,
        profile
      );
    });
  });

  router.post("/labs/:id/archive", (req, res) => {
    executeApiHandler(res, async () => {
      const { client, profile } = await requireRequestAuthContext(req, res);
      return await buildScopedServices(client).labs.archiveLab(req.params.id, profile);
    });
  });

  router.delete("/labs/:id", (req, res) => {
    executeApiHandler(res, async () => {
      const { client, profile } = await requireRequestAuthContext(req, res);
      await buildScopedServices(client).labs.deleteLab(req.params.id, profile);
      return { id: req.params.id, deleted: true };
    });
  });

  router.post("/labs/:id/media", (req, res) => {
    executeApiHandler(res, async () => {
      const { client, profile } = await requireRequestAuthContext(req, res);
      await buildScopedServices(client).labs.attachMedia(
        req.params.id,
        req.body,
        profile
      );
      return { success: true };
    });
  });

  router.delete("/labs/:id/media/:mediaAssetId", (req, res) => {
    executeApiHandler(res, async () => {
      const { client, profile } = await requireRequestAuthContext(req, res);
      await buildScopedServices(client).labs.detachMedia(
        req.params.id,
        req.params.mediaAssetId,
        profile
      );
      return { success: true };
    });
  });

  // Knowledge Endpoints
  router.get("/knowledge", (req, res) => {
    executeApiHandler(res, async () => {
      const { client } = await resolveRequestAuthContext(req, res);
      return await buildScopedServices(client).knowledge.listConcepts(req.query);
    });
  });

  router.get("/knowledge/graph", (req, res) => {
    executeApiHandler(res, async () => {
      const { client, profile } = await resolveRequestAuthContext(req, res);
      return await buildScopedServices(client).knowledge.getKnowledgeGraph(profile);
    });
  });

  router.get("/knowledge/:slug", (req, res) => {
    executeApiHandler(res, async () => {
      const { client } = await resolveRequestAuthContext(req, res);
      return await buildScopedServices(client).knowledge.getConceptBySlug(req.params.slug);
    });
  });

  router.post("/knowledge", (req, res) => {
    executeApiHandler(
      res,
      async () => {
        const { client, profile } = await requireRequestAuthContext(req, res);
        return await buildScopedServices(client).knowledge.createConcept(req.body, profile);
      },
      HTTP_STATUS.CREATED
    );
  });

  router.put("/knowledge/:id", (req, res) => {
    executeApiHandler(res, async () => {
      const { client, profile } = await requireRequestAuthContext(req, res);
      return await buildScopedServices(client).knowledge.updateConcept(
        req.params.id,
        req.body,
        profile
      );
    });
  });

  router.delete("/knowledge/:id", (req, res) => {
    executeApiHandler(res, async () => {
      const { client, profile } = await requireRequestAuthContext(req, res);
      await buildScopedServices(client).knowledge.deleteConcept(req.params.id, profile);
      return { id: req.params.id, deleted: true };
    });
  });

  router.get("/knowledge/content/:type/:id", (req, res) => {
    executeApiHandler(res, async () => {
      const { client, profile } = await resolveRequestAuthContext(req, res);
      const services = buildScopedServices(client);
      const contentType = req.params.type as "project" | "article" | "lab";
      const contentId = req.params.id;

      // Enforce visibility of target content item before returning linked concepts
      if (contentType === "project") {
        await services.projects.getProjectById(contentId, profile);
      } else if (contentType === "article") {
        await services.articles.getArticleById(contentId, profile);
      } else if (contentType === "lab") {
        await services.labs.getLabById(contentId, profile);
      } else {
        throw new ValidationError("Content type must be 'project', 'article', or 'lab'.");
      }

      return await services.knowledge.getConceptsForContent(contentType, contentId);
    });
  });

  router.post("/knowledge/content", (req, res) => {
    executeApiHandler(res, async () => {
      const { client, profile } = await requireRequestAuthContext(req, res);
      await buildScopedServices(client).knowledge.attachContentConcept(req.body, profile);
      return { success: true };
    });
  });

  router.delete("/knowledge/content/:type/:id/:conceptId", (req, res) => {
    executeApiHandler(res, async () => {
      const { client, profile } = await requireRequestAuthContext(req, res);
      await buildScopedServices(client).knowledge.detachContentConcept(
        req.params.type as "project" | "article" | "lab",
        req.params.id,
        req.params.conceptId,
        profile
      );
      return { success: true };
    });
  });

  router.get("/knowledge/:id/related", (req, res) => {
    executeApiHandler(res, async () => {
      const { client } = await resolveRequestAuthContext(req, res);
      return await buildScopedServices(client).knowledge.getRelatedConcepts(req.params.id);
    });
  });

  router.post("/knowledge/relationships", (req, res) => {
    executeApiHandler(res, async () => {
      const { client, profile } = await requireRequestAuthContext(req, res);
      await buildScopedServices(client).knowledge.linkConcepts(req.body, profile);
      return { success: true };
    });
  });

  router.delete("/knowledge/relationships/:sourceId/:targetId", (req, res) => {
    executeApiHandler(res, async () => {
      const { client, profile } = await requireRequestAuthContext(req, res);
      await buildScopedServices(client).knowledge.unlinkConcepts(
        req.params.sourceId,
        req.params.targetId,
        profile
      );
      return { success: true };
    });
  });

  // Media Endpoints (protected CMS library surface)
  router.get("/media", (req, res) => {
    executeApiHandler(res, async () => {
      const { client, profile } = await requireRequestAuthContext(req, res);
      return await buildScopedServices(client).media.listMedia(req.query, profile);
    });
  });

  router.get("/media/:id", (req, res) => {
    executeApiHandler(res, async () => {
      const { client, profile } = await requireRequestAuthContext(req, res);
      return await buildScopedServices(client).media.getMediaById(req.params.id, profile);
    });
  });

  router.post("/media", (req, res) => {
    executeApiHandler(
      res,
      async () => {
        const { client, profile } = await requireRequestAuthContext(req, res);
        return await buildScopedServices(client).media.registerMedia(req.body, profile);
      },
      HTTP_STATUS.CREATED
    );
  });

  router.delete("/media/:id", (req, res) => {
    executeApiHandler(res, async () => {
      const { client, profile } = await requireRequestAuthContext(req, res);
      await buildScopedServices(client).media.deleteMedia(req.params.id, profile);
      return { id: req.params.id, deleted: true };
    });
  });

  // ==========================================
  // Intelligence & Search Layer Endpoints
  // ==========================================
  const tovuService = new TovuService();
  const contentIndexer = new ContentIndexer();
  const conversationService = new ConversationService();

  function enforceRateLimit(
    res: Response,
    rateKey: string,
    options: { windowMs: number; maxRequests: number },
    message: string
  ) {
    const rateCheck = checkRateLimit(rateKey, options);
    res.setHeader("X-RateLimit-Limit", String(rateCheck.limit));
    res.setHeader("X-RateLimit-Remaining", String(rateCheck.remaining));
    res.setHeader("X-RateLimit-Reset", String(Math.ceil(rateCheck.resetInMs / 1000)));

    if (!rateCheck.allowed) {
      res.setHeader("Retry-After", String(rateCheck.retryAfterSeconds));
      throw new TooManyRequestsError(message, {
        resetInMs: rateCheck.resetInMs,
        retryAfterSeconds: rateCheck.retryAfterSeconds,
      });
    }
  }

  // Search Endpoint (Lexical + Semantic Hybrid Search)
  router.get("/search", (req, res) => {
    executeApiHandler(res, async () => {
      const { client, user, profile } = await resolveRequestAuthContext(req, res);
      const clientIp = getClientIp(req);
      const rateKey = user ? `search:user:${user.id}` : `search:ip:${clientIp}`;
      enforceRateLimit(
        res,
        rateKey,
        { windowMs: 60_000, maxRequests: 60 },
        "Search rate limit reached. Please wait a moment before searching again."
      );

      const q = typeof req.query.q === "string" ? req.query.q.trim() : "";
      if (!q) {
        throw new ValidationError("Search query parameter 'q' is required");
      }

      assertSupabaseConfigured(false);

      const limit = req.query.limit
        ? Math.min(30, Math.max(1, parseInt(String(req.query.limit), 10) || 10))
        : 10;
      const typeParam = typeof req.query.types === "string" ? req.query.types : undefined;
      const sourceTypes = typeParam
        ? (typeParam.split(",").map((s) => s.trim()) as any)
        : undefined;

      const includeDrafts = canAccessCommandCenter(profile);
      const { LexicalSearchService } = await import("../search/lexical");
      const scopedSearch = new HybridSearchService(
        new LexicalSearchService(client || undefined)
      );

      return await scopedSearch.search({
        query: q,
        sourceTypes,
        limit,
        includeDrafts,
      });
    });
  });

  // Tovu Intelligence Assistant Endpoint (Canonical)
  const handleTovuQuery = (req: Request, res: Response) => {
    executeApiHandler(res, async () => {
      const { sessionId } = resolveOrIssueVisitorSession(req, res);
      const { user } = await resolveRequestAuthContext(req, res);
      const clientIp = getClientIp(req);

      const rateKey = user ? `tovu:user:${user.id}` : `tovu:ip:${clientIp}`;
      enforceRateLimit(
        res,
        rateKey,
        { windowMs: 60_000, maxRequests: 30 },
        "Tovu query limit reached. Please wait before asking further questions."
      );

      // Never trust caller-supplied sessionId or userId in req.body
      const { message, conversationId, context } = req.body || {};

      return await tovuService.ask({
        message,
        conversationId,
        context,
        userId: user?.id,
        sessionId,
      });
    });
  };

  router.post("/tovu", handleTovuQuery);
  router.post("/tovu/ask", handleTovuQuery);

  // Conversation retrieval with strict cryptographic session or authenticated user ownership
  router.get("/conversations/:id", (req, res) => {
    executeApiHandler(res, async () => {
      const { sessionId } = resolveOrIssueVisitorSession(req, res);
      const { user } = await resolveRequestAuthContext(req, res);
      const clientIp = getClientIp(req);
      const rateKey = user ? `conv:user:${user.id}` : `conv:ip:${clientIp}`;
      enforceRateLimit(
        res,
        rateKey,
        { windowMs: 60_000, maxRequests: 60 },
        "Conversation lookup rate limit reached."
      );

      const conv = await conversationService.getConversation(
        req.params.id,
        sessionId,
        user?.id
      );
      const messages = await conversationService.listMessages(req.params.id, 20, sessionId, user?.id);

      return {
        conversation: toPublicConversation(conv),
        messages,
      };
    });
  });

  // Content Indexing Endpoint (Admin only, rate-limited)
  router.post("/intelligence/index", (req, res) => {
    executeApiHandler(res, async () => {
      const { profile } = await requireRequestAuthContext(req, res);
      if (!canManageSystem(profile)) {
        throw new AuthorizationError(
          "Only administrators can trigger full system vector indexing."
        );
      }

      enforceRateLimit(
        res,
        `index:admin:${profile?.id || "system"}`,
        { windowMs: 60_000, maxRequests: 10 },
        "Indexing trigger rate limit reached."
      );

      return await contentIndexer.indexAll();
    });
  });

  router.use((error: unknown, _req: any, res: any, _next: any) => {
    const safe = error instanceof Error && "statusCode" in error
      ? error as any : null;
    res.status(safe?.statusCode || 500).json({
      success: false,
      error: { code: safe?.code || "INTERNAL_SERVER_ERROR",
        message: safe?.message || "An unexpected system error occurred.",
        statusCode: safe?.statusCode || 500 },
    });
  });
  return router;
}

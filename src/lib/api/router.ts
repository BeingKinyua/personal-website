/**
 * VictorOS Backend Foundation API Router
 * Dispatches HTTP requests to domain services with standard validation, error handling, and response framing.
 */

import { Router } from "express";
import { executeApiHandler, createApiResponse } from "../shared/api";
import { ProjectService } from "../projects/service";
import { ArticleService } from "../articles/service";
import { LabService } from "../labs/service";
import { KnowledgeService } from "../knowledge/service";
import { MediaService } from "../media/service";
import { HybridSearchService } from "../search/hybrid";
import { DoomService } from "../ai/doom/service";
import { ContentIndexer } from "../ai/embeddings/indexer";
import { ConversationService } from "../ai/conversations/service";
import { checkRateLimit } from "../shared/rateLimit";
import { getCurrentProfile, getCurrentUser, requireAuthContext } from "../auth/session";
import { SYSTEM, HTTP_STATUS } from "../shared/constants";
import { getPublicEnv, getServerEnv } from "../shared/env";
import { ValidationError, TooManyRequestsError } from "../shared/errors";

export function createBackendRouter(): Router {
  const router = Router();
  const projectService = new ProjectService();
  const articleService = new ArticleService();
  const labService = new LabService();
  const knowledgeService = new KnowledgeService();
  const mediaService = new MediaService();

  // Health and System Diagnostics
  router.get("/health", (req, res) => {
    executeApiHandler(res, async () => {
      const publicEnv = getPublicEnv();
      const serverEnv = getServerEnv();

      const isSupabaseConfigured =
        !publicEnv.supabaseUrl.includes("placeholder") &&
        !publicEnv.supabaseUrl.includes("your-project-id") &&
        !publicEnv.supabaseAnonKey.includes("placeholder") &&
        !publicEnv.supabaseAnonKey.includes("your-supabase");

      return {
        system: SYSTEM.NAME,
        version: SYSTEM.VERSION,
        status: "operational",
        timestamp: new Date().toISOString(),
        environment: serverEnv.nodeEnv,
        features: {
          supabaseConfigured: isSupabaseConfigured,
          adminKeyConfigured: Boolean(
            serverEnv.supabaseServiceRoleKey && !serverEnv.supabaseServiceRoleKey.includes("your-supabase")
          ),
          geminiKeyConfigured: Boolean(serverEnv.geminiApiKey && serverEnv.geminiApiKey !== "MY_GEMINI_API_KEY"),
        },
      };
    });
  });

  // Authentication & Session inspection
  router.get("/auth/session", (req, res) => {
    executeApiHandler(res, async () => {
      const user = await getCurrentUser();
      const profile = await getCurrentProfile();

      return {
        authenticated: Boolean(user),
        user: user ? { id: user.id, email: user.email } : null,
        profile: profile ? { id: profile.id, username: profile.username, role: profile.role } : null,
      };
    });
  });

  // Projects Endpoints
  router.get("/projects", (req, res) => {
    executeApiHandler(res, async () => {
      const profile = await getCurrentProfile();
      return await projectService.listProjects(req.query, profile);
    });
  });

  router.get("/projects/:slug", (req, res) => {
    executeApiHandler(res, async () => {
      const profile = await getCurrentProfile();
      return await projectService.getProjectBySlug(req.params.slug, profile);
    });
  });

  router.post("/projects", (req, res) => {
    executeApiHandler(res, async () => {
      const { profile } = await requireAuthContext();
      return await projectService.createProject(req.body, profile);
    }, HTTP_STATUS.CREATED);
  });

  router.put("/projects/:id", (req, res) => {
    executeApiHandler(res, async () => {
      const { profile } = await requireAuthContext();
      return await projectService.updateProject(req.params.id, req.body, profile);
    });
  });

  router.post("/projects/:id/publish", (req, res) => {
    executeApiHandler(res, async () => {
      const { profile } = await requireAuthContext();
      return await projectService.publishProject(req.params.id, profile);
    });
  });

  router.post("/projects/:id/archive", (req, res) => {
    executeApiHandler(res, async () => {
      const { profile } = await requireAuthContext();
      return await projectService.archiveProject(req.params.id, profile);
    });
  });

  router.delete("/projects/:id", (req, res) => {
    executeApiHandler(res, async () => {
      const { profile } = await requireAuthContext();
      await projectService.deleteProject(req.params.id, profile);
      return { id: req.params.id, deleted: true };
    });
  });

  // Project Sections Endpoints
  router.get("/projects/:id/sections", (req, res) => {
    executeApiHandler(res, async () => {
      return await projectService.getProjectSections(req.params.id);
    });
  });

  router.post("/projects/:id/sections", (req, res) => {
    executeApiHandler(res, async () => {
      const { profile } = await requireAuthContext();
      return await projectService.createProjectSection(req.params.id, req.body, profile);
    }, HTTP_STATUS.CREATED);
  });

  router.put("/projects/sections/:sectionId", (req, res) => {
    executeApiHandler(res, async () => {
      const { profile } = await requireAuthContext();
      return await projectService.updateProjectSection(req.params.sectionId, req.body, profile);
    });
  });

  router.delete("/projects/sections/:sectionId", (req, res) => {
    executeApiHandler(res, async () => {
      const { profile } = await requireAuthContext();
      await projectService.deleteProjectSection(req.params.sectionId, profile);
      return { sectionId: req.params.sectionId, deleted: true };
    });
  });

  router.post("/projects/:id/sections/reorder", (req, res) => {
    executeApiHandler(res, async () => {
      const { profile } = await requireAuthContext();
      await projectService.reorderProjectSections(req.params.id, req.body, profile);
      return { success: true };
    });
  });

  // Project Relations Endpoints
  router.post("/projects/:id/tags", (req, res) => {
    executeApiHandler(res, async () => {
      const { profile } = await requireAuthContext();
      await projectService.attachTag(req.params.id, req.body.tag_id, profile);
      return { success: true };
    });
  });

  router.delete("/projects/:id/tags/:tagId", (req, res) => {
    executeApiHandler(res, async () => {
      const { profile } = await requireAuthContext();
      await projectService.detachTag(req.params.id, req.params.tagId, profile);
      return { success: true };
    });
  });

  router.post("/projects/:id/technologies", (req, res) => {
    executeApiHandler(res, async () => {
      const { profile } = await requireAuthContext();
      await projectService.attachTechnology(req.params.id, req.body.technology_id, profile);
      return { success: true };
    });
  });

  router.delete("/projects/:id/technologies/:techId", (req, res) => {
    executeApiHandler(res, async () => {
      const { profile } = await requireAuthContext();
      await projectService.detachTechnology(req.params.id, req.params.techId, profile);
      return { success: true };
    });
  });

  router.post("/projects/:id/media", (req, res) => {
    executeApiHandler(res, async () => {
      const { profile } = await requireAuthContext();
      await projectService.attachMedia(req.params.id, req.body, profile);
      return { success: true };
    });
  });

  router.delete("/projects/:id/media/:mediaAssetId", (req, res) => {
    executeApiHandler(res, async () => {
      const { profile } = await requireAuthContext();
      await projectService.detachMedia(req.params.id, req.params.mediaAssetId, profile);
      return { success: true };
    });
  });

  // Articles Endpoints
  router.get("/articles", (req, res) => {
    executeApiHandler(res, async () => {
      const profile = await getCurrentProfile();
      return await articleService.listArticles(req.query, profile);
    });
  });

  router.get("/articles/:slug", (req, res) => {
    executeApiHandler(res, async () => {
      const profile = await getCurrentProfile();
      return await articleService.getArticleBySlug(req.params.slug, profile);
    });
  });

  router.post("/articles", (req, res) => {
    executeApiHandler(res, async () => {
      const { profile } = await requireAuthContext();
      return await articleService.createArticle(req.body, profile);
    }, HTTP_STATUS.CREATED);
  });

  router.put("/articles/:id", (req, res) => {
    executeApiHandler(res, async () => {
      const { profile } = await requireAuthContext();
      return await articleService.updateArticle(req.params.id, req.body, profile);
    });
  });

  router.post("/articles/:id/publish", (req, res) => {
    executeApiHandler(res, async () => {
      const { profile } = await requireAuthContext();
      return await articleService.publishArticle(req.params.id, profile);
    });
  });

  router.post("/articles/:id/archive", (req, res) => {
    executeApiHandler(res, async () => {
      const { profile } = await requireAuthContext();
      return await articleService.archiveArticle(req.params.id, profile);
    });
  });

  router.delete("/articles/:id", (req, res) => {
    executeApiHandler(res, async () => {
      const { profile } = await requireAuthContext();
      await articleService.deleteArticle(req.params.id, profile);
      return { id: req.params.id, deleted: true };
    });
  });

  // Article Relations Endpoints
  router.post("/articles/:id/tags", (req, res) => {
    executeApiHandler(res, async () => {
      const { profile } = await requireAuthContext();
      await articleService.attachTag(req.params.id, req.body.tag_id, profile);
      return { success: true };
    });
  });

  router.delete("/articles/:id/tags/:tagId", (req, res) => {
    executeApiHandler(res, async () => {
      const { profile } = await requireAuthContext();
      await articleService.detachTag(req.params.id, req.params.tagId, profile);
      return { success: true };
    });
  });

  router.post("/articles/:id/technologies", (req, res) => {
    executeApiHandler(res, async () => {
      const { profile } = await requireAuthContext();
      await articleService.attachTechnology(req.params.id, req.body.technology_id, profile);
      return { success: true };
    });
  });

  router.delete("/articles/:id/technologies/:techId", (req, res) => {
    executeApiHandler(res, async () => {
      const { profile } = await requireAuthContext();
      await articleService.detachTechnology(req.params.id, req.params.techId, profile);
      return { success: true };
    });
  });

  router.post("/articles/:id/media", (req, res) => {
    executeApiHandler(res, async () => {
      const { profile } = await requireAuthContext();
      await articleService.attachMedia(
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
      const { profile } = await requireAuthContext();
      await articleService.detachMedia(req.params.id, req.params.mediaAssetId, profile);
      return { success: true };
    });
  });

  // Labs Endpoints
  router.get("/labs", (req, res) => {
    executeApiHandler(res, async () => {
      return await labService.listLabs(req.query);
    });
  });

  router.get("/labs/:slug", (req, res) => {
    executeApiHandler(res, async () => {
      return await labService.getLabBySlug(req.params.slug);
    });
  });

  router.post("/labs", (req, res) => {
    executeApiHandler(res, async () => {
      const { profile } = await requireAuthContext();
      return await labService.createLab(req.body, profile);
    }, HTTP_STATUS.CREATED);
  });

  router.put("/labs/:id", (req, res) => {
    executeApiHandler(res, async () => {
      const { profile } = await requireAuthContext();
      return await labService.updateLab(req.params.id, req.body, profile);
    });
  });

  router.post("/labs/:id/archive", (req, res) => {
    executeApiHandler(res, async () => {
      const { profile } = await requireAuthContext();
      return await labService.archiveLab(req.params.id, profile);
    });
  });

  router.delete("/labs/:id", (req, res) => {
    executeApiHandler(res, async () => {
      const { profile } = await requireAuthContext();
      await labService.deleteLab(req.params.id, profile);
      return { id: req.params.id, deleted: true };
    });
  });

  router.post("/labs/:id/media", (req, res) => {
    executeApiHandler(res, async () => {
      const { profile } = await requireAuthContext();
      await labService.attachMedia(req.params.id, req.body, profile);
      return { success: true };
    });
  });

  router.delete("/labs/:id/media/:mediaAssetId", (req, res) => {
    executeApiHandler(res, async () => {
      const { profile } = await requireAuthContext();
      await labService.detachMedia(req.params.id, req.params.mediaAssetId, profile);
      return { success: true };
    });
  });

  // Knowledge Endpoints
  router.get("/knowledge", (req, res) => {
    executeApiHandler(res, async () => {
      return await knowledgeService.listConcepts(req.query);
    });
  });

  router.get("/knowledge/:slug", (req, res) => {
    executeApiHandler(res, async () => {
      return await knowledgeService.getConceptBySlug(req.params.slug);
    });
  });

  router.post("/knowledge", (req, res) => {
    executeApiHandler(res, async () => {
      const { profile } = await requireAuthContext();
      return await knowledgeService.createConcept(req.body, profile);
    }, HTTP_STATUS.CREATED);
  });

  router.put("/knowledge/:id", (req, res) => {
    executeApiHandler(res, async () => {
      const { profile } = await requireAuthContext();
      return await knowledgeService.updateConcept(req.params.id, req.body, profile);
    });
  });

  router.delete("/knowledge/:id", (req, res) => {
    executeApiHandler(res, async () => {
      const { profile } = await requireAuthContext();
      await knowledgeService.deleteConcept(req.params.id, profile);
      return { id: req.params.id, deleted: true };
    });
  });

  router.get("/knowledge/content/:type/:id", (req, res) => {
    executeApiHandler(res, async () => {
      return await knowledgeService.getConceptsForContent(
        req.params.type as "project" | "article" | "lab",
        req.params.id
      );
    });
  });

  router.post("/knowledge/content", (req, res) => {
    executeApiHandler(res, async () => {
      const { profile } = await requireAuthContext();
      await knowledgeService.attachContentConcept(req.body, profile);
      return { success: true };
    });
  });

  router.delete("/knowledge/content/:type/:id/:conceptId", (req, res) => {
    executeApiHandler(res, async () => {
      const { profile } = await requireAuthContext();
      await knowledgeService.detachContentConcept(
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
      return await knowledgeService.getRelatedConcepts(req.params.id);
    });
  });

  router.post("/knowledge/relationships", (req, res) => {
    executeApiHandler(res, async () => {
      const { profile } = await requireAuthContext();
      await knowledgeService.linkConcepts(req.body, profile);
      return { success: true };
    });
  });

  router.delete("/knowledge/relationships/:sourceId/:targetId", (req, res) => {
    executeApiHandler(res, async () => {
      const { profile } = await requireAuthContext();
      await knowledgeService.unlinkConcepts(req.params.sourceId, req.params.targetId, profile);
      return { success: true };
    });
  });

  // Media Endpoints
  router.get("/media", (req, res) => {
    executeApiHandler(res, async () => {
      return await mediaService.listMedia(req.query);
    });
  });

  router.get("/media/:id", (req, res) => {
    executeApiHandler(res, async () => {
      return await mediaService.getMediaById(req.params.id);
    });
  });

  router.post("/media", (req, res) => {
    executeApiHandler(res, async () => {
      const { profile } = await requireAuthContext();
      return await mediaService.registerMedia(req.body, profile);
    }, HTTP_STATUS.CREATED);
  });

  router.delete("/media/:id", (req, res) => {
    executeApiHandler(res, async () => {
      const { profile } = await requireAuthContext();
      await mediaService.deleteMedia(req.params.id, profile);
      return { id: req.params.id, deleted: true };
    });
  });

  // ==========================================
  // Phase D: Intelligence Layer Endpoints
  // ==========================================
  const hybridSearchService = new HybridSearchService();
  const doomService = new DoomService();
  const contentIndexer = new ContentIndexer();
  const conversationService = new ConversationService();

  // Search Endpoint (Lexical + Semantic Hybrid Search)
  router.get("/search", (req, res) => {
    executeApiHandler(res, async () => {
      const q = typeof req.query.q === "string" ? req.query.q.trim() : "";
      if (!q) {
        throw new ValidationError("Search query parameter 'q' is required");
      }

      const limit = req.query.limit ? Math.min(30, Math.max(1, parseInt(String(req.query.limit), 10))) : 10;
      const typeParam = typeof req.query.types === "string" ? req.query.types : undefined;
      const sourceTypes = typeParam
        ? (typeParam.split(",").map((s) => s.trim()) as any)
        : undefined;

      const profile = await getCurrentProfile();
      const includeDrafts = Boolean(profile && ["admin", "creator"].includes(profile.role));

      return await hybridSearchService.search({
        query: q,
        sourceTypes,
        limit,
        includeDrafts,
      });
    });
  });

  // Dr. Doom AI Assistant Endpoint
  router.post("/doom", (req, res) => {
    executeApiHandler(res, async () => {
      // Rate limiting: 30 requests per minute per IP / session
      const clientIp = (req.headers["x-forwarded-for"] as string) || req.socket.remoteAddress || "anonymous";
      const sessionId = typeof req.body.sessionId === "string" ? req.body.sessionId : clientIp;
      const rateCheck = checkRateLimit(sessionId, { windowMs: 60_000, maxRequests: 30 });

      if (!rateCheck.allowed) {
        throw new TooManyRequestsError("Dr. Doom query limit reached. Please wait before asking further questions.", {
          resetInMs: rateCheck.resetInMs,
        });
      }

      const user = await getCurrentUser();
      return await doomService.ask({
        ...req.body,
        userId: user?.id,
        sessionId,
      });
    });
  });

  // Conversation retrieval with session boundary enforcement
  router.get("/conversations/:id", (req, res) => {
    executeApiHandler(res, async () => {
      const sessionId =
        typeof req.query.sessionId === "string"
          ? req.query.sessionId
          : (req.headers["x-session-id"] as string) || "anonymous";
      const user = await getCurrentUser();

      const conv = await conversationService.getConversation(
        req.params.id,
        sessionId,
        user?.id
      );
      const messages = await conversationService.listMessages(req.params.id, 20);

      return {
        conversation: conv,
        messages,
      };
    });
  });

  // Content Indexing Endpoint (Admin only)
  router.post("/intelligence/index", (req, res) => {
    executeApiHandler(res, async () => {
      const { profile } = await requireAuthContext();
      if (profile.role !== "admin") {
        throw new ValidationError("Only administrators can trigger full system vector indexing");
      }
      return await contentIndexer.indexAll();
    });
  });

  return router;
}

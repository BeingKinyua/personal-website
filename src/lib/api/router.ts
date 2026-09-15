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
import { getCurrentProfile, getCurrentUser } from "../auth/session";
import { SYSTEM, HTTP_STATUS } from "../shared/constants";
import { getPublicEnv, getServerEnv } from "../shared/env";

export function createBackendRouter(): Router {
  const router = Router();
  const projectService = new ProjectService();
  const articleService = new ArticleService();
  const labService = new LabService();
  const knowledgeService = new KnowledgeService();

  // Health and System Diagnostics
  router.get("/health", (req, res) => {
    executeApiHandler(res, async () => {
      const publicEnv = getPublicEnv();
      const serverEnv = getServerEnv();

      const isSupabaseConfigured =
        !publicEnv.supabaseUrl.includes("placeholder") &&
        !publicEnv.supabaseAnonKey.includes("placeholder");

      return {
        system: SYSTEM.NAME,
        version: SYSTEM.VERSION,
        status: "operational",
        timestamp: new Date().toISOString(),
        environment: serverEnv.nodeEnv,
        features: {
          supabaseConfigured: isSupabaseConfigured,
          adminKeyConfigured: Boolean(serverEnv.supabaseServiceRoleKey),
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

  // Labs Endpoints
  router.get("/labs", (req, res) => {
    executeApiHandler(res, async () => {
      return await labService.listLabs(req.query);
    });
  });

  // Knowledge Endpoints
  router.get("/knowledge", (req, res) => {
    executeApiHandler(res, async () => {
      return await knowledgeService.listConcepts(req.query);
    });
  });

  return router;
}

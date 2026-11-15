import express from "express";
import path from "path";
import crypto from "crypto";
import dotenv from "dotenv";
import { createBackendRouter } from "./src/lib/api/router.ts";
import { logger } from "./src/lib/shared/logger.ts";

// Load environment variables
dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Bounded JSON payload cap to mitigate memory/body DoS
  app.use(express.json({ limit: "64kb" }));

  // Unified structured API request logging with correlation ID
  app.use("/api", (req, res, next) => {
    const start = Date.now();
    const rawId = req.headers["x-request-id"];
    const requestId =
      typeof rawId === "string" && /^[A-Za-z0-9_-]{8,64}$/.test(rawId)
        ? rawId
        : crypto.randomUUID();

    res.setHeader("X-Request-Id", requestId);

    res.on("finish", () => {
      const durationMs = Date.now() - start;
      const meta = {
        requestId,
        method: req.method,
        path: req.originalUrl.split("?")[0],
        statusCode: res.statusCode,
        durationMs,
      };
      if (res.statusCode >= 500) {
        logger.error("API request completed with server error", undefined, meta);
      } else if (res.statusCode >= 400) {
        logger.warn("API request completed with client error", meta);
      } else {
        logger.info("API request completed", meta);
      }
    });

    next();
  });

  // Tovu Backend Foundation API Router (Canonical /api/v1 and /api)
  const backendRouter = createBackendRouter();
  app.use("/api/v1", backendRouter);
  app.use("/api", backendRouter);
  app.get("/api/health", (_req, res) => {
    res.redirect(307, "/api/v1/health");
  });

  // Vite Integration for development
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    logger.info("Tovu server listening", { port: PORT, env: process.env.NODE_ENV || "development" });
  });
}

startServer();

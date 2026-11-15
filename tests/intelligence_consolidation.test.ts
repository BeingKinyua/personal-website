/**
 * Tovu — Intelligence Consolidation & Hardening Test Suite (Milestone 3)
 * Verifies:
 * 1. Gemini 4 Hydrogen & Gemini Embedding 2 model aliases (no unsupported temperature params)
 * 2. Anti-hallucination grounding for Tovu references & navigation actions
 * 3. TovuService multi-turn conversation creation, persistenceStatus, and fallbackUsed flags
 * 4. Bounded RateLimiter with Retry-After calculation
 * 5. Search & Tovu frontend fallback boundary (503 dev only; 429/500/prod propagate)
 */

import { z } from "zod";
import {
  GeminiAIProvider,
  GEMINI_GENERATION_MODEL,
  type AIModelProvider,
  type AIGenerationOptions,
} from "../src/lib/ai/provider";
import {
  GeminiEmbeddingProvider,
  GEMINI_EMBEDDING_MODEL,
} from "../src/lib/ai/embeddings/provider";
import {
  groundTovuResponse,
  TovuResponseSchema,
} from "../src/lib/ai/tovu/response";
import { TovuService } from "../src/lib/ai/tovu/service";
import { TovuRetrievalService } from "../src/lib/ai/tovu/retrieval";
import { ConversationService } from "../src/lib/ai/conversations/service";
import {
  checkRateLimit,
  clearRateLimits,
  getRateLimitStoreSize,
} from "../src/lib/shared/rateLimit";
import { askTovu } from "../src/services/tovu";
import { searchTovuHybrid } from "../src/services/searchService";
import { ApiClientError } from "../src/services/apiClient";

function assert(condition: boolean, message: string): void {
  if (!condition) {
    throw new Error(`[ASSERTION FAILED] ${message}`);
  }
}

async function runTests() {
  console.log("\n========================================================");
  console.log("  TOVU — INTELLIGENCE CONSOLIDATION TEST SUITE");
  console.log("========================================================\n");

  let passed = 0;
  let total = 0;

  async function test(name: string, fn: () => void | Promise<void>) {
    total++;
    try {
      await fn();
      console.log(`  [PASS] ${name}`);
      passed++;
    } catch (err: any) {
      console.error(`  [FAIL] ${name}: ${err?.message || err}`);
    }
  }

  // 1. Model Aliases
  await test("Gemini providers enforce gemini-4-hydrogen & gemini-embedding-2", () => {
    const gen = new GeminiAIProvider("test-key");
    const emb = new GeminiEmbeddingProvider("test-key");
    assert(GEMINI_GENERATION_MODEL === "gemini-4-hydrogen", "Generation model constant mismatch");
    assert(gen.name === "gemini-4-hydrogen", "GeminiAIProvider name must be gemini-4-hydrogen");
    assert(GEMINI_EMBEDDING_MODEL === "gemini-embedding-2", "Embedding model constant mismatch");
    assert(emb.name === "gemini-embedding-2", "GeminiEmbeddingProvider name must be gemini-embedding-2");
  });

  // 2. Hallucination Grounding
  await test("groundTovuResponse strips fabricated project slugs and invalid nav routes", () => {
    const evidence = [
      {
        sourceType: "project" as const,
        sourceId: "proj-1",
        title: "NYAYO",
        slug: "nyayo",
        url: "/work/nyayo",
        content: "Discipleship platform architecture.",
        score: 0.91,
      },
    ];

    const ungrounded = {
      message: "Inspect NYAYO and FakeSystem.",
      references: [
        { type: "project" as const, id: "nyayo", title: "NYAYO", slug: "nyayo" },
        { type: "project" as const, id: "ghost", title: "Ghost Project", slug: "non-existent-slug" },
      ],
      actions: [
        { label: "Open NYAYO", action: "open_project" as const, target: "nyayo" },
        { label: "Open Ghost", action: "open_project" as const, target: "non-existent-slug" },
        { label: "Hack Route", action: "navigate" as const, target: "admin_secret" },
      ],
      intent: "project_question",
    };

    const grounded = groundTovuResponse(ungrounded, evidence);
    assert(grounded.references.length === 1, "Fabricated reference must be stripped");
    assert(grounded.references[0].slug === "nyayo", "Verified reference must remain");
    assert(grounded.actions.length === 1, "Fabricated action & invalid route must be stripped");
    assert(grounded.actions[0].target === "nyayo", "Verified open_project action must remain");
  });

  // 3. TovuService orchestration, no temperature param, auto-conversationId
  await test("TovuService creates conversationId, omits temperature, and grounds LLM response", async () => {
    let capturedOptions: AIGenerationOptions | undefined;

    const fakeRetrieval = {
      retrieveEvidence: async () => [
        {
          sourceType: "project" as const,
          sourceId: "p-nyayo",
          title: "NYAYO",
          slug: "nyayo",
          url: "/work/nyayo",
          content: "Discipleship platform with RLS.",
          score: 0.95,
        },
      ],
    } as unknown as TovuRetrievalService;

    const fakeAI: AIModelProvider = {
      name: "mock-gemini-4",
      generateText: async () => "ok",
      generateStructured: async <T>(
        _prompt: string,
        schema: z.ZodType<T>,
        options?: AIGenerationOptions
      ) => {
        capturedOptions = options;
        return schema.parse({
          message: "NYAYO uses PostgreSQL RLS.",
          references: [
            { type: "project", id: "nyayo", title: "NYAYO", slug: "nyayo" },
            { type: "article", id: "fake-art", title: "Fake", slug: "fake-article" },
          ],
          actions: [
            { label: "Open NYAYO", action: "open_project", target: "nyayo" },
            { label: "Open Fake Article", action: "open_article", target: "fake-article" },
          ],
          intent: "project_question",
        });
      },
    };

    const convService = new ConversationService();
    const service = new TovuService(fakeRetrieval, convService, fakeAI);
    const result = await service.ask({
      message: "Tell me about NYAYO",
      sessionId: "sess_verified_123",
    });

    assert(!("temperature" in (capturedOptions || {})), "Must NOT pass temperature to Gemini 4");
    assert(Boolean(result.conversationId), "Must auto-create and return conversationId");
    assert(result.fallbackUsed === false, "Mock primary LLM must mark fallbackUsed=false");
    assert(result.persistenceStatus === "persisted", "Turn must persist to conversation store");
    assert(result.references.length === 1 && result.references[0].slug === "nyayo", "Only grounded ref allowed");
    assert(result.actions.length === 1 && result.actions[0].target === "nyayo", "Only grounded action allowed");

    // Second turn reuses conversationId and validates ownership
    const turn2 = await service.ask({
      message: "What else?",
      conversationId: result.conversationId,
      sessionId: "sess_verified_123",
    });
    assert(turn2.conversationId === result.conversationId, "Must preserve conversationId across turns");
  });

  // 4. Rate Limiter bounds & Retry-After
  await test("Rate limiter calculates retryAfterSeconds and stays bounded", () => {
    clearRateLimits();
    const opts = { windowMs: 10_000, maxRequests: 2 };
    const a = checkRateLimit("ip:1.2.3.4", opts);
    const b = checkRateLimit("ip:1.2.3.4", opts);
    const c = checkRateLimit("ip:1.2.3.4", opts);

    assert(a.allowed && a.remaining === 1, "First request allowed");
    assert(b.allowed && b.remaining === 0, "Second request allowed");
    assert(!c.allowed && c.retryAfterSeconds >= 1, "Third request blocked with Retry-After >= 1");
    assert(getRateLimitStoreSize() === 1, "Store tracks active key count accurately");
  });

  // 5. Frontend askTovu & searchTovuHybrid fallback rules
  await test("Frontend Tovu and Search fallback ONLY on non-prod 503 SUPABASE_NOT_CONFIGURED", async () => {
    const originalFetch = globalThis.fetch;
    try {
      // Case A: 429 Too Many Requests must THROW ApiClientError (never silent mock)
      globalThis.fetch = (async () =>
        new Response(
          JSON.stringify({
            success: false,
            error: {
              code: "RATE_LIMIT_EXCEEDED",
              message: "Rate limit hit",
              statusCode: 429,
            },
          }),
          { status: 429, headers: { "Content-Type": "application/json" } }
        )) as typeof fetch;

      let caught429 = false;
      try {
        await askTovu({ message: "Show me AI projects" });
      } catch (err) {
        caught429 = err instanceof ApiClientError && err.statusCode === 429;
      }
      assert(caught429, "askTovu must propagate 429 rate-limit error instead of faking answer");

      let searchCaught429 = false;
      try {
        await searchTovuHybrid("nyayo");
      } catch (err) {
        searchCaught429 = err instanceof ApiClientError && err.statusCode === 429;
      }
      assert(searchCaught429, "searchTovuHybrid must propagate 429 error instead of returning fake matches");

      // Case B: 503 SUPABASE_NOT_CONFIGURED in non-prod falls back to dev fixtures cleanly
      globalThis.fetch = (async () =>
        new Response(
          JSON.stringify({
            success: false,
            error: {
              code: "SUPABASE_NOT_CONFIGURED",
              message: "Supabase not configured",
              statusCode: 503,
            },
          }),
          { status: 503, headers: { "Content-Type": "application/json" } }
        )) as typeof fetch;

      const devSearch = await searchTovuHybrid("nyayo");
      assert(devSearch.some((r) => r.module === "WORK"), "Dev fixture search activates on 503 SUPABASE_NOT_CONFIGURED");

      const devTovu = await askTovu({ message: "Show me AI projects" });
      assert(devTovu.fallbackUsed === true, "Dev fixture Tovu marks fallbackUsed=true");
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  console.log("\n--------------------------------------------------------");
  console.log(`  INTELLIGENCE CONSOLIDATION TESTS: ${passed}/${total} PASSED`);
  console.log("--------------------------------------------------------\n");

  if (passed !== total) {
    process.exit(1);
  }
  process.exit(0);
}

runTests().catch((err) => {
  console.error("Fatal test failure:", err);
  process.exit(1);
});

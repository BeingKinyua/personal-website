/**
 * VictorOS Phase D — Intelligence Layer Test Harness
 * Verifies Normalization, Deterministic Chunking, Embedding Provider,
 * Hybrid Search Ranking, Intent Classification, Dr. Doom Prompting,
 * Schema Validation, and Session Isolation.
 */

import {
  normalizeProject,
  normalizeArticle,
  normalizeLab,
  normalizeConcept,
  chunkDocument,
  computeContentHash,
  estimateTokenCount,
} from "../src/lib/ai/embeddings/chunker";
import {
  DeterministicEmbeddingProvider,
  cosineSimilarity,
} from "../src/lib/ai/embeddings/provider";
import { rankSearchResults } from "../src/lib/search/ranking";
import { classifyIntent } from "../src/lib/ai/doom/intent";
import { assembleDoomPrompt } from "../src/lib/ai/doom/context";
import { sanitizeDoomResponse, DoomResponseSchema } from "../src/lib/ai/doom/response";
import { ConversationService } from "../src/lib/ai/conversations/service";
import { checkRateLimit } from "../src/lib/shared/rateLimit";
import type { SearchResult } from "../src/lib/search/types";

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`[ASSERTION FAILED]: ${message}`);
  }
}

async function runTests() {
  console.log("\n========================================================");
  console.log("  VICTOROS PHASE D — INTELLIGENCE LAYER TEST SUITE");
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
      console.error(`  [FAIL] ${name}: ${err.message}`);
    }
  }

  // 1. Content Normalization
  await test("Content Normalization produces valid canonical documents", () => {
    const projDoc = normalizeProject(
      {
        id: "proj-1",
        slug: "nyayo",
        title: "NYAYO Discipleship Platform",
        category: "AI & Full Stack",
        status: "published",
        description: "A discipleship platform designed around knowing Christ.",
        technologies: ["React", "TypeScript", "Python"],
      },
      [{ title: "Architecture", content: "Event-driven distributed ingestion.", order_index: 0 }],
      ["ai", "discipleship"]
    );

    assert(projDoc.sourceType === "project", "sourceType must be project");
    assert(projDoc.url === "/work/nyayo", "URL must match /work/nyayo");
    assert(projDoc.content.includes("NYAYO"), "Content must include title");
    assert(projDoc.content.includes("Architecture"), "Content must include sections");

    const artDoc = normalizeArticle({
      id: "art-1",
      slug: "ai-engineering",
      title: "AI Engineering: Systems That Actually Solve Problems",
      content: "Evaluating generative boundaries deterministically.",
      category: "AI Systems",
      status: "published",
      reading_time_minutes: 6,
    });
    assert(artDoc.sourceType === "article", "sourceType must be article");
    assert(artDoc.url === "/journal/ai-engineering", "URL must match journal slug");

    const labDoc = normalizeLab({
      id: "lab-7",
      slug: "exp-07",
      title: "Football Intelligence",
      description: "Pitch homography.",
      category: "Computer Vision",
      status: "building",
    });
    assert(labDoc.sourceType === "lab", "sourceType must be lab");

    const conceptDoc = normalizeConcept({
      id: "c-1",
      slug: "lsm-trees",
      name: "Log-Structured Merge-Trees",
      category: "Storage Engines",
      description: "Append-only sequential disk writes with SSTables.",
    });
    assert(conceptDoc.sourceType === "concept", "sourceType must be concept");
  });

  // 2. Deterministic Chunking
  await test("Deterministic Chunking is consistent, bounded, and produces stable hashes", () => {
    const doc = normalizeProject({
      id: "proj-nyayo",
      slug: "nyayo",
      title: "NYAYO Platform",
      category: "Systems",
      status: "published",
      description: "A platform with extensive engineering details. ".repeat(40),
    });

    const chunks1 = chunkDocument(doc);
    const chunks2 = chunkDocument(doc);

    assert(chunks1.length > 0, "Should generate chunks");
    assert(chunks1.length === chunks2.length, "Chunk counts must be deterministic");
    assert(chunks1[0].id === chunks2[0].id, "Chunk IDs must be deterministic");
    assert(chunks1[0].contentHash === chunks2[0].contentHash, "Chunk hashes must be identical");
    assert(chunks1[0].tokenCount > 0, "Token count must be positive");

    const hash1 = computeContentHash("Hello VictorOS");
    const hash2 = computeContentHash("Hello VictorOS");
    const hash3 = computeContentHash("Different Content");
    assert(hash1 === hash2, "Identical content must yield identical hash");
    assert(hash1 !== hash3, "Different content must yield different hash");

    const tokens = estimateTokenCount("Hello world, testing token count heuristic.");
    assert(tokens > 3 && tokens < 20, "Token heuristic should be in realistic bounds");
  });

  // 3. Embedding Provider & Cosine Similarity
  await test("Embedding Provider generates 768-dim unit vectors with accurate cosine similarity", async () => {
    const provider = new DeterministicEmbeddingProvider();
    assert(provider.dimensions === 768, "Must be 768 dimensions for pgvector compatibility");

    const vecA = await provider.embedText("Distributed Consensus and Raft state machines");
    const vecB = await provider.embedText("Raft distributed consensus algorithm");
    const vecC = await provider.embedText("Baking sourdough bread in an oven");

    assert(vecA.length === 768, "Vector A must have 768 elements");
    assert(vecB.length === 768, "Vector B must have 768 elements");

    const simIdentical = cosineSimilarity(vecA, vecA);
    const simRelated = cosineSimilarity(vecA, vecB);
    const simUnrelated = cosineSimilarity(vecA, vecC);

    assert(Math.abs(simIdentical - 1.0) < 0.001, "Self-similarity must be ~1.0");
    assert(simRelated > simUnrelated, `Related (${simRelated.toFixed(3)}) must score higher than unrelated (${simUnrelated.toFixed(3)})`);
  });

  // 4. Search Ranking & Reciprocal Rank Fusion
  await test("Search Ranking fuses lexical and semantic results with hybrid boost", () => {
    const lexicalItems: SearchResult[] = [
      {
        sourceType: "project",
        sourceId: "proj-1",
        title: "NYAYO",
        slug: "nyayo",
        excerpt: "Discipleship system",
        score: 0.85,
        matchType: "lexical",
        url: "/work/nyayo",
      },
      {
        sourceType: "article",
        sourceId: "art-1",
        title: "AI Engineering",
        slug: "ai-engineering",
        excerpt: "Deterministic boundaries",
        score: 0.60,
        matchType: "lexical",
        url: "/journal/ai-engineering",
      },
    ];

    const semanticItems: SearchResult[] = [
      {
        sourceType: "project",
        sourceId: "proj-1", // Present in both -> hybrid
        title: "NYAYO",
        slug: "nyayo",
        excerpt: "Discipleship system rich chunk",
        score: 0.78,
        matchType: "semantic",
        url: "/work/nyayo",
      },
      {
        sourceType: "lab",
        sourceId: "lab-1",
        title: "Football Intelligence",
        slug: "football",
        excerpt: "CV pipeline",
        score: 0.70,
        matchType: "semantic",
        url: "/lab#football",
      },
    ];

    const ranked = rankSearchResults(lexicalItems, semanticItems);
    assert(ranked.length === 3, "Deduplication must keep 3 unique items");
    assert(ranked[0].sourceId === "proj-1", "Hybrid matched item should rank top");
    assert(ranked[0].matchType === "hybrid", "Item in both results must be marked hybrid");
    assert(ranked[0].score > ranked[1].score, "First item score must be higher than second");
  });

  // 5. Dr. Doom Intent Classification
  await test("Dr. Doom Intent Classifier correctly routes queries", () => {
    const navIntent = classifyIntent("take me to the journal module");
    assert(navIntent.intent === "navigation", "Must classify as navigation");
    assert(navIntent.prioritySources.includes("article"), "Must prioritize article");

    const projIntent = classifyIntent("Tell me about the NYAYO project and case study");
    assert(projIntent.intent === "project_question", "Must classify as project_question");
    assert(projIntent.prioritySources.includes("project"), "Must prioritize project");

    const labIntent = classifyIntent("What is Victor currently learning or prototyping in the lab?");
    assert(labIntent.intent === "lab_question", "Must classify as lab_question");

    const techIntent = classifyIntent("What technology stack is used: TypeScript, Go, or Postgres?");
    assert(techIntent.intent === "technology_question", "Must classify as technology_question");

    const bioIntent = classifyIntent("Who is Victor Kinyua and how can I hire him?");
    assert(bioIntent.intent === "about_victor", "Must classify as about_victor");
  });

  // 6. Context Assembly & Prompt Token Budgeting
  await test("Context Assembly bounds token budget and embeds verified evidence", () => {
    const classification = classifyIntent("Tell me about NYAYO");
    const evidence = [
      {
        sourceType: "project" as const,
        sourceId: "p1",
        title: "NYAYO",
        slug: "nyayo",
        url: "/work/nyayo",
        sectionTitle: "Architecture",
        content: "High-scale discipleship system with robust deterministic testing.",
        score: 0.92,
      },
    ];

    const prompt = assembleDoomPrompt("Tell me about NYAYO", classification, evidence);
    assert(prompt.includes("=== VICTOROS SYSTEM CONTEXT ==="), "Must have system header");
    assert(prompt.includes("=== VERIFIED SOURCE EVIDENCE ==="), "Must have evidence section");
    assert(prompt.includes("NYAYO"), "Must include evidence details");
    assert(prompt.includes("/work/nyayo"), "Must include evidence URL");
    assert(prompt.includes("USER QUERY: Tell me about NYAYO"), "Must include user query");
  });

  // 7. Schema Validation & Hallucination Sanitization
  await test("Doom Response Schema validates structured outputs and sanitizes fallbacks", () => {
    const validRaw = {
      message: "DR. DOOM reports: NYAYO is an active, production-tested platform.",
      references: [
        { type: "project", id: "nyayo", title: "NYAYO", slug: "nyayo", badge: "AI Platform" },
      ],
      actions: [
        { label: "Inspect NYAYO", action: "open_project", target: "nyayo" },
      ],
      intent: "project_question",
      confidence: 0.95,
    };

    const parsed = DoomResponseSchema.parse(validRaw);
    assert(parsed.references.length === 1, "Should parse references");
    assert(parsed.actions.length === 1, "Should parse actions");

    const invalidRaw = {
      message: "", // Empty message triggers fallback
    };
    const sanitized = sanitizeDoomResponse(invalidRaw);
    assert(sanitized.message.length > 0, "Sanitized fallback must provide non-empty message");
    assert(sanitized.actions.length > 0, "Sanitized fallback must provide navigation actions");
  });

  // 8. Conversation Isolation & Privacy
  await test("Conversation Service strictly isolates sessions across visitors", async () => {
    const convService = new ConversationService();
    const sessionA = "sess_user_alpha";
    const sessionB = "sess_user_beta";

    const conv = await convService.createConversation({
      sessionId: sessionA,
      title: "Alpha Research Query",
    });

    // Session A can read its own conversation
    const readA = await convService.getConversation(conv.id, sessionA);
    assert(readA.id === conv.id, "Owner session must read its conversation");

    // Session B must be blocked with ForbiddenError
    let forbiddenCaught = false;
    try {
      await convService.getConversation(conv.id, sessionB);
    } catch (err: any) {
      if (err.statusCode === 403 || err.message.includes("Access denied")) {
        forbiddenCaught = true;
      }
    }
    assert(forbiddenCaught, "Foreign session must be strictly rejected with 403 Forbidden");

    // Messages can be added and listed
    await convService.addMessage(conv.id, "user", "Hello Dr. Doom");
    await convService.addMessage(conv.id, "assistant", "Doom online.");
    const msgs = await convService.listMessages(conv.id, 10);
    assert(msgs.length === 2, "Conversation must contain 2 messages");
    assert(msgs[0].role === "user", "First message must be user");
    assert(msgs[1].role === "assistant", "Second message must be assistant");
  });

  // 9. Rate Limiter
  await test("Rate Limiter enforces sliding window limits", () => {
    const testId = `ratetest_${Date.now()}`;
    const opts = { windowMs: 1000, maxRequests: 3 };

    const r1 = checkRateLimit(testId, opts);
    assert(r1.allowed === true && r1.remaining === 2, "Request 1 should be allowed");

    const r2 = checkRateLimit(testId, opts);
    assert(r2.allowed === true && r2.remaining === 1, "Request 2 should be allowed");

    const r3 = checkRateLimit(testId, opts);
    assert(r3.allowed === true && r3.remaining === 0, "Request 3 should be allowed");

    const r4 = checkRateLimit(testId, opts);
    assert(r4.allowed === false && r4.remaining === 0, "Request 4 must be rate-limited");
  });

  console.log("\n--------------------------------------------------------");
  console.log(`  PHASE D TEST RESULTS: ${passed}/${total} PASSED`);
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

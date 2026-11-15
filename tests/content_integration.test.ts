import assert from "node:assert/strict";
import {
  mapArticleRowToArticle,
  mapKnowledgeGraphToUi,
  mapLabRowToExperiment,
  mapProjectRowToProject,
} from "../src/services/contentMappers";
import { ApiClientError, shouldFallbackToDevFixture } from "../src/services/apiClient";
import { KnowledgeRepository } from "../src/lib/knowledge/repository";
import { ArticleRepository } from "../src/lib/articles/repository";
import { projectRepository } from "../src/services/projectService";

async function runTests() {
  let passed = 0;

  // Test 1: Canonical project mapper reconstructs sections & snippet cleanly
  {
    const mapped = mapProjectRowToProject({
      id: "uuid-1",
      slug: "nyayo",
      number: "01",
      title: "NYAYO",
      subtitle: "Discipleship platform",
      description: "Details fallback",
      category: "AI & Platform Engineering",
      version: "v1.4.0",
      status: "published",
      featured: true,
      github_url: "https://github.com/test",
      live_url: null,
      metrics: [{ label: "Active Cohorts", value: "24", detail: "Groups" }],
      technologies: ["NEXT.JS", "SUPABASE"],
      architecture_nodes: [{ id: "a", label: "Node A", role: "input", x: 10, y: 20 }],
      architecture_lines: [],
      order_index: 1,
      sections: [
        { id: "s1", title: "Overview", content: "Overview copy", order_index: 1 },
        { id: "s2", title: "Problem", content: "Problem copy", order_index: 2 },
        { id: "s3", title: "Research", content: "Research copy", order_index: 3 },
        { id: "s4", title: "Solution", content: "Solution copy", order_index: 4 },
        { id: "s5", title: "Architecture Notes", content: "Arch notes", order_index: 5 },
        {
          id: "s6",
          title: "Implementation Snippet",
          content: JSON.stringify({ filename: "sync.ts", language: "typescript", code: "const x = 1;" }),
          order_index: 6,
        },
        { id: "s7", title: "Results", content: "Results copy", order_index: 7 },
        { id: "s8", title: "Lessons", content: "Lessons copy", order_index: 8 },
      ],
    });

    assert.equal(mapped.slug, "nyayo");
    assert.equal(mapped.deepDive.overview, "Overview copy");
    assert.equal(mapped.deepDive.implementationSnippet?.filename, "sync.ts");
    assert.equal(mapped.deepDive.implementationSnippet?.code, "const x = 1;");
    assert.equal(mapped.metrics?.[0]?.value, "24");
    passed++;
    console.log("PASS Test 1: Project canonical mapper reconstructs deepDive & snippet");
  }

  // Test 2: Canonical article & lab mappers handle DB rows & plain text fallbacks
  {
    const article = mapArticleRowToArticle({
      id: "art-1",
      slug: "ai-engineering-production",
      title: "AI Engineering",
      excerpt: "Deterministic boundaries",
      content: "## Intro\nHello",
      reading_time: 8,
      status: "published",
      featured: true,
      published_at: "2024-08-15T00:00:00Z",
      created_at: "2024-08-15T00:00:00Z",
      tags: [{ id: "t1", name: "AI Systems", slug: "ai-systems" }],
    });
    assert.equal(article.date, "AUG 2024");
    assert.equal(article.readTime, "8 min read");
    assert.equal(article.bentoSpan, "wide");
    assert.deepEqual(article.tags, ["AI Systems"]);

    const plainLab = mapLabRowToExperiment({
      id: "lab-1",
      slug: "custom-lab",
      title: "Custom Experiment",
      description: "Testing edge scheduling latency.",
      category: "Distributed Systems",
      status: "building",
      stars: 0,
      live_url: null,
      github_url: null,
      order_index: 1,
    });
    assert.equal(plainLab.status, "Building");
    assert.equal(plainLab.hypothesis, "Testing edge scheduling latency.");
    passed++;
    console.log("PASS Test 2: Article & Lab canonical mappers work for structured and plain DB rows");
  }

  // Test 3: Knowledge graph repository & mapper strictly filter unpublished cross-links
  {
    const mockClient = {
      from: (table: string) => ({
        select: () => {
          const buildResult = () => {
            if (table === "concepts") {
              return Promise.resolve({
                data: [
                  {
                    id: "c1",
                    slug: "ai-systems",
                    title: "Compound AI Systems",
                    category: "AI & ML",
                    definition: "Deterministic state machines.",
                    key_points: ["type:concept", "level:Advanced"],
                    related_concepts: [],
                    order_index: 1,
                    created_at: "",
                    updated_at: "",
                  },
                  {
                    id: "c2",
                    slug: "rag-architecture",
                    title: "RAG Architecture",
                    category: "AI & ML",
                    definition: "Hybrid retrieval.",
                    key_points: ["type:concept"],
                    related_concepts: [],
                    order_index: 2,
                    created_at: "",
                    updated_at: "",
                  },
                ],
                error: null,
              });
            }
            if (table === "concept_relationships") {
              return Promise.resolve({
                data: [
                  {
                    source_concept_id: "c1",
                    target_concept_id: "c2",
                    relationship_type: "utilizes",
                  },
                ],
                error: null,
              });
            }
            if (table === "content_concepts") {
              return Promise.resolve({
                data: [
                  { concept_id: "c1", content_type: "project", content_id: "p-pub" },
                  { concept_id: "c1", content_type: "project", content_id: "p-draft" },
                ],
                error: null,
              });
            }
            if (table === "projects") {
              return {
                eq: () =>
                  Promise.resolve({
                    data: [{ id: "p-pub", slug: "nyayo", status: "published" }],
                    error: null,
                  }),
              };
            }
            if (table === "articles") {
              return {
                eq: () => Promise.resolve({ data: [], error: null }),
              };
            }
            if (table === "labs") {
              return {
                neq: () => Promise.resolve({ data: [], error: null }),
              };
            }
            return Promise.resolve({ data: [], error: null });
          };
          const res = buildResult();
          if ("order" in res) return res;
          return Object.assign(res, {
            order: () => ({
              order: () => res,
            }),
          });
        },
      }),
    } as any;

    const repo = new KnowledgeRepository(mockClient);
    const graphDto = await repo.findAllGraph(false);
    assert.equal(graphDto.contentLinks.length, 1);
    assert.equal(graphDto.contentLinks[0].slug, "nyayo");

    const uiGraph = mapKnowledgeGraphToUi(graphDto);
    assert.equal(uiGraph.nodes[0].id, "ai-systems");
    assert.deepEqual(uiGraph.nodes[0].relatedProjects, ["nyayo"]);
    assert.deepEqual(uiGraph.nodes[0].connections, ["rag-architecture"]);
    passed++;
    console.log("PASS Test 3: Knowledge graph filters unpublished content & maps UI relationships");
  }

  // Test 4: Strict production mode disables dev-fixture fallback, 404 never triggers fallback
  {
    const prevNodeEnv = process.env.NODE_ENV;
    const prevFlag = process.env.VITE_ENABLE_DEV_FIXTURES;

    process.env.NODE_ENV = "production";
    delete process.env.VITE_ENABLE_DEV_FIXTURES;
    assert.equal(
      shouldFallbackToDevFixture(new ApiClientError("No DB", "SUPABASE_NOT_CONFIGURED", 503)),
      false
    );

    process.env.NODE_ENV = "development";
    assert.equal(
      shouldFallbackToDevFixture(new ApiClientError("Not found", "NOT_FOUND", 404)),
      false
    );
    assert.equal(
      shouldFallbackToDevFixture(new ApiClientError("No DB", "SUPABASE_NOT_CONFIGURED", 503)),
      true
    );

    if (prevNodeEnv === undefined) delete process.env.NODE_ENV;
    else process.env.NODE_ENV = prevNodeEnv;
    if (prevFlag !== undefined) process.env.VITE_ENABLE_DEV_FIXTURES = prevFlag;

    passed++;
    console.log("PASS Test 4: Dev-fixture fallback strictly disallowed in production and on 404s");
  }

  // Test 5: ArticleRepository hydrates tags from article_tags + tags tables
  {
    const mockClient = {
      from: (table: string) => ({
        select: () => ({
          eq: () => ({
            maybeSingle: () =>
              Promise.resolve({
                data: {
                  id: "a1",
                  slug: "test-essay",
                  title: "Test Essay",
                  excerpt: "Summary",
                  content: "Body",
                  reading_time: 6,
                  status: "published",
                  featured: false,
                  cover_image_url: null,
                  published_at: "2024-08-01T00:00:00Z",
                  created_at: "2024-08-01T00:00:00Z",
                  updated_at: "2024-08-01T00:00:00Z",
                },
                error: null,
              }),
          }),
          in: () => {
            if (table === "article_tags") {
              return Promise.resolve({
                data: [{ article_id: "a1", tag_id: "t1" }],
                error: null,
              });
            }
            if (table === "tags") {
              return Promise.resolve({
                data: [{ id: "t1", name: "Systems", slug: "systems" }],
                error: null,
              });
            }
            return Promise.resolve({ data: [], error: null });
          },
        }),
      }),
    } as any;

    const articleRepo = new ArticleRepository(mockClient);
    const article = await articleRepo.findBySlug("test-essay");
    assert.ok(article);
    assert.equal(article.tags?.[0]?.name, "Systems");
    passed++;
    console.log("PASS Test 5: ArticleRepository hydrates tags via join");
  }

  // Test 6: Client 404 propagates as null instead of throwing or substituting fallback data
  {
    const originalFetch = globalThis.fetch;
    globalThis.fetch = (async () =>
      new Response(
        JSON.stringify({
          success: false,
          error: { code: "NOT_FOUND", message: "Project not found", statusCode: 404 },
        }),
        { status: 404, headers: { "Content-Type": "application/json" } }
      )) as typeof fetch;

    try {
      const res = await projectRepository.getProjectBySlug("nonexistent-slug");
      assert.equal(res.data, null);
      assert.equal(res.isFixture, false);
      passed++;
      console.log("PASS Test 6: Missing slug returns null cleanly on HTTP 404");
    } finally {
      globalThis.fetch = originalFetch;
    }
  }

  console.log(`\n${passed}/6 content integration checks passed.`);
}

runTests().catch((err) => {
  console.error("Content integration test failed:", err);
  process.exit(1);
});

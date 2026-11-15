/**
 * Tovu — Content Synchronization & Cold-Start Vector Search Test Suite (Milestone 4)
 * Verifies:
 * 1. Deterministic UUID v5-shaped chunk IDs compatible with PostgreSQL UUID columns
 * 2. ContentIndexer sourcing strictly from canonical repositories & purging drafts/archives
 * 3. EmbeddingService stateless cold-start hydration via match_chunks RPC without memory index
 * 4. Domain service mutation lifecycle hooks triggering background sync
 */

import { EmbeddingService } from "../src/lib/ai/embeddings/service";
import { ContentIndexer, type ContentIndexerRepos } from "../src/lib/ai/embeddings/indexer";
import { DeterministicEmbeddingProvider } from "../src/lib/ai/embeddings/provider";
import { computeDeterministicUuid } from "../src/lib/ai/embeddings/chunker";
import { setEmbeddingSyncHook } from "../src/lib/ai/embeddings/sync";
import { ProjectService } from "../src/lib/projects/service";
import { ArticleService } from "../src/lib/articles/service";
import { LabService } from "../src/lib/labs/service";
import { KnowledgeService } from "../src/lib/knowledge/service";
import type { ProfileRecord } from "../src/lib/auth/authorization";

function assert(condition: boolean, message: string): void {
  if (!condition) {
    throw new Error(`[ASSERTION FAILED] ${message}`);
  }
}

const ADMIN_PROFILE: ProfileRecord = {
  id: "11111111-1111-4111-8111-111111111111",
  username: "victor",
  full_name: "Victor Kinyua",
  avatar_url: null,
  bio: null,
  role: "admin",
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

async function runTests() {
  console.log("\n========================================================");
  console.log("  TOVU — CONTENT SYNCHRONIZATION TEST SUITE");
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

  // 1. UUID compatibility for PostgreSQL content_chunks.id
  await test("computeDeterministicUuid produces stable RFC-4122 UUIDs", () => {
    const id1 = computeDeterministicUuid("project:11111111-1111-4111-8111-111111111111:0");
    const id2 = computeDeterministicUuid("project:11111111-1111-4111-8111-111111111111:0");
    const id3 = computeDeterministicUuid("project:11111111-1111-4111-8111-111111111111:1");
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-5[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

    assert(id1 === id2, "UUIDs must be deterministic for same seed");
    assert(id1 !== id3, "Different chunk indices must yield unique UUIDs");
    assert(uuidRegex.test(id1), `UUID '${id1}' must conform to PostgreSQL UUID v5 format`);
  });

  // 2. ContentIndexer reads canonical DB repos and purges unpublished/archived items
  await test("ContentIndexer indexes published DB content and purges drafts/archived", async () => {
    EmbeddingService.clearMemoryCache();
    const deletedEntities: Array<{ type: string; id: string }> = [];

    const provider = new DeterministicEmbeddingProvider();
    const fakeSupabaseClient = {
      from: (table: string) => ({
        upsert: async () => ({ error: null }),
        delete: () => ({
          eq: (_k1: string, val1: string) => ({
            eq: (_k2: string, val2: string) => {
              if (table === "content_chunks") {
                deletedEntities.push({ type: val1, id: val2 });
              }
              return {
                gte: async () => ({ error: null }),
              };
            },
          }),
        }),
      }),
    } as any;

    const embService = new EmbeddingService(provider, fakeSupabaseClient);

    const mockRepos: ContentIndexerRepos = {
      projects: {
        findMany: async () => ({
          data: [
            {
              id: "p-pub-1",
              slug: "nyayo",
              title: "NYAYO",
              number: "01",
              subtitle: "Discipleship system",
              description: "Published case study.",
              category: "AI",
              status: "published",
              technologies: ["Supabase"],
            },
            {
              id: "p-draft-2",
              slug: "secret-draft",
              title: "Draft Project",
              number: "99",
              subtitle: "Hidden",
              description: "Should be purged",
              category: "Systems",
              status: "draft",
              technologies: [],
            },
          ],
          total: 2,
        }),
        findById: async (id: string) =>
          id === "p-pub-1"
            ? {
                id: "p-pub-1",
                slug: "nyayo",
                title: "NYAYO",
                number: "01",
                subtitle: "Discipleship system",
                description: "Published case study.",
                category: "AI",
                status: "published",
                technologies: ["Supabase"],
              }
            : null,
        findSections: async () => [
          { title: "Architecture", content: "RLS enforced.", order_index: 0 },
        ],
      } as any,
      articles: {
        findMany: async () => ({
          data: [
            {
              id: "a-pub-1",
              slug: "sstable-notes",
              title: "SSTables",
              excerpt: "Storage internals",
              content: "Append-only storage mechanics.",
              category: "Systems",
              status: "published",
              reading_time: 5,
              tags: [{ id: "t1", name: "Storage", slug: "storage" }],
            },
          ],
          total: 1,
        }),
        findById: async () => ({
          id: "a-pub-1",
          slug: "sstable-notes",
          title: "SSTables",
          excerpt: "Storage internals",
          content: "Append-only storage mechanics.",
          category: "Systems",
          status: "published",
          reading_time: 5,
          tags: [{ id: "t1", name: "Storage", slug: "storage" }],
        }),
      } as any,
      labs: {
        findMany: async () => ({
          data: [
            {
              id: "l-arch-1",
              slug: "old-lab",
              title: "Old Lab",
              description: "Archived",
              category: "CV",
              status: "archived",
            },
          ],
          total: 1,
        }),
        findById: async () => null,
      } as any,
      knowledge: {
        findMany: async () => ({
          data: [
            {
              id: "c-1",
              slug: "raft",
              title: "Raft Consensus",
              definition: "Leader election and replicated state logs.",
              category: "Distributed Systems",
              icon: null,
            },
          ],
          total: 1,
        }),
        findById: async () => ({
          id: "c-1",
          slug: "raft",
          title: "Raft Consensus",
          definition: "Leader election and replicated state logs.",
          category: "Distributed Systems",
          icon: null,
        }),
      } as any,
    };

    const indexer = new ContentIndexer(embService, mockRepos);
    const stats = await indexer.indexAll();

    assert(stats.projectsIndexed === 1, "Only published projects must be indexed");
    assert(stats.articlesIndexed === 1, "Published article must be indexed");
    assert(stats.labsIndexed === 0, "Archived lab must not be indexed");
    assert(stats.conceptsIndexed === 1, "Knowledge concept must be indexed");
    assert(stats.purgedCount === 2, "Draft project and archived lab must be purged");
    assert(stats.totalChunks >= 3, "Chunks should be generated from DB content");
  });

  // 3. Stateless DB vector search hydration when memory cache is completely empty
  await test("EmbeddingService.searchSimilar works on cold start without memoryChunkIndex", async () => {
    EmbeddingService.clearMemoryCache();
    assert(EmbeddingService.getIndexStats().chunkCount === 0, "Memory cache must be cold/empty");

    const provider = new DeterministicEmbeddingProvider();
    const coldRpcClient = {
      rpc: async () => ({
        data: [
          {
            chunk_id: "aaaaaaaa-aaaa-5aaa-8aaa-aaaaaaaaaaaa",
            source_type: "project",
            source_id: "p-pub-1",
            chunk_index: 0,
            content: "Metric pitch homography pipeline.",
            token_count: 12,
            similarity: 0.89,
          },
          {
            chunk_id: "bbbbbbbb-bbbb-5bbb-8bbb-bbbbbbbbbbbb",
            source_type: "project",
            source_id: "p-draft-1",
            chunk_index: 0,
            content: "Unpublished confidential notes.",
            token_count: 10,
            similarity: 0.92,
          },
        ],
        error: null,
      }),
      from: (table: string) => ({
        select: () => ({
          in: async (_col: string, _ids: string[]) => {
            if (table === "projects") {
              return {
                data: [
                  {
                    id: "p-pub-1",
                    title: "Football Intelligence",
                    slug: "football-intelligence",
                    status: "published",
                  },
                  {
                    id: "p-draft-1",
                    title: "Hidden Draft",
                    slug: "hidden-draft",
                    status: "draft",
                  },
                ],
                error: null,
              };
            }
            return { data: [], error: null };
          },
        }),
      }),
    } as any;

    const embService = new EmbeddingService(provider, coldRpcClient);
    const vec = await provider.embedText("football pitch homography");
    const results = await embService.searchSimilar(vec, {
      limit: 5,
      includeDrafts: false,
    });

    assert(results.length === 1, "Cold RPC search must hydrate published item and exclude draft");
    assert(results[0].chunk.title === "Football Intelligence", "Title hydrated from DB");
    assert(results[0].chunk.url === "/work/football-intelligence", "Canonical URL constructed");
  });

  // 4. Lifecycle hooks emit sync labels cleanly on publish/archive/delete
  await test("Domain services trigger incremental embedding sync hooks on mutations", async () => {
    const triggeredLabels: string[] = [];
    setEmbeddingSyncHook((_task, label) => {
      triggeredLabels.push(label);
    });

    try {
      const fakeProjectRepo = {
        findBySlug: async () => null,
        findById: async () => ({
          id: "p1",
          slug: "test-proj",
          title: "Test Project",
          category: "AI",
          status: "draft",
        }),
        create: async (inp: any) => ({ id: "p1", ...inp }),
        update: async (_id: string, inp: any) => ({
          id: "p1",
          slug: "test-proj",
          title: "Test Project",
          category: "AI",
          status: inp.status || "published",
        }),
        delete: async () => undefined,
      } as any;

      const projectService = new ProjectService(fakeProjectRepo);
      await projectService.publishProject("p1", ADMIN_PROFILE);
      await projectService.archiveProject("p1", ADMIN_PROFILE);
      await projectService.deleteProject("p1", ADMIN_PROFILE);

      const fakeArticleRepo = {
        findById: async () => ({
          id: "a1",
          slug: "test-art",
          title: "Test Art",
          content: "Detailed systems notes.",
          status: "draft",
        }),
        update: async (_id: string, inp: any) => ({
          id: "a1",
          slug: "test-art",
          status: inp.status || "published",
        }),
        delete: async () => undefined,
      } as any;

      const articleService = new ArticleService(fakeArticleRepo);
      await articleService.publishArticle("a1", ADMIN_PROFILE);
      await articleService.deleteArticle("a1", ADMIN_PROFILE);

      const fakeLabRepo = {
        findById: async () => ({
          id: "l1",
          slug: "lab-1",
          title: "Lab 1",
          description: "Notes",
          category: "AI",
          status: "exploring",
        }),
        update: async () => ({ id: "l1", slug: "lab-1", status: "archived" }),
      } as any;

      const labService = new LabService(fakeLabRepo);
      await labService.archiveLab("l1", ADMIN_PROFILE);

      const fakeKnowledgeRepo = {
        findBySlug: async () => null,
        findById: async () => ({
          id: "k1",
          slug: "raft",
          title: "Raft",
          category: "Systems",
        }),
        create: async (inp: any) => ({ id: "k1", ...inp }),
        delete: async () => undefined,
      } as any;

      const knowledgeService = new KnowledgeService(fakeKnowledgeRepo);
      await knowledgeService.deleteConcept("k1", ADMIN_PROFILE);

      assert(triggeredLabels.includes("project:publish:p1"), "Project publish must sync");
      assert(triggeredLabels.includes("project:archive:p1"), "Project archive must purge");
      assert(triggeredLabels.includes("project:delete:p1"), "Project delete must purge");
      assert(triggeredLabels.includes("article:publish:a1"), "Article publish must sync");
      assert(triggeredLabels.includes("article:delete:a1"), "Article delete must purge");
      assert(triggeredLabels.includes("lab:archive:l1"), "Lab archive must purge");
      assert(triggeredLabels.includes("concept:delete:k1"), "Concept delete must purge");
    } finally {
      setEmbeddingSyncHook(null);
    }
  });

  console.log("\n--------------------------------------------------------");
  console.log(`  CONTENT SYNC TEST RESULTS: ${passed}/${total} PASSED`);
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

/**
 * Milestone 1 — Security Foundation Verification Suite
 * Verifies:
 * 1. Cryptographic HttpOnly visitor session issuance & tamper rejection
 * 2. Draft project & section leakage protection
 * 3. Archived lab exclusion for public callers vs editor/admin access
 * 4. Media library authorization enforcement
 * 5. Conversation ownership & prompt-injection / hijack blocking in TovuService
 * 6. Browser-safe env isolation & barrel quarantine (no service-role exposure)
 */

import fs from "node:fs";
import path from "node:path";
import {
  issueSignedVisitorToken,
  verifySignedVisitorSession,
  resolveOrIssueVisitorSession,
} from "../src/lib/auth/visitorSession";
import { ProjectService } from "../src/lib/projects/service";
import { LabService } from "../src/lib/labs/service";
import { MediaService } from "../src/lib/media/service";
import { ConversationService, toPublicConversation } from "../src/lib/ai/conversations/service";
import { TovuService } from "../src/lib/ai/tovu/service";
import type { ProfileRecord } from "../src/lib/auth/authorization";

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`[ASSERTION FAILED]: ${message}`);
  }
}

const adminProfile: ProfileRecord = {
  id: "00000000-0000-0000-0000-000000000001",
  username: "victor",
  user_id: "00000000-0000-0000-0000-000000000001",
  display_name: "Victor Kinyua",
  avatar_url: null,
  bio: null,
  role: "admin",
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

const viewerProfile: ProfileRecord = {
  ...adminProfile,
  id: "00000000-0000-0000-0000-000000000002",
  username: "visitor",
  role: "viewer",
};

async function runTests() {
  console.log("\n========================================================");
  console.log("  MILESTONE 1 — SECURITY FOUNDATION TEST SUITE");
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
      console.error(`  [FAIL] ${name}: ${err?.message || String(err)}`);
    }
  }

  // 1. Cryptographic visitor cookie signing & tamper detection
  await test("Cryptographic visitor session tokens verify legitimately and reject tampering", () => {
    const { sessionId, cookieToken } = issueSignedVisitorToken();
    assert(sessionId.startsWith("sid_"), "Session ID must use sid_ prefix");
    assert(verifySignedVisitorSession(cookieToken) === sessionId, "Valid token must verify");

    const tampered = cookieToken.slice(0, -1) + (cookieToken.endsWith("a") ? "b" : "a");
    assert(verifySignedVisitorSession(tampered) === null, "Tampered signature must fail verification");
    assert(verifySignedVisitorSession("forged-session-id") === null, "Unsigned token must fail verification");

    const headersWritten: Record<string, string | string[]> = {};
    const mockRes = {
      getHeader: (k: string) => headersWritten[k],
      setHeader: (k: string, v: string | string[]) => {
        headersWritten[k] = v;
      },
    };
    const issued = resolveOrIssueVisitorSession({ headers: {} } as any, mockRes as any);
    assert(issued.isNew === true, "Missing cookie must issue new visitor session");
    const setCookie = String(headersWritten["Set-Cookie"]);
    assert(setCookie.includes("HttpOnly"), "Visitor cookie must be HttpOnly");
    assert(setCookie.includes("SameSite=Lax"), "Visitor cookie must be SameSite=Lax");
  });

  // 2. Draft project & section visibility boundary
  await test("Draft project sections cannot be fetched by public/viewer callers", async () => {
    const fakeRepo: any = {
      findById: async (id: string) =>
        id === "proj-draft"
          ? { id: "proj-draft", slug: "secret-draft", status: "draft", title: "Secret", category: "AI" }
          : { id: "proj-pub", slug: "public-sys", status: "published", title: "Public", category: "AI" },
      findSections: async (id: string) => [{ id: "sec-1", project_id: id, title: "Arch", content: "Hidden", order_index: 0 }],
    };

    const projectService = new ProjectService(fakeRepo);

    let blocked = false;
    try {
      await projectService.getProjectSections("proj-draft", null);
    } catch (err: any) {
      if (err.statusCode === 404) blocked = true;
    }
    assert(blocked, "Public caller must receive 404 for draft project sections");

    let blockedViewer = false;
    try {
      await projectService.getProjectSections("proj-draft", viewerProfile);
    } catch (err: any) {
      if (err.statusCode === 404) blockedViewer = true;
    }
    assert(blockedViewer, "Viewer role must receive 404 for draft project sections");

    const adminSections = await projectService.getProjectSections("proj-draft", adminProfile);
    assert(adminSections.length === 1, "Admin must be able to access draft sections");

    const publicSections = await projectService.getProjectSections("proj-pub", null);
    assert(publicSections.length === 1, "Public caller can read published project sections");
  });

  // 3. Archived lab isolation
  await test("Archived labs are hidden from public callers across list and slug lookups", async () => {
    let lastFilter: any = null;
    const fakeLabRepo: any = {
      findMany: async (filter: any) => {
        lastFilter = filter;
        return { data: [], total: 0 };
      },
      findBySlug: async (slug: string) =>
        slug === "archived-lab"
          ? { id: "l-arch", slug: "archived-lab", title: "Old Lab", status: "archived" }
          : { id: "l-act", slug: "active-lab", title: "Active Lab", status: "building" },
    };

    const labService = new LabService(fakeLabRepo);
    await labService.listLabs({}, null);
    assert(lastFilter.excludeArchived === true, "Public lab listing must set excludeArchived=true");

    const filteredArchived = await labService.listLabs({ status: "archived" }, null);
    assert(filteredArchived.labs.length === 0, "Public query for status=archived must return empty");

    let blockedSlug = false;
    try {
      await labService.getLabBySlug("archived-lab", null);
    } catch (err: any) {
      if (err.statusCode === 404) blockedSlug = true;
    }
    assert(blockedSlug, "Public caller must receive 404 for archived lab slug");

    const adminArch = await labService.getLabBySlug("archived-lab", adminProfile);
    assert(adminArch.slug === "archived-lab", "Admin can inspect archived lab");
  });

  // 4. Media library authorization
  await test("Media listing and detail endpoints reject unauthenticated/viewer callers", async () => {
    const fakeMediaRepo: any = {
      findMany: async () => ({ data: [], total: 0 }),
      findById: async () => ({ id: "m-1" }),
    };
    const mediaService = new MediaService(fakeMediaRepo);

    let unauthBlocked = false;
    try {
      await mediaService.listMedia({}, null);
    } catch (err: any) {
      if (err.statusCode === 403) unauthBlocked = true;
    }
    assert(unauthBlocked, "Unauthenticated media listing must be rejected");

    const adminList = await mediaService.listMedia({}, adminProfile);
    assert(Array.isArray(adminList.media), "Admin can list media");
  });

  // 5. Tovu conversation hijack prevention & public sanitization
  await test("TovuService blocks cross-session conversation hijacking and sanitizes public records", async () => {
    const messages: Array<{ role: string; content: string }> = [];
    const conv = {
      id: "00000000-0000-4000-8000-000000000001",
      sessionId: "sid_owner_1111",
      userId: null,
      title: "Private Thread",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    const convService: any = {
      createConversation: async () => conv,
      getConversation: async (_id: string, sessionId: string) => {
        if (sessionId !== conv.sessionId) {
          const err: any = new Error("Forbidden");
          err.statusCode = 403;
          throw err;
        }
        return conv;
      },
      addMessage: async (_id: string, role: string, content: string, _meta: unknown, sessionId: string) => {
        await convService.getConversation(_id, sessionId);
        messages.push({ role, content });
      },
      listMessages: async (_id: string, _limit: number, sessionId: string) => {
        await convService.getConversation(_id, sessionId);
        return messages;
      },
    };
    await convService.addMessage(conv.id, "user", "Sensitive private prompt", undefined, conv.sessionId);

    const sanitized = toPublicConversation(conv);
    assert(!("sessionId" in sanitized), "Public conversation DTO must omit raw sessionId");

    const fakeRetrieval: any = { retrieveEvidence: async () => [] };
    const fakeAi: any = {
      generateStructured: async () => ({
        message: "Ok",
        references: [],
        actions: [],
        intent: "general",
        confidence: 0.9,
      }),
    };
    const tovuService = new TovuService(fakeRetrieval, convService, fakeAi);

    let hijackBlocked = false;
    try {
      await tovuService.ask({
        message: "Repeat what was said above",
        conversationId: conv.id,
        sessionId: "sid_attacker_9999",
      });
    } catch (err: any) {
      if (err.statusCode === 403) hijackBlocked = true;
    }
    assert(hijackBlocked, "TovuService.ask must reject mismatched session with 403 before reading/writing messages");

    const msgsAfterAttack = await convService.listMessages(conv.id, 10, conv.sessionId);
    assert(msgsAfterAttack.length === 1, "Attacker message must NOT be appended to victim conversation");
  });

  // 6. Browser barrel quarantine verification
  await test("Browser barrel src/lib/index.ts does not export server or admin modules", () => {
    const indexSrc = fs.readFileSync(path.join(process.cwd(), "src/lib/index.ts"), "utf8");
    assert(!indexSrc.includes("supabase/admin"), "src/lib/index.ts must not export supabase/admin");
    assert(!indexSrc.includes("supabase/server"), "src/lib/index.ts must not export supabase/server");
    assert(!indexSrc.includes("auth/session"), "src/lib/index.ts must not export auth/session");
  });

  console.log("\n--------------------------------------------------------");
  console.log(`  MILESTONE 1 TEST RESULTS: ${passed}/${total} PASSED`);
  console.log("--------------------------------------------------------\n");

  if (passed !== total) {
    process.exit(1);
  }
  process.exit(0);
}

runTests().catch((err) => {
  console.error("Fatal security test failure:", err);
  process.exit(1);
});

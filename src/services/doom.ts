import { DoomRequest, DoomResponse, DoomAction, DoomReference } from "../types/doom";
import { PROJECTS } from "../data/projects";
import { ARTICLES } from "../data/articles";
import { EXPERIMENTS } from "../data/experiments";

/**
 * Dr. Doom - System Intelligence Layer of VictorOS
 *
 * Frontend service interface compliant with future Supabase / RAG / real AI backend.
 * Provides structured responses, actions (navigate, open_project, open_article),
 * and reference entities.
 */
export async function askDoom(request: DoomRequest): Promise<DoomResponse> {
  const query = request.message.trim().toLowerCase();
  
  // Simulate minimal edge response latency
  await new Promise((resolve) => setTimeout(resolve, 380));

  // 1. AI Projects query
  if (query.includes("ai project") || query.includes("machine learning") || (query.includes("ai") && (query.includes("project") || query.includes("work")))) {
    const aiProjects = PROJECTS.filter((p) =>
      p.category.toLowerCase().includes("ai") ||
      p.category.toLowerCase().includes("machine learning") ||
      p.technologies.some((t) => t.toLowerCase().includes("ai") || t.toLowerCase().includes("python") || t.toLowerCase().includes("pytorch"))
    );

    const references: DoomReference[] = aiProjects.map((p) => ({
      type: "project",
      id: p.id,
      title: p.title,
      slug: p.slug,
      badge: p.category
    }));

    const actions: DoomAction[] = [
      { label: "Open NYAYO Case Study", type: "open_project", target: "nyayo" },
      { label: "Open Football Intelligence", type: "open_project", target: "football-intelligence" },
      { label: "Navigate to Work Module", type: "navigate", target: "work" }
    ];

    return {
      message: `I located ${references.length} high-fidelity AI systems in Victor's architecture records:\n\n` +
        aiProjects.map((p) => `• **${p.number} — ${p.title}** (${p.technologies.slice(0, 3).join(", ")})\n  ${p.subtitle}`).join("\n\n") +
        `\n\nEach system demonstrates deterministic evaluation boundaries rather than superficial prompt wrappers.`,
      actions,
      references,
      timestamp: new Date().toLocaleTimeString()
    };
  }

  // 2. Learning / Current focus query
  if (query.includes("learning") || query.includes("currently") || query.includes("reading") || query.includes("studying")) {
    return {
      message: `Victor is currently operating across three technical frontiers:\n\n` +
        `1. **Distributed Systems Consensus**: Deep study of Raft and Multi-Paxos correctness invariants under network partitions, validated using TLA+ proofs.\n` +
        `2. **Storage Engines & LSM-Trees**: 3rd review of *Designing Data-Intensive Applications* with emphasis on Bloom filter collision mathematics and sequential I/O write amplification.\n` +
        `3. **High-Throughput Actor Concurrency in Go**: Building a coroutine actor framework capable of 4.2M events/sec.\n\n` +
        `Would you like to examine the active Lab experiments or the Knowledge Lattice?`,
      actions: [
        { label: "Inspect Lab Experiments", type: "navigate", target: "lab" },
        { label: "Explore Knowledge Lattice", type: "navigate", target: "knowledge" },
        { label: "Read Storage Engine Essay", type: "open_article", target: "data-intensive-architecture" }
      ],
      references: [
        { type: "article", id: "data-intensive-architecture", title: "SSTables & Storage Engine Mechanics", slug: "data-intensive-architecture", badge: "Data & Storage" },
        { type: "experiment", id: "exp-10-actor-agents", title: "Sub-millisecond Actor Concurrency Engine in Go", slug: "exp-10-actor-agents", badge: "Distributed Systems" }
      ],
      timestamp: new Date().toLocaleTimeString()
    };
  }

  // 3. Navigation to Journal / Essays
  if (query.includes("journal") || query.includes("article") || query.includes("blog") || query.includes("essay") || query.includes("read")) {
    return {
      message: `Navigating to the Journal module. Victor's writings center around:\n\n` +
        `• **AI Engineering**: Building compound systems that solve real problems.\n` +
        `• **Storage Internals**: LSM-Trees, SSTables, and physical hardware constraints.\n` +
        `• **Opinionated Design**: Why strict mathematical constraints yield superior craft.`,
      actions: [
        { label: "Jump to Journal Bento", type: "navigate", target: "journal" },
        { label: "Read AI Engineering Essay", type: "open_article", target: "ai-engineering-production" }
      ],
      references: ARTICLES.map((a) => ({
        type: "article",
        id: a.id,
        title: a.title,
        slug: a.slug,
        badge: a.category
      })),
      timestamp: new Date().toLocaleTimeString()
    };
  }

  // 4. Who is Victor?
  if (query.includes("who is victor") || query.includes("about victor") || query.includes("background") || query.includes("bio") || query.includes("philosophy")) {
    return {
      message: `Victor is a software engineer, AI builder, data thinker, and systems architect.\n\n` +
        `**Core Creed:**\n` +
        `> *"I build systems. I explore ideas. I solve problems."*\n\n` +
        `He focuses on foundational engineering: fault-tolerant distributed infrastructure (Go, Rust), compound AI pipelines (PyTorch, vector search), and disciplined, high-contrast digital tools (Next.js, TypeScript).`,
      actions: [
        { label: "View About & Timeline", type: "navigate", target: "about" },
        { label: "Get in Touch", type: "navigate", target: "contact" }
      ],
      timestamp: new Date().toLocaleTimeString()
    };
  }

  // 5. NYAYO specific inquiry
  if (query.includes("nyayo")) {
    const nyayo = PROJECTS.find((p) => p.id === "nyayo");
    return {
      message: `**NYAYO** is Victor's flagship discipleship platform designed around knowing Christ and faithfully following Him.\n\n` +
        `• **Stack:** Next.js, Supabase, PostgreSQL RLS, Edge AI commentary synthesis.\n` +
        `• **Design Approach:** Intentionally removes superficial gamification and notifications in favor of contemplative typography and authentic fellowship accountability.\n` +
        `• **Metrics:** 24 active cohorts, 88% weekly consistency retention, <180ms edge AI grounding latency.`,
      actions: [
        { label: "Open NYAYO Full Case Study", type: "open_project", target: "nyayo" }
      ],
      references: [
        { type: "project", id: "nyayo", title: "NYAYO Discipleship Platform", slug: "nyayo", badge: "Featured System" }
      ],
      timestamp: new Date().toLocaleTimeString()
    };
  }

  // 6. Football Intelligence inquiry
  if (query.includes("football") || query.includes("scout") || query.includes("yolo") || query.includes("kinematics")) {
    return {
      message: `**Football Intelligence** is Victor's computer vision scouting pipeline:\n\n` +
        `• Translates handheld mobile footage of youth/grassroots matches into metric pitch coordinates using perspective homography matrices.\n` +
        `• Tracks instantaneous acceleration vectors (first 3-5 meters) to surface elite athletic outliers without requiring expensive $2,500 GPS tracking vests.\n` +
        `• Features in both the finished Work showcase and the active R&D Laboratory.`,
      actions: [
        { label: "Open Football Intelligence Project", type: "open_project", target: "football-intelligence" },
        { label: "Inspect Experiment 07 in Lab", type: "navigate", target: "lab" }
      ],
      references: [
        { type: "project", id: "football-intelligence", title: "Football Intelligence", slug: "football-intelligence", badge: "CV & Machine Learning" },
        { type: "experiment", id: "exp-07-football", title: "Experiment 07 - Pitch Reconstruction", slug: "exp-07-football", badge: "Lab Prototype" }
      ],
      timestamp: new Date().toLocaleTimeString()
    };
  }

  // 7. General search fallback
  return {
    message: `Dr. Doom evaluated query: "${request.message}".\n\n` +
      `VictorOS contains 5 completed engineering showcases, 5 active Lab experiments, 4 editorial essays, and 16 interconnected knowledge nodes. ` +
      `Select a module below to inspect the architecture:`,
    actions: [
      { label: "Explore Work Systems", type: "navigate", target: "work" },
      { label: "Visit R&D Laboratory", type: "navigate", target: "lab" },
      { label: "Read Journal Essays", type: "navigate", target: "journal" },
      { label: "Inspect Knowledge Graph", type: "navigate", target: "knowledge" }
    ],
    references: [
      { type: "project", id: "nyayo", title: "NYAYO", slug: "nyayo", badge: "AI Platform" },
      { type: "project", id: "football-intelligence", title: "Football Intelligence", slug: "football-intelligence", badge: "CV Pipeline" },
      { type: "article", id: "ai-engineering-production", title: "AI Engineering in Production", slug: "ai-engineering-production", badge: "Essay" }
    ],
    timestamp: new Date().toLocaleTimeString()
  };
}

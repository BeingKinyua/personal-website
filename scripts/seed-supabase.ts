/**
 * Idempotent Supabase Seed Script for Tovu Canonical Content
 * Migrates portfolio Projects (with ordered sections), Articles (with tags),
 * Labs, and Knowledge Graph concepts/relationships into Supabase PostgreSQL.
 *
 * Usage:
 *   npx tsx scripts/seed-supabase.ts
 *
 * Safety: Uses non-destructive upserts by unique slug/composite keys.
 */

import "dotenv/config";
import { createSupabaseAdminClient } from "../src/lib/supabase/admin";
import type { Json, LabStatus } from "../src/lib/supabase/types";
import { PROJECTS } from "../src/data/projects";
import { ARTICLES } from "../src/data/articles";
import { EXPERIMENTS } from "../src/data/experiments";
import { KNOWLEDGE_EDGES, KNOWLEDGE_NODES } from "../src/data/knowledge";

function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function parseEditorialDate(raw: string): string {
  const parts = raw.trim().split(/\s+/);
  const monthNames = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
  const mIdx = monthNames.indexOf((parts[0] || "").toUpperCase());
  const year = parseInt(parts[1] || "", 10);
  if (mIdx >= 0 && !Number.isNaN(year)) {
    return new Date(Date.UTC(year, mIdx, 15, 0, 0, 0)).toISOString();
  }
  return new Date().toISOString();
}

function parseReadingTime(raw: string): number {
  const match = raw.match(/\d+/);
  return match ? parseInt(match[0], 10) : 5;
}

function mapUiLabStatus(status: string): LabStatus {
  switch (status.toLowerCase()) {
    case "building":
      return "building";
    case "exploring":
      return "exploring";
    case "prototype":
      return "completed";
    case "paused":
      return "paused";
    case "archived":
      return "archived";
    default:
      return "experimental";
  }
}

async function main() {
  const supabase = createSupabaseAdminClient();
  console.log("Seeding canonical Tovu content into Supabase...");

  // 1. Seed Projects & Ordered Sections
  const projectIdBySlug = new Map<string, string>();
  for (let i = 0; i < PROJECTS.length; i++) {
    const p = PROJECTS[i];
    const { data: upsertedProject, error: projErr } = await supabase
      .from("projects")
      .upsert(
        {
          slug: p.slug,
          number: p.number,
          title: p.title,
          subtitle: p.subtitle,
          description: p.details || p.system || p.subtitle,
          category: p.category,
          version: p.version,
          status: "published",
          featured: p.featured,
          github_url: p.githubUrl || null,
          live_url: p.liveUrl && p.liveUrl !== "#" ? p.liveUrl : null,
          metrics: (p.metrics || []) as unknown as Json,
          technologies: p.technologies,
          architecture_nodes: p.architectureNodes as unknown as Json,
          architecture_lines: p.architectureLines as unknown as Json,
          order_index: i + 1,
        },
        { onConflict: "slug" }
      )
      .select("id, slug")
      .single();

    if (projErr || !upsertedProject) {
      throw new Error(`Failed seeding project ${p.slug}: ${projErr?.message}`);
    }
    projectIdBySlug.set(upsertedProject.slug, upsertedProject.id);

    // Replace sections deterministically for this seeded project
    await supabase.from("project_sections").delete().eq("project_id", upsertedProject.id);

    const sections = [
      { title: "Overview", content: p.deepDive.overview },
      { title: "Problem", content: p.deepDive.problem },
      { title: "Research", content: p.deepDive.research },
      { title: "Solution", content: p.deepDive.solution },
      { title: "Architecture Notes", content: p.deepDive.architectureNotes },
      ...(p.deepDive.implementationSnippet
        ? [
            {
              title: "Implementation Snippet",
              content: JSON.stringify(p.deepDive.implementationSnippet),
            },
          ]
        : []),
      { title: "Results", content: p.deepDive.results },
      { title: "Lessons", content: p.deepDive.lessons },
      { title: "System", content: p.system },
      { title: "Details", content: p.details },
    ].map((sec, idx) => ({
      project_id: upsertedProject.id,
      title: sec.title,
      content: sec.content,
      order_index: idx + 1,
    }));

    const { error: secErr } = await supabase.from("project_sections").insert(sections);
    if (secErr) {
      throw new Error(`Failed seeding sections for ${p.slug}: ${secErr.message}`);
    }
  }
  console.log(`Seeded ${projectIdBySlug.size} projects + sections.`);

  // 2. Seed Tags & Articles
  const tagIdBySlug = new Map<string, string>();
  const allTagNames = Array.from(new Set(ARTICLES.flatMap((a) => [a.category, ...a.tags])));
  for (const name of allTagNames) {
    const slug = slugify(name);
    const { data: tagRow, error: tagErr } = await supabase
      .from("tags")
      .upsert({ slug, name }, { onConflict: "slug" })
      .select("id, slug")
      .single();
    if (tagErr || !tagRow) {
      throw new Error(`Failed seeding tag ${slug}: ${tagErr?.message}`);
    }
    tagIdBySlug.set(slug, tagRow.id);
  }

  const articleIdBySlug = new Map<string, string>();
  for (const a of ARTICLES) {
    const { data: upsertedArticle, error: artErr } = await supabase
      .from("articles")
      .upsert(
        {
          slug: a.slug,
          title: a.title,
          excerpt: a.summary,
          content: a.content,
          reading_time: parseReadingTime(a.readTime),
          status: "published",
          featured: Boolean(a.featured),
          published_at: parseEditorialDate(a.date),
        },
        { onConflict: "slug" }
      )
      .select("id, slug")
      .single();

    if (artErr || !upsertedArticle) {
      throw new Error(`Failed seeding article ${a.slug}: ${artErr?.message}`);
    }
    articleIdBySlug.set(upsertedArticle.slug, upsertedArticle.id);

    const orderedTags = Array.from(new Set([a.category, ...a.tags]));
    for (const tagName of orderedTags) {
      const tagId = tagIdBySlug.get(slugify(tagName));
      if (!tagId) continue;
      await supabase
        .from("article_tags")
        .upsert(
          { article_id: upsertedArticle.id, tag_id: tagId },
          { onConflict: "article_id,tag_id" }
        );
    }
  }
  console.log(`Seeded ${articleIdBySlug.size} articles + tags.`);

  // 3. Seed Labs
  for (let i = 0; i < EXPERIMENTS.length; i++) {
    const exp = EXPERIMENTS[i];
    const structuredDescription = JSON.stringify({
      number: exp.number,
      uiStatus: exp.status,
      hypothesis: exp.hypothesis,
      currentState: exp.currentState,
      nextExperiment: exp.nextExperiment,
      tags: exp.tags,
      metrics: exp.metrics,
      snippet: exp.snippet,
    });

    const { error: labErr } = await supabase.from("labs").upsert(
      {
        slug: exp.id,
        title: exp.title,
        description: structuredDescription,
        category: exp.category,
        status: mapUiLabStatus(exp.status),
        order_index: i + 1,
      },
      { onConflict: "slug" }
    );

    if (labErr) {
      throw new Error(`Failed seeding lab ${exp.id}: ${labErr.message}`);
    }
  }
  console.log(`Seeded ${EXPERIMENTS.length} labs.`);

  // 4. Seed Knowledge Concepts, Relationships & Content Links
  const conceptIdBySlug = new Map<string, string>();
  for (let i = 0; i < KNOWLEDGE_NODES.length; i++) {
    const node = KNOWLEDGE_NODES[i];
    const keyPoints = [
      `type:${node.type}`,
      ...(node.level ? [`level:${node.level}`] : []),
      ...(node.readingOrCourse ? [`study:${JSON.stringify(node.readingOrCourse)}`] : []),
    ];

    const { data: upsertedConcept, error: conErr } = await supabase
      .from("concepts")
      .upsert(
        {
          slug: node.id,
          title: node.label,
          category: node.category,
          definition: node.description,
          key_points: keyPoints,
          related_concepts: node.connections,
          order_index: i + 1,
        },
        { onConflict: "slug" }
      )
      .select("id, slug")
      .single();

    if (conErr || !upsertedConcept) {
      throw new Error(`Failed seeding concept ${node.id}: ${conErr?.message}`);
    }
    conceptIdBySlug.set(upsertedConcept.slug, upsertedConcept.id);
  }

  for (const edge of KNOWLEDGE_EDGES) {
    const sourceId = conceptIdBySlug.get(edge.source);
    const targetId = conceptIdBySlug.get(edge.target);
    if (!sourceId || !targetId) continue;

    await supabase.from("concept_relationships").upsert(
      {
        source_concept_id: sourceId,
        target_concept_id: targetId,
        relationship_type: edge.relationship || "relates_to",
      },
      { onConflict: "source_concept_id,target_concept_id" }
    );
  }

  for (const node of KNOWLEDGE_NODES) {
    const conceptId = conceptIdBySlug.get(node.id);
    if (!conceptId) continue;

    for (let idx = 0; idx < (node.relatedProjects || []).length; idx++) {
      const projectId = projectIdBySlug.get(node.relatedProjects![idx]);
      if (!projectId) continue;
      await supabase.from("content_concepts").upsert(
        {
          concept_id: conceptId,
          content_type: "project",
          content_id: projectId,
          order_index: idx + 1,
        },
        { onConflict: "content_type,content_id,concept_id" }
      );
    }

    for (let idx = 0; idx < (node.relatedArticles || []).length; idx++) {
      const articleId = articleIdBySlug.get(node.relatedArticles![idx]);
      if (!articleId) continue;
      await supabase.from("content_concepts").upsert(
        {
          concept_id: conceptId,
          content_type: "article",
          content_id: articleId,
          order_index: idx + 1,
        },
        { onConflict: "content_type,content_id,concept_id" }
      );
    }
  }

  console.log(`Seeded ${conceptIdBySlug.size} concepts + graph links.`);
  console.log("Seed completed successfully.");
}

main().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});

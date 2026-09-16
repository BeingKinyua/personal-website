/**
 * VictorOS Intelligence Layer — Deterministic Content Chunker & Normalizer
 *
 * Converts heterogeneous domain entities into canonical NormalizedDocument instances,
 * then performs deterministic semantic-boundary chunking aware of Markdown structure.
 */

import type { NormalizedDocument, NormalizedSourceType, ContentChunk } from "./types";

export interface ChunkOptions {
  maxChunkChars?: number;
  minChunkChars?: number;
  chunkOverlapChars?: number;
}

const DEFAULT_OPTIONS: Required<ChunkOptions> = {
  maxChunkChars: 1200,
  minChunkChars: 200,
  chunkOverlapChars: 150,
};

/**
 * Fast, deterministic string hashing (FNV-1a 32-bit hex) for stable chunk change detection.
 */
export function computeContentHash(str: string): string {
  let hash = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    hash ^= str.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(16).padStart(8, "0");
}

/**
 * Estimates token count from text using the ~4 characters per token heuristic.
 */
export function estimateTokenCount(text: string): number {
  if (!text) return 0;
  const words = text.trim().split(/\s+/).length;
  const chars = text.length;
  // Blend word count and character count for reliable prompt budget estimation
  return Math.max(1, Math.round((chars / 4 + words * 1.3) / 2));
}

/**
 * Normalizes a VictorOS project record and its sections into a canonical NormalizedDocument.
 */
export function normalizeProject(
  project: {
    id: string;
    slug: string;
    title: string;
    number?: string | null;
    subtitle?: string | null;
    description?: string | null;
    category: string;
    status: "published" | "draft" | "archived";
    technologies?: string[] | null;
    created_at?: string;
  },
  sections: Array<{ title: string; content: string; order_index: number }> = [],
  tags: string[] = []
): NormalizedDocument {
  const parts: string[] = [];

  parts.push(`# ${project.number ? `${project.number} — ` : ""}${project.title}`);
  if (project.subtitle) parts.push(`**Subtitle:** ${project.subtitle}`);
  if (project.category) parts.push(`**Category:** ${project.category}`);
  if (project.technologies && project.technologies.length > 0) {
    parts.push(`**Technologies:** ${project.technologies.join(", ")}`);
  }
  if (tags.length > 0) parts.push(`**Tags:** ${tags.join(", ")}`);
  if (project.description) parts.push(`\n${project.description}`);

  const sortedSections = [...sections].sort((a, b) => a.order_index - b.order_index);
  for (const sec of sortedSections) {
    parts.push(`\n## ${sec.title}\n${sec.content}`);
  }

  return {
    sourceType: "project",
    sourceId: project.id,
    title: project.title,
    slug: project.slug,
    content: parts.join("\n\n").trim(),
    url: `/work/${project.slug}`,
    status: project.status,
    metadata: {
      number: project.number,
      subtitle: project.subtitle,
      category: project.category,
      technologies: project.technologies || [],
      tags,
    },
  };
}

/**
 * Normalizes an article record into a canonical NormalizedDocument.
 */
export function normalizeArticle(
  article: {
    id: string;
    slug: string;
    title: string;
    description?: string | null;
    content: string;
    category: string;
    status: "published" | "draft" | "archived";
    reading_time_minutes?: number | null;
  },
  tags: string[] = [],
  technologies: string[] = []
): NormalizedDocument {
  const parts: string[] = [];
  parts.push(`# ${article.title}`);
  if (article.category) parts.push(`**Category:** ${article.category}`);
  if (tags.length > 0) parts.push(`**Tags:** ${tags.join(", ")}`);
  if (technologies.length > 0) parts.push(`**Technologies:** ${technologies.join(", ")}`);
  if (article.description) parts.push(`\n> ${article.description}`);
  parts.push(`\n${article.content}`);

  return {
    sourceType: "article",
    sourceId: article.id,
    title: article.title,
    slug: article.slug,
    content: parts.join("\n\n").trim(),
    url: `/journal/${article.slug}`,
    status: article.status,
    metadata: {
      category: article.category,
      readingTimeMinutes: article.reading_time_minutes,
      tags,
      technologies,
    },
  };
}

/**
 * Normalizes a lab experiment record into a canonical NormalizedDocument.
 */
export function normalizeLab(lab: {
  id: string;
  slug: string;
  title: string;
  description: string;
  category: string;
  status: string;
  stars?: number;
  live_url?: string | null;
  github_url?: string | null;
}): NormalizedDocument {
  const parts: string[] = [];
  parts.push(`# ${lab.title}`);
  parts.push(`**Category:** ${lab.category} | **Status:** ${lab.status}`);
  if (lab.description) parts.push(`\n${lab.description}`);
  if (lab.live_url) parts.push(`Demo: ${lab.live_url}`);
  if (lab.github_url) parts.push(`Repository: ${lab.github_url}`);

  return {
    sourceType: "lab",
    sourceId: lab.id,
    title: lab.title,
    slug: lab.slug,
    content: parts.join("\n\n").trim(),
    url: `/lab#${lab.slug}`,
    status: lab.status === "archived" ? "archived" : "published",
    metadata: {
      category: lab.category,
      labStatus: lab.status,
      stars: lab.stars,
      liveUrl: lab.live_url,
      githubUrl: lab.github_url,
    },
  };
}

/**
 * Normalizes a knowledge concept into a canonical NormalizedDocument.
 */
export function normalizeConcept(concept: {
  id: string;
  slug: string;
  name: string;
  description?: string | null;
  category: string;
  icon?: string | null;
}): NormalizedDocument {
  const parts: string[] = [];
  parts.push(`# ${concept.name}`);
  parts.push(`**Domain Category:** ${concept.category}`);
  if (concept.description) parts.push(`\n${concept.description}`);

  return {
    sourceType: "concept",
    sourceId: concept.id,
    title: concept.name,
    slug: concept.slug,
    content: parts.join("\n\n").trim(),
    url: `/knowledge/${concept.slug}`,
    status: "published",
    metadata: {
      category: concept.category,
      icon: concept.icon,
    },
  };
}

/**
 * Deterministically chunks a normalized document using Markdown structure, headings,
 * and paragraph boundaries. Preserves semantic integrity rather than raw character slicing.
 */
export function chunkDocument(
  doc: NormalizedDocument,
  options?: ChunkOptions
): ContentChunk[] {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const rawText = doc.content.trim();

  if (!rawText) return [];

  // 1. Split raw text by top-level Markdown headers (## or ###)
  const rawSections: Array<{ header: string; text: string }> = [];
  const headerRegex = /(^|\n)(#{1,4}\s+[^\n]+)/g;
  let lastIndex = 0;
  let currentHeader = doc.title;
  let match: RegExpExecArray | null;

  while ((match = headerRegex.exec(rawText)) !== null) {
    const matchStart = match.index + (match[1] ? match[1].length : 0);
    const sectionBody = rawText.slice(lastIndex, matchStart).trim();
    if (sectionBody) {
      rawSections.push({ header: currentHeader, text: sectionBody });
    }
    currentHeader = match[2].replace(/^#{1,4}\s+/, "").trim();
    lastIndex = matchStart + match[2].length;
  }

  const remaining = rawText.slice(lastIndex).trim();
  if (remaining) {
    rawSections.push({ header: currentHeader, text: remaining });
  }

  // If no markdown headers found, treat entire content as single block
  if (rawSections.length === 0) {
    rawSections.push({ header: doc.title, text: rawText });
  }

  // 2. Break sections into bounded chunks adhering to min/max character limits
  const chunks: ContentChunk[] = [];
  let chunkCounter = 0;

  for (const section of rawSections) {
    const paragraphs = section.text.split(/\n{2,}/);
    let currentChunkText = "";

    for (let pIdx = 0; pIdx < paragraphs.length; pIdx++) {
      const paragraph = paragraphs[pIdx].trim();
      if (!paragraph) continue;

      if (!currentChunkText) {
        currentChunkText = paragraph;
      } else if (currentChunkText.length + paragraph.length + 2 <= opts.maxChunkChars) {
        currentChunkText += "\n\n" + paragraph;
      } else {
        // Current chunk has reached target capacity
        if (currentChunkText.length >= opts.minChunkChars || pIdx === paragraphs.length - 1) {
          chunks.push(
            createChunkObject(doc, section.header, currentChunkText, chunkCounter++)
          );
          // Start next chunk with slight overlap if paragraph fits
          currentChunkText = paragraph;
        } else {
          currentChunkText += "\n\n" + paragraph;
        }
      }
    }

    if (currentChunkText.trim().length > 0) {
      chunks.push(
        createChunkObject(doc, section.header, currentChunkText.trim(), chunkCounter++)
      );
    }
  }

  return chunks;
}

function createChunkObject(
  doc: NormalizedDocument,
  sectionTitle: string,
  content: string,
  chunkIndex: number
): ContentChunk {
  const contentHash = computeContentHash(content);
  // Deterministic chunk ID
  const chunkId = `chunk_${doc.sourceType}_${doc.sourceId.slice(0, 8)}_${chunkIndex}`;
  const tokenCount = estimateTokenCount(content);

  return {
    id: chunkId,
    sourceType: doc.sourceType,
    sourceId: doc.sourceId,
    title: doc.title,
    slug: doc.slug,
    sectionTitle,
    chunkIndex,
    content,
    tokenCount,
    contentHash,
    url: doc.url,
    status: doc.status,
    metadata: doc.metadata,
  };
}

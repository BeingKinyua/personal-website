/**
 * VictorOS Intelligence Layer — Dr. Doom Context Assembly
 * Formats grounded evidence and conversation history into a bounded, deterministic prompt.
 */

import type { EvidenceItem } from "./retrieval";
import type { IntentClassification } from "./intent";
import { estimateTokenCount } from "../embeddings/chunker";

export interface ContextAssemblyOptions {
  maxPromptTokens?: number;
}

export interface ConversationTurn {
  role: "user" | "assistant";
  content: string;
}

export function assembleDoomPrompt(
  query: string,
  classification: IntentClassification,
  evidence: EvidenceItem[],
  history: ConversationTurn[] = [],
  options: ContextAssemblyOptions = {}
): string {
  const maxTokens = options.maxPromptTokens ?? 2800;
  const parts: string[] = [];

  parts.push("=== VICTOROS SYSTEM CONTEXT ===");
  parts.push("Subject: Victor Kinyua (Software Architect & Full-Stack Systems Engineer)");
  parts.push("Platform: VictorOS (Operating System of Victor)");
  parts.push(`Detected Intent: ${classification.intent} (Confidence: ${classification.confidence})`);
  parts.push("");

  // 1. Evidence Blocks
  if (evidence.length > 0) {
    parts.push("=== VERIFIED SOURCE EVIDENCE ===");
    parts.push(
      "The following evidence records have been retrieved directly from VictorOS's database and vector index. Base your answer strictly on these facts:"
    );
    parts.push("");

    let currentTokens = estimateTokenCount(parts.join("\n"));

    for (let i = 0; i < evidence.length; i++) {
      const item = evidence[i];
      const block = [
        `[EVIDENCE ${i + 1}] [${item.sourceType.toUpperCase()}] ${item.title} (URL: ${item.url})`,
        item.sectionTitle ? `Section: ${item.sectionTitle}` : null,
        `Content: ${item.content}`,
        "",
      ]
        .filter(Boolean)
        .join("\n");

      const blockTokens = estimateTokenCount(block);
      if (currentTokens + blockTokens > maxTokens) {
        parts.push(`[...remaining ${evidence.length - i} evidence items truncated for token budget...]`);
        break;
      }

      parts.push(block);
      currentTokens += blockTokens;
    }
  } else {
    parts.push("=== VERIFIED SOURCE EVIDENCE ===");
    parts.push("No direct evidence items matched the query above confidence threshold.");
    parts.push("");
  }

  // 2. Recent Conversation History (bounded to last 4 turns)
  if (history.length > 0) {
    parts.push("=== RECENT CONVERSATION HISTORY ===");
    const recent = history.slice(-4);
    for (const turn of recent) {
      parts.push(`${turn.role === "user" ? "USER" : "DR. DOOM"}: ${turn.content}`);
    }
    parts.push("");
  }

  // 3. User Query & Output Schema Instructions
  parts.push("=== INCOMING QUERY ===");
  parts.push(`USER QUERY: ${query}`);
  parts.push("");
  parts.push("=== OUTPUT FORMAT REQUIREMENT ===");
  parts.push(
    "Respond with a single JSON object adhering strictly to the schema:\n" +
      JSON.stringify(
        {
          message: "Concise, authoritative, slightly theatrical response adhering to retrieved evidence.",
          references: [
            {
              type: "project | article | lab | concept | knowledge",
              id: "slug or identifier",
              title: "Display title",
              slug: "url slug",
              badge: "Category badge",
            },
          ],
          actions: [
            {
              label: "Action button label",
              action: "open_project | open_article | open_lab | open_concept | navigate",
              target: "slug or section id ('work', 'journal', 'lab', 'knowledge')",
            },
          ],
          intent: classification.intent,
        },
        null,
        2
      )
  );

  return parts.join("\n");
}

import React, { useState } from "react";
import { Network, BookOpen, FolderKanban, ArrowRight, ExternalLink, Cpu, Layers } from "lucide-react";
import { KNOWLEDGE_NODES, KNOWLEDGE_EDGES } from "../../data/knowledge";
import { KnowledgeNode } from "../../types/knowledge";
import { TextReveal } from "../motion/TextReveal";
import { WordReveal } from "../motion/WordReveal";
import { HighlightText } from "../motion/HighlightText";
import { ParallaxBackgroundText } from "../motion/ParallaxBackgroundText";

interface KnowledgeSectionProps {
  onOpenProject: (slug: string) => void;
  onOpenArticle: (slug: string) => void;
}

export const KnowledgeSection: React.FC<KnowledgeSectionProps> = ({
  onOpenProject,
  onOpenArticle
}) => {
  const [selectedNode, setSelectedNode] = useState<KnowledgeNode>(KNOWLEDGE_NODES[0]);
  const [categoryFilter, setCategoryFilter] = useState<string>("ALL");

  const categories = ["ALL", "AI & ML", "Systems & Infrastructure", "Data & Storage", "Product & Design"];

  const filteredNodes = categoryFilter === "ALL"
    ? KNOWLEDGE_NODES
    : KNOWLEDGE_NODES.filter((n) => n.category === categoryFilter);

  // Find connected nodes
  const connectedNodes = KNOWLEDGE_NODES.filter(
    (n) => selectedNode.connections.includes(n.id) || n.connections.includes(selectedNode.id)
  );

  return (
    <section id="knowledge" className="relative py-24 px-4 sm:px-6 max-w-7xl mx-auto text-zinc-100 overflow-hidden">
      {/* Architectural Background Typography Parallax */}
      <ParallaxBackgroundText className="text-[14vw] absolute top-6 right-6 z-0" triggerId="knowledge">
        LATTICE
      </ParallaxBackgroundText>

      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10 relative z-10">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="w-2 h-2 rounded-full bg-indigo-400" />
            <span className="text-xs font-mono tracking-widest text-zinc-400 uppercase">
              KNOWLEDGE // CONCEPT LATTICE
            </span>
          </div>
          <TextReveal
            as="h2"
            trigger="scroll"
            duration={0.9}
            className="text-3xl sm:text-4xl font-mono font-medium text-white tracking-tight"
          >
            Interconnected Systems &amp; Mental Models
          </TextReveal>
        </div>
        <WordReveal
          trigger="scroll"
          delay={0.2}
          className="text-sm text-zinc-400 max-w-md font-normal"
        >
          Ideas do not exist in isolation. This lattice maps the causal connections between distributed primitives, vector mathematics, foundational books, and AI engineering.
        </WordReveal>
      </div>

      {/* Category Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-8 scrollbar-none relative z-10">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setCategoryFilter(cat)}
            className={`px-3 py-1 rounded-full text-xs font-mono tracking-wider transition-all cursor-pointer ${
              categoryFilter === cat
                ? "bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-semibold"
                : "bg-white/5 text-zinc-400 hover:text-white border border-white/5"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* 2-Column Lattice Explorer: Nodes Grid + Dossier Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 relative z-10">
        {/* Left: Interactive Nodes Grid */}
        <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-3.5 max-h-[640px] overflow-y-auto p-1 scrollbar-thin">
          {filteredNodes.map((node) => {
            const isSelected = selectedNode.id === node.id;
            return (
              <div
                key={node.id}
                id={`knowledge-node-${node.id}`}
                onClick={() => setSelectedNode(node)}
                className={`p-4 rounded-2xl border transition-all duration-200 cursor-pointer flex flex-col justify-between ${
                  isSelected
                    ? "bg-indigo-500/15 border-indigo-400/50 shadow-[0_0_20px_rgba(99,102,241,0.2)] text-white"
                    : "bg-[#0c0e11] border-white/5 hover:border-white/20 text-zinc-300 hover:bg-[#111418]"
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded bg-white/5 text-zinc-400">
                      {node.category}
                    </span>
                    <span className="text-[10px] font-mono text-zinc-500">
                      {node.type}
                    </span>
                  </div>

                  <h3 className="text-base font-mono font-medium mb-1.5">
                    {node.label}
                  </h3>

                  <p className="text-xs text-zinc-400 line-clamp-2 leading-relaxed">
                    {node.description}
                  </p>
                </div>

                <div className="flex items-center justify-between pt-3 mt-2 border-t border-white/5 text-[11px] font-mono text-zinc-500">
                  <span>{node.connections.length} links</span>
                  <span className="text-indigo-400 flex items-center gap-0.5">
                    Inspect <ArrowRight className="w-3 h-3" />
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Right: Selected Concept Dossier */}
        <div className="lg:col-span-5 rounded-3xl border border-white/10 bg-[#0d0f13] p-6 sm:p-8 flex flex-col justify-between shadow-2xl relative overflow-hidden">
          <div className="space-y-6">
            <div>
              <div className="flex items-center gap-2 mb-2 text-xs font-mono text-indigo-400 uppercase tracking-widest">
                <Layers className="w-3.5 h-3.5" />
                <span>CONCEPT DOSSIER // {selectedNode.level || "SYSTEM ARCHETYPE"}</span>
              </div>
              <h3 className="text-2xl sm:text-3xl font-mono text-white mb-2">
                {selectedNode.label}
              </h3>
              <p className="text-xs font-mono text-zinc-500 uppercase">
                {selectedNode.category} · TYPE: {selectedNode.type}
              </p>
            </div>

            <p className="text-sm text-zinc-300 leading-relaxed pt-2 border-t border-white/10">
              {selectedNode.description}
            </p>

            {/* Reading / Course details if present */}
            {selectedNode.readingOrCourse && (
              <div className="p-4 rounded-xl border border-indigo-500/20 bg-indigo-500/5 space-y-2">
                <div className="text-xs font-mono text-indigo-300 font-semibold">
                  BOOK / SOURCE STUDY NOTE
                </div>
                <div className="text-xs text-zinc-400">
                  Author: <span className="text-zinc-200">{selectedNode.readingOrCourse.author}</span>
                </div>
                <div className="text-xs text-zinc-400">
                  Status: <span className="text-emerald-400">{selectedNode.readingOrCourse.progress}</span>
                </div>
                <p className="text-xs text-zinc-300 italic pt-1">
                  &ldquo;{selectedNode.readingOrCourse.keyTakeaway}&rdquo;
                </p>
              </div>
            )}

            {/* Direct Cross-Links: Related Systems / Articles */}
            <div className="space-y-3 pt-4 border-t border-white/10">
              <span className="text-xs font-mono uppercase text-zinc-500 tracking-wider block">
                Direct Cross-Links in VictorOS
              </span>

              {selectedNode.relatedProjects && selectedNode.relatedProjects.length > 0 && (
                <div className="space-y-1.5">
                  <span className="text-[11px] font-mono text-blue-400 flex items-center gap-1">
                    <FolderKanban className="w-3 h-3" /> Related Work Systems:
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {selectedNode.relatedProjects.map((slug) => (
                      <button
                        key={slug}
                        onClick={() => onOpenProject(slug)}
                        className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-mono text-zinc-300 hover:text-white transition-colors cursor-pointer flex items-center gap-1"
                      >
                        <span>{slug}</span>
                        <ExternalLink className="w-3 h-3 text-zinc-500" />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {selectedNode.relatedArticles && selectedNode.relatedArticles.length > 0 && (
                <div className="space-y-1.5 pt-1">
                  <span className="text-[11px] font-mono text-amber-400 flex items-center gap-1">
                    <BookOpen className="w-3 h-3" /> Related Journal Essays:
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {selectedNode.relatedArticles.map((slug) => (
                      <button
                        key={slug}
                        onClick={() => onOpenArticle(slug)}
                        className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-mono text-zinc-300 hover:text-white transition-colors cursor-pointer flex items-center gap-1"
                      >
                        <span>{slug}</span>
                        <ExternalLink className="w-3 h-3 text-zinc-500" />
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Connected Concepts */}
            <div className="space-y-2 pt-4 border-t border-white/10">
              <span className="text-xs font-mono uppercase text-zinc-500 tracking-wider block">
                Connected Lattice Neighbors ({connectedNodes.length})
              </span>
              <div className="flex flex-wrap gap-1.5">
                {connectedNodes.map((n) => (
                  <button
                    key={n.id}
                    onClick={() => setSelectedNode(n)}
                    className="px-2.5 py-1 rounded-full text-xs font-mono bg-white/5 hover:bg-indigo-500/20 text-zinc-400 hover:text-indigo-300 border border-white/5 hover:border-indigo-500/30 transition-all cursor-pointer"
                  >
                    {n.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

import React, { useEffect, useState } from "react";
import { BookOpen, FolderKanban, ArrowRight, ExternalLink, RefreshCw } from "lucide-react";
import { useKnowledgeGraphData } from "../../hooks/useContentData";
import type { KnowledgeNode } from "../../types/knowledge";

interface KnowledgeSectionProps {
  onOpenProject: (slug: string) => void;
  onOpenArticle: (slug: string) => void;
}

const CATEGORIES = [
  "ALL",
  "AI & ML",
  "Systems & Infrastructure",
  "Data & Storage",
  "Product & Design",
];

export const KnowledgeSection: React.FC<KnowledgeSectionProps> = ({
  onOpenProject,
  onOpenArticle,
}) => {
  const { data: graph, loading, error, isFixture, reload } = useKnowledgeGraphData();
  const nodes = graph.nodes;
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<string>("ALL");

  useEffect(() => {
    if (nodes.length > 0 && (!selectedNodeId || !nodes.some((n) => n.id === selectedNodeId))) {
      setSelectedNodeId(nodes[0].id);
    }
  }, [nodes, selectedNodeId]);

  const filteredNodes =
    categoryFilter === "ALL"
      ? nodes
      : nodes.filter((n) => n.category === categoryFilter);

  const selectedNode: KnowledgeNode | null =
    nodes.find((n) => n.id === selectedNodeId) || filteredNodes[0] || nodes[0] || null;

  const connectedNodes = selectedNode
    ? nodes.filter(
        (n) =>
          n.id !== selectedNode.id &&
          (selectedNode.connections.includes(n.id) || n.connections.includes(selectedNode.id))
      )
    : [];

  return (
    <section
      id="knowledge"
      className="relative py-24 sm:py-32 px-5 sm:px-8 lg:px-10 max-w-7xl mx-auto text-[var(--tovu-text-primary)] border-t border-[var(--tovu-border-hairline)]"
    >
      {/* Section Header */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-12">
        <div>
          <p className="text-[13px] font-mono tracking-[0.14em] uppercase text-[var(--tovu-accent)] mb-3">
            04 · Knowledge Lattice
            {isFixture && (
              <span className="ml-3 text-[12px] tracking-[0.06em] text-[var(--tovu-text-muted)]">
                (Dev Fixture Mode)
              </span>
            )}
          </p>
          <h2 className="font-display font-semibold tracking-[-0.025em] text-[var(--tovu-text-primary)] leading-[1.06] text-[clamp(2.25rem,4.4vw,4rem)]">
            Systems &amp; Mental Models
          </h2>
        </div>

        <p className="text-[17px] text-[var(--tovu-text-secondary)] max-w-md leading-[1.6]">
          Ideas do not exist in isolation. Select any concept to trace its connections across architecture, research, and essays.
        </p>
      </div>

      {/* Category Filter Tabs */}
      <div
        role="tablist"
        aria-label="Filter knowledge concepts by category"
        className="inline-flex flex-wrap items-center gap-1.5 p-1.5 rounded-xl bg-[var(--tovu-bg-surface)] border border-[var(--tovu-border-hairline)] mb-10"
      >
        {CATEGORIES.map((cat) => {
          const isActive = categoryFilter === cat;
          return (
            <button
              key={cat}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => setCategoryFilter(cat)}
              className={`min-h-[40px] px-4 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--tovu-accent)] ${
                isActive
                  ? "bg-[var(--tovu-text-primary)] text-[var(--tovu-bg-canvas)] shadow-sm"
                  : "text-[var(--tovu-text-muted)] hover:text-[var(--tovu-text-primary)]"
              }`}
            >
              {cat === "ALL" ? "All Concepts" : cat}
            </button>
          );
        })}
      </div>

      {/* Loading State */}
      {loading && (
        <div aria-busy="true" aria-label="Loading knowledge graph" className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start animate-pulse">
          <div className="lg:col-span-6 grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {[0, 1, 2, 3].map((idx) => (
              <div
                key={idx}
                className="h-44 rounded-2xl border border-[var(--tovu-border-hairline)] bg-[var(--tovu-bg-surface)]"
              />
            ))}
          </div>
          <div className="lg:col-span-6 h-80 rounded-2xl border border-[var(--tovu-border-hairline)] bg-[var(--tovu-bg-surface)]" />
        </div>
      )}

      {/* Error State */}
      {!loading && error && (
        <div className="rounded-2xl border border-[var(--tovu-border-hairline)] bg-[var(--tovu-bg-surface)] p-8 sm:p-10 max-w-2xl space-y-4">
          <p className="text-[13px] font-mono uppercase tracking-wider text-[var(--tovu-accent)]">
            Knowledge Graph Unavailable
          </p>
          <p className="text-base sm:text-[17px] text-[var(--tovu-text-secondary)] leading-relaxed">
            {error}
          </p>
          <button
            type="button"
            onClick={reload}
            className="min-h-[44px] inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[var(--tovu-text-primary)] text-[var(--tovu-bg-canvas)] text-sm font-medium cursor-pointer hover:opacity-90 transition-opacity"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Retry</span>
          </button>
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && nodes.length === 0 && (
        <div className="rounded-2xl border border-[var(--tovu-border-hairline)] bg-[var(--tovu-bg-surface)] p-8 sm:p-10 max-w-2xl space-y-2">
          <p className="text-[13px] font-mono uppercase tracking-wider text-[var(--tovu-text-muted)]">
            No Concepts Indexed
          </p>
          <p className="text-base text-[var(--tovu-text-secondary)]">
            No concepts have been published in the knowledge lattice yet.
          </p>
        </div>
      )}

      {/* 2-Column Workbench: Accessible Concept Tiles + Sticky Concept Dossier */}
      {!loading && !error && selectedNode && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left: Concept Tiles */}
          <div className="lg:col-span-6 grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {filteredNodes.map((node) => {
              const isSelected = selectedNode.id === node.id;
              return (
                <button
                  key={node.id}
                  id={`knowledge-node-${node.id}`}
                  type="button"
                  aria-pressed={isSelected}
                  onClick={() => setSelectedNodeId(node.id)}
                  className={`p-5 rounded-2xl border text-left transition-colors duration-200 cursor-pointer flex flex-col justify-between gap-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--tovu-accent)] ${
                    isSelected
                      ? "bg-[var(--tovu-accent-soft)] border-[var(--tovu-accent-border)] text-[var(--tovu-text-primary)]"
                      : "bg-[var(--tovu-bg-surface)] border-[var(--tovu-border-hairline)] hover:border-[var(--tovu-border-strong)] text-[var(--tovu-text-secondary)]"
                  }`}
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-2 text-[13px] font-mono text-[var(--tovu-text-muted)]">
                      <span className="truncate">{node.category}</span>
                      <span className="shrink-0">{node.type}</span>
                    </div>

                    <h3 className="font-display text-lg font-semibold text-[var(--tovu-text-primary)] leading-snug">
                      {node.label}
                    </h3>

                    <p className="text-[14px] text-[var(--tovu-text-secondary)] line-clamp-2 leading-relaxed">
                      {node.description}
                    </p>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-[var(--tovu-border-hairline)] text-[13px] font-mono">
                    <span className="text-[var(--tovu-text-muted)] tabular-nums">
                      {node.connections.length} links
                    </span>
                    <span className="inline-flex items-center gap-1 text-[var(--tovu-accent)] font-medium">
                      <span>Inspect</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Right: Sticky Concept Dossier */}
          <aside
            aria-label="Selected concept details"
            className="lg:col-span-6 lg:sticky lg:top-28 rounded-2xl border border-[var(--tovu-border-hairline)] bg-[var(--tovu-bg-surface)] p-7 sm:p-9 space-y-6"
          >
            <div className="space-y-2.5">
              <div className="flex flex-wrap items-center gap-2 text-[13px] font-mono text-[var(--tovu-accent)] uppercase tracking-wider">
                <span>{selectedNode.level || "Concept"}</span>
                <span aria-hidden="true" className="text-[var(--tovu-border-strong)]">·</span>
                <span className="text-[var(--tovu-text-muted)]">{selectedNode.category}</span>
              </div>

              <h3 className="font-display font-semibold tracking-tight text-[var(--tovu-text-primary)] text-[clamp(1.625rem,2.4vw,2.25rem)] leading-[1.15]">
                {selectedNode.label}
              </h3>
            </div>

            <p className="text-[17px] text-[var(--tovu-text-secondary)] leading-[1.65] pt-5 border-t border-[var(--tovu-border-hairline)]">
              {selectedNode.description}
            </p>

            {/* Study Note */}
            {selectedNode.readingOrCourse && (
              <div className="p-5 rounded-xl border border-[var(--tovu-accent-border)] bg-[var(--tovu-accent-soft)] space-y-2">
                <div className="text-[13px] font-mono uppercase tracking-wider text-[var(--tovu-accent)] font-semibold">
                  Source Study Note
                </div>
                <div className="text-sm text-[var(--tovu-text-secondary)] flex flex-wrap gap-x-4 gap-y-1">
                  <span>
                    Author: <strong className="text-[var(--tovu-text-primary)] font-medium">{selectedNode.readingOrCourse.author}</strong>
                  </span>
                  <span>
                    Progress: <strong className="text-[var(--tovu-accent)] font-medium">{selectedNode.readingOrCourse.progress}</strong>
                  </span>
                </div>
                <p className="text-[15px] text-[var(--tovu-text-primary)] italic leading-relaxed pt-1">
                  &ldquo;{selectedNode.readingOrCourse.keyTakeaway}&rdquo;
                </p>
              </div>
            )}

            {/* Cross-Links to Work & Journal */}
            {(selectedNode.relatedProjects?.length || selectedNode.relatedArticles?.length) ? (
              <div className="space-y-4 pt-5 border-t border-[var(--tovu-border-hairline)]">
                <h4 className="text-[13px] font-mono uppercase tracking-wider text-[var(--tovu-text-muted)]">
                  Related Work &amp; Writing
                </h4>

                <div className="flex flex-wrap gap-2.5">
                  {selectedNode.relatedProjects?.map((slug) => (
                    <button
                      key={slug}
                      type="button"
                      onClick={() => onOpenProject(slug)}
                      className="min-h-[40px] px-4 py-2 rounded-xl bg-[var(--tovu-bg-elevated)] hover:border-[var(--tovu-accent-border)] border border-[var(--tovu-border-hairline)] text-sm font-mono text-[var(--tovu-text-primary)] transition-colors cursor-pointer inline-flex items-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--tovu-accent)]"
                    >
                      <FolderKanban className="w-4 h-4 text-[var(--tovu-accent)]" />
                      <span>{slug}</span>
                      <ExternalLink className="w-3.5 h-3.5 text-[var(--tovu-text-muted)]" />
                    </button>
                  ))}

                  {selectedNode.relatedArticles?.map((slug) => (
                    <button
                      key={slug}
                      type="button"
                      onClick={() => onOpenArticle(slug)}
                      className="min-h-[40px] px-4 py-2 rounded-xl bg-[var(--tovu-bg-elevated)] hover:border-[var(--tovu-accent-border)] border border-[var(--tovu-border-hairline)] text-sm font-mono text-[var(--tovu-text-primary)] transition-colors cursor-pointer inline-flex items-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--tovu-accent)]"
                    >
                      <BookOpen className="w-4 h-4 text-[var(--tovu-accent)]" />
                      <span>{slug}</span>
                      <ExternalLink className="w-3.5 h-3.5 text-[var(--tovu-text-muted)]" />
                    </button>
                  ))}
                </div>
              </div>
            ) : null}

            {/* Connected Lattice Neighbors */}
            <div className="space-y-3 pt-5 border-t border-[var(--tovu-border-hairline)]">
              <h4 className="text-[13px] font-mono uppercase tracking-wider text-[var(--tovu-text-muted)] tabular-nums">
                Connected Concepts ({connectedNodes.length})
              </h4>
              <div className="flex flex-wrap gap-2">
                {connectedNodes.map((n) => (
                  <button
                    key={n.id}
                    type="button"
                    onClick={() => setSelectedNodeId(n.id)}
                    className="min-h-[40px] px-3.5 py-2 rounded-xl text-sm font-medium bg-[var(--tovu-bg-elevated)] hover:border-[var(--tovu-accent-border)] text-[var(--tovu-text-secondary)] hover:text-[var(--tovu-text-primary)] border border-[var(--tovu-border-hairline)] transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--tovu-accent)]"
                  >
                    {n.label}
                  </button>
                ))}
              </div>
            </div>
          </aside>
        </div>
      )}
    </section>
  );
};

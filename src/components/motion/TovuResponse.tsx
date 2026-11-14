import React, { useRef } from "react";
import { useTovuReveal } from "../../hooks/motion/useTovuReveal";
import { TovuAction, TovuReference } from "../../types/tovu";
import { ArrowRight, Terminal, BookOpen, Layers } from "lucide-react";

export interface TovuResponseProps {
  message: string;
  references?: TovuReference[];
  actions?: TovuAction[];
  onOpenProject?: (slug: string) => void;
  onOpenArticle?: (slug: string) => void;
  onNavigate?: (sectionId: string) => void;
}

export const TovuResponse: React.FC<TovuResponseProps> = ({
  message,
  references = [],
  actions = [],
  onOpenProject,
  onOpenArticle,
  onNavigate,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useTovuReveal(containerRef);

  const lines = message.split("\n").filter((l) => l.trim().length > 0);

  return (
    <div ref={containerRef} className="space-y-4">
      <div className="flex items-center justify-between pb-2 border-b border-[var(--tovu-border-hairline)]">
        <span className="tovu-identity doom-identity text-[13px] font-mono font-semibold text-[var(--tovu-accent)] tracking-wider uppercase">
          Tovu
        </span>
      </div>

      <div className="space-y-2.5 text-[15px] sm:text-base text-[var(--tovu-text-primary)] leading-[1.65]">
        {lines.map((line, idx) => (
          <div key={idx} className="overflow-hidden">
            <p className="tovu-thought-line doom-thought-line will-change-transform">
              {line}
            </p>
          </div>
        ))}
      </div>

      {references.length > 0 && (
        <div className="pt-2 space-y-2.5">
          <span className="text-[13px] font-mono text-[var(--tovu-text-muted)] tracking-wider uppercase block">
            Sources
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {references.map((ref, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  if (ref.type === "project" && onOpenProject) {
                    onOpenProject(ref.slug);
                  } else if (ref.type === "article" && onOpenArticle) {
                    onOpenArticle(ref.slug);
                  } else if (onNavigate) {
                    onNavigate(ref.type === "concept" ? "knowledge" : ref.type);
                  }
                }}
                className="tovu-info-card doom-info-card text-left p-3 rounded-xl bg-[var(--tovu-bg-elevated)] border border-[var(--tovu-border-hairline)] hover:border-[var(--tovu-accent-border)] transition-colors cursor-pointer group flex items-start gap-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--tovu-accent)]"
              >
                <div className="mt-0.5 p-1.5 rounded-lg bg-[var(--tovu-bg-surface)] text-[var(--tovu-accent)] shrink-0">
                  {ref.type === "project" && <Terminal className="w-4 h-4" />}
                  {ref.type === "article" && <BookOpen className="w-4 h-4" />}
                  {ref.type === "concept" && <Layers className="w-4 h-4" />}
                  {ref.type !== "project" && ref.type !== "article" && ref.type !== "concept" && (
                    <Terminal className="w-4 h-4" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-medium text-[var(--tovu-text-primary)] group-hover:text-[var(--tovu-accent)] truncate">
                      {ref.title}
                    </span>
                    <ArrowRight className="w-3.5 h-3.5 text-[var(--tovu-text-muted)] group-hover:text-[var(--tovu-accent)] transition-transform group-hover:translate-x-0.5 shrink-0" />
                  </div>
                  {ref.badge && (
                    <span className="text-[12px] text-[var(--tovu-text-muted)] font-mono block mt-0.5">
                      {ref.badge}
                    </span>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {actions.length > 0 && (
        <div className="pt-2 flex flex-wrap gap-2">
          {actions.map((action, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => {
                if (action.type === "open_project" && onOpenProject && action.target) {
                  onOpenProject(action.target);
                } else if (action.type === "open_article" && onOpenArticle && action.target) {
                  onOpenArticle(action.target);
                } else if (action.type === "navigate" && onNavigate && action.target) {
                  onNavigate(action.target);
                }
              }}
              className="tovu-action-btn doom-action-btn min-h-[40px] inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[var(--tovu-accent-soft)] hover:bg-[var(--tovu-accent)] border border-[var(--tovu-accent-border)] text-[var(--tovu-accent)] hover:text-[var(--tovu-accent-ink)] text-sm font-medium transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--tovu-accent)]"
            >
              <span>{action.label}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

// Backwards-compatible alias
export const DoomResponse = TovuResponse;

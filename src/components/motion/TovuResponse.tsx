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
    <div ref={containerRef} className="space-y-4 font-mono">
      {/* STEP 1: IDENTITY */}
      <div className="flex items-center gap-2 pb-1 border-b border-white/5">
        <div className="w-2 h-2 rounded-full bg-blue-400" />
        <span className="tovu-identity doom-identity text-xs font-semibold text-blue-400 tracking-wider">
          TOVU // INTELLIGENCE
        </span>
      </div>

      {/* STEP 2: THOUGHT (Line by line masked reveals) */}
      <div className="space-y-1.5 text-xs text-zinc-200 leading-relaxed">
        {lines.map((line, idx) => (
          <div key={idx} className="overflow-hidden">
            <p className="tovu-thought-line doom-thought-line will-change-transform">{line}</p>
          </div>
        ))}
      </div>

      {/* STEP 3: INFORMATION / REFERENCES */}
      {references.length > 0 && (
        <div className="pt-2 space-y-2">
          <span className="text-[10px] text-zinc-500 tracking-wider uppercase block">
            REFERENCED ENTITIES:
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {references.map((ref, idx) => (
              <div
                key={idx}
                onClick={() => {
                  if (ref.type === "project" && onOpenProject) {
                    onOpenProject(ref.slug);
                  } else if (ref.type === "article" && onOpenArticle) {
                    onOpenArticle(ref.slug);
                  } else if (onNavigate) {
                    onNavigate(ref.type === "concept" ? "knowledge" : ref.type);
                  }
                }}
                className="tovu-info-card doom-info-card p-2.5 rounded-lg bg-white/[0.03] border border-white/10 hover:border-blue-500/40 hover:bg-blue-500/5 transition-all cursor-pointer group flex items-start gap-2.5"
              >
                <div className="mt-0.5 p-1 rounded bg-white/5 text-zinc-400 group-hover:text-blue-400 transition-colors">
                  {ref.type === "project" && <Terminal className="w-3.5 h-3.5" />}
                  {ref.type === "article" && <BookOpen className="w-3.5 h-3.5" />}
                  {ref.type === "concept" && <Layers className="w-3.5 h-3.5" />}
                  {ref.type !== "project" && ref.type !== "article" && ref.type !== "concept" && (
                    <Terminal className="w-3.5 h-3.5" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-xs text-zinc-200 font-semibold group-hover:text-white truncate">
                      {ref.title}
                    </span>
                    <ArrowRight className="w-3 h-3 text-zinc-600 group-hover:text-blue-400 transition-transform group-hover:translate-x-0.5 shrink-0" />
                  </div>
                  {ref.badge && (
                    <span className="text-[9px] text-blue-400/80 font-mono tracking-wide uppercase">
                      {ref.badge}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* STEP 4: ACTION BUTTONS */}
      {actions.length > 0 && (
        <div className="pt-2 flex flex-wrap gap-2">
          {actions.map((action, idx) => (
            <button
              key={idx}
              onClick={() => {
                if (action.type === "open_project" && onOpenProject && action.target) {
                  onOpenProject(action.target);
                } else if (action.type === "open_article" && onOpenArticle && action.target) {
                  onOpenArticle(action.target);
                } else if (action.type === "navigate" && onNavigate && action.target) {
                  onNavigate(action.target);
                }
              }}
              className="tovu-action-btn doom-action-btn inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 text-blue-300 text-xs font-semibold transition-all hover:scale-[1.02] active:scale-98 cursor-pointer"
            >
              <span>{action.label}</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

// Backwards-compatible alias
export const DoomResponse = TovuResponse;

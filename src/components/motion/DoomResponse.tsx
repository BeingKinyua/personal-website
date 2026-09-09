import React, { useRef } from "react";
import { useDoomReveal } from "../../hooks/motion/useDoomReveal";
import { DoomAction, DoomReference } from "../../types/doom";
import { ArrowRight, Terminal, BookOpen, Layers } from "lucide-react";

export interface DoomResponseProps {
  message: string;
  references?: DoomReference[];
  actions?: DoomAction[];
  onOpenProject?: (slug: string) => void;
  onOpenArticle?: (slug: string) => void;
  onNavigate?: (sectionId: string) => void;
}

export const DoomResponse: React.FC<DoomResponseProps> = ({
  message,
  references = [],
  actions = [],
  onOpenProject,
  onOpenArticle,
  onNavigate,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useDoomReveal(containerRef);

  const lines = message.split("\n").filter((l) => l.trim().length > 0);

  return (
    <div ref={containerRef} className="space-y-4 font-mono">
      {/* STEP 1: IDENTITY */}
      <div className="flex items-center gap-2 pb-1 border-b border-white/5">
        <div className="w-2 h-2 rounded-full bg-emerald-400" />
        <span className="doom-identity text-xs font-semibold text-emerald-400 tracking-wider">
          DR. DOOM // SYSTEM INTELLIGENCE
        </span>
      </div>

      {/* STEP 2: THOUGHT (Line by line masked reveals) */}
      <div className="space-y-1.5 text-xs text-zinc-200 leading-relaxed">
        {lines.map((line, idx) => (
          <div key={idx} className="overflow-hidden">
            <p className="doom-thought-line will-change-transform">{line}</p>
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
                  }
                }}
                className="doom-info-card p-2.5 rounded-xl bg-white/[0.03] border border-white/10 hover:border-emerald-500/40 hover:bg-emerald-500/5 transition-all cursor-pointer group will-change-transform"
              >
                <div className="flex items-center gap-2 mb-1">
                  {ref.type === "project" ? (
                    <Layers className="w-3.5 h-3.5 text-blue-400" />
                  ) : (
                    <BookOpen className="w-3.5 h-3.5 text-amber-400" />
                  )}
                  <span className="text-xs font-semibold text-white group-hover:text-emerald-300 transition-colors">
                    {ref.title}
                  </span>
                </div>
                <p className="text-[11px] text-zinc-400 line-clamp-1">
                  {ref.badge || ref.type.toUpperCase()}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* STEP 4: ACTION BUTTONS */}
      {actions.length > 0 && (
        <div className="pt-2 flex flex-wrap gap-2">
          {actions.map((act, idx) => (
            <button
              key={idx}
              onClick={() => {
                if (act.type === "navigate" && onNavigate) {
                  onNavigate(act.target);
                } else if (act.type === "open_project" && onOpenProject) {
                  onOpenProject(act.target);
                } else if (act.type === "open_article" && onOpenArticle) {
                  onOpenArticle(act.target);
                }
              }}
              className="doom-action-btn inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs hover:bg-emerald-500/20 transition-all cursor-pointer will-change-transform"
            >
              <span>{act.label}</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

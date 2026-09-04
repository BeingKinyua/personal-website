import React, { useState } from "react";
import { FlaskConical, Terminal, Activity, ArrowRight, Code2, CheckCircle2, PauseCircle, HelpCircle } from "lucide-react";
import { EXPERIMENTS } from "../../data/experiments";
import { Experiment, ExperimentStatus } from "../../types/experiment";

export const LabSection: React.FC = () => {
  const [filter, setFilter] = useState<string>("ALL");
  const [expandedId, setExpandedId] = useState<string | null>("exp-07-football");

  const statusColors: Record<ExperimentStatus, { bg: string; text: string; border: string }> = {
    Idea: { bg: "bg-purple-500/10", text: "text-purple-300", border: "border-purple-500/20" },
    Exploring: { bg: "bg-amber-500/10", text: "text-amber-300", border: "border-amber-500/20" },
    Prototype: { bg: "bg-cyan-500/10", text: "text-cyan-300", border: "border-cyan-500/20" },
    Building: { bg: "bg-emerald-500/10", text: "text-emerald-300", border: "border-emerald-500/20" },
    Paused: { bg: "bg-zinc-500/10", text: "text-zinc-400", border: "border-zinc-500/20" },
    Archived: { bg: "bg-slate-500/10", text: "text-slate-400", border: "border-slate-500/20" }
  };

  const filteredExperiments = filter === "ALL"
    ? EXPERIMENTS
    : EXPERIMENTS.filter((e) => e.status === filter);

  return (
    <section id="lab" className="py-24 px-4 sm:px-6 max-w-7xl mx-auto text-zinc-100">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span className="text-xs font-mono tracking-widest text-zinc-400 uppercase">
              LAB // EXPERIMENTAL SANDBOX
            </span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-mono font-medium text-white tracking-tight">
            Unfinished Ideas & Active R&amp;D
          </h2>
        </div>
        <p className="text-sm text-zinc-400 max-w-md font-normal">
          Work contains finished systems. Lab is where hypotheses are formulated, tested, benchmarked, or archived.
        </p>
      </div>

      {/* Filter Chips */}
      <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-8 scrollbar-none">
        {["ALL", "Building", "Prototype", "Exploring", "Idea"].map((status) => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            className={`px-3 py-1 rounded-full text-xs font-mono tracking-wider transition-all cursor-pointer ${
              filter === status
                ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                : "bg-white/5 text-zinc-400 hover:text-white border border-white/5"
            }`}
          >
            {status}
          </button>
        ))}
      </div>

      {/* Experiments List */}
      <div className="space-y-6">
        {filteredExperiments.map((exp) => {
          const isExpanded = expandedId === exp.id;
          const statusStyle = statusColors[exp.status];

          return (
            <div
              key={exp.id}
              id={`lab-card-${exp.id}`}
              className="rounded-3xl border border-white/10 bg-[#0d0f12] hover:border-emerald-500/30 transition-all duration-300 overflow-hidden"
            >
              <div
                onClick={() => setExpandedId(isExpanded ? null : exp.id)}
                className="p-6 sm:p-8 cursor-pointer flex flex-col lg:flex-row lg:items-center justify-between gap-6"
              >
                <div className="space-y-2 max-w-3xl">
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-mono font-semibold text-emerald-400">
                      {exp.number}
                    </span>
                    <span className="text-zinc-600">|</span>
                    <span className="text-xs font-mono text-zinc-400">
                      {exp.category}
                    </span>
                    <span
                      className={`text-[10px] font-mono uppercase tracking-widest px-2.5 py-0.5 rounded-full border ${statusStyle.bg} ${statusStyle.text} ${statusStyle.border}`}
                    >
                      {exp.status}
                    </span>
                  </div>

                  <h3 className="text-xl sm:text-2xl font-mono text-white tracking-tight">
                    {exp.title}
                  </h3>

                  <p className="text-sm text-zinc-300 leading-relaxed pt-1">
                    <span className="text-zinc-500 font-mono text-xs uppercase mr-2">HYPOTHESIS:</span>
                    {exp.hypothesis}
                  </p>
                </div>

                <div className="flex items-center gap-4 shrink-0">
                  {exp.metrics && (
                    <div className="flex items-center gap-4 pr-4 border-r border-white/10 hidden sm:flex">
                      {exp.metrics.slice(0, 2).map((m, i) => (
                        <div key={i} className="text-right font-mono">
                          <div className="text-base font-semibold text-emerald-400">
                            {m.value}
                          </div>
                          <div className="text-[10px] text-zinc-500 uppercase">
                            {m.label}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  <button className="px-4 py-2 rounded-full border border-white/10 bg-white/5 text-xs font-mono text-zinc-300 hover:text-white transition-colors cursor-pointer">
                    {isExpanded ? "Collapse" : "Inspect"}
                  </button>
                </div>
              </div>

              {/* Expanded State: Current State, Next Experiment & Code Snippet */}
              {isExpanded && (
                <div className="px-6 sm:px-8 pb-8 pt-4 border-t border-white/5 bg-[#090b0d]/60 space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-1.5">
                      <span className="text-xs font-mono uppercase text-zinc-500">
                        CURRENT STATE
                      </span>
                      <p className="text-sm text-zinc-300 leading-relaxed">
                        {exp.currentState}
                      </p>
                    </div>

                    <div className="space-y-1.5">
                      <span className="text-xs font-mono uppercase text-emerald-400">
                        NEXT EXPERIMENT
                      </span>
                      <p className="text-sm text-zinc-300 leading-relaxed">
                        {exp.nextExperiment}
                      </p>
                    </div>
                  </div>

                  {/* Code Snippet if present */}
                  {exp.snippet && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs font-mono text-zinc-400">
                        <span className="flex items-center gap-1.5">
                          <Terminal className="w-3.5 h-3.5 text-emerald-400" />
                          {exp.snippet.filename}
                        </span>
                        <span className="text-[10px] uppercase text-zinc-500">
                          {exp.snippet.language}
                        </span>
                      </div>
                      <div className="rounded-2xl border border-white/10 bg-[#06080a] p-4 font-mono text-xs text-zinc-300 overflow-x-auto">
                        <pre><code>{exp.snippet.code}</code></pre>
                      </div>
                    </div>
                  )}

                  {/* Tags */}
                  <div className="flex flex-wrap gap-1.5 pt-2">
                    {exp.tags.map((tag) => (
                      <span
                        key={tag}
                        className="text-[11px] font-mono px-2.5 py-0.5 rounded-full bg-white/5 text-zinc-400 border border-white/5"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
};

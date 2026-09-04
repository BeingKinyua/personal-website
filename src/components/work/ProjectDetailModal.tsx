import React, { useState } from "react";
import { X, ArrowRight, ArrowLeft, ExternalLink, Github, Terminal, Cpu, CheckCircle2, ChevronRight, Share2 } from "lucide-react";
import { Project } from "../../types/project";
import { PROJECTS } from "../../data/projects";

interface ProjectDetailModalProps {
  slug: string | null;
  onClose: () => void;
  onSelectProject: (slug: string) => void;
}

export const ProjectDetailModal: React.FC<ProjectDetailModalProps> = ({
  slug,
  onClose,
  onSelectProject
}) => {
  if (!slug) return null;

  const project = PROJECTS.find((p) => p.slug === slug || p.id === slug) || PROJECTS[0];
  const currentIndex = PROJECTS.findIndex((p) => p.id === project.id);
  const prevProject = currentIndex > 0 ? PROJECTS[currentIndex - 1] : null;
  const nextProject = currentIndex < PROJECTS.length - 1 ? PROJECTS[currentIndex + 1] : null;

  const [activeNode, setActiveNode] = useState<string | null>(null);

  return (
    <div
      id="project-detail-backdrop"
      className="fixed inset-0 z-50 overflow-y-auto bg-black/90 backdrop-blur-xl animate-fadeIn text-zinc-100 flex justify-center"
    >
      <div
        id="project-detail-container"
        className="relative w-full max-w-5xl my-4 sm:my-10 mx-3 sm:mx-6 rounded-3xl border border-white/10 bg-[#090b0e] shadow-2xl flex flex-col overflow-hidden"
      >
        {/* Sticky Top Header Bar */}
        <div className="sticky top-0 z-30 flex items-center justify-between px-6 py-4 border-b border-white/10 bg-[#0c0e12]/90 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <span className="text-xs font-mono px-2 py-0.5 rounded bg-blue-500/15 text-blue-300 border border-blue-500/20 font-semibold">
              PROJECT {project.number}
            </span>
            <span className="text-xs font-mono text-zinc-400 hidden sm:inline">
              // {project.category}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {project.githubUrl && (
              <a
                href={project.githubUrl}
                target="_blank"
                rel="noreferrer"
                className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-white/5 transition-colors"
                title="View on GitHub"
              >
                <Github className="w-4 h-4" />
              </a>
            )}
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              title="Close Case Study"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Storytelling Content (Section 9) */}
        <div className="p-6 sm:p-10 space-y-16">
          {/* 1. HERO SECTION */}
          <div>
            <div className="text-xs font-mono uppercase tracking-widest text-blue-400 mb-2">
              SYSTEM ARCHITECTURE SPECIFICATION
            </div>
            <h1 className="text-3xl sm:text-5xl font-mono font-medium text-white mb-4 tracking-tight">
              {project.title}
            </h1>
            <p className="text-lg sm:text-xl text-zinc-300 font-normal leading-relaxed max-w-3xl mb-6">
              {project.subtitle}
            </p>

            {/* Technologies Badges */}
            <div className="flex flex-wrap items-center gap-2">
              {project.technologies.map((tech) => (
                <span
                  key={tech}
                  className="px-3 py-1 rounded-full text-xs font-mono text-zinc-300 bg-white/5 border border-white/10"
                >
                  {tech}
                </span>
              ))}
            </div>
          </div>

          {/* Key Metrics Banner */}
          {project.metrics && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-5 rounded-2xl border border-white/10 bg-[#0e1115]">
              {project.metrics.map((metric, i) => (
                <div key={i} className="space-y-1">
                  <div className="text-2xl sm:text-3xl font-mono font-semibold text-blue-400">
                    {metric.value}
                  </div>
                  <div className="text-xs font-medium text-white">
                    {metric.label}
                  </div>
                  <div className="text-[11px] text-zinc-400">
                    {metric.detail}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* 2. OVERVIEW & PROBLEM */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-6 space-y-3">
              <span className="text-xs font-mono text-zinc-500 uppercase tracking-wider block">
                01 // OVERVIEW
              </span>
              <h3 className="text-lg font-medium text-white">The System Intent</h3>
              <p className="text-sm text-zinc-300 leading-relaxed">
                {project.deepDive.overview}
              </p>
            </div>

            <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-6 space-y-3">
              <span className="text-xs font-mono text-zinc-500 uppercase tracking-wider block">
                02 // THE PROBLEM
              </span>
              <h3 className="text-lg font-medium text-white">Inherent Failure Modes</h3>
              <p className="text-sm text-zinc-300 leading-relaxed">
                {project.deepDive.problem}
              </p>
            </div>
          </div>

          {/* 3. RESEARCH & SOLUTION */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-3">
              <span className="text-xs font-mono text-blue-400 uppercase tracking-wider block">
                03 // RESEARCH & INVESTIGATION
              </span>
              <h3 className="text-xl font-medium text-white">Foundational Invariants</h3>
              <p className="text-sm text-zinc-300 leading-relaxed">
                {project.deepDive.research}
              </p>
            </div>

            <div className="space-y-3">
              <span className="text-xs font-mono text-blue-400 uppercase tracking-wider block">
                04 // THE ARCHITECTURAL SOLUTION
              </span>
              <h3 className="text-xl font-medium text-white">Deterministic Construction</h3>
              <p className="text-sm text-zinc-300 leading-relaxed">
                {project.deepDive.solution}
              </p>
            </div>
          </div>

          {/* 4. INTERACTIVE ARCHITECTURE DIAGRAM */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-mono text-zinc-400 uppercase tracking-wider block">
                  05 // ARCHITECTURE & TOPOLOGY
                </span>
                <h3 className="text-xl font-mono text-white">
                  Signal Flow & Pipeline Nodes
                </h3>
              </div>
              <span className="text-xs font-mono text-zinc-500">
                CLICK NODES TO INSPECT
              </span>
            </div>

            {/* Architecture SVG canvas */}
            <div className="relative w-full h-[280px] sm:h-[320px] rounded-2xl border border-white/10 bg-[#07090c] overflow-hidden p-4">
              <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:24px_24px]" />

              <svg className="absolute inset-0 w-full h-full pointer-events-none">
                <defs>
                  <linearGradient id="lineGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.3" />
                    <stop offset="100%" stopColor="#60a5fa" stopOpacity="0.8" />
                  </linearGradient>
                </defs>
                {project.architectureLines.map((line, idx) => {
                  const fromNode = project.architectureNodes.find((n) => n.id === line.from);
                  const toNode = project.architectureNodes.find((n) => n.id === line.to);
                  if (!fromNode || !toNode) return null;

                  return (
                    <g key={idx}>
                      <line
                        x1={`${fromNode.x}%`}
                        y1={`${fromNode.y}%`}
                        x2={`${toNode.x}%`}
                        y2={`${toNode.y}%`}
                        stroke="rgba(255, 255, 255, 0.15)"
                        strokeWidth="1.5"
                        strokeDasharray={line.active ? "4 4" : undefined}
                      />
                      {line.active && (
                        <circle
                          r="3"
                          fill="#3b82f6"
                          className="animate-pulse"
                        >
                          <animateMotion
                            path={`M ${fromNode.x * 8} ${fromNode.y * 3} L ${toNode.x * 8} ${toNode.y * 3}`}
                            dur="3s"
                            repeatCount="indefinite"
                          />
                        </circle>
                      )}
                    </g>
                  );
                })}
              </svg>

              {/* Render Nodes */}
              {project.architectureNodes.map((node) => {
                const isSelected = activeNode === node.id;
                return (
                  <div
                    key={node.id}
                    onClick={() => setActiveNode(node.id)}
                    style={{ left: `${node.x}%`, top: `${node.y}%` }}
                    className={`absolute -translate-x-1/2 -translate-y-1/2 px-3 py-1.5 rounded-xl border text-xs font-mono cursor-pointer transition-all duration-200 shadow-lg ${
                      isSelected
                        ? "bg-blue-600 text-white border-blue-400 scale-105 shadow-blue-500/25"
                        : "bg-[#101318] text-zinc-300 border-white/10 hover:border-blue-400/50 hover:bg-[#151920]"
                    }`}
                  >
                    <div className="flex items-center gap-1.5 whitespace-nowrap">
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          node.role === "input"
                            ? "bg-emerald-400"
                            : node.role === "process"
                            ? "bg-blue-400"
                            : "bg-amber-400"
                        }`}
                      />
                      <span>{node.label}</span>
                    </div>
                  </div>
                );
              })}
            </div>

            <p className="text-xs text-zinc-400 leading-relaxed font-mono">
              {project.deepDive.architectureNotes}
            </p>
          </div>

          {/* 5. IMPLEMENTATION CODE SNIPPET */}
          {project.deepDive.implementationSnippet && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs font-mono text-zinc-400">
                <span className="flex items-center gap-1.5">
                  <Terminal className="w-3.5 h-3.5 text-blue-400" />
                  06 // IMPLEMENTATION SPECIFICATION: {project.deepDive.implementationSnippet.filename}
                </span>
                <span className="uppercase text-[10px] text-zinc-500">
                  {project.deepDive.implementationSnippet.language}
                </span>
              </div>

              <div className="rounded-2xl border border-white/10 bg-[#07080a] p-5 font-mono text-xs text-zinc-300 overflow-x-auto leading-relaxed">
                <pre><code>{project.deepDive.implementationSnippet.code}</code></pre>
              </div>
            </div>
          )}

          {/* 6. RESULTS & LESSONS */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4 border-t border-white/10">
            <div className="space-y-2">
              <span className="text-xs font-mono text-emerald-400 uppercase tracking-wider block">
                07 // EMPIRICAL RESULTS
              </span>
              <h3 className="text-lg font-medium text-white">Outcomes</h3>
              <p className="text-sm text-zinc-300 leading-relaxed">
                {project.deepDive.results}
              </p>
            </div>

            <div className="space-y-2">
              <span className="text-xs font-mono text-amber-400 uppercase tracking-wider block">
                08 // ENGINEERING LESSONS
              </span>
              <h3 className="text-lg font-medium text-white">Key Takeaways</h3>
              <p className="text-sm text-zinc-300 leading-relaxed">
                {project.deepDive.lessons}
              </p>
            </div>
          </div>

          {/* 7. NEXT / PREVIOUS NAVIGATION */}
          <div className="pt-8 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
            {prevProject ? (
              <button
                onClick={() => onSelectProject(prevProject.slug)}
                className="flex items-center gap-2 text-xs font-mono text-zinc-400 hover:text-white transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>PREV: {prevProject.number} {prevProject.title}</span>
              </button>
            ) : <div />}

            {nextProject && (
              <button
                onClick={() => onSelectProject(nextProject.slug)}
                className="flex items-center gap-2 text-xs font-mono text-zinc-400 hover:text-white transition-colors cursor-pointer"
              >
                <span>NEXT: {nextProject.number} {nextProject.title}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

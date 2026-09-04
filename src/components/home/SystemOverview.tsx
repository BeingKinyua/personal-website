import React, { useState } from "react";
import { ArrowRight, Sparkles, FolderKanban, BookOpen, FlaskConical, Network, Terminal, Activity, ArrowUpRight } from "lucide-react";
import { CURRENTLY_ITEMS } from "../../data/currently";
import { CurrentlyItem } from "../../types/common";
import { CurrentlyTelemetryModal } from "./CurrentlyTelemetryModal";
import { HeroCanvas } from "../3d/HeroCanvas";

interface SystemOverviewProps {
  onNavigate: (sectionId: string) => void;
  onOpenDoom: () => void;
}

export const SystemOverview: React.FC<SystemOverviewProps> = ({ onNavigate, onOpenDoom }) => {
  const [selectedCurrently, setSelectedCurrently] = useState<CurrentlyItem | null>(null);

  const modules = [
    {
      id: "work",
      title: "WORK",
      count: "05 Systems",
      desc: "Cinematic horizontal showcase of finished distributed platforms, computer vision, and AI systems.",
      icon: <FolderKanban className="w-4 h-4 text-blue-400" />,
      tag: "FEATURED"
    },
    {
      id: "journal",
      title: "JOURNAL",
      count: "04 Essays",
      desc: "Bento grid of deep-dive architectural essays: compound AI systems, storage internals, and design constraints.",
      icon: <BookOpen className="w-4 h-4 text-amber-400" />,
      tag: "EDITORIAL"
    },
    {
      id: "lab",
      title: "LAB",
      count: "05 Experiments",
      desc: "Active research sandbox where hypotheses are tested: kinematics, actor concurrency, and WASM ZK verifiers.",
      icon: <FlaskConical className="w-4 h-4 text-emerald-400" />,
      tag: "R&D"
    },
    {
      id: "knowledge",
      title: "KNOWLEDGE",
      count: "16 Concepts",
      desc: "Interactive concept lattice connecting distributed consensus, vector search, books, and language models.",
      icon: <Network className="w-4 h-4 text-indigo-400" />,
      tag: "LATTICE"
    }
  ];

  return (
    <section id="home" className="relative pt-24 sm:pt-32 pb-20 px-4 sm:px-6 max-w-7xl mx-auto">
      {/* Hero Presentation */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center min-h-[58vh]">
        <div className="lg:col-span-7 z-10">
          {/* System Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-white/10 bg-white/[0.03] text-xs font-mono text-zinc-400 mb-6 backdrop-blur-sm">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>VICTOR.OS // DIGITAL OPERATING ENVIRONMENT</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-light tracking-tight text-white mb-6 font-mono leading-[1.1]">
            A personal operating system for <span className="text-blue-400 font-normal">building</span>, <span className="text-zinc-300">learning</span>, and <span className="text-zinc-300">exploring</span>.
          </h1>

          <p className="text-base sm:text-lg text-zinc-400 max-w-xl font-normal leading-relaxed mb-8">
            Engineered by Victor Kinyua. Combining distributed systems reliability, compound AI pipelines, and restrained, high-contrast human interfaces.
          </p>

          {/* Primary CTA Buttons */}
          <div className="flex flex-wrap items-center gap-3.5">
            <button
              id="hero-explore-work-btn"
              onClick={() => onNavigate("work")}
              className="group inline-flex items-center gap-2.5 px-6 py-3 rounded-full bg-white text-black font-medium text-xs sm:text-sm tracking-wide transition-all duration-200 hover:bg-zinc-200 hover:shadow-[0_0_20px_rgba(255,255,255,0.25)] active:scale-95 cursor-pointer"
            >
              <span>Explore Work</span>
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
            </button>

            <button
              id="hero-ask-doom-btn"
              onClick={onOpenDoom}
              className="group inline-flex items-center gap-2.5 px-6 py-3 rounded-full bg-blue-500/15 hover:bg-blue-500/25 border border-blue-500/30 text-blue-200 font-mono text-xs sm:text-sm tracking-wide transition-all duration-200 hover:shadow-[0_0_20px_rgba(59,130,246,0.3)] active:scale-95 cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-blue-400 animate-pulse" />
              <span>Ask Doom</span>
            </button>
          </div>
        </div>

        {/* 3D Hero Element / Architectural Visual */}
        <div className="lg:col-span-5 h-[340px] sm:h-[420px] relative flex items-center justify-center">
          <div className="absolute inset-0 bg-radial from-blue-500/10 via-transparent to-transparent blur-2xl pointer-events-none" />
          <HeroCanvas />
        </div>
      </div>

      {/* Divider */}
      <div className="my-16 h-px w-full bg-gradient-to-r from-transparent via-white/10 to-transparent" />

      {/* CURRENTLY SECTION (Section 7) */}
      <div className="mb-20">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-blue-400" />
            <h2 className="text-xs font-mono uppercase tracking-widest text-zinc-400">
              CURRENTLY // ACTIVE FOCUS TELEMETRY
            </h2>
          </div>
          <span className="text-[11px] font-mono text-zinc-500">
            CLICK TO INSPECT STATE
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {CURRENTLY_ITEMS.map((item) => (
            <div
              key={item.id}
              id={`currently-${item.category.toLowerCase()}`}
              onClick={() => setSelectedCurrently(item)}
              className="group relative rounded-2xl border border-white/5 bg-[#0c0e11]/80 hover:bg-[#111418] p-4.5 transition-all duration-300 cursor-pointer hover:border-white/15 hover:shadow-xl hover:-translate-y-0.5"
            >
              <div className="flex items-center justify-between mb-2.5">
                <span className="text-[10px] font-mono tracking-wider text-blue-400 uppercase font-semibold">
                  {item.category}
                </span>
                <span className="text-[10px] font-mono text-zinc-500 group-hover:text-zinc-400 flex items-center gap-1">
                  {item.status} <ArrowUpRight className="w-3 h-3 text-zinc-500 group-hover:text-blue-400 transition-colors" />
                </span>
              </div>

              <h3 className="text-sm font-medium text-white mb-2 line-clamp-1 group-hover:text-blue-200 transition-colors">
                {item.title}
              </h3>

              <p className="text-xs text-zinc-400 line-clamp-2 leading-relaxed mb-3">
                {item.description}
              </p>

              <div className="text-[10px] font-mono text-zinc-500 truncate pt-2 border-t border-white/5">
                {item.techOrSource}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* SYSTEM MODULES (Section 7) */}
      <div className="mb-20">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Terminal className="w-4 h-4 text-emerald-400" />
            <h2 className="text-xs font-mono uppercase tracking-widest text-zinc-400">
              SYSTEM MODULES // NAVIGATION
            </h2>
          </div>
          <span className="text-[11px] font-mono text-zinc-500">
            04 CORE MODULES ONLINE
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {modules.map((mod) => (
            <div
              key={mod.id}
              id={`home-mod-${mod.id}`}
              onClick={() => onNavigate(mod.id)}
              className="group rounded-2xl border border-white/10 bg-[#0d0f12] hover:bg-[#121519] p-5 transition-all duration-300 cursor-pointer hover:border-blue-500/40 hover:shadow-[0_10px_30px_rgba(0,0,0,0.5)] flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="p-2 rounded-xl bg-white/5 border border-white/5 group-hover:bg-blue-500/10 group-hover:border-blue-500/20 transition-all">
                    {mod.icon}
                  </div>
                  <span className="text-[10px] font-mono tracking-wider px-2 py-0.5 rounded bg-white/5 text-zinc-400 group-hover:text-white transition-colors">
                    {mod.tag}
                  </span>
                </div>

                <div className="flex items-baseline gap-2 mb-1.5">
                  <h3 className="text-base font-mono font-semibold text-white group-hover:text-blue-400 transition-colors">
                    {mod.title}
                  </h3>
                  <span className="text-xs font-mono text-zinc-500">
                    ({mod.count})
                  </span>
                </div>

                <p className="text-xs text-zinc-400 leading-relaxed mb-4">
                  {mod.desc}
                </p>
              </div>

              <div className="inline-flex items-center gap-1.5 text-xs font-mono text-zinc-400 group-hover:text-blue-300 transition-colors pt-2 border-t border-white/5">
                <span>Access Module</span>
                <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ABOUT VICTOR SYSTEM SUMMARY */}
      <div className="rounded-3xl border border-white/10 bg-gradient-to-b from-[#0e1115] to-[#0a0c0e] p-6 sm:p-8 relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-radial from-blue-500/5 to-transparent pointer-events-none" />
        
        <div className="relative z-10 max-w-2xl">
          <span className="text-[10px] font-mono text-blue-400 uppercase tracking-widest font-semibold mb-2 block">
            ABOUT VICTOR // SYSTEMS PHILOSOPHY
          </span>
          <h3 className="text-xl sm:text-2xl font-mono text-white mb-4">
            &ldquo;I build systems. I explore ideas. I solve problems.&rdquo;
          </h3>
          <p className="text-sm text-zinc-400 leading-relaxed mb-6">
            Software should be calm, mathematically coherent, and resilient under failure. Rather than chasing superficial trends, I engineer foundational systems: distributed state machines that survive chaos, computer vision pipelines that find hidden talent, and opinionated tools that honor human focus.
          </p>

          <button
            onClick={() => onNavigate("about")}
            className="inline-flex items-center gap-2 text-xs font-mono text-white hover:text-blue-400 transition-colors cursor-pointer group"
          >
            <span>Read full narrative & journey timeline</span>
            <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
          </button>
        </div>
      </div>

      {/* Selected Telemetry Drawer Modal */}
      <CurrentlyTelemetryModal
        item={selectedCurrently}
        onClose={() => setSelectedCurrently(null)}
      />
    </section>
  );
};

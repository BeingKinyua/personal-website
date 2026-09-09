import React from "react";
import { User, Cpu, Compass, Layers, CheckCircle2, ArrowRight } from "lucide-react";
import { TIMELINE_MILESTONES } from "../../data/timeline";
import { TextReveal } from "../motion/TextReveal";
import { WordReveal } from "../motion/WordReveal";
import { ParallaxBackgroundText } from "../motion/ParallaxBackgroundText";

interface AboutSectionProps {
  onNavigateToContact: () => void;
}

export const AboutSection: React.FC<AboutSectionProps> = ({ onNavigateToContact }) => {
  return (
    <section id="about" className="relative py-24 px-4 sm:px-6 max-w-7xl mx-auto text-zinc-100 overflow-hidden">
      {/* Architectural Background Typography Parallax */}
      <ParallaxBackgroundText className="text-[16vw] absolute top-6 right-6 z-0" triggerId="about">
        ABOUT
      </ParallaxBackgroundText>

      {/* Section Header */}
      <div className="mb-16 relative z-10">
        <div className="flex items-center gap-2 mb-2">
          <span className="w-2 h-2 rounded-full bg-blue-400" />
          <span className="text-xs font-mono tracking-widest text-zinc-400 uppercase">
            ABOUT // IDENTITY &amp; CREED
          </span>
        </div>
        <TextReveal
          as="h2"
          trigger="scroll"
          duration={0.9}
          className="text-3xl sm:text-5xl font-mono font-medium text-white tracking-tight"
        >
          Systems. Curiosity. Craft.
        </TextReveal>
      </div>

      {/* 1. WHO & HOW I THINK */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-20">
        <div className="lg:col-span-6 space-y-6">
          <div className="rounded-3xl border border-white/10 bg-[#0d0f12] p-8 space-y-4">
            <span className="text-xs font-mono text-blue-400 uppercase tracking-wider block">
              01 // WHO I AM
            </span>
            <h3 className="text-2xl font-mono text-white">
              Software Engineer, AI Builder, Data Thinker
            </h3>
            <p className="text-sm text-zinc-300 leading-relaxed">
              I am Victor Kinyua. I am drawn to foundational technical problems: How do we construct distributed software that remains correct when network partitions strike? How do we build AI systems bounded by deterministic state machines rather than fragile prompt alchemy? And how do we design tools that respect human cognitive flow?
            </p>
            <p className="text-sm text-zinc-400 leading-relaxed">
              My work spans low-level infrastructure in Go and Rust, high-velocity machine learning computer vision in PyTorch, and high-contrast digital operating environments in TypeScript and React.
            </p>
          </div>
        </div>

        <div className="lg:col-span-6 space-y-6">
          <div className="rounded-3xl border border-white/10 bg-[#0d0f12] p-8 space-y-4">
            <span className="text-xs font-mono text-blue-400 uppercase tracking-wider block">
              02 // HOW I THINK
            </span>
            <h3 className="text-2xl font-mono text-white">
              The Three Core Tenets
            </h3>
            <div className="space-y-4 pt-2">
              <div className="flex gap-3">
                <span className="w-6 h-6 rounded-full bg-blue-500/15 text-blue-400 font-mono text-xs flex items-center justify-center shrink-0 mt-0.5 border border-blue-500/30">
                  1
                </span>
                <div>
                  <h4 className="text-sm font-medium text-white">Systems Over Silos</h4>
                  <p className="text-xs text-zinc-400 mt-0.5 leading-relaxed">
                    A feature does not exist alone. Everything is a feedback loop connecting hardware latency, database write amplification, and human ergonomics.
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <span className="w-6 h-6 rounded-full bg-blue-500/15 text-blue-400 font-mono text-xs flex items-center justify-center shrink-0 mt-0.5 border border-blue-500/30">
                  2
                </span>
                <div>
                  <h4 className="text-sm font-medium text-white">Determinism Before Generation</h4>
                  <p className="text-xs text-zinc-400 mt-0.5 leading-relaxed">
                    Never trust an unconstrained LLM to execute a state mutation that can be governed by a compiler, a finite state machine, or a strict schema validator.
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <span className="w-6 h-6 rounded-full bg-blue-500/15 text-blue-400 font-mono text-xs flex items-center justify-center shrink-0 mt-0.5 border border-blue-500/30">
                  3
                </span>
                <div>
                  <h4 className="text-sm font-medium text-white">Relentless Restraint</h4>
                  <p className="text-xs text-zinc-400 mt-0.5 leading-relaxed">
                    Quality comes from what you refuse to add. Clean defaults, mathematical typographic scale, and zero fluff outperform superficial embellishment.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. THE JOURNEY (Animated Milestone Timeline) */}
      <div className="mb-20">
        <div className="flex items-center gap-2 mb-8">
          <span className="text-xs font-mono text-blue-400 uppercase tracking-widest">
            03 // THE JOURNEY &amp; MILESTONES
          </span>
        </div>

        <div className="relative border-l border-white/10 ml-4 sm:ml-8 pl-6 sm:pl-10 space-y-12">
          {TIMELINE_MILESTONES.map((milestone, idx) => (
            <div key={idx} className="relative group">
              {/* Timeline node dot */}
              <div className="absolute -left-[31px] sm:-left-[47px] top-1.5 w-3.5 h-3.5 rounded-full bg-[#0d0f12] border-2 border-blue-400 group-hover:bg-blue-400 group-hover:shadow-[0_0_12px_#3b82f6] transition-all" />

              <div className="rounded-2xl border border-white/10 bg-[#0d0f12] p-6 sm:p-8 hover:border-white/20 transition-all space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-base sm:text-lg font-mono font-semibold text-white">
                      {milestone.role}
                    </span>
                    <span className="text-xs text-zinc-500 font-mono">
                      @ {milestone.organization}
                    </span>
                  </div>

                  <span className="text-xs font-mono px-2.5 py-0.5 rounded-full bg-white/5 text-zinc-400 border border-white/5">
                    {milestone.year} · {milestone.quarter}
                  </span>
                </div>

                <p className="text-sm text-zinc-300 leading-relaxed">
                  {milestone.description}
                </p>

                {milestone.impactHighlight && (
                  <div className="p-3 rounded-xl bg-blue-500/5 border border-blue-500/10 text-xs font-mono text-blue-300">
                    <span className="text-blue-400 mr-2">IMPACT:</span>
                    {milestone.impactHighlight}
                  </div>
                )}

                <div className="flex flex-wrap gap-1.5 pt-2">
                  {milestone.skills.map((skill) => (
                    <span
                      key={skill}
                      className="text-[11px] font-mono px-2 py-0.5 rounded bg-white/5 text-zinc-400 border border-white/5"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 3. WHERE I'M GOING */}
      <div className="rounded-3xl border border-white/10 bg-[#0c0e11] p-8 sm:p-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
        <div className="space-y-2 max-w-xl">
          <span className="text-xs font-mono text-emerald-400 uppercase tracking-widest">
            04 // WHERE I'M GOING
          </span>
          <h3 className="text-xl sm:text-2xl font-mono text-white">
            Solving the Next Generation of System Hard Problems
          </h3>
          <p className="text-sm text-zinc-400 leading-relaxed">
            Exploring zero-knowledge state verifiers at the edge, building autonomous agent networks with sub-millisecond dispatch cycles, and democratizing athletic performance scouting through computer vision.
          </p>
        </div>

        <button
          onClick={onNavigateToContact}
          className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-white text-black font-medium text-xs font-mono tracking-wider hover:bg-zinc-200 transition-all cursor-pointer shrink-0 active:scale-95 shadow-lg"
        >
          <span>INITIATE CONTACT</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </section>
  );
};

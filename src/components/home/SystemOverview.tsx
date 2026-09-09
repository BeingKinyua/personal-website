import React, { useState } from "react";
import { ArrowRight, Sparkles, FolderKanban, BookOpen, FlaskConical, Network, Terminal, Activity, ArrowUpRight } from "lucide-react";
import { CURRENTLY_ITEMS } from "../../data/currently";
import { CurrentlyItem } from "../../types/common";
import { CurrentlyTelemetryModal } from "./CurrentlyTelemetryModal";
import { HeroCanvas } from "../3d/HeroCanvas";
import { TextReveal } from "../motion/TextReveal";
import { WordReveal } from "../motion/WordReveal";
import { BlurReveal } from "../motion/BlurReveal";
import { HighlightText } from "../motion/HighlightText";
import { ParallaxBackgroundText } from "../motion/ParallaxBackgroundText";

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
    <section id="home" className="relative pt-24 sm:pt-32 pb-20 px-4 sm:px-6 max-w-7xl mx-auto overflow-hidden">
      {/* Background Typography Parallax */}
      <ParallaxBackgroundText className="text-[14vw] absolute -top-8 -left-4 z-0" triggerId="home">
        SYSTEM
      </ParallaxBackgroundText>

      {/* Hero Presentation */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center min-h-[58vh] relative z-10">
        <div className="lg:col-span-7 z-10">
          {/* System Badge */}
          <BlurReveal trigger="load" delay={0.1} duration={0.6}>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-white/10 bg-white/[0.03] text-xs font-mono text-zinc-400 mb-6 backdrop-blur-sm">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>VICTOR.OS // DIGITAL OPERATING ENVIRONMENT</span>
            </div>
          </BlurReveal>

          <TextReveal
            trigger="load"
            duration={0.9}
            stagger={0.12}
            delay={0.15}
            as="h1"
            className="text-4xl sm:text-6xl font-light tracking-tight text-white mb-6 font-mono leading-[1.1]"
          >
            {"A personal operating system for\nbuilding, learning, and exploring."}
          </TextReveal>

          <WordReveal
            trigger="load"
            delay={0.4}
            className="text-base sm:text-lg text-zinc-400 max-w-xl font-normal leading-relaxed mb-8"
          >
            Engineered by Victor Kinyua. Combining distributed systems reliability, compound AI pipelines, and restrained, high-contrast human interfaces.
          </WordReveal>

          {/* Primary CTA Buttons */}
          <BlurReveal trigger="load" delay={0.5} duration={0.7}>
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
          </BlurReveal>
        </div>

        {/* 3D Hero Element / Architectural Visual */}
        <div className="lg:col-span-5 h-[340px] sm:h-[420px] relative flex items-center justify-center">
          <div className="absolute inset-0 bg-radial from-blue-500/10 via-transparent to-transparent blur-2xl pointer-events-none" />
          <HeroCanvas />
        </div>
      </div>

      {/* Divider */}
      <div className="my-16 h-px w-full bg-gradient-to-r from-transparent via-white/10 to-transparent" />

      {/* Selected Telemetry Drawer Modal */}
      <CurrentlyTelemetryModal
        item={selectedCurrently}
        onClose={() => setSelectedCurrently(null)}
      />
    </section>
  );
};

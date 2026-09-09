import React, { useState, useEffect } from "react";
import { Terminal, ArrowRight, CheckCircle2, ShieldCheck, Cpu } from "lucide-react";
import { TextReveal } from "../motion/TextReveal";
import { SystemText } from "../motion/SystemText";
import { BlurReveal } from "../motion/BlurReveal";

interface SystemEntryProps {
  onEnter: () => void;
}

export const SystemEntry: React.FC<SystemEntryProps> = ({ onEnter }) => {
  const [bootStep, setBootStep] = useState<number>(0);
  const [isBooting, setIsBooting] = useState<boolean>(false);

  const bootLogs = [
    { label: "Loading Work Systems", status: "✓" },
    { label: "Loading Journal Knowledge", status: "✓" },
    { label: "Loading Laboratory Experiments", status: "✓" },
    { label: "Loading Concept Lattice", status: "✓" },
    { label: "Initializing Dr. Doom Layer", status: "✓" },
    { label: "SYSTEM READY", status: "ONLINE" }
  ];

  const handleStartBoot = () => {
    setIsBooting(true);
  };

  useEffect(() => {
    if (!isBooting) return;

    const interval = setInterval(() => {
      setBootStep((prev) => {
        if (prev < bootLogs.length - 1) {
          return prev + 1;
        } else {
          clearInterval(interval);
          setTimeout(() => {
            onEnter();
          }, 450);
          return prev;
        }
      });
    }, 180);

    return () => clearInterval(interval);
  }, [isBooting, onEnter, bootLogs.length]);

  return (
    <div
      id="system-entry-screen"
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#070809] text-[#f1f2f4] px-6 select-none overflow-hidden"
    >
      {/* Subtle architectural background grid */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:48px_48px] pointer-events-none opacity-40" />

      {/* Radial depth glow */}
      <div className="absolute w-[600px] h-[600px] rounded-full bg-[#3b82f6]/5 blur-[140px] pointer-events-none" />

      <div className="relative z-10 w-full max-w-xl mx-auto flex flex-col items-center text-center">
        {/* Monogram Badge */}
        <BlurReveal trigger="load" delay={0.1} duration={0.6}>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-white/10 bg-white/[0.03] text-xs font-mono tracking-widest text-zinc-400 mb-8 backdrop-blur-md">
            <Cpu className="w-3.5 h-3.5 text-blue-400" />
            <span>VICTOR.OS // KERNEL v2.4.0</span>
          </div>
        </BlurReveal>

        {/* Title with SystemText decode */}
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-light tracking-tight text-white mb-6 font-mono">
          <SystemText variant="decode" trigger="load" duration={0.5}>
            VICTOR.OS
          </SystemText>
        </h1>

        {/* Creed / Core Declaration using Masked Line Reveal */}
        <TextReveal
          trigger="load"
          duration={0.9}
          stagger={0.12}
          delay={0.2}
          className="space-y-1.5 text-lg sm:text-xl font-normal text-zinc-200 mb-8 max-w-md"
        >
          {"I build systems.\nI explore ideas.\nI solve problems."}
        </TextReveal>

        {/* Discipline Specifier */}
        <BlurReveal trigger="load" delay={0.4} duration={0.7}>
          <p className="text-xs sm:text-sm font-mono tracking-wider text-zinc-500 uppercase mb-12">
            Software Engineer · AI Builder · Data &amp; Product Thinker
          </p>
        </BlurReveal>

        {/* Action / Boot Sequence */}
        {!isBooting ? (
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <button
              id="enter-system-btn"
              onClick={handleStartBoot}
              className="group relative inline-flex items-center gap-3 px-8 py-3.5 rounded-full bg-white text-black font-medium text-sm tracking-wide transition-all duration-300 hover:bg-zinc-200 hover:shadow-[0_0_25px_rgba(255,255,255,0.2)] active:scale-95 cursor-pointer"
            >
              <span>ENTER SYSTEM</span>
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
            </button>

            <button
              id="instant-enter-btn"
              onClick={onEnter}
              className="text-xs font-mono text-zinc-500 hover:text-zinc-300 px-4 py-2 transition-colors cursor-pointer"
            >
              [ Skip Boot ]
            </button>
          </div>
        ) : (
          <div className="w-full max-w-sm rounded-xl border border-white/10 bg-zinc-950/80 p-5 text-left font-mono text-xs backdrop-blur-lg shadow-2xl">
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-white/10 text-zinc-400">
              <span className="flex items-center gap-1.5">
                <Terminal className="w-3.5 h-3.5 text-blue-400" />
                INITIALIZING VICTOR.OS
              </span>
              <span className="text-[10px] text-zinc-500">{bootStep + 1}/{bootLogs.length}</span>
            </div>

            <div className="space-y-2">
              {bootLogs.slice(0, bootStep + 1).map((log, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between text-zinc-300 animate-fadeIn"
                >
                  <span className="flex items-center gap-2">
                    <span className="text-zinc-600">&gt;</span>
                    <span>{log.label}</span>
                  </span>
                  <span className="flex items-center gap-1 text-emerald-400 font-bold">
                    {log.status === "✓" ? (
                      <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                    ) : (
                      <span className="text-blue-400">{log.status}</span>
                    )}
                  </span>
                </div>
              ))}
            </div>

            {/* Progress bar */}
            <div className="mt-4 h-1 w-full bg-white/5 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-500 transition-all duration-200"
                style={{ width: `${((bootStep + 1) / bootLogs.length) * 100}%` }}
              />
            </div>
          </div>
        )}

        {/* Subtle footer declaration */}
        <div className="mt-16 text-[11px] font-mono text-zinc-600 flex items-center gap-2">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>SECURE SYSTEM INTERFACE · ZERO TRACKERS · LOCAL-FIRST</span>
        </div>
      </div>
    </div>
  );
};

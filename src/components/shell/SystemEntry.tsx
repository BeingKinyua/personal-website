import React, { useState, useEffect } from "react";
import { ArrowRight, CheckCircle2 } from "lucide-react";
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
    { label: "Work & Case Studies", status: "Ready" },
    { label: "Editorial Journal", status: "Ready" },
    { label: "Research Lab", status: "Ready" },
    { label: "Knowledge Lattice", status: "Ready" },
    { label: "Tovu Intelligence", status: "Online" },
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
          }, 380);
          return prev;
        }
      });
    }, 150);

    return () => clearInterval(interval);
  }, [isBooting, onEnter, bootLogs.length]);

  return (
    <div
      id="system-entry-screen"
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[var(--tovu-bg-canvas)] text-[var(--tovu-text-primary)] px-6 select-none overflow-hidden"
    >
      <div className="blueprint-overlay absolute inset-0 pointer-events-none opacity-45" />

      <div className="relative z-10 w-full max-w-2xl mx-auto flex flex-col items-center text-center">
        <BlurReveal trigger="load" delay={0.05} duration={0.5}>
          <p className="text-[13px] font-mono tracking-widest uppercase text-[var(--tovu-accent)] mb-6">
            Victor Kinyua · Digital Portfolio
          </p>
        </BlurReveal>

        <h1 className="text-5xl sm:text-7xl font-display font-bold tracking-tight text-[var(--tovu-text-primary)] mb-6">
          <SystemText variant="decode" trigger="load" duration={0.45}>
            Tovu
          </SystemText>
        </h1>

        <TextReveal
          trigger="load"
          duration={0.85}
          stagger={0.1}
          delay={0.15}
          className="space-y-1.5 text-xl sm:text-2xl font-normal text-[var(--tovu-text-secondary)] mb-6 max-w-lg leading-relaxed"
        >
          {"I build systems.\nI explore ideas.\nI solve problems."}
        </TextReveal>

        <BlurReveal trigger="load" delay={0.35} duration={0.6}>
          <p className="text-[14px] font-mono text-[var(--tovu-text-muted)] mb-12">
            Software Engineering · Applied AI · Product Architecture
          </p>
        </BlurReveal>

        {!isBooting ? (
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <button
              id="enter-system-btn"
              type="button"
              onClick={handleStartBoot}
              className="group inline-flex items-center gap-3 px-8 py-3.5 rounded-full bg-[var(--tovu-text-primary)] text-[var(--tovu-bg-canvas)] font-medium text-[15px] transition-all duration-200 hover:opacity-90 active:scale-95 cursor-pointer whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--tovu-accent)]"
            >
              <span>Enter Tovu</span>
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
            </button>

            <button
              id="instant-enter-btn"
              type="button"
              onClick={onEnter}
              className="text-sm font-mono text-[var(--tovu-text-muted)] hover:text-[var(--tovu-text-primary)] px-4 py-2.5 transition-colors cursor-pointer"
            >
              Skip intro
            </button>
          </div>
        ) : (
          <div className="w-full max-w-md rounded-2xl border border-[var(--tovu-border-hairline)] bg-[var(--tovu-bg-surface)] p-6 text-left font-mono text-sm shadow-2xl">
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-[var(--tovu-border-hairline)] text-[var(--tovu-text-muted)]">
              <span>Preparing Tovu</span>
              <span className="tabular-nums">
                {bootStep + 1}/{bootLogs.length}
              </span>
            </div>

            <div className="space-y-2.5">
              {bootLogs.slice(0, bootStep + 1).map((log, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between text-[var(--tovu-text-secondary)]"
                >
                  <span>{log.label}</span>
                  <span className="inline-flex items-center gap-1.5 text-[var(--tovu-accent)] text-[13px]">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>{log.status}</span>
                  </span>
                </div>
              ))}
            </div>

            <div className="mt-5 h-1 w-full bg-[var(--tovu-border-hairline)] rounded-full overflow-hidden">
              <div
                className="h-full bg-[var(--tovu-accent)] transition-all duration-150"
                style={{ width: `${((bootStep + 1) / bootLogs.length) * 100}%` }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

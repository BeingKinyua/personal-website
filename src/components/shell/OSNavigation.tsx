import React, { useState, useEffect } from "react";
import { Command, Sparkles, Terminal } from "lucide-react";

interface OSNavigationProps {
  activeSection: string;
  onNavigate: (sectionId: string) => void;
  onOpenCommandCenter: () => void;
  onOpenDoom: () => void;
}

export const OSNavigation: React.FC<OSNavigationProps> = ({
  activeSection,
  onNavigate,
  onOpenCommandCenter,
  onOpenDoom
}) => {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 40);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navItems = [
    { id: "work", label: "WORK" },
    { id: "journal", label: "JOURNAL" },
    { id: "lab", label: "LAB" },
    { id: "knowledge", label: "KNOWLEDGE" },
    { id: "about", label: "ABOUT" },
    { id: "contact", label: "CONTACT" }
  ];

  return (
    <header
      id="os-floating-header"
      className="fixed top-4 left-1/2 -translate-x-1/2 z-40 w-auto max-w-[94vw] transition-all duration-300"
    >
      <nav
        id="os-main-nav"
        aria-label="VictorOS Main Navigation"
        className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 rounded-full border border-white/10 bg-[#0c0e10]/85 backdrop-blur-xl shadow-2xl transition-all duration-300 ${
          isScrolled ? "py-1.5 px-3 scale-[0.98] shadow-black/60" : ""
        }`}
      >
        {/* Brand / Home anchor */}
        <button
          id="nav-brand-btn"
          onClick={() => onNavigate("home")}
          className="flex items-center gap-2 pl-1 pr-2.5 py-1 text-xs font-mono font-medium text-white hover:text-blue-400 transition-colors cursor-pointer group"
          title="VictorOS System Home"
        >
          <span className="w-2 h-2 rounded-full bg-blue-500 group-hover:shadow-[0_0_8px_#3b82f6] transition-all" />
          <span className="tracking-widest">VICTOR.OS</span>
        </button>

        <div className="hidden md:block w-px h-3.5 bg-white/10" />

        {/* Core Nav Modules */}
        <div className="flex items-center gap-0.5 sm:gap-1">
          {navItems.map((item) => {
            const isActive = activeSection === item.id;
            return (
              <button
                key={item.id}
                id={`nav-link-${item.id}`}
                onClick={() => onNavigate(item.id)}
                className={`relative px-2.5 sm:px-3 py-1 text-[11px] sm:text-xs font-mono tracking-wider transition-all duration-200 rounded-full cursor-pointer select-none ${
                  isActive
                    ? "text-white font-semibold bg-white/10 shadow-[inset_0_1px_0_rgba(255,255,255,0.15)]"
                    : "text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.04]"
                }`}
              >
                {item.label}
                {isActive && (
                  <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-3 h-0.5 rounded-full bg-blue-400" />
                )}
              </button>
            );
          })}
        </div>

        <div className="w-px h-3.5 bg-white/10 mx-1" />

        {/* Command Center (⌘ K) */}
        <button
          id="nav-command-btn"
          onClick={onOpenCommandCenter}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-mono text-zinc-400 hover:text-white bg-white/[0.04] hover:bg-white/10 border border-white/5 transition-all cursor-pointer group"
          title="Open Command Center (⌘K)"
        >
          <Command className="w-3 h-3 text-zinc-400 group-hover:text-white" />
          <span className="hidden sm:inline text-[10px] text-zinc-400 font-medium">K</span>
        </button>

        {/* Ask Doom AI Trigger */}
        <button
          id="nav-ask-doom-btn"
          onClick={onOpenDoom}
          className="flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-mono font-medium text-blue-200 bg-blue-500/15 hover:bg-blue-500/25 border border-blue-500/30 transition-all cursor-pointer hover:shadow-[0_0_12px_rgba(59,130,246,0.3)] active:scale-95"
          title="Consult Dr. Doom AI System Assistant"
        >
          <Sparkles className="w-3 h-3 text-blue-400 animate-pulse" />
          <span className="hidden sm:inline">ASK DOOM</span>
          <span className="sm:hidden">DOOM</span>
        </button>
      </nav>
    </header>
  );
};

import React, { useState, useEffect, useRef } from "react";
import {
  Command,
  Sparkles,
  Menu,
  X,
  Layers,
  BookOpen,
  FlaskConical,
  Database,
  User,
  Mail,
  ChevronRight,
  Terminal,
  Activity
} from "lucide-react";
import Lenis from "lenis";
import { SystemText } from "../motion/SystemText";
import { useScrollLock } from "../../hooks/useScrollLock";

interface OSNavigationProps {
  activeSection: string;
  onNavigate: (sectionId: string) => void;
  onOpenCommandCenter: () => void;
  onOpenDoom: () => void;
  lenisRef?: React.RefObject<Lenis | null>;
}

export const OSNavigation: React.FC<OSNavigationProps> = ({
  activeSection,
  onNavigate,
  onOpenCommandCenter,
  onOpenDoom,
  lenisRef
}) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const drawerRef = useRef<HTMLDivElement>(null);

  // Lock background scroll only while the mobile navigation drawer is open
  useScrollLock({
    lock: isMobileMenuOpen,
    lenisRef,
  });

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 30);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Close mobile drawer on desktop resize or on Escape key
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setIsMobileMenuOpen(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isMobileMenuOpen) {
        setIsMobileMenuOpen(false);
      }
    };

    window.addEventListener("resize", handleResize);
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isMobileMenuOpen]);

  const navItems = [
    {
      id: "work",
      index: "01",
      label: "WORK",
      desc: "Engineered Systems & Showcase",
      icon: Layers
    },
    {
      id: "journal",
      index: "02",
      label: "JOURNAL",
      desc: "Architectural Essays & Analysis",
      icon: BookOpen
    },
    {
      id: "lab",
      index: "03",
      label: "LAB",
      desc: "Experimental Prototypes & R&D",
      icon: FlaskConical
    },
    {
      id: "knowledge",
      index: "04",
      label: "KNOWLEDGE",
      desc: "Engineering Graph & Tech Stack",
      icon: Database
    },
    {
      id: "about",
      index: "05",
      label: "ABOUT",
      desc: "System Biography & Philosophy",
      icon: User
    },
    {
      id: "contact",
      index: "06",
      label: "CONTACT",
      desc: "Direct Transmission & Channels",
      icon: Mail
    }
  ];

  const handleSelectSection = (id: string) => {
    setIsMobileMenuOpen(false);
    onNavigate(id);
  };

  const currentNavLabel =
    navItems.find((item) => item.id === activeSection)?.label ||
    (activeSection === "home" ? "HOME" : activeSection.toUpperCase());

  return (
    <>
      <header
        id="os-floating-header"
        className="fixed top-3 sm:top-4 left-1/2 -translate-x-1/2 z-40 w-[calc(100vw-24px)] md:w-auto max-w-4xl transition-all duration-300"
      >
        <nav
          id="os-main-nav"
          aria-label="VictorOS Main Navigation"
          className={`w-full flex items-center justify-between md:justify-start gap-1 sm:gap-2 px-2.5 sm:px-4 py-1.5 sm:py-2 rounded-full border border-white/10 bg-[#0b0d10]/90 backdrop-blur-xl shadow-2xl transition-all duration-300 ${
            isScrolled ? "scale-[0.98] shadow-black/70 bg-[#090a0d]/95" : ""
          } ${isMobileMenuOpen ? "border-blue-500/30" : ""}`}
        >
          {/* Brand / Home Anchor */}
          <button
            id="nav-brand-btn"
            onClick={() => handleSelectSection("home")}
            className="flex items-center gap-2 pl-1 sm:pl-1.5 pr-2 py-1 text-xs font-mono font-medium text-white hover:text-blue-400 transition-colors cursor-pointer group shrink-0"
            title="VictorOS System Home"
          >
            <span className="w-2 h-2 rounded-full bg-blue-500 group-hover:shadow-[0_0_8px_#3b82f6] transition-all animate-pulse" />
            <SystemText variant="tracking" duration={0.8} className="font-semibold tracking-wider text-xs sm:text-sm">
              VICTOR.OS
            </SystemText>

            {/* Mobile Active Section Tag */}
            {activeSection && activeSection !== "home" && (
              <span className="inline-flex md:hidden items-center gap-1 text-[9px] font-mono text-blue-400 bg-blue-500/10 border border-blue-500/20 px-1.5 py-0.5 rounded-full uppercase tracking-wider">
                <span className="text-zinc-600">/</span>
                <span>{currentNavLabel}</span>
              </span>
            )}
          </button>

          {/* Desktop Modules Bar (Hidden on mobile/tablet screens < md) */}
          <div className="hidden md:flex items-center">
            <div className="w-px h-3.5 bg-white/10 mx-1.5" />
            <div className="flex items-center gap-0.5 lg:gap-1">
              {navItems.map((item) => {
                const isActive = activeSection === item.id;
                return (
                  <button
                    key={item.id}
                    id={`nav-link-${item.id}`}
                    onClick={() => handleSelectSection(item.id)}
                    className={`relative px-2.5 lg:px-3 py-1 text-xs font-mono tracking-wider transition-all duration-200 rounded-full cursor-pointer select-none ${
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
            <div className="w-px h-3.5 bg-white/10 mx-1.5" />
          </div>

          {/* Desktop Direct Actions (⌘ K + ASK DOOM) */}
          <div className="hidden md:flex items-center gap-1.5">
            {/* Command Center (⌘ K) */}
            <button
              id="nav-command-btn"
              onClick={onOpenCommandCenter}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-mono text-zinc-400 hover:text-white bg-white/[0.04] hover:bg-white/10 border border-white/5 transition-all cursor-pointer group"
              title="Open Command Center (⌘K)"
            >
              <Command className="w-3.5 h-3.5 text-zinc-400 group-hover:text-white" />
              <span className="text-[10px] text-zinc-500 font-medium group-hover:text-zinc-300">K</span>
            </button>

            {/* Ask Doom AI Trigger */}
            <button
              id="nav-ask-doom-btn"
              onClick={onOpenDoom}
              className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-medium text-blue-200 bg-blue-500/15 hover:bg-blue-500/25 border border-blue-500/30 transition-all cursor-pointer hover:shadow-[0_0_12px_rgba(59,130,246,0.3)] active:scale-95"
              title="Consult Dr. Doom AI System Assistant"
            >
              <Sparkles className="w-3.5 h-3.5 text-blue-400 animate-pulse" />
              <span>ASK DOOM</span>
            </button>
          </div>

          {/* Mobile Right Controls: Doom AI + ⌘ Command + Menu Toggle */}
          <div className="flex md:hidden items-center gap-1 sm:gap-1.5">
            {/* Mobile Ask Doom AI Button */}
            <button
              id="mobile-nav-doom-btn"
              onClick={onOpenDoom}
              className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-mono font-medium text-blue-300 bg-blue-500/15 hover:bg-blue-500/25 border border-blue-500/30 active:scale-95 transition-all"
              title="Consult Dr. Doom AI"
            >
              <Sparkles className="w-3 h-3 text-blue-400 animate-pulse" />
              <span>DOOM</span>
            </button>

            {/* Mobile Command Center Button */}
            <button
              id="mobile-nav-cmd-btn"
              onClick={onOpenCommandCenter}
              className="p-1.5 rounded-full text-zinc-300 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 active:scale-95 transition-all"
              title="Open Command Center (⌘K)"
              aria-label="Command Center"
            >
              <Command className="w-3.5 h-3.5" />
            </button>

            {/* Mobile Navigation Menu Toggle */}
            <button
              id="mobile-nav-menu-toggle"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className={`p-1.5 rounded-full border transition-all active:scale-95 cursor-pointer ${
                isMobileMenuOpen
                  ? "bg-blue-500/20 text-white border-blue-500/40 shadow-[0_0_10px_rgba(59,130,246,0.3)]"
                  : "bg-white/5 text-zinc-300 hover:text-white border-white/10 hover:bg-white/10"
              }`}
              aria-label={isMobileMenuOpen ? "Close navigation menu" : "Open navigation menu"}
              aria-expanded={isMobileMenuOpen}
              aria-controls="mobile-nav-drawer"
            >
              {isMobileMenuOpen ? (
                <X className="w-4 h-4 text-blue-300" />
              ) : (
                <Menu className="w-4 h-4" />
              )}
            </button>
          </div>
        </nav>
      </header>

      {/* Mobile Drawer Backdrop */}
      {isMobileMenuOpen && (
        <div
          id="mobile-nav-backdrop"
          className="fixed inset-0 bg-black/75 backdrop-blur-md z-30 md:hidden animate-fadeIn"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Mobile Navigation Drawer Panel */}
      {isMobileMenuOpen && (
        <div
          ref={drawerRef}
          id="mobile-nav-drawer"
          data-lenis-prevent="true"
          className="fixed top-[58px] inset-x-3 z-40 max-w-md mx-auto rounded-3xl border border-white/15 bg-[#0a0c0f]/95 backdrop-blur-2xl p-4 shadow-[0_25px_60px_rgba(0,0,0,0.85)] md:hidden flex flex-col gap-3.5 animate-fadeIn max-h-[calc(100svh-75px)] overflow-y-auto scrollbar-thin"
        >
          {/* Header Status Bar */}
          <div className="flex items-center justify-between pb-2.5 border-b border-white/10 px-1">
            <div className="flex items-center gap-2">
              <Terminal className="w-3.5 h-3.5 text-blue-400" />
              <span className="text-[10px] font-mono tracking-widest text-zinc-400 uppercase">
                SYSTEM NAVIGATION // MODULES
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>ONLINE</span>
            </div>
          </div>

          {/* Module Links List */}
          <div className="space-y-1.5">
            {navItems.map((item) => {
              const isActive = activeSection === item.id;
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  id={`mobile-menu-item-${item.id}`}
                  onClick={() => handleSelectSection(item.id)}
                  className={`w-full flex items-center justify-between p-2.5 rounded-2xl border transition-all text-left group cursor-pointer ${
                    isActive
                      ? "bg-blue-500/15 border-blue-500/35 text-white shadow-[0_0_15px_rgba(59,130,246,0.15)]"
                      : "bg-white/[0.03] border-white/5 text-zinc-300 hover:bg-white/[0.08] hover:border-white/15 hover:text-white"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-8 h-8 rounded-xl flex items-center justify-center transition-colors ${
                        isActive
                          ? "bg-blue-500/25 text-blue-300 border border-blue-500/40"
                          : "bg-white/5 text-zinc-400 group-hover:text-zinc-200 border border-white/5"
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono text-zinc-500 group-hover:text-blue-400">
                          {item.index}
                        </span>
                        <span className="text-xs font-mono font-semibold tracking-wider text-white">
                          {item.label}
                        </span>
                      </div>
                      <p className="text-[11px] text-zinc-400 line-clamp-1 font-sans">
                        {item.desc}
                      </p>
                    </div>
                  </div>

                  <div className="shrink-0 pl-2">
                    {isActive ? (
                      <span className="text-[9px] font-mono uppercase tracking-wider text-blue-300 bg-blue-500/20 border border-blue-500/30 px-2 py-0.5 rounded-full">
                        ACTIVE
                      </span>
                    ) : (
                      <ChevronRight className="w-4 h-4 text-zinc-600 group-hover:text-zinc-300 transition-transform group-hover:translate-x-0.5" />
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Quick Tools Launchers Grid */}
          <div className="pt-2 border-t border-white/10 grid grid-cols-2 gap-2">
            <button
              onClick={() => {
                setIsMobileMenuOpen(false);
                onOpenCommandCenter();
              }}
              className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-xs font-mono text-zinc-200 hover:text-white transition-all cursor-pointer"
            >
              <Command className="w-3.5 h-3.5 text-zinc-400" />
              <span>COMMAND ⌘K</span>
            </button>

            <button
              onClick={() => {
                setIsMobileMenuOpen(false);
                onOpenDoom();
              }}
              className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl border border-blue-500/30 bg-blue-500/15 hover:bg-blue-500/25 text-xs font-mono text-blue-200 transition-all cursor-pointer shadow-[0_0_10px_rgba(59,130,246,0.2)]"
            >
              <Sparkles className="w-3.5 h-3.5 text-blue-400 animate-pulse" />
              <span>DR. DOOM</span>
            </button>
          </div>

          {/* Mobile Drawer Telemetry Footer */}
          <div className="pt-1 flex items-center justify-between text-[10px] font-mono text-zinc-500 px-1">
            <div className="flex items-center gap-1.5">
              <Activity className="w-3 h-3 text-blue-400" />
              <span>VICTOR.OS KERNEL v3.2</span>
            </div>
            <span>TOUCH DISPATCH 60FPS</span>
          </div>
        </div>
      )}
    </>
  );
};

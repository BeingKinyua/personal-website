import React, { useState, useEffect, useRef } from "react";
import {
  Command,
  Sparkles,
  Menu,
  X,
  ChevronRight,
  Sun,
  Moon,
} from "lucide-react";
import Lenis from "lenis";
import { useScrollLock } from "../../hooks/useScrollLock";
import { TovuTheme } from "../../hooks/useTheme";

interface OSNavigationProps {
  activeSection: string;
  onNavigate: (sectionId: string) => void;
  onOpenCommandPalette: () => void;
  onOpenTovu?: () => void;
  theme?: TovuTheme;
  onToggleTheme?: () => void;
  lenisRef?: React.RefObject<Lenis | null>;
}

const NAV_ITEMS = [
  { id: "work", index: "01", label: "Work", desc: "Engineered Systems & Case Studies" },
  { id: "journal", index: "02", label: "Journal", desc: "Essays & Engineering Notes" },
  { id: "lab", index: "03", label: "Lab", desc: "Prototypes & Active Research" },
  { id: "knowledge", index: "04", label: "Knowledge", desc: "Interconnected Mental Models" },
  { id: "about", index: "05", label: "About", desc: "Identity, Philosophy & Path" },
  { id: "contact", index: "06", label: "Contact", desc: "Direct Channels & Inquiries" },
];

export const OSNavigation: React.FC<OSNavigationProps> = ({
  activeSection,
  onNavigate,
  onOpenCommandPalette,
  onOpenTovu,
  theme = "dark",
  onToggleTheme,
  lenisRef,
}) => {
  const handleOpenTovu = onOpenTovu || (() => {});
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const drawerRef = useRef<HTMLDivElement>(null);

  useScrollLock({
    lock: isMobileMenuOpen,
    lenisRef,
  });

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 24);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
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

  const handleSelectSection = (id: string) => {
    setIsMobileMenuOpen(false);
    onNavigate(id);
  };

  return (
    <>
      <header
        id="os-floating-header"
        className="fixed top-3 sm:top-5 inset-x-0 z-40 px-4 sm:px-6 pointer-events-none"
      >
        <nav
          id="os-main-nav"
          aria-label="Primary navigation"
          className={`pointer-events-auto mx-auto max-w-6xl h-[60px] sm:h-[72px] flex items-center justify-between gap-4 lg:gap-8 px-4 sm:px-6 lg:px-8 rounded-2xl border backdrop-blur-xl transition-all duration-300 ${
            isScrolled
              ? "bg-[var(--tovu-bg-surface)]/92 border-[var(--tovu-border-strong)] shadow-[0_16px_44px_-12px_rgba(0,0,0,0.45)]"
              : "bg-[var(--tovu-bg-surface)]/78 border-[var(--tovu-border-hairline)] shadow-[0_10px_32px_-12px_rgba(0,0,0,0.3)]"
          }`}
        >
          {/* Zone 1: Brand Wordmark */}
          <button
            id="nav-brand-btn"
            type="button"
            onClick={() => handleSelectSection("home")}
            className="inline-flex items-center gap-2 py-2 text-lg sm:text-xl font-display font-bold tracking-tight text-[var(--tovu-text-primary)] hover:text-[var(--tovu-accent)] transition-colors cursor-pointer whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--tovu-accent)] rounded-lg px-1"
            title="Return to Tovu home"
          >
            <span>Tovu</span>
          </button>

          {/* Zone 2: Desktop Navigation Links */}
          <div className="hidden lg:flex items-center gap-1 xl:gap-2">
            {NAV_ITEMS.map((item) => {
              const isActive = activeSection === item.id;
              return (
                <button
                  key={item.id}
                  id={`nav-link-${item.id}`}
                  type="button"
                  onClick={() => handleSelectSection(item.id)}
                  aria-current={isActive ? "page" : undefined}
                  className={`relative px-3.5 py-2.5 text-[15px] font-medium transition-colors cursor-pointer whitespace-nowrap shrink-0 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--tovu-accent)] ${
                    isActive
                      ? "text-[var(--tovu-text-primary)]"
                      : "text-[var(--tovu-text-muted)] hover:text-[var(--tovu-text-primary)]"
                  }`}
                >
                  <span>{item.label}</span>
                  <span
                    aria-hidden="true"
                    className={`absolute left-3.5 right-3.5 bottom-1.5 h-[2px] rounded-full transition-all duration-200 ${
                      isActive
                        ? "bg-[var(--tovu-accent)] opacity-100 scale-x-100"
                        : "bg-[var(--tovu-accent)] opacity-0 scale-x-50"
                    }`}
                  />
                </button>
              );
            })}
          </div>

          {/* Zone 3: Desktop Actions (Theme, Command Palette, Ask Tovu) */}
          <div className="hidden lg:flex items-center gap-2.5 shrink-0">
            {onToggleTheme && (
              <button
                id="nav-theme-toggle-btn"
                type="button"
                onClick={onToggleTheme}
                aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} theme`}
                title={`Switch to ${theme === "dark" ? "light" : "dark"} theme`}
                className="w-10 h-10 inline-flex items-center justify-center rounded-xl border border-[var(--tovu-border-hairline)] bg-[var(--tovu-bg-elevated)]/70 hover:bg-[var(--tovu-bg-elevated)] text-[var(--tovu-text-secondary)] hover:text-[var(--tovu-text-primary)] transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--tovu-accent)]"
              >
                {theme === "dark" ? (
                  <Sun className="w-4 h-4" />
                ) : (
                  <Moon className="w-4 h-4" />
                )}
              </button>
            )}

            <button
              id="nav-command-btn"
              type="button"
              onClick={onOpenCommandPalette}
              aria-label="Open command palette"
              title="Command Palette (⌘K)"
              className="h-10 inline-flex items-center gap-2 px-3.5 rounded-xl border border-[var(--tovu-border-hairline)] bg-[var(--tovu-bg-elevated)]/70 hover:bg-[var(--tovu-bg-elevated)] text-sm font-mono text-[var(--tovu-text-secondary)] hover:text-[var(--tovu-text-primary)] transition-colors cursor-pointer whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--tovu-accent)]"
            >
              <Command className="w-4 h-4" />
              <span>K</span>
            </button>

            <button
              id="nav-ask-tovu-btn"
              type="button"
              onClick={handleOpenTovu}
              className="h-10 inline-flex items-center gap-2 px-4 rounded-xl bg-[var(--tovu-accent-soft)] hover:bg-[var(--tovu-accent)] text-[var(--tovu-accent)] hover:text-[var(--tovu-accent-ink)] border border-[var(--tovu-accent-border)] text-sm font-medium transition-all duration-200 cursor-pointer whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--tovu-accent)]"
            >
              <Sparkles className="w-4 h-4" />
              <span>Ask Tovu</span>
            </button>
          </div>

          {/* Mobile / Tablet Compact Controls */}
          <div className="flex lg:hidden items-center gap-2">
            {onToggleTheme && (
              <button
                id="mobile-nav-theme-btn"
                type="button"
                onClick={onToggleTheme}
                aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} theme`}
                className="w-10 h-10 inline-flex items-center justify-center rounded-xl border border-[var(--tovu-border-hairline)] bg-[var(--tovu-bg-elevated)]/70 text-[var(--tovu-text-secondary)] hover:text-[var(--tovu-text-primary)] transition-colors cursor-pointer"
              >
                {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </button>
            )}

            <button
              id="mobile-nav-tovu-btn"
              type="button"
              onClick={handleOpenTovu}
              className="h-10 inline-flex items-center gap-1.5 px-3.5 rounded-xl bg-[var(--tovu-accent-soft)] border border-[var(--tovu-accent-border)] text-sm font-medium text-[var(--tovu-accent)] whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Sparkles className="w-4 h-4" />
              <span>Ask Tovu</span>
            </button>

            <button
              id="mobile-nav-cmd-btn"
              type="button"
              onClick={onOpenCommandPalette}
              aria-label="Open command palette"
              className="w-10 h-10 inline-flex items-center justify-center rounded-xl border border-[var(--tovu-border-hairline)] bg-[var(--tovu-bg-elevated)]/70 text-[var(--tovu-text-secondary)] cursor-pointer"
            >
              <Command className="w-4 h-4" />
            </button>

            <button
              id="mobile-nav-menu-toggle"
              type="button"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              aria-label={isMobileMenuOpen ? "Close navigation menu" : "Open navigation menu"}
              aria-expanded={isMobileMenuOpen}
              aria-controls="mobile-nav-drawer"
              className={`w-10 h-10 inline-flex items-center justify-center rounded-xl border transition-colors cursor-pointer ${
                isMobileMenuOpen
                  ? "bg-[var(--tovu-accent-soft)] border-[var(--tovu-accent-border)] text-[var(--tovu-accent)]"
                  : "bg-[var(--tovu-bg-elevated)]/70 border-[var(--tovu-border-hairline)] text-[var(--tovu-text-primary)]"
              }`}
            >
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </nav>
      </header>

      {/* Mobile Drawer Backdrop */}
      {isMobileMenuOpen && (
        <div
          id="mobile-nav-backdrop"
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-30 lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Mobile Navigation Drawer Panel */}
      {isMobileMenuOpen && (
        <div
          ref={drawerRef}
          id="mobile-nav-drawer"
          role="dialog"
          aria-modal="true"
          aria-label="Site navigation"
          data-lenis-prevent="true"
          className="fixed top-[80px] inset-x-4 z-40 max-w-md mx-auto rounded-2xl border border-[var(--tovu-border-strong)] bg-[var(--tovu-bg-surface)]/98 backdrop-blur-2xl p-4 shadow-2xl lg:hidden flex flex-col gap-3 max-h-[calc(100svh-96px)] overflow-y-auto scrollbar-thin"
        >
          <div className="space-y-1.5">
            {NAV_ITEMS.map((item) => {
              const isActive = activeSection === item.id;
              return (
                <button
                  key={item.id}
                  id={`mobile-menu-item-${item.id}`}
                  type="button"
                  onClick={() => handleSelectSection(item.id)}
                  className={`w-full flex items-center justify-between px-4 py-3.5 rounded-xl border transition-colors text-left cursor-pointer ${
                    isActive
                      ? "bg-[var(--tovu-accent-soft)] border-[var(--tovu-accent-border)] text-[var(--tovu-text-primary)]"
                      : "bg-[var(--tovu-bg-elevated)]/50 border-[var(--tovu-border-hairline)] text-[var(--tovu-text-secondary)] hover:text-[var(--tovu-text-primary)]"
                  }`}
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2.5">
                      <span className="text-[13px] font-mono tabular-nums text-[var(--tovu-text-muted)]">
                        {item.index}
                      </span>
                      <span className="text-base font-display font-semibold">
                        {item.label}
                      </span>
                    </div>
                    <p className="text-[13px] text-[var(--tovu-text-muted)] mt-0.5 truncate">
                      {item.desc}
                    </p>
                  </div>

                  <ChevronRight
                    className={`w-4 h-4 shrink-0 ${
                      isActive ? "text-[var(--tovu-accent)]" : "text-[var(--tovu-text-muted)]"
                    }`}
                  />
                </button>
              );
            })}
          </div>
        </div>
      )}
    </>
  );
};

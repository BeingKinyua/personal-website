import React, { useState, useEffect, useRef } from "react";
import {
  Search,
  X,
  Command,
  ArrowRight,
  FolderKanban,
  BookOpen,
  FlaskConical,
  Network,
  Sparkles,
  Compass,
  CornerDownLeft,
} from "lucide-react";
import { searchTovu, searchTovuHybrid, SearchResultItem } from "../../services/searchService";
import { useScrollLock } from "../../hooks/useScrollLock";
import Lenis from "lenis";

interface CommandCenterProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (sectionId: string) => void;
  onOpenProject: (slug: string) => void;
  onOpenArticle: (slug: string) => void;
  onAskTovu?: (initialPrompt?: string) => void;
  onAskDoom?: (initialPrompt?: string) => void;
  lenisRef?: React.RefObject<Lenis | null>;
}

export const CommandCenter: React.FC<CommandCenterProps> = ({
  isOpen,
  onClose,
  onNavigate,
  onOpenProject,
  onOpenArticle,
  onAskTovu,
  onAskDoom,
  lenisRef,
}) => {
  useScrollLock({
    lock: isOpen,
    lenisRef,
  });

  const handleAsk = onAskTovu || onAskDoom || (() => {});
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResultItem[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [activeFilter, setActiveFilter] = useState<string>("ALL");
  const inputRef = useRef<HTMLInputElement>(null);
  const resultsContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    const container = resultsContainerRef.current;
    if (!container) return;

    const stopPropagation = (e: Event) => {
      e.stopPropagation();
    };

    container.addEventListener("wheel", stopPropagation, { passive: true });
    container.addEventListener("touchmove", stopPropagation, { passive: true });

    return () => {
      container.removeEventListener("wheel", stopPropagation);
      container.removeEventListener("touchmove", stopPropagation);
    };
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      setQuery("");
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  useEffect(() => {
    let cancelled = false;
    const rawResults = searchTovu(query);
    if (activeFilter === "ALL") {
      setResults(rawResults);
    } else {
      setResults(
        rawResults.filter(
          (r) => r.module === activeFilter || r.module === "TOVU" || r.module === "DOOM"
        )
      );
    }
    setSelectedIndex(0);

    if (query.trim()) {
      const timer = setTimeout(() => {
        searchTovuHybrid(query).then((hybridResults) => {
          if (!cancelled && hybridResults.length > 0) {
            if (activeFilter === "ALL") {
              setResults(hybridResults);
            } else {
              setResults(
                hybridResults.filter(
                  (r) => r.module === activeFilter || r.module === "TOVU" || r.module === "DOOM"
                )
              );
            }
          }
        });
      }, 150);

      return () => {
        cancelled = true;
        clearTimeout(timer);
      };
    }
  }, [query, activeFilter]);

  const handleSelect = (item: SearchResultItem) => {
    onClose();
    if (item.action.type === "navigate") {
      onNavigate(item.action.target);
    } else if (item.action.type === "open_project") {
      onOpenProject(item.action.target);
    } else if (item.action.type === "open_article") {
      onOpenArticle(item.action.target);
    } else if (item.action.type === "ask_tovu" || item.action.type === "ask_doom") {
      handleAsk(item.action.target);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev < results.length - 1 ? prev + 1 : prev));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : 0));
    } else if (e.key === "Enter" && results[selectedIndex]) {
      e.preventDefault();
      handleSelect(results[selectedIndex]);
    } else if (e.key === "Escape") {
      e.preventDefault();
      onClose();
    }
  };

  if (!isOpen) return null;

  const getModuleIcon = (module: string) => {
    switch (module) {
      case "WORK":
        return <FolderKanban className="w-4 h-4 text-[var(--tovu-accent)]" />;
      case "JOURNAL":
        return <BookOpen className="w-4 h-4 text-[var(--tovu-accent)]" />;
      case "LAB":
        return <FlaskConical className="w-4 h-4 text-[var(--tovu-accent)]" />;
      case "KNOWLEDGE":
        return <Network className="w-4 h-4 text-[var(--tovu-accent)]" />;
      case "NAVIGATION":
        return <Compass className="w-4 h-4 text-[var(--tovu-text-muted)]" />;
      case "TOVU":
      case "DOOM":
        return <Sparkles className="w-4 h-4 text-[var(--tovu-accent)]" />;
      default:
        return <Command className="w-4 h-4 text-[var(--tovu-text-muted)]" />;
    }
  };

  const filterTabs = ["ALL", "WORK", "JOURNAL", "LAB", "KNOWLEDGE", "TOVU"];

  return (
    <div
      id="command-center-modal"
      data-lenis-prevent="true"
      className="fixed inset-0 z-50 flex items-start justify-center pt-14 sm:pt-24 px-4 bg-black/75 backdrop-blur-md"
      onClick={onClose}
    >
      <div
        id="command-center-dialog"
        role="dialog"
        aria-modal="true"
        aria-label="Search and command palette"
        data-lenis-prevent="true"
        className="relative w-full max-w-2xl rounded-2xl border border-[var(--tovu-border-strong)] bg-[var(--tovu-bg-canvas)] shadow-2xl overflow-hidden text-[var(--tovu-text-primary)] flex flex-col max-h-[80vh]"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleKeyDown}
      >
        {/* Search Input */}
        <div className="flex items-center px-5 py-4 border-b border-[var(--tovu-border-hairline)] gap-3 bg-[var(--tovu-bg-surface)]">
          <Search className="w-5 h-5 text-[var(--tovu-text-muted)] shrink-0" aria-hidden="true" />
          <input
            ref={inputRef}
            id="command-center-input"
            type="text"
            placeholder="Search systems, essays, experiments, or ask Tovu..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full bg-transparent text-base text-[var(--tovu-text-primary)] placeholder-[var(--tovu-text-muted)] focus:outline-none"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery("")}
              aria-label="Clear search"
              className="w-9 h-9 inline-flex items-center justify-center rounded-lg text-[var(--tovu-text-muted)] hover:text-[var(--tovu-text-primary)] transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <kbd className="hidden sm:inline-flex items-center px-2 py-1 text-[12px] font-mono text-[var(--tovu-text-muted)] bg-[var(--tovu-bg-elevated)] border border-[var(--tovu-border-hairline)] rounded-md">
            ESC
          </kbd>
        </div>

        {/* Filter Tabs */}
        <div
          role="tablist"
          aria-label="Filter search results"
          className="flex items-center gap-1.5 px-4 py-2.5 border-b border-[var(--tovu-border-hairline)] overflow-x-auto scrollbar-none bg-[var(--tovu-bg-surface)]/70"
        >
          {filterTabs.map((tab) => {
            const isActive = activeFilter === tab;
            return (
              <button
                key={tab}
                id={`cmd-filter-${tab.toLowerCase()}`}
                type="button"
                role="tab"
                aria-selected={isActive}
                onClick={() => setActiveFilter(tab)}
                className={`min-h-[36px] px-3 py-1.5 rounded-lg text-[13px] font-medium transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                  isActive
                    ? "bg-[var(--tovu-text-primary)] text-[var(--tovu-bg-canvas)]"
                    : "text-[var(--tovu-text-muted)] hover:text-[var(--tovu-text-primary)]"
                }`}
              >
                {tab === "ALL" ? "All" : tab.charAt(0) + tab.slice(1).toLowerCase()}
              </button>
            );
          })}
        </div>

        {/* Results List */}
        <div
          ref={resultsContainerRef}
          id="cmd-results-list"
          role="listbox"
          data-lenis-prevent="true"
          tabIndex={0}
          className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-2.5 space-y-1 scrollbar-thin outline-none"
          style={{
            WebkitOverflowScrolling: "touch",
            overscrollBehavior: "contain",
          }}
        >
          {results.length === 0 ? (
            <div className="py-12 px-4 text-center text-[var(--tovu-text-muted)] text-[15px]">
              No matching records found. Try another keyword or ask Tovu.
            </div>
          ) : (
            results.map((item, index) => {
              const isSelected = index === selectedIndex;
              return (
                <button
                  key={item.id}
                  id={`cmd-result-${index}`}
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  onClick={() => handleSelect(item)}
                  onMouseEnter={() => setSelectedIndex(index)}
                  className={`w-full text-left flex items-center justify-between px-4 py-3 rounded-xl cursor-pointer transition-colors border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--tovu-accent)] ${
                    isSelected
                      ? "bg-[var(--tovu-accent-soft)] border-[var(--tovu-accent-border)] text-[var(--tovu-text-primary)]"
                      : "border-transparent text-[var(--tovu-text-secondary)] hover:bg-[var(--tovu-bg-surface)]"
                  }`}
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className="p-2 rounded-lg bg-[var(--tovu-bg-surface)] border border-[var(--tovu-border-hairline)] shrink-0">
                      {getModuleIcon(item.module)}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2.5">
                        <span className="text-[15px] font-medium text-[var(--tovu-text-primary)] truncate">
                          {item.title}
                        </span>
                        <span className="text-[12px] font-mono text-[var(--tovu-text-muted)] shrink-0">
                          {item.module}
                        </span>
                      </div>
                      <p className="text-[13px] text-[var(--tovu-text-muted)] truncate mt-0.5">
                        {item.subtitle}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pl-3 shrink-0">
                    {isSelected && (
                      <span className="hidden sm:inline-flex items-center text-[13px] font-mono text-[var(--tovu-accent)] gap-1">
                        Open <CornerDownLeft className="w-3.5 h-3.5" />
                      </span>
                    )}
                    <ArrowRight className="w-4 h-4 text-[var(--tovu-text-muted)]" />
                  </div>
                </button>
              );
            })
          )}
        </div>

        {/* Footer Hints */}
        <div className="px-5 py-3 bg-[var(--tovu-bg-surface)] border-t border-[var(--tovu-border-hairline)] flex items-center justify-between text-[13px] font-mono text-[var(--tovu-text-muted)]">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5">
              <kbd className="px-1.5 py-0.5 bg-[var(--tovu-bg-elevated)] rounded border border-[var(--tovu-border-hairline)] text-[12px]">
                ↑↓
              </kbd>
              navigate
            </span>
            <span className="flex items-center gap-1.5">
              <kbd className="px-1.5 py-0.5 bg-[var(--tovu-bg-elevated)] rounded border border-[var(--tovu-border-hairline)] text-[12px]">
                ↵
              </kbd>
              open
            </span>
            <span className="flex items-center gap-1.5">
              <kbd className="px-1.5 py-0.5 bg-[var(--tovu-bg-elevated)] rounded border border-[var(--tovu-border-hairline)] text-[12px]">
                esc
              </kbd>
              close
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

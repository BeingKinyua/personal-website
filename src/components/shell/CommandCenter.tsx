import React, { useState, useEffect, useRef } from "react";
import { Search, Command, ArrowRight, CornerDownLeft, Sparkles, FolderKanban, BookOpen, FlaskConical, Network, Compass, X } from "lucide-react";
import { searchVictorOS, SearchResultItem } from "../../services/searchService";

interface CommandCenterProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (sectionId: string) => void;
  onOpenProject: (slug: string) => void;
  onOpenArticle: (slug: string) => void;
  onAskDoom: (prompt: string) => void;
}

export const CommandCenter: React.FC<CommandCenterProps> = ({
  isOpen,
  onClose,
  onNavigate,
  onOpenProject,
  onOpenArticle,
  onAskDoom
}) => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResultItem[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [activeFilter, setActiveFilter] = useState<string>("ALL");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setQuery("");
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  useEffect(() => {
    const rawResults = searchVictorOS(query);
    if (activeFilter === "ALL") {
      setResults(rawResults);
    } else {
      setResults(rawResults.filter((r) => r.module === activeFilter || r.module === "DOOM"));
    }
    setSelectedIndex(0);
  }, [query, activeFilter]);

  const handleSelect = (item: SearchResultItem) => {
    onClose();
    if (item.action.type === "navigate") {
      onNavigate(item.action.target);
    } else if (item.action.type === "open_project") {
      onOpenProject(item.action.target);
    } else if (item.action.type === "open_article") {
      onOpenArticle(item.action.target);
    } else if (item.action.type === "ask_doom") {
      onAskDoom(item.action.target);
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
        return <FolderKanban className="w-3.5 h-3.5 text-blue-400" />;
      case "JOURNAL":
        return <BookOpen className="w-3.5 h-3.5 text-amber-400" />;
      case "LAB":
        return <FlaskConical className="w-3.5 h-3.5 text-emerald-400" />;
      case "KNOWLEDGE":
        return <Network className="w-3.5 h-3.5 text-indigo-400" />;
      case "NAVIGATION":
        return <Compass className="w-3.5 h-3.5 text-zinc-400" />;
      case "DOOM":
        return <Sparkles className="w-3.5 h-3.5 text-purple-400" />;
      default:
        return <Command className="w-3.5 h-3.5 text-zinc-400" />;
    }
  };

  const filterTabs = ["ALL", "WORK", "JOURNAL", "LAB", "KNOWLEDGE", "DOOM"];

  return (
    <div
      id="command-center-modal"
      className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 px-4 bg-black/75 backdrop-blur-md animate-fadeIn"
      onClick={onClose}
    >
      <div
        id="command-center-dialog"
        className="relative w-full max-w-2xl rounded-2xl border border-white/10 bg-[#0d0f11] shadow-[0_25px_70px_rgba(0,0,0,0.8)] overflow-hidden text-zinc-100 flex flex-col max-h-[78vh]"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleKeyDown}
      >
        {/* Search input bar */}
        <div className="flex items-center px-4 py-3.5 border-b border-white/10 gap-3">
          <Search className="w-4 h-4 text-zinc-400 shrink-0" />
          <input
            ref={inputRef}
            id="command-center-input"
            type="text"
            placeholder="Search VictorOS systems, essays, experiments, or ask Doom..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full bg-transparent text-sm sm:text-base font-normal text-white placeholder-zinc-500 focus:outline-none tracking-wide"
          />
          {query && (
            <button
              onClick={() => setQuery("")}
              className="text-zinc-500 hover:text-white p-1 rounded transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <kbd className="hidden sm:inline-flex items-center px-2 py-0.5 text-[10px] font-mono text-zinc-400 bg-white/5 border border-white/10 rounded">
            ESC
          </kbd>
        </div>

        {/* Filter categories pills */}
        <div className="flex items-center gap-1.5 px-4 py-2 border-b border-white/5 overflow-x-auto scrollbar-none bg-[#090b0d]/50">
          {filterTabs.map((tab) => (
            <button
              key={tab}
              id={`cmd-filter-${tab.toLowerCase()}`}
              onClick={() => setActiveFilter(tab)}
              className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono tracking-wider transition-all cursor-pointer ${
                activeFilter === tab
                  ? "bg-white/15 text-white font-medium shadow-sm"
                  : "text-zinc-500 hover:text-zinc-300 hover:bg-white/5"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Results List */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1 divide-y divide-white/[0.03]">
          {results.length === 0 ? (
            <div className="py-12 text-center text-zinc-500 font-mono text-xs">
              No matching records located in VictorOS. Try another search or ask Dr. Doom.
            </div>
          ) : (
            results.map((item, index) => {
              const isSelected = index === selectedIndex;
              return (
                <div
                  key={item.id}
                  id={`cmd-result-${index}`}
                  onClick={() => handleSelect(item)}
                  onMouseEnter={() => setSelectedIndex(index)}
                  className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl cursor-pointer transition-all ${
                    isSelected
                      ? "bg-white/10 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.1)]"
                      : "text-zinc-300 hover:bg-white/[0.04]"
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="p-1.5 rounded-lg bg-white/5 border border-white/5 shrink-0">
                      {getModuleIcon(item.module)}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium tracking-wide truncate">
                          {item.title}
                        </span>
                        <span className="text-[9px] font-mono px-1.5 py-0.2 rounded border border-white/10 bg-white/5 text-zinc-400 shrink-0">
                          {item.module}
                        </span>
                      </div>
                      <p className="text-[11px] text-zinc-400 truncate mt-0.5">
                        {item.subtitle}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pl-3 shrink-0">
                    {isSelected && (
                      <span className="hidden sm:inline-flex items-center text-[10px] font-mono text-zinc-400 gap-1">
                        Select <CornerDownLeft className="w-3 h-3" />
                      </span>
                    )}
                    <ArrowRight className="w-3.5 h-3.5 text-zinc-500" />
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer shortcuts hint */}
        <div className="px-4 py-2.5 bg-[#090a0c] border-t border-white/10 flex items-center justify-between text-[11px] font-mono text-zinc-500">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-white/5 rounded border border-white/10 text-[10px]">↑↓</kbd> navigate
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-white/5 rounded border border-white/10 text-[10px]">↵</kbd> select
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-white/5 rounded border border-white/10 text-[10px]">esc</kbd> close
            </span>
          </div>
          <div className="hidden sm:flex items-center gap-1 text-zinc-400">
            <Sparkles className="w-3 h-3 text-blue-400" />
            <span>AI Ready</span>
          </div>
        </div>
      </div>
    </div>
  );
};

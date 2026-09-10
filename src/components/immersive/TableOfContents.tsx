import React, { useState, useEffect } from "react";
import { List, ChevronRight, X } from "lucide-react";

export interface ToCItem {
  id: string;
  label: string;
  level?: number;
}

interface TableOfContentsProps {
  items: ToCItem[];
  containerRef: React.RefObject<HTMLElement | null>;
  isOpen: boolean;
  onToggle: () => void;
  onClose: () => void;
}

export const TableOfContents: React.FC<TableOfContentsProps> = ({
  items,
  containerRef,
  isOpen,
  onToggle,
  onClose,
}) => {
  const [activeId, setActiveId] = useState<string>(items[0]?.id || "");

  // Detect active section based on reader scroller position
  useEffect(() => {
    const scroller = containerRef.current;
    if (!scroller || items.length === 0) return;

    const handleScroll = () => {
      const scrollPos = scroller.scrollTop + 140;

      for (let i = items.length - 1; i >= 0; i--) {
        const item = items[i];
        const el = scroller.querySelector(`#${item.id}`) as HTMLElement | null;
        if (el) {
          const top = el.offsetTop;
          if (scrollPos >= top) {
            setActiveId(item.id);
            break;
          }
        }
      }
    };

    scroller.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();

    return () => {
      scroller.removeEventListener("scroll", handleScroll);
    };
  }, [containerRef, items]);

  const scrollToItem = (id: string) => {
    const scroller = containerRef.current;
    if (!scroller) return;

    const target = scroller.querySelector(`#${id}`) as HTMLElement | null;
    if (target) {
      const targetTop = target.offsetTop - 90;
      scroller.scrollTo({
        top: Math.max(0, targetTop),
        behavior: "smooth",
      });
      setActiveId(id);
      onClose();
    }
  };

  if (items.length === 0) return null;

  return (
    <>
      {/* Popover / Drawer for Table of Contents */}
      {isOpen && (
        <div
          id="reader-toc-backdrop"
          className="fixed inset-0 z-[115] bg-black/40 backdrop-blur-sm flex items-start justify-end p-4 sm:p-6"
          onClick={(e) => {
            if (e.target === e.currentTarget) onClose();
          }}
        >
          <div
            id="reader-toc-panel"
            className="w-full max-w-xs mt-14 rounded-2xl border border-white/15 bg-[#0e1014] p-4 shadow-2xl animate-fadeIn"
          >
            <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-3">
              <span className="text-xs font-mono uppercase tracking-widest text-zinc-400">
                TABLE OF CONTENTS
              </span>
              <button
                onClick={onClose}
                className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <nav className="space-y-1 max-h-[60vh] overflow-y-auto scrollbar-thin pr-1">
              {items.map((item) => {
                const isActive = activeId === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => scrollToItem(item.id)}
                    className={`w-full text-left px-2.5 py-2 rounded-xl text-xs font-mono transition-all flex items-center justify-between group cursor-pointer ${
                      item.level === 3 ? "pl-5 text-[11px]" : ""
                    } ${
                      isActive
                        ? "bg-blue-500/15 text-blue-300 border border-blue-500/30 font-medium"
                        : "text-zinc-400 hover:text-white hover:bg-white/5 border border-transparent"
                    }`}
                  >
                    <span className="truncate pr-2">{item.label}</span>
                    <ChevronRight
                      className={`w-3 h-3 transition-transform ${
                        isActive
                          ? "text-blue-400 translate-x-0.5"
                          : "text-zinc-600 group-hover:text-zinc-400 group-hover:translate-x-0.5"
                      }`}
                    />
                  </button>
                );
              })}
            </nav>
          </div>
        </div>
      )}
    </>
  );
};

import React, { useState, useEffect } from "react";
import { ChevronRight, X } from "lucide-react";

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
  onClose,
}) => {
  const [activeId, setActiveId] = useState<string>(items[0]?.id || "");

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

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

  if (items.length === 0 || !isOpen) return null;

  return (
    <div
      id="reader-toc-backdrop"
      role="dialog"
      aria-modal="true"
      aria-labelledby="reader-toc-title"
      className="fixed inset-0 z-[115] bg-[var(--tovu-bg-overlay)] backdrop-blur-sm flex items-start justify-end p-4 sm:p-6"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        id="reader-toc-panel"
        className="w-full max-w-xs mt-14 rounded-2xl border border-[var(--tovu-border-strong)] bg-[var(--tovu-bg-elevated)] p-4 shadow-2xl text-[var(--tovu-text-primary)]"
      >
        <div className="flex items-center justify-between pb-3 border-b border-[var(--tovu-border-hairline)] mb-3">
          <span
            id="reader-toc-title"
            className="text-[13px] font-mono uppercase tracking-[0.12em] text-[var(--tovu-text-muted)]"
          >
            Table of Contents
          </span>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close table of contents"
            className="w-10 h-10 inline-flex items-center justify-center rounded-xl text-[var(--tovu-text-muted)] hover:text-[var(--tovu-text-primary)] hover:bg-[var(--tovu-bg-inset)] transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <nav aria-label="Article sections" className="space-y-1 max-h-[60vh] overflow-y-auto scrollbar-thin pr-1">
          {items.map((item) => {
            const isActive = activeId === item.id;
            return (
              <button
                type="button"
                key={item.id}
                onClick={() => scrollToItem(item.id)}
                aria-current={isActive ? "location" : undefined}
                className={`w-full min-h-[40px] text-left px-3 py-2 rounded-xl text-[14px] transition-colors flex items-center justify-between group cursor-pointer ${
                  item.level === 3 ? "pl-6 text-[13px]" : ""
                } ${
                  isActive
                    ? "bg-[var(--tovu-accent-subtle)] text-[var(--tovu-text-primary)] border border-[var(--tovu-accent-border)] font-medium"
                    : "text-[var(--tovu-text-secondary)] hover:text-[var(--tovu-text-primary)] hover:bg-[var(--tovu-bg-inset)] border border-transparent"
                }`}
              >
                <span className="truncate pr-2">{item.label}</span>
                <ChevronRight
                  className={`w-3.5 h-3.5 shrink-0 transition-transform ${
                    isActive
                      ? "text-[var(--tovu-accent)] translate-x-0.5"
                      : "text-[var(--tovu-text-muted)] group-hover:text-[var(--tovu-text-primary)] group-hover:translate-x-0.5"
                  }`}
                />
              </button>
            );
          })}
        </nav>
      </div>
    </div>
  );
};

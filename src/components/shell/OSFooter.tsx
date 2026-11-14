import React from "react";
import { ArrowUp } from "lucide-react";

interface OSFooterProps {
  onScrollToTop: () => void;
  onNavigate: (sectionId: string) => void;
}

const FOOTER_LINKS = [
  { id: "work", label: "Work" },
  { id: "journal", label: "Journal" },
  { id: "lab", label: "Lab" },
  { id: "knowledge", label: "Knowledge" },
  { id: "about", label: "About" },
  { id: "contact", label: "Contact" },
];

export const OSFooter: React.FC<OSFooterProps> = ({ onScrollToTop, onNavigate }) => {
  return (
    <footer className="border-t border-[var(--tovu-border-hairline)] bg-[var(--tovu-bg-canvas)] py-14 px-5 sm:px-8 text-[var(--tovu-text-muted)] transition-colors duration-200">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
        <div className="flex items-center gap-3 text-sm">
          <span className="font-display text-lg font-bold text-[var(--tovu-text-primary)] tracking-tight">
            Tovu
          </span>
          <span aria-hidden="true" className="text-[var(--tovu-border-strong)]">·</span>
          <span>Victor Kinyua</span>
        </div>

        <nav aria-label="Footer navigation" className="flex flex-wrap items-center gap-6 text-[15px]">
          {FOOTER_LINKS.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => onNavigate(item.id)}
              className="hover:text-[var(--tovu-text-primary)] transition-colors cursor-pointer py-1 whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--tovu-accent)] rounded"
            >
              {item.label}
            </button>
          ))}
        </nav>

        <div className="flex items-center gap-4 text-[14px]">
          <span className="tabular-nums">© {new Date().getFullYear()} Victor Kinyua</span>
          <button
            type="button"
            onClick={onScrollToTop}
            aria-label="Scroll to top"
            title="Scroll to top"
            className="w-10 h-10 inline-flex items-center justify-center rounded-xl border border-[var(--tovu-border-hairline)] bg-[var(--tovu-bg-surface)] hover:border-[var(--tovu-border-strong)] text-[var(--tovu-text-secondary)] hover:text-[var(--tovu-text-primary)] transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--tovu-accent)]"
          >
            <ArrowUp className="w-4 h-4" />
          </button>
        </div>
      </div>
    </footer>
  );
};

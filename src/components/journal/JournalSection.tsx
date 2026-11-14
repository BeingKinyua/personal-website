import React from "react";
import { ArrowRight, ArrowUpRight, FileCode2, Shield } from "lucide-react";
import { ARTICLES } from "../../data/articles";

interface JournalSectionProps {
  selectedSlug: string | null;
  onSelectArticle: (slug: string | null) => void;
}

export const JournalSection: React.FC<JournalSectionProps> = ({
  selectedSlug: _selectedSlug,
  onSelectArticle,
}) => {
  return (
    <section
      id="journal"
      className="relative py-24 sm:py-32 px-5 sm:px-8 lg:px-10 max-w-7xl mx-auto text-[var(--tovu-text-primary)] border-t border-[var(--tovu-border-hairline)]"
    >
      {/* Editorial Section Header */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-14">
        <div>
          <p className="text-[13px] font-mono tracking-[0.14em] uppercase text-[var(--tovu-accent)] mb-3">
            02 · Journal
          </p>
          <h2 className="font-display font-semibold tracking-[-0.025em] text-[var(--tovu-text-primary)] leading-[1.06] text-[clamp(2.25rem,4.4vw,4rem)]">
            Thinking Out Loud
          </h2>
        </div>

        <p className="text-[17px] text-[var(--tovu-text-secondary)] max-w-md leading-[1.6]">
          Long-form essays on deterministic AI boundaries, storage engine physics, and software craft.
        </p>
      </div>

      {/* Editorial Bento Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-6">
        {ARTICLES.map((article, index) => {
          const isWide = article.bentoSpan === "wide";
          return (
            <article
              key={article.id}
              id={`journal-card-${article.id}`}
              className={`group rounded-2xl border border-[var(--tovu-border-hairline)] hover:border-[var(--tovu-accent-border)] bg-[var(--tovu-bg-surface)] p-7 sm:p-9 transition-colors duration-300 flex flex-col justify-between gap-7 ${
                isWide ? "md:col-span-2 lg:col-span-7" : "lg:col-span-5"
              }`}
            >
              <div className="space-y-4">
                {/* Unboxed Editorial Metadata */}
                <div className="flex flex-wrap items-center gap-2.5 text-[13px] font-mono text-[var(--tovu-text-muted)]">
                  <span className="text-[var(--tovu-accent)] font-medium">
                    {article.category}
                  </span>
                  <span aria-hidden="true">·</span>
                  <span className="tabular-nums">{article.date}</span>
                  <span aria-hidden="true">·</span>
                  <span className="tabular-nums">{article.readTime}</span>
                </div>

                {/* Title */}
                <h3 className="font-display font-semibold tracking-tight text-[var(--tovu-text-primary)] text-[clamp(1.5rem,2.1vw,2rem)] leading-[1.18]">
                  <button
                    type="button"
                    onClick={() => onSelectArticle(article.slug)}
                    className="text-left group-hover:text-[var(--tovu-accent)] transition-colors cursor-pointer focus-visible:outline-none focus-visible:underline"
                  >
                    {article.title}
                  </button>
                </h3>

                {/* Summary */}
                <p className="text-base sm:text-[17px] text-[var(--tovu-text-secondary)] leading-[1.65] max-w-[60ch]">
                  {article.summary}
                </p>

                {/* Conceptual Diagram Cue */}
                {article.visualType === "graph" && (
                  <div className="w-full rounded-xl border border-[var(--tovu-border-hairline)] bg-[var(--tovu-bg-inset)] p-4 mt-2 flex flex-wrap items-center justify-around gap-3 font-mono text-[13px] text-[var(--tovu-text-secondary)]">
                    <span className="px-3 py-1.5 rounded-lg bg-[var(--tovu-bg-elevated)] border border-[var(--tovu-border-hairline)]">
                      User Intent
                    </span>
                    <ArrowRight className="w-4 h-4 text-[var(--tovu-accent)] shrink-0" aria-hidden="true" />
                    <span className="px-3 py-1.5 rounded-lg bg-[var(--tovu-accent-soft)] border border-[var(--tovu-accent-border)] text-[var(--tovu-accent)] font-medium">
                      State Machine
                    </span>
                    <ArrowRight className="w-4 h-4 text-[var(--tovu-accent)] shrink-0" aria-hidden="true" />
                    <span className="px-3 py-1.5 rounded-lg bg-[var(--tovu-bg-elevated)] border border-[var(--tovu-border-hairline)]">
                      Verified Output
                    </span>
                  </div>
                )}

                {article.visualType === "enclave" && (
                  <div className="w-full rounded-xl border border-[var(--tovu-border-hairline)] bg-[var(--tovu-bg-inset)] p-4 mt-2 flex flex-wrap items-center justify-between gap-3 font-mono text-[13px] text-[var(--tovu-text-secondary)]">
                    <div className="flex items-center gap-2">
                      <FileCode2 className="w-4 h-4 text-[var(--tovu-accent)]" aria-hidden="true" />
                      <span>MemTable (RAM)</span>
                    </div>
                    <span className="text-[var(--tovu-text-muted)]" aria-hidden="true">→ Flush →</span>
                    <div className="flex items-center gap-2">
                      <Shield className="w-4 h-4 text-[var(--tovu-accent)]" aria-hidden="true" />
                      <span>SSTable (Disk)</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Footer: Unboxed Tags & Read Action */}
              <div className="pt-5 border-t border-[var(--tovu-border-hairline)] flex flex-wrap items-center justify-between gap-4">
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[13px] font-mono text-[var(--tovu-text-muted)]">
                  {article.tags.slice(0, 3).map((tag, tagIdx) => (
                    <React.Fragment key={tag}>
                      {tagIdx > 0 && <span aria-hidden="true">·</span>}
                      <span>{tag}</span>
                    </React.Fragment>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={() => onSelectArticle(article.slug)}
                  className="min-h-[40px] inline-flex items-center gap-1.5 text-[15px] font-medium text-[var(--tovu-text-primary)] hover:text-[var(--tovu-accent)] transition-colors cursor-pointer whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--tovu-accent)] rounded-lg px-2 py-1"
                >
                  <span>Read Essay</span>
                  <ArrowUpRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </button>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
};

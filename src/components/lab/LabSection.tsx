import React, { useEffect, useState } from "react";
import { ChevronDown, Terminal, RefreshCw } from "lucide-react";
import { useLabsData } from "../../hooks/useContentData";

export const LabSection: React.FC = () => {
  const { data: experiments, loading, error, isFixture, reload } = useLabsData();
  const [filter, setFilter] = useState<string>("ALL");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    if (experiments.length > 0 && expandedId === null) {
      setExpandedId(experiments[0].id);
    }
  }, [experiments, expandedId]);

  const filteredExperiments =
    filter === "ALL"
      ? experiments
      : experiments.filter((e) => e.status === filter);

  return (
    <section
      id="lab"
      className="relative py-24 sm:py-32 px-5 sm:px-8 lg:px-10 max-w-7xl mx-auto text-[var(--tovu-text-primary)] border-t border-[var(--tovu-border-hairline)]"
    >
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-12">
        <div>
          <p className="text-[13px] font-mono tracking-[0.14em] uppercase text-[var(--tovu-accent)] mb-3">
            03 · Laboratory
            {isFixture && (
              <span className="ml-3 text-[12px] tracking-[0.06em] text-[var(--tovu-text-muted)]">
                (Dev Fixture Mode)
              </span>
            )}
          </p>
          <h2 className="font-display font-semibold tracking-[-0.025em] text-[var(--tovu-text-primary)] leading-[1.06] text-[clamp(2.25rem,4.4vw,4rem)]">
            Active R&amp;D &amp; Prototypes
          </h2>
        </div>

        <p className="text-[17px] text-[var(--tovu-text-secondary)] max-w-md leading-[1.6]">
          Work holds finished systems. Lab is the research notebook where hypotheses are tested, benchmarked, or archived.
        </p>
      </div>

      {/* Filter Controls */}
      <div
        role="tablist"
        aria-label="Filter experiments by status"
        className="inline-flex flex-wrap items-center gap-1.5 p-1.5 rounded-xl bg-[var(--tovu-bg-surface)] border border-[var(--tovu-border-hairline)] mb-10"
      >
        {["ALL", "Building", "Prototype", "Exploring", "Idea"].map((status) => {
          const isActive = filter === status;
          return (
            <button
              key={status}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => setFilter(status)}
              className={`min-h-[40px] px-4 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--tovu-accent)] ${
                isActive
                  ? "bg-[var(--tovu-text-primary)] text-[var(--tovu-bg-canvas)] shadow-sm"
                  : "text-[var(--tovu-text-muted)] hover:text-[var(--tovu-text-primary)]"
              }`}
            >
              {status === "ALL" ? "All" : status}
            </button>
          );
        })}
      </div>

      {/* Loading */}
      {loading && (
        <div aria-busy="true" aria-label="Loading laboratory experiments" className="divide-y divide-[var(--tovu-border-hairline)] border-y border-[var(--tovu-border-hairline)]">
          {[0, 1, 2].map((idx) => (
            <div key={idx} className="py-8 space-y-3 animate-pulse">
              <div className="h-4 w-52 rounded bg-[var(--tovu-bg-inset)]" />
              <div className="h-7 w-2/3 rounded bg-[var(--tovu-bg-inset)]" />
              <div className="h-4 w-full max-w-xl rounded bg-[var(--tovu-bg-inset)]" />
            </div>
          ))}
        </div>
      )}

      {/* Error */}
      {!loading && error && (
        <div className="rounded-2xl border border-[var(--tovu-border-hairline)] bg-[var(--tovu-bg-surface)] p-8 sm:p-10 max-w-2xl space-y-4">
          <p className="text-[13px] font-mono uppercase tracking-wider text-[var(--tovu-accent)]">
            Laboratory Service Unavailable
          </p>
          <p className="text-base sm:text-[17px] text-[var(--tovu-text-secondary)] leading-relaxed">
            {error}
          </p>
          <button
            type="button"
            onClick={reload}
            className="min-h-[44px] inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[var(--tovu-text-primary)] text-[var(--tovu-bg-canvas)] text-sm font-medium cursor-pointer hover:opacity-90 transition-opacity"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Retry</span>
          </button>
        </div>
      )}

      {/* Empty */}
      {!loading && !error && filteredExperiments.length === 0 && (
        <div className="rounded-2xl border border-[var(--tovu-border-hairline)] bg-[var(--tovu-bg-surface)] p-8 sm:p-10 max-w-2xl space-y-2">
          <p className="text-[13px] font-mono uppercase tracking-wider text-[var(--tovu-text-muted)]">
            No Matching Experiments
          </p>
          <p className="text-base text-[var(--tovu-text-secondary)]">
            No active laboratory records match the current filter.
          </p>
        </div>
      )}

      {/* Research Log Entries */}
      {!loading && !error && filteredExperiments.length > 0 && (
        <div className="divide-y divide-[var(--tovu-border-hairline)] border-y border-[var(--tovu-border-hairline)]">
          {filteredExperiments.map((exp) => {
            const isExpanded = expandedId === exp.id;

            return (
              <div key={exp.id} id={`lab-card-${exp.id}`} className="py-7 sm:py-9">
                <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
                  <div className="space-y-3 max-w-3xl">
                    {/* Unboxed Experiment Index & Status */}
                    <div className="flex flex-wrap items-center gap-2.5 text-[13px] font-mono text-[var(--tovu-text-muted)]">
                      <span className="font-semibold text-[var(--tovu-accent)] tabular-nums">
                        {exp.number}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span>{exp.category}</span>
                      <span aria-hidden="true">·</span>
                      <span className="text-[var(--tovu-text-primary)] font-medium">
                        Status: {exp.status}
                      </span>
                    </div>

                    <h3 className="font-display font-semibold tracking-tight text-[var(--tovu-text-primary)] text-[clamp(1.5rem,2.2vw,2rem)] leading-[1.2]">
                      {exp.title}
                    </h3>

                    <p className="text-base sm:text-[17px] text-[var(--tovu-text-secondary)] leading-[1.65]">
                      <span className="font-mono text-[13px] uppercase tracking-wider text-[var(--tovu-text-muted)] mr-2.5">
                        Hypothesis
                      </span>
                      {exp.hypothesis}
                    </p>
                  </div>

                  {/* Metrics & Expand Toggle */}
                  <div className="flex flex-wrap sm:flex-nowrap items-center gap-6 shrink-0 lg:pt-2">
                    {exp.metrics && exp.metrics.length > 0 && (
                      <div className="flex items-center gap-6 pr-6 border-r border-[var(--tovu-border-hairline)]">
                        {exp.metrics.slice(0, 2).map((m, i) => (
                          <div key={i} className="font-mono">
                            <div className="text-lg sm:text-xl font-semibold text-[var(--tovu-accent)] tabular-nums">
                              {m.value}
                            </div>
                            <div className="text-[13px] text-[var(--tovu-text-muted)]">
                              {m.label}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    <button
                      type="button"
                      aria-expanded={isExpanded}
                      onClick={() => setExpandedId(isExpanded ? null : exp.id)}
                      className="min-h-[44px] inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-[var(--tovu-border-hairline)] bg-[var(--tovu-bg-surface)] hover:border-[var(--tovu-border-strong)] text-sm font-medium text-[var(--tovu-text-primary)] transition-colors cursor-pointer whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--tovu-accent)]"
                    >
                      <span>{isExpanded ? "Hide Notes" : "Inspect Notes"}</span>
                      <ChevronDown
                        className={`w-4 h-4 transition-transform duration-200 ${
                          isExpanded ? "rotate-180" : ""
                        }`}
                      />
                    </button>
                  </div>
                </div>

                {/* Expanded Research Notes */}
                {isExpanded && (
                  <div className="mt-7 pt-7 border-t border-[var(--tovu-border-hairline)] space-y-7">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="space-y-2">
                        <h4 className="text-[13px] font-mono uppercase tracking-wider text-[var(--tovu-text-muted)]">
                          Current State
                        </h4>
                        <p className="text-base sm:text-[17px] text-[var(--tovu-text-secondary)] leading-[1.65]">
                          {exp.currentState}
                        </p>
                      </div>

                      <div className="space-y-2">
                        <h4 className="text-[13px] font-mono uppercase tracking-wider text-[var(--tovu-accent)]">
                          Next Experiment
                        </h4>
                        <p className="text-base sm:text-[17px] text-[var(--tovu-text-secondary)] leading-[1.65]">
                          {exp.nextExperiment}
                        </p>
                      </div>
                    </div>

                    {exp.snippet && (
                      <div className="space-y-2.5">
                        <div className="flex items-center justify-between text-[13px] font-mono text-[var(--tovu-text-muted)]">
                          <span className="inline-flex items-center gap-2">
                            <Terminal className="w-4 h-4 text-[var(--tovu-accent)]" />
                            {exp.snippet.filename}
                          </span>
                          <span className="uppercase">{exp.snippet.language}</span>
                        </div>
                        <div className="rounded-xl border border-[var(--tovu-border-hairline)] bg-[var(--tovu-bg-inset)] p-5 font-mono text-[13px] sm:text-sm text-[var(--tovu-text-secondary)] overflow-x-auto leading-relaxed">
                          <pre>
                            <code>{exp.snippet.code}</code>
                          </pre>
                        </div>
                      </div>
                    )}

                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[13px] font-mono text-[var(--tovu-text-muted)]">
                      {exp.tags.map((tag, idx) => (
                        <React.Fragment key={tag}>
                          {idx > 0 && <span aria-hidden="true">·</span>}
                          <span>{tag}</span>
                        </React.Fragment>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
};

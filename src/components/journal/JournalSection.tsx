import React from "react";
import { BookOpen, ArrowRight, Clock, Calendar, ArrowUpRight, FileCode2, Network, Shield } from "lucide-react";
import { ARTICLES } from "../../data/articles";
import { ArticleReaderModal } from "./ArticleReaderModal";

interface JournalSectionProps {
  selectedSlug: string | null;
  onSelectArticle: (slug: string | null) => void;
}

export const JournalSection: React.FC<JournalSectionProps> = ({
  selectedSlug,
  onSelectArticle
}) => {
  return (
    <section id="journal" className="py-24 px-4 sm:px-6 max-w-7xl mx-auto text-zinc-100">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-12">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="w-2 h-2 rounded-full bg-amber-400" />
            <span className="text-xs font-mono tracking-widest text-zinc-400 uppercase">
              JOURNAL // EDITORIAL ARCHIVE
            </span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-mono font-medium text-white tracking-tight">
            Engineering Thinking
          </h2>
        </div>
        <p className="text-sm text-zinc-400 max-w-md font-normal">
          Essays on deterministic AI boundaries, storage engine physics, and the virtue of strict architectural constraints.
        </p>
      </div>

      {/* Bento Grid Layout (Section 10) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {ARTICLES.map((article) => {
          const isWide = article.bentoSpan === "wide";
          return (
            <div
              key={article.id}
              id={`journal-card-${article.id}`}
              onClick={() => onSelectArticle(article.slug)}
              className={`group relative rounded-3xl border border-white/10 bg-[#0d0f12] hover:bg-[#121519] p-6 sm:p-8 transition-all duration-300 cursor-pointer hover:border-amber-400/40 hover:shadow-2xl flex flex-col justify-between ${
                isWide ? "md:col-span-2" : "col-span-1"
              }`}
            >
              <div>
                {/* Meta Header */}
                <div className="flex items-center justify-between gap-2 mb-4">
                  <span className="text-xs font-mono uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-amber-400/10 text-amber-300 border border-amber-400/20">
                    {article.category}
                  </span>
                  <div className="flex items-center gap-3 text-xs font-mono text-zinc-500">
                    <span>{article.date}</span>
                    <span>·</span>
                    <span>{article.readTime}</span>
                  </div>
                </div>

                {/* Title */}
                <h3 className="text-xl sm:text-2xl font-mono font-medium text-white mb-3 group-hover:text-amber-200 transition-colors tracking-tight">
                  {article.title}
                </h3>

                {/* Summary */}
                <p className="text-sm text-zinc-400 leading-relaxed mb-6 line-clamp-3">
                  {article.summary}
                </p>

                {/* Visual Cue inside card based on visualType */}
                {article.visualType === "graph" && (
                  <div className="w-full h-24 rounded-xl border border-white/5 bg-black/40 p-3 mb-6 relative overflow-hidden flex items-center justify-around font-mono text-[10px] text-zinc-400">
                    <div className="px-2 py-1 rounded bg-white/5 border border-white/10">User Intent</div>
                    <ArrowRight className="w-3.5 h-3.5 text-amber-400" />
                    <div className="px-2 py-1 rounded bg-blue-500/10 border border-blue-500/20 text-blue-300">Deterministic State Machine</div>
                    <ArrowRight className="w-3.5 h-3.5 text-amber-400" />
                    <div className="px-2 py-1 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-300">Verified Output</div>
                  </div>
                )}

                {article.visualType === "enclave" && (
                  <div className="w-full h-20 rounded-xl border border-white/5 bg-black/40 p-3 mb-6 flex items-center justify-between font-mono text-[10px] text-zinc-400">
                    <div className="flex items-center gap-1.5">
                      <FileCode2 className="w-4 h-4 text-amber-400" />
                      <span>MemTable (RAM)</span>
                    </div>
                    <span>──(Flush)──►</span>
                    <div className="flex items-center gap-1.5">
                      <Shield className="w-4 h-4 text-emerald-400" />
                      <span>SSTable (Disk)</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Footer row: Tags & Action */}
              <div className="pt-4 border-t border-white/5 flex items-center justify-between">
                <div className="flex flex-wrap gap-1.5">
                  {article.tags.slice(0, 3).map((tag) => (
                    <span
                      key={tag}
                      className="text-[11px] font-mono text-zinc-500"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>

                <div className="inline-flex items-center gap-1 text-xs font-mono text-zinc-400 group-hover:text-amber-300 transition-colors">
                  <span>Read Essay</span>
                  <ArrowUpRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Article Reader Modal */}
      <ArticleReaderModal
        slug={selectedSlug}
        onClose={() => onSelectArticle(null)}
        onSelectArticle={onSelectArticle}
      />
    </section>
  );
};

import React, { useState, useEffect } from "react";
import { X, Clock, Calendar, Tag, ArrowLeft, ArrowRight, BookOpen, Share2 } from "lucide-react";
import Markdown from "react-markdown";
import { Article } from "../../types/article";
import { ARTICLES } from "../../data/articles";

interface ArticleReaderModalProps {
  slug: string | null;
  onClose: () => void;
  onSelectArticle: (slug: string) => void;
}

export const ArticleReaderModal: React.FC<ArticleReaderModalProps> = ({
  slug,
  onClose,
  onSelectArticle
}) => {
  if (!slug) return null;

  const article = ARTICLES.find((a) => a.slug === slug || a.id === slug) || ARTICLES[0];
  const currentIndex = ARTICLES.findIndex((a) => a.id === article.id);
  const prevArticle = currentIndex > 0 ? ARTICLES[currentIndex - 1] : null;
  const nextArticle = currentIndex < ARTICLES.length - 1 ? ARTICLES[currentIndex + 1] : null;

  const [scrollProgress, setScrollProgress] = useState(0);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    const progress = (scrollTop / (scrollHeight - clientHeight)) * 100;
    setScrollProgress(Math.min(100, Math.max(0, progress)));
  };

  return (
    <div
      id="article-reader-backdrop"
      className="fixed inset-0 z-50 bg-black/90 backdrop-blur-xl animate-fadeIn text-zinc-100 flex justify-center overflow-hidden"
    >
      {/* Top Reading Progress Bar */}
      <div className="fixed top-0 left-0 right-0 h-1 bg-white/5 z-50">
        <div
          className="h-full bg-blue-500 transition-all duration-75"
          style={{ width: `${scrollProgress}%` }}
        />
      </div>

      <div
        id="article-reader-container"
        onScroll={handleScroll}
        className="relative w-full h-full overflow-y-auto"
      >
        {/* Sticky Header */}
        <div className="sticky top-0 z-40 flex items-center justify-between px-6 py-4 border-b border-white/10 bg-[#090b0e]/90 backdrop-blur-md max-w-4xl mx-auto w-full">
          <button
            onClick={onClose}
            className="flex items-center gap-2 text-xs font-mono text-zinc-400 hover:text-white transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>BACK TO JOURNAL</span>
          </button>

          <div className="flex items-center gap-3">
            <span className="text-xs font-mono text-zinc-500 hidden sm:inline">
              {article.readTime}
            </span>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Article Body - Constrained to 65-75ch */}
        <article className="max-w-[70ch] mx-auto px-6 py-12 sm:py-16 text-zinc-200">
          {/* Metadata */}
          <div className="space-y-3 mb-8">
            <div className="flex items-center gap-3 text-xs font-mono text-zinc-500">
              <span className="px-2.5 py-0.5 rounded bg-blue-500/10 text-blue-300 border border-blue-500/20 uppercase">
                {article.category}
              </span>
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" />
                {article.date}
              </span>
              <span>·</span>
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                {article.readTime}
              </span>
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-mono font-medium text-white tracking-tight leading-[1.2]">
              {article.title}
            </h1>

            <p className="text-base sm:text-lg text-zinc-400 font-normal leading-relaxed pt-2 border-t border-white/5">
              {article.summary}
            </p>
          </div>

          {/* Tags */}
          <div className="flex flex-wrap gap-1.5 mb-12 pb-6 border-b border-white/10">
            {article.tags.map((tag) => (
              <span
                key={tag}
                className="text-xs font-mono px-2.5 py-1 rounded-full bg-white/5 text-zinc-400 border border-white/5"
              >
                #{tag}
              </span>
            ))}
          </div>

          {/* Markdown Content */}
          <div className="prose prose-invert prose-blue max-w-none text-zinc-300 leading-relaxed font-normal space-y-6 text-base sm:text-lg">
            <Markdown>{article.content}</Markdown>
          </div>

          {/* Next / Previous Navigation */}
          <div className="mt-20 pt-8 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4 font-mono text-xs">
            {prevArticle ? (
              <button
                onClick={() => onSelectArticle(prevArticle.slug)}
                className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                <span className="truncate max-w-xs">{prevArticle.title}</span>
              </button>
            ) : <div />}

            {nextArticle && (
              <button
                onClick={() => onSelectArticle(nextArticle.slug)}
                className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors cursor-pointer"
              >
                <span className="truncate max-w-xs">{nextArticle.title}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </article>
      </div>
    </div>
  );
};

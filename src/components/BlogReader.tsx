import React, { useEffect, useState, useRef } from "react";
import { X, Calendar, Clock, Bookmark, ArrowLeft } from "lucide-react";
import { Post } from "../types";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

interface BlogReaderProps {
  post: Post | null;
  onClose: () => void;
}

interface TocItem {
  id: string;
  text: string;
}

export default function BlogReader({ post, onClose }: BlogReaderProps) {
  const [scrollProgress, setScrollProgress] = useState(0);
  const [activeHeadingId, setActiveHeadingId] = useState("");
  const overlayRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  // Parse table of contents lines dynamically from the article body
  const tocItems: TocItem[] = post
    ? post.content
        .split("\n")
        .filter((line) => line.trim().startsWith("## "))
        .map((line) => {
          const text = line.replace("## ", "").trim();
          const id = text
            .toLowerCase()
            .replace(/[^a-z0-9 ]/g, "")
            .replace(/\s+/g, "-");
          return { id, text };
        })
    : [];

  useEffect(() => {
    if (post) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [post]);

  useEffect(() => {
    if (!post) return;
    const ctx = gsap.context(() => {
      const headings = gsap.utils.toArray("h2, h3");
      headings.forEach((heading: any) => {
        gsap.fromTo(heading,
          { opacity: 0, y: 25 },
          {
            opacity: 1,
            y: 0,
            duration: 0.65,
            ease: "power2.out",
            scrollTrigger: {
              trigger: heading,
              scroller: "#blog-reader-overlay",
              start: "top 88%",
              once: true,
            }
          }
        );
      });
    }, contentRef);

    return () => ctx.revert();
  }, [post]);

  // Handle scroll events inside the overlay to track progress and active heading
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const target = e.currentTarget;
    const scrollTop = target.scrollTop;
    const scrollHeight = target.scrollHeight;
    const clientHeight = target.clientHeight;

    // 1. Calculate reading progress percentage
    const maxScroll = scrollHeight - clientHeight;
    const progress = maxScroll > 0 ? (scrollTop / maxScroll) * 100 : 0;
    setScrollProgress(progress);

    // 2. Identify which header is currently in view
    if (!contentRef.current) return;
    const headings = contentRef.current.querySelectorAll("h2[id], h3[id]");
    let currentActive = "";

    // Header passes active mark when its top is within the upper 30% of client view
    const triggerLine = clientHeight * 0.35;

    headings.forEach((heading) => {
      const rect = heading.getBoundingClientRect();
      // If the heading has scrolled near or past our trigger mark
      if (rect.top <= triggerLine) {
        currentActive = heading.id;
      }
    });

    if (currentActive) {
      setActiveHeadingId(currentActive);
    } else if (tocItems.length > 0) {
      setActiveHeadingId(tocItems[0].id);
    }
  };

  if (!post) return null;

  // Jump to specific header section smoothly
  const scrollToHeader = (id: string) => {
    if (!overlayRef.current) return;
    const element = overlayRef.current.querySelector(`#${id}`);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
      setActiveHeadingId(id);
    }
  };

  // Modern parser formatting headings, subheadings, lists, blockquotes, math syntax, and code specs
  const renderFormattedContent = (content: string) => {
    const lines = content.split("\n");
    let inCodeBlock = false;
    let codeLanguage = "";
    let codeContent: string[] = [];

    return lines.map((line, idx) => {
      // Handle Code Block boundary
      if (line.trim().startsWith("```")) {
        if (inCodeBlock) {
          inCodeBlock = false;
          const mergedCode = codeContent.join("\n");
          codeContent = [];
          return (
            <div key={idx} className="my-8 group relative">
              <div className="flex items-center justify-between px-4 py-2.5 bg-[#0e1012] border border-white/5 rounded-t-xl border-b-0 font-mono text-[11px] text-slate-400">
                <span className="text-slate-400">spec_engine // stdout</span>
                <span className="text-[10px] uppercase font-bold text-[#c3c0ff] tracking-widest">{codeLanguage || "text"}</span>
              </div>
              <pre className="bg-[#050607] border border-white/5 p-5 rounded-b-xl text-xs sm:text-[13px] overflow-auto font-mono text-[#c3c0ff] leading-relaxed max-h-[450px]">
                <code>{mergedCode}</code>
              </pre>
            </div>
          );
        } else {
          inCodeBlock = true;
          codeLanguage = line.trim().replace("```", "");
          return null;
        }
      }

      if (inCodeBlock) {
        codeContent.push(line);
        return null;
      }

      // Handle Headings (H2 has ID anchor)
      if (line.trim().startsWith("## ")) {
        const text = line.replace("## ", "").trim();
        const id = text
          .toLowerCase()
          .replace(/[^a-z0-9 ]/g, "")
          .replace(/\s+/g, "-");
        return (
          <h2 
            key={idx} 
            id={id}
            className="text-2xl md:text-3xl font-extrabold text-white tracking-tight leading-tight mt-12 mb-4 pt-10 border-t border-white/5"
          >
            {text}
          </h2>
        );
      }

      // Handle Subheadings (H3)
      if (line.trim().startsWith("### ")) {
        const text = line.replace("### ", "").trim();
        return (
          <h3 
            key={idx} 
            className="text-lg md:text-xl font-bold text-[#c3c0ff] tracking-tight mt-8 mb-3"
          >
            {text}
          </h3>
        );
      }

      // Handle blockquotes
      if (line.trim().startsWith("> ")) {
        return (
          <blockquote key={idx} className="border-l-[3px] border-[#c3c0ff] pl-5 py-2 my-8 text-slate-300 italic bg-[#c3c0ff]/5 rounded-r-lg font-serif text-lg leading-relaxed">
            {line.replace("> ", "").trim()}
          </blockquote>
        );
      }

      // Handle bullet lists
      if (line.trim().startsWith("- ")) {
        return (
          <li key={idx} className="list-none flex items-start gap-2.5 my-3.5 text-slate-300 text-base md:text-lg leading-relaxed font-sans">
            <span className="w-1.5 h-1.5 rounded-full bg-[#c3c0ff] mt-2.5 shrink-0" />
            <span>{line.replace("- ", "").trim()}</span>
          </li>
        );
      }

      // Handle raw inline Math or formulas (simply style gracefully)
      if (line.includes("$$")) {
        // Simple display matching inline formulas
        const formula = line.replace(/\$\$/g, "").trim();
        return (
          <div key={idx} className="my-6 p-4 bg-[#c3c0ff]/5 border border-white/5 rounded-xl text-center font-mono text-xs md:text-sm text-[#dad7ff] overflow-x-auto">
            {formula}
          </div>
        );
      }

      // Empty states
      if (line.trim() === "") return <div key={idx} className="h-4" />;

      // Paragraph formatting (Medium style)
      return (
        <p key={idx} className="text-base md:text-lg text-slate-300 font-sans leading-relaxed md:leading-loose my-6 font-light">
          {line}
        </p>
      );
    });
  };

  return (
    <div 
      ref={overlayRef}
      id="blog-reader-overlay"
      className="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-90 backdrop-blur-2xl flex justify-center selection:bg-[#c3c0ff] selection:text-[#1d00a5]"
      onClick={onClose}
      onScroll={handleScroll}
    >
      {/* 1. Scroll Progress Bar */}
      <div 
        id="reader-progress-indicator"
        className="fixed top-0 left-0 h-[3px] bg-[#c3c0ff] z-55 shadow-[0_0_10px_#c3c0ff] transition-all duration-75"
        style={{ width: `${scrollProgress}%` }}
      />

      {/* 2. Reader Body Grid CONTAINER */}
      <div 
        id="blog-reader-container"
        className="w-full max-w-5xl min-h-screen px-4 md:px-12 py-16 relative grid grid-cols-1 lg:grid-cols-12 gap-12"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Left Hand Sticky Controls: Apple-inspired back buttons */}
        <div className="lg:col-span-1 hidden lg:block">
          <div className="sticky top-20 flex flex-col gap-4">
            <button
              onClick={onClose}
              className="p-3 rounded-full bg-white/5 border border-white/5 text-slate-400 hover:text-[#c3c0ff] hover:border-[#c3c0ff]/30 hover:scale-105 transition-all text-xs font-mono flex items-center justify-center cursor-pointer"
              title="Close Reader"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Center Reader Panel: Narrow Reading Width */}
        <article className="lg:col-span-8 flex flex-col space-y-8">
          
          {/* Mobile Closer Top Row */}
          <div className="flex lg:hidden items-center justify-between pb-4 border-b border-white/5 font-mono text-xs">
            <button 
              onClick={onClose}
              className="flex items-center gap-2 text-slate-400 hover:text-white transition-all cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              BACK TO BENCH
            </button>
            <span className="text-[#c3c0ff] font-bold uppercase tracking-widest">{post.category}</span>
          </div>

          <header className="space-y-6 pt-4">
            {/* Category metadata + estimated times */}
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
              <span className="px-3 py-1 rounded bg-[#c3c0ff]/10 border border-[#c3c0ff]/20 text-[#c3c0ff] font-mono text-[10px] uppercase font-bold tracking-widest">
                {post.category}
              </span>
              <div className="flex items-center gap-1.5 text-slate-400 font-mono text-xs">
                <Calendar className="w-3.5 h-3.5" />
                <span>{post.date}</span>
              </div>
              <div className="flex items-center gap-1.5 text-slate-400 font-mono text-xs">
                <Clock className="w-3.5 h-3.5 text-[#c3c0ff]" />
                <span className="font-semibold text-slate-200">{post.readTime}</span>
              </div>
            </div>
            
            {/* Large Typography Headline */}
            <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight text-white leading-tight font-sans">
              {post.title}
            </h1>

            {/* Premium Linear design quote */}
            <p className="text-base md:text-xl text-slate-400 mt-4 leading-relaxed font-sans font-light italic border-l-2 border-[#c3c0ff]/30 pl-5 py-0.5">
              "{post.summary}"
            </p>
          </header>

          {/* Formatted Text Content - Styled exactly like Medium × Linear */}
          <div 
            ref={contentRef}
            id="blog-reader-content" 
            className="text-slate-350 border-t border-white/5 pt-8 flex-1 pb-24 font-sans"
          >
            {renderFormattedContent(post.content)}
          </div>

          {/* Footer of the article */}
          <footer className="pt-8 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500 font-mono pb-8">
            <div className="flex items-center gap-2">
              <Bookmark className="w-4 h-4 text-[#c3c0ff]" />
              <span>VK_SYSTEMS_JOURNAL // REG: VERIFIED_RECORD</span>
            </div>
            <span>© {new Date().getFullYear()} VICTOR KINYUA</span>
          </footer>

        </article>

        {/* Right Hand Column: Sticky Table of Contents (Medium x Apple style) */}
        <div className="lg:col-span-3 hidden lg:block">
          <div className="sticky top-20 space-y-8 pl-4 border-l border-white/5">
            
            {/* Table of contents label */}
            <div className="space-y-1">
              <span className="font-mono text-[10px] text-slate-500 uppercase tracking-widest block font-bold">
                Table of Contents
              </span>
              <div className="h-[1px] w-8 bg-[#c3c0ff]/30" />
            </div>

            {/* Scroll Anchors list */}
            {tocItems.length > 0 ? (
              <ul className="space-y-4">
                {tocItems.map((item) => {
                  const isActive = activeHeadingId === item.id;
                  return (
                    <li key={item.id}>
                      <button
                        onClick={() => scrollToHeader(item.id)}
                        className={`text-left text-xs font-sans transition-all duration-200 block cursor-pointer group py-1 ${
                          isActive 
                            ? "text-[#c3c0ff] font-medium translate-x-1" 
                            : "text-slate-400 hover:text-slate-200"
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span className={`w-1.5 h-1.5 rounded-full transition-all duration-200 ${
                            isActive 
                              ? "bg-[#c3c0ff] scale-110 shadow-[0_0_6px_#c3c0ff]" 
                              : "bg-transparent border border-slate-500 group-hover:border-slate-300"
                          }`} />
                          <span className="truncate max-w-[150px] md:max-w-[200px]">{item.text}</span>
                        </div>
                      </button>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <span className="text-xs font-mono text-slate-600 block italic">Compiled stream segment</span>
            )}

            {/* Micro aesthetic stats */}
            <div className="pt-10 space-y-4 text-[10px] font-mono text-slate-500 border-t border-white/5">
              <div className="flex justify-between">
                <span>INDEX SCALE</span>
                <span className="text-slate-300 font-bold">SOVEREIGN V4</span>
              </div>
              <div className="flex justify-between">
                <span>EST READ</span>
                <span className="text-slate-300 font-bold">{post.readTime}</span>
              </div>
              <div className="flex justify-between">
                <span>SECURITY</span>
                <span className="text-emerald-400 font-bold">ENCRYPTED</span>
              </div>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}

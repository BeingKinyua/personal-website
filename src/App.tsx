import { useState, useEffect, useRef } from "react";
import { 
  Terminal, 
  School, 
  BookOpen, 
  Compass, 
  ArrowRight, 
  Mail, 
  Github, 
  Linkedin, 
  Twitter, 
  Cpu, 
  Database, 
  Layers, 
  Heart, 
  Sparkles,
  Award
} from "lucide-react";
import { FOCUS_ITEMS, PROJECTS, POSTS } from "./data";
import { FocusItem, Project, Post, SystemBlueprint } from "./types";

import FloatingNav from "./components/FloatingNav";
import FocusDetailModal from "./components/FocusDetailModal";
import BlogReader from "./components/BlogReader";
import ProjectCaseStudy from "./components/ProjectCaseStudy";
import SystemBlueprints from "./components/SystemBlueprints";
import AICopilot from "./components/AICopilot";
import ProjectForm from "./components/ProjectForm";
import ThreeHeroBackground from "./components/ThreeHeroBackground";

import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

export default function App() {
  // State controllers for modals and sliders
  const [activeFocus, setActiveFocus] = useState<FocusItem | null>(null);
  const [activePost, setActivePost] = useState<Post | null>(null);
  const [activeProject, setActiveProject] = useState<Project | null>(null);
  const [isCopilotOpen, setIsCopilotOpen] = useState(false);
  
  // Custom blueprint generated via Gemini API chatbot/scoper
  const [customBlueprint, setCustomBlueprint] = useState<SystemBlueprint | null>(null);

  // Refs for the horizontal scroll trigger and horizontal track
  const sectionRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // 1. Initialize Lenis smooth scroll
    const lenis = new Lenis({
      duration: 1.1,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: "vertical",
      gestureOrientation: "vertical",
      smoothWheel: true,
      wheelMultiplier: 1.1,
    });

    const tickHandler = (time: number) => {
      lenis.raf(time * 1000);
    };

    // Sync ScrollTriggers with Lenis
    lenis.on("scroll", ScrollTrigger.update);
    
    gsap.ticker.add(tickHandler);

    const track = trackRef.current;
    const section = sectionRef.current;
    if (!track || !section) {
      gsap.ticker.remove(tickHandler);
      lenis.destroy();
      return;
    }

    // 2. Wrap animations inside GSAP context for absolute safety
    const ctx = gsap.context(() => {
      const getScrollAmount = () => {
        return -(track.scrollWidth - window.innerWidth);
      };

      // Primary Horizontal Pinning Slider
      const horizontalTween = gsap.to(track, {
        x: getScrollAmount,
        ease: "none",
        scrollTrigger: {
          trigger: section,
          pin: true,
          scrub: 1,
          start: "top top",
          end: () => `+=${track.scrollWidth - window.innerWidth}`,
          invalidateOnRefresh: true,
        },
      });

      // 3. Horizontal Cards: Entrance fade/translate + center scale focus
      const slides = gsap.utils.toArray(".project-slide");
      slides.forEach((slide: any) => {
        // Entering viewport (x: 120 -> 0, opacity: 0.25 -> 1.0, scale: 0.92 -> 1.0)
        gsap.fromTo(slide,
          { opacity: 0.25, scale: 0.92, x: 120 },
          {
            opacity: 1,
            scale: 1,
            x: 0,
            ease: "sine.out",
            scrollTrigger: {
              trigger: slide,
              containerAnimation: horizontalTween,
              start: "left 85%",
              end: "left 48%",
              scrub: true,
            }
          }
        );

        // Leaving viewport (scale: 1.0 -> 0.92, opacity: 1.0 -> 0.35)
        gsap.to(slide, {
          scale: 0.92,
          opacity: 0.35,
          ease: "sine.in",
          scrollTrigger: {
            trigger: slide,
            containerAnimation: horizontalTween,
            start: "right 52%",
            end: "right 15%",
            scrub: true,
          }
        });
      });

      // 4. Hero Section Entrance Animation Pipeline
      const heroTimeline = gsap.timeline({ delay: 0.2 });
      heroTimeline.fromTo("#hero-pill", 
        { opacity: 0, y: 30 }, 
        { opacity: 1, y: 0, duration: 0.75, ease: "power3.out" }
      )
      .fromTo("#hero-headline", 
        { opacity: 0, y: 40 }, 
        { opacity: 1, y: 0, duration: 0.9, ease: "power3.out" }, 
        "-=0.45"
      )
      .fromTo("#hero-subtitle", 
        { opacity: 0, y: 25 }, 
        { opacity: 1, y: 0, duration: 0.75, ease: "power3.out" }, 
        "-=0.6"
      )
      .fromTo("#hero-btn-a", 
        { opacity: 0, y: 20 }, 
        { opacity: 1, y: 0, duration: 0.55, ease: "power2.out" }, 
        "-=0.5"
      )
      .fromTo("#hero-btn-b", 
        { opacity: 0, y: 20 }, 
        { opacity: 1, y: 0, duration: 0.55, ease: "power2.out" }, 
        "-=0.4"
      );

      // 5. Core Specialties (Expertise Grid) Stagger Reveal
      gsap.fromTo(".expertise-card", 
        { opacity: 0, y: 40 },
        {
          opacity: 1,
          y: 0,
          duration: 0.8,
          stagger: 0.15,
          ease: "power2.out",
          scrollTrigger: {
            trigger: "#expertise",
            start: "top 82%",
          }
        }
      );

      // 6. Journal Stagger Reveal (opacity: 0 -> 1, scale: 0.96 -> 1)
      gsap.fromTo(".journal-card",
        { opacity: 0, scale: 0.96, y: 35 },
        {
          opacity: 1,
          scale: 1,
          y: 0,
          duration: 0.82,
          stagger: 0.12,
          ease: "power3.out",
          scrollTrigger: {
            trigger: "#research",
            start: "top 82%",
          }
        }
      );
    }, sectionRef);

    return () => {
      ctx.revert();
      gsap.ticker.remove(tickHandler);
      lenis.destroy();
    };
  }, []);

  // Map focus items to appropriate icons dynamically
  const getFocusIcon = (iconName: string) => {
    switch (iconName) {
      case "terminal":
        return <Terminal className="w-5 h-5 text-[#c3c0ff]" />;
      case "school":
        return <School className="w-5 h-5 text-[#c3c0ff]" />;
      case "menu_book":
        return <BookOpen className="w-5 h-5 text-[#c3c0ff]" />;
      case "explore":
        return <Compass className="w-5 h-5 text-[#c3c0ff]" />;
      default:
        return <Terminal className="w-5 h-5 text-[#c3c0ff]" />;
    }
  };

  const handleBlueprintGenerated = (bp: SystemBlueprint) => {
    setCustomBlueprint(bp);
    // Smooth scroll to blueprint studio so users observe the live compilation
    setTimeout(() => {
      const el = document.getElementById("blueprints-studio");
      if (el) el.scrollIntoView({ behavior: "smooth" });
    }, 1200);
  };

  return (
    <div className="relative min-h-screen bg-[#070809] text-on-surface overflow-x-hidden font-sans scroll-smooth">
      {/* Background radial soft light gradient */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-indigo-900/10 rounded-full blur-[140px] pointer-events-none z-0"></div>
      <div className="absolute top-1/2 right-1/4 w-[400px] h-[400px] bg-indigo-900/5 rounded-full blur-[160px] pointer-events-none z-0"></div>

      {/* Glass Header Nav bar */}
      <FloatingNav 
        onToggleCopilot={() => setIsCopilotOpen(!isCopilotOpen)} 
        isCopilotOpen={isCopilotOpen} 
      />

      {/* Main Container */}
      <main className="relative z-10 w-full pb-24 space-y-24">
        
        {/* HERO SECTION */}
        <section id="hero" className="relative w-full h-screen min-h-[650px] flex flex-col justify-center overflow-hidden border-b border-white/5 bg-[#0a0b0d]">
          {/* Interactive 3D Wireframe Canvas background */}
          <ThreeHeroBackground />

          {/* Gradients to blend into slate borders */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#0a0b0d] via-transparent to-[#0a0b0d]/70 pointer-events-none z-10" />
          
          <div className="max-w-6xl w-full mx-auto px-4 md:px-8 relative z-20 space-y-8 select-none text-left flex flex-col items-start justify-center">
            <div id="hero-pill" className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-indigo-950/40 border border-indigo-700/35 rounded-full text-xs font-semibold tracking-wider text-[#c3c0ff] uppercase font-mono animate-pulse">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              Available for Architecting Systems
            </div>

            <h1 id="hero-headline" className="text-5xl md:text-7xl font-extrabold tracking-tight text-white leading-[1.05] font-sans">
              Building Intelligent Systems <br className="hidden sm:inline" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#c3c0ff] via-[#e5e4ff] to-[#ffffff]">
                For Human Problems.
              </span>
            </h1>

            <p id="hero-subtitle" className="text-base md:text-lg text-slate-300 leading-relaxed max-w-2xl font-sans font-light">
              Hi, I'm <strong className="text-white font-medium">Victor Kinyua (V.K)</strong>. I design high-throughput transaction boundaries, distributed consensus grids, and automated machine learning inference pipelines.
            </p>

            <div className="flex flex-wrap items-center gap-4 pt-4">
              <button
                id="hero-btn-a"
                onClick={() => {
                  const el = document.getElementById("projects");
                  if (el) el.scrollIntoView({ behavior: "smooth" });
                }}
                className="px-7 py-3.5 rounded-full bg-[#c3c0ff] hover:bg-[#dad7ff] text-[#1d00a5] text-sm font-bold font-mono tracking-wide shadow-lg hover:shadow-indigo-500/20 active:scale-95 hover:scale-105 hover:-translate-y-0.5 transition-all duration-200 cursor-pointer"
              >
                EXPLORE PROJECTS
              </button>
              
              <button
                id="hero-btn-b"
                onClick={() => setIsCopilotOpen(true)}
                className="px-7 py-3.5 rounded-full border border-slate-700 bg-black/40 backdrop-blur-md text-slate-300 hover:text-white hover:border-[#c3c0ff]/40 text-sm font-semibold active:scale-95 hover:scale-105 hover:-translate-y-0.5 transition-all duration-200 cursor-pointer font-sans"
              >
                CONVERSE WITH AI VECTOR
              </button>
            </div>
          </div>
        </section>

        {/* UPPER SECTIONS WRAPPER */}
        <div className="max-w-6xl mx-auto px-4 md:px-8 space-y-24">

          {/* ACTIVE FOCI SECTION */}
        <section id="focus" className="space-y-8">
          <div>
            <span className="font-mono text-xs text-[#c3c0ff] uppercase tracking-widest block mb-2">[ REAL-TIME VECTOR ]</span>
            <h2 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight leading-tight">Active Development Foci</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {FOCUS_ITEMS.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveFocus(item)}
                className="bento-card p-5.5 text-left relative flex flex-col justify-between group h-64 focus:outline-none pointer"
              >
                <div className="space-y-4">
                  <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/5 flex items-center justify-center text-[#c3c0ff] group-hover:bg-[#c3c0ff]/10 group-hover:border-[#c3c0ff]/40 transition-colors">
                    {getFocusIcon(item.icon)}
                  </div>
                  <div>
                    <span className="font-mono text-[9px] uppercase font-bold tracking-wider text-slate-500 block mb-1">{item.category}</span>
                    <h3 className="text-sm font-bold text-white leading-snug group-hover:text-[#c3c0ff] transition-colors">{item.title}</h3>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed font-sans">{item.shortDescription}</p>
                </div>

                <div className="flex items-center gap-1 text-xs font-mono font-bold text-[#c3c0ff] opacity-0 group-hover:opacity-100 transition-opacity mt-4">
                  INSPECT STATUS
                  <ArrowRight className="w-3.5 h-3.5" />
                </div>
              </button>
            ))}
          </div>
        </section>

        {/* CORE SPECIALIZATION (EXPERTISE) SECTION */}
        <section id="expertise" className="space-y-8">
          <div className="text-center md:text-left">
            <span className="font-mono text-xs text-[#c3c0ff] uppercase tracking-widest block mb-2">[ ABILITIES SCANNING ]</span>
            <h2 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight leading-tight">Core Competence Matrix</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6.5">
            <div className="expertise-card bento-card p-6 md:p-8 space-y-4 transition-all duration-300 ease-out hover:-translate-y-1.5 hover:shadow-[0_15px_30px_rgba(195,192,255,0.06)] hover:border-[#c3c0ff]/30 cursor-pointer group">
              <div className="w-10 h-10 rounded-xl bg-indigo-950/40 border border-indigo-750/30 flex items-center justify-center text-[#c3c0ff] group-hover:rotate-6 transition-transform duration-300 ease-out">
                <Cpu className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-white font-sans">AI & Machine Learning Infrastructure</h3>
              <p className="text-xs text-slate-400 font-sans leading-relaxed">
                Engineering intelligent computer vision video streams, vector semantic chunks, dual hybrid query indexing pipelines, and local multi-agent concurrency frameworks.
              </p>
            </div>

            <div className="expertise-card bento-card p-6 md:p-8 space-y-4 transition-all duration-300 ease-out hover:-translate-y-1.5 hover:shadow-[0_15px_30px_rgba(195,192,255,0.06)] hover:border-[#c3c0ff]/30 cursor-pointer group">
              <div className="w-10 h-10 rounded-xl bg-indigo-950/40 border border-indigo-750/30 flex items-center justify-center text-[#c3c0ff] group-hover:rotate-6 transition-transform duration-300 ease-out">
                <Database className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-white font-sans">Distributed Fintech Ledgers</h3>
              <p className="text-xs text-slate-400 font-sans leading-relaxed">
                Architecting transaction-safe API gateways, robust double-entry balance accounts to resolve telco API drop out double-spend bugs, and event-driven logging frameworks.
              </p>
            </div>

            <div className="expertise-card bento-card p-6 md:p-8 space-y-4 transition-all duration-300 ease-out hover:-translate-y-1.5 hover:shadow-[0_15px_30px_rgba(195,192,255,0.06)] hover:border-[#c3c0ff]/30 cursor-pointer group">
              <div className="w-10 h-10 rounded-xl bg-indigo-950/40 border border-indigo-750/30 flex items-center justify-center text-[#c3c0ff] group-hover:rotate-6 transition-transform duration-300 ease-out">
                <Layers className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-white font-sans">System & Product Orchestration</h3>
              <p className="text-xs text-slate-400 font-sans leading-relaxed">
                Drafting opinionated development models, deploying automated Terraform multi-region cloud configurations, and designing rigorous project estimations.
              </p>
            </div>
          </div>
        </section>
        </div> {/* Close UPPER SECTIONS WRAPPER */}

        {/* WORK / PROJECTS SECTION (HORIZONTAL GSAP EXHIBITION) */}
        <section 
          id="projects" 
          ref={sectionRef} 
          className="relative w-full h-screen flex flex-col justify-center overflow-hidden bg-[#070809] border-y border-white/5 py-12 select-none"
        >
          {/* Header row to keep standard visual language */}
          <div className="w-full max-w-6xl mx-auto px-4 md:px-8 mb-8 shrink-0">
            <span className="font-mono text-xs text-[#c3c0ff] uppercase tracking-widest block mb-2">[ SYSTEM GALLERY ]</span>
            <h2 className="text-2xl md:text-4xl font-extrabold text-white tracking-tight leading-tight">Selected Work</h2>
          </div>

          {/* Horizontal conveyor track container */}
          <div className="w-full overflow-hidden">
            <div 
              ref={trackRef} 
              className="flex items-center gap-6 md:gap-12 px-4 md:px-24 w-max"
              style={{ willChange: "transform" }}
            >
              {/* Intro panel */}
              <div className="w-[80vw] sm:w-[380px] md:w-[420px] shrink-0 h-[52vh] md:h-[58vh] flex flex-col justify-between p-6 md:p-8 border border-white/5 rounded-2xl bg-white/[0.01]/70 backdrop-blur-md relative overflow-hidden blueprint-overlay flex-shrink-0">
                <div className="absolute top-0 left-0 w-3 h-3 border-t border-l border-white/20"></div>
                <div className="absolute bottom-0 right-0 w-3 h-3 border-b border-r border-white/20"></div>
                <div className="space-y-4 my-auto">
                  <span className="font-mono text-xs text-[#c3c0ff] uppercase tracking-widest block">[ EXHIBIT HALL 01 ]</span>
                  <p className="text-sm text-slate-350 leading-relaxed font-sans">
                     Welcome to the exhibition gallery. Scroll vertically to travel horizontally through high-isolation micro-engines, transaction boundaries, and decentralized consensus records.
                  </p>
                </div>
                
                <div className="flex items-center gap-2 text-xs font-mono text-slate-500 animate-pulse mt-auto pt-4">
                  <span>SCROLL DOWN TO DISCOVER</span>
                  <ArrowRight className="w-3.5 h-3.5 text-[#c3c0ff]" />
                </div>
              </div>

              {/* Project slides */}
              {PROJECTS.map((project, idx) => (
                <div 
                  key={project.id} 
                  className="project-slide w-[85vw] sm:w-[520px] md:w-[600px] shrink-0 h-[52vh] md:h-[58vh] bg-[#0c0d0f]/90 border border-white/5 rounded-2xl flex flex-col justify-between p-6 md:p-8 relative hover:border-[#c3c0ff]/35 hover:-translate-y-2 hover:shadow-[0_20px_40px_rgba(195,192,255,0.06)] transition-all duration-300 ease-out group blueprint-overlay"
                >
                  <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-[#c3c0ff]/30 rounded-tl-2xl"></div>
                  <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-[#c3c0ff]/30 rounded-br-2xl"></div>

                  <div className="space-y-4 overflow-y-auto select-none custom-scrollbar pr-1">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-[10px] bg-[#c3c0ff]/10 border border-[#c3c0ff]/15 px-2.5 py-1 rounded text-[#c3c0ff] font-bold uppercase tracking-wider">
                        {project.category}
                      </span>
                      <span className="font-mono text-xs text-slate-500 font-semibold">{project.version}</span>
                    </div>

                    <div>
                      <h3 className="text-2xl md:text-3xl font-extrabold text-white font-sans group-hover:text-[#c3c0ff] transition-colors">
                        {project.title}
                      </h3>
                      <p className="text-xs text-slate-400 italic mt-0.5">"{project.subtitle}"</p>
                    </div>

                    <div className="space-y-4 pt-1 border-t border-white/5">
                      <div>
                        <span className="font-mono text-[9px] uppercase font-bold text-[#c3c0ff] tracking-wider block mb-0.5">
                          [ BOTTLENECK PROBLEM ]
                        </span>
                        <p className="text-xs text-slate-300 leading-relaxed font-sans">{project.problem}</p>
                      </div>
                      
                      <div>
                        <span className="font-mono text-[9px] uppercase font-bold text-rose-400 tracking-wider block mb-0.5">
                          [ SYSTEM ACTION & LEDGER ]
                        </span>
                        <p className="text-xs text-slate-300 leading-relaxed font-sans line-clamp-3">{project.system}</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-white/5 mt-3 shrink-0">
                    <button
                      onClick={() => setActiveProject(project)}
                      className="text-xs font-mono font-extrabold text-[#c3c0ff] flex items-center gap-1.5 hover:text-white transition-colors cursor-pointer group/btn"
                    >
                      INSPECT DESIGN GRAPH
                      <ArrowRight className="w-3.5 h-3.5 translate-x-0 group-hover/btn:translate-x-1.5 transition-transform" />
                    </button>
                    <span className="font-mono text-[10px] text-slate-600 font-bold">MUTABLE RUN 0{idx + 1} // 0{PROJECTS.length}</span>
                  </div>
                </div>
              ))}

              {/* Outro slide */}
              <div className="w-[80vw] sm:w-[380px] md:w-[420px] shrink-0 h-[52vh] md:h-[58vh] flex flex-col justify-between p-6 md:p-8 border border-dashed border-white/10 rounded-2xl bg-transparent relative flex-shrink-0">
                <div className="space-y-4 my-auto">
                  <span className="font-mono text-xs text-emerald-400 uppercase tracking-widest block">[ GALLERY RESOLVED ]</span>
                  <p className="text-xs text-slate-400 leading-relaxed font-sans">
                    All case repositories scanned successfully. Proceed to the live compilation bench to parameterize your custom structural schemas.
                  </p>
                </div>
                
                <div className="flex items-center gap-2 text-xs font-mono text-slate-500 animate-pulse mt-auto pt-4">
                  <span>SCROLL DOWN FOR STUDIO</span>
                  <ArrowRight className="w-3.5 h-3.5 rotate-90 text-[#c3c0ff]" />
                </div>
              </div>

            </div>
          </div>
        </section>

        {/* LOWER SECTIONS WRAPPER */}
        <div className="max-w-6xl mx-auto px-4 md:px-8 space-y-24 mt-12">

        {/* SYSTEM BLUEPRINTS INTERACTIVE STUDIO */}
        <section id="blueprint" className="scroll-mt-24">
          <SystemBlueprints customBlueprint={customBlueprint} />
        </section>

        {/* JOURNAL / BLOG SECTION */}
        <section id="research" className="space-y-8">
          <div>
            <span className="font-mono text-xs text-[#c3c0ff] uppercase tracking-widest block mb-2">[ INTELLECTUAL RECORD ]</span>
            <h2 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight leading-tight font-sans">Engineering Journal</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* 1. AI Research: Large Featured Article (Span 2 columns on medium+) */}
            {(() => {
              const post = POSTS.find(p => p.category === "AI Research");
              if (!post) return null;
              return (
                <button
                  onClick={() => setActivePost(post)}
                  className="journal-card bento-card p-6 md:p-8 text-left group flex flex-col justify-between focus:outline-none pointer md:col-span-2 md:row-span-1 hover:-translate-y-1.5 transition-all duration-300 ease-out"
                >
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-6 w-full items-center">
                    <div className="sm:col-span-7 space-y-4">
                      <div className="flex items-center gap-2.5">
                        <span className="px-2.5 py-0.5 rounded-full bg-[#c3c0ff]/10 text-[#c3c0ff] border border-[#c3c0ff]/20 text-[9px] font-mono uppercase font-bold tracking-wider group-hover:bg-[#c3c0ff] group-hover:text-[#1d00a5] transition-colors duration-300">
                          {post.category}
                        </span>
                        <span className="text-[10px] uppercase font-mono text-slate-500 font-bold">{post.readTime}</span>
                        <span className="text-[10px] uppercase font-mono text-amber-400 font-extrabold tracking-wide">[ FEATURED ]</span>
                      </div>
                      
                      <h3 className="text-xl md:text-2xl font-extrabold text-white font-sans leading-tight group-hover:text-[#c3c0ff] transition-colors">
                        {post.title}
                      </h3>
                      
                      <p className="text-xs text-slate-400 leading-relaxed font-sans">
                        {post.summary}
                      </p>

                      <div className="flex items-center gap-2 text-xs font-mono font-bold text-[#c3c0ff] pt-2 shrink-0">
                        ENGAGE RESEARCH REPORT
                        <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                      </div>
                    </div>

                    {/* Embedding Graph Cluster Vector Graphic */}
                    <div className="sm:col-span-5 h-full flex flex-col justify-center">
                      <div className="relative w-full h-44 sm:h-40 bg-black/40 border border-white/5 rounded-xl overflow-hidden flex items-center justify-center group-hover:scale-[1.04] transition-all duration-300">
                        <div className="absolute inset-0 pointer-events-none opacity-20 bg-[linear-gradient(to_right,#c3c0ff_1px,transparent_1px),linear-gradient(to_bottom,#c3c0ff_1px,transparent_1px)] bg-[size:16px_16px]" />
                        <svg className="w-4/5 h-4/5" viewBox="0 0 200 120">
                          <circle cx="40" cy="80" r="4" fill="#c3c0ff" className="animate-pulse" />
                          <circle cx="55" cy="50" r="3" fill="#8d89ff" />
                          <circle cx="80" cy="90" r="3" fill="#8d89ff" />
                          
                          <circle cx="160" cy="40" r="4" fill="#ff7da4" className="animate-pulse" />
                          <circle cx="140" cy="55" r="3" fill="#ff4d7a" />
                          <circle cx="150" cy="75" r="3" fill="#ff4d7a" />
                          
                          <line x1="40" y1="80" x2="55" y2="50" stroke="#c3c0ff" strokeWidth="0.5" strokeDasharray="2 2" />
                          <line x1="40" y1="80" x2="80" y2="90" stroke="#c3c0ff" strokeWidth="0.5" strokeDasharray="2 2" />
                          <line x1="160" y1="40" x2="140" y2="55" stroke="#ff7da4" strokeWidth="0.5" strokeDasharray="2 2" />
                          <line x1="160" y1="40" x2="150" y2="75" stroke="#ff7da4" strokeWidth="0.5" strokeDasharray="2 2" />
                          
                          <path d="M 55 50 Q 100 20 140 55" fill="none" stroke="#c3c0ff" strokeWidth="1" strokeDasharray="4 2" />
                          <circle cx="95" cy="30" r="4" fill="#c3c0ff" />
                          <text x="95" y="20" textAnchor="middle" fill="#c3c0ff" className="font-mono text-[7px] font-bold">CROSS_RECALL</text>
                        </svg>
                      </div>
                    </div>
                  </div>
                </button>
              );
            })()}

            {/* 2. Nation Building Card (Span 1 column) */}
            {(() => {
              const post = POSTS.find(p => p.category === "Nation Building");
              if (!post) return null;
              return (
                <button
                  onClick={() => setActivePost(post)}
                  className="journal-card bento-card p-6 md:p-8 text-left group flex flex-col justify-between h-full focus:outline-none pointer hover:-translate-y-1.5 transition-all duration-300 ease-out"
                >
                  <div className="space-y-4 w-full">
                    {/* Security Attestation Enclave Graphic */}
                    <div className="relative w-full h-32 bg-black/40 border border-white/5 rounded-xl overflow-hidden flex items-center justify-center group-hover:scale-[1.04] transition-all duration-300">
                      <div className="absolute inset-0 pointer-events-none opacity-20 bg-[radial-gradient(#c3c0ff_0.5px,transparent_0.5px)] [background-size:12px_12px]" />
                      <svg className="w-5/6 h-5/6" viewBox="0 0 160 100">
                        <g stroke="#c3c0ff" strokeWidth="0.75" fill="none">
                          <polygon points="80,15 120,40 120,80 80,95 40,80 40,40" />
                          <line x1="80" y1="15" x2="80" y2="95" />
                          <line x1="40" y1="40" x2="120" y2="80" />
                          <line x1="120" y1="40" x2="40" y2="80" />
                        </g>
                        <circle cx="80" cy="50" r="10" fill="#0c0d0f" stroke="#c3c0ff" strokeWidth="1.25" />
                        <path d="M 77 48 L 83 48 L 83 54 L 77 54 Z M 78.5 48 L 78.5 45 M 81.5 48 L 81.5 45" fill="none" stroke="#c3c0ff" strokeWidth="0.75" />
                        <text x="80" y="80" textAnchor="middle" fill="#c3c0ff" className="font-mono text-[7px] font-bold uppercase tracking-widest">ENCLAVE_SYNC</text>
                      </svg>
                    </div>

                    <div className="space-y-2.5">
                      <div className="flex items-center justify-between">
                        <span className="px-2 py-0.5 rounded-full bg-[#c3c0ff]/10 text-[#c3c0ff] border border-[#c3c0ff]/20 text-[9px] font-mono uppercase font-bold tracking-wider group-hover:bg-[#c3c0ff] group-hover:text-[#1d00a5] transition-colors duration-300">
                          {post.category}
                        </span>
                        <span className="text-[10px] uppercase font-mono text-slate-500 font-bold">{post.readTime}</span>
                      </div>
                      <h3 className="text-base md:text-lg font-bold text-white font-sans leading-snug group-hover:text-[#c3c0ff] transition-colors line-clamp-1">
                        {post.title}
                      </h3>
                      <p className="text-xs text-slate-400 leading-relaxed font-sans line-clamp-2">
                        {post.summary}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-[#c3c0ff] pt-4">
                    DECRYPT FILE
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                  </div>
                </button>
              );
            })()}

            {/* 3. Product Design Card (Span 1 column) */}
            {(() => {
              const post = POSTS.find(p => p.category === "Product Design");
              if (!post) return null;
              return (
                <button
                  onClick={() => setActivePost(post)}
                  className="journal-card bento-card p-6 md:p-8 text-left group flex flex-col justify-between h-full focus:outline-none pointer hover:-translate-y-1.5 transition-all duration-300 ease-out"
                >
                  <div className="space-y-4 w-full">
                    {/* Bounding system specifications Graphic */}
                    <div className="relative w-full h-32 bg-black/40 border border-white/5 rounded-xl overflow-hidden flex items-center justify-center group-hover:scale-[1.04] transition-all duration-300">
                      <div className="absolute inset-0 pointer-events-none opacity-20 bg-[linear-gradient(to_bottom,#c3c0ff_1.5px,transparent_1.5px)] bg-[size:100%_12px]" />
                      <svg className="w-5/6 h-5/6" viewBox="0 0 160 100">
                        <rect x="25" y="15" width="110" height="60" fill="none" stroke="#8d89ff" strokeWidth="0.75" strokeDasharray="3 3" />
                        <rect x="35" y="25" width="90" height="40" fill="#c3c0ff" fillOpacity="0.05" stroke="#c3c0ff" strokeWidth="1.25" />
                        <line x1="35" y1="10" x2="35" y2="90" stroke="#8d89ff" strokeWidth="0.5" strokeDasharray="1 1" />
                        <line x1="125" y1="10" x2="125" y2="90" stroke="#8d89ff" strokeWidth="0.5" strokeDasharray="1 1" />
                        <text x="80" y="48" textAnchor="middle" fill="#c3c0ff" className="font-mono text-[8px] font-bold">GRID_FRAME</text>
                      </svg>
                    </div>

                    <div className="space-y-2.5">
                      <div className="flex items-center justify-between">
                        <span className="px-2 py-0.5 rounded-full bg-[#c3c0ff]/10 text-[#c3c0ff] border border-[#c3c0ff]/20 text-[9px] font-mono uppercase font-bold tracking-wider group-hover:bg-[#c3c0ff] group-hover:text-[#1d00a5] transition-colors duration-300">
                          {post.category}
                        </span>
                        <span className="text-[10px] uppercase font-mono text-slate-500 font-bold">{post.readTime}</span>
                      </div>
                      <h3 className="text-base md:text-lg font-bold text-white font-sans leading-snug group-hover:text-[#c3c0ff] transition-colors line-clamp-1">
                        {post.title}
                      </h3>
                      <p className="text-xs text-slate-400 leading-relaxed font-sans line-clamp-2">
                        {post.summary}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-[#c3c0ff] pt-4">
                    STUDY PRINCIPLES
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                  </div>
                </button>
              );
            })()}

            {/* 4. Football Analytics Card (Span 2 columns) */}
            {(() => {
              const post = POSTS.find(p => p.category === "Football Analytics");
              if (!post) return null;
              return (
                <button
                  onClick={() => setActivePost(post)}
                  className="journal-card bento-card p-6 md:p-8 text-left group flex flex-col justify-between focus:outline-none pointer md:col-span-2 hover:-translate-y-1.5 transition-all duration-300 ease-out"
                >
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-6 w-full items-center">
                    <div className="sm:col-span-7 space-y-4">
                      <div className="flex items-center gap-2.5">
                        <span className="px-2.5 py-0.5 rounded-full bg-[#c3c0ff]/10 text-[#c3c0ff] border border-[#c3c0ff]/20 text-[9px] font-mono uppercase font-bold tracking-wider group-hover:bg-[#c3c0ff] group-hover:text-[#1d00a5] transition-colors duration-300">
                          {post.category}
                        </span>
                        <span className="text-[10px] uppercase font-mono text-slate-500 font-bold">{post.readTime}</span>
                      </div>

                      <h3 className="text-xl font-extrabold text-white font-sans leading-tight group-hover:text-[#c3c0ff] transition-colors">
                        {post.title}
                      </h3>

                      <p className="text-xs text-slate-400 leading-relaxed font-sans">
                        {post.summary}
                      </p>

                      <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-[#c3c0ff] pt-2 shrink-0">
                        INSPECT SCATTER MATRIX
                        <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                      </div>
                    </div>

                    {/* Football CV pitch tracker visual */}
                    <div className="sm:col-span-5 h-full flex flex-col justify-center">
                      <div className="relative w-full h-40 bg-[#0e1f13] border border-emerald-950/40 rounded-xl overflow-hidden flex items-center justify-center group-hover:scale-[1.04] transition-all duration-300">
                        <div className="absolute inset-0 pointer-events-none opacity-20 bg-[linear-gradient(to_right,#10b981_0.5px,transparent_0.5px),linear-gradient(to_bottom,#10b981_0.5px,transparent_0.5px)] bg-[size:16px_16px]" />
                        <svg className="w-5/6 h-5/6" viewBox="0 0 200 120">
                          <rect x="5" y="5" width="190" height="110" fill="none" stroke="#10b981" strokeWidth="0.75" strokeOpacity="0.4" />
                          <line x1="100" y1="5" x2="100" y2="115" stroke="#10b981" strokeWidth="0.75" strokeOpacity="0.4" />
                          <circle cx="100" cy="60" r="18" fill="none" stroke="#10b981" strokeWidth="0.75" strokeOpacity="0.4" />
                          
                          <rect x="35" y="45" width="20" height="20" fill="#10b981" fillOpacity="0.1" stroke="#10b981" strokeWidth="0.5" />
                          <circle cx="45" cy="55" r="2.5" fill="#10b981" />
                          <line x1="45" y1="55" x2="72" y2="70" stroke="#34d399" strokeWidth="1" strokeDasharray="3 1" />
                          
                          <rect x="140" y="70" width="20" height="20" fill="#ef4444" fillOpacity="0.1" stroke="#ef4444" strokeWidth="0.5" />
                          <circle cx="150" cy="80" r="2.5" fill="#ef4444" />
                          
                          <path d="M 85 5 L 92 60 L 105 115" fill="none" stroke="#3b82f6" strokeWidth="0.75" strokeDasharray="3 3" />
                          <text x="110" y="25" fill="#60a5fa" className="font-mono text-[5px] uppercase opacity-80">TACTICAL_SPLIT_LINE</text>
                        </svg>
                      </div>
                    </div>
                  </div>
                </button>
              );
            })()}
          </div>
        </section>

        {/* COMPILER / SERVICES FORM ESTIMATOR */}
        <section id="contact" className="space-y-8 scroll-mt-24">
          <div className="text-center md:text-left">
            <span className="font-mono text-xs text-[#c3c0ff] uppercase tracking-widest block mb-1">[ COLLABORATIVE COMPREHENSION ]</span>
            <h2 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight leading-tight">Digital HQ Architectural Scoper</h2>
          </div>

          <ProjectForm onBlueprintCompiled={handleBlueprintGenerated} />
        </section>

        {/* BOTTOM METRIC CONTACT SECTION */}
        <section className="bento-card p-8 md:p-14 text-center space-y-6 relative border border-white/5 overflow-hidden blueprint-overlay">
          <div className="max-w-2xl mx-auto space-y-5">
            <div className="w-10 h-10 rounded-full bg-white/5 border border-white/5 flex items-center justify-center mx-auto text-[#c3c0ff]">
              <Award className="w-5 h-5 animate-pulse" />
            </div>
            <h3 className="text-3xl md:text-5xl font-extrabold tracking-tight text-white font-sans leading-tight">
              Let's Build Something <br />Meaningful.
            </h3>
            <p className="text-sm text-slate-350 max-w-md mx-auto leading-relaxed">
              If your business needs robust, bulletproof engineering structures, AI integrations, or highly scalable backend API loops, let's connect.
            </p>

            {/* Profile links in flex */}
            <div className="flex justify-center items-center gap-5 pt-3 flex-wrap">
              <a 
                href="mailto:kinyuaviktor@gmail.com"
                className="px-5 py-2.5 rounded-full bg-[#c3c0ff]/10 border border-[#c3c0ff]/20 text-[#c3c0ff] text-xs font-mono hover:bg-[#c3c0ff] hover:text-[#1d00a5] transition-all flex items-center gap-1.5"
                title="Mail Victor"
              >
                <Mail className="w-3.5 h-3.5" />
                kinyuaviktor@gmail.com
              </a>

              <a 
                href="https://github.com" 
                target="_blank" 
                rel="no-referrer"
                className="p-2.5 rounded-full bg-white/5 border border-white/5 text-slate-400 hover:text-white transition-all"
                title="GitHub"
              >
                <Github className="w-4 h-4" />
              </a>

              <a 
                href="https://linkedin.com" 
                target="_blank" 
                rel="no-referrer"
                className="p-2.5 rounded-full bg-white/5 border border-white/5 text-slate-400 hover:text-white transition-all"
                title="LinkedIn"
              >
                <Linkedin className="w-4 h-4" />
              </a>

              <a 
                href="https://twitter.com" 
                target="_blank" 
                rel="no-referrer"
                className="p-2.5 rounded-full bg-white/5 border border-white/5 text-slate-400 hover:text-white transition-all"
                title="Twitter X"
              >
                <Twitter className="w-4 h-4" />
              </a>
            </div>
          </div>
        </section>

        </div> {/* Close LOWER SECTIONS WRAPPER */}
      </main>

      {/* FOOTER */}
      <footer className="border-t border-white/5 py-8 text-center text-xs text-slate-500 relative z-10 bg-[#070809]">
        <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4 font-mono">
          <div className="flex items-center gap-2">
            <Heart className="w-3.5 h-3.5 text-rose-500 fill-current" />
            <span>VIC KINYUA DIGITAL HQ • NAIROBI, KENYA</span>
          </div>
          <span>© {new Date().getFullYear()} ALL STATE RECORDS RESOLVED OK</span>
        </div>
      </footer>

      {/* MODAL DIALOG OVERLAYS */}
      <FocusDetailModal 
        item={activeFocus} 
        onClose={() => setActiveFocus(null)} 
      />

      <BlogReader 
        post={activePost} 
        onClose={() => setActivePost(null)} 
      />

      <ProjectCaseStudy 
        project={activeProject} 
        onClose={() => setActiveProject(null)} 
      />

      {/* FLOATING SIDEBAR AI COPILOT */}
      <AICopilot 
        isOpen={isCopilotOpen} 
        onClose={() => setIsCopilotOpen(false)} 
        onBlueprintGenerated={handleBlueprintGenerated}
      />
    </div>
  );
}

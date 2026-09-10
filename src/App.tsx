import React, { useState, useEffect, useRef } from "react";
import Lenis from "lenis";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

// Shell Components
import { SystemEntry } from "./components/shell/SystemEntry";
import { OSNavigation } from "./components/shell/OSNavigation";
import { OSStatus } from "./components/shell/OSStatus";
import { CommandCenter } from "./components/shell/CommandCenter";
import { OSFooter } from "./components/shell/OSFooter";

// Dr. Doom AI Intelligence
import { DoomPanel } from "./components/doom/DoomPanel";

// System Modules
import { SystemOverview } from "./components/home/SystemOverview";
import { WorkSection } from "./components/work/WorkSection";
import { JournalSection } from "./components/journal/JournalSection";
import { LabSection } from "./components/lab/LabSection";
import { KnowledgeSection } from "./components/knowledge/KnowledgeSection";
import { AboutSection } from "./components/about/AboutSection";
import { ContactSection } from "./components/contact/ContactSection";

// Immersive Reader Chambers
import { JournalReader } from "./components/journal/JournalReader";
import { ProjectReader } from "./components/work/ProjectReader";

// Hooks
import { useCommandCenter } from "./hooks/useCommandCenter";

gsap.registerPlugin(ScrollTrigger);

export default function App() {
  // System Entry Boot state
  const [hasEnteredSystem, setHasEnteredSystem] = useState<boolean>(() => {
    return sessionStorage.getItem("victoros_boot_completed") === "true";
  });

  // Navigation and active section
  const [activeSection, setActiveSection] = useState<string>("home");

  // Deep-dive selection state
  const [selectedProjectSlug, setSelectedProjectSlug] = useState<string | null>(null);
  const [selectedArticleSlug, setSelectedArticleSlug] = useState<string | null>(null);

  // Command Center state
  const { isOpen: isCmdOpen, open: openCmd, close: closeCmd } = useCommandCenter();

  // Dr. Doom intelligence panel state
  const [isDoomOpen, setIsDoomOpen] = useState<boolean>(false);
  const [doomInitialPrompt, setDoomInitialPrompt] = useState<string>("");

  const lenisRef = useRef<Lenis | null>(null);

  // Route Synchronization & Deep-Linking (PopState and Initial URL check)
  useEffect(() => {
    const parseCurrentRoute = () => {
      const path = window.location.pathname;
      const hash = window.location.hash;

      const journalMatch = path.match(/^\/journal\/([^/]+)/) || hash.match(/^#\/?journal\/([^/]+)/);
      if (journalMatch) {
        setSelectedArticleSlug(journalMatch[1]);
        setSelectedProjectSlug(null);
        setHasEnteredSystem(true);
        return;
      }

      const workMatch = path.match(/^\/work\/([^/]+)/) || hash.match(/^#\/?work\/([^/]+)/);
      if (workMatch) {
        setSelectedProjectSlug(workMatch[1]);
        setSelectedArticleSlug(null);
        setHasEnteredSystem(true);
        return;
      }

      // Root or generic section anchor
      if (!path.startsWith("/journal") && !path.startsWith("/work")) {
        setSelectedArticleSlug(null);
        setSelectedProjectSlug(null);
      }
    };

    parseCurrentRoute();
    window.addEventListener("popstate", parseCurrentRoute);
    return () => window.removeEventListener("popstate", parseCurrentRoute);
  }, []);

  const handleOpenArticle = (slug: string) => {
    setSelectedArticleSlug(slug);
    setSelectedProjectSlug(null);
    window.history.pushState({ reader: "journal", slug }, "", `/journal/${slug}`);
  };

  const handleOpenProject = (slug: string) => {
    setSelectedProjectSlug(slug);
    setSelectedArticleSlug(null);
    window.history.pushState({ reader: "project", slug }, "", `/work/${slug}`);
  };

  const handleCloseReader = () => {
    setSelectedArticleSlug(null);
    setSelectedProjectSlug(null);
    if (window.location.pathname.startsWith("/journal") || window.location.pathname.startsWith("/work")) {
      window.history.pushState(null, "", "/");
    }
  };

  // Smooth scroll initialization with Lenis
  useEffect(() => {
    if (!hasEnteredSystem) return;

    const lenis = new Lenis({
      duration: 1.1,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: "vertical",
      gestureOrientation: "vertical",
      smoothWheel: true,
      wheelMultiplier: 1.1,
    });

    lenisRef.current = lenis;

    const raf = (time: number) => {
      lenis.raf(time * 1000);
    };

    lenis.on("scroll", ScrollTrigger.update);
    gsap.ticker.add(raf);

    // Active section spy on scroll
    const sections = ["home", "work", "journal", "lab", "knowledge", "about", "contact"];
    const handleScrollSpy = () => {
      const scrollY = window.scrollY + 250;
      for (const sectionId of sections) {
        const el = document.getElementById(sectionId);
        if (el) {
          const top = el.offsetTop;
          const height = el.offsetHeight;
          if (scrollY >= top && scrollY < top + height) {
            setActiveSection(sectionId);
            break;
          }
        }
      }
    };

    window.addEventListener("scroll", handleScrollSpy, { passive: true });

    return () => {
      window.removeEventListener("scroll", handleScrollSpy);
      gsap.ticker.remove(raf);
      lenis.destroy();
    };
  }, [hasEnteredSystem]);

  const handleEnterSystem = () => {
    sessionStorage.setItem("victoros_boot_completed", "true");
    setHasEnteredSystem(true);
  };

  const scrollToSection = (sectionId: string) => {
    setActiveSection(sectionId);
    if (sectionId === "home") {
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    const el = document.getElementById(sectionId);
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
  };

  const handleAskDoomWithPrompt = (prompt: string) => {
    setDoomInitialPrompt(prompt);
    setIsDoomOpen(true);
  };

  return (
    <div className="min-h-screen bg-[#07080a] text-zinc-100 font-sans selection:bg-blue-500/30 selection:text-blue-200 antialiased overflow-x-hidden">
      {/* State A: Boot / System Entry Screen */}
      {!hasEnteredSystem && (
        <SystemEntry onEnter={handleEnterSystem} />
      )}

      {/* State B: Full VictorOS Environment */}
      {hasEnteredSystem && (
        <>
          {/* Floating Navigation Pill */}
          <OSNavigation
            activeSection={activeSection}
            onNavigate={scrollToSection}
            onOpenCommandCenter={openCmd}
            onOpenDoom={() => {
              setDoomInitialPrompt("");
              setIsDoomOpen(true);
            }}
          />

          {/* System Telemetry Status Bar */}
          // <OSStatus />

          {/* Main Operating Environment Content */}
          <main id="victoros-main-content">
            {/* 1. Home / System Overview */}
            <SystemOverview
              onNavigate={scrollToSection}
              onOpenDoom={() => {
                setDoomInitialPrompt("");
                setIsDoomOpen(true);
              }}
            />

            {/* 2. Work Showcase Module */}
            <WorkSection
              selectedSlug={selectedProjectSlug}
              onSelectProject={handleOpenProject}
            />

            {/* 3. Journal Editorial Archive Module */}
            <JournalSection
              selectedSlug={selectedArticleSlug}
              onSelectArticle={handleOpenArticle}
            />

            {/* 4. Laboratory R&D Sandbox Module */}
            <LabSection />

            {/* 5. Knowledge Concept Lattice Module */}
            <KnowledgeSection
              onOpenProject={(slug) => {
                handleOpenProject(slug);
              }}
              onOpenArticle={(slug) => {
                handleOpenArticle(slug);
              }}
            />

            {/* 6. About Identity & Journey Module */}
            <AboutSection
              onNavigateToContact={() => scrollToSection("contact")}
            />

            {/* 7. Contact Direct Channels Module */}
            <ContactSection />
          </main>

          {/* Operating System Footer */}
          <OSFooter
            onScrollToTop={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            onNavigate={scrollToSection}
          />

          {/* Command Center Modal (⌘ K) */}
          <CommandCenter
            isOpen={isCmdOpen}
            onClose={closeCmd}
            onNavigate={scrollToSection}
            onOpenProject={(slug) => {
              handleOpenProject(slug);
            }}
            onOpenArticle={(slug) => {
              handleOpenArticle(slug);
            }}
            onAskDoom={handleAskDoomWithPrompt}
          />

          {/* Dr. Doom System Intelligence Assistant */}
          <DoomPanel
            isOpen={isDoomOpen}
            initialPrompt={doomInitialPrompt}
            onClose={() => setIsDoomOpen(false)}
            onNavigate={scrollToSection}
            onOpenProject={(slug) => {
              handleOpenProject(slug);
            }}
            onOpenArticle={(slug) => {
              handleOpenArticle(slug);
            }}
          />

          {/* Immersive Reader Chamber: Journal Article Experience */}
          <JournalReader
            slug={selectedArticleSlug}
            onClose={handleCloseReader}
            onSelectArticle={handleOpenArticle}
            lenisRef={lenisRef}
          />

          {/* Immersive Project Chamber: Case Study Architecture Experience */}
          <ProjectReader
            slug={selectedProjectSlug}
            onClose={handleCloseReader}
            onSelectProject={handleOpenProject}
            lenisRef={lenisRef}
          />
        </>
      )}
    </div>
  );
}

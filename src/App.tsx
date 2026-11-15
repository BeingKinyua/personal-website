import React, { useState, useEffect, useRef } from "react";
import Lenis from "lenis";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

// Shell Components
import { SystemEntry } from "./components/shell/SystemEntry";
import { OSNavigation } from "./components/shell/OSNavigation";
import { CommandPalette } from "./components/shell/CommandPalette";
import { OSFooter } from "./components/shell/OSFooter";

// Tovu Intelligence
import { TovuPanel } from "./components/tovu/TovuPanel";

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
import { useCommandPalette } from "./hooks/useCommandPalette";
import { useTheme } from "./hooks/useTheme";

gsap.registerPlugin(ScrollTrigger);

export default function App() {
  // Theme state synced with html[data-theme] and localStorage
  const { theme, toggleTheme } = useTheme();

  // System Entry Boot state
  const [hasEnteredSystem, setHasEnteredSystem] = useState<boolean>(() => {
    return (
      sessionStorage.getItem("tovu_boot_completed") === "true" ||
      sessionStorage.getItem("victoros_boot_completed") === "true"
    );
  });

  // Navigation and active section
  const [activeSection, setActiveSection] = useState<string>("home");

  // Deep-dive selection state
  const [selectedProjectSlug, setSelectedProjectSlug] = useState<string | null>(null);
  const [selectedArticleSlug, setSelectedArticleSlug] = useState<string | null>(null);

  // Command Palette state
  const { isOpen: isCmdOpen, open: openCmd, close: closeCmd } = useCommandPalette();

  // Tovu Intelligence panel state
  const [isTovuOpen, setIsTovuOpen] = useState<boolean>(false);
  const [tovuInitialPrompt, setTovuInitialPrompt] = useState<string>("");

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
      duration: 1.05,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: "vertical",
      gestureOrientation: "vertical",
      smoothWheel: true,
      wheelMultiplier: 1.05,
      prevent: (node) => {
        return (
          node instanceof HTMLElement &&
          (node.hasAttribute("data-lenis-prevent") ||
            Boolean(node.closest("[data-lenis-prevent]")) ||
            Boolean(node.closest("#tovu-immersive-overlay")) ||
            Boolean(node.closest("#victoros-immersive-overlay")) ||
            Boolean(node.closest("#reader-scroll-viewport")))
        );
      },
    });

    lenisRef.current = lenis;

    const raf = (time: number) => {
      lenis.raf(time * 1000);
    };

    lenis.on("scroll", ScrollTrigger.update);
    gsap.ticker.add(raf);

    const sections = ["home", "work", "journal", "lab", "knowledge", "about", "contact"];
    const handleScrollSpy = () => {
      const scrollY = window.scrollY + 260;
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
    sessionStorage.setItem("tovu_boot_completed", "true");
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

  const handleAskTovuWithPrompt = (prompt: string) => {
    setTovuInitialPrompt(prompt);
    setIsTovuOpen(true);
  };

  return (
    <div className="min-h-screen bg-[var(--tovu-bg-canvas)] text-[var(--tovu-text-primary)] font-sans selection:bg-[var(--tovu-accent-soft)] selection:text-[var(--tovu-accent)] antialiased overflow-x-hidden transition-colors duration-200">
      {/* State A: Boot / System Entry Screen */}
      {!hasEnteredSystem && (
        <SystemEntry onEnter={handleEnterSystem} />
      )}

      {/* State B: Full Tovu Environment */}
      {hasEnteredSystem && (
        <>
          {/* Refined Floating Navigation */}
          <OSNavigation
            activeSection={activeSection}
            onNavigate={scrollToSection}
            onOpenCommandPalette={openCmd}
            onOpenTovu={() => {
              setTovuInitialPrompt("");
              setIsTovuOpen(true);
            }}
            theme={theme}
            onToggleTheme={toggleTheme}
            lenisRef={lenisRef}
          />

          {/* Main Content */}
          <main id="tovu-main-content">
            <SystemOverview
              onNavigate={scrollToSection}
              onOpenTovu={() => {
                setTovuInitialPrompt("");
                setIsTovuOpen(true);
              }}
              theme={theme}
            />

            <WorkSection
              selectedSlug={selectedProjectSlug}
              onSelectProject={handleOpenProject}
            />

            <JournalSection
              selectedSlug={selectedArticleSlug}
              onSelectArticle={handleOpenArticle}
            />

            <LabSection />

            <KnowledgeSection
              onOpenProject={handleOpenProject}
              onOpenArticle={handleOpenArticle}
            />

            <AboutSection
              onNavigateToContact={() => scrollToSection("contact")}
            />

            <ContactSection />
          </main>

          {/* Editorial Footer */}
          <OSFooter
            onScrollToTop={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            onNavigate={scrollToSection}
          />

          {/* Command Palette Modal (⌘ K) */}
          <CommandPalette
            isOpen={isCmdOpen}
            onClose={closeCmd}
            onNavigate={scrollToSection}
            onOpenProject={handleOpenProject}
            onOpenArticle={handleOpenArticle}
            onAskTovu={handleAskTovuWithPrompt}
            lenisRef={lenisRef}
          />

          {/* Tovu Intelligence Assistant */}
          <TovuPanel
            isOpen={isTovuOpen}
            initialPrompt={tovuInitialPrompt}
            onClose={() => setIsTovuOpen(false)}
            onNavigate={scrollToSection}
            onOpenProject={handleOpenProject}
            onOpenArticle={handleOpenArticle}
            lenisRef={lenisRef}
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

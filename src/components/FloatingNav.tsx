import React, { useState, useEffect, useRef } from "react";
import { Bot, PhoneCall, Layout, BookOpen, User, Home } from "lucide-react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

interface FloatingNavProps {
  onToggleCopilot: () => void;
  isCopilotOpen: boolean;
}

export default function FloatingNav({ onToggleCopilot, isCopilotOpen }: FloatingNavProps) {
  const [activeSection, setActiveSection] = useState("hero");
  const headerRef = useRef<HTMLDivElement>(null);
  const navContainerRef = useRef<HTMLDivElement>(null);
  
  // Custom slider state for liquid slide effect
  const [sliderStyle, setSliderStyle] = useState({
    left: 0,
    width: 0,
    opacity: 0,
  });

  const sections = ["hero", "focus", "expertise", "projects", "blueprint", "research", "contact"];

  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY + 200; // Offset for header trigger
      
      for (const section of sections) {
        const el = document.getElementById(section);
        if (el) {
          const top = el.offsetTop;
          const height = el.offsetHeight;
          if (scrollPosition >= top && scrollPosition < top + height) {
            setActiveSection(section);
            break;
          }
        }
      }
    };

    window.addEventListener("scroll", handleScroll);
    handleScroll(); // initial load trigger
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Set up fluid slider coordinates
  useEffect(() => {
    let normalizedSection = activeSection;
    if (activeSection === "focus") normalizedSection = "hero";
    if (activeSection === "blueprint") normalizedSection = "expertise";

    const activeBtn = document.getElementById(`nav-link-${normalizedSection}`);
    const navLayout = document.getElementById("nav-layout-list");

    if (activeBtn && navLayout) {
      const btnBounds = activeBtn.getBoundingClientRect();
      const listBounds = navLayout.getBoundingClientRect();
      setSliderStyle({
        left: btnBounds.left - listBounds.left,
        width: btnBounds.width,
        opacity: 1,
      });
    } else {
      setSliderStyle((prev) => ({ ...prev, opacity: 0 }));
    }
  }, [activeSection]);

  // Recalculate on screen resize to keep layout perfectly crisp
  useEffect(() => {
    const handleResize = () => {
      let normalizedSection = activeSection;
      if (activeSection === "focus") normalizedSection = "hero";
      if (activeSection === "blueprint") normalizedSection = "expertise";

      const activeBtn = document.getElementById(`nav-link-${normalizedSection}`);
      const navLayout = document.getElementById("nav-layout-list");

      if (activeBtn && navLayout) {
        const btnBounds = activeBtn.getBoundingClientRect();
        const listBounds = navLayout.getBoundingClientRect();
        setSliderStyle({
          left: btnBounds.left - listBounds.left,
          width: btnBounds.width,
          opacity: 1,
        });
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [activeSection]);

  // GSAP Entrance & Scroll Animation hooks
  useEffect(() => {
    const header = headerRef.current;
    const container = navContainerRef.current;
    if (!header || !container) return;

    const ctx = gsap.context(() => {
      // 1. Initial Load floating-in effect
      gsap.fromTo(
        header,
        { opacity: 0, y: -40, xPercent: -50 },
        { opacity: 1, y: 0, xPercent: -50, duration: 1.1, ease: "power3.out" }
      );

      // 2. Shrink, drop closer, enhance shadow and blur on scroll
      ScrollTrigger.create({
        start: "top+=40 top",
        onEnter: () => {
          gsap.to(container, {
            scale: 0.96,
            y: -10, // Moves header closer to top-0 boundary
            boxShadow: "0 20px 42px rgba(0, 0, 0, 0.95), 0 0 1px rgba(255, 255, 255, 0.2)",
            borderColor: "rgba(255, 255, 255, 0.16)",
            background: "rgba(10, 11, 13, 0.88)",
            backdropFilter: "blur(28px)",
            duration: 0.4,
            ease: "power2.out",
          });
        },
        onLeaveBack: () => {
          gsap.to(container, {
            scale: 1,
            y: 0,
            boxShadow: "0 10px 25px rgba(0, 0, 0, 0.5), 0 0 1px rgba(255, 255, 255, 0.08)",
            borderColor: "rgba(255, 255, 255, 0.08)",
            background: "rgba(20, 22, 22, 0.75)",
            backdropFilter: "blur(20px)",
            duration: 0.4,
            ease: "power2.out",
          });
        },
      });
    });

    return () => {
      ctx.revert();
    };
  }, []);

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
  };

  const navItems = [
    { id: "hero", label: "Home", icon: Home },
    { id: "projects", label: "Work", icon: Layout },
    { id: "research", label: "Journal", icon: BookOpen },
    { id: "expertise", label: "About", icon: User },
    { id: "contact", label: "Contact", icon: PhoneCall },
  ];

  return (
    <header ref={headerRef} className="fixed top-6 left-1/2 -translate-x-1/2 z-50 w-[95%] max-w-2xl select-none">
      <nav 
        ref={navContainerRef}
        id="navbar-container"
        className="glass-pill rounded-full px-4 py-2.5 flex items-center justify-between shadow-2xl transition-all duration-300 border border-white/[0.08]"
        style={{
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          background: "rgba(20, 22, 22, 0.75)",
        }}
      >
        {/* Action Items List */}
        <div className="relative flex items-center justify-start flex-1">
          {/* Liquid Sliding Highlight Capsule */}
          <div
            className="absolute rounded-full bg-white/5 border border-white/10 transition-all duration-300 ease-out pointer-events-none"
            style={{
              left: `${sliderStyle.left}px`,
              width: `${sliderStyle.width}px`,
              opacity: sliderStyle.opacity,
              height: "32px",
              top: "50%",
              transform: "translateY(-50%)",
            }}
          />

          <ul id="nav-layout-list" className="flex items-center gap-1 md:gap-2 relative z-10">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isItemActive = 
                activeSection === item.id || 
                (item.id === "hero" && activeSection === "focus") ||
                (item.id === "expertise" && activeSection === "blueprint");
                
              return (
                <li key={item.id} id={`nav-li-${item.id}`}>
                  <button
                    id={`nav-link-${item.id}`}
                    onClick={() => scrollToSection(item.id)}
                    className={`relative px-3 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider transition-colors duration-250 flex items-center gap-1.5 group cursor-pointer ${
                      isItemActive 
                        ? "text-white" 
                        : "text-slate-400 hover:text-white"
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5 block md:hidden" />
                    <span className="hidden md:inline relative py-0.5">
                      {item.label}
                      {/* Growing hover line from center */}
                      <span className="absolute bottom-0 left-0 w-full h-[1.5px] bg-[#c3c0ff] scale-x-0 group-hover:scale-x-100 transition-transform duration-250 ease-out origin-center" />
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>

        {/* AI Copilot Summon button */}
        <button
          id="nav-copilot-trigger"
          onClick={onToggleCopilot}
          className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider border transition-all duration-200 active:scale-95 hover:-translate-y-[1px] hover:shadow-lg ${
            isCopilotOpen
              ? "bg-[#c3c0ff] text-[#1d00a5] border-transparent hover:bg-[#dad7ff]"
              : "bg-transparent border-[#c3c0ff]/30 text-[#c3c0ff] hover:border-[#c3c0ff] hover:bg-[#c3c0ff]/5"
          }`}
        >
          <Bot className="w-4 h-4 animate-pulse" />
          <span className="hidden md:inline">AI Copilot</span>
        </button>
      </nav>
    </header>
  );
}

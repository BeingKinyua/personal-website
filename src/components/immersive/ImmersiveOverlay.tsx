import React, { useEffect, useRef } from "react";
import { useScrollLock } from "../../hooks/useScrollLock";
import Lenis from "lenis";

interface ImmersiveOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  lenisRef?: React.RefObject<Lenis | null>;
  className?: string;
  scrollerRef: React.RefObject<HTMLDivElement | null>;
}

export const ImmersiveOverlay: React.FC<ImmersiveOverlayProps> = ({
  isOpen,
  onClose,
  children,
  lenisRef,
  className = "",
  scrollerRef,
}) => {
  // Apply robust body scroll lock and Lenis pausing
  useScrollLock({
    lock: isOpen,
    lenisRef,
  });

  // Handle ESC key to close
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  // Subtle background VictorOS depth recede effect
  useEffect(() => {
    if (typeof document === "undefined") return;
    const mainEl = document.getElementById("victoros-main-content");
    const navEl = document.getElementById("victoros-floating-nav");

    if (isOpen) {
      if (mainEl) {
        mainEl.style.transition = "transform 0.4s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.3s ease, filter 0.3s ease";
        mainEl.style.transform = "scale(0.985)";
        mainEl.style.opacity = "0.75";
        mainEl.style.filter = "blur(1.5px)";
        mainEl.style.pointerEvents = "none";
      }
      if (navEl) {
        navEl.style.opacity = "0";
        navEl.style.pointerEvents = "none";
      }
    } else {
      if (mainEl) {
        mainEl.style.transform = "";
        mainEl.style.opacity = "";
        mainEl.style.filter = "";
        mainEl.style.pointerEvents = "";
      }
      if (navEl) {
        navEl.style.opacity = "";
        navEl.style.pointerEvents = "";
      }
    }

    return () => {
      if (mainEl) {
        mainEl.style.transform = "";
        mainEl.style.opacity = "";
        mainEl.style.filter = "";
        mainEl.style.pointerEvents = "";
      }
      if (navEl) {
        navEl.style.opacity = "";
        navEl.style.pointerEvents = "";
      }
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      id="victoros-immersive-overlay"
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-[100] flex flex-col bg-black/90 backdrop-blur-2xl animate-fadeIn text-zinc-100 overflow-hidden"
    >
      {/* 
        Independent Reader Scroll Container
        overscroll-behavior: contain prevents any wheel or touch momentum from chaining to VictorOS beneath
      */}
      <div
        ref={scrollerRef}
        id="reader-scroll-viewport"
        tabIndex={-1}
        className={`w-full h-full overflow-y-auto overscroll-contain scrollbar-thin outline-none ${className}`}
        style={{
          WebkitOverflowScrolling: "touch",
          overscrollBehavior: "contain",
        }}
      >
        {children}
      </div>
    </div>
  );
};

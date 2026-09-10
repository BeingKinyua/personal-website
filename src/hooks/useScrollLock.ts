import { useEffect, useRef } from "react";
import Lenis from "lenis";

interface ScrollLockOptions {
  lock: boolean;
  lenisRef?: React.RefObject<Lenis | null>;
  onLockChange?: (isLocked: boolean) => void;
}

/**
 * useScrollLock
 * Robust scroll locking that preserves the exact window scroll position,
 * prevents horizontal layout shift by accounting for scrollbar width,
 * pauses background Lenis smooth-scroller, and restores original styles and position safely upon unlock.
 */
export function useScrollLock({ lock, lenisRef, onLockChange }: ScrollLockOptions) {
  const scrollYRef = useRef<number>(0);
  const isLockedRef = useRef<boolean>(false);

  useEffect(() => {
    if (typeof window === "undefined" || typeof document === "undefined") return;

    if (lock && !isLockedRef.current) {
      // 1. Capture exact current scroll position before modifying DOM
      const currentScrollY = window.scrollY || window.pageYOffset || document.documentElement.scrollTop || 0;
      scrollYRef.current = currentScrollY;

      // 2. Measure scrollbar width to prevent horizontal layout shift
      const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;

      // 3. Pause Lenis if available
      if (lenisRef?.current) {
        try {
          lenisRef.current.stop();
        } catch (e) {
          console.warn("Lenis stop failed:", e);
        }
      }

      // 4. Save original document/body inline styles
      const originalBodyOverflow = document.body.style.overflow;
      const originalBodyPaddingRight = document.body.style.paddingRight;

      // 5. Lock body scroll cleanly without position:fixed or html:overflow-hidden
      // This prevents locking up inner scroll containers inside iframes or WebKit viewports
      document.body.style.overflow = "hidden";

      if (scrollbarWidth > 0) {
        document.body.style.paddingRight = `${scrollbarWidth}px`;
      }

      isLockedRef.current = true;
      onLockChange?.(true);

      return () => {
        // Unlock and restore original styles
        document.body.style.overflow = originalBodyOverflow;
        document.body.style.paddingRight = originalBodyPaddingRight;

        // Restore exact scroll position if shifted
        if (window.scrollY !== scrollYRef.current) {
          window.scrollTo(0, scrollYRef.current);
        }

        // Resume Lenis
        if (lenisRef?.current) {
          try {
            lenisRef.current.start();
          } catch (e) {
            console.warn("Lenis start failed:", e);
          }
        }

        isLockedRef.current = false;
        onLockChange?.(false);
      };
    } else if (!lock && isLockedRef.current) {
      // Manual unlock
      document.body.style.overflow = "";
      document.body.style.paddingRight = "";

      if (window.scrollY !== scrollYRef.current) {
        window.scrollTo(0, scrollYRef.current);
      }

      if (lenisRef?.current) {
        try {
          lenisRef.current.start();
        } catch (e) {
          console.warn("Lenis start failed:", e);
        }
      }

      isLockedRef.current = false;
      onLockChange?.(false);
    }
  }, [lock, lenisRef, onLockChange]);
}

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
      const originalBodyPosition = document.body.style.position;
      const originalBodyTop = document.body.style.top;
      const originalBodyWidth = document.body.style.width;
      const originalBodyPaddingRight = document.body.style.paddingRight;
      const originalHtmlOverflow = document.documentElement.style.overflow;

      // 5. Lock body at current offset
      document.body.style.overflow = "hidden";
      document.body.style.position = "fixed";
      document.body.style.top = `-${currentScrollY}px`;
      document.body.style.width = "100%";
      document.documentElement.style.overflow = "hidden";

      if (scrollbarWidth > 0) {
        document.body.style.paddingRight = `${scrollbarWidth}px`;
      }

      isLockedRef.current = true;
      onLockChange?.(true);

      return () => {
        // Unlock and restore original styles
        document.body.style.overflow = originalBodyOverflow;
        document.body.style.position = originalBodyPosition;
        document.body.style.top = originalBodyTop;
        document.body.style.width = originalBodyWidth;
        document.body.style.paddingRight = originalBodyPaddingRight;
        document.documentElement.style.overflow = originalHtmlOverflow;

        // Restore exact scroll position
        window.scrollTo(0, scrollYRef.current);

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
      document.body.style.position = "";
      document.body.style.top = "";
      document.body.style.width = "";
      document.body.style.paddingRight = "";
      document.documentElement.style.overflow = "";

      window.scrollTo(0, scrollYRef.current);

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

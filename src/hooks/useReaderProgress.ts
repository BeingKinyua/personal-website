import { useState, useEffect, RefObject } from "react";

export function useReaderProgress(containerRef: RefObject<HTMLElement | null>) {
  const [progress, setProgress] = useState(0);
  const [hasScrolled, setHasScrolled] = useState(false);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = container;
      const maxScroll = scrollHeight - clientHeight;
      if (maxScroll <= 0) {
        setProgress(0);
        return;
      }
      const rawProgress = (scrollTop / maxScroll) * 100;
      const clamped = Math.min(100, Math.max(0, rawProgress));
      setProgress(clamped);
      setHasScrolled(scrollTop > 20);
    };

    container.addEventListener("scroll", handleScroll, { passive: true });
    // Run once on mount
    handleScroll();

    return () => {
      container.removeEventListener("scroll", handleScroll);
    };
  }, [containerRef]);

  return { progress, hasScrolled };
}

import { useLayoutEffect, useEffect, useRef } from "react";
import { gsap } from "../../lib/motion/gsap";

const useIsomorphicLayoutEffect = typeof window !== "undefined" ? useLayoutEffect : useEffect;

/**
 * useGsapContext wraps GSAP animations in a scoped context with automatic cleanup.
 * Handles React Strict Mode and unmounts safely.
 */
export function useGsapContext(
  animationCallback: (context: gsap.Context) => void,
  scopeRef?: React.RefObject<HTMLElement | null>,
  deps: React.DependencyList = []
) {
  const isMounted = useRef(false);

  useIsomorphicLayoutEffect(() => {
    isMounted.current = true;
    const scope = scopeRef ? scopeRef.current : undefined;
    
    // Create scoped context
    const ctx = gsap.context((self) => {
      animationCallback(self);
    }, scope || undefined);

    return () => {
      isMounted.current = false;
      ctx.revert();
    };
  }, deps);
}

import { RefObject } from "react";
import { gsap } from "../../lib/motion/gsap";
import { motion } from "../../lib/motion/config";
import { useGsapContext } from "./useGsapContext";
import { useReducedMotion } from "./useReducedMotion";

export interface UseTextRevealOptions {
  trigger?: "scroll" | "load" | "manual";
  delay?: number;
  duration?: number;
  stagger?: number;
  scrollStart?: string;
  onComplete?: () => void;
}

export function useTextReveal(
  containerRef: RefObject<HTMLElement | null>,
  linesSelector: string = ".reveal-line",
  options: UseTextRevealOptions = {}
) {
  const prefersReduced = useReducedMotion();
  const {
    trigger = "scroll",
    delay = 0,
    duration = motion.duration.slow,
    stagger = motion.stagger.line,
    scrollStart = motion.scrollTriggerDefaults.start,
    onComplete
  } = options;

  useGsapContext(
    () => {
      const container = containerRef.current;
      if (!container) return;

      const elements = container.querySelectorAll(linesSelector);
      if (!elements || elements.length === 0) return;

      if (prefersReduced) {
        gsap.to(elements, {
          opacity: 1,
          duration: motion.duration.fast,
          delay,
          stagger: 0.05,
          onComplete,
        });
        return;
      }

      // Initial state
      gsap.set(elements, {
        yPercent: 110,
        opacity: 0,
      });

      const animProps: gsap.TweenVars = {
        yPercent: 0,
        opacity: 1,
        duration,
        stagger,
        delay,
        ease: motion.ease.enter,
        onComplete,
      };

      if (trigger === "scroll") {
        animProps.scrollTrigger = {
          trigger: container,
          start: scrollStart,
          once: true,
        };
      }

      gsap.to(elements, animProps);
    },
    containerRef,
    [trigger, delay, duration, stagger, prefersReduced]
  );
}

import { RefObject } from "react";
import { gsap } from "../../lib/motion/gsap";
import { motion } from "../../lib/motion/config";
import { useGsapContext } from "./useGsapContext";
import { useReducedMotion } from "./useReducedMotion";

export interface UseWordRevealOptions {
  trigger?: "scroll" | "load";
  delay?: number;
  duration?: number;
  stagger?: number;
  scrollStart?: string;
  onComplete?: () => void;
}

export function useWordReveal(
  containerRef: RefObject<HTMLElement | null>,
  wordsSelector: string = ".reveal-word",
  options: UseWordRevealOptions = {}
) {
  const prefersReduced = useReducedMotion();
  const {
    trigger = "scroll",
    delay = 0,
    duration = motion.duration.normal,
    stagger = motion.stagger.tight,
    scrollStart = motion.scrollTriggerDefaults.start,
    onComplete
  } = options;

  useGsapContext(
    () => {
      const container = containerRef.current;
      if (!container) return;

      const words = container.querySelectorAll(wordsSelector);
      if (!words || words.length === 0) return;

      if (prefersReduced) {
        gsap.to(words, {
          opacity: 1,
          duration: motion.duration.fast,
          delay,
          stagger: 0.02,
          onComplete,
        });
        return;
      }

      gsap.set(words, {
        y: 18,
        opacity: 0,
      });

      const animProps: gsap.TweenVars = {
        y: 0,
        opacity: 1,
        duration,
        stagger,
        delay,
        ease: motion.ease.reveal,
        onComplete,
      };

      if (trigger === "scroll") {
        animProps.scrollTrigger = {
          trigger: container,
          start: scrollStart,
          once: true,
        };
      }

      gsap.to(words, animProps);
    },
    containerRef,
    [trigger, delay, duration, stagger, prefersReduced]
  );
}

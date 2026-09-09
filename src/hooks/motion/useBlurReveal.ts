import { RefObject } from "react";
import { gsap } from "../../lib/motion/gsap";
import { motion } from "../../lib/motion/config";
import { useGsapContext } from "./useGsapContext";
import { useReducedMotion } from "./useReducedMotion";

export interface UseBlurRevealOptions {
  trigger?: "scroll" | "load";
  delay?: number;
  duration?: number;
  blurAmount?: number;
  scrollStart?: string;
  onComplete?: () => void;
}

export function useBlurReveal(
  targetRef: RefObject<HTMLElement | null>,
  options: UseBlurRevealOptions = {}
) {
  const prefersReduced = useReducedMotion();
  const {
    trigger = "scroll",
    delay = 0,
    duration = motion.duration.slow,
    blurAmount = 8,
    scrollStart = motion.scrollTriggerDefaults.start,
    onComplete
  } = options;

  useGsapContext(
    () => {
      const target = targetRef.current;
      if (!target) return;

      if (prefersReduced) {
        gsap.to(target, {
          opacity: 1,
          duration: motion.duration.fast,
          delay,
          onComplete,
        });
        return;
      }

      gsap.set(target, {
        opacity: 0,
        y: 16,
        filter: `blur(${blurAmount}px)`,
      });

      const animProps: gsap.TweenVars = {
        opacity: 1,
        y: 0,
        filter: "blur(0px)",
        duration,
        delay,
        ease: motion.ease.reveal,
        onComplete,
      };

      if (trigger === "scroll") {
        animProps.scrollTrigger = {
          trigger: target,
          start: scrollStart,
          once: true,
        };
      }

      gsap.to(target, animProps);
    },
    targetRef,
    [trigger, delay, duration, blurAmount, prefersReduced]
  );
}

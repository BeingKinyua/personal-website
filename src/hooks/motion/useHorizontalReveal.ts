import { RefObject } from "react";
import { gsap } from "../../lib/motion/gsap";
import { motion } from "../../lib/motion/config";
import { useGsapContext } from "./useGsapContext";
import { useReducedMotion } from "./useReducedMotion";

export interface UseHorizontalRevealOptions {
  direction?: "left" | "right";
  distance?: number;
  trigger?: "scroll" | "load" | "manual";
  delay?: number;
  duration?: number;
  scrollStart?: string;
  onComplete?: () => void;
}

export function useHorizontalReveal(
  targetRef: RefObject<HTMLElement | null>,
  options: UseHorizontalRevealOptions = {}
) {
  const prefersReduced = useReducedMotion();
  const {
    direction = "left",
    distance = 50,
    trigger = "scroll",
    delay = 0,
    duration = motion.duration.slow,
    scrollStart = "top 85%",
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

      const initialX = direction === "left" ? -distance : distance;

      gsap.set(target, {
        x: initialX,
        opacity: 0,
      });

      const animProps: gsap.TweenVars = {
        x: 0,
        opacity: 1,
        duration,
        delay,
        ease: motion.ease.enter,
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
    [direction, distance, trigger, delay, duration, prefersReduced]
  );
}

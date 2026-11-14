import { RefObject } from "react";
import { gsap } from "../../../lib/motion/gsap";
import { motion } from "../../../lib/motion/config";
import { useGsapContext } from "../../../hooks/motion/useGsapContext";
import { useReducedMotion } from "../../../hooks/useReducedMotion";

export function useHeroEntranceAnimation(containerRef: RefObject<HTMLElement | null>) {
  const prefersReducedMotion = useReducedMotion();

  useGsapContext(
    () => {
      const container = containerRef.current;
      if (!container) return;

      const eyebrow = container.querySelectorAll("[data-hero-eyebrow]");
      const lines = container.querySelectorAll("[data-hero-line]");
      const description = container.querySelectorAll("[data-hero-description]");
      const ctas = container.querySelectorAll("[data-hero-cta]");

      if (prefersReducedMotion) {
        gsap.set([...eyebrow, ...lines, ...description, ...ctas], {
          opacity: 1,
          y: 0,
          yPercent: 0,
          clearProps: "filter,transform",
        });
        return;
      }

      const tl = gsap.timeline({ defaults: { ease: motion.ease.enter } });

      if (eyebrow.length > 0) {
        gsap.set(eyebrow, { opacity: 0, y: 10 });
        tl.to(eyebrow, {
          opacity: 1,
          y: 0,
          duration: 0.55,
          clearProps: "transform",
        });
      }

      if (lines.length > 0) {
        gsap.set(lines, { yPercent: 110, opacity: 0 });
        tl.to(
          lines,
          {
            yPercent: 0,
            opacity: 1,
            duration: 0.85,
            stagger: 0.1,
            clearProps: "transform",
          },
          "-=0.35"
        );
      }

      if (description.length > 0) {
        gsap.set(description, { opacity: 0, y: 12 });
        tl.to(
          description,
          {
            opacity: 1,
            y: 0,
            duration: 0.65,
            clearProps: "transform",
          },
          "-=0.45"
        );
      }

      if (ctas.length > 0) {
        gsap.set(ctas, { opacity: 0, y: 12 });
        tl.to(
          ctas,
          {
            opacity: 1,
            y: 0,
            duration: 0.6,
            clearProps: "transform",
          },
          "-=0.4"
        );
      }
    },
    containerRef,
    [prefersReducedMotion]
  );
}

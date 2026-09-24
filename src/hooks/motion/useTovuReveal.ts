import { RefObject } from "react";
import { gsap } from "../../lib/motion/gsap";
import { motion } from "../../lib/motion/config";
import { useGsapContext } from "./useGsapContext";
import { useReducedMotion } from "./useReducedMotion";

export interface UseTovuRevealOptions {
  onComplete?: () => void;
}

export function useTovuReveal(
  containerRef: RefObject<HTMLElement | null>,
  options: UseTovuRevealOptions = {}
) {
  const prefersReduced = useReducedMotion();

  useGsapContext(
    () => {
      const container = containerRef.current;
      if (!container) return;

      const identityEl = container.querySelector(".tovu-identity, .doom-identity");
      const thoughtLines = container.querySelectorAll(".tovu-thought-line, .doom-thought-line");
      const infoCards = container.querySelectorAll(".tovu-info-card, .doom-info-card");
      const actionButtons = container.querySelectorAll(".tovu-action-btn, .doom-action-btn");

      if (prefersReduced) {
        gsap.to([identityEl, ...Array.from(thoughtLines), ...Array.from(infoCards), ...Array.from(actionButtons)].filter(Boolean), {
          opacity: 1,
          duration: motion.duration.fast,
          stagger: 0.05,
          onComplete: options.onComplete,
        });
        return;
      }

      const tl = gsap.timeline({
        onComplete: options.onComplete,
      });

      // STEP 1: IDENTITY (Blur to focus + Letter tracking)
      if (identityEl) {
        gsap.set(identityEl, {
          opacity: 0,
          letterSpacing: "0.2em",
          filter: "blur(6px)",
        });

        tl.to(identityEl, {
          opacity: 1,
          letterSpacing: "0.05em",
          filter: "blur(0px)",
          duration: motion.duration.normal,
          ease: motion.ease.reveal,
        });
      }

      // STEP 2: THOUGHT (Masked upward lines)
      if (thoughtLines.length > 0) {
        gsap.set(thoughtLines, {
          opacity: 0,
          y: 12,
        });

        tl.to(
          thoughtLines,
          {
            opacity: 1,
            y: 0,
            duration: motion.duration.normal,
            stagger: 0.08,
            ease: motion.ease.reveal,
          },
          "-=0.1"
        );
      }

      // STEP 3: INFORMATION CARDS
      if (infoCards.length > 0) {
        gsap.set(infoCards, {
          opacity: 0,
          y: 10,
          scale: 0.98,
        });

        tl.to(
          infoCards,
          {
            opacity: 1,
            y: 0,
            scale: 1,
            duration: motion.duration.normal,
            stagger: 0.06,
            ease: motion.ease.reveal,
          },
          "-=0.15"
        );
      }

      // STEP 4: ACTION BUTTONS
      if (actionButtons.length > 0) {
        gsap.set(actionButtons, {
          opacity: 0,
          scale: 0.95,
        });

        tl.to(
          actionButtons,
          {
            opacity: 1,
            scale: 1,
            duration: motion.duration.fast,
            stagger: 0.05,
            ease: motion.ease.reveal,
          },
          "-=0.1"
        );
      }
    },
    containerRef,
    [options.onComplete]
  );
}

// Backwards-compatible alias
export const useDoomReveal = useTovuReveal;

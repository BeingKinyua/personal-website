import { RefObject } from "react";
import { gsap } from "../../lib/motion/gsap";
import { motion } from "../../lib/motion/config";
import { useGsapContext } from "./useGsapContext";
import { useReducedMotion } from "./useReducedMotion";

export interface UseDoomRevealOptions {
  onComplete?: () => void;
}

export function useDoomReveal(
  containerRef: RefObject<HTMLElement | null>,
  options: UseDoomRevealOptions = {}
) {
  const prefersReduced = useReducedMotion();

  useGsapContext(
    () => {
      const container = containerRef.current;
      if (!container) return;

      const identityEl = container.querySelector(".doom-identity");
      const thoughtLines = container.querySelectorAll(".doom-thought-line");
      const infoCards = container.querySelectorAll(".doom-info-card");
      const actionButtons = container.querySelectorAll(".doom-action-btn");

      if (prefersReduced) {
        gsap.to([identityEl, thoughtLines, infoCards, actionButtons], {
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
          "-=0.2"
        );
      }

      // STEP 3: INFORMATION (Result cards rise slightly and fade)
      if (infoCards.length > 0) {
        gsap.set(infoCards, {
          opacity: 0,
          y: 16,
          scale: 0.98,
        });

        tl.to(
          infoCards,
          {
            opacity: 1,
            y: 0,
            scale: 1,
            duration: motion.duration.normal,
            stagger: 0.08,
            ease: motion.ease.reveal,
          },
          "-=0.1"
        );
      }

      // STEP 4: ACTION (Action buttons arrive last)
      if (actionButtons.length > 0) {
        gsap.set(actionButtons, {
          opacity: 0,
          scale: 0.95,
        });

        tl.to(actionButtons, {
          opacity: 1,
          scale: 1,
          duration: motion.duration.fast,
          stagger: 0.06,
          ease: motion.ease.enter,
        });
      }
    },
    containerRef,
    [prefersReduced]
  );
}

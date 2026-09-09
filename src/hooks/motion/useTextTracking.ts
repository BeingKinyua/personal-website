import { RefObject } from "react";
import { gsap, ScrollTrigger } from "../../lib/motion/gsap";
import { motion } from "../../lib/motion/config";
import { useGsapContext } from "./useGsapContext";
import { useReducedMotion } from "./useReducedMotion";

export type SystemTextVariant = "tracking" | "character" | "decode";

export interface UseTextTrackingOptions {
  variant?: SystemTextVariant;
  trigger?: "scroll" | "load" | "manual";
  delay?: number;
  duration?: number;
  targetText?: string;
  onComplete?: () => void;
}

const CHARS = "ABCDEFGHJKLMNOPQRSTUVWXYZ0123456789!#$%&";

export function useTextTracking(
  targetRef: RefObject<HTMLElement | null>,
  options: UseTextTrackingOptions = {}
) {
  const prefersReduced = useReducedMotion();
  const {
    variant = "tracking",
    trigger = "load",
    delay = 0,
    duration = motion.duration.normal,
    targetText,
    onComplete,
  } = options;

  useGsapContext(
    () => {
      const target = targetRef.current;
      if (!target) return;

      const finalText = targetText || target.textContent || "";

      if (prefersReduced) {
        target.textContent = finalText;
        gsap.to(target, { opacity: 1, duration: motion.duration.fast, delay, onComplete });
        return;
      }

      if (variant === "decode") {
        // Subtle, purposeful scramble decode (max 0.5s)
        const totalFrames = Math.floor(Math.min(duration, 0.6) * 30);
        let frame = 0;

        gsap.set(target, { opacity: 1 });

        const tween = gsap.to(
          {},
          {
            duration: Math.min(duration, 0.6),
            delay,
            ease: "none",
            onUpdate: () => {
              frame++;
              const progress = frame / totalFrames;
              const resolvedCount = Math.floor(progress * finalText.length);

              let currentText = "";
              for (let i = 0; i < finalText.length; i++) {
                if (finalText[i] === " " || finalText[i] === "\n") {
                  currentText += finalText[i];
                } else if (i < resolvedCount) {
                  currentText += finalText[i];
                } else {
                  currentText += CHARS[Math.floor(Math.random() * CHARS.length)];
                }
              }
              target.textContent = currentText;
            },
            onComplete: () => {
              target.textContent = finalText;
              onComplete?.();
            },
          }
        );

        if (trigger === "scroll") {
          ScrollTrigger.create({
            trigger: target,
            start: motion.scrollTriggerDefaults.start,
            once: true,
            onEnter: () => tween.play(),
          });
          tween.pause();
        }
        return;
      }

      if (variant === "tracking") {
        // Spacing closes gradually
        gsap.set(target, {
          letterSpacing: "0.22em",
          opacity: 0,
        });

        const animProps: gsap.TweenVars = {
          letterSpacing: "0.02em",
          opacity: 1,
          duration,
          delay,
          ease: motion.ease.reveal,
          onComplete,
        };

        if (trigger === "scroll") {
          animProps.scrollTrigger = {
            trigger: target,
            start: motion.scrollTriggerDefaults.start,
            once: true,
          };
        }

        gsap.to(target, animProps);
        return;
      }

      if (variant === "character") {
        // Character resolution: slight vertical offset and blur resolving
        const chars = target.querySelectorAll(".sys-char");
        if (chars.length > 0) {
          gsap.set(chars, {
            opacity: 0,
            y: 8,
            filter: "blur(4px)",
          });

          const animProps: gsap.TweenVars = {
            opacity: 1,
            y: 0,
            filter: "blur(0px)",
            duration: motion.duration.normal,
            stagger: 0.03,
            delay,
            ease: motion.ease.reveal,
            onComplete,
          };

          if (trigger === "scroll") {
            animProps.scrollTrigger = {
              trigger: target,
              start: motion.scrollTriggerDefaults.start,
              once: true,
            };
          }

          gsap.to(chars, animProps);
        }
      }
    },
    targetRef,
    [variant, trigger, delay, duration, targetText, prefersReduced]
  );
}

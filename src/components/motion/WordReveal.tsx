import React, { useRef } from "react";
import { useWordReveal } from "../../hooks/motion/useWordReveal";
import { motion } from "../../lib/motion/config";

export interface WordRevealProps {
  children: string;
  trigger?: "scroll" | "load";
  stagger?: number;
  duration?: number;
  delay?: number;
  className?: string;
  as?: "div" | "p" | "span" | "h1" | "h2" | "h3" | "h4" | "section" | "article";
  scrollStart?: string;
  onComplete?: () => void;
}

export const WordReveal: React.FC<WordRevealProps> = ({
  children,
  trigger = "scroll",
  stagger = motion.stagger.tight,
  duration = motion.duration.normal,
  delay = 0,
  className = "",
  as: Component = "p",
  scrollStart = motion.scrollTriggerDefaults.start,
  onComplete,
}) => {
  const containerRef = useRef<HTMLElement>(null);

  useWordReveal(containerRef, ".reveal-word", {
    trigger,
    delay,
    duration,
    stagger,
    scrollStart,
    onComplete,
  });

  const words = children.split(" ");

  return (
    <Component
      ref={containerRef as any}
      className={`word-reveal-container ${className}`}
    >
      {words.map((word, index) => (
        <span key={index} className="inline-block overflow-hidden mr-[0.25em] align-top">
          <span className="reveal-word inline-block will-change-transform">
            {word}
          </span>
        </span>
      ))}
    </Component>
  );
};

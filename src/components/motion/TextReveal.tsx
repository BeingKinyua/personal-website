import React, { useRef } from "react";
import { useTextReveal } from "../../hooks/motion/useTextReveal";
import { motion } from "../../lib/motion/config";

export interface TextRevealProps {
  children: React.ReactNode;
  type?: "lines" | "words";
  trigger?: "scroll" | "load" | "manual";
  stagger?: number;
  duration?: number;
  delay?: number;
  className?: string;
  as?: "div" | "p" | "span" | "h1" | "h2" | "h3" | "h4" | "section" | "article";
  scrollStart?: string;
  onComplete?: () => void;
}

export const TextReveal: React.FC<TextRevealProps> = ({
  children,
  type = "lines",
  trigger = "scroll",
  stagger = motion.stagger.line,
  duration = motion.duration.slow,
  delay = 0,
  className = "",
  as: Component = "div",
  scrollStart = motion.scrollTriggerDefaults.start,
  onComplete,
}) => {
  const containerRef = useRef<HTMLElement>(null);

  useTextReveal(containerRef, ".reveal-line", {
    trigger,
    delay,
    duration,
    stagger,
    scrollStart,
    onComplete,
  });

  // If children is a string, split by lines or treat as single line
  const lines = typeof children === "string"
    ? children.split("\n").filter((l) => l.trim().length > 0)
    : React.Children.toArray(children);

  return (
    <Component
      ref={containerRef as any}
      className={`text-reveal-container ${className}`}
    >
      {lines.map((line, idx) => (
        <span
          key={idx}
          className="reveal-line-wrapper block overflow-hidden leading-[1.2] py-0.5"
        >
          <span className="reveal-line inline-block will-change-transform">
            {line}
          </span>
        </span>
      ))}
    </Component>
  );
};

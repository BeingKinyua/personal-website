import React, { useRef } from "react";
import { useTextTracking, SystemTextVariant } from "../../hooks/motion/useTextTracking";
import { motion } from "../../lib/motion/config";

export interface SystemTextProps {
  children: string;
  variant?: SystemTextVariant;
  trigger?: "scroll" | "load" | "manual";
  duration?: number;
  delay?: number;
  className?: string;
  as?: "div" | "p" | "span" | "h1" | "h2" | "h3" | "h4";
  onComplete?: () => void;
}

export const SystemText: React.FC<SystemTextProps> = ({
  children,
  variant = "tracking",
  trigger = "load",
  duration = motion.duration.normal,
  delay = 0,
  className = "",
  as: Component = "span",
  onComplete,
}) => {
  const targetRef = useRef<HTMLElement>(null);

  useTextTracking(targetRef, {
    variant,
    trigger,
    delay,
    duration,
    targetText: children,
    onComplete,
  });

  if (variant === "character") {
    return (
      <Component
        ref={targetRef as any}
        className={`system-text-target inline-block ${className}`}
      >
        {children.split("").map((char, index) => (
          <span
            key={index}
            className="sys-char inline-block will-change-transform"
          >
            {char === " " ? "\u00A0" : char}
          </span>
        ))}
      </Component>
    );
  }

  return (
    <Component
      ref={targetRef as any}
      className={`system-text-target inline-block will-change-transform ${className}`}
    >
      {children}
    </Component>
  );
};

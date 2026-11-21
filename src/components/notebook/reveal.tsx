"use client";

import { motion, useReducedMotion, useScroll, useSpring, useTransform } from "framer-motion";
import { useRef, type ReactNode } from "react";

/* =====================================================================
 * REVEAL — hiệu ứng xuất hiện khi cuộn tới, tôn trọng reduced-motion.
 * ===================================================================== */

const EASE = [0.21, 0.47, 0.32, 0.98] as const;

export function FadeIn({
  children,
  delay = 0,
  y = 24,
  className,
  once = true,
}: {
  children: ReactNode;
  delay?: number;
  y?: number;
  className?: string;
  once?: boolean;
}) {
  const reduced = useReducedMotion();
  if (reduced) return <div className={className}>{children}</div>;
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once, margin: "-60px" }}
      transition={{ duration: 0.62, delay, ease: EASE }}
    >
      {children}
    </motion.div>
  );
}

export function Stagger({ children, className }: { children: ReactNode; className?: string }) {
  const reduced = useReducedMotion();
  if (reduced) return <div className={className}>{children}</div>;
  return (
    <motion.div
      className={className}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: "-60px" }}
      variants={{
        hidden: {},
        show: { transition: { staggerChildren: 0.09 } },
      }}
    >
      {children}
    </motion.div>
  );
}

export function StaggerItem({ children, className }: { children: ReactNode; className?: string }) {
  const reduced = useReducedMotion();
  if (reduced) return <div className={className}>{children}</div>;
  return (
    <motion.div
      className={className}
      variants={{
        hidden: { opacity: 0, y: 20, rotate: 0.4 },
        show: { opacity: 1, y: 0, rotate: 0, transition: { duration: 0.55, ease: EASE } },
      }}
    >
      {children}
    </motion.div>
  );
}

/** Parallax nhẹ theo cuộn trang — tốc độ dương đi nhanh hơn, âm lùi lại. */
export function Parallax({
  children,
  speed = 0.09,
  className,
}: {
  children: ReactNode;
  speed?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const y = useSpring(useTransform(scrollYProgress, [0, 1], [speed * -320, speed * 320]), {
    stiffness: 90,
    damping: 24,
  });
  if (reduced) return <div className={className}>{children}</div>;
  return (
    <div ref={ref} className={className}>
      <motion.div style={{ y }}>{children}</motion.div>
    </div>
  );
}

/** Nút style "mực" dùng chung cho landing & workspace. */
export function InkButton({
  children,
  variant = "royal",
  size = "md",
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "royal" | "outline" | "ghost" | "coal" | "white";
  size?: "sm" | "md" | "lg";
}) {
  const sizes = {
    sm: "px-3.5 py-2 text-[0.82rem]",
    md: "px-5 py-2.5 text-sm",
    lg: "px-7 py-3.5 text-base",
  };
  const variants = {
    /* shadow-nb-ink-* = sandbox's ink-shadow ladder (var(--hard-shadow)),
       defined in src/styles/journey.css — the real repo's own shadow-ink-*
       ladder uses var(--ink) and stays untouched. */
    royal:
      "bg-[var(--royal)] text-white border-2 border-[var(--ink)] shadow-nb-ink-3 hover:-translate-y-0.5 hover:shadow-nb-ink-4 active:translate-y-0 active:shadow-nb-ink-2 dark:text-[#101018]",
    outline:
      "bg-[var(--paper-raised)] text-[var(--ink)] border-2 border-[var(--ink)] shadow-nb-ink-3 hover:-translate-y-0.5 hover:bg-[var(--blue-mist)] active:translate-y-0",
    ghost: "text-[var(--ink)] hover:bg-[var(--blue-mist)]",
    coal: "bg-[var(--coal)] text-[var(--chalk)] border-2 border-[var(--coal)] hover:-translate-y-0.5 hover:opacity-95",
    white: "bg-white text-[var(--royal-deep)] border-2 border-white hover:-translate-y-0.5 hover:shadow-lg",
  };
  return (
    <button
      className={`inline-flex items-center justify-center gap-2 rounded-[10px_13px_11px 12px] font-semibold transition-all duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ink)] disabled:opacity-40 disabled:pointer-events-none ${sizes[size]} ${variants[variant]} ${className ?? ""}`}
      {...props}
    >
      {children}
    </button>
  );
}

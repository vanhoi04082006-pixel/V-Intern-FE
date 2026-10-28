"use client";

import { cn } from "@/lib/utils";

/** Logo V-Intern: lục giác spark + wordmark. */
export function LogoMark({ size = 32, className }: { size?: number; className?: string }) {
  return (
    <span
      className={cn("relative inline-grid shrink-0 place-items-center", className)}
      style={{ width: size, height: size }}
      aria-hidden
    >
      <svg viewBox="0 0 40 40" width={size} height={size}>
        <defs>
          <linearGradient id="vintern-logo-g" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#34D399" />
            <stop offset="100%" stopColor="#2DD4BF" />
          </linearGradient>
        </defs>
        <path
          d="M20 2.5 34.5 10.9v18.2L20 37.5 5.5 29.1V10.9L20 2.5Z"
          fill="url(#vintern-logo-g)"
          opacity="0.16"
        />
        <path
          d="M20 2.5 34.5 10.9v18.2L20 37.5 5.5 29.1V10.9L20 2.5Z"
          fill="none"
          stroke="url(#vintern-logo-g)"
          strokeWidth="2"
        />
        <path
          d="M13.5 14.5v7c0 2.8 2.2 5 5 5h8"
          fill="none"
          stroke="url(#vintern-logo-g)"
          strokeWidth="3.2"
          strokeLinecap="round"
        />
        <circle cx="26" cy="14.5" r="2.6" fill="#34D399" />
      </svg>
    </span>
  );
}

export function Logo({
  size = 30,
  showText = true,
  className,
  textClassName,
}: {
  size?: number;
  showText?: boolean;
  className?: string;
  textClassName?: string;
}) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <LogoMark size={size} />
      {showText ? (
        <span className={cn("text-lg font-bold tracking-tight text-ink", textClassName)}>
          V-<span className="text-gradient">Intern</span>
        </span>
      ) : null}
    </span>
  );
}

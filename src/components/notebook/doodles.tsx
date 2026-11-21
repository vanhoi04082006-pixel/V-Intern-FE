"use client";

import type { CSSProperties } from "react";

/* =====================================================================
 * DOODLES — nét vẽ tay trang trí "Sổ tay hành trình".
 * Toàn bộ là SVG thuần, currentColor, không phụ thuộc ảnh ngoài.
 *
 * PORT NOTE (v3 port from sandbox): `squiggle-draw` is namespaced as
 * `nb-squiggle-draw` because the real repo already defines `.squiggle-draw`
 * with a different (scroll-driven) rule; the sandbox's exact time-based
 * rule lives in src/styles/journey.css.
 * ===================================================================== */

export function SquiggleUnderline({ className = "", draw = true }: { className?: string; draw?: boolean }) {
  return (
    <svg
      viewBox="0 0 220 12"
      preserveAspectRatio="none"
      className={`${draw ? "nb-squiggle-draw" : ""} ${className}`}
      aria-hidden="true"
    >
      <path
        d="M3 8 C 16 3, 28 10, 42 6 S 70 2, 84 7 S 114 10, 128 5 S 158 2, 172 7 S 200 9, 217 4"
        fill="none"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function StarDoodle({ className = "", style }: { className?: string; style?: CSSProperties }) {
  return (
    <svg viewBox="0 0 32 32" className={className} style={style} aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 3.5 C 17.2 8.8, 18.6 13.8, 20.4 18.4 C 25 19.1, 29 20, 30.6 20.9 C 27.6 22.9, 24.2 25, 21 26.9 C 21.6 25, 21.9 23.4, 21.9 22.4" />
      <path d="M21 26.9 C 19.4 26.2, 17.6 25.8, 16 25.8 C 14.4 25.8, 12.6 26.2, 11 26.9" />
      <path d="M11 26.9 C 7.8 25, 4.4 22.9, 1.4 20.9 C 3 20, 7 19.1, 11.6 18.4 C 13.4 13.8, 14.8 8.8, 16 3.5" />
    </svg>
  );
}

export function SparkleDoodle({ className = "", style }: { className?: string; style?: CSSProperties }) {
  return (
    <svg viewBox="0 0 28 28" className={className} style={style} aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M14 2.5 C 14.6 8, 15.4 13.2, 16.5 17.5 C 20.8 18.6, 24 19.4, 25.5 20 C 23 21, 20 21.9, 16.9 22.6 C 15.7 25.4, 14.9 26.4, 14 26.4 C 13.1 26.4, 12.3 25.4, 11.1 22.6 C 8 21.9, 5 21, 2.5 20 C 4 19.4, 7.2 18.6, 11.5 17.5 C 12.6 13.2, 13.4 8, 14 2.5 Z" />
    </svg>
  );
}

export function HandArrowRight({ className = "", style }: { className?: string; style?: CSSProperties }) {
  return (
    <svg viewBox="0 0 72 36" className={className} style={style} aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 18 C 18 16, 36 16, 54 17.5" />
      <path d="M46 9 C 49 12, 52 14.6, 55 17.4 C 52 20, 49 22.8, 46.4 25.6" />
    </svg>
  );
}

export function HandArrowDown({ className = "", style }: { className?: string; style?: CSSProperties }) {
  return (
    <svg viewBox="0 0 36 72" className={className} style={style} aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 4 C 16 18, 16 36, 17.5 54" />
      <path d="M9 46 C 12 49, 14.6 52, 17.4 55 C 20 52, 22.8 49, 25.6 46.4" />
    </svg>
  );
}

export function CircleDoodle({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <span className={`relative inline-flex items-center justify-center ${className}`}>
      <svg viewBox="0 0 48 48" className="absolute inset-0 h-full w-full" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
        <path d="M24.6 4.1 C 34 3, 43.6 9.9, 43.9 21.4 C 44.2 33, 35.4 43.6, 23.4 43.9 C 12 44.2, 3.9 35.4, 4.1 24 C 4.3 14.6, 10.6 6.4, 19.4 4.6" />
      </svg>
      <span className="relative">{children}</span>
    </span>
  );
}

export function CoffeeStain({ className = "", style }: { className?: string; style?: CSSProperties }) {
  return (
    <svg viewBox="0 0 64 64" className={className} style={style} aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M13 18 C 8 24, 6.4 33, 10.4 40 C 15 48.4, 26 52, 34.9 48.4 C 44.4 44.6, 49.4 34.4, 46 25 C 42.6 15.6, 32.4 10.6, 23 13 C 19 14, 15.6 16, 13 18 Z" opacity="0.5" />
      <path d="M20.4 24 C 17.6 27.4, 16.6 32.4, 18.6 36.6" opacity="0.4" />
      <path d="M47 11 C 49 13, 50 15, 50 17.4" opacity="0.35" />
    </svg>
  );
}

export function PaperclipDoodle({ className = "", style }: { className?: string; style?: CSSProperties }) {
  return (
    <svg viewBox="0 0 32 56" className={className} style={style} aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
      <path d="M25 10 C 25 20, 25 34, 24.6 42 C 24.4 48, 20.6 51.4, 16 51.4 C 11.4 51.4, 7.6 48, 7.4 42 C 7.2 32, 7.2 18, 7.4 12 C 7.6 7.6, 10.6 4.6, 14.4 4.6 C 18 4.6, 21 7.4, 21 11.6 C 21 19, 21 31, 20.8 38" />
    </svg>
  );
}

export function PushPin({ className = "", style }: { className?: string; style?: CSSProperties }) {
  return (
    <svg viewBox="0 0 32 40" className={className} style={style} aria-hidden="true" fill="none" strokeWidth="2.2" strokeLinecap="round">
      <path d="M10 3.5 C 14 3.2, 18 3.2, 22 3.5 C 22.3 7.5, 22.3 11, 22.1 13.4 C 24.6 15.4, 26.2 18, 26.4 20.6 C 19.4 21, 12.6 21, 5.6 20.6 C 5.8 18, 7.4 15.4, 9.9 13.4 C 9.7 11, 9.7 7.5, 10 3.5 Z" fill="currentColor" fillOpacity="0.12" stroke="currentColor" />
      <path d="M16 21 C 15.8 27, 15.8 32.6, 16 37" stroke="currentColor" />
    </svg>
  );
}

export function InkSplat({ className = "", style }: { className?: string; style?: CSSProperties }) {
  return (
    <svg viewBox="0 0 48 48" className={className} style={style} aria-hidden="true" fill="currentColor" opacity="0.85">
      <path d="M23.2 8.4 C 25.6 8, 27.6 10, 27.2 12.4 C 27 14.4, 24.8 15.6, 22.8 15 C 20.8 14.4, 20 12, 21 10.2 C 21.4 9.4, 22.2 8.6, 23.2 8.4 Z" />
      <path d="M12.4 20.6 C 15.4 19.6, 18.6 22, 18.2 25.2 C 17.9 28, 15 29.8, 12.4 28.8 C 10 27.9, 9 24.8, 10.4 22.6 C 10.9 21.8, 11.6 20.9, 12.4 20.6 Z" />
      <path d="M30.6 30.4 C 33 29.6, 35.6 31.4, 35.4 34 C 35.2 36.4, 32.6 37.9, 30.4 37 C 28.2 36.1, 27.6 33, 29.2 31.4 C 29.6 31, 30.1 30.6, 30.6 30.4 Z" />
      <path d="M36.4 12.6 C 38.2 12.2, 39.8 13.8, 39.2 15.6 C 38.7 17.1, 36.7 17.6, 35.4 16.6 C 34.1 15.6, 34.7 13.5, 36.4 12.6 Z" />
      <path d="M9 36 C 10.4 35.7, 11.7 36.9, 11.2 38.4 C 10.8 39.6, 9.2 40, 8.2 39.1 C 7.2 38.2, 7.7 36.4, 9 36 Z" />
    </svg>
  );
}

export function RouteTrail({ className = "", style }: { className?: string; style?: CSSProperties }) {
  return (
    <svg viewBox="0 0 140 40" className={className} style={style} aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeDasharray="1 7">
      <path d="M4 30 C 24 30, 30 10, 52 10 C 74 10, 80 30, 102 30 C 120 30, 126 22, 136 16" />
    </svg>
  );
}

export function RibbonBookmark({ className = "", style }: { className?: string; style?: CSSProperties }) {
  return (
    <svg viewBox="0 0 28 44" className={className} style={style} aria-hidden="true" fill="currentColor" fillOpacity="0.9" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round">
      <path d="M4 3 C 10.6 2, 17.4 2, 24 3 C 24.4 17, 24.4 30, 24 41 C 18.6 38, 13 34.6, 9.4 31.4 C 6 34.8, 4.6 37.6, 4 39 C 3.6 27, 3.6 15, 4 3 Z" />
    </svg>
  );
}

export function CrossDoodle({ className = "", style }: { className?: string; style?: CSSProperties }) {
  return (
    <svg viewBox="0 0 28 28" className={className} style={style} aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
      <path d="M6.4 6 C 11.4 11, 16.4 16.4, 21 21.6" />
      <path d="M21.4 6 C 16.6 11.4, 11.4 16.6, 6 21.4" />
    </svg>
  );
}

export function CheckDoodle({ className = "", style }: { className?: string; style?: CSSProperties }) {
  return (
    <svg viewBox="0 0 28 28" className={className} style={style} aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4.6 14.6 C 8 18, 11 21.2, 13.6 24.4 C 17.4 17.4, 22 10.4, 24.4 6" />
    </svg>
  );
}

export function AsteriskDoodle({ className = "", style }: { className?: string; style?: CSSProperties }) {
  return (
    <svg viewBox="0 0 28 28" className={className} style={style} aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
      <path d="M14 3.5 C 13.8 10.6, 13.8 17.6, 14 24.5" />
      <path d="M4 9 C 10.6 12.6, 17.4 16.2, 24 19.4" />
      <path d="M24 9 C 17.6 12.6, 10.6 16.2, 4 19.4" />
    </svg>
  );
}

export function PaperPlaneDoodle({ className = "", style }: { className?: string; style?: CSSProperties }) {
  return (
    <svg viewBox="0 0 40 36" className={className} style={style} aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M37 3.5 C 25 8, 12.4 13.4, 3.6 17.4 C 6.8 19, 10.2 20.6, 13.4 22" />
      <path d="M37 3.5 C 31.4 13.4, 24.6 25, 19.4 32.6 C 17.4 29, 15.4 25.4, 13.4 22" />
      <path d="M37 3.5 C 29 9.6, 20.6 16, 13.4 22" />
    </svg>
  );
}

export function CompassDoodle({ className = "", style }: { className?: string; style?: CSSProperties }) {
  return (
    <svg viewBox="0 0 36 36" className={className} style={style} aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M18 3.4 C 26.4 3.2, 32.6 10, 32.6 18 C 32.6 26, 26.2 32.6, 18 32.4 C 10 32.2, 3.4 26.2, 3.6 18 C 3.7 10.4, 10.4 3.7, 18 3.4 Z" />
      <path d="M23.6 12.4 C 22 15.4, 20 18.6, 18.4 20.6 C 16.6 22.4, 13.9 24.2, 11.6 25.2 C 13 22.2, 14.8 19.4, 16.6 17.4 C 18.4 15.4, 21.2 13.5, 23.6 12.4 Z" />
    </svg>
  );
}

export function HeartDoodle({ className = "", style }: { className?: string; style?: CSSProperties }) {
  return (
    <svg viewBox="0 0 32 30" className={className} style={style} aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 26.5 C 11.4 22.6, 6.4 18.4, 4.4 13.6 C 2.6 9.4, 4.6 4.9, 8.6 3.9 C 11.6 3.2, 14.4 4.9, 16 7.6 C 17.6 4.9, 20.4 3.2, 23.4 3.9 C 27.4 4.9, 29.4 9.4, 27.6 13.6 C 25.6 18.4, 20.6 22.6, 16 26.5 Z" />
    </svg>
  );
}

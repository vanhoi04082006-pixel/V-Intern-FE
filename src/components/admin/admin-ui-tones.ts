/**
 * Tone map dùng chung cho các card của Admin Workspace.
 * Class phải static để Tailwind v4 scan được — KHÔNG ghép class động
 * kiểu `bg-${tone}-50` (vi phạm static discoverability).
 */
export const TONE_STYLES = {
  blue: {
    tile: "bg-blue-50",
    icon: "text-blue-600",
    bar: "bg-blue-500",
    name: "text-blue-600",
  },
  green: {
    tile: "bg-emerald-50",
    icon: "text-emerald-600",
    bar: "bg-emerald-500",
    name: "text-emerald-600",
  },
  purple: {
    tile: "bg-purple-50",
    icon: "text-purple-600",
    bar: "bg-purple-500",
    name: "text-purple-600",
  },
  violet: {
    tile: "bg-violet-50",
    icon: "text-violet-600",
    bar: "bg-violet-500",
    name: "text-violet-600",
  },
  amber: {
    tile: "bg-amber-50",
    icon: "text-amber-600",
    bar: "bg-amber-500",
    name: "text-amber-600",
  },
  red: {
    tile: "bg-red-50",
    icon: "text-red-600",
    bar: "bg-red-500",
    name: "text-red-600",
  },
} as const;

export type ToneKey = keyof typeof TONE_STYLES;

/**
 * Tone map dùng chung cho các card của Instructor Workspace.
 * Class phải static để Tailwind v4 scan được — KHÔNG ghép class động
 * kiểu `bg-${tone}-50` (vi phạm static discoverability).
 *
 * Bản địa của instructor — tách khỏi `admin-ui-tones` để hai workspace
 * không phụ thuộc chéo (tránh leakage role-specific giữa admin/instructor).
 */
export const INSTRUCTOR_TONES = {
  blue: {
    tile: "bg-blue-50",
    icon: "text-blue-600",
    bar: "bg-blue-500",
    soft: "bg-blue-50 text-blue-700",
  },
  sky: {
    tile: "bg-sky-50",
    icon: "text-sky-600",
    bar: "bg-sky-500",
    soft: "bg-sky-50 text-sky-700",
  },
  green: {
    tile: "bg-emerald-50",
    icon: "text-emerald-600",
    bar: "bg-emerald-500",
    soft: "bg-emerald-50 text-emerald-700",
  },
  violet: {
    tile: "bg-violet-50",
    icon: "text-violet-600",
    bar: "bg-violet-500",
    soft: "bg-violet-50 text-violet-700",
  },
  fuchsia: {
    tile: "bg-fuchsia-50",
    icon: "text-fuchsia-600",
    bar: "bg-fuchsia-500",
    soft: "bg-fuchsia-50 text-fuchsia-700",
  },
  amber: {
    tile: "bg-amber-50",
    icon: "text-amber-600",
    bar: "bg-amber-500",
    soft: "bg-amber-50 text-amber-700",
  },
  red: {
    tile: "bg-red-50",
    icon: "text-red-600",
    bar: "bg-red-500",
    soft: "bg-red-50 text-red-700",
  },
  slate: {
    tile: "bg-slate-100",
    icon: "text-slate-500",
    bar: "bg-slate-400",
    soft: "bg-slate-100 text-slate-600",
  },
} as const;

export type InstructorTone = keyof typeof INSTRUCTOR_TONES;

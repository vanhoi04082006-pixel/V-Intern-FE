/**
 * Tone map dùng chung cho các card của Intern Workspace.
 * Class phải static để Tailwind v4 scan được — KHÔNG ghép class động
 * kiểu `bg-${tone}-50` (vi phạm static discoverability).
 *
 * Bản địa của intern — tách khỏi `admin-ui-tones` / `instructor-ui-tones`
 * để các workspace không phụ thuộc chéo (tránh leakage role-specific).
 */
export const INTERN_TONES = {
  blue: {
    tile: "bg-accent",
    icon: "text-primary",
    bar: "bg-primary",
    soft: "bg-accent text-primary",
  },
  sky: {
    tile: "bg-accent",
    icon: "text-primary",
    bar: "bg-primary",
    soft: "bg-accent text-primary",
  },
  green: {
    tile: "bg-success-subtle",
    icon: "text-success",
    bar: "bg-success",
    soft: "bg-success-subtle text-success",
  },
  violet: {
    tile: "bg-accent",
    icon: "text-primary",
    bar: "bg-primary",
    soft: "bg-accent text-primary",
  },
  fuchsia: {
    tile: "bg-accent",
    icon: "text-primary",
    bar: "bg-primary",
    soft: "bg-accent text-primary",
  },
  amber: {
    tile: "bg-warning-subtle",
    icon: "text-warning",
    bar: "bg-warning",
    soft: "bg-warning-subtle text-warning",
  },
  red: {
    tile: "bg-destructive-subtle",
    icon: "text-destructive",
    bar: "bg-destructive",
    soft: "bg-destructive-subtle text-destructive",
  },
  slate: {
    tile: "bg-muted",
    icon: "text-muted-foreground",
    bar: "bg-muted",
    soft: "bg-muted text-muted-foreground",
  },
} as const;

export type InternTone = keyof typeof INTERN_TONES;

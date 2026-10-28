import { clsx, type ClassValue } from "clsx"
import { extendTailwindMerge } from "tailwind-merge"

// Custom text sizes must be registered as sizes, otherwise tailwind-merge
// treats text-body as a color and drops text-primary-foreground from buttons.
const twMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      "font-size": [{ text: ["display", "page", "section", "subsection", "body", "small", "caption", "label", "metric"] }],
    },
  },
})

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

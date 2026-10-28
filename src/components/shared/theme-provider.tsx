"use client";

import * as React from "react";
import { ThemeProvider as NextThemesProvider } from "next-themes";

/**
 * Wrapper next-themes — dùng trong layout.tsx:
 * attribute="class" defaultTheme="dark" enableSystem={false}.
 * Dark "Emerald Noir" là mặc định; class .dark cũng dùng được như scope
 * cục bộ cho khu vực cần "luôn tối" (mockup, brand panel, ảnh nền tối).
 */
export function ThemeProvider({
  children,
  ...props
}: React.ComponentProps<typeof NextThemesProvider>) {
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>;
}

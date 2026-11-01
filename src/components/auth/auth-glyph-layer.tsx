"use client";

import { useEffect, useState, type ReactNode } from "react";
import { GlyphBackground } from "@/components/animate-ui/backgrounds/glyph";
import { subscribeTheme } from "@/lib/theme";

/* v6 "Sổ tay hành trình" — nền auth là rừng nét chữ mờ trôi chậm trên tờ
   giấy ô ly: rê chuột thì nét chữ quanh con trỏ sáng lên như bút dạ quang,
   click xuống thì loang một vệt mực. Màu theo chủ đề:
   - giấy kem: nét mực nhạt, loang xanh #2060f0;
   - bảng đen: nét phấn nhạt, loang xanh sáng #7d97ff.
   Giảm chuyển động → nền tĩnh, không bắt tương tác. */

const LIGHT = { shape: "#17171c", glow: "#2060f0" } as const;
const DARK = { shape: "#f2f1e9", glow: "#7d97ff" } as const;

export function AuthGlyphLayer({ children }: { children: ReactNode }) {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    const sync = () =>
      setDark(document.documentElement.classList.contains("dark"));
    sync();
    return subscribeTheme(sync);
  }, []);

  return (
    <GlyphBackground
      className="app-surface auth-surface"
      fontSize={11}
      interactive
      shapeColor={dark ? DARK.shape : LIGHT.shape}
      glowColor={dark ? DARK.glow : LIGHT.glow}
    >
      {children}
    </GlyphBackground>
  );
}

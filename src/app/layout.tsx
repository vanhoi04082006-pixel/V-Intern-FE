import type { Metadata, Viewport } from "next";
import { Be_Vietnam_Pro, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { SonnerToaster } from "@/components/shared/sonner-toaster";

const beVietnam = Be_Vietnam_Pro({
  variable: "--font-be-vietnam",
  subsets: ["latin", "vietnamese"],
  weight: ["300", "400", "500", "600", "700", "800"],
  display: "swap",
});

const jetbrains = JetBrains_Mono({
  variable: "--font-jetbrains",
  subsets: ["latin", "vietnamese"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "V-Intern — Nền tảng thực tập ảo với AI",
  description:
    "Thực tập như đi làm thật: phỏng vấn AI, dự án Sprint thực tế, AI review code, KPI minh bạch, lương ảo và chứng chỉ xác thực.",
  keywords: ["thực tập ảo", "intern", "AI", "sprint", "code review", "chứng chỉ"],
  icons: { icon: "/logo.svg" },
};

export const viewport: Viewport = {
  themeColor: "#090C0B",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi" suppressHydrationWarning>
      <body
        className={`${beVietnam.variable} ${jetbrains.variable} font-sans bg-canvas text-ink antialiased`}
      >
        {children}
        <Toaster />
        <SonnerToaster />
      </body>
    </html>
  );
}

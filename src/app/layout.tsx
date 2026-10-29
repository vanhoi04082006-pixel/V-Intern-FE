import type { Metadata, Viewport } from "next";
import { Be_Vietnam_Pro, Patrick_Hand, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { ThemeProvider } from "@/components/landing/theme-provider";

const sans = Be_Vietnam_Pro({
  variable: "--font-sans",
  subsets: ["latin", "vietnamese"],
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
});

const hand = Patrick_Hand({
  variable: "--font-hand",
  subsets: ["latin", "vietnamese"],
  weight: "400",
  display: "swap",
});

const mono = Geist_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "V-Intern — Nền tảng thực tập ảo ứng dụng AI",
  description:
    "V-Intern mô phỏng môi trường làm việc thực tế, giúp sinh viên trải nghiệm quy trình phát triển phần mềm chuyên nghiệp: phỏng vấn AI, dự án thật, sprint, đánh giá và chứng nhận.",
  keywords: [
    "V-Intern",
    "thực tập ảo",
    "intern",
    "AI",
    "sinh viên",
    "giảng viên",
    "sprint",
    "chứng nhận",
  ],
  authors: [{ name: "V-Intern Team" }],
  openGraph: {
    title: "V-Intern — Kỹ năng thật. Dự án thật. Tương lai của bạn.",
    description:
      "Nền tảng thực tập ảo ứng dụng AI dành cho sinh viên và giảng viên.",
    siteName: "V-Intern",
    type: "website",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi" suppressHydrationWarning>
      <body
        className={`${sans.variable} ${hand.variable} ${mono.variable} antialiased bg-paper text-ink font-sans`}
      >
        <ThemeProvider>
          {children}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}

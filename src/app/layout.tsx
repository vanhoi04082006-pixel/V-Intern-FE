import type { Metadata } from "next";
import { Geist, Geist_Mono, Caveat } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const caveat = Caveat({
  variable: "--font-caveat",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

export const metadata: Metadata = {
  title: "V-Intern - Nền tảng thực tập ảo với AI",
  description:
    "V-Intern là nền tảng thực tập ảo ứng dụng AI, mô phỏng môi trường làm việc thực tế giúp sinh viên trải nghiệm quy trình phát triển phần mềm chuyên nghiệp, kết nối sinh viên - giảng viên - doanh nghiệp.",
  keywords: [
    "V-Intern",
    "thực tập ảo",
    "virtual internship",
    "AI",
    "sinh viên",
    "dự án thực tế",
    "AI Mentor",
  ],
  authors: [{ name: "V-Intern" }],
  openGraph: {
    title: "V-Intern - Nền tảng thực tập ảo với AI",
    description:
      "Kỹ năng thật. Dự án thật. Tương lai của bạn. - Nền tảng thực tập ảo thế hệ mới cho sinh viên CNTT.",
    siteName: "V-Intern",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "V-Intern - Nền tảng thực tập ảo với AI",
    description:
      "Kỹ năng thật. Dự án thật. Tương lai của bạn. - Nền tảng thực tập ảo thế hệ mới cho sinh viên CNTT.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi" data-scroll-behavior="smooth" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${caveat.variable} antialiased bg-background text-foreground`}
      >
        {children}
      </body>
    </html>
  );
}

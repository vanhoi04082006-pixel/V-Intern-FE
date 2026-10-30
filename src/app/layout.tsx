import type { Metadata, Viewport } from "next";
import { Be_Vietnam_Pro, JetBrains_Mono } from "next/font/google";
import localFont from "next/font/local";
import { THEME_BOOTSTRAP } from "@/lib/theme";
import "./globals.css";

const geistMono = localFont({
  src: "./fonts/geistmono.ttf",
  variable: "--font-geist-mono",
  weight: "100 900",
  display: "swap",
  preload: false,
});

/* Journey Notebook typography: Be Vietnam Pro for reading, Patrick Hand for
   handwritten notes, Geist Mono for labels. Workspace keeps Be Vietnam Pro. */
const beVietnam = Be_Vietnam_Pro({
  variable: "--font-be-vietnam",
  subsets: ["latin", "vietnamese"],
  weight: ["300", "400", "500", "600", "700", "800"],
  display: "swap",
});

const patrickHand = localFont({
  src: "./fonts/patrick-hand-regular.ttf",
  variable: "--font-patrick-hand",
  weight: "400",
  display: "swap",
});

const jetbrains = JetBrains_Mono({
  variable: "--font-jetbrains",
  subsets: ["latin", "vietnamese"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
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
    images: [
      {
        url: "/images/og-notebook.png",
        width: 1200,
        height: 630,
        alt: "Trang sổ tay V-Intern: nền giấy ô ly kem với các nét vẽ tay mực xanh — mũi tên cong, ngôi sao, nét lượn và hai mẩu băng dính dán xéo.",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "V-Intern - Nền tảng thực tập ảo với AI",
    description:
      "Kỹ năng thật. Dự án thật. Tương lai của bạn. - Nền tảng thực tập ảo thế hệ mới cho sinh viên CNTT.",
    images: ["/images/og-notebook.png"],
  },
};

/* Journey Notebook theme color: giấy kem sáng / bảng đen tối (Next 16 dùng
   viewport export cho themeColor — metadata.themeColor đã bị deprecate). */
export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fbfaf4" },
    { media: "(prefers-color-scheme: dark)", color: "#131318" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi" data-scroll-behavior="smooth" suppressHydrationWarning className={`${geistMono.variable} ${beVietnam.variable} ${patrickHand.variable} ${jetbrains.variable}`}>
      <head>
        {/* Apply the stored theme before first paint — no flash of the wrong palette. */}
        <script dangerouslySetInnerHTML={{ __html: THEME_BOOTSTRAP }} />
      </head>
      <body className="antialiased bg-background text-foreground">
        {children}
      </body>
    </html>
  );
}

import type { Metadata, Viewport } from "next";
import { Noto_Sans_KR } from "next/font/google";
import "./globals.css";

const notoSansKR = Noto_Sans_KR({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "벚꽃구경 — 전국 벚꽃 지도",
  description:
    "전국 벚나무 위치와 벚꽃길을 한눈에! 산림청 데이터 기반 벚꽃 명소 지도 서비스",
  openGraph: {
    title: "벚꽃구경 — 전국 벚꽃 지도",
    description: "전국 벚나무 위치와 벚꽃길을 한눈에!",
    type: "website",
    locale: "ko_KR",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#FFB7C5",
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className={`h-full antialiased ${notoSansKR.className}`}>
      <body className="h-full flex flex-col bg-background text-foreground">
        {children}
      </body>
    </html>
  );
}

import type { Metadata, Viewport } from "next";
import Script from "next/script";
import "./globals.css";

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
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className="h-full antialiased">
      <body className="h-full flex flex-col bg-background text-foreground">
        {children}
        <Script
          src="https://t1.kakaocdn.net/kakao_js_sdk/2.7.4/kakao.min.js"
          integrity="sha384-DKYJZ8NLiK8MN4/C5P2ezmFnkrGRe4mBBPWjSvZ96rFVtPcSiVSfpWi/gMOPZlN"
          crossOrigin="anonymous"
          strategy="afterInteractive"
        />
      </body>
    </html>
  );
}

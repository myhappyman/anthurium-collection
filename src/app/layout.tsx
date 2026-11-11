import type { Metadata, Viewport } from "next";
import Link from "next/link";
import type { ReactNode } from "react";

import { ServiceWorkerRegistration } from "@/components/pwa/service-worker-registration";

import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "안스리움 컬렉션",
    template: "%s | 안스리움 컬렉션",
  },
  description: "안스리움 도감과 브리딩 계보를 기록하고 공유합니다.",
};

export const viewport: Viewport = {
  themeColor: "#163f33",
  colorScheme: "dark",
};

type RootLayoutProps = Readonly<{
  children: ReactNode;
}>;

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="ko">
      <head>
        <link href="https://fonts.googleapis.com" rel="preconnect" />
        <link
          crossOrigin="anonymous"
          href="https://fonts.gstatic.com"
          rel="preconnect"
        />
        {/* eslint-disable-next-line @next/next/no-page-custom-font -- app router root layout: the link serves every page */}
        <link
          href="https://fonts.googleapis.com/css2?family=Prata&family=Manrope:wght@400;500;700&family=Noto+Serif+KR&family=Noto+Sans+KR:wght@400;500;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <header className="site-header">
          <div className="container site-header-row">
            <Link aria-label="홈으로" className="brand" href="/">
              Anthurium Archive
            </Link>
            <nav aria-label="주요 메뉴">
              <Link href="/catalog">도감</Link>
              <Link href="/lineage">계보</Link>
              <Link href="/specimens">보유 개체</Link>
              <Link href="/dashboard">관리</Link>
            </nav>
          </div>
        </header>
        <main id="main">{children}</main>
        <footer className="site-footer">
          <div className="container site-footer-row">
            <p className="site-footer-mark">Anthurium Archive</p>
            <p className="site-footer-close">
              안스리움 도감
              <br />
              컬렉션
              <br />
              브리딩 기록
            </p>
          </div>
        </footer>
        <ServiceWorkerRegistration />
      </body>
    </html>
  );
}

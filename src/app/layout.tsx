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
  themeColor: "#102a22",
  colorScheme: "light",
};

type RootLayoutProps = Readonly<{
  children: ReactNode;
}>;

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="ko">
      <body>
        <header className="site-header">
          <Link className="brand" href="/">
            Anthurium Archive
          </Link>
          <nav aria-label="주요 메뉴">
            <Link href="/catalog">도감</Link>
            <Link href="/lineage">계보</Link>
            <Link href="/specimens">보유 개체</Link>
            <Link href="/dashboard">관리</Link>
          </nav>
        </header>
        <main>{children}</main>
        <footer className="site-footer">
          <p>안스리움 도감 · 컬렉션 · 브리딩 기록</p>
        </footer>
        <ServiceWorkerRegistration />
      </body>
    </html>
  );
}

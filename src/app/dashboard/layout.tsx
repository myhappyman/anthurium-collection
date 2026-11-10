import Link from "next/link";
import type { ReactNode } from "react";

import { getCurrentUser } from "@/features/auth/auth.queries";
import { getSupabaseConfig } from "@/lib/supabase/config";

type DashboardLayoutProps = {
  children: ReactNode;
};

export default async function DashboardLayout({
  children,
}: DashboardLayoutProps) {
  const isConfigured = getSupabaseConfig() !== null;
  const user = isConfigured ? await getCurrentUser() : null;

  return (
    <div className="dashboard-shell">
      <aside className="dashboard-sidebar">
        <div>
          <p className="eyebrow">COLLECTION DESK</p>
          <strong>브리딩 기록</strong>
        </div>
        <nav aria-label="컬렉션 관리">
          <Link href="/dashboard">요약</Link>
          <Link href="/dashboard/genotypes">유전 개체</Link>
          <Link href="/dashboard/specimens">화분</Link>
          <Link href="/dashboard/propagations">줄기 절단·증식</Link>
          <Link href="/dashboard/crosses">교배</Link>
          <Link href="/dashboard/observations">관찰</Link>
          <Link href="/dashboard/media">사진·증빙</Link>
          <Link href="/dashboard/transactions">거래</Link>
          <Link href="/dashboard/settings">공개 설정</Link>
        </nav>
        <p className="dashboard-account">
          {user?.email ?? (isConfigured ? "인증 확인 중" : "클라우드 미연결")}
        </p>
      </aside>
      <div className="dashboard-content">{children}</div>
    </div>
  );
}

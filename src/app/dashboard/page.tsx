import Link from "next/link";

import { getSupabaseConfig } from "@/lib/supabase/config";

export default function DashboardPage() {
  const isConfigured = getSupabaseConfig() !== null;

  return (
    <section className="dashboard-page">
      <div className="dashboard-heading">
        <p className="eyebrow">PRIVATE DASHBOARD</p>
        <h1>컬렉션 관리</h1>
        <p>유전 개체와 실제 화분을 분리해 기록합니다.</p>
      </div>
      {!isConfigured ? (
        <div className="setup-notice">
          <strong>로컬 애플리케이션 기반이 준비됐습니다.</strong>
          <p>
            Supabase 프로젝트를 연결하면 휴대폰과 PC에서 같은 데이터를 사용할 수
            있습니다. 연결 전에도 화면과 스키마 구현을 계속 검증할 수 있습니다.
          </p>
        </div>
      ) : null}
      <div className="dashboard-actions">
        <Link className="dashboard-action-card" href="/dashboard/genotypes/new">
          <span>01</span>
          <strong>유전 개체 등록</strong>
          <p>실생, 이름 있는 클론, 외부 모주를 기록합니다.</p>
        </Link>
        <Link className="dashboard-action-card" href="/dashboard/specimens/new">
          <span>02</span>
          <strong>화분 등록</strong>
          <p>현재 보유 중인 물리적 식물을 유전 개체에 연결합니다.</p>
        </Link>
        <Link
          className="dashboard-action-card"
          href="/dashboard/propagations/new"
        >
          <span>03</span>
          <strong>줄기 절단 기록</strong>
          <p>같은 유전형 아래 새로운 복제 화분을 만듭니다.</p>
        </Link>
      </div>
    </section>
  );
}

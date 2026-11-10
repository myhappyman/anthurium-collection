import Link from "next/link";

import { SeedlingForm } from "@/features/crosses/components/seedling-form";
import { getOwnedCrosses } from "@/features/crosses/cross.queries";

export default async function NewSeedlingPage() {
  const crosses = await getOwnedCrosses();

  return (
    <section className="dashboard-page narrow">
      <Link className="back-link" href="/dashboard/crosses">
        ← 교배 목록
      </Link>
      <div className="dashboard-heading">
        <p className="eyebrow">NEW PROGENY</p>
        <h1>자손 등록</h1>
        <p>새 유전 개체와 첫 실생 화분이 함께 생성됩니다.</p>
      </div>
      {crosses.length === 0 ? (
        <div className="record-empty">
          <strong>연결할 교배가 없습니다.</strong>
          <Link className="button primary" href="/dashboard/crosses/new">
            교배 먼저 등록
          </Link>
        </div>
      ) : (
        <SeedlingForm crosses={crosses} />
      )}
    </section>
  );
}

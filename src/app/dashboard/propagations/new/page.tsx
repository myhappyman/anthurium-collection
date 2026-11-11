import Link from "next/link";

import { PropagationForm } from "@/features/specimens/components/propagation-form";
import { getActiveSpecimens } from "@/features/specimens/specimen.queries";

export default async function NewPropagationPage() {
  const specimens = await getActiveSpecimens();

  return (
    <section className="dashboard-page narrow">
      <Link className="back-link" href="/dashboard/propagations">
        ← 증식 기록
      </Link>
      <div className="dashboard-heading">
        <h1>복제 화분 생성</h1>
        <p>줄기 절단은 새로운 유전 개체가 아니라 새로운 화분을 만듭니다.</p>
      </div>
      {specimens.length === 0 ? (
        <div className="record-empty">
          <strong>증식할 활성 화분이 없습니다.</strong>
          <Link className="button primary" href="/dashboard/specimens/new">
            화분 먼저 등록
          </Link>
        </div>
      ) : (
        <PropagationForm specimens={specimens} />
      )}
    </section>
  );
}

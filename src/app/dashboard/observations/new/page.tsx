import Link from "next/link";

import { ObservationForm } from "@/features/observations/components/observation-form";
import { getActiveSpecimens } from "@/features/specimens/specimen.queries";

export default async function NewObservationPage() {
  const specimens = await getActiveSpecimens();

  return (
    <section className="dashboard-page narrow">
      <Link className="back-link" href="/dashboard/observations">
        ← 관찰 목록
      </Link>
      <div className="dashboard-heading">
        <p className="eyebrow">NEW OBSERVATION</p>
        <h1>성장 관찰</h1>
      </div>
      {specimens.length === 0 ? (
        <div className="record-empty">
          <strong>관찰할 활성 화분이 없습니다.</strong>
        </div>
      ) : (
        <ObservationForm specimens={specimens} />
      )}
    </section>
  );
}

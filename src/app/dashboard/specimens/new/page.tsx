import Link from "next/link";

import { getOwnedGenotypes } from "@/features/genotypes/genotype.queries";
import { SpecimenForm } from "@/features/specimens/components/specimen-form";

export default async function NewSpecimenPage() {
  const genotypes = await getOwnedGenotypes();

  return (
    <section className="dashboard-page narrow">
      <Link className="back-link" href="/dashboard/specimens">
        ← 화분 목록
      </Link>
      <div className="dashboard-heading">
        <h1>화분 등록</h1>
      </div>
      {genotypes.length === 0 ? (
        <div className="record-empty">
          <strong>연결할 유전 개체가 없습니다.</strong>
          <Link className="button primary" href="/dashboard/genotypes/new">
            유전 개체 먼저 등록
          </Link>
        </div>
      ) : (
        <SpecimenForm genotypes={genotypes} />
      )}
    </section>
  );
}

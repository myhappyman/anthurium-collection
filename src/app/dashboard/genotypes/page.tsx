import Link from "next/link";

import { getOwnedGenotypes } from "@/features/genotypes/genotype.queries";

export default async function GenotypesPage() {
  const genotypes = await getOwnedGenotypes();

  return (
    <section className="dashboard-page">
      <div className="dashboard-heading with-action">
        <div>
          <h1>유전 개체</h1>
          <p>실생 형제는 각각 등록하고, 복제 화분은 같은 개체에 연결합니다.</p>
        </div>
        <Link className="button primary" href="/dashboard/genotypes/new">
          새 개체
        </Link>
      </div>
      {genotypes.length === 0 ? (
        <div className="record-empty">
          <strong>등록된 유전 개체가 없습니다.</strong>
          <p>RVDP S1처럼 실제로 보유한 유전 개체부터 등록해보세요.</p>
        </div>
      ) : (
        <div className="record-list">
          {genotypes.map((genotype) => (
            <article key={genotype.id}>
              <div>
                <span>{genotype.code}</span>
                <h2>
                  <Link href={`/dashboard/genotypes/${genotype.id}`}>
                    {genotype.display_name}
                  </Link>
                </h2>
              </div>
              <div className="record-meta">
                <span>{genotype.kind}</span>
                <span>출처 {genotype.provenance_grade}</span>
                <span>{genotype.visibility}</span>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

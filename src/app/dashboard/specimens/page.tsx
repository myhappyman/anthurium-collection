import Link from "next/link";

import { getOwnedSpecimens } from "@/features/specimens/specimen.queries";

export default async function SpecimensPage() {
  const specimens = await getOwnedSpecimens();

  return (
    <section className="dashboard-page">
      <div className="dashboard-heading with-action">
        <div>
          <h1>화분</h1>
          <p>실제로 존재하는 식물 단위입니다.</p>
        </div>
        <div className="heading-actions">
          <Link className="button secondary" href="/dashboard/specimens/labels">
            라벨 인쇄
          </Link>
          <Link className="button primary" href="/dashboard/specimens/new">
            새 화분
          </Link>
        </div>
      </div>
      {specimens.length === 0 ? (
        <div className="record-empty">
          <strong>등록된 화분이 없습니다.</strong>
          <p>먼저 유전 개체를 만들고 실제 보유 화분을 연결하세요.</p>
        </div>
      ) : (
        <div className="record-list">
          {specimens.map((specimen) => (
            <article key={specimen.id}>
              <div>
                <span>{specimen.code}</span>
                <h2>
                  <Link href={`/dashboard/specimens/${specimen.id}`}>
                    {specimen.status}
                  </Link>
                </h2>
              </div>
              <div className="record-meta">
                <span>{specimen.propagation_method}</span>
                <span>{specimen.visibility}</span>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

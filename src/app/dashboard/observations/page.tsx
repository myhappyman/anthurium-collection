import Link from "next/link";

import { getOwnedObservations } from "@/features/observations/observation.queries";

export default async function ObservationsPage() {
  const observations = await getOwnedObservations();

  return (
    <section className="dashboard-page">
      <div className="dashboard-heading with-action">
        <div>
          <p className="eyebrow">OBSERVATIONS</p>
          <h1>관찰</h1>
          <p>값을 덮어쓰지 않고 날짜별 성장 추세를 누적합니다.</p>
        </div>
        <Link className="button primary" href="/dashboard/observations/new">
          새 관찰
        </Link>
      </div>
      {observations.length === 0 ? (
        <div className="record-empty">
          <strong>관찰 기록이 없습니다.</strong>
        </div>
      ) : (
        <div className="record-list">
          {observations.map((observation) => (
            <article key={observation.id}>
              <div>
                <span>{observation.observed_at}</span>
                <h2>잎 #{observation.leaf_sequence ?? "—"}</h2>
              </div>
              <div className="record-meta">
                <span>
                  {observation.leaf_length_mm ?? "—"} ×{" "}
                  {observation.leaf_width_mm ?? "—"}mm
                </span>
                <span>활력 {observation.vigor ?? "—"}</span>
                <span>{observation.visibility}</span>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

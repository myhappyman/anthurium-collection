import Link from "next/link";

import {
  getOwnedPropagationEvents,
  getOwnedSpecimens,
} from "@/features/specimens/specimen.queries";

export default async function PropagationsPage() {
  const [events, specimens] = await Promise.all([
    getOwnedPropagationEvents(),
    getOwnedSpecimens(),
  ]);
  const specimenCodes = new Map(
    specimens.map((specimen) => [specimen.id, specimen.code]),
  );

  return (
    <section className="dashboard-page">
      <div className="dashboard-heading with-action">
        <div>
          <p className="eyebrow">PROPAGATIONS</p>
          <h1>줄기 절단·증식</h1>
          <p>복제 화분은 원본과 동일한 유전 개체 아래 연결됩니다.</p>
        </div>
        <Link className="button primary" href="/dashboard/propagations/new">
          증식 기록
        </Link>
      </div>
      {events.length === 0 ? (
        <div className="record-empty">
          <strong>증식 이력이 없습니다.</strong>
          <p>원본 화분에서 만든 복제 화분의 관계를 기록해보세요.</p>
        </div>
      ) : (
        <div className="record-list">
          {events.map((event) => (
            <article key={event.id}>
              <div>
                <span>{event.propagated_at}</span>
                <h2>
                  <Link
                    href={`/dashboard/specimens/${event.source_specimen_id}`}
                  >
                    {specimenCodes.get(event.source_specimen_id) ?? "원본"}
                  </Link>
                  {" → "}
                  <Link
                    href={`/dashboard/specimens/${event.target_specimen_id}`}
                  >
                    {specimenCodes.get(event.target_specimen_id) ?? "복제본"}
                  </Link>
                </h2>
                {event.notes ? <p>{event.notes}</p> : null}
              </div>
              <div className="record-meta">
                <span>{event.method}</span>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

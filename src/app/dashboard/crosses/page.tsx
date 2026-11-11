import Link from "next/link";

import { getOwnedCrosses } from "@/features/crosses/cross.queries";

export default async function CrossesPage() {
  const crosses = await getOwnedCrosses();

  return (
    <section className="dashboard-page">
      <div className="dashboard-heading with-action">
        <div>
          <h1>교배</h1>
          <p>Self를 포함한 수분·결실·발아와 자손을 추적합니다.</p>
        </div>
        <div className="heading-actions">
          <Link className="button secondary" href="/dashboard/crosses/seedling">
            자손 등록
          </Link>
          <Link className="button primary" href="/dashboard/crosses/new">
            새 교배
          </Link>
        </div>
      </div>
      {crosses.length === 0 ? (
        <div className="record-empty">
          <strong>교배 기록이 없습니다.</strong>
          <p>외부에서 구입한 S1도 출처용 교배 기록으로 만들 수 있습니다.</p>
        </div>
      ) : (
        <div className="record-list">
          {crosses.map((cross) => (
            <article key={cross.id}>
              <div>
                <span>{cross.code}</span>
                <h2>
                  <Link href={`/dashboard/crosses/${cross.id}`}>
                    {cross.seed_parent_genotype_id ===
                      cross.pollen_parent_genotype_id &&
                    cross.seed_parent_genotype_id !== null
                      ? "Self"
                      : "Cross"}
                  </Link>
                </h2>
              </div>
              <div className="record-meta">
                <span>{cross.status}</span>
                <span>발아 {cross.germinated_count ?? 0}</span>
                <span>{cross.visibility}</span>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

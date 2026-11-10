import Link from "next/link";

import { MediaForm } from "@/features/media/components/media-form";
import { getOwnedSpecimens } from "@/features/specimens/specimen.queries";

export default async function NewMediaPage() {
  const specimens = await getOwnedSpecimens();

  return (
    <section className="dashboard-page narrow">
      <Link className="back-link" href="/dashboard/media">
        ← 사진·증빙 목록
      </Link>
      <div className="dashboard-heading">
        <p className="eyebrow">UPLOAD MEDIA</p>
        <h1>파일 업로드</h1>
      </div>
      {specimens.length === 0 ? (
        <div className="record-empty">
          <strong>파일과 연결할 화분이 없습니다.</strong>
        </div>
      ) : (
        <MediaForm specimens={specimens} />
      )}
    </section>
  );
}

import Link from "next/link";

import { getOwnedMedia } from "@/features/media/media.queries";

export default async function MediaPage() {
  const mediaItems = await getOwnedMedia();

  return (
    <section className="dashboard-page">
      <div className="dashboard-heading with-action">
        <div>
          <h1>사진·증빙</h1>
          <p>공개 사진과 출처·거래 증빙을 서로 다른 버킷에 보관합니다.</p>
        </div>
        <Link className="button primary" href="/dashboard/media/new">
          파일 업로드
        </Link>
      </div>
      {mediaItems.length === 0 ? (
        <div className="record-empty">
          <strong>등록된 사진이나 증빙이 없습니다.</strong>
        </div>
      ) : (
        <div className="record-list">
          {mediaItems.map((mediaItem) => (
            <article key={mediaItem.id}>
              <div>
                <span>{mediaItem.captured_at ?? mediaItem.created_at.slice(0, 10)}</span>
                <h2>{mediaItem.kind}</h2>
              </div>
              <div className="record-meta">
                <span>{mediaItem.bucket_id}</span>
                <span>{mediaItem.visibility}</span>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

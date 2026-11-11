import Link from "next/link";

import { QrCode } from "@/components/qr-code";
import { getOwnedProfile } from "@/features/profiles/profile.queries";
import { getOwnedSpecimens } from "@/features/specimens/specimen.queries";
import { getSiteOrigin } from "@/lib/site-url";

export default async function SpecimenLabelsPage() {
  const [profile, specimens] = await Promise.all([
    getOwnedProfile(),
    getOwnedSpecimens(),
  ]);
  const siteOrigin = getSiteOrigin();

  return (
    <section className="dashboard-page">
      <div className="dashboard-heading with-action print-hidden">
        <div>
          <h1>화분 라벨</h1>
          <p>
            공개 화분은 고유 주소를 담은 QR과 함께 인쇄됩니다. QR은 외부
            서비스로 주소를 전송하지 않고 서버에서 직접 생성합니다.
          </p>
        </div>
        <Link className="button secondary" href="/dashboard/specimens">
          화분 목록
        </Link>
      </div>
      <div className="label-grid">
        {specimens.map((specimen) => {
          const publicUrl =
            profile?.is_public && siteOrigin
            ? `${siteOrigin}/collection/${profile.handle}/specimens/${specimen.code}`
            : null;

          return (
            <article className="plant-label" key={specimen.id}>
              <p className="plant-label-brand">ANTHURIUM ARCHIVE</p>
              <strong>{specimen.code}</strong>
              <span>{specimen.propagation_method}</span>
              {publicUrl ? (
                <>
                  <QrCode
                    label={`${specimen.code} 공개 기록 QR`}
                    size={104}
                    value={publicUrl}
                  />
                  <small>{publicUrl}</small>
                </>
              ) : (
                <small>
                  {profile?.is_public
                    ? "NEXT_PUBLIC_SITE_URL 설정 필요"
                    : "private collection"}
                </small>
              )}
            </article>
          );
        })}
      </div>
    </section>
  );
}

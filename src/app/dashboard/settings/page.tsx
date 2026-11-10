import Link from "next/link";

import { RestoreBackupForm } from "@/features/backups/components/restore-backup-form";
import { signOutAction } from "@/features/profiles/profile.actions";
import { getOwnedProfile } from "@/features/profiles/profile.queries";
import { ProfileForm } from "@/features/profiles/components/profile-form";

export default async function SettingsPage() {
  const profile = await getOwnedProfile();

  return (
    <section className="dashboard-page narrow">
      <div className="dashboard-heading">
        <p className="eyebrow">PUBLIC PROFILE</p>
        <h1>공개 설정</h1>
        <p>다른 사람이 방문할 컬렉션 주소와 표시 정보를 설정합니다.</p>
      </div>
      <ProfileForm profile={profile} />
      {profile?.is_public ? (
        <p className="public-preview-link">
          공개 주소:{" "}
          <Link href={`/collection/${profile.handle}`}>
            /collection/{profile.handle}
          </Link>
        </p>
      ) : null}
      <div className="backup-panel">
        <strong>데이터 백업</strong>
        <p>
          거래와 활동 이력을 포함한 복구용 JSON을 내려받습니다. 사진 파일은
          포함하지 않고 스토리지 경로만 기록합니다.
        </p>
        <a className="button secondary" download href="/api/export">
          전체 데이터 내보내기
        </a>
        <details className="csv-export-panel">
          <summary>스프레드시트용 CSV 내려받기</summary>
          <div className="relation-links">
            {[
              ["genotypes", "유전 개체"],
              ["specimens", "화분"],
              ["crosses", "교배"],
              ["propagation_events", "증식"],
              ["observations", "관찰"],
              ["activity_events", "활동"],
              ["media", "사진 메타데이터"],
              ["transactions", "거래"],
            ].map(([table, label]) => (
              <a
                download
                href={`/api/export/csv/${table}`}
                key={table}
              >
                {label}
              </a>
            ))}
          </div>
        </details>
      </div>
      <div className="backup-panel">
        <strong>데이터 복원</strong>
        <p>
          코드 충돌과 일부 복원을 방지하기 위해 핵심 기록이 없는 계정에서만
          실행되며, 실패하면 전체 작업이 롤백됩니다.
        </p>
        <RestoreBackupForm />
      </div>
      <form action={signOutAction} className="sign-out-form">
        <button className="button secondary" type="submit">
          로그아웃
        </button>
      </form>
    </section>
  );
}

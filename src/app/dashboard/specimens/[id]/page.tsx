import Link from "next/link";
import { notFound } from "next/navigation";

import {
  ActivityTimeline,
  type TimelineItem,
} from "@/features/activity/components/activity-timeline";
import { StatusChangeForm } from "@/features/specimens/components/status-change-form";
import { getOwnedSpecimenDetails } from "@/features/specimens/specimen.queries";

type SpecimenDetailPageProps = {
  params: Promise<{ id: string }>;
};

const EVENT_LABELS: Record<string, string> = {
  acquired: "취득",
  repotted: "분갈이",
  relocated: "위치 변경",
  flowered: "개화",
  propagated: "증식",
  listed: "판매 게시",
  sold: "판매 완료",
  transferred: "양도 완료",
  died: "폐사",
  lost: "분실",
  status_changed: "상태 변경",
};

const TRANSACTION_LABELS: Record<string, string> = {
  purchase: "구매",
  sale: "판매",
  gift_received: "증여받음",
  gift_sent: "증여",
  trade: "교환",
};

export default async function SpecimenDetailPage({
  params,
}: SpecimenDetailPageProps) {
  const { id } = await params;
  const details = await getOwnedSpecimenDetails(id);

  if (!details) {
    notFound();
  }

  const activityItems: TimelineItem[] = details.activityEvents.map((event) => ({
    id: event.id,
    occurredAt: event.occurred_at,
    label: EVENT_LABELS[event.kind] ?? event.kind,
    detail: event.notes,
    category: "activity",
  }));
  const observationItems: TimelineItem[] = details.observations.map(
    (observation) => ({
      id: observation.id,
      occurredAt: observation.observed_at,
      label:
        observation.leaf_sequence === null
          ? "생육 관찰"
          : `잎 #${observation.leaf_sequence} 관찰`,
      detail: observation.notes,
      category: "observation",
    }),
  );
  const propagationItems: TimelineItem[] = details.propagationEvents.map(
    (event) => ({
      id: event.id,
      occurredAt: event.propagated_at,
      label:
        event.source_specimen_id === details.specimen.id
          ? `${event.method}로 복제 화분 생성`
          : `${event.method}로 생성됨`,
      detail: event.notes,
      category: "propagation",
    }),
  );
  const transactionItems: TimelineItem[] = details.transactions.map(
    (transaction) => ({
      id: transaction.id,
      occurredAt: transaction.transacted_at,
      label: TRANSACTION_LABELS[transaction.kind] ?? transaction.kind,
      detail: [
        transaction.counterparty,
        transaction.amount === null
          ? null
          : `${transaction.amount.toLocaleString("ko-KR")} ${transaction.currency ?? ""}`.trim(),
        transaction.notes,
      ]
        .filter((value): value is string => Boolean(value))
        .join(" · "),
      category: "transaction",
    }),
  );
  const timelineItems = [
    ...activityItems,
    ...observationItems,
    ...propagationItems,
    ...transactionItems,
  ].sort(
    (first, second) =>
      new Date(second.occurredAt).getTime() -
      new Date(first.occurredAt).getTime(),
  );
  const today = new Date().toISOString().slice(0, 10);

  return (
    <section className="dashboard-page">
      <Link className="back-link" href="/dashboard/specimens">
        ← 화분 목록
      </Link>
      <div className="dashboard-heading with-action">
        <div>
          <h1>{details.genotype?.display_name ?? "연결 유전 개체"}</h1>
          <p className="record-code">{details.specimen.code}</p>
          <p>
            {details.genotype?.code ?? details.specimen.genotype_id} ·{" "}
            {details.specimen.propagation_method}
          </p>
        </div>
        <div className="record-meta">
          <span>{details.specimen.status}</span>
          <span>{details.specimen.visibility}</span>
          <span>사진 {details.media.length}</span>
        </div>
      </div>

      <div className="detail-grid">
        <section>
          <h2>전체 활동 이력</h2>
          <ActivityTimeline items={timelineItems} />
        </section>
        <aside>
          <h2>상태 변경</h2>
          <StatusChangeForm
            currentStatus={details.specimen.status}
            specimenId={details.specimen.id}
            today={today}
          />
        </aside>
      </div>
    </section>
  );
}

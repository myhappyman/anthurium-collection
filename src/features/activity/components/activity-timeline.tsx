export type TimelineItem = {
  id: string;
  occurredAt: string;
  label: string;
  detail?: string | null;
  category: "activity" | "observation" | "propagation" | "transaction";
};

type ActivityTimelineProps = {
  items: readonly TimelineItem[];
};

const CATEGORY_LABELS: Record<TimelineItem["category"], string> = {
  activity: "상태",
  observation: "관찰",
  propagation: "증식",
  transaction: "거래",
};

const DATE_FORMATTER = new Intl.DateTimeFormat("ko-KR", {
  dateStyle: "medium",
});

export function ActivityTimeline({ items }: ActivityTimelineProps) {
  if (items.length === 0) {
    return (
      <div className="record-empty">
        <strong>아직 기록이 없습니다.</strong>
        <p>상태 변경, 관찰, 증식, 거래 이력이 시간순으로 표시됩니다.</p>
      </div>
    );
  }

  return (
    <ol className="activity-timeline">
      {items.map((item) => (
        <li key={`${item.category}-${item.id}`}>
          <time dateTime={item.occurredAt}>
            {DATE_FORMATTER.format(new Date(item.occurredAt))}
          </time>
          <div>
            <span>{CATEGORY_LABELS[item.category]}</span>
            <strong>{item.label}</strong>
            {item.detail ? <p>{item.detail}</p> : null}
          </div>
        </li>
      ))}
    </ol>
  );
}

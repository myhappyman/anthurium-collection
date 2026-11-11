import Link from "next/link";

import { getOwnedSpecimens } from "@/features/specimens/specimen.queries";
import { TransactionForm } from "@/features/transactions/components/transaction-form";

export default async function NewTransactionPage() {
  const specimens = await getOwnedSpecimens();

  return (
    <section className="dashboard-page narrow">
      <Link className="back-link" href="/dashboard/transactions">
        ← 거래 목록
      </Link>
      <div className="dashboard-heading">
        <h1>거래 기록</h1>
      </div>
      {specimens.length === 0 ? (
        <div className="record-empty">
          <strong>거래와 연결할 화분이 없습니다.</strong>
        </div>
      ) : (
        <TransactionForm specimens={specimens} />
      )}
    </section>
  );
}

import Link from "next/link";

import { getOwnedTransactions } from "@/features/transactions/transaction.queries";

export default async function TransactionsPage() {
  const transactions = await getOwnedTransactions();

  return (
    <section className="dashboard-page">
      <div className="dashboard-heading with-action">
        <div>
          <p className="eyebrow">PRIVATE TRANSACTIONS</p>
          <h1>거래</h1>
          <p>가격·상대방·거래 메모는 공개 컬렉션에 노출되지 않습니다.</p>
        </div>
        <Link className="button primary" href="/dashboard/transactions/new">
          거래 기록
        </Link>
      </div>
      {transactions.length === 0 ? (
        <div className="record-empty">
          <strong>거래 기록이 없습니다.</strong>
        </div>
      ) : (
        <div className="record-list">
          {transactions.map((transaction) => (
            <article key={transaction.id}>
              <div>
                <span>{transaction.transacted_at}</span>
                <h2>{transaction.kind}</h2>
              </div>
              <div className="record-meta">
                <span>{transaction.counterparty ?? "상대 미기록"}</span>
                <span>
                  {transaction.amount ?? "—"} {transaction.currency ?? ""}
                </span>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

import Link from "next/link";

import { CrossForm } from "@/features/crosses/components/cross-form";
import { getOwnedGenotypes } from "@/features/genotypes/genotype.queries";

export default async function NewCrossPage() {
  const genotypes = await getOwnedGenotypes();

  return (
    <section className="dashboard-page narrow">
      <Link className="back-link" href="/dashboard/crosses">
        ← 교배 목록
      </Link>
      <div className="dashboard-heading">
        <p className="eyebrow">NEW CROSS</p>
        <h1>교배 등록</h1>
      </div>
      <CrossForm genotypes={genotypes} />
    </section>
  );
}

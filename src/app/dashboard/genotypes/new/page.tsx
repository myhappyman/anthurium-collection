import Link from "next/link";

import { GenotypeForm } from "@/features/genotypes/components/genotype-form";

export default function NewGenotypePage() {
  return (
    <section className="dashboard-page narrow">
      <Link className="back-link" href="/dashboard/genotypes">
        ← 유전 개체 목록
      </Link>
      <div className="dashboard-heading">
        <p className="eyebrow">NEW GENOTYPE</p>
        <h1>유전 개체 등록</h1>
      </div>
      <GenotypeForm />
    </section>
  );
}

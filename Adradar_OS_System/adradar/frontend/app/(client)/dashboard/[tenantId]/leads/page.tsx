"use client";

import { useParams, useSearchParams } from "next/navigation";
import { LeadTable } from "@/components/dashboard/LeadTable";

export default function LeadsPage() {
  const { tenantId } = useParams<{ tenantId: string }>();
  const searchParams = useSearchParams();
  const batchId = searchParams.get("batch_id") ?? undefined;

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Leads</h1>
        <p className="text-gray-500 text-sm mt-1">All leads with filters and export</p>
      </div>
      <LeadTable tenantId={tenantId} initialBatchId={batchId} />
    </div>
  );
}

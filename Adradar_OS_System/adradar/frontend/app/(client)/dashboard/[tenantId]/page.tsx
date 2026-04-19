"use client";

import { useParams } from "next/navigation";
import { useLeads } from "@/hooks/useLeads";
import { useBatches } from "@/hooks/useBatches";
import { PipelineMetrics } from "@/components/dashboard/PipelineMetrics";
import { OutreachFunnel } from "@/components/dashboard/OutreachFunnel";
import { NicheDistribution } from "@/components/dashboard/NicheDistribution";
import { BatchTimeline } from "@/components/dashboard/BatchTimeline";
import { ExportMenu } from "@/components/shared/ExportMenu";

export default function DashboardPage() {
  const { tenantId } = useParams<{ tenantId: string }>();

  const { data: leadsPage, isLoading: loadingLeads } = useLeads({
    tenant_id: tenantId,
    limit: 200,
  });

  const { data: batches, isLoading: loadingBatches } = useBatches({
    tenant_id: tenantId,
    batch_status: "published",
  });

  const leads = leadsPage?.items ?? [];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-500 text-sm mt-1">Lead intelligence overview</p>
        </div>
        <ExportMenu tenantId={tenantId} />
      </div>

      <div className="mb-6">
        <PipelineMetrics leadsPage={leadsPage} isLoading={loadingLeads} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="lg:col-span-2">
          <OutreachFunnel leads={leads} />
        </div>
        <div>
          <NicheDistribution leads={leads} />
        </div>
      </div>

      <div>
        {loadingBatches ? (
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="h-5 w-32 bg-gray-100 rounded animate-pulse mb-4" />
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-12 bg-gray-100 rounded mb-3 animate-pulse" />
            ))}
          </div>
        ) : (
          <BatchTimeline batches={batches ?? []} />
        )}
      </div>
    </div>
  );
}
